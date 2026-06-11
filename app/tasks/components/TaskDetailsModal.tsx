import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, User, Plus, Trash2, Paperclip, Send, 
  Tag, AlertTriangle, Users, Eye, History, MessageSquare,
  CheckCircle2, AlertCircle, FileText, Download, Check, Edit2,
  FileSpreadsheet, FileImage, File, Reply, CornerDownRight, FilePlus2
} from 'lucide-react';
import { 
  createTask, updateTask, deleteTask, updateTaskParticipants, 
  updateTaskObservers, updateTaskTags, createTenantTag, 
  deleteTenantTag, getTenantTags, createTaskActivity, 
  toggleTaskActivity, deleteTaskActivity, updateTaskActivity, addTaskComment, 
  uploadTaskAttachment, downloadTaskAttachment 
} from '../actions';

const themeColorsGrid = [
  ['#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646'],
  ['#f2f2f2', '#7f7f7f', '#f4f3ed', '#dce6f1', '#e9edf4', '#f2dbdb', '#ebf1de', '#e8e5ee', '#e5f3f5', '#fdeada'],
  ['#d9d9d9', '#595959', '#ebe9df', '#b8cce4', '#cfdae8', '#e6b8b7', '#d7e3bc', '#ccc1da', '#c3e6ec', '#fbd5b5'],
  ['#bfbfbf', '#3f3f3f', '#dddcd2', '#95b3d7', '#b5c7e0', '#d99694', '#c3d69b', '#b2a1c7', '#a3d8e2', '#fac090'],
  ['#a6a6a6', '#262626', '#c4c3b9', '#16365c', '#3b618e', '#903c39', '#748c41', '#604a7b', '#388194', '#b97034'],
  ['#7f7f7f', '#0d0d0d', '#a2a29a', '#0f243e', '#27415f', '#602826', '#4e5d2b', '#403152', '#255663', '#7c4b22']
];

const standardColors = [
  '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
];

