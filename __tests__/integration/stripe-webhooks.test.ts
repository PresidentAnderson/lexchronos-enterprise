/**
 * Stripe Webhooks Integration Tests
 * Tests webhook handling, payment processing, and subscription management
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/stripe/route';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: jest.fn()
      },
      customers: {
        retrieve: jest.fn()
      }
    }))
  };
});

// Mock headers
jest.mock('next/headers', () => ({
  headers: () => ({
    get: jest.fn().mockReturnValue('test_signature')
  })
}));

// Mock email service
jest.mock('@/lib/email', () => ({
  emailService: {
    sendSystemNotification: jest.fn().mockResolvedValue(true),
    sendInvoice: jest.fn().mockResolvedValue(true)
  }
}));

describe('Stripe Webhooks Integration Tests', () => {
  let testOrganization: any;
  let mockStripe: jest.Mocked<Stripe>;

  beforeEach(async () => {
    // Clean up test data
    await prisma.webhookEvent.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Law Firm',
        email: 'test@lawfirm.com',
        type: 'LAW_FIRM'
      }
    });

    // Setup Stripe mock
    const StripeConstructor = Stripe as jest.MockedClass<typeof Stripe>;
    mockStripe = new StripeConstructor('test_key') as jest.Mocked<Stripe>;

    // Mock customer retrieval
    mockStripe.customers.retrieve.mockResolvedValue({
      id: 'cus_test_customer',
      email: testOrganization.email,
      name: testOrganization.name
    } as Stripe.Customer);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    
    // Clean up test data
    await prisma.webhookEvent.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
  });

  describe('Webhook Event Processing', () => {
    it('should reject webhook without signature', async () => {
      const mockHeaders = require('next/headers');
      mockHeaders.headers = () => ({
        get: jest.fn().mockReturnValue(null)
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Missing Stripe signature');
    });

    it('should handle webhook signature verification failure', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('signature verification failed');
    });

    it('should store webhook events for idempotency', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'customer.subscription.created',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: {
          object: {
            id: 'sub_test',
            customer: 'cus_test_customer',
            status: 'active'
          } as Stripe.Subscription
        },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      await POST(request);

      // Check if webhook event was stored
      const storedEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId: mockEvent.id }
      });

      expect(storedEvent).not.toBeNull();
      expect(storedEvent?.eventType).toBe(mockEvent.type);
      expect(storedEvent?.processed).toBe(true);
    });

    it('should handle duplicate webhook events', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_duplicate_test',
        type: 'payment_intent.succeeded',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: {
          object: {
            id: 'pi_test',
            amount: 2999,
            currency: 'usd',
            status: 'succeeded'
          } as Stripe.PaymentIntent
        },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      // Create existing webhook event
      await prisma.webhookEvent.create({
        data: {
          stripeEventId: mockEvent.id,
          eventType: mockEvent.type,
          data: mockEvent as any,
          processed: true
        }
      });

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.received).toBe(true);
    });
  });

  describe('Subscription Event Handling', () => {
    it('should handle subscription.created event', async () => {
      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test_created',
        object: 'subscription',
        customer: 'cus_test_customer',
        status: 'active',
        current_period_start: 1640995200,
        current_period_end: 1643587200,
        items: {
          object: 'list',
          data: [{
            id: 'si_test',
            object: 'subscription_item',
            price: {
              id: 'price_test_professional',
              object: 'price',
              unit_amount: 2999,
              currency: 'usd'
            }
          } as Stripe.SubscriptionItem],
          has_more: false,
          url: ''
        }
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_sub_created',
        type: 'customer.subscription.created',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockSubscription },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if subscription was created
      const subscription = await prisma.subscription.findUnique({
        where: { organizationId: testOrganization.id }
      });

      expect(subscription).not.toBeNull();
      expect(subscription?.stripeSubscriptionId).toBe(mockSubscription.id);
      expect(subscription?.status).toBe('ACTIVE');
    });

    it('should handle subscription.updated event', async () => {
      // First create a subscription
      const existingSubscription = await prisma.subscription.create({
        data: {
          organizationId: testOrganization.id,
          stripeSubscriptionId: 'sub_test_update',
          stripeCustomerId: 'cus_test_customer',
          status: 'ACTIVE',
          tier: 'BASIC'
        }
      });

      const mockSubscription: Stripe.Subscription = {
        id: 'sub_test_update',
        object: 'subscription',
        customer: 'cus_test_customer',
        status: 'canceled',
        canceled_at: 1641081600,
        cancellation_details: {
          reason: 'cancellation_requested'
        }
      } as Stripe.Subscription;

      const mockEvent: Stripe.Event = {
        id: 'evt_sub_updated',
        type: 'customer.subscription.updated',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockSubscription },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if subscription was updated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id }
      });

      expect(updatedSubscription?.status).toBe('CANCELED');
      expect(updatedSubscription?.cancellationReason).toBe('cancellation_requested');
    });
  });

  describe('Invoice Event Handling', () => {
    it('should handle invoice.created event', async () => {
      const mockInvoice: Stripe.Invoice = {
        id: 'in_test_created',
        object: 'invoice',
        customer: 'cus_test_customer',
        status: 'open',
        number: 'INV-2025-0001',
        amount_due: 2999,
        amount_paid: 0,
        subtotal: 2999,
        total: 2999,
        currency: 'usd',
        created: 1640995200,
        lines: {
          object: 'list',
          data: [{
            id: 'il_test',
            object: 'line_item',
            description: 'LexChronos Professional Plan',
            amount: 2999,
            currency: 'usd',
            quantity: 1
          }],
          has_more: false,
          url: ''
        }
      } as Stripe.Invoice;

      const mockEvent: Stripe.Event = {
        id: 'evt_invoice_created',
        type: 'invoice.created',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockInvoice },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if invoice was created
      const invoice = await prisma.invoice.findUnique({
        where: { stripeInvoiceId: mockInvoice.id }
      });

      expect(invoice).not.toBeNull();
      expect(invoice?.number).toBe(mockInvoice.number);
      expect(invoice?.status).toBe('OPEN');
      expect(invoice?.total).toBe(mockInvoice.total);
    });

    it('should handle invoice.paid event', async () => {
      // First create an invoice
      const existingInvoice = await prisma.invoice.create({
        data: {
          stripeInvoiceId: 'in_test_paid',
          number: 'INV-2025-0002',
          status: 'OPEN',
          subtotal: 2999,
          total: 2999,
          amountDue: 2999,
          currency: 'USD',
          customerEmail: testOrganization.email,
          organizationId: testOrganization.id,
          lineItems: [{ description: 'Test service', amount: 2999 }]
        }
      });

      const mockInvoice: Stripe.Invoice = {
        id: 'in_test_paid',
        object: 'invoice',
        status: 'paid',
        amount_paid: 2999
      } as Stripe.Invoice;

      const mockEvent: Stripe.Event = {
        id: 'evt_invoice_paid',
        type: 'invoice.paid',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockInvoice },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if invoice was updated
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: existingInvoice.id }
      });

      expect(updatedInvoice?.status).toBe('PAID');
      expect(updatedInvoice?.amountPaid).toBe(2999);
      expect(updatedInvoice?.paidAt).not.toBeNull();
    });
  });

  describe('Payment Event Handling', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const mockPaymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_succeeded',
        object: 'payment_intent',
        status: 'succeeded',
        amount: 2999,
        currency: 'usd',
        description: 'LexChronos subscription payment',
        receipt_email: 'customer@example.com',
        metadata: {
          organizationId: testOrganization.id
        }
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_payment_succeeded',
        type: 'payment_intent.succeeded',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockPaymentIntent },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if payment was created
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: mockPaymentIntent.id }
      });

      expect(payment).not.toBeNull();
      expect(payment?.status).toBe('SUCCEEDED');
      expect(payment?.amount).toBe(mockPaymentIntent.amount);
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const mockPaymentIntent: Stripe.PaymentIntent = {
        id: 'pi_test_failed',
        object: 'payment_intent',
        status: 'requires_payment_method',
        amount: 2999,
        currency: 'usd',
        last_payment_error: {
          message: 'Your card was declined.'
        },
        metadata: {
          organizationId: testOrganization.id
        }
      } as Stripe.PaymentIntent;

      const mockEvent: Stripe.Event = {
        id: 'evt_payment_failed',
        type: 'payment_intent.payment_failed',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: mockPaymentIntent },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Check if payment failure was recorded
      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: mockPaymentIntent.id }
      });

      expect(payment).not.toBeNull();
      expect(payment?.status).toBe('FAILED');
      expect(payment?.failureReason).toBe('Your card was declined.');
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_error_test',
        type: 'customer.subscription.created',
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: {
          object: {
            id: 'sub_invalid',
            customer: 'cus_nonexistent'
          } as Stripe.Subscription
        },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.customers.retrieve.mockRejectedValue(new Error('Customer not found'));

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200); // Should still return 200 to prevent retries
      expect(result.received).toBe(true);

      // Check if error was recorded
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId: mockEvent.id }
      });

      expect(webhookEvent?.processingError).toContain('Customer not found');
    });

    it('should handle unknown event types', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_unknown_type',
        type: 'unknown.event.type' as any,
        api_version: '2024-12-18.acacia',
        created: 1640995200,
        data: { object: {} },
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent)
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Should still store the event
      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId: mockEvent.id }
      });

      expect(webhookEvent).not.toBeNull();
      expect(webhookEvent?.processed).toBe(true);
    });
  });
});