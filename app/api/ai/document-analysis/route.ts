/**
 * AI Document Analysis API
 * Provides comprehensive AI-powered analysis of legal documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { openAIClient } from '@/lib/ai/openai-client';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

interface AnalysisRequest {
  documentId: string;
  organizationId: string;
  caseId?: string;
  analysisTypes: string[];
}

interface DocumentAnalysis {
  documentId: string;
  documentTitle: string;
  summary: string;
  keyPoints: string[];
  legalIssues: string[];
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendations: string[];
  };
  entityRecognition: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    amounts: string[];
  };
  sentimentAnalysis: {
    overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    score: number;
    confidence: number;
  };
  complianceCheck: {
    issues: string[];
    recommendations: string[];
    score: number;
  };
  relevanceScore: number;
  confidenceScore: number;
  processingTime: number;
}

export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const documentId = searchParams.get('documentId');

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Build query filters
    const where: any = { organizationId: userOrganizationId };
    if (caseId) where.caseId = caseId;
    if (documentId) where.documentId = documentId;

    // Get existing analyses
    const analyses = await prisma.documentAnalysis.findMany({
      where,
      include: {
        document: {
          select: {
            title: true,
            originalName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analyses: analyses.map(formatAnalysisResponse)
      }
    });

  } catch (error) {
    console.error('Error fetching document analyses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  const startTime = Date.now();

  try {
    const body: AnalysisRequest = await request.json();
    const { documentId, caseId, analysisTypes } = body;

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!documentId || !analysisTypes?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get document and verify organization access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: userOrganizationId
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.documentAnalysis.findFirst({
      where: {
        documentId,
        organizationId: userOrganizationId
      }
    });

    if (existingAnalysis && !request.headers.get('force-refresh')) {
      return NextResponse.json({
        success: true,
        data: {
          analysis: formatAnalysisResponse(existingAnalysis)
        }
      });
    }

    // Perform AI analysis
    const analysis = await performDocumentAnalysis(document, analysisTypes);
    const processingTime = Date.now() - startTime;

    // Save analysis to database
    const savedAnalysis = await prisma.documentAnalysis.upsert({
      where: {
        documentId_organizationId: {
          documentId,
          organizationId: userOrganizationId
        }
      },
      update: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        legalIssues: analysis.legalIssues,
        riskLevel: analysis.riskAssessment.level,
        riskFactors: analysis.riskAssessment.factors,
        riskRecommendations: analysis.riskAssessment.recommendations,
        entities: analysis.entityRecognition,
        sentiment: analysis.sentimentAnalysis.overall,
        sentimentScore: analysis.sentimentAnalysis.score,
        sentimentConfidence: analysis.sentimentAnalysis.confidence,
        complianceIssues: analysis.complianceCheck.issues,
        complianceRecommendations: analysis.complianceCheck.recommendations,
        complianceScore: analysis.complianceCheck.score,
        relevanceScore: analysis.relevanceScore,
        confidenceScore: analysis.confidenceScore,
        processingTime,
        analysisMetadata: {
          analysisTypes,
          model: 'gpt-4',
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      },
      create: {
        documentId,
        organizationId: userOrganizationId,
        caseId,
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        legalIssues: analysis.legalIssues,
        riskLevel: analysis.riskAssessment.level,
        riskFactors: analysis.riskAssessment.factors,
        riskRecommendations: analysis.riskAssessment.recommendations,
        entities: analysis.entityRecognition,
        sentiment: analysis.sentimentAnalysis.overall,
        sentimentScore: analysis.sentimentAnalysis.score,
        sentimentConfidence: analysis.sentimentAnalysis.confidence,
        complianceIssues: analysis.complianceCheck.issues,
        complianceRecommendations: analysis.complianceCheck.recommendations,
        complianceScore: analysis.complianceCheck.score,
        relevanceScore: analysis.relevanceScore,
        confidenceScore: analysis.confidenceScore,
        processingTime,
        analysisMetadata: {
          analysisTypes,
          model: 'gpt-4',
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      },
      include: {
        document: {
          select: {
            title: true,
            originalName: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'AI_DOCUMENT_ANALYSIS',
        entityType: 'DOCUMENT',
        entityId: documentId,
        organizationId: userOrganizationId,
        details: {
          analysisTypes,
          processingTime,
          riskLevel: analysis.riskAssessment.level,
          legalIssuesFound: analysis.legalIssues.length,
          complianceScore: analysis.complianceCheck.score
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis: formatAnalysisResponse(savedAnalysis)
      }
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Document analysis failed' },
      { status: 500 }
    );
  }
});

/**
 * Perform comprehensive AI analysis on a document
 */
