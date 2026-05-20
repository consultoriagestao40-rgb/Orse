const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.split('\r\n').join('\n');

console.log('Iniciando aplicacao de correcoes de layout (Parte 3)...');

// 1. CORREÇÃO SLIDE 04 - VALORES (TELA)
// Mão original e esferas originais na tela:
const oldHandSupportTela = `<img 
                                           src="/hand-support.png" 
                                           alt="Mão de suporte"
                                           className="absolute right-[-40px] bottom-[-20px] w-[340px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                        />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Trophy size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Lightbulb size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Users size={36} className="text-white shrink-0" />
                                        </div>`;

// Queremos que a mão fique abaixo fisicamente. Deslocar bottom de -20px para -55px, largura de 340px para 300px
// Subir esferas (Trophy de top-0 para top-[-12px], as outras duas de bottom-12 para bottom-[100px])
const newHandSupportTela = `<img 
                                           src="/hand-support.png" 
                                           alt="Mão de suporte"
                                           className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                        />
                                        <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Trophy size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Lightbulb size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Users size={36} className="text-white shrink-0" />
                                        </div>`;

const normOldHandTela = oldHandSupportTela.split('\r\n').join('\n');
const normNewHandTela = newHandSupportTela.split('\r\n').join('\n');

if (content.includes(normOldHandTela)) {
   content = content.replace(normOldHandTela, normNewHandTela);
   console.log('✔ Slide 04 (Tela): Mao reposicionada abaixo e esferas elevadas.');
} else {
   console.log('⚠ Slide 04 (Tela): Nao foi possivel encontrar o bloco de layout original.');
}

// 2. CORREÇÃO SLIDE 04 - VALORES (PDF)
// Mão e esferas originais no PDF:
const oldHandSupportPDF = `<img 
                                      src="/hand-support.png" 
                                      alt="Mão de suporte"
                                      className="absolute right-[-40px] bottom-[-20px] w-[340px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                   />`;

const newHandSupportPDF = `<img 
                                      src="/hand-support.png" 
                                      alt="Mão de suporte"
                                      className="absolute right-[-20px] bottom-[-55px] w-[300px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                   />`;

if (content.includes(oldHandSupportPDF)) {
   content = content.replace(oldHandSupportPDF, newHandSupportPDF);
   console.log('✔ Slide 04 (PDF): Mao reposicionada abaixo com sucesso.');
}

// Para as esferas do PDF, vamos usar a substituição baseada no SLIDE 04 PRINT
const slide04PrintIndex = content.indexOf('{/* SLIDE 04 PRINT - NOSSOS VALORES */}');
if (slide04PrintIndex !== -1) {
   let slide04Part = content.substring(slide04PrintIndex, slide04PrintIndex + 3000);
   
   const oldTrophyPDF = 'className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
   const newTrophyPDF = 'className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
   
   const oldLightbulbPDF = 'className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
   const newLightbulbPDF = 'className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
   
   const oldUsersPDF = 'className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';
   const newUsersPDF = 'className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

   if (slide04Part.includes(oldTrophyPDF)) {
      slide04Part = slide04Part.replace(oldTrophyPDF, newTrophyPDF);
      console.log('✔ Trophy no PDF elevado.');
   }
   if (slide04Part.includes(oldLightbulbPDF)) {
      slide04Part = slide04Part.replace(oldLightbulbPDF, newLightbulbPDF);
      console.log('✔ Lightbulb no PDF elevada.');
   }
   if (slide04Part.includes(oldUsersPDF)) {
      slide04Part = slide04Part.replace(oldUsersPDF, newUsersPDF);
      console.log('✔ Users no PDF elevado.');
   }
   
   const partBefore = content.substring(0, slide04PrintIndex);
   const partAfter = content.substring(slide04PrintIndex + 3000);
   content = partBefore + slide04Part + partAfter;
}

// 3. CORREÇÃO SLIDE 12 - CONDIÇÕES GERAIS (TELA E PDF)
// Vamos otimizar os cards inferiores (Colaboradores e Cliente) para eliminar barra de rolagem
// E reduzir levemente fontes e espaçamentos dos cards inferiores.
// Na tela:
const oldVAContainerTela = `<div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">`;
const newVAContainerTela = `<div className="space-y-1">`;

const oldVAItemTela = `<div key={idx} className="flex gap-2 items-start text-[9px] leading-tight">
                                                   <CheckCircle2 size={10} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-bold">{cond}</span>
                                                </div>`;

const newVAItemTela = `<div key={idx} className="flex gap-1.5 items-start text-[8px] leading-tight">
                                                   <CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-semibold text-[8px] leading-tight">{cond}</span>
                                                </div>`;

// No PDF:
const oldVAContainerPDF = `<div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">`;
const newVAContainerPDF = `<div className="space-y-1">`;

const oldVAItemPDF = `<div key={idx} className="flex gap-2 items-start text-[9.5px] leading-tight">
                                                      <CheckCircle2 size={11} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                      <span className="text-slate-700 font-bold">{cond}</span>
                                                     </div>`; // Deixando flexível ou com split/join

// Para tornar a substituição do Slide 12 na Tela e PDF 100% robusta contra pequenas variações de espaços:
// Vamos fazer substituição simples de strings-chave:
content = content.split('max-h-[90px] overflow-y-auto pr-1').join('space-y-1');
content = content.split('max-h-[100px] overflow-y-auto pr-1').join('space-y-1');

// Substituir os itens da tela (Slide 12 na tela):
const targetItemTela = `                                                <div key={idx} className="flex gap-2 items-start text-[9px] leading-tight">
                                                   <CheckCircle2 size={10} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-bold">{cond}</span>
                                                </div>`;

const repItemTela = `                                                <div key={idx} className="flex gap-1.5 items-start text-[8px] leading-tight">
                                                   <CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                   <span className="text-slate-700 font-semibold text-[8px] leading-tight">{cond}</span>
                                                </div>`;

content = content.replace(targetItemTela.split('\r\n').join('\n'), repItemTela.split('\r\n').join('\n'));

// E para o PDF:
const targetItemPDF = `                                                     <div key={idx} className="flex gap-2 items-start text-[9.5px] leading-tight">
                                                         <CheckCircle2 size={11} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                         <span className="text-slate-700 font-bold">{cond}</span>
                                                      </div>`;

const repItemPDF = `                                                     <div key={idx} className="flex gap-1.5 items-start text-[8px] leading-tight">
                                                         <CheckCircle2 size={9} className="text-[#1b4d3e] shrink-0 mt-0.5" />
                                                         <span className="text-slate-700 font-semibold text-[8px] leading-tight">{cond}</span>
                                                      </div>`;

content = content.replace(targetItemPDF.split('\r\n').join('\n'), repItemPDF.split('\r\n').join('\n'));

console.log('✔ Slide 12: Barras de rolagem eliminadas e tamanhos de fonte otimizados (Tela e PDF).');

// Gravar de volta
fs.writeFileSync(pagePath, content.split('\n').join(originalLineEnding), 'utf8');
console.log('✔ Arquivo page.tsx atualizado com sucesso!');
