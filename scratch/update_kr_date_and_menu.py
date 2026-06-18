import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add openKrMenuId state definition
state_old = """  // KR modal states
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [currentKrObjectiveId, setCurrentKrObjectiveId] = useState('');
  const [currentKr, setCurrentKr] = useState<Partial<KR>>({"""

state_new = """  // KR modal states
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [currentKrObjectiveId, setCurrentKrObjectiveId] = useState('');
  const [openKrMenuId, setOpenKrMenuId] = useState<string | null>(null);
  const [currentKr, setCurrentKr] = useState<Partial<KR>>({"""

if state_old in content:
    content = content.replace(state_old, state_new)
    print("State openKrMenuId added successfully.")
else:
    print("State definition old pattern not found.")

# 2. Add dataFim to currentKr state default values
current_kr_init_old = """  const [currentKr, setCurrentKr] = useState<Partial<KR>>({
    id: '',
    descricao: '',
    valorInicial: 0,
    valorAlvo: 100,
    valorAtual: 0,
    unidade: '%',
    responsavelId: '',
    status: 'EM_ANDAMENTO',
    tarefas: []
  });"""

current_kr_init_new = """  const [currentKr, setCurrentKr] = useState<Partial<KR>>({
    id: '',
    descricao: '',
    valorInicial: 0,
    valorAlvo: 100,
    valorAtual: 0,
    unidade: '%',
    responsavelId: '',
    status: 'EM_ANDAMENTO',
    tarefas: [],
    dataFim: ''
  });"""

if current_kr_init_old in content:
    content = content.replace(current_kr_init_old, current_kr_init_new)
    print("currentKr init updated with dataFim successfully.")
else:
    print("currentKr init pattern not found.")

# 3. Add dataFim default to handleOpenKrModal
handle_open_old = """      setCurrentKr({
        id: '',
        descricao: '',
        valorInicial: 0,
        valorAlvo: 100,
        valorAtual: 0,
        unidade: '%',
        responsavelId: '',
        status: 'EM_ANDAMENTO',
        tarefas: []
      });"""

handle_open_new = """      setCurrentKr({
        id: '',
        descricao: '',
        valorInicial: 0,
        valorAlvo: 100,
        valorAtual: 0,
        unidade: '%',
        responsavelId: '',
        status: 'EM_ANDAMENTO',
        tarefas: [],
        dataFim: ''
      });"""

if handle_open_old in content:
    content = content.replace(handle_open_old, handle_open_new)
    print("handleOpenKrModal default values updated successfully.")
else:
    print("handleOpenKrModal default values pattern not found.")

# 4. Map dataFim in handleSaveKr
handle_save_old = """    const updatedKr: KR = {
      ...currentKr,
      id: currentKr.id || `kr-${Date.now()}`,
      descricao: currentKr.descricao || '',
      valorInicial: Number(currentKr.valorInicial) || 0,
      valorAlvo: Number(currentKr.valorAlvo) || 0,
      valorAtual: Number(currentKr.valorAtual) || 0,
      unidade: currentKr.unidade || '%',
      responsavelId: currentKr.responsavelId || '',
      status: currentKr.status || 'EM_ANDAMENTO',
      tarefas: currentKr.tarefas || []
    };"""

handle_save_new = """    const updatedKr: KR = {
      ...currentKr,
      id: currentKr.id || `kr-${Date.now()}`,
      descricao: currentKr.descricao || '',
      valorInicial: Number(currentKr.valorInicial) || 0,
      valorAlvo: Number(currentKr.valorAlvo) || 0,
      valorAtual: Number(currentKr.valorAtual) || 0,
      unidade: currentKr.unidade || '%',
      responsavelId: currentKr.responsavelId || '',
      status: currentKr.status || 'EM_ANDAMENTO',
      tarefas: currentKr.tarefas || [],
      dataFim: currentKr.dataFim || ''
    };"""

if handle_save_old in content:
    content = content.replace(handle_save_old, handle_save_new)
    print("handleSaveKr updated with dataFim successfully.")
else:
    print("handleSaveKr pattern not found.")

# 5. Overhaul the KR rendering block inside Resumo view
# Let's locate the KR render start block
target_start = """                                              <div 
                                                key={kr.id} 
                                                onClick={() => handleOpenActionsModal(obj.id, kr)} 
                                                className="py-4 hover:bg-slate-50/30 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                              >"""

# We already verified it ends at line 2709. Let's find index of target_start
start_idx = content.find(target_start)
if start_idx != -1:
    end_pattern = "                                              );\n                                            })"
    end_idx = content.find(end_pattern, start_idx)
    if end_idx != -1:
        full_old_block = content[start_idx:end_idx + len(end_pattern)]
        print("Found KR return block. Length:", len(full_old_block))

        new_kr_layout = """                                              <div 
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
                                            );
                                          })"""
        content = content.replace(full_old_block, new_kr_layout)
        print("KR list layout overhauled successfully with date and click dropdown.")
    else:
        print("Could not find end of KR return block.")
else:
    print("Could not find target_start.")

# 6. Add Date input field in KR edit modal
# Let's replace the grid-cols-2 class block for Responsavel and Status fields
grid_old = """              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Responsável</label>
                  <select
                    value={currentKr.responsavelId || ''}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, responsavelId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="">Nenhum...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={currentKr.status || 'EM_ANDAMENTO'}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Progresso</option>
                    <option value="QUASE_LA">Quase Lá</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>"""

grid_new = """              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Responsável</label>
                  <select
                    value={currentKr.responsavelId || ''}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, responsavelId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="">Nenhum...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prazo (Data)</label>
                  <input
                    type="date"
                    value={currentKr.dataFim || ''}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={currentKr.status || 'EM_ANDAMENTO'}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Progresso</option>
                    <option value="QUASE_LA">Quase Lá</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>"""

if grid_old in content:
    content = content.replace(grid_old, grid_new)
    print("KR edit form grid updated with Date input successfully.")
else:
    print("KR edit form grid pattern not found.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("File page.tsx written successfully.")
