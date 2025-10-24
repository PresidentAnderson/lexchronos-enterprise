# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LexChronos is a comprehensive, cloud-native legal case management platform built for modern law firms. It features real-time collaboration, AI-powered insights, and enterprise-grade security. The application combines Next.js 14 with App Router, PostgreSQL with Prisma ORM, Socket.io for real-time features, and Stripe for subscription billing.

## Development Commands

### Server & Development
```bash
npm run dev              # Start development server with Socket.io on localhost:3000
npm run build            # Build production bundle (runs prisma generate first)
npm start                # Start production server with Socket.io
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run db:setup         # Initial database setup (custom script)
npm run db:migrate       # Create and apply new migration
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (drops all data)
npm run db:studio        # Open Prisma Studio GUI
npx prisma generate      # Regenerate Prisma Client after schema changes
```

### Testing
```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # Run tests for CI (no watch)
npm run test:e2e         # Run Cypress E2E tests (headless)
npm run test:e2e:dev     # Open Cypress UI for E2E tests
npm run test:lighthouse  # Run Lighthouse performance tests
npm run test:all         # Run all test suites (CI, E2E, Lighthouse)
```

### Internationalization (i18n)
```bash
npm run i18n:check       # Check translation file integrity
npm run i18n:missing     # List missing translation keys
npm run i18n:stats       # Show translation coverage stats
npm run i18n:export      # Export translations to JSON
npm run i18n:import      # Import translations from JSON
```

### Analytics & Monitoring
```bash
npm run verify-analytics # Verify analytics integration (Google Analytics, Clarity)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Backend**: Custom Node.js server (server.js) with Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Sessions**: Redis
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io for live collaboration
- **Payments**: Stripe
- **Monitoring**: Sentry
- **Testing**: Jest, React Testing Library, Cypress, Playwright

### Directory Structure

```
lexchrono/
├── app/                       # Next.js 14 App Router pages
│   ├── api/                   # API routes (auth, cases, documents, billing, etc.)
│   ├── (authenticated pages)/ # dashboard, cases, documents, timeline, calendar, etc.
│   └── layout.tsx             # Root layout with providers
├── components/                # React components
│   ├── ui/                    # Reusable UI components (Radix-based)
│   ├── forms/                 # Form components
│   ├── modals/                # Modal dialogs
│   └── admin/                 # Admin-specific components
├── lib/                       # Core utilities and services
│   ├── auth/                  # Authentication (JWT, bcrypt)
│   ├── database/              # Database helpers
│   ├── validation/            # Zod schemas
│   ├── email/                 # Email service with templates
│   ├── encryption/            # Data encryption utilities
│   ├── security/              # Security utilities
│   ├── monitoring/            # Performance monitoring
│   ├── analytics/             # Analytics tracking
│   └── middleware/            # Auth, CORS, security headers
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts             # Authentication state
│   ├── useSocket.ts           # Socket.io connection
│   ├── useCaseUpdates.ts      # Real-time case updates
│   ├── useDocumentCollaboration.ts  # Live document editing
│   └── useNotifications.ts    # Real-time notifications
├── prisma/
│   ├── schema.prisma          # Database schema (comprehensive legal domain model)
│   └── seed.ts                # Database seed data
├── __tests__/                 # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── security/              # Security tests
│   ├── accessibility/         # A11y tests
│   └── components/            # Component tests
├── cypress/                   # E2E tests
├── tests/playwright/          # Cross-browser tests
├── email-templates/           # Handlebars email templates
├── scripts/                   # Utility scripts
└── server.js                  # Custom Node.js server with Socket.io
```

### Real-Time Architecture (Socket.io)

The application uses a custom Node.js server (server.js) that wraps Next.js and adds Socket.io for real-time features:

**Real-time Features:**
- Case updates and activity feeds
- Live document collaboration with cursor tracking
- Instant notifications
- Chat system with typing indicators
- Timeline updates
- Presence indicators (online/offline status)
- Search suggestions

**Socket Events:**
- `case:join`, `case:leave`, `case:update`, `case:updated`
- `document:join`, `document:leave`, `document:edit`, `document:cursor`
- `chat:join`, `chat:message`, `chat:typing`
- `timeline:join`, `timeline:add_event`
- `notification:mark_read`, `notification:deadline`
- `presence:update`

**Authentication**: Socket.io connections are authenticated via JWT tokens passed in the handshake.

### Database Schema (Prisma)

The schema includes comprehensive legal domain models:
- **User**: Role-based users (LAWYER, PARALEGAL, ADMIN, CLIENT)
- **Organization**: Law firms with subscription tiers
- **Case**: Case management with status tracking
- **Client**: Client information and portal access
- **Document**: Document management with version control
- **Evidence**: Chain of custody tracking
- **Timeline**: Case timeline events
- **Deadline**: Automated deadline tracking with court rules
- **BillingEntry**: Time tracking and invoicing
- **Note**: Case notes and communications
- **ConflictCheck**: Conflict of interest management
- **Lead**: Client intake and CRM
- **Notification**: Real-time notification system

**Key Relationships:**
- Organizations → Users → Cases → Documents/Deadlines/Notes
- Cases → Timelines, Billing Entries, Evidence
- Automated deadline calculations based on court rules

### Authentication & Security

**JWT Authentication:**
- Access tokens (15min default) + refresh tokens (7d default)
- Tokens include: userId, email, role
- Middleware: `lib/middleware/auth.ts`
- Service: `lib/auth/jwt.ts`

**Security Features:**
- RBAC (Role-Based Access Control)
- Field-level encryption for sensitive data
- Rate limiting
- CORS configuration
- Security headers middleware
- Audit logging
- MFA support

**Environment Variables:**
- See `.env.example` for all required configuration
- Critical: `JWT_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `ENCRYPTION_KEY`

