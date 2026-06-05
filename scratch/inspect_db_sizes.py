import pg8000
import ssl
import json
import sys

def main():
    user = "neondb_owner"
    password = "npg_SJF3DB0zclRI"
    host = "ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech"
    database = "neondb"
    port = 5432

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    print("Connecting to Neon...")
    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        database=database,
        port=port,
        ssl_context=ssl_context
    )
    cursor = conn.cursor()

    # Inspect JSON sizes in PropostaVersao
    print("\n--- PropostaVersao Table ---")
    cursor.execute('SELECT id, "propostaId", versao, pg_column_size(metadados) as meta_sz, pg_column_size(impostos) as imp_sz, pg_column_size(margens) as marg_sz, "precoVenda" FROM "PropostaVersao";')
    rows = cursor.fetchall()
    for r in rows:
        print(f"Versao ID: {r[0]}, PropostaID: {r[1]}, Versao: {r[2]}, Metadados Size: {r[3]} bytes, Impostos Size: {r[4]} bytes, Margens Size: {r[5]} bytes, Preco: {r[6]}")

    # Inspect JSON sizes in DocumentoProposta
    print("\n--- DocumentoProposta Table ---")
    cursor.execute('SELECT id, "propostaId", pg_column_size("configApresentacao") as config_sz, status, "valorTotal" FROM "DocumentoProposta";')
    rows = cursor.fetchall()
    for r in rows:
        print(f"Doc ID: {r[0]}, PropostaID: {r[1]}, ConfigApresentacao Size: {r[2]} bytes, Status: {r[3]}, Valor: {r[4]}")

    # Inspect SecaoDocumentoProposta
    print("\n--- SecaoDocumentoProposta Table ---")
    cursor.execute('SELECT id, "documentoId", pg_column_size(texto) as text_sz FROM "SecaoDocumentoProposta";')
    rows = cursor.fetchall()
    print(f"Total rows in SecaoDocumentoProposta: {len(rows)}")
    if rows:
        avg_sz = sum(r[2] for r in rows) / len(rows)
        max_sz = max(r[2] for r in rows)
        print(f"Average size of texto: {avg_sz:.2f} bytes, Max size: {max_sz} bytes")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
