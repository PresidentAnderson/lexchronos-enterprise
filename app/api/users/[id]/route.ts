import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { UserRole } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
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

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
          },
        },
        assignedCases: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
            priority: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            assignedCases: true,
            documents: true,
            billingEntries: true,
            notes: true,
            assignedDeadlines: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      organizationId,
      phone,
      title,
      barNumber,
      biography,
      avatar,
      timezone,
      isActive,
    } = body

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'User management service unavailable' },
        { status: 503 }
      )
    }

    const { data: supabaseUserData } = await supabaseAdmin.auth.admin.getUserById(id)
    const supabaseMetadata = (supabaseUserData?.user?.user_metadata ?? {}) as Record<string, unknown>

    const nextRole = resolveUserRole(role as string | undefined, existingUser.role)

    const metadataUpdates: Record<string, unknown> = {
      ...supabaseMetadata,
    }

    if (firstName !== undefined) metadataUpdates.firstName = firstName
    if (lastName !== undefined) metadataUpdates.lastName = lastName
    if (phone !== undefined) metadataUpdates.phone = phone
    if (role !== undefined) metadataUpdates.role = nextRole
    if (organizationId !== undefined) metadataUpdates.organizationId = organizationId

    const supabaseUpdatePayload: {
      email?: string
      password?: string
      user_metadata?: Record<string, unknown>
    } = {}

    if (email !== undefined) {
      supabaseUpdatePayload.email = email
    }

    if (password) {
      supabaseUpdatePayload.password = password
    }

    if (Object.keys(metadataUpdates).length > 0) {
      supabaseUpdatePayload.user_metadata = metadataUpdates
    }

    if (Object.keys(supabaseUpdatePayload).length > 0) {
      const { error: supabaseUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        supabaseUpdatePayload
      )

      if (supabaseUpdateError) {
        return NextResponse.json(
          { success: false, error: supabaseUpdateError.message || 'Failed to update Supabase user' },
          { status: supabaseUpdateError.status ?? 400 }
        )
      }
    }

    const updateData: any = {}

    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = nextRole
    if (organizationId !== undefined) updateData.organizationId = organizationId
    if (phone !== undefined) updateData.phone = phone
    if (title !== undefined) updateData.title = title
    if (barNumber !== undefined) updateData.barNumber = barNumber
    if (biography !== undefined) updateData.biography = biography
    if (avatar !== undefined) updateData.avatar = avatar
    if (timezone !== undefined) updateData.timezone = timezone
    if (isActive !== undefined) updateData.isActive = isActive

    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName ?? existingUser.firstName
      const newLastName = lastName ?? existingUser.lastName
      updateData.fullName = `${newFirstName} ${newLastName}`.trim()
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    const { password: _password, ...userResponse } = updatedUser

    return NextResponse.json({
      success: true,
      data: userResponse,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'User management service unavailable' },
        { status: 503 }
      )
    }

    const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (supabaseError) {
      return NextResponse.json(
        { success: false, error: supabaseError.message || 'Failed to delete Supabase user' },
        { status: supabaseError.status ?? 400 }
      )
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
