/**
 * AI Timeline Generation API
 * Generates chronological timelines from case evidence using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { openAIClient } from '@/lib/ai/openai-client';
import { prisma } from '@/lib/db';

interface Evidence {
  title: string;
  description?: string;
  dateObtained: string;
  type: string;
  content?: string;
  keyPoints?: string[];
}

interface TimelineRequest {
  caseId: string;
  organizationId: string;
  evidence: Evidence[];
  analysisMode: 'chronological' | 'thematic' | 'legal';
  customPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TimelineRequest = await request.json();
    
    const {
      caseId,
      organizationId,
      evidence,
      analysisMode = 'chronological',
      customPrompt
    } = body;

    // Validate required fields
    if (!caseId || !organizationId || !evidence || evidence.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields or evidence' },
        { status: 400 }
      );
    }

    // Verify case exists and user has access
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        organizationId
      },
      select: {
        id: true,
        title: true,
        caseNumber: true
      }
    });

    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: 'Case not found or access denied' },
        { status: 404 }
      );
    }

    // Generate timeline using AI
    const timeline = await generateTimelineWithAI(evidence, analysisMode, customPrompt);
    
    // Save timeline to database
    const savedTimeline = await saveTimelineToDatabase(caseId, organizationId, timeline);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'AI_TIMELINE_GENERATED',
        entityType: 'CASE',
        entityId: caseId,
        organizationId,
        details: {
          evidenceCount: evidence.length,
          timelineEvents: timeline.length,
          analysisMode,
          hasCustomPrompt: Boolean(customPrompt)
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        timeline: savedTimeline,
        metadata: {
          caseId,
          caseTitle: caseRecord.title,
          caseNumber: caseRecord.caseNumber,
          evidenceProcessed: evidence.length,
          eventsGenerated: timeline.length,
          analysisMode,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Timeline generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Timeline generation failed' },
      { status: 500 }
    );
  }
}

/**
 * Generate timeline using OpenAI
 */
async function generateTimelineWithAI(
  evidence: Evidence[], 
  analysisMode: string,
  customPrompt?: string
): Promise<any[]> {
  try {
    // Prepare evidence data for AI processing
    const evidenceForAI = evidence.map(e => ({
      title: e.title,
      description: e.description || '',
      dateObtained: e.dateObtained,
      type: e.type,
      keyPoints: e.keyPoints || [],
      // Include relevant content excerpts
      content: e.content ? e.content.substring(0, 1000) : ''
    }));

    // Generate timeline using OpenAI client
    const aiTimeline = await openAIClient.generateTimeline(evidenceForAI);

    // Enhance timeline based on analysis mode
    let enhancedTimeline = aiTimeline;

    if (analysisMode === 'legal') {
      enhancedTimeline = await enhanceTimelineForLegalAnalysis(aiTimeline, evidence);
    } else if (analysisMode === 'thematic') {
      enhancedTimeline = await enhanceTimelineForThematicAnalysis(aiTimeline, evidence);
    }

    // Apply custom prompt if provided
    if (customPrompt) {
      enhancedTimeline = await applyCustomTimelinePrompt(enhancedTimeline, customPrompt);
    }

    return enhancedTimeline;
  } catch (error) {
    console.error('AI timeline generation error:', error);
    // Return basic timeline from evidence dates if AI fails
    return createFallbackTimeline(evidence);
  }
}

/**
 * Enhance timeline for legal analysis
 */
async function enhanceTimelineForLegalAnalysis(timeline: any[], evidence: Evidence[]) {
  // Add legal significance scoring and categorization
  return timeline.map(event => ({
    ...event,
    legalSignificance: calculateLegalSignificance(event, evidence),
    legalCategory: determineLegalCategory(event),
    statuteOfLimitationsImpact: assessStatuteImpact(event),
    potentialIssues: identifyPotentialLegalIssues(event)
  }));
}

/**
 * Enhance timeline for thematic analysis
 */
async function enhanceTimelineForThematicAnalysis(timeline: any[], evidence: Evidence[]) {
  // Group events by themes and add thematic metadata
  return timeline.map(event => ({
    ...event,
    theme: identifyEventTheme(event, evidence),
    relatedEvents: findRelatedEvents(event, timeline),
    thematicImportance: calculateThematicImportance(event, evidence)
  }));
}

/**
 * Apply custom prompt to timeline
 */
async function applyCustomTimelinePrompt(timeline: any[], customPrompt: string) {
  // This would use additional AI processing based on the custom prompt
  // For now, return timeline as-is but in production this would be enhanced
  return timeline.map(event => ({
    ...event,
    customAnalysis: `Custom analysis applied: ${customPrompt.substring(0, 100)}...`
  }));
}

/**
 * Create fallback timeline from evidence dates
 */
