"""
launcher.py — Smart Film Valencia Desktop App
Punto de entrada del ejecutable. Crea una ventana nativa del sistema operativo
usando pywebview. No requiere navegador ni internet.

Windows: usa WebView2 (integrado en Win10/11)
macOS:   usa WebKit  (integrado en macOS)
"""
import sys
import os
import time
import threading
import socket
import pathlib
import platform
import shutil
from datetime import datetime

# ── Resolve paths ──────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # PyInstaller: el .exe está aquí, los archivos empaquetados en _MEIPASS
    APP_DIR      = os.path.dirname(sys.executable)
    INTERNAL_DIR = sys._MEIPASS
else:
    # Dev mode
    APP_DIR      = os.path.dirname(os.path.abspath(__file__))
    INTERNAL_DIR = APP_DIR

os.chdir(APP_DIR)


def resolve_user_db_path():
    """Devuelve (db_path, data_dir) en una ubicación protegida fuera del bundle."""
    if platform.system() == 'Darwin':
        base = pathlib.Path.home() / "Library" / "Application Support" / "SmartFilm_Valencia"
    elif platform.system() == 'Windows':
        base = pathlib.Path(os.environ['APPDATA']) / "SmartFilm_Valencia"
    else:
        base = pathlib.Path.home() / ".smartfilm_valencia"
    base.mkdir(parents=True, exist_ok=True)
    db_path = base / "smartfilm.db"
    if not db_path.exists():
        seed = pathlib.Path(INTERNAL_DIR) / "smartfilm_seed.db"
        if seed.exists():
            shutil.copy2(seed, db_path)
    return str(db_path), base


def auto_backup(db_path, data_dir, keep=10):
    """Crea un snapshot del DB al arrancar y rota para conservar solo los `keep` más nuevos."""
    if not os.path.exists(db_path):
        return
    backups = pathlib.Path(data_dir) / "backups"
    backups.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    shutil.copy2(db_path, backups / f"smartfilm-{stamp}.db")
    files = sorted(backups.glob("smartfilm-*.db"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in files[keep:]:
        old.unlink()


def ensure_schema(db_path):
    """Aplica migraciones aditivas al DB del usuario (idempotente)."""
    import sqlite3
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(project_expenses)")
    cols = [r[1] for r in cur.fetchall()]
    if "category" not in cols:
        cur.execute("ALTER TABLE project_expenses ADD COLUMN category TEXT")
    if "quantity" not in cols:
        cur.execute("ALTER TABLE project_expenses ADD COLUMN quantity INTEGER DEFAULT 1")
    conn.commit()
    conn.close()


# ── Proteger el DB en ubicación externa al bundle ─────────────────────────────
DB_PATH, APP_DATA_DIR = resolve_user_db_path()
os.environ['SMARTFILM_DB_PATH'] = DB_PATH
os.environ['SMARTFILM_DATA_DIR'] = str(APP_DATA_DIR)
auto_backup(DB_PATH, APP_DATA_DIR)
ensure_schema(DB_PATH)

def get_free_port():
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

HOST = "127.0.0.1"
PORT = get_free_port()
URL  = f"http://{HOST}:{PORT}"



def wait_for_server(host: str, port: int, timeout: int = 30) -> bool:
    """Espera hasta que el servidor FastAPI acepte conexiones."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (ConnectionRefusedError, OSError):
            time.sleep(0.25)
    return False


def start_api_server():
    """Arranca FastAPI + uvicorn en un hilo de fondo."""
    import uvicorn
    import app.main  # Import explicitly so PyInstaller detects it
    
    uvicorn.run(
        app.main.app,
        host=HOST,
        port=PORT,
        log_level="warning",
        reload=False,
    )


def main():
    import webview

    # 1) Arrancar el servidor API en segundo plano
    server_thread = threading.Thread(target=start_api_server, daemon=True)
    server_thread.start()

    # 2) Esperar a que el servidor esté listo
    ready = wait_for_server(HOST, PORT, timeout=30)
    if not ready:
        # Si el servidor no arrancó, mostrar error en la ventana
        url = None
        html = """
        <html><body style="background:#0f172a;color:white;font-family:Arial;
                           display:flex;align-items:center;justify-content:center;
                           height:100vh;margin:0;flex-direction:column;">
          <h2>&#10060; Error al iniciar el servidor interno</h2>
          <p style="color:#94a3b8;">Intenta reiniciar la aplicación.</p>
        </body></html>
        """
    else:
        url  = URL
        html = None

    # 3) Crear la ventana nativa del sistema operativo
    window = webview.create_window(
        title      = "Smart Film Valencia",
        url        = url,
        html       = html,
        width      = 1280,
        height     = 800,
        min_size   = (1024, 680),
        resizable  = True,
        # Sin barra de herramientas de navegador, sin URL visible
        # Es una ventana de aplicación, no un navegador
    )

    # 4) Iniciar pywebview — esto bloquea hasta que el usuario cierra la ventana
    # Al cerrar la ventana, el proceso principal termina y el servidor (daemon) muere con él
    webview.start(debug=False)


if __name__ == "__main__":
    main()
