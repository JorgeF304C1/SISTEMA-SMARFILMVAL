"""
launcher.py — SmartFilm Valencia Desktop Launcher
Este es el punto de entrada del ejecutable (.exe en Windows, app en macOS).

Al ejecutarse:
1. Arranca el servidor FastAPI en el puerto 8000 (en un hilo separado)
2. Espera a que el servidor esté listo
3. Abre el navegador del sistema apuntando a http://localhost:8000
4. Permanece activo hasta que el usuario cierre la ventana del terminal/app
"""
import sys
import os
import time
import threading
import webbrowser
import subprocess
import socket
import signal

PORT = 8000
HOST = "127.0.0.1"

# ── Resolve paths ─────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # PyInstaller: los archivos están en _MEIPASS (temp) pero el .exe está aquí
    BASE_DIR = os.path.dirname(sys.executable)
    INTERNAL_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    INTERNAL_DIR = BASE_DIR

# Asegurar que la base de datos y local_storage vivan junto al .exe
os.chdir(BASE_DIR)

# ── Wait for server to be ready ────────────────────────────────────────────────
def wait_for_server(host: str, port: int, timeout: int = 30) -> bool:
    """Espera hasta que el servidor acepte conexiones TCP."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (ConnectionRefusedError, OSError):
            time.sleep(0.3)
    return False

# ── Start FastAPI server ───────────────────────────────────────────────────────
def start_server():
    """Arranca uvicorn con la app FastAPI."""
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        log_level="warning",
        # No reload en producción
        reload=False,
    )

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 50)
    print("  Smart Film Valencia — Iniciando sistema...")
    print("=" * 50)

    # Iniciar servidor en hilo de fondo
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Esperar a que el servidor esté listo
    print(f"  Esperando servidor en http://{HOST}:{PORT}...")
    if wait_for_server(HOST, PORT, timeout=30):
        url = f"http://{HOST}:{PORT}"
        print(f"  ✅ Servidor listo. Abriendo {url}")
        # Abrir el navegador predeterminado del sistema
        webbrowser.open(url)
    else:
        print("  ❌ El servidor no respondió a tiempo.")
        print("     Abre manualmente: http://localhost:8000")

    print("  Sistema activo. Cierra esta ventana para apagar el servidor.")
    print("=" * 50)

    # Mantener vivo el proceso principal
    try:
        while server_thread.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  Apagando Smart Film Valencia...")
        sys.exit(0)

if __name__ == "__main__":
    main()
