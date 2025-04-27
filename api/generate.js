// api/generate.js

export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Sadece POST kabul edilir" });
    }
    try {
      const { prompt } = req.body;
      const hfToken = process.env.HF_TOKEN;
      if (!hfToken) {
        throw new Error("Hugging Face token (HF_TOKEN) tanımlı değil!");
      }
  
      // Kullanmak istediğiniz Gemma modelinin doğru ID'si
      const modelId = "EleutherAI/gpt-neo-125M";
  
      // Hugging Face Inference API çağrısı
      const hfRes = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: prompt,
            options: { wait_for_model: true }
          })
        }
      );
  
      if (!hfRes.ok) {
        const errText = await hfRes.text();
        return res.status(hfRes.status).json({ error: errText });
      }
  
      const hfData = await hfRes.json();
      const text = (hfData[0]?.generated_text || "").trim();
  
      return res.status(200).json({ response: text });
    } catch (err) {
      console.error("Gemma hatası:", err);
      res.status(500).json({ error: err.message || "Beklenmeyen hata" });
    }
  }
  