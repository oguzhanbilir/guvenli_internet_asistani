# 📦 Güvenli İnternet Asistanı - Proje Materyalleri

**Proje:** Dinamik Oltalama Saldırılarına Karşı Çok Katmanlı Yapay Zekâ Savunması  
**Tarih:** 2026-02-06

---

## 🛠️ PROGRAMLAMA DİLLERİ

### Backend
- **Python 3.11.9** - Ana programlama dili
  - Modern Python özellikleri (type hints, dataclasses, async/await)
  - Standart kütüphaneler: `json`, `logging`, `math`, `os`, `ssl`, `statistics`, `sys`, `time`, `socket`, `threading`, `urllib.parse`, `datetime`

### Frontend
- **JavaScript (ES6+)** - Tarayıcı eklentisi ve web arayüzü
  - Vanilla JavaScript (framework kullanılmadan)
  - Modern JavaScript özellikleri (async/await, arrow functions, destructuring)
- **TypeScript** - Web arayüzü için (site klasörü)
- **HTML5** - Yapısal markup
- **CSS3** - Stil ve animasyonlar

---

## 🔧 BACKEND FRAMEWORK VE KÜTÜPHANELER

### Web Framework
- **FastAPI 0.104.1** - Modern, hızlı web framework
  - Otomatik API dokümantasyonu (Swagger UI, ReDoc)
  - Pydantic ile veri doğrulama
  - Async/await desteği

### Web Sunucu
- **Uvicorn 0.24.0** - ASGI sunucu
  - FastAPI ile entegre
  - Yüksek performans

### Veri Doğrulama
- **Pydantic 2.5.0** - Veri validasyonu ve serialization
  - Type-safe API modelleri
  - Otomatik veri dönüşümü

---

## 🌐 WEB SCRAPING VE İÇERİK ANALİZİ

### HTTP İstekleri
- **Requests 2.31.0** - HTTP kütüphanesi
  - Web sayfalarını indirme
  - SSL sertifika kontrolü
  - Redirect takibi

### HTML Parsing
- **BeautifulSoup4 4.12.2** - HTML/XML parser
  - Web sayfası içeriğini analiz etme
  - Metin çıkarma
  - DOM manipülasyonu

### Web Otomasyonu
- **Selenium 4.15.2** - Web browser otomasyonu
  - Chrome WebDriver
  - Firefox WebDriver
  - Ekran görüntüsü alma
  - JavaScript çalıştırma

---

## 🔍 GÜVENLİK VE ANALİZ KÜTÜPHANELERİ

### Domain Analizi
- **python-whois 0.8.0** - WHOIS sorgulama
  - Domain yaşı tespiti
  - Domain kayıt bilgileri
  - TLD analizi

### String Benzerliği
- **python-Levenshtein 0.23.0** - String mesafe algoritması
  - Typosquatting tespiti
  - Domain benzerliği analizi
  - Homografik karakter tespiti

---

## 🖼️ GÖRSEL İŞLEME VE ANALİZ

### Görüntü İşleme
- **Pillow (PIL) 10.1.0** - Python Imaging Library
  - Görüntü yükleme ve işleme
  - Renk analizi
  - Görüntü dönüşümleri

### Görsel Hash
- **imagehash 4.3.1** - Perceptual Hashing
  - pHash (Perceptual Hash) algoritması
  - Logo benzerliği tespiti
  - Görsel fingerprint oluşturma

---

## 🤖 MAKİNE ÖĞRENMESİ VE VERİ ANALİZİ

### Bilimsel Hesaplama
- **NumPy 1.26.2** - Sayısal hesaplamalar
  - Array işlemleri
  - Matematiksel fonksiyonlar
  - Veri manipülasyonu

### Makine Öğrenmesi
- **scikit-learn 1.3.2** - ML kütüphanesi
  - K-Means Clustering (renk paleti analizi)
  - Veri ön işleme
  - Algoritma implementasyonları

### Veri Analizi
- **Pandas 2.1.3** - Veri analizi kütüphanesi
  - Veri yapıları (DataFrame, Series)
  - Veri işleme ve analiz
  - Excel dosyası okuma/yazma

### Excel İşleme
- **openpyxl 3.1.2** - Excel dosyası işleme
  - .xlsx dosyalarını okuma/yazma
  - Veri seti yönetimi

---

## 📦 PAKETLEME VE DAĞITIM

### Executable Oluşturma
- **PyInstaller 6.2.0** - Python uygulamasını EXE'ye çevirme
  - Tek dosya executable
  - Bağımlılık yönetimi
  - Windows uyumluluğu

---

## 🌍 TARAYICI EKLENTİSİ (FRONTEND)

