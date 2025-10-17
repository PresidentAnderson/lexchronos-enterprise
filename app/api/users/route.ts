import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'
import { userSchema } from '@/lib/validation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { UserRole } from '@prisma/client'

const resolveUserRole = (role?: string | null): UserRole => {
  if (role) {
    const normalized = role.toUpperCase()
    if ((Object.values(UserRole) as string[]).includes(normalized)) {
      return normalized as UserRole
    }
  }

  return UserRole.LAWYER
}

function authenticateRequest(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return null
  }

  const token = AuthService.extractTokenFromHeader(authorization)
  if (!token) {
    return null
  }

  return AuthService.verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const user = authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const sanitizedUsers = users.map(({ password, ...userData }) => userData)

    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validatedData = userSchema.parse(body)

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'User management service unavailable' },
        { status: 503 }
      )
    }

    const role = resolveUserRole(body.role as string | undefined)
    const organizationId = body.organizationId ? String(body.organizationId) : null

    const { data: supabaseResult, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        role,
        organizationId,
      },
    })

    if (supabaseError || !supabaseResult?.user) {
      const status = supabaseError?.status ?? 400
      const message = supabaseError?.message || 'Unable to create user'
      return NextResponse.json(
        { error: message },
        { status: status === 409 ? 409 : status }
      )
    }

    const newUser = await prisma.user.create({
      data: {
        id: supabaseResult.user.id,
        email: supabaseResult.user.email ?? validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        fullName: `${validatedData.firstName} ${validatedData.lastName}`.trim(),
        role,
        phone: validatedData.phone,
        organizationId,
        isActive: true,
        password: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    const { password, ...userWithoutPassword } = newUser

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
