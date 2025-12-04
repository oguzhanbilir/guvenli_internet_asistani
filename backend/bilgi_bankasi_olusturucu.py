from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.common.by import By
    from selenium.common.exceptions import WebDriverException
except ImportError as exc:
    raise SystemExit(
        "Selenium kütüphanesi bulunamadı. Lütfen `pip install selenium` komutunu çalıştırın."
    ) from exc

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow kütüphanesi bulunamadı. `pip install pillow` yükleyin.") from exc

try:
    import imagehash
except ImportError as exc:
    raise SystemExit("imagehash kütüphanesi eksik. `pip install imagehash` komutunu çalıştırın.") from exc

try:
    import numpy as np
    from sklearn.cluster import KMeans
except ImportError as exc:
    raise SystemExit(
        "scikit-learn ve numpy paketleri eksik. `pip install numpy scikit-learn` komutu ile yükleyin."
    ) from exc

try:
    import pandas as pd
except ImportError as exc:
    raise SystemExit(
        "pandas kütüphanesi eksik. Lütfen `pip install pandas openpyxl` komutlarını çalıştırın."
    ) from exc

PROJECT_ROOT = os.path.dirname(__file__)
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "brand_data.json")
TEMP_DIR = os.path.join(PROJECT_ROOT, "_tmp_brand_data")
ROOT_DIR = Path(PROJECT_ROOT).resolve().parent

EXTERNAL_EXCEL_GLOB = "*siteler*.xlsx"
SAVE_BATCH_SIZE = 25
BASE_BRAND_TARGETS = [
    {"name": "Google", "url": "https://www.google.com"},
    {"name": "Twitter", "url": "https://www.twitter.com"},
    {"name": "Facebook", "url": "https://www.facebook.com"},
    {"name": "YouTube", "url": "https://www.youtube.com"},
    {"name": "Instagram", "url": "https://www.instagram.com"},
    {"name": "e-Devlet", "url": "https://www.turkiye.gov.tr"},
    {"name": "Ziraat Bankası", "url": "https://www.ziraatbank.com.tr"},
    {"name": "İş Bankası", "url": "https://www.isbank.com.tr"},
    {"name": "Garanti BBVA", "url": "https://www.garantibbva.com.tr"},
]


@dataclass
class BrandRecord:
    name: str
    url: str
    domain: str
    logo_hash: Optional[str]
    renk_paleti_rgb: List[Tuple[int, int, int]]

    def to_dict(self) -> Dict[str, object]:
        return {
            "name": self.name,
            "url": self.url,
            "domain": self.domain,
            "logo_hash": self.logo_hash,
            "renk_paleti_rgb": [list(color) for color in self.renk_paleti_rgb],
        }

    @staticmethod
    def from_dict(data: Dict[str, object]) -> "BrandRecord":
        palette = data.get("renk_paleti_rgb") or []
        palette_tuples: List[Tuple[int, int, int]] = []
        for color in palette:
            try:
                palette_tuples.append(tuple(int(c) for c in color))  # type: ignore[arg-type]
            except (TypeError, ValueError):
                continue
        return BrandRecord(
            name=str(data.get("name", "")),
            url=str(data.get("url", "")),
            domain=str(data.get("domain", "")),
            logo_hash=data.get("logo_hash") if data.get("logo_hash") else None,
            renk_paleti_rgb=palette_tuples,
        )


def setup_webdriver() -> webdriver.Chrome:
    options = ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    try:
        driver = webdriver.Chrome(options=options)
    except WebDriverException as exc:
        raise SystemExit(
            "Chrome WebDriver başlatılamadı. Lütfen ChromeDriver kurulumunu doğrulayın."
        ) from exc
    driver.set_page_load_timeout(45)
    return driver


def download_image(url: str, dest_path: str) -> Tuple[bool, Optional[str]]:
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[WARN] Görsel indirilemedi: {exc}")
        return False, str(exc)

    with open(dest_path, "wb") as handle:
        handle.write(response.content)
    return True, None


