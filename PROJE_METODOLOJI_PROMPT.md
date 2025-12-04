# Proje Geliştirme ve Hazırlama Metodolojisi - Detaylı Prompt

Bu dokümantasyon, bir projeyi baştan sona hazırlama, temizleme, dokümante etme ve GitHub'a yükleme sürecindeki tüm adımları içerir. Bu metodoloji herhangi bir projeye uygulanabilir.

## 📋 GENEL YAKLAŞIM PRENSİPLERİ

1. **Sistematik İlerleme:** Her adımı sırayla ve kontrollü şekilde yap
2. **Kapsamlı Kontrol:** Her değişiklikten önce ve sonra durumu kontrol et
3. **Dokümantasyon:** Her önemli değişikliği commit mesajında açıkla
4. **Temizlik:** Gereksiz dosyaları proaktif olarak temizle
5. **Doğrulama:** Her adımın sonunda çalıştığını test et

---

## 🔍 AŞAMA 1: PROJE DURUMU ANALİZİ

### 1.1. Proje Yapısını İnceleme

**Adımlar:**
1. Proje root dizinini listele (`list_dir`)
2. Tüm alt klasörleri keşfet
3. Dosya türlerini kategorize et (kod, dokümantasyon, yapılandırma, geçici)
4. Proje yapısını anla (backend, frontend, database, vb.)

**Komutlar:**
```bash
# Klasör yapısını görüntüle
list_dir target_directory="."

# Belirli dosya türlerini bul
glob_file_search glob_pattern="*.py"
glob_file_search glob_pattern="*.md"
glob_file_search glob_pattern="*.json"
```

### 1.2. Mevcut Durumu Belirleme

**Kontrol Edilecekler:**
- Git repository durumu (`git status`)
- Son commit'ler (`git log --oneline -10`)
- Gereksiz dosyalar (cache, log, temp)
- Eksik dokümantasyon
- Yapılandırma dosyaları (.gitignore, README)

**Sorular:**
- Proje hangi aşamada? (başlangıç, geliştirme, test, production)
- Hangi teknolojiler kullanılıyor?
- Hangi bileşenler var? (backend, frontend, database, vb.)
- Dokümantasyon durumu nedir?

---

## 🧹 AŞAMA 2: KOD TEMİZLİĞİ VE İYİLEŞTİRME

### 2.1. AI-Generated İzleri Kaldırma

**Hedef:** Kodun doğal görünmesini sağla, AI yazılım izlerini kaldır.

**Kontrol Edilecekler:**
- Formal docstring'ler (çok detaylı, şablon gibi)
- `# pragma: no cover` gibi test yorumları
- Aşırı detaylı logging mesajları
- Section header'lar (`# --- Yardımcı Fonksiyonlar ---`)
- Gereksiz type hint açıklamaları
- Standart hata mesajları yerine daha doğal olanlar

**Yöntem:**
1. Her kod dosyasını oku (`read_file`)
2. AI-generated pattern'leri tespit et
3. Daha doğal alternatiflerle değiştir
4. Fonksiyonellik korunmalı, sadece stil değişmeli

**Örnek Değişiklikler:**
```python
# ÖNCE (AI-generated):
"""
Bu fonksiyon URL'yi analiz eder.

Args:
    url: Analiz edilecek URL
    include_visual: Görsel analiz yapılsın mı

Returns:
    Dict: Analiz sonuçları
"""
def analyze_url(url: str, include_visual: bool = True) -> Dict[str, Any]:
    # pragma: no cover
    LOGGER.info(f"URL analizi başlatıldı: {url}")
    ...

# SONRA (Doğal):
def analyze_url(url: str, include_visual: bool = True):
    LOGGER.info(f"Analiz başlatılıyor: {url}")
    ...
```

### 2.2. Gereksiz Dosyaları Temizleme

**Temizlenecek Dosya Türleri:**

**Python:**
- `__pycache__/` klasörleri
- `*.pyc` dosyaları
- `*.pyo` dosyaları
- `.pytest_cache/`
- `.coverage`
- `htmlcov/`

**Geçici Dosyalar:**
- `*.tmp`, `*.temp`
- `*.bak`, `*.backup`
- `*.log`, `*.logs`
- `*.swp`, `*.swo` (vim)
- `*~` (backup files)

**Build/Dist:**
- `dist/`, `build/`
- `*.egg-info/`
- `*.so`, `*.dll`

**IDE:**
- `.vscode/`, `.idea/`
- `.DS_Store`
- `Thumbs.db`

