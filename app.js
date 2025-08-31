// ----- TEST KODU BAŞLANGIÇ -----
const express = require('express');
const app = express();

// Render'ın bize verdiği PORT'u kullan, eğer yoksa 3000'i kullan
const PORT = process.env.PORT || 3000;

// Sadece ana sayfaya gelen isteği karşıla ve basit bir yazı gönder
app.get('/', (req, res) => {
  res.send('Test Başarılı! Bu yazıyı görüyorsan sunucu çalışıyor demektir.');
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
  console.log(`Test sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});
// ----- TEST KODU BİTİŞ -----