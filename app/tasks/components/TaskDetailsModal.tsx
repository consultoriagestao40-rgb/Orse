import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, User, Plus, Trash2, Paperclip, Send, 
  Tag, AlertTriangle, Users, Eye, History, MessageSquare,
  CheckCircle2, AlertCircle, FileText, Download, Check
} from 'lucide-react';
import { 
  updateTask, deleteTask, updateTaskParticipants, 
  updateTaskObservers, updateTaskTags, createTenantTag, 
  deleteTenantTag, getTenantTags, createTaskActivity, 
  toggleTaskActivity, deleteTaskActivity, addTaskComment, 
  uploadTaskAttachment, downloadTaskAttachment 
} from '../actions';

interface TaskDetailsModalProps {
  task: any;
  stages: any[];
  users: any[];
  onClose: () => void;
  refreshData: (silent?: boolean) => void;
}

export default function TaskDetailsModal({ task, stages, users, onClose, refreshData }: TaskDetailsModalProps) {
  // Task info states
  const [titulo, setTitulo] = useState(task.titulo);
  const [descricao, setDescricao] = useState(task.descricao || '');
  const [prioridade, setPrioridade] = useState(task.prioridade);
  const [vencimento, setVencimento] = useState(
    task.vencimento ? new Date(task.vencimento).toISOString().split('T')[0] : ''
  );
  const [stageId, setStageId] = useState(task.stageId);
  const [responsavelId, setResponsavelId] = useState(task.responsavelId || '');

  // Subtask/Activity states
  const [actTitulo, setActTitulo] = useState('');
  const [actRespId, setActRespId] = useState('');
  const [actVencimento, setActVencimento] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Participant/Observer select states
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    task.participantes?.map((p: any) => p.userId) || []
  );
  const [selectedObservers, setSelectedObservers] = useState<string[]>(
    task.observadores?.map((o: any) => o.userId) || []
  );

  // Tags states
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task.tags?.map((t: any) => t.tagId) || []
  );
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#64748B');

  // Comment & Mention states
  const [commentText, setCommentText] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Saving states
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setTitulo(task.titulo);
    setDescricao(task.descricao || '');
    setPrioridade(task.prioridade);
    setVencimento(task.vencimento ? new Date(task.vencimento).toISOString().split('T')[0] : '');
    setStageId(task.stageId);
    setResponsavelId(task.responsavelId || '');
    setSelectedParticipants(task.participantes?.map((p: any) => p.userId) || []);
    setSelectedObservers(task.observadores?.map((o: any) => o.userId) || []);
    setSelectedTags(task.tags?.map((t: any) => t.tagId) || []);
  }, [task]);

  const loadTags = async () => {
    const res = await getTenantTags();
    if (res.success && res.tags) {
      setAllTags(res.tags);
    }
  };

  // Auto-save basic changes
  const saveField = async (fields: any) => {
    setIsSaving(true);
    await updateTask(task.id, fields);
    setIsSaving(false);
    refreshData(true);
  };

  // Add tag relation
  const handleTagToggle = async (tagId: string) => {
    let updated: string[];
    if (selectedTags.includes(tagId)) {
      updated = selectedTags.filter(id => id !== tagId);
    } else {
      updated = [...selectedTags, tagId];
    }
    setSelectedTags(updated);
    await updateTaskTags(task.id, updated);
    refreshData(true);
  };

  // Add participant
  const handleParticipantToggle = async (userId: string) => {
    let updated: string[];
    if (selectedParticipants.includes(userId)) {
      updated = selectedParticipants.filter(id => id !== userId);
    } else {
      updated = [...selectedParticipants, userId];
    }
    setSelectedParticipants(updated);
    await updateTaskParticipants(task.id, updated);
    refreshData(true);
  };

  // Add observer
  const handleObserverToggle = async (userId: string) => {
    let updated: string[];
    if (selectedObservers.includes(userId)) {
      updated = selectedObservers.filter(id => id !== userId);
    } else {
      updated = [...selectedObservers, userId];
    }
    setSelectedObservers(updated);
    await updateTaskObservers(task.id, updated);
    refreshData(true);
  };

  // Subtask Activity CRUD
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitulo.trim()) return;

    const res = await createTaskActivity(task.id, {
      titulo: actTitulo.trim(),
      responsavelId: actRespId || undefined,
      vencimento: actVencimento || undefined
    });

    if (res.success) {
      setActTitulo('');
      setActRespId('');
      setActVencimento('');
      setIsAddingActivity(false);
      refreshData(true);
    } else {
      alert(res.error || 'Erro ao adicionar atividade');
    }
  };

  const handleToggleActivity = async (id: string, concluida: boolean) => {
    await toggleTaskActivity(id, concluida);
    refreshData(true);
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Deseja remover esta atividade?')) {
      await deleteTaskActivity(id);
      refreshData(true);
    }
  };

  // Comment mentions parsing
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    // Get current cursor index
    const cursor = e.target.selectionStart;
    const lastAtIdx = val.lastIndexOf('@', cursor - 1);

    if (lastAtIdx !== -1 && lastAtIdx >= val.lastIndexOf(' ', cursor - 1)) {
      const search = val.substring(lastAtIdx + 1, cursor);
      setMentionSearch(search);
      setShowMentionDropdown(true);
      setMentionIndex(lastAtIdx);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (userNome: string) => {
    if (mentionIndex === -1) return;
    const before = commentText.substring(0, mentionIndex);
    const after = commentText.substring(commentInputRef.current?.selectionStart || 0);
    const completedText = `${before}@${userNome} ${after}`;
    setCommentText(completedText);
    setShowMentionDropdown(false);
    commentInputRef.current?.focus();
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await addTaskComment(task.id, commentText.trim());
    if (res.success) {
      setCommentText('');
      refreshData(true);
    } else {
      alert(res.error || 'Erro ao adicionar comentário');
    }
  };

  // Parse @mentions for display styling (removes @ and styles name blue)
  const renderCommentText = (texto: string) => {
    const tokens = texto.split(/(@[a-zA-Z0-9À-ÿ\s]+?)(?=\s|$)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('@')) {
        const nome = token.substring(1);
        // Validate if it is a real user in the system
        const exists = users.some(u => u.nome.toLowerCase() === nome.toLowerCase());
        if (exists) {
          return (
            <span key={i} className="text-blue-600 font-bold hover:underline cursor-pointer">
              {nome}
            </span>
          );
        }
      }
      return token;
    });
  };

  // File attachments handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await uploadTaskAttachment(task.id, file.name, file.size, file.type, base64);
      if (res.success) {
        refreshData(true);
      } else {
        alert(res.error || 'Erro ao anexar arquivo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadAttachment = async (id: string, name: string, type: string) => {
    const res = await downloadTaskAttachment(id);
    if (res.success && res.attachment) {
      const link = document.createElement('a');
      link.href = res.attachment.base64Data;
      link.download = name;
      link.click();
    } else {
      alert('Erro ao carregar arquivo para download');
    }
  };

  // Create Tag in tag manager
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const res = await createTenantTag(newTagName.trim(), newTagColor);
    if (res.success && res.tag) {
      setAllTags([...allTags, res.tag]);
      setNewTagName('');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('Deseja excluir esta tag do sistema?')) {
      const res = await deleteTenantTag(id);
      if (res.success) {
        setAllTags(allTags.filter(t => t.id !== id));
        setSelectedTags(selectedTags.filter(t => t !== id));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-[#1B4D3E]/10 text-[#1B4D3E] px-2.5 py-1 rounded-lg">
              T-{task.codigo || task.id.substring(0, 5)}
            </span>
            <input 
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onBlur={() => saveField({ titulo })}
              className="text-lg font-black text-slate-800 bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-[#1B4D3E] px-2 py-0.5 rounded-xl w-[260px] sm:w-[450px]"
            />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 p-1 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Main Details (Col Left) */}
          <div className="flex-1 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FileText size={14} /> Descrição
              </h4>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                onBlur={() => saveField({ descricao })}
                placeholder="Insira detalhes adicionais sobre esta tarefa..."
                className="w-full min-h-[90px] max-h-[160px] p-3 border border-slate-200 rounded-2xl outline-none focus:border-[#1B4D3E] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:bg-white transition-all resize-y"
              />
            </div>

            {/* Subtasks (Atividades) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Subtarefas / Atividades
                </h4>
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#1B4D3E] hover:underline bg-transparent border-none cursor-pointer"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              {isAddingActivity && (
                <form onSubmit={handleAddActivity} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl mb-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Título da Subtarefa *</label>
                      <input 
                        required 
                        value={actTitulo} 
                        onChange={e => setActTitulo(e.target.value)} 
                        className="w-full p-2 text-xs border border-slate-200 rounded-xl"
                        placeholder="Ex: Revisar escopo comercial" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Responsável</label>
                      <select 
                        value={actRespId} 
                        onChange={e => setActRespId(e.target.value)} 
                        className="w-full p-2 text-xs border border-slate-200 rounded-xl"
                      >
                        <option value="">Delegar para...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingActivity(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 bg-white"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-[#1B4D3E] text-white rounded-xl text-[10px] font-bold"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              )}

              {task.atividades && task.atividades.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10">Ok</th>
                        <th className="py-2.5 px-3">Subtarefa</th>
                        <th className="py-2.5 px-3">Responsável</th>
                        <th className="py-2.5 px-3 w-12 text-center">Excluir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {task.atividades.map((act: any) => (
                        <tr key={act.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={act.concluida} 
                              onChange={e => handleToggleActivity(act.id, e.target.checked)}
                              className="w-4 h-4 text-[#1B4D3E] rounded border-slate-300 focus:ring-[#1B4D3E]"
                            />
                          </td>
                          <td className={`py-2.5 px-3 ${act.concluida ? 'line-through text-slate-400' : ''}`}>
                            {act.titulo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {act.responsavel?.nome || 'Não delegado'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic">Nenhuma subtarefa registrada.</p>
              )}
            </div>

            {/* Attachments (Anexos) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Paperclip size={14} /> Anexar Arquivos
                </h4>
                <label className="flex items-center gap-1 text-[11px] font-bold text-[#1B4D3E] hover:underline cursor-pointer">
                  <Plus size={12} /> Adicionar
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((file: any) => {
                    const isImg = file.tipo.startsWith('image/');
                    return (
                      <div key={file.id} className="p-3 border border-slate-200 rounded-2xl flex items-center justify-between bg-white hover:border-[#1B4D3E]/30 transition-colors shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden border border-slate-200">
                            {isImg && task.attachments.find((f: any) => f.id === file.id)?.base64Data ? (
                              <img src={task.attachments.find((f: any) => f.id === file.id).base64Data} className="w-full h-full object-cover" />
                            ) : (
                              <FileText size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 truncate">{file.nome}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">
                              {(file.tamanho / 1024).toFixed(1)} KB • Por {file.user?.nome || 'Sistema'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(file.id, file.nome, file.tipo)}
                          className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl border-none bg-transparent cursor-pointer"
                          title="Baixar arquivo"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic">Nenhum arquivo anexado.</p>
              )}
            </div>

            {/* Comments with Auto-complete Mentions */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <MessageSquare size={14} /> Comentários e Menções
              </h4>

              <form onSubmit={handleAddCommentSubmit} className="relative mb-4">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={handleCommentChange}
                  placeholder="Escreva um comentário... Use @ para mencionar alguém de sua equipe"
                  className="w-full min-h-[72px] p-3 pr-12 border border-slate-200 rounded-2xl outline-none focus:border-[#1B4D3E] text-xs font-semibold text-slate-700 resize-none"
                />
                <button
                  type="submit"
                  className="absolute right-3 bottom-3 p-2 bg-[#1B4D3E] text-white rounded-xl hover:bg-[#13382d] transition-colors border-none cursor-pointer"
                >
                  <Send size={14} />
                </button>

                {/* Autocomplete Dropdown */}
                {showMentionDropdown && (
                  <div className="absolute left-0 bottom-full mb-1 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 z-50 text-slate-200 max-h-40 overflow-y-auto">
                    <div className="px-2.5 py-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
                      Mencionar Membro da Equipe
                    </div>
                    {users
                      .filter(u => u.nome.toLowerCase().includes(mentionSearch.toLowerCase()))
                      .map(u => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectMention(u.nome)}
                          className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors truncate"
                        >
                          {u.nome} <span className="text-[10px] text-slate-500 font-medium">({u.cargo || 'Membro'})</span>
                        </div>
                      ))}
                  </div>
                )}
              </form>

              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {task.comments.map((comment: any) => (
                    <div key={comment.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-2xl shadow-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wide">
                          {comment.user?.nome}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {new Date(comment.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                        {renderCommentText(comment.texto)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic">Nenhum comentário registrado.</p>
              )}
            </div>
          </div>

          {/* Sidebar Metadata (Col Right) */}
          <div className="w-full lg:w-72 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 shrink-0 h-fit">
            {/* Stage */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Etapa no Kanban</label>
              <select
                value={stageId}
                onChange={e => {
                  setStageId(e.target.value);
                  saveField({ stageId: e.target.value });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white cursor-pointer"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</label>
              <select
                value={responsavelId}
                onChange={e => {
                  setResponsavelId(e.target.value);
                  saveField({ responsavelId: e.target.value });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white cursor-pointer"
              >
                <option value="">Não delegado</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vencimento</label>
              <div className="relative">
                <input
                  type="date"
                  value={vencimento}
                  onChange={e => {
                    setVencimento(e.target.value);
                    saveField({ vencimento: e.target.value || null });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={e => {
                  setPrioridade(e.target.value);
                  saveField({ prioridade: e.target.value });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white cursor-pointer"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>

            {/* Tags (Labels) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etiquetas / Tags</label>
                <button
                  onClick={() => setShowTagManager(!showTagManager)}
                  className="text-[9px] font-bold text-[#1B4D3E] hover:underline bg-transparent border-none cursor-pointer"
                >
                  {showTagManager ? 'Fechar' : 'Gerenciar'}
                </button>
              </div>

              {showTagManager ? (
                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 mb-2.5">
                  <div className="flex gap-1.5">
                    <input 
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="Nome da tag"
                      className="text-xs p-1.5 border border-slate-200 rounded-lg flex-1 outline-none"
                    />
                    <input 
                      type="color" 
                      value={newTagColor}
                      onChange={e => setNewTagColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
                    />
                    <button 
                      onClick={handleCreateTag}
                      className="px-2 bg-[#1B4D3E] text-white rounded-lg text-xs font-bold hover:bg-[#13382d] border-none cursor-pointer"
                    >
                      Ok
                    </button>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                    {allTags.map(tag => (
                      <div key={tag.id} className="flex justify-between items-center gap-1.5">
                        <span 
                          style={{ backgroundColor: tag.color }}
                          className="text-[9px] font-bold text-white px-2 py-0.5 rounded truncate flex-1"
                        >
                          {tag.nome}
                        </span>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-1 mb-2">
                {allTags.map(tag => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <div 
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      style={{ 
                        backgroundColor: active ? tag.color : '#F1F5F9',
                        color: active ? '#FFFFFF' : '#475569',
                        borderColor: active ? tag.color : '#E2E8F0'
                      }}
                      className="text-[9px] font-bold border px-2 py-0.5 rounded-lg cursor-pointer transition-colors hover:scale-102 flex items-center gap-1"
                    >
                      {active && <Check size={8} className="stroke-[3]" />}
                      {tag.nome}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Participants & Observers */}
            <div className="space-y-4 pt-1">
              {/* Participants */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Users size={12} /> Participantes
                </label>
                <div className="border border-slate-200 bg-white rounded-xl p-2.5 max-h-32 overflow-y-auto space-y-1">
                  {users.map(u => {
                    const active = selectedParticipants.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleParticipantToggle(u.id)}
                        className={`flex items-center gap-2 p-1 rounded-lg cursor-pointer transition-colors ${
                          active ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={active} 
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-[#1B4D3E] rounded border-slate-300 pointer-events-none"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate">{u.nome}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Observers */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye size={12} /> Observadores
                </label>
                <div className="border border-slate-200 bg-white rounded-xl p-2.5 max-h-32 overflow-y-auto space-y-1">
                  {users.map(u => {
                    const active = selectedObservers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleObserverToggle(u.id)}
                        className={`flex items-center gap-2 p-1 rounded-lg cursor-pointer transition-colors ${
                          active ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={active} 
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-[#1B4D3E] rounded border-slate-300 pointer-events-none"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate">{u.nome}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Audit History Log */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <History size={12} /> Histórico de Alterações
              </label>
              <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                {task.history?.map((log: any) => (
                  <div key={log.id} className="text-[10px] leading-relaxed text-slate-500 font-semibold">
                    <span className="text-slate-400 font-bold block">
                      {new Date(log.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    {log.descricao}
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Task Button */}
            <div className="pt-2">
              <button
                onClick={async () => {
                  if (confirm('Deseja realmente remover esta tarefa?')) {
                    const res = await deleteTask(task.id);
                    if (res.success) {
                      onClose();
                      refreshData(true);
                    } else {
                      alert(res.error || 'Erro ao deletar tarefa');
                    }
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-rose-200 bg-rose-50/20 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors border-dashed cursor-pointer"
              >
                <Trash2 size={13} /> Excluir Tarefa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
