'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Search, LayoutList, LayoutGrid, Calendar, 
  DollarSign, Users, ChevronLeft, ChevronRight, X, 
  Edit2, Trash2, CheckCircle2, ClipboardCheck, ArrowRight, User
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getPicStages, getPics, updatePicStageId, 
  createPicStage, updatePicStage, deletePicStage, 
  updatePicStagesOrder 
} from './actions';
import { getAllUsers } from '@/app/leads/actions';
import PicDetailsModal from './components/PicDetailsModal';

type ViewMode = 'lista' | 'kanban';

export default function PicDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pics, setPics] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPicId, setSelectedPicId] = useState<string | null>(null);

  // Estados para edição/criação de estágios (colunas)
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [localStageName, setLocalStageName] = useState('');
  const [localStageColor, setLocalStageColor] = useState('#3b82f6');
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [insertAfterStageId, setInsertAfterStageId] = useState<string | null>(null);

  // Drag and drop de colunas
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedOverColumnId, setDraggedOverColumnId] = useState<string | null>(null);

  const PRESET_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#14b8a6', '#64748b', '#0f172a'
  ];

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [stagesRes, picsRes, usersRes] = await Promise.all([
        getPicStages(),
        getPics(),
        getAllUsers()
      ]);

      if (stagesRes.success && stagesRes.stages) {
        setStages(stagesRes.stages);
      }
      if (picsRes.success && picsRes.pics) {
        setPics(picsRes.pics);
      }
      if (usersRes.success && usersRes.users) {
        setUsers(usersRes.users);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do PIC:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Formatação de moeda
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  // Filtro de PICs
  const filteredPics = pics.filter(p => {
    const client = p.contrato?.client || {};
    const clientName = (client.razaoSocial || client.nomeFantasia || '').toLowerCase();
    const contractNum = p.contratoId.toLowerCase();
    const sellerName = (p.contrato?.proposta?.user?.nome || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return clientName.includes(search) || contractNum.includes(search) || sellerName.includes(search);
  });

  // ---------------------------------------------------------------------------
  // DRAG AND DROP - MOVER CARD ENTRE COLUNAS
  // ---------------------------------------------------------------------------

  const handleDragStart = (e: React.DragEvent, picId: string) => {
    e.dataTransfer.setData('text/pic-id', picId);
  };

  const handleDropCard = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const picId = e.dataTransfer.getData('text/pic-id');
    if (!picId) return;

    // Atualização otimista
    setPics(prev => prev.map(p => p.id === picId ? { ...p, stageId: targetStageId } : p));

    const res = await updatePicStageId(picId, targetStageId);
    if (!res.success) {
      alert(res.error || 'Erro ao mover PIC');
      loadData(true);
    }
  };

  // ---------------------------------------------------------------------------
  // DRAG AND DROP - REORDENAR COLUNAS (STAGES)
  // ---------------------------------------------------------------------------

  const handleColumnDragStart = (e: React.DragEvent, stageId: string) => {
    setDraggedColumnId(stageId);
    e.dataTransfer.setData('text/column-id', stageId);
  };

  const handleColumnDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedColumnId && draggedColumnId !== stageId) {
      setDraggedOverColumnId(stageId);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const colId = e.dataTransfer.getData('text/column-id');
    if (!colId || colId !== draggedColumnId || colId === targetStageId) {
      setDraggedColumnId(null);
      setDraggedOverColumnId(null);
      return;
    }

    const currentOrder = stages.map(s => s.id);
    const draggedIdx = currentOrder.indexOf(colId);
    const targetIdx = currentOrder.indexOf(targetStageId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, colId);

      // Atualização otimista
      const orderedStages = newOrder.map((id, index) => {
        const stage = stages.find(s => s.id === id);
        return { ...stage, ordem: index + 1 };
      });
      setStages(orderedStages);

      const res = await updatePicStagesOrder(newOrder);
      if (!res.success) {
        alert(res.error || 'Erro ao ordenar estágios');
        loadData(true);
      }
    }

    setDraggedColumnId(null);
    setDraggedOverColumnId(null);
  };

  // ---------------------------------------------------------------------------
  // GESTÃO DE ESTÁGIOS (EDICAO / CRIACAO)
  // ---------------------------------------------------------------------------

  const handleSaveStageEdit = async (stageId: string) => {
    if (!localStageName.trim()) return;
    setEditingStageId(null);
    
    // Atualização otimista
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, nome: localStageName.trim(), color: localStageColor } : s));

    const res = await updatePicStage(stageId, localStageName.trim(), localStageColor);
    if (!res.success) {
      alert(res.error || 'Erro ao editar estágio');
      loadData(true);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) {
      alert('É necessário ter ao menos um estágio ativo no Kanban.');
      return;
    }
    const fallback = stages.find(s => s.id !== stageId);
    if (!fallback) return;

    if (!confirm('Deseja excluir este estágio? Todos os PICs associados serão movidos para "' + fallback.nome + '".')) return;

    setEditingStageId(null);
    // Atualização otimista
    setPics(prev => prev.map(p => p.stageId === stageId ? { ...p, stageId: fallback.id } : p));
    setStages(prev => prev.filter(s => s.id !== stageId));

    const res = await deletePicStage(stageId, fallback.id);
    if (!res.success) {
      alert(res.error || 'Erro ao excluir estágio');
      loadData(true);
    }
  };

  const handleCreateNewStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    setShowAddStageModal(false);
    setLoading(true);

    const res = await createPicStage(newStageName.trim(), newStageColor, insertAfterStageId || undefined);
    setNewStageName('');
    setInsertAfterStageId(null);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || 'Erro ao criar estágio');
      setLoading(false);
    }
  };

  const resolveContrastColor = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 140 ? '#0f172a' : '#ffffff';
  };

  const hexToRgba = (hex: string, alpha: number) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden p-8 flex flex-col items-center">
        
        {/* Header da Tela */}
        <header className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 border-b border-slate-200 pb-4 shrink-0 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={28} className="text-[#1B4D3E]" /> PIC - Programa de Implantação de Contratos
            </h1>
            <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mt-1.5">
              Gestão visual e física da ativação de novos contratos e FPVs recorrentes.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* Input Pesquisa */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar cliente, contrato ou vendedor..."
                className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-[#1B4D3E] w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Alternador de Visão */}
            <div className="flex bg-slate-200/80 p-0.75 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visão Kanban"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`p-1.5 rounded-md cursor-pointer transition-all ${
                  viewMode === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Visão Tabela"
              >
                <LayoutList size={16} />
              </button>
            </div>

            {/* Criar Etapa */}
            <button
              onClick={() => {
                setInsertAfterStageId(null);
                setShowAddStageModal(true);
              }}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus size={14} /> Nova Etapa
            </button>

          </div>
        </header>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="w-full max-w-7xl h-[60vh] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-wider animate-pulse">Buscando cronogramas do PIC...</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex-1 flex overflow-hidden">
            
            {/* ─────────────────────────────────────────────────────────────────
                VISÃO KANBAN BOARD
                ─────────────────────────                {stages.map((stage, sIdx) => {
                  const stagePics = filteredPics.filter(p => p.stageId === stage.id);
                  const isDraggedOver = draggedOverColumnId === stage.id;
                  const borderHex = stage.color || '#3b82f6';
                  const textContrast = resolveContrastColor(borderHex);
                  const contrast = textContrast === '#ffffff' ? 'white' : 'dark';
                  const bgRgba = hexToRgba(borderHex, contrast === 'white' ? 0.08 : 0.18);
                  const borderRgba = hexToRgba(borderHex, contrast === 'white' ? 0.25 : 0.45);
                  const isFirst = sIdx === 0;
                  const isLast = sIdx === stages.length - 1;
                  
                  return (
                    <div 
                      key={stage.id} 
                      className={`flex flex-col shrink-0 h-full transition-all ${
                        isDraggedOver ? 'scale-98 opacity-90' : ''
                      }`}
                      style={{ width: '274px' }}
                      onDragOver={(e) => handleColumnDragOver(e, stage.id)}
                      onDrop={(e) => handleColumnDrop(e, stage.id)}
                    >
                      
                      {/* Frozen Header da Coluna */}
                      <div 
                        className="sticky top-0 select-none duration-200 bg-slate-50 shrink-0"
                        style={{ zIndex: 20 + (stages.length - sIdx) }}
                      >
                        <div 
                          className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleColumnDragStart(e, stage.id)}
                          onDragOver={(e) => handleColumnDragOver(e, stage.id)}
                          onDrop={(e) => handleColumnDrop(e, stage.id)}
                        >
                          <svg 
                            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                            viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                            preserveAspectRatio="none"
                            style={{ color: borderHex }}
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
                            style={{ color: textContrast }}
                          >
                            <div className="flex flex-col min-w-0 justify-center">
                              <h3 className="font-black uppercase tracking-wider text-[11px] truncate max-w-[150px] leading-none">
                                {stage.nome}
                              </h3>
                              <span className="text-[10px] font-bold mt-1 opacity-90 truncate select-none leading-none">
                                {stagePics.length} {stagePics.length === 1 ? 'programa' : 'programas'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStageId(stage.id);
                                  setLocalStageName(stage.nome);
                                  setLocalStageColor(stage.color);
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
                                  setInsertAfterStageId(stage.id);
                                  setShowAddStageModal(true);
                                }}
                                className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-155 flex items-center justify-center cursor-pointer hover:bg-black/5"
                                style={{ color: 'inherit' }}
                                title="Criar Nova Etapa"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Modal Dropdown para Edição Inline do Estágio */}
                        {editingStageId === stage.id && (
                          <>
                            <div className="fixed inset-0 z-30 cursor-default" onClick={() => setEditingStageId(null)} />
                            <div className="absolute left-1/2 -translate-x-1/2 top-14 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[250px] text-slate-800 flex flex-col gap-3 font-sans normal-case tracking-normal">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Editar Coluna</span>
                                <button type="button" onClick={() => setEditingStageId(null)} className="text-slate-400 hover:text-slate-650 transition-colors"><X size={12} /></button>
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Nome do Estágio</label>
                                <input
                                  type="text"
                                  value={localStageName}
                                  onChange={(e) => setLocalStageName(e.target.value)}
                                  className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-800 w-full outline-none focus:border-[#1B4D3E]"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Selecione a Cor</label>
                                <div className="grid grid-cols-5 gap-1 mt-0.5">
                                  {PRESET_COLORS.map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setLocalStageColor(color)}
                                      className="w-5 h-5 rounded-full border shadow-sm cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                      style={{ backgroundColor: color, borderColor: localStageColor === color ? '#0f172a' : 'rgba(0,0,0,0.1)' }}
                                    >
                                      {localStageColor === color && (
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resolveContrastColor(color) }} />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStage(stage.id)}
                                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-[10px] font-bold transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={11} /> Excluir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveStageEdit(stage.id)}
                                  className="flex-1 py-1.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-md text-[10px] font-bold transition-colors text-center cursor-pointer"
                                >
                                  OK
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Conteúdo da Coluna / Cards */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropCard(e, stage.id)}
                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none flex-1 flex flex-col gap-2 overflow-y-auto"
                        style={{ 
                          backgroundColor: bgRgba, 
                          borderColor: borderRgba,
                          borderWidth: '0 1px 1px 1px',
                          borderStyle: 'solid',
                        }}
                      >
                        {stagePics.map(pic => {
                          const client = pic.contrato?.client || {};
                          const vendedor = pic.contrato?.proposta?.user || {};
                          
                          return (
                            <div
                              key={pic.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, pic.id)}
                              onClick={() => setSelectedPicId(pic.id)}
                              className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between h-[126px]"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1 shrink-0">
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                                    FPV-{pic.contrato?.proposta?.numero ? pic.contrato.proposta.numero.toString().padStart(3, '0') : 'S/N'}
                                  </span>
                                  <span className="text-xs font-black text-[#1B4D3E]">
                                    {fmt(pic.valorMensal)}
                                  </span>
                                </div>
                                <h4 
                                  className="text-xs font-black text-slate-800 leading-snug truncate" 
                                  title={client.razaoSocial || client.nomeFantasia}
                                >
                                  {client.razaoSocial || client.nomeFantasia || 'Sem Nome'}
                                </h4>
                              </div>

                              <div className="space-y-2 shrink-0">
                                {/* Barra de Progresso */}
                                <div>
                                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">
                                    <span>Implantação</span>
                                    <span>{pic.progressPercent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${pic.progressPercent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Rodapé Card - Vendedor / Fechou */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {vendedor.avatarUrl ? (
                                      <img src={vendedor.avatarUrl} alt={vendedor.nome} className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase shrink-0 border border-slate-100">
                                        {(vendedor.nome || 'Sis').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                      </div>
                                    )}
                                    <span className="text-[9px] text-slate-500 font-bold truncate max-w-[130px]">
                                      {vendedor.nome || 'Sistema'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                    {pic.contrato?.empresaEmissora?.nomeFantasia || 'JVS Group'}
                                  </span>
                                </div>
                              </div>

                            </div>
                          );
                        })}

                        {stagePics.length === 0 && (
                          <div className="py-12 border border-dashed border-slate-300/40 rounded-xl flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nenhum PIC</span>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────
                VISÃO TABELA / LISTA
                ───────────────────────────────────────────────────────────────── */}
            {viewMode === 'lista' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden w-full h-[70vh] flex flex-col">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                        <th className="px-6 py-3.5">Contrato ID</th>
                        <th className="px-6 py-3.5">Cliente / Razão Social</th>
                        <th className="px-6 py-3.5">Estágio Implantação</th>
                        <th className="px-6 py-3.5 text-right">Valor Mensal</th>
                        <th className="px-6 py-3.5">Progresso Ações</th>
                        <th className="px-6 py-3.5">Responsável Fechamento</th>
                        <th className="px-6 py-3.5">Empresa</th>
                        <th className="px-6 py-3.5 text-center">Ver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {filteredPics.map(pic => {
                        const client = pic.contrato?.client || {};
                        const vendedor = pic.contrato?.proposta?.user || {};
                        const stage = pic.stage || {};
                        
                        return (
                          <tr key={pic.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 font-mono text-[10px] text-slate-500">
                              {pic.contratoId.substring(0, 10).toUpperCase()}...
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex flex-col">
                                <span className="text-slate-800 font-extrabold">{client.razaoSocial || client.nomeFantasia || 'Cliente não identificado'}</span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">CNPJ: {client.cnpj || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <span 
                                className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border"
                                style={{ 
                                  backgroundColor: hexToRgba(stage.color || '#3b82f6', 0.08), 
                                  borderColor: hexToRgba(stage.color || '#3b82f6', 0.25),
                                  color: stage.color || '#3b82f6'
                                }}
                              >
                                {stage.nome}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-right font-black text-slate-900">
                              {fmt(pic.valorMensal)}
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3 w-40">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${pic.progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-500">{pic.progressPercent}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-2">
                                {vendedor.avatarUrl ? (
                                  <img src={vendedor.avatarUrl} alt={vendedor.nome} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[9px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                    {(vendedor.nome || 'Sis').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-slate-700 font-bold">{vendedor.nome || 'Sistema'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 text-[10px] uppercase font-black">
                              {pic.contrato?.empresaEmissora?.nomeFantasia || 'JVS Group'}
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <button
                                onClick={() => setSelectedPicId(pic.id)}
                                className="p-1.5 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg hover:text-[#1B4D3E] transition-all cursor-pointer"
                              >
                                <ArrowRight size={14} className="stroke-[2.5]" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPics.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic font-bold">
                            Nenhum PIC implantação encontrado para a pesquisa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Modal de Nova Etapa / Estágio */}
      {showAddStageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
          <form 
            onSubmit={handleCreateNewStage}
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm border border-slate-100 flex flex-col gap-4 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-600">Criar Nova Etapa do PIC</h4>
              <button 
                type="button" 
                onClick={() => { setShowAddStageModal(false); setNewStageName(''); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">Nome da Etapa</label>
              <input
                type="text"
                placeholder="Ex: Treinamento Técnico"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-800 focus:border-[#1B4D3E]"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">Selecione uma Cor</label>
              <div className="grid grid-cols-5 gap-1.5 mt-0.5">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewStageColor(color)}
                    className="w-6 h-6 rounded-full border shadow-sm cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                    style={{ backgroundColor: color, borderColor: newStageColor === color ? '#0f172a' : 'rgba(0,0,0,0.1)', borderWidth: newStageColor === color ? '2px' : '1px' }}
                  >
                    {newStageColor === color && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resolveContrastColor(color) }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => { setShowAddStageModal(false); setNewStageName(''); }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Detalhes do PIC (Aba 01 a 04) */}
      {selectedPicId && (
        <PicDetailsModal
          picId={selectedPicId}
          users={users}
          onClose={() => setSelectedPicId(null)}
          refreshData={() => loadData(true)}
        />
      )}

    </div>
  );
}
