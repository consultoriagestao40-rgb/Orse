const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.split('\r\n').join('\n');

console.log('Buscando abas ou inputs de Regras/Condições em page.tsx...');

// Palavras-chave: "Condições Gerais", "condicoesColaboradores", "condicoesCliente", "condicaoColaboradores"
const keywords = ['Condições Gerais', 'condicoesColaboradores', 'condicoesCliente', 'condicaoColaboradores1', 'Regras', 'condsColab', 'condsCli'];

keywords.forEach(keyword => {
   let idx = -1;
   while ((idx = content.indexOf(keyword, idx + 1)) !== -1) {
      console.log(`\n--- Encontrado "${keyword}" na posicao ${idx} ---`);
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 450);
      console.log(content.substring(start, end));
   }
});
