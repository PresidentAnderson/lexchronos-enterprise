/**
 * Google Analytics 4 Configuration and Event Tracking
 * For LexChronos Legal Case Management System
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Google Analytics 4 Configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    window.gtag = window.gtag || function (...args: any[]) {
      (window.dataLayer = window.dataLayer || []).push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });
  }
};

// Page view tracking
export const trackPageView = (url?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url || window.location.pathname,
    });
  }
};

// Event tracking
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Conversion tracking
export const trackConversion = (conversionType: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_TRACKING_ID}/${conversionType}`,
      value: value || 0,
      currency: 'USD'
    });
  }
};

// User ID tracking
export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_id: userId
    });
  }
};

// Legal-specific event categories
export enum LegalEventCategory {
  CASE_MANAGEMENT = 'Case Management',
  DOCUMENT_HANDLING = 'Document Handling',
  BILLING = 'Billing',
  CLIENT_INTERACTION = 'Client Interaction',
  TIME_TRACKING = 'Time Tracking',
  COURT_DATES = 'Court Dates',
  RESEARCH = 'Legal Research',
  COLLABORATION = 'Team Collaboration'
}

// Legal-specific events for LexChronos
export const trackLegalEvent = (
  action: string,
  category: LegalEventCategory,
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters
    });
  }
};

// GoogleAnalytics class for provider compatibility
export class GoogleAnalytics {
  static initialize(trackingId?: string) {
    return initGA();
  }

  static trackEvent(eventName: string, parameters?: Record<string, any>) {
    return trackEvent(eventName, parameters);
  }

  static trackPageView(url?: string) {
    return trackPageView(url);
  }

  static trackConversion(conversionType: string, value?: number) {
    return trackConversion(conversionType, value);
  }

  static setUserId(userId: string) {
    return setUserId(userId);
  }

  static trackLegalEvent(
    action: string,
    category: LegalEventCategory,
    label?: string,
    value?: number,
    customParameters?: Record<string, any>
  ) {
    return trackLegalEvent(action, category, label, value, customParameters);
  }

  // Additional methods for legal analytics compatibility
  static trackCaseCreation(caseType: string, practiceArea: string, clientTier: string) {
    return trackEvent('case_created', {
      case_type: caseType,
      practice_area: practiceArea,
      client_tier: clientTier
    });
  }

  static trackDocumentUpload(documentType: string, fileSize: number, caseId?: string) {
    return trackEvent('document_uploaded', {
      document_type: documentType,
      file_size: fileSize,
      case_id: caseId
    });
  }

  static trackTimeEntry(minutes: number, practiceArea: string, billableType: string) {
    return trackEvent('time_entry_logged', {
      minutes: minutes,
      practice_area: practiceArea,
      billable_type: billableType
    });
  }

  static trackBilling(amount: number, clientId: string, paymentMethod: string) {
    return trackEvent('billing_processed', {
      amount: amount,
      client_id: clientId,
      payment_method: paymentMethod
    });
  }

  static trackCourtDate(eventType: string, daysUntil: number) {
    return trackEvent('court_event_scheduled', {
      event_type: eventType,
      days_until: daysUntil
    });
  }

  static trackClientInteraction(interactionType: string, duration?: number) {
    return trackEvent('client_interaction', {
      interaction_type: interactionType,
      duration: duration
    });
  }

  static setUserProperties(properties: Record<string, any>) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_TRACKING_ID, {
        custom_map: properties
      });
    }
  }
}

// Export both named export and default export for compatibility
export default GoogleAnalytics;