'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Building2, Users, FileText, ClipboardList, Plus, 
  Search, ShieldAlert, Edit2, Trash2, X, RefreshCw, 
  ArrowLeft, CheckCircle2, Lock, Unlock 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getTenantsWithStats, createTenantAction, 
  updateTenantAction, deleteTenantAction, checkIsSuperAdmin,
  toggleTenantActiveAction
} from './actions';

interface TenantItem {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  ativo: boolean;
  createdAt: string;
  plano: string;
  limiteUsuarios: number;
  stats: {
    users: number;
    propostas: number;
    leads: number;
    contratos: number;
  };
}

export default function TenantManagerDashboard() {
  const router = useRouter();
  // Estados de Segurança e Carga
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Estados de Dados
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Estados e helpers para Alertas e Confirmações Premium
  const [customAlert, setCustomAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [customConfirm, setCustomConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({ open: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ open: true, title, message, onConfirm });
  };

  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [plano, setPlano] = useState('STARTER');
  const [limiteUsuarios, setLimiteUsuarios] = useState(3);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // 1. Validar autorização e carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      const authorized = await checkIsSuperAdmin();
      setIsAuthorized(authorized);
      
      if (authorized) {
        const data = await getTenantsWithStats();
        setTenants(data);
      }
    } catch (err) {
      console.error('Erro ao inicializar página:', err);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Ações de CRUD
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedTenantId(null);
    setNomeFantasia('');
    setCnpj('');
    setPlano('STARTER');
    setLimiteUsuarios(3);
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: TenantItem) => {
    setModalMode('edit');
    setSelectedTenantId(t.id);
    setNomeFantasia(t.nomeFantasia);
    setCnpj(t.cnpj);
    setPlano(t.plano || 'STARTER');
    setLimiteUsuarios(t.limiteUsuarios || 3);
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      if (modalMode === 'create') {
        const res = await createTenantAction(nomeFantasia, cnpj, plano, limiteUsuarios);
        if (res.success) {
          setModalSuccess('Empresa cadastrada com sucesso!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 1500);
        } else {
          setModalError(res.error || 'Erro ao cadastrar empresa.');
        }
      } else {
        if (!selectedTenantId) return;
        const res = await updateTenantAction(selectedTenantId, nomeFantasia, cnpj, plano, limiteUsuarios);
        if (res.success) {
          setModalSuccess('Cadastro atualizado com sucesso!');
          setTimeout(() => {
            setModalOpen(false);
            loadData();
          }, 1500);
        } else {
          setModalError(res.error || 'Erro ao atualizar dados.');
        }
      }
    } catch (err: any) {
      setModalError(err.message || 'Ocorreu um erro no servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async (t: TenantItem) => {
    const confirmMessage = `Tem certeza absoluta de que deseja EXCLUIR a empresa "${t.nomeFantasia}" (CNPJ: ${t.cnpj})?\n\nATENÇÃO: Isso apagará permanentemente todos os usuários, propostas, contratos, leads e insumos vinculados a ela!`;
    showConfirm(
      'Excluir Empresa SaaS',
      confirmMessage,
      async () => {
        setLoading(true);
        try {
          const res = await deleteTenantAction(t.id);
          if (res.success) {
            showAlert('Sucesso', 'Empresa removida com sucesso!', 'success');
            loadData();
          } else {
            showAlert('Erro ao Excluir', 'Erro ao excluir: ' + res.error, 'error');
            setLoading(false);
          }
        } catch (err: any) {
          showAlert('Falha Crítica', 'Falha crítica de comunicação: ' + err.message, 'error');
          setLoading(false);
        }
      }
    );
  };

  const handleToggleActive = async (t: TenantItem) => {
    const newActiveState = !t.ativo;
    const confirmMessage = `Deseja realmente ${newActiveState ? 'ATIVAR' : 'SUSPENDER / BLOQUEAR'} o acesso de "${t.nomeFantasia}"?`;
    
    showConfirm(
      newActiveState ? 'Ativar Empresa' : 'Suspender Empresa',
      confirmMessage,
      async () => {
        setActionLoading(true);
        try {
          const res = await toggleTenantActiveAction(t.id, newActiveState);
          if (res.success) {
            showAlert('Status Atualizado', `Empresa ${newActiveState ? 'ativada' : 'suspensa'} com sucesso!`, 'success');
            setTenants(prev => prev.map(item => item.id === t.id ? { ...item, ativo: newActiveState } : item));
          } else {
            showAlert('Erro', 'Erro ao alterar status: ' + res.error, 'error');
          }
        } catch (err: any) {
          showAlert('Falha Crítica', 'Falha crítica de comunicação: ' + err.message, 'error');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // 3. Filtros
  const filteredTenants = tenants.filter(t =>
    t.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm)
  );

  // Cálculos de KPI Global
  const kpis = {
    totalTenants: tenants.length,
    totalAtivos: tenants.filter(t => t.ativo !== false).length,
    totalSuspensos: tenants.filter(t => t.ativo === false).length,
    totalUsers: tenants.reduce((acc, t) => acc + t.stats.users, 0),
    totalPropostas: tenants.reduce((acc, t) => acc + t.stats.propostas, 0),
    totalContratos: tenants.reduce((acc, t) => acc + t.stats.contratos, 0)
  };

  // Tela de carregamento inicial
  if (loading && isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-[#1B4D3E]/20 border border-[#10B981]/30 rounded-xl flex items-center justify-center animate-spin">
            <RefreshCw className="text-[#10B981]" size={24} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#10B981] animate-pulse">Autenticando Super Admin...</span>
        </div>
      </div>
    );
  }

  // Tela de Acesso Negado (Segurança estrita)
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-950/20">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Acesso Restrito</h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Você não possui privilégios de Super Administrador. Esta área é restrita exclusivamente aos administradores master da plataforma SmartBidHub.
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => router.push('/')}
              className="w-full py-4.5 bg-slate-900 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-slate-800 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-full mx-auto space-y-6">

          {/* CABEÇALHO */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-black text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <Building2 size={24} /> Gestão de Empresas SaaS
              </h1>
              <p className="text-slate-500 text-sm mt-1">Super Admin Panel • Controle de Clientes Inquilinos (Tenants)</p>
            </div>
            <div>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={18} /> Nova Empresa SaaS
              </button>
            </div>
          </header>

          {/* CARDS DE KPIS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Empresas Ativas', value: kpis.totalAtivos.toString(), icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Contas Suspensas', value: kpis.totalSuspensos.toString(), icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
              { label: 'Colaboradores Totais', value: kpis.totalUsers.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
              { label: 'Propostas Emitidas', value: kpis.totalPropostas.toString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
            ].map((stat, i) => (
              <div key={i} className={`p-5 bg-white border border-slate-300 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow`}>
                <div className={`p-3 bg-slate-50 rounded-xl border border-slate-200`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-black text-slate-800 leading-none mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FILTRO DE BUSCA */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por Empresa ou CNPJ..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              <span>{filteredTenants.length} empresa{filteredTenants.length !== 1 ? 's' : ''} cadastrada{filteredTenants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* TABELA DE EMPRESAS */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden">
            <div className="p-4 border-b border-slate-300 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} /> Contas de Inquilinos Cadastrados
              </h2>
              <button 
                onClick={loadData} 
                title="Recarregar dados"
                className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Nome Fantasia</th>
                    <th className="px-6 py-3.5">CNPJ</th>
                    <th className="px-6 py-3.5">Plano / Limite</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-center">Colaboradores</th>
                    <th className="px-6 py-3.5 text-center">Leads CRM</th>
                    <th className="px-6 py-3.5 text-center">Propostas</th>
                    <th className="px-6 py-3.5 text-center">Contratos</th>
                    <th className="px-6 py-3.5">Cadastrado em</th>
                    <th className="px-6 py-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2 justify-center">
                          <RefreshCw size={20} className="animate-spin text-[#1B4D3E]" />
                          <span>Carregando dados das empresas...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        Nenhuma empresa encontrada cadastrada na plataforma.
                      </td>
                    </tr>
                  ) : filteredTenants.map((t) => {
                    const isMainOperator = t.cnpj === '00.000.000/0001-00';
                    return (
                      <tr key={t.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                              isMainOperator ? 'bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {t.nomeFantasia.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                {t.nomeFantasia}
                                {isMainOperator && (
                                  <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-[8px] font-black uppercase px-2 py-0.5 rounded border border-[#1B4D3E]/20 tracking-wider">
                                    Operator
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {t.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{t.cnpj}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div>
                              {t.plano === 'PRO' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                                  Pro
                                </span>
                              ) : t.plano === 'ENTERPRISE' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                                  Enterprise
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
                                  Starter
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-bold">
                              {t.stats.users} / {t.limiteUsuarios} users
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {t.ativo !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspenso
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.users}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.leads}</td>
                        <td className="px-6 py-4 text-center font-bold text-[#1B4D3E]">{t.stats.propostas}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.contratos}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              onClick={() => handleToggleActive(t)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                t.ativo !== false
                                  ? 'text-[#EF4444] hover:text-[#DC2626] hover:bg-rose-50'
                                  : 'text-[#10B981] hover:text-[#059669] hover:bg-emerald-50'
                              }`}
                              title={
                                t.ativo !== false 
                                  ? "Suspender / Bloquear Acesso" 
                                  : "Reativar / Liberar Acesso"
                              }
                            >
                              {t.ativo !== false ? <Lock size={15} /> : <Unlock size={15} />}
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="text-amber-500 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Cadastro"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(t)}
                              className="p-1.5 rounded-lg transition-colors cursor-pointer text-[#EF4444] hover:text-[#DC2626] hover:bg-red-50"
                              title="Excluir Empresa"
                            >
                              <Trash2 size={15} />
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

        </div>
      </main>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-[#1B4D3E]" /> 
                {modalMode === 'create' ? 'Cadastrar Empresa SaaS' : 'Editar Dados Cadastrais'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTenant} className="p-5 space-y-4">
              
              {/* Nome Fantasia */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome Fantasia da Empresa</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Alfa Facilities Ltda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={nomeFantasia}
                  onChange={e => setNomeFantasia(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">CNPJ Oficial</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: 11.222.333/0001-44"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={cnpj}
                  onChange={e => setCnpj(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Plano */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Plano Assinado</label>
                <select 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700 cursor-pointer"
                  value={plano}
                  onChange={e => {
                    const newPlano = e.target.value;
                    setPlano(newPlano);
                    if (newPlano === 'STARTER') setLimiteUsuarios(3);
                    else if (newPlano === 'PRO') setLimiteUsuarios(10);
                    else if (newPlano === 'ENTERPRISE') setLimiteUsuarios(100);
                  }}
                  disabled={actionLoading}
                >
                  <option value="STARTER">Starter (3 users)</option>
                  <option value="PRO">Pro (10 users)</option>
                  <option value="ENTERPRISE">Enterprise (100 users)</option>
                </select>
              </div>

              {/* Limite de Usuários */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Limite de Usuários</label>
                <input 
                  type="number"
                  required
                  min={1}
                  max={9999}
                  placeholder="Ex: 3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={limiteUsuarios}
                  onChange={e => setLimiteUsuarios(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>

              {/* Alert de Sucesso */}
              {modalSuccess && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 size={16} />
                  {modalSuccess}
                </div>
              )}

              {/* Alert de Erro */}
              {modalError && (
                <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <ShieldAlert size={16} />
                  {modalError}
                </div>
              )}

              {/* Controles de Ação */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-[#1B4D3E] text-white rounded-xl hover:bg-[#13382d] cursor-pointer flex items-center gap-1.5 shadow-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    modalMode === 'create' ? 'Cadastrar Empresa' : 'Salvar Alterações'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA PREMIUM */}
      {customAlert.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg shadow-slate-100 animate-bounce">
                {customAlert.type === 'error' && <ShieldAlert className="text-red-500" size={32} />}
                {customAlert.type === 'warning' && <ShieldAlert className="text-amber-500" size={32} />}
                {customAlert.type === 'success' && <CheckCircle2 className="text-emerald-500" size={32} />}
                {customAlert.type === 'info' && <Building2 className="text-blue-500" size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customAlert.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">{customAlert.message}</p>
              </div>
              <button 
                onClick={() => setCustomAlert(prev => ({ ...prev, open: false }))}
                className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#1B4D3E]/10 animate-pulse"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PREMIUM */}
      {customConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border border-amber-100 bg-amber-50/50 text-amber-600 shadow-lg shadow-amber-50 animate-pulse">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customConfirm.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">{customConfirm.message}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCustomConfirm(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm(prev => ({ ...prev, open: false }));
                  }}
                  className="flex-1 py-4 bg-[#1B4D3E] hover:bg-[#13382d] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#1B4D3E]/10"
                >
                  Confirmar Ação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
