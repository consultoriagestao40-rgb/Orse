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

    cursor.execute('SELECT id, "nomeFantasia", "razaoSocial", cnpj, contato FROM "Client";')
    clients = cursor.fetchall()
    print("--- CLIENTS IN DB ---")
    for c in clients:
        print(f"ID: {c[0]}, NomeFantasia: {repr(c[1])}, RazaoSocial: {repr(c[2])}, CNPJ: {c[3]}, Contato: {c[4]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