### API Routes Structure

Located in `app/api/`, organized by domain:
- **auth/**: login, register, refresh tokens
- **cases/**: CRUD operations, case management
- **documents/**: upload, version control, OCR
- **billing/**: time tracking, invoices, payments
- **clients/**: client management
- **deadlines/**: deadline management, automated calculations
- **court-dates/**: calendar management
- **conflicts/**: conflict checking
- **evidence/**: chain of custody
- **notifications/**: notification management
- **health/**: health checks for monitoring

### Forms & Validation

- Forms use `react-hook-form` with `zod` for validation
- Validation schemas: `lib/validation/` and inline in API routes
- UI components from Radix UI with Tailwind styling

### Email System

- Service: `lib/email/`
- Templates: `email-templates/` (Handlebars)
- Transports: SMTP, SendGrid, Mailgun, AWS SES (configurable)
- Email types: Welcome, case updates, deadline reminders, invoices

### Analytics & Monitoring

**Integrated Analytics:**
- Google Analytics 4 (GA4)
- Microsoft Clarity
- Custom legal analytics
- Hook: `hooks/use-analytics.ts`

**Monitoring:**
- Sentry for error tracking and performance
- Prometheus metrics: `monitoring/prometheus/`
- Custom logging: `lib/logging/`

### Testing Strategy

**Unit Tests (Jest):**
- Located in `__tests__/unit/`
- Coverage threshold: 80% (branches, functions, lines, statements)
- Run: `npm test`

**Integration Tests:**
- API endpoint tests in `__tests__/integration/`
- Authentication, billing, webhooks

**E2E Tests (Cypress):**
- Specs in `cypress/e2e/`
- Config: `cypress.config.ts`
- Run: `npm run test:e2e:dev` (UI) or `npm run test:e2e` (headless)

**Cross-Browser Tests (Playwright):**
- Specs in `tests/playwright/`
- Tests for Chrome, Firefox, Safari

**Accessibility Tests:**
- `__tests__/accessibility/` using jest-axe and axe-playwright
- Keyboard navigation tests

**Performance Tests:**
- Lighthouse CI: `npm run test:lighthouse`
- Config: `.lighthouserc.js`

## Important Patterns & Conventions

### Path Aliases
TypeScript path aliases are configured in `tsconfig.json`:
```typescript
import { Button } from '@/components/ui/button'
import { validateEmail } from '@/lib/validation'
import { useAuth } from '@/hooks/useAuth'
```

### API Response Format
API routes should return consistent JSON responses:
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }
```

### Real-Time Hook Usage
When adding real-time features, use the Socket.io hooks:
```typescript
import { useSocket } from '@/hooks/useSocket'
import { useCaseUpdates } from '@/hooks/useCaseUpdates'

// Join a case room and listen for updates
const { updateCase } = useCaseUpdates(caseId)
```

### Database Queries
Always use Prisma Client for database operations:
```typescript
import { prisma } from '@/lib/db'

const cases = await prisma.case.findMany({
  where: { organizationId },
  include: { client: true, assignedUser: true }
})
```

### Adding New API Routes
1. Create route file in `app/api/[route]/route.ts`
2. Export named functions: `GET`, `POST`, `PUT`, `DELETE`
3. Add authentication middleware if needed
4. Add validation using Zod schemas
5. Return NextResponse with appropriate status codes

### Adding Database Models
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description_of_change`
3. Run `npx prisma generate` to update Prisma Client
4. Update TypeScript types if needed

### Testing New Features
1. Write unit tests in `__tests__/unit/`
2. Add integration tests in `__tests__/integration/` for API routes
3. Add E2E tests in `cypress/e2e/` for user flows
4. Run `npm run test:all` before committing

## Deployment

The application is designed for deployment on:
- **Frontend**: Vercel (optimized for Next.js)
- **Backend/Database**: Railway (PostgreSQL + Redis)
- **File Storage**: Vercel Blob or AWS S3
- **Monitoring**: Sentry

Alternative: Self-hosted using Docker (see `database/` and `monitoring/` directories for configs)

## Common Gotchas

1. **Socket.io in Development**: The custom server (server.js) must be running for real-time features to work. Use `npm run dev`, not `next dev`.

2. **Prisma Client**: After schema changes, always run `npx prisma generate` before building or running tests.

3. **Environment Variables**: Next.js public env vars must be prefixed with `NEXT_PUBLIC_`. Server-side vars should never be exposed to the client.

4. **Authentication**: API routes that require auth should use the auth middleware. Check `lib/middleware/auth.ts` for implementation.

5. **Real-Time State**: Socket.io maintains in-memory state in development. Use Redis in production for distributed systems.

6. **Testing with Socket.io**: Mock Socket.io in unit tests. Use the actual server for E2E tests.

7. **Database Seeding**: The seed script (`prisma/seed.ts`) requires `ts-node` and specific compiler options (see package.json).
