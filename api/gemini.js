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
    return res.status(500).json({ error: { message: "API key not configured in Vercel." } });
  }

  // Changed v1beta to v1 (stable) to avoid the "model not found" error
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await geminiRes.json();
    
    if (data.error) {
       console.error("Gemini API Error:", data.error);
       return res.status(500).json(data);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
