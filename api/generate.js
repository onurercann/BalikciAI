// api/generate.js

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST kabul edilir" });
  }
  try {
    const { prompt } = req.body;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Modeli GPT-4.1-nano olarak ayarladık
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "Sen bir restoran bilgi asistanısın. Sadece Türkçe konuş." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5
    });

    const text = completion.choices[0].message.content;
    return res.status(200).json({ response: text });
  } catch (err) {
    console.error("OpenAI hatası:", err);
    const msg = err.message || "Beklenmeyen sunucu hatası";
    return res.status(500).json({ error: msg });
  }
}
