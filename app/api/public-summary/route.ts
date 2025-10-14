/**
 * Public Summary API
 * Creates and manages public case summaries with redaction capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { openAIClient } from '@/lib/ai/openai-client';
import bcrypt from 'bcryptjs';
import { generateSlug } from '@/lib/utils';

interface PublicSummaryData {
  title: string;
  introduction: string;
  timeline: PublicTimelineEvent[];
  keyEvidence: PublicEvidence[];
  conclusion?: string;
  lastUpdated: string;
}

interface PublicTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  supportingDocuments: string[];
  isRedacted: boolean;
}

interface PublicEvidence {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  isRedacted: boolean;
  redactionReason?: string;
}

// GET /api/public-summary - List organization's public summaries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const summaries = await prisma.publicSummary.findMany({
      where: { organizationId },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.publicSummary.count({
      where: { organizationId }
    });

    return NextResponse.json({
      success: true,
      data: summaries.map(summary => ({
        ...summary,
        content: undefined, // Don't expose full content in list view
        viewCount: summary.viewCount || 0,
        publicUrl: summary.isPublished 
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/public/${summary.slug}`
          : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching public summaries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/public-summary - Create new public summary
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      title,
      introduction,
      accessLevel = 'PASSWORD_PROTECTED',
      password,
      includeEvidence = true,
      includeTimeline = true,
      organizationId,
      createdById
    } = body;

    // Validate required fields
    if (!caseId || !title || !organizationId || !createdById) {
      return NextResponse.json(
        { success: false, error: 'caseId, title, organizationId, and createdById are required' },
        { status: 400 }
      );
    }

    // Validate case exists and belongs to organization
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        organizationId
      },
      include: {
        client: true,
        assignedAttorney: true,
        timelineEvents: {
          include: {
            documents: true
          },
          orderBy: { eventDate: 'asc' }
        },
        documents: {
          where: {
            confidentialityLevel: { in: ['PUBLIC', 'CONFIDENTIAL'] } // Exclude PRIVILEGED
          },
          include: {
            uploadedBy: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found or access denied' },
        { status: 404 }
      );
    }

    // Generate slug for public URL
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await prisma.publicSummary.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Process timeline events for public consumption
    let publicTimeline: PublicTimelineEvent[] = [];
    if (includeTimeline) {
      publicTimeline = await processTimelineForPublic(caseData.timelineEvents);
    }

    // Process evidence for public consumption
    let publicEvidence: PublicEvidence[] = [];
    if (includeEvidence) {
      publicEvidence = await processEvidenceForPublic(caseData.documents);
    }

    // Generate AI-assisted public summary if introduction not provided
    let finalIntroduction = introduction;
    if (!introduction && (publicTimeline.length > 0 || publicEvidence.length > 0)) {
      try {
        const contextData = {
          caseTitle: caseData.title,
          timelineEvents: publicTimeline.slice(0, 5), // Use first 5 events for context
          evidenceCount: publicEvidence.length,
          caseStatus: caseData.status
        };

        const aiAnalysis = await openAIClient.analyzeLegal({
          documents: [JSON.stringify(contextData)],
          caseContext: `Public summary for case: ${caseData.title}`,
          analysisType: 'strategy',
          targetAudience: 'public'
        });

        finalIntroduction = aiAnalysis.analysis;
      } catch (error) {
        console.warn('Failed to generate AI introduction:', error);
        finalIntroduction = `This is a public summary of the case: ${caseData.title}. The information presented here has been carefully reviewed and redacted to protect privacy while maintaining transparency.`;
      }
    }

    // Hash password if provided
    let passwordHash;
    if (password && accessLevel === 'PASSWORD_PROTECTED') {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create public summary content
    const summaryContent: PublicSummaryData = {
      title,
      introduction: finalIntroduction,
      timeline: publicTimeline,
      keyEvidence: publicEvidence,
      lastUpdated: new Date().toISOString()
    };

    // Create public summary record
    const publicSummary = await prisma.publicSummary.create({
      data: {
        caseId,
        organizationId,
        title,
        slug,
        content: summaryContent,
        accessLevel,
        passwordHash,
        isPublished: false, // Start as draft
        viewCount: 0,
        createdById
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PUBLIC_SUMMARY_CREATED',
        entityType: 'PUBLIC_SUMMARY',
        entityId: publicSummary.id,
        userId: createdById,
        organizationId,
        details: {
          caseId,
          title,
          accessLevel,
          timelineEvents: publicTimeline.length,
          evidenceItems: publicEvidence.length
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...publicSummary,
        publicUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/public/${slug}`,
        processing: {
          timelineEventsProcessed: publicTimeline.length,
          evidenceItemsProcessed: publicEvidence.length,
          aiIntroductionGenerated: !introduction && Boolean(finalIntroduction)
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating public summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process timeline events for public consumption
 */
