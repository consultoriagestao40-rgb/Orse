const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.split('\r\n').join('\n');

const slide13TelaIdx = content.indexOf('TERMO DE ACEITE E CONTRATAÇÃO');
if (slide13TelaIdx !== -1) {
   console.log('\n--- SLIDE 13 TELA COMPLETO ---');
   console.log(content.substring(slide13TelaIdx, slide13TelaIdx + 3000));
}

const secondIdx = content.indexOf('TERMO DE ACEITE E CONTRATAÇÃO', slide13TelaIdx + 1);
if (secondIdx !== -1) {
   console.log('\n--- SLIDE 13 PDF COMPLETO ---');
   console.log(content.substring(secondIdx, secondIdx + 3000));
}
