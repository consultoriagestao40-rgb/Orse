#!/usr/bin/env python3
"""
Abordagem LIMPA: 
1. Lê o arquivo original
2. Encontra o EXATO início e fim do bloco do modal
3. Extrai o conteúdo INTERNO do modal (sem os wrappers fixed/rounded do modal)
4. Insere no lugar certo dentro da aba planos
5. Remove o bloco externo do modal
"""
import re

with open('app/planejamento/page.tsx', 'r', encoding='utf-8') as f:
    original = f.read()

lines = original.split('\n')
print(f"Lines: {len(lines)}")

# ─── Encontrar os marcadores EXATOS ──────────────────────────────

# 1. Linha da aba de planos
planos_tab_line = None
for i, l in enumerate(lines):
    if "/* ABA 2: PLANO DE AÇÃO 5W2H */" in l:
        planos_tab_line = i
        break
print(f"planos_tab_line: {planos_tab_line+1}")

# 2. Início do modal (comentário)
modal_comment_line = None
for i, l in enumerate(lines):
    if "/* MODAL PLANO DE AÇÃO 5W2H */" in l:
        modal_comment_line = i
        break
print(f"modal_comment_line: {modal_comment_line+1}")

# 3. Fim do modal - "})()}" sozinho na linha (IIFE terminator)
modal_end_line = None
for i in range(modal_comment_line, len(lines)):
    if lines[i].strip() == '})()}':
        modal_end_line = i
        break
print(f"modal_end_line: {modal_end_line+1}")

# 4. Dentro do modal, encontrar o <form onSubmit={handleSavePlano}
form_line = None
for i in range(modal_comment_line, modal_end_line):
    if 'onSubmit={handleSavePlano}' in lines[i]:
        form_line = i
        break
print(f"form_line: {form_line+1}")

# 5. Dentro do modal, encontrar o </form> final antes de })()} 
form_end_line = None
for i in range(modal_end_line, modal_comment_line, -1):
    if lines[i].strip() == '</form>':
        form_end_line = i
        break
print(f"form_end_line: {form_end_line+1}")

# ─── Verificações ─────────────────────────────────────────────────
assert planos_tab_line is not None, "planos_tab_line not found"
assert modal_comment_line is not None, "modal_comment_line not found"
assert modal_end_line is not None, "modal_end_line not found"
assert form_line is not None, "form_line not found"
assert form_end_line is not None, "form_end_line not found"

# ─── Extrair variáveis calculadas (entre modal_comment_line e "return (") ─
# Linha: {isEditingPlano && (() => {
# ... vars ...
# return (
return_line = None
for i in range(modal_comment_line, form_line):
    if lines[i].strip() == 'return (':
        return_line = i
        break
print(f"return_line: {return_line+1}")

# Vars: linhas modal_comment_line+2 até return_line-1 (excluindo blank lines após return)
var_lines = lines[modal_comment_line+2 : return_line]

# ─── Onde a aba planos tem seu {isEditingPlano ? ... : ...} ──────
# Precisamos inserir ANTES da linha "{activeTab === 'planos' && ("
# que é planos_tab_line + 1
planos_condition_line = planos_tab_line + 1  # {activeTab === 'planos' && (
print(f"planos_condition_line: {planos_condition_line+1}: {lines[planos_condition_line]}")

# A linha seguinte é o <div space-y-6> - que vira a parte "lista/kanban"
# Precisamos inserir: isEditingPlano ? (editor) : (div space-y-6 ...)
# Então planos_condition_line+1 deve ser o inicio da lista

list_div_line = planos_condition_line + 1
print(f"list_div_line: {list_div_line+1}: {lines[list_div_line]}")

# Encontrar o fechamento da aba planos no original (antes do modal)
# É um ")}" que fecha {activeTab === 'planos' && (
# Vamos procurar "/* ABA 3:" para encontrar onde a aba 3 começa
aba3_line = None
for i in range(planos_tab_line, modal_comment_line):
    if "/* ABA 3:" in lines[i] or "activeTab === 'metas'" in lines[i]:
        aba3_line = i
        break
print(f"aba3_line: {aba3_line+1}")

# O fechamento da aba planos é antes da aba 3
# Vamos procurar de trás para frente
planos_close_line = None
for i in range(aba3_line-1, planos_tab_line, -1):
    stripped = lines[i].strip()
    if stripped == ')}' or stripped == ')':
        planos_close_line = i
        break
print(f"planos_close_line: {planos_close_line+1}: {repr(lines[planos_close_line])}")

# O conteúdo da lista/kanban: de list_div_line até planos_close_line (inclusive)
list_kanban_lines = lines[list_div_line : planos_close_line+1]
print(f"list_kanban_lines: {len(list_kanban_lines)} lines")
print(f"  First: {repr(list_kanban_lines[0])}")
print(f"  Last:  {repr(list_kanban_lines[-1])}")

# ─── Construir o novo bloco do editor inline ──────────────────────
# Indentação base para o conteúdo inline: 18 espaços (dentro de isEditingPlano ? (() => { return ( ... ) })())

INLINE_FORM_INDENT = "                        "  # 24 espaços

new_editor_block = []
new_editor_block.append("              {/* ABA 2: PLANO DE AÇÃO 5W2H */}")
new_editor_block.append("              {activeTab === 'planos' && (")
new_editor_block.append("                isEditingPlano ? (")
new_editor_block.append("                  (() => {")

