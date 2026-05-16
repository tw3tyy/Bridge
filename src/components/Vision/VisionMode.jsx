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
  
  const clickTimer = useRef(null);
  const clickCount = useRef(0);
  const hasSpokenIntroRef = useRef(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  const startListening = () => {
    if (recognitionRef.current && (activeState === 'idle' || activeState === 'listening')) {
      try { 
        recognitionRef.current.start(); 
        setActiveState('listening');
      } catch(e) {
        console.warn("Recognition start error", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  // 1. Camera Initialization
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Camera error", err);
        speak(language === 'en' ? "Camera access denied." : "Доступ к камере запрещен.");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'kk-KZ';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript.length > 2 && activeState !== 'describing' && activeState !== 'danger') {
        stopListening();
        triggerDescribeWorld(transcript);
      }
    };

    recognition.onend = () => {
       if (activeState === 'listening') {
         setTimeout(() => {
            try { recognition.start(); } catch(e){}
         }, 300);
       }
    };

    recognitionRef.current = recognition;

    if (!hasSpokenIntroRef.current) {
      hasSpokenIntroRef.current = true;
      let introText = "Режим зрения. Просто скажите любой вопрос, и я отвечу.";
      if (language === 'en') introText = "Vision mode. Ask any question, and I will answer.";
      if (language === 'kk') introText = "Көру режимі. Сұрақ қойыңыз, мен жауап беремін.";
      
      setTimeout(() => {
        speak(introText, () => {
          setActiveState('listening');
        });
      }, 500);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [language]);

  // 3. React to state changes
  useEffect(() => {
    if (activeState === 'listening') {
      startListening();
    } else if (activeState !== 'listening') {
      stopListening();
    }
  }, [activeState]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const cw = videoRef.current.videoWidth;
    const ch = videoRef.current.videoHeight;
    if (!cw || !ch) return null;
    
    canvasRef.current.width = cw;
    canvasRef.current.height = ch;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, cw, ch);
    return canvasRef.current.toDataURL('image/jpeg', 0.7);
  };

  const handlePointerUp = (e) => {
    clickCount.current += 1;
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        if (clickCount.current === 1 && activeState === 'idle') {
           setActiveState('listening');
        }
        clickCount.current = 0;
      }, 300);
    } else if (clickCount.current === 2) {
      clearTimeout(clickTimer.current);
      clickCount.current = 0;
      triggerDangerMode();
    }
  };

  const triggerDescribeWorld = async (userCommand) => {
    setActiveState('describing');
    speak(language === 'en' ? "Analyzing..." : "Анализирую...");
    
    const base64Image = captureFrame();
    if (!base64Image) {
      speak(language === 'en' ? "Camera error" : "Ошибка камеры");
      setActiveState('listening');
      return;
    }

    const systemPrompt = `You are an AI for the blind. 
The user asked: "${userCommand}"
MANDATORY: Answer the question in EXACTLY 1 concise sentence. NO more words.
MANDATORY LANGUAGE: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

    try {
      const description = await generateVisionDescription(systemPrompt, base64Image, apiKey);
      speak(description, () => {
        setActiveState('listening');
      });
    } catch (error) {
      console.error(error);
      speak(language === 'en' ? "Connection error." : "Ошибка связи.", () => {
        setActiveState('listening');
      });
    }
  };

  const triggerDangerMode = () => {
    setActiveState('danger');
    let text = "Экстренный режим. Помощь скоро будет.";
    if (language === 'en') text = "Emergency mode. Help is on the way.";
    if (language === 'kk') text = "Төтенше жағдай режимі. Көмек келе жатыр.";
    
    speak(text, () => {
        setTimeout(() => {
           setActiveState('listening');
        }, 5000);
    });
  };

  const getDynamicStyles = () => {
    switch(activeState) {
      case 'describing': return { bg: 'var(--primary)', pulse: 'animate-pulse-glow', icon: <Loader2 size={80} color="white" className="animate-spin" /> };
      case 'danger': return { bg: 'var(--danger)', pulse: 'animate-pulse-danger', icon: <ShieldAlert size={80} color="white" /> };
      case 'listening': return { bg: 'var(--bg-card)', pulse: 'animate-pulse-glow', icon: <Mic size={80} color="var(--primary)" /> };
      default: return { bg: 'var(--bg-card)', pulse: '', icon: <Mic size={80} color="var(--primary)" /> };
    }
  };

  const styles = getDynamicStyles();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.5rem 1.2rem' }}>
          <ArrowLeft size={24} /> {language === 'en' ? "Back" : "Назад"}
        </button>
        <div style={{ width: '100px', height: '70px', borderRadius: '12px', overflow: 'hidden', border: cameraActive ? '2px solid var(--accent)' : '2px solid var(--danger)', background: 'black' }}>
          <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} />
          {!cameraActive && <Camera size={20} color="var(--danger)" style={{ margin: 'auto' }} />}
        </div>
      </div>

      <motion.div 
        className={`glass-panel ${styles.pulse}`}
        onPointerUp={handlePointerUp}
        style={{ 
          flexGrow: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: styles.bg, borderRadius: '2.5rem', margin: '1rem'
        }}
      >
        <div style={{ marginBottom: '2.5rem' }}>{styles.icon}</div>
        
        {(activeState === 'idle' || activeState === 'listening') && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>
              {language === 'en' ? "I'm listening..." : language === 'kk' ? "Мен тыңдап тұрмын..." : "Я слушаю..."}
            </h2>
          </div>
        )}

        {activeState === 'describing' && (
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'white' }}>
            {language === 'en' ? 'Thinking...' : 'Думаю...'}
          </h2>
        )}
      </motion.div>
    </div>
  );
};

export default VisionMode;
