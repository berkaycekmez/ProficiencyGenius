const express = require('express');
const path = require('path');
const GeminiService = require('./gemini-service.js'); // Kendi Gemini beynimizi içeri aktardık

const app = express();
const PORT = process.env.PORT || 3000;

let geminiService;
try {
    // Sunucu başlarken GeminiService'in bir kopyasını oluşturuyoruz
    geminiService = new GeminiService();
} catch (e) {
    console.error("!!! GEMINI SERVICE BAŞLATILAMADI !!!", e.message);
    // Eğer API anahtarı yoksa, sunucu yine de çalışmaya devam eder ama API hata verir.
    geminiService = null;
}

app.use(express.json()); // Frontend'den gelen JSON verilerini okumak için
app.use(express.static(path.join(__dirname, 'public'))); // public klasörünü sunmak için

// === API ENDPOINT ===
// Frontend (tarayıcı), artık sadece bu adrese istek atacak.
app.post('/api/gemini', async (req, res) => {
    if (!geminiService) {
        return res.status(500).json({ error: "Sunucuda Gemini Servisi yapılandırılmamış. API anahtarını kontrol edin." });
    }
    try {
        const { methodName, args } = req.body;
        
        // Gelen metoda göre GeminiService içindeki ilgili fonksiyonu güvenli bir şekilde çalıştır
        if (typeof geminiService[methodName] === 'function') {
            // args bir dizi değilse, tek elemanlı bir diziye çevir
            const functionArgs = Array.isArray(args) ? args : [args];
            const result = await geminiService[methodName](...functionArgs);
            res.json(result);
        } else {
            res.status(400).json({ error: `'${methodName}' adında bir metod sunucuda bulunamadı.` });
        }
    } catch (error) {
        console.error('API Endpoint Hatası:', error);
        res.status(500).json({ error: 'Sunucuda bir hata oluştu.' });
    }
});

// Diğer tüm istekler için ana HTML dosyasını gönder (Bu, sitenin açılmasını sağlar)
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});