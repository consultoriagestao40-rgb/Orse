const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

// Slide 03 da Tela (indice ~175308)
const s03StartIdx = content.indexOf('{/* SLIDE 03 (NOSSA PRESENÇA - QUEM SOMOS E COBERTURA SUL) */}');
const s04StartIdx = content.indexOf('{/* SLIDE 04 (NOSSOS VALORES - COM AS TRÊS ESFERAS DE VALORES E A MÃO DE SUPORTE) */}');

console.log("--- SLIDE 03 TELA ---");
if (s03StartIdx !== -1 && s04StartIdx !== -1) {
  console.log(content.substring(s03StartIdx, s03StartIdx + 800));
}

// Slide 09 da Tela (indice ~240263)
const s09StartIdx = content.indexOf('{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}');
const s10StartIdx = content.indexOf('{/* SLIDE 05 (ITENS INCLUSOS E EXCLUSÍDOS - COM STATUS DE INCLUSÃO OU NÃO) */}');

console.log("\n--- SLIDE 09 TELA ---");
if (s09StartIdx !== -1 && s10StartIdx !== -1) {
  console.log(content.substring(s09StartIdx, s09StartIdx + 800));
}
