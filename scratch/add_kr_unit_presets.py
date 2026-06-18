import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add formatKrValue helper at the file scope (below formatLocalDate)
format_local_date_end = """const formatLocalDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    const isoMatch = dateStr.match(/^(\\d{4})-(\\d{2})-(\\d{2})T/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};"""

format_kr_value_helper = """
const formatKrValue = (val: number, unit: string) => {
  if (!unit || unit.trim() === '') {
    return `${val}`;
  }
  const uTrim = unit.trim();
  if (uTrim.toLowerCase() === 'r$' || uTrim.toUpperCase() === 'BRL') {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${val} ${uTrim}`;
};"""

# Let's replace the end of formatLocalDate with itself + formatKrValue helper
content = content.replace(format_local_date_end, format_local_date_end + format_kr_value_helper)
print("Added formatKrValue helper at file scope.")

# 2. Remove formatKrValue inside the Resumo map callback
local_format_kr = """                                             const formatKrValue = (val: number, unit: string) => {
                                               if (unit.trim().toLowerCase() === 'r$' || unit.trim().toUpperCase() === 'BRL') {
                                                 return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                               }
                                               return `${val} ${unit}`;
                                             };"""

if local_format_kr in content:
    content = content.replace(local_format_kr, "")
    print("Removed local formatKrValue definition.")
else:
    print("Local formatKrValue definition not found exactly.")

# 3. Update Árvore view to use formatKrValue
tree_val_old = "<span>{kr.valorAtual} / {kr.valorAlvo} {kr.unidade}</span>"
tree_val_new = "<span>{formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}</span>"

if tree_val_old in content:
    content = content.replace(tree_val_old, tree_val_new)
    print("Updated Tree view to use formatKrValue.")
else:
    print("Tree view pattern not found.")

# 4. Overhaul the Unidade input in the KR edit modal
# Let's find the Unidade block in the modal
modal_unidade_old = """                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unidade</label>
                  <input
                    type="text"
                    required
                    value={currentKr.unidade || ''}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="%, R$, min"
                  />
                </div>"""

modal_unidade_new = """                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Formato / Unidade</label>
                  <select
                    value={
                      currentKr.unidade === '%' ? '%' :
                      currentKr.unidade === 'R$' ? 'R$' :
                      currentKr.unidade === '' ? 'inteiro' :
                      'outro'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '%') {
                        setCurrentKr(prev => ({ ...prev, unidade: '%' }));
                      } else if (val === 'R$') {
                        setCurrentKr(prev => ({ ...prev, unidade: 'R$' }));
                      } else if (val === 'inteiro') {
                        setCurrentKr(prev => ({ ...prev, unidade: '' }));
                      } else {
                        setCurrentKr(prev => ({ ...prev, unidade: 'personalizado' }));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer"
                  >
                    <option value="%">Porcentagem (%)</option>
                    <option value="R$">Moeda (R$)</option>
                    <option value="inteiro">Número simples</option>
                    <option value="outro">Unidade personalizada...</option>
                  </select>
                </div>"""

if modal_unidade_old in content:
    content = content.replace(modal_unidade_old, modal_unidade_new)
    print("Replaced Unidade text input with Select presets in modal.")
else:
    print("Modal Unidade text input block not found exactly.")

# 5. Insert custom text input field if currentKr.unidade is not one of presets
# We insert it right before the opening of the next grid section:
# `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">`
target_next_grid = """              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Responsável</label>"""

custom_input_field = """              {![ '%', 'R$', '' ].includes(currentKr.unidade || '') && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descreva a Unidade Personalizada</label>
                  <input
                    type="text"
                    required
                    value={currentKr.unidade === 'personalizado' ? '' : currentKr.unidade}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Ex: clientes, horas, chamados"
                  />
                </div>
              )}

              """

if target_next_grid in content:
    content = content.replace(target_next_grid, custom_input_field + target_next_grid)
    print("Inserted custom text input block for custom units.")
else:
    print("Target next grid not found.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished saving.")
