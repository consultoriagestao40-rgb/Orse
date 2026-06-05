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
    cursor.execute("SELECT count(*), state FROM pg_stat_activity GROUP BY state;")
    rows = cursor.fetchall()
    print("Database Active Connections by State:")
    for r in rows:
        print(f"State: {r[1]}, Count: {r[0]}")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
