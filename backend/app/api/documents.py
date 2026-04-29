"""
documents.py — API para generar y gestionar documentos PDF guardados en carpetas locales.
Al generar un documento, se guarda en la carpeta correcta y se abre el explorador de Windows.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import base64
import subprocess
from datetime import datetime

router = APIRouter(prefix="/documents", tags=["Documents"])

# Resolve base storage path (works in dev and PyInstaller .exe)
import sys
if getattr(sys, 'frozen', False):
    # Running as .exe — store next to the executable
    _APP_DIR = os.path.dirname(sys.executable)
else:
    # Dev mode — go up from app/api/ to project root
    _APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

BASE_DOCS_DIR = os.path.join(_APP_DIR, "local_storage", "documentos")

# Sub-carpetas por tipo
DOC_TYPE_DIRS = {
    "express":       os.path.join(BASE_DOCS_DIR, "cotizador_express"),
    "cotizacion":    os.path.join(BASE_DOCS_DIR, "cotizaciones"),
    "nota_entrega":  os.path.join(BASE_DOCS_DIR, "notas_de_entrega"),
}

class GenerateDocRequest(BaseModel):
    doc_type: str          # "express" | "cotizacion" | "nota_entrega"
    pdf_base64: str        # El PDF como base64 enviado desde el frontend
    project_id: int | None = None
    project_name: str | None = None
    client_name: str = "Cliente"

class GenerateDocResponse(BaseModel):
    success: bool
    file_path: str
    folder_path: str
    filename: str

def sanitize(name: str) -> str:
    """Limpia el nombre para usar como carpeta/archivo."""
    return "".join(c if c.isalnum() or c in " _-" else "_" for c in name).strip().replace(" ", "_")

@router.post("/generate", response_model=GenerateDocResponse)
def generate_document(req: GenerateDocRequest):
    """
    Recibe un PDF en base64 desde el frontend, lo guarda en la carpeta correcta
    y devuelve la ruta del archivo creado.
    """
    if req.doc_type not in DOC_TYPE_DIRS:
        raise HTTPException(status_code=400, detail=f"Tipo de documento inválido: {req.doc_type}")
    
    # Decodificar el PDF
    try:
        pdf_bytes = base64.b64decode(req.pdf_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="PDF base64 inválido")
    
    fecha = datetime.now().strftime("%Y-%m-%d")
    cliente = sanitize(req.client_name)
    
    # Determinar la carpeta destino
    if req.doc_type == "express":
        # Cotizador Express: todo va al mismo nivel
        folder = DOC_TYPE_DIRS["express"]
        filename = f"Express_{fecha}_{cliente}.pdf"
    else:
        # Cotización o Nota de Entrega: subcarpeta por proyecto
        if req.project_id and req.project_name:
            proj_folder = f"Proyecto_{req.project_id}_{sanitize(req.project_name)}"
        elif req.project_id:
            proj_folder = f"Proyecto_{req.project_id}"
        else:
            proj_folder = f"Proyecto_SinID"
        
        folder = os.path.join(DOC_TYPE_DIRS[req.doc_type], proj_folder)
        
        if req.doc_type == "cotizacion":
            filename = f"Cotizacion_{cliente}_{fecha}.pdf"
        else:
            filename = f"NotaEntrega_{cliente}_{fecha}.pdf"
    
    # Crear carpeta si no existe
    os.makedirs(folder, exist_ok=True)
    
    # Si ya existe un archivo con ese nombre, añadir sufijo numérico
    file_path = os.path.join(folder, filename)
    base, ext = os.path.splitext(filename)
    counter = 1
    while os.path.exists(file_path):
        file_path = os.path.join(folder, f"{base}_{counter}{ext}")
        counter += 1
    filename = os.path.basename(file_path)
    
    # Guardar el PDF
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)
    
    return GenerateDocResponse(
        success=True,
        file_path=file_path,
        folder_path=folder,
        filename=filename
    )

@router.post("/open-folder")
def open_folder(folder_path: str):
    """
    Abre la carpeta en el explorador de archivos de Windows.
    """
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=404, detail="Carpeta no encontrada")
    try:
        subprocess.Popen(f'explorer "{folder_path}"')
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OpenFolderRequest(BaseModel):
    folder_path: str

@router.post("/open-folder-post")
def open_folder_post(req: OpenFolderRequest):
    """
    Abre la carpeta en el explorador de archivos de Windows (versión POST con body).
    """
    folder_path = req.folder_path
    if not os.path.exists(folder_path):
        # Si no existe, abrir la carpeta raíz de documentos
        folder_path = BASE_DOCS_DIR
        os.makedirs(folder_path, exist_ok=True)
    try:
        subprocess.Popen(f'explorer "{folder_path}"')
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
