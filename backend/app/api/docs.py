from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import datetime
from app.db.database import get_db
from app.db import models
from app.services.pdf_generator import generate_pdf

router = APIRouter(prefix="/projects", tags=["Documents"])

@router.get("/{project_id}/pdf/quote")
def get_quote_pdf(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    export_dir = f"../local_storage/pdf_exports"
    os.makedirs(export_dir, exist_ok=True)
    
    total_area = sum(p.area for p in project.panels)
    total_income = total_area * project.price_per_sqm
    
    context = {
        "project": project,
        "panels": project.panels,
        "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "total_area": round(total_area, 2),
        "total_income": round(total_income, 2)
    }
    
    output_filename = f"Cotizacion_{project_id}_{project.client_name.replace(' ', '_')}.pdf"
    output_path = os.path.join(export_dir, output_filename)
    
    generate_pdf("quote.html", context, output_path)
    
    return FileResponse(
        path=output_path, 
        filename=output_filename, 
        media_type='application/pdf'
    )
