from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db import models
from app.api.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])


# ── Helper de movimientos ──────────────────────────────────────────────────────

def log_movement(db: Session, *, movement_type: str, source_type: str,
                 source_id: Optional[int], source_name: str, quantity: float,
                 unit: str = "u", note: Optional[str] = None, username: Optional[str] = None):
    db.add(models.InventoryMovement(
        movement_type=movement_type, source_type=source_type,
        source_id=source_id, source_name=source_name,
        quantity=quantity, unit=unit, note=note, username=username,
    ))


# ── Schemas ────────────────────────────────────────────────────────────────────

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

class AdjustRequest(BaseModel):
    quantity: float
    note: Optional[str] = None

class ItemCreate(BaseModel):
    name: str
    initial_quantity: float = 0.0

class ItemResponse(BaseModel):
    id: int
    name: str
    current_quantity: float
    created_at: datetime

    class Config:
        from_attributes = True

class MovementResponse(BaseModel):
    id: int
    movement_type: str
    source_type: str
    source_id: Optional[int]
    source_name: str
    quantity: float
    unit: str
    note: Optional[str]
    username: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Bobinas ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[RollResponse])
def get_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.RollInventory).order_by(models.RollInventory.id.desc()).all()

@router.post("/", response_model=RollResponse)
def create_roll(roll: RollCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden registrar inventario nuevo")

    db_roll = models.RollInventory(
        name=roll.name, roll_width=roll.roll_width,
        total_meters=roll.total_meters, current_meters=roll.total_meters, status="Activo"
    )
    db.add(db_roll)
    db.flush()  # get db_roll.id before commit
    if roll.total_meters > 0:
        log_movement(db, movement_type="cargo", source_type="bobina",
                     source_id=db_roll.id, source_name=roll.name,
                     quantity=roll.total_meters, unit="m",
                     note="Registro inicial", username=current_user.username)
    db.commit()
    db.refresh(db_roll)
    return db_roll

@router.put("/{roll_id}/cargar", response_model=RollResponse)
def cargar_roll(roll_id: int, adjust: AdjustRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    roll = db.query(models.RollInventory).filter(models.RollInventory.id == roll_id).first()
    if not roll:
        raise HTTPException(status_code=404, detail="Bobina no encontrada")
    roll.current_meters += adjust.quantity
    roll.total_meters = max(roll.total_meters, roll.current_meters)
    if roll.status == "Agotado" and roll.current_meters > 0:
        roll.status = "Activo"
    log_movement(db, movement_type="cargo", source_type="bobina",
                 source_id=roll.id, source_name=roll.name,
                 quantity=adjust.quantity, unit="m",
                 note=adjust.note, username=current_user.username)
    db.commit()
    db.refresh(roll)
    return roll

@router.put("/{roll_id}/descargar", response_model=RollResponse)
def descargar_roll(roll_id: int, adjust: AdjustRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    roll = db.query(models.RollInventory).filter(models.RollInventory.id == roll_id).first()
    if not roll:
        raise HTTPException(status_code=404, detail="Bobina no encontrada")
    real_qty = min(adjust.quantity, roll.current_meters)
    roll.current_meters = max(0.0, roll.current_meters - adjust.quantity)
    if roll.current_meters <= 0:
        roll.status = "Agotado"
    log_movement(db, movement_type="descargo", source_type="bobina",
                 source_id=roll.id, source_name=roll.name,
                 quantity=real_qty, unit="m",
                 note=adjust.note, username=current_user.username)
    db.commit()
    db.refresh(roll)
    return roll

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


# ── Ítems Generales ────────────────────────────────────────────────────────────

@router.get("/items", response_model=List[ItemResponse])
def list_items(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.InventoryItem).order_by(models.InventoryItem.name).all()

@router.post("/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_item = models.InventoryItem(name=item.name, current_quantity=item.initial_quantity)
    db.add(db_item)
    db.flush()
    if item.initial_quantity > 0:
        log_movement(db, movement_type="cargo", source_type="item",
                     source_id=db_item.id, source_name=item.name,
                     quantity=item.initial_quantity, unit="u",
                     note="Registro inicial", username=current_user.username)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/items/{item_id}/cargar", response_model=ItemResponse)
def cargar_item(item_id: int, adjust: AdjustRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    item.current_quantity += adjust.quantity
    log_movement(db, movement_type="cargo", source_type="item",
                 source_id=item.id, source_name=item.name,
                 quantity=adjust.quantity, unit="u",
                 note=adjust.note, username=current_user.username)
    db.commit()
    db.refresh(item)
    return item

@router.put("/items/{item_id}/descargar", response_model=ItemResponse)
def descargar_item(item_id: int, adjust: AdjustRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    real_qty = min(adjust.quantity, item.current_quantity)
    item.current_quantity = max(0.0, item.current_quantity - adjust.quantity)
    log_movement(db, movement_type="descargo", source_type="item",
                 source_id=item.id, source_name=item.name,
                 quantity=real_qty, unit="u",
                 note=adjust.note, username=current_user.username)
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


# ── Movimientos ────────────────────────────────────────────────────────────────

@router.get("/movements", response_model=List[MovementResponse])
def list_movements(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Solo administradores")
    return (db.query(models.InventoryMovement)
              .order_by(models.InventoryMovement.created_at.desc())
              .limit(500).all())
