import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/db';

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

    // Log download access
    console.log(`Document downloaded: ${document.id} (${document.originalName}) by user request`);

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
    const { id } = params;

    // Get document record from database
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        mimeType: true,
        fileSize: true,
        originalName: true,
        filePath: true
      }
    });

    if (!document) {
      return new NextResponse(null, { status: 404 });
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
