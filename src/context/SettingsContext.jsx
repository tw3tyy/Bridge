import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLang') || 'ru');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('bridgeUserName') || '');

  useEffect(() => {
    localStorage.setItem('appLang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem('bridgeUserName', userName);
  }, [userName]);

  const getVoiceLang = () => {
    switch(language) {
      case 'en': return 'en-US';
      case 'kk': return 'kk-KZ';
      case 'ru': default: return 'ru-RU';
    }
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, apiKey, setApiKey, userName, setUserName, getVoiceLang }}>
      {children}
    </SettingsContext.Provider>
  );
};
