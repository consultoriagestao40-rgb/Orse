'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { 
  BarChart2, TrendingUp, Users, Clock, DollarSign, 
  ArrowUpRight, Award, Briefcase, Activity, Percent, Filter, 
  Calendar, CheckCircle, Edit2, Check, Target, Zap,
  Building, Wrench, Truck, Smartphone, LogOut, RefreshCw,
  ChevronRight, Sparkles, Trophy, ArrowRight, Shield, Layers, Flame,
  PhoneCall, CalendarCheck, FileText, CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getKPIs, getLoggedUser } from '@/app/propostas/actions';

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(30, 58, 138, ${alpha})`;
  const clean = hex.replace('#', '').trim();
  const r = parseInt(clean.substring(0, 2), 16) || 30;
  const g = parseInt(clean.substring(2, 4), 16) || 58;
  const b = parseInt(clean.substring(4, 6), 16) || 138;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function RadarComercialDashboard({ initialBrandColor }: { initialBrandColor?: string }) {
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [kpis, setKpis] = useState<any>(null);

  // Cor dinâmica da marca da empresa
  const [brandColor, setBrandColor] = useState<string>(() => {
    if (initialBrandColor) return initialBrandColor;
    if (typeof window !== 'undefined') {
      try {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
        if (cookie) {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.primaryColor) return parsed.primaryColor;
        }
      } catch {}
    }
    return '#1E3A8A';
  });

  // Filtros - Padrão 'all' para carregar todo o histórico e não zerar conversões
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<'all' | '7' | '30' | 'mes' | 'ano' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartViewMode, setChartViewMode] = useState<'mensal' | 'acumulada'>('mensal');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  // Metas por vendedor
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editGoalValue, setEditGoalValue] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, freshUser] = await Promise.all([
        getKPIs(),
        getLoggedUser()
      ]);
      setKpis(data);

      if (freshUser?.tenant?.primaryColor) {
        setBrandColor(freshUser.tenant.primaryColor);
      }

      if (data?.usuarios) {
        const dbMetas: Record<string, number> = {};
        const activeMonthKey = new Date().toISOString().substring(0, 7);
        data.usuarios.forEach((seller: any) => {
          const goalKey = `${seller.nome}_${activeMonthKey}`;
          if (seller.meta > 0) {
            dbMetas[goalKey] = seller.meta;
          }
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

  const handleSaveInlineGoal = async (userId: string, userName: string) => {
    const clean = editGoalValue.replace(/R\$/gi, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    const parsedNum = Number(clean);
    const val = isNaN(parsedNum) ? 0 : parsedNum;

    const currentMonthKey = new Date().toISOString().substring(0, 7);
    const updatedMetas = { 
      ...metas, 
      [`${userName}_${currentMonthKey}`]: val,
      [`${userName}_default`]: val
    };
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
    const dCriacao = new Date(p.dataCriacao);
    const yC = dCriacao.getFullYear();
    const mC = String(dCriacao.getMonth() + 1).padStart(2, '0');
    const dayC = String(dCriacao.getDate()).padStart(2, '0');
    const dataCriacaoStr = `${yC}-${mC}-${dayC}`;

    let dataAceitacaoStr = '';
    if (p.dataAceitacao) {
      const dAceite = new Date(p.dataAceitacao);
      const yA = dAceite.getFullYear();
      const mA = String(dAceite.getMonth() + 1).padStart(2, '0');
      const dayA = String(dAceite.getDate()).padStart(2, '0');
      dataAceitacaoStr = `${yA}-${mA}-${dayA}`;
    }
    
    if (userFilter !== 'ALL' && p.usuario !== userFilter) return false;

    // Se há filtro por data: entra se foi criada no período OU se foi aceita no período!
    if (startDate) {
      const criadaNoPeriodo = dataCriacaoStr >= startDate && (!endDate || dataCriacaoStr <= endDate);
      const aceitaNoPeriodo = Boolean(dataAceitacaoStr && dataAceitacaoStr >= startDate && (!endDate || dataAceitacaoStr <= endDate));
      if (!criadaNoPeriodo && !aceitaNoPeriodo) {
        return false;
      }
    } else if (endDate) {
      const criadaNoPeriodo = dataCriacaoStr <= endDate;
      const aceitaNoPeriodo = Boolean(dataAceitacaoStr && dataAceitacaoStr <= endDate);
      if (!criadaNoPeriodo && !aceitaNoPeriodo) {
        return false;
      }
    }

    return true;
  });

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

  const currentMonthKey = new Date().toISOString().substring(0, 7);

  const formatMonthYear = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  // Funil de Vendas em Quantidades (Leads, Contatos, Visitas, Propostas, Vendas)
  const rawLeadsList = kpis?.leads || [];
  const filteredLeads = useMemo(() => {
    return rawLeadsList.filter((l: any) => {
      if (userFilter !== 'ALL' && l.usuario !== userFilter) return false;
      const dataCriacaoStr = l.createdAt ? l.createdAt.substring(0, 10) : '';
      if (startDate && endDate) {
        return dataCriacaoStr >= startDate && dataCriacaoStr <= endDate;
      } else if (startDate) {
        return dataCriacaoStr >= startDate;
      } else if (endDate) {
        return dataCriacaoStr <= endDate;
      }
      return true;
    });
  }, [rawLeadsList, userFilter, startDate, endDate]);

  const funnelCounts = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const totalContatos = filteredLeads.filter((l: any) => l.hasContact).length;
    const totalVisitas = filteredLeads.filter((l: any) => l.hasVisita).length;
    const totalPropostas = totalPropostasCount;
    const totalVendas = totalAceitasCount;

    return {
      leads: totalLeads,
      contatos: totalContatos,
      visitas: totalVisitas,
      propostas: totalPropostas,
      vendas: totalVendas,
      // Taxas de conversão entre etapas (%)
      txLeadsParaContato: totalLeads > 0 ? (totalContatos / totalLeads) * 100 : 0,
      txContatoParaVisita: totalContatos > 0 ? (totalVisitas / totalContatos) * 100 : 0,
      txVisitaParaProposta: totalVisitas > 0 ? (totalPropostas / totalVisitas) * 100 : 0,
      txPropostaParaVenda: totalPropostas > 0 ? (totalVendas / totalPropostas) * 100 : 0,
      txGlobalLeadsParaVenda: totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0,
    };
  }, [filteredLeads, totalPropostasCount, totalAceitasCount]);

  // Filtra apenas consultores com atividade comercial real ou metas atribuídas
  const commercialSellers = useMemo(() => {
    const list = totalSellers.filter((s: any) => {
      const stats = volumePorUsuario[s.nome];
      return (stats && stats.count > 0) || (s.meta && s.meta > 0);
    });
    return list.length > 0 ? list : totalSellers;
  }, [totalSellers, volumePorUsuario]);

  // Cálculo de meta da empresa (com base nos consultores comerciais ativos)
  const totalMetasEmpresa = useMemo(() => {
    return commercialSellers.reduce((acc: number, seller: any) => {
      const nome = seller.nome;
      if (userFilter !== 'ALL' && nome !== userFilter) return acc;
      
      const keyMonth = `${nome}_${currentMonthKey}`;
      const keyDefault = `${nome}_default`;
      
      let individualMeta = 100000;
      if (metas[keyMonth] !== undefined && metas[keyMonth] > 0) {
        individualMeta = metas[keyMonth];
      } else if (metas[keyDefault] !== undefined && metas[keyDefault] > 0) {
        individualMeta = metas[keyDefault];
      } else if (seller.meta > 0) {
        individualMeta = seller.meta;
      }

      if (period === 'ano') {
        return acc + (individualMeta * 12);
      }
      return acc + individualMeta;
    }, 0);
  }, [commercialSellers, userFilter, metas, currentMonthKey, period]);

  const atingidoGeralPct = totalMetasEmpresa > 0 ? (totalAceito / totalMetasEmpresa) * 100 : 0;

  // Run-Rate Projeção
  const runRateProjection = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (currentDay > 0 && totalAceito > 0) {
      return (totalAceito / currentDay) * daysInMonth;
    }
    return totalAceito;
  }, [totalAceito]);

  // Gráfico histórico mensal
  const currentYear = new Date().getFullYear();
  const chartMonths: string[] = [];
  for (let i = 0; i < 12; i++) {
    chartMonths.push(`${currentYear}-${String(i + 1).padStart(2, '0')}`);
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
      let matchMonth = false;
      if (p.dataAceitacao) {
        const dA = new Date(p.dataAceitacao);
        const yA = dA.getFullYear();
        const mA = String(dA.getMonth() + 1).padStart(2, '0');
        if (`${yA}-${mA}` === mKey) matchMonth = true;
      } else if (p.dataCriacao) {
        const dC = new Date(p.dataCriacao);
        const yC = dC.getFullYear();
        const mC = String(dC.getMonth() + 1).padStart(2, '0');
        if (`${yC}-${mC}` === mKey) matchMonth = true;
      }

      if (matchMonth) {
        if (userFilter !== 'ALL' && p.usuario !== userFilter) return;
        if (p.isAceito) {
          realizado += p.valor || 0;
        }
      }
    });

    let previsto = 0;
    if (userFilter !== 'ALL') {
      const key = `${userFilter}_${mKey}`;
      const keyDef = `${userFilter}_default`;
      const seller = commercialSellers.find((u: any) => u.nome === userFilter);
      if (metas[key] !== undefined && metas[key] > 0) {
        previsto = metas[key];
      } else if (metas[keyDef] !== undefined && metas[keyDef] > 0) {
        previsto = metas[keyDef];
      } else if (seller?.meta > 0) {
        previsto = seller.meta;
      } else {
        previsto = 100000;
      }
    } else {
      commercialSellers.forEach((seller: any) => {
        const nome = seller.nome;
        const key = `${nome}_${mKey}`;
        const keyDef = `${nome}_default`;
        if (metas[key] !== undefined && metas[key] > 0) {
          previsto += metas[key];
        } else if (metas[keyDef] !== undefined && metas[keyDef] > 0) {
          previsto += metas[keyDef];
        } else if (seller.meta > 0) {
          previsto += seller.meta;
        } else {
          previsto += 100000;
        }
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
      return {
        ...d,
        previsto: accPrevisto,
        realizado: accRealizado,
        atingidoPct: accPrevisto > 0 ? (accRealizado / accPrevisto) * 100 : 0
      };
    });
  }

  const maxFaturamento = Math.max(...chartData.map(d => Math.max(d.previsto, d.realizado)), 50000);
  const maxValY = maxFaturamento * 1.35;
  const maxPct = Math.max(...chartData.map(d => d.atingidoPct), 100);
  const maxPctY = maxPct * 1.30;

  const formatShortCurrency = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  const rankedSellers = useMemo(() => {
    return commercialSellers
      .filter((seller: any) => userFilter === 'ALL' || seller.nome === userFilter)
      .map((seller: any) => {
        const nome = seller.nome;
        const stats = volumePorUsuario[nome] || { totalVal: 0, totalAceito: 0, count: 0, totalAceitasCount: 0 };
        const goalKey = `${nome}_${currentMonthKey}`;
        const keyDef = `${nome}_default`;
        
        let metaVal = 100000;
        if (metas[goalKey] !== undefined && metas[goalKey] > 0) {
          metaVal = metas[goalKey];
        } else if (metas[keyDef] !== undefined && metas[keyDef] > 0) {
          metaVal = metas[keyDef];
        } else if (seller.meta > 0) {
          metaVal = seller.meta;
        }

        const effectiveGoal = period === 'ano' ? metaVal * 12 : metaVal;
        const atingidoPct = effectiveGoal > 0 ? (stats.totalAceito / effectiveGoal) * 100 : 0;
        const conversaoPct = stats.totalVal > 0 ? (stats.totalAceito / stats.totalVal) * 100 : 0;
        return {
          ...seller,
          stats,
          metaVal: effectiveGoal,
          atingidoPct,
          conversaoPct
        };
      })
      .sort((a: any, b: any) => b.stats.totalAceito - a.stats.totalAceito);
  }, [commercialSellers, volumePorUsuario, metas, currentMonthKey, userFilter, period]);

  // Título e subtítulo dinâmico do hero banner
  const heroSubtitle = useMemo(() => {
    if (period === 'all') return 'Histórico Consolidado da Plataforma';
    if (period === 'ano') return `Ano Vigente de ${currentYear}`;
    if (period === 'mes') return formatMonthYear(selectedMonth);
    if (period === '7') return 'Últimos 7 dias';
    if (period === '30') return 'Últimos 30 dias';
    return 'Período Personalizado';
  }, [period, selectedMonth, currentYear]);

  if (!hasLoadedOnce) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex items-center justify-center overflow-hidden font-sans">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center animate-spin"
            style={{ 
              backgroundColor: hexToRgba(brandColor, 0.2),
              border: `1px solid ${hexToRgba(brandColor, 0.4)}`
            }}
          >
            <TrendingUp size={30} style={{ color: brandColor }} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-white animate-pulse">
            Carregando Radar Comercial...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER EXECUTIVO INTEGRADO COM A COR DA MARCA */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span 
                  className="p-2.5 rounded-2xl text-white shadow-md flex items-center justify-center"
                  style={{ backgroundColor: brandColor }}
                >
                  <BarChart2 size={24} />
                </span>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Radar Comercial & KPIs
                  </h1>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">
                    Cockpit executivo de conversão, metas da equipe e inteligência de mercado
                  </p>
                </div>
              </div>
            </div>

            {/* SELETORES E ATUALIZAÇÃO */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* FILTRO DE VENDEDOR */}
              <select 
                className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none shadow-xs cursor-pointer focus:ring-2"
                style={{ outlineColor: brandColor }}
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              >
                <option value="ALL">👥 Toda a Equipe Comercial</option>
                {totalSellers.map((seller: any) => (
                  <option key={seller.id} value={seller.nome}>👤 {seller.nome}</option>
                ))}
              </select>

              {/* SELETOR DE MÊS */}
              {period === 'mes' && (
                <input 
                  type="month"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none shadow-xs cursor-pointer focus:ring-2"
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
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: brandColor }} />
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
                { id: 'all', label: 'Todo o Histórico' },
                { id: 'ano', label: `Ano Vigente (${currentYear})` },
                { id: 'mes', label: '📅 Este Mês' },
                { id: '30', label: '30 Dias' },
                { id: '7', label: '7 Dias' },
                { id: 'custom', label: '⚙️ Personalizado' }
              ].map(item => {
                const isActive = period === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id as any)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer"
                    style={{
                      backgroundColor: isActive ? brandColor : '#F1F5F9',
                      color: isActive ? '#FFFFFF' : '#475569',
                      boxShadow: isActive ? `0 2px 8px ${hexToRgba(brandColor, 0.25)}` : 'none'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              {startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} 
              <span className="mx-1 text-slate-400">até</span> 
              {endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <div 
                className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-4"
                style={{ borderColor: brandColor, borderTopColor: 'transparent' }}
              />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Processando indicadores comerciais...</p>
            </div>
          ) : (propostasList.length === 0 && totalSellers.length === 0) ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <p className="text-slate-500 font-bold uppercase tracking-wider">Nenhuma proposta encontrada para os filtros selecionados.</p>
              <p className="text-slate-400 text-xs mt-1">Crie propostas comerciais para visualizar os KPIs.</p>
            </div>
          ) : (
            <>
              {/* CARD DE DESTAQUE: META GLOBAL CORPORATIVA (NA COR DA MARCA) */}
              <div 
                className="rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${brandColor} 0%, ${hexToRgba(brandColor, 0.88)} 50%, #0F172A 100%)`
                }}
              >
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                  
                  {/* Informações da Meta */}
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-white/15 text-white border border-white/20 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Target size={12} /> Meta Corporativa
                      </span>
                      <span className="text-xs text-white/90 font-semibold">
                        {heroSubtitle}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      Desempenho Comercial & Metas
                    </h2>

                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                      Acompanhamento em tempo real do faturamento convertido pela equipe comercial vs. a meta corporativa estipulada.
                    </p>

                    {/* Projeção e Pipeline Quente */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs">
                        <span className="text-[10px] text-white/70 block uppercase font-black">Projeção Mensal (Run-Rate)</span>
                        <span className="font-extrabold text-white text-sm">{formatCurrency(runRateProjection)}</span>
                      </div>

                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs">
                        <span className="text-[10px] text-white/70 block uppercase font-black">Pipeline em Negociação</span>
                        <span className="font-extrabold text-white text-sm">{formatCurrency(Math.max(0, totalVolume - totalAceito))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Faturamento e Progresso / Taxa de Conversão */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-10 border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-10">
                    
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] uppercase font-black tracking-wider text-white/75 block">
                        {totalMetasEmpresa > 0 ? 'Faturamento Aceito / Meta' : 'Faturamento Convertido'}
                      </span>
                      <p className="text-2xl md:text-3xl font-black text-white mt-1">
                        {formatCurrency(totalAceito)}
                      </p>
                      {totalMetasEmpresa > 0 ? (
                        <p className="text-xs text-white/80 font-bold mt-0.5">
                          Meta: {formatCurrency(totalMetasEmpresa)}
                        </p>
                      ) : (
                        <div className="mt-1 flex flex-col items-center sm:items-end">
                          <span className="text-[11px] text-white/90 font-bold">
                            {totalAceitasCount} {totalAceitasCount === 1 ? 'contrato convertido' : 'contratos convertidos'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById('secao-equipe-metas');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[10px] font-black uppercase text-amber-300 hover:text-amber-200 underline mt-1 cursor-pointer"
                          >
                            + Definir metas da equipe
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Gauge de Progresso ou Conversão */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-36 h-20 overflow-hidden relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth="9"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="9"
                            strokeLinecap="round"
                            strokeDasharray="125.66"
                            strokeDashoffset={125.66 - (125.66 * Math.min(100, totalMetasEmpresa > 0 ? atingidoGeralPct : taxaConversao)) / 100}
                            className="transition-all duration-1000 ease-out"
                          />
                          <line
                            x1="50"
                            y1="50"
                            x2="50"
                            y2="17"
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            transform={`rotate(${((Math.min(100, totalMetasEmpresa > 0 ? atingidoGeralPct : taxaConversao) / 100) * 180) - 90} 50 50)`}
                          />
                          <circle cx="50" cy="50" r="4.5" fill="#F59E0B" />
                          <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
                        </svg>
                      </div>

                      <div className="text-center mt-2">
                        <span className="text-2xl font-black text-white leading-none">
                          {totalMetasEmpresa > 0 ? `${atingidoGeralPct.toFixed(1)}%` : `${taxaConversao.toFixed(1)}%`}
                        </span>
                        <span className="text-[9px] uppercase font-black tracking-wider block mt-1 text-white/80">
                          {totalMetasEmpresa > 0 
                            ? (atingidoGeralPct >= 100 ? '🏆 Meta Batida!' : atingidoGeralPct >= 70 ? '⚡ Ritmo Forte' : 'Em Andamento')
                            : 'Taxa de Conversão'}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* GRID DE KPIS EXECUTIVOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. PIPELINE TOTAL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline Total</span>
                    <span 
                      className="p-2 rounded-xl text-white"
                      style={{ backgroundColor: brandColor }}
                    >
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

                {/* 2. VENDAS FECHADAS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vendas Fechadas</span>
                    <span 
                      className="p-2 rounded-xl"
                      style={{ 
                        backgroundColor: hexToRgba(brandColor, 0.12),
                        color: brandColor 
                      }}
                    >
                      <CheckCircle size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-xl font-black tracking-tight" style={{ color: brandColor }}>
                        {formatCurrency(totalAceito)}
                      </p>
                      {totalMetasEmpresa > 0 && (
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          atingidoGeralPct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {atingidoGeralPct.toFixed(1)}% atingido
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-bold">
                      <span>{totalAceitasCount} {totalAceitasCount === 1 ? 'contrato' : 'contratos'}</span>
                      {totalMetasEmpresa > 0 && (
                        <span>Meta: {formatCurrency(totalMetasEmpresa)}</span>
                      )}
                    </div>
                    {totalMetasEmpresa > 0 && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, atingidoGeralPct)}%`,
                            backgroundColor: atingidoGeralPct >= 100 ? '#10B981' : brandColor 
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. TAXA DE CONVERSÃO EM R$ */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conversão (R$)</span>
                    <span 
                      className="p-2 rounded-xl"
                      style={{ 
                        backgroundColor: hexToRgba(brandColor, 0.12),
                        color: brandColor 
                      }}
                    >
                      <Percent size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xl font-black text-slate-900 tracking-tight">
                        {taxaConversao.toFixed(1)}%
                      </p>
                      <span className="text-[10px] font-black" style={{ color: brandColor }}>Volume</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(100, taxaConversao)}%`,
                          backgroundColor: brandColor 
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* 4. TICKET MÉDIO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ticket Médio</span>
                    <span 
                      className="p-2 rounded-xl"
                      style={{ 
                        backgroundColor: hexToRgba(brandColor, 0.12),
                        color: brandColor 
                      }}
                    >
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

              {/* FUNIL DE VENDAS EM QUANTIDADES (LEADS -> CONTATOS -> VISITAS -> PROPOSTAS -> VENDAS) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span 
                      className="p-2.5 rounded-2xl text-white shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Layers size={18} />
                    </span>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        Funil Comercial de Conversão
                        <span className="text-[10px] font-bold text-slate-500 normal-case bg-slate-100 px-2 py-0.5 rounded-full">
                          Volume em Quantidades
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                        Jornada completa: prospecção, primeiro contato, visitas presenciais, propostas emitidas e fechamento
                      </p>
                    </div>
                  </div>

                  {/* INDICADORES RESUMIDOS DE CONVERSÃO DO FUNIL */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-slate-400 block">Conv. Leads → Vendas</span>
                      <span className="text-xs font-black text-slate-800">{funnelCounts.txGlobalLeadsParaVenda.toFixed(1)}%</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-emerald-600 block">Fechamento Propostas</span>
                      <span className="text-xs font-black text-emerald-700">{funnelCounts.txPropostaParaVenda.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* ETAPAS VISUAIS DO FUNIL CONECTADAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
                  
                  {/* ETAPA 1: LEADS */}
                  <div className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Leads</span>
                      <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Users size={15} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{funnelCounts.leads}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">leads</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Oportunidades no radar</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400">Base total</span>
                      <span className="font-black text-blue-600">100%</span>
                    </div>
                  </div>

                  {/* ETAPA 2: CONTATOS */}
                  <div className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Contatos</span>
                      <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <PhoneCall size={15} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{funnelCounts.contatos}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">contatados</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Primeiro contato ativo</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400">Taxa de contato</span>
                      <span className="font-black text-indigo-600">{funnelCounts.txLeadsParaContato.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* ETAPA 3: VISITAS / REUNIÕES */}
                  <div className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Visitas</span>
                      <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <CalendarCheck size={15} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{funnelCounts.visitas}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">visitas</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Vistorias & reuniões</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400">Contato → Visita</span>
                      <span className="font-black text-amber-600">{funnelCounts.txContatoParaVisita.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* ETAPA 4: PROPOSTAS */}
                  <div className="bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">4. Propostas</span>
                      <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <FileText size={15} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{funnelCounts.propostas}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">emitidas</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Propostas comerciais</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400">Visita → Proposta</span>
                      <span className="font-black text-purple-600">
                        {funnelCounts.visitas > 0 ? `${funnelCounts.txVisitaParaProposta.toFixed(0)}%` : '--'}
                      </span>
                    </div>
                  </div>

                  {/* ETAPA 5: VENDAS (CONTRATOS) */}
                  <div 
                    className="border rounded-2xl p-4 flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: hexToRgba(brandColor, 0.04),
                      borderColor: hexToRgba(brandColor, 0.25)
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: brandColor }}>
                        5. Vendas Fechadas
                      </span>
                      <span 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        <CheckCircle2 size={15} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{funnelCounts.vendas}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">fechamentos</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">Contratos convertidos</p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-500">Conversão Propostas</span>
                      <span className="font-black text-emerald-600">{funnelCounts.txPropostaParaVenda.toFixed(1)}%</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* SEÇÃO PRINCIPAL: RANKING DOS VENDEDORES & MIX DE SERVIÇOS (DIVIDINDO A TELA 50% / 50%) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* TABELA DE DESEMPENHO DOS VENDEDORES (LEADERBOARD) - 50% */}
                <div id="secao-equipe-metas" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between scroll-mt-6">
                  <div>
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="p-2 rounded-xl"
                          style={{ 
                            backgroundColor: hexToRgba(brandColor, 0.12),
                            color: brandColor 
                          }}
                        >
                          <Users size={16} />
                        </span>
                        <div>
                          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Desempenho da Equipe Comercial
                          </h2>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Ranking por faturamento aceito e acompanhamento de metas individuais
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
                                      ? 'bg-blue-50/40 border-l-4 font-semibold' 
                                      : 'hover:bg-slate-50/60'
                                  }`}
                                  style={{
                                    borderLeftColor: isFiltered ? brandColor : 'transparent'
                                  }}
                                >
                                  <td className="px-5 py-3.5 flex items-center gap-3">
                                    <div className="relative">
                                      <div 
                                        className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center border shadow-xs"
                                        style={{
                                          backgroundColor: idx === 0 ? hexToRgba(brandColor, 0.15) : '#F1F5F9',
                                          color: idx === 0 ? brandColor : '#475569',
                                          borderColor: idx === 0 ? hexToRgba(brandColor, 0.3) : '#E2E8F0'
                                        }}
                                      >
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
                                        <span style={{ color: brandColor }}>Conv. R$: {stats.totalVal > 0 ? ((stats.totalAceito / stats.totalVal) * 100).toFixed(0) : 0}%</span>
                                        <span>•</span>
                                        <span className="text-slate-600">Conv. Qtd: {stats.count > 0 ? ((stats.totalAceitasCount / stats.count) * 100).toFixed(0) : 0}%</span>
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
                                          className="w-24 px-2 py-1 border border-slate-300 rounded font-black text-slate-800 text-right outline-none"
                                          style={{ borderColor: brandColor }}
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
                                        title="Clique para editar a meta individual"
                                      >
                                        <span>{seller.metaVal > 0 ? formatCurrency(seller.metaVal) : 'Definir Meta'}</span>
                                        <Edit2 size={12} className="text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity ml-1" />
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-5 py-3.5">
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="flex items-center gap-1">
                                        <span 
                                          className="text-[10px] font-black"
                                          style={{ 
                                            color: seller.metaVal > 0 
                                              ? (seller.atingidoPct >= 100 ? '#10B981' : brandColor) 
                                              : (seller.conversaoPct > 0 ? '#10B981' : '#94A3B8') 
                                          }}
                                        >
                                          {seller.metaVal > 0 
                                            ? `${seller.atingidoPct.toFixed(1)}%` 
                                            : seller.stats.totalVal > 0 
                                              ? `${seller.conversaoPct.toFixed(1)}%` 
                                              : '--'}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                                          {seller.metaVal > 0 ? 'meta' : seller.stats.totalVal > 0 ? 'conv.' : ''}
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                        <div 
                                          className="h-full rounded-full transition-all duration-500" 
                                          style={{ 
                                            width: `${Math.min(100, seller.metaVal > 0 ? seller.atingidoPct : seller.conversaoPct)}%`,
                                            backgroundColor: (seller.metaVal > 0 ? seller.atingidoPct : seller.conversaoPct) >= 100 ? '#10B981' : brandColor
                                          }} 
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
                </div>

                {/* MIX POR CATEGORIA DE SERVIÇOS (COM BARRA DE ROLAGEM) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 shrink-0">
                      <span 
                        className="p-2 rounded-xl"
                        style={{ 
                          backgroundColor: hexToRgba(brandColor, 0.12),
                          color: brandColor 
                        }}
                      >
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

                    <div className="mt-4 space-y-3.5 flex-1 overflow-y-auto max-h-[190px] pr-2">
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
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${Math.min(100, pctTotal)}%`,
                                        backgroundColor: brandColor
                                      }} 
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

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 shrink-0">
                    <span className="font-bold">Total Categorizado:</span>
                    <span className="font-black text-slate-800">{formatCurrency(totalVolume)}</span>
                  </div>
                </div>

              </div>

              {/* GRÁFICO HISTÓRICO DE DESEMPENHO MENSAL COM TOOLTIP INTERATIVO NO HOVER */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow relative">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <BarChart2 size={16} style={{ color: brandColor }} /> Acompanhamento de Metas Mensais
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                      Aponte o cursor sobre as barras para ver os detalhes completos de cada mês
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                    <button
                      onClick={() => setChartViewMode('mensal')}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      style={{
                        backgroundColor: chartViewMode === 'mensal' ? brandColor : 'transparent',
                        color: chartViewMode === 'mensal' ? '#FFFFFF' : '#64748B'
                      }}
                    >
                      📅 Mensal
                    </button>
                    <button
                      onClick={() => setChartViewMode('acumulada')}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      style={{
                        backgroundColor: chartViewMode === 'acumulada' ? brandColor : 'transparent',
                        color: chartViewMode === 'acumulada' ? '#FFFFFF' : '#64748B'
                      }}
                    >
                      📈 Acumulada
                    </button>
                  </div>
                </div>

                {/* CANVAS DO GRÁFICO COM TOOLTIP FLUTUANTE */}
                <div className="w-full overflow-x-auto select-none relative" onMouseLeave={() => setHoveredChartIndex(null)}>
                  
                  {/* FLOATING TOOLTIP CARD */}
                  {hoveredChartIndex !== null && chartData[hoveredChartIndex] && (
                    <div 
                      className="absolute pointer-events-none z-30 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all duration-150 min-w-[220px]"
                      style={{
                        left: `${Math.min(Math.max(12, ((hoveredChartIndex + 0.5) / chartData.length) * 100), 85)}%`,
                        top: '12px',
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                          📅 {formatMonthYear(chartData[hoveredChartIndex].monthKey)}
                        </span>
                        <span 
                          className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: chartData[hoveredChartIndex].atingidoPct >= 100 ? '#10B981' : hexToRgba(brandColor, 0.6),
                            color: '#FFFFFF'
                          }}
                        >
                          {chartData[hoveredChartIndex].atingidoPct.toFixed(1)}% atingido
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#6366F1' }} />
                            Meta Prevista:
                          </span>
                          <span className="font-bold text-white">
                            {formatCurrency(chartData[hoveredChartIndex].previsto)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: brandColor }} />
                            Realizado (Aceito):
                          </span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(chartData[hoveredChartIndex].realizado)}
                          </span>
                        </div>

                        {/* DESTAQUE DE % ATINGIDO DA META NO CORPO DO CARD */}
                        <div className="py-1.5 px-2.5 rounded-xl bg-slate-800/90 border border-slate-700/90 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-amber-400 font-black flex items-center gap-1.5 text-[11px]">
                              <span>🎯</span> % Atingido:
                            </span>
                            <span className="font-black text-amber-300 text-xs">
                              {chartData[hoveredChartIndex].atingidoPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, chartData[hoveredChartIndex].atingidoPct)}%`,
                                backgroundColor: chartData[hoveredChartIndex].atingidoPct >= 100 ? '#10B981' : '#F59E0B'
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-400 font-medium">Saldo / Gap:</span>
                          <span className={`font-black ${
                            chartData[hoveredChartIndex].realizado >= chartData[hoveredChartIndex].previsto 
                              ? 'text-emerald-400' 
                              : 'text-amber-400'
                          }`}>
                            {chartData[hoveredChartIndex].realizado >= chartData[hoveredChartIndex].previsto ? '+' : ''}
                            {formatCurrency(chartData[hoveredChartIndex].realizado - chartData[hoveredChartIndex].previsto)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="min-w-[920px] h-[280px] relative px-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 250">
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
                        const isHovered = hoveredChartIndex === i;
                        
                        const hPrevisto = (d.previsto / maxValY) * 180;
                        const yPrevisto = 200 - hPrevisto;
                        
                        const hRealizado = (d.realizado / maxValY) * 180;
                        const yRealizado = 200 - hRealizado;

                        return (
                          <g key={`bar-${i}`} className="group cursor-pointer">
                            
                            {/* COLUNA DE DESTAQUE NO HOVER */}
                            {isHovered && (
                              <rect
                                x={xCenter - (gap / 2) + 2}
                                y="20"
                                width={gap - 4}
                                height="180"
                                rx="8"
                                fill={hexToRgba(brandColor, 0.08)}
                                className="transition-all"
                              />
                            )}

                            {/* BARRA PREVISTO (META) */}
                            <rect
                              x={xCenter - 11}
                              y={yPrevisto}
                              width="10"
                              height={Math.max(2, hPrevisto)}
                              fill={isHovered ? '#818CF8' : '#6366F1'}
                              rx="3"
                              className="transition-all duration-200"
                            />

                            {/* NÚMERO VERTICAL NO TOPO: META PREVISTA */}
                            {d.previsto > 0 && (
                              <text
                                x={xCenter - 6}
                                y={yPrevisto - 5}
                                transform={`rotate(-90, ${xCenter - 6}, ${yPrevisto - 5})`}
                                textAnchor="start"
                                className="fill-[#6366F1] text-[8px] font-black tracking-tight pointer-events-none select-none"
                                style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(255, 255, 255, 0.95))' }}
                              >
                                {formatShortCurrency(d.previsto)}
                              </text>
                            )}

                            {/* BARRA REALIZADO (ACEITO) */}
                            <rect
                              x={xCenter + 1}
                              y={yRealizado}
                              width="10"
                              height={Math.max(2, hRealizado)}
                              fill={brandColor}
                              rx="3"
                              className="transition-all duration-200"
                              style={{
                                filter: isHovered ? `drop-shadow(0 2px 6px ${hexToRgba(brandColor, 0.4)})` : 'none'
                              }}
                            />

                            {/* NÚMERO VERTICAL NO TOPO: REALIZADO (ACEITO) */}
                            <text
                              x={xCenter + 6}
                              y={d.realizado > 0 ? yRealizado - 5 : 195}
                              transform={`rotate(-90, ${xCenter + 6}, ${d.realizado > 0 ? yRealizado - 5 : 195})`}
                              textAnchor="start"
                              className={`text-[8px] font-black tracking-tight pointer-events-none select-none ${
                                d.realizado > 0 ? 'fill-blue-900' : 'fill-slate-400'
                              }`}
                              style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(255, 255, 255, 0.95))' }}
                            >
                              {d.realizado > 0 ? formatShortCurrency(d.realizado) : 'R$ 0'}
                            </text>
                            
                            {/* RÓTULO DO MÊS */}
                            <text 
                              x={xCenter} 
                              y="218" 
                              textAnchor="middle" 
                              className={`text-[9px] font-black uppercase tracking-wider transition-colors ${
                                isHovered ? 'fill-slate-900 font-extrabold' : 'fill-slate-600'
                              }`}
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

                            {/* OVERLAY INVISÍVEL PARA CAPTURAR HOVER EM TODA A ALTURA DA COLUNA */}
                            <rect
                              x={xCenter - (gap / 2)}
                              y="0"
                              width={gap}
                              height="240"
                              fill="transparent"
                              onMouseEnter={() => setHoveredChartIndex(i)}
                            />
                          </g>
                        );
                      })}

                      {/* LINHA DE TENDÊNCIA (% ATINGIMENTO) */}
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
                            />
                            
                            {chartData.map((d, i) => {
                              const gap = 860 / chartData.length;
                              const xCenter = 70 + (i * gap) + (gap / 2);
                              const hPct = (d.atingidoPct / maxPctY) * 180;
                              const yCoord = 200 - hPct;
                              const isHovered = hoveredChartIndex === i;
                              
                              return (
                                <g 
                                  key={`dot-${i}`} 
                                  className="group cursor-pointer"
                                  onMouseEnter={() => setHoveredChartIndex(i)}
                                >
                                  <circle
                                    cx={xCenter}
                                    cy={yCoord}
                                    r={isHovered ? 6 : 4}
                                    fill="#F59E0B"
                                    stroke="#FFFFFF"
                                    strokeWidth={isHovered ? 2.5 : 2}
                                    className="transition-all duration-150"
                                  />
                                  <text
                                    x={xCenter}
                                    y={yCoord - 8}
                                    textAnchor="middle"
                                    className="fill-amber-600 text-[8px] font-black pointer-events-none select-none"
                                    style={{ filter: 'drop-shadow(0px 1px 2px rgba(255, 255, 255, 0.95))' }}
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
                      <span 
                        className="w-3.5 h-3.5 rounded-md block shadow-xs"
                        style={{ backgroundColor: '#6366F1' }}
                      />
                      <span className="text-slate-600">Previsto (Meta)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3.5 h-3.5 rounded-md block shadow-xs"
                        style={{ backgroundColor: brandColor }}
                      />
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.cookie.includes('sb_user=');
    }
    return false;
  });
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


  if (isLoggedIn) {
    if (showMobileHub) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans select-none">
          <div className="relative z-10 w-full max-w-md mx-auto pt-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-2xl border border-blue-400/30 flex items-center justify-center shadow-lg">
                <TrendingUp className="text-blue-400" size={22} />
              </div>
              <span className="text-lg font-black tracking-widest uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                SmartBidHub
              </span>
            </div>
            <p className="text-[10px] text-blue-400 uppercase font-black tracking-[0.25em] mb-8">
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
                <div className="w-11 h-11 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-sm border border-white/10 shadow-md">
                  {loggedUser?.nome ? loggedUser.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'G'}
                </div>
              )}
              <div className="text-left">
                <h3 className="text-sm font-black uppercase text-white tracking-wide leading-tight">
                  {loggedUser?.nome || 'Carregando Gestor...'}
                </h3>
                <span className="text-[9px] text-blue-400 uppercase font-black tracking-widest block leading-none mt-1">
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
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-blue-950/40 hover:to-slate-900 border border-white/5 hover:border-blue-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
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
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>

              <button
                onClick={() => router.push('/ativos/tecnico')}
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-blue-950/40 hover:to-slate-900 border border-white/5 hover:border-blue-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
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
                className="w-full text-left bg-gradient-to-r from-slate-900 to-slate-950 hover:from-amber-950/40 hover:to-slate-900 border border-white/5 hover:border-amber-500/20 active:scale-[0.98] transition-all rounded-3xl p-5 flex items-center justify-between group cursor-pointer backdrop-blur-md"
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
    return <RadarComercialDashboard initialBrandColor={loggedUser?.tenant?.primaryColor} />;
  }

  return <LandingPage />;
}
