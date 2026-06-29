from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db import models
from app.api.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])

class RollCreate(BaseModel):
    name: str
    roll_width: float
    total_meters: float

class RollResponse(BaseModel):
    id: int
    name: str
    roll_width: float
    total_meters: float
    current_meters: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[RollResponse])
def get_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.RollInventory).order_by(models.RollInventory.id.desc()).all()

@router.post("/", response_model=RollResponse)
def create_roll(roll: RollCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden registrar inventario nuevo")
        
    db_roll = models.RollInventory(
        name=roll.name,
        roll_width=roll.roll_width,
        total_meters=roll.total_meters,
        current_meters=roll.total_meters,
        status="Activo"
    )
    db.add(db_roll)
    db.commit()
    db.refresh(db_roll)
    return db_roll

@router.delete("/{roll_id}")
def delete_roll(roll_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauth")

    roll = db.query(models.RollInventory).filter(models.RollInventory.id == roll_id).first()
    if not roll:
        raise HTTPException(status_code=404, detail="Roll not found")

    db.delete(roll)
    db.commit()
    return {"message": "Roll deleted"}


# ── Ítems Generales de Inventario ─────────────────────────────────────────────

class ItemCreate(BaseModel):
    name: str
    initial_quantity: float = 0.0

class ItemAdjust(BaseModel):
    quantity: float

class ItemResponse(BaseModel):
    id: int
    name: str
    current_quantity: float
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/items", response_model=List[ItemResponse])
def list_items(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.InventoryItem).order_by(models.InventoryItem.name).all()

@router.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_item = models.InventoryItem(name=item.name, current_quantity=item.initial_quantity)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/items/{item_id}/cargar", response_model=ItemResponse)
def cargar_item(item_id: int, adjust: ItemAdjust, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    item.current_quantity += adjust.quantity
    db.commit()
    db.refresh(item)
    return item

@router.put("/items/{item_id}/descargar", response_model=ItemResponse)
def descargar_item(item_id: int, adjust: ItemAdjust, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    item.current_quantity = max(0.0, item.current_quantity - adjust.quantity)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    db.delete(item)
    db.commit()
    return {"message": "Ítem eliminado"}
