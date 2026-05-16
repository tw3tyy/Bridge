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
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Микрофон не поддерживается в этом браузере.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'ru-RU';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      clearTimeout(silenceTimer.current);
      if (!event.results[event.results.length - 1].isFinal) return; // Wait for finality

      silenceTimer.current = setTimeout(() => {
        if (current.length > 1) {
          recognition.stop();
          processTranscript(current);
        }
      }, 1000);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error(e);
      if (e.error === 'not-allowed') setError("Разрешите доступ к микрофону");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

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
      setError(null);
      try {
        recognitionRef.current.start();
      } catch(e) {
        console.error(e);
      }
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    const prompt = `Correct this speech defect nicely: "${text}". 
      Return ONLY a JSON array of 3 strings: ["Option1", "Option2", "Option3"]. 
      Language: ${language === 'en' ? 'English' : 'Russian'}`;

    try {
      const res = await generateCompletion(text, apiKey, prompt);
      let clean = res.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Safe parsing
      try {
        const parsed = JSON.parse(clean);
        setOptions(Array.isArray(parsed) ? parsed : [clean]);
      } catch(e) {
        setOptions([clean]);
      }
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

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        
        <motion.div 
          onClick={toggleListening}
          className="glass-panel"
          style={{ width: '180px', height: '180px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isListening ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', border: isListening ? '4px solid white' : '2px solid rgba(255,255,255,0.2)' }}
        >
          {isProcessing ? <Loader2 size={80} className="animate-spin" /> : <Mic size={80} color={isListening ? 'white' : 'var(--primary)'} />}
        </motion.div>

        <h2 style={{ fontSize: '1.8rem', textAlign: 'center' }}>
          {isProcessing ? "ИИ думает..." : isListening ? "Слушаю..." : "Нажмите и скажите"}
        </h2>

        {error && <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18} /> {error}</div>}

        {transcript && <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', width: '100%', textAlign: 'center', fontStyle: 'italic' }}>"{transcript}"</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((opt, i) => (
             <button key={i} onClick={() => speak(opt)} className="glass-btn" style={{ justifyContent: 'flex-start', padding: '1.5rem', borderRadius: '1.2rem', background: 'rgba(255,255,255,0.05)' }}>
               <Volume2 size={22} style={{ marginRight: '1rem', color: 'var(--secondary)' }} /> <span style={{ textAlign: 'left' }}>{opt}</span>
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeechMode;
