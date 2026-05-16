import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Volume2, Loader2, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Reliable for Safari
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'ru-RU';

    recognition.onresult = (event) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
      if (event.results[0].isFinal) {
        processTranscript(current);
      }
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setOptions([]);
      try {
        recognitionRef.current.start();
      } catch(e) {}
    }
  };

  const processTranscript = async (text) => {
    if (text.length < 2) return;
    setIsProcessing(true);
    const prompt = `Correct speech defect: "${text}". ONLY return JSON array ["Opt1", "Opt2", "Opt3"].`;
    try {
      const res = await generateCompletion(text, apiKey, prompt, '["Мне нужна помощь", "Где выход?", "Который час?"]');
      let clean = res.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(clean);
        setOptions(Array.isArray(parsed) ? parsed : [clean]);
      } catch(e) { setOptions([clean]); }
    } catch (e) { setOptions([text]); }
    setIsProcessing(false);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', background: '#000', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>BRIDGE AI</span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <motion.div 
          onClick={toggleListening}
          animate={{ scale: isListening ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ width: '150px', height: '150px', borderRadius: '50%', background: isListening ? 'var(--danger)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isListening ? '0 0 30px var(--danger)' : 'none', cursor: 'pointer' }}
        >
          {isProcessing ? <Loader2 size={60} className="animate-spin" /> : <Mic size={60} />}
        </motion.div>

        <h2 style={{ fontSize: '1.5rem', textAlign: 'center' }}>
          {isProcessing ? "Анализирую..." : isListening ? "ГОВОРИТЕ..." : "НАЖМИТЕ И ГОВОРИТЕ"}
        </h2>

        <div style={{ minHeight: '60px', width: '100%', textAlign: 'center', fontSize: '1.4rem', fontStyle: 'italic', color: 'cyan' }}>
          {transcript && `"${transcript}"`}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <AnimatePresence>
            {options.map((opt, i) => (
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                key={i} onClick={() => speak(opt)} className="glass-btn" 
                style={{ justifyContent: 'flex-start', padding: '1.2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Volume2 size={24} style={{ marginRight: '1rem' }} /> {opt}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpeechMode;
