'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutList, Kanban, Plus, Search, Filter, Calendar, 
  User, CheckSquare, RefreshCw, X, ChevronDown, Edit2, 
  Trash2, AlertTriangle, Users, Eye, Tag as TagIcon, Check
} from 'lucide-react';
import { 
  getTasks, getTaskStages, createTaskStage, updateTaskStage, 
  deleteTaskStage, reorderTaskStages, createTask, updateTask,
  getTenantTags, createTenantTag
} from './actions';
import TaskMetrics from './components/TaskMetrics';
import TaskDetailsModal from './components/TaskDetailsModal';

const tailwindColorMap: { [key: string]: string } = {
  sky: '#0284c7',
  blue: '#2563eb',
  orange: '#ea580c',
  amber: '#d97706',
  emerald: '#059669',
  green: '#16a34a',
  red: '#dc2626',
  rose: '#e11d48',
  purple: '#9333ea',
  violet: '#7c3aed',
  yellow: '#ca8a04',
  indigo: '#4f46e5',
  pink: '#db2777',
  teal: '#0d9488',
  slate: '#475569',
  gray: '#4b5563',
  'bg-slate-100': '#64748b',
  'bg-blue-100': '#3b82f6',
  'bg-green-100': '#10b981',
  'bg-emerald-100': '#10b981',
  'bg-amber-100': '#f59e0b',
  'bg-rose-100': '#f43f5e',
  'bg-purple-100': '#8b5cf6',
};

const resolveColorToHex = (color?: string): string => {
  if (!color) return '#64748b';
  const lower = color.toLowerCase().trim();
  if (lower.startsWith('#')) return lower;

  if (lower.includes('bg-slate-100')) return '#f1f5f9';
  if (lower.includes('bg-slate-200')) return '#e2e8f0';
  if (lower.includes('bg-gray-100')) return '#f3f4f6';
  if (lower.includes('bg-gray-200')) return '#e5e7eb';
  if (lower.includes('bg-sky-100')) return '#e0f2fe';
  if (lower.includes('bg-sky-200')) return '#bae6fd';
  if (lower.includes('bg-orange-100')) return '#ffedd5';
  if (lower.includes('bg-orange-200')) return '#fed7aa';
  if (lower.includes('bg-green-100') || lower.includes('bg-emerald-100')) return '#dcfce7';
  if (lower.includes('bg-green-200') || lower.includes('bg-emerald-200')) return '#bbf7d0';
  if (lower.includes('bg-red-100')) return '#fee2e2';
  if (lower.includes('bg-red-200')) return '#fecaca';
  if (lower.includes('bg-purple-100')) return '#f3e8ff';
  if (lower.includes('bg-purple-200')) return '#e9d5ff';
  if (lower.includes('bg-blue-100')) return '#dbeafe';
  if (lower.includes('bg-blue-200')) return '#bfdbfe';
  if (lower.includes('bg-yellow-100')) return '#fef9c3';
  if (lower.includes('bg-yellow-200')) return '#fef08a';
  if (lower.includes('bg-amber-100')) return '#fef3c7';
  if (lower.includes('bg-amber-200')) return '#fde68a';
  if (lower.includes('bg-teal-100')) return '#ccfbf1';
  if (lower.includes('bg-teal-200')) return '#99f6e4';
  if (lower.includes('bg-indigo-100')) return '#e0e7ff';
  if (lower.includes('bg-indigo-200')) return '#c7d2fe';
  if (lower.includes('bg-violet-100')) return '#ede9fe';
  if (lower.includes('bg-violet-200')) return '#ddd6fe';
  if (lower.includes('bg-pink-100')) return '#fce7f3';
  if (lower.includes('bg-pink-200')) return '#fbcfe8';
  if (lower.includes('bg-rose-100')) return '#ffe4e6';
  if (lower.includes('bg-rose-200')) return '#fecdd3';

  if (tailwindColorMap[lower]) return tailwindColorMap[lower];
  const stripped = lower.replace('bg-', '').split('-')[0];
  return tailwindColorMap[stripped] || '#64748b';
};

const normalizeHex = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return '#' + h;
};

