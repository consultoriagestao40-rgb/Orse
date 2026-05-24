'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, ArrowLeft, Save, Printer, Building2, Tag, Trash2, ShieldCheck } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getDocumentoPropostaById, updateDocumentoStatus, updateSecoesDocumento, deleteDocumentoProposta } from '../actions';
import { Plus, ChevronUp, ChevronDown, X } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function DocumentoPropostaDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('');
  const [secoes, setSecoes] = useState<{id?: string; titulo: string; texto: string; ordem?: number}[]>([]);

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
    if (status !== doc.status) {
      await updateDocumentoStatus(id, status);
    }
    
    const payload = secoes.map((s, i) => ({ ...s, ordem: i + 1 }));
    await updateSecoesDocumento(id, payload);
    
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

  const moveSecao = (idx: number, dir: 'up' | 'down') => {
    const list = [...secoes];
    if (dir === 'up' && idx > 0) {
      [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]];
    } else if (dir === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    } else return;
    setSecoes(list);
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
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  Corpo da Proposta
                  <button
                    onClick={() => setSecoes([...secoes, { titulo: 'NOVA CLÁUSULA', texto: '' }])}
                    className="ml-4 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} /> Adicionar Cláusula
                  </button>
                </h2>
                <div className="text-[10px] font-bold text-slate-400 max-w-sm text-right leading-tight">
                  Variáveis: <strong className="text-[#1e4480]">[OBJETO_PROPOSTA]</strong>, <strong className="text-[#1e4480]">[ESCOPO_TECNICO]</strong>, <strong className="text-[#1e4480]">[CONDICOES_COMERCIAIS]</strong><br/>
                  Tags de Tabelas: <strong className="text-emerald-600">[TABELA]</strong>, <strong className="text-emerald-600">[ITENS]</strong>, <strong className="text-emerald-600">[TERMO_ACEITE]</strong>
                </div>
              </div>

              {secoes.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-6">Nenhuma cláusula adicionada ainda.</p>
              )}

              {secoes.map((s, idx) => (
                  <div key={idx} className="border border-slate-200 bg-white shadow-sm p-4 rounded-xl relative space-y-3 hover:border-slate-300 transition-colors">
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => moveSecao(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-25 transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveSecao(idx, 'down')}
                        disabled={idx === secoes.length - 1}
                        className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-25 transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const list = [...secoes];
                          list.splice(idx, 1);
                          setSecoes(list);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                        title="Remover cláusula"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="pr-24">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Título da Cláusula {idx + 1}
                      </label>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-2 font-bold focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors text-slate-700"
                        value={s.titulo}
                        onChange={(e) => {
                          const list = [...secoes];
                          list[idx].titulo = e.target.value;
                          setSecoes(list);
                        }}
                      />
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
