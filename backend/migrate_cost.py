import sqlite3

def upgrade():
    conn = sqlite3.connect('smartfilm.db')
    c = conn.cursor()
    
    # 1. Add new column to system_settings
    try:
        c.execute("ALTER TABLE system_settings ADD COLUMN default_base_cost_per_sqm FLOAT DEFAULT 80.0;")
        print("Added column default_base_cost_per_sqm to system_settings.")
    except sqlite3.OperationalError as e:
        print(f"Column default_base_cost_per_sqm in system_settings likely exists: {e}")

    # 2. Add some defaults if system_settings is empty
    c.execute("SELECT COUNT(*) FROM system_settings")
    count = c.fetchone()[0]
    if count == 0:
        c.execute("INSERT INTO system_settings (default_price_per_sqm, default_roll_width, delivery_note_warranty_months, default_base_cost_per_sqm) VALUES (200.0, 1.5, 3, 80.0)")
        print("Inserted default system settings.")
    else:
        c.execute("UPDATE system_settings SET default_base_cost_per_sqm = 80.0 WHERE default_base_cost_per_sqm IS NULL OR default_base_cost_per_sqm = 0.0")

    # 3. Update existing projects base_cost_per_sqm mapping 0 to 80
    c.execute("UPDATE projects SET base_cost_per_sqm = 80.0 WHERE base_cost_per_sqm = 0.0 OR base_cost_per_sqm IS NULL")
    print("Updated existing projects with default base cost of 80.0.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
