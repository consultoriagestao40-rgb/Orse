import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update lucide-react imports to include MoreHorizontal
import_old = """  Network,
  GitBranch,
  Calendar,
  MessageSquare
} from 'lucide-react';"""

import_new = """  Network,
  GitBranch,
  Calendar,
  MessageSquare,
  MoreHorizontal
} from 'lucide-react';"""

if import_old in content:
    content = content.replace(import_old, import_new)
    print("Lucide import updated successfully.")
else:
    print("Lucide import pattern not found.")

# 2. Update Objective title casing in Resumo view (remove uppercase)
casing_old_resumo = """                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-snug break-words">"""
casing_new_resumo = """                                        <h3 className="text-sm font-black text-slate-800 tracking-wide leading-snug break-words">"""

if casing_old_resumo in content:
    content = content.replace(casing_old_resumo, casing_new_resumo)
    print("Objective title casing in Resumo updated successfully.")
else:
    print("Objective title casing in Resumo not found.")

# 3. Update Objective title casing in Árvore view (remove uppercase)
casing_old_arvore = """                                        <h5 className="text-xs font-black text-slate-800 mt-2 line-clamp-2 uppercase tracking-wide">"""
casing_new_arvore = """                                        <h5 className="text-xs font-black text-slate-800 mt-2 line-clamp-2 tracking-wide">"""

if casing_old_arvore in content:
    content = content.replace(casing_old_arvore, casing_new_arvore)
    print("Objective title casing in Árvore updated successfully.")
else:
    print("Objective title casing in Árvore not found.")

# 4. Update Tree view avatar rendering to support avatarUrl
tree_avatar_old = """                                                     {responsavel && (
                                                       <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 justify-end">
                                                         <span className="text-[8.5px] font-bold text-slate-550 truncate max-w-[120px]">{responsavel.nome}</span>
                                                         <div className="w-4 h-4 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-[7px] font-bold uppercase shrink-0">
                                                           {initials}
                                                         </div>
                                                       </div>
                                                     )}"""

tree_avatar_new = """                                                     {responsavel && (
                                                       <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 justify-end">
                                                         <span className="text-[8.5px] font-bold text-slate-550 truncate max-w-[120px]">{responsavel.nome}</span>
                                                         <div className="w-4 h-4 rounded-full border border-slate-150 overflow-hidden bg-[#7C3AED]/20 flex items-center justify-center shrink-0">
                                                           {responsavel.avatarUrl ? (
                                                             <img src={responsavel.avatarUrl} alt={responsavel.nome} className="w-full h-full object-cover" />
                                                           ) : (
                                                             <span className="text-[7px] font-bold uppercase text-[#7C3AED]">{initials}</span>
                                                           )}
                                                         </div>
                                                       </div>
                                                     )}"""

if tree_avatar_old in content:
    content = content.replace(tree_avatar_old, tree_avatar_new)
    print("Tree view avatar updated successfully.")
else:
    # Let's try matching with single line changes if spacing is slightly different
    print("Tree view avatar old pattern not found exactly.")

# 5. Overhaul the KR rendering block in Resumo view (horizontal side-by-side layout, borderless rows)
# First replace the parent container from space-y-4 to divide-y divide-slate-100
parent_old = """                                    <div className="pt-4 border-t border-slate-100 space-y-4 pl-2 sm:pl-4">"""
parent_new = """                                    <div className="border-t border-slate-100 divide-y divide-slate-100 pl-2 sm:pl-4">"""

if parent_old in content:
    content = content.replace(parent_old, parent_new)
    print("Parent container divide-y updated successfully.")
else:
    print("Parent container divide-y pattern not found.")

# Now replace the return (...) block of the KR row map:
# Let's extract and replace the code inside:
# `return (\n                                              <div\n                                                key={kr.id}`
# up to:
# `                                              </div>\n                                            );`
# Since multiline exact search is sensitive, let's find the start and end of that return statement.

target_start = """                                            return (
                                              <div 
                                                key={kr.id} 
                                                onClick={() => handleOpenActionsModal(obj.id, kr)} className="bg-slate-50/40 border border-slate-200 hover:border-slate-350 hover:bg-slate-50/60 rounded-2xl p-4 transition-all duration-250 space-y-3 relative cursor-pointer"
                                              >"""

target_end = """                                              </div>
                                            );"""

