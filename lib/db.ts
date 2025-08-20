import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utility functions for Stripe integration

// Create or update law firm with Stripe customer
export async function upsertLawFirmWithStripeCustomer({
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  zipCode,
  country,
  stripeCustomerId
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
  stripeCustomerId: string;
}) {
  return await prisma.lawFirm.upsert({
    where: id ? { id } : { email },
    update: {
      name,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      stripeCustomerId,
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
      country: country || 'US',
      stripeCustomerId
    }
  });
}

// Create subscription record
export async function createSubscriptionRecord({
  lawFirmId,
  stripeSubscriptionId,
  plan,
  status,
  currentPeriodStart,
  currentPeriodEnd,
  trialStart,
  trialEnd,
  userLimit,
  storageLimit
}: {
  lawFirmId: string;
  stripeSubscriptionId: string;
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'UNPAID';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  userLimit: number;
  storageLimit: number;
}) {
  return await prisma.subscription.create({
    data: {
      lawFirmId,
      stripeSubscriptionId,
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      userLimit,
      storageLimit
    }
  });
}

// Update subscription record
export async function updateSubscriptionRecord(
  stripeSubscriptionId: string,
  data: {
    plan?: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'UNPAID';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date;
    trialStart?: Date;
    trialEnd?: Date;
    userLimit?: number;
    storageLimit?: number;
    currentUsers?: number;
    currentStorage?: number;
  }
) {
  return await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

// Create invoice record
export async function createInvoiceRecord({
  invoiceNumber,
  lawFirmId,
  clientId,
  caseId,
  userId,
  type,
  description,
  subtotal,
  taxRate,
  taxAmount,
  total,
  status,
  issueDate,
  dueDate,
  stripeInvoiceId,
  stripePaymentIntentId
}: {
  invoiceNumber: string;
  lawFirmId: string;
  clientId?: string;
  caseId?: string;
  userId?: string;
  type: 'SUBSCRIPTION' | 'CLIENT_BILLING' | 'ONE_TIME';
  description?: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED';
  issueDate: Date;
  dueDate: Date;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
}) {
  return await prisma.invoice.create({
    data: {
      invoiceNumber,
      lawFirmId,
      clientId,
      caseId,
      userId,
      type,
      description,
      subtotal,
      taxRate: taxRate || 0,
      taxAmount: taxAmount || 0,
      total,
      status,
      issueDate,
      dueDate,
      stripeInvoiceId,
      stripePaymentIntentId
    }
  });
}

// Update invoice record
export async function updateInvoiceRecord(
  id: string,
  data: {
    status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED';
    paidDate?: Date;
    stripeInvoiceId?: string;
    stripePaymentIntentId?: string;
  }
) {
  return await prisma.invoice.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

// Create payment record
export async function createPaymentRecord({
  lawFirmId,
  invoiceId,
  amount,
  currency,
  status,
  paymentMethodId,
  stripePaymentIntentId,
  stripeChargeId
}: {
  lawFirmId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  paymentMethodId: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
}) {
  return await prisma.payment.create({
    data: {
      lawFirmId,
      invoiceId,
      amount,
      currency,
      status,
      paymentMethodId,
      stripePaymentIntentId,
      stripeChargeId
    }
  });
}

// Update payment record
export async function updatePaymentRecord(
  id: string,
  data: {
    status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
    stripeChargeId?: string;
    refundedAmount?: number;
    refundedAt?: Date;
    refundReason?: string;
  }
) {
  return await prisma.payment.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

// Create or update payment method
export async function upsertPaymentMethod({
  id,
  lawFirmId,
  stripePaymentMethodId,
  type,
  brand,
  last4,
  expiryMonth,
  expiryYear,
  isDefault
}: {
  id?: string;
  lawFirmId: string;
  stripePaymentMethodId: string;
  type: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}) {
  return await prisma.paymentMethod.upsert({
    where: id ? { id } : { stripePaymentMethodId },
    update: {
      type,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      isDefault,
      updatedAt: new Date()
    },
    create: {
      lawFirmId,
      stripePaymentMethodId,
      type,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      isDefault: isDefault || false
    }
  });
}

// Record usage for billing
export async function recordUsage({
  lawFirmId,
  metric,
  quantity,
  billingPeriod
}: {
  lawFirmId: string;
  metric: 'STORAGE_GB' | 'ADDITIONAL_USERS' | 'API_CALLS' | 'DOCUMENTS_PROCESSED';
  quantity: number;
  billingPeriod: string;
}) {
  return await prisma.usageRecord.create({
    data: {
      lawFirmId,
      metric,
      quantity,
      billingPeriod
    }
  });
}

// Get law firm with subscription
export async function getLawFirmWithSubscription(lawFirmId: string) {
  return await prisma.lawFirm.findUnique({
    where: { id: lawFirmId },
    include: {
      subscription: true,
      users: true,
      paymentMethods: true
    }
  });
}

// Get law firm by Stripe customer ID
export async function getLawFirmByStripeCustomerId(stripeCustomerId: string) {
  return await prisma.lawFirm.findUnique({
    where: { stripeCustomerId },
    include: {
      subscription: true,
      users: true
    }
  });
}

// Get subscription by Stripe subscription ID
export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  return await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: {
      lawFirm: true
    }
  });
}

