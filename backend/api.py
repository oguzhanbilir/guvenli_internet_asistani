from __future__ import annotations

import logging
import sys
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

# PyInstaller için modül yolu ayarlama
import sys
import os

# PyInstaller bundle içinde mi kontrol et
if hasattr(sys, '_MEIPASS'):
    # PyInstaller bundle içinde - modül yollarını ayarla
    bundle_dir = sys._MEIPASS
    # Backend klasörünü path'e ekle
    if bundle_dir not in sys.path:
        sys.path.insert(0, bundle_dir)
    # Ayrıca mevcut dizini de ekle
    current_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else bundle_dir
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)

try:
    from analiz_motoru import analyze_url
except ImportError as e:
    # Daha detaylı hata mesajı
    import traceback
    print(f"Import hatası: {e}")
    print(f"sys.path: {sys.path}")
    print(f"sys._MEIPASS: {getattr(sys, '_MEIPASS', 'YOK')}")
    traceback.print_exc()
    raise

# Windows konsol encoding sorununu çöz
import io
if sys.platform == 'win32':
    # UTF-8 encoding ile stream handler oluştur
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.StreamHandler(sys.stderr)
    ]
)

LOGGER = logging.getLogger("guvenli_internet_asistani.api")


class AnalyzeRequest(BaseModel):
    url: HttpUrl
    include_visual: Optional[bool] = True


class AnalyzeResponse(BaseModel):
    url: HttpUrl
    guven_puani: int
    karar: str
    analiz_dokumu: Dict[str, str]
    katman_skorlari: Dict[str, float]
    detaylı_sinyaller: Dict[str, Any]


def create_app() -> FastAPI:
    app = FastAPI(
        title="Güvenli İnternet Asistanı",
        description="Dinamik Oltalama Saldırılarına Karşı Çok Katmanlı Yapay Zekâ Savunması",
        version="0.1.0",
    )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/analyze", response_model=AnalyzeResponse)
    async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
        url_str = str(request.url)
        LOGGER.info("URL analizi başlatıldı: %s", url_str)
        try:
            result = analyze_url(url_str, include_visual=request.include_visual)
            LOGGER.info("Analiz tamamlandı. Güven puanı: %s", result.get("guven_puani"))
        except Exception as exc:
            import traceback
            error_msg = str(exc)
            error_type = type(exc).__name__
            LOGGER.error("Analiz hatası: %s (%s)", error_type, error_msg)
            detail_msg = f"Analiz hatası: {error_type}"
            if error_msg:
                detail_msg += f" - {error_msg[:200]}"
            raise HTTPException(
                status_code=500,
                detail=detail_msg,
            ) from exc

        response_payload = {
            "url": request.url,
            "guven_puani": result.get("guven_puani", 0),
            "karar": result.get("karar", "Bilinmiyor"),
            "analiz_dokumu": result.get("analiz_dokumu", {}),
            "katman_skorlari": result.get("katman_skorlari", {}),
            "detaylı_sinyaller": result.get("detaylı_sinyaller", {}),
        }
        return AnalyzeResponse(**response_payload)

    @app.get("/health")
    async def healthcheck() -> Dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

try:
    from analiz_motoru import load_brand_data
    brand_data = load_brand_data()
    LOGGER.info(f"Brand data yüklendi: {len(brand_data)} marka")
except Exception as e:
    LOGGER.warning(f"Brand data yüklenemedi: {e}")

if __name__ == "__main__":
    import os
    import uvicorn
    import traceback
    import sys

    try:
        import socket
        
        # Render.com ve diğer cloud servisler için PORT environment variable'ını kullan
        base_port = int(os.environ.get("PORT", 8000))
        
        # Port kullanılabilir mi kontrol et
        def is_port_available(port):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(('127.0.0.1', port))
                    return True
                except OSError:
                    return False
        
        # Port kullanılabilir değilse alternatif port dene
        port = base_port
        max_attempts = 10
        attempt = 0
        
        while not is_port_available(port) and attempt < max_attempts:
            attempt += 1
            port = base_port + attempt
            if port > 65535:
                port = 8000 + attempt
        
        if not is_port_available(port):
            print("=" * 60)
            print("HATA: Uygun port bulunamadı!")
            print("=" * 60)
            print(f"Port {base_port} ve alternatifleri kullanımda.")
            print("Lütfen:")
            print("1. Başka bir backend sunucusu çalıştırıyorsanız kapatın")
            print("2. Port kullanan diğer programları kontrol edin")
            print("3. Bilgisayarı yeniden başlatmayı deneyin")
            print("=" * 60)
            sys.stdout.flush()
            input("Kapatmak için Enter tuşuna basın...")
            sys.exit(1)
        
        if port != base_port:
            print("=" * 60)
            print("UYARI: Port 8000 kullanımda!")
            print(f"Alternatif port kullanılıyor: {port}")
            print("=" * 60)
            print()
        
        print("=" * 60)
        print("Güvenli İnternet Asistanı Backend Sunucusu")
        print("=" * 60)
        print(f"Sunucu başlatılıyor: http://127.0.0.1:{port}")
        print("Durdurmak için CTRL+C tuşlarına basın")
        print("=" * 60)
        print()
        
        # Konsol penceresinin açık kalması için
        sys.stdout.flush()
        sys.stderr.flush()
        
        # PyInstaller için app objesini direkt kullan
        uvicorn.run(
            app,  # Modül string yerine app objesi
            host="127.0.0.1",
            port=port,
            reload=False,
        )
    except KeyboardInterrupt:
        print("\n\nSunucu kapatılıyor...")
        sys.stdout.flush()
        input("Kapatmak için Enter tuşuna basın...")
    except Exception as e:
        print("\n" + "=" * 60)
        print("HATA: Sunucu başlatılamadı!")
        print("=" * 60)
        print(f"Hata türü: {type(e).__name__}")
        print(f"Hata mesajı: {str(e)}")
        print("\nDetaylı hata bilgisi:")
        traceback.print_exc()
        print("\n" + "=" * 60)
        sys.stdout.flush()
        sys.stderr.flush()
        print("Bu pencereyi kapatmak için Enter tuşuna basın...")
        try:
            input()
        except:
            import time
            time.sleep(5)


