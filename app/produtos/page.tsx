'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Package, Plus, Pencil, Trash2, Search, X, Check, Tag, Ruler, DollarSign, Hash
} from 'lucide-react';
import { getProdutos, createProduto, updateProduto, deleteProduto } from './actions';

const UNIDADES = ['UN', 'CX', 'PC', 'KG', 'L', 'MT', 'M²', 'PAR', 'FD', 'RL'];
const CATEGORIAS = ['Geral', 'Materiais de Limpeza', 'Máquinas e Equipamentos', 'Descartáveis', 'EPI / Uniforme', 'Serviços'];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatCodigo = (codigo: number) => `PRD-${String(codigo).padStart(4, '0')}`;

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    descricao: '',
    unidade: 'UN',
    precoUnitario: 0,
    categoria: 'Geral',
  });

  const loadProdutos = async () => {
    setLoading(true);
    const data = await getProdutos();
    setProdutos(data);
    setLoading(false);
  };

  useEffect(() => { loadProdutos(); }, []);

  const openModal = (produto?: any) => {
    if (produto) {
      setEditando(produto);
      setForm({
        descricao: produto.descricao,
        unidade: produto.unidade,
        precoUnitario: produto.precoUnitario,
        categoria: produto.categoria,
      });
    } else {
      setEditando(null);
      setForm({ descricao: '', unidade: 'UN', precoUnitario: 0, categoria: 'Geral' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditando(null); };

  const handleSave = async () => {
    if (!form.descricao.trim()) { alert('Informe a descrição do produto.'); return; }
    setSaving(true);
    const data = { ...form, precoUnitario: Number(form.precoUnitario) };
    const res = editando
      ? await updateProduto(editando.id, data)
      : await createProduto(data);
    if (res.success) { closeModal(); loadProdutos(); }
    else alert('Erro: ' + res.error);
    setSaving(false);
  };

  const handleDelete = async (id: string, descricao: string) => {
    if (!confirm(`Excluir o produto "${descricao}"?`)) return;
    const res = await deleteProduto(id);
    if (res.success) loadProdutos();
    else alert('Erro ao excluir: ' + res.error);
  };

  const filtered = produtos.filter(p =>
    p.descricao.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase()) ||
    formatCodigo(p.codigo).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-8">

        {/* HEADER */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1B4D3E] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <Package size={22} className="text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Produtos e Insumos</h1>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  Cadastro de materiais, equipamentos e insumos
                </p>
              </div>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={16} /> Novo Produto
            </button>
          </div>

          {/* BUSCA + STATS */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, descrição ou categoria..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#1B4D3E] shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-center shadow-sm">
                <p className="text-xl font-black text-[#1B4D3E]">{produtos.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cadastrados</p>
              </div>
            </div>
          </div>

          {/* TABELA */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#1B4D3E] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left w-32">
                    <div className="flex items-center gap-1.5"><Hash size={12} /> Código</div>
                  </th>
                  <th className="px-5 py-3.5 text-left">
                    <div className="flex items-center gap-1.5"><Tag size={12} /> Descrição do Produto</div>
                  </th>
                  <th className="px-5 py-3.5 text-center w-32">
                    <div className="flex items-center justify-center gap-1.5"><Ruler size={12} /> Unidade</div>
                  </th>
                  <th className="px-5 py-3.5 text-center w-40">
                    <div className="flex items-center justify-center gap-1.5"><Tag size={12} /> Categoria</div>
                  </th>
                  <th className="px-5 py-3.5 text-right w-40">
                    <div className="flex items-center justify-end gap-1.5"><DollarSign size={12} /> Preço Unit.</div>
                  </th>
                  <th className="px-5 py-3.5 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400 animate-pulse">
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Package size={40} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 font-medium">
                        {search ? 'Nenhum produto encontrado para a busca.' : 'Nenhum produto cadastrado ainda.'}
                      </p>
                      <p className="text-slate-300 text-xs mt-1">Clique em "Novo Produto" para começar.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id} className={`border-b border-slate-100 hover:bg-emerald-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#1B4D3E] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {formatCodigo(p.codigo)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{p.descricao}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                          {p.unidade}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-medium text-slate-500">{p.categoria}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                        {formatCurrency(p.precoUnitario)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(p)}
                            className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.descricao)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
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

        {/* MODAL CRIAR/EDITAR */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-emerald-300" />
                  {editando ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-5">

                {editando && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold text-[#1B4D3E] flex items-center gap-2">
                    <Hash size={12} /> Código: {formatCodigo(editando.codigo)}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição do Produto *</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/30"
                    placeholder="Ex: Álcool Etílico 70%"
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Unidade de Medida</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:border-[#1B4D3E]"
                      value={form.unidade}
                      onChange={e => setForm({ ...form, unidade: e.target.value })}
                    >
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preço Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:border-[#1B4D3E] text-right font-medium"
                      value={form.precoUnitario}
                      onChange={e => setForm({ ...form, precoUnitario: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria</label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:border-[#1B4D3E]"
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check size={15} /> {saving ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
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