// Get invoices for law firm
export async function getInvoicesForLawFirm(
  lawFirmId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED';
    type?: 'SUBSCRIPTION' | 'CLIENT_BILLING' | 'ONE_TIME';
  }
) {
  const where: any = { lawFirmId };
  
  if (options?.status) {
    where.status = options.status;
  }
  
  if (options?.type) {
    where.type = options.type;
  }

  return await prisma.invoice.findMany({
    where,
    include: {
      client: true,
      case: true,
      payments: true
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });
}

// Get payments for law firm
export async function getPaymentsForLawFirm(
  lawFirmId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  }
) {
  const where: any = { lawFirmId };
  
  if (options?.status) {
    where.status = options.status;
  }

  return await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          client: true,
          case: true
        }
      },
      method: true
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0
  });
}

// Get usage records for billing period
export async function getUsageRecordsForPeriod(
  lawFirmId: string,
  billingPeriod: string
) {
  return await prisma.usageRecord.findMany({
    where: {
      lawFirmId,
      billingPeriod
    },
    orderBy: { timestamp: 'desc' }
  });
}

// Generate unique invoice number
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Find the latest invoice for this month
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}-`
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  });

  let sequence = 1;
  if (latestInvoice) {
    const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${sequence.toString().padStart(4, '0')}`;
}

// Update subscription usage counts
export async function updateSubscriptionUsage(
  subscriptionId: string,
  data: {
    currentUsers?: number;
    currentStorage?: number;
  }
) {
  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}

// Check if law firm is within usage limits
export async function checkUsageLimits(lawFirmId: string) {
  const lawFirm = await getLawFirmWithSubscription(lawFirmId);
  
  if (!lawFirm?.subscription) {
    return { withinLimits: false, errors: ['No active subscription'] };
  }

  const { subscription, users } = lawFirm;
  const errors: string[] = [];

  // Check user limit
  if (subscription.userLimit !== -1 && users.length > subscription.userLimit) {
    errors.push(`User limit exceeded: ${users.length}/${subscription.userLimit}`);
  }

  // Check storage limit (would need to calculate actual usage)
  if (subscription.currentStorage > subscription.storageLimit * 1024) { // Convert GB to MB
    errors.push(`Storage limit exceeded: ${Math.round(subscription.currentStorage / 1024)}GB/${subscription.storageLimit}GB`);
  }

  return {
    withinLimits: errors.length === 0,
    errors,
    usage: {
      users: users.length,
      userLimit: subscription.userLimit,
      storage: Math.round(subscription.currentStorage / 1024),
      storageLimit: subscription.storageLimit
    }
  };
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