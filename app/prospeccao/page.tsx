'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, MapPin, Target, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { createLead } from '@/app/leads/actions';
import { useRouter } from 'next/navigation';

export default function ProspeccaoPage() {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [injecting, setInjecting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo || !localizacao) return;
    
    setLoading(true);
    setResults([]);
    setSelected(new Set());
    
    try {
      const res = await fetch('/api/prospeccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo, localizacao })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro na busca');
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

  const handleInject = async () => {
    if (selected.size === 0) return;
    setInjecting(true);
    
    try {
      const selectedLeads = Array.from(selected).map(i => results[i]);
      
      let injectedCount = 0;
      for (const lead of selectedLeads) {
        // Envia para o Pipeline (primeira coluna)
        const res = await createLead({
          nomeFantasia: lead.nomeFantasia,
          endereco: lead.endereco,
          telefone: lead.telefone,
          segmento: lead.segmento
        });
        if (res.success) injectedCount++;
      }
      
      alert(`${injectedCount} Leads injetados com sucesso no Pipeline!`);
      
      // Remove da lista os que foram injetados
      setResults(prev => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
      
    } catch (error) {
      alert('Erro ao injetar leads');
    }
    setInjecting(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-black text-slate-800">Máquina de Prospecção</h1>
            <p className="text-slate-500 mt-2">Extraia empresas do Google e injete no seu Funil de Vendas.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={handleSearch} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">O que você procura?</label>
                <div className="relative">
                  <Target size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    value={termo}
                    onChange={e => setTermo(e.target.value)}
                    placeholder="Ex: Clínicas Odontológicas, Condomínios, Hospitais..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Onde?</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    value={localizacao}
                    onChange={e => setLocalizacao(e.target.value)}
                    placeholder="Ex: Bairro Batel Curitiba, Centro de São Paulo..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#1B4D3E] hover:bg-[#13382d] disabled:opacity-50 text-white h-[50px] px-8 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
              >
                {loading ? 'Buscando...' : <><Search size={18} /> Procurar</>}
              </button>
            </form>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <AlertCircle size={14} className="shrink-0" />
              <p>Os resultados são fornecidos pela API do Google Places. Devido à falta da chave configurada, os resultados atuais são demonstrativos.</p>
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700">Resultados Encontrados ({results.length})</h3>
                <button 
                  disabled={selected.size === 0 || injecting}
                  onClick={handleInject}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                >
                  <Plus size={16} /> 
                  {injecting ? 'Injetando...' : `Injetar Selecionados (${selected.size}) no Pipeline`}
                </button>
              </div>
              
              <div className="divide-y divide-slate-100">
                {results.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => toggleSelect(idx)}
                    className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${selected.has(idx) ? 'bg-emerald-50/50' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selected.has(idx) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                      {selected.has(idx) && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.nomeFantasia}</h4>
                      <p className="text-sm text-slate-500">{item.endereco}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-sm font-bold text-slate-700">{item.telefone}</div>
                      <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block mt-1">{item.segmento}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
