import re
import urllib.parse
import base64

def decode_bing_url(bing_url):
    try:
        cleaned_url = bing_url.replace('&amp;', '&')
        parsed = urllib.parse.urlparse(cleaned_url)
        params = urllib.parse.parse_qs(parsed.query)
        u_param = params.get('u', [None])[0]
        
        if u_param:
            b64_str = u_param[2:]
            # Clean up padding issues
            padding = len(b64_str) % 4
            if padding:
                b64_str += '=' * (4 - padding)
            decoded = base64.b64decode(b64_str).decode('utf-8', errors='ignore')
            return decoded
    except Exception as e:
        pass
    return bing_url

with open('scratch/bing_microsoft_linkedin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Regular expression to find <li class="b_algo"> ... </li>
b_algo_blocks = re.findall(r'<li[^>]*class="b_algo"[^>]*>(.*?)</li>', html, re.DOTALL)

print(f"Found {len(b_algo_blocks)} b_algo blocks.")

for i, block in enumerate(b_algo_blocks, 1):
    print(f"\n--- Result #{i} ---")
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
