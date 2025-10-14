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

// Usage-related database functions for billing and subscription management

// Get law firm with subscription details
export async function getLawFirmWithSubscription(lawFirmId: string) {
  try {
    return await prisma.organization.findUnique({
      where: { id: lawFirmId },
      include: {
        subscription: true,
        users: true,
        cases: true
      }
    });
  } catch (error) {
    console.error('Error fetching law firm with subscription:', error);
    return null;
  }
}

// Record usage entry
export async function recordUsage({
  lawFirmId,
  metric,
  quantity,
  billingPeriod
}: {
  lawFirmId: string;
  metric: string;
  quantity: number;
  billingPeriod: string;
}) {
  try {
    // For now, we'll create a simple usage tracking system
    // This would be implemented properly based on your billing requirements
    return {
      id: `usage_${Date.now()}`,
      lawFirmId,
      metric,
      quantity,
      timestamp: new Date(),
      billingPeriod
    };
  } catch (error) {
    console.error('Error recording usage:', error);
    throw error;
  }
}

// Get usage records for a specific period
export async function getUsageRecordsForPeriod(lawFirmId: string, billingPeriod: string) {
  try {
    // Placeholder implementation - would query actual usage table
    // For now, return empty array since we don't have usage tracking table yet
    return [];
  } catch (error) {
    console.error('Error fetching usage records:', error);
    return [];
  }
}

// Update subscription usage counters
export async function updateSubscriptionUsage(subscriptionId: string, updateData: {
  currentUsers?: number;
  currentStorage?: number;
}) {
  try {
    // For now, just log the update - implement actual database update when subscription model supports it
    console.log('Updating subscription usage:', subscriptionId, updateData);
    return true;
  } catch (error) {
    console.error('Error updating subscription usage:', error);
    throw error;
  }
}

// Check usage limits for a law firm
export async function checkUsageLimits(lawFirmId: string) {
  try {
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    
    if (!lawFirm?.subscription) {
      return {
        withinLimits: true,
        warnings: ['No subscription found']
      };
    }

    // Placeholder implementation - would check actual limits
    return {
      withinLimits: true,
      warnings: []
    };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      withinLimits: false,
      warnings: ['Error checking limits']
    };
  }
}

// Payment method functions for Stripe integration

// Upsert payment method
export async function upsertPaymentMethod(data: {
  id?: string;
  stripePaymentMethodId: string;
  organizationId: string;
  type: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}) {
  try {
    return await prisma.paymentMethod.upsert({
      where: data.id ? { id: data.id } : { stripePaymentMethodId: data.stripePaymentMethodId },
      update: {
        type: data.type,
        last4: data.last4,
        brand: data.brand,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        isDefault: data.isDefault,
        updatedAt: new Date()
      },
      create: {
        stripePaymentMethodId: data.stripePaymentMethodId,
        organizationId: data.organizationId,
        type: data.type,
        last4: data.last4,
        brand: data.brand,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        isDefault: data.isDefault || false
      }
    });
  } catch (error) {
    console.error('Error upserting payment method:', error);
    return null;
  }
}

// Update payment record
export async function updatePaymentRecord(paymentId: string, data: {
  status?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: any;
}) {
  try {
    return await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: data.status,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        metadata: data.metadata,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating payment record:', error);
    return null;
  }
}

// Get subscription by Stripe ID
export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  try {
    return await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      include: {
        organization: true
      }
    });
  } catch (error) {
    console.error('Error fetching subscription by Stripe ID:', error);
    return null;
  }
}

// Update subscription record
export async function updateSubscriptionRecord(subscriptionId: string, data: {
  status?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  metadata?: any;
}) {
  try {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        canceledAt: data.canceledAt,
        metadata: data.metadata,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating subscription record:', error);
    return null;
  }
}