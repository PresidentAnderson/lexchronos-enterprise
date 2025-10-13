# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on port 3000, uses custom server.js)
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server

### Testing
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI (no watch mode)
- `npm run test:e2e` - Run end-to-end tests with Cypress
- `npm run test:e2e:dev` - Open Cypress interactive mode
- `npm run test:lighthouse` - Run Lighthouse performance tests
- `npm run test:all` - Run all test suites (unit, e2e, lighthouse)

### Database Operations
- `npm run db:setup` - Initialize database setup
- `npm run db:migrate` - Run Prisma migrations in development
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (destructive operation)
- `npm run db:studio` - Open Prisma Studio for database inspection

### Internationalization
- `npm run i18n:check` - Check translation files for issues
- `npm run i18n:missing` - Find missing translations
- `npm run i18n:stats` - Show translation statistics
- `npm run i18n:export` - Export translations for external tools
- `npm run i18n:import` - Import translations from external sources

### Code Quality
- `npm run lint` - Run ESLint for code quality checks

## Architecture Overview

### Framework & Stack
- **Next.js 14+** with App Router (not Pages Router) - primary routing in `/app` directory
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL database
- **Socket.io** for real-time features
- **Tailwind CSS** for styling with **Radix UI** components
- **Stripe** for payment processing
- **Sentry** for error monitoring and performance tracking

### Directory Structure

#### `/app` (Next.js App Router)
- **API routes**: `/app/api/*` - RESTful API endpoints
- **Pages**: `/app/*/page.tsx` - Main application pages
- **Layouts**: `/app/layout.tsx` and nested layouts
- **Admin section**: `/app/admin/*` - Administrative interface

#### `/components`
- **UI components**: `/components/ui/*` - Reusable Radix UI-based components
- **Feature components**: Organized by domain (admin, analytics, conflicts, etc.)
- **Specialized components**: Document handling, timeline, trust accounting

#### `/lib`
- **Core utilities**: Database connection, validation, utilities
- **Authentication**: JWT handling, RBAC (Role-Based Access Control)
- **Security**: Encryption, rate limiting, session management
- **Analytics**: Google Analytics, Microsoft Clarity, custom legal analytics
- **Email**: Nodemailer with Handlebars templates
- **Monitoring**: Sentry integration and custom metrics

#### `/prisma`
- Database schema and migrations
- Seed data scripts

### Key Features & Domains

#### Legal Case Management
- Case tracking and timeline generation
- Document management with OCR capabilities
- Court date and deadline management
- Conflict checking system

#### Business Operations
- Time tracking and billing
- Trust account management
- Subscription billing via Stripe
- Financial reporting and analytics

#### Real-time Collaboration
- Socket.io implementation for live features
- Real-time document editing
- Presence indicators and notifications

#### Security & Compliance
- RBAC authorization system
- Audit logging
- Data encryption
- Security headers and CORS configuration

### Development Guidelines

#### Database Changes
- Always run `npx prisma generate` after schema changes
- Use `npm run db:migrate` for development migrations
- Database seeding available via `npm run db:seed`

#### Testing Strategy
- Unit tests with Jest and React Testing Library
- E2E tests with Cypress (includes accessibility testing)
- Performance monitoring with Lighthouse CI
- Run all tests before major deployments with `npm run test:all`

#### Internationalization (i18n)
- Built with next-i18next
- Translation files managed via custom scripts
- Check translation status with i18n commands before releases

#### Real-time Features
- Socket.io server runs alongside Next.js
- Custom server.js handles both HTTP and WebSocket connections
- Real-time components in `/components` use Socket.io client

#### Performance & Monitoring
- Sentry integrated for error tracking and performance monitoring
- Custom analytics for legal-specific metrics
- Image optimization configured for WebP/AVIF formats
- PWA capabilities with service worker support

### Common Workflows

#### Adding New Features
1. Update database schema in `/prisma/schema.prisma` if needed
2. Run database migration with `npm run db:migrate`
3. Add API endpoints in `/app/api/*`
4. Create UI components in `/components`
5. Add pages in `/app/*`
6. Write tests and run `npm run test:all`

#### Deployment Preparation
1. Run `npm run lint` to check code quality
2. Run `npm run test:all` to ensure all tests pass
3. Run `npm run build` to verify production build
4. Check i18n completeness with `npm run i18n:missing`

This codebase follows enterprise-grade practices with comprehensive testing, security measures, and real-time collaboration features specifically designed for legal practice management.