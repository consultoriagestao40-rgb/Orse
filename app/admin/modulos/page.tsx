'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  getTenantsForModulosAction, 
  updateTenantModulosAction 
} from './actions';
import {
  MODULOS_CATALOGO,
  PLANOS_PRESETS,
  type TenantFeaturesConfig,
  type ModulePricingItem,
  type PlanoPreset
} from './constants';
import { 
  Layers, CheckCircle2, Shield, Users, DollarSign, 
  Sparkles, Copy, Check, Save, RefreshCw, Building2, 
  MessageSquare, Target, CheckSquare, FileText, ClipboardList, 
  Boxes, Truck, AlertCircle, ArrowRight, Zap, HelpCircle, ChevronRight,
  Gift, Award, Crown, Sliders, Lock
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

  // Preset de plano ativo
  const [selectedPresetId, setSelectedPresetId] = useState<string>('PRO');

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
  const pricePerExtraUser = 25.0; // Valor acessível de usuário adicional

  // Taxa de setup: Padrão R$ 0,00 (Preço fechado por mês. Sem taxa escondida, conforme a LP)
  const [setupFee, setSetupFee] = useState<number>(0.0);
  const [setupInstallments, setSetupInstallments] = useState<number>(1);
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
      if (!res.success && res.error === 'Não autenticado') {
        window.location.href = '/login';
        return;
      }
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
    const featuresObj: TenantFeaturesConfig = {
      crm: f.crm !== undefined ? Boolean(f.crm) : true,
      tasks: f.tasks !== undefined ? Boolean(f.tasks) : true,
      contratos: f.contratos !== undefined ? Boolean(f.contratos) : true,
      atas: f.atas !== undefined ? Boolean(f.atas) : true,
      pic: f.pic !== undefined ? Boolean(f.pic) : true,
      ativos: f.ativos !== undefined ? Boolean(f.ativos) : false,
      entregas: f.entregas !== undefined ? Boolean(f.entregas) : false,
      erpflex: f.erpflex !== undefined ? Boolean(f.erpflex) : false
    };
    setActiveFeatures(featuresObj);

    // Identificar preset pelo plano cadastrado no Tenant
    const planoCadastrado = String(tenant.plano || '').toUpperCase();
    if (planoCadastrado.includes('GRATIS') || planoCadastrado.includes('FREE')) {
      setSelectedPresetId('GRATIS');
    } else if (planoCadastrado.includes('BASICO') || planoCadastrado.includes('STARTER')) {
      setSelectedPresetId('BASICO');
    } else if (planoCadastrado.includes('PRO') || planoCadastrado.includes('PROFISSIONAL')) {
      setSelectedPresetId('PRO');
    } else if (planoCadastrado.includes('ENTERPRISE')) {
      setSelectedPresetId('ENTERPRISE');
    } else {
      setSelectedPresetId('CUSTOM');
    }

    const limUsers = tenant.limiteUsuarios || 3;
    const baseIncluded = getBaseUsersForPreset(planoCadastrado);
    setExtraUsers(Math.max(0, limUsers - baseIncluded));
  };

  const getBaseUsersForPreset = (presetId: string) => {
    if (presetId === 'GRATIS') return 1;
    if (presetId === 'BASICO') return 3;
    if (presetId === 'PRO') return 10;
    if (presetId === 'ENTERPRISE') return 100;
    return 3;
  };

  const handleSelectTenant = (id: string) => {
    setSelectedTenantId(id);
    if (id === 'simulation') {
      applyPreset('PRO');
      return;
    }
    const found = tenants.find(t => t.id === id);
    if (found) {
      syncTenantFeatures(found);
    }
  };

  // Aplicação rápida de Preset Oficial da LP
  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PLANOS_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActiveFeatures({ ...preset.features });
    setExtraUsers(0);
    setDiscountPct(0);
    setSetupFee(0.0);
  };

  const toggleModule = (modId: keyof TenantFeaturesConfig | 'core') => {
    if (modId === 'core') return; // Core é sempre base
    setSelectedPresetId('CUSTOM'); // Passa para modo sob medida
    setActiveFeatures(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // Cálculos financeiros alinhados aos planos da LP
  const calculations = useMemo(() => {
    const list = Array.isArray(MODULOS_CATALOGO) ? MODULOS_CATALOGO : [];
    const core = list.find(m => m.id === 'core') || list[0];
    const modulosSelecionadosList: ModulePricingItem[] = core ? [core] : [];

    list.forEach(mod => {
      if (mod.id !== 'core') {
        const isSelected = Boolean(activeFeatures[mod.id as keyof TenantFeaturesConfig]);
        if (isSelected) {
          modulosSelecionadosList.push(mod);
        }
      }
    });

    // Se estiver em um dos presets oficiais fechados da LP, usa o preço oficial do pacote:
    let subtotalMensalidade = 0;
    const baseUsers = getBaseUsersForPreset(selectedPresetId);

    if (selectedPresetId === 'GRATIS') {
      subtotalMensalidade = 0.0;
    } else if (selectedPresetId === 'BASICO') {
      subtotalMensalidade = 149.0;
    } else if (selectedPresetId === 'PRO') {
      // No PRO da LP é R$ 299/mês. Se incluir WhatsApp/CRM já está incluso.
      subtotalMensalidade = 299.0;
    } else if (selectedPresetId === 'ENTERPRISE') {
      subtotalMensalidade = 599.0;
    } else {
      // Modo CUSTOM: Soma base R$ 149 + adicionais
      subtotalMensalidade = 149.0;
      list.forEach(mod => {
        if (mod.id !== 'core') {
          if (activeFeatures[mod.id as keyof TenantFeaturesConfig]) {
            subtotalMensalidade += mod.precoMensal;
          }
        }
      });
    }

    const totalExtraUsersPrice = extraUsers * pricePerExtraUser;
    const totalUsers = baseUsers + extraUsers;
    const subtotalGeral = subtotalMensalidade + totalExtraUsersPrice;

    const discountValue = (subtotalGeral * discountPct) / 100;
    const totalMensalidade = Math.max(0, subtotalGeral - discountValue);
    const totalAnual = totalMensalidade * 12;

    const installmentSetup = setupInstallments > 0 ? setupFee / setupInstallments : setupFee;

    return {
      subtotalMensalidade,
      totalExtraUsersPrice,
      totalUsers,
      baseUsers,
      subtotalGeral,
      discountValue,
      totalMensalidade,
      totalAnual,
      installmentSetup,
      modulosSelecionadosList
    };
  }, [activeFeatures, selectedPresetId, extraUsers, discountPct, setupFee, setupInstallments]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Salvar alterações no Tenant
  const handleSaveToTenant = async () => {
    if (selectedTenantId === 'simulation') {
      alert('Selecione uma empresa cadastrada no seletor acima para aplicar os módulos.');
      return;
    }

    setSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const res = await updateTenantModulosAction(
        selectedTenantId,
        activeFeatures,
        calculations.totalUsers,
        selectedPresetId
      );

      if (res.success) {
        setSaveSuccessMsg(`Plano e permissões atualizados com sucesso para ${selectedPresetId}!`);
        setTenants(prev => prev.map(t => t.id === selectedTenantId ? {
          ...t,
          features: activeFeatures,
          plano: selectedPresetId,
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

    const presetObj = PLANOS_PRESETS.find(p => p.id === selectedPresetId);
    text += `📋 *PLANO CONTRATADO:* *${presetObj ? presetObj.nome : 'Plano Personalizado'}*\n`;
    text += `Preço fechado por mês, sem taxa de implantação escondida.\n\n`;

    text += `🛠️ *MÓDULOS INCLUSOS:*\n`;
    calculations.modulosSelecionadosList.forEach(m => {
      text += `• *${m.nome}*\n`;
    });

    text += `\n👥 *USUÁRIOS:* ${calculations.totalUsers} usuários inclusos (${calculations.baseUsers} base${extraUsers > 0 ? ` + ${extraUsers} extras` : ''})\n\n`;

    text += `💰 *CONDIÇÕES FINANCEIRAS:*\n`;
    text += `• *Mensalidade (SaaS):* ${formatBRL(calculations.totalMensalidade)}/mês`;
    if (discountPct > 0) {
      text += ` (com ${discountPct}% de desconto promocional aplicado)`;
    }
    if (setupFee > 0) {
      text += `\n• *Treinamento & Parametrização Opcional:* ${formatBRL(setupFee)}`;
    } else {
      text += `\n• *Taxa de Implantação:* R$ 0,00 (Isenta)`;
    }
    text += `\n• *Investimento Anual Previsto:* ${formatBRL(calculations.totalAnual)}\n\n`;

    text += `🚀 *BENEFÍCIOS PRINCIPAIS:*\n`;
    text += `✅ Fim dos riscos e fórmulas quebradas do Excel na formação de CCTs;\n`;
    text += `✅ Propostas comerciais A4 geradas em minutos com link rastreável;\n`;
    text += `✅ Controle de reajustes anuais de contratos na data-base;\n`;
    text += `✅ Suporte técnico especializado e atualizações contínuas da plataforma.\n\n`;

    text += `Ficamos à disposição para darmos início à liberação do acesso!`;

    navigator.clipboard.writeText(text);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  const selectedTenantObj = tenants.find(t => t.id === selectedTenantId);

  // Filtros de módulos
  const modulosComerciais = MODULOS_CATALOGO.filter(m => m.id !== 'core' && m.categoria === 'COMERCIAL');
  const modulosEspecializados = MODULOS_CATALOGO.filter(m => m.categoria === 'ESPECIALIZADO');

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
                Alinhado aos planos oficiais da Landing Page. Configure os pacotes comerciais e ative ferramentas por empresa.
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
                      🏢 {t.nomeFantasia} ({t.cnpj || 'Sem CNPJ'}) — Plano: {t.plano || 'STARTER'}
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

          {/* SELETOR RÁPIDO DE PRESETS (PLANOS OFICIAIS DA LP) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Presets Rápidos de Planos da Landing Page
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Clique em um plano para aplicar imediatamente a combinação de módulos e limites recomendados:
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                Plano Selecionado: <strong className="text-slate-900">{selectedPresetId}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              
              {/* PLANO GRÁTIS */}
              <button
                type="button"
                onClick={() => applyPreset('GRATIS')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedPresetId === 'GRATIS'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Gift size={16} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Freemium
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-800 mt-2">Plano Grátis</h4>
                <p className="text-xs font-black text-emerald-700 mt-0.5">R$ 0,00 <span className="text-[10px] text-slate-500 font-normal">/mês</span></p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  1 usuário, 1 CCT, 5 FPVs e 5 propostas.
                </p>
              </button>

              {/* PLANO BÁSICO */}
              <button
                type="button"
                onClick={() => applyPreset('BASICO')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPresetId === 'BASICO'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
                    <Award size={16} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Básico
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-800 mt-2">Básico</h4>
                <p className="text-xs font-black text-slate-900 mt-0.5">R$ 149,00 <span className="text-[10px] text-slate-500 font-normal">/mês</span></p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  3 usuários, Link Rastreável e CRM essencial.
                </p>
              </button>

              {/* PLANO PROFISSIONAL (DESTAQUE) */}
              <button
                type="button"
                onClick={() => applyPreset('PRO')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  selectedPresetId === 'PRO'
                    ? 'bg-[#1B4D3E] text-white border-[#1B4D3E] ring-2 ring-[#1B4D3E]/30 shadow-md'
                    : 'bg-slate-900 text-white hover:bg-black border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-white/20 text-emerald-300 rounded-lg">
                    <Crown size={16} />
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                    Mais Escolhido
                  </span>
                </div>
                <h4 className="font-black text-sm text-white mt-2">Profissional</h4>
                <p className="text-xs font-black text-emerald-300 mt-0.5">R$ 299,00 <span className="text-[10px] text-white/70 font-normal">/mês</span></p>
                <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                  10 usuários, Contratos, Tasks, Alertas CCT.
                </p>
              </button>

              {/* PLANO ENTERPRISE */}
              <button
                type="button"
                onClick={() => applyPreset('ENTERPRISE')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPresetId === 'ENTERPRISE'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Building2 size={16} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    Grandes Filiais
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-800 mt-2">Enterprise</h4>
                <p className="text-xs font-black text-slate-900 mt-0.5">R$ 599,00 <span className="text-[10px] text-slate-500 font-normal">/mês</span></p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  100 usuários, tudo liberado, APIs e SLA 24/7.
                </p>
              </button>

              {/* MODO PERSONALIZADO */}
              <button
                type="button"
                onClick={() => setSelectedPresetId('CUSTOM')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPresetId === 'CUSTOM'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Sliders size={16} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Custom
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-800 mt-2">Sob Medida</h4>
                <p className="text-xs font-black text-amber-800 mt-0.5">Modular <span className="text-[10px] text-slate-500 font-normal">À La Carte</span></p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                  Ative ou desative cada módulo livremente.
                </p>
              </button>

            </div>
          </div>

          {/* CARDS DE RESUMO RÁPIDO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mensalidade (MRR)</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {formatBRL(calculations.totalMensalidade)}
                <span className="text-xs text-slate-400 font-medium">/mês</span>
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
                {selectedPresetId === 'GRATIS' ? 'Degustação Gratuita' : 'Preço Fechado Mensal'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Taxa de Implantação</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {formatBRL(setupFee)}
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                {setupFee === 0 ? 'Sem taxa escondida' : `${setupInstallments}x de ${formatBRL(calculations.installmentSetup)}`}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Módulos Ativos</span>
              <p className="text-xl md:text-2xl font-black text-[#1B4D3E] mt-1">
                {calculations.modulosSelecionadosList.length} <span className="text-xs text-slate-400 font-medium">de {MODULOS_CATALOGO.length}</span>
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                {selectedPresetId}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Usuários Liberados</span>
              <p className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                {calculations.totalUsers} <span className="text-xs text-slate-400 font-medium">acessos</span>
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
                {calculations.baseUsers} base + {extraUsers} extras
              </span>
            </div>
          </div>

          {/* GRID PRINCIPAL: MÓDULOS (ESQUERDA) + RESUMO/AÇÕES (DIREITA) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* COLUNA ESQUERDA: LISTA DE MÓDULOS */}
            <div className="lg:col-span-2 space-y-6">

              {/* CARD CORE (BASE OBRIGATÓRIA DA ENGENHARIA DE CUSTOS) */}
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
                          Base Inclusa
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium mt-0.5">
                        A fundação da engenharia de custos para facilities: CCTs, encargos A/B/C/D, FPVs e propostas.
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-[10px] text-emerald-200 uppercase font-black tracking-wider block">Status</span>
                    <span className="text-base font-black text-white">Incluso no Pacote</span>
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

              {/* SEÇÃO 1: MÓDULOS CENTRAIS DE GESTÃO COMERCIAL & CONTRATOS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Módulos de Gestão Comercial, Leads & Contratos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ferramentas voltadas para resolver a dor comercial, captação de clientes e controle de reajustes.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {modulosComerciais.filter(m => activeFeatures[m.id as keyof TenantFeaturesConfig]).length} de {modulosComerciais.length} ativos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modulosComerciais.map(mod => {
                    const isChecked = Boolean(activeFeatures[mod.id as keyof TenantFeaturesConfig]);
                    const IconComp = MODULE_ICONS[mod.id] || Target;

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
                                  Ref: {formatBRL(mod.precoMensal)}/mês
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

                          {/* BENEFÍCIOS */}
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
                            {isChecked ? '● Ativo na Empresa' : '○ Desativado'}
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

              {/* SEÇÃO 2: MÓDULOS ESPECIALIZADOS / SOB DEMANDA (EX: SLIMPE) */}
              <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Boxes size={15} /> Módulos Operacionais Sob Medida (Slimpe / Especiais)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ferramentas exclusivas para empresas com operações de comodato e frota física de entregas.
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    Customizado
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {modulosEspecializados.map(mod => {
                    const isChecked = Boolean(activeFeatures[mod.id as keyof TenantFeaturesConfig]);
                    const IconComp = MODULE_ICONS[mod.id] || Boxes;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isChecked 
                            ? 'bg-white border-[#1B4D3E] shadow-sm' 
                            : 'bg-white/60 border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isChecked ? 'bg-[#1B4D3E]/10 text-[#1B4D3E]' : 'bg-slate-200 text-slate-500'
                            }`}>
                              <IconComp size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 leading-tight">
                                {mod.nome}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{formatBRL(mod.precoMensal)}/mês
                              </span>
                            </div>
                          </div>

                          <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            isChecked ? 'bg-[#1B4D3E]' : 'bg-slate-300'
                          }`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                          {mod.descricao}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO: USUÁRIOS E IMPLANTAÇÃO */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Users size={16} className="text-[#1B4D3E]" />
                  Acessos & Usuários Adicionais
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
                      O plano {selectedPresetId} inclui {calculations.baseUsers} acessos. Cada extra custa +{formatBRL(pricePerExtraUser)}/mês.
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

                  {/* IMPLANTAÇÃO / SETUP (DEFAULT R$ 0,00) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Taxa de Implantação / Setup</label>
                      <span className="text-xs font-black text-slate-800">
                        {setupFee === 0 ? 'Isenta (R$ 0,00)' : formatBRL(setupFee)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Padrão SmartBid: Preço fechado mensal sem taxas escondidas.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        step="50"
                        min="0"
                        value={setupFee}
                        onChange={e => setSetupFee(Number(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-28 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                      />
                      {setupFee > 0 && (
                        <select
                          value={setupInstallments}
                          onChange={e => setSetupInstallments(Number(e.target.value))}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                        >
                          <option value={1}>1x</option>
                          <option value={2}>2x de {formatBRL(setupFee / 2)}</option>
                          <option value={3}>3x de {formatBRL(setupFee / 3)}</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* DESCONTO COMERCIAL */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Desconto Promocional na Mensalidade:</span>
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
                      Economia de {formatBRL(calculations.discountValue)}/mês
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: PAINEL STICKY DE RESUMO E AÇÕES */}
            <div className="space-y-4 lg:sticky lg:top-8">
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
                
                {/* CABEÇALHO DO RESUMO */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Proposta Comercial</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="text-lg font-black text-slate-800">
                      Resumo do Pacote
                    </h3>
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedPresetId}
                    </span>
                  </div>

                  {selectedTenantId === 'simulation' && (
                    <div className="mt-3">
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

                {/* LISTAGEM DE ITENS INCLUSOS */}
                <div className="space-y-2 border-t border-slate-100 pt-4 max-h-[260px] overflow-y-auto">
                  {calculations.modulosSelecionadosList.map(mod => (
                    <div key={mod.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium truncate pr-2 flex items-center gap-1.5">
                        <Check size={13} className="text-emerald-600 shrink-0" />
                        {mod.nome}
                      </span>
                      <span className="font-bold text-slate-800 shrink-0 text-[11px]">
                        Incluso
                      </span>
                    </div>
                  ))}

                  {extraUsers > 0 && (
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-1.5">
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
                    <span className="text-slate-600 font-medium">Taxa de Implantação:</span>
                    <span className="font-bold text-slate-800">{setupFee === 0 ? 'R$ 0,00 (Isenta)' : formatBRL(setupFee)}</span>
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
                          <span>Ativar {selectedPresetId} nesta Empresa</span>
                        </>
                      )}
                    </button>
                  )}

                  {selectedTenantId === 'simulation' && (
                    <p className="text-[11px] text-slate-400 text-center font-medium">
                      💡 Para aplicar este plano em uma empresa real, selecione o cliente no topo da página.
                    </p>
                  )}
                </div>

              </div>

              {/* CARD DESTRUTURADOR DE OBJEÇÕES COMERCIAIS */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs space-y-2">
                <span className="font-black uppercase tracking-wider text-[10px] text-emerald-800 flex items-center gap-1.5">
                  <Zap size={14} className="text-emerald-600" /> Estratégia Comercial SmartBid
                </span>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  O <strong>Plano Grátis</strong> atrai o lead e o deixa calcular a primeira proposta. Ao atingir o limite ou precisar de <strong>Contratos com alerta de reajuste</strong>, o upgrade para o <strong>Profissional (R$ 299/mês)</strong> é o caminho natural!
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
