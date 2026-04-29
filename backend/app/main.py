"""
main.py — Smart Film Valencia API
Sirve tanto la API REST como el frontend React compilado (en modo producción/ejecutable).
"""
import socket
import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.db.database import engine, Base
from app.db import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Film Valencia API")

# ── Resolve base paths ───────────────────────────────────────────────────────
# When running as a PyInstaller bundle, __file__ lives inside the temp folder.
# We keep local_storage NEXT TO the .exe (or backend/ in dev mode).
if getattr(sys, 'frozen', False):
    # Packaged .exe: everything is relative to the executable's directory
    APP_DIR = os.path.dirname(sys.executable)
else:
    # Dev mode: relative to this file (backend/)
    APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

STORAGE_DIR = os.path.join(APP_DIR, "local_storage")

# ── Ensure local_storage directories exist ───────────────────────────────────
os.makedirs(os.path.join(STORAGE_DIR, "proyectos"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "documentos", "cotizador_express"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "documentos", "cotizaciones"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "documentos", "notas_de_entrega"), exist_ok=True)

# ── Static file mounts for user data ────────────────────────────────────────
app.mount("/proyectos",   StaticFiles(directory=os.path.join(STORAGE_DIR, "proyectos")),  name="proyectos")
app.mount("/documentos",  StaticFiles(directory=os.path.join(STORAGE_DIR, "documentos")), name="documentos")

# ── CORS ─────────────────────────────────────────────────────────────────────
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

local_ip = get_local_ip()

origins = [
    "http://localhost",
    "http://localhost:5173",   # Vite dev server
    "http://localhost:8000",   # Prod (FastAPI serving frontend)
    f"http://{local_ip}:5173",
    f"http://{local_ip}:8000",
    "tauri://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API root ─────────────────────────────────────────────────────────────────
@app.get("/api")
@app.get("/api/info")
def read_root():
    return {"message": "Smart Film Valencia API", "version": "1.0.0"}

# ── Settings endpoints ───────────────────────────────────────────────────────
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import get_db

class SettingsUpdate(BaseModel):
    default_price_per_sqm: float
    default_roll_width: float
    default_base_cost_per_sqm: float
    default_labor_cost_per_sqm: float
    delivery_note_warranty_months: int

@app.get("/api/v1/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/api/v1/settings")
def update_settings(settings_update: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
    settings.default_price_per_sqm = settings_update.default_price_per_sqm
    settings.default_roll_width = settings_update.default_roll_width
    settings.default_base_cost_per_sqm = settings_update.default_base_cost_per_sqm
    settings.default_labor_cost_per_sqm = settings_update.default_labor_cost_per_sqm
    settings.delivery_note_warranty_months = settings_update.delivery_note_warranty_months
    db.commit()
    db.refresh(settings)
    return settings

# ── Feature routers ──────────────────────────────────────────────────────────
from app.api import projects, auth, inventory, expenses, documents

app.include_router(auth.router,       prefix="/api/v1/auth")
app.include_router(inventory.router,  prefix="/api/v1")
app.include_router(expenses.router,   prefix="/api/v1")
app.include_router(projects.router,   prefix="/api/v1")
app.include_router(documents.router,  prefix="/api/v1")

# ── Serve compiled React frontend (production / .exe mode) ───────────────────
# The frontend build outputs to backend/static_frontend/ via vite.config.js
if getattr(sys, 'frozen', False):
    # In .exe mode, static_frontend is in _MEIPASS
    FRONTEND_DIR = os.path.join(sys._MEIPASS, "static_frontend")
else:
    FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "static_frontend")

if os.path.isdir(FRONTEND_DIR):
    ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")
    if os.path.isdir(ASSETS_DIR):
        app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="frontend_assets")

    @app.get("/")
    def serve_root():
        """Serve the React SPA root."""
        index = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"message": "Frontend not built. Run: npm run build in /frontend"}

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """
        Catch-all: serves static files from FRONTEND_DIR root, or index.html for React Router paths.
        API and static routes are matched first by FastAPI before this catches anything.
        """
        # First, check if the file actually exists in the frontend dir (e.g. logo.png, favicon.svg)
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html for React Router
        index = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
