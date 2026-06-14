import os
import re
import pg8000
import ssl

# Get current script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '../.env')

env = {}
try:
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
        for line in content.split('\n'):
            match = re.match(r'^\s*([\w.-]+)\s*=\s*(.*)?\s*$', line)
            if match:
                value = match.group(2) if match.group(2) else ''
                value = value.strip()
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                env[match.group(1)] = value
except Exception as e:
    print(f"Error reading .env: {e}")

db_url = env.get('DATABASE_URL') or os.environ.get('DATABASE_URL')
if not db_url:
    print("DATABASE_URL not found!")
    exit(1)

match = re.match(r'postgresql://([^:]+):([^@]+)@([^/]+)/([^?]+)', db_url)
if not match:
    print("Could not parse DATABASE_URL!")
    exit(1)

user = match.group(1)
password = match.group(2)
host_part = match.group(3)
database = match.group(4)

host = host_part
port = 5432
if ':' in host_part:
    host, port_str = host_part.split(':')
    port = int(port_str)

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

try:
    conn = pg8000.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=database,
        ssl_context=ssl_context
    )
    cursor = conn.cursor()
    print("Connected successfully!")

    cursor.execute('SELECT NOW(), CURRENT_TIMESTAMP;')
    now_res = cursor.fetchone()
    print(f"\nDatabase NOW(): {now_res}")

    cursor.execute('SHOW TIMEZONE;')
    tz_res = cursor.fetchone()
    print(f"Database TIMEZONE: {tz_res}")

    # Fetch last 3 WhatsApp messages
    cursor.execute('SELECT id, texto, direction, "createdAt" FROM "WhatsAppMessage" ORDER BY "createdAt" DESC LIMIT 3;')
    msgs = cursor.fetchall()
    print("\nLast 3 WhatsApp Messages:")
    for m in msgs:
        print(f"ID: {m[0]} | Texto: {m[1]} | Dir: {m[2]} | Criado: {m[3]}")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"Connection/Query failed: {e}")
