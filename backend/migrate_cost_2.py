import sqlite3

def upgrade():
    conn = sqlite3.connect('smartfilm.db')
    c = conn.cursor()
    
    # 1. Update existing settings for base cost to 70
    c.execute("UPDATE system_settings SET default_base_cost_per_sqm = 70.0")

    # 2. Add default_labor_cost_per_sqm to system_settings
    try:
        c.execute("ALTER TABLE system_settings ADD COLUMN default_labor_cost_per_sqm FLOAT DEFAULT 10.0;")
    except sqlite3.OperationalError as e:
        pass
    
    c.execute("UPDATE system_settings SET default_labor_cost_per_sqm = 10.0 WHERE default_labor_cost_per_sqm IS NULL")

    # 3. Add labor_cost_per_sqm to projects
    try:
        c.execute("ALTER TABLE projects ADD COLUMN labor_cost_per_sqm FLOAT DEFAULT 10.0;")
    except sqlite3.OperationalError as e:
        pass
        
    c.execute("UPDATE projects SET base_cost_per_sqm = 70.0")
    c.execute("UPDATE projects SET labor_cost_per_sqm = 10.0 WHERE labor_cost_per_sqm IS NULL")

    conn.commit()
    conn.close()
    print("Migrated successfully!")

if __name__ == "__main__":
    upgrade()
