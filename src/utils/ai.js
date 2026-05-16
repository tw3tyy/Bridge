const proxyFetch = async (payload, localApiKey) => {
  if (localApiKey && localApiKey.trim().length > 10) {
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
    // Correctly route to our Vercel Serverless Function
    const res = await fetch('/api/gemini', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error?.message || "AI Server Error");
    return data;
  }
};

export const generateCompletion = async (text, apiKey, systemPrompt, mock = '') => {
  const payload = {
    contents: [{ parts: [{ text }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };
  try {
    const data = await proxyFetch(payload, apiKey);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.error("AI Error:", e);
    return mock || "Ошибка связи с ИИ.";
  }
};

export const generateVisionDescription = async (prompt, base64Image, apiKey) => {
  if (!base64Image) return "Ошибка камеры";
  
  // Clean base64 data
  let base64Data = base64Image;
  if (base64Image.includes(',')) {
    base64Data = base64Image.split(',')[1];
  }
  
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
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Пустой ответ от ИИ");
    }
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.error("Vision Error:", e);
    if (e.message.includes('key not configured')) {
      return "Ошибка: Проверьте GEMINI_API_KEY в настройках Vercel.";
    }
    return "Не удалось получить ответ. Попробуйте еще раз.";
  }
};

export const generateAudioAnalysis = async (base64Audio, language, apiKey) => {
  if (!base64Audio) return "Звук не записан";
  let base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
  
  const prompt = `Analyze audio. 1 short sentence only. Language: ${language === 'en' ? 'English' : 'Russian'}`;
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
    return "Ошибка анализа звука.";
  }
};
