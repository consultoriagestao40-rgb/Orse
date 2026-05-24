'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, ArrowLeft, Building2, BookTemplate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getEmpresasEmissoras, getPropostasDisponiveis, getTemplates, createContratoFromFPV } from '../actions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function NovoContrato() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [selectedProposta, setSelectedProposta] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [resEmp, resProp, resTemp] = await Promise.all([
      getEmpresasEmissoras(),
      getPropostasDisponiveis(),
      getTemplates()
    ]);
    if (resEmp.success) setEmpresas(resEmp.data || []);
    if (resProp.success) setPropostas(resProp.data || []);
    if (resTemp.success) setTemplates(resTemp.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!selectedProposta || !selectedEmpresa || !selectedTemplate) {
      return alert('Preencha todos os campos.');
    }
    setSubmitting(true);
    
    // Pegar o valor mensal da proposta selecionada (da última versão)
    const prop = propostas.find(p => p.id === selectedProposta);
    const valorMensal = prop?.versoes?.[0]?.precoVenda || 0;

    const res = await createContratoFromFPV(selectedProposta, selectedEmpresa, selectedTemplate, valorMensal);
    if (res.success) {
      router.push(`/contratos/${res.data?.id}`);
    } else {
      alert('Erro: ' + res.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-2xl">

          <button onClick={() => router.push('/contratos')} className="text-slate-400 hover:text-[#1B4D3E] flex items-center gap-1 text-xs font-bold uppercase mb-6">
            <ArrowLeft size={14} /> Voltar para Contratos
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#1B4D3E] p-6 text-center">
              <h1 className="text-2xl font-black text-white tracking-wider uppercase">Gerar Novo Contrato</h1>
              <p className="text-emerald-100 text-sm mt-1">Vincule uma Proposta (FPV) e crie o documento final</p>
            </div>

            <div className="p-8 space-y-6">
              {loading ? (
                <div className="text-center text-slate-400 py-10">Carregando dados...</div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-[#1B4D3E]" /> Proposta / FPV (Aprovada)
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none"
                      value={selectedProposta}
                      onChange={e => setSelectedProposta(e.target.value)}
                    >
                      <option value="">-- Selecione a FPV Ganhadora --</option>
                      {propostas.map(p => (
                        <option key={p.id} value={p.id}>
                          FPV-{p.numero} | {p.client?.razaoSocial} - {fmt(p.versoes?.[0]?.precoVenda || 0)}
                        </option>
                      ))}
                    </select>
                    {propostas.length === 0 && <p className="text-[10px] text-orange-500 mt-1 font-bold">Não há FPVs sem contrato gerado.</p>}
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Building2 size={16} className="text-[#1B4D3E]" /> Empresa Emissora
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none"
                      value={selectedEmpresa}
                      onChange={e => setSelectedEmpresa(e.target.value)}
                    >
                      <option value="">-- Selecione sua empresa que assinará --</option>
                      {empresas.map(e => (
                        <option key={e.id} value={e.id}>{e.nomeFantasia} ({e.cnpj})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <BookTemplate size={16} className="text-[#1B4D3E]" /> Minuta Padrão (Template)
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none"
                      value={selectedTemplate}
                      onChange={e => setSelectedTemplate(e.target.value)}
                    >
                      <option value="">-- Selecione a minuta padrão --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                    {templates.length === 0 && <p className="text-[10px] text-orange-500 mt-1 font-bold">Nenhuma minuta cadastrada. Cadastre em "Templates".</p>}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={handleCreate}
                      disabled={submitting || !selectedProposta || !selectedEmpresa || !selectedTemplate}
                      className="w-full bg-[#1B4D3E] hover:bg-[#13382d] text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Gerando Contrato e Realizando Merge...' : 'Gerar Contrato'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">Ao gerar o contrato, a FPV e o Template serão mesclados criando um documento único editável.</p>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
