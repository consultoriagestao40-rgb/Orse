const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page_original.tsx');
let content = fs.readFileSync(originalPath, 'utf8');

// Buscar usando substrings seguras sem acentos
function findIndexNoAccent(content, prefix, fallback) {
   let idx = content.indexOf(prefix);
   if (idx !== -1) return idx;
   // fallback
   for (let i = 0; i < content.length - prefix.length; i++) {
      let sub = content.substring(i, i + prefix.length);
      // remover acentos ou fazer busca parcial
      if (sub.includes(fallback)) {
         return i;
      }
   }
   return -1;
}

// Vamos procurar os índices
const s03Idx = content.indexOf('SLIDE 03 PRINT');
const s04Idx = content.indexOf('SLIDE 04 PRINT');
const s05Idx = content.indexOf('SLIDE 05 PRINT');
const s06Idx = content.indexOf('SLIDE 06 PRINT');
const s07Idx = content.indexOf('SLIDE 07 PRINT');

console.log("S03 Print Index:", s03Idx);
console.log("S04 Print Index:", s04Idx);
console.log("S05 Print Index:", s05Idx);
console.log("S06 Print Index:", s06Idx);
console.log("S07 Print Index:", s07Idx);

if (s03Idx !== -1 && s07Idx !== -1) {
   const s03Code = content.substring(s03Idx, s04Idx);
   const s04Code = content.substring(s04Idx, s05Idx);
   const s05Code = content.substring(s05Idx, s06Idx);
   const s06Code = content.substring(s06Idx, s07Idx);

   fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'original_s03.txt'), s03Code, 'utf8');
   fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'original_s04.txt'), s04Code, 'utf8');
   fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'original_s05.txt'), s05Code, 'utf8');
   fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'original_s06.txt'), s06Code, 'utf8');
   console.log("✔ Códigos originais salvos com sucesso na pasta scratch!");
} else {
   console.log("❌ Ainda não foi possível encontrar os índices.");
}