### Tarayıcı API'leri
- **Chrome Extension API (Manifest V3)**
  - `chrome.storage.local` - Veri saklama
  - `chrome.tabs` - Sekme yönetimi
  - `chrome.runtime` - Mesajlaşma
  - `chrome.action` - Eklenti aksiyonları
  - Service Worker (background.js)

### Web Teknolojileri
- **HTML5** - Yapısal markup
- **CSS3** - Stil ve animasyonlar
  - Flexbox layout
  - CSS Grid
  - Animations (@keyframes)
  - Glassmorphism efektleri
  - Gradient arka planlar

### JavaScript Özellikleri
- **Fetch API** - HTTP istekleri
- **Promise/Async-Await** - Asenkron işlemler
- **DOM Manipulation** - Sayfa etkileşimi
- **Event Listeners** - Kullanıcı etkileşimleri
- **LocalStorage/Chrome Storage** - Veri saklama

---

## 🎨 WEB ARAYÜZÜ (SITE)

### Frontend Framework (Opsiyonel)
- **React** - Component-based UI (site klasöründe)
- **TypeScript** - Type-safe JavaScript

---

## 🗄️ VERİ DEPOLAMA

### Dosya Formatları
- **JSON** - Veri saklama
  - `brand_data.json` - Marka verileri (457 marka)
  - Cache verileri
  - API yanıtları

- **Excel (.xlsx)** - Test veri seti
  - `popüler_siteler.xlsx` - Test URL'leri

### Tarayıcı Depolama
- **Chrome Storage API** - Extension veri saklama
  - `chrome.storage.local` - Whitelist yönetimi
  - Cache yönetimi
  - Kullanıcı ayarları

---

## 🔐 GÜVENLİK VE PROTOKOLLER

### Ağ Protokolleri
- **HTTP/HTTPS** - Web protokolleri
- **SSL/TLS** - Güvenli bağlantı
  - Sertifika doğrulama
  - SSL analizi

### Güvenlik Özellikleri
- **CORS (Cross-Origin Resource Sharing)** - Cross-origin istekleri
- **Content Security Policy** - Extension güvenliği
- **Host Permissions** - Domain erişim kontrolü

---

## 🧮 ALGORİTMALAR VE YÖNTEMLER

### String İşleme
- **Levenshtein Distance** - String benzerliği
  - Typosquatting tespiti
  - Domain benzerliği

### Görsel Analiz
- **Perceptual Hashing (pHash)** - Görsel fingerprint
  - Logo benzerliği tespiti
  - Görsel değişiklik tespiti

### Makine Öğrenmesi
- **K-Means Clustering** - Renk paleti analizi
  - Dominant renk tespiti
  - Renk benzerliği

### Skorlama
- **Weighted Signal Scoring** - Çok katmanlı skorlama
  - Risk skorları
  - Katman bazlı analiz
  - Agregasyon algoritmaları

---

## 🖥️ GELİŞTİRME ORTAMI VE ARAÇLAR

### İşletim Sistemi
- **Windows 10/11** - Geliştirme ortamı
- **Linux (Ubuntu 18.04+)** - Desteklenen
- **macOS 10.14+** - Desteklenen

### Tarayıcılar
- **Google Chrome 90+** - Ana tarayıcı
- **Microsoft Edge 90+** - Desteklenen

### Geliştirme Araçları
- **Git** - Versiyon kontrolü
- **GitHub** - Kod deposu
- **VS Code / Cursor** - IDE
- **PowerShell / CMD** - Komut satırı

### Build Araçları
- **PyInstaller** - EXE oluşturma
- **Batch Scripts (.bat)** - Windows otomasyonu
- **Compress-Archive (PowerShell)** - ZIP oluşturma

---

## 📚 VERİ SETLERİ VE KAYNAKLAR

### Marka Verileri
- **brand_data.json** - 457 marka verisi
  - Logo hash'leri
  - Renk paletleri
  - Domain bilgileri

### Test Verileri
- **popüler_siteler.xlsx** - Test URL'leri
  - Güvenli siteler
  - Şüpheli siteler
  - Test senaryoları

---

## 🎯 API VE SERVİSLER

### RESTful API
- **FastAPI** - REST API framework
- **OpenAPI/Swagger** - API dokümantasyonu
- **ReDoc** - Alternatif API dokümantasyonu

### Endpoint'ler
- `POST /analyze` - URL analizi
- `GET /health` - Sağlık kontrolü
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc
- `GET /openapi.json` - OpenAPI spec

---

## 📊 PERFORMANS VE OPTİMİZASYON

### Caching
- **Chrome Storage API** - Tarayıcı cache
- **In-memory Cache** - Backend cache
- **5 dakika cache süresi** - Performans optimizasyonu

