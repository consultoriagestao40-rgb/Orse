'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, ArrowLeft, Save, Printer, Calendar, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getContratoById, updateContratoDetails, updateContratoClausulas, deleteContrato } from '../actions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

export default function ContratoDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataReajuste, setDataReajuste] = useState('');
  const [indiceReajuste, setIndiceReajuste] = useState('');
  const [vigenciaMeses, setVigenciaMeses] = useState(12);
  const [clausulas, setClausulas] = useState<{titulo: string; texto: string}[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await getContratoById(id);
    if (res.success && res.data) {
      setContrato(res.data as any);
      setStatus(res.data.status);
      setDataInicio(res.data.dataInicio ? new Date(res.data.dataInicio).toISOString().split('T')[0] : '');
      setDataReajuste(res.data.dataReajuste ? new Date(res.data.dataReajuste).toISOString().split('T')[0] : '');
      setIndiceReajuste(res.data.indiceReajuste || 'IPCA');
      setVigenciaMeses(res.data.vigenciaMeses || 12);
      setClausulas(res.data.clausulas || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await updateContratoDetails(id, {
      status,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataReajuste: dataReajuste ? new Date(dataReajuste) : null,
      indiceReajuste,
      vigenciaMeses: Number(vigenciaMeses),
      valorTotal: (contrato?.valorMensal || 0) * Number(vigenciaMeses)
    });

    const payload = clausulas.map((c, i) => ({ ...c, ordem: i }));
    await updateContratoClausulas(id, payload);

    alert('Contrato atualizado com sucesso!');
    setSaving(false);
  };

  const moveClausula = (idx: number, dir: 'up' | 'down') => {
    const list = [...clausulas];
    if (dir === 'up' && idx > 0) {
      [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]];
    } else if (dir === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    } else {
      return;
    }
    setClausulas(list);
  };

  const calcularDataFim = () => {
    if (!dataInicio || !vigenciaMeses) return '-';
    const d = new Date(dataInicio);
    // Para não haver problema de fuso horário, usar UTC se foi setado assim, ou apenas string parsing simples:
    // Pelo formato YYYY-MM-DD
    const [y, m, day] = dataInicio.split('-');
    const dataObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
    dataObj.setMonth(dataObj.getMonth() + Number(vigenciaMeses));
    return dataObj.toLocaleDateString('pt-BR');
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.')) {
      setSaving(true);
      const res = await deleteContrato(id);
      if (res.success) {
        router.push('/contratos');
      } else {
        alert('Erro ao excluir: ' + res.error);
        setSaving(false);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Carregando...</div>;
  if (!contrato) return <div className="p-10 text-center text-red-500">Contrato não encontrado.</div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">

          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <button onClick={() => router.push('/contratos')} className="text-slate-400 hover:text-[#1B4D3E] flex items-center gap-1 text-xs font-bold uppercase mb-2">
                <ArrowLeft size={14} /> Voltar para Contratos
              </button>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Contrato FPV-{contrato.proposta?.numero}</h1>
              <p className="text-slate-500 text-sm mt-1">{contrato.client?.razaoSocial || contrato.client?.nomeFantasia}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                title="Excluir Contrato"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => window.open(`/contratos/${id}/print`, '_blank')}
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
            
            {/* LADO ESQUERDO: INFOS E LIFECYCLE */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Status & Ciclo de Vida
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status do Contrato</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    >
                      <option value="Pendente de Assinatura">Pendente de Assinatura</option>
                      <option value="Vigente">Vigente (Ativo)</option>
                      <option value="Reajuste Pendente">Reajuste Pendente</option>
                      <option value="Encerrado">Encerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Início</label>
                    <input 
                      type="date"
                      value={dataInicio}
                      onChange={e => setDataInicio(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo (Meses)</label>
                    <select 
                      value={vigenciaMeses}
                      onChange={e => setVigenciaMeses(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    >
                      <option value={12}>12 Meses</option>
                      <option value={24}>24 Meses</option>
                      <option value={36}>36 Meses</option>
                      <option value={48}>48 Meses</option>
                      <option value={60}>60 Meses</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data de Vencimento</label>
                    <div className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-sm font-bold text-slate-500">
                      {calcularDataFim()}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Previsão de Reajuste</label>
                    <input 
                      type="date"
                      value={dataReajuste}
                      onChange={e => setDataReajuste(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Índice de Reajuste</label>
                    <input 
                      type="text"
                      value={indiceReajuste}
                      onChange={e => setIndiceReajuste(e.target.value)}
                      placeholder="Ex: IPCA, IGPM"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Dados Financeiros
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500">Valor Mensal (Base)</span>
                    <span className="text-sm font-black text-[#1B4D3E]">{fmt(contrato.valorMensal)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500">Vigência Atual</span>
                    <span className="text-sm font-black text-slate-800">{vigenciaMeses} meses</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-black text-slate-700">Valor Total Estimado</span>
                    <span className="text-sm font-black text-slate-800">{fmt((contrato.valorMensal || 0) * vigenciaMeses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: EDITOR DE CLÁUSULAS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cláusulas Deste Contrato</h2>
                <button 
                  onClick={() => setClausulas([...clausulas, { titulo: 'NOVA CLÁUSULA EXCLUSIVA', texto: '' }])}
                  className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                >
                  + Adicionar Cláusula Específica
                </button>
              </div>

              {clausulas.map((c, idx) => (
                  <div key={idx} className="border border-slate-200 bg-white shadow-sm p-4 rounded-xl relative space-y-3 hover:border-slate-300 transition-colors">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button 
                          onClick={() => moveClausula(idx, 'up')}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
                          title="Mover para cima"
                        >
                          ⬆️
                        </button>
                        <button 
                          onClick={() => moveClausula(idx, 'down')}
                          disabled={idx === clausulas.length - 1}
                          className="text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors"
                          title="Mover para baixo"
                        >
                          ⬇️
                        </button>
                        <button 
                          onClick={() => {
                            const list = [...clausulas];
                            list.splice(idx, 1);
                            setClausulas(list);
                          }}
                          className="text-slate-400 hover:text-red-500 ml-2 transition-colors"
                          title="Remover Cláusula"
                        >
                          ✕
                        </button>
                    </div>

                    <div>
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-2 font-bold focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors"
                        value={c.titulo}
                        onChange={(e) => {
                          const list = [...clausulas];
                          list[idx].titulo = e.target.value;
                          setClausulas(list);
                        }}
                      />
                    </div>
                    <div>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[150px] resize-y focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors"
                        value={c.texto}
                        onChange={(e) => {
                          const list = [...clausulas];
                          list[idx].texto = e.target.value;
                          setClausulas(list);
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
