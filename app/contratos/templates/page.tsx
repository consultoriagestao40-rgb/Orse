'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../actions';

export default function TemplatesContrato() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Editor State
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [nome, setNome] = useState('');
  const [clausulas, setClausulas] = useState<{titulo: string; texto: string}[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await getTemplates();
    if (res.success) {
      setTemplates(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openEditor = (tmpl?: any) => {
    if (tmpl) {
      setEditingTemplate(tmpl);
      setNome(tmpl.nome);
      setClausulas(tmpl.clausulas.map((c: any) => ({ titulo: c.titulo, texto: c.texto })));
    } else {
      setEditingTemplate('new');
      setNome('');
      setClausulas([{ titulo: 'CLÁUSULA 01 - DO OBJETO', texto: '[OBJETO]' }]);
    }
  };

  const closeEditor = () => {
    setEditingTemplate(null);
    setNome('');
    setClausulas([]);
  };

  const saveTemplate = async () => {
    if (!nome) return alert('Dê um nome ao template.');
    setLoading(true);
    
    const payload = clausulas.map((c, i) => ({ ...c, ordem: i }));
    let res;

    if (editingTemplate === 'new') {
      res = await createTemplate(nome, payload);
    } else {
      res = await updateTemplate(editingTemplate.id, nome, payload);
    }

    if (res?.success) {
      alert('Template salvo com sucesso!');
      closeEditor();
      loadData();
    } else {
      alert('Erro ao salvar template: ' + res?.error);
    }
    setLoading(false);
  };

  const apagarTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar esta minuta padrão?')) return;
    setLoading(true);
    const res = await deleteTemplate(id);
    if (res.success) {
      loadData();
    } else {
      alert('Erro: ' + res.error);
      setLoading(false);
    }
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <button onClick={() => router.push('/contratos')} className="text-slate-400 hover:text-[#1B4D3E] flex items-center gap-1 text-xs font-bold uppercase mb-2">
                <ArrowLeft size={14} /> Voltar para Contratos
              </button>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Minutas Padrão (Templates)</h1>
              <p className="text-slate-500 text-sm mt-1">Crie os moldes jurídicos para seus novos contratos</p>
            </div>
            {!editingTemplate && (
              <button
                onClick={() => openEditor()}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Nova Minuta Padrão
              </button>
            )}
            {editingTemplate && (
              <button
                onClick={saveTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save size={18} /> Salvar Template
              </button>
            )}
          </header>

          {/* LISTA DE TEMPLATES */}
          {!editingTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <p className="text-slate-400">Carregando minutas...</p>
              ) : templates.length === 0 ? (
                <div className="col-span-2 border-2 border-dashed border-slate-300 rounded-xl py-12 flex flex-col items-center justify-center">
                  <FileText size={32} className="text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Você ainda não tem nenhum template de contrato cadastrado.</p>
                </div>
              ) : (
                templates.map(tmpl => (
                  <div key={tmpl.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#1B4D3E]/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <FileText size={18} className="text-[#1B4D3E]" /> {tmpl.nome}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditor(tmpl)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded" title="Editar Template"><Edit2 size={16} /></button>
                        <button onClick={() => apagarTemplate(tmpl.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Apagar"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{tmpl.clausulas.length} cláusulas padrão</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* EDITOR DE TEMPLATE */}
          {editingTemplate && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
              
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Nome do Template / Minuta</label>
                <input 
                  type="text" 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Contrato de Prestação de Serviços - Limpeza"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none"
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-2">Tags Dinâmicas Disponíveis</h4>
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  Use as tags abaixo no texto das cláusulas para injetar os dados da Proposta Ganhadora (FPV) na hora de gerar o contrato:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[TABELA] - Quadro Efetivo</span>
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[ITENS] - Insumos Inclusos/Exclusos</span>
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[OBJETO] - Objeto da Proposta</span>
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[ESCOPO] - Escopo Técnico</span>
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[RAZAO_SOCIAL] - Empresa do Cliente</span>
                  <span className="bg-white border border-indigo-200 px-2 py-1 rounded text-[10px] font-bold text-indigo-700 shadow-sm">[CNPJ] - CNPJ do Cliente</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cláusulas Padrão</h4>
                  <button 
                    onClick={() => setClausulas([...clausulas, { titulo: `NOVA CLÁUSULA`, texto: '' }])}
                    className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    + Adicionar Cláusula
                  </button>
                </div>

                {clausulas.map((c, idx) => (
                  <div key={idx} className="border border-slate-200 bg-slate-50 p-4 rounded-xl relative space-y-3">
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
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E]"
                        value={c.titulo}
                        placeholder="Ex: DO OBJETO"
                        onChange={(e) => {
                          const list = [...clausulas];
                          list[idx].titulo = e.target.value;
                          setClausulas(list);
                        }}
                      />
                    </div>
                    <div>
                      <textarea 
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:border-[#1B4D3E]"
                        value={c.texto}
                        placeholder="Digite o texto da cláusula..."
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
          )}

        </div>
      </main>
    </div>
  );
}
