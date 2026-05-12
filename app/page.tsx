'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, Filter, 
  Users, TrendingUp, Clock,
  MoreVertical, FileStack, Edit2, Settings, X, Trash2, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getPropostas, updatePropostaStatus,
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus,
  deleteProposta, getCurrentUserRole
} from '@/app/propostas/actions';

export default function ProposalsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [userRole, setUserRole] = useState<string>('USER');

  const loadData = async () => {
    setLoading(true);
    const [data, statusData, role] = await Promise.all([
      getPropostas(),
      getPropostaStatuses(),
      getCurrentUserRole()
    ]);
    setProposals(data);
    setStatuses(statusData);
    setUserRole(role);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStatusStyle = (statusNome: string) => {
    const found = statuses.find(s => s.nome === statusNome);
    return found?.color || 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  const filteredProposals = proposals.filter(p => 
    p.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = proposals.length;
  const monthlyVolume = proposals.reduce((acc, p) => acc + p.valor, 0);
  const clientsCount = new Set(proposals.map(p => p.cliente)).size;
  const revisionCount = proposals.filter(p => p.status === 'EM REVISÃO').length;

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await createPropostaStatus(newStatusName);
    setNewStatusName('');
    loadData();
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Remover este status?')) return;
    await deletePropostaStatus(id);
    loadData();
  };

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStatusManager(true)}
                className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-bold py-2.5 px-4 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Settings size={16} /> Gerenciar Status
              </button>
              <button 
                onClick={() => router.push('/propostas/nova')}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Nova Proposta
              </button>
            </div>
          </header>

          {/* Modal Gerenciar Status */}
          {showStatusManager && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={18} className="text-[#1B4D3E]" /> Gerenciar Status de Propostas
                  </h2>
                  <button onClick={() => setShowStatusManager(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Adicionar novo */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do novo status..."
                      value={newStatusName}
                      onChange={e => setNewStatusName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddStatus()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] uppercase"
                    />
                    <button
                      onClick={handleAddStatus}
                      className="bg-[#1B4D3E] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-1 hover:bg-[#13382d]"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  {/* Lista de status existentes */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {statuses.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                        <span className={`text-xs font-bold px-3 py-1 rounded uppercase tracking-wider ${s.color}`}>
                          {s.nome}
                        </span>
                        <button
                          onClick={() => handleDeleteStatus(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          title="Remover status"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    {statuses.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-4 italic">Nenhum status cadastrado.</p>
                    )}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setShowStatusManager(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Indicadores */}
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

          {/* Listagem */}
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
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Carregando pipeline...</td></tr>
                  ) : filteredProposals.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td></tr>
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
                        <select
                          value={prop.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            setProposals(proposals.map(p => p.id === prop.id ? {...p, status: newStatus} : p));
                            await updatePropostaStatus(prop.id, newStatus);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border outline-none cursor-pointer ${getStatusStyle(prop.status)}`}
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.nome}>{s.nome}</option>
                          ))}
                          {/* Garante que o status atual apareça mesmo que não esteja na lista */}
                          {!statuses.find(s => s.nome === prop.status) && (
                            <option value={prop.status}>{prop.status}</option>
                          )}
                        </select>
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
                          {userRole === 'ADMIN' && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Excluir a proposta ${prop.numero} de "${prop.cliente}"? Esta ação não pode ser desfeita.`)) return;
                                const res = await deleteProposta(prop.id);
                                if (res.success) {
                                  loadData();
                                } else {
                                  alert('Erro ao excluir: ' + res.error);
                                }
                              }}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              title="Excluir Proposta (Admin)"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
