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

    print("Checking Lead count in DB:")
    cursor.execute('SELECT COUNT(*) FROM "Lead";')
    count = cursor.fetchone()[0]
    print(f"Total Leads: {count}")

    print("\nLeads by tenantId:")
    cursor.execute('SELECT "tenantId", COUNT(*) FROM "Lead" GROUP BY "tenantId";')
    rows = cursor.fetchall()
    for r in rows:
        print(f"Tenant: {r[0]} | Count: {r[1]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