### Timeout Yönetimi
- **30 saniye** - Analiz timeout
- **5 saniye** - Health check timeout
- **AbortController** - İstek iptali

---

## 🔄 VERSİYON KONTROL VE DAĞITIM

### Versiyon Kontrolü
- **Git** - Source control
- **GitHub** - Remote repository
- **.gitignore** - Dosya filtreleme

### Dağıtım Formatları
- **EXE** - Windows executable
- **ZIP** - Frontend paketi
- **Batch Scripts** - Kolay başlatma

---

## 📝 DOKÜMANTASYON

### Dokümantasyon Formatları
- **Markdown (.md)** - Dokümantasyon dosyaları
- **README.md** - Proje dokümantasyonu
- **KULLANIM_TALIMATLARI.txt** - Kullanıcı kılavuzu

---

## 🎨 TASARIM VE UI

### Tasarım Prensipleri
- **Glassmorphism** - Modern UI efekti
- **Gradient Arka Planlar** - Görsel tasarım
- **Responsive Design** - Uyumlu tasarım
- **Modern Color Palette** - Renk şeması

### İkonlar ve Görseller
- **PNG İkonlar** - 16x16, 48x48, 128x128
- **SVG İkonlar** - Vektör grafikler
- **Emoji İkonlar** - Fallback ikonlar

---

## 🧪 TEST VE KALİTE

### Test Araçları
- **Python unittest** - Backend testleri
- **Manual Testing** - Kullanım testleri
- **Browser DevTools** - Frontend debugging

### Test Senaryoları
- **Health Check Testleri**
- **URL Analiz Testleri**
- **Hata Senaryoları**
- **Performans Testleri**
- **CORS Testleri**

---

## 📋 ÖZET TABLO

| Kategori | Teknoloji/Araç | Versiyon | Kullanım Amacı |
|----------|----------------|----------|----------------|
| **Programlama Dili** | Python | 3.11.9 | Backend geliştirme |
| **Programlama Dili** | JavaScript | ES6+ | Frontend geliştirme |
| **Web Framework** | FastAPI | 0.104.1 | REST API |
| **Web Sunucu** | Uvicorn | 0.24.0 | ASGI sunucu |
| **HTTP Kütüphanesi** | Requests | 2.31.0 | Web istekleri |
| **HTML Parser** | BeautifulSoup4 | 4.12.2 | HTML analizi |
| **Web Otomasyonu** | Selenium | 4.15.2 | Browser otomasyonu |
| **Domain Analizi** | python-whois | 0.8.0 | WHOIS sorgulama |
| **String Analizi** | python-Levenshtein | 0.23.0 | Typosquatting |
| **Görüntü İşleme** | Pillow | 10.1.0 | Görüntü analizi |
| **Görsel Hash** | imagehash | 4.3.1 | Logo benzerliği |
| **ML Kütüphanesi** | scikit-learn | 1.3.2 | K-Means clustering |
| **Veri Analizi** | Pandas | 2.1.3 | Veri işleme |
| **Bilimsel Hesaplama** | NumPy | 1.26.2 | Sayısal işlemler |
| **Excel İşleme** | openpyxl | 3.1.2 | Excel dosyaları |
| **Paketleme** | PyInstaller | 6.2.0 | EXE oluşturma |
| **Tarayıcı** | Chrome Extension API | Manifest V3 | Extension geliştirme |
| **Veri Formatı** | JSON | - | Veri saklama |
| **Veri Formatı** | Excel (.xlsx) | - | Test verileri |

---

## 🎯 SLAYT İÇİN ÖZET

### Ana Teknolojiler
1. **Python 3.11** - Backend programlama dili
2. **FastAPI** - Modern web framework
3. **JavaScript** - Frontend programlama dili
4. **Chrome Extension API** - Tarayıcı eklentisi

### Analiz Kütüphaneleri
1. **Selenium** - Web scraping ve görsel analiz
2. **BeautifulSoup** - HTML parsing
3. **python-Levenshtein** - Typosquatting tespiti
4. **imagehash** - Logo benzerliği (pHash)
5. **scikit-learn** - K-Means clustering (renk analizi)

### Veri İşleme
1. **Pandas** - Veri analizi
2. **NumPy** - Sayısal hesaplamalar
3. **Pillow** - Görüntü işleme

### Algoritmalar
1. **Levenshtein Distance** - String benzerliği
2. **Perceptual Hashing (pHash)** - Görsel fingerprint
3. **K-Means Clustering** - Renk paleti analizi
4. **Weighted Signal Scoring** - Çok katmanlı skorlama

---

**Toplam Materyal Sayısı:** 20+ kütüphane/framework + 4 algoritma + 3 veri formatı

---

**Hazırlayan:** Proje Analiz Sistemi  
**Tarih:** 2026-02-06
