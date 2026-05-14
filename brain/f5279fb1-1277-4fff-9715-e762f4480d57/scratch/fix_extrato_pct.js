const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Update the reduce logic to collect percentages (weighted average if different, but usually same)
  // Actually, since it's per CCT, and usually users use one CCT per proposal, we just take the first or max
  const reduceStart = 'return {';
  const reduceEnd = '};';
  
  // We'll update the block between const b = ... and rows = [
  const startPattern = /const b = resultado\?\.items\?\.reduce\(\(acc: any, i: any\) => \{[\s\S]+?\}, \{ va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, manutencao:0, outros:0 \}\);/;
  
  const newReduce = `const b = resultado?.items?.reduce((acc: any, i: any) => {
                              const d = i.detalhes?.detalheBlocoC;
                              return {
                                 va: acc.va + (d?.va || 0) * i.quantidade,
                                 vt: acc.vt + (d?.vt || 0) * i.quantidade,
                                 custosSindicato: acc.custosSindicato + (d?.custosSindicato || 0) * i.quantidade,
                                 vaFerias: acc.vaFerias + (d?.vaFerias || 0) * i.quantidade,
                                 cestaBasica: acc.cestaBasica + (d?.cestaBasica || 0) * i.quantidade,
                                 descontoVA: acc.descontoVA + (d?.descontoVA || 0) * i.quantidade,
                                 descontoVT: acc.descontoVT + (d?.descontoVT || 0) * i.quantidade,
                                 exames: acc.exames + (d?.exames || 0) * i.quantidade,
                                 reservaTecnica: acc.reservaTecnica + (d?.reservaTecnica || 0) * i.quantidade,
                                 reservaTecnicaPct: d?.reservaTecnicaPct || acc.reservaTecnicaPct,
                                 manutencao: acc.manutencao + (d?.manutencao || 0) * i.quantidade,
                                 manutencaoPct: d?.manutencaoPct || acc.manutencaoPct,
                                 outros: acc.outros + (d?.outros || 0) * i.quantidade,
                              };
                           }, { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 });`;

  content = content.replace(startPattern, newReduce);

  // 2. Update the rows array to include percentages
  const rowsPattern = /const rows = \[[\s\S]+?\];/;
  const newRows = `const rows = [
                              { label: '1) Vale Alimentação', val: b.va },
                              { label: '2) Vale Transporte', val: b.vt },
                              { label: '3) Custos com Sindicatos (Assist. Médica/Social/Fundo Formação)', val: b.custosSindicato },
                              { label: '4) Vale Alimentação Sobre Férias', val: b.vaFerias },
                              { label: '5) Cesta Básica Assiduidade(+)', val: b.cestaBasica },
                              { label: '6) Desconto de VA(-)', val: b.descontoVA, red: true },
                              { label: '7) Desconto de VT(-)', val: b.descontoVT, red: true },
                              { label: '8) Exames Médicos', val: b.exames },
                              { label: '9) Reservas Técnicas', val: b.reservaTecnica, pct: b.reservaTecnicaPct },
                              { label: '10) Manutenção Equipamentos', val: b.manutencao, pct: b.manutencaoPct },
                              { label: '11) Outros (especificar)', val: b.outros },
                           ];`;
  
  content = content.replace(rowsPattern, newRows);

  // 3. Update the table row rendering to show percentages
  const trPattern = /<tr key=\{i\} className="border-b border-slate-200 border-dotted">[\s\S]+?<\/tr>/;
  const newTr = `<tr key={i} className="border-b border-slate-200 border-dotted">
                                       <td colSpan={row.pct !== undefined ? 2 : 3} className={"py-1 px-6 font-bold " + (row.red ? "text-red-600" : "")}>{row.label}</td>
                                       {row.pct !== undefined && (
                                          <td className="py-1 px-6 text-center font-bold bg-slate-50 text-slate-500">{row.pct.toFixed(2)}%</td>
                                       )}
                                       <td className={"py-1 px-6 text-right bg-emerald-100/50 font-semibold " + (row.red ? "text-red-600" : "")}>
                                          {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                       </td>
                                    </tr>`;

  content = content.replace(trPattern, newTr);

  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
