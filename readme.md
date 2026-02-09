<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension">
</p>

<h1 align="center">🛡️ Güvenli İnternet Asistanı</h1>
<p align="center">
  <strong>Oltalama (phishing) saldırılarına karşı çok katmanlı koruma</strong>
</p>
<p align="center">
  <a href="https://oguzhanbilir.github.io/guvenli_internet_asistani/">🌐 Canlı Web Arayüzü</a>
  &nbsp;•&nbsp;
  <a href="https://www.youtube.com/watch?v=nvCZ7ITpVVM">▶️ Kullanım Videosu</a>
  &nbsp;•&nbsp;
  <a href="#-hızlı-başlangıç">Kurulum</a>
  &nbsp;•&nbsp;
  <a href="#-proje-yapısı">Yapı</a>
</p>

---

## 📌 Proje Hakkında

Güvenli İnternet Asistanı, **teknik**, **dilsel** ve **görsel** analiz katmanlarını bir araya getiren hibrit bir güvenlik sistemidir. URL yapısı, metin içeriği ve görsel taklit (marka logoları) analizi ile hem geleneksel hem de gelişmiş oltalama saldırılarına karşı koruma sağlar. Aşağıda her katmandaki adımlar ve kullanılan yöntemler detaylıca açıklanmaktadır.

---

### 🔧 Teknik Analiz Katmanı

Bu katman, URL ve domain üzerinde kural tabanlı ve benzerlik tabanlı kontroller yapar.

| Adım | Açıklama |
|------|----------|
| **URL yapısı** | Domain uzunluğu, subdomain sayısı, path/query uzunluğu, standart dışı port kullanımı; şüpheli TLD listesi (.xyz, .work, .click vb.) ile karşılaştırma. |
| **Kısaltılmış URL** | Bilinen kısaltma servisleri (bit.ly, tinyurl.com, t.co vb.) tespit edilir; oltalama için sık kullanıldığından risk skoruna yansır. |
| **SSL/TLS** | HTTPS kullanımı, sertifika varlığı ve bağlantı güvenliği kontrol edilir. |
| **Yönlendirme** | HTTP/HTTPS yönlendirme zinciri izlenir; döngüsel veya şüpheli yönlendirmeler işaretlenir. |
| **Domain yaşı (WHOIS)** | Mümkünse domain kayıt tarihi alınır; çok yeni domainler (örn. 30 gün altı) düşük güven sinyali üretir. |
| **Homografik karakterler** | **Unicode homograf:** Farklı alfabelerden görünümde benzer karakterler (Kiril `а` vs Latin `a`, Yunan `ο` vs Latin `o`) tespit edilir. **ASCII lookalike:** `rn`→`m`, `vv`→`w`, `0`→`o`, `1`→`l` gibi diziler normalize edilip bilinen marka domain’leriyle karşılaştırılır; eşleşme varsa yüksek risk. |
| **Typosquatting** | Domain (ve tireyle ayrılmış segmentler) bilgi bankasındaki marka domain’leriyle **Levenshtein mesafesi** ile karşılaştırılır; mesafe ≤2 ve substring/benzerlik koşulları typosquatting riski üretir. Böylece `rnicrosoft-login.com` gibi adresler `microsoft.com` ile eşleştirilerek tehlikeli sınıfına çekilir. |

**Yapay zeka / benzerlik teknikleri (teknik katmanda):** Statik homograf eşleme tablolarına ek olarak, domain segmentleri normalize edilip marka listesiyle hem tam eşleşme hem de **Levenshtein** ile benzerlik kontrolü yapılır; eşik değerleri (örn. mesafe ≤2) ve ağırlıklar risk puanına entegre edilir.

---

### 📝 Dilsel Analiz Katmanı

Sayfa içeriğindeki metin, sosyal mühendislik ve oltalama diline göre analiz edilir.

