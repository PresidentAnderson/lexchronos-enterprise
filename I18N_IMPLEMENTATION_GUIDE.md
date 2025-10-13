# LexChronos Internationalization (i18n) Implementation Guide

## Overview

This document provides a comprehensive guide to the internationalization implementation in LexChronos, a legal case management platform. The system supports multiple languages with specific focus on legal terminology and RTL (Right-to-Left) language support.

## Supported Languages

- **English (en)** - Base language (US)
- **French (fr)** - Canadian French
- **Spanish (es)** - Mexican Spanish  
- **Arabic (ar)** - Saudi Arabic (RTL)
- **Hebrew (he)** - Israeli Hebrew (RTL)

## Architecture

### Core Components

1. **next-i18next Configuration** (`next-i18next.config.js`)
   - Main configuration for i18n system
   - Locale detection and fallback rules
   - Formatting functions for currency, dates, and numbers

2. **Custom Translation Hook** (`hooks/useTranslation.ts`)
   - Enhanced version of next-i18next's useTranslation
   - Includes formatting utilities and RTL detection
   - Specialized hooks for different app sections

3. **I18n Provider** (`lib/i18n/provider.tsx`)
   - React context provider for i18n functionality
   - RTL detection and document direction management
   - Locale-aware formatting functions

4. **Translation Utilities** (`lib/i18n/utils.ts`)
   - Language configuration and metadata
   - Formatting utilities and helpers
   - RTL/LTR direction detection

5. **Language Switcher** (`components/language-switcher.tsx`)
   - User interface for changing languages
   - Multiple variants (compact, flag-only, full)
   - RTL-aware positioning

## Translation Structure

### Namespaces

The translation system is organized into the following namespaces:

- `common` - General UI elements, buttons, messages
- `legal` - Legal terminology and case types
- `forms` - Form labels and validation messages
- `dashboard` - Dashboard-specific content
- `cases` - Case management terminology
- `calendar` - Calendar and scheduling terms
- `documents` - Document management terms
- `timeline` - Timeline and event terms
- `billing` - Billing and time tracking terms

### File Structure

```
public/locales/
├── en/
│   ├── common.json
│   ├── legal.json
│   ├── forms.json
│   ├── dashboard.json
│   ├── cases.json
│   ├── calendar.json
│   ├── documents.json
│   ├── timeline.json
│   ├── billing.json
│   └── legal/
│       └── terms-of-service.json
├── fr/
│   └── [same structure]
├── es/
│   └── [same structure]
├── ar/
│   └── [same structure]
└── he/
    └── [same structure]
```

## Legal-Specific Features

### Legal Terminology

The `legal` namespace contains specialized legal terms:

```json
{
  "terms": {
    "plaintiff": "Plaintiff",
    "defendant": "Defendant",
    "attorney": "Attorney",
    // ... more legal terms
  },
  "caseTypes": {
    "civil": "Civil",
    "criminal": "Criminal",
    // ... case types
  },
  "procedures": {
    "filing": "Filing Procedure",
    // ... legal procedures
  }
}
```

### Locale-Specific Legal Content

Legal documents (Terms of Service, Privacy Policy) are provided in separate files for each locale:

- `public/locales/[locale]/legal/terms-of-service.json`
- `public/locales/[locale]/legal/privacy-policy.json`

## RTL Language Support

### CSS RTL Support

RTL support is implemented through dedicated CSS (`styles/rtl.css`):

- Automatic direction switching
- Margin/padding adjustments
- Icon and layout flipping
- Navigation and dropdown positioning
- Legal document handling (mixed LTR/RTL)

### Component RTL Features

- Automatic direction detection
- Icon rotation for arrows/chevrons
- Layout adjustments for dropdowns
- Text alignment based on language direction

## Usage Examples

### Basic Translation

```tsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('navigation.dashboard')}</h1>;
}
```

### Legal-Specific Translation

```tsx
import { useLegalTranslation } from '../hooks/useTranslation';

function LegalComponent() {
  const { t } = useLegalTranslation();
  
  return <span>{t('legal.terms.plaintiff')}</span>;
}
```

### RTL-Aware Component

