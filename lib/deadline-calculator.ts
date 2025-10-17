import { prisma } from '@/lib/db'

export interface DeadlineCalculationInput {
  triggerDate: Date
  timeLimit: number
  timeLimitUnit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
  calculationMethod: 'CALENDAR_DAYS' | 'BUSINESS_DAYS' | 'COURT_DAYS' | 'CUSTOM'
  includeWeekends?: boolean
  includeHolidays?: boolean
  businessDaysOnly?: boolean
  jurisdictionId?: string
  customRules?: any
}

export interface DeadlineCalculationResult {
  calculatedDate: Date
  actualDays: number
  skippedDays: number
  skippedDetails: {
    weekends: number
    holidays: number
    customSkipped: number
  }
  calculationSteps: Array<{
    date: Date
    action: string
    reason?: string
  }>
  warnings: string[]
}

export class DeadlineCalculator {
  private holidays: Map<string, any[]> = new Map()
  private jurisdictionSettings: Map<string, any> = new Map()

  async initialize(jurisdictionId?: string) {
    // Load holidays for the jurisdiction
    if (jurisdictionId) {
      await this.loadHolidays(jurisdictionId)
      await this.loadJurisdictionSettings(jurisdictionId)
    }
  }

  private async loadHolidays(jurisdictionId: string) {
    const holidays = await prisma.holiday.findMany({
      where: {
        isActive: true,
        OR: [
          { jurisdictions: { path: '$', array_contains: jurisdictionId } },
          { type: 'FEDERAL' },
        ]
      }
    })
    
    const holidayMap = new Map()
    holidays.forEach(holiday => {
      const dateKey = this.dateToKey(holiday.date)
      if (!holidayMap.has(dateKey)) {
        holidayMap.set(dateKey, [])
      }
      holidayMap.get(dateKey).push(holiday)
    })
    
    this.holidays.set(jurisdictionId, Array.from(holidayMap.entries()))
  }

  private async loadJurisdictionSettings(jurisdictionId: string) {
    const jurisdiction = await prisma.jurisdiction.findUnique({
      where: { id: jurisdictionId },
      select: { settings: true, businessHours: true, timeZone: true }
    })
    
    if (jurisdiction) {
      this.jurisdictionSettings.set(jurisdictionId, jurisdiction)
    }
  }

  async calculateDeadline(input: DeadlineCalculationInput): Promise<DeadlineCalculationResult> {
    await this.initialize(input.jurisdictionId)

    const {
      triggerDate,
      timeLimit,
      timeLimitUnit,
      calculationMethod,
      includeWeekends = true,
      includeHolidays = true,
      businessDaysOnly = false,
      jurisdictionId
    } = input

    const result: DeadlineCalculationResult = {
      calculatedDate: new Date(triggerDate),
      actualDays: 0,
      skippedDays: 0,
      skippedDetails: {
        weekends: 0,
        holidays: 0,
        customSkipped: 0
      },
      calculationSteps: [],
      warnings: []
    }

    // Convert time limit to days
    const daysToAdd = this.convertTodays(timeLimit, timeLimitUnit)
    
    result.calculationSteps.push({
      date: new Date(triggerDate),
      action: 'STARTING_DATE',
      reason: `Starting from trigger date`
    })

    result.calculationSteps.push({
      date: new Date(triggerDate),
      action: 'TIME_LIMIT',
      reason: `Adding ${timeLimit} ${timeLimitUnit.toLowerCase()} (${daysToAdd} days)`
    })

    let currentDate = new Date(triggerDate)
    let daysAdded = 0
    let targetDays = daysToAdd

    // Handle different calculation methods
    switch (calculationMethod) {
      case 'CALENDAR_DAYS':
        currentDate.setDate(currentDate.getDate() + daysToAdd)
        result.actualDays = daysToAdd
        break

      case 'BUSINESS_DAYS':
      case 'COURT_DAYS':
        while (daysAdded < targetDays) {
          currentDate.setDate(currentDate.getDate() + 1)
          
          const isWeekend = this.isWeekend(currentDate)
          const isHoliday = await this.isHoliday(currentDate, jurisdictionId)
          
          let skipDay = false
          let skipReason = ''

          if (calculationMethod === 'BUSINESS_DAYS' && isWeekend) {
            skipDay = true
            skipReason = 'Weekend'
            result.skippedDetails.weekends++
          } else if (calculationMethod === 'COURT_DAYS') {
            if (isWeekend) {
              skipDay = true
              skipReason = 'Weekend'
              result.skippedDetails.weekends++
            } else if (isHoliday) {
              skipDay = true
              skipReason = 'Holiday'
              result.skippedDetails.holidays++
            }
          }

          if (skipDay) {
            result.calculationSteps.push({
              date: new Date(currentDate),
              action: 'SKIPPED',
              reason: skipReason
            })
            result.skippedDays++
          } else {
            daysAdded++
            result.calculationSteps.push({
              date: new Date(currentDate),
              action: 'COUNTED',
              reason: `Day ${daysAdded} of ${targetDays}`
            })
          }
        }
        result.actualDays = daysAdded
        break

      case 'CUSTOM':
        // Implement custom calculation logic based on input.customRules
        result.warnings.push('Custom calculation method not fully implemented')
        currentDate.setDate(currentDate.getDate() + daysToAdd)
        result.actualDays = daysToAdd
        break
    }

    result.calculatedDate = currentDate

    // Add final calculation step
    result.calculationSteps.push({
      date: new Date(currentDate),
      action: 'FINAL_DATE',
      reason: `Deadline calculated: ${currentDate.toDateString()}`
    })

    // Check for weekend landing and adjust if needed
    if (this.isWeekend(currentDate) && calculationMethod !== 'CALENDAR_DAYS') {
      const adjustedDate = this.getNextBusinessDay(currentDate, jurisdictionId)
      if (adjustedDate.getTime() !== currentDate.getTime()) {
        result.warnings.push(`Deadline fell on weekend, adjusted to next business day`)
        result.calculatedDate = adjustedDate
        result.calculationSteps.push({
          date: adjustedDate,
          action: 'WEEKEND_ADJUSTMENT',
          reason: 'Moved to next business day'
        })
      }
    }

    return result
  }

