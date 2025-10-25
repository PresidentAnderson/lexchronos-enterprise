import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/auth/jwt';

// GET /api/organizations - Get all organizations with pagination (Admin only)
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // SECURITY: Only ADMIN and SUPER_ADMIN can list all organizations
    // Regular users can only see their own organization
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      if (!user.organizationId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      // Return only user's organization
      const organization = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        include: {
          _count: {
            select: {
              users: true,
              cases: true,
              documents: true,
              timelines: true,
              billingEntries: true,
              courtDates: true,
              evidence: true,
              notes: true
            }
          }
        }
      });

      if (!organization) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: [organization],
        pagination: { page: 1, limit: 1, total: 1, pages: 1 }
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const result = await paginate(prisma.organization, {
      page,
      limit,
      sortBy,
      sortOrder,
      where,
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
            documents: true,
            timelines: true,
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
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/organizations - Create new organization (Admin only)
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // SECURITY: Only SUPER_ADMIN can create organizations
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only super admins can create organizations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      type = 'LAW_FIRM',
      email,
      phone,
      website,
      address,
      city,
      state,
      zipCode,
      country = 'US',
      taxId,
      barAssociation,
      license,
      subscriptionTier = 'BASIC',
      billingEmail,
      settings
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if organization already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { email }
    });

    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization with this email already exists' },
        { status: 409 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        type,
        email,
        phone,
        website,
        address,
        city,
        state,
        zipCode,
        country,
        taxId,
        barAssociation,
        license,
        subscriptionTier,
        billingEmail,
        settings,
        isActive: true
      },
      include: {
        _count: {
          select: {
            users: true,
            cases: true,
            documents: true
          }
        }
      }
    });

    return NextResponse.json(
      { success: true, data: organization },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});