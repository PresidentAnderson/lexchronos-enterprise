import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';
import { virusScanner } from '@/lib/security/virus-scanner';
import { fileTypeValidator } from '@/lib/security/file-type-validator';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// POST /api/documents/upload - Upload document file and create record
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string || 'GENERAL';
    const type = formData.get('type') as string || 'OTHER';
    const isConfidential = formData.get('isConfidential') === 'true';
    const organizationId = formData.get('organizationId') as string;
    const caseId = formData.get('caseId') as string;
    const tags = formData.get('tags') ? JSON.parse(formData.get('tags') as string) : null;
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : null;

    // SECURITY: Use authenticated user's organization and user ID
    const userOrganizationId = user.organizationId;
    const userUploaderId = user.userId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // SECURITY: Verify user can only upload to their own organization
    if (organizationId && organizationId !== userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'Cannot upload documents to other organizations' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE} bytes limit` },
        { status: 400 }
      );
    }

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: userOrganizationId }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Validate case if provided
    if (caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId }
      });

      if (!caseData) {
        return NextResponse.json(
          { success: false, error: 'Case not found' },
          { status: 404 }
        );
      }

      if (caseData.organizationId !== userOrganizationId) {
        return NextResponse.json(
          { success: false, error: 'Case does not belong to this organization' },
          { status: 400 }
        );
      }
    }

    // Create upload directory if it doesn't exist
    const orgUploadDir = path.join(UPLOAD_DIR, userOrganizationId);
    if (!existsSync(orgUploadDir)) {
      await mkdir(orgUploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const baseFileName = path.basename(file.name, fileExtension);
    const timestamp = Date.now();
    const uniqueFileName = `${baseFileName}_${timestamp}${fileExtension}`;
    const filePath = path.join(orgUploadDir, uniqueFileName);
    const relativeFilePath = path.join(userOrganizationId, uniqueFileName);

    // Convert file to buffer and calculate checksum
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // SECURITY: Use SHA-256 instead of MD5 (MD5 is cryptographically broken)
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // SECURITY: Validate file type using magic bytes (not just MIME type)
    const fileTypeResult = fileTypeValidator.validateFileType(buffer, file.name, file.type);
    if (!fileTypeResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `File validation failed: ${fileTypeResult.error}`,
          details: {
            declaredExtension: path.extname(file.name).slice(1),
            detectedType: fileTypeResult.detectedType,
            detectedExtension: fileTypeResult.detectedExtension,
            mismatch: fileTypeResult.mismatch
          }
        },
        { status: 400 }
      );
    }

    // Write file to disk temporarily for virus scanning
    await writeFile(filePath, buffer);

    // SECURITY: Scan file for viruses and malware
    const scanResult = await virusScanner.scanFile(filePath, buffer);
    if (!scanResult.isClean) {
      // Delete the infected file immediately
      await unlink(filePath);

      return NextResponse.json(
        {
          success: false,
          error: 'File failed security scan',
          details: {
            threats: scanResult.threats,
            scanEngine: scanResult.scanEngine,
            message: 'The uploaded file was detected as malware and has been deleted'
          }
        },
        { status: 400 }
      );
    }

    // Determine document type based on MIME type
    let docType = 'OTHER';
    if (file.type.startsWith('application/pdf')) docType = 'PDF';
    else if (file.type.includes('word')) docType = 'DOC';
    else if (file.type.includes('sheet')) docType = 'SPREADSHEET';
    else if (file.type.startsWith('image/')) docType = 'IMAGE';
    else if (file.type.startsWith('video/')) docType = 'VIDEO';
    else if (file.type.startsWith('audio/')) docType = 'AUDIO';
    else if (file.type.includes('text')) docType = 'TXT';

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName: uniqueFileName,
        originalName: file.name,
        filePath: relativeFilePath,
        fileSize: file.size,
        mimeType: file.type,
        category: category as any,
        type: docType as any,
        isConfidential,
        organizationId: userOrganizationId,
        caseId: caseId || null,
        uploadedById: userUploaderId,
        tags,
        metadata,
        checksum,
        isProcessed: false
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
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // TODO: Queue for OCR processing if it's a PDF or image
    // TODO: Queue for virus scanning (CRITICAL SECURITY REQUIREMENT)
    // TODO: Validate file type against magic bytes, not just MIME type
    // TODO: Generate thumbnail if it's an image

    return NextResponse.json(
      {
        success: true,
        data: document,
        message: 'File uploaded successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/documents/upload/progress/[uploadId] - Get upload progress (for chunked uploads)
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // This would be implemented for large file chunked uploads
    // For now, return a simple response
    return NextResponse.json({
      success: true,
      message: 'Upload progress tracking not implemented yet'
    });
  } catch (error) {
    console.error('Error getting upload progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});