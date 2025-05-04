// app.js

let menuText = '';
let promptTemplate = null;

// Menü API’sinden çekme fonksiyonu
async function loadMenu() {
  const status = document.getElementById('upload-status');
  status.textContent = 'Menü yükleniyor…';
  try {
    const res = await fetch('/api/menu');
    const text = await res.text();

    // Gelen yanıt JSON mı diye kontrol
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error(`Menü JSON parse hatası:\n${text.slice(0,200)}${text.length>200?'…':''}`);
    }

    if (res.ok && data.menuText) {
      menuText = data.menuText;
      status.textContent = 'Menü başarıyla yüklendi.';
    } else {
      throw new Error(data.error || res.statusText);
    }
  } catch (e) {
    console.error('Menü yükleme hatası:', e);
    status.textContent = `Menü yüklenirken hata: ${e.message}`;
  }
}

// Prompt şablonunu yükle
async function loadPrompt() {
  if (!promptTemplate) {
    promptTemplate = await fetch('prompt.txt').then(r => r.text());
  }
  return promptTemplate;
}

window.addEventListener('DOMContentLoaded', loadMenu);

const API_URL = '/api/generate';

async function sendMessage() {
  const input = document.getElementById('user-input');
  const userInput = input.value.trim();
  if (!userInput) return;

  const chat = document.getElementById('chat-container');
  chat.innerHTML += `<div class="message user">${userInput}</div>`;
  input.value = '';

  if (/^selam[!,.]?$/i.test(userInput)) {
    chat.innerHTML += `<div class="message bot">Merhaba! Size nasıl yardımcı olabilirim?</div>`;
    chat.scrollTop = chat.scrollHeight;
    return;
  }

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
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      chat.innerHTML += `<div class="message bot error"><pre style="white-space: pre-wrap;">Sunucudan beklenmeyen yanıt:\n${text}</pre></div>`;
      chat.scrollTop = chat.scrollHeight;
      return;
    }
    if (!res.ok || data.error) {
      chat.innerHTML += `<div class="message bot error">Hata: ${data.error || res.statusText}</div>`;
    } else {
      chat.innerHTML += `<div class="message bot">${data.response}</div>`;
    }
    chat.scrollTop = chat.scrollHeight;
  } catch (e) {
    chat.innerHTML += `<div class="message bot error">Fetch hatası: ${e.message}</div>`;
    chat.scrollTop = chat.scrollHeight;
  }
}

document.getElementById('btnSend').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
