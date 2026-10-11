'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  MODULOS_CATALOGO, 
  getTenantsForModulosAction, 
  updateTenantModulosAction,
  TenantFeaturesConfig,
  ModulePricingItem 
} from './actions';
import { 
  Layers, CheckCircle2, Shield, Users, DollarSign, 
  Sparkles, Copy, Check, Save, RefreshCw, Building2, 
  MessageSquare, Target, CheckSquare, FileText, ClipboardList, 
  Boxes, Truck, AlertCircle, ArrowRight, Zap, HelpCircle, ChevronRight
} from 'lucide-react';

const MODULE_ICONS: Record<string, any> = {
  core: Shield,
  crm: Target,
  tasks: CheckSquare,
  contratos: FileText,
  atas: ClipboardList,
  pic: Sparkles,
  ativos: Boxes,
  entregas: Truck
};

export default function ModulosPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('simulation');

  // Estados da Calculadora / Configuração
  const [activeFeatures, setActiveFeatures] = useState<TenantFeaturesConfig>({
    crm: true,
    tasks: true,
    contratos: true,
    atas: true,
    pic: true,
    ativos: false,
    entregas: false
  });

  const [extraUsers, setExtraUsers] = useState<number>(0);
  const pricePerExtraUser = 49.0;
  const baseIncludedUsers = 3;

  const [setupFee, setSetupFee] = useState<number>(1900.0);
  const [setupInstallments, setSetupInstallments] = useState<number>(2);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [customClientName, setCustomClientName] = useState<string>('');

  const [copiedProposal, setCopiedProposal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Carregar lista de tenants
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getTenantsForModulosAction();
      if (res.success && res.tenants) {
        setTenants(res.tenants);
        setIsPlatformAdmin(Boolean(res.isPlatformAdmin));

        // Se tem tenant atual ou primeiro tenant, seleciona
        if (res.currentTenantId) {
          const current = res.tenants.find((t: any) => t.id === res.currentTenantId);
          if (current) {
            setSelectedTenantId(current.id);
            syncTenantFeatures(current);
          } else if (res.tenants.length > 0) {
            setSelectedTenantId(res.tenants[0].id);
            syncTenantFeatures(res.tenants[0]);
          }
        } else if (res.tenants.length > 0) {
          setSelectedTenantId(res.tenants[0].id);
          syncTenantFeatures(res.tenants[0]);
        }
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

  const syncTenantFeatures = (tenant: any) => {
    if (!tenant) return;
    const f = tenant.features || {};
    setActiveFeatures({
      crm: f.crm !== undefined ? Boolean(f.crm) : true,
      tasks: f.tasks !== undefined ? Boolean(f.tasks) : true,
      contratos: f.contratos !== undefined ? Boolean(f.contratos) : true,
      atas: f.atas !== undefined ? Boolean(f.atas) : true,
      pic: f.pic !== undefined ? Boolean(f.pic) : true,
      ativos: f.ativos !== undefined ? Boolean(f.ativos) : false,
      entregas: f.entregas !== undefined ? Boolean(f.entregas) : false,
      erpflex: f.erpflex !== undefined ? Boolean(f.erpflex) : false
    });

    const limUsers = tenant.limiteUsuarios || 3;
    setExtraUsers(Math.max(0, limUsers - baseIncludedUsers));
  };

  const handleSelectTenant = (id: string) => {
    setSelectedTenantId(id);
    if (id === 'simulation') {
      // Padrão de simulação
      return;
    }
    const found = tenants.find(t => t.id === id);
    if (found) {
      syncTenantFeatures(found);
    }
  };

  const toggleModule = (modId: keyof TenantFeaturesConfig | 'core') => {
    if (modId === 'core') return; // Core é obrigatório
    setActiveFeatures(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // Cálculos financeiros
  const calculations = useMemo(() => {
    const core = MODULOS_CATALOGO.find(m => m.id === 'core')!;
    let subtotalModulos = core.precoMensal;

    const modulosSelecionadosList: ModulePricingItem[] = [core];

    MODULOS_CATALOGO.forEach(mod => {
      if (mod.id !== 'core') {
        const isSelected = Boolean(activeFeatures[mod.id as keyof TenantFeaturesConfig]);
        if (isSelected) {
          subtotalModulos += mod.precoMensal;
          modulosSelecionadosList.push(mod);
        }
      }
    });

    const totalExtraUsersPrice = extraUsers * pricePerExtraUser;
    const totalUsers = baseIncludedUsers + extraUsers;
    const subtotalGeral = subtotalModulos + totalExtraUsersPrice;

    const discountValue = (subtotalGeral * discountPct) / 100;
    const totalMensalidade = Math.max(0, subtotalGeral - discountValue);
    const totalAnual = totalMensalidade * 12;

    const installmentSetup = setupInstallments > 0 ? setupFee / setupInstallments : setupFee;

    return {
      subtotalModulos,
      totalExtraUsersPrice,
      totalUsers,
      subtotalGeral,
      discountValue,
      totalMensalidade,
      totalAnual,
      installmentSetup,
      modulosSelecionadosList
    };
  }, [activeFeatures, extraUsers, discountPct, setupFee, setupInstallments]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Salvar alterações no Tenant
  const handleSaveToTenant = async () => {
    if (selectedTenantId === 'simulation') {
      alert('Selecione uma empresa cadastrada acima para aplicar e ativar os módulos no sistema.');
      return;
    }

    setSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const res = await updateTenantModulosAction(
        selectedTenantId,
        activeFeatures,
        calculations.totalUsers
      );

      if (res.success) {
        setSaveSuccessMsg('Módulos e permissões atualizados com sucesso no sistema!');
        // Atualiza o estado local do tenant
        setTenants(prev => prev.map(t => t.id === selectedTenantId ? {
          ...t,
          features: activeFeatures,
          limiteUsuarios: calculations.totalUsers
        } : t));

        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        setSaveErrorMsg(res.error || 'Erro ao salvar alterações.');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Falha na comunicação com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Copiar Proposta Comercial Formatada para WhatsApp / Email
  const handleCopyProposal = () => {
    const selectedTenant = tenants.find(t => t.id === selectedTenantId);
    const clientName = selectedTenantId !== 'simulation' && selectedTenant
      ? selectedTenant.nomeFantasia 
      : (customClientName || 'Sua Empresa');

    let text = `*PROPOSTA COMERCIAL — PLATAFORMA SMARTBID*\n`;
    text += `Para: *${clientName}*\n`;
    text += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    text += `Olá! Conforme conversamos, segue a composição da proposta personalizada do *SmartBid* para a sua operação:\n\n`;

    text += `📋 *MÓDULOS CONTRATADOS:*\n`;
    calculations.modulosSelecionadosList.forEach(m => {
      text += `• *${m.nome}* (${formatBRL(m.precoMensal)}/mês)\n`;
    });

    text += `\n👥 *USUÁRIOS:* ${calculations.totalUsers} usuários inclusos (${baseIncludedUsers} base + ${extraUsers} adicionais)\n\n`;

    text += `💰 *CONDIÇÕES FINANCEIRAS:*\n`;
    text += `• *Mensalidade (SaaS):* ${formatBRL(calculations.totalMensalidade)}/mês`;
    if (discountPct > 0) {
      text += ` (com ${discountPct}% de desconto promocional aplicado)`;
    }
    text += `\n• *Implantação & Treinamento:* ${formatBRL(setupFee)}`;
    if (setupInstallments > 1) {
      text += ` (em até ${setupInstallments}x de ${formatBRL(calculations.installmentSetup)})`;
    }
    text += `\n• *Investimento Anual Previsto:* ${formatBRL(calculations.totalAnual)}\n\n`;

    text += `🚀 *BENEFÍCIOS PRINCIPAIS:*\n`;
    text += `✅ Fim dos riscos e fórmulas quebradas do Excel na formação de CCTs;\n`;
    text += `✅ Propostas comerciais A4 geradas em minutos com link rastreável;\n`;
    text += `✅ Gestão integrada de custos de EPIs, uniformes e benefícios;\n`;
    text += `✅ Suporte técnico especializado e atualizações contínuas da plataforma.\n\n`;

    text += `Ficamos à disposição para darmos início à implantação!`;

    navigator.clipboard.writeText(text);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  const selectedTenantObj = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-xl border border-[#1B4D3E]/20">
                  <Layers size={22} />
                </span>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  Gestão & Precificação de Módulos
                </h1>
              </div>
              <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
                Configure o pacote de ferramentas, simule propostas comerciais e ative/desative recursos por cliente.
              </p>
            </div>

            {/* SELETOR DE EMPRESA / SIMULAÇÃO */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ambiente / Empresa</span>
                <select
                  value={selectedTenantId}
                  onChange={e => handleSelectTenant(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1B4D3E] shadow-xs cursor-pointer"
                >
                  <option value="simulation">🧪 Simulador Comercial (Novo Prospect)</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      🏢 {t.nomeFantasia} ({t.cnpj || 'Sem CNPJ'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                title="Recarregar dados"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </header>

          {/* NOTIFICAÇÕES */}
          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {saveErrorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* CARDS DE RESUMO RÁPIDO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mensalidade (MRR)</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {formatBRL(calculations.totalMensalidade)}
                <span className="text-xs text-slate-400 font-medium">/mês</span>
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                Recorrência mensal
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Setup / Implantação</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {formatBRL(setupFee)}
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                {setupInstallments}x de {formatBRL(calculations.installmentSetup)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Módulos Ativos</span>
              <p className="text-xl md:text-2xl font-black text-[#1B4D3E] mt-1">
                {calculations.modulosSelecionadosList.length} <span className="text-xs text-slate-400 font-medium">de {MODULOS_CATALOGO.length}</span>
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                Empacotamento modular
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Usuários Liberados</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {calculations.totalUsers} <span className="text-xs text-slate-400 font-medium">acessos</span>
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                {baseIncludedUsers} inclusos + {extraUsers} extras
              </span>
            </div>
          </div>

          {/* GRID PRINCIPAL: MÓDULOS (ESQUERDA) + RESUMO/AÇÕES (DIREITA) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* COLUNA ESQUERDA: LISTA DE MÓDULOS E CONFIGURAÇÃO */}
            <div className="lg:col-span-2 space-y-6">

              {/* CARD CORE (BASE OBRIGATÓRIA) */}
              <div className="bg-gradient-to-br from-[#1B4D3E] to-[#12362B] text-white p-6 rounded-3xl shadow-lg border border-emerald-900 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/10">
                      <Shield size={26} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">SmartBid Core & Precificação</h2>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Obrigatório / Base
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium mt-0.5">
                        A fundação do software. Essencial para formação de preço e emissão de propostas.
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-[10px] text-emerald-200 uppercase font-black tracking-wider block">Preço Base</span>
                    <span className="text-2xl font-black text-white">R$ 690,00</span>
                    <span className="text-xs text-emerald-200">/mês</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
                  {MODULOS_CATALOGO[0].beneficios.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-50">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO: MÓDULOS OPCIONAIS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Módulos Adicionais (À La Carte)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Marque ou desmarque conforme a necessidade e o orçamento do seu cliente.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {MODULOS_CATALOGO.filter(m => m.id !== 'core' && activeFeatures[m.id as keyof TenantFeaturesConfig]).length} de {MODULOS_CATALOGO.length - 1} selecionados
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MODULOS_CATALOGO.filter(m => m.id !== 'core').map(mod => {
                    const isChecked = Boolean(activeFeatures[mod.id as keyof TenantFeaturesConfig]);
                    const IconComp = MODULE_ICONS[mod.id] || Boxes;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isChecked 
                            ? 'bg-white border-[#1B4D3E] shadow-md ring-1 ring-[#1B4D3E]/20' 
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 opacity-80'
                        }`}
                      >
                        <div>
                          {/* CABEÇALHO DO CARD */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                isChecked ? 'bg-[#1B4D3E]/10 text-[#1B4D3E]' : 'bg-slate-200 text-slate-500'
                              }`}>
                                <IconComp size={20} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-800 leading-tight">
                                  {mod.nome}
                                </h4>
                                <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">
                                  +{formatBRL(mod.precoMensal)}/mês
                                </span>
                              </div>
                            </div>

                            {/* TOGGLE SWITCH ESTILIZADO */}
                            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                              isChecked ? 'bg-[#1B4D3E]' : 'bg-slate-300'
                            }`}>
                              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`} />
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-3 font-medium">
                            {mod.descricao}
                          </p>

                          {/* LISTA DE BENEFÍCIOS */}
                          <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3">
                            {mod.beneficios.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                <Check size={13} className={`shrink-0 mt-0.5 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* STATUS BADGE */}
                        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                          <span className={isChecked ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                            {isChecked ? '● Ativo na Proposta' : '○ Não Contratado'}
                          </span>
                          <span className="text-slate-400 font-medium">
                            Clique para alternar
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO: USUÁRIOS E TAXA DE SETUP */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-[#1B4D3E]" />
                  Acessos & Taxa de Implantação
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* USUÁRIOS ADICIONAIS */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Usuários Adicionais</label>
                      <span className="text-xs font-black text-[#1B4D3E]">
                        {calculations.totalUsers} no total
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      O Core já inclui {baseIncludedUsers} usuários. Cada usuário extra custa +{formatBRL(pricePerExtraUser)}/mês.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setExtraUsers(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="font-black text-sm text-slate-800 w-8 text-center">
                        +{extraUsers}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExtraUsers(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-500 font-bold ml-auto">
                        +{formatBRL(calculations.totalExtraUsersPrice)}/mês
                      </span>
                    </div>
                  </div>

                  {/* IMPLANTAÇÃO E TREINAMENTO */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Taxa de Implantação (Setup)</label>
                      <span className="text-xs font-black text-slate-800">
                        {formatBRL(setupFee)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Configuração de CCTs, treinamento da equipe e parametrização.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={setupFee}
                        onChange={e => setSetupFee(Number(e.target.value) || 0)}
                        className="w-28 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                      />
                      <select
                        value={setupInstallments}
                        onChange={e => setSetupInstallments(Number(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value={1}>À vista (1x)</option>
                        <option value={2}>2x de {formatBRL(setupFee / 2)}</option>
                        <option value={3}>3x de {formatBRL(setupFee / 3)}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DESCONTO COMERCIAL */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Desconto Comercial na Mensalidade:</span>
                    <div className="flex items-center gap-1">
                      {[0, 5, 10, 15, 20].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPct(pct)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors ${
                            discountPct === pct 
                              ? 'bg-[#1B4D3E] text-white' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pct === 0 ? 'Sem desc.' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {discountPct > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      Economia de {formatBRL(calculations.discountValue)}/mês para o cliente
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: PAINEL STICKY DE FECHAMENTO COMERCIAL */}
            <div className="space-y-4 lg:sticky lg:top-8">
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
                
                {/* CABEÇALHO DO RESUMO */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Proposta Comercial</span>
                  <h3 className="text-lg font-black text-slate-800 mt-0.5">
                    Resumo do Pacote
                  </h3>
                  {selectedTenantId === 'simulation' && (
                    <div className="mt-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Prospect / Cliente</label>
                      <input
                        type="text"
                        placeholder="Ex: Grupo Facilities Brasil"
                        value={customClientName}
                        onChange={e => setCustomClientName(e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#1B4D3E]"
                      />
                    </div>
                  )}
                </div>

                {/* LISTAGEM DE ITENS */}
                <div className="space-y-2 border-t border-slate-100 pt-4 max-h-[300px] overflow-y-auto">
                  {calculations.modulosSelecionadosList.map(mod => (
                    <div key={mod.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium truncate pr-2">
                        {mod.nome}
                      </span>
                      <span className="font-bold text-slate-800 shrink-0">
                        {formatBRL(mod.precoMensal)}
                      </span>
                    </div>
                  ))}

                  {extraUsers > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">
                        +{extraUsers} Usuários Extras
                      </span>
                      <span className="font-bold text-slate-800 shrink-0">
                        {formatBRL(calculations.totalExtraUsersPrice)}
                      </span>
                    </div>
                  )}

                  {discountPct > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold border-t border-dashed border-slate-200 pt-1">
                      <span>Desconto ({discountPct}%)</span>
                      <span>- {formatBRL(calculations.discountValue)}</span>
                    </div>
                  )}
                </div>

                {/* TOTAIS DESTACADOS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Total Mensal Recorrente (MRR)</span>
                    <p className="text-2xl font-black text-[#1B4D3E] mt-0.5">
                      {formatBRL(calculations.totalMensalidade)}
                      <span className="text-xs text-slate-500 font-normal"> / mês</span>
                    </p>
                  </div>

                  <div className="border-t border-slate-200/80 pt-2 flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Implantação (Setup):</span>
                    <span className="font-bold text-slate-800">{formatBRL(setupFee)}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Projeção Anual (ARR):</span>
                    <span className="font-black text-slate-800">{formatBRL(calculations.totalAnual)}</span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="space-y-2.5">
                  
                  {/* COPIAR PROPOSTA PARA WHATSAPP */}
                  <button
                    onClick={handleCopyProposal}
                    className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-[0.99]"
                  >
                    {copiedProposal ? (
                      <>
                        <Check size={16} className="text-emerald-400" />
                        <span>Copiado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar Proposta Comercial</span>
                      </>
                    )}
                  </button>

                  {/* APLICAR NA EMPRESA (TENANT) */}
                  {selectedTenantId !== 'simulation' && (
                    <button
                      onClick={handleSaveToTenant}
                      disabled={saving}
                      className="w-full bg-[#1B4D3E] hover:bg-[#12362B] text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Atualizando Empresa...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Ativar na Empresa Selecionada</span>
                        </>
                      )}
                    </button>
                  )}

                  {selectedTenantId === 'simulation' && (
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      💡 Para aplicar estas ferramentas na conta do cliente, selecione a empresa no topo da página.
                    </p>
                  )}
                </div>

              </div>

              {/* CARD DE BENEFÍCIOS DO MODELO MODULAR */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs space-y-2">
                <span className="font-black uppercase tracking-wider text-[10px] text-emerald-800 flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-600" /> Vantagem Comercial do Pacote
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  Ao oferecer o <strong>Core de Precificação</strong> como porta de entrada e os demais módulos opcionais, você reduz a resistência do cliente em fechar e aumenta seu <strong>LTV</strong> com upsells contínuos.
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
