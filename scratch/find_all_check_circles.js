const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
const lines = content.split(/\r?\n/);

console.log('Buscando todas as ocorrencias de CheckCircle no page.tsx...');

lines.forEach((line, idx) => {
   if (line.includes('CheckCircle') || line.includes('CheckCircle2')) {
      console.log(`Linha ${idx + 1}: ${line.trim()}`);
   }
});
