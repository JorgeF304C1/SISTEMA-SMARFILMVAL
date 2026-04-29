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

# ── Resolve paths ──────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # PyInstaller: el .exe está aquí, los archivos empaquetados en _MEIPASS
    APP_DIR      = os.path.dirname(sys.executable)
    INTERNAL_DIR = sys._MEIPASS
else:
    # Dev mode
    APP_DIR      = os.path.dirname(os.path.abspath(__file__))
    INTERNAL_DIR = APP_DIR

# La base de datos y local_storage viven JUNTO al .exe (no en _MEIPASS)
os.chdir(APP_DIR)

PORT = 8000
HOST = "127.0.0.1"
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
    uvicorn.run(
        "app.main:app",
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
