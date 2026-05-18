const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log("📖 Lendo o arquivo page.tsx para a refatoração premium do PDF...");

// Âncoras globais para as substituições exatas
const s09StartStr = '{/* SLIDE 09 PRINT - QUADRO EFETIVO */}';
const s09EndStr = '{/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}';

const s10StartStr = '{/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}';
const s10EndStr = '{/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}';

const s11StartStr = '{/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}';
const s11EndStr = '{/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}';

const s12StartStr = '{/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}';
const s12EndStr = '{/* SLIDE 13 PRINT - ACEITE */}';

const s13StartStr = '{/* SLIDE 13 PRINT - ACEITE */}';

// ----------------------------------------------------
// 1. REFATORAÇÃO DO SLIDE 09 PRINT - QUADRO EFETIVO
// ----------------------------------------------------
const s09StartIdx = content.indexOf(s09StartStr);
const s09EndIdx = content.indexOf(s09EndStr);

if (s09StartIdx !== -1 && s09EndIdx !== -1) {
   console.log("✔ Slide 09 PRINT (Quadro Efetivo) localizado!");
   
   const newS09Content = s09StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo corporativos modernos */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                         </svg>

                         <div className="flex flex-col justify-between h-full relative z-10 w-full">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                               </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Conteúdo Principal */}
                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                               {/* Tabela de Quadro Efetivo */}
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
                                                 <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">
                                                    <div className="flex flex-col items-center justify-center space-y-1 py-4">
                                                       <p className="text-slate-400">Nenhum posto de trabalho inserido.</p>
                                                       <p className="text-[9px] text-slate-300">Por favor, adicione postos na aba 4 (Quadro Equipe).</p>
                                                    </div>
                                                 </td>
                                              </tr>
                                           )}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>

                               {/* Cláusulas Operacionais */}
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
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">
                                                    {c}
                                                 </p>
                                              </div>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Rodapé */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s09StartIdx) + newS09Content + content.substring(s09EndIdx);
   console.log("✔ Slide 09 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 2. REFATORAÇÃO DO SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS
// ----------------------------------------------------
const s10StartIdx = content.indexOf(s10StartStr);
const s10EndIdx = content.indexOf(s10EndStr);

if (s10StartIdx !== -1 && s10EndIdx !== -1) {
   console.log("✔ Slide 10 PRINT (Itens Inclusos/Excluídos) localizado!");

   const newS10Content = s10StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUÍDOS</h2>
                               </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Tabela de Itens */}
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

                            {/* Rodapé */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                            </div>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s10StartIdx) + newS10Content + content.substring(s10EndIdx);
   console.log("✔ Slide 10 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 3. REFATORAÇÃO DO SLIDE 11 PRINT - RESUMO DA PROPOSTA
// ----------------------------------------------------
const s11StartIdx = content.indexOf(s11StartStr);
const s11EndIdx = content.indexOf(s11EndStr);

if (s11StartIdx !== -1 && s11EndIdx !== -1) {
   console.log("✔ Slide 11 PRINT (Resumo Proposta) localizado!");

   const newS11Content = s11StartStr + `
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

                         // Função auxiliar para renderizar linhas de insumos com tratamento premium de valores zerados
                         const renderInsumoRow = (label: string, value: number) => {
                            const isZero = value === 0;
                            return (
                               <tr className={\`border-b border-slate-100 \${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}\`}>
                                  <td className="py-3 px-4 font-semibold">{label}</td>
                                  <td className={\`py-3 px-4 text-right font-black \${isZero ? 'text-slate-300' : 'text-slate-800'}\`}>
                                     {isZero ? '-' : fc(value)}
                                  </td>
                               </tr>
                            );
                         };

                         return (
                            <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                               {/* Stripes de fundo */}
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

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

                                  {/* Grid Central Simétrico */}
                                  <div className="my-auto grid grid-cols-2 gap-10 w-full max-w-5xl mx-auto items-stretch">
                                     {/* Coluna Esquerda: Mão de Obra */}
                                     <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-lg">
                                        <div>
                                           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                              <div className="w-2.5 h-2.5 rounded-full bg-[#1e4480]"></div>
                                              <h3 className="text-xs font-black text-[#1e4480] uppercase tracking-wider">1) Mão de Obra — Efetivo</h3>
                                           </div>
                                           <div className="pr-1">
                                              <table className="w-full text-left text-[10px] border-collapse">
                                                 <thead>
                                                    <tr className="border-b border-slate-200 text-[#1e4480] font-black uppercase tracking-wider text-[9px] bg-slate-50/50">
                                                       <th className="py-2 px-3">Função</th>
                                                       <th className="py-2 px-3 text-center w-14">Qtd.</th>
                                                       <th className="py-2 px-3 text-right w-24">Unitário</th>
                                                       <th className="py-2 px-3 text-right w-28">Total</th>
                                                    </tr>
                                                 </thead>
                                                 <tbody>
                                                    {proposta.equipe.length === 0 ? (
                                                       <tr>
                                                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                       </tr>
                                                    ) : (
                                                       proposta.equipe.map((p: any, idx: number) => {
                                                          const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                          const precoVendaItem = itemRes?.precoVenda || 0;
                                                          const precoUnitario = p.quantidade > 0 ? precoVendaItem / p.quantidade : 0;
                                                          return (
                                                             <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                                <td className="py-3 px-3 font-bold">{p.nomeCargo}</td>
                                                                <td className="py-3 px-3 text-center font-black text-[#1e4480]">{p.quantidade}</td>
                                                                <td className="py-3 px-3 text-right text-slate-500 font-semibold">{fc(precoUnitario)}</td>
                                                                <td className="py-3 px-3 text-right font-black text-slate-800">{fc(precoVendaItem)}</td>
                                                             </tr>
                                                          );
                                                       })
                                                    )}
                                                 </tbody>
                                              </table>
                                           </div>
                                        </div>
                                        <div className="border-t border-slate-200 pt-3.5 mt-4 flex justify-between items-center text-xs">
                                           <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Mão de Obra</span>
                                           <span className="font-black text-[#1e4480] text-base">{fc(maoDeObraSubtotal)}</span>
                                        </div>
                                     </div>

                                     {/* Coluna Direita: Insumos & Total Geral */}
                                     <div className="flex flex-col justify-between gap-8">
                                        {/* Tabela de Insumos */}
                                        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-lg">
                                           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                                              <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">2) Materiais, Equipamentos e Serviços</h3>
                                           </div>
                                           <table className="w-full text-left text-[10px] border-collapse">
                                              <tbody>
                                                 {renderInsumoRow('Materiais e Produtos de Limpeza', applyCascata(proposta.insumos.materiais))}
                                                 {renderInsumoRow('Máquinas e Equipamentos', applyCascata(proposta.insumos.maquinas))}
                                                 {renderInsumoRow('Descartáveis', applyCascata(proposta.insumos.descartaveis))}
                                                 {renderInsumoRow(
                                                    \`Serviços \${proposta.insumos.servicosDescricao ? \`(\${proposta.insumos.servicosDescricao})\` : ''}\`, 
                                                    applyCascata(proposta.insumos.servicos)
                                                 )}
                                              </tbody>
                                           </table>
                                           <div className="border-t border-slate-200 pt-3.5 mt-4 flex justify-between items-center text-xs">
                                              <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Insumos</span>
                                              <span className="font-black text-slate-700 text-base">{fc(insumosSubtotal)}</span>
                                           </div>
                                        </div>

                                        {/* Card Valor Final */}
                                        <div className="bg-gradient-to-r from-[#1e4480] to-[#12382d] rounded-2xl p-6 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
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
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}\n\n`;

   content = content.substring(0, s11StartIdx) + newS11Content + content.substring(s11EndIdx);
   console.log("✔ Slide 11 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 4. REFATORAÇÃO DO SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA
// ----------------------------------------------------
const s12StartIdx = content.indexOf(s12StartStr);
const s12EndIdx = content.indexOf(s12EndStr);

if (s12StartIdx !== -1 && s12EndIdx !== -1) {
   console.log("✔ Slide 12 PRINT (Condições Proposta) localizado!");

   const newS12Content = s12StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-slate-50 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#1e4480" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#1e4480" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-200/60">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                               </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Grid Central de Duas Colunas de Cards */}
                            <div className="my-auto grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto items-stretch">
                               {/* Card Esquerdo: Colaboradores */}
                               <div className="bg-white rounded-2xl border border-slate-150 p-8 shadow-lg border-t-4 border-t-[#1e4480] flex flex-col space-y-4">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                     <svg className="w-5 h-5 text-[#1e4480]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                     </svg>
                                     <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">
                                        CONDIÇÕES PARA OS COLABORADORES
                                     </h3>
                                  </div>
                                  <ul className="space-y-3 text-slate-600 text-[10px] font-semibold leading-relaxed">
                                     {((proposta.cliente.condicoesColaboradores && proposta.cliente.condicoesColaboradores.length > 0)
                                        ? proposta.cliente.condicoesColaboradores
                                        : [
                                           proposta.cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
                                           proposta.cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
                                           proposta.cliente.condicaoColaboradores3 || '2 Vales transporte por dia.'
                                        ]
                                     ).map((cond: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                           <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></div>
                                           <span>{cond}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>

                               {/* Card Direito: Cliente */}
                               <div className="bg-white rounded-2xl border border-slate-150 p-8 shadow-lg border-t-4 border-t-emerald-500 flex flex-col space-y-4">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                     <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12m-6 0h6"></path>
                                     </svg>
                                     <h3 className="text-emerald-600 text-xs font-black tracking-wider uppercase">
                                        CONDIÇÕES PARA O CLIENTE
                                     </h3>
                                  </div>
                                  <ul className="space-y-3 text-slate-600 text-[10px] font-semibold leading-relaxed">
                                     {((proposta.cliente.condicoesCliente && proposta.cliente.condicoesCliente.length > 0)
                                        ? proposta.cliente.condicoesCliente
                                        : [
                                           proposta.cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
                                           proposta.cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
                                           proposta.cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.'
                                        ]
                                     ).map((cond: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                           <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></div>
                                           <span className={idx === (proposta.cliente.condicoesCliente || []).length - 1 ? "font-extrabold text-[#1B4D3E]" : ""}>{cond}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                            </div>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s12StartIdx) + newS12Content + content.substring(s12EndIdx);
   console.log("✔ Slide 12 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 5. REFATORAÇÃO DO SLIDE 13 PRINT - ACEITE
// ----------------------------------------------------
const s13StartIdx = content.indexOf(s13StartStr);
const s13EndIdx = content.lastIndexOf('</main>');

if (s13StartIdx !== -1 && s13EndIdx !== -1) {
   console.log("✔ Slide 13 PRINT (Aceite) localizado via lastIndexOf!");

   const newS13Content = s13StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-3 border-b border-white/15">
                               <h2 className="text-3xl font-black text-white tracking-widest uppercase">ACEITE</h2>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Cards de Dados de Glassmorphism Premium */}
                            <div className="my-auto max-w-4xl w-full mx-auto grid grid-cols-2 gap-x-12 gap-y-4">
                               {/* Coluna Esquerda: Dados da Empresa */}
                               <div className="space-y-3">
                                  {[
                                     { label: 'Razão Social', value: proposta.cliente.razaoSocial || proposta.cliente.cliente || '-' },
                                     { label: 'Nome Fantasia', value: proposta.cliente.cliente || '-' },
                                     { label: 'CNPJ', value: proposta.cliente.cnpj || '-' },
                                     { label: 'Valor Mensal', value: formatCurrency(resultado?.faturamentoBruto || 0) },
                                     { label: 'Início', value: proposta.cliente.dataInicio || '-' },
                                     { label: 'Vencimento', value: proposta.cliente.dataVencimento || '-' }
                                  ].map((item, idx) => (
                                     <div key={idx} className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl py-2 px-5 flex justify-between items-center text-[10px] font-black tracking-wider uppercase shadow-xs">
                                        <span className="text-white/60 shrink-0">{item.label}</span>
                                        <span className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap ml-4 max-w-[220px]">{item.value}</span>
                                     </div>
                                  ))}
                                </div>

                               {/* Coluna Direita: Contato do Cliente */}
                               <div className="space-y-3">
                                  {[
                                     { label: 'Contato', value: proposta.cliente.contato || '-' },
                                     { label: 'Cargo', value: proposta.cliente.contatoCargo || '-' },
                                     { label: 'Celular / Tel', value: proposta.cliente.celular || '-' },
                                     { label: 'E-mail', value: proposta.cliente.email || '-' }
                                  ].map((item, idx) => (
                                     <div key={idx} className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl py-2 px-5 flex justify-between items-center text-[10px] font-black tracking-wider uppercase shadow-xs">
                                        <span className="text-white/60 shrink-0">{item.label}</span>
                                        <span className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap ml-4 max-w-[220px]">{item.value}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* Seção Dupla de Assinaturas Imponentes e Simétricas */}
                            <div className="grid grid-cols-2 gap-24 w-full max-w-4xl mx-auto pt-6 border-t border-white/15 mt-auto">
                               {/* Representante SmartBid / Vendedor */}
                               <div className="flex flex-col items-center">
                                  <div className="border-t border-white/40 w-full my-1"></div>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">SmartBid / JVS Facilities</span>
                                  <span className="text-[9px] text-white/70 font-semibold leading-relaxed mt-0.5">
                                     {proposta.cliente.vendedorNome || 'Representante'} — {proposta.cliente.vendedorCargo || 'Comercial'}
                                  </span>
                               </div>

                               {/* Representante do Cliente */}
                               <div className="flex flex-col items-center">
                                  <div className="border-t border-white/40 w-full my-1"></div>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">De Acordo / Assinatura do Cliente</span>
                                  <span className="text-[9px] text-white/70 font-semibold leading-relaxed mt-0.5">
                                     {proposta.cliente.cliente || 'Representante Legal'}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>\n`;

   content = content.substring(0, s13StartIdx) + newS13Content + content.substring(s13EndIdx);
   console.log("✔ Slide 13 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 6. GRAVAÇÃO FINAL DO ARQUIVO
// ----------------------------------------------------
fs.writeFileSync(pagePath, content, 'utf8');
console.log("✔ Arquivo page.tsx refatorado integralmente com absoluto sucesso!");
