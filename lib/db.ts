import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utility functions for legal case management

// Create or update organization (law firm)
export async function upsertOrganization({
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  zipCode,
  country
}: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}) {
  return await prisma.organization.upsert({
    where: id ? { id } : { email },
    update: {
      name,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      updatedAt: new Date()
    },
    create: {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country: country || 'US'
    }
  });
}

// Get organization with users and cases
export async function getOrganizationWithDetails(organizationId: string) {
  return await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: true,
      cases: {
        include: {
          assignee: true,
          documents: true,
          billingEntries: true
        }
      },
      documents: true
    }
  });
}

// Create billing entry
export async function createBillingEntry(data: {
  description: string;
  type: 'TIME' | 'EXPENSE' | 'FLAT_FEE' | 'CONTINGENCY';
  hours?: number;
  minutes?: number;
  hourlyRate?: number;
  amount?: number;
  currency?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  organizationId: string;
  caseId: string;
  userId: string;
  isBillable?: boolean;
  task?: 'RESEARCH' | 'DRAFTING' | 'REVIEW' | 'MEETING' | 'COURT_APPEARANCE' | 'PHONE_CALL' | 'EMAIL' | 'TRAVEL' | 'ADMINISTRATIVE' | 'OTHER';
  category?: string;
  tags?: any;
  notes?: string;
}) {
  return await prisma.billingEntry.create({
    data: {
      description: data.description,
      type: data.type,
      hours: data.hours,
      minutes: data.minutes,
      hourlyRate: data.hourlyRate,
      amount: data.amount,
      currency: data.currency || 'USD',
      date: data.date || new Date(),
      startTime: data.startTime,
      endTime: data.endTime,
      organizationId: data.organizationId,
      caseId: data.caseId,
      userId: data.userId,
      isBillable: data.isBillable !== false,
      task: data.task || 'RESEARCH',
      category: data.category,
      tags: data.tags,
      notes: data.notes
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
}

// Get billing entries for organization
export async function getBillingEntriesForOrganization(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
    caseId?: string;
    userId?: string;
    isBillable?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = { organizationId };
  
  if (options?.caseId) {
    where.caseId = options.caseId;
  }
  
  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.isBillable !== undefined) {
    where.isBillable = options.isBillable;
  }

  if (options?.startDate || options?.endDate) {
    where.date = {};
    if (options.startDate) {
      where.date.gte = options.startDate;
    }
    if (options.endDate) {
      where.date.lte = options.endDate;
    }
  }

  return await prisma.billingEntry.findMany({
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
    },
    orderBy: { date: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });
}

// Pagination utility for database queries
export async function paginate<T>(
  query: {
    findMany: (args: {
      where?: any;
      include?: any;
      orderBy?: any;
      take?: number;
      skip?: number;
      select?: any;
    }) => Promise<T[]>;
    count: (args: { where?: any }) => Promise<number>;
  },
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    where?: any;
    include?: any;
    orderBy?: any;
    select?: any;
  } = {}
): Promise<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  // Build orderBy from sortBy and sortOrder if provided
  let orderBy = options.orderBy;
  if (options.sortBy && !orderBy) {
    orderBy = { [options.sortBy]: options.sortOrder || 'desc' };
  }

  // Get total count
  const total = await query.count({ where: options.where });

  // Get paginated data
  const data = await query.findMany({
    where: options.where,
    include: options.include,
    orderBy,
    select: options.select,
    take: limit,
    skip
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// Database health check function
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  database: {
    connected: boolean;
    responseTime: number;
  };
  timestamp: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      database: {
        connected: true,
        responseTime
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      database: {
        connected: false,
        responseTime
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}