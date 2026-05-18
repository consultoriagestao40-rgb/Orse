const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const slides = [
  { num: 3, label: "SLIDE 03 (NOSSA PRESENÇA" },
  { num: 4, label: "SLIDE 04 (NOSSOS VALORES" },
  { num: 5, label: "SLIDE 05 (PRINCIPAIS SERVIÇOS" },
  { num: 6, label: "SLIDE 06 (SETORES ATENDIDOS" },
  { num: 9, label: "SLIDE 04 (QUADRO EFETIVO" },
  { num: 10, label: "SLIDE 05 (ITENS INCLUSOS E EXCLUSÍDOS" },
  { num: 11, label: "SLIDE 06 (RESUMO DA PROPOSTA" },
  { num: 12, label: "SLIDE 07 (CONDIÇÕES DA PROPOSTA" },
  { num: 13, label: "SLIDE 08 (ACEITE" }
];

console.log("--- ANALISANDO SLIDES DA TELA ---");
for (const s of slides) {
  const idx = content.indexOf(s.label);
  if (idx !== -1) {
    // Achar o proximo trecho correspondente a "currentSlide ===" ou similar
    console.log(`Slide ${s.num} localizado no index ${idx}:`);
    console.log(content.substring(idx - 20, idx + 120).replace(/\n/g, ' '));
  } else {
    console.log(`❌ Slide ${s.num} (${s.label}) NÃO localizado!`);
  }
}
