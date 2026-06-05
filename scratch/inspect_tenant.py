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

    print("=== TENANT DETAIL ===")
    cursor.execute('SELECT id, "nomeFantasia", "primaryColor", plano, ativo, "limiteUsuarios" FROM "Tenant" WHERE id = \'cmpplrmri000004jsw45vjg7p\';')
    t = cursor.fetchone()
    if t:
        print(f"ID: {t[0]}\nNomeFantasia: {t[1]}\nPrimaryColor: {t[2]}\nPlano: {t[3]}\nAtivo: {t[4]}\nLimiteUsuarios: {t[5]}")
    else:
        print("Tenant not found")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
