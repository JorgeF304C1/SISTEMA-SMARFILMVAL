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
import glob

# Locate webview/lib across Windows and macOS venv layouts
_webview_lib_candidates = [
    r'venv\Lib\site-packages\webview\lib',                    # Windows
    'venv/lib/python3.9/site-packages/webview/lib',           # macOS py3.9
    'venv/lib/python3.10/site-packages/webview/lib',
    'venv/lib/python3.11/site-packages/webview/lib',
    'venv/lib/python3.12/site-packages/webview/lib',
]
_webview_lib = next((p for p in _webview_lib_candidates if os.path.exists(p)), None)

datas = [
    # Compiled React frontend (run `npm run build` first)
    ('static_frontend', 'static_frontend'),
    # DB template: used only on first run if user has no DB yet
    ('smartfilm_seed.db', '.'),
]
if _webview_lib:
    datas.append((_webview_lib, 'webview/lib'))

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
    icon='assets/icon.icns' if sys.platform == 'darwin' else 'assets/icon.ico',
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

if sys.platform == 'darwin':
    app = BUNDLE(
        coll,
        name='SmartFilm_Valencia.app',
        icon='assets/icon.icns' if os.path.exists('assets/icon.icns') else None,
        bundle_identifier='com.smartfilm.valencia',
        info_plist={
            'CFBundleName': 'Smart Film Valencia',
            'CFBundleDisplayName': 'Smart Film Valencia',
            'CFBundleShortVersionString': '1.0.0',
            'NSHighResolutionCapable': True,
            'LSBackgroundOnly': False,
        },
    )