const getFileIcon = (filename: string, contentType: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (contentType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return { icon: <FileImage size={18} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100' };
  }
  if (ext === 'pdf') {
    return { icon: <FileText size={18} className="text-rose-500" />, bg: 'bg-rose-50 border-rose-100' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return { icon: <FileSpreadsheet size={18} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' };
  }
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
    return { icon: <FileText size={18} className="text-blue-600" />, bg: 'bg-blue-50/50 border-blue-100' };
  }
  return { icon: <File size={18} className="text-slate-400" />, bg: 'bg-slate-50 border-slate-200' };
};

interface TaskDetailsModalProps {
  task: any;
  stages: any[];
  users: any[];
  onClose: () => void;
  refreshData: (silent?: boolean) => void;
}

export default function TaskDetailsModal({ task, stages, users, onClose, refreshData }: TaskDetailsModalProps) {
  const isCompleted = task.status === 'CONCLUIDA';

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
  const [atividades, setAtividades] = useState<any[]>(task.atividades || []);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const totalActivities = atividades.length;
  const completedActivities = atividades.filter((act: any) => act.concluida).length;
  const percentComplete = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

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

  // Color picker states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Editing and delegation states
  const [isEditing, setIsEditing] = useState(false);
  const [showDelegarPopover, setShowDelegarPopover] = useState(false);
  const delegarPopoverRef = useRef<HTMLDivElement>(null);
  const [showResponsavelPopover, setShowResponsavelPopover] = useState(false);
  const responsavelPopoverRef = useRef<HTMLDivElement>(null);

  // Inline activity editing states
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editingActivityTitulo, setEditingActivityTitulo] = useState('');
  const [editingActivityVencId, setEditingActivityVencId] = useState<string | null>(null);
  const [editingActivityVencimento, setEditingActivityVencimento] = useState('');
  const [actRespPopoverId, setActRespPopoverId] = useState<string | null>(null);
  const actRespPopoverRef = useRef<HTMLDivElement>(null);

  // Custom alert/prompt/confirm modal (CRM-style)
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    type: 'alert',
    onConfirm: () => {}
  });

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const showCustomAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (delegarPopoverRef.current && !delegarPopoverRef.current.contains(event.target as Node)) {
        setShowDelegarPopover(false);
      }
      if (responsavelPopoverRef.current && !responsavelPopoverRef.current.contains(event.target as Node)) {
        setShowResponsavelPopover(false);
      }
      if (actRespPopoverRef.current && !actRespPopoverRef.current.contains(event.target as Node)) {
        setActRespPopoverId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setAtividades(task.atividades || []);
    setIsEditing(false);
  }, [task]);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [task.comments]);

  const handleTransformIntoTask = async (act: any) => {
    if (isCompleted) return;
    
    showCustomConfirm(
      'Transformar em Tarefa',
      `Deseja transformar a subtarefa "${act.titulo}" em uma tarefa independente no Kanban? Ela será removida desta lista.`,
      async () => {
        const firstStageId = stages[0]?.id;
        if (!firstStageId) {
          showCustomAlert('Erro', 'Não foi possível encontrar as etapas do Kanban.');
          return;
        }
        
        setIsSaving(true);
        const resCreate = await createTask({
          titulo: act.titulo,
          descricao: `Criada a partir de uma subtarefa da tarefa: "${task.titulo}"`,
          stageId: firstStageId,
          responsavelId: act.responsavelId || undefined,
          vencimento: act.vencimento || undefined,
          prioridade: task.prioridade
        });
        
        if (resCreate.success) {
          const resDelete = await deleteTaskActivity(act.id);
          if (resDelete.success) {
            showCustomAlert('Sucesso', 'Subtarefa transformada em tarefa independente com sucesso!');
            refreshData(true);
          } else {
            showCustomAlert('Aviso', 'Tarefa criada, mas não foi possível remover a subtarefa da lista.');
            refreshData(true);
          }
        } else {
          showCustomAlert('Erro', resCreate.error || 'Erro ao criar tarefa independente.');
        }
        setIsSaving(false);
      }
    );
  };

  const loadTags = async () => {
    const res = await getTenantTags();
    if (res.success && res.tags) {
      setAllTags(res.tags);
    }
  };

  // Auto-save basic changes
  const saveField = async (fields: any) => {
    if (isCompleted) return;
    setIsSaving(true);
    await updateTask(task.id, fields);
    setIsSaving(false);
    refreshData(true);
  };

  // Add tag relation
  const handleTagToggle = async (tagId: string) => {
    if (isCompleted) return;
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
    if (isCompleted) return;
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
    if (isCompleted) return;
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
  const handleAddActivity = async (e?: React.FormEvent) => {
    if (isCompleted) return;
    if (e) e.preventDefault();
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
      showCustomAlert('Erro', res.error || 'Erro ao adicionar atividade');
    }
  };

  const handleToggleActivity = async (id: string, concluida: boolean) => {
    if (isCompleted) return;
    // Optimistic update
    setAtividades(prev => prev.map(act => act.id === id ? { ...act, concluida } : act));
    try {
      await toggleTaskActivity(id, concluida);
      refreshData(true);
    } catch (err) {
      setAtividades(prev => prev.map(act => act.id === id ? { ...act, concluida: !concluida } : act));
      showCustomAlert('Erro', 'Erro ao atualizar atividade');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (isCompleted) return;
    showCustomConfirm(
      'Remover Atividade',
      'Deseja realmente remover esta subtarefa/atividade?',
      async () => {
        await deleteTaskActivity(id);
        refreshData(true);
      }
    );
  };

  const handleSaveActivityTitulo = async (activityId: string) => {
    if (!editingActivityTitulo.trim()) return;
    const res = await updateTaskActivity(activityId, { titulo: editingActivityTitulo.trim() });
    if (res.success) {
      setEditingActivityId(null);
      refreshData(true);
    } else {
      showCustomAlert('Erro', res.error || 'Erro ao salvar subtarefa');
    }
  };

  const handleSaveActivityField = async (activityId: string, data: { responsavelId?: string | null, vencimento?: string | null }) => {
    const res = await updateTaskActivity(activityId, data);
    if (res.success) {
      refreshData(true);
    } else {
      showCustomAlert('Erro', res.error || 'Erro ao atualizar subtarefa');
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

  const parseComment = (texto: string) => {
    const match = texto.match(/^\[reply:([^\]]+)\]\s*(.*)$/s);
    if (match) {
      return { parentId: match[1], cleanText: match[2] };
    }
    return { parentId: null, cleanText: texto };
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    if (isCompleted) return;
    e.preventDefault();
    if (!commentText.trim()) return;

    let finalVal = commentText.trim();
    if (replyingTo) {
      finalVal = `[reply:${replyingTo.id}] ${commentText.trim()}`;
    }

    const res = await addTaskComment(task.id, finalVal);
    if (res.success) {
      setCommentText('');
      setReplyingTo(null);
      refreshData(true);
    } else {
      showCustomAlert('Erro', res.error || 'Erro ao adicionar comentário');
    }
  };

  // Parse @mentions for display styling (removes @ and styles name blue)
  const renderCommentText = (texto: string) => {
    if (!texto) return '';

    const sortedUsers = [...users].sort((a, b) => b.nome.length - a.nome.length);
    let parts: any[] = [texto];

    for (const u of sortedUsers) {
      const mention = `@${u.nome}`;
      const newParts: any[] = [];

      for (const part of parts) {
        if (typeof part === 'string') {
          const subparts = part.split(mention);
          for (let i = 0; i < subparts.length; i++) {
            newParts.push(subparts[i]);
            if (i < subparts.length - 1) {
              newParts.push(
                <span key={`${u.id}-${i}`} className="text-blue-600 font-bold hover:underline cursor-pointer">
                  {u.nome}
                </span>
              );
            }
          }
        } else {
          newParts.push(part);
        }
      }
      parts = newParts;
    }

    return parts;
  };

  // File attachments handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCompleted) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await uploadTaskAttachment(task.id, file.name, file.size, file.type, base64);
      if (res.success) {
        refreshData(true);
      } else {
        showCustomAlert('Erro', res.error || 'Erro ao anexar arquivo');
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
      showCustomAlert('Erro', 'Erro ao carregar arquivo para download');
    }
  };

  // Create Tag in tag manager
  const handleCreateTag = async () => {
    if (isCompleted) return;
    if (!newTagName.trim()) return;
    const res = await createTenantTag(newTagName.trim(), newTagColor);
    if (res.success && res.tag) {
      setAllTags([...allTags, res.tag]);
      setNewTagName('');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (isCompleted) return;
    showCustomConfirm(
      'Excluir Tag',
      'Deseja realmente excluir esta tag do sistema?',
      async () => {
        const res = await deleteTenantTag(id);
        if (res.success) {
          setAllTags(allTags.filter(t => t.id !== id));
          setSelectedTags(selectedTags.filter(t => t !== id));
        }
      }
    );
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
            {isEditing ? (
              <input 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="text-lg font-black text-slate-800 bg-white border border-slate-200 focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] px-3 py-1 rounded-xl w-[260px] sm:w-[450px] outline-none"
                placeholder="Título da tarefa..."
              />
            ) : (
              <h3 className="text-lg font-black text-slate-800 px-2 py-1">
                {titulo}
              </h3>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650 p-1 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 min-h-0 max-w-full">
          {/* Main Details (Col Left) */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <FileText size={14} /> Descrição
              </h4>
              {isEditing ? (
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Insira detalhes adicionais sobre esta tarefa..."
                  className="w-full min-h-[90px] max-h-[160px] p-3 border border-slate-200 rounded-2xl outline-none focus:border-[#1B4D3E] text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white transition-all resize-y"
                />
              ) : (
                <div className="w-full min-h-[90px] p-3.5 border border-transparent bg-slate-50/50 rounded-2xl text-xs font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {descricao || <span className="text-slate-400 italic">Sem descrição.</span>}
                </div>
              )}
                     {/* Subtasks (Atividades) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Subtarefas / Atividades
                </h4>
              </div>

              {/* Barra de Progresso */}
              {atividades.length > 0 && (
                <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-slate-650">
                    <span>Progresso das subtarefas ({percentComplete}%)</span>
                    <span>{completedActivities}/{totalActivities}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden border border-slate-250/30">
                    <div 
                      style={{ width: `${percentComplete}%` }} 
                      className="h-full bg-[#1B4D3E] transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {(atividades && atividades.length > 0) || isAddingActivity ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white w-full">
                  <table className="w-full text-left text-xs border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 shrink-0">Ok</th>
                        <th className="py-2.5 px-3">Subtarefa</th>
                        <th className="py-2.5 px-3 w-32 shrink-0">Prazo</th>
                        <th className="py-2.5 px-3 w-24 text-center shrink-0">Responsável</th>
                        {!isCompleted && <th className="py-2.5 px-3 w-20 text-center shrink-0">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {atividades.map((act: any) => (
                        <tr key={act.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center shrink-0">
                            <input 
                              type="checkbox" 
                              checked={act.concluida} 
                              disabled={isCompleted}
                              onChange={e => handleToggleActivity(act.id, e.target.checked)}
                              className="w-4 h-4 text-[#1B4D3E] rounded border-slate-300 focus:ring-[#1B4D3E] disabled:opacity-50 disabled:cursor-default"
                            />
                          </td>
                          <td className="py-2.5 px-3 min-w-0">
                            {editingActivityId === act.id ? (
                              <input
                                value={editingActivityTitulo}
                                onChange={e => setEditingActivityTitulo(e.target.value)}
                                onBlur={() => handleSaveActivityTitulo(act.id)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveActivityTitulo(act.id);
                                  if (e.key === 'Escape') setEditingActivityId(null);
                                }}
                                className="p-1 text-xs border border-slate-200 rounded-lg w-full outline-none focus:border-[#1B4D3E] font-semibold text-slate-700 bg-white"
                                autoFocus
                              />
                            ) : (
                              <div 
                                className={`group/item flex items-center gap-1.5 cursor-pointer w-full overflow-hidden ${act.concluida ? 'line-through text-slate-400' : ''}`}
                                onClick={() => {
                                  if (isCompleted) return;
                                  setEditingActivityId(act.id);
                                  setEditingActivityTitulo(act.titulo);
                                }}
                                title="Clique para editar o título"
                              >
                                <span className="truncate flex-1">{act.titulo}</span>
                                {!isCompleted && (
                                  <Edit2 size={10} className="text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {editingActivityVencId === act.id ? (
                              <input
                                type="date"
                                value={editingActivityVencimento}
                                onChange={async e => {
                                  const val = e.target.value;
                                  setEditingActivityVencimento(val);
                                  await handleSaveActivityField(act.id, { vencimento: val || null });
                                  setEditingActivityVencId(null);
                                }}
                                onBlur={() => setEditingActivityVencId(null)}
                                className="p-1 text-xs border border-slate-200 rounded-lg outline-none cursor-pointer font-semibold text-slate-700 bg-white w-full max-w-full"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() => {
                                  if (isCompleted) return;
                                  setEditingActivityVencId(act.id);
                                  setEditingActivityVencimento(act.vencimento ? new Date(act.vencimento).toISOString().split('T')[0] : '');
                                }}
                                className={`cursor-pointer hover:underline text-slate-500 font-semibold ${act.concluida ? 'line-through text-slate-400/70' : ''}`}
                                title="Clique para editar o prazo"
                              >
                                {act.vencimento ? new Date(act.vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem prazo'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 relative">
                            {act.responsavel ? (
                              <div className="group relative w-fit mx-auto">
                                <div 
                                  onClick={() => {
                                    if (isCompleted) return;
                                    setActRespPopoverId(actRespPopoverId === act.id ? null : act.id);
                                  }}
                                  className="w-6 h-6 rounded-full overflow-hidden bg-[#1B4D3E]/10 flex items-center justify-center text-[9px] font-black text-[#1B4D3E] border border-slate-200 cursor-pointer hover:bg-[#1B4D3E]/20 transition-colors"
                                >
                                  {act.responsavel.avatarUrl ? (
                                    <img 
                                      src={act.responsavel.avatarUrl} 
                                      alt={act.responsavel.nome} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    act.responsavel.nome.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
                                  {act.responsavel.nome}
                                </div>
                              </div>
                            ) : (
                              <div className="group relative w-fit mx-auto">
                                <div 
                                  onClick={() => {
                                    if (isCompleted) return;
                                    setActRespPopoverId(actRespPopoverId === act.id ? null : act.id);
                                  }}
                                  className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 border border-slate-200 border-dashed cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                  -
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-md z-50 pointer-events-none">
                                  Não delegado
                                </div>
                              </div>
                            )}

                            {/* Custom Assignee Popover */}
                            {actRespPopoverId === act.id && (
                              <div 
                                ref={actRespPopoverRef}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-slate-800 max-h-48 overflow-y-auto"
                              >
                                <div className="px-2 py-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                                  Delegar para...
                                </div>
                                <div 
                                  onClick={async () => {
                                    await handleSaveActivityField(act.id, { responsavelId: null });
                                    setActRespPopoverId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs cursor-pointer font-semibold"
                                >
                                  <div className="w-[18px] h-[18px] rounded-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-455 shrink-0">
                                    👤
                                  </div>
                                  <span>Sem responsável</span>
                                </div>
                                {users.map(u => (
                                  <div
                                    key={u.id}
                                    onClick={async () => {
                                      await handleSaveActivityField(act.id, { responsavelId: u.id });
                                      setActRespPopoverId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs cursor-pointer font-semibold"
                                  >
                                    {u.avatarUrl ? (
                                      <img 
                                        src={u.avatarUrl} 
                                        alt={u.nome} 
                                        className="w-[18px] h-[18px] rounded-full object-cover border border-slate-100 shrink-0" 
                                      />
                                    ) : (
                                      <div className="w-[18px] h-[18px] rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center text-[8px] font-bold shrink-0 uppercase">
                                        {u.nome.substring(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="truncate">{u.nome}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          {!isCompleted && (
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTransformIntoTask(act)}
                                  className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 border-none bg-transparent cursor-pointer"
                                  title="Transformar em Tarefa Independente"
                                >
                                  <FilePlus2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActivity(act.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 border-none bg-transparent cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* Adição inline dentro da tabela */}
                      {isAddingActivity && (
                        <tr className="bg-slate-50/70 border-t border-slate-200">
                          <td className="py-2 px-3 text-center">
                            <input 
                              type="checkbox" 
                              disabled 
                              className="w-4 h-4 text-[#1B4D3E]/50 rounded border-slate-300 opacity-60"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              required 
                              value={actTitulo} 
                              onChange={e => setActTitulo(e.target.value)} 
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddActivity();
                                if (e.key === 'Escape') {
                                  setIsAddingActivity(false);
                                  setActTitulo('');
                                  setActRespId('');
                                  setActVencimento('');
                                }
                              }}
                              className="p-1 text-xs border border-slate-200 rounded-lg w-full outline-none focus:border-[#1B4D3E] font-semibold text-slate-700 bg-white"
                              placeholder="Nome da subtarefa..."
                              autoFocus 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="date"
                              value={actVencimento} 
                              onChange={e => setActVencimento(e.target.value)} 
                              className="p-1 text-xs border border-slate-200 rounded-lg outline-none cursor-pointer font-semibold text-slate-700 bg-white w-full"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select 
                              value={actRespId} 
                              onChange={e => setActRespId(e.target.value)} 
                              className="p-1 text-xs border border-slate-200 rounded-lg outline-none cursor-pointer font-semibold text-slate-700 bg-white w-full"
                            >
                              <option value="">Delegar...</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.nome}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                type="button" 
                                onClick={() => handleAddActivity()}
                                className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                                title="Criar Atividade"
                              >
                                <Check size={14} className="stroke-[3]" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setIsAddingActivity(false);
                                  setActTitulo('');
                                  setActRespId('');
                                  setActVencimento('');
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 border-none bg-transparent cursor-pointer"
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic">Nenhuma subtarefa registrada.</p>
              )}

              {/* Botão + Adicionar Atividade abaixo da tabela */}
              {!isCompleted && !isAddingActivity && (
                <button
                  onClick={() => setIsAddingActivity(true)}
                  className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#1B4D3E] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Adicionar Atividade
                </button>
              )}
            </div>           </div>

            {/* Attachments (Anexos) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Paperclip size={14} /> Anexar Arquivos
                </h4>
                {!isCompleted && (
                  <label className="flex items-center gap-1 text-[11px] font-bold text-[#1B4D3E] hover:underline cursor-pointer">
                    <Plus size={12} /> Adicionar
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {task.attachments.map((file: any) => {
                    const isImg = file.tipo.startsWith('image/');
                    const fileMeta = getFileIcon(file.nome, file.tipo);
                    const hasBase64 = task.attachments.find((f: any) => f.id === file.id)?.base64Data;
                    
                    return (
                      <div key={file.id} className="p-2.5 border border-slate-200 rounded-xl flex items-center justify-between bg-white hover:border-[#1B4D3E]/30 transition-colors shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border ${isImg && hasBase64 ? 'border-slate-200 bg-slate-100' : fileMeta.bg}`}>
                            {isImg && hasBase64 ? (
                              <img src={task.attachments.find((f: any) => f.id === file.id).base64Data} className="w-full h-full object-cover" />
                            ) : (
                              fileMeta.icon
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

              {task.comments && task.comments.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 mb-4">
                  {task.comments.map((comment: any) => {
                    const { parentId, cleanText } = parseComment(comment.texto);
                    const parentComment = parentId ? task.comments.find((c: any) => c.id === parentId) : null;
                    
                    return (
                      <div key={comment.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl shadow-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wide flex items-center gap-1">
                            {comment.user?.nome}
                            {parentId && (
                              <span className="text-[9px] text-slate-400 font-semibold normal-case flex items-center gap-0.5">
                                <CornerDownRight size={10} className="text-slate-400" /> em resposta a <strong className="font-bold text-slate-500">{parentComment?.user?.nome || 'Comentário'}</strong>
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {new Date(comment.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        
                        {/* Parent Quote Bubble */}
                        {parentId && (
                          <div className="border-l-2 border-slate-300 bg-slate-100/60 p-2 rounded-r-lg mb-2 text-[10px] text-slate-650 font-medium">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                              {parentComment?.user?.nome || 'Usuário'} escreveu:
                            </span>
                            <span className="line-clamp-2 italic">
                              {parentComment ? parseComment(parentComment.texto).cleanText : 'Mensagem original indisponível'}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                          {renderCommentText(cleanText)}
                        </p>
                        
                        {/* Reply Link */}
                        {!isCompleted && (
                          <div className="flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(comment);
                                commentInputRef.current?.focus();
                              }}
                              className="text-[9px] font-bold text-[#1B4D3E] hover:underline flex items-center gap-0.5 border-none bg-transparent cursor-pointer p-0"
                            >
                              <Reply size={10} /> Responder
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold italic mb-4">Nenhum comentário registrado.</p>
              )}

              {!isCompleted && (
                <form onSubmit={handleAddCommentSubmit} className="relative mb-4">
                  {replyingTo && (
                    <div className="bg-[#1B4D3E]/5 border-t border-x border-slate-200 px-3 py-1.5 rounded-t-xl flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Reply size={11} className="text-[#1B4D3E]" />
                        Respondendo a <span className="text-[#1B4D3E] font-black">{replyingTo.user?.nome}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer p-0.5"
                        title="Cancelar resposta"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleCommentChange}
                      placeholder="Escreva um comentário... Use @ para mencionar alguém de sua equipe"
                      className={`w-full min-h-[72px] p-3 pr-12 border border-slate-200 outline-none focus:border-[#1B4D3E] text-xs font-semibold text-slate-700 resize-none ${replyingTo ? 'rounded-b-xl border-t-0' : 'rounded-2xl'}`}
                    />
                    <button
                      type="submit"
                      className="absolute right-3 bottom-3 p-2 bg-[#1B4D3E] text-white rounded-xl hover:bg-[#13382d] transition-colors border-none cursor-pointer"
                    >
                      <Send size={14} />
                    </button>
                  </div>

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
              )}
            </div>
          </div>

          {/* Sidebar Metadata (Col Right) */}
          <div className="w-full lg:w-72 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 shrink-0 h-fit">
            {/* Criador & Data de Criação */}
            <div className="bg-white border border-slate-250/60 rounded-xl p-3 space-y-2.5 shadow-2xs">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Criada Por</span>
                <span className="font-bold text-slate-700">{task.criador?.nome || 'Sistema'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Criada Em</span>
                <span className="font-bold text-slate-700">
                  {task.createdAt ? new Date(task.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Etapa no Kanban</label>
              <select
                value={stageId}
                disabled={isCompleted}
                onChange={e => {
                  setStageId(e.target.value);
                  saveField({ stageId: e.target.value });
                }}
                className={`w-full p-2.5 border rounded-xl text-xs font-bold outline-none cursor-pointer transition-all disabled:opacity-85 disabled:cursor-default ${
                  stages.find(s => s.id === stageId)?.color || 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id} className="bg-white text-slate-700 font-semibold">
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</label>
              {(() => {
                const currentResp = users.find(u => u.id === responsavelId);
                return (
                  <div className="relative" ref={responsavelPopoverRef}>
                    <div 
                      onClick={() => {
                        if (isCompleted) return;
                        setShowResponsavelPopover(!showResponsavelPopover);
                      }}
                      className="flex items-center gap-2.5 p-2.5 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer rounded-xl transition-colors"
                    >
                      {currentResp?.avatarUrl ? (
                        <img 
                          src={currentResp.avatarUrl} 
                          alt={currentResp.nome} 
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[10px] font-bold text-[#1B4D3E]">
                          {currentResp ? currentResp.nome.substring(0, 2).toUpperCase() : '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {currentResp ? currentResp.nome : 'Não delegado'}
                        </p>
                        {!isCompleted && (
                          <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Clique para alterar</p>
                        )}
                      </div>
                    </div>

                    {showResponsavelPopover && !isCompleted && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 text-slate-800 animate-fade-in max-h-56 overflow-y-auto">
                        <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          Definir Responsável
                        </div>
                        <div 
                          onClick={async () => {
                            setResponsavelId('');
                            await saveField({ responsavelId: null });
                            setShowResponsavelPopover(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            !responsavelId ? 'text-[#1B4D3E] font-bold bg-slate-50' : 'text-slate-650'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-450 shrink-0">
                            👤
                          </div>
                          <span>Sem responsável</span>
                        </div>
                        {users.map(u => (
                          <div
                            key={u.id}
                            onClick={async () => {
                              setResponsavelId(u.id);
                              await saveField({ responsavelId: u.id });
                              setShowResponsavelPopover(false);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                              responsavelId === u.id ? 'text-[#1B4D3E] font-bold bg-slate-50' : 'text-slate-650'
                            }`}
                          >
                            {u.avatarUrl ? (
                              <img 
                                src={u.avatarUrl} 
                                alt={u.nome} 
                                className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0" 
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center text-[9px] font-bold shrink-0 uppercase">
                                {u.nome.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">{u.nome}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vencimento</label>
              <div className="relative">
                <input
                  type="date"
                  value={vencimento}
                  disabled={isCompleted}
                  onChange={e => {
                    setVencimento(e.target.value);
                    saveField({ vencimento: e.target.value || null });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white disabled:bg-slate-100 disabled:cursor-default"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridade</label>
              <select
                value={prioridade}
                disabled={isCompleted}
                onChange={e => {
                  setPrioridade(e.target.value);
                  saveField({ prioridade: e.target.value });
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-default"
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
                    {!isCompleted && (
                      <button
                        onClick={() => setShowTagManager(!showTagManager)}
                        className="text-[9px] font-bold text-[#1B4D3E] hover:underline bg-transparent border-none cursor-pointer"
                      >
                        {showTagManager ? 'Fechar' : 'Gerenciar'}
                      </button>
                    )}
                  </div>

                  {showTagManager && !isCompleted ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 mb-2.5">
                      <div className="flex gap-1.5 items-center relative">
                        <input 
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          placeholder="Nome da tag"
                          className="text-xs p-1.5 border border-slate-200 rounded-lg flex-1 outline-none"
                        />
                        
                        {/* Seletor de cor customizado (paleta ATA) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            style={{ backgroundColor: newTagColor }}
                            className="w-8 h-8 rounded-lg border border-slate-350 cursor-pointer shadow-sm hover:scale-105 transition-transform animate-fade-in"
                            title="Selecionar cor"
                          />
                          
                          {showColorPicker && (
                            <div 
                              ref={colorPickerRef}
                              className="absolute bottom-full right-0 mb-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[220px]"
                            >
                              <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Cores do Tema</div>
                              <div className="grid grid-cols-10 gap-1 mb-3">
                                {themeColorsGrid.map((row, rIdx) => 
                                  row.map((color, cIdx) => (
                                    <button
                                      key={`theme-${rIdx}-${cIdx}`}
                                      type="button"
                                      onClick={() => {
                                        setNewTagColor(color);
                                        setShowColorPicker(false);
                                      }}
                                      className="w-[16px] h-[16px] rounded-[3px] border border-slate-200 hover:scale-120 transition-transform cursor-pointer"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))
                                )}
                              </div>

                              <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider border-t border-slate-100 pt-2">Cores Padrão</div>
                              <div className="grid grid-cols-10 gap-1">
                                {standardColors.map((color, idx) => (
                                  <button
                                    key={`std-${idx}`}
                                    type="button"
                                    onClick={() => {
                                      setNewTagColor(color);
                                      setShowColorPicker(false);
                                    }}
                                    className="w-[16px] h-[16px] rounded-[3px] border border-slate-200 hover:scale-120 transition-transform cursor-pointer"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={handleCreateTag}
                          className="px-3 py-1.5 bg-[#1B4D3E] text-white rounded-lg text-xs font-bold hover:bg-[#13382d] border-none cursor-pointer h-8 flex items-center justify-center"
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
                          onClick={() => !isCompleted && handleTagToggle(tag.id)}
                          style={{ 
                            backgroundColor: active ? tag.color : '#F1F5F9',
                            color: active ? '#FFFFFF' : '#475569',
                            borderColor: active ? tag.color : '#E2E8F0'
                          }}
                          className={`text-[9px] font-bold border px-2 py-0.5 rounded-lg cursor-pointer transition-colors hover:scale-102 flex items-center gap-1 ${
                            isCompleted ? 'pointer-events-none opacity-85' : ''
                          }`}
                        >
                          {active && <Check size={8} className="stroke-[3]" />}
                          {tag.nome}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Participants & Observers */}
                <div className={`space-y-4 pt-1 ${isCompleted ? 'pointer-events-none opacity-85' : ''}`}>
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
          </div>
        </div>

        {/* Fixed Footer Bar */}
        <div className="h-16 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 z-10">
          {/* Left Side: Delete (if not completed) */}
          <div>
            {!isCompleted && (
              <button
                type="button"
                onClick={() => {
                  showCustomConfirm(
                    'Excluir Tarefa',
                    'Deseja realmente remover esta tarefa?',
                    async () => {
                      const res = await deleteTask(task.id);
                      if (res.success) {
                        onClose();
                        refreshData(true);
                      } else {
                        showCustomAlert('Erro', res.error || 'Erro ao deletar tarefa');
                      }
                    }
                  );
                }}
                className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 bg-white text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors border-dashed cursor-pointer"
              >
                <Trash2 size={13} /> Excluir Tarefa
              </button>
            )}
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center gap-2.5 relative">
            {isCompleted ? (
              <button
                type="button"
                onClick={async () => {
                  const updateData: any = { status: 'EM_ANDAMENTO' };
                  const concluidoStage = stages.find(s => 
                    s.nome.toLowerCase() === 'concluído' || 
                    s.nome.toLowerCase() === 'concluido' || 
                    s.nome.toLowerCase() === 'concluída' || 
                    s.nome.toLowerCase() === 'concluida'
                  );
                  if (concluidoStage && task.stageId === concluidoStage.id) {
                    const firstNonCompleted = stages.find(s => s.id !== concluidoStage.id);
                    if (firstNonCompleted) {
                      updateData.stageId = firstNonCompleted.id;
                      setStageId(firstNonCompleted.id);
                    }
                  }
                  const res = await updateTask(task.id, updateData);
                  if (res.success) {
                    refreshData(true);
                  } else {
                    showCustomAlert('Erro', res.error || 'Erro ao reabrir tarefa');
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus size={13} /> Reabrir Tarefa
              </button>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setTitulo(task.titulo);
                        setDescricao(task.descricao || '');
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!titulo.trim()) {
                          showCustomAlert('Erro', 'O título da tarefa não pode ficar vazio.');
                          return;
                        }
                        setIsSaving(true);
                        const res = await updateTask(task.id, { titulo, descricao });
                        setIsSaving(false);
                        if (res.success) {
                          setIsEditing(false);
                          refreshData(true);
                        } else {
                          showCustomAlert('Erro', res.error || 'Erro ao salvar tarefa');
                        }
                      }}
                      className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Editar Tarefa
                    </button>

                    {/* Delegate Popover Dropdown */}
                    <div className="relative" ref={delegarPopoverRef}>
                      <button
                        type="button"
                        onClick={() => setShowDelegarPopover(!showDelegarPopover)}
                        className="flex items-center gap-1.5 px-5 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <User size={13} /> Delegar
                      </button>

                      {showDelegarPopover && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 text-slate-800 animate-fade-in max-h-56 overflow-y-auto">
                          <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                            Transferir para...
                          </div>
                          <div 
                            onClick={async () => {
                              setResponsavelId('');
                              await saveField({ responsavelId: null });
                              setShowDelegarPopover(false);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                              !responsavelId ? 'text-[#1B4D3E] font-bold bg-slate-50' : 'text-slate-650'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-450 shrink-0">
                              👤
                            </div>
                            <span>Sem responsável</span>
                          </div>
                          {users.map(u => (
                            <div
                              key={u.id}
                              onClick={async () => {
                                setResponsavelId(u.id);
                                await saveField({ responsavelId: u.id });
                                setShowDelegarPopover(false);
                              }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                                responsavelId === u.id ? 'text-[#1B4D3E] font-bold bg-slate-50' : 'text-slate-650'
                              }`}
                            >
                              {u.avatarUrl ? (
                                <img 
                                  src={u.avatarUrl} 
                                  alt={u.nome} 
                                  className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0" 
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center text-[9px] font-bold shrink-0 uppercase">
                                  {u.nome.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate">{u.nome}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const updateData: any = { status: 'CONCLUIDA' };
                        const concluidoStage = stages.find(s => 
                          s.nome.toLowerCase() === 'concluído' || 
                          s.nome.toLowerCase() === 'concluido' || 
                          s.nome.toLowerCase() === 'concluída' || 
                          s.nome.toLowerCase() === 'concluida'
                        );
                        if (concluidoStage) {
                          updateData.stageId = concluidoStage.id;
                          setStageId(concluidoStage.id);
                        }
                        const res = await updateTask(task.id, updateData);
                        if (res.success) {
                          refreshData(true);
                        } else {
                          showCustomAlert('Erro', res.error || 'Erro ao concluir tarefa');
                        }
                      }}
                      className="flex items-center gap-1.5 px-5 py-2 border border-emerald-350 bg-emerald-50 text-emerald-650 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Check size={13} className="stroke-[3]" /> Concluir Tarefa
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CRM-style Custom Modal for Prompts, Confirms, and Alerts */}
      {customModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm border border-slate-100 flex flex-col gap-4 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-700">
                {customModal.title}
              </h4>
              <button 
                onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              {customModal.message}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {customModal.type !== 'alert' && (
                <button
                  type="button"
                  onClick={() => setCustomModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  customModal.onConfirm();
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-[#1B4D3E] text-white rounded-xl text-xs font-black hover:bg-[#13382d] transition-colors cursor-pointer border-none"
              >
                {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
