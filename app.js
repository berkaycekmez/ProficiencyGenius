// Gerekli kütüphaneleri içeri aktar
const express = require('express');
const path = require('path');

// Express uygulamasını oluştur
const app = express();

// Render'ın bize verdiği PORT'u kullan, eğer yoksa yerel'de 3000 portunu kullan
const PORT = process.env.PORT || 3000;

// 'public' adında bir klasör oluşturup statik dosyaları (html, css, js) oradan sunacağımızı belirtiyoruz
// DİKKAT: index.html, style.css, script.js gibi dosyalarını 'public' adında bir klasörün içine koyman gerekecek.
app.use(express.static(path.join(__dirname, 'public')));

// Ana sayfaya bir istek geldiğinde, 'public' klasöründeki index.html dosyasını gönder
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
    console.log(`Siteye http://localhost:${PORT} adresinden erişilebilir.`);
});