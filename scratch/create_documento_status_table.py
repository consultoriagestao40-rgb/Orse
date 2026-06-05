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

    print("Creating 'DocumentoStatus' table in database...")
    try:
        # Create table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS "DocumentoStatus" (
                "id" TEXT NOT NULL,
                "nome" TEXT NOT NULL,
                "color" TEXT NOT NULL DEFAULT 'bg-slate-100 text-slate-600 border border-slate-200',
                "ativo" BOOLEAN NOT NULL DEFAULT true,
                CONSTRAINT "DocumentoStatus_pkey" PRIMARY KEY ("id")
            );
        ''')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS "DocumentoStatus_nome_key" ON "DocumentoStatus"("nome");')
        conn.commit()
        print("Table 'DocumentoStatus' created successfully!")
    except Exception as e:
        print("Error creating table:", e)
        conn.rollback()

    print("Seeding default DocumentoStatus rows...")
    default_statuses = [
        ("clab1", "RASCUNHO", "bg-slate-100 text-slate-600 border border-slate-200"),
        ("clab2", "ENVIADA", "bg-sky-100 text-sky-800 border border-sky-200"),
        ("clab3", "APROVADA", "bg-green-100 text-green-800 border border-green-200"),
        ("clab4", "RECUSADA", "bg-red-100 text-red-800 border border-red-200")
    ]
    for s_id, nome, color in default_statuses:
        try:
            cursor.execute(
                'INSERT INTO "DocumentoStatus" ("id", "nome", "color", "ativo") VALUES (%s, %s, %s, true) ON CONFLICT ("nome") DO NOTHING;',
                (s_id, nome, color)
            )
            print(f"Status '{nome}' seeded.")
        except Exception as e:
            print(f"Error seeding status '{nome}':", e)
            conn.rollback()

    conn.commit()
    cursor.close()
    conn.close()
    print("Database migration completed!")

if __name__ == "__main__":
    main()
