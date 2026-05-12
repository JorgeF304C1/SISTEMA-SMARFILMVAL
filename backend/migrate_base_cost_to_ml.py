# -*- coding: utf-8 -*-
"""
migrate_base_cost_to_ml.py - Renombra base_cost_per_sqm a base_cost_per_ml.

Cambios:
  system_settings:
    default_base_cost_per_sqm -> default_base_cost_per_ml (valor 110.0)

  projects:
    base_cost_per_sqm -> base_cost_per_ml (valor 110.0 para todos)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartfilm.db")


def upgrade():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # system_settings
    try:
        c.execute("ALTER TABLE system_settings RENAME COLUMN default_base_cost_per_sqm TO default_base_cost_per_ml")
        print("  [OK] system_settings.default_base_cost_per_sqm -> default_base_cost_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    c.execute("UPDATE system_settings SET default_base_cost_per_ml = 110.0")
    print("  [OK] system_settings.default_base_cost_per_ml = 110.0")

    # projects
    try:
        c.execute("ALTER TABLE projects RENAME COLUMN base_cost_per_sqm TO base_cost_per_ml")
        print("  [OK] projects.base_cost_per_sqm -> base_cost_per_ml")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    c.execute("UPDATE projects SET base_cost_per_ml = 110.0")
    print("  [OK] projects.base_cost_per_ml = 110.0 (todos los proyectos)")

    conn.commit()
    conn.close()
    print("\nMigracion completada.")


if __name__ == "__main__":
    print(f"Base de datos: {DB_PATH}")
    upgrade()
