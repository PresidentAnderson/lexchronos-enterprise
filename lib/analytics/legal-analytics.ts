/**
 * LexChronos Legal Analytics Integration
 * Comprehensive tracking for legal case management system
 */

import * as GoogleAnalytics from './google-analytics';
import * as GoogleTagManager from './google-tag-manager';
import * as FacebookPixel from './facebook-pixel';
import * as MicrosoftClarity from './microsoft-clarity';

// Legal domain specific interfaces
export interface CaseData {
  case_id: string;
  case_type: string;
  practice_area: string;
  client_id: string;
  estimated_value: number;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'closed' | 'pending' | 'on_hold';
  assigned_attorney: string;
  created_date: Date;
}

export interface ClientData {
  client_id: string;
  client_type: 'individual' | 'corporate' | 'government' | 'nonprofit';
  acquisition_source: string;
  lifetime_value: number;
  retention_risk: 'low' | 'medium' | 'high';
  satisfaction_score?: number;
}

export interface BillingData {
  transaction_id: string;
  amount: number;
  billing_type: 'hourly' | 'fixed_fee' | 'contingency' | 'retainer';
  payment_method: string;
  case_id?: string;
  client_id: string;
  attorney_id: string;
  hours_billed?: number;
  rate?: number;
}

export interface TimeEntryData {
  entry_id: string;
  attorney_id: string;
  case_id?: string;
  client_id?: string;
  activity_type: string;
  minutes: number;
  billable: boolean;
  practice_area: string;
  description: string;
  date: Date;
}

export interface DocumentData {
  document_id: string;
  document_type: string;
  case_id?: string;
  client_id?: string;
  file_size: number;
  upload_method: 'drag_drop' | 'file_picker' | 'email' | 'scan';
  processing_time?: number;
  template_used?: boolean;
}

export interface CourtEventData {
  event_id: string;
  event_type: 'hearing' | 'trial' | 'deposition' | 'mediation' | 'arbitration';
  case_id: string;
  court_name: string;
  date: Date;
  duration?: number;
  outcome?: string;
  attorney_id: string;
  preparation_time?: number;
}

// Initialize all analytics services
export const initializeAnalytics = () => {
  GoogleAnalytics.initGA();
  GoogleTagManager.initGTM();
  FacebookPixel.initFBPixel();
  MicrosoftClarity.initClarity();
};

// Unified legal event tracking
export class LegalAnalytics {
  static initialize(config: {
    firmName?: string;
    firmId?: string;
    practiceAreas?: string[];
    environment?: string;
  }) {
    // Initialize LegalAnalytics with configuration
    console.log('✅ LegalAnalytics initialized with config:', config);
  }
  static trackCaseCreated(caseData: CaseData) {
    // Google Analytics
    GoogleAnalytics.trackCaseCreation(
      caseData.case_type,
      caseData.practice_area,
      this.getClientTier(caseData.estimated_value)
    );

    // Google Tag Manager
    GoogleTagManager.trackCaseEvent('case_created', {
      case_id: caseData.case_id,
      case_type: caseData.case_type,
      practice_area: caseData.practice_area,
      client_id: caseData.client_id,
      status: caseData.status,
      value: caseData.estimated_value
    });

    // Facebook Pixel
    FacebookPixel.trackCaseCreated({
      case_type: caseData.case_type,
      practice_area: caseData.practice_area,
      estimated_value: caseData.estimated_value,
      client_type: 'individual', // This would come from client data
      referral_source: 'direct' // This would come from acquisition data
    });

    // Microsoft Clarity
    MicrosoftClarity.trackCaseManagementEvent('created', {
      case_id: caseData.case_id,
      case_type: caseData.case_type,
      practice_area: caseData.practice_area,
      action_complexity: this.getComplexityFromValue(caseData.estimated_value),
      success: true
    });
  }

  static trackDocumentUpload(documentData: DocumentData) {
    // Google Analytics
    GoogleAnalytics.trackDocumentUpload(
      documentData.document_type,
      documentData.file_size,
      documentData.case_id
    );

    // Google Tag Manager
    GoogleTagManager.trackDocumentEvent('uploaded', {
      document_type: documentData.document_type,
      case_id: documentData.case_id,
      client_id: documentData.client_id,
      file_size: documentData.file_size
    });

    // Facebook Pixel
    FacebookPixel.trackDocumentSubmitted({
      document_type: documentData.document_type,
      case_type: 'general', // Would need case lookup
      submission_method: documentData.upload_method,
      urgent: false // Would need urgency indicator
    });

    // Microsoft Clarity
    MicrosoftClarity.trackDocumentEvent('upload', {
      document_type: documentData.document_type,
      case_id: documentData.case_id,
      file_size: documentData.file_size,
      processing_time: documentData.processing_time,
      success: true
    });
  }

