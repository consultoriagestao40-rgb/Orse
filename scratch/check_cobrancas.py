import pg8000.dbapi

try:
    conn = pg8000.dbapi.connect(
        user="neondb_owner",
        password="npg_SJF3DB0zclRI",
        host="ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech",
        database="neondb",
        port=5432
    )
    cursor = conn.cursor()
    cursor.execute('SELECT "id", "plano", "valor", "status", "metodo", "dataPagamento", "asaasPaymentId", "createdAt" FROM "Cobranca" ORDER BY "createdAt" DESC LIMIT 5;')
    results = cursor.fetchall()
    print("--- RECENT COBRANCAS ---")
    for r in results:
        print(f"ID: {r[0]} | Plan: {r[1]} | Value: {r[2]} | Status: {r[3]} | Method: {r[4]} | PaidAt: {r[5]} | AsaasPayId: {r[6]} | CreatedAt: {r[7]}")
    cursor.close()
    conn.close()
except Exception as e:
    print("Database error:", e)
