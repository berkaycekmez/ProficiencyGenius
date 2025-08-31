const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Adım 1: 'public' klasöründeki statik dosyaları (css, js, resim vb.) sun.
// Bu adımın artık sorunsuz çalıştığını biliyoruz.
app.use(express.static(path.join(__dirname, 'public')));

// Adım 2: YUKARIDA EŞLEŞMEYEN GERİYE KALAN TÜM İSTEKLERİ YAKALA
// Bu satır, birisi /test, /hakkimizda gibi direk bir linke gittiğinde
// veya ana sayfayı istediğinde, ona her zaman index.html'i gönderir.
// Bu, tek sayfa uygulamalarının (SPA) çalışması için zorunludur.
// En başından beri sorun çıkaran kod buydu, şimdi doğru bağlamda çalışacak.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Adım 3: Sunucuyu dinlemeye başla.
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});