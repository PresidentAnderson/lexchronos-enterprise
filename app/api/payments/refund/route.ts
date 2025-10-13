import { NextRequest, NextResponse } from 'next/server';
import { processRefund } from '@/lib/stripe';
import { updatePaymentRecord } from '@/lib/db';
import { z } from 'zod';

// Refund payment schema
const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  amount: z.number().positive().optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).default('requested_by_customer')
});

// POST /api/payments/refund - Process a refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = refundPaymentSchema.parse(body);

    const { paymentId, paymentIntentId, amount, reason } = validatedData;

    // Process refund in Stripe
    const refund = await processRefund({
      paymentIntentId,
      amount,
      reason
    });

    // Update payment record in database
    await updatePaymentRecord(paymentId, {
      status: 'REFUNDED',
      refundedAmount: refund.amount / 100, // Convert from cents
      refundedAt: new Date(),
      refundReason: reason
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: new Date(refund.created * 1000)
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    
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
      { success: false, error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}