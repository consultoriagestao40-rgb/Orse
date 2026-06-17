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
  Kanban,
  ChevronDown,
  ChevronUp,
  Network,
  GitBranch,
  Calendar,
  MessageSquare,
  MoreHorizontal
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
  SubAction,
  ObjectiveComment,
  ActionAnnotation
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

const parseCurrency = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let clean = val.replace(/R\$\s?/, '').trim();
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  return parseFloat(clean) || 0;
};

const formatCurrency = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

const formatKrValue = (val: number, unit: string) => {
  const uTrim = (unit || '').trim();
  if (uTrim === '') {
    return val.toLocaleString('pt-BR');
  }
  if (uTrim === '%') {
    return `${val.toLocaleString('pt-BR')}%`;
  }
  if (uTrim.toLowerCase() === 'r$' || uTrim.toUpperCase() === 'BRL') {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${val.toLocaleString('pt-BR')} ${uTrim}`;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [causaViewMode, setCausaViewMode] = useState<'kanban' | 'list'>('list');
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

  const [planoViewMode, setPlanoViewMode] = useState<'kanban' | 'list'>('list');

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

  const [isAcaoModalOpen, setIsAcaoModalOpen] = useState(false);
  const [newAcao, setNewAcao] = useState<Partial<SubAction>>({
    what: '',
    why: '',
    where: '',
    when: new Date().toISOString().split('T')[0],
    who: '',
    how: '',
    howMuch: 0,
    status: 'PENDENTE',
    evidencia: ''
  });
  const [editingAcao, setEditingAcao] = useState<Partial<SubAction> | null>(null);
  const [completingAcao, setCompletingAcao] = useState<Partial<SubAction> | null>(null);
  const [reviewingAcao, setReviewingAcao] = useState<Partial<SubAction> | null>(null);
  const [isConclusaoPlanoModalOpen, setIsConclusaoPlanoModalOpen] = useState(false);
  const [editingHowMuch, setEditingHowMuch] = useState<Record<string, string>>({});
  const [newAcaoHowMuchStr, setNewAcaoHowMuchStr] = useState('');
  const [editingAcaoHowMuchStr, setEditingAcaoHowMuchStr] = useState('');
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
    setNewAcao({
      what: '',
      why: '',
      where: '',
      when: new Date().toISOString().split('T')[0],
      who: '',
      how: '',
      howMuch: 0,
      status: 'PENDENTE',
      evidencia: ''
    });
    setNewAcaoHowMuchStr('0,00');
    setIsAcaoModalOpen(true);
  };

  const handleSaveNewAcao = (e: React.FormEvent) => {
    e.preventDefault();
    const newSub: SubAction = {
      id: 'sub-' + Date.now(),
      what: newAcao.what || '',
      why: newAcao.why || '',
      where: newAcao.where || '',
      when: newAcao.when || new Date().toISOString().split('T')[0],
      who: newAcao.who || '',
      how: newAcao.how || '',
      howMuch: newAcao.howMuch || 0,
      status: newAcao.status || 'PENDENTE',
      percentualRealizado: newAcao.status === 'CONCLUIDO' ? 100 : 0,
      evidencia: newAcao.evidencia || ''
    };

    setCurrentPlano(prev => {
      const acoes = [...(prev.acoes || []), newSub];
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

    setIsAcaoModalOpen(false);
  };

  const handleSaveEditedAcao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcao || !editingAcao.id) return;

    if ((editingAcao.status === 'CONCLUIDO' || editingAcao.status === 'AGUARDANDO_APROVACAO') && !editingAcao.textoConclusao?.trim()) {
      alert("O texto de conclusão é obrigatório para concluir ou enviar a ação para aprovação.");
      return;
    }

    if (editingAcao.status === 'CONCLUIDO' && !editingAcao.comentarioAprovacao?.trim()) {
      alert("O comentário de avaliação/aprovação é obrigatório para concluir a ação.");
      return;
    }

    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).map(a => {
        if (a.id === editingAcao.id) {
          return {
            ...a,
            ...editingAcao,
            percentualRealizado: editingAcao.status === 'CONCLUIDO' ? 100 : 0
          } as SubAction;
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

    setEditingAcao(null);
  };

  const handleSaveCompletionAcao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingAcao || !completingAcao.id) return;
    if (!completingAcao.textoConclusao?.trim()) {
      alert("O texto de conclusão é obrigatório.");
      return;
    }

    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).map(a => {
        if (a.id === completingAcao.id) {
          return {
            ...a,
            textoConclusao: completingAcao.textoConclusao,
            anexoEvidencia: completingAcao.anexoEvidencia || '',
            status: 'AGUARDANDO_APROVACAO',
            percentualRealizado: 0
          } as SubAction;
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

    setCompletingAcao(null);
  };

  const handleSaveReviewAcao = (e: React.FormEvent, isApproved: boolean) => {
    e.preventDefault();
    if (!reviewingAcao || !reviewingAcao.id) return;
    if (!reviewingAcao.comentarioAprovacao?.trim()) {
      alert("O comentário de avaliação é obrigatório.");
      return;
    }

    setCurrentPlano(prev => {
      const acoes = (prev.acoes || []).map(a => {
        if (a.id === reviewingAcao.id) {
          return {
            ...a,
            comentarioAprovacao: reviewingAcao.comentarioAprovacao,
            status: isApproved ? 'CONCLUIDO' : 'EM_ANDAMENTO',
            percentualRealizado: isApproved ? 100 : 0
          } as SubAction;
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

    setReviewingAcao(null);
  };

  const handleSaveConclusaoPlano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlano.resultadoAtingido?.trim()) {
      alert("O resultado atingido é obrigatório.");
      return;
    }
    setCurrentPlano(prev => ({
      ...prev,
      status: 'CONCLUIDO'
    }));
    setIsConclusaoPlanoModalOpen(false);
  };

  // Objective, KR, and Tasks handlers
  const handleOpenObjectiveModal = (obj?: OKRObjective) => {
    if (obj) {
      setCurrentObjective(obj);
      setObjectiveIniciativasText((obj.iniciativas || []).join('\n'));
    } else {
      setCurrentObjective({
        id: '',
        titulo: '',
        fase: '',
        krs: [],
        iniciativas: [],
        dataFim: new Date().toISOString().split('T')[0]
      });
      setObjectiveIniciativasText('');
    }
    setIsObjectiveModalOpen(true);
  };

  const handleDeleteObjective = async (objId: string) => {
    if (!activeCiclo) return;
    if (!confirm("Tem certeza que deseja excluir este objetivo? Todos os KRs associados serão apagados.")) return;
    
    const updatedCiclo = {
      ...activeCiclo,
      objetivos: (activeCiclo.objetivos || []).filter(o => o.id !== objId)
    };
    await saveOkrCiclo(updatedCiclo);
    await loadData();
  };

  const handleSaveObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCiclo) return;
    if (!currentObjective.titulo?.trim()) {
      alert("O título do objetivo é obrigatório.");
      return;
    }

    const iniciativas = objectiveIniciativasText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const updatedObjective: OKRObjective = {
      ...currentObjective,
      id: currentObjective.id || `obj-${Date.now()}`,
      titulo: currentObjective.titulo || '',
      fase: currentObjective.fase || '',
      krs: currentObjective.krs || [],
      iniciativas,
      cicloId: activeCiclo.id,
      progresso: currentObjective.progresso || 0,
      dataFim: currentObjective.dataFim || ''
    };

    const objetivos = [...(activeCiclo.objetivos || [])];
    const index = objetivos.findIndex(o => o.id === updatedObjective.id);
    if (index !== -1) {
      objetivos[index] = updatedObjective;
    } else {
      objetivos.push(updatedObjective);
    }

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();
    setIsObjectiveModalOpen(false);
  };

  // KR modal handlers
  const handleOpenKrModal = (objectiveId: string, kr?: KR) => {
    setCurrentKrObjectiveId(objectiveId);
    if (kr) {
      setCurrentKr({
        ...kr,
        dataFim: kr.dataFim || ''
      });
      const u = kr.unidade || '';
      if (u === '%') {
        setUnitType('%');
        setCustomUnit('');
      } else if (u === 'R$' || u === 'BRL') {
        setUnitType('R$');
        setCustomUnit('');
      } else if (u.trim() === '') {
        setUnitType('none');
        setCustomUnit('');
      } else {
        setUnitType('custom');
        setCustomUnit(u);
      }
    } else {
      setCurrentKr({
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
      });
      setUnitType('%');
      setCustomUnit('');
    }
    setIsKrModalOpen(true);
  };

  const handleSaveKr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCiclo) return;
    if (!currentKr.descricao?.trim()) {
      alert("A descrição do KR é obrigatória.");
      return;
    }

    const updatedKr: KR = {
      ...currentKr,
      id: currentKr.id || `kr-${Date.now()}`,
      descricao: currentKr.descricao || '',
      valorInicial: Number(currentKr.valorInicial) || 0,
      valorAlvo: Number(currentKr.valorAlvo) || 0,
      valorAtual: Number(currentKr.valorAtual) || 0,
      unidade: typeof currentKr.unidade === 'string' ? currentKr.unidade : '%',
      responsavelId: currentKr.responsavelId || '',
      status: currentKr.status || 'EM_ANDAMENTO',
      tarefas: currentKr.tarefas || [],
      dataFim: currentKr.dataFim || ''
    };

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === currentKrObjectiveId) {
        const krs = [...(obj.krs || [])];
        const idx = krs.findIndex(k => k.id === updatedKr.id);
        if (idx !== -1) {
          krs[idx] = updatedKr;
        } else {
          krs.push(updatedKr);
        }
        return { ...obj, krs };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();
    setIsKrModalOpen(false);
  };

  const handleDeleteKr = async (objectiveId: string, krId: string) => {
    if (!activeCiclo) return;
    if (!confirm("Tem certeza que deseja excluir este KR?")) return;

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          krs: (obj.krs || []).filter(k => k.id !== krId)
        };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();
  };

  // Objective comments handlers
  const handleOpenCommentsModal = (objective: OKRObjective) => {
    setCommentsModalObjective(objective);
    setIsCommentsModalOpen(true);
    setNewCommentText('');
  };

  const handleAddObjectiveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCiclo || !commentsModalObjective || !newCommentText.trim()) return;

    const newComment: ObjectiveComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.nome || currentUser?.email || 'Usuário',
      avatarUrl: currentUser?.avatarUrl || '',
      texto: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedObjective: OKRObjective = {
      ...commentsModalObjective,
      comentarios: [...(commentsModalObjective.comentarios || []), newComment]
    };

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === commentsModalObjective.id) {
        return updatedObjective;
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();

    setCommentsModalObjective(updatedObjective);
    setNewCommentText('');
  };

  const handleDeleteObjectiveComment = async (commentId: string) => {
    if (!activeCiclo || !commentsModalObjective) return;
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;

    const updatedObjective: OKRObjective = {
      ...commentsModalObjective,
      comentarios: (commentsModalObjective.comentarios || []).filter(c => c.id !== commentId)
    };

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === commentsModalObjective.id) {
        return updatedObjective;
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();

    setCommentsModalObjective(updatedObjective);
  };

  // Action/Task detailed modal handlers
  const handleOpenActionDetailModal = (task: KRTask) => {
    setActiveActionTask(task);
    setIsActionDetailModalOpen(true);
    setNewActionAnnotationText('');
  };

  const handleOpenNewActionModal = () => {
    setActiveActionTask({
      id: `task-${Date.now()}`,
      descricao: '',
      responsavelId: '',
      status: 'PENDENTE',
      progresso: 0,
      comentario: '',
      dataLimite: '',
      anotacoes: []
    });
    setIsActionDetailModalOpen(true);
    setNewActionAnnotationText('');
  };

  const handleSaveActionDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCiclo || !actionsModalKr || !actionsModalObjectiveId || !activeActionTask) return;

    const updatedTask = {
      ...activeActionTask
    };

    if (newActionAnnotationText.trim()) {
      const newAnnotation: ActionAnnotation = {
        id: `annotation-${Date.now()}`,
        userId: currentUser?.id || 'anonymous',
        userName: currentUser?.nome || currentUser?.email || 'Usuário',
        avatarUrl: currentUser?.avatarUrl || '',
        texto: newActionAnnotationText.trim(),
        createdAt: new Date().toISOString()
      };
      updatedTask.anotacoes = [...(updatedTask.anotacoes || []), newAnnotation];
    }

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === actionsModalObjectiveId) {
        const krs = (obj.krs || []).map(kr => {
          if (kr.id === actionsModalKr.id) {
            const tarefas = [...(kr.tarefas || [])];
            const idx = tarefas.findIndex(t => t.id === updatedTask.id);
            if (idx !== -1) {
              tarefas[idx] = updatedTask;
            } else {
              tarefas.push(updatedTask);
            }
            return { ...kr, tarefas };
          }
          return kr;
        });
        return { ...obj, krs };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();

    const updatedKr = updatedCiclo.objetivos
      .find(o => o.id === actionsModalObjectiveId)?.krs
      .find(k => k.id === actionsModalKr.id);
    if (updatedKr) {
      setActionsModalKr(updatedKr);
      setEditingKrTasks(updatedKr.tarefas || []);
    }

    setIsActionDetailModalOpen(false);
    setNewActionAnnotationText('');
  };

  const handleDeleteAction = async (taskId: string) => {
    if (!activeCiclo || !actionsModalKr || !actionsModalObjectiveId) return;
    if (!confirm("Tem certeza que deseja excluir esta ação?")) return;

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === actionsModalObjectiveId) {
        const krs = (obj.krs || []).map(kr => {
          if (kr.id === actionsModalKr.id) {
            const tarefas = (kr.tarefas || []).filter(t => t.id !== taskId);
            return { ...kr, tarefas };
          }
          return kr;
        });
        return { ...obj, krs };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();

    const updatedKr = updatedCiclo.objetivos
      .find(o => o.id === actionsModalObjectiveId)?.krs
      .find(k => k.id === actionsModalKr.id);
    if (updatedKr) {
      setActionsModalKr(updatedKr);
      setEditingKrTasks(updatedKr.tarefas || []);
    }

    setIsActionDetailModalOpen(false);
  };

  // KR tasks handlers
  const handleStartEditTasks = (objectiveId: string, kr: KR) => {
    setEditingKrId(kr.id);
    setEditingKrObjectiveId(objectiveId);
    setEditingKrTasks(kr.tarefas || []);
  };

  const handleOpenActionsModal = (objectiveId: string, kr: KR) => {
    setActionsModalObjectiveId(objectiveId);
    setActionsModalKr(kr);
    setEditingKrId(kr.id);
    setEditingKrObjectiveId(objectiveId);
    setEditingKrTasks(kr.tarefas || []);
    setIsEditingActions(false);
    setIsActionsModalOpen(true);
  };

  const handleSaveActionsModal = async () => {
    if (!activeCiclo || !editingKrId || !editingKrObjectiveId) return;

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === editingKrObjectiveId) {
        const krs = (obj.krs || []).map(kr => {
          if (kr.id === editingKrId) {
            const updatedKr = {
              ...kr,
              tarefas: editingKrTasks
            };
            setActionsModalKr(updatedKr);
            return updatedKr;
          }
          return kr;
        });
        return { ...obj, krs };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();
    setIsEditingActions(false);
    setIsActionsModalOpen(false);
  };

  const handleAddTaskRow = () => {
    const newTask: KRTask = {
      id: `task-${Date.now()}`,
      descricao: '',
      responsavelId: '',
      status: 'PENDENTE',
      progresso: 0,
      comentario: ''
    };
    setEditingKrTasks(prev => [...prev, newTask]);
  };

  const handleRemoveTaskRow = (taskId: string) => {
    setEditingKrTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleUpdateTaskField = (taskId: string, field: keyof KRTask, value: any) => {
    setEditingKrTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, [field]: value };
        if (field === 'status') {
          updated.progresso = value === 'CONCLUIDO' ? 100 : value === 'PENDENTE' ? 0 : updated.progresso;
        }
        if (field === 'progresso') {
          const num = Number(value) || 0;
          updated.progresso = Math.min(Math.max(num, 0), 100);
          updated.status = updated.progresso === 100 ? 'CONCLUIDO' : updated.progresso === 0 ? 'PENDENTE' : 'EM_ANDAMENTO';
        }
        return updated;
      }
      return t;
    }));
  };

  const handleSaveTasks = async () => {
    if (!activeCiclo || !editingKrId || !editingKrObjectiveId) return;

    const objetivos = (activeCiclo.objetivos || []).map(obj => {
      if (obj.id === editingKrObjectiveId) {
        const krs = (obj.krs || []).map(kr => {
          if (kr.id === editingKrId) {
            return {
              ...kr,
              tarefas: editingKrTasks
            };
          }
          return kr;
        });
        return { ...obj, krs };
      }
      return obj;
    });

    const updatedCiclo = {
      ...activeCiclo,
      objetivos
    };

    await saveOkrCiclo(updatedCiclo);
    await loadData();
    setEditingKrId(null);
    setEditingKrObjectiveId(null);
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
            <div className="flex justify-between text-[9px] font-black text-slate-400 mt-1">
              <span>CUSTO TOTAL</span>
              <span className="text-[#1B4D3E] font-black">{formatCurrency(pa.acoes?.reduce((acc, a) => acc + (a.howMuch || 0), 0) || 0)}</span>
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

  // States for Objective management modal
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [currentObjective, setCurrentObjective] = useState<Partial<OKRObjective>>({
    id: '',
    titulo: '',
    fase: '',
    krs: [],
    iniciativas: [],
    dataFim: ''
  });
  const [objectiveIniciativasText, setObjectiveIniciativasText] = useState('');

  // States for Mereo OKR views
  const [okrViewMode, setOkrViewMode] = useState<'resumo' | 'arvore'>('resumo');
  const [okrUserFilter, setOkrUserFilter] = useState<string>('todos');
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});
  const [expandedKrs, setExpandedKrs] = useState<Record<string, boolean>>({});

  // Actions modal states
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [actionsModalKr, setActionsModalKr] = useState<KR | null>(null);
  const [actionsModalObjectiveId, setActionsModalObjectiveId] = useState<string | null>(null);
  const [isEditingActions, setIsEditingActions] = useState(false);

  // KR modal states
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [currentKrObjectiveId, setCurrentKrObjectiveId] = useState('');
  const [openKrMenuId, setOpenKrMenuId] = useState<string | null>(null);
  const [currentKr, setCurrentKr] = useState<Partial<KR>>({
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
  });

  const [unitType, setUnitType] = useState<'%' | 'R$' | 'none' | 'custom'>('%');
  const [customUnit, setCustomUnit] = useState('');

  // Objective comments modal states
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentsModalObjective, setCommentsModalObjective] = useState<OKRObjective | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Action details/edit modal states
  const [isActionDetailModalOpen, setIsActionDetailModalOpen] = useState(false);
  const [activeActionTask, setActiveActionTask] = useState<KRTask | null>(null);
  const [newActionAnnotationText, setNewActionAnnotationText] = useState('');

  // KR tasks inline states
  const [editingKrId, setEditingKrId] = useState<string | null>(null);
  const [editingKrObjectiveId, setEditingKrObjectiveId] = useState<string | null>(null);
  const [editingKrTasks, setEditingKrTasks] = useState<KRTask[]>([]);

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
      if ((resPlanning as any).currentUser) {
        setCurrentUser((resPlanning as any).currentUser);
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
                        <table className="w-full min-w-[1500px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 select-none text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                              <th className="py-3.5 px-6 min-w-[320px]">Plano de Ação</th>
                              <th className="py-3.5 px-6 min-w-[350px]">Causa Vinculada / Problema</th>
                              <th className="py-3.5 px-6">Indicador</th>
                              <th className="py-3.5 px-6">Resultado Atual</th>
                              <th className="py-3.5 px-6">Meta</th>
                              <th className="py-3.5 px-6">Responsável</th>
                              <th className="py-3.5 px-6">Prazo Final</th>
                              <th className="py-3.5 px-6">Custo Total</th>
                              <th className="py-3.5 px-6">Status</th>
                              <th className="py-3.5 px-6">Progresso</th>
                              <th className="py-3.5 px-6">Resultado Atingido</th>
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
                                  <td className="py-4 px-6 font-black uppercase text-slate-800 cursor-pointer min-w-[320px] break-words" onClick={() => { setCurrentPlano(pa); setIsEditingPlano(true); }}>
                                    {pa.titulo}
                                  </td>
                                  <td className="py-4 px-6 text-slate-500 min-w-[350px] max-w-[500px] break-words">
                                    {associatedCausa ? associatedCausa.causaRaiz : pa.problemaDireto || 'Entrada Direta'}
                                  </td>
                                  <td className="py-4 px-6 text-slate-500">
                                    {pa.indicadorMelhorar || '-'}
                                  </td>
                                  <td className="py-4 px-6 text-slate-500">
                                    {pa.resultadoAtual || '-'}
                                  </td>
                                  <td className="py-4 px-6 text-slate-500">
                                    {pa.metaAtingir || '-'}
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
                                  <td className="py-4 px-6 text-slate-700 font-mono font-bold whitespace-nowrap">
                                    {formatCurrency(pa.acoes?.reduce((acc, a) => acc + (a.howMuch || 0), 0) || 0)}
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
                                  <td className="py-4 px-6 text-slate-700 font-mono font-bold whitespace-nowrap">
                                    {pa.status === 'CONCLUIDO' ? (pa.resultadoAtingido || '-') : '-'}
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
                  {/* Top Header Row styled like Mereo */}
                  <div className="flex justify-between items-center select-none pt-2">
                    <h1 className="text-xl font-extrabold uppercase text-slate-800 tracking-wider">Resumo</h1>
                    <button
                      type="button"
                      onClick={() => handleOpenObjectiveModal()}
                      className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                    >
                      <Plus size={14} /> Adicionar OKR
                    </button>
                  </div>

                  {/* Selector de ciclos e filtros */}
                  <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs select-none">
                    <div className="flex items-center gap-3">
                      <select
                        value={activeCicloId}
                        onChange={(e) => setActiveCicloId(e.target.value)}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer"
                      >
                        {okrCiclos.map(c => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>

                      <select
                        value={okrUserFilter}
                        onChange={(e) => setOkrUserFilter(e.target.value)}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer"
                      >
                        <option value="todos">Todos os Responsáveis</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex gap-0.5">
                        <button
                          onClick={() => setOkrViewMode('resumo')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                            okrViewMode === 'resumo'
                              ? 'bg-white text-slate-800 shadow-2xs'
                              : 'text-slate-450 hover:text-slate-700 bg-transparent'
                          }`}
                        >
                          <LayoutList size={12} /> Ver Detalhes
                        </button>
                        <button
                          onClick={() => setOkrViewMode('arvore')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                            okrViewMode === 'arvore'
                              ? 'bg-white text-slate-800 shadow-2xs'
                              : 'text-slate-450 hover:text-slate-700 bg-transparent'
                          }`}
                        >
                          <Network size={12} /> Árvore
                        </button>
                      </div>
                      
                      {activeCiclo && (
                        <button 
                          onClick={() => handleDeleteOkrObj(activeCiclo.id)}
                          className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none bg-transparent uppercase tracking-wider"
                        >
                          Excluir Ciclo
                        </button>
                      )}
                    </div>
                  </div>

                  {activeCiclo ? (
                    <div className="space-y-6">
                      {activeCiclo.objetivos.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xs">
                          <span className="text-slate-400 italic text-sm">Nenhum objetivo cadastrado neste ciclo.</span>
                          <button
                            type="button"
                            onClick={() => handleOpenObjectiveModal()}
                            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
                          >
                            <PlusCircle size={13} /> + Adicionar Objetivo
                          </button>
                        </div>
                      ) : okrViewMode === 'resumo' ? (
                        /* VISÃO RESUMO (ACORDEÃO DE OBJETIVOS) */
                        <div className="space-y-4">
                          {activeCiclo.objetivos
                            .filter(obj => {
                              if (okrUserFilter === 'todos') return true;
                              return (obj.krs || []).some(kr => kr.responsavelId === okrUserFilter);
                            })
                            .map((obj, objIdx) => {
                              const isExpanded = expandedObjectives[obj.id] ?? true; // expand default
                              return (
                                <div key={obj.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-all duration-300 space-y-4">
                                  <div 
                                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer select-none"
                                    onClick={() => setExpandedObjectives(prev => ({ ...prev, [obj.id]: !isExpanded }))}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {/* Violet target circle icon */}
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Target size={15} />
                                      </div>
                                      <div className="min-w-0">
                                        <h3 className="text-sm font-black text-slate-800 tracking-wide leading-snug break-words">
                                          Objetivo {objIdx + 1}: {obj.titulo}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                          <span className="text-[9px] font-black bg-emerald-50 border border-emerald-200 text-[#1B4D3E] rounded px-1.5 py-0.5 uppercase tracking-wider">
                                            {obj.fase || 'Geral'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end" onClick={(e) => e.stopPropagation()}>
                                      {/* Deadlines & Comments inline style */}
                                      {obj.dataFim && (
                                        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-slate-505 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                          <Calendar size={13} className="text-slate-400" />
                                          <span>{formatLocalDate(obj.dataFim)}</span>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleOpenCommentsModal(obj)}
                                        className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-slate-505 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
                                      >
                                        <MessageSquare size={13} className="text-slate-400" />
                                        <span>Comentários</span>
                                      </button>

                                      {/* Action buttons */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenKrModal(obj.id)}
                                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                                          title="Adicionar Resultado-Chave (KR)"
                                        >
                                          <PlusCircle size={14} /> <span className="hidden sm:inline">+ KR</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenObjectiveModal(obj)}
                                          className="p-1.5 text-slate-450 hover:text-slate-655 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                                          title="Editar Objetivo"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteObjective(obj.id)}
                                          className="p-1.5 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                                          title="Excluir Objetivo"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedObjectives(prev => ({ ...prev, [obj.id]: !isExpanded }))}
                                          className="p-1.5 text-slate-450 hover:text-slate-700 bg-transparent border-none cursor-pointer"
                                        >
                                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-slate-100 divide-y divide-slate-100 pl-6 sm:pl-12">
                                      {(!obj.krs || obj.krs.length === 0) ? (
                                        <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                          <span className="text-slate-400 italic text-xs">Nenhum resultado-chave (KR) cadastrado para este objetivo.</span>
                                        </div>
                                      ) : (
                                        obj.krs
                                          .filter(kr => {
                                            if (okrUserFilter === 'todos') return true;
                                            return kr.responsavelId === okrUserFilter;
                                          })
                                          .map((kr, krIdx) => {
                                             const totalDelta = kr.valorAlvo - kr.valorInicial;
                                             const currentDelta = kr.valorAtual - kr.valorInicial;
                                             const krProgress = totalDelta !== 0 ? Math.round((currentDelta / totalDelta) * 100) : 100;
                                             const limitedKrProgress = Math.min(Math.max(krProgress, 0), 100);
                                             const responsavelKr = users.find(u => u.id === kr.responsavelId);
                                             const initialsKr = responsavelKr?.nome ? responsavelKr.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';

                                             return (
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
                                                    {/* Emerald progress bar matching brand style */}
                                                   <div className="relative w-full pt-1 pb-4">
                                                     <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                       <div 
                                                         className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                         style={{ width: `${limitedKrProgress}%` }}
                                                       ></div>
                                                     </div>
                                                     <div className="flex justify-between text-[8px] font-black text-slate-400 mt-0.5">
                                                       <span>0%</span>
                                                       <span>100%</span>
                                                     </div>
                                                     {limitedKrProgress > 5 && limitedKrProgress < 95 && (
                                                       <div 
                                                         className="absolute text-[9px] font-black text-emerald-600 mt-0.5 -translate-x-1/2 transition-all duration-350"
                                                         style={{ left: `${limitedKrProgress}%`, top: '6px' }}
                                                       >
                                                         {limitedKrProgress}%
                                                       </div>
                                                     )}
                                                   </div>
                                                 </div>

                                                 {/* Right Column: Date, Status, Owner & Actions Menu */}
                                                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end md:w-[40%] lg:w-[35%]">
                                                    {/* Date Column */}
                                                    {kr.dataFim ? (
                                                      <div className="text-[10px] font-bold text-slate-550 flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        <Calendar size={11} className="text-slate-400 shrink-0" />
                                                        <span>{formatLocalDate(kr.dataFim)}</span>
                                                      </div>
                                                    ) : (
                                                      <span className="text-[9.5px] font-bold text-slate-300 italic shrink-0">Sem prazo</span>
                                                    )}

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
                                                       <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7.5px] font-bold uppercase shrink-0">
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
                                           })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        /* VISÃO ÁRVORE (DIAGRAMA HIERÁRQUICO CONECTADO) */
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs overflow-x-auto select-none">
                          <div className="min-w-[900px] py-6 flex flex-col items-center">
                            
                            {/* Ciclo (Nó Raiz) */}
                            <div className="flex flex-col items-center mb-6 relative">
                              <div className="bg-slate-800 text-white rounded-2xl p-4 shadow-md text-center max-w-[300px] border border-slate-700">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Ciclo Ativo</span>
                                <h4 className="text-sm font-black mt-1 uppercase tracking-wide">{activeCiclo.nome}</h4>
                                <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                  <span>Progresso Geral</span>
                                  <span className="text-emerald-400 font-black">
                                    {activeCiclo.objetivos.length > 0 
                                      ? Math.round(activeCiclo.objetivos.reduce((acc, o) => acc + (o.progresso || 0), 0) / activeCiclo.objetivos.length)
                                      : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ 
                                      width: `${
                                        activeCiclo.objetivos.length > 0 
                                          ? Math.round(activeCiclo.objetivos.reduce((acc, o) => acc + (o.progresso || 0), 0) / activeCiclo.objetivos.length)
                                          : 0
                                      }%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="w-0.5 h-8 bg-slate-300 mt-2"></div>
                            </div>

                            {/* Objetivos Row */}
                            <div className="flex gap-8 justify-center items-start w-full relative">
                              {/* Horizontal connecting line across objectives */}
                              {activeCiclo.objetivos.length > 1 && (
                                <div className="absolute top-0 left-[16%] right-[16%] h-0.5 bg-slate-300"></div>
                              )}

                              {activeCiclo.objetivos
                                .filter(obj => {
                                  if (okrUserFilter === 'todos') return true;
                                  return (obj.krs || []).some(kr => kr.responsavelId === okrUserFilter);
                                })
                                .map((obj, objIdx) => {
                                  return (
                                    <div key={obj.id} className="flex flex-col items-center flex-1 min-w-[280px] relative">
                                      {/* Vertical line to objective card */}
                                      <div className="w-0.5 h-6 bg-slate-300"></div>

                                      {/* Card Objetivo */}
                                      <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 shadow-2xs text-center w-full max-w-[300px] z-10 hover:shadow-xs transition-all relative">
                                        <span className="text-[8px] font-black bg-emerald-500 text-white rounded px-2 py-0.5 uppercase tracking-wider">
                                          {obj.fase || 'Objetivo'}
                                        </span>
                                        <h5 className="text-xs font-black text-slate-800 mt-2 line-clamp-2 tracking-wide">
                                          Objetivo {objIdx + 1}: {obj.titulo}
                                        </h5>
                                        <div className="mt-3 flex justify-between items-center text-[10px] font-bold text-slate-550">
                                          <span>Progresso</span>
                                          <span className="text-emerald-600 font-black">{obj.progresso}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${obj.progresso}%` }}></div>
                                        </div>
                                      </div>

                                      {/* Line to KRs */}
                                      {obj.krs && obj.krs.length > 0 && (
                                        <>
                                          <div className="w-0.5 h-8 bg-slate-300 mt-2"></div>

                                          {/* KRs Column (Vertically stacked for each objective, clean visual layout) */}
                                          <div className="flex flex-col gap-4 w-full items-center relative pl-4 mt-2">
                                            {/* Connecting vertical path line */}
                                            <div className="absolute top-0 bottom-6 left-1/2 w-0.5 bg-slate-300 -translate-x-1/2 z-0"></div>

                                            {obj.krs
                                              .filter(kr => {
                                                if (okrUserFilter === 'todos') return true;
                                                return kr.responsavelId === okrUserFilter;
                                              })
                                              .map(kr => {
                                                const totalDelta = kr.valorAlvo - kr.valorInicial;
                                                const currentDelta = kr.valorAtual - kr.valorInicial;
                                                const krProgress = totalDelta !== 0 ? Math.round((currentDelta / totalDelta) * 100) : 100;
                                                const limitedKrProgress = Math.min(Math.max(krProgress, 0), 100);
                                                const responsavel = users.find(u => u.id === kr.responsavelId);
                                                const initials = responsavel?.nome ? responsavel.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';

                                                return (
                                                  <div 
                                                    key={kr.id} 
                                                    className="bg-white border border-slate-250 hover:border-slate-350 rounded-2xl p-3 shadow-2xs w-full max-w-[250px] z-10 transition-all hover:shadow-xs relative"
                                                  >
                                                    <div className="flex justify-between items-start gap-2">
                                                      <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-extrabold text-slate-700 leading-snug text-left line-clamp-2">
                                                          {kr.descricao}
                                                        </p>
                                                        {kr.dataFim && (
                                                          <span className="text-[8.5px] font-bold text-slate-400 block mt-0.5 text-left">
                                                            Prazo: {formatLocalDate(kr.dataFim)}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm shrink-0 uppercase border ${
                                                        kr.status === 'CONCLUIDO' ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]' :
                                                        kr.status === 'QUASE_LA' ? 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]' :
                                                        kr.status === 'EM_ANDAMENTO' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' :
                                                        'bg-slate-50 text-slate-650 border-slate-250'
                                                      }`}>
                                                        {kr.status === 'CONCLUIDO' ? 'Concluído' :
                                                         kr.status === 'QUASE_LA' ? 'Quase' :
                                                         kr.status === 'EM_ANDAMENTO' ? 'Foco' : 'Pend'}
                                                      </span>
                                                    </div>

                                                    <div className="mt-2.5 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                                                      <span>Progresso: {limitedKrProgress}%</span>
                                                      <span>{formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${limitedKrProgress}%` }}></div>
                                                    </div>

                                                    {responsavel && (
                                                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 justify-end">
                                                        <span className="text-[8.5px] font-bold text-slate-550 truncate max-w-[120px]">{responsavel.nome}</span>
                                                        <div className="w-4 h-4 rounded-full border border-slate-150 overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                                                          {responsavel.avatarUrl ? (
                                                            <img src={responsavel.avatarUrl} alt={responsavel.nome} className="w-full h-full object-cover" />
                                                          ) : (
                                                            <span className="text-[7px] font-bold uppercase text-emerald-600">{initials}</span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm shadow-2xs">
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
                    
                    {/* Causa Vinculada abaixo do título */}
                    <div className="mt-3 flex items-start gap-2 select-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mt-0.5">Causa Vinculada:</span>
                      <div className="relative flex-1 min-w-0">
                        {/* Visible styled text that wraps naturally */}
                        <div className="text-xs font-black text-slate-700 bg-transparent cursor-pointer p-0 rounded-sm hover:bg-slate-50 transition-colors flex items-center gap-1 leading-normal max-w-full">
                          <span className="break-words flex-1 pr-4">
                            {causas.find(c => c.id === currentPlano.causaRaizId)?.causaRaiz || 'Entrada Direta'}
                          </span>
                          <span className="text-[9px] text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">▼</span>
                        </div>
                        {/* Native select on top, completely transparent but clickable */}
                        <select value={currentPlano.causaRaizId || ''}
                          onChange={(e) => setCurrentPlano(prev => ({ ...prev, causaRaizId: e.target.value, problemaDireto: '' }))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                          <option value="">Entrada Direta</option>
                          {causas.map(c => (<option key={c.id} value={c.id}>{c.causaRaiz}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status:</span>
                    <select value={currentPlano.status || 'PENDENTE'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        if (val === 'CONCLUIDO') {
                          setIsConclusaoPlanoModalOpen(true);
                        } else {
                          setCurrentPlano(prev => ({ ...prev, status: val }));
                        }
                      }}
                      className={`text-lg font-black bg-transparent border-none outline-none cursor-pointer p-0 mt-0.5 ${
                        currentPlano.status === 'CONCLUIDO' ? 'text-emerald-600' : currentPlano.status === 'ATRASADO' ? 'text-rose-600' : 'text-blue-600'
                      }`}>
                      <option value="PENDENTE">Em Andamento</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="ATRASADO">Atrasado</option>
                    </select>
                  </div>
                </div>

                {/* Segunda linha: Responsável + Indicadores + Datas */}
                <div className="flex flex-wrap gap-x-5 gap-y-3 mt-6 pt-4 border-t border-slate-100 justify-between items-center">
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
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 cursor-pointer w-[140px] truncate">
                        <option value="">Selecione...</option>
                        {users.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Indicador a Melhorar:</span>
                    <input type="text" value={currentPlano.indicadorMelhorar || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, indicadorMelhorar: e.target.value }))}
                      placeholder="Ex: NPS"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[130px]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resultado Atual:</span>
                    <input type="text" value={currentPlano.resultadoAtual || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, resultadoAtual: e.target.value }))}
                      placeholder="Ex: 45%"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[90px]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meta a Atingir:</span>
                    <input type="text" value={currentPlano.metaAtingir || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, metaAtingir: e.target.value }))}
                      placeholder="Ex: 90%"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[90px]" />
                  </div>
                  {currentPlano.status === 'CONCLUIDO' && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-black">Resultado Atingido:</span>
                      <input type="text" value={currentPlano.resultadoAtingido || ''}
                        onChange={(e) => setCurrentPlano(prev => ({ ...prev, resultadoAtingido: e.target.value }))}
                        placeholder="Ex: 85%"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[90px]" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Início:</span>
                    <input type="date" value={currentPlano.dataInicio || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[125px] cursor-pointer" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Fim:</span>
                    <input type="date" required value={currentPlano.dataFim || ''}
                      onChange={(e) => setCurrentPlano(prev => ({ ...prev, dataFim: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] focus:bg-white mt-1 w-[125px] cursor-pointer" />
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
                {/* Custo Total do Plano */}
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Custo Total do Plano:</span>
                  <span className="text-sm font-black text-[#1B4D3E]">
                    {formatCurrency(currentPlano.acoes?.reduce((acc, a) => acc + (a.howMuch || 0), 0) || 0)}
                  </span>
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
                        <th className="py-3.5 px-4 min-w-[170px] text-center">AÇÕES</th>
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
                              <td className="py-3 px-4 text-center text-slate-500 font-mono border-r border-slate-100 align-middle">{formattedIdx}</td>
                              <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                <div className="text-xs font-semibold text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-[130px] max-w-[200px]">
                                  {a.what || ''}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                <div className="text-xs font-semibold text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-[130px] max-w-[200px]">
                                  {a.why || ''}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100 align-middle">
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
                              <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                <div className="text-xs font-semibold text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-[100px] max-w-[150px]">
                                  {a.where || ''}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100 align-middle">
                                <div className="relative w-full h-8 flex items-center bg-slate-50/50 border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-700 focus-within:border-[#1B4D3E] focus-within:bg-white">
                                  {/* Campo de texto visível formatado como DD/MM/AAAA */}
                                  <input type="text" readOnly
                                    value={a.when ? (formatLocalDate(a.when) !== '-' ? formatLocalDate(a.when) : a.when) : ''}
                                    placeholder="dd/mm/aaaa"
                                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 pointer-events-none" />
                                  {/* Input de data invisível sobreposto que abre o calendário */}
                                  <input type="date" value={a.when || ''}
                                    onChange={(e) => handleUpdateSubActionField(a.id, 'when', e.target.value)}
                                    onClick={(e) => (e.target as any).showPicker?.()}
                                    onFocus={(e) => (e.target as any).showPicker?.()}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                              </td>
                              <td className="py-2.5 px-3 border-r border-slate-100 align-middle">
                                <div className="text-xs font-semibold text-slate-700 break-words leading-relaxed whitespace-pre-wrap min-w-[100px] max-w-[150px]">
                                  {a.how || ''}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100 align-middle">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">R$</span>
                                  <input 
                                    type="text" 
                                    value={
                                      editingHowMuch[a.id] !== undefined 
                                        ? editingHowMuch[a.id] 
                                        : (a.howMuch !== undefined && a.howMuch !== null 
                                            ? a.howMuch.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                            : '0,00')
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditingHowMuch(prev => ({ ...prev, [a.id]: val }));
                                    }}
                                    onBlur={() => {
                                      const rawVal = editingHowMuch[a.id];
                                      if (rawVal !== undefined) {
                                        const numeric = parseCurrency(rawVal);
                                        handleUpdateSubActionField(a.id, 'howMuch', numeric);
                                        setEditingHowMuch(prev => {
                                          const next = { ...prev };
                                          delete next[a.id];
                                          return next;
                                        });
                                      }
                                    }}
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-6 pr-1 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" 
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-100 align-middle">
                                <span className={`block w-full text-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                  a.status === 'CONCLUIDO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : a.status === 'AGUARDANDO_APROVACAO'
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : a.status === 'EM_ANDAMENTO'
                                    ? 'bg-blue-100 text-blue-800'
                                    : a.status === 'EM_ATRASO'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {a.status === 'PENDENTE' ? 'Em Aberto' : 
                                   a.status === 'EM_ANDAMENTO' ? 'Em Andamento' :
                                   a.status === 'EM_ATRASO' ? 'Em Atraso' :
                                   a.status === 'AGUARDANDO_APROVACAO' ? 'Aguardando Aprovação' : 'Concluído'}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-center align-middle">
                                <div className="flex items-center justify-center gap-1.5 min-w-[170px] h-full">
                                  <button type="button" onClick={() => {
                                      setEditingAcao(a);
                                      setEditingAcaoHowMuchStr((a.howMuch || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                    }}
                                    className="p-1.5 text-slate-550 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                                    title="Editar Ação">
                                    <Edit size={13} />
                                  </button>

                                  {(a.status === 'PENDENTE' || a.status === 'EM_ANDAMENTO' || a.status === 'EM_ATRASO') && (
                                    <button type="button" onClick={() => setCompletingAcao(a)}
                                      className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none">
                                      Concluir
                                    </button>
                                  )}

                                  {a.status === 'AGUARDANDO_APROVACAO' && (
                                    <button type="button" onClick={() => setReviewingAcao(a)}
                                      className="py-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none">
                                      Avaliar
                                    </button>
                                  )}

                                  <button type="button" onClick={() => handleDeleteSubAction(a.id)}
                                    className="p-1.5 text-slate-350 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border-none bg-transparent">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
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

      {/* MODAL CADASTRAR NOVA AÇÃO (5W2H) */}
      {isAcaoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cadastrar Nova Ação (5W2H)</h3>
              <button type="button" onClick={() => setIsAcaoModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveNewAcao} className="p-6 space-y-4">
              {/* O Quê & Por Quê */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">O QUÊ (What)</label>
                  <input 
                    type="text" 
                    required
                    value={newAcao.what || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, what: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="O que será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">POR QUÊ (Why)</label>
                  <input 
                    type="text" 
                    required
                    value={newAcao.why || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, why: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Por que será feito?"
                  />
                </div>
              </div>

              {/* Quem, Onde, Quando */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUEM (Who)</label>
                  <select 
                    required
                    value={newAcao.who || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, who: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer">
                    <option value="">Selecione...</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ONDE (Where)</label>
                  <input 
                    type="text" 
                    required
                    value={newAcao.where || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, where: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Onde será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUANDO (When)</label>
                  <input 
                    type="date" 
                    required
                    value={newAcao.when || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, when: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
              </div>

              {/* Como & Quanto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">COMO (How)</label>
                  <input 
                    type="text" 
                    required
                    value={newAcao.how || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, how: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Como será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUANTO (How Much)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input 
                      type="text" 
                      required
                      value={newAcaoHowMuchStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewAcaoHowMuchStr(val);
                        setNewAcao(prev => ({ ...prev, howMuch: parseCurrency(val) }));
                      }}
                      onBlur={() => {
                        setNewAcaoHowMuchStr(parseCurrency(newAcaoHowMuchStr).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                      placeholder="Custo estimado"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Evidência */}
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</label>
                  <select 
                    value={newAcao.status || 'PENDENTE'}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer">
                    <option value="PENDENTE">Em Aberto</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="EM_ATRASO">Em Atraso</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">EVIDÊNCIA / COMENTÁRIOS</label>
                  <input 
                    type="text" 
                    value={newAcao.evidencia || ''}
                    onChange={(e) => setNewAcao(prev => ({ ...prev, evidencia: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Evidências ou comentários sobre a ação"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAcaoModalOpen(false)}
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

      {/* MODAL EDITAR AÇÃO (5W2H) */}
      {editingAcao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Editar Ação (5W2H)</h3>
              <button type="button" onClick={() => setEditingAcao(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveEditedAcao} className="p-6 space-y-4">
              {/* O Quê & Por Quê */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">O QUÊ (What)</label>
                  <input 
                    type="text" 
                    required
                    value={editingAcao.what || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, what: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="O que será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">POR QUÊ (Why)</label>
                  <input 
                    type="text" 
                    required
                    value={editingAcao.why || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, why: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Por que será feito?"
                  />
                </div>
              </div>

              {/* Quem, Onde, Quando */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUEM (Who)</label>
                  <select 
                    required
                    value={editingAcao.who || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, who: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer">
                    <option value="">Selecione...</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ONDE (Where)</label>
                  <input 
                    type="text" 
                    required
                    value={editingAcao.where || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, where: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Onde será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUANDO (When)</label>
                  <input 
                    type="date" 
                    required
                    value={editingAcao.when || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, when: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
              </div>

              {/* Como & Quanto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">COMO (How)</label>
                  <input 
                    type="text" 
                    required
                    value={editingAcao.how || ''}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, how: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Como será feito?"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QUANTO (How Much)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input 
                      type="text" 
                      required
                      value={editingAcaoHowMuchStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingAcaoHowMuchStr(val);
                        setEditingAcao(prev => ({ ...prev!, howMuch: parseCurrency(val) }));
                      }}
                      onBlur={() => {
                        setEditingAcaoHowMuchStr(parseCurrency(editingAcaoHowMuchStr).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                      placeholder="Custo estimado"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">STATUS</label>
                  <select 
                    value={editingAcao.status || 'PENDENTE'}
                    onChange={(e) => setEditingAcao(prev => ({ ...prev!, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] cursor-pointer">
                    <option value="PENDENTE">Em Aberto</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="EM_ATRASO">Em Atraso</option>
                    <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>

              {/* Se o status selecionado for AGUARDANDO_APROVACAO ou CONCLUIDO, exibir campos de conclusão */}
              {(editingAcao.status === 'AGUARDANDO_APROVACAO' || editingAcao.status === 'CONCLUIDO') && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Informações de Conclusão da Ação</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Texto de Conclusão (Obrigatório)</label>
                    <textarea 
                      required
                      rows={3}
                      value={editingAcao.textoConclusao || ''}
                      onChange={(e) => setEditingAcao(prev => ({ ...prev!, textoConclusao: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                      placeholder="Descreva detalhadamente como a ação foi executada..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-455 uppercase tracking-wider block">Evidência Anexada</label>
                    {editingAcao.anexoEvidencia ? (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 truncate max-w-[250px]">
                          {editingAcao.evidencia || 'Arquivo de Evidência'}
                        </span>
                        <div className="flex items-center gap-2">
                          <a href={editingAcao.anexoEvidencia} download={editingAcao.evidencia || "evidencia"} 
                            className="text-[10px] font-black text-[#1B4D3E] hover:underline uppercase tracking-wider">
                            Baixar
                          </a>
                          <button type="button" onClick={() => setEditingAcao(prev => ({ ...prev!, anexoEvidencia: '', evidencia: '' }))}
                            className="text-[10px] font-black text-rose-600 hover:underline uppercase tracking-wider cursor-pointer border-none bg-transparent">
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                        <input 
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingAcao(prev => prev ? {
                                  ...prev,
                                  anexoEvidencia: reader.result as string,
                                  evidencia: file.name
                                } : null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-xs font-black text-[#1B4D3E] uppercase">Selecionar Arquivo de Evidência</span>
                        <span className="text-[9px] font-bold text-slate-450 mt-1">Nenhum arquivo anexado</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Se o status selecionado for AGUARDANDO_APROVACAO ou CONCLUIDO, e houver comentário ou necessidade de comentário */}
              {editingAcao.status === 'AGUARDANDO_APROVACAO' && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Avaliação da Conclusão (Exclusivo para o Responsável do Plano)</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Comentário de Avaliação (Obrigatório)</label>
                    <textarea 
                      rows={3}
                      value={editingAcao.comentarioAprovacao || ''}
                      onChange={(e) => setEditingAcao(prev => ({ ...prev!, comentarioAprovacao: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                      placeholder="Justifique a aprovação ou recusa desta ação..."
                    />
                  </div>
                </div>
              )}

              {editingAcao.status === 'CONCLUIDO' && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Avaliação da Conclusão (Responsável do Plano)</h4>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Comentário de Avaliação</span>
                    <p className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-1 leading-relaxed break-words">
                      {editingAcao.comentarioAprovacao || 'Sem comentário registrado.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-wrap">
                <button 
                  type="button" 
                  onClick={() => setEditingAcao(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                
                {editingAcao.status === 'AGUARDANDO_APROVACAO' && (
                  <>
                    <button 
                      type="button"
                      onClick={(e) => {
                        if (!editingAcao.comentarioAprovacao?.trim()) {
                          alert("O comentário de avaliação é obrigatório.");
                          return;
                        }
                        setEditingAcao(prev => {
                          const updated = { ...prev!, status: 'EM_ANDAMENTO' as any };
                          setTimeout(() => {
                            const btn = document.getElementById('submit-edit-btn');
                            btn?.click();
                          }, 50);
                          return updated;
                        });
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                    >
                      Recusar Conclusão
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        if (!editingAcao.comentarioAprovacao?.trim()) {
                          alert("O comentário de avaliação é obrigatório.");
                          return;
                        }
                        if (!editingAcao.textoConclusao?.trim()) {
                          alert("O texto de conclusão é obrigatório.");
                          return;
                        }
                        setEditingAcao(prev => {
                          const updated = { ...prev!, status: 'CONCLUIDO' as any };
                          setTimeout(() => {
                            const btn = document.getElementById('submit-edit-btn');
                            btn?.click();
                          }, 50);
                          return updated;
                        });
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                    >
                      Aprovar Conclusão
                    </button>
                  </>
                )}

                <button 
                  type="submit"
                  id="submit-edit-btn"
                  className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONCLUIR AÇÃO */}
      {completingAcao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Concluir Ação (5W2H)</h3>
              <button type="button" onClick={() => setCompletingAcao(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveCompletionAcao} className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ação</span>
                <p className="text-xs font-bold text-slate-800 mt-1 leading-normal break-words">{completingAcao.what}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Texto de Conclusão (Obrigatório)</label>
                <textarea 
                  required
                  rows={4}
                  value={completingAcao.textoConclusao || ''}
                  onChange={(e) => setCompletingAcao(prev => ({ ...prev!, textoConclusao: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                  placeholder="Descreva detalhadamente como a ação foi executada..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Anexar Evidências (Opcional)</label>
                <div className="relative border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <input 
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCompletingAcao(prev => prev ? {
                            ...prev,
                            anexoEvidencia: reader.result as string,
                            evidencia: file.name
                          } : null);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-xs font-black text-[#1B4D3E] uppercase">Selecionar Arquivo</span>
                  <span className="text-[9px] font-bold text-slate-450 mt-1">
                    {completingAcao.evidencia ? `Selecionado: ${completingAcao.evidencia}` : "Nenhum arquivo selecionado"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setCompletingAcao(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Enviar para Aprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AVALIAR AÇÃO */}
      {reviewingAcao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Avaliar Conclusão da Ação</h3>
              <button type="button" onClick={() => setReviewingAcao(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ação</span>
                <p className="text-xs font-bold text-slate-800 mt-1 leading-normal break-words">{reviewingAcao.what}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Responsável</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{users.find(u => u.id === reviewingAcao.who)?.nome || reviewingAcao.who || 'N/A'}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Texto de Conclusão do Executor</span>
                <p className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-1 leading-relaxed break-words">{reviewingAcao.textoConclusao}</p>
              </div>

              {reviewingAcao.anexoEvidencia && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Evidência Anexada</span>
                  <div className="mt-1 bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{reviewingAcao.evidencia || 'Arquivo de Evidência'}</span>
                    <a href={reviewingAcao.anexoEvidencia} download={reviewingAcao.evidencia || "evidencia"} 
                      className="text-[10px] font-black text-[#1B4D3E] hover:underline uppercase tracking-wider">
                      Download Anexo
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Comentário de Avaliação (Obrigatório)</label>
                <textarea 
                  required
                  rows={3}
                  value={reviewingAcao.comentarioAprovacao || ''}
                  onChange={(e) => setReviewingAcao(prev => ({ ...prev!, comentarioAprovacao: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                  placeholder="Escreva um comentário justificando sua decisão..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setReviewingAcao(null)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleSaveReviewAcao(e, false)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Recusar
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleSaveReviewAcao(e, true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Aprovar Conclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL CONCLUIR PLANO DE AÇÃO */}
      {isConclusaoPlanoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Concluir Plano de Ação</h3>
              <button type="button" onClick={() => setIsConclusaoPlanoModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveConclusaoPlano} className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Plano de Ação</span>
                <p className="text-sm font-bold text-slate-800 mt-1 leading-normal break-words">{currentPlano.titulo}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Resultado Atingido (Obrigatório)</label>
                <input 
                  type="text"
                  required
                  value={currentPlano.resultadoAtingido || ''}
                  onChange={(e) => setCurrentPlano(prev => ({ ...prev, resultadoAtingido: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  placeholder="Ex: 85%"
                />
              </div>



              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsConclusaoPlanoModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Salvar Conclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR/EDITAR OBJETIVO */}
      {isObjectiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {currentObjective.id ? 'Editar Objetivo' : 'Cadastrar Novo Objetivo'}
              </h3>
              <button type="button" onClick={() => setIsObjectiveModalOpen(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSaveObjective} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Título do Objetivo</label>
                <input
                  type="text"
                  required
                  value={currentObjective.titulo || ''}
                  onChange={(e) => setCurrentObjective(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  placeholder="Ex: Alcançar a excelência operacional"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fase / Classificação</label>
                  <input
                    type="text"
                    value={currentObjective.fase || ''}
                    onChange={(e) => setCurrentObjective(prev => ({ ...prev, fase: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Ex: Fase de Otimização"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data de Término (Prazo)</label>
                  <input
                    type="date"
                    value={currentObjective.dataFim ? currentObjective.dataFim.split('T')[0] : ''}
                    onChange={(e) => setCurrentObjective(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Iniciativas / Ações (uma por linha)</label>
                <textarea
                  rows={4}
                  value={objectiveIniciativasText}
                  onChange={(e) => setObjectiveIniciativasText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                  placeholder="Ex: Otimizar painel de atendimento&#10;Treinar novos operadores locais"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsObjectiveModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Salvar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR/EDITAR RESULTADO-CHAVE (KR) */}
      {isKrModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {currentKr.id ? 'Editar Resultado-Chave (KR)' : 'Cadastrar Novo Resultado-Chave (KR)'}
              </h3>
              <button type="button" onClick={() => setIsKrModalOpen(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSaveKr} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descrição do KR</label>
                <input
                  type="text"
                  required
                  value={currentKr.descricao || ''}
                  onChange={(e) => setCurrentKr(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  placeholder="Ex: Aumentar o NPS para 75"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor Inicial</label>
                  <input
                    type="number"
                    required
                    value={currentKr.valorInicial}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, valorInicial: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor Alvo</label>
                  <input
                    type="number"
                    required
                    value={currentKr.valorAlvo}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, valorAlvo: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor Atual</label>
                  <input
                    type="number"
                    required
                    value={currentKr.valorAtual}
                    onChange={(e) => setCurrentKr(prev => ({ ...prev, valorAtual: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unidade</label>
                  <select
                    value={unitType}
                    onChange={(e) => {
                      const val = e.target.value as '%' | 'R$' | 'none' | 'custom';
                      setUnitType(val);
                      if (val === '%') {
                        setCurrentKr(prev => ({ ...prev, unidade: '%' }));
                      } else if (val === 'R$') {
                        setCurrentKr(prev => ({ ...prev, unidade: 'R$' }));
                      } else if (val === 'none') {
                        setCurrentKr(prev => ({ ...prev, unidade: '' }));
                      } else {
                        setCurrentKr(prev => ({ ...prev, unidade: customUnit || '' }));
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="%">Porcentagem (%)</option>
                    <option value="R$">Moeda (R$)</option>
                    <option value="none">Número simples</option>
                    <option value="custom">Unidade personalizada...</option>
                  </select>
                  {unitType === 'custom' && (
                    <input
                      type="text"
                      required
                      value={customUnit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomUnit(val);
                        setCurrentKr(prev => ({ ...prev, unidade: val }));
                      }}
                      placeholder="Ex: min, clientes, etc."
                      className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKrModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Salvar KR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {/* MODAL DE AÇÕES & RESPONSÁVEIS */}
      {isActionsModalOpen && actionsModalKr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Ações e Responsáveis</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate mt-0.5">
                  {actionsModalKr.descricao}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsActionsModalOpen(false);
                  setIsEditingActions(false);
                }} 
                className="text-slate-400 hover:text-slate-655 cursor-pointer border-none bg-transparent p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {/* Visão por Responsável com % de Avanço */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avanço por Responsável</h4>
                {(() => {
                  if (!editingKrTasks || editingKrTasks.length === 0) {
                    return <p className="text-[11px] text-slate-400 italic">Nenhum responsável com ações atribuídas.</p>;
                  }
                  
                  // Group by responsavelId
                  const groups: Record<string, KRTask[]> = {};
                  editingKrTasks.forEach(t => {
                    const rId = t.responsavelId || 'unassigned';
                    if (!groups[rId]) groups[rId] = [];
                    groups[rId].push(t);
                  });

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(groups).map(([rId, tasks]) => {
                        const user = rId === 'unassigned' ? null : users.find(u => u.id === rId);
                        const uName = user ? user.nome : 'Sem responsável';
                        const initials = user?.nome ? user.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                        const totalProgress = (tasks as any[]).reduce((sum, t) => sum + (t.progresso || 0), 0);
                        const avgProgress = Math.round(totalProgress / (tasks as any[]).length);

                        return (
                          <div key={rId} className="bg-white border border-slate-150 rounded-xl p-3 flex items-center gap-3 shadow-3xs">
                            <div className="w-8 h-8 rounded-full border border-slate-150 overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                              {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={uName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-black uppercase text-emerald-600">{initials}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-2 mb-1">
                                <span className="text-[10.5px] font-black text-slate-700 truncate">{uName}</span>
                                <span className="text-[10.5px] font-black text-emerald-600">{avgProgress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgProgress}%` }}></div>
                              </div>
                              <span className="text-[8.5px] font-bold text-slate-400 block mt-1">{(tasks as any[]).length} {(tasks as any[]).length === 1 ? 'ação' : 'ações'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Tabela / Lista de Ações */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 select-none">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tarefas da Ação</span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {(!editingKrTasks || editingKrTasks.length === 0) ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl select-none">
                      Nenhuma ação/tarefa cadastrada para este KR.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingKrTasks.map(task => {
                        const responsavelTask = users.find(u => u.id === task.responsavelId);
                        const initialsTask = responsavelTask?.nome ? responsavelTask.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';

                        return (
                          <div 
                            key={task.id} 
                            onClick={() => handleOpenActionDetailModal(task)}
                            className="cursor-pointer hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:items-center p-3 select-none"
                          >
                            {/* Left column (Checkbox + Description + Comment): spans 6 columns */}
                            <div className="col-span-6 flex items-start gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={task.status === 'CONCLUIDO'}
                                readOnly
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-755 break-words">{task.descricao || 'Sem descrição'}</p>
                                {task.comentario && (
                                  <p className="text-[9.5px] font-bold text-slate-450 italic mt-0.5 break-words">
                                    Obs: {task.comentario}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Responsável (Photo only): spans 1 column */}
                            <div className="col-span-1 flex justify-start sm:justify-center">
                              {responsavelTask ? (
                                <div 
                                  className="w-5 h-5 rounded-full border border-slate-150 overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0 shadow-3xs cursor-help"
                                  title={`Responsável: ${responsavelTask.nome}`}
                                >
                                  {responsavelTask.avatarUrl ? (
                                    <img src={responsavelTask.avatarUrl} alt={responsavelTask.nome} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[8px] font-bold uppercase text-emerald-600">{initialsTask}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-dashed border-slate-250 flex items-center justify-center shrink-0 text-slate-300 text-[8px]" title="Sem responsável">
                                  -
                                </div>
                              )}
                            </div>

                            {/* Prazo (Data): spans 2 columns */}
                            <div className="col-span-2 flex justify-start sm:justify-center">
                              <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                                <Calendar size={11} className="text-slate-400" />
                                <span>{task.dataLimite ? formatLocalDate(task.dataLimite) : 'Sem prazo'}</span>
                              </div>
                            </div>

                            {/* Progresso (Bar + %): spans 2 columns */}
                            <div className="col-span-2 flex items-center gap-2 w-full justify-between sm:justify-end">
                              <div className="w-16 bg-slate-250 rounded-full h-1.5 overflow-hidden shrink-0 hidden sm:block">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${task.progresso}%` }}></div>
                              </div>
                              <span className="text-[9.5px] font-black text-slate-600 w-8 text-right shrink-0">{task.progresso}%</span>
                            </div>

                            {/* Status (Badge): spans 1 column */}
                            <div className="col-span-1 flex justify-start sm:justify-end">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                task.status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                task.status === 'EM_ANDAMENTO' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                'bg-slate-50 border-slate-200 text-slate-600'
                              }`}>
                                {task.status === 'CONCLUIDO' ? 'Concluído' :
                                 task.status === 'EM_ANDAMENTO' ? 'Em Progresso' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 select-none shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsActionsModalOpen(false);
                  setIsEditingActions(false);
                }}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 cursor-pointer bg-white"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleOpenNewActionModal}
                className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none flex items-center gap-1.5"
              >
                <Plus size={14} /> Nova Ação
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL DE COMENTÁRIOS DO OBJETIVO */}
      {isCommentsModalOpen && commentsModalObjective && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Anotações & Comentários</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate mt-0.5">
                  {commentsModalObjective.titulo}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCommentsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-655 cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </header>

            {/* Scrollable list of comments */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px]">
              {(!commentsModalObjective.comentarios || commentsModalObjective.comentarios.length === 0) ? (
                <div className="text-center py-12 text-[11px] text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 select-none">
                  <MessageSquare size={24} className="text-slate-300" />
                  <span>Nenhum comentário cadastrado para este objetivo.</span>
                  <span>Deixe a primeira observação abaixo!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {commentsModalObjective.comentarios.map((comment) => {
                    const initials = comment.userName ? comment.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                    const isOwnComment = comment.userId === currentUser?.id;

                    return (
                      <div key={comment.id} className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-2xl transition-all space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border border-slate-150 overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                              {comment.avatarUrl ? (
                                <img src={comment.avatarUrl} alt={comment.userName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[7.5px] font-bold uppercase text-emerald-600">{initials}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-black text-slate-700">{comment.userName}</span>
                            <span className="text-[8px] font-bold text-slate-400">
                              {new Date(comment.createdAt).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {isOwnComment && (
                            <button
                              type="button"
                              onClick={() => handleDeleteObjectiveComment(comment.id)}
                              className="text-[9px] font-bold text-red-500 hover:text-red-700 cursor-pointer bg-transparent border-none"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-655 leading-relaxed break-words whitespace-pre-wrap pl-7">
                          {comment.texto}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom text input and submit form */}
            <form onSubmit={handleAddObjectiveComment} className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Novo Comentário</label>
                <textarea
                  required
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                  placeholder="Escreva uma observação, atualização ou comentário sobre este objetivo..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCommentsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 cursor-pointer bg-white"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHE / EDICAO DE AÇÃO */}
      {isActionDetailModalOpen && activeActionTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Gestão da Ação</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate mt-0.5">
                  {activeActionTask.descricao || 'Nova Ação'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsActionDetailModalOpen(false)} 
                className="text-slate-400 hover:text-slate-655 cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSaveActionDetail} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descrição da Ação</label>
                <input
                  type="text"
                  required
                  value={activeActionTask.descricao || ''}
                  onChange={(e) => setActiveActionTask(prev => ({ ...prev!, descricao: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  placeholder="Ex: Anunciar veículo no OLX"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Responsável</label>
                  <select
                    value={activeActionTask.responsavelId || ''}
                    onChange={(e) => setActiveActionTask(prev => ({ ...prev!, responsavelId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="">Selecione...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prazo (Data)</label>
                  <input
                    type="date"
                    value={activeActionTask.dataLimite || ''}
                    onChange={(e) => setActiveActionTask(prev => ({ ...prev!, dataLimite: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progresso ({activeActionTask.progresso || 0}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={activeActionTask.progresso || 0}
                    onChange={(e) => {
                      const prog = parseInt(e.target.value) || 0;
                      setActiveActionTask(prev => {
                        const status = prog === 100 ? 'CONCLUIDO' : prog === 0 ? 'PENDENTE' : 'EM_ANDAMENTO';
                        return { ...prev!, progresso: prog, status };
                      });
                    }}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E] mt-3"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={activeActionTask.status || 'PENDENTE'}
                    onChange={(e) => {
                      const status = e.target.value as any;
                      setActiveActionTask(prev => {
                        const progresso = status === 'CONCLUIDO' ? 100 : status === 'PENDENTE' ? 0 : prev!.progresso;
                        return { ...prev!, status, progresso };
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="EM_ANDAMENTO">Em Progresso</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
              </div>

              {/* ANOTAÇÕES / HISTÓRICO DE ANOTAÇÕES */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Histórico de Anotações</label>
                
                {/* Scrollable Notes List */}
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {(!activeActionTask.anotacoes || activeActionTask.anotacoes.length === 0) ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
                      Nenhuma anotação registrada ainda.
                    </p>
                  ) : (
                    activeActionTask.anotacoes.map((note: any) => {
                      const noteInitials = note.userName ? note.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                      return (
                        <div key={note.id} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-[10.5px] leading-relaxed">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full border border-slate-150 overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                                {note.avatarUrl ? (
                                  <img src={note.avatarUrl} alt={note.userName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[6.5px] font-bold uppercase text-emerald-600">{noteInitials}</span>
                                )}
                              </div>
                              <span className="font-black text-slate-700">{note.userName}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">{new Date(note.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-slate-600 font-medium pl-5 break-words whitespace-pre-wrap">{note.texto}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* New Annotation Textarea */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nova Anotação</label>
                  <textarea
                    rows={2}
                    value={newActionAnnotationText}
                    onChange={(e) => setNewActionAnnotationText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] resize-none"
                    placeholder="Adicione observações ou atualizações sobre o andamento desta ação..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 shrink-0">
                <div>
                  {activeActionTask.id.startsWith('task-') && editingKrTasks.some(t => t.id === activeActionTask.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAction(activeActionTask.id)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border border-red-200"
                    >
                      Excluir Ação
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActionDetailModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-wider hover:bg-slate-100 cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer border-none"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

</div>
  );
}
