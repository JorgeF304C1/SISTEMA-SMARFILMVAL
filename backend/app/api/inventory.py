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
