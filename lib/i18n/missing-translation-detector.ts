'use client';

/**
 * Missing Translation Detector
 * Tracks and reports missing translation keys in development
 */
export class MissingTranslationDetector {
  private missingKeys: Map<string, { count: number; contexts: string[]; firstSeen: Date }> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Track a missing translation key
   */
  track(key: string, namespace: string = 'common', locale: string = 'en', context?: string): void {
    if (!this.isEnabled) return;

    const fullKey = `${locale}:${namespace}:${key}`;
    const existing = this.missingKeys.get(fullKey);

    if (existing) {
      existing.count++;
      if (context && !existing.contexts.includes(context)) {
        existing.contexts.push(context);
      }
    } else {
      this.missingKeys.set(fullKey, {
        count: 1,
        contexts: context ? [context] : [],
        firstSeen: new Date()
      });
    }

    // Log immediately in development
    if (this.isEnabled) {
      console.warn(`🌐 Missing translation: ${fullKey}${context ? ` (Context: ${context})` : ''}`);
    }
  }

  /**
   * Get all missing keys
   */
  getMissingKeys(): Array<{
    key: string;
    count: number;
    contexts: string[];
    firstSeen: Date;
  }> {
    return Array.from(this.missingKeys.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }

  /**
   * Get missing keys for a specific locale
   */
  getMissingKeysForLocale(locale: string): Array<{
    key: string;
    count: number;
    contexts: string[];
    firstSeen: Date;
  }> {
    return this.getMissingKeys().filter(item => item.key.startsWith(`${locale}:`));
  }

  /**
   * Get missing keys for a specific namespace
   */
  getMissingKeysForNamespace(namespace: string): Array<{
    key: string;
    count: number;
    contexts: string[];
    firstSeen: Date;
  }> {
    return this.getMissingKeys().filter(item => item.key.includes(`:${namespace}:`));
  }

  /**
   * Generate translation file template
   */
  generateTranslationTemplate(locale: string, namespace: string = 'common'): string {
    const missingKeys = this.getMissingKeys()
      .filter(item => item.key.startsWith(`${locale}:${namespace}:`))
      .map(item => item.key.split(':')[2]); // Extract just the key part

    if (missingKeys.length === 0) {
      return '{}';
    }

    const template: Record<string, string> = {};
    missingKeys.forEach(key => {
      // Create nested object structure for dot-notation keys
      const keyParts = key.split('.');
      let current = template;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, string>;
      }
      
      const finalKey = keyParts[keyParts.length - 1];
      current[finalKey] = `TODO: Translate "${key}"`;
    });

    return JSON.stringify(template, null, 2);
  }

