import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

// Validation schemas
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
  source: z.enum(['WEBSITE', 'REFERRAL', 'GOOGLE_ADS', 'SOCIAL_MEDIA', 'PHONE_CALL', 'EMAIL', 'WALK_IN', 'EVENT', 'DIRECTORY', 'PREVIOUS_CLIENT', 'OTHER']).default('WEBSITE'),
  sourceDetails: z.string().optional(),
  legalIssue: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedValue: z.number().positive().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'LOST', 'DISQUALIFIED']).default('NEW'),
  qualificationStatus: z.enum(['UNQUALIFIED', 'QUALIFIED', 'HOT_LEAD', 'WARM_LEAD', 'COLD_LEAD']).default('UNQUALIFIED'),
  assignedToId: z.string().optional(),
  lastContactDate: z.string().datetime().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  contactAttempts: z.number().int().min(0).default(0),
  marketingData: z.any().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  customFields: z.any().optional(),
})

const leadUpdateSchema = leadSchema.partial().omit({ email: true })

const querySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  assignedToId: z.string().optional(),
  urgency: z.string().optional(),
  qualificationStatus: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const conversionSchema = z.object({
  caseTitle: z.string().min(1, 'Case title is required'),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'FAMILY', 'CORPORATE', 'REAL_ESTATE', 'IMMIGRATION', 'BANKRUPTCY', 'PERSONAL_INJURY', 'EMPLOYMENT', 'INTELLECTUAL_PROPERTY', 'TAX', 'OTHER']).default('CIVIL'),
  description: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  estimatedValue: z.number().positive().optional(),
  contingencyFee: z.number().min(0).max(100).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

