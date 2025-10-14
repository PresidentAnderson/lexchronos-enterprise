import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'
import DeadlineCalculator from '@/lib/deadline-calculator'

const prisma = new PrismaClient()

// Validation schemas
const triggerEventSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  triggerEvent: z.enum(['CASE_FILED', 'SERVICE_COMPLETED', 'ANSWER_DUE', 'DISCOVERY_OPENED', 'MOTION_FILED', 'HEARING_SCHEDULED', 'JUDGMENT_ENTERED', 'APPEAL_FILED', 'NOTICE_SERVED', 'SUMMONS_ISSUED', 'COMPLAINT_FILED', 'RESPONSE_DUE', 'TRIAL_DATE_SET', 'SETTLEMENT_CONFERENCE', 'CASE_MANAGEMENT_CONFERENCE', 'STATUS_CONFERENCE', 'CUSTOM_EVENT', 'OTHER']),
  triggerDate: z.string().datetime(),
  customEventName: z.string().optional(),
  metadata: z.any().optional(),
})

const deadlineTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerEvent: z.enum(['CASE_FILED', 'SERVICE_COMPLETED', 'ANSWER_DUE', 'DISCOVERY_OPENED', 'MOTION_FILED', 'HEARING_SCHEDULED', 'JUDGMENT_ENTERED', 'APPEAL_FILED', 'NOTICE_SERVED', 'SUMMONS_ISSUED', 'COMPLAINT_FILED', 'RESPONSE_DUE', 'TRIAL_DATE_SET', 'SETTLEMENT_CONFERENCE', 'CASE_MANAGEMENT_CONFERENCE', 'STATUS_CONFERENCE', 'CUSTOM_EVENT', 'OTHER']),
  timeLimit: z.number().positive(),
  timeLimitUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS']).default('DAYS'),
  calculationMethod: z.enum(['CALENDAR_DAYS', 'BUSINESS_DAYS', 'COURT_DAYS', 'CUSTOM']).default('BUSINESS_DAYS'),
  includeWeekends: z.boolean().default(true),
  includeHolidays: z.boolean().default(true),
  businessDaysOnly: z.boolean().default(false),
  courtRuleId: z.string().optional(),
  jurisdictionId: z.string().optional(),
  deadlineType: z.enum(['FILING', 'DISCOVERY', 'MOTION', 'RESPONSE', 'HEARING', 'TRIAL', 'APPEAL', 'STATUTE_OF_LIMITATIONS', 'OTHER']).default('FILING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  isExtendable: z.boolean().default(false),
  maxExtensions: z.number().int().positive().optional(),
  reminderDays: z.array(z.number().int().positive()).default([1, 3, 7]),
  isRecurring: z.boolean().default(false),
  instructions: z.string().optional(),
  requirements: z.any().optional(),
  forms: z.any().optional(),
  conditions: z.any().optional(),
  exceptions: z.any().optional(),
})

const overrideSchema = z.object({
  automatedDeadlineId: z.string().min(1, 'Automated deadline ID is required'),
  newDueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'COMPLETED_LATE', 'EXTENDED', 'WAIVED', 'CANCELLED']).optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