  /**
   * Export missing keys as CSV
   */
  exportAsCSV(): string {
    const missingKeys = this.getMissingKeys();
    const headers = ['Key', 'Locale', 'Namespace', 'Count', 'First Seen', 'Contexts'];
    
    const rows = missingKeys.map(item => {
      const [locale, namespace, ...keyParts] = item.key.split(':');
      const key = keyParts.join(':');
      
      return [
        key,
        locale,
        namespace,
        item.count.toString(),
        item.firstSeen.toISOString(),
        item.contexts.join('; ')
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Report missing translations to console
   */
  report(): void {
    if (!this.isEnabled || this.missingKeys.size === 0) return;

    const missingKeys = this.getMissingKeys();
    
    console.group('🌐 Missing Translation Report');
    console.log(`Total missing keys: ${missingKeys.length}`);
    
    // Group by locale
    const byLocale = missingKeys.reduce((acc, item) => {
      const locale = item.key.split(':')[0];
      if (!acc[locale]) acc[locale] = [];
      acc[locale].push(item);
      return acc;
    }, {} as Record<string, typeof missingKeys>);

    Object.entries(byLocale).forEach(([locale, keys]) => {
      console.group(`📍 ${locale.toUpperCase()} (${keys.length} keys)`);
      
      // Group by namespace within locale
      const byNamespace = keys.reduce((acc, item) => {
        const namespace = item.key.split(':')[1];
        if (!acc[namespace]) acc[namespace] = [];
        acc[namespace].push(item);
        return acc;
      }, {} as Record<string, typeof keys>);

      Object.entries(byNamespace).forEach(([namespace, nsKeys]) => {
        console.group(`📂 ${namespace} (${nsKeys.length} keys)`);
        nsKeys.slice(0, 10).forEach(item => { // Show top 10 most frequent
          const key = item.key.split(':').slice(2).join(':');
          console.log(`❌ ${key} (${item.count}x)${item.contexts.length > 0 ? ` - Contexts: ${item.contexts.join(', ')}` : ''}`);
        });
        if (nsKeys.length > 10) {
          console.log(`... and ${nsKeys.length - 10} more`);
        }
        console.groupEnd();
      });
      
      console.groupEnd();
    });

    console.groupEnd();

    // Provide helpful suggestions
    console.group('💡 Suggestions');
    console.log('1. Run detector.generateTranslationTemplate("locale", "namespace") to create templates');
    console.log('2. Run detector.exportAsCSV() to export for translation services');
    console.log('3. Use detector.clear() to reset the tracker');
    console.groupEnd();
  }

  /**
   * Clear all tracked missing keys
   */
  clear(): void {
    this.missingKeys.clear();
  }

  /**
   * Get summary statistics
   */
  getStatistics(): {
    totalMissingKeys: number;
    totalOccurrences: number;
    locales: string[];
    namespaces: string[];
    mostFrequent: Array<{ key: string; count: number }>;
  } {
    const missingKeys = this.getMissingKeys();
    const locales = new Set<string>();
    const namespaces = new Set<string>();
    let totalOccurrences = 0;

    missingKeys.forEach(item => {
      const [locale, namespace] = item.key.split(':');
      locales.add(locale);
      namespaces.add(namespace);
      totalOccurrences += item.count;
    });

    return {
      totalMissingKeys: missingKeys.length,
      totalOccurrences,
      locales: Array.from(locales).sort(),
      namespaces: Array.from(namespaces).sort(),
      mostFrequent: missingKeys.slice(0, 10).map(item => ({
        key: item.key,
        count: item.count
      }))
    };
  }

  /**
   * Enable/disable the detector
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && process.env.NODE_ENV === 'development';
  }

  /**
   * Check if detector is enabled
   */
  getIsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create global instance
export const missingTranslationDetector = new MissingTranslationDetector();

// Make it available in browser console for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).translationDetector = missingTranslationDetector;
  console.log('🌐 Translation detector available as window.translationDetector');
}

/**
 * Translation key generator utility
 */
export class TranslationKeyGenerator {
  private generatedKeys: Set<string> = new Set();

  /**
   * Generate a translation key from text
   */
  generateKey(text: string, namespace: string = 'common'): string {
    // Convert text to camelCase key
    const key = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, '') // Remove special characters
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    let finalKey = key;
    let counter = 1;

    // Ensure uniqueness
    while (this.generatedKeys.has(`${namespace}:${finalKey}`)) {
      finalKey = `${key}${counter}`;
      counter++;
    }

    this.generatedKeys.add(`${namespace}:${finalKey}`);
    return finalKey;
  }

  /**
   * Generate nested key structure
   */
  generateNestedKey(path: string[], baseText: string, namespace: string = 'common'): string {
    const key = this.generateKey(baseText, namespace);
    return [...path, key].join('.');
  }

  /**
   * Clear generated keys cache
   */
  clear(): void {
    this.generatedKeys.clear();
  }

  /**
   * Get all generated keys
   */
  getGeneratedKeys(): string[] {
    return Array.from(this.generatedKeys).sort();
  }
}

// Create global instance
export const translationKeyGenerator = new TranslationKeyGenerator();

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Auto-report missing translations every 30 seconds
  setInterval(() => {
    if (missingTranslationDetector.getMissingKeys().length > 0) {
      missingTranslationDetector.report();
    }
  }, 30000);
}