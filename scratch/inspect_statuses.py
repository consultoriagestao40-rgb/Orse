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

    print("Fetching existing DocumentoProposta statuses...")
    try:
        cursor.execute('SELECT DISTINCT "status" FROM "DocumentoProposta";')
        rows = cursor.fetchall()
        print("Existing DocumentoProposta statuses:", [r[0] for r in rows])
    except Exception as e:
        print("Error fetching DocumentoProposta statuses:", e)

    print("\nFetching existing PropostaStatus entries...")
    try:
        cursor.execute('SELECT "nome", "color", "ativo" FROM "PropostaStatus";')
        rows = cursor.fetchall()
        print("Existing PropostaStatus:")
        for r in rows:
            print(f"- {r[0]} (color: {r[1]}, active: {r[2]})")
    except Exception as e:
        print("Error fetching PropostaStatus:", e)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
