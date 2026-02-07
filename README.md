# 🛡️ Güvenli İnternet Asistanı

**Dinamik Oltalama Saldırılarına Karşı Çok Katmanlı Yapay Zekâ Savunması**

Güvenli İnternet Asistanı, web sitelerini ve e-postaları gerçek zamanlı olarak analiz ederek oltalama (phishing) saldırılarını tespit eden çok katmanlı bir yapay zeka savunma sistemidir. Sistem, teknik analiz, dilsel analiz ve görsel analiz katmanlarını birleştirerek kapsamlı bir güvenlik değerlendirmesi sunar.

## ✨ Özellikler

### 🔍 Çok Katmanlı Analiz
- **Teknik Analiz:** URL yapısı, domain yaşı, SSL sertifikası, typosquatting ve homografik karakter tespiti
- **Dilsel Analiz:** Manipülatif dil ve sosyal mühendislik anahtar kelimelerinin tespiti
- **Görsel Analiz:** Logo benzerliği (Perceptual Hashing - pHash) ve renk paleti analizi (K-Means Clustering)

### 🚀 Öne Çıkan Özellikler
- **Gerçek Zamanlı Koruma:** Tarayıcı eklentisi ile otomatik site analizi
- **E-posta Analizi:** E-posta içeriği ve gönderen domain analizi
- **Zero-Day Tespit:** Bilinmeyen saldırıları görsel benzerlik ile yakalama
- **Güven Puanı:** 0-100 arası güven puanı ile risk seviyesi belirleme
- **RESTful API:** Modern FastAPI tabanlı backend servisi

## 📊 Performans Metrikleri

- **Doğruluk (Accuracy):** %92
- **Kesinlik (Precision):** %92.9
- **Duyarlılık (Recall):** %86.7
- **Özgüllük (Specificity):** %96
- **F1-Skoru:** %89.7

## 🏗️ Proje Yapısı

```
guvenli_internet_asistani/
├── backend/                      # Backend API servisi
│   ├── api.py                   # FastAPI uygulaması ve endpoint'ler
│   ├── analiz_motoru.py         # Çok katmanlı analiz motoru
│   ├── bilgi_bankasi_olusturucu.py  # Marka verisi oluşturucu
│   ├── brand_data.json          # Güvenilir marka verileri (logo hash, renk paleti)
│   ├── build_exe.bat            # Windows EXE derleme scripti
│   ├── build_exe.spec           # PyInstaller yapılandırması
│   ├── requirements.txt         # Python bağımlılıkları
│   └── popüler_siteler.xlsx     # Test veri seti
│
├── frontend_extension/          # Tarayıcı eklentisi (Chrome/Edge)
│   ├── manifest.json            # Eklenti manifest dosyası
│   ├── popup.html/css/js        # Popup arayüzü
│   ├── content.js/css           # İçerik scripti ve stilleri
│   ├── background.js            # Arka plan servisi
│   ├── email_analyzer.js        # E-posta analiz modülü
│   └── icon*.png/svg            # Eklenti ikonları
│
├── site/                        # Web arayüzü
│   ├── index.html               # Ana HTML dosyası
│   ├── app.js/tsx               # Ana uygulama mantığı
│   ├── style.css                # Stil dosyası
│   ├── components/              # React bileşenleri
│   │   ├── AnalysisResult.tsx
│   │   ├── History.tsx
│   │   ├── HowItWorks.tsx
│   │   └── icons.tsx
│   └── services/
│       └── geminiServise.ts     # Gemini AI entegrasyonu
│
└── README.md                    # Bu dosya
```

## 🚀 Kurulum

### Gereksinimler

- **Python:** 3.8 veya üzeri
- **Tarayıcı:** Chrome 90+ veya Edge 90+
- **İşletim Sistemi:** Windows 10/11, Linux (Ubuntu 18.04+), macOS 10.14+

### Backend Kurulumu

1. **Proje klasörüne gidin:**
   ```bash
   cd backend
   ```

2. **Virtual environment oluşturun (önerilir):**
   ```bash
   python -m venv venv
   ```

3. **Virtual environment'ı aktifleştirin:**
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

4. **Bağımlılıkları yükleyin:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Backend servisini başlatın:**
   ```bash
   python api.py
   ```

   Servis `http://localhost:8000` adresinde çalışacaktır.

