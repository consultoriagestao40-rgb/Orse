'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, Save, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getTemplatesProposta,
  createTemplateProposta,
  updateTemplateProposta,
  deleteTemplateProposta
} from '../actions';

export default function TemplatesPropostaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Estado do editor
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [nome, setNome] = useState('');
  const [secoes, setSecoes] = useState<{ titulo: string; texto: string }[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await getTemplatesProposta();
    setTemplates(res || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openEditor = (tmpl?: any) => {
    if (tmpl) {
      setEditingTemplate(tmpl);
      setNome(tmpl.nome);
      setSecoes((tmpl.secoes || []).map((s: any) => ({ titulo: s.titulo, texto: s.texto })));
    } else {
      setEditingTemplate('new');
      setNome('');
      setSecoes([
        { titulo: 'DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
        { titulo: 'DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
        { titulo: 'RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]' },
        { titulo: 'ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
        { titulo: 'TERMO DE ACEITE', texto: '[TERMO_ACEITE]' },
      ]);
    }
  };

  const closeEditor = () => {
    setEditingTemplate(null);
    setNome('');
    setSecoes([]);
  };

  const saveTemplate = async () => {
    if (!nome.trim()) return alert('Dê um nome ao template.');
    setSaving(true);
    const payload = secoes.map((s, i) => ({ ...s, ordem: i + 1 }));

    let res: any;
    if (editingTemplate === 'new') {
      res = await createTemplateProposta(nome, payload);
    } else {
      res = await updateTemplateProposta(editingTemplate.id, nome, payload);
    }

    if (res?.success) {
      alert('Template salvo com sucesso!');
      closeEditor();
      loadData();
    } else {
      alert('Erro ao salvar: ' + res?.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este template?')) return;
    setLoading(true);
    const res = await deleteTemplateProposta(id);
    if (res.success) {
      loadData();
    } else {
      alert('Erro: ' + res.error);
      setLoading(false);
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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <button
                onClick={() => router.push('/propostas-comerciais')}
                className="text-slate-400 hover:text-[#1B4D3E] flex items-center gap-1 text-xs font-bold uppercase mb-2 transition-colors"
              >
                <ArrowLeft size={14} /> Voltar para Propostas Comerciais
              </button>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <FileText size={22} /> Templates de Proposta
              </h1>
              <p className="text-slate-500 text-sm mt-1">Crie e edite os modelos base para geração de propostas comerciais em PDF</p>
            </div>
            {!editingTemplate && (
              <button
                onClick={() => openEditor()}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Novo Template
              </button>
            )}
            {editingTemplate && (
              <div className="flex items-center gap-3">
                <button
                  onClick={closeEditor}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded text-sm flex items-center gap-2 transition-colors"
                >
                  <X size={16} /> Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Template'}
                </button>
              </div>
            )}
          </header>

          {/* LISTA DE TEMPLATES */}
          {!editingTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <p className="text-slate-400">Carregando templates...</p>
              ) : templates.length === 0 ? (
                <div className="col-span-2 border-2 border-dashed border-slate-300 rounded-xl py-12 flex flex-col items-center justify-center">
                  <FileText size={32} className="text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Nenhum template encontrado.</p>
                </div>
              ) : (
                templates.map(tmpl => (
                  <div key={tmpl.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:border-[#1B4D3E]/30 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[#1B4D3E] shrink-0 mt-0.5" />
                        <h3 className="font-bold text-slate-800">{tmpl.nome}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => openEditor(tmpl)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(tmpl.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Apagar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {(tmpl.secoes || []).length} cláusulas padrão
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(tmpl.secoes || []).slice(0, 3).map((s: any, i: number) => (
                        <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">
                          {s.titulo.replace(/^(?:CLÁUSULA\s*\d+\s*[-–]?\s*)/i, '').substring(0, 25)}
                        </span>
                      ))}
                      {(tmpl.secoes || []).length > 3 && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded">
                          +{(tmpl.secoes || []).length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* EDITOR DE TEMPLATE */}
          {editingTemplate && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">

              {/* Nome */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Nome do Template</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Proposta Simples (Terceirização)"
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-[#1B4D3E] focus:outline-none"
                />
              </div>

              {/* Tags dinâmicas */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2">Tags Dinâmicas Disponíveis</h4>
                <p className="text-xs text-blue-700 leading-relaxed mb-3">
                  Use as tags abaixo para injetar automaticamente os dados da FPV no PDF gerado:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['[OBJETO_PROPOSTA]', 'Objeto da Proposta (Aba 1 FPV)'],
                    ['[ESCOPO_TECNICO]', 'Escopo Técnico (Aba 1 FPV)'],
                    ['[CONDICOES_COMERCIAIS]', 'Condições do Cliente (Aba 1 FPV)'],
                    ['[TABELA]', 'Quadro Efetivo + Insumos'],
                    ['[ITENS]', 'Itens Inclusos/Exclusos'],
                    ['[TERMO_ACEITE]', 'Assinatura / Termo de Aceite'],
                  ].map(([tag, desc]) => (
                    <span key={tag} className="bg-white border border-blue-200 px-2 py-1 rounded text-[10px] font-bold text-blue-700 shadow-sm cursor-default" title={desc}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Seções */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cláusulas</h4>
                  <button
                    onClick={() => setSecoes([...secoes, { titulo: 'NOVA CLÁUSULA', texto: '' }])}
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} /> Adicionar Cláusula
                  </button>
                </div>

                {secoes.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-6">Nenhuma cláusula adicionada ainda.</p>
                )}

                {secoes.map((s, idx) => (
                  <div key={idx} className="border border-slate-200 bg-slate-50 p-4 rounded-xl relative space-y-3">
                    {/* Controles de posição */}
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
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                        value={s.titulo}
                        placeholder="Ex: DO OBJETO E ESCOPO"
                        onChange={e => {
                          const list = [...secoes];
                          list[idx].titulo = e.target.value;
                          setSecoes(list);
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Texto / Tags
                      </label>
                      <textarea
                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:border-[#1B4D3E] transition-colors font-mono"
                        value={s.texto}
                        placeholder="Digite o texto ou insira uma tag como [OBJETO_PROPOSTA]..."
                        onChange={e => {
                          const list = [...secoes];
                          list[idx].texto = e.target.value;
                          setSecoes(list);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Salvar bottom */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-8 rounded text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Template'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
