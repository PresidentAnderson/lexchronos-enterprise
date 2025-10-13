'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { getAvailableLanguages, type LanguageInfo } from '../lib/i18n/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'flag-only';
  showLabels?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'default', 
  showLabels = true,
  className = ''
}: LanguageSwitcherProps) {
  const { locale, changeLanguage, isRTL, direction } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const availableLanguages = getAvailableLanguages();
  const currentLanguage = availableLanguages.find(lang => lang.code === locale);

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      await changeLanguage(newLocale);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const buttonClasses = `
    relative inline-flex items-center gap-2 px-3 py-2 
    text-sm font-medium text-gray-700 bg-white border border-gray-300 
    rounded-md shadow-sm hover:bg-gray-50 focus:outline-none 
    focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    ${isRTL ? 'flex-row-reverse' : ''}
    ${className}
  `;

  const dropdownClasses = `
    absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg
    min-w-full max-h-60 overflow-auto
    ${isRTL ? 'right-0' : 'left-0'}
    ${direction === 'rtl' ? 'text-right' : 'text-left'}
  `;

  const renderCompactButton = () => (
    <button
      type="button"
      className={buttonClasses}
      onClick={() => setIsOpen(!isOpen)}
      disabled={isLoading}
      aria-label="Change language"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <span className="text-lg" role="img" aria-hidden="true">
        {currentLanguage?.flag || '🌐'}
      </span>
      {variant !== 'flag-only' && showLabels && (
        <span className="hidden sm:inline-block">
          {currentLanguage?.nativeName || 'Language'}
        </span>
      )}
      <ChevronDown 
        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  );

  const renderDefaultButton = () => (
    <button
      type="button"
      className={buttonClasses}
      onClick={() => setIsOpen(!isOpen)}
      disabled={isLoading}
      aria-label="Change language"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {showLabels && (
        <>
          <span className="text-lg" role="img" aria-hidden="true">
            {currentLanguage?.flag}
          </span>
          <span className="font-medium">
            {currentLanguage?.nativeName || 'Language'}
          </span>
        </>
      )}
      <ChevronDown 
        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  );

  const renderButton = () => {
    switch (variant) {
      case 'compact':
      case 'flag-only':
        return renderCompactButton();
      default:
        return renderDefaultButton();
    }
  };

  return (
    <div className="relative">
      {renderButton()}
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div 
            className={dropdownClasses}
            role="listbox"
            aria-label="Select language"
          >
            {availableLanguages.map((language) => {
              const isSelected = language.code === locale;
              const isRTLLanguage = language.isRTL;
              
              return (
                <button
                  key={language.code}
                  type="button"
                  className={`
                    w-full px-4 py-3 text-sm text-left hover:bg-gray-100 
                    focus:outline-none focus:bg-gray-100 transition-colors
                    ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}
                    ${isRTLLanguage ? 'text-right' : 'text-left'}
                    flex items-center justify-between gap-3
                  `}
                  onClick={() => handleLanguageChange(language.code)}
                  role="option"
                  aria-selected={isSelected}
                  disabled={isLoading}
                >
                  <div className={`flex items-center gap-3 ${isRTLLanguage ? 'flex-row-reverse' : ''}`}>
                    <span className="text-lg" role="img" aria-hidden="true">
                      {language.flag}
                    </span>
                    <div className={isRTLLanguage ? 'text-right' : 'text-left'}>
                      <div className="font-medium">
                        {language.nativeName}
                      </div>
                      {language.nativeName !== language.name && (
                        <div className="text-xs text-gray-500">
                          {language.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check 
                      className="h-4 w-4 text-indigo-600 flex-shrink-0" 
                      aria-hidden="true" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// Keyboard navigation support
export function LanguageSwitcherWithKeyboard(props: LanguageSwitcherProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const availableLanguages = getAvailableLanguages();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < availableLanguages.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : availableLanguages.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          // Handle selection
        }
        break;
      case 'Escape':
        // Close dropdown
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <LanguageSwitcher {...props} />
    </div>
  );
}

// Mobile-friendly version
export function MobileLanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <LanguageSwitcher 
      {...props} 
      variant="compact"
      className="sm:hidden"
    />
  );
}

// Desktop version
export function DesktopLanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <LanguageSwitcher 
      {...props}
      className="hidden sm:inline-flex"
    />
  );
}

export default LanguageSwitcher;