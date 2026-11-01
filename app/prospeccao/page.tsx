'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { 
  Search, MapPin, Target, Plus, CheckCircle2, Building2, Phone, 
  Star, Compass, LayoutList, Map as MapIcon, 
  Send, ExternalLink, ShieldCheck, Check, Zap, AlertCircle
} from 'lucide-react';
import { createLead } from '@/app/leads/actions';
import { useRouter } from 'next/navigation';

// Importação dinâmica do mapa Leaflet sem SSR para compatibilidade
const ProspeccaoMap = dynamic(
  () => import('@/components/prospeccao/ProspeccaoMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center border border-slate-200 text-slate-600 gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-600">Carregando Radar de Empresas...</p>
      </div>
    )
  }
);

interface LeadResult {
  id?: string;
  nomeFantasia: string;
  endereco: string;
  telefone: string;
  segmento: string;
  site?: string;
  porte: string;
  avaliacoes: number;
  rating?: number;
  lat?: number;
  lng?: number;
  decisorSugerido?: string;
}

const PRESET_NICHES = [
  { label: 'Condomínios Comerciais', query: 'Condomínio Edifício Comercial Corporativo' },
  { label: 'Clínicas & Hospitais', query: 'Clínicas Médicas e Odontológicas' },
  { label: 'Indústrias & Galpões', query: 'Galpões Logísticos e Indústrias' },
  { label: 'Facilities & Limpeza', query: 'Empresas de Facilities Conservação e Portaria' },
  { label: 'Redes Hoteleiras', query: 'Hotéis e Flats Executivos' },
  { label: 'Colégios & Faculdades', query: 'Colégios Particulares e Universidades' },
];