  static trackTimeEntry(timeData: TimeEntryData) {
    // Google Analytics
    GoogleAnalytics.trackTimeEntry(
      timeData.minutes,
      timeData.practice_area,
      timeData.billable ? 'billable' : 'non_billable'
    );

    // Google Tag Manager
    GoogleTagManager.trackTimeEvent('logged', {
      time_logged: timeData.minutes,
      practice_area: timeData.practice_area,
      case_id: timeData.case_id,
      client_id: timeData.client_id,
      billable: timeData.billable,
      activity_type: timeData.activity_type
    });

    // Microsoft Clarity
    MicrosoftClarity.trackTimeTrackingEvent('entry_created', {
      activity_type: timeData.activity_type,
      time_logged: timeData.minutes,
      billable: timeData.billable,
      practice_area: timeData.practice_area,
      case_id: timeData.case_id,
      efficiency_score: this.calculateEfficiencyScore(timeData.minutes, timeData.activity_type)
    });
  }

  static trackBillingEvent(billingData: BillingData) {
    // Google Analytics
    GoogleAnalytics.trackBilling(
      billingData.amount,
      billingData.client_id,
      billingData.payment_method
    );

    // Google Tag Manager
    GoogleTagManager.trackBillingEvent('payment_processed', {
      amount: billingData.amount,
      client_id: billingData.client_id,
      case_id: billingData.case_id,
      billing_type: billingData.billing_type,
      payment_method: billingData.payment_method,
      currency: 'USD'
    });

    // Facebook Pixel
    FacebookPixel.trackPurchase({
      value: billingData.amount,
      currency: 'USD',
      content_type: 'legal_service',
      content_ids: [billingData.case_id || billingData.client_id],
      client_id: billingData.client_id,
      service_type: billingData.billing_type
    });

    // Microsoft Clarity
    MicrosoftClarity.trackBillingEvent('payment_processed', {
      billing_type: billingData.billing_type,
      amount: billingData.amount,
      client_id: billingData.client_id,
      case_id: billingData.case_id,
      payment_method: billingData.payment_method,
      success: true
    });
  }

  static trackCourtEvent(courtData: CourtEventData) {
    // Google Analytics
    GoogleAnalytics.trackCourtDate(
      courtData.event_type,
      Math.ceil((courtData.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    );

    // Google Tag Manager
    GoogleTagManager.trackCourtEvent('scheduled', {
      court_date_type: courtData.event_type,
      case_id: courtData.case_id,
      client_id: 'unknown', // Would need case lookup
      court_name: courtData.court_name,
      outcome: courtData.outcome
    });

    // Microsoft Clarity
    MicrosoftClarity.trackCaseManagementEvent('court_event', {
      case_id: courtData.case_id,
      case_type: courtData.event_type,
      action_complexity: 'complex',
      time_spent: courtData.preparation_time,
      success: courtData.outcome === 'favorable'
    });
  }

  static trackClientInteraction(interactionData: {
    interaction_type: 'call' | 'email' | 'meeting' | 'message';
    client_id: string;
    case_id?: string;
    duration?: number;
    satisfaction_score?: number;
    outcome: 'positive' | 'neutral' | 'negative';
  }) {
    // Google Analytics
    GoogleAnalytics.trackClientInteraction(
      interactionData.interaction_type,
      interactionData.duration
    );

    // Google Tag Manager
    GoogleTagManager.trackClientEvent('interaction', {
      client_id: interactionData.client_id,
      interaction_type: interactionData.interaction_type,
      case_id: interactionData.case_id,
      duration: interactionData.duration,
      satisfaction_score: interactionData.satisfaction_score
    });

    // Facebook Pixel
    FacebookPixel.trackContact({
      content_category: 'client_interaction',
      contact_method: interactionData.interaction_type === 'call' ? 'phone' : 
                     interactionData.interaction_type === 'email' ? 'email' : 'form',
      value: interactionData.duration || 0
    });

    // Microsoft Clarity
    MicrosoftClarity.trackClientInteractionEvent('completed', {
      interaction_type: interactionData.interaction_type,
      client_id: interactionData.client_id,
      case_id: interactionData.case_id,
      duration: interactionData.duration,
      satisfaction_indicated: interactionData.outcome,
      follow_up_required: interactionData.outcome === 'negative'
    });
  }

  static trackUserLogin(userData: {
    user_id: string;
    user_role: 'attorney' | 'paralegal' | 'admin' | 'client';
    firm_id: string;
    practice_areas: string[];
    login_method: 'password' | 'sso' | 'mfa';
  }) {
    // Set user properties across all platforms
    GoogleAnalytics.setUserProperties({
      practice_area: userData.practice_areas[0],
      experience_level: 'senior', // Would determine from user data
      firm_size: 'medium', // Would determine from firm data
      subscription_tier: 'professional' // Would come from subscription data
    });

    // Google Tag Manager user identification
    GoogleTagManager.identifyUser({
      user_id: userData.user_id,
      user_role: userData.user_role,
      firm_id: userData.firm_id,
      practice_areas: userData.practice_areas,
      subscription_tier: 'professional'
    });

    // Microsoft Clarity user identification
    MicrosoftClarity.identifyUser(userData.user_id);
    MicrosoftClarity.setLegalPracticeTags({
      user_role: userData.user_role,
      practice_area: userData.practice_areas[0],
      firm_size: 'medium',
      subscription_tier: 'professional'
    });
  }

  static trackSearch(searchData: {
    search_term: string;
    search_type: 'cases' | 'clients' | 'documents' | 'templates';
    results_count: number;
    time_to_results: number;
    clicked_result?: boolean;
  }) {
    // Google Analytics
    GoogleAnalytics.trackLegalEvent(
      'search_performed',
      GoogleAnalytics.LegalEventCategory.RESEARCH,
      searchData.search_type,
      searchData.results_count
    );

    // Microsoft Clarity
    MicrosoftClarity.trackSearchEvent({
      search_term: searchData.search_term,
      search_type: searchData.search_type,
      results_count: searchData.results_count,
      time_to_find: searchData.time_to_results,
      search_successful: searchData.clicked_result || false
    });
  }

  static trackError(errorData: {
    error_type: string;
    error_message: string;
    user_action: string;
    page_url: string;
    user_id?: string;
  }) {
    // Google Analytics exception tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorData.error_message,
        fatal: false
      });
    }

