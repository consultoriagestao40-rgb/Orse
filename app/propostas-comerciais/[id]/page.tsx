'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import BrazilMap from '@/components/BrazilMap';
import { 
  FileText, ArrowLeft, Save, Printer, Building2, Tag, Trash2, ShieldCheck, 
  ChevronUp, ChevronDown, Plus, X, Undo, Redo, Copy, Paintbrush, 
  Lock, Unlock, Eye, EyeOff, Smile, Phone, Mail, Award, Users, DollarSign, 
  Star, Briefcase, HelpCircle, Edit2, Play, Search, Image as ImageIcon, Sparkles,
  Layout
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { getLoggedUser } from '@/app/propostas/actions';
import { 
  getDocumentoPropostaById, 
  updateDocumentoStatus, 
  updateSecoesDocumento, 
  deleteDocumentoProposta, 
  updateConfigApresentacao,
  uploadSlideImageAction
} from '../actions';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const LucideIconRenderer = ({ name, className, size, color }: { name: string; className?: string; size?: number; color?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <HelpCircle size={size} className={className} />;
  return <IconComponent size={size} className={className} style={{ color }} />;
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

export default function DocumentoPropostaDetail() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('');
  const [secoes, setSecoes] = useState<{id?: string; titulo: string; texto: string; ordem?: number}[]>([]);
  const [configApresentacao, setConfigApresentacao] = useState<any>({
    condicoesCliente: [],
    condicoesColaboradores: [],
    quadroEfetivoSubtitulo: '',
    quadroEfetivoClausulas: []
  });

  // Canvas Drag & Drop and Property States
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [elementStart, setElementStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Facilities');
  
  // Advanced UX States
  const [history, setHistory] = useState<any[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [copiedElement, setCopiedElement] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'conteudo' | 'estilo' | 'camadas' | 'paleta'>('conteudo');
  const [searchIcon, setSearchIcon] = useState('');
  const [searchElement, setSearchElement] = useState('');
  const [selectedElementCat, setSelectedElementCat] = useState<'tudo' | 'graficos' | 'fotos'>('tudo');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');
  const [activeCanvaTab, setActiveCanvaTab] = useState<'laminas' | 'elementos' | 'layouts' | 'estilos'>('laminas');

  const saveToHistory = (newSecoes: any[]) => {
    const listCopy = JSON.parse(JSON.stringify(newSecoes));
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(listCopy);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  const updateSecoesWithHistory = (newSecoes: any[]) => {
    setSecoes(newSecoes);
    saveToHistory(newSecoes);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setSecoes(JSON.parse(JSON.stringify(history[prevIdx])));
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setSecoes(JSON.parse(JSON.stringify(history[nextIdx])));
      setSelectedElementId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res: any = await getDocumentoPropostaById(id);
    if (res) {
      setDoc(res);
      setStatus(res.status);
      const loadedSecoes = res.secoes || [];
      setSecoes(loadedSecoes);
      setHistory([JSON.parse(JSON.stringify(loadedSecoes))]);
      setHistoryIdx(0);
      
      setConfigApresentacao(res.configApresentacao || {
        condicoesCliente: res.proposta?.client?.condicoesCliente || [
          'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
          'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
          'Próximo reajuste Fevereiro/2026.'
        ],
        condicoesColaboradores: res.proposta?.client?.condicoesColaboradores || [
          'Vale alimentação de R$900,00;',
          'Cesta trimestral de assiduidade;',
          '2 Vales transporte por dia.'
        ],
        quadroEfetivoSubtitulo: res.proposta?.client?.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
        quadroEfetivoClausulas: [
          res.proposta?.client?.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
          res.proposta?.client?.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
          res.proposta?.client?.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
        ]
      });
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

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
        console.error('Error fetching tenant logo:', err);
      }
    };
    fetchLogoFromDb();
  }, []);

  // Keyboard Shortcuts (Undo, Redo, Copy, Paste, Duplicate, Delete, Nudging)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // 1. DELETE / BACKSPACE
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          const currentSlide = secoes[activeSlideIdx];
          if (!currentSlide) return;
          let slideData: any = {};
          try {
            slideData = JSON.parse(currentSlide.texto);
          } catch (err) {
            return;
          }
          const elements = slideData.elements || [];
          const updatedElements = elements.filter((item: any) => item.id !== selectedElementId);
          const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
          const list = [...secoes];
          list[activeSlideIdx] = { ...list[activeSlideIdx], texto: updatedText };
          updateSecoesWithHistory(list);
          setSelectedElementId(null);
        }
      }

      // 2. UNDO (Ctrl+Z / Cmd+Z)
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }

      // 3. REDO (Ctrl+Y / Cmd+Shift+Z)
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'Z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }

      // 4. DUPLICATE (Ctrl+D / Cmd+D)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        if (selectedElementId) {
          e.preventDefault();
          duplicateElement(selectedElementId);
        }
      }

      // 5. COPY (Ctrl+C)
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        if (selectedElementId) {
          const currentSlide = secoes[activeSlideIdx];
          if (!currentSlide) return;
          try {
            const slideData = JSON.parse(currentSlide.texto);
            const el = (slideData.elements || []).find((item: any) => item.id === selectedElementId);
            if (el) {
              e.preventDefault();
              setCopiedElement(JSON.parse(JSON.stringify(el)));
            }
          } catch (err) {}
        }
      }

      // 6. PASTE (Ctrl+V)
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        if (copiedElement) {
          e.preventDefault();
          const currentSlide = secoes[activeSlideIdx];
          if (!currentSlide) return;
          try {
            const slideData = JSON.parse(currentSlide.texto);
            const elements = slideData.elements || [];
            const newId = `el_${copiedElement.type}_${Date.now()}`;
            const pasted = {
              ...copiedElement,
              id: newId,
              x: Math.min(950, copiedElement.x + 30),
              y: Math.min(520, copiedElement.y + 30),
              zIndex: elements.reduce((max: number, item: any) => Math.max(max, item.zIndex || 10), 10) + 1
            };
            const updatedElements = [...elements, pasted];
            const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
            const list = [...secoes];
            list[activeSlideIdx] = { ...list[activeSlideIdx], texto: updatedText };
            updateSecoesWithHistory(list);
            setSelectedElementId(newId);
          } catch (err) {}
        }
      }

      // 7. KEYBOARD NUDGING (Arrow Keys)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElementId) {
          const currentSlide = secoes[activeSlideIdx];
          if (!currentSlide) return;
          try {
            const slideData = JSON.parse(currentSlide.texto);
            const elements = slideData.elements || [];
            const el = elements.find((item: any) => item.id === selectedElementId);
            if (el) {
              if (el.locked) return; // Prevent nudging locked elements
              e.preventDefault();
              const amount = e.shiftKey ? 10 : 1;
              let newX = el.x;
              let newY = el.y;
              if (e.key === 'ArrowUp') newY = Math.max(0, el.y - amount);
              if (e.key === 'ArrowDown') newY = Math.min(562.5 - el.h, el.y + amount);
              if (e.key === 'ArrowLeft') newX = Math.max(0, el.x - amount);
              if (e.key === 'ArrowRight') newX = Math.min(1000 - el.w, el.x + amount);

              const updatedElements = elements.map((item: any) => {
                if (item.id === selectedElementId) {
                  return { ...item, x: Math.round(newX), y: Math.round(newY) };
                }
                return item;
              });
              const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
              const list = [...secoes];
              list[activeSlideIdx] = { ...list[activeSlideIdx], texto: updatedText };
              setSecoes(list);
              saveToHistory(list);
            }
          } catch (err) {}
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, activeSlideIdx, secoes, copiedElement, historyIdx, history]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (status !== doc.status) {
        await updateDocumentoStatus(id, status);
      }
      
      const payload = secoes.map((s, i) => ({ ...s, ordem: i + 1 }));
      await updateSecoesDocumento(id, payload);
      
      if (doc.tipo === 'SLIDE_DECK') {
        await updateConfigApresentacao(id, configApresentacao);
      }
      
      alert('Proposta Comercial atualizada com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar proposta: ' + err.message);
    }
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
      if (activeSlideIdx === idx) setActiveSlideIdx(idx - 1);
      else if (activeSlideIdx === idx - 1) setActiveSlideIdx(idx);
    } else if (dir === 'down' && idx < list.length - 1) {
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      if (activeSlideIdx === idx) setActiveSlideIdx(idx + 1);
      else if (activeSlideIdx === idx + 1) setActiveSlideIdx(idx);
    } else return;
    updateSecoesWithHistory(list);
  };

  // Helper action to upload files locally
  const uploadSlideImageClient = async (e: any, elementId: string, slideData: any) => {
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
        updateSecoesWithHistory(list);
      } else {
        alert("Erro ao fazer upload da imagem: " + (res.error || "Tente novamente"));
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadBgImageClient = async (e: any, slideData: any) => {
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
        updateSecoesWithHistory(list);
      } else {
        alert("Erro ao fazer upload da imagem de fundo: " + (res.error || "Tente novamente"));
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper template injector for pre-designed slide layouts
  const applyGabarito = (layoutType: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    let elements: any[] = [];
    let titleColor = "#ef4444";
    let textColor = "#475569";
    let bgColor = "#ffffff";

    if (layoutType === 'provelo_split') {
      elements = [
        { id: "el_red_bar", type: "shape", name: "Faixa Vermelha", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_logo", type: "image", name: "Logo Silva", x: 60, y: 40, w: 120, h: 40, src: companyLogo, mask: "none", zIndex: 20 },
        { id: "el_badge", type: "text", name: "Selo Comercial", x: 60, y: 150, w: 300, h: 25, content: "PROPOSTA COMERCIAL", style: { fontSize: 10, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_title", type: "text", name: "Nome Cliente", x: 60, y: 185, w: 500, h: 90, content: "[CLIENTE_NOME]", style: { fontSize: 38, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_subtitle", type: "text", name: "Subtítulo", x: 60, y: 285, w: 500, h: 50, content: "Proposta Comercial para prestação de serviços e facilities.", style: { fontSize: 13, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_info", type: "text", name: "Dados de Controle", x: 60, y: 350, w: 500, h: 60, content: "Nº Proposta: [NUMERO_PROPOSTA] | Revisão: [REVISAO]\nElaborado por Novos Negócios", style: { fontSize: 11, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", name: "Foto Capa", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'valores') {
      elements = [
        { id: "el_red_bar", type: "shape", name: "Faixa Vermelha", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", name: "Título", x: 60, y: 40, w: 500, h: 50, content: "NOSSOS VALORES", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_title", type: "text", name: "Valor 1 Título", x: 60, y: 110, w: 480, h: 22, content: "Compromisso com a Qualidade", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v1_text", type: "text", name: "Valor 1 Texto", x: 60, y: 135, w: 480, h: 60, content: "Entregamos serviços com excelência, priorizando a segurança, a padronização e a eficiência operacional em cada detalhe.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_title", type: "text", name: "Valor 2 Título", x: 60, y: 205, w: 480, h: 22, content: "Valorização do Relacionamento", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v2_text", type: "text", name: "Valor 2 Texto", x: 60, y: 230, w: 480, h: 60, content: "Valorizamos as pessoas por trás dos processos — nossos colaboradores, clientes e parceiros. Relações duradouras com respeito e transparência.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_title", type: "text", name: "Valor 3 Título", x: 60, y: 300, w: 480, h: 22, content: "Evolução Contínua", style: { fontSize: 13, fontWeight: "900", color: "#ef4444", textAlign: "left" }, zIndex: 20 },
        { id: "el_v3_text", type: "text", name: "Valor 3 Texto", x: 60, y: 325, w: 480, h: 60, content: "Buscamos sempre melhorar. Investimos em inovação, capacitação e tecnologia para oferecer soluções modernas e ágeis.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 20 },
        { id: "el_side_img", type: "image", name: "Foto Lateral", x: 580, y: 40, w: 380, h: 480, src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600", mask: "provelo_mask", zIndex: 20 }
      ];
    } else if (layoutType === 'performance') {
      elements = [
        { id: "el_red_bar", type: "shape", name: "Faixa Vermelha", x: 0, y: 0, w: 20, h: 563, color: "#ef4444", radius: 0, zIndex: 10 },
        { id: "el_title", type: "text", name: "Título", x: 60, y: 40, w: 500, h: 50, content: "NOSSA PERFORMANCE", style: { fontSize: 30, fontWeight: "900", color: "#0f172a", textAlign: "left" }, zIndex: 20 },
        { id: "el_sub", type: "text", name: "Subtítulo", x: 60, y: 95, w: 460, h: 60, content: "Na Silva facilities, resultado é reflexo direto do compromisso com excelência operacional, processos rigorosos e foco total no cliente.", style: { fontSize: 10, fontWeight: "bold", color: "#64748b", textAlign: "left" }, zIndex: 20 },
        { id: "el_img_building", type: "image", name: "Foto Prédio", x: 60, y: 170, w: 460, h: 320, src: "https://images.unsplash.com/photo-1542362567-b07eac79094d?q=80&w=600", mask: "none", zIndex: 20 },
        
        { id: "el_p1_box", type: "shape", name: "Card 1 Fundo", x: 560, y: 90, w: 160, h: 100, color: "#ef4444", radius: 24, zIndex: 20 },
        { id: "el_p1_title", type: "text", name: "Card 1 Nº", x: 570, y: 110, w: 140, h: 40, content: "29 MIL", style: { fontSize: 20, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_sub", type: "text", name: "Card 1 Label", x: 570, y: 150, w: 140, h: 30, content: "HORAS DE SERVIÇO", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p1_text", type: "text", name: "Card 1 Descrição", x: 740, y: 90, w: 220, h: 100, content: "Em 2022, movimentamos mais de 29 mil horas de serviços prestados em contratos ativos, comprovando nossa capacidade de atuação em larga escala.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 },

        { id: "el_p2_box", type: "shape", name: "Card 2 Fundo", x: 560, y: 220, w: 160, h: 100, color: "#ef4444", radius: 24, zIndex: 20 },
        { id: "el_p2_title", type: "text", name: "Card 2 Nº", x: 570, y: 240, w: 140, h: 40, content: "1.220", style: { fontSize: 20, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_sub", type: "text", name: "Card 2 Label", x: 570, y: 280, w: 140, h: 30, content: "VISITAS TÉCNICAS", style: { fontSize: 7, fontWeight: "900", color: "#ffffff", textAlign: "center" }, zIndex: 30 },
        { id: "el_p2_text", type: "text", name: "Card 2 Descrição", x: 740, y: 220, w: 220, h: 100, content: "No mesmo ano, realizamos mais de 1.220 atendimentos e visitas técnicas, sempre com equipes treinadas e foco total na satisfação do cliente.", style: { fontSize: 10, fontWeight: "normal", color: "#475569", textAlign: "left" }, zIndex: 30 }
      ];
    } else if (layoutType === 'fundadores') {
      elements = [
        { id: "el_title", type: "text", name: "Título", x: 60, y: 40, w: 880, h: 40, content: "CONHEÇA NOSSOS FUNDADORES", style: { fontSize: 28, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_sub", type: "text", name: "Subtítulo", x: 60, y: 85, w: 880, h: 30, content: "Confiança, transparência e responsabilidade no seu projeto.", style: { fontSize: 12, fontWeight: "bold", color: "#475569", textAlign: "center" }, zIndex: 20 },
        
        { id: "el_f1_photo", type: "image", name: "Sócio 1 Foto", x: 140, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f1_name", type: "text", name: "Sócio 1 Nome", x: 140, y: 345, w: 180, h: 25, content: "Ádamo Quadros", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f1_role", type: "text", name: "Sócio 1 Cargo", x: 140, y: 370, w: 180, h: 20, content: "Chief Executive Officer (CEO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 },

        { id: "el_f2_photo", type: "image", name: "Sócio 2 Foto", x: 410, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f2_name", type: "text", name: "Sócio 2 Nome", x: 410, y: 345, w: 180, h: 25, content: "Guilherme França", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f2_role", type: "text", name: "Sócio 2 Cargo", x: 410, y: 370, w: 180, h: 20, content: "Chief Product Officer (CPO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 },

        { id: "el_f3_photo", type: "image", name: "Sócio 3 Foto", x: 680, y: 150, w: 180, h: 180, src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200", mask: "circle", zIndex: 20 },
        { id: "el_f3_name", type: "text", name: "Sócio 3 Nome", x: 680, y: 345, w: 180, h: 25, content: "Giovanna Castro", style: { fontSize: 13, fontWeight: "900", color: "#0f172a", textAlign: "center" }, zIndex: 20 },
        { id: "el_f3_role", type: "text", name: "Sócio 3 Cargo", x: 680, y: 370, w: 180, h: 20, content: "Chief Technology Officer (CTO)", style: { fontSize: 9, fontWeight: "bold", color: "#ef4444", textAlign: "center" }, zIndex: 20 }
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
    updateSecoesWithHistory(list);
    setSelectedElementId(null);
  };

  const addCustomElement = (type: 'text' | 'image' | 'shape' | 'icon', iconName?: string, textPreset?: 'title' | 'subtitle' | 'body', imageSrc?: string, iconColor?: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    let slideData: any = {};
    try {
      slideData = JSON.parse(currentSlide.texto);
    } catch (e) {
      slideData = { layout: 'canvas_custom', elements: [] };
    }

    const elements = slideData.elements || [];
    let newEl: any = {};

    if (type === 'text') {
      const fontSize = textPreset === 'title' ? 32 : textPreset === 'subtitle' ? 20 : 12;
      const fontWeight = textPreset === 'title' ? '900' : textPreset === 'subtitle' ? 'bold' : 'normal';
      const content = textPreset === 'title' ? 'Inserir um título' : textPreset === 'subtitle' ? 'Inserir um subtítulo' : 'Inserir um pouquinho de texto';
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
    updateSecoesWithHistory(list);
    setSelectedElementId(newEl.id);
  };

  const addCustomChartElement = (chartType: 'donut' | 'pie' | 'bar' | 'column') => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    let slideData: any = {};
    try {
      slideData = JSON.parse(currentSlide.texto);
    } catch (e) {
      slideData = { layout: 'canvas_custom', elements: [] };
    }

    const elements = slideData.elements || [];
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
    updateSecoesWithHistory(list);
    setSelectedElementId(newEl.id);
  };

  const addCustomMapElement = () => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    let slideData: any = {};
    try {
      slideData = JSON.parse(currentSlide.texto);
    } catch (e) {
      slideData = { layout: 'canvas_custom', elements: [] };
    }

    const elements = slideData.elements || [];
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
    updateSecoesWithHistory(list);
    setSelectedElementId(newEl.id);
  };

  const removeElement = (elementId: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.filter((item: any) => item.id !== elementId);
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      updateSecoesWithHistory(list);
      setSelectedElementId(null);
    } catch (e) {}
  };

  const duplicateElement = (elementId: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
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
      updateSecoesWithHistory(list);
      setSelectedElementId(newId);
    } catch (e) {}
  };

  const changeZIndex = (elementId: string, direction: 'front' | 'back') => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          const currentZ = item.zIndex || 10;
          return { ...item, zIndex: direction === 'front' ? currentZ + 5 : Math.max(1, currentZ - 5) };
        }
        return item;
      });
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      updateSecoesWithHistory(list);
    } catch (e) {}
  };

  const toggleLockElement = (elementId: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          return { ...item, locked: !item.locked };
        }
        return item;
      });
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      updateSecoesWithHistory(list);
    } catch (e) {}
  };

  const toggleVisibilityElement = (elementId: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          return { ...item, hidden: !item.hidden };
        }
        return item;
      });
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      updateSecoesWithHistory(list);
    } catch (e) {}
  };

  const renameLayerElement = (elementId: string, newName: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          return { ...item, name: newName };
        }
        return item;
      });
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      updateSecoesWithHistory(list);
      setEditingLayerId(null);
    } catch (e) {}
  };

  const updateElementStyle = (elementId: string, styleKey: string, styleValue: any) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          if (['fontSize', 'fontWeight', 'color', 'textAlign'].includes(styleKey)) {
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
      saveToHistory(list);
    } catch (e) {}
  };

  const updateElementContent = (elementId: string, content: string) => {
    const list = [...secoes];
    const currentSlide = list[activeSlideIdx];
    if (!currentSlide) return;

    try {
      const slideData = JSON.parse(currentSlide.texto);
      const elements = slideData.elements || [];
      const updatedElements = elements.map((item: any) => {
        if (item.id === elementId) {
          return { ...item, content };
        }
        return item;
      });
      const updatedText = JSON.stringify({ ...slideData, elements: updatedElements });
      list[activeSlideIdx].texto = updatedText;
      setSecoes(list);
      saveToHistory(list);
    } catch (e) {}
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Carregando CRM Construtor...</div>;
  if (!doc) return <div className="p-10 text-center text-red-500 font-bold">Documento não encontrado.</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Montserrat:wght@300;400;600;700;800;900&family=Inter:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;500;700;900&display=swap');
      `}} />
      
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1700px] mx-auto space-y-6">

            {/* HEADER COM AÇÕES GLOBAIS */}
            <header className="flex justify-between items-end border-b border-slate-300 pb-4">
              <div>
                <button onClick={() => router.push('/propostas-comerciais')} className="flex items-center text-slate-500 hover:text-[#1B4D3E] font-bold text-xs mb-2 transition-colors uppercase tracking-wider">
                  <ArrowLeft size={14} className="mr-1" /> Voltar
                </button>
                <h1 className="text-xl font-black text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                  Proposta Comercial <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs font-black">FPV #{doc.proposta?.numero}</span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-bold">{doc.client?.razaoSocial || doc.client?.nomeFantasia}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                  title="Excluir Proposta"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => window.open(`/propostas-comerciais/${id}/print`, '_blank')}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <Printer size={16} /> Gerar PDF / Imprimir
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-black py-2 px-5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </header>

            {/* LAYOUT CONDICIONAL DO EDITOR */}
            {doc.tipo === 'SLIDE_DECK' ? (
              <div className="space-y-6">
                
                {/* TOPO: DASHBOARD DE DETALHES GERAIS HORIZONTAL */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Status</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl p-1.5 text-xs font-black text-slate-700 bg-white w-full focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none"
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Enviada">Enviada ao Cliente</option>
                        <option value="Aprovada">Aprovada (Ganha)</option>
                        <option value="Recusada">Recusada (Perdida)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Cliente Vinculado</label>
                      <div className="text-xs font-black text-slate-700 truncate max-w-[200px]">{doc.client?.nomeFantasia}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 text-slate-400">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Empresa Emissora</label>
                      <div className="text-xs font-bold text-slate-500 truncate max-w-[200px]">{doc.empresaEmissora?.nomeFantasia}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
<div className="p-3 rounded-2xl bg-emerald-50 text-emerald-50">
                      <Tag size={20} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-0.5 font-bold">Valor Total (FPV)</label>
                      <div className="text-lg font-black text-emerald-700">{fmt(doc.valorTotal)}</div>
                    </div>
                  </div>
                </div>

                {/* INTERFACE DO CANVA INTEGRADO (EMBED E TELA CHEIA) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                        <Sparkles size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Apresentação Canva Premium</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Monte seus slides no Canva com usabilidade profissional e apresente-os com fidelidade 100% nativa.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={!!configApresentacao.useCanva}
                        onChange={(e) => setConfigApresentacao({ ...configApresentacao, useCanva: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B4D3E]"></div>
                      <span className="ml-2.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">Ativar Canva</span>
                    </label>
                  </div>

                  {configApresentacao.useCanva && (
                    <div className="grid grid-cols-12 gap-6 pt-4 border-t border-slate-100 animate-fadeIn">
                      <div className="col-span-12 md:col-span-8 space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Código de Incorporação (Embed HTML) ou Link do Canva</label>
                          <input
                            type="text"
                            placeholder="Cole o link inteligente (https://www.canva.com/design/.../view?embed) ou o código iframe do Canva..."
                            value={configApresentacao.canvaEmbedUrl || ''}
                            onChange={(e) => {
                              let val = e.target.value;
                              // Se colou código iframe, extrair a URL do atributo src
                              if (val.includes('<iframe')) {
                                const match = val.match(/src="([^"]+)"/);
                                if (match && match[1]) {
                                  val = match[1];
                                }
                              }
                              setConfigApresentacao({ ...configApresentacao, canvaEmbedUrl: val });
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-700 font-sans"
                          />
                        </div>
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-[9.5px] text-slate-500 font-semibold leading-relaxed space-y-2">
                          <p className="font-bold text-slate-700">🎨 Como obter o link correto no Canva:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>No editor do <strong>Canva</strong>, clique em <strong>Compartilhar</strong> (canto superior direito);</li>
                            <li>Clique no botão <strong>Mais</strong> (...) e escolha a opção <strong>Incorporar (&lt;/&gt;)</strong>;</li>
                            <li>Clique em <strong>Incorporar</strong> e copie o link rotulado como <strong>Link de incorporação inteligente</strong>;</li>
                            <li>Cole o link acima e clique em <strong>Salvar Alterações</strong> no topo da página!</li>
                          </ol>
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-4 bg-slate-50 border border-slate-150 rounded-3xl p-5 flex flex-col justify-center items-center text-center">
                        <div className="w-14 h-14 bg-white text-[#1B4D3E] rounded-full flex items-center justify-center shadow-sm mb-3 shrink-0 border border-slate-100">
                          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.9 2h-1.8C6.3 2 2.2 6.1 2.2 11.2v1.6c0 5.1 4.1 9.2 8.9 9.2h1.8c4.8 0 8.9-4.1 8.9-9.2v-1.6c0-5.1-4.1-9.2-8.9-9.2zm-2.4 15.6H8.7v-2.2H6.9v-1.8h1.8v-3.6H6.9V8.2h1.8V6h1.8v2.2h1.8v1.8H8.7v3.6h1.8v2.2zM17.1 12H12v-1.8h5.1V12zm0-3.6H12V6.6h5.1v1.8z" />
                          </svg>
                        </div>
                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Apresentação Ativa</h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed mt-1 mb-2.5">Ao ativar, o visualizador em tela cheia do Canva com transições nativas será renderizado na área pública do cliente, mantendo 100% da fidelidade e fontes originais.</p>
                        <div className="bg-[#1b4d3e]/10 border border-[#1b4d3e]/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-full justify-center">
                          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse animate-duration-1000" />
                          <span className="text-[8px] text-[#1b4d3e] font-black uppercase tracking-wider">Conta Canva: cristiano@grupojvsserv.com.br</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {configApresentacao.useCanva && configApresentacao.canvaEmbedUrl ? (
                  /* PRÉ-VISUALIZAÇÃO DO CANVA EM TEMPO REAL */
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        👁️ Pré-visualização do Canva
                      </h4>
                      <a
                        href={configApresentacao.canvaEmbedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9.5px] font-black text-[#1B4D3E] hover:underline uppercase tracking-wider"
                      >
                        Abrir em nova guia ↗
                      </a>
                    </div>
                    <div className="w-full aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative border border-slate-250">
                      <iframe
                        src={configApresentacao.canvaEmbedUrl}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full border-none"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : (
                  /* SE NÃO FOR CANVA, RENDERIZAR O WORKSPACE TRADICIONAL */
                  <div className="grid grid-cols-12 gap-6 items-start">
                  
                  {/* ESQUERDA: O PAINEL DUPLO ESTILO CANVA (COL-3) */}
                    
                    {/* FAR-LEFT TOOLBAR (BARRA ESCURA ESTREITA) */}
                    <div className="w-16 bg-slate-900 flex flex-col items-center py-4 space-y-5 text-white shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveCanvaTab('laminas')}
                        className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'laminas' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        title="Lâminas do Slide"
                      >
                        <FileText size={18} />
                        <span className="text-[7.5px] font-black uppercase tracking-wider">Lâminas</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setActiveCanvaTab('elementos')}
                        className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'elementos' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        title="Biblioteca de Elementos"
                      >
                        <Sparkles size={18} />
                        <span className="text-[7.5px] font-black uppercase tracking-wider">Elementos</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setActiveCanvaTab('layouts')}
                        className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'layouts' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        title="Layouts da Proposta"
                      >
                        <Layout size={18} />
                        <span className="text-[7.5px] font-black uppercase tracking-wider">Layouts</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setActiveCanvaTab('estilos')}
                        className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all cursor-pointer ${activeCanvaTab === 'estilos' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        title="Estilos Globais"
                      >
                        <Paintbrush size={18} />
                        <span className="text-[7.5px] font-black uppercase tracking-wider">Estilos</span>
                      </button>
                    </div>

                    {/* DYNAMIC SIDE PANEL CONTENT */}
                    <div className="flex-1 p-4 overflow-y-auto max-h-[660px] flex flex-col bg-white">
                      
                      {/* TAB 1: LÂMINAS */}
                      {activeCanvaTab === 'laminas' && (
                        <div className="space-y-4 flex flex-col h-full">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
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
                                updateSecoesWithHistory(list);
                                setActiveSlideIdx(list.length - 1);
                              }}
                              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all shadow-xs flex items-center gap-0.5 active:scale-95 cursor-pointer"
                            >
                              <Plus size={10} /> Novo
                            </button>
                          </div>

                          {secoes.length === 0 && (
                            <p className="text-slate-400 text-xs text-center py-10 font-bold uppercase tracking-wider">Nenhum slide.</p>
                          )}

                          <div className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1">
                            {secoes.map((s, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setActiveSlideIdx(idx);
                                  setSelectedElementId(null);
                                }}
                                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-black cursor-pointer transition-all ${activeSlideIdx === idx ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                              >
                                <span className="truncate flex-1 pr-1">{String(idx + 1).padStart(2, '0')}. {s.titulo}</span>
                                
                                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => moveSecao(idx, 'up')}
                                    disabled={idx === 0}
                                    className={`p-0.5 rounded transition-colors ${activeSlideIdx === idx ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-700'} disabled:opacity-20`}
                                    title="Mover para cima"
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSecao(idx, 'down')}
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
                                        updateSecoesWithHistory(list);
                                        setActiveSlideIdx(Math.max(0, idx - 1));
                                        setSelectedElementId(null);
                                      }
                                    }}
                                    className={`p-0.5 rounded transition-colors ${activeSlideIdx === idx ? 'text-white/60 hover:text-red-300' : 'text-slate-400 hover:text-red-500'}`}
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
                            {/* Drawer Title */}
                            <div className="border-b border-slate-100 pb-2">
                              <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles size={14} /> Biblioteca de Elementos
                              </h4>
                            </div>

                            {/* Canva-Style Universal Search Bar */}
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

                            {/* Category Pills (Tabs) */}
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
                                  className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${selectedElementCat === tab.id ? 'bg-[#1B4D3E] text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Scrollable Container */}
                            <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1.5 scrollbar-thin">
                              
                              {/* 1. TEXT PRESETS (Only shown in 'Tudo' or when search is empty) */}
                              {selectedElementCat === 'tudo' && !searchElement && (
                                <div className="space-y-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Caixas de Texto</span>
                                  <div className="space-y-1.5 mb-3">
                                    <button
                                      type="button"
                                      onClick={() => addCustomElement('text', undefined, 'title')}
                                      className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                    >
                                      <span className="text-sm font-black block leading-none">Inserir um título</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => addCustomElement('text', undefined, 'subtitle')}
                                      className="w-full text-left px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                    >
                                      <span className="text-[11px] font-bold block leading-none">Inserir um subtítulo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => addCustomElement('text', undefined, 'body')}
                                      className="w-full text-left px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer transition-all active:scale-98 shadow-2xs"
                                    >
                                      <span className="text-[9px] font-normal block text-slate-500 leading-none">Inserir corpo de texto</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 2. SHAPES (Forms) */}
                              {showShapes && (
                                <div className="space-y-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Formas & Containers</span>
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
                                        updateSecoesWithHistory(list);
                                        setSelectedElementId(newEl.id);
                                      }}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <div className="w-4 h-4 bg-slate-400 rounded-none shrink-0" />
                                      <span className="text-[7.5px] font-bold uppercase leading-none">Quadrado</span>
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
                                        updateSecoesWithHistory(list);
                                        setSelectedElementId(newEl.id);
                                      }}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <div className="w-4 h-4 bg-slate-400 rounded-full shrink-0" />
                                      <span className="text-[7.5px] font-bold uppercase leading-none">Círculo</span>
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
                                        updateSecoesWithHistory(list);
                                        setSelectedElementId(newEl.id);
                                      }}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <div className="w-6 h-3 bg-slate-400 rounded shrink-0" />
                                      <span className="text-[7.5px] font-bold uppercase leading-none">Container</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 3. CHARTS */}
                              {showCharts && (
                                <div className="space-y-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Gráficos SVG Dinâmicos</span>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => addCustomChartElement('donut')}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <svg viewBox="0 0 32 32" className="w-5 h-5 text-[#ef4444] shrink-0 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="16" cy="16" r="12" />
                                        <circle cx="16" cy="16" r="6" strokeDasharray="2 2" />
                                      </svg>
                                      <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Rosca</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => addCustomChartElement('pie')}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <svg viewBox="0 0 32 32" className="w-5 h-5 text-[#3b82f6] shrink-0" fill="currentColor">
                                        <path d="M16 16 L16 4 A12 12 0 0 1 28 16 Z" />
                                        <path d="M16 16 L28 16 A12 12 0 1 1 16 4 Z" opacity="0.7" />
                                      </svg>
                                      <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Pizza</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => addCustomChartElement('bar')}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <div className="flex flex-col gap-0.5 w-6 shrink-0 py-0.5">
                                        <div className="w-full h-1 bg-[#ef4444] rounded" />
                                        <div className="w-3/4 h-1 bg-[#1B4D3E] rounded" />
                                        <div className="w-1/2 h-1 bg-[#3b82f6] rounded" />
                                      </div>
                                      <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Barra</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => addCustomChartElement('column')}
                                      className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-1 cursor-pointer transition-all active:scale-95 text-center"
                                    >
                                      <div className="flex items-end gap-1 h-4 w-6 shrink-0 justify-center">
                                        <div className="w-1 h-2 bg-[#ef4444] rounded-t" />
                                        <div className="w-1 h-4 bg-[#1B4D3E] rounded-t" />
                                        <div className="w-1 h-1.5 bg-[#3b82f6] rounded-t" />
                                      </div>
                                      <span className="text-[7px] font-bold uppercase leading-none mt-0.5">Coluna</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 4. BRAZIL MAP */}
                              {showMap && (
                                <div className="space-y-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Mapas & Ilustrações</span>
                                  <button
                                    type="button"
                                    onClick={addCustomMapElement}
                                    className="flex items-center justify-start p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 gap-3 cursor-pointer transition-all active:scale-95 w-full text-left"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                                      <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#1B4D3E]">
                                        <path d="M25 40 L40 30 L55 35 L75 25 L85 45 L70 65 L80 85 L60 90 L45 75 L30 80 L20 60 Z" fill="currentColor" opacity="0.85" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-[9.5px] font-black uppercase block leading-tight text-[#1b4d3e]">Mapa do Brasil Vetorial</span>
                                      <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5 leading-none">Marque estados de atuação em tempo real</span>
                                    </div>
                                  </button>
                                </div>
                              )}

                              {/* 5. DYNAMIC VECTOR ICONS (Only in 'Tudo' or 'Graficos') */}
                              {(selectedElementCat === 'tudo' || selectedElementCat === 'graficos') && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                                      Elementos gráficos e Ícones
                                    </span>
                                    {selectedElementCat === 'tudo' && filteredIcons.length > 8 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedElementCat('graficos')}
                                        className="text-[7.5px] font-black text-[#1B4D3E] hover:underline uppercase tracking-wider cursor-pointer"
                                      >
                                        Ver tudo
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                    {(selectedElementCat === 'tudo' ? filteredIcons.slice(0, 8) : filteredIcons).map(ic => (
                                      <button
                                        key={ic.name}
                                        type="button"
                                        onClick={() => addCustomElement('icon', ic.name, undefined, undefined, ic.color)}
                                        className="relative p-2 rounded-xl hover:bg-slate-200/80 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.08] active:scale-95 group text-center"
                                        title={`${ic.title} (Inserir)`}
                                        style={{ 
                                          backgroundColor: `${ic.color}12`,
                                          border: `1px solid ${ic.color}25`
                                        }}
                                      >
                                        <LucideIconRenderer name={ic.name} size={18} color={ic.color} />
                                        <span className="text-[6.5px] font-black text-slate-500 leading-none truncate max-w-[45px] mt-0.5 group-hover:text-slate-800 uppercase tracking-wide">
                                          {ic.title.split(' ')[0]}
                                        </span>

                                        {ic.isPro && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-xs z-10" title="Provelo Premium">
                                            <span className="text-[6.5px] leading-none">👑</span>
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                    {filteredIcons.length === 0 && (
                                      <div className="col-span-4 py-4 text-center text-slate-400 text-[8px] font-bold uppercase">Nenhum ícone correspondente</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 6. DYNAMIC STOCK PHOTOS (Only in 'Tudo' or 'Fotos') */}
                              {(selectedElementCat === 'tudo' || selectedElementCat === 'fotos') && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                                      Banco de Fotos Profissional
                                    </span>
                                    {selectedElementCat === 'tudo' && filteredPhotos.length > 6 && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedElementCat('fotos')}
                                        className="text-[7.5px] font-black text-[#1B4D3E] hover:underline uppercase tracking-wider cursor-pointer"
                                      >
                                        Ver tudo
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5">
                                    {(selectedElementCat === 'tudo' ? filteredPhotos.slice(0, 6) : filteredPhotos).map(photo => (
                                      <button
                                        key={photo.id}
                                        type="button"
                                        onClick={() => addCustomElement('image', undefined, undefined, photo.src)}
                                        className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-slate-350 hover:scale-[1.02] hover:shadow-sm transition-all active:scale-98"
                                        title={photo.title}
                                      >
                                        {/* Image wrapper to crop beautifully */}
                                        <div className="w-full h-full bg-slate-100">
                                          <img src={photo.thumb} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                        </div>

                                        {/* Dark glass overlay on hover */}
                                        <div className="absolute inset-0 bg-slate-950/40 p-1 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                          <span className="text-[7px] font-black text-white uppercase tracking-wider text-center truncate max-w-[90%] pb-1 leading-none">
                                            {photo.title}
                                          </span>
                                        </div>

                                        {/* Premium Badge */}
                                        {photo.isPro && (
                                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-md z-10" title="Premium Provelo">
                                            <span className="text-[8px] leading-none">👑</span>
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                    {filteredPhotos.length === 0 && (
                                      <div className="col-span-2 py-4 text-center text-slate-400 text-[8px] font-bold uppercase">Nenhuma foto correspondente</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 7. CUSTOM IMAGE UPLOADER CARD (Only in 'Fotos' tab or at bottom of search) */}
                              {selectedElementCat === 'fotos' && (
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Adicionar Mídia Personalizada</span>
                                  <button
                                    type="button"
                                    onClick={() => addCustomElement('image')}
                                    className="flex items-center justify-start p-3 rounded-2xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 gap-3 cursor-pointer hover:border-slate-450 transition-all active:scale-95 w-full text-left"
                                  >
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                      <ImageIcon size={18} className="text-[#1B4D3E]" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-[10px] font-black uppercase block leading-tight text-[#1b4d3e]">Carregar Outra Imagem</span>
                                      <span className="text-[7.5px] font-bold text-slate-400 block mt-0.5 leading-none">Cole um link ou use arquivos locais</span>
                                    </div>
                                  </button>
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
                            <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                              <Layout size={14} /> Gabaritos de Layouts
                            </h4>
                          </div>

                          <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
                            <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed mb-1">Substitua a lâmina atual por um template premium:</p>
                            
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
                                    applyGabarito(typeKey);
                                  }
                                }}
                                className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all cursor-pointer flex flex-col gap-1 active:scale-98"
                              >
                                <span className="text-[10px] font-black text-slate-800 uppercase leading-none block">{title}</span>
                                <span className="text-[8px] font-bold text-slate-400 leading-normal block">{desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: ESTILOS */}
                      {activeCanvaTab === 'estilos' && (
                        <div className="space-y-4 flex flex-col h-full">
                          <div className="border-b border-slate-100 pb-2">
                            <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                              <Paintbrush size={14} /> Estilos do Slide
                            </h4>
                          </div>

                          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                            {/* Slide Background Color */}
                            <div className="space-y-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cor de Fundo da Lâmina</span>
                              
                              <div className="flex gap-1.5 items-center">
                                <input
                                  type="color"
                                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                  value={slideData.bgColor || '#ffffff'}
                                  onChange={(e) => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                    updateSecoesWithHistory(list);
                                  }}
                                />
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 py-1.5 font-mono uppercase text-slate-700 focus:outline-none"
                                  value={slideData.bgColor || '#ffffff'}
                                  onChange={(e) => {
                                    const list = [...secoes];
                                    list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: e.target.value });
                                    updateSecoesWithHistory(list);
                                  }}
                                />
                              </div>

                              {/* harmonious presets */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {['#ffffff', '#f8fafc', '#f1f5f9', '#0f172a', '#1e293b', '#1B4D3E', '#ef4444', '#1e4480'].map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                      const list = [...secoes];
                                      list[activeSlideIdx].texto = JSON.stringify({ ...slideData, bgColor: c });
                                      updateSecoesWithHistory(list);
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
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Imagem de Fundo</span>
                              
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-xl file:border-0 file:text-[8px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                onChange={(e) => uploadBgImageClient(e, slideData)}
                              />

                              {slideData.bgImage && (
                                <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-150">
                                  <span className="text-[9px] text-slate-500 font-bold truncate max-w-[70%]">Fundo Ativo</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const list = [...secoes];
                                      const { bgImage, ...rest } = slideData;
                                      list[activeSlideIdx].texto = JSON.stringify(rest);
                                      updateSecoesWithHistory(list);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-[8px] font-black uppercase cursor-pointer"
                                  >
                                    Limpar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Typography select */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Família de Fontes</span>
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-black text-slate-700 focus:outline-none"
                                value={slideData.fontFamily || 'Outfit'}
                                onChange={(e) => {
                                  const list = [...secoes];
                                  list[activeSlideIdx].texto = JSON.stringify({ ...slideData, fontFamily: e.target.value });
                                  updateSecoesWithHistory(list);
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
                    {(() => {
                      const currentSlide = secoes[activeSlideIdx];
                      if (!currentSlide) return <p className="text-slate-400 text-center py-10 font-bold uppercase tracking-wide">Crie ou selecione uma lâmina.</p>;

                      let slideData: any = {};
                      try {
                        slideData = JSON.parse(currentSlide.texto);
                      } catch (e) {
                        slideData = { layout: 'texto', tituloSlide: currentSlide.titulo, subtitulo: '', conteudo: currentSlide.texto };
                      }

                      const isCanvasLayout = slideData.layout === 'canvas_custom';
                      const elements = slideData.elements || [];

                      const handlePointerDown = (e: React.PointerEvent, elementId: string, isResizeHandle: boolean = false) => {
                        e.stopPropagation();
                        const el = elements.find((item: any) => item.id === elementId);
                        if (!el || el.locked) return; // Prevent interaction if locked

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
                              let newX = elementStart.x + deltaX;
                              let newY = elementStart.y + deltaY;

                              // Snapping guides engine
                              const snapThreshold = 6;
                              let snapXLine: number | null = null;
                              let snapYLine: number | null = null;

                              // Center snapping
                              const itemCenterX = newX + item.w / 2;
                              if (Math.abs(itemCenterX - 500) < snapThreshold) {
                                newX = 500 - item.w / 2;
                                snapXLine = 500;
                              }

                              const itemCenterY = newY + item.h / 2;
                              if (Math.abs(itemCenterY - 281.25) < snapThreshold) {
                                newY = 281.25 - item.h / 2;
                                snapYLine = 281.25;
                              }

                              // Margins snapping
                              if (Math.abs(newX - 50) < snapThreshold) {
                                newX = 50;
                                snapXLine = 50;
                              }
                              if (Math.abs((newX + item.w) - 950) < snapThreshold) {
                                newX = 950 - item.w;
                                snapXLine = 950;
                              }
                              if (Math.abs(newY - 40) < snapThreshold) {
                                newY = 40;
                                snapYLine = 40;
                              }
                              if (Math.abs((newY + item.h) - 522.5) < snapThreshold) {
                                newY = 522.5 - item.h;
                                snapYLine = 522.5;
                              }

                              newX = Math.round(Math.max(0, Math.min(1000 - item.w, newX)));
                              newY = Math.round(Math.max(0, Math.min(562.5 - item.h, newY)));

                              setSnapLines({ x: snapXLine, y: snapYLine });
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
                        setSnapLines({ x: null, y: null });
                        e.currentTarget.releasePointerCapture(e.pointerId);
                        
                        // Commits dragged final state to history
                        saveToHistory(secoes);
                      };

                      return (
                        <div className="space-y-4">
                          
                          {/* BARRA DE BOTÕES DE UTILIDADES */}
                          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleUndo}
                                disabled={historyIdx <= 0}
                                className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                title="Desfazer (Ctrl+Z)"
                              >
                                <Undo size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={handleRedo}
                                disabled={historyIdx >= history.length - 1}
                                className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-20 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                title="Refazer (Ctrl+Y)"
                              >
                                <Redo size={15} />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Atalhos Ativos</span>
                              <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase">Ctrl+D (Duplicar)</span>
                              <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-0.5 rounded-md uppercase">Del (Apagar)</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Tem certeza de que deseja limpar todos os elementos desta lâmina?')) {
                                    const list = [...secoes];
                                    list[activeSlideIdx].texto = JSON.stringify({ ...slideData, elements: [] });
                                    updateSecoesWithHistory(list);
                                    setSelectedElementId(null);
                                  }
                                }}
                                className="text-red-600 hover:bg-red-50 font-black px-3 py-1.5 rounded-lg text-[9px] uppercase transition-all cursor-pointer"
                              >
                                Limpar Lâmina
                              </button>
                            </div>
                          </div>

                          {/* CANVAS PRINCIPAL DE DESENHO (16:9) */}
                          <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-slate-50 relative">
                            <div
                              onClick={() => setSelectedElementId(null)}
                              className="w-full aspect-[16/9] relative select-none overflow-hidden cursor-crosshair transition-all"
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

                              {/* Snapping Guidelines */}
                              {snapLines.x !== null && (
                                <div 
                                  className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 border-dashed z-[9999] pointer-events-none"
                                  style={{ left: `${snapLines.x / 10}%` }}
                                />
                              )}
                              {snapLines.y !== null && (
                                <div 
                                  className="absolute left-0 right-0 h-[1.5px] bg-red-500 border-dashed z-[9999] pointer-events-none"
                                  style={{ top: `${snapLines.y / 5.625}%` }}
                                />
                              )}

                              {isCanvasLayout ? (
                                elements.filter((el: any) => !el.hidden).map((el: any) => {
                                  const isSelected = selectedElementId === el.id;

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
                                      {/* Core element renderer */}
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
                                          <div 
                                            className="w-full h-full flex items-center justify-center" 
                                            style={{ 
                                              opacity: el.opacity !== undefined ? el.opacity / 100 : 1 
                                            }}
                                          >
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

                                      {/* Padlock Icon if locked */}
                                      {el.locked && (
                                        <div className="absolute top-1 left-1 bg-white/80 p-0.5 rounded-md shadow-xs text-slate-700">
                                          <Lock size={10} />
                                        </div>
                                      )}

                                      {/* Selection Handles */}
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
                                  <FileText size={48} className="text-slate-400 mb-4" />
                                  <h4 className="text-sm font-black uppercase text-slate-800">Estrutura de Apresentação Legada</h4>
                                  <p className="text-xs text-slate-400 mt-2 max-w-sm text-center">Injete um de nossos layouts Provelo premium no topo do editor para ativar o canvas arrastável Canva-Style!</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* TEXTO DE ATALHO DE USABILIDADE */}
                          <div className="text-[10px] text-slate-400 font-bold flex gap-4 items-center justify-center bg-slate-50 border border-slate-200 py-2.5 rounded-2xl uppercase tracking-wider">
                            <span>⌨️ <b>Setas:</b> Mover 1px (Nudge)</span>
                            <span>⚡ <b>Shift+Setas:</b> Mover 10px</span>
                            <span>📋 <b>Ctrl+C / V:</b> Copiar/Colar</span>
                            <span>✨ <b>Ctrl+D:</b> Duplicar</span>
                            <span>🗑️ <b>Delete:</b> Apagar</span>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                  {/* DIREITA: PAINEL DE PROPRIEDADES E CAMADAS (COL-3) */}
                  <div className="col-span-12 lg:col-span-3 border border-slate-200 bg-white rounded-3xl shadow-xs overflow-hidden max-h-[660px] flex flex-col">
                    
                    {/* ABAS */}
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
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-[#1B4D3E] text-[#1B4D3E] bg-white font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* CONTEÚDO DAS ABAS (ROLÁVEL) */}
                    <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
                      
                      {/* 1. ABA CONTEÚDO */}
                      {activeTab === 'conteudo' && (() => {
                        const currentSlide = secoes[activeSlideIdx];
                        if (!currentSlide) return null;
                        let slideData: any = {};
                        try {
                          slideData = JSON.parse(currentSlide.texto);
                        } catch (e) {
                          return <p className="text-xs text-slate-400 italic">Canvas não inicializado.</p>;
                        }

                        const elements = slideData.elements || [];
                        const selectedElement = elements.find((item: any) => item.id === selectedElementId);

                        if (!selectedElement) {
                          return (
                            <div className="text-center py-10 space-y-3">
                              <Smile size={32} className="text-slate-300 mx-auto" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">Selecione um elemento do slide ou adicione um no painel superior para configurar suas propriedades.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-5">
                            
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                              <span>TIPO: {selectedElement.type.toUpperCase()}</span>
                              {selectedElement.locked && <span className="text-amber-600 flex items-center gap-0.5"><Lock size={10} /> BLOQUEADO</span>}
                            </h5>

                            {/* PROPRIEDADES DE TEXTO */}
                            {selectedElement.type === 'text' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conteúdo do Texto (\\n = quebrar linha)</label>
                                  <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 min-h-[70px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                    value={selectedElement.content}
                                    onChange={(e) => updateElementContent(selectedElement.id, e.target.value)}
                                  />
                                  
                                  {/* Quick Tags Injection */}
                                  <div className="mt-2 bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-2xl space-y-1.5">
                                    <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider block">Inserir Tags Automáticas:</span>
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
                                          className="bg-white hover:bg-emerald-100 active:scale-95 border border-emerald-250 px-2 py-0.5 rounded-lg text-[8px] font-black text-emerald-700 shadow-2xs transition-all cursor-pointer"
                                        >
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tamanho da Fonte</label>
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                      value={selectedElement.style?.fontSize || 16}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'fontSize', Number(e.target.value))}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor do Texto</label>
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
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Espessura (Peso)</label>
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
                                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedElement.style?.fontWeight === wt ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alinhamento</label>
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
                                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedElement.style?.textAlign === al ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* PROPRIEDADES DE IMAGEM */}
                            {selectedElement.type === 'image' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subir Nova Foto</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                    onChange={(e) => uploadSlideImageClient(e, selectedElement.id, slideData)}
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Endereço (URL) da Imagem</label>
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                    value={selectedElement.src}
                                    onChange={(e) => updateElementStyle(selectedElement.id, 'src', e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Moldura Premium (Cortar)</label>
                                  <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-black text-slate-700 focus:outline-none"
                                    value={selectedElement.mask || 'none'}
                                    onChange={(e) => updateElementStyle(selectedElement.id, 'mask', e.target.value)}
                                  >
                                    <option value="none">Retangular Padrão</option>
                                    <option value="circle">Círculo Elegante (Sócios)</option>
                                    <option value="provelo_mask">Cantos Arredondados Provelo</option>
                                    <option value="hexagon">Hexágono Geométrico</option>
                                    <option value="shield">Escudo Corporativo</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Filtros Avançados</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'grayscale', !selectedElement.grayscale)}
                                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedElement.grayscale ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                      Preto e Branco
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateElementStyle(selectedElement.id, 'sepia', !selectedElement.sepia)}
                                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedElement.sepia ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                      Sepia
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* PROPRIEDADES DE FORMAS (SHAPES) */}
                            {selectedElement.type === 'shape' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor da Forma</label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="color"
                                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                      value={selectedElement.color || '#ef4444'}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 font-mono uppercase text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                      value={selectedElement.color || '#ef4444'}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Arredondamento dos Cantos (px)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold text-slate-700 focus:outline-none"
                                    value={selectedElement.radius || 0}
                                    onChange={(e) => updateElementStyle(selectedElement.id, 'radius', Number(e.target.value))}
                                  />
                                </div>
                              </div>
                            )}

                            {/* PROPRIEDADES DE ÍCONE */}
                            {selectedElement.type === 'icon' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ícone Escolhido</label>
                                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3">
                                    <LucideIconRenderer name={selectedElement.nameIcon || 'ShieldCheck'} size={32} color={selectedElement.color || '#ef4444'} />
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{selectedElement.nameIcon}</span>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor do Ícone</label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="color"
                                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                      value={selectedElement.color || '#ef4444'}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 font-mono uppercase text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                      value={selectedElement.color || '#ef4444'}
                                      onChange={(e) => updateElementStyle(selectedElement.id, 'color', e.target.value)}
                                    />
                                  </div>
                                </div>

                                {/* Mudar ícone (Icon Picker rápido) */}
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mudar Ícone (Biblioteca)</label>
                                  <div className="relative mb-2">
                                    <input
                                      type="text"
                                      placeholder="Pesquisar ícone..."
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-8 pr-3 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                      value={searchIcon}
                                      onChange={(e) => setSearchIcon(e.target.value)}
                                    />
                                    <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                                  </div>
                                  <div className="grid grid-cols-5 gap-1 max-h-[120px] overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                                    {iconPresets.filter(ic => ic.toLowerCase().includes(searchIcon.toLowerCase())).map(ic => (
                                      <button
                                        key={ic}
                                        type="button"
                                        onClick={() => {
                                          updateElementStyle(selectedElement.id, 'nameIcon', ic);
                                          updateElementStyle(selectedElement.id, 'name', `Ícone: ${ic}`);
                                        }}
                                        className={`p-1.5 rounded-lg hover:bg-slate-200 flex items-center justify-center border transition-all ${selectedElement.nameIcon === ic ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent text-slate-600'}`}
                                      >
                                        <LucideIconRenderer name={ic} size={16} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* AÇÕES DE NÍVEL RÁPIDO DO ELEMENTO */}
                            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => changeZIndex(selectedElement.id, 'front')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-[9px] uppercase shadow-xs flex-1 transition-all active:scale-95"
                              >
                                Trazer Frente
                              </button>
                              <button
                                type="button"
                                onClick={() => changeZIndex(selectedElement.id, 'back')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1.5 rounded-lg text-[9px] uppercase shadow-xs flex-1 transition-all active:scale-95"
                              >
                                Enviar Trás
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleLockElement(selectedElement.id)}
                                className={`font-bold px-2 py-1.5 rounded-lg text-[9px] uppercase shadow-xs flex-1 transition-all active:scale-95 flex items-center justify-center gap-0.5 ${selectedElement.locked ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                              >
                                {selectedElement.locked ? <><Unlock size={10} /> Soltar</> : <><Lock size={10} /> Travar</>}
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => duplicateElement(selectedElement.id)}
                                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs flex-1 text-center transition-all active:scale-95"
                              >
                                Duplicar
                              </button>
                              <button
                                type="button"
                                onClick={() => removeElement(selectedElement.id)}
                                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase shadow-xs flex-1 text-center transition-all active:scale-95"
                              >
                                Deletar
                              </button>
                            </div>

                          </div>
                        );
                      })()}

                      {/* 2. ABA ESTILO (OPACIDADE, ROTAÇÃO, SOMBRA) */}
                      {activeTab === 'estilo' && (() => {
                        const currentSlide = secoes[activeSlideIdx];
                        if (!currentSlide) return null;
                        let slideData: any = {};
                        try {
                          slideData = JSON.parse(currentSlide.texto);
                        } catch (e) { return null; }

                        const selectedElement = (slideData.elements || []).find((item: any) => item.id === selectedElementId);
                        if (!selectedElement) {
                          return <p className="text-xs text-slate-400 text-center font-bold uppercase tracking-wider py-10">Selecione um elemento para ajustar os estilos premium.</p>;
                        }

                        return (
                          <div className="space-y-5 animate-fadeIn">
                            
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Estilos Avançados</h5>

                            {/* OPACIDADE */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Opacidade / Transparência</label>
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
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Rotação do Elemento</label>
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
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sombra Projetada (Estética Premium)</label>
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
                                    className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${selectedElement.shadow === sh ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
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
                        const currentSlide = secoes[activeSlideIdx];
                        if (!currentSlide) return null;
                        let slideData: any = {};
                        try {
                          slideData = JSON.parse(currentSlide.texto);
                        } catch (e) { return null; }

                        const elements = slideData.elements || [];
                        if (elements.length === 0) {
                          return <p className="text-xs text-slate-400 text-center font-bold uppercase tracking-wider py-10">Nenhum elemento nesta lâmina.</p>;
                        }

                        // Sorted by zIndex desc (top layers appear at top of list)
                        const sortedElements = [...elements].sort((a: any, b: any) => (b.zIndex || 10) - (a.zIndex || 10));

                        return (
                          <div className="space-y-4 animate-fadeIn">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Gerenciador de Camadas</h5>
                            
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
                                      <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">
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
                                          className="truncate font-semibold"
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
                                        className={`p-1 rounded transition-colors ${el.locked ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-slate-700'}`}
                                        title={el.locked ? 'Desbloquear elemento' : 'Bloquear elemento'}
                                      >
                                        {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                      </button>
                                      {/* Visibility eye */}
                                      <button
                                        type="button"
                                        onClick={() => toggleVisibilityElement(el.id)}
                                        className={`p-1 rounded transition-colors ${el.hidden ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-slate-700'}`}
                                        title={el.hidden ? 'Exibir elemento' : 'Ocultar elemento'}
                                      >
                                        {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                      </button>
                                      {/* Layer sorting arrows */}
                                      <button
                                        type="button"
                                        onClick={() => changeZIndex(el.id, 'front')}
                                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                                        title="Trazer para frente"
                                      >
                                        <ChevronUp size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => changeZIndex(el.id, 'back')}
                                        className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
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
                        const currentSlide = secoes[activeSlideIdx];
                        if (!currentSlide) return null;
                        let slideData: any = {};
                        try {
                          slideData = JSON.parse(currentSlide.texto);
                        } catch (e) { return null; }

                        const updateGlobalStyle = (key: string, val: string) => {
                          const list = [...secoes];
                          const updatedText = JSON.stringify({ ...slideData, [key]: val });
                          list[activeSlideIdx].texto = updatedText;
                          updateSecoesWithHistory(list);
                        };

                        return (
                          <div className="space-y-4 animate-fadeIn">
                            
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Estilos Globais da Lâmina</h5>

                            {/* NOME / TÍTULO DA LÂMINA */}
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome/Título do Slide (Lâmina)</label>
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
                                  
                                  updateSecoesWithHistory(list);
                                }}
                              />
                            </div>

                            {/* TIPOGRAFIA */}
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipografia Global</label>
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 font-black text-slate-700 focus:outline-none"
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
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cor de Fundo Sólida</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="color"
                                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                                  value={slideData.bgColor || '#ffffff'}
                                  onChange={(e) => updateGlobalStyle('bgColor', e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-2 font-mono uppercase text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                                  value={slideData.bgColor || '#ffffff'}
                                  onChange={(e) => updateGlobalStyle('bgColor', e.target.value)}
                                />
                              </div>
                            </div>

                            {/* IMAGEM DE FUNDO GLOBAL */}
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Carregar Imagem de Fundo (BG)</label>
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-emerald-50 file:text-emerald-700 file:cursor-pointer hover:file:bg-emerald-100"
                                onChange={(e) => uploadBgImageClient(e, slideData)}
                              />
                            </div>

                            {/* Remover imagem de fundo */}
                            {slideData.bgImage && (
                              <button
                                type="button"
                                onClick={() => updateGlobalStyle('bgImage', '')}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-xs"
                              >
                                Remover Imagem de Fundo
                              </button>
                            )}

                          </div>
                        );
                      })()}

                    </div>
                  </div>

                </div>
              )}
            </div>
          ) : (
              /* EDITOR CONTRATO A4 TRADICIONAL */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LADO ESQUERDO: Detalhes Gerais */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ShieldCheck size={16} /> Detalhes Gerais
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status da Proposta</label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none"
                        >
                          <option value="Rascunho">Rascunho</option>
                          <option value="Enviada">Enviada ao Cliente</option>
                          <option value="Aprovada">Aprovada (Ganha)</option>
                          <option value="Recusada">Recusada (Perdida)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente Vinculado</label>
                        <div className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-bold text-slate-500">
                          {doc.client?.nomeFantasia}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Empresa Emissora</label>
                        <div className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-bold text-slate-500">
                          {doc.empresaEmissora?.nomeFantasia}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total (FPV)</label>
                        <div className="w-full border border-emerald-200 bg-emerald-50 rounded-xl p-2.5 text-xs font-black text-emerald-800">
                          {fmt(doc.valorTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LADO DIREITO: EDITOR CLÁUSULAS CONTRATO */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      Corpo do Contrato (Páginas A4)
                      <button
                        onClick={() => setSecoes([...secoes, { titulo: 'NOVA CLÁUSULA', texto: '' }])}
                        className="ml-4 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Plus size={12} /> Adicionar Cláusula
                      </button>
                    </h2>
                    <div className="text-[9px] font-bold text-slate-400 max-w-lg text-right leading-tight">
                      Tags: <strong className="text-[#1e4480]">[CLIENTE_NOME]</strong>, <strong className="text-[#1e4480]">[NUMERO_PROPOSTA]</strong>, <strong className="text-[#1e4480]">[REVISAO]</strong>, <strong className="text-[#1e4480]">[OBJETO_PROPOSTA]</strong>, <strong className="text-[#1e4480]">[ESCOPO_TECNICO]</strong><br/>
                      Tabelas: <strong className="text-emerald-600">[TABELA]</strong>, <strong className="text-emerald-600">[ITENS]</strong>, <strong className="text-emerald-600">[TERMO_ACEITE]</strong>
                    </div>
                  </div>

                  {secoes.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-10">Nenhuma cláusula adicionada ao contrato.</p>
                  )}

                  {secoes.map((s, idx) => (
                    <div key={idx} className="border border-slate-200 bg-white shadow-xs p-4 rounded-3xl relative space-y-3 hover:border-slate-350 transition-colors">
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <button
                          onClick={() => moveSecao(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Mover para cima"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveSecao(idx, 'down')}
                          disabled={idx === secoes.length - 1}
                          className="p-1 text-slate-400 hover:text-blue-500 disabled:opacity-25 transition-colors cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja remover esta cláusula do contrato?')) {
                              const list = [...secoes];
                              list.splice(idx, 1);
                              updateSecoesWithHistory(list);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                          title="Remover cláusula"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="pr-24">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          Título da Cláusula {idx + 1}
                        </label>
                        <input
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-4 py-2 font-bold focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors text-slate-700"
                          value={s.titulo}
                          onChange={(e) => {
                            const list = [...secoes];
                            list[idx].titulo = e.target.value;
                            updateSecoesWithHistory(list);
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          Conteúdo da Cláusula
                        </label>
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-4 py-3 min-h-[140px] resize-y focus:outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors font-semibold"
                          value={s.texto}
                          onChange={(e) => {
                            const list = [...secoes];
                            list[idx].texto = e.target.value;
                            updateSecoesWithHistory(list);
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
    </>
  );
}
