import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature');
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Store webhook event for idempotency and debugging
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id }
    });

    if (existingEvent && existingEvent.processed) {
      console.log(`✅ Event ${event.id} already processed`);
      return NextResponse.json({ received: true });
    }

    // Create or update webhook event record
    await prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: {
        data: event as any,
        retryCount: { increment: 1 }
      },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        data: event as any,
        apiVersion: event.api_version
      }
    });

    console.log(`📨 Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    try {
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

        case 'invoice.created':
          await handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.paid':
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.created':
          await handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        default:
          console.log(`📝 Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      });

      console.log(`✅ Successfully processed webhook: ${event.type}`);

    } catch (error) {
      console.error(`❌ Error processing webhook ${event.type}:`, error);

      // Update webhook event with error
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: {
          processingError: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Don't return error to Stripe to avoid retries for permanent failures
      // Log the error but return success to prevent webhook retries
      return NextResponse.json({ 
        received: true, 
        error: 'Processing error logged' 
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed' 
    }, { status: 500 });
  }
}

// Handler functions for different Stripe events

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`📋 Creating subscription: ${subscription.id}`);

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

  // Find organization by customer email
  const organization = await prisma.organization.findUnique({
    where: { email: customer.email! }
  });

  if (!organization) {
    throw new Error(`Organization not found for customer email: ${customer.email}`);
  }

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    },
    create: {
      organizationId: organization.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      tier: determineTier(subscription),
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    }
  });

  // Update organization subscription tier
  await prisma.organization.update({
    where: { id: organization.id },
    data: { subscriptionTier: determineTier(subscription) }
  });

  console.log(`✅ Subscription created for organization: ${organization.name}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`📝 Updating subscription: ${subscription.id}`);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { organization: true }
  });

  if (!dbSubscription) {
    throw new Error(`Subscription not found: ${subscription.id}`);
  }

  // Update subscription
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      tier: determineTier(subscription),
      currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      cancellationReason: subscription.cancellation_details?.reason || null
    }
  });

  // Update organization subscription tier
  await prisma.organization.update({
    where: { id: dbSubscription.organizationId },
    data: { subscriptionTier: determineTier(subscription) }
  });

  // Send notification if subscription is canceled
  if (subscription.status === 'canceled') {
    const adminUsers = await prisma.user.findMany({
      where: {
        organizationId: dbSubscription.organizationId,
        role: 'ADMIN',
        isActive: true
      }
    });

    for (const admin of adminUsers) {
      await emailService.sendSystemNotification(admin.email, {
        title: 'Subscription Canceled',
        message: 'Your LexChronos subscription has been canceled. Access will continue until the end of the current billing period.',
        type: 'subscription_canceled'
      });
    }
  }

  console.log(`✅ Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ Deleting subscription: ${subscription.id}`);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { organization: true }
  });

  if (!dbSubscription) {
    console.log(`⚠️ Subscription not found in database: ${subscription.id}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date()
    }
  });

  // Downgrade organization to basic tier
  await prisma.organization.update({
    where: { id: dbSubscription.organizationId },
    data: { subscriptionTier: 'BASIC' }
  });

  console.log(`✅ Subscription deleted: ${subscription.id}`);
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log(`📄 Creating invoice: ${invoice.id}`);

  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

  const organization = await prisma.organization.findUnique({
    where: { email: customer.email! }
  });

  if (!organization) {
    throw new Error(`Organization not found for customer email: ${customer.email}`);
  }

  // Find subscription if exists
  const subscription = invoice.subscription ? await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string }
  }) : null;

  // Create invoice
  await prisma.invoice.create({
    data: {
      stripeInvoiceId: invoice.id,
      number: invoice.number!,
      status: mapInvoiceStatus(invoice.status),
      subtotal: invoice.subtotal,
      tax: invoice.tax || 0,
      total: invoice.total,
      amountDue: invoice.amount_due,
      currency: invoice.currency.toUpperCase(),
      issueDate: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      customerEmail: customer.email!,
      customerName: customer.name || organization.name,
      organizationId: organization.id,
      subscriptionId: subscription?.id,
      lineItems: invoice.lines.data as any,
      autoAdvance: invoice.auto_advance || true,
      collectionMethod: invoice.collection_method || 'charge_automatically'
    }
  });

  console.log(`✅ Invoice created: ${invoice.id}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`💰 Invoice paid: ${invoice.id}`);

  const dbInvoice = await prisma.invoice.findUnique({
    where: { stripeInvoiceId: invoice.id },
    include: { organization: true }
  });

  if (!dbInvoice) {
    throw new Error(`Invoice not found: ${invoice.id}`);
  }

  // Update invoice
  await prisma.invoice.update({
    where: { id: dbInvoice.id },
    data: {
      status: 'PAID',
      amountPaid: invoice.amount_paid,
      paidAt: new Date()
    }
  });

  // Send payment confirmation email
  await emailService.sendInvoice(dbInvoice.customerEmail, dbInvoice, dbInvoice.organization);

  console.log(`✅ Invoice payment processed: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);

  const dbInvoice = await prisma.invoice.findUnique({
    where: { stripeInvoiceId: invoice.id },
    include: { organization: true }
  });

  if (!dbInvoice) {
    throw new Error(`Invoice not found: ${invoice.id}`);
  }

  // Update invoice
  await prisma.invoice.update({
    where: { id: dbInvoice.id },
    data: {
      paymentAttempts: { increment: 1 },
      lastPaymentAttempt: new Date()
    }
  });

  // Notify admin users about payment failure
  const adminUsers = await prisma.user.findMany({
    where: {
      organizationId: dbInvoice.organizationId,
      role: 'ADMIN',
      isActive: true
    }
  });

  for (const admin of adminUsers) {
    await emailService.sendSystemNotification(admin.email, {
      title: 'Payment Failed',
      message: `Payment for invoice ${dbInvoice.number} has failed. Please update your payment method.`,
      type: 'payment_failed'
    });
  }

  console.log(`✅ Invoice payment failure processed: ${invoice.id}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💳 Payment succeeded: ${paymentIntent.id}`);

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'SUCCEEDED',
      customerEmail: paymentIntent.receipt_email,
      processedAt: new Date(),
      organizationId: paymentIntent.metadata.organizationId || '',
      description: paymentIntent.description
    }
  });

  console.log(`✅ Payment record created: ${payment.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);

  // Create payment record
  await prisma.payment.create({
    data: {
      stripePaymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'FAILED',
      customerEmail: paymentIntent.receipt_email,
      failedAt: new Date(),
      failureReason: paymentIntent.last_payment_error?.message,
      organizationId: paymentIntent.metadata.organizationId || '',
      description: paymentIntent.description
    }
  });

  console.log(`✅ Payment failure recorded: ${paymentIntent.id}`);
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log(`👤 Customer created: ${customer.id}`);
  // Customer creation is handled when organizations are created
  // This is mainly for logging/debugging
}

// Utility functions

function mapStripeStatus(status: string): 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'past_due': return 'PAST_DUE';
    case 'canceled': return 'CANCELED';
    case 'unpaid': return 'UNPAID';
    case 'trialing': return 'TRIALING';
    default: return 'INACTIVE';
  }
}

function mapInvoiceStatus(status: string | null): 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE' {
  switch (status) {
    case 'draft': return 'DRAFT';
    case 'open': return 'OPEN';
    case 'paid': return 'PAID';
    case 'void': return 'VOID';
    case 'uncollectible': return 'UNCOLLECTIBLE';
    default: return 'DRAFT';
  }
}

function determineTier(subscription: Stripe.Subscription): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM' {
  const priceId = subscription.items.data[0]?.price.id;
  
  if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) return 'ENTERPRISE';
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'PROFESSIONAL';
  if (priceId === process.env.STRIPE_PRICE_ID_BASIC) return 'BASIC';
  
  return 'BASIC'; // Default fallback
}