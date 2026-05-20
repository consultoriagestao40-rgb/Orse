const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando aplicacao final de ajuste de posicao vertical da mao (Parte 7)...');

// --- SLIDE 04: DESCER A MÃO EM MAIS 20PX (TELA E PDF) ---
const oldHand = 'className="absolute right-[-10px] bottom-[-65px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';
const newHand = 'className="absolute right-[-10px] bottom-[-85px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';

if (content.includes(oldHand)) {
   content = content.split(oldHand).join(newHand);
   console.log('✔ Posicionamento vertical da mao de suporte atualizado (descido em 20px).');
} else {
   console.log('⚠ Nao foi possivel encontrar a mao com a classe da Parte 6.');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 7!');
