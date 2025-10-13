/**
 * Sentry Edge Runtime Configuration for LexChronos
 * @description Sentry configuration for Edge Runtime functions
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  debug: SENTRY_ENVIRONMENT === 'development',
  
  // Performance Monitoring (reduced for edge functions)
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 0.2,
  
  // Edge runtime specific integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ],
  
  // Filter events for edge runtime
  beforeSend(event, hint) {
    // Edge functions should have minimal error filtering
    // to avoid performance impact
    return event;
  },
  
  beforeSendTransaction(event) {
    // Filter out high-frequency edge function calls if needed
    return event;
  },
  
  // Release identification
  release: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
  
  // Minimal scope for edge runtime
  initialScope: {
    tags: {
      component: 'edge',
      service: 'lexchronos',
      runtime: 'edge'
    }
  }
});