'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// RTL languages
const RTL_LANGUAGES = ['ar', 'he'];

export interface I18nContextType {
  locale: string;
  locales: string[];
  changeLanguage: (locale: string) => Promise<void>;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, format?: 'short' | 'long' | 'dateTime' | 'time') => string;
  formatNumber: (number: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  locale?: string;
  locales?: string[];
}

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      
      interpolation: {
        escapeValue: false, // React already escapes
      },

      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18n',
        lookupLocalStorage: 'i18nextLng',
        lookupSessionStorage: 'i18nextLng',
        caches: ['localStorage', 'cookie'],
      },

      resources: {
        // Resources will be loaded dynamically via next-i18next
      },
    });
}

export function I18nProvider({ children, locale = 'en', locales = ['en', 'fr', 'es', 'ar', 'he'] }: I18nProviderProps) {
  const [currentLocale, setCurrentLocale] = useState(locale);
  const router = useRouter();

  const isRTL = RTL_LANGUAGES.includes(currentLocale);
  const direction = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    // Set document direction
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLocale;
    
    // Apply RTL styles if needed
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [currentLocale, direction, isRTL]);

  const changeLanguage = async (newLocale: string) => {
    if (!locales.includes(newLocale)) {
      console.warn(`Locale ${newLocale} is not supported`);
      return;
    }

    try {
      // Update i18next
      await i18n.changeLanguage(newLocale);
      
      // Update state
      setCurrentLocale(newLocale);
      
      // Store preference
      localStorage.setItem('i18nextLng', newLocale);
      document.cookie = `i18n=${newLocale}; path=/; max-age=31536000; samesite=strict${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
      
      // Update Next.js router locale
      if (router.locale !== newLocale) {
        await router.push(router.asPath, router.asPath, { locale: newLocale });
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    const currencyCode = currency || getCurrencyForLocale(currentLocale);
    const localeForFormat = getLocaleForFormat(currentLocale);
    
    try {
      return new Intl.NumberFormat(localeForFormat, {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbol = getCurrencySymbol(currencyCode);
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date | string, format: 'short' | 'long' | 'dateTime' | 'time' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const localeForFormat = getLocaleForFormat(currentLocale);
    
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
  };

  const formatNumber = (number: number): string => {
    const localeForFormat = getLocaleForFormat(currentLocale);
    
    try {
      return new Intl.NumberFormat(localeForFormat).format(number);
    } catch (error) {
      // Fallback formatting
      return number.toString();
    }
  };

  const contextValue: I18nContextType = {
    locale: currentLocale,
    locales,
    changeLanguage,
    isRTL,
    direction,
    formatCurrency,
    formatDate,
    formatNumber,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Utility functions
function getCurrencyForLocale(locale: string): string {
  switch (locale) {
    case 'fr':
      return 'CAD';
    case 'es':
      return 'USD';
    case 'ar':
      return 'SAR';
    case 'he':
      return 'ILS';
    default:
      return 'USD';
  }
}

function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'USD':
      return '$';
    case 'CAD':
      return '$';
    case 'SAR':
      return 'ر.س';
    case 'ILS':
      return '₪';
    case 'EUR':
      return '€';
    default:
      return '$';
  }
}

function getLocaleForFormat(locale: string): string {
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

// Export wrapped app
export default appWithTranslation;