'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, Save, ChevronUp, ChevronDown, X, Presentation } from 'lucide-react';
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
  const [tipo, setTipo] = useState('A4');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [secoes, setSecoes] = useState<{ titulo: string; texto: string }[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

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
      setTipo(tmpl.tipo || 'A4');
      setActiveSlideIdx(0);
      setSecoes((tmpl.secoes || []).map((s: any) => ({ titulo: s.titulo, texto: s.texto })));
    } else {
      setEditingTemplate('new');
      setNome('');
      setTipo('A4');
      setActiveSlideIdx(0);
      setSecoes([
        { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
        { titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
        { titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]' },
        { titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
        { titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' },
      ]);
    }
  };

  const closeEditor = () => {
    setEditingTemplate(null);
    setNome('');
    setTipo('A4');
    setActiveSlideIdx(0);
    setSecoes([]);
  };

  const saveTemplate = async () => {
    if (!nome.trim()) return alert('Dê um nome ao template.');
    setSaving(true);
    const payload = secoes.map((s, i) => ({ ...s, ordem: i + 1 }));

    let res: any;
    if (editingTemplate === 'new') {
      res = await createTemplateProposta(nome, payload, tipo);
    } else {
      res = await updateTemplateProposta(editingTemplate.id, nome, payload, tipo);
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
      if (activeSlideIdx === idx) setActiveSlideIdx(idx - 1);
      else if (activeSlideIdx === idx - 1) setActiveSlideIdx(idx);
    } else if (dir === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      if (activeSlideIdx === idx) setActiveSlideIdx(idx + 1);
      else if (activeSlideIdx === idx + 1) setActiveSlideIdx(idx);
    } else return;
    setSecoes(list);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Montserrat:wght@300;400;600;700;800;900&family=Inter:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;500;700;900&display=swap');
      `}} />
      
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">

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
              <p className="text-slate-500 text-sm mt-1">Crie e edite os modelos de propostas A4 impressas ou apresentações de slides dinâmicas</p>
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
                        {tmpl.tipo === 'SLIDE_DECK' ? (
                          <Presentation size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        ) : (
                          <FileText size={18} className="text-[#1B4D3E] shrink-0 mt-0.5" />
                        )}
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
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      {tmpl.tipo === 'SLIDE_DECK' ? (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Lâminas de Apresentação</span>
                      ) : (
                        <span className="text-[#1B4D3E] bg-[#1B4D3E]/5 px-2 py-0.5 rounded">Páginas de Contrato A4</span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{(tmpl.secoes || []).length} {tmpl.tipo === 'SLIDE_DECK' ? 'slides' : 'cláusulas'}</span>
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

              {/* Nome & Tipo Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Tipo de Proposta</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipo('A4');
                        if (secoes.some(s => s.texto.trim().startsWith('{'))) {
                          setSecoes([
                            { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
                            { titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
                            { titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento:\n\n[TABELA]' },
                            { titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
                            { titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' }
                          ]);
                        }
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg text-xs font-black uppercase border transition-all ${tipo === 'A4' ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      A4 (PDF / Impressão)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipo('SLIDE_DECK');
                        if (!secoes.some(s => s.texto.trim().startsWith('{'))) {
                          setSecoes([
                            { titulo: 'Capa da Apresentação', texto: '{"layout":"cobertura","tituloSlide":"Proposta Comercial","subtitulo":"Silva Facilities","bgImage":"https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200"}' },
                            { titulo: 'Olá Cliente', texto: '{"layout":"agradecimento","tituloSlide":"Agradecimento","subtitulo":"Obrigado pela oportunidade!","conteudo":"Apresentamos nossa proposta para prestação de serviços terceirizados, desenvolvida sob medida para corresponder às suas necessidades."}' },
                            { titulo: 'Quem Somos', texto: '{"layout":"valores","tituloSlide":"Quem Somos","subtitulo":"Mais de 30 anos no mercado","conteudo":"Nosso compromisso é guiado por princípios sólidos: agimos com ética, agilidade, eficiência e foco em pessoas."}' },
                            { titulo: 'Principais Serviços', texto: '{"layout":"servicos","tituloSlide":"Nossos Serviços","subtitulo":"Especialistas em Facilities","conteudo":"Oferecemos serviços especializados de Limpeza, Conservação, Portaria, Recepção e Jardinagem com alta qualidade."}' },
                            { titulo: 'Quadro Financeiro', texto: '{"layout":"tabela","tituloSlide":"Resumo Financeiro","subtitulo":"Investimento Proposto","conteudo":"[TABELA]"}' },
                            { titulo: 'Itens Inclusos', texto: '{"layout":"itens","tituloSlide":"Itens Inclusos e Exclusos","subtitulo":"Premissas Contratuais","conteudo":"[ITENS]"}' },
                            { titulo: 'Termo de Aceite', texto: '{"layout":"aceite","tituloSlide":"Assinatura e Aceite","subtitulo":"Prontos para iniciar","conteudo":"[TERMO_ACEITE]"}' }
                          ]);
                        }
                      }}
                      className={`flex-1 py-3 px-4 rounded-lg text-xs font-black uppercase border transition-all ${tipo === 'SLIDE_DECK' ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      Apresentação (Slide Deck)
                    </button>
                  </div>
                </div>
              </div>

              {/* EDITOR A4 */}
              {tipo === 'A4' && (
                <div className="space-y-6">
                  {/* Tags dinâmicas */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-wider mb-2">Tags Dinâmicas Disponíveis</h4>
                    <p className="text-xs text-blue-700 leading-relaxed mb-3">
                      Use as tags abaixo para injetar automaticamente os dados da FPV no PDF gerado:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['[CLIENTE_NOME]', 'Nome Fantasia do Cliente'],
                        ['[NUMERO_PROPOSTA]', 'Número da Proposta (ex: FPV-010)'],
                        ['[REVISAO]', 'Número da Revisão Atual (ex: R03)'],
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

                  {/* Seções de Cláusulas */}
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
                </div>
              )}

              {/* CONSTRUTOR DE SLIDES MODULAR (TIPO === 'SLIDE_DECK') */}
              {tipo === 'SLIDE_DECK' && (
                <div className="grid grid-cols-12 gap-6 items-start pt-2 border-t border-slate-100">
                  
                  {/* ESQUERDA: LISTA DE SLIDES */}
                  <div className="col-span-12 md:col-span-4 border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3 max-h-[600px] overflow-y-auto shrink-0 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">Lâminas da Apresentação</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newSlide = {
                            titulo: 'Novo Slide',
                            texto: '{"layout":"texto","tituloSlide":"Novo Slide","subtitulo":"Subtítulo da Lâmina","conteudo":"Escreva seu conteúdo aqui..."}'
                          };
                          const list = [...secoes, newSlide];
                          setSecoes(list);
                          setActiveSlideIdx(list.length - 1);
                        }}
                        className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all shadow-xs flex items-center gap-0.5"
                      >
                        <Plus size={12} /> Add Slide
                      </button>
                    </div>

                    {secoes.length === 0 && (
                      <p className="text-slate-400 text-xs text-center py-6">Nenhum slide adicionado.</p>
                    )}

                    <div className="space-y-1.5">
                      {secoes.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveSlideIdx(idx)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${activeSlideIdx === idx ? 'bg-white border-[#1B4D3E] ring-2 ring-[#1B4D3E]/10 shadow-sm text-slate-800' : 'bg-slate-100/50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                        >
                          <span className="truncate flex-1 pr-1">{String(idx + 1).padStart(2, '0')}. {s.titulo}</span>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => moveSecao(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition-colors"
                              title="Mover para cima"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSecao(idx, 'down')}
                              disabled={idx === secoes.length - 1}
                              className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition-colors"
                              title="Mover para baixo"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Deseja excluir este slide?')) {
                                  const list = [...secoes];
                                  list.splice(idx, 1);
                                  setSecoes(list);
                                  setActiveSlideIdx(Math.max(0, idx - 1));
                                }
                              }}
                              className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DIREITA: PREVIEW & EDITOR 16:9 */}
                  <div className="col-span-12 md:col-span-8 space-y-4">
                    {(() => {
                      const currentSlide = secoes[activeSlideIdx];
                      if (!currentSlide) return <p className="text-slate-400 text-center py-10 font-bold uppercase tracking-wide">Selecione ou crie um slide na barra lateral.</p>;

                      let slideData: any = {};
                      try {
                        slideData = JSON.parse(currentSlide.texto);
                      } catch (e) {
                        slideData = { layout: 'texto', tituloSlide: currentSlide.titulo, subtitulo: '', conteudo: currentSlide.texto };
                      }

                      return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Montserrat:wght@300;400;600;700;800;900&family=Inter:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;500;700;900&display=swap');
      `}} />
      
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-900">
                          {/* Board 16:9 */}
                          <div 
                            className="w-full aspect-[16/9] bg-white border-b border-slate-200 relative p-8 flex flex-col justify-between select-none text-slate-800 overflow-hidden"
                            style={{
                              fontFamily: (slideData.fontFamily || 'Outfit') === 'Outfit' ? 'Outfit, sans-serif' : 
                                          (slideData.fontFamily || 'Outfit') === 'Montserrat' ? 'Montserrat, sans-serif' : 
                                          (slideData.fontFamily || 'Outfit') === 'Inter' ? 'Inter, sans-serif' : 
                                          (slideData.fontFamily || 'Outfit') === 'Playfair' ? 'Playfair Display, serif' : 'Roboto, sans-serif',
                              backgroundColor: slideData.bgColor || (slideData.layout === 'cobertura' && slideData.coverStyle !== 'provelo_split' ? '#020617' : '#ffffff'),
                              textAlign: slideData.align || (slideData.layout === 'cobertura' && slideData.coverStyle !== 'provelo_split' ? 'center' : 'left'),
                              color: slideData.textColor || '#334155'
                            }}
                          >
                            {/* Background image overlay */}
                            {slideData.layout === 'cobertura' && slideData.coverStyle === 'provelo_split' && (
                              <>
                                 <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                 <div className="absolute right-[33%] top-5 w-12 h-20 bg-rose-100/60 rounded-[20px] transform rotate-[15deg] pointer-events-none"></div>
                                 <div className="absolute right-[38%] bottom-3 w-14 h-14 border-4 border-rose-100/60 rounded-full pointer-events-none"></div>
                              </>
                            )}
                            {slideData.layout === 'cobertura' && slideData.bgImage && slideData.coverStyle !== 'provelo_split' && (
                              <>
                                <img src={slideData.bgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-45 filter blur-[0.5px]" />
                                <div className="absolute inset-0 bg-[#1e4480]/80"></div>
                              </>
                            )}

                            {/* Header slide */}
                            <div className="relative z-10 flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className={`text-[8.5px] font-black uppercase tracking-widest ${slideData.layout === 'cobertura' ? 'text-white/70' : 'text-[#1e4480]'}`}>SMARTBIDHUB PRESENTATION</span>
                              <span className={`text-[8px] font-bold ${slideData.layout === 'cobertura' ? 'text-white/50' : 'text-slate-400'}`}>Lâmina {activeSlideIdx + 1}</span>
                            </div>

                            {/* Center elements */}
                            <div className="relative z-10 my-auto py-2 h-full flex flex-col justify-center">
{slideData.layout === 'cobertura' ? (
                                slideData.coverStyle === 'provelo_split' ? (
                                  <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                    {/* Faixa Vermelha Vertical à Esquerda */}
                                    <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                    {/* Forma Rosa Superior Direita */}
                                    <div className="absolute right-[33%] top-5 w-12 h-20 bg-rose-100/60 rounded-[20px] transform rotate-[15deg] pointer-events-none"></div>
                                    {/* Forma Rosa Inferior */}
                                    <div className="absolute right-[38%] bottom-3 w-14 h-14 border-4 border-rose-100/60 rounded-full pointer-events-none"></div>

                                    <div className="col-span-7 flex flex-col justify-between h-full pr-4 z-20">
                                       <div className="flex items-center gap-1.5">
                                          <img 
                                             src={companyLogo} 
                                             alt="Logo" 
                                             className="max-h-8 w-auto object-contain"
                                          />
                                          <span className="text-[7px] font-black tracking-widest text-slate-400">FACILITIES</span>
                                       </div>

                                       <div className="flex flex-col space-y-2 my-auto pl-2">
                                          <span className="text-[7.5px] font-black uppercase tracking-[0.25em] text-[#ef4444] block">MODELO DE PROPOSTA</span>
                                          <h2 className="text-xl font-black uppercase leading-none tracking-tight text-slate-900" style={{ color: slideData.titleColor || undefined }}>{slideData.tituloSlide || "PROPOSTA"}</h2>
                                          <p className="text-[8px] font-bold text-slate-500 leading-normal line-clamp-2">{slideData.subtitulo || "Silva Facilities"}</p>
                                          
                                          <div className="text-[7.5px] text-slate-600 font-bold space-y-0.5 pt-1">
                                             <div className="text-slate-400 font-black tracking-widest text-[6px] uppercase">Cliente</div>
                                             <div className="text-slate-950 font-black text-[9px]">Empresa XPTO</div>
                                             <div>Nº Proposta: FPV-XXX | Revisão: R01</div>
                                          </div>

                                          {slideData.badgeText && (
                                             <div className="pt-1">
                                                <span className="text-[7.5px] font-black text-white px-4 py-1.5 rounded-full shadow-md select-none inline-block uppercase tracking-wider" style={{ backgroundColor: slideData.badgeColor || '#ef4444' }}>
                                                   {slideData.badgeText}
                                                </span>
                                             </div>
                                          )}
                                       </div>

                                       <div className="pt-2 border-t border-slate-100 flex gap-4 text-[7px] font-extrabold text-slate-400 pl-2">
                                          <div className="flex items-center gap-1.5">
                                             <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[5px] font-black">✉</div>
                                             <span className="text-slate-600">contato@provelo.com.br</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                             <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[5px] font-black">🌐</div>
                                             <span className="text-slate-600">www.provelo.com.br</span>
                                          </div>
                                       </div>
                                    </div>

                                    <div className="col-span-5 h-full relative flex items-center justify-end overflow-hidden z-20">
                                       <div className="w-[85%] h-[90%] rounded-l-[90px] overflow-hidden border-2 border-slate-100/50 shadow-xl relative">
                                          <img 
                                             src={slideData.sideImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200"} 
                                             alt="Capa Apresentação" 
                                             className="w-full h-full object-cover"
                                          />
                                       </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center text-white space-y-3">
                                    <h2 className="text-xl font-black uppercase tracking-widest leading-none drop-shadow-md">{slideData.tituloSlide || "Proposta Comercial"}</h2>
                                    <p className="text-[11px] font-bold text-white/80">{slideData.subtitulo || "Silva Facilities"}</p>
                                    <div className="w-24 mx-auto border-t border-white/20 pt-2 text-[8px] font-bold uppercase tracking-wider text-white/50">
                                      Capa Comercial
                                    </div>
                                  </div>
                                )
                              ) : slideData.layout === 'quem_somos' ? (
                                <div className="grid grid-cols-12 h-full z-10 select-none text-white relative pl-2 items-stretch" style={{ fontFamily: 'Outfit' }}>
                                   {/* Faixa Vermelha Vertical à Esquerda */}
                                   <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                   
                                   <div className="col-span-5 bg-[#ef4444] p-6 flex flex-col justify-center space-y-3 z-20 pl-6 relative text-left">
                                      <h2 className="text-xl font-black uppercase tracking-tight text-white leading-none">{slideData.tituloSlide || "Quem Somos"}</h2>
                                      <p className="text-[8px] font-semibold leading-relaxed text-white/95 text-justify line-clamp-5">{slideData.conteudo || "A Provelo é uma empresa..."}</p>
                                   </div>

                                   <div className="col-span-7 h-full relative flex items-center justify-center p-4 z-10 bg-slate-950/20">
                                      <div className="relative z-20 flex gap-4 w-full justify-center items-center">
                                         <div className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#ef4444] shadow-md">
                                            <img src={slideData.sideImage || "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=200"} alt="Workspace 1" className="w-full h-full object-cover" />
                                         </div>
                                         <div className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#ef4444] shadow-md mt-6">
                                            <img src={slideData.sideImage2 || "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=200"} alt="Workspace 2" className="w-full h-full object-cover" />
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              ) : slideData.layout === 'agradecimento' ? (
                                 <div className="grid grid-cols-12 gap-4 items-center">
                                   <div className="col-span-8 space-y-2">
                                     <h3 className="text-base font-black text-[#1e4480] uppercase leading-none" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "Olá!"}</h3>
                                     <p className="text-[9.5px] text-slate-600 leading-relaxed text-justify line-clamp-3">{slideData.conteudo || "Agradecemos a oportunidade..."}</p>
                                   </div>
                                   <div className="col-span-4 border-l border-slate-100 pl-4 text-center">
                                     <div className="w-10 h-10 rounded-full bg-slate-200 mx-auto mb-1 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm border border-white">CS</div>
                                     <span className="text-[8px] font-black text-slate-800 block">Consultor Comercial</span>
                                   </div>
                                 </div>
                              ) : slideData.layout === 'valores' ? (
                                 slideData.coverStyle === 'provelo_split' ? (
                                    <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                       <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                       
                                       <div className="col-span-7 flex flex-col justify-between h-full pr-4 text-left pl-6">
                                          <div>
                                             <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight leading-none mb-2" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "NOSSOS VALORES"}</h2>
                                             <div className="space-y-1.5">
                                                <div>
                                                   <h4 className="text-[9px] font-black text-[#ef4444] uppercase leading-none">{slideData.val1_title || "Qualidade"}</h4>
                                                   <p className="text-[7.5px] font-semibold text-slate-500 line-clamp-1">{slideData.val1_text || "Compromisso..."}</p>
                                                </div>
                                                <div>
                                                   <h4 className="text-[9px] font-black text-[#ef4444] uppercase leading-none">{slideData.val2_title || "Relacionamento"}</h4>
                                                   <p className="text-[7.5px] font-semibold text-slate-500 line-clamp-1">{slideData.val2_text || "Valorização..."}</p>
                                                </div>
                                                <div>
                                                   <h4 className="text-[9px] font-black text-[#ef4444] uppercase leading-none">{slideData.val3_title || "Evolução"}</h4>
                                                   <p className="text-[7.5px] font-semibold text-slate-500 line-clamp-1">{slideData.val3_text || "Evolução contínua..."}</p>
                                                </div>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="col-span-5 h-[90%] relative flex items-center justify-end overflow-hidden">
                                          <div className="absolute right-0 bottom-0 top-0 w-[45%] bg-[#ef4444] rounded-l-[50px] z-10"></div>
                                          <div className="w-[85%] h-full rounded-l-[90px] overflow-hidden border-2 border-slate-100/50 shadow-xl relative z-20 mr-2">
                                             <img 
                                                src={slideData.sideImage || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600"} 
                                                alt="Values" 
                                                className="w-full h-full object-cover"
                                             />
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none text-center" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "Nossos Valores"}</h3>
                                      <p className="text-[9.5px] text-slate-500 text-center leading-relaxed px-4">{slideData.conteudo}</p>
                                      <div className="flex justify-around pt-2">
                                        {['Ética', 'Inovação', 'Eficiência'].map(v => (
                                          <div key={v} className="flex flex-col items-center">
                                            <div className="w-7 h-7 rounded-full bg-[#1e4480] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">★</div>
                                            <span className="text-[8px] font-black mt-1 text-slate-700">{v}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                 )
                              ) : slideData.layout === 'performance' ? (
                                 <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                    <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                    
                                    <div className="col-span-5 flex flex-col justify-between h-full pr-2 pl-6">
                                       <div className="space-y-1">
                                          <span className="text-[7px] font-black uppercase text-slate-400 block">DESEMPENHO</span>
                                          <h2 className="text-lg font-black uppercase text-slate-900 leading-none" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "NOSSA PERFORMANCE"}</h2>
                                       </div>
                                       <div className="w-full aspect-[16/10] rounded-xl overflow-hidden shadow-sm mt-2 border border-slate-100">
                                          <img src={slideData.sideImage || "https://images.unsplash.com/photo-1542362567-b07eac79094d?q=80&w=200"} alt="Prédio" className="w-full h-full object-cover" />
                                       </div>
                                    </div>

                                    <div className="col-span-7 flex flex-col justify-center space-y-3 pl-4">
                                       <div className="flex items-center gap-3">
                                          <div className="bg-[#ef4444] text-white w-20 py-2 rounded-xl flex flex-col items-center justify-center text-center shrink-0">
                                             <span className="text-[10px] font-black leading-none">29 MIL</span>
                                             <span className="text-[5.5px] font-black text-white/80 uppercase">HORAS</span>
                                          </div>
                                          <p className="text-[7.5px] font-semibold text-slate-500 leading-snug line-clamp-2">{slideData.val1_text || "Visitas técnicas e monitoramento..."}</p>
                                       </div>

                                       <div className="flex items-center gap-3">
                                          <div className="bg-[#ef4444] text-white w-20 py-2 rounded-xl flex flex-col items-center justify-center text-center shrink-0">
                                             <span className="text-[10px] font-black leading-none">1.220</span>
                                             <span className="text-[5.5px] font-black text-white/80 uppercase">VISITAS</span>
                                          </div>
                                          <p className="text-[7.5px] font-semibold text-slate-500 leading-snug line-clamp-2">{slideData.val2_text || "Atendimentos operacionais integrados..."}</p>
                                       </div>
                                    </div>
                                 </div>
                              ) : slideData.layout === 'servicos' ? (
                                 slideData.servicosStyle === 'provelo_grid' ? (
                                    <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                       <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                       
                                       <div className="col-span-4 flex flex-col justify-center h-full pr-2 pl-6">
                                          <span className="text-[7px] font-black uppercase text-[#ef4444] block">PORTFÓLIO</span>
                                          <h2 className="text-xl font-black uppercase text-slate-900 leading-none mb-2" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "NOSSOS SERVIÇOS"}</h2>
                                          <p className="text-[7.5px] font-semibold text-slate-500 leading-relaxed line-clamp-4">{slideData.subtitulo || slideData.conteudo}</p>
                                       </div>

                                       <div className="col-span-8 grid grid-cols-3 gap-3 items-center py-1">
                                          {[
                                             { label: "LIMPEZA", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=100" },
                                             { label: "SEGURANÇA", img: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=100" },
                                             { label: "PORTARIA", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=100" }
                                          ].map((serv, sIdx) => (
                                             <div key={sIdx} className="bg-white rounded-2xl border border-slate-200 p-1 text-center flex flex-col items-center justify-between aspect-[4/5] overflow-hidden shadow-sm">
                                                <div className="w-full h-[70%] rounded-xl overflow-hidden mb-1">
                                                   <img src={serv.img} alt={serv.label} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[5.5px] font-black text-white bg-[#ef4444] px-2 py-1 rounded-full uppercase tracking-wider block mb-0.5 w-[90%] truncate">
                                                   {serv.label}
                                                </span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="space-y-2">
                                      <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none text-center" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "Nossos Serviços"}</h3>
                                      <p className="text-[8px] text-slate-400 text-center font-bold">{slideData.subtitulo}</p>
                                      <div className="grid grid-cols-3 gap-2 pt-2">
                                        {['facilities', 'portaria', 'limpeza'].map(v => (
                                          <div key={v} className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 text-center shadow-xs">
                                            <span className="text-[8px] font-black text-[#1e4480] block uppercase">{v}</span>
                                            <span className="text-[7px] text-slate-400 block mt-0.5">Operação Integrada</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                 )
                              ) : slideData.layout === 'atuacao' ? (
                                 <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                    <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                    
                                    <div className="col-span-6 flex flex-col justify-between h-full pr-4 pl-6">
                                       <div className="space-y-1">
                                          <span className="text-[7px] font-black uppercase text-[#ef4444] block">ESTRUTURA</span>
                                          <h2 className="text-xl font-black uppercase text-slate-900 leading-none" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "ATUAÇÃO NACIONAL"}</h2>
                                       </div>

                                       <div className="space-y-1.5 my-auto pt-2">
                                          {[
                                             { num: slideData.stat1_num || '+$2M', text: 'Investidos em tecnologia...' },
                                             { num: slideData.stat2_num || '+10M', text: 'Novos empregos...' }
                                          ].map((st, sIdx) => (
                                             <div key={sIdx} className="bg-[#ef4444] text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs border border-white/10">
                                                <span className="text-xs font-black tracking-tighter shrink-0 w-12 text-center border-r border-white/20 pr-2">{st.num}</span>
                                                <span className="text-[6.5px] font-bold text-white/90 leading-tight text-left line-clamp-1">{st.text}</span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    <div className="col-span-6 h-full relative flex items-center justify-center p-2">
                                       <div className="absolute right-0 bottom-0 top-0 w-[45%] bg-[#ef4444] rounded-l-[50px] z-10"></div>
                                       <div className="w-[85%] h-full bg-[#fafafa]/80 rounded-[20px] border border-slate-200/50 shadow-md p-3 relative z-20 flex flex-col justify-center items-center">
                                          <div className="w-full h-full flex items-center justify-center">
                                             <div className="text-[7px] text-slate-400 font-bold uppercase">[ MAPA DO BRASIL ]</div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ) : slideData.layout === 'gestao' ? (
                                 <div className="grid grid-cols-12 gap-2 h-full items-center text-slate-800 text-left relative pr-2 select-none" style={{ fontFamily: 'Outfit' }}>
                                    <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                    
                                    <div className="col-span-7 flex flex-col justify-between h-full pr-4 pl-6 my-auto">
                                       <div className="space-y-2">
                                          <span className="text-[7px] font-black uppercase text-[#ef4444] block">TECNOLOGIA</span>
                                          <h2 className="text-xl font-black uppercase text-slate-900 leading-none" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "GESTÃO TRANSPARENTE"}</h2>
                                          <p className="text-[7.5px] font-semibold text-slate-500 leading-normal line-clamp-2">{slideData.subtitulo || "Controle operacional..."}</p>
                                          
                                          <ul className="space-y-1 text-[7.5px] font-bold text-slate-600 pl-1">
                                             <li className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[5px] font-black">✓</span>
                                                <span>Monitoramento em tempo real</span>
                                             </li>
                                             <li className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[5px] font-black">✓</span>
                                                <span>Relatórios operacionais integrados</span>
                                             </li>
                                          </ul>
                                       </div>
                                    </div>

                                    <div className="col-span-5 h-[80%] relative flex items-center justify-center p-2">
                                       <div className="w-full relative shadow-md rounded-xl overflow-hidden border border-slate-200 bg-slate-900 p-1 transform hover:rotate-[-1deg]">
                                          <div className="w-full aspect-[16/10] bg-slate-100 rounded-md overflow-hidden relative shadow-inner">
                                             <img src={slideData.sideImage || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200"} alt="Dashboard Screen" className="w-full h-full object-cover" />
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              ) : slideData.layout === 'fundadores' ? (
                                 <div className="flex flex-col justify-between h-full z-10 overflow-hidden bg-white select-none text-slate-800 relative" style={{ fontFamily: 'Outfit' }}>
                                    <div className="absolute left-[-32px] top-[-32px] bottom-[-32px] w-3 bg-[#ef4444] rounded-r-lg z-30"></div>
                                    
                                    <div className="h-[45%] flex flex-col justify-center items-center text-center px-6 pt-4">
                                       <span className="text-[7.5px] font-black uppercase tracking-widest text-[#ef4444] block mb-0.5">SOBRE NÓS</span>
                                       <h2 className="text-xl font-black uppercase text-slate-900 leading-none" style={{ color: slideData.titleColor }}>{slideData.tituloSlide || "FUNDADORES"}</h2>
                                       <p className="text-[7.5px] font-bold text-slate-500 max-w-md line-clamp-1 mt-1">{slideData.subtitulo || "Transparência e confiança..."}</p>
                                    </div>

                                    <div className="h-[55%] bg-[#ef4444] relative flex items-center justify-around px-6 z-20 border-t-2 border-white shadow-inner">
                                       {[
                                          { name: slideData.f1_name || 'Ádamo', role: 'CEO', img: slideData.f1_photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100' },
                                          { name: slideData.f2_name || 'Guilherme', role: 'CPO', img: slideData.f2_photo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=100' }
                                       ].map((fnd, fIdx) => (
                                          <div key={fIdx} className="flex flex-col items-center text-center space-y-1">
                                             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md relative bg-white">
                                                <img src={fnd.img} alt={fnd.name} className="w-full h-full object-cover" />
                                             </div>
                                             <span className="text-[8px] font-black text-white leading-none">{fnd.name}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              ) : slideData.layout === 'tabela' ? (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none">{slideData.tituloSlide || "Quadro Comercial"}</h3>
                                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-slate-50">
                                    <div className="bg-slate-900 text-white text-[8px] font-black p-1.5 uppercase flex justify-between">
                                      <span>Postos de Trabalho</span>
                                      <span>Valor Mensal</span>
                                    </div>
                                    <div className="p-3 text-center text-slate-400 text-[8px] italic font-bold uppercase tracking-wider">
                                      [ Tabela de Quadro Efetivo & Insumos será injetada dinamicamente ]
                                    </div>
                                  </div>
                                </div>
                              ) : slideData.layout === 'itens' ? (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none">{slideData.tituloSlide || "Itens Inclusos"}</h3>
                                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-slate-50">
                                    <div className="p-3 text-center text-slate-400 text-[8px] italic font-bold uppercase tracking-wider">
                                      [ Tabela de Itens Inclusos e Exclusos será injetada dinamicamente ]
                                    </div>
                                  </div>
                                </div>
                              ) : slideData.layout === 'aceite' ? (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none border-b border-slate-100 pb-1">{slideData.tituloSlide || "Termo de Aceite"}</h3>
                                  <div className="grid grid-cols-2 gap-4 items-center">
                                    <div className="space-y-1">
                                      <span className="text-[8.5px] font-bold text-slate-500 block leading-tight">Ao desenhar a assinatura na tela, o cliente manifesta aceite com os valores, insumos e premissas dessa proposta comercial.</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="border border-dashed border-slate-300 rounded-xl p-1 text-center h-12 flex flex-col justify-end">
                                        <span className="text-[6.5px] text-slate-400 font-bold block uppercase leading-none">CONTRATANTE</span>
                                      </div>
                                      <div className="border border-dashed border-slate-300 rounded-xl p-1 text-center h-12 flex flex-col justify-end">
                                        <span className="text-[6.5px] text-slate-400 font-bold block uppercase leading-none">CONTRATADA</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <h3 className="text-sm font-black text-[#1e4480] uppercase leading-none">{slideData.tituloSlide || "Slide de Texto"}</h3>
                                  {slideData.subtitulo && <p className="text-[8.5px] font-bold text-slate-400">{slideData.subtitulo}</p>}
                                  <p className="text-[9.5px] text-slate-600 leading-relaxed text-justify line-clamp-3">{slideData.conteudo || "Digite seu conteúdo..."}</p>
                                </div>
                              )}
                            </div>

                            {/* Footer slide */}
                            <div className="relative z-10 flex justify-between items-center pt-2 border-t border-slate-100">
                              <span className={`text-[7.5px] font-black ${slideData.layout === 'cobertura' ? 'text-white/60' : 'text-slate-400'}`}>www.smartbidhub.com.br</span>
                              <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded ${slideData.layout === 'cobertura' ? 'text-white/80 bg-white/10' : 'text-slate-500 bg-slate-100'}`}>{String(activeSlideIdx + 1).padStart(2, '0')}</span>
                            </div>
                          </div>

                          {/* Inputs do slide */}
                          <div className="p-5 bg-white space-y-4 text-slate-800">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título do Slide (Menu)</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                  value={currentSlide.titulo}
                                  placeholder="Ex: Capa"
                                  onChange={e => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].titulo = e.target.value;
                                    setSecoes(list);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Layout do Slide</label>
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                  value={slideData.layout || 'texto'}
                                  onChange={e => {
                                    const list = [...secoes];
                                    const updatedText = JSON.stringify({ ...slideData, layout: e.target.value });
                                    list[activeSlideIdx].texto = updatedText;
                                    setSecoes(list);
                                  }}
                                >
                                  <option value="cobertura">Capa da Apresentação</option>
                                  <option value="quem_somos">Quem Somos</option>
                                  <option value="agradecimento">Olá [Agradecimento]</option>
                                  <option value="valores">Nossos Valores</option>
                                  <option value="performance">Nossa Performance</option>
                                  <option value="servicos">Principais Serviços</option>
                                  <option value="atuacao">Atuação Nacional</option>
                                  <option value="gestao">Gestão Transparente</option>
                                  <option value="fundadores">Conheça os Fundadores</option>
                                  <option value="texto">Lâmina de Texto e Conteúdo</option>
                                  <option value="tabela">Tabela de Preços (Calculadora FPV)</option>
                                  <option value="itens">Itens Inclusos/Exclusos (FPV)</option>
                                  <option value="aceite">Termo de Aceite (Assinatura)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                              <div className="col-span-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título Interno do Slide</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                  value={slideData.tituloSlide || ''}
                                  placeholder="Ex: QUEM SOMOS"
                                  onChange={e => {
                                    const list = [...secoes];
                                    const updatedText = JSON.stringify({ ...slideData, tituloSlide: e.target.value });
                                    list[activeSlideIdx].texto = updatedText;
                                    setSecoes(list);
                                  }}
                                />
                              </div>

                              {slideData.layout !== 'tabela' && slideData.layout !== 'itens' && slideData.layout !== 'aceite' && (
                                <div className="col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subtítulo</label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                    value={slideData.subtitulo || ''}
                                    placeholder="Ex: Mais de 30 anos no mercado"
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, subtitulo: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  />
                                </div>
                              )}

{/* Configurações Avançadas de Layout */}
                              <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                                <div>
                                  <label className="text-[9px] font-black text-[#ef4444] uppercase tracking-widest block mb-1">Estilo da Capa / Serviços / Valores</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                    value={slideData.coverStyle || 'full'}
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, coverStyle: e.target.value, servicosStyle: e.target.value === 'provelo_split' ? 'provelo_grid' : 'simple' });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  >
                                    <option value="full">Estilo Padrão (Full Screen)</option>
                                    <option value="provelo_split">Estilo Provelo Premium (Split / Alta Conversão)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fonte / Tipografia</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                    value={slideData.fontFamily || 'Outfit'}
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, fontFamily: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  >
                                    <option value="Outfit">Outfit (Moderna Provelo)</option>
                                    <option value="Montserrat">Montserrat (Impacto)</option>
                                    <option value="Inter">Inter (Limpa/SaaS)</option>
                                    <option value="Playfair">Playfair (Sofisticada)</option>
                                    <option value="Roboto">Roboto (Clássica)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alinhamento do Texto</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                    value={slideData.align || 'left'}
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, align: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  >
                                    <option value="left">Esquerda</option>
                                    <option value="center">Centralizado</option>
                                    <option value="right">Direita</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor do Título</label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none"
                                    value={slideData.titleColor || ''}
                                    placeholder="Ex: #ef4444 (Vermelho)"
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, titleColor: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Configurações específicas por Layout */}
                              <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Imagem / Foto Principal (Lado Direito)</label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                    value={slideData.sideImage || ''}
                                    placeholder="Ex: URL da imagem do trabalhador ou produto"
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, sideImage: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  />
                                </div>

                                {slideData.layout === 'quem_somos' && (
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Foto Secundária (Quem Somos)</label>
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                      value={slideData.sideImage2 || ''}
                                      placeholder="Ex: URL da segunda foto de equipe"
                                      onChange={e => {
                                        const list = [...secoes];
                                        const updatedText = JSON.stringify({ ...slideData, sideImage2: e.target.value });
                                        list[activeSlideIdx].texto = updatedText;
                                        setSecoes(list);
                                      }}
                                    />
                                  </div>
                                )}

                                {slideData.layout === 'cobertura' && (
                                  <>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Texto da Etiqueta (ex: Terceirização)</label>
                                      <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                        value={slideData.badgeText || ''}
                                        placeholder="Ex: Terceirização de Mão de Obra"
                                        onChange={e => {
                                          const list = [...secoes];
                                          const updatedText = JSON.stringify({ ...slideData, badgeText: e.target.value });
                                          list[activeSlideIdx].texto = updatedText;
                                          setSecoes(list);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor da Etiqueta</label>
                                      <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                        value={slideData.badgeColor || '#ef4444'}
                                        placeholder="Ex: #ef4444"
                                        onChange={e => {
                                          const list = [...secoes];
                                          const updatedText = JSON.stringify({ ...slideData, badgeColor: e.target.value });
                                          list[activeSlideIdx].texto = updatedText;
                                          setSecoes(list);
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>

                              {slideData.layout !== 'cobertura' && slideData.layout !== 'tabela' && slideData.layout !== 'itens' && slideData.layout !== 'aceite' && (
                                <div className="col-span-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conteúdo do Slide (Aceita Tags como [CLIENTE_NOME])</label>
                                  <textarea
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold focus:outline-none focus:border-[#1B4D3E] transition-colors font-mono"
                                    value={slideData.conteudo || ''}
                                    placeholder="Digite o texto de conteúdo..."
                                    onChange={e => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, conteudo: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  </div>

                </div>
              )}

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
  )</>
  );
}