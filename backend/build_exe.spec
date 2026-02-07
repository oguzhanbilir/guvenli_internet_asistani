# -*- mode: python ; coding: utf-8 -*-

import os
from pathlib import Path

block_cipher = None

# Backend dizini
backend_dir = Path(SPECPATH).parent
project_root = backend_dir.parent

# Tüm Python dosyalarını topla
a = Analysis(
    ['api.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=[
        ('brand_data.json', '.'),
    ],
    hiddenimports=[
        'uvicorn',
        'fastapi',
        'pydantic',
        'requests',
        'beautifulsoup4',
        'whois',
        'Levenshtein',
        'PIL',
        'selenium',
        'imagehash',
        'numpy',
        'sklearn',
        'pandas',
        'openpyxl',
        'analiz_motoru',
        'bilgi_bankasi_olusturucu',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Guvenli_Internet_Asistani_Backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
