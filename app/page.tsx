'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, Filter, 
  Users, TrendingUp, Clock,
  MoreVertical, FileStack, Edit2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPropostas, updatePropostaStatus } from '@/app/propostas/actions';

export default function ProposalsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getPropostas();
    setProposals(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APROVADA': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'EM REVISÃO': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const filteredProposals = proposals.filter(p => 
    p.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic Stats
  const activeCount = proposals.length;
  const monthlyVolume = proposals.reduce((acc, p) => acc + p.valor, 0);
  const clientsCount = new Set(proposals.map(p => p.cliente)).size;
  const revisionCount = proposals.filter(p => p.status === 'EM REVISÃO').length;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Gestão de Propostas</h1>
              <p className="text-slate-500 text-sm mt-1">Engenharia de Custos e Controladoria de Facilities</p>
            </div>
            <button 
              onClick={() => router.push('/propostas/nova')}
              className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={18} /> Nova Proposta
            </button>
          </header>

          {/* Indicadores Rápidos Dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Propostas Ativas', value: activeCount.toString(), icon: FileText, color: 'text-blue-600' },
              { label: 'Volume Mensal', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(monthlyVolume), icon: TrendingUp, color: 'text-[#1B4D3E]' },
              { label: 'Clientes Base', value: clientsCount.toString(), icon: Users, color: 'text-indigo-600' },
              { label: 'Aguardando Revisão', value: revisionCount.toString().padStart(2, '0'), icon: Clock, color: 'text-orange-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-black text-slate-800 leading-none mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Listagem CRM */}
          <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-300 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
              <h2 className="text-sm font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} /> Pipeline de Orçamentos
                <span className="text-[10px] bg-white border border-slate-300 text-slate-500 px-2 py-0.5 rounded ml-2 font-bold">Total: {proposals.length}</span>
              </h2>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Buscar proposta ou cliente..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-500 rounded hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3 w-1/5">ID / Proposta</th>
                    <th className="px-6 py-3 w-1/4">Cliente</th>
                    <th className="px-6 py-3 text-right">Valor Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Versão</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Carregando pipeline...</td>
                    </tr>
                  ) : filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td>
                    </tr>
                  ) : filteredProposals.map((prop) => (
                    <tr key={prop.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-800">{prop.numero}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-medium">{prop.data}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-slate-700">{prop.cliente}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Resp: {prop.usuario}</p>
                      </td>
                      <td className="px-6 py-3 font-bold text-slate-800 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.valor)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input 
                          list={`status-options-${prop.id}`}
                          value={prop.status}
                          onChange={(e) => {
                            setProposals(proposals.map(p => p.id === prop.id ? {...p, status: e.target.value.toUpperCase()} : p));
                          }}
                          onBlur={async (e) => {
                            await updatePropostaStatus(prop.id, e.target.value.toUpperCase());
                            loadData();
                          }}
                          onKeyDown={async (e: any) => {
                             if (e.key === 'Enter') {
                                e.target.blur();
                             }
                          }}
                          className={`w-28 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border outline-none text-center ${getStatusColor(prop.status)}`}
                        />
                        <datalist id={`status-options-${prop.id}`}>
                          <option value="ATIVO" />
                          <option value="EM REVISÃO" />
                          <option value="APROVADA" />
                          <option value="REJEITADA" />
                          <option value="AGUARDANDO CLIENTE" />
                        </datalist>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500">
                          <FileStack size={14} />
                          <span className="text-xs font-bold">v{prop.versao}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                              onClick={() => router.push(`/propostas/nova?id=${prop.id}`)}
                              className="text-slate-400 hover:text-[#1B4D3E] transition-colors p-1"
                              title="Editar Proposta"
                           >
                              <Edit2 size={16} />
                           </button>
                           <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                              <MoreVertical size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
