Türkçe | [English](readme.md)

# Güvenli İnternet Asistanı

Bir URL'yi teknik, dilsel ve görsel olmak üzere üç katmanda puanlayan oltalama (phishing) tespit sistemi. FastAPI backend, Chrome eklentisi ve web arayüzünden oluşur.

**TÜBİTAK 2204-A** · Adana bölge sergisi 2.liği (Şubat 2026)

[Web arayüzü](https://oguzhanbilir.github.io/guvenli_internet_asistani/) · [Tanıtım videosu](https://www.youtube.com/watch?v=nvCZ7ITpVVM)

## Bir URL nasıl puanlanır

Siz yalnızca URL'yi girersiniz, gerisini backend yapar.

| Katman | Sayfayı açar mı? | Kontroller |
|--------|------------------|------------|
| Teknik | Hayır | PhishTank sorgusu, URL yapısı ve şüpheli uzantılar, URL kısaltıcılar, SSL, yönlendirme zinciri, WHOIS alan adı yaşı, Unicode homograf ve ASCII benzerlikleri (`rn` → `m`, `0` → `o`), marka listesine karşı Levenshtein mesafesiyle typosquatting |
| Dilsel | Evet, `requests` ile | Sayfa metnini BeautifulSoup ile çıkarır ve sosyal mühendislik ifadelerini arar ("acil", "hesabınız askıya alındı", "ödül kazandınız") |
| Görsel | Evet, görünmez tarayıcı | Selenium ile ekran görüntüsü alır, perceptual hash ve Hamming mesafesiyle bilinen marka logolarıyla, baskın renkleri (K-Means) ise marka paletleriyle karşılaştırır |

Üç puan tek bir ağırlıklı risk puanında birleştirilir. Sayfa alınamazsa dilsel katman daha az veriyle çalışır ve karar diğer katmanlara dayanır. Görsel katman `include_visual: false` ile kapatılabilir.

[PhishTank](https://phishtank.org/) listesindeki URL'ler doğrudan tehlikeli olarak işaretlenir. Daha yüksek istek limiti için `PHISHTANK_APP_KEY` değişkenine ücretsiz bir API anahtarı girin.

## Hızlı başlangıç

Python 3.11+ ve Chrome gerekir.

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python api.py
```

API http://127.0.0.1:8000 adresinde, Swagger dokümanı `/docs` altında çalışır.

- **Web arayüzü:** backend çalışırken `site/index.html` dosyasını açın veya GitHub Pages sürümünü kullanın
- **Chrome eklentisi:** `chrome://extensions` sayfasında "Paketlenmemiş öğe yükle" ile `frontend_extension` klasörünü yükleyin
- **Aynı Wi-Fi'deki tablet veya telefondan:** `backend` içinde `calistir_tablet_icin.bat` dosyasını çalıştırın ya da `ENABLE_LAN=1` ile başlatın, sonra site veya eklentide `http://<ip-adresiniz>:8000` adresini girin
- **Yayına alma:** `render.yaml` bir Render Blueprint olarak çalışır. Railway veya Fly.io'da kök dizin `backend/` olacak şekilde `uvicorn api:app --host 0.0.0.0 --port $PORT` kullanın

## API

| Uç nokta | Görevi |
|----------|--------|
| `GET /health` | Sağlık kontrolü |
| `POST /analyze` | URL analizi, gövde `{"url": "https://..."}` |
| `/docs` | Swagger arayüzü |

```bash
curl -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" -d "{\"url\": \"https://example.com\"}"
```

## Proje yapısı

```
backend/             API ve analiz motoru (FastAPI)
frontend_extension/  Chrome eklentisi (Manifest V3)
site/                Web arayüzü kaynağı
docs/                Yayındaki GitHub Pages sitesi
data/                Örnek veri setleri
```

## Teknolojiler

Python, FastAPI, Uvicorn, Pydantic, Requests, BeautifulSoup, python-whois, Pillow, imagehash, scikit-learn, saf JavaScript, Chrome Extension API (Manifest V3).

## Emeği geçenler

TÜBİTAK 2204-A kapsamında lise öğrencileriyle geliştirildi. Danışman ve geliştirici: Oğuzhan Bilir.
