'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  Users, TrendingUp, Clock,
  LayoutList, LayoutGrid, AlertCircle, Edit2, CheckCircle, Calendar, DollarSign, Trash2, Printer, Building, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getContratos, updateContratoStatus, deleteContrato, renameContratoStatus } from './actions';
import { getSegmentos } from '@/app/admin/settings/actions';
import { updateCliente } from '@/app/clientes/actions';

type ViewMode = 'lista' | 'kanban-status' | 'kanban-segmento';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const gerarNumeroContrato = (c: any) => {
  if (!c || !c.proposta) return 'S/N';
  const numProp = c.proposta.numero?.toString().padStart(3, '0') || '000';
  const numRev = (c.proposta.versoes?.[0]?.versao || 1).toString().padStart(2, '0');
  const d = c.dataInicio ? new Date(c.dataInicio) : new Date(c.createdAt || Date.now());
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const y = d.getFullYear().toString();
  return `${numProp}.${numRev}.${m}.${y}`;
};

const renderVencimento = (dataInicio: any, vigenciaMeses: any) => {
  if (!dataInicio || !vigenciaMeses) return <span className="text-slate-400">-</span>;
  const d = new Date(dataInicio);
  
  // Extrai em UTC para evitar que 00:00Z vire 21:00 do dia anterior no BRT
  const dRef = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + vigenciaMeses, d.getUTCDate()));
  
  // Pega o 'hoje' na perspectiva local e joga para UTC meia-noite
  const hoje = new Date();
  const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  
  const diasParaVencer = Math.round((dRef.getTime() - hojeUTC.getTime()) / (1000 * 3600 * 24));
  
  // Mostra a string formatada forçando timezone UTC para manter o dia correto
  const dataStr = dRef.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  
  let colorClass = "bg-emerald-500";
  let title = "Contrato no prazo";
  
  if (diasParaVencer < 0) {
    colorClass = "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    title = `Vencido há ${Math.abs(diasParaVencer)} dias`;
  } else if (diasParaVencer <= 45) {
    colorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]";
    title = `Vence em ${diasParaVencer} dias`;
  }

  return (
    <div className="flex items-center justify-center gap-2" title={title}>
      <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></div>
      <span className="font-bold">{dataStr}</span>
    </div>
  );
};

