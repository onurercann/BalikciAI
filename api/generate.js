// api/generate.js
import Cohere from "cohere-ai";

Cohere.init(process.env.COHERE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST kabul edilir" });
  }
  try {
    const { prompt } = req.body;
    // Cohere generate modeli: 'command' (soru-cevap, sohbet için optimize)
    const response = await Cohere.generate({
      model: "command",
      prompt,
      max_tokens: 200,       // Yanıt uzunluğunu sınırlandırın
      temperature: 0.7,      // Yanıtın çeşitliliği
      k: 0,                  // k-sampling: 0 = devre dışı
      p: 0.75                // nucleus sampling
    });

    const text = response.body.generations[0].text.trim();
    return res.status(200).json({ response: text });
  } catch (err) {
    console.error("Cohere hatası:", err);
    return res.status(500).json({ error: err.message || "Beklenmeyen hata" });
  }
}
