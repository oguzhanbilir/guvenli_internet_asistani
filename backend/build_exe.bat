@echo off
chcp 65001 >nul
echo ========================================
echo Phishing Defense Backend - EXE Builder
echo ========================================
echo.

REM Python'un yüklü olup olmadığını kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo [HATA] Python bulunamadı! Lütfen Python'u yükleyin.
    pause
    exit /b 1
)

echo [1/4] Python bağımlılıkları kontrol ediliyor...
python -m pip install --upgrade pip >nul 2>&1

echo [2/4] Gerekli paketler yükleniyor...
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo [HATA] Paket yükleme başarısız oldu!
    pause
    exit /b 1
)

echo [3/4] Gerekli dosyalar kontrol ediliyor...
if not exist "brand_data.json" (
    echo [UYARI] brand_data.json bulunamadı! Analiz motoru çalışmayabilir.
)

if not exist "popüler_siteler.xlsx" (
    echo [UYARI] popüler_siteler.xlsx bulunamadı!
)

echo [4/4] EXE dosyası oluşturuluyor...
python -m PyInstaller build_exe.spec --clean --noconfirm

if errorlevel 1 (
    echo [HATA] EXE oluşturma başarısız oldu!
    pause
    exit /b 1
)

echo.
echo ========================================
echo [BAŞARILI] EXE dosyası oluşturuldu!
echo ========================================
echo.
echo EXE dosyası: dist\Phishing_Defense_Backend.exe
echo.
echo Kullanım:
echo   1. dist klasöründeki Phishing_Defense_Backend.exe dosyasını çalıştırın
echo   2. Tarayıcı eklentisi http://localhost:8000 adresine bağlanacak
echo   3. Durdurmak için Ctrl+C tuşlarına basın
echo.
pause

