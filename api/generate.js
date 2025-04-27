// api/generate.js
import { Configuration, OpenAIApi } from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST kabul edilir" });
  }
  try {
    const { prompt, model } = req.body;
    const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(config);

    const completion = await openai.createChatCompletion({
      model,                        // örn. "gpt-4o" veya "gpt-3.5-turbo"
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    const text = completion.data.choices[0].message.content;
    res.status(200).json({ response: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Beklenmeyen hata" });
  }
}
