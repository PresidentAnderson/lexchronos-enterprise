import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { 
  stripe, 
  verifyStripeSignature, 
  SUBSCRIPTION_PLANS,
  HANDLED_WEBHOOK_EVENTS 
} from '@/lib/stripe';
import { 
  getLawFirmByStripeCustomerId,
  getSubscriptionByStripeId,
  updateSubscriptionRecord,
  createSubscriptionRecord,
  updateInvoiceRecord,
  createPaymentRecord,
  updatePaymentRecord,
  upsertPaymentMethod
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await verifyStripeSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if we handle this event type
    if (!HANDLED_WEBHOOK_EVENTS.includes(event.type as any)) {
      console.log(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event based on its type
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.created:', subscription.id);

  try {
    const lawFirm = await getLawFirmByStripeCustomerId(subscription.customer as string);
    if (!lawFirm) {
      console.error('Law firm not found for customer:', subscription.customer);
      return;
    }

    // Determine the plan based on the price ID
    const priceId = subscription.items.data[0]?.price.id;
    let plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | null = null;
    let userLimit = 5;
    let storageLimit = 10;

    for (const [planKey, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (planData.priceId === priceId) {
        plan = planKey as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
        userLimit = planData.userLimit;
        storageLimit = planData.storageLimit;
        break;
      }
    }

    if (!plan) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Map Stripe status to our enum
    const status = mapStripeStatusToOurs(subscription.status);

    await createSubscriptionRecord({
      lawFirmId: lawFirm.id,
      stripeSubscriptionId: subscription.id,
      plan,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      userLimit,
      storageLimit
    });

    console.log('Subscription record created successfully');
  } catch (error) {
    console.error('Error handling subscription.created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription.updated:', subscription.id);

  try {
    const existingSubscription = await getSubscriptionByStripeId(subscription.id);
    if (!existingSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Determine the new plan
    const priceId = subscription.items.data[0]?.price.id;
    let plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | null = null;
    let userLimit = 5;
    let storageLimit = 10;

    for (const [planKey, planData] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (planData.priceId === priceId) {
        plan = planKey as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
        userLimit = planData.userLimit;
        storageLimit = planData.storageLimit;
        break;
      }
    }

    const status = mapStripeStatusToOurs(subscription.status);

    await updateSubscriptionRecord(subscription.id, {
      plan: plan || undefined,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      userLimit,
      storageLimit
    });

    console.log('Subscription record updated successfully');
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription.deleted:', subscription.id);

  try {
    await updateSubscriptionRecord(subscription.id, {
      status: 'CANCELED',
      canceledAt: new Date()
    });

    console.log('Subscription marked as canceled');
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  try {
    // Update invoice status in database
    await updateInvoiceRecord(invoice.metadata?.databaseId || '', {
      status: 'PAID',
      paidDate: new Date()
    });

    // If this is a subscription invoice, update the subscription status
    if (invoice.subscription) {
      await updateSubscriptionRecord(invoice.subscription as string, {
        status: 'ACTIVE'
      });
    }

    console.log('Invoice payment processed successfully');
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  try {
    // Update invoice status in database
    await updateInvoiceRecord(invoice.metadata?.databaseId || '', {
      status: 'OVERDUE'
    });

    // If this is a subscription invoice, update the subscription status
    if (invoice.subscription) {
      await updateSubscriptionRecord(invoice.subscription as string, {
        status: 'PAST_DUE'
      });
    }

    console.log('Failed invoice payment processed');
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

// Handle customer created
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Processing customer.created:', customer.id);
  // This is typically handled during registration
  // We might want to sync additional data here if needed
}

// Handle customer updated
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Processing customer.updated:', customer.id);
  
  try {
    const lawFirm = await getLawFirmByStripeCustomerId(customer.id);
    if (lawFirm) {
      // Update law firm details if needed
      // This would require adding an update function to db.ts
      console.log('Customer update processed for law firm:', lawFirm.id);
    }
  } catch (error) {
    console.error('Error handling customer.updated:', error);
  }
}

// Handle payment method attached
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Processing payment_method.attached:', paymentMethod.id);

  try {
    if (paymentMethod.customer) {
      const lawFirm = await getLawFirmByStripeCustomerId(paymentMethod.customer as string);
      if (lawFirm) {
        await upsertPaymentMethod({
          lawFirmId: lawFirm.id,
          stripePaymentMethodId: paymentMethod.id,
          type: paymentMethod.type,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment_method.attached:', error);
  }
}

// Handle payment method detached
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Processing payment_method.detached:', paymentMethod.id);
  
  try {
    // Remove payment method from database
    // This would require adding a delete function to db.ts
    console.log('Payment method detached:', paymentMethod.id);
  } catch (error) {
    console.error('Error handling payment_method.detached:', error);
  }
}

// Handle successful charge
async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log('Processing charge.succeeded:', charge.id);

  try {
    if (charge.customer) {
      const lawFirm = await getLawFirmByStripeCustomerId(charge.customer as string);
      if (lawFirm && charge.payment_intent) {
        // Update payment record
        await updatePaymentRecord(charge.metadata?.databasePaymentId || '', {
          status: 'SUCCEEDED',
          stripeChargeId: charge.id
        });
      }
    }
  } catch (error) {
    console.error('Error handling charge.succeeded:', error);
  }
}

// Handle failed charge
async function handleChargeFailed(charge: Stripe.Charge) {
  console.log('Processing charge.failed:', charge.id);

  try {
    if (charge.customer) {
      const lawFirm = await getLawFirmByStripeCustomerId(charge.customer as string);
      if (lawFirm) {
        // Update payment record
        await updatePaymentRecord(charge.metadata?.databasePaymentId || '', {
          status: 'FAILED',
          stripeChargeId: charge.id
        });
      }
    }
  } catch (error) {
    console.error('Error handling charge.failed:', error);
  }
}

// Handle charge dispute created
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Processing charge.dispute.created:', dispute.id);
  
  try {
    // Handle dispute logic here
    // This might involve notifying the law firm, updating payment status, etc.
    console.log('Dispute created for charge:', dispute.charge);
  } catch (error) {
    console.error('Error handling charge.dispute.created:', error);
  }
}

// Helper function to map Stripe subscription status to our enum
function mapStripeStatusToOurs(stripeStatus: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'UNPAID' {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    case 'trialing':
      return 'TRIALING';
    case 'unpaid':
      return 'UNPAID';
    default:
      return 'INCOMPLETE';
  }
}