# Variáveis calculadas com indentação correta
for vl in var_lines:
    stripped = vl.lstrip()
    if stripped:
        new_editor_block.append("                    " + stripped)
    else:
        new_editor_block.append("")

new_editor_block.append("                    return (")
new_editor_block.append("                      <div className=\"bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200\">")
new_editor_block.append("                        <div className=\"flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50 select-none\">")
new_editor_block.append("                          <div className=\"flex items-center gap-3.5\">")
new_editor_block.append("                            <div className=\"w-10 h-10 rounded-2xl bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]\">")
new_editor_block.append("                              <ClipboardList size={18} />")
new_editor_block.append("                            </div>")
new_editor_block.append("                            <div>")
new_editor_block.append("                              <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest leading-none\">")
new_editor_block.append("                                {currentPlano.id ? 'Detalhamento do Plano de Ação' : 'Criar Novo Plano de Ação'}")
new_editor_block.append("                              </h3>")
new_editor_block.append("                              {currentPlano.id && (")
new_editor_block.append("                                <p className=\"text-[10px] font-bold text-slate-400 mt-1\">")
new_editor_block.append("                                  {completedActions} de {totalActions} sub-ações concluídas")
new_editor_block.append("                                </p>")
new_editor_block.append("                              )}")
new_editor_block.append("                            </div>")
new_editor_block.append("                          </div>")
new_editor_block.append("                          <button")
new_editor_block.append("                            type=\"button\"")
new_editor_block.append("                            onClick={() => setIsEditingPlano(false)}")
new_editor_block.append("                            className=\"flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-[#1B4D3E] bg-transparent border-none cursor-pointer transition-colors\"")
new_editor_block.append("                          >")
new_editor_block.append("                            <ArrowLeft size={16} /> Voltar para Planos")
new_editor_block.append("                          </button>")
new_editor_block.append("                        </div>")

# Conteúdo do form - extrair do modal original e re-indentar
# Form vai de form_line até form_end_line
# Indentação base no modal: 14 espaços (dentro de fixed>rounded div)
# Nova indentação: 24 espaços
form_content_lines = lines[form_line : form_end_line+1]
modal_base_indent = 14  # form começa com 14 espaços no modal
new_base_indent = 24    # agora começa com 24 espaços

for fl in form_content_lines:
    stripped = fl.lstrip()
    if stripped:
        # Calcular indentação relativa original
        orig_indent_count = len(fl) - len(fl.lstrip())
        relative_indent = max(0, orig_indent_count - modal_base_indent)
        new_indent = " " * (new_base_indent + relative_indent)
        new_editor_block.append(new_indent + stripped)
    else:
        new_editor_block.append("")

new_editor_block.append("                      </div>")
new_editor_block.append("                    );")
new_editor_block.append("                  })()")
new_editor_block.append("                ) : (")
new_editor_block.append("                  <div className=\"space-y-6\">")

# Conteúdo da lista/kanban - re-indentar
# Indentação base original da lista: 18 espaços (dentro de {activeTab==='planos' && (<div space-y-6>)
# Nova indentação base: 22 espaços (dentro do ramo ternário `: (<div space-y-6>)`)
list_base_indent = 18
new_list_base = 22

for ll in list_kanban_lines:
    stripped = ll.lstrip()
    if stripped:
        orig_indent_count = len(ll) - len(ll.lstrip())
        # O conteúdo interno da div (depois de space-y-6) tem indent >= list_base_indent + 2
        relative_indent = max(0, orig_indent_count - list_base_indent)
        new_indent = " " * (new_list_base + relative_indent)
        new_editor_block.append(new_indent + stripped)
    else:
        new_editor_block.append("")

new_editor_block.append("                  </div>")
new_editor_block.append("                )")
new_editor_block.append("              )}")

# ─── Montar o arquivo final ───────────────────────────────────────
# Parte 1: antes da aba de planos
part1 = lines[:planos_tab_line]

# Parte 2: o novo bloco da aba de planos (editor inline + lista/kanban)  
part2 = new_editor_block

# Parte 3: após o fechamento da aba de planos até antes do modal
part3 = lines[planos_close_line+1 : modal_comment_line]

# Parte 4: comentário substituindo o modal
part4 = ["      {/* Editor de plano movido para inline dentro da aba acima */}"]

# Parte 5: após o modal até o fim
part5 = lines[modal_end_line+1:]

final_lines = part1 + part2 + part3 + part4 + part5

print(f"\nFinal file: {len(final_lines)} lines")
print(f"Part1: {len(part1)} lines (até linha {planos_tab_line})")
print(f"Part2: {len(part2)} lines (novo editor inline)")
print(f"Part3: {len(part3)} lines (aba3 até modal_comment)")
print(f"Part4: {len(part4)} lines (comentário placeholder)")
print(f"Part5: {len(part5)} lines (do modal_end até o fim)")

# Verificação básica: contar chaves/parênteses
text = '\n'.join(final_lines)
open_braces = text.count('{') 
close_braces = text.count('}')
open_parens = text.count('(')
close_parens = text.count(')')
print(f"\nBalance check:")
print(f"  {{}}  Open={open_braces} Close={close_braces} Diff={open_braces-close_braces}")
print(f"  ()  Open={open_parens} Close={close_parens} Diff={open_parens-close_parens}")

with open('app/planejamento/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(final_lines))

print("\nDone!")
