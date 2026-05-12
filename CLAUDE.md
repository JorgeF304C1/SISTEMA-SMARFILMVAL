# CLAUDE.md — SmartFilm Valencia

Sistema de gestión para una empresa que instala Smart Film (película inteligente para vidrios).
Cotizaciones, notas de entrega, cálculo de cortes, finanzas y control de inventario de bobinas.

---

## Stack

- **Backend:** Python 3.13 + FastAPI + SQLAlchemy + SQLite (`backend/smartfilm.db`)
- **Frontend:** React + Vite (JSX, sin TypeScript)
- **Empaquetado:** PyInstaller + pywebview → `SmartFilm_Valencia.exe` (Windows nativo, sin navegador)
- **PDFs:** html2pdf.js en el frontend → base64 → backend lo guarda en `local_storage/documentos/`

---

## Estructura de archivos clave

```
backend/
  app/
    db/
      models.py          # Modelos SQLAlchemy
      database.py        # Engine y sesión SQLite
    api/
      projects.py        # API proyectos + calculate_consumption() (bin packing)
      expenses.py        # Gastos globales
      inventory.py       # Inventario de bobinas
      documents.py       # Guardar PDFs en disco
    main.py              # FastAPI app + endpoints /settings
  launcher.py            # Entrypoint pywebview para el .exe
  smartfilm.spec         # Configuración PyInstaller
  build_windows.bat      # Script de build completo (frontend + PyInstaller)
  migrate_*.py           # Scripts de migración de BD (ejecutar manualmente)

frontend/
  src/
    App.jsx              # Layout principal + Cotizador Express modal
    pages/
      ProjectDetail.jsx  # Detalle de proyecto: finanzas, áreas, PDFs
      Settings.jsx        # Configuración del sistema
      Dashboard.jsx
      NewProject.jsx
      InventoryPage.jsx
    utils/
      pdfUtils.js        # generateAndSavePDF() — genera PDF y lo envía al backend
  public/
    logo.png             # Logo de la empresa (aparece en PDFs y sidebar)
```

---

## Modelo de datos importante

### Project
```python
price_per_ml         # Precio de venta por metro lineal ($/ml)
roll_width           # Ancho de bobina en metros (ej. 1.5m)
base_cost_per_ml     # Costo del material por metro lineal consumido ($/ml)
labor_cost_per_sqm   # Costo de mano de obra por m² instalado ($/m²)
module_cost          # Costo fijo del módulo electrónico
pricing_mode         # "ml" (activo) | "m2" (desactivado, reservado para futuro)
```

### SystemSettings
```python
default_price_per_ml       # Precio por ml para nuevos proyectos
default_roll_width          # Ancho de bobina predeterminado
default_base_cost_per_ml    # Costo material predeterminado ($/ml, actualmente $110)
default_labor_cost_per_sqm  # Costo mano de obra predeterminado (actualmente $15)
delivery_note_warranty_months
```

---

## Lógica financiera (modo ml — único modo activo)

```
ingreso        = metros_lineales_reales × price_per_ml
costo_material = true_linear_meters × base_cost_per_ml
costo_personal = area_instalada × labor_cost_per_sqm      ← por m², NO por ml
ganancia_neta  = ingreso - costo_material - costo_personal - module_cost - gastos_variables
```

**Importante:** el costo de personal se calcula sobre `area_instalada` (m²), no sobre metros lineales.

---

## Función calculate_consumption() — NO MODIFICAR SIN ENTENDER

En `backend/app/api/projects.py`. Implementa bin packing de piezas sobre una bobina de ancho fijo.

Retorna: `(true_linear_meters, rows, total_installed_area, total_material_area, waste_m2, efficiency)`

- `true_linear_meters` → metros de bobina que se consumen (base del ingreso)
- `total_installed_area` → suma real de las áreas de los paneles (base del costo de personal)
- `total_material_area` → `true_linear_meters × roll_width` (base del costo de material)
- Los `rows` se muestran en la pestaña Áreas como guía visual de corte

---

## PDFs

Tres tipos: `cotizacion`, `nota_entrega`, `express` (cotizador rápido sin proyecto).

El HTML se construye en el frontend (ProjectDetail.jsx y App.jsx) y se envía como base64 al endpoint `POST /api/v1/documents/generate`.

**El logo `/logo.png` debe aparecer en todos los PDFs** — está en `frontend/public/` y se referencia como `src="/logo.png"` con `crossorigin="anonymous"`.

Concepto en cotización/nota de entrega:
```
Instalación SmartFilm (X ml × Precio $Y)   →   Total: $Z
```

---

## Modo m² (desactivado)

El campo `pricing_mode` existe en la BD con default `"ml"`. El código para modo m² **no está implementado** en la UI pero el campo está reservado para reactivación futura. No eliminar `pricing_mode` del modelo.

Cuando se reactive, la lógica sería:
```
ingreso = area_instalada × price_per_sqm  (campo aún no existe en BD)
```

---

## Migraciones de BD

Siempre crear un script `migrate_*.py` en `backend/`. Ejecutar manualmente con el venv del proyecto principal:

```bash
cd backend
./venv/Scripts/python.exe migrate_nombre.py
```

Migraciones ya ejecutadas (en orden):
1. `migrate_db.py` — estructura inicial
2. `migrate_clients.py` — campos de cliente directo
3. `migrate_cost.py` — costos base
4. `migrate_cost_2.py` — labor_cost_per_sqm inicial
5. `migrate_ml.py` — renombra price/labor a _per_ml, agrega pricing_mode
6. `migrate_labor_to_sqm.py` — revierte labor a _per_sqm, agrega pricing_mode
7. `migrate_base_cost_to_ml.py` — renombra base_cost_per_sqm → base_cost_per_ml, default $110/ml

---

## Build del ejecutable

```bash
# Desde backend/
build_windows.bat          # Hace todo: npm build + pip install + PyInstaller

# O paso a paso:
cd frontend && npm run build           # compila a backend/static_frontend/
cd backend && ./venv/Scripts/pyinstaller.exe smartfilm.spec --noconfirm
```

**Cerrar el .exe antes de hacer build** — PyInstaller no puede sobreescribir archivos en uso.

Salida: `backend/dist/SmartFilm_Valencia/SmartFilm_Valencia.exe`

---

## Convenciones de código

- El backend **no usa Alembic** — migraciones manuales con sqlite3
- Los endpoints de settings están en `main.py` (no en un router separado)
- El frontend llama a `/api/v1/...` — el prefijo viene del `include_router` en `main.py`
- `pdfUtils.js` es la única forma de generar y guardar PDFs — no duplicar esa lógica
- El worktree de Claude está en `.claude/worktrees/` — siempre sincronizar archivos cambiados al directorio principal antes del build
