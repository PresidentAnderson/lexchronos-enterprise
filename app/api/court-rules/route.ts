import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'

const prisma = new PrismaClient()

// Validation schemas
const courtRuleSchema = z.object({
  ruleNumber: z.string().min(1, 'Rule number is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fullText: z.string().optional(),
  category: z.enum(['PROCEDURAL', 'EVIDENCE', 'DISCOVERY', 'MOTION_PRACTICE', 'TRIAL_PRACTICE', 'APPEAL_PRACTICE', 'CRIMINAL', 'CIVIL', 'FAMILY', 'PROBATE', 'ADMINISTRATIVE', 'LOCAL_RULES', 'GENERAL', 'OTHER']).default('GENERAL'),
  subcategory: z.string().optional(),
  ruleType: z.enum(['PROCEDURAL', 'SUBSTANTIVE', 'ADMINISTRATIVE', 'LOCAL', 'PRACTICE_GUIDE', 'FORM', 'OTHER']).default('PROCEDURAL'),
  jurisdictionId: z.string().min(1, 'Jurisdiction is required'),
  timeLimit: z.number().int().positive().optional(),
  timeLimitUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS']).default('DAYS'),
  calculationRules: z.any().optional(),
  exceptions: z.any().optional(),
  triggers: z.any().optional(),
  dependencies: z.any().optional(),
  citations: z.any().optional(),
  amendments: z.any().optional(),
  relatedRules: z.any().optional(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

const jurisdictionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['FEDERAL_DISTRICT', 'FEDERAL_APPEALS', 'FEDERAL_SUPREME', 'STATE_SUPREME', 'STATE_APPEALS', 'STATE_TRIAL', 'STATE_MUNICIPAL', 'STATE_COUNTY', 'ADMINISTRATIVE', 'BANKRUPTCY', 'TAX_COURT', 'IMMIGRATION', 'OTHER']),
  code: z.string().min(1, 'Code is required'),
  state: z.string().optional(),
  county: z.string().optional(),
  district: z.string().optional(),
  country: z.string().default('US'),
  courtName: z.string().optional(),
  courtType: z.enum(['TRIAL', 'APPEALS', 'SUPREME', 'ADMINISTRATIVE', 'SPECIALTY']).default('TRIAL'),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  timeZone: z.string().default('UTC'),
  businessHours: z.any().optional(),
  filingMethods: z.any().optional(),
  settings: z.any().optional(),
})

const querySchema = z.object({
  jurisdictionId: z.string().optional(),
  category: z.string().optional(),
  ruleType: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('50'),
  includeInactive: z.string().transform(Boolean).optional(),
})

// GET /api/court-rules - Get court rules with filtering
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const query = querySchema.parse(queryParams)

    const { page, limit, jurisdictionId, category, ruleType, search, includeInactive } = query

    // Build where clause
    const where: any = {}

    if (jurisdictionId) where.jurisdictionId = jurisdictionId
    if (category) where.category = category
    if (ruleType) where.ruleType = ruleType
    if (!includeInactive) where.isActive = true

    if (search) {
      where.OR = [
        { ruleNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fullText: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await prisma.courtRule.count({ where })

    // Get rules with pagination
    const rules = await prisma.courtRule.findMany({
      where,
      include: {
        jurisdiction: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            state: true,
            courtName: true,
          }
        },
        deadlineTemplates: {
          select: {
            id: true,
            name: true,
            triggerEvent: true,
            timeLimit: true,
            timeLimitUnit: true,
            deadlineType: true,
          }
        },
        _count: {
          select: {
            deadlineTemplates: true,
            automatedDeadlines: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { ruleNumber: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      rules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get court rules error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/court-rules - Create new court rule
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and lawyers can create rules
    if (!['ADMIN', 'LAWYER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, courtRuleSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Verify jurisdiction exists
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: data.jurisdictionId }
    })

    if (!jurisdiction) {
      return NextResponse.json({ error: 'Jurisdiction not found' }, { status: 404 })
    }

    // Check for duplicate rule number in same jurisdiction
    const existingRule = await prisma.courtRule.findFirst({
      where: {
        jurisdictionId: data.jurisdictionId,
        ruleNumber: data.ruleNumber,
      }
    })

    if (existingRule) {
      return NextResponse.json({ 
        error: 'Rule number already exists in this jurisdiction' 
      }, { status: 409 })
    }

    // Create the rule
    const rule = await prisma.courtRule.create({
      data: {
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
      include: {
        jurisdiction: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            state: true,
            courtName: true,
          }
        }
      }
    })

    return NextResponse.json({ rule }, { status: 201 })

  } catch (error) {
    console.error('Create court rule error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/court-rules/jurisdictions - Create new jurisdiction
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create jurisdictions
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, jurisdictionSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Check for duplicate code
    const existingJurisdiction = await prisma.jurisdiction.findUnique({
      where: { code: data.code }
    })

    if (existingJurisdiction) {
      return NextResponse.json({ 
        error: 'Jurisdiction code already exists' 
      }, { status: 409 })
    }

    // Create the jurisdiction
    const jurisdiction = await prisma.jurisdiction.create({
      data: data,
      include: {
        _count: {
          select: {
            courtRules: true,
            cases: true,
          }
        }
      }
    })

    return NextResponse.json({ jurisdiction }, { status: 201 })

  } catch (error) {
    console.error('Create jurisdiction error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}