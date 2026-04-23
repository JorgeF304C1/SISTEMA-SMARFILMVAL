import socket
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db.database import engine, Base
from app.db import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Film Valencia API")

# Mount local storage for photos
os.makedirs("../local_storage/photos", exist_ok=True)
app.mount("/photos", StaticFiles(directory="../local_storage/photos"), name="photos")

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
    "http://localhost:5173", # Vite dev server
    f"http://{local_ip}:5173",
    "tauri://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Film Valencia API"}

from pydantic import BaseModel
from fastapi import Depends, HTTPException
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

# Include routers
from app.api import projects, auth, inventory, expenses

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
# PDF endpoints migrated to Frontend to avoid GTK3 dependency on Windows.
