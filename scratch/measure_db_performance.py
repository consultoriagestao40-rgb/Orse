import pg8000
import ssl
import time

def measure_query(cursor, name, query, params=None):
    t0 = time.time()
    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        rows = cursor.fetchall()
        duration_ms = (time.time() - t0) * 1000
        print(f"QUERY: {name:.<45} SUCCESS. Rows: {len(rows):<5} Time: {duration_ms:.2f} ms")
        return duration_ms
    except Exception as e:
        duration_ms = (time.time() - t0) * 1000
        print(f"QUERY: {name:.<45} FAILED. Error: {str(e)[:40]}... Time: {duration_ms:.2f} ms")
        return None

def main():
    user = "neondb_owner"
    password = "npg_SJF3DB0zclRI"
    host = "ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech"
    database = "neondb"
    port = 5432

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to Neon database...")
    t0 = time.time()
    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        database=database,
        port=port,
        ssl_context=ssl_context
    )
    print(f"Connected in {(time.time() - t0)*1000:.2f} ms")
    cursor = conn.cursor()

    # 1. Proposta list (equivalent of getPropostas)
    # Let's count rows first
    cursor.execute('SELECT COUNT(*) FROM "Proposta";')
    prop_count = cursor.fetchone()[0]
    print(f"Total FPVs in Proposta table: {prop_count}")

    cursor.execute('SELECT COUNT(*) FROM "DocumentoProposta";')
    doc_count = cursor.fetchone()[0]
    print(f"Total Documentos/Propostas in DocumentoProposta table: {doc_count}")

    cursor.execute('SELECT COUNT(*) FROM "PropostaVersao";')
    vers_count = cursor.fetchone()[0]
    print(f"Total Versoes in PropostaVersao table: {vers_count}")

    print("\nExecuting performance check...")
    
    # getPropostas equivalent
    measure_query(cursor, "getPropostas (Select FPVs & Client & User)", 
                  'SELECT p.id, p.numero, p.status, p."createdAt", c."nomeFantasia", u.nome, u."avatarUrl" FROM "Proposta" p LEFT JOIN "Client" c ON p."clientId" = c.id JOIN "User" u ON p."userId" = u.id ORDER BY p."createdAt" DESC;')

    # getDocumentosProposta equivalent
    measure_query(cursor, "getDocumentosProposta (Select Docs & Client)", 
                  'SELECT d.id, d."valorTotal", d.status, d."createdAt", c."nomeFantasia" FROM "DocumentoProposta" d LEFT JOIN "Client" c ON d."clientId" = c.id ORDER BY d."createdAt" DESC;')

    # Fetching templates
    measure_query(cursor, "getTemplatesProposta (Select Templates)",
                  'SELECT * FROM "TemplatePropostaComercial" ORDER BY nome ASC;')

    # Fetching empresas
    measure_query(cursor, "getEmpresasEmissoras",
                  'SELECT * FROM "EmpresaEmissora";')

    # Fetching users list
    measure_query(cursor, "getUsersList (Select Users)",
                  'SELECT id, nome, "avatarUrl" FROM "User" ORDER BY nome ASC;')

    # Fetching Documento statuses
    measure_query(cursor, "getDocumentoStatuses (Select Status)",
                  'SELECT * FROM "DocumentoStatus" ORDER BY nome ASC;')

    cursor.close()
    conn.close()
    print("\nPerformance check completed!")

if __name__ == "__main__":
    main()
