'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Boxes, Globe, Sparkles, Loader2, ExternalLink, Check, TrendingDown, BarChart3
} from 'lucide-react';
import { getProdutos, createProduto, updateProduto, deleteProduto } from './actions';
import { getCategorias } from '../admin/settings/actions';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    categoria: ''
  });

  // Estados para Cotação de Preço na Web (IA)
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webPriceResult, setWebPriceResult] = useState<any | null>(null);
  const [webPriceError, setWebPriceError] = useState<string | null>(null);
  const [quickWebProduct, setQuickWebProduct] = useState<any | null>(null);
  const [savingQuickPrice, setSavingQuickPrice] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [prodData, catData] = await Promise.all([
      getProdutos(),
      getCategorias()
    ]);
    setProdutos(prodData);
    setCategorias(catData);

    if (catData.length > 0 && !formData.categoria) {
      setFormData(prev => ({ ...prev, categoria: catData[0].nome }));
    }
    
    setLoading(false);
  };

  const filteredProdutos = produtos.filter(p => 
    p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.codigo).includes(searchTerm) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (produto?: any) => {
    setWebPriceResult(null);
    setWebPriceError(null);
    if (produto) {
      setFormData({
        id: produto.id,
        descricao: produto.descricao,
        unidade: produto.unidade,
        precoUnitario: produto.precoUnitario,
        categoria: produto.categoria
      });
    } else {
      setFormData({
        id: '',
        descricao: '',
        unidade: 'UN',
        precoUnitario: '',
        categoria: categorias.length > 0 ? categorias[0].nome : 'Geral'
      });
    }
    setIsModalOpen(true);
  };

  const handleWebPriceLookup = async (descricao: string, unidade?: string) => {
    if (!descricao || descricao.trim().length < 2) {
      setWebPriceError('Digite a descrição do produto antes de pesquisar preços na web.');
      return;
    }
    try {
      setWebSearchLoading(true);
      setWebPriceError(null);
      setWebPriceResult(null);
      const res = await fetch('/api/produtos/price-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: descricao.trim(), unidade: unidade || 'UN' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setWebPriceError(json.error || 'Não foi possível buscar preços para este item.');
        return;
      }
      setWebPriceResult(json);
    } catch (err: any) {
      setWebPriceError(err?.message || 'Erro de conexão ao consultar preços na web.');
    } finally {
      setWebSearchLoading(false);
    }
  };

  const openQuickWebQuote = (produto: any) => {
    setQuickWebProduct(produto);
    setWebPriceResult(null);
    setWebPriceError(null);
    handleWebPriceLookup(produto.descricao, produto.unidade);
  };

  const applyQuickWebPrice = async (newPrice: number) => {
    if (!quickWebProduct) return;
    try {
      setSavingQuickPrice(true);
      await updateProduto(quickWebProduct.id, {
        descricao: quickWebProduct.descricao,
        unidade: quickWebProduct.unidade,
        categoria: quickWebProduct.categoria,
        precoUnitario: Number(newPrice),
      });
      await loadData();
      setQuickWebProduct(null);
      setWebPriceResult(null);
    } catch (err) {
      console.error('Erro ao atualizar preço rápido:', err);
    } finally {
      setSavingQuickPrice(false);
    }
  };

  const handleSave = async () => {
    if (!formData.descricao) return alert('A descrição é obrigatória.');
    
    setLoading(true);

    const dataToSave = {
      ...formData,
      precoUnitario: Number(formData.precoUnitario) || 0
    };

    if (formData.id) {
      await updateProduto(formData.id, dataToSave);
    } else {
      await createProduto(dataToSave);
    }
    await loadData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setLoading(true);
      await deleteProduto(id);
      await loadData();
    }
  };

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER PADRÃO DASHBOARD */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <Boxes size={22} /> Produtos e Insumos
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Gestão de materiais, equipamentos, insumos operacionais e cotação de preços na web</p>
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors bell-header-spacing"
            >
              <Plus size={18} /> Novo Produto
            </button>
          </header>

          {/* BARRA DE FERRAMENTAS PADRÃO */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-300 rounded shadow-sm">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por código, descrição ou categoria..." 
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

          {/* TABELA PADRÃO DASHBOARD */}
          <div className="bg-white border border-slate-300 rounded shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 border-r border-white/10 w-32"># Código</th>
                  <th className="px-6 py-4 border-r border-white/10">Descrição do Produto</th>
                  <th className="px-6 py-4 border-r border-white/10 text-center w-32">Unidade</th>
                  <th className="px-6 py-4 border-r border-white/10 text-center w-48">Categoria</th>
                  <th className="px-6 py-4 border-r border-white/10 text-right w-40">$ Preço Unit.</th>
                  <th className="px-6 py-4 text-center w-40">Ações & Cotação Web</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && produtos.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando catálogo...</td></tr>
                ) : filteredProdutos.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">Nenhum produto encontrado.</td></tr>
                ) : (
                  filteredProdutos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded border border-emerald-100 uppercase">
                          PRD-{String(p.codigo).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-700 uppercase">{p.descricao}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200">
                          {p.unidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase">{p.categoria}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">
                        {formatBRL(p.precoUnitario)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openQuickWebQuote(p)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] border border-emerald-200 rounded text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                            title="Pesquisar Preço Mínimo e Médio na Web"
                          >
                            <Globe size={12} /> Cotar Web
                          </button>
                          <button 
                            onClick={() => openModal(p)}
                            className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors"
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

        {/* MODAL DE COTAÇÃO RÁPIDA NA WEB (DIRETO DA TABELA) */}
        {quickWebProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300">
              <div className="bg-[#1B4D3E] px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Globe size={15} className="text-emerald-300" /> Pesquisa de Preços na Web em Tempo Real
                  </h2>
                  <p className="text-[11px] text-emerald-200 font-bold mt-0.5 uppercase">{quickWebProduct.descricao}</p>
                </div>
                <button onClick={() => setQuickWebProduct(null)} className="text-white/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {webSearchLoading ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 size={28} className="animate-spin text-[#1B4D3E] mx-auto" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Consultando preços no Google Shopping e fornecedores web...</p>
                  </div>
                ) : webPriceError ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                    {webPriceError}
                  </div>
                ) : webPriceResult ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Preço Atual (Sistema)</span>
                        <span className="text-base font-black text-slate-800 block mt-1">{formatBRL(quickWebProduct.precoUnitario)}</span>
                        <span className="text-[10px] text-slate-400 block mt-1">Valor registrado</span>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-emerald-700 uppercase flex items-center justify-center gap-1">
                            <TrendingDown size={12} /> Preço Mínimo
                          </span>
                          <span className="text-base font-black text-emerald-900 block mt-1">{formatBRL(webPriceResult.precoMinimo)}</span>
                        </div>
                        <button
                          disabled={savingQuickPrice}
                          onClick={() => applyQuickWebPrice(webPriceResult.precoMinimo)}
                          className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase py-1.5 rounded-lg transition-colors"
                        >
                          Usar Mínimo
                        </button>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-blue-700 uppercase flex items-center justify-center gap-1">
                            <BarChart3 size={12} /> Preço Médio
                          </span>
                          <span className="text-base font-black text-blue-900 block mt-1">{formatBRL(webPriceResult.precoMedio)}</span>
                        </div>
                        <button
                          disabled={savingQuickPrice}
                          onClick={() => applyQuickWebPrice(webPriceResult.precoMedio)}
                          className="mt-2 w-full bg-[#1B4D3E] hover:bg-[#13382d] text-white text-[10px] font-black uppercase py-1.5 rounded-lg transition-colors"
                        >
                          Usar Preço Médio
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Ofertas Encontradas na Web ({webPriceResult.ofertas?.length || 0})
                      </h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        {(webPriceResult.ofertas || []).map((of: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 truncate">{of.titulo}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{of.loja}</span>
                                {of.link && (
                                  <a
                                    href={of.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-700 hover:underline inline-flex items-center gap-0.5 font-bold"
                                  >
                                    Ver oferta <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-black text-slate-900">{formatBRL(of.preco)}</span>
                              <button
                                disabled={savingQuickPrice}
                                onClick={() => applyQuickWebPrice(of.preco)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-[#1B4D3E] hover:text-white text-slate-700 rounded text-[10px] font-bold uppercase transition-colors"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* MODAL PADRÃO NOVO / EDITAR PRODUTO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300">
              <div className="bg-[#1B4D3E] px-6 py-3.5 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  {formData.id ? <Edit2 size={14} /> : <Plus size={14} />} 
                  {formData.id ? 'Editar Produto' : 'Cadastrar Novo Item'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição do Produto</label>
                    <button
                      type="button"
                      onClick={() => handleWebPriceLookup(formData.descricao, formData.unidade)}
                      disabled={webSearchLoading}
                      className="text-[10px] font-black text-[#1B4D3E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md uppercase flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {webSearchLoading ? <Loader2 size={11} className="animate-spin" /> : <Globe size={11} />}
                      {webSearchLoading ? 'Buscando na Web...' : 'Pesquisar Preço na Web'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Papel Toalha Interfolha 1000 folhas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>

                {webPriceError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                    {webPriceError}
                  </div>
                )}

                {webPriceResult && (
                  <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Referência de Preços na Web ({webPriceResult.totalOfertas} ofertas)
                      </span>
                      <button
                        type="button"
                        onClick={() => setWebPriceResult(null)}
                        className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Preço Atual</span>
                        <span className="text-sm font-black text-slate-700 block mt-0.5">
                          {formData.precoUnitario ? formatBRL(Number(formData.precoUnitario)) : 'R$ 0,00'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, precoUnitario: webPriceResult.precoMinimo })}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg p-2.5 text-center transition-all"
                      >
                        <span className="text-[9px] font-black text-emerald-700 uppercase block">Mínimo (Clique p/ usar)</span>
                        <span className="text-sm font-black text-emerald-900 block mt-0.5">{formatBRL(webPriceResult.precoMinimo)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, precoUnitario: webPriceResult.precoMedio })}
                        className="bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg p-2.5 text-center transition-all"
                      >
                        <span className="text-[9px] font-black text-blue-700 uppercase block">Médio (Clique p/ usar)</span>
                        <span className="text-sm font-black text-blue-900 block mt-0.5">{formatBRL(webPriceResult.precoMedio)}</span>
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                      {(webPriceResult.ofertas || []).slice(0, 6).map((of: any, idx: number) => (
                        <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-700 truncate text-[11px]">{of.titulo}</p>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{of.loja}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-slate-800 text-[11px]">{formatBRL(of.preco)}</span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, precoUnitario: of.preco })}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-[#1B4D3E] hover:text-white text-[#1B4D3E] border border-emerald-200 rounded text-[9px] font-black uppercase transition-colors"
                            >
                              Usar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidade de Medida</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                      value={formData.unidade}
                      onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                    >
                      <option value="UN">UN - UNIDADE</option>
                      <option value="CX">CX - CAIXA</option>
                      <option value="KG">KG - QUILOGRAMA</option>
                      <option value="L">L - LITRO</option>
                      <option value="MT">MT - METRO</option>
                      <option value="M2">M2 - METRO QUADRADO</option>
                      <option value="PAR">PAR - PAR</option>
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

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria do Produto</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    {categorias.length === 0 ? (
                      <option value="Geral">GERAL (CADASTRE EM CONFIGURAÇÕES)</option>
                    ) : (
                      categorias.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))
                    )}
                  </select>
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
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382d] text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <Save size={18} /> Salvar Produto
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