**Proje Özel:**
- Test scriptleri (geçici)
- Logo oluşturma scriptleri (geçici)
- Eski rapor versiyonları
- Duplicate dokümantasyon dosyaları

**Yöntem:**
1. Her dosya türü için `glob_file_search` kullan
2. Dosyaları kategorize et (silinecek, kalacak)
3. Önce liste göster, sonra sil
4. `.gitignore`'a ekle (tekrar oluşmasın)

**Komutlar:**
```bash
# Cache dosyalarını bul
glob_file_search glob_pattern="*.pyc"
glob_file_search glob_pattern="*__pycache__*"

# Geçici dosyaları bul
glob_file_search glob_pattern="*.tmp"
glob_file_search glob_pattern="*.bak"

# Sil
delete_file target_file="dosya.txt"
run_terminal_cmd command="Remove-Item -Recurse -Force 'klasor'"
```

### 2.3. Kod Organizasyonu

**Kontrol Edilecekler:**
- Dosya isimlendirme tutarlılığı
- Klasör yapısı mantıklı mı?
- Import'lar düzenli mi?
- Gereksiz kod blokları var mı?

---

## 📝 AŞAMA 3: DOKÜMANTASYON HAZIRLAMA

### 3.1. README.md Oluşturma/Güncelleme

**README İçeriği:**
1. **Proje Başlığı ve Açıklama**
   - Proje adı
   - Kısa açıklama (1-2 cümle)
   - Ana özellikler listesi

2. **Özellikler**
   - Ana özellikler kategorize edilmiş
   - Her özellik kısa açıklamalı

3. **Proje Yapısı**
   - Klasör ağacı (ASCII art)
   - Her klasörün amacı

4. **Kurulum**
   - Gereksinimler
   - Adım adım kurulum talimatları
   - Her komutun açıklaması

5. **Kullanım**
   - Temel kullanım örnekleri
   - API kullanımı (varsa)
   - Ekran görüntüleri linkleri

6. **Teknolojiler**
   - Kullanılan teknolojiler listesi
   - Versiyon bilgileri

7. **Performans Metrikleri** (varsa)
   - Test sonuçları
   - İstatistikler

8. **Lisans ve İletişim**

**Yöntem:**
1. Mevcut README'yi oku
2. Eksikleri belirle
3. Güncel bilgilerle doldur
4. Formatı düzenle (markdown)
5. Linkleri kontrol et

### 3.2. Ek Dokümantasyon Dosyaları

**Oluşturulabilecek Dosyalar:**
- `KURULUM.md` - Detaylı kurulum
- `API_DOKUMANTASYONU.md` - API referansı
- `GELISTIRME.md` - Geliştirici rehberi
- `SORUN_GIDERME.md` - Troubleshooting

**Karar Kriterleri:**
- Proje karmaşıklığı
- Kullanıcı ihtiyacı
- Dokümantasyon boyutu

### 3.3. Kod İçi Dokümantasyon

**Kontrol:**
- Fonksiyon açıklamaları yeterli mi?
- Karmaşık algoritmalar açıklanmış mı?
- Örnek kullanımlar var mı?

---

## 🔧 AŞAMA 4: YAPILANDIRMA DOSYALARI

### 4.1. .gitignore Oluşturma

**İçerik Kategorileri:**

**Python:**
```
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/
```

**Virtual Environment:**
```
venv/
env/
ENV/
.venv/
```

**IDE:**
```
.vscode/
.idea/
*.swp
*.swo
```

**OS:**
```
.DS_Store
Thumbs.db
```

**Proje Özel:**
- Log dosyaları
- Geçici dosyalar
- Build çıktıları
- Hassas bilgiler (.env)

**Yöntem:**
1. Standart template'i kullan
2. Proje özel dosyaları ekle
3. Test et (git status ile kontrol)

### 4.2. requirements.txt / package.json Kontrolü

**Kontrol:**
- Tüm bağımlılıklar listelenmiş mi?
- Versiyonlar belirtilmiş mi?
- Gereksiz bağımlılıklar var mı?

**Yöntem:**
```bash
# Python için
pip freeze > requirements_check.txt
# requirements.txt ile karşılaştır

# Node.js için
npm list --depth=0
```

### 4.3. Yapılandırma Dosyaları

**Kontrol Edilecekler:**
- `config.json`, `.env.example`
- `Dockerfile` (varsa)
- `docker-compose.yml` (varsa)
- CI/CD dosyaları (`.github/workflows`)

