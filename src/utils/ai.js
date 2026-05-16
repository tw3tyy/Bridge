export const generateCompletion = async (prompt, apiKey, systemInstruction = '', mockResponse = '') => {
  if (!apiKey) return mockResponse;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    system_instruction: { parts: [{ text: systemInstruction }]},
    generationConfig: { temperature: 0.3 }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.error("Gemini API Error:", e);
    return `["API Ошибка: ${e.message}"]`;
  }
};

export const generateVisionDescription = async (prompt, base64Image, apiKey, mockResponse = '') => {
  if (!apiKey || !base64Image) return mockResponse;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

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
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.error("Gemini Vision API Error:", e);
    return `API Ошибка: ${e.message}`;
  }
};

export const generateAudioAnalysis = async (base64AudioRaw, mimeTypeRaw, language, apiKey, mockResponse = '') => {
  if (!apiKey || !base64AudioRaw) return mockResponse;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let base64Data = base64AudioRaw;
  let mimeType = mimeTypeRaw;

  // if passed directly from reader.result which includes data header
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
    generationConfig: { temperature: 0.3 }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text.trim();
  } catch(e) {
    console.error("Gemini Audio API Error:", e);
    return `API Ошибка: ${e.message}`;
  }
};
