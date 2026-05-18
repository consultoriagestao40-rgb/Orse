const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

// Vamos ver os blocos ao redor das ocorrências do Bloco 1
console.log("--- BLOCO 1 (TELA) ---");
const idx03_1 = content.indexOf('{/* SLIDE 03 - NOSSA PRESENÇA / QUEM SOMOS */}');
const idx04_1 = content.indexOf('{/* SLIDE 04 - NOSSOS VALORES */}');
const idx05_1 = content.indexOf('{/* SLIDE 05 - PRINCIPAIS SERVIÇOS PRESTADOS */}');
const idx06_1 = content.indexOf('{/* SLIDE 06 - SETORES ATENDIDOS */}');
const idx07_1 = content.indexOf('{/* SLIDE 07 - PRINCIPAIS FERRAMENTAS */}');

console.log("Índices das âncoras do Bloco 1:", {
  idx03_1,
  idx04_1,
  idx05_1,
  idx06_1,
  idx07_1
});

// Vamos ver se existem as âncoras para os slides de 08 a 13 no Bloco 1
const idx08_1 = content.indexOf('{/* SLIDE 08 - ');
const idx09_1 = content.indexOf('{/* SLIDE 09 - ');
const idx10_1 = content.indexOf('{/* SLIDE 10 - ');
const idx11_1 = content.indexOf('{/* SLIDE 11 - ');
const idx12_1 = content.indexOf('{/* SLIDE 12 - ');
const idx13_1 = content.indexOf('{/* SLIDE 13 - ');

console.log("Presença dos slides 08-13 na tela (Bloco 1):", {
  idx08_1,
  idx09_1,
  idx10_1,
  idx11_1,
  idx12_1,
  idx13_1
});
