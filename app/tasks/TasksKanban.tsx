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

interface TasksKanbanProps {
  initialUsers: any[];
}

export default function TasksKanban({ initialUsers }: TasksKanbanProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  // View mode
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  
  // Kanban grouping mode: 'etapa' | 'responsavel' | 'etiqueta' | 'prazo'
  const [groupBy, setGroupBy] = useState<'etapa' | 'responsavel' | 'etiqueta' | 'prazo'>('etapa');
  
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

  // Stage CRUD States
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageModalType, setStageModalType] = useState<'create' | 'rename'>('create');
  const [stageModalVal, setStageModalVal] = useState('');
  const [stageModalColor, setStageModalColor] = useState('bg-slate-100');
  const [targetStageId, setTargetStageId] = useState('');

  // Dragging states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop on Column
  const handleDrop = async (e: React.DragEvent, targetValue: string, columnType: 'etapa' | 'responsavel' | 'etiqueta' | 'prazo') => {
    e.preventDefault();
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
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('lista')}
                title="Visualização em Lista"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  viewMode === 'lista'
                    ? 'bg-[#1B4D3E] text-white shadow-sm'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <LayoutList size={14} /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                title="Visualização em Kanban"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  viewMode === 'kanban'
                    ? 'bg-[#1B4D3E] text-white shadow-sm'
                    : 'text-amber-500 hover:text-amber-600'
                }`}
              >
                <Kanban size={14} /> Kanban
              </button>
            </div>

            {/* Kanban Grouping Dropdown (only visible in Kanban mode) */}
            {viewMode === 'kanban' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm text-xs font-bold text-slate-600 flex-shrink-0">
                <span className="text-slate-400">Agrupar por:</span>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as any)}
                  className="bg-transparent border-none outline-none font-bold text-[#1B4D3E] cursor-pointer"
                >
                  <option value="etapa">Etapa (Colunas)</option>
                  <option value="responsavel">Responsável</option>
                  <option value="etiqueta">Etiqueta</option>
                  <option value="prazo">Prazo (Bitrix Style)</option>
                </select>
              </div>
            )}
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
              onClick={() => {
                setStageModalType('create');
                setStageModalVal('');
                setShowStageModal(true);
              }}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-55 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0 cursor-pointer"
            >
              Configurar Colunas
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
          <div className="p-4 overflow-x-auto min-h-[calc(100vh-280px)]">
            <div className="flex gap-4 pb-4 select-none min-w-max">
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
                    color: 'border-slate-200 bg-slate-100/50',
                    tasks: filteredTasks.filter(t => t.responsavelId === u.id)
                  }));
                  columns.push({
                    id: 'unassigned',
                    title: 'Sem Responsável',
                    color: 'border-slate-200 bg-slate-100/30',
                    tasks: filteredTasks.filter(t => !t.responsavelId)
                  });
                } else if (groupBy === 'etiqueta') {
                  columns = tags.map(tg => ({
                    id: tg.id,
                    title: tg.nome,
                    color: `border-slate-200`,
                    tagColor: tg.color,
                    tasks: filteredTasks.filter(t => t.tags?.some((tt: any) => tt.tagId === tg.id))
                  }));
                  columns.push({
                    id: 'no_tag',
                    title: 'Sem Etiquetas',
                    color: 'border-slate-200 bg-slate-100/30',
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
                      color: 'bg-rose-50 border-rose-200 text-rose-700',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) < today && t.status !== 'CONCLUIDA')
                    },
                    {
                      id: 'hoje',
                      title: 'Hoje',
                      color: 'bg-amber-50 border-amber-200 text-amber-700',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) >= today && new Date(t.vencimento) <= endOfToday)
                    },
                    {
                      id: 'semana',
                      title: 'Esta Semana',
                      color: 'bg-blue-50 border-blue-200 text-blue-700',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) > endOfToday && new Date(t.vencimento) <= endOfWeek)
                    },
                    {
                      id: 'proxima_semana',
                      title: 'Próxima Semana',
                      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                      tasks: filteredTasks.filter(t => t.vencimento && new Date(t.vencimento) > endOfWeek && new Date(t.vencimento) <= endOfNextWeek)
                    },
                    {
                      id: 'sem_prazo',
                      title: 'Sem Prazo',
                      color: 'bg-slate-50 border-slate-200 text-slate-600',
                      tasks: filteredTasks.filter(t => !t.vencimento)
                    }
                  ];
                }

                return columns.map(col => {
                  return (
                    <div 
                      key={col.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id === 'unassigned' || col.id === 'no_tag' ? '' : col.id, groupBy)}
                      className="w-[280px] shrink-0 flex flex-col max-h-[calc(100vh-285px)] select-none rounded-2xl bg-white border border-slate-200/80 shadow-xs"
                    >
                      {/* Column Header */}
                      <div className={`p-3.5 border-b flex justify-between items-center rounded-t-2xl font-black uppercase tracking-wider text-[11px] ${col.color || 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {col.tagColor && (
                            <span style={{ backgroundColor: col.tagColor }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                          )}
                          <span className="truncate">{col.title}</span>
                          <span className="bg-slate-200/60 text-slate-700 rounded-md px-1.5 text-[9px] font-bold">
                            {col.tasks.length}
                          </span>
                        </div>
                      </div>

                      {/* Cards List */}
                      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-slate-50/40 min-h-0">
                        {col.tasks.map((t: any) => {
                          const dl = getDeadlineStatus(t.vencimento, t.status);
                          return (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, t.id)}
                              onClick={() => setSelectedTask(t)}
                              className="p-3 bg-white border border-slate-200 hover:border-[#1B4D3E]/30 rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all"
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
                        {col.tasks.length === 0 && (
                          <div className="text-center py-12 text-[10px] text-slate-400 italic">
                            Arraste tarefas para aqui.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
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

      {/* Modal: Stage Config Manager */}
      {showStageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
              <h3 className="text-md font-black text-slate-800">
                {stageModalType === 'create' ? 'Configurar Colunas' : 'Editar Coluna'}
              </h3>
              <button onClick={() => setShowStageModal(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              {stageModalType === 'create' ? (
                <>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest px-1">Colunas Ativas</p>
                    {stages.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                        <span className="truncate">{s.nome}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setStageModalType('rename');
                              setStageModalVal(s.nome);
                              setStageModalColor(s.color);
                              setTargetStageId(s.id);
                            }}
                            className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                          >
                            <Edit2 size={11} />
                          </button>
                          {stages.length > 1 && (
                            <button
                              onClick={async () => {
                                if (confirm(`Remover coluna "${s.nome}"? Esta ação só é permitida se não houver tarefas nela.`)) {
                                  const res = await deleteTaskStage(s.id);
                                  if (res.success) {
                                    fetchData();
                                  } else {
                                    alert(res.error);
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold text-slate-450 uppercase mb-2">Adicionar Nova Coluna</p>
                    <div className="flex gap-2">
                      <input 
                        value={stageModalVal}
                        onChange={e => setStageModalVal(e.target.value)}
                        placeholder="Nome da coluna"
                        className="text-xs p-2.5 border border-slate-200 rounded-xl flex-1 outline-none focus:border-[#1B4D3E]"
                      />
                      <button
                        onClick={async () => {
                          if (!stageModalVal.trim()) return;
                          const res = await createTaskStage(stageModalVal.trim());
                          if (res.success) {
                            setStageModalVal('');
                            fetchData();
                          }
                        }}
                        className="px-4 py-2 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#13382d] border-none cursor-pointer"
                      >
                        Criar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Coluna</label>
                    <input 
                      value={stageModalVal}
                      onChange={e => setStageModalVal(e.target.value)}
                      className="text-xs p-2.5 border border-slate-200 rounded-xl w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Cor / Tema</label>
                    <select
                      value={stageModalColor}
                      onChange={e => setStageModalColor(e.target.value)}
                      className="text-xs p-2 border border-slate-200 rounded-xl w-full font-semibold"
                    >
                      <option value="bg-slate-100 text-slate-700 border-slate-200">Cinza Claro (Padrão)</option>
                      <option value="bg-blue-50 text-blue-700 border-blue-200">Azul Suave</option>
                      <option value="bg-amber-50 text-amber-700 border-amber-200">Amarelo Suave</option>
                      <option value="bg-rose-50 text-rose-700 border-rose-200">Vermelho Suave</option>
                      <option value="bg-emerald-50 text-emerald-700 border-emerald-200">Verde Suave</option>
                      <option value="bg-indigo-50 text-indigo-700 border-indigo-200">Indigo Suave</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setStageModalType('create')}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={async () => {
                        if (!stageModalVal.trim()) return;
                        const res = await updateTaskStage(targetStageId, {
                          nome: stageModalVal.trim(),
                          color: stageModalColor
                        });
                        if (res.success) {
                          setStageModalType('create');
                          setStageModalVal('');
                          fetchData();
                        }
                      }}
                      className="px-4 py-1.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl hover:bg-[#13382d] border-none cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
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
    </div>
  );
}
