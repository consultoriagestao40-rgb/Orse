const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando aplicacao final de proporcoes e fontes do Slide 12 (Parte 6)...');

// Substituir o bloco de item de lista do Slide 12 que esta com text-[8px] e size={9}
// por text-[9.5px] e size={13} com alinhamento perfeito

// Definindo o bloco antigo normalizado com \n
const targetItem = `                                               <div key={idx} className="flex gap-1.5 items-start text-[8px] leading-tight">
                                                   <CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-semibold text-[8px] leading-tight">{cond}</span>
                                                </div>`;

const repItem = `                                               <div key={idx} className="flex gap-2.5 items-start text-[9.5px] leading-normal">
                                                   <CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-semibold text-[9.5px] leading-normal">{cond}</span>
                                                </div>`;

// Normalizar quebras de linha para busca
content = content.split('\r\n').join('\n');

const normTargetItem = targetItem.split('\r\n').join('\n');
const normRepItem = repItem.split('\r\n').join('\n');

if (content.includes(normTargetItem)) {
   content = content.split(normTargetItem).join(normRepItem);
   console.log('✔ Itens do Slide 12 atualizados com sucesso (Parte 6).');
} else {
   // Caso as indentações sejam levemente diferentes no PDF ou tela, fazemos substituição por strings mais curtas
   console.log('⚠ Blocos exatos de item com recuo longo nao foram detectados. Aplicando substituicao direta de strings...');
   
   // Fazer de forma mais genérica substituindo as linhas de tag individuais:
   content = content.split('className="flex gap-1.5 items-start text-[8px] leading-tight"').join('className="flex gap-2.5 items-start text-[9.5px] leading-normal"');
   content = content.split('<CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('<CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5" ');
   content = content.split('className="text-slate-700 font-semibold text-[8px] leading-tight"').join('className="text-slate-700 font-semibold text-[9.5px] leading-normal"');
   
   console.log('✔ Substituicao generica aplicada para garantir!');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 6!');