def find_favicon(driver: webdriver.Chrome, base_url: str) -> Optional[str]:
    elements = driver.find_elements(By.XPATH, "//link[contains(@rel, 'icon')]")
    for element in elements:
        href = element.get_attribute("href")
        if href:
            return urljoin(base_url, href)
    return None


def compute_logo_hash(image_path: str) -> Tuple[Optional[str], Optional[str]]:
    try:
        image = Image.open(image_path)
        return str(imagehash.phash(image)), None
    except (OSError, ValueError) as exc:
        print(f"[WARN] Logo hash hesaplanamadı: {exc}")
        return None, str(exc)


def extract_dominant_colors(
    image_path: str, clusters: int = 5
) -> Tuple[List[Tuple[int, int, int]], Optional[str]]:
    try:
        image = Image.open(image_path).convert("RGB")
    except (OSError, ValueError) as exc:
        print(f"[WARN] Renk analizi için görüntü açılamadı: {exc}")
        return [], str(exc)

    image = image.resize((250, 250))
    pixels = np.array(image).reshape(-1, 3)

    try:
        kmeans = KMeans(n_clusters=min(clusters, len(pixels)), n_init=10)
        kmeans.fit(pixels)
    except Exception as exc:
        print(f"[WARN] Renk paleti çıkarılamadı: {exc}")
        return [], str(exc)

    centers = kmeans.cluster_centers_.astype(int)
    return [tuple(map(int, center)) for center in centers], None


def detect_excel_sources(pattern: str = EXTERNAL_EXCEL_GLOB) -> List[Path]:
    search_dirs = {ROOT_DIR, Path(PROJECT_ROOT)}
    sources: List[Path] = []
    for directory in search_dirs:
        sources.extend(path for path in directory.glob(pattern) if path.is_file())
    unique_sources = []
    seen = set()
    for path in sources:
        resolved = path.resolve()
        if resolved not in seen:
            seen.add(resolved)
            unique_sources.append(resolved)
    return sorted(unique_sources)


def load_external_targets(paths: Iterable[Path]) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []

    for path in paths:
        try:
            df = pd.read_excel(path)
        except Exception as exc:
            print(f"[WARN] {path.name} dosyası okunamadı: {exc}")
            continue

        if df.empty:
            continue

        columns = [str(col).strip() for col in df.columns]
        name_col = columns[0]
        url_col = next((col for col in columns if "url" in col.lower()), None)
        domain_col = next((col for col in columns if "domain" in col.lower()), None)

        for _, row in df.iterrows():
            name = str(row.get(name_col, "")).strip()
            url = str(row.get(url_col, "")).strip() if url_col else ""
            domain = str(row.get(domain_col, "")).strip() if domain_col else ""

            if not name:
                continue

            if not url and domain:
                url = domain

            if url and not url.lower().startswith(("http://", "https://")):
                url = f"https://{url}"

            if not url:
                continue

            results.append(
                {
                    "name": name,
                    "url": url,
                    "domain": domain,
                    "source": path.name,
                }
            )

    return results


def merge_targets(base: List[Dict[str, str]], extra: List[Dict[str, str]]) -> List[Dict[str, str]]:
    merged: Dict[str, Dict[str, str]] = {}

    def normalize_domain(url: str, explicit_domain: Optional[str] = None) -> str:
        if explicit_domain:
            return explicit_domain.lower().strip()
        parsed = urlparse(url)
        return parsed.netloc.lower()

    for entry in base:
        domain = normalize_domain(entry.get("url", ""), entry.get("domain"))
        merged[domain] = {
            "name": entry.get("name", domain),
            "url": entry.get("url", ""),
            "domain": domain,
        }

    for entry in extra:
        domain = normalize_domain(entry.get("url", ""), entry.get("domain"))
        if not domain:
            continue
        merged[domain] = {
            "name": entry.get("name", domain),
            "url": entry.get("url", ""),
            "domain": domain,
            "source": entry.get("source"),
        }

    return list(merged.values())


