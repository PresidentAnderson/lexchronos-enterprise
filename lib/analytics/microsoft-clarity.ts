/**
 * Microsoft Clarity Configuration for LexChronos
 * User Behavior Analytics and Heatmaps
 */

export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '';

declare global {
  interface Window {
    clarity: (...args: any[]) => void;
  }
}

// Initialize Microsoft Clarity
export const initClarity = () => {
  if (typeof window !== 'undefined' && CLARITY_PROJECT_ID) {
    // Initialize Clarity
    window.clarity = window.clarity || function (...args: any[]) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };
  }
};

// Set user identity for Clarity
export const identifyUser = (userId: string, sessionId?: string, customTags?: Record<string, string>) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('identify', userId, sessionId, customTags);
  }
};

// Set custom tags for user sessions
export const setCustomTags = (tags: Record<string, string>) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', tags);
  }
};

// Legal practice specific custom tags
export const setLegalPracticeTags = (practiceData: {
  user_role?: 'attorney' | 'paralegal' | 'client' | 'admin';
  practice_area?: string;
  firm_size?: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
  subscription_tier?: 'basic' | 'professional' | 'enterprise';
  experience_level?: 'junior' | 'senior' | 'partner';
  case_load?: 'low' | 'medium' | 'high';
  specialization?: string;
  bar_admission?: string; // State or jurisdiction
  firm_type?: 'private' | 'public_defender' | 'prosecutor' | 'corporate' | 'nonprofit';
}) => {
  const tags: Record<string, string> = {};
  
  if (practiceData.user_role) tags.user_role = practiceData.user_role;
  if (practiceData.practice_area) tags.practice_area = practiceData.practice_area;
  if (practiceData.firm_size) tags.firm_size = practiceData.firm_size;
  if (practiceData.subscription_tier) tags.subscription_tier = practiceData.subscription_tier;
  if (practiceData.experience_level) tags.experience_level = practiceData.experience_level;
  if (practiceData.case_load) tags.case_load = practiceData.case_load;
  if (practiceData.specialization) tags.specialization = practiceData.specialization;
  if (practiceData.bar_admission) tags.bar_admission = practiceData.bar_admission;
  if (practiceData.firm_type) tags.firm_type = practiceData.firm_type;
  
  setCustomTags(tags);
};

// Track custom events in Clarity
export const trackCustomEvent = (eventName: string, eventData?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('event', eventName, eventData);
  }
};

// Legal-specific event tracking
export const trackCaseManagementEvent = (action: string, eventData: {
  case_id?: string;
  case_type?: string;
  practice_area?: string;
  action_complexity?: 'simple' | 'moderate' | 'complex';
  time_spent?: number;
  success?: boolean;
}) => {
  trackCustomEvent(`case_management_${action}`, {
    case_id: eventData.case_id,
    case_type: eventData.case_type,
    practice_area: eventData.practice_area,
    action_complexity: eventData.action_complexity,
    time_spent: eventData.time_spent,
    success: eventData.success
  });
};

export const trackDocumentEvent = (action: string, eventData: {
  document_type?: string;
  case_id?: string;
  file_size?: number;
  processing_time?: number;
  success?: boolean;
  error_type?: string;
}) => {
  trackCustomEvent(`document_${action}`, {
    document_type: eventData.document_type,
    case_id: eventData.case_id,
    file_size: eventData.file_size,
    processing_time: eventData.processing_time,
    success: eventData.success,
    error_type: eventData.error_type
  });
};

export const trackBillingEvent = (action: string, eventData: {
  billing_type?: 'hourly' | 'fixed' | 'contingency';
  amount?: number;
  client_id?: string;
  case_id?: string;
  payment_method?: string;
  success?: boolean;
}) => {
  trackCustomEvent(`billing_${action}`, {
    billing_type: eventData.billing_type,
    amount: eventData.amount,
    client_id: eventData.client_id,
    case_id: eventData.case_id,
    payment_method: eventData.payment_method,
    success: eventData.success
  });
};

