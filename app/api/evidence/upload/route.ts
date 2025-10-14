/**
 * Enhanced Evidence Upload API
 * Supports document upload with AI processing, categorization, and metadata extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { openAIClient } from '@/lib/ai/openai-client';
import { extractTextFromFile } from '@/lib/document-processor';
import { validateUpload, sanitizeFilename } from '@/lib/upload-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const caseId = formData.get('caseId') as string;
    const uploadedById = formData.get('uploadedById') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string || 'GENERAL';
    const confidentialityLevel = formData.get('confidentialityLevel') as string || 'CONFIDENTIAL';
    const enableAI = formData.get('enableAI') === 'true';

    // Validate required fields
    if (!file || !organizationId || !uploadedById) {
      return NextResponse.json(
        { success: false, error: 'File, organizationId, and uploadedById are required' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateUpload(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Generate file metadata
    const fileId = randomUUID();
    const sanitizedFilename = sanitizeFilename(file.name);
    const fileExtension = sanitizedFilename.split('.').pop();
    const storedFilename = `${fileId}.${fileExtension}`;
    
    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', organizationId);
    await mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadDir, storedFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Extract text content from file
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(filePath, file.type);
    } catch (error) {
      console.warn('Failed to extract text:', error);
    }

    // Initialize AI processing results
    let aiSummary = '';
    let suggestedCategory = category;
    let confidentialityFlags: string[] = [];
    let keyPoints: string[] = [];
    let embeddings: number[] = [];

    // Process with AI if enabled and text was extracted
    if (enableAI && extractedText) {
      try {
        // Generate document summary
        const summaryResult = await openAIClient.summarizeDocument({
          content: extractedText,
          documentType: 'legal',
          confidentialityLevel: confidentialityLevel as any
        });

        aiSummary = summaryResult.summary;
        suggestedCategory = summaryResult.suggestedCategory;
        confidentialityFlags = summaryResult.confidentialityFlags;
        keyPoints = summaryResult.keyPoints;

        // Generate embeddings for semantic search
        embeddings = await openAIClient.generateEmbeddings(extractedText);

        // Check for ethical concerns
        const ethicalFlags = await openAIClient.checkEthicalConcerns(extractedText);
        if (ethicalFlags.length > 0) {
          confidentialityFlags.push(...ethicalFlags.map(f => `${f.type}: ${f.suggestion}`));
        }
      } catch (error) {
        console.error('AI processing failed:', error);
        // Continue without AI features if they fail
      }
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        id: fileId,
        title: title || sanitizedFilename,
        description,
        fileName: storedFilename,
        originalName: file.name,
        filePath: `/uploads/${organizationId}/${storedFilename}`,
        fileSize: file.size,
        mimeType: file.type,
        category: suggestedCategory,
        type: getDocumentType(file.type),
        confidentialityLevel,
        extractedText,
        aiSummary,
        keyPoints,
        confidentialityFlags,
        embeddings,
        organizationId,
        caseId: caseId || null,
        uploadedById,
        version: '1.0',
        isProcessed: true,
        checksum: await generateFileChecksum(Buffer.from(bytes)),
        metadata: {
          processingTimestamp: new Date().toISOString(),
          aiProcessed: enableAI && extractedText.length > 0,
          textExtracted: extractedText.length > 0,
          fileMetadata: {
            lastModified: new Date(file.lastModified),
            originalSize: file.size,
            mimeType: file.type
          }
        }
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPLOAD',
        entityType: 'DOCUMENT',
        entityId: document.id,
        userId: uploadedById,
        organizationId,
        details: {
          filename: file.name,
          fileSize: file.size,
          aiProcessed: enableAI && extractedText.length > 0,
          category: suggestedCategory,
          confidentialityLevel
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Create notification for case assignment if applicable
    if (caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        select: { assignedAttorney: true, title: true }
      });

      if (caseData?.assignedAttorney && caseData.assignedAttorney !== uploadedById) {
        await prisma.notification.create({
          data: {
            organizationId,
            userId: caseData.assignedAttorney,
            type: 'DOCUMENT_UPLOADED',
            title: 'New Evidence Uploaded',
            message: `New document "${document.title}" has been uploaded to case: ${caseData.title}`,
            data: {
              documentId: document.id,
              caseId,
              documentTitle: document.title,
              category: suggestedCategory,
              uploadedBy: `${document.uploadedBy?.firstName} ${document.uploadedBy?.lastName}`
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        document,
        processing: {
          aiSummaryGenerated: Boolean(aiSummary),
          textExtracted: extractedText.length > 0,
          categoryDetected: suggestedCategory !== category,
          confidentialityFlagged: confidentialityFlags.length > 0,
          embeddingsGenerated: embeddings.length > 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Determine document type based on MIME type
 */
function getDocumentType(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word')) return 'WORD';
  if (mimeType.includes('image')) return 'IMAGE';
  if (mimeType.includes('audio')) return 'AUDIO';
  if (mimeType.includes('video')) return 'VIDEO';
  if (mimeType.includes('text')) return 'TEXT';
  return 'OTHER';
}

/**
 * Generate SHA-256 checksum for file integrity
 */
async function generateFileChecksum(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}