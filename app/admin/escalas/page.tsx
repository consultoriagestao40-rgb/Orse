'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { getEscalas, createEscala, updateEscala, deleteEscala } from '@/app/escalas/actions';
import { CalendarDays, Plus, Search, Edit2, Trash2, X, Save, Filter, MoreVertical, FileText } from 'lucide-react';

export default function EscalasPage() {
  const [escalas, setEscalas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    diasTrabalhadosMes: 22,
    horasMensais: 220
  });

  useEffect(() => {
    loadEscalas();
  }, []);

  const loadEscalas = async () => {
    setLoading(true);
    const data = await getEscalas();
    setEscalas(data);
    setLoading(false);
  };

  const filteredEscalas = escalas.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (escala?: any) => {
    if (escala) {
      setFormData({
        id: escala.id,
        nome: escala.nome,
        diasTrabalhadosMes: escala.diasTrabalhadosMes,
        horasMensais: escala.horasMensais
      });
    } else {
      setFormData({
        id: '',
        nome: '',
        diasTrabalhadosMes: 22,
        horasMensais: 220
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return alert('O nome da escala é obrigatório.');
    
    setLoading(true);
    if (formData.id) {
      await updateEscala(formData.id, formData);
    } else {
      await createEscala(formData);
    }
    await loadEscalas();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta escala?')) {
      setLoading(true);
      await deleteEscala(id);
      await loadEscalas();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header Superior V4 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciador de Escalas</h1>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                V4.0 Enterprise
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">Cadastro centralizado de jornadas de trabalho.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-[#00A36C] hover:bg-[#008f5e] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Nova Escala
          </button>
        </div>

        {/* Card Principal - Estilo Foto 02 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header do Card Integrado (Igual Foto 02) */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <CalendarDays size={20} className="text-slate-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Listagem de Escalas</h2>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Total: {escalas.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar escala..." 
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium w-64"
                  value={searchTerm}
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
                  <th className="px-6 py-4">ID / Escala</th>
                  <th className="px-6 py-4 text-center">Dias Trab. / Mês</th>
                  <th className="px-6 py-4 text-center">Carga Horária</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && escalas.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Carregando escalas...</td></tr>
                ) : filteredEscalas.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium italic">Nenhuma escala encontrada.</td></tr>
                ) : (
                  filteredEscalas.map((escala) => (
                    <tr key={escala.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm uppercase">{escala.nome || 'SEM NOME'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              ID: {escala.id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-700">{escala.diasTrabalhadosMes}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Dias Úteis</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-700">{escala.horasMensais}h</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Mensais</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-1 rounded-md border border-emerald-100 uppercase">
                          Ativa
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openModal(escala)}
                            className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {formData.id ? 'Editar Escala' : 'Nova Escala'}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">Configurações de Jornada</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Nome da Escala
                </label>
                <input
                  type="text"
                  placeholder="Ex: Escala 5x2 Comercial"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#00A36C] transition-all"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Dias Trab. (Mês)
                  </label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#00A36C] transition-all"
                    value={formData.diasTrabalhadosMes}
                    onChange={(e) => setFormData({...formData, diasTrabalhadosMes: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Horas Mensais
                  </label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#00A36C] transition-all"
                    value={formData.horasMensais}
                    onChange={(e) => setFormData({...formData, horasMensais: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-sm font-black text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-[#1B4D3E] hover:bg-[#143a2e] text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Salvando...' : <><Save size={18} strokeWidth={3} /> Salvar Escala</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
