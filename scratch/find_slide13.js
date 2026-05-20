const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Buscando brightness-0 invert no page.tsx...');

let idx = -1;
while ((idx = content.indexOf('brightness-0 invert', idx + 1)) !== -1) {
   console.log(`\n--- Encontrado na posicao ${idx} ---`);
   const start = Math.max(0, idx - 150);
   const end = Math.min(content.length, idx + 250);
   console.log(content.substring(start, end));
}
