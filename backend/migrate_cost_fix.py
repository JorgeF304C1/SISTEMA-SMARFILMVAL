import sqlite3

def upgrade():
    conn = sqlite3.connect('smartfilm.db')
    c = conn.cursor()
    
    # Update projects table dates
    try:
        c.execute("ALTER TABLE projects ADD COLUMN installation_date VARCHAR;")
        print("Added installation_date to projects")
    except sqlite3.OperationalError as e:
        print(f"projects.installation_date might already exist: {e}")
        
    try:
        c.execute("ALTER TABLE projects ADD COLUMN approved_date VARCHAR;")
        print("Added approved_date to projects")
    except sqlite3.OperationalError as e:
        print(f"projects.approved_date might already exist: {e}")

    try:
        c.execute("ALTER TABLE projects ADD COLUMN completed_date VARCHAR;")
        print("Added completed_date to projects")
    except sqlite3.OperationalError as e:
        print(f"projects.completed_date might already exist: {e}")

    conn.commit()
    conn.close()
    print("Migration fix completed.")

if __name__ == "__main__":
    upgrade()
