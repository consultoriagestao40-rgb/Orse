'use server';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Trash2, Edit2, MapPin, Search, 
  ShieldCheck, UserCheck, Calendar, Filter, FileText, MoreVertical
} from 'lucide-react';
import { getCCTs, deleteCCT } from '@/app/ccts/actions';
import Link from 'next/link';

export default async function AdminCCTPage() {
  const ccts = await getCCTs();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header Superior V4 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciador de Regras (CCT)</h1>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                V4.0 Enterprise
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">Configuração centralizada de pisos, encargos e benefícios por região.</p>
          </div>
          <Link 
            href="/admin/ccts/new/edit"
            className="bg-[#00A36C] hover:bg-[#008f5e] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95 bell-header-spacing"
          >
            <Plus size={18} strokeWidth={3} /> Nova Regra
          </Link>
        </div>

        {/* Card Principal - Estilo Foto 02 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header do Card Integrado (Igual Foto 02) */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-slate-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Sindicatos e Regras Vinculadas</h2>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Total: {ccts.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar por Sindicato ou Região..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium w-64"
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
                {/* Header da Tabela em Verde Escuro (Igual Foto 02) */}
                <tr className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Sindicato / Região</th>
                  <th className="px-6 py-4">Função Principal</th>

                  <th className="px-6 py-4 text-center">Cargos</th>
                  <th className="px-6 py-4 text-center">Última Atualização</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ccts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                      Nenhuma regra técnica cadastrada no sistema.
                    </td>
                  </tr>
                ) : (
                  ccts.map((cct: any) => (
                    <tr key={cct.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm uppercase">{cct.nome || 'SEM NOME'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {cct.uf} - {cct.cidade || 'Todo Estado'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                          Múltiplos
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <UserCheck size={14} className="text-slate-300" />
                            <span className="text-sm font-black text-slate-700">
                              {String(cct.cargos?.length || 0).padStart(2, '0')} Funções
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-sm font-bold text-slate-800">
                             {new Date(cct.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Atualizado</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link 
                            href={`/admin/ccts/${cct.id}/edit`}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </Link>
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

