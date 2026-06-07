'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  LayoutList, LayoutGrid, UserSquare2,
  Edit2, Trash2, ArrowRightLeft, X, Building2, Tag, Presentation, Printer, Share2, Eye, Palette, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { transferirProposta, updateDocumentoStatusParam, createDocumentoStatus } from '@/app/propostas/actions';
import ClientLinkModal from '@/components/ClientLinkModal';
import ClientTrackingModal from '@/components/ClientTrackingModal';
import { getSegmentos } from '@/app/admin/settings/actions';
import { updateCliente } from '@/app/clientes/actions';
import { Building } from 'lucide-react';
import { 
  createDocumentoProposta, 
  updateDocumentoStatus, 
  deleteDocumentoProposta,
  getPropostasComerciaisPageData,
  getCreateProposalModalData
} from './actions';

type ViewMode = 'lista' | 'kanban-status' | 'kanban-vendedor' | 'kanban-segmento';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function PropostasComerciaisDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  useEffect(() => {
    const saved = localStorage.getItem('orse_proposta_view_mode');
    if (saved) setViewMode(saved as any);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_proposta_view_mode', mode);
  };
  const [activeShareDoc, setActiveShareDoc] = useState<any | null>(null);
  const [activeTrackingDoc, setActiveTrackingDoc] = useState<any | null>(null);

  // Dados para modal de criação
  const [fpvs, setFpvs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<string>('USER');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const [createModal, setCreateModal] = useState({
    isOpen: false,
    fpvId: '',
    templateId: '',
    empresaId: '',
    saving: false
  });

  const [statuses, setStatuses] = useState<any[]>([]);
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
        localStorage.setItem('proposta-status-order', JSON.stringify(newOrder));
      }
    } else {
      const currentCols = Array.from(new Set(docs.map(d => d.usuario || 'Sem Vendedor')));
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
        localStorage.setItem('proposta-vendedor-order', JSON.stringify(newOrder));
      }
    }
  };

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
        const res = await createDocumentoStatus(trimmed);
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
          localStorage.setItem('proposta-status-order', JSON.stringify(order));
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
      getPropostasComerciaisPageData(),
      getSegmentos()
    ]);
    const { docs, role, usersList, statuses } = pageData;
    setDocs(docs);
    setUserRole(role);
    setUsersList(usersList);
    setStatuses(statuses || []);
    if (segmentosRes && segmentosRes.success) {
      setSegmentos(segmentosRes.segmentos);
    } else if (Array.isArray(segmentosRes)) {
      setSegmentos(segmentosRes);
    }
    setLoading(false);
  };

  const handleOpenCreateModal = async () => {
    setCreateModal({ isOpen: true, fpvId: '', templateId: '', empresaId: '', saving: false });
    if (fpvs.length === 0 || templates.length === 0 || empresas.length === 0) {
      setLoadingModalData(true);
      try {
        const res = await getCreateProposalModalData();
        setFpvs(res.proposals || []);
        setTemplates(res.templates || []);
        setEmpresas(res.empresas || []);
      } catch (err) {
        console.error('Erro ao buscar dados do modal:', err);
      } finally {
        setLoadingModalData(false);
      }
    }
  };

  useEffect(() => { loadData(); }, []);

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
      const storedStatusOrder = localStorage.getItem('proposta-status-order');
      if (storedStatusOrder) {
        try {
          setStatusOrder(JSON.parse(storedStatusOrder));
        } catch (e) {
          console.error(e);
        }
      }
      const storedVendedorOrder = localStorage.getItem('proposta-vendedor-order');
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
    if (!statusNome) return 'bg-slate-100 text-slate-600';
    const found = statuses.find(s => s.nome.toLowerCase() === statusNome.toLowerCase());
    if (found) {
      const hStyle = getHighlightedColorClass(found.color || '');
      return `${hStyle.bg} ${hStyle.text} border ${hStyle.border}`;
    }
    return 'bg-slate-100 text-slate-600';
  };

  const filteredDocs = docs.filter(d =>
    String(d.numeroFPV).includes(searchTerm.toLowerCase()) ||
    d.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.usuario || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Dados para Kanban por Status ────────────────────────────────────────────
  const kanbanStatusCols = statuses.map(s => {
    const cards = filteredDocs.filter(d => d.status.toLowerCase() === s.nome.toLowerCase());
    return {
      id: s.id,
      label: s.nome,
      color: s.color,
      cards,
      total: cards.reduce((a, c) => a + (c.valor || 0), 0),
    };
  });

  // ── Dados para Kanban por Vendedor ──────────────────────────────────────────
  const vendedoresMap = new Map<string, any[]>();
  filteredDocs.forEach(d => {
    const v = d.usuario || 'Sem Vendedor';
    if (!vendedoresMap.has(v)) vendedoresMap.set(v, []);
    vendedoresMap.get(v)!.push(d);
  });
  const kanbanVendedorCols = Array.from(vendedoresMap.entries()).map(([nome, cards]) => ({
    id: nome,
    label: nome,
    cards,
    total: cards.reduce((a, c) => a + (c.valor || 0), 0),
  }));

  // ── Dados para Kanban por Segmento ──────────────────────────────────────────
  const kanbanSegmentoCols = React.useMemo(() => {
    const cols: { id: string; label: string; cards: any[]; total: number }[] = [];

    // Columns for each segment
    segmentos.forEach(seg => {
      const segName = seg.nome || seg;
      const segDocs = filteredDocs.filter(d => d.segmento === segName);
      cols.push({
        id: seg.id || segName,
        label: segName,
        cards: segDocs,
        total: segDocs.reduce((acc, d) => acc + (d.valor || 0), 0)
      });
    });

    return cols;
  }, [filteredDocs, segmentos]);

  const ProposalCard = ({ doc }: { doc: any }) => (
    <div
      draggable
      onDragStart={(e) => {
        if (doc.propostaId) {
          e.dataTransfer.setData('text/plain', doc.propostaId);
        }
      }}
      onClick={() => router.push(`/propostas-comerciais/${doc.id}`)}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer group cursor-grab active:cursor-grabbing text-left"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1B4D3E]/8 rounded-lg">
            <FileText size={13} className="text-[#1B4D3E]" />
          </div>
          <span className="text-xs font-black text-slate-700 tracking-wide">
            {fmtRef(doc.numeroFPV, doc.versaoFPV || 1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-mono text-[9px] font-bold">
          <span>v{doc.versaoFPV || 1}</span>
        </div>
      </div>

      <p className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{doc.cliente}</p>
      <p className="text-[10px] text-slate-400 font-medium mb-3">📅 {doc.data}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#1B4D3E]">{fmt(doc.valor)}</span>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getStatusStyle(doc.status)}`}>
          {doc.status || '—'}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {doc.avatarUrl ? (
            <img 
              src={doc.avatarUrl} 
              alt={doc.usuario} 
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
              {(doc.usuario || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
          )}
          <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">{doc.usuario || 'Sistema'}</span>
        </div>
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

    const contrast = getContrastYIQ(resolvedHex);
    const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
    const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
    const textHex = getDarkenedHexForText(resolvedHex);

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
          className="w-full h-16 relative group/title pointer-events-auto"
        >
          {/* Background SVG Custom Shape */}
          <svg 
            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
            viewBox={isLast ? "0 0 274 64" : "0 0 282 64"}
            preserveAspectRatio="none"
            style={{
              color: resolvedHex,
            }}
          >
            <path 
              d={isFirst 
                ? "M 8,0 L 274,0 L 282,32 L 274,64 L 0,64 L 0,8 A 8,8 0 0,1 8,0 Z" 
                : isLast 
                  ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,64 L 0,64 L 8,32 L 0,0 Z"
                  : "M 0,0 L 274,0 L 282,32 L 274,64 L 0,64 L 8,32 L 0,0 Z"
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
            <div className="flex flex-col justify-center min-w-0 flex-1">
              {isStatus ? (
                <span className="text-sm font-black uppercase tracking-wider truncate max-w-[160px]">
                  {label}
                </span>
              ) : isSegmento ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Building size={14} className="shrink-0" style={{ color: textHex }} />
                  <span className="text-sm font-black uppercase tracking-wider truncate">
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
                  <span className="text-sm font-black uppercase tracking-wider truncate">
                    {label}
                  </span>
                </div>
              )}
              
              {/* Subtítulo integrado com o totalizador de volume e negócios */}
              <span className="text-base font-black mt-1 opacity-95 truncate select-none">
                {fmt(total)} • {cards.length} {cards.length === 1 ? 'negócio' : 'negócios'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {isStatus && onCreateStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateStatus(label);
                  }}
                  className="p-1.5 rounded-full transition-all duration-150 opacity-0 group-hover/title:opacity-100 flex items-center justify-center cursor-pointer hover:bg-black/5"
                  style={{ color: 'inherit' }}
                  title="Criar Nova Etapa"
                  type="button"
                >
                  <Plus size={16} />
                </button>
              )}

              {onColorChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditPopover(!showEditPopover);
                  }}
                  className="p-1.5 rounded-full transition-all duration-150 opacity-0 group-hover/title:opacity-100 flex items-center justify-center cursor-pointer hover:bg-black/5"
                  style={{ color: 'inherit' }}
                  title="Editar Coluna"
                  type="button"
                >
                  <Edit2 size={16} />
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

  const KanbanColumnCards = ({ label, cards, color, type = 'status', onDropProp, isFirst = false }: {
    label: string; cards: any[]; color?: string; type?: 'status' | 'vendedor' | 'segmento'; onDropProp?: (propId: string) => void; isFirst?: boolean;
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
              cards.map(doc => <ProposalCard key={doc.id} doc={doc} />)
            )}
          </div>
        </div>
      </div>
    );
  };

  const fmtRef = (num: number, versao: number) =>
    `FPV-${String(num).padStart(3, '0')}-REV-${String(versao).padStart(2, '0')}`;

  const activeCount = docs.length;
  const approvedCount = docs.filter(d => d.status === 'Aprovada').length;
  const totalValue = docs.reduce((acc, d) => acc + (d.valor || 0), 0);

  const handleCreate = async () => {
    if (!createModal.fpvId || !createModal.templateId || !createModal.empresaId) {
      alert('Preencha todos os campos para gerar a proposta comercial.');
      return;
    }
    setCreateModal(prev => ({ ...prev, saving: true }));
    const res = await createDocumentoProposta(createModal.fpvId, createModal.templateId, createModal.empresaId);
    if (res.success && res.docId) {
      router.push(`/propostas-comerciais/${res.docId}`);
    } else {
      alert('Erro: ' + res.error);
      setCreateModal(prev => ({ ...prev, saving: false }));
    }
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
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <Presentation size={24} /> Propostas Comerciais
              </h1>
              <p className="text-slate-500 text-sm mt-1">Gerador de documentos comerciais em PDF</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing flex-shrink-0">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1 flex-shrink-0">
                <button
                  onClick={() => handleViewModeChange('lista')}
                  title="Visualização em Lista"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-status')}
                  title="Kanban por Status"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-status' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Por Status
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-vendedor')}
                  title="Kanban por Vendedor"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-vendedor' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <UserSquare2 size={14} /> Por Vendedor
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-segmento')}
                  title="Kanban por Segmento"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    viewMode === 'kanban-segmento' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <Building size={14} /> Por Segmento
                </button>
              </div>

              <button
                onClick={() => router.push('/propostas-comerciais/templates')}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded text-sm flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
              >
                <FileText size={16} /> Templates
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Plus size={18} /> Nova Proposta
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            {[
              { label: 'Propostas Geradas', value: activeCount.toString(), icon: Presentation, color: 'text-blue-600' },
              { label: 'Volume Negociado', value: fmt(totalValue), icon: FileText, color: 'text-[#1B4D3E]' },
              { label: 'Aprovadas', value: approvedCount.toString(), icon: Building2, color: 'text-indigo-600' },
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

          {/* BARRA DE BUSCA */}
          <div className="relative max-w-sm shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID FPV..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden flex-1 flex flex-col min-h-0 w-full">
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                  <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-2.5 py-3 lg:px-4">FPV Referência</th>
                    <th className="px-2.5 py-3 lg:px-4">Cliente</th>
                    <th className="px-2.5 py-3 lg:px-4">Empresa Emissora</th>
                    <th className="px-2.5 py-3 lg:px-4">Criado Por</th>
                    <th className="px-2.5 py-3 lg:px-4">Data/Hora</th>
                    <th className="px-2.5 py-3 lg:px-4 text-right">Valor Total</th>
                    <th className="px-2.5 py-3 lg:px-4 text-center">Status</th>
                    <th className="px-2.5 py-3 lg:px-4 text-center w-[170px] min-w-[170px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td></tr>
                  ) : filteredDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-2.5 py-3 lg:px-4">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400" />
                          <span className="font-mono font-bold text-slate-800 text-xs">{fmtRef(doc.numeroFPV, doc.versaoFPV || 1)}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 lg:px-4 font-semibold text-slate-700 max-w-[140px] truncate" title={doc.cliente}>{doc.cliente}</td>
                      <td className="px-2.5 py-3 lg:px-4 text-slate-500 max-w-[130px] truncate" title={doc.empresa}>{doc.empresa}</td>
                      <td className="px-2.5 py-3 lg:px-4">
                        <div className="flex items-center gap-1.5">
                          {doc.avatarUrl ? (
                            <img 
                              src={doc.avatarUrl} 
                              alt={doc.usuario} 
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                              {(doc.usuario || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                          )}
                          <span className="text-slate-600 font-medium max-w-[110px] truncate" title={doc.usuario || 'Sistema'}>{doc.usuario || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 lg:px-4 text-slate-500 font-mono text-xs">{doc.data}</td>
                      <td className="px-2.5 py-3 lg:px-4 font-bold text-[#1B4D3E] text-right">{fmt(doc.valor)}</td>
                      <td className="px-2.5 py-3 lg:px-4 text-center">
                        <select
                          value={doc.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            setDocs(docs.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
                            await updateDocumentoStatus(doc.id, newStatus);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border outline-none cursor-pointer ${getStatusStyle(doc.status)}`}
                        >
                          {statuses.map(s => <option key={s.nome} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-2.5 py-3 lg:px-4 text-center w-[170px] min-w-[170px]">
                        <div className="flex justify-center gap-2 flex-nowrap whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/propostas-comerciais/${doc.id}`)}
                            title="Editar proposta"
                            className="text-amber-500 hover:text-amber-600 p-1 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => window.open(`/propostas-comerciais/${doc.id}/print`, '_blank')}
                            title="Gerar PDF"
                            className="text-slate-500 hover:text-[#1B4D3E] p-1 transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                           <button
                             onClick={() => setActiveTrackingDoc(doc)}
                             title="Ver Relatório de Acesso do Cliente"
                             className="text-indigo-500 hover:text-indigo-700 p-1 transition-colors relative cursor-pointer"
                           >
                             <Eye size={16} />
                             {doc.configApresentacao?.viewTracking?.history?.length > 0 && (
                               <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                             )}
                           </button>
                           <button
                             onClick={() => setActiveShareDoc(doc)}
                             title="Configurar e Copiar Link"
                             className="text-green-500 hover:text-green-700 p-1 transition-colors cursor-pointer"
                           >
                             <Share2 size={16} />
                           </button>
                          <button onClick={async () => {
                            if(confirm('Excluir proposta comercial?')) {
                              await deleteDocumentoProposta(doc.id);
                              loadData();
                            }
                          }}
                          title="Excluir proposta"
                          className="text-red-400 hover:text-red-600 p-1 transition-colors">
                            <Trash2 size={16} />
                          </button>
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
                {/* ── KANBAN POR STATUS ───────────────────────────────────────────── */}
                {viewMode === 'kanban-status' && (
                  <div>
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <LayoutGrid size={16} className="text-[#1B4D3E]" />
                          <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Status</h2>
                          <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                            {kanbanStatusCols.length} status
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
                            {kanbanStatusCols.length} status
                          </span>
                        </div>

                        {/* Painel Kanban Unificado */}
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch h-full">
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
                                      await updateDocumentoStatusParam(col.id, col.label, newColor);
                                      setStatuses(prev => prev.map(s => s.id === col.id ? { ...s, color: newColor } : s));
                                    }}
                                    onRenameColumn={async (newName) => {
                                      await updateDocumentoStatusParam(col.id, newName);
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
                                      const doc = docs.find(d => d.propostaId === propId);
                                      if (doc && doc.status !== col.label) {
                                        setDocs(prev => prev.map(d => d.propostaId === propId ? { ...d, status: col.label } : d));
                                        await updateDocumentoStatus(doc.id, col.label);
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
                    <div>
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
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch h-full">
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
                                      const doc = docs.find(d => d.propostaId === propId);
                                      if (doc && doc.usuario !== col.label) {
                                        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
                                          alert('Apenas gestores e administradores podem transferir propostas.');
                                          return;
                                        }
                                        const newUser = usersList.find(u => u.nome === col.label);
                                        if (newUser) {
                                          setDocs(prev => prev.map(d => d.propostaId === propId ? { ...d, usuario: newUser.nome, avatarUrl: newUser.avatarUrl } : d));
                                          const res = await transferirProposta(propId, newUser.id);
                                          if (!res.success) {
                                            alert(res.error);
                                            loadData();
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

                  {/* ── KANBAN POR SEGMENTO ───────────────────────────────────────────── */}
                  {viewMode === 'kanban-segmento' && (
                    <div>
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
                        <div className="flex-1 min-h-0 overflow-x-auto pb-4 pt-0">
                          <div className="flex gap-[3px] min-w-max pt-0 mt-0 items-stretch h-full">
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
                                      const doc = docs.find(d => d.propostaId === propId || d.id === propId);
                                      if (doc) {
                                        const newSegment = col.id === 'unassigned' ? '' : col.label;
                                        if (doc.segmento !== newSegment) {
                                          // Update local state optimistically
                                          setDocs(prev => prev.map(d => (d.propostaId === propId || d.id === propId) ? { ...d, segmento: newSegment || 'Sem Segmento' } : d));
                                          
                                          // Update client segment in backend
                                          if (doc.clientId) {
                                            const res = await updateCliente(doc.clientId, { segmento: newSegment });
                                            if (!res.success) {
                                              alert(res.error || 'Erro ao atualizar o segmento do cliente');
                                              loadData();
                                            }
                                          } else {
                                            alert('Esta proposta comercial não tem um cliente cadastrado no banco de dados para salvar o segmento.');
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

      {/* MODAL CRIAR */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Presentation size={20} className="text-[#1B4D3E]" /> Gerar Proposta
              </h2>
              <button onClick={() => setCreateModal({ ...createModal, isOpen: false })} className="text-amber-500 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {loadingModalData ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
                  <Loader2 className="animate-spin text-[#1B4D3E]" size={32} />
                  <span className="text-sm font-bold">Carregando dados...</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vincular a qual FPV?</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                      value={createModal.fpvId}
                      onChange={e => setCreateModal({...createModal, fpvId: e.target.value})}
                    >
                      <option value="">-- Selecione uma FPV --</option>
                      {fpvs.map(f => (
                        <option key={f.id} value={f.id}>
                          #{f.numero}-R{String(f.versao || 1).padStart(2, '0')} - {f.cliente} ({fmt(f.valor)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Template Base</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                      value={createModal.templateId}
                      onChange={e => setCreateModal({...createModal, templateId: e.target.value})}
                    >
                      <option value="">-- Selecione o Template --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome} {t.tipo === 'SLIDE_DECK' ? '(Apresentação)' : '(A4)'}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Empresa do Grupo (Emissora)</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                      value={createModal.empresaId}
                      onChange={e => setCreateModal({...createModal, empresaId: e.target.value})}
                    >
                      <option value="">-- Selecione a Empresa --</option>
                      {empresas.map(e => (
                        <option key={e.id} value={e.id}>{e.nomeFantasia}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3 justify-end">
                    <button onClick={() => setCreateModal({...createModal, isOpen: false})} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button 
                      onClick={handleCreate}
                      disabled={createModal.saving}
                      className="px-4 py-2 text-sm font-bold bg-[#1B4D3E] text-white rounded-lg hover:bg-[#13382d] disabled:opacity-50"
                    >
                      {createModal.saving ? 'Gerando...' : 'Gerar e Editar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {activeShareDoc && (
        <ClientLinkModal 
          documentoId={activeShareDoc.id}
          configApresentacao={activeShareDoc.configApresentacao}
          onClose={() => setActiveShareDoc(null)}
          onSaveSuccess={(newConfig) => {
            setDocs(docs.map(d => d.id === activeShareDoc.id ? { ...d, configApresentacao: newConfig } : d));
          }}
        />
      )}
      {activeTrackingDoc && (
        <ClientTrackingModal 
          doc={activeTrackingDoc}
          onClose={() => setActiveTrackingDoc(null)}
          onRefresh={async () => {
            const dataDocs = await getDocumentosProposta();
            setDocs(dataDocs);
            const updated = dataDocs.find(d => d.id === activeTrackingDoc.id);
            if (updated) {
              setActiveTrackingDoc(updated);
            }
          }}
        />
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
              <p className="text-xs text-slate-655 leading-relaxed font-medium">
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
