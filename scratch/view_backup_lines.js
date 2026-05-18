const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page_original.tsx');
let content = fs.readFileSync(originalPath, 'utf8');

// Procurar índices das palavras-chave
const qsIdx = content.indexOf('QUEM SOMOS');
const saIdx = content.indexOf('SETORES ATENDIDOS');

console.log("QUEM SOMOS index:", qsIdx);
console.log("SETORES ATENDIDOS index:", saIdx);

// Vamos salvar um bloco maior para ver as linhas em volta
if (qsIdx !== -1) {
   // Achar o início do slide 03 print
   // No original, antes de "QUEM SOMOS", deve haver algo como 'print-slide w-full aspect-[16/9]' ou similar.
   // Vamos pegar 2000 caracteres antes e 15000 caracteres depois para capturar os slides 03, 04, 05, 06.
   const start = Math.max(0, qsIdx - 2000);
   const end = Math.min(content.length, saIdx + 15000);
   const section = content.substring(start, end);
   fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'original_section.txt'), section, 'utf8');
   console.log("✔ Bloco original salvo em scratch/original_section.txt!");
}
