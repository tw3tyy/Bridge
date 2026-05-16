import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Ear, Zap, Activity, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateAudioAnalysis } from '../../utils/ai';
import '../../index.css';

const HearingMode = () => {
  const navigate = useNavigate();
  const { language, apiKey, speak } = useSettings();
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
       addEvent("Microphone not supported.", "critical");
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
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64data = reader.result;
            try {
               const analysisText = await generateAudioAnalysis(base64data, language, apiKey);
               addEvent(analysisText, 'high');
               speak(analysisText);
            } catch (e) {
               addEvent("Error: " + e.message, 'critical');
            }
            setIsAnalyzing(false);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      setTimeout(() => {
         if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
         }
      }, 4000);

    } catch (err) {
       addEvent("Permission denied.", "critical");
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
        <div>
           <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>
             {language === 'en' ? 'HEARING' : language === 'kk' ? 'ЕСТУ' : 'СЛУХ'}
           </h2>
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        <div 
          onClick={() => { if (!isRecording && !isAnalyzing) startAnalysisCycle(); }}
          className={`glass-panel ${isRecording ? 'animate-pulse-glow' : ''}`}
          style={{ 
            width: '160px', height: '160px', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: (isRecording || isAnalyzing) ? 'default' : 'pointer', 
            background: isRecording ? 'var(--accent)' : 'var(--bg-card)',
            border: `2px solid ${isRecording ? 'var(--accent-glow)' : 'var(--glass-border)'}`
          }}
        >
          {isRecording ? <Mic size={64} color="white" /> : 
           isAnalyzing ? <Activity size={64} color="var(--accent)" className="animate-pulse-glow" /> : 
           <Ear size={64} color="var(--accent)" />}
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '1.3rem', color: 'var(--text-main)', textAlign: 'center' }}>
           {isRecording ? (language === 'en' ? "Listening..." : "Слушаю...") :
            isAnalyzing ? (language === 'en' ? "Analyzing..." : "Анализирую...") :
            (language === 'en' ? "Tap to analyze environment" : "Нажмите для анализа звуков")}
        </p>

        <div style={{ width: '100%', marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {events.map((evt) => {
              const style = getEventStyles(evt.severity);
              return (
                <motion.div
                  key={evt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem', width: '100%',
                    borderLeft: `6px solid ${style.border}`, background: style.bg,
                    display: 'flex', alignItems: 'center', gap: '1.5rem'
                  }}
                >
                  <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '15px' }}>
                    {style.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '1.3rem', color: 'white', margin: 0, fontWeight: 600 }}>{evt.text}</p>
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
