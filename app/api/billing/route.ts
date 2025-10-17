import { NextRequest, NextResponse } from 'next/server';
import { prisma, paginate } from '@/lib/db';

// GET /api/billing - Get all billing entries with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search');
    const caseId = searchParams.get('caseId');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const isBillable = searchParams.get('isBillable');
    const isInvoiced = searchParams.get('isInvoiced');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (caseId) {
      where.caseId = caseId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (isBillable !== null) {
      where.isBillable = isBillable === 'true';
    }

    if (isInvoiced !== null) {
      where.isInvoiced = isInvoiced === 'true';
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

    const result = await paginate(prisma.billingEntry, {
      page,
      limit,
      sortBy,
      sortOrder,
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
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
      }
    });

    // Calculate totals for the current page
    const pageEntries = result.data as Array<{
      type: string;
      hours?: number | null;
      hourlyRate?: number | null;
      amount?: number | null;
    }>;

    const totals = pageEntries.reduce((acc, entry) => {
      if (entry.type === 'TIME' && entry.hours && entry.hourlyRate) {
        acc.timeTotal += entry.hours * entry.hourlyRate;
        acc.totalHours += entry.hours;
      } else if (entry.type === 'EXPENSE' && entry.amount) {
        acc.expenseTotal += entry.amount;
      }
      acc.grandTotal += (entry.type === 'TIME' && entry.hours && entry.hourlyRate) 
        ? entry.hours * entry.hourlyRate 
        : entry.amount || 0;
      return acc;
    }, { timeTotal: 0, expenseTotal: 0, totalHours: 0, grandTotal: 0 });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      totals
    });

  } catch (error) {
    console.error('Error fetching billing entries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/billing - Create new billing entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      type = 'TIME',
      hours,
      minutes,
      hourlyRate,
      amount,
      currency = 'USD',
      date = new Date(),
      startTime,
      endTime,
      organizationId,
      caseId,
      userId,
      isBillable = true,
      task = 'RESEARCH',
      category,
      tags,
      notes
    } = body;

    // Validate required fields
    if (!description || !organizationId || !caseId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Description, organizationId, caseId, and userId are required' },
        { status: 400 }
      );
    }

    // Validate type-specific requirements
    if (type === 'TIME' && !hours && !minutes) {
      return NextResponse.json(
        { success: false, error: 'Hours or minutes required for time entries' },
        { status: 400 }
      );
    }

    if ((type === 'EXPENSE' || type === 'FLAT_FEE') && !amount) {
      return NextResponse.json(
        { success: false, error: 'Amount required for expense and flat fee entries' },
        { status: 400 }
      );
    }

    // Validate case exists and belongs to organization
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      select: { 
        organizationId: true,
        hourlyRate: true // Get default hourly rate from case
      }
    });

    if (!caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    if (caseData.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Case does not belong to this organization' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Use case hourly rate if not provided and it's a time entry
    const finalHourlyRate = hourlyRate || (type === 'TIME' ? caseData.hourlyRate : null);

    // Convert minutes to decimal hours if provided
    let finalHours = hours || 0;
    if (minutes) {
      finalHours += minutes / 60;
    }

    const billingEntry = await prisma.billingEntry.create({
      data: {
        description,
        type,
        hours: type === 'TIME' ? finalHours : null,
        minutes: type === 'TIME' ? minutes : null,
        hourlyRate: type === 'TIME' ? finalHourlyRate : null,
        amount: (type === 'EXPENSE' || type === 'FLAT_FEE') ? amount : null,
        currency,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        organizationId,
        caseId,
        userId,
        isBillable,
        task,
        category,
        tags,
        notes
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(
      { success: true, data: billingEntry },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating billing entry:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}