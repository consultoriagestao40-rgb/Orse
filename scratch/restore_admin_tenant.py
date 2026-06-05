import pg8000
import ssl

def main():
    user = "neondb_owner"
    password = "npg_SJF3DB0zclRI"
    host = "ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech"
    database = "neondb"
    port = 5432

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to Neon database...")
    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        database=database,
        port=port,
        ssl_context=ssl_context
    )
    cursor = conn.cursor()

    print("\nBefore restoration:")
    cursor.execute('SELECT id, email, nome, role, "tenantId" FROM "User" WHERE email = \'admin@smartbidhub.com.br\';')
    row = cursor.fetchone()
    if row:
        print(f"ID: {row[0]} | Email: {row[1]} | Nome: {row[2]} | Role: {row[3]} | TenantId: {row[4]}")

    print("\nRestoring tenantId to 'cmpplrmri000004jsw45vjg7p' for admin@smartbidhub.com.br...")
    cursor.execute('UPDATE "User" SET "tenantId" = \'cmpplrmri000004jsw45vjg7p\' WHERE email = \'admin@smartbidhub.com.br\';')
    conn.commit()
    print("Update committed.")

    print("\nAfter restoration:")
    cursor.execute('SELECT id, email, nome, role, "tenantId" FROM "User" WHERE email = \'admin@smartbidhub.com.br\';')
    row = cursor.fetchone()
    if row:
        print(f"ID: {row[0]} | Email: {row[1]} | Nome: {row[2]} | Role: {row[3]} | TenantId: {row[4]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
