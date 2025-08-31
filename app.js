const express = require('express');
const path = require('path'); // path modülünü tekrar ekledik
const app = express();

const PORT = process.env.PORT || 3000;

// --- ŞÜPHELİ 1'İ GERİ EKLEDİK ---
// Bu satırın 'public' klasöründeki dosyaları (css, js, html) sunmasını bekliyoruz.
app.use(express.static(path.join(__dirname, 'public')));

// Test için hala basit bir ana sayfa yanıtı veriyoruz.
app.get('/', (req, res) => {
  res.send('Adım 1 Başarılı! Statik dosyalar sunuluyor.'); 
  // Not: Bu aşamada siten tam çalışmayacak, sadece test ediyoruz.
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});