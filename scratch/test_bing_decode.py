import re
import base64
import urllib.parse

def decode_bing_url(bing_url):
    try:
        # Unescape &amp; in raw url
        cleaned_url = bing_url.replace('&amp;', '&')
        parsed = urllib.parse.urlparse(cleaned_url)
        params = urllib.parse.parse_qs(parsed.query)
        u_param = params.get('u', [None])[0]
        
        if u_param:
            # Remove o prefixo (normalmente a1 ou a0)
            # A base64 de urls começa normalmente com hR (http) ou aH (http) etc.
            # Vamos testar removendo os 2 primeiros caracteres
            b64_str = u_param[2:]
            
            # Adiciona padding se necessário para base64 correto
            padding = len(b64_str) % 4
            if padding:
                b64_str += '=' * (4 - padding)
                
            decoded = base64.b64decode(b64_str).decode('utf-8', errors='ignore')
            return decoded
    except Exception as e:
        pass
    return bing_url

with open('scratch/bing_test_loose.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Regular expression to find <li class="b_algo"> ... </li>
b_algo_blocks = re.findall(r'<li[^>]*class="b_algo"[^>]*>(.*?)</li>', html, re.DOTALL)

print(f"Found {len(b_algo_blocks)} b_algo blocks.")

for i, block in enumerate(b_algo_blocks, 1):
    print(f"\n--- Result #{i} ---")
    
    # Try to find the link and title
    link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
    if link_match:
        raw_url = link_match.group(1)
        decoded_url = decode_bing_url(raw_url)
        title_raw = link_match.group(2)
        title = re.sub(r'<[^>]+>', '', title_raw).strip()
        print(f"Raw URL: {raw_url[:80]}...")
        print(f"Decoded URL: {decoded_url}")
        print(f"Title: {title}")
    else:
        print("No link matched")
