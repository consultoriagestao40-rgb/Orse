import urllib.request
import urllib.parse
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = 'site:linkedin.com/in "Verzani & Sandrini" "Diretor"'
url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as response:
        html = response.read().decode('utf-8', errors='ignore')
    
    # Let's find result__body blocks
    # <div class="result body ...">
    results = re.findall(r'<div[^>]*class="[^"]*result[^"]*body[^"]*"[^>]*>([\s\S]*?)</div>\s*</div>', html)
    print(f"Found {len(results)} result body blocks")
    
    for i, r in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        # Extract title and URL
        title_match = re.search(r'<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', r)
        if title_match:
            raw_url = title_match.group(1)
            title = re.sub(r'<[^>]+>', '', title_match.group(2)).strip()
            # Extract uddg parameter
            parsed_url = urllib.parse.urlparse(raw_url)
            params = urllib.parse.parse_qs(parsed_url.query)
            actual_url = params.get('uddg', [raw_url])[0]
            print("URL:", actual_url)
            print("Title:", title)
            
        snippet_match = re.search(r'<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)</a>', r)
        if snippet_match:
            snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip()
            print("Snippet:", snippet)
            
except Exception as e:
    print("Error:", e)
