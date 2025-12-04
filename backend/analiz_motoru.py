from __future__ import annotations

import json
import logging
import math
import os
import ssl
import statistics
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

try:
    import whois
except ImportError:
    whois = None

try:
    from Levenshtein import distance as levenshtein_distance
except ImportError:
    levenshtein_distance = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.firefox.options import Options as FirefoxOptions
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException
except ImportError:
    webdriver = None
    ChromeOptions = None
    FirefoxOptions = None
    By = None
    WebDriverException = Exception

try:
    import imagehash
except ImportError:
    imagehash = None

try:
    import numpy as np
    from sklearn.cluster import KMeans
except ImportError:
    np = None
    KMeans = None


LOGGER = logging.getLogger(__name__)

@dataclass
class AnalysisSignal:
    name: str
    value: Any
    weight: float
    risk_score: float
    details: str


@dataclass
class AnalysisResult:
    technical_signals: List[AnalysisSignal] = field(default_factory=list)
    linguistic_signals: List[AnalysisSignal] = field(default_factory=list)
    visual_signals: List[AnalysisSignal] = field(default_factory=list)

    def aggregate_score(self) -> Tuple[float, Dict[str, float]]:
        layer_scores = {}
        total_weight = 0.0
        weighted_sum = 0.0

        for label, signals in [
            ("teknik", self.technical_signals),
            ("dilsel", self.linguistic_signals),
            ("gorsel", self.visual_signals),
        ]:
            if not signals:
                continue
            layer_weight = sum(sig.weight for sig in signals)
            layer_risk = (
                sum(sig.risk_score * sig.weight for sig in signals) / layer_weight
                if layer_weight
                else 0.0
            )
            layer_scores[label] = layer_risk
            total_weight += layer_weight
            weighted_sum += layer_risk * layer_weight

        overall = weighted_sum / total_weight if total_weight else 0.0
        return overall, layer_scores



SUSPICIOUS_TLDS = {
    "xyz",
    "top",
    "live",
    "club",
    "work",
    "shop",
    "info",
    "click",
    "country",
    "download",
}

URL_SHORTENING_SERVICES = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
    "short.link", "cutt.ly", "rebrand.ly", "shorturl.at", "v.gd", "qr.net",
    "adf.ly", "bc.vc", "ouo.io", "shorte.st", "linkbucks.com", "adfly.com",
    "urli.info", "tiny.cc", "short.cm", "bit.do", "shorten.at", "clicky.me",
    "short.io", "s.id", "tiny.one", "shrtco.de", "short.link", "rebrandly.com"
}

HOMOGRAPH_CHARS = {
    'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O',
    'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X'
}

SOCIAL_ENGINEERING_KEYWORDS = [
    "acil",
    "hemen",
    "hesabınız askıya alındı",
    "şifreniz sıfırlandı",
    "ödül kazandınız",
    "şimdi giriş yapın",
    "doğrulama gerekli",
    "hesabınız kapatılacak",
    "limitiniz doldu",
    "ödeme reddedildi",
]

def get_resource_path(relative_path: str) -> str:
    try:
        base_path = sys._MEIPASS
    except AttributeError:
        base_path = os.path.dirname(__file__)
    return os.path.join(base_path, relative_path)

DEFAULT_BRAND_DATA_PATH = get_resource_path("backend/brand_data.json")
if not os.path.exists(DEFAULT_BRAND_DATA_PATH):
    DEFAULT_BRAND_DATA_PATH = get_resource_path("brand_data.json")
LOGO_SIMILARITY_ALERT_THRESHOLD = 0.8
PALETTE_SIMILARITY_ALERT_THRESHOLD = 0.75


def normalize_score(value: float, min_value: float, max_value: float) -> float:
    if max_value - min_value == 0:
        return 0.0
    clipped = max(min_value, min(max_value, value))
    return (clipped - min_value) / (max_value - min_value)


def safe_log(message: str) -> None:
    LOGGER.debug(message)


def normalize_whois_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, list):
        for item in value:
            normalized = normalize_whois_datetime(item)
            if normalized:
                return normalized
        return None

    if isinstance(value, datetime):
        if value.tzinfo is not None and value.tzinfo.utcoffset(value) is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    return None


