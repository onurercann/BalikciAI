// api/categories.js
import cheerio from "cheerio";

export default async function handler(req, res) {
  const START_URL = "https://allzinapp.com/chilai/menu";
  const API_KEY   = process.env.SCRAPINGBEE_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "SCRAPINGBEE_KEY tanımlı değil!" });
  }

  try {
    // 1) Ana menü sayfasını ScrapingBee ile render edip çek
    const homeHtml = await fetch(
      `https://app.scrapingbee.com/api/v1?` +
      `api_key=${API_KEY}` +
      `&url=${encodeURIComponent(START_URL)}` +
      `&render_js=true`
    ).then(r => {
      if (!r.ok) throw new Error(`ScrapingBee home hata: ${r.status}`);
      return r.text();
    });
    const $ = cheerio.load(homeHtml);

    // 2) “Yiyecekler” linkindeki kategori ID’sini al
    const yiyecekHref = $('a:contains("Yiyecekler")').attr("href");
    if (!yiyecekHref) {
      throw new Error("Yiyecekler kategorisi bulunamadı");
    }
    const yiyecekId = new URL(yiyecekHref, START_URL)
                       .searchParams.get("idProductCategory");

    // 3) O kategori sayfasını render edip çek
    const catHtml = await fetch(
      `https://app.scrapingbee.com/api/v1?` +
      `api_key=${API_KEY}` +
      `&url=${encodeURIComponent(`${START_URL}/menu-items-page?idProductCategory=${yiyecekId}`)}` +
      `&render_js=true`
    ).then(r => {
      if (!r.ok) throw new Error(`ScrapingBee category hata: ${r.status}`);
      return r.text();
    });
    const $$ = cheerio.load(catHtml);

    // 4) Alt kategori başlıklarını seç (örneğin <h3> etiketlerinde)
    const subcats = [];
    $$(".menu-category__title, .item-card h3")  // sayfadaki gerçek seçicilere göre uyarlayın
      .each((_, el) => {
        const name = $$(el).text().trim();
        if (name) subcats.push(name);
      });

    if (!subcats.length) {
      return res.status(404).json({ error: "Alt kategori bulunamadı." });
    }

    return res.status(200).json({
      mainCategory: "Yiyecekler",
      subCategories: [...new Set(subcats)]
    });

  } catch (err) {
    console.error("Kategori çekme hatası:", err);
    return res.status(500).json({ error: err.message });
  }
}
