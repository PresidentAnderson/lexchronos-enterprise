/**
 * Evidence Management API
 * Main endpoint for evidence CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const organizationId = searchParams.get('organizationId');
    const caseId = searchParams.get('caseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category');
    const confidentialityLevel = searchParams.get('confidentialityLevel');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      organizationId
    };

    if (caseId) {
      where.caseId = caseId;
    }

    if (category) {
      where.category = category;
    }

    if (confidentialityLevel) {
      where.confidentialityLevel = confidentialityLevel;
    }

    // Get total count
    const total = await prisma.evidence.count({ where });

    // Get evidence with pagination
    const evidence = await prisma.evidence.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            filePath: true,
            aiSummary: true,
            keyPoints: true,
            confidentialityFlags: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        evidence,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      type,
      category,
      source,
      location,
      custodian,
      caseId,
      organizationId,
      documentId,
      isAuthenticated = false,
      relevance = 'MEDIUM',
      privilege = 'NONE',
      physicalLocation,
      condition,
      tags,
      notes
    } = body;

    // Validate required fields
    if (!title || !type || !caseId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Title, type, caseId, and organizationId are required' },
        { status: 400 }
      );
    }

    // Create evidence record
    const evidence = await prisma.evidence.create({
      data: {
        title,
        description,
        type,
        category,
        source,
        location,
        custodian,
        caseId,
        organizationId,
        documentId,
        isAuthenticated,
        relevance,
        privilege,
        physicalLocation,
        condition,
        tags,
        notes,
        chainOfCustody: [{
          action: 'CREATED',
          timestamp: new Date().toISOString(),
          userId: body.userId || 'system',
          location: location || 'Digital',
          notes: `Evidence record created: ${title}`
        }]
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { evidence }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Evidence ID is required' },
        { status: 400 }
      );
    }

    // Get existing evidence for chain of custody
    const existing = await prisma.evidence.findUnique({
      where: { id },
      select: { chainOfCustody: true, title: true }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Evidence not found' },
        { status: 404 }
      );
    }

    // Update chain of custody
    const chainOfCustody = Array.isArray(existing.chainOfCustody) 
      ? existing.chainOfCustody 
      : [];
    
    chainOfCustody.push({
      action: 'UPDATED',
      timestamp: new Date().toISOString(),
      userId: updateData.userId || 'system',
      changes: Object.keys(updateData).filter(key => key !== 'userId'),
      notes: updateData.updateNotes || `Evidence record updated`
    });

    // Remove userId and updateNotes from update data
    delete updateData.userId;
    delete updateData.updateNotes;

    // Update evidence
    const evidence = await prisma.evidence.update({
      where: { id },
      data: {
        ...updateData,
        chainOfCustody,
        updatedAt: new Date()
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { evidence }
    });

  } catch (error) {
    console.error('Error updating evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Evidence ID is required' },
        { status: 400 }
      );
    }

    // Check if evidence exists
    const evidence = await prisma.evidence.findUnique({
      where: { id }
    });

    if (!evidence) {
      return NextResponse.json(
        { success: false, error: 'Evidence not found' },
        { status: 404 }
      );
    }

    // Delete evidence (this will cascade to related records)
    await prisma.evidence.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Evidence deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}