'use client';

import React, { useState, useEffect } from 'react';
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
  const [activeCanvaTab, setActiveCanvaTab] = useState<'laminas' | 'elementos' | 'layouts' | 'estilos'>('laminas');

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
        <div className={`${editingTemplate ? 'max-w-[1700px]' : 'max-w-5xl'} mx-auto space-y-6`}>

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
                  <div className="grid grid-cols-12 gap-6 items-start pt-2 border-t border-slate-100">
                    
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
                                ['valores', 'Valores Institucionais', 'Apresentação de pilares éticos e missões.'],
                                ['performance', 'Performance e KPIs', 'Card de números de atendimento e metas.'],
                                ['fundadores', 'Sócios e Fundadores', 'Apresentação de diretores e rostos da empresa.']
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
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CENTRO: CANVAS 16:9 DE ÁREA DE TRABALHO E BARRAS GLOBAIS DE ATALHO (COL-6) */}
                    <div className="col-span-12 lg:col-span-6 space-y-4">
                      
                      {/* O CANVAS DE TRABALHO 16:9 */}
                      <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-slate-50 relative">
                        <div 
                          className="w-full aspect-[16/9] relative select-none overflow-hidden cursor-crosshair transition-all"
                          onClick={() => setSelectedElementId(null)}
                          style={{
                            backgroundColor: slideData.bgColor || '#ffffff',
                            backgroundImage: slideData.bgImage ? `url(${slideData.bgImage})` : undefined,
                            backgroundSize: 'cover',
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
                            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-inner">
                              <Presentation size={48} className="text-slate-400 mb-4 shrink-0" />
                              <h4 className="text-sm font-black uppercase text-slate-800 font-sans">Visualização do Modelo Legado</h4>
                              <p className="text-xs text-slate-400 mt-2 max-w-sm text-center font-sans">Clique em qualquer um dos layouts Provelo no menu lateral de Layouts para carregar os slides Canva interativos!</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* KEYBOARD SHORTCUTS INSTRUCTION */}
                      <div className="text-[10px] text-slate-400 font-bold flex gap-4 items-center justify-center bg-slate-50 border border-slate-200 py-2.5 rounded-2xl uppercase tracking-wider font-sans">
                        <span>⌨️ <b>Setas:</b> Mover 1px</span>
                        <span>⚡ <b>Shift+Setas:</b> Mover 10px</span>
                        <span>📋 <b>Ctrl+C / V:</b> Copiar/Colar</span>
                        <span>✨ <b>Ctrl+D:</b> Duplicar</span>
                        <span>🗑️ <b>Delete:</b> Apagar</span>
                      </div>

                    </div>

                    {/* DIREITA: PAINEL DE PROPRIEDADES E CAMADAS (COL-3) */}
                    <div className="col-span-12 lg:col-span-3 border border-slate-200 bg-white rounded-3xl shadow-xs overflow-hidden max-h-[660px] flex flex-col">
                      
                      {/* ABAS DO PAINEL DIREITO */}
                      <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
                        {[
                          ['conteudo', 'Elemento'],
                          ['estilo', 'Estilo'],
                          ['camadas', 'Camadas'],
                          ['paleta', 'Global']
                        ].map(([tab, label]) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 font-sans ${activeTab === tab ? 'border-[#1B4D3E] text-[#1B4D3E] bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* CONTEÚDO DAS ABAS DIREITAS */}
                      <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800 scrollbar-thin">
                        
                        {/* 1. ABA ELEMENTO CONTEÚDO */}
                        {activeTab === 'conteudo' && (() => {
                          if (!selectedElement) {
                            return (
                              <div className="text-center py-10 space-y-3">
                                <Smile size={32} className="text-slate-350 mx-auto" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed font-sans">Selecione um elemento do slide para começar a editar suas propriedades.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-5">
                              
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center font-sans">
                                <span>TIPO: {selectedElement.type.toUpperCase()}</span>
                                {selectedElement.locked && <span className="text-amber-600 flex items-center gap-0.5"><Lock size={10} /> BLOQUEADO</span>}
                              </h5>

                              {/* TEXT CONTENT EDITING */}
                              {selectedElement.type === 'text' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Conteúdo do Texto (\n = quebrar linha)</label>
                                    <textarea
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 min-h-[70px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                      value={selectedElement.content}
                                      onChange={(e) => updateElementContent(selectedElement.id, e.target.value)}
                                    />
                                    
                                    {/* QUICK INTEGRATION TAGS INJECTION */}
                                    <div className="mt-2.5 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-2xl space-y-1.5">
                                      <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider block font-sans">Tags de Integração FPV:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {[
                                          ['[CLIENTE_NOME]', 'Cliente'],
                                          ['[NUMERO_PROPOSTA]', 'Proposta'],
                                          ['[REVISAO]', 'Revisão'],
                                          ['[OBJETO_PROPOSTA]', 'Objeto'],
                                          ['[ESCOPO_TECNICO]', 'Escopo'],
                                          ['[VALOR_TOTAL]', 'Valor Total'],
                                          ['[TABELA]', 'Tabela Fin.'],
                                          ['[ITENS]', 'Itens Inc/Exc'],
                                          ['[CONDICOES_COMERCIAIS]', 'Condições Com.'],
                                          ['[TERMO_ACEITE]', 'Aceite']
                                        ].map(([tag, label]) => (
                                          <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                              const newContent = selectedElement.content ? `${selectedElement.content} ${tag}` : tag;
                                              updateElementContent(selectedElement.id, newContent);
                                            }}
                                            className="bg-white hover:bg-emerald-100 active:scale-95 border border-emerald-250 px-2 py-0.5 rounded-lg text-[8px] font-black text-emerald-700 shadow-2xs transition-all cursor-pointer font-sans"
                                          >
                                            {label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Tamanho da Fonte</label>
                                      <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                        value={selectedElement.style?.fontSize || 16}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'fontSize', Number(e.target.value) || 16)}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Cor do Texto</label>
                                      <div className="flex gap-1.5">
                                        <input
                                          type="color"
                                          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                          value={selectedElement.style?.color || '#334155'}
                                          onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                        />
                                        <input
                                          type="text"
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 font-mono uppercase text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                          value={selectedElement.style?.color || '#334155'}
                                          onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Espessura (Peso)</label>
                                    <div className="grid grid-cols-3 gap-1">
                                      {[
                                        ['normal', 'Normal'],
                                        ['bold', 'Negrito'],
                                        ['900', 'Black']
                                      ].map(([wt, label]) => (
                                        <button
                                          key={wt}
                                          type="button"
                                          onClick={() => updateElementStyle(selectedElement.id, 'fontWeight', wt)}
                                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all font-sans cursor-pointer ${selectedElement.style?.fontWeight === wt ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Alinhamento</label>
                                    <div className="grid grid-cols-3 gap-1">
                                      {[
                                        ['left', 'Esquerda'],
                                        ['center', 'Centro'],
                                        ['right', 'Direita']
                                      ].map(([al, label]) => (
                                        <button
                                          key={al}
                                          type="button"
                                          onClick={() => updateElementStyle(selectedElement.id, 'textAlign', al)}
                                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all font-sans cursor-pointer ${selectedElement.style?.textAlign === al ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* IMAGE SOURCE EDITING */}
                              {selectedElement.type === 'image' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans mb-1">Carregar Imagem Real (Subir Foto)</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                      onChange={(e) => uploadSlideImageClient(e, selectedElement.id, slideData, setSecoes, activeSlideIdx, secoes)}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans mb-1">URL da Imagem</label>
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none"
                                      value={selectedElement.src || ''}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'src', e.target.value)}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans mb-1">Moldura da Foto (Estética Premium)</label>
                                    <select
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold text-slate-700 focus:outline-none cursor-pointer"
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

                              {/* SHAPE COLORS */}
                              {selectedElement.type === 'shape' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans mb-1">Cor do Preenchimento</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="color"
                                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer shrink-0"
                                        value={selectedElement.color || '#ef4444'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                      />
                                      <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-mono uppercase text-slate-700 focus:outline-none"
                                        value={selectedElement.color || '#ef4444'}
                                        onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans mb-1">Arredondamento dos Cantos (px)</label>
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 focus:outline-none"
                                      value={selectedElement.radius || 0}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'radius', Number(e.target.value))}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* CHART DATA EDITOR */}
                              {selectedElement.type === 'chart' && (
                                <div className="space-y-4">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Dados do Gráfico</span>
                                  
                                  <div className="space-y-2.5">
                                    {(selectedElement.chartData || []).map((item: any, idx: number) => (
                                      <div key={idx} className="bg-slate-50 p-2.5 border border-slate-200 rounded-xl space-y-2">
                                        <div className="flex items-center gap-1.5">
                                          <input 
                                            type="color" 
                                            value={item.color || '#cccccc'} 
                                            onChange={(e) => {
                                              const updatedData = [...selectedElement.chartData];
                                              updatedData[idx].color = e.target.value;
                                              updateElementStyle(selectedElement.id, 'chartData', updatedData);
                                            }}
                                            className="w-5 h-5 rounded cursor-pointer shrink-0"
                                          />
                                          <input 
                                            type="text" 
                                            value={item.label || ''} 
                                            onChange={(e) => {
                                              const updatedData = [...selectedElement.chartData];
                                              updatedData[idx].label = e.target.value;
                                              updateElementStyle(selectedElement.id, 'chartData', updatedData);
                                            }}
                                            placeholder="Rótulo"
                                            className="flex-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                                          />
                                          <input 
                                            type="number" 
                                            value={item.value || 0} 
                                            onChange={(e) => {
                                              const updatedData = [...selectedElement.chartData];
                                              updatedData[idx].value = Number(e.target.value) || 0;
                                              updateElementStyle(selectedElement.id, 'chartData', updatedData);
                                            }}
                                            placeholder="Valor"
                                            className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 text-right focus:outline-none"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action controls (lock/unlock, duplicate, depth, remove) */}
                              <div className="border-t border-slate-100 pt-4 space-y-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Ações do Elemento</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleLockElement(selectedElement.id)}
                                    className={`flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer font-sans ${selectedElement.locked ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                                  >
                                    {selectedElement.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                    {selectedElement.locked ? 'Desbloquear' : 'Bloquear'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Duplicate action
                                      const list = [...secoes];
                                      const newEl = {
                                        ...selectedElement,
                                        id: `${selectedElement.type}_dup_${Date.now()}`,
                                        x: Math.min(900, selectedElement.x + 20),
                                        y: Math.min(500, selectedElement.y + 20),
                                        zIndex: (selectedElement.zIndex || 10) + 1
                                      };
                                      const updatedElements = [...elements, newEl];
                                      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                      setSelectedElementId(newEl.id);
                                    }}
                                    className="flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer font-sans"
                                  >
                                    <Icons.Copy size={12} /> Duplicar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => changeZIndex(selectedElement.id, 'front')}
                                    className="flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer font-sans"
                                  >
                                    <ChevronUp size={12} /> Avançar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => changeZIndex(selectedElement.id, 'back')}
                                    className="flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer font-sans"
                                  >
                                    <ChevronDown size={12} /> Recuar
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeElement(selectedElement.id)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-black uppercase transition-all active:scale-95 cursor-pointer font-sans"
                                >
                                  <Trash2 size={12} /> Excluir Elemento
                                </button>
                              </div>

                            </div>
                          );
                        })()}

                        {/* 2. ABA ESTILOS DE ELEMENTOS (OPACIDADE, ROTAÇÃO, SOMBRA) */}
                        {activeTab === 'estilo' && (() => {
                          if (!selectedElement) {
                            return (
                              <div className="text-center py-10 space-y-3">
                                <Smile size={32} className="text-slate-350 mx-auto animate-pulse" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans leading-relaxed">Selecione um elemento para ajustar os estilos premium.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-5 animate-fadeIn">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 font-sans">Estilos Avançados</h5>

                              {/* OPACIDADE */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Opacidade / Transparência</label>
                                  <span className="text-[10px] font-mono font-bold text-[#1B4D3E]">{selectedElement.opacity !== undefined ? selectedElement.opacity : 100}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
                                  value={selectedElement.opacity !== undefined ? selectedElement.opacity : 100}
                                  onChange={(e) => updateElementStyle(selectedElement.id, 'opacity', Number(e.target.value))}
                                />
                              </div>

                              {/* ROTAÇÃO */}
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Rotação do Elemento</label>
                                  <span className="text-[10px] font-mono font-bold text-[#1B4D3E]">{selectedElement.rotate || 0}°</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
                                  value={selectedElement.rotate || 0}
                                  onChange={(e) => updateElementStyle(selectedElement.id, 'rotate', Number(e.target.value))}
                                />
                              </div>

                              {/* SOMBRAS */}
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-sans">Sombra Projetada (Estética Premium)</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {[
                                    ['none', 'Nenhuma'],
                                    ['suave', 'Sombra Suave'],
                                    ['forte', 'Sombra Forte'],
                                    ['neon', 'Sombra Neon']
                                  ].map(([sh, label]) => (
                                    <button
                                      key={sh}
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'shadow', sh)}
                                      className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all font-sans cursor-pointer ${selectedElement.shadow === sh || (!selectedElement.shadow && sh === 'none') ? 'bg-[#1B4D3E] text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 3. ABA CAMADAS (LAYERS LIST & CADEADO LOCK) */}
                        {activeTab === 'camadas' && (() => {
                          const elements = slideData.elements || [];
                          if (elements.length === 0) {
                            return <p className="text-xs text-slate-400 text-center font-bold uppercase tracking-wider py-10 font-sans">Nenhum elemento nesta lâmina.</p>;
                          }

                          // Sorted by zIndex desc (top layers appear at top of list)
                          const sortedElements = [...elements].sort((a: any, b: any) => (b.zIndex || 10) - (a.zIndex || 10));

                          return (
                            <div className="space-y-4 animate-fadeIn">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 font-sans">Gerenciador de Camadas</h5>
                              
                              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                                {sortedElements.map((el: any) => {
                                  const isSelected = selectedElementId === el.id;
                                  return (
                                    <div
                                      key={el.id}
                                      onClick={() => setSelectedElementId(el.id)}
                                      className={`p-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                      <div className="flex items-center gap-2 truncate flex-1 pr-2">
                                        <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-sans">
                                          {el.type}
                                        </span>
                                        
                                        {editingLayerId === el.id ? (
                                          <input
                                            type="text"
                                            className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-bold focus:outline-none"
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

                                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {/* Lock pad */}
                                        <button
                                          type="button"
                                          onClick={() => toggleLockElement(el.id)}
                                          className={`p-1 rounded transition-colors cursor-pointer ${el.locked ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-slate-700'}`}
                                          title={el.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
                                        >
                                          {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                        </button>
                                        {/* Layer sorting arrows */}
                                        <button
                                          type="button"
                                          onClick={() => changeZIndex(el.id, 'front')}
                                          className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
                                          title="Trazer para frente"
                                        >
                                          <ChevronUp size={12} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => changeZIndex(el.id, 'back')}
                                          className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
                                          title="Enviar para trás"
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

                        {/* 4. ABA FONTES E PALETAS GLOBAIS */}
                        {activeTab === 'paleta' && (() => {
                          const updateGlobalStyle = (key: string, val: string) => {
                            const list = [...secoes];
                            const updatedText = JSON.stringify({ ...slideData, [key]: val });
                            list[activeSlideIdx].texto = updatedText;
                            setSecoes(list);
                          };

                          return (
                            <div className="space-y-4 animate-fadeIn">
                              
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 font-sans">Estilos Globais da Lâmina</h5>

                              {/* NOME / TÍTULO DA LÂMINA */}
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Nome/Título do Slide (Lâmina)</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold focus:outline-none focus:border-[#1B4D3E] text-slate-700"
                                  value={secoes[activeSlideIdx]?.titulo || ''}
                                  onChange={(e) => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].titulo = e.target.value;
                                    
                                    try {
                                      const oldText = JSON.parse(list[activeSlideIdx].texto);
                                      list[activeSlideIdx].texto = JSON.stringify({ ...oldText, tituloSlide: e.target.value });
                                    } catch (err) {}
                                    
                                    setSecoes(list);
                                  }}
                                />
                              </div>

                              {/* TIPOGRAFIA */}
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Tipografia Global</label>
                                <select
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 font-black text-slate-700 focus:outline-none cursor-pointer"
                                  value={slideData.fontFamily || 'Outfit'}
                                  onChange={(e) => updateGlobalStyle('fontFamily', e.target.value)}
                                >
                                  <option value="Outfit">Outfit (Moderna - Provelo)</option>
                                  <option value="Montserrat">Montserrat (Robusta/Sólida)</option>
                                  <option value="Inter">Inter (Limpa/Legível)</option>
                                  <option value="Playfair">Playfair Display (Serifada/Premium)</option>
                                  <option value="Roboto">Roboto (Padrão Corporativo)</option>
                                </select>
                              </div>

                              {/* COR DE FUNDO */}
                              <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-sans">Cor de Fundo Global</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer shrink-0"
                                    value={slideData.bgColor || '#ffffff'}
                                    onChange={(e) => updateGlobalStyle('bgColor', e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-mono uppercase text-slate-700 focus:outline-none"
                                    value={slideData.bgColor || '#ffffff'}
                                    onChange={(e) => updateGlobalStyle('bgColor', e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="border-t border-slate-200 pt-4 mt-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-sans">Paletas Prontas Recomendadas</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const list = [...secoes];
                                      const updatedText = JSON.stringify({ ...slideData, bgColor: '#ffffff', textColor: '#475569', titleColor: '#0f172a' });
                                      list[activeSlideIdx].texto = updatedText;
                                      setSecoes(list);
                                    }}
                                    className="border border-slate-200 bg-white hover:bg-slate-50 p-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer"
                                  >
                                    <span className="text-[9px] font-black uppercase text-slate-700 font-sans">Tema Claro</span>
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
                                    className="border border-slate-800 bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl text-left flex items-center justify-between text-white cursor-pointer"
                                  >
                                    <span className="text-[9px] font-black uppercase text-slate-300 font-sans">Tema Escuro</span>
                                    <div className="flex gap-0.5 shadow-xs">
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                      </div> {/* p-5 right sidebar content */}
                    </div> {/* col-span-12 lg:col-span-3 right sidebar panel */}
                  </div> {/* grid-cols-12 items-start */}
                );
              })()}{/* Salvar bottom */}
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