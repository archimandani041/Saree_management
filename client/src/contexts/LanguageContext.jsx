/**
 * LanguageContext — Global Localization Context
 * Provides active language, translation lookup function t(), and language switcher methods.
 * Persists user preference in localStorage ('sari_language').
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../i18n/translations';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('sari_language');
      if (saved && ['en', 'gu', 'hi'].includes(saved)) {
        return saved;
      }
    } catch (_) {}
    return 'en';
  });

  const changeLanguage = useCallback((newLang) => {
    if (!['en', 'gu', 'hi'].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem('sari_language', newLang);
      document.documentElement.lang = newLang;
      window.dispatchEvent(new CustomEvent('sari_language_changed', { detail: newLang }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (_) {}
  }, [language]);

  const t = useCallback((path, fallback = '') => {
    return getTranslation(language, path, fallback);
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(() => ({
    language,
    changeLanguage,
    setLanguage: changeLanguage,
    t,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageInfo,
  }), [language, changeLanguage, t, currentLanguageInfo]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
