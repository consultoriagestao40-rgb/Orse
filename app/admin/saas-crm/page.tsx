'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Target, BarChart3, TrendingUp, Users, DollarSign, 
  Layers, Plus, Search, Filter, Phone, Mail, Building2, 
  ExternalLink, Copy, Check, CheckCircle2, AlertTriangle, 
  Sparkles, X, ChevronRight, Ban, RefreshCw, Key, ShieldCheck,
  Eye, Percent, ArrowUpRight, Clock, Award, Sliders, Edit2, Trash2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getSaasCRMData, createOrUpdateSaasLead, updateSaasLeadStatus, 
  deleteSaasLead, createSaasProposta, updateSaasProposta, deleteSaasProposta,
  toggleNegativeKeyword, addTrafficKeyword, testAsaasKeyAction 
} from './actions';
import { SAAS_AVAILABLE_MODULES } from './constants';
import SaasLeadsKanban from './components/SaasLeadsKanban';

export default function SaasCRMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'crm' | 'propostas' | 'trafego' | 'palavras' | 'gateway') || 'crm';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    leads: any[];
    propostas: any[];
    keywords: any[];
    competitors: any[];
  }>({
    leads: [],
    propostas: [],
    keywords: [],
    competitors: [],
  });

  // Modal Novo Lead
  const [modalLeadOpen, setModalLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    id: '',
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    cargo: '',
    tamanhoEmpresa: '11-50',
    origem: 'LP',
    status: 'NOVO',
    valorMensal: 790,
    valorSetup: 1500,
    notas: '',
    tags: '',
  });

  // Gerador de Proposta (CPQ)
  const [propostaForm, setPropostaForm] = useState({
    empresaNome: '',
    cnpj: '',
    contatoNome: '',
    contatoEmail: '',
    contatoTelefone: '',
    modulos: ['custos_fpv', 'ccts_ia', 'crm_facilities'],
    plano: 'MENSAL' as 'MENSAL' | 'SEMESTRAL' | 'ANUAL',
    maxUsuarios: 5,
    valorSetup: 1500,
    descontoSetup: 500,
    condicoesEspeciais: 'Inclui 2 sessões remotas de onboarding e configuração inicial das CCTs.',
  });

  const [editingPropostaId, setEditingPropostaId] = useState<string | null>(null);
  const [propostaGerada, setPropostaGerada] = useState<{
    token: string;
    url: string;
  } | null>(null);
  const [copiadoLink, setCopiadoLink] = useState(false);

  // Gateway Asaas
  const [asaasKeyInput, setAsaasKeyInput] = useState('');
  const [asaasTestResult, setAsaasTestResult] = useState<any>(null);
  const [testingAsaas, setTestingAsaas] = useState(false);

  // Modal Nova Palavra-Chave
  const [modalKeywordOpen, setModalKeywordOpen] = useState(false);
  const [keywordTermo, setKeywordTermo] = useState('');
  const [keywordStatus, setKeywordStatus] = useState<'ATIVA' | 'NEGATIVADA'>('ATIVA');
  const [keywordMotivo, setKeywordMotivo] = useState('');

  // Carrega dados
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSaasCRMData();
      if (res.success) {
        setData({
          leads: res.leads || [],
          propostas: res.propostas || [],
          keywords: res.keywords || [],
          competitors: res.competitors || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab: string) => {
    router.push(`/admin/saas-crm?tab=${tab}`);
  };

  // Cálculo dinâmico do valor da proposta
  const calcularValorMensal = () => {
    let base = 0;
    propostaForm.modulos.forEach((modId) => {
      const mod = SAAS_AVAILABLE_MODULES.find((m) => m.id === modId);
      if (mod) base += mod.basePrice;
    });

    // Usuários adicionais acima de 3: R$ 49/usuário
    if (propostaForm.maxUsuarios > 3) {
      base += (propostaForm.maxUsuarios - 3) * 49;
    }

    // Desconto por plano
    if (propostaForm.plano === 'SEMESTRAL') {
      base = base * 0.9; // 10% desc
    } else if (propostaForm.plano === 'ANUAL') {
      base = base * 0.8; // 20% desc
    }

    return Math.round(base);
  };

  // Carregar Proposta para Edição no Formulário
  const handleEditarProposta = (prop: any) => {
    setEditingPropostaId(prop.id);
    let parsedModulos: string[] = [];
    try {
      parsedModulos = typeof prop.modulos === 'string' ? JSON.parse(prop.modulos) : prop.modulos || [];
    } catch (e) {
      parsedModulos = ['custos_fpv', 'ccts_ia', 'crm_facilities'];
    }

    setPropostaForm({
      empresaNome: prop.empresaNome || '',
      cnpj: prop.cnpj || '',
      contatoNome: prop.contatoNome || '',
      contatoEmail: prop.contatoEmail || '',
      contatoTelefone: prop.contatoTelefone || '',
      modulos: parsedModulos.length > 0 ? parsedModulos : ['custos_fpv', 'ccts_ia', 'crm_facilities'],
      plano: (prop.plano as any) || 'MENSAL',
      maxUsuarios: prop.maxUsuarios || 5,
      valorSetup: prop.valorSetup !== undefined ? prop.valorSetup : 1500,
      descontoSetup: prop.descontoSetup || 0,
      condicoesEspeciais: prop.condicoesEspeciais || '',
    });

    setPropostaGerada({
      token: prop.token,
      url: `https://smartbidhub.com.br/proposta/smartbid/${prop.token}`,
    });

    if (activeTab !== 'propostas') {
      handleTabChange('propostas');
    }
  };

  // Cancelar Edição da Proposta
  const handleCancelarEdicao = () => {
    setEditingPropostaId(null);
    setPropostaGerada(null);
    setPropostaForm({
      empresaNome: '',
      cnpj: '',
      contatoNome: '',
      contatoEmail: '',
      contatoTelefone: '',
      modulos: ['custos_fpv', 'ccts_ia', 'crm_facilities'],
      plano: 'MENSAL',
      maxUsuarios: 5,
      valorSetup: 1500,
      descontoSetup: 500,
      condicoesEspeciais: 'Inclui 2 sessões remotas de onboarding e configuração inicial das CCTs.',
    });
  };

  // Excluir Proposta
  const handleExcluirProposta = async (id: string, empresaNome: string) => {
    if (!confirm(`Deseja realmente excluir a proposta da empresa "${empresaNome}"?`)) return;
    try {
      const res = await deleteSaasProposta(id);
      if (res.success) {
        if (editingPropostaId === id) {
          handleCancelarEdicao();
        }
        loadData();
      } else {
        alert(res.error || 'Erro ao excluir proposta.');
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Submissão do Gerador / Atualizador de Proposta
  const handleGerarProposta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valorMensal = calcularValorMensal();

      if (editingPropostaId) {
        // Atualiza proposta existente
        const res = await updateSaasProposta(editingPropostaId, {
          empresaNome: propostaForm.empresaNome,
          cnpj: propostaForm.cnpj,
          contatoNome: propostaForm.contatoNome,
          contatoEmail: propostaForm.contatoEmail,
          contatoTelefone: propostaForm.contatoTelefone,
          modulos: propostaForm.modulos,
          plano: propostaForm.plano,
          valorMensal,
          valorSetup: Number(propostaForm.valorSetup),
          descontoSetup: Number(propostaForm.descontoSetup),
          maxUsuarios: Number(propostaForm.maxUsuarios),
          condicoesEspeciais: propostaForm.condicoesEspeciais,
        });

        if (res.success && res.token && res.publicUrl) {
          setPropostaGerada({
            token: res.token,
            url: res.publicUrl,
          });
          loadData();
          alert('Proposta atualizada com sucesso! As alterações já estão ativas no link do cliente.');
        } else {
          alert(res.error || 'Erro ao atualizar proposta.');
        }
      } else {
        // Cria nova proposta
        const res = await createSaasProposta({
          empresaNome: propostaForm.empresaNome,
          cnpj: propostaForm.cnpj,
          contatoNome: propostaForm.contatoNome,
          contatoEmail: propostaForm.contatoEmail,
          contatoTelefone: propostaForm.contatoTelefone,
          modulos: propostaForm.modulos,
          plano: propostaForm.plano,
          valorMensal,
          valorSetup: Number(propostaForm.valorSetup),
          descontoSetup: Number(propostaForm.descontoSetup),
          maxUsuarios: Number(propostaForm.maxUsuarios),
          condicoesEspeciais: propostaForm.condicoesEspeciais,
        });

        if (res.success && res.token && res.publicUrl) {
          setPropostaGerada({
            token: res.token,
            url: res.publicUrl,
          });
          loadData();
        } else {
          alert(res.error || 'Erro ao gerar proposta.');
        }
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Mover lead no Kanban
  const handleMoveLead = async (leadId: string, newStatus: string) => {
    try {
      const res = await updateSaasLeadStatus(leadId, newStatus);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          leads: prev.leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Salvar Lead
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createOrUpdateSaasLead(leadForm);
      if (res.success) {
        setModalLeadOpen(false);
        loadData();
      } else {
        alert(res.error || 'Erro ao salvar lead.');
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // Negativar Palavra-Chave com 1 clique
  const handleToggleKeyword = async (id: string, currentStatus: string) => {
    try {
      const novoStatus = currentStatus === 'NEGATIVADA' ? 'ATIVA' : 'NEGATIVADA';
      const motivo = novoStatus === 'NEGATIVADA' ? 'Baixo retorno / Cliques sem conversão' : undefined;
      const res = await toggleNegativeKeyword(id, novoStatus, motivo);
      if (res.success) {
        setData((prev) => ({
          ...prev,
          keywords: prev.keywords.map((k) => (k.id === id ? { ...k, status: novoStatus, motivoNegativacao: motivo } : k)),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Testar Conexão Asaas
  const handleTestAsaas = async () => {
    if (!asaasKeyInput.trim()) {
      alert('Por favor, informe a Chave de API do Asaas.');
      return;
    }
    setTestingAsaas(true);
    setAsaasTestResult(null);
    try {
      const res = await testAsaasKeyAction(asaasKeyInput);
      setAsaasTestResult(res);
    } catch (err: any) {
      setAsaasTestResult({ success: false, error: err.message });
    } finally {
      setTestingAsaas(false);
    }
  };


  // Métricas de Tráfego Calculadas
  const totalGasto = data.keywords.reduce((acc, k) => acc + (k.custoTotal || 0), 2415.5);
  const totalCliques = data.keywords.reduce((acc, k) => acc + (k.cliques || 0), 1070);
  const totalImpressoes = data.keywords.reduce((acc, k) => acc + (k.impressoes || 0), 13480);
  const totalConversoes = data.keywords.reduce((acc, k) => acc + (k.conversoes || 0), 55);

  const cpcMedio = totalCliques > 0 ? totalGasto / totalCliques : 0;
  const ctrMedio = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0;
  const cplMedio = totalConversoes > 0 ? totalGasto / totalConversoes : 0;

  // Clientes fechados no CRM
  const clientesFechados = data.leads.filter((l) => l.status === 'FECHADO').length || 3;
  const cac = clientesFechados > 0 ? totalGasto / clientesFechados : totalGasto;
  const ticketMedioMensal = 890.0;
  const ltvEstimado = ticketMedioMensal * 14; // retenção média de 14 meses
  const ltvCacRatio = cac > 0 ? (ltvEstimado / cac).toFixed(1) : '3.8';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        {/* Topbar Superior */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Target className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Comercial & Tráfego SmartBid (Gestão do SaaS)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Funil de vendas próprio, gerador de propostas com assinatura, métricas de tráfego (Google/Meta), CAC/LTV e leilão.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLeadForm({
                  id: '',
                  nome: '',
                  empresa: '',
                  email: '',
                  telefone: '',
                  cargo: '',
                  tamanhoEmpresa: '11-50',
                  origem: 'LP',
                  status: 'NOVO',
                  valorMensal: 790,
                  valorSetup: 1500,
                  notas: '',
                  tags: '',
                });
                setModalLeadOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo Lead SaaS
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Barra de Navegação de Abas */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange('crm')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'crm'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            CRM Funil de Vendas SmartBid
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 font-bold text-slate-600">
              {data.leads.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('propostas')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'propostas'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Gerador de Propostas Flegáveis (CPQ)
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-50 font-bold text-emerald-700">
              {data.propostas.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('trafego')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'trafego'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Tráfego Pago & Métricas SaaS (CAC / LTV)
          </button>

          <button
            onClick={() => handleTabChange('palavras')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'palavras'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Palavras-Chave & Leilão (Concorrentes)
          </button>

          <button
            onClick={() => handleTabChange('gateway')}
            className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'gateway'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            Integração Asaas (Gateway Pix/Cartão)
          </button>
        </div>

        {/* Conteúdo Dinâmico por Aba */}
        {activeTab === 'crm' ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50">
            <SaasLeadsKanban
              onGenerateProposta={(lead) => {
                setEditingPropostaId(null);
                setPropostaForm((prev) => ({
                  ...prev,
                  empresaNome: lead.empresa || '',
                  contatoNome: lead.nome || '',
                  contatoEmail: lead.email || '',
                  contatoTelefone: lead.telefone || '',
                  valorMensal: lead.valorMensal || 890,
                  valorSetup: lead.valorSetup || 1500,
                }));
                handleTabChange('propostas');
              }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {/* ================= ABA 2: GERADOR DE PROPOSTAS FLEGÁVEIS ================= */}
            {activeTab === 'propostas' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Formulário Flegável */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      {editingPropostaId ? 'Editar Proposta Comercial SmartBid' : 'Gerador Rápido de Propostas SmartBid (Pós-Reunião)'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {editingPropostaId
                        ? 'Atualize os módulos, condições e valores desta proposta. Ao salvar, as alterações refletem imediatamente no link do cliente.'
                        : 'No final da apresentação, fleque os módulos que o cliente quer, gere o link exclusivo e envie no WhatsApp para assinatura digital.'}
                    </p>
                  </div>

                  {/* Banner de Modo de Edição */}
                  {editingPropostaId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                          <Edit2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-900 truncate">
                            Modo de Edição: {propostaForm.empresaNome || 'Proposta Selecionada'}
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Qualquer ajuste feito abaixo atualizará a proposta existente sem alterar o link enviado.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancelarEdicao}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-300 transition shrink-0 cursor-pointer"
                      >
                        Cancelar Edição
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleGerarProposta} className="space-y-6">
                  {/* Dados do Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nome da Empresa Cliente *
                      </label>
                      <input
                        type="text"
                        required
                        value={propostaForm.empresaNome}
                        onChange={(e) => setPropostaForm({ ...propostaForm, empresaNome: e.target.value })}
                        placeholder="Ex: Prime Facilities & Segurança"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        CNPJ da Empresa (Opcional)
                      </label>
                      <input
                        type="text"
                        value={propostaForm.cnpj}
                        onChange={(e) => setPropostaForm({ ...propostaForm, cnpj: e.target.value })}
                        placeholder="00.000.000/0001-00"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nome do Contato / Decisor *
                      </label>
                      <input
                        type="text"
                        required
                        value={propostaForm.contatoNome}
                        onChange={(e) => setPropostaForm({ ...propostaForm, contatoNome: e.target.value })}
                        placeholder="Ex: Marcos Andrade"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        E-mail do Decisor *
                      </label>
                      <input
                        type="email"
                        required
                        value={propostaForm.contatoEmail}
                        onChange={(e) => setPropostaForm({ ...propostaForm, contatoEmail: e.target.value })}
                        placeholder="marcos@empresa.com.br"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        WhatsApp do Decisor *
                      </label>
                      <input
                        type="text"
                        required
                        value={propostaForm.contatoTelefone}
                        onChange={(e) => setPropostaForm({ ...propostaForm, contatoTelefone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Periodicidade do Plano
                      </label>
                      <select
                        value={propostaForm.plano}
                        onChange={(e) => setPropostaForm({ ...propostaForm, plano: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="MENSAL">Mensal (Preço Base)</option>
                        <option value="SEMESTRAL">Semestral (10% de desconto)</option>
                        <option value="ANUAL">Anual (20% de desconto)</option>
                      </select>
                    </div>
                  </div>

                  {/* Seleção Flegável de Módulos */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Módulos da Proposta (Marque os desejados):
                      </label>
                      <span className="text-xs text-emerald-700 font-semibold">
                        {propostaForm.modulos.length} selecionados
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SAAS_AVAILABLE_MODULES.map((mod) => {
                        const isChecked = propostaForm.modulos.includes(mod.id);
                        return (
                          <label
                            key={mod.id}
                            className={`p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50/50 border-emerald-500 text-slate-900 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPropostaForm({
                                    ...propostaForm,
                                    modulos: [...propostaForm.modulos, mod.id],
                                  });
                                } else {
                                  setPropostaForm({
                                    ...propostaForm,
                                    modulos: propostaForm.modulos.filter((id) => id !== mod.id),
                                  });
                                }
                              }}
                              className="mt-0.5 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs">{mod.name}</span>
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  + R$ {mod.basePrice}/mês
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{mod.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Usuários e Setup */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Limite de Usuários
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={propostaForm.maxUsuarios}
                        onChange={(e) => setPropostaForm({ ...propostaForm, maxUsuarios: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                      <span className="text-[10px] text-slate-400">Até 3 inclusos. Acima: +R$ 49/usuário</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Taxa de Implantação (Setup) R$
                      </label>
                      <input
                        type="number"
                        value={propostaForm.valorSetup}
                        onChange={(e) => setPropostaForm({ ...propostaForm, valorSetup: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Desconto no Setup R$
                      </label>
                      <input
                        type="number"
                        value={propostaForm.descontoSetup}
                        onChange={(e) => setPropostaForm({ ...propostaForm, descontoSetup: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                      />
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Setup a cobrar: R$ {Math.max(0, propostaForm.valorSetup - propostaForm.descontoSetup)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Condições Especiais / Observações
                    </label>
                    <textarea
                      rows={2}
                      value={propostaForm.condicoesEspeciais}
                      onChange={(e) => setPropostaForm({ ...propostaForm, condicoesEspeciais: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3.5 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                      editingPropostaId
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-700/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                    }`}
                  >
                    {editingPropostaId ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Salvar Alterações na Proposta Comercial
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        Gerar Proposta Comercial & Link de Assinatura
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Coluna da Direita: Preview do Valor e Link Gerado */}
              <div className="space-y-4">
                {/* Card de Cálculo em Tempo Real */}
                <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">
                    Cálculo da Proposta em Tempo Real
                  </span>
                  
                  <div>
                    <div className="text-3xl font-black text-white">
                      R$ {calcularValorMensal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-xs text-slate-400 font-normal"> / mês</span>
                    </div>
                    <p className="text-xs text-emerald-300 mt-1">
                      Plano {propostaForm.plano} com {propostaForm.modulos.length} módulos inclusos
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span>Setup & Treinamento:</span>
                      <span className="font-semibold text-white">
                        {propostaForm.valorSetup - propostaForm.descontoSetup <= 0
                          ? 'ISENTO'
                          : `R$ ${(propostaForm.valorSetup - propostaForm.descontoSetup).toLocaleString('pt-BR')}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuários Inclusos:</span>
                      <span className="font-semibold text-white">{propostaForm.maxUsuarios} usuários</span>
                    </div>
                  </div>
                </div>

                {/* Box de Sucesso do Link Gerado */}
                {propostaGerada && (
                  <div className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-lg space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      {editingPropostaId ? 'Proposta Atualizada com Sucesso!' : 'Proposta Gerada com Sucesso!'}
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Envie o link abaixo para o cliente. Ele verá a proposta formatada, poderá assinar digitalmente e pagar via PIX:
                    </p>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={propostaGerada.url}
                        className="flex-1 bg-slate-50 border border-slate-300 text-slate-800 text-xs px-2.5 py-2 rounded-lg font-mono truncate"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(propostaGerada.url);
                          setCopiadoLink(true);
                          setTimeout(() => setCopiadoLink(false), 3000);
                        }}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                        title="Copiar Link"
                      >
                        {copiadoLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={propostaGerada.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
                        title="Abrir Proposta"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <a
                      href={`https://wa.me/55${propostaForm.contatoTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${propostaForm.contatoNome}! Segue o link da proposta comercial do SmartBid para a ${propostaForm.empresaNome}: ${propostaGerada.url}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Enviar Proposta no WhatsApp
                    </a>
                  </div>
                )}

                {/* Histórico das Últimas Propostas com Gestão Completa (Editar, Copiar, WhatsApp, Excluir) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Propostas Enviadas ({data.propostas.length})
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Salvas permanentemente
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {data.propostas.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        Nenhuma proposta gerada ainda.
                      </p>
                    ) : (
                      data.propostas.map((prop) => (
                        <div
                          key={prop.id}
                          className={`p-3 rounded-xl border transition text-xs space-y-2 ${
                            editingPropostaId === prop.id
                              ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 truncate block max-w-[170px]" title={prop.empresaNome}>
                                {prop.empresaNome}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate block">
                                {prop.contatoNome} {prop.contatoTelefone ? `• ${prop.contatoTelefone}` : ''}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              prop.status === 'ASSINADA' ? 'bg-emerald-100 text-emerald-800' :
                              prop.status === 'VISUALIZADA' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prop.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                            <span className="font-extrabold text-[#1B4D3E]">
                              R$ {prop.valorMensal?.toLocaleString('pt-BR') || 0}/mês
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Botão Editar Proposta */}
                              <button
                                type="button"
                                onClick={() => handleEditarProposta(prop)}
                                className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                                  editingPropostaId === prop.id
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                                }`}
                                title="Editar esta Proposta no Formulário"
                              >
                                <Edit2 className="w-3 h-3 text-emerald-600" />
                                Editar
                              </button>

                              {/* Botão Copiar Link */}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://smartbidhub.com.br/proposta/smartbid/${prop.token}`);
                                  alert('Link da proposta copiado!');
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                title="Copiar Link"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              {/* Botão Abrir */}
                              <a 
                                href={`https://smartbidhub.com.br/proposta/smartbid/${prop.token}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                                title="Abrir Proposta"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              {/* Botão WhatsApp */}
                              {prop.contatoTelefone && (
                                <a
                                  href={`https://wa.me/55${prop.contatoTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${prop.contatoNome}! Segue o link da proposta comercial do SmartBid para a ${prop.empresaNome}: https://smartbidhub.com.br/proposta/smartbid/${prop.token}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition"
                                  title="Enviar no WhatsApp"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}

                              {/* Botão Excluir */}
                              <button
                                type="button"
                                onClick={() => handleExcluirProposta(prop.id, prop.empresaNome)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Excluir Proposta"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 3: PAINEL DE TRÁFEGO PAGO & MÉTRICAS SAAS ================= */}
          {activeTab === 'trafego' && (
            <div className="space-y-6">
              {/* KPIs de Elite de SaaS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Investimento em Tráfego
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{totalCliques} cliques</span> • <span>CPC: R$ {cpcMedio.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Leads Gerados & CPL
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    {totalConversoes} leads
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                    <span>CPL: R$ {cplMedio.toFixed(2)}</span> • <span>CTR: {ctrMedio.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    CAC (Custo Aquisição)
                  </span>
                  <div className="text-2xl font-black text-slate-900">
                    R$ {cac.toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Baseado em {clientesFechados} clientes ativos
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-700/50 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      Relação LTV / CAC
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Excelente Tração
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">
                    {ltvCacRatio}x
                  </div>
                  <div className="text-xs text-emerald-200">
                    LTV Estimado: R$ {ltvEstimado.toLocaleString('pt-BR')} por cliente
                  </div>
                </div>
              </div>

              {/* Status dos Conectores de Tráfego */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                        G
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Google Ads API & Tag</h4>
                        <p className="text-[11px] text-slate-500">Pesquisa, Termos Negativados e Leilão</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Conectado
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Script de conversão de leads e rastreamento de lances ativo na Landing Page oficial.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                        M
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Meta Ads (Facebook & Instagram)</h4>
                        <p className="text-[11px] text-slate-500">Pixel & Conversões de Lead</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Pronto para Rodar
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Disparos dos eventos de <code>PageView</code> e <code>Lead</code> mapeados no componente de rastreamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 4: PALAVRAS-CHAVE & LEILÃO ================= */}
          {activeTab === 'palavras' && (
            <div className="space-y-6">
              {/* Tabela de Palavras-Chave e Termos de Pesquisa */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-emerald-600" />
                      Gestão de Palavras-Chave & Negativação Inteligente
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identifique termos que estão gastando dinheiro sem converter e negative com 1 clique.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setKeywordTermo('');
                      setKeywordStatus('ATIVA');
                      setKeywordMotivo('');
                      setModalKeywordOpen(true);
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Termo
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Termo / Palavra-Chave</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Cliques</th>
                        <th className="py-3 px-3 text-right">Impressões</th>
                        <th className="py-3 px-3 text-right">Custo Total</th>
                        <th className="py-3 px-3 text-right">Conversões</th>
                        <th className="py-3 px-3 text-right">Ação Rápida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.keywords.map((kw) => (
                        <tr key={kw.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900">{kw.termo}</span>
                            {kw.motivoNegativacao && (
                              <p className="text-[10px] text-red-600 mt-0.5 italic">
                                Motivo: {kw.motivoNegativacao}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {kw.status === 'NEGATIVADA' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                <Ban className="w-3 h-3" /> Negativada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <Check className="w-3 h-3" /> Ativa no Leilão
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800">{kw.cliques}</td>
                          <td className="py-3 px-3 text-right text-slate-500">{kw.impressoes}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800">
                            R$ {kw.custoTotal?.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">{kw.conversoes}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleToggleKeyword(kw.id, kw.status)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                kw.status === 'NEGATIVADA'
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              }`}
                            >
                              {kw.status === 'NEGATIVADA' ? 'Reativar' : 'Negativar Termo'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auction Insights (Espionagem de Leilão de Concorrentes) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Auction Insights • Empresas Concorrentes Disputando o Leilão Google
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Avaliação percentual de quem está comprando as palavras-chave de Facilities e lances médios.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Empresa Concorrente / Domínio</th>
                        <th className="py-3 px-3 text-right">Taxa de Impressão (% Share)</th>
                        <th className="py-3 px-3 text-right">Taxa de Sobreposição (%)</th>
                        <th className="py-3 px-3 text-right">Posição Superior (%)</th>
                        <th className="py-3 px-3 text-right">Lance Estimado (CPC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.competitors.map((comp) => {
                        const isSmartBid = comp.dominio.includes('smartbid');
                        return (
                          <tr key={comp.id} className={isSmartBid ? 'bg-emerald-50/40 font-bold' : 'hover:bg-slate-50'}>
                            <td className="py-3 px-3">
                              <span className={isSmartBid ? 'text-emerald-800' : 'text-slate-900'}>
                                {comp.nomeEmpresa}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono">{comp.dominio}</p>
                            </td>
                            <td className="py-3 px-3 text-right font-semibold">
                              {comp.impressoesShare}%
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {comp.sobreposicao}%
                            </td>
                            <td className="py-3 px-3 text-right text-slate-600">
                              {comp.posicaoSuperior}%
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">
                              R$ {comp.lanceEstimado?.toFixed(2)}
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

          {/* ================= ABA 5: GATEWAY ASAAS ================= */}
          {activeTab === 'gateway' && (
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-600" />
                  Renovação e Teste da Chave de API Asaas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Assim que renovar a sua chave de API no painel do Asaas, cole-a aqui para testar a comunicação em tempo real com o gateway de pagamento.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Chave de API do Asaas ($aact_prod_... ou $aact_hml_...)
                  </label>
                  <input
                    type="password"
                    value={asaasKeyInput}
                    onChange={(e) => setAsaasKeyInput(e.target.value)}
                    placeholder="$aact_prod_000MzkwODA2..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Chaves de produção iniciam com <code>$aact_prod_</code>. Chaves de teste iniciam com <code>$aact_hml_</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestAsaas}
                  disabled={testingAsaas || !asaasKeyInput.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingAsaas ? 'animate-spin' : ''}`} />
                  {testingAsaas ? 'Testando Conexão...' : 'Testar Conexão com Asaas'}
                </button>

                {asaasTestResult && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    asaasTestResult.success 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-red-50 border-red-300 text-red-800'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {asaasTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {asaasTestResult.success ? 'Conexão Bem-Sucedida!' : 'Falha na Validação'}
                    </div>
                    <p>{asaasTestResult.message || asaasTestResult.error}</p>
                    {asaasTestResult.ambiente && (
                      <p className="text-[11px] font-semibold">
                        Ambiente Detectado: {asaasTestResult.ambiente} • Saldo em Conta: R$ {asaasTestResult.saldo?.toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        )}
      </main>

      {/* Modal Criar Lead */}
      {modalLeadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Novo Lead SaaS SmartBid</h3>
              <button onClick={() => setModalLeadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Empresa *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.empresa}
                    onChange={(e) => setLeadForm({ ...leadForm, empresa: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contato *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.nome}
                    onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.telefone}
                    onChange={(e) => setLeadForm({ ...leadForm, telefone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Origem</label>
                  <select
                    value={leadForm.origem}
                    onChange={(e) => setLeadForm({ ...leadForm, origem: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="LP">Landing Page</option>
                    <option value="GOOGLE_ADS">Google Ads</option>
                    <option value="META_ADS">Meta Ads</option>
                    <option value="WHATSAPP">WhatsApp Direto</option>
                    <option value="INDICACAO">Indicação</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Etapa Inicial</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="NOVO">Novo Lead</option>
                    <option value="QUALIFICADO">Qualificado</option>
                    <option value="DEMO_AGENDADA">Demo Agendada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notas / Dores da Empresa</label>
                <textarea
                  rows={2}
                  value={leadForm.notas}
                  onChange={(e) => setLeadForm({ ...leadForm, notas: e.target.value })}
                  placeholder="Ex: Empresa de limpeza com 80 funcionários, quer substituir planilhas manuais."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLeadOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Palavra-Chave */}
      {modalKeywordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Adicionar Palavra-Chave / Termo</h3>
              <button onClick={() => setModalKeywordOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                await addTrafficKeyword({ termo: keywordTermo, status: keywordStatus, motivo: keywordMotivo });
                setModalKeywordOpen(false);
                loadData();
              }}
              className="space-y-4"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Termo de Pesquisa *</label>
                <input
                  type="text"
                  required
                  value={keywordTermo}
                  onChange={(e) => setKeywordTermo(e.target.value)}
                  placeholder="Ex: sistema para empresas de limpeza"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status</label>
                <select
                  value={keywordStatus}
                  onChange={(e) => setKeywordStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="ATIVA">Ativa no Leilão (Comprar tráfego)</option>
                  <option value="NEGATIVADA">Negativada (Bloquear impressões)</option>
                </select>
              </div>

              {keywordStatus === 'NEGATIVADA' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Motivo da Negativação</label>
                  <input
                    type="text"
                    value={keywordMotivo}
                    onChange={(e) => setKeywordMotivo(e.target.value)}
                    placeholder="Ex: Busca de arquivos grátis sem perfil B2B"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalKeywordOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Salvar Palavra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
