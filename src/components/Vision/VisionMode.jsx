import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, ShieldAlert, Camera, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateVisionDescription } from '../../utils/ai';
import '../../index.css';

const VisionMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, getVoiceLang } = useSettings();
  
  const [activeState, setActiveState] = useState('idle'); // idle, listening, describing, danger
  const [cameraActive, setCameraActive] = useState(false);
  
  const clickTimer = useRef(null);
  const clickCount = useRef(0);
  const hasSpokenIntroRef = useRef(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  const speak = (text, onEndCallback) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = getVoiceLang();
      if (onEndCallback) msg.onend = onEndCallback;
      window.speechSynthesis.speak(msg);
    }
  };

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

  // 1. Camera Initialization (Once on mount)
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
  }, []); // Empty dependency array = run only once on mount

  // 2. Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results to avoid jitter
    recognition.lang = getVoiceLang();

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      if (transcript.length > 2 && activeState !== 'describing' && activeState !== 'danger') {
        stopListening();
        triggerDescribeWorld(transcript);
      }
    };

    recognition.onend = () => {
       // Auto-restart if we are still in listening state
       if (activeState === 'listening') {
         setTimeout(() => {
            try { recognition.start(); } catch(e){}
         }, 300);
       }
    };

    recognitionRef.current = recognition;

    // Speak intro only once
    if (!hasSpokenIntroRef.current) {
      hasSpokenIntroRef.current = true;
      let introText = "Режим зрения. Просто скажите любой вопрос, например 'Что передо мной?', и я отвечу. Двойной тап — экстренная помощь.";
      if (language === 'en') introText = "Vision mode. Ask any question like 'What is in front of me?', and I will answer. Double tap for emergency.";
      if (language === 'kk') introText = "Көру режимі. 'Алдымда не бар?' сияқты кез келген сұрақ қойыңыз. Төтенше жағдай үшін екі рет түртіңіз.";
      
      setTimeout(() => {
        speak(introText, () => {
          setActiveState('listening');
          startListening();
        });
      }, 500);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [language]); // Only restart if language changes

  // 3. React to state changes (Restart mic after describing)
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

    const systemPrompt = `You are a helpful and empathetic AI assistant for the blind.
The user just asked you: "${userCommand}"
Answer the question based EXACTLY on what you see in the photo.
Keep it concise (1-2 sentences). 
Language: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

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
    let text = "Экстренный режим. Вызываю помощь, отправляю геолокацию.";
    if (language === 'en') text = "Emergency mode. Calling for help, sending geolocation.";
    if (language === 'kk') text = "Төтенше жағдай режимі. Көмек шақырамын, геолокацияны жіберемін.";
    
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.5rem 1.2rem' }}>
          <ArrowLeft size={24} /> {language === 'en' ? "Back" : "Назад"}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100px', height: '70px', borderRadius: '12px', overflow: 'hidden', border: cameraActive ? '2px solid var(--accent)' : '2px solid var(--danger)', background: 'black', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
            <video ref={videoRef} playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} />
            {!cameraActive && <Camera size={20} color="var(--danger)" style={{ margin: 'auto' }} />}
          </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <motion.div 
        className={`glass-panel ${styles.pulse}`}
        onPointerUp={handlePointerUp}
        style={{ 
          flexGrow: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: styles.bg, transition: 'background 0.5s ease, transform 0.2s ease', margin: '1rem',
          borderRadius: '2.5rem', userSelect: 'none', WebkitUserSelect: 'none',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ marginBottom: '2.5rem' }}>{styles.icon}</div>
        
        {(activeState === 'idle' || activeState === 'listening') && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>
              {language === 'en' ? "I'm listening..." : language === 'kk' ? "Мен тыңдап тұрмын..." : "Я слушаю..."}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '300px' }}>
              {language === 'en' ? "Ask about your surroundings" : language === 'kk' ? "Айналаңыз туралы сұраңыз" : "Спросите о том, что перед вами"}
            </p>
          </div>
        )}

        {activeState === 'describing' && (
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'white' }}>
            {language === 'en' ? 'Thinking...' : 'Думаю...'}
          </h2>
        )}

        {activeState === 'danger' && (
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'white' }}>
            EMERGENCY
          </h2>
        )}
      </motion.div>

      {/* Mode Indicator Overlay */}
       <div style={{ position: 'absolute', bottom: '2.5rem', left: '0', right: '0', textAlign: 'center', pointerEvents: 'none', opacity: 0.5 }}>
          <span style={{ fontSize: '0.8rem', letterSpacing: '3px', color: 'var(--text-muted)' }}>
             VISION CONTEXT ACTIVE
          </span>
       </div>
    </div>
  );
};

export default VisionMode;
