/**
 * Legal-Specific Error Boundary Component
 * Provides graceful error handling with legal context preservation
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import ErrorReporter, { ErrorContext } from '@/lib/monitoring/error-reporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: ErrorContext;
  feature?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  lastPropsContext?: ErrorContext;
}

export class LegalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Sentry.captureException(error)
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context, feature } = this.props;

    // Report error with legal context
    await ErrorReporter.reportError({
      type: 'SYSTEM',
      severity: 'HIGH',
      message: `React Error Boundary caught error in ${feature || 'unknown feature'}`,
      context: {
        ...context,
        feature,
        action: 'component_render',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorStack: error.stack
        }
      },
      originalError: error
    });

    // Add breadcrumb for debugging
    ErrorReporter.addBreadcrumb(
      'React Error Boundary triggered',
      'error',
      'error',
      {
        feature,
        context,
        componentStack: errorInfo.componentStack
      }
    );
  }

  componentDidUpdate(prevProps: Props) {
    const { context } = this.props;
    const { hasError, lastPropsContext } = this.state;

    // If context changes and we had an error, try to recover
    if (hasError && context !== lastPropsContext) {
      this.setState({
        hasError: false,
        error: undefined,
        errorId: undefined,
        lastPropsContext: context
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined
    });
  };

  private handleReportIssue = () => {
    const { errorId } = this.state;
    const { feature, context } = this.props;

    // Open Sentry user feedback form
    if (errorId) {
      Sentry.showReportDialog({
        eventId: errorId,
        title: 'Report Legal System Issue',
        subtitle: 'Help us improve LexChronos by reporting this error',
        subtitle2: 'Our team will investigate this issue and contact you if needed.',
        labelName: 'Your Name',
        labelEmail: 'Email Address',
        labelComments: 'Describe what you were doing when this error occurred',
        labelClose: 'Close',
        labelSubmit: 'Submit Report',
        errorGeneric: 'An error occurred while submitting your report. Please try again.',
        errorFormEntry: 'Some fields were invalid. Please check and try again.',
        successMessage: 'Thank you! Your report has been submitted.'
      });
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, feature, context } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Determine error severity and appropriate messaging
      const isLegalCritical = feature && [
        'cases',
        'deadlines',
        'court-dates',
        'billing',
        'documents'
      ].includes(feature);

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className={`rounded-full p-3 ${
                  isLegalCritical ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  <AlertTriangle className={`h-8 w-8 ${
                    isLegalCritical ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                </div>
              </div>

              {/* Error Title */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isLegalCritical ? 'Legal System Error' : 'Something went wrong'}
                </h2>
                
                <p className="text-gray-600 mb-6">
                  {isLegalCritical 
                    ? 'A critical error occurred in the legal management system. Your data is safe, but this feature is temporarily unavailable.'
                    : 'We encountered an unexpected error. Our team has been notified and is working to resolve this issue.'
                  }
                </p>
              </div>

              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Development Error Details:
                  </h3>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">
                    {error.message}
                    {error.stack && `\n\nStack trace:\n${error.stack}`}
                  </pre>
                  {context && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-800">Context:</p>
                      <pre className="text-xs text-red-700">
                        {JSON.stringify(context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReportIssue}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Report Issue
                </button>

                <a
                  href="/dashboard"
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </a>
              </div>

              {/* Error ID */}
              {errorId && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    Error ID: <span className="font-mono">{errorId}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please include this ID when contacting support
                  </p>
                </div>
              )}

              {/* Legal Disclaimer */}
              {isLegalCritical && (
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Important:</strong> Your legal data remains secure and intact. 
                    This is a display issue only. If you need immediate access to your cases 
                    or documents, please contact support at support@lexchronos.com
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <LegalErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </LegalErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// Specific error boundaries for different features
export const CaseErrorBoundary = ({ children }: { children: ReactNode }) => (
  <LegalErrorBoundary feature="cases" context={{ feature: 'case-management' }}>
    {children}
  </LegalErrorBoundary>
);

export const BillingErrorBoundary = ({ children }: { children: ReactNode }) => (
  <LegalErrorBoundary feature="billing" context={{ feature: 'billing-management' }}>
    {children}
  </LegalErrorBoundary>
);

export const DocumentErrorBoundary = ({ children }: { children: ReactNode }) => (
  <LegalErrorBoundary feature="documents" context={{ feature: 'document-management' }}>
    {children}
  </LegalErrorBoundary>
);

export const DeadlineErrorBoundary = ({ children }: { children: ReactNode }) => (
  <LegalErrorBoundary feature="deadlines" context={{ feature: 'deadline-management' }}>
    {children}
  </LegalErrorBoundary>
);

export default LegalErrorBoundary;