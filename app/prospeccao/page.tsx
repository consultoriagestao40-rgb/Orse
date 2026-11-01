'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { 
  Search, MapPin, Target, Plus, CheckCircle2, Building2, Phone, 
  Globe, Star, Sparkles, Compass, LayoutList, Map as MapIcon, 
  Send, ExternalLink, ShieldCheck, ArrowRight, Zap, RefreshCw, Check
} from 'lucide-react';
import { createLead } from '@/app/leads/actions';
import { useRouter } from 'next/navigation';

// Importação dinâmica do mapa Leaflet sem SSR para evitar erros de renderização no servidor
const ProspeccaoMap = dynamic(
  () => import('@/components/prospeccao/ProspeccaoMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[640px] bg-slate-950 rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20 text-emerald-400 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <Compass className="w-6 h-6 absolute inset-0 m-auto text-emerald-400 animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase text-emerald-300">Carregando Radar Cartográfico B2B...</p>
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
        showNotification('success', `${data.results?.length || 0} oportunidades mapeadas com sucesso!`);
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
      
      showNotification('success', `🔥 ${injectedCount} Leads injetados com sucesso no seu Pipeline de Vendas!`);
      
      // Remove da lista os que foram injetados
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
        showNotification('success', `Lead "${lead.nomeFantasia}" injetado no Funil de Vendas!`);
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
    <div className="flex h-screen bg-[#0A0F1D] text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative pb-28">
        {/* Glow de fundo futurista */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[350px] bg-gradient-to-r from-emerald-600/15 via-teal-500/10 to-cyan-500/10 blur-[120px] pointer-events-none" />
        
        {/* Toast de notificação flutuante */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className={`px-5 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-sm font-semibold ${
              notification.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldCheck className="w-5 h-5 text-rose-400" />}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
          
          {/* Top Header com Cota de Buscas */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-800/80 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SmartBid AI B2B Hunter • Live Google Sync
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Máquina de Prospecção B2B
                <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl">
                Mapeie empresas, decisores e contatos corporativos em qualquer região do Brasil com visão de satélite e injeção direta no Funil de Vendas.
              </p>
            </div>

            {/* Card de Cota de Buscas */}
            {limits && !limits.isSuperAdmin && (
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md min-w-[240px]">
                <div className="flex justify-between items-center text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  <span>Cota Mensal</span>
                  <span className="text-emerald-400 font-bold">{Math.round((limits.searchesCount / limits.limitCount) * 100)}%</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">{limits.searchesCount}</span>
                  <span className="text-xs text-slate-500">/ {limits.limitCount} buscas</span>
                </div>
                <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-700/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      limits.searchesCount >= limits.limitCount ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                      limits.searchesCount > limits.limitCount * 0.8 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                      'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                    }`}
                    style={{ width: `${Math.min((limits.searchesCount / limits.limitCount) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form de Busca e Filtros Rápidos */}
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/90 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <form onSubmit={e => handleSearch(e)} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  O que você procura?
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    required
                    value={termo}
                    onChange={e => setTermo(e.target.value)}
                    placeholder="Ex: Clínicas Médicas, Galpões, Condomínios..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-inner text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Onde? (Bairro, Cidade ou Região)
                </label>
                <div className="relative">
                  <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    required
                    value={localizacao}
                    onChange={e => setLocalizacao(e.target.value)}
                    placeholder="Ex: Batel Curitiba, Av. Paulista SP, Barra RJ..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-inner text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-950 hover:shadow-emerald-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">Rastreando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span className="text-sm">Buscar Leads</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Presets Rápidos de Nicho B2B */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Nichos em Alta:
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
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
                >
                  <span>{niche.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quando houver resultados */}
          {results.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Barra de Métricas dos Resultados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Empresas Mapeadas
                  </div>
                  <div className="text-3xl font-black text-white">{results.length}</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Selecionadas
                  </div>
                  <div className="text-3xl font-black text-cyan-400">{selected.size}</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-teal-400" />
                    Telefones Verificados
                  </div>
                  <div className="text-3xl font-black text-teal-400">
                    {results.filter(r => r.telefone && r.telefone !== 'Não informado').length}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Média de Avaliações
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {(results.reduce((acc, r) => acc + (r.rating || 4.5), 0) / results.length).toFixed(1)} ★
                  </div>
                </div>
              </div>

              {/* Seletor de Abas Premium: Tabela vs Mapa */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 shadow-md">
                
                {/* Abas */}
                <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <button
                    onClick={() => setActiveTab('tabela')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                      activeTab === 'tabela'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <LayoutList className="w-4 h-4" />
                    <span>Aba 01: Tabela de Leads B2B</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/30">
                      {results.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('mapa')}
                    className={`px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                      activeTab === 'mapa'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <MapIcon className="w-4 h-4 text-emerald-400" />
                    <span>Aba 02: Radar B2B no Mapa (Ao Vivo)</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      HUD
                    </span>
                  </button>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {selected.size === results.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
              </div>

              {/* Renderização Condicional das Abas */}
              {activeTab === 'tabela' ? (
                /* ABA 01: TABELA DE LEADS */
                <div className="bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-4 px-5 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={selected.size === results.length && results.length > 0}
                              onChange={selectAll}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                            />
                          </th>
                          <th className="py-4 px-5">Empresa & Decisor Sugerido</th>
                          <th className="py-4 px-5">Localização / Endereço</th>
                          <th className="py-4 px-5">Contato & WhatsApp</th>
                          <th className="py-4 px-5 text-center">Porte & Rating</th>
                          <th className="py-4 px-5 text-right">Ação Rápida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-sm">
                        {results.map((item, idx) => {
                          const isSelected = selected.has(idx);
                          return (
                            <tr
                              key={idx}
                              onClick={() => toggleSelect(idx)}
                              className={`transition-colors cursor-pointer group ${
                                isSelected ? 'bg-emerald-950/30 hover:bg-emerald-950/40' : 'hover:bg-slate-800/40'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-4 px-5 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(idx)}
                                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                                />
                              </td>

                              {/* Empresa & Decisor */}
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-800/30 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-300 text-sm shrink-0">
                                    {item.nomeFantasia.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                                      <span>{item.nomeFantasia}</span>
                                      {item.site && (
                                        <a
                                          href={item.site}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-xs text-emerald-400/90 font-medium flex items-center gap-1.5 mt-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      Decisor: {item.decisorSugerido || 'Diretor de Operações / Facilities'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Endereço */}
                              <td className="py-4 px-5">
                                <div className="text-xs text-slate-300 line-clamp-2 max-w-xs flex items-start gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <span>{item.endereco}</span>
                                </div>
                              </td>

                              {/* Telefone & WhatsApp */}
                              <td className="py-4 px-5">
                                <div className="flex flex-col gap-1">
                                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{item.telefone}</span>
                                  </div>
                                  {item.telefone && item.telefone !== 'Não informado' && (
                                    <a
                                      href={formatWhatsAppUrl(item.telefone, item.nomeFantasia)}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                      <Send className="w-3 h-3 text-emerald-400" />
                                      <span>Abrir WhatsApp</span>
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Porte & Rating */}
                              <td className="py-4 px-5 text-center">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                    Porte {item.porte}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-amber-400">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <span>{item.rating || 4.8}</span>
                                    <span className="text-[10px] text-slate-500">({item.avaliacoes})</span>
                                  </div>
                                </div>
                              </td>

                              {/* Ação Individual */}
                              <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleInjectSingle(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 hover:border-emerald-500 inline-flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Injetar Lead</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ABA 02: RADAR B2B NO MAPA (AO VIVO) */
                <div className="animate-fadeIn">
                  <ProspeccaoMap 
                    leads={results}
                    onInjectLead={handleInjectSingle}
                  />
                </div>
              )}

            </div>
          )}

          {/* Empty State Inicial quando não buscou nada */}
          {results.length === 0 && !loading && (
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-12 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950">
                <Compass className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Pronto para rastrear novas contas corporativas?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Digite o tipo de cliente que você quer atender (ex: Hospitais, Condomínios Comerciais) e a região. 
                O sistema fará o escaneamento por satélite no Google Places e apresentará na tabela e no mapa holográfico.
              </p>
            </div>
          )}

        </div>

        {/* Floating Action Bar fixa quando houver selecionados */}
        {selected.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slideUp">
            <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl flex items-center gap-6 text-white min-w-[420px] max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {selected.size}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Leads Selecionados</div>
                  <div className="text-xs text-slate-400">Prontos para envio ao CRM</div>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-slate-400 hover:text-slate-200 font-semibold px-3 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={injecting}
                  onClick={handleInject}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                >
                  {injecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Injetando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
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
