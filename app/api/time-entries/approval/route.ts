import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

// Validation schemas
const bulkApprovalSchema = z.object({
  entryIds: z.array(z.string()).min(1, 'At least one entry ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  comments: z.string().optional(),
  changes: z.object({
    description: z.string().optional(),
    duration: z.number().positive().optional(),
    billableRate: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
})

const approvalSettingsSchema = z.object({
  requiresApproval: z.boolean(),
  approvers: z.array(z.string()).optional(),
  autoApprovalThreshold: z.number().positive().optional(), // Auto-approve entries under this amount
  requiresReview: z.boolean().optional(),
  reviewers: z.array(z.string()).optional(),
})

// GET /api/time-entries/approval - Get entries requiring approval
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has approval permissions
    if (!['ADMIN', 'LAWYER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'SUBMITTED'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Get entries requiring approval
    const where = {
      organizationId: user.organizationId,
      isBillable: true,
      isInvoiced: false,
      // Add custom field for approval status when implemented
    }

    // For now, use a proxy for "requires approval" - entries that are billable but not yet invoiced
    const entries = await prisma.billingEntry.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            clientName: true,
            hourlyRate: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get summary statistics
    const stats = await prisma.billingEntry.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true },
    })

    // Group by status for dashboard
    const statusCounts = await prisma.billingEntry.groupBy({
      by: ['isBillable', 'isInvoiced'],
      where: { organizationId: user.organizationId },
      _count: { id: true },
      _sum: { amount: true },
    })

    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      projectId: entry.caseId,
      project: entry.case,
      description: entry.description,
      startTime: entry.startTime || entry.date,
      endTime: entry.endTime,
      duration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60,
      roundedDuration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60,
      status: entry.isInvoiced ? 'BILLED' : entry.isBillable ? 'SUBMITTED' : 'DRAFT',
      billableRate: entry.hourlyRate || entry.case?.hourlyRate || 0,
      totalAmount: entry.amount || 0,
      tags: entry.tags || [],
      notes: entry.notes,
      user: entry.user,
      submittedAt: entry.createdAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))

    return NextResponse.json({
      entries: transformedEntries,
      stats: {
        totalEntries: stats._count.id || 0,
        totalAmount: stats._sum.amount || 0,
        statusBreakdown: statusCounts.map(s => ({
          status: s.isInvoiced ? 'BILLED' : s.isBillable ? 'SUBMITTED' : 'DRAFT',
          count: s._count.id,
          amount: s._sum.amount || 0,
        }))
      },
      pagination: {
        page,
        limit,
        total: stats._count.id || 0,
        pages: Math.ceil((stats._count.id || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get approval entries error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/time-entries/approval - Bulk approve/reject entries
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has approval permissions
    if (!['ADMIN', 'LAWYER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, bulkApprovalSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const { entryIds, action, comments, changes } = validation.data

    // Verify all entries belong to the organization
    const entries = await prisma.billingEntry.findMany({
      where: {
        id: { in: entryIds },
        organizationId: user.organizationId,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    })

    if (entries.length !== entryIds.length) {
      return NextResponse.json({ error: 'Some entries not found' }, { status: 404 })
    }

    const results = []

    for (const entry of entries) {
      try {
        let updateData: any = {}

        switch (action) {
          case 'APPROVE':
            updateData = {
              isBillable: true,
              notes: comments ? `${entry.notes || ''}\n\nApproved by ${user.firstName} ${user.lastName}: ${comments}`.trim() : entry.notes,
            }
            
            // Apply any changes during approval
            if (changes) {
              if (changes.description) updateData.description = changes.description
              if (changes.duration) {
                updateData.hours = changes.duration / 3600
                updateData.minutes = Math.round((changes.duration % 3600) / 60)
              }
              if (changes.billableRate) updateData.hourlyRate = changes.billableRate
              if (changes.tags) updateData.tags = changes.tags
            }
            break

          case 'REJECT':
            updateData = {
              isBillable: false,
              notes: `${entry.notes || ''}\n\nRejected by ${user.firstName} ${user.lastName}: ${comments || 'No reason provided'}`.trim(),
            }
            break

          case 'REQUEST_CHANGES':
            updateData = {
              isBillable: false, // Move back to draft
              notes: `${entry.notes || ''}\n\nChanges requested by ${user.firstName} ${user.lastName}: ${comments || 'Changes needed'}`.trim(),
            }
            break
        }

        const updatedEntry = await prisma.billingEntry.update({
          where: { id: entry.id },
          data: updateData,
        })

        results.push({
          id: entry.id,
          action,
          success: true,
          entry: updatedEntry,
        })

        // TODO: Send notification to entry owner
        // await sendNotification({
        //   userId: entry.userId,
        //   type: 'TIME_ENTRY_STATUS_CHANGED',
        //   title: `Time Entry ${action.toLowerCase()}`,
        //   message: `Your time entry "${entry.description}" has been ${action.toLowerCase()}.`,
        //   actionUrl: `/time-entries/${entry.id}`,
        // })

      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error)
        results.push({
          id: entry.id,
          action,
          success: false,
          error: 'Failed to update entry',
        })
      }
    }

    // Create audit log entry
    await prisma.note.create({
      data: {
        title: `Bulk Time Entry ${action}`,
        content: `User ${user.firstName} ${user.lastName} performed bulk ${action} on ${entryIds.length} time entries. Comments: ${comments || 'None'}`,
        type: 'GENERAL',
        organizationId: user.organizationId,
        authorId: user.id,
        isPrivate: false,
        tags: ['time-entry', 'approval', action.toLowerCase()],
      }
    })

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    })

  } catch (error) {
    console.error('Bulk approval error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/time-entries/approval/settings - Update approval settings
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update approval settings
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, approvalSettingsSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const settings = validation.data

    // Update organization settings
    const updatedOrg = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        settings: {
          ...settings,
          timeEntryApproval: {
            requiresApproval: settings.requiresApproval,
            approvers: settings.approvers || [],
            autoApprovalThreshold: settings.autoApprovalThreshold,
            requiresReview: settings.requiresReview || false,
            reviewers: settings.reviewers || [],
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Approval settings updated successfully',
      settings: updatedOrg.settings,
    })

  } catch (error) {
    console.error('Update approval settings error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
