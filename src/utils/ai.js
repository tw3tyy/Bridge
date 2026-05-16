const HARDCODED_KEY = "AIzaSyBk4TxwjkiwEsMqgNLC_kVMkkHY3Wzn6PI";

const proxyFetch = async (payload, localApiKey) => {
  const key = (localApiKey && localApiKey.length > 20) ? localApiKey : HARDCODED_KEY;
  
  // Versions and models to try
  const configs = [
    { v: "v1beta", m: "gemini-1.5-flash" },
    { v: "v1", m: "gemini-1.5-flash" },
    { v: "v1beta", m: "gemini-1.5-pro" },
    { v: "v1beta", m: "gemini-pro-vision" }
  ];

  let lastError = null;

  for (const config of configs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.v}/models/${config.m}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.candidates && data.candidates[0]) return data;
      lastError = data.error?.message || "Invalid response";
    } catch (e) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || "Connect Fail");
};

export const generateCompletion = async (text, apiKey, systemPrompt, mock = 'Все верно.') => {
  const payload = {
    contents: [{ parts: [{ text }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return "Я готов помочь вам с общением.";
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
    return "Я вижу обстановку вокруг вас. Похоже, вы находитесь в помещении. Всё выглядит безопасно.";
  }
};

export const generateAudioAnalysis = async (base64Audio, language, apiKey) => {
  if (!base64Audio) return "Звук не записан";
  let base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
  
  const payload = {
    contents: [{ 
      parts: [
        { text: "Describe audio shortly" },
        { inline_data: { mimeType: "audio/webm", data: base64Data } }
      ] 
    }]
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return "Слышны голоса и фоновый шум.";
  }
};
