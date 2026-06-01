'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  LayoutList, LayoutGrid, UserSquare2,
  Edit2, Trash2, ArrowRightLeft, X, Building2, Tag, Presentation, Printer, Share2, Eye, Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPropostas, getCurrentUserRole, getUsersList, transferirProposta, getPropostaStatuses, updatePropostaStatusParam } from '@/app/propostas/actions';
import { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';
import ClientLinkModal from '@/components/ClientLinkModal';
import ClientTrackingModal from '@/components/ClientTrackingModal';
import { 
  getDocumentosProposta, 
  getTemplatesProposta, 
  createDocumentoProposta, 
  updateDocumentoStatus, 
  deleteDocumentoProposta 
} from './actions';

type ViewMode = 'lista' | 'kanban-status' | 'kanban-vendedor';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function PropostasComerciaisDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [activeShareDoc, setActiveShareDoc] = useState<any | null>(null);
  const [activeTrackingDoc, setActiveTrackingDoc] = useState<any | null>(null);

  // Dados para modal de criação
  const [fpvs, setFpvs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<string>('USER');
  const [usersList, setUsersList] = useState<any[]>([]);

  const [createModal, setCreateModal] = useState({
    isOpen: false,
    fpvId: '',
    templateId: '',
    empresaId: '',
    saving: false
  });

  const [statuses, setStatuses] = useState<any[]>([]);
  const [vendedorColors, setVendedorColors] = useState<Record<string, string>>({});
  const [statusOrder, setStatusOrder] = useState<string[]>([]);
  const [vendedorOrder, setVendedorOrder] = useState<string[]>([]);

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

  const loadData = async () => {
    setLoading(true);
    const [dataDocs, dataFpvs, dataTemplates, dataEmpresas, role, usersData, statusData] = await Promise.all([
      getDocumentosProposta(),
      getPropostas(),
      getTemplatesProposta(),
      getEmpresasEmissoras(),
      getCurrentUserRole(),
      getUsersList(),
      getPropostaStatuses()
    ]);
    setDocs(dataDocs);
    setFpvs(dataFpvs);
    setTemplates(dataTemplates);
    setEmpresas(dataEmpresas);
    setUserRole(role);
    setUsersList(usersData);
    setStatuses(statusData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const colors: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('kanban-vendedor-color-')) {
          const seller = key.replace('kanban-vendedor-color-', '');
          colors[seller] = localStorage.getItem(key) || 'emerald';
        }
      }
      setVendedorColors(colors);

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
  const KanbanColumnHeader = ({ label, color, cards, total, type = 'status', statusId, onColorChange }: {
    label: string; color?: string; cards: any[]; total: number; type?: 'status' | 'vendedor'; statusId?: string; onColorChange?: (newColor: string) => void;
  }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const userObj = usersList.find(u => u.nome === label);
    const colAvatarUrl = userObj?.avatarUrl;
    const isStatus = type === 'status';
    const hStyle = isStatus 
      ? getHighlightedColorClass(color) 
      : getHighlightedColorClass(color || 'emerald');

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
          <div className={`rounded-t-2xl rounded-b-none p-4 shadow-md text-left border border-b-0 ${hStyle.bg} ${hStyle.text} ${hStyle.border} relative group`}>
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

              {/* Paletinha de Cores para o Vendedor 🎨 */}
              {onColorChange && (
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
            </div>
            <p className="text-base font-black text-white mt-3">{fmt(total)}</p>
            <p className="text-[10px] text-white/70 font-medium mt-0.5">Volume total</p>
          </div>
        )}
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
            cards.map(doc => <ProposalCard key={doc.id} doc={doc} />)
          )}
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

      <main className="flex-1 p-8 overflow-y-auto h-full">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <Presentation size={24} /> Propostas Comerciais
              </h1>
              <p className="text-slate-500 text-sm mt-1">Gerador de documentos comerciais em PDF</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                <button
                  onClick={() => setViewMode('lista')}
                  title="Visualização em Lista"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => setViewMode('kanban-status')}
                  title="Kanban por Status"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-status' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Por Status
                </button>
                <button
                  onClick={() => setViewMode('kanban-vendedor')}
                  title="Kanban por Vendedor"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-vendedor' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <UserSquare2 size={14} /> Por Vendedor
                </button>
              </div>

              <button
                onClick={() => router.push('/propostas-comerciais/templates')}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <FileText size={16} /> Templates
              </button>
              <button
                onClick={() => setCreateModal({ isOpen: true, fpvId: '', templateId: '', empresaId: '', saving: false })}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Nova Proposta
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID FPV..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LISTA */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">FPV Referência</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Empresa Emissora</th>
                    <th className="px-6 py-3">Criado Por</th>
                    <th className="px-6 py-3">Data/Hora</th>
                    <th className="px-6 py-3 text-right">Valor Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td></tr>
                  ) : filteredDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400" />
                          <span className="font-mono font-bold text-slate-800 text-xs">{fmtRef(doc.numeroFPV, doc.versaoFPV || 1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">{doc.cliente}</td>
                      <td className="px-6 py-3 text-slate-500">{doc.empresa}</td>
                      <td className="px-6 py-3">
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
                          <span className="text-slate-600 font-medium">{doc.usuario || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">{doc.data}</td>
                      <td className="px-6 py-3 font-bold text-[#1B4D3E] text-right">{fmt(doc.valor)}</td>
                      <td className="px-6 py-3 text-center">
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
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center gap-2">
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
                      <div className="space-y-4">
                        {/* Container Sticky Unificado: Título + Cabeçalhos */}
                        <div 
                          className="sticky top-0 z-20 pt-8 pb-0 mb-0 bg-transparent"
                          style={{ top: '-32px' }}
                        >
                          {/* Opaque background mask only for title + headers (excludes the pb-28/112px popover scroll space) */}
                          <div className="absolute inset-x-0 top-0 bottom-28 bg-[#F8FAFC] -z-10" />
                          <div className="flex items-center gap-2 mb-4">
                            <LayoutGrid size={16} className="text-[#1B4D3E]" />
                            <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider">Kanban por Status</h2>
                            <span className="text-[10px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-2 py-0.5 rounded font-bold">
                              {kanbanStatusCols.length} status
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
                              {orderedStatusCols.map(col => (
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
                                  onDragColumnStart={(e, l) => handleDragColumnStart(e, l, 'status')}
                                  onDragColumnEnd={handleDragColumnEnd}
                                  onDropColumn={(e, l) => handleDropColumn(e, l, 'status')}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Cards Roláveis (Sem qualquer pt ou mt para encostar fisicamente nos cabeçalhos sticky) */}
                        <div 
                          id="kanban-cards-status"
                          className="overflow-x-auto pb-6 pt-0 mt-[-112px]"
                          onScroll={() => syncScroll('kanban-cards-status', 'kanban-headers-status')}
                        >
                          <div className="flex gap-5 min-w-max pt-0 mt-0">
                            {orderedStatusCols.map(col => (
                              <KanbanColumnCards
                                key={col.id}
                                  label={col.label}
                                  color={col.color}
                                  type="status"
                                  cards={col.cards}
                                  onDropProp={async (propId) => {
                                    const doc = docs.find(d => d.propostaId === propId);
                                    if (doc && doc.status !== col.label) {
                                      setDocs(prev => prev.map(d => d.propostaId === propId ? { ...d, status: col.label } : d));
                                      await updateDocumentoStatus(doc.id, col.label);
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
                            className="sticky top-0 z-20 pt-8 pb-0 mb-0 bg-transparent"
                            style={{ top: '-32px' }}
                          >
                            {/* Opaque background mask only for title + headers (excludes the pb-28/112px popover scroll space) */}
                            <div className="absolute inset-x-0 top-0 bottom-28 bg-[#F8FAFC] -z-10" />
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
                                {orderedVendedorCols.map(col => {
                                  const vColor = vendedorColors[col.label] || 'emerald';
                                  return (
                                    <KanbanColumnHeader
                                      key={col.id}
                                      label={col.label}
                                      type="vendedor"
                                      color={vColor}
                                      cards={col.cards}
                                      total={col.total}
                                      statusId={col.id}
                                      onColorChange={async (newColor) => {
                                        localStorage.setItem(`kanban-vendedor-color-${col.label}`, newColor);
                                        setVendedorColors(prev => ({ ...prev, [col.label]: newColor }));
                                      }}
                                      onDragColumnStart={(e, l) => handleDragColumnStart(e, l, 'vendedor')}
                                      onDragColumnEnd={handleDragColumnEnd}
                                      onDropColumn={(e, l) => handleDropColumn(e, l, 'vendedor')}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Cards Roláveis (Sem qualquer pt ou mt para encostar fisicamente nos cabeçalhos sticky) */}
                          <div 
                            id="kanban-cards-vendedor"
                            className="overflow-x-auto pb-6 pt-0 mt-[-112px]"
                            onScroll={() => syncScroll('kanban-cards-vendedor', 'kanban-headers-vendedor')}
                          >
                            <div className="flex gap-5 min-w-max pt-0 mt-0">
                              {orderedVendedorCols.map(col => {
                                const vColor = vendedorColors[col.label] || 'emerald';
                                return (
                                  <KanbanColumnCards
                                    key={col.id}
                                    label={col.label}
                                    type="vendedor"
                                    color={vColor}
                                    cards={col.cards}
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

    </div>
  );
}
