import pg8000.dbapi

try:
    conn = pg8000.dbapi.connect(
        user="neondb_owner",
        password="npg_SJF3DB0zclRI",
        host="ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech",
        database="neondb",
        port=5432
    )
    cursor = conn.cursor()
    
    tenant_id = "cmpplrmri000004jsw45vjg7p"
    new_name = "Silva Consultoria"
    new_cnpj = "40.180.983/0001-00"
    
    print(f"Updating Tenant {tenant_id} to Name: '{new_name}', CNPJ: '{new_cnpj}'...")
    
    # Execute update
    cursor.execute(
        'UPDATE "Tenant" SET "nomeFantasia" = %s, "cnpj" = %s WHERE "id" = %s;',
        (new_name, new_cnpj, tenant_id)
    )
    
    # Commit changes
    conn.commit()
    print("Database update successfully committed!")
    
    # Verify update
    cursor.execute('SELECT "id", "nomeFantasia", "cnpj" FROM "Tenant" WHERE "id" = %s;', (tenant_id,))
    res = cursor.fetchone()
    print(f"Verified Record in DB -> ID: {res[0]} | Name: {res[1]} | CNPJ: {res[2]}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print("Database error:", e)
