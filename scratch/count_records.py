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

    tables = ["Client", "Proposta", "PropostaVersao", "PropostaItem", "Produto", "CCT", "Cargo", "EquipeTecnicaComposicao", "Lead", "Notification"]
    for t in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{t}";')
            count = cursor.fetchone()[0]
            print(f"Table '{t}': {count} records")
        except Exception as e:
            print(f"Error querying table '{t}': {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
