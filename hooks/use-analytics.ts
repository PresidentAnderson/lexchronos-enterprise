'use client'

/**
 * Custom React Hooks for Analytics
 * Provides easy-to-use hooks for tracking legal practice events
 */

import { useCallback } from 'react';
import LegalAnalytics, {
  CaseData,
  ClientData,
  BillingData,
  TimeEntryData,
  DocumentData,
  CourtEventData
} from '@/lib/analytics/legal-analytics';

// Hook for general analytics tracking
export const useAnalytics = () => {
  const trackEvent = useCallback((
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => {
    if (typeof window !== 'undefined') {
      // Track across all platforms
      if (window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      }
      
      if (window.fbq) {
        window.fbq('trackCustom', action, {
          category: category,
          label: label,
          value: value
        });
      }

      if (window.clarity) {
        window.clarity('event', action, {
          category: category,
          label: label,
          value: value
        });
      }
    }
  }, []);

  const trackPageView = useCallback((pageName?: string) => {
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_TRACKING_ID || '', {
          page_title: pageName || document.title,
          page_location: window.location.href,
        });
      }
      
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }
    }
  }, []);

  return { trackEvent, trackPageView };
};

// Hook for case management analytics
export const useCaseAnalytics = () => {
  const trackCaseCreated = useCallback((caseData: CaseData) => {
    LegalAnalytics.trackCaseCreated(caseData);
  }, []);

  const trackCaseUpdated = useCallback((caseId: string, updateType: string, newStatus?: string) => {
    LegalAnalytics.trackCaseEvent('updated', {
      case_id: caseId,
      case_type: updateType,
      practice_area: 'general',
      client_id: 'unknown',
      status: newStatus
    });
  }, []);

  const trackCaseClosed = useCallback((
    caseId: string, 
    outcome: 'won' | 'lost' | 'settled' | 'dismissed',
    finalValue?: number
  ) => {
    LegalAnalytics.trackConversion(`case_${outcome}`, finalValue);
    LegalAnalytics.trackCaseEvent('closed', {
      case_id: caseId,
      case_type: outcome,
      practice_area: 'general',
      client_id: 'unknown',
      value: finalValue
    });
  }, []);

  return { trackCaseCreated, trackCaseUpdated, trackCaseClosed };
};

// Hook for document management analytics
export const useDocumentAnalytics = () => {
  const trackDocumentUpload = useCallback((documentData: DocumentData) => {
    LegalAnalytics.trackDocumentUpload(documentData);
  }, []);

  const trackDocumentDownload = useCallback((
    documentId: string,
    documentType: string,
    caseId?: string
  ) => {
    LegalAnalytics.trackDocumentEvent('download', {
      document_type: documentType,
      case_id: caseId,
      file_size: 0
    });
  }, []);

  const trackDocumentShare = useCallback((
    documentId: string,
    shareMethod: 'email' | 'link' | 'portal',
    recipientType: 'client' | 'attorney' | 'court' | 'opposing_counsel'
  ) => {
    LegalAnalytics.trackDocumentEvent('share', {
      document_type: shareMethod,
      document_category: recipientType
    });
  }, []);

  return { trackDocumentUpload, trackDocumentDownload, trackDocumentShare };
};

// Hook for time tracking analytics
export const useTimeTrackingAnalytics = () => {
  const trackTimeEntry = useCallback((timeData: TimeEntryData) => {
    LegalAnalytics.trackTimeEntry(timeData);
  }, []);

  const trackTimeStart = useCallback((activityType: string, caseId?: string) => {
    LegalAnalytics.trackTimeEvent('started', {
      time_logged: 0,
      practice_area: 'general',
      case_id: caseId,
      billable: true,
      activity_type: activityType
    });
  }, []);

  const trackTimeStop = useCallback((
    activityType: string,
    minutes: number,
    caseId?: string,
    billable: boolean = true
  ) => {
    LegalAnalytics.trackTimeEvent('stopped', {
      time_logged: minutes,
      practice_area: 'general',
      case_id: caseId,
      billable: billable,
      activity_type: activityType
    });
  }, []);

  return { trackTimeEntry, trackTimeStart, trackTimeStop };
};

// Hook for billing analytics
export const useBillingAnalytics = () => {
  const trackBillingEvent = useCallback((billingData: BillingData) => {
    LegalAnalytics.trackBillingEvent(billingData);
  }, []);

  const trackPaymentAttempt = useCallback((
    amount: number,
    paymentMethod: string,
    clientId: string
  ) => {
    LegalAnalytics.trackBillingEvent('payment_attempted', {
      amount: amount,
      client_id: clientId,
      billing_type: 'payment',
      payment_method: paymentMethod,
      currency: 'USD'
    });
  }, []);

  const trackInvoiceGenerated = useCallback((
    invoiceId: string,
    amount: number,
    clientId: string,
    caseId?: string
  ) => {
    LegalAnalytics.trackBillingEvent('invoice_generated', {
      amount: amount,
      client_id: clientId,
      case_id: caseId,
      billing_type: 'invoice'
    });
  }, []);

  return { trackBillingEvent, trackPaymentAttempt, trackInvoiceGenerated };
};

