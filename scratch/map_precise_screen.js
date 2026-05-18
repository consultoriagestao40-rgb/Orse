const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const s09StartStr = '{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}';
const s10StartStr = 'currentSlide === 10 && (';
const s11StartStr = 'currentSlide === 11 && (() => {';
const s12StartStr = 'currentSlide === 12 && (';
const s13StartStr = 'currentSlide === 13 && (';

const idx09 = content.indexOf(s09StartStr);
const idx10 = content.indexOf(s10StartStr, idx09);
const idx11 = content.indexOf(s11StartStr, idx10);
const idx12 = content.indexOf(s12StartStr, idx11);
const idx13 = content.indexOf(s13StartStr, idx12);

// Onde termina o slide 13? Vamos achar a proxima ocorrencia de 'currentSlide ===' após idx13 + 30
const idx13End = content.indexOf('currentSlide ===', idx13 + 30);

console.log("Índices exatos para a TELA corrigido:", {
  idx09, idx10, idx11, idx12, idx13, idx13End
});

if (idx13End !== -1) {
  console.log("Fechamento do Slide 13 na tela (150 caracteres antes do próximo currentSlide):");
  console.log(content.substring(idx13End - 150, idx13End).replace(/\n/g, ' '));
}
