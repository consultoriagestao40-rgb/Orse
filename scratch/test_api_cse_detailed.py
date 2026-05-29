import urllib.request
import json
import ssl
import urllib.error

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

key = "AIzaSyAvjvknXwYdmFFXMSADD1fsfmVmmhK0KkA"
cx = "955534659ddf64afd"

try:
    query = 'site:linkedin.com/in "Verzani" "CEO"'
    url = f"https://customsearch.googleapis.com/customsearch/v1?key={key}&cx={cx}&q={urllib.parse.quote(query)}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    urllib.request.urlopen(req, context=ctx)
except urllib.error.HTTPError as e:
    print("HTTP Status Code:", e.code)
    body = e.read().decode('utf-8', errors='ignore')
    print("Response Body:")
    try:
        parsed = json.loads(body)
        print(json.dumps(parsed, indent=2))
    except:
        print(body)
except Exception as e:
    print("Other error:", e)
