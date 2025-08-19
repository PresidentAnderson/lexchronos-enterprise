import { NextRequest, NextResponse } from 'next/server';
import { 
  createStripeCustomer, 
  createSubscription, 
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType 
} from '@/lib/stripe';
import { 
  upsertLawFirmWithStripeCustomer, 
  createSubscriptionRecord,
  getLawFirmWithSubscription 
} from '@/lib/db';
import { z } from 'zod';

// Create subscription schema
const createSubscriptionSchema = z.object({
  lawFirm: z.object({
    name: z.string().min(1, 'Law firm name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('US')
  }),
  plan: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  trialDays: z.number().min(0).max(30).default(14)
});

// GET /api/subscriptions - Get all available subscription plans
export async function GET() {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      userLimit: plan.userLimit,
      storageLimit: plan.storageLimit,
      features: plan.features
    }));

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subscription plans' 
      },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    const { lawFirm, plan, trialDays } = validatedData;
    const planDetails = SUBSCRIPTION_PLANS[plan as SubscriptionPlanType];

    // Create Stripe customer
    const stripeCustomer = await createStripeCustomer({
      name: lawFirm.name,
      email: lawFirm.email,
      phone: lawFirm.phone,
      address: lawFirm.address ? {
        line1: lawFirm.address,
        city: lawFirm.city,
        state: lawFirm.state,
        postal_code: lawFirm.zipCode,
        country: lawFirm.country
      } : undefined
    });

    // Create law firm record in database
    const lawFirmRecord = await upsertLawFirmWithStripeCustomer({
      name: lawFirm.name,
      email: lawFirm.email,
      phone: lawFirm.phone,
      address: lawFirm.address,
      city: lawFirm.city,
      state: lawFirm.state,
      zipCode: lawFirm.zipCode,
      country: lawFirm.country,
      stripeCustomerId: stripeCustomer.id
    });

    // Create Stripe subscription
    const stripeSubscription = await createSubscription({
      customerId: stripeCustomer.id,
      priceId: planDetails.priceId,
      trialDays
    });

    // Create subscription record in database
    const subscriptionRecord = await createSubscriptionRecord({
      lawFirmId: lawFirmRecord.id,
      stripeSubscriptionId: stripeSubscription.id,
      plan: plan as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE',
      status: stripeSubscription.status as 'ACTIVE' | 'TRIALING' | 'INCOMPLETE',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
      userLimit: planDetails.userLimit,
      storageLimit: planDetails.storageLimit
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionRecord.id,
        stripeSubscriptionId: stripeSubscription.id,
        plan,
        status: stripeSubscription.status,
        clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
        lawFirmId: lawFirmRecord.id,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    
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
      { 
        success: false, 
        error: 'Failed to create subscription' 
      },
      { status: 500 }
    );
  }
}