6. **API dokümantasyonuna erişin:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Tarayıcı Eklentisi Kurulumu

1. Chrome veya Edge tarayıcısını açın
2. Adres çubuğuna yazın:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Sağ üst köşede **"Geliştirici modu"** (Developer mode) seçeneğini açın
4. **"Paketlenmemiş uzantı yükle"** (Load unpacked) butonuna tıklayın
5. `frontend_extension` klasörünü seçin
6. Eklenti yüklenecek ve tarayıcı çubuğunda görünecektir

**Eklenti Ayarları:**
- Eklenti simgesine tıklayın
- Ayarlar bölümünden backend URL'sini girin (varsayılan: `http://localhost:8000`)
- "Test Bağlantısı" butonuna tıklayarak bağlantıyı test edin

### Web Arayüzü

1. `site/index.html` dosyasını tarayıcıda açın
2. Veya bir web sunucusu ile çalıştırın:
   ```bash
   # Python ile
   cd site
   python -m http.server 8080
   ```
3. Tarayıcıda `http://localhost:8080` adresine gidin

## 🔧 Kullanım

### API Kullanımı

**Analiz İsteği:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "include_visual": true
  }'
```

**Yanıt Örneği:**
```json
{
  "guven_puani": 85,
  "karar": "Güvenli",
  "analiz_dokumu": {
    "teknik_skor": 90,
    "dilsel_skor": 80,
    "gorsel_skor": 85
  },
  "detaylı_sinyaller": [...]
}
```

### Tarayıcı Eklentisi

1. Herhangi bir web sitesine gidin
2. Eklenti otomatik olarak siteyi analiz eder
3. Eklenti simgesine tıklayarak detaylı analiz sonuçlarını görüntüleyin
4. Güven puanı ve risk seviyesi gösterilir

## 🛠️ Teknolojiler

### Backend
- **Python 3.11+** - Programlama dili
- **FastAPI 0.104+** - Modern web framework
- **Uvicorn** - ASGI sunucu
- **Selenium** - Web scraping ve görsel analiz
- **BeautifulSoup** - HTML parsing
- **python-whois** - Domain bilgisi sorgulama
- **python-Levenshtein** - Typosquatting tespiti
- **Pillow** - Görüntü işleme
- **imagehash** - Perceptual hashing (pHash)
- **scikit-learn** - K-Means clustering
- **pandas** - Veri işleme

### Frontend
- **Vanilla JavaScript** - Tarayıcı eklentisi
- **Chrome Extension API** - Tarayıcı entegrasyonu
- **React/TypeScript** - Web arayüzü (site klasörü)

### Analiz Algoritmaları
- **Levenshtein Distance** - Typosquatting tespiti
- **Perceptual Hashing (pHash)** - Logo benzerliği
- **K-Means Clustering** - Renk paleti analizi
- **Signal-based Weighting** - Çok katmanlı skorlama

## 📈 Sistem Mimarisi

```
┌─────────────────┐
│ Tarayıcı        │
│ Eklentisi       │
└────────┬────────┘
         │ HTTP Request
         ▼
┌─────────────────┐
│ FastAPI         │
│ Backend         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Teknik │ │ Dilsel │
│ Analiz │ │ Analiz │
└────┬───┘ └────┬───┘
     │          │
     └────┬─────┘
          ▼
     ┌──────────┐
     │ Görsel   │
     │ Analiz   │
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │ Hybrid   │
     │ Model    │
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │ Güven    │
     │ Puanı    │
     └──────────┘
```

## 🔒 Güvenlik

- Backend servisi varsayılan olarak sadece yerel ağda (`localhost`) çalışır
- CORS ayarları production ortamında sınırlandırılmalıdır
- Kişisel veri saklanmaz, sadece analiz edilen URL'ler işlenir
- Analiz sonuçları tarayıcıda yerel olarak saklanır (5 dakika cache)

## 📝 Lisans

Bu proje akademik amaçlı geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız ve önerileriniz için:
- **GitHub Issues:** [Issues sayfasını kullanın](https://github.com/oguzhanbilir/guvenli_internet_asistani/issues)
- **Repository:** https://github.com/oguzhanbilir/guvenli_internet_asistani

## 🙏 Teşekkürler

Bu proje, dinamik oltalama saldırılarına karşı çok katmanlı bir savunma sistemi sunmak amacıyla geliştirilmiştir.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
