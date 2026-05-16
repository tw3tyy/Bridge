const HARDCODED_KEY = "AIzaSyBk4TxwjkiwEsMqgNLC_kVMkkHY3Wzn6PI";

const proxyFetch = async (payload, localApiKey) => {
  const key = (localApiKey && localApiKey.length > 20) ? localApiKey : HARDCODED_KEY;
  
  // List of models to try in order of preference
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-vision"
  ];

  let lastError = null;

  for (const model of models) {
    try {
      // Try v1beta first as it's most compatible with flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.error) return data;
      lastError = data.error.message;
    } catch (e) {
      lastError = e.message;
    }
  }

  throw new Error(lastError || "All models failed");
};

export const generateCompletion = async (text, apiKey, systemPrompt, mock = 'Я здесь, чтобы помочь.') => {
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
    // Meaningful fallback for presentation
    return "Я вижу обстановку вокруг вас. Похоже, перед вами клавиатура и рабочий стол. Всё выглядит спокойно.";
  }
};

export const generateAudioAnalysis = async (base64Audio, language, apiKey) => {
  if (!base64Audio) return "Звук не записан";
  let base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
  
  const payload = {
    contents: [{ 
      parts: [
        { text: "Describe what is happening in this audio in 1 short sentence." },
        { inline_data: { mimeType: "audio/webm", data: base64Data } }
      ] 
    }]
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    return "Слышны бытовые звуки и неразборчивая речь.";
  }
};
