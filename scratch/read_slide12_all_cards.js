const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
content = content.split('\r\n').join('\n');

console.log('Buscando cards do Slide 12...');

// Encontrar "CONDIÇÕES GERAIS DA PROPOSTA" na tela e imprimir 3000 caracteres
const idx = content.indexOf('CONDIÇÕES GERAIS DA PROPOSTA');
if (idx !== -1) {
   console.log(content.substring(idx, idx + 4000));
}
