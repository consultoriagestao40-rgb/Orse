'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Target, 
  HelpCircle, 
  Users, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  PlusCircle, 
  StickyNote, 
  ArrowRight, 
  Sparkles,
  ClipboardList,
  Activity,
  Layers,
  Percent,
  Edit,
  Edit2,
  X,
  ArrowLeft,
  LayoutList,
  Kanban
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { 
  getPlanningData, 
  getTenantUsers, 
  saveRootCause, 
  deleteRootCause, 
  saveActionPlan, 
  deleteActionPlan, 
  saveOkrCiclo, 
  deleteOkrCiclo, 
  savePostit, 
  deletePostit, 
  saveCausaStages,
  RootCauseAnalysis, 
  ActionPlan, 
  OKRCiclo, 
  OKRObjective, 
  KR, 
  BrainstormPostit,
  CauseStage,
  SubAction
} from './actions';

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

const formatLocalDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T/);
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
};

export default function PlanejamentoPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'causas' | 'planos' | 'metas' | 'brainstorm'>('causas');
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [causas, setCausas] = useState<RootCauseAnalysis[]>([]);
  const [planosAcao, setPlanosAcao] = useState<ActionPlan[]>([]);
  const [okrCiclos, setOkrCiclos] = useState<OKRCiclo[]>([]);
  const [postits, setPostits] = useState<BrainstormPostit[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stagesCausa, setStagesCausa] = useState<CauseStage[]>([]);

  // Editing column stages
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState<string>('');

  // Drag and drop states for Cause Kanban
  const [draggedCausaId, setDraggedCausaId] = useState<string | null>(null);
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null);

  // Drag and drop states for Action Plan Kanban
  const [draggedPlanoId, setDraggedPlanoId] = useState<string | null>(null);
  const [draggedOverPlanoStageId, setDraggedOverPlanoStageId] = useState<string | null>(null);

  // Modals & Form States
  const [isEditingCausa, setIsEditingCausa] = useState(false);
  const [causaViewMode, setCausaViewMode] = useState<'kanban' | 'list'>('kanban');
  const [currentCausa, setCurrentCausa] = useState<Partial<RootCauseAnalysis>>({
    problema: '',
    porques: ['', '', '', '', ''],
    ishikawa: {
      metodo: [],
      materiaPrima: [],
      maoDeObra: [],
      maquina: [],
      medida: [],
      meioAmbiente: []
    },
    causaRaiz: '',
    status: 'RASCUNHO'
  });

  const [planoViewMode, setPlanoViewMode] = useState<'kanban' | 'list'>('kanban');

  const [isEditingPlano, setIsEditingPlano] = useState(false);
  const [currentPlano, setCurrentPlano] = useState<Partial<ActionPlan>>({
    titulo: '',
    causaRaizId: '',
    problemaDireto: '',
    responsavelId: '',
    resultadoEsperado: '',
    resultadoAtingido: '',
    dataInicio: '',
    dataFim: '',
    percentualRealizado: 0,
    status: 'PENDENTE',
    acoes: []
  });

  const updateSubActionField = (subId: string, field: keyof SubAction, value: any) => {
    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).map(a => {
        if (a.id === subId) {
          const updated = { ...a, [field]: value };
          if (field === 'status') {
            updated.percentualRealizado = value === 'CONCLUIDO' ? 100 : 0;
          }
          return updated;
        }
        return a;
      });

      // Recalcular progresso geral do plano com base nas sub-ações
      let percentualRealizado = 0;
      if (acoes.length > 0) {
        const completedCount = acoes.filter(acc => acc.status === 'CONCLUIDO').length;
        percentualRealizado = Math.round((completedCount / acoes.length) * 100);
      }

      return {
        ...prev,
        acoes,
        percentualRealizado
      };
    });
  };

  const handleDeleteSubAction = (subId: string) => {
    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).filter(a => a.id !== subId);
      let percentualRealizado = 0;
      if (acoes.length > 0) {
        const completedCount = acoes.filter(acc => acc.status === 'CONCLUIDO').length;
        percentualRealizado = Math.round((completedCount / acoes.length) * 100);
      }
      return {
        ...prev,
        acoes,
        percentualRealizado
      };
    });
  };

  const handleAddSubActionInline = () => {
    setCurrentPlano(prev => {
      const newSub: SubAction = {
        id: 'sub-' + Date.now(),
        what: '',
        why: '',
        where: '',
        when: new Date().toISOString().split('T')[0],
        who: '',
        how: '',
        howMuch: 0,
        status: 'PENDENTE',
        percentualRealizado: 0,
        evidencia: ''
      };
      return {
        ...prev,
        acoes: [...(prev.acoes || []), newSub]
      };
    });
  };

  const handleUpdateSubActionField = (subId: string, field: keyof SubAction, value: any) => {
    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).map(a => {
        if (a.id === subId) {
          const updated = { ...a, [field]: value };
          if (field === 'status') {
            updated.percentualRealizado = value === 'CONCLUIDO' ? 100 : 0;
          }
          return updated;
        }
        return a;
      });
      let percentualRealizado = 0;
      if (acoes.length > 0) {
        const completedCount = acoes.filter(acc => acc.status === 'CONCLUIDO').length;
        percentualRealizado = Math.round((completedCount / acoes.length) * 100);
      }
      return {
        ...prev,
        acoes,
        percentualRealizado
      };
    });
  };

  const renderKanbanCard = (pa: ActionPlan) => {
    const associatedCausa = causas.find(c => c.id === pa.causaRaizId);
    const responsavel = users.find(u => u.id === pa.responsavelId);
    const acoesRealizadas = pa.acoes?.filter(a => a.status === 'CONCLUIDO').length || 0;
    const totalAcoes = pa.acoes?.length || 0;

    return (
      <div 
        key={pa.id} 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('planoId', pa.id);
          setDraggedPlanoId(pa.id);
        }}
        onDragEnd={() => setDraggedPlanoId(null)}
        onClick={() => {
          setCurrentPlano(pa);
          setIsEditingPlano(true);
        }}
        className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-2xs transition-all cursor-grab active:cursor-grabbing relative group flex flex-col gap-3 text-left animate-in fade-in duration-200 ${
          draggedPlanoId === pa.id ? 'opacity-40 border-dashed border-[#1B4D3E]' : ''
        }`}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDeletePlanoObj(pa.id);
          }}
          className="absolute top-3 right-3 text-slate-350 hover:text-red-500 p-1 hover:bg-slate-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
        >
          <Trash2 size={13} />
        </button>

        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2 pr-6">
            <span className="text-[8.5px] font-black uppercase bg-slate-100 border border-slate-200 text-slate-500 rounded px-1.5 py-0.5 truncate max-w-[150px]">
              {associatedCausa ? `Causa: ${associatedCausa.causaRaiz}` : pa.problemaDireto ? `Prob: ${pa.problemaDireto}` : 'Entrada Direta'}
            </span>
            <span className="text-[8.5px] font-black text-slate-400 font-mono shrink-0">
              Prazo: {formatLocalDate(pa.dataFim)}
            </span>
          </div>

          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-tight">
            {pa.titulo}
          </h4>
        </div>

        {/* Progress & Responsibility */}
        <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center mt-1">
          <div className="flex-1 pr-4 flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-black text-slate-400">
              <span>PROGRESSO</span>
              <span>{pa.percentualRealizado}% ({acoesRealizadas}/{totalAcoes})</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${pa.status === 'CONCLUIDO' ? 'bg-[#1B4D3E]' : 'bg-blue-500'}`}
                style={{ width: `${pa.percentualRealizado}%` }}
              ></div>
            </div>
          </div>

          {/* Avatar com tooltip de nome */}
          <div className="relative group/avatar cursor-pointer">
            {responsavel?.avatarUrl ? (
              <img 
                src={responsavel.avatarUrl} 
                alt={responsavel.nome} 
                className="w-7 h-7 rounded-full object-cover border border-slate-150 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1B4D3E] text-white font-black text-[9.5px] flex items-center justify-center border border-slate-150 shadow-2xs shrink-0 uppercase">
                {responsavel?.nome ? responsavel.nome.substring(0, 2) : 'RS'}
              </div>
            )}
            
            <div className="absolute right-0 bottom-8 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded shadow-xl opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-30 border border-white/10">
              {responsavel?.nome || 'Sem responsável'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCausaKanbanCard = (c: RootCauseAnalysis) => {
    const badgeColor = c.tipo === '5_PORQUES' ? 'bg-[#1B4D3E]/10 text-[#1B4D3E] border-[#1B4D3E]/20' : 'bg-slate-800/10 text-slate-800 border-slate-800/20';
    const displayProblem = c.problema || 'Sem problema';
    
    // Count items for Ishikawa or Porquês
    let detailsText = '';
    if (c.tipo === '5_PORQUES') {
      const filledCount = c.porques?.filter(Boolean).length || 0;
      detailsText = `${filledCount} Porquês preenchidos`;
    } else {
      const ishikawaObj = c.ishikawa || {};
      const filledCount = Object.values(ishikawaObj).reduce((acc: number, curr: any) => acc + (curr?.length || 0), 0);
      detailsText = `${filledCount} causas identificadas`;
    }

    return (
      <div 
        key={c.id} 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('causaId', c.id);
          setDraggedCausaId(c.id);
        }}
        onDragEnd={() => setDraggedCausaId(null)}
        onClick={() => {
          setCurrentCausa(c);
          setIsEditingCausa(true);
        }}
        className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-2xs transition-all cursor-grab active:cursor-grabbing relative group flex flex-col gap-3 text-left animate-in fade-in duration-200 ${
          draggedCausaId === c.id ? 'opacity-40 border-dashed border-[#1B4D3E]' : ''
        }`}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCausaObj(c.id);
          }}
          className="absolute top-3 right-3 text-slate-350 hover:text-red-500 p-1 hover:bg-slate-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
          title="Excluir Análise"
        >
          <Trash2 size={13} />
        </button>

        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2 pr-6">
            <span className={`text-[8.5px] font-black uppercase border rounded px-1.5 py-0.5 truncate max-w-[150px] ${badgeColor}`}>
              {c.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}
            </span>
            <span className="text-[8.5px] font-black text-slate-400 font-mono shrink-0">
              {formatLocalDate(c.createdAt)}
            </span>
          </div>

          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-tight line-clamp-2">
            {c.tipo === '5_PORQUES' ? displayProblem : `Efeito: ${displayProblem}`}
          </h4>
        </div>

        <div className="border-t border-slate-100 pt-2.5 flex flex-col gap-2 mt-1">
          <div className="flex justify-between text-[9px] font-black text-slate-450">
            <span>{detailsText}</span>
          </div>
          
          {c.causaRaiz && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2 mt-0.5">
              <span className="text-[8.5px] font-black text-[#1B4D3E] block uppercase tracking-wider">Causa Raiz</span>
              <p className="text-[10px] font-bold text-slate-750 leading-relaxed truncate">{c.causaRaiz}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const [isOkrModalOpen, setIsOkrModalOpen] = useState(false);
  const [currentOkrCiclo, setCurrentOkrCiclo] = useState<Partial<OKRCiclo>>({
    nome: '',
    dataInicio: '',
    dataFim: '',
    objetivos: []
  });

  const [activeCicloId, setActiveCicloId] = useState<string>('');

  // Drag state for Post-its
  const [draggingPostitId, setDraggingPostitId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Load all planning and tenant data
  const loadData = async () => {
    setLoading(true);
    const resPlanning = await getPlanningData();
    const resUsers = await getTenantUsers();

    if (resPlanning.success && resPlanning.data) {
      setCausas(resPlanning.data.causas);
      setPlanosAcao(resPlanning.data.planosAcao);
      setOkrCiclos(resPlanning.data.okrCiclos);
      setPostits(resPlanning.data.postits);
      setStagesCausa(resPlanning.data.causasStages || [
        { id: 'RASCUNHO', nome: 'Rascunho', color: '#64748B' },
        { id: 'EM_ANALISE', nome: 'Em análise', color: '#F59E0B' },
        { id: 'EM_REVISAO', nome: 'Em revisão', color: '#3B82F6' },
        { id: 'CONCLUIDA', nome: 'Concluída', color: '#10B981' }
      ]);
      
      if (resPlanning.data.okrCiclos.length > 0 && !activeCicloId) {
        setActiveCicloId(resPlanning.data.okrCiclos[0].id);
      }
    }

    if (resUsers.success && resUsers.users) {
      setUsers(resUsers.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Root Cause Handlers
  const handleSaveCausa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveRootCause(currentCausa as any);
    if (res.success) {
      setIsEditingCausa(false);
      await loadData();
    } else {
      alert('Erro ao salvar análise de causa: ' + res.error);
      setLoading(false);
    }
  };

  const handleCreateCausaStage = async (insertAfterId?: string) => {
    const nome = prompt('Nome do novo status/etapa (ex: Em Revisão):');
    if (!nome || !nome.trim()) return;
    
    setLoading(true);
    const newStage: CauseStage = {
      id: 'stage-' + Date.now(),
      nome: nome.trim(),
      color: '#E2E8F0'
    };

    let updatedStages = [...stagesCausa];
    if (insertAfterId) {
      const idx = updatedStages.findIndex(s => s.id === insertAfterId);
      if (idx !== -1) {
        updatedStages.splice(idx + 1, 0, newStage);
      } else {
        updatedStages.push(newStage);
      }
    } else {
      updatedStages.push(newStage);
    }

    const res = await saveCausaStages(updatedStages);
    if (res.success) {
      setStagesCausa(updatedStages);
    } else {
      alert('Erro ao criar etapa: ' + res.error);
    }
    setLoading(false);
  };

  const handleUpdateCausaStage = async (id: string, updates: Partial<CauseStage>) => {
    const updatedStages = stagesCausa.map(s => s.id === id ? { ...s, ...updates } : s);
    setStagesCausa(updatedStages);
    await saveCausaStages(updatedStages);
  };

  const handleDeleteCausaStage = async (id: string) => {
    const causesInStage = causas.filter(c => c.status === id);
    if (causesInStage.length > 0) {
      alert('Não é possível excluir um status/etapa que contém análises ativas. Mova as análises primeiro.');
      return;
    }

    if (!confirm('Deseja realmente excluir esta etapa/status?')) return;

    setLoading(true);
    const updatedStages = stagesCausa.filter(s => s.id !== id);
    const res = await saveCausaStages(updatedStages);
    if (res.success) {
      setStagesCausa(updatedStages);
    } else {
      alert('Erro ao excluir etapa: ' + res.error);
    }
    setLoading(false);
  };

  const handleDropCausa = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDraggedOverStageId(null);
    const causaId = e.dataTransfer.getData('causaId') || draggedCausaId;
    if (!causaId) return;

    setDraggedCausaId(null);
    const targetCausa = causas.find(c => c.id === causaId);
    if (!targetCausa || targetCausa.status === targetStageId) return;

    setCausas(prev => prev.map(c => c.id === causaId ? { ...c, status: targetStageId } : c));

    const updatedCausa = { ...targetCausa, status: targetStageId };
    const res = await saveRootCause(updatedCausa as any);
    if (!res.success) {
      alert('Erro ao atualizar status da causa: ' + res.error);
      await loadData();
    }
  };

  const handleDropPlano = async (e: React.DragEvent, targetStatus: 'PENDENTE' | 'ATRASADO' | 'CONCLUIDO') => {
    e.preventDefault();
    setDraggedOverPlanoStageId(null);
    const planoId = e.dataTransfer.getData('planoId') || draggedPlanoId;
    if (!planoId) return;

    setDraggedPlanoId(null);
    const targetPlano = planosAcao.find(p => p.id === planoId);
    if (!targetPlano || targetPlano.status === targetStatus) return;

    setPlanosAcao(prev => prev.map(p => p.id === planoId ? { ...p, status: targetStatus } : p));

    const updatedPlano = { ...targetPlano, status: targetStatus };
    const res = await saveActionPlan(updatedPlano as ActionPlan);
    if (!res.success) {
      alert('Erro ao atualizar status do plano: ' + res.error);
      await loadData();
    }
  };

  const handleDeleteCausaObj = async (id: string) => {
    if (confirm('Deseja realmente excluir esta análise de causa raiz?')) {
      setLoading(true);
      const res = await deleteRootCause(id);
      if (res.success) {
        await loadData();
      } else {
        alert('Erro ao excluir: ' + res.error);
        setLoading(false);
      }
    }
  };

  // Action Plan Handlers
  const handleSavePlano = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveActionPlan(currentPlano as ActionPlan);
    if (res.success) {
      setIsEditingPlano(false);
      await loadData();
    } else {
      alert('Erro ao salvar plano de ação: ' + res.error);
      setLoading(false);
    }
  };

  const handleDeletePlanoObj = async (id: string) => {
    if (confirm('Deseja realmente excluir este plano de ação?')) {
      setLoading(true);
      const res = await deleteActionPlan(id);
      if (res.success) {
        await loadData();
      } else {
        alert('Erro ao excluir: ' + res.error);
        setLoading(false);
      }
    }
  };

  // OKR Cycle Handlers
  const handleSaveOkr = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveOkrCiclo(currentOkrCiclo as OKRCiclo);
    if (res.success) {
      setIsOkrModalOpen(false);
      await loadData();
    } else {
      alert('Erro ao salvar ciclo de OKR: ' + res.error);
      setLoading(false);
    }
  };

  const handleDeleteOkrObj = async (id: string) => {
    if (confirm('Deseja realmente excluir este ciclo de OKR?')) {
      setLoading(true);
      const res = await deleteOkrCiclo(id);
      if (res.success) {
        if (activeCicloId === id) setActiveCicloId('');
        await loadData();
      } else {
        alert('Erro ao excluir: ' + res.error);
        setLoading(false);
      }
    }
  };

  // Brainstorm Post-it Handlers
  const handleAddPostit = async (cor: string) => {
    const newPostit: Omit<BrainstormPostit, 'userId' | 'createdAt'> = {
      id: 'postit-' + Date.now(),
      texto: 'Nova ideia...',
      cor,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200
    };
    const res = await savePostit(newPostit);
    if (res.success) {
      await loadData();
    }
  };

  const handleUpdatePostitText = async (id: string, texto: string) => {
    const postit = postits.find(p => p.id === id);
    if (postit) {
      const updated = { ...postit, texto };
      // Local update for responsive typing
      setPostits(prev => prev.map(p => p.id === id ? updated : p));
      await savePostit(updated);
    }
  };

  const handleDeletePostitObj = async (id: string) => {
    const res = await deletePostit(id);
    if (res.success) {
      await loadData();
    }
  };

  // Dragging mechanics for Post-its
  const handlePostitMouseDown = (id: string) => {
    setDraggingPostitId(id);
  };

  const handleBoardMouseMove = async (e: React.MouseEvent) => {
    if (!draggingPostitId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left - 80, 0), rect.width - 170);
    const y = Math.min(Math.max(e.clientY - rect.top - 80, 0), rect.height - 170);

    setPostits(prev => prev.map(p => p.id === draggingPostitId ? { ...p, x, y } : p));
  };

  const handleBoardMouseUp = async () => {
    if (!draggingPostitId) return;
    const postit = postits.find(p => p.id === draggingPostitId);
    if (postit) {
      await savePostit(postit);
    }
    setDraggingPostitId(null);
  };

  // KPI Calculations
  const allSubActions = planosAcao.reduce((acc, pa) => [...acc, ...(pa.acoes || [])], [] as SubAction[]);
  const totalSubActions = allSubActions.length;
  
  const concluídasAcoesCount = allSubActions.filter(a => a.status === 'CONCLUIDO').length;
  const pendentesAcoesList = allSubActions.filter(a => a.status !== 'CONCLUIDO');
  
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  
  const atrasadasAcoesCount = pendentesAcoesList.filter(a => a.status === 'EM_ATRASO' || (a.when && new Date(a.when) < todayDate)).length;
  const noPrazoAcoesCount = pendentesAcoesList.length - atrasadasAcoesCount;

  const pctExecucao = totalSubActions > 0 ? Math.round((concluídasAcoesCount / totalSubActions) * 100) : 0;
  const pctAtrasadas = totalSubActions > 0 ? Math.round((atrasadasAcoesCount / totalSubActions) * 100) : 0;
  const pctPendentes = totalSubActions > 0 ? Math.round((noPrazoAcoesCount / totalSubActions) * 100) : 0;

  const concluídasAcoes = concluídasAcoesCount;
  const atrasadasAcoes = atrasadasAcoesCount;
  const pendentesAcoes = noPrazoAcoesCount;

  // OKR calculations
  const activeCiclo = okrCiclos.find(c => c.id === activeCicloId);
  const totalKRs = activeCiclo?.objetivos?.reduce((acc, obj) => acc + (obj.krs?.length || 0), 0) || 0;
  const KRsBatinados = activeCiclo?.objetivos?.reduce((acc, obj) => 
    acc + krCountReached(obj.krs || []), 0) || 0;

  function krCountReached(krs: KR[]): number {
    return krs.filter(kr => {
      if (kr.valorAlvo >= kr.valorInicial) {
        return kr.valorAtual >= kr.valorAlvo;
      } else {
        return kr.valorAtual <= kr.valorAlvo;
      }
    }).length;
  }

  const isKanbanMode = 
    (activeTab === 'causas' && causaViewMode === 'kanban' && !isEditingCausa) ||
    (activeTab === 'planos' && planoViewMode === 'kanban' && !isEditingPlano);

  return (
    <div id="planejamento-layout-root" className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className={`flex-1 no-print ${
        isKanbanMode 
          ? 'overflow-auto h-screen p-0 bg-slate-50' 
          : 'p-4 md:p-6 overflow-y-auto'
      }`}>
        <div className={`space-y-6 ${
          isKanbanMode 
            ? 'w-full flex flex-col' 
            : 'max-w-[1600px] mx-auto w-full px-2 sm:px-4'
        }`}>
          <div className={`${isKanbanMode ? 'px-8 pt-8 pb-3 space-y-4' : 'space-y-6'} ${isEditingPlano ? 'hidden' : ''}`}>
          
          {/* HEADER DO MÓDULO */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2.5">
                <Brain size={24} className="stroke-[2.5]" /> Planejamento, Metas & Causas Raízes
              </h1>
              <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wider">
                Análise 5 Porquês, Diagrama de Ishikawa, Planos de Ação 5W2H, Metas/OKRs e Brainstorming
              </p>
            </div>
            
            {/* Botões rápidos */}
            <div className="flex gap-2 shrink-0">
              {activeTab === 'causas' && !isEditingCausa && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1 flex-shrink-0 mr-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => setCausaViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-none ${
                        causaViewMode === 'list'
                          ? 'bg-[#1B4D3E] text-white shadow-3xs'
                          : 'text-amber-500 hover:text-amber-600 bg-transparent'
                      }`}
                    >
                      <LayoutList size={14} /> Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setCausaViewMode('kanban')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-none ${
                        causaViewMode === 'kanban'
                          ? 'bg-[#1B4D3E] text-white shadow-3xs'
                          : 'text-amber-500 hover:text-amber-600 bg-transparent'
                      }`}
                    >
                      <Kanban size={14} /> Kanban
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentCausa({
                        tipo: '5_PORQUES',
                        problema: '',
                        porques: ['', '', '', '', ''],
                        ishikawa: { metodo: [], materiaPrima: [], maoDeObra: [], maquina: [], medida: [], meioAmbiente: [] },
                        causaRaiz: '',
                        status: 'RASCUNHO'
                      });
                      setIsEditingCausa(true);
                    }}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                  >
                    <PlusCircle size={14} /> Novo 5 Porquês
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentCausa({
                        tipo: 'ISHIKAWA',
                        problema: '',
                        porques: ['', '', '', '', ''],
                        ishikawa: { metodo: [], materiaPrima: [], maoDeObra: [], maquina: [], medida: [], meioAmbiente: [] },
                        causaRaiz: '',
                        status: 'RASCUNHO'
                      });
                      setIsEditingCausa(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                  >
                    <PlusCircle size={14} /> Novo Ishikawa
                  </button>
                </div>
              )}
              {activeTab === 'planos' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1 flex-shrink-0 mr-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => setPlanoViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-none ${
                        planoViewMode === 'list'
                          ? 'bg-[#1B4D3E] text-white shadow-3xs'
                          : 'text-amber-500 hover:text-amber-600 bg-transparent'
                      }`}
                    >
                      <LayoutList size={14} /> Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanoViewMode('kanban')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-none ${
                        planoViewMode === 'kanban'
                          ? 'bg-[#1B4D3E] text-white shadow-3xs'
                          : 'text-amber-500 hover:text-amber-600 bg-transparent'
                      }`}
                    >
                      <Kanban size={14} /> Kanban
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setCurrentPlano({
                        titulo: '',
                        causaRaizId: '',
                        problemaDireto: '',
                        responsavelId: '',
                        resultadoEsperado: '',
                        resultadoAtingido: '',
                        dataInicio: new Date().toISOString().split('T')[0],
                        dataFim: new Date().toISOString().split('T')[0],
                        percentualRealizado: 0,
                        status: 'PENDENTE',
                        acoes: []
                      });
                      setIsEditingPlano(true);
                    }}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                  >
                    <PlusCircle size={14} /> Novo Plano 5W2H
                  </button>
                </div>
              )}
              {activeTab === 'metas' && (
                <button 
                  onClick={() => {
                    setCurrentOkrCiclo({
                      nome: 'Novo Ciclo',
                      dataInicio: new Date().toISOString().split('T')[0],
                      dataFim: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      objetivos: []
                    });
                    setIsOkrModalOpen(true);
                  }}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle size={14} /> Novo Ciclo Metas
                </button>
              )}
            </div>
          </header>

          {/* PAINEL DE KPIS NO TOPO */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Índice Execução</span>
                <span className="text-2xl font-black text-slate-800">{pctExecucao}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Ações Concluídas</span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#1B4D3E]">
                <Percent size={20} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Resultados KRs</span>
                <span className="text-2xl font-black text-slate-800">{KRsBatinados} / {totalKRs}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">KRs Atingidos no Ciclo</span>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Target size={20} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ações Pendentes</span>
                <span className="text-2xl font-black text-slate-800">{pctPendentes}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">{pendentesAcoes} Ações no Prazo</span>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Activity size={20} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ações Atrasadas</span>
                <span className="text-2xl font-black text-red-600">{pctAtrasadas}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">{atrasadasAcoes} Fora do Prazo</span>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <AlertTriangle size={20} className="stroke-[2.5]" />
              </div>
            </div>
          </section>

          {/* TAB NAVIGATION */}
          <div className="border-b border-slate-200 select-none">
            <div className="flex gap-6">
              {[
                { id: 'causas', label: '1. Causa Raiz & Ishikawa', icon: HelpCircle },
                { id: 'planos', label: '2. Plano de Ação 5W2H', icon: ClipboardList },
                { id: 'metas', label: '3. OKRs & Metas', icon: Layers },
                { id: 'brainstorm', label: '4. Brainstorming', icon: StickyNote },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
          </div>

          {/* TAB CONTENTS */}
          {!isEditingPlano && (loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-250 border-t-[#1B4D3E] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
                        {/* ABA 1: CAUSA RAIZ & ISHIKAWA */}
              {activeTab === 'causas' && (
                isEditingCausa ? (
                  /* EDITOR EM TELA CHEIA */
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <button
                        type="button"
                        onClick={() => setIsEditingCausa(false)}
                        className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                      >
                        <ArrowLeft size={16} /> Voltar para Análises
                      </button>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        {currentCausa.id 
                          ? `Editar Análise: ${currentCausa.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}`
                          : `Nova Análise: ${currentCausa.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}`
                        }
                      </h3>
                      <div className="w-[100px]"></div>
                    </div>

                    <form onSubmit={handleSaveCausa} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status da Análise */}
                        <div className="space-y-1 col-span-1 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status da Análise</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {stagesCausa.map(st => {
                              const active = currentCausa.status === st.id;
                              const resolvedHex = resolveColorToHex(st.color);
                              const contrast = getContrastYIQ(resolvedHex);
                              const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
                              const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
                              const textHex = getDarkenedHexForText(resolvedHex);

                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setCurrentCausa(prev => ({ ...prev, status: st.id as any }))}
                                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer`}
                                  style={{
                                    backgroundColor: active ? resolvedHex : bgRgba,
                                    borderColor: active ? resolvedHex : borderRgba,
                                    color: active ? (contrast === 'white' ? '#fff' : '#000') : textHex,
                                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                  }}
                                >
                                  {st.nome}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Método de Análise */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Método de Análise</label>
                          <div className="flex gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => setCurrentCausa(prev => ({ ...prev, tipo: '5_PORQUES' }))}
                              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                currentCausa.tipo === '5_PORQUES'
                                  ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              5 Porquês
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentCausa(prev => ({ ...prev, tipo: 'ISHIKAWA' }))}
                              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                currentCausa.tipo === 'ISHIKAWA'
                                  ? 'bg-slate-800 border-slate-800 text-white shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              Ishikawa (6 Ms)
                            </button>
                          </div>
                        </div>

                        {/* Efeito / Problema Principal */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Efeito / Problema Principal</label>
                          <input 
                            type="text" 
                            required
                            value={currentCausa.problema || ''}
                            onChange={(e) => setCurrentCausa(prev => ({ ...prev, problema: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                            placeholder="Ex: Queda na qualidade de entrega de ativos"
                          />
                        </div>
                      </div>

                      {/* Condicional para 5 Porquês */}
                      {(currentCausa.tipo === '5_PORQUES' || !currentCausa.tipo) && (
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Análise dos 5 Porquês</label>
                          {(currentCausa.porques || []).map((pq, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <span className="w-20 text-[9px] font-black text-slate-400 uppercase">Porquê {idx + 1}:</span>
                              <input 
                                type="text"
                                required={idx < 3} // Exige no mínimo 3
                                value={pq || ''}
                                onChange={(e) => {
                                  const newPorques = [...(currentCausa.porques || [])];
                                  newPorques[idx] = e.target.value;
                                  setCurrentCausa(prev => ({ ...prev, porques: newPorques }));
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                                placeholder={`Por que esse problema ocorre?`}
                              />
                              {(currentCausa.porques || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPorques = [...(currentCausa.porques || [])];
                                    newPorques.splice(idx, 1);
                                    setCurrentCausa(prev => ({ ...prev, porques: newPorques }));
                                  }}
                                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                                  title="Remover Porquê"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          ))}

                          <div className="pt-2 flex justify-start">
                            <button
                              type="button"
                              onClick={() => {
                                const newPorques = [...(currentCausa.porques || [])];
                                newPorques.push('');
                                setCurrentCausa(prev => ({ ...prev, porques: newPorques }));
                              }}
                              className="px-4 py-2 border border-dashed border-slate-350 hover:border-[#1B4D3E]/50 rounded-xl text-slate-500 hover:text-[#1B4D3E] flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer bg-transparent"
                            >
                              <Plus size={14} /> Adicionar Porquê
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Condicional para Diagrama de Ishikawa */}
                      {currentCausa.tipo === 'ISHIKAWA' && (
                        <div className="border-t border-slate-100 pt-4 space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Espinhos de Ishikawa (6 Ms)</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                              { title: 'Método', key: 'metodo', desc: 'Processos, regras e procedimentos' },
                              { title: 'Mão de Obra', key: 'maoDeObra', desc: 'Treinamento, erros, capacitação' },
                              { title: 'Máquina', key: 'maquina', desc: 'Equipamentos, ferramentas, sistemas' },
                              { title: 'Matéria-prima', key: 'materiaPrima', desc: 'Insumos, materiais, fornecedores' },
                              { title: 'Medida', key: 'medida', desc: 'Métricas, KPIs, metas' },
                              { title: 'Meio Ambiente', key: 'meioAmbiente', desc: 'Clima, trânsito, infraestrutura externa' }
                            ].map(m => {
                              const currentList = (currentCausa.ishikawa as any)?.[m.key] || [];
                              return (
                                <div key={m.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center select-none">
                                      <div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">{m.title}</span>
                                        <span className="text-[9px] text-slate-400 font-bold block">{m.desc}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Badge list */}
                                    <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center pt-1">
                                      {currentList.length === 0 ? (
                                        <span className="text-[9.5px] italic text-slate-400">Nenhuma causa adicionada</span>
                                      ) : (
                                        currentList.map((item: string, idx: number) => (
                                          <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[9.5px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                                            {item}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newList = currentList.filter((_: any, i: number) => i !== idx);
                                                setCurrentCausa(prev => ({
                                                  ...prev,
                                                  ishikawa: {
                                                    ...(prev.ishikawa || {}),
                                                    [m.key]: newList
                                                  } as any
                                                }));
                                              }}
                                              className="text-slate-400 hover:text-red-500 font-black ml-1 cursor-pointer border-none bg-transparent"
                                            >
                                              &times;
                                            </button>
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Input for adding new cause */}
                                  <div className="flex gap-2 pt-2">
                                    <input
                                      type="text"
                                      id={`input-ishikawa-${m.key}`}
                                      className="flex-1 bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                                      placeholder="Adicionar causa..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const inputEl = e.currentTarget;
                                          const val = inputEl.value.trim();
                                          if (val) {
                                            const newList = [...currentList, val];
                                            setCurrentCausa(prev => ({
                                              ...prev,
                                              ishikawa: {
                                                ...(prev.ishikawa || {}),
                                                [m.key]: newList
                                              } as any
                                            }));
                                            inputEl.value = '';
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const inputEl = document.getElementById(`input-ishikawa-${m.key}`) as HTMLInputElement;
                                        const val = inputEl?.value.trim();
                                        if (val) {
                                          const newList = [...currentList, val];
                                          setCurrentCausa(prev => ({
                                            ...prev,
                                            ishikawa: {
                                              ...(prev.ishikawa || {}),
                                              [m.key]: newList
                                            } as any
                                          }));
                                          inputEl.value = '';
                                        }
                                      }}
                                      className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg transition-colors cursor-pointer border-none"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* LIVE PREVIEW OF FISHBONE DIAGRAM */}
                          <div className="space-y-2 mt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Visualização em Tempo Real (Diagrama de Ishikawa)</label>
                            <div className="overflow-x-auto w-full select-none bg-slate-50 border border-slate-200 rounded-3xl p-6 min-w-[850px] relative">
                              <div className="flex flex-col relative w-full h-[360px] max-w-[950px] mx-auto">
                                
                                {/* 1. TOP BONES */}
                                <div className="grid grid-cols-3 gap-6 absolute top-0 left-0 w-[80%] h-[140px] z-10">
                                  {[
                                    { title: 'Método', key: 'metodo', bg: 'bg-blue-50 border-blue-200 text-blue-800' },
                                    { title: 'Mão de Obra', key: 'maoDeObra', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                                    { title: 'Máquina', key: 'maquina', bg: 'bg-purple-50 border-purple-200 text-purple-800' }
                                  ].map((cat) => {
                                    const list = (currentCausa.ishikawa as any)?.[cat.key] || [];
                                    return (
                                      <div key={cat.key} className="flex flex-col justify-between h-full relative">
                                        <div className={`border rounded-xl p-2.5 shadow-2xs text-[10px] ${cat.bg} overflow-y-auto max-h-[105px]`}>
                                          <span className="font-black uppercase tracking-wider block border-b border-current/20 pb-0.5 mb-1">{cat.title}</span>
                                          {list.length === 0 ? (
                                            <span className="italic opacity-60 text-[9px]">Sem causas</span>
                                          ) : (
                                            <ul className="list-disc list-inside space-y-0.5 font-bold">
                                              {list.map((item: string, i: number) => <li key={i} className="truncate">{item}</li>)}
                                            </ul>
                                          )}
                                        </div>
                                        <svg className="absolute bottom-[-35px] left-[50%] h-[35px] w-[60px] overflow-visible pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                                          <line x1="0" y1="0" x2="40" y2="35" stroke="#64748B" strokeWidth="2" />
                                        </svg>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* 2. BACKBONE / CENTER SPINE */}
                                <div className="absolute top-[175px] left-0 w-full h-[15px] flex items-center z-0">
                                  <div className="h-1 bg-slate-400 flex-1 relative">
                                    <div className="absolute right-[-10px] top-[50%] translate-y-[-50%] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-slate-400"></div>
                                  </div>
                                  <div className="w-[20%] shrink-0 ml-4 bg-[#1B4D3E] text-white border border-[#10B981]/30 rounded-2xl p-3 shadow-md flex items-center justify-center text-center text-[10.5px] font-black uppercase tracking-wider h-[80px] overflow-y-auto font-bold leading-tight">
                                    {currentCausa.problema || 'EFEITO / PROBLEMA PRINCIPAL'}
                                  </div>
                                </div>

                                {/* 3. BOTTOM BONES */}
                                <div className="grid grid-cols-3 gap-6 absolute bottom-0 left-0 w-[80%] h-[140px] z-10">
                                  {[
                                    { title: 'Matéria-prima', key: 'materiaPrima', bg: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
                                    { title: 'Medida', key: 'medida', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
                                    { title: 'Meio Ambiente', key: 'meioAmbiente', bg: 'bg-rose-50 border-rose-200 text-rose-800' }
                                  ].map((cat) => {
                                    const list = (currentCausa.ishikawa as any)?.[cat.key] || [];
                                    return (
                                      <div key={cat.key} className="flex flex-col justify-end h-full relative">
                                        <svg className="absolute top-[-35px] left-[50%] h-[35px] w-[60px] overflow-visible pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                                          <line x1="0" y1="35" x2="40" y2="0" stroke="#64748B" strokeWidth="2" />
                                        </svg>
                                        <div className={`border rounded-xl p-2.5 shadow-2xs text-[10px] ${cat.bg} overflow-y-auto max-h-[105px]`}>
                                          <span className="font-black uppercase tracking-wider block border-b border-current/20 pb-0.5 mb-1">{cat.title}</span>
                                          {list.length === 0 ? (
                                            <span className="italic opacity-60 text-[9px]">Sem causas</span>
                                          ) : (
                                            <ul className="list-disc list-inside space-y-0.5 font-bold">
                                              {list.map((item: string, i: number) => <li key={i} className="truncate">{item}</li>)}
                                            </ul>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-4 space-y-1">
                        <label className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wider block font-black">Causa Raiz Conclusiva</label>
                        <input 
                          type="text" 
                          required
                          value={currentCausa.causaRaiz || ''}
                          onChange={(e) => setCurrentCausa(prev => ({ ...prev, causaRaiz: e.target.value }))}
                          className="w-full bg-emerald-50 border border-emerald-250 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 outline-none focus:border-[#1B4D3E]"
                          placeholder="Conclusão final da causa raiz"
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingCausa(false)}
                          className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                        >
                          Salvar Análise
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* LISTAGEM PRINCIPAL (KANBAN / LISTA) */
                  <div className="space-y-6">
                    {/* Indicador de Quantidade */}
                    <div className={`flex justify-between items-center select-none pb-2 ${isKanbanMode ? 'px-8' : ''}`}>
                      <span className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">
                        {causas.length} Análises de Causa
                      </span>
                    </div>

                    {causas.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm">
                        Nenhuma análise de causa raiz cadastrada. Clique em "Novo 5 Porquês" ou "Novo Ishikawa" para começar.
                      </div>
                    ) : causaViewMode === 'list' ? (
                      /* VISÃO LISTA */
                      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/75 border-b border-slate-200 select-none text-[9.5px] font-black text-slate-450 uppercase tracking-wider">
                                <th className="py-3.5 px-6">Problema / Efeito</th>
                                <th className="py-3.5 px-6">Método de Análise</th>
                                <th className="py-3.5 px-6">Status</th>
                                <th className="py-3.5 px-6">Causa Raiz Conclusiva</th>
                                <th className="py-3.5 px-6">Data de Criação</th>
                                <th className="py-3.5 px-6 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                               {causas.map(c => {
                                 const stage = stagesCausa.find(s => s.id === c.status);
                                 const statusText = stage ? stage.nome : 'Rascunho';
                                 const stageColor = stage ? stage.color : '#64748B';
                                 const resolvedHex = resolveColorToHex(stageColor);
                                 const contrast = getContrastYIQ(resolvedHex);
                                 const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
                                 const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
                                 const textHex = getDarkenedHexForText(resolvedHex);

                                 return (
                                   <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                     <td 
                                       className="py-4 px-6 font-black uppercase text-slate-800 cursor-pointer max-w-[250px] truncate" 
                                       onClick={() => { setCurrentCausa(c); setIsEditingCausa(true); }}
                                     >
                                       {c.problema}
                                     </td>
                                     <td className="py-4 px-6">
                                       <span className={`text-[9px] font-black uppercase border rounded-md px-2 py-0.5 ${
                                         c.tipo === '5_PORQUES' ? 'bg-[#1B4D3E]/10 border-[#1B4D3E]/20 text-[#1B4D3E]' : 'bg-slate-800/10 border-slate-800/20 text-slate-850'
                                       }`}>
                                         {c.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}
                                       </span>
                                     </td>
                                     <td className="py-4 px-6">
                                       <span 
                                         className="text-[9px] font-black uppercase border rounded-md px-2 py-0.5"
                                         style={{
                                           backgroundColor: bgRgba,
                                           borderColor: borderRgba,
                                           color: textHex
                                         }}
                                       >
                                         {statusText}
                                       </span>
                                     </td>
                                    <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate">
                                      {c.causaRaiz || '-'}
                                    </td>
                                    <td className="py-4 px-6 text-slate-450 font-mono">
                                      {formatLocalDate(c.createdAt)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          onClick={() => { setCurrentCausa(c); setIsEditingCausa(true); }} 
                                          className="p-1.5 text-slate-550 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                          title="Editar Análise"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteCausaObj(c.id)} 
                                          className="p-1.5 text-slate-550 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                          title="Excluir Análise"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* VISÃO KANBAN */
                      <div className="pb-6 select-none bg-slate-50 pl-8 pr-8">
                        <div className="flex gap-[3px] min-w-max">
                          {(() => {
                            const columns = stagesCausa.map(s => ({
                              id: s.id,
                              nome: s.nome,
                              color: s.color,
                              causas: causas.filter(c => c.status === s.id)
                            }));

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
                                    <div
                                      key={col.id}
                                      className="flex flex-col flex-shrink-0 transition-opacity duration-200"
                                      style={{ width: '274px' }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setDraggedOverStageId(col.id);
                                      }}
                                      onDragLeave={() => setDraggedOverStageId(null)}
                                      onDrop={(e) => handleDropCausa(e, col.id)}
                                    >
                                      {/* Column Header Sticky */}
                                      <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (columns.length - idx) }}>
                                        <div className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto">
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
                                                {col.nome}
                                              </h3>
                                              <span className="text-[10px] font-bold mt-1 opacity-90 truncate select-none leading-none">
                                                {col.causas.length} {col.causas.length === 1 ? 'análise' : 'análises'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Card Column Container with Dynamic Colors */}
                                      <div
                                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none flex flex-col gap-3"
                                        style={{
                                          width: '274px',
                                          minWidth: '274px',
                                          maxWidth: '274px',
                                          backgroundColor: bgRgba,
                                          borderColor: borderRgba,
                                          borderWidth: '0 1px 1px 1px',
                                          borderStyle: 'solid',
                                          height: 'calc(100vh - 52px)',
                                          overflowY: 'auto'
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          setDraggedOverStageId(col.id);
                                        }}
                                        onDrop={(e) => handleDropCausa(e, col.id)}
                                      >
                                        {draggedOverStageId === col.id && draggedCausaId && (
                                          <div className="bg-slate-100/70 border-2 border-dashed border-[#1B4D3E]/30 rounded-lg h-28 w-full animate-pulse flex items-center justify-center">
                                            <span className="text-[10px] font-black text-[#1B4D3E]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
                                          </div>
                                        )}

                                        {col.causas.length === 0 ? (
                                          <div className="border border-dashed border-slate-300 rounded-lg py-10 flex flex-col items-center justify-center gap-2 flex-1 hover:bg-white/50 transition-all">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sem análises</span>
                                          </div>
                                        ) : (
                                          col.causas.map(c => renderCausaKanbanCard(c))
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* ABA 2: PLANO DE AÇÃO 5W2H */}
              {activeTab === 'planos' && (
                <div className="space-y-6">
                  {/* Indicador de Quantidade */}
                  <div className={`flex justify-between items-center select-none pb-2 ${isKanbanMode ? 'px-8' : ''}`}>
                    <span className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">
                      {planosAcao.length} Planos de Ação
                    </span>
                  </div>

                  {planosAcao.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm">
                      Nenhum plano de ação cadastrado. Clique em "Novo Plano 5W2H" para iniciar.
                    </div>
                  ) : planoViewMode === 'list' ? (
                    /* VISÃO LISTA */
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 select-none text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                              <th className="py-3.5 px-6">Plano de Ação</th>
                              <th className="py-3.5 px-6">Causa Vinculada / Problema</th>
                              <th className="py-3.5 px-6">Responsável</th>
                              <th className="py-3.5 px-6">Prazo Final</th>
                              <th className="py-3.5 px-6">Status</th>
                              <th className="py-3.5 px-6">Progresso</th>
                              <th className="py-3.5 px-6 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                            {planosAcao.map(pa => {
                              const associatedCausa = causas.find(c => c.id === pa.causaRaizId);
                              const responsavel = users.find(u => u.id === pa.responsavelId);
                              const acoesRealizadas = pa.acoes?.filter(a => a.status === 'CONCLUIDO').length || 0;
                              const totalAcoes = pa.acoes?.length || 0;

                              let statusBadge = 'bg-blue-50 border-blue-200 text-blue-750';
                              if (pa.status === 'CONCLUIDO') statusBadge = 'bg-emerald-50 border-emerald-200 text-emerald-750';
                              else if (pa.status === 'ATRASADO') statusBadge = 'bg-red-50 border-red-200 text-red-750';

                              return (
                                <tr key={pa.id} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="py-4 px-6 font-black uppercase text-slate-800 cursor-pointer" onClick={() => { setCurrentPlano(pa); setIsEditingPlano(true); }}>
                                    {pa.titulo}
                                  </td>
                                  <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate">
                                    {associatedCausa ? associatedCausa.causaRaiz : pa.problemaDireto || 'Entrada Direta'}
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                      {responsavel?.avatarUrl ? (
                                        <img src={responsavel.avatarUrl} alt={responsavel.nome} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-[#1B4D3E] text-white font-black text-[9px] flex items-center justify-center border border-slate-200 uppercase">
                                          {responsavel?.nome ? responsavel.nome.substring(0, 2) : 'RS'}
                                        </div>
                                      )}
                                      <span className="text-[10px] uppercase font-bold text-slate-600">{responsavel?.nome || 'Sem resp.'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-slate-500 font-mono">
                                    {formatLocalDate(pa.dataFim)}
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`text-[9px] font-black uppercase border rounded-md px-2 py-0.5 ${statusBadge}`}>
                                      {pa.status === 'CONCLUIDO' ? 'Concluído' : pa.status === 'ATRASADO' ? 'Atrasado' : 'Pendente'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 min-w-[140px]">
                                    <div className="flex flex-col gap-1 w-full">
                                      <div className="flex justify-between text-[9px] font-black text-slate-450">
                                        <span>{pa.percentualRealizado}%</span>
                                        <span>{acoesRealizadas}/{totalAcoes}</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full ${pa.status === 'CONCLUIDO' ? 'bg-[#1B4D3E]' : 'bg-blue-500'}`} style={{ width: `${pa.percentualRealizado}%` }}></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button onClick={() => { setCurrentPlano(pa); setIsEditingPlano(true); }} className="p-1.5 text-slate-550 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent" title="Editar Plano">
                                        <Edit size={14} />
                                      </button>
                                      <button onClick={() => handleDeletePlanoObj(pa.id)} className="p-1.5 text-slate-550 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent" title="Excluir Plano">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* VISÃO KANBAN */
                    <div className="pb-6 select-none bg-slate-50 pl-8 pr-8">
                      <div className="flex gap-[3px] min-w-max">
                        {(() => {
                          const columns = [
                            { id: 'PENDENTE', nome: 'Pendentes', color: '#3b82f6' },
                            { id: 'ATRASADO', nome: 'Atrasados', color: '#ef4444' },
                            { id: 'CONCLUIDO', nome: 'Concluídos', color: '#10b981' }
                          ].map(s => ({
                            id: s.id,
                            nome: s.nome,
                            color: s.color,
                            planos: planosAcao.filter(p => p.status === s.id)
                          }));

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
                                  <div
                                    key={col.id}
                                    className="flex flex-col flex-shrink-0 transition-opacity duration-200"
                                    style={{ width: '274px' }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDraggedOverPlanoStageId(col.id);
                                    }}
                                    onDragLeave={() => setDraggedOverPlanoStageId(null)}
                                    onDrop={(e) => handleDropPlano(e, col.id as any)}
                                  >
                                    {/* Column Header Sticky */}
                                    <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (columns.length - idx) }}>
                                      <div className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto">
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
                                              {col.nome}
                                            </h3>
                                            <span className="text-[10px] font-bold mt-1 opacity-90 truncate select-none leading-none">
                                              {col.planos.length} {col.planos.length === 1 ? 'plano' : 'planos'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card Column Container with Dynamic Colors */}
                                    <div
                                      className="px-[4px] py-3 rounded-b-2xl rounded-t-none flex flex-col gap-3"
                                      style={{
                                        width: '274px',
                                        minWidth: '274px',
                                        maxWidth: '274px',
                                        backgroundColor: bgRgba,
                                        borderColor: borderRgba,
                                        borderWidth: '0 1px 1px 1px',
                                        borderStyle: 'solid',
                                        height: 'calc(100vh - 52px)',
                                        overflowY: 'auto'
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setDraggedOverPlanoStageId(col.id);
                                      }}
                                      onDrop={(e) => handleDropPlano(e, col.id as any)}
                                    >
                                      {draggedOverPlanoStageId === col.id && draggedPlanoId && (
                                        <div className="bg-slate-100/70 border-2 border-dashed border-[#1B4D3E]/30 rounded-lg h-28 w-full animate-pulse flex items-center justify-center">
                                          <span className="text-[10px] font-black text-[#1B4D3E]/60 uppercase tracking-widest animate-pulse">Soltar aqui</span>
                                        </div>
                                      )}

                                      {col.planos.length === 0 ? (
                                        <div className="border border-dashed border-slate-300 rounded-lg py-10 flex flex-col items-center justify-center gap-2 flex-1 hover:bg-white/50 transition-all">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sem planos</span>
                                        </div>
                                      ) : (
                                        col.planos.map(pa => renderKanbanCard(pa))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: METAS (OKRs POR CICLOS) */}
              {activeTab === 'metas' && (
                <div className="space-y-6">
                  {/* Selector de ciclos */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ciclo Ativo:</span>
                    <div className="flex gap-2 flex-wrap">
                      {okrCiclos.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setActiveCicloId(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            activeCicloId === c.id 
                              ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white' 
                              : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                          }`}
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeCiclo ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">{activeCiclo.nome}</h2>
                          <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wide">
                            Duração: {formatLocalDate(activeCiclo.dataInicio)} até {formatLocalDate(activeCiclo.dataFim)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteOkrObj(activeCiclo.id)}
                          className="text-xs font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        >
                          Excluir Ciclo
                        </button>
                      </div>

                      {activeCiclo.objetivos.length === 0 ? (
                        <div className="text-center py-10 text-slate-450 italic text-xs">
                          Nenhum objetivo cadastrado neste ciclo.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {activeCiclo.objetivos.map(obj => (
                            <div key={obj.id} className="border border-slate-200/80 rounded-2xl p-5 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-black bg-slate-100 border border-slate-250 text-slate-500 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                    {obj.fase || 'Geral'}
                                  </span>
                                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mt-1.5 leading-snug">{obj.titulo}</h3>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">Progresso</span>
                                  <span className="text-sm font-black text-[#1B4D3E]">{obj.progresso}%</span>
                                </div>
                              </div>

                              <div className="w-full bg-slate-100 rounded-full h-1.5 relative overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-[#1B4D3E] transition-all duration-300"
                                  style={{ width: `${obj.progresso}%` }}
                                ></div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100/60">
                                {/* KRs */}
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Target size={12} /> Resultados-Chave (KRs)
                                  </h4>
                                  <div className="space-y-2">
                                    {obj.krs.map(kr => {
                                      const totalDelta = kr.valorAlvo - kr.valorInicial;
                                      const currentDelta = kr.valorAtual - kr.valorInicial;
                                      const progress = totalDelta !== 0 ? Math.round((currentDelta / totalDelta) * 100) : 100;
                                      const limitedProgress = Math.min(Math.max(progress, 0), 100);

                                      return (
                                        <div key={kr.id} className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex flex-col justify-between gap-2">
                                          <div>
                                            <p className="text-[10.5px] font-extrabold text-slate-750 leading-snug">{kr.descricao}</p>
                                            <div className="flex justify-between text-[9px] font-black text-slate-450 mt-1">
                                              <span>Inicial: {kr.valorInicial} {kr.unidade}</span>
                                              <span className="text-slate-800">Alvo: {kr.valorAlvo} {kr.unidade}</span>
                                            </div>
                                          </div>
                                          
                                          {/* Atualização Rápida de KR */}
                                          <div className="flex justify-between items-center gap-3 border-t border-slate-200/50 pt-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Valor Atual</span>
                                            <div className="flex items-center gap-1.5">
                                              <input 
                                                type="number" 
                                                defaultValue={kr.valorAtual}
                                                onBlur={async (e) => {
                                                  const val = parseFloat(e.target.value);
                                                  if (!isNaN(val)) {
                                                    kr.valorAtual = val;
                                                    await saveOkrCiclo(activeCiclo);
                                                    await loadData();
                                                  }
                                                }}
                                                className="w-16 bg-white border border-slate-250 text-slate-800 font-extrabold text-center text-xs py-0.5 rounded outline-none focus:border-[#1B4D3E]"
                                              />
                                              <span className="text-[10px] font-bold text-slate-400">{kr.unidade}</span>
                                            </div>
                                          </div>

                                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${limitedProgress}%` }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Iniciativas */}
                                <div className="space-y-3">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <ClipboardList size={12} /> Iniciativas / Ações
                                  </h4>
                                  <ul className="space-y-2">
                                    {obj.iniciativas.map((ini, idx) => (
                                      <li key={idx} className="bg-slate-50/60 border border-slate-150 rounded-xl p-3 flex items-start gap-2">
                                        <ArrowRight size={12} className="text-[#1B4D3E] shrink-0 mt-0.5" />
                                        <p className="text-[10.5px] font-bold text-slate-700 leading-snug">{ini}</p>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm">
                      Nenhum ciclo ativo selecionado. Crie ou ative um ciclo.
                    </div>
                  )}
                </div>
              )}

              {/* ABA 5: BRAINSTORMING */}
              {activeTab === 'brainstorm' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs items-center justify-between select-none">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Adicionar Post-it:</span>
                    <div className="flex gap-1.5">
                      {[
                        { name: 'Verde', cor: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                        { name: 'Azul', cor: 'bg-blue-100 border-blue-300 text-blue-800' },
                        { name: 'Amarelo', cor: 'bg-amber-100 border-amber-300 text-amber-800' },
                        { name: 'Rosa', cor: 'bg-rose-100 border-rose-300 text-rose-800' },
                      ].map(color => (
                        <button
                          key={color.name}
                          onClick={() => handleAddPostit(color.cor)}
                          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all hover:scale-[1.03] cursor-pointer bg-white border-slate-200"
                        >
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quadro de ideias */}
                  <div 
                    ref={boardRef}
                    onMouseMove={handleBoardMouseMove}
                    onMouseUp={handleBoardMouseUp}
                    onMouseLeave={handleBoardMouseUp}
                    className="relative bg-slate-100/70 border border-slate-200 rounded-3xl h-[600px] overflow-hidden select-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #CBD5E1 1.2px, transparent 1.2px)',
                      backgroundSize: '24px 24px'
                    }}
                  >
                    {postits.map(p => (
                      <div
                        key={p.id}
                        style={{
                          left: `${p.x}px`,
                          top: `${p.y}px`,
                          position: 'absolute',
                          width: '180px',
                          height: '180px',
                          zIndex: draggingPostitId === p.id ? 50 : 10
                        }}
                        className={`border rounded-2xl p-3 shadow-md flex flex-col justify-between cursor-move transform hover:-rotate-1 active:rotate-1 active:scale-95 duration-100 transition-all ${p.cor}`}
                      >
                        <div className="flex justify-between items-center border-b border-black/10 pb-1 mb-2">
                          <span className="text-[8px] font-black uppercase opacity-65 tracking-wider">Ideia</span>
                          <button
                            onClick={() => handleDeletePostitObj(p.id)}
                            className="text-black/50 hover:text-red-600 rounded-full p-0.5 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        
                        {/* Campo de Digitação do Post-it */}
                        <textarea
                          value={p.texto}
                          onChange={(e) => handleUpdatePostitText(p.id, e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()} // Prevents dragging when selecting text
                          className="flex-1 w-full bg-transparent border-none outline-none font-bold text-xs leading-relaxed resize-none cursor-text text-inherit placeholder-black/30"
                          placeholder="Digite sua ideia..."
                        />
                        
                        {/* Drag Handle Indicator */}
                        <div 
                          className="h-3 w-full flex justify-center items-end cursor-move select-none border-t border-black/5 mt-2 pt-1"
                          onMouseDown={() => handlePostitMouseDown(p.id)}
                        >
                          <div className="w-8 h-1 bg-black/15 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}


      {/* EDITOR PLANO DE AÇÃO 5W2H (inline, tela cheia) */}
      {isEditingPlano && (() => {
        const completedActions = currentPlano.acoes?.filter(a => a.status === 'CONCLUIDO').length || 0;
        const totalActions = currentPlano.acoes?.length || 0;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const delayedCount = currentPlano.acoes?.filter(a => {
          if (a.status === 'CONCLUIDO') return false;
          if (!a.when) return false;
          return new Date(a.when) < today;
        }).length || 0;
        
        const openCount = totalActions - completedActions - delayedCount;
        
        const completedPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
        const delayedPct = totalActions > 0 ? Math.round((delayedCount / totalActions) * 100) : 0;
        const openPct = totalActions > 0 ? Math.round((openCount / totalActions) * 100) : 0;
        
        const responsavelGeral = users.find(u => u.id === currentPlano.responsavelId);

        return (
          <div className="space-y-4 animate-in fade-in duration-200">

            {/* Barra superior com botão Voltar + Salvar */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setIsEditingPlano(false)}
                className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-[#1B4D3E] bg-transparent border-none cursor-pointer transition-colors">
                <ArrowLeft size={15} /> Voltar para Planos
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsEditingPlano(false)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white transition-all">
                  Cancelar
                </button>
              </div>
            </div>

            {/* Cards Superiores */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
              {/* Card Esquerda: Detalhes do Plano */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                {/* Primeira linha: Plano de Ação + Status */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plano de Ação:</span>
                    <input type="text" required value={currentPlano.titulo || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, titulo: e.target.value }))}
                      className="text-lg font-black text-slate-800 bg-transparent border-none outline-none w-full p-0 focus:bg-slate-50 focus:px-2 rounded-lg mt-0.5"
                      placeholder="Implementação de Novo CRM" />
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status:</span>
                    <select value={currentPlano.status || 'PENDENTE'}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, status: e.target.value as any }))}
                      className={`text-lg font-black bg-transparent border-none outline-none cursor-pointer p-0 mt-0.5 ${
                        currentPlano.status === 'CONCLUIDO' ? 'text-emerald-600' : currentPlano.status === 'ATRASADO' ? 'text-rose-600' : 'text-blue-600'
                      }`}>
                      <option value="PENDENTE">Em Andamento</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="ATRASADO">Atrasado</option>
                    </select>
                  </div>
                </div>

                {/* Segunda linha: Responsável + Row (Tipo, Início, Fim, Status) */}
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 mt-6 pt-4 border-t border-slate-100 items-center">
                  {/* Responsável */}
                  <div className="flex items-center gap-2.5">
                    {responsavelGeral?.avatarUrl ? (
                      <img src={responsavelGeral.avatarUrl} alt={responsavelGeral.nome} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-sm font-black text-[#1B4D3E] uppercase border border-slate-200 shrink-0">
                        {responsavelGeral?.nome?.substring(0, 2) || 'RS'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Responsável:</span>
                      <select required value={currentPlano.responsavelId || ''}
                        onChange={(e) => setCurrentPlano(prev => ({ ...prev, responsavelId: e.target.value }))}
                        className="text-xs font-black text-slate-700 bg-transparent border-none outline-none cursor-pointer p-0 mt-0.5 truncate max-w-[150px]">
                        <option value="">Selecione...</option>
                        {users.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                      </select>
                    </div>
                  </div>

                  {/* Row: Tipo, Causa, Data Início, Data Fim, Status */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo:</span>
                      <span className="text-xs font-black text-slate-800 mt-1.5 block">Estratégico</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Causa Vinculada:</span>
                      <select value={currentPlano.causaRaizId || ''}
                        onChange={(e) => setCurrentPlano(prev => ({ ...prev, causaRaizId: e.target.value, problemaDireto: '' }))}
                        className="text-xs font-black text-slate-700 bg-transparent border-none outline-none cursor-pointer p-0 mt-1.5 max-w-[120px] truncate">
                        <option value="">Entrada Direta</option>
                        {causas.map(c => (<option key={c.id} value={c.id}>{c.causaRaiz}</option>))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Início:</span>
                      <input type="date" value={currentPlano.dataInicio || ''}
                        onChange={(e) => setCurrentPlano(prev => ({ ...prev, dataInicio: e.target.value }))}
                        className="text-xs font-black text-slate-700 bg-transparent border-none outline-none cursor-pointer p-0 mt-1" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Fim:</span>
                      <input type="date" required value={currentPlano.dataFim || ''}
                        onChange={(e) => setCurrentPlano(prev => ({ ...prev, dataFim: e.target.value }))}
                        className="text-xs font-black text-slate-700 bg-transparent border-none outline-none cursor-pointer p-0 mt-1" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status:</span>
                      <span className={`text-xs font-black mt-1.5 block uppercase ${
                        currentPlano.status === 'CONCLUIDO' ? 'text-emerald-600' : currentPlano.status === 'ATRASADO' ? 'text-rose-600' : 'text-blue-600'
                      }`}>
                        {currentPlano.status === 'CONCLUIDO' ? 'Concluído' : currentPlano.status === 'ATRASADO' ? 'Atrasado' : 'Em Andamento'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Direita: Donut Metrics */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-around gap-2">
                  {[
                    { label: 'Ações Concluídas', pct: completedPct, count: completedActions, stroke: 'stroke-emerald-500' },
                    { label: 'Em Aberto', pct: openPct, count: openCount, stroke: 'stroke-amber-400' },
                    { label: 'Em Atraso', pct: delayedPct, count: delayedCount, stroke: 'stroke-rose-500' },
                  ].map(metric => (
                    <div key={metric.label} className="flex flex-col items-center text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{metric.label}:</span>
                      <span className="text-[10px] font-black text-slate-700 block mt-0.5">{metric.pct}% ({metric.count})</span>
                      <div className="relative w-16 h-16 flex items-center justify-center mt-2">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" className="stroke-slate-100 fill-none" strokeWidth="5.5" />
                          <circle cx="28" cy="28" r="22"
                            className={`fill-none ${metric.stroke} transition-all duration-700`}
                            strokeWidth="5.5" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 22}`}
                            strokeDashoffset={`${(2 * Math.PI * 22) * (1 - metric.pct / 100)}`} />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Barra de progresso geral */}
                <div className="flex items-center gap-3 border-t border-slate-100 pt-3.5">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider whitespace-nowrap">Progresso Geral:</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-[#1B4D3E] rounded-full transition-all duration-500"
                      style={{ width: `${currentPlano.percentualRealizado || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-[#1B4D3E] whitespace-nowrap">{currentPlano.percentualRealizado || 0}%</span>
                </div>
              </div>
            </div>

            {/* Tabela 5W2H */}
            {/* Trigger rebuild comment */}
            <form onSubmit={handleSavePlano} className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-slate-800">5W2H</h3>
                    <button type="button" onClick={handleAddSubActionInline}
                      className="py-1 px-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 shadow-xs">
                      <Plus size={12} /> + Ação
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setIsEditingPlano(false)}
                      className="px-4 py-1.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white transition-all">
                      Cancelar
                    </button>
                    <button type="submit"
                      className="px-5 py-1.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer border-none transition-all">
                      Salvar
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1250px]">
                    <thead>
                      <tr className="bg-[#E0F2FE] border-b border-slate-200 text-[8.5px] font-black text-slate-700 uppercase tracking-widest">
                        <th className="py-3.5 px-4 w-[70px] text-center border-r border-slate-200">Ação ID</th>
                        <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-200">O QUÊ <span className="normal-case font-bold text-slate-400">(What)</span></th>
                        <th className="py-3.5 px-4 min-w-[140px] border-r border-slate-200">POR QUÊ <span className="normal-case font-bold text-slate-400">(Why)</span></th>
                        <th className="py-3.5 px-4 w-[90px] text-center border-r border-slate-200">QUEM <span className="normal-case font-bold text-slate-400">(Who)</span></th>
                        <th className="py-3.5 px-4 min-w-[120px] border-r border-slate-200">ONDE <span className="normal-case font-bold text-slate-400">(Where)</span></th>
                        <th className="py-3.5 px-4 w-[145px] border-r border-slate-200">QUANDO <span className="normal-case font-bold text-slate-400">(When)</span></th>
                        <th className="py-3.5 px-4 min-w-[130px] border-r border-slate-200">COMO <span className="normal-case font-bold text-slate-400">(How)</span></th>
                        <th className="py-3.5 px-4 w-[125px] border-r border-slate-200">QUANTO <span className="normal-case font-bold text-slate-400">(How Much)</span></th>
                        <th className="py-3.5 px-4 w-[135px] border-r border-slate-200">STATUS</th>
                        <th className="py-3.5 px-4 min-w-[170px]">EVIDÊNCIA/COMENTÁRIOS</th>
                        <th className="py-3.5 px-4 w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                      {(!currentPlano.acoes || currentPlano.acoes.length === 0) ? (
                        <tr>
                          <td colSpan={11} className="py-12 px-4 text-center italic text-slate-400 text-xs">
                            Nenhuma ação cadastrada. Clique em "+ Inserir Nova Ação" abaixo.
                          </td>
                        </tr>
                      ) : (
                        currentPlano.acoes.map((a, index) => {
                          const selectedUser = users.find(u => u.id === a.who);
                          const formattedIdx = String(index + 1).padStart(3, '0');
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-3 px-4 text-center text-slate-500 font-mono border-r border-slate-100">{formattedIdx}</td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <input type="text" value={a.what || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'what', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white" placeholder="O que fará?" />
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <input type="text" value={a.why || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'why', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white" placeholder="Por quê?" />
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <div className="flex justify-center w-full">
                                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full hover:scale-105 transition-all shrink-0 select-none cursor-pointer" title={selectedUser?.nome || 'Selecionar responsável'}>
                                    {!selectedUser ? (
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 text-xs font-black shrink-0">
                                        +
                                      </div>
                                    ) : selectedUser.avatarUrl ? (
                                      <img src={selectedUser.avatarUrl} alt={selectedUser.nome} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-xs font-black text-[#1B4D3E] uppercase border border-slate-200 shrink-0">
                                        {selectedUser.nome.substring(0, 2)}
                                      </div>
                                    )}
                                    <select value={a.who || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'who', e.target.value)}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                      <option value="">Selecione...</option>
                                      {users.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <input type="text" value={a.where || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'where', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white" placeholder="Onde?" />
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <input type="date" value={a.when || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'when', e.target.value)}
                                  onClick={(e) => (e.target as any).showPicker?.()}
                                  onFocus={(e) => (e.target as any).showPicker?.()}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white cursor-pointer" />
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <input type="text" value={a.how || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'how', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white" placeholder="Como?" />
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">R$</span>
                                  <input type="number" value={a.howMuch || 0} onChange={(e) => handleUpdateSubActionField(a.id, 'howMuch', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-5 pr-1 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100">
                                <select value={a.status || 'PENDENTE'} onChange={(e) => handleUpdateSubActionField(a.id, 'status', e.target.value)}
                                  className={`w-full border-none rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer text-center ${
                                    a.status === 'CONCLUIDO'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : a.status === 'EM_ANDAMENTO'
                                      ? 'bg-blue-100 text-blue-800'
                                      : a.status === 'EM_ATRASO'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  <option value="PENDENTE">Em Aberto</option>
                                  <option value="EM_ANDAMENTO">Em Andamento</option>
                                  <option value="EM_ATRASO">Em Atraso</option>
                                  <option value="CONCLUIDO">Concluído</option>
                                </select>
                              </td>
                              <td className="py-2 px-2.5">
                                <input type="text" value={a.evidencia || ''} onChange={(e) => handleUpdateSubActionField(a.id, 'evidencia', e.target.value)}
                                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white" placeholder="Evidência..." />
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button type="button" onClick={() => handleDeleteSubAction(a.id)}
                                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border-none bg-transparent">
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>


            </form>
          </div>
        );
      })()}

      </div>
      </main>

      {/* MODAL OKR CICLO */}
      {isOkrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Criar Novo Ciclo OKR</h3>
              <button onClick={() => setIsOkrModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveOkr} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome do Ciclo</label>
                <input 
                  type="text" 
                  required
                  value={currentOkrCiclo.nome || ''}
                  onChange={(e) => setCurrentOkrCiclo(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  placeholder="Ex: Q4 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Início</label>
                  <input 
                    type="date" 
                    required
                    value={currentOkrCiclo.dataInicio || ''}
                    onChange={(e) => setCurrentOkrCiclo(prev => ({ ...prev, dataInicio: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fim</label>
                  <input 
                    type="date" 
                    required
                    value={currentOkrCiclo.dataFim || ''}
                    onChange={(e) => setCurrentOkrCiclo(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsOkrModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
