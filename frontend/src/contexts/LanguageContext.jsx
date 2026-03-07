import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('yad2_lang') || 'he');

  useEffect(() => {
    localStorage.setItem('yad2_lang', lang);
    document.documentElement.dir  = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => setLang(l => l === 'he' ? 'en' : 'he');

  /** t('key') — returns translated string, supports {n} placeholder */
  const t = (key, vars = {}) => {
    let val = translations[lang]?.[key] ?? translations['he']?.[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => { val = val.replace(`{${k}}`, v); });
    return val;
  };

  /** Translate a condition stored in Hebrew */
  const tCond = (hebrewCond) => t(`cond.${hebrewCond}`);

  /** Translate a category by its English ID */
  const tCat = (catId) => t(`cat.${catId}`);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, tCond, tCat, isHeb: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
