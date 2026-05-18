const fs = require('fs');

const pagePath = 'app/propostas/nova/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

console.log("Applying Slide 09 State Mappings and Slide 10 Resumo mappings to page.tsx...");

// Normalize to Unix LF for reliable matching
pageContent = pageContent.replace(/\r\n/g, '\n');

// 1. Initial State for Slide 09
const stateTarget = `      detalheMateriais: [],
      detalheMaquinas: [],
      detalheDescartaveis: []
    }
  });`;

const stateReplacement = `      detalheMateriais: [],
      detalheMaquinas: [],
      detalheDescartaveis: []
    },
    itensInclusosExcluidos: [
      { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
      { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
      { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
      { id: '4', descricao: 'Produtos químicos', incluso: false },
      { id: '5', descricao: 'Descartaveis', incluso: false }
    ]
  });`;

if (pageContent.includes(stateTarget)) {
   pageContent = pageContent.replace(stateTarget, stateReplacement);
   console.log("✔ Initial State updated!");
} else {
   console.error("❌ Initial State target not found!");
}

// 2. handleVersionChange for Slide 09
const versionTarget = `            quadroEfetivoClausula3: fullData.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
          },
          dreTaxPercent: (fullData as any).dreTaxPercent,
          dreEncargos: (fullData as any).dreEncargos,
        });`;

const versionReplacement = `            quadroEfetivoClausula3: fullData.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
          },
          dreTaxPercent: (fullData as any).dreTaxPercent,
          dreEncargos: (fullData as any).dreEncargos,
          itensInclusosExcluidos: (fullData as any).itensInclusosExcluidos || [
            { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
            { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
            { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
            { id: '4', descricao: 'Produtos químicos', incluso: false },
            { id: '5', descricao: 'Descartaveis', incluso: false }
          ],
        });`;

if (pageContent.includes(versionTarget)) {
   pageContent = pageContent.replace(versionTarget, versionReplacement);
   console.log("✔ handleVersionChange updated!");
} else {
   console.error("❌ handleVersionChange target not found!");
}

// 3. load for Slide 09
const loadTarget = `               versao: fullData.versao,
               insumos: (fullData as any).insumos || { materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0, servicosDescricao: '' },
               dreTaxPercent: (fullData as any).dreTaxPercent,
               dreEncargos: (fullData as any).dreEncargos
            });`;

const loadReplacement = `               versao: fullData.versao,
               insumos: (fullData as any).insumos || { materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0, servicosDescricao: '' },
               itensInclusosExcluidos: (fullData as any).itensInclusosExcluidos || [
                  { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
                  { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
                  { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
                  { id: '4', descricao: 'Produtos químicos', incluso: false },
                  { id: '5', descricao: 'Descartaveis', incluso: false }
               ],
               dreTaxPercent: (fullData as any).dreTaxPercent,
               dreEncargos: (fullData as any).dreEncargos
            });`;

if (pageContent.includes(loadTarget)) {
   pageContent = pageContent.replace(loadTarget, loadReplacement);
   console.log("✔ load function updated!");
} else {
   console.error("❌ load function target not found!");
}

// 4. Slide 10 button array
const arrayTarget = `                                { id: 8, label: 'Slide 08 (Quadro Efetivo)' },
                                { id: 9, label: 'Slide 09 (Inclusos/Excluídos)' }
                             ].map((slide) => (`;

const arrayReplacement = `                                { id: 8, label: 'Slide 08 (Quadro Efetivo)' },
                                { id: 9, label: 'Slide 09 (Inclusos/Excluídos)' },
                                { id: 10, label: 'Slide 10 (Resumo Geral)' }
                             ].map((slide) => (`;

if (pageContent.includes(arrayTarget)) {
   pageContent = pageContent.replace(arrayTarget, arrayReplacement);
   console.log("✔ Top slide button array updated!");
} else {
   console.error("❌ Top slide button array target not found!");
}

// 5. Slide 10 Visualizer
const visualizerTarget = `                                {/* Footer */}
                                <div className="flex justify-between items-end w-full text-slate-400 text-[10px] font-extrabold uppercase tracking-wider pr-28">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                   <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                                </div>
                             </div>
                          )}`;

