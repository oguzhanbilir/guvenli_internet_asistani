English | [Türkçe](README.tr.md)

# Secure Internet Assistant

Phishing detection that scores a URL on three layers: technical, linguistic and visual. It comes with a FastAPI backend, a Chrome extension and a web interface.

**TÜBİTAK 2204-A** · 2nd place, Adana regional exhibition (Feb 2026)

[Web interface](https://oguzhanbilir.github.io/guvenli_internet_asistani/) · [Demo video (Turkish)](https://www.youtube.com/watch?v=nvCZ7ITpVVM)

## How a URL is scored

You only enter a URL. The backend does the rest.

| Layer | Opens the page? | Checks |
|-------|-----------------|--------|
| Technical | No | PhishTank lookup, URL structure and suspicious TLDs, URL shorteners, SSL, redirect chain, WHOIS domain age, Unicode homographs and ASCII lookalikes (`rn` → `m`, `0` → `o`), typosquatting against a brand list with Levenshtein distance |
| Linguistic | Yes, with `requests` | Extracts the page text with BeautifulSoup and looks for social engineering phrases ("urgent", "your account has been suspended", "you won a prize") |
| Visual | Yes, headless browser | Takes a Selenium screenshot, compares it to known brand logos with perceptual hash and Hamming distance, and compares dominant colours (K-Means) with brand palettes |

The three scores are combined into one weighted risk score. If a page can't be fetched, the linguistic layer runs with less data and the decision leans on the other layers. The visual layer can be turned off with `include_visual: false`.

URLs listed in [PhishTank](https://phishtank.org/) are marked dangerous straight away. For a higher rate limit, set a free API key in `PHISHTANK_APP_KEY`.

## Quick start

Requires Python 3.11+ and Chrome.

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python api.py
```

The API runs at http://127.0.0.1:8000 and the Swagger docs at `/docs`.

- **Web interface:** open `site/index.html` while the backend runs, or use the GitHub Pages version
- **Chrome extension:** load `frontend_extension` with "Load unpacked" on `chrome://extensions`
- **Same Wi-Fi from a tablet or phone:** run `calistir_tablet_icin.bat` in `backend`, or start with `ENABLE_LAN=1`, then point the site or extension to `http://<your-ip>:8000`
- **Deploy:** `render.yaml` works as a Render Blueprint. On Railway or Fly.io use `uvicorn api:app --host 0.0.0.0 --port $PORT` with `backend/` as root

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `POST /analyze` | Analyse a URL, body `{"url": "https://..."}` |
| `/docs` | Swagger UI |

```bash
curl -X POST http://127.0.0.1:8000/analyze -H "Content-Type: application/json" -d "{\"url\": \"https://example.com\"}"
```

## Project structure

```
backend/             API and analysis engine (FastAPI)
frontend_extension/  Chrome extension (Manifest V3)
site/                Web interface source
docs/                Published GitHub Pages site
data/                Sample datasets
```

## Tech

Python, FastAPI, Uvicorn, Pydantic, Requests, BeautifulSoup, python-whois, Pillow, imagehash, scikit-learn, vanilla JavaScript, Chrome Extension API (Manifest V3).

## Credits

Built with high school students for TÜBİTAK 2204-A. Advisor and developer: Oğuzhan Bilir.
