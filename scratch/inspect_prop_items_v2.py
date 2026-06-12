import pg8000
import ssl
import json

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

    cursor.execute('SELECT id, "nomeCargo", "quantidade", "escala", "ativosConfig", "tipoItem" FROM "PropostaItem" WHERE "versaoId" = \'cmpyhsato000104lginyr2bss\';')
    items = cursor.fetchall()
    print("--- PROPOSTA ITEMS ---")
    for item in items:
        print(f"ID: {item[0]}, NomeCargo: {item[1]}, Qtd: {item[2]}, Escala: {item[3]}, AtivosConfig: {item[4]}, TipoItem: {item[5]}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
