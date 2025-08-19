'use client';

import { useTranslation as useNextTranslation } from 'next-i18next';
import { useI18n } from '../lib/i18n/provider';

export interface TranslationOptions {
  ns?: string | string[];
  keyPrefix?: string;
  fallback?: string;
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;
  lng?: string;
}

export interface UseTranslationReturn {
  t: (key: string, options?: TranslationOptions) => string;
  i18n: any;
  ready: boolean;
  locale: string;
  changeLanguage: (locale: string) => Promise<void>;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'dateTime' | 'time') => string;
  formatNumber: (number: number) => string;
}

/**
 * Enhanced translation hook that combines next-i18next with custom i18n provider
 * Provides translation functions along with locale-aware formatting utilities
 */
export function useTranslation(namespace: string | string[] = 'common'): UseTranslationReturn {
  const { t, i18n, ready } = useNextTranslation(namespace);
  const i18nContext = useI18n();

  const enhancedT = (key: string, options?: TranslationOptions): string => {
    try {
      const translationOptions: any = {};
      
      if (options) {
        if (options.count !== undefined) {
          translationOptions.count = options.count;
        }
        if (options.context) {
          translationOptions.context = options.context;
        }
        if (options.replace) {
          Object.assign(translationOptions, options.replace);
        }
        if (options.lng) {
          translationOptions.lng = options.lng;
        }
      }

      const translation = t(key, translationOptions);
      
      // If translation is missing and fallback is provided, use fallback
      if (translation === key && options?.fallback) {
        return options.fallback;
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return options?.fallback || key;
    }
  };

  return {
    t: enhancedT,
    i18n,
    ready,
    locale: i18nContext.locale,
    changeLanguage: i18nContext.changeLanguage,
    isRTL: i18nContext.isRTL,
    direction: i18nContext.direction,
    formatCurrency: i18nContext.formatCurrency,
    formatDate: i18nContext.formatDate,
    formatNumber: i18nContext.formatNumber,
  };
}

/**
 * Hook for legal-specific translations
 */
export function useLegalTranslation() {
  return useTranslation(['legal', 'common']);
}

/**
 * Hook for form-specific translations
 */
export function useFormTranslation() {
  return useTranslation(['forms', 'common']);
}

/**
 * Hook for dashboard translations
 */
export function useDashboardTranslation() {
  return useTranslation(['dashboard', 'common']);
}

/**
 * Hook for case-specific translations
 */
export function useCaseTranslation() {
  return useTranslation(['cases', 'legal', 'common']);
}

/**
 * Hook for calendar translations
 */
export function useCalendarTranslation() {
  return useTranslation(['calendar', 'common']);
}

/**
 * Hook for document translations
 */
export function useDocumentTranslation() {
  return useTranslation(['documents', 'legal', 'common']);
}

/**
 * Hook for billing translations
 */
export function useBillingTranslation() {
  return useTranslation(['billing', 'common']);
}

/**
 * Hook for timeline translations
 */
export function useTimelineTranslation() {
  return useTranslation(['timeline', 'legal', 'common']);
}

/**
 * Utility function to get plural form key based on count
 */
export function getPluralKey(baseKey: string, count: number): string {
  if (count === 0) return `${baseKey}_zero`;
  if (count === 1) return `${baseKey}_one`;
  return `${baseKey}_other`;
}

/**
 * Utility function to translate array of items
 */
export function translateArray<T>(
  items: T[],
  keyExtractor: (item: T) => string,
  t: (key: string) => string,
  namespace = 'common'
): Array<T & { translatedLabel: string }> {
  return items.map(item => ({
    ...item,
    translatedLabel: t(`${namespace}:${keyExtractor(item)}`)
  }));
}

/**
 * Utility function to get localized error messages
 */
export function getLocalizedErrorMessage(error: Error | string, t: (key: string) => string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Common error message mappings
  const errorKeyMap: Record<string, string> = {
    'Network Error': 'messages.networkError',
    'Unauthorized': 'messages.unauthorized',
    'Session Expired': 'messages.sessionExpired',
    'Server Error': 'messages.serverError',
    'Validation Error': 'validation.error',
  };
  
  const translationKey = errorKeyMap[errorMessage];
  if (translationKey) {
    return t(translationKey);
  }
  
  // Return original error message if no translation found
  return errorMessage;
}

/**
 * Utility function to get localized status labels
 */
export function getLocalizedStatus(status: string, t: (key: string) => string): string {
  return t(`status.${status.toLowerCase()}`) || status;
}

/**
 * Utility function to get localized priority labels
 */
export function getLocalizedPriority(priority: string, t: (key: string) => string): string {
  return t(`priority.${priority.toLowerCase()}`) || priority;
}