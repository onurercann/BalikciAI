// api/categories.js
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  const START_URL = "https://allzinapp.com/chilai/menu";
  const API_KEY   = process.env.SCRAPINGBEE_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "SCRAPINGBEE_KEY tanımlı değil!" });
  }

  try {
    // 1) Fetch the main page via ScrapingBee
    const homeResp = await fetch(
      `https://app.scrapingbee.com/api/v1?` +
      `api_key=${API_KEY}` +
      `&url=${encodeURIComponent(START_URL)}` +
      `&render_js=true`
    );
    if (!homeResp.ok) {
      throw new Error(`ScrapingBee home hata: ${homeResp.status}`);
    }
    const homeHtml = await homeResp.text();
    const $ = cheerio.load(homeHtml);

    // 2) Grab the “Yiyecekler” link’s category ID
    const yiyecekHref = $('a:contains("Yiyecekler")').attr("href");
    if (!yiyecekHref) {
      throw new Error("Yiyecekler kategorisi bulunamadı");
    }
    const yiyecekId = new URL(yiyecekHref, START_URL)
                       .searchParams.get("idProductCategory");

    // 3) Fetch that sub-category page
    const catResp = await fetch(
      `https://app.scrapingbee.com/api/v1?` +
      `api_key=${API_KEY}` +
      `&url=${encodeURIComponent(`${START_URL}/menu-items-page?idProductCategory=${yiyecekId}`)}` +
      `&render_js=true`
    );
    if (!catResp.ok) {
      throw new Error(`ScrapingBee category hata: ${catResp.status}`);
    }
    const catHtml = await catResp.text();
    const $$ = cheerio.load(catHtml);

    // 4) Pull out the sub-category titles
    const subcats = [];
    $$("h3, .menu-category__title") // use the real selectors you find in devtools
      .each((_, el) => {
        const name = $$(el).text().trim();
        if (name) subcats.push(name);
      });

    if (!subcats.length) {
      return res.status(404).json({ error: "Alt kategori bulunamadı." });
    }

    return res.status(200).json({
      mainCategory: "Yiyecekler",
      subCategories: Array.from(new Set(subcats))
    });

  } catch (err) {
    console.error("Kategori çekme hatası:", err);
    return res.status(500).json({ error: err.message });
  }
};
