@echo off
REM GitHub Pages "Deploy from branch" ile /docs kullanıyorsanız,
REM site/ degisikliklerini docs/ ile senkron tutmak icin bu dosyayi calistirin.
set SCRIPT_DIR=%~dp0
copy /Y "%SCRIPT_DIR%site\index.html" "%SCRIPT_DIR%docs\index.html"
copy /Y "%SCRIPT_DIR%site\app.js" "%SCRIPT_DIR%docs\app.js"
copy /Y "%SCRIPT_DIR%site\style.css" "%SCRIPT_DIR%docs\style.css"
copy /Y "%SCRIPT_DIR%site\favicon.svg" "%SCRIPT_DIR%docs\favicon.svg"
echo docs/ site/ ile senkronize edildi. Simdi git add, commit ve push yapin.
