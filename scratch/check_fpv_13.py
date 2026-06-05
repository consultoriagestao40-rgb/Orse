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

    cursor.execute('SELECT id FROM "Proposta" WHERE numero = 13;')
    proposta = cursor.fetchone()
    if proposta:
        p_id = proposta[0]
        cursor.execute('SELECT versao, metadados FROM "PropostaVersao" WHERE "propostaId" = %s ORDER BY versao DESC;', (p_id,))
        version = cursor.fetchone()
        if version:
            print("Version number:", version[0])
            print("Metadata:", version[1])
            try:
                meta = json.loads(version[1]) if isinstance(version[1], str) else version[1]
                print("meta.clienteNome:", meta.get('clienteNome') if isinstance(meta, dict) else 'Not a dict')
            except Exception as e:
                print("Error parsing metadata:", e)
        else:
            print("No version found!")
    else:
        print("Proposta FPV 13 not found!")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
