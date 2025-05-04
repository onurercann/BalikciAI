// app.js

// Prompt ve menü içeriği saklanacak değişkenler
let menuText = '';
let promptTemplate = null;

// Menü API’sinden çekme fonksiyonu
async function loadMenu() {
  const status = document.getElementById('upload-status');
  try {
    status.textContent = 'Menü yükleniyor…';
    const res = await fetch('/api/menu');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);

    menuText = data.menuText;
    status.textContent = 'Menü başarıyla yüklendi.';
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

// Sayfa yüklendiğinde menüyü çek
window.addEventListener('DOMContentLoaded', loadMenu);

// API endpoint (Vercel Function)
const API_URL = '/api/generate';

// Mesaj gönderme fonksiyonu
async function sendMessage() {
  const input = document.getElementById('user-input');
  const userInput = input.value.trim();
  if (!userInput) return;

  const chat = document.getElementById('chat-container');
  chat.innerHTML += `<div class="message user">${userInput}</div>`;
  input.value = '';

  // Selamlamaya özel yanıtlama
  if (/^selam[!,.]?$/i.test(userInput)) {
    chat.innerHTML += `<div class="message bot">Merhaba! Size nasıl yardımcı olabilirim?</div>`;
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  // Normal akış: prompt şablonunu oluştur
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

// Buton ve Enter tuşu ile gönderme
document.getElementById('btnSend').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
