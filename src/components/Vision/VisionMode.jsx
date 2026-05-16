import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateVisionDescription } from '../../utils/ai';
import '../../index.css';

const VisionMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, speak } = useSettings();
  const [activeState, setActiveState] = useState('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.start();
        setActiveState('listening');
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
      } catch (err) { setError("Ошибка камеры: " + err.message); }
    };
    startCamera();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'kk-KZ';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript.length > 2 && activeState === 'listening') {
        recognition.stop();
        handleAnalysis(transcript);
      }
    };

    recognition.onend = () => {
      if (activeState === 'listening') {
        try { recognition.start(); } catch(e){}
      }
    };

    recognitionRef.current = recognition;
    startListening();

    setTimeout(() => {
      let text = "Режим зрения. Какое фото мне описать?";
      if (language === 'en') text = "Vision mode. What should I describe?";
      speak(text); 
    }, 500);

    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.8);
  };

  const handleAnalysis = async (cmd) => {
    setActiveState('describing');
    setError(null);
    speak(language === 'en' ? "Analyzing..." : "Анализирую...");
    
    const img = captureFrame();
    if (!img) { setError("Не удалось захватить кадр"); startListening(); return; }

    const prompt = `Ответь кратко на вопрос по фото: "${cmd}". 1 предложение. Язык: ${language === 'en' ? 'English' : 'Русский'}`;
    
    try {
      const res = await generateVisionDescription(prompt, img, apiKey);
      if (res.includes("Ошибка") || res.includes("Error")) {
        setError(res);
      }
      speak(res, () => { startListening(); });
    } catch (e) {
      setError("Ошибка ИИ: " + e.message);
      speak("Произошла ошибка");
      startListening();
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <div style={{ width: '90px', height: '65px', borderRadius: '12px', overflow: 'hidden', border: cameraActive ? '3px solid var(--accent)' : '3px solid var(--danger)', background: 'black' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <motion.div 
        className="glass-panel" 
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '2.5rem', background: activeState === 'describing' ? 'var(--primary)' : 'rgba(255,255,255,0.03)' }}
      >
        {activeState === 'describing' ? <Loader2 size={100} className="animate-spin" color="white" /> : <Mic size={100} color="var(--primary)" />}
        
        <h2 style={{ fontSize: '2.2rem', marginTop: '2.5rem', textAlign: 'center', maxWidth: '300px' }}>
          {activeState === 'listening' ? (language === 'en' ? "Listening..." : "Слушаю...") : 
           activeState === 'describing' ? (language === 'en' ? "Analyzing..." : "Анализирую...") : "..."}
        </h2>

        {error && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '1rem', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', maxWidth: '90%' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VisionMode;
