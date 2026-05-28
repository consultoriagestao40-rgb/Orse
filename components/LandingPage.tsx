'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, Briefcase, Users, Search, 
  Calendar, Mail, ArrowRight, CheckCircle, Zap, 
  BarChart3, Database, Sparkles, ArrowUpRight, Lock, 
  Fingerprint, FileText, Check, ChevronRight, Menu, X 
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'facilities' | 'varejo' | 'controladoria'>('facilities');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Controle de animação do pipeline interativo
  const [simulatedStep, setSimulatedStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Efeito de pulso simulado no pipeline do Hero
    const interval = setInterval(() => {
      setSimulatedStep(prev => (prev + 1) % 4);
    }, 3500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  // Dados das abas dinâmicas
  const tabContent = {
    facilities: {
      title: 'Facilities & Engenharia de Custos',
      subtitle: 'Precificação e dimensionamento automáticos para postos de trabalho e contratos complexos.',
      badge: 'Facilities FM',
      features: [
        'Cálculo de BDI automático e ajustável por proposta.',
        'Vinculação direta com Convenções Coletivas de Trabalho (CCT).',
        'Cálculo preciso de encargos sociais e benefícios (EPI, transporte, alimentação).',
        'Estudo de custos unitários e insumos homologados.'
      ],
      mockupData: {
        title: 'Estudo de Custos - Limpeza e Conservação 44h',
        kpis: [
          { label: 'Salário Base', value: 'R$ 1.842,50' },
          { label: 'Encargos (CCT)', value: '78.43%' },
          { label: 'Insumos / EPI', value: 'R$ 185,00' },
          { label: 'Preço Proposto', value: 'R$ 4.821,10' }
        ],
        badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      }
    },
    varejo: {
      title: 'Varejo & Comodato de Serviços',
      subtitle: 'Gestão ágil de equipes de campo, vendas de rua, rotas de atendimento e fornecimento.',
      badge: 'Street Sales',
      features: [
        'Planejamento de rotas com mapas de prospecção e geolocalização.',
        'Controle de ativos em comodato com assinatura eletrônica.',
        'Monitoramento de SLAs e relatórios de campo fotográficos.',
        'Funil rápido de propostas para contratos de varejo e alimentação.'
      ],
      mockupData: {
        title: 'Gestão de Pontos e Comodato - Região Sudeste',
        kpis: [
          { label: 'Equipes de Campo', value: '42 Ativas' },
          { label: 'Comodatos Homologados', value: '184 Unidades' },
          { label: 'SLA de Atendimento', value: '99.4%' },
          { label: 'Faturamento Mensal', value: 'R$ 284K' }
        ],
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      }
    },
    controladoria: {
      title: 'Controladoria & Auditoria Laboral',
      subtitle: 'Segurança jurídica absoluta com rastreabilidade completa e histórico de alterações em propostas.',
      badge: 'Compliance',
      features: [
        'Log de auditoria completo (Audit Trail) em tempo real por usuário.',
        'Controle hierárquico de permissões (Administrador, Gestor, Vendedor).',
        'Histórico detalhado de versões de propostas com rollback fácil.',
        'Redução drástica de passivos trabalhistas com fórmulas validadas.'
      ],
      mockupData: {
        title: 'Histórico de Auditoria - Proposta FPV-2026-084',
        kpis: [
          { label: 'Versões Criadas', value: 'v5 Ativa' },
          { label: 'Última Alteração', value: 'Há 4 min por Cristiano S.' },
          { label: 'Margem Validada', value: '14.2% BDI' },
          { label: 'Status Atual', value: 'Aprovado pelo Gestor' }
        ],
        badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 selection:bg-[#10B981] selection:text-[#0F172A] relative overflow-hidden font-sans antialiased">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-gradient-to-br from-[#1B4D3E] to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[10%] right-[10%] w-[450px] h-[450px] bg-gradient-to-bl from-[#10B981]/20 to-transparent rounded-full blur-[120px]" />
      </div>

      {/* HEADER / NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0F172A]/85 backdrop-blur-md border-b border-white/5 py-4 shadow-lg' 
          : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center border border-[#10B981]/30 shadow-lg shadow-emerald-950/40">
              <TrendingUp className="text-[#10B981]" size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase text-white block">
                Smart<span className="text-[#10B981]">BidHub</span>
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.25em] block">Facilities & CRM</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#solucoes" className="text-sm font-semibold text-slate-300 hover:text-[#10B981] transition-colors">Soluções</a>
            <a href="#metricas" className="text-sm font-semibold text-slate-300 hover:text-[#10B981] transition-colors">Resultados</a>
            <a href="#recursos" className="text-sm font-semibold text-slate-300 hover:text-[#10B981] transition-colors">Recursos</a>
            <a href="#precos" className="text-sm font-semibold text-slate-300 hover:text-[#10B981] transition-colors">Preços</a>
          </nav>

          {/* CTA Buttons in top right */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="/login" 
              className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 rounded-xl transition-all"
            >
              Login
            </a>
            <a 
              href="/api/auth/google" 
              className="text-xs font-bold uppercase tracking-widest text-white px-5 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] border border-[#10B981]/30 hover:border-[#10B981]/50 rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 group"
            >
              Criar Conta
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0F172A]/95 border-b border-white/5 shadow-2xl backdrop-blur-lg flex flex-col p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <a 
              href="#solucoes" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-300 py-2 border-b border-white/5"
            >
              Soluções
            </a>
            <a 
              href="#metricas" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-300 py-2 border-b border-white/5"
            >
              Resultados
            </a>
            <a 
              href="#recursos" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-300 py-2 border-b border-white/5"
            >
              Recursos
            </a>
            <a 
              href="#precos" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-slate-300 py-2 border-b border-white/5"
            >
              Preços
            </a>
            
            <div className="flex gap-4 pt-4">
              <a 
                href="/login" 
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-slate-300 py-3.5 border border-white/10 rounded-xl bg-white/5"
              >
                Login
              </a>
              <a 
                href="/api/auth/google" 
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-white py-3.5 bg-[#1B4D3E] border border-[#10B981]/30 rounded-xl"
              >
                Criar Conta
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-xs font-black uppercase tracking-wider text-[#10B981] animate-pulse">
              <Sparkles size={12} />
              Inteligência Artificial & SaaS de Facilities
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-white tracking-tight uppercase">
              Vença Licitações e <br />
              <span className="bg-gradient-to-r from-[#10B981] to-emerald-400 bg-clip-text text-transparent">
                Domine Contratos
              </span> <br />
              de Facilities.
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Acelere suas vendas de serviços B2B com engenharia de custos precisa, cálculo automático de convenções laborais (CCT) e controle de auditoria de ponta a ponta.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/api/auth/google" 
                className="px-8 py-4.5 bg-[#1B4D3E] hover:bg-[#13382D] border border-[#10B981]/40 text-sm font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3 group cursor-pointer"
              >
                Começar Agora Grátis
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#solucoes" 
                className="px-8 py-4.5 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Conhecer Recursos
              </a>
            </div>

            {/* Micro Benefits list */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-4 text-left">
              {[
                'Integração Completa Google Auth',
                'Isolamento Multi-Tenant Seguro',
                'Compatível com CCTs Nacionais',
                'Exportação em PDF A4 Pronta'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <CheckCircle size={14} className="text-[#10B981] shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right Visuals: Interactive Dashboard Teaser */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 w-full bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl max-w-xl mx-auto group hover:border-[#10B981]/20 transition-all duration-500">
              
              {/* Header de Visualização Simulado */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-2">SmartBidHub CRM Pipeline</span>
                </div>
                <div className="bg-[#1B4D3E]/20 text-[#10B981] text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-[#10B981]/20">
                  Simulação Ativa
                </div>
              </div>

              {/* Grid de Cards de Funil Simulado */}
              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { title: '1. Prospecção IA', desc: 'Pesquisa automática de editais', val: 'R$ 1.2M', icon: Search, color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/10' },
                  { title: '2. Estudo FPV', desc: 'Dimensionamento e BDI', val: 'R$ 640K', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                  { title: '3. Proposta', desc: 'Geração de PDF A4 final', val: 'Pronto', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
                  { title: '4. Fechamento', desc: 'Onboarding Multi-Tenant', val: 'Ganhamos! 🎉', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/10' }
                ].map((item, idx) => {
                  const isActive = idx === simulatedStep;
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all duration-700 flex flex-col justify-between h-32 ${
                        isActive 
                          ? 'bg-slate-800/80 border-[#10B981]/50 shadow-lg shadow-[#10B981]/5 scale-[1.03]' 
                          : 'bg-slate-950/40 border-white/5 opacity-60 scale-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-1.5 rounded-lg bg-slate-900 border border-white/10 ${isActive ? 'text-[#10B981]' : 'text-slate-400'}`}>
                          <item.icon size={16} />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-[#10B981]' : 'text-slate-500'}`}>
                          {item.val}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white mt-2">{item.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão de simulação explicativo */}
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Passo atual: {simulatedStep + 1} de 4</span>
                <span className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                  Atualizado em tempo real
                </span>
              </div>
            </div>

            {/* Glowing background circles for visual depth */}
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute -top-6 -left-6 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
          </div>
        </div>
      </section>

      {/* METRICAS SECTION */}
      <section id="metricas" className="relative py-20 bg-slate-950/50 border-y border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Performance Comprovada
            </h2>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Os Resultados que Impulsionam Grandes Contratos
            </h3>
            <p className="text-slate-400 font-medium">
              Empresas de engenharia e prestadores de serviços confiam no ecossistema do SmartBidHub para maximizar suas margens de vendas e garantir compliance laborativo total.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '+R$ 2.4Bi', label: 'Propostas Precificadas', desc: 'Volume bilionário orçado com segurança em nossa plataforma de FPV.' },
              { num: '83.3%', label: 'Economia de Tempo', desc: 'Redução drástica no tempo de pesquisa de insumos e dimensionamento.' },
              { num: '3.2x', label: 'Mais Conversão', desc: 'Aumento significativo na taxa de vitória e aprovação de editais de facilities.' },
              { num: '100%', label: 'Segurança Jurídica', desc: 'Fórmulas validadas conforme CLT, CCTs e regras sindicais vigentes.' }
            ].map((metric, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-[#10B981]/20 hover:bg-slate-900/60 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent block mb-3 uppercase tracking-tight">
                    {metric.num}
                  </span>
                  <span className="text-sm font-bold text-white uppercase tracking-wider block mb-1">
                    {metric.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-4">
                  {metric.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE INTERATIVO (ABAS DINÂMICAS) */}
      <section id="solucoes" className="py-20 md:py-32 z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Plataforma Completa
            </h2>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Uma Solução Sob Medida para cada Necessidade
            </h3>
            <p className="text-slate-400 font-medium">
              Explore as divisões integradas do SmartBidHub e veja como simplificamos a engenharia de propostas, operação de rua e governança.
            </p>

            {/* Alternador de Abas Dinâmico */}
            <div className="inline-flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 gap-1.5 max-w-full overflow-x-auto mt-4">
              {(Object.keys(tabContent) as Array<keyof typeof tabContent>).map((tabKey) => {
                const tab = tabContent[tabKey];
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1B4D3E] text-white border border-[#10B981]/20 shadow-md shadow-emerald-950/40' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Esquerda: Informações detalhadas do módulo */}
            <div className="lg:col-span-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <span className={`inline-block px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${tabContent[activeTab].mockupData.badgeColor}`}>
                {tabContent[activeTab].badge}
              </span>
              
              <h4 className="text-3xl font-black text-white uppercase tracking-tight">
                {tabContent[activeTab].title}
              </h4>
              
              <p className="text-slate-400 font-medium leading-relaxed">
                {tabContent[activeTab].subtitle}
              </p>

              <div className="space-y-3.5 pt-4">
                {tabContent[activeTab].features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-[#10B981]/20 flex items-center justify-center mt-0.5 shrink-0">
                      <Check size={10} className="text-[#10B981]" />
                    </div>
                    <span className="text-sm text-slate-300 font-semibold">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <a 
                  href="/api/auth/google"
                  className="inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-[#10B981] hover:text-emerald-400 transition-colors cursor-pointer group"
                >
                  Experimentar este módulo gratuitamente
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Direita: Mockup visual dinâmico */}
            <div className="lg:col-span-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-full bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#10B981]/30 transition-all duration-300">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">{tabContent[activeTab].mockupData.title}</span>
                  </div>
                  <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/10 font-bold uppercase">
                    Homologado
                  </span>
                </div>

                {/* Simulated KPIs Widget */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {tabContent[activeTab].mockupData.kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-4.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{kpi.label}</p>
                      <p className="text-lg font-black text-white tracking-tight">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                {/* Sub-painel simulador */}
                <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Status do Dimensionamento</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativo
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#1B4D3E] to-[#10B981] h-full rounded-full w-4/5" />
                  </div>
                  <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider pt-1">
                    <span>Custo Previsto: R$ 3.820,00</span>
                    <span>Meta Margem: 15.0%</span>
                  </div>
                </div>

                {/* Glass glow */}
                <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#10B981]/5 rounded-full blur-[50px] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECURSOS DETALHADOS GRID */}
      <section id="recursos" className="py-20 bg-slate-950/30 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Por que escolher o SmartBidHub?
            </h2>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              A Engenharia de Facilities Completa em Suas Mãos
            </h3>
            <p className="text-slate-400 font-medium">
              Elimine planilhas propensas a erros, processos de prospecção lentos e perda de prazos. Centralize tudo em um ecossistema seguro e escalável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'Prospecção Ativa via IA',
                desc: 'Busca inteligente de leads, contatos corporativos e CNPJs em tempo real com redução drástica na requisição de APIs externas graças ao cache local integrado.'
              },
              {
                icon: BarChart3,
                title: 'Planilhas FPV Inteligentes',
                desc: 'Esqueça fórmulas corrompidas do Excel. Nosso motor calcula custos operacionais, insumos, uniformes (EPIs) e taxas com absoluta precisão matemática.'
              },
              {
                icon: Shield,
                title: 'Convenções Coletivas (CCT)',
                desc: 'Acompanhe as regras sindicais em vigor. O sistema valida automaticamente salários base, adicionais de insalubridade e encargos específicos.'
              },
              {
                icon: Calendar,
                title: 'Calendário Global e SPOT',
                desc: 'Controle cronogramas de editais, escalas de trabalho técnico de equipes SPOT e prazos cruciais sem esforço em um painel unificado.'
              },
              {
                icon: Mail,
                title: 'Gestão de E-mails Integrada',
                desc: 'Seu time comercial pode enviar propostas diretamente, realizar follow-ups automáticos e controlar contatos corporativos em lote sem sair do CRM.'
              },
              {
                icon: Fingerprint,
                title: 'Controle Multi-Tenant Total',
                desc: 'Isolamento seguro de dados para cada inquilino de forma transparente, permitindo governança rigorosa e integração facilitada por Google OAuth.'
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-slate-900/50 border border-white/5 rounded-3xl hover:border-[#10B981]/20 hover:bg-slate-900/80 transition-all flex flex-col items-start gap-5">
                <div className="p-3 bg-slate-950 border border-white/10 rounded-2xl text-[#10B981] shadow-lg shadow-black/20">
                  <feature.icon size={22} className="stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider mb-2">{feature.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LUXURY PRICING SECTION */}
      <section id="precos" className="py-20 md:py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Tabela de Preços
            </h2>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Planos Transparentes e Escaláveis
            </h3>
            <p className="text-slate-400 font-medium">
              Escolha a escala ideal para a sua empresa comercial e de engenharia de custos de facilities. Cancelamento flexível a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Plano 1: Starter */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col justify-between hover:border-white/10 transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block mb-2">Smart Starter</span>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Para Iniciar</h4>
                </div>
                
                <div className="py-4 border-y border-white/5">
                  <span className="text-3xl font-black text-white">R$ 249</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider"> / mês</span>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Ideal para consultores individuais ou novos times de vendas.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-semibold">
                  {['Até 3 Usuários ativos', 'Acesso ao Pipeline de Leads CRM', 'Prospecção básica de empresas', '1.000 buscas em cache local', 'Suporte via e-mail'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={12} className="text-[#10B981] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a 
                  href="/api/auth/google"
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Começar com Starter
                </a>
              </div>
            </div>

            {/* Plano 2: Enterprise Pro (O mais vendido, glow verde) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1B4D3E]/40 to-slate-950/80 border border-[#10B981]/40 shadow-2xl shadow-emerald-950/30 flex flex-col justify-between relative scale-[1.03] z-10">
              {/* Badge Mais Vendido */}
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-[#10B981] text-[#0F172A] text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-400">
                Mais Vendido
              </div>
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block mb-2">Enterprise Pro</span>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Escala & Performance</h4>
                </div>
                
                <div className="py-4 border-y border-white/10">
                  <span className="text-4xl font-black text-white">R$ 699</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider"> / mês</span>
                  <p className="text-[10px] text-emerald-300 mt-2 font-semibold">Aceleração completa comercial com inteligência integrada.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-200 font-semibold">
                  {[
                    'Usuários ilimitados em sua Tenant',
                    'Acesso ilimitado a FPVs e CCTs',
                    'Prospecção Inteligente Ativa via IA',
                    'Calendário Global de prazos e escalas',
                    'Auditoria completa (Audit Trail) de logs',
                    'Suporte premium prioritário 24/7'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={12} className="text-[#10B981] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a 
                  href="/api/auth/google"
                  className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] border border-[#10B981]/50 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Assinar Plano Pro
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Plano 3: Custom Scale */}
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col justify-between hover:border-white/10 transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block mb-2">Custom Scale</span>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Corporativo</h4>
                </div>
                
                <div className="py-4 border-y border-white/5">
                  <span className="text-3xl font-black text-white">Sob Consulta</span>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">Para grandes corporações que exigem integrações customizadas.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-semibold">
                  {['Integração API dedicada bidirecional', 'SLA de disponibilidade 99.9%', 'Customizações e novos campos Prisma', 'Manager de conta exclusivo', 'Treinamento de equipe em vídeo'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check size={12} className="text-[#10B981] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <a 
                  href="mailto:suporte@smartbidhub.com.br"
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Falar com Consultor
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CONVERSION CALL-TO-ACTION */}
      <section className="py-20 md:py-28 bg-[#0F172A] border-t border-white/5 relative z-10 overflow-hidden">
        {/* Background glow in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[600px] h-[300px] bg-gradient-to-r from-[#1B4D3E] to-[#10B981] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Pronto para Revolucionar suas Vendas de Facilities?
          </h3>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Cadastre-se com sua conta Google em menos de 10 segundos e experimente o ecossistema SaaS SmartBidHub sem compromisso.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/api/auth/google"
              className="px-10 py-5 bg-[#1B4D3E] hover:bg-[#13382D] border border-[#10B981]/40 text-sm font-black uppercase tracking-widest text-white rounded-2xl transition-all shadow-2xl shadow-emerald-950/80 flex items-center justify-center gap-3 cursor-pointer"
            >
              Criar Minha Conta Grátis
              <ArrowRight size={16} />
            </a>
            <a 
              href="/login"
              className="px-10 py-5 bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 text-sm font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-2xl transition-all flex items-center justify-center"
            >
              Entrar em Conta Existente
            </a>
          </div>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Não é necessário cartão de crédito. Onboarding seguro.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-slate-950 border-t border-white/5 relative z-10 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1B4D3E] rounded-lg flex items-center justify-center border border-[#10B981]/20">
              <TrendingUp className="text-[#10B981]" size={16} />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase text-slate-300">
              Smart<span className="text-[#10B981]">BidHub</span>
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-center md:text-left">
            © 2026 Grupo JVS • Orse Technology. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-slate-300 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacidade</a>
            <a href="mailto:suporte@smartbidhub.com.br" className="hover:text-slate-300 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
