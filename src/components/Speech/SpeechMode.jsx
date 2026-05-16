import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Volume2, Info, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateCompletion } from '../../utils/ai';
import '../../index.css';

const SpeechMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, speak } = useSettings();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [options, setOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'ru' ? 'ru-RU' : 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      // Auto-stop after 1.5s of silence
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (current.length > 2) {
          recognition.stop();
          processTranscript(current);
        }
      }, 1500);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    speak(language === 'en' ? "Speech mode. I am listening." : "Режим речи. Скажите фразу.");

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      clearTimeout(silenceTimer.current);
    };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setOptions([]);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {}
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    const prompt = `Correct the following speech (user has a defect): "${text}". Return exactly 3 short options as JSON array like ["Opt1", "Opt2", "Opt3"]. Language: ${language === 'en' ? 'English' : 'Russian'}`;

    try {
      const res = await generateCompletion(text, apiKey, prompt, '["Мне нужна помощь", "Где выход?", "Который час?"]');
      let clean = res.replace(/```json/gi, '').replace(/```/g, '').trim();
      setOptions(JSON.parse(clean));
    } catch (e) {
      setOptions([text]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', background: '#000' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <h2 style={{ fontSize: '1.5rem' }}>{language === 'en' ? 'SPEECH' : 'РЕЧЬ'}</h2>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <motion.div 
          animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          onClick={toggleListening}
          className="glass-panel"
          style={{ width: '200px', height: '200px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isListening ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', border: '4px solid white' }}
        >
          {isProcessing ? <Loader2 size={100} className="animate-spin" /> : <Mic size={100} />}
        </motion.div>

        <p style={{ fontSize: '1.8rem', textAlign: 'center' }}>
          {isProcessing ? "ИИ думает..." : isListening ? "Я слушаю вас..." : "Нажмите, чтобы начать"}
        </p>

        {transcript && <div style={{ fontSize: '1.2rem', color: 'gray', padding: '1rem', border: '1px solid #333', borderRadius: '1rem' }}>"{transcript}"</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {options.map((opt, i) => (
             <button key={i} onClick={() => speak(opt)} className="glass-btn" style={{ justifyContent: 'flex-start', padding: '1.5rem', borderRadius: '1rem' }}>
               <Volume2 size={24} style={{ marginRight: '1rem' }} /> {opt}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeechMode;
