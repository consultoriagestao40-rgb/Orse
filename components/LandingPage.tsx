'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, Briefcase, Users, Search, 
  Calendar, Mail, ArrowRight, CheckCircle, Zap, 
  BarChart3, Database, Sparkles, ArrowUpRight, Lock, 
  Fingerprint, FileText, Check, ChevronRight, ChevronDown, Menu, X,
  MapPin, Phone, AlertTriangle, RefreshCw, BarChart2,
  Clock, Building2, Eye, HelpCircle, Laptop, Settings, Globe,
  Percent, DollarSign, Award, Flame, MessageSquare, AlertCircle, XCircle
} from 'lucide-react';
import { getPlanConfigs } from '@/app/admin/empresas/actions';
import Link from 'next/link';

export default function LandingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
  const [heroTab, setHeroTab] = useState<'radar' | 'telemetria' | 'dre'>('radar');
  const [interactiveBdi, setInteractiveBdi] = useState(14.5);

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
      `Olá! Tenho interesse no SmartBid (${demoPlanName}).\nNome: ${demoForm.nome}\nEmpresa: ${demoForm.empresa}\nWhatsApp: ${demoForm.whatsapp}\nPorte: ${demoForm.postos}`
    );
    setTimeout(() => {
      window.open(`https://wa.me/5541999999999?text=${msg}`, '_blank');
    }, 1000);
  };

  // Cálculos dinâmicos da DRE simulada
  const baseCost = 28450.00;
  const tributosRate = 0.125; // 12.5%
  const calcPrecoVenda = baseCost / (1 - (tributosRate + interactiveBdi / 100));
  const calcTributos = calcPrecoVenda * tributosRate;
  const calcMargemBruta = calcPrecoVenda - calcTributos - baseCost;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 selection:bg-[#10B981] selection:text-[#070B19] relative overflow-x-hidden font-sans antialiased">
      
      {/* GRID DECORATIVO DE FUNDO */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* BACKGROUND GLOWS SUTIS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 z-0">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-br from-[#10B981]/15 to-transparent rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-gradient-to-bl from-blue-500/15 to-transparent rounded-full blur-[130px]" />
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
            <a href="#problema" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">A Trincheira</a>
            <a href="#solucao" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Solução</a>
            <a href="#beneficios" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Funcionalidades</a>
            <a href="#planos" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">Planos</a>
            <a href="#faq" className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-[#10B981] transition-colors">FAQ</a>
          </nav>

          {/* CTA Buttons in top right */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="/login" 
              className="text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white px-5 py-2.5 border border-white/5 hover:border-white/10 bg-white/5 rounded-xl transition-all"
            >
              Login
            </a>
            <button 
              onClick={() => openDemoWithPlan('Demonstração 20 Min')}
              className="text-xs font-black uppercase tracking-widest text-slate-950 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 group cursor-pointer"
            >
              Ver em Ação
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#070B19]/95 border-b border-white/5 shadow-2xl backdrop-blur-lg flex flex-col p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <a href="#problema" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">A Trincheira</a>
            <a href="#solucao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Solução</a>
            <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Funcionalidades</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">Planos</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-300 py-2 border-b border-white/5">FAQ</a>
            
            <div className="flex gap-4 pt-4">
              <a 
                href="/login" 
                className="flex-1 text-center text-xs font-black uppercase tracking-wider text-slate-300 py-3 border border-white/10 rounded-xl bg-white/5"
              >
                Login
              </a>
              <button 
                onClick={() => { setMobileMenuOpen(false); openDemoWithPlan('Demonstração Mobile'); }}
                className="flex-1 text-center text-xs font-black uppercase tracking-wider text-slate-950 py-3 bg-[#10B981] rounded-xl"
              >
                Ver em Ação
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. & 2. & 4. HERO SECTION (Headline, Sub-headline, CTA Principal) */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-[#10B981]/30 text-[10px] font-black uppercase tracking-wider text-[#10B981]">
              <Sparkles size={12} className="animate-pulse" />
              SaaS Comercial & Engenharia de Custos para Facilities
            </div>
            
            {/* 1. HEADLINE */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-black leading-[1.12] text-white tracking-tight">
              Transforme a sua prestadora de Facilities numa máquina de contratos previsíveis: <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#10B981] via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                da prospeção de grandes contas à blindagem de margem e reajustes automáticos.
              </span>
            </h1>
            
            {/* 2. SUB-HEADLINE */}
            <p className="text-slate-300 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Esqueça as folhas de cálculo com fórmulas quebradas e o silêncio após o envio de propostas em PDF. O SmartBid centraliza a prospeção de decisores, a engenharia rigorosa de custos por CCT, o rastreio de leitura do cliente e a gestão de reajustes anuais na mesma plataforma.
            </p>

            {/* 4. CHAMADA PARA AÇÃO PRINCIPAL (CTA ACIMA DA DOBRA) */}
            <div className="pt-2 flex flex-col items-center lg:items-start gap-3">
              <button 
                onClick={() => openDemoWithPlan('Demonstração Prática 20 Min')}
                className="w-full sm:w-auto px-9 py-4 bg-[#10B981] hover:bg-[#059669] text-base font-black uppercase tracking-wider text-[#070B19] rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Quero Ver o SmartBid em Ação</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Micro-texto abaixo do botão */}
              <p className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Demonstração prática de 20 minutos • Sem necessidade de cartão de crédito • Configure a sua CCT ao vivo.
              </p>
            </div>

            {/* Badges de Destaque */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0 pt-4 text-left border-t border-white/10">
              {[
                'Prospeção Direta no Google Places',
                'Engenharia Multi-CCTs Integrada',
                'Portal Interativo com Telemetria',
                'Controle de Reajustes CLM Automático'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <CheckCircle size={14} className="text-[#10B981] shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. VÍDEO OU IMAGEM DE DESTAQUE (VISUAL HERO) */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 w-full bg-[#0D1527]/95 border border-white/10 rounded-3xl p-5 shadow-2xl shadow-black/60 max-w-xl mx-auto backdrop-blur-xl group hover:border-[#10B981]/30 transition-all duration-300">
              
              {/* Header do Mockup com 3 Abas Reais */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3.5 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/40" />
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider ml-1">Fluxo Real do Sistema</span>
                </div>
                
                {/* Switcher de Abas */}
                <div className="flex bg-[#070B19] p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setHeroTab('radar')}
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      heroTab === 'radar' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Radar Comercial
                  </button>
                  <button 
                    onClick={() => setHeroTab('telemetria')}
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      heroTab === 'telemetria' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Telemetria 127x
                  </button>
                  <button 
                    onClick={() => setHeroTab('dre')}
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      heroTab === 'dre' ? 'bg-[#10B981] text-[#070B19]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3. DRE do Projeto
                  </button>
                </div>
              </div>

              {/* ABA 1: RADAR COMERCIAL COM MÉTRICAS CONSOLIDADAS */}
              {heroTab === 'radar' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center bg-[#070B19]/70 p-4 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-1">
                        Faturamento Aceito • Setembro/2026
                      </span>
                      <p className="text-2xl font-black text-white">R$ 108.774,36</p>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">11 Contratos Fechados</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/20 inline-block">
                        36.3% da Meta
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">Meta: R$ 300.000,00</p>
                    </div>
                  </div>

                  {/* Funil Visual em 5 Etapas */}
                  <div className="bg-[#070B19]/50 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Funil Comercial de Conversão
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Leads</span>
                        <span className="text-xs font-black text-white">191</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Contatos</span>
                        <span className="text-xs font-black text-white">39</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Visitas</span>
                        <span className="text-xs font-black text-white">23</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Propostas</span>
                        <span className="text-xs font-black text-white">75</span>
                      </div>
                      <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                        <span className="text-[8px] text-emerald-400 uppercase font-black block">Vendas</span>
                        <span className="text-xs font-black text-emerald-300">11</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Volume Total Mapeado:</span>
                    <span className="font-black text-[#10B981]">R$ 1.029.000,00</span>
                  </div>
                </div>
              )}

              {/* ABA 2: TELEMETRIA SILENCIOSA (MODAL COM 127 ACESSOS MONITORIZADOS) */}
              {heroTab === 'telemetria' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-4 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                        <Eye size={13} /> Telemetria de Leitura Ativa
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30 animate-pulse">
                        ● Decisor no Link Agora
                      </span>
                    </div>
                    <p className="text-sm font-black text-white">Hospital São Lucas de Curitiba</p>
                    <p className="text-[11px] text-slate-400">Proposta Comercial #SB-2026-89 • 22 Postos de Asseio</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B19]/80 border border-white/5">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <FileText size={14} className="text-[#10B981]" /> Planilha de Custos (FPV):
                      </span>
                      <span className="font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                        58 acessos (45 min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B19]/80 border border-white/5">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <Lock size={14} className="text-indigo-400" /> Minuta Contratual / Jurídico:
                      </span>
                      <span className="font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                        42 acessos (31 min)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070B19]/80 border border-white/5">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <Briefcase size={14} className="text-amber-400" /> Apresentação da Empresa:
                      </span>
                      <span className="font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                        27 acessos (18 min)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Total Acumulado de Leituras:</span>
                    <span className="font-black text-emerald-400 text-sm">127 acessos monitorados</span>
                  </div>
                </div>
              )}

              {/* ABA 3: TABELA DA DRE DO PROJETO COM MARGEM BRUTA CALCULADA AO CÊNTIMO */}
              {heroTab === 'dre' && (
                <div className="space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center bg-[#070B19]/70 p-3.5 rounded-2xl border border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Preço de Venda Mensal</span>
                      <p className="text-xl font-black text-white">{formatCurrency(calcPrecoVenda)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Margem Bruta (Cêntimo)</span>
                      <p className="text-xl font-black text-[#10B981]">{formatCurrency(calcMargemBruta)}</p>
                    </div>
                  </div>

                  {/* Slider de BDI Interativo */}
                  <div className="bg-[#070B19]/60 p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Simulador de BDI Desejado:</span>
                      <span className="font-black text-[#10B981]">{interactiveBdi.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="8" 
                      max="25" 
                      step="0.5"
                      value={interactiveBdi}
                      onChange={(e) => setInteractiveBdi(parseFloat(e.target.value))}
                      className="w-full accent-[#10B981] cursor-pointer"
                    />
                  </div>

                  {/* Resumo da DRE */}
                  <div className="text-[11px] space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-white/5">
                    <div className="flex justify-between text-slate-400">
                      <span>(+) Custo Direto (Mão de Obra + CCT + Insumos):</span>
                      <span className="font-bold text-white">{formatCurrency(baseCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>(-) Impostos s/ Faturamento (12.5%):</span>
                      <span className="font-bold text-amber-400">-{formatCurrency(calcTributos)}</span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-black pt-1.5 border-t border-white/10">
                      <span>(=) Lucro Bruto Operacional:</span>
                      <span className="text-[#10B981]">{formatCurrency(calcMargemBruta)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* 5. PROVA SOCIAL RÁPIDA (AUTORIDADE IMEDIATA) */}
      <section className="py-12 bg-[#0A1022] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="lg:max-w-2xl text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981] block mb-2">
                Autoridade de Mercado • Setor de Facilities
              </span>
              <p className="text-xl md:text-2xl font-black text-white leading-snug">
                Mais de <span className="text-[#10B981]">R$ 1.029.000 em volume negociado</span> monitorizados por prestadoras que abandonaram o improviso comercial e blindaram os seus contratos contra prejuízos operacionais.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full lg:w-auto">
              <div className="bg-[#070B19] p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-2xl md:text-3xl font-black text-[#10B981] block">100%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CCTs Parametrizadas</span>
              </div>
              <div className="bg-[#070B19] p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-2xl md:text-3xl font-black text-white block">127x</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemetria de Leitura</span>
              </div>
              <div className="bg-[#070B19] p-4 rounded-2xl border border-white/5 text-center col-span-2 sm:col-span-1">
                <span className="text-2xl md:text-3xl font-black text-emerald-400 block">14 Dias</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Garantia Blindada</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. AGITAÇÃO DO PROBLEMA (A DOR REAL DA TRINCHEIRA) */}
      <section id="problema" className="py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-wider text-red-400">
              <AlertTriangle size={12} />
              A Realidade das Prestadoras de Serviços
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
              Se gere uma empresa de prestação de serviços ou mão de obra terceirizada, <br />
              <span className="text-red-400">reconhece este cenário:</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium">
              A maioria das prestadoras não fecha por falta de clientes, mas pela hemorragia de margem invisível nas propostas e no pós-venda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Dor 1 */}
            <div className="p-7 rounded-3xl bg-[#0D1527]/90 border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Phone size={22} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  O comercial perde horas à procura de contactos
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O vendedor passa o dia a telefonar para receções gerais sem conseguir chegar a quem decide, queimando tempo valioso em listas frias e sem contexto.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-400/80 tracking-widest mt-6 block">
                Gargalo: Prospeção Ineficiente
              </span>
            </div>

            {/* Dor 2 */}
            <div className="p-7 rounded-3xl bg-[#0D1527]/90 border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <AlertCircle size={22} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  A folha de cálculo é um perigo silencioso
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Qualquer erro de fórmula nos encargos de CCT ou esquecimento na provisão reflexa de benefícios consome meses de margem de lucro sem que ninguém perceba a tempo.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-400/80 tracking-widest mt-6 block">
                Gargalo: Erros de Precificação
              </span>
            </div>

            {/* Dor 3 */}
            <div className="p-7 rounded-3xl bg-[#0D1527]/90 border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Eye size={22} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  O "ponto cego" do envio
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Envia a proposta comercial em PDF por e-mail e fica sem saber se o cliente abriu, se o setor financeiro avaliou ou se o documento foi simplesmente ignorado no lixo eletrônico.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-400/80 tracking-widest mt-6 block">
                Gargalo: Ausência de Telemetria
              </span>
            </div>

            {/* Dor 4 */}
            <div className="p-7 rounded-3xl bg-[#0D1527]/90 border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Clock size={22} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  O prejuízo invisível no pós-venda
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O contrato entra em operação, a data-base do sindicato vence e a sua empresa esquece-se de aplicar o reajuste inflacionário a tempo, pagando o dissídio do próprio bolso.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-400/80 tracking-widest mt-6 block">
                Gargalo: Perda de Repasse CCT
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 7. APRESENTAÇÃO DA SOLUÇÃO (O QUE É O SMARTBID) */}
      <section id="solucao" className="py-16 md:py-24 bg-gradient-to-b from-[#0A1022] to-[#070B19] border-y border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-black uppercase tracking-wider text-[#10B981]">
            <Shield size={14} />
            Ecossistema Tudo-Em-Um de Facilities
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight">
            Não é um CRM genérico: é a esteira definitiva da sua operação comercial.
          </h2>

          <p className="text-slate-300 text-base md:text-xl font-medium leading-relaxed max-w-4xl mx-auto">
            O <strong className="text-white font-black">SmartBid</strong> é o primeiro ecossistema tudo-em-um desenhado especificamente para a realidade de empresas de Facilities, Limpeza, Portaria e Apoio Operacional. Ele não é um CRM genérico: é uma esteira que conduz a sua operação desde o primeiro contacto com o decisor até à cobrança do último aditivo contratual.
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => openDemoWithPlan('Quero Conhecer o Ecossistema')}
              className="px-8 py-3.5 bg-[#10B981] hover:bg-[#059669] text-xs font-black uppercase tracking-widest text-[#070B19] rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
            >
              Conhecer a Esteira Completa
            </button>
          </div>
        </div>
      </section>

      {/* 8. BENEFÍCIOS E FUNCIONALIDADES DETALHADAS (A JORNADA DO CLIENTE) */}
      <section id="beneficios" className="py-20 md:py-28 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              A Jornada Completa do Contrato
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
              Funcionalidades Desenhadas para a Trincheira
            </h2>
            <p className="text-slate-400 font-medium">
              Da busca ativa por grandes contas corporativas até a blindagem da margem na virada da convenção coletiva.
            </p>
          </div>

          <div className="space-y-12">
            
            {/* Feature 1: Prospecção */}
            <div className="p-8 md:p-12 rounded-3xl bg-[#0D1527]/80 border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="p-3 rounded-2xl bg-emerald-500/10 text-[#10B981] border border-[#10B981]/20 inline-block">
                  <Search size={24} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-[#10B981] block">Etapa 1 • Inteligência Comercial</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Máquina de Prospeção de Decisores</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Localize hospitais, condomínios e indústrias de grande porte diretamente no Google Places e injete os dados no funil de vendas num único clique. Encontre o contacto dos responsáveis por Compras e RH sem depender de listas frias.
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pt-2 font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Busca automatizada com filtros por segmento e cidade</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Injeção com 1 clique direto no Kanban do CRM</li>
                </ul>
              </div>
              <div className="lg:col-span-6 bg-[#070B19] p-6 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                  <span className="font-black text-slate-300">Google Places API • Curitiba/PR</span>
                  <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">Ativo</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black text-white">Hospital Santa Cruz</p>
                    <p className="text-[10px] text-slate-400">Av. Batel, 1889 • Facilities & Saúde</p>
                  </div>
                  <span className="px-3 py-1 bg-[#10B981] text-[#070B19] text-[9px] font-black rounded-lg uppercase">
                    Injetado ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black text-white">Condomínio Evolution Towers</p>
                    <p className="text-[10px] text-slate-400">Centro Cívico • 48 Postos de Portaria</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black rounded-lg uppercase">
                    Mapeado
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 2: Engenharia CCT */}
            <div className="p-8 md:p-12 rounded-3xl bg-[#0D1527]/80 border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4 lg:order-2">
                <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-block">
                  <Database size={24} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block">Etapa 2 • Precisão Cirúrgica</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Engenharia Trabalhista e Multi-CCTs (V4.0 Enterprise)</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Parametrize convenções coletivas por estado e região (como SIEMACO). Automatize vales, descontos legais de transporte, exames médicos e provisões sobre férias com precisão cirúrgica.
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pt-2 font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Cálculo automático de encargos sociais e reflexos trabalhistas</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Atualização instantânea em caso de novo dissídio sindical</li>
                </ul>
              </div>
              <div className="lg:col-span-6 bg-[#070B19] p-6 rounded-2xl border border-white/5 space-y-3 lg:order-1">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                  <span className="font-black text-slate-300">Regras CCT SIEMACO 2026</span>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">V4.0 Ativa</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Piso Salarial Asseio</span>
                    <span className="text-sm font-black text-white">R$ 1.840,00</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Vale Alimentação / Dia</span>
                    <span className="text-sm font-black text-white">R$ 29,50</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Encargos Sociais Total</span>
                    <span className="text-sm font-black text-emerald-400">71.80%</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Provisão Reflexa Férias</span>
                    <span className="text-sm font-black text-white">11.11%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Orçamento Executivo e DRE */}
            <div className="p-8 md:p-12 rounded-3xl bg-[#0D1527]/80 border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
                  <BarChart3 size={24} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 block">Etapa 3 • Blindagem Financeira</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Orçamento Executivo e DRE Projetada</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Avalie a viabilidade do contrato para os próximos 12 meses antes de assinar. O sistema deduz impostos sobre faturação, calcula os custos da escala e apresenta a margem bruta percentual exata do projeto.
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pt-2 font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> DRE contratual mês a mês nos 12 meses de vigência</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Simulação instantânea de impacto de impostos municipais e federais</li>
                </ul>
              </div>
              <div className="lg:col-span-6 bg-[#070B19] p-6 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="font-black text-slate-300">DRE Projetada 12 Meses • Escala 12x36</span>
                  <span className="text-[10px] font-black text-amber-400">Margem Segura</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-300">
                    <span>Faturamento Bruto Projetado:</span>
                    <span className="font-bold text-white">R$ 48.900,00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-400">
                    <span>(-) Impostos (PIS/COFINS/ISS):</span>
                    <span className="font-bold text-red-400">-R$ 6.112,50</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-slate-400">
                    <span>(-) Custo Mão de Obra e Encargos:</span>
                    <span className="font-bold text-red-400">-R$ 29.800,00</span>
                  </div>
                  <div className="flex justify-between py-2 text-white font-black text-sm bg-emerald-950/20 px-3 rounded-xl border border-emerald-500/20">
                    <span>(=) Margem Bruta Contratual:</span>
                    <span className="text-[#10B981]">R$ 8.987,50 (18.4%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Telemetria */}
            <div className="p-8 md:p-12 rounded-3xl bg-[#0D1527]/80 border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4 lg:order-2">
                <span className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 inline-block">
                  <Eye size={24} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-teal-400 block">Etapa 4 • Fecho Certeiro</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Proposta Interativa com Telemetria Silenciosa</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  O cliente recebe um portal exclusivo. Saiba exatamente quantas vezes ele reabriu a planilha de custos (FPV) e a minuta de contrato, descobrindo o momento perfeito para negociar.
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pt-2 font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Alerta automático quando o tomador de decisão abre a proposta</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Mapeamento de tempo de leitura por aba (Institucional, Preços, Contrato)</li>
                </ul>
              </div>
              <div className="lg:col-span-6 bg-[#070B19] p-6 rounded-2xl border border-white/5 space-y-3 lg:order-1">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-[#10B981]">
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="font-black text-white">Alerta de Acesso ao Vivo</p>
                      <p className="text-[10px] text-slate-400">Diretoria do Cliente está na aba "Planilha de Custos"</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                    Agora
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 5: Gestão de Contratos e Alertas de Reajuste */}
            <div className="p-8 md:p-12 rounded-3xl bg-[#0D1527]/80 border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block">
                  <RefreshCw size={24} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-blue-400 block">Etapa 5 • Pós-Venda Ativo</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase">Gestão de Contratos e Alertas de Reajuste (CLM)</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Controle vigências, aditivos e o valor global da carteira ativa. O sistema sinaliza a coluna de "Reajuste Pendente" para garantir que nenhum repasse de CCT seja esquecido.
                </p>
                <ul className="space-y-2 text-xs text-slate-400 pt-2 font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Alerta com 60 e 30 dias de antecedência da data-base do sindicato</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#10B981]" /> Emissão simplificada de aditivo contratual com repasse exato</li>
                </ul>
              </div>
              <div className="lg:col-span-6 bg-[#070B19] p-6 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                  <span className="font-black text-slate-300">Radar de Reajustes Sindicais</span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Atenção</span>
                </div>
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black text-white">Contrato #CT-2024-12 • Condomínio Palladium</p>
                    <p className="text-[10px] text-slate-400">Data-Base SIEMACO em 18 dias • Repasse estimado: +6.8%</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-lg uppercase">
                    Reajuste Pendente
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 9. & 10. PARA QUEM É vs. PARA QUEM NÃO É */}
      <section className="py-20 md:py-28 bg-[#0A1022] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
              O SmartBid é Feito Para Você?
            </h2>
            <p className="text-slate-400 font-medium">
              Alinhamos as expectativas com total transparência para garantir resultados concretos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* 9. PARA QUEM É */}
            <div className="p-8 rounded-3xl bg-[#0D1527] border border-[#10B981]/30 flex flex-col justify-between shadow-xl shadow-emerald-950/20">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase">Para Quem É</h3>
                    <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">Qualificação de Público</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19]/50 border border-white/5">
                    <Check size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>Empresas de Facilities e Limpeza Profissional</strong> que necessitam de agilidade para montar orçamentos sem riscos de passivo trabalhista.</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19]/50 border border-white/5">
                    <Check size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>Prestadoras de Segurança, Portaria e Apoio</strong> com dezenas de postos alocados e necessidade de acompanhar reajustes de convenção coletiva rigorosos.</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19]/50 border border-white/5">
                    <Check size={18} className="text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>Diretores Comerciais e CEOs</strong> que exigem controlo total de indicadores: metas corporativas, ciclo médio de fecho e taxa de conversão.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 text-center">
                <span className="text-xs font-black text-[#10B981] uppercase tracking-wider">
                  ✓ Ideal para operações que buscam escala rentável
                </span>
              </div>
            </div>

            {/* 10. PARA QUEM NÃO É */}
            <div className="p-8 rounded-3xl bg-[#0D1527] border border-red-500/20 flex flex-col justify-between shadow-xl shadow-red-950/10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase">Para Quem NÃO É</h3>
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Desqualificação Firme</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-400">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19]/50 border border-white/5">
                    <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <span><strong>Empresas à procura apenas de um bloco de notas digital</strong> ou chat genérico para trocar mensagens sem engenharia de custos.</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#070B19]/50 border border-white/5">
                    <X size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <span><strong>Quem prefere continuar a correr o risco</strong> de perder dezenas de milhares de reais por ano com fórmulas manuais e desatualizadas de Excel.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 text-center">
                <span className="text-xs font-black text-red-400/80 uppercase tracking-wider">
                  ✗ Não recomendamos para quem busca soluções genéricas
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 11. QUEBRA DE OBJEÇÕES (O CONFRONTO COM O MERCADO) */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Transparência e Diferenciais
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
              O Confronto com as Alternativas de Mercado
            </h2>
            <p className="text-slate-400 font-medium">
              Por que ferramentas comuns falham no dia a dia da terceirização de serviços.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Objeção 1 */}
            <div className="p-7 rounded-3xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/30 transition-all space-y-3">
              <div className="flex items-center gap-2 text-[#10B981] text-xs font-black uppercase tracking-wider">
                <HelpCircle size={16} /> Objeção Comum #1
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                "Eu já uso um CRM comum (como Bitrix24 ou Pipedrive)"
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Um CRM comum move cartões, mas não calcula encargos sindicais A/B/C/D, não gera DRE de projeto nem avisa quando a convenção coletiva de um posto venceu. O SmartBid resolve a engenharia e o pós-venda que os outros sistemas ignoram.
              </p>
            </div>

            {/* Objeção 2 */}
            <div className="p-7 rounded-3xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/30 transition-all space-y-3">
              <div className="flex items-center gap-2 text-[#10B981] text-xs font-black uppercase tracking-wider">
                <HelpCircle size={16} /> Objeção Comum #2
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                "O meu orçamentista calcula o per capita de cabeça no Excel"
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                A conta mental deteta erros gritantes, mas não identifica a provisão reflexa de benefícios esquecida nem avisa que o cliente abriu a minuta de contrato 11 vezes no escritório dele.
              </p>
            </div>

            {/* Objeção 3 */}
            <div className="p-7 rounded-3xl bg-[#0D1527] border border-white/5 hover:border-[#10B981]/30 transition-all space-y-3">
              <div className="flex items-center gap-2 text-[#10B981] text-xs font-black uppercase tracking-wider">
                <HelpCircle size={16} /> Objeção Comum #3
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                "A implementação é demorada?"
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                A parametrização das suas CCTs principais e o modelo de proposta são estruturados de forma direta, permitindo gerar cotações já nos primeiros dias de uso.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 12. TABELA DE PLANOS E PREÇOS TRANSPARENTES */}
      <section id="planos" className="py-20 md:py-28 bg-[#0A1022] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Investimento Claro e Direto
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
              Tabela de Planos e Preços Transparentes
            </h2>
            <p className="text-slate-400 font-medium">
              Escolha a escala ideal para a sua empresa de Facilities. Cancelamento flexível a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* PLANO BÁSICO */}
            <div className="p-8 rounded-3xl bg-[#0D1527] border border-white/10 flex flex-col justify-between transition-all hover:border-white/20">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Prestadores em Fase Inicial
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase">BÁSICO</h3>
                </div>

                <div className="py-4 border-y border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">R$ 149</span>
                    <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Ideal para operações enxutas montando seus primeiros postos.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>Até 3 utilizadores</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>30 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>FPVs e CCTs: <strong>Limitado</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>Histórico e Telemetria: <strong>Básico</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Básico (R$ 149/mês)')}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white cursor-pointer"
                >
                  Escolher Básico
                </button>
              </div>
            </div>

            {/* PLANO PROFISSIONAL (PRO) - DESTAQUE */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0D1527] to-[#070B19] border-2 border-[#10B981] flex flex-col justify-between relative shadow-2xl shadow-emerald-500/10 scale-[1.03] z-10">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3.5 py-1 bg-[#10B981] text-[#070B19] text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">
                Mais Popular • Expansão
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981] block mb-1">
                    Empresas de Facilities em Expansão
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase">PROFISSIONAL (PRO)</h3>
                </div>

                <div className="py-4 border-y border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">R$ 299</span>
                    <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                  </div>
                  <span className="text-[11px] text-[#10B981] font-bold block mt-1">
                    (R$ 429 /mês com WhatsApp integrado)
                  </span>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Controle total de força de vendas e orçamentos ilimitados.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-200 font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>Até 10 utilizadores</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>150 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>FPVs e CCTs: <strong>Acesso Ilimitado</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>Histórico e Telemetria: <strong>Auditoria Completa de Logs</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>Alertas automáticos de <strong>Reajuste CLM</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Profissional PRO (R$ 299/mês)')}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-[#10B981] hover:bg-[#059669] text-[#070B19] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer font-extrabold"
                >
                  Começar no Plano PRO
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* PLANO ENTERPRISE */}
            <div className="p-8 rounded-3xl bg-[#0D1527] border border-white/10 flex flex-col justify-between transition-all hover:border-white/20">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Grandes Operações e Filiais
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase">ENTERPRISE</h3>
                </div>

                <div className="py-4 border-y border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">R$ 599</span>
                    <span className="text-xs text-slate-400 font-bold uppercase">/ mês</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Poder máximo para redes e empresas multi-regionais.</p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 font-semibold">
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>Até 100 utilizadores</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span><strong>400 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>FPVs e CCTs: <strong>Ilimitado + APIs liberadas</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={14} className="text-[#10B981] shrink-0" />
                    <span>Histórico e Telemetria: <strong>SLA Avançado e suporte 24/7</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Enterprise (R$ 599/mês)')}
                  className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white cursor-pointer"
                >
                  Falar com Consultor
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 13. GARANTIA INCONDICIONAL */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-emerald-950/30 via-[#0D1527] to-slate-900 border border-[#10B981]/30 flex flex-col sm:flex-row items-center gap-8 shadow-2xl">
            <div className="w-24 h-24 rounded-3xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
              <Shield size={48} />
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981] block">
                Risco Zero Para Sua Empresa
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase">
                Garantia de Adaptação de 14 Dias
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Se durante os primeiros 14 dias notar que o SmartBid não acelerou a montagem das suas propostas e não simplificou a leitura dos seus custos operacionais, basta solicitar o cancelamento. Devolvemos 100% do valor da assinatura, sem letras pequenas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. DEPOIMENTOS E ESTUDOS DE CASO (PROVA SOCIAL PROFUNDA) */}
      <section className="py-20 md:py-24 bg-[#0A1022] border-y border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
            Voz de Quem Está na Operação
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Prova Social Profunda
          </h2>

          <div className="p-8 md:p-12 rounded-3xl bg-[#070B19] border border-white/10 relative shadow-2xl">
            <span className="text-5xl font-black text-[#10B981]/30 absolute top-4 left-6">“</span>
            <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed italic relative z-10 pt-2">
              "Antes do SmartBid, precisávamos de um dia inteiro para cruzar os benefícios do sindicato com a planilha de insumos. Hoje colocamos uma proposta completa de 50 postos na rua em menos de meia hora e com a certeza absoluta da margem de lucro."
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center font-black text-[#10B981] text-xs">
                DC
              </div>
              <div className="text-left">
                <p className="font-black text-white text-sm">Direção Comercial</p>
                <p className="text-xs text-slate-400 font-semibold">Setor de Asseio, Conservação e Facilities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 15. PERGUNTAS FREQUENTES (FAQ ESTRATÉGICO) */}
      <section id="faq" className="py-20 md:py-28 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#10B981]">
              Tire as Suas Dúvidas
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-400 font-medium">
              Respostas diretas sobre implementação, CCTs e o funcionamento do sistema.
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
                resposta: 'Gera um link exclusivo através do sistema. Quando o cliente abre a página, o SmartBid regista o tempo e a quantidade de visitas em cada aba: apresentação institucional, proposta comercial, detalhamento de custos e minuta jurídica.'
              },
              {
                pergunta: '3. O sistema calcula a DRE do contrato automaticamente?',
                resposta: 'Sim. A partir do preenchimento da mão de obra e insumos, o software projeta os impostos, os custos diretos e a margem bruta de cada mês do contrato.'
              },
              {
                pergunta: '4. Como o SmartBid ajuda no momento de reajustar o contrato?',
                resposta: 'O módulo de contratos organiza as contas por vigência e assinala visualmente os contratos com "Reajuste Pendente" com base na data-base acordada, evitando que preste serviços com valores desatualizados.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl bg-[#0D1527] border border-white/5 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span className="font-black text-white text-sm md:text-base">{faq.pergunta}</span>
                    <ChevronDown size={18} className={`text-[#10B981] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 16. CHAMADA PARA AÇÃO FINAL (URGÊNCIA E FECHO) */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0A1022] to-[#070B19] border-t border-white/10 relative z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
          <div className="w-[700px] h-[350px] bg-gradient-to-r from-blue-500/20 via-[#10B981]/25 to-teal-400/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-[#10B981]/30 text-xs font-black uppercase tracking-wider text-[#10B981]">
            <Flame size={14} />
            Proteja a Saúde Financeira da Sua Empresa
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            Pare de deixar margem de lucro na mesa e assuma o controlo total da sua esteira comercial.
          </h2>
          
          <p className="text-slate-300 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Descubra como estruturar orçamentos seguros, fechar contratos mais rápido e proteger a saúde financeira da sua prestadora de serviços.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => openDemoWithPlan('Solicitar Demonstração Gratuita Final')}
              className="px-10 py-5 bg-[#10B981] hover:bg-[#059669] text-[#070B19] text-sm md:text-base font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              Solicitar Demonstração Gratuita do SmartBid
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider pt-2">
            Demonstração prática ao vivo • Sem compromisso • Adaptada à sua convenção sindical
          </p>
        </div>
      </section>

      {/* 17. RODAPÉ CORPORATIVO E INFORMAÇÕES LEGAIS */}
      <footer className="py-14 bg-[#050812] border-t border-white/5 relative z-10 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#0D1527] rounded-xl flex items-center justify-center border border-[#10B981]/20">
                <TrendingUp className="text-[#10B981]" size={18} />
              </div>
              <div>
                <span className="text-base font-black tracking-tighter uppercase text-slate-200 block">
                  Smart<span className="text-[#10B981]">Bid</span>
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] block">
                  Powered by Intelligence
                </span>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="text-center md:text-right text-xs space-y-1">
              <p className="font-bold text-slate-300">Suporte técnico corporativo • Curitiba/PR • Brasil</p>
              <p className="text-slate-500">Gestão analítica e formação de preço para o setor de Facilities.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p className="font-medium text-slate-500">
              © {new Date().getFullYear()} SmartBid • Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-6 font-bold uppercase tracking-widest text-[11px]">
              <a href="#" className="hover:text-slate-300 transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-300 transition-colors">Políticas de Privacidade</a>
              <span>•</span>
              <a href="mailto:suporte@smartbidhub.com.br" className="hover:text-slate-300 transition-colors">Central de Ajuda</a>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL DE AGENDAMENTO / DEMONSTRAÇÃO PRÁTICA */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0D1527] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button 
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>

            {!demoSuccess ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                    Demonstração Personalizada • 20 Minutos
                  </span>
                  <h3 className="text-xl font-black text-white uppercase">
                    Ver o SmartBid em Ação
                  </h3>
                  <p className="text-xs text-slate-400">
                    Interesse: <strong className="text-white">{demoPlanName}</strong>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Seu Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: João da Silva"
                      value={demoForm.nome}
                      onChange={(e) => setDemoForm({ ...demoForm, nome: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-white/10 text-white text-xs outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="seuemail@suaempresa.com.br"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-white/10 text-white text-xs outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="(41) 99999-9999"
                        value={demoForm.whatsapp}
                        onChange={(e) => setDemoForm({ ...demoForm, whatsapp: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-white/10 text-white text-xs outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Nome da Empresa *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Prime Facilities"
                        value={demoForm.empresa}
                        onChange={(e) => setDemoForm({ ...demoForm, empresa: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-white/10 text-white text-xs outline-none focus:border-[#10B981]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Porte da Operação
                    </label>
                    <select
                      value={demoForm.postos}
                      onChange={(e) => setDemoForm({ ...demoForm, postos: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#070B19] border border-white/10 text-white text-xs outline-none focus:border-[#10B981]"
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
                    className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-[#070B19] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
                  >
                    Confirmar e Agendar Demonstração
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Sem necessidade de cartão de crédito. Resposta em minutos.
                  </p>
                </div>
              </form>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-[#10B981] flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-xl font-black text-white uppercase">Solicitação Recebida!</h4>
                <p className="text-sm text-slate-300 max-w-sm mx-auto">
                  Encaminhando para o nosso canal executivo no WhatsApp para configurar a sua demonstração com CCT ao vivo.
                </p>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
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
