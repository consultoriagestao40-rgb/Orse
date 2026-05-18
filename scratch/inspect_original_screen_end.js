const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const anchor = '{/* CONTROLES DE NAVEGAÇÃO DOS SLIDES (PADRONIZADOS FORA DO SLIDE E DO NÚMERO) */}';
const idx = content.indexOf(anchor);

if (idx !== -1) {
  console.log("✔ Âncora de navegação encontrada no índice:", idx);
  console.log("Mostrando os 1000 caracteres antes da âncora:");
  console.log(content.substring(idx - 1000, idx));
} else {
  console.log("❌ Âncora de navegação não encontrada!");
}
