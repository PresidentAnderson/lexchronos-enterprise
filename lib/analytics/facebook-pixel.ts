/**
 * Facebook Pixel Configuration for LexChronos
 * Legal Practice Marketing and Conversion Tracking
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || '';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: (...args: any[]) => void;
  }
}

// Initialize Facebook Pixel
export const initFBPixel = () => {
  if (typeof window !== 'undefined' && FB_PIXEL_ID) {
    // Initialize the pixel
    window.fbq = window.fbq || function (...args: any[]) {
      (window.fbq.q = window.fbq.q || []).push(args);
    };
    window._fbq = window._fbq || window.fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    
    // Initialize pixel with ID
    window.fbq('init', FB_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
};

// Standard Facebook events
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

export const trackViewContent = (contentData: {
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_type: contentData.content_type || 'legal_service',
      content_ids: contentData.content_ids,
      content_name: contentData.content_name,
      content_category: contentData.content_category,
      value: contentData.value,
      currency: contentData.currency || 'USD'
    });
  }
};

export const trackLead = (leadData: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  practice_area?: string;
  lead_source?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: leadData.content_name,
      content_category: leadData.content_category,
      value: leadData.value,
      currency: leadData.currency || 'USD'
    }, {
      practice_area: leadData.practice_area,
      lead_source: leadData.lead_source
    });
  }
};

export const trackPurchase = (purchaseData: {
  value: number;
  currency?: string;
  content_type?: string;
  content_ids?: string[];
  num_items?: number;
  client_id?: string;
  service_type?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: purchaseData.value,
      currency: purchaseData.currency || 'USD',
      content_type: purchaseData.content_type || 'legal_service',
      content_ids: purchaseData.content_ids,
      num_items: purchaseData.num_items || 1
    }, {
      client_id: purchaseData.client_id,
      service_type: purchaseData.service_type
    });
  }
};

export const trackCompleteRegistration = (registrationData: {
  content_name?: string;
  value?: number;
  currency?: string;
  status?: string;
  user_type?: 'attorney' | 'client' | 'firm';
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: registrationData.content_name || 'LexChronos Registration',
      value: registrationData.value,
      currency: registrationData.currency || 'USD',
      status: registrationData.status
    }, {
      user_type: registrationData.user_type
    });
  }
};

export const trackContact = (contactData: {
  content_category?: string;
  value?: number;
  currency?: string;
  contact_method?: 'phone' | 'email' | 'form' | 'chat';
  practice_area?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact', {
      content_category: contactData.content_category || 'legal_inquiry',
      value: contactData.value,
      currency: contactData.currency || 'USD'
    }, {
      contact_method: contactData.contact_method,
      practice_area: contactData.practice_area
    });
  }
};

export const trackSchedule = (scheduleData: {
  content_name?: string;
  value?: number;
  currency?: string;
  appointment_type?: 'consultation' | 'court_date' | 'client_meeting' | 'deposition';
  practice_area?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Schedule', {
      content_name: scheduleData.content_name || 'Legal Appointment',
      value: scheduleData.value,
      currency: scheduleData.currency || 'USD'
    }, {
      appointment_type: scheduleData.appointment_type,
      practice_area: scheduleData.practice_area
    });
  }
};

// Custom events for legal practice
export const trackCustomEvent = (eventName: string, customData: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, customData);
  }
};

// Legal-specific custom events
export const trackCaseCreated = (caseData: {
  case_type: string;
  practice_area: string;
  estimated_value: number;
  client_type: 'individual' | 'corporate';
  referral_source?: string;
}) => {
  trackCustomEvent('CaseCreated', {
    case_type: caseData.case_type,
    practice_area: caseData.practice_area,
    estimated_value: caseData.estimated_value,
    client_type: caseData.client_type,
    referral_source: caseData.referral_source,
    currency: 'USD'
  });
};

export const trackConsultationBooked = (consultationData: {
  practice_area: string;
  consultation_type: 'free' | 'paid';
  value?: number;
  scheduling_method: 'online' | 'phone' | 'in_person';
  urgency: 'low' | 'medium' | 'high';
}) => {
  trackCustomEvent('ConsultationBooked', {
    practice_area: consultationData.practice_area,
    consultation_type: consultationData.consultation_type,
    value: consultationData.value || 0,
    scheduling_method: consultationData.scheduling_method,
    urgency: consultationData.urgency,
    currency: 'USD'
  });
};

export const trackDocumentSubmitted = (documentData: {
  document_type: string;
  case_type: string;
  submission_method: 'upload' | 'email' | 'postal' | 'fax';
  urgent: boolean;
}) => {
  trackCustomEvent('DocumentSubmitted', {
    document_type: documentData.document_type,
    case_type: documentData.case_type,
    submission_method: documentData.submission_method,
    urgent: documentData.urgent
  });
};

export const trackPaymentMade = (paymentData: {
  payment_type: 'retainer' | 'hourly' | 'fixed_fee' | 'contingency';
  amount: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  case_type: string;
  practice_area: string;
}) => {
  trackCustomEvent('PaymentMade', {
    payment_type: paymentData.payment_type,
    value: paymentData.amount,
    payment_method: paymentData.payment_method,
    case_type: paymentData.case_type,
    practice_area: paymentData.practice_area,
    currency: 'USD'
  });
};

export const trackCaseResolved = (resolutionData: {
  case_type: string;
  practice_area: string;
  resolution_type: 'settlement' | 'trial_victory' | 'dismissal' | 'plea_bargain';
  case_value: number;
  duration_days: number;
  client_satisfaction: number; // 1-5 scale
}) => {
  trackCustomEvent('CaseResolved', {
    case_type: resolutionData.case_type,
    practice_area: resolutionData.practice_area,
    resolution_type: resolutionData.resolution_type,
    value: resolutionData.case_value,
    duration_days: resolutionData.duration_days,
    client_satisfaction: resolutionData.client_satisfaction,
    currency: 'USD'
  });
};

export const trackNewsletterSignup = (signupData: {
  source: 'website' | 'blog' | 'social_media' | 'referral';
  practice_area_interest: string[];
  user_type: 'potential_client' | 'fellow_attorney' | 'media' | 'other';
}) => {
  trackCustomEvent('NewsletterSignup', {
    source: signupData.source,
    practice_area_interest: signupData.practice_area_interest,
    user_type: signupData.user_type
  });
};

// iOS 14.5+ tracking optimization
export const initAdvancedMatching = (userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}) => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    // Hash sensitive data before sending
    const hashedData: Record<string, string> = {};
    
    if (userData.email) {
      hashedData.em = hashString(userData.email.toLowerCase());
    }
    if (userData.phone) {
      hashedData.ph = hashString(userData.phone.replace(/\D/g, ''));
    }
    if (userData.firstName) {
      hashedData.fn = hashString(userData.firstName.toLowerCase());
    }
    if (userData.lastName) {
      hashedData.ln = hashString(userData.lastName.toLowerCase());
    }
    if (userData.city) {
      hashedData.ct = hashString(userData.city.toLowerCase());
    }
    if (userData.state) {
      hashedData.st = hashString(userData.state.toLowerCase());
    }
    if (userData.zipCode) {
      hashedData.zp = hashString(userData.zipCode);
    }

    window.fbq('init', FB_PIXEL_ID, hashedData);
  }
};

// Simple hash function for user data
const hashString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Conversion API setup for server-side tracking
export const setupConversionsAPI = () => {
  // This would typically be implemented on the server side
  // for enhanced tracking reliability post iOS 14.5
  console.log('Conversions API should be implemented server-side');
};

// FacebookPixel class for provider compatibility
export class FacebookPixel {
  private static isInitialized = false;
  private static pixelId = '';

  static initialize(pixelId: string) {
    if (typeof window === 'undefined') return;
    
    this.pixelId = pixelId;
    
    // Load Facebook Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);

    // Initialize the pixel
    window.fbq = window.fbq || function (...args: any[]) {
      (window.fbq.q = window.fbq.q || []).push(args);
    };
    window._fbq = window._fbq || window.fbq;
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    
    // Initialize pixel with ID
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');

    this.isInitialized = true;
    console.log('✅ Facebook Pixel initialized');
  }

  static trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.fbq) return;

    window.fbq('track', eventName, properties);
  }

  static trackConversion(conversionName: string, value?: number) {
    if (typeof window === 'undefined' || !window.fbq) return;

    window.fbq('track', conversionName, {
      value: value || 0,
      currency: 'USD'
    });
  }
}

// Export both named export and default export for compatibility
export default FacebookPixel;