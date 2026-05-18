const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const lines = fs.readFileSync(pagePath, 'utf8').split('\n');

console.log("--- Linhas ao redor de 4354 ---");
for (let i = Math.max(0, 4350); i < Math.min(lines.length, 4365); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log("\n--- Linhas ao redor de 5858 ---");
for (let i = Math.max(0, 5850); i < Math.min(lines.length, 5875); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
