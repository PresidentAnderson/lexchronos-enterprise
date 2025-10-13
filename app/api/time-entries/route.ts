import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

const prisma = new PrismaClient()

// Validation schemas
const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  description: z.string().min(1, 'Description is required').max(500),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().positive('Duration must be positive'),
  roundedDuration: z.number().positive('Rounded duration must be positive'),
  billableRate: z.number().min(0, 'Rate must be non-negative'),
  totalAmount: z.number().min(0, 'Amount must be non-negative'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'BILLED']).default('DRAFT'),
})

const timeEntryUpdateSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  duration: z.number().positive().optional(),
  roundedDuration: z.number().positive().optional(),
  billableRate: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'BILLED']).optional(),
})

const timeEntryQuerySchema = z.object({
  caseId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'BILLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  requiresApproval: z.string().transform(Boolean).optional(),
})

// GET /api/time-entries - Get time entries with filtering
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const query = timeEntryQuerySchema.parse(queryParams)

    const { page, limit, caseId, userId, status, startDate, endDate, requiresApproval } = query

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    }

    if (caseId) where.caseId = caseId
    if (userId) where.userId = userId
    if (status) where.status = status
    if (requiresApproval !== undefined) {
      // Join with case to check requiresApproval
      where.case = {
        ...where.case,
        // This would need to be implemented in the schema
      }
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }

    // Get total count
    const total = await prisma.billingEntry.count({ where })

    // Get entries with pagination
    const entries = await prisma.billingEntry.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            clientName: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform to match our enhanced structure
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      projectId: entry.caseId,
      project: entry.case,
      description: entry.description,
      startTime: entry.startTime || entry.date,
      endTime: entry.endTime || entry.date,
      duration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60,
      roundedDuration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60, // TODO: Apply actual rounding
      status: entry.isInvoiced ? 'BILLED' : entry.isBillable ? 'APPROVED' : 'DRAFT',
      billableRate: entry.hourlyRate || 0,
      totalAmount: entry.amount || 0,
      tags: [], // TODO: Parse from notes or separate field
      notes: entry.notes,
      user: entry.user,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))

    return NextResponse.json({
      entries: transformedEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get time entries error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/time-entries - Create new time entry
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, timeEntrySchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Verify the case/project belongs to the user's organization
    const project = await prisma.case.findFirst({
      where: {
        id: data.projectId,
        organizationId: user.organizationId,
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate duration if endTime is provided
    let duration = data.duration
    if (data.endTime) {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    }

    // Create billing entry (using existing schema)
    const entry = await prisma.billingEntry.create({
      data: {
        description: data.description,
        type: 'TIME',
        hours: data.roundedDuration / 3600,
        minutes: Math.round((data.roundedDuration % 3600) / 60),
        hourlyRate: data.billableRate,
        amount: data.totalAmount,
        date: new Date(data.startTime),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        organizationId: user.organizationId,
        caseId: data.projectId,
        userId: user.id,
        isBillable: data.status !== 'DRAFT',
        isInvoiced: data.status === 'BILLED',
        task: 'OTHER', // Default task type
        category: 'Time Entry',
        tags: data.tags,
        notes: data.notes,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            clientName: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    // Transform response
    const transformedEntry = {
      id: entry.id,
      projectId: entry.caseId,
      project: entry.case,
      description: entry.description,
      startTime: entry.startTime || entry.date,
      endTime: entry.endTime,
      duration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60,
      roundedDuration: entry.hours ? entry.hours * 3600 : (entry.minutes || 0) * 60,
      status: entry.isInvoiced ? 'BILLED' : entry.isBillable ? 'APPROVED' : 'DRAFT',
      billableRate: entry.hourlyRate || 0,
      totalAmount: entry.amount || 0,
      tags: entry.tags || [],
      notes: entry.notes,
      user: entry.user,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }

    return NextResponse.json({ entry: transformedEntry }, { status: 201 })

  } catch (error) {
    console.error('Create time entry error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/time-entries/[id] - Update time entry
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, timeEntryUpdateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Check if entry exists and belongs to user's organization
    const existingEntry = await prisma.billingEntry.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    // Check if user can edit this entry
    const canEdit = existingEntry.userId === user.id || 
                   user.role === 'ADMIN' || 
                   user.role === 'LAWYER'

    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the entry
    const updateData: any = {}
    
    if (data.description) updateData.description = data.description
    if (data.duration !== undefined) {
      updateData.hours = data.roundedDuration ? data.roundedDuration / 3600 : data.duration / 3600
      updateData.minutes = data.roundedDuration ? 
        Math.round((data.roundedDuration % 3600) / 60) : 
        Math.round((data.duration % 3600) / 60)
    }
    if (data.billableRate !== undefined) updateData.hourlyRate = data.billableRate
    if (data.totalAmount !== undefined) updateData.amount = data.totalAmount
    if (data.tags) updateData.tags = data.tags
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.status) {
      updateData.isBillable = data.status !== 'DRAFT'
      updateData.isInvoiced = data.status === 'BILLED'
    }

    const updatedEntry = await prisma.billingEntry.update({
      where: { id },
      data: updateData,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            clientName: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    // Transform response
    const transformedEntry = {
      id: updatedEntry.id,
      projectId: updatedEntry.caseId,
      project: updatedEntry.case,
      description: updatedEntry.description,
      startTime: updatedEntry.startTime || updatedEntry.date,
      endTime: updatedEntry.endTime,
      duration: updatedEntry.hours ? updatedEntry.hours * 3600 : (updatedEntry.minutes || 0) * 60,
      roundedDuration: updatedEntry.hours ? updatedEntry.hours * 3600 : (updatedEntry.minutes || 0) * 60,
      status: updatedEntry.isInvoiced ? 'BILLED' : updatedEntry.isBillable ? 'APPROVED' : 'DRAFT',
      billableRate: updatedEntry.hourlyRate || 0,
      totalAmount: updatedEntry.amount || 0,
      tags: updatedEntry.tags || [],
      notes: updatedEntry.notes,
      user: updatedEntry.user,
      createdAt: updatedEntry.createdAt,
      updatedAt: updatedEntry.updatedAt,
    }

    return NextResponse.json({ entry: transformedEntry })

  } catch (error) {
    console.error('Update time entry error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}