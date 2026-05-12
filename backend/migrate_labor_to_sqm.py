# -*- coding: utf-8 -*-
"""
migrate_labor_to_sqm.py - Revierte labor_cost a per_sqm y agrega pricing_mode.

Cambios:
  system_settings:
    default_labor_cost_per_ml -> default_labor_cost_per_sqm (valor 15.0)

  projects:
    labor_cost_per_ml -> labor_cost_per_sqm
    + pricing_mode TEXT DEFAULT 'ml'
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartfilm.db")


def upgrade():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # system_settings
    try:
        c.execute("ALTER TABLE system_settings RENAME COLUMN default_labor_cost_per_ml TO default_labor_cost_per_sqm")
        print("  [OK] system_settings.default_labor_cost_per_ml -> default_labor_cost_per_sqm")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    # projects: rename labor column
    try:
        c.execute("ALTER TABLE projects RENAME COLUMN labor_cost_per_ml TO labor_cost_per_sqm")
        print("  [OK] projects.labor_cost_per_ml -> labor_cost_per_sqm")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    # projects: add pricing_mode
    try:
        c.execute("ALTER TABLE projects ADD COLUMN pricing_mode TEXT DEFAULT 'ml'")
        print("  [OK] projects.pricing_mode added (default 'ml')")
    except sqlite3.OperationalError as e:
        print(f"  [SKIP] {e}")

    c.execute("UPDATE projects SET pricing_mode = 'ml' WHERE pricing_mode IS NULL")

    conn.commit()
    conn.close()
    print("\nMigracion completada.")


if __name__ == "__main__":
    print(f"Base de datos: {DB_PATH}")
    upgrade()
