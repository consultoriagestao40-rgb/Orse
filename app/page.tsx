'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { 
  BarChart2, TrendingUp, Users, Clock, DollarSign, 
  ArrowUpRight, Award, Briefcase, Activity, Percent, Filter, 
  Calendar, CheckCircle, Edit2, Check, Target, Zap,
  Building, Wrench, Truck, Smartphone, LogOut, RefreshCw,
  ChevronRight, Sparkles, Trophy, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getKPIs, getLoggedUser } from '@/app/propostas/actions';

function RadarComercialDashboard() {
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [kpis, setKpis] = useState<any>(null);

  // Filtros
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<'all' | '7' | '30' | 'mes' | 'ano' | 'custom'>('mes');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Ex: "2026-10"
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartViewMode, setChartViewMode] = useState<'mensal' | 'acumulada'>('mensal');

  // Metas por vendedor
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editGoalValue, setEditGoalValue] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data] = await Promise.all([
        getKPIs(),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      setKpis(data);

      if (data?.usuarios) {
        const dbMetas: Record<string, number> = {};
        const activeMonthKey = new Date().toISOString().substring(0, 7);
        data.usuarios.forEach((seller: any) => {
          const goalKey = `${seller.nome}_${activeMonthKey}`;
          dbMetas[goalKey] = seller.meta || 0;
        });
        setMetas(prev => ({ ...prev, ...dbMetas }));
      }
    } catch (e) {
      console.error('Erro ao buscar KPIs:', e);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sincroniza datas pré-definidas ao alterar o período ou o mês selecionado
  useEffect(() => {
    const today = new Date();
    let start = new Date();
    
    if (period === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (period === '7') {
      start.setDate(today.getDate() - 7);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (period === '30') {
      start.setDate(today.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (period === 'mes') {
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        const formatLocal = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        
        setStartDate(formatLocal(firstDay));
        setEndDate(formatLocal(lastDay));
      }
    } else if (period === 'ano') {
      start = new Date(today.getFullYear(), 0, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [period, selectedMonth]);

  // Carrega metas do localStorage e sincroniza com o banco de dados
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sb_kpi_goals');
      if (saved) {
        try {
          setMetas(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (kpis?.usuarios) {
      const dbMetas: Record<string, number> = {};
      const activeMonthKey = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
      kpis.usuarios.forEach((seller: any) => {
        const goalKey = `${seller.nome}_${activeMonthKey}`;
        dbMetas[goalKey] = seller.meta || 0;
      });
      setMetas(prev => ({ ...prev, ...dbMetas }));
    }
  }, [kpis, startDate]);

  const handleSaveInlineGoal = async (userId: string, userName: string) => {
    const clean = editGoalValue.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    const parsedNum = Number(clean);
    const val = isNaN(parsedNum) ? 0 : parsedNum;

    const activeMonthKey = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const updatedMetas = { ...metas, [`${userName}_${activeMonthKey}`]: val };
    setMetas(updatedMetas);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_kpi_goals', JSON.stringify(updatedMetas));
    }
    
    setEditingUserId(null);

    try {
      const { updateSellerMeta } = await import('@/app/admin/settings/actions');
      await updateSellerMeta(userId, val);
      
      setKpis((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          usuarios: prev.usuarios.map((u: any) => u.id === userId ? { ...u, meta: val } : u)
        };
      });
    } catch (e) {
      console.error("Erro ao salvar meta no banco:", e);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // =========================================================================
  // PROCESSAMENTO DINÂMICO DE FILTROS E CÁLCULO DE MÉTRICAS (CLIENT-SIDE ENGINE)
  // =========================================================================
  const propostasList = kpis?.propostas || [];
  const totalSellers = kpis?.usuarios || [];

  const filteredPropostas = propostasList.filter((p: any) => {
    const d = new Date(p.dataCriacao);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dataCriacaoStr = `${y}-${m}-${day}`;
    
    if (userFilter !== 'ALL' && p.usuario !== userFilter) {
      return false;
    }
    if (startDate && dataCriacaoStr < startDate) {
      return false;
    }
    if (endDate && dataCriacaoStr > endDate) {
      return false;
    }
    return true;
  });

  // Totais principais
  let totalVolume = 0;
  let totalAceito = 0;
  let totalPropostasCount = filteredPropostas.length;
  let totalAceitasCount = 0;

  const volumePorUsuario: Record<string, { totalVal: number, totalAceito: number, count: number, totalAceitasCount: number }> = {};
  const volumePorServico: Record<string, { totalVal: number, count: number }> = {};
  
  let somaDiasCiclo = 0;
  let countDiasCiclo = 0;

  filteredPropostas.forEach((p: any) => {
    const valor = p.valor || 0;
    const isAceito = p.isAceito;

    totalVolume += valor;
    if (isAceito) {
      totalAceito += valor;
      totalAceitasCount++;

      if (p.dataAceitacao) {
        const start = new Date(p.dataCriacao);
        const end = new Date(p.dataAceitacao);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        somaDiasCiclo += dias;
        countDiasCiclo++;
      }
    }

    const usuario = p.usuario;
    if (!volumePorUsuario[usuario]) {
      volumePorUsuario[usuario] = { totalVal: 0, totalAceito: 0, count: 0, totalAceitasCount: 0 };
    }
    volumePorUsuario[usuario].totalVal += valor;
    if (isAceito) {
      volumePorUsuario[usuario].totalAceito += valor;
      volumePorUsuario[usuario].totalAceitasCount += 1;
    }
    volumePorUsuario[usuario].count += 1;

    const servico = (p.tipoServicos || 'Outros').trim().toUpperCase();
    if (!volumePorServico[servico]) {
      volumePorServico[servico] = { totalVal: 0, count: 0 };
    }
    volumePorServico[servico].totalVal += valor;
    volumePorServico[servico].count += 1;
  });

  const ticketMedio = totalAceitasCount > 0 ? totalAceito / totalAceitasCount : (totalPropostasCount > 0 ? totalVolume / totalPropostasCount : 0);
  const taxaConversao = totalVolume > 0 ? (totalAceito / totalVolume) * 100 : 0;
  const conversaoQuantidade = totalPropostasCount > 0 ? (totalAceitasCount / totalPropostasCount) * 100 : 0;
  const cicloMedio = countDiasCiclo > 0 ? somaDiasCiclo / countDiasCiclo : 0;

  const activeMonthKey = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);

  const formatMonthYear = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  const totalMetasEmpresa = totalSellers.reduce((acc: number, seller: any) => {
    const nome = seller.nome;
    if (userFilter !== 'ALL' && nome !== userFilter) return acc;
    const key = `${nome}_${activeMonthKey}`;
    const dbMeta = seller.meta > 0 ? seller.meta : 100000;
    const m = metas[key] !== undefined ? metas[key] : dbMeta;
    return acc + m;
  }, 0);

  const atingidoGeralPct = totalMetasEmpresa > 0 ? (totalAceito / totalMetasEmpresa) * 100 : 0;

  // Projeção de Fechamento (Run-Rate do Mês)
  const runRateProjection = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (currentDay > 0 && totalAceito > 0) {
      const projecao = (totalAceito / currentDay) * daysInMonth;
      return projecao;
    }
    return totalAceito;
  }, [totalAceito]);

  // Gráfico histórico
  const currentYear = new Date().getFullYear();
  const chartMonths: string[] = [];
  for (let i = 0; i < 12; i++) {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    chartMonths.push(monthKey);
  }

  const getShortMonthName = (monthKey: string) => {
    const m = monthKey.split('-')[1];
    const months: Record<string, string> = {
      '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR', '05': 'MAI', '06': 'JUN',
      '07': 'JUL', '08': 'AGO', '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ'
    };
    return months[m] || m;
  };

  const monthlyData = chartMonths.map((mKey: string) => {
    let realizado = 0;
    propostasList.forEach((p: any) => {
      if (p.dataCriacao) {
        const d = new Date(p.dataCriacao);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const pKey = `${y}-${m}`;
        
        if (pKey === mKey) {
          if (userFilter !== 'ALL' && p.usuario !== userFilter) return;
          if (p.isAceito) {
            realizado += p.valor || 0;
          }
        }
      }
    });

    let previsto = 0;
    if (userFilter !== 'ALL') {
      const key = `${userFilter}_${mKey}`;
      const seller = totalSellers.find((u: any) => u.nome === userFilter);
      const dbMeta = seller?.meta > 0 ? seller.meta : 100000;
      previsto = metas[key] !== undefined ? metas[key] : dbMeta;
    } else {
      totalSellers.forEach((seller: any) => {
        const nome = seller.nome;
        const key = `${nome}_${mKey}`;
        const dbMeta = seller.meta > 0 ? seller.meta : 100000;
        previsto += metas[key] !== undefined ? metas[key] : dbMeta;
      });
    }

    const atingidoPct = previsto > 0 ? (realizado / previsto) * 100 : 0;
    return {
      monthKey: mKey,
      previsto,
      realizado,
      atingidoPct
    };
  });

  let chartData = monthlyData;
  if (chartViewMode === 'acumulada') {
    let accPrevisto = 0;
    let accRealizado = 0;
    chartData = monthlyData.map((d) => {
      accPrevisto += d.previsto;
      accRealizado += d.realizado;
      const atingidoPct = accPrevisto > 0 ? (accRealizado / accPrevisto) * 100 : 0;
      return {
        ...d,
        previsto: accPrevisto,
        realizado: accRealizado,
        atingidoPct
      };
    });
  }

  const maxFaturamento = Math.max(...chartData.map(d => Math.max(d.previsto, d.realizado)), 50000);
  const maxValY = maxFaturamento * 1.15;
  const maxPct = Math.max(...chartData.map(d => d.atingidoPct), 100);
  const maxPctY = maxPct * 1.15;

  const formatShortCurrency = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  // Ranking de vendedores ordenados por faturamento aceito
  const rankedSellers = useMemo(() => {
    return totalSellers
      .filter((seller: any) => userFilter === 'ALL' || seller.nome === userFilter)
      .map((seller: any) => {
        const nome = seller.nome;
        const stats = volumePorUsuario[nome] || { totalVal: 0, totalAceito: 0, count: 0, totalAceitasCount: 0 };
        const goalKey = `${nome}_${activeMonthKey}`;
        const dbMeta = seller.meta > 0 ? seller.meta : 100000;
        const metaVal = metas[goalKey] !== undefined ? metas[goalKey] : dbMeta;
        const atingidoPct = metaVal > 0 ? (stats.totalAceito / metaVal) * 100 : 0;
        return {
          ...seller,
          stats,
          metaVal,
          atingidoPct
        };
      })
      .sort((a: any, b: any) => b.stats.totalAceito - a.stats.totalAceito);
  }, [totalSellers, volumePorUsuario, metas, activeMonthKey, userFilter]);

  if (!hasLoadedOnce) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex items-center justify-center overflow-hidden font-sans">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[400px] h-[400px] bg-gradient-to-r from-[#1B4D3E] to-[#10B981] rounded-full blur-[100px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#1B4D3E]/30 rounded-2xl border border-[#10B981]/30 flex items-center justify-center animate-spin">
            <TrendingUp className="text-[#10B981]" size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#10B981] animate-pulse">Carregando Radar Comercial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER EXECUTIVO COM FILTROS EM PILLS */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#1B4D3E] text-white rounded-xl shadow-sm shadow-[#1B4D3E]/20">
                  <BarChart2 size={22} />
                </span>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Radar Comercial & KPIs
                  </h1>
                  <p className="text-slate-500 text-xs font-medium mt-0.5">
                    Cockpit executivo de conversão, metas corporativas e inteligência comercial
                  </p>
                </div>
              </div>
            </div>

            {/* SELETORES E BOTÃO ATUALIZAR */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* FILTRO DE VENDEDOR */}
              <select 
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1B4D3E] shadow-xs cursor-pointer"
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              >
                <option value="ALL">👥 Toda a Equipe Comercial</option>
                {totalSellers.map((seller: any) => (
                  <option key={seller.id} value={seller.nome}>👤 {seller.nome}</option>
                ))}
              </select>

              {/* SELETOR DE MÊS (SE ESTIVER EM MENSAL) */}
              {period === 'mes' && (
                <input 
                  type="month"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1B4D3E] shadow-xs cursor-pointer"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              )}

              {/* BOTÃO ATUALIZAR */}
              <button 
                onClick={loadData}
                disabled={loading}
                title="Sincronizar indicadores"
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-[#1B4D3E]' : ''} />
                <span>Atualizar</span>
              </button>
            </div>
          </header>

          {/* BARRA DE FILTROS RÁPIDOS EM PILLS */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <Filter size={12} /> Período:
              </span>
              {[
                { id: 'mes', label: '📅 Este Mês' },
                { id: '7', label: '7 Dias' },
                { id: '30', label: '30 Dias' },
                { id: 'ano', label: 'Ano Vigente' },
                { id: 'all', label: 'Todo o Histórico' },
                { id: 'custom', label: '⚙️ Personalizado' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    period === item.id 
                      ? 'bg-[#1B4D3E] text-white shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Range de Datas Ativo */}
            <div className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} 
              <span className="mx-1 text-slate-400">até</span> 
              {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4D3E] mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Processando indicadores comerciais...</p>
            </div>
          ) : (propostasList.length === 0 && totalSellers.length === 0) ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <p className="text-slate-500 font-bold uppercase tracking-wider">Nenhuma proposta encontrada para os filtros selecionados.</p>
              <p className="text-slate-400 text-xs mt-1">Crie propostas comerciais para visualizar os KPIs.</p>
            </div>
          ) : (
            <>
              {/* CARD HERO CORPORATIVO: META GLOBAL DA EMPRESA */}
              <div className="bg-gradient-to-br from-[#0B251E] via-[#12362B] to-[#1B4D3E] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-emerald-950/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                  
                  {/* Lado Esquerdo: Identificação da Meta */}
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Target size={12} className="text-emerald-400" /> Meta Global Corporativa
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        {formatMonthYear(activeMonthKey)}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      Desempenho Comercial & Metas
                    </h2>

                    <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                      Acompanhamento em tempo real do faturamento convertido pela equipe comercial vs. a meta estipulada para a carteira.
                    </p>

                    {/* Projeção / Run Rate */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                        <span className="text-[10px] text-emerald-200 block uppercase font-black">Projeção do Mês (Run-Rate)</span>
                        <span className="font-extrabold text-white">{formatCurrency(runRateProjection)}</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
                        <span className="text-[10px] text-emerald-200 block uppercase font-black">Pipeline Quente (Aberto)</span>
                        <span className="font-extrabold text-emerald-300">{formatCurrency(Math.max(0, totalVolume - totalAceito))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Velocímetro SVG & Valores */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10 border-t lg:border-t-0 lg:border-l border-emerald-800/80 pt-6 lg:pt-0 lg:pl-10">
                    
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-300 block">
                        Faturamento Aceito / Meta
                      </span>
                      <p className="text-2xl md:text-3xl font-black text-white mt-1">
                        {formatCurrency(totalAceito)}
                      </p>
                      <p className="text-xs text-emerald-200/80 font-bold mt-0.5">
                        Meta: {formatCurrency(totalMetasEmpresa)}
                      </p>
                    </div>

                    {/* Velocímetro Precision SVG */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-36 h-20 overflow-hidden relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                          {/* Trilho de Fundo */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#06211A"
                            strokeWidth="9"
                            strokeLinecap="round"
                          />
                          {/* Arco de Progresso com Gradiente */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray="125.66"
                            strokeDashoffset={125.66 - (125.66 * Math.min(100, atingidoGeralPct)) / 100}
                            className="transition-all duration-1000 ease-out"
                            style={{ filter: 'drop-shadow(0px 2px 6px rgba(16, 185, 129, 0.4))' }}
                          />
                          {/* Ponteiro */}
                          <line
                            x1="50"
                            y1="50"
                            x2="50"
                            y2="17"
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            transform={`rotate(${((Math.min(100, atingidoGeralPct) / 100) * 180) - 90} 50 50)`}
                          />
                          <circle cx="50" cy="50" r="4.5" fill="#F59E0B" />
                          <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                        </svg>
                      </div>

                      <div className="text-center mt-2">
                        <span className="text-2xl font-black text-white leading-none">
                          {atingidoGeralPct.toFixed(1)}%
                        </span>
                        <span className={`text-[9px] uppercase font-black tracking-wider block mt-1 ${
                          atingidoGeralPct >= 100 ? 'text-emerald-300' : atingidoGeralPct >= 70 ? 'text-amber-300' : 'text-slate-300'
                        }`}>
                          {atingidoGeralPct >= 100 ? '🏆 Meta Batida!' : atingidoGeralPct >= 70 ? '⚡ Ritmo Forte' : 'Em Andamento'}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* GRID DE KPIS EXECUTIVOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. VOLUME TOTAL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline Total</span>
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <TrendingUp size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(totalVolume)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      {totalPropostasCount} {totalPropostasCount === 1 ? 'proposta emitida' : 'propostas emitidas'}
                    </p>
                  </div>
                </div>

                {/* 2. VOLUME FECHADO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vendas Fechadas</span>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <CheckCircle size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-black text-emerald-700 tracking-tight">
                      {formatCurrency(totalAceito)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      {totalAceitasCount} contratos convertidos
                    </p>
                  </div>
                </div>

                {/* 3. TAXA DE CONVERSÃO EM R$ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conversão (R$)</span>
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <Percent size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-slate-900 tracking-tight">
                        {taxaConversao.toFixed(1)}%
                      </p>
                      <span className="text-[10px] text-blue-600 font-black">Volume</span>
                    </div>
                    {/* Progress mini bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, taxaConversao)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* 4. TICKET MÉDIO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ticket Médio</span>
                    <span className="p-2 bg-emerald-50 text-[#1B4D3E] rounded-xl border border-emerald-100">
                      <DollarSign size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(ticketMedio)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      Média por contrato
                    </p>
                  </div>
                </div>

                {/* 5. CICLO MÉDIO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ciclo de Venda</span>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <Clock size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-black text-slate-900 tracking-tight">
                      {cicloMedio.toFixed(0)} <span className="text-xs text-slate-400 font-semibold">dias</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      Tempo médio de decisão
                    </p>
                  </div>
                </div>

              </div>

              {/* SEÇÃO PRINCIPAL DE ANÁLISE: RANKING DE VENDEDORES & SERVIÇOS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* TABELA DE DESEMPENHO DOS VENDEDORES (LEADERBOARD) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-emerald-50 text-[#1B4D3E] rounded-xl border border-emerald-100">
                        <Users size={16} />
                      </span>
                      <div>
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Desempenho da Equipe Comercial
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Ranking por faturamento convertido e acompanhamento de metas individuais
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase">
                      {rankedSellers.length} {rankedSellers.length === 1 ? 'consultor' : 'consultores'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-400 uppercase text-[9px] font-black tracking-wider border-b border-slate-100">
                          <th className="px-5 py-3.5">Consultor</th>
                          <th className="px-4 py-3.5 text-center">Propostas</th>
                          <th className="px-4 py-3.5 text-right">Volume Aceito</th>
                          <th className="px-4 py-3.5 text-right">Meta Individual</th>
                          <th className="px-5 py-3.5 text-center w-36">Atingimento</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {rankedSellers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium italic">
                              Nenhum vendedor encontrado.
                            </td>
                          </tr>
                        ) : (
                          rankedSellers.map((seller: any, idx: number) => {
                            const stats = seller.stats;
                            const isFiltered = userFilter === seller.nome;

                            return (
                              <tr 
                                key={seller.id} 
                                className={`transition-all ${
                                  isFiltered 
                                    ? 'bg-emerald-50/40 border-l-4 border-emerald-600 font-semibold' 
                                    : 'hover:bg-slate-50/60'
                                }`}
                              >
                                <td className="px-5 py-3.5 flex items-center gap-3">
                                  {/* Badge de Posição / Avatar */}
                                  <div className="relative">
                                    <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center border shadow-xs ${
                                      idx === 0 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                      idx === 1 ? 'bg-slate-200 text-slate-700 border-slate-300' :
                                      idx === 2 ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                      {seller.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    {idx < 3 && (
                                      <span className="absolute -top-1 -right-1 text-[10px]">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <span className="font-extrabold text-slate-800 block text-xs">
                                      {seller.nome}
                                    </span>
                                    <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                                      <span className="text-blue-600">Conv. R$: {stats.totalVal > 0 ? ((stats.totalAceito / stats.totalVal) * 100).toFixed(0) : 0}%</span>
                                      <span>•</span>
                                      <span className="text-emerald-600">Conv. Qtd: {stats.count > 0 ? ((stats.totalAceitasCount / stats.count) * 100).toFixed(0) : 0}%</span>
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                                  <span>{stats.count}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    {stats.totalAceitasCount} fechadas
                                  </span>
                                </td>
                                
                                <td className="px-4 py-3.5 text-right font-black text-slate-900">
                                  <span>{formatCurrency(stats.totalAceito)}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    Total: {formatCurrency(stats.totalVal)}
                                  </span>
                                </td>
                                
                                <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                                  {editingUserId === seller.id ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="text-slate-400 font-bold text-[10px]">R$</span>
                                      <input
                                        type="text"
                                        className="w-24 px-2 py-1 border border-slate-300 rounded font-black text-slate-800 text-right outline-none focus:border-[#1B4D3E]"
                                        value={editGoalValue}
                                        onChange={(e) => setEditGoalValue(e.target.value)}
                                        onBlur={() => handleSaveInlineGoal(seller.id, seller.nome)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveInlineGoal(seller.id, seller.nome);
                                          } else if (e.key === 'Escape') {
                                            setEditingUserId(null);
                                          }
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      className="flex items-center justify-end gap-1.5 group cursor-pointer" 
                                      onClick={() => {
                                        setEditingUserId(seller.id);
                                        setEditGoalValue(seller.metaVal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\./g, ''));
                                      }}
                                      title="Clique para editar a meta do vendedor"
                                    >
                                      <span>{formatCurrency(seller.metaVal)}</span>
                                      <Edit2 size={12} className="text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity ml-1" />
                                    </div>
                                  )}
                                </td>
                                
                                <td className="px-5 py-3.5">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className={`text-[10px] font-black ${
                                      seller.atingidoPct >= 100 
                                        ? 'text-emerald-600' 
                                        : seller.atingidoPct >= 60 
                                          ? 'text-indigo-600' 
                                          : 'text-amber-500'
                                    }`}>
                                      {seller.atingidoPct.toFixed(1)}%
                                    </span>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          seller.atingidoPct >= 100 
                                            ? 'bg-emerald-500' 
                                            : seller.atingidoPct >= 60 
                                              ? 'bg-indigo-500' 
                                              : 'bg-amber-400'
                                        }`} 
                                        style={{ width: `${Math.min(100, seller.atingidoPct)}%` }} 
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* VOLUME POR TIPO DE SERVIÇOS (FACILITIES, LIMPEZA, PORTARIA...) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                      <span className="p-2 bg-emerald-50 text-[#1B4D3E] rounded-xl border border-emerald-100">
                        <Briefcase size={16} />
                      </span>
                      <div>
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Mix por Categoria
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Distribuição de volume por tipo de serviço
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3.5">
                      {Object.keys(volumePorServico).length === 0 ? (
                        <p className="text-slate-400 text-xs text-center py-6 italic">
                          Nenhuma categoria registrada no período.
                        </p>
                      ) : (
                        Object.entries(volumePorServico)
                          .sort((a, b) => b[1].totalVal - a[1].totalVal)
                          .map(([nome, data]) => {
                            const pctTotal = totalVolume > 0 ? (data.totalVal / totalVolume) * 100 : 0;
                            return (
                              <div key={nome} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-extrabold text-slate-700 truncate max-w-[160px]">
                                    {nome}
                                  </span>
                                  <span className="font-black text-slate-900">
                                    {formatCurrency(data.totalVal)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-[#1B4D3E] h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${Math.min(100, pctTotal)}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 w-10 text-right">
                                    {pctTotal.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span className="font-bold">Total Categorizado:</span>
                    <span className="font-black text-slate-800">{formatCurrency(totalVolume)}</span>
                  </div>
                </div>

              </div>

              {/* GRÁFICO HISTÓRICO DE DESEMPENHO MENSAL */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={16} className="text-[#1B4D3E]" /> Acompanhamento de Metas Mensais
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                      Meta Prevista (Barras Roxas) vs. Faturamento Aceito (Barras Verdes) e % de Atingimento (Linha Dourada)
                    </p>
                  </div>
                  
                  {/* Toggle Mensal / Acumulada */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                    <button
                      onClick={() => setChartViewMode('mensal')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        chartViewMode === 'mensal'
                          ? 'bg-[#1B4D3E] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📅 Mensal
                    </button>
                    <button
                      onClick={() => setChartViewMode('acumulada')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        chartViewMode === 'acumulada'
                          ? 'bg-[#1B4D3E] text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📈 Acumulada
                    </button>
                  </div>
                </div>

                {/* SVG Combo Chart Canvas */}
                <div className="w-full overflow-x-auto select-none">
                  <div className="min-w-[920px] h-[260px] relative px-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240">
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                        const yCoord = 200 - (ratio * 180);
                        const leftVal = ratio * maxFaturamento;
                        const rightPctVal = ratio * maxPct;
                        return (
                          <g key={index}>
                            <line 
                              x1="70" 
                              y1={yCoord} 
                              x2="930" 
                              y2={yCoord} 
                              stroke="#E2E8F0" 
                              strokeWidth="1" 
                              strokeDasharray="4 4" 
                            />
                            <text 
                              x="60" 
                              y={yCoord + 3} 
                              textAnchor="end" 
                              className="fill-slate-400 text-[8px] font-bold tracking-tight"
                            >
                              {formatShortCurrency(leftVal)}
                            </text>
                            <text 
                              x="940" 
                              y={yCoord + 3} 
                              textAnchor="start" 
                              className="fill-amber-500 text-[8px] font-black tracking-tight"
                            >
                              {rightPctVal.toFixed(0)}%
                            </text>
                          </g>
                        );
                      })}

                      <line x1="70" y1="200" x2="930" y2="200" stroke="#CBD5E1" strokeWidth="1.5" />

                      {chartData.map((d, i) => {
                        const gap = 860 / chartData.length;
                        const xCenter = 70 + (i * gap) + (gap / 2);
                        
                        const hPrevisto = (d.previsto / maxValY) * 180;
                        const yPrevisto = 200 - hPrevisto;
                        
                        const hRealizado = (d.realizado / maxValY) * 180;
                        const yRealizado = 200 - hRealizado;

                        return (
                          <g key={`bar-${i}`} className="group">
                            <rect
                              x={xCenter - 11}
                              y={yPrevisto}
                              width="10"
                              height={Math.max(1, hPrevisto)}
                              fill="#6366F1"
                              rx="2"
                              className="transition-all duration-300 hover:fill-indigo-600 cursor-pointer"
                            />
                            <text
                              x={xCenter - 6}
                              y={yPrevisto - 6}
                              textAnchor="middle"
                              className="fill-indigo-600 text-[7px] font-black"
                            >
                              {formatShortCurrency(d.previsto)}
                            </text>

                            <rect
                              x={xCenter + 1}
                              y={yRealizado}
                              width="10"
                              height={Math.max(1, hRealizado)}
                              fill="#10B981"
                              rx="2"
                              className="transition-all duration-300 hover:fill-emerald-600 cursor-pointer"
                            />
                            <text
                              x={xCenter + 6}
                              y={yRealizado - 6}
                              textAnchor="middle"
                              className="fill-emerald-600 text-[7px] font-black"
                            >
                              {formatShortCurrency(d.realizado)}
                            </text>
                            
                            <text 
                              x={xCenter} 
                              y="218" 
                              textAnchor="middle" 
                              className="fill-slate-600 text-[9px] font-black uppercase tracking-wider"
                            >
                              {getShortMonthName(d.monthKey)}
                            </text>
                            <text 
                              x={xCenter} 
                              y="227" 
                              textAnchor="middle" 
                              className="fill-slate-400 text-[7px] font-bold tracking-tight"
                            >
                              {d.monthKey.split('-')[0]}
                            </text>
                          </g>
                        );
                      })}

                      {(() => {
                        const gap = 860 / chartData.length;
                        const points = chartData.map((d, i) => {
                          const xCenter = 70 + (i * gap) + (gap / 2);
                          const hPct = (d.atingidoPct / maxPctY) * 180;
                          const yCoord = 200 - hPct;
                          return `${xCenter},${yCoord}`;
                        });
                        
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points.join(' ')}
                              style={{ filter: 'drop-shadow(0px 2px 4px rgba(245, 158, 11, 0.4))' }}
                            />
                            
                            {chartData.map((d, i) => {
                              const xCenter = 70 + (i * gap) + (gap / 2);
                              const hPct = (d.atingidoPct / maxPctY) * 180;
                              const yCoord = 200 - hPct;
                              
                              return (
                                <g key={`dot-${i}`} className="group cursor-pointer">
                                  <circle
                                    cx={xCenter}
                                    cy={yCoord}
                                    r="4"
                                    fill="#F59E0B"
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    className="transition-all duration-300 group-hover:r-5 group-hover:stroke-amber-600"
                                  />
                                  <text
                                    x={xCenter}
                                    y={yCoord - 8}
                                    textAnchor="middle"
                                    className="fill-amber-600 text-[7px] font-black"
                                    style={{ filter: 'drop-shadow(0px 1px 1px rgba(255, 255, 255, 0.9))' }}
                                  >
                                    {d.atingidoPct.toFixed(1)}%
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* LEGENDA DO GRÁFICO */}
                <div className="flex justify-center mt-5 select-none border-t border-slate-100 pt-5">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[9px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/60 px-5 py-2.5 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 bg-[#6366F1] rounded-md block shadow-xs shadow-indigo-500/20"></span>
                      <span className="text-slate-600">Previsto (Meta)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 bg-[#10B981] rounded-md block shadow-xs shadow-emerald-500/20"></span>
                      <span className="text-slate-600">Realizado (Aceito)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-1 bg-[#F59E0B] relative flex items-center justify-center rounded">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] absolute border border-white"></span>
                      </span>
                      <span className="text-slate-600">Atingimento (%)</span>
                    </div>
                  </div>
                </div>

              </div>

            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showMobileHub, setShowMobileHub] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(async (data) => {
        if (data.loggedIn) {
          const superAdmins = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
          const userEmail = data.email?.toLowerCase()?.trim() || '';
          if (superAdmins.includes(userEmail)) {
            router.push('/admin/empresas');
            setIsLoggedIn(true);
            return;
          }

          // Busca dados completos do usuário logado
          let user: any = null;
          try {
            user = await getLoggedUser();
            setLoggedUser(user);
          } catch (err) {
            console.error('Erro ao obter usuário logado:', err);
          }

          const isDesktopMode = typeof window !== 'undefined' && sessionStorage.getItem('sb_mobile_mode') === 'desktop';
          const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          if (isMobile && !isDesktopMode) {
            if (user) {
              const role = user.role;
              const cargo = user.cargo?.toLowerCase() || '';

              const isGestor = role === 'ADMIN' || role === 'MANAGER';
              const isTecnico = cargo.includes('tecnico') || cargo.includes('técnico');
              const isEntregador = cargo.includes('entregador') || cargo.includes('entrega') || cargo.includes('motoboy') || cargo.includes('motorista');

              if (role === 'LOGISTICA') {
                router.push('/entrega/entregador');
                return;
              } else if (isGestor) {
                setShowMobileHub(true);
                setIsLoggedIn(true);
                return;
              } else if (isTecnico) {
                router.push('/ativos/tecnico');
                return;
              } else if (isEntregador) {
                router.push('/entrega/entregador');
                return;
              } else {
                router.push('/leads/mobile');
                return;
              }
            } else {
              router.push('/leads/mobile');
              return;
            }
          }

          if (user) {
            if (user.role === 'LOGISTICA') {
              router.push('/entrega');
              return;
            }
            const cargoLower = user.cargo?.toLowerCase() || '';
            if (cargoLower.includes('tecnico') || cargoLower.includes('técnico')) {
              router.push('/ativos/tecnico');
              return;
            }
          }

          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <div className="w-[400px] h-[400px] bg-gradient-to-r from-[#1B4D3E] to-[#10B981] rounded-full blur-[100px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#1B4D3E]/30 rounded-2xl border border-[#10B981]/30 flex items-center justify-center animate-spin">
            <TrendingUp className="text-[#10B981]" size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-[#10B981] animate-pulse">Carregando SmartBidHub...</span>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    if (showMobileHub) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans select-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <div className="w-[450px] h-[450px] bg-gradient-to-r from-[#1B4D3E] to-[#10B981] rounded-full blur-[120px] animate-pulse" />
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto pt-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-[#1B4D3E]/30 rounded-2xl border border-[#10B981]/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <TrendingUp className="text-[#10B981]" size={22} />
              </div>
              <span className="text-lg font-black tracking-widest uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                SmartBidHub
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 uppercase font-black tracking-[0.25em] mb-8">
              Painel Multisseletor
            </p>

            <div className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex items-center gap-3.5 backdrop-blur-md mb-8">
              {loggedUser?.avatarUrl ? (
                <img 
                  src={loggedUser.avatarUrl} 
                  alt={loggedUser.nome} 
                  className="w-11 h-11 rounded-full object-cover border border-white/10 shadow-md"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1B4D3E] to-[#10B981] text-white flex items-center justify-center font-black text-sm border border-white/10 shadow-md">
                  {loggedUser?.nome ? loggedUser.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'G'}
                </div>
              )}
              <div className="text-left">
                <h3 className="text-sm font-black uppercase text-white tracking-wide leading-tight">
                  {loggedUser?.nome || 'Carregando Gestor...'}
                </h3>
                <span className="text-[9px] text-[#10B981] uppercase font-black tracking-widest block leading-none mt-1">
                  {loggedUser?.cargo || 'Administrador'}
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left pl-1 mb-1">
                Selecione a área para acessar
              </h4>

              <button
                onClick={() => router.push('/leads/mobile')}
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-[#0F241F] hover:to-[#0A1714] border border-white/5 hover:border-emerald-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform">
                    <Building size={24} className="stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      CRM Comercial
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                      Funil de vendas, leads e chat de equipe
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>

              <button
                onClick={() => router.push('/ativos/tecnico')}
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-[#0E1E2C] hover:to-[#0A141F] border border-white/5 hover:border-blue-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Wrench size={24} className="stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      Área do Técnico
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                      Chamados, ordens de serviço e ativos
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>

              <button
                onClick={() => router.push('/entrega/entregador')}
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-[#241710] hover:to-[#170E0A] border border-white/5 hover:border-amber-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Truck size={24} className="stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide">
                      Controle de Entregas
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                      Roteiros de entregador, rotas e recibos
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto pt-6 border-t border-white/5 flex justify-between items-center text-xs text-slate-500 select-none pb-2">
            <button
              onClick={() => {
                sessionStorage.setItem('sb_mobile_mode', 'desktop');
                window.location.reload();
              }}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-white cursor-pointer"
            >
              Versão Desktop
            </button>

            <a
              href="/api/auth/logout"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-2xl transition-all cursor-pointer font-black uppercase text-[9px] tracking-widest no-underline"
            >
              <LogOut size={12} /> Sair da Conta
            </a>
          </div>
        </div>
      );
    }
    return <RadarComercialDashboard />;
  }

  return <LandingPage />;
}
