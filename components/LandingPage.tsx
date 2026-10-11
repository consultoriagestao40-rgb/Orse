'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, Briefcase, Users, Search, 
  Calendar, Mail, ArrowRight, CheckCircle, Zap, 
  BarChart3, Database, Sparkles, ArrowUpRight, Lock, 
  Fingerprint, FileText, Check, ChevronRight, ChevronDown, Menu, X,
  MapPin, Phone, AlertTriangle, RefreshCw, BarChart2,
  Clock, Building2, Eye, HelpCircle, Laptop, Settings, Globe,
  Percent, DollarSign, Award, Flame, MessageSquare, AlertCircle, XCircle,
  FileSpreadsheet, Target, CheckSquare, Layers, Share2, MousePointerClick
} from 'lucide-react';
import { getPlanConfigs } from '@/app/admin/empresas/actions';
import Link from 'next/link';

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Modal de Agendamento / Demonstração Gratuita
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoPlanName, setDemoPlanName] = useState<string>('Demonstração SmartBid');
  const [demoForm, setDemoForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    empresa: '',
    postos: '10 a 50 postos'
  });
  const [demoSuccess, setDemoSuccess] = useState(false);

  // Toggle do FAQ (Acordeão)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // --- ESTADOS INTERATIVOS DO VISUAL HERO (SEÇÃO 3) ---
  const [heroTab, setHeroTab] = useState<'dre' | 'propostaLink' | 'telemetria' | 'radar'>('dre');
  const [clientProposalSubTab, setClientProposalSubTab] = useState<'postos' | 'fpv' | 'minuta' | 'apresentacao'>('postos');
  const [clientAccepted, setClientAccepted] = useState(false);
  const [interactiveBdi, setInteractiveBdi] = useState(14.5);

  // Estados para expansão/colapso da DRE simulada (igual ao sistema)
  const [dreExpanded, setDreExpanded] = useState<Record<string, boolean>>({
    '01': true,
    '02': false,
    '03': true,
  });
  const toggleDreRow = (id: string) => {
    setDreExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getPlanConfigs();
        if (res.success && res.configs && res.configs.length > 0) {
          setPlans(res.configs);
        }
      } catch (err) {
        console.error('Erro ao buscar planos na LP:', err);
      }
    };
    fetchPlans();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const openDemoWithPlan = (planName: string) => {
    setDemoPlanName(planName);
    setDemoModalOpen(true);
    setDemoSuccess(false);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSuccess(true);
    const msg = encodeURIComponent(
      `Olá! Gostaria de agendar uma demonstração prática do SmartBid (${demoPlanName}).\nNome: ${demoForm.nome}\nEmpresa: ${demoForm.empresa}\nWhatsApp: ${demoForm.whatsapp}\nPorte: ${demoForm.postos}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/5541999999999?text=${msg}`, '_blank');
    }, 1000);
  };

  // Cálculos dinâmicos da DRE simulada (Hospital Geral São Lucas - 22 Postos)
  const custoSalarios = 18640.00;
  const custoEncargos = 13383.52; // 71.80% CCT SIEMACO
  const custoBeneficios = 4750.00; // VT líq + VR R$ 38,50/dia + Cesta Básica
  const custoSSMA = 820.00; // EPIs + PCMSO
  const custoInsumos = 1150.00; // Químicos hospitalares
  const custoEquipamentos = 650.00; // Depreciação / Locação
  const baseCost = custoSalarios + custoEncargos + custoBeneficios + custoSSMA + custoInsumos + custoEquipamentos; // R$ 39.393,52

  const tributosRate = 0.125; // 12.50% (PIS, COFINS, ISSQN, CPRB)
  const calcPrecoVenda = baseCost / (1 - (tributosRate + interactiveBdi / 100));
  const calcTributos = calcPrecoVenda * tributosRate;
  const calcReceitaLiquida = calcPrecoVenda - calcTributos;
  const calcMargemBruta = calcReceitaLiquida - baseCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* HEADER / NAVBAR ELEGANTE DE VIDRO OBSIDIAN */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800/90 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-transparent border-b border-white/5 py-4.5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40">
              <TrendingUp className="text-white stroke-[2.5]" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white block leading-tight">
                  Smart<span className="text-emerald-400">Bid</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v4.0
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium tracking-wide block">
                Inteligência Comercial & Custos para Prestadoras de Serviços
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#solucao" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">A Solução</a>
            <a href="#funcionalidades" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">Funcionalidades</a>
            <a href="#proposta-interativa" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">Link vs Provelo</a>
            <a href="#qualificacao" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">Para Quem É</a>
            <a href="#planos" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">Planos</a>
            <a href="#faq" className="text-xs font-semibold tracking-wider text-slate-300 hover:text-emerald-400 transition-colors">Dúvidas</a>
          </nav>

          {/* CTA Buttons in top right */}
          <div className="hidden md:flex items-center gap-3">
            <a 
              href="/login" 
              className="text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 transition-colors rounded-lg hover:bg-white/5"
            >
              Acessar Conta
            </a>
            <button 
              onClick={() => openDemoWithPlan('Demonstração 20 Min')}
              className="text-xs font-bold uppercase tracking-wider text-slate-950 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-2 group cursor-pointer active:scale-95"
            >
              Ver em Ação
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors cursor-pointer">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0B0F19] border-b border-slate-800 shadow-2xl flex flex-col p-6 space-y-4 animate-in fade-in duration-150">
            <a href="#solucao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">A Solução</a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">Funcionalidades</a>
            <a href="#proposta-interativa" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">Link vs Provelo</a>
            <a href="#qualificacao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">Para Quem É</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">Planos</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-300 py-2 border-b border-slate-800">Dúvidas</a>
            
            <div className="flex gap-3 pt-3">
              <a 
                href="/login" 
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-slate-200 py-3 border border-slate-800 rounded-xl bg-slate-900/60"
              >
                Acessar Conta
              </a>
              <button 
                onClick={() => { setMobileMenuOpen(false); openDemoWithPlan('Demonstração Mobile'); }}
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-slate-950 py-3 bg-emerald-400 rounded-xl font-black"
              >
                Ver em Ação
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. & 2. & 4. HERO SECTION DE ALTO IMPACTO (ATMOSFÉRICA & EDITORIAL) */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-gradient-to-b from-[#070A11] via-[#0B0F19] to-[#0D1322]">
        
        {/* Efeito sutil de malha de fundo (Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d08_1px,transparent_1px),linear-gradient(to_bottom,#1f293d08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        {/* Glow Esmeralda de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-14">
            
            {/* Tag / Badge Corporativo de Engenharia */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider text-[11px]">SmartBid Enterprise</span>
              <span className="text-slate-600">•</span>
              <span>Engenharia & Comercial para Prestadoras de Serviços</span>
            </div>
            
            {/* 1. HEADLINE */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black leading-[1.12] text-white tracking-tight">
              Transforme a sua prestadora de serviços numa máquina de contratos previsíveis: <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                da prospecção de grandes contas à blindagem de margem e reajustes automáticos.
              </span>
            </h1>
            
            {/* 2. SUB-HEADLINE */}
            <p className="text-slate-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
              Esqueça as planilhas com fórmulas quebradas e o silêncio após o envio de propostas em PDF. O SmartBid centraliza a prospecção de decisores, a engenharia rigorosa de custos por CCT, o rastreio de leitura do cliente e a gestão de reajustes anuais na mesma plataforma.
            </p>

            {/* 4. CHAMADA PARA AÇÃO PRINCIPAL (CTA DUPLO ACIMA DA DOBRA) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button 
                onClick={() => openDemoWithPlan('Demonstração Prática 20 Min')}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-[0.98]"
              >
                <span>Quero Ver o SmartBid em Ação</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  setHeroTab('dre');
                  const el = document.getElementById('visual-hero-mockup');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BarChart3 size={17} className="text-emerald-400" />
                <span>Simular DRE do Projeto</span>
              </button>
            </div>
            
            {/* Micro-texto abaixo do botão */}
            <p className="text-xs text-slate-400 font-medium">
              Demonstração prática de 20 minutos • Sem necessidade de cartão de crédito • Configure a sua CCT ao vivo.
            </p>

            {/* Estatísticas de Prova Imediata no Hero */}
            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto border-t border-slate-800/80 mt-8">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
                <span className="text-lg sm:text-xl font-black text-white font-mono block">+R$ 1,28 Bilhão</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gerenciados em Propostas</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">100%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CCTs Parametrizadas</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
                <span className="text-lg sm:text-xl font-black text-white font-mono block">127x</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telemetria em Tempo Real</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
                <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">14 Dias</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Garantia Blindada</span>
              </div>
            </div>

          </div>

          {/* 3. VÍDEO OU IMAGEM DE DESTAQUE (VISUAL HERO COM INTERFACE REAL & SIMULADOR) */}
          <div id="visual-hero-mockup" className="max-w-6xl mx-auto scroll-mt-28">
            
            {/* BROWSER WINDOW MOCKUP REALISTA ESTILO MAC OS DARK SLATE */}
            <div className="bg-[#0F1420] rounded-2xl border border-slate-800 shadow-[0_20px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 overflow-hidden">
              
              {/* Barra superior de janela Mac OS */}
              <div className="bg-[#0B0E17] border-b border-slate-800/90 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Semáforos Mac */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border-[#DEA123]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border-[#1AAB29]"></div>
                  </div>
                  {/* URL Bar */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 w-full sm:w-auto">
                    <Lock size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-slate-200">app.smartbidhub.com.br</span>
                    <span className="text-slate-500">/{heroTab === 'dre' ? 'dre-executiva' : heroTab === 'propostaLink' ? 'proposta/hospital-sao-lucas' : heroTab}</span>
                  </div>
                </div>

                {/* Abas de Navegação do Mockup com estilo executivo */}
                <div className="flex bg-slate-900 p-1 rounded-xl gap-1 overflow-x-auto max-w-full border border-slate-800">
                  <button
                    onClick={() => setHeroTab('dre')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      heroTab === 'dre' 
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 size={13} />
                    4. DRE do Projeto (Simulador)
                  </button>
                  <button
                    onClick={() => setHeroTab('propostaLink')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      heroTab === 'propostaLink' 
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    1. Link da Proposta (Cliente)
                  </button>
                  <button
                    onClick={() => setHeroTab('telemetria')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      heroTab === 'telemetria' 
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Telemetria & Rastreio (127x)
                  </button>
                  <button
                    onClick={() => setHeroTab('radar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      heroTab === 'radar' 
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Radar Comercial
                  </button>
                </div>
              </div>

              {/* CONTEÚDO DA TELA SELECIONADA */}
              <div className="p-4 sm:p-6 md:p-7 bg-[#0B0F19] min-h-[420px]">
                
                {/* ABA 4: TABELA DA DRE DO PROJETO COM SIMULAÇÃO REAL IGUAL AO SISTEMA */}
                {heroTab === 'dre' && (
                  <div className="bg-[#0F1422] rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col text-slate-200">
                    
                    {/* Cabeçalho da DRE no estilo Executivo do Sistema */}
                    <div className="bg-gradient-to-r from-[#143d31] via-[#1B4D3E] to-[#0f2e25] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 shadow-inner">
                          <BarChart3 className="text-emerald-300" size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xs uppercase tracking-widest text-emerald-100">
                              DRE do Projeto • Demonstração do Resultado
                            </h4>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                              Orçamento Executivo
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">
                            Hospital Geral São Lucas • 22 Postos • Escala 12x36 e 44h Semanais
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="bg-[#D4AF37]/20 text-[#f5d77f] border border-[#D4AF37]/40 text-[11px] px-3.5 py-1.5 rounded-full font-black tracking-wider uppercase inline-block shadow-xs">
                          Margem Bruta Proposta: {interactiveBdi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Ajuste de Margem (BDI) em Tempo Real */}
                    <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5 text-center sm:text-left w-full sm:w-auto">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-xs font-bold text-slate-300">Simulador de Margem (BDI):</span>
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                            {interactiveBdi.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Deslize a barra para recalcular faturamento bruto, deduções fiscais e margem líquida ao centavo
                        </p>
                      </div>

                      <div className="w-full sm:w-72 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0 font-mono">8% Mín</span>
                        <input 
                          type="range" 
                          min="8" 
                          max="25" 
                          step="0.5"
                          value={interactiveBdi}
                          onChange={(e) => setInteractiveBdi(parseFloat(e.target.value))}
                          className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0 font-mono">25% Max</span>
                      </div>
                    </div>

                    {/* Planilha de Cálculo da DRE Completa */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/60 text-slate-400 uppercase text-[9px] tracking-wider font-extrabold border-b border-slate-800">
                            <th className="py-2.5 px-3.5 w-72">Estrutura DRE (Contas do Projeto)</th>
                            <th className="py-2.5 px-3 hidden md:table-cell text-slate-500 font-medium">Detalhamento Operacional</th>
                            <th className="py-2.5 px-3 text-right font-black w-32 text-slate-300">Mensal (R$)</th>
                            <th className="py-2.5 px-3 text-right font-bold w-20 text-slate-400">% s/ Rec.</th>
                            <th className="py-2.5 px-3.5 text-right font-black bg-emerald-950/30 text-emerald-300 border-l border-slate-800 w-36">Total Anual (12M)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">

                          {/* 01. RECEITA BRUTA */}
                          <tr className="bg-slate-900/40 font-bold border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3.5 flex items-center gap-2">
                              <button 
                                onClick={() => toggleDreRow('01')} 
                                className="text-slate-500 hover:text-blue-400 p-0.5 rounded cursor-pointer transition-colors"
                              >
                                <span className="text-[10px] block font-mono">{dreExpanded['01'] ? '▼' : '►'}</span>
                              </button>
                              <span className="text-xs uppercase tracking-wider font-black text-blue-400">01. RECEITA BRUTA</span>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-slate-400 font-normal">
                              Faturamento Bruto Contratado com CCT Vinculada
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-blue-300 font-mono">
                              {formatCurrency(calcPrecoVenda)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">100.0%</td>
                            <td className="py-2.5 px-3.5 text-right font-black text-blue-300 bg-emerald-950/20 border-l border-slate-800 font-mono">
                              {formatCurrency(calcPrecoVenda * 12)}
                            </td>
                          </tr>

                          {/* 01.1 - Sublinhas de Receita */}
                          {dreExpanded['01'] && (
                            <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                              <td className="py-2 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                01.1 - Serviços de Asseio e Higienização (22 Postos)
                              </td>
                              <td className="py-2 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                18x Limpeza Hospitalar (12x36) + 4x Encarregados (44h)
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-200 font-mono text-[11px]">
                                {formatCurrency(calcPrecoVenda)}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500 font-mono text-[10px]">100.0%</td>
                              <td className="py-2 px-3.5 text-right font-semibold text-slate-200 border-l border-slate-800/60 font-mono text-[11px]">
                                {formatCurrency(calcPrecoVenda * 12)}
                              </td>
                            </tr>
                          )}

                          {/* 02. TRIBUTO SOBRE FATURAMENTO */}
                          <tr className="bg-slate-900/40 font-bold border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3.5 flex items-center gap-2">
                              <button 
                                onClick={() => toggleDreRow('02')} 
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                              >
                                <span className="text-[10px] block font-mono">{dreExpanded['02'] ? '▼' : '►'}</span>
                              </button>
                              <span className="text-xs uppercase tracking-wider font-black text-rose-400">02. TRIBUTO SOBRE FATURAMENTO</span>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-slate-400 font-normal">
                              PIS (0.65%), COFINS (3.00%), ISS (5.00%), CPRB (3.85%)
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-400 font-mono">
                              -{formatCurrency(calcTributos)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-400 font-mono text-[11px]">
                              -12.5%
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-black text-rose-400 bg-rose-950/20 border-l border-slate-800 font-mono">
                              -{formatCurrency(calcTributos * 12)}
                            </td>
                          </tr>

                          {/* 02.1 - Sublinhas de Tributos */}
                          {dreExpanded['02'] && (
                            <>
                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-400 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px]">02.1.1 - ISSQN Municipal (5.00%)</td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">Imposto Sobre Serviços de Qualquer Natureza</td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-rose-400">-{formatCurrency(calcPrecoVenda * 0.05)}</td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">5.0%</td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-rose-400 border-l border-slate-800/60">-{formatCurrency(calcPrecoVenda * 0.05 * 12)}</td>
                              </tr>
                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-400 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px]">02.1.2 - PIS (0.65%) e COFINS (3.00%)</td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">Contribuições Federais s/ Faturamento</td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-rose-400">-{formatCurrency(calcPrecoVenda * 0.0365)}</td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">3.65%</td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-rose-400 border-l border-slate-800/60">-{formatCurrency(calcPrecoVenda * 0.0365 * 12)}</td>
                              </tr>
                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-400 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px]">02.1.3 - CPRB / Previdência Patronal (3.85%)</td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">Desoneração da Folha / Contribuição Substitutiva</td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-rose-400">-{formatCurrency(calcPrecoVenda * 0.0385)}</td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">3.85%</td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-rose-400 border-l border-slate-800/60">-{formatCurrency(calcPrecoVenda * 0.0385 * 12)}</td>
                              </tr>
                            </>
                          )}

                          {/* (=) RECEITA LÍQUIDA */}
                          <tr className="bg-blue-950/30 font-black border-y border-blue-900/60 text-blue-200">
                            <td className="py-2.5 px-3.5 pl-6 text-xs uppercase tracking-wider">
                              (=) RECEITA LÍQUIDA MENSAL
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-blue-300 font-normal">
                              Faturamento Bruto deduzido de todos os impostos
                            </td>
                            <td className="py-2.5 px-3 text-right font-black font-mono">
                              {formatCurrency(calcReceitaLiquida)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-blue-300">
                              87.5%
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-black text-blue-200 bg-blue-900/30 border-l border-slate-800 font-mono">
                              {formatCurrency(calcReceitaLiquida * 12)}
                            </td>
                          </tr>

                          {/* 03. CUSTO OPERACIONAL */}
                          <tr className="bg-slate-900/40 font-bold border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3.5 flex items-center gap-2">
                              <button 
                                onClick={() => toggleDreRow('03')} 
                                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded cursor-pointer transition-colors"
                              >
                                <span className="text-[10px] block font-mono">{dreExpanded['03'] ? '▼' : '►'}</span>
                              </button>
                              <span className="text-xs uppercase tracking-wider font-black text-emerald-400">
                                03. CUSTO OPERACIONAL DIRETO
                              </span>
                            </td>
                            <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-slate-400 font-normal">
                              Folha de Salários, Encargos CCT, Benefícios, Insumos e EPIs
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono">
                              -{formatCurrency(baseCost)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                              {((baseCost / calcPrecoVenda) * 100).toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-black text-emerald-400 bg-emerald-950/20 border-l border-slate-800 font-mono">
                              -{formatCurrency(baseCost * 12)}
                            </td>
                          </tr>

                          {/* 03.1 a 03.7 - Sublinhas de Custos Operacionais */}
                          {dreExpanded['03'] && (
                            <>
                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.1 - Salários Base + Insalubridade 40% + Adic. Noturno
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  Piso CCT SIEMACO 2026 + Adicionais Legais de Função
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoSalarios)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoSalarios / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoSalarios * 12)}
                                </td>
                              </tr>

                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.2 - Encargos Sociais & Trabalhistas (71.80% CCT)
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  FGTS (8%), 13º Salário (8.33%), Férias + 1/3 (11.11%), Multa Rescisória
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoEncargos)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoEncargos / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoEncargos * 12)}
                                </td>
                              </tr>

                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.3 - Benefícios Convencionados CCT
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  Vale Transporte Líquido (desc 6%) + VR R$ 38,50/dia + Cesta Básica
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoBeneficios)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoBeneficios / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoBeneficios * 12)}
                                </td>
                              </tr>

                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.5 - SSMA, Uniformes Hospitalares & EPIs
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  Luvas nitrílicas, calçados antiderrapantes e exames periódicos PCMSO
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoSSMA)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoSSMA / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoSSMA * 12)}
                                </td>
                              </tr>

                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.6 - Insumos e Materiais de Higienização
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  Desinfetantes hospitalares nível intermediário e descartáveis
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoInsumos)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoInsumos / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoInsumos * 12)}
                                </td>
                              </tr>

                              <tr className="bg-[#0B0F19]/50 border-b border-slate-800/60 text-slate-300 hover:bg-slate-800/30">
                                <td className="py-1.5 px-3.5 pl-8 text-[11px] font-medium text-slate-300">
                                  03.7 - Depreciação / Locação de Equipamentos
                                </td>
                                <td className="py-1.5 px-3 hidden md:table-cell text-[10px] text-slate-500">
                                  Lavadora de piso automática e aspiradores profissionais
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-[11px] text-slate-300">
                                  -{formatCurrency(custoEquipamentos)}
                                </td>
                                <td className="py-1.5 px-3 text-right text-slate-500 font-mono text-[10px]">
                                  {((custoEquipamentos / calcPrecoVenda) * 100).toFixed(1)}%
                                </td>
                                <td className="py-1.5 px-3.5 text-right font-mono text-[11px] text-slate-300 border-l border-slate-800/60">
                                  -{formatCurrency(custoEquipamentos * 12)}
                                </td>
                              </tr>
                            </>
                          )}

                          {/* (=) MARGEM BRUTA DO PROJETO */}
                          <tr className="bg-emerald-950/40 font-black border-t-2 border-emerald-500 text-emerald-200">
                            <td className="py-3.5 px-3.5 pl-6 text-xs uppercase tracking-wider flex items-center gap-2">
                              <span className="text-emerald-400">📈</span>
                              <span className="text-emerald-300">(=) MARGEM BRUTA DO PROJETO (LUCRO OPERACIONAL)</span>
                            </td>
                            <td className="py-3.5 px-3 hidden md:table-cell text-[11px] text-emerald-400 font-medium">
                              Resultado Líquido do Contrato calculado ao centavo
                            </td>
                            <td className="py-3.5 px-3 text-right font-black text-emerald-300 text-sm font-mono">
                              {formatCurrency(calcMargemBruta)}
                            </td>
                            <td className="py-3.5 px-3 text-right text-emerald-400 font-black text-xs font-mono">
                              {interactiveBdi.toFixed(1)}%
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-black bg-emerald-500 text-slate-950 border-l border-emerald-400 shadow-inner font-mono text-sm">
                              {formatCurrency(calcMargemBruta * 12)}
                            </td>
                          </tr>

                        </tbody>
                      </table>
                    </div>

                    {/* Rodapé da DRE com Garantia de Previsibilidade */}
                    <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                        <span><strong>Previsibilidade Cirúrgica:</strong> A DRE recalcula automaticamente conforme você adiciona postos, CCTs ou insumos.</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Homologado para Lucro Presumido, Real e Simples Nacional</span>
                    </div>
                  </div>
                )}

                {/* ABA 1: O LINK DA PROPOSTA INTERATIVA (O QUE O CLIENTE VÊ - TECNOLOGIA ESTILO PROVELO COM ENGENHARIA DE CUSTOS) */}
                {heroTab === 'propostaLink' && (
                  <div className="bg-[#0F1422] rounded-xl border border-slate-800 shadow-xl p-5 sm:p-6 space-y-4 text-slate-200">
                    {/* Barra de URL do Link Exclusivo da Proposta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] truncate">
                        <Lock size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-bold">https://smartbidhub.com.br/proposta/ver/</span>
                        <span className="text-slate-400 font-semibold truncate">ct-892-hospital-sao-lucas</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                          Link Web Ativo
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">Envio por WhatsApp ou E-mail</span>
                      </div>
                    </div>

                    {/* Cabeçalho da Proposta do Cliente */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block font-mono">
                          ALIANÇA SERVIÇOS TERCEIRIZADOS • PROPOSTA COMERCIAL EXCLUSIVA
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                          Prestação de Serviços de Asseio, Higienização e Apoio Operacional
                        </h4>
                        <p className="text-xs text-slate-400">Cliente: Hospital Geral São Lucas • Vigência 12 Meses</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0 bg-slate-900 p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Global Mensal</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">R$ 48.900,00</span>
                        <span className="text-[10px] text-slate-500 block">Faturamento direto c/ CCT vinculada</span>
                      </div>
                    </div>

                    {/* Sub-abas de Navegação da Proposta */}
                    <div className="flex gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
                      <button
                        onClick={() => setClientProposalSubTab('postos')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'postos' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        👥 Postos & Escala (22 Postos)
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('fpv')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'fpv' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        📊 Planilha FPV (Composição de Custos)
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('minuta')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'minuta' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚖️ Minuta Contratual
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('apresentacao')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'apresentacao' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        🏢 Apresentação Institucional
                      </button>
                    </div>

                    {/* Conteúdo da Sub-Aba Selecionada */}
                    {clientProposalSubTab === 'postos' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white">18x Auxiliares de Limpeza Hospitalar</span>
                              <span className="font-mono text-emerald-400 font-bold">R$ 38.880,00</span>
                            </div>
                            <p className="text-[11px] text-slate-400">Escala 12x36 Diurna e Noturna • Piso CCT SIEMACO + Insalubridade 40%</p>
                          </div>
                          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white">4x Encarregados Operacionais</span>
                              <span className="font-mono text-emerald-400 font-bold">R$ 10.020,00</span>
                            </div>
                            <p className="text-[11px] text-slate-400">Escala 44h Semanais • Coordenação de equipe, controle de EPIs e cronograma</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {clientProposalSubTab === 'fpv' && (
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2.5">
                        <div className="flex justify-between font-bold text-slate-300 pb-2 border-b border-slate-800">
                          <span>Módulo de Composição de Preço (FPV)</span>
                          <span className="text-emerald-400 font-mono">Encargos 71.8% + Benefícios Parametrizados</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Salário Base + Adicionais</span>
                            <span className="font-bold text-white font-mono">R$ 25.420,00</span>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Encargos Sociais & CCT</span>
                            <span className="font-bold text-white font-mono">R$ 18.251,56</span>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Benefícios (VT/VR/Cesta)</span>
                            <span className="font-bold text-white font-mono">R$ 6.320,00</span>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 block">Insumos & Uniformes</span>
                            <span className="font-bold text-white font-mono">R$ 2.450,00</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {clientProposalSubTab === 'minuta' && (
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                        <p className="font-bold text-white">Cláusula 5ª • Do Reajuste Anual e Repasse Sindical</p>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Os valores contratados serão reajustados anualmente na data-base da categoria (Maio/2026), mediante repasse integral do dissídio salarial homologado pela convenção coletiva e variação do INPC sobre os benefícios.
                        </p>
                      </div>
                    )}

                    {clientProposalSubTab === 'apresentacao' && (
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-white">Aliança Serviços Terceirizados</p>
                            <p className="text-[11px] text-slate-400">Mais de 850 postos ativos • 14 anos de mercado • Atendimento 24/7</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BOTÕES DE AÇÃO DO CLIENTE: ACEITE DIGITAL + WHATSAPP (O QUE FAZ FECHAR NEGÓCIO) */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <CheckCircle size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold text-white">Aprovação Direta sem Papel nem Cartório</span>
                        </div>
                        <p className="text-[11px] text-emerald-300">
                          {clientAccepted 
                            ? '✓ Proposta Aprovada Digitalmente pelo Cliente com Registro de IP e Horário!' 
                            : 'O cliente clica e aprova a proposta comercial online direto na tela.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setClientAccepted(!clientAccepted)}
                          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-md ${
                            clientAccepted 
                              ? 'bg-emerald-500 text-slate-950' 
                              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 active:scale-95'
                          }`}
                        >
                          {clientAccepted ? '✓ Proposta Aprovada' : 'Simular Aceite Digital'}
                        </button>
                        <a
                          href="https://wa.me/5541999999999"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare size={14} className="text-emerald-400" />
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 text-center font-medium">
                      ⚡ <strong>O Grande Diferencial:</strong> Softwares como Provelo cobram assinatura só para gerar esse link. No SmartBid, a proposta já nasce preenchida a partir da sua CCT e com telemetria que avisa quando o cliente abre!
                    </div>
                  </div>
                )}

                {/* ABA 2: MODAL COM 127 ACESSOS MONITORIZADOS POR ABA */}
                {heroTab === 'telemetria' && (
                  <div className="bg-[#0F1422] rounded-xl border border-slate-800 shadow-xl p-6 space-y-5 text-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                            Telemetria Ativa • Cliente Visualizando Proposta Agora
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-white mt-1">
                          Hospital São Lucas • Proposta Comercial #SB-2026-89
                        </h4>
                        <p className="text-xs text-slate-400">22 Postos de Asseio e Conservação Hospitalar</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-right sm:text-center">
                        <span className="text-3xl font-black text-emerald-400 block font-mono">127</span>
                        <span className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Acessos Monitorados</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                        Detalhamento de Tempo e Leituras por Seção:
                      </span>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                            FPV
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Planilha de Formação de Preço (FPV)</p>
                            <p className="text-[11px] text-slate-400">Composição de pisos, benefícios e encargos CCT</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg font-mono">
                            58 visualizações (45 min)
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                            CLM
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Minuta Contratual & Cláusulas Jurídicas</p>
                            <p className="text-[11px] text-slate-400">Regras de repasse, rescisão e data-base do sindicato</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-blue-300 bg-blue-950/40 border border-blue-800/60 px-3 py-1.5 rounded-lg font-mono">
                            42 visualizações (31 min)
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-700">
                            DOC
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Apresentação Técnica e Cronograma de Postos</p>
                            <p className="text-[11px] text-slate-400">Escopo dos serviços e certificações operacionais</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-200 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg font-mono">
                            27 visualizações (18 min)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: RADAR COMERCIAL COM MÉTRICAS CONSOLIDADAS */}
                {heroTab === 'radar' && (
                  <div className="space-y-5">
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#0F1422] p-5 rounded-xl border border-slate-800 shadow-md">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Faturamento Aceito (Mês)
                        </span>
                        <p className="text-2xl font-black text-emerald-400 font-mono">R$ 108.774,36</p>
                        <span className="text-[11px] text-slate-400 font-semibold mt-1 block">
                          11 contratos convertidos
                        </span>
                      </div>

                      <div className="bg-[#0F1422] p-5 rounded-xl border border-slate-800 shadow-md">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Meta da Equipe Ativa
                        </span>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-black text-white font-mono">R$ 300.000,00</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            36.3%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '36.3%' }}></div>
                        </div>
                      </div>

                      <div className="bg-[#0F1422] p-5 rounded-xl border border-slate-800 shadow-md">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1 font-mono">
                          Volume em Propostas no Radar
                        </span>
                        <p className="text-2xl font-black text-white font-mono">+R$ 1.284.950.000</p>
                        <span className="text-[11px] text-emerald-400 font-bold mt-1 block">
                          + de R$ 1,2 Bilhão gerenciados
                        </span>
                      </div>
                    </div>

                    {/* Funil Comercial em 5 Etapas */}
                    <div className="bg-[#0F1422] p-5 rounded-xl border border-slate-800 shadow-md">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                          Funil de Vendas Comercial
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">191 oportunidades rastreadas</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Leads</span>
                          <span className="text-lg font-black text-white font-mono">191</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">Google Places</span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Contatos</span>
                          <span className="text-lg font-black text-white font-mono">39</span>
                          <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">20.4% avanço</span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Visitas</span>
                          <span className="text-lg font-black text-white font-mono">23</span>
                          <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">59.0% avanço</span>
                        </div>
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">4. Propostas</span>
                          <span className="text-lg font-black text-white font-mono">75</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Emitidas</span>
                        </div>
                        <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/40 text-center col-span-2 sm:col-span-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-300 block">5. Vendas</span>
                          <span className="text-lg font-black text-emerald-400 font-mono">11</span>
                          <span className="text-[9px] text-emerald-300 font-bold block mt-0.5">14.7% fechamento</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. AGITAÇÃO DO PROBLEMA (A TRINCHEIRA REAL DA TERCEIRIZAÇÃO) */}
      <section className="py-24 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1 rounded-full inline-block">
              A Trincheira Real da Terceirização
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Se você administra uma prestadora de serviços, reconhece estes 4 perigos invisíveis:
            </h2>
            <p className="text-slate-400 text-base font-normal">
              O modelo tradicional de planilhas manuais e PDFs estáticos sangra o caixa da sua empresa todos os meses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Dor 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Phone size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                  1. O comercial perde horas procurando contatos de decisores
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O vendedor passa o dia ligando para recepções gerais sem conseguir falar com quem decide, queimando energia em listas frias e sem contexto.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Impacto: Prospecção lenta e sem previsibilidade
                </span>
              </div>
            </div>

            {/* Dor 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                  2. A planilha de cálculo é um perigo silencioso
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Qualquer erro de fórmula nos encargos de CCT ou esquecimento na provisão reflexa de benefícios consome meses de margem de lucro.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Impacto: Prejuízo oculto em contratos vigentes
                </span>
              </div>
            </div>

            {/* Dor 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Eye size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                  3. O "ponto cego" do envio de PDF
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Você envia a proposta em PDF por e-mail e fica no escuro, sem saber se o cliente abriu, se o setor financeiro avaliou ou se o arquivo foi ignorado.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Impacto: Follow-up no escuro e perda de timing
                </span>
              </div>
            </div>

            {/* Dor 4 */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Clock size={22} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                  4. O prejuízo invisível no pós-venda
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O contrato entra em operação, a data-base do sindicato vence e a sua empresa esquece de repassar o reajuste inflacionário a tempo, pagando o dissídio do próprio bolso.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-800/80 mt-6">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                  Impacto: Sangria de caixa por falta de repasse
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. APRESENTAÇÃO DA SOLUÇÃO (O QUE É O SMARTBID) */}
      <section id="solucao" className="py-24 bg-gradient-to-b from-[#0B0F19] to-[#0D1322] border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full inline-block">
            A Solução Definitiva
          </span>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            O primeiro ecossistema tudo-em-um desenhado para a realidade de prestadoras de serviços terceirizados.
          </h2>

          <p className="text-slate-300 text-lg md:text-xl font-normal leading-relaxed max-w-4xl mx-auto">
            O <strong>SmartBid</strong> não é um CRM genérico: é uma esteira que conduz a sua operação desde o primeiro contato com o decisor até a aplicação de cada reajuste e aditivo contratual.
          </p>

          {/* Fluxograma Horizontal da Esteira SmartBid */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">01. RADAR</span>
                <span className="text-xs font-bold text-white block">Google Places Decisores</span>
              </div>
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">02. MOTOR</span>
                <span className="text-xs font-bold text-white block">Multi-CCTs & Encargos</span>
              </div>
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">03. DRE</span>
                <span className="text-xs font-bold text-white block">Margem Bruta ao Centavo</span>
              </div>
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">04. LINK WEB</span>
                <span className="text-xs font-bold text-white block">Telemetria & Aceite 1-Click</span>
              </div>
              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-500/40 col-span-2 md:col-span-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">05. CLM</span>
                <span className="text-xs font-bold text-emerald-300 block">Alertas de Reajuste</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => openDemoWithPlan('Conhecer a Esteira Completa')}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              Conhecer a Esteira Completa
            </button>
          </div>
        </div>
      </section>

      {/* 8. BENTO GRID DE FUNCIONALIDADES (A JORNADA DO CLIENTE) */}
      <section id="funcionalidades" className="py-24 bg-[#070A11] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              Arquitetura Operacional
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Os Cinco Pilares Conectados do SmartBid
            </h2>
            <p className="text-slate-400 text-base font-normal">
              Cada módulo foi forjado para eliminar o retrabalho e blindar o lucro da sua prestadora.
            </p>
          </div>

          {/* BENTO GRID ASSIMÉTRICO MODERNO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto">
            
            {/* Bento Card 1: Prospecção (Grande) */}
            <div className="md:col-span-7 p-8 rounded-2xl bg-gradient-to-br from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Etapa 01 • Prospecção
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Google Places API
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Máquina de Prospecção de Decisores
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Localize hospitais, condomínios e indústrias de grande porte diretamente no Google Places e injete os dados no funil de vendas em um único clique. Encontre o contato dos responsáveis por Compras e RH sem depender de listas frias.
                </p>
              </div>

              {/* Preview UI no Card */}
              <div className="mt-6 p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Hospital & Maternidade Regional</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">Lead Qualificado</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Compras / Facilities: (41) 3300-0000 • compras@hospital.com.br</p>
              </div>
            </div>

            {/* Bento Card 2: Multi-CCTs (Médio) */}
            <div className="md:col-span-5 p-8 rounded-2xl bg-gradient-to-br from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Etapa 02 • Engenharia
                </span>
                <h3 className="text-xl font-bold text-white">
                  Engenharia Trabalhista e Multi-CCTs
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Parametrize convenções coletivas por estado e região (como SIEMACO). Automatize vales, reflexos e encargos com precisão cirúrgica.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Piso CCT</span>
                  <span className="font-black text-white text-sm font-mono">R$ 1.840,00</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Encargos</span>
                  <span className="font-black text-emerald-400 text-sm font-mono">71.80%</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Orçamento Executivo e DRE (Médio) */}
            <div className="md:col-span-5 p-8 rounded-2xl bg-gradient-to-br from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Etapa 03 • Viabilidade
                </span>
                <h3 className="text-xl font-bold text-white">
                  Orçamento Executivo & DRE Projetada
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Avalie a viabilidade do contrato para os próximos 12 meses antes de assinar. O sistema deduz impostos sobre faturamento e apresenta a margem exata.
                </p>
              </div>

              <div className="mt-6 p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-500/30 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-300">Margem Bruta (18.4%):</span>
                <span className="font-black text-emerald-400 font-mono text-sm">R$ 8.987,50 /mês</span>
              </div>
            </div>

            {/* Bento Card 4: Proposta Interativa & Aceite (Grande) */}
            <div className="md:col-span-7 p-8 rounded-2xl bg-gradient-to-br from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Etapa 04 • Negociação & Fechamento
                  </span>
                  <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                    Aceite Digital
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Proposta Web com Telemetria e Aceite em 1 Clique
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O cliente recebe um portal web exclusivo. Você é notificado no WhatsApp na hora exata em que ele abre o documento e ele aprova online sem necessidade de impressões.
                </p>
              </div>

              <div className="mt-6 p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-300">Cliente reabriu "Planilha de Custos" há 2 minutos</span>
                </div>
                <span className="text-emerald-400 font-bold font-mono">127x visitas</span>
              </div>
            </div>

            {/* Bento Card 5: Gestão de Contratos e Reajustes CLM (Full Width) */}
            <div className="md:col-span-12 p-8 rounded-2xl bg-gradient-to-r from-[#0F1424] via-[#111827] to-[#0A0D17] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Etapa 05 • Blindagem no Pós-Venda
                </span>
                <h3 className="text-2xl font-bold text-white">
                  Gestão de Contratos e Alertas de Reajuste (CLM)
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Controle vigências, aditivos e o valor global da carteira ativa. O sistema sinaliza a coluna de "Reajuste Pendente" 30 dias antes da data-base para garantir que nenhum repasse de CCT seja esquecido.
                </p>
              </div>

              <div className="shrink-0 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 w-full md:w-auto">
                <div className="flex justify-between items-center gap-4">
                  <span className="font-bold text-white">Contrato #CT-2024-12</span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">Reajuste Pendente</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Data-base em 30 dias • Dissídio SIEMACO</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO ESPECIAL DE DESTAQUE: O LINK DA PROPOSTA INTERATIVA (DIFERENCIAL FRENTE À PROVELO) */}
      <section id="proposta-interativa" className="py-24 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full inline-block">
              O Diferencial que Fecha Contratos
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              O Link da Proposta Comercial Interativa: <br />
              <span className="text-emerald-400">O fim definitivo do PDF frio e sem resposta.</span>
            </h2>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Plataformas como a <strong>Provelo</strong> vendem <em>apenas</em> links de propostas com rastreamento e cobram mensalidades caras só por isso. No <strong>SmartBid</strong>, essa tecnologia já vem nativa, permitindo que seu cliente aprove a proposta online em 1 clique — com a vantagem de estar 100% amarrada aos custos reais da sua CCT.
            </p>
          </div>

          {/* Comparativo Visual: O PDF Tradicional vs. Provelo vs. SmartBid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-14">
            
            {/* 1. PDF Tradicional */}
            <div className="p-8 rounded-2xl bg-[#0F1424] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">O Jeito Antigo (PDF Anexo)</h3>
                  <span className="text-xs text-rose-400 font-semibold font-mono">Invisível e Sem Retorno</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Arquivo pesado que cai no spam ou barra na caixa de entrada corporativa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Zero rastreio: você não sabe se o cliente abriu ou se ignorou seu e-mail.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Para aprovar, o cliente tem que imprimir, assinar de caneta e escanear.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Follow-up cego: você liga sem saber se ele teve tempo de analisar o valor.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6">
                <span className="text-[11px] font-bold text-rose-400 uppercase font-mono">Resultado: Baixa conversão e perda de tempo</span>
              </div>
            </div>

            {/* 2. Provelo e Softwares Comuns de Proposta */}
            <div className="p-8 rounded-2xl bg-[#0F1424] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Provelo / Softwares de Proposta</h3>
                  <span className="text-xs text-amber-400 font-semibold font-mono">Apenas Link Cosmético</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Gera um link web bonito e notifica quando o cliente abre o documento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Permite assinatura digital e telemetria básica de páginas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Não calcula CCT:</strong> você precisa montar planilhas em outro software e colar texto na mão.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>Não tem DRE:</strong> não avisa se você está tendo lucro ou prejuízo no contrato.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6">
                <span className="text-[11px] font-bold text-amber-400 uppercase font-mono">Resultado: Bom visual, mas sem inteligência de custos</span>
              </div>
            </div>

            {/* 3. SmartBid (O Ecossistema Completo) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111A2E] to-[#0A0E1A] border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3.5 py-1 bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md font-mono">
                O Mais Completo do Brasil
              </div>

              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">O Link Inteligente SmartBid</h3>
                  <span className="text-xs text-emerald-400 font-bold font-mono">Link + Engenharia de Terceirização</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200 font-medium">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Link Exclusivo com sua Marca:</strong> portal responsivo que abre perfeito no celular ou PC.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Alerta Imediato no WhatsApp:</strong> aviso na hora exata em que o cliente abre a proposta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Telemetria por Seção:</strong> saiba quantos minutos ele passou na FPV, escopo ou minuta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Aceite Digital em 1 Clique:</strong> o cliente aprova online sem burocracia nem impressões.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>CCT & FPV Automáticas:</strong> os valores vêm da convenção coletiva, sem risco de erro de cálculo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Pós-Venda Automático (CLM):</strong> virou contrato, o sistema monitora a data-base de reajuste.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-800 mt-6">
                <span className="text-[11px] font-black text-emerald-400 uppercase font-mono">Resultado: Máxima taxa de conversão e margem blindada</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 9. & 10. QUALIFICAÇÃO & DESQUALIFICAÇÃO (PARA QUEM É / NÃO É) */}
      <section id="qualificacao" className="py-24 bg-[#070A11] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              O SmartBid é Feito Para Você?
            </h2>
            <p className="text-slate-400 text-base font-normal">
              Alinhamos expectativas para garantir retorno real no seu investimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* 9. PARA QUEM É */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-emerald-500/30 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Para Quem É</h3>
                    <span className="text-xs text-emerald-400 font-semibold font-mono">Qualificação de Público</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Prestadoras de serviços de limpeza e conservação</strong> que necessitam de agilidade para montar orçamentos sem riscos de passivo trabalhista.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Prestadoras de Segurança, Portaria e Apoio</strong> com dezenas de postos alocados e necessidade de acompanhar reajustes de convenção coletiva rigorosos.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Diretores Comerciais e Sócios</strong> que exigem controle total de indicadores: metas corporativas, ciclo médio de fechamento e taxa de conversão.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 10. PARA QUEM NÃO É */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-rose-500/30 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Para Quem NÃO É</h3>
                    <span className="text-xs text-rose-400 font-semibold font-mono">Desqualificação Firme</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-400">
                  <div className="flex items-start gap-3">
                    <X size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Empresas procurando apenas um bloco de notas digital</strong> ou chat genérico sem cálculo e engenharia de custos.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <X size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Quem prefere continuar correndo o risco</strong> de perder dezenas de milhares de reais por ano com fórmulas manuais e desatualizadas de Excel.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 11. QUEBRA DE OBJEÇÕES (O CONFRONTO COM O MERCADO) */}
      <section className="py-24 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              Comparativo de Mercado
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              O Confronto com as Alternativas de Mercado
            </h2>
            <p className="text-slate-400 text-base font-normal">
              Entenda os limites das ferramentas genéricas quando aplicadas à terceirização.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-7 rounded-2xl bg-gradient-to-r from-[#0F1424] to-[#0A0D17] border border-slate-800 space-y-2">
              <h3 className="text-lg font-bold text-white">
                "Eu já uso um CRM comum (como Bitrix24 ou Pipedrive)"
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Um CRM comum move cartões, mas não calcula encargos sindicais A/B/C/D, não gera DRE de projeto nem avisa quando a convenção coletiva de um posto venceu. O SmartBid resolve a engenharia e o pós-venda que os outros sistemas ignoram.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-gradient-to-r from-[#0F1424] to-[#0A0D17] border border-slate-800 space-y-2">
              <h3 className="text-lg font-bold text-white">
                "O meu orçamentista calcula o per capita de cabeça no Excel"
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A conta mental detecta erros gritantes, mas não identifica a provisão reflexa de benefícios esquecida nem avisa que o cliente abriu a minuta de contrato 11 vezes no escritório dele.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-gradient-to-r from-[#0F1424] to-[#0A0D17] border border-slate-800 space-y-2">
              <h3 className="text-lg font-bold text-white">
                "A implementação é demorada?"
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                A parametrização das suas CCTs principais e o modelo de proposta são estruturados de forma direta, permitindo gerar cotações já nos primeiros dias de uso.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 12. TABELA DE PLANOS E PREÇOS TRANSPARENTES COM TOGGLE MENSAL/ANUAL */}
      <section id="planos" className="py-24 bg-[#070A11] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              Tabela de Planos
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Planos Transparentes e Escaláveis
            </h2>
            <p className="text-slate-400 text-base font-normal">
              Escolha a escala ideal para a sua prestadora. Sem taxas ocultas.
            </p>

            {/* Toggle de Ciclo de Faturamento */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="w-14 h-7 bg-slate-800 rounded-full p-1 border border-slate-700 relative cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-full bg-emerald-400 transition-transform ${billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-500'}`}>Anual</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Economize 20%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* PLANO BÁSICO */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Prestadores em fase inicial
                  </span>
                  <h3 className="text-2xl font-black text-white">BÁSICO</h3>
                </div>

                <div className="py-4 border-y border-slate-800">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-4xl font-black text-white">
                      R$ {billingCycle === 'annual' ? '119' : '149'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ mês</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <span className="text-[11px] text-slate-500 block mt-1">Faturado anualmente (R$ 1.428/ano)</span>
                  )}
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>Até 3 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>30 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>FPVs e CCTs: <strong>Limitado a 3 regras</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Histórico e Telemetria: <strong>Básico</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Básico')}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Escolher Básico
                </button>
              </div>
            </div>

            {/* PLANO PROFISSIONAL (PRO) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111A2E] to-[#0A0E1A] border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3.5 py-1 bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md font-mono">
                Mais Escolhido
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    Prestadoras em expansão
                  </span>
                  <h3 className="text-2xl font-black text-white">PROFISSIONAL (PRO)</h3>
                </div>

                <div className="py-4 border-y border-slate-800">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-4xl font-black text-emerald-400">
                      R$ {billingCycle === 'annual' ? '239' : '299'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ mês</span>
                  </div>
                  <span className="text-xs text-emerald-300 font-semibold block mt-1 font-mono">
                    (+ R$ 130 /mês c/ WhatsApp Integrado)
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>Até 10 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>150 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>FPVs e CCTs: <strong>Acesso Ilimitado</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Histórico e Telemetria: <strong>Auditoria de Logs</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Alertas automáticos de <strong>Reajuste CLM</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Profissional PRO')}
                  className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  Começar no Plano PRO
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* PLANO ENTERPRISE */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0F1424] to-[#0A0D17] border border-slate-800 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Grandes operações e filiais
                  </span>
                  <h3 className="text-2xl font-black text-white">ENTERPRISE</h3>
                </div>

                <div className="py-4 border-y border-slate-800">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-4xl font-black text-white">
                      R$ {billingCycle === 'annual' ? '479' : '599'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/ mês</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <span className="text-[11px] text-slate-500 block mt-1">Faturado anualmente (R$ 5.748/ano)</span>
                  )}
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>Até 100 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span><strong>400 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>FPVs e CCTs: <strong>Ilimitado + APIs liberadas</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Histórico e Telemetria: <strong>SLA Avançado e suporte 24/7</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Enterprise')}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Falar com Consultor
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 13. GARANTIA INCONDICIONAL */}
      <section className="py-20 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 md:p-10 rounded-2xl bg-gradient-to-r from-[#111A2E] to-[#0A0E1A] border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield size={36} />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-bold text-white">
                Garantia de Adaptação de 14 Dias
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Se durante os primeiros 14 dias notar que o SmartBid não acelerou a montagem das suas propostas e não simplificou a leitura dos seus custos operacionais, basta solicitar o cancelamento. Devolvemos 100% do valor da assinatura, sem letras pequenas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. DEPOIMENTO DE MERCADO */}
      <section className="py-20 bg-[#070A11] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            Validação de Mercado
          </span>

          <div className="p-8 md:p-12 rounded-2xl bg-[#0F1424] border border-slate-800 shadow-xl relative">
            <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed italic">
              "Antes do SmartBid, precisávamos de um dia inteiro para cruzar os benefícios do sindicato com a planilha de insumos. Hoje colocamos uma proposta completa de 50 postos na rua em menos de meia hora e com a certeza absoluta da margem de lucro."
            </p>
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="font-bold text-white text-sm">Direção Comercial</p>
              <p className="text-xs text-slate-400 font-medium">Setor de Asseio, Conservação e Serviços Terceirizados</p>
            </div>
          </div>
        </div>
      </section>

      {/* 15. PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="py-20 bg-[#0B0F19] border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              Dúvidas Comuns
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400 text-base font-normal">
              Respostas diretas sobre o funcionamento do SmartBid.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                pergunta: '1. Consigo cadastrar convenções coletivas de estados diferentes?',
                resposta: 'Sim. O Gerenciador de Regras (CCT) permite configurar múltiplos sindicatos com regras personalizadas de pisos, encargos e benefícios para cada região onde a sua empresa opera.'
              },
              {
                pergunta: '2. Como funciona a telemetria da proposta enviada ao cliente?',
                resposta: 'Gera um link exclusivo através do sistema. Quando o cliente abre a página, o SmartBid registra o tempo e a quantidade de visitas em cada aba: apresentação institucional, proposta comercial, detalhamento de custos (FPV) e minuta jurídica.'
              },
              {
                pergunta: '3. O sistema calcula a DRE do contrato automaticamente?',
                resposta: 'Sim. A partir do preenchimento da mão de obra e insumos, o software projeta os impostos, os custos diretos e a margem bruta de cada mês do contrato com centavos de precisão.'
              },
              {
                pergunta: '4. Como o SmartBid ajuda no momento de reajustar o contrato?',
                resposta: 'O módulo de contratos organiza as contas por vigência e sinaliza visualmente os contratos com "Reajuste Pendente" com base na data-base acordada, evitando que preste serviços com valores desatualizados.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-xl bg-[#0F1424] border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="font-bold text-white text-sm md:text-base">{faq.pergunta}</span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-slate-300 text-sm leading-relaxed border-t border-slate-800/80 pt-3.5">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 16. CHAMADA PARA AÇÃO FINAL */}
      <section className="py-24 bg-gradient-to-b from-[#0B0F19] to-[#070A11] border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Pare de deixar margem de lucro na mesa e assuma o controle total da sua esteira comercial.
          </h2>
          
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Descubra como estruturar orçamentos seguros, fechar contratos mais rápido e proteger a saúde financeira da sua prestadora de serviços.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => openDemoWithPlan('Solicitar Demonstração Gratuita Final')}
              className="px-9 py-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-base font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_35px_rgba(16,185,129,0.35)] inline-flex items-center gap-3 cursor-pointer"
            >
              Solicitar Demonstração Gratuita do SmartBid
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 17. RODAPÉ CORPORATIVO */}
      <footer className="py-12 bg-[#05070B] border-t border-slate-800 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-black">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="text-base font-bold text-white block leading-tight">
                  Smart<span className="text-emerald-400">Bid</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                  Inteligência para Prestadoras de Serviços
                </span>
              </div>
            </div>

            <div className="text-center md:text-right space-y-1">
              <p className="font-semibold text-slate-300">Suporte corporativo • Curitiba/PR • Brasil</p>
              <p className="text-slate-500">Gestão analítica e formação de preço para prestadoras de serviços terceirizados.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500">
              © {new Date().getFullYear()} SmartBid • Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-6 font-semibold uppercase tracking-wider text-[11px]">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Políticas de Privacidade</a>
              <span>•</span>
              <a href="mailto:suporte@smartbidhub.com.br" className="hover:text-white transition-colors">Central de Ajuda</a>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL DE AGENDAMENTO / DEMONSTRAÇÃO PRÁTICA */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0F1424] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200">
            <button 
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            {!demoSuccess ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Demonstração Personalizada • 20 Minutos
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Ver o SmartBid em Ação
                  </h3>
                  <p className="text-xs text-slate-400">
                    Interesse: <strong className="text-white">{demoPlanName}</strong>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Seu Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Cristiano Silva"
                      value={demoForm.nome}
                      onChange={(e) => setDemoForm({ ...demoForm, nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="seuemail@suaempresa.com.br"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="(41) 99999-9999"
                        value={demoForm.whatsapp}
                        onChange={(e) => setDemoForm({ ...demoForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Nome da Empresa *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Prime Terceirização e Serviços"
                        value={demoForm.empresa}
                        onChange={(e) => setDemoForm({ ...demoForm, empresa: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Porte da Operação
                    </label>
                    <select
                      value={demoForm.postos}
                      onChange={(e) => setDemoForm({ ...demoForm, postos: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs outline-none focus:border-emerald-400"
                    >
                      <option value="1 a 10 postos">1 a 10 postos alocados</option>
                      <option value="10 a 50 postos">10 a 50 postos alocados</option>
                      <option value="50 a 200 postos">50 a 200 postos alocados</option>
                      <option value="Mais de 200 postos">Mais de 200 postos (Operação Grande)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Confirmar e Agendar Demonstração
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Sem necessidade de cartão de crédito. Resposta imediata.
                  </p>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle size={30} />
                </div>
                <h4 className="text-lg font-bold text-white">Solicitação Recebida!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Redirecionando para o WhatsApp do nosso consultor executivo para alinhar a sua convenção coletiva ao vivo.
                </p>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="px-5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
