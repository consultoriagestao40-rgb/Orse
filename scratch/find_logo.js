const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Buscando referencias no page.tsx...');

// O último slide costuma ser o slide de encerramento, agradecimento ou assinatura.
// Vamos procurar ocorrencias de "obrigado", "encerra", "fim", "contato", "Facilities" ou "JVS".
const keywords = ['Facilities', 'obrigado', 'agradecemos', 'JVS', 'contato', 'jvsserv'];

keywords.forEach(keyword => {
   let idx = -1;
   while ((idx = content.indexOf(keyword, idx + 1)) !== -1) {
      console.log(`\n--- Encontrado "${keyword}" na posicao ${idx} ---`);
      // Pegar 150 caracteres antes e 350 depois
      const start = Math.max(0, idx - 150);
      const end = Math.min(content.length, idx + 350);
      console.log(content.substring(start, end));
   }
});
