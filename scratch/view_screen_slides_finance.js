const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const targetIndices = [248407, 254024, 266504, 272317];

console.log("--- ANALISANDO ARREDORES DOS ÍNDICES DA TELA ---");
for (const idx of targetIndices) {
  const start = Math.max(0, idx - 150);
  const end = Math.min(content.length, idx + 100);
  console.log(`Índice ${idx}:`);
  console.log("-->", content.substring(start, end).replace(/\n/g, ' '));
  console.log("-----------------------------------------");
}