async function processTimelineForPublic(events: any[]): Promise<PublicTimelineEvent[]> {
  const publicEvents: PublicTimelineEvent[] = [];

  for (const event of events) {
    // Check if event should be included in public summary
    const isConfidential = event.metadata?.confidential || 
                          event.title.toLowerCase().includes('confidential') ||
                          event.description?.toLowerCase().includes('privileged');

    let publicEvent: PublicTimelineEvent = {
      id: event.id,
      date: event.eventDate.toISOString(),
      title: event.title,
      description: event.description || '',
      category: event.eventType,
      supportingDocuments: event.documents?.map((d: any) => d.id) || [],
      isRedacted: isConfidential
    };

    // Redact sensitive information
    if (isConfidential) {
      publicEvent.title = '[CONFIDENTIAL EVENT]';
      publicEvent.description = 'Event details redacted for privacy';
      publicEvent.supportingDocuments = [];
    } else {
      // Use AI to check for potential confidentiality issues
      try {
        const ethicalFlags = await openAIClient.checkEthicalConcerns(
          `${event.title} ${event.description || ''}`
        );

        const hasCriticalFlags = ethicalFlags.some(flag => 
          flag.severity === 'critical' || flag.severity === 'high'
        );

        if (hasCriticalFlags) {
          publicEvent.isRedacted = true;
          publicEvent.title = '[REDACTED FOR PRIVACY]';
          publicEvent.description = 'Event details redacted to protect privacy';
          publicEvent.supportingDocuments = [];
        }
      } catch (error) {
        console.warn('Failed to check ethical concerns for event:', error);
        // Err on the side of caution
        publicEvent.isRedacted = true;
      }
    }

    publicEvents.push(publicEvent);
  }

  return publicEvents;
}

/**
 * Process evidence documents for public consumption
 */
async function processEvidenceForPublic(documents: any[]): Promise<PublicEvidence[]> {
  const publicEvidence: PublicEvidence[] = [];

  for (const doc of documents) {
    // Skip privileged documents
    if (doc.confidentialityLevel === 'PRIVILEGED') {
      continue;
    }

    let publicDoc: PublicEvidence = {
      id: doc.id,
      title: doc.title,
      summary: doc.aiSummary || doc.description || 'Document summary not available',
      category: doc.category,
      date: doc.createdAt.toISOString(),
      isRedacted: false
    };

    // Check confidentiality flags
    const hasConfidentialityFlags = doc.confidentialityFlags?.length > 0;
    
    if (hasConfidentialityFlags || doc.confidentialityLevel === 'CONFIDENTIAL') {
      // Apply redaction
      publicDoc.isRedacted = true;
      publicDoc.title = '[DOCUMENT TITLE REDACTED]';
      publicDoc.summary = 'Document content redacted for privacy and confidentiality';
      publicDoc.redactionReason = 'Contains confidential information';
    } else if (doc.aiSummary) {
      // Use AI to create a public-appropriate summary
      try {
        const publicSummary = await openAIClient.summarizeDocument({
          content: doc.aiSummary,
          confidentialityLevel: 'public',
          context: 'Creating public case summary'
        });

        if (publicSummary.confidentialityFlags.length > 0) {
          publicDoc.isRedacted = true;
          publicDoc.summary = 'Document summary redacted due to potential privacy concerns';
          publicDoc.redactionReason = 'Potential privacy or confidentiality concerns detected';
        } else {
          publicDoc.summary = publicSummary.summary;
        }
      } catch (error) {
        console.warn('Failed to generate public summary for document:', error);
        publicDoc.isRedacted = true;
        publicDoc.summary = 'Document summary unavailable';
      }
    }

    publicEvidence.push(publicDoc);
  }

  return publicEvidence;
}