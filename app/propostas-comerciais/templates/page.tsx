'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import BrazilMap from '@/components/BrazilMap';
import { 
  FileText, ArrowLeft, Save, Printer, Building2, Tag, Trash2, ShieldCheck, 
  ChevronUp, ChevronDown, Plus, X, Undo, Redo, Copy, Paintbrush, 
  Lock, Unlock, Eye, EyeOff, Smile, Phone, Mail, Award, Users, DollarSign, 
  Star, Briefcase, HelpCircle, Edit2, Play, Search, Image as ImageIcon, Sparkles,
  Layout, Presentation
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLoggedUser } from '@/app/propostas/actions';
import {
  getTemplatesProposta,
  createTemplateProposta,
  updateTemplateProposta,
  deleteTemplateProposta,
  uploadSlideImageAction
} from '../actions';

const LucideIconRenderer = ({ name, className, size, color }: { name: string; className?: string; size?: number; color?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <HelpCircle size={size} className={className} />;
  return <IconComponent size={size} className={className} style={{ color }} />;
};

const renderChartElement = (el: any, slideBgColor: string = '#ffffff') => {
  const chartType = el.chartType || 'donut';
  const chartData = el.chartData || [
    { label: 'Limpeza', value: 45, color: '#ef4444' },
    { label: 'Portaria', value: 30, color: '#1B4D3E' },
    { label: 'Recepção', value: 25, color: '#3b82f6' }
  ];

  const total = chartData.reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0);

  if (chartType === 'donut' || chartType === 'pie') {
    let currentAngle = 0;
    const radius = 80;
    const cx = 100;
    const cy = 100;

    return (
      <div className="w-full h-full flex items-center justify-between p-2 gap-4">
        {/* SVG Chart */}
        <div className="relative shrink-0" style={{ width: '50%', height: '100%', minWidth: '80px' }}>
          <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            {total > 0 ? (
              chartData.map((item: any, idx: number) => {
                const val = Number(item.value) || 0;
                const angle = (val / total) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle += angle;

                const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
                  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                  return {
                    x: centerX + (r * Math.cos(angleInRadians)),
                    y: centerY + (r * Math.sin(angleInRadians))
                  };
                };

                const start = polarToCartesian(cx, cy, radius, endAngle);
                const end = polarToCartesian(cx, cy, radius, startAngle);
                const largeArcFlag = angle <= 180 ? "0" : "1";
                const d = [
                  "M", cx, cy,
                  "L", start.x, start.y,
                  "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                  "Z"
                ].join(" ");

                return (
                  <path
                    key={idx}
                    d={d}
                    fill={item.color || '#cccccc'}
                    stroke={slideBgColor}
                    strokeWidth="1.5"
                  />
                );
              })
            ) : (
              <circle cx={cx} cy={cy} r={radius} fill="#e2e8f0" />
            )}
            
            {chartType === 'donut' && (
              <circle cx={cx} cy={cy} r={radius * 0.55} fill={slideBgColor} />
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-y-auto max-h-full pr-1">
          {chartData.map((item: any, idx: number) => {
            const val = Number(item.value) || 0;
            const percent = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
            return (
              <div key={idx} className="flex items-center gap-2 text-left min-w-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color || '#cccccc' }}
                />
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="text-[10px] font-black text-slate-700 truncate">{item.label}</div>
                  <div className="text-[9px] font-bold text-slate-400">{val} ({percent}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (chartType === 'bar') {
    const maxVal = Math.max(...chartData.map((item: any) => Number(item.value) || 1), 1);

    return (
      <div className="w-full h-full flex flex-col justify-center p-3 gap-2 overflow-y-auto">
        {chartData.map((item: any, idx: number) => {
          const val = Number(item.value) || 0;
          const pctOfMax = (val / maxVal) * 100;
          const pctOfTotal = total > 0 ? ((val / total) * 100).toFixed(0) : '0';

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-700">
                <span className="truncate max-w-[70%]">{item.label}</span>
                <span className="text-slate-500">{val} ({pctOfTotal}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${pctOfMax}%`, 
                    backgroundColor: item.color || '#ef4444' 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (chartType === 'column') {
    const maxVal = Math.max(...chartData.map((item: any) => Number(item.value) || 1), 1);

    return (
      <div className="w-full h-full flex flex-col justify-between p-3">
        <div className="flex-1 flex items-end justify-around gap-2 px-1">
          {chartData.map((item: any, idx: number) => {
            const val = Number(item.value) || 0;
            const pctOfMax = (val / maxVal) * 80;
            const pctOfTotal = total > 0 ? ((val / total) * 100).toFixed(0) : '0';

            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[9px] font-black text-slate-700 leading-none">{val}</span>
                <div 
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{ 
                    height: `${pctOfMax}%`, 
                    backgroundColor: item.color || '#ef4444',
                    minHeight: '4px'
                  }}
                />
                <span className="text-[8px] font-black text-slate-400 truncate max-w-full leading-none uppercase mt-1">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

const iconPresets = [
  'ShieldCheck', 'Star', 'Award', 'Users', 'Phone', 'Mail', 
  'DollarSign', 'Briefcase', 'Building2', 'Tag', 'Smile', 
  'ThumbsUp', 'Calendar', 'MapPin', 'Clock', 'FileText', 
  'TrendingUp', 'Heart', 'Coffee', 'CheckCircle2'
];

const curatedPhotos = [
  {
    title: 'Limpeza e Conservação',
    src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600',
    tags: ['limpeza', 'conservação', 'higienização', 'serviço', 'facilities']
  },
  {
    title: 'Recepção e Atendimento',
    src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600',
    tags: ['recepção', 'atendimento', 'secretária', 'recepcionista', 'portaria']
  },
  {
    title: 'Jardinagem e Áreas Verdes',
    src: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600',
    tags: ['jardinagem', 'jardim', 'verde', 'paisagismo', 'conservação']
  },
  {
    title: 'Segurança e Monitoramento',
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600',
    tags: ['segurança', 'vigilância', 'guarda', 'portaria', 'controle']
  },
  {
    title: 'Copa e Serviços de Apoio',
    src: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600',
    tags: ['copa', 'café', 'atendimento', 'facilities', 'apoio']
  },
  {
    title: 'Financeiro e Resultados',
    src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
    tags: ['valores', 'finanças', 'lucro', 'economia', 'sucesso', 'crescimento']
  },
  {
    title: 'Escritório Corporativo',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600',
    tags: ['corporate', 'escritório', 'condomínio', 'empresa', 'fachada']
  }
];

const curatedIcons = [
  { title: 'Segurança Garantida', name: 'ShieldCheck', tags: ['segurança', 'proteção', 'garantia', 'confiança', 'cuidado'] },
  { title: 'Selo de Qualidade', name: 'Award', tags: ['qualidade', 'destaque', 'selo', 'prêmio', 'excelência'] },
  { title: 'Equipe e Sócios', name: 'Users', tags: ['equipe', 'colaboradores', 'sócios', 'pessoas', 'recursos'] },
  { title: 'Economia e Valores', name: 'DollarSign', tags: ['financeiro', 'economia', 'investimento', 'valores', 'custo'] },
  { title: 'Serviço Profissional', name: 'Briefcase', tags: ['serviços', 'profissional', 'trabalho', 'negócios', 'vendas'] },
  { title: 'Sede e Condomínios', name: 'Building2', tags: ['sede', 'condomínio', 'empresa', 'prédio', 'facilities'] },
  { title: 'Eficiência e Sucesso', name: 'CheckCircle2', tags: ['eficiência', 'concluído', 'sucesso', 'feito', 'ok'] },
  { title: 'Performance e Alta', name: 'TrendingUp', tags: ['crescimento', 'performance', 'resultados', 'lucro', 'metas'] },
  { title: 'Escala e Tempo', name: 'Clock', tags: ['escala', 'pontualidade', 'tempo', 'horas', 'jornada'] },
  { title: 'Cobertura de Atendimento', name: 'MapPin', tags: ['localização', 'cobertura', 'presença', 'endereço', 'filial'] }
];

const FVP_INTEGRATION_TAGS = [
  { tag: '[CLIENTE_NOME]', label: 'Cliente', desc: 'Nome Fantasia do Cliente' },
  { tag: '[CLIENTE_CNPJ]', label: 'CNPJ Cliente', desc: 'CNPJ do Cliente' },
  { tag: '[CLIENTE_ENDERECO]', label: 'Endereço Cliente', desc: 'Endereço Completo do Cliente' },
  { tag: '[CLIENTE_CONTATO]', label: 'Contato Cliente', desc: 'Nome do Contato Principal no Cliente' },
  { tag: '[VENDEDOR_NOME]', label: 'Vendedor Nome', desc: 'Nome do Vendedor / Consultor Comercial' },
  { tag: '[VENDEDOR_EMAIL]', label: 'Vendedor Email', desc: 'Email de contato do Vendedor' },
  { tag: '[VENDEDOR_TELEFONE]', label: 'Vendedor Tel.', desc: 'Telefone do Vendedor' },
  { tag: '[NUMERO_PROPOSTA]', label: 'Nº Proposta', desc: 'Número da Proposta (ex: FPV-010)' },
  { tag: '[REVISAO]', label: 'Revisão', desc: 'Número da Revisão Atual (ex: R03)' },
  { tag: '[DATA_PROPOSTA]', label: 'Data Proposta', desc: 'Data de Emissão da Proposta' },
  { tag: '[VALIDADE_PROPOSTA]', label: 'Validade Prop.', desc: 'Data Limite de Validade da Proposta' },
  { tag: '[OBJETO_PROPOSTA]', label: 'Objeto Prop.', desc: 'Objeto da Proposta Comercial' },
  { tag: '[ESCOPO_TECNICO]', label: 'Escopo Técnico', desc: 'Descrição Detalhada do Escopo' },
  { tag: '[LOCAL_PRESTACAO]', label: 'Local Prestação', desc: 'Local onde o serviço será realizado' },
  { tag: '[VALOR_MENSAL]', label: 'Valor Mensal', desc: 'Valor total dos serviços mensais' },
  { tag: '[VALOR_ANUAL]', label: 'Valor Anual', desc: 'Valor total anual contratado' },
  { tag: '[VALOR_TOTAL]', label: 'Valor Total', desc: 'Valor total global da proposta' },
  { tag: '[TABELA]', label: 'Tabela Financeira', desc: 'Quadro Completo de Preços e Insumos' },
  { tag: '[ITENS]', label: 'Itens Inc/Exc', desc: 'Listagem de Itens Inclusos e Exclusos' },
  { tag: '[CONDICOES_COMERCIAIS]', label: 'Condições Com.', desc: 'Condições de Faturamento e Pagamento' },
  { tag: '[PRAZO_CONTRATO]', label: 'Prazo Contrato', desc: 'Vigência do Contrato Proposto' },
  { tag: '[LOGO_EMPRESA]', label: 'Logo Empresa', desc: 'Imagem da Logo da sua Empresa/Tenant' },
  { tag: '[TERMO_ACEITE]', label: 'Termo de Aceite', desc: 'Assinaturas e Termo de Aceite Final' }
];

const isLightColor = (hex: string) => {
  if (!hex) return true;
  const color = hex.replace('#', '');
  if (color.length === 3) {
    const r = parseInt(color[0] + color[0], 16);
    const g = parseInt(color[1] + color[1], 16);
    const b = parseInt(color[2] + color[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  } else if (color.length === 6) {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  return true;
};

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
  // Canvas Drag & Drop and Property States
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Estados adicionais para a Gaveta e Abas do Canva
  const [activeTab, setActiveTab] = useState<'conteudo' | 'estilo' | 'camadas' | 'paleta'>('conteudo');
  const [searchIcon, setSearchIcon] = useState('');
  const [searchElement, setSearchElement] = useState('');
  const [selectedElementCat, setSelectedElementCat] = useState<'tudo' | 'graficos' | 'fotos'>('tudo');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');
  const [activeCanvaTab, setActiveCanvaTab] = useState<'laminas' | 'elementos' | 'layouts' | 'estilos' | 'tags' | 'camadas'>('laminas');
  const [imageReplaceElementId, setImageReplaceElementId] = useState<string | null>(null);
  const imageReplaceInputRef = useRef<HTMLInputElement>(null);

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

  // History state for Undo/Redo
  const [history, setHistory] = useState<{ secoes: { titulo: string; texto: string }[]; activeSlideIdx: number }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = React.useRef(false);

  // Automatically watch secoes & activeSlideIdx changes to record history
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    if (!editingTemplate || secoes.length === 0) return;

    const nextState = { secoes: JSON.parse(JSON.stringify(secoes)), activeSlideIdx };
    
    setHistory(prevHistory => {
      const cleanHistory = prevHistory.slice(0, historyIndex + 1);
      
      // Check if last state is identical
      if (cleanHistory.length > 0) {
        const lastState = cleanHistory[cleanHistory.length - 1];
        if (JSON.stringify(lastState.secoes) === JSON.stringify(nextState.secoes) && lastState.activeSlideIdx === nextState.activeSlideIdx) {
          return prevHistory;
        }
      }
      
      const updatedHistory = [...cleanHistory, nextState].slice(-50);
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [secoes, activeSlideIdx, editingTemplate]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevPayload = history[prevIdx];
      if (prevPayload) {
        isUndoRedoAction.current = true;
        setHistoryIndex(prevIdx);
        setSecoes(JSON.parse(JSON.stringify(prevPayload.secoes)));
        setActiveSlideIdx(prevPayload.activeSlideIdx);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextPayload = history[nextIdx];
      if (nextPayload) {
        isUndoRedoAction.current = true;
        setHistoryIndex(nextIdx);
        setSecoes(JSON.parse(JSON.stringify(nextPayload.secoes)));
        setActiveSlideIdx(nextPayload.activeSlideIdx);
      }
    }
  };

  // Global keyboard listener for Ctrl+Z / Ctrl+Y / Cmd+Z / Cmd+Y
  useEffect(() => {
    const handleUndoRedoKey = (e: KeyboardEvent) => {
      // Ignore if user is writing inside input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleUndoRedoKey);
    return () => {
      window.removeEventListener('keydown', handleUndoRedoKey);
    };
  }, [history, historyIndex]);

  // Tag helper to insert exactly at textarea cursor position
  const insertTagAtCursor = (textareaId: string, tag: string, onUpdate: (newText: string) => void, currentValue: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentValue.substring(0, start) + tag + currentValue.substring(end);
      onUpdate(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      onUpdate(currentValue ? `${currentValue} ${tag}` : tag);
    }
  };

  // Conversor de Lâmina Legada para Canva 100% Visual
  const convertLegacyToCanvas = (slideData: any) => {
    const layout = slideData.layout || 'texto';
    const titulo = slideData.tituloSlide || slideData.titulo || '';
    const subtitulo = slideData.subtitulo || '';
    const conteudo = slideData.conteudo || slideData.texto || '';
    
    const bgColor = slideData.bgColor || '#ffffff';
    const textColor = slideData.textColor || '#334155';
    const fontFamily = slideData.fontFamily || 'Outfit';
    
    const elements: any[] = [];
    
    if (layout === 'cobertura') {
      elements.push(
        { id: `bg_left_${Date.now()}`, type: "shape", name: "Fundo Esquerdo", x: 0, y: 0, w: 570, h: 563, color: "#1E3E62", radius: 0, zIndex: 10 },
        { id: `pill_orange_${Date.now()}`, type: "shape", name: "Pilar Laranja", x: 40, y: 130, w: 20, h: 360, color: "#F59E0B", radius: 10, zIndex: 20 },
        { id: `img_logo_${Date.now()}`, type: "image", name: "Logotipo", x: 90, y: 80, w: 140, h: 50, src: companyLogo, mask: "none", zIndex: 30 },
        { id: `txt_title_${Date.now()}`, type: "text", name: "Título", x: 90, y: 175, w: 440, h: 100, content: titulo || "Proposta de Terceirização", style: { fontSize: 32, fontWeight: "900", color: "#ffffff", textAlign: "left" }, zIndex: 30 },
        { id: `txt_sub_${Date.now()}`, type: "text", name: "Subtítulo", x: 90, y: 305, w: 440, h: 50, content: `${subtitulo || "[CLIENTE_NOME]"}\n27/05/2024`, style: { fontSize: 13, fontWeight: "bold", color: "#94a3b8", textAlign: "left" }, zIndex: 30 },
        { id: `img_cover_${Date.now()}`, type: "image", name: "Foto Principal", x: 570, y: 0, w: 430, h: 563, src: slideData.bgImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600", mask: "none", zIndex: 10 }
      );
    } else if (layout === 'agradecimento' || layout === 'texto' || layout === 'valores') {
      elements.push(
        { id: `accent_shape_${Date.now()}`, type: 'shape', name: 'Acento Superior', x: 100, y: 60, w: 100, h: 6, color: '#1B4D3E', radius: 3, opacity: 100, rotate: 0, zIndex: 10 },
        { id: `txt_title_${Date.now()}`, type: 'text', name: 'Título Principal', x: 100, y: 80, w: 800, h: 60, content: titulo || 'Olá Cliente', style: { fontSize: 28, fontWeight: '900', color: '#0f172a', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 },
        { id: `txt_sub_${Date.now()}`, type: 'text', name: 'Subtítulo', x: 100, y: 140, w: 800, h: 30, content: subtitulo || 'Agradecemos a Oportunidade', style: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 },
        { id: `txt_content_${Date.now()}`, type: 'text', name: 'Corpo do Texto', x: 100, y: 190, w: 800, h: 250, content: conteudo || 'Digite seu texto aqui...', style: { fontSize: 13, fontWeight: 'normal', color: '#334155', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 }
      );
    } else {
      elements.push(
        { id: `txt_title_${Date.now()}`, type: 'text', name: 'Título Principal', x: 80, y: 60, w: 840, h: 50, content: titulo || 'Título do Slide', style: { fontSize: 26, fontWeight: '900', color: '#0f172a', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 },
        { id: `txt_sub_${Date.now()}`, type: 'text', name: 'Subtítulo', x: 80, y: 110, w: 840, h: 30, content: subtitulo || 'Subtítulo do slide', style: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 },
        { id: `txt_content_${Date.now()}`, type: 'text', name: 'Corpo do Texto', x: 80, y: 160, w: 840, h: 320, content: conteudo || 'Conteúdo...', style: { fontSize: 12, fontWeight: 'normal', color: '#334155', textAlign: 'left' }, opacity: 100, rotate: 0, zIndex: 20 }
      );
    }

    return {
      layout: 'canvas_custom',
      fontFamily,
      bgColor,
      textColor,
      bgImage: slideData.bgImage || null,
      elements
    };
  };

  // Helper action to upload files locally
  const uploadSlideImageClient = async (e: any, elementId: string, slideData: any, setSecoes: any, activeSlideIdx: number, secoes: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const uploadBgImageClient = async (e: any, slideData: any, setSecoes: any, activeSlideIdx: number, secoes: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const base64Data = event.target.result;
      const res = await uploadSlideImageAction(base64Data, file.name);
      if (res.success && res.fileUrl) {
        const list = [...secoes];
        const updatedText = JSON.stringify({ ...slideData, bgImage: res.fileUrl });
        list[activeSlideIdx].texto = updatedText;
        setSecoes(list);
      } else {
        alert("Erro ao fazer upload da imagem de fundo: " + (res.error || "Tente novamente"));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageReplaceElementId) return;
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      const base64Data = event.target.result;
      const res = await uploadSlideImageAction(base64Data, file.name);
      if (res.success && res.fileUrl) {
        setSecoes(prev => {
          const list = [...prev];
          const currentSlide = list[activeSlideIdx];
          if (!currentSlide) return prev;
          let sd: any = {};
          try { sd = JSON.parse(currentSlide.texto); } catch { return prev; }
          const updatedElements = (sd.elements || []).map((el: any) =>
            el.id === imageReplaceElementId ? { ...el, src: res.fileUrl } : el
          );
          list[activeSlideIdx] = { ...currentSlide, texto: JSON.stringify({ ...sd, elements: updatedElements }) };
          return list;
        });
      } else {
        alert('Erro ao substituir imagem: ' + (res.error || 'Tente novamente'));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setImageReplaceElementId(null);
  };

  const applyGabarito = (layoutType: string, setSecoes: any, activeSlideIdx: number, secoes: any) => {
    const list = [...secoes];
    let elements: any[] = [];
    let titleColor = "#1B4D3E";
    let textColor = "#475569";
    let bgColor = "#ffffff";

    if (layoutType === 'provelo_split') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_logo", type: "image", x: 60, y: 40, w: 120, h: 40, src: companyLogo, mask: "none", zIndex: 20 },
        { id: "el_badge", type: "text", x: 60, y: 150, w: 300, h: 25, content: "PROPOSTA COMERCIAL", style: { fontSize: 10, fontWeight: "900", color: "#1B4D3E", textAlign: "left" }, zIndex: 20 },
        { id: "el_title", type: "text", x: 60, y: 185, w: 500, h: 90, content: "[CLIENTE_NOME]", style: { fontSize: 38, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_subtitle", type: "text", x: 60, y: 285, w: 500, h: 50, content: "Serviço Proposto: [OBJETO_PROPOSTA]", style: { fontSize: 13, fontWeight: "bold", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_info", type: "text", x: 60, y: 350, w: 500, h: 60, content: "Código: [NUMERO_PROPOSTA] | Revisão: [REVISAO]\nData de Emissão: [DATA_PROPOSTA] | Validade: [VALIDADE_PROPOSTA]", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'valores') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 500, h: 50, content: "NOSSOS VALORES INSTITUCIONAIS", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_title", type: "text", x: 60, y: 110, w: 480, h: 22, content: "01. Compromisso com a Qualidade", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_text", type: "text", x: 60, y: 135, w: 480, h: 60, content: "Priorizamos a segurança, a padronização e a eficiência em cada serviço entregue, superando as expectativas em cada contrato.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_title", type: "text", x: 60, y: 205, w: 480, h: 22, content: "02. Relações de Parceria e Confiança", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_text", type: "text", x: 60, y: 230, w: 480, h: 60, content: "Buscamos construir relacionamentos duradouros pautados no respeito mútuo, transparência total e diálogo constante com o cliente.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_title", type: "text", x: 60, y: 300, w: 480, h: 22, content: "03. Inovação & Tecnologia", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_text", type: "text", x: 60, y: 325, w: 480, h: 60, content: "Utilizamos as melhores ferramentas de gestão e metodologias modernas para garantir processos ágeis, controlados e otimizados.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'capa_navy') {
      titleColor = "#ffffff";
      textColor = "#e2e8f0";
      bgColor = "#0f172a";
      elements = [
        { id: "el_bg_glow", type: "shape", x: 500, y: -200, w: 600, h: 600, color: "#1e3a8a", radius: 300, opacity: 30, zIndex: 5 },
        { id: "el_accent_bar", type: "shape", x: 60, y: 460, w: 200, h: 8, color: "#10b981", radius: 4, zIndex: 10 },
        { id: "el_logo", type: "image", x: 60, y: 60, w: 140, h: 45, src: companyLogo, mask: "none", zIndex: 20 },
        { id: "el_badge", type: "text", x: 60, y: 170, w: 400, h: 25, content: "PROPOSTA COMERCIAL PREMIUM", style: { fontSize: 11, fontWeight: "900", color: "#10b981", textAlign: "left" }, zIndex: 20 },
        { id: "el_title", type: "text", x: 60, y: 205, w: 800, h: 100, content: "[CLIENTE_NOME]", style: { fontSize: 44, fontWeight: "900", color: "#ffffff", textAlign: "left" }, zIndex: 20 },
        { id: "el_subtitle", type: "text", x: 60, y: 315, w: 800, h: 45, content: "Prestação de Serviços Especializados: [OBJETO_PROPOSTA]", style: { fontSize: 15, fontWeight: "bold", color: "#cbd5e1", textAlign: "left" }, zIndex: 20 },
        { id: "el_meta", type: "text", x: 60, y: 380, w: 500, h: 60, content: "Código: [NUMERO_PROPOSTA] | Revisão: [REVISAO]\nData de Emissão: [DATA_PROPOSTA] | Validade: [VALIDADE_PROPOSTA]", style: { fontSize: 11, fontWeight: "normal", color: "#94a3b8", textAlign: "left" }, zIndex: 20 },
        { id: "el_consultant", type: "text", x: 600, y: 380, w: 300, h: 60, content: "Responsável Comercial:\n[VENDEDOR_NOME] | [VENDEDOR_EMAIL]", style: { fontSize: 11, fontWeight: "bold", color: "#cbd5e1", textAlign: "right" }, zIndex: 20 }
      ];
    } else if (layoutType === 'resumo_financeiro') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_top_bar", type: "shape", x: 0, y: 0, w: 960, h: 10, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 600, h: 45, content: "PROPOSTA FINANCEIRA", style: { fontSize: 26, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 600, h: 25, content: "Valores consolidados para prestação de serviços referente a [OBJETO_PROPOSTA]", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_mensal", type: "shape", x: 60, y: 130, w: 260, h: 90, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_box_mensal_lbl", type: "text", x: 80, y: 145, w: 220, h: 20, content: "VALOR MENSAL ESTIMADO", style: { fontSize: 9, fontWeight: "900", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_mensal_val", type: "text", x: 80, y: 165, w: 220, h: 40, content: "[VALOR_MENSAL]", style: { fontSize: 22, fontWeight: "900", color: "#1B4D3E", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_total", type: "shape", x: 350, y: 130, w: 260, h: 90, color: "#1B4D3E", radius: 16, zIndex: 10 },
        { id: "el_box_total_lbl", type: "text", x: 370, y: 145, w: 220, h: 20, content: "VALOR TOTAL GLOBAL", style: { fontSize: 9, fontWeight: "900", color: "#a7f3d0", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_total_val", type: "text", x: 370, y: 165, w: 220, h: 40, content: "[VALOR_TOTAL]", style: { fontSize: 22, fontWeight: "900", color: "#ffffff", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_prazo", type: "shape", x: 640, y: 130, w: 260, h: 90, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_box_prazo_lbl", type: "text", x: 660, y: 145, w: 220, h: 20, content: "PRAZO DE VIGÊNCIA", style: { fontSize: 9, fontWeight: "900", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_box_prazo_val", type: "text", x: 660, y: 165, w: 220, h: 40, content: "[PRAZO_CONTRATO]", style: { fontSize: 20, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_tabela_tag", type: "text", x: 60, y: 245, w: 840, h: 200, content: "[TABELA]", style: { fontSize: 13, fontWeight: "bold", color: "#475569", textAlign: "center" }, zIndex: 20 },
        { id: "el_obs", type: "text", x: 60, y: 460, w: 840, h: 40, content: "* Condições de Pagamento: [CONDICOES_COMERCIAIS]\n* Tabela inclui todos os encargos sociais, trabalhistas e insumos necessários para execução dos serviços.", style: { fontSize: 9, fontWeight: "bold", color: "#94a3b8", textAlign: "left" }, zIndex: 20 }
      ];
    } else if (layoutType === 'equipe_servicos') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_top_bar", type: "shape", x: 0, y: 0, w: 960, h: 10, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 840, h: 40, content: "NOSSOS SERVIÇOS & EQUIPE", style: { fontSize: 26, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 840, h: 25, content: "Alocação planejada e infraestrutura técnica dedicada ao projeto [OBJETO_PROPOSTA]", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "center" }, zIndex: 20 },
        { id: "el_c1_bg", type: "shape", x: 60, y: 130, w: 260, h: 320, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_c1_img", type: "image", x: 80, y: 150, w: 220, h: 140, src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300", mask: "none", zIndex: 20 },
        { id: "el_c1_title", type: "text", x: 80, y: 305, w: 220, h: 25, content: "Gestão Operacional", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "center" }, zIndex: 20 },
        { id: "el_c1_text", type: "text", x: 80, y: 335, w: 220, h: 100, content: "Supervisão e gerenciamento diário conduzido por nossa equipe técnica para manter o padrão de excelência acordado em [LOCAL_PRESTACAO].", style: { fontSize: 9.5, fontWeight: "normal", color: "#475569", textAlign: "center" }, zIndex: 20 },
        { id: "el_c2_bg", type: "shape", x: 350, y: 130, w: 260, h: 320, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_c2_img", type: "image", x: 370, y: 150, w: 220, h: 140, src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=300", mask: "none", zIndex: 20 },
        { id: "el_c2_title", type: "text", x: 370, y: 305, w: 220, h: 25, content: "Equipe Alocada", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "center" }, zIndex: 20 },
        { id: "el_c2_text", type: "text", x: 370, y: 335, w: 220, h: 100, content: "Profissionais qualificados, devidamente treinados e uniformizados, prontos para atuar conforme as especificidades da sua operação.", style: { fontSize: 9.5, fontWeight: "normal", color: "#475569", textAlign: "center" }, zIndex: 20 },
        { id: "el_c3_bg", type: "shape", x: 640, y: 130, w: 260, h: 320, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_c3_img", type: "image", x: 660, y: 150, w: 220, h: 140, src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=300", mask: "none", zIndex: 20 },
        { id: "el_c3_title", type: "text", x: 660, y: 305, w: 220, h: 25, content: "Atendimento & Suporte", style: { fontSize: 13, fontWeight: "900", color: "#1B4D3E", textAlign: "center" }, zIndex: 20 },
        { id: "el_c3_text", type: "text", x: 660, y: 335, w: 220, h: 100, content: "Contato direto com [VENDEDOR_NOME] ([VENDEDOR_TELEFONE]) para plantão de dúvidas, solicitações extras ou melhorias.", style: { fontSize: 9.5, fontWeight: "normal", color: "#475569", textAlign: "center" }, zIndex: 20 }
      ];
    } else if (layoutType === 'sobre_nos') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_top_bar", type: "shape", x: 0, y: 0, w: 960, h: 10, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 500, h: 45, content: "SOBRE NOSSA EMPRESA", style: { fontSize: 26, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 500, h: 25, content: "Sua parceira estratégica em soluções de facilities e infraestrutura", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_desc", type: "text", x: 60, y: 130, w: 460, h: 180, content: "Somos especialistas em desenvolver soluções sob medida para cada cliente, garantindo qualidade superior, redução de custos e processos otimizados.\n\nCom ampla presença em [LOCAL_PRESTACAO], integramos tecnologia e pessoas capacitadas para manter a sua infraestrutura funcionando com a máxima eficiência operacional.", style: { fontSize: 11, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_logo_card", type: "shape", x: 60, y: 330, w: 460, h: 120, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_logo_company", type: "image", x: 220, y: 360, w: 140, h: 45, src: companyLogo, mask: "none", zIndex: 20 },
        { id: "el_img_decor", type: "image", x: 560, y: 130, w: 340, h: 320, src: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'termos_aceite') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_top_bar", type: "shape", x: 0, y: 0, w: 960, h: 10, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 840, h: 40, content: "CONCORDÂNCIA E ACEITE", style: { fontSize: 26, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 840, h: 25, content: "Declaração de concordância com os termos comerciais descritos na proposta [NUMERO_PROPOSTA]", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "center" }, zIndex: 20 },
        { id: "el_term_box", type: "shape", x: 60, y: 130, w: 840, h: 180, color: "#f8fafc", radius: 16, zIndex: 10 },
        { id: "el_term_text", type: "text", x: 80, y: 150, w: 800, h: 140, content: "Ao assinar digitalmente este documento, as partes concordam plenamente com as cláusulas, escopos técnicos, condições financeiras e prazos descritos nesta proposta comercial.\n\nOs serviços serão prestados em [LOCAL_PRESTACAO] com vigência contratual prevista em [PRAZO_CONTRATO]. O faturamento e cobrança seguirão a modalidade de [CONDICOES_COMERCIAIS].", style: { fontSize: 11, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_sig_tag", type: "text", x: 60, y: 330, w: 840, h: 120, content: "[TERMO_ACEITE]", style: { fontSize: 12, fontWeight: "bold", color: "#475569", textAlign: "center" }, zIndex: 20 }
      ];
    } else if (layoutType === 'performance') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_red_bar", type: "shape", x: 0, y: 0, w: 20, h: 563, color: "#1B4D3E", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", x: 60, y: 40, w: 500, h: 50, content: "NOSSA CAPACIDADE E EFICIÊNCIA", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 95, w: 460, h: 60, content: "Oferecemos soluções integradas com forte controle gerencial, monitoramento ativo e dedicação em tempo integral ao escopo contratado em [LOCAL_PRESTACAO].", style: { fontSize: 10, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_img_building", type: "image", x: 60, y: 170, w: 460, h: 320, src: "https://images.unsplash.com/photo-1542362567-b07eac79094d?q=80&w=600", mask: "none", zIndex: 20 },
        { id: "el_p1_box", type: "shape", x: 560, y: 90, w: 160, h: 100, color: "#1B4D3E", radius: 24, zIndex: 20 },
        { id: "el_p1_title", type: "text", x: 570, y: 110, w: 140, h: 40, content: "[PRAZO_CONTRATO]", style: { fontSize: 15, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_sub", type: "text", x: 570, y: 150, w: 140, h: 30, content: "PRAZO DE VIGÊNCIA", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_text", type: "text", x: 740, y: 90, w: 220, h: 100, content: "Contrato planejado para vigorar em toda a sua extensão operacional, promovendo estabilidade, treinamento contínuo de pessoal e foco em produtividade de longo prazo.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 },
        { id: "el_p2_box", type: "shape", x: 560, y: 220, w: 160, h: 100, color: "#1B4D3E", radius: 24, zIndex: 20 },
        { id: "el_p2_title", type: "text", x: 570, y: 240, w: 140, h: 40, content: "SUPORTE", style: { fontSize: 15, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_sub", type: "text", x: 570, y: 280, w: 140, h: 30, content: "CONTATO COMERCIAL", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_text", type: "text", x: 740, y: 220, w: 220, h: 100, content: "Canal aberto de atendimento direto com o consultor [VENDEDOR_NOME] ([VENDEDOR_TELEFONE] | [VENDEDOR_EMAIL]) para suporte imediato e resolução ágil.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 }
      ];
    } else if (layoutType === 'fundadores') {
      titleColor = "#0f172a";
      textColor = "#475569";
      bgColor = "#ffffff";
      elements = [
        { id: "el_title", type: "text", x: 60, y: 40, w: 880, h: 40, content: "RESPONSÁVEIS PELA PROPOSTA", style: { fontSize: 28, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_sub", type: "text", x: 60, y: 85, w: 880, h: 30, content: "Sua equipe de atendimento exclusivo Silva Consultoria", style: { fontSize: 12, fontWeight: "bold", color: "#475569", textAlign: "center" }, zIndex: 20 },
        { id: "el_f1_photo", type: "image", x: 260, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f1_name", type: "text", x: 260, y: 345, w: 180, h: 25, content: "[VENDEDOR_NOME]", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f1_role", type: "text", x: 260, y: 370, w: 180, h: 20, content: "Gestor Comercial de Contas", style: { fontSize: 9, fontWeight: "bold", color: "#1B4D3E", textAlign: "center" }, zIndex: 20 },
        { id: "el_f2_photo", type: "image", x: 520, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f2_name", type: "text", x: 520, y: 345, w: 180, h: 25, content: "Contato Silva Consultoria", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f2_role", type: "text", x: 520, y: 370, w: 180, h: 20, content: "[VENDEDOR_EMAIL]", style: { fontSize: 9, fontWeight: "bold", color: "#1B4D3E", textAlign: "center" }, zIndex: 20 }
      ];
    }

    const updatedText = JSON.stringify({
      layout: "canvas_custom",
      fontFamily: "Outfit",
      bgColor,
      textColor,
      titleColor,
      bgPattern: layoutType === 'capa_navy' ? 'diagonal_lines' : 'none',
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
    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
    isUndoRedoAction.current = false;

    const initialSecoes = tmpl 
      ? (tmpl.secoes || []).map((s: any) => ({ titulo: s.titulo, texto: s.texto }))
      : [
          { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
          { titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
          { titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]' },
          { titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
          { titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' },
        ];
        
    setEditingTemplate(tmpl || 'new');
    setNome(tmpl ? tmpl.nome : '');
    setTipo(tmpl ? (tmpl.tipo || 'A4') : 'A4');
    setActiveSlideIdx(0);
    setSecoes(initialSecoes);
    
    // Explicitly initialize history
    setHistory([{ secoes: JSON.parse(JSON.stringify(initialSecoes)), activeSlideIdx: 0 }]);
    setHistoryIndex(0);
    isUndoRedoAction.current = true; // prevent automatic record on initial state mount
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

      <main className={`flex-1 ${editingTemplate && tipo === 'SLIDE_DECK' ? 'p-3' : 'p-8'} overflow-y-auto`}>
        <div className={`${editingTemplate && tipo === 'SLIDE_DECK' ? 'max-w-full' : editingTemplate ? 'max-w-[1700px]' : 'max-w-5xl'} mx-auto ${editingTemplate && tipo === 'SLIDE_DECK' ? 'space-y-3' : 'space-y-6'}`}>

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
              <div className="flex items-center gap-2 flex-wrap">
                {/* Nome inline */}
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome do template..."
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 w-44 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] bg-white shadow-sm"
                />

                {/* Tipo compacto */}
                <div className="flex gap-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('A4');
                      if (secoes.some(s => s.texto.trim().startsWith('{'))) {
                        setSecoes([
                          { titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
                          { titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
                          { titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados:\n\n[TABELA]' },
                          { titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
                          { titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' }
                        ]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all cursor-pointer ${tipo === 'A4' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    A4
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipo('SLIDE_DECK');
                      if (!secoes.some(s => s.texto.trim().startsWith('{'))) {
                        setSecoes([
                          { titulo: 'Capa da Apresentação', texto: '{"layout":"cobertura","tituloSlide":"Proposta Comercial","subtitulo":"Silva Facilities","bgImage":"https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200"}' },
                          { titulo: 'Olá Cliente', texto: '{"layout":"agradecimento","tituloSlide":"Agradecimento","subtitulo":"Obrigado pela oportunidade!","conteudo":"Apresentamos nossa proposta para prestação de serviços terceirizados."}' },
                          { titulo: 'Quem Somos', texto: '{"layout":"valores","tituloSlide":"Quem Somos","subtitulo":"Mais de 30 anos no mercado","conteudo":"Nosso compromisso é guiado por princípios sólidos."}' },
                          { titulo: 'Quadro Financeiro', texto: '{"layout":"tabela","tituloSlide":"Resumo Financeiro","subtitulo":"Investimento Proposto","conteudo":"[TABELA]"}' },
                          { titulo: 'Termo de Aceite', texto: '{"layout":"aceite","tituloSlide":"Assinatura e Aceite","subtitulo":"Prontos para iniciar","conteudo":"[TERMO_ACEITE]"}' }
                        ]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all cursor-pointer ${tipo === 'SLIDE_DECK' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Slides
                  </button>
                </div>

                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-sm">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 text-slate-500 hover:text-[#1B4D3E] disabled:text-slate-300 hover:bg-white disabled:bg-transparent rounded-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="Desfazer (Ctrl+Z)"
                  >
                    <Undo size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 text-slate-500 hover:text-[#1B4D3E] disabled:text-slate-300 hover:bg-white disabled:bg-transparent rounded-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    title="Refazer (Ctrl+Y)"
                  >
                    <Redo size={14} />
                  </button>
                </div>

                <button
                  onClick={closeEditor}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 px-3 rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-5 rounded-lg text-sm flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
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
            <div className={tipo === 'A4' ? 'bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6' : 'bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden'}>

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
                      {FVP_INTEGRATION_TAGS.map(({ tag, desc }) => (
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
                            id={`textarea-a4-${idx}`}
                            className="w-full bg-white border border-slate-200 rounded-lg text-sm px-4 py-3 min-h-[120px] resize-y focus:outline-none focus:border-[#1B4D3E] transition-colors font-mono"
                            value={s.texto}
                            placeholder="Digite o texto ou insira uma tag como [OBJETO_PROPOSTA]..."
                            onChange={e => {
                              const list = [...secoes];
                              list[idx].texto = e.target.value;
                              setSecoes(list);
                            }}
                          />

                          {/* Clique para inserir tags dinâmicas */}
                          <div className="mt-2.5 bg-emerald-50/40 border border-emerald-100/60 p-2.5 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Tag size={11} className="text-emerald-700" />
                              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider font-sans">Tags de Integração FPV (Clique para Inserir no Cursor):</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {FVP_INTEGRATION_TAGS.map(({ tag, label }) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    insertTagAtCursor(`textarea-a4-${idx}`, tag, (newText) => {
                                      const list = [...secoes];
                                      list[idx].texto = newText;
                                      setSecoes(list);
                                    }, s.texto);
                                  }}
                                  title={tag}
                                  className="bg-white hover:bg-emerald-100 active:scale-95 border border-emerald-250/70 px-2 py-0.5 rounded-lg text-[8.5px] font-black text-emerald-700 shadow-2xs transition-all cursor-pointer font-sans"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONSTRUTOR DE SLIDES MODULAR (TIPO === 'SLIDE_DECK') */}
              {tipo === 'SLIDE_DECK' && (() => {
                const currentSlide = secoes[activeSlideIdx];
                if (!currentSlide) return <p className="text-slate-400 text-center py-10 font-bold uppercase tracking-wide">Crie ou selecione uma lâmina para iniciar.</p>;

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
                  if (!el || el.locked) return;

                  setSelectedElementId(elementId);
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  const scale = rect ? rect.width / 1000 : 1;

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

                const addCustomElement = (type: 'text' | 'image' | 'shape' | 'icon', iconName?: string, textPreset?: 'title' | 'subtitle' | 'body', imageSrc?: string, iconColor?: string) => {
                  const list = [...secoes];
                  let newEl: any = {};

                  if (type === 'text') {
                    const fontSize = textPreset === 'title' ? 32 : textPreset === 'subtitle' ? 20 : 12;
                    const fontWeight = textPreset === 'title' ? '900' : textPreset === 'subtitle' ? 'bold' : 'normal';
                    const content = textPreset === 'title' ? 'Inserir um título' : textPreset === 'subtitle' ? 'Inserir um subtítulo' : 'Inserir corpo de texto';
                    newEl = {
                      id: `el_text_${Date.now()}`,
                      type: 'text',
                      name: `Caixa Texto ${elements.length + 1}`,
                      x: 150, y: 150, w: 350, h: textPreset === 'title' ? 80 : 60,
                      content,
                      style: { fontSize, fontWeight, color: '#334155', textAlign: 'left' },
                      opacity: 100, rotate: 0, shadow: 'none', zIndex: elements.length + 10
                    };
                  } else if (type === 'image') {
                    newEl = {
                      id: `el_img_${Date.now()}`,
                      type: 'image',
                      name: `Imagem ${elements.length + 1}`,
                      x: 200, y: 100, w: 250, h: 250,
                      src: imageSrc || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200',
                      mask: 'none', opacity: 100, rotate: 0, shadow: 'suave', zIndex: elements.length + 10
                    };
                  } else if (type === 'shape') {
                    newEl = {
                      id: `el_shape_${Date.now()}`,
                      type: 'shape',
                      name: `Forma ${elements.length + 1}`,
                      x: 200, y: 150, w: 180, h: 180,
                      color: '#ef4444', radius: 16, opacity: 100, rotate: 0, shadow: 'suave', zIndex: elements.length + 10
                    };
                  } else if (type === 'icon') {
                    newEl = {
                      id: `el_icon_${Date.now()}`,
                      type: 'icon',
                      name: `Ícone: ${iconName || 'ShieldCheck'}`,
                      nameIcon: iconName || 'ShieldCheck',
                      x: 250, y: 200, w: 75, h: 75,
                      color: iconColor || '#ef4444', opacity: 100, rotate: 0, zIndex: elements.length + 10
                    };
                  }

                  const updatedElements = [...elements, newEl];
                  const updatedText = JSON.stringify({ ...slideData, layout: 'canvas_custom', elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                  setSelectedElementId(newEl.id);
                };

                const addCustomChartElement = (chartType: 'donut' | 'pie' | 'bar' | 'column') => {
                  const list = [...secoes];
                  const newEl = {
                    id: `el_chart_${Date.now()}`,
                    type: 'chart',
                    chartType,
                    name: `Gráfico ${chartType === 'donut' ? 'Rosca' : chartType === 'pie' ? 'Pizza' : chartType === 'bar' ? 'Barra' : 'Colunas'}`,
                    x: 200, y: 150, w: 320, h: 220,
                    chartData: [
                      { label: 'Limpeza', value: 45, color: '#ef4444' },
                      { label: 'Portaria', value: 30, color: '#1B4D3E' },
                      { label: 'Recepção', value: 25, color: '#3b82f6' }
                    ],
                    opacity: 100, rotate: 0, shadow: 'suave', zIndex: elements.length + 10
                  };

                  const updatedElements = [...elements, newEl];
                  const updatedText = JSON.stringify({ ...slideData, layout: 'canvas_custom', elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                  setSelectedElementId(newEl.id);
                };

                const addCustomMapElement = () => {
                  const list = [...secoes];
                  const newEl = {
                    id: `el_map_${Date.now()}`,
                    type: 'map',
                    name: 'Mapa do Brasil',
                    x: 250, y: 100, w: 260, h: 260,
                    highlightedStates: ['PR', 'SC', 'RS'],
                    opacity: 100, rotate: 0, zIndex: elements.length + 10
                  };

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

                const duplicateElement = (elementId: string) => {
                  const list = [...secoes];
                  const el = elements.find((item: any) => item.id === elementId);
                  if (!el) return;

                  const newId = `el_${el.type}_${Date.now()}`;
                  const duplicated = {
                    ...el,
                    id: newId,
                    name: `${el.name} (Cópia)`,
                    x: Math.min(950, el.x + 30),
                    y: Math.min(520, el.y + 30),
                    zIndex: elements.reduce((max: number, item: any) => Math.max(max, item.zIndex || 10), 10) + 1
                  };

                  const updatedElements = [...elements, duplicated];
                  const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                  setSelectedElementId(newId);
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

                const toggleLockElement = (elementId: string) => {
                  const list = [...secoes];
                  const updatedElements = elements.map((item: any) => {
                    if (item.id === elementId) {
                      return { ...item, locked: !item.locked };
                    }
                    return item;
                  });
                  const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                };

                const toggleVisibilityElement = (elementId: string) => {
                  const list = [...secoes];
                  const updatedElements = elements.map((item: any) => {
                    if (item.id === elementId) {
                      return { ...item, hidden: !item.hidden };
                    }
                    return item;
                  });
                  const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                };

                const renameLayerElement = (elementId: string, newName: string) => {
                  const list = [...secoes];
                  const updatedElements = elements.map((item: any) => {
                    if (item.id === elementId) {
                      return { ...item, name: newName };
                    }
                    return item;
                  });
                  const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                  list[activeSlideIdx].texto = updatedText;
                  setSecoes(list);
                  setEditingLayerId(null);
                };

                const selectedElement = elements.find((item: any) => item.id === selectedElementId);

                return (
                  <div className="grid grid-cols-12 gap-0 items-start">
                    
                    {/* ESQUERDA: O PAINEL DUPLO ESTILO CANVA (COL-3) */}
                    <div className="col-span-12 lg:col-span-3 border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xs flex max-h-[660px] min-h-[580px]">
                      
                      {/* FAR-LEFT TOOLBAR (BARRA ESCURA ESTREITA) */}
                      <div className="w-16 bg-slate-900 flex flex-col items-center py-4 space-y-5 text-white shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('laminas')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'laminas' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Lâminas do Slide"
                        >
                          <FileText size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Lâminas</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('elementos')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'elementos' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Biblioteca de Elementos"
                        >
                          <Sparkles size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Elementos</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('layouts')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'layouts' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Layouts da Proposta"
                        >
                          <Layout size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Layouts</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('estilos')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'estilos' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Estilos Globais"
                        >
                          <Paintbrush size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Estilos</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('tags')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'tags' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Tags de Integração FPV"
                        >
                          <Tag size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Tags</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCanvaTab('camadas')}
                          className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'camadas' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                          title="Gerenciador de Camadas"
                        >
                          <Icons.Layers size={18} />
                          <span className="text-[7.5px] font-black uppercase tracking-wider font-sans">Camadas</span>
                        </button>
                      </div>

                      {/* DYNAMIC SIDE PANEL CONTENT */}
                      <div className="flex-1 p-4 overflow-y-auto max-h-[660px] flex flex-col bg-white">
                        
                        {/* TAB 1: LÂMINAS */}
                        {activeCanvaTab === 'laminas' && (
                          <div className="space-y-4 flex flex-col h-full">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <FileText size={14} /> Lâminas do Deck
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const newSlide = {
                                    titulo: 'Novo Slide',
                                    texto: '{"layout":"canvas_custom","fontFamily":"Outfit","bgColor":"#ffffff","textColor":"#334155","elements":[]}'
                                  };
                                  const list = [...secoes, newSlide];
                                  setSecoes(list);
                                  setActiveSlideIdx(list.length - 1);
                                }}
                                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all shadow-xs flex items-center gap-0.5 active:scale-95 cursor-pointer font-sans"
                              >
                                <Plus size={10} /> Novo
                              </button>
                            </div>

                            {secoes.length === 0 && (
                              <p className="text-slate-400 text-xs text-center py-10 font-bold uppercase tracking-wider font-sans">Nenhum slide.</p>
                            )}

                            <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
                              {secoes.map((s, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setActiveSlideIdx(idx);
                                    setSelectedElementId(null);
                                  }}
                                  className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-black cursor-pointer transition-all ${activeSlideIdx === idx ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                >
                                  <span className="truncate flex-1 pr-1 font-sans">{String(idx + 1).padStart(2, '0')}. {s.titulo}</span>
                                  
                                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (idx === 0) return;
                                        const list = [...secoes];
                                        const tmp = list[idx - 1];
                                        list[idx - 1] = list[idx];
                                        list[idx] = tmp;
                                        setSecoes(list);
                                        setActiveSlideIdx(idx - 1);
                                      }}
                                      disabled={idx === 0}
                                      className={`p-0.5 rounded transition-colors ${activeSlideIdx === idx ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-700'} disabled:opacity-20`}
                                      title="Mover para cima"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (idx === secoes.length - 1) return;
                                        const list = [...secoes];
                                        const tmp = list[idx + 1];
                                        list[idx + 1] = list[idx];
                                        list[idx] = tmp;
                                        setSecoes(list);
                                        setActiveSlideIdx(idx + 1);
                                      }}
                                      disabled={idx === secoes.length - 1}
                                      className={`p-0.5 rounded transition-colors ${activeSlideIdx === idx ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-700'} disabled:opacity-20`}
                                      title="Mover para baixo"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Deseja excluir este slide definitivamente?')) {
                                          const list = [...secoes];
                                          list.splice(idx, 1);
                                          setSecoes(list);
                                          setActiveSlideIdx(Math.max(0, idx - 1));
                                          setSelectedElementId(null);
                                        }
                                      }}
                                      className={`p-0.5 rounded transition-colors ${activeSlideIdx === idx ? 'text-white/60 hover:text-red-350' : 'text-slate-400 hover:text-red-500'}`}
                                      title="Excluir"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 2: ELEMENTOS */}
                        {activeCanvaTab === 'elementos' && (() => {
                          const filteredPhotos = curatedPhotos.filter(photo => {
                            if (!searchElement) return true;
                            const query = searchElement.toLowerCase();
                            return (
                              photo.title.toLowerCase().includes(query) ||
                              photo.tags.some(tag => tag.toLowerCase().includes(query))
                            );
                          });

                          const filteredIcons = curatedIcons.filter(ic => {
                            if (!searchElement) return true;
                            const query = searchElement.toLowerCase();
                            return (
                              ic.title.toLowerCase().includes(query) ||
                              ic.name.toLowerCase().includes(query) ||
                              ic.tags.some(tag => tag.toLowerCase().includes(query))
                            );
                          });

                          const queryLower = searchElement.toLowerCase();
                          const showShapes = selectedElementCat === 'graficos' || (selectedElementCat === 'tudo' && (!searchElement || 'forma quadrado círculo card container'.includes(queryLower)));
                          const showCharts = selectedElementCat === 'graficos' || (selectedElementCat === 'tudo' && (!searchElement || 'gráfico rosca pizza barra coluna vetorial'.includes(queryLower)));
                          const showMap = selectedElementCat === 'graficos' || (selectedElementCat === 'tudo' && (!searchElement || 'mapa brasil estado cobertura'.includes(queryLower)));

                          return (
                            <div className="space-y-4 flex flex-col h-full">
                              <div className="border-b border-slate-100 pb-2">
                                <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                  <Sparkles size={14} /> Biblioteca de Elementos
                                </h4>
                              </div>

                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Buscar (ex: dinheiro, limpeza, equipe)..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10.5px] pl-8 pr-8 py-2 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] text-slate-700 placeholder:text-slate-400"
                                  value={searchElement}
                                  onChange={(e) => setSearchElement(e.target.value)}
                                />
                                <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                                {searchElement && (
                                  <button
                                    type="button"
                                    onClick={() => setSearchElement('')}
                                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-1 border-b border-slate-100 pb-2">
                                {[
                                  { id: 'tudo', label: 'Tudo' },
                                  { id: 'graficos', label: 'Gráficos' },
                                  { id: 'fotos', label: 'Fotos' }
                                ].map(tab => (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedElementCat(tab.id as any)}
                                    className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${selectedElementCat === tab.id ? 'bg-[#1B4D3E] text-white shadow-xs font-sans' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 font-sans'}`}
                                  >
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
                                
                                {/* 1. TEXT PRESETS */}
                                {selectedElementCat === 'tudo' && !searchElement && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Caixas de Texto</span>
                                    <div className="space-y-1.5 mb-3">
                                      <button
                                        type="button"
                                        onClick={() => addCustomElement('text', undefined, 'title')}
                                        className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                      >
                                        <span className="text-sm font-black block leading-none font-sans">Inserir um título</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addCustomElement('text', undefined, 'subtitle')}
                                        className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                      >
                                        <span className="text-[11px] font-bold block leading-none font-sans">Inserir um subtítulo</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => addCustomElement('text', undefined, 'body')}
                                        className="w-full text-left px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                      >
                                        <span className="text-[9px] font-normal block text-slate-500 leading-none font-sans">Inserir corpo de texto</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* 2. SHAPES */}
                                {showShapes && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Formas & Containers</span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...secoes];
                                          const currentSlide = list[activeSlideIdx];
                                          if (!currentSlide) return;
                                          let slideData = JSON.parse(currentSlide.texto);
                                          const newEl = {
                                            id: `el_shape_${Date.now()}`,
                                            type: 'shape',
                                            name: `Quadrado`,
                                            x: 200, y: 150, w: 180, h: 180,
                                            color: '#3b82f6', radius: 0, opacity: 100, rotate: 0, shadow: 'none', zIndex: (slideData.elements || []).length + 10
                                          };
                                          slideData.elements = [...(slideData.elements || []), newEl];
                                          list[activeSlideIdx].texto = JSON.stringify(slideData);
                                          setSecoes(list);
                                          setSelectedElementId(newEl.id);
                                        }}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                      >
                                        <div className="w-4 h-4 bg-slate-400 rounded-none shrink-0" />
                                        <span className="text-[7.5px] font-bold uppercase leading-none font-sans">Quadrado</span>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...secoes];
                                          const currentSlide = list[activeSlideIdx];
                                          if (!currentSlide) return;
                                          let slideData = JSON.parse(currentSlide.texto);
                                          const newEl = {
                                            id: `el_shape_${Date.now()}`,
                                            type: 'shape',
                                            name: `Círculo`,
                                            x: 200, y: 150, w: 180, h: 180,
                                            color: '#ef4444', radius: 99, opacity: 100, rotate: 0, shadow: 'none', zIndex: (slideData.elements || []).length + 10
                                          };
                                          slideData.elements = [...(slideData.elements || []), newEl];
                                          list[activeSlideIdx].texto = JSON.stringify(slideData);
                                          setSecoes(list);
                                          setSelectedElementId(newEl.id);
                                        }}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                      >
                                        <div className="w-4 h-4 bg-slate-400 rounded-full shrink-0" />
                                        <span className="text-[7.5px] font-bold uppercase leading-none font-sans">Círculo</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...secoes];
                                          const currentSlide = list[activeSlideIdx];
                                          if (!currentSlide) return;
                                          let slideData = JSON.parse(currentSlide.texto);
                                          const newEl = {
                                            id: `el_shape_${Date.now()}`,
                                            type: 'shape',
                                            name: `Card Arredondado`,
                                            x: 200, y: 150, w: 220, h: 120,
                                            color: '#10b981', radius: 16, opacity: 100, rotate: 0, shadow: 'suave', zIndex: (slideData.elements || []).length + 10
                                          };
                                          slideData.elements = [...(slideData.elements || []), newEl];
                                          list[activeSlideIdx].texto = JSON.stringify(slideData);
                                          setSecoes(list);
                                          setSelectedElementId(newEl.id);
                                        }}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                      >
                                        <div className="w-6 h-3 bg-slate-400 rounded shrink-0" />
                                        <span className="text-[7.5px] font-bold uppercase leading-none font-sans">Container</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* 3. CHARTS */}
                                {showCharts && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Gráficos SVG Corporativos</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {[
                                        { id: 'donut', label: 'Rosca', icon: <Icons.CircleDot size={14} /> },
                                        { id: 'pie', label: 'Pizza', icon: <Icons.PieChart size={14} /> },
                                        { id: 'bar', label: 'Barras', icon: <Icons.BarChart3 size={14} /> },
                                        { id: 'column', label: 'Colunas', icon: <Icons.BarChart size={14} /> }
                                      ].map(chart => (
                                        <button
                                          key={chart.id}
                                          type="button"
                                          onClick={() => addCustomChartElement(chart.id as any)}
                                          className="flex items-center gap-1.5 justify-start px-2.5 py-2 rounded-xl border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[8.5px] font-bold uppercase cursor-pointer transition-all active:scale-95"
                                        >
                                          <span className="text-emerald-700">{chart.icon}</span>
                                          <span className="font-sans">{chart.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 4. MAP */}
                                {showMap && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Mapa Geográfico Interativo</span>
                                    <button
                                      type="button"
                                      onClick={() => addCustomMapElement()}
                                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-[9px] font-bold uppercase cursor-pointer transition-all active:scale-[0.97]"
                                    >
                                      <Icons.Map size={14} className="text-emerald-800" />
                                      <span className="font-sans">Mapa de Cobertura Brasil</span>
                                    </button>
                                  </div>
                                )}

                                {/* 5. FOTOS */}
                                {selectedElementCat === 'fotos' && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Fotos de Facilities Curadas ({filteredPhotos.length})</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {filteredPhotos.map((photo, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => addCustomElement('image', undefined, undefined, photo.src)}
                                          className="group relative h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs"
                                        >
                                          <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[7.5px] font-bold text-white truncate max-w-full font-sans">{photo.title}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 6. ÍCONES */}
                                {selectedElementCat === 'tudo' && (
                                  <div className="space-y-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Biblioteca de Ícones ({filteredIcons.length})</span>
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {filteredIcons.map((ic, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => addCustomElement('icon', ic.name, undefined, undefined, ic.color)}
                                          className="flex flex-col items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer active:scale-95 transition-all"
                                          title={ic.title}
                                        >
                                          <LucideIconRenderer name={ic.name} size={16} color={ic.color} />
                                          <span className="text-[6.5px] text-slate-400 font-bold truncate max-w-full font-sans mt-1">{ic.title}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              </div>
                            </div>
                          );
                        })()}

                        {/* TAB 3: LAYOUTS */}
                        {activeCanvaTab === 'layouts' && (
                          <div className="space-y-4 flex flex-col h-full">
                            <div className="border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <Layout size={14} /> Gabaritos de Layouts
                              </h4>
                            </div>

                            <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
                              <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed mb-1 font-sans">Substitua a lâmina atual por um template premium:</p>
                              
                              {[
                                ['provelo_split', 'Capa com Foto (Split)', 'Ideal para a capa principal da proposta comercial.'],
                                ['capa_navy', 'Capa Navy Premium', 'Design corporativo escuro de alto padrão com texturas.'],
                                ['valores', 'Valores Institucionais', 'Apresentação dos valores éticos e pilares da empresa.'],
                                ['resumo_financeiro', 'Resumo Financeiro (Tabela)', 'Quadro de valores mensais, totais e prazos com tabela.'],
                                ['equipe_servicos', 'Nossos Serviços & Equipe', 'Cards com fotos e descrições dos serviços oferecidos.'],
                                ['sobre_nos', 'Sobre Nossa Empresa', 'Apresentação institucional completa com logo e imagem.'],
                                ['termos_aceite', 'Concordância & Aceite', 'Termo de aceite final e campo para assinaturas.'],
                                ['performance', 'Performance e KPIs', 'Card de números de atendimento e metas operacionais.'],
                                ['fundadores', 'Sócios & Equipe Técnica', 'Apresentação de diretores e rostos da equipe.']
                              ].map(([typeKey, title, desc]) => (
                                <button
                                  key={typeKey}
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Atenção: isto substituirá o conteúdo atual do slide. Deseja continuar?')) {
                                      applyGabarito(typeKey, setSecoes, activeSlideIdx, secoes);
                                    }
                                  }}
                                  className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer flex flex-col gap-1 active:scale-98"
                                >
                                  <span className="text-[10px] font-black text-slate-800 uppercase leading-none block font-sans">{title}</span>
                                  <span className="text-[8px] font-bold text-slate-400 leading-normal block font-sans">{desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 4: ESTILOS */}
                        {activeCanvaTab === 'estilos' && (
                          <div className="space-y-4 flex flex-col h-full">
                            <div className="border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <Paintbrush size={14} /> Estilos do Slide
                              </h4>
                            </div>

                            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                              
                              {/* Slide Background Color */}
                              <div className="space-y-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Cor de Fundo da Lâmina</span>
                                
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="color"
                                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                    value={slideData.bgColor || '#ffffff'}
                                    onChange={(e) => {
                                      const list = [...secoes];
                                      list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                      setSecoes(list);
                                    }}
                                  />
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 py-1.5 font-mono uppercase text-slate-700 focus:outline-none"
                                    value={slideData.bgColor || '#ffffff'}
                                    onChange={(e) => {
                                      const list = [...secoes];
                                      list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                      setSecoes(list);
                                    }}
                                  />
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                  {['#ffffff', '#f8fafc', '#f1f5f9', '#0f172a', '#1e293b', '#1B4D3E', '#ef4444', '#1e4480'].map(c => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        const list = [...secoes];
                                        list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: c });
                                        setSecoes(list);
                                      }}
                                      className="w-5 h-5 rounded border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                      style={{ backgroundColor: c }}
                                      title={c}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Slide Background Image */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Imagem de Fundo</span>
                                
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-xl file:border-0 file:text-[8px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                  onChange={(e) => uploadBgImageClient(e, slideData, setSecoes, activeSlideIdx, secoes)}
                                />

                                {slideData.bgImage && (
                                  <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-150">
                                    <span className="text-[9px] text-slate-500 font-bold truncate max-w-[70%] font-sans">Fundo Ativo</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...secoes];
                                        const { bgImage, ...rest } = slideData;
                                        list[activeSlideIdx].texto = JSON.stringify(rest);
                                        setSecoes(list);
                                      }}
                                      className="text-red-500 hover:text-red-700 text-[8px] font-black uppercase cursor-pointer font-sans"
                                    >
                                      Limpar
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Typography select */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Família de Fontes</span>
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-black text-slate-700 focus:outline-none"
                                  value={slideData.fontFamily || 'Outfit'}
                                  onChange={(e) => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].texto = JSON.stringify({ ...slideData, fontFamily: e.target.value });
                                    setSecoes(list);
                                  }}
                                >
                                  <option value="Outfit">Outfit (Moderna Provelo)</option>
                                  <option value="Montserrat">Montserrat (Geométrica)</option>
                                  <option value="Inter">Inter (Sólida)</option>
                                  <option value="Playfair">Playfair Display (Serifada Premium)</option>
                                  <option value="Roboto">Roboto (Clássica)</option>
                                </select>
                              </div>

                              {/* Textura / Padrão de Fundo */}
                              <div className="space-y-2 pt-2 border-t border-slate-100">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-sans">Textura / Padrão de Fundo</span>
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-black text-slate-700 focus:outline-none"
                                  value={slideData.bgPattern || 'none'}
                                  onChange={(e) => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgPattern: e.target.value });
                                    setSecoes(list);
                                  }}
                                >
                                  <option value="none">Nenhum padrão</option>
                                  <option value="diagonal_lines">Linhas Diagonais Suaves (Navy Look)</option>
                                  <option value="dots">Pontilhado Clean</option>
                                  <option value="grid">Malha / Grid Profissional</option>
                                  <option value="gradient_light">Gradiente Sutil</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TAB 5: TAGS DE INTEGRAÇÃO */}
                        {activeCanvaTab === 'tags' && (
                          <div className="space-y-4 flex flex-col h-full">
                            <div className="border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                <Tag size={14} /> Tags de Integração
                              </h4>
                            </div>

                            <p className="text-[9.5px] text-slate-400 font-bold uppercase leading-normal font-sans">
                              Clique para injetar no elemento de texto selecionado ou criar um novo elemento na lâmina:
                            </p>

                            <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
                              {FVP_INTEGRATION_TAGS.map(({ tag, desc }) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    if (selectedElement && selectedElement.type === 'text') {
                                      insertTagAtCursor(`textarea-canva-${selectedElement.id}`, tag, (newText) => {
                                        updateElementContent(selectedElement.id, newText);
                                      }, selectedElement.content);
                                    } else {
                                      const list = [...secoes];
                                      const currentSlide = list[activeSlideIdx];
                                      if (!currentSlide) return;
                                      let slideData = JSON.parse(currentSlide.texto);
                                      const newEl = {
                                        id: `el_text_tag_${Date.now()}`,
                                        type: 'text',
                                        name: `Tag: ${tag}`,
                                        x: 200, y: 200, w: 300, h: 40,
                                        content: tag,
                                        style: { fontSize: 14, fontWeight: "bold", color: "#334155", textAlign: "left" },
                                        opacity: 100, rotate: 0, zIndex: (slideData.elements || []).length + 10
                                      };
                                      slideData.elements = [...(slideData.elements || []), newEl];
                                      list[activeSlideIdx].texto = JSON.stringify(slideData);
                                      setSecoes(list);
                                      setSelectedElementId(newEl.id);
                                    }
                                  }}
                                  className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-350 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col gap-1 active:scale-98"
                                >
                                  <span className="text-[10.5px] font-black text-emerald-800 font-mono">{tag}</span>
                                  <span className="text-[8.5px] font-bold text-slate-400 leading-normal font-sans">{desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TAB 6: CAMADAS */}
                        {activeCanvaTab === 'camadas' && (() => {
                          const elements = slideData.elements || [];
                          if (elements.length === 0) {
                            return <p className="text-xs text-slate-400 text-center font-bold uppercase tracking-wider py-10 font-sans">Nenhum elemento nesta lâmina.</p>;
                          }

                          const sortedElements = [...elements].sort((a: any, b: any) => (b.zIndex || 10) - (a.zIndex || 10));

                          return (
                            <div className="space-y-4 animate-fadeIn flex flex-col h-full">
                              <div className="border-b border-slate-100 pb-2">
                                <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                                  <Icons.Layers size={14} /> Gerenciador de Camadas
                                </h4>
                              </div>

                              <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
                                {sortedElements.map((el: any) => {
                                  const isSelected = selectedElementId === el.id;
                                  return (
                                    <div
                                      key={el.id}
                                      onClick={() => setSelectedElementId(el.id)}
                                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                      <div className="flex items-center gap-1.5 truncate flex-1 pr-2">
                                        <span className="text-[7px] font-black bg-slate-200 text-slate-500 px-1 py-0.5 rounded uppercase font-sans">
                                          {el.type}
                                        </span>
                                        
                                        {editingLayerId === el.id ? (
                                          <input
                                            type="text"
                                            className="flex-1 bg-white border border-slate-350 rounded px-1 py-0.5 text-xs text-slate-700 font-bold focus:outline-none"
                                            value={tempLayerName}
                                            onChange={(e) => setTempLayerName(e.target.value)}
                                            onBlur={() => renameLayerElement(el.id, tempLayerName)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') renameLayerElement(el.id, tempLayerName);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <span 
                                            className="truncate font-semibold font-sans"
                                            onDoubleClick={(e) => {
                                              e.stopPropagation();
                                              setEditingLayerId(el.id);
                                              setTempLayerName(el.name || el.id);
                                            }}
                                            title="Duplo clique para renomear"
                                          >
                                            {el.name || el.id}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => toggleLockElement(el.id)}
                                          className={`p-0.5 rounded transition-colors cursor-pointer ${el.locked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'}`}
                                          title={el.locked ? 'Desbloquear' : 'Bloquear'}
                                        >
                                          {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => changeZIndex(el.id, 'front')}
                                          className="p-0.5 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
                                          title="Avançar"
                                        >
                                          <ChevronUp size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => changeZIndex(el.id, 'back')}
                                          className="p-0.5 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
                                          title="Recuar"
                                        >
                                          <ChevronDown size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* CENTRO: CANVAS 16:9 DE ÁREA DE TRABALHO E BARRAS GLOBAIS DE ATALHO (COL-9) */}
                    <div className="col-span-12 lg:col-span-9 flex flex-col gap-2 p-3">

                      {/* ═══ CONTEXTUAL TOOLBAR ═══ */}
                      {selectedElement ? (
                        <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2 flex-wrap shadow-md">
                          {/* Type badge */}
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                            {selectedElement.type === 'text' ? '✏️ Texto' : selectedElement.type === 'image' ? '🖼 Foto' : selectedElement.type === 'shape' ? '⬜ Forma' : selectedElement.type === 'icon' ? '⭐ Ícone' : '📊 Gráfico'}
                          </span>
                          <div className="w-px h-5 bg-slate-200 shrink-0" />

                          {/* IMAGE CONTROLS */}
                          {selectedElement.type === 'image' && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setImageReplaceElementId(selectedElement.id); imageReplaceInputRef.current?.click(); }}
                                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer active:scale-95"
                              >
                                <ImageIcon size={12} /> Substituir Foto
                              </button>
                              <select
                                className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1.5 focus:outline-none cursor-pointer"
                                value={selectedElement.mask || 'none'}
                                onChange={(e) => updateElementStyle(selectedElement.id, 'mask', e.target.value)}
                              >
                                <option value="none">Sem Máscara</option>
                                <option value="circle">Círculo</option>
                                <option value="hexagon">Hexágono</option>
                                <option value="shield">Escudo</option>
                                <option value="provelo_mask">Provelo Shape</option>
                              </select>
                            </>
                          )}

                          {/* TEXT CONTROLS */}
                          {selectedElement.type === 'text' && (
                            <>
                              <select
                                className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1.5 focus:outline-none cursor-pointer"
                                value={selectedElement.style?.fontSize || 14}
                                onChange={(e) => updateElementStyle(selectedElement.id, 'fontSize', Number(e.target.value))}
                              >
                                {[8,9,10,11,12,13,14,16,18,20,24,28,32,36,42,48,56,64,72,80,96].map(s => (
                                  <option key={s} value={s}>{s}px</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => updateElementStyle(selectedElement.id, 'fontWeight', (selectedElement.style?.fontWeight === 'bold' || selectedElement.style?.fontWeight === '700' || selectedElement.style?.fontWeight === '900') ? 'normal' : 'bold')}
                                className={`w-7 h-7 rounded-lg text-xs font-black border transition-all cursor-pointer ${(selectedElement.style?.fontWeight === 'bold' || selectedElement.style?.fontWeight === '700' || selectedElement.style?.fontWeight === '900') ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                              >B</button>
                              <select
                                className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1.5 focus:outline-none cursor-pointer"
                                value={selectedElement.style?.textAlign || 'left'}
                                onChange={(e) => updateElementStyle(selectedElement.id, 'textAlign', e.target.value)}
                              >
                                <option value="left">← Esq</option>
                                <option value="center">↔ Centro</option>
                                <option value="right">→ Dir</option>
                              </select>
                              <input
                                type="color"
                                className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                value={selectedElement.style?.color || '#334155'}
                                onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                title="Cor do Texto"
                              />
                            </>
                          )}

                          {/* SHAPE CONTROLS */}
                          {selectedElement.type === 'shape' && (
                            <>
                              <input
                                type="color"
                                className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                value={selectedElement.color || '#ef4444'}
                                onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                title="Cor da Forma"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">Raio</span>
                                <input
                                  type="range" min="0" max="9999"
                                  className="w-16 h-1.5 accent-[#1B4D3E]"
                                  value={selectedElement.radius || 0}
                                  onChange={(e) => updateElementStyle(selectedElement.id, 'radius', Number(e.target.value))}
                                />
                                <span className="text-[9px] text-slate-500 font-mono w-6">{selectedElement.radius || 0}</span>
                              </div>
                            </>
                          )}

                          {/* ICON CONTROLS */}
                          {selectedElement.type === 'icon' && (
                            <input
                              type="color"
                              className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                              value={selectedElement.color || '#1B4D3E'}
                              onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                              title="Cor do Ícone"
                            />
                          )}

                          <div className="w-px h-5 bg-slate-200 shrink-0" />

                          {/* OPACITY - for all */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-bold">Opac.</span>
                            <input
                              type="range" min="0" max="100"
                              className="w-16 h-1.5 accent-[#1B4D3E]"
                              value={selectedElement.opacity !== undefined ? selectedElement.opacity : 100}
                              onChange={(e) => updateElementStyle(selectedElement.id, 'opacity', Number(e.target.value))}
                            />
                            <span className="text-[9px] text-slate-500 font-mono w-7">{selectedElement.opacity !== undefined ? selectedElement.opacity : 100}%</span>
                          </div>

                          <div className="w-px h-5 bg-slate-200 shrink-0" />

                          {/* ACTION BUTTONS */}
                          <button type="button" onClick={() => duplicateElement(selectedElement.id)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Duplicar">
                            <Copy size={13} />
                          </button>
                          <button type="button" onClick={() => toggleLockElement(selectedElement.id)} className={`p-1.5 rounded-lg transition-all cursor-pointer ${selectedElement.locked ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`} title={selectedElement.locked ? 'Desbloquear' : 'Bloquear'}>
                            {selectedElement.locked ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>
                          <button type="button" onClick={() => removeElement(selectedElement.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Apagar">
                            <Trash2 size={13} />
                          </button>
                          <button type="button" onClick={() => setSelectedElementId(null)} className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ml-auto" title="Fechar toolbar">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-300 font-bold flex gap-3 items-center justify-center py-1.5 rounded-xl uppercase tracking-wider font-sans">
                          <span>Clique em um elemento para editar</span>
                          <span>·</span><span>⌨️ <b>Del:</b> Apagar</span>
                          <span>·</span><span>↩️ <b>Ctrl+Z:</b> Desfazer</span>
                          <span>·</span><span>📋 <b>Ctrl+C/V:</b> Copiar/Colar</span>
                        </div>
                      )}

                      {/* O CANVAS DE TRABALHO 16:9 */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xl bg-slate-100 relative">
                        <div 
                          className="w-full aspect-[16/9] relative select-none overflow-hidden cursor-crosshair transition-all"
                          onClick={() => setSelectedElementId(null)}
                          style={{
                            backgroundColor: slideData.bgColor || '#ffffff',
                            backgroundImage: 
                              slideData.bgPattern === 'diagonal_lines'
                                ? `repeating-linear-gradient(45deg, transparent, transparent 10px, ${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'} 10px, ${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'} 12px)`
                                : slideData.bgPattern === 'dots'
                                ? `radial-gradient(${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)'} 1px, transparent 1px)`
                                : slideData.bgPattern === 'grid'
                                ? `linear-gradient(${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'} 1px, transparent 1px)`
                                : slideData.bgPattern === 'gradient_light'
                                ? `radial-gradient(circle at 20% 30%, ${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)'}, transparent), radial-gradient(circle at 80% 70%, ${isLightColor(slideData.bgColor) ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.03)'}, transparent)`
                                : slideData.bgImage ? `url(${slideData.bgImage})` : undefined,
                            backgroundSize: slideData.bgPattern === 'dots' ? '16px 16px' : slideData.bgPattern === 'grid' ? '20px 20px' : 'cover',
                            backgroundPosition: 'center',
                            fontFamily: (slideData.fontFamily || 'Outfit') === 'Outfit' ? 'Outfit, sans-serif' : 
                                        (slideData.fontFamily || 'Outfit') === 'Montserrat' ? 'Montserrat, sans-serif' : 
                                        (slideData.fontFamily || 'Outfit') === 'Inter' ? 'Inter, sans-serif' : 
                                        (slideData.fontFamily || 'Outfit') === 'Playfair' ? 'Playfair Display, serif' : 'Roboto, sans-serif'
                          }}
                        >
                          {/* Draw elements */}
                          {isCanvasLayout ? (
                            elements.map((el: any) => {
                              const isSelected = selectedElementId === el.id;
                              if (el.hidden) return null;
                              
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
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (el.type === 'image' && !el.locked) {
                                      setImageReplaceElementId(el.id);
                                      imageReplaceInputRef.current?.click();
                                    }
                                  }}
                                  className={`absolute select-none cursor-move transition-shadow ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-[999] shadow-lg' : 'hover:ring-1 hover:ring-slate-350'}`}
                                  style={{
                                    left: `${el.x / 10}%`,
                                    top: `${el.y / 5.625}%`,
                                    width: `${el.w / 10}%`,
                                    height: `${el.h / 5.625}%`,
                                    zIndex: el.zIndex || 10,
                                    transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined
                                  }}
                                >
                                  <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: borderRadiusStyle }}>
                                    {el.type === 'text' && (
                                      <div 
                                        className="w-full h-full break-words p-1 outline-none text-slate-800 font-semibold"
                                        style={{
                                          fontSize: `${el.style?.fontSize ? el.style.fontSize * 0.75 : 12}px`,
                                          fontWeight: el.style?.fontWeight || 'normal',
                                          color: el.style?.color || '#334155',
                                          textAlign: el.style?.textAlign || 'left',
                                          lineHeight: '1.25',
                                          opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                                          textShadow: el.shadow === 'suave' ? '1px 1px 2px rgba(0,0,0,0.2)' : el.shadow === 'forte' ? '2px 2px 4px rgba(0,0,0,0.4)' : el.shadow === 'neon' ? `0 0 8px ${el.style?.color || '#334155'}` : undefined
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
                                        alt="Visual element"
                                        className="w-full h-full object-cover pointer-events-none"
                                        style={{
                                          clipPath: clipPathVal,
                                          borderRadius: borderRadiusStyle,
                                          opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                                          filter: `${el.grayscale ? 'grayscale(100%) ' : ''}${el.sepia ? 'sepia(100%) ' : ''}${el.brightness !== undefined ? `brightness(${el.brightness}%) ` : ''}${el.contrast !== undefined ? `contrast(${el.contrast}%) ` : ''}${el.blur !== undefined ? `blur(${el.blur}px) ` : ''}`,
                                          boxShadow: el.shadow === 'suave' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : el.shadow === 'forte' ? '0 20px 25px -5px rgba(0,0,0,0.1)' : undefined
                                        }}
                                      />
                                    )}

                                    {el.type === 'shape' && (
                                      <div
                                        className="w-full h-full"
                                        style={{
                                          backgroundColor: el.color || '#ef4444',
                                          borderRadius: `${el.radius || 0}px`,
                                          opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                                          boxShadow: el.shadow === 'suave' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : el.shadow === 'forte' ? '0 20px 25px -5px rgba(0,0,0,0.1)' : el.shadow === 'neon' ? `0 0 15px ${el.color || '#ef4444'}` : undefined
                                        }}
                                      />
                                    )}

                                    {el.type === 'icon' && (
                                      <div className="w-full h-full flex items-center justify-center" style={{ opacity: el.opacity !== undefined ? el.opacity / 100 : 1 }}>
                                        <LucideIconRenderer 
                                          name={el.nameIcon || 'ShieldCheck'} 
                                          size={Math.min(el.w, el.h) * 0.9} 
                                          color={el.color || '#ef4444'} 
                                        />
                                      </div>
                                    )}

                                    {el.type === 'chart' && renderChartElement(el, slideData.bgColor || '#ffffff')}

                                    {el.type === 'map' && (
                                      <div className="w-full h-full p-2 flex items-center justify-center">
                                        <BrazilMap 
                                          highlightedStates={el.highlightedStates || ['PR', 'SC', 'RS']} 
                                          className="w-full h-full text-[#1E3A8A]" 
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {el.locked && (
                                    <div className="absolute top-1 left-1 bg-white/80 p-0.5 rounded-md shadow-xs text-slate-700">
                                      <Lock size={10} />
                                    </div>
                                  )}

                                  {isSelected && !el.locked && (
                                    <div
                                      onPointerDown={(e) => handlePointerDown(e, el.id, true)}
                                      className="absolute bottom-[-5px] right-[-5px] w-3 h-3 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-[1000]"
                                    />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-10 text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-inner text-center">
                              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-2xs mb-4 text-[#1B4D3E] animate-pulse">
                                <Sparkles size={24} />
                              </div>
                              <h4 className="text-sm font-black uppercase text-slate-800 font-sans tracking-wide">Modelo de Lâmina Pré-definida</h4>
                              <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed font-sans">
                                Esta lâmina está utilizando o formato legado pré-definido (<b>{slideData.layout || 'texto'}</b>). 
                                Converta para o novo editor visual para poder arrastar elementos, adicionar fotos, ícones e criar designs premium!
                              </p>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...secoes];
                                  const converted = convertLegacyToCanvas(slideData);
                                  list[activeSlideIdx].texto = JSON.stringify(converted);
                                  setSecoes(list);
                                  setSelectedElementId(null);
                                }}
                                className="mt-5 bg-[#1B4D3E] hover:bg-[#1B4D3E]/95 text-white font-black px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer font-sans"
                              >
                                <Sparkles size={13} /> Converter para Canva Editável
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hidden input for double-click image replacement */}
                      <input
                        ref={imageReplaceInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageReplace}
                      />

                    </div>

                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </main>
    </div>
    </>
  );
}