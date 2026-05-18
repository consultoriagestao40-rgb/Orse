const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const anchors = [
  { name: 'Import lucide-react', query: "import { Box, Drill, Trash" },
  { name: 'Slide 03 TELA', query: '{/* SLIDE 03 (NOSSA PRESENÇA - QUEM SOMOS E COBERTURA SUL) */}' },
  { name: 'Slide 07 TELA', query: '{/* SLIDE 07 (PRINCIPAIS FERRAMENTAS - DIVIDIDO LADO A LADO) */}' },
  { name: 'Slide 03 PDF', query: '{/* SLIDE 03 PRINT - NOSSA PRESENÇA / QUEM SOMOS */}' },
  { name: 'Slide 07 PDF', query: '{/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}' },
  { name: 'Slide 09 TELA', query: '{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}' },
  { name: 'Slide 13 TELA FIM', query: '{/* CONTROLES DE NAVEGAÇÃO DOS SLIDES (PADRONIZADOS FORA DO SLIDE E DO NÚMERO) */}' },
  { name: 'Slide 09 PDF', query: '{/* SLIDE 09 PRINT - QUADRO EFETIVO */}' },
  { name: 'Slide 10 PDF', query: '{/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}' },
  { name: 'Slide 11 PDF', query: '{/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}' },
  { name: 'Slide 12 PDF', query: '{/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}' },
  { name: 'Slide 13 PDF', query: '{/* SLIDE 13 PRINT - ACEITE */}' },
];

console.log("Mapeamento completo de âncoras no arquivo page.tsx original:");
anchors.forEach(a => {
   const idx = content.indexOf(a.query);
   console.log(`- [${a.name}]: index ${idx}`);
});
console.log("Comprimento total do arquivo:", content.length);
