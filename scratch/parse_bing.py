import re

with open('scratch/bing_test_loose.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Regular expression to find <li class="b_algo"> ... </li>
b_algo_blocks = re.findall(r'<li[^>]*class="b_algo"[^>]*>(.*?)</li>', html, re.DOTALL)

print(f"Found {len(b_algo_blocks)} b_algo blocks.")

for i, block in enumerate(b_algo_blocks, 1):
    print(f"\n--- Result #{i} ---")
    
    # Try to find the link and title
    # Links usually look like <a href="URL" ...>Title</a> or similar
    # Inside h2 or direct
    link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
    if link_match:
        url = link_match.group(1)
        title_raw = link_match.group(2)
        title = re.sub(r'<[^>]+>', '', title_raw).strip()
        print(f"URL: {url}")
        print(f"Title: {title}")
    else:
        print("No link matched")
        
    # Try to find the snippet
    snippet_match = re.search(r'<p[^>]*>(.*?)</p>', block, re.DOTALL)
    if snippet_match:
        snippet_raw = snippet_match.group(1)
        snippet = re.sub(r'<[^>]+>', '', snippet_raw).strip()
        print(f"Snippet: {snippet}")
