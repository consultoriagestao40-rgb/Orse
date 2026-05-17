'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  BarChart2, TrendingUp, Users, Clock, DollarSign, 
  ArrowUpRight, Award, Briefcase, Activity, Percent, Filter, 
  Calendar, CheckCircle, Edit2, Check, Target
} from 'lucide-react';
import { getKPIs } from '@/app/propostas/actions';

export default function ControladoriaPage() {
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);

  // Filtros
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<'all' | '7' | '30' | 'mes' | 'ano' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Ex: "2026-05"
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Verificação de Perfil Administrador (bloqueia acesso direto via URL)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.role !== 'ADMIN') {
            setIsAdmin(false);
            window.location.href = '/'; // Redireciona para o CRM
          }
        } catch (e) {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Verificando permissões...</span>
        </div>
      </div>
    );
  }


  // Metas por vendedor
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editGoalValue, setEditGoalValue] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getKPIs();
      setKpis(data);
    } catch (e) {
      console.error('Erro ao buscar KPIs:', e);
    } finally {
      setLoading(false);
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


  // Carrega metas do localStorage
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

  const saveGoal = (userName: string, val: number) => {
    const activeMonthKey = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
    const updated = { ...metas, [`${userName}_${activeMonthKey}`]: val };
    setMetas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_kpi_goals', JSON.stringify(updated));
    }
    setEditingUserId(null);
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
    // Converter dataCriacao (UTC/ISO) para string local "YYYY-MM-DD"
    const d = new Date(p.dataCriacao);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dataCriacaoStr = `${y}-${m}-${day}`;
    
    // 1. Filtro por Usuário
    if (userFilter !== 'ALL' && p.usuario !== userFilter) {
      return false;
    }

    // 2. Filtro por Data de Início
    if (startDate && dataCriacaoStr < startDate) {
      return false;
    }

    // 3. Filtro por Data de Fim
    if (endDate && dataCriacaoStr > endDate) {
      return false;
    }

    return true;
  });

  // Re-computar todas as estatísticas principais
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

      // Ciclo de fechamento
      if (p.dataAceitacao) {
        const start = new Date(p.dataCriacao);
        const end = new Date(p.dataAceitacao);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        somaDiasCiclo += dias;
        countDiasCiclo++;
      }
    }

    // Por usuário
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

    // Por tipo de serviço (normalizado com trim e uppercase para agrupamento correto)
    const servico = (p.tipoServicos || 'Outros').trim().toUpperCase();
    if (!volumePorServico[servico]) {
      volumePorServico[servico] = { totalVal: 0, count: 0 };
    }
    volumePorServico[servico].totalVal += valor;
    volumePorServico[servico].count += 1;
  });

  const ticketMedio = totalPropostasCount > 0 ? totalVolume / totalPropostasCount : 0;
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

  // Meta global e geral da empresa (por mês) ou do vendedor selecionado
  const totalMetasEmpresa = totalSellers.reduce((acc: number, nome: string) => {
    if (userFilter !== 'ALL' && nome !== userFilter) return acc;
    const key = `${nome}_${activeMonthKey}`;
    const m = metas[key] !== undefined ? metas[key] : 100000; // Default 100k
    return acc + m;
  }, 0);

  const atingidoGeralPct = totalMetasEmpresa > 0 ? (totalAceito / totalMetasEmpresa) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <BarChart2 size={24} /> Controladoria & KPIs
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Gestão analítica de performance e metas comerciais</p>
            </div>
            <button 
              onClick={loadData}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              Atualizar
            </button>
          </header>

          {/* FILTERS PANEL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Usuário Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtrar por Vendedor</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] transition-all cursor-pointer"
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              >
                <option value="ALL">👥 Todos os Vendedores</option>
                {totalSellers.map((nome: string) => (
                  <option key={nome} value={nome}>👤 {nome}</option>
                ))}
              </select>
            </div>

            {/* Período Preset Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtro de Período</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] transition-all cursor-pointer"
                value={period}
                onChange={e => setPeriod(e.target.value as any)}
              >
                <option value="all">📅 Todos os Períodos (Sem Filtro)</option>
                <option value="mes">📅 Mensal (Escolher Mês)</option>
                <option value="7">📅 Últimos 07 dias</option>
                <option value="30">📅 Últimos 30 dias</option>
                <option value="ano">📅 Este Ano</option>
                <option value="custom">⚙️ Período Personalizado</option>
              </select>
            </div>

            {/* Condicionais de Data/Mês */}
            {period === 'mes' ? (
              <>
                {/* Escolher Mês */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escolher Mês (Meta)</label>
                  <input 
                    type="month"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] transition-all cursor-pointer"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  />
                </div>

                {/* Período Selecionado Read-only */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Período Ativo</label>
                  <div className="w-full bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-500 select-none">
                    {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''} a {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Data Início (datepicker) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Início</label>
                  <input 
                    type="date"
                    disabled={period !== 'custom'}
                    className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] transition-all cursor-pointer"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                {/* Data Fim (datepicker) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Fim</label>
                  <input 
                    type="date"
                    disabled={period !== 'custom'}
                    className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] transition-all cursor-pointer"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}


          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4D3E] mx-auto mb-4"></div>
              <p className="text-slate-400 font-medium">Processando indicadores comerciais...</p>
            </div>
          ) : propostasList.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <p className="text-slate-400 font-bold uppercase tracking-wider">Nenhuma proposta cadastrada no sistema.</p>
              <p className="text-slate-300 text-xs mt-1">Crie propostas para visualizar os KPIs comerciais.</p>
            </div>
          ) : (
            <>
              {/* TARGETS BANNER (Meta Global da Empresa) */}
              <div className="bg-gradient-to-r from-[#1B4D3E] to-[#12362B] rounded-3xl p-6 text-white shadow-[0_8px_30px_rgb(27,77,62,0.15)] border border-emerald-950 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1.5 text-center md:text-left flex-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center justify-center md:justify-start gap-1">
                    <Target size={12} /> Meta Geral da Empresa (Mês)
                  </span>
                  <h2 className="text-xl font-black tracking-tight">Desempenho Comercial Corporativo - {formatMonthYear(activeMonthKey)}</h2>
                  <p className="text-xs text-slate-300 font-medium">
                    Soma de todas as metas individuais vs. Volume convertido nesta consulta.
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full md:w-auto">
                  <div className="text-center md:text-right shrink-0">
                    <p className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Aceito / Meta Geral</p>
                    <p className="text-2xl font-black mt-1">
                      {formatCurrency(totalAceito)} <span className="text-xs font-bold text-emerald-300">/ {formatCurrency(totalMetasEmpresa)}</span>
                    </p>
                  </div>
                  
                  {/* Speedometer (Velocímetro) Gauge */}
                  <div className="flex flex-col items-center shrink-0 select-none mt-2 md:mt-0">
                    <div className="w-44 h-20 overflow-hidden relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                        {/* Semicírculo de Fundo */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#0D2C22"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        {/* Semicírculo Ativo (Preenchimento) */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#34D399"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="125.66"
                          strokeDashoffset={125.66 - (125.66 * Math.min(100, atingidoGeralPct)) / 100}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(52, 211, 153, 0.4))' }}
                        />
                        {/* Ponteiro do Velocímetro */}
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="18"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          transform={`rotate(${((Math.min(100, atingidoGeralPct) / 100) * 180) - 90} 50 50)`}
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3))' }}
                        />
                        {/* Pinos Centrais do Eixo */}
                        <circle cx="50" cy="50" r="4.5" fill="#F59E0B" />
                        <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                      </svg>
                    </div>
                    
                    {/* Rótulos e Percentuais Totalmente Livres de Conflito de Posição */}
                    <div className="text-center mt-2 z-10">
                      <span className="text-xl font-extrabold text-white leading-none block">
                        {atingidoGeralPct.toFixed(1)}%
                      </span>
                      <p className="text-[7px] text-emerald-400 uppercase tracking-widest font-black mt-1">Meta Atingida</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* TICKET MÉDIO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[190px]">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-emerald-50 text-[#1B4D3E] rounded-xl border border-emerald-100 shrink-0">
                      <DollarSign size={18} />
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Ticket Médio</span>
                  </div>
                  <div className="mt-2 flex-1 flex flex-col justify-end">
                    <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
                      {formatCurrency(ticketMedio)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Média geral por proposta</p>
                  </div>
                </div>

                {/* TAXA DE CONVERSÃO VOLUME (R$) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[190px]">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                      <Percent size={18} />
                    </div>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Conversão R$ (Volume)</span>
                  </div>
                  
                  <div className="flex flex-col items-center select-none mt-1">
                    <div className="w-28 h-12 overflow-hidden relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="125.66"
                          strokeDashoffset={125.66 - (125.66 * Math.min(100, taxaConversao)) / 100}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(37, 99, 235, 0.3))' }}
                        />
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="18"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          transform={`rotate(${((Math.min(100, taxaConversao) / 100) * 180) - 90} 50 50)`}
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))' }}
                        />
                        <circle cx="50" cy="50" r="4.5" fill="#F59E0B" />
                        <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                      </svg>
                    </div>
                    
                    {/* Texto com Percentual Totalmente Livre de Overlaps */}
                    <div className="text-center mt-1.5 z-10">
                      <span className="text-lg font-black text-slate-800 leading-none block">
                        {taxaConversao.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* TAXA DE CONVERSÃO PROPOSTAS (QTD) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[190px]">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                      <Percent size={18} />
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Conversão Qtd (Propostas)</span>
                  </div>
                  
                  <div className="flex flex-col items-center select-none mt-1">
                    <div className="w-28 h-12 overflow-hidden relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="125.66"
                          strokeDashoffset={125.66 - (125.66 * Math.min(100, conversaoQuantidade)) / 100}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.3))' }}
                        />
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="18"
                          stroke="#F59E0B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          transform={`rotate(${((Math.min(100, conversaoQuantidade) / 100) * 180) - 90} 50 50)`}
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))' }}
                        />
                        <circle cx="50" cy="50" r="4.5" fill="#F59E0B" />
                        <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                      </svg>
                    </div>
                    
                    {/* Texto com Percentual Totalmente Livre de Overlaps */}
                    <div className="text-center mt-1.5 z-10">
                      <span className="text-lg font-black text-slate-800 leading-none block">
                        {conversaoQuantidade.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* VOLUME TOTAL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[190px]">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                      <TrendingUp size={18} />
                    </div>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Volume Total</span>
                  </div>
                  <div className="mt-2 flex-1 flex flex-col justify-end">
                    <p className="text-xl font-black text-slate-800 tracking-tight leading-none">
                      {formatCurrency(totalVolume)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      Aceito: {formatCurrency(totalAceito)} ({totalAceitasCount} de {totalPropostasCount})
                    </p>
                  </div>
                </div>

                {/* CICLO DE FECHAMENTO */}
                {/* CICLO DE FECHAMENTO (VELOCÍMETRO) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all h-[190px]">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                      <Clock size={18} />
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">Ciclo Médio</span>
                  </div>
                  
                  <div className="flex flex-col items-center select-none mt-1">
                    <div className="w-28 h-12 overflow-hidden relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="125.66"
                          strokeDashoffset={125.66 - (125.66 * Math.min(100, cicloMedio)) / 100}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'drop-shadow(0px 2px 4px rgba(245, 158, 11, 0.3))' }}
                        />
                        <line
                          x1="50"
                          y1="50"
                          x2="50"
                          y2="18"
                          stroke="#EF4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          transform={`rotate(${((Math.min(100, cicloMedio) / 100) * 180) - 90} 50 50)`}
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2))' }}
                        />
                        <circle cx="50" cy="50" r="4.5" fill="#EF4444" />
                        <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                      </svg>
                    </div>
                    
                    {/* Texto com Dias Totalmente Livre de Overlaps */}
                    <div className="text-center mt-1.5 z-10">
                      <span className="text-lg font-black text-slate-800 leading-none block">
                        {cicloMedio.toFixed(1)} <span className="text-xs font-semibold text-slate-400">dias</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* DETAILED STATS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* PERFORMANCE POR USUÁRIO (Com Metas & Conversores) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                    <Users size={16} className="text-[#1B4D3E]" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Desempenho dos Vendedores</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200/80">
                          <th className="px-5 py-3.5">Nome do Vendedor</th>
                          <th className="px-5 py-3.5 text-center">Propostas</th>
                          <th className="px-5 py-3.5 text-right">Volume Aceito</th>
                          <th className="px-5 py-3.5 text-right">Meta Individual ({formatMonthYear(activeMonthKey)})</th>
                          <th className="px-5 py-3.5 text-center w-1/4">Atingimento Meta</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {totalSellers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium italic">Nenhum vendedor encontrado.</td>
                          </tr>
                        ) : (
                          totalSellers
                            .filter((nome: string) => userFilter === 'ALL' || nome === userFilter)
                            .map((nome: string) => {
                            const stats = volumePorUsuario[nome] || { totalVal: 0, totalAceito: 0, count: 0, totalAceitasCount: 0 };
                            const goalKey = `${nome}_${activeMonthKey}`;
                            const metaVal = metas[goalKey] !== undefined ? metas[goalKey] : 100000; // Default 100k
                            const atingidoPct = metaVal > 0 ? (stats.totalAceito / metaVal) * 100 : 0;
                            const isFiltered = userFilter === nome;

                            return (
                              <tr 
                                key={nome} 
                                className={`transition-all ${
                                  isFiltered 
                                    ? 'bg-emerald-50/40 border-l-4 border-emerald-600 font-semibold' 
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="px-5 py-4.5 flex items-center gap-3">
                                  <div className="w-7 h-7 bg-slate-100 text-slate-700 font-black rounded-lg flex items-center justify-center text-[10px] border border-slate-200">
                                    {nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800">{nome}</span>
                                    <div className="text-[9px] uppercase tracking-wider font-black mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                      <span className="text-blue-600">💰 Conv. R$: {stats.totalVal > 0 ? ((stats.totalAceito / stats.totalVal) * 100).toFixed(1) : 0}%</span>
                                      <span className="text-emerald-600">📄 Conv. Qtd: {stats.count > 0 ? ((stats.totalAceitasCount / stats.count) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-5 py-4.5 text-center font-bold text-slate-500">
                                  <div>{stats.count}</div>
                                  <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {totalPropostasCount > 0 ? ((stats.count / totalPropostasCount) * 100).toFixed(1) : 0}%
                                  </div>
                                </td>
                                
                                <td className="px-5 py-4.5 text-right font-black text-slate-800">
                                  <div>{formatCurrency(stats.totalAceito)}</div>
                                  <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {totalAceito > 0 ? `${((stats.totalAceito / totalAceito) * 100).toFixed(1)}% do total` : '0%'}
                                  </div>
                                </td>
                                
                                <td className="px-5 py-4.5 text-right font-extrabold text-slate-600">
                                  {formatCurrency(metaVal)}
                                </td>

                                
                                <td className="px-5 py-4.5">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className={`text-[10px] font-black ${
                                      atingidoPct >= 100 
                                        ? 'text-emerald-600' 
                                        : atingidoPct >= 50 
                                          ? 'text-indigo-600' 
                                          : 'text-amber-500'
                                    }`}>
                                      {atingidoPct.toFixed(1)}%
                                    </span>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                      <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                        atingidoPct >= 100 
                                          ? 'bg-emerald-500' 
                                          : atingidoPct >= 50 
                                            ? 'bg-indigo-500' 
                                            : 'bg-amber-400'
                                      }`} style={{ width: `${Math.min(100, atingidoPct)}%` }}></div>
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

                {/* VOLUME POR TIPO DE SERVIÇOS */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                    <Briefcase size={16} className="text-[#1B4D3E]" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Volume por Tipo de Serviços</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200/80">
                          <th className="px-5 py-3.5">Categoria do Serviço</th>
                          <th className="px-5 py-3.5 text-center">Propostas</th>
                          <th className="px-5 py-3.5 text-right">Volume Total</th>
                          <th className="px-5 py-3.5 text-right">Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {Object.keys(volumePorServico).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-8 text-center text-slate-400 font-medium italic">Nenhuma proposta categorizada nesta consulta.</td>
                          </tr>
                        ) : (
                          Object.entries(volumePorServico).map(([nome, data]) => (
                            <tr key={nome} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-4">
                                <span className="font-extrabold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl uppercase tracking-tighter text-[9px]">
                                  {nome}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <p className="font-bold text-slate-500">{data.count}</p>
                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                  {totalPropostasCount > 0 ? ((data.count / totalPropostasCount) * 100).toFixed(1) : 0}%
                                </p>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <p className="font-black text-[#1B4D3E]">{formatCurrency(data.totalVal)}</p>
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                  {totalVolume > 0 ? ((data.totalVal / totalVolume) * 100).toFixed(1) : 0}% do total
                                </p>
                              </td>
                              <td className="px-5 py-4 text-right font-bold text-slate-500">
                                {formatCurrency(data.count > 0 ? data.totalVal / data.count : 0)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
