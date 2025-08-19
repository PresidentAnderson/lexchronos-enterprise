import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';

// GET /api/documents - Get all documents with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');
    const caseId = searchParams.get('caseId');
    const organizationId = searchParams.get('organizationId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const uploadedById = searchParams.get('uploadedById');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (caseId) {
      where.caseId = caseId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (uploadedById) {
      where.uploadedById = uploadedById;
    }

    const result = await paginate(prisma.document, {
      page,
      limit,
      sortBy,
      sortOrder,
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            version: true
          }
        },
        _count: {
          select: {
            versions: true,
            evidence: true,
            notes: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create new document record (metadata only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      fileName,
      originalName,
      filePath,
      fileSize,
      mimeType,
      category = 'GENERAL',
      type = 'OTHER',
      isConfidential = false,
      version = '1.0',
      parentId,
      organizationId,
      caseId,
      uploadedById,
      tags,
      metadata,
      checksum
    } = body;

    // Validate required fields
    if (!title || !fileName || !filePath || !organizationId || !uploadedById) {
      return NextResponse.json(
        { success: false, error: 'Title, fileName, filePath, organizationId, and uploadedById are required' },
        { status: 400 }
      );
    }

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
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

      if (caseData.organizationId !== organizationId) {
        return NextResponse.json(
          { success: false, error: 'Case does not belong to this organization' },
          { status: 400 }
        );
      }
    }

    // Validate uploader exists
    const uploader = await prisma.user.findUnique({
      where: { id: uploadedById }
    });

    if (!uploader) {
      return NextResponse.json(
        { success: false, error: 'Uploader not found' },
        { status: 404 }
      );
    }

    // Validate parent document if versioning
    if (parentId) {
      const parent = await prisma.document.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent document not found' },
          { status: 404 }
        );
      }
    }

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName,
        originalName: originalName || fileName,
        filePath,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/octet-stream',
        category,
        type,
        isConfidential,
        version,
        parentId,
        organizationId,
        caseId,
        uploadedById,
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
        parent: {
          select: {
            id: true,
            title: true,
            version: true
          }
        }
      }
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}