  private convertTodays(value: number, unit: string): number {
    switch (unit) {
      case 'MINUTES':
        return value / (24 * 60) // Convert to fractional days
      case 'HOURS':
        return value / 24
      case 'DAYS':
        return value
      case 'WEEKS':
        return value * 7
      case 'MONTHS':
        return value * 30 // Approximate
      case 'YEARS':
        return value * 365 // Approximate
      default:
        return value
    }
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday = 0, Saturday = 6
  }

  private async isHoliday(date: Date, jurisdictionId?: string): Promise<boolean> {
    if (!jurisdictionId) return false
    
    const dateKey = this.dateToKey(date)
    const holidays = this.holidays.get(jurisdictionId) || []
    
    return holidays.some(([key, holidayList]) => 
      key === dateKey && holidayList.some((h: any) => h.affectsCourts)
    )
  }

  private getNextBusinessDay(date: Date, jurisdictionId?: string): Date {
    const nextDay = new Date(date)
    
    do {
      nextDay.setDate(nextDay.getDate() + 1)
    } while (this.isWeekend(nextDay) || this.isHoliday(nextDay, jurisdictionId))
    
    return nextDay
  }

  private dateToKey(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Predefined holiday calculation for common holidays
  static getFederalHolidays(year: number): Array<{name: string, date: Date}> {
    const holidays = []
    
    // New Year's Day
    holidays.push({
      name: "New Year's Day",
      date: new Date(year, 0, 1)
    })
    
    // Martin Luther King Jr. Day (3rd Monday in January)
    holidays.push({
      name: "Martin Luther King Jr. Day",
      date: this.getNthWeekdayOfMonth(year, 0, 1, 3)
    })
    
    // Presidents' Day (3rd Monday in February)
    holidays.push({
      name: "Presidents' Day",
      date: this.getNthWeekdayOfMonth(year, 1, 1, 3)
    })
    
    // Memorial Day (Last Monday in May)
    holidays.push({
      name: "Memorial Day",
      date: this.getLastWeekdayOfMonth(year, 4, 1)
    })
    
    // Independence Day
    holidays.push({
      name: "Independence Day",
      date: new Date(year, 6, 4)
    })
    
    // Labor Day (1st Monday in September)
    holidays.push({
      name: "Labor Day",
      date: this.getNthWeekdayOfMonth(year, 8, 1, 1)
    })
    
    // Columbus Day (2nd Monday in October)
    holidays.push({
      name: "Columbus Day",
      date: this.getNthWeekdayOfMonth(year, 9, 1, 2)
    })
    
    // Veterans Day
    holidays.push({
      name: "Veterans Day",
      date: new Date(year, 10, 11)
    })
    
    // Thanksgiving (4th Thursday in November)
    holidays.push({
      name: "Thanksgiving",
      date: this.getNthWeekdayOfMonth(year, 10, 4, 4)
    })
    
    // Christmas Day
    holidays.push({
      name: "Christmas Day",
      date: new Date(year, 11, 25)
    })
    
    return holidays
  }

  private static getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
    const firstDay = new Date(year, month, 1)
    const firstWeekday = firstDay.getDay()
    const offset = (weekday - firstWeekday + 7) % 7
    const date = 1 + offset + (n - 1) * 7
    return new Date(year, month, date)
  }

  private static getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
    const lastDay = new Date(year, month + 1, 0)
    const lastWeekday = lastDay.getDay()
    const offset = (lastWeekday - weekday + 7) % 7
    const date = lastDay.getDate() - offset
    return new Date(year, month, date)
  }

  // Bulk calculate deadlines for multiple rules
  async calculateBulkDeadlines(inputs: DeadlineCalculationInput[]): Promise<DeadlineCalculationResult[]> {
    const results = []
    
    for (const input of inputs) {
      try {
        const result = await this.calculateDeadline(input)
        results.push(result)
      } catch (error) {
        console.error('Error calculating deadline:', error)
        results.push({
          calculatedDate: input.triggerDate,
          actualDays: 0,
          skippedDays: 0,
          skippedDetails: { weekends: 0, holidays: 0, customSkipped: 0 },
          calculationSteps: [],
          warnings: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        })
      }
    }
    
    return results
  }

  // Save calculation for auditing
  async saveCalculation(
    input: DeadlineCalculationInput, 
    result: DeadlineCalculationResult,
    caseId?: string,
    ruleId?: string
  ) {
    return await prisma.deadlineCalculation.create({
      data: {
        triggerDate: input.triggerDate,
        timeLimit: input.timeLimit,
        timeLimitUnit: input.timeLimitUnit,
        calculationMethod: input.calculationMethod,
        includeWeekends: input.includeWeekends || true,
        includeHolidays: input.includeHolidays || true,
        businessDaysOnly: input.businessDaysOnly || false,
        jurisdictionId: input.jurisdictionId,
        calculatedDate: result.calculatedDate,
        actualDays: result.actualDays,
        skippedDays: result.skippedDays,
        skippedDetails: result.skippedDetails,
        calculationSteps: result.calculationSteps,
        warnings: result.warnings,
        caseId,
        ruleId,
      }
    })
  }
}

export default DeadlineCalculator