const visualizerReplacement = `                                {/* Footer */}
                                <div className="flex justify-between items-end w-full text-slate-400 text-[10px] font-extrabold uppercase tracking-wider pr-28">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                   <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                                </div>
                             </div>
                          )}

                          {currentSlide === 10 && (() => {
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

                             return (
                                <div className="w-full aspect-[16/9] border border-slate-200 bg-white p-12 flex flex-col justify-between relative overflow-hidden h-full text-slate-800 select-none">
                                   {/* Top Header */}
                                   <div className="flex justify-between items-center w-full pb-3 border-b border-slate-100">
                                      <div className="flex flex-col">
                                         <span className="text-[#1e4480] text-[9px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                         <h2 className="text-lg font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                      </div>
                                      <img 
                                         src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                         alt="JVS Facilities Logo" 
                                         className="max-h-8 w-auto object-contain"
                                      />
                                   </div>

                                   {/* Main Split Grid */}
                                   <div className="my-auto grid grid-cols-2 gap-6 w-full max-w-5xl mx-auto items-stretch">
                                      {/* Left Column: Mão de Obra */}
                                      <div className="bg-slate-50/50 rounded-xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                                         <div>
                                            <div className="flex items-center gap-2 mb-3">
                                               <div className="w-2.5 h-2.5 rounded-full bg-[#1e4480]"></div>
                                               <h3 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">1) Mão de Obra — Efetivo</h3>
                                            </div>
                                            <div className="overflow-y-auto max-h-[140px] pr-1">
                                               <table className="w-full text-left text-[9px]">
                                                  <thead>
                                                     <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                                                        <th className="py-1">Função</th>
                                                        <th className="py-1 text-center w-12">Qtd.</th>
                                                        <th className="py-1 text-right w-24">Venda Total</th>
                                                     </tr>
                                                  </thead>
                                                  <tbody>
                                                     {proposta.equipe.length === 0 ? (
                                                        <tr>
                                                           <td colSpan={3} className="py-4 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                        </tr>
                                                     ) : (
                                                        proposta.equipe.map((p: any, idx: number) => {
                                                           const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                           const precoVendaItem = itemRes?.precoVenda || 0;
                                                           return (
                                                              <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                                 <td className="py-1.5 font-bold">{p.nomeCargo}</td>
                                                                 <td className="py-1.5 text-center font-black text-slate-600">{p.quantidade}</td>
                                                                 <td className="py-1.5 text-right font-bold text-slate-800">{fc(precoVendaItem)}</td>
                                                               </tr>
                                                           );
                                                        })
                                                     )}
                                                  </tbody>
                                               </table>
                                            </div>
                                         </div>
                                         <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-[10px]">
                                            <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Mão de Obra</span>
                                            <span className="font-black text-[#1e4480] text-xs">{fc(maoDeObraSubtotal)}</span>
                                         </div>
                                      </div>

                                      {/* Right Column: Insumos & Total Geral */}
                                      <div className="flex flex-col justify-between gap-4">
                                         {/* Insumos Table */}
                                         <div className="bg-slate-50/50 rounded-xl border border-slate-150 p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                               <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                                               <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">2) Materiais, Equipamentos e Serviços</h3>
                                            </div>
                                            <table className="w-full text-left text-[9px]">
                                               <tbody>
                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">Materiais e Produtos de Limpeza</td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.materiais))}</td>
                                                  </tr>
                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">Máquinas e Equipamentos</td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.maquinas))}</td>
                                                  </tr>
                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">Descartáveis</td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.descartaveis))}</td>
                                                  </tr>
                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">Serviços e Outros</td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                  </tr>
                                               </tbody>
                                            </table>
                                            <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center text-[10px]">
                                               <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Insumos</span>
                                               <span className="font-black text-slate-700 text-xs">{fc(insumosSubtotal)}</span>
                                            </div>
                                         </div>

                                         {/* Total Card */}
                                         <div className="bg-gradient-to-r from-[#1B4D3E] to-[#12382d] rounded-xl p-4 text-white flex justify-between items-center shadow-md relative overflow-hidden">
                                            <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-white/5 rounded-full"></div>
                                            <div>
                                               <h4 className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">VALOR FINAL DA VENDA</h4>
                                               <p className="text-[11px] font-extrabold text-white tracking-tight uppercase">TOTAL GERAL DA PROPOSTA</p>
                                            </div>
                                            <div className="text-2xl font-black text-emerald-400 tracking-tight z-10">
                                               {fc(resultado?.faturamentoBruto || 0)}
                                            </div>
                                         </div>
                                      </div>
                                   </div>

                                   {/* Footer */}
                                   <div className="flex justify-between items-end w-full text-slate-400 text-[10px] font-extrabold uppercase tracking-wider pr-28">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                                   </div>
                                </div>
                             );
                          })()}`;