---

## 🗂️ AŞAMA 5: DOSYA ORGANİZASYONU

### 5.1. Klasör Yapısı Optimizasyonu

**Prensipler:**
- Mantıklı gruplandırma
- Derinlik maksimum 3-4 seviye
- İsimlendirme tutarlılığı
- README dosyaları önemli klasörlerde

**Örnek Yapı:**
```
proje/
├── backend/
│   ├── __init__.py
│   ├── main.py
│   ├── requirements.txt
│   └── README.md (opsiyonel)
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/ (opsiyonel)
├── tests/ (opsiyonel)
├── .gitignore
└── README.md
```

### 5.2. Dosya İsimlendirme

**Kurallar:**
- Küçük harf, alt çizgi kullan
- Açıklayıcı isimler
- Türkçe karakter yok (mümkünse)
- Uzantılar tutarlı

---

## 🚀 AŞAMA 6: GIT YAPILANDIRMASI

### 6.1. Git Repository Kontrolü

**Adımlar:**
1. Git durumunu kontrol et (`git status`)
2. Mevcut branch'i kontrol et (`git branch`)
3. Remote'ları kontrol et (`git remote -v`)
4. Commit geçmişini incele (`git log`)

### 6.2. İlk Commit (Eğer Yeni Repository)

**Adımlar:**
```bash
git init
git add .
git commit -m "Initial commit: Proje açıklaması"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

### 6.3. Commit Mesajları

**Format:**
```
<type>: <kısa açıklama>

