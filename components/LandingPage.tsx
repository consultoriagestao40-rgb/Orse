'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, Lock, Menu, X, Minus,
  MessageSquare, Building2, Eye, TrendingUp
} from 'lucide-react';
import { getPlanConfigs } from '@/app/admin/empresas/actions';
import { displayFont, textFont } from '@/components/lp/fonts';
import '@/components/lp/lp.css';

// Paleta: papel quente, tinta escura e um único verde (o mesmo do sistema)
const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#5B6470',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
};

// Títulos: sans-serif firme, negrito e com espaçamento justo (autoridade, sem itálico)
const serif: React.CSSProperties = { fontFamily: 'var(--font-lp-text)', fontWeight: 700, letterSpacing: '-0.035em' };

// Número que conta de 0 até o valor quando entra na tela (ex.: "R$ 1,2 bi", "127×", "100%")
function CountUp({ value }: { value: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const match = value.match(/(\d+(?:,\d+)?)/);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    const target = parseFloat(match[1].replace(',', '.'));
    const decimals = match[1].includes(',') ? match[1].split(',')[1].length : 0;
    const fmt = (n: number) => value.replace(match[1], n.toFixed(decimals).replace('.', ','));
    if (el.getBoundingClientRect().top < window.innerHeight) return; // já visível: não anima
    setDisplay(fmt(0));
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1600;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        setDisplay(fmt(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

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

  // --- ESTADOS INTERATIVOS DO VISUAL HERO ---
  const [heroTab, setHeroTab] = useState<'propostaLink' | 'telemetria' | 'radar' | 'dre'>('propostaLink');
  // Abas do produto giram sozinhas até o visitante interagir
  const [autoTabs, setAutoTabs] = useState(true);
  useEffect(() => {
    if (!autoTabs) return;
    const order = ['propostaLink', 'telemetria', 'radar', 'dre'] as const;
    const id = setTimeout(() => {
      setHeroTab(prev => order[(order.indexOf(prev) + 1) % order.length]);
    }, 6500);
    return () => clearTimeout(id);
  }, [autoTabs, heroTab]);
  const [clientProposalSubTab, setClientProposalSubTab] = useState<'postos' | 'fpv' | 'minuta' | 'apresentacao'>('postos');
  const [clientAccepted, setClientAccepted] = useState(false);
  const [interactiveBdi, setInteractiveBdi] = useState(14.5);

  // Expansão/colapso das contas da DRE simulada (igual ao sistema)
  const [dreExpanded, setDreExpanded] = useState<Record<string, boolean>>({ '01': false, '02': false, '03': true });
  const toggleDreRow = (id: string) => setDreExpanded(prev => ({ ...prev, [id]: !prev[id] }));

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

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- SISTEMA DE MOVIMENTO ---
  const rootRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // 1) Progresso de leitura + mockup 3D que "deita" conforme rola
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        root.style.setProperty('--lp-progress', String(max > 0 ? window.scrollY / max : 0));
        const prod = document.getElementById('produto');
        if (prod) {
          const r = prod.getBoundingClientRect();
          const t = Math.max(0, Math.min(1, (r.top - window.innerHeight * 0.15) / (window.innerHeight * 0.55)));
          prod.style.setProperty('--tilt', t.toFixed(3));
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // 2) Revelação ao rolar: só marca o que está abaixo da dobra (sem piscar o que já está visível)
    const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.95;
    const targets: Element[] = [];
    root.querySelectorAll('section h2, [data-reveal]').forEach(el => {
      if (!below(el)) return;
      el.classList.add(el.hasAttribute('data-reveal-scale') ? 'lp-reveal-scale' : 'lp-reveal');
      targets.push(el);
    });
    root.querySelectorAll('[data-stagger]').forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        if (!below(child)) return;
        child.classList.add('lp-reveal');
        (child as HTMLElement).style.setProperty('--d', `${Math.min(i, 6) * 90}ms`);
        targets.push(child);
      });
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t => io.observe(t));

    // 3) Spotlight que segue o mouse em cartões e na faixa verde
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('.lp-card, [data-spot]') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    root.addEventListener('pointermove', onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.removeEventListener('pointermove', onMove);
      io.disconnect();
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
  const custoEncargos = 13383.52; // 71,80% CCT SIEMACO
  const custoBeneficios = 4750.00; // VT líq + VR + Cesta Básica
  const custoSSMA = 820.00; // EPIs + PCMSO
  const custoInsumos = 1150.00; // Químicos hospitalares
  const custoEquipamentos = 650.00; // Depreciação / Locação
  const baseCost = custoSalarios + custoEncargos + custoBeneficios + custoSSMA + custoInsumos + custoEquipamentos;

  const tributosRate = 0.125; // 12,50% (PIS, COFINS, ISSQN, CPRB)
  const calcPrecoVenda = baseCost / (1 - (tributosRate + interactiveBdi / 100));
  const calcTributos = calcPrecoVenda * tributosRate;
  const calcReceitaLiquida = calcPrecoVenda - calcTributos;
  const calcMargemBruta = calcReceitaLiquida - baseCost;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const pct = (v: number) => `${((v / calcPrecoVenda) * 100).toFixed(1)}%`;

  const navLinks = [
    { href: '#proposta-interativa', label: 'Proposta por link' },
    { href: '#funcionalidades', label: 'Funcionalidades' },
    { href: '#qualificacao', label: 'Para quem é' },
    { href: '#planos', label: 'Planos' },
    { href: '#faq', label: 'Dúvidas' },
  ];

  const heroTabs: { id: typeof heroTab; label: string }[] = [
    { id: 'propostaLink', label: 'Link da proposta' },
    { id: 'telemetria', label: 'Rastreio de leitura' },
    { id: 'radar', label: 'Radar comercial' },
    { id: 'dre', label: 'DRE do projeto' },
  ];

  const custoLinhas = [
    { cod: '03.1', nome: 'Salários e remuneração', det: 'Piso CCT SIEMACO + insalubridade 40% + adicional noturno', val: custoSalarios },
    { cod: '03.2', nome: 'Encargos sociais (71,80%)', det: 'FGTS, 13º, férias + 1/3, FGTS rescisório, INSS', val: custoEncargos },
    { cod: '03.3', nome: 'Benefícios', det: 'VT líquido (desc. 6%), VR, cesta básica', val: custoBeneficios },
    { cod: '03.5', nome: 'SSMA', det: 'EPIs e exames periódicos (PCMSO)', val: custoSSMA },
    { cod: '03.6', nome: 'Materiais', det: 'Materiais de limpeza e higiene hospitalar', val: custoInsumos },
    { cod: '03.7', nome: 'Equipamentos', det: 'Depreciação / locação de lavadoras e aspiradores', val: custoEquipamentos },
  ];

  return (
    <div
      ref={rootRef}
      className={`lp-root ${displayFont.variable} ${textFont.variable} min-h-screen antialiased selection:bg-[#1B4D3E] selection:text-white`}
      style={{ background: C.paper, color: C.ink, fontFamily: 'var(--font-lp-text)' }}
    >
      <div className="lp-progress" aria-hidden />

      {/* HEADER */}
      <header className={`lp-header fixed top-0 left-0 right-0 z-50 px-3 ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-header-inner max-w-[1200px] mx-auto px-6 h-[68px] flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2 cursor-pointer">
            <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: C.green }}>
              <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">SmartBid</span>
          </button>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="lp-navlink text-[14px] hover:text-[#111418] transition-colors" style={{ color: C.muted }}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <a href="/login" className="text-[14px] hover:text-[#111418] transition-colors" style={{ color: C.muted }}>Entrar</a>
            <a
              id="header-teste-gratis"
              href="/cadastro"
              className="lp-btn lp-btn-dark text-[14px] font-semibold text-white px-4 py-2 rounded-full"
              style={{ background: C.green }}
            >
              Testar grátis por 7 dias
            </a>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 cursor-pointer" aria-label="Menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col" style={{ background: C.paper, borderColor: C.line }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="py-3 text-[15px] border-b" style={{ borderColor: C.line }}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-4">
              <a href="/login" className="flex-1 text-center py-2.5 rounded-full border text-[14px]" style={{ borderColor: C.line }}>Entrar</a>
              <a
                href="/cadastro"
                className="flex-1 text-center py-2.5 rounded-full text-white text-[14px] font-semibold"
                style={{ background: C.green }}
              >
                Teste grátis
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="pt-[76px]">
        {/* Faixa verde de autoridade */}
        <div className="px-3 sm:px-5">
          <div
            data-spot
            className="relative overflow-hidden rounded-[28px] text-white text-center px-6 pt-20 md:pt-24 pb-[220px] md:pb-[300px]"
            style={{ background: C.green }}
          >
            {/* luz em movimento */}
            <div className="lp-aurora lp-aurora-a" aria-hidden />
            <div className="lp-aurora lp-aurora-b" aria-hidden />
            <div className="lp-aurora lp-aurora-c" aria-hidden />
            <div className="lp-band-spot" aria-hidden />
            {/* textura sutil de linhas para dar profundidade */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'linear-gradient(to bottom, black, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)' }}
            />
            <div className="relative max-w-[980px] mx-auto">
              <p className="lp-enter inline-flex items-center gap-2 text-[14px] font-medium text-white/80 mb-6" style={{ '--d': '0ms' } as React.CSSProperties}>
                <span className="lp-live w-1.5 h-1.5 rounded-full bg-[#9FD3BC]" />
                Plataforma para prestadoras de serviços terceirizados
              </p>
              <h1 className="text-[38px] sm:text-[52px] lg:text-[64px] leading-[1.03]" style={{ ...serif, fontWeight: 800 }}>
                {'Transforme a sua prestadora de serviços numa máquina de contratos previsíveis'.split(' ').map((w, i) => (
                  <React.Fragment key={i}>
                    <span className="lp-word" style={{ '--d': `${120 + i * 55}ms` } as React.CSSProperties}>{w}</span>{' '}
                  </React.Fragment>
                ))}
              </h1>
              <p className="lp-enter mt-6 text-[17px] md:text-[19px] leading-[1.55] text-white/75 max-w-[760px] mx-auto" style={{ '--d': '750ms' } as React.CSSProperties}>
                Da prospecção de grandes contas à blindagem de margem e reajustes automáticos. Prospecção de decisores, custos por CCT, proposta rastreada e reajustes anuais numa só plataforma.
              </p>
              <div className="lp-enter mt-10 flex flex-col sm:flex-row items-center justify-center gap-3" style={{ '--d': '900ms' } as React.CSSProperties}>
                <a
                  id="hero-teste-gratis"
                  href="/cadastro"
                  className="lp-btn lp-pulse group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[15px] font-semibold px-6 py-3.5 rounded-xl"
                  style={{ color: C.green }}
                >
                  Começar teste grátis de 7 dias
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <button
                  onClick={() => openDemoWithPlan('Demonstração Prática 20 Min')}
                  className="lp-btn lp-btn-dark lp-btn-ghost w-full sm:w-auto inline-flex items-center justify-center text-[15px] font-semibold px-6 py-3.5 rounded-xl border border-white/40 text-white cursor-pointer hover:bg-white/10"
                >
                  Agendar demonstração
                </button>
              </div>
              <p className="lp-enter mt-5 text-[13px] text-white/60" style={{ '--d': '1050ms' } as React.CSSProperties}>
                Crie a conta em 2 minutos · sem cartão de crédito · acesso completo durante o teste
              </p>
            </div>
          </div>
        </div>

        <div className="lp-stage lp-enter max-w-[1140px] mx-auto px-6 -mt-[180px] md:-mt-[250px] relative z-10" style={{ '--d': '1100ms' } as React.CSSProperties}>
          {/* PRODUTO */}
          <div id="produto" className="lp-tilt rounded-[22px] p-2 sm:p-2.5 bg-white/60 backdrop-blur-sm border border-white/70 shadow-[0_40px_80px_-30px_rgba(17,20,24,0.35)]">
            <div className="bg-white rounded-[18px] border overflow-hidden shadow-[0_1px_0_rgba(17,20,24,0.04),0_30px_60px_-30px_rgba(27,77,62,0.35)]" style={{ borderColor: '#DCE5DF' }}>
              {/* Barra do app */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b" style={{ borderColor: C.line }}>
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E2DC]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E2DC]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E5E2DC]" />
                  </div>
                  <span className="text-[12px] flex items-center gap-1.5" style={{ color: C.muted }}>
                    <Lock size={11} /> app.smartbidhub.com.br
                  </span>
                </div>
                <div className="flex overflow-x-auto px-3">
                  {heroTabs.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setAutoTabs(false); setHeroTab(t.id); }}
                      className="relative px-3 py-3.5 text-[13px] whitespace-nowrap cursor-pointer transition-colors hover:text-[#111418]"
                      style={{ color: heroTab === t.id ? C.ink : C.muted, fontWeight: heroTab === t.id ? 600 : 400 }}
                    >
                      {t.label}
                      {heroTab === t.id && (
                        <span className="absolute left-3 right-3 -bottom-px h-[2px] overflow-hidden rounded" style={{ background: autoTabs ? '#DCE5DF' : C.green }}>
                          {autoTabs && <span key={heroTab} className="lp-tab-progress block h-full" style={{ background: C.green }} />}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lp-tab-panel p-5 sm:p-7 min-h-[440px]" style={{ background: '#FCFCFB' }} onPointerDown={() => setAutoTabs(false)}>

                {/* ABA: LINK DA PROPOSTA (o que o cliente vê) */}
                {heroTab === 'propostaLink' && (
                  <div className="grid lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-5">
                      <div className="flex items-center justify-between gap-3 text-[12px] px-3 py-2 rounded-lg border bg-white" style={{ borderColor: C.line }}>
                        <span className="truncate" style={{ color: C.muted }}>
                          <Lock size={11} className="inline mr-1.5 -mt-0.5" />
                          smartbidhub.com.br/proposta/ver/<span style={{ color: C.ink }}>ct-892-hospital-sao-lucas</span>
                        </span>
                        <span className="shrink-0 font-medium" style={{ color: C.green }}>● Link ativo</span>
                      </div>

                      <div>
                        <p className="text-[12px]" style={{ color: C.muted }}>Aliança Serviços Terceirizados · Proposta comercial</p>
                        <h4 className="text-[26px] leading-tight mt-1" style={serif}>Asseio, higienização e apoio operacional</h4>
                        <p className="text-[13px] mt-1" style={{ color: C.muted }}>Hospital Geral São Lucas · vigência de 12 meses</p>
                      </div>

                      <div className="flex gap-5 border-b text-[13px] overflow-x-auto" style={{ borderColor: C.line }}>
                        {[
                          { id: 'postos', label: 'Postos e escala' },
                          { id: 'fpv', label: 'Planilha de custos (FPV)' },
                          { id: 'minuta', label: 'Minuta' },
                          { id: 'apresentacao', label: 'Apresentação' },
                        ].map(s => (
                          <button
                            key={s.id}
                            onClick={() => setClientProposalSubTab(s.id as any)}
                            className="relative pb-2.5 whitespace-nowrap cursor-pointer"
                            style={{ color: clientProposalSubTab === s.id ? C.ink : C.muted, fontWeight: clientProposalSubTab === s.id ? 600 : 400 }}
                          >
                            {s.label}
                            {clientProposalSubTab === s.id && <span className="absolute left-0 right-0 -bottom-px h-[2px]" style={{ background: C.ink }} />}
                          </button>
                        ))}
                      </div>

                      {clientProposalSubTab === 'postos' && (
                        <div className="divide-y text-[13px]" style={{ borderColor: C.line }}>
                          {[
                            { q: '18', cargo: 'Auxiliar de limpeza hospitalar', esc: '12x36 diurno e noturno · insalubridade 40%', v: 'R$ 38.880,00' },
                            { q: '4', cargo: 'Encarregado operacional', esc: '44h semanais · coordenação e controle de EPIs', v: 'R$ 10.020,00' },
                          ].map(r => (
                            <div key={r.cargo} className="flex items-center justify-between py-3.5 gap-4" style={{ borderColor: C.line }}>
                              <div className="flex items-center gap-4">
                                <span className="w-9 text-[20px] tabular-nums" style={serif}>{r.q}×</span>
                                <div>
                                  <p className="font-medium">{r.cargo}</p>
                                  <p style={{ color: C.muted }}>{r.esc}</p>
                                </div>
                              </div>
                              <span className="tabular-nums font-medium">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {clientProposalSubTab === 'fpv' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden border text-[13px]" style={{ background: C.line, borderColor: C.line }}>
                          {[
                            ['Salário + adicionais', 'R$ 25.420,00'],
                            ['Encargos (71,8%)', 'R$ 18.251,56'],
                            ['Benefícios', 'R$ 6.320,00'],
                            ['Insumos e uniformes', 'R$ 2.450,00'],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-white p-3.5">
                              <p className="text-[12px]" style={{ color: C.muted }}>{k}</p>
                              <p className="font-medium tabular-nums mt-1">{v}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {clientProposalSubTab === 'minuta' && (
                        <div className="text-[13px] leading-relaxed">
                          <p className="font-medium">Cláusula 5ª — Do reajuste anual e repasse sindical</p>
                          <p className="mt-1.5" style={{ color: C.muted }}>
                            Os valores contratados serão reajustados anualmente na data-base da categoria (maio/2026), mediante repasse integral do dissídio homologado pela convenção coletiva.
                          </p>
                        </div>
                      )}

                      {clientProposalSubTab === 'apresentacao' && (
                        <div className="flex items-center gap-3 text-[13px]">
                          <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: C.greenSoft, color: C.green }}>
                            <Building2 size={18} />
                          </span>
                          <div>
                            <p className="font-medium">Aliança Serviços Terceirizados</p>
                            <p style={{ color: C.muted }}>850 postos ativos · 14 anos de mercado · atendimento 24/7</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <aside className="lg:col-span-4 rounded-xl border bg-white p-5 flex flex-col justify-between" style={{ borderColor: C.line }}>
                      <div>
                        <p className="text-[12px]" style={{ color: C.muted }}>Valor mensal</p>
                        <p className="text-[38px] leading-none mt-2 tabular-nums" style={serif}>R$ 48.900</p>
                        <p className="text-[12px] mt-2" style={{ color: C.muted }}>22 postos · CCT SIEMACO vinculada</p>
                      </div>
                      <div className="mt-6 space-y-2.5">
                        <button
                          onClick={() => setClientAccepted(!clientAccepted)}
                          className="w-full py-2.5 rounded-lg text-[14px] font-medium text-white cursor-pointer transition-colors"
                          style={{ background: clientAccepted ? C.ink : C.green }}
                        >
                          {clientAccepted ? 'Proposta aprovada ✓' : 'Aprovar proposta'}
                        </button>
                        <a
                          href="https://wa.me/5541999999999"
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 rounded-lg text-[14px] border flex items-center justify-center gap-2"
                          style={{ borderColor: C.line }}
                        >
                          <MessageSquare size={14} /> Falar no WhatsApp
                        </a>
                        <p className="text-[11px] leading-snug pt-1" style={{ color: C.muted }}>
                          {clientAccepted
                            ? 'Aceite registrado com IP, data e horário. O contrato já entra na esteira de implantação.'
                            : 'O cliente aprova online, sem imprimir nem assinar papel.'}
                        </p>
                      </div>
                    </aside>
                  </div>
                )}

                {/* ABA: RASTREIO DE LEITURA */}
                {heroTab === 'telemetria' && (
                  <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4">
                      <p className="text-[12px] flex items-center gap-2" style={{ color: C.green }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
                        Cliente visualizando agora
                      </p>
                      <h4 className="text-[26px] leading-tight mt-2" style={serif}>Hospital São Lucas</h4>
                      <p className="text-[13px]" style={{ color: C.muted }}>Proposta #SB-2026-89 · 22 postos</p>
                      <div className="mt-8">
                        <p className="text-[72px] leading-none tabular-nums" style={serif}>127</p>
                        <p className="text-[13px] mt-2" style={{ color: C.muted }}>acessos registrados nos últimos 9 dias</p>
                      </div>
                    </div>
                    <div className="lg:col-span-8">
                      <p className="text-[12px] mb-3" style={{ color: C.muted }}>Tempo e leituras por seção</p>
                      <div className="space-y-5">
                        {[
                          { s: 'Planilha de custos (FPV)', d: 'Pisos, benefícios e encargos da CCT', v: 58, t: '45 min' },
                          { s: 'Minuta contratual', d: 'Repasse, rescisão e data-base', v: 42, t: '31 min' },
                          { s: 'Apresentação e escopo', d: 'Serviços e certificações', v: 27, t: '18 min' },
                        ].map(r => (
                          <div key={r.s}>
                            <div className="flex justify-between text-[13px]">
                              <span className="font-medium">{r.s}</span>
                              <span className="tabular-nums" style={{ color: C.muted }}>{r.v} visualizações · {r.t}</span>
                            </div>
                            <div className="h-2 rounded-full mt-2" style={{ background: '#EFEDE8' }}>
                              <div className="h-2 rounded-full" style={{ width: `${(r.v / 58) * 100}%`, background: C.green }} />
                            </div>
                            <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>{r.d}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-7 rounded-lg px-4 py-3 text-[13px] flex items-start gap-2.5" style={{ background: '#FBF6EA', color: '#6B4E12' }}>
                        <Eye size={15} className="mt-0.5 shrink-0" />
                        A planilha de custos foi reaberta 11 vezes hoje. Bom momento para ligar.
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: RADAR COMERCIAL */}
                {heroTab === 'radar' && (
                  <div>
                    <div className="grid sm:grid-cols-3 gap-px rounded-xl overflow-hidden border" style={{ background: C.line, borderColor: C.line }}>
                      <div className="bg-white p-5">
                        <p className="text-[12px]" style={{ color: C.muted }}>Faturamento aceito em setembro</p>
                        <p className="text-[32px] leading-tight mt-1 tabular-nums" style={serif}>R$ 108.774</p>
                        <p className="text-[12px]" style={{ color: C.muted }}>11 contratos convertidos</p>
                      </div>
                      <div className="bg-white p-5">
                        <p className="text-[12px]" style={{ color: C.muted }}>Meta da equipe</p>
                        <p className="text-[32px] leading-tight mt-1 tabular-nums" style={serif}>36,3%</p>
                        <div className="h-1.5 rounded-full mt-2" style={{ background: '#EFEDE8' }}>
                          <div className="h-1.5 rounded-full" style={{ width: '36.3%', background: C.green }} />
                        </div>
                        <p className="text-[12px] mt-2" style={{ color: C.muted }}>de R$ 300.000</p>
                      </div>
                      <div className="bg-white p-5">
                        <p className="text-[12px]" style={{ color: C.muted }}>Volume em propostas no radar</p>
                        <p className="text-[32px] leading-tight mt-1 tabular-nums" style={serif}>R$ 1,28 bi</p>
                        <p className="text-[12px]" style={{ color: C.muted }}>191 oportunidades</p>
                      </div>
                    </div>

                    <p className="text-[12px] mt-8 mb-3" style={{ color: C.muted }}>Funil comercial</p>
                    <div className="space-y-2">
                      {[
                        { n: 'Leads', v: 191, w: 100, s: 'base mapeada' },
                        { n: 'Contatos', v: 39, w: 20.4, s: '20,4% de avanço' },
                        { n: 'Visitas', v: 23, w: 12, s: '59,0% de avanço' },
                        { n: 'Propostas', v: 75, w: 39.3, s: 'emitidas' },
                        { n: 'Vendas', v: 11, w: 5.8, s: '14,7% de fechamento' },
                      ].map(f => (
                        <div key={f.n} className="grid grid-cols-12 items-center gap-3 text-[13px]">
                          <span className="col-span-3 sm:col-span-2">{f.n}</span>
                          <div className="col-span-6 sm:col-span-7 h-7 rounded-md" style={{ background: '#F2F0EB' }}>
                            <div className="h-7 rounded-md" style={{ width: `${Math.max(f.w, 4)}%`, background: f.n === 'Vendas' ? C.green : '#B9CCC2' }} />
                          </div>
                          <span className="col-span-3 text-right tabular-nums">
                            <span className="font-medium">{f.v}</span>
                            <span className="hidden sm:inline" style={{ color: C.muted }}> · {f.s}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ABA: DRE DO PROJETO (mesma estrutura do sistema) */}
                {heroTab === 'dre' && (
                  <div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-5">
                      <div>
                        <p className="text-[12px]" style={{ color: C.muted }}>DRE do projeto · Hospital Geral São Lucas · 22 postos</p>
                        <p className="text-[40px] leading-none mt-2 tabular-nums" style={serif}>
                          {formatCurrency(calcMargemBruta)}
                          <span className="text-[15px] ml-2" style={{ ...serif, color: C.muted }}>margem bruta / mês</span>
                        </p>
                      </div>
                      <div className="w-full md:w-80">
                        <div className="flex justify-between text-[12px] mb-2">
                          <span style={{ color: C.muted }}>Margem desejada</span>
                          <span className="font-medium tabular-nums">{interactiveBdi.toFixed(1)}%</span>
                        </div>
                        <input
                          type="range" min="8" max="25" step="0.5"
                          value={interactiveBdi}
                          onChange={(e) => setInteractiveBdi(parseFloat(e.target.value))}
                          className="w-full cursor-pointer accent-[#1B4D3E]"
                          aria-label="Margem desejada"
                        />
                        <p className="text-[11px] mt-1" style={{ color: C.muted }}>Arraste para recalcular preço, tributos e margem.</p>
                      </div>
                    </div>

                    <div className="rounded-xl border bg-white overflow-x-auto" style={{ borderColor: C.line }}>
                      <table className="w-full text-[13px] min-w-[620px]">
                        <thead>
                          <tr className="text-left text-[11px] uppercase tracking-wide border-b" style={{ color: C.muted, borderColor: C.line }}>
                            <th className="font-medium px-4 py-3">Estrutura DRE</th>
                            <th className="font-medium px-4 py-3 text-right">Mensal</th>
                            <th className="font-medium px-4 py-3 text-right">% receita</th>
                            <th className="font-medium px-4 py-3 text-right">Anual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* 01 RECEITA */}
                          <tr className="border-b cursor-pointer hover:bg-[#FAFAF8]" style={{ borderColor: C.line }} onClick={() => toggleDreRow('01')}>
                            <td className="px-4 py-3 font-semibold">
                              <ChevronDown size={14} className={`inline mr-2 transition-transform ${dreExpanded['01'] ? '' : '-rotate-90'}`} style={{ color: C.muted }} />
                              01. Receita bruta
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(calcPrecoVenda)}</td>
                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.muted }}>100,0%</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(calcPrecoVenda * 12)}</td>
                          </tr>
                          {dreExpanded['01'] && (
                            <tr className="border-b" style={{ borderColor: C.line }}>
                              <td className="pl-11 pr-4 py-2.5" style={{ color: C.muted }}>01.1.1 Serviços vendidos (22 postos)</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(calcPrecoVenda)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: C.muted }}>100,0%</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(calcPrecoVenda * 12)}</td>
                            </tr>
                          )}

                          {/* 02 TRIBUTOS */}
                          <tr className="border-b cursor-pointer hover:bg-[#FAFAF8]" style={{ borderColor: C.line }} onClick={() => toggleDreRow('02')}>
                            <td className="px-4 py-3 font-semibold">
                              <ChevronDown size={14} className={`inline mr-2 transition-transform ${dreExpanded['02'] ? '' : '-rotate-90'}`} style={{ color: C.muted }} />
                              02. Tributos sobre faturamento
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#9A3B2E]">−{formatCurrency(calcTributos)}</td>
                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.muted }}>12,5%</td>
                            <td className="px-4 py-3 text-right tabular-nums text-[#9A3B2E]">−{formatCurrency(calcTributos * 12)}</td>
                          </tr>
                          {dreExpanded['02'] && [
                            ['02.1.1 ISSQN (5,00%)', 0.05],
                            ['02.1.2 PIS e COFINS (3,65%)', 0.0365],
                            ['02.1.3 CPRB (3,85%)', 0.0385],
                          ].map(([n, r]) => (
                            <tr key={n as string} className="border-b" style={{ borderColor: C.line }}>
                              <td className="pl-11 pr-4 py-2.5" style={{ color: C.muted }}>{n}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">−{formatCurrency(calcPrecoVenda * (r as number))}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: C.muted }}>{((r as number) * 100).toFixed(1).replace('.', ',')}%</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">−{formatCurrency(calcPrecoVenda * (r as number) * 12)}</td>
                            </tr>
                          ))}

                          {/* RECEITA LÍQUIDA */}
                          <tr className="border-b" style={{ borderColor: C.line, background: '#F7F6F2' }}>
                            <td className="px-4 py-3 font-semibold pl-10">(=) Receita líquida</td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(calcReceitaLiquida)}</td>
                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.muted }}>87,5%</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(calcReceitaLiquida * 12)}</td>
                          </tr>

                          {/* 03 CUSTO OPERACIONAL */}
                          <tr className="border-b cursor-pointer hover:bg-[#FAFAF8]" style={{ borderColor: C.line }} onClick={() => toggleDreRow('03')}>
                            <td className="px-4 py-3 font-semibold">
                              <ChevronDown size={14} className={`inline mr-2 transition-transform ${dreExpanded['03'] ? '' : '-rotate-90'}`} style={{ color: C.muted }} />
                              03. Custo operacional
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-semibold">−{formatCurrency(baseCost)}</td>
                            <td className="px-4 py-3 text-right tabular-nums" style={{ color: C.muted }}>{pct(baseCost)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">−{formatCurrency(baseCost * 12)}</td>
                          </tr>
                          {dreExpanded['03'] && custoLinhas.map(l => (
                            <tr key={l.cod} className="border-b" style={{ borderColor: C.line }}>
                              <td className="pl-11 pr-4 py-2.5">
                                <span>{l.cod} {l.nome}</span>
                                <span className="block text-[11px]" style={{ color: C.muted }}>{l.det}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums">−{formatCurrency(l.val)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: C.muted }}>{pct(l.val)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums">−{formatCurrency(l.val * 12)}</td>
                            </tr>
                          ))}

                          {/* MARGEM BRUTA */}
                          <tr style={{ background: C.greenSoft }}>
                            <td className="px-4 py-3.5 font-semibold pl-10" style={{ color: C.green }}>(=) Margem bruta</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-semibold" style={{ color: C.green }}>{formatCurrency(calcMargemBruta)}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-semibold" style={{ color: C.green }}>{interactiveBdi.toFixed(1)}%</td>
                            <td className="px-4 py-3.5 text-right tabular-nums font-semibold" style={{ color: C.green }}>{formatCurrency(calcMargemBruta * 12)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[12px] mt-3" style={{ color: C.muted }}>Clique nas contas para abrir o detalhamento. A DRE recalcula sozinha quando você adiciona postos ou insumos.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="pt-20 md:pt-24 pb-4">
        <div className="max-w-[1140px] mx-auto px-6">
          <p className="text-center text-[15px] font-medium mb-10" style={{ color: C.muted }}>
            Usado por prestadoras de serviços de limpeza, portaria, vigilância e manutenção
          </p>
          <div data-stagger className="grid grid-cols-2 lg:grid-cols-4 gap-y-10">
            {[
              ['R$ 1,2 bi', 'em propostas gerenciadas'],
              ['100%', 'das CCTs parametrizadas'],
              ['127×', 'acessos rastreados numa proposta'],
              ['7 dias', 'grátis para testar tudo'],
            ].map(([n, l], i) => (
              <div key={n} className={`text-center px-4 ${i > 0 ? 'lg:border-l' : ''} ${i % 2 === 1 ? 'border-l lg:border-l' : ''}`} style={{ borderColor: C.line }}>
                <p className="text-[44px] md:text-[52px] leading-none tabular-nums" style={{ ...serif, fontWeight: 800, color: C.ink }}><CountUp value={n} /></p>
                <p className="text-[14px] mt-3 font-medium" style={{ color: C.muted }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Letreiro contínuo de segmentos atendidos */}
        <div className="lp-marquee mt-20 border-y py-5 overflow-hidden" style={{ borderColor: C.line }} aria-hidden>
          <div className="lp-marquee-track">
            {[0, 1].map(k => (
              <div key={k} className="flex items-center shrink-0">
                {['Asseio e conservação', 'Portaria', 'Vigilância patrimonial', 'Limpeza hospitalar', 'Manutenção predial', 'Jardinagem', 'Recepção', 'Copeiragem', 'Apoio operacional', 'Facilities industrial'].map(s => (
                  <span key={s} className="flex items-center gap-10 pr-10 text-[20px] md:text-[24px] whitespace-nowrap" style={{ ...serif, fontWeight: 700, color: '#B9B3A8' }}>
                    {s}
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="text-[14px] mb-4" style={{ color: C.muted }}>O dia a dia de quem vende terceirização</p>
              <h2 className="text-[40px] md:text-[48px] leading-[1.05]" style={serif}>
                Se você toca uma prestadora de serviços, já viveu pelo menos três destas situações.
              </h2>
            </div>
          </div>
          <div className="lg:col-span-7">
            {[
              {
                t: 'O comercial perde horas procurando quem decide',
                d: 'O vendedor liga para a recepção o dia todo e não chega em quem assina. Energia gasta em listas frias, sem contexto.',
                i: 'Prospecção lenta e sem previsibilidade',
              },
              {
                t: 'A planilha de custos é um risco silencioso',
                d: 'Uma fórmula errada nos encargos da CCT, ou um reflexo de benefício esquecido, come meses de margem sem ninguém perceber.',
                i: 'Prejuízo escondido em contratos vigentes',
              },
              {
                t: 'Depois que o PDF sai, ninguém sabe de nada',
                d: 'A proposta vai por e-mail e some. Não dá para saber se o cliente abriu, se o financeiro analisou ou se foi ignorada.',
                i: 'Follow-up no escuro e timing perdido',
              },
              {
                t: 'O reajuste passa e a conta fica com você',
                d: 'O contrato roda, a data-base do sindicato vence e o repasse não é pedido a tempo. O dissídio sai do seu caixa.',
                i: 'Margem perdida por falta de repasse',
              },
            ].map((p, idx) => (
              <div key={p.t} data-reveal className="lp-problem grid grid-cols-[48px_1fr] gap-4 py-8 border-t first:border-t-0 first:pt-0" style={{ borderColor: C.line }}>
                <span className="lp-problem-n text-[13px] tabular-nums pt-1.5 font-semibold" style={{ color: C.muted }}>0{idx + 1}</span>
                <div>
                  <h3 className="text-[22px] font-semibold tracking-tight leading-snug">{p.t}</h3>
                  <p className="text-[16px] leading-[1.65] mt-2" style={{ color: C.muted }}>{p.d}</p>
                  <p className="text-[13px] mt-3 text-[#9A3B2E]">→ {p.i}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="solucao" className="py-24 md:py-28 text-white" style={{ background: C.green }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-[14px] text-white/60 mb-6">O que é o SmartBid</p>
          <p className="text-[30px] md:text-[40px] leading-[1.18] max-w-[980px]" style={{ ...serif, fontWeight: 600, letterSpacing: '-0.025em' }}>
            Uma esteira única, feita para a realidade de prestadoras de limpeza, portaria, segurança e apoio operacional.
            <span className="text-white/55"> Não é um CRM genérico: ela conduz a operação do primeiro contato com o decisor até cada reajuste e aditivo do contrato.</span>
          </p>

          <div data-stagger className="mt-16 grid sm:grid-cols-2 lg:grid-cols-5 gap-y-8 border-t border-white/15 pt-8">
            {[
              ['Prospecção', 'Decisores via Google Places'],
              ['Custos', 'Multi-CCT, encargos e benefícios'],
              ['DRE', 'Margem por contrato, ao centavo'],
              ['Proposta por link', 'Rastreio e aceite online'],
              ['Contratos', 'Vigência e alerta de reajuste'],
            ].map(([t, d], i) => (
              <div key={t} className="pr-6">
                <p className="text-[13px] text-white/50 tabular-nums">0{i + 1}</p>
                <p className="text-[17px] font-medium mt-2">{t}</p>
                <p className="text-[14px] text-white/60 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[720px] mb-16">
            <p className="text-[14px] mb-4" style={{ color: C.muted }}>Como funciona</p>
            <h2 className="text-[40px] md:text-[52px] leading-[1.05]" style={serif}>Cinco etapas conectadas, do primeiro contato ao reajuste.</h2>
          </div>

          <div data-stagger className="space-y-6">
            {[
              {
                n: '01', tag: 'Prospecção',
                t: 'Encontre hospitais, condomínios e indústrias, e chegue em quem decide',
                d: 'Busque empresas de grande porte direto no Google Places e jogue no funil com um clique. Telefone e e-mail de compras e RH, sem lista fria.',
                v: (
                  <div className="space-y-2 text-[13px]">
                    {[
                      ['Hospital e Maternidade Regional', 'Compras · (41) 3300-0000'],
                      ['Condomínio Residencial Alto da XV', 'Síndico profissional · 32 postos'],
                      ['Indústria Metalúrgica Campo Largo', 'RH · 3 turnos'],
                    ].map(([a, b], i) => (
                      <div key={a} className="lp-chip flex items-center justify-between bg-white border rounded-lg px-3.5 py-3" style={{ borderColor: C.line }}>
                        <div>
                          <p className="font-medium">{a}</p>
                          <p style={{ color: C.muted }}>{b}</p>
                        </div>
                        <span className="text-[12px] px-2 py-1 rounded-md" style={i === 0 ? { background: C.greenSoft, color: C.green } : { color: C.muted }}>
                          {i === 0 ? 'No funil' : '+ Adicionar'}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: '02', tag: 'Custos por CCT',
                t: 'Convenções de qualquer estado, com encargos e benefícios calculados sozinhos',
                d: 'Cadastre CCTs por região (SIEMACO e outras). Vale-transporte com desconto legal, VR, exames e provisões de férias saem certos em toda proposta.',
                v: (
                  <div className="bg-white border rounded-lg text-[13px] divide-y" style={{ borderColor: C.line }}>
                    {[
                      ['CCT', 'SIEMACO 2026'],
                      ['Piso — auxiliar de limpeza', 'R$ 1.840,00'],
                      ['Insalubridade', '40% sobre salário mínimo'],
                      ['Encargos sociais', '71,80%'],
                      ['Vale-refeição', 'R$ 38,50 / dia'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between px-4 py-2.5" style={{ borderColor: C.line }}>
                        <span style={{ color: C.muted }}>{k}</span>
                        <span className="font-medium tabular-nums">{v}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: '03', tag: 'DRE do projeto',
                t: 'Saiba a margem do contrato antes de assinar',
                d: 'O sistema desconta os tributos do faturamento, soma os custos da escala e mostra a margem de cada mês do contrato — a mesma DRE que você viu lá em cima.',
                v: (
                  <div className="bg-white border rounded-lg p-4 text-[13px]" style={{ borderColor: C.line }}>
                    {[
                      ['Receita bruta', 'R$ 48.900,00', ''],
                      ['Tributos', '−R$ 6.112,50', 'text-[#9A3B2E]'],
                      ['Custo operacional', '−R$ 33.800,00', ''],
                    ].map(([k, v, c]) => (
                      <div key={k} className="flex justify-between py-2">
                        <span style={{ color: C.muted }}>{k}</span>
                        <span className={`tabular-nums ${c}`}>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-baseline pt-3 mt-1 border-t" style={{ borderColor: C.line }}>
                      <span className="font-medium">Margem bruta</span>
                      <span className="text-[26px] tabular-nums" style={{ ...serif, color: C.green }}>R$ 8.987,50</span>
                    </div>
                  </div>
                ),
              },
              {
                n: '04', tag: 'Proposta por link',
                t: 'O cliente abre um link, você recebe o aviso',
                d: 'Cada proposta vira uma página com a sua marca. Você vê quantas vezes ele abriu a planilha de custos e a minuta, e ele aprova online.',
                v: (
                  <div className="space-y-2 text-[13px]">
                    {[
                      ['Agora', 'Hospital São Lucas abriu a planilha de custos'],
                      ['há 2 h', 'Minuta encaminhada para o jurídico do cliente'],
                      ['ontem', 'Proposta aberta 6 vezes no mesmo dia'],
                    ].map(([t, m], i) => (
                      <div key={m} className="lp-chip flex gap-3 bg-white border rounded-lg px-3.5 py-3" style={{ borderColor: C.line }}>
                        <span className="w-12 shrink-0 tabular-nums" style={{ color: i === 0 ? C.green : C.muted }}>{t}</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: '05', tag: 'Contratos e reajustes',
                t: 'Nenhum repasse de CCT esquecido',
                d: 'Controle vigência, aditivos e o valor da carteira ativa. O sistema marca "Reajuste pendente" com antecedência da data-base.',
                v: (
                  <div className="bg-white border rounded-lg text-[13px] divide-y" style={{ borderColor: C.line }}>
                    {[
                      ['CT-2024-12 · Hospital São Lucas', 'Reajuste pendente', true],
                      ['CT-2024-08 · Cond. Alto da XV', 'Em dia', false],
                      ['CT-2025-03 · Metalúrgica CL', 'Em dia', false],
                    ].map(([c, s, w]) => (
                      <div key={c as string} className="flex justify-between items-center px-4 py-3" style={{ borderColor: C.line }}>
                        <span>{c}</span>
                        <span className="text-[12px] px-2 py-0.5 rounded-md" style={w ? { background: '#FBF1DC', color: '#7A5410' } : { color: C.muted }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map((f, idx) => (
              <div key={f.n} className="lp-card grid lg:grid-cols-12 gap-8 lg:gap-14 items-center rounded-[24px] p-6 md:p-10 border overflow-hidden" style={{ borderColor: C.line, background: idx % 2 === 0 ? '#FFFFFF' : C.paper }}>
                <div className={`lg:col-span-6 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <p className="text-[13px]" style={{ color: C.muted }}>{f.n} — {f.tag}</p>
                  <h3 className="text-[28px] md:text-[34px] leading-[1.1] mt-3" style={serif}>{f.t}</h3>
                  <p className="text-[16px] leading-[1.65] mt-4" style={{ color: C.muted }}>{f.d}</p>
                </div>
                <div className={`lp-card-media lg:col-span-6 rounded-2xl p-4 md:p-5 ${idx % 2 === 1 ? 'lg:order-1' : ''}`} style={{ background: '#F3F1EC' }}>
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPOSTA POR LINK vs PROVELO */}
      <section id="proposta-interativa" className="py-24 md:py-32 bg-white border-y" style={{ borderColor: C.line }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-10 mb-14">
            <div className="lg:col-span-7">
              <p className="text-[14px] mb-4" style={{ color: C.muted }}>Proposta por link</p>
              <h2 className="text-[40px] md:text-[52px] leading-[1.05]" style={serif}>
                O fim do PDF que vai por e-mail e <span style={{ color: C.green }}>nunca mais volta.</span>
              </h2>
            </div>
            <p className="lg:col-span-5 text-[16px] leading-[1.65] lg:pt-10" style={{ color: C.muted }}>
              Ferramentas como a Provelo vendem só o link rastreável da proposta. No SmartBid ele já vem junto — e os números da proposta saem direto da sua CCT, não de uma planilha colada à mão.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: C.line }}>
            <table className="w-full min-w-[720px] text-[14px]">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: C.line }}>
                  <th className="px-6 py-5 font-normal" style={{ color: C.muted }}>&nbsp;</th>
                  <th className="px-6 py-5 font-medium w-[18%]">PDF anexo</th>
                  <th className="px-6 py-5 font-medium w-[18%]">Provelo e similares</th>
                  <th className="px-6 py-5 font-medium w-[18%] text-white" style={{ background: C.green }}>SmartBid</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Proposta em página web com a sua marca', 0, 1, 1],
                  ['Aviso quando o cliente abre', 0, 1, 1],
                  ['Tempo de leitura por seção (custos, minuta, escopo)', 0, 2, 1],
                  ['Aceite online em um clique', 0, 1, 1],
                  ['Preço calculado pela CCT, com encargos e benefícios', 0, 0, 1],
                  ['DRE e margem do contrato', 0, 0, 1],
                  ['Alerta de reajuste depois de fechado', 0, 0, 1],
                ].map(([label, a, b, c]) => (
                  <tr key={label as string} className="lp-row border-b last:border-b-0" style={{ borderColor: C.line }}>
                    <td className="px-6 py-4">{label}</td>
                    {[a, b, c].map((v, i) => (
                      <td key={i} className="px-6 py-4" style={i === 2 ? { background: C.greenSoft } : undefined}>
                        {v === 1 ? <Check size={17} style={{ color: C.green }} strokeWidth={2.5} />
                          : v === 2 ? <span className="text-[13px]" style={{ color: C.muted }}>Básico</span>
                          : <Minus size={17} style={{ color: '#C4BFB5' }} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div data-stagger className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              ['Rastreio silencioso', 'Saiba se o decisor abriu às 22h ou mandou o link para o diretor financeiro.'],
              ['Aceite na hora', 'O cliente clica em "Aprovar" e o contrato entra direto na implantação.'],
              ['WhatsApp no rodapé', 'Botão para falar com o seu vendedor sem sair da proposta.'],
              ['Registro jurídico', 'IP, data, horário e versão de cada aceite guardados.'],
            ].map(([t, d]) => (
              <div key={t} className="border-t pt-5" style={{ borderColor: C.ink }}>
                <p className="text-[16px] font-semibold">{t}</p>
                <p className="text-[14px] leading-[1.6] mt-2" style={{ color: C.muted }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM É / NÃO É */}
      <section id="qualificacao" className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[40px] md:text-[52px] leading-[1.05] max-w-[700px] mb-14" style={serif}>O SmartBid é para a sua empresa?</h2>
          <div data-reveal data-reveal-scale className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden border" style={{ background: C.line, borderColor: C.line }}>
            <div className="bg-white p-8 md:p-10">
              <p className="text-[15px] font-semibold flex items-center gap-2"><Check size={17} style={{ color: C.green }} strokeWidth={2.5} /> É para você se…</p>
              <ul className="mt-6 space-y-5 text-[15px] leading-[1.6]">
                <li>Você tem uma <strong className="font-semibold">prestadora de limpeza e conservação</strong> e precisa montar orçamento rápido sem risco de passivo trabalhista.</li>
                <li>Você opera <strong className="font-semibold">segurança, portaria ou apoio</strong> com dezenas de postos e precisa acompanhar os reajustes da convenção.</li>
                <li>Você é <strong className="font-semibold">sócio ou diretor comercial</strong> e quer ver metas, ciclo de fechamento e conversão num lugar só.</li>
              </ul>
            </div>
            <div className="p-8 md:p-10" style={{ background: C.paper }}>
              <p className="text-[15px] font-semibold flex items-center gap-2"><X size={17} className="text-[#9A3B2E]" strokeWidth={2.5} /> Não é para você se…</p>
              <ul className="mt-6 space-y-5 text-[15px] leading-[1.6]" style={{ color: C.muted }}>
                <li>Você procura só um bloco de notas digital ou um chat genérico, sem cálculo de custos.</li>
                <li>Você prefere continuar no Excel e correr o risco de perder dezenas de milhares de reais por ano com fórmula desatualizada.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* OBJEÇÕES */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="text-[14px] mb-10" style={{ color: C.muted }}>O que costumam nos perguntar</p>
          <div data-stagger className="grid md:grid-cols-3 gap-10">
            {[
              ['"Já uso um CRM, tipo Bitrix24 ou Pipedrive."', 'CRM move cartão. Não calcula encargo de convenção, não gera DRE de projeto e não avisa quando a CCT de um posto venceu. O SmartBid cobre a parte de engenharia e pós-venda que eles deixam de fora.'],
              ['"Meu orçamentista faz o per capita de cabeça."', 'Conta de cabeça pega erro grosseiro. Não pega o reflexo de benefício esquecido, nem avisa que o cliente abriu a minuta 11 vezes.'],
              ['"A implantação é demorada?"', 'Não. Parametrizamos as suas CCTs principais e o modelo de proposta junto com você, e as primeiras cotações saem nos primeiros dias.'],
            ].map(([q, a]) => (
              <div key={q}>
                <p className="text-[24px] leading-[1.2]" style={serif}>{q}</p>
                <p className="text-[15px] leading-[1.65] mt-4" style={{ color: C.muted }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24 md:py-32 bg-white border-y" style={{ borderColor: C.line }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <h2 className="text-[40px] md:text-[52px] leading-[1.05]" style={serif}>Planos</h2>
            <p className="text-[15px]" style={{ color: C.muted }}>Preço fechado por mês. Sem taxa de implantação escondida.</p>
          </div>

          <div data-stagger className="grid lg:grid-cols-3 gap-5">
            {[
              {
                nome: 'Básico', para: 'Para quem está começando', preco: '149', extra: null,
                itens: ['Até 3 usuários', '30 buscas novas por mês no Google Places', 'FPVs e CCTs limitadas', 'Histórico e rastreio básicos'],
                cta: 'Escolher Básico', destaque: false,
              },
              {
                nome: 'Profissional', para: 'Para prestadoras em expansão', preco: '299', extra: 'R$ 429/mês com WhatsApp integrado',
                itens: ['Até 10 usuários', '150 buscas novas por mês no Google Places', 'FPVs e CCTs ilimitadas', 'Auditoria completa de acessos', 'Alertas automáticos de reajuste'],
                cta: 'Começar no Profissional', destaque: true,
              },
              {
                nome: 'Enterprise', para: 'Para grandes operações e filiais', preco: '599', extra: null,
                itens: ['Até 100 usuários', '400 buscas novas por mês no Google Places', 'Ilimitado, com APIs liberadas', 'SLA avançado e suporte 24/7'],
                cta: 'Falar com consultor', destaque: false,
              },
            ].map(p => (
              <div
                key={p.nome}
                className={`lp-plan rounded-2xl p-8 flex flex-col ${p.destaque ? 'lp-plan-featured' : ''}`}
                style={p.destaque ? { background: C.ink, color: '#fff' } : { border: `1px solid ${C.line}`, background: C.paper }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold">{p.nome}</p>
                  {p.destaque && <span className="text-[12px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>Mais escolhido</span>}
                </div>
                <p className="text-[14px] mt-1" style={{ color: p.destaque ? 'rgba(255,255,255,0.6)' : C.muted }}>{p.para}</p>
                <p className="mt-8 flex items-baseline gap-1.5">
                  <span className="text-[15px]">R$</span>
                  <span className="text-[56px] leading-none tabular-nums" style={serif}>{p.preco}</span>
                  <span className="text-[14px]" style={{ color: p.destaque ? 'rgba(255,255,255,0.6)' : C.muted }}>/mês</span>
                </p>
                <p className="text-[13px] mt-2 h-5" style={{ color: p.destaque ? 'rgba(255,255,255,0.6)' : C.muted }}>{p.extra}</p>
                <ul className="mt-8 space-y-3 text-[14px] flex-1">
                  {p.itens.map(i => (
                    <li key={i} className="flex gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: p.destaque ? '#9FD3BC' : C.green }} strokeWidth={2.5} />
                      {i}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/cadastro?plano=${encodeURIComponent(p.nome)}`}
                  className="mt-10 w-full py-3 rounded-full text-[14px] font-semibold text-center transition-opacity hover:opacity-90"
                  style={p.destaque ? { background: '#fff', color: C.ink } : { border: `1px solid ${C.ink}`, color: C.ink }}
                >
                  Testar 7 dias grátis
                </a>
                <p className="text-[12px] text-center mt-2.5" style={{ color: p.destaque ? 'rgba(255,255,255,0.55)' : C.muted }}>
                  Sem cartão. Escolha o plano no fim do teste.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GARANTIA + DEPOIMENTO */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-[14px] mb-4" style={{ color: C.muted }}>Garantia</p>
            <p className="text-[56px] leading-none" style={serif}>14 dias</p>
            <p className="text-[16px] leading-[1.65] mt-5" style={{ color: C.muted }}>
              Se nos primeiros 14 dias o SmartBid não acelerar a montagem das suas propostas e não deixar a leitura dos custos mais simples, é só pedir o cancelamento. Devolvemos 100% da assinatura.
            </p>
          </div>
          <figure className="lg:col-span-7 lg:border-l lg:pl-12" style={{ borderColor: C.line }}>
            <blockquote className="text-[24px] md:text-[30px] leading-[1.3]" style={{ ...serif, fontWeight: 500, letterSpacing: '-0.02em' }}>
              “Antes a gente levava um dia inteiro cruzando benefício do sindicato com planilha de insumos. Hoje uma proposta de 50 postos sai em menos de meia hora, e com a margem garantida.”
            </blockquote>
            <figcaption className="mt-6 text-[14px]">
              <span className="font-semibold">Diretoria comercial</span>
              <span style={{ color: C.muted }}> · empresa de asseio e conservação</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="pb-24 md:pb-32">
        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-12 gap-10">
          <h2 className="lg:col-span-4 text-[40px] md:text-[48px] leading-[1.05]" style={serif}>Perguntas frequentes</h2>
          <div className="lg:col-span-8 border-t" style={{ borderColor: C.line }}>
            {[
              {
                pergunta: 'Como funciona o teste grátis de 7 dias?',
                resposta: 'Você cria a conta sozinho em 2 minutos, sem cartão de crédito, e usa a plataforma completa por 7 dias. No fim do teste você escolhe o plano para continuar. Se não escolher, a conta fica pausada e nada é cobrado.'
              },
              {
                pergunta: 'Consigo cadastrar convenções de estados diferentes?',
                resposta: 'Sim. O gerenciador de CCT aceita vários sindicatos, cada um com seus pisos, encargos e benefícios, para cada região onde você opera.'
              },
              {
                pergunta: 'Como funciona o rastreio da proposta enviada ao cliente?',
                resposta: 'O sistema gera um link exclusivo. Quando o cliente abre, o SmartBid registra o tempo e o número de visitas em cada parte: apresentação, proposta, planilha de custos (FPV) e minuta.'
              },
              {
                pergunta: 'O sistema calcula a DRE do contrato sozinho?',
                resposta: 'Sim. A partir da mão de obra e dos insumos, ele projeta tributos, custos diretos e a margem bruta de cada mês do contrato.'
              },
              {
                pergunta: 'Como o SmartBid ajuda na hora de reajustar o contrato?',
                resposta: 'O módulo de contratos organiza a carteira por vigência e marca os que estão com "Reajuste pendente" pela data-base, para você não prestar serviço com valor defasado.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b" style={{ borderColor: C.line }}>
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-6 text-left flex items-center justify-between gap-6 cursor-pointer"
                  >
                    <span className="text-[17px] font-medium">{faq.pergunta}</span>
                    <span className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  <div className={`lp-faq-body ${isOpen ? 'is-open' : ''}`}>
                    <div>
                      <p className="pb-6 pr-14 text-[15px] leading-[1.65]" style={{ color: C.muted }}>{faq.resposta}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 sm:px-6 pb-6">
        <div data-spot data-reveal data-reveal-scale className="relative overflow-hidden max-w-[1200px] mx-auto rounded-[28px] px-8 py-16 md:px-16 md:py-24 text-white grid lg:grid-cols-12 gap-10 items-end" style={{ background: C.green }}>
          <div className="lp-aurora lp-aurora-a" aria-hidden />
          <div className="lp-aurora lp-aurora-b" aria-hidden />
          <div className="lp-band-spot" aria-hidden />
          <h2 className="relative lg:col-span-8 text-[40px] md:text-[56px] leading-[1.03]" style={serif}>
            Pare de deixar margem na mesa e assuma o controle da sua esteira comercial.
          </h2>
          <div className="relative lg:col-span-4">
            <p className="text-[15px] text-white/70 leading-[1.6]">
              Teste por 7 dias, monte a primeira proposta e veja a DRE do projeto antes de enviar. Sem cartão de crédito.
            </p>
            <a
              id="final-teste-gratis"
              href="/cadastro"
              className="lp-btn lp-pulse group mt-6 inline-flex items-center gap-2 bg-white text-[15px] font-semibold pl-5 pr-4 py-3 rounded-full"
              style={{ color: C.ink }}
            >
              Criar conta grátis
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <button
              onClick={() => openDemoWithPlan('Solicitar Demonstração Gratuita Final')}
              className="block mt-4 text-[14px] text-white/75 underline underline-offset-4 cursor-pointer hover:text-white"
            >
              Prefere uma demonstração guiada?
            </button>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between gap-6 text-[13px]" style={{ color: C.muted }}>
          <div>
            <p className="flex items-center gap-2" style={{ color: C.ink }}>
              <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: C.green }}>
                <TrendingUp size={11} className="text-white" strokeWidth={2.5} />
              </span>
              <span className="font-semibold">SmartBid</span>
            </p>
            <p className="mt-3">Formação de preço e gestão comercial para prestadoras de serviços terceirizados.</p>
            <p className="mt-1">Curitiba/PR · © {new Date().getFullYear()} SmartBid</p>
          </div>
          <div className="flex gap-6 md:items-end">
            <a href="#" className="hover:text-[#111418]">Termos de uso</a>
            <a href="#" className="hover:text-[#111418]">Privacidade</a>
            <a href="mailto:suporte@smartbidhub.com.br" className="hover:text-[#111418]">Central de ajuda</a>
          </div>
        </div>
      </footer>

      {/* MODAL DE DEMONSTRAÇÃO */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#111418]/40 backdrop-blur-[2px]">
          <div className="relative w-full max-w-md rounded-2xl p-7 sm:p-8 shadow-2xl" style={{ background: C.paper }}>
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 cursor-pointer"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {!demoSuccess ? (
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div>
                  <h3 className="text-[30px] leading-tight" style={serif}>Ver o SmartBid em ação</h3>
                  <p className="text-[13px] mt-1" style={{ color: C.muted }}>20 minutos, com a sua CCT · {demoPlanName}</p>
                </div>

                {[
                  { k: 'nome', l: 'Nome', t: 'text', p: 'Seu nome completo' },
                  { k: 'email', l: 'E-mail corporativo', t: 'email', p: 'voce@suaempresa.com.br' },
                  { k: 'whatsapp', l: 'WhatsApp', t: 'tel', p: '(41) 99999-9999' },
                  { k: 'empresa', l: 'Empresa', t: 'text', p: 'Nome da sua prestadora' },
                ].map(f => (
                  <label key={f.k} className="block">
                    <span className="text-[13px] font-medium">{f.l}</span>
                    <input
                      type={f.t}
                      required
                      placeholder={f.p}
                      value={(demoForm as any)[f.k]}
                      onChange={(e) => setDemoForm({ ...demoForm, [f.k]: e.target.value })}
                      className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border bg-white text-[14px] outline-none focus:border-[#1B4D3E]"
                      style={{ borderColor: C.line }}
                    />
                  </label>
                ))}

                <label className="block">
                  <span className="text-[13px] font-medium">Porte da operação</span>
                  <select
                    value={demoForm.postos}
                    onChange={(e) => setDemoForm({ ...demoForm, postos: e.target.value })}
                    className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border bg-white text-[14px] outline-none focus:border-[#1B4D3E]"
                    style={{ borderColor: C.line }}
                  >
                    <option value="1 a 10 postos">1 a 10 postos</option>
                    <option value="10 a 50 postos">10 a 50 postos</option>
                    <option value="50 a 200 postos">50 a 200 postos</option>
                    <option value="Mais de 200 postos">Mais de 200 postos</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-white text-[14px] font-medium cursor-pointer"
                  style={{ background: C.green }}
                >
                  Agendar demonstração
                </button>
                <p className="text-[12px] text-center" style={{ color: C.muted }}>Sem cartão de crédito. Respondemos no mesmo dia.</p>
              </form>
            ) : (
              <div className="py-6 text-center">
                <span className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: C.greenSoft, color: C.green }}>
                  <Check size={22} strokeWidth={2.5} />
                </span>
                <h4 className="text-[26px] mt-4" style={serif}>Pedido recebido</h4>
                <p className="text-[14px] mt-2" style={{ color: C.muted }}>
                  Estamos abrindo o WhatsApp do nosso consultor para combinar o horário.
                </p>
                <button
                  onClick={() => setDemoModalOpen(false)}
                  className="mt-6 px-5 py-2 rounded-full border text-[14px] cursor-pointer"
                  style={{ borderColor: C.line }}
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
