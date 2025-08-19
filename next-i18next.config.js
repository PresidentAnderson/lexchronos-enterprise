/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es', 'ar', 'he'], // Including Arabic and Hebrew for RTL support
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
      secure: true,
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
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : 'en-US';
        const currency = lng === 'fr' ? 'CAD' : 'USD';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency
        }).format(value);
      }
      if (format === 'date') {
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : lng === 'ar' ? 'ar-SA' : lng === 'he' ? 'he-IL' : 'en-US';
        return new Intl.DateTimeFormat(locale).format(new Date(value));
      }
      if (format === 'time') {
        const locale = lng === 'fr' ? 'fr-CA' : lng === 'es' ? 'es-MX' : lng === 'ar' ? 'ar-SA' : lng === 'he' ? 'he-IL' : 'en-US';
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(value));
      }
      return value;
    }
  },
  react: {
    bindI18n: 'languageChanged',
    bindI18nStore: '',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
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
  debug: process.env.NODE_ENV === 'development',
};