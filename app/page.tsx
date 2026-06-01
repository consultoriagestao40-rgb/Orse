'use client';

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
  getUsersList, transferirProposta, compartilharProposta, getAuditLogs,
  updatePropostaStatusParam
} from '@/app/propostas/actions';

type ViewMode = 'lista' | 'kanban-status' | 'kanban-vendedor';

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

  // Modais e dados auxiliares
  const [usersList, setUsersList] = useState<any[]>([]);
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean, propId: string | null }>({ isOpen: false, propId: null });
  const [shareModal, setShareModal] = useState<{ isOpen: boolean, propId: string | null }>({ isOpen: false, propId: null });
  const [auditModal, setAuditModal] = useState<{ isOpen: boolean, propId: string | null, logs: any[] }>({ isOpen: false, propId: null, logs: [] });
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const [data, statusData, role, usersData] = await Promise.all([
      getPropostas(),
      getPropostaStatuses(),
      getCurrentUserRole(),
      getUsersList()
    ]);
    setProposals(data);
    setStatuses(statusData);
    setUserRole(role);
    setUsersList(usersData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

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
            <button onClick={() => { setOpen(false); setShareModal({ isOpen: true, propId: prop.id }); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Share2 size={14} /> Compartilhar
            </button>
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <button onClick={() => { setOpen(false); setTransferModal({ isOpen: true, propId: prop.id }); }} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <ArrowRightLeft size={14} /> Transferir
              </button>
            )}
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
            {userRole === 'ADMIN' && (
              <button onClick={async () => {
                setOpen(false);
                if (!confirm(`Excluir a proposta ${prop.numero}?`)) return;
                const res = await deleteProposta(prop.id);
                if (res.success) loadData();
                else alert('Erro: ' + res.error);
              }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1">
                <Trash2 size={14} /> Excluir
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
          <span className="text-[10px] text-slate-500 font-medium">{prop.usuario}</span>
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

  const getHighlightedColorClass = (colorClass: string = '') => {
    const lower = colorClass.toLowerCase();
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
  // ── Cabeçalho da coluna ────────────────────────────────────────────────────
  const KanbanColumnHeader = ({ label, color, cards, total, type = 'status', statusId, onColorChange }: {
    label: string; color?: string; cards: any[]; total: number; type?: 'status' | 'vendedor'; statusId?: string; onColorChange?: (newColor: string) => void;
  }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const userObj = usersList.find(u => u.nome === label);
    const colAvatarUrl = userObj?.avatarUrl;
    const isStatus = type === 'status';
    const hStyle = isStatus 
      ? getHighlightedColorClass(color) 
      : {
          bg: 'bg-gradient-to-br from-[#1B4D3E] to-[#2E6B57]',
          border: 'border-[#13382d]',
          text: 'text-white',
          badge: 'bg-white/20 text-white border border-white/10',
          totalColor: 'text-white'
        };

    // Opções de cores do sistema
    const colorOptions = [
      { name: 'Céu', value: 'sky' },
      { name: 'Laranja', value: 'orange' },
      { name: 'Esmeralda', value: 'emerald' },
      { name: 'Vermelho', value: 'red' },
      { name: 'Roxo', value: 'purple' },
      { name: 'Ardósia', value: 'slate' },
      { name: 'Amarelo', value: 'yellow' },
      { name: 'Indigo', value: 'indigo' },
      { name: 'Pink', value: 'pink' },
      { name: 'Teal', value: 'teal' }
    ];

    return (
      <div className="flex-shrink-0 w-72 shrink-0 relative">
        {isStatus ? (
          <div className={`border border-b-0 rounded-t-2xl rounded-b-none p-4 shadow-md text-left ${hStyle.bg} ${hStyle.text} ${hStyle.border} relative group`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm ${hStyle.badge}`}>
                {label}
              </span>
              
              <div className="flex items-center gap-2">
                {/* Ícone de Paleta de Cores 🎨 */}
                {statusId && onColorChange && (
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`p-1 rounded hover:bg-white/20 transition-all ${showColorPicker ? 'bg-white/20' : 'opacity-60 group-hover:opacity-100'}`}
                      title="Customizar Cor da Coluna"
                    >
                      <Palette size={14} className="text-white" />
                    </button>

                    {/* Popover Color Picker */}
                    {showColorPicker && (
                      <>
                        <div 
                          className="fixed inset-0 z-30" 
                          onClick={() => setShowColorPicker(false)}
                        />
                        <div className="absolute right-0 top-6 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Selecione a Cor</p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {colorOptions.map(opt => {
                              const previewStyle = getHighlightedColorClass(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={async () => {
                                    setShowColorPicker(false);
                                    await onColorChange(opt.value);
                                  }}
                                  className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm transition-all hover:scale-115 active:scale-95 ${previewStyle.bg}`}
                                  title={opt.name}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm ${hStyle.badge}`}>
                  {cards.length}
                </span>
              </div>
            </div>
            <p className="text-sm font-black mt-3">{fmt(total)}</p>
            <p className="text-[10px] opacity-75 font-medium mt-0.5">Volume total da coluna</p>
          </div>
        ) : (
          <div className={`rounded-t-2xl rounded-b-none p-4 shadow-md text-left border border-b-0 ${hStyle.bg} ${hStyle.text} ${hStyle.border}`}>
            <div className="flex items-center gap-3 mb-2">
              {colAvatarUrl ? (
                <img 
                  src={colAvatarUrl} 
                  alt={label} 
                  className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow-md"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-sm uppercase border border-white/20 shadow-md">
                  {label.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate text-white">{label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-white/90 font-bold bg-white/10 px-2 py-0.5 rounded">{cards.length} proposta{cards.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <p className="text-base font-black text-white mt-3">{fmt(total)}</p>
            <p className="text-[10px] text-white/70 font-medium mt-0.5">Volume total</p>
          </div>
        )}
      </div>
    );
  };

  const getSuaveBgClass = (colorClass: string = '', type: 'status' | 'vendedor' = 'status') => {
    if (type !== 'status') {
      return 'bg-slate-50/70 border border-slate-100/50';
    }
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
  const KanbanColumnCards = ({ label, cards, color, type = 'status', onDropProp }: {
    label: string; cards: any[]; color?: string; type?: 'status' | 'vendedor'; onDropProp?: (propId: string) => void;
  }) => {
    const suaveBg = getSuaveBgClass(color, type);
    return (
      <div 
        className={`flex-shrink-0 w-72 flex flex-col min-h-[600px] p-3 pt-4 rounded-b-2xl rounded-t-none border-t-0 ${suaveBg}`}
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

      <main className="flex-1 p-8 overflow-y-auto h-full">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">FPV - Gestão de Formação de Preço de Vendas</h1>
              <p className="text-slate-500 text-sm mt-1">Engenharia de Custos e Controladoria de Facilities</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing">
              {/* Alternador de visualização */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                <button
                  onClick={() => setViewMode('lista')}
                  title="Visualização em Lista"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'lista'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => setViewMode('kanban-status')}
                  title="Kanban por Status"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-status'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Por Status
                </button>
                <button
                  onClick={() => setViewMode('kanban-vendedor')}
                  title="Kanban por Vendedor"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-vendedor'
                      ? 'bg-[#1B4D3E] text-white shadow-sm'
                      : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <UserSquare2 size={14} /> Por Vendedor
                </button>
              </div>

              <button
                onClick={() => router.push('/propostas/nova')}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Nova FPV
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-center gap-3">
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
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden">
              <div className="p-4 border-b border-slate-300 flex items-center justify-between bg-slate-50">
                <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} /> Pipeline de Orçamentos
                  <span className="text-[10px] bg-white border border-slate-300 text-slate-500 px-2 py-0.5 rounded ml-2 font-bold">
                    Total: {proposals.length}
                  </span>
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3 w-1/5">ID / Proposta</th>
                      <th className="px-6 py-3 w-1/4">Cliente</th>
                      <th className="px-6 py-3">Responsável</th>
                      <th className="px-6 py-3 text-right">Valor Total</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Versão</th>
                      <th className="px-6 py-3 text-center">Ações</th>
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
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 relative">
                            <button
                              onClick={() => router.push(`/propostas/nova?id=${prop.id}`)}
                              className="text-amber-500 hover:text-amber-600 transition-colors p-1"
                              title="Editar Proposta"
                            >
                              <Edit2 size={16} />
                            </button>
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
          {/* ── KANBAN POR STATUS ─────────────────────────────────────────────── */}
          {viewMode === 'kanban-status' && (
            <div>
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
                <div className="space-y-4">
                  {/* Container Sticky Unificado: Título + Cabeçalhos */}
                  <div 
                    className="sticky top-0 z-20 bg-[#F8FAFC] pt-8 pb-0 mb-0"
                    style={{ top: '-32px' }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <LayoutGrid size={16} className="text-[#1B4D3E]" />
                      <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Status</h2>
                      <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                        {kanbanStatusCols.length} coluna{kanbanStatusCols.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Cabeçalhos Fixos */}
                    <div 
                      id="kanban-headers-status"
                      className="overflow-x-auto no-scrollbar pb-28 mb-[-112px] animate-in fade-in duration-200"
                      onScroll={() => syncScroll('kanban-headers-status', 'kanban-cards-status')}
                      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                      <div className="flex gap-5 min-w-max pb-0 mb-0">
                        {kanbanStatusCols.map(col => (
                          <KanbanColumnHeader
                            key={col.id}
                            label={col.label}
                            color={col.color}
                            cards={col.cards}
                            total={col.total}
                            statusId={col.id}
                            onColorChange={async (newColor) => {
                              await updatePropostaStatusParam(col.id, col.label, newColor);
                              setStatuses(prev => prev.map(s => s.id === col.id ? { ...s, color: newColor } : s));
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cards Roláveis (Sem qualquer pt ou mt para encostar fisicamente nos cabeçalhos sticky) */}
                  <div 
                    id="kanban-cards-status"
                    className="overflow-x-auto pb-6 pt-0 mt-0"
                    onScroll={() => syncScroll('kanban-cards-status', 'kanban-headers-status')}
                  >
                    <div className="flex gap-5 min-w-max pt-0 mt-0">
                      {kanbanStatusCols.map(col => (
                        <KanbanColumnCards
                          key={col.id}
                          label={col.label}
                          color={col.color}
                          type="status"
                          cards={col.cards}
                          onDropProp={async (propId) => {
                            const prop = proposals.find(p => p.id === propId);
                            if (prop && prop.status !== col.label) {
                              setProposals(prev => prev.map(p => p.id === propId ? { ...p, status: col.label } : p));
                              const res = await updatePropostaStatus(propId, col.label);
                              if (!res.success) alert(res.error);
                            }
                          }}
                        />
                      ))}
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
                <div className="space-y-4">
                  {/* Container Sticky Unificado: Título + Cabeçalhos */}
                  <div 
                    className="sticky top-0 z-20 bg-[#F8FAFC] pt-8 pb-0 mb-0"
                    style={{ top: '-32px' }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <UserSquare2 size={16} className="text-[#1B4D3E]" />
                      <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Vendedor</h2>
                      <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                        {kanbanVendedorCols.length} vendedor{kanbanVendedorCols.length !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    {/* Cabeçalhos Fixos */}
                    <div 
                      id="kanban-headers-vendedor"
                      className="overflow-x-auto no-scrollbar pb-28 mb-[-112px] animate-in fade-in duration-200"
                      onScroll={() => syncScroll('kanban-headers-vendedor', 'kanban-cards-vendedor')}
                      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                    >
                      <div className="flex gap-5 min-w-max pb-0 mb-0">
                        {kanbanVendedorCols.map(col => (
                          <KanbanColumnHeader
                            key={col.id}
                            label={col.label}
                            type="vendedor"
                            cards={col.cards}
                            total={col.total}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cards Roláveis (Sem qualquer pt ou mt para encostar fisicamente nos cabeçalhos sticky) */}
                  <div 
                    id="kanban-cards-vendedor"
                    className="overflow-x-auto pb-6 pt-0 mt-0"
                    onScroll={() => syncScroll('kanban-cards-vendedor', 'kanban-headers-vendedor')}
                  >
                    <div className="flex gap-5 min-w-max pt-0 mt-0">
                      {kanbanVendedorCols.map(col => (
                        <KanbanColumnCards
                          key={col.id}
                          label={col.label}
                          type="vendedor"
                          cards={col.cards}
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
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* MODAL DE TRANSFERÊNCIA */}
      {transferModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-[#1B4D3E]" /> Transferir Proposta
              </h2>
              <button onClick={() => setTransferModal({ isOpen: false, propId: null })} className="text-amber-500 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">
                Selecione o usuário para o qual deseja transferir a propriedade desta proposta. O usuário atual perderá acesso se não tiver outra permissão.
              </p>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm mb-6"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Selecione o Novo Dono --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setTransferModal({ isOpen: false, propId: null })} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  onClick={async () => {
                    if (!selectedUserId || !transferModal.propId) return;
                    setLoading(true);
                    const res = await transferirProposta(transferModal.propId, selectedUserId);
                    if (res.success) {
                      setTransferModal({ isOpen: false, propId: null });
                      loadData();
                    } else {
                      alert(res.error);
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-bold bg-[#1B4D3E] text-white rounded-lg hover:bg-[#13382d]"
                  disabled={!selectedUserId}
                >
                  Confirmar Transferência
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTILHAMENTO */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Share2 size={20} className="text-[#1B4D3E]" /> Compartilhar Proposta
              </h2>
              <button onClick={() => setShareModal({ isOpen: false, propId: null })} className="text-amber-500 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">
                Selecione o usuário que também poderá visualizar e editar esta proposta (Coautoria).
              </p>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm mb-6"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Selecione o Colega --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShareModal({ isOpen: false, propId: null })} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  onClick={async () => {
                    if (!selectedUserId || !shareModal.propId) return;
                    setLoading(true);
                    const res = await compartilharProposta(shareModal.propId, selectedUserId);
                    if (res.success) {
                      setShareModal({ isOpen: false, propId: null });
                      loadData();
                    } else {
                      alert(res.error);
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-bold bg-[#1B4D3E] text-white rounded-lg hover:bg-[#13382d]"
                  disabled={!selectedUserId}
                >
                  Conceder Acesso
                </button>
              </div>
            </div>
          </div>
        </div>
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
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
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

  return <LandingPage />;
}
