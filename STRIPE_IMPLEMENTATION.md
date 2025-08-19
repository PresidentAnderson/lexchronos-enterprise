# LexChronos - Complete Stripe Payment Integration

## Overview

This is a complete Stripe payment integration for LexChronos, a legal practice management system. The implementation includes subscription plans, client billing, invoice management, payment processing, and usage-based billing.

## Features Implemented

### ✅ 1. Subscription Plans (Basic, Professional, Enterprise)
- **Location**: `/lib/stripe.ts`
- **Features**:
  - Three subscription tiers with different user limits and storage
  - Automatic recurring billing
  - Trial periods (14 days default)
  - Plan upgrades/downgrades with prorated billing

### ✅ 2. Payment Processing for Law Firm Subscriptions
- **API Routes**: `/app/api/subscriptions/`
- **Features**:
  - Create new subscriptions with Stripe customers
  - Handle subscription lifecycle events
  - Automatic invoice generation
  - Payment intent creation for immediate payments

### ✅ 3. Client Billing System for Legal Services
- **Database Schema**: Complete client, case, and time entry models
- **Features**:
  - Client management with billing information
  - Case-based billing with time tracking
  - Hourly rate management
  - Custom billing descriptions

### ✅ 4. Invoice Generation and Management
- **API Routes**: `/app/api/invoices/`
- **Features**:
  - Professional invoice generation with unique numbering
  - Tax calculation and application
  - Multiple invoice types (subscription, client billing, one-time)
  - Invoice status tracking (draft, sent, paid, overdue)
  - Integration with Stripe invoices

### ✅ 5. Payment History Tracking
- **Database Models**: Payment and PaymentMethod models
- **API Routes**: `/app/api/payments/`
- **Features**:
  - Complete payment transaction history
  - Payment method management
  - Payment status tracking
  - Integration with Stripe charges and payment intents

### ✅ 6. Webhook Handlers for Stripe Events
- **Location**: `/app/api/webhooks/stripe/route.ts`
- **Events Handled**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.created` / `customer.updated`
  - `payment_method.attached` / `payment_method.detached`
  - `charge.succeeded` / `charge.failed`
  - `charge.dispute.created`

### ✅ 7. Subscription Management UI
- **Components**: 
  - `SubscriptionPlans` - Plan selection interface
  - `SubscriptionDashboard` - Management interface
- **Features**:
  - Plan comparison and selection
  - Current usage tracking
  - Plan upgrade/downgrade options
  - Cancellation and reactivation

### ✅ 8. Payment Method Management
- **API Routes**: `/app/api/payment-methods/`
- **Features**:
  - Add/remove payment methods
  - Set default payment method
  - Display card information securely
  - Handle multiple payment method types

### ✅ 9. Usage-Based Billing for Storage/Users
- **API Routes**: `/app/api/usage/`
- **Features**:
  - Track storage usage (GB)
  - Monitor user count
  - Automatic overage billing
  - Usage analytics and reporting
  - Real-time usage limit checking

### ✅ 10. Refund Handling
- **API Routes**: `/app/api/payments/refund/`
- **Features**:
  - Full and partial refunds
  - Refund reason tracking
  - Automatic payment record updates
  - Integration with Stripe refund API

### ✅ 11. Frontend Payment Components
- **Components**:
  - `PaymentForm` - Stripe Elements integration
  - `SubscriptionPlans` - Plan selection UI
  - `SubscriptionDashboard` - Management interface
- **Features**:
  - Secure payment form with Stripe Elements
  - Real-time payment validation
  - Mobile-responsive design
  - Toast notifications for user feedback

### ✅ 12. Comprehensive Dashboard
- **Location**: `/app/dashboard/page.tsx`
- **Features**:
  - Overview with key metrics
  - Subscription management
  - Billing and payment history
  - Usage analytics
  - Plan selection and management

## Technical Stack

### Backend
- **Next.js 14** - Full-stack React framework
- **Prisma** - Database ORM with PostgreSQL
- **Stripe Node.js SDK** - Payment processing
- **TypeScript** - Type safety throughout

### Frontend
- **React 18** - UI framework
- **Stripe React Elements** - Secure payment forms
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI components
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Database Schema
- **LawFirm** - Law firm information with Stripe customer
- **Subscription** - Subscription details and usage limits
- **User** - User management with role-based access
- **Client** - Client information for billing
- **Case** - Legal case management
- **Invoice** - Invoice generation and tracking
- **Payment** - Payment processing and history
- **PaymentMethod** - Stored payment methods
- **UsageRecord** - Usage tracking for billing

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lexchronos?schema=public"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe Product IDs (create these in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID="price_basic_plan_id"
STRIPE_PROFESSIONAL_PRICE_ID="price_professional_plan_id"
STRIPE_ENTERPRISE_PRICE_ID="price_enterprise_plan_id"

# Application Settings
NEXT_PUBLIC_APP_NAME="LexChronos"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 3. Configure Stripe
1. Create a Stripe account and get API keys
2. Create products and prices in Stripe Dashboard for subscription plans
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Configure webhook events (see list above)
5. Update environment variables with your Stripe keys

### 4. Run Development Server
```bash
npm run dev
```

## API Endpoints

### Subscriptions
- `GET /api/subscriptions` - Get available plans
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions/[id]` - Get subscription details
- `PUT /api/subscriptions/[id]` - Update subscription
- `DELETE /api/subscriptions/[id]` - Cancel subscription

