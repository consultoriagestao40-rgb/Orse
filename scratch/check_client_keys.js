const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.split('\r\n').join('\n');

console.log('Analisando vinculacao dos inputs do Slide 13...');

// Vamos procurar ocorrencias de "razaoSocial" ou "cnpj"
const keys = ['razaoSocial', 'cnpj', 'dataInicio', 'dataVencimento', 'contatoCargo'];
keys.forEach(key => {
   let idx = -1;
   while ((idx = content.indexOf(key, idx + 1)) !== -1) {
      console.log(`\n--- Encontrado "${key}" na posicao ${idx} ---`);
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 250);
      console.log(content.substring(start, end));
   }
});
