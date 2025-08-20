/**
 * Enhanced Error Reporting for LexChronos
 * Provides structured error reporting with context and legal-specific metadata
 */

import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/db';

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  caseId?: string;
  feature?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LegalError {
  type: 'CASE_MANAGEMENT' | 'BILLING' | 'DOCUMENT' | 'DEADLINE' | 'COURT_DATE' | 'USER_AUTH' | 'SUBSCRIPTION' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  context?: ErrorContext;
  originalError?: Error;
  timestamp?: Date;
}

class ErrorReporter {
  /**
   * Report a legal-specific error with enhanced context
   */
  static async reportError(error: LegalError): Promise<void> {
    try {
      // Set Sentry context
      Sentry.withScope(async (scope) => {
        // Set error level
        const sentryLevel = this.mapSeverityToSentryLevel(error.severity);
        scope.setLevel(sentryLevel);

        // Set tags for filtering
        scope.setTag('error.type', error.type);
        scope.setTag('error.severity', error.severity);
        scope.setTag('service', 'lexchronos');

        // Set context data
        if (error.context) {
          scope.setContext('legal_context', error.context);

          // Set user context if available
          if (error.context.userId) {
            try {
              const user = await prisma.user.findUnique({
                where: { id: error.context.userId },
                select: {
                  id: true,
                  email: true,
                  role: true,
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      subscriptionTier: true
                    }
                  }
                }
              });

              if (user) {
                scope.setUser({
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  organization: user.organization?.name
                });

                scope.setTag('user.role', user.role);
                scope.setTag('organization.tier', user.organization?.subscriptionTier || 'unknown');
              }
            } catch (dbError) {
              // Don't let database errors prevent error reporting
              scope.setContext('user_fetch_error', { error: String(dbError) });
            }
          }

          // Set additional context
          if (error.context.organizationId) {
            scope.setTag('organization.id', error.context.organizationId);
          }
          if (error.context.caseId) {
            scope.setTag('case.id', error.context.caseId);
          }
          if (error.context.feature) {
            scope.setTag('feature', error.context.feature);
          }
          if (error.context.action) {
            scope.setTag('action', error.context.action);
          }
        }

        // Set fingerprint for grouping
        const fingerprint = [
          error.type,
          error.message.replace(/\d+/g, '[number]').replace(/[a-f0-9-]{36}/g, '[uuid]')
        ];
        scope.setFingerprint(fingerprint);

        // Capture the error
        if (error.originalError) {
          Sentry.captureException(error.originalError);
        } else {
          Sentry.captureMessage(error.message, sentryLevel);
        }
      });

      // Log locally for development
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 Legal Error Reported:', {
          type: error.type,
          severity: error.severity,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp || new Date()
        });
      }

    } catch (reportingError) {
      console.error('Failed to report error to Sentry:', reportingError);
    }
  }

  /**
   * Report case management errors
   */
  static async reportCaseError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'CASE_MANAGEMENT',
      severity: originalError ? 'HIGH' : 'MEDIUM',
      message,
      context,
      originalError
    });
  }

  /**
   * Report billing errors
   */
  static async reportBillingError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'BILLING',
      severity: 'HIGH', // Billing errors are always high severity
      message,
      context,
      originalError
    });
  }

  /**
   * Report document errors
   */
  static async reportDocumentError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'DOCUMENT',
      severity: 'MEDIUM',
      message,
      context,
      originalError
    });
  }

  /**
   * Report critical deadline errors
   */
  static async reportDeadlineError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'DEADLINE',
      severity: 'CRITICAL', // Deadline issues are critical in legal context
      message,
      context,
      originalError
    });
  }

  /**
   * Report authentication and authorization errors
   */
  static async reportAuthError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'USER_AUTH',
      severity: 'HIGH',
      message,
      context,
      originalError
    });
  }

  /**
   * Report subscription and payment errors
   */
  static async reportSubscriptionError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'SUBSCRIPTION',
      severity: 'HIGH',
      message,
      context,
      originalError
    });
  }

  /**
   * Report system-level errors
   */
  static async reportSystemError(message: string, context: ErrorContext, originalError?: Error): Promise<void> {
    await this.reportError({
      type: 'SYSTEM',
      severity: 'CRITICAL',
      message,
      context,
      originalError
    });
  }

  /**
   * Add breadcrumb for debugging trail
   */
  static addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: any): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Set user context for all subsequent errors
   */
  static async setUserContext(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionTier: true
            }
          }
        }
      });

      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: `${user.firstName} ${user.lastName}`,
          role: user.role,
          organization: user.organization?.name,
          subscription_tier: user.organization?.subscriptionTier
        });
      }
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  /**
   * Clear user context (on logout)
   */
  static clearUserContext(): void {
    Sentry.setUser(null);
  }

  /**
   * Start a performance transaction
   */
  static startTransaction(name: string, operation: string): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op: operation,
      tags: {
        service: 'lexchronos'
      }
    });
  }

  /**
   * Map severity to Sentry level
   */
  private static mapSeverityToSentryLevel(severity: LegalError['severity']): Sentry.SeverityLevel {
    switch (severity) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'CRITICAL':
        return 'fatal';
      default:
        return 'error';
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  /**
   * Monitor database query performance
   */
  static monitorDatabaseQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'db.query',
      description: queryName
    });

    const startTime = Date.now();

    return queryFunction()
      .then(result => {
        const duration = Date.now() - startTime;
        span?.setTag('query.duration_ms', duration);
        span?.setStatus('ok');
        
        // Log slow queries
        if (duration > 1000) {
          ErrorReporter.addBreadcrumb(
            `Slow database query: ${queryName}`,
            'database',
            'warning',
            { duration, query: queryName }
          );
        }
        
        return result;
      })
      .catch(error => {
        span?.setStatus('internal_error');
        span?.setTag('error', true);
        throw error;
      })
      .finally(() => {
        span?.finish();
      });
  }

  /**
   * Monitor API endpoint performance
   */
  static monitorAPIEndpoint<T>(
    endpoint: string,
    method: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const transaction = ErrorReporter.startTransaction(
      `${method} ${endpoint}`,
      'http.server'
    );

    Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));

    const startTime = Date.now();

    return handler()
      .then(result => {
        const duration = Date.now() - startTime;
        transaction.setTag('http.status_code', 200);
        transaction.setTag('response.duration_ms', duration);
        transaction.setStatus('ok');
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        transaction.setTag('http.status_code', 500);
        transaction.setTag('response.duration_ms', duration);
        transaction.setStatus('internal_error');
        throw error;
      })
      .finally(() => {
        transaction.finish();
      });
  }

  /**
   * Monitor external API calls
   */
  static monitorExternalAPI<T>(
    apiName: string,
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'http.client',
      description: `${apiName}: ${endpoint}`
    });

    return apiCall()
      .then(result => {
        span?.setStatus('ok');
        return result;
      })
      .catch(error => {
        span?.setStatus('internal_error');
        ErrorReporter.addBreadcrumb(
          `External API error: ${apiName}`,
          'http',
          'error',
          { endpoint, error: error.message }
        );
        throw error;
      })
      .finally(() => {
        span?.finish();
      });
  }
}

export default ErrorReporter;