def get_brand_targets() -> List[Dict[str, str]]:
    excel_sources = detect_excel_sources()
    if excel_sources:
        print(f"[INFO] Excel kaynakları bulundu: {[path.name for path in excel_sources]}")
    extra_targets = load_external_targets(excel_sources) if excel_sources else []
    targets = merge_targets(BASE_BRAND_TARGETS, extra_targets)
    print(f"[INFO] Toplam {len(targets)} marka hedefi işlenecek.")
    return targets


def build_brand_dataset() -> List[BrandRecord]:
    os.makedirs(TEMP_DIR, exist_ok=True)
    driver = setup_webdriver()

    records: List[BrandRecord] = []
    targets = get_brand_targets()

    try:
        for target in targets:
            url = target["url"]
            name = target["name"]
            parsed = urlparse(url)
            domain = parsed.netloc or target.get("domain", "")
            domain = domain.lower()
            print(f"[INFO] {name} ({domain}) işleniyor...")

            try:
                driver.get(url)
                time.sleep(4)  # sayfanın yüklenmesi ve JS çalışması için bekle
            except WebDriverException as exc:
                print(f"[ERROR] {url} yüklenemedi: {exc}")
                continue

            screenshot_path = os.path.join(TEMP_DIR, f"{domain}_screenshot.png")
            driver.save_screenshot(screenshot_path)

            favicon_url = find_favicon(driver, url) or urljoin(url, "/favicon.ico")
            logo_path = os.path.join(TEMP_DIR, f"{domain}_logo.ico")
            logo_downloaded = download_image(favicon_url, logo_path)

            if not logo_downloaded:
                logo_hash = None
            else:
                logo_hash = compute_logo_hash(logo_path)

            renk_paleti = extract_dominant_colors(screenshot_path)

            records.append(
                BrandRecord(
                    name=name,
                    url=url,
                    domain=domain,
                    logo_hash=logo_hash,
                    renk_paleti_rgb=renk_paleti,
                )
            )
    finally:
        driver.quit()

    return records


def save_records(records: List[BrandRecord], path: str = OUTPUT_PATH) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump([record.to_dict() for record in records], handle, indent=4, ensure_ascii=False)
    print(f"[INFO] {len(records)} marka kaydedildi: {path}")


def load_existing_records(path: str = OUTPUT_PATH) -> Dict[str, BrandRecord]:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle) or []
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[WARN] Mevcut brand_data okunamadı: {exc}")
        return {}

    records: Dict[str, BrandRecord] = {}
    for entry in data:
        try:
            record = BrandRecord.from_dict(entry)
            if record.domain:
                records[record.domain.lower()] = record
        except Exception as exc:
            print(f"[WARN] Kayıt yüklenemedi: {exc}")
            continue
    return records


