import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, ShieldAlert, Camera, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateVisionDescription } from '../../utils/ai';
import '../../index.css';

const VisionMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, speak } = useSettings();
  const [activeState, setActiveState] = useState('idle'); // idle, listening, describing, danger
  const [cameraActive, setCameraActive] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Start Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error(err);
        speak(language === 'en' ? "Camera error" : "Ошибка камеры");
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 2. Start Listening
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

    // Intro
    setTimeout(() => {
      let text = "Режим зрения. Задайте вопрос.";
      if (language === 'en') text = "Vision mode. Ask your question.";
      speak(text, () => {
        setActiveState('listening');
        try { recognition.start(); } catch(e){}
      });
    }, 500);

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
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
    speak(language === 'en' ? "Analyzing..." : "Анализирую...");
    
    const img = captureFrame();
    if (!img) {
      setActiveState('listening');
      return;
    }

    const prompt = `Ответь на вопрос по фото: "${cmd}". КРАТКО, ОДНИМ ПРЕДЛОЖЕНИЕМ. Язык: ${language === 'en' ? 'English' : 'Русский'}`;
    
    try {
      const res = await generateVisionDescription(prompt, img, apiKey);
      speak(res, () => {
        setActiveState('listening');
        try { recognitionRef.current.start(); } catch(e){}
      });
    } catch (e) {
      speak("Ошибка");
      setActiveState('listening');
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn"><ArrowLeft /></button>
        <div style={{ width: '80px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--accent)', background: 'black' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div 
        onClick={() => {
          if (activeState === 'listening') {
             recognitionRef.current.stop();
             setActiveState('danger');
             speak(language === 'en' ? "Emergency" : "Опасность", () => setActiveState('listening'));
          }
        }}
        className="glass-panel" 
        style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '2rem', background: activeState === 'describing' ? 'var(--primary)' : activeState === 'danger' ? 'var(--danger)' : 'var(--bg-card)' }}
      >
        {activeState === 'describing' ? <Loader2 size={80} className="animate-spin" /> : <Mic size={80} color="var(--primary)" />}
        <h2 style={{ fontSize: '2rem', marginTop: '2rem' }}>
          {activeState === 'listening' ? (language === 'en' ? "Listening..." : "Слушаю...") : "..."}
        </h2>
      </div>
    </div>
  );
};

export default VisionMode;
