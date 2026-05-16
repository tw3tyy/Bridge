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
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'ru-RU';

    recognition.onresult = (event) => {
      const current = event.results[0][0].transcript;
      setTranscript(current);
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Automatically process on end if we have text
    };
    
    recognitionRef.current = recognition;
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      if (transcript.length > 0) processTranscript(transcript);
    } else {
      setTranscript('');
      setOptions([]);
      try {
        recognitionRef.current.start();
      } catch(e) {}
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    const prompt = `Defect correction: "${text}". ONLY JSON array of 3 short options.`;
    
    try {
      // Use the improved generateCompletion with built-in fallbacks
      const res = await generateCompletion(text, apiKey, prompt);
      let clean = typeof res === 'string' ? res.replace(/```json/gi, '').replace(/```/g, '').trim() : "";
      
      try {
        const parsed = JSON.parse(clean);
        setOptions(Array.isArray(parsed) ? parsed : [clean]);
      } catch(e) {
        // If parsing fails, use fallback options
        setOptions(["Мне нужна помощь", "Где здесь выход?", "Подскажите время"]);
      }
    } catch (e) {
      setOptions(["Мне нужна помощь", "Где здесь выход?", "Подскажите время"]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', background: '#000' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <h2 style={{ fontSize: '1.2rem', color: 'gray' }}>SPEECH MODE</h2>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        
        <motion.div 
          onClick={toggleListening}
          className="glass-panel"
          style={{ width: '160px', height: '160px', borderRadius: '50%', background: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isListening ? '4px solid white' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
        >
          {isProcessing ? <Loader2 size={80} className="animate-spin" /> : <Mic size={80} color={isListening ? 'white' : 'var(--primary)'} />}
        </motion.div>

        <h2 style={{ fontSize: '1.8rem', textAlign: 'center' }}>
          {isProcessing ? "Анализирую..." : isListening ? "Нажмите для ОТВЕТА" : "Нажмите и говорите"}
        </h2>

        {transcript && <div style={{ fontSize: '1.3rem', textAlign: 'center', fontStyle: 'italic', color: 'cyan' }}>"{transcript}"</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <AnimatePresence>
            {options.map((opt, i) => (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                key={i} onClick={() => speak(opt)} className="glass-btn" 
                style={{ justifyContent: 'flex-start', padding: '1.2rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)' }}
              >
                <Volume2 size={24} style={{ marginRight: '1rem' }} /> {opt}
              </motion.button>
            ))}
          </AnimatePresence>
          {options.length === 0 && !isProcessing && !isListening && (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: '0.9rem' }}>Результаты появятся здесь</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechMode;
