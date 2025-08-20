import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/jwt'
import { z } from 'zod'
import { validateRequest } from '@/lib/validation'
import DeadlineCalculator, { DeadlineCalculationInput } from '@/lib/deadline-calculator'

// Validation schema
const calculationSchema = z.object({
  triggerDate: z.string().datetime(),
  timeLimit: z.number().positive(),
  timeLimitUnit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS']).default('DAYS'),
  calculationMethod: z.enum(['CALENDAR_DAYS', 'BUSINESS_DAYS', 'COURT_DAYS', 'CUSTOM']).default('BUSINESS_DAYS'),
  includeWeekends: z.boolean().default(true),
  includeHolidays: z.boolean().default(true),
  businessDaysOnly: z.boolean().default(false),
  jurisdictionId: z.string().optional(),
  caseId: z.string().optional(),
  ruleId: z.string().optional(),
  saveCalculation: z.boolean().default(false),
})

const bulkCalculationSchema = z.object({
  calculations: z.array(calculationSchema).min(1).max(100),
  saveCalculations: z.boolean().default(false),
})

// POST /api/deadline-calculator - Calculate single deadline
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, calculationSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const data = validation.data

    // Create calculator instance
    const calculator = new DeadlineCalculator()

    // Prepare calculation input
    const input: DeadlineCalculationInput = {
      triggerDate: new Date(data.triggerDate),
      timeLimit: data.timeLimit,
      timeLimitUnit: data.timeLimitUnit,
      calculationMethod: data.calculationMethod,
      includeWeekends: data.includeWeekends,
      includeHolidays: data.includeHolidays,
      businessDaysOnly: data.businessDaysOnly,
      jurisdictionId: data.jurisdictionId,
    }

    // Calculate deadline
    const result = await calculator.calculateDeadline(input)

    // Save calculation if requested
    let calculationRecord = null
    if (data.saveCalculation) {
      calculationRecord = await calculator.saveCalculation(
        input,
        result,
        data.caseId,
        data.ruleId
      )
    }

    return NextResponse.json({
      input: {
        triggerDate: data.triggerDate,
        timeLimit: data.timeLimit,
        timeLimitUnit: data.timeLimitUnit,
        calculationMethod: data.calculationMethod,
      },
      result: {
        calculatedDate: result.calculatedDate.toISOString(),
        actualDays: result.actualDays,
        skippedDays: result.skippedDays,
        skippedDetails: result.skippedDetails,
        warnings: result.warnings,
        calculationSteps: result.calculationSteps.map(step => ({
          ...step,
          date: step.date.toISOString()
        }))
      },
      calculation: calculationRecord ? {
        id: calculationRecord.id,
        createdAt: calculationRecord.createdAt,
      } : null
    })

  } catch (error) {
    console.error('Deadline calculation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Calculation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// POST /api/deadline-calculator/bulk - Calculate multiple deadlines
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = await validateRequest(body, bulkCalculationSchema)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const { calculations, saveCalculations } = validation.data

    // Create calculator instance
    const calculator = new DeadlineCalculator()

    // Prepare calculation inputs
    const inputs: DeadlineCalculationInput[] = calculations.map(calc => ({
      triggerDate: new Date(calc.triggerDate),
      timeLimit: calc.timeLimit,
      timeLimitUnit: calc.timeLimitUnit,
      calculationMethod: calc.calculationMethod,
      includeWeekends: calc.includeWeekends,
      includeHolidays: calc.includeHolidays,
      businessDaysOnly: calc.businessDaysOnly,
      jurisdictionId: calc.jurisdictionId,
    }))

    // Calculate all deadlines
    const results = await calculator.calculateBulkDeadlines(inputs)

    // Save calculations if requested
    const calculationRecords = []
    if (saveCalculations) {
      for (let i = 0; i < inputs.length; i++) {
        try {
          const record = await calculator.saveCalculation(
            inputs[i],
            results[i],
            calculations[i].caseId,
            calculations[i].ruleId
          )
          calculationRecords.push(record)
        } catch (error) {
          console.error(`Error saving calculation ${i}:`, error)
          calculationRecords.push(null)
        }
      }
    }

    // Format response
    const response = calculations.map((calc, index) => ({
      input: {
        triggerDate: calc.triggerDate,
        timeLimit: calc.timeLimit,
        timeLimitUnit: calc.timeLimitUnit,
        calculationMethod: calc.calculationMethod,
      },
      result: results[index] ? {
        calculatedDate: results[index].calculatedDate.toISOString(),
        actualDays: results[index].actualDays,
        skippedDays: results[index].skippedDays,
        skippedDetails: results[index].skippedDetails,
        warnings: results[index].warnings,
        calculationSteps: results[index].calculationSteps.map(step => ({
          ...step,
          date: step.date.toISOString()
        }))
      } : null,
      calculation: calculationRecords[index] ? {
        id: calculationRecords[index].id,
        createdAt: calculationRecords[index].createdAt,
      } : null,
      error: results[index]?.warnings.find(w => w.startsWith('Error:')) || null
    }))

    const summary = {
      total: calculations.length,
      successful: results.filter(r => r && !r.warnings.some(w => w.startsWith('Error:'))).length,
      failed: results.filter(r => !r || r.warnings.some(w => w.startsWith('Error:'))).length,
    }

    return NextResponse.json({ calculations: response, summary })

  } catch (error) {
    console.error('Bulk deadline calculation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ 
      error: 'Bulk calculation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}