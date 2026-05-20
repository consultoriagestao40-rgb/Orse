const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha para \n temporariamente para garantir correspondencia
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.split('\r\n').join('\n');

console.log('Iniciando aplicacao de correcoes robustas...');

// 1. Corrigir Slide 04 - Valores (PDF) - Esferas com z-10 e hover
const targetEsferasPDF = `                                   <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                      <Trophy size={36} className="text-white shrink-0" />
                                   </div>

                                   <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                      <Lightbulb size={36} className="text-white shrink-0" />
                                   </div>

                                   <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                      <Users size={36} className="text-white shrink-0" />
                                   </div>`;

const replacementEsferasPDF = `                                   <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                      <Trophy size={36} className="text-white shrink-0" />
                                   </div>

                                   <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                      <Lightbulb size={36} className="text-white shrink-0" />
                                   </div>

                                   <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                      <Users size={36} className="text-white shrink-0" />
                                   </div>`;

const normTargetEsferas = targetEsferasPDF.split('\r\n').join('\n');
const normRepEsferas = replacementEsferasPDF.split('\r\n').join('\n');

if (content.includes(normTargetEsferas)) {
   content = content.replace(normTargetEsferas, normRepEsferas);
   console.log('✔ Slide 04: Esferas do PDF atualizadas com sucesso.');
} else {
   console.log('⚠ Slide 04: Bloco de esferas do PDF nao encontrado ou ja atualizado.');
}

// 2. Corrigir Slide 05 - Serviços na Tela (Substituir os 5 SVGs pelos premium)
// Categoria 1: Limpeza (Tela)
const targetLimpezaTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="16" r="6" fill="currentColor" />
                                              <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                           </svg>
                                        </div>`;

const repLimpezaTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="16" r="6" fill="currentColor" />
                                              <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                              <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                              <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                              <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                              <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                              <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                              <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                           </svg>
                                        </div>`;

content = content.replace(targetLimpezaTela.split('\r\n').join('\n'), repLimpezaTela.split('\r\n').join('\n'));

// Categoria 2: Portaria (Tela)
const targetPortariaTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="25" r="6" fill="currentColor" />
                                              <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                           </svg>
                                        </div>`;

const repPortariaTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                              <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                              <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                              <circle cx="32" cy="25" r="6" fill="currentColor" />
                                              <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                              <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                              <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                              <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                              <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                              <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                           </svg>
                                        </div>`;

content = content.replace(targetPortariaTela.split('\r\n').join('\n'), repPortariaTela.split('\r\n').join('\n'));

// Categoria 3: Recepção (Tela)
const targetRecepcaoTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                              <circle cx="22" cy="22" r="5" fill="currentColor" />
                                           </svg>
                                        </div>`;

const repRecepcaoTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                              <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                              <circle cx="22" cy="22" r="5" fill="currentColor" />
                                              <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                              <circle cx="42" cy="22" r="5" fill="currentColor" />
                                              <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                              <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                              <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                              <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                           </svg>
                                        </div>`;

content = content.replace(targetRecepcaoTela.split('\r\n').join('\n'), repRecepcaoTela.split('\r\n').join('\n'));

// Categoria 4: Manutenção (Tela)
const targetManutencaoTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="28" cy="18" r="6" fill="currentColor" />
                                           </svg>
                                        </div>`;

const repManutencaoTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                              <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                              <circle cx="28" cy="18" r="6" fill="currentColor" />
                                              <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                              <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                              <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                              <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                              <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                              <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                           </svg>
                                        </div>`;

content = content.replace(targetManutencaoTela.split('\r\n').join('\n'), repManutencaoTela.split('\r\n').join('\n'));

// Categoria 5: Jardinagem (Tela)
const targetJardinagemTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="26" r="5" fill="currentColor" />
                                           </svg>
                                        </div>`;

const repJardinagemTela = `                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                              <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                              <circle cx="32" cy="26" r="5" fill="currentColor" />
                                              <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                              <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                              <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                              <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                              <circle cx="32" cy="38" r="2" fill="#eab308" />
                                           </svg>
                                        </div>`;

content = content.replace(targetJardinagemTela.split('\r\n').join('\n'), repJardinagemTela.split('\r\n').join('\n'));
console.log('✔ Slide 05: SVGs da visualizacao em tela atualizados.');

// 3. Corrigir Slide 05 - Serviços no PDF (Substituir os 5 SVGs pelos premium)
// Categoria 1: Limpeza (PDF)
const targetLimpezaPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                     </svg>
                                  </div>`;

const repLimpezaPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                        <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                        <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                        <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                        <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                        <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                     </svg>
                                  </div>`;

content = content.replace(targetLimpezaPDF.split('\r\n').join('\n'), repLimpezaPDF.split('\r\n').join('\n'));

// Categoria 2: Portaria (PDF)
const targetPortariaPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                     </svg>
                                  </div>`;

const repPortariaPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                        <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                        <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                        <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                        <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                        <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                        <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                        <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                     </svg>
                                  </div>`;

content = content.replace(targetPortariaPDF.split('\r\n').join('\n'), repPortariaPDF.split('\r\n').join('\n'));

// Categoria 3: Recepção (PDF)
const targetRecepcaoPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                     </svg>
                                  </div>`;

const repRecepcaoPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                        <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                        <circle cx="42" cy="22" r="5" fill="currentColor" />
                                        <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                        <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                        <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                        <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                     </svg>
                                  </div>`;

content = content.replace(targetRecepcaoPDF.split('\r\n').join('\n'), repRecepcaoPDF.split('\r\n').join('\n'));

// Categoria 4: Manutenção (PDF)
const targetManutencaoPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                     </svg>
                                  </div>`;

const repManutencaoPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                        <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                        <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                        <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                        <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                     </svg>
                                  </div>`;

content = content.replace(targetManutencaoPDF.split('\r\n').join('\n'), repManutencaoPDF.split('\r\n').join('\n'));

// Categoria 5: Jardinagem (PDF)
const targetJardinagemPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                     </svg>
                                  </div>`;

const repJardinagemPDF = `                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                        <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                        <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                        <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                        <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                        <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="32" cy="38" r="2" fill="#eab308" />
                                     </svg>
                                  </div>`;

content = content.replace(targetJardinagemPDF.split('\r\n').join('\n'), repJardinagemPDF.split('\r\n').join('\n'));
console.log('✔ Slide 05: SVGs da visualizacao do PDF atualizados.');

// 4. Corrigir Slide 12 - Valor Total Mensal Proposto (Tela e PDF)
const targetTotal = `{fc((resultado?.totalGeral || 0) + insumosSubtotal)}`;
const repTotal = `{fc(maoDeObraSubtotal + insumosSubtotal)}`;

const normTargetTotal = targetTotal.split('\r\n').join('\n');
const normRepTotal = repTotal.split('\r\n').join('\n');

if (content.includes(normTargetTotal)) {
   // Substituir todas as ocorrencias (Tela e PDF)
   content = content.split(normTargetTotal).join(normRepTotal);
   console.log('✔ Slide 12: Formulas do valor total propostas corrigidas com sucesso (Tela e PDF).');
} else {
   console.log('⚠ Slide 12: Formula do valor total nao encontrada (ou ja atualizada).');
}

// Gravar de volta
fs.writeFileSync(pagePath, content.split('\n').join(originalLineEnding), 'utf8');
console.log('✔ Arquivo page.tsx gravado com sucesso!');
