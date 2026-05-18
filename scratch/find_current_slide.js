const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const regex = /currentSlide\s*===\s*\d+/g;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push({ text: match[0], index: match.index });
}

console.log("Comparações de currentSlide:", matches);
