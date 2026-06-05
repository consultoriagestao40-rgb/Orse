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

    cursor.execute('SELECT "configApresentacao" FROM "DocumentoProposta" WHERE id = \'cmpjzidfy000004iiypbvt54r\';')
    row = cursor.fetchone()
    if row and row[0]:
        try:
            data = json.loads(row[0]) if isinstance(row[0], str) else row[0]
            print("Keys in configApresentacao:")
            for k in data.keys():
                val_str = str(data[k])
                print(f"- {k}: type {type(data[k])}, size {len(val_str)} characters")
                if isinstance(data[k], dict):
                    print("  Subkeys:")
                    for sk in data[k].keys():
                        print(f"    - {sk}: size {len(str(data[k][sk]))}")
                elif isinstance(data[k], list) and len(data[k]) > 0:
                    print(f"  List length: {len(data[k])}, first item size: {len(str(data[k][0]))}")
        except Exception as e:
            print("Error parsing JSON:", e)
    else:
        print("Document not found or configApresentacao is empty.")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
