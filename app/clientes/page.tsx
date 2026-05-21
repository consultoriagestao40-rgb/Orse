'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Edit2, Building2, Search, 
  Filter, MoreVertical, FileText
} from 'lucide-react';
import { getClientes, deleteCliente } from './actions';
import { useRouter } from 'next/navigation';

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
            className="bg-[#00A36C] hover:bg-[#008f5e] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95"
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
                            <p className="font-bold text-slate-900 text-sm uppercase">{cliente.nomeFantasia || 'SEM NOME'}</p>
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
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => router.push(`/clientes/${cliente.id}/edit`)}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                            <MoreVertical size={18} />
                          </button>
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
