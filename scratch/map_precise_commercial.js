const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const startStr = '{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}';
const endStr = '{/* CONTROLES DE NAVEGAÇÃO DOS SLIDES (PADRONIZADOS FORA DO SLIDE E DO NÚMERO) */}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

console.log("Mapeamento do Bloco Comercial da Tela:");
console.log("- startIdx:", startIdx);
console.log("- endIdx:", endIdx);
console.log("- comprimento:", endIdx - startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  console.log("Primeiros 100 caracteres:");
  console.log(content.substring(startIdx, startIdx + 100).replace(/\n/g, ' '));
  console.log("Últimos 100 caracteres:");
  console.log(content.substring(endIdx - 100, endIdx).replace(/\n/g, ' '));
}
