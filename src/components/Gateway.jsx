import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Ear, MessageSquareQuote, Play, Award, Settings, Key, Globe, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import '../index.css';

const Gateway = () => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { language, setLanguage, apiKey, setApiKey, getVoiceLang } = useSettings();

  const speakWelcome = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let text = "Добро пожаловать в Bridge. Выберите режим или назовите команду.";
      if (language === 'en') text = "Welcome to Bridge. Choose a mode or speak a command.";
      if (language === 'kk') text = "Bridge-ке қош келдіңіз. Режимді таңдаңыз.";
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = getVoiceLang();
      window.speechSynthesis.speak(msg);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => speakWelcome(), 500);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}
          >
            <div 
              style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer', boxShadow: '0 0 40px var(--primary-glow)' }}
              className="animate-pulse-glow"
              onClick={handleStart}
            >
              <Play size={64} color="white" fill="white" style={{ marginLeft: '10px' }}/>
            </div>
            <h1 className="text-gradient" style={{ fontSize: '3rem', marginTop: '2rem', marginBottom: '1rem' }}>BRIDGE</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', textAlign: 'center', maxWidth: '400px' }}>
              Платформа искусственного интеллекта для инклюзивного общения.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="main-gateway"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', position: 'relative', maxWidth: '1200px', margin: '0 auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Bridge</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                   {language === 'en' ? 'Speak a command or tap the screen.' : language === 'kk' ? 'Пәрменді айтыңыз немесе экранды түртіңіз.' : 'Скажите команду или коснитесь экрана.'}
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

            {!apiKey && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <AlertCircle color="var(--danger)" />
                 <div>
                   <h4 style={{ margin: 0, color: 'var(--danger)' }}>API ключ не найден</h4>
                   <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>Для работы камеры и реального ИИ нажмите на шестеренку и добавьте Gemini API Key. Иначе будут работать только демо-заглушки.</p>
                 </div>
              </motion.div>
            )}

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  style={{ overflow: 'hidden', marginBottom: '2rem' }}
                >
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
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
                <p style={{ color: 'var(--text-muted)' }}>Camera + Realtime AI Context</p>
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