const getContrastYIQ = (hex: string) => {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 140) ? 'black' : 'white';
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDarkenedHexForText = (hex: string) => {
  const normalized = normalizeHex(hex);
  let r = parseInt(normalized.slice(1, 3), 16);
  let g = parseInt(normalized.slice(3, 5), 16);
  let b = parseInt(normalized.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  if (yiq > 170) {
    r = Math.max(0, Math.floor(r * 0.5));
    g = Math.max(0, Math.floor(g * 0.5));
    b = Math.max(0, Math.floor(b * 0.5));
  }
  const toHexStr = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHexStr(r)}${toHexStr(g)}${toHexStr(b)}`;
};

const PRESET_COLORS = [
  '#E0F2FE', '#E0F2F1', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FFEDD5', '#FFE4E6', '#FCE7F3', '#F3E8FF', '#F1F5F9',
  '#38BDF8', '#0D9488', '#10B981', '#84CC16', '#FACC15', '#FB923C', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B',
  '#0EA5E9', '#00B4D8', '#00F5D4', '#39FF14', '#FFD000', '#FF9F1C', '#FF007F', '#D000FF', '#7000FF', '#48CAE4',
  '#0369A1', '#0B6623', '#065F46', '#3F6212', '#A16207', '#C2410C', '#B91C1C', '#9D174D', '#581C87', '#334155',
];

interface TasksKanbanProps {
  initialUsers: any[];
}

export default function TasksKanban({ initialUsers }: TasksKanbanProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  // View mode unificado: 'lista' | 'kanban-etapa' | 'kanban-responsavel' | 'kanban-etiqueta' | 'kanban-prazo'
  const [viewMode, setViewMode] = useState<'lista' | 'kanban-etapa' | 'kanban-responsavel' | 'kanban-etiqueta' | 'kanban-prazo'>('kanban-etapa');
  
  const groupBy = viewMode === 'kanban-responsavel' ? 'responsavel'
                : viewMode === 'kanban-etiqueta' ? 'etiqueta'
                : viewMode === 'kanban-prazo' ? 'prazo'
                : 'etapa';

  // Filters
  const [filterStage, setFilterStage] = useState('all');
  const [filterResp, setFilterResp] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterVencimento, setFilterVencimento] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  
  // Task form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStageId, setNewStageId] = useState('');
  const [newRespId, setNewRespId] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIA');
  const [newVencimento, setNewVencimento] = useState('');

  // Custom alert/prompt/confirm modal (CRM-style)
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    placeholder?: string;
    defaultValue?: string;
    type: 'alert' | 'confirm' | 'prompt';
    onConfirm: (val: string) => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    type: 'alert',
    onConfirm: () => {}
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  };

  // Stage Inline Editing and CRUD States
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState<string>('');

  // Dragging states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [draggedOverBeforeStageId, setDraggedOverBeforeStageId] = useState<string | null>(null);
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filterStage, filterResp, filterPriority, filterVencimento]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const stagesRes = await getTaskStages();
      const tagsRes = await getTenantTags();
      const tasksRes = await getTasks({
        stageId: filterStage,
        responsavelId: filterResp,
        prioridade: filterPriority,
        vencimentoPreset: filterVencimento
      });

      if (stagesRes.success && stagesRes.stages) {
        setStages(stagesRes.stages);
      }
      if (tagsRes.success && tagsRes.tags) {
        setTags(tagsRes.tags);
      }
      if (tasksRes.success && tasksRes.tasks) {
        setTasks(tasksRes.tasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks locally by search query
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.titulo.toLowerCase().includes(query) ||
      (t.descricao && t.descricao.toLowerCase().includes(query)) ||
      (t.codigo && String(t.codigo).includes(query))
    );
  });

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedStageId(null);
    setDraggedOverBeforeStageId(null);
    setDraggedOverStageId(null);
  };

  // Handle Drag Over
  const handleDragOverStage = (e: React.DragEvent, stageId?: string) => {
    e.preventDefault();
    if (draggedStageId) {
      if (stageId && stageId !== draggedStageId) {
        setDraggedOverBeforeStageId(stageId);
      }
    } else {
      if (stageId) {
        setDraggedOverStageId(stageId);
      }
    }
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    if (!draggedStageId) {
      setDraggedOverStageId(null);
    }
  };

  // Handle Drop stage columns
  const handleDropStage = async (draggedId: string, beforeId: string) => {
    setDraggedStageId(null);
    setDraggedOverBeforeStageId(null);
    if (draggedId === beforeId) return;

    const currentOrder = stages.map(s => s.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    if (draggedIndex === -1) return;

    currentOrder.splice(draggedIndex, 1);

    if (beforeId === 'last') {
      currentOrder.push(draggedId);
    } else {
      const beforeIndex = currentOrder.indexOf(beforeId);
      if (beforeIndex !== -1) {
        currentOrder.splice(beforeIndex, 0, draggedId);
      }
    }

    const reorderedStages = currentOrder.map(id => stages.find(s => s.id === id)).filter(Boolean);
    setStages(reorderedStages);

    const res = await reorderTaskStages(currentOrder);
    if (!res.success) {
      showCustomAlert("Erro ao reordenar colunas", res.error || "Erro desconhecido");
      fetchData();
    }
  };

  // CRM-style quick stage creation & deletion
  const handleCreateStage = (insertAfterId?: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Nova Etapa de Tarefa',
      placeholder: 'Nome da nova etapa (ex: Em Revisão)',
      type: 'prompt',
      onConfirm: async (nome) => {
        if (!nome.trim()) return;
        const res = await createTaskStage(nome.trim(), '#E2E8F0', insertAfterId);
        if (res.success) {
          fetchData();
        } else {
          showCustomAlert('Erro ao Criar Etapa', res.error || 'Erro desconhecido');
        }
      }
    });
  };

  const handleDeleteStage = (id: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Excluir Etapa de Tarefa',
      message: 'Deseja realmente excluir esta etapa? Atenção: ela precisa estar vazia para ser removida.',
      type: 'confirm',
      onConfirm: async () => {
        const res = await deleteTaskStage(id);
        if (res.success) {
          fetchData();
        } else {
          showCustomAlert('Erro ao Excluir Etapa', res.error || 'Erro desconhecido');
        }
      }
    });
  };

  // Handle Drop on Column
  const handleDrop = async (e: React.DragEvent, targetValue: string, columnType: 'etapa' | 'responsavel' | 'etiqueta' | 'prazo') => {
    e.preventDefault();
    setDraggedOverStageId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    setDraggedTaskId(null);

    // Optimistic Update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (columnType === 'etapa') {
          return { ...t, stageId: targetValue };
        } else if (columnType === 'responsavel') {
          return { ...t, responsavelId: targetValue || null };
        } else if (columnType === 'prazo') {
          let newDate: Date | null = null;
          const today = new Date();
          today.setHours(0,0,0,0);
          if (targetValue === 'hoje') {
            newDate = today;
          } else if (targetValue === 'semana') {
            newDate = new Date();
            newDate.setDate(today.getDate() + 6);
          } else if (targetValue === 'proxima_semana') {
            newDate = new Date();
            newDate.setDate(today.getDate() + 13);
          } else if (targetValue === 'atrasado') {
            newDate = new Date();
            newDate.setDate(today.getDate() - 1);
          }
          return { ...t, vencimento: newDate };
        }
      }
      return t;
    }));

    try {
      if (columnType === 'etapa') {
        await updateTask(taskId, { stageId: targetValue });
      } else if (columnType === 'responsavel') {
        await updateTask(taskId, { responsavelId: targetValue || '' });
      } else if (columnType === 'etiqueta') {
        // Tag drop adds the tag to the task
        const task = tasks.find(t => t.id === taskId);
        if (task && targetValue) {
          const currentTagIds = task.tags?.map((tg: any) => tg.tagId) || [];
          if (!currentTagIds.includes(targetValue)) {
            const updated = [...currentTagIds, targetValue];
            const res = await updateTask(taskId, {}); // Triggers action
            // Update tag relations using actions
            const { updateTaskTags } = require('./actions');
            await updateTaskTags(taskId, updated);
          }
        }
      } else if (columnType === 'prazo') {
        let newDate: string | null = null;
        const today = new Date();
        today.setHours(12, 0, 0, 0); // avoid TZ shifts
        if (targetValue === 'hoje') {
          newDate = today.toISOString();
        } else if (targetValue === 'semana') {
          today.setDate(today.getDate() + 6);
          newDate = today.toISOString();
        } else if (targetValue === 'proxima_semana') {
          today.setDate(today.getDate() + 13);
          newDate = today.toISOString();
        } else if (targetValue === 'atrasado') {
          today.setDate(today.getDate() - 1);
          newDate = today.toISOString();
        }
        await updateTask(taskId, { vencimento: newDate });
      }
      fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Helper for priority colors
  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case 'ALTA':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'MEDIA':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  // Helper for date presets
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const getDeadlineStatus = (venc: string | null, status: string) => {
    if (!venc) return { text: 'Sem prazo', color: 'text-slate-400' };
    const date = new Date(venc);
    if (status === 'CONCLUIDA' || status === 'CONCLUÍDO') {
      return { text: 'Concluída', color: 'text-emerald-500 font-bold' };
    }
    if (date < todayDate) {
      return { text: `Atrasada (${date.toLocaleDateString('pt-BR')})`, color: 'text-rose-600 font-bold' };
    }
    const diffDays = Math.ceil((date.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { text: 'Hoje', color: 'text-amber-500 font-black' };
    if (diffDays === 1) return { text: 'Amanhã', color: 'text-blue-500 font-bold' };
    if (diffDays <= 7) return { text: `Esta semana (${date.toLocaleDateString('pt-BR')})`, color: 'text-slate-600' };
    return { text: date.toLocaleDateString('pt-BR'), color: 'text-slate-500' };
  };

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Use selected stage or first stage
    const defaultStageId = newStageId || (stages.length > 0 ? stages[0].id : '');
    if (!defaultStageId) {
      alert('Nenhuma etapa disponível');
      return;
    }

    const res = await createTask({
      titulo: newTitle.trim(),
      descricao: newDesc.trim() || undefined,
      stageId: defaultStageId,
      responsavelId: newRespId || undefined,
      vencimento: newVencimento || undefined,
      prioridade: newPriority
    });

    if (res.success) {
      setShowNewTask(false);
      setNewTitle('');
      setNewDesc('');
      setNewStageId('');
      setNewRespId('');
      setNewPriority('MEDIA');
      setNewVencimento('');
      fetchData();
    } else {
      alert(res.error || 'Erro ao criar tarefa');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0 bg-slate-50">
        {/* Header Title Section */}
        <div className="p-4 md:py-6 md:pl-4 md:pr-1 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4 shrink-0 relative z-40">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">Gestão de Tarefas</h1>
            <p className="text-xs md:text-sm text-slate-500">Controle de tarefas, prazos e eficiência da equipe</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            {/* Alternador de visualização unificado (Pill Bar) */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                title="Visualização em Lista"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  viewMode === 'lista'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <LayoutList size={14} /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban-etapa')}
                title="Kanban por Etapa"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  viewMode === 'kanban-etapa'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <Kanban size={14} /> Por Etapa
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban-responsavel')}
                title="Kanban por Responsável"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  viewMode === 'kanban-responsavel'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <Users size={14} /> Por Vendedor
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban-etiqueta')}
                title="Kanban por Etiqueta"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  viewMode === 'kanban-etiqueta'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <TagIcon size={14} /> Por Segmento
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban-prazo')}
                title="Kanban por Prazo"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                  viewMode === 'kanban-prazo'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <Calendar size={14} /> Por Prazo
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Section */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col xl:flex-row gap-3.5 items-center justify-between shrink-0 relative z-30">
          <div className="w-full xl:w-[280px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar tarefa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-slate-700 outline-none focus:border-[#1B4D3E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Filter by Stage */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex-1 sm:flex-none">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={filterStage} 
                onChange={e => setFilterStage(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 flex-1 cursor-pointer"
              >
                <option value="all">Todas as etapas</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter by Assignee */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex-1 sm:flex-none">
              <User size={14} className="text-slate-400" />
              <select 
                value={filterResp} 
                onChange={e => setFilterResp(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 flex-1 cursor-pointer"
              >
                <option value="all">Todos os responsáveis</option>
                {initialUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter by Priority */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex-1 sm:flex-none">
              <AlertTriangle size={14} className="text-slate-400" />
              <select 
                value={filterPriority} 
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 flex-1 cursor-pointer"
              >
                <option value="all">Todas as prioridades</option>
                <option value="BAIXA">Prioridade Baixa</option>
                <option value="MEDIA">Prioridade Média</option>
                <option value="ALTA">Prioridade Alta</option>
              </select>
            </div>

            {/* Filter by Due Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex-1 sm:flex-none">
              <Calendar size={14} className="text-slate-400" />
              <select 
                value={filterVencimento} 
                onChange={e => setFilterVencimento(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-slate-700 flex-1 cursor-pointer"
              >
                <option value="all">Qualquer prazo</option>
                <option value="overdue">Atrasadas</option>
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="nextWeek">Próxima Semana</option>
                <option value="none">Sem vencimento</option>
              </select>
            </div>

            <button
              onClick={() => handleCreateStage()}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer"
            >
              Adicionar Coluna
            </button>

            <button
              onClick={() => setShowNewTask(true)}
              className="bg-[#1B4D3E] text-white hover:bg-[#13382d] px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 flex-shrink-0 cursor-pointer border-none"
            >
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>
        </div>

        {/* Dashboard Analytics & Metrics */}
        <TaskMetrics tasks={filteredTasks} stages={stages} />

        {/* Core Task Displays */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <RefreshCw className="animate-spin text-[#1B4D3E] mb-3" size={36} />
            <span className="text-xs font-bold uppercase tracking-widest">Carregando tarefas...</span>
          </div>
        ) : viewMode === 'lista' ? (
          /* ================= LIST VIEW ================= */
          <div className="p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <th className="py-3 px-4 w-20">Cód</th>
                    <th className="py-3 px-4">Tarefa</th>
                    <th className="py-3 px-4">Etapa</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Prioridade</th>
                    <th className="py-3 px-4">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredTasks.map(t => {
                    const dl = getDeadlineStatus(t.vencimento, t.status);
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTask(t)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          #{t.codigo || t.id.substring(0, 5)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {t.titulo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-bold">
                            {t.stage?.nome}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {t.responsavel?.nome || 'Não delegado'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getPriorityBadgeClass(t.prioridade)}`}>
                            {t.prioridade}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-xs font-bold ${dl.color}`}>
                          {dl.text}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400 italic">
                        Nenhuma tarefa encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ================= KANBAN BOARD VIEWS ================= */
          <div className="pt-3 pb-6 pl-2 pr-1 bg-slate-50 min-w-max overflow-x-auto min-h-[calc(100vh-280px)]">
            <div className="flex gap-[3px] select-none">
              {/* Kanban Modes Render */}
              {(() => {
                let columns: any[] = [];
                
                // Grouping Modes Setup
                if (groupBy === 'etapa') {
                  columns = stages.map(s => ({
                    id: s.id,
                    title: s.nome,
                    color: s.color,
                    tasks: filteredTasks.filter(t => t.stageId === s.id)
                  }));
                } else if (groupBy === 'responsavel') {
                  columns = initialUsers.map(u => ({
                    id: u.id,
                    title: u.nome,
                    color: 'bg-slate-100',
                    tasks: filteredTasks.filter(t => t.responsavelId === u.id)
                  }));
                  columns.push({
                    id: 'unassigned',
                    title: 'Sem Responsável',
                    color: 'bg-slate-200',
                    tasks: filteredTasks.filter(t => !t.responsavelId)
                  });
                } else if (groupBy === 'etiqueta') {
                  columns = tags.map(tg => ({
                    id: tg.id,
                    title: tg.nome,
                    color: tg.color || '#64748B',
                    tagColor: tg.color,
                    tasks: filteredTasks.filter(t => t.tags?.some((tt: any) => tt.tagId === tg.id))
                  }));
                  columns.push({
                    id: 'no_tag',
                    title: 'Sem Etiquetas',
                    color: '#94A3B8',
                    tasks: filteredTasks.filter(t => !t.tags || t.tags.length === 0)
                  });
                } else if (groupBy === 'prazo') {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const endOfToday = new Date(today);
                  endOfToday.setHours(23, 59, 59, 999);
                  const endOfWeek = new Date(today);
                  endOfWeek.setDate(today.getDate() + 7);
                  const endOfNextWeek = new Date(today);
                  endOfNextWeek.setDate(today.getDate() + 14);

                  columns = [
                    {
                      id: 'atrasado',
                      title: 'Atrasado',
                      color: '#F43F5E',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) < today && t.status !== 'CONCLUIDA')
                    },
                    {
                      id: 'hoje',
                      title: 'Hoje',
                      color: '#F59E0B',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) >= today && new Date(t.vencimento) <= endOfToday)
                    },
                    {
                      id: 'semana',
                      title: 'Esta Semana',
                      color: '#3B82F6',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) > endOfToday && new Date(t.vencimento) <= endOfWeek)
                    },
                    {
                      id: 'proxima_semana',
                      title: 'Próxima Semana',
                      color: '#4F46E5',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) > endOfWeek && new Date(t.vencimento) <= endOfNextWeek)
                    },
                    {
                      id: 'sem_prazo',
                      title: 'Sem Prazo',
                      color: '#64748B',
                      tasks: filteredTasks.filter(t => !t.vencimento)
                    }
                  ];
                }

                return (
                  <>
                    {columns.map((col, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === columns.length - 1;
                      const resolvedHex = resolveColorToHex(col.color);
                      const contrast = getContrastYIQ(resolvedHex);
                      const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
                      const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);

                      return (
                        <React.Fragment key={col.id}>
                          {viewMode === 'kanban-etapa' && draggedStageId && draggedOverBeforeStageId === col.id && (
                            <div 
                              className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-slate-300 rounded-2xl h-[calc(100vh-300px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDropStage(draggedStageId, col.id)}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mover para cá</span>
                              </div>
                            </div>
                          )}
                          <div 
                            className={`flex flex-col flex-shrink-0 transition-opacity duration-200 ${viewMode === 'kanban-etapa' && draggedStageId === col.id ? 'opacity-30' : 'opacity-100'}`}
                            style={{ width: '274px' }}
                            onDragOver={(e) => handleDragOverStage(e, col.id)}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (viewMode === 'kanban-etapa' && draggedStageId) {
                                handleDropStage(draggedStageId, col.id);
                              } else {
                                handleDrop(e, col.id === 'unassigned' || col.id === 'no_tag' ? '' : col.id, groupBy);
                              }
                            }}
                          >
                            {/* Column Header Sticky */}
                            <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (columns.length - idx) }}>
                              <div 
                                className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto cursor-grab active:cursor-grabbing"
                                draggable={viewMode === 'kanban-etapa' && !editingStageId}
                                onDragStart={(e) => {
                                  if (viewMode === 'kanban-etapa') {
                                    e.dataTransfer.setData('columnId', col.id);
                                    setDraggedStageId(col.id);
                                  }
                                }}
                                onDragEnd={handleDragEnd}
                              >
                                <svg 
                                  className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                                  viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                                  preserveAspectRatio="none"
                                  style={{ color: resolvedHex }}
                                >
                                  <path 
                                    d={isFirst 
                                      ? "M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z" 
                                      : isLast 
                                        ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                                        : "M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                                    }
                                    fill="currentColor" 
                                    stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
                                    strokeWidth="1"
                                  />
                                </svg>
                                <div 
                                  className={`relative z-10 flex items-center justify-between h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                                  style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                                >
                                  <div className="flex flex-col min-w-0 justify-center">
                                    <h3 className="font-black uppercase tracking-wider text-[11px] truncate max-w-[150px] leading-none">
                                      {col.title}
                                    </h3>
                                    <span className="text-[10px] font-bold mt-1 opacity-90 truncate select-none leading-none">
                                      {col.tasks.length} {col.tasks.length === 1 ? 'tarefa' : 'tarefas'}
                                    </span>
                                  </div>

                                  {viewMode === 'kanban-etapa' && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingStageName(col.title);
                                          setEditingStageId(col.id);
                                        }}
                                        className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-155 flex items-center justify-center cursor-pointer hover:bg-black/5"
                                        style={{ color: 'inherit' }}
                                        title="Editar Etapa"
                                      >
                                        <Edit2 size={12} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCreateStage(col.id);
                                        }}
                                        className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-155 flex items-center justify-center cursor-pointer hover:bg-black/5"
                                        style={{ color: 'inherit' }}
                                        title="Criar Nova Etapa"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {viewMode === 'kanban-etapa' && editingStageId === col.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-30 cursor-default" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingStageId(null);
                                      }}
                                    />
                                    <div 
                                      className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                          Editar Etapa de Tarefa
                                        </span>
                                        <button 
                                          onClick={() => setEditingStageId(null)}
                                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>

                                      <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nome da Etapa</label>
                                        <input
                                          type="text"
                                          value={editingStageName}
                                          onChange={(e) => setEditingStageName(e.target.value)}
                                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-slate-300 outline-none w-full bg-slate-50 font-medium"
                                          placeholder="Nome da etapa"
                                          onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                              if (editingStageName.trim() && editingStageName.trim().toUpperCase() !== col.title.toUpperCase()) {
                                                const res = await updateTaskStage(col.id, { nome: editingStageName.trim() });
                                                if (res.success) {
                                                  setStages(prev => prev.map(s => s.id === col.id ? { ...s, nome: editingStageName.trim() } : s));
                                                } else {
                                                  alert(res.error || 'Erro ao renomear');
                                                }
                                              }
                                              setEditingStageId(null);
                                            }
                                          }}
                                        />
                                      </div>

                                      <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                                        <div className="grid grid-cols-10 gap-1 mt-0.5">
                                          {PRESET_COLORS.map(c => {
                                            const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                                            return (
                                              <button
                                                key={c}
                                                onClick={async () => {
                                                  const res = await updateTaskStage(col.id, { color: c });
                                                  if (res.success) {
                                                    setStages(prev => prev.map(s => s.id === col.id ? { ...s, color: c } : s));
                                                  } else {
                                                    alert(res.error || 'Erro ao alterar cor');
                                                  }
                                                }}
                                                className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer p-0"
                                                style={{
                                                  backgroundColor: c,
                                                  borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)',
                                                  borderWidth: isSelected ? '2px' : '1px'
                                                }}
                                                title={c}
                                                type="button"
                                              >
                                                {isSelected && (
                                                  <div 
                                                    className="w-1.5 h-1.5 rounded-full" 
                                                    style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} 
                                                  />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                        <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                                          <input 
                                            type="color" 
                                            value={resolvedHex}
                                            onChange={async (e) => {
                                              const newColor = e.target.value;
                                              const res = await updateTaskStage(col.id, { color: newColor });
                                              if (res.success) {
                                                setStages(prev => prev.map(s => s.id === col.id ? { ...s, color: newColor } : s));
                                              } else {
                                                alert(res.error || 'Erro ao alterar cor');
                                              }
                                            }}
                                            className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                                          />
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                                        </label>
                                      </div>

                                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        <button
                                          onClick={() => {
                                            setEditingStageId(null);
                                            handleCreateStage(col.id);
                                          }}
                                          className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                                          type="button"
                                        >
                                          <Plus size={13} />
                                          Nova Etapa
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingStageId(null);
                                            handleDeleteStage(col.id);
                                          }}
                                          className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                                          type="button"
                                        >
                                          <Trash2 size={13} />
                                          Excluir
                                        </button>
                                      </div>

                                      <button
                                        onClick={async () => {
                                          if (editingStageName.trim() && editingStageName.trim().toUpperCase() !== col.title.toUpperCase()) {
                                            const res = await updateTaskStage(col.id, { nome: editingStageName.trim() });
                                            if (res.success) {
                                              setStages(prev => prev.map(s => s.id === col.id ? { ...s, nome: editingStageName.trim() } : s));
                                            } else {
                                              alert(res.error || 'Erro ao renomear');
                                            }
                                          }
                                          setEditingStageId(null);
                                        }}
                                        className="w-full py-1.5 bg-[#1B4D3E] text-white rounded-lg text-xs font-bold hover:bg-[#13382d] border-none cursor-pointer"
                                        type="button"
                                      >
                                        Salvar Nome
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Cards list with customized scroll background */}
                            <div
                              className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                              onDragOver={(e) => handleDragOverStage(e, col.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (viewMode === 'kanban-etapa' && draggedStageId) {
                                  handleDropStage(draggedStageId, col.id);
                                } else {
                                  handleDrop(e, col.id === 'unassigned' || col.id === 'no_tag' ? '' : col.id, groupBy);
                                }
                              }}
                              style={{
                                width: '274px',
                                minWidth: '274px',
                                maxWidth: '274px',
                                marginLeft: '0px',
                                backgroundColor: bgRgba,
                                borderColor: borderRgba,
                                borderWidth: '0 1px 1px 1px',
                                borderStyle: 'solid',
                                height: 'calc(100vh - 300px)',
                                overflowY: 'auto',
                              }}
                            >
                              <div className="flex flex-col gap-1.5">
                                {col.tasks.length === 0 ? (
                                  !draggedStageId && draggedOverStageId === col.id ? (
                                    <div className="bg-slate-100/70 border-2 border-dashed border-[#1E3A8A]/30 rounded-xl h-28 w-full animate-pulse flex items-center justify-center">
                                      <span className="text-[10px] font-black text-[#1E3A8A]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
                                    </div>
                                  ) : (
                                    <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem tarefas</p>
                                    </div>
                                  )
                                ) : (
                                  <>
                                    {!draggedStageId && draggedOverStageId === col.id && (
                                      <div className="bg-slate-100/70 border-2 border-dashed border-[#1E3A8A]/30 rounded-xl h-28 w-full animate-pulse flex items-center justify-center">
                                        <span className="text-[10px] font-black text-[#1E3A8A]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
                                      </div>
                                    )}
                                    {col.tasks.map((t: any) => {
                                      const dl = getDeadlineStatus(t.vencimento, t.status);
                                      return (
                                        <div
                                          key={t.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, t.id)}
                                          onClick={() => setSelectedTask(t)}
                                          className="p-3 bg-white border border-slate-200 hover:border-[#1E3A8A]/30 rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all"
                                        >
                                          <div className="flex justify-between items-start gap-1.5 mb-1.5">
                                            <span className="text-[9px] font-mono font-bold text-slate-400">
                                              #{t.codigo || t.id.substring(0, 5)}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(t.prioridade)}`}>
                                              {t.prioridade}
                                            </span>
                                          </div>

                                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mb-2.5">
                                            {t.titulo}
                                          </h4>

                                          {/* Task Tags list */}
                                          {t.tags && t.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2.5">
                                              {t.tags.map((tt: any) => (
                                                <span 
                                                  key={tt.id} 
                                                  style={{ backgroundColor: `${tt.tag?.color}15`, color: tt.tag?.color, borderColor: `${tt.tag?.color}35` }}
                                                  className="text-[8px] font-black uppercase border px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                                                >
                                                  {tt.tag?.nome}
                                                </span>
                                              ))}
                                            </div>
                                          )}

                                          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-500">
                                            <span className={`flex items-center gap-1 ${dl.color}`}>
                                              <Calendar size={11} />
                                              <span className="text-[9px] font-bold">{dl.text}</span>
                                            </span>
                                            <div className="flex items-center gap-1 text-slate-550 shrink-0">
                                              {t.responsavel?.avatarUrl ? (
                                                <img 
                                                  src={t.responsavel.avatarUrl} 
                                                  alt={t.responsavel.nome} 
                                                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                                  title={t.responsavel.nome}
                                                />
                                              ) : (
                                                <div 
                                                  className="w-5 h-5 rounded-full bg-slate-200 text-slate-650 flex items-center justify-center text-[8px] font-bold uppercase"
                                                  title={t.responsavel?.nome || 'Não delegado'}
                                                >
                                                  {t.responsavel?.nome?.substring(0, 2).toUpperCase() || '?'}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {viewMode === 'kanban-etapa' && draggedStageId && draggedOverBeforeStageId === 'last' && (
                      <div 
                        className="w-[274px] shrink-0 bg-slate-100/40 border-2 border-dashed border-slate-300 rounded-2xl h-[calc(100vh-300px)] flex items-center justify-center mx-1.5 transition-all duration-200"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropStage(draggedStageId, 'last')}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mover para o Fim</span>
                        </div>
                      </div>
                    )}

                    {viewMode === 'kanban-etapa' && (
                      <div 
                        className="w-16 shrink-0 h-[calc(100vh-300px)] transition-all duration-200"
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedStageId) {
                            setDraggedOverBeforeStageId('last');
                          }
                        }}
                        onDrop={() => handleDropStage(draggedStageId!, 'last')}
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Task Form */}
      {showNewTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="text-[#1B4D3E]" size={20} /> Nova Tarefa
              </h3>
              <button onClick={() => setShowNewTask(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Título da Tarefa *</label>
                <input 
                  required 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#1B4D3E] text-xs font-semibold"
                  placeholder="Ex: Entregar relatório de eficiência" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descrição</label>
                <textarea 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#1B4D3E] text-xs font-semibold min-h-[60px]"
                  placeholder="Ex: Descrever metas e indicadores..." 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Etapa Inicial</label>
                  <select
                    value={newStageId}
                    onChange={e => setNewStageId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-650"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Responsável</label>
                  <select
                    value={newRespId}
                    onChange={e => setNewRespId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-650"
                  >
                    <option value="">Delegar para...</option>
                    {initialUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Prioridade</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-650"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={newVencimento}
                    onChange={e => setNewVencimento(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-650"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewTask(false)} 
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#1B4D3E] text-white rounded-xl text-xs font-bold hover:bg-[#13382d] border-none cursor-pointer"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Task Details (Trello Modal) */}
      {selectedTask && (
        <TaskDetailsModal
          task={tasks.find(t => t.id === selectedTask.id) || selectedTask}
          stages={stages}
          users={initialUsers}
          onClose={() => setSelectedTask(null)}
          refreshData={fetchData}
        />
      )}

      {/* CRM-style Custom Modal for Prompts, Confirms, and Alerts */}
      {customModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm border border-slate-100 flex flex-col gap-4 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-700">
                {customModal.title}
              </h4>
              <button 
                onClick={() => {
                  if (customModal.onCancel) customModal.onCancel();
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {customModal.type === 'prompt' && (
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  id="custom-modal-input"
                  defaultValue={customModal.defaultValue || ''}
                  placeholder={customModal.placeholder || ''}
                  className="text-xs px-3 py-2 border border-slate-200 focus:border-[#1E3A8A] rounded-xl outline-none font-medium w-full bg-slate-50 focus:bg-white transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                      customModal.onConfirm(input?.value || '');
                      setCustomModal(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                />
              </div>
            )}

            {customModal.type !== 'prompt' && (
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                {customModal.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {customModal.type !== 'alert' && (
                <button
                  onClick={() => {
                    if (customModal.onCancel) customModal.onCancel();
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                  customModal.onConfirm(customModal.type === 'prompt' ? (input?.value || '') : '');
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-black hover:bg-[#152e72] transition-colors cursor-pointer border-none"
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
