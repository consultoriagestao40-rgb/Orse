#!/usr/bin/env python3
"""
Transforma o modal do plano de ação em editor inline (tela cheia), 
igual ao padrão do editor de causas (isEditingCausa).

Mudanças:
1. Na aba 'planos' (linha ~1604): adiciona verificação isEditingPlano no início 
   para mostrar o editor inline em vez de lista/kanban
2. Remove o bloco do modal externo (isEditingPlano && (() => { ... }))
   e coloca o conteúdo dentro da aba
"""

with open('app/planejamento/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# ─── Encontrar os marcadores ─────────────────────────────────────
# Marcador 1: início da aba de planos 
planos_tab_start = None
for i, line in enumerate(lines):
    if "/* ABA 2: PLANO DE AÇÃO 5W2H */" in line:
        planos_tab_start = i
        break

# Marcador 2: onde a aba de planos SEM isEditingPlano começa o div
planos_div_open = None
for i in range(planos_tab_start, planos_tab_start + 5):
    if "activeTab === 'planos' && (" in lines[i]:
        planos_div_open = i + 1  # linha seguinte é o <div className="space-y-6">
        break

# Marcador 3: início do bloco MODAL (linha com "MODAL PLANO DE AÇÃO 5W2H")
modal_start = None
for i, line in enumerate(lines):
    if "/* MODAL PLANO DE AÇÃO 5W2H */" in line:
        modal_start = i
        break

# Marcador 4: fim do bloco MODAL (linha com "})()}")
modal_end = None
for i in range(modal_start, len(lines)):
    if lines[i].strip() == '})()}':
        modal_end = i
        break

print(f"planos_tab_start: {planos_tab_start+1}")
print(f"planos_div_open: {planos_div_open+1}")
print(f"modal_start: {modal_start+1}")
print(f"modal_end: {modal_end+1}")

# ─── Extrair o conteúdo INTERNO do modal (dentro do return ()) ──
# Localizar: "return (" dentro do bloco modal
modal_return_start = None
for i in range(modal_start, modal_end):
    if lines[i].strip() == 'return (':
        modal_return_start = i + 1  # linha após "return ("
        break

# Localizar o fechamento do return: "        );" seguido de "      })()}"
# O conteúdo é: da linha após "return (" até a linha antes de ");"
# Mas o return tem:
#   return (
#     <div className="fixed inset-0 ...">        <- outer modal wrapper
#       <div className="bg-white rounded-[32px]...">  <- inner card
#         ...conteúdo do editor...
#       </div>
#     </div>
#   );
# Queremos apenas o conteúdo do editor (sem as divs wrapper do modal)

# Achar o header com "Cabeçalho Premium" dentro do modal
modal_header_start = None
for i in range(modal_return_start, modal_end):
    if "/* Cabeçalho Premium */" in lines[i]:
        modal_header_start = i
        break

# Achar o form onSubmit={handleSavePlano}
modal_form_start = None
for i in range(modal_start, modal_end):
    if 'onSubmit={handleSavePlano}' in lines[i]:
        modal_form_start = i
        break

# Achar o fechamento do </form> antes do </div></div>);
modal_form_end = None
for i in range(modal_end, modal_end - 20, -1):
    if lines[i].strip() == '</form>':
        modal_form_end = i
        break

print(f"modal_header_start: {modal_header_start+1}")
print(f"modal_form_start: {modal_form_start+1}")  
print(f"modal_form_end: {modal_form_end+1}")

# ─── Construir o novo conteúdo ────────────────────────────────────

# Extrair variáveis calculadas do modal (entre modal_start e modal_return_start)
calc_vars_lines = lines[modal_start+2 : modal_return_start-1]  # skip comment and {isEditingPlano && (() => {

# Extrair header do modal (da linha do Cabeçalho Premium até antes do form)
modal_header_lines = lines[modal_header_start : modal_form_start]

# Extrair corpo do form (da linha do form até </form>)
modal_form_lines = lines[modal_form_start : modal_form_end+1]

# ─── Novo bloco inline da aba planos ─────────────────────────────
INDENT = "                  "  # 18 spaces (dentro do tab content)

new_planos_tab_lines = [
    "              {/* ABA 2: PLANO DE AÇÃO 5W2H */}",
    "              {activeTab === 'planos' && (",
    "                isEditingPlano ? (",
    "                  /* EDITOR EM TELA CHEIA (inline, sem modal) */",
    "                  (() => {",
]

# Adicionar as variáveis calculadas com indentação correta
for vline in calc_vars_lines:
    stripped = vline.lstrip()
    if stripped:
        new_planos_tab_lines.append("                    " + stripped)
    else:
        new_planos_tab_lines.append("")

new_planos_tab_lines.append("                    return (")
new_planos_tab_lines.append("                      <div className=\"bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200\">")
new_planos_tab_lines.append("")
new_planos_tab_lines.append("                        {/* Cabeçalho com botão Voltar */}")
new_planos_tab_lines.append("                        <div className=\"flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 via-white to-white select-none\">")
new_planos_tab_lines.append("                          <div className=\"flex items-center gap-3.5\">")
new_planos_tab_lines.append("                            <div className=\"w-10 h-10 rounded-2xl bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]\">")
new_planos_tab_lines.append("                              <ClipboardList size={18} />")
new_planos_tab_lines.append("                            </div>")
new_planos_tab_lines.append("                            <div>")
new_planos_tab_lines.append("                              <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest leading-none\">")
new_planos_tab_lines.append("                                {currentPlano.id ? 'Detalhamento do Plano de Ação' : 'Criar Novo Plano de Ação'}")
new_planos_tab_lines.append("                              </h3>")
new_planos_tab_lines.append("                              {currentPlano.id && (")
new_planos_tab_lines.append("                                <p className=\"text-[10px] font-bold text-slate-400 mt-1\">")
new_planos_tab_lines.append("                                  {completedActions} de {totalActions} sub-ações concluídas")
new_planos_tab_lines.append("                                </p>")
new_planos_tab_lines.append("                              )}")
new_planos_tab_lines.append("                            </div>")
new_planos_tab_lines.append("                          </div>")
new_planos_tab_lines.append("                          <button")
new_planos_tab_lines.append("                            type=\"button\"")
new_planos_tab_lines.append("                            onClick={() => setIsEditingPlano(false)}")
new_planos_tab_lines.append("                            className=\"flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-[#1B4D3E] bg-transparent border-none cursor-pointer transition-colors\"")
new_planos_tab_lines.append("                          >")
new_planos_tab_lines.append("                            <ArrowLeft size={16} /> Voltar para Planos")
new_planos_tab_lines.append("                          </button>")
new_planos_tab_lines.append("                        </div>")
new_planos_tab_lines.append("")

# Adicionar o form com indentação aumentada
for fline in modal_form_lines:
    stripped = fline.lstrip()
    if stripped:
        # Calcular indentação original relativa
        orig_indent = len(fline) - len(fline.lstrip())
        # Base indent no modal era 14 spaces (dentro da div fixed > div rounded)
        # Novo base indent é 24 spaces (dentro da div inline)
        base_shift = 10  # diferença: 24 - 14
        new_line = "                        " + stripped  # 24 spaces
        new_planos_tab_lines.append(new_line)
    else:
        new_planos_tab_lines.append("")

new_planos_tab_lines.append("")
new_planos_tab_lines.append("                      </div>")  # fecha div editor inline
new_planos_tab_lines.append("                    );")
new_planos_tab_lines.append("                  })()")
new_planos_tab_lines.append("                ) : (")
new_planos_tab_lines.append("                  /* VISÃO LISTA / KANBAN */")
new_planos_tab_lines.append("                  <div className=\"space-y-6\">")
new_planos_tab_lines.append("                    {/* Indicador de Quantidade */}")
new_planos_tab_lines.append("                    <div className={`flex justify-between items-center select-none pb-2 ${isKanbanMode ? 'px-8' : ''}`}>")
new_planos_tab_lines.append("                      <span className=\"text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest\">")
new_planos_tab_lines.append("                        {planosAcao.length} Planos de Ação")
new_planos_tab_lines.append("                      </span>")
new_planos_tab_lines.append("                    </div>")
new_planos_tab_lines.append("")
new_planos_tab_lines.append("                    {planosAcao.length === 0 ? (")
new_planos_tab_lines.append("                      <div className=\"bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm\">")
new_planos_tab_lines.append("                        Nenhum plano de ação cadastrado. Clique em \"Novo Plano 5W2H\" para iniciar.")
new_planos_tab_lines.append("                      </div>")
new_planos_tab_lines.append("                    ) : planoViewMode === 'list' ? (")

# ─── Encontrar onde a lista/kanban começa no original ─────────────
# Logo após o bloco isEditingPlano na aba planos original
# Na versão original, após "activeTab === 'planos' && (" vem direto o <div space-y-6>
# que tem o indicador de quantidade e depois a lista

# Localizar onde a lista começa: linha com "/* VISÃO LISTA */"
list_start = None
for i in range(planos_tab_start, modal_start):
    if "/* VISÃO LISTA */" in lines[i]:
        list_start = i
        break

# Localizar onde a aba de planos termina no original
# Deve ser um ")}" após o kanban/lista, antes de outro tab
# Vamos procurar o "/* ABA 3: OKRs & Metas */" ou similar
planos_tab_end = None
for i in range(list_start, modal_start):
    if "/* ABA 3:" in lines[i] or "/* ABA 4:" in lines[i] or "activeTab === 'metas'" in lines[i]:
        # Ir para trás até encontrar o fechamento da aba de planos
        for j in range(i - 1, list_start, -1):
            if lines[j].strip() == ')}' or lines[j].strip() == ')':
                planos_tab_end = j
                break
        break

print(f"list_start: {list_start+1}")
print(f"planos_tab_end: {planos_tab_end+1}")

# Extrair o conteúdo da lista/kanban original
list_kanban_content = lines[list_start : planos_tab_end+1]
print(f"list_kanban_content lines: {len(list_kanban_content)}")

# Adicionar o conteúdo da lista ao novo bloco (com indentação aumentada 4 espaços)
for lline in list_kanban_content:
    stripped = lline.lstrip()
    if stripped:
        new_planos_tab_lines.append("                    " + stripped)
    else:
        new_planos_tab_lines.append("")

new_planos_tab_lines.append("                  </div>")  # fecha div space-y-6 do modo lista/kanban
new_planos_tab_lines.append("                )")   # fecha ternário : (lista)
new_planos_tab_lines.append("              )}")    # fecha activeTab === 'planos' && (

# ─── Montar o arquivo final ───────────────────────────────────────
# Partes:
# 1. Início do arquivo até antes de "/* ABA 2: PLANO DE AÇÃO 5W2H */"
part1 = lines[:planos_tab_start]

# 2. Novo bloco da aba de planos
part2 = new_planos_tab_lines

# 3. Do final da aba de planos original (planos_tab_end+1) até antes do modal (modal_start)
part3 = lines[planos_tab_end+1 : modal_start]

# 4. Substituir o modal por comentário simples
part4 = ["      {/* Editor de plano inline (movido para dentro da aba de planos acima) */}"]

# 5. Do final do modal até o fim do arquivo
part5 = lines[modal_end+1:]

final_lines = part1 + part2 + part3 + part4 + part5

print(f"Final lines count: {len(final_lines)}")

# Escrever o arquivo
with open('app/planejamento/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(final_lines))

print("Done! File written successfully.")
