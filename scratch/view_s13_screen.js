const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const idx13 = content.indexOf('currentSlide === 13', 250000); // busca a partir de 250000 para achar a da tela

console.log("--- SLIDE 13 TELA E ADJACÊNCIAS ---");
if (idx13 !== -1) {
  console.log(content.substring(idx13, idx13 + 1200));
}
