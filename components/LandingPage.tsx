'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, Briefcase, Users, Search, 
  Calendar, Mail, ArrowRight, CheckCircle, Zap, 
  BarChart3, Database, Sparkles, ArrowUpRight, Lock, 
  Fingerprint, FileText, Check, ChevronRight, Menu, X,
  MapPin, Phone, AlertTriangle, RefreshCw, BarChart2,
  Clock, Building2, Eye, HelpCircle, Laptop, Settings, Globe
} from 'lucide-react';
import { getPlanConfigs } from '@/app/admin/empresas/actions';
import Link from 'next/link';

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // --- ESTADOS INTERATIVOS DOS MOCKUPS ---
  
  // Hero (Radar KPIs + DRE)
  const [heroTab, setHeroTab] = useState<'radar' | 'dre'>('radar');

  // Módulo 1 (Prospecção Inteligente)
  const [searchKeyword, setSearchKeyword] = useState('Hospital');
  const [searchCity, setSearchCity] = useState('Curitiba');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [isLeadInjected, setIsLeadInjected] = useState(false);

  // Módulo 2 (CRM & Decisores)
  const [selectedCRMLead, setSelectedCRMLead] = useState(false);

  // Módulo 3 (Regras de CCT)
  const [selectedCctTab, setSelectedCctTab] = useState<'SIEMACO SP' | 'SIEMACO PR'>('SIEMACO SP');
  const [provisionOnVacation, setProvisionOnVacation] = useState(true);

  // Módulo 4 (Orçamento & DRE Projeto com BDI interativo)
  const [bdi, setBdi] = useState(12.9);
  
  // Módulo 5 (Portal & Telemetria)
  const [telemetryTab, setTelemetryTab] = useState<'tabs' | 'timeline'>('tabs');

  // Módulo 6 (CLM & Reajuste)
  const [clmTab, setClmTab] = useState<'pendente' | 'vigente'>('pendente');
  const [colegioPositivoStatus, setColegioPositivoStatus] = useState<'pendente' | 'aditivado'>('pendente');

  // Seção Radar & KPIs (CEO)
  const [ceoFilter, setCeoFilter] = useState<'geral' | 'vendedor'>('geral');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await getPlanConfigs();
        if (res.success && res.configs) {
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

  // Simulações
  const handleSearchSimulate = () => {
    setIsSearchingPlaces(true);
    setIsLeadInjected(false);
    setSearchDone(false);
    setTimeout(() => {
      setIsSearchingPlaces(false);
      setSearchDone(true);
    }, 1200);
  };

  const handleInjectSimulate = () => {
    setIsLeadInjected(true);
  };

  // Cálculos do Módulo 4 (DRE) baseados no BDI selecionado
  const baseCost = 29683.69;
  const tributosRate = 0.125;
  const sellingPrice = baseCost / (1 - (tributosRate + bdi / 100));
  const valorTributos = sellingPrice * tributosRate;
  const receitaLiquida = sellingPrice - valorTributos;
  const margemBruta = sellingPrice - valorTributos - baseCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 selection:bg-[#10B981] selection:text-[#070B19] relative overflow-hidden font-sans antialiased leading-[1.2]">
      
      {/* GRID DECORATIVO DE FUNDO */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* BACKGROUND GLOWS SUTIS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-br from-[#10B981]/10 to-transparent rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-[130px]" />
      </div>

      {/* HEADER / NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#070B19]/90 backdrop-blur-md border-b border-white/5 py-3 shadow-lg shadow-black/20' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-[#0A1A2E] rounded-xl flex items-center justify-center border border-[#10B981]/30 shadow-lg shadow-emerald-950/20">
              <TrendingUp className="text-[#10B981]" size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter uppercase text-white block">
                Smart<span className="text-[#10B981]">Bid</span>
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.25em] block">Facilities & CLM</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#solucoes" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Funcionalidades</a>
            <a href="#prospeccao" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Prospecção</a>
            <a href="#cct" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">CCT & FPV</a>
            <a href="#precos" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Preços</a>
          </nav>

          {/* CTA Buttons in top right */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white px-5 py-2.5 border border-white/5 hover:border-white/10 bg-white/5 rounded-xl transition-all"
            >
              Login
            </Link>
            <a 
              href="/api/auth/google" 
              className="text-xs font-black uppercase tracking-widest text-slate-950 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 group"
            >
              Acesso Grátis
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#070B19]/95 border-b border-white/5 shadow-2xl backdrop-blur-lg flex flex-col p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <a href="#solucoes" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Funcionalidades</a>
            <a href="#prospeccao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Prospecção</a>
            <a href="#cct" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">CCT & FPV</a>
            <a href="#precos" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Preços</a>
            
            <div className="flex gap-4 pt-4">
              <Link 
                href="/login" 
                className="flex-1 text-center text-xs font-black uppercase tracking-wider text-slate-300 py-3 border border-white/10 rounded-xl bg-white/5"
              >
                Login
              </Link>
              <a 
                href="/api/auth/google" 
                className="flex-1 text-center text-xs font-black uppercase tracking-wider text-slate-950 py-3 bg-[#10B981] rounded-xl"
              >
                Criar Conta
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 1. HERO SECTION (Abertura) */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
              <Sparkles size={12} className="animate-pulse" />
              SaaS Comercial & CLM de Facilities
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-white tracking-tight uppercase">
              Previsibilidade de Faturamento e <br />
              <span className="bg-gradient-to-r from-[#10B981] to-emerald-400 bg-clip-text text-transparent">
                Margens Blindadas
              </span> <br />
              para sua Empresa.
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              Diga adeus ao caos das planilhas de Excel. Automatize a precificação, gerencie Convenções Coletivas (CCT) e acompanhe propostas com telemetria avançada no primeiro CRM com engenharia de custos integrada.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/api/auth/google" 
                className="px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-sm font-black uppercase tracking-widest text-[#070B19] rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group cursor-pointer"
              >
                Testar SmartBid Grátis
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#solucoes" 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Conhecer Recursos
              </a>
            </div>

            {/* Micro Benefits list */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-4 text-left">
              {[
                'Extração Inteligente Google Places',
                'Isolamento Multi-Tenant Robusto',
                'Pisos de CCTs Parametrizados',
                'Assinatura e Telemetria de Link'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <CheckCircle size={14} className="text-[#10B981] shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right Visuals: Interactive Radar + DRE Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 w-full bg-[#0D1527]/90 border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/40 max-w-xl mx-auto group hover:border-[#10B981]/20 transition-all duration-300">
              
              {/* Header de Visualização Simulado */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/30" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1.5">Módulo Principal • Radar & DRE</span>
                </div>
                <div className="flex bg-[#070B19] p-0.5 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setHeroTab('radar')}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${heroTab === 'radar' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Radar KPIs
                  </button>
                  <button 
                    onClick={() => setHeroTab('dre')}
                    className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${heroTab === 'dre' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                  >
                    DRE Projeto
                  </button>
                </div>
              </div>

              {/* Tab 1: Radar KPIs */}
              {heroTab === 'radar' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center bg-[#070B19]/50 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Faturamento Ativo • Junho 2026</p>
                      <p className="text-2xl font-black text-white">R$ 560.000,00</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                        Meta: R$ 400.000,00
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">140% da Meta Atingida</p>
                    </div>
                  </div>

                  {/* Barra de Progresso da Meta */}
                  <div className="space-y-1 bg-[#070B19]/30 p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span>Progresso Mensal</span>
                      <span className="text-[#10B981]">R$ 560k / R$ 400k</span>
                    </div>
                    <div className="w-full bg-[#070B19] h-2.5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-[#10B981] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#070B19]/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Contratos Fechados</p>
                      <p className="text-base font-black text-white">R$ 280.000,00</p>
                    </div>
                    <div className="bg-[#070B19]/50 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Em Negociação</p>
                      <p className="text-base font-black text-white">R$ 280.000,00</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: DRE do Projeto */}
              {heroTab === 'dre' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded">
                      Faturamento Projetado vs Custo
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">Junho 2026</span>
                  </div>
                  
                  <div className="overflow-hidden border border-white/5 rounded-xl bg-[#070B19]/40 text-xs">
                    <div className="grid grid-cols-3 bg-[#070B19] px-3 py-2 text-[9px] font-black text-slate-400 uppercase border-b border-white/5">
                      <span>Linha Financeira</span>
                      <span className="text-right">Valor Projetado</span>
                      <span className="text-right">Margem</span>
                    </div>
                    <div className="divide-y divide-white/5 font-semibold text-slate-300">
                      <div className="grid grid-cols-3 px-3 py-1.5">
                        <span>Receita Bruta</span>
                        <span className="text-right text-white font-bold">R$ 39.792,59</span>
                        <span className="text-right text-slate-500">100.0%</span>
                      </div>
                      <div className="grid grid-cols-3 px-3 py-1.5">
                        <span>Tributos (12.5%)</span>
                        <span className="text-right text-red-400">-R$ 4.974,07</span>
                        <span className="text-right text-slate-500">12.5%</span>
                      </div>
                      <div className="grid grid-cols-3 px-3 py-1.5">
                        <span>Receita Líquida</span>
                        <span className="text-right text-white">R$ 34.818,52</span>
                        <span className="text-right text-slate-500">87.5%</span>
                      </div>
                      <div className="grid grid-cols-3 px-3 py-1.5 bg-[#10B981]/5">
                        <span className="text-[#10B981] font-bold">Margem Bruta</span>
                        <span className="text-right text-[#10B981] font-bold">R$ 5.134,83</span>
                        <span className="text-right text-[#10B981] font-bold">12.9%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de simulação explicativo */}
              <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <span>Clique nas abas acima para simular</span>
                <span className="flex items-center gap-1 text-[#10B981]">
                  <span className="w-1 h-1 rounded-full bg-[#10B981] animate-ping" />
                  Módulo Integrado
                </span>
              </div>
            </div>

            {/* Glowing background circles for visual depth */}
            <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute -top-6 -left-6 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
          </div>
        </div>
      </section>

      {/* 2. MÓDULO 1 - MÁQUINA DE PROSPECÇÃO INTELIGENTE (Atração) */}
      <section id="prospeccao" className="py-20 md:py-28 border-t border-white/5 bg-[#070B19]/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 1 • Prospecção Ativa
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Máquina de Prospecção Inteligente de Facilities
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Pare de ligar para quem não tem orçamento. Nosso sistema extrai leads corporativos estruturados diretamente do Google Places, classificando o porte das empresas de forma inteligente e enviando os decisores de grandes portes (como hospitais, shoppings e indústrias) direto ao seu pipeline comercial com um clique.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Busca local filtrada por Palavra-Chave e Cidade</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Enquadramento inteligente de Porte da Empresa</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Economia drástica de custos com Cache Local do banco Neon</span>
                </div>
              </div>
            </div>

            {/* Right Visual Simulation */}
            <div className="lg:col-span-7">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Simulador da Rota /prospeccao</span>
                  </div>
                  <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded font-black border border-[#10B981]/20">
                    Google Places API
                  </span>
                </div>

                {/* Form Inputs Simulation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">O que buscar?</label>
                    <input 
                      type="text" 
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full bg-[#070B19] border border-white/5 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#10B981]/50 text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Cidade / Região</label>
                    <input 
                      type="text" 
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="w-full bg-[#070B19] border border-white/5 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#10B981]/50 text-white" 
                    />
                  </div>
                </div>

                {/* Search Button */}
                <button 
                  onClick={handleSearchSimulate}
                  disabled={isSearchingPlaces}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-[#070B19] py-2.5 rounded-lg font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#10B981]/10"
                >
                  {isSearchingPlaces ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Pesquisando no Google Places...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Pesquisar Empresas sob Demanda
                    </>
                  )}
                </button>

                {/* Results Simulation */}
                <div className="mt-4 space-y-3">
                  {isSearchingPlaces && (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-12 bg-[#070B19]/60 rounded-xl border border-white/5" />
                      <div className="h-12 bg-[#070B19]/60 rounded-xl border border-white/5" />
                    </div>
                  )}

                  {!isSearchingPlaces && !searchDone && (
                    <div className="text-center py-6 bg-[#070B19]/20 rounded-xl border border-dashed border-white/5">
                      <Building2 className="mx-auto text-slate-600 mb-2" size={24} />
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Digite os parâmetros acima e busque</p>
                    </div>
                  )}

                  {searchDone && !isSearchingPlaces && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center bg-[#10B981]/10 px-3.5 py-2 rounded-lg border border-[#10B981]/20 text-[10px] font-black uppercase text-[#10B981]">
                        <span>40 empresas encontradas na região</span>
                        <span>Filtro: Porte Grande</span>
                      </div>

                      <div className="bg-[#070B19] p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">Hospital São Vicente FUNEF</span>
                            <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase">Porte Grande</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <MapPin size={10} /> Av. Vicente Machado, 1080 - Curitiba/PR
                          </p>
                        </div>

                        <div>
                          {isLeadInjected ? (
                            <span className="text-[10px] font-black uppercase text-[#10B981] flex items-center gap-1.5 bg-[#10B981]/10 px-3 py-1.5 rounded-lg border border-[#10B981]/20 animate-bounce">
                              <Check size={12} /> Injetado!
                            </span>
                          ) : (
                            <button 
                              onClick={handleInjectSimulate}
                              className="text-[10px] font-black uppercase text-white bg-[#0D1527] border border-[#10B981]/30 hover:border-[#10B981]/60 px-3 py-2 rounded-lg transition-all flex items-center gap-1 group cursor-pointer"
                            >
                              + Injetar no Funil
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MÓDULO 2 - CRM COM BUSCA DE DECISORES (Abordagem) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Visual Simulation */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Simulador da Rota /leads (Kanban Pipeline)</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Decisores no LinkedIn</span>
                </div>

                {/* Grid de Colunas do Kanban */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  
                  {/* PROSPECT Column */}
                  <div className="bg-[#070B19]/50 p-2.5 rounded-xl border border-white/5 space-y-2 min-h-[140px]">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Prospect</span>
                      <span className="bg-[#070B19] px-1 rounded border border-white/10 text-slate-400">1</span>
                    </div>
                    <div className="bg-[#0D1527] p-2 rounded-lg border border-white/5 text-[10px] space-y-1">
                      <span className="font-bold text-white block truncate">Hosp. São Vicente</span>
                      <span className="text-[8px] text-slate-500 block uppercase">Criado por: Admin</span>
                    </div>
                  </div>

                  {/* CONTATO Column */}
                  <div className="bg-[#070B19]/50 p-2.5 rounded-xl border border-white/5 space-y-2 min-h-[140px]">
                    <div className="flex justify-between items-center text-[9px] font-black text-emerald-400 uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Contato</span>
                      <span className="bg-[#10B981]/15 px-1 rounded border border-[#10B981]/25 text-[#10B981]">67%</span>
                    </div>
                    
                    {/* Cristiano Teste Card */}
                    <div 
                      onClick={() => setSelectedCRMLead(!selectedCRMLead)}
                      className={`p-2.5 rounded-lg border text-[10px] space-y-1.5 cursor-pointer transition-all ${
                        selectedCRMLead 
                          ? 'bg-[#10B981]/10 border-[#10B981] shadow-lg shadow-[#10B981]/5 scale-[1.02]' 
                          : 'bg-[#0D1527] border-[#10B981]/30 hover:border-[#10B981]/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-white block">Cristiano Teste</span>
                        <span className="text-[7px] font-black bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30 uppercase">Decisor</span>
                      </div>
                      <span className="text-[8px] text-slate-400 block truncate">Silva Terceirização</span>
                      <button className="w-full text-center bg-[#070B19] hover:bg-black text-[#10B981] text-[8px] font-black uppercase py-1 rounded border border-[#10B981]/20">
                        {selectedCRMLead ? 'Ocultar Decisores' : 'Ver Decisores (1)'}
                      </button>
                    </div>
                  </div>

                  {/* REUNIÃO Column */}
                  <div className="bg-[#070B19]/50 p-2.5 rounded-xl border border-white/5 space-y-2 min-h-[140px]">
                    <div className="flex justify-between items-center text-[9px] font-black text-blue-400 uppercase tracking-widest pb-1 border-b border-white/5">
                      <span>Reunião</span>
                      <span className="bg-blue-500/10 px-1 rounded border border-blue-500/20 text-blue-400">63%</span>
                    </div>
                    <div className="bg-[#0D1527] p-2 rounded-lg border border-white/5 text-[10px] opacity-50">
                      <span className="font-bold text-white block truncate">Hosp. Santa Cruz</span>
                      <span className="text-[8px] text-slate-500 block uppercase">15/Out - 14:00</span>
                    </div>
                  </div>

                </div>

                {/* Enriched Pane Simulation */}
                {selectedCRMLead && (
                  <div className="bg-[#070B19] p-4 rounded-xl border border-[#10B981]/30 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-white font-black uppercase">Decisor Enriquecido via LinkedIn</span>
                      </div>
                      <span className="text-[8px] text-[#10B981] font-black bg-[#10B981]/10 border border-[#10B981]/20 px-1.5 py-0.5 rounded">
                        Proxycurl API Homologada
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-300">
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Nome do Tomador</p>
                        <p className="font-bold text-white">Cristiano Silva</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Cargo</p>
                        <p className="font-bold text-white">Diretor de Compras & Facilities</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">LinkedIn</p>
                        <a href="https://linkedin.com/in/cristianosilva" target="_blank" rel="noreferrer" className="font-bold text-blue-400 hover:underline flex items-center gap-1">
                          linkedin.com/in/cristiano... <ArrowUpRight size={10} />
                        </a>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Sindicato Principal</p>
                        <p className="font-bold text-white">SIEMACO PR</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3.5 border-t border-white/5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider text-center">
                  {!selectedCRMLead ? 'Clique no card "Cristiano Teste" no Kanban para abrir o decisor' : 'Clique novamente para recolher'}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 2 • CRM Comercial & Decisores
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                CRM Comercial de Alta Conversão com LinkedIn Integrado
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Chega de dados vazios. Nosso pipeline de leads é desenhado especificamente para o ciclo de vendas de contratos terceirizados. Com enrichments automatizados de background via IA, você descobre em segundos quem são os diretores de compras, RH ou diretores de facilities do lead, seus e-mails institucionais e o link direto do perfil do LinkedIn.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Kanban com controle de taxas de conversão históricas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Enriquecimento instantâneo de contatos sem perda de tempo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Histórico de comunicação centralizado por lead</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. MÓDULO 3 - GERENCIADOR DE REGRAS DE CCT & FPV (Engenharia Trabalhista) */}
      <section id="cct" className="py-20 md:py-28 border-t border-white/5 bg-[#070B19]/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 3 • Engenharia Laboral
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Parametrização Estrita de CCTs e Benefícios
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Erros em contas de encargos e provisões em licitações e propostas custam caro. Com o SmartBid, as regras matemáticas das Convenções Coletivas de Trabalho (CCT) são estruturadas diretamente no Neon. O sistema calcula salários base, adicionais de insalubridade, provisões de férias e 13º, além de descontos de vale-transporte de forma 100% relacional e automatizada.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Vinculação direta a sindicatos regionais (ex: SIEMACO)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Provisões sobre férias e adicionais configuráveis em um clique</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Eliminação total de erros manuais de fórmulas em planilhas</span>
                </div>
              </div>
            </div>

            {/* Right Visual Simulation */}
            <div className="lg:col-span-7">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Painel Administrativo da Rota /admin/ccts</span>
                  </div>
                  <div className="flex bg-[#070B19] p-0.5 rounded-lg border border-white/5">
                    <button 
                      onClick={() => setSelectedCctTab('SIEMACO SP')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${selectedCctTab === 'SIEMACO SP' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      SIEMACO SP
                    </button>
                    <button 
                      onClick={() => setSelectedCctTab('SIEMACO PR')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${selectedCctTab === 'SIEMACO PR' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      SIEMACO PR
                    </button>
                  </div>
                </div>

                {/* Formulario de Beneficios Simulado */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 bg-[#070B19]/60 px-3 py-2 rounded border border-white/5">
                    <span>CCT Selecionada: {selectedCctTab}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Ativa para Vendas
                    </span>
                  </div>

                  <div className="space-y-3 bg-[#070B19]/40 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase">Benefício</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase text-right">Regra de Cálculo</span>
                    </div>

                    {/* Vale Refeição */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">Vale Refeição</span>
                        <span className="text-[8px] text-slate-500 uppercase">Auxílio Alimentação Sindical</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-white block">{selectedCctTab === 'SIEMACO SP' ? 'R$ 930,00 /mês' : 'R$ 900,00 /mês'}</span>
                        <span className="text-[8px] text-[#10B981] font-bold uppercase">Unidade: Posto de Trabalho</span>
                      </div>
                    </div>

                    {/* Vale Transporte */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">Vale Transporte Diário</span>
                        <span className="text-[8px] text-slate-500 uppercase">Desconto legal CLT de 6%</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-white block">{selectedCctTab === 'SIEMACO SP' ? 'R$ 13,20 /dia' : 'R$ 12,00 /dia'}</span>
                        <span className="text-[8px] text-blue-400 font-bold uppercase">6% Desconto Base Salário</span>
                      </div>
                    </div>

                    {/* Adicional de Insalubridade */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white block">Insalubridade</span>
                        <span className="text-[8px] text-slate-500 uppercase">Vinculado ao Salário Mínimo Nacional</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-white block">20% Grau Médio</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Base: Mínimo Vigente</span>
                      </div>
                    </div>
                  </div>

                  {/* Provisionar sobre Férias Checkbox (Interativo) */}
                  <div className="flex items-center justify-between bg-[#070B19]/80 p-3.5 rounded-xl border border-white/5">
                    <div className="flex items-start gap-2.5">
                      <input 
                        type="checkbox" 
                        id="provisionVacation" 
                        checked={provisionOnVacation}
                        onChange={(e) => setProvisionOnVacation(e.target.checked)}
                        className="mt-1 cursor-pointer accent-[#10B981]" 
                      />
                      <label htmlFor="provisionVacation" className="text-[10px] font-bold text-slate-300 cursor-pointer">
                        Provisionar Benefícios sobre Férias (VR, Cesta Básica, etc.)
                        <span className="text-[8px] text-slate-500 block font-normal mt-0.5">Calcula as regras relacionais de encargos sindicais no FPV do Neon.</span>
                      </label>
                    </div>
                    <div>
                      {provisionOnVacation ? (
                        <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">Ativo</span>
                      ) : (
                        <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-500/10 border border-white/10 px-2 py-0.5 rounded">Inativo</span>
                      )}
                    </div>
                  </div>

                </div>

                <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Selecione a CCT ou o checkbox de provisão para testar</span>
                  <span className="text-white font-bold">{selectedCctTab}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. MÓDULO 4 - ORÇAMENTO EXECUTIVO & DRE DO PROJETO (Controladoria) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Visual Simulation */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                
                {/* Header de Visualização */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Aba &ldquo;10. DRE PROJETO&rdquo; do Orçamento</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-black bg-[#10B981]/15 px-2.5 py-1 rounded-full border border-[#10B981]/30 uppercase tracking-widest">
                    Margem Bruta Proposta: {bdi.toFixed(1)}%
                  </span>
                </div>

                {/* Slider Interativo do BDI */}
                <div className="bg-[#070B19]/50 p-4 rounded-xl border border-white/5 space-y-2 mb-4">
                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Ajuste de Margem Desejada (BDI)</span>
                    <span className="text-[#10B981] font-bold text-xs">{bdi.toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="22" 
                    step="0.1"
                    value={bdi}
                    onChange={(e) => setBdi(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#070B19] rounded-lg appearance-none cursor-pointer accent-[#10B981]" 
                  />
                  <div className="flex justify-between text-[7px] font-bold text-slate-600 uppercase">
                    <span>Margem Mínima (10%)</span>
                    <span>Meta SmartBid (15%)</span>
                    <span>Teto de Licitação (22%)</span>
                  </div>
                </div>

                {/* DRE Financeira Gerada Dinamicamente */}
                <div className="overflow-hidden border border-white/5 rounded-xl bg-[#070B19]/30 text-xs">
                  <div className="grid grid-cols-3 bg-[#070B19] px-3 py-2 text-[9px] font-black text-slate-400 uppercase border-b border-white/5">
                    <span>Linha Orçamentária</span>
                    <span className="text-right">Mensal</span>
                    <span className="text-right">Porcentagem</span>
                  </div>
                  <div className="divide-y divide-white/5 font-semibold text-slate-300">
                    <div className="grid grid-cols-3 px-3 py-1.5">
                      <span>Receita Bruta</span>
                      <span className="text-right text-white font-bold">{formatCurrency(sellingPrice)}</span>
                      <span className="text-right text-slate-500">100.0%</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-1.5">
                      <span>Tributos Incidentes (12.5%)</span>
                      <span className="text-right text-red-400">-{formatCurrency(valorTributos)}</span>
                      <span className="text-right text-slate-500">12.5%</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-1.5">
                      <span>Receita Líquida</span>
                      <span className="text-right text-white">{formatCurrency(receitaLiquida)}</span>
                      <span className="text-right text-slate-500">87.5%</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-1.5">
                      <div className="space-y-0.5">
                        <span>Custo Operacional Total</span>
                        <span className="text-[7px] text-slate-500 block font-normal uppercase leading-tight">Mão de obra + Insumos + EPIs</span>
                      </div>
                      <span className="text-right text-slate-300">-{formatCurrency(baseCost)}</span>
                      <span className="text-right text-slate-500">{((baseCost / sellingPrice) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-1.5 bg-[#10B981]/5">
                      <span className="text-[#10B981] font-bold">Margem de Lucro Bruta</span>
                      <span className="text-right text-[#10B981] font-bold">{formatCurrency(margemBruta)}</span>
                      <span className="text-right text-[#10B981] font-bold">{bdi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider text-center">
                  Arraste o controle deslizante de BDI acima para re-calcular a margem do contrato
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 4 • Controladoria Financeira
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Orçamento Executivo & DRE Real do Projeto
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Saiba exatamente a margem e a viabilidade do contrato mês a mês antes de enviar a proposta ou disputar o lance. Ajustando o BDI desejado, a plataforma recalcula na hora o preço ideal do posto de trabalho, calculando os tributos corporativos, custos de mão de obra e gerando a DRE final para aprovação da diretoria comercial e controladoria.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Margens brutas projetadas de forma relacional</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Simulador de BDI com trava de margem mínima</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Visualização de viabilidade financeira em tempo real</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. MÓDULO 5 - PORTAL DA PROPOSTA & TELEMETRIA SILENCIOSA (Acompanhamento) */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-[#070B19]/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 5 • Telemetria Avançada
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Rastreamento e Telemetria Silenciosa de Propostas
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Chega de mandar propostas e ficar no vácuo comercial. O portal gera links exclusivos criptografados para o cliente. Quando ele acessa, a plataforma monitora o tempo de leitura detalhado por aba do documento (Slides, A4, FPV, Contrato) e cruza o IP para estimar a aproximação de geolocalização, dando ao vendedor alertas instantâneos de intenção real de compra sem pedir permissão de localização intrusiva.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Tempo de visualização detalhado por abas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Geolocalização aproximada por IP do cliente</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Notificações e alertas no momento exato do acesso</span>
                </div>
              </div>
            </div>

            {/* Right Visual Simulation */}
            <div className="lg:col-span-7">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                
                {/* Header de Visualização */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Acessos &amp; Telemetria (/propostas-comerciais)</span>
                  </div>
                  <div className="flex bg-[#070B19] p-0.5 rounded-lg border border-white/5">
                    <button 
                      onClick={() => setTelemetryTab('tabs')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${telemetryTab === 'tabs' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      Acessos por Aba
                    </button>
                    <button 
                      onClick={() => setTelemetryTab('timeline')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${telemetryTab === 'timeline' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      Linha do Tempo
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black bg-[#070B19]/60 px-3.5 py-2.5 rounded border border-white/5">
                    <span className="text-white">Total de Acessos: 127 vezes</span>
                    <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#10B981] rounded-full animate-ping" />
                      Proposta Ativa no Cliente
                    </span>
                  </div>

                  {/* Telemetry Tab 1: Accesses by Tab */}
                  {telemetryTab === 'tabs' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      {[
                        { name: 'Slides da Apresentação', count: 30, pct: 24, color: 'bg-indigo-500' },
                        { name: 'Visualização da Proposta A4', count: 41, pct: 32, color: 'bg-emerald-500' },
                        { name: 'FPV Detalhado (Orçamento)', count: 13, pct: 10, color: 'bg-amber-500' },
                        { name: 'Minuta de Contrato', count: 11, pct: 9, color: 'bg-rose-500' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1 bg-[#070B19]/30 p-2.5 rounded-lg border border-white/5 text-[10px]">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>{item.name}</span>
                            <span className="text-slate-400">{item.count} visitas ({item.pct}%)</span>
                          </div>
                          <div className="w-full bg-[#070B19] h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.pct * 2.5}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Telemetry Tab 2: Timeline Logs */}
                  {telemetryTab === 'timeline' && (
                    <div className="space-y-3 animate-in fade-in duration-200 max-h-[200px] overflow-y-auto pr-1">
                      {[
                        { time: 'Há 2 min', type: 'reaccess', msg: '🚨 Proposta reaberta pela 40ª vez! Local aproximado: Curitiba/PR', ip: 'IP: 187.54.120.4' },
                        { time: 'Há 5 min', type: 'tab', msg: 'Visualizou a aba "FPV Detalhado" por 4m 12s', ip: 'IP: 187.54.120.4' },
                        { time: 'Há 9 min', type: 'download', msg: 'Minuta de Contrato em PDF baixada pelo cliente', ip: 'IP: 187.54.120.4' },
                        { time: 'Ontem', type: 'open', msg: 'Primeira abertura da proposta pelo link único do portal', ip: 'IP: 187.54.120.4' }
                      ].map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-[10px] bg-[#070B19]/30 p-2.5 rounded-lg border border-white/5 items-start">
                          <Clock size={12} className="text-[#10B981] mt-0.5 shrink-0" />
                          <div className="space-y-0.5 flex-1">
                            <p className="font-bold text-white leading-snug">{log.msg}</p>
                            <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase">
                              <span>{log.time}</span>
                              <span>{log.ip}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider text-center">
                  Alterne entre as abas acima para inspecionar os dados de monitoramento da proposta
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. MÓDULO 6 - GESTÃO DE CONTRATOS (CLM) E ALERTAS DE REAJUSTE (Pós-Venda) */}
      <section className="py-20 md:py-28 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Visual Simulation */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <div className="w-full bg-[#0D1527] border border-white/5 rounded-2xl p-5 shadow-2xl shadow-black/35 relative">
                
                {/* Header de Visualização */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-[#10B981]" size={16} />
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Painel CLM da Rota /contratos</span>
                  </div>
                  <div className="flex bg-[#070B19] p-0.5 rounded-lg border border-white/5">
                    <button 
                      onClick={() => setClmTab('pendente')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${clmTab === 'pendente' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      Reajuste Pendente
                    </button>
                    <button 
                      onClick={() => setClmTab('vigente')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all ${clmTab === 'vigente' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'}`}
                    >
                      Contratos Vigentes
                    </button>
                  </div>
                </div>

                {/* Pipeline content */}
                <div className="space-y-3">
                  
                  {/* CLM Tab 1: Reajuste Pendente */}
                  {clmTab === 'pendente' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      {/* Alerta */}
                      <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-[10px] font-black uppercase text-amber-400">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Dissídios Sindicais ou Inflação Pendente detectados em 1 contrato</span>
                      </div>

                      {/* Card do Contrato */}
                      <div className="bg-[#070B19]/80 p-4 rounded-xl border border-amber-500/30 space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white block">Colégio Positivo</span>
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block mt-0.5">Sindicato Base: SIEMACO PR</span>
                          </div>
                          <span className="text-[7.5px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                            Reajuste Pendente (12 dias)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px] border-y border-white/5 py-2">
                          <div>
                            <span className="text-[8px] text-slate-500 block uppercase">Faturamento Mensal</span>
                            <span className="font-bold text-white">R$ 25.000,00 /mês</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block uppercase">Índice Reajuste</span>
                            <span className="font-bold text-white">IPCA + Dissídio Real</span>
                          </div>
                        </div>

                        {/* Ação Interativa */}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase">Resp: Cristiano Silva</span>
                          {colegioPositivoStatus === 'pendente' ? (
                            <button 
                              onClick={() => {
                                setColegioPositivoStatus('aditivado');
                                setTimeout(() => {
                                  setClmTab('vigente');
                                }, 800);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-[#070B19] text-[9.5px] font-black uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                            >
                              Aplicar Aditivo Sindical
                            </button>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                              <Check size={12} /> Aditivado e Vigente!
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* CLM Tab 2: Vigentes */}
                  {clmTab === 'vigente' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      
                      <div className="bg-[#070B19]/50 p-4 rounded-xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white block">Supermercado Condor</span>
                            <span className="text-[8px] text-slate-500 uppercase font-black block mt-0.5">Vigência: 12 meses</span>
                          </div>
                          <span className="text-[7.5px] font-black bg-emerald-500/20 text-[#10B981] px-2 py-0.5 rounded border border-[#10B981]/30 uppercase">
                            Vigente (OK)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px] border-y border-white/5 py-2">
                          <div>
                            <span className="text-[8px] text-slate-500 block uppercase">Recorrência Mensal (MRR)</span>
                            <span className="font-bold text-white">R$ 18.500,00</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block uppercase">Próximo Reajuste</span>
                            <span className="font-bold text-[#10B981]">15/Out/2026 (Em 5 meses)</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase">
                            <span>Tempo de Contrato Decorrido</span>
                            <span>7 / 12 Meses</span>
                          </div>
                          <div className="w-full bg-[#070B19] h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '58.3%' }} />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/5 text-[9px] text-slate-500 font-semibold uppercase tracking-wider text-center">
                  {clmTab === 'pendente' && colegioPositivoStatus === 'pendente' 
                    ? 'Clique no botão "Aplicar Aditivo Sindical" para atualizar o contrato na hora'
                    : 'Contrato aditivado movido para a aba Vigente com sucesso!'}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-5 space-y-6">
              <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
                Módulo 6 • CLM & Pós-Venda
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                Gestão de Contratos (CLM) & Reajustes de Inflação
              </h2>
              <p className="text-slate-400 font-medium leading-relaxed">
                Proteja sua receita recorrente (MRR) contra a inflação e aditivos sindicais de dissídios trabalhistas. Nosso motor CLM acompanha a vigência de cada contrato do cliente, alertando no momento em que sindicatos publicam alterações salariais ou na data de reajuste anual para que seu time envie o aditivo contratual e resguarde a margem.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Alertas preditivos de inflação e datas de reajuste</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Gerador rápido de minutas de aditivos contratuais</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-[#10B981]" />
                  <span className="text-xs font-bold text-slate-300">Monitoramento ativo de MRR por clientes</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. SEÇÃO RADAR COMERCIAL & KPIs (Visão do CEO) */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-[#0A1022]/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-[#10B981]/20 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
              Visão do CEO • Business Intelligence
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Radar Comercial & KPIs em Tempo Real
            </h2>
            <p className="text-slate-400 font-medium">
              Tenha uma central analítica completa para decisões rápidas da diretoria e proprietários. Acompanhe taxas de conversão de volume e propostas, ticket médio corporativo e o ciclo médio de fechamento de sua equipe.
            </p>

            {/* Alternador de Filtro Simulado */}
            <div className="inline-flex bg-[#070B19] p-0.5 rounded-xl border border-white/5 gap-1.5 mt-4">
              <button 
                onClick={() => setCeoFilter('geral')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  ceoFilter === 'geral' 
                    ? 'bg-[#10B981] text-[#070B19]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visão Consolidada
              </button>
              <button 
                onClick={() => setCeoFilter('vendedor')}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  ceoFilter === 'vendedor' 
                    ? 'bg-[#10B981] text-[#070B19]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Filtrar por Vendedor
              </button>
            </div>
          </div>

          {/* KPI Display Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Ticket Medio */}
            <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/20 hover:bg-[#0D1527]/80 transition-all flex flex-col justify-between h-40">
              <div>
                <span className="p-2 bg-[#070B19] border border-white/10 rounded-xl text-[#10B981] inline-block mb-3">
                  <BarChart2 size={18} />
                </span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Ticket Médio Contrato</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{ceoFilter === 'geral' ? 'R$ 27.256,05' : 'R$ 23.410,00'}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Calculado por BDI de Facilities</p>
              </div>
            </div>

            {/* Ciclo Medio */}
            <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/20 hover:bg-[#0D1527]/80 transition-all flex flex-col justify-between h-40">
              <div>
                <span className="p-2 bg-[#070B19] border border-white/10 rounded-xl text-[#10B981] inline-block mb-3">
                  <Clock size={18} />
                </span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Ciclo de Fechamento</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{ceoFilter === 'geral' ? '2.4 dias' : '1.8 dias'}</p>
                <p className="text-[8px] text-[#10B981] font-bold uppercase mt-1">Mais rápido que média mercado (14d)</p>
              </div>
            </div>

            {/* Taxa Conversao */}
            <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/20 hover:bg-[#0D1527]/80 transition-all flex flex-col justify-between h-40">
              <div>
                <span className="p-2 bg-[#070B19] border border-white/10 rounded-xl text-blue-400 inline-block mb-3">
                  <TrendingUp size={18} />
                </span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Taxa de Conversão</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{ceoFilter === 'geral' ? '24.8%' : '29.5%'}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Média de envio vs aceite link</p>
              </div>
            </div>

            {/* Volume Total */}
            <div className="p-6 rounded-2xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/20 hover:bg-[#0D1527]/80 transition-all flex flex-col justify-between h-40">
              <div>
                <span className="p-2 bg-[#070B19] border border-white/10 rounded-xl text-indigo-400 inline-block mb-3">
                  <Building2 size={18} />
                </span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Volume Ativo Geral</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{ceoFilter === 'geral' ? 'R$ 2.839.000,00' : 'R$ 490.000,00'}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Pipeline Comercial Geral</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LUXURY PRICING SECTION */}
      <section id="precos" className="py-20 md:py-28 relative z-10">
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
            {(() => {
              const defaultPlans = [
                {
                  nome: "BASICO",
                  label: "Básico",
                  preco: 149.00,
                  limiteUsuarios: 3,
                  descricao: "Ideal para pequenas prestadoras e corretores autônomos de serviços.",
                  features: "Até 3 Usuários ativos,Acesso ao Pipeline de Leads CRM,Prospecção básica de empresas,1.000 buscas em cache local,Suporte via e-mail"
                },
                {
                  nome: "PRO",
                  label: "Profissional (PRO)",
                  preco: 299.00,
                  limiteUsuarios: 10,
                  descricao: "Perfeito para empresas de facilities e equipes comerciais em expansão.",
                  features: "Até 10 Usuários ativos,Acesso ilimitado a FPVs e CCTs,Prospecção Inteligente Ativa via IA,Calendário Global de prazos e escalas,Auditoria completa (Audit Trail) de logs,Suporte premium prioritário 24/7"
                },
                {
                  nome: "ENTERPRISE",
                  label: "Enterprise",
                  preco: 599.00,
                  limiteUsuarios: 100,
                  descricao: "Customização e poder ilimitado para grandes corporações de facilities.",
                  features: "Até 100 Usuários ativos,Suporte 24/7 com Executivo de Conta,Integração e APIs Liberadas,SLA de Disponibilidade Avançado,Treinamento de equipe em vídeo"
                }
              ];

              const plansToShow = plans.length > 0 ? plans : defaultPlans;

              return plansToShow.map((p: any, idx: number) => {
                const isPopular = p.nome === 'PRO';
                const featuresList = typeof p.features === 'string' ? p.features.split(',') : [];

                return (
                  <div 
                    key={p.nome || idx}
                    className={`p-8 rounded-2xl bg-[#0D1527]/80 backdrop-blur-md flex flex-col justify-between transition-all duration-300 relative ${
                      isPopular 
                        ? 'bg-gradient-to-b from-[#10B981]/5 to-slate-950/80 border border-[#10B981]/40 shadow-2xl shadow-emerald-500/5 scale-[1.03] z-10'
                        : 'bg-[#0D1527]/40 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-[#10B981] text-[#070B19] text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-400">
                        Mais Vendido
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block mb-2">
                          {p.nome === 'BASICO' ? 'Smart Starter' : p.nome === 'PRO' ? 'Enterprise Pro' : 'Custom Scale'}
                        </span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight">{p.label}</h4>
                      </div>
                      
                      <div className="py-4 border-y border-white/5">
                        <span className="text-3xl font-black text-white">R$ {p.preco.toFixed(0)}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider"> / mês</span>
                        <p className="text-[10px] text-slate-400 mt-2 font-semibold">{p.descricao}</p>
                      </div>

                      <ul className="space-y-3.5 text-xs text-slate-300 font-semibold">
                        {featuresList.map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-center gap-2.5">
                            <Check size={12} className="text-[#10B981] shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-8">
                      <a 
                        href="/api/auth/google"
                        className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isPopular
                            ? 'bg-[#10B981] hover:bg-[#059669] text-[#070B19] shadow-lg shadow-emerald-500/10'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {p.nome === 'BASICO' ? 'Começar com Starter' : p.nome === 'PRO' ? 'Assinar Plano Pro' : 'Assinar Enterprise'}
                        {isPopular && <ArrowRight size={14} />}
                      </a>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* FINAL CONVERSION CALL-TO-ACTION */}
      <section className="py-20 md:py-28 border-t border-white/5 relative z-10 overflow-hidden">
        {/* Background glow in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[600px] h-[300px] bg-gradient-to-r from-blue-500/10 to-[#10B981]/15 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Pronto para Revolucionar suas Margens de Facilities?
          </h3>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Cadastre-se com sua conta Google em menos de 10 segundos e experimente o ecossistema SaaS SmartBid sem compromisso.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/api/auth/google"
              className="px-10 py-5 bg-[#10B981] hover:bg-[#059669] text-[#070B19] text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-2xl shadow-emerald-500/10 flex items-center justify-center gap-3 cursor-pointer"
            >
              Criar Minha Conta Grátis
              <ArrowRight size={16} />
            </a>
            <Link 
              href="/login"
              className="px-10 py-5 bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 text-sm font-black uppercase tracking-widest text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center"
            >
              Entrar em Conta Existente
            </Link>
          </div>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Não é necessário cartão de crédito. Onboarding imediato com Google Auth.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-[#050812] border-t border-white/5 relative z-10 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0D1527] rounded-lg flex items-center justify-center border border-[#10B981]/20">
              <TrendingUp className="text-[#10B981]" size={16} />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase text-slate-300">
              Smart<span className="text-[#10B981]">Bid</span>
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-center md:text-left">
            © 2026 Silva Consultoria Empresarial LTDA • CNPJ 40.180.983/0001-00. Todos os direitos reservados.
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