def load_brand_data(path: str = DEFAULT_BRAND_DATA_PATH) -> List[Dict[str, Any]]:
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data:
                    return data
        except (json.JSONDecodeError, OSError):
            pass
    
    alternative_paths = [
        get_resource_path("brand_data.json"),
        get_resource_path("backend/brand_data.json"),
        os.path.join(os.path.dirname(__file__), "brand_data.json"),
    ]
    
    for alt_path in alternative_paths:
        if alt_path == path:
            continue
        if os.path.exists(alt_path):
            try:
                with open(alt_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data:
                        return data
            except (json.JSONDecodeError, OSError):
                pass
    
    return []


def get_domain(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc.lower()


def get_tld(domain: str) -> str:
    return domain.split(".")[-1]


def check_https(url: str) -> bool:
    return urlparse(url).scheme.lower() == "https"


def extract_brand_name_from_domain(domain: str) -> str:
    domain = domain.lower().replace("www.", "").replace("www2.", "").replace("www3.", "")
    parts = domain.split(".")
    if len(parts) > 1:
        return parts[0]
    return domain


def detect_site_type(url: str, domain: str, page_text: str = "") -> str:
    domain_lower = domain.lower()
    text_lower = page_text.lower() if page_text else ""
    
    news_indicators = [
        "haber", "news", "gazete", "mynet", "hurriyet", "sabah", "milliyet",
        "cnn", "bbc", "ntv", "haberturk", "ensonhaber", "sozcu", "cumhuriyet"
    ]
    
    ecommerce_indicators = [
        "sahibinden", "n11", "gittigidiyor", "hepsiburada", "trendyol",
        "amazon", "ebay", "alibaba", "etsy"
    ]
    
    bank_indicators = [
        "bank", "banka", "isbank", "ziraat", "garanti", "akbank", "yapikredi"
    ]
    
    for indicator in news_indicators:
        if indicator in domain_lower or indicator in text_lower[:500]:  # İlk 500 karakter
            return "haber"
    
    for indicator in ecommerce_indicators:
        if indicator in domain_lower:
            return "e-ticaret"
    
    for indicator in bank_indicators:
        if indicator in domain_lower:
            return "banka"
    
    return "bilinmeyen"


def compute_linguistic_score(keyword_hits: Dict[str, int]) -> Tuple[int, float]:
    total_hits = sum(keyword_hits.values())
    score = normalize_score(total_hits, 0, 10)
    return total_hits, score


def calculate_logo_similarity(screenshot_path: str, logo_entries: List[Dict[str, Any]]) -> Tuple[float, Optional[str]]:
    if imagehash is None or Image is None:
        return 0.0, None

    try:
        screenshot = Image.open(screenshot_path)
        screenshot_hash = imagehash.phash(screenshot)
    except (OSError, ValueError) as exc:
        LOGGER.error("Screenshot hash hesaplanamadı: %s", exc)
        return 0.0, None

    if not logo_entries:
        return 0.0, None

    distances = []
    for entry in logo_entries:
        try:
            hash_value = entry.get("logo_hash")
            if not hash_value:
                continue
            reference_hash = imagehash.hex_to_hash(hash_value)
            distances.append((screenshot_hash - reference_hash, entry.get("name")))
        except ValueError:
            continue

    if not distances:
        return 0.0, None

    min_distance, brand_name = min(distances, key=lambda item: item[0])
    max_hash_dist = 64  # phash 64-bit sonuç döndürür
    similarity = 1 - (min_distance / max_hash_dist)
    return max(0.0, min(1.0, similarity)), brand_name


def extract_dominant_colors(image_path: str, clusters: int = 5) -> List[Tuple[int, int, int]]:
    if Image is None or np is None or KMeans is None:
        return []

    try:
        img = Image.open(image_path).convert("RGB")
    except OSError:
        return []

    img = img.resize((200, 200))
    pixels = np.array(img).reshape(-1, 3)

    kmeans = KMeans(n_clusters=min(clusters, len(pixels)), n_init=10)
    kmeans.fit(pixels)
    centers = kmeans.cluster_centers_.astype(int)
    return [tuple(map(int, center)) for center in centers]


def compare_color_palettes(palette_a: List[Tuple[int, int, int]], palette_b: List[Tuple[int, int, int]]) -> float:
    if not palette_a or not palette_b or np is None:
        return 0.0

    arr_a = np.array(palette_a)
    arr_b = np.array(palette_b)
    min_len = min(len(arr_a), len(arr_b))
    arr_a = arr_a[:min_len]
    arr_b = arr_b[:min_len]
    distances = np.linalg.norm(arr_a - arr_b, axis=1)
    max_distance = math.sqrt(255**2 * 3)
    similarities = 1 - (distances / max_distance)
    return float(np.mean(np.clip(similarities, 0, 1)))


def technical_analysis(url: str, brand_data: List[Dict[str, Any]]) -> List[AnalysisSignal]:
    signals: List[AnalysisSignal] = []
    domain = get_domain(url)
    tld = get_tld(domain)
    domain_age_days = None
    domain_is_young = False
    whois_data = None
    if whois is None:
        detail = "python-whois kütüphanesi mevcut değil."
        risk_score = 0.5
    else:
        try:
            import threading
            whois_result = [None]
            whois_error = [None]
            
            def whois_query():
                try:
                    whois_result[0] = whois.whois(domain)
                except Exception as e:
                    whois_error[0] = e
            
            thread = threading.Thread(target=whois_query)
            thread.daemon = True
            thread.start()
            thread.join(timeout=2)
            
            if thread.is_alive():
                risk_score = 0.5
                detail = "WHOIS sorgusu zaman aşımına uğradı."
            elif whois_error[0]:
                raise whois_error[0]
            else:
                whois_data = whois_result[0]
                creation_date = normalize_whois_datetime(getattr(whois_data, "creation_date", None))
                if not creation_date:
                    for attr in ("registered_on", "created", "creationdate"):
                        creation_date = normalize_whois_datetime(getattr(whois_data, attr, None))
                        if creation_date:
                            break

                if creation_date:
                    domain_age_days = (datetime.utcnow() - creation_date).days
                    domain_is_young = domain_age_days < 90
                    risk_score = 1.0 if domain_is_young else 0.1
                    detail = f"Alan adı yaşı {domain_age_days} gün."
                else:
                    risk_score = 0.4
                    detail = "Creation date bilgisi mevcut değil."
        except Exception as exc:
            LOGGER.warning("WHOIS sorgusu başarısız: %s", exc)
            risk_score = 0.5
            detail = f"WHOIS hatası: {exc}"

    signals.append(
        AnalysisSignal(
            name="domain_yasi",
            value=domain_age_days,
            weight=1.5,
            risk_score=risk_score,
            details=detail,
        )
    )

    if whois is not None:
        expiration_date = None
        if whois_data:
            for attr in ("expiration_date", "expires", "expiry_date", "registry_expiry_date"):
                expiration_date = normalize_whois_datetime(getattr(whois_data, attr, None))
                if expiration_date:
                    break

        if expiration_date:
            days_to_expiry = (expiration_date - datetime.utcnow()).days
            if days_to_expiry < 0:
                exp_risk = 1.0
                exp_detail = f"Alan adı süresi {abs(days_to_expiry)} gün önce dolmuş."
            elif days_to_expiry <= 30:
                exp_risk = 0.8
                exp_detail = f"Alan adı {days_to_expiry} gün içinde yenilenmeli."
            elif days_to_expiry <= 90:
                exp_risk = 0.5
                exp_detail = f"Alan adı {days_to_expiry} gün içinde yenilenmeli."
            else:
                exp_risk = 0.2
                exp_detail = f"Alan adı {days_to_expiry} gün sonra yenilenecek."

            signals.append(
                AnalysisSignal(
                    name="domain_vadesi",
                    value=days_to_expiry,
                    weight=0.8,
                    risk_score=exp_risk,
                    details=exp_detail,
                )
            )

    tld_is_suspicious = tld in SUSPICIOUS_TLDS
    signals.append(
        AnalysisSignal(
            name="supheli_tld",
            value=tld,
            weight=1.2,
            risk_score=1.0 if tld_is_suspicious else 0.0,
            details=f"TLD {tld} {'şüpheli' if tld_is_suspicious else 'normal'}.",
        )
    )

    uses_https = check_https(url)
    signals.append(
        AnalysisSignal(
            name="https_kullanimi",
            value=uses_https,
            weight=0.7,
            risk_score=0.9 if not uses_https else 0.1,
            details="HTTPS kullanılıyor." if uses_https else "HTTPS kullanılmıyor.",
        )
    )

    typo_risk_score = 0.0
    typo_detail = "Typosquatting analizi yapılamadı."
    if levenshtein_distance is None:
        typo_detail = "python-levenshtein kütüphanesi eksik."
        typo_risk_score = 0.5
    else:
        lowered = domain.lower()
        domain_parts = lowered.split(".")
        domain_main = domain_parts[0] if domain_parts else lowered
        analyzed_brand_name = extract_brand_name_from_domain(domain)
        
        exact_match = False
        parent_domain_match = False
        domain_parts_list = lowered.split(".")
        cleaned_lowered = lowered.replace("www.", "")
        
        for entry in brand_data:
            legit_domain = entry.get("domain", "").lower()
            if not legit_domain:
                continue
            
            cleaned_legit = legit_domain.replace("www.", "")
            
            if legit_domain == lowered or cleaned_legit == cleaned_lowered:
                exact_match = True
                break
            
            if len(domain_parts_list) > 2:
                parent_domain = ".".join(domain_parts_list[-2:])
                parent_domain_www = "www." + parent_domain
                
                if cleaned_legit == parent_domain:
                    parent_domain_match = True
                    break
                
                if legit_domain == parent_domain or legit_domain == parent_domain_www:
                    parent_domain_match = True
                    break
            
            if cleaned_legit in cleaned_lowered:
                if cleaned_lowered.endswith("." + cleaned_legit) or cleaned_lowered == cleaned_legit:
                    parent_domain_match = True
                    break
        
        min_distance = None
        most_similar = None
        substring_match = False
        substring_brand = None
        
        if not parent_domain_match and len(domain_parts_list) > 2:
            parent_domain_simple = ".".join(domain_parts_list[-2:])
            for entry in brand_data:
                legit_domain = entry.get("domain", "").lower()
                if not legit_domain:
                    continue
                cleaned_legit_temp = legit_domain.replace("www.", "")
                if cleaned_legit_temp == parent_domain_simple:
                    parent_domain_match = True
                    break
        
        if exact_match or parent_domain_match:
            typo_risk_score = 0.0
            if exact_match:
                typo_detail = "Analiz edilen domain bilgi bankasındaki bir domain ile tam eşleşiyor."
            else:
                typo_detail = "Analiz edilen domain, bilgi bankasındaki bir domain'in alt domain'i (resmi domain)."
        else:
            for entry in brand_data:
                legit_domain = entry.get("domain", "").lower()
                if not legit_domain:
                    continue
                
                cleaned_legit_check = legit_domain.replace("www.", "")
                legit_domain_parts = legit_domain.split(".")
                
                if len(domain_parts_list) > len(legit_domain_parts):
                    parent_check = ".".join(domain_parts_list[-len(legit_domain_parts):])
                    if (legit_domain == parent_check or cleaned_legit_check == parent_check or
                        legit_domain in lowered and lowered.endswith(legit_domain) or
                        cleaned_legit_check in cleaned_lowered and cleaned_lowered.endswith("." + cleaned_legit_check)):
                        continue
                
                if len(domain_parts_list) > 2:
                    simple_parent = ".".join(domain_parts_list[-2:])
                    if cleaned_legit_check == simple_parent:
                        continue
                
                brand_name = extract_brand_name_from_domain(legit_domain)
                
                if brand_name and len(brand_name) >= 4:
                    if brand_name in domain_main or brand_name in lowered:
                        substring_match = True
                        substring_brand = entry.get("name", brand_name)
                        break
            
            if not substring_match:
                for entry in brand_data:
                    legit_domain = entry.get("domain", "").lower()
                    if not legit_domain:
                        continue
                    
                    brand_name = extract_brand_name_from_domain(legit_domain)
                    
                    if analyzed_brand_name and brand_name and len(brand_name) >= 4:
                        dist_brand = levenshtein_distance(analyzed_brand_name, brand_name)
                        
                        if analyzed_brand_name[0] != brand_name[0]:
                            # İlk karakter farklıysa, mesafeyi artır (daha az risk)
                            dist_brand += 2
                        elif len(analyzed_brand_name) >= 2 and len(brand_name) >= 2:
                            if analyzed_brand_name[:2] != brand_name[:2]:
                                # İlk 2 karakter farklıysa, mesafeyi artır
                                dist_brand += 1
                        
                        dist = dist_brand
                    else:
                        # Tam domain karşılaştırması (fallback)
                        dist = levenshtein_distance(lowered, legit_domain)
                    
                    # Sadece gerçekten benzer olanları dikkate al (mesafe <= 2)
                    # Mesafe 3'ten büyükse farklı markalar olabilir
                    if dist <= 2:
                        if min_distance is None or dist < min_distance:
                            min_distance = dist
                            most_similar = legit_domain
        
        # Sonuç değerlendirmesi
        if substring_match:
            # Substring eşleşmesi bulundu - YÜKSEK RİSK
            typo_risk_score = 0.95  # Çok yüksek risk
            typo_detail = f"Domain içinde '{substring_brand}' marka adı geçiyor (substring eşleşmesi)."
        elif min_distance is not None:
            if min_distance == 0:
                typo_risk_score = 0.0
                typo_detail = "Analiz edilen domain bilgi bankasındaki bir domain ile tam eşleşiyor."
            else:
                # Levenshtein mesafesine göre risk hesapla
                typo_risk_score = normalize_score(2 - min_distance, -5, 2)
                typo_detail = (
                    f"En benzer domain {most_similar} (mesafe={min_distance})."
                )
        else:
            typo_risk_score = 0.0
            typo_detail = "Karşılaştırma yapılacak marka bulunamadı."

    signals.append(
        AnalysisSignal(
            name="typosquatting",
            value=typo_risk_score,
            weight=1.5,
            risk_score=typo_risk_score,
            details=typo_detail,
        )
    )

    url_length = len(url)
    if url_length > 200:
        url_risk = 0.6
        url_detail = f"URL çok uzun ({url_length} karakter). Oltalama saldırılarında uzun URL'ler kullanılabilir."
    elif url_length > 100:
        url_risk = 0.3
        url_detail = f"URL uzunluğu {url_length} karakter."
    else:
        url_risk = 0.1
        url_detail = f"URL uzunluğu {url_length} karakter (normal)."
    
    signals.append(
        AnalysisSignal(
            name="url_uzunlugu",
            value=url_length,
            weight=0.5,
            risk_score=url_risk,
            details=url_detail,
        )
    )

    parsed = urlparse(url)
    hostname = parsed.netloc.lower()
    subdomain_count = hostname.count(".") - 1  # TLD için bir nokta çıkar
    if subdomain_count < 0:
        subdomain_count = 0
    
    if subdomain_count > 3:
        subdomain_risk = 0.7
        subdomain_detail = f"Çok fazla subdomain ({subdomain_count} adet). Şüpheli olabilir."
    elif subdomain_count > 1:
        subdomain_risk = 0.3
        subdomain_detail = f"Subdomain sayısı: {subdomain_count}."
    else:
        subdomain_risk = 0.1
        subdomain_detail = f"Subdomain sayısı: {subdomain_count} (normal)."
    
    signals.append(
        AnalysisSignal(
            name="subdomain_sayisi",
            value=subdomain_count,
            weight=0.6,
            risk_score=subdomain_risk,
            details=subdomain_detail,
        )
    )

    domain_length = len(domain)
    if domain_length > 50:
        domain_risk = 0.6
        domain_detail = f"Domain çok uzun ({domain_length} karakter). Şüpheli olabilir."
    elif domain_length > 30:
        domain_risk = 0.3
        domain_detail = f"Domain uzunluğu {domain_length} karakter."
    else:
        domain_risk = 0.1
        domain_detail = f"Domain uzunluğu {domain_length} karakter (normal)."
    
    signals.append(
        AnalysisSignal(
            name="domain_uzunlugu",
            value=domain_length,
            weight=0.5,
            risk_score=domain_risk,
            details=domain_detail,
        )
    )

    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80
        port_detail = f"Varsayılan port kullanılıyor ({port})."
        port_risk = 0.1
    elif port not in [80, 443, 8080, 8443]:
        port_detail = f"Standart olmayan port kullanılıyor ({port}). Şüpheli olabilir."
        port_risk = 0.5
    else:
        port_detail = f"Port: {port} (standart)."
        port_risk = 0.1
    
    signals.append(
        AnalysisSignal(
            name="port_numarasi",
            value=port,
            weight=0.4,
            risk_score=port_risk,
            details=port_detail,
        )
    )

    path = parsed.path
    path_length = len(path)
    if path_length > 100:
        path_risk = 0.5
        path_detail = f"Path çok uzun ({path_length} karakter). Şüpheli olabilir."
    elif path_length > 50:
        path_risk = 0.3
        path_detail = f"Path uzunluğu {path_length} karakter."
    else:
        path_risk = 0.1
        path_detail = f"Path uzunluğu {path_length} karakter (normal)."
    
    signals.append(
        AnalysisSignal(
            name="path_uzunlugu",
            value=path_length,
            weight=0.4,
            risk_score=path_risk,
            details=path_detail,
        )
    )

    query = parsed.query
    if query:
        query_params = len(query.split("&"))
        if query_params > 10:
            query_risk = 0.5
            query_detail = f"Çok fazla query parametresi ({query_params} adet). Şüpheli olabilir."
        elif query_params > 5:
            query_risk = 0.3
            query_detail = f"Query parametre sayısı: {query_params}."
        else:
            query_risk = 0.1
            query_detail = f"Query parametre sayısı: {query_params} (normal)."
    else:
        query_params = 0
        query_risk = 0.1
        query_detail = "Query parametresi yok (normal)."
    
    signals.append(
        AnalysisSignal(
            name="query_parametre_sayisi",
            value=query_params,
            weight=0.3,
            risk_score=query_risk,
            details=query_detail,
        )
    )

    hostname_lower = hostname.lower() if isinstance(hostname, str) else str(hostname).lower()
    is_shortened = hostname_lower in URL_SHORTENING_SERVICES
    
    if not is_shortened:
        is_shortened = any(shortener in hostname_lower for shortener in URL_SHORTENING_SERVICES)
    
    if is_shortened:
        shortening_risk = 0.8
        shortening_detail = f"URL kısaltma servisi kullanılıyor ({hostname_lower}). Oltalama saldırılarında sık kullanılır!"
    else:
        shortening_risk = 0.1
        shortening_detail = f"URL kısaltma servisi kullanılmıyor (normal). Kontrol edilen domain: {hostname_lower}"
    
    signals.append(
        AnalysisSignal(
            name="url_kisaltma_servisi",
            value=is_shortened,
            weight=1.0,
            risk_score=shortening_risk,
            details=shortening_detail,
        )
    )

    homograph_count = 0
    for char in domain:
        if char in HOMOGRAPH_CHARS:
            homograph_count += 1
    
    if homograph_count > 0:
        homograph_risk = min(0.9, 0.3 + (homograph_count * 0.2))
        homograph_detail = f"Homograph karakter tespit edildi ({homograph_count} adet). Benzer görünen karakterler oltalama saldırılarında kullanılabilir!"
    else:
        homograph_risk = 0.1
        homograph_detail = "Homograph karakter tespit edilmedi (normal)."
    
    signals.append(
        AnalysisSignal(
            name="homograph_karakter",
            value=homograph_count,
            weight=1.2,
            risk_score=homograph_risk,
            details=homograph_detail,
        )
    )

    try:
        import socket
        import ssl as ssl_module
        
        if parsed.scheme == "https":
            host = parsed.hostname or domain
            port = parsed.port or 443
            
            try:
                context = ssl_module.create_default_context()
                with socket.create_connection((host, port), timeout=5) as sock:
                    with context.wrap_socket(sock, server_hostname=host) as ssock:
                        cert = ssock.getpeercert()
                        not_after = cert.get('notAfter')
                        if not_after:
                            expire_date = datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                            days_until_expiry = (expire_date - datetime.utcnow()).days
                            
                            if days_until_expiry < 0:
                                ssl_risk = 0.9
                                ssl_detail = f"SSL sertifikası süresi dolmuş ({abs(days_until_expiry)} gün önce)."
                            elif days_until_expiry < 30:
                                ssl_risk = 0.7
                                ssl_detail = f"SSL sertifikası yakında dolacak ({days_until_expiry} gün)."
                            else:
                                ssl_risk = 0.1
                                ssl_detail = f"SSL sertifikası geçerli ({days_until_expiry} gün sonra dolacak)."
                        else:
                            ssl_risk = 0.5
                            ssl_detail = "SSL sertifika bilgisi alınamadı."
                        
                        issuer = cert.get('issuer', [])
                        is_self_signed = any('self' in str(item).lower() for item in issuer) or len(issuer) == 0
                        if is_self_signed:
                            ssl_risk = max(ssl_risk, 0.8)
                            ssl_detail += " Self-signed sertifika tespit edildi (şüpheli)."
                        
            except (socket.timeout, socket.gaierror, ssl_module.SSLError, Exception) as e:
                ssl_risk = 0.6
                ssl_detail = f"SSL sertifika kontrolü yapılamadı: {str(e)[:50]}"
        else:
            ssl_risk = 0.9
            ssl_detail = "HTTPS kullanılmıyor (SSL sertifikası yok)."
        
        signals.append(
            AnalysisSignal(
                name="ssl_sertifika_analizi",
                value=ssl_risk,
                weight=1.3,
                risk_score=ssl_risk,
                details=ssl_detail,
            )
        )
    except ImportError:
        pass
    try:
        import time
        redirect_chain = [url]
        visited_urls = set([url])
        start_time = time.time()
        max_redirect_time = 8
        try:
            response = requests.head(url, timeout=3, allow_redirects=False)
        except Exception:
            try:
                response = requests.get(url, timeout=3, allow_redirects=False, stream=True)
            except Exception as e:
                LOGGER.warning(f"İlk request başarısız: {e}")
                response = None
        
        if not response:
            redirect_count = 0
            redirect_detail = "Redirect analizi yapılamadı (bağlantı hatası)."
            redirect_risk = 0.3
        else:
            redirect_count = 0
            max_redirects = 8
            current_url = url
            
            while redirect_count < max_redirects:
                if time.time() - start_time > max_redirect_time:
                    LOGGER.warning(f"Redirect takibi timeout: {max_redirect_time} saniye aşıldı")
                    break
                
                if response.status_code in [301, 302, 303, 307, 308]:
                    redirect_count += 1
                    location = response.headers.get('Location', '')
                    
                    if not location:
                        location = response.headers.get('location', '')
                    
                    if not location:
                        break
                    
                    if location.startswith('/'):
                        from urllib.parse import urljoin
                        current_url = urljoin(current_url, location)
                    elif not location.startswith('http'):
                        from urllib.parse import urljoin
                        current_url = urljoin(current_url, '/' + location.lstrip('/'))
                    else:
                        current_url = location
                    
                    if current_url in visited_urls:
                        LOGGER.warning(f"Döngüsel redirect tespit edildi: {current_url}")
                        break
                    
                    visited_urls.add(current_url)
                    redirect_chain.append(current_url)
                    
                    try:
                        try:
                            response = requests.head(current_url, timeout=2, allow_redirects=False)
                        except Exception:
                            response = requests.get(current_url, timeout=2, allow_redirects=False, stream=True)
                    except Exception as e:
                        LOGGER.warning(f"Redirect takibi başarısız: {e}")
                        break
                else:
                    break
        
        if redirect_count > 0:
            redirect_detail_parts = [f"Redirect zinciri ({redirect_count} adet):"]
            for i, redirect_url in enumerate(redirect_chain, 1):
                redirect_detail_parts.append(f"{i}. {redirect_url}")
            
            redirect_detail = "\n".join(redirect_detail_parts)
            
            if redirect_count > 3:
                redirect_risk = 0.7
                redirect_detail += "\n⚠️ Çok fazla redirect! Oltalama saldırılarında kullanılabilir!"
            elif redirect_count > 1:
                redirect_risk = 0.4
                redirect_detail += "\n⚠️ Birden fazla redirect tespit edildi."
            else:
                redirect_risk = 0.2
                redirect_detail += "\n✅ Tek bir redirect (normal)."
        else:
            redirect_risk = 0.1
            redirect_detail = "Redirect yok (normal)."
            redirect_chain = [url]
        
        signals.append(
            AnalysisSignal(
                name="redirect_sayisi",
                value=redirect_count,
                weight=0.8,
                risk_score=redirect_risk,
                details=redirect_detail,
            )
        )
        signals.append(
            AnalysisSignal(
                name="redirect_zinciri",
                value=redirect_chain,  # Liste olarak kaydet
                weight=0.5,
                risk_score=redirect_risk,
                details=f"Toplam {len(redirect_chain)} URL: " + " → ".join(redirect_chain),
            )
        )
    except Exception as e:
        LOGGER.warning("Redirect analizi yapılamadı: %s", e)

    return signals


def linguistic_analysis(url: str) -> List[AnalysisSignal]:
    signals: List[AnalysisSignal] = []
    domain = get_domain(url)

    try:
        response = requests.get(url, timeout=5, stream=True)
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.warning("Metin analizi için içerik alınamadı: %s", exc)
        signals.append(
            AnalysisSignal(
                name="icerik_indirme",
                value=False,
                weight=1.0,
                risk_score=0.6,
                details=f"İçerik indirilemedi: {exc}",
            )
        )
        return signals

    soup = BeautifulSoup(response.text, "html.parser")
    texts = " ".join(soup.stripped_strings).lower()
    site_type = detect_site_type(url, domain, texts)
    
    keyword_hits: Dict[str, int] = {}
    for keyword in SOCIAL_ENGINEERING_KEYWORDS:
        keyword_hits[keyword] = texts.count(keyword)

    if site_type == "haber":
        adjusted_hits = keyword_hits.copy()
        adjusted_hits["acil"] = 0
        adjusted_hits["hemen"] = 0
        total_hits = sum(adjusted_hits.values())
        score = normalize_score(total_hits, 0, 10) * 0.5
        details = f"Anahtar kelime eşleşmeleri: {keyword_hits} (Site türü: {site_type}, 'acil' ve 'hemen' normal sayıldı)"
    else:
        total_hits, score = compute_linguistic_score(keyword_hits)
        details = f"Anahtar kelime eşleşmeleri: {keyword_hits}"

    signals.append(
        AnalysisSignal(
            name="anahtar_kelime_intensitesi",
            value=total_hits if site_type == "haber" else sum(keyword_hits.values()),
            weight=1.3 if site_type != "haber" else 0.8,
            risk_score=score,
            details=details,
        )
    )

    return signals


def setup_webdriver(preferred: str = "chrome"):
    if webdriver is None:
        raise RuntimeError("Selenium paketleri kurulu değil.")

    driver = None
    errors: List[str] = []

    if preferred == "chrome" and ChromeOptions is not None:
        try:
            options = ChromeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--no-sandbox")
            driver = webdriver.Chrome(options=options)
        except WebDriverException as exc:
            errors.append(f"Chrome başlatılamadı: {exc}")

    if driver is None and FirefoxOptions is not None:
        try:
            options = FirefoxOptions()
            options.add_argument("-headless")
            driver = webdriver.Firefox(options=options)
        except WebDriverException as exc:
            errors.append(f"Firefox başlatılamadı: {exc}")

    if driver is None:
        raise RuntimeError("; ".join(errors) if errors else "Webdriver bulunamadı.")

    driver.set_page_load_timeout(8)
    driver.implicitly_wait(2)
    return driver


def capture_screenshot(url: str, output_path: str) -> bool:
    if webdriver is None:
        LOGGER.warning("Selenium mevcut değil, ekran görüntüsü alınamadı.")
        return False

    try:
        driver = setup_webdriver()
    except RuntimeError as exc:
        LOGGER.error("Webdriver kurulamadı: %s", exc)
        return False

    try:
        import threading
        
        screenshot_success = [False]
        screenshot_error = [None]
        driver_ref = [driver]
        
        def take_screenshot():
            try:
                driver_ref[0].get(url)
                time.sleep(0.3)
                width = driver_ref[0].execute_script("return document.body.scrollWidth")
                height = driver_ref[0].execute_script("return document.body.scrollHeight")
                driver_ref[0].set_window_size(width or 1920, height or 1080)
                driver_ref[0].save_screenshot(output_path)
                screenshot_success[0] = True
            except Exception as e:
                screenshot_error[0] = e
        
        thread = threading.Thread(target=take_screenshot)
        thread.daemon = True
        thread.start()
        thread.join(timeout=12)
        
        if thread.is_alive():
            LOGGER.warning("Screenshot alma timeout: 12 saniye aşıldı")
            try:
                driver_ref[0].quit()
            except Exception:
                pass
            return False
        
        if screenshot_error[0]:
            raise screenshot_error[0]
        
        return screenshot_success[0]
    except (WebDriverException, TimeoutError, Exception) as exc:
        LOGGER.error("Ekran görüntüsü alınamadı: %s", exc)
        return False
    finally:
        try:
            driver.quit()
        except Exception:
            pass


def visual_analysis(url: str, brand_data: List[Dict[str, Any]]) -> List[AnalysisSignal]:
    signals: List[AnalysisSignal] = []
    temp_path = os.path.join(os.path.dirname(__file__), "tmp_screenshot.png")

    domain = get_domain(url)
    brand_lookup = {
        entry.get("domain", "").lower(): entry for entry in brand_data if entry.get("domain")
    }

    if domain in brand_lookup:
        signals.append(
            AnalysisSignal(
                name="logo_taklidi",
                value=0.0,
                weight=2.0,
                risk_score=0.0,
                details="Analiz edilen domain bilgi bankasındaki kayıtlı marka ile eşleşiyor; logo benzerliği beklenen durum.",
            )
        )
        signals.append(
            AnalysisSignal(
                name="renk_paleti_benzerligi",
                value=0.0,
                weight=1.0,
                risk_score=0.0,
                details="Analiz edilen domain bilgi bankasındaki kayıtlı marka ile eşleşiyor; renk benzerliği risk oluşturmaz.",
            )
        )
        return signals

    screenshot_taken = capture_screenshot(url, temp_path)
    if not screenshot_taken:
        signals.append(
            AnalysisSignal(
                name="screenshot_alma",
                value=False,
                weight=1.0,
                risk_score=0.4,
                details="Screenshot alınamadı; görsel analiz sınırlı.",
            )
        )
        return signals
    known_logos: List[Dict[str, Any]] = []
    color_palettes: List[List[Tuple[int, int, int]]] = []
    color_lookup: Dict[str, List[Tuple[int, int, int]]] = {}
    for entry in brand_data:
        palette = entry.get("renk_paleti_rgb")
        domain_name = entry.get("domain", "").lower()
        if entry.get("logo_hash"):
            known_logos.append(entry)
        if palette:
            try:
                palette_tuples = [tuple(color) for color in palette]
                color_palettes.append(palette_tuples)
                if domain_name:
                    color_lookup[domain_name] = palette_tuples
            except TypeError:
                continue

    logo_similarity, matched_logo_brand = calculate_logo_similarity(temp_path, known_logos)
    logo_risk = logo_similarity if logo_similarity >= LOGO_SIMILARITY_ALERT_THRESHOLD else 0.0
    signals.append(
        AnalysisSignal(
            name="logo_taklidi",
            value=logo_similarity,
            weight=1.5,
            risk_score=logo_risk,
            details=(
                f"Logo benzerlik skoru: {logo_similarity:.2f}"
                + (
                    f", en yakın marka: {matched_logo_brand}"
                    if matched_logo_brand
                    else ""
                )
                + (
                    ""
                    if logo_similarity >= LOGO_SIMILARITY_ALERT_THRESHOLD
                    else f" (eşik {LOGO_SIMILARITY_ALERT_THRESHOLD:.2f}, bilgilendirme amaçlı)"
                )
            ),
        )
    )

    dominant_colors = extract_dominant_colors(temp_path)
    if dominant_colors:
        palette_similarities: List[Tuple[float, Optional[str]]] = []
        for entry in brand_data:
            palette = entry.get("renk_paleti_rgb")
            if not palette:
                continue
            try:
                palette_tuples = [tuple(color) for color in palette]
            except TypeError:
                continue
            similarity = compare_color_palettes(dominant_colors, palette_tuples)
            palette_similarities.append((similarity, entry.get("name")))

        if palette_similarities:
            best_similarity, best_brand = max(palette_similarities, key=lambda item: item[0])
        else:
            best_similarity, best_brand = 0.0, None
    else:
        best_similarity, best_brand = 0.0, None

    palette_risk = (
        best_similarity * 0.7
        if best_similarity >= PALETTE_SIMILARITY_ALERT_THRESHOLD
        else 0.0
    )

    signals.append(
        AnalysisSignal(
            name="renk_paleti_benzerligi",
            value=best_similarity,
            weight=0.7,
            risk_score=palette_risk,
            details=(
                f"Renk paleti benzerliği: {best_similarity:.2f}"
                + (f", en yakın marka: {best_brand}" if best_brand else "")
                + (
                    ""
                    if best_similarity >= PALETTE_SIMILARITY_ALERT_THRESHOLD
                    else f" (eşik {PALETTE_SIMILARITY_ALERT_THRESHOLD:.2f}, bilgilendirme amaçlı)"
                )
            ),
        )
    )

    try:
        os.remove(temp_path)
    except OSError:
        pass

    return signals


def risk_assessment(result: AnalysisResult, is_trusted: bool = False) -> Dict[str, Any]:
    overall, layer_scores = result.aggregate_score()
    
    high_risk_count = 0
    critical_signals = []
    all_signals = result.technical_signals + result.linguistic_signals + result.visual_signals
    for signal in all_signals:
        if signal.risk_score >= 0.7:
            high_risk_count += 1
            critical_signals.append(signal.name)
    
    if high_risk_count >= 3:
        overall = min(1.0, overall * 1.5)
    elif high_risk_count >= 2:
        overall = min(1.0, overall * 1.3)
    
    guven_puani = int(round((1 - overall) * 100))
    
    if is_trusted:
        if guven_puani >= 90:
            guven_puani = 100
        else:
            guven_puani = max(95, guven_puani + 10)
        overall = 1 - (guven_puani / 100)
        LOGGER.info(f"Bilinen güvenli site bonusu uygulandı. Yeni güven puanı: {guven_puani}")
    
    if not is_trusted:
        domain_age_signal = next((s for s in result.technical_signals if s.name == "domain_yasi"), None)
        typosquatting_signal = next((s for s in result.technical_signals if s.name == "typosquatting"), None)
        
        if domain_age_signal and typosquatting_signal:
            domain_age = domain_age_signal.value
            typo_risk = typosquatting_signal.risk_score
            
            if domain_age is not None and domain_age < 30 and typo_risk >= 0.7:
                guven_puani = max(0, guven_puani - 20)
                overall = 1 - (guven_puani / 100)

    if guven_puani >= 80:
        karar = "Güvenli"
    elif guven_puani >= 40:
        karar = "Şüpheli"
    else:
        karar = "Tehlikeli"

    def describe_layer(signals: List[AnalysisSignal], label: str) -> str:
        if not signals:
            return f"{label} verisi alınamadı."
        high_risk = [sig.details for sig in signals if sig.risk_score >= 0.7]
        if high_risk:
            return f"Yüksek risk: {', '.join(high_risk)}"
        medium_risk = [sig.details for sig in signals if sig.risk_score >= 0.4]
        if medium_risk:
            return f"Orta risk: {', '.join(medium_risk)}"
        return "Düşük risk."

    analiz_dokumu = {
        "teknik_risk": describe_layer(result.technical_signals, "Teknik katmanda"),
        "dilsel_risk": describe_layer(result.linguistic_signals, "Dilsel katmanda"),
        "gorsel_risk": describe_layer(result.visual_signals, "Görsel katmanda"),
    }

    return {
        "guven_puani": guven_puani,
        "karar": karar,
        "katman_skorlari": layer_scores,
        "analiz_dokumu": analiz_dokumu,
    }


# Bilinen güvenli siteler whitelist (ana domainler)
TRUSTED_DOMAINS = {
    "google.com", "google.com.tr", "google.co.uk", "google.de", "google.fr",
    "microsoft.com", "microsoft.com.tr", "office.com", "outlook.com", "live.com",
    "facebook.com", "facebook.com.tr", "instagram.com", "whatsapp.com",
    "apple.com", "icloud.com", "apple.com.tr",
    "amazon.com", "amazon.com.tr", "amazon.de", "amazon.co.uk",
    "youtube.com", "youtube.com.tr",
    "twitter.com", "x.com",
    "linkedin.com", "linkedin.com.tr",
    "github.com",
    "netflix.com", "netflix.com.tr",
    "spotify.com", "spotify.com.tr",
    "paypal.com", "paypal.com.tr",
    "ebay.com", "ebay.com.tr",
    "adobe.com",
    "mozilla.org", "firefox.com",
    "wikipedia.org", "wikipedia.org.tr",
    "reddit.com",
    "discord.com",
    "zoom.us",
    "dropbox.com",
    "cloudflare.com",
    "akbank.com", "garantibbva.com.tr", "isbank.com.tr", "yapikredi.com.tr",
    "ziraatbank.com.tr", "halkbank.com.tr", "vakifbank.com.tr",
    "tcmb.gov.tr", "bddk.org.tr",
    "sahibinden.com", "gittigidiyor.com", "n11.com", "hepsiburada.com", "trendyol.com",
    "hurriyet.com.tr", "sabah.com.tr", "milliyet.com.tr", "sozcu.com.tr",
    "nvidia.com", "intel.com", "amd.com",
    "steam.com", "steampowered.com",
    "epicgames.com",
    "blizzard.com", "battle.net",
}


# Güvenli domain uzantıları (resmi kurumlar)
TRUSTED_TLDS = {
    "gov.tr", "gov",  # Devlet kurumları
    "edu.tr", "edu",  # Üniversiteler
    "k12.tr",  # Okullar (Türkiye)
    "mil.tr", "mil",  # Askeri kurumlar
    "org.tr",  # Resmi organizasyonlar (Türkiye)
}

def is_trusted_domain(url: str) -> bool:
    """URL'nin bilinen güvenli bir domain'e ait olup olmadığını kontrol eder."""
    try:
        domain = get_domain(url)
        # www. önekini kaldır
        domain_clean = domain.replace("www.", "").lower()
        
        # Güvenli TLD kontrolü (örn: .k12.tr, .gov.tr, .edu.tr)
        parts = domain_clean.split(".")
        if len(parts) >= 2:
            # Son 2-3 parçayı kontrol et (örn: k12.tr, gov.tr, edu.tr)
            if len(parts) >= 3:
                tld_2 = ".".join(parts[-2:])  # k12.tr, gov.tr, edu.tr
                if tld_2 in TRUSTED_TLDS:
                    return True
            tld_1 = parts[-1]  # tr, gov, edu
            if tld_1 in TRUSTED_TLDS:
                return True
        
        # Tam eşleşme kontrolü
        if domain_clean in TRUSTED_DOMAINS:
            return True
        
        # Subdomain kontrolü (örn: gemini.google.com -> google.com)
        # Tüm olası domain kombinasyonlarını kontrol et
        if len(parts) >= 2:
            # Son 2 parçayı al (örn: google.com)
            main_domain = ".".join(parts[-2:])
            if main_domain in TRUSTED_DOMAINS:
                return True
            
            # Eğer 3 veya daha fazla parça varsa, son 3 parçayı da kontrol et
            # Örn: mail.google.com.tr -> google.com.tr
            if len(parts) >= 3:
                main_domain_3 = ".".join(parts[-3:])
                if main_domain_3 in TRUSTED_DOMAINS:
                    return True
        
        return False
    except Exception as e:
        LOGGER.warning(f"Domain kontrolü hatası: {e}")
        return False


def analyze_url(url: str, include_visual: bool = True) -> Dict[str, Any]:
    is_trusted = is_trusted_domain(url)
    LOGGER.info(f"Domain kontrolü: {url} -> is_trusted={is_trusted}")
    if is_trusted:
        LOGGER.info(f"✅ Bilinen güvenli domain tespit edildi: {url}")
        # Normal analizi yap ama skorlamayı özel yap
        brand_data = load_brand_data()
        result = AnalysisResult()
        
        result.technical_signals.extend(technical_analysis(url, brand_data))
        result.linguistic_signals.extend(linguistic_analysis(url))
        if include_visual:
            result.visual_signals.extend(visual_analysis(url, brand_data))
        
        # Özel risk assessment (güvenli site bonusu ile)
        assessment = risk_assessment(result, is_trusted=True)
        LOGGER.info(f"✅ Güvenli site bonusu uygulandı. Güven puanı: {assessment.get('guven_puani')}")
        # Sinyalleri dict'e çevir (array değerleri için özel işlem)
        def signal_to_dict(signal):
            sig_dict = signal.__dict__.copy()
            # Eğer value bir liste ise, JSON serializable hale getir
            if isinstance(sig_dict.get('value'), list):
                sig_dict['value'] = list(sig_dict['value'])  # Liste olarak koru
            return sig_dict
        
        assessment["detaylı_sinyaller"] = {
            "teknik": [signal_to_dict(signal) for signal in result.technical_signals],
            "dilsel": [signal_to_dict(signal) for signal in result.linguistic_signals],
            "gorsel": [signal_to_dict(signal) for signal in result.visual_signals],
        }
        return assessment
    
    # Normal analiz
    brand_data = load_brand_data()
    result = AnalysisResult()

    result.technical_signals.extend(technical_analysis(url, brand_data))
    result.linguistic_signals.extend(linguistic_analysis(url))
    if include_visual:
        result.visual_signals.extend(visual_analysis(url, brand_data))

    assessment = risk_assessment(result)
    
    # Sinyalleri dict'e çevir (array değerleri için özel işlem)
    def signal_to_dict(signal):
        sig_dict = signal.__dict__.copy()
        # Eğer value bir liste ise, JSON serializable hale getir
        if isinstance(sig_dict.get('value'), list):
            sig_dict['value'] = list(sig_dict['value'])  # Liste olarak koru
        return sig_dict
    
    assessment["detaylı_sinyaller"] = {
        "teknik": [signal_to_dict(signal) for signal in result.technical_signals],
        "dilsel": [signal_to_dict(signal) for signal in result.linguistic_signals],
        "gorsel": [signal_to_dict(signal) for signal in result.visual_signals],
    }
    return assessment


__all__ = [
    "AnalysisResult",
    "AnalysisSignal",
    "analyze_url",
    "risk_assessment",
    "technical_analysis",
    "linguistic_analysis",
    "visual_analysis",
    "load_brand_data",
]


