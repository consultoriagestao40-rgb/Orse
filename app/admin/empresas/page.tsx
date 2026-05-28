'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Building2, Users, FileText, ClipboardList, Plus, 
  Search, ShieldAlert, Edit2, Trash2, X, RefreshCw, 
  ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getTenantsWithStats, createTenantAction, 
  updateTenantAction, deleteTenantAction, checkIsSuperAdmin 
} from './actions';

interface TenantItem {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  createdAt: string;
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

  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
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
    setModalError('');
    setModalSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: TenantItem) => {
    setModalMode('edit');
    setSelectedTenantId(t.id);
    setNomeFantasia(t.nomeFantasia);
    setCnpj(t.cnpj);
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
        const res = await createTenantAction(nomeFantasia, cnpj);
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
        const res = await updateTenantAction(selectedTenantId, nomeFantasia, cnpj);
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
    if (t.cnpj === '00.000.000/0001-00' || t.nomeFantasia === 'Grupo JVS') {
      alert('A empresa mãe do Grupo JVS não pode ser removida da plataforma por motivos de segurança.');
      return;
    }

    const confirmMessage = `Tem certeza absoluta de que deseja EXCLUIR a empresa "${t.nomeFantasia}" (CNPJ: ${t.cnpj})?\n\nATENÇÃO: Isso apagará permanentemente todos os usuários, propostas, contratos, leads e insumos vinculados a esta empresa de forma irreversível!`;
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await deleteTenantAction(t.id);
      if (res.success) {
        alert('Empresa removida com sucesso!');
        loadData();
      } else {
        alert('Erro ao excluir: ' + res.error);
        setLoading(false);
      }
    } catch (err: any) {
      alert('Falha crítica de comunicação: ' + err.message);
      setLoading(false);
    }
  };

  // 3. Filtros
  const filteredTenants = tenants.filter(t =>
    t.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj.includes(searchTerm)
  );

  // Cálculos de KPI Global
  const kpis = {
    totalTenants: tenants.length,
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
              { label: 'Empresas Ativas', value: kpis.totalTenants.toString(), icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
              { label: 'Colaboradores Ativos', value: kpis.totalUsers.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Propostas Totais', value: kpis.totalPropostas.toString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Contratos Vigentes', value: kpis.totalContratos.toString(), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
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
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2 justify-center">
                          <RefreshCw size={20} className="animate-spin text-[#1B4D3E]" />
                          <span>Carregando dados das empresas...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
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
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.users}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.leads}</td>
                        <td className="px-6 py-4 text-center font-bold text-[#1B4D3E]">{t.stats.propostas}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.stats.contratos}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="text-amber-500 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Cadastro"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(t)}
                              disabled={isMainOperator}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isMainOperator 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isMainOperator ? "Empresa master protegida" : "Excluir Empresa"}
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
    </div>
  );
}
