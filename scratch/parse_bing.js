const fs = require('fs');

const html = fs.readFileSync('scratch/bing_test_loose.html', 'utf8');

// Extrai blocos <li class="b_algo">...</li>
const bAlgoRegex = /<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/g;
let match;
let count = 0;

console.log('--- Parse Bing Results ---');
while ((match = bAlgoRegex.exec(html)) !== null) {
  count++;
  const block = match[1];
  
  // Extrai o link principal
  // Geralmente: <a ... href="URL" ...>TITLE</a>
  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/i;
  const linkMatch = linkRegex.exec(block);
  
  if (linkMatch) {
    const rawUrl = linkMatch[1];
    let title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
    
    // Decodifica a URL se for uma URL de redirecionamento do Bing
    let url = rawUrl;
    if (url.includes('bing.com/ck/a')) {
      // Tenta extrair a URL real do atributo u ou de outros parâmetros se visível,
      // ou apenas usa como está. Mas geralmente o href real também está no atributo "u" ou "h"
      // Vamos tentar encontrar a URL limpa se houver.
    }
    
    // Extrai o snippet
    // Geralmente em um <p class="b_algo_text" ou similar
    const snippetRegex = /<p[^>]*>([\s\S]*?)<\/p>/i;
    const snippetMatch = snippetRegex.exec(block);
    const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    console.log(`\n[Result #${count}]`);
    console.log(`URL: ${url}`);
    console.log(`Title: ${title}`);
    console.log(`Snippet: ${snippet}`);
  } else {
    // Tenta outro regex simples
    const simpleLink = /href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (simpleLink) {
      console.log(`\n[Result #${count} (simple)]`);
      console.log(`URL: ${simpleLink[1]}`);
      console.log(`Title: ${simpleLink[2].replace(/<[^>]+>/g, '').trim()}`);
    } else {
      console.log(`\n[Result #${count} (no link matched)]`);
    }
  }
}
console.log(`\nTotal parsed: ${count}`);
