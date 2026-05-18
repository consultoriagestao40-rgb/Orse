const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🔄 Resetando page.tsx para o estado estável original do Git...");
execSync('git checkout d66bdf8 -- app/propostas/nova/page.tsx');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log("📖 Lendo page.tsx resetado e mapeando âncoras originais...");

// 1. Adicionar CreditCard nas importações do lucide-react no topo
console.log("Adding CreditCard import to lucide-react...");
content = content.replace(
  "import { Box, Drill, Trash, Presentation, Award, Sparkles, Users, Trophy, Lightbulb, Wrench, Trees, HardHat, ConciergeBell, ChevronLeft, Factory, Store, Bus, Building, Hospital, ShoppingBag, GraduationCap, Share2, Clock, Smartphone, Cpu } from 'lucide-react';",
  "import { Box, Drill, Trash, Presentation, Award, Sparkles, Users, Trophy, Lightbulb, Wrench, Trees, HardHat, ConciergeBell, ChevronLeft, Factory, Store, Bus, Building, Hospital, ShoppingBag, GraduationCap, Share2, Clock, Smartphone, Cpu, CreditCard } from 'lucide-react';"
);

// Mapear âncoras originais
const idx03Screen = content.indexOf('{/* SLIDE 03 (NOSSA PRESENÇA - QUEM SOMOS E COBERTURA SUL) */}');
const idx07Screen = content.indexOf('{/* SLIDE 07 (PRINCIPAIS FERRAMENTAS - DIVIDIDO LADO A LADO) */}');

const idx09Screen = content.indexOf('{/* SLIDE 04 (QUADRO EFETIVO - TABELA AUTOMÁTICA DA ABA 4) */}');
const idxComercialScreenEnd = content.indexOf('{/* CONTROLES DE NAVEGAÇÃO DOS SLIDES (PADRONIZADOS FORA DO SLIDE E DO NÚMERO) */}');

const idx03Print = content.indexOf('{/* SLIDE 03 PRINT - NOSSA PRESENÇA / QUEM SOMOS */}');
const idx07Print = content.indexOf('{/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}');

const idx09Print = content.indexOf('{/* SLIDE 09 PRINT - QUADRO EFETIVO */}');
const idx13PrintEnd = content.lastIndexOf('</main>');

console.log("Índices das âncoras mapeados:", {
  idx03Screen,
  idx07Screen,
  idx09Screen,
  idxComercialScreenEnd,
  idx03Print,
  idx07Print,
  idx09Print,
  idx13PrintEnd
});

// Validar todas as âncoras
if (
  idx03Screen === -1 ||
  idx07Screen === -1 ||
  idx09Screen === -1 ||
  idxComercialScreenEnd === -1 ||
  idx03Print === -1 ||
  idx07Print === -1 ||
  idx09Print === -1 ||
  idx13PrintEnd === -1
) {
  console.log("❌ Falha crítica: Uma ou mais âncoras não foram localizadas!");
  process.exit(1);
}

console.log("✔ Todas as âncoras mapeadas com sucesso. Iniciando refatoração de trás para frente...");

