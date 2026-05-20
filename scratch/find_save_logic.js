const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.split('\r\n').join('\n');

console.log('Buscando lógica de salvamento...');

// Procurar palavras-chave como "fetch", "axios", "save", "handleSave", "salvar", "POST", "PUT"
const keywords = ['handleSave', 'salvar', 'fetch(', 'body:', 'JSON.stringify'];

keywords.forEach(keyword => {
   let idx = -1;
   while ((idx = content.indexOf(keyword, idx + 1)) !== -1) {
      console.log(`\n--- Encontrado "${keyword}" na posicao ${idx} ---`);
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 450);
      console.log(content.substring(start, end));
   }
});