start_idx = content.find(target_start)
if start_idx != -1:
    # We find target_end after start_idx
    # Wait, there are multiple `</div>\n                                            );` patterns?
    # Let's find the one matching the end of the kr.map block.
    # In page.tsx:
    # ...
    #                     return (
    #                       <div key={kr.id} onClick=... className=...>
    #                          ...
    #                       </div>
    #                     );
    #                   })
    #               )}
    #             </div>
    #           )}
    # Let's find target_end by matching curly braces or looking for:
    # `                                                </div>\n                                              </div>\n                                            );`
    # Let's see the end lines from lines 2685-2700:
    # 2690:                                                   </div>
    # 2691:                                                 </div>
    # 2692: 
    # 2693:                                                 
    # 2694:                                               </div>
    # 2695:                                             );
    # So the block ends at line 2695 with:
    # `                                              </div>\n                                            );`
    
    # Let's find the next occurrence of `                                              </div>\n                                            );`
    end_pattern = "                                              </div>\n                                            );"
    end_idx = content.find(end_pattern, start_idx)
    if end_idx != -1:
        full_old_block = content[start_idx:end_idx + len(end_pattern)]
        print("Found KR return block. Length:", len(full_old_block))
        
        # Build the new side-by-side, borderless KR layout block
        new_kr_layout = """                                            return (
                                              <div 
                                                key={kr.id} 
                                                onClick={() => handleOpenActionsModal(obj.id, kr)} 
                                                className="py-4 hover:bg-slate-50/30 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                              >
                                                {/* Left Column: Description & Progress */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                  <div className="flex justify-between items-start gap-4">
                                                    <p className="text-xs font-black text-slate-750">
                                                      KR {objIdx + 1}.{krIdx + 1}: {kr.descricao}
                                                    </p>
                                                    <span className="text-xs font-black text-slate-800 shrink-0">
                                                      {formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}
                                                    </span>
                                                  </div>

                                                  {/* Purple progress bar matching Mereo style */}
                                                  <div className="relative w-full pt-1 pb-4">
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                      <div 
                                                        className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
                                                        style={{ width: `${limitedKrProgress}%` }}
                                                      ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400 mt-0.5">
                                                      <span>0%</span>
                                                      <span>100%</span>
                                                    </div>
                                                    <div 
                                                      className="absolute text-[9px] font-black text-[#7C3AED] mt-0.5 -translate-x-1/2 transition-all duration-350"
                                                      style={{ left: `${limitedKrProgress}%`, top: '6px' }}
                                                    >
                                                      {limitedKrProgress}%
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Right Column: Status, Owner & Actions Menu */}
                                                <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end md:w-[35%] lg:w-[30%]">
                                                  {/* Status Badge */}
                                                  <span className={`text-[8.5px] font-black px-2.5 py-1 rounded-lg uppercase border tracking-wider shrink-0 ${
                                                    kr.status === 'CONCLUIDO' ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]' :
                                                    kr.status === 'QUASE_LA' ? 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]' :
                                                    kr.status === 'EM_ANDAMENTO' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' :
                                                    'bg-slate-50 text-slate-650 border-slate-255'
                                                  }`}>
                                                    {kr.status === 'CONCLUIDO' ? 'Concluído' :
                                                     kr.status === 'QUASE_LA' ? 'Quase Lá' :
                                                     kr.status === 'EM_ANDAMENTO' ? 'Em Progresso' : 'Pendente'}
                                                  </span>

                                                  {/* Avatar & Name */}
                                                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-0.5 shadow-3xs shrink-0">
                                                    {responsavelKr?.avatarUrl ? (
                                                      <img 
                                                        src={responsavelKr.avatarUrl} 
                                                        alt={responsavelKr.nome} 
                                                        className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0" 
                                                      />
                                                    ) : (
                                                      <div className="w-5 h-5 rounded-full bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center text-[7.5px] font-bold uppercase shrink-0">
                                                        {initialsKr}
                                                      </div>
                                                    )}
                                                    <span className="text-[9px] font-black text-slate-600 truncate max-w-[100px]">
                                                      {responsavelKr ? responsavelKr.nome : 'Sem responsável'}
                                                    </span>
                                                  </div>

                                                  {/* Actions Dropdown Menu */}
                                                  <div className="relative group/menu shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                                                      title="Menu de Ações"
                                                    >
                                                      <MoreHorizontal size={16} />
                                                    </button>
                                                    <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 hidden group-hover/menu:block hover:block z-20">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenActionsModal(obj.id, kr);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs text-slate-750 hover:bg-slate-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                      >
                                                        Ações ({kr.tarefas?.length || 0})
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleOpenKrModal(obj.id, kr);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs text-slate-750 hover:bg-slate-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                      >
                                                        <Edit size={12} /> Editar
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteKr(obj.id, kr.id);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                      >
                                                        <Trash2 size={12} /> Excluir
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );"""
        content = content.replace(full_old_block, new_kr_layout)
        print("Overhauled KR rendering block successfully.")
    else:
        print("Could not find end of KR return block.")
else:
    print("Could not find KR return block start.")

# Save modified content
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx saved successfully.")
