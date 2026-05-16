import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLang') || 'ru');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('bridgeUserName') || '');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('bridgeAuthToken') || '');
  const [xp, setXp] = useState(() => Number(localStorage.getItem('bridgeXp')) || 0);
  const [level, setLevel] = useState(() => Number(localStorage.getItem('bridgeLevel')) || 1);

  // Persist simple settings
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

  // Helper to add Authorization header automatically
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

  // On app start, if we have a token try to fetch user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!authToken) return;
      try {
        const data = await apiFetch('/api/auth/me');
        const { user } = data;
        setUserName(user.username);
        setXp(user.xp ?? 0);
        setLevel(user.level ?? 1);
      } catch (e) {
        console.warn('Failed to load profile', e);
        // token might be invalid – clear it
        setAuthToken('');
        setUserName('');
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getVoiceLang = () => {
    switch (language) {
      case 'en':
        return 'en-US';
      case 'kk':
        return 'kk-KZ';
      case 'ru':
      default:
        return 'ru-RU';
    }
  };

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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
