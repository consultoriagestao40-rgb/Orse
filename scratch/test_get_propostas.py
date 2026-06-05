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

    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        database=database,
        port=port,
        ssl_context=ssl_context
    )
    cursor = conn.cursor()

    print("Checking DocumentoProposta count with tenantId='cmpplrmri000004jsw45vjg7p':")
    cursor.execute('SELECT COUNT(*) FROM "DocumentoProposta" WHERE "tenantId" = \'cmpplrmri000004jsw45vjg7p\';')
    count = cursor.fetchone()[0]
    print(f"Count: {count}")

    print("\nListing all DocumentoProposta for this tenant:")
    cursor.execute('SELECT id, "propostaId", "clientId", status FROM "DocumentoProposta" WHERE "tenantId" = \'cmpplrmri000004jsw45vjg7p\';')
    rows = cursor.fetchall()
    for r in rows:
        print(r)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