if (pageContent.includes(visualizerTarget)) {
   pageContent = pageContent.replace(visualizerTarget, visualizerReplacement);
   console.log("✔ Slide 10 Visualizer added!");
} else {
   console.error("❌ Slide 10 Visualizer target not found!");
}

// 6. Navigation Controls bounds
const bounds1Target = `onClick={() => setCurrentSlide(currentSlide === 1 ? 9 : currentSlide - 1)}`;
const bounds1Replacement = `onClick={() => setCurrentSlide(currentSlide === 1 ? 10 : currentSlide - 1)}`;
if (pageContent.includes(bounds1Target)) {
   pageContent = pageContent.replace(bounds1Target, bounds1Replacement);
   console.log("✔ Prev Slide navigation bounds updated!");
} else {
   console.error("❌ Prev Slide navigation bounds target not found!");
}

const bounds2Target = `{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (`;
const bounds2Replacement = `{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (`;
if (pageContent.includes(bounds2Target)) {
   pageContent = pageContent.replace(bounds2Target, bounds2Replacement);
   console.log("✔ Slide number pagination list updated!");
} else {
   console.error("❌ Slide number pagination list target not found!");
}

const bounds3Target = `onClick={() => setCurrentSlide(currentSlide === 9 ? 1 : currentSlide + 1)}`;
const bounds3Replacement = `onClick={() => setCurrentSlide(currentSlide === 10 ? 1 : currentSlide + 1)}`;
if (pageContent.includes(bounds3Target)) {
   pageContent = pageContent.replace(bounds3Target, bounds3Replacement);
   console.log("✔ Next Slide navigation bounds updated!");
} else {
   console.error("❌ Next Slide navigation bounds target not found!");
}

const bounds4Target = `Visualizando Slide {currentSlide} de 9`;
const bounds4Replacement = `Visualizando Slide {currentSlide} de 10`;
if (pageContent.includes(bounds4Target)) {
   pageContent = pageContent.replace(bounds4Target, bounds4Replacement);
   console.log("✔ Visualizer slide counter text updated!");
} else {
   console.error("❌ Visualizer slide counter text target not found!");
}

// 7. Slide 10 Editor Form Card
const formCardTarget = `                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      </div>
                     )}`;

const formCardReplacement = `                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      </div>
                     )}

                     {currentSlide === 10 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1B4D3E] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               📋 Resumo Comercial da Proposta (Slide 10)
                            </h3>
                         </div>
                         <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-3">
                            <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                               <p className="font-bold mb-1">Cálculo Automático de Valores</p>
                               <p className="leading-relaxed">
                                  Os valores e quantitativos exibidos no Slide 10 são compilados e consolidados em tempo real com base no Quadro de Equipe (Mão de Obra) e nos Insumos (Materiais, Máquinas, Descartáveis, Serviços).
                               </p>
                               <p className="mt-2 font-black">
                                  Para modificar qualquer preço de venda ou quantidade, ajuste as respectivas abas do editor à esquerda.
                               </p>
                            </div>
                         </div>
                      </div>
                     )}`;

if (pageContent.includes(formCardTarget)) {
   pageContent = pageContent.replace(formCardTarget, formCardReplacement);
   console.log("✔ Slide 10 Editor Card added!");
} else {
   console.error("❌ Slide 10 Editor Card target not found!");
}

// 8. Slide 10 Print View
const printTarget = `                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>`;

