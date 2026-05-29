import urllib.request
import json
import socket
import ssl

# Desabilitar verificação SSL para evitar problemas com certificados expirados de instâncias de teste
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def get_instances():
    print("Fetching SearXNG instances...")
    try:
        url = "https://searx.space/data/instances.json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('instances', {})
    except Exception as e:
        print("Error fetching instances:", e)
        return {}

def test_instance(url):
    test_url = f"{url}search?q=TerceirizeMais+CEO+linkedin&format=json"
    try:
        req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=6) as response:
            status = response.getcode()
            if status == 200:
                body = response.read().decode('utf-8')
                try:
                    data = json.loads(body)
                    results = data.get('results', [])
                    print(f"✅ SUCCESS: {url} - {len(results)} results")
                    return len(results) > 0, results
                except json.JSONDecodeError:
                    print(f"❌ INVALID JSON: {url}")
            else:
                print(f"❌ STATUS {status}: {url}")
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP ERROR {e.code}: {url}")
    except Exception as e:
        print(f"❌ ERROR: {url} - {str(e)[:40]}")
    return False, []

def main():
    instances = get_instances()
    if not instances:
        # Fallback list if fetching fails
        instances = {
            "https://searx.be/": {},
            "https://search.ononoki.org/": {},
            "https://searx.priv.rat.de/": {},
            "https://baresearch.org/": {},
            "https://grep.vim.wtf/": {},
            "https://search.lvk.sh/": {},
            "https://searx.mx/": {},
            "https://searx.cthd.icu/": {},
            "https://searx.work/": {},
            "https://paulgo.dev/": {}
        }
    
    print(f"Found {len(instances)} instances. Testing...")
    
    successful_instances = []
    
    # Vamos testar as primeiras 25 instâncias
    for url in list(instances.keys())[:30]:
        # Formata a URL para garantir que termine com barra
        if not url.endswith('/'):
            url += '/'
            
        # Ignora instâncias conhecidas por falhar ou bloquear
        if "github.com" in url or "mozilla.org" in url or "cryptcheck.fr" in url:
            continue
            
        success, results = test_instance(url)
        if success:
            successful_instances.append((url, results))
            if len(successful_instances) >= 3:
                break
                
    print("\n--- Summary of Successful Instances ---")
    for url, results in successful_instances:
        print(f"URL: {url}")
        print("Sample Result URL:", results[0].get('url'))
        print("Sample Title:", results[0].get('title'))
        print("Sample Snippet:", results[0].get('content')[:100])
        print("-" * 40)

if __name__ == "__main__":
    main()
