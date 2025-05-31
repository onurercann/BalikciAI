// public/app.js
let menuText = '';
let promptTemplate = null;
let isMenuLoaded = false;
const API_URL = '/api/generate';

// Prompt şablonunu yükle
async function loadPrompt() {
  if (!promptTemplate) {
    promptTemplate = await fetch('/prompt.txt').then(r => r.text());
  }
  return promptTemplate;
}

// JSON’dan metin formatına dinamik çevirme
function jsonToMenuText(data) {
  const lines = [];
  for (const [section, content] of Object.entries(data)) {
    lines.push(`--- ${section} ---`);
    if (Array.isArray(content)) {
      content.forEach(item => lines.push(`${item.isim} — ${item.fiyat}₺`));
    } else {
      for (const [subsec, items] of Object.entries(content)) {
        lines.push(`--- ${subsec} ---`);
        if (Array.isArray(items)) {
          items.forEach(item => lines.push(`${item.isim} — ${item.fiyat}₺`));
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

// Menü yükleme
async function loadMenu() {
  const status = document.getElementById('upload-status');
  status.textContent = 'Menü yükleniyor…';
  try {
    const res = await fetch('/menu.json');
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    menuText = jsonToMenuText(data);
    isMenuLoaded = true;
    status.textContent = 'Menü başarıyla yüklendi.';
  } catch (e) {
    console.error('Menü yükleme hatası:', e);
    status.textContent = `Menü yüklenirken hata: ${e.message}`;
  }
}

// Mesaj ekleme yardımcı fonksiyonu
function appendMessage(who, text, isError = false) {
  const chat = document.getElementById('chat-container');
  const msg = document.createElement('div');
  msg.className = `message ${who}` + (isError ? ' error' : '');
  msg.textContent = text;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

// Mesaj gönderme
async function sendMessage() {
  const input = document.getElementById('user-input');
  const userInput = input.value.trim();

  if (!userInput) {
    input.focus();
    return;
  }
  if (!isMenuLoaded) {
    alert('Menü henüz yüklenmedi, lütfen bekleyin.');
    input.focus();
    return;
  }

  // Kullanıcı mesajı
  appendMessage('user', userInput);
  input.value = '';

  // Selam kontrolü
  if (/^selam[!,.]?$/i.test(userInput)) {
    appendMessage('bot', 'Merhaba! Size nasıl yardımcı olabilirim?');
    input.focus();
    return;
  }

  // "Yazıyor..." göstergesi
  const chat = document.getElementById('chat-container');
  const typingMsg = document.createElement('div');
  typingMsg.className = 'message bot';
  typingMsg.textContent = 'Chilai AI yazıyor...';
  chat.appendChild(typingMsg);
  chat.scrollTop = chat.scrollHeight;

  // Prompt oluştur
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
    const data = await res.json();

    // "Yazıyor..." göstergesini kaldır
    typingMsg.remove();

    if (!res.ok || data.error) {
      appendMessage('bot', `Hata: ${data.error || res.statusText}`, true);
    } else {
      appendMessage('bot', data.response);
    }

    // Klavyeyi açık tut
    input.focus();
  } catch (e) {
    typingMsg.remove();
    appendMessage('bot', `Hata: ${e.message}`, true);
    input.focus();
  }
}

// Olay dinleyiciler
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  const input = document.getElementById('user-input');
  const btn = document.getElementById('btnSend');

  // pointerdown ile click’in focus kaydırmasını engelle
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    sendMessage();
  });

  // Enter tuşuyla gönderme
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
});
