import pg8000.dbapi

conn = pg8000.dbapi.connect(
    user="neondb_owner",
    password="npg_SJF3DB0zclRI",
    host="ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech",
    database="neondb",
    ssl_context=True
)

cursor = conn.cursor()

# Find the proposal
cursor.execute('SELECT id, numero, "clientId", status, "createdAt" FROM "Proposta" WHERE numero = 10')
proposal = cursor.fetchone()

if proposal:
    print(f"Proposal ID: {proposal[0]}, Numero: {proposal[1]}, ClientID: {proposal[2]}, Status: {proposal[3]}, CreatedAt: {proposal[4]}")
    
    # Find all versions
    cursor.execute('SELECT id, versao, "custoTotal", "precoVenda", "dataCriacao", metadados FROM "PropostaVersao" WHERE "propostaId" = %s ORDER BY versao DESC', (proposal[0],))
    versions = cursor.fetchall()
    
    for v in versions:
        meta = v[5] if v[5] else {}
        print(f"  Version {v[1]}: ID={v[0]}, custoTotal={v[2]}, precoVenda={v[3]}, revisao_meta={meta.get('revisao')}, dataCriacao={v[4]}")
else:
    print("Proposal 10 not found!")

conn.close()
