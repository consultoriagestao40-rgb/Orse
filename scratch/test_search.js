

async function testDDG() {
  console.log('Testing DuckDuckGo HTML...');
  try {
    const encoded = encodeURIComponent('site:linkedin.com/in "TerceirizeMais" "CEO"');
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    console.log('DDG Status:', res.status);
    const html = await res.text();
    console.log('DDG Length:', html.length);
    const hasResults = html.includes('result__snippet') || html.includes('class="result__url"');
    console.log('DDG Has Results:', hasResults);
    if (!hasResults && html.length < 5000) {
      console.log('DDG Sample HTML:', html.substring(0, 1000));
    }
  } catch (err) {
    console.error('DDG Error:', err.message);
  }
}

async function testSearxng() {
  console.log('\nTesting SearXNG...');
  const instances = [
    'https://searx.be',
    'https://search.ononoki.org',
    'https://searx.space',
    'https://searx.work',
    'https://searx.priv.rat.de'
  ];
  
  for (const instance of instances) {
    try {
      console.log(`Trying ${instance}...`);
      const query = encodeURIComponent('site:linkedin.com/in "TerceirizeMais" "CEO"');
      const url = `${instance}/search?q=${query}&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      });
      console.log(`${instance} Status:`, res.status);
      if (res.ok) {
        const data = await res.json();
        console.log(`${instance} Results count:`, data.results ? data.results.length : 0);
        if (data.results && data.results.length > 0) {
          console.log('Sample result:', data.results[0]);
          break;
        }
      }
    } catch (err) {
      console.log(`${instance} Failed:`, err.message);
    }
  }
}

async function run() {
  await testDDG();
  await testSearxng();
}

run();
