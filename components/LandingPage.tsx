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
  FileSpreadsheet, Target, CheckSquare, Layers, Share2
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
  const [heroTab, setHeroTab] = useState<'propostaLink' | 'telemetria' | 'radar' | 'dre'>('propostaLink');
  const [clientProposalSubTab, setClientProposalSubTab] = useState<'postos' | 'fpv' | 'minuta' | 'apresentacao'>('postos');
  const [clientAccepted, setClientAccepted] = useState(false);
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
      `Olá! Gostaria de agendar uma demonstração prática do SmartBid (${demoPlanName}).\nNome: ${demoForm.nome}\nEmpresa: ${demoForm.empresa}\nWhatsApp: ${demoForm.whatsapp}\nPorte: ${demoForm.postos}`
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
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* HEADER / NAVBAR CORPORATIVO */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 shadow-xs' 
          : 'bg-white border-b border-slate-100 py-4.5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center shadow-xs">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Smart<span className="text-emerald-600">Bid</span>
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                Inteligência Comercial & Custos para Prestadoras de Serviços
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#solucao" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition-colors">A Solução</a>
            <a href="#funcionalidades" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition-colors">Funcionalidades</a>
            <a href="#qualificacao" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition-colors">Para Quem É</a>
            <a href="#planos" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition-colors">Planos</a>
            <a href="#faq" className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition-colors">Dúvidas</a>
          </nav>

          {/* CTA Buttons in top right */}
          <div className="hidden md:flex items-center gap-3.5">
            <a 
              href="/login" 
              className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950 px-4 py-2.5 transition-colors"
            >
              Acessar Conta
            </a>
            <button 
              onClick={() => openDemoWithPlan('Demonstração 20 Min')}
              className="text-xs font-bold uppercase tracking-wider text-white px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-sm flex items-center gap-2 group cursor-pointer"
            >
              Ver em Ação
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl flex flex-col p-6 space-y-4 animate-in fade-in duration-150">
            <a href="#solucao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-100">A Solução</a>
            <a href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-100">Funcionalidades</a>
            <a href="#qualificacao" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-100">Para Quem É</a>
            <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-100">Planos</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold uppercase tracking-wider text-slate-700 py-2 border-b border-slate-100">Dúvidas</a>
            
            <div className="flex gap-3 pt-3">
              <a 
                href="/login" 
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-slate-700 py-3 border border-slate-200 rounded-xl bg-slate-50"
              >
                Acessar Conta
              </a>
              <button 
                onClick={() => { setMobileMenuOpen(false); openDemoWithPlan('Demonstração Mobile'); }}
                className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-white py-3 bg-emerald-700 rounded-xl"
              >
                Ver em Ação
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. & 2. & 4. HERO SECTION CORPORATIVO */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            {/* Tag / Badge Corporativo Limpo */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <Shield size={14} className="text-emerald-700" />
              <span>SaaS Especializado para Prestadoras de Serviços Terceirizados</span>
            </div>
            
            {/* 1. HEADLINE */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black leading-[1.18] text-slate-900 tracking-tight">
              Transforme a sua prestadora de serviços numa máquina de contratos previsíveis: <br className="hidden sm:inline" />
              <span className="text-emerald-700">
                da prospecção de grandes contas à blindagem de margem e reajustes automáticos.
              </span>
            </h1>
            
            {/* 2. SUB-HEADLINE */}
            <p className="text-slate-600 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
              Esqueça as planilhas com fórmulas quebradas e o silêncio após o envio de propostas em PDF. O SmartBid centraliza a prospecção de decisores, a engenharia rigorosa de custos por CCT, o rastreio de leitura do cliente e a gestão de reajustes anuais na mesma plataforma.
            </p>

            {/* 4. CHAMADA PARA AÇÃO PRINCIPAL (CTA ACIMA DA DOBRA) */}
            <div className="pt-3 flex flex-col items-center gap-3">
              <button 
                onClick={() => openDemoWithPlan('Demonstração Prática 20 Min')}
                className="px-9 py-4 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer hover:shadow-lg active:scale-[0.99]"
              >
                <span>Quero Ver o SmartBid em Ação</span>
                <ArrowRight size={18} />
              </button>
              
              {/* Micro-texto abaixo do botão */}
              <p className="text-xs text-slate-500 font-medium">
                Demonstração prática de 20 minutos • Sem necessidade de cartão de crédito • Configure a sua CCT ao vivo.
              </p>
            </div>
          </div>

          {/* 3. VÍDEO OU IMAGEM DE DESTAQUE (VISUAL HERO COM INTERFACE REAL) */}
          <div className="max-w-5xl mx-auto">
            {/* BROWSER WINDOW MOCKUP REALISTA */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden">
              
              {/* Barra superior de janela de aplicativo */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                  <span className="text-xs text-slate-600 font-mono font-medium ml-2 hidden sm:inline">
                    https://app.smartbidhub.com.br
                  </span>
                </div>

                {/* Abas de Navegação do Mockup */}
                <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
                  <button
                    onClick={() => setHeroTab('propostaLink')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      heroTab === 'propostaLink' ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-500/20' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    1. Link da Proposta (Cliente)
                  </button>
                  <button
                    onClick={() => setHeroTab('telemetria')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      heroTab === 'telemetria' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Telemetria & Rastreio (127x)
                  </button>
                  <button
                    onClick={() => setHeroTab('radar')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      heroTab === 'radar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. Radar Comercial
                  </button>
                  <button
                    onClick={() => setHeroTab('dre')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      heroTab === 'dre' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    4. DRE do Projeto
                  </button>
                </div>
              </div>

              {/* CONTEÚDO DA TELA SELECIONADA */}
              <div className="p-5 sm:p-7 md:p-8 bg-slate-50 min-h-[380px]">
                
                {/* ABA 1: O LINK DA PROPOSTA INTERATIVA (O QUE O CLIENTE VÊ - TECNOLOGIA ESTILO PROVELO COM ENGENHARIA DE CUSTOS) */}
                {heroTab === 'propostaLink' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                    {/* Barra de URL do Link Exclusivo da Proposta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px] truncate">
                        <Lock size={12} className="text-emerald-700 shrink-0" />
                        <span className="text-emerald-800 font-bold">https://smartbidhub.com.br/proposta/ver/</span>
                        <span className="text-slate-500 font-semibold truncate">ct-892-hospital-sao-lucas</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Link Web Ativo
                        </span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">Envio direto por WhatsApp ou E-mail</span>
                      </div>
                    </div>

                    {/* Cabeçalho da Proposta do Cliente */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                          ALIANÇA SERVIÇOS TERCEIRIZADOS • PROPOSTA COMERCIAL EXCLUSIVA
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                          Prestação de Serviços de Asseio, Higienização e Apoio Operacional
                        </h4>
                        <p className="text-xs text-slate-500">Cliente: Hospital Geral São Lucas • Vigência 12 Meses</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Valor Global Mensal</span>
                        <span className="text-xl font-black text-emerald-800">R$ 48.900,00</span>
                        <span className="text-[10px] text-slate-500 block">Faturamento direto c/ CCT vinculada</span>
                      </div>
                    </div>

                    {/* Sub-abas de Navegação da Proposta */}
                    <div className="flex gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                      <button
                        onClick={() => setClientProposalSubTab('postos')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'postos' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        👥 Postos & Escala (22 Postos)
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('fpv')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'fpv' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        📊 Planilha FPV (Composição de Custos)
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('minuta')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'minuta' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ⚖️ Minuta Contratual
                      </button>
                      <button
                        onClick={() => setClientProposalSubTab('apresentacao')}
                        className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                          clientProposalSubTab === 'apresentacao' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        🏢 Apresentação Institucional
                      </button>
                    </div>

                    {/* Conteúdo da Sub-Aba Selecionada */}
                    {clientProposalSubTab === 'postos' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900">18x Auxiliares de Limpeza Hospitalar</span>
                              <span className="font-mono text-emerald-800 font-bold">R$ 38.880,00</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Escala 12x36 Diurna e Noturna • Piso CCT SIEMACO + Insalubridade 40%</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-900">4x Encarregados Operacionais</span>
                              <span className="font-mono text-emerald-800 font-bold">R$ 10.020,00</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Escala 44h Semanais • Coordenação de equipe, controle de EPIs e cronograma</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {clientProposalSubTab === 'fpv' && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                          <span>Módulo de Composição de Preço (FPV)</span>
                          <span className="text-emerald-700">Encargos 71.8% + Benefícios Parametrizados</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 bg-white rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Salário Base + Adicionais</span>
                            <span className="font-bold text-slate-900">R$ 25.420,00</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Encargos Sociais & Trabalhistas</span>
                            <span className="font-bold text-slate-900">R$ 18.251,56</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Benefícios (VT / VR / Cesta)</span>
                            <span className="font-bold text-slate-900">R$ 6.320,00</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Insumos & Uniformes</span>
                            <span className="font-bold text-slate-900">R$ 2.450,00</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {clientProposalSubTab === 'minuta' && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
                        <p className="font-bold text-slate-900">Cláusula 5ª • Do Reajuste Anual e Repasse Sindical</p>
                        <p className="text-[11px] leading-relaxed">
                          Os valores contratados serão reajustados anualmente na data-base da categoria (Maio/2026), mediante repasse integral do dissídio salarial homologado pela convenção coletiva.
                        </p>
                      </div>
                    )}

                    {clientProposalSubTab === 'apresentacao' && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Aliança Serviços Terceirizados</p>
                            <p className="text-[11px] text-slate-500">Mais de 850 postos ativos • 14 anos de mercado • Atendimento 24/7</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BOTÕES DE AÇÃO DO CLIENTE: ACEITE DIGITAL + WHATSAPP (O QUE FAZ FECHAR NEGÓCIO) */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                          <CheckCircle size={15} className="text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-950">Aprovação Direta sem Papel nem Cartório</span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          {clientAccepted 
                            ? '✓ Proposta Aprovada Digitalmente pelo Cliente com Registro de IP e Horário!' 
                            : 'O cliente clica e aprova a proposta comercial online direto na tela.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setClientAccepted(!clientAccepted)}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            clientAccepted 
                              ? 'bg-emerald-800 text-white' 
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
                          }`}
                        >
                          {clientAccepted ? '✓ Proposta Aprovada' : 'Simular Aceite Digital'}
                        </button>
                        <a
                          href="https://wa.me/5541999999999"
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquare size={14} className="text-emerald-600" />
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 text-center font-medium">
                      ⚡ <strong>O Grande Diferencial:</strong> Softwares como Provelo cobram assinatura só para gerar esse link. No SmartBid, a proposta já nasce preenchida a partir da sua CCT e com telemetria que avisa quando o cliente abre!
                    </div>
                  </div>
                )}

                {/* ABA 2: RADAR COMERCIAL COM MÉTRICAS CONSOLIDADAS */}
                {heroTab === 'radar' && (
                  <div className="space-y-6">
                    {/* Top KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Faturamento Aceito (Setembro)
                        </span>
                        <p className="text-2xl font-black text-emerald-800">R$ 108.774,36</p>
                        <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                          11 contratos convertidos
                        </span>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Meta da Equipe Ativa
                        </span>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-black text-slate-900">R$ 300.000,00</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            36.3% atingido
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: '36.3%' }}></div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                          Volume em Propostas no Radar
                        </span>
                        <p className="text-2xl font-black text-slate-900">+R$ 1.284.950.000</p>
                        <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                          + de R$ 1,2 Bilhão gerenciados
                        </span>
                      </div>
                    </div>

                    {/* Funil Comercial em 5 Etapas */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Funil de Vendas Comercial
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">191 oportunidades rastreadas</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Leads</span>
                          <span className="text-lg font-black text-slate-900">191</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Base Mapeada</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Contatos</span>
                          <span className="text-lg font-black text-slate-900">39</span>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">20.4% avanço</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">3. Visitas</span>
                          <span className="text-lg font-black text-slate-900">23</span>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">59.0% avanço</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">4. Propostas</span>
                          <span className="text-lg font-black text-slate-900">75</span>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Emitidas</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center col-span-2 sm:col-span-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">5. Vendas</span>
                          <span className="text-lg font-black text-emerald-900">11</span>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">14.7% fechamento</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: MODAL COM 127 ACESSOS MONITORIZADOS POR ABA */}
                {heroTab === 'telemetria' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                            Telemetria Ativa • Cliente Visualizando Proposta Agora
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mt-1">
                          Hospital São Lucas • Proposta Comercial #SB-2026-89
                        </h4>
                        <p className="text-xs text-slate-500">22 Postos de Asseio e Conservação Hospitalar</p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right sm:text-center">
                        <span className="text-2xl font-black text-emerald-800 block">127</span>
                        <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Acessos Monitorados</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                        Detalhamento de Tempo e Leituras por Aba:
                      </span>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            FPV
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Planilha de Formação de Preço (FPV)</p>
                            <p className="text-[11px] text-slate-500">Composição de pisos, benefícios e encargos CCT</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                            58 visualizações (45 min)
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                            CLM
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Minuta Contratual & Cláusulas Jurídicas</p>
                            <p className="text-[11px] text-slate-500">Regras de repasse, rescisão e data-base do sindicato</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                            42 visualizações (31 min)
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            DOC
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Apresentação Técnica e Cronograma de Postos</p>
                            <p className="text-[11px] text-slate-500">Escopo dos serviços e certificações operacionais</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                            27 visualizações (18 min)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 4: TABELA DA DRE DO PROJETO COM MARGEM BRUTA CALCULADA AO CENTAVO */}
                {heroTab === 'dre' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          Demonstrativo de Resultado do Projeto (DRE Executiva)
                        </h4>
                        <p className="text-xs text-slate-500">Simulação de 12 meses • Escala 12x36 e 44h semanais</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600">Ajuste de Margem (BDI):</span>
                        <span className="text-sm font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {interactiveBdi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Slider de BDI */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Margem Mínima (8%)</span>
                        <span className="font-bold text-slate-900">Deslize para recalcular impostos e preço final</span>
                        <span>Margem Alta (25%)</span>
                      </div>
                      <input 
                        type="range" 
                        min="8" 
                        max="25" 
                        step="0.5"
                        value={interactiveBdi}
                        onChange={(e) => setInteractiveBdi(parseFloat(e.target.value))}
                        className="w-full accent-emerald-700 cursor-pointer"
                      />
                    </div>

                    {/* Tabela da DRE com Centavos */}
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100 py-2">
                          <td className="py-2 text-slate-600 font-medium">(+) Custo Direto (Mão de Obra, Benefícios, CCT e Insumos)</td>
                          <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(baseCost)}</td>
                        </tr>
                        <tr className="border-b border-slate-100 py-2">
                          <td className="py-2 text-slate-600 font-medium">(-) Impostos sobre Faturamento (PIS/COFINS/ISS - 12.50%)</td>
                          <td className="py-2 text-right font-bold text-amber-700">-{formatCurrency(calcTributos)}</td>
                        </tr>
                        <tr className="border-b border-slate-200 py-2.5 bg-slate-50/80 font-bold">
                          <td className="py-2.5 px-2 text-slate-900 font-bold">(=) Faturamento Bruto Mensal Contratado</td>
                          <td className="py-2.5 px-2 text-right font-black text-slate-900">{formatCurrency(calcPrecoVenda)}</td>
                        </tr>
                        <tr className="py-3 bg-emerald-50/80">
                          <td className="py-3 px-2 text-emerald-950 font-black text-sm">
                            (=) Lucro Bruto Operacional (Margem Calculada ao Centavo)
                          </td>
                          <td className="py-3 px-2 text-right font-black text-emerald-800 text-base">
                            {formatCurrency(calcMargemBruta)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. PROVA SOCIAL RÁPIDA (AUTORIDADE IMEDIATA) */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="lg:max-w-2xl text-center lg:text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                Autoridade no Setor de Prestação de Serviços & Terceirização
              </span>
              <p className="text-xl sm:text-2xl font-extrabold leading-snug">
                Mais de <span className="text-emerald-400">+R$ 1,2 Bilhão em propostas gerenciadas</span> por prestadoras de serviços que abandonaram o improviso comercial e blindaram seus contratos contra prejuízos operacionais.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">100%</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">CCTs Parametrizadas</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                <span className="text-2xl sm:text-3xl font-black text-white block">127x</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Telemetria de Leitura</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center col-span-2 sm:col-span-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">14 Dias</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Garantia Blindada</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. AGITAÇÃO DO PROBLEMA (A DOR REAL DA TRINCHEIRA) */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full">
              A Dor Real da Trincheira
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Se você administra uma prestadora de serviços ou empresa de terceirização, reconhece este cenário:
            </h2>
            <p className="text-slate-600 text-base font-normal">
              O modelo tradicional de planilhas e PDFs consome a margem de lucro de forma invisível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            {/* Dor 1 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Phone size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  O comercial perde horas procurando contatos de decisores
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O vendedor passa o dia ligando para recepções gerais sem conseguir falar com quem decide, queimando energia em listas frias e sem contexto.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 mt-6 block">
                Impacto: Prospecção lenta e sem previsibilidade
              </span>
            </div>

            {/* Dor 2 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  A planilha de cálculo é um perigo silencioso
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Qualquer erro de fórmula nos encargos de CCT ou esquecimento na provisão reflexa de benefícios consome meses de margem de lucro.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 mt-6 block">
                Impacto: Prejuízo oculto em contratos vigentes
              </span>
            </div>

            {/* Dor 3 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Eye size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  O "ponto cego" do envio
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Você envia a proposta em PDF por e-mail e fica no escuro, sem saber se o cliente abriu, se o setor financeiro avaliou ou se o arquivo foi ignorado.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 mt-6 block">
                Impacto: Follow-up no escuro e perda de timing
              </span>
            </div>

            {/* Dor 4 */}
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Clock size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  O prejuízo invisível no pós-venda
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O contrato entra em operação, a data-base do sindicato vence e a sua empresa esquece de repassar o reajuste inflacionário a tempo, pagando o dissídio do próprio bolso.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 mt-6 block">
                Impacto: Sangria de caixa por falta de repasse
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 7. APRESENTAÇÃO DA SOLUÇÃO (O QUE É O SMARTBID) */}
      <section id="solucao" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full inline-block">
            Apresentação da Solução
          </span>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            O primeiro ecossistema tudo-em-um desenhado para a realidade de prestadoras de serviços terceirizados.
          </h2>

          <p className="text-slate-700 text-lg md:text-xl font-normal leading-relaxed">
            O <strong>SmartBid</strong> é o primeiro ecossistema tudo-em-um desenhado especificamente para a realidade de prestadoras de serviços terceirizados, limpeza, portaria, segurança e apoio operacional. Ele não é um CRM genérico: é uma esteira que conduz a sua operação desde o primeiro contato com o decisor até a aplicação de cada reajuste e aditivo contratual.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => openDemoWithPlan('Conhecer a Esteira Completa')}
              className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Conhecer a Esteira Completa
            </button>
          </div>
        </div>
      </section>

      {/* 8. BENEFÍCIOS E FUNCIONALIDADES DETALHADAS (A JORNADA DO CLIENTE) */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
              A Jornada do Cliente
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Benefícios e Funcionalidades Detalhadas
            </h2>
            <p className="text-slate-600 text-base font-normal">
              Cinco pilares conectados para blindar seu faturamento e sua operação.
            </p>
          </div>

          <div className="space-y-12 max-w-5xl mx-auto">
            
            {/* Módulo 1 */}
            <div className="p-8 md:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
                  Etapa 01 • Prospecção de Decisores
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Máquina de Prospecção de Decisores
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Localize hospitais, condomínios e indústrias de grande porte diretamente no Google Places e injete os dados no funil de vendas em um único clique. Encontre o contato dos responsáveis por Compras e RH sem depender de listas frias.
                </p>
              </div>
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center font-bold text-slate-700 pb-2 border-b border-slate-200">
                  <span>Google Places Integrado</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Ativo</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900">Hospital & Maternidade</p>
                  <p className="text-[11px] text-slate-500">Telefone direto • E-mail de Compras</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900">Condomínio Residencial</p>
                  <p className="text-[11px] text-slate-500">Síndico Profissional • 32 Postos</p>
                </div>
              </div>
            </div>

            {/* Módulo 2 */}
            <div className="p-8 md:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3 md:order-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
                  Etapa 02 • Engenharia Trabalhista
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Engenharia Trabalhista e Multi-CCTs (V4.0 Enterprise)
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Parametrize convenções coletivas por estado e região (como SIEMACO). Automatize vales, descontos legais de transporte, exames médicos e provisões sobre férias com precisão cirúrgica.
                </p>
              </div>
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2 md:order-1">
                <div className="flex justify-between items-center font-bold text-slate-700 pb-2 border-b border-slate-200">
                  <span>Convenção SIEMACO 2026</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">V4.0</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Piso CCT</span>
                    <span className="font-black text-slate-900 text-sm">R$ 1.840,00</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Encargos Sociais</span>
                    <span className="font-black text-emerald-700 text-sm">71.80%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Módulo 3 */}
            <div className="p-8 md:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
                  Etapa 03 • Viabilidade Financeira
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Orçamento Executivo e DRE Projetada
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Avalie a viabilidade do contrato para os próximos 12 meses antes de assinar. O sistema deduz impostos sobre faturamento, calcula os custos da escala e apresenta a margem bruta percentual exata do projeto.
                </p>
              </div>
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-700 pb-2 border-b border-slate-200">
                  <span>DRE Projetada 12 Meses</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Viável</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Faturamento Mensal:</span>
                    <span className="font-bold text-slate-900">R$ 48.900,00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>(-) Custo Operacional:</span>
                    <span className="font-bold text-slate-900">-R$ 29.800,00</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span>Margem Bruta (18.4%):</span>
                    <span>R$ 8.987,50</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Módulo 4 */}
            <div className="p-8 md:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3 md:order-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
                  Etapa 04 • Negociação com Dados
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Proposta Interativa com Telemetria Silenciosa
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  O cliente recebe um portal exclusivo. Saiba exatamente quantas vezes ele reabriu a planilha de custos (FPV) e a minuta de contrato, descobrindo o momento perfeito para negociar.
                </p>
              </div>
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2.5 md:order-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold pb-2 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Notificação em Tempo Real</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900">Cliente reabriu a proposta</p>
                  <p className="text-[11px] text-slate-500">Visualizou "Planilha de Custos" há 2 minutos</p>
                </div>
              </div>
            </div>

            {/* Módulo 5 */}
            <div className="p-8 md:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block">
                  Etapa 05 • Blindagem no Pós-Venda
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  Gestão de Contratos e Alertas de Reajuste (CLM)
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Controle vigências, aditivos e o valor global da carteira ativa. O sistema sinaliza a coluna de "Reajuste Pendente" para garantir que nenhum repasse de CCT seja esquecido.
                </p>
              </div>
              <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-700 pb-2 border-b border-slate-200">
                  <span>Alerta de Reajuste Sindical</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Pendente</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900">Contrato #CT-2024-12</p>
                  <p className="text-[11px] text-amber-700 font-semibold">Data-base em 30 dias • Aplicar repasse inflacionário</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO ESPECIAL DE DESTAQUE: O LINK DA PROPOSTA INTERATIVA (O DIFERENCIAL MATADOR FRENTE À PROVELO) */}
      <section id="proposta-interativa" className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-full inline-block">
              O Diferencial que Fecha Contratos Mais Rápido
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              O Link da Proposta Comercial Interativa: <br />
              <span className="text-emerald-700">O fim definitivo do PDF frio e sem resposta.</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Plataformas como a <strong>Provelo</strong> vendem <em>apenas</em> links de propostas com rastreamento e cobram mensalidades caras só por isso. No <strong>SmartBid</strong>, essa tecnologia já vem nativa, permitindo que seu cliente aprove a proposta online em 1 clique — com a vantagem de estar 100% amarrada aos custos reais da sua CCT.
            </p>
          </div>

          {/* Comparativo Visual: O PDF Tradicional vs. Provelo vs. SmartBid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-14">
            
            {/* 1. PDF Tradicional */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">O Jeito Antigo (PDF Anexo)</h3>
                  <span className="text-xs text-red-700 font-semibold">Invisível e Sem Retorno</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Arquivo pesado que cai no spam ou barra na caixa de entrada corporativa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Zero rastreio: você não sabe se o cliente abriu ou se ignorou seu e-mail.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Para aprovar, o cliente tem que imprimir, assinar de caneta e escanear.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Follow-up cego: você liga sem saber se ele teve tempo de analisar o valor.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6">
                <span className="text-[11px] font-bold text-red-700 uppercase">Resultado: Baixa conversão e perda de tempo</span>
              </div>
            </div>

            {/* 2. Provelo e Softwares Comuns de Proposta */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Provelo / Softwares de Proposta</h3>
                  <span className="text-xs text-amber-800 font-semibold">Apenas Link Cosmético</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span>Gera um link web bonito e notifica quando o cliente abre o documento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span>Permite assinatura digital e telemetria básica de páginas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span><strong>Não calcula CCT:</strong> você precisa montar planilhas em outro software e colar texto na mão.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span><strong>Não tem DRE:</strong> não avisa se você está tendo lucro ou prejuízo no contrato.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X size={15} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Cobram mensalidades caras apenas para entregar o link de proposta.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Resultado: Bom visual, mas sem inteligência de custos</span>
              </div>
            </div>

            {/* 3. SmartBid (O Ecossistema Completo) */}
            <div className="p-7 rounded-2xl bg-white border-2 border-emerald-600 shadow-xl flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                O Mais Completo do Brasil
              </div>

              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">O Link Inteligente SmartBid</h3>
                  <span className="text-xs text-emerald-800 font-bold">Link + Engenharia de Terceirização</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-800 font-medium">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Link Exclusivo com sua Marca:</strong> portal responsivo que abre perfeito no celular ou PC.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Alerta Imediato no WhatsApp:</strong> aviso na hora exata em que o cliente abre a proposta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Telemetria por Seção:</strong> saiba quantos minutos ele passou na FPV, escopo ou minuta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Aceite Digital em 1 Clique:</strong> o cliente aprova online sem burocracia nem impressões.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>CCT & FPV Automáticas:</strong> os valores vêm da convenção coletiva, sem risco de erro de cálculo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Pós-Venda Automático (CLM):</strong> virou contrato, o sistema monitora a data-base de reajuste.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6">
                <span className="text-[11px] font-black text-emerald-800 uppercase">Resultado: Máxima taxa de conversão e margem blindada</span>
              </div>
            </div>

          </div>

          {/* 4 Pilares do Link da Proposta SmartBid */}
          <div className="p-8 md:p-10 rounded-2xl bg-slate-900 text-white shadow-xl max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Eye size={18} />
                </div>
                <h4 className="text-sm font-bold text-white">Rastreio Silencioso</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Descubra se o decisor abriu a proposta às 22h ou compartilhou o link com o diretor financeiro.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle size={18} />
                </div>
                <h4 className="text-sm font-bold text-white">Aceite Digital Instantâneo</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O cliente clica em "Aprovar Proposta" e o contrato já entra na esteira de implantação operacional.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <MessageSquare size={18} />
                </div>
                <h4 className="text-sm font-bold text-white">WhatsApp Integrado</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Botão de contato direto com o seu vendedor fixado no rodapé da proposta para tirar dúvidas na hora.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Shield size={18} />
                </div>
                <h4 className="text-sm font-bold text-white">Segurança & Validade</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Registro de IP, data, horário e versões para proteção jurídica da sua prestadora de serviços.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 9. & 10. QUALIFICAÇÃO & DESQUALIFICAÇÃO (PARA QUEM É / NÃO É) */}
      <section id="qualificacao" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              O SmartBid é Feito Para Você?
            </h2>
            <p className="text-slate-600 text-base font-normal">
              Alinhamos expectativas para garantir retorno real no seu investimento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* 9. PARA QUEM É */}
            <div className="p-8 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <CheckCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Para Quem É</h3>
                    <span className="text-xs text-emerald-700 font-semibold">Qualificação de Público</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Prestadoras de serviços de limpeza e conservação</strong> que necessitam de agilidade para montar orçamentos sem riscos de passivo trabalhista.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Prestadoras de Segurança, Portaria e Apoio</strong> com dezenas de postos alocados e necessidade de acompanhar reajustes de convenção coletiva rigorosos.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Diretores Comerciais e Sócios</strong> que exigem controle total de indicadores: metas corporativas, ciclo médio de fechamento e taxa de conversão.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 10. PARA QUEM NÃO É */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    <XCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Para Quem NÃO É</h3>
                    <span className="text-xs text-red-700 font-semibold">Desqualificação Firme</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <X size={18} className="text-red-700 shrink-0 mt-0.5" />
                    <span><strong>Empresas procurando apenas um bloco de notas digital</strong> ou chat genérico sem cálculo e engenharia de custos.</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <X size={18} className="text-red-700 shrink-0 mt-0.5" />
                    <span><strong>Quem prefere continuar correndo o risco</strong> de perder dezenas de milhares de reais por ano com fórmulas manuais e desatualizadas de Excel.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 11. QUEBRA DE OBJEÇÕES (O CONFRONTO COM O MERCADO) */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
              Comparativo de Mercado
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              O Confronto com as Alternativas de Mercado
            </h2>
            <p className="text-slate-600 text-base font-normal">
              Entenda os limites das ferramentas genéricas quando aplicadas à terceirização.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                "Eu já uso um CRM comum (como Bitrix24 ou Pipedrive)"
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Um CRM comum move cartões, mas não calcula encargos sindicais A/B/C/D, não gera DRE de projeto nem avisa quando a convenção coletiva de um posto venceu. O SmartBid resolve a engenharia e o pós-venda que os outros sistemas ignoram.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                "O meu orçamentista calcula o per capita de cabeça no Excel"
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A conta mental detecta erros gritantes, mas não identifica a provisão reflexa de benefícios esquecida nem avisa que o cliente abriu a minuta de contrato 11 vezes no escritório dele.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                "A implementação é demorada?"
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                A parametrização das suas CCTs principais e o modelo de proposta são estruturados de forma direta, permitindo gerar cotações já nos primeiros dias de uso.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 12. TABELA DE PLANOS E PREÇOS TRANSPARENTES */}
      <section id="planos" className="py-24 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3.5 py-1 rounded-full">
              Tabela de Planos
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Planos Transparentes e Diretos
            </h2>
            <p className="text-slate-600 text-base font-normal">
              Escolha a escala ideal para a sua empresa. Sem taxas ocultas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* PLANO BÁSICO */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Prestadores em fase inicial
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">BÁSICO</h3>
                </div>

                <div className="py-4 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ 149</span>
                    <span className="text-xs text-slate-500 font-bold">/ mês</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>Até 3 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>30 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>FPVs e CCTs: <strong>Limitado</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>Histórico e Telemetria: <strong>Básico</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Básico (R$ 149/mês)')}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-300 hover:bg-slate-100 text-slate-800 cursor-pointer"
                >
                  Escolher Básico
                </button>
              </div>
            </div>

            {/* PLANO PROFISSIONAL (PRO) */}
            <div className="p-8 rounded-2xl bg-white border-2 border-emerald-600 shadow-xl flex flex-col justify-between relative">
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                Mais Escolhido
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Prestadoras de serviços em expansão
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">PROFISSIONAL (PRO)</h3>
                </div>

                <div className="py-4 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ 299</span>
                    <span className="text-xs text-slate-500 font-bold">/ mês</span>
                  </div>
                  <span className="text-xs text-emerald-800 font-semibold block mt-1">
                    (R$ 429 /mês c/ WhatsApp integrado)
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-800 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>Até 10 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>150 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>FPVs e CCTs: <strong>Acesso Ilimitado</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>Histórico e Telemetria: <strong>Auditoria Completa de Logs</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>Alertas automáticos de <strong>Reajuste CLM</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Profissional PRO (R$ 299/mês)')}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Começar no Plano PRO
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* PLANO ENTERPRISE */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Grandes operações e filiais
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">ENTERPRISE</h3>
                </div>

                <div className="py-4 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">R$ 599</span>
                    <span className="text-xs text-slate-500 font-bold">/ mês</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>Até 100 usuários</strong> ativos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span><strong>400 buscas novas/mês</strong> no Google Places</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>FPVs e CCTs: <strong>Ilimitado + APIs liberadas</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check size={16} className="text-emerald-700 shrink-0" />
                    <span>Histórico e Telemetria: <strong>SLA Avançado e suporte 24/7</strong></span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button 
                  onClick={() => openDemoWithPlan('Plano Enterprise (R$ 599/mês)')}
                  className="w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-300 hover:bg-slate-100 text-slate-800 cursor-pointer"
                >
                  Falar com Consultor
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 13. GARANTIA INCONDICIONAL */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="p-8 md:p-10 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Shield size={36} />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900">
                Garantia de Adaptação de 14 Dias
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Se durante os primeiros 14 dias notar que o SmartBid não acelerou a montagem das suas propostas e não simplificou a leitura dos seus custos operacionais, basta solicitar o cancelamento. Devolvemos 100% do valor da assinatura, sem letras pequenas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. DEPOIMENTOS E ESTUDOS DE CASO (PROVA SOCIAL PROFUNDA) */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Prova Social no Mercado
          </span>

          <div className="p-8 md:p-12 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
            <p className="text-slate-800 text-lg md:text-xl font-medium leading-relaxed italic">
              "Antes do SmartBid, precisávamos de um dia inteiro para cruzar os benefícios do sindicato com a planilha de insumos. Hoje colocamos uma proposta completa de 50 postos na rua em menos de meia hora e com a certeza absoluta da margem de lucro."
            </p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Direção Comercial</p>
              <p className="text-xs text-slate-500 font-medium">Setor de Asseio, Conservação e Serviços Terceirizados</p>
            </div>
          </div>
        </div>
      </section>

      {/* 15. PERGUNTAS FREQUENTES (FAQ ESTRATÉGICO) */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
              Dúvidas Comuns
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-slate-600 text-base font-normal">
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
                resposta: 'Sim. A partir do preenchimento da mão de obra e insumos, o software projeta os impostos, os custos diretos e a margem bruta de cada mês do contrato.'
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
                  className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="font-bold text-slate-900 text-sm md:text-base">{faq.pergunta}</span>
                    <ChevronDown size={18} className={`text-slate-600 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-200/80 pt-3.5">
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
      <section className="py-24 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Pare de deixar margem de lucro na mesa e assuma o controle total da sua esteira comercial.
          </h2>
          
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Descubra como estruturar orçamentos seguros, fechar contratos mais rápido e proteger a saúde financeira da sua prestadora de serviços.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => openDemoWithPlan('Solicitar Demonstração Gratuita Final')}
              className="px-9 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center gap-3 cursor-pointer"
            >
              Solicitar Demonstração Gratuita do SmartBid
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 17. RODAPÉ CORPORATIVO E INFORMAÇÕES LEGAIS */}
      <footer className="py-12 bg-white border-t border-slate-200 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={16} />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 block leading-tight">
                  Smart<span className="text-emerald-700">Bid</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                  Inteligência para Prestadoras de Serviços
                </span>
              </div>
            </div>

            <div className="text-center md:text-right space-y-1">
              <p className="font-semibold text-slate-800">Suporte técnico corporativo • Curitiba/PR • Brasil</p>
              <p className="text-slate-500">Gestão analítica e formação de preço para prestadoras de serviços terceirizados.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500">
              © {new Date().getFullYear()} SmartBid • Todos os direitos reservados.
            </p>

            <div className="flex items-center gap-6 font-semibold uppercase tracking-wider text-[11px]">
              <a href="#" className="hover:text-slate-900 transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-900 transition-colors">Políticas de Privacidade</a>
              <span>•</span>
              <a href="mailto:suporte@smartbidhub.com.br" className="hover:text-slate-900 transition-colors">Central de Ajuda</a>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL DE AGENDAMENTO / DEMONSTRAÇÃO PRÁTICA */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <button 
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {!demoSuccess ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Demonstração Personalizada • 20 Minutos
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    Ver o SmartBid em Ação
                  </h3>
                  <p className="text-xs text-slate-500">
                    Interesse: <strong className="text-slate-800">{demoPlanName}</strong>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Seu Nome Completo *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Cristiano Silva"
                      value={demoForm.nome}
                      onChange={(e) => setDemoForm({ ...demoForm, nome: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      E-mail Corporativo *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="seuemail@suaempresa.com.br"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        WhatsApp com DDD *
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder="(41) 99999-9999"
                        value={demoForm.whatsapp}
                        onChange={(e) => setDemoForm({ ...demoForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Nome da Empresa *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Prime Terceirização e Serviços"
                        value={demoForm.empresa}
                        onChange={(e) => setDemoForm({ ...demoForm, empresa: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Porte da Operação
                    </label>
                    <select
                      value={demoForm.postos}
                      onChange={(e) => setDemoForm({ ...demoForm, postos: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-700 bg-white"
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
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Confirmar e Agendar Demonstração
                  </button>
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    Sem necessidade de cartão de crédito. Resposta imediata.
                  </p>
                </div>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle size={30} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Solicitação Recebida!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Redirecionando para o WhatsApp do nosso consultor executivo para alinhar a sua convenção coletiva ao vivo.
                </p>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold"
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
