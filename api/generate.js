// api/generate.js

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST kabul edilir" });
  }
  try {
    const { prompt, model } = req.body;
    // OpenAI istemcisini başlat
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Chat tamamlamayı oluştur
    const completion = await openai.chat.completions.create({
      model: model || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Sen bir restoran bilgi asistanısın. Sadece Türkçe konuş." },
        { role: "user", content: prompt }
      ]
    });

    // Yanıtı geri döndür
    const text = completion.choices[0].message.content;
    res.status(200).json({ response: text });
  } catch (err) {
    console.error("OpenAI hatası:", err);
    res.status(500).json({ error: err.message || "Beklenmeyen sunucu hatası" });
  }
}