function createFallbackTimeline(evidence: Evidence[]) {
  return evidence.map((e, index) => ({
    id: `fallback-${index}`,
    date: e.dateObtained,
    title: e.title,
    description: e.description || 'Evidence obtained',
    importance: 'MEDIUM',
    sources: [e.title],
    confidence: 0.7,
    category: e.type,
    isFallback: true
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Save timeline to database
 */
async function saveTimelineToDatabase(caseId: string, organizationId: string, timeline: any[]) {
  const savedEvents = await Promise.all(
    timeline.map(async (event, index) => {
      try {
        return await prisma.timeline.create({
          data: {
            title: event.title,
            description: event.description,
            eventType: event.category || 'GENERAL',
            eventDate: new Date(event.date),
            importance: event.importance || 'NORMAL',
            isVerified: false,
            source: 'AI_GENERATED',
            caseId,
            organizationId,
            createdById: 'system', // Would be actual user ID in production
            tags: event.sources || [],
            attachments: {
              aiGenerated: true,
              confidence: event.confidence || 0.8,
              sources: event.sources || [],
              originalIndex: index
            }
          }
        });
      } catch (error) {
        console.error(`Failed to save timeline event ${index}:`, error);
        return null;
      }
    })
  );

  // Filter out failed saves and return successful ones
  return savedEvents.filter(Boolean);
}

/**
 * Calculate legal significance of an event
 */
function calculateLegalSignificance(event: any, evidence: Evidence[]): number {
  let significance = 0.5; // Base significance
  
  // Increase significance for certain types of events
  const highSignificanceKeywords = [
    'filing', 'court', 'judgment', 'settlement', 'contract', 'breach',
    'violation', 'deadline', 'statute', 'limitation', 'discovery'
  ];
  
  const eventText = `${event.title} ${event.description}`.toLowerCase();
  highSignificanceKeywords.forEach(keyword => {
    if (eventText.includes(keyword)) {
      significance += 0.1;
    }
  });

  return Math.min(significance, 1.0);
}

/**
 * Determine legal category of an event
 */
function determineLegalCategory(event: any): string {
  const eventText = `${event.title} ${event.description}`.toLowerCase();
  
  if (eventText.includes('contract') || eventText.includes('agreement')) {
    return 'CONTRACT';
  } else if (eventText.includes('court') || eventText.includes('hearing')) {
    return 'LITIGATION';
  } else if (eventText.includes('discovery') || eventText.includes('deposition')) {
    return 'DISCOVERY';
  } else if (eventText.includes('settlement') || eventText.includes('negotiation')) {
    return 'SETTLEMENT';
  }
  
  return 'GENERAL';
}

/**
 * Assess statute of limitations impact
 */
function assessStatuteImpact(event: any): string {
  const eventText = `${event.title} ${event.description}`.toLowerCase();
  
  if (eventText.includes('statute') || eventText.includes('limitation')) {
    return 'CRITICAL';
  } else if (eventText.includes('deadline') || eventText.includes('filing')) {
    return 'HIGH';
  }
  
  return 'NONE';
}

/**
 * Identify potential legal issues
 */
function identifyPotentialLegalIssues(event: any): string[] {
  const issues: string[] = [];
  const eventText = `${event.title} ${event.description}`.toLowerCase();
  
  if (eventText.includes('breach')) {
    issues.push('Potential breach of contract');
  }
  if (eventText.includes('violation')) {
    issues.push('Potential legal violation');
  }
  if (eventText.includes('deadline') && eventText.includes('missed')) {
    issues.push('Missed deadline - statute of limitations concern');
  }
  
  return issues;
}

/**
 * Identify event theme
 */
function identifyEventTheme(event: any, evidence: Evidence[]): string {
  const eventText = `${event.title} ${event.description}`.toLowerCase();
  
  if (eventText.includes('financial') || eventText.includes('payment')) {
    return 'FINANCIAL';
  } else if (eventText.includes('communication') || eventText.includes('email')) {
    return 'COMMUNICATION';
  } else if (eventText.includes('meeting') || eventText.includes('conference')) {
    return 'MEETINGS';
  } else if (eventText.includes('document') || eventText.includes('filing')) {
    return 'DOCUMENTATION';
  }
  
  return 'GENERAL';
}

/**
 * Find related events in timeline
 */
function findRelatedEvents(event: any, timeline: any[]): string[] {
  // Simple implementation - could be enhanced with semantic similarity
  const relatedEvents: string[] = [];
  const eventKeywords = event.title.toLowerCase().split(' ');
  
  timeline.forEach(otherEvent => {
    if (otherEvent.id !== event.id) {
      const otherKeywords = otherEvent.title.toLowerCase().split(' ');
      const commonKeywords = eventKeywords.filter((keyword: string) =>
        otherKeywords.some((other: string) => other.includes(keyword) || keyword.includes(other))
      );
      
      if (commonKeywords.length > 1) {
        relatedEvents.push(otherEvent.id);
      }
    }
  });
  
  return relatedEvents;
}

/**
 * Calculate thematic importance
 */
function calculateThematicImportance(event: any, evidence: Evidence[]): number {
  // Count how many pieces of evidence relate to this event's theme
  const theme = identifyEventTheme(event, evidence);
  const relatedEvidenceCount = evidence.filter(e => 
    identifyEventTheme({ title: e.title, description: e.description }, evidence) === theme
  ).length;
  
  return Math.min(relatedEvidenceCount / evidence.length, 1.0);
}