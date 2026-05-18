const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const idx13 = content.indexOf('currentSlide === 13 && (', 250000);
const idx13End = content.indexOf('currentSlide ===', idx13 + 30);

console.log("Trecho final do Slide 13 na tela (comprimento:", idx13End - idx13, "):");
console.log(content.substring(idx13End - 400, idx13End).replace(/\n/g, ' '));