def build_brand_dataset(refresh: bool = False) -> Tuple[List[BrandRecord], List[Dict[str, str]]]:
    os.makedirs(TEMP_DIR, exist_ok=True)
    driver = setup_webdriver()

    existing_records = load_existing_records()
    records_map: Dict[str, BrandRecord] = dict(existing_records)

    targets = get_brand_targets()

    processed_count = 0
    skipped_count = 0
    failures: List[Dict[str, str]] = []

    try:
        for target in targets:
            url = target["url"]
            name = target["name"]
            parsed = urlparse(url)
            domain = parsed.netloc or target.get("domain", "")
            domain = domain.lower()

            if not domain:
                print(f"[WARN] {name} için domain bulunamadı, atlanıyor.")
                skipped_count += 1
                failures.append(
                    {
                        "name": name,
                        "domain": "",
                        "url": url,
                        "reason": "Domain tespit edilemedi",
                        "stage": "normalizasyon",
                    }
                )
                continue

            if domain in existing_records and not refresh:
                print(f"[SKIP] {name} ({domain}) mevcut kaydedildi, atlandı.")
                skipped_count += 1
                continue

            print(f"[INFO] {name} ({domain}) işleniyor...")
            try:
                driver.get(url)
                time.sleep(4)
            except Exception as exc:
                print(f"[ERROR] {url} yüklenemedi: {exc}")
                failures.append(
                    {
                        "name": name,
                        "domain": domain,
                        "url": url,
                        "reason": f"Selenium hata: {exc}",
                        "stage": "sayfa_yukleme",
                    }
                )
                skipped_count += 1
                continue

            screenshot_path = os.path.join(TEMP_DIR, f"{domain}_screenshot.png")
            try:
                driver.save_screenshot(screenshot_path)
            except Exception as exc:
                print(f"[WARN] Screenshot alınamadı: {exc}")
                failures.append(
                    {
                        "name": name,
                        "domain": domain,
                        "url": url,
                        "reason": f"Ekran görüntüsü alınamadı: {exc}",
                        "stage": "gorsel",
                    }
                )
                skipped_count += 1
                continue

            favicon_url = find_favicon(driver, url) or urljoin(url, "/favicon.ico")
            logo_path = os.path.join(TEMP_DIR, f"{domain}_logo.ico")
            logo_downloaded, logo_dl_error = download_image(favicon_url, logo_path)
            if logo_dl_error:
                failures.append(
                    {
                        "name": name,
                        "domain": domain,
                        "url": favicon_url,
                        "reason": logo_dl_error,
                        "stage": "favicon",
                    }
                )

            if not logo_downloaded:
                logo_hash = None
                logo_hash_error = "Favicon indirilemedi"
            else:
                logo_hash, logo_hash_error = compute_logo_hash(logo_path)
                if logo_hash_error:
                    failures.append(
                        {
                            "name": name,
                            "domain": domain,
                            "url": url,
                            "reason": logo_hash_error,
                            "stage": "logo_hash",
                        }
                    )

            renk_paleti, palette_error = extract_dominant_colors(screenshot_path)
            if palette_error:
                failures.append(
                    {
                        "name": name,
                        "domain": domain,
                        "url": url,
                        "reason": palette_error,
                        "stage": "renk_paleti",
                    }
                )

            records_map[domain] = BrandRecord(
                name=name,
                url=url,
                domain=domain,
                logo_hash=logo_hash,
                renk_paleti_rgb=renk_paleti,
            )
            processed_count += 1
            if processed_count % SAVE_BATCH_SIZE == 0:
                print("[INFO] Ara kayıt tasarrufu yapılıyor...")
                save_records(list(records_map.values()))
    finally:
        driver.quit()

    print(f"[INFO] İşlenen yeni marka: {processed_count}, atlanan: {skipped_count}")
    return list(records_map.values()), failures


def clean_temp_dir() -> None:
    if not os.path.exists(TEMP_DIR):
        return
    for filename in os.listdir(TEMP_DIR):
        try:
            os.remove(os.path.join(TEMP_DIR, filename))
        except OSError:
            continue
    try:
        os.rmdir(TEMP_DIR)
    except OSError:
        pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Brand veri bankasını otomatik oluşturan betik."
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Tüm markaları yeniden indir (mevcut kayıtları silmeden günceller).",
    )
    return parser.parse_args()


def save_failure_report(failures: List[Dict[str, str]], path: Optional[str] = None) -> None:
    if not failures:
        print("[INFO] Tüm kaynaklar sorunsuz işlendi.")
        return

    if path is None:
        path = os.path.join(PROJECT_ROOT, "brand_failures.json")

    with open(path, "w", encoding="utf-8") as handle:
        json.dump(failures, handle, indent=2, ensure_ascii=False)
    print(f"[INFO] {len(failures)} hatalı kayıt raporu: {path}")


def main() -> None:
    args = parse_args()
    try:
        records, failures = build_brand_dataset(refresh=args.refresh)
    except KeyboardInterrupt:
        print("[WARN] İşlem kullanıcı tarafından iptal edildi.")
        sys.exit(1)

    save_records(records)
    save_failure_report(failures)
    clean_temp_dir()


if __name__ == "__main__":
    main()


