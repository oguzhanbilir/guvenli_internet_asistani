@echo off
echo Building EXE file...
echo.
pyinstaller --onefile ^
    --name "Guvenli_Internet_Asistani_Backend" ^
    --add-data "brand_data.json;." ^
    --add-data "analiz_motoru.py;." ^
    --paths . ^
    --hidden-import analiz_motoru ^
    --hidden-import bs4 ^
    --hidden-import uvicorn.lifespan.on ^
    --hidden-import uvicorn.lifespan.off ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.websockets ^
    --exclude-module torch ^
    --exclude-module transformers ^
    --console ^
    --clean ^
    --noconfirm ^
    api.py

echo.
if exist "dist\Guvenli_Internet_Asistani_Backend.exe" (
    echo [SUCCESS] Build complete! EXE file is in the 'dist' folder.
    echo.
    echo EXE dosyasi: dist\Guvenli_Internet_Asistani_Backend.exe
) else (
    echo [ERROR] EXE dosyasi olusturulamadi!
)
echo.
pause

