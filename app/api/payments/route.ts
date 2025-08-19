import { NextRequest, NextResponse } from 'next/server';
import { 
  createPaymentIntent,
  processRefund,
  getCustomerPaymentMethods,
  setDefaultPaymentMethod
} from '@/lib/stripe';
import { 
  createPaymentRecord,
  getPaymentsForLawFirm,
  getLawFirmWithSubscription
} from '@/lib/db';
import { z } from 'zod';

// Create payment schema
const createPaymentSchema = z.object({
  lawFirmId: z.string().min(1, 'Law firm ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('usd'),
  description: z.string().optional(),
  invoiceId: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

// Refund payment schema
const refundPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).default('requested_by_customer')
});

// GET /api/payments - Get payments for a law firm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawFirmId = searchParams.get('lawFirmId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lawFirmId) {
      return NextResponse.json(
        { success: false, error: 'Law firm ID is required' },
        { status: 400 }
      );
    }

    const payments = await getPaymentsForLawFirm(lawFirmId, {
      status: status as any,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method ? {
          type: payment.method.type,
          brand: payment.method.brand,
          last4: payment.method.last4
        } : null,
        invoice: payment.invoice ? {
          id: payment.invoice.id,
          invoiceNumber: payment.invoice.invoiceNumber,
          total: payment.invoice.total,
          client: payment.invoice.client ? {
            firstName: payment.invoice.client.firstName,
            lastName: payment.invoice.client.lastName
          } : null,
          case: payment.invoice.case ? {
            caseNumber: payment.invoice.case.caseNumber,
            title: payment.invoice.case.title
          } : null
        } : null,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeChargeId: payment.stripeChargeId,
        refundedAmount: payment.refundedAmount,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      })),
      pagination: {
        limit,
        offset,
        hasMore: payments.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment intent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    const { lawFirmId, amount, currency, description, invoiceId, metadata } = validatedData;

    // Get law firm with Stripe customer ID
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm || !lawFirm.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Law firm not found or missing Stripe customer' },
        { status: 404 }
      );
    }

    // Create payment intent in Stripe
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      customerId: lawFirm.stripeCustomerId,
      metadata: {
        lawFirmId,
        invoiceId: invoiceId || '',
        description: description || '',
        ...metadata
      }
    });

    // Create payment record in database
    const paymentRecord = await createPaymentRecord({
      lawFirmId,
      invoiceId,
      amount,
      currency,
      status: 'PENDING',
      paymentMethodId: '', // Will be updated when payment method is attached
      stripePaymentIntentId: paymentIntent.id
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        stripePaymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    
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
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}