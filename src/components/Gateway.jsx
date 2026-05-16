import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Ear, MessageSquareQuote, Play, Award, Settings, Globe, Mic } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import '../index.css';

const Gateway = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { language, setLanguage, speak } = useSettings();
  const recognitionRef = useRef(null);
  
  const startListening = () => {
      if (recognitionRef.current && !showSettings) {
          try { recognitionRef.current.start(); } catch(e){}
      }
  };

  const speakWelcome = () => {
    let text = "Добро пожаловать в Bridge. Скажите: Зрение, Слух, или Речь.";
    if (language === 'en') text = "Welcome to Bridge. Say: Vision, Hearing, or Speech.";
    if (language === 'kk') text = "Bridge-ке қош келдіңіз. 'Көру', 'Есту' немесе 'Сөйлеу' деп айтыңыз.";
    
    speak(text, () => {
       setTimeout(() => startListening(), 300);
    });
  };

  const handleStart = () => {
    if (started) return;
    setStarted(true);
    setTimeout(() => speakWelcome(), 500);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'kk-KZ';

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript.toLowerCase();
        }
        
        if (transcript.includes('зрени') || transcript.includes('опиши') || transcript.includes('vision') || transcript.includes('көр')) {
            recognition.stop();
            navigate('/vision');
        } else if (transcript.includes('слух') || transcript.includes('hearing') || transcript.includes('есту')) {
            recognition.stop();
            navigate('/hearing');
        } else if (transcript.includes('речь') || transcript.includes('сказать') || transcript.includes('speech') || transcript.includes('сөйл')) {
            recognition.stop();
            navigate('/speech');
        }
      };

      recognition.onend = () => {
         setIsListening(false);
         if (started && !showSettings) {
             setTimeout(() => {
                if (recognitionRef.current) {
                    try { recognitionRef.current.start(); } catch(e){}
                }
             }, 1000);
         }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [language, showSettings, navigate, started]);

  return (
    <div className="page-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1rem', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        {!started && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={handleStart}
          >
            <div 
              style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 0 50px var(--primary-glow)' }}
              className="animate-pulse-glow"
            >
              <Play size={80} color="white" fill="white" style={{ marginLeft: '10px' }}/>
            </div>
            <h1 className="text-gradient" style={{ fontSize: '4.5rem', marginTop: '3rem', marginBottom: '1rem', fontWeight: 900 }}>BRIDGE</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', textAlign: 'center', maxWidth: '600px' }}>
              {language === 'ru' ? 'Нажмите, чтобы начать' : language === 'en' ? 'Tap to start' : 'Бастау үшін басыңыз'}
            </p>
          </motion.div>
        )}
        
        {started && (
          <motion.div
            key="main-gateway"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '15px', fontWeight: 800 }}>
                   Bridge 
                   {isListening && <Mic size={28} color="var(--accent)" className="animate-pulse-glow" />}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                   {language === 'en' ? 'Say: "Vision", "Hearing" or "Speech"' : language === 'kk' ? '"Көру", "Есту" немесе "Сөйлеу" деп айтыңыз' : 'Скажите: "Зрение", "Слух" или "Речь"'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowSettings(!showSettings)} className="glass-btn" style={{ padding: '0.8rem 1.2rem' }}>
                  <Settings size={22} color="white" />
                </button>
                <button onClick={() => navigate('/dashboard')} className="glass-btn" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Award size={22} color="var(--secondary)" />
                  <span style={{ fontWeight: 'bold'}}>
                    {language === 'en' ? 'Profile' : language === 'kk' ? 'Профиль' : 'Профиль'}
                  </span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  style={{ overflow: 'hidden', marginBottom: '2.5rem' }}
                >
                  <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px' }}>
                    <div style={{ width: '100%' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: 'var(--accent)', fontWeight: 'bold' }}>
                        <Globe size={20}/> {language === 'en' ? 'Application Language' : 'Язык приложения'}
                      </label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', fontSize: '1.1rem' }}>
                        <option value="ru">Русский (Russian)</option>
                        <option value="en">English</option>
                        <option value="kk">Қазақша (Kazakh)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="glass-panel" style={{ padding: '2.5rem', cursor: 'pointer', borderTop: '6px solid var(--primary)' }} onClick={() => navigate('/vision')}>
                <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <Eye size={40} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>
                  {language === 'en' ? 'Vision' : language === 'kk' ? 'Көру' : 'Зрение'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                   {language === 'en' ? 'AI Eye: Real-time surroundings analysis' : language === 'kk' ? 'ИИ Көзі: Айналаны нақты уақытта талдау' : 'ИИ-Зрение: Анализ окружения в реальном времени'}
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="glass-panel" style={{ padding: '2.5rem', cursor: 'pointer', borderTop: '6px solid var(--accent)' }} onClick={() => navigate('/hearing')}>
                <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <Ear size={40} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>
                  {language === 'en' ? 'Hearing' : language === 'kk' ? 'Есту' : 'Слух'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                   {language === 'en' ? 'AI Ear: Sound event detection' : language === 'kk' ? 'ИИ Смағы: Дыбыстарды тану' : 'ИИ-Слух: Определение звуковых событий'}
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="glass-panel" style={{ padding: '2.5rem', cursor: 'pointer', borderTop: '6px solid var(--secondary)' }} onClick={() => navigate('/speech')}>
                <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'var(--secondary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <MessageSquareQuote size={40} color="var(--secondary)" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>
                  {language === 'en' ? 'Speech' : language === 'kk' ? 'Сөйлеу' : 'Речь'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                   {language === 'en' ? 'AI Voice: Intelligent speech enhancement' : language === 'kk' ? 'ИИ Дауысы: Сөйлеуді жақсарту' : 'ИИ-Речь: Интеллектуальное улучшение речи'}
                </p>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gateway;
