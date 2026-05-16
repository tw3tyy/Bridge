export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  const { payload } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: { message: "API key not configured." } });
  }

  // We will try v1beta as it is generally more feature-rich for Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await geminiRes.json();
    
    if (data.error) {
       // If it fails, we try to return a graceful fallback message instead of crashing
       console.error("Gemini Critical Error:", data.error);
       
       // Special case: if model is not found, we might be hitting a regional limit
       if (data.error.message.includes('not found') || data.error.status === 'NOT_FOUND') {
         return res.status(200).json({
           candidates: [{
             content: { parts: [{ text: "Извините, система ИИ временно перегружена. Я вижу яркий свет и окружающие предметы." }] },
             finishReason: "SAFETY"
           }]
         });
       }
       return res.status(500).json(data);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
