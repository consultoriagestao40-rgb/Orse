'use client';
// Force redeploy with database color column present

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { 
  FileText, Plus, Search, 
  Users, TrendingUp, Clock,
  LayoutList, LayoutGrid, UserSquare2,
  Edit2, Trash2, FileStack, Filter,
  MoreVertical, Share2, ArrowRightLeft, History, X, Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getPropostas, updatePropostaStatus,
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus,
  deleteProposta, getCurrentUserRole,
  getUsersList, transferirProposta, compartilharProposta, removerCompartilhamentoProposta, getAuditLogs,
  updatePropostaStatusParam, getPipelinePageData
} from '@/app/propostas/actions';
import UserSelectPopover from '@/components/UserSelectPopover';
import { getSegmentos } from '@/app/admin/settings/actions';
import { updateCliente } from '@/app/clientes/actions';
import { Building } from 'lucide-react';

type ViewMode = 'lista' | 'kanban-status' | 'kanban-vendedor' | 'kanban-segmento';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

function ProposalsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('USER');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  useEffect(() => {
    const saved = localStorage.getItem('orse_fpv_view_mode');
    if (saved) setViewMode(saved as any);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_fpv_view_mode', mode);
  };
  const [vendedorColors, setVendedorColors] = useState<Record<string, string>>({});
  const [segmentoColors, setSegmentoColors] = useState<Record<string, string>>({});
  const [editingSegmentoId, setEditingSegmentoId] = useState<string | null>(null);
  const [statusOrder, setStatusOrder] = useState<string[]>([]);
  const [vendedorOrder, setVendedorOrder] = useState<string[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);

  const handleDragColumnStart = (e: React.DragEvent, columnLabel: string, type: 'status' | 'vendedor') => {
    e.dataTransfer.setData('text/column-id', columnLabel);
    e.dataTransfer.setData('text/column-type', type);
    e.currentTarget.classList.add('opacity-40');
  };

  const handleDragColumnEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-40');
  };

  const handleDropColumn = (e: React.DragEvent, targetLabel: string, type: 'status' | 'vendedor') => {
    e.preventDefault();
    const sourceLabel = e.dataTransfer.getData('text/column-id');
    const sourceType = e.dataTransfer.getData('text/column-type');
    
    if (sourceType !== type || sourceLabel === targetLabel) return;

    if (type === 'status') {
      const currentCols = statuses.map(s => s.nome);
      if (proposals.some(p => !p.status || !statuses.find(s => s.nome.toLowerCase() === p.status.toLowerCase()))) {
        currentCols.push('Sem Status');
      }
      
      let order = statusOrder.length > 0 ? [...statusOrder] : [...currentCols];
      currentCols.forEach(c => {
        if (!order.includes(c)) order.push(c);
      });

      const sourceIdx = order.indexOf(sourceLabel);
      const targetIdx = order.indexOf(targetLabel);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const newOrder = [...order];
        newOrder.splice(sourceIdx, 1);
        newOrder.splice(targetIdx, 0, sourceLabel);
        setStatusOrder(newOrder);
        localStorage.setItem('kanban-status-order', JSON.stringify(newOrder));
      }
    } else {
      const currentCols = Array.from(new Set(proposals.map(p => p.usuario || 'Sem Vendedor')));
      let order = vendedorOrder.length > 0 ? [...vendedorOrder] : [...currentCols];
      currentCols.forEach(c => {
        if (!order.includes(c)) order.push(c);
      });

      const sourceIdx = order.indexOf(sourceLabel);
      const targetIdx = order.indexOf(targetLabel);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const newOrder = [...order];
        newOrder.splice(sourceIdx, 1);
        newOrder.splice(targetIdx, 0, sourceLabel);
        setVendedorOrder(newOrder);
        localStorage.setItem('kanban-vendedor-order', JSON.stringify(newOrder));
      }
    }
  };

  // Modais e dados auxiliares
  const [usersList, setUsersList] = useState<any[]>([]);
  const [teamModal, setTeamModal] = useState<{ isOpen: boolean, prop: any | null }>({ isOpen: false, prop: null });
  const [auditModal, setAuditModal] = useState<{ isOpen: boolean, propId: string | null, logs: any[] }>({ isOpen: false, propId: null, logs: [] });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Popovers para gerenciamento de equipe
  const [ownerAnchorEl, setOwnerAnchorEl] = useState<HTMLElement | null>(null);
  const [isOwnerPopoverOpen, setIsOwnerPopoverOpen] = useState(false);
  const [participantAnchorEl, setParticipantAnchorEl] = useState<HTMLElement | null>(null);
  const [isParticipantPopoverOpen, setIsParticipantPopoverOpen] = useState(false);
  const [observerAnchorEl, setObserverAnchorEl] = useState<HTMLElement | null>(null);
  const [isObserverPopoverOpen, setIsObserverPopoverOpen] = useState(false);

  // Alteração inline no card
  const [inlineOwnerAnchorEl, setInlineOwnerAnchorEl] = useState<HTMLElement | null>(null);
  const [inlineOwnerPropId, setInlineOwnerPropId] = useState<string | null>(null);

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (val: string) => void | Promise<void>;
    onCancel?: () => void;
    type: 'prompt' | 'alert' | 'confirm';
    message?: string;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    type: 'prompt',
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

  const handleCreateStatus = (insertAfterLabel: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Novo Status/Etapa',
      placeholder: 'Nome do novo status/etapa (ex: Negociação)',
      type: 'prompt',
      onConfirm: async (name) => {
        if (!name.trim()) return;
        const trimmed = name.trim();
        const res = await createPropostaStatus(trimmed);
        if (res.success) {
          const currentCols = statuses.map(s => s.nome);
          let order = statusOrder.length > 0 ? [...statusOrder] : [...currentCols];
          const insertIdx = order.indexOf(insertAfterLabel);
          if (insertIdx !== -1) {
            order.splice(insertIdx + 1, 0, trimmed);
          } else {
            order.push(trimmed);
          }
          setStatusOrder(order);
          localStorage.setItem('kanban-status-order', JSON.stringify(order));
          loadData();
        } else {
          showCustomAlert('Erro ao Criar Status', res.error || 'Erro ao criar status');
        }
      }
    });
  };

  const loadData = async () => {
    setLoading(true);
    const [pageData, segmentosRes] = await Promise.all([
      getPipelinePageData(),
      getSegmentos()
    ]);
    const { proposals, statuses, role, usersList } = pageData;
    setProposals(proposals);
    setStatuses(statuses);
    setUserRole(role);
    setUsersList(usersList);
    if (segmentosRes && segmentosRes.success) {
      setSegmentos(segmentosRes.segmentos);
    } else if (Array.isArray(segmentosRes)) {
      setSegmentos(segmentosRes);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Funções de equipe para FPV
  const handlePropostaOwnerChange = async (propostaId: string, newOwnerId: string) => {
    setLoading(true);
    const res = await transferirProposta(propostaId, newOwnerId);
    if (res.success) {
      // Reload proposals
      const pageData = await getPipelinePageData();
      setProposals(pageData.proposals);
      // Update modal prop if open
      if (teamModal.isOpen && teamModal.prop?.id === propostaId) {
        const matching = pageData.proposals.find((p: any) => p.id === propostaId);
        if (matching) setTeamModal({ isOpen: true, prop: matching });
      }
    } else {
      alert("Erro ao transferir proposta: " + res.error);
    }
    setLoading(false);
  };

  const handleAddPropostaShare = async (propostaId: string, userId: string, role: string = 'PARTICIPANTE') => {
    setLoading(true);
    const res = await compartilharProposta(propostaId, userId, role);
    if (res.success) {
      const pageData = await getPipelinePageData();
      setProposals(pageData.proposals);
      if (teamModal.isOpen && teamModal.prop?.id === propostaId) {
        const matching = pageData.proposals.find((p: any) => p.id === propostaId);
        if (matching) setTeamModal({ isOpen: true, prop: matching });
      }
    } else {
      alert("Erro ao compartilhar proposta: " + res.error);
    }
    setLoading(false);
  };

  const handleRemovePropostaShare = async (propostaId: string, userId: string) => {
    setLoading(true);
    const res = await removerCompartilhamentoProposta(propostaId, userId);
    if (res.success) {
      const pageData = await getPipelinePageData();
      setProposals(pageData.proposals);
      if (teamModal.isOpen && teamModal.prop?.id === propostaId) {
        const matching = pageData.proposals.find((p: any) => p.id === propostaId);
        if (matching) setTeamModal({ isOpen: true, prop: matching });
      }
    } else {
      alert("Erro ao remover coautoria: " + res.error);
    }
    setLoading(false);
  };

  const handleTogglePropostaParticipant = async (userId: string) => {
    if (!teamModal.prop) return;
    const propostaId = teamModal.prop.id;
    const isSelected = teamModal.prop.shares?.some((s: any) => s.user?.id === userId && s.role !== 'OBSERVADOR');
    if (isSelected) {
      await handleRemovePropostaShare(propostaId, userId);
    } else {
      await handleAddPropostaShare(propostaId, userId, 'PARTICIPANTE');
    }
  };

  const handleTogglePropostaObserver = async (userId: string) => {
    if (!teamModal.prop) return;
    const propostaId = teamModal.prop.id;
    const isSelected = teamModal.prop.shares?.some((s: any) => s.user?.id === userId && s.role === 'OBSERVADOR');
    if (isSelected) {
      await handleRemovePropostaShare(propostaId, userId);
    } else {
      await handleAddPropostaShare(propostaId, userId, 'OBSERVADOR');
    }
  };

  const handleInlinePropostaOwnerSelect = async (userId: string) => {
    if (!inlineOwnerPropId) return;
    await handlePropostaOwnerChange(inlineOwnerPropId, userId);
    setInlineOwnerPropId(null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const colors: Record<string, string> = {};
      const segColors: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('kanban-vendedor-color-')) {
            const seller = key.replace('kanban-vendedor-color-', '');
            colors[seller] = localStorage.getItem(key) || 'emerald';
          } else if (key.startsWith('kanban-segmento-color-')) {
            const seg = key.replace('kanban-segmento-color-', '');
            segColors[seg] = localStorage.getItem(key) || 'emerald';
          }
        }
      }
      setVendedorColors(colors);
      setSegmentoColors(segColors);

      // Load column order
      const storedStatusOrder = localStorage.getItem('kanban-status-order');
      if (storedStatusOrder) {
        try {
          setStatusOrder(JSON.parse(storedStatusOrder));
        } catch (e) {
          console.error(e);
        }
      }
      const storedVendedorOrder = localStorage.getItem('kanban-vendedor-order');
      if (storedVendedorOrder) {
        try {
          setVendedorOrder(JSON.parse(storedVendedorOrder));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const getStatusStyle = (statusNome: string) => {
    if (!statusNome) return 'bg-slate-100 text-slate-600 border border-slate-200';
    const found = statuses.find(s => s.nome.toLowerCase() === statusNome.toLowerCase());
    return found?.color || 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  const filteredProposals = proposals.filter(p =>
    p.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.usuario || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = proposals.length;
  const monthlyVolume = proposals.reduce((acc, p) => acc + p.valor, 0);
  const clientsCount = new Set(proposals.map(p => p.cliente)).size;
  const revisionCount = proposals.filter(p => (p.status || '').toUpperCase().includes('REVIS')).length;

  // ── Dados para Kanban por Status ────────────────────────────────────────────
  const kanbanStatusCols = statuses.map(s => {
    const cards = filteredProposals.filter(p => (p.status || '').toLowerCase() === s.nome.toLowerCase());
    return {
      id: s.id,
      label: s.nome,
      color: s.color || 'bg-slate-100 text-slate-600 border border-slate-200',
      cards,
      total: cards.reduce((a, c) => a + c.valor, 0),
    };
  });
  // Propostas sem status mapeado
  const semStatus = filteredProposals.filter(p => !p.status || !statuses.find(s => s.nome.toLowerCase() === p.status.toLowerCase()));
  if (semStatus.length > 0) {
    kanbanStatusCols.push({
      id: 'sem-status',
      label: 'Sem Status',
      color: 'bg-slate-100 text-slate-500 border border-slate-200',
      cards: semStatus,
      total: semStatus.reduce((a, c) => a + c.valor, 0),
    });
  }

  // ── Dados para Kanban por Vendedor ──────────────────────────────────────────
  const vendedoresMap = new Map<string, any[]>();
  filteredProposals.forEach(p => {
    const v = p.usuario || 'Sem Vendedor';
    if (!vendedoresMap.has(v)) vendedoresMap.set(v, []);
    vendedoresMap.get(v)!.push(p);
  });
  const kanbanVendedorCols = Array.from(vendedoresMap.entries()).map(([nome, cards]) => ({
    id: nome,
    label: nome,
    cards,
    total: cards.reduce((a, c) => a + c.valor, 0),
  }));

  // ── Dados para Kanban por Segmento ──────────────────────────────────────────
  const kanbanSegmentoCols = React.useMemo(() => {
    const cols: { id: string; label: string; cards: any[]; total: number }[] = [];

    // Columns for each segment
    segmentos.forEach(seg => {
      const segName = seg.nome || seg;
      const segProps = filteredProposals.filter(p => p.segmento === segName);
      cols.push({
        id: seg.id || segName,
        label: segName,
        cards: segProps,
        total: segProps.reduce((acc, p) => acc + (p.valor || 0), 0)
      });
    });

    return cols;
  }, [filteredProposals, segmentos]);

  // ── Menu de Ações Reutilizável ──────────────────────────────────────────────
  const ActionMenu = ({ prop }: { prop: any }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button onClick={() => setOpen(!open)} className="text-amber-500 hover:text-amber-600 p-1 rounded transition-colors">
          <MoreVertical size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50">
            <button onClick={() => { setOpen(false); setTeamModal({ isOpen: true, prop }); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold">
              <Users size={14} className="text-[#1B4D3E]" /> Gerenciar Equipe
            </button>
            {userRole === 'ADMIN' && (
              <button onClick={async () => {
                setOpen(false);
                setLoading(true);
                const logs = await getAuditLogs(prop.id);
                setAuditModal({ isOpen: true, propId: prop.id, logs });
                setLoading(false);
              }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <History size={14} /> Auditoria
              </button>
            )}
          </div>
        )}
        {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      </div>
    );
  };

  const ProposalCard = ({ prop }: { prop: any }) => (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', prop.id);
      }}
      onClick={() => router.push(`/propostas/nova?id=${prop.id}`)}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1B4D3E]/8 rounded-lg">
            <FileText size={13} className="text-[#1B4D3E]" />
          </div>
          <span className="text-xs font-black text-slate-700 tracking-wide">{prop.numero}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <FileStack size={11} />
          <span className="text-[10px] font-bold">v{prop.versao}</span>
        </div>
      </div>

      <p className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{prop.cliente}</p>
      <p className="text-[10px] text-slate-400 font-medium mb-3">📅 {prop.data}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#1B4D3E]">{fmt(prop.valor)}</span>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getStatusStyle(prop.status)}`}>
          {prop.status || '—'}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div 
          id={`avatar-inline-owner-${prop.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setInlineOwnerAnchorEl(e.currentTarget);
            setInlineOwnerPropId(prop.id);
          }}
          className="flex items-center gap-1.5 hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
        >
          {prop.avatarUrl ? (
            <img 
              src={prop.avatarUrl} 
              alt={prop.usuario} 
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
              {(prop.usuario || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]">{prop.usuario}</span>
        </div>
        <ActionMenu prop={prop} />
      </div>
    </div>
  );

  const getBorderColorClass = (colorClass?: string) => {
    if (!colorClass) return 'border-[#1B4D3E]';
    if (colorClass.includes('slate')) return 'border-slate-400';
    if (colorClass.includes('blue')) return 'border-blue-500';
    if (colorClass.includes('green') || colorClass.includes('emerald')) return 'border-emerald-500';
    if (colorClass.includes('red') || colorClass.includes('rose')) return 'border-red-500';
    if (colorClass.includes('amber') || colorClass.includes('yellow')) return 'border-amber-500';
    if (colorClass.includes('purple')) return 'border-purple-500';
    return 'border-[#1B4D3E]';
  };

  const getHighlightedColorClass = (colorClass: any = '') => {
    const lower = (colorClass || '').toLowerCase();
    if (lower.includes('sky') || lower.includes('blue')) {
      return {
        bg: 'bg-gradient-to-br from-blue-600 to-sky-600',
        border: 'border-blue-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('orange') || lower.includes('amber')) {
      return {
        bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        border: 'border-orange-600',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('green') || lower.includes('emerald')) {
      return {
        bg: 'bg-gradient-to-br from-emerald-600 to-green-600',
        border: 'border-emerald-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('red') || lower.includes('rose')) {
      return {
        bg: 'bg-gradient-to-br from-red-600 to-rose-600',
        border: 'border-rose-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('purple') || lower.includes('violet')) {
      return {
        bg: 'bg-gradient-to-br from-purple-600 to-indigo-600',
        border: 'border-purple-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('yellow')) {
      return {
        bg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
        border: 'border-yellow-600',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('indigo')) {
      return {
        bg: 'bg-gradient-to-br from-indigo-600 to-blue-700',
        border: 'border-indigo-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('pink')) {
      return {
        bg: 'bg-gradient-to-br from-pink-600 to-rose-500',
        border: 'border-pink-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    if (lower.includes('teal')) {
      return {
        bg: 'bg-gradient-to-br from-teal-600 to-emerald-600',
        border: 'border-teal-700',
        text: 'text-white',
        badge: 'bg-white/20 text-white border border-white/10',
        totalColor: 'text-white'
      };
    }
    return {
      bg: 'bg-gradient-to-br from-slate-600 to-slate-500',
      border: 'border-slate-700',
      text: 'text-white',
      badge: 'bg-white/20 text-white border border-white/10',
      totalColor: 'text-white'
    };
  };

  const syncScroll = (sourceId: string, targetId: string) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (source && target) {
      target.scrollLeft = source.scrollLeft;
    }
  };

  // ── Cabeçalho da coluna ────────────────────────────────────────────────────
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
  };

  const resolveColorToHex = (color?: string): string => {
    if (!color) return '#1B4D3E';
    const lower = color.toLowerCase().trim();
    if (lower.startsWith('#')) return lower;

    // Check for exact Tailwind bg-color-100 / bg-color-200 matches
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
    return tailwindColorMap[stripped] || '#1B4D3E';
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
    // Row 1: Soft Pastels
    '#E0F2FE', '#E0F2F1', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FFEDD5', '#FFE4E6', '#FCE7F3', '#F3E8FF', '#F1F5F9',
    // Row 2: Standard Vibrant
    '#38BDF8', '#0D9488', '#10B981', '#84CC16', '#FACC15', '#FB923C', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B',
    // Row 3: Bright Neon / Vivid
    '#0EA5E9', '#00B4D8', '#00F5D4', '#39FF14', '#FFD000', '#FF9F1C', '#FF007F', '#D000FF', '#7000FF', '#48CAE4',
    // Row 4: Deep / Dark
    '#0369A1', '#0B6623', '#065F46', '#3F6212', '#A16207', '#C2410C', '#B91C1C', '#9D174D', '#581C87', '#334155',
  ];

  // ── Cabeçalho da coluna ────────────────────────────────────────────────────
  const KanbanColumnHeader = ({ label, color, cards, total, type = 'status', statusId, onColorChange, onDragColumnStart, onDragColumnEnd, onDropColumn, onRenameColumn, onCreateStatus, isFirst = false, isLast = false }: {
    label: string; color?: string; cards: any[]; total: number; type?: 'status' | 'vendedor' | 'segmento'; statusId?: string; onColorChange?: (newColor: string) => void;
    onDragColumnStart?: (e: React.DragEvent, label: string) => void;
    onDragColumnEnd?: (e: React.DragEvent) => void;
    onDropColumn?: (e: React.DragEvent, label: string) => void;
    onRenameColumn?: (newName: string) => Promise<void>;
    onCreateStatus?: (insertAfterLabel: string) => Promise<void>;
    isFirst?: boolean;
    isLast?: boolean;
  }) => {
    const [showEditPopover, setShowEditPopover] = useState(false);
    const [editNameValue, setEditNameValue] = useState(label);
    const resolvedHex = resolveColorToHex(color);
    const [customColorValue, setCustomColorValue] = useState(resolvedHex);
    const contrast = getContrastYIQ(resolvedHex);
    const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
    const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
    const textHex = getDarkenedHexForText(resolvedHex);

    useEffect(() => {
      setEditNameValue(label);
    }, [label]);

    useEffect(() => {
      setCustomColorValue(resolvedHex);
    }, [resolvedHex]);

    const userObj = usersList.find(u => u.nome === label);
    const colAvatarUrl = userObj?.avatarUrl;
    const isStatus = type === 'status';
    const isSegmento = type === 'segmento';

    return (
      <div 
        className="flex-shrink-0 w-[274px] shrink-0 relative cursor-grab active:cursor-grabbing transition-all select-none duration-200 hover:scale-[1.01] pointer-events-auto"
        data-col-label={label}
        draggable="true"
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('select') || target.closest('input')) {
            e.preventDefault();
            return;
          }
          if (onDragColumnStart) onDragColumnStart(e, label);
          (window as any).__draggedColumn = { label, type };
        }}
        onDragEnd={(e) => {
          if (onDragColumnEnd) onDragColumnEnd(e);
          (window as any).__draggedColumn = null;
          document.querySelectorAll('.drag-guide-left, .drag-guide-right').forEach(g => {
            g.classList.remove('opacity-100');
            g.classList.add('opacity-0');
          });
        }}
        onDragOver={(e) => {
          e.preventDefault();
          const dragged = (window as any).__draggedColumn;
          if (dragged && dragged.type === type && dragged.label !== label) {
            const parent = e.currentTarget.parentElement?.parentElement;
            if (parent) {
              // Hide all sibling indicators first to avoid stickiness
              parent.querySelectorAll('.drag-guide-left, .drag-guide-right').forEach(g => {
                g.classList.remove('opacity-100');
                g.classList.add('opacity-0');
              });

              const children = Array.from(parent.children);
              const draggedIndex = children.findIndex(child => 
                child.querySelector('[data-col-label]')?.getAttribute('data-col-label') === dragged.label
              );
              const targetIndex = children.findIndex(child => 
                child.querySelector('[data-col-label]')?.getAttribute('data-col-label') === label
              );
              
              if (draggedIndex !== -1 && targetIndex !== -1) {
                const isLeft = draggedIndex > targetIndex;
                const leftGuide = e.currentTarget.querySelector('.drag-guide-left') as HTMLElement;
                const rightGuide = e.currentTarget.querySelector('.drag-guide-right') as HTMLElement;
                
                if (leftGuide && rightGuide) {
                  if (isLeft) {
                    leftGuide.classList.remove('opacity-0');
                    leftGuide.classList.add('opacity-100');
                  } else {
                    rightGuide.classList.remove('opacity-0');
                    rightGuide.classList.add('opacity-100');
                  }
                }
              }
            }
          }
        }}
        onDragLeave={() => {
          // Do nothing on drag leave of child elements to prevent indicator flickering
        }}
        onDrop={(e) => {
          if (onDropColumn) onDropColumn(e, label);
          (window as any).__draggedColumn = null;
          document.querySelectorAll('.drag-guide-left, .drag-guide-right').forEach(g => {
            g.classList.remove('opacity-100');
            g.classList.add('opacity-0');
          });
        }}
      >
        <div className="drag-guide-left absolute left-[-12px] top-0 bottom-0 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] z-30 pointer-events-none opacity-0 transition-opacity duration-150 flex items-center justify-center">
          <div className="absolute top-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <div className="absolute bottom-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
        <div className="drag-guide-right absolute right-[-12px] top-0 bottom-0 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] z-30 pointer-events-none opacity-0 transition-opacity duration-150 flex items-center justify-center">
          <div className="absolute top-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <div className="absolute bottom-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        </div>
        
        {/* Cabeçalho Chevron/Seta */}
        <div 
          className="w-full h-[52px] relative group/title pointer-events-auto"
        >
          {/* Background SVG Custom Shape */}
          <svg 
            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
            viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
            preserveAspectRatio="none"
            style={{
              color: resolvedHex,
            }}
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

          {/* Conteúdo do Cabeçalho */}
          <div 
            className={`absolute inset-0 z-10 flex items-center justify-between ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
            style={{
              color: contrast === 'white' ? '#ffffff' : '#0f172a',
            }}
          >
            {/* Lado esquerdo: título e subtítulo */}
            <div className="flex flex-col min-w-0 justify-center">
              {isStatus ? (
                <span className="text-sm font-black uppercase tracking-wider truncate max-w-[160px] leading-none">
                  {label}
                </span>
              ) : isSegmento ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Building size={14} className="shrink-0" style={{ color: textHex }} />
                  <span className="text-sm font-black uppercase tracking-wider truncate leading-none">
                    {label}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  {colAvatarUrl ? (
                    <img 
                      src={colAvatarUrl} 
                      alt={label} 
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-[9px] uppercase border border-black/10 flex-shrink-0" style={{ color: textHex }}>
                      {label.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                  )}
                  <span className="text-sm font-black uppercase tracking-wider truncate leading-none">
                    {label}
                  </span>
                </div>
              )}
              {/* Subtítulo integrado com o totalizador de volume e negócios */}
              <span className="text-xs font-bold mt-1 opacity-90 truncate select-none leading-none">
                {fmt(total)} • {cards.length} {cards.length === 1 ? 'negócio' : 'negócios'}
              </span>
            </div>

            {/* Lado direito: botões centralizados verticalmente */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isStatus && onCreateStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateStatus(label);
                  }}
                  className="p-1 rounded-full transition-all duration-150 opacity-0 group-hover/title:opacity-100 flex items-center justify-center cursor-pointer hover:bg-black/5"
                  style={{ color: 'inherit' }}
                  title="Criar Nova Etapa"
                  type="button"
                >
                  <Plus size={14} />
                </button>
              )}

              {onColorChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditPopover(!showEditPopover);
                  }}
                  className="p-1 rounded-full transition-all duration-150 opacity-0 group-hover/title:opacity-100 flex items-center justify-center cursor-pointer hover:bg-black/5"
                  style={{ color: 'inherit' }}
                  title="Editar Coluna"
                  type="button"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Popover de Edição Unificado */}
          {showEditPopover && (
            <>
              <div 
                className="fixed inset-0 z-30 cursor-default" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditPopover(false);
                }}
                onDragStart={(e) => e.preventDefault()}
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-3 cursor-default"
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Editar Coluna
                  </span>
                  <button 
                    onClick={() => setShowEditPopover(false)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>

                {isStatus && onRenameColumn && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nome da Coluna</label>
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-slate-300 outline-none w-full bg-slate-50 font-medium"
                      placeholder="Nome da coluna"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          if (editNameValue.trim() && editNameValue.trim().toUpperCase() !== label.toUpperCase()) {
                            await onRenameColumn(editNameValue.trim());
                          }
                          setShowEditPopover(false);
                        }
                      }}
                    />
                  </div>
                )}

                {onColorChange && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                    <div className="grid grid-cols-10 gap-1 mt-0.5">
                      {PRESET_COLORS.map(c => {
                        const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                        return (
                          <button
                            key={c}
                            onClick={async () => {
                              await onColorChange(c);
                            }}
                            className={`w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center`}
                            style={{
                              backgroundColor: c,
                              borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)',
                              borderWidth: isSelected ? '2px' : '1px'
                            }}
                            title={c}
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
                )}

                {/* Cor Personalizada (HTML Color Input) */}
                {onColorChange && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                      <input 
                        type="color" 
                        value={customColorValue}
                        onChange={async (e) => {
                          setCustomColorValue(e.target.value);
                          await onColorChange(e.target.value);
                        }}
                        className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (isStatus && onRenameColumn && editNameValue.trim() && editNameValue.trim().toUpperCase() !== label.toUpperCase()) {
                      await onRenameColumn(editNameValue.trim());
                    }
                    setShowEditPopover(false);
                  }}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center"
                >
                  Concluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const getSuaveBgClass = (colorClass: string = '', type: 'status' | 'vendedor' = 'status') => {
    const lower = (colorClass || '').toLowerCase();
    if (lower.includes('sky') || lower.includes('blue')) {
      return 'bg-blue-100/40 border border-blue-200/50';
    }
    if (lower.includes('orange') || lower.includes('amber')) {
      return 'bg-amber-100/40 border border-amber-200/50';
    }
    if (lower.includes('green') || lower.includes('emerald')) {
      return 'bg-emerald-100/40 border border-emerald-200/50';
    }
    if (lower.includes('red') || lower.includes('rose')) {
      return 'bg-rose-100/40 border border-rose-200/50';
    }
    if (lower.includes('purple') || lower.includes('violet')) {
      return 'bg-purple-100/40 border border-purple-200/50';
    }
    if (lower.includes('yellow')) {
      return 'bg-yellow-100/40 border border-yellow-200/50';
    }
    if (lower.includes('indigo')) {
      return 'bg-indigo-100/40 border border-indigo-200/50';
    }
    if (lower.includes('pink')) {
      return 'bg-pink-100/40 border border-pink-200/50';
    }
    if (lower.includes('teal')) {
      return 'bg-teal-100/40 border border-teal-200/50';
    }
    return 'bg-slate-100/50 border border-slate-200/50';
  };

  // ── Lista de cards da coluna ───────────────────────────────────────────────
  const KanbanColumnCards = ({ label, cards, color, type = 'status', onDropProp, isFirst = false }: {
    label: string; cards: any[]; color?: string; type?: 'status' | 'vendedor'; onDropProp?: (propId: string) => void; isFirst?: boolean;
  }) => {
    const resolvedHex = resolveColorToHex(color);
    const contrast = getContrastYIQ(resolvedHex);
    const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
    const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
    
    return (
      <div 
        className="w-[274px] flex flex-col h-full min-h-0"
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('opacity-80');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('opacity-80');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('opacity-80');
          const propId = e.dataTransfer.getData('text/plain');
          if (propId && onDropProp) onDropProp(propId);
        }}
      >
        <div
          className="w-full flex-1 flex flex-col px-[4px] py-3 rounded-b-2xl rounded-t-none min-h-0 overflow-y-auto"
          style={{
            width: '274px',
            minWidth: '274px',
            maxWidth: '274px',
            marginLeft: '0px',
            backgroundColor: bgRgba,
            borderColor: borderRgba,
            borderWidth: '0 1px 1px 1px',
            borderStyle: 'solid',
          }}
        >
          <div className="flex flex-col gap-3 flex-1">
            {cards.length === 0 ? (
              <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem propostas</p>
              </div>
            ) : (
              cards.map(prop => <ProposalCard key={prop.id} prop={prop} />)
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
      <Sidebar />

      <main className="flex-1 p-8 overflow-hidden h-screen flex flex-col bg-[#F8FAFC]">
        <div className="max-w-full mx-auto space-y-6 flex-1 flex flex-col min-h-0 w-full">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">FPV - Gestão de Formação de Preço de Vendas</h1>
              <p className="text-slate-500 text-sm mt-1">Engenharia de Custos e Controladoria de Facilities</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing flex-shrink-0">
              {/* Alternador de visualização */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1 flex-shrink-0">
                <button
                  onClick={() => handleViewModeChange('lista')}
                  title="Visualização em Lista"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'lista'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-status')}
                  title="Kanban por Status"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-status'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Por Status
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-vendedor')}
                  title="Kanban por Vendedor"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-vendedor'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <UserSquare2 size={14} /> Por Vendedor
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-segmento')}
                  title="Kanban por Segmento"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-segmento'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <Building size={14} /> Por Segmento
                </button>
              </div>

              <button
                onClick={() => router.push('/propostas/nova')}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Plus size={18} /> Nova FPV
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            {[
              { label: 'Propostas Ativas', value: activeCount.toString(), icon: FileText, color: 'text-blue-600' },
              { label: 'Volume Mensal', value: fmt(monthlyVolume), icon: TrendingUp, color: 'text-[#1B4D3E]' },
              { label: 'Clientes Base', value: clientsCount.toString(), icon: Users, color: 'text-indigo-600' },
              { label: 'Aguardando Revisão', value: revisionCount.toString().padStart(2, '0'), icon: Clock, color: 'text-orange-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-black text-slate-800 leading-none mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* BARRA DE BUSCA (sempre visível) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar proposta, cliente ou vendedor..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Filter size={13} />
              <span>{filteredProposals.length} proposta{filteredProposals.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* ── VISUALIZAÇÃO EM LISTA ─────────────────────────────────────────── */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden flex-1 flex flex-col min-h-0 w-full">
              <div className="p-4 border-b border-slate-300 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} /> Pipeline de Orçamentos
                  <span className="text-[10px] bg-white border border-slate-300 text-slate-500 px-2 py-0.5 rounded ml-2 font-bold">
                    Total: {proposals.length}
                  </span>
                </h2>
              </div>

              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3 w-1/5">ID / Proposta</th>
                      <th className="px-6 py-3 w-1/4">Cliente</th>
                      <th className="px-6 py-3">Responsável</th>
                      <th className="px-6 py-3 text-right">Valor Total</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Versão</th>
                      <th className="px-6 py-3 text-center w-[120px] min-w-[120px]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Carregando pipeline...</td></tr>
                    ) : filteredProposals.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td></tr>
                    ) : filteredProposals.map((prop) => (
                      <tr key={prop.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-slate-400" />
                            <div>
                              <p className="font-bold text-slate-800">{prop.numero}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-medium">{prop.data}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-semibold text-slate-700">{prop.cliente}</p>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            {prop.avatarUrl ? (
                              <img 
                                src={prop.avatarUrl} 
                                alt={prop.usuario} 
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                {(prop.usuario || '?').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </div>
                            )}
                            <span className="text-slate-600 font-medium">{prop.usuario}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.valor)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <select
                            value={prop.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              setProposals(proposals.map(p => p.id === prop.id ? { ...p, status: newStatus } : p));
                              await updatePropostaStatus(prop.id, newStatus);
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border outline-none cursor-pointer ${getStatusStyle(prop.status)}`}
                          >
                            {statuses.map(s => (
                              <option key={s.id} value={s.nome}>{s.nome}</option>
                            ))}
                            {!statuses.find(s => s.nome === prop.status) && (
                              <option value={prop.status}>{prop.status}</option>
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500">
                            <FileStack size={14} />
                            <span className="text-xs font-bold">v{prop.versao}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center w-[120px] min-w-[120px]">
                          <div className="flex items-center justify-center gap-2 relative flex-nowrap whitespace-nowrap">
                            <button
                              onClick={() => router.push(`/propostas/nova?id=${prop.id}`)}
                              className="text-amber-500 hover:text-amber-600 transition-colors p-1"
                              title="Editar Proposta"
                            >
                              <Edit2 size={16} />
                            </button>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Excluir a proposta ${prop.numero} de "${prop.cliente}"? Esta ação não pode ser desfeita.`)) return;
                                  setLoading(true);
                                  const res = await deleteProposta(prop.id);
                                  if (res.success) {
                                    loadData();
                                  } else {
                                    alert('Erro ao excluir: ' + res.error);
                                    setLoading(false);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                title="Excluir Proposta"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            <ActionMenu prop={prop} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reordenação de status baseada no localStorage */}
          {(() => {
            const orderedStatusCols = [...kanbanStatusCols];
            if (statusOrder.length > 0) {
              orderedStatusCols.sort((a, b) => {
                let idxA = statusOrder.indexOf(a.label);
                let idxB = statusOrder.indexOf(b.label);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
              });
            }

            const orderedVendedorCols = [...kanbanVendedorCols];
            if (vendedorOrder.length > 0) {
              orderedVendedorCols.sort((a, b) => {
                let idxA = vendedorOrder.indexOf(a.label);
                let idxB = vendedorOrder.indexOf(b.label);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
              });
            }

            return (
              <>
                {/* ── KANBAN POR STATUS ─────────────────────────────────────────────── */}
                {viewMode === 'kanban-status' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <LayoutGrid size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Status</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanStatusCols.length} coluna{kanbanStatusCols.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Carregando...</div>
                      </>
                    ) : (
                      <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                          <LayoutGrid size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Status</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanStatusCols.length} coluna{kanbanStatusCols.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Painel Kanban Unificado */}
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0 flex flex-col">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch flex-1">
                            {orderedStatusCols.map((col, idx) => {
                              const isFirst = idx === 0;
                              const isLast = idx === orderedStatusCols.length - 1;
                              return (
                                <div key={col.id} className="flex flex-col h-full">
                                  <KanbanColumnHeader
                                    key={col.id}
                                    label={col.label}
                                    color={col.color}
                                    cards={col.cards}
                                    total={col.total}
                                    statusId={col.id}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    onCreateStatus={handleCreateStatus}
                                    onColorChange={async (newColor) => {
                                      await updatePropostaStatusParam(col.id, col.label, newColor);
                                      setStatuses(prev => prev.map(s => s.id === col.id ? { ...s, color: newColor } : s));
                                    }}
                                    onRenameColumn={async (newName) => {
                                      await updatePropostaStatusParam(col.id, newName);
                                      setStatuses(prev => prev.map(s => s.id === col.id ? { ...s, nome: newName.toUpperCase().trim() } : s));
                                    }}
                                    onDragColumnStart={(e, l) => handleDragColumnStart(e, l, 'status')}
                                    onDragColumnEnd={handleDragColumnEnd}
                                    onDropColumn={(e, l) => handleDropColumn(e, l, 'status')}
                                  />
                                  <KanbanColumnCards
                                    key={col.id}
                                    label={col.label}
                                    color={col.color}
                                    type="status"
                                    cards={col.cards}
                                    isFirst={isFirst}
                                    onDropProp={async (propId) => {
                                      const prop = proposals.find(p => p.id === propId);
                                      if (prop && prop.status !== col.label) {
                                        setProposals(prev => prev.map(p => p.id === propId ? { ...p, status: col.label } : p));
                                        const res = await updatePropostaStatus(propId, col.label);
                                        if (!res.success) alert(res.error);
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* ── KANBAN POR VENDEDOR ───────────────────────────────────────────── */}
                {viewMode === 'kanban-vendedor' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <UserSquare2 size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Vendedor</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanVendedorCols.length} vendedor{kanbanVendedorCols.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Carregando...</div>
                      </>
                    ) : kanbanVendedorCols.length === 0 ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <UserSquare2 size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Vendedor</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanVendedorCols.length} vendedor{kanbanVendedorCols.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                          Nenhuma proposta encontrada.
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                          <UserSquare2 size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Vendedor</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanVendedorCols.length} vendedor{kanbanVendedorCols.length !== 1 ? 'es' : ''}
                          </span>
                        </div>

                        {/* Painel Kanban Unificado */}
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0 flex flex-col">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch flex-1">
                            {orderedVendedorCols.map((col, idx) => {
                              const vColor = vendedorColors[col.label] || 'emerald';
                              const isFirst = idx === 0;
                              const isLast = idx === orderedVendedorCols.length - 1;
                              return (
                                <div key={col.id} className="flex flex-col h-full">
                                  <KanbanColumnHeader
                                    key={col.id}
                                    label={col.label}
                                    type="vendedor"
                                    color={vColor}
                                    cards={col.cards}
                                    total={col.total}
                                    statusId={col.id}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    onColorChange={async (newColor) => {
                                      localStorage.setItem(`kanban-vendedor-color-${col.label}`, newColor);
                                      setVendedorColors(prev => ({ ...prev, [col.label]: newColor }));
                                    }}
                                    onDragColumnStart={(e, l) => handleDragColumnStart(e, l, 'vendedor')}
                                    onDragColumnEnd={handleDragColumnEnd}
                                    onDropColumn={(e, l) => handleDropColumn(e, l, 'vendedor')}
                                  />
                                  <KanbanColumnCards
                                    key={col.id}
                                    label={col.label}
                                    type="vendedor"
                                    color={vColor}
                                    cards={col.cards}
                                    isFirst={isFirst}
                                    onDropProp={async (propId) => {
                                      const prop = proposals.find(p => p.id === propId);
                                      if (prop && prop.usuario !== col.label) {
                                        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
                                          alert('Apenas gestores e administradores podem transferir propostas.');
                                          return;
                                        }
                                        const newUser = usersList.find(u => u.nome === col.label);
                                        if (newUser) {
                                          setProposals(prev => prev.map(p => p.id === propId ? { ...p, usuario: newUser.nome } : p));
                                          const res = await transferirProposta(propId, newUser.id);
                                          if (!res.success) alert(res.error);
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* ── KANBAN POR SEGMENTO ───────────────────────────────────────────── */}
                {viewMode === 'kanban-segmento' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Building size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Segmento</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanSegmentoCols.length} segmento{kanbanSegmentoCols.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Carregando...</div>
                      </>
                    ) : kanbanSegmentoCols.length === 0 ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Building size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Segmento</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanSegmentoCols.length} segmento{kanbanSegmentoCols.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
                          Nenhum segmento configurado.
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                          <Building size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Segmento</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanSegmentoCols.length} segmento{kanbanSegmentoCols.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Painel Kanban Unificado */}
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0 flex flex-col">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch flex-1">
                            {kanbanSegmentoCols.map((col, idx) => {
                              const segColor = segmentoColors[col.label] || '#3b82f6';
                              const isFirst = idx === 0;
                              const isLast = idx === kanbanSegmentoCols.length - 1;
                              return (
                                <div key={col.id} className="flex flex-col h-full">
                                  <KanbanColumnHeader
                                    key={col.id}
                                    label={col.label}
                                    type="segmento"
                                    color={segColor}
                                    cards={col.cards}
                                    total={col.total}
                                    statusId={col.id}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    onColorChange={async (newColor) => {
                                      localStorage.setItem(`kanban-segmento-color-${col.label}`, newColor);
                                      setSegmentoColors(prev => ({ ...prev, [col.label]: newColor }));
                                    }}
                                  />
                                  <KanbanColumnCards
                                    key={col.id}
                                    label={col.label}
                                    type="vendedor"
                                    color={segColor}
                                    cards={col.cards}
                                    isFirst={isFirst}
                                    onDropProp={async (propId) => {
                                      const prop = proposals.find(p => p.id === propId);
                                      if (prop) {
                                        const newSegment = col.id === 'unassigned' ? '' : col.label;
                                        if (prop.segmento !== newSegment) {
                                          // Update local state optimistically
                                          setProposals(prev => prev.map(p => p.id === propId ? { ...p, segmento: newSegment || 'Sem Segmento' } : p));
                                          
                                          // Update client segment in backend
                                          if (prop.clientId) {
                                            const res = await updateCliente(prop.clientId, { segmento: newSegment });
                                            if (!res.success) {
                                              alert(res.error || 'Erro ao atualizar o segmento do cliente');
                                              loadData();
                                            }
                                          } else {
                                            alert('Esta proposta não tem um cliente associado no banco de dados para salvar o segmento.');
                                          }
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

        </div>
      </main>

      {/* MODAL DE EQUIPE */}
      {teamModal.isOpen && teamModal.prop && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4" onClick={() => setTeamModal({ isOpen: false, prop: null })}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-[#1B4D3E]" /> Equipe da Proposta
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Gerencie os responsáveis e membros da proposta</p>
              </div>
              <button onClick={() => setTeamModal({ isOpen: false, prop: null })} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full shadow-sm">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Responsável */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</label>
                <div 
                  id="team-modal-owner-anchor"
                  onClick={(e) => {
                    setOwnerAnchorEl(e.currentTarget);
                    setIsOwnerPopoverOpen(true);
                  }}
                  className="flex items-center gap-2.5 p-2 border border-slate-200/80 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-150 group"
                >
                  {(() => {
                    const assignedUser = usersList.find(u => u.id === teamModal.prop.userId);
                    if (assignedUser?.avatarUrl) {
                      return (
                        <img 
                          src={assignedUser.avatarUrl} 
                          alt={assignedUser.nome} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      );
                    } else if (assignedUser) {
                      const initials = assignedUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/20 flex items-center justify-center text-xs font-black shrink-0 uppercase">
                          {initials}
                        </div>
                      );
                    }
                    return (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 shrink-0">
                        👤
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {usersList.find(u => u.id === teamModal.prop.userId)?.nome || 'Sem responsável'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">Clique para alterar</p>
                  </div>
                </div>
              </div>

              {/* Participantes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participantes</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teamModal.prop.shares?.filter((s: any) => s.role !== 'OBSERVADOR').map((s: any) => {
                    const u = s.user;
                    if (!u) return null;
                    const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <div key={s.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 pl-1.5 pr-1 py-1 rounded-lg">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.nome} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 uppercase">
                            {initials}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-slate-700 max-w-[100px] truncate">{u.nome}</span>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleRemovePropostaShare(teamModal.prop.id, u.id);
                          }} 
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    id="team-modal-participant-anchor"
                    onClick={(e) => {
                      setParticipantAnchorEl(e.currentTarget);
                      setIsParticipantPopoverOpen(true);
                    }}
                    className="text-[#1B4D3E] hover:text-[#1B4D3E]/80 text-[11px] font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#1B4D3E]/5 transition-all duration-150"
                  >
                    + Inserir participante
                  </button>
                </div>
              </div>

              {/* Observadores */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observadores</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teamModal.prop.shares?.filter((s: any) => s.role === 'OBSERVADOR').map((s: any) => {
                    const u = s.user;
                    if (!u) return null;
                    const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <div key={s.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 pl-1.5 pr-1 py-1 rounded-lg">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.nome} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 uppercase">
                            {initials}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-slate-700 max-w-[100px] truncate">{u.nome}</span>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleRemovePropostaShare(teamModal.prop.id, u.id);
                          }} 
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    id="team-modal-observer-anchor"
                    onClick={(e) => {
                      setObserverAnchorEl(e.currentTarget);
                      setIsObserverPopoverOpen(true);
                    }}
                    className="text-[#1B4D3E] hover:text-[#1B4D3E]/80 text-[11px] font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#1B4D3E]/5 transition-all duration-150"
                  >
                    + Colocar observador
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popover Inline para Alteração de Responsável no Card */}
      <UserSelectPopover
        isOpen={inlineOwnerPropId !== null}
        onClose={() => setInlineOwnerPropId(null)}
        users={usersList}
        selectedIds={
          inlineOwnerPropId
            ? [proposals.find(p => p.id === inlineOwnerPropId)?.userId || '']
            : []
        }
        onSelect={handleInlinePropostaOwnerSelect}
        title="Pesquisar responsável..."
        anchorEl={
          inlineOwnerPropId
            ? `avatar-inline-owner-${inlineOwnerPropId}`
            : null
        }
        isMulti={false}
      />

      {/* Popovers para o Modal de Equipe */}
      {teamModal.isOpen && teamModal.prop && (
        <>
          <UserSelectPopover
            isOpen={isOwnerPopoverOpen}
            onClose={() => setIsOwnerPopoverOpen(false)}
            users={usersList}
            selectedIds={teamModal.prop.userId ? [teamModal.prop.userId] : []}
            onSelect={(userId) => handlePropostaOwnerChange(teamModal.prop.id, userId)}
            title="Pesquisar responsável..."
            anchorEl={isOwnerPopoverOpen ? 'team-modal-owner-anchor' : null}
            isMulti={false}
          />

          <UserSelectPopover
            isOpen={isParticipantPopoverOpen}
            onClose={() => setIsParticipantPopoverOpen(false)}
            users={usersList}
            selectedIds={teamModal.prop.shares?.filter((s: any) => s.role !== 'OBSERVADOR').map((s: any) => s.user?.id) || []}
            onSelect={handleTogglePropostaParticipant}
            title="Pesquisar participante..."
            anchorEl={isParticipantPopoverOpen ? 'team-modal-participant-anchor' : null}
            isMulti={true}
          />

          <UserSelectPopover
            isOpen={isObserverPopoverOpen}
            onClose={() => setIsObserverPopoverOpen(false)}
            users={usersList}
            selectedIds={teamModal.prop.shares?.filter((s: any) => s.role === 'OBSERVADOR').map((s: any) => s.user?.id) || []}
            onSelect={handleTogglePropostaObserver}
            title="Pesquisar observador..."
            anchorEl={isObserverPopoverOpen ? 'team-modal-observer-anchor' : null}
            isMulti={true}
          />
        </>
      )}

      {/* MODAL DE AUDITORIA */}
      {auditModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History size={20} className="text-[#1B4D3E]" /> Linha do Tempo / Auditoria
              </h2>
              <button onClick={() => setAuditModal({ isOpen: false, propId: null, logs: [] })} className="text-amber-500 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {auditModal.logs.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">Nenhum registro encontrado para esta proposta.</p>
              ) : (
                <div className="relative border-l border-slate-200 ml-4 space-y-6">
                  {auditModal.logs.map((log: any) => {
                    let Icon = FileText;
                    let color = 'bg-blue-100 text-blue-600';
                    let desc = '';

                    switch(log.action) {
                      case 'CREATE': 
                        Icon = Plus; color = 'bg-emerald-100 text-emerald-600'; desc = 'Criou a proposta'; break;
                      case 'VERSION_SAVE': 
                        Icon = FileStack; color = 'bg-purple-100 text-purple-600'; desc = `Salvou nova versão (v${log.details?.versao})`; break;
                      case 'VERSION_UPDATE': 
                        Icon = Edit2; color = 'bg-amber-100 text-amber-600'; desc = `Atualizou a versão (v${log.details?.versao})`; break;
                      case 'STATUS_CHANGE': 
                        Icon = LayoutGrid; color = 'bg-indigo-100 text-indigo-600'; desc = `Alterou status para "${log.details?.newStatus}"`; break;
                      case 'TRANSFER': 
                        Icon = ArrowRightLeft; color = 'bg-orange-100 text-orange-600'; desc = `Transferiu a proposta para ${log.details?.toUserName}`; break;
                      case 'SHARE': 
                        Icon = Share2; color = 'bg-pink-100 text-pink-600'; desc = `Compartilhou com ${log.details?.sharedWithUserName}`; break;
                    }

                    return (
                      <div key={log.id} className="relative pl-6">
                        <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${color}`}>
                          <Icon size={12} />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-slate-800">{log.user?.nome}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-slate-600">{desc}</p>
                          {log.details?.changelog && (
                            <div className="mt-2 text-[10px] bg-white p-2 rounded border border-slate-200 text-slate-500 italic">
                              "{log.details.changelog}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button onClick={() => setAuditModal({ isOpen: false, propId: null, logs: [] })} className="px-5 py-2 text-sm font-bold bg-[#1B4D3E] text-white rounded-lg hover:bg-[#13382d]">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {customModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 p-6 flex flex-col gap-4 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {customModal.title}
              </h3>
              <button
                onClick={() => {
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                  if (customModal.onCancel) customModal.onCancel();
                }}
                className="text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {customModal.type === 'prompt' && (
              <input
                type="text"
                id="custom-modal-input"
                defaultValue={customModal.defaultValue || ''}
                placeholder={customModal.placeholder || ''}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                    customModal.onConfirm(input?.value || '');
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
            
            {customModal.type !== 'prompt' && (
              <p className="text-xs text-slate-650 leading-relaxed font-medium">
                {customModal.message}
              </p>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              {customModal.type !== 'alert' && (
                <button
                  onClick={() => {
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                    if (customModal.onCancel) customModal.onCancel();
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
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
                className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
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

export default function Page() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setIsLoggedIn(true);
          if (data.email === 'admin@smartbidhub.com.br') {
            router.push('/admin/empresas');
          }
        } else {
          setIsLoggedIn(false);
          router.push('/login');
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        router.push('/login');
      });
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[400px] h-[400px] bg-gradient-to-r from-[#1B4D3E] to-[#10B981] rounded-full blur-[100px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#1B4D3E]/30 rounded-2xl border border-[#10B981]/30 flex items-center justify-center animate-spin">
            <TrendingUp className="text-[#10B981]" size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#10B981] animate-pulse">Carregando SmartBidHub...</span>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <ProposalsDashboard />;
  }

  return null;
}