export const trackTimeTrackingEvent = (action: string, eventData: {
  activity_type?: string;
  time_logged?: number;
  billable?: boolean;
  practice_area?: string;
  case_id?: string;
  efficiency_score?: number;
}) => {
  trackCustomEvent(`time_tracking_${action}`, {
    activity_type: eventData.activity_type,
    time_logged: eventData.time_logged,
    billable: eventData.billable,
    practice_area: eventData.practice_area,
    case_id: eventData.case_id,
    efficiency_score: eventData.efficiency_score
  });
};

export const trackClientInteractionEvent = (action: string, eventData: {
  interaction_type?: 'call' | 'email' | 'meeting' | 'message' | 'document_review';
  client_id?: string;
  case_id?: string;
  duration?: number;
  satisfaction_indicated?: 'positive' | 'neutral' | 'negative';
  follow_up_required?: boolean;
}) => {
  trackCustomEvent(`client_interaction_${action}`, {
    interaction_type: eventData.interaction_type,
    client_id: eventData.client_id,
    case_id: eventData.case_id,
    duration: eventData.duration,
    satisfaction_indicated: eventData.satisfaction_indicated,
    follow_up_required: eventData.follow_up_required
  });
};

export const trackSearchEvent = (searchData: {
  search_term?: string;
  search_type?: 'cases' | 'clients' | 'documents' | 'legal_research' | 'templates';
  results_count?: number;
  time_to_find?: number;
  search_successful?: boolean;
}) => {
  trackCustomEvent('search_performed', {
    search_term: searchData.search_term,
    search_type: searchData.search_type,
    results_count: searchData.results_count,
    time_to_find: searchData.time_to_find,
    search_successful: searchData.search_successful
  });
};

export const trackNavigationEvent = (navigationData: {
  from_page?: string;
  to_page?: string;
  navigation_method?: 'menu' | 'breadcrumb' | 'direct_link' | 'search' | 'back_button';
  time_on_previous_page?: number;
}) => {
  trackCustomEvent('navigation', {
    from_page: navigationData.from_page,
    to_page: navigationData.to_page,
    navigation_method: navigationData.navigation_method,
    time_on_previous_page: navigationData.time_on_previous_page
  });
};

export const trackFormEvent = (action: string, formData: {
  form_name?: string;
  form_type?: 'client_intake' | 'case_creation' | 'billing' | 'time_entry' | 'document_upload';
  completion_time?: number;
  fields_completed?: number;
  total_fields?: number;
  abandonment_point?: string;
  success?: boolean;
  error_messages?: string[];
}) => {
  trackCustomEvent(`form_${action}`, {
    form_name: formData.form_name,
    form_type: formData.form_type,
    completion_time: formData.completion_time,
    fields_completed: formData.fields_completed,
    total_fields: formData.total_fields,
    completion_rate: formData.total_fields ? 
      Math.round((formData.fields_completed || 0) / formData.total_fields * 100) : undefined,
    abandonment_point: formData.abandonment_point,
    success: formData.success,
    error_count: formData.error_messages?.length || 0
  });
};

export const trackPerformanceEvent = (performanceData: {
  page_name?: string;
  load_time?: number;
  interaction_delay?: number;
  error_occurred?: boolean;
  error_type?: string;
  user_frustrated?: boolean; // Based on clicks, scrolling patterns, etc.
}) => {
  trackCustomEvent('performance_issue', {
    page_name: performanceData.page_name,
    load_time: performanceData.load_time,
    interaction_delay: performanceData.interaction_delay,
    error_occurred: performanceData.error_occurred,
    error_type: performanceData.error_type,
    user_frustrated: performanceData.user_frustrated
  });
};

// Feature usage tracking
export const trackFeatureUsage = (feature: string, usageData: {
  feature_category?: 'core' | 'advanced' | 'premium' | 'beta';
  usage_frequency?: 'first_time' | 'occasional' | 'frequent' | 'power_user';
  success?: boolean;
  time_spent?: number;
  help_accessed?: boolean;
}) => {
  trackCustomEvent(`feature_${feature}`, {
    feature_category: usageData.feature_category,
    usage_frequency: usageData.usage_frequency,
    success: usageData.success,
    time_spent: usageData.time_spent,
    help_accessed: usageData.help_accessed
  });
};

