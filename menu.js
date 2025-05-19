// api/menu.js
import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    // 1) Ana menü sayfasını çek ve parse et
    const MENU_HOME = "https://allzinapp.com/chilai/menu";
    const homeResp = await fetch(MENU_HOME);
    if (!homeResp.ok) {
      return res
        .status(homeResp.status)
        .json({ error: `Ana menü sayfası yüklenemedi (HTTP ${homeResp.status})` });
    }
    const homeHtml = await homeResp.text();
    const $ = cheerio.load(homeHtml);

    // 2) Sayfadaki kategori linklerinden ID’leri topla
    //    (ör: <a href="/chilai/menu/menu-items-page?idProductCategory=40530">…</a>)
    const hrefs = $('a[href*="menu-items-page?idProductCategory="]')
      .map((i, el) => $(el).attr("href"))
      .get();
    const ids = [...new Set(
      hrefs
        .map(h => new URL(h, MENU_HOME).searchParams.get("idProductCategory"))
        .filter(Boolean)
    )];

    if (!ids.length) {
      return res.status(404).json({ error: "Kategori bulunamadı." });
    }

    // 3) Her kategori için `/menu-items-page` endpoint’ini çek, parse et
    const items = [];
    for (const id of ids) {
      const pageUrl = `${MENU_HOME}/menu-items-page?idProductCategory=${id}`;
      const pageResp = await fetch(pageUrl);
      if (!pageResp.ok) continue; // hata alırsak atla

      const pageHtml = await pageResp.text();
      const $$ = cheerio.load(pageHtml);

      // 4) Öğeleri seç ve name/price çıkar
      //    Aşağıda örnek seçiciler var; kendi sayfanıza göre güncelleyin!
      $$(".item-card").each((_, el) => {
        const name = $$(el).find(".item-name").text().trim();
        const price = $$(el).find(".item-price").text().trim();
        if (name && price) {
          items.push(`${name} — ${price}`);
        }
      });
    }

    if (!items.length) {
      return res.status(404).json({ error: "Menü öğesi bulunamadı." });
    }

    // 5) Sonucu JSON ile dön
    return res.status(200).json({ menuText: items.join("\n") });
  } catch (err) {
    console.error("Menü çekme hatası:", err);
    return res.status(500).json({ error: `Sunucu hatası: ${err.message}` });
  }
}
