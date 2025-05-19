// api/menu.js
import cheerio from "cheerio";

export default async function handler(req, res) {
  const MENU_URL = "https://allzinapp.com/chilai/menu";

  try {
    // 1) Sayfayı fetch et
    const resp = await fetch(MENU_URL);
    if (!resp.ok) {
      return res
        .status(resp.status)
        .json({ error: `Menü sayfası yüklenemedi (HTTP ${resp.status})` });
    }
    const html = await resp.text();

    // 2) Cheerio ile HTML'i yükle ve __NEXT_DATA__ script'ini al
    const $ = cheerio.load(html);
    const script = $('#__NEXT_DATA__').html();
    if (!script) {
      throw new Error("Next.js embed verisi bulunamadı");
    }

    // 3) JSON.parse ile içeriği al
    const nextData = JSON.parse(script);

    // 4) JSON yapısına göre menü öğelerini çıkartın
    //    (Aşağıdaki path, NextData içeriğine göredir; lütfen konsola loglayıp kontrol edin)
    const menuItems =
      nextData.props.pageProps?.initialData?.menuItems ||
      nextData.props.pageProps?.store?.menuItems ||
      [];

    if (!menuItems.length) {
      return res.status(404).json({ error: "Menü öğesi bulunamadı" });
    }

    // 5) Diziye dönüştür ve metin halinde birleştir
    const items = menuItems.map(item => {
      const name = item.title || item.name;
      const price = item.priceText || `${item.price}₺`;
      return `${name} — ${price}`;
    });

    return res.status(200).json({ menuText: items.join("\n") });
  } catch (err) {
    console.error("Menü çekme hatası:", err);
    return res.status(500).json({ error: `Sunucu hatası: ${err.message}` });
  }
}
