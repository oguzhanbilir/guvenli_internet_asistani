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
  <a href="#-hızlı-başlangıç">Kurulum</a>
  &nbsp;•&nbsp;
  <a href="#-proje-yapısı">Yapı</a>
</p>

---

## 📌 Proje Hakkında

Güvenli İnternet Asistanı, **teknik**, **dilsel** ve **görsel** analiz katmanlarını bir araya getiren hibrit bir güvenlik sistemidir. URL yapısı, metin içeriği ve görsel taklit (marka logoları) analizi ile hem geleneksel hem de gelişmiş oltalama saldırılarına karşı koruma sağlar.

| Özellik | Açıklama |
|--------|----------|
| 🔧 **Teknik analiz** | URL yapısı, SSL, yönlendirme, homografik karakterler |
| 📝 **Dilsel analiz** | Sosyal mühendislik metin tespiti |
| 👁️ **Görsel analiz** | Logo benzerliği (pHash), marka taklidi tespiti |

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

### 2. Kullanım seçenekleri

- **Web arayüzü:** Backend çalışırken tarayıcıda `site/index.html` açın veya [GitHub Pages](https://oguzhanbilir.github.io/guvenli_internet_asistani/) üzerinden kullanın.
- **Chrome uzantısı:** `frontend_extension` klasörünü Chrome’da “Paketlenmemiş uzantı yükle” ile ekleyin.

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
