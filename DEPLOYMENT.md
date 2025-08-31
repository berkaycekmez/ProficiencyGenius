# Render Deployment Guide

Bu rehber, English Proficiency Test uygulamasını Render platformunda nasıl yayınlayacağınızı gösterir.

## 🚀 Hızlı Deployment

### 1. GitHub Repository Hazırlama

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Render'da Yeni Web Service Oluşturma

1. [Render.com](https://render.com)'a giriş yapın
2. "New +" butonuna tıklayın
3. "Web Service" seçin
4. GitHub repository'nizi connect edin

### 3. Build & Deploy Ayarları

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Environment:**
- **Environment**: `Node`
- **Region**: `Oregon` (veya tercihinize göre)
- **Instance Type**: `Free`

### 4. Environment Variables

Render dashboard'da Environment Variables bölümünde:

```
GEMINI_API_KEY = your-actual-gemini-api-key-here
NODE_ENV = production
PORT = 10000
```

> **Not**: `PORT` Render tarafından otomatik set edilir, manuel eklemeye gerek yoktur.

## 🔧 Önemli Dosyalar

### `package.json`
```json
{
  "name": "english-proficiency-test",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### `server.js`
Node.js Express server - static dosyaları serve eder.

### `render.yaml` (Opsiyonel)
Render konfigürasyonu için Infrastructure as Code.

## 🔐 API Key Yönetimi

### Development
```javascript
window.GEMINI_API_KEY = 'your-dev-key';
```

### Production (Render)
Environment variable olarak `GEMINI_API_KEY` set edin.

### URL Parameter (Demo)
```
https://your-app.render.com/?apiKey=your-api-key
```

## 🚨 Sık Karşılaşılan Hatalar

### "document is not defined" Hatası
✅ **Çözüm**: `server.js` dosyası oluşturuldu, artık `app.js` yerine `server.js` çalışıyor.

### "Cannot GET /" Hatası  
✅ **Çözüm**: Express static middleware doğru konfigüre edildi.

### API Key Hatası
✅ **Çözüm**: Environment variable'ı Render dashboard'da set edin.

## 📦 Deployment Checklist

- [x] `package.json` doğru konfigüre edildi
- [x] `server.js` Node.js server dosyası oluşturuldu  
- [x] Express dependencies install edildi
- [x] Static file serving yapılandırıldı
- [x] Environment variable handling eklendi
- [x] Health check endpoint eklendi
- [x] `render.yaml` konfigürasyon dosyası hazırlandı

## 🎯 Deploy Sonrası Test

1. Uygulamanızın açıldığını kontrol edin
2. "Start Test" butonuna tıklayın
3. AI soruları geliyorsa ✅ başarılı
4. Offline demo geliyorsa API key'i kontrol edin

## 🔄 Güncelleme

```bash
git add .
git commit -m "Update application"
git push origin main
```

Render otomatik olarak yeniden deploy edecektir.

---

**🎉 Başarılı deployment için tüm adımları takip ettiğinizden emin olun!**