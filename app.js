const express = require('express');
const path = require('path');
const cors = require('cors');
const GeminiService = require('./gemini-service.js');

const app = express();
const PORT = process.env.PORT || 3000;

let geminiService;
try {
    geminiService = new GeminiService();
} catch (e) {
    console.error("!!! GEMINI SERVICE BAŞLATILAMADI !!!", e.message);
    geminiService = null;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gemini', async (req, res) => {
    if (!geminiService) {
        return res.status(500).json({ error: "Sunucuda Gemini Servisi yapılandırılmamış. API anahtarını kontrol edin." });
    }
    try {
        const { methodName, args } = req.body;
        if (typeof geminiService[methodName] === 'function') {
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

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});