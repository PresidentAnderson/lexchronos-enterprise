import { TFunction } from 'next-i18next';

// Language configuration
export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'ar', 'he'] as const;
export const DEFAULT_LOCALE = 'en';
export const RTL_LOCALES = ['ar', 'he'] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export type RTLLocale = typeof RTL_LOCALES[number];

// Language info interface
export interface LanguageInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
  currency: {
    code: string;
    symbol: string;
  };
  dateFormat: {
    short: string;
    long: string;
    dateTime: string;
    time: string;
  };
}

// Language configurations
export const LANGUAGE_CONFIG: Record<SupportedLocale, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isRTL: false,
    currency: {
      code: 'USD',
      symbol: '$'
    },
    dateFormat: {
      short: 'MM/dd/yyyy',
      long: 'MMMM d, yyyy',
      dateTime: 'MM/dd/yyyy HH:mm',
      time: 'HH:mm'
    }
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇨🇦',
    isRTL: false,
    currency: {
      code: 'CAD',
      symbol: '$'
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: 'd MMMM yyyy',
      dateTime: 'dd/MM/yyyy HH:mm',
      time: 'HH:mm'
    }
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇲🇽',
    isRTL: false,
    currency: {
      code: 'USD',
      symbol: '$'
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: "d 'de' MMMM 'de' yyyy",
      dateTime: 'dd/MM/yyyy HH:mm',
      time: 'HH:mm'
    }
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    isRTL: true,
    currency: {
      code: 'SAR',
      symbol: 'ر.س'
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: 'd MMMM yyyy',
      dateTime: 'dd/MM/yyyy HH:mm',
      time: 'HH:mm'
    }
  },
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    isRTL: true,
    currency: {
      code: 'ILS',
      symbol: '₪'
    },
    dateFormat: {
      short: 'dd/MM/yyyy',
      long: 'd MMMM yyyy',
      dateTime: 'dd/MM/yyyy HH:mm',
      time: 'HH:mm'
    }
  }
};

/**
 * Check if a locale is RTL
 */
export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as RTLLocale);
}

/**
 * Get language info for a locale
 */
export function getLanguageInfo(locale: string): LanguageInfo {
  return LANGUAGE_CONFIG[locale as SupportedLocale] || LANGUAGE_CONFIG[DEFAULT_LOCALE];
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): LanguageInfo[] {
  return SUPPORTED_LOCALES.map(locale => LANGUAGE_CONFIG[locale]);
}

/**
 * Get direction for a locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Format currency for a specific locale
 */
