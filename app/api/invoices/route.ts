import { NextRequest, NextResponse } from 'next/server';
import { 
  createInvoice as createStripeInvoice,
  createPaymentIntent,
  formatCurrency
} from '@/lib/stripe';
import { 
  createInvoiceRecord,
  getInvoicesForLawFirm,
  generateInvoiceNumber,
  getLawFirmWithSubscription
} from '@/lib/db';
import { z } from 'zod';

// Create invoice schema
const createInvoiceSchema = z.object({
  lawFirmId: z.string().min(1, 'Law firm ID is required'),
  clientId: z.string().optional(),
  caseId: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(['SUBSCRIPTION', 'CLIENT_BILLING', 'ONE_TIME']),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    amount: z.number().positive()
  })),
  taxRate: z.number().min(0).max(1).default(0), // 0-1 (e.g., 0.08 for 8%)
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  sendToClient: z.boolean().default(false)
});

// Update invoice schema
const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELED', 'REFUNDED']).optional(),
  paidDate: z.string().transform(str => new Date(str)).optional(),
  notes: z.string().optional()
});

// GET /api/invoices - Get invoices for a law firm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawFirmId = searchParams.get('lawFirmId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lawFirmId) {
      return NextResponse.json(
        { success: false, error: 'Law firm ID is required' },
        { status: 400 }
      );
    }

    const invoices = await getInvoicesForLawFirm(lawFirmId, {
      status: status as any,
      type: type as any,
      limit,
      offset
    });

    // Calculate totals
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const outstandingAmount = invoices
      .filter(invoice => ['SENT', 'OVERDUE'].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.total, 0);

    return NextResponse.json({
      success: true,
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        type: invoice.type,
        status: invoice.status,
        description: invoice.description,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        client: invoice.client ? {
          id: invoice.client.id,
          firstName: invoice.client.firstName,
          lastName: invoice.client.lastName,
          email: invoice.client.email
        } : null,
        case: invoice.case ? {
          id: invoice.case.id,
          caseNumber: invoice.case.caseNumber,
          title: invoice.case.title
        } : null,
        payments: invoice.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        })),
        stripeInvoiceId: invoice.stripeInvoiceId,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      })),
      summary: {
        totalInvoices: invoices.length,
        totalAmount,
        paidAmount,
        outstandingAmount,
        formattedTotals: {
          total: formatCurrency(totalAmount),
          paid: formatCurrency(paidAmount),
          outstanding: formatCurrency(outstandingAmount)
        }
      },
      pagination: {
        limit,
        offset,
        hasMore: invoices.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createInvoiceSchema.parse(body);

    const { 
      lawFirmId, 
      clientId, 
      caseId, 
      userId, 
      type, 
      description, 
      items, 
      taxRate, 
      dueDate, 
      notes,
      sendToClient
    } = validatedData;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Get law firm for Stripe customer
    const lawFirm = await getLawFirmWithSubscription(lawFirmId);
    if (!lawFirm || !lawFirm.stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Law firm not found or missing Stripe customer' },
        { status: 404 }
      );
    }

    let stripeInvoiceId: string | undefined;
    let stripePaymentIntentId: string | undefined;

    // Create Stripe invoice if sending to client
    if (sendToClient && type === 'CLIENT_BILLING') {
      try {
        const stripeInvoice = await createStripeInvoice({
          customerId: lawFirm.stripeCustomerId,
          description: description || `Invoice ${invoiceNumber}`,
          amount: total,
          dueDate,
          metadata: {
            invoiceNumber,
            lawFirmId,
            clientId: clientId || '',
            caseId: caseId || '',
            type
          }
        });
        stripeInvoiceId = stripeInvoice.id;
      } catch (stripeError) {
        console.error('Error creating Stripe invoice:', stripeError);
        // Continue without Stripe invoice - can be created later
      }
    }

    // Create invoice record in database
    const invoice = await createInvoiceRecord({
      invoiceNumber,
      lawFirmId,
      clientId,
      caseId,
      userId,
      type,
      description: description || `Invoice for ${items.map(i => i.description).join(', ')}`,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: sendToClient ? 'SENT' : 'DRAFT',
      issueDate: new Date(),
      dueDate,
      stripeInvoiceId,
      stripePaymentIntentId
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        type: invoice.type,
        status: invoice.status,
        description: invoice.description,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        stripeInvoiceId: invoice.stripeInvoiceId,
        items,
        notes
      }
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
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
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}