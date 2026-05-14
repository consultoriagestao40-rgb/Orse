const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  const newBlocoC = `                       {(() => {
                          const b = resultado?.items?.reduce((acc, i) => {
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
                                manutencao: acc.manutencao + (d?.manutencao || 0) * i.quantidade,
                                outros: acc.outros + (d?.outros || 0) * i.quantidade,
                             };
                          }, { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, manutencao:0, outros:0 });

                          const rows = [
                             { label: '1) Vale Alimentação', val: b.va },
                             { label: '2) Vale Transporte', val: b.vt },
                             { label: '3) Custos com Sindicatos (Assist. Médica/Social/Fundo Formação)', val: b.custosSindicato },
                             { label: '4) Vale Alimentação Sobre Férias', val: b.vaFerias },
                             { label: '5) Cesta Básica Assiduidade(+)', val: b.cestaBasica },
                             { label: '6) Desconto de VA(-)', val: b.descontoVA, red: true },
                             { label: '7) Desconto de VT(-)', val: b.descontoVT, red: true },
                             { label: '8) Exames Médicos', val: b.exames },
                             { label: '9) Reservas Técnicas', val: b.reservaTecnica },
                             { label: '10) Manutenção Equipamentos', val: b.manutencao },
                             { label: '11) Outros (especificar)', val: b.outros },
                          ];

                          return (
                             <>
                                {rows.map((row, i) => (
                                   <tr key={i} className="border-b border-slate-200 border-dotted">
                                      <td colSpan={3} className={"py-1 px-6 font-bold " + (row.red ? "text-red-600" : "")}>{row.label}</td>
                                      <td className={"py-1 px-6 text-right bg-emerald-100/50 font-semibold " + (row.red ? "text-red-600" : "")}>
                                         {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                      </td>
                                   </tr>
                                ))}
                                <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white">
                                   <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total do Montante "C"</td>
                                   <td className="py-2.5 px-6 text-right">
                                      {formatCurrency(resultado?.items?.reduce((acc, i) => acc + ((i.detalhes?.beneficios || 0) * i.quantidade), 0) || 0)}
                                   </td>
                                </tr>
                             </>
                          );
                       })()}`;

  // Find where Montante C starts and where Montante D starts
  const startMarker = '{/* MONTANTE C */}';
  const endMarker = '{/* MONTANTE D - BDI */}';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const before = content.substring(0, startIndex + startMarker.length);
    const after = content.substring(endIndex);
    
    // We need to keep the header of Montante C
    const headerPattern = /<tr className="bg-\[#1B4D3E\] text-white border-y-2 border-white\/20">[\s\S]*?<\/tr>/;
    const match = content.substring(startIndex).match(headerPattern);
    
    if (match) {
        const header = match[0];
        const newContent = before + '\n' + header + '\n' + newBlocoC + '\n                       ' + after;
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Success');
    } else {
        console.log('Header not found');
    }
  } else {
    console.log('Markers not found');
  }
} catch (err) {
  console.error(err);
}