export function formatCurrency(
  amount: number,
  locale: string = DEFAULT_LOCALE,
  currency?: string
): string {
  const languageInfo = getLanguageInfo(locale);
  const currencyCode = currency || languageInfo.currency.code;
  const localeForFormat = getIntlLocale(locale);

  try {
    return new Intl.NumberFormat(localeForFormat, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    const symbol = languageInfo.currency.symbol;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format date for a specific locale
 */
export function formatDate(
  date: Date | string,
  locale: string = DEFAULT_LOCALE,
  format: 'short' | 'long' | 'dateTime' | 'time' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeForFormat = getIntlLocale(locale);

  try {
    switch (format) {
      case 'short':
        return new Intl.DateTimeFormat(localeForFormat, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(dateObj);
      case 'long':
        return new Intl.DateTimeFormat(localeForFormat, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(dateObj);
      case 'dateTime':
        return new Intl.DateTimeFormat(localeForFormat, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      case 'time':
        return new Intl.DateTimeFormat(localeForFormat, {
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      default:
        return dateObj.toLocaleDateString(localeForFormat);
    }
  } catch (error) {
    // Fallback formatting
    return dateObj.toLocaleDateString('en-US');
  }
}

/**
 * Format number for a specific locale
 */
export function formatNumber(number: number, locale: string = DEFAULT_LOCALE): string {
  const localeForFormat = getIntlLocale(locale);

  try {
    return new Intl.NumberFormat(localeForFormat).format(number);
  } catch (error) {
    // Fallback formatting
    return number.toString();
  }
}

/**
 * Get Intl-compatible locale string
 */
export function getIntlLocale(locale: string): string {
  switch (locale) {
    case 'fr':
      return 'fr-CA';
    case 'es':
      return 'es-MX';
    case 'ar':
      return 'ar-SA';
    case 'he':
      return 'he-IL';
    default:
      return 'en-US';
  }
}

/**
 * Validate if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get the best matching locale from a list of preferences
 */
export function getBestMatchingLocale(preferences: string[]): SupportedLocale {
  for (const preference of preferences) {
    // Exact match
    if (isSupportedLocale(preference)) {
      return preference;
    }
    
    // Language-only match (e.g., 'en-US' matches 'en')
    const languageCode = preference.split('-')[0];
    if (isSupportedLocale(languageCode)) {
      return languageCode;
    }
  }
  
  return DEFAULT_LOCALE;
}

/**
 * Get locale from browser preferences
 */
export function getLocaleFromBrowser(): SupportedLocale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const preferences = [
    navigator.language,
    ...(navigator.languages || [])
  ];

  return getBestMatchingLocale(preferences);
}

/**
 * Translation key validation utilities
 */
export interface TranslationKeyInfo {
  namespace: string;
  key: string;
  fullKey: string;
}

/**
 * Parse a translation key into its components
 */
export function parseTranslationKey(key: string): TranslationKeyInfo {
  const parts = key.split(':');
  if (parts.length === 2) {
    return {
      namespace: parts[0],
      key: parts[1],
      fullKey: key
    };
  }
  
  return {
    namespace: 'common',
    key,
    fullKey: `common:${key}`
  };
}

/**
 * Generate translation key for nested objects
 */
export function generateTranslationKey(path: string[], baseKey?: string): string {
  const fullPath = baseKey ? [baseKey, ...path] : path;
  return fullPath.join('.');
}

/**
 * Missing translation tracker (development only)
 */
export class MissingTranslationTracker {
  private missingKeys: Set<string> = new Set();

  track(key: string, namespace: string, locale: string): void {
    if (process.env.NODE_ENV === 'development') {
      const fullKey = `${locale}:${namespace}:${key}`;
      this.missingKeys.add(fullKey);
    }
  }

  getMissingKeys(): string[] {
    return Array.from(this.missingKeys).sort();
  }

  clear(): void {
    this.missingKeys.clear();
  }

  report(): void {
    if (process.env.NODE_ENV === 'development' && this.missingKeys.size > 0) {
      console.group('🌐 Missing Translations');
      this.getMissingKeys().forEach(key => {
        console.warn(`Missing: ${key}`);
      });
      console.groupEnd();
    }
  }
}

// Global missing translation tracker instance
export const missingTranslationTracker = new MissingTranslationTracker();

/**
 * Legal terminology utilities
 */
export interface LegalTermTranslation {
  term: string;
  translation: string;
  definition?: string;
  synonyms?: string[];
  jurisdiction?: string[];
}

/**
 * Get legal term translation with context
 */
export function getLegalTermTranslation(
  term: string,
  t: TFunction,
  jurisdiction?: string
): LegalTermTranslation {
  const baseKey = `legal.terms.${term}`;
  const translation = t(baseKey);
  
  return {
    term,
    translation: translation !== baseKey ? translation : term,
    definition: t(`${baseKey}_definition`, { defaultValue: undefined }),
    synonyms: t(`${baseKey}_synonyms`, { returnObjects: true, defaultValue: [] }) as string[],
    jurisdiction: jurisdiction ? [jurisdiction] : []
  };
}

/**
 * Pluralization utilities
 */
export interface PluralRules {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/**
 * Get plural key based on count and locale rules
 */
export function getPluralKey(count: number, locale: string = DEFAULT_LOCALE): keyof PluralRules {
  const pr = new Intl.PluralRules(getIntlLocale(locale));
  const rule = pr.select(count);
  
  // Map Intl.PluralRules result to our PluralRules keys
  switch (rule) {
    case 'zero':
      return 'zero';
    case 'one':
      return 'one';
    case 'two':
      return 'two';
    case 'few':
      return 'few';
    case 'many':
      return 'many';
    default:
      return 'other';
  }
}

/**
 * URL utilities for i18n
 */
export function getLocalizedPath(path: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
  
  return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Extract locale from URL path
 */
export function getLocaleFromPath(path: string): { locale: SupportedLocale; pathname: string } {
  const segments = path.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isSupportedLocale(firstSegment)) {
    return {
      locale: firstSegment,
      pathname: '/' + segments.slice(1).join('/')
    };
  }
  
  return {
    locale: DEFAULT_LOCALE,
    pathname: path
  };
}