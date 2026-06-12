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

    # 1. Fetch recent contracts
    query = """
    SELECT c.id, c.status, c."propostaId", p.numero, c."valorMensal", c."createdAt"
    FROM "Contrato" c
    LEFT JOIN "Proposta" p ON c."propostaId" = p.id
    ORDER BY c."createdAt" DESC
    LIMIT 10;
    """
    cursor.execute(query)
    contracts = cursor.fetchall()
    print("--- RECENT CONTRACTS ---")
    for row in contracts:
        c_id, status, prop_id, prop_num, val_mensal, created_at = row
        print(f"Contract ID: {c_id}, Status: {status}, Prop ID: {prop_id}, Prop Num: {prop_num}, Val: {val_mensal}, Created: {created_at}")

        # Check if there is a PIC associated
        cursor.execute('SELECT id, status FROM "Pic" WHERE "contratoId" = %s;', (c_id,))
        pic = cursor.fetchone()
        print(f"  -> Associated PIC: {pic}")

        # Check proposal details/versions
        if prop_id:
            cursor.execute('SELECT id, "versao", "metadados" FROM "PropostaVersao" WHERE "propostaId" = %s ORDER BY "versao" DESC LIMIT 1;', (prop_id,))
            pv = cursor.fetchone()
            if pv:
                print(f"  -> Latest PropostaVersao ID: {pv[0]}, Versao: {pv[1]}")
                metadados = pv[2]
                # print first 200 chars of metadados
                print(f"  -> Metadados snippet: {str(metadados)[:200]}")
            else:
                print("  -> No PropostaVersao found!")
        print("-" * 50)

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
