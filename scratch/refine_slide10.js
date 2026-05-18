const fs = require('fs');

const pagePath = 'app/propostas/nova/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

console.log("Refining Slide 10 table columns and labels to match Tab 9 perfectly...");

// Normalize line endings to LF
pageContent = pageContent.replace(/\r\n/g, '\n');

// 1. Refine Visualizer Mão de Obra table
const visTableTarget = `                                            <div className="overflow-y-auto max-h-[140px] pr-1">
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
                                            </div>`;

const visTableReplacement = `                                            <div className="overflow-y-auto max-h-[140px] pr-1">
                                               <table className="w-full text-left text-[9px]">
                                                  <thead>
                                                     <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                                                        <th className="py-1">Função</th>
                                                        <th className="py-1 text-center w-8">Qtd.</th>
                                                        <th className="py-1 text-right w-16">Unit.</th>
                                                        <th className="py-1 text-right w-20">Total</th>
                                                     </tr>
                                                  </thead>
                                                  <tbody>
                                                     {proposta.equipe.length === 0 ? (
                                                        <tr>
                                                           <td colSpan={4} className="py-4 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                        </tr>
                                                     ) : (
                                                        proposta.equipe.map((p: any, idx: number) => {
                                                           const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                           const precoVendaItem = itemRes?.precoVenda || 0;
                                                           const precoUnitario = p.quantidade > 0 ? precoVendaItem / p.quantidade : 0;
                                                           return (
                                                              <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                                 <td className="py-1.5 font-bold">{p.nomeCargo}</td>
                                                                 <td className="py-1.5 text-center font-black text-slate-600">{p.quantidade}</td>
                                                                 <td className="py-1.5 text-right text-slate-500 font-semibold">{fc(precoUnitario)}</td>
                                                                 <td className="py-1.5 text-right font-bold text-slate-800">{fc(precoVendaItem)}</td>
                                                               </tr>
                                                           );
                                                        })
                                                     )}
                                                  </tbody>
                                               </table>
                                            </div>`;

if (pageContent.includes(visTableTarget)) {
   pageContent = pageContent.replace(visTableTarget, visTableReplacement);
   console.log("✔ Visualizer Mão de Obra table refined!");
} else {
   console.error("❌ Visualizer Mão de Obra table target not found!");
}

// 2. Refine Visualizer Insumos services label
const visServTarget = `                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">Serviços e Outros</td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                  </tr>`;

const visServReplacement = `                                                  <tr className="border-b border-slate-100 text-slate-700">
                                                     <td className="py-1.5 font-bold">
                                                        Serviços \${proposta.insumos.servicosDescricao ? \`(\${proposta.insumos.servicosDescricao})\` : ''}
                                                     </td>
                                                     <td className="py-1.5 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                  </tr>`;

if (pageContent.includes(visServTarget)) {
   pageContent = pageContent.replace(visServTarget, visServReplacement);
   console.log("✔ Visualizer Insumos services label refined!");
} else {
   console.error("❌ Visualizer Insumos services label target not found!");
}

// 3. Refine Print Mão de Obra table
const printTableTarget = `                                           <div className="overflow-y-auto max-h-[160px] pr-1">
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
                                           </div>`;

const printTableReplacement = `                                           <div className="overflow-y-auto max-h-[160px] pr-1">
                                              <table className="w-full text-left text-[10px]">
                                                 <thead>
                                                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                                                       <th className="py-1">Função</th>
                                                       <th className="py-1 text-center w-10">Qtd.</th>
                                                       <th className="py-1 text-right w-20">Unit.</th>
                                                       <th className="py-1 text-right w-24">Total</th>
                                                    </tr>
                                                 </thead>
                                                 <tbody>
                                                    {proposta.equipe.length === 0 ? (
                                                       <tr>
                                                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                       </tr>
                                                    ) : (
                                                       proposta.equipe.map((p: any, idx: number) => {
                                                          const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                          const precoVendaItem = itemRes?.precoVenda || 0;
                                                          const precoUnitario = p.quantidade > 0 ? precoVendaItem / p.quantidade : 0;
                                                          return (
                                                             <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                                <td className="py-2 font-bold">{p.nomeCargo}</td>
                                                                <td className="py-2 text-center font-black text-slate-600">{p.quantidade}</td>
                                                                <td className="py-2 text-right text-slate-500 font-semibold">{fc(precoUnitario)}</td>
                                                                <td className="py-2 text-right font-bold text-slate-800">{fc(precoVendaItem)}</td>
                                                             </tr>
                                                          );
                                                       })
                                                    )}
                                                 </tbody>
                                              </table>
                                           </div>`;

if (pageContent.includes(printTableTarget)) {
   pageContent = pageContent.replace(printTableTarget, printTableReplacement);
   console.log("✔ Print Mão de Obra table refined!");
} else {
   console.error("❌ Print Mão de Obra table target not found!");
}

// 4. Refine Print Insumos services label
const printServTarget = `                                                 <tr className="border-b border-slate-100 text-slate-700">
                                                    <td className="py-2 font-bold">Serviços e Outros</td>
                                                    <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                 </tr>`;

const printServReplacement = `                                                 <tr className="border-b border-slate-100 text-slate-700">
                                                    <td className="py-2 font-bold">
                                                       Serviços \${proposta.insumos.servicosDescricao ? \`(\${proposta.insumos.servicosDescricao})\` : ''}
                                                    </td>
                                                    <td className="py-2 text-right font-black">{fc(applyCascata(proposta.insumos.servicos))}</td>
                                                 </tr>`;

if (pageContent.includes(printServTarget)) {
   pageContent = pageContent.replace(printServTarget, printServReplacement);
   console.log("✔ Print Insumos services label refined!");
} else {
   console.error("❌ Print Insumos services label target not found!");
}

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log("✔ Slide 10 refinement applied successfully!");
