import { NextRequest, NextResponse } from 'next/server';
import { 
  getSubscription, 
  cancelSubscription, 
  reactivateSubscription,
  calculateProration,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType
} from '@/lib/stripe';
import { 
  getLawFirmWithSubscription,
  updateSubscriptionRecord,
  getSubscriptionByStripeId
} from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Update subscription schema
const updateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'reactivate', 'change_plan']),
  cancelAtPeriodEnd: z.boolean().optional(),
  newPlan: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']).optional()
});

// GET /api/subscriptions/[id] - Get subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get subscription from database
    const dbSubscription = await getSubscriptionByStripeId(id);
    if (!dbSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get detailed subscription info from Stripe
    const stripeSubscription = await getSubscription(id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: dbSubscription.id,
        stripeSubscriptionId: stripeSubscription.id,
        lawFirm: dbSubscription.lawFirm,
        plan: dbSubscription.plan,
        status: dbSubscription.status,
        currentPeriodStart: dbSubscription.currentPeriodStart,
        currentPeriodEnd: dbSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
        canceledAt: dbSubscription.canceledAt,
        trialStart: dbSubscription.trialStart,
        trialEnd: dbSubscription.trialEnd,
        userLimit: dbSubscription.userLimit,
        storageLimit: dbSubscription.storageLimit,
        currentUsers: dbSubscription.currentUsers,
        currentStorage: dbSubscription.currentStorage,
        stripeData: {
          status: stripeSubscription.status,
          cancelAt: stripeSubscription.cancel_at,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          currentPeriodStart: stripeSubscription.current_period_start,
          currentPeriodEnd: stripeSubscription.current_period_end,
          items: stripeSubscription.items.data.map(item => ({
            id: item.id,
            price: {
              id: item.price.id,
              unitAmount: item.price.unit_amount,
              currency: item.price.currency,
              interval: item.price.recurring?.interval
            }
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    const { action, cancelAtPeriodEnd, newPlan } = validatedData;

    // Get current subscription
    const dbSubscription = await getSubscriptionByStripeId(id);
    if (!dbSubscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    let updatedSubscription;
    let responseData: any = { success: true };

    switch (action) {
      case 'cancel':
        updatedSubscription = await cancelSubscription(id, cancelAtPeriodEnd ?? true);
        await updateSubscriptionRecord(id, {
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          canceledAt: updatedSubscription.canceled_at ? new Date(updatedSubscription.canceled_at * 1000) : undefined
        });
        responseData.message = cancelAtPeriodEnd ? 'Subscription will cancel at period end' : 'Subscription canceled immediately';
        break;

      case 'reactivate':
        updatedSubscription = await reactivateSubscription(id);
        await updateSubscriptionRecord(id, {
          cancelAtPeriodEnd: false,
          canceledAt: undefined,
          status: 'ACTIVE'
        });
        responseData.message = 'Subscription reactivated';
        break;

      case 'change_plan':
        if (!newPlan) {
          return NextResponse.json(
            { success: false, error: 'New plan is required for plan change' },
            { status: 400 }
          );
        }

        const newPlanDetails = SUBSCRIPTION_PLANS[newPlan as SubscriptionPlanType];
        
        // Calculate proration
        const proration = await calculateProration({
          subscriptionId: id,
          newPriceId: newPlanDetails.priceId
        });

        // Update subscription in Stripe (this would require additional Stripe API call)
        // For now, we'll return the proration info
        responseData.proration = proration;
        responseData.message = `Plan change calculated. Proration: ${proration.prorationAmount}`;
        responseData.newPlan = newPlan;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error updating subscription:', error);
    
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
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/[id] - Cancel subscription immediately
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Cancel subscription immediately
    const canceledSubscription = await cancelSubscription(id, false);
    
    // Update database record
    await updateSubscriptionRecord(id, {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled immediately',
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000) : null
      }
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
