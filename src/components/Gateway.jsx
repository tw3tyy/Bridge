import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Ear, MessageSquareQuote, Play, Award, Settings, Key, Globe, AlertCircle, Mic } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import '../index.css';

const Gateway = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { language, setLanguage, apiKey, setApiKey, getVoiceLang } = useSettings();
  const recognitionRef = useRef(null);
  
  const startListening = () => {
      if (recognitionRef.current && !showSettings) {
          try { recognitionRef.current.start(); } catch(e){}
      }
  };

  const speakWelcome = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let text = "Добро пожаловать в Bridge. Скажите: Зрение, Слух, или Речь.";
      if (language === 'en') text = "Welcome to Bridge. Say: Vision, Hearing, or Speech.";
      if (language === 'kk') text = "Bridge-ке қош келдіңіз. 'Көру', 'Есту' немесе 'Сөйлеу' деп айтыңыз.";
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = getVoiceLang();
      msg.onend = () => {
         // Start listening ONLY after the welcome message goes silent!
         setTimeout(() => startListening(), 300);
      };
      window.speechSynthesis.speak(msg);
    } else {
      startListening();
    }
  };

  const handleStart = () => {
    if (started) return;
    setStarted(true);
    setTimeout(() => speakWelcome(), 300);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getVoiceLang();

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
         // Keep listening active
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
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={handleStart}
          >
            <div 
              style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 0 50px var(--primary-glow)' }}
              className="animate-pulse-glow"
            >
              <Play size={80} color="white" fill="white" style={{ marginLeft: '10px' }}/>
            </div>
            <h1 className="text-gradient" style={{ fontSize: '4rem', marginTop: '3rem', marginBottom: '1rem' }}>BRIDGE</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', textAlign: 'center', maxWidth: '600px' }}>
              Нажмите в любую точку экрана, чтобы начать
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
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                   Bridge 
                   {isListening && <Mic size={28} color="var(--accent)" className="animate-pulse-glow" />}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                   {language === 'en' ? 'Say: "Vision", "Hearing" or "Speech"' : language === 'kk' ? '"Көру", "Есту" немесе "Сөйлеу" деп айтыңыз' : 'Скажите: "Зрение", "Слух" или "Речь"'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowSettings(!showSettings)} className="glass-btn" style={{ padding: '0.5rem 1rem' }}>
                  <Settings size={20} color="var(--text-main)" />
                </button>
                <button onClick={() => navigate('/dashboard')} className="glass-btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Award size={20} color="var(--secondary)" />
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
                  style={{ overflow: 'hidden', marginBottom: '2rem' }}
                >
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                     {/* Settings Content... */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--accent)' }}><Globe size={18}/> Язык интерфейса</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }}>
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                        <option value="kk">Қазақша</option>
                      </select>
                    </div>
                    <div style={{ flex: 2, minWidth: '250px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: 'var(--primary)' }}><Key size={18}/> Gemini API Key</label>
                      <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Вставьте ключ сюда..." style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-panel" style={{ padding: '2rem', cursor: 'pointer', borderTop: '4px solid var(--primary)' }} onClick={() => navigate('/vision')}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Eye size={32} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {language === 'en' ? 'Vision' : language === 'kk' ? 'Көру' : 'Зрение'}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Camera + Realtime AI</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-panel" style={{ padding: '2rem', cursor: 'pointer', borderTop: '4px solid var(--accent)' }} onClick={() => navigate('/hearing')}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Ear size={32} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {language === 'en' ? 'Hearing' : language === 'kk' ? 'Есту' : 'Слух'}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Audio Environment Analysis</p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-panel" style={{ padding: '2rem', cursor: 'pointer', borderTop: '4px solid var(--secondary)' }} onClick={() => navigate('/speech')}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'var(--secondary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <MessageSquareQuote size={32} color="var(--secondary)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {language === 'en' ? 'Speech' : language === 'kk' ? 'Сөйлеу' : 'Речь'}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Voice AI Correction</p>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gateway;
