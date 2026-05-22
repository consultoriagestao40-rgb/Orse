const fs = require('fs');

let content = fs.readFileSync('app/admin/ccts/[id]/edit/page.tsx', 'utf8');

// 1. Add CurrencyInput component
const currencyInputCode = `
function CurrencyInput({ value, onChange, className, placeholder }: any) {
  const [displayValue, setDisplayValue] = React.useState('');

  React.useEffect(() => {
    if (value === 0 || value === '0' || !value) {
       setDisplayValue('');
    } else {
       setDisplayValue(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)));
    }
  }, [value]);

  const handleChange = (e: any) => {
    let raw = e.target.value.replace(/\\D/g, '');
    if (!raw) {
       setDisplayValue('');
       onChange(0);
       return;
    }
    const num = Number(raw) / 100;
    setDisplayValue(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num));
    onChange(num);
  };

  return (
    <input
      type="text"
      className={className}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder || "0,00"}
    />
  );
}
`;

if (!content.includes('function CurrencyInput')) {
  content = content.replace('export default function CCTEditorPage() {', currencyInputCode + '\nexport default function CCTEditorPage() {');
}

// 2. Fix number fields in the top blocks (vaValor, vtValor, etc.) to use CurrencyInput
content = content.replace(/<input\s+type="number"\s+step="0\.01"\s+className=\{inputClass\}\s+value=\{formData\.(\w+)\}\s+onChange=\{e => setFormData\(\{ \.\.\.formData, \w+: e\.target\.value \}\)\}\s+\/>/g, (match, field) => {
  if (['vaValor', 'vtValor', 'cestaBasica', 'examesMedicos', 'custosSindicato', 'outrosBeneficios', 'salarioMinimo'].includes(field)) {
    return `<CurrencyInput className={inputClass} value={formData.${field}} onChange={(val: number) => setFormData({ ...formData, ${field}: val })} />`;
  }
  // For percentages like vaDescPercent, vtDescPercent, just remove zero
  return `<input type="number" step="0.01" className={inputClass} value={formData.${field} || ''} onChange={e => setFormData({ ...formData, ${field}: e.target.value ? Number(e.target.value) : 0 })} placeholder="0" />`;
});

// Also fix inline inputs that didn't match the exact regex (like vaValor which is inside a flex)
content = content.replace(/<input\s+type="number"\s+step="0\.01"\s+className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-\[#1B4D3E\]"\s+value=\{formData\.vaValor\}\s+onChange=\{e => setFormData\(\{ \.\.\.formData, vaValor: e\.target\.value \}\)\}\s+\/>/, 
  `<CurrencyInput className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E]" value={formData.vaValor} onChange={(val: number) => setFormData({ ...formData, vaValor: val })} />`
);

// 3. Fix the Cargos Table
// Add the Sequence column header
if (!content.includes('<th className="px-4 py-3 text-center w-12">#</th>')) {
  content = content.replace('<th className="px-6 py-3 min-w-[280px]">Função / Cargo</th>', '<th className="px-4 py-3 text-center w-12">#</th>\n                    <th className="px-6 py-3 whitespace-nowrap">Função / Cargo</th>');
}

// 4. Update the tbody mapping for sequence and flexible width
content = content.replace(/<td className="px-6 py-3 min-w-\[280px\]">\s*<input\s+type="text"\s+placeholder="Ex: Servente"\s+className="w-full bg-transparent border-b border-slate-200 focus:border-\[#1B4D3E\] outline-none py-1 text-sm text-slate-800 font-medium"\s+value=\{cargo\.nome\}\s+onChange=\{e => updateCargo\(idx, 'nome', e\.target\.value\)\}\s+\/>\s*<\/td>/, 
  `<td className="px-4 py-3 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-6 py-3 whitespace-nowrap min-w-[350px]">
                        <input
                          type="text"
                          placeholder="Ex: Servente"
                          className="w-full bg-transparent border-b border-slate-200 focus:border-[#1B4D3E] outline-none py-1 text-sm text-slate-800 font-medium"
                          value={cargo.nome}
                          onChange={e => updateCargo(idx, 'nome', e.target.value)}
                        />
                      </td>`
);

// 5. Update the number fields inside the map loop
const oldMapCode = `{(['pisoSalarial', 'gratificacoes', 'assiduidade', 'adicionalCopa', 'insalubridadePercent'] as const).map(field => (
                        <td key={field} className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-center text-slate-700 focus:border-[#1B4D3E] outline-none font-medium text-xs"
                              value={(cargo as any)[field]}
                              onChange={e => updateCargo(idx, field, e.target.value)}
                            />
                            {field === 'insalubridadePercent' && <span className="text-slate-400 font-bold">%</span>}
                          </div>
                        </td>
                      ))}`;

const newMapCode = `{(['pisoSalarial', 'gratificacoes', 'assiduidade', 'adicionalCopa', 'insalubridadePercent'] as const).map(field => (
                        <td key={field} className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {field === 'insalubridadePercent' ? (
                              <>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-center text-slate-700 focus:border-[#1B4D3E] outline-none font-medium text-xs"
                                  value={(cargo as any)[field] || ''}
                                  onChange={e => updateCargo(idx, field, e.target.value ? Number(e.target.value) : 0)}
                                  placeholder="0"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </>
                            ) : (
                              <CurrencyInput
                                className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-right text-slate-700 focus:border-[#1B4D3E] outline-none font-medium text-xs"
                                value={(cargo as any)[field]}
                                onChange={(val: number) => updateCargo(idx, field, val)}
                              />
                            )}
                          </div>
                        </td>
                      ))}`;

content = content.replace(oldMapCode, newMapCode);

// Fix colSpan for empty row if it has 8
content = content.replace('colSpan={8}', 'colSpan={9}');

fs.writeFileSync('app/admin/ccts/[id]/edit/page.tsx', content);
console.log('CCTs Edit Page patched successfully!');
