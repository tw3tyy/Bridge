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
    setActiveState('listening');
    if (!recognitionRef.current) return;
    try { recognitionRef.current.start(); } catch(e) {}
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
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
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // More reliable for one-shot
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'kk-KZ';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript.length > 0) {
        setLastTranscript(transcript);
        handleAnalysis(transcript);
      }
    };

    recognition.onend = () => {
      if (activeState === 'listening') startListening();
    };

    recognitionRef.current = recognition;
    
    speak(language === 'en' ? "Vision mode." : "Режим зрения.", () => startListening());

    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
    return canvasRef.current.toDataURL('image/jpeg', 0.5);
  };

  const handleAnalysis = async (cmd = "What is this?") => {
    if (activeState === 'describing') return;
    setActiveState('describing');
    setError(null);
    stopListening();
    
    speak(language === 'en' ? "Thinking..." : "Думаю...");
    
    const img = captureFrame();
    if (!img) { setError("Camera fail"); startListening(); return; }

    try {
      const res = await generateVisionDescription(`Answer short: ${cmd}`, img, apiKey);
      setAiResponse(res);
      speak(res, () => startListening());
    } catch (e) {
      setError("AI Fail");
      startListening();
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', background: '#000' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <div style={{ width: '80px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: cameraActive ? '2px solid cyan' : '2px solid red' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <motion.div 
        onClick={() => { if (activeState === 'listening') handleAnalysis("Describe"); }}
        className="glass-panel" 
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '2rem', background: activeState === 'describing' ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}
      >
        <div className={activeState === 'listening' ? 'animate-pulse' : ''}>
          {activeState === 'describing' ? <Loader2 size={100} className="animate-spin" /> : <Mic size={100} color="var(--primary)" />}
        </div>
        <h2 style={{ fontSize: '2rem', marginTop: '2rem', textAlign: 'center' }}>
          {activeState === 'listening' ? (language === 'en' ? "Tap to analyze" : "Нажми для анализа") : "..."}
        </h2>
        
        {aiResponse && <div style={{ padding: '1rem', background: 'var(--secondary)', borderRadius: '1rem', marginTop: '1rem' }}>{aiResponse}</div>}
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
      </motion.div>
    </div>
  );
};

export default VisionMode;
