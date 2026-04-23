import sqlite3

def upgrade():
    conn = sqlite3.connect('smartfilm.db')
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE projects ADD COLUMN installation_date VARCHAR;")
        print("Column installation_date added successfully.")
    except Exception as e:
        print("Error or already exists:", e)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
