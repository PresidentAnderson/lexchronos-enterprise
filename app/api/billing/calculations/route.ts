import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/billing/calculations - Calculate billing totals and generate invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      organizationId,
      startDate,
      endDate,
      includeUnbillable = false,
      groupBy = 'user', // user, task, date
      userId,
      generateInvoice = false
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Build where clause for billing entries
    const where: any = { organizationId };

    if (caseId) {
      where.caseId = caseId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (!includeUnbillable) {
      where.isBillable = true;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get billing entries
    const billingEntries = await prisma.billingEntry.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            clientName: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate totals
    const calculations = {
      summary: {
        totalEntries: billingEntries.length,
        totalHours: 0,
        totalTimeAmount: 0,
        totalExpenses: 0,
        totalFlatFees: 0,
        totalContingency: 0,
        grandTotal: 0,
        billableEntries: billingEntries.filter(e => e.isBillable).length,
        unbillableEntries: billingEntries.filter(e => !e.isBillable).length
      },
      breakdown: {
        byType: {} as Record<string, any>,
        byUser: {} as Record<string, any>,
        byCase: {} as Record<string, any>,
        byTask: {} as Record<string, any>,
        byDate: {} as Record<string, any>
      },
      entries: billingEntries
    };

    // Process each billing entry
    for (const entry of billingEntries) {
      let entryAmount = 0;

      // Calculate amount based on type
      switch (entry.type) {
        case 'TIME':
          if (entry.hours && entry.hourlyRate) {
            entryAmount = entry.hours * entry.hourlyRate;
            calculations.summary.totalHours += entry.hours;
            calculations.summary.totalTimeAmount += entryAmount;
          }
          break;
        case 'EXPENSE':
          if (entry.amount) {
            entryAmount = entry.amount;
            calculations.summary.totalExpenses += entryAmount;
          }
          break;
        case 'FLAT_FEE':
          if (entry.amount) {
            entryAmount = entry.amount;
            calculations.summary.totalFlatFees += entryAmount;
          }
          break;
        case 'CONTINGENCY':
          if (entry.amount) {
            entryAmount = entry.amount;
            calculations.summary.totalContingency += entryAmount;
          }
          break;
      }

      if (entry.isBillable) {
        calculations.summary.grandTotal += entryAmount;
      }

      // Breakdown by type
      if (!calculations.breakdown.byType[entry.type]) {
        calculations.breakdown.byType[entry.type] = {
          count: 0,
          totalAmount: 0,
          totalHours: 0
        };
      }
      calculations.breakdown.byType[entry.type].count++;
      calculations.breakdown.byType[entry.type].totalAmount += entryAmount;
      if (entry.hours) {
        calculations.breakdown.byType[entry.type].totalHours += entry.hours;
      }

      // Breakdown by user
      const userKey = `${entry.user.firstName} ${entry.user.lastName}`;
      if (!calculations.breakdown.byUser[userKey]) {
        calculations.breakdown.byUser[userKey] = {
          userId: entry.user.id,
          count: 0,
          totalAmount: 0,
          totalHours: 0,
          title: entry.user.title
        };
      }
      calculations.breakdown.byUser[userKey].count++;
      calculations.breakdown.byUser[userKey].totalAmount += entryAmount;
      if (entry.hours) {
        calculations.breakdown.byUser[userKey].totalHours += entry.hours;
      }

      // Breakdown by case
      if (entry.case) {
        const caseKey = entry.case.caseNumber;
        if (!calculations.breakdown.byCase[caseKey]) {
          calculations.breakdown.byCase[caseKey] = {
            caseId: entry.case.id,
            caseTitle: entry.case.title,
            clientName: entry.case.clientName,
            count: 0,
            totalAmount: 0,
            totalHours: 0
          };
        }
        calculations.breakdown.byCase[caseKey].count++;
        calculations.breakdown.byCase[caseKey].totalAmount += entryAmount;
        if (entry.hours) {
          calculations.breakdown.byCase[caseKey].totalHours += entry.hours;
        }
      }

      // Breakdown by task
      if (!calculations.breakdown.byTask[entry.task]) {
        calculations.breakdown.byTask[entry.task] = {
          count: 0,
          totalAmount: 0,
          totalHours: 0
        };
      }
      calculations.breakdown.byTask[entry.task].count++;
      calculations.breakdown.byTask[entry.task].totalAmount += entryAmount;
      if (entry.hours) {
        calculations.breakdown.byTask[entry.task].totalHours += entry.hours;
      }

      // Breakdown by date
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!calculations.breakdown.byDate[dateKey]) {
        calculations.breakdown.byDate[dateKey] = {
          count: 0,
          totalAmount: 0,
          totalHours: 0
        };
      }
      calculations.breakdown.byDate[dateKey].count++;
      calculations.breakdown.byDate[dateKey].totalAmount += entryAmount;
      if (entry.hours) {
        calculations.breakdown.byDate[dateKey].totalHours += entry.hours;
      }
    }

    // Calculate rates and efficiency metrics
    const additionalMetrics = {
      averageHourlyRate: calculations.summary.totalHours > 0 
        ? calculations.summary.totalTimeAmount / calculations.summary.totalHours 
        : 0,
      billableRatio: calculations.summary.totalEntries > 0 
        ? (calculations.summary.billableEntries / calculations.summary.totalEntries) * 100 
        : 0,
      timeVsExpenseRatio: calculations.summary.totalExpenses > 0 
        ? calculations.summary.totalTimeAmount / calculations.summary.totalExpenses 
        : calculations.summary.totalTimeAmount,
      dailyAverage: Object.keys(calculations.breakdown.byDate).length > 0 
        ? calculations.summary.grandTotal / Object.keys(calculations.breakdown.byDate).length 
        : 0
    };

    const response = {
      success: true,
      data: {
        ...calculations,
        metrics: additionalMetrics,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
          daysInPeriod: startDate && endDate 
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
            : null
        }
      }
    };

    // TODO: If generateInvoice is true, create an invoice record
    if (generateInvoice) {
      // This would create an invoice with the billing entries
      // For now, just add a message
      response.data.invoiceGenerated = false;
      response.data.invoiceMessage = "Invoice generation not implemented yet";
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error calculating billing:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/billing/calculations/summary - Get quick billing summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const caseId = searchParams.get('caseId');
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'month'; // day, week, month, year

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Build where clause
    const where: any = {
      organizationId,
      date: { gte: startDate },
      isBillable: true
    };

    if (caseId) where.caseId = caseId;
    if (userId) where.userId = userId;

    // Get billing entries for the period
    const billingEntries = await prisma.billingEntry.findMany({
      where,
      select: {
        type: true,
        hours: true,
        hourlyRate: true,
        amount: true,
        date: true
      }
    });

    // Calculate summary
    const summary = billingEntries.reduce((acc, entry) => {
      let entryAmount = 0;

      switch (entry.type) {
        case 'TIME':
          if (entry.hours && entry.hourlyRate) {
            entryAmount = entry.hours * entry.hourlyRate;
            acc.totalHours += entry.hours;
          }
          break;
        case 'EXPENSE':
        case 'FLAT_FEE':
        case 'CONTINGENCY':
          if (entry.amount) {
            entryAmount = entry.amount;
          }
          break;
      }

      acc.totalAmount += entryAmount;
      acc.entryCount++;

      return acc;
    }, {
      totalAmount: 0,
      totalHours: 0,
      entryCount: 0
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        summary,
        averageDaily: summary.totalAmount / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      }
    });

  } catch (error) {
    console.error('Error getting billing summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}