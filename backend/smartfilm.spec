# smartfilm.spec — PyInstaller build specification
# Run with: pyinstaller smartfilm.spec
#
# Output: dist/SmartFilm_Valencia/SmartFilm_Valencia.exe (Windows)
#          dist/SmartFilm_Valencia/SmartFilm_Valencia      (macOS/Linux)

import os
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# Collect all data files needed by FastAPI and its dependencies
datas = [
    # The compiled React frontend (must run `npm run build` first)
    ('static_frontend', 'static_frontend'),
]

# Collect hidden imports that PyInstaller misses
hiddenimports = [
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
    'anyio',
    'anyio.from_thread',
    'starlette.routing',
    'fastapi.middleware.cors',
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.dialects.sqlite.pysqlite',
    'passlib.handlers.bcrypt',
    'bcrypt',
    'jose',
    'email_validator',
    'multipart',
    'python_multipart',
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
    console=True,          # True = muestra ventana de terminal (útil para ver logs)
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon='static_frontend/favicon.ico',   # Descomenta si tienes .ico
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