const printReplacement = `                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 10 PRINT - RESUMO DA PROPOSTA */}
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

                        return (
                           <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                              <div className="relative z-10 flex flex-col h-full justify-between">
                                 {/* Top Header */}
                                 <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                    <div className="flex flex-col">
                                       <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                       <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                    </div>
                                    <img 
                                       src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                       alt="JVS Facilities Logo" 
                                       className="max-h-10 w-auto object-contain"
                                    />
                                 </div>

                                 {/* Main Split Grid */}
                                 <div className="my-auto grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto items-stretch">
                                    {/* Left Column: Mão de Obra */}
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-150 p-6 flex flex-col justify-between shadow-sm">
                                       <div>
                                          <div className="flex items-center gap-2 mb-4">
                                             <div className="w-2.5 h-2.5 rounded-full bg-[#1e4480]"></div>
                                             <h3 className="text-xs font-black text-[#1e4480] uppercase tracking-wider">1) Mão de Obra — Efetivo</h3>
                                          </div>
                                          <div className="overflow-y-auto max-h-[160px] pr-1">
                                             <table className="w-full text-left text-[10px]">
                                                <thead>
                                                   <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                                                      <th className="py-1">Função</th>
                                                      <th className="py-1 text-center w-12">Qtd.</th>
                                                      <th className="py-1 text-right w-24">Venda Total</th>
                                                   </tr>
                                                </thead>
                                                <tbody>
                                                   {proposta.equipe.length === 0 ? (
                                                      <tr>
                                                         <td colSpan={3} className="py-4 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                      </tr>
                                                   ) : (
                                                      proposta.equipe.map((p: any, idx: number) => {
                                                         const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                         const precoVendaItem = itemRes?.precoVenda || 0;
                                                         return (
                                                            <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                               <td className="py-2 font-bold">{p.nomeCargo}</td>
                                                               <td className="py-2 text-center font-black text-slate-600">{p.quantidade}</td>
                                                               <td className="py-2 text-right font-bold text-slate-800">{fc(precoVendaItem)}</td>
                                                            </tr>
                                                         );
                                                      })
                                                   )}
                                                </tbody>
                                             </table>
                                          </div>
                                       </div>
                                       <div className="border-t border-slate-200 pt-3 mt-4 flex justify-between items-center text-xs">
                                          <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Mão de Obra</span>
                                          <span className="font-black text-[#1e4480] text-sm">{fc(maoDeObraSubtotal)}</span>
                                       </div>
                                    </div>

                                    {/* Right Column: Insumos & Total Geral */}
                                    <div className="flex flex-col justify-between gap-6">
                                       {/* Insumos Table */}
                                       <div className="bg-slate-50/50 rounded-xl border border-slate-150 p-6 shadow-sm">
                                          <div className="flex items-center gap-2 mb-3">
                                             <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                                             <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">2) Materiais, Equipamentos e Serviços</h3>
                                          </div>
                                          <table className="w-full text-left text-[10px]">
                                             <tbody>
                                                <tr className="border-b border-slate-100 text-slate-700">
                                                   <td className="py-2 font-bold">Materiais e Produtos de Limpeza</td>
                                                   <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.materiais))}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100 text-slate-700">
                                                   <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.maquinas))}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100 text-slate-700">
                                                   <td className="py-2 font-bold">Descartáveis</td>
                                                   <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.descartaveis))}</td>
                                                </tr>
                                                <tr className="border-b border-slate-100 text-slate-700">
                                                   <td className="py-2 font-bold">Serviços e Outros</td>
                                                   <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                </tr>
                                             </tbody>
                                          </table>
                                          <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-xs">
                                             <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Insumos</span>
                                             <span className="font-black text-slate-700 text-sm">{fc(insumosSubtotal)}</span>
                                          </div>
                                       </div>

                                       {/* Total Card */}
                                       <div className="bg-gradient-to-r from-[#1B4D3E] to-[#12382d] rounded-xl p-6 text-white flex justify-between items-center shadow-md relative overflow-hidden">
                                          <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/5 rounded-full"></div>
                                          <div>
                                             <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">VALOR FINAL DA VENDA</h4>
                                             <p className="text-xs font-extrabold text-white tracking-tight uppercase">TOTAL GERAL DA PROPOSTA</p>
                                          </div>
                                          <div className="text-3xl font-black text-emerald-400 tracking-tight z-10">
                                             {fc(resultado?.faturamentoBruto || 0)}
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Footer */}
                                 <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                                 </div>
                              </div>
                           </div>
                        );
                      })()}`;

if (pageContent.includes(printTarget)) {
   pageContent = pageContent.replace(printTarget, printReplacement);
   console.log("✔ Slide 10 Print View added successfully!");
} else {
   console.error("❌ Slide 10 Print View target not found!");
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("✔ All fixes applied successfully!");
