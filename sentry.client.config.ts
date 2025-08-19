/**
 * Sentry Client-side Configuration for LexChronos
 * @description Client-side error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  debug: SENTRY_ENVIRONMENT === 'development',
  
  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true
    }),
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.nextRouterInstrumentation({
        router: undefined // Will be auto-detected
      }),
      enableLongTask: true,
      enableInp: true
    })
  ],
  
  // Filter out irrelevant errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out known client-side errors
    const ignoredErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'NetworkError',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error',
      'TypeError: Failed to fetch'
    ];
    
    const errorMessage = error?.message || event.exception?.values?.[0]?.value || '';
    
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
      return null;
    }
    
    // Filter out errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(frame => 
      frame.filename?.includes('extension://') || 
      frame.filename?.includes('moz-extension://') ||
      frame.filename?.includes('safari-extension://')
    )) {
      return null;
    }
    
    return event;
  },
  
  // Configure allowed URLs for better signal/noise ratio
  allowUrls: [
    // Your domain
    /https?:\/\/lexchronos\.com/,
    /https?:\/\/.*\.lexchronos\.com/,
    // Local development
    /https?:\/\/localhost/,
    /https?:\/\/127\.0\.0\.1/
  ],
  
  // Block URLs you don't want to track
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i
  ],
  
  // Release identification
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Initial scope
  initialScope: {
    tags: {
      component: 'frontend',
      service: 'lexchronos'
    }
  }
});