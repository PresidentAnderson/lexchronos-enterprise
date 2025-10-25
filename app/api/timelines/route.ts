import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/timelines - Get all timeline events with pagination
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'eventDate';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');
    const caseId = searchParams.get('caseId');
    const organizationId = searchParams.get('organizationId');
    const eventType = searchParams.get('eventType');
    const importance = searchParams.get('importance');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // SECURITY: Filter by user's organization to ensure data isolation
    const where: any = {
      organizationId: user.organizationId || organizationId
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (caseId) {
      where.caseId = caseId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (importance) {
      where.importance = importance;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.eventDate = {};
      if (startDate) {
        where.eventDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.eventDate.lte = new Date(endDate);
      }
    }

    const result = await paginate(prisma.timeline, {
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/timelines - Create new timeline event
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      eventType = 'GENERAL',
      eventDate,
      endDate,
      location,
      participants,
      organizationId,
      caseId,
      createdById,
      importance = 'NORMAL',
      isVerified = false,
      source,
      tags,
      attachments
    } = body;

    // SECURITY: Use authenticated user's organization and user ID
    const userOrganizationId = user.organizationId || organizationId;
    const userCreatorId = user.userId;

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !eventDate || !caseId) {
      return NextResponse.json(
        { success: false, error: 'Title, event date, and case are required' },
        { status: 400 }
      );
    }

    // Validate case exists and belongs to organization
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { organizationId: true }
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

    const timeline = await prisma.timeline.create({
      data: {
        title,
        description,
        eventType,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        participants,
        organizationId: userOrganizationId,
        caseId,
        createdById: userCreatorId,
        importance,
        isVerified,
        source,
        tags,
        attachments
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

    return NextResponse.json(
      { success: true, data: timeline },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating timeline event:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});