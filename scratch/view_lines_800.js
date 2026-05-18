const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const lines = fs.readFileSync(pagePath, 'utf8').split('\n');

console.log("--- Linhas ao redor de 810 ---");
for (let i = Math.max(0, 795); i < Math.min(lines.length, 825); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
