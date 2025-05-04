// api/menu.js
import cheerio from "cheerio";

export default async function handler(req, res) {
  const MENU_URL = "https://allzinapp.com/chilai/menu";

  try {
    const resp = await fetch(MENU_URL);
    // Eğer status 200–299 değilse, JSON hata gönder
    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ error: `Menü sayfası yüklenemedi (HTTP ${resp.status})` });
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    const items = [];
    $(".item-card").each((_, el) => {
      const name = $(el).find("h3").text().trim();
      const price = $(el).find(".price").text().trim();
      if (name && price) items.push(`${name} — ${price}`);
    });

    if (items.length === 0) {
      return res.status(404).json({ error: "Menü öğesi bulunamadı." });
    }

    res.status(200).json({ menuText: items.join("\n") });
  } catch (err) {
    console.error("❌ Menü çekme hatası:", err);
    res.status(500).json({ error: `Sunucu hatası: ${err.message}` });
  }
}
