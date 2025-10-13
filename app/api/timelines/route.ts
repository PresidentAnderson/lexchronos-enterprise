import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';

// GET /api/timelines - Get all timeline events with pagination
export async function GET(request: NextRequest) {
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

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (caseId) {
      where.caseId = caseId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
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
}

// POST /api/timelines - Create new timeline event
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!title || !eventDate || !organizationId || !caseId || !createdById) {
      return NextResponse.json(
        { success: false, error: 'Title, event date, organization, case, and creator are required' },
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

    if (caseData.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Case does not belong to this organization' },
        { status: 400 }
      );
    }

    // Validate creator exists
    const creator = await prisma.user.findUnique({
      where: { id: createdById }
    });

    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator not found' },
        { status: 404 }
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
        organizationId,
        caseId,
        createdById,
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
}