import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/validation'
import { z } from 'zod'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

type SupabaseUserMetadata = {
  firstName?: string
  lastName?: string
  role?: string
  organizationId?: string
  phone?: string
  [key: string]: unknown
}

const resolveUserRole = (role?: string | null, fallback?: UserRole): UserRole => {
  if (role) {
    const normalized = role.toUpperCase()
    if ((Object.values(UserRole) as string[]).includes(normalized)) {
      return normalized as UserRole
    }
  }

  return fallback ?? UserRole.LAWYER
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      )
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (error || !data?.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const supabaseUser = data.user
    const metadata = (supabaseUser.user_metadata || {}) as SupabaseUserMetadata
    const now = new Date()

    const desiredFirstName = metadata.firstName || body.firstName || supabaseUser.email?.split('@')[0] || 'User'
    const desiredLastName = metadata.lastName || body.lastName || 'Account'
    const desiredRole = resolveUserRole(
      metadata.role as string | undefined,
      undefined
    )

    let userProfile = await prisma.user.findUnique({ where: { id: supabaseUser.id } })

    if (!userProfile) {
      userProfile = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email ?? email,
          firstName: desiredFirstName,
          lastName: desiredLastName,
          fullName: `${desiredFirstName} ${desiredLastName}`.trim(),
          role: desiredRole,
          organizationId: (metadata.organizationId as string | undefined) || null,
          phone: (metadata.phone as string | undefined) || null,
          isActive: true,
          lastLogin: now,
        },
      })
    } else {
      const updatedFirstName = metadata.firstName ?? userProfile.firstName
      const updatedLastName = metadata.lastName ?? userProfile.lastName
      const updatedRole = resolveUserRole(metadata.role as string | undefined, userProfile.role)

      userProfile = await prisma.user.update({
        where: { id: supabaseUser.id },
        data: {
          email: supabaseUser.email ?? userProfile.email,
          firstName: updatedFirstName,
          lastName: updatedLastName,
          fullName: `${updatedFirstName} ${updatedLastName}`.trim(),
          role: updatedRole,
          organizationId: (metadata.organizationId as string | undefined) ?? userProfile.organizationId,
          phone: (metadata.phone as string | undefined) ?? userProfile.phone,
          lastLogin: now,
        },
      })
    }

    const accessToken = AuthService.generateToken({
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      organizationId: userProfile.organizationId ?? undefined,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
    })

    const refreshToken = AuthService.generateRefreshToken(userProfile.id)

    const { password: _password, ...userWithoutPassword } = userProfile

    return NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresIn: data.session.expires_in,
            expiresAt: data.session.expires_at,
          }
        : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
