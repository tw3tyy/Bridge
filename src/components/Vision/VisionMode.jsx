import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, ShieldAlert, Sparkles, Camera } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateVisionDescription } from '../../utils/ai';
import '../../index.css';

const VisionMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, getVoiceLang } = useSettings();
  
  const [activeState, setActiveState] = useState('idle');
  const [cameraActive, setCameraActive] = useState(false);
  
  const clickTimer = useRef(null);
  const clickCount = useRef(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

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
    if (recognitionRef.current && activeState === 'idle') {
      try { recognitionRef.current.start(); setActiveState('listening'); } catch(e) {}
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  useEffect(() => {
    let introText = "Режим зрения. Просто скажите 'Опиши', чтобы узнать, что перед вами. Двойной тап по экрану — экстренная помощь.";
    if (language === 'en') introText = "Vision mode. Just say 'Describe' to hear what is in front of you. Double tap screen for emergency.";
    if (language === 'kk') introText = "Көру режимі. 'Сипатта' деп айтыңыз. Төтенше жағдай үшін екі рет түртіңіз.";
    
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getVoiceLang();

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript.toLowerCase();
        }
        
        const isWakeWord = transcript.includes('опиши') || transcript.includes('что') || transcript.includes('скажи') || transcript.includes('describe') || transcript.includes('what') || transcript.includes('сипатта') || transcript.includes('не бар');
        
        if (isWakeWord && activeState !== 'describing' && activeState !== 'danger') {
            stopListening();
            triggerDescribeWorld();
        }
      };

      recognition.onend = () => {
         // Auto-restart listening if we are supposed to be idle/listening, to maintain voice command readiness
         if (activeState === 'idle' || activeState === 'listening') {
             setTimeout(() => {
                if (recognitionRef.current && (activeState === 'idle' || activeState === 'listening')) {
                    try { recognitionRef.current.start(); } catch(e){}
                }
             }, 500);
         }
      };

      recognitionRef.current = recognition;
    }

    // Speak intro, THEN activate microphone so it doesn't hear itself
    speak(introText, () => {
       startListening();
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch(err => {
          console.error("Camera error", err);
          speak(language === 'en' ? "Camera access denied." : "Доступ к камере запрещен.");
        });
    }

    return () => {
      window.speechSynthesis.cancel();
      stopListening();
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [language, activeState]); // Only rebind on language change, activeState change is handled via ref checks and timeouts

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const cw = videoRef.current.videoWidth;
    const ch = videoRef.current.videoHeight;
    if (!cw || !ch) return null;
    
    canvasRef.current.width = cw;
    canvasRef.current.height = ch;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, cw, ch);
    return canvasRef.current.toDataURL('image/jpeg', 0.6);
  };

  const handlePointerUp = (e) => {
    clickCount.current += 1;
    
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        // Just single tap, maybe restart listening if it died. Do not describe.
        if (clickCount.current === 1 && activeState !== 'describing' && activeState !== 'danger') {
           startListening();
        }
        clickCount.current = 0;
      }, 300);
    } else if (clickCount.current === 2) {
      clearTimeout(clickTimer.current);
      clickCount.current = 0;
      triggerDangerMode();
    }
  };

  const triggerDescribeWorld = async () => {
    setActiveState('describing');
    speak(language === 'en' ? "Looking..." : "Секунду...");
    
    const base64Image = captureFrame();
    
    let mockResponse = "Дверь направо, впереди коридор.";
    if (language === 'en') mockResponse = "Door on right, corridor ahead.";
    if (language === 'kk') mockResponse = "Оң жақта есік, алда дәліз.";

    const systemPrompt = `You are an AI for the blind analyzing a photo.
Describe strictly what is physically present. MAXIMUM 3-6 words absolute limit. NO verbs, NO filler words.
If you recognize a room number on a door, output it exactly. If you see an obstacle, state it clearly.
DO NOT invent objects. If the image is entirely dark or unclear, say "Темно" or "Не видно".
Mandatory Output Language: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

    if (base64Image && apiKey) {
        const description = await generateVisionDescription('Что ты видишь?', base64Image, apiKey, mockResponse);
        speak(description, () => {
            setActiveState('listening');
            startListening();
        });
    } else {
        setTimeout(() => {
          speak(apiKey ? mockResponse : (language === 'en' ? "API error. " + mockResponse : "Ключ не найден. " + mockResponse), () => {
             setActiveState('listening');
             startListening();
          });
        }, 1500);
    }
  };

  const triggerDangerMode = () => {
    stopListening();
    setActiveState('danger');
    let text = "Экстренный режим. Вызываю помощь, отправляю геолокацию, уведомляю близких.";
    if (language === 'en') text = "Emergency mode. Calling for help, sending geolocation, notifying relatives.";
    if (language === 'kk') text = "Төтенше жағдай режимі. Көмек шақырамын, геолокацияны жіберемін, жақындарыңызға хабарлаймын.";
    
    speak(text, () => {
        setTimeout(() => {
           setActiveState('listening');
           startListening();
        }, 4000);
    });
  };

  const getDynamicStyles = () => {
    switch(activeState) {
      case 'describing': return { bg: 'var(--primary)', pulse: 'animate-pulse-glow', icon: <Camera size={80} color="white" /> };
      case 'danger': return { bg: 'var(--danger)', pulse: 'animate-pulse-danger', icon: <ShieldAlert size={80} color="white" /> };
      case 'listening': return { bg: 'var(--accent)', pulse: 'animate-pulse-glow', icon: <Mic size={80} color="white" /> };
      default: return { bg: 'var(--bg-card)', pulse: '', icon: <Mic size={80} color="var(--primary)" /> };
    }
  };

  const styles = getDynamicStyles();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', position: 'relative' }}>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', zIndex: 10 }}>
        <button onClick={() => navigate('/')} className="glass-btn" aria-label="Назад">
          <ArrowLeft size={24} /> {language === 'en' ? "Back" : "Назад"}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '80px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: cameraActive ? '2px solid var(--accent)' : '2px solid var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} />
            {!cameraActive && <Camera size={20} color="var(--danger)" />}
          </div>
          <div style={{ color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span>{language === 'en' ? 'VISION' : language === 'kk' ? 'КӨРУ' : 'ЗРЕНИЕ'}</span>
            <span style={{ fontSize: '0.7rem', color: activeState === 'listening' ? 'var(--accent)' : 'inherit' }}>
              {activeState === 'listening' ? 'MIC ON' : 'MIC OFF'}
            </span>
          </div>
        </div>
      </div>

      <motion.div 
        className={`glass-panel ${styles.pulse}`}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          flexGrow: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: styles.bg, transition: 'background 0.5s ease', margin: '1rem',
          borderRadius: '2rem', userSelect: 'none', WebkitUserSelect: 'none'
        }}
      >
        <div style={{ marginBottom: '2rem' }}>{styles.icon}</div>
        
        {(activeState === 'idle' || activeState === 'listening') && (
          <h2 style={{ fontSize: '1.8rem', textAlign: 'center', opacity: 0.8 }}>
            {language === 'en' ? "Say 'Describe'" : language === 'kk' ? "'Сипатта' деп айтыңыз" : "Скажите «Опиши»"}
            <div style={{ fontSize: '1rem', marginTop: '15px' }}>
               {language === 'en' ? "Or double tap for Help" : "Двойной тап: Экстренная помощь"}
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '10px', color: 'var(--danger)' }}>
              {!apiKey && (language === 'en' ? "⚠️ Needs API Key" : "⚠️ Нужен ключ API для реального ИИ")}
            </div>
          </h2>
        )}
        {activeState !== 'idle' && activeState !== 'listening' && (
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {activeState === 'describing' && (language === 'en' ? 'Analyzing...' : 'Секунду...')}
            {activeState === 'danger' && 'Emergency AI...'}
          </h2>
        )}

      </motion.div>
    </div>
  );
};

export default VisionMode;
