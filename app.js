// app.js

// PDF.js global kontrol
const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
if (!pdfjs) {
  console.error('PDF.js kütüphanesi bulunamadı.');
}

let menuText = '';
let promptTemplate = null;

// Menü PDF'ini yükle ve metin çıkar
async function loadMenuPdf() {
  const status = document.getElementById('upload-status');
  try {
    const res = await fetch('menu.pdf');
    const arrayBuffer = await res.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    menuText = text;
    status.textContent = 'Menü yüklendi ve PDF.js ile okundu.';
  } catch (e) {
    console.warn('PDF.js hatası, OCR fallback uygulanacak:', e.message);
    await ocrFallback(status);
  }
}

// OCR fallback: sayfaları canvas'a render edip Tesseract ile oku
async function ocrFallback(status) {
  status.textContent = 'PDF.js başarısız oldu, OCR fallback çalışıyor...';
  const res = await fetch('menu.pdf');
  const arrayBuffer = await res.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data: { text: ocrText } } = await Tesseract.recognize(canvas, 'tur');
    text += ocrText + '\n';
  }
  menuText = text;
  status.textContent = 'Menü OCR ile okundu.';
}

// Prompt şablonunu yükle
async function loadPrompt() {
  if (!promptTemplate) {
    promptTemplate = await fetch('prompt.txt').then(r => r.text());
  }
  return promptTemplate;
}

// Sayfa yüklendiğinde menüyü oku
window.addEventListener('DOMContentLoaded', loadMenuPdf);

// API endpoint (Vercel Function)
const API_URL = '/api/generate';

// Mesaj gönderme fonksiyonu
async function sendMessage() {
  const userInput = document.getElementById('user-input').value.trim();
  if (!userInput) return;

  const chat = document.getElementById('chat-container');
  chat.innerHTML += `<div class="message user">${userInput}</div>`;
  document.getElementById('user-input').value = '';

  const template = await loadPrompt();
  const finalPrompt = template
    .replace('{{menuContent}}', menuText)
    .replace('{{userInput}}', userInput);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: finalPrompt })
    });

    // Ham cevabı debug için logla ve ekrana bas
    const text = await res.text();
    console.log('➜ API Raw Response:', text);
    chat.innerHTML += `<div class="message bot error"><pre style="white-space: pre-wrap;">${text}</pre></div>`;

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Beklenmeyen yanıt:', text);
      chat.innerHTML += `<div class="message bot error">Sunucudan beklenmeyen yanıt alındı.</div>`;
      chat.scrollTop = chat.scrollHeight;
      return;
    }

    if (!res.ok || data.error) {
      console.error('API Hatası:', data.error || res.statusText);
      chat.innerHTML += `<div class="message bot error">Hata: ${data.error || res.statusText}</div>`;
    } else {
      chat.innerHTML += `<div class="message bot">${data.response}</div>`;
    }
    chat.scrollTop = chat.scrollHeight;

  } catch (e) {
    console.error('Fetch hatası:', e);
    chat.innerHTML += `<div class="message bot error">Hata: ${e.message}</div>`;
    chat.scrollTop = chat.scrollHeight;
  }
}
