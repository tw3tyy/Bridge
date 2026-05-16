import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('appLang');
    return saved && (saved === 'ru' || saved === 'en' || saved === 'kk') ? saved : 'ru';
  });
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('bridgeUserName') || '');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('bridgeAuthToken') || '');
  const [xp, setXp] = useState(() => Number(localStorage.getItem('bridgeXp')) || 0);
  const [level, setLevel] = useState(() => Number(localStorage.getItem('bridgeLevel')) || 1);

  useEffect(() => {
    localStorage.setItem('appLang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('bridgeUserName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('bridgeAuthToken', authToken);
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem('bridgeXp', xp);
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('bridgeLevel', level);
  }, [level]);

  const apiFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const opts = { ...options, headers };
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'API error');
    }
    return data;
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!authToken) return;
      try {
        const data = await apiFetch('/api/auth/me');
        if (data.user) {
          setUserName(data.user.username);
          setXp(data.user.xp ?? 0);
          setLevel(data.user.level ?? 1);
        }
      } catch (e) {
        console.warn('Failed to load profile', e);
      }
    };
    loadProfile();
  }, [authToken]);

  const getVoiceLang = () => {
    switch (language) {
      case 'en': return 'en-US';
      case 'kk': return 'kk-KZ';
      case 'ru': default: return 'ru-RU';
    }
  };

  const speak = useCallback((text, onEnd) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceLang();
    
    const voices = window.speechSynthesis.getVoices();
    // Try to find a female voice for the selected language
    // Common female voice names: Samantha, Victoria (EN), Milena, Katya (RU)
    const femaleVoice = voices.find(v => 
      v.lang.startsWith(language) && 
      (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Milena') || v.name.includes('Katya') || v.name.includes('Google'))
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher pitch for feminity if voice is robotic
    
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  // Handle Chrome's lazy voice loading
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        apiKey,
        setApiKey,
        userName,
        setUserName,
        authToken,
        setAuthToken,
        xp,
        setXp,
        level,
        setLevel,
        getVoiceLang,
        apiFetch,
        speak
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
