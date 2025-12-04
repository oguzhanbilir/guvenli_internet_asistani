# Güvenli İnternet Asistanı

Dinamik Oltalama Saldırılarına Karşı Çok Katmanlı Yapay Zekâ Savunması

## 📋 Proje Hakkında

Güvenli İnternet Asistanı, web sitelerini ve e-postaları analiz ederek oltalama (phishing) saldırılarını tespit eden çok katmanlı bir yapay zeka savunma sistemidir. Sistem, teknik analiz, dilsel analiz ve görsel analiz katmanlarını birleştirerek kapsamlı bir güvenlik değerlendirmesi sunar.

## 🎯 Özellikler

- **Teknik Analiz:** URL yapısı, domain yaşı, SSL sertifikası, typosquatting ve homografik karakter tespiti
- **Dilsel Analiz:** Manipülatif dil ve sosyal mühendislik anahtar kelimelerinin tespiti
- **Görsel Analiz:** Logo benzerliği (pHash) ve renk paleti analizi (K-Means)
- **E-posta Analizi:** E-posta içeriği ve gönderen domain analizi
- **Gerçek Zamanlı Koruma:** Tarayıcı eklentisi ile otomatik site analizi
- **Zero-Day Tespit:** Bilinmeyen saldırıları görsel benzerlik ile yakalama

## 🏗️ Proje Yapısı

```
phishing/
├── backend/              # Backend API servisi
│   ├── api.py           # FastAPI uygulaması
│   ├── analiz_motoru.py # Analiz motoru
│   ├── bilgi_bankasi_olusturucu.py # Marka verisi oluşturucu
│   ├── brand_data.json  # Güvenilir marka verileri
│   └── requirements.txt # Python bağımlılıkları
├── frontend_extension/  # Tarayıcı eklentisi
│   ├── manifest.json
│   ├── popup.html/js/css
│   ├── content.js/css
│   └── background.js
├── site/                # Web arayüzü
│   ├── index.html
│   ├── app.js
│   └── style.css
└── logo*.png            # Logo dosyaları
```

## 🚀 Kurulum

Detaylı kurulum talimatları için [EK-6_KURULUM_TALIMATLARI.md](EK-6_KURULUM_TALIMATLARI.md) dosyasına bakın.

### Hızlı Başlangıç

1. **Backend Kurulumu:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python api.py
   ```

2. **Tarayıcı Eklentisi:**
   - Chrome/Edge'de `chrome://extensions/` adresine gidin
   - Geliştirici modunu açın
   - `frontend_extension` klasörünü yükleyin

3. **Web Arayüzü:**
   - `site/index.html` dosyasını tarayıcıda açın

## 📊 Performans Metrikleri

- **Doğruluk (Accuracy):** %92
- **Kesinlik (Precision):** %92.9
- **Duyarlılık (Recall):** %86.7
- **Özgüllük (Specificity):** %96
- **F1-Skoru:** %89.7

## 📚 Dokümantasyon

- **Ana Rapor:** [2_aralik_son_rapor.md](2_aralik_son_rapor.md)
- **Veri Seti:** [EK-3_VERI_SETI.md](EK-3_VERI_SETI.md)
- **API Dokümantasyonu:** [EK-5_API_ISTEK_YANIT_FORMATI.md](EK-5_API_ISTEK_YANIT_FORMATI.md)
- **Kurulum:** [EK-6_KURULUM_TALIMATLARI.md](EK-6_KURULUM_TALIMATLARI.md)

## 🛠️ Teknolojiler

- **Backend:** Python 3.11, FastAPI, Selenium, BeautifulSoup
- **Frontend:** Vanilla JavaScript, Chrome Extension API
- **Analiz:** Levenshtein Distance, Perceptual Hashing (pHash), K-Means Clustering
- **Veri:** JSON, Excel

## 📝 Lisans

Bu proje akademik amaçlı geliştirilmiştir.

## 👥 Katkıda Bulunanlar

Proje geliştiricileri tarafından oluşturulmuştur.

## 📞 İletişim

Sorularınız için proje deposunu kullanabilirsiniz.