// GET /api/automated-deadlines - Get automated deadlines for a case or organization
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const caseId = url.searchParams.get('caseId')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Build where clause - handle missing organizationId
    const where: any = {}
    
    // If organizationId is available in JWT, use it for filtering
    if (user.organizationId) {
      where.case = { organizationId: user.organizationId }
    } else if (user.firmId) {
      // Fallback to firmId if available
      where.case = { organizationId: user.firmId }
    } else {
      // For demo/static mode or missing org info, don't filter by organization
      // This allows the API to work in demo mode
      console.warn('No organizationId or firmId found in user token, skipping organization filter')
    }

    if (caseId) where.caseId = caseId
    if (status) where.status = status

    // Get total count
    const total = await prisma.automatedDeadline.count({ where })

    // Get deadlines with pagination
    const deadlines = await prisma.automatedDeadline.findMany({
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
        template: {
          select: {
            id: true,
            name: true,
            deadlineType: true,
            priority: true,
            isExtendable: true,
            maxExtensions: true,
          }
        },
        courtRule: {
          select: {
            id: true,
            ruleNumber: true,
            title: true,
            jurisdiction: {
              select: {
                name: true,
                code: true,
              }
            }
          }
        },
        deadline: {
          select: {
            id: true,
            title: true,
            status: true,
            assignedTo: true,
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Calculate status summaries
    const statusSummaryWhere: any = {}
    if (user.organizationId) {
      statusSummaryWhere.case = { organizationId: user.organizationId }
    } else if (user.firmId) {
      statusSummaryWhere.case = { organizationId: user.firmId }
    }
    
    const statusSummary = await prisma.automatedDeadline.groupBy({
      by: ['status'],
      where: statusSummaryWhere,
      _count: { id: true },
    })

    return NextResponse.json({
      deadlines,
      summary: {
        total,
        statusBreakdown: statusSummary.map(s => ({
          status: s.status,
          count: s._count.id,
        }))
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get automated deadlines error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/automated-deadlines/trigger - Trigger deadline generation for an event
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, triggerEventSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const { caseId, triggerEvent, triggerDate, customEventName, metadata } = validation.data

    // Verify case belongs to user's organization
    const caseWhere: any = { id: caseId }
    if (user.organizationId) {
      caseWhere.organizationId = user.organizationId
    } else if (user.firmId) {
      caseWhere.organizationId = user.firmId
    }
    
    const caseRecord = await prisma.case.findFirst({
      where: caseWhere,
      include: {
        jurisdiction: true,
      }
    })

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Find applicable deadline templates
    const templates = await prisma.deadlineTemplate.findMany({
      where: {
        triggerEvent,
        isActive: true,
        OR: [
          { jurisdictionId: caseRecord.jurisdictionId },
          { jurisdictionId: null }, // Universal templates
        ]
      },
      include: {
        courtRule: true,
        jurisdiction: true,
      }
    })

    if (templates.length === 0) {
      return NextResponse.json({ 
        message: 'No deadline templates found for this trigger event',
        deadlinesCreated: []
      })
    }

    // Generate automated deadlines
    const calculator = new DeadlineCalculator()
    const generatedDeadlines = []

    for (const template of templates) {
      try {
        // Check conditions if any
        if (template.conditions) {
          // TODO: Implement condition checking logic
          // For now, proceed with all templates
        }

        // Calculate deadline
        const calculationResult = await calculator.calculateDeadline({
          triggerDate: new Date(triggerDate),
          timeLimit: template.timeLimit,
          timeLimitUnit: template.timeLimitUnit,
          calculationMethod: template.calculationMethod,
          includeWeekends: template.includeWeekends,
          includeHolidays: template.includeHolidays,
          businessDaysOnly: template.businessDaysOnly,
          jurisdictionId: template.jurisdictionId || caseRecord.jurisdictionId,
        })

        // Create automated deadline record
        const automatedDeadline = await prisma.automatedDeadline.create({
          data: {
            templateId: template.id,
            courtRuleId: template.courtRuleId,
            caseId: caseRecord.id,
            title: template.name,
            description: template.description,
            triggerEvent,
            triggerDate: new Date(triggerDate),
            dueDate: calculationResult.calculatedDate,
            originalDays: template.timeLimit,
            actualDays: calculationResult.actualDays,
            calculationMethod: template.calculationMethod,
            status: 'PENDING',
          },
          include: {
            template: {
              select: {
                name: true,
                deadlineType: true,
                priority: true,
                reminderDays: true,
              }
            }
          }
        })

        // Create corresponding deadline in the regular deadlines table
        const deadline = await prisma.deadline.create({
          data: {
            title: template.name,
            description: template.description || template.instructions,
            dueDate: calculationResult.calculatedDate,
            type: template.deadlineType,
            priority: template.priority,
            reminderDays: template.reminderDays,
            isRecurring: template.isRecurring,
            caseId: caseRecord.id,
            jurisdictionId: template.jurisdictionId || caseRecord.jurisdictionId,
            notes: `Auto-generated from template: ${template.name}`,
          }
        })

        // Link the automated deadline to the regular deadline
        await prisma.automatedDeadline.update({
          where: { id: automatedDeadline.id },
          data: { deadlineId: deadline.id }
        })

        generatedDeadlines.push({
          ...automatedDeadline,
          deadline: {
            id: deadline.id,
            title: deadline.title,
            dueDate: deadline.dueDate,
          }
        })

        // Save calculation for audit trail
        await calculator.saveCalculation(
          {
            triggerDate: new Date(triggerDate),
            timeLimit: template.timeLimit,
            timeLimitUnit: template.timeLimitUnit,
            calculationMethod: template.calculationMethod,
            includeWeekends: template.includeWeekends,
            includeHolidays: template.includeHolidays,
            businessDaysOnly: template.businessDaysOnly,
            jurisdictionId: template.jurisdictionId || caseRecord.jurisdictionId,
          },
          calculationResult,
          caseRecord.id,
          template.courtRuleId
        )

      } catch (error) {
        console.error(`Error generating deadline for template ${template.id}:`, error)
        // Continue with other templates
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedDeadlines.length} automated deadlines`,
      deadlinesCreated: generatedDeadlines,
      triggerEvent: {
        event: triggerEvent,
        date: triggerDate,
        case: {
          id: caseRecord.id,
          caseNumber: caseRecord.caseNumber,
          title: caseRecord.title,
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Trigger automated deadlines error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/automated-deadlines/override - Override an automated deadline
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, overrideSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const { automatedDeadlineId, newDueDate, status, reason, notes } = validation.data

    // Verify automated deadline exists and belongs to user's organization
    const automatedDeadlineWhere: any = { id: automatedDeadlineId }
    if (user.organizationId) {
      automatedDeadlineWhere.case = { organizationId: user.organizationId }
    } else if (user.firmId) {
      automatedDeadlineWhere.case = { organizationId: user.firmId }
    }
    
    const automatedDeadline = await prisma.automatedDeadline.findFirst({
      where: automatedDeadlineWhere,
      include: {
        deadline: true,
        case: { select: { id: true, caseNumber: true, title: true } }
      }
    })

    if (!automatedDeadline) {
      return NextResponse.json({ error: 'Automated deadline not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      isManualOverride: true,
      overrideReason: reason,
      overriddenBy: user.id || user.userId,
      overriddenAt: new Date(),
    }

    if (newDueDate) {
      updateData.dueDate = new Date(newDueDate)
    }

    if (status) {
      updateData.status = status
    }

    // Update the automated deadline
    const updatedAutomatedDeadline = await prisma.automatedDeadline.update({
      where: { id: automatedDeadlineId },
      data: updateData,
    })

    // Update the corresponding deadline if it exists
    if (automatedDeadline.deadline) {
      const deadlineUpdateData: any = {}
      
      if (newDueDate) {
        deadlineUpdateData.dueDate = new Date(newDueDate)
      }
      
      if (status === 'COMPLETED' || status === 'COMPLETED_LATE') {
        deadlineUpdateData.status = 'COMPLETED'
        deadlineUpdateData.completedAt = new Date()
        deadlineUpdateData.completedBy = user.id || user.userId
      } else if (status === 'CANCELLED' || status === 'WAIVED') {
        deadlineUpdateData.status = 'CANCELLED'
      }
      
      if (notes) {
        deadlineUpdateData.notes = `${automatedDeadline.deadline.notes || ''}\n\nOverride: ${reason}${notes ? ` - ${notes}` : ''}`.trim()
      }

      await prisma.deadline.update({
        where: { id: automatedDeadline.deadline.id },
        data: deadlineUpdateData,
      })
    }

    // Create audit log
    await prisma.note.create({
      data: {
        title: 'Automated Deadline Override',
        content: `User ${user.firstName || 'Unknown'} ${user.lastName || 'User'} overrode automated deadline "${automatedDeadline.title}" for case ${automatedDeadline.case.caseNumber}. Reason: ${reason}${notes ? ` Notes: ${notes}` : ''}`,
        type: 'GENERAL',
        organizationId: user.organizationId || user.firmId,
        caseId: automatedDeadline.case.id,
        authorId: user.id || user.userId,
        isPrivate: false,
        tags: ['automated-deadline', 'override'],
      }
    })

    return NextResponse.json({
      message: 'Automated deadline overridden successfully',
      automatedDeadline: updatedAutomatedDeadline,
      override: {
        reason,
        notes,
        overriddenBy: user.id || user.userId,
        overriddenAt: updateData.overriddenAt,
      }
    })

  } catch (error) {
    console.error('Override automated deadline error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}