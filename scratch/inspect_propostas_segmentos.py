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

    print("=== CLIENTS ===")
    cursor.execute('SELECT id, "nomeFantasia", segmento FROM "Client";')
    clients = cursor.fetchall()
    for c in clients:
        print(f"Client ID: {c[0]} | Name: {c[1]} | Segment: {c[2]}")

    print("\n=== PROPOSTAS (FPVs) ===")
    cursor.execute('SELECT id, numero, "clientId", status FROM "Proposta";')
    propostas = cursor.fetchall()
    for p in propostas:
        print(f"Proposta ID: {p[0]} | Numero: FPV-{p[1]:03d} | Client ID: {p[2]} | Status: {p[3]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