```tsx
import { useTranslation } from '../hooks/useTranslation';

function RTLAwareComponent() {
  const { t, isRTL, direction } = useTranslation();
  
  return (
    <div dir={direction} className={isRTL ? 'rtl-class' : 'ltr-class'}>
      {t('common.welcome')}
    </div>
  );
}
```

### Currency and Date Formatting

```tsx
import { useTranslation } from '../hooks/useTranslation';

function FormattedData() {
  const { formatCurrency, formatDate } = useTranslation();
  
  return (
    <div>
      <span>Amount: {formatCurrency(1500.00)}</span>
      <span>Date: {formatDate(new Date(), 'long')}</span>
    </div>
  );
}
```

## Translation Management

### NPM Scripts

The project includes several translation management scripts:

```bash
# Run translation health check
npm run i18n:check

# Generate missing translation templates
npm run i18n:missing

# Show translation statistics
npm run i18n:stats

# Export translations to CSV for translators
npm run i18n:export [locale]

# Import translations from CSV
npm run i18n:import <csv-path> <locale>
```

### Translation Manager Features

The translation manager (`scripts/translation-manager.js`) provides:

- **Health Check**: Validates JSON files and reports missing keys
- **Missing Key Detection**: Finds untranslated keys across locales
- **Template Generation**: Creates TODO templates for missing translations
- **CSV Export/Import**: Facilitates work with external translators
- **Statistics**: Provides completion percentages and key counts

### Development Workflow

1. **Add new translation keys** in English (`en/[namespace].json`)
2. **Run health check** to identify missing translations
3. **Generate templates** for other locales
4. **Translate content** either manually or via CSV export/import
5. **Validate translations** with health check

## Next.js Integration

### App Router Configuration

The system works with Next.js App Router through:

1. **next.config.ts** - Includes i18n configuration
2. **pages/_app.tsx** - Wraps app with i18n provider
3. **app/layout.tsx** - Sets up document language and direction

### Static Generation

Translations are loaded at build time and included in static bundles for optimal performance.

## Best Practices

### Translation Keys

- Use descriptive, hierarchical keys: `navigation.dashboard`
- Group related keys in objects: `buttons.save`, `buttons.cancel`
- Use consistent naming patterns across namespaces

### Legal Content

- Keep legal citations in their original format (LTR)
- Translate legal concepts while maintaining accuracy
- Provide jurisdiction-specific variations when needed

### RTL Considerations

- Test all UI elements in RTL languages
- Ensure proper icon orientation
- Validate form layouts and navigation
- Check document viewer behavior with mixed content

### Performance

- Load only required namespaces per page
- Use lazy loading for large translation files
- Implement proper caching strategies

## Troubleshooting

### Common Issues

1. **Missing translations showing as keys**
   - Run `npm run i18n:check` to identify missing keys
   - Generate templates with `npm run i18n:missing`

2. **RTL layout issues**
   - Check CSS RTL rules in `styles/rtl.css`
   - Verify component RTL awareness

3. **Date/currency formatting errors**
   - Ensure locale-specific Intl formatting
   - Check fallback implementations

### Development Tools

- Browser console warnings for missing keys
- Translation detector available as `window.translationDetector`
- Health check reports in development

## Future Enhancements

### Planned Features

1. **Dynamic locale loading** - Load translations on-demand
2. **Translation management UI** - Admin interface for translations
3. **Context-aware translations** - Translations based on legal jurisdiction
4. **Professional translator integration** - API integration with translation services
5. **Legal glossary** - Interactive legal term definitions

### Scalability Considerations

- Implement translation caching strategies
- Add support for regional variants
- Consider professional translation workflows
- Implement translation approval processes

## Contributing

### Adding New Languages

1. Add locale to `SUPPORTED_LOCALES` in `lib/i18n/utils.ts`
2. Create translation directory structure
3. Add language configuration to `LANGUAGE_CONFIG`
4. Update RTL detection if needed
5. Add currency and date formatting rules

### Translation Guidelines

- Maintain legal terminology accuracy
- Consider cultural context
- Test with native speakers
- Validate legal compliance
- Document jurisdiction-specific variations

---

This implementation provides a robust foundation for multilingual legal software with proper RTL support and legal terminology management.