// ========================================================
// SUBST. 4: Bloco Comercial do PDF (Slides 09 a 13 PDF)
// De: idx09Print até idx13PrintEnd
// ========================================================
console.log("Substituindo Bloco Comercial do PDF (Slides 09-13)...");
const pdfComercialCode = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="flex flex-col justify-between h-full relative z-10 w-full">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                               </div>
                               <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                               <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-[#1e4480] text-center py-3">
                                     <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                  </div>
                                  <div className="flex-1">
                                     <table className="w-full text-left border-collapse">
                                        <thead>
                                           <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                              <th className="px-5 py-3">Função</th>
                                              <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                              <th className="px-5 py-3 text-center w-28">Escala</th>
                                              <th className="px-5 py-3 text-center w-36">Horário</th>
                                           </tr>
                                        </thead>
                                        <tbody>
                                           {proposta.equipe && proposta.equipe.length > 0 ? (
                                              proposta.equipe.map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                                    <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                    <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                    <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                       {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                          ? \`\${p.parametrosPosto.horarioInicio} às \${p.parametrosPosto.horarioFim}\` 
                                                          : '08:00 às 17:00'}
                                                    </td>
                                                 </tr>
                                              ))
                                           ) : (
                                              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                 <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">Nenhum posto de trabalho inserido.</td>
                                              </tr>
                                           )}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>

                               <div className="col-span-4 flex flex-col justify-center">
                                  <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                     <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                        <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                     </div>
                                     <div className="space-y-3">
                                        {(() => {
                                           const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                              proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                              proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                              proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                           ];
                                           return clausulas.map((c: string, cIdx: number) => (
                                              <div key={cIdx} className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">{c}</p>
                                              </div>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUSÍDOS</h2>
                               </div>
                               <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto">
                               <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                     <thead>
                                        <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                           <th className="px-6 py-3.5 w-32">Item</th>
                                           <th className="px-6 py-3.5">Descrição</th>
                                           <th className="px-6 py-3.5 text-center w-40">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                           <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                              <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                              <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                              <td className="px-6 py-3.5 text-center">
                                                 {p.incluso ? (
                                                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                       <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                       </svg>
                                                    </div>
                                                 ) : (
                                                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                       <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                       </svg>
                                                    </div>
                                                 )}
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}
                      {(() => {
                         const fc = formatCurrency;
                         const divisorTributos = resultado?.divisor || 1;
                         const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                         const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                         
                         const applyCascata = (custo: any) => {
                           const cD = Number(custo) || 0;
                           const comAdm = cD * (1 + txAdm);
                           const comLucro = comAdm * (1 + txLucro);
                           return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                         };

                         const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                         const insumosSubtotal = applyCascata(
                           Number(proposta.insumos.materiais || 0) + 
                           Number(proposta.insumos.maquinas || 0) + 
                           Number(proposta.insumos.descartaveis || 0) + 
                           Number(proposta.insumos.servicos || 0)
                         );

                         const renderInsumoRow = (label: string, value: number) => {
                            const isZero = value === 0;
                            return (
                               <tr key={label} className={\`border-b border-slate-100 \${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}\`}>
                                  <td className="py-3 px-4 font-semibold">{label}</td>
                                  <td className={\`py-3 px-4 text-right font-black \${isZero ? 'text-slate-300' : 'text-slate-800'}\`}>
                                     {isZero ? '-' : fc(value)}
                                  </td>
                               </tr>
                            );
                         };

                         return (
                            <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                     </div>
                                     <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                     <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                        <table className="w-full text-left border-collapse text-[10px]">
                                           <thead>
                                              <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                 <th className="py-3.5 px-4">Grupo de Custo</th>
                                                 <th className="py-3.5 px-4 text-right">Valor Mensal</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                 <td className="py-3.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                 <td className="py-3.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                              </tr>
                                              {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos.materiais || 0) + Number(proposta.insumos.maquinas || 0)))}
                                              {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos.descartaveis || 0)))}
                                              {renderInsumoRow('Outros Serviços / Operações', applyCascata(Number(proposta.insumos.servicos || 0)))}
                                           </tbody>
                                        </table>
                                        
                                        <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-between items-center mt-auto">
                                           <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Valor Total Mensal Proposto</span>
                                           <span className="text-lg font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1.5 rounded-xl shadow-xs">
                                              {fc((resultado?.totalGeral || 0) + insumosSubtotal)}
                                           </span>
                                        </div>
                                     </div>

                                     <div className="col-span-5 flex flex-col justify-center">
                                        <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                           <div className="flex items-center gap-2 border-b border-slate-255 pb-2">
                                              <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                              <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                           </div>
                                           <div className="space-y-3.5">
                                              <div className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                              </div>
                                              <div className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Faturamento mensal com vencimento a ser pactuado nas condições gerais da contratação, emitido após a prestação dos serviços.</p>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}

                      {/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                               </div>
                               <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-2 gap-8">
                               <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                     <Calendar size={18} className="text-[#1e4480]" />
                                     <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Prazos e Validade</h4>
                                  </div>
                                  <div className="space-y-3">
                                     <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                        <span className="text-slate-500 font-bold">Validade da Proposta:</span>
                                        <span className="text-slate-800 font-black">{proposta.condicoes?.validadeProposta || "15 (quinze) dias"}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                        <span className="text-slate-500 font-bold">Prazo de Início dos Serviços:</span>
                                        <span className="text-slate-800 font-black">{proposta.condicoes?.prazoInicio || "20 (vinte) dias"}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px] pb-1">
                                        <span className="text-slate-500 font-bold">Vigência Contratual Mínima:</span>
                                        <span className="text-slate-800 font-black">{proposta.condicoes?.vigenciaContratual || "12 (doze) meses"}</span>
                                     </div>
                                  </div>
                               </div>

                               <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                     <CreditCard size={18} className="text-[#1e4480]" />
                                     <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Faturamento e Reajuste</h4>
                                  </div>
                                  <div className="space-y-3">
                                     <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                        <span className="text-slate-500 font-bold">Prazo de Pagamento:</span>
                                        <span className="text-slate-800 font-black">{proposta.condicoes?.prazoPagamento || "30 dias líquido"}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                        <span className="text-slate-500 font-bold">Base de Reajuste Anual:</span>
                                        <span className="text-slate-800 font-black">{proposta.condicoes?.baseReajuste || "Convenção Coletiva (CCT) / IPCA"}</span>
                                     </div>
                                     <div className="flex justify-between items-center text-[10px] pb-1">
                                        <span className="text-slate-500 font-bold">Garantias e Seguros:</span>
                                        <span className="text-[#1b4d3e] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">Inclusos e Ativos</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 13 PRINT - ACEITE */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                               <div className="flex flex-col">
                                  <span className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-white uppercase tracking-tight">TERMO DE ACEITE E CONTRATAÇÃO</h2>
                               </div>
                               <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain brightness-0 invert" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                               <div className="col-span-6 space-y-4">
                                  <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                  <div className="text-white/80 text-[10px] leading-relaxed space-y-3 font-semibold text-justify">
                                     <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                     <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                  </div>
                               </div>

                               <div className="col-span-6 grid grid-cols-2 gap-4">
                                  <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                        <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente.cliente || "Erasto Gaertner"}</span>
                                     </div>
                                     <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                        <div className="h-6 w-full mb-1"></div>
                                        <span className="text-[9px] font-black text-white">Assinatura / Carimbo</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">Representante Legal</span>
                                     </div>
                                  </div>

                                  <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATADA</span>
                                        <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">JVS Serv. Terceirizados Ltda.</span>
                                     </div>
                                     <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                        <div className="h-6 w-full mb-1 flex items-center justify-center">
                                           <span className="text-[8px] text-emerald-300 font-extrabold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/35 uppercase select-none">Assinado Digitalmente</span>
                                        </div>
                                        <span className="text-[9px] font-black text-white">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">13</span>
                            </div>
                         </div>
                      </div>

                   </div>
`;
content = content.substring(0, idx09Print) + pdfComercialCode + content.substring(idx13PrintEnd);

// ========================================================
// SUBST. 3: Bloco Institucional do PDF (Slides 03 a 06 PDF)
// De: idx03Print até idx07Print
// ========================================================
console.log("Substituindo Bloco Institucional do PDF (Slides 03-06)...");
const pdfInstitucionalCode = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                         </svg>

                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                               <div>
                                  <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                     QUEM SOMOS
                                  </h2>
                                  <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                     Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                  </p>
                               </div>

                               <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Award size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Anos de atuação em Facilities
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <MapPin size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">100</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        postos ativos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Users size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Clientes atendidos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <ShieldCheck size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+100.000m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de limpeza em altura
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Sparkles size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+500.000m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de Pisos tratados
                                     </span>
                                  </div>
                               </div>
                            </div>

                            <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                               <div className="w-full max-w-[300px] aspect-square drop-shadow-lg">
                                  <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                               </div>
                               <div className="text-[13px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1.5 rounded-full shadow-sm">
                                  Atendimento em toda Região Sul
                               </div>
                            </div>
                         </div>

                         <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                         </div>
                      </div>

                      {/* SLIDE 04 PRINT - NOSSOS VALORES */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                               <div>
                                  <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                     NOSSOS VALORES
                                  </h2>
                                  <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify">
                                     Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
                                  </p>
                               </div>
                            </div>

                            <div className="col-span-5 h-full w-full flex items-center justify-center relative">
                               <div 
                                  className="absolute right-0 bottom-0 w-[320px] h-[180px] bg-contain bg-right-bottom bg-no-repeat pointer-events-none opacity-90 z-10"
                                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=800')" }}
                               ></div>

                               <div className="relative w-full h-[220px] z-20">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Trophy size={36} className="text-white shrink-0" />
                                  </div>

                                  <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Lightbulb size={36} className="text-white shrink-0" />
                                  </div>

                                  <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Users size={36} className="text-white shrink-0" />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                         </div>
                      </div>

                      {/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                            <div>
                               <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-6">
                                  PRINCIPAIS SERVIÇOS PRESTADOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight max-w-[300px]">
                                           TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                              <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                              <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organização de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um space eficiente, seguro e bem cuidado.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight">
                                           LIMPEZA EM ALTURA
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                              <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                              <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                              <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                              <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     LIMPEZA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     PORTARIA
                                  </span>
                                </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     RECEPÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     MANUTENÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     JARDINAGEM
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                         </div>
                      </div>

                      {/* SLIDE 06 PRINT - SETORES ATENDIDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-white">
                            <div>
                               <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">
                                  SETORES ATENDIDOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              INDÚSTRIA
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Factory size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Com processos minuciosos e detalhados, o setor industrial trouxe para o escopo da JVS Facilities a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da indústria.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3 pl-2">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              VAREJO
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Store size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Um dos setores com maior participação em nossa carteira de clientes, o varejo exigeu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram em constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-white/20 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Bus size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     TRANSPORTE<br />E LOGÍSTICA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Building size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[110px] leading-tight">
                                     CONDOMÍNIOS<br />E EDIFÍCIOS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Hospital size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     CLÍNICAS E<br />HOSPITAIS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <ShoppingBag size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     SHOPPING<br />CENTERS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <GraduationCap size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[120px] leading-tight">
                                     ESTABELECIMENTOS<br />EDUCACIONAIS
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                         </div>
                      </div>

                      {/* `;
content = content.substring(0, idx03Print) + pdfInstitucionalCode + content.substring(idx07Print);

// ========================================================
// SUBST. 2: Bloco Comercial da TELA (Slides 09 a 13 TELA)
// De: idx09Screen até idxComercialScreenEnd
// ========================================================
console.log("Substituindo Bloco Comercial da TELA (Slides 09-13)...");
const screenComercialCode = `
                         {currentSlide === 9 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="flex flex-col justify-between h-full relative z-10 w-full">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                                     </div>
                                     <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                     <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                        <div className="bg-[#1e4480] text-center py-3">
                                           <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                        </div>
                                        <div className="flex-1">
                                           <table className="w-full text-left border-collapse">
                                              <thead>
                                                 <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                    <th className="px-5 py-3">Função</th>
                                                    <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                                    <th className="px-5 py-3 text-center w-28">Escala</th>
                                                    <th className="px-5 py-3 text-center w-36">Horário</th>
                                                 </tr>
                                              </thead>
                                              <tbody>
                                                 {proposta.equipe && proposta.equipe.length > 0 ? (
                                                    proposta.equipe.map((p: any, idx: number) => (
                                                       <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                                          <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                          <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                          <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                          <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                             {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                                ? \`\${p.parametrosPosto.horarioInicio} às \${p.parametrosPosto.horarioFim}\` 
                                                                : '08:00 às 17:00'}
                                                          </td>
                                                       </tr>
                                                    ))
                                                 ) : (
                                                    <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                       <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">Nenhum posto de trabalho inserido.</td>
                                                    </tr>
                                                 )}
                                              </tbody>
                                           </table>
                                        </div>
                                     </div>

                                     <div className="col-span-4 flex flex-col justify-center">
                                        <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                           <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                              <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                              <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                           </div>
                                           <div className="space-y-3">
                                              {(() => {
                                                 const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                                    proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                                    proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                                    proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                                 ];
                                                 return clausulas.map((c: string, cIdx: number) => (
                                                    <div key={cIdx} className="flex items-start gap-2.5">
                                                       <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                       </svg>
                                                       <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">{c}</p>
                                                    </div>
                                                 ));
                                              })()}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 10 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUSÍDOS</h2>
                                     </div>
                                     <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto">
                                     <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                           <thead>
                                              <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                 <th className="px-6 py-3.5 w-32">Item</th>
                                                 <th className="px-6 py-3.5">Descrição</th>
                                                 <th className="px-6 py-3.5 text-center w-40">Status</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                                    <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                                    <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                                    <td className="px-6 py-3.5 text-center">
                                                       {p.incluso ? (
                                                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                             <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                             </svg>
                                                          </div>
                                                       ) : (
                                                          <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                             <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                             </svg>
                                                          </div>
                                                       )}
                                                    </td>
                                                 </tr>
                                              ))}
                                           </tbody>
                                        </table>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 11 && (() => {
                            const fc = formatCurrency;
                            const divisorTributos = resultado?.divisor || 1;
                            const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                            const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                            
                            const applyCascata = (custo: any) => {
                              const cD = Number(custo) || 0;
                              const comAdm = cD * (1 + txAdm);
                              const comLucro = comAdm * (1 + txLucro);
                              return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                            };

                            const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                            const insumosSubtotal = applyCascata(
                              Number(proposta.insumos.materiais || 0) + 
                              Number(proposta.insumos.maquinas || 0) + 
                              Number(proposta.insumos.descartaveis || 0) + 
                              Number(proposta.insumos.servicos || 0)
                            );

                            const renderInsumoRow = (label: string, value: number) => {
                               const isZero = value === 0;
                               return (
                                  <tr key={label} className={\`border-b border-slate-100 \${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}\`}>
                                     <td className="py-3 px-4 font-semibold">{label}</td>
                                     <td className={\`py-3 px-4 text-right font-black \${isZero ? 'text-slate-300' : 'text-slate-800'}\`}>
                                        {isZero ? '-' : fc(value)}
                                     </td>
                                  </tr>
                               );
                            };

                            return (
                               <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                     <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                     <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                  </svg>

                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                     <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                        <div className="flex flex-col">
                                           <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                           <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                        </div>
                                        <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                                     </div>

                                     <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                        <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                           <table className="w-full text-left border-collapse text-[10px]">
                                              <thead>
                                                 <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                    <th className="py-3.5 px-4">Grupo de Custo</th>
                                                    <th className="py-3.5 px-4 text-right">Valor Mensal</th>
                                                 </tr>
                                              </thead>
                                              <tbody>
                                                 <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                    <td className="py-3.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                    <td className="py-3.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                                 </tr>
                                                 {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos.materiais || 0) + Number(proposta.insumos.maquinas || 0)))}
                                                 {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos.descartaveis || 0)))}
                                                 {renderInsumoRow('Outros Serviços / Operações', applyCascata(Number(proposta.insumos.servicos || 0)))}
                                              </tbody>
                                           </table>
                                           
                                           <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-between items-center mt-auto">
                                              <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Valor Total Mensal Proposto</span>
                                              <span className="text-lg font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1.5 rounded-xl shadow-xs">
                                                 {fc((resultado?.totalGeral || 0) + insumosSubtotal)}
                                              </span>
                                           </div>
                                        </div>

                                        <div className="col-span-5 flex flex-col justify-center">
                                           <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                              <div className="flex items-center gap-2 border-b border-slate-255 pb-2">
                                                 <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                                 <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                              </div>
                                              <div className="space-y-3.5">
                                                 <div className="flex items-start gap-2.5">
                                                    <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                                 </div>
                                                 <div className="flex items-start gap-2.5">
                                                    <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Faturamento mensal com vencimento a ser pactuado nas condições gerais da contratação, emitido após a prestação dos serviços.</p>
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                     </div>
                                  </div>
                               </div>
                            );
                         })()}

                         {currentSlide === 12 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                                     </div>
                                     <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-2 gap-8">
                                     <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                           <Calendar size={18} className="text-[#1e4480]" />
                                           <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Prazos e Validade</h4>
                                        </div>
                                        <div className="space-y-3">
                                           <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                              <span className="text-slate-500 font-bold">Validade da Proposta:</span>
                                              <span className="text-slate-800 font-black">{proposta.condicoes?.validadeProposta || "15 (quinze) dias"}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                              <span className="text-slate-500 font-bold">Prazo de Início dos Serviços:</span>
                                              <span className="text-slate-800 font-black">{proposta.condicoes?.prazoInicio || "20 (vinte) dias"}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-[10px] pb-1">
                                              <span className="text-slate-500 font-bold">Vigência Contratual Mínima:</span>
                                              <span className="text-slate-800 font-black">{proposta.condicoes?.vigenciaContratual || "12 (doze) meses"}</span>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                           <CreditCard size={18} className="text-[#1e4480]" />
                                           <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Faturamento e Reajuste</h4>
                                        </div>
                                        <div className="space-y-3">
                                           <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                              <span className="text-slate-500 font-bold">Prazo de Pagamento:</span>
                                              <span className="text-slate-800 font-black">{proposta.condicoes?.prazoPagamento || "30 dias líquido"}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-2">
                                              <span className="text-slate-500 font-bold">Base de Reajuste Anual:</span>
                                              <span className="text-slate-800 font-black">{proposta.condicoes?.baseReajuste || "Convenção Coletiva (CCT) / IPCA"}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-[10px] pb-1">
                                              <span className="text-slate-500 font-bold">Garantias e Seguros:</span>
                                              <span className="text-[#1b4d3e] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">Inclusos e Ativos</span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 13 && (
                            <div className="w-full h-full bg-[#1e4480] p-12 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                                     <div className="flex flex-col">
                                        <span className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">TERMO DE ACEITE E CONTRATAÇÃO</h2>
                                     </div>
                                     <img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain brightness-0 invert" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                                     <div className="col-span-6 space-y-4">
                                        <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                        <div className="text-white/80 text-[10px] leading-relaxed space-y-3 font-semibold text-justify">
                                           <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                           <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                        </div>
                                     </div>

                                     <div className="col-span-6 grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                           <div className="flex flex-col">
                                              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                              <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente.cliente || "Erasto Gaertner"}</span>
                                           </div>
                                           <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                              <div className="h-6 w-full mb-1"></div>
                                              <span className="text-[9px] font-black text-white">Assinatura / Carimbo</span>
                                              <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">Representante Legal</span>
                                           </div>
                                        </div>

                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                           <div className="flex flex-col">
                                              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATADA</span>
                                              <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">JVS Serv. Terceirizados Ltda.</span>
                                           </div>
                                           <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                              <div className="h-6 w-full mb-1 flex items-center justify-center">
                                                 <span className="text-[8px] text-emerald-300 font-extrabold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/35 uppercase select-none">Assinado Digitalmente</span>
                                              </div>
                                              <span className="text-[9px] font-black text-white">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                              <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">13</span>
                                  </div>
                               </div>
                            </div>
                         )}
`;
content = content.substring(0, idx09Screen) + screenComercialCode + content.substring(idxComercialScreenEnd);

// ========================================================
// SUBST. 1: Bloco Institucional da TELA (Slides 03 a 06 TELA)
// De: idx03Screen até idx07Screen
// ========================================================
console.log("Substituindo Bloco Institucional da TELA (Slides 03-06)...");
const screenInstitucionalCode = `
                         {currentSlide === 3 && (
                            <div className="w-full h-full bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                                  <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                                  
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                                  <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                               </svg>

                               <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                  <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                                     <div>
                                        <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                           QUEM SOMOS
                                        </h2>
                                        <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                           Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                        </p>
                                     </div>

                                     <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Award size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              Anos de atuação em Facilities
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <MapPin size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">100</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              postos ativos
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Users size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              Clientes atendidos
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <ShieldCheck size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+100.000m²</span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              de limpeza em altura
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Sparkles size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+500.000m²</span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              de Pisos tratados
                                           </span>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                                     <div className="w-full max-w-[300px] aspect-square drop-shadow-lg">
                                        <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                                     </div>
                                     <div className="text-[13px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1.5 rounded-full shadow-sm">
                                        Atendimento em toda Região Sul
                                     </div>
                                  </div>
                               </div>

                               <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                  <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 4 && (
                            <div className="w-full h-full bg-white p-16 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                  <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                  <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                  
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                  <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                  <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                               </svg>
                               
                               <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                  <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                                     <div>
                                        <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                           NOSSOS VALORES
                                        </h2>
                                        <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify">
                                           Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
                                        </p>
                                     </div>
                                  </div>

                                  <div className="col-span-5 h-full w-full flex items-center justify-center relative">
                                     <div 
                                        className="absolute right-0 bottom-0 w-[320px] h-[180px] bg-contain bg-right-bottom bg-no-repeat pointer-events-none opacity-90 z-10"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=800')" }}
                                     ></div>

                                     <div className="relative w-full h-[220px] z-20">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                           <Trophy size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                           <Lightbulb size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                           <Users size={36} className="text-white shrink-0" />
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 5 && (
                            <div className="w-full h-full bg-white p-16 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                                  <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                                  <line x1="-100" y1="250" x2="550" y2="-400" stroke="#F1F5F9" strokeWidth="3" />
                                  
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                               </svg>
                               
                               <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                                  <div>
                                     <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-6">
                                        PRINCIPAIS SERVIÇOS PRESTADOS
                                     </h2>

                                     <div className="grid grid-cols-2 gap-12 mt-2">
                                        <div className="flex flex-col space-y-3">
                                           <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                              <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight max-w-[300px]">
                                                 TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                              </span>
                                              <div className="text-[#1e4480] shrink-0">
                                                 <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                                    <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                                    <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                                    <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                                    <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                                    <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                                    <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                                 </svg>
                                              </div>
                                           </div>
                                           <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organization de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um space eficiente, seguro e bem cuidado.
                                           </p>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                           <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                              <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight">
                                                 LIMPEZA EM ALTURA
                                              </span>
                                              <div className="text-[#1e4480] shrink-0">
                                                 <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                                    <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                                    <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                                    <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                                    <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                                    <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                                 </svg>
                                              </div>
                                           </div>
                                           <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                                           </p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="16" r="6" fill="currentColor" />
                                              <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           LIMPEZA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="25" r="6" fill="currentColor" />
                                              <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           PORTARIA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                              <circle cx="22" cy="22" r="5" fill="currentColor" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           RECEPÇÃO
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="28" cy="18" r="6" fill="currentColor" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           MANUTENÇÃO
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="26" r="5" fill="currentColor" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           JARDINAGEM
                                        </span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 6 && (
                            <div className="w-full h-full bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                               </svg>
                               
                               <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-white">
                                  <div>
                                     <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">
                                        SETORES ATENDIDOS
                                     </h2>

                                     <div className="grid grid-cols-2 gap-12 mt-2">
                                        <div className="flex flex-col space-y-3">
                                           <div className="flex flex-col border-b border-white/20 pb-2">
                                              <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                              <div className="flex items-center justify-between gap-4">
                                                 <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                                    INDÚSTRIA
                                                 </span>
                                                 <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                                    <Factory size={22} className="stroke-[2.5]" />
                                                 </div>
                                              </div>
                                           </div>
                                           <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Com processos minuciosos e detalhados, o setor industrial trouxe para o escopo da JVS Facilities a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da indústria.
                                           </p>
                                        </div>

                                        <div className="flex flex-col space-y-3 pl-2">
                                           <div className="flex flex-col border-b border-white/20 pb-2">
                                              <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                              <div className="flex items-center justify-between gap-4">
                                                 <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                                    VAREJO
                                                 </span>
                                                 <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                                    <Store size={22} className="stroke-[2.5]" />
                                                 </div>
                                              </div>
                                           </div>
                                           <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Um dos setores com maior participação em nossa carteira de clientes, o varejo exigiu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram em constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                                           </p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-white/20 relative z-20">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Bus size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           TRANSPORTE<br />E LOGÍSTICA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Building size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[110px] leading-tight">
                                           CONDOMÍNIOS<br />E EDIFÍCIOS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Hospital size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           CLÍNICAS E<br />HOSPITAIS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <ShoppingBag size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           SHOPPING<br />CENTERS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <GraduationCap size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[120px] leading-tight">
                                           ESTABELECIMENTOS<br />EDUCACIONAIS
                                        </span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                  <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                               </div>
                            </div>
                         )}
`;
content = content.substring(0, idx03Screen) + screenInstitucionalCode + content.substring(idx07Screen);

console.log("📝 Gravando as alterações consolidadas no arquivo page.tsx...");
fs.writeFileSync(pagePath, content, 'utf8');

console.log("✔ Sincronização magnífica de TELA e PDF executada de trás para frente com absoluto sucesso!");