// Error tracking with context
export const trackError = (errorData: {
  error_type: 'javascript' | 'network' | 'validation' | 'authentication' | 'authorization';
  error_message?: string;
  error_context?: string;
  user_action?: string;
  page_url?: string;
  recovery_attempted?: boolean;
  recovery_successful?: boolean;
}) => {
  trackCustomEvent('error_occurred', {
    error_type: errorData.error_type,
    error_message: errorData.error_message,
    error_context: errorData.error_context,
    user_action: errorData.user_action,
    page_url: errorData.page_url,
    recovery_attempted: errorData.recovery_attempted,
    recovery_successful: errorData.recovery_successful
  });
};

// User journey tracking
export const trackUserJourney = (journeyData: {
  journey_stage: 'discovery' | 'evaluation' | 'trial' | 'onboarding' | 'active_use' | 'renewal';
  touchpoint: string;
  journey_progress?: number; // 0-100
  conversion_likelihood?: 'low' | 'medium' | 'high';
  friction_points?: string[];
}) => {
  trackCustomEvent('user_journey', {
    journey_stage: journeyData.journey_stage,
    touchpoint: journeyData.touchpoint,
    journey_progress: journeyData.journey_progress,
    conversion_likelihood: journeyData.conversion_likelihood,
    friction_count: journeyData.friction_points?.length || 0
  });
};

// Session quality tracking
export const trackSessionQuality = (qualityData: {
  session_duration?: number;
  pages_visited?: number;
  actions_completed?: number;
  goals_achieved?: number;
  errors_encountered?: number;
  help_accessed?: number;
  overall_satisfaction?: 'positive' | 'neutral' | 'negative';
}) => {
  trackCustomEvent('session_quality', {
    session_duration: qualityData.session_duration,
    pages_visited: qualityData.pages_visited,
    actions_completed: qualityData.actions_completed,
    goals_achieved: qualityData.goals_achieved,
    errors_encountered: qualityData.errors_encountered,
    help_accessed: qualityData.help_accessed,
    overall_satisfaction: qualityData.overall_satisfaction,
    engagement_score: calculateEngagementScore(qualityData)
  });
};

// Calculate engagement score based on session metrics
const calculateEngagementScore = (data: any): number => {
  let score = 0;
  if (data.session_duration > 300) score += 20; // 5+ minutes
  if (data.pages_visited > 3) score += 20;
  if (data.actions_completed > 2) score += 20;
  if (data.goals_achieved > 0) score += 20;
  if (data.errors_encountered === 0) score += 10;
  if (data.help_accessed === 0) score += 10; // No help needed indicates good UX
  return Math.min(score, 100);
};

// MicrosoftClarity class for provider compatibility
export class MicrosoftClarity {
  private static isInitialized = false;
  private static projectId = '';

  static initialize(projectId: string) {
    if (typeof window === 'undefined') return;
    
    this.projectId = projectId;
    
    // Load Microsoft Clarity script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/' + projectId;
    document.head.appendChild(script);

    // Initialize Clarity
    window.clarity = window.clarity || function (...args: any[]) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };

    this.isInitialized = true;
    console.log('✅ Microsoft Clarity initialized');
  }

  static trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.clarity) return;

    window.clarity('event', eventName, properties);
  }

  static identifyUser(userId: string, sessionId?: string, customTags?: Record<string, string>) {
    if (typeof window === 'undefined' || !window.clarity) return;

    window.clarity('identify', userId, sessionId, customTags);
  }

  static setCustomTags(tags: Record<string, string>) {
    if (typeof window === 'undefined' || !window.clarity) return;

    window.clarity('set', tags);
  }
}

// Export both named export and default export for compatibility
export default MicrosoftClarity;