import sqlite3
import os

db_path = './prisma/dev.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT * FROM EquipeTecnicaComposicao;")
    rows = cursor.fetchall()
    colnames = [description[0] for description in cursor.description]
    for row in rows:
        print("---")
        for col, val in zip(colnames, row):
            print(f"{col}: {val}")
except Exception as e:
    print("Error:", e)

conn.close()
