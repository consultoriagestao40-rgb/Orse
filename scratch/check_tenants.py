import pg8000.dbapi

# Connect to Neon database
# URL: postgresql://neondb_owner:npg_SJF3DB0zclRI@ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
try:
    conn = pg8000.dbapi.connect(
        user="neondb_owner",
        password="npg_SJF3DB0zclRI",
        host="ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech",
        database="neondb",
        port=5432
    )
    cursor = conn.cursor()
    cursor.execute('SELECT "id", "nomeFantasia", "cnpj", "plano", "ativo" FROM "Tenant";')
    results = cursor.fetchall()
    print("--- TENANTS IN DATABASE ---")
    for r in results:
        print(f"ID: {r[0]} | Name: {r[1]} | CNPJ: {r[2]} | Plan: {r[3]} | Active: {r[4]}")
    
    # Also print users to see who Cristiano is logged in as
    cursor.execute('SELECT "id", "nome", "email", "tenantId" FROM "User";')
    users = cursor.fetchall()
    print("\n--- USERS IN DATABASE ---")
    for u in users:
        print(f"ID: {u[0]} | Name: {u[1]} | Email: {u[2]} | TenantId: {u[3]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Database error:", e)
