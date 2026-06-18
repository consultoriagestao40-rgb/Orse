import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "return (" with specific key={kr.id} inside
marker = 'onClick={() => handleOpenActionsModal(obj.id, kr)}'
start_idx = content.find(marker)
if start_idx != -1:
    # Find the "return (" before this marker
    return_idx = content.rfind("return (", 0, start_idx)
    if return_idx != -1:
        # Find the closing ");" and "})" after start_idx
        # Let's scan forward for the correct matching sequence
        scan_idx = start_idx
        while True:
            close_idx = content.find(");", scan_idx)
            if close_idx == -1:
                print("Could not find );")
                break
            
            # Check if followed by "})" (with correct spacing/newlines)
            # In our file, lines are separated by \n or \r\n
            # Let's inspect the characters following close_idx + 2
            next_part = content[close_idx + 2:close_idx + 100]
            # Strip spaces and newlines to see if it starts with "})"
            stripped = next_part.strip()
            if stripped.startswith("}"):
                # We found the end!
                # Let's find where the "}" ends in next_part
                end_in_next = next_part.find("}")
                full_end_idx = close_idx + 2 + end_in_next + 1
                
                full_old_block = content[return_idx:full_end_idx]
                print("Found old block to replace. Length:", len(full_old_block))
                
                new_kr_layout = """                                            return (
                                              <div 
                                                key={kr.id} 
                                                onClick={() => handleOpenActionsModal(obj.id, kr)} 
                                                className="py-4 hover:bg-slate-50/30 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                              >
                                                {/* Left Column: Description, Date & Progress */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                  <div className="flex justify-between items-start gap-4">
                                                    <div className="min-w-0">
                                                      <p className="text-xs font-black text-slate-750">
                                                        KR {objIdx + 1}.{krIdx + 1}: {kr.descricao}
                                                      </p>
                                                      {kr.dataFim && (
                                                        <div className="text-[9.5px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                          <Calendar size={11} className="text-slate-400 shrink-0" />
                                                          <span>Prazo: {formatLocalDate(kr.dataFim)}</span>
                                                        </div>
                                                      )}
                                                    </div>
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
                                                    'bg-slate-50 text-slate-655 border-slate-255'
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
                                                  <div className="relative shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenKrMenuId(openKrMenuId === kr.id ? null : kr.id);
                                                      }}
                                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                                                      title="Menu de Ações"
                                                    >
                                                      <MoreHorizontal size={16} />
                                                    </button>
                                                    {openKrMenuId === kr.id && (
                                                      <>
                                                        <div 
                                                          className="fixed inset-0 z-10 cursor-default" 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenKrMenuId(null);
                                                          }}
                                                        />
                                                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-32 z-20">
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setOpenKrMenuId(null);
                                                              handleOpenActionsModal(obj.id, kr);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-slate-755 hover:bg-slate-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                          >
                                                            Ações ({kr.tarefas?.length || 0})
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setOpenKrMenuId(null);
                                                              handleOpenKrModal(obj.id, kr);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-slate-755 hover:bg-slate-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                          >
                                                            <Edit size={12} /> Editar
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setOpenKrMenuId(null);
                                                              handleDeleteKr(obj.id, kr.id);
                                                            }}
                                                            className="w-full text-left px-3 py-1.5 text-xs text-red-655 hover:bg-red-50 cursor-pointer border-none bg-transparent flex items-center gap-1.5 font-bold"
                                                          >
                                                            <Trash2 size={12} /> Excluir
                                                          </button>
                                                        </div>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            )"""
                content = content.replace(full_old_block, new_kr_layout)
                print("Replaced successfully!")
                break
            else:
                # Scan from next position
                scan_idx = close_idx + 2

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
