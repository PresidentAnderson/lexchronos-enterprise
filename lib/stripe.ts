import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Client-side Stripe instance
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    price: 99, // $99/month
    currency: 'usd',
    interval: 'month' as const,
    userLimit: 5,
    storageLimit: 10, // 10GB
    features: [
      'Up to 5 users',
      '10GB storage',
      'Basic case management',
      'Invoice generation',
      'Email support'
    ]
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    price: 199, // $199/month
    currency: 'usd',
    interval: 'month' as const,
    userLimit: 25,
    storageLimit: 100, // 100GB
    features: [
      'Up to 25 users',
      '100GB storage',
      'Advanced case management',
      'Time tracking',
      'Custom invoicing',
      'Priority support',
      'API access'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    price: 499, // $499/month
    currency: 'usd',
    interval: 'month' as const,
    userLimit: -1, // Unlimited
    storageLimit: 1000, // 1TB
    features: [
      'Unlimited users',
      '1TB storage',
      'Complete case management suite',
      'Advanced time tracking',
      'Custom invoicing & billing',
      'White-label options',
      '24/7 phone support',
      'API access',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

// Usage-based pricing configuration
export const USAGE_PRICING = {
  ADDITIONAL_USER: {
    price: 15, // $15/user/month
    currency: 'usd'
  },
  ADDITIONAL_STORAGE: {
    price: 2, // $2/GB/month
    currency: 'usd'
  }
} as const;

// Webhook event types we handle
export const HANDLED_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'payment_method.attached',
  'payment_method.detached',
  'charge.succeeded',
  'charge.failed',
  'charge.dispute.created'
] as const;

// Stripe webhook signature verification
export async function verifyStripeSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create a Stripe customer for a law firm
export async function createStripeCustomer(lawFirm: {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    name: lawFirm.name,
    email: lawFirm.email,
    phone: lawFirm.phone,
    address: lawFirm.address,
    metadata: {
      type: 'law_firm'
    }
  });
}

// Create a subscription for a law firm
export async function createSubscription({
  customerId,
  priceId,
  trialDays = 14
}: {
  customerId: string;
  priceId: string;
  trialDays?: number;
}): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price: priceId,
    }],
    trial_period_days: trialDays,
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });
}

// Update subscription quantity (for usage-based billing)
export async function updateSubscriptionUsage({
  subscriptionId,
  usageRecords
}: {
  subscriptionId: string;
  usageRecords: Array<{
    subscriptionItemId: string;
    quantity: number;
  }>;
}) {
  const results = [];
  
  for (const record of usageRecords) {
    const result = await stripe.subscriptionItems.createUsageRecord(
      record.subscriptionItemId,
      {
        quantity: record.quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'set'
      }
    );
    results.push(result);
  }
  
  return results;
}

// Create a payment intent for one-time payments
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  customerId,
  metadata = {}
}: {
  amount: number;
  currency?: string;
  customerId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata
  });
}

// Create an invoice for client billing
export async function createInvoice({
  customerId,
  description,
  amount,
  currency = 'usd',
  dueDate,
  metadata = {}
}: {
  customerId: string;
  description: string;
  amount: number;
  currency?: string;
  dueDate?: Date;
  metadata?: Record<string, string>;
}): Promise<Stripe.Invoice> {
  // Create invoice item
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    description,
    metadata
  });

  // Create and finalize invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30,
    metadata
  });

  return await stripe.invoices.finalizeInvoice(invoice.id);
}

// Process a refund
export async function processRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer'
}: {
  paymentIntentId: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}): Promise<Stripe.Refund> {
  const refundData: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason
  };

  if (amount) {
    refundData.amount = Math.round(amount * 100); // Convert to cents
  }

  return await stripe.refunds.create(refundData);
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(
  customerId: string,
  type?: 'card' | 'us_bank_account'
): Promise<Stripe.PaymentMethod[]> {
  const params: Stripe.PaymentMethodListParams = {
    customer: customerId,
    limit: 100
  };

  if (type) {
    params.type = type;
  }

  const paymentMethods = await stripe.paymentMethods.list(params);
  return paymentMethods.data;
}

// Set default payment method
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

// Reactivate subscription
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false
  });
}

// Get subscription details
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'items.data.price', 'latest_invoice']
  });
}

// Get customer details
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

// Calculate prorated amount for subscription changes
export async function calculateProration({
  subscriptionId,
  newPriceId,
  timestamp
}: {
  subscriptionId: string;
  newPriceId: string;
  timestamp?: number;
}): Promise<{
  prorationAmount: number;
  nextInvoiceTotal: number;
}> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const proration = await stripe.invoices.retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    subscription_items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    subscription_proration_date: timestamp || Math.floor(Date.now() / 1000),
  });

  const prorationAmount = proration.lines.data
    .filter(item => item.proration)
    .reduce((sum, item) => sum + item.amount, 0) / 100;

  return {
    prorationAmount,
    nextInvoiceTotal: proration.amount_due / 100,
  };
}