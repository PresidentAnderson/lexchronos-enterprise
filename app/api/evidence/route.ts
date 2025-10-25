/**
 * Evidence Management API
 * Main endpoint for evidence CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const organizationId = searchParams.get('organizationId');
    const caseId = searchParams.get('caseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category');
    const confidentialityLevel = searchParams.get('confidentialityLevel');

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      organizationId: userOrganizationId
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
});

export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
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

    // SECURITY: Use authenticated user's organization and user ID
    const userOrganizationId = user.organizationId;
    const userUserId = user.userId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !type || !caseId) {
      return NextResponse.json(
        { success: false, error: 'Title, type, and caseId are required' },
        { status: 400 }
      );
    }

    // Verify case belongs to user's organization
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { organizationId: true }
    });

    if (!caseData || caseData.organizationId !== userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'Case not found or access denied' },
        { status: 404 }
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
        organizationId: userOrganizationId,
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
          userId: userUserId,
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
});

export const PUT = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Evidence ID is required' },
        { status: 400 }
      );
    }

    // SECURITY: Get existing evidence and verify organization access
    const existing = await prisma.evidence.findUnique({
      where: { id },
      select: { chainOfCustody: true, title: true, organizationId: true }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Evidence not found' },
        { status: 404 }
      );
    }

    if (existing.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update chain of custody
    const chainOfCustody = Array.isArray(existing.chainOfCustody) 
      ? existing.chainOfCustody 
      : [];
    
    chainOfCustody.push({
      action: 'UPDATED',
      timestamp: new Date().toISOString(),
      userId: user.userId,
      changes: Object.keys(updateData).filter(key => key !== 'userId' && key !== 'updateNotes'),
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
});

export const DELETE = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Evidence ID is required' },
        { status: 400 }
      );
    }

    // SECURITY: Check if evidence exists and user has access
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      select: { id: true, organizationId: true }
    });

    if (!evidence) {
      return NextResponse.json(
        { success: false, error: 'Evidence not found' },
        { status: 404 }
      );
    }

    if (evidence.organizationId !== user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // SECURITY: Only admins and lawyers can delete evidence
    if (user.role !== 'ADMIN' && user.role !== 'LAWYER' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete evidence' },
        { status: 403 }
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
});