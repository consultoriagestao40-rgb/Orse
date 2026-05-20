'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  ShieldCheck 
} from 'lucide-react';
import { getProdutos, createProduto, updateProduto, deleteProduto } from '../produtos/actions';

export default function EpisPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const CATEGORIA_EPI = 'EPIs e Uniformes';

  const [formData, setFormData] = useState<{
    id: string;
    descricao: string;
    unidade: string;
    precoUnitario: number | string;
    categoria: string;
  }>({
    id: '',
    descricao: '',
    unidade: 'UN',
    precoUnitario: '',
    categoria: CATEGORIA_EPI
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const prodData = await getProdutos();
    // Filtra apenas EPIs
    setProdutos(prodData.filter((p: any) => p.categoria === CATEGORIA_EPI));
    setLoading(false);
  };

  const filteredProdutos = produtos.filter(p => 
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.codigo).includes(searchTerm)
  );

  const openModal = (produto?: any) => {
    if (produto) {
      setFormData({
        id: produto.id,
        descricao: produto.descricao,
        unidade: produto.unidade,
        precoUnitario: produto.precoUnitario,
        categoria: CATEGORIA_EPI
      });
    } else {
      setFormData({
        id: '',
        descricao: '',
        unidade: 'UN',
        precoUnitario: '',
        categoria: CATEGORIA_EPI
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.descricao) return alert('A descrição é obrigatória.');
    
    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        precoUnitario: Number(formData.precoUnitario) || 0
      };

      let res;
      if (formData.id) {
        res = await updateProduto(formData.id, dataToSave);
      } else {
        res = await createProduto(dataToSave);
      }
      
      if (res && !res.success) {
        alert('Erro ao salvar: ' + (res.error || 'Desconhecido'));
      } else {
        await loadData();
        setIsModalOpen(false);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este EPI/Uniforme?')) {
      setLoading(true);
      await deleteProduto(id);
      await loadData();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck size={22} /> EPIs e Uniformes
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Gestão de Equipamentos de Proteção Individual e Vestuário</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={18} /> Novo EPI/Uniforme
            </button>
          </header>

          <div className="flex justify-between items-center bg-white p-4 border border-slate-300 rounded shadow-sm">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por código ou descrição..." 
                className="w-full bg-slate-50 border border-slate-200 rounded pl-10 pr-4 py-2 text-xs focus:border-[#1B4D3E] outline-none font-bold uppercase transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Total Itens</p>
                <p className="text-lg font-black text-[#1B4D3E]">{produtos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-r border-white/10 w-32"># Código</th>
                  <th className="px-6 py-4 border-r border-white/10">Descrição do Item</th>
                  <th className="px-6 py-4 border-r border-white/10 text-center w-32">Unidade</th>
                  <th className="px-6 py-4 border-r border-white/10 text-right w-40">$ Preço Unit.</th>
                  <th className="px-6 py-4 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && produtos.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando catálogo...</td></tr>
                ) : filteredProdutos.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Nenhum EPI ou Uniforme encontrado.</td></tr>
                ) : (
                  filteredProdutos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded border border-emerald-100 uppercase">
                          EPI-{String(p.codigo).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700 uppercase">{p.descricao}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200">
                          {p.unidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoUnitario)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openModal(p)}
                            className="p-1.5 text-slate-400 hover:text-[#1B4D3E] transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  {formData.id ? <Edit2 size={14} /> : <Plus size={14} />} 
                  {formData.id ? 'Editar EPI/Uniforme' : 'Cadastrar Novo Item'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidade</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                      value={formData.unidade}
                      onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                    >
                      <option value="UN">UN - UNIDADE</option>
                      <option value="PAR">PAR - PAR</option>
                      <option value="CJ">CJ - CONJUNTO</option>
                      <option value="CX">CX - CAIXA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                      value={formData.precoUnitario}
                      onChange={(e) => setFormData({...formData, precoUnitario: e.target.value === '' ? '' : Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase hover:bg-slate-50 rounded transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382d] disabled:opacity-50 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
