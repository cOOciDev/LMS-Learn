import { createContext, useContext, useState, useEffect } from "react";

export const LanguageContext = createContext(null);

import enTranslations from "@/locales/en.json";
import faTranslations from "@/locales/fa.json";

const translations = {
  en: enTranslations,
  fa: faTranslations,
};

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "en";
  });
  const [translationsData, setTranslationsData] = useState(() => {
    const saved = localStorage.getItem("language");
    const lang = saved || "en";
    return translations[lang] || translations.en;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTranslations(language);
  }, [language]);

  const loadTranslations = (lang) => {
    setLoading(true);
    try {
      const data = translations[lang] || translations.en;
      setTranslationsData(data);
    } catch (error) {
      console.error("Error loading translations:", error);
      // Fallback to English if translation fails
      setTranslationsData(translations.en);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang) => {
    if (lang !== language && (lang === "en" || lang === "fa")) {
      setLanguage(lang);
      localStorage.setItem("language", lang);
    }
  };

  const t = (key) => {
    if (!translationsData) return key;
    
    const keys = key.split(".");
    let value = translationsData;
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === "string" ? value : key;
  };

  const isRTL = language === "fa";

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        isRTL,
        loading,
      }}
    >
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-sans" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

