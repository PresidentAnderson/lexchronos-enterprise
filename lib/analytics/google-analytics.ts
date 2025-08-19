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
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
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
      custom_map: {
        case_type: 'case_type',
        practice_area: 'practice_area',
        client_tier: 'client_tier',
        document_type: 'document_type',
        billing_status: 'billing_status'
      },
      ...customParameters
    });
  }
};

// Specific legal event trackers
export const trackCaseCreation = (caseType: string, practiceArea: string, clientTier: string) => {
  trackLegalEvent('case_created', LegalEventCategory.CASE_MANAGEMENT, `${caseType} - ${practiceArea}`, 1, {
    case_type: caseType,
    practice_area: practiceArea,
    client_tier: clientTier
  });
};

export const trackDocumentUpload = (documentType: string, fileSize: number, caseId?: string) => {
  trackLegalEvent('document_uploaded', LegalEventCategory.DOCUMENT_HANDLING, documentType, fileSize, {
    document_type: documentType,
    case_id: caseId
  });
};

export const trackTimeEntry = (minutes: number, practiceArea: string, billableStatus: 'billable' | 'non_billable') => {
  trackLegalEvent('time_logged', LegalEventCategory.TIME_TRACKING, billableStatus, minutes, {
    practice_area: practiceArea,
    billing_status: billableStatus
  });
};

export const trackBilling = (amount: number, clientId: string, paymentMethod: string) => {
  trackLegalEvent('payment_processed', LegalEventCategory.BILLING, paymentMethod, amount, {
    client_id: clientId,
    payment_method: paymentMethod
  });
};

export const trackCourtDate = (dateType: 'hearing' | 'trial' | 'deposition' | 'mediation', daysNotice: number) => {
  trackLegalEvent('court_date_scheduled', LegalEventCategory.COURT_DATES, dateType, daysNotice, {
    court_date_type: dateType,
    advance_notice_days: daysNotice
  });
};

export const trackResearch = (researchType: 'case_law' | 'statute' | 'regulation' | 'precedent', timeSpent: number) => {
  trackLegalEvent('research_performed', LegalEventCategory.RESEARCH, researchType, timeSpent, {
    research_type: researchType
  });
};

export const trackClientInteraction = (interactionType: 'call' | 'email' | 'meeting' | 'document_review', duration?: number) => {
  trackLegalEvent('client_interaction', LegalEventCategory.CLIENT_INTERACTION, interactionType, duration, {
    interaction_type: interactionType
  });
};

// Conversion goals for legal practice
export const trackConversion = (goalType: 'case_won' | 'settlement_reached' | 'client_retained' | 'payment_collected', value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_TRACKING_ID}/${goalType}`,
      value: value || 0,
      currency: 'USD'
    });
  }
};

// Enhanced measurement events
export const trackEngagement = (eventName: string, engagementTime?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      engagement_time_msec: engagementTime || 0
    });
  }
};

// E-commerce tracking for legal billing
export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'USD',
      items: items
    });
  }
};

// User properties for legal professionals
export const setUserProperties = (properties: {
  practice_area?: string;
  experience_level?: 'junior' | 'senior' | 'partner';
  firm_size?: 'solo' | 'small' | 'medium' | 'large';
  subscription_tier?: 'basic' | 'professional' | 'enterprise';
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      user_properties: properties
    });
  }
};