| Adım | Açıklama |
|------|----------|
| **İçerik çekme** | Hedef URL’e HTTP/HTTPS isteği atılarak HTML alınır; BeautifulSoup ile metin çıkarılır. |
| **Anahtar ifadeler** | “Acil”, “hemen”, “hesabınız askıya alındı”, “şifreniz sıfırlandı”, “ödül kazandınız”, “doğrulama gerekli” gibi sosyal mühendislik ifadeleri aranır. |
| **Risk puanlama** | Tespit edilen ifade sayısı ve türüne göre dilsel risk skoru hesaplanır; teknik ve görsel skorlarla birleştirilir. |

**Not:** İçerik alınamazsa (timeout, 403, 503 vb.) dilsel katman düşük veriyle çalışır; sistem yine de URL ve diğer katmanlara dayanarak karar üretir.

---

### 👁️ Görsel Analiz Katmanı

Sayfanın ekran görüntüsü ve görsel öğeleri, marka taklidi tespiti için kullanılır.

| Adım | Açıklama |
|------|----------|
| **Ekran görüntüsü** | Selenium ile sayfa açılır ve tam sayfa veya viewport screenshot alınır. |
| **Algısal hash (pHash)** | Görüntüden **perceptual hash** (imagehash kütüphanesi) çıkarılır; bilinen marka logolarının hash’leriyle **Hamming mesafesi** hesaplanır. Düşük mesafe = yüksek görsel benzerlik, marka taklidi riski. |
| **Renk paleti** | Görüntüden renkler örneklenir; **K-Means** ile baskın renk kümeleri çıkarılır ve bilinen marka renk paletleriyle karşılaştırılır. Benzer palet, marka taklidini destekleyen bir sinyal üretir. |
| **Marka eşleştirme** | Bilgi bankasındaki markaların logo hash’leri ve renk paletleriyle karşılaştırma yapılır; eşik aşımında “marka taklidi” uyarısı risk skoruna eklenir. |

**Yapay zeka / görsel teknikler:** pHash ile görsel parmak izi, Hamming mesafesi ile benzerlik; K-Means ile renk kümeleme ve palet karşılaştırması. İsteğe bağlı görsel analiz kapatılarak yalnızca teknik + dilsel katmanla da çalışılabilir.

---

### Özet tablo

| Özellik | Kısa açıklama |
|--------|----------------|
| 🔧 **Teknik analiz** | **PhishTank** veritabanı kontrolü, URL yapısı, SSL, yönlendirme, homografik karakterler, typosquatting (Levenshtein + marka listesi), domain yaşı, kısaltılmış URL. |
| 📝 **Dilsel analiz** | Sayfa metninden sosyal mühendislik anahtar ifadelerinin taranması ve risk puanlaması. |
| 👁️ **Görsel analiz** | Logo benzerliği (pHash + Hamming), marka taklidi tespiti, renk paleti (K-Means) karşılaştırması. |

