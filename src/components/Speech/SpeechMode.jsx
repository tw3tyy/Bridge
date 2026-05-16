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

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;

    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (transcript.trim().length > 1) {
        processTranscript(transcript);
      }
    } else {
      setTranscript('');
      setOptions([]);
      setError(null);
      try {
        recognitionRef.current.start();
      } catch(e) {}
    }
  };

  const processTranscript = async (text) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const prompt = `Correct this speech: "${text}". Return ONLY a JSON array of 3 strings: ["Option1", "Option2", "Option3"]. Language: ${language === 'en' ? 'English' : 'Russian'}`;

    try {
      const res = await generateCompletion(text, apiKey, prompt);
      let clean = res.replace(/```json/gi, '').replace(/```/g, '').trim();
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
          style={{ width: '180px', height: '180px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isListening ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', border: isListening ? '5px solid white' : '2px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
        >
          {isProcessing ? <Loader2 size={80} className="animate-spin" /> : <Mic size={80} color={isListening ? 'white' : 'var(--primary)'} />}
        </motion.div>

        <h2 style={{ fontSize: '1.8rem', textAlign: 'center' }}>
          {isProcessing ? "Анализирую..." : isListening ? "Нажмите, чтобы ЗАКОНЧИТЬ" : "Нажмите, чтобы НАЧАТЬ"}
        </h2>

        {transcript && <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', width: '100%', textAlign: 'center' }}>"{transcript}"</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((opt, i) => (
             <button key={i} onClick={() => speak(opt)} className="glass-btn" style={{ justifyContent: 'flex-start', padding: '1.5rem', borderRadius: '1.2rem', background: 'rgba(255,255,255,0.05)' }}>
               <Volume2 size={22} style={{ marginRight: '1rem', color: 'var(--secondary)' }} /> {opt}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpeechMode;
