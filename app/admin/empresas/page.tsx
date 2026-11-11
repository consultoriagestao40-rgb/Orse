'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Building2, Users, FileText, ClipboardList, Plus, 
  Search, ShieldAlert, Edit2, Trash2, X, RefreshCw, 
  ArrowLeft, CheckCircle2, Lock, Unlock, Layers,
  Mail, Send, AlertTriangle, Eye, EyeOff, Save, MessageSquare, QrCode, Download
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getTenantsWithStats, createTenantAction, 
  updateTenantAction, deleteTenantAction,
  toggleTenantActiveAction, getSaaSFinancialMetrics,
  getAllCobrancasAction, manuallyConfirmPaymentAction,
  manuallyCreateInvoiceAction, getPlanConfigs, updatePlanConfigAction
} from './actions';
import { 
  getSystemSmtpSettings, saveSystemSmtpSettings, testSystemSmtpConnection,
  getSystemWhatsAppSettings, saveSystemWhatsAppSettings, getSystemWhatsAppQrCode,
  disconnectSystemWhatsAppInstance, testSystemWhatsAppConnection
} from '@/app/admin/settings/actions';

interface TenantItem {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  ativo: boolean;
  createdAt: string;
  plano: string;
  limiteUsuarios: number;
  trialStartedAt?: string | null;
  taxaWhatsapp: number;
  stats: {
    users: number;
    propostas: number;
    leads: number;
    contratos: number;
  };
}

function TenantManagerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'empresas' | 'faturamento' | 'smtp' | 'whatsapp' | null;

  // Auth é garantida pelo layout.tsx Server Component
  // Se chegou aqui, o usuário já é Super Admin verificado no servidor
  const [loading, setLoading] = useState(true);

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
  const [trialStartedAt, setTrialStartedAt] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const [taxaWhatsapp, setTaxaWhatsapp] = useState<number>(130.0);
  
  // Faturamento SaaS Admin States
  const [adminTab, setAdminTab] = useState<'empresas' | 'faturamento' | 'smtp' | 'whatsapp'>(() => {
    if (tabFromUrl && ['empresas', 'faturamento', 'smtp', 'whatsapp'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'empresas';
  });

  useEffect(() => {
    if (tabFromUrl && ['empresas', 'faturamento', 'smtp', 'whatsapp'].includes(tabFromUrl)) {
      setAdminTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setAdminTab('empresas');
    }
  }, [tabFromUrl]);

  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [allCobrancas, setAllCobrancas] = useState<any[]>([]);

  // Estados de WhatsApp Oficial Central (Z-API SaaS)
  const [waOfficialInstanceId, setWaOfficialInstanceId] = useState('');
  const [waOfficialToken, setWaOfficialToken] = useState('');
  const [waOfficialClientToken, setWaOfficialClientToken] = useState('');
  const [waOfficialActive, setWaOfficialActive] = useState(true);
  const [waOfficialConfigured, setWaOfficialConfigured] = useState(false);
  const [waOfficialConnected, setWaOfficialConnected] = useState(false);
  const [waOfficialPhone, setWaOfficialPhone] = useState('');
  const [waOfficialLoading, setWaOfficialLoading] = useState(false);
  const [waOfficialError, setWaOfficialError] = useState('');
  const [waOfficialSuccess, setWaOfficialSuccess] = useState('');
  const [showWaClientToken, setShowWaClientToken] = useState(false);
  const [waOfficialQrCode, setWaOfficialQrCode] = useState<string | null>(null);
  const [waOfficialQrLoading, setWaOfficialQrLoading] = useState(false);
  const [waTestPhone, setWaTestPhone] = useState('');
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Estados de E-mail do Sistema (SaaS SMTP Hostinger)
  const [smtpHost, setSmtpHost] = useState('smtp.hostinger.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('SmartBid • Notificações');
  const [smtpActive, setSmtpActive] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTestLoading, setSmtpTestLoading] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Novo Lançamento de Fatura
  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [newInvoiceTenantId, setNewInvoiceTenantId] = useState('');
  const [newInvoicePlano, setNewInvoicePlano] = useState('PRO');
  const [newInvoiceValor, setNewInvoiceValor] = useState(299.0);
  const [newInvoiceVencimento, setNewInvoiceVencimento] = useState('');

  // Configurações de Planos States
  const [plans, setPlans] = useState<any[]>([]);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [selectedPlanConfig, setSelectedPlanConfig] = useState<any>(null);
  const [planPreco, setPlanPreco] = useState(0);
  const [planLimite, setPlanLimite] = useState(0);
  const [planLabel, setPlanLabel] = useState('');
  const [planDescricao, setPlanDescricao] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  // 1. Carregar dados (auth já garantida pelo layout.tsx server component)
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTenantsWithStats();
      setTenants(data);

      // Carrega faturamento geral do SaaS
      const metricsRes = await getSaaSFinancialMetrics();
      if (metricsRes.success) {
        setFinancialMetrics(metricsRes.metrics);
      }
      
      const cobrancasRes = await getAllCobrancasAction();
      if (cobrancasRes.success) {
        setAllCobrancas(cobrancasRes.cobrancas || []);
      }

      const plansRes = await getPlanConfigs();
      if (plansRes.success) {
        setPlans(plansRes.configs || []);
      }

      // Carrega configurações SMTP do SaaS
      const smtpRes = await getSystemSmtpSettings();
      if (smtpRes && !('error' in smtpRes)) {
        setSmtpHost(smtpRes.host || 'smtp.hostinger.com');
        setSmtpPort(smtpRes.port || 465);
        setSmtpUser(smtpRes.user || '');
        setSmtpFromEmail(smtpRes.fromEmail || smtpRes.user || '');
        setSmtpFromName(smtpRes.fromName || 'SmartBid • Notificações');
        setSmtpActive(smtpRes.active ?? true);
        setSmtpConfigured(Boolean(smtpRes.configured));
      }

      // Carrega configurações do WhatsApp Oficial Central (Z-API SaaS)
      const waRes = await getSystemWhatsAppSettings();
      if (waRes && !('error' in waRes)) {
        setWaOfficialInstanceId(waRes.instanceId || '');
        setWaOfficialToken(waRes.token || '');
        setWaOfficialActive(waRes.active ?? true);
        setWaOfficialConfigured(Boolean(waRes.configured));
        setWaOfficialConnected(Boolean(waRes.connected));
        setWaOfficialPhone(waRes.phone || '');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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
    setTrialStartedAt('');
    setTaxaWhatsapp(130.0);
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
    setTrialStartedAt(t.trialStartedAt ? t.trialStartedAt.substring(0, 16) : '');
    setTaxaWhatsapp(t.taxaWhatsapp !== undefined ? t.taxaWhatsapp : 130.0);
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
        const res = await createTenantAction(nomeFantasia, cnpj, plano, limiteUsuarios, trialStartedAt || null, taxaWhatsapp);
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
        const res = await updateTenantAction(selectedTenantId, nomeFantasia, cnpj, plano, limiteUsuarios, trialStartedAt || null, taxaWhatsapp);
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

  const handleOpenEditPlanModal = (plan: any) => {
    setSelectedPlanConfig(plan);
    setPlanPreco(plan.preco);
    setPlanLimite(plan.limiteUsuarios);
    setPlanLabel(plan.label);
    setPlanDescricao(plan.descricao || '');
    setPlanFeatures(plan.features || '');
    setEditPlanModal(true);
  };

  const handleSavePlanConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanConfig) return;
    setActionLoading(true);
    try {
      const res = await updatePlanConfigAction(
        selectedPlanConfig.id,
        planPreco,
        planLimite,
        planLabel,
        planDescricao,
        planFeatures
      );
      if (res.success) {
        showAlert('Sucesso', 'Plano atualizado com sucesso!', 'success');
        setEditPlanModal(false);
        // Recarrega planos
        const plansRes = await getPlanConfigs();
        if (plansRes.success) {
          setPlans(plansRes.configs || []);
        }
      } else {
        showAlert('Erro', 'Erro ao atualizar plano: ' + res.error, 'error');
      }
    } catch (err: any) {
      showAlert('Erro Inesperado', err.message, 'error');
    } finally {
      setActionLoading(false);
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
    totalAtivos: tenants.filter(t => t.ativo !== false).length,
    totalSuspensos: tenants.filter(t => t.ativo === false).length,
    totalUsers: tenants.reduce((acc, t) => acc + t.stats.users, 0),
    totalPropostas: tenants.reduce((acc, t) => acc + t.stats.propostas, 0),
    totalContratos: tenants.reduce((acc, t) => acc + t.stats.contratos, 0)
  };


  // Tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-[#1B4D3E]/20 border border-[#10B981]/30 rounded-xl flex items-center justify-center animate-spin">
            <RefreshCw className="text-[#10B981]" size={24} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#10B981] animate-pulse">Carregando Painel Admin...</span>
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/modulos')}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Layers size={18} className="text-[#1B4D3E]" /> Precificação & Módulos
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer bell-header-spacing"
              >
                <Plus size={18} /> Nova Empresa SaaS
              </button>
            </div>
          </header>

          {adminTab === 'empresas' && (
              <div className="space-y-6 animate-in fade-in duration-300">
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
                    const isMainOperator = t.cnpj === '40.180.983/0001-00';
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
                              {((t as any).responsavelNome || (t as any).whatsappPhone) && (
                                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                                  {(t as any).responsavelNome && <span>👤 {(t as any).responsavelNome}</span>}
                                  {(t as any).whatsappPhone && <span>📱 {(t as any).whatsappPhone}</span>}
                                  {(t as any).responsavelEmail && <span className="text-slate-400">✉️ {(t as any).responsavelEmail}</span>}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{t.cnpj}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div>
                              {t.plano === 'TESTE' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide animate-pulse">
                                  Teste 30 Dias
                                </span>
                              ) : t.plano === 'PRO' ? (
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
                            {(t as any).whatsappPhone && (
                              <a
                                href={`https://wa.me/${String((t as any).whatsappPhone).replace(/\D/g, '').startsWith('55') ? String((t as any).whatsappPhone).replace(/\D/g, '') : `55${String((t as any).whatsappPhone).replace(/\D/g, '')}`}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Chamar Cliente no WhatsApp"
                              >
                                💬
                              </a>
                            )}
                            <a
                              href="/leads"
                              className="px-2 py-1 rounded-lg bg-[#1B4D3E]/10 text-[#1B4D3E] hover:bg-[#1B4D3E]/20 text-[10px] font-black uppercase tracking-wider transition-colors"
                              title="Ver no Pipeline / CRM"
                            >
                              CRM
                            </a>
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
      )}

            {/* CONTEÚDO DA ABA FATURAMENTO */}
            {adminTab === 'faturamento' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* CARDS DE KPIS FINANCEIROS GLOBAIS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-[#1B4D3E]/10 rounded-xl border border-[#1B4D3E]/20">
                      <Building2 size={20} className="text-[#1B4D3E]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MRR Consolidado (Recorrência Mensal)</p>
                      <p className="text-xl font-black text-slate-800 leading-none mt-1">
                        R$ {financialMetrics?.mrr ? financialMetrics.mrr.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Base + Add-ons Ativos</p>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receita SaaS Realizada (Pago)</p>
                      <p className="text-xl font-black text-slate-800 leading-none mt-1">
                        R$ {financialMetrics?.totalPago ? financialMetrics.totalPago.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Acumulado Histórico</p>
                    </div>
                  </div>

                  <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <ShieldAlert size={20} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cobranças Pendentes / Em Aberto</p>
                      <p className="text-xl font-black text-slate-800 leading-none mt-1">
                        R$ {financialMetrics?.totalPendente ? financialMetrics.totalPendente.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Faturas Aguardando Ação</p>
                    </div>
                  </div>
                </div>

                {/* CONFIGURAÇÃO DE PLANOS DE ASSINATURA */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    ⚙️ Configurações Gerais dos Planos de Assinatura (LP e Clientes)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((p) => {
                      const featuresCount = typeof p.features === 'string' ? p.features.split(',').length : 0;
                      return (
                        <div 
                          key={p.id}
                          className="bg-white border border-slate-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
                                PLANO {p.nome}
                              </span>
                              <span className="text-xs font-extrabold text-[#1B4D3E] bg-[#1B4D3E]/10 px-3 py-1 rounded-full">
                                {p.limiteUsuarios} Usuários
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.label}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{p.descricao || 'Sem descrição cadastrada.'}</p>
                            </div>

                            <div className="py-2 border-y border-slate-100">
                              <span className="text-lg font-black text-slate-800">R$ {p.preco.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">/ mês</span>
                            </div>

                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                              📋 {featuresCount} Benefícios listados
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenEditPlanModal(p)}
                            className="w-full py-2.5 mt-5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Edit2 size={12} /> Editar Configurações
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BARRA DE AÇÕES FINANCEIRAS */}
                <div className="flex justify-between items-center gap-4">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Controle e Auditoria Geral de Cobranças SaaS
                  </div>
                  <button
                    onClick={() => {
                      setNewInvoiceTenantId(tenants[0]?.id || '');
                      setNewInvoicePlano('PRO');
                      setNewInvoiceValor(299.0);
                      setNewInvoiceVencimento('');
                      setNewInvoiceModal(true);
                    }}
                    className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Lançar Cobrança Avulsa
                  </button>
                </div>

                {/* TABELA GERAL DE COBRANÇAS GLOBAIS */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden">
                  <div className="p-4 border-b border-slate-300 flex items-center justify-between bg-slate-50">
                    <h2 className="text-xs font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                      <Building2 size={16} /> Faturamento e Faturas dos Inquilinos
                    </h2>
                    <button 
                      onClick={loadData} 
                      title="Recarregar faturamento"
                      className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-3.5">Cód Fatura</th>
                          <th className="px-6 py-3.5">Empresa / Tenant</th>
                          <th className="px-6 py-3.5">Plano</th>
                          <th className="px-6 py-3.5">Valor</th>
                          <th className="px-6 py-3.5">Vencimento</th>
                          <th className="px-6 py-3.5">Pagamento</th>
                          <th className="px-6 py-3.5">Forma</th>
                          <th className="px-6 py-3.5 text-center">Status</th>
                          <th className="px-6 py-3.5 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {allCobrancas.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                              Nenhuma cobrança registrada no histórico do SaaS.
                            </td>
                          </tr>
                        ) : (
                          allCobrancas.map((cob) => (
                            <tr key={cob.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors text-xs">
                              <td className="px-6 py-4 font-bold text-slate-400">#{cob.id.substring(0, 8)}</td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800">{cob.tenant?.nomeFantasia || 'N/A'}</p>
                                <p className="text-[10px] text-slate-400">CNPJ: {cob.tenant?.cnpj || 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4 font-extrabold text-[#1B4D3E]">{cob.plano}</td>
                              <td className="px-6 py-4 font-black text-slate-700">R$ {cob.valor.toFixed(2)}</td>
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                {new Date(cob.dataVencimento).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">
                                {cob.dataPagamento ? new Date(cob.dataPagamento).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">
                                  {cob.metodo || 'PIX'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {cob.status === 'PAGO' ? (
                                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                    Pago
                                  </span>
                                ) : (
                                  <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse">
                                    Pendente
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {cob.status !== 'PAGO' && (
                                  <button
                                    onClick={() => {
                                      showConfirm(
                                        'Baixa Manual de Fatura',
                                        `Deseja registrar manualmente a baixa da fatura #${cob.id.substring(0, 8)} de R$ ${cob.valor.toFixed(2)} para a empresa ${cob.tenant?.nomeFantasia}? Isso ativará e removerá suspensões do tenant se houver.`,
                                        async () => {
                                          setLoading(true);
                                          const res = await manuallyConfirmPaymentAction(cob.id);
                                          if (res.success) {
                                            showAlert('Sucesso', 'Fatura baixada com sucesso!', 'success');
                                            loadData();
                                          } else {
                                            showAlert('Erro ao Baixar', 'Erro: ' + res.error, 'error');
                                            setLoading(false);
                                          }
                                        }
                                      );
                                    }}
                                    className="text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                                  >
                                    💸 Confirmar Pago
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: E-MAIL OFICIAL DO SISTEMA SAAS (HOSTINGER SMTP) */}
            {adminTab === 'smtp' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-8 relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] bg-[#1B4D3E]/8 px-3 py-1 rounded-full">
                      Infraestrutura Master do SaaS
                    </span>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mt-2 font-display">
                      E-mail Oficial do Sistema (SMTP Hostinger)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Configure aqui a caixa postal oficial do SmartBid para disparo de códigos de recuperação de senha (OTP de 6 dígitos), convites de usuários e notificações institucionais.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {smtpConfigured ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Servidor Hostinger Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Pendente de Configuração
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner de Preset Rápido Hostinger */}
                <div className="bg-gradient-to-r from-slate-50 to-emerald-50/50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">Preset Hostinger Oficial</span>
                      <span className="text-[10px] font-bold bg-[#1B4D3E] text-white px-2 py-0.5 rounded-md">Recomendado</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Preenche automaticamente o servidor seguro da Hostinger (<code>smtp.hostinger.com</code> na porta <code>465 SSL</code>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpHost('smtp.hostinger.com');
                      setSmtpPort(465);
                      if (!smtpFromName) setSmtpFromName('SmartBid • Notificações');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#1B4D3E] border border-slate-200 hover:border-[#1B4D3E] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    ⚡ Aplicar Padrão Hostinger
                  </button>
                </div>

                {/* Formulário Principal de Configuração */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSmtpLoading(true);
                    setSmtpError('');
                    setSmtpSuccess('');

                    try {
                      const res = await saveSystemSmtpSettings({
                        host: smtpHost,
                        port: Number(smtpPort) || 465,
                        user: smtpUser,
                        password: smtpPassword,
                        fromEmail: smtpFromEmail || smtpUser,
                        fromName: smtpFromName || 'SmartBid',
                        active: smtpActive
                      });

                      if (res.success) {
                        setSmtpSuccess('Configurações de SMTP do SaaS salvas com sucesso!');
                        setSmtpConfigured(true);
                        setSmtpPassword(''); // limpa do state local após salvar
                      } else {
                        setSmtpError(res.error || 'Erro ao salvar configurações.');
                      }
                    } catch (err: any) {
                      setSmtpError(err.message || 'Erro de comunicação com o servidor.');
                    } finally {
                      setSmtpLoading(false);
                    }
                  }}
                  className="space-y-6 max-w-2xl pt-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Servidor Host */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="smtp.hostinger.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all font-mono"
                      />
                    </div>

                    {/* Porta */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Porta
                      </label>
                      <select
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all cursor-pointer"
                      >
                        <option value={465}>465 (SSL Seguro)</option>
                        <option value={587}>587 (TLS)</option>
                        <option value={25}>25</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* E-mail / Usuário */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        E-mail / Usuário Hostinger
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="suporte@smartbidhub.com.br"
                        value={smtpUser}
                        onChange={(e) => {
                          setSmtpUser(e.target.value);
                          if (!smtpFromEmail) setSmtpFromEmail(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Senha */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Senha do E-mail
                      </label>
                      <div className="relative">
                        <input
                          type={showSmtpPassword ? 'text' : 'password'}
                          placeholder={smtpConfigured ? '•••••••• (Preencha para alterar)' : 'Digite a senha da caixa postal'}
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nome do Remetente */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Nome de Exibição do Remetente
                      </label>
                      <input
                        type="text"
                        placeholder="SmartBid • Notificações"
                        value={smtpFromName}
                        onChange={(e) => setSmtpFromName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                      />
                    </div>

                    {/* E-mail From */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        E-mail de Remetente (From)
                      </label>
                      <input
                        type="email"
                        placeholder="suporte@smartbidhub.com.br"
                        value={smtpFromEmail}
                        onChange={(e) => setSmtpFromEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Feedback Messages */}
                  {smtpSuccess && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      {smtpSuccess}
                    </div>
                  )}

                  {smtpError && (
                    <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                      <X size={16} className="shrink-0" />
                      {smtpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={smtpLoading}
                    className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D3E]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {smtpLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Salvando Credenciais...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Salvar Configurações SMTP do SaaS
                      </>
                    )}
                  </button>
                </form>

                {/* Seção de Teste de Conexão em Tempo Real */}
                <div className="pt-8 border-t border-slate-100 max-w-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Send size={16} className="text-[#1B4D3E]" />
                      Testar Conexão em Tempo Real
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispara um e-mail de teste seguro com autenticação direta no seu servidor da Hostinger para certificar que o envio está operacional.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Digite seu e-mail para receber o teste..."
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      disabled={smtpTestLoading || !smtpTestEmail.trim()}
                      onClick={async () => {
                        if (!smtpTestEmail.trim()) return;
                        setSmtpTestLoading(true);
                        setSmtpTestResult(null);

                        try {
                          const res = await testSystemSmtpConnection(smtpTestEmail);
                          if (res.success) {
                            setSmtpTestResult({
                              success: true,
                              message: `E-mail de teste enviado com sucesso para ${smtpTestEmail}! Verifique sua caixa de entrada e spam.`
                            });
                          } else {
                            setSmtpTestResult({
                              success: false,
                              message: res.error || 'Falha ao autenticar na Hostinger. Verifique se o e-mail e senha estão corretos.'
                            });
                          }
                        } catch (err: any) {
                          setSmtpTestResult({
                            success: false,
                            message: err.message || 'Erro inesperado ao realizar teste.'
                          });
                        } finally {
                          setSmtpTestLoading(false);
                        }
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      {smtpTestLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Testando...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Disparar Teste
                        </>
                      )}
                    </button>
                  </div>

                  {smtpTestResult && (
                    <div
                      className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        smtpTestResult.success
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {smtpTestResult.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      ) : (
                        <X size={16} className="shrink-0 text-red-500" />
                      )}
                      <span>{smtpTestResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: WHATSAPP OFICIAL CENTRAL DO SISTEMA SAAS (Z-API) */}
            {adminTab === 'whatsapp' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-8 relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] bg-[#1B4D3E]/8 px-3 py-1 rounded-full">
                      Canal Oficial Central da Plataforma
                    </span>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mt-2 font-display flex items-center gap-2">
                      <MessageSquare size={20} className="text-[#10B981]" /> WhatsApp Oficial SmartBidHub (Z-API)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium max-w-2xl">
                      Este número central dispara todas as notificações automáticas do sistema (Propostas Aprovadas/Assinadas, Propostas Recusadas, Solicitações de Ajuste e Atas de Reunião Publicadas) para todas as empresas, mantendo o número individual de cada cliente (ex.: JVS Facilities) 100% exclusivo para o CRM.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {waOfficialConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Conectado {waOfficialPhone ? `(+${waOfficialPhone})` : ''}
                      </span>
                    ) : waOfficialConfigured ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle size={14} className="text-amber-600" />
                        Credenciais Salvas • Aguardando QR Code
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <AlertTriangle size={14} className="text-slate-500" />
                        Não Configurado
                      </span>
                    )}
                  </div>
                </div>

                {/* Card de Identidade Visual Oficial (Avatar do WhatsApp) */}
                <div className="bg-gradient-to-r from-[#0D261E] to-[#1B4D3E] p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
                  <div className="flex items-center gap-5">
                    <img
                      src="/whatsapp-profile-smartbid.jpg"
                      alt="Avatar Oficial WhatsApp SmartBidHub"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#10B981] shadow-lg shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        Identidade Oficial Pronta
                      </span>
                      <h3 className="text-base font-black tracking-tight text-white">
                        Foto de Perfil Oficial — SmartBidHub
                      </h3>
                      <p className="text-xs text-emerald-100/80 max-w-lg">
                        Use esta imagem oficial no perfil do WhatsApp central da SmartBidHub para transmitir máxima credibilidade nos alertas enviados aos consultores e diretores.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/whatsapp-profile-smartbid.jpg"
                    download="whatsapp-perfil-oficial-smartbidhub.jpg"
                    className="px-4 py-2.5 bg-white text-[#1B4D3E] hover:bg-emerald-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <Download size={14} /> Baixar Foto de Perfil
                  </a>
                </div>

                {/* Formulário de Credenciais Z-API Oficial */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setWaOfficialLoading(true);
                    setWaOfficialError('');
                    setWaOfficialSuccess('');

                    try {
                      const res = await saveSystemWhatsAppSettings({
                        instanceId: waOfficialInstanceId,
                        token: waOfficialToken,
                        clientToken: waOfficialClientToken,
                        active: waOfficialActive,
                      });

                      if (res.success) {
                        setWaOfficialSuccess('Credenciais do WhatsApp Oficial SmartBidHub salvas com sucesso!');
                        setWaOfficialConfigured(true);
                        setWaOfficialClientToken('');
                        const statusRes = await getSystemWhatsAppSettings();
                        if (statusRes && !('error' in statusRes)) {
                          setWaOfficialConnected(Boolean(statusRes.connected));
                          setWaOfficialPhone(statusRes.phone || '');
                        }
                      } else {
                        setWaOfficialError(res.error || 'Erro ao salvar credenciais.');
                      }
                    } catch (err: any) {
                      setWaOfficialError(err.message || 'Erro de comunicação com o servidor.');
                    } finally {
                      setWaOfficialLoading(false);
                    }
                  }}
                  className="space-y-6 max-w-2xl pt-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        ID da Instância (Z-API Instance ID)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 3C8F9A1B2D3E4F..."
                        value={waOfficialInstanceId}
                        onChange={(e) => setWaOfficialInstanceId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Token da Instância (Z-API Token)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: A1B2C3D4E5F6..."
                        value={waOfficialToken}
                        onChange={(e) => setWaOfficialToken(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Client-Token de Segurança da Conta Z-API
                    </label>
                    <div className="relative">
                      <input
                        type={showWaClientToken ? 'text' : 'password'}
                        placeholder={waOfficialConfigured ? '•••••••• (Já salvo — preencha apenas se quiser alterar)' : 'Cole o Client-Token de segurança da Z-API'}
                        value={waOfficialClientToken}
                        onChange={(e) => setWaOfficialClientToken(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaClientToken(!showWaClientToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showWaClientToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Ativar Disparo pelo Número Oficial Central</span>
                      <span className="text-[11px] text-slate-500">
                        Quando ativo, todas as notificações de Propostas e Atas saem exclusivamente por este número oficial.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={waOfficialActive}
                      onChange={(e) => setWaOfficialActive(e.target.checked)}
                      className="w-5 h-5 accent-[#1B4D3E] rounded cursor-pointer"
                    />
                  </div>

                  {waOfficialError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{waOfficialError}</span>
                    </div>
                  )}

                  {waOfficialSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{waOfficialSuccess}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={waOfficialLoading}
                      className="px-6 py-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={15} />
                      {waOfficialLoading ? 'Salvando...' : 'Salvar Credenciais Oficiais'}
                    </button>

                    {waOfficialConfigured && !waOfficialConnected && (
                      <button
                        type="button"
                        disabled={waOfficialQrLoading}
                        onClick={async () => {
                          setWaOfficialQrLoading(true);
                          setWaOfficialError('');
                          try {
                            const res = await getSystemWhatsAppQrCode();
                            if (res.success && res.qrCode) {
                              setWaOfficialQrCode(res.qrCode);
                            } else {
                              setWaOfficialError(res.error || 'Não foi possível gerar o QR Code.');
                            }
                          } finally {
                            setWaOfficialQrLoading(false);
                          }
                        }}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        <QrCode size={15} />
                        {waOfficialQrLoading ? 'Gerando QR Code...' : 'Gerar QR Code de Conexão'}
                      </button>
                    )}

                    {waOfficialConnected && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await disconnectSystemWhatsAppInstance();
                          if (res.success) {
                            setWaOfficialConnected(false);
                            setWaOfficialPhone('');
                            setWaOfficialQrCode(null);
                            setWaOfficialSuccess('Aparelho desconectado com sucesso.');
                          } else {
                            setWaOfficialError(res.error || 'Erro ao desconectar.');
                          }
                        }}
                        className="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Desconectar Aparelho
                      </button>
                    )}
                  </div>
                </form>

                {/* Exibição do QR Code quando solicitado */}
                {waOfficialQrCode && !waOfficialConnected && (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md space-y-4 text-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Escaneie com o WhatsApp Oficial da SmartBidHub
                    </h4>
                    <img
                      src={waOfficialQrCode.startsWith('data:') ? waOfficialQrCode : `data:image/png;base64,${waOfficialQrCode}`}
                      alt="QR Code WhatsApp Oficial"
                      className="w-56 h-56 mx-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const statusRes = await getSystemWhatsAppSettings();
                        if (statusRes && !('error' in statusRes)) {
                          setWaOfficialConnected(Boolean(statusRes.connected));
                          setWaOfficialPhone(statusRes.phone || '');
                          if (statusRes.connected) {
                            setWaOfficialQrCode(null);
                            setWaOfficialSuccess('WhatsApp Oficial conectado com sucesso!');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#1B4D3E] text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      🔄 Já escaneei • Verificar Conexão
                    </button>
                  </div>
                )}

                {/* Seção de Disparo de Teste do WhatsApp Oficial */}
                <div className="pt-6 border-t border-slate-200/80 max-w-2xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Testar Disparo do WhatsApp Oficial
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Informe um celular com DDD para receber uma notificação de teste enviada pela instância central da SmartBidHub.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Ex: 11999999999"
                      value={waTestPhone}
                      onChange={(e) => setWaTestPhone(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      disabled={waTestLoading || !waTestPhone.trim()}
                      onClick={async () => {
                        setWaTestLoading(true);
                        setWaTestResult(null);
                        try {
                          const res = await testSystemWhatsAppConnection(waTestPhone);
                          if (res.success) {
                            setWaTestResult({
                              success: true,
                              message: `Mensagem de teste enviada com sucesso para ${waTestPhone}!`,
                            });
                          } else {
                            setWaTestResult({
                              success: false,
                              message: res.error || 'Falha ao enviar mensagem de teste.',
                            });
                          }
                        } catch (err: any) {
                          setWaTestResult({
                            success: false,
                            message: err.message || 'Erro inesperado ao testar disparo.',
                          });
                        } finally {
                          setWaTestLoading(false);
                        }
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      <Send size={14} />
                      {waTestLoading ? 'Enviando...' : 'Enviar WhatsApp de Teste'}
                    </button>
                  </div>

                  {waTestResult && (
                    <div
                      className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        waTestResult.success
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {waTestResult.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                      ) : (
                        <X size={16} className="shrink-0 text-red-500" />
                      )}
                      <span>{waTestResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    if (newPlano === 'TESTE') setLimiteUsuarios(3);
                    else if (newPlano === 'STARTER') setLimiteUsuarios(3);
                    else if (newPlano === 'PRO') setLimiteUsuarios(10);
                    else if (newPlano === 'ENTERPRISE') setLimiteUsuarios(100);
                  }}
                  disabled={actionLoading}
                >
                  <option value="TESTE">Teste Grátis (30 dias - 3 users)</option>
                  <option value="STARTER">Starter (3 users)</option>
                  <option value="PRO">Pro (10 users)</option>
                  <option value="ENTERPRISE">Enterprise (100 users)</option>
                </select>
              </div>

              {/* Data de Início do Teste (Apenas se o plano for TESTE) */}
              {plano === 'TESTE' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Data de Início do Teste</label>
                  <input 
                    type="datetime-local"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700 cursor-pointer"
                    value={trialStartedAt}
                    onChange={e => setTrialStartedAt(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
              )}

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

              {/* Taxa do WhatsApp */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Taxa Mensal WhatsApp (R$)</label>
                <input 
                  type="number"
                  required
                  min={0}
                  max={9999}
                  step="0.01"
                  placeholder="Ex: 130.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={taxaWhatsapp}
                  onChange={e => setTaxaWhatsapp(Number(e.target.value))}
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

      {/* MODAL LANÇAR COBRANÇA AVULSA */}
      {newInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-[#1B4D3E]" /> 
                Lançar Nova Fatura SaaS
              </h2>
              <button 
                onClick={() => setNewInvoiceModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newInvoiceTenantId) return alert('Selecione uma empresa.');
              if (!newInvoiceVencimento) return alert('Selecione o vencimento.');
              setActionLoading(true);
              try {
                const res = await manuallyCreateInvoiceAction(newInvoiceTenantId, newInvoicePlano, Number(newInvoiceValor), newInvoiceVencimento);
                if (res.success) {
                  showAlert('Sucesso', 'Fatura lançada com sucesso!', 'success');
                  setNewInvoiceModal(false);
                  loadData();
                } else {
                  alert('Erro ao lançar fatura: ' + res.error);
                }
              } catch (err: any) {
                alert('Erro: ' + err.message);
              } finally {
                setActionLoading(false);
              }
            }} className="p-5 space-y-4">
              
              {/* Selecionar Tenant */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Empresa Cliente</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700 cursor-pointer"
                  value={newInvoiceTenantId}
                  onChange={e => setNewInvoiceTenantId(e.target.value)}
                  disabled={actionLoading}
                >
                  <option value="" disabled>Selecione uma empresa...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nomeFantasia} ({t.cnpj})</option>
                  ))}
                </select>
              </div>

              {/* Plano / Referência */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Referência / Plano</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700 cursor-pointer"
                  value={newInvoicePlano}
                  onChange={e => {
                    const pl = e.target.value;
                    setNewInvoicePlano(pl);
                    if (pl === 'BASICO') setNewInvoiceValor(149.0);
                    else if (pl === 'PRO') setNewInvoiceValor(299.0);
                    else if (pl === 'ENTERPRISE') setNewInvoiceValor(599.0);
                  }}
                  disabled={actionLoading}
                >
                  <option value="BASICO">Plano Básico (R$ 149.00)</option>
                  <option value="PRO">Plano Pro (R$ 299.00)</option>
                  <option value="ENTERPRISE">Plano Enterprise (R$ 599.00)</option>
                  <option value="AVULSO">Lançamento Avulso (Customizado)</option>
                </select>
              </div>

              {/* Valor cobrado */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Valor da Cobrança (R$)</label>
                <input 
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={newInvoiceValor}
                  onChange={e => setNewInvoiceValor(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Data de Vencimento</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700 cursor-pointer font-mono"
                  value={newInvoiceVencimento}
                  onChange={e => setNewInvoiceVencimento(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Controles */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setNewInvoiceModal(false)} 
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
                    'Confirmar Lançamento'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CONFIGURAÇÃO DE PLANO */}
      {editPlanModal && selectedPlanConfig && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-[#10B981]" /> 
                Editar Configuração: Plano {selectedPlanConfig.nome}
              </h2>
              <button 
                onClick={() => setEditPlanModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                disabled={actionLoading}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSavePlanConfig} className="p-5 space-y-4">
              
              {/* Nome Visível (Label) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Título do Plano (Label)</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Profissional (PRO)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={planLabel}
                  onChange={e => setPlanLabel(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Preço Base Mensal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Preço Base Mensal (R$)</label>
                <input 
                  type="number"
                  required
                  min={0}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={planPreco}
                  onChange={e => setPlanPreco(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>

              {/* Limite de Usuários */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Limite Máximo de Usuários</label>
                <input 
                  type="number"
                  required
                  min={1}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={planLimite}
                  onChange={e => setPlanLimite(Number(e.target.value))}
                  disabled={actionLoading}
                />
              </div>

              {/* Descrição do Plano */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Descrição</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Descrição simples para a LP e Checkout..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={planDescricao}
                  onChange={e => setPlanDescricao(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Recursos / Benefícios (features) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lista de Recursos / Benefícios</label>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Separados por vírgula</span>
                </div>
                <textarea 
                  required
                  rows={3}
                  placeholder="Recurso 1, Recurso 2, Recurso 3..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 outline-none transition-all font-semibold text-slate-700"
                  value={planFeatures}
                  onChange={e => setPlanFeatures(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {/* Recursos Controles */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditPlanModal(false)} 
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm font-bold"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw className="animate-spin" size={14} />
                  ) : (
                    'Salvar Configurações'
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

export default function TenantManagerDashboard() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen bg-[#F8FAFC] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-widest text-[#1B4D3E]">
              Carregando Painel Admin...
            </span>
          </div>
        </div>
      }
    >
      <TenantManagerDashboardContent />
    </React.Suspense>
  );
}