**PhishTank entegrasyonu:** [PhishTank](https://phishtank.org/) (Cisco Talos) veritabanında kayıtlı URL’ler otomatik **Tehlikeli** sayılır. Daha yüksek istek limiti için [ücretsiz API anahtarı](https://phishtank.org/api_register.php) alıp `PHISHTANK_APP_KEY` ortam değişkenine atayabilirsiniz.

---

### 🔍 Analiz nasıl yapılıyor? (Sadece URL mi, sayfa açılıyor mu?)

Sitede **sadece URL giriyorsunuz**; arka planda backend şunları yapıyor:

| Katman | Sayfa açılıyor mu? | Nasıl? |
|--------|--------------------|--------|
| **Teknik analiz** | **Hayır** | URL ve domain üzerinden: PhishTank API, WHOIS, SSL, TLD, homograf/typosquatting. Sayfa içeriği veya ekran görüntüsü gerekmez. |
| **Dilsel analiz** | **Evet** | Backend, girilen URL’e **HTTP isteği (GET)** atar; dönen HTML’den metin çıkarılır (BeautifulSoup). Bu metin üzerinde sosyal mühendislik anahtar kelimeleri taranır. Yani sayfa **sunucu tarafında açılıp okunuyor**. |
| **Görsel analiz** | **Evet** | Backend **headless tarayıcı** (Chrome veya Firefox) açar, URL’i yükler ve **ekran görüntüsü** alır. Bu görüntü üzerinde logo benzerliği (pHash) ve renk paleti (K-Means) hesaplanır. |

**Özet:** Dilsel ve görsel analiz için sayfa **arka planda** açılıyor: önce `requests.get(url)` ile içerik indiriliyor (dilsel), sonra Selenium ile sayfa açılıp screenshot alınıyor (görsel). Kullanıcı sadece URL’i girer; tüm erişim backend sunucusundan yapılır. Görsel analiz isteğe bağlı kapatılabiliyorsa (`include_visual: false`) yalnızca teknik + dilsel çalışır; ekran görüntüsü alınmaz.

---

## ▶️ Kullanım Videosu

Projenin kurulumu ve kullanımı için [YouTube kullanım videosu](https://www.youtube.com/watch?v=nvCZ7ITpVVM) izleyebilirsiniz.

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **Python 3.11+**
- **Chrome** (uzantı için)

### 1. Backend’i çalıştırma

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python api.py
```

Sunucu varsayılan olarak **http://127.0.0.1:8000** adresinde çalışır.

**Tablet veya telefondan (aynı WiFi):** Backend’i yerel ağda açmak için `backend` klasöründe `calistir_tablet_icin.bat` çalıştırın veya `set ENABLE_LAN=1` ile `python api.py` verin. Bilgisayarınızın IP’sini (örn. 192.168.1.5) öğrenin; tablette tarayıcıda `http://192.168.1.5:8000/docs` veya site/uzantıda API adresi olarak `http://192.168.1.5:8000` kullanın.

### 2. Kullanım seçenekleri

- **Web arayüzü:** Backend çalışırken tarayıcıda `site/index.html` açın veya [GitHub Pages](https://oguzhanbilir.github.io/guvenli_internet_asistani/) üzerinden kullanın.
- **Chrome uzantısı:** `frontend_extension` klasörünü Chrome’da “Paketlenmemiş uzantı yükle” ile ekleyin.

### 3. Backend'i Render'da çalıştırma

- **Render:** Depoyu GitHub’a atıp [Render](https://render.com) → **Blueprint** ile `render.yaml` kullanın. Backend URL’i (örn. `https://guvenli-internet-asistani-api.onrender.com`) web/uzantıda API adresi yapın.
- **Alternatif (Railway, Fly.io):** Backend’i Python web servisi olarak deploy edebilirsiniz; start komutu `uvicorn api:app --host 0.0.0.0 --port $PORT`, root `backend/`.  
Her iki durumda da tablet/telefon, siteyi nerede açarsa açsın (GitHub Pages veya yerel) backend bu public URL’e istek atar.

---

## 📁 Proje Yapısı

```
├── backend/           # API ve analiz motoru (FastAPI, Python)
├── frontend_extension/ # Chrome uzantısı (Manifest V3)
├── site/              # Web arayüzü kaynak kodu
├── docs/              # GitHub Pages için yayınlanan site
└── data/              # Örnek veri setleri
```

---

## 🔌 API

| Endpoint | Açıklama |
|----------|----------|
| `GET /health` | Sunucu sağlık kontrolü |
| `POST /analyze` | URL analizi (JSON: `{"url": "https://..."}`) |
| `/docs` | Swagger UI (interaktif API dokümantasyonu) |

**Örnek istek:**

```bash
curl -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" -d "{\"url\": \"https://example.com\"}"
```

---

## 🛠️ Kullanılan Teknolojiler

- **Backend:** Python, FastAPI, Uvicorn, Pydantic, Requests, BeautifulSoup, python-whois, Pillow, imagehash, scikit-learn
- **Frontend:** Vanilla JavaScript, Chrome Extension API (Manifest V3)
- **Analiz:** Levenshtein mesafesi, algısal hash (pHash), K-Means kümeleme, ağırlıklı sinyal puanlama

---

## 📄 Lisans ve Not

Bu proje **TÜBİTAK 2204-A Lise Öğrencileri Araştırma Projeleri** kapsamında geliştirilmiştir. Örnek veri dosyaları ve referans yapıları depoda paylaşılmaktadır.
