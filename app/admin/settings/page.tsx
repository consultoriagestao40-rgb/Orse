'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Settings as SettingsIcon, Layers, CalendarDays, Ruler, Plus, Trash2, 
  Save, X, Tag, Edit2, Target
} from 'lucide-react';
import { 
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus 
} from '@/app/propostas/actions';
import { 
  getEscalas, createEscala, updateEscala, deleteEscala 
} from '@/app/escalas/actions';
import { 
  getUnidadesMedida, createUnidadeMedida, deleteUnidadeMedida,
  getCategorias, createCategoria, deleteCategoria,
  getTiposServico, createTipoServico, deleteTipoServico,
  getSellers
} from './actions';

type Tab = 'status' | 'escalas' | 'unidades' | 'categorias' | 'tipos' | 'metas';

export default function SettingsPage() {
  // ── Estado principal ─────────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<string>('USER');
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [loading, setLoading] = useState(true);

  // Status
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newStatusName, setNewStatusName] = useState('');

  // Tipos de Serviço
  const [tipos, setTipos] = useState<any[]>([]);
  const [newTipoNome, setNewTipoNome] = useState('');

  // Escalas
  const [escalas, setEscalas] = useState<any[]>([]);
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaForm, setEscalaForm] = useState({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });

  // Unidades de Medida
  const [unidades, setUnidades] = useState<any[]>([]);
  const [newUnidade, setNewUnidade] = useState({ nome: '' });

  // Categorias
  const [categorias, setCategorias] = useState<any[]>([]);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');

  // Metas
  const [sellers, setSellers] = useState<string[]>([]);
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // ── Verificação de acesso (deve ficar ANTES de qualquer return) ───────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          setUserRole(parsed.role || 'USER');
          setHasAccess(true);
        } catch {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  // ── Metas ────────────────────────────────────────────────────────────────────
  const loadMetas = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sb_kpi_goals');
      if (saved) {
        try {
          setMetas(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadMetas();
  }, [selectedMonth]);

  const handleSaveMeta = (sellerName: string, val: number) => {
    const goalKey = `${sellerName}_${selectedMonth}`;
    const updated = { ...metas, [goalKey]: val };
    setMetas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_kpi_goals', JSON.stringify(updated));
    }
  };

  // ── Carregamento de dados por aba ─────────────────────────────────────────────
  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [activeTab, hasAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'status') {
        const data = await getPropostaStatuses();
        setStatuses(data || []);
      } else if (activeTab === 'escalas') {
        const data = await getEscalas();
        setEscalas(data || []);
      } else if (activeTab === 'unidades') {
        const data = await getUnidadesMedida();
        setUnidades(data || []);
      } else if (activeTab === 'categorias') {
        const data = await getCategorias();
        setCategorias(data || []);
      } else if (activeTab === 'tipos') {
        const data = await getTiposServico();
        setTipos(data || []);
      } else if (activeTab === 'metas') {
        if (userRole === 'USER') {
          setActiveTab('status');
          return;
        }
        const sellersList = await getSellers();
        setSellers(sellersList || []);
        loadMetas();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // Tipos
  const handleAddTipo = async () => {
    if (!newTipoNome.trim()) {
      alert('Preencha o nome do tipo de serviço.');
      return;
    }
    const res = await createTipoServico(newTipoNome);
    if (res.success) {
      setNewTipoNome('');
      loadData();
    } else {
      alert('Erro ao adicionar tipo de serviço: ' + res.error);
    }
  };

  const handleDeleteTipo = async (id: string) => {
    if (!confirm('Remover este tipo de serviço?')) return;
    const res = await deleteTipoServico(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Status
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    const res = await createPropostaStatus(newStatusName);
    if (res.success) {
      setNewStatusName('');
      loadData();
    } else {
      alert('Erro ao adicionar status: ' + res.error);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este status?')) return;
    const res = await deletePropostaStatus(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Escalas
  const handleSaveEscala = async () => {
    if (!escalaForm.nome.trim()) return alert('O nome da escala é obrigatório.');
    setLoading(true);
    const payload = {
      nome: escalaForm.nome,
      diasTrabalhadosMes: escalaForm.diasTrabalhadosMes,
      horasMensais: escalaForm.horasMensais
    };
    if (escalaForm.id) {
      await updateEscala(escalaForm.id, payload);
    } else {
      await createEscala(payload);
    }
    setShowEscalaModal(false);
    loadData();
  };

  const openEscalaModal = (escala?: any) => {
    if (escala) {
      setEscalaForm({
        id: escala.id,
        nome: escala.nome,
        diasTrabalhadosMes: escala.diasTrabalhadosMes,
        horasMensais: escala.horasMensais
      });
    } else {
      setEscalaForm({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });
    }
    setShowEscalaModal(true);
  };

  // Unidades
  const handleAddUnidade = async () => {
    if (!newUnidade.nome.trim()) {
      alert('Preencha o nome da unidade.');
      return;
    }
    const res = await createUnidadeMedida(newUnidade.nome);
    if (res.success) {
      setNewUnidade({ nome: '' });
      loadData();
    } else {
      alert('Erro ao adicionar unidade: ' + res.error);
    }
  };

  const handleDeleteUnidade = async (id: string) => {
    if (!confirm('Remover esta unidade de medida?')) return;
    const res = await deleteUnidadeMedida(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Categorias
  const handleAddCategoria = async () => {
    if (!newCategoriaNome.trim()) {
      alert('Preencha o nome da categoria.');
      return;
    }
    const res = await createCategoria(newCategoriaNome);
    if (res.success) {
      setNewCategoriaNome('');
      loadData();
    } else {
      alert('Erro ao adicionar categoria: ' + res.error);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
    const res = await deleteCategoria(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // ── Guarda de acesso (APÓS todos os hooks) ────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <SettingsIcon size={22} /> Configurações do Sistema
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Parâmetros operacionais e tabelas auxiliares</p>
            </div>
          </header>

          {/* TABS */}
          <div className="flex gap-4 border-b border-slate-200">
            {[
              { id: 'status', label: 'Status de Proposta', icon: Layers, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'escalas', label: 'Escalas de Trabalho', icon: CalendarDays, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'unidades', label: 'Unidades de Medida', icon: Ruler, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'categorias', label: 'Categorias', icon: Tag, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'tipos', label: 'Tipos de Serviço', icon: SettingsIcon, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'metas', label: 'Metas dos Vendedores', icon: Target, roles: ['ADMIN', 'MANAGER'] },
            ].filter(tab => tab.roles.includes(userRole)).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab.id 
                    ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTEÚDO */}
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden min-h-[500px] relative">
            
            {/* 1. ABA STATUS */}
            {activeTab === 'status' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> Definição de Status das Propostas
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Novo nome de status (Ex: EM ANÁLISE)"
                      value={newStatusName}
                      onChange={e => setNewStatusName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddStatus()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddStatus}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {statuses.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider ${s.color}`}>
                          {s.nome}
                        </span>
                        <button 
                          onClick={() => handleDeleteStatus(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABA ESCALAS */}
            {activeTab === 'escalas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Gestão de Escalas de Trabalho
                  </h2>
                  <button 
                    onClick={() => openEscalaModal()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Nova Escala
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="px-4 py-3">Nome da Escala</th>
                        <th className="px-4 py-3 text-center">Dias / Mês</th>
                        <th className="px-4 py-3 text-center">Horas Mensais</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {escalas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 uppercase">{e.nome}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.diasTrabalhadosMes}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.horasMensais}h</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEscalaModal(e)} className="text-slate-400 hover:text-[#1B4D3E]"><Edit2 size={14} /></button>
                              <button onClick={() => { if(confirm('Excluir escala?')) deleteEscala(e.id).then(loadData) }} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ABA UNIDADES */}
            {activeTab === 'unidades' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} /> Unidades de Medida Disponíveis
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unidade de Medida (Ex: UN, KG, LITRO)"
                      value={newUnidade.nome}
                      onChange={e => setNewUnidade({nome: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleAddUnidade()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddUnidade}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {unidades.map(u => (
                      <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded relative group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-lg font-black text-slate-800 uppercase">{u.nome}</p>
                        <button 
                          onClick={() => handleDeleteUnidade(u.id)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABA CATEGORIAS */}
            {activeTab === 'categorias' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Tag size={14} /> Gestão de Categorias Geral
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Categoria (Ex: MATERIAL DE LIMPEZA)"
                      value={newCategoriaNome}
                      onChange={e => setNewCategoriaNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategoria()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddCategoria}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {categorias.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700 uppercase">{c.nome}</span>
                        <button 
                          onClick={() => handleDeleteCategoria(c.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ABA TIPOS DE SERVIÇO */}
            {activeTab === 'tipos' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <SettingsIcon size={14} /> Gestão de Tipos de Serviço
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Tipo de Serviço (Ex: Limpeza e Conservação)"
                      value={newTipoNome}
                      onChange={e => setNewTipoNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold"
                    />
                    <button 
                      onClick={handleAddTipo}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tipos.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700">{t.nome}</span>
                        <button 
                          onClick={() => handleDeleteTipo(t.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. ABA METAS DOS VENDEDORES — somente ADMIN e MANAGER */}
            {activeTab === 'metas' && userRole !== 'USER' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Metas Mensais por Vendedor
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-200 font-bold uppercase">Mês de Referência:</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase">Como funciona?</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Selecione o mês de referência e insira as metas individuais dos vendedores nos campos abaixo. 
                        As metas são salvas automaticamente após a alteração dos valores e serão exibidas na aba de <strong>Controladoria</strong> para monitorar o atingimento.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    {sellers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum vendedor cadastrado no sistema.</p>
                    ) : (
                      sellers.map((nome) => {
                        const goalKey = `${nome}_${selectedMonth}`;
                        const goalVal = metas[goalKey] !== undefined ? metas[goalKey] : 100000;

                        return (
                          <div key={nome} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-xs transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#1B4D3E]/10 text-[#1B4D3E] font-black rounded-xl flex items-center justify-center text-xs">
                                {nome.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{nome}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meta: R$</span>
                              <input
                                type="number"
                                value={goalVal}
                                onChange={(e) => {
                                  const newVal = Number(e.target.value);
                                  handleSaveMeta(nome, newVal);
                                }}
                                className="w-36 px-3 py-2 border border-slate-300 rounded text-xs font-extrabold text-slate-800 text-right outline-none focus:border-[#1B4D3E]"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Sincronizando...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL ESCALA */}
        {showEscalaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={14} /> {escalaForm.id ? 'Editar' : 'Nova'} Escala de Trabalho
                </h2>
                <button onClick={() => setShowEscalaModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome da Escala</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all" value={escalaForm.nome} onChange={e => setEscalaForm({...escalaForm, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias Trab. / Mês</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.diasTrabalhadosMes} onChange={e => setEscalaForm({...escalaForm, diasTrabalhadosMes: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horas Mensais</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.horasMensais} onChange={e => setEscalaForm({...escalaForm, horasMensais: Number(e.target.value)})} />
                  </div>
                </div>
                <button onClick={handleSaveEscala} className="w-full bg-[#1B4D3E] hover:bg-emerald-900 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-4">
                  <Save size={18} /> Salvar Escala
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
