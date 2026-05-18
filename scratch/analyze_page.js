const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

console.log("Comprimento do arquivo:", content.length);

// Vamos encontrar todas as ocorrências de "SLIDE" no arquivo inteiro
const regex = /SLIDE \d+/g;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push({ text: match[0], index: match.index });
}

console.log("Ocorrências de 'SLIDE':", matches);
