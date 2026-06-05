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

    print("=== USERS ===")
    cursor.execute('SELECT id, email, nome, role, "tenantId" FROM "User";')
    users = cursor.fetchall()
    for u in users:
        print(f"ID: {u[0]} | Email: {u[1]} | Nome: {u[2]} | Role: {u[3]} | TenantId: {u[4]}")

    print("\n=== PROPOSTAS (FPV) ===")
    cursor.execute('SELECT id, numero, "clientId", status, "tenantId" FROM "Proposta" LIMIT 10;')
    props = cursor.fetchall()
    for p in props:
        print(f"ID: {p[0]} | Numero: {p[1]} | ClientId: {p[2]} | Status: {p[3]} | TenantId: {p[4]}")

    print("\n=== DOCUMENTO PROPOSTA ===")
    cursor.execute('SELECT id, "propostaId", "clientId", status, "tenantId" FROM "DocumentoProposta" LIMIT 10;')
    docs = cursor.fetchall()
    for d in docs:
        print(f"ID: {d[0]} | PropostaId: {d[1]} | ClientId: {d[2]} | Status: {d[3]} | TenantId: {d[4]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
