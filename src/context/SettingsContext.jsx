import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('bridge_lang') || 'ru'); // ru, en, kk
  const [apiKey, setApiKey] = useState(localStorage.getItem('bridge_gemini_key') || '');

  useEffect(() => {
    localStorage.setItem('bridge_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('bridge_gemini_key', apiKey);
  }, [apiKey]);

  // Map app lang to Web Speech API lang
  const getVoiceLang = () => {
    if (language === 'en') return 'en-US';
    if (language === 'kk') return 'kk-KZ'; // Keep in mind kk-KZ might not be supported on all browsers
    return 'ru-RU';
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, apiKey, setApiKey, getVoiceLang }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
