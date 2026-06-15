'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Target, 
  HelpCircle, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  PlusCircle, 
  StickyNote, 
  ArrowRight, 
  Sparkles,
  ClipboardList,
  Activity,
  Layers,
  Percent,
  Edit,
  X
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
  RootCauseAnalysis, 
  ActionPlan, 
  OKRCiclo, 
  OKRObjective, 
  KR, 
  BrainstormPostit 
} from './actions';

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

  // Modals & Form States
  const [isCausaModalOpen, setIsCausaModalOpen] = useState(false);
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
    causaRaiz: ''
  });

  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
  const [currentPlano, setCurrentPlano] = useState<Partial<ActionPlan>>({
    titulo: '',
    causaRaizId: '',
    problemaDireto: '',
    responsavelId: '',
    resultadoEsperado: '',
    what: '',
    why: '',
    where: '',
    when: '',
    who: '',
    how: '',
    howMuch: 0,
    percentualRealizado: 0,
    status: 'PENDENTE'
  });

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
    const res = await saveRootCause(currentCausa as RootCauseAnalysis);
    if (res.success) {
      setIsCausaModalOpen(false);
      await loadData();
    } else {
      alert('Erro ao salvar análise de causa: ' + res.error);
      setLoading(false);
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
      setIsPlanoModalOpen(false);
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
  const totalAcoes = planosAcao.length;
  const concluídasAcoes = planosAcao.filter(pa => pa.status === 'CONCLUIDO').length;
  const atrasadasAcoes = planosAcao.filter(pa => pa.status === 'ATRASADO').length;
  const pendentesAcoes = planosAcao.filter(pa => pa.status === 'PENDENTE').length;

  const pctExecucao = totalAcoes > 0 ? Math.round((concluídasAcoes / totalAcoes) * 100) : 0;
  const pctAtrasadas = totalAcoes > 0 ? Math.round((atrasadasAcoes / totalAcoes) * 100) : 0;
  const pctPendentes = totalAcoes > 0 ? Math.round((pendentesAcoes / totalAcoes) * 100) : 0;

  // OKR calculations
  const activeCiclo = okrCiclos.find(c => c.id === activeCicloId);
  const totalKRs = activeCiclo?.objetivos.reduce((acc, obj) => acc + obj.krs.length, 0) || 0;
  const KRsBatinados = activeCiclo?.objetivos.reduce((acc, obj) => 
    acc + krCountReached(obj.krs), 0) || 0;

  function krCountReached(krs: KR[]): number {
    return krs.filter(kr => {
      if (kr.valorAlvo >= kr.valorInicial) {
        return kr.valorAtual >= kr.valorAlvo;
      } else {
        return kr.valorAtual <= kr.valorAlvo;
      }
    }).length;
  }

  return (
    <div id="planejamento-layout-root" className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 no-print p-4 md:p-6 overflow-y-auto">
        <div className="space-y-6 max-w-[1600px] mx-auto w-full px-2 sm:px-4">
          
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
              {activeTab === 'causas' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setCurrentCausa({
                        tipo: '5_PORQUES',
                        problema: '',
                        porques: ['', '', '', '', ''],
                        ishikawa: { metodo: [], materiaPrima: [], maoDeObra: [], maquina: [], medida: [], meioAmbiente: [] },
                        causaRaiz: ''
                      });
                      setIsCausaModalOpen(true);
                    }}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
                        causaRaiz: ''
                      });
                      setIsCausaModalOpen(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <PlusCircle size={14} /> Novo Ishikawa
                  </button>
                </div>
              )}
              {activeTab === 'planos' && (
                <button 
                  onClick={() => {
                    setCurrentPlano({
                      titulo: '',
                      causaRaizId: '',
                      problemaDireto: '',
                      responsavelId: '',
                      resultadoEsperado: '',
                      what: '',
                      why: '',
                      where: '',
                      when: new Date().toISOString().split('T')[0],
                      who: '',
                      how: '',
                      howMuch: 0,
                      percentualRealizado: 0,
                      status: 'PENDENTE'
                    });
                    setIsPlanoModalOpen(true);
                  }}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle size={14} /> Novo Plano 5W2H
                </button>
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

          {/* TAB CONTENTS */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-250 border-t-[#1B4D3E] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* ABA 1: CAUSA RAIZ & ISHIKAWA */}
              {activeTab === 'causas' && (
                <div className="space-y-8">
                  {causas.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm">
                      Nenhuma análise de causa raiz cadastrada. Clique em "Nova Análise" para começar.
                    </div>
                  ) : (
                    causas.map(c => (
                      <div key={c.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center select-none">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8.5px] font-black uppercase tracking-wider bg-slate-200 text-slate-650 px-1.5 py-0.5 rounded">
                                {c.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa / Espinha de Peixe'}
                              </span>
                              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide truncate max-w-[250px] sm:max-w-xl">
                                {c.tipo === '5_PORQUES' ? c.problema : `Efeito: ${c.problema}`}
                              </h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wide">
                              Criada em {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCurrentCausa(c);
                                setIsCausaModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-[#1B4D3E] hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                              title="Editar Análise"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCausaObj(c.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Excluir Análise"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-6">
                          {c.tipo === '5_PORQUES' ? (
                            /* 5 Porquês view */
                            <div className="max-w-3xl mx-auto space-y-4">
                              <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1 pb-2 border-b border-slate-100">
                                <Sparkles size={13} /> Análise dos 5 Porquês
                              </h4>
                              <div className="relative pl-6 space-y-4 mt-3">
                                <div className="absolute left-2.5 top-2 bottom-6 w-0.5 border-l-2 border-dashed border-[#1B4D3E]/20"></div>
                                {c.porques.map((pq, idx) => pq && (
                                  <div key={idx} className="relative flex items-start gap-3">
                                    <div className="absolute -left-[23px] top-1.5 w-3 h-3 bg-[#1B4D3E] border-2 border-white rounded-full shadow-xs"></div>
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex-1">
                                      <span className="text-[9px] font-black text-slate-400 block uppercase mb-1">Porquê {idx + 1}</span>
                                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{pq}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mt-4">
                                <span className="text-[9px] font-black text-[#1B4D3E] block uppercase tracking-wider">Causa Raiz Conclusiva</span>
                                <p className="text-xs font-black text-slate-800 mt-1 leading-relaxed">{c.causaRaiz}</p>
                              </div>
                            </div>
                          ) : (
                            /* Diagrama de Ishikawa / Fishbone view */
                            <div className="space-y-6">
                              <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1 pb-2 border-b border-slate-100">
                                <Activity size={13} /> Diagrama de Ishikawa Padrão (Espinha de Peixe)
                              </h4>
                              
                              <div className="overflow-x-auto w-full select-none bg-slate-50/50 border border-slate-200 rounded-2xl p-6 min-w-[850px] relative">
                                <div className="flex flex-col relative w-full h-[360px] max-w-[950px] mx-auto">
                                  
                                  {/* 1. TOP BONES */}
                                  <div className="grid grid-cols-3 gap-6 absolute top-0 left-0 w-[80%] h-[140px] z-10">
                                    {[
                                      { title: 'Método', key: 'metodo', bg: 'bg-blue-50 border-blue-200 text-blue-800' },
                                      { title: 'Mão de Obra', key: 'maoDeObra', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                                      { title: 'Máquina', key: 'maquina', bg: 'bg-purple-50 border-purple-200 text-purple-800' }
                                    ].map((cat, idx) => {
                                      const list = (c.ishikawa as any)[cat.key] || [];
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
                                          
                                          {/* Diagonal SVG line to backbone */}
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
                                      {/* backbone arrow end */}
                                      <div className="absolute right-[-10px] top-[50%] translate-y-[-50%] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-slate-400"></div>
                                    </div>
                                    
                                    {/* Fish Head / Problem box */}
                                    <div className="w-[20%] shrink-0 ml-4 bg-[#1B4D3E] text-white border border-[#10B981]/30 rounded-2xl p-3 shadow-md flex items-center justify-center text-center text-[10.5px] font-black uppercase tracking-wider h-[80px] overflow-y-auto">
                                      {c.problema}
                                    </div>
                                  </div>

                                  {/* 3. BOTTOM BONES */}
                                  <div className="grid grid-cols-3 gap-6 absolute bottom-0 left-0 w-[80%] h-[140px] z-10">
                                    {[
                                      { title: 'Matéria-prima', key: 'materiaPrima', bg: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
                                      { title: 'Medida', key: 'medida', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
                                      { title: 'Meio Ambiente', key: 'meioAmbiente', bg: 'bg-rose-50 border-rose-200 text-rose-800' }
                                    ].map((cat, idx) => {
                                      const list = (c.ishikawa as any)[cat.key] || [];
                                      return (
                                        <div key={cat.key} className="flex flex-col justify-end h-full relative">
                                          
                                          {/* Diagonal SVG line to backbone */}
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

                              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
                                <span className="text-[9px] font-black text-[#1B4D3E] block uppercase tracking-wider">Causa Raiz Identificada</span>
                                <p className="text-xs font-black text-slate-800 mt-1 leading-relaxed">{c.causaRaiz}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ABA 2: PLANO DE AÇÃO 5W2H */}
              {activeTab === 'planos' && (
                <div className="space-y-6">
                  {planosAcao.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic text-sm">
                      Nenhum plano de ação cadastrado. Clique em "Novo Plano 5W2H" para iniciar.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {planosAcao.map(pa => {
                        const associatedCausa = causas.find(c => c.id === pa.causaRaizId);
                        const responsavel = users.find(u => u.id === pa.responsavelId);
                        
                        let statusColor = 'bg-blue-50 border-blue-200 text-blue-700';
                        if (pa.status === 'CONCLUIDO') statusColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                        else if (pa.status === 'ATRASADO') statusColor = 'bg-red-50 border-red-200 text-red-700';

                        return (
                          <div key={pa.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-all relative group">
                            
                            <button 
                              onClick={() => handleDeletePlanoObj(pa.id)}
                              className="absolute top-4 right-4 text-slate-350 hover:text-red-500 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>

                            <div className="space-y-3">
                              {/* Causa raiz vinculada */}
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[8.5px] font-black uppercase bg-slate-100 border border-slate-250 text-slate-500 rounded px-1.5 py-0.5 truncate max-w-[200px]">
                                  {associatedCausa ? `Causa: ${associatedCausa.causaRaiz}` : pa.problemaDireto ? `Prob: ${pa.problemaDireto}` : 'Problema Direto'}
                                </span>
                                <span className={`text-[8.5px] font-black uppercase border rounded px-1.5 py-0.5 ${statusColor}`}>
                                  {pa.status === 'CONCLUIDO' ? 'Concluído' : pa.status === 'ATRASADO' ? 'Atrasado' : 'Pendente'}
                                </span>
                              </div>

                              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-tight">
                                {pa.titulo}
                              </h3>

                              {/* 5W2H Details */}
                              <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100 text-[10px] space-y-1.5">
                                <div><span className="font-extrabold text-slate-500 uppercase">What (O que):</span> <span className="font-bold text-slate-700">{pa.what}</span></div>
                                <div><span className="font-extrabold text-slate-500 uppercase">Why (Por que):</span> <span className="font-bold text-slate-700">{pa.why}</span></div>
                                <div><span className="font-extrabold text-slate-500 uppercase">Where (Onde):</span> <span className="font-bold text-slate-700">{pa.where}</span></div>
                                <div><span className="font-extrabold text-slate-500 uppercase">How (Como):</span> <span className="font-bold text-slate-700">{pa.how}</span></div>
                                <div><span className="font-extrabold text-slate-500 uppercase">Cost (Quanto):</span> <span className="font-bold text-slate-700">{pa.howMuch > 0 ? `R$ ${pa.howMuch}` : 'Sem custo'}</span></div>
                              </div>
                            </div>

                            {/* Progress & Responsibility */}
                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                              {/* Slider de progresso */}
                              <div className="flex-1 pr-6 flex flex-col gap-1">
                                <div className="flex justify-between text-[9px] font-black text-slate-400">
                                  <span>PROGRESO</span>
                                  <span>{pa.percentualRealizado}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 relative overflow-hidden">
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
                                    className="w-8 h-8 rounded-full object-cover border border-slate-150 shadow-2xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#1B4D3E] text-white font-black text-[10px] flex items-center justify-center border border-slate-150 shadow-2xs shrink-0 uppercase">
                                    {responsavel?.nome ? responsavel.nome.substring(0, 2) : 'RS'}
                                  </div>
                                )}
                                
                                {/* Tooltip */}
                                <div className="absolute right-0 bottom-9 bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover/avatar:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-30 border border-white/10">
                                  {responsavel?.nome || pa.who || 'Sem responsável'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                            Duração: {new Date(activeCiclo.dataInicio).toLocaleDateString('pt-BR')} até {new Date(activeCiclo.dataFim).toLocaleDateString('pt-BR')}
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
          )}

        </div>
      </main>

      {/* MODAL 5 PORQUÊS */}
      {isCausaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {currentCausa.id 
                  ? `Editar Análise: ${currentCausa.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}`
                  : `Nova Análise: ${currentCausa.tipo === '5_PORQUES' ? '5 Porquês' : 'Ishikawa'}`
                }
              </h3>
              <button onClick={() => setIsCausaModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSaveCausa} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Método de Análise</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentCausa(prev => ({ ...prev, tipo: '5_PORQUES' }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
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
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        currentCausa.tipo === 'ISHIKAWA'
                          ? 'bg-slate-800 border-slate-800 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Ishikawa (6 Ms)
                    </button>
                  </div>
                </div>

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
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Análise dos 5 Porquês</label>
                  {currentCausa.porques?.map((pq, idx) => (
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
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                        placeholder={`Por que esse problema ocorre?`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Condicional para Diagrama de Ishikawa */}
              {currentCausa.tipo === 'ISHIKAWA' && (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Espinhos de Ishikawa (6 Ms)</label>
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
                    <div key={m.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center select-none">
                        <div>
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block">{m.title}</span>
                          <span className="text-[9px] text-slate-400 font-bold block">{m.desc}</span>
                        </div>
                      </div>
                      
                      {/* Badge list */}
                      <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
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

                      {/* Input for adding new cause */}
                      <div className="flex gap-2">
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
                          Adicionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-1">
                <label className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wider block">Causa Raiz Conclusiva</label>
                <input 
                  type="text" 
                  required
                  value={currentCausa.causaRaiz || ''}
                  onChange={(e) => setCurrentCausa(prev => ({ ...prev, causaRaiz: e.target.value }))}
                  className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 outline-none focus:border-[#1B4D3E]"
                  placeholder="Conclusão final da causa raiz"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCausaModalOpen(false)}
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

      {/* MODAL PLANO DE AÇÃO 5W2H */}
      {isPlanoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cadastrar Plano de Ação 5W2H</h3>
              <button onClick={() => setIsPlanoModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={16} />
              </button>
            </header>
            
            <form onSubmit={handleSavePlano} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Título da Ação</label>
                  <input 
                    type="text" 
                    required
                    value={currentPlano.titulo || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Ex: Treinamento de motoristas no aplicativo"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Vincular Análise Causa Raiz</label>
                  <select
                    value={currentPlano.causaRaizId || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, causaRaizId: e.target.value, problemaDireto: '' }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="">Nenhum vínculo (Entrada Direta)</option>
                    {causas.map(c => (
                      <option key={c.id} value={c.id}>{c.causaRaiz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!currentPlano.causaRaizId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Problema Direto (Opcional)</label>
                  <input 
                    type="text"
                    value={currentPlano.problemaDireto || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, problemaDireto: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Caso não tenha feito a análise, insira o problema aqui"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Responsável (Sistema)</label>
                  <select
                    required
                    value={currentPlano.responsavelId || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, responsavelId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                  >
                    <option value="">Selecione o Responsável...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Resultado Esperado</label>
                  <input 
                    type="text" 
                    required
                    value={currentPlano.resultadoEsperado || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, resultadoEsperado: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Métricas ou resultados que desejamos atingir"
                  />
                </div>
              </div>

              {/* 5W2H Framework */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Campos 5W2H</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">What (O que fará)</label>
                    <input type="text" required value={currentPlano.what || ''} onChange={(e) => setCurrentPlano(prev => ({ ...prev, what: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Why (Por que fará)</label>
                    <input type="text" required value={currentPlano.why || ''} onChange={(e) => setCurrentPlano(prev => ({ ...prev, why: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Where (Onde fará)</label>
                    <input type="text" required value={currentPlano.where || ''} onChange={(e) => setCurrentPlano(prev => ({ ...prev, where: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">When (Quando / Prazo)</label>
                    <input type="date" required value={currentPlano.when || ''} onChange={(e) => setCurrentPlano(prev => ({ ...prev, when: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">How (Como fará)</label>
                    <input type="text" required value={currentPlano.how || ''} onChange={(e) => setCurrentPlano(prev => ({ ...prev, how: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">How Much (Custo R$)</label>
                    <input type="number" required value={currentPlano.howMuch || 0} onChange={(e) => setCurrentPlano(prev => ({ ...prev, howMuch: parseFloat(e.target.value) }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Percentual Realizado ({currentPlano.percentualRealizado}%)</label>
                  <input 
                    type="range" 
                    min="0"
                    max="100"
                    step="5"
                    value={currentPlano.percentualRealizado || 0}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, percentualRealizado: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Resultado Atingido (Pós-Execução)</label>
                  <input 
                    type="text"
                    value={currentPlano.resultadoAtingido || ''}
                    onChange={(e) => setCurrentPlano(prev => ({ ...prev, resultadoAtingido: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                    placeholder="Resultados alcançados"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPlanoModalOpen(false)}
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
