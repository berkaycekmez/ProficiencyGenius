const express = require('express');
const path = require('path');
const app = express();

// Render'ın bize verdiği PORT'u kullan, eğer yoksa yerel'de 3000 portunu kullan
const PORT = process.env.PORT || 3000;

// ÖNEMLİ: Statik dosyaların bulunduğu 'public' klasörünü tanıtıyoruz.
// Bu satır, CSS ve JS dosyalarının doğru bir şekilde sunulmasını sağlar.
app.use(express.static(path.join(__dirname, 'public')));

// Geriye kalan tüm istekler için (örneğin /test, /results gibi),
// ana HTML dosyamızı gönderiyoruz. Bu, Single Page Application'lar için kritiktir.
// Önceki '*' yerine '/*' kullanarak daha güvenli bir yol tanımlıyoruz.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});