### Payments
- `GET /api/payments` - Get payment history
- `POST /api/payments` - Create payment intent
- `POST /api/payments/refund` - Process refund

### Payment Methods
- `GET /api/payment-methods` - Get payment methods
- `POST /api/payment-methods` - Set default payment method
- `DELETE /api/payment-methods` - Remove payment method

### Invoices
- `GET /api/invoices` - Get invoices
- `POST /api/invoices` - Create invoice

### Usage
- `GET /api/usage` - Get usage data
- `POST /api/usage` - Record usage
- `PUT /api/usage` - Update usage counters

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Usage Examples

### Creating a Subscription
```typescript
const response = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lawFirm: {
      name: 'Smith & Associates',
      email: 'contact@smithlaw.com',
      phone: '+1234567890',
      address: '123 Legal St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    plan: 'PROFESSIONAL',
    trialDays: 14
  })
});
```

### Processing a Payment
```typescript
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lawFirmId: 'firm_123',
    amount: 199.99,
    description: 'Professional Plan - Monthly',
    metadata: { plan: 'PROFESSIONAL' }
  })
});
```

### Recording Usage
```typescript
const response = await fetch('/api/usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lawFirmId: 'firm_123',
    metric: 'STORAGE_GB',
    quantity: 45,
    billingPeriod: '2024-08'
  })
});
```

## Security Features

1. **Webhook Signature Verification** - All webhooks verified with Stripe signatures
2. **Environment Variable Protection** - All sensitive keys in environment variables
3. **Input Validation** - Zod schema validation on all API endpoints
4. **HTTPS Only** - Production environment uses HTTPS for all communications
5. **PCI Compliance** - Stripe handles all sensitive payment data
6. **Role-Based Access** - User permissions based on roles

## Testing

The implementation includes comprehensive error handling and can be tested with:

1. **Stripe Test Mode** - Use test API keys for development
2. **Webhook Testing** - Use Stripe CLI for local webhook testing
3. **Payment Testing** - Use Stripe test cards for payment flows

## Deployment

### Environment Setup
1. Set production environment variables
2. Update Stripe webhook URLs to production endpoints
3. Switch to production Stripe API keys
4. Configure database connection for production

### Database Migration
```bash
npx prisma migrate deploy
```

## Support and Maintenance

The implementation follows Stripe best practices and includes:
- Comprehensive error handling
- Detailed logging for debugging
- Webhook idempotency handling
- Automatic retry logic for failed operations
- Real-time status updates via webhooks

## Future Enhancements

Potential additions to the system:
1. Multi-currency support
2. Advanced analytics and reporting
3. Integration with accounting systems
4. Mobile app with payment capabilities
5. Advanced subscription features (seats, add-ons)
6. Tax compliance automation
7. Dunning management for failed payments

---

**Note**: This implementation provides a complete, production-ready Stripe integration for a legal practice management system with all major payment processing features included.