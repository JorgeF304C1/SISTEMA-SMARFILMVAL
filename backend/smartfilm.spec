# smartfilm.spec — PyInstaller build specification
# Genera una app de escritorio nativa con pywebview (sin navegador, sin internet)
#
# Windows: SmartFilm_Valencia.exe  (usa WebView2 — ya incluido en Win10/11)
# macOS:   SmartFilm_Valencia.app  (usa WebKit  — incluido en macOS)
#
# Para compilar:
#   Windows: .\venv\Scripts\pyinstaller.exe smartfilm.spec --noconfirm
#   macOS:   ./venv/bin/pyinstaller smartfilm.spec --noconfirm

import os
import sys

block_cipher = None

# ── Data files to bundle ───────────────────────────────────────────────────────
datas = [
    # Compiled React frontend (run `npm run build` first)
    ('static_frontend', 'static_frontend'),
    # pywebview runtimes — all three platforms needed at module load time
    (r'venv\Lib\site-packages\webview\lib', r'webview\lib'),
]

# ── Hidden imports (modules PyInstaller misses via static analysis) ─────────────
hiddenimports = [
    # uvicorn internals
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    # async
    'anyio',
    'anyio.from_thread',
    # fastapi / starlette
    'starlette.routing',
    'fastapi.middleware.cors',
    # database
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.dialects.sqlite.pysqlite',
    # auth
    'passlib.handlers.bcrypt',
    'bcrypt',
    'jose',
    # multipart
    'multipart',
    'python_multipart',
    # pywebview — Windows (WebView2 via pythonnet/clr)
    'webview',
    'webview.platforms.winforms',
    'clr_loader',
    'pythonnet',
    # pywebview — macOS (WebKit)
    'webview.platforms.cocoa',
    # pywebview — Linux fallback
    'webview.platforms.gtk',
]

a = Analysis(
    ['launcher.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'PIL',
        'scipy',
        'IPython',
        'notebook',
        'weasyprint',
        'jinja2',
        'test',
        'unittest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='SmartFilm_Valencia',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    # console=False → sin ventana de terminal negra al abrir el .exe
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/icon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='SmartFilm_Valencia',
)
