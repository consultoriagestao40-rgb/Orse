'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileText, Plus, Edit2, Trash2, ArrowLeft, Save, ChevronUp, ChevronDown, X, Presentation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLoggedUser } from '@/app/propostas/actions';
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

    const fetchLogoFromDb = async () => {
      try {
        const freshUser = await getLoggedUser();
        if (freshUser && (freshUser as any).tenant?.logoUrl) {
          setCompanyLogo((freshUser as any).tenant.logoUrl);
        }
      } catch (err) {
        console.error('Error fetching tenant logo from database:', err);
      }
    };
    fetchLogoFromDb();
  }, []);

  // Global Keyboard Shortcuts (Delete/Backspace to remove selected element)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;

      // Don't trigger if user is typing in a text area or input field
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        setSecoes((prevSecoes) => {
          const currentSlide = prevSecoes[activeSlideIdx];
          if (!currentSlide) return prevSecoes;

          let slideData: any = {};
          try {
            slideData = JSON.parse(currentSlide.texto);
          } catch (err) {
            return prevSecoes;
          }

          const elements = slideData.elements || [];
          const updatedElements = elements.filter((item: any) => item.id !== selectedElementId);
          const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });

          const list = [...prevSecoes];
          list[activeSlideIdx] = { ...list[activeSlideIdx], texto: updatedText };
          return list;
        });
        
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, activeSlideIdx]);

  // Canvas Drag & Drop and Property States
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Helper action to upload files locally
  const uploadSlideImageClient = async (e: any, elementId: string, slideData: any, setSecoes: any, activeSlideIdx: number, secoes: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { uploadSlideImageAction } = require('../actions');
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const base64Data = event.target.result;
      const res = await uploadSlideImageAction(base64Data, file.name);
      if (res.success && res.fileUrl) {
        const list = [...secoes];
        const updatedElements = (slideData.elements || []).map((el: any) => {
          if (el.id === elementId) {
            return { ...el, src: res.fileUrl };
          }
          return el;
        });
        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
        list[activeSlideIdx].texto = updatedText;
        setSecoes(list);
      } else {
        alert("Erro ao fazer upload da imagem: " + (res.error || "Tente novamente"));
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper template injector for pre-designed slide layouts
  const applyGabarito = (layoutType: string, setSecoes: any, activeSlideIdx: number, secoes: any) => {
    const list = [...secoes];
    let elements: any[] = [];
    let titleColor = "#ef4444";
    let textColor = "#475569";
    let bgColor = "#ffffff";

    if (layoutType === 'provelo_split') {
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_logo", type: "image", x: 60, y: 40, w: 120, h: 40, src: companyLogo, mask: "none", zIndex: 20 },
        { id: "el_badge", type: "text", x: 60, y: 150, w: 300, h: 25, content: "MODELO DE PROPOSTA", style: { fontSize: 10, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_title", type: "text", x: 60, y: 185, w: 500, h: 90, content: "[CLIENTE_NOME]", style: { fontSize: 38, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_subtitle", type: "text", x: 60, y: 285, w: 500, h: 50, content: "Proposta Comercial para prestação de serviços e facilities.", style: { fontSize: 13, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_info", type: "text", x: 60, y: 350, w: 500, h: 60, content: "Nº Proposta: FPV-XXX | Revisão: R01\nElaborado por Novos Negócios", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'valores') {
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 500, h: 50, content: "NOSSOS VALORES", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_title", type: "text", x: 60, y: 110, w: 480, h: 22, content: "Compromisso com a Qualidade", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_text", type: "text", x: 60, y: 135, w: 480, h: 60, content: "Entregamos serviços com excelência, priorizando a segurança, a padronização e a eficiência operacional em cada detalhe.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_title", type: "text", x: 60, y: 205, w: 480, h: 22, content: "Valorização do Relacionamento", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_text", type: "text", x: 60, y: 230, w: 480, h: 60, content: "Valorizamos as pessoas por trás dos processos — nossos colaboradores, clientes e parceiros. Relações duradouras com respeito e transparência.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_title", type: "text", x: 60, y: 300, w: 480, h: 22, content: "Evolução Contínua", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_text", type: "text", x: 60, y: 325, w: 480, h: 60, content: "Buscamos sempre melhorar. Investimos em inovação, capacitação e tecnologia para oferecer soluções modernas e ágeis.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'performance') {
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 500, h: 50, content: "NOSSA PERFORMANCE", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 95, w: 460, h: 60, content: "Na Provelo, resultado é mais do que uma meta — é um reflexo direto do nosso compromisso com excelência operacional, qualidade no atendimento e foco total no cliente.", style: { fontSize: 10, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_img_building", type: "image", x: 60, y: 170, w: 460, h: 320, src: "https://images.unsplash.com/photo-1542362567-b07eac79094d?q=80&w=600", mask: "none", zIndex: 20 },
        
        { id: "el_p1_box", type: "shape", x: 560, y: 90, w: 160, h: 100, color: "#ef4444", radius: 24, zIndex: 20 },
        { id: "el_p1_title", type: "text", x: 570, y: 110, w: 140, h: 40, content: "29 MIL", style: { fontSize: 20, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_sub", type: "text", x: 570, y: 150, w: 140, h: 30, content: "HORAS DE SERVIÇO", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_text", type: "text", x: 740, y: 90, w: 220, h: 100, content: "Em 2022, movimentamos mais de 29 mil horas de serviços prestados em contratos ativos, comprovando nossa capacidade de atuação em larga escala com controle e eficiência.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 },

        { id: "el_p2_box", type: "shape", x: 560, y: 220, w: 160, h: 100, color: "#ef4444", radius: 24, zIndex: 20 },
        { id: "el_p2_title", type: "text", x: 570, y: 240, w: 140, h: 40, content: "1.220", style: { fontSize: 20, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_sub", type: "text", x: 570, y: 280, w: 140, h: 30, content: "VISITAS TÉCNICAS", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_text", type: "text", x: 740, y: 220, w: 220, h: 100, content: "No mesmo ano, realizamos mais de 1.220 atendimentos e visitas técnicas, sempre com equipes treinadas, processos padronizados e foco na satisfação do cliente.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 }
      ];
    } else if (layoutType === 'fundadores') {
      elements = [
        { id: "el_title", type: "text", x: 60, y: 40, w: 880, h: 40, content: "CONHEÇA NOSSOS FUNDADORES", style: { fontSize: 28, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 880, h: 30, content: "Transparência e confiança em conhecer a base da nossa excelência", style: { fontSize: 12, fontWeight: "bold", color: "#475569", textAlign: "center" }, zIndex: 20 },
        
        { id: "el_f1_photo", type: "image", x: 140, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f1_name", type: "text", x: 140, y: 345, w: 180, h: 25, content: "Ádamo Quadros", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f1_role", type: "text", x: 140, y: 370, w: 180, h: 20, content: "Chief Executive Officer (CEO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 },

        { id: "el_f2_photo", type: "image", x: 410, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f2_name", type: "text", x: 410, y: 345, w: 180, h: 25, content: "Guilherme França", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f2_role", type: "text", x: 410, y: 370, w: 180, h: 20, content: "Chief Product Officer (CPO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 },

        { id: "el_f3_photo", type: "image", x: 680, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f3_name", type: "text", x: 680, y: 345, w: 180, h: 25, content: "Giovanna Castro", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f3_role", type: "text", x: 680, y: 370, w: 180, h: 20, content: "Chief Technology Officer (CTO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 }
      ];
    }

    const updatedText = JSON.stringify({
      layout: "canvas_custom",
      fontFamily: "Outfit",
      bgColor,
      textColor,
      titleColor,
      elements
    });
    list[activeSlideIdx].texto = updatedText;
    setSecoes(list);
    setSelectedElementId(null);
  };

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
                  <div className="col-span-12 md:col-span-8 space-y-6">
                    {(() => {
                      const currentSlide = secoes[activeSlideIdx];
                      if (!currentSlide) return <p className="text-slate-400 text-center py-10 font-bold uppercase tracking-wide">Selecione ou crie um slide na barra lateral.</p>;

                      let slideData: any = {};
                      try {
                        slideData = JSON.parse(currentSlide.texto);
                      } catch (e) {
                        slideData = { layout: 'texto', tituloSlide: currentSlide.titulo, subtitulo: '', conteudo: currentSlide.texto };
                      }

                      const isCanvasLayout = slideData.layout === 'canvas_custom';
                      const elements = slideData.elements || [];

                      // Pointer move and drag/resize handlers
                      const handlePointerDown = (e: React.PointerEvent, elementId: string, isResizeHandle: boolean = false) => {
                        e.stopPropagation();
                        const el = elements.find((item: any) => item.id === elementId);
                        if (!el) return;

                        setSelectedElementId(elementId);
                        const scale = e.currentTarget.parentElement?.getBoundingClientRect().width ? e.currentTarget.parentElement.getBoundingClientRect().width / 1000 : 1;

                        setDragStart({ x: e.clientX, y: e.clientY });
                        setElementStart({ x: el.x, y: el.y, w: el.w, h: el.h });

                        if (isResizeHandle) {
                          setIsResizing(true);
                          setIsDragging(false);
                        } else {
                          setIsDragging(true);
                          setIsResizing(false);
                        }
                        
                        e.currentTarget.setPointerCapture(e.pointerId);
                      };

                      const handlePointerMove = (e: React.PointerEvent, elementId: string) => {
                        if (!isDragging && !isResizing) return;
                        if (selectedElementId !== elementId) return;
                        if (!dragStart || !elementStart) return;

                        const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                        if (!rect) return;

                        const scaleX = rect.width / 1000;
                        const scaleY = rect.height / 562.5;

                        const deltaX = (e.clientX - dragStart.x) / scaleX;
                        const deltaY = (e.clientY - dragStart.y) / scaleY;

                        const list = [...secoes];
                        const updatedElements = elements.map((item: any) => {
                          if (item.id === elementId) {
                            if (isDragging) {
                              const newX = Math.round(Math.max(0, Math.min(1000 - item.w, elementStart.x + deltaX)));
                              const newY = Math.round(Math.max(0, Math.min(562.5 - item.h, elementStart.y + deltaY)));
                              return { ...item, x: newX, y: newY };
                            } else if (isResizing) {
                              const newW = Math.round(Math.max(40, Math.min(1000 - item.x, elementStart.w + deltaX)));
                              const newH = Math.round(Math.max(20, Math.min(562.5 - item.y, elementStart.h + deltaY)));
                              return { ...item, w: newW, h: newH };
                            }
                          }
                          return item;
                        });

                        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                      };

                      const handlePointerUp = (e: React.PointerEvent) => {
                        setIsDragging(false);
                        setIsResizing(false);
                        setDragStart(null);
                        setElementStart(null);
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      };

                      const updateElementStyle = (elementId: string, styleKey: string, styleValue: any) => {
                        const list = [...secoes];
                        const updatedElements = elements.map((item: any) => {
                          if (item.id === elementId) {
                            if (item.type === 'text') {
                              return { ...item, style: { ...item.style, [styleKey]: styleValue } };
                            } else {
                              return { ...item, [styleKey]: styleValue };
                            }
                          }
                          return item;
                        });
                        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                      };

                      const updateElementContent = (elementId: string, content: string) => {
                        const list = [...secoes];
                        const updatedElements = elements.map((item: any) => {
                          if (item.id === elementId) {
                            return { ...item, content };
                          }
                          return item;
                        });
                        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                      };

                      const addCustomElement = (type: 'text' | 'image' | 'shape') => {
                        const list = [...secoes];
                        let newEl: any = {};
                        if (type === 'text') {
                          newEl = {
                            id: `el_text_${Date.now()}`,
                            type: 'text',
                            x: 100, y: 100, w: 300, h: 50,
                            content: 'Clique duas vezes para editar texto',
                            style: { fontSize: 16, fontWeight: 'normal', color: '#334155', textAlign: 'left' },
                            zIndex: 20
                          };
                        } else if (type === 'image') {
                          newEl = {
                            id: `el_img_${Date.now()}`,
                            type: 'image',
                            x: 100, y: 100, w: 200, h: 200,
                            src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200',
                            mask: 'none',
                            zIndex: 20
                          };
                        } else if (type === 'shape') {
                          newEl = {
                            id: `el_shape_${Date.now()}`,
                            type: 'shape',
                            x: 100, y: 100, w: 150, h: 150,
                            color: '#ef4444',
                            radius: 12,
                            zIndex: 10
                          };
                        }

                        const updatedElements = [...elements, newEl];
                        const updatedText = JSON.stringify({ ...slideData, layout: 'canvas_custom', elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                        setSelectedElementId(newEl.id);
                      };

                      const removeElement = (elementId: string) => {
                        const list = [...secoes];
                        const updatedElements = elements.filter((item: any) => item.id !== elementId);
                        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                        setSelectedElementId(null);
                      };

                      const changeZIndex = (elementId: string, direction: 'front' | 'back') => {
                        const list = [...secoes];
                        const updatedElements = elements.map((item: any) => {
                          if (item.id === elementId) {
                            const currentZ = item.zIndex || 10;
                            return { ...item, zIndex: direction === 'front' ? currentZ + 5 : Math.max(1, currentZ - 5) };
                          }
                          return item;
                        });
                        const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                        list[activeSlideIdx].texto = updatedText;
                        setSecoes(list);
                      };

                      const selectedElement = elements.find((item: any) => item.id === selectedElementId);

                      return (
                        <div className="space-y-6 animate-fadeIn">
                          {/* Botões Globais de Elementos e Paletas */}
                          <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-50 border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => addCustomElement('text')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                + Caixa de Texto
                              </button>
                              <button
                                type="button"
                                onClick={() => addCustomElement('image')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                + Foto/Imagem
                              </button>
                              <button
                                type="button"
                                onClick={() => addCustomElement('shape')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                              >
                                + Forma Colorida
                              </button>
                            </div>

                            <div className="flex gap-2 items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Layout Provelo:</span>
                              <button
                                type="button"
                                onClick={() => applyGabarito('provelo_split', setSecoes, activeSlideIdx, secoes)}
                                className="bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs cursor-pointer"
                              >
                                Capa Split
                              </button>
                              <button
                                type="button"
                                onClick={() => applyGabarito('valores', setSecoes, activeSlideIdx, secoes)}
                                className="bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs cursor-pointer"
                              >
                                Valores
                              </button>
                              <button
                                type="button"
                                onClick={() => applyGabarito('performance', setSecoes, activeSlideIdx, secoes)}
                                className="bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs cursor-pointer"
                              >
                                Performance
                              </button>
                              <button
                                type="button"
                                onClick={() => applyGabarito('fundadores', setSecoes, activeSlideIdx, secoes)}
                                className="bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs cursor-pointer"
                              >
                                Fundadores
                              </button>
                            </div>
                          </div>

                          {/* O CANVAS DE TRABALHO 16:9 */}
                          <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-slate-950 relative">
                            {/* Proportional 16:9 Canvas box */}
                            <div 
                              className="w-full aspect-[16/9] relative select-none overflow-hidden cursor-crosshair transition-all"
                              onClick={() => setSelectedElementId(null)}
                              style={{
                                backgroundColor: slideData.bgColor || '#ffffff',
                                fontFamily: (slideData.fontFamily || 'Outfit') === 'Outfit' ? 'Outfit, sans-serif' : 
                                            (slideData.fontFamily || 'Outfit') === 'Montserrat' ? 'Montserrat, sans-serif' : 
                                            (slideData.fontFamily || 'Outfit') === 'Inter' ? 'Inter, sans-serif' : 
                                            (slideData.fontFamily || 'Outfit') === 'Playfair' ? 'Playfair Display, serif' : 'Roboto, sans-serif'
                              }}
                            >
                              {/* Background dots grid (for design cues) */}
                              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

                              {/* Draw elements */}
                              {isCanvasLayout ? (
                                (slideData.elements || []).map((el: any) => {
                                  const isSelected = selectedElementId === el.id;
                                  
                                  // Mask clipping
                                  const clipPathVal = el.mask === 'circle' ? 'ellipse(50% 50% at 50% 50%)' :
                                                      el.mask === 'shield' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' :
                                                      el.mask === 'hexagon' ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' :
                                                      el.mask === 'provelo_mask' ? 'polygon(15% 0%, 100% 0%, 100% 85%, 85% 100%, 0% 100%, 0% 15%)' : undefined;

                                  const borderRadiusStyle = el.mask === 'provelo_mask' ? '120px 24px 120px 24px' : undefined;

                                  return (
                                    <div
                                      key={el.id}
                                      onPointerDown={(e) => handlePointerDown(e, el.id)}
                                      onPointerMove={(e) => handlePointerMove(e, el.id)}
                                      onPointerUp={handlePointerUp}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`absolute select-none cursor-move group transition-shadow ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-[999] shadow-lg' : 'hover:ring-1 hover:ring-slate-300'}`}
                                      style={{
                                        left: `${el.x / 10}%`,
                                        top: `${el.y / 5.625}%`,
                                        width: `${el.w / 10}%`,
                                        height: `${el.h / 5.625}%`,
                                        zIndex: el.zIndex || 10
                                      }}
                                    >
                                      {/* Element core renderer */}
                                      <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: borderRadiusStyle }}>
                                        {el.type === 'text' && (
                                          <div 
                                            className="w-full h-full break-words p-1 outline-none text-slate-800 font-semibold"
                                            style={{
                                              fontSize: `${el.style?.fontSize ? el.style.fontSize * 0.75 : 12}px`,
                                              fontWeight: el.style?.fontWeight || 'normal',
                                              color: el.style?.color || '#334155',
                                              textAlign: el.style?.textAlign || 'left',
                                              lineHeight: '1.25'
                                            }}
                                          >
                                            {el.content.split('\n').map((line: string, lIdx: number) => (
                                              <React.Fragment key={lIdx}>
                                                {line}
                                                {lIdx < el.content.split('\n').length - 1 && <br />}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        )}

                                        {el.type === 'image' && (
                                          <img
                                            src={el.src}
                                            alt="Element"
                                            className="w-full h-full object-cover pointer-events-none"
                                            style={{
                                              clipPath: clipPathVal,
                                              borderRadius: borderRadiusStyle
                                            }}
                                          />
                                        )}

                                        {el.type === 'shape' && (
                                          <div
                                            className="w-full h-full shadow-xs"
                                            style={{
                                              backgroundColor: el.color || '#ef4444',
                                              borderRadius: `${el.radius || 0}px`
                                            }}
                                          />
                                        )}
                                      </div>

                                      {/* Resize Handle (Bottom-Right) */}
                                      {isSelected && (
                                        <div
                                          onPointerDown={(e) => handlePointerDown(e, el.id, true)}
                                          className="absolute bottom-[-5px] right-[-5px] w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-[1000]"
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                // Legacy structured templates fallback previews (circle/split/etc.)
                                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
                                  <Presentation size={48} className="text-slate-600 mb-4 shrink-0" />
                                  <h4 className="text-sm font-black uppercase text-slate-300">Visualização do Modelo Legado</h4>
                                  <p className="text-xs text-slate-500 mt-2 max-w-sm text-center">Clique em qualquer um dos botões "Layout Provelo" no painel superior para carregar os novos slides interativos arrastáveis no padrão da Provelo!</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* PAINEL LATERAL/INFERIOR DE CONFIGURAÇÕES DE ELEMENTOS (PROPRIEDADES) */}
                          <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Propriedades do Elemento Selecionado */}
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                                {selectedElement ? `Propriedades do Elemento: ${selectedElement.type.toUpperCase()}` : 'Selecione um elemento no slide para editar'}
                              </h4>

                              {selectedElement && selectedElement.type === 'text' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conteúdo do Texto (Use \n para quebrar linha)</label>
                                    <textarea
                                      className="w-full bg-white border border-slate-200 rounded-xl text-xs px-4 py-3 min-h-[60px] font-mono focus:outline-none focus:border-[#1B4D3E] transition-colors"
                                      value={selectedElement.content}
                                      onChange={(e) => updateElementContent(selectedElement.id, e.target.value)}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tamanho da Fonte (px)</label>
                                      <input
                                        type="number"
                                        className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2"
                                        value={selectedElement.style?.fontSize || 16}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'fontSize', Number(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor do Texto</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="color"
                                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                                          value={selectedElement.style?.color || '#334155'}
                                          onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                        />
                                        <input
                                          type="text"
                                          className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-3 py-2 font-mono uppercase"
                                          value={selectedElement.style?.color || '#334155'}
                                          onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'fontWeight', 'normal')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.fontWeight === 'normal' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Normal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'fontWeight', 'bold')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.fontWeight === 'bold' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Negrito
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'fontWeight', '900')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.fontWeight === '900' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Black
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'textAlign', 'left')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.textAlign === 'left' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Esquerda
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'textAlign', 'center')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.textAlign === 'center' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Centro
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'textAlign', 'right')}
                                      className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase ${selectedElement.style?.textAlign === 'right' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                                    >
                                      Direita
                                    </button>
                                  </div>
                                </div>
                              )}

                              {selectedElement && selectedElement.type === 'image' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Carregar Imagem Real (Subir Foto)</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                      onChange={(e) => uploadSlideImageClient(e, selectedElement.id, slideData, setSecoes, activeSlideIdx, secoes)}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ou colar URL da Imagem</label>
                                    <input
                                      type="text"
                                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                      value={selectedElement.src}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'src', e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Moldura da Foto (Estética Premium)</label>
                                    <select
                                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                      value={selectedElement.mask || 'none'}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'mask', e.target.value)}
                                    >
                                      <option value="none">Nenhuma Moldura (Retangular)</option>
                                      <option value="circle">Círculo Perfeito (Fundadores)</option>
                                      <option value="provelo_mask">Cantos Arredondados Provelo</option>
                                      <option value="hexagon">Hexágono Geométrico</option>
                                      <option value="shield">Escudo Corporativo</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {selectedElement && selectedElement.type === 'shape' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor de Fundo da Forma</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="color"
                                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                                        value={selectedElement.color || '#ef4444'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                      />
                                      <input
                                        type="text"
                                        className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-3 py-2 font-mono uppercase"
                                        value={selectedElement.color || '#ef4444'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Arredondamento dos Cantos (px)</label>
                                    <input
                                      type="number"
                                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2"
                                      value={selectedElement.radius || 0}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'radius', Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedElement && (
                                <div className="flex gap-2 border-t border-slate-200 pt-4 mt-4">
                                  <button
                                    type="button"
                                    onClick={() => changeZIndex(selectedElement.id, 'front')}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-[10px] uppercase shadow-xs flex-1 transition-all"
                                  >
                                    Trazer Frente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => changeZIndex(selectedElement.id, 'back')}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-[10px] uppercase shadow-xs flex-1 transition-all"
                                  >
                                    Enviar Trás
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeElement(selectedElement.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-2 rounded-xl text-[10px] uppercase shadow-xs flex-1 transition-all"
                                  >
                                    Deletar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Configurações Globais do Slide */}
                            <div className="border-l border-slate-200 pl-0 md:pl-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">
                                Configurações Globais do Slide
                              </h4>

                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipografia Global do Slide</label>
                                  <select
                                    className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2.5 font-bold"
                                    value={slideData.fontFamily || 'Outfit'}
                                    onChange={(e) => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, fontFamily: e.target.value });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                  >
                                    <option value="Outfit">Outfit (Moderna/Elegante - Provelo)</option>
                                    <option value="Montserrat">Montserrat (Robusta)</option>
                                    <option value="Inter">Inter (Legível/Limpa)</option>
                                    <option value="Playfair">Playfair Display (Serifada/Clássica)</option>
                                    <option value="Roboto">Roboto (Padrão Corporativo)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor de Fundo Global</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                                      value={slideData.bgColor || '#ffffff'}
                                      onChange={(e) => {
                                        const list = [...secoes];
                                        const updatedText = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                        list[activeSlideIdx].texto = updatedText;
                                        setSecoes(list);
                                      }}
                                    />
                                    <input
                                      type="text"
                                      className="flex-1 bg-white border border-slate-200 rounded-lg text-xs px-3 py-2 font-mono uppercase"
                                      value={slideData.bgColor || '#ffffff'}
                                      onChange={(e) => {
                                        const list = [...secoes];
                                        const updatedText = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                        list[activeSlideIdx].texto = updatedText;
                                        setSecoes(list);
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4 mt-2">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Paletas Prontas Recomendadas</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...secoes];
                                        const updatedText = JSON.stringify({ ...slideData, bgColor: '#ffffff', textColor: '#475569', titleColor: '#0f172a' });
                                        list[activeSlideIdx].texto = updatedText;
                                        setSecoes(list);
                                      }}
                                      className="border border-slate-200 bg-white hover:bg-slate-50 p-2.5 rounded-xl text-left flex items-center justify-between"
                                    >
                                      <span className="text-[9px] font-black uppercase text-slate-700">Tema Claro</span>
                                      <div className="flex gap-0.5 shadow-xs">
                                        <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...secoes];
                                        const updatedText = JSON.stringify({ ...slideData, bgColor: '#0f172a', textColor: '#cbd5e1', titleColor: '#ffffff' });
                                        list[activeSlideIdx].texto = updatedText;
                                        setSecoes(list);
                                      }}
                                      className="border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl text-left flex items-center justify-between text-white"
                                    >
                                      <span className="text-[9px] font-black uppercase text-slate-300">Tema Escuro</span>
                                      <div className="flex gap-0.5 shadow-xs">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
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
    </>
  );
}