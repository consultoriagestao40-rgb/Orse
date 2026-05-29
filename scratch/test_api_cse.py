import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Credenciais recém obtidas
key = "AIzaSyAvjvknXwYdmFFXMSADD1fsfmVmmhK0KkA"
cx = "955534659ddf64afd"

print("Testing Google CSE with newly created credentials...")
print(f"Key: {key[:10]}...")
print(f"CX: {cx}")

try:
    query = 'site:linkedin.com/in "Verzani" "CEO"'
    url = f"https://customsearch.googleapis.com/customsearch/v1?key={key}&cx={cx}&q={urllib.parse.quote(query)}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=8) as response:
        status = response.getcode()
        print(f"Status Code: {status}")
        if status == 200:
            data = json.loads(response.read().decode('utf-8'))
            items = data.get('items', [])
            print(f"Found {len(items)} results from Google CSE!")
            for idx, item in enumerate(items[:3], 1):
                print(f"\n--- Result #{idx} ---")
                print(f"Title: {item.get('title')}")
                print(f"Link: {item.get('link')}")
                print(f"Snippet: {item.get('snippet')}")
        else:
            print("Failed with status:", status)
except Exception as e:
    print("Error during test:", e)
