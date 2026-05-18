const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const regex = /SLIDE \d+/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(content.length, match.index + 100);
  console.log(`Match: "${match[0]}" no indice ${match.index}:`);
  console.log("-->", content.substring(start, end).replace(/\n/g, ' '));
  console.log("-----------------------------------------");
}
