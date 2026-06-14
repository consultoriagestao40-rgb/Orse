'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit2, Building2, Search, 
  Filter, MoreVertical, FileText, Trash2
} from 'lucide-react';
import { getClientes, deleteCliente } from './actions';
import { useRouter } from 'next/navigation';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getClientes();
      setClientes(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteCliente(id);
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header Superior V4 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciador de Clientes</h1>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                V4.0 Enterprise
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">Cadastro centralizado de clientes e tomadores de serviço.</p>
          </div>
          <button 
            onClick={() => router.push('/clientes/novo')}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95 bell-header-spacing"
          >
            <Plus size={18} strokeWidth={3} /> Novo Cliente
          </button>
        </div>

        {/* Card Principal - Estilo Foto 02 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header do Card Integrado (Igual Foto 02) */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-slate-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Listagem de Clientes</h2>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Total: {clientes.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar proposta ou cliente..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium w-64"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">ID / Cliente</th>
                  <th className="px-6 py-4">Documento / Razão</th>
                  <th className="px-6 py-4 text-center">Contato Principal</th>
                  <th className="px-6 py-4 text-center">Cadastro</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Carregando dados...</td></tr>
                ) : filteredClientes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Nenhum cliente encontrado.</td></tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm uppercase">{cliente.nomeFantasia || 'SEM NOME'}</p>
                              {cliente.segmento && (
                                <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                  {cliente.segmento}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              ID: {cliente.id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm uppercase">{cliente.razaoSocial || 'S/ Razão Social'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">CNPJ: {cliente.cnpj || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-700 uppercase">{cliente.email?.split('@')[0] || '-'}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{cliente.whatsapp || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">
                        {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => router.push(`/clientes/${cliente.id}/edit`)}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit2 size={16} />
                          </button>
                          <div className="relative inline-block text-left">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === cliente.id ? null : cliente.id);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100/50"
                              title="Mais Ações"
                            >
                              <MoreVertical size={18} />
                            </button>
                            
                            {activeMenu === cliente.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenu(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 z-20 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                  <div className="px-3 py-1.5 border-b border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações do Cliente</p>
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      router.push(`/propostas/nova?clientId=${cliente.id}`);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 font-medium transition-colors"
                                  >
                                    <Plus size={14} className="text-emerald-600" />
                                    Nova Proposta FPV
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      router.push(`/clientes/${cliente.id}/edit`);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors"
                                  >
                                    <Edit2 size={14} className="text-slate-500" />
                                    Editar Cliente
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      handleDelete(cliente.id);
                                    }}
                                    className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100 transition-colors"
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                    Excluir Cliente
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
