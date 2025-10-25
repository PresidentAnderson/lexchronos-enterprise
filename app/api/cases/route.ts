import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/cases - Get all cases with pagination
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');

    // SECURITY: Filter by user's organization to ensure data isolation
    const where: any = {
      organizationId: user.organizationId || organizationId
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    const result = await paginate(prisma.case, {
      page,
      limit,
      sortBy,
      sortOrder,
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            documents: true,
            timelines: true,
            deadlines: true,
            billingEntries: true,
            courtDates: true,
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
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/cases - Create new case
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const body = await request.json();
    const {
      caseNumber,
      title,
      description,
      type = 'CIVIL',
      status = 'ACTIVE',
      priority = 'MEDIUM',
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      court,
      judge,
      opposingParty,
      opposingCounsel,
      filingDate,
      startDate = new Date(),
      closeDate,
      statuteOfLimitations,
      estimatedValue,
      contingencyFee,
      hourlyRate,
      organizationId,
      assigneeId,
      tags,
      customFields
    } = body;

    // SECURITY: Use authenticated user's organization
    const userOrganizationId = user.organizationId || organizationId;

    // Validate required fields
    if (!caseNumber || !title || !clientName) {
      return NextResponse.json(
        { success: false, error: 'Case number, title, and client name are required' },
        { status: 400 }
      );
    }

    if (!userOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'User not associated with an organization' },
        { status: 403 }
      );
    }

    // Check if case number already exists
    const existingCase = await prisma.case.findUnique({
      where: { caseNumber }
    });

    if (existingCase) {
      return NextResponse.json(
        { success: false, error: 'Case with this case number already exists' },
        { status: 409 }
      );
    }

    // Validate organization exists and user has access
    const organization = await prisma.organization.findUnique({
      where: { id: userOrganizationId }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return NextResponse.json(
          { success: false, error: 'Assignee not found' },
          { status: 404 }
        );
      }
    }

    const caseData = await prisma.case.create({
      data: {
        caseNumber,
        title,
        description,
        type,
        status,
        priority,
        clientName,
        clientEmail,
        clientPhone,
        clientAddress,
        court,
        judge,
        opposingParty,
        opposingCounsel,
        filingDate: filingDate ? new Date(filingDate) : null,
        startDate: new Date(startDate),
        closeDate: closeDate ? new Date(closeDate) : null,
        statuteOfLimitations: statuteOfLimitations ? new Date(statuteOfLimitations) : null,
        estimatedValue,
        contingencyFee,
        hourlyRate,
        organizationId: userOrganizationId,
        assigneeId,
        tags,
        customFields
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(
      { success: true, data: caseData },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});