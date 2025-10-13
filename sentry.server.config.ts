/**
 * Sentry Server-side Configuration for LexChronos
 * @description Server-side error tracking and performance monitoring for Next.js
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  debug: SENTRY_ENVIRONMENT === 'development',
  
  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 1.0,
  
  integrations: [
    // Default Node.js integrations
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
    new Sentry.Integrations.Redis(),
    
    // Error handling
    new Sentry.Integrations.OnUncaughtException({
      exitEverything: false
    }),
    new Sentry.Integrations.OnUnhandledRejection({
      mode: 'warn'
    })
  ],
  
  // Filter events before sending
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out known server-side errors
    const ignoredErrors = [
      'ENOTFOUND',
      'ECONNRESET', 
      'ETIMEDOUT',
      'Connection terminated unexpectedly',
      'Client has already been released',
      'Connection terminated'
    ];
    
    const errorMessage = error?.message || event.exception?.values?.[0]?.value || '';
    
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
      return null;
    }
    
    // Sanitize sensitive data
    if (event.request) {
      // Remove sensitive headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // Remove sensitive cookies
      if (event.request.cookies) {
        event.request.cookies = '[Filtered]';
      }
    }
    
    return event;
  },
  
  beforeSendTransaction(event) {
    // Filter out health check and metrics transactions
    if (event.transaction && (
      event.transaction.includes('/api/health') ||
      event.transaction.includes('/api/metrics') ||
      event.transaction.includes('/_next/static')
    )) {
      return null;
    }
    
    return event;
  },
  
  // Release identification
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || '1.0.0',
  
  // Initial scope
  initialScope: {
    tags: {
      component: 'backend',
      service: 'lexchronos',
      runtime: 'nodejs'
    }
  },
  
  // Transport options
  transportOptions: {
    captureUnhandledRejections: true,
    captureUncaughtExceptions: true
  }
});