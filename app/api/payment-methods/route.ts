import { NextRequest, NextResponse } from 'next/server';
import { 
  getCustomerPaymentMethods,
  setDefaultPaymentMethod,
  stripe
} from '@/lib/stripe';
import { 
  getLawFirmWithSubscription,
  upsertPaymentMethod
} from '@/lib/db';
import { z } from 'zod';

// Set default payment method schema
const setDefaultSchema = z.object({
  lawFirmId: z.string().min(1, 'Law firm ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required')
});

// GET /api/payment-methods - Get payment methods for a law firm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawFirmId = searchParams.get('lawFirmId');
    const type = searchParams.get('type') as 'card' | 'us_bank_account' | null;

    if (!lawFirmId) {
      return NextResponse.json(
        { success: false, error: 'Law firm ID is required' },
        { status: 400 }
      );
    }

    // Get law firm with Stripe customer ID
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm || !lawFirm.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Law firm not found or missing Stripe customer' },
        { status: 404 }
      );
    }

    // Get payment methods from Stripe
    const paymentMethods = await getCustomerPaymentMethods(
      lawFirm.stripeCustomerId,
      type || undefined
    );

    // Format payment methods for response
    const formattedMethods = paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        funding: pm.card.funding
      } : null,
      usBankAccount: pm.us_bank_account ? {
        accountType: pm.us_bank_account.account_type,
        bankName: pm.us_bank_account.bank_name,
        last4: pm.us_bank_account.last4,
        routingNumber: pm.us_bank_account.routing_number
      } : null,
      billingDetails: pm.billing_details,
      created: new Date(pm.created * 1000)
    }));

    // Get database payment methods for default status
    const dbPaymentMethods = lawFirm.paymentMethods || [];
    const defaultPaymentMethodId = dbPaymentMethods.find(pm => pm.isDefault)?.stripePaymentMethodId;

    return NextResponse.json({
      success: true,
      paymentMethods: formattedMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === defaultPaymentMethodId
      }))
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods - Set default payment method
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = setDefaultSchema.parse(body);

    const { lawFirmId, paymentMethodId } = validatedData;

    // Get law firm with Stripe customer ID
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm || !lawFirm.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Law firm not found or missing Stripe customer' },
        { status: 404 }
      );
    }

    // Set default payment method in Stripe
    const updatedCustomer = await setDefaultPaymentMethod(
      lawFirm.stripeCustomerId,
      paymentMethodId
    );

    // Update all payment methods to not be default
    for (const pm of lawFirm.paymentMethods) {
      await upsertPaymentMethod({
        id: pm.id,
        lawFirmId,
        stripePaymentMethodId: pm.stripePaymentMethodId,
        type: pm.type,
        brand: pm.brand,
        last4: pm.last4,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        isDefault: false
      });
    }

    // Set the new default payment method
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    await upsertPaymentMethod({
      lawFirmId,
      stripePaymentMethodId: paymentMethodId,
      type: stripePaymentMethod.type,
      brand: stripePaymentMethod.card?.brand,
      last4: stripePaymentMethod.card?.last4,
      expiryMonth: stripePaymentMethod.card?.exp_month,
      expiryYear: stripePaymentMethod.card?.exp_year,
      isDefault: true
    });

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated',
      defaultPaymentMethodId: paymentMethodId
    });

  } catch (error) {
    console.error('Error setting default payment method:', error);
    
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
      { success: false, error: 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods/[id] - Remove payment method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Detach payment method from customer in Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}