export default function ContratosDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [segmentoColors, setSegmentoColors] = useState<Record<string, string>>({});
  const [editingSegmentoId, setEditingSegmentoId] = useState<string | null>(null);
  const [segmentos, setSegmentos] = useState<any[]>([]);

  const [statusesList, setStatusesList] = useState<string[]>(['Pendente de Assinatura', 'Vigente', 'Reajuste Pendente', 'Encerrado']);
  const [statusColors, setStatusColors] = useState<Record<string, string>>({
    'Pendente de Assinatura': '#f59e0b',
    'Vigente': '#10b981',
    'Reajuste Pendente': '#f97316',
    'Encerrado': '#64748b',
  });
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

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



  const handleCreateStatus = (insertAfterStatus: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Novo Status/Etapa',
      placeholder: 'Nome do novo status/etapa (ex: Assinado)',
      type: 'prompt',
      onConfirm: (name) => {
        if (!name.trim()) return;
        const trimmed = name.trim();
        if (statusesList.includes(trimmed)) {
          showCustomAlert('Status Duplicado', 'Já existe um status com este nome.');
          return;
        }
        const idx = statusesList.indexOf(insertAfterStatus);
        const newList = [...statusesList];
        if (idx !== -1) {
          newList.splice(idx + 1, 0, trimmed);
        } else {
          newList.push(trimmed);
        }
        setStatusesList(newList);
        localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
        
        const newColors = { ...statusColors, [trimmed]: '#3b82f6' };
        setStatusColors(newColors);
        localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
      }
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('orse_contrato_view_mode');
    if (saved) setViewMode(saved as any);

    if (typeof window !== 'undefined') {
      const segColors: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kanban-segmento-color-')) {
          const seg = key.replace('kanban-segmento-color-', '');
          segColors[seg] = localStorage.getItem(key) || '#3b82f6';
        }
      }
      setSegmentoColors(segColors);

      const savedStatuses = localStorage.getItem('orse_contrato_statuses');
      if (savedStatuses) {
        try {
          setStatusesList(JSON.parse(savedStatuses));
        } catch (e) {
          console.error(e);
        }
      }

      const savedStatusColors = localStorage.getItem('orse_contrato_status_colors');
      if (savedStatusColors) {
        try {
          setStatusColors(prev => ({ ...prev, ...JSON.parse(savedStatusColors) }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_contrato_view_mode', mode);
  };

  const loadData = async () => {
    setLoading(true);
    const [res, segmentosRes] = await Promise.all([
      getContratos(),
      getSegmentos()
    ]);
    if (res.success) {
      setContratos(res.data || []);
    }
    if (segmentosRes && segmentosRes.success) {
      setSegmentos(segmentosRes.segmentos);
    } else if (Array.isArray(segmentosRes)) {
      setSegmentos(segmentosRes);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Pendente de Assinatura') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'Vigente') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Reajuste Pendente') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (status === 'Encerrado') return 'bg-slate-200 text-slate-700 border-slate-300';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomModal({
      isOpen: true,
      title: 'Excluir Contrato',
      message: 'Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        const res = await deleteContrato(id);
        if (res.success) {
          setContratos(prev => prev.filter(c => c.id !== id));
        } else {
          showCustomAlert('Erro ao Excluir Contrato', res.error || 'Erro ao excluir');
        }
      }
    });
  };

  const filteredContratos = contratos.filter(c => 
    c.client?.razaoSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresaEmissora?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proposta?.numero?.toString().includes(searchTerm)
  );

  const kanbanSegmentoCols = React.useMemo(() => {
    const cols: { id: string; label: string; cards: any[]; total: number }[] = [];

    // Columns for each segment
    segmentos.forEach(seg => {
      const segName = seg.nome || seg;
      const segContratos = filteredContratos.filter(c => c.client?.segmento === segName);
      cols.push({
        id: seg.id || segName,
        label: segName,
        cards: segContratos,
        total: segContratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0)
      });
    });

    return cols;
  }, [filteredContratos, segmentos]);

  const pendentesAssinatura = contratos.filter(c => c.status === statusesList[0]);
  const ativos = contratos.filter(c => c.status === statusesList[1]);
  const pendentesReajuste = contratos.filter(c => c.status === statusesList[2]);
  const encerrados = contratos.filter(c => c.status === statusesList[3]);
  
  const contratosValidosParaReceita = contratos.filter(c => c.status !== statusesList[3]);
  const valorMensalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
  const valorGlobalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorTotal || 0), 0);

  const statusList = statusesList;

  const resolveStatusColorToHex = (status: string): string => {
    return statusColors[status] || '#3b82f6';
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
  const resolveColorToHex = (color?: string): string => {
    if (!color) return '#3b82f6';
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
    return tailwindColorMap[stripped] || '#3b82f6';
  };

  const PRESET_COLORS = [
    '#E0F2FE', '#E0F2F1', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FFEDD5', '#FFE4E6', '#FCE7F3', '#F3E8FF', '#F1F5F9',
    '#38BDF8', '#0D9488', '#10B981', '#84CC16', '#FACC15', '#FB923C', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B',
    '#0EA5E9', '#00B4D8', '#00F5D4', '#39FF14', '#FFD000', '#FF9F1C', '#FF007F', '#D000FF', '#7000FF', '#48CAE4',
    '#0369A1', '#0B6623', '#065F46', '#3F6212', '#A16207', '#C2410C', '#B91C1C', '#9D174D', '#581C87', '#334155',
  ];

  const KanbanColumn = ({ status, isFirst = false }: { status: string; isFirst?: boolean }) => {
    const cards = filteredContratos.filter(c => c.status === status);
    const total = cards.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
    const resolvedHex = resolveColorToHex(resolveStatusColorToHex(status));
    const contrast = getContrastYIQ(resolvedHex);
    const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
    const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
    const textHex = getDarkenedHexForText(resolvedHex);

    const [localName, setLocalName] = useState(status);
    useEffect(() => {
      setLocalName(status);
    }, [status]);

    const handleSaveName = async (newName: string) => {
      const trimmed = newName.trim();
      if (trimmed && trimmed !== status) {
        const res = await renameContratoStatus(status, trimmed);
        if (res.success) {
          setContratos(prev => prev.map(c => c.status === status ? { ...c, status: trimmed } : c));
          const newStatusesList = statusesList.map(s => s === status ? trimmed : s);
          setStatusesList(newStatusesList);
          localStorage.setItem('orse_contrato_statuses', JSON.stringify(newStatusesList));
          
          const newColors = { ...statusColors };
          const oldColor = newColors[status];
          if (oldColor) {
            newColors[trimmed] = oldColor;
            delete newColors[status];
            setStatusColors(newColors);
            localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
          }
        } else {
          alert(res.error || 'Erro ao renomear status no banco de dados');
        }
      }
    };

    return (
      <div 
        className="flex flex-col"
      >
        <div className="flex-shrink-0 w-[306px] shrink-0 relative select-none duration-200">
          <div className="relative h-14 shrink-0 z-10 w-full group/title pointer-events-auto">
            <svg 
              className="absolute inset-0 w-[320px] h-full drop-shadow-sm transition-all duration-200 overflow-visible"
              viewBox="0 0 320 56"
              style={{ color: resolvedHex }}
            >
              <path 
                d={isFirst 
                  ? "M 10,0 L 306,0 L 320,28 L 306,56 L 10,56 A 10,10 0 0,1 0,46 L 0,10 A 10,10 0 0,1 10,0 Z" 
                  : "M 0,0 L 306,0 L 320,28 L 306,56 L 0,56 Z"
                }
                fill="currentColor"
                stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)'}
                strokeWidth="1.5"
              />
            </svg>
            <div 
              className={`absolute inset-0 z-10 flex flex-col justify-center ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
              style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
            >
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="text-sm font-black uppercase tracking-wider truncate max-w-[170px]">
                  {status}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCreateStatus(status); }}
                    className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                    style={{ color: 'inherit' }}
                    title="Criar Nova Etapa"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingStatusId(status); }}
                    className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                    style={{ color: 'inherit' }}
                    title="Editar Coluna"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
              <span className="text-xs font-bold mt-0.5 opacity-90 truncate select-none">
              {fmt(total)}/mês • {cards.length} {cards.length === 1 ? 'contrato' : 'contratos'}
            </span>
          </div>
          {editingStatusId === status && (
            <>
              <div 
                className="fixed inset-0 z-30 cursor-default" 
                onClick={(e) => { e.stopPropagation(); setEditingStatusId(null); }}
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-11 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Editar Coluna</span>
                  <button 
                    onClick={() => setEditingStatusId(null)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nome do Status</label>
                  <input
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-slate-300 outline-none w-full bg-slate-50 font-medium text-slate-800"
                    placeholder="Nome do status"
                    onKeyDown={async (e) => { if (e.key === 'Enter') { await handleSaveName(localName); setEditingStatusId(null); } }}
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
                          onClick={() => {
                            const newColors = { ...statusColors, [status]: c };
                            setStatusColors(newColors);
                            localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                          }}
                          className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
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
                      onChange={(e) => {
                        const newColor = e.target.value;
                        const newColors = { ...statusColors, [status]: newColor };
                        setStatusColors(newColors);
                        localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                      }}
                      className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-slate-500">Cor personalizada</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      if (cards.length > 0) {
                        showCustomAlert('Não é possível excluir', `Esta coluna possui ${cards.length} contrato(s). Por favor, mova todos os contratos para outra coluna antes de excluí-la.`);
                        return;
                      }
                      setCustomModal({
                        isOpen: true,
                        title: 'Excluir Coluna',
                        message: `Tem certeza que deseja excluir a coluna "${status}"?`,
                        type: 'confirm',
                        onConfirm: () => {
                          const newStatusesList = statusesList.filter(s => s !== status);
                          setStatusesList(newStatusesList);
                          localStorage.setItem('orse_contrato_statuses', JSON.stringify(newStatusesList));
                          const newColors = { ...statusColors };
                          delete newColors[status];
                          setStatusColors(newColors);
                          localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                          setEditingStatusId(null);
                        }
                      });
                    }}
                    className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                    type="button"
                  >
                    <Trash2 size={12} /> Excluir Coluna
                  </button>
                  <button
                    onClick={async () => { await handleSaveName(localName); setEditingStatusId(null); }}
                    className="w-full py-1.5 bg-[#1B4D3E] hover:bg-[#1B4D3E]/90 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer"
                    type="button"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div 
          className="flex-1 w-[320px] flex flex-col items-start min-h-[600px]"
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={async (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (id) {
              setContratos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
              await updateContratoStatus(id, status);
            }
          }}
        >
          <div
            className="flex-1 flex flex-col px-[4px] py-3 rounded-b-2xl rounded-t-none"
            style={{
              width: '306px',
              minWidth: '306px',
              maxWidth: '306px',
              marginLeft: '0px',
              alignSelf: 'flex-start',
              backgroundColor: bgRgba,
              borderColor: borderRgba,
              borderWidth: '0 1px 1px 1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex-1 flex flex-col gap-3">
              {cards.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#1B4D3E]/8 rounded-lg">
                        <FileText size={13} className="text-[#1B4D3E]" />
                      </div>
                      <span className="text-xs font-black text-slate-700 tracking-wide">{gerarNumeroContrato(c)}</span>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">{c.empresaEmissora?.nomeFantasia}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2">{c.client?.razaoSocial || c.client?.nomeFantasia}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Início</p>
                      <p className="text-[11px] font-bold text-slate-700">{c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : 'A definir'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reajuste</p>
                      <p className="text-[11px] font-bold text-orange-600">{c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mensal</p>
                      <span className="text-sm font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vigência</p>
                      <span className="text-[11px] font-bold text-slate-600">{c.vigenciaMeses} meses</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.proposta?.user?.avatarUrl ? (
                        <img 
                          src={c.proposta.user.avatarUrl} 
                          alt={c.proposta.user.nome} 
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                          {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium">{c.proposta?.user?.nome || 'Sistema'}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium" title={`Gerado em ${new Date(c.createdAt).toLocaleString('pt-BR')}`}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const KanbanSegmentoColumn = ({ label, cards, isFirst = false, color }: { label: string; cards: any[]; isFirst?: boolean; color: string }) => {
    const total = cards.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
    const resolvedHex = resolveColorToHex(color);
    const contrast = getContrastYIQ(resolvedHex);
    const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
    const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
    const textHex = getDarkenedHexForText(resolvedHex);

    return (
      <div 
        className="flex flex-col"
      >
        <div className="flex-shrink-0 w-[306px] shrink-0 relative select-none duration-200">
          <div className="relative h-14 shrink-0 z-10 w-full group/title pointer-events-auto">
            <svg 
              className="absolute inset-0 w-[320px] h-full drop-shadow-sm transition-all duration-200 overflow-visible"
              viewBox="0 0 320 56"
              style={{ color: resolvedHex }}
            >
              <path 
                d={isFirst 
                  ? "M 10,0 L 306,0 L 320,28 L 306,56 L 10,56 A 10,10 0 0,1 0,46 L 0,10 A 10,10 0 0,1 10,0 Z" 
                  : "M 0,0 L 306,0 L 320,28 L 306,56 L 0,56 Z"
                }
                fill="currentColor"
                stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)'}
                strokeWidth="1.5"
              />
            </svg>
            <div 
              className={`absolute inset-0 z-10 flex flex-col justify-center ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
              style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
            >
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Building size={14} className="shrink-0" style={{ color: 'inherit' }} />
                  <span className="text-sm font-black uppercase tracking-wider truncate">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingSegmentoId(label); }}
                    className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                    style={{ color: 'inherit' }}
                    title="Editar Cor"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
              <span className="text-xs font-bold mt-0.5 opacity-90 truncate select-none">
            style={{ color: bgRgba }}
          >
            <path 
              d={isFirst 
                ? "M 10,0 L 306,0 L 320,28 L 306,56 L 10,56 A 10,10 0 0,1 0,46 L 0,10 A 10,10 0 0,1 10,0 Z" 
                : "M 0,0 L 306,0 L 320,28 L 306,56 L 0,56 L 14,28 Z"
              }
              fill="currentColor"
              stroke={borderRgba}
              strokeWidth="1.5"
            />
          </svg>
          <div 
            className={`absolute inset-0 z-10 flex flex-col justify-center ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
            style={{ color: textHex }}
          >
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Building size={14} className="shrink-0" style={{ color: textHex }} />
                <span className="text-xs font-black uppercase tracking-wider truncate">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingSegmentoId(label); }}
                  className="p-1 rounded-full opacity-0 group-hover/title:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                  style={{ color: textHex }}
                  title="Editar Cor"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            </div>
            <span className="text-[10px] font-bold mt-0.5 opacity-70 truncate select-none">
              {fmt(total)}/mês • {cards.length} {cards.length === 1 ? 'contrato' : 'contratos'}
            </span>
          </div>
          {editingSegmentoId === label && (
            <>
              <div 
                className="fixed inset-0 z-30 cursor-default" 
                onClick={(e) => { e.stopPropagation(); setEditingSegmentoId(null); }}
              />
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-11 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Editar Coluna</span>
                  <button 
                    onClick={() => setEditingSegmentoId(null)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                  <div className="grid grid-cols-10 gap-1 mt-0.5">
                    {PRESET_COLORS.map(c => {
                      const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            localStorage.setItem(`kanban-segmento-color-${label}`, c);
                            setSegmentoColors(prev => ({ ...prev, [label]: c }));
                          }}
                          className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
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
                      onChange={(e) => {
                        const newColor = e.target.value;
                        localStorage.setItem(`kanban-segmento-color-${label}`, newColor);
                        setSegmentoColors(prev => ({ ...prev, [label]: newColor }));
                      }}
                      className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                  </label>
                </div>
                <button
                  onClick={() => setEditingSegmentoId(null)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer mt-1"
                  type="button"
                >
                  Concluir
                </button>
              </div>
            </>
          )}
        </div>
        <div 
          className="flex-1 w-[320px] flex flex-col items-start min-h-[600px]"
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={async (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (id) {
              const newSegment = label === 'Sem Segmento' ? '' : label;
              const targetContrato = contratos.find(c => c.id === id);
              if (targetContrato) {
                setContratos(prev => prev.map(c => c.id === id ? {
                  ...c,
                  client: c.client ? { ...c.client, segmento: newSegment || null } : null
                } : c));
                if (targetContrato.clientId) {
                  const res = await updateCliente(targetContrato.clientId, { segmento: newSegment });
                  if (!res.success) {
                    alert(res.error || 'Erro ao atualizar o segmento do cliente');
                    loadData();
                  }
                } else {
                  alert('Este contrato não tem um cliente associado no banco de dados para salvar o segmento.');
                }
              }
            }
          }}
        >
          <div
            className="flex-1 flex flex-col px-[4px] py-3 rounded-b-2xl rounded-t-none"
            style={{
              width: '306px',
              minWidth: '306px',
              maxWidth: '306px',
              marginLeft: '0px',
              alignSelf: 'flex-start',
              backgroundColor: bgRgba,
              borderColor: borderRgba,
              borderWidth: '0 1px 1px 1px',
              borderStyle: 'solid',
            }}
          >
            <div className="flex-1 flex flex-col gap-3">
              {cards.length === 0 ? (
                      <div className="p-1.5 bg-[#1B4D3E]/8 rounded-lg">
                        <FileText size={13} className="text-[#1B4D3E]" />
                      </div>
                      <span className="text-xs font-black text-slate-700 tracking-wide">{gerarNumeroContrato(c)}</span>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">{c.empresaEmissora?.nomeFantasia}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2">{c.client?.razaoSocial || c.client?.nomeFantasia}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 mb-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Início</p>
                      <p className="text-[11px] font-bold text-slate-700">{c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : 'A definir'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reajuste</p>
                      <p className="text-[11px] font-bold text-orange-600">{c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mensal</p>
                      <span className="text-sm font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vigência</p>
                      <span className="text-[11px] font-bold text-slate-600">{c.vigenciaMeses} meses</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.proposta?.user?.avatarUrl ? (
                        <img 
                          src={c.proposta.user.avatarUrl} 
                          alt={c.proposta.user.nome} 
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                          {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 font-medium">{c.proposta?.user?.nome || 'Sistema'}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium" title={`Gerado em ${new Date(c.createdAt).toLocaleString('pt-BR')}`}>
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Gestão de Contratos (CLM)</h1>
              <p className="text-slate-500 text-sm mt-1">Ciclo de vida, Reajustes e Aditivos</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                <button
                  onClick={() => handleViewModeChange('lista')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-status')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-status' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Kanban
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-segmento')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-segmento' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <Building size={14} /> Segmento
                </button>
              </div>

              <button
                onClick={() => router.push('/contratos/templates')}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <FileText size={18} /> Minutas (Templates)
              </button>
              
              <button
                onClick={() => router.push('/contratos/novo')}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Novo Contrato
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-600"><AlertCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em Assinatura</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{pendentesAssinatura.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-600"><CheckCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ativos (Vigentes)</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{ativos.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-600"><DollarSign size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receita Mensal</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{fmt(valorMensalTotal)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-indigo-600"><TrendingUp size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Global</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{fmt(valorGlobalTotal)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded border border-orange-200 text-orange-600"><AlertCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pendentes de Reajuste</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{pendentesReajuste.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded border border-slate-300 text-slate-600"><Calendar size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encerrados</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{encerrados.length}</p>
              </div>
            </div>
          </div>

          {/* BARRA DE BUSCA */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar contrato, cliente ou emissora..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* VISUALIZAÇÃO EM LISTA */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Contrato</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Empresa Grupo</th>
                      <th className="px-6 py-3">Criado Por</th>
                      <th className="px-6 py-3">Gerado Em</th>
                      <th className="px-6 py-3 text-center">Início</th>
                      <th className="px-6 py-3 text-center">Vigência</th>
                      <th className="px-6 py-3 text-center">Vencimento</th>
                      <th className="px-6 py-3 text-center">Data Reajuste</th>
                      <th className="px-6 py-3 text-right">Mensal</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Carregando contratos...</td></tr>
                    ) : filteredContratos.length === 0 ? (
                      <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Nenhum contrato encontrado.</td></tr>
                    ) : filteredContratos.map((c) => (
                      <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-700">{gerarNumeroContrato(c)}</td>
                        <td className="px-6 py-3 font-semibold text-slate-800">{c.client?.razaoSocial || c.client?.nomeFantasia}</td>
                        <td className="px-6 py-3 text-slate-600">{c.empresaEmissora?.nomeFantasia}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            {c.proposta?.user?.avatarUrl ? (
                              <img 
                                src={c.proposta.user.avatarUrl} 
                                alt={c.proposta.user.nome} 
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </div>
                            )}
                            <span className="text-slate-600 font-medium">{c.proposta?.user?.nome || 'Sistema'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-500 font-mono text-xs">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-3 text-center text-slate-600 font-medium">
                          {c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600 font-medium">{c.vigenciaMeses}m</td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {renderVencimento(c.dataInicio, c.vigenciaMeses)}
                        </td>
                        <td className="px-6 py-3 text-center text-orange-600 font-bold">
                          {c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</td>
                        <td className="px-6 py-3 text-center">
                          <span 
                            className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border shadow-2xs"
                            style={{
                              backgroundColor: hexToRgba(resolveStatusColorToHex(c.status), 0.1),
                              color: getDarkenedHexForText(resolveStatusColorToHex(c.status)),
                              borderColor: hexToRgba(resolveStatusColorToHex(c.status), 0.25)
                            }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => window.open(`/contratos/${c.id}/print`, '_blank')}
                              className="text-slate-500 hover:text-slate-700 transition-colors p-1 bg-slate-100 rounded"
                              title="Gerar/Imprimir PDF"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/contratos/${c.id}`)}
                              className="text-amber-500 hover:text-amber-600 transition-colors p-1 bg-amber-50 rounded"
                              title="Editar Contrato"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(c.id, e)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1 bg-red-50 rounded"
                              title="Excluir Contrato"
                            >
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

          {/* KANBAN POR STATUS */}
          {viewMode === 'kanban-status' && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-[16px] min-w-max items-stretch">
                {statusList.map((status, index) => (
                  <KanbanColumn key={status} status={status} isFirst={index === 0} />
                ))}
              </div>
            </div>
          )}

          {/* KANBAN POR SEGMENTO */}
          {viewMode === 'kanban-segmento' && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-[16px] min-w-max items-stretch">
                {kanbanSegmentoCols.map((col, index) => (
                  <KanbanSegmentoColumn
                    key={col.id}
                    label={col.label}
                    cards={col.cards}
                    isFirst={index === 0}
                    color={segmentoColors[col.label] || '#3b82f6'}
                  />
                ))}
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
                className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#1B4D3E]/80 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
}
