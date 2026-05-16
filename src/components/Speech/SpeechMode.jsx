import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Volume2, Key, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { generateCompletion } from '../../utils/ai';
import '../../index.css';

const SpeechMode = () => {
  const navigate = useNavigate();
  const { apiKey, language, getVoiceLang } = useSettings();
  
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

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = getVoiceLang();
      window.speechSynthesis.speak(msg);
    }
  };

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
        alert("Speech Recognition not supported in this browser.");
      }
    }
  };

  const processTranscript = async (text) => {
    setIsProcessing(true);
    
    const systemPrompt = `You are a speech enhancement AI. 
The user has severe dysarthria or speech defect. Their messy transcript is: "${text}"
Your task: Correct the mispronounced words. Guess what they were trying to say.
Provide exactly 3 likely variations of their actual phrase. 
DO NOT turn it into a long sentence if they said 1 word. DO NOT add "Please" or make it polite if they didn't imply it. Just fix the broken phonetics.
MANDATORY: Return AS RAW JSON ARRAY of 3 strings. No markdown. Example: ["Word 1", "Word 2", "Word 3"]
Language must be: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

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
        console.error("Failed to parse Gemini output:", cleanJson);
        setOptions([cleanJson.substring(0, 100) + "..."]);
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
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>
            {language === 'en' ? 'SPEECH' : language === 'kk' ? 'СӨЙЛЕУ' : 'РЕЧЬ'}
          </h2>
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2rem', justifyContent: 'center', alignItems: 'center' }}>
        


        <div style={{ padding: '0.8rem 1.5rem', background: 'var(--bg-card)', borderRadius: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <Info size={18} />
          {language === 'en' ? "Tap the microphone to start/stop speaking." : "Нажмите на микрофон один раз, скажите фразу, и нажмите еще раз."}
        </div>

        {/* Microphone Button (Toggle instead of Hold) */}
        <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={`glass-panel ${isListening ? 'animate-pulse-glow' : ''}`}
            style={{
               width: '150px', height: '150px', borderRadius: '50%',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               background: isListening ? 'var(--secondary)' : 'var(--bg-card)',
               cursor: 'pointer', transition: 'all 0.3s ease',
               border: `2px solid ${isListening ? 'var(--secondary-glow)' : 'var(--glass-border)'}`
            }}
        >
           {isListening ? <div style={{width: '40px', height: '40px', background: 'white', borderRadius: '8px'}} /> : <Mic size={64} color="white" />}
        </motion.div>

        <p style={{ color: 'var(--text-main)', textAlign: 'center', fontSize: '1.3rem', fontWeight: 'bold' }}>
           {isListening ? (language === 'en' ? "Listening... (Tap to finish)" : "Слушаю... (Нажмите, чтобы завершить)") : 
                          (language === 'en' ? "Tap to speak" : "Нажмите, чтобы сказать")}
        </p>

        {transcript && (
          <div style={{ width: '100%', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '1rem', border: '1px solid var(--glass-border)', textAlign: 'center', fontSize: '1.2rem' }}>
             "{transcript}"
          </div>
        )}

        {isProcessing && (
           <div style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '1.2rem' }} className="animate-pulse-glow">
             {language === 'en' ? "AI is generating options..." : "ИИ подбирает варианты..."}
           </div>
        )}

        <AnimatePresence>
          {options.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                 {language === 'en' ? "Did you mean:" : language === 'kk' ? "Мүмкін сіздің айтқыңыз келгені:" : "Возможно вы имели в виду:"}
               </h3>
               {options.map((opt, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => speak(opt)}
                    className="glass-btn"
                    style={{ justifyContent: 'flex-start', padding: '1.5rem', background: 'var(--bg-card-hover)', borderLeft: '4px solid var(--secondary)' }}
                  >
                     <Volume2 size={24} color="var(--secondary)" style={{ minWidth: '24px', marginRight: '15px' }} />
                     <span style={{ fontSize: '1.2rem', textAlign: 'left', lineHeight: '1.4' }}>{opt}</span>
                  </motion.button>
               ))}
               
               <button onClick={() => { setTranscript(''); setOptions([]); }} style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {language === 'en' ? "Clear options" : "Очистить и попробовать снова"}
               </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SpeechMode;
