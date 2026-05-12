# -*- coding: utf-8 -*-
"""
migrate_ml.py - Renombra columnas de precio y mano de obra de m2 a ml.

Cambios:
  system_settings:
    default_price_per_sqm      -> default_price_per_ml   (default 200)
    default_labor_cost_per_sqm -> default_labor_cost_per_ml (default 15)

  projects:
    price_per_sqm      -> price_per_ml
    labor_cost_per_sqm -> labor_cost_per_ml  (valores existentes se actualizan a 15)
"""
import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartfilm.db")


def upgrade():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # system_settings
    try:
        c.execute("ALTER TABLE system_settings RENAME COLUMN default_price_per_sqm TO default_price_per_ml")
        print("  [OK] system_settings.default_price_per_sqm -> default_price_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    try:
        c.execute("ALTER TABLE system_settings RENAME COLUMN default_labor_cost_per_sqm TO default_labor_cost_per_ml")
        print("  [OK] system_settings.default_labor_cost_per_sqm -> default_labor_cost_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    c.execute("UPDATE system_settings SET default_labor_cost_per_ml = 15.0")
    print("  [OK] system_settings.default_labor_cost_per_ml = 15.0")

    # projects
    try:
        c.execute("ALTER TABLE projects RENAME COLUMN price_per_sqm TO price_per_ml")
        print("  [OK] projects.price_per_sqm -> price_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    try:
        c.execute("ALTER TABLE projects RENAME COLUMN labor_cost_per_sqm TO labor_cost_per_ml")
        print("  [OK] projects.labor_cost_per_sqm -> labor_cost_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    c.execute("UPDATE projects SET labor_cost_per_ml = 15.0")
    print("  [OK] projects.labor_cost_per_ml = 15.0 (todos los proyectos)")

    conn.commit()
    conn.close()
    print("\nMigracion completada exitosamente.")


if __name__ == "__main__":
    print(f"Base de datos: {DB_PATH}")
    upgrade()
