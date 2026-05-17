'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  BarChart2, TrendingUp, Users, Clock, DollarSign, 
  ArrowUpRight, Award, Briefcase, Activity, Percent, FileText
} from 'lucide-react';
import { getKPIs } from '@/app/propostas/actions';

export default function ControladoriaPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Controladoria & KPIs</h1>
              <p className="text-slate-500 text-sm mt-1">Painel Analítico de Engenharia de Custos e Performance Comercial</p>
            </div>
            <button 
              onClick={loadData}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded text-xs transition-colors shadow-xs"
            >
              Atualizar Dados
            </button>
          </header>

          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4D3E] mx-auto mb-4"></div>
              <p className="text-slate-400 font-medium">Processando indicadores comerciais...</p>
            </div>
          ) : !kpis ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center shadow-xs">
              <p className="text-red-500 font-bold">Erro ao processar dados de controladoria.</p>
              <p className="text-slate-400 text-xs mt-1">Verifique as permissões de acesso ao banco de dados.</p>
            </div>
          ) : (
            <>
              {/* METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* CARD 1: TICKET MÉDIO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-emerald-50 text-[#1B4D3E] rounded-xl border border-emerald-100">
                      <DollarSign size={20} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Ticket Médio</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {formatCurrency(kpis.ticketMedio)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Média geral por proposta</p>
                  </div>
                </div>

                {/* CARD 2: TAXA DE CONVERSÃO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <Percent size={20} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Conversão</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {kpis.taxaConversao.toFixed(1)}%
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${kpis.taxaConversao}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: VOLUME TOTAL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Volume Total</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {formatCurrency(kpis.totalVolume)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      Aceito: {formatCurrency(kpis.totalAceito)} ({kpis.totalAceitasCount} propostas)
                    </p>
                  </div>
                </div>

                {/* CARD 4: CICLO DE FECHAMENTO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Ciclo Médio</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {kpis.cicloMedio.toFixed(1)} <span className="text-xs font-semibold text-slate-400">dias</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Data de criação até Aceitação</p>
                  </div>
                </div>

              </div>

              {/* DETAILED STATS ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* STATS BY USER */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                    <Users size={16} className="text-[#1B4D3E]" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Performance por Usuário</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200/80">
                          <th className="px-6 py-3.5">Vendedor / Usuário</th>
                          <th className="px-6 py-3.5 text-center">Propostas</th>
                          <th className="px-6 py-3.5 text-right">Volume Total</th>
                          <th className="px-6 py-3.5 text-right">Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {kpis.usuarioStats.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium italic">Nenhum dado cadastrado.</td>
                          </tr>
                        ) : (
                          kpis.usuarioStats.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <div className="w-7 h-7 bg-slate-100 text-slate-700 font-black rounded-lg flex items-center justify-center text-[10px] border border-slate-200">
                                  {item.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-700">{item.nome}</span>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-500">
                                {item.quantidade}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-700">
                                {formatCurrency(item.volume)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-500">
                                {formatCurrency(item.ticketMedio)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* STATS BY SERVICE TYPE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                    <Briefcase size={16} className="text-[#1B4D3E]" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Volume por Tipo de Serviços</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-wider border-b border-slate-200/80">
                          <th className="px-6 py-3.5">Categoria do Serviço</th>
                          <th className="px-6 py-3.5 text-center">Propostas</th>
                          <th className="px-6 py-3.5 text-right">Volume Total</th>
                          <th className="px-6 py-3.5 text-right">Ticket Médio</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-slate-100">
                        {kpis.servicoStats.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium italic">Nenhuma proposta categorizada.</td>
                          </tr>
                        ) : (
                          kpis.servicoStats.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg uppercase tracking-tight text-[10px]">
                                  {item.nome}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-500">
                                {item.quantidade}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-[#1B4D3E]">
                                {formatCurrency(item.volume)}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-slate-500">
                                {formatCurrency(item.ticketMedio)}
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
