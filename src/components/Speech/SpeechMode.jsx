import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Volume2, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateCompletion } from '../../utils/ai';
import '../../index.css';

const SpeechMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, getVoiceLang, speak } = useSettings();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [options, setOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getVoiceLang();

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, getVoiceLang]);

  useEffect(() => {
     if (!isListening && transcript.trim().length > 0 && !isProcessing && options.length === 0) {
        processTranscript(transcript);
     }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setOptions([]);
      if (recognitionRef.current) {
        try {
           recognitionRef.current.start();
        } catch (e) {
           console.warn(e);
        }
      } else {
        alert("Speech Recognition not supported.");
      }
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    
    const systemPrompt = `You are a speech enhancement AI. 
The user has a speech defect. Their messy transcript is: "${text}"
Your task: Correct the words. Guess what they were trying to say.
Provide EXACTLY 3 short Likely variations. 
MANDATORY: Return AS RAW JSON ARRAY of 3 strings. 
Example: ["Word 1", "Word 2", "Word 3"]
Language: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

    let mockResponse = '["Мне нужна вода", "Мне нужна помощь", "Мне плохо"]';
    if (language === 'en') {
       mockResponse = '["Can I have some water?", "I need help.", "Sorry, I missed that."]';
    } else if (language === 'kk') {
       mockResponse = '["Маған су бере аласыз ба?", "Маған көмек керек.", "Кешіріңіз, түсінбедім."]';
    }

    try {
      const rawRes = await generateCompletion(text, apiKey, systemPrompt, mockResponse);
      let cleanJson = rawRes.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      try {
        const parsedOptions = JSON.parse(cleanJson);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
           setOptions(parsedOptions);
        } else {
           throw new Error("Parsed JSON is not an array");
        }
      } catch (parseError) {
        console.error("Failed to parse", cleanJson);
        setOptions([cleanJson.substring(0, 100)]);
      }
    } catch (e) {
      console.error(e);
      setOptions([text]);
    }

    setIsProcessing(false);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.6rem 1.2rem' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>
          {language === 'en' ? 'SPEECH' : language === 'kk' ? 'СӨЙЛЕУ' : 'РЕЧЬ'}
        </h2>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem', justifyContent: 'center', alignItems: 'center' }}>
        
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-card)', borderRadius: '1.2rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <Info size={20} />
          <span>{language === 'en' ? "Tap to record your speech" : "Нажмите один раз и скажите фразу"}</span>
        </div>

        <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`glass-panel ${isListening ? 'animate-pulse-glow' : ''}`}
            style={{
               width: '180px', height: '180px', borderRadius: '50%',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               background: isListening ? 'var(--secondary)' : 'var(--bg-card)',
               cursor: 'pointer', transition: 'all 0.3s ease',
               border: `3px solid ${isListening ? 'white' : 'var(--glass-border)'}`
            }}
        >
           {isListening ? <div style={{width: '60px', height: '60px', background: 'white', borderRadius: '15px'}} /> : <Mic size={80} color="white" />}
        </motion.div>

        <p style={{ color: 'var(--text-main)', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
           {isListening ? (language === 'en' ? "Stop recording" : "Остановить") : 
                          (language === 'en' ? "Start speaking" : "Начать говорить")}
        </p>

        {transcript && (
          <div style={{ width: '100%', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '1.5rem', border: '1px solid var(--glass-border)', textAlign: 'center', fontSize: '1.3rem', fontStyle: 'italic' }}>
             "{transcript}"
          </div>
        )}

        {isProcessing && (
           <div style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '1.2rem' }} className="animate-pulse-glow">
             {language === 'en' ? "AI is thinking..." : "ИИ думает..."}
           </div>
        )}

        <AnimatePresence>
          {options.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
               <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem' }}>
                 {language === 'en' ? "Did you mean:" : language === 'kk' ? "Мүмкін сіздің айтқыңыз келгені:" : "Возможно вы имели в виду:"}
               </h3>
               {options.map((opt, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => speak(opt)}
                    className="glass-btn"
                    style={{ justifyContent: 'flex-start', padding: '1.8rem', background: 'var(--bg-card-hover)', borderLeft: '6px solid var(--secondary)', borderRadius: '1.5rem' }}
                  >
                     <Volume2 size={26} color="var(--secondary)" style={{ minWidth: '26px', marginRight: '20px' }} />
                     <span style={{ fontSize: '1.4rem', textAlign: 'left', fontWeight: 'bold' }}>{opt}</span>
                  </motion.button>
               ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SpeechMode;
