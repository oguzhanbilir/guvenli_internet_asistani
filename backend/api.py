from __future__ import annotations

import logging
import sys
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from analiz_motoru import analyze_url

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
    import uvicorn

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )


