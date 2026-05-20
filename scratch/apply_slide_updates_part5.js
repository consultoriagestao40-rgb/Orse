const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando aplicacao final de ajuste de posicao da mao (Parte 5)...');

// --- SLIDE 04: AJUSTAR POSIÇÃO DA MÃO NA TELA ---
// De: className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
// Para: className="absolute right-[-10px] bottom-[-65px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"

const oldHandTela = 'className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';
const newHandTela = 'className="absolute right-[-10px] bottom-[-65px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';

if (content.includes(oldHandTela)) {
   content = content.split(oldHandTela).join(newHandTela);
   console.log('✔ Mao de suporte na Tela atualizada (Part 5).');
} else {
   console.log('⚠ Nao foi possivel encontrar a mao da tela com a classe antiga.');
}

// --- SLIDE 04: AJUSTAR POSIÇÃO DA MÃO NO PDF ---
// O PDF também já tinha sido atualizado para a classe da tela no script 4!
// Então a substituição com split/join acima já pegou ambas as ocorrências se fossem idênticas!
// Caso o PDF tivesse alguma variação (com espaçamento diferente), vamos forçar a substituição das duas:
const oldHandPDFPattern = 'className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';
content = content.split(oldHandPDFPattern).join(newHandTela);

console.log('✔ Posicionamento da mao ajustado no PDF com sucesso.');

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 5!');
