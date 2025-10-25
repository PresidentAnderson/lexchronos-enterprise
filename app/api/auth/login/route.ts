import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/validation'
import { z } from 'zod'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = loginSchema.parse(body)

    // SECURITY: Find user by email using database
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            subscriptionTier: true
          }
        }
      }
    })

    if (!user) {
      // SECURITY: Return same error message for non-existent user to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact your administrator.' },
        { status: 403 }
      )
    }

    // Check if user has a password (some users might use SSO)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Please use Single Sign-On (SSO) to login.' },
        { status: 400 }
      )
    }

    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(
      validatedData.password,
      user.password
    )

    if (!isPasswordValid) {
      // SECURITY: Return same error message for invalid password
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Generate tokens
    const accessToken = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
      firstName: user.firstName,
      lastName: user.lastName
    })

    const refreshToken = AuthService.generateRefreshToken(user.id)

    // Return user data and tokens (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      title: user.title,
      phone: user.phone,
      avatar: user.avatar,
      timezone: user.timezone,
      organizationId: user.organizationId,
      organization: user.organization,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    }

    return NextResponse.json({
      user: userResponse,
      accessToken,
      refreshToken,
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