<detaylı açıklama (opsiyonel)>
```

**Type'lar:**
- `feat:` - Yeni özellik
- `fix:` - Hata düzeltme
- `docs:` - Dokümantasyon
- `style:` - Formatting
- `refactor:` - Kod yeniden yapılandırma
- `test:` - Test ekleme
- `chore:` - Build, config değişiklikleri
- `revert:` - Geri alma

**Örnekler:**
```
feat: Backend API endpoint'leri eklendi
fix: Memory leak sorunu düzeltildi
docs: README.md güncellendi
refactor: Kod yapısı yeniden düzenlendi
```

### 6.4. Branch Stratejisi

**Basit Projeler:**
- `main` branch (production)
- Feature branch'ler (gerekirse)

**Karmaşık Projeler:**
- `main` - Production
- `develop` - Development
- `feature/*` - Yeni özellikler
- `hotfix/*` - Acil düzeltmeler

---

## 🧪 AŞAMA 7: TEST VE DOĞRULAMA

### 7.1. Kod Çalıştırma Testi

**Backend:**
```bash
cd backend
python main.py
# veya
python api.py
```

**Frontend:**
```bash
cd frontend
npm start
# veya
python -m http.server
```

**Kontrol:**
- Servis başlıyor mu?
- Hata mesajları var mı?
- Port'lar doğru mu?

### 7.2. Fonksiyonellik Testi

**Test Senaryoları:**
1. Temel kullanım akışı
2. Hata durumları
3. Edge case'ler
4. Performans (basit)

**Yöntem:**
- Manuel test
- API endpoint'leri test et
- UI elementlerini kontrol et
- Log'ları incele

### 7.3. Dokümantasyon Doğrulama

**Kontrol:**
- README'deki linkler çalışıyor mu?
- Komutlar doğru mu?
- Örnekler güncel mi?
- Eksik bilgi var mı?

---

## 📦 AŞAMA 8: GITHUB'A YÜKLEME

### 8.1. Ön Hazırlık

**Kontrol Listesi:**
- [ ] Tüm gereksiz dosyalar temizlendi
- [ ] .gitignore hazır
- [ ] README.md güncel
- [ ] Kod çalışıyor
- [ ] Hassas bilgiler kaldırıldı (API key, password)

### 8.2. İlk Push

**Adımlar:**
1. Git durumunu kontrol et
2. Değişiklikleri ekle (`git add .`)
3. Commit yap (anlamlı mesaj)
4. Remote ekle (eğer yoksa)
5. Push yap (`git push -u origin main`)

**Komutlar:**
```bash
git status
git add .
git commit -m "feat: İlk commit - Proje hazır"
git remote add origin <repo-url>
git push -u origin main
```

### 8.3. Sonraki Güncellemeler

**Workflow:**
1. Değişiklikleri yap
2. `git status` ile kontrol et
3. `git add <dosyalar>` ile ekle
4. `git commit -m "mesaj"` ile commit
5. `git push` ile yükle

---

## 🔄 AŞAMA 9: SÜREKLI İYİLEŞTİRME

### 9.1. Düzenli Kontroller

**Yapılacaklar:**
- Kod kalitesi kontrolü
- Güncel bağımlılıklar
- Güvenlik açıkları taraması
- Performans optimizasyonu

### 9.2. Versiyonlama

**Semantic Versioning:**
- `MAJOR.MINOR.PATCH`
- Örnek: `1.0.0`, `1.1.0`, `1.1.1`

**Git Tags:**
```bash
git tag -a v1.0.0 -m "İlk stabil sürüm"
git push origin v1.0.0
```

---

## 🎯 PROJE AŞAMA BELİRLEME METODOLOJİSİ

Bir projenin hangi aşamada olduğunu belirlemek için:

### 1. Kod Durumu Analizi

**Sorular:**
- Kod tamamlanmış mı? (% kaçı tamam?)
- Test edilmiş mi?
- Hata ayıklama yapılmış mı?
- Production-ready mi?

**Kontrol:**
- Ana fonksiyonlar çalışıyor mu?
- Hata yönetimi var mı?
- Logging yapılıyor mu?

### 2. Dokümantasyon Durumu

**Sorular:**
- README var mı? Güncel mi?
- API dokümantasyonu var mı?
- Kurulum talimatları var mı?
- Kod içi yorumlar yeterli mi?

**Kontrol:**
- README.md oku
- Dokümantasyon dosyalarını listele
- Eksiklikleri belirle

### 3. Yapılandırma Durumu

**Sorular:**
- .gitignore var mı?
- requirements.txt/package.json güncel mi?
- Environment variables dokümante edilmiş mi?
- Build scriptleri var mı?

### 4. Test Durumu

**Sorular:**
- Test dosyaları var mı?
- Test coverage nedir?
- Manuel test yapılmış mı?

### 5. Deployment Durumu

**Sorular:**
- Production'a deploy edilmiş mi?
- CI/CD kurulu mu?
- Monitoring var mı?

---

## 📊 AŞAMA BELİRLEME MATRİSİ

| Aşama | Kod | Dokümantasyon | Test | Deployment |
|-------|-----|---------------|------|------------|
| **Başlangıç** | %0-30 | Yok/Eksik | Yok | Yok |
| **Geliştirme** | %30-70 | Kısmi | Kısmi | Yok |
| **Test** | %70-90 | İyi | Aktif | Staging |
| **Production** | %90-100 | Tam | Tam | Production |

---

## 🔍 PROJE İNCELEME CHECKLIST

Bir projeyi incelerken şu sırayı takip et:

### 1. Genel Bakış
- [ ] Proje yapısını anla
- [ ] Teknolojileri belirle
- [ ] Ana bileşenleri listele
- [ ] Mevcut durumu değerlendir

### 2. Kod İnceleme
- [ ] Ana dosyaları oku
- [ ] Kod kalitesini değerlendir
- [ ] Hata yönetimini kontrol et
- [ ] Performans sorunlarını tespit et

### 3. Dokümantasyon İnceleme
- [ ] README.md oku
- [ ] API dokümantasyonunu kontrol et
- [ ] Kurulum talimatlarını test et
- [ ] Eksiklikleri belirle

### 4. Yapılandırma İnceleme
- [ ] .gitignore kontrolü
- [ ] Bağımlılıkları kontrol et
- [ ] Environment variables kontrolü
- [ ] Build scriptleri kontrolü

### 5. Test İnceleme
- [ ] Test dosyalarını bul
- [ ] Test coverage'ı kontrol et
- [ ] Test senaryolarını değerlendir

### 6. Git İnceleme
- [ ] Commit geçmişini incele
- [ ] Branch yapısını kontrol et
- [ ] Remote'ları kontrol et
- [ ] .gitignore'ı kontrol et

---

## 🛠️ PRATİK ADIMLAR - ÖRNEK WORKFLOW

### Senaryo: Yeni Bir Projeyi Hazırlama

**1. İlk İnceleme (15 dk)**
```bash
# Proje yapısını görüntüle
list_dir target_directory="."

# Git durumunu kontrol et
git status
git log --oneline -10

# Önemli dosyaları oku
read_file target_file="README.md"
read_file target_file="package.json" # veya requirements.txt
```

**2. Kod Temizliği (30 dk)**
```bash
# Gereksiz dosyaları bul
glob_file_search glob_pattern="*.pyc"
glob_file_search glob_pattern="*__pycache__*"
glob_file_search glob_pattern="*.tmp"

# Kod dosyalarını oku ve temizle
read_file target_file="main.py"
# AI-generated izleri kaldır
search_replace ...
```

**3. Dokümantasyon (20 dk)**
```bash
# README oluştur/güncelle
write file_path="README.md" contents="..."

# .gitignore oluştur
write file_path=".gitignore" contents="..."
```

**4. Test ve Doğrulama (15 dk)**
```bash
# Projeyi çalıştır
run_terminal_cmd command="python main.py"

# Test et
run_terminal_cmd command="curl http://localhost:8000/health"
```

**5. GitHub'a Yükleme (10 dk)**
```bash
git add .
git commit -m "feat: Proje hazırlandı ve temizlendi"
git push origin main
```

**Toplam Süre: ~90 dakika**

---

## 📋 STANDART KOMUT SETLERİ

### Dosya İşlemleri
```bash
# Dosya oku
read_file target_file="dosya.py"

# Dosya yaz
write file_path="dosya.py" contents="..."

# Dosya düzenle
search_replace file_path="dosya.py" old_string="..." new_string="..."

# Dosya sil
delete_file target_file="dosya.py"
```

### Arama İşlemleri
```bash
# Dosya bul
glob_file_search glob_pattern="*.py"

# İçerik ara
grep pattern="import" path="."

# Semantic arama
codebase_search query="How does authentication work?" target_directories=[]
```

### Git İşlemleri
```bash
# Durum kontrol
git status
git log --oneline -5

# Değişiklik ekle
git add .
git add dosya.py

# Commit
git commit -m "mesaj"

# Push
git push origin main
```

### Terminal İşlemleri
```bash
# Komut çalıştır
run_terminal_cmd command="python --version"

# Arka planda çalıştır
run_terminal_cmd command="python server.py" is_background=true
```

---

## 🎯 PROJE AŞAMA BELİRLEME SORULARI

Bir projeyi incelerken şu soruları sor:

### Kod Durumu
1. Ana fonksiyonlar çalışıyor mu?
2. Hata yönetimi var mı?
3. Logging yapılıyor mu?
4. Kod kalitesi nasıl?
5. Test coverage nedir?

### Dokümantasyon
1. README var mı ve güncel mi?
2. API dokümantasyonu var mı?
3. Kurulum talimatları var mı?
4. Kod içi yorumlar yeterli mi?

### Yapılandırma
1. .gitignore var mı?
2. Bağımlılıklar listelenmiş mi?
3. Environment variables dokümante edilmiş mi?
4. Build scriptleri var mı?

### Deployment
1. Production'a deploy edilmiş mi?
2. CI/CD kurulu mu?
3. Monitoring var mı?

---

## 🔄 İTERATİF İYİLEŞTİRME DÖNGÜSÜ

1. **Analiz Et** → Projeyi incele, durumu belirle
2. **Planla** → Yapılacakları listele, önceliklendir
3. **Uygula** → Değişiklikleri yap
4. **Test Et** → Çalıştığını doğrula
5. **Dokümante Et** → Değişiklikleri commit et
6. **Tekrarla** → Bir sonraki öğeye geç

---

## 💡 İPUÇLARI VE EN İYİ UYGULAMALAR

### Kod Temizliği
- Küçük adımlarla ilerle
- Her değişiklikten sonra test et
- Fonksiyonelliği koru, sadece stili değiştir
- AI-generated pattern'leri tanımayı öğren

### Dokümantasyon
- Kısa ve öz ol
- Örnekler ekle
- Güncel tut
- Linkleri kontrol et

### Git
- Küçük, anlamlı commit'ler yap
- Commit mesajlarını açıklayıcı yaz
- Düzenli push yap
- Branch stratejisi kullan

### Test
- Her önemli değişiklikten sonra test et
- Hata durumlarını test et
- Edge case'leri kontrol et

---

## 🎓 ÖĞRENME VE UYARLAMA

Bu metodoloji her projeye uyarlanabilir. Önemli olan:
1. **Esneklik:** Projeye göre adımları uyarla
2. **Tutarlılık:** Aynı yaklaşımı koru
3. **İyileştirme:** Her projede metodolojiyi geliştir
4. **Dokümantasyon:** Yaptıklarını kaydet

---

**Son Güncelleme:** 4 Aralık 2025  
**Proje:** Güvenli İnternet Asistanı  
**Durum:** Production Ready

