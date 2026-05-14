import sys
import os

path = 'app/propostas/nova/page.tsx'
if not os.path.exists(path):
    print(f'File not found: {path}')
    sys.exit(1)

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Using very specific parts to find the location
target_start = '                        {/* MONTANTE C */}'
target_end = '                        <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white">'

# Let's try to find the entire block between MONTANTE C and the total row
try:
    start_idx = content.index(target_start)
    # Find the SECOND occurrence of target_end after start_idx (the first one is for Montante B)
    # Wait, the view showed Montante C starts at 879.
    # Total Montante C row is at 901.
    
    # Let's just replace the part we KNOW is there.
    # I'll replace everything from line 880 to 906.
    lines = content.splitlines()
    # lines are 0-indexed, so 880 is index 879.
    # But wait, I'll use a more robust search.
    
    new_bloco_c = \"\"\"                       {(() => {
                          const b = resultado?.items?.reduce((acc: any, i: any) => {
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
                                   <tr key={i} className=\"border-b border-slate-200 border-dotted\">
                                      <td colSpan={3} className={`py-1 px-6 font-bold ${row.red ? 'text-red-600' : ''}`}>{row.label}</td>
                                      <td className={`py-1 px-6 text-right bg-emerald-100/50 font-semibold ${row.red ? 'text-red-600' : ''}`}>
                                         {row.val < 0 ? `-${formatCurrency(Math.abs(row.val))}` : formatCurrency(row.val)}
                                      </td>
                                   </tr>
                                ))}
                                <tr className=\"bg-[#1B4D3E] text-white font-bold border-y border-white\">
                                   <td colSpan={3} className=\"py-2.5 px-6 text-right uppercase tracking-wider\">Total do Montante \"C\"</td>
                                   <td className=\"py-2.5 px-6 text-right\">
                                      {formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.beneficios || 0) * i.quantidade), 0) || 0)}
                                   </td>
                                </tr>
                             </>
                          );
                       })()}\"\"\"

    # Search for the block starting from MONTANTE C and replace the following rows
    import re
    # Match the block between Montante C header and the end of Montante C section
    pattern = re.compile(r'({/\* MONTANTE C \*/}.*?<tr className=\"bg-\[#1B4D3E\] text-white font-bold border-y border-white\">.*?Total do Montante \"C\".*?</td>.*?</tr>)', re.DOTALL)
    
    new_content = pattern.sub(f'{{/* MONTANTE C */}}\\n{new_bloco_c}', content)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Success')
    else:
        # Fallback if pattern fails
        print('Pattern did not match')
except Exception as e:
    print(f'Error: {e}')
