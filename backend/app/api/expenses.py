from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.db import models
from app.api.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Global Expenses"])

class GlobalExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str = "Marketing"

class GlobalExpenseResponse(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[GlobalExpenseResponse])
def get_global_expenses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.GlobalExpense).order_by(models.GlobalExpense.id.desc()).all()

@router.post("/", response_model=GlobalExpenseResponse)
def create_global_expense(expense: GlobalExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauth")
        
    db_expense = models.GlobalExpense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}")
def delete_global_expense(expense_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Unauth")
        
    expense = db.query(models.GlobalExpense).filter(models.GlobalExpense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Not found")
        
    db.delete(expense)
    db.commit()
    return {"message": "Deleted"}
