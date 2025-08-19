import { NextRequest, NextResponse } from 'next/server';
import { 
  updateSubscriptionUsage as updateStripeUsage,
  USAGE_PRICING,
  formatCurrency
} from '@/lib/stripe';
import { 
  recordUsage,
  getUsageRecordsForPeriod,
  getLawFirmWithSubscription,
  updateSubscriptionUsage,
  checkUsageLimits
} from '@/lib/db';
import { z } from 'zod';

// Record usage schema
const recordUsageSchema = z.object({
  lawFirmId: z.string().min(1, 'Law firm ID is required'),
  metric: z.enum(['STORAGE_GB', 'ADDITIONAL_USERS', 'API_CALLS', 'DOCUMENTS_PROCESSED']),
  quantity: z.number().positive('Quantity must be positive'),
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/, 'Billing period must be in YYYY-MM format').optional()
});

// Update usage schema
const updateUsageSchema = z.object({
  lawFirmId: z.string().min(1, 'Law firm ID is required'),
  currentUsers: z.number().min(0).optional(),
  currentStorage: z.number().min(0).optional() // in MB
});

// GET /api/usage - Get usage records for a law firm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawFirmId = searchParams.get('lawFirmId');
    const billingPeriod = searchParams.get('billingPeriod');

    if (!lawFirmId) {
      return NextResponse.json(
        { success: false, error: 'Law firm ID is required' },
        { status: 400 }
      );
    }

    // Default to current month if no billing period specified
    const currentPeriod = billingPeriod || new Date().toISOString().slice(0, 7);

    // Get law firm with subscription details
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm) {
      return NextResponse.json(
        { success: false, error: 'Law firm not found' },
        { status: 404 }
      );
    }

    // Get usage records for the period
    const usageRecords = await getUsageRecordsForPeriod(lawFirmId, currentPeriod);

    // Check current usage limits
    const usageLimits = await checkUsageLimits(lawFirmId);

    // Aggregate usage by metric
    const aggregatedUsage = usageRecords.reduce((acc, record) => {
      if (!acc[record.metric]) {
        acc[record.metric] = { total: 0, records: [] };
      }
      acc[record.metric].total += record.quantity;
      acc[record.metric].records.push({
        quantity: record.quantity,
        timestamp: record.timestamp
      });
      return acc;
    }, {} as Record<string, { total: number; records: Array<{ quantity: number; timestamp: Date }> }>);

    // Calculate additional charges
    const additionalCharges = {
      additionalUsers: 0,
      additionalStorage: 0,
      total: 0
    };

    if (lawFirm.subscription) {
      const { subscription } = lawFirm;

      // Calculate additional user charges
      if (subscription.userLimit !== -1 && subscription.currentUsers > subscription.userLimit) {
        const additionalUsers = subscription.currentUsers - subscription.userLimit;
        additionalCharges.additionalUsers = additionalUsers * USAGE_PRICING.ADDITIONAL_USER.price;
      }

      // Calculate additional storage charges (convert MB to GB)
      const currentStorageGB = Math.ceil(subscription.currentStorage / 1024);
      if (currentStorageGB > subscription.storageLimit) {
        const additionalStorageGB = currentStorageGB - subscription.storageLimit;
        additionalCharges.additionalStorage = additionalStorageGB * USAGE_PRICING.ADDITIONAL_STORAGE.price;
      }

      additionalCharges.total = additionalCharges.additionalUsers + additionalCharges.additionalStorage;
    }

    return NextResponse.json({
      success: true,
      usage: {
        billingPeriod: currentPeriod,
        lawFirmId,
        subscription: lawFirm.subscription ? {
          plan: lawFirm.subscription.plan,
          status: lawFirm.subscription.status,
          userLimit: lawFirm.subscription.userLimit,
          storageLimit: lawFirm.subscription.storageLimit,
          currentUsers: lawFirm.subscription.currentUsers,
          currentStorage: Math.ceil(lawFirm.subscription.currentStorage / 1024) // Convert to GB
        } : null,
        limits: usageLimits,
        aggregatedUsage,
        additionalCharges: {
          ...additionalCharges,
          formatted: {
            additionalUsers: formatCurrency(additionalCharges.additionalUsers),
            additionalStorage: formatCurrency(additionalCharges.additionalStorage),
            total: formatCurrency(additionalCharges.total)
          }
        },
        rawRecords: usageRecords.map(record => ({
          id: record.id,
          metric: record.metric,
          quantity: record.quantity,
          timestamp: record.timestamp,
          billingPeriod: record.billingPeriod
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}

// POST /api/usage - Record usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = recordUsageSchema.parse(body);

    const { lawFirmId, metric, quantity, billingPeriod } = validatedData;

    // Default to current month if no billing period specified
    const currentPeriod = billingPeriod || new Date().toISOString().slice(0, 7);

    // Record usage in database
    const usageRecord = await recordUsage({
      lawFirmId,
      metric,
      quantity,
      billingPeriod: currentPeriod
    });

    // Check if usage limits are exceeded after recording
    const usageLimits = await checkUsageLimits(lawFirmId);

    return NextResponse.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        metric: usageRecord.metric,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
        billingPeriod: usageRecord.billingPeriod
      },
      limits: usageLimits
    });

  } catch (error) {
    console.error('Error recording usage:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}

// PUT /api/usage - Update current usage counters
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = updateUsageSchema.parse(body);

    const { lawFirmId, currentUsers, currentStorage } = validatedData;

    // Get law firm subscription
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm?.subscription) {
      return NextResponse.json(
        { success: false, error: 'Law firm subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription usage counters
    const updateData: any = {};
    if (currentUsers !== undefined) updateData.currentUsers = currentUsers;
    if (currentStorage !== undefined) updateData.currentStorage = currentStorage;

    if (Object.keys(updateData).length > 0) {
      await updateSubscriptionUsage(lawFirm.subscription.id, updateData);
    }

    // Check updated usage limits
    const usageLimits = await checkUsageLimits(lawFirmId);

    // Calculate if Stripe usage records need to be updated for billing
    const billingPeriod = new Date().toISOString().slice(0, 7);
    
    // Record storage usage if provided
    if (currentStorage !== undefined) {
      const storageGB = Math.ceil(currentStorage / 1024);
      if (storageGB > lawFirm.subscription.storageLimit) {
        await recordUsage({
          lawFirmId,
          metric: 'STORAGE_GB',
          quantity: storageGB,
          billingPeriod
        });
      }
    }

    // Record additional users if provided
    if (currentUsers !== undefined && lawFirm.subscription.userLimit !== -1) {
      if (currentUsers > lawFirm.subscription.userLimit) {
        await recordUsage({
          lawFirmId,
          metric: 'ADDITIONAL_USERS',
          quantity: currentUsers - lawFirm.subscription.userLimit,
          billingPeriod
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usage counters updated successfully',
      currentUsage: {
        users: currentUsers,
        storage: currentStorage ? Math.ceil(currentStorage / 1024) : undefined
      },
      limits: usageLimits
    });

  } catch (error) {
    console.error('Error updating usage:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update usage' },
      { status: 500 }
    );
  }
}