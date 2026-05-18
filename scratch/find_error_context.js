const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Resetando temporariamente para o original do Git...");
execSync('git checkout d66bdf8 -- app/propostas/nova/page.tsx');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');
const lines = content.split('\n');

// Vamos pesquisar onde fica o estilo CSS do modal ou o fechamento de div que sobrou
console.log("Buscando trecho '@keyframes modalFadeIn' no original...");
const keyframesLineIdx = lines.findIndex(l => l.includes('modalFadeIn'));
console.log("Linha do keyframes no original:", keyframesLineIdx + 1);

console.log("Mostrando as 30 linhas anteriores a keyframes no original:");
const startLine = Math.max(0, keyframesLineIdx - 30);
for (let i = startLine; i <= keyframesLineIdx; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
