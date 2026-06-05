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

    try:
        cursor.execute('SELECT id, "configApresentacao" - \'fotosList\' - \'documentosList\' as config FROM "DocumentoProposta";')
        rows = cursor.fetchall()
        print(f"Successfully processed {len(rows)} rows!")
        for r in rows[:5]:
            print(f"- ID: {r[0]}, config type: {type(r[1])}, value snippet: {str(r[1])[:200]}")
    except Exception as e:
        print("Failed executing JSON operator on all rows:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
