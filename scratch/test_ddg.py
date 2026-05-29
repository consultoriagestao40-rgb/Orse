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
        status = response.getcode()
        html = response.read().decode('utf-8', errors='ignore')
        
    print("Status Code:", status)
    print("HTML length:", len(html))
    
    # Check for results
    if "result__url" in html or "result__snippet" in html:
        print("DuckDuckGo returned results!")
        
        # Find links
        links = re.findall(r'<a class="result__url"[^>]*href="([^"]+)"', html)
        for link in links[:5]:
            # DuckDuckGo sometimes encodes URLs as /l/?kh=...&uddg=URL
            print("Found URL:", urllib.parse.unquote(link))
    else:
        print("DuckDuckGo returned no results or was blocked.")
        if "captcha" in html.lower() or "robot" in html.lower():
            print("Detected challenge/robot block!")
            
except Exception as e:
    print("Error:", e)
