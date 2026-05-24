'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, ArrowLeft, Save, Printer, Building2, Tag, Trash2, ShieldCheck } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getDocumentoPropostaById, updateDocumentoStatus, updateSecaoDocumento, deleteDocumentoProposta } from '../actions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function DocumentoPropostaDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('');
  const [secoes, setSecoes] = useState<{id: string; titulo: string; texto: string}[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res: any = await getDocumentoPropostaById(id);
    if (res) {
      setDoc(res);
      setStatus(res.status);
      setSecoes(res.secoes || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    // Salvar status
    if (status !== doc.status) {
      await updateDocumentoStatus(id, status);
    }
    // Salvar seções
    for (const secao of secoes) {
      await updateSecaoDocumento(secao.id, secao.texto);
    }
    alert('Proposta Comercial atualizada com sucesso!');
    setSaving(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta proposta comercial?')) {
      setSaving(true);
      const res = await deleteDocumentoProposta(id);
      if (res.success) {
        router.push('/propostas-comerciais');
      } else {
        alert('Erro ao excluir: ' + res.error);
        setSaving(false);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Carregando...</div>;
  if (!doc) return <div className="p-10 text-center text-red-500">Documento não encontrado.</div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">

          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <button onClick={() => router.push('/propostas-comerciais')} className="flex items-center text-slate-500 hover:text-[#1B4D3E] font-bold text-xs mb-2 transition-colors uppercase tracking-wider">
                <ArrowLeft size={14} className="mr-1" /> Voltar para Propostas Comerciais
              </button>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                Proposta Comercial - FPV #{doc.proposta?.numero}
              </h1>
              <p className="text-slate-500 text-sm mt-1">{doc.client?.razaoSocial || doc.client?.nomeFantasia}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                title="Excluir Proposta"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => window.open(`/propostas-comerciais/${id}/print`, '_blank')}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Printer size={18} /> Gerar PDF
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LADO ESQUERDO */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Detalhes Gerais
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status da Proposta</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    >
                      <option value="Rascunho">Rascunho</option>
                      <option value="Enviada">Enviada ao Cliente</option>
                      <option value="Aprovada">Aprovada (Ganha)</option>
                      <option value="Recusada">Recusada (Perdida)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente Vinculado</label>
                    <div className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-500">
                      {doc.client?.nomeFantasia}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa Emissora</label>
                    <div className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-500">
                      {doc.empresaEmissora?.nomeFantasia}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total (FPV)</label>
                    <div className="w-full border border-emerald-200 bg-emerald-50 rounded-lg p-2 text-sm font-black text-emerald-800">
                      {fmt(doc.valorTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: EDITOR DE SEÇÕES */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Corpo da Proposta</h2>
                <div className="text-[10px] font-bold text-slate-400 max-w-sm text-right">
                  Tags de Texto: [CLIENTE_NOME], [VALOR_TOTAL]<br/>
                  Tags de Tabelas: <strong className="text-emerald-600">[TABELA]</strong>, <strong className="text-emerald-600">[ITENS]</strong>, <strong className="text-emerald-600">[TERMO_ACEITE]</strong>
                </div>
              </div>

              {secoes.map((s, idx) => (
                  <div key={s.id} className="border border-slate-200 bg-white shadow-sm p-4 rounded-xl relative space-y-3 hover:border-slate-300 transition-colors">
                    <div>
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-2 font-bold text-slate-700">
                        {s.titulo}
                      </div>
                    </div>
                    <div>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[150px] resize-y focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors"
                        value={s.texto}
                        onChange={(e) => {
                          const list = [...secoes];
                          list[idx].texto = e.target.value;
                          setSecoes(list);
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