async function performDocumentAnalysis(document: any, analysisTypes: string[]): Promise<DocumentAnalysis> {
  const content = document.extractedText || '';
  
  if (!content) {
    throw new Error('No text content available for analysis');
  }

  const startTime = Date.now();
  
  try {
    // Run multiple AI analyses in parallel for efficiency
    const [
      summaryResult,
      entityResult,
      sentimentResult,
      legalResult,
      riskResult,
      complianceResult
    ] = await Promise.all([
      // Document summary and key points
      analysisTypes.includes('summary') ? 
        openAIClient.summarizeDocument({
          content,
          documentType: 'legal',
          confidentialityLevel: document.confidentialityLevel
        }) : 
        Promise.resolve({ summary: '', keyPoints: [] }),

      // Entity recognition
      analysisTypes.includes('entities') ? 
        performEntityRecognition(content) : 
        Promise.resolve({
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          amounts: []
        }),

      // Sentiment analysis
      analysisTypes.includes('sentiment') ? 
        performSentimentAnalysis(content) : 
        Promise.resolve({
          overall: 'NEUTRAL' as const,
          score: 0.5,
          confidence: 0.8
        }),

      // Legal issue detection
      analysisTypes.includes('legal') ? 
        performLegalIssueDetection(content) : 
        Promise.resolve([]),

      // Risk assessment
      analysisTypes.includes('risk') ? 
        performRiskAssessment(content, document.confidentialityLevel) : 
        Promise.resolve({
          level: 'MEDIUM' as const,
          factors: [],
          recommendations: []
        }),

      // Compliance checking
      analysisTypes.includes('compliance') ? 
        performComplianceCheck(content) : 
        Promise.resolve({
          issues: [],
          recommendations: [],
          score: 0.8
        })
    ]);

    const processingTime = Date.now() - startTime;

    return {
      documentId: document.id,
      documentTitle: document.title,
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints || [],
      legalIssues: legalResult,
      riskAssessment: riskResult,
      entityRecognition: entityResult,
      sentimentAnalysis: sentimentResult,
      complianceCheck: complianceResult,
      relevanceScore: calculateRelevanceScore(content, summaryResult),
      confidenceScore: calculateConfidenceScore(summaryResult, entityResult, sentimentResult),
      processingTime
    };

  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('Failed to perform AI analysis');
  }
}

/**
 * Perform entity recognition on document content
 */
async function performEntityRecognition(content: string) {
  const prompt = `
Extract entities from this legal document:

${content.substring(0, 3000)}

Return a JSON object with these arrays:
- people: Person names
- organizations: Company/organization names
- locations: Places, addresses, jurisdictions
- dates: Important dates (format as YYYY-MM-DD when possible)
- amounts: Monetary amounts, quantities

Only return the JSON object, no other text.
`;

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a legal entity extraction AI. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    const data = await completion.json();
    const response = data.choices[0]?.message?.content;

    if (response) {
      try {
        return JSON.parse(response);
      } catch {
        // Fallback to basic entity extraction
        return extractBasicEntities(content);
      }
    }

    return extractBasicEntities(content);
  } catch (error) {
    console.error('Entity recognition error:', error);
    return extractBasicEntities(content);
  }
}

/**
 * Basic entity extraction fallback
 */
function extractBasicEntities(content: string) {
  const entities = {
    people: [] as string[],
    organizations: [] as string[],
    locations: [] as string[],
    dates: [] as string[],
    amounts: [] as string[]
  };

  // Simple regex patterns for fallback extraction
  const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
  const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
  const capWordRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;

  entities.dates = Array.from(content.match(dateRegex) || []);
  entities.amounts = Array.from(content.match(amountRegex) || []);

  // Simple capitalized word extraction (very basic)
  const capWords = Array.from(content.match(capWordRegex) || []);
  entities.people = capWords.filter(word => 
    word.split(' ').length <= 3 && word.length > 3
  ).slice(0, 10);

  return entities;
}

/**
 * Perform sentiment analysis
 */
async function performSentimentAnalysis(content: string) {
  // Simple keyword-based sentiment analysis as fallback
  const positiveWords = ['agreement', 'success', 'favorable', 'positive', 'beneficial'];
  const negativeWords = ['dispute', 'breach', 'violation', 'damages', 'liability', 'fail'];
  
  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (lowerContent.match(new RegExp(word, 'g')) || []).length, 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (lowerContent.match(new RegExp(word, 'g')) || []).length, 0);

  let overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
  let score = 0.5;

  if (positiveCount > negativeCount) {
    overall = 'POSITIVE';
    score = 0.6 + (Math.min(positiveCount, 5) * 0.08);
  } else if (negativeCount > positiveCount) {
    overall = 'NEGATIVE';
    score = 0.4 - (Math.min(negativeCount, 5) * 0.08);
  }

  return {
    overall,
    score: Math.max(0, Math.min(1, score)),
    confidence: 0.75
  };
}

/**
 * Detect legal issues in document
 */
async function performLegalIssueDetection(content: string): Promise<string[]> {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  const issuePatterns = [
    { pattern: /breach|violation|default/g, issue: 'Potential breach or violation identified' },
    { pattern: /statute.*limitation/g, issue: 'Statute of limitations mentioned' },
    { pattern: /confidential|privilege/g, issue: 'Confidentiality or privilege concerns' },
    { pattern: /liable|liability|damages/g, issue: 'Liability or damages discussed' },
    { pattern: /comply|compliance|regulation/g, issue: 'Compliance requirements mentioned' },
    { pattern: /terminate|termination|cancel/g, issue: 'Termination provisions present' }
  ];

  issuePatterns.forEach(({ pattern, issue }) => {
    if (pattern.test(lowerContent)) {
      issues.push(issue);
    }
  });

  return issues;
}

