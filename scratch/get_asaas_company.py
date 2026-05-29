import urllib.request
import json

api_key = "$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJkY2MwMGM0LWVjODMtNDE5OC05ZmI2LWQwYjI1MjQxNzAxNjo6JGFhY2hfMzM2ZDRlMjktMzhhZS00NGYyLTg1YTUtNmY4NmRjMGFjMjk1"
url = "https://api.asaas.com/v3/myAccount/commercialInfo"

req = urllib.request.Request(url, headers={
    "access_token": api_key,
    "Content-Type": "application/json"
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("--- ASAAS COMMERCIAL INFO ---")
        print(json.dumps(data, indent=2, ensure_ascii=False))
except Exception as e:
    print("Error calling Asaas API:", e)
