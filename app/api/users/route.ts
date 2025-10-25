import { NextRequest, NextResponse } from 'next/server'
import { AuthService, JWTPayload } from '@/lib/auth/jwt'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for user creation
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['LAWYER', 'PARALEGAL', 'ADMIN', 'CLIENT', 'SUPER_ADMIN']).optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  organizationId: z.string().optional()
})

// GET /api/users - List users (filtered by organization for non-admins)
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // SECURITY: Regular users can only see users in their organization
    let whereClause: any = {};

    if (user.role === 'SUPER_ADMIN') {
      // Super admins can filter by organizationId or see all
      if (organizationId) {
        whereClause.organizationId = organizationId;
      }
    } else if (user.role === 'ADMIN') {
      // Admins can only see users in their organization
      whereClause.organizationId = user.organizationId;
    } else {
      // Regular users cannot list all users
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        title: true,
        phone: true,
        avatar: true,
        timezone: true,
        organizationId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

// POST /api/users - Create new user (Admin only)
export const POST = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    // SECURITY: Only admins can create users
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create users' },
        { status: 403 }
      );
    }

    const body = await request.json()

    // Validate request body
    const validatedData = createUserSchema.parse(body)

    // SECURITY: Non-super-admins can only create users in their own organization
    let targetOrganizationId = validatedData.organizationId || user.organizationId;

    if (user.role !== 'SUPER_ADMIN') {
      targetOrganizationId = user.organizationId!;
    }

    if (!targetOrganizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: targetOrganizationId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(validatedData.password)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`,
        role: validatedData.role || 'LAWYER',
        title: validatedData.title,
        phone: validatedData.phone,
        organizationId: targetOrganizationId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        title: true,
        phone: true,
        avatar: true,
        timezone: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    return NextResponse.json(
      { success: true, user: newUser },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});
