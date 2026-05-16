import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateVisionDescription } from '../../utils/ai';
import '../../index.css';

const VisionMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, speak } = useSettings();
  const [activeState, setActiveState] = useState('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.start();
        setActiveState('listening');
        setError(null);
      } catch(e) { console.warn("Mic already active"); }
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err) { setError("Camera Error: " + err.message); }
    };
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'kk-KZ';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript.length > 1) {
        setLastTranscript(transcript);
        handleAnalysis(transcript);
      }
    };

    recognition.onend = () => {
      if (activeState === 'listening') {
        try { recognition.start(); } catch(e){}
      }
    };

    recognitionRef.current = recognition;
    
    // Auto-start after a delay
    setTimeout(() => {
      speak(language === 'en' ? "Vision mode. I am listening." : "Режим зрения. Слушаю ваш вопрос.", () => {
        startListening();
      });
    }, 1000);

    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.6);
  };

  const handleAnalysis = async (cmd) => {
    if (activeState === 'describing') return;
    
    setActiveState('describing');
    setError(null);
    setAiResponse('');
    
    speak(language === 'en' ? "Analyzing..." : "Анализирую...");
    
    const img = captureFrame();
    if (!img) { 
      setError("Failed to capture image");
      setActiveState('listening');
      return; 
    }

    const prompt = `Ответь максимально кратко (1 предложение) на вопрос по фото: "${cmd}". Язык: ${language === 'en' ? 'English' : 'Русский'}`;
    
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
      const res = await generateVisionDescription(prompt, img, apiKey);
      setAiResponse(res);
      speak(res, () => {
        setActiveState('listening');
        startListening();
      });
    } catch (e) {
      setError("AI Error: " + e.message);
      setActiveState('listening');
      startListening();
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', background: 'var(--bg-dark)' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header with Camera Preview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.8rem 1.2rem' }}><ArrowLeft /></button>
        <div style={{ width: '100px', height: '70px', borderRadius: '15px', overflow: 'hidden', border: cameraActive ? '3px solid var(--accent)' : '3px solid var(--danger)', background: 'black', boxShadow: '0 8px 25px rgba(0,0,0,0.5)' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Main Interaction Area */}
      <motion.div 
        className="glass-panel" 
        style={{ 
          flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          borderRadius: '3rem', background: activeState === 'describing' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
          position: 'relative'
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          {activeState === 'describing' ? <Loader2 size={120} className="animate-spin" color="white" /> : <Mic size={120} color="var(--primary)" />}
        </div>
        
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold' }}>
          {activeState === 'listening' ? (language === 'en' ? "I'm listening..." : "Я вас слушаю...") : 
           activeState === 'describing' ? (language === 'en' ? "Thinking..." : "Думаю...") : "..."}
        </h2>

        {/* Dynamic Logs for debugging and user info */}
        <div style={{ marginTop: '2rem', width: '90%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {lastTranscript && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '0.8rem 1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                "{lastTranscript}"
              </motion.div>
            )}
            {aiResponse && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: '1rem', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={20} />
                <span>{aiResponse}</span>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '1rem', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default VisionMode;
