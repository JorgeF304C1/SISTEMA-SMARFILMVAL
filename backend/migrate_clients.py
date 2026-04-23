import sqlite3

def upgrade():
    conn = sqlite3.connect('smartfilm.db')
    c = conn.cursor()
    
    # 1. Add new columns to Projects
    columns_to_add = [
        ("client_name_direct", "VARCHAR"),
        ("client_ci_rif_direct", "VARCHAR"),
        ("client_phone_direct", "VARCHAR"),
        ("client_email_direct", "VARCHAR"),
        ("client_address_direct", "VARCHAR")
    ]
    
    for col, dtype in columns_to_add:
        try:
            c.execute(f"ALTER TABLE projects ADD COLUMN {col} {dtype};")
            print(f"Added column {col} to projects.")
        except sqlite3.OperationalError as e:
            print(f"Column {col} likely exists: {e}")

    # 2. Migrate existing data from clients to projects
    c.execute("SELECT id, name, ci_rif, phone, email, address FROM clients")
    clients_data = c.fetchall()
    
    for client in clients_data:
        client_id, name, ci_rif, phone, email, address = client
        c.execute('''
            UPDATE projects 
            SET client_name_direct = ?, client_ci_rif_direct = ?, client_phone_direct = ?, client_email_direct = ?, client_address_direct = ?
            WHERE client_id = ?
        ''', (name, ci_rif, phone, email, address, client_id))
    
    conn.commit()
    print(f"Migrated data for {len(clients_data)} clients.")
    
    c.execute("DROP TABLE IF EXISTS clients;")
    print("Dropped clients table.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
