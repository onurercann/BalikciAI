// api/menu.js

import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    // Chilai menü sayfası
    const MENU_URL = "https://allzinapp.com/chilai/menu";
    const resp = await fetch(MENU_URL);
    if (!resp.ok) throw new Error(`Menü çekilemedi: ${resp.status}`);

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Örnek: her yemek ögesi '.item-card' içinde,
    // ismin olduğu 'h3', fiyatın olduğu '.price' seçicileriyle
    const items = [];
    $(".item-card").each((_, el) => {
      const name = $(el).find("h3").text().trim();
      const price = $(el).find(".price").text().trim();
      if (name && price) items.push(`${name} — ${price}`);
    });

    if (items.length === 0) throw new Error("Hiç öğe bulunamadı!");

    res.status(200).json({ menuText: items.join("\n") });
  } catch (err) {
    console.error("❌ Menü çekme hatası:", err);
    res.status(500).json({ error: err.message });
  }
}
