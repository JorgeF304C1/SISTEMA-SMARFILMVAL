from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import shutil
import os
import uuid
import math
from app.db.database import get_db
from app.db import models

router = APIRouter(prefix="/projects", tags=["Projects"])

# Pydantic Schemas
class ProjectCreate(BaseModel):
    name: str
    client_name: str
    client_ci_rif: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    client_address: Optional[str] = None
    installation_date: Optional[str] = None

class AreaCreate(BaseModel):
    name: Optional[str] = ""
    width: float
    height: float

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    expense_type: str = "Variable"

class ProjectStatusUpdate(BaseModel):
    status: str
    approved_date: Optional[str] = None
    completed_date: Optional[str] = None

class ProjectPriceUpdate(BaseModel):
    price_per_sqm: float

class ProjectRollWidthUpdate(BaseModel):
    roll_width: float

class ProjectBaseCostUpdate(BaseModel):
    base_cost_per_sqm: float

class ProjectLaborCostUpdate(BaseModel):
    labor_cost_per_sqm: float

class ProjectInstallationDateUpdate(BaseModel):
    installation_date: Optional[str]

def calculate_consumption(areas, roll_width):
    if roll_width <= 0:
        return 0, [], 0, 0, 0, 100
    
    pieces = []
    # 1. Fragment pieces
    for area in areas:
        if area.width > roll_width:
            N = math.ceil(area.width / roll_width)
            piece_width = area.width / N
            for _ in range(N):
                pieces.append({
                    "original_area_name": area.name or "Área",
                    "width": round(piece_width, 4),
                    "height": area.height,
                    "area": piece_width * area.height
                })
        else:
            pieces.append({
                "original_area_name": area.name or "Área",
                "width": area.width,
                "height": area.height,
                "area": area.area
            })
            
    # 2. Sort by height desc, then width desc
    pieces.sort(key=lambda p: (p["height"], p["width"]), reverse=True)
    
    # 3. Bin packing (Row approach)
    rows = []
    epsilon = 0.001
    
    for p in pieces:
        placed = False
        for r in rows:
            if r["current_width"] + p["width"] <= roll_width + epsilon:
                r["current_width"] += p["width"]
                r["pieces"].append(p)
                placed = True
                break
        if not placed:
            rows.append({
                "max_height": p["height"],
                "current_width": p["width"],
                "pieces": [p]
            })
            
    # 4. Calculate metrics
    true_linear_meters = sum(r["max_height"] for r in rows)
    total_installed_area = sum(p["area"] for p in pieces)
    total_material_area = true_linear_meters * roll_width
    waste_m2 = total_material_area - total_installed_area
    efficiency = (total_installed_area / total_material_area * 100) if total_material_area > 0 else 100
    
    return true_linear_meters, rows, total_installed_area, total_material_area, waste_m2, efficiency

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    
    total_active = len(projects)
    total_m2 = 0
    total_revenue = 0
    
    project_list = []
    
    for p in projects:
        true_linear_meters, _, total_installed_area, total_material_area, _, _ = calculate_consumption(p.areas, p.roll_width)
        income = total_installed_area * p.price_per_sqm
        material_cost = total_material_area * p.base_cost_per_sqm
        labor_cost = total_installed_area * p.labor_cost_per_sqm
        
        if p.status == "Completado":
            total_m2 += total_installed_area
            total_revenue += income
        
        project_list.append({
            "id": p.id,
            "name": p.name,
            "client_name": p.client_name_direct or "Desconocido",
            "client_ci_rif": p.client_ci_rif_direct or "",
            "status": p.status,
            "installation_date": p.installation_date,
            "total_area": round(total_installed_area, 2),
            "net_profit": round(income - sum(e.amount for e in p.expenses if not e.is_nullified) - material_cost - labor_cost - p.module_cost, 2)
        })
        
    return {
        "metrics": {
            "active": total_active,
            "m2": round(total_m2, 2),
            "revenue": round(total_revenue, 2)
        },
        "projects": project_list
    }

