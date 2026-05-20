const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Buscando detalhes do Slide 13 (Termo de Aceite)...');

const slide13TelaIdx = content.indexOf('TERMO DE ACEITE E CONTRATAÇÃO');
if (slide13TelaIdx !== -1) {
   console.log('\n--- SLIDE 13 TELA CODIGO ---');
   console.log(content.substring(slide13TelaIdx, slide13TelaIdx + 1500));
}

// Vamos procurar no PDF também (segunda ocorrencia)
const secondIdx = content.indexOf('TERMO DE ACEITE E CONTRATAÇÃO', slide13TelaIdx + 1);
if (secondIdx !== -1) {
   console.log('\n--- SLIDE 13 PDF CODIGO ---');
   console.log(content.substring(secondIdx, secondIdx + 1500));
}
