import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/documents/[id]/download - Download document file
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // SECURITY: Authenticate request
    const user = await auth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const inline = searchParams.get('inline') === 'true'; // For viewing in browser vs downloading

    // Get document record from database
    const document = await prisma.document.findUnique({
      where: { id },
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
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify user can only download documents from their organization
    if (document.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to documents of other organizations' },
        { status: 403 }
      );
    }

    // Build full file path
    const fullFilePath = path.join(UPLOAD_DIR, document.filePath);

    // Check if file exists on disk
    if (!existsSync(fullFilePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Read file from disk
    const fileBuffer = await readFile(fullFilePath);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.mimeType);
    headers.set('Content-Length', document.fileSize.toString());
    
    if (inline) {
      // View in browser
      headers.set('Content-Disposition', `inline; filename="${document.originalName}"`);
    } else {
      // Force download
      headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`);
    }

    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');

    // SECURITY: Log download access with user information for audit trail
    console.log(`Document downloaded: ${document.id} (${document.originalName}) by user ${user.userId} (${user.email})`);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// HEAD /api/documents/[id]/download - Get file info without downloading
export async function HEAD(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // SECURITY: Authenticate request
    const user = await auth(request);
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const { id } = params;

    // Get document record from database
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        mimeType: true,
        fileSize: true,
        originalName: true,
        filePath: true,
        organizationId: true
      }
    });

    if (!document) {
      return new NextResponse(null, { status: 404 });
    }

    // SECURITY: Verify user can only access documents from their organization
    if (document.organizationId !== user.organizationId) {
      return new NextResponse(null, { status: 403 });
    }

    // Build full file path
    const fullFilePath = path.join(UPLOAD_DIR, document.filePath);

    // Check if file exists on disk
    if (!existsSync(fullFilePath)) {
      return new NextResponse(null, { status: 404 });
    }

    // Return headers without body
    const headers = new Headers();
    headers.set('Content-Type', document.mimeType);
    headers.set('Content-Length', document.fileSize.toString());
    headers.set('Content-Disposition', `attachment; filename="${document.originalName}"`);

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error getting document info:', error);
    return new NextResponse(null, { status: 500 });
  }
}
