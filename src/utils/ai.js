const proxyFetch = async (payload, localApiKey) => {
  if (localApiKey && localApiKey.trim().length > 10) {
    // 1. DANGER MODE: Direct to Google (uses user's browser, exposes key)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localApiKey.trim()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  } else {
    // 2. SECURE MODE: Route through Vercel Serverless Function
    const url = '/api/gemini';
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }
};

export const generateCompletion = async (text, apiKey, systemPrompt, mockResponse = '') => {
  const payload = {
    contents: [{ parts: [{ text }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.5 }
  };

  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.warn("Gemini Failed:", e);
    // If it's a server/network failure and NO key was provided, use mock to avoid crashing local dev
    if (!apiKey && e.message.includes('Failed to fetch')) return mockResponse;
    return `["API Ошибка: ${e.message}"]`;
  }
};

export const generateVisionDescription = async (prompt, base64Image, apiKey, mockResponse = '') => {
  if (!base64Image) return mockResponse; // Safety

  let base64Data = base64Image;
  let mimeType = "image/jpeg";

  if (base64Image.includes(',')) {
     base64Data = base64Image.split(',')[1];
     const match = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
     if (match) mimeType = match[1];
  }

  const payload = {
    contents: [{ 
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ] 
    }],
    generationConfig: { temperature: 0.5 }
  };

  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.warn("Gemini Vision Failed:", e);
    if (!apiKey && e.message.includes('Failed to fetch')) return mockResponse;
    return `API Ошибка: ${e.message}`;
  }
};

export const generateAudioAnalysis = async (base64AudioRaw, language, apiKey, mockResponse = '') => {
  if (!base64AudioRaw) return mockResponse;

  let base64Data = base64AudioRaw;
  let mimeType = "audio/webm";

  if (base64AudioRaw.includes(',')) {
     base64Data = base64AudioRaw.split(',')[1];
     mimeType = base64AudioRaw.substring(base64AudioRaw.indexOf(':') + 1, base64AudioRaw.indexOf(';'));
  }

  const prompt = `Listen to this audio. Act as an environmental awareness tool for a deaf person.
MANDATORY FORMAT: 
If it is a physical sound (music, siren, car honk): "Звук: [what it is]"
If you hear a human speaking, TRANSCRIBE EXACTLY what they said and the emotion. "Речь: [exact words]. Эмоция: [emotion]"
Keep it extremely short. Example: "Звук: громкая музыка", "Речь: 'Привет, как дела?'. Эмоция: радость". 
Mandatory Language: ${language === 'en' ? 'English' : language === 'kk' ? 'Kazakh' : 'Russian'}`;

  const payload = {
    contents: [{ 
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ] 
    }],
    generationConfig: { temperature: 0.5 }
  };

  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.warn("Gemini Audio Failed:", e);
    if (!apiKey && e.message.includes('Failed to fetch')) return mockResponse;
    return `API Ошибка: ${e.message}`;
  }
};
