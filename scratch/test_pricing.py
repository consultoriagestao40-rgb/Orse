import pg8000
import json
import urllib.parse
import sys

db_url = "postgresql://neondb_owner:npg_SJF3DB0zclRI@ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech/neondb"
result = urllib.parse.urlparse(db_url)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port or 5432

conn = pg8000.connect(
    user=username,
    password=password,
    host=hostname,
    port=port,
    database=database,
    ssl_context=True
)

cursor = conn.cursor()

def get_row_dict(table_name, row_id):
    cursor.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' ORDER BY ordinal_position")
    cols = [r[0] for r in cursor.fetchall()]
    cursor.execute(f"SELECT * FROM \"{table_name}\" WHERE id = %s", [row_id])
    row = cursor.fetchone()
    if row:
        return dict(zip(cols, row))
    return None

try:
    doc_id = "cmpsloy27000004jlxvb5n9xo"
    doc = get_row_dict("DocumentoProposta", doc_id)
    if not doc:
        print("DocumentoProposta not found!")
        sys.exit(1)
        
    prop_id = doc["propostaId"]
    proposta = get_row_dict("Proposta", prop_id)
    
    cursor.execute("SELECT * FROM \"PropostaVersao\" WHERE \"propostaId\" = %s ORDER BY versao DESC", [prop_id])
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='PropostaVersao' ORDER BY ordinal_position")
    v_cols = [r[0] for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM \"PropostaVersao\" WHERE \"propostaId\" = %s ORDER BY versao DESC", [prop_id])
    v_row = cursor.fetchone()
    if not v_row:
        print("PropostaVersao not found!")
        sys.exit(1)
        
    versao = dict(zip(v_cols, v_row))
    
    # Get items
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='PropostaItem' ORDER BY ordinal_position")
    item_cols = [r[0] for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM \"PropostaItem\" WHERE \"versaoId\" = %s", [versao["id"]])
    item_rows = cursor.fetchall()
    items = [dict(zip(item_cols, r)) for r in item_rows]
    
    print(f"Loaded proposal with {len(items)} items.")
    
    meta = json.loads(versao["metadados"]) if isinstance(versao["metadados"], str) else versao["metadados"]
    impostos = json.loads(versao["impostos"]) if isinstance(versao["impostos"], str) else versao["impostos"]
    margens = json.loads(versao["margens"]) if isinstance(versao["margens"], str) else versao["margens"]
    
    sindicato_id = impostos.get("sindicatoId")
    print(f"Sindicato ID from DB: '{sindicato_id}'")
    
    cct = None
    if sindicato_id:
        cct = get_row_dict("CCT", sindicato_id)
        
    print(f"Loaded CCT from DB: {cct['id'] if cct else 'None'}")
    
    # SIMULATE pricingEngine.ts
    # Let's inspect the items and CCT base values
    for idx, colab in enumerate(items):
        print(f"\nItem {idx + 1}: {colab.get('nomeCargo')}")
        tipo_item = colab.get("tipoItem")
        print("  Tipo:", tipo_item)
        
        # Test CCT and Cargo resolution
        cct_global = cct or {}
        cargo = colab.get("configFinanceira") or {}
        if isinstance(cargo, str):
            cargo = json.loads(cargo)
            
        cct_colab = colab.get("cctBase") or {}
        if isinstance(cct_colab, str):
            cct_colab = json.loads(cct_colab)
            
        param = colab.get("ativosConfig") or {}
        if isinstance(param, str):
            param = json.loads(param)
        if param and "parametrosPosto" in param:
            param = param["parametrosPosto"]
            
        print("  cctGlobal keys:", list(cct_global.keys()) if cct_global else "None")
        print("  cargo keys:", list(cargo.keys()) if cargo else "None")
        print("  cctColab keys:", list(cct_colab.keys()) if cct_colab else "None")
        print("  param keys:", list(param.keys()) if param else "None")
        
        # Simulate cctEfetiva
        va_val = cct_colab.get("vaValor") or cct_colab.get("vtValor")
        va_glob = cct_global.get("vaValor")
        
        print("  cctColab has vaValor/vtValor:", va_val)
        print("  cctGlobal has vaValor:", va_glob)
        
        # Look at the JS line:
        # const cctEfetiva = (cctColab.vaValor || cctColab.vtValor) ? cctColab : (cctGlobal.vaValor ? cctGlobal : (cargo.cct || cctColab || cctGlobal));
        # Let's see what this evaluated to in JS:
        # If cctGlobal is None (i.e. null in DB), then cctGlobal.vaValor throws: "Cannot read properties of null (reading 'vaValor')"!
        if cct_global is None:
            print("  WARNING: cctGlobal is None!")
        else:
            # Let's check what cctEfetiva evaluates to
            try:
                cct_efetiva = cct_colab if (cct_colab.get("vaValor") or cct_colab.get("vtValor")) else (cct_global if cct_global.get("vaValor") else (cargo.get("cct") or cct_colab or cct_global))
                print("  cctEfetiva resolved successfully. insalubridadeBase:", cct_efetiva.get("insalubridadeBase"))
            except Exception as e:
                print("  ERROR RESOLVING cctEfetiva:", e)

except Exception as e:
    print("General exception:", e)
finally:
    conn.close()