export default function ProspeccaoPage() {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LeadResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'tabela' | 'mapa'>('tabela');
  const [injecting, setInjecting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [limits, setLimits] = useState<{ searchesCount: number; limitCount: number; isSuperAdmin: boolean } | null>(null);

  const fetchLimits = async () => {
    try {
      const res = await fetch('/api/prospeccao');
      const data = await res.json();
      if (data.success) {
        setLimits({
          searchesCount: data.searchesCount,
          limitCount: data.limitCount,
          isSuperAdmin: data.isSuperAdmin
        });
      }
    } catch (err) {
      console.error('Erro ao buscar limites de prospecção', err);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSearch = async (e?: React.FormEvent, customTermo?: string) => {
    if (e) e.preventDefault();
    const queryTerm = customTermo || termo;
    if (!queryTerm || !localizacao) {
      showNotification('error', 'Preencha o termo da pesquisa e a cidade/bairro!');
      return;
    }
    
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    
    try {
      const res = await fetch('/api/prospeccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo: queryTerm, localizacao })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        fetchLimits();
        showNotification('success', `${data.results?.length || 0} empresas encontradas com sucesso!`);
      } else {
        showNotification('error', data.error || 'Não foi possível completar a busca.');
        fetchLimits();
      }
    } catch (err) {
      showNotification('error', 'Falha na conexão com o servidor de busca.');
    }
    setLoading(false);
  };

  const toggleSelect = (index: number) => {
    const newSet = new Set(selected);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelected(newSet);
  };

  const selectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  };

  const handleInject = async () => {
    if (selected.size === 0) return;
    setInjecting(true);
    
    try {
      const selectedLeads = Array.from(selected).map(i => results[i]);
      let injectedCount = 0;
      
      for (const lead of selectedLeads) {
        const res = await createLead({
          nomeFantasia: lead.nomeFantasia,
          endereco: lead.endereco,
          telefone: lead.telefone,
          segmento: lead.segmento,
          site: lead.site,
          porte: lead.porte,
          avaliacoes: lead.avaliacoes
        });
        if (res.success) injectedCount++;
      }
      
      showNotification('success', `${injectedCount} Leads injetados com sucesso no seu Pipeline!`);
      setResults(prev => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
      
    } catch (error) {
      showNotification('error', 'Erro ao injetar leads no CRM.');
    }
    setInjecting(false);
  };

  const handleInjectSingle = async (lead: LeadResult) => {
    try {
      const res = await createLead({
        nomeFantasia: lead.nomeFantasia,
        endereco: lead.endereco,
        telefone: lead.telefone,
        segmento: lead.segmento,
        site: lead.site,
        porte: lead.porte,
        avaliacoes: lead.avaliacoes
      });
      if (res.success) {
        showNotification('success', `Lead "${lead.nomeFantasia}" injetado no Pipeline!`);
        setResults(prev => prev.filter(item => item.nomeFantasia !== lead.nomeFantasia));
      } else {
        showNotification('error', 'Não foi possível injetar o lead.');
      }
    } catch {
      showNotification('error', 'Erro ao salvar lead.');
    }
  };

  const formatWhatsAppUrl = (phone: string, companyName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá! Localizei a ${companyName} e gostaria de falar com a liderança responsável por Facilities/Contratos.`);
    return `https://wa.me/${fullPhone}?text=${text}`;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative pb-28">
        
        {/* Toast Notificação */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold ${
              notification.type === 'success' 
                ? 'bg-white border-emerald-500 text-emerald-800' 
                : 'bg-white border-rose-500 text-rose-800'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header Superior idêntico ao padrão SmartBid */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                Máquina de Prospecção
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Extraia empresas do Google e injete no seu Funil de Vendas.
              </p>
            </div>

            {/* Card de Cota de Buscas */}
            {limits && !limits.isSuperAdmin && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-end shadow-xs shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Cota de novas buscas este Mês
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-800">{limits.searchesCount}</span>
                  <span className="text-xs text-slate-400">/ {limits.limitCount} buscas</span>
                </div>
                <div className="w-44 bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-100">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      limits.searchesCount >= limits.limitCount ? 'bg-rose-500' :
                      limits.searchesCount > limits.limitCount * 0.8 ? 'bg-amber-500' :
                      'bg-[#1B4D3E]'
                    }`}
                    style={{ width: `${Math.min((limits.searchesCount / limits.limitCount) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card de Busca Principal */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <form onSubmit={e => handleSearch(e)} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-[#1B4D3E]" />
                  O que você procura?
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={termo}
                    onChange={e => setTermo(e.target.value)}
                    placeholder="Ex: Clínicas Odontológicas, Condomínios, Hospitais..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1B4D3E] focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#1B4D3E]" />
                  Onde? (Bairro, Cidade ou Região)
                </label>
                <div className="relative">
                  <Compass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={localizacao}
                    onChange={e => setLocalizacao(e.target.value)}
                    placeholder="Ex: Bairro Batel Curitiba, Centro de São Paulo..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1B4D3E] focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white h-[46px] px-8 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/10 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Procurar</span>
                  </>
                )}
              </button>
            </form>

            {/* Presets de Nichos Rápidos */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Zap size={12} className="text-amber-500" />
                Nichos:
              </span>
              {PRESET_NICHES.map((niche, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTermo(niche.query);
                    if (localizacao) {
                      handleSearch(undefined, niche.query);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#1B4D3E] border border-slate-200 hover:border-emerald-200 transition-all font-medium"
                >
                  {niche.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quando houver resultados */}
          {results.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Cards de Métricas Claros */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Empresas Encontradas
                  </div>
                  <div className="text-3xl font-black text-slate-800">{results.length}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Selecionadas p/ Injetar
                  </div>
                  <div className="text-3xl font-black text-[#1B4D3E]">{selected.size}</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Telefones Verificados
                  </div>
                  <div className="text-3xl font-black text-blue-600">
                    {results.filter(r => r.telefone && r.telefone !== 'Não informado').length}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Média de Avaliações
                  </div>
                  <div className="text-3xl font-black text-amber-500 flex items-baseline gap-1">
                    <span>{(results.reduce((acc, r) => acc + (r.rating || 4.5), 0) / results.length).toFixed(1)}</span>
                    <span className="text-base text-amber-400">★</span>
                  </div>
                </div>
              </div>

              {/* Seletor de Abas Claro integrado ao Sistema */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('tabela')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'tabela'
                        ? 'bg-[#1B4D3E] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutList size={15} />
                    <span>Aba 01: Tabela de Leads</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-white font-mono">
                      {results.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('mapa')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'mapa'
                        ? 'bg-[#1B4D3E] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <MapIcon size={15} />
                    <span>Aba 02: Radar B2B no Mapa</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#1B4D3E] font-bold">
                      AO VIVO
                    </span>
                  </button>
                </div>

                {activeTab === 'tabela' && (
                  <button
                    onClick={selectAll}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} className="text-[#1B4D3E]" />
                    {selected.size === results.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                )}
              </div>

              {/* ABA 01: TABELA DE LEADS */}
              {activeTab === 'tabela' ? (
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Lista de Empresas Encontradas
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {results.map((item, idx) => {
                      const isSelected = selected.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSelect(idx)}
                          className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={13} strokeWidth={3} />}
                          </div>

                          {/* Info da Empresa */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-800 truncate">
                                {item.nomeFantasia}
                              </h4>
                              {item.site && (
                                <a
                                  href={item.site}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  <span>Site</span>
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{item.endereco}</p>
                            <div className="text-[11px] text-[#1B4D3E] font-semibold mt-0.5">
                              Decisor: {item.decisorSugerido || 'Diretor de Operações / Facilities'}
                            </div>
                          </div>

                          {/* Contato & WhatsApp */}
                          <div className="text-right flex flex-col items-end gap-1 shrink-0">
                            <div className="text-xs font-bold text-slate-700">{item.telefone}</div>
                            
                            {item.telefone && item.telefone !== 'Não informado' && (
                              <a
                                href={formatWhatsAppUrl(item.telefone, item.nomeFantasia)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#25D366] hover:underline"
                              >
                                <Send size={11} />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-bold uppercase text-white bg-slate-800 px-2 py-0.5 rounded">
                                Porte {item.porte}
                              </span>
                              <span className="text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {item.avaliacoes} avaliações
                              </span>
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                                {item.rating || 4.8} ★
                              </span>
                            </div>
                          </div>

                          {/* Botão Individual */}
                          <div className="shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleInjectSingle(item)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1B4D3E] text-slate-700 hover:text-white text-xs font-bold transition-all border border-slate-200 hover:border-[#1B4D3E] flex items-center gap-1 cursor-pointer"
                              title="Injetar no Pipeline"
                            >
                              <Plus size={13} />
                              <span>Injetar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ABA 02: RADAR B2B NO MAPA */
                <div className="animate-fadeIn">
                  <ProspeccaoMap
                    leads={results}
                    onInjectLead={handleInjectSingle}
                  />
                </div>
              )}

            </div>
          )}

          {/* Empty State Inicial */}
          {results.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center mx-auto">
                <Compass size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Pronto para rastrear novas contas corporativas?
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Digite o tipo de cliente que você procura e a cidade/bairro. O sistema buscará as empresas no Google com contatos e exibirá na tabela e no mapa.
              </p>
            </div>
          )}

        </div>

        {/* Floating Action Bar quando houver selecionados */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
            <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3.5 shadow-2xl flex items-center gap-6 text-slate-800 min-w-[380px]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-xs">
                  {selected.size}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Empresas Selecionadas</div>
                  <div className="text-[11px] text-slate-500">Prontas para envio ao CRM</div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold px-2 py-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={injecting}
                  onClick={handleInject}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {injecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Injetando...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Injetar {selected.size} no Funil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