@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@router.post("/")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    # Read default settings if needed, or just insert. The model has defaults.
    # To be perfect, we should read SystemSettings here. 
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
        db.commit()
    
    db_project = models.Project(
        name=project.name, 
        client_name_direct=project.client_name,
        client_ci_rif_direct=project.client_ci_rif,
        client_phone_direct=project.client_phone,
        client_email_direct=project.client_email,
        client_address_direct=project.client_address,
        price_per_sqm=settings.default_price_per_sqm,
        roll_width=settings.default_roll_width,
        base_cost_per_sqm=settings.default_base_cost_per_sqm,
        labor_cost_per_sqm=settings.default_labor_cost_per_sqm,
        installation_date=project.installation_date
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{project_id}/status")
def update_project_status(project_id: int, status_update: ProjectStatusUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "Completado" and status_update.status == "Completado":
        # Automatically deduct inventory
        linear_meters, _, _, _, _, _ = calculate_consumption(project.areas, project.roll_width)
        
        if linear_meters > 0:
            active_rolls = db.query(models.RollInventory).filter(
                models.RollInventory.status == "Activo",
                models.RollInventory.roll_width == project.roll_width
            ).order_by(models.RollInventory.id.asc()).all()
            
            remaining_to_deduct = linear_meters
            for roll in active_rolls:
                if remaining_to_deduct <= 0:
                    break
                if roll.current_meters >= remaining_to_deduct:
                    roll.current_meters -= remaining_to_deduct
                    remaining_to_deduct = 0
                else:
                    remaining_to_deduct -= roll.current_meters
                    roll.current_meters = 0
                    roll.status = "Agotado"

    project.status = status_update.status
    if status_update.approved_date is not None:
        project.approved_date = status_update.approved_date
    if status_update.completed_date is not None:
        project.completed_date = status_update.completed_date
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}/price")
def update_project_price(project_id: int, price_update: ProjectPriceUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.price_per_sqm = price_update.price_per_sqm
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}/roll_width")
def update_project_roll_width(project_id: int, width_update: ProjectRollWidthUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.roll_width = width_update.roll_width
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}/installation_date")
def update_installation_date(project_id: int, date_update: ProjectInstallationDateUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.installation_date = date_update.installation_date
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}/base_cost")
def update_project_base_cost(project_id: int, cost_update: ProjectBaseCostUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.base_cost_per_sqm = cost_update.base_cost_per_sqm
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}/labor_cost")
def update_project_labor_cost(project_id: int, cost_update: ProjectLaborCostUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.labor_cost_per_sqm = cost_update.labor_cost_per_sqm
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.get("/{project_id}")
def get_project_detail(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Calculate detailed metrics with explicit bin packing
    true_linear_meters, rows, total_installed_area, total_material_area, waste_m2, efficiency = calculate_consumption(project.areas, project.roll_width)
    total_income = total_installed_area * project.price_per_sqm
    
    # Calculate base material cost dynamically using total consumed area
    material_cost = total_material_area * project.base_cost_per_sqm
    labor_cost = total_installed_area * project.labor_cost_per_sqm
    
    total_expenses = sum(e.amount for e in project.expenses if not e.is_nullified)
    net_profit = total_income - total_expenses - material_cost - labor_cost - project.module_cost
    
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "client_name": project.client_name_direct or "Sin Cliente",
            "client_phone": project.client_phone_direct or "",
            "address": project.client_address_direct or "",
            "ci_rif": project.client_ci_rif_direct or "",
            "status": project.status,
            "price_per_sqm": project.price_per_sqm,
            "roll_width": project.roll_width,
            "module_cost": project.module_cost,
            "base_cost_per_sqm": project.base_cost_per_sqm,
            "labor_cost_per_sqm": project.labor_cost_per_sqm,
            "installation_date": project.installation_date,
            "created_at": project.created_at
        },
        "areas": project.areas,
        "expenses": [{"id": e.id, "description": e.description, "amount": e.amount, "expense_type": e.expense_type, "is_nullified": e.is_nullified} for e in project.expenses],
        "photos": [{"id": p.id, "file_path": p.file_path} for p in project.photos],
        "consumption_breakdown": rows,
        "metrics": {
            "total_area_sqm": round(total_installed_area, 2),
            "total_material_sqm": round(total_material_area, 2),
            "waste_m2": round(waste_m2, 2),
            "efficiency_percentage": round(efficiency, 2),
            "linear_meters": round(true_linear_meters, 2),
            "total_income": round(total_income, 2),
            "material_cost": round(material_cost, 2),
            "labor_cost": round(labor_cost, 2),
            "variable_expenses": round(total_expenses, 2),
            "total_expenses": round(total_expenses + project.module_cost + material_cost + labor_cost, 2),
            "net_profit": round(net_profit, 2)
        }
    }

@router.post("/{project_id}/areas")
def add_area(project_id: int, area: AreaCreate, db: Session = Depends(get_db)):
    db_area = models.ProjectArea(project_id=project_id, **area.model_dump())
    db.add(db_area)
    db.commit()
    db.refresh(db_area)
    return db_area

@router.delete("/{project_id}/areas/{area_id}")
def delete_area(project_id: int, area_id: int, db: Session = Depends(get_db)):
    db_area = db.query(models.ProjectArea).filter(
        models.ProjectArea.id == area_id,
        models.ProjectArea.project_id == project_id
    ).first()
    if not db_area:
        raise HTTPException(status_code=404, detail="Area not found")
    db.delete(db_area)
    db.commit()
    return {"message": "Area deleted successfully"}

@router.post("/{project_id}/expenses")
def add_expense(project_id: int, expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.ProjectExpense(project_id=project_id, **expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.put("/{project_id}/expenses/{expense_id}/nullify")
def nullify_expense(project_id: int, expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.ProjectExpense).filter(
        models.ProjectExpense.id == expense_id,
        models.ProjectExpense.project_id == project_id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db_expense.is_nullified = not db_expense.is_nullified
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.post("/{project_id}/photos")
def upload_photo(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    upload_dir = f"../local_storage/photos/project_{project_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_photo = models.ProjectPhoto(project_id=project_id, file_path=file_path)
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo
