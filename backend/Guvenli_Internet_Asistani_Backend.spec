# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['api.py'],
    pathex=['.'],
    binaries=[],
    datas=[('brand_data.json', '.'), ('analiz_motoru.py', '.')],
    hiddenimports=['analiz_motoru', 'bs4', 'uvicorn.lifespan.on', 'uvicorn.lifespan.off', 'uvicorn.protocols.http.auto', 'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan', 'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.websockets'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['torch', 'transformers'],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
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
)