// GET /api/leads - Get leads with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const query = querySchema.parse(queryParams)

    const {
      status,
      source,
      assignedToId,
      urgency,
      qualificationStatus,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder
    } = query

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    }

    if (status) where.status = status
    if (source) where.source = source
    if (assignedToId) where.assignedToId = assignedToId
    if (urgency) where.urgency = urgency
    if (qualificationStatus) where.qualificationStatus = qualificationStatus

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { legalIssue: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Get total count for pagination
    const total = await prisma.lead.count({ where })

    // Get leads with related data
    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
          }
        },
        convertedToCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            subject: true,
            completedAt: true,
            outcome: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        communications: {
          select: {
            id: true,
            type: true,
            direction: true,
            subject: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            activities: true,
            communications: true,
            intakeResponses: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate conversion and engagement metrics
    const metrics = await prisma.lead.aggregate({
      where: { organizationId: user.organizationId },
      _count: { id: true },
      _avg: { estimatedValue: true },
    })

    const statusBreakdown = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    })

    const sourceBreakdown = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: user.organizationId },
      _count: { id: true },
    })

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      metrics: {
        totalLeads: metrics._count.id,
        averageValue: metrics._avg.estimatedValue || 0,
        statusBreakdown: statusBreakdown.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        sourceBreakdown: sourceBreakdown.map(s => ({
          source: s.source,
          count: s._count.id,
        })),
      }
    })

  } catch (error) {
    console.error('Get leads error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads - Create new lead
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, leadSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Check for duplicate email
    const existingLead = await prisma.lead.findFirst({
      where: {
        email: data.email,
        organizationId: user.organizationId,
      }
    })

    if (existingLead) {
      return NextResponse.json({ 
        error: 'Lead with this email already exists',
        existingLead: {
          id: existingLead.id,
          name: existingLead.fullName,
          status: existingLead.status,
        }
      }, { status: 409 })
    }

    // Generate full name
    const fullName = `${data.firstName} ${data.lastName}`.trim()

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        ...data,
        fullName,
        organizationId: user.organizationId,
        lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        assignedAt: data.assignedToId ? new Date() : null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    // Create initial activity
    await prisma.leadActivity.create({
      data: {
        type: 'OTHER',
        subject: 'Lead Created',
        description: `Lead created from ${data.source}${data.sourceDetails ? `: ${data.sourceDetails}` : ''}`,
        outcome: 'COMPLETED',
        completedAt: new Date(),
        leadId: lead.id,
        performedById: user.id,
      }
    })

    // Auto-assign based on organization rules (if configured)
    // TODO: Implement auto-assignment logic based on practice area, case type, etc.

    // Send notifications if assigned
    if (data.assignedToId) {
      // TODO: Send notification to assigned user
      // await sendNotification({
      //   userId: data.assignedToId,
      //   type: 'LEAD_ASSIGNED',
      //   title: 'New Lead Assigned',
      //   message: `You have been assigned a new lead: ${fullName}`,
      //   actionUrl: `/leads/${lead.id}`,
      // })
    }

    return NextResponse.json({ lead }, { status: 201 })

  } catch (error) {
    console.error('Create lead error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/leads/[id] - Update lead
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, leadUpdateSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Check if lead exists and belongs to organization
    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      }
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update full name if first or last name changed
    let updateData = { ...data }
    if (data.firstName || data.lastName) {
      const firstName = data.firstName || existingLead.firstName
      const lastName = data.lastName || existingLead.lastName
      updateData.fullName = `${firstName} ${lastName}`.trim()
    }

    // Handle assignment changes
    if (data.assignedToId !== undefined) {
      updateData.assignedAt = data.assignedToId ? new Date() : null
    }

    // Handle date fields
    if (data.lastContactDate) {
      updateData.lastContactDate = new Date(data.lastContactDate)
    }
    if (data.nextFollowUpDate) {
      updateData.nextFollowUpDate = new Date(data.nextFollowUpDate)
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            subject: true,
            completedAt: true,
            outcome: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    })

    // Create activity for significant changes
    const significantChanges = ['status', 'qualificationStatus', 'assignedToId']
    const changedFields = significantChanges.filter(field => data[field] !== undefined)
    
    if (changedFields.length > 0) {
      const changes = changedFields.map(field => `${field}: ${data[field]}`).join(', ')
      await prisma.leadActivity.create({
        data: {
          type: 'OTHER',
          subject: 'Lead Updated',
          description: `Lead updated: ${changes}`,
          outcome: 'COMPLETED',
          completedAt: new Date(),
          leadId: id,
          performedById: user.id,
        }
      })
    }

    return NextResponse.json({ lead: updatedLead })

  } catch (error) {
    console.error('Update lead error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads/[id]/convert - Convert lead to case
export async function PATCH(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const id = pathSegments[pathSegments.length - 2] // Get ID before /convert
    const action = pathSegments[pathSegments.length - 1] // Get action (convert)

    if (!id || action !== 'convert') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, conversionSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Check if lead exists and can be converted
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        status: { not: 'CONVERTED' },
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or already converted' }, { status: 404 })
    }

    // Generate case number
    const caseCount = await prisma.case.count({
      where: { organizationId: user.organizationId }
    })
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(caseCount + 1).padStart(4, '0')}`

    // Create client profile
    const clientProfile = await prisma.clientProfile.create({
      data: {
        type: 'INDIVIDUAL',
        firstName: lead.firstName,
        lastName: lead.lastName,
        displayName: lead.fullName,
        primaryEmail: lead.email,
        primaryPhone: lead.phone,
        mailingAddress: lead.address,
        mailingCity: lead.city,
        mailingState: lead.state,
        mailingZipCode: lead.zipCode,
        mailingCountry: lead.country,
        organizationId: user.organizationId,
        createdBy: user.id,
        notes: `Converted from lead: ${lead.notes || ''}`.trim(),
        customFields: lead.customFields,
        tags: lead.tags,
      }
    })

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: data.caseTitle,
        description: data.description || lead.legalIssue,
        type: data.caseType,
        status: 'ACTIVE',
        priority: data.priority,
        clientName: lead.fullName,
        clientEmail: lead.email,
        clientPhone: lead.phone,
        clientAddress: lead.address,
        estimatedValue: data.estimatedValue || lead.estimatedValue,
        contingencyFee: data.contingencyFee,
        hourlyRate: data.hourlyRate,
        organizationId: user.organizationId,
        assigneeId: data.assigneeId || lead.assignedToId,
        clientProfileId: clientProfile.id,
        tags: lead.tags,
        customFields: lead.customFields,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        clientProfile: true,
      }
    })

    // Update lead status to converted
    const convertedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        qualificationStatus: 'QUALIFIED',
        convertedToCaseId: newCase.id,
        convertedAt: new Date(),
        convertedBy: user.id,
      },
      include: {
        convertedToCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          }
        }
      }
    })

    // Create conversion activity
    await prisma.leadActivity.create({
      data: {
        type: 'OTHER',
        subject: 'Lead Converted to Case',
        description: `Lead successfully converted to case ${caseNumber}: ${data.caseTitle}`,
        outcome: 'COMPLETED',
        completedAt: new Date(),
        leadId: id,
        performedById: user.id,
      }
    })

    // Create initial case timeline entry
    await prisma.timeline.create({
      data: {
        title: 'Case Created from Lead',
        description: `Case created from converted lead: ${lead.fullName}`,
        eventType: 'GENERAL',
        eventDate: new Date(),
        organizationId: user.organizationId,
        caseId: newCase.id,
        createdById: user.id,
        importance: 'NORMAL',
        isVerified: true,
        source: 'Lead Conversion',
      }
    })

    return NextResponse.json({
      message: 'Lead successfully converted to case',
      lead: convertedLead,
      case: newCase,
      clientProfile,
    }, { status: 201 })

  } catch (error) {
    console.error('Convert lead error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
