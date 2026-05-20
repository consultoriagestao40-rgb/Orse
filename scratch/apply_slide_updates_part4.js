const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando aplicacao final de correcoes de layout (Parte 4)...');

// --- SLIDE 04: VALORES (PDF) ---
// Mão de suporte no PDF
const oldHandPDF = 'className="absolute right-[-40px] bottom-[-20px] w-[340px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';
const newHandPDF = 'className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"';

if (content.includes(oldHandPDF)) {
   content = content.split(oldHandPDF).join(newHandPDF);
   console.log('✔ Mao de suporte no PDF atualizada.');
}

// Esferas no PDF (seja com ou sem o hover do script 2)
// Vamos elevar o Trophy no PDF
const oldTrophyPDF_1 = 'className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const oldTrophyPDF_2 = 'className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
const newTrophyPDF = 'className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

content = content.split(oldTrophyPDF_1).join(newTrophyPDF);
content = content.split(oldTrophyPDF_2).join(newTrophyPDF);

// Lightbulb no PDF
const oldLightbulbPDF_1 = 'className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const oldLightbulbPDF_2 = 'className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
const newLightbulbPDF = 'className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

content = content.split(oldLightbulbPDF_1).join(newLightbulbPDF);
content = content.split(oldLightbulbPDF_2).join(newLightbulbPDF);

// Users no PDF
const oldUsersPDF_1 = 'className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const oldUsersPDF_2 = 'className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
const newUsersPDF = 'className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

content = content.split(oldUsersPDF_1).join(newUsersPDF);
content = content.split(oldUsersPDF_2).join(newUsersPDF);

console.log('✔ Esferas de valores no PDF reposicionadas e elevadas.');


// --- SLIDE 12: CONDIÇÕES GERAIS ---
// Limpar classes duplicadas
content = content.split('className="space-y-1.5 space-y-1"').join('className="space-y-1"');

// Otimizar itens na Tela
content = content.split('className="flex gap-2 items-start text-[9px] leading-tight"').join('className="flex gap-1.5 items-start text-[8px] leading-tight"');
content = content.split('<CheckCircle2 size={10} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('<CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />');

// Otimizar itens no PDF
content = content.split('className="flex gap-2 items-start text-[9.5px] leading-tight"').join('className="flex gap-1.5 items-start text-[8px] leading-tight"');
content = content.split('<CheckCircle2 size={11} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('<CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />');

// Otimizar textos dos spans
content = content.split('className="text-slate-700 font-bold"').join('className="text-slate-700 font-semibold text-[8px] leading-tight"');

console.log('✔ Otimizacao de espaco, scrollbar e fontes do Slide 12 (Tela e PDF) aplicados.');

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 4!');
