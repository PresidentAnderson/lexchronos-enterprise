/**
 * Sentry Error Tracking Configuration for LexChronos
 * @description Centralized error tracking and performance monitoring with Sentry
 */

const * as Sentry from '@sentry/node';
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

class SentryManager {
  constructor() {
    this.initialized = false;
    this.config = null;
  }

  init(config = null) {
    if (this.initialized) return;

    // Load configuration
    try {
      this.config = config || require('../../config');
    } catch (error) {
      console.warn('Sentry configuration not available, using defaults');
      this.config = {
        monitoring: {
          sentry: {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            debug: process.env.NODE_ENV === 'development',
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0
          }
        },
        app: {
          name: 'LexChronos',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      };
    }

    const sentryConfig = this.config.monitoring?.sentry;
    
    if (!sentryConfig?.dsn) {
      console.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    // Initialize Sentry
    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: sentryConfig.environment,
      debug: sentryConfig.debug || false,
      release: this.config.app.version,
      
      // Performance Monitoring
      tracesSampleRate: sentryConfig.tracesSampleRate || 0.1,
      profilesSampleRate: sentryConfig.profilesSampleRate || 0.05,
      
      // Integrations
      integrations: [
        // Default integrations
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }), // Will be set later
        new Sentry.Integrations.Postgres(),
        new Sentry.Integrations.Redis(),
        
        // Profiling integration
        nodeProfilingIntegration(),
        
        // Custom integrations
        new Sentry.Integrations.OnUncaughtException({
          exitEverything: false,
          onFatalError: (error) => {
            console.error('Fatal error occurred:', error);
          }
        }),
        
        new Sentry.Integrations.OnUnhandledRejection({
          mode: 'warn'
        })
      ],
      
      // Sampling
      beforeSend: (event, hint) => {
        return this.beforeSend(event, hint);
      },
      
      beforeSendTransaction: (event) => {
        return this.beforeSendTransaction(event);
      },
      
      // Context
      initialScope: {
        tags: {
          service: 'lexchronos',
          component: 'backend'
        },
        contexts: {
          app: {
            name: this.config.app.name,
            version: this.config.app.version
          },
          runtime: {
            name: 'node',
            version: process.version
          }
        }
      },
      
      // Transport options
      transport: Sentry.makeNodeTransport,
      transportOptions: {
        // Capture console logs
        captureConsoleIntegration: {
          levels: ['error', 'warn']
        }
      }
    });

    // Set global tags
    Sentry.setTag('service', 'lexchronos');
    Sentry.setTag('environment', sentryConfig.environment);
    Sentry.setTag('version', this.config.app.version);

    this.initialized = true;
    console.log(`✅ Sentry initialized for environment: ${sentryConfig.environment}`);
  }

  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Filter out known non-critical errors
    if (this.shouldIgnoreError(error, event)) {
      return null;
    }

    // Add additional context
    if (error && error.request) {
      event.contexts = event.contexts || {};
      event.contexts.request = {
        url: error.request.url,
        method: error.request.method,
        headers: this.sanitizeHeaders(error.request.headers)
      };
    }

    // Sanitize sensitive data
    event = this.sanitizeEvent(event);

    return event;
  }

  beforeSendTransaction(event) {
    // Filter out health check and metrics endpoints
    if (event.transaction && 
        (event.transaction.includes('/health') || 
         event.transaction.includes('/metrics'))) {
      return null;
    }

    return event;
  }

  shouldIgnoreError(error, event) {
    if (!error) return false;

    // Ignore specific error types
    const ignoredErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'NetworkError',
      'ResizeObserver loop limit exceeded',
      'Connection terminated unexpectedly',
      'ENOTFOUND',
      'ECONNRESET',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message || event.exception?.values?.[0]?.value || '';
    
    return ignoredErrors.some(ignored => errorMessage.includes(ignored));
  }

  sanitizeEvent(event) {
    // Remove sensitive data from event
    if (event.request) {
      event.request.cookies = '[Filtered]';
      event.request.headers = this.sanitizeHeaders(event.request.headers);
    }

    if (event.extra) {
      event.extra = this.sanitizeExtra(event.extra);
    }

    return event;
  }

  sanitizeHeaders(headers) {
    if (!headers) return headers;

    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token'
    ];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[Filtered]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[Filtered]';
      }
    });

    return sanitized;
  }

  sanitizeExtra(extra) {
    const sanitized = { ...extra };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'creditcard',
      'ssn',
      'social'
    ];

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[Filtered]';
      }
    });

    return sanitized;
  }

  // Express.js middleware
  requestHandler() {
    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'username'],
      ip: true,
      request: ['method', 'url', 'headers', 'query', 'cookies'],
      serverName: false
    });
  }

  tracingHandler() {
    return Sentry.Handlers.tracingHandler();
  }

  errorHandler() {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Handle all errors with status >= 400
        return error.status >= 400 || !error.status;
      }
    });
  }

  // Custom error tracking methods
  captureException(error, context = {}) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      // Add fingerprint for better grouping
      if (error.code) {
        scope.setFingerprint([error.code, error.message]);
      }

      Sentry.captureException(error);
    });
  }

  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) return;

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      Sentry.captureMessage(message);
    });
  }

  // User context
  setUser(user) {
    if (!this.initialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      ip_address: user.ip_address
    });
  }

  clearUser() {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  // Custom tags and context
  setTag(key, value) {
    if (!this.initialized) return;
    Sentry.setTag(key, value);
  }

  setContext(name, context) {
    if (!this.initialized) return;
    Sentry.setContext(name, context);
  }

  // Breadcrumbs
  addBreadcrumb(breadcrumb) {
    if (!this.initialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }

  // Performance monitoring
  startTransaction(name, operation = 'http') {
    if (!this.initialized) return null;
    return Sentry.startTransaction({ name, op: operation });
  }

  // Database transaction tracking
  trackDatabaseQuery(query, operation, table) {
    if (!this.initialized) return;

    this.addBreadcrumb({
      category: 'database',
      message: `${operation} on ${table}`,
      level: 'info',
      data: {
        query: query.substring(0, 100), // Limit query length
        operation,
        table
      }
    });
  }

  // External API tracking
  trackExternalAPI(url, method, status) {
    if (!this.initialized) return;

    this.addBreadcrumb({
      category: 'http',
      message: `${method} ${url}`,
      level: status >= 400 ? 'warning' : 'info',
      data: {
        url,
        method,
        status_code: status
      }
    });
  }

  // Authentication tracking
  trackAuthentication(method, status, userId = null) {
    if (!this.initialized) return;

    this.addBreadcrumb({
      category: 'auth',
      message: `Authentication attempt: ${method}`,
      level: status === 'success' ? 'info' : 'warning',
      data: {
        method,
        status,
        user_id: userId
      }
    });
  }

  // Payment tracking
  trackPayment(amount, currency, status, paymentMethod) {
    if (!this.initialized) return;

    this.addBreadcrumb({
      category: 'payment',
      message: `Payment attempt: ${amount} ${currency}`,
      level: status === 'success' ? 'info' : 'error',
      data: {
        amount,
        currency,
        status,
        payment_method: paymentMethod
      }
    });
  }

  // Express middleware for automatic context
  contextMiddleware() {
    return (req, res, next) => {
      if (!this.initialized) return next();

      Sentry.withScope((scope) => {
        // Set request context
        scope.setContext('request', {
          url: req.url,
          method: req.method,
          headers: this.sanitizeHeaders(req.headers),
          query: req.query,
          params: req.params,
          user_agent: req.headers['user-agent'],
          ip: req.ip
        });

        // Set user if available
        if (req.user) {
          scope.setUser({
            id: req.user.id,
            email: req.user.email,
            username: req.user.username
          });
        }

        // Add breadcrumb for request
        scope.addBreadcrumb({
          category: 'http',
          message: `${req.method} ${req.url}`,
          level: 'info',
          data: {
            method: req.method,
            url: req.url,
            query: req.query
          }
        });

        next();
      });
    };
  }

  // Graceful shutdown
  async close() {
    if (!this.initialized) return;

    return new Promise((resolve) => {
      Sentry.close(2000).then(resolve);
    });
  }

  // Health check
  healthCheck() {
    return {
      initialized: this.initialized,
      dsn_configured: Boolean(this.config?.monitoring?.sentry?.dsn),
      environment: this.config?.monitoring?.sentry?.environment
    };
  }
}

// Create singleton instance
const sentryManager = new SentryManager();

module.exports = sentryManager;