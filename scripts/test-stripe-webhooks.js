#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script for LexChronos
 * Tests webhook functionality locally and provides debugging tools
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Mock Stripe events for testing
const mockEvents = {
  'customer.subscription.created': {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: 1640995200,
    data: {
      object: {
        id: 'sub_test_subscription',
        object: 'subscription',
        status: 'active',
        customer: 'cus_test_customer',
        current_period_start: 1640995200,
        current_period_end: 1643587200,
        items: {
          data: [
            {
              id: 'si_test_item',
              price: {
                id: 'price_test_basic',
                object: 'price',
                unit_amount: 2999,
                currency: 'usd'
              }
            }
          ]
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: null
    },
    type: 'customer.subscription.created'
  },

  'invoice.paid': {
    id: 'evt_test_invoice_paid',
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: 1640995200,
    data: {
      object: {
        id: 'in_test_invoice',
        object: 'invoice',
        status: 'paid',
        customer: 'cus_test_customer',
        subscription: 'sub_test_subscription',
        number: 'INV-2025-0001',
        amount_due: 2999,
        amount_paid: 2999,
        subtotal: 2999,
        total: 2999,
        currency: 'usd',
        created: 1640995200,
        due_date: null,
        lines: {
          data: [
            {
              id: 'il_test_line',
              description: 'LexChronos Professional Plan',
              amount: 2999,
              currency: 'usd',
              quantity: 1
            }
          ]
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: null
    },
    type: 'invoice.paid'
  },

  'payment_intent.succeeded': {
    id: 'evt_test_payment_succeeded',
    object: 'event',
    api_version: '2024-12-18.acacia',
    created: 1640995200,
    data: {
      object: {
        id: 'pi_test_payment',
        object: 'payment_intent',
        status: 'succeeded',
        amount: 2999,
        currency: 'usd',
        description: 'LexChronos subscription payment',
        receipt_email: 'test@example.com',
        metadata: {
          organizationId: 'org_test_123'
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  }
};

// Command line interface
const command = process.argv[2];
const eventType = process.argv[3];

async function testWebhook(eventType) {
  if (!mockEvents[eventType]) {
    console.error(`❌ Unknown event type: ${eventType}`);
    console.log('Available event types:');
    Object.keys(mockEvents).forEach(type => {
      console.log(`  - ${type}`);
    });
    return;
  }

  const mockEvent = mockEvents[eventType];
  
  console.log(`🧪 Testing webhook for event: ${eventType}`);
  console.log('📨 Mock event payload:');
  console.log(JSON.stringify(mockEvent, null, 2));

  try {
    const response = await fetch(`http://localhost:${port}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(mockEvent)
    });

    const result = await response.json();
    
    console.log(`📊 Response status: ${response.status}`);
    console.log('📋 Response body:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Webhook test passed');
    } else {
      console.log('❌ Webhook test failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function listWebhookEvents() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const events = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('📋 Recent webhook events:');
    console.log('========================');
    
    if (events.length === 0) {
      console.log('No webhook events found');
      return;
    }

    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.eventType} (${event.stripeEventId})`);
      console.log(`   Status: ${event.processed ? '✅ Processed' : '⏳ Pending'}`);
      console.log(`   Created: ${event.createdAt.toISOString()}`);
      if (event.processingError) {
        console.log(`   Error: ${event.processingError}`);
      }
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to list webhook events:', error.message);
  }
}

async function clearWebhookEvents() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const deletedCount = await prisma.webhookEvent.deleteMany({});
    
    console.log(`🧹 Cleared ${deletedCount.count} webhook events`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to clear webhook events:', error.message);
  }
}

async function validateWebhookSetup() {
  console.log('🔍 Validating webhook setup...');
  console.log('==============================');

  // Check environment variables
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  let missingVars = [];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    return;
  }

  console.log('✅ All required environment variables are set');

  // Check database connection
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return;
  }

  // Check webhook endpoint accessibility
  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    if (response.ok) {
      console.log('✅ Application server is running');
    } else {
      console.log('❌ Application server is not responding correctly');
    }
  } catch (error) {
    console.log('⚠️ Could not reach application server (may not be running)');
  }

  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Ensure your application is running on port', port);
  console.log('2. Configure Stripe webhook endpoint:');
  console.log(`   URL: https://yourdomain.com/api/webhooks/stripe`);
  console.log('3. Subscribe to these events in Stripe dashboard:');
  console.log('   - customer.subscription.created');
  console.log('   - customer.subscription.updated');
  console.log('   - customer.subscription.deleted');
  console.log('   - invoice.created');
  console.log('   - invoice.paid');
  console.log('   - invoice.payment_failed');
  console.log('   - payment_intent.succeeded');
  console.log('   - payment_intent.payment_failed');
}

// CLI handling
switch (command) {
  case 'test':
    if (!eventType) {
      console.error('❌ Please specify an event type to test');
      console.log('Usage: node test-stripe-webhooks.js test <event_type>');
      console.log('Example: node test-stripe-webhooks.js test customer.subscription.created');
      process.exit(1);
    }
    testWebhook(eventType);
    break;

  case 'list':
    listWebhookEvents();
    break;

  case 'clear':
    clearWebhookEvents();
    break;

  case 'validate':
    validateWebhookSetup();
    break;

  case 'help':
  default:
    console.log('🔧 LexChronos Stripe Webhook Testing Tool');
    console.log('=========================================');
    console.log('');
    console.log('Usage:');
    console.log('  node test-stripe-webhooks.js <command> [args]');
    console.log('');
    console.log('Commands:');
    console.log('  test <event_type>  Test a specific webhook event');
    console.log('  list               List recent webhook events');
    console.log('  clear              Clear all webhook events from database');
    console.log('  validate           Validate webhook setup');
    console.log('  help               Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node test-stripe-webhooks.js test customer.subscription.created');
    console.log('  node test-stripe-webhooks.js list');
    console.log('  node test-stripe-webhooks.js validate');
    break;
}