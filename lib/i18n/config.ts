import { Config } from 'next-i18next';
import { UserConfig } from 'next-i18next';

export const i18nConfig: UserConfig = {
  debug: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es', 'ar', 'he'],
  },
  fallbackLng: {
    'fr-CA': ['fr', 'en'],
    'es-MX': ['es', 'en'],
    'es-US': ['es', 'en'],
    'ar-SA': ['ar', 'en'],
    'he-IL': ['he', 'en'],
    default: ['en']
  },
  supportedLngs: ['en', 'fr', 'es', 'ar', 'he'],
  ns: ['common', 'legal', 'forms', 'dashboard', 'billing', 'cases', 'calendar', 'documents', 'timeline'],
  defaultNS: 'common',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
    lookupQuerystring: 'lng',
    lookupCookie: 'i18n',
    lookupLocalStorage: 'i18nextLng',
    lookupSessionStorage: 'i18nextLng',
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
    caches: ['localStorage', 'cookie'],
    excludeCacheFor: ['cimode'],
    cookieOptions: {
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
    }
  },

  interpolation: {
    escapeValue: false, // React already escapes
    formatSeparator: ',',
    format: function (value, format, lng) {
      if (format === 'uppercase') return value.toUpperCase();
      if (format === 'lowercase') return value.toLowerCase();
      if (format === 'currency') {
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : lng === 'ar' ? 'ar-SA' : lng === 'he' ? 'he-IL' : 'en-US';
        const currency = lng === 'fr' ? 'CAD' : lng === 'ar' ? 'SAR' : lng === 'he' ? 'ILS' : 'USD';
        try {
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
          }).format(value);
        } catch {
          return `$${value}`;
        }
      }
      if (format === 'date') {
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : lng === 'ar' ? 'ar-SA' : lng === 'he' ? 'he-IL' : 'en-US';
        try {
          return new Intl.DateTimeFormat(locale).format(new Date(value));
        } catch {
          return value;
        }
      }
      if (format === 'time') {
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : lng === 'ar' ? 'ar-SA' : lng === 'he' ? 'he-IL' : 'en-US';
        try {
          return new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date(value));
        } catch {
          return value;
        }
      }
      return value;
    }
  },

  react: {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span', 'p'],
    useSuspense: false
  },

  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: function (lng, ns, key, fallbackValue) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
    }
  },

  load: 'languageOnly', // Ignore region codes
  cleanCode: true,

  // Backend options for loading translations
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    addPath: '/locales/{{lng}}/{{ns}}.missing.json',
    allowMultiLoading: false,
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    requestOptions: {
      mode: 'cors',
      credentials: 'same-origin',
      cache: 'default'
    }
  },

  // Serialization options
  serializeConfig: {
    addPath: '/locales/add/{{lng}}/{{ns}}',
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  }
};

export default i18nConfig;