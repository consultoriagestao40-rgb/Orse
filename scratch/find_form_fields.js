const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Buscando inputs do Slide 13 no page.tsx...');

// Procurar ocorrencias de "INFORMAÇÕES DE ACEITE" ou "Razão Social" no formulario de edicao
const formKeywords = ['INFORMAÇÕES DE ACEITE', 'Razão Social', 'CNPJ', 'Data de Início', 'Cargo', 'vencimento'];

formKeywords.forEach(keyword => {
   let idx = -1;
   while ((idx = content.indexOf(keyword, idx + 1)) !== -1) {
      console.log(`\n--- Encontrado "${keyword}" na posicao ${idx} ---`);
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 400);
      console.log(content.substring(start, end));
   }
});