/**
 * Perform risk assessment
 */
async function performRiskAssessment(content: string, confidentialityLevel: string) {
  const lowerContent = content.toLowerCase();
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Risk factors
  if (lowerContent.includes('breach') || lowerContent.includes('violation')) {
    riskScore += 25;
    factors.push('Breach or violation language detected');
    recommendations.push('Review breach provisions and potential liability');
  }

  if (lowerContent.includes('damages') || lowerContent.includes('penalty')) {
    riskScore += 20;
    factors.push('Financial penalties or damages mentioned');
    recommendations.push('Assess financial exposure and mitigation strategies');
  }

  if (confidentialityLevel === 'HIGHLY_CONFIDENTIAL' || confidentialityLevel === 'ATTORNEY_EYES_ONLY') {
    riskScore += 15;
    factors.push('High confidentiality classification');
    recommendations.push('Ensure proper access controls and handling procedures');
  }

  if (lowerContent.includes('urgent') || lowerContent.includes('immediate')) {
    riskScore += 10;
    factors.push('Urgent action required');
    recommendations.push('Prioritize review and response timeline');
  }

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (riskScore >= 50) level = 'CRITICAL';
  else if (riskScore >= 30) level = 'HIGH';
  else if (riskScore >= 15) level = 'MEDIUM';
  else level = 'LOW';

  return { level, factors, recommendations };
}

/**
 * Perform compliance check
 */
async function performComplianceCheck(content: string) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0.9; // Start with high compliance score

  const lowerContent = content.toLowerCase();

  // Check for compliance issues
  if (!lowerContent.includes('confidential') && lowerContent.includes('sensitive')) {
    issues.push('Sensitive information without confidentiality markings');
    recommendations.push('Add appropriate confidentiality classifications');
    score -= 0.1;
  }

  if (lowerContent.includes('personal') && lowerContent.includes('information')) {
    issues.push('Personal information detected - GDPR/privacy compliance required');
    recommendations.push('Ensure GDPR/privacy law compliance');
    score -= 0.1;
  }

  if (lowerContent.includes('financial') && !lowerContent.includes('sox')) {
    issues.push('Financial information without SOX compliance reference');
    recommendations.push('Review SOX compliance requirements');
    score -= 0.05;
  }

  return {
    issues,
    recommendations,
    score: Math.max(0, Math.min(1, score))
  };
}

/**
 * Calculate document relevance score
 */
function calculateRelevanceScore(content: string, summaryResult: any): number {
  let score = 0.5; // Base score

  // Increase score based on legal keywords
  const legalKeywords = [
    'contract', 'agreement', 'legal', 'court', 'law', 'statute',
    'regulation', 'compliance', 'liability', 'damages', 'breach'
  ];

  const lowerContent = content.toLowerCase();
  legalKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      score += 0.05;
    }
  });

  // Increase score if AI generated summary and key points
  if (summaryResult.summary && summaryResult.summary.length > 50) {
    score += 0.1;
  }

  if (summaryResult.keyPoints && summaryResult.keyPoints.length > 0) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate overall confidence score
 */
function calculateConfidenceScore(summaryResult: any, entityResult: any, sentimentResult: any): number {
  let score = 0.7; // Base confidence

  // Increase confidence based on successful extractions
  if (summaryResult.summary && summaryResult.summary.length > 20) {
    score += 0.1;
  }

  if (entityResult.people.length > 0 || entityResult.organizations.length > 0) {
    score += 0.1;
  }

  if (sentimentResult.confidence > 0.8) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Format analysis response for API
 */
function formatAnalysisResponse(analysis: any) {
  return {
    id: analysis.id,
    documentId: analysis.documentId,
    documentTitle: analysis.document?.title || analysis.document?.originalName || 'Unknown Document',
    summary: analysis.summary,
    keyPoints: analysis.keyPoints || [],
    legalIssues: analysis.legalIssues || [],
    riskAssessment: {
      level: analysis.riskLevel,
      factors: analysis.riskFactors || [],
      recommendations: analysis.riskRecommendations || []
    },
    entityRecognition: analysis.entities || {
      people: [],
      organizations: [],
      locations: [],
      dates: [],
      amounts: []
    },
    sentimentAnalysis: {
      overall: analysis.sentiment || 'NEUTRAL',
      score: analysis.sentimentScore || 0.5,
      confidence: analysis.sentimentConfidence || 0.8
    },
    complianceCheck: {
      issues: analysis.complianceIssues || [],
      recommendations: analysis.complianceRecommendations || [],
      score: analysis.complianceScore || 0.8
    },
    relevanceScore: analysis.relevanceScore || 0.5,
    confidenceScore: analysis.confidenceScore || 0.7,
    processingTime: analysis.processingTime || 0,
    createdAt: analysis.createdAt
  };
}