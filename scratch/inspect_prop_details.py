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

    # Proposal ID for contract cmq0xymsw000004jydatvgnl4 is cmpyhsaoq000004lg89vlekws
    cursor.execute('SELECT "metadados" FROM "PropostaVersao" WHERE "propostaId" = \'cmpyhsaoq000004lg89vlekws\' ORDER BY "versao" DESC LIMIT 1;')
    row = cursor.fetchone()
    if row:
        metadata = row[0]
        print("--- FULL METADADOS ---")
        print(json.dumps(metadata, indent=2, ensure_ascii=False))
    else:
        print("Not found!")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