// Hook for client interaction analytics
export const useClientAnalytics = () => {
  const trackClientInteraction = useCallback((
    interactionType: 'call' | 'email' | 'meeting' | 'message',
    clientId: string,
    duration?: number,
    caseId?: string,
    outcome?: 'positive' | 'neutral' | 'negative'
  ) => {
    LegalAnalytics.trackClientInteraction({
      interaction_type: interactionType,
      client_id: clientId,
      case_id: caseId,
      duration: duration,
      outcome: outcome || 'neutral'
    });
  }, []);

  const trackClientOnboarding = useCallback((
    clientId: string,
    completionTime: number,
    stepsCompleted: number,
    totalSteps: number
  ) => {
    LegalAnalytics.trackClientEvent('onboarding_completed', {
      client_id: clientId,
      interaction_type: 'onboarding',
      duration: completionTime,
      satisfaction_score: Math.round((stepsCompleted / totalSteps) * 100)
    });
  }, []);

  const trackClientFeedback = useCallback((
    clientId: string,
    satisfactionScore: number,
    caseId?: string
  ) => {
    LegalAnalytics.trackClientEvent('feedback_submitted', {
      client_id: clientId,
      interaction_type: 'feedback',
      case_id: caseId,
      satisfaction_score: satisfactionScore
    });
  }, []);

  return { trackClientInteraction, trackClientOnboarding, trackClientFeedback };
};

// Hook for search and navigation analytics
export const useNavigationAnalytics = () => {
  const trackSearch = useCallback((
    searchTerm: string,
    searchType: 'cases' | 'clients' | 'documents' | 'templates',
    resultsCount: number,
    timeToResults: number
  ) => {
    LegalAnalytics.trackSearch({
      search_term: searchTerm,
      search_type: searchType,
      results_count: resultsCount,
      time_to_results: timeToResults,
      clicked_result: false
    });
  }, []);

  const trackSearchResultClick = useCallback((
    searchTerm: string,
    resultPosition: number,
    resultType: string
  ) => {
    LegalAnalytics.trackSearch({
      search_term: searchTerm,
      search_type: 'cases',
      results_count: resultPosition,
      time_to_results: 0,
      clicked_result: true
    });
  }, []);

  const trackPageNavigation = useCallback((
    fromPage: string,
    toPage: string,
    navigationMethod: 'menu' | 'breadcrumb' | 'direct_link' | 'search' | 'back_button'
  ) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', 'navigation', {
        from_page: fromPage,
        to_page: toPage,
        navigation_method: navigationMethod
      });
    }
  }, []);

  return { trackSearch, trackSearchResultClick, trackPageNavigation };
};

// Hook for form analytics
export const useFormAnalytics = () => {
  const trackFormStart = useCallback((
    formName: string,
    formType: 'client_intake' | 'case_creation' | 'billing' | 'time_entry' | 'document_upload'
  ) => {
    LegalAnalytics.trackFormEvent('started', {
      form_name: formName,
      form_type: formType,
      success: true
    });
  }, []);

  const trackFormCompleted = useCallback((
    formName: string,
    formType: 'client_intake' | 'case_creation' | 'billing' | 'time_entry' | 'document_upload',
    completionTime: number,
    fieldsCompleted: number,
    totalFields: number
  ) => {
    LegalAnalytics.trackFormEvent('completed', {
      form_name: formName,
      form_type: formType,
      completion_time: completionTime,
      fields_completed: fieldsCompleted,
      total_fields: totalFields,
      success: true
    });
  }, []);

  const trackFormAbandoned = useCallback((
    formName: string,
    abandonmentPoint: string,
    fieldsCompleted: number,
    totalFields: number
  ) => {
    LegalAnalytics.trackFormEvent('abandoned', {
      form_name: formName,
      form_type: 'client_intake',
      abandonment_point: abandonmentPoint,
      fields_completed: fieldsCompleted,
      total_fields: totalFields,
      success: false
    });
  }, []);

  return { trackFormStart, trackFormCompleted, trackFormAbandoned };
};

// Hook for error tracking
export const useErrorAnalytics = () => {
  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    userAction: string,
    userId?: string
  ) => {
    LegalAnalytics.trackError({
      error_type: errorType,
      error_message: errorMessage,
      user_action: userAction,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      user_id: userId
    });
  }, []);

  const trackJavaScriptError = useCallback((error: Error, errorInfo?: any) => {
    trackError('javascript', error.message, error.stack || 'unknown');
  }, [trackError]);

  const trackNetworkError = useCallback((url: string, status: number, statusText: string) => {
    trackError('network', `${status}: ${statusText}`, `Request to ${url}`);
  }, [trackError]);

  return { trackError, trackJavaScriptError, trackNetworkError };
};

// Hook for performance tracking
export const usePerformanceAnalytics = () => {
  const trackPagePerformance = useCallback((pageName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const firstContentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');
      const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint')[0];
      
      LegalAnalytics.trackPagePerformance({
        page_name: pageName,
        load_time: navigation.loadEventEnd - navigation.loadEventStart,
        first_contentful_paint: firstContentfulPaint?.startTime || 0,
        largest_contentful_paint: largestContentfulPaint?.startTime || 0,
        cumulative_layout_shift: 0 // Would need to implement CLS measurement
      });
    }
  }, []);

  const trackUserTiming = useCallback((name: string, startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(duration)
      });
    }
  }, []);

  return { trackPagePerformance, trackUserTiming };
};