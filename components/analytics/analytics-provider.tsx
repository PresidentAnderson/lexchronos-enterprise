'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { GoogleAnalytics } from '@/lib/analytics/google-analytics';
import { GoogleTagManager } from '@/lib/analytics/google-tag-manager';
import { FacebookPixel } from '@/lib/analytics/facebook-pixel';
import { MicrosoftClarity } from '@/lib/analytics/microsoft-clarity';
import { LegalAnalytics } from '@/lib/analytics/legal-analytics';

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackPageView: (path: string, title?: string) => void;
  trackConversion: (conversionName: string, value?: number) => void;
  trackLegalEvent: (eventType: string, caseId?: string, metadata?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize analytics services
    if (typeof window !== 'undefined') {
      // Initialize Google Analytics
      if (process.env.NEXT_PUBLIC_GA_TRACKING_ID) {
        GoogleAnalytics.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
      }

      // Initialize Google Tag Manager
      if (process.env.NEXT_PUBLIC_GTM_ID) {
        GoogleTagManager.initialize(process.env.NEXT_PUBLIC_GTM_ID);
      }

      // Initialize Facebook Pixel
      if (process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
        FacebookPixel.initialize(process.env.NEXT_PUBLIC_FB_PIXEL_ID);
      }

      // Initialize Microsoft Clarity
      if (process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID) {
        MicrosoftClarity.initialize(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
      }

      // Initialize Legal Analytics
      LegalAnalytics.initialize({
        firmName: process.env.NEXT_PUBLIC_FIRM_NAME || 'LexChronos',
        firmId: process.env.NEXT_PUBLIC_FIRM_ID || 'default',
        practiceAreas: process.env.NEXT_PUBLIC_PRACTICE_AREAS?.split(',') || [],
        environment: process.env.NEXT_PUBLIC_ANALYTICS_ENV || 'production'
      });
    }
  }, []);

  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    try {
      GoogleAnalytics.trackEvent(eventName, properties);
      FacebookPixel.trackEvent(eventName, properties);
      LegalAnalytics.trackEvent(eventName, properties);
    } catch (error) {
      console.warn('Analytics tracking error:', error);
    }
  };

  const trackPageView = (path: string, title?: string) => {
    if (typeof window === 'undefined') return;

    try {
      GoogleAnalytics.trackPageView(path, title);
      GoogleTagManager.trackPageView(path, title);
      LegalAnalytics.trackPageView(path, title);
    } catch (error) {
      console.warn('Page view tracking error:', error);
    }
  };

  const trackConversion = (conversionName: string, value?: number) => {
    if (typeof window === 'undefined') return;

    try {
      GoogleAnalytics.trackConversion(conversionName, value);
      FacebookPixel.trackConversion(conversionName, value);
      LegalAnalytics.trackConversion(conversionName, value);
    } catch (error) {
      console.warn('Conversion tracking error:', error);
    }
  };

  const trackLegalEvent = (eventType: string, caseId?: string, metadata?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    try {
      LegalAnalytics.trackLegalEvent(eventType, caseId, metadata);
      GoogleAnalytics.trackEvent(`legal_${eventType}`, { case_id: caseId, ...metadata });
    } catch (error) {
      console.warn('Legal event tracking error:', error);
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    try {
      LegalAnalytics.identifyUser(userId, traits);
      GoogleAnalytics.setUserId(userId);
    } catch (error) {
      console.warn('User identification error:', error);
    }
  };

  const contextValue: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackConversion,
    trackLegalEvent,
    identifyUser,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}