const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Analisando a estrutura do Slide 12 (Tela e PDF)...');

// Vamos procurar onde comeca "Condições Gerais" no PDF (SLIDE 12 PRINT)
const slide12PrintIdx = content.indexOf('{/* SLIDE 12 PRINT - CONDIÇÕES GERAIS DA PROPOSTA */}');
if (slide12PrintIdx !== -1) {
   console.log('\n--- SLIDE 12 PDF CODIGO ---');
   console.log(content.substring(slide12PrintIdx, slide12PrintIdx + 3500));
} else {
   console.log('⚠ Nao encontrou slide 12 print');
}

// Vamos procurar também a versao da Tela
const slide12TelaIdx = content.indexOf('CONDIÇÕES GERAIS DA PROPOSTA');
if (slide12TelaIdx !== -1) {
   console.log('\n--- SLIDE 12 TELA CODIGO ---');
   console.log(content.substring(slide12TelaIdx - 200, slide12TelaIdx + 1500));
}
