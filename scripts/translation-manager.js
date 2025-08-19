#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TranslationManager {
  constructor() {
    this.localesDir = path.join(__dirname, '../public/locales');
    this.supportedLocales = ['en', 'fr', 'es', 'ar', 'he'];
    this.namespaces = ['common', 'legal', 'forms', 'dashboard', 'billing', 'cases', 'calendar', 'documents', 'timeline'];
  }

  /**
   * Find missing translation keys across all locales
   */
  findMissingKeys() {
    const missingKeys = {};
    
    // Get all keys from English (base locale)
    const baseKeys = this.getAllKeysForLocale('en');
    
    // Check each locale for missing keys
    this.supportedLocales.forEach(locale => {
      if (locale === 'en') return; // Skip base locale
      
      missingKeys[locale] = {};
      const localeKeys = this.getAllKeysForLocale(locale);
      
      this.namespaces.forEach(namespace => {
        const baseNamespaceKeys = baseKeys[namespace] || {};
        const localeNamespaceKeys = localeKeys[namespace] || {};
        
        const missing = this.findMissingInNamespace(baseNamespaceKeys, localeNamespaceKeys);
        if (Object.keys(missing).length > 0) {
          missingKeys[locale][namespace] = missing;
        }
      });
    });
    
    return missingKeys;
  }

  /**
   * Get all keys for a specific locale
   */
  getAllKeysForLocale(locale) {
    const keys = {};
    
    this.namespaces.forEach(namespace => {
      const filePath = path.join(this.localesDir, locale, `${namespace}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          keys[namespace] = this.flattenObject(content);
        } catch (error) {
          console.error(`Error reading ${filePath}:`, error.message);
          keys[namespace] = {};
        }
      } else {
        keys[namespace] = {};
      }
    });
    
    return keys;
  }

  /**
   * Find missing keys in a namespace
   */
  findMissingInNamespace(baseKeys, localeKeys) {
    const missing = {};
    
    Object.keys(baseKeys).forEach(key => {
      if (!(key in localeKeys)) {
        missing[key] = baseKeys[key];
      }
    });
    
    return missing;
  }

  /**
   * Flatten nested object to dot notation
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    });
    
    return flattened;
  }

  /**
   * Generate missing translation files
   */
  generateMissingTranslations() {
    const missingKeys = this.findMissingKeys();
    
    Object.entries(missingKeys).forEach(([locale, namespaces]) => {
      Object.entries(namespaces).forEach(([namespace, keys]) => {
        const template = this.createTranslationTemplate(keys, locale);
        const filePath = path.join(this.localesDir, locale, `${namespace}.missing.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
        console.log(`Generated missing translations for ${locale}/${namespace}: ${filePath}`);
      });
    });
  }

  /**
   * Create translation template with TODO markers
   */
  createTranslationTemplate(flatKeys, locale) {
    const template = {};
    
    Object.entries(flatKeys).forEach(([key, value]) => {
      this.setNestedProperty(template, key, `TODO: Translate "${value}" to ${locale.toUpperCase()}`);
    });
    
    return template;
  }

  /**
   * Set nested property using dot notation
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate all translation files
   */
  validateTranslations() {
    const errors = [];
    
    this.supportedLocales.forEach(locale => {
      this.namespaces.forEach(namespace => {
        const filePath = path.join(this.localesDir, locale, `${namespace}.json`);
        
        if (!fs.existsSync(filePath)) {
          errors.push(`Missing file: ${filePath}`);
          return;
        }
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
        } catch (error) {
          errors.push(`Invalid JSON in ${filePath}: ${error.message}`);
        }
      });
    });
    
    return errors;
  }

  /**
   * Generate usage statistics
   */
  generateStats() {
    const stats = {
      totalKeys: 0,
      locales: {},
      namespaces: {},
      completeness: {}
    };
    
    // Get base keys count
    const baseKeys = this.getAllKeysForLocale('en');
    Object.entries(baseKeys).forEach(([namespace, keys]) => {
      stats.namespaces[namespace] = Object.keys(keys).length;
      stats.totalKeys += Object.keys(keys).length;
    });
    
    // Calculate completeness for each locale
    this.supportedLocales.forEach(locale => {
      const localeKeys = this.getAllKeysForLocale(locale);
      let totalLocaleKeys = 0;
      
      stats.locales[locale] = {};
      
      Object.entries(localeKeys).forEach(([namespace, keys]) => {
        const keyCount = Object.keys(keys).length;
        stats.locales[locale][namespace] = keyCount;
        totalLocaleKeys += keyCount;
      });
      
      stats.completeness[locale] = ((totalLocaleKeys / stats.totalKeys) * 100).toFixed(1);
    });
    
    return stats;
  }

  /**
   * Export translations to CSV for translators
   */
  exportToCSV(locale = null) {
    const locales = locale ? [locale] : this.supportedLocales.filter(l => l !== 'en');
    const baseKeys = this.getAllKeysForLocale('en');
    
    locales.forEach(targetLocale => {
      const targetKeys = this.getAllKeysForLocale(targetLocale);
      const csvRows = ['Key,Namespace,English,Target,Notes'];
      
      this.namespaces.forEach(namespace => {
        const baseNamespace = baseKeys[namespace] || {};
        const targetNamespace = targetKeys[namespace] || {};
        
        Object.entries(baseNamespace).forEach(([key, englishValue]) => {
          const targetValue = targetNamespace[key] || '';
          const notes = targetValue ? 'Translated' : 'Missing';
          
          csvRows.push([
            `"${key}"`,
            `"${namespace}"`,
            `"${englishValue.replace(/"/g, '""')}"`,
            `"${targetValue.replace(/"/g, '""')}"`,
            `"${notes}"`
          ].join(','));
        });
      });
      
      const csvContent = csvRows.join('\n');
      const csvPath = path.join(__dirname, `../translations-${targetLocale}.csv`);
      fs.writeFileSync(csvPath, csvContent);
      console.log(`Exported translations for ${targetLocale}: ${csvPath}`);
    });
  }

  /**
   * Import translations from CSV
   */
  importFromCSV(csvPath, locale) {
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = csvContent.split('\n').slice(1); // Skip header
    
    const translations = {};
    
    rows.forEach(row => {
      if (!row.trim()) return;
      
      const [key, namespace, english, target] = row.split(',').map(field => 
        field.replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"')
      );
      
      if (!target.trim() || target === 'Missing') return;
      
      if (!translations[namespace]) {
        translations[namespace] = {};
      }
      
      this.setNestedProperty(translations[namespace], key, target);
    });
    
    // Write updated translation files
    Object.entries(translations).forEach(([namespace, namespaceTranslations]) => {
      const filePath = path.join(this.localesDir, locale, `${namespace}.json`);
      
      // Merge with existing translations
      let existing = {};
      if (fs.existsSync(filePath)) {
        try {
          existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
          console.error(`Error reading existing file ${filePath}:`, error.message);
        }
      }
      
      const merged = { ...existing, ...namespaceTranslations };
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
      console.log(`Updated ${locale}/${namespace}.json`);
    });
  }

  /**
   * Run health check
   */
  healthCheck() {
    console.log('🔍 Running translation health check...\n');
    
    // Validate JSON files
    const validationErrors = this.validateTranslations();
    if (validationErrors.length > 0) {
      console.log('❌ Validation Errors:');
      validationErrors.forEach(error => console.log(`  - ${error}`));
      console.log('');
    } else {
      console.log('✅ All translation files are valid JSON\n');
    }
    
    // Show statistics
    const stats = this.generateStats();
    console.log('📊 Translation Statistics:');
    console.log(`  Total keys: ${stats.totalKeys}`);
    console.log('  Completeness by locale:');
    Object.entries(stats.completeness).forEach(([locale, percent]) => {
      console.log(`    ${locale}: ${percent}%`);
    });
    console.log('');
    
    // Show missing keys summary
    const missingKeys = this.findMissingKeys();
    const totalMissing = Object.values(missingKeys).reduce((sum, namespaces) => {
      return sum + Object.values(namespaces).reduce((nsSum, keys) => nsSum + Object.keys(keys).length, 0);
    }, 0);
    
    if (totalMissing > 0) {
      console.log(`⚠️  Missing ${totalMissing} translations across all locales\n`);
    } else {
      console.log('✅ No missing translations detected\n');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new TranslationManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      manager.healthCheck();
      break;
    case 'missing':
      manager.generateMissingTranslations();
      break;
    case 'stats':
      console.log(JSON.stringify(manager.generateStats(), null, 2));
      break;
    case 'export':
      const exportLocale = process.argv[3];
      manager.exportToCSV(exportLocale);
      break;
    case 'import':
      const csvPath = process.argv[3];
      const importLocale = process.argv[4];
      if (!csvPath || !importLocale) {
        console.error('Usage: translation-manager import <csv-path> <locale>');
        process.exit(1);
      }
      manager.importFromCSV(csvPath, importLocale);
      break;
    default:
      console.log('Translation Manager');
      console.log('Usage: node translation-manager.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  check           - Run health check');
      console.log('  missing         - Generate missing translation templates');
      console.log('  stats          - Show translation statistics');
      console.log('  export [locale] - Export translations to CSV');
      console.log('  import <csv> <locale> - Import translations from CSV');
      break;
  }
}

module.exports = TranslationManager;