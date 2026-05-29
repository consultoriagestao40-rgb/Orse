const fetch = require('node-fetch');

async function testDDG() {
  const query = 'site:linkedin.com/in "Verzani & Sandrini" "Diretor"';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status Code:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Check if blocked or has results
    if (html.includes('ddg-l') || html.includes('result__snippet')) {
      console.log("DuckDuckGo returned results!");
      // Simple regex to extract titles and URLs
      const matches = html.matchAll(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>/g);
      for (const m of matches) {
        console.log("Result URL:", m[1]);
      }
    } else {
      console.log("DuckDuckGo returned no results or was blocked/challenged.");
    }
  } catch (err) {
    console.error("Error fetching DDG:", err);
  }
}

testDDG();
