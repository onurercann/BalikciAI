// api/categories.js
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const START_URL = 'https://allzinapp.com/chilai/menu';
  const API_KEY = process.env.SCRAPINGBEE_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'SCRAPINGBEE_KEY tanımlı değil!' });
  }

  try {
    // 1) Render edilmiş HTML'i ScrapingBee ile çek
    const apiUrl =
      `https://app.scrapingbee.com/api/v1?api_key=${API_KEY}` +
      `&url=${encodeURIComponent(START_URL)}` +
      `&render_js=true`;
    const homeResp = await fetch(apiUrl);
    if (!homeResp.ok) {
      throw new Error(`ScrapingBee hata: ${homeResp.status}`);
    }
    const html = await homeResp.text();

    // 2) Cheerio ile kategori bağlantılarını çek
    const $ = cheerio.load(html);
    let categories = [];
    $('a[href*="menu-items-page?idProductCategory="]').each((_, el) => {
      const href = $(el).attr('href');
      const url  = new URL(href, START_URL);
      const id   = url.searchParams.get('idProductCategory');
      const name = $(el).text().trim();
      if (id && name) categories.push({ id, name });
    });

    // 3) Eğer Cheerio ile bulunamazsa, regex fallback
    if (!categories.length) {
      const regex = /<a[^>]*href="\/chilai\/menu\/menu-items-page\?idProductCategory=(\d+)[^"]*"[^>]*>([^<]+)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const id = match[1];
        const name = match[2].trim();
        categories.push({ id, name });
      }
    }

    // 4) Eşsizleştir ve döndür
    const unique = Array.from(
      new Map(categories.map(cat => [cat.id, cat])).values()
    );
    if (!unique.length) {
      return res.status(404).json({ error: 'Kategori bulunamadı.' });
    }
    return res.status(200).json({ categories: unique });

  } catch (err) {
    console.error('Kategori çekme hatası:', err);
    return res.status(500).json({ error: err.message });
  }
};
