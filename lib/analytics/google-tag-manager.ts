/**
 * Google Tag Manager Configuration for LexChronos
 * Legal Case Management System Analytics
 */

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// Initialize Google Tag Manager
export const initGTM = () => {
  if (typeof window !== 'undefined' && GTM_ID) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });
  }
};

// Push events to GTM Data Layer
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
  }
};

// Legal-specific GTM events
export const pushLegalEvent = (
  event: string,
  eventData: {
    event_category?: string;
    event_action?: string;
    event_label?: string;
    value?: number;
    case_id?: string;
    client_id?: string;
    practice_area?: string;
    document_type?: string;
    billing_amount?: number;
    time_logged?: number;
    court_date_type?: string;
    research_type?: string;
    interaction_type?: string;
    user_role?: string;
    firm_id?: string;
  }
) => {
  pushToDataLayer({
    event,
    ...eventData,
    timestamp: new Date().toISOString(),
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    page_title: typeof document !== 'undefined' ? document.title : ''
  });
};

// Specific legal event functions
export const trackCaseEvent = (action: string, caseData: {
  case_id: string;
  case_type: string;
  practice_area: string;
  client_id: string;
  status?: string;
  value?: number;
}) => {
  pushLegalEvent('case_event', {
    event_category: 'Case Management',
    event_action: action,
    event_label: caseData.case_type,
    value: caseData.value,
    case_id: caseData.case_id,
    client_id: caseData.client_id,
    practice_area: caseData.practice_area
  });
};

export const trackDocumentEvent = (action: string, documentData: {
  document_type: string;
  case_id?: string;
  client_id?: string;
  file_size?: number;
  document_category?: string;
}) => {
  pushLegalEvent('document_event', {
    event_category: 'Document Management',
    event_action: action,
    event_label: documentData.document_type,
    value: documentData.file_size,
    case_id: documentData.case_id,
    client_id: documentData.client_id,
    document_type: documentData.document_type
  });
};

export const trackBillingEvent = (action: string, billingData: {
  amount: number;
  client_id: string;
  case_id?: string;
  billing_type: 'hourly' | 'fixed' | 'contingency';
  payment_method?: string;
  currency?: string;
}) => {
  pushLegalEvent('billing_event', {
    event_category: 'Billing',
    event_action: action,
    event_label: billingData.billing_type,
    value: billingData.amount,
    billing_amount: billingData.amount,
    client_id: billingData.client_id,
    case_id: billingData.case_id
  });
};

export const trackTimeEvent = (action: string, timeData: {
  time_logged: number;
  practice_area: string;
  case_id?: string;
  client_id?: string;
  billable: boolean;
  activity_type: string;
}) => {
  pushLegalEvent('time_tracking_event', {
    event_category: 'Time Tracking',
    event_action: action,
    event_label: timeData.activity_type,
    value: timeData.time_logged,
    time_logged: timeData.time_logged,
    practice_area: timeData.practice_area,
    case_id: timeData.case_id,
    client_id: timeData.client_id
  });
};

export const trackCourtEvent = (action: string, courtData: {
  court_date_type: string;
  case_id: string;
  client_id: string;
  court_name?: string;
  judge_name?: string;
  outcome?: string;
}) => {
  pushLegalEvent('court_event', {
    event_category: 'Court Dates',
    event_action: action,
    event_label: courtData.court_date_type,
    court_date_type: courtData.court_date_type,
    case_id: courtData.case_id,
    client_id: courtData.client_id
  });
};

export const trackResearchEvent = (action: string, researchData: {
  research_type: string;
  time_spent: number;
  case_id?: string;
  practice_area: string;
  sources_consulted?: number;
}) => {
  pushLegalEvent('research_event', {
    event_category: 'Legal Research',
    event_action: action,
    event_label: researchData.research_type,
    value: researchData.time_spent,
    research_type: researchData.research_type,
    case_id: researchData.case_id,
    practice_area: researchData.practice_area
  });
};

export const trackClientEvent = (action: string, clientData: {
  client_id: string;
  interaction_type: string;
  case_id?: string;
  duration?: number;
  satisfaction_score?: number;
}) => {
  pushLegalEvent('client_interaction_event', {
    event_category: 'Client Interaction',
    event_action: action,
    event_label: clientData.interaction_type,
    value: clientData.duration,
    interaction_type: clientData.interaction_type,
    client_id: clientData.client_id,
    case_id: clientData.case_id
  });
};

// User identification for GTM
export const identifyUser = (userData: {
  user_id: string;
  user_role: 'attorney' | 'paralegal' | 'admin' | 'client';
  firm_id: string;
  practice_areas: string[];
  subscription_tier: string;
}) => {
  pushToDataLayer({
    event: 'user_identification',
    user_id: userData.user_id,
    user_role: userData.user_role,
    firm_id: userData.firm_id,
    practice_areas: userData.practice_areas,
    subscription_tier: userData.subscription_tier
  });
};

// Enhanced ecommerce tracking for legal billing
export const trackPurchase = (purchaseData: {
  transaction_id: string;
  value: number;
  currency: string;
  client_id: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>;
}) => {
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.value,
      currency: purchaseData.currency,
      items: purchaseData.items
    },
    client_id: purchaseData.client_id
  });
};

// Form tracking for legal forms
export const trackFormEvent = (action: string, formData: {
  form_name: string;
  form_type: 'intake' | 'billing' | 'case_update' | 'document_request';
  case_id?: string;
  client_id?: string;
  completion_time?: number;
}) => {
  pushLegalEvent('form_event', {
    event_category: 'Form Interaction',
    event_action: action,
    event_label: formData.form_name,
    value: formData.completion_time,
    case_id: formData.case_id,
    client_id: formData.client_id
  });
};

// Performance tracking
export const trackPerformance = (performanceData: {
  page_load_time: number;
  dom_content_loaded: number;
  first_contentful_paint: number;
  largest_contentful_paint?: number;
}) => {
  pushToDataLayer({
    event: 'performance_timing',
    page_load_time: performanceData.page_load_time,
    dom_content_loaded: performanceData.dom_content_loaded,
    first_contentful_paint: performanceData.first_contentful_paint,
    largest_contentful_paint: performanceData.largest_contentful_paint
  });
};