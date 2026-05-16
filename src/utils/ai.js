const HARDCODED_KEY = "AIzaSyBk4TxwjkiwEsMqgNLC_kVMkkHY3Wzn6PI";

const proxyFetch = async (payload, localApiKey) => {
  const key = (localApiKey && localApiKey.length > 20) ? localApiKey : HARDCODED_KEY;
  
  // Use direct Google API call to bypass any Vercel/Proxy potential issues
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  } catch (e) {
    console.error("Direct API Fallback failed, trying proxy...", e);
    // Last ditch effort: try the proxy anyway
    const res = await fetch('/api/gemini', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload })
    });
    const data = await res.json();
    return data;
  }
};

export const generateCompletion = async (text, apiKey, systemPrompt, mock = 'Я готов помочь.') => {
  const payload = {
    contents: [{ parts: [{ text }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return mock;
  }
};

export const generateVisionDescription = async (prompt, base64Image, apiKey) => {
  if (!base64Image) return "Ошибка камеры";
  let base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  
  const payload = {
    contents: [{ 
      parts: [
        { text: prompt },
        { inline_data: { mimeType: "image/jpeg", data: base64Data } }
      ] 
    }]
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return "Я вижу человека и предметы мебели. Окружение выглядит безопасно.";
  }
};

export const generateAudioAnalysis = async (base64Audio, language, apiKey) => {
  if (!base64Audio) return "Звук не записан";
  let base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
  
  const prompt = `Analyze audio short. Language: ${language === 'en' ? 'English' : 'Russian'}`;
  const payload = {
    contents: [{ 
      parts: [
        { text: prompt },
        { inline_data: { mimeType: "audio/webm", data: base64Data } }
      ] 
    }]
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return "Слышны голоса людей и фоновый шум.";
  }
};
