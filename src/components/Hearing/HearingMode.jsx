import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Ear, Zap, Activity, Info, Key } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateAudioAnalysis } from '../../utils/ai';
import '../../index.css';

const HearingMode = () => {
  const navigate = useNavigate();
  const { language, apiKey } = useSettings();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [events, setEvents] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const addEvent = (text, severity = 'medium', type = 'environment') => {
    const freshEvent = { id: Date.now(), type, severity, text };
    setEvents(prev => [freshEvent, ...prev]);
    // Auto clear after 10s
    setTimeout(() => {
      setEvents(current => current.filter(e => e.id !== freshEvent.id));
    }, 10000);
  };

  const startAnalysisCycle = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
       addEvent("Microphone not supported on this browser.", "critical");
       return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsAnalyzing(true);
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
           const base64data = reader.result;
           
           let mockText = language === 'en' ? 'Mock: A person is speaking calmly.' : language === 'kk' ? 'Mock: Адам сабырлы сөйлеп тұр.' : 'Дема: Человек говорит спокойно.';
           
           if (apiKey) {
              try {
                const analysisText = await generateAudioAnalysis(base64data, 'audio/webm', language, apiKey, mockText);
                addEvent(analysisText, 'high');
              } catch (e) {
                addEvent("AI Error: " + e.message, 'critical');
              }
           } else {
              // Mock fallback if no API key
              addEvent(mockText, 'high');
           }
           setIsAnalyzing(false);
        };
      };

      // Record for 4 seconds
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      setTimeout(() => {
         if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
         }
      }, 4000);

    } catch (err) {
       addEvent("Microphone permission denied.", "critical");
       setIsRecording(false);
    }
  };

  const getEventStyles = (severity) => {
    switch(severity) {
      case 'critical': return { bg: 'rgba(239, 68, 68, 0.15)', border: 'var(--danger)', icon: <Info color="var(--danger)" /> };
      case 'high': return { bg: 'rgba(236, 72, 153, 0.15)', border: 'var(--secondary)', icon: <Zap color="var(--secondary)" /> };
      default: return { bg: 'rgba(20, 184, 166, 0.15)', border: 'var(--accent)', icon: <Activity color="var(--accent)" /> };
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn">
          <ArrowLeft size={24} /> {language === 'en' ? 'Back' : 'Назад'}
        </button>
        <div style={{ textAlign: 'right' }}>
           <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>
             {language === 'en' ? 'HEARING' : language === 'kk' ? 'ЕСТУ' : 'СЛУХ'}
           </h2>
           <div style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>Real-time Analysis</div>
        </div>
      </div>

      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        {!apiKey && (
           <div style={{ position: 'absolute', top: 0, padding: '0.8rem 1.5rem', background: 'rgba(20,184,166,0.1)', border: '1px solid var(--accent)', borderRadius: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 20 }}>
              <Key size={18} color="var(--accent)" /> 
              {language === 'en' ? "Using Mock API Options" : "Демо-режим (нужен API ключ)"}
           </div>
        )}

        {/* Start Button */}
        <div 
          onClick={() => { if (!isRecording && !isAnalyzing) startAnalysisCycle(); }}
          className={`glass-panel ${isRecording ? 'animate-pulse-glow' : ''}`}
          style={{ 
            width: '140px', height: '140px', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: (isRecording || isAnalyzing) ? 'default' : 'pointer', 
            zIndex: 10, 
            background: isRecording ? 'var(--accent)' : 'var(--bg-card)',
            border: `2px solid ${isRecording ? 'var(--accent-glow)' : 'var(--glass-border)'}`
          }}
        >
          {isRecording ? <Mic size={56} color="white" /> : 
           isAnalyzing ? <Activity size={56} color="var(--accent)" className="animate-pulse-glow" /> : 
           <Ear size={56} color="var(--accent)" />}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
           {isRecording ? (language === 'en' ? "Recording environment 4s..." : "Слушаю окружение (4с)...") :
            isAnalyzing ? (language === 'en' ? "AI is analyzing audio..." : "ИИ анализирует звук...") :
            (language === 'en' ? "Tap to listen & analyze environment" : "Нажмите, чтобы проанализировать звуки вокруг")}
        </p>

        {/* Display Analysis Results */}
        <div style={{ width: '100%', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {events.map((evt) => {
              const style = getEventStyles(evt.severity);
              return (
                <motion.div
                  key={evt.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem', width: '100%',
                    borderLeft: `5px solid ${style.border}`, background: style.bg,
                    display: 'flex', alignItems: 'center', gap: '1rem'
                  }}
                >
                  <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '12px' }}>
                    {style.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
                      {language === 'en' ? 'AI Environment Alert' : language === 'kk' ? 'ИИ Айнала туралы ескерту' : 'ИИ Контекст Окружения'}
                    </h3>
                    <p style={{ fontSize: '1.2rem', color: 'white', margin: 0 }}>{evt.text}</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default HearingMode;