    // Microsoft Clarity error tracking
    MicrosoftClarity.trackError({
      error_type: errorData.error_type as any,
      error_message: errorData.error_message,
      error_context: errorData.user_action,
      user_action: errorData.user_action,
      page_url: errorData.page_url,
      recovery_attempted: false,
      recovery_successful: false
    });

    // Google Tag Manager error event
    GoogleTagManager.pushLegalEvent('error_occurred', {
      event_category: 'Error',
      event_action: errorData.error_type,
      event_label: errorData.error_message
    });
  }

  static trackPagePerformance(performanceData: {
    page_name: string;
    load_time: number;
    first_contentful_paint: number;
    largest_contentful_paint: number;
    cumulative_layout_shift: number;
  }) {
    // Google Tag Manager performance tracking
    GoogleTagManager.trackPerformance({
      page_load_time: performanceData.load_time,
      dom_content_loaded: performanceData.load_time,
      first_contentful_paint: performanceData.first_contentful_paint,
      largest_contentful_paint: performanceData.largest_contentful_paint
    });

    // Microsoft Clarity performance tracking
    MicrosoftClarity.trackPerformanceEvent({
      page_name: performanceData.page_name,
      load_time: performanceData.load_time,
      error_occurred: performanceData.load_time > 5000, // Consider >5s as performance issue
      user_frustrated: performanceData.cumulative_layout_shift > 0.1 // CLS threshold
    });
  }

  // Helper methods
  private static getClientTier(estimatedValue: number): 'basic' | 'professional' | 'enterprise' {
    if (estimatedValue < 10000) return 'basic';
    if (estimatedValue < 100000) return 'professional';
    return 'enterprise';
  }

  private static getComplexityFromValue(value: number): 'simple' | 'moderate' | 'complex' {
    if (value < 25000) return 'simple';
    if (value < 100000) return 'moderate';
    return 'complex';
  }

  private static calculateEfficiencyScore(minutes: number, activityType: string): number {
    // Simple efficiency calculation based on activity type benchmarks
    const benchmarks: Record<string, number> = {
      'research': 120,
      'document_review': 60,
      'client_call': 30,
      'court_appearance': 180,
      'writing': 90
    };
    
    const benchmark = benchmarks[activityType] || 60;
    return Math.max(0, Math.min(100, (benchmark / minutes) * 100));
  }
}

// Export for use in components
export default LegalAnalytics;