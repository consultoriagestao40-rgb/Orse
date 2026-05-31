'use client';

import React, { useState, useEffect, useRef } from 'react';
import DocumentoA4 from '@/components/DocumentoA4';
import dynamic from 'next/dynamic';
import { aprovarPropostaAction, recusarPropostaAction, trackDocumentoView, getMinutaTemplateById, registrarAjusteAction } from './actions';
import { 
  CheckCircle, Edit, FileText, X, Printer, CheckCircle2, ShieldCheck, Mail, MapPin, 
  Smartphone, User, Presentation, Calculator, BookOpen, ChevronRight, ChevronLeft, Menu, TrendingUp,
  UserCheck, ClipboardList, Package, Layers, Info, Download, Clock, AlertTriangle
} from 'lucide-react';

const PropostaApresentacaoPrint = dynamic(
  () => import('@/components/PropostaApresentacaoPrint'),
  { ssr: false }
);

export default function ViewClient({ doc, fullProposta }: { doc: any, fullProposta: any }) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(doc.statusAssinatura === 'ASSINADO');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationType, setNegotiationType] = useState<'comment' | 'decline'>('comment');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  
  // Custom Premium Alert Modal State
  const [alertState, setAlertState] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', onConfirm?: () => void) => {
    setAlertState({ type, title, message, onConfirm });
  };

  // Real-time Countdown Timer for link validity expiration
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const expiresAtStr = doc.configApresentacao?.linkExpiresAt;
    if (!expiresAtStr) return;

    const expiresAt = new Date(expiresAtStr).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = expiresAt - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [doc.configApresentacao?.linkExpiresAt]);

  // Signature Form States
  const [signerNome, setSignerNome] = useState('');
  const [signerCpf, setSignerCpf] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerIp, setSignerIp] = useState('Detectando...');

  // Canvas Drawing States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');

  const drawCursiveSignature = (name: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle digital baseline
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(35, 110);
    ctx.lineTo(405, 110);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Cursive text styling (Authentique style)
    ctx.font = "italic 34px 'Brush Script MT', 'Dancing Script', 'Caveat', 'Playball', cursive";
    ctx.fillStyle = doc.tenant?.primaryColor || '#1B4D3E';
    ctx.textAlign = 'center';
    ctx.fillText(name || 'Assinatura Digital', canvas.width / 2, 75);
  };

  // Negotiation/Notes
  const [negotiationText, setNegotiationText] = useState('');

  // 1. Temporarily write tenant credentials into sb_user cookie for logo binding
  useEffect(() => {
    if (typeof window !== 'undefined' && doc?.tenant) {
      try {
        const userObj = {
          tenantLogoUrl: doc.tenant.logoUrl ? `/api/tenant/logo?tenantId=${doc.tenant.id}` : undefined,
          tenantNome: doc.tenant.nomeFantasia || undefined
        };
        const encoded = encodeURIComponent(JSON.stringify(userObj));
        document.cookie = `sb_user=${encoded}; path=/; max-age=3600; Secure; SameSite=Lax`;
      } catch (err) {
        console.error('Erro ao injetar cookie de marca público:', err);
      }
    }
  }, [doc]);

  // Dynamic brand color theme overrides for public client proposal viewing
  useEffect(() => {
    const color = doc.tenant?.primaryColor || '#1B4D3E';
    
    const getThemeColors = (hex: string) => {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      if (c.length !== 6) {
        c = '1B4D3E';
      }

      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);

      const darken = (val: number, amt: number) => Math.max(0, val - amt);
      const rHover = darken(r, 20);
      const gHover = darken(g, 20);
      const bHover = darken(b, 20);
      const hexHover = '#' + ((1 << 24) + (rHover << 16) + (gHover << 8) + bHover).toString(16).slice(1);

      const hexLight = `rgba(${r}, ${g}, ${b}, 0.08)`;
      
      const rDark = darken(r, 45);
      const gDark = darken(g, 45);
      const bDark = darken(b, 45);
      const hexDark = '#' + ((1 << 24) + (rDark << 16) + (gDark << 8) + bDark).toString(16).slice(1);

      return {
        primary: '#' + c,
        rgb: `${r}, ${g}, ${b}`,
        hover: hexHover,
        light: hexLight,
        dark: hexDark,
      };
    };

    const theme = getThemeColors(color);
    
    let style = document.getElementById('dynamic-client-theme-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-client-theme-style';
      document.head.appendChild(style);
    }
    style.innerHTML = `
      :root {
        --primary-color: ${theme.primary};
        --primary-color-rgb: ${theme.rgb};
        --primary-color-hover: ${theme.hover};
        --primary-color-light: ${theme.light};
        --primary-color-dark: ${theme.dark};
      }
      /* Override classes Tailwind do verde padrão */
      .bg-\\[\\#1B4D3E\\], .bg-\\[\\#1b4d3e\\] {
        background-color: var(--primary-color) !important;
      }
      .hover\\:bg-\\[\\#13382D\\]:hover, .hover\\:bg-\\[\\#13382d\\]:hover, .hover\\:bg-\\[\\#143d31\\]:hover {
        background-color: var(--primary-color-hover) !important;
      }
      .text-\\[\\#1B4D3E\\], .text-\\[\\#1b4d3e\\] {
        color: var(--primary-color) !important;
      }
      .border-\\[\\#1B4D3E\\], .border-\\[\\#1b4d3e\\] {
        border-color: var(--primary-color) !important;
      }
      .focus\\:border-\\[\\#1B4D3E\\]:focus, .focus\\:border-\\[\\#1b4d3e\\]:focus {
        border-color: var(--primary-color) !important;
      }
      .focus\\:ring-\\[\\#1B4D3E\\]:focus, .focus\\:ring-\\[\\#1b4d3e\\]:focus {
        --tw-ring-color: var(--primary-color) !important;
      }
      .hover\\:text-\\[\\#1B4D3E\\]:hover, .hover\\:text-\\[\\#1b4d3e\\]:hover {
        color: var(--primary-color) !important;
      }
      .hover\\:border-\\[\\#1B4D3E\\]:hover, .hover\\:border-\\[\\#1b4d3e\\]:hover {
        border-color: var(--primary-color) !important;
      }
      
      /* FPV Specific Green Rows (Lighter & Darker shades) */
      .bg-\\[\\#3b8026\\], .bg-\\[\\#3B8026\\] {
        background-color: var(--primary-color-hover) !important;
      }
      .border-\\[\\#2d631d\\], .border-\\[\\#2D631D\\] {
        border-color: var(--primary-color-dark) !important;
      }
      .bg-\\[\\#599e41\\], .bg-\\[\\#599E41\\] {
        background-color: var(--primary-color) !important;
      }
      .border-\\[\\#488234\\], .border-\\[\\#488234\\] {
        border-color: var(--primary-color-hover) !important;
      }
      .bg-\\[\\#8ec277\\], .bg-\\[\\#8EC277\\] {
        background-color: rgba(${theme.rgb}, 0.25) !important;
      }
      
      /* Standard Emerald Overrides */
      .text-emerald-400 { color: var(--primary-color) !important; }
      .text-emerald-500 { color: var(--primary-color) !important; }
      .text-emerald-600 { color: var(--primary-color-hover) !important; }
      .text-emerald-700 { color: var(--primary-color-hover) !important; }
      .text-emerald-750 { color: var(--primary-color-hover) !important; }
      .text-emerald-800 { color: var(--primary-color-dark) !important; }
      .text-emerald-900 { color: var(--primary-color-dark) !important; }
      
      .bg-emerald-50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-50\\/30 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100\\/50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-200 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-400 { background-color: var(--primary-color) !important; }
      .bg-emerald-500 { background-color: var(--primary-color) !important; }
      .bg-emerald-600 { background-color: var(--primary-color-hover) !important; }
      .bg-emerald-800 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-900 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-950 { background-color: var(--primary-color-dark) !important; }
      
      .border-emerald-100 { border-color: var(--primary-color-light) !important; }
      .border-emerald-200 { border-color: var(--primary-color-light) !important; }
      .border-emerald-300 { border-color: var(--primary-color-light) !important; }
      .border-emerald-400 { border-color: var(--primary-color) !important; }
      .border-emerald-500 { border-color: var(--primary-color) !important; }
      .border-emerald-600 { border-color: var(--primary-color-hover) !important; }
    `;
    document.head.appendChild(style);
  }, [doc.tenant?.primaryColor]);

  // 2. Fetch real client IP on mount
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(data => setSignerIp(data.ip))
      .catch(() => setSignerIp('187.64.12.195 (Lookup falhou)'));
  }, []);



  // Signature Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (signatureMode === 'type') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = doc.tenant?.primaryColor || '#1B4D3E';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => { setIsDrawing(false); };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (signatureMode === 'type') {
      drawCursiveSignature(signerNome);
    }
  };

  const handleApprove = async () => {
    if (!signerNome.trim() || !signerCpf.trim() || !signerEmail.trim()) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if empty signature
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      showAlert('Assinatura Necessária', 'Por favor, desenhe sua assinatura eletrônica no painel antes de aprovar.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const signatureData = canvas.toDataURL('image/png');
      const res = await aprovarPropostaAction(doc.id, {
        nome: signerNome,
        cpf: signerCpf,
        assinatura: signatureData,
        ip: signerIp,
        email: signerEmail
      });

      if (res.success) {
        setApproved(true);
        setShowApprovalModal(false);
        showAlert('Proposta Aprovada! 🎉', 'Proposta comercial aprovada e assinada com sucesso! Uma notificação foi enviada ao consultor.', 'success');
      } else {
        showAlert('Erro ao Aprovar', 'Erro ao aprovar proposta: ' + res.error, 'error');
      }
    } catch (err: any) {
      showAlert('Erro Inesperado', 'Erro inesperado: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNegotiation = async () => {
    if (!negotiationText.trim()) return;
    setLoading(true);
    try {
      if (negotiationType === 'decline') {
        const res = await recusarPropostaAction(doc.id, negotiationText);
        if (res.success) {
          showAlert('Proposta Recusada', 'Proposta recusada com sucesso. O vendedor foi notificado via WhatsApp!', 'success', () => {
            setShowNegotiationModal(false);
            setNegotiationText('');
            window.location.reload();
          });
        } else {
          showAlert('Erro ao Recusar', 'Erro ao recusar proposta: ' + res.error, 'error');
        }
      } else {
        const res = await registrarAjusteAction(doc.id, negotiationText);
        if (res.success) {
          showAlert('Sucesso! 💬', 'Sua mensagem/contraproposta foi enviada com sucesso! O consultor responsável foi notificado.', 'success', () => {
            setShowNegotiationModal(false);
            setNegotiationText('');
            window.location.reload();
          });
        } else {
          showAlert('Erro ao Enviar', 'Erro ao enviar contraproposta: ' + res.error, 'error');
        }
      }
    } catch (e: any) {
      showAlert('Erro Inesperado', 'Erro ao enviar mensagem: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Merge fullProposta com as seções do documento e valores
  const versao = fullProposta?.availableVersions?.[0];
  const mergedProposta = {
    ...fullProposta,
    tenant: doc.tenant,
    statusAssinatura: doc.statusAssinatura,
    nomeAssinante: doc.nomeAssinante,
    cpfAssinante: doc.cpfAssinante,
    ipAssinante: doc.ipAssinante,
    dataAssinatura: doc.dataAssinatura,
    assinaturaBase64: doc.assinaturaBase64,
    cliente: {
      ...(fullProposta?.cliente || {}),
      ...doc.client,
      clausulasA4: doc.tipo === 'SLIDE_DECK' 
        ? (doc.configApresentacao?.clausulasA4 || [])
        : (doc.secoes?.map((s: any) => ({ titulo: s.titulo, texto: s.texto })) || []),
      ...(doc.configApresentacao ? {
        condicoesCliente: doc.configApresentacao.condicoesCliente,
        condicoesColaboradores: doc.configApresentacao.condicoesColaboradores,
        quadroEfetivoSubtitulo: doc.configApresentacao.quadroEfetivoSubtitulo,
        quadroEfetivoClausula1: doc.configApresentacao.quadroEfetivoClausulas?.[0],
        quadroEfetivoClausula2: doc.configApresentacao.quadroEfetivoClausulas?.[1],
        quadroEfetivoClausula3: doc.configApresentacao.quadroEfetivoClausulas?.[2],
      } : {})
    }
  };

  // -------------------------------------------------------------
  // CONTROLE DO MENU LATERAL E VISIBILIDADE DAS ABAS
  // -------------------------------------------------------------
  const tabsConfig = doc.configApresentacao?.clientTabs || {
    apresentacao: true,
    proposta: true,
    fpv: true,
    minuta: false
  };

  const isSlide = !!doc.templateOrigem?.nome?.toLowerCase()?.includes('apresenta') || doc.tipo === 'SLIDE_DECK';
  
  // Real-time Canva URL normalization & sanitization on the client view
  let rawCanvaUrl = doc.configApresentacao?.canvaEmbedUrl || doc.configApresentacao?.clientTabs?.canvaEmbedUrl || '';
  if (rawCanvaUrl && rawCanvaUrl.includes('canva.com/design/')) {
    if (rawCanvaUrl.includes('<iframe')) {
      const match = rawCanvaUrl.match(/src="([^"]+)"/);
      if (match && match[1]) {
        rawCanvaUrl = match[1];
      }
    }
    const baseUrl = rawCanvaUrl.split('?')[0].split('#')[0];
    let cleanUrl = baseUrl;
    if (cleanUrl.includes('/edit')) {
      cleanUrl = cleanUrl.replace('/edit', '/view');
    }
    if (!cleanUrl.endsWith('/view')) {
      cleanUrl = cleanUrl.endsWith('/') ? `${cleanUrl}view` : `${cleanUrl}/view`;
    }
    rawCanvaUrl = `${cleanUrl}?embed`;
  }

  const canvaUrl = doc.id === 'cmpsloy27000004jlxvb5n9xo'
    ? 'https://www.canva.com/design/DAHCXKiLmiQ/v3lyl52DMCmsHRbgxx8uHQ/view?embed'
    : rawCanvaUrl;
  const hasCanva = !!canvaUrl;

  const navItems = [
    { id: 'apresentacao', label: '1. Apresentação Slides', icon: Presentation, show: tabsConfig.apresentacao && hasCanva },
    { id: 'proposta', label: '2. Proposta Comercial (A4)', icon: FileText, show: tabsConfig.proposta },
    { id: 'fpv', label: '3. Planilhas FPV Detalhada', icon: Calculator, show: tabsConfig.fpv && !!fullProposta },
    { id: 'minuta', label: '4. Minuta de Contrato', icon: BookOpen, show: tabsConfig.minuta && !!doc.configApresentacao?.clientTabs?.minutaTemplateId },
    { id: 'historico', label: '5. Histórico e Ajustes', icon: Clock, show: !!doc.configApresentacao?.negotiations && doc.configApresentacao.negotiations.length > 0 }
  ].filter(item => item.show);

  // Define a aba ativa padrão inicial
  const getFirstActiveTab = () => {
    if (tabsConfig.apresentacao && hasCanva) return 'apresentacao';
    if (tabsConfig.proposta) return 'proposta';
    if (tabsConfig.fpv && fullProposta) return 'fpv';
    if (tabsConfig.minuta && doc.configApresentacao?.clientTabs?.minutaTemplateId) return 'minuta';
    return 'proposta';
  };

  const [activeClientTab, setActiveClientTab] = useState<string>('proposta');

  useEffect(() => {
    setActiveClientTab(getFirstActiveTab());
  }, [doc]);

  // 3. Track client tab views in real time (placed safely after activeClientTab initialization)
  useEffect(() => {
    if (doc?.id && activeClientTab) {
      trackDocumentoView(doc.id, activeClientTab).catch(err =>
        console.error('Erro ao registrar visualização da aba:', err)
      );
    }
  }, [activeClientTab, doc?.id]);

  // -------------------------------------------------------------
  // CONTROLE DAS PLANILHAS FINANCEIRAS FPV DETALHADAS (ABAS 02 A 09)
  // -------------------------------------------------------------
  const [activeFpvTab, setActiveFpvTab] = useState<'premissas' | 'encargos' | 'equipe' | 'insumos' | 'extrato' | 'resumo'>('resumo');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    grupoA: false,
    grupoB: false,
    grupoC: false,
    grupoD: false,
    grupoE: false,
    grupoF: false,
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const sumGroup = (g: any) => g ? Object.values(g).reduce((a: any, b: any) => a + Number(b), 0) as number : 0;
  const totalGeralEncargos = fullProposta?.encargos?.grupoA ? (sumGroup(fullProposta?.encargos?.grupoA) + sumGroup(fullProposta?.encargos?.grupoB) + sumGroup(fullProposta?.encargos?.grupoC) + sumGroup(fullProposta?.encargos?.grupoD) + sumGroup(fullProposta?.encargos?.grupoE) + sumGroup(fullProposta?.encargos?.grupoF)) : 0;

  const totalColaboradores = fullProposta?.equipe?.reduce((acc: number, p: any) => acc + (p.tipoItem === 'SPOT' ? (p.quantidadeDemanda || 1) : (p.quantidade || 1)), 0) || 0;

  const totalInsumosDirect = Number(fullProposta?.insumos?.materiais || 0) + Number(fullProposta?.insumos?.maquinas || 0) + Number(fullProposta?.insumos?.descartaveis || 0) + Number(fullProposta?.insumos?.servicos || 0);

  const totalFaturamento = versao?.resultado?.faturamentoBruto || doc.valorTotal || 0;

  const exportEncargosCSV = () => {
    const rows = [
      ['GRUPO / ENCARGO', 'VALOR (%)']
    ];
    
    const grupos = [
      { id: 'grupoA', title: 'ENCARGOS SOCIAIS - GRUPO A', data: fullProposta?.encargos?.grupoA },
      { id: 'grupoB', title: 'ENCARGOS SOCIAIS - GRUPO B', data: fullProposta?.encargos?.grupoB },
      { id: 'grupoC', title: 'ENCARGOS SOCIAIS - GRUPO C', data: fullProposta?.encargos?.grupoC },
      { id: 'grupoD', title: 'ENCARGOS SOCIAIS - GRUPO D', data: fullProposta?.encargos?.grupoD },
      { id: 'grupoE', title: 'ENCARGOS SOCIAIS - GRUPO E', data: fullProposta?.encargos?.grupoE },
      { id: 'grupoF', title: 'ENCARGOS SOCIAIS - GRUPO F', data: fullProposta?.encargos?.grupoF },
    ];

    grupos.forEach(grp => {
      if (!grp.data) return;
      rows.push([]);
      rows.push([grp.title, '']);
      Object.entries(grp.data).forEach(([key, val]: any) => {
        const label = key === 'previdenciaSocial' ? 'INSS - PREVIDENCIA SOCIAL' : key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
        rows.push([label, `${Number(val).toFixed(2)}%`]);
      });
      rows.push([`TOTAL ${grp.title.replace('ENCARGOS SOCIAIS - ', '')}`, `${sumGroup(grp.data).toFixed(2)}%`]);
    });

    rows.push([]);
    rows.push(['TOTAL GERAL DE ENCARGOS SOCIAIS', `${totalGeralEncargos.toFixed(2)}%`]);

    const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(";")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `encargos_sociais_FPV_${doc.proposta?.numero || 'XXX'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // MOTOR DE LEITURA E SUBSTITUIÇÃO DE CLÁUSULAS DA MINUTA (ABA 04)
  // -------------------------------------------------------------
  const [minutaClausulas, setMinutaClausulas] = useState<any[]>([]);
  const [loadingMinuta, setLoadingMinuta] = useState(false);

  const replaceContractTags = (text: string) => {
    let t = text || '';
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const valorMensal = versao?.resultado?.valorTotalMensal || doc.valorTotal || 0;
    
    let tableItens = '';
    if (fullProposta?.equipe) {
      tableItens = fullProposta?.equipe?.map((i: any) => `${i.quantidade || 1}x ${i.nomeCargo} (${i.escala || ''})`).join(', ') || '';
    }

    const numFormatted = String(doc.proposta?.numero || '').padStart(3, '0');
    const versaoFormatted = String(versao?.versao || 1).padStart(2, '0');
    const tagNumFpv = `FPV-${numFormatted}-REV-${versaoFormatted}`;

    t = t.replace(/\[RAZAO_SOCIAL_CLIENTE\]/g, doc.client?.razaoSocial || doc.client?.nomeFantasia || '');
    t = t.replace(/\[CNPJ_CLIENTE\]/g, doc.client?.cnpj || '');
    t = t.replace(/\[ENDERECO_CLIENTE\]/g, doc.client?.endereco || '');
    t = t.replace(/\[RAZAO_SOCIAL_EMISSORA\]/g, doc.empresaEmissora?.razaoSocial || doc.empresaEmissora?.nomeFantasia || '');
    t = t.replace(/\[CNPJ_EMISSORA\]/g, doc.empresaEmissora?.cnpj || '');
    t = t.replace(/\[ENDERECO_EMISSORA\]/g, doc.empresaEmissora?.endereco || '');
    t = t.replace(/\[CIDADE_EMISSORA\]/g, doc.empresaEmissora?.cidade || 'Curitiba/PR'); 
    t = t.replace(/\[DATA_ATUAL\]/g, dateStr);
    t = t.replace(/\[NUMERO_FPV\]/g, tagNumFpv);
    t = t.replace(/\[TABELA_ITENS_FPV\]/g, tableItens);
    t = t.replace(/\[VALOR_MENSAL\]/g, formatCurrency(valorMensal));
    t = t.replace(/\[VIGENCIA_MESES\]/g, '12');
    t = t.replace(/\[DATA_INICIO\]/g, '-');
    return t;
  };

  useEffect(() => {
    async function loadMinuta() {
      const templateId = doc.configApresentacao?.clientTabs?.minutaTemplateId;
      if (!templateId) return;
      setLoadingMinuta(true);
      try {
        const res = await getMinutaTemplateById(templateId);
        if (res.success && res.data) {
          const matchingTemplate = res.data;
          if (matchingTemplate && matchingTemplate.clausulas) {
            const formatted = matchingTemplate.clausulas.map((c: any) => ({
              ...c,
              texto: replaceContractTags(c.texto)
            }));
            setMinutaClausulas(formatted);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar template da minuta:', err);
      } finally {
        setLoadingMinuta(false);
      }
    }
    if (activeClientTab === 'minuta') {
      loadMinuta();
    }
  }, [activeClientTab]);

return (
    <div className="bg-[#FAFBFD] w-full h-screen text-slate-800 font-sans flex flex-col overflow-hidden select-none pt-16 animate-fadeIn">
      
      {/* Real-time Countdown Timer fixed at the top (ALWAYS ACTIVE FOR CONSISTENCY) */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#1B4D3E] text-white flex items-center justify-between px-6 z-[9999] shadow-md print:hidden font-sans">
        {/* Left: Voltar button (mobile only) & Validade Title or Info */}
        <div className="flex items-center gap-3">
          {!mobileMenuOpen && (
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="flex md:hidden items-center gap-1.5 text-xs font-black text-white bg-white/10 border border-white/15 px-3 py-2 rounded-xl active:scale-95 mr-1"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          )}
          <Clock size={16} className="text-white/80 animate-pulse hidden sm:block animate-duration-1000" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
              Proposta para {doc.client?.nomeFantasia || doc.client?.razaoSocial || 'Empresa'}
            </span>
            <span className="text-[8px] text-white/70 font-black uppercase tracking-wider mt-1">
              FPV-{String(doc.proposta?.numero || 'XXX').padStart(3, '0')} • Versão v{versao?.versao || 1}
            </span>
          </div>
        </div>
        
        {/* Right: Larger Countdown Timer digits if active, otherwise static badge */}
        {timeLeft && !timeLeft.isExpired ? (
          <div className="flex gap-2 items-center font-mono">
            {timeLeft.days > 0 && (
              <>
                <div className="flex flex-col items-center min-w-[44px] bg-white/10 border border-white/20 rounded-xl p-1 shadow-inner">
                  <span className="text-sm font-black text-white leading-none">{timeLeft.days}</span>
                  <span className="text-[6.5px] text-white/70 font-black uppercase tracking-wider mt-0.5">dias</span>
                </div>
                <span className="text-sm font-black text-white/50 animate-pulse leading-none">:</span>
              </>
            )}
            <div className="flex flex-col items-center min-w-[44px] bg-white/10 border border-white/20 rounded-xl p-1 shadow-inner">
              <span className="text-sm font-black text-white leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[6.5px] text-white/70 font-black uppercase tracking-wider mt-0.5">horas</span>
            </div>
            <span className="text-sm font-black text-white/50 animate-pulse leading-none">:</span>
            <div className="flex flex-col items-center min-w-[44px] bg-white/10 border border-white/20 rounded-xl p-1 shadow-inner">
              <span className="text-sm font-black text-white leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[6.5px] text-white/70 font-black uppercase tracking-wider mt-0.5">min</span>
            </div>
            <span className="text-sm font-black text-white/50 animate-pulse leading-none">:</span>
            <div className="flex flex-col items-center min-w-[44px] bg-white/10 border border-white/20 rounded-xl p-1 shadow-inner">
              <span className="text-sm font-black text-white animate-pulse leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[6.5px] text-white/70 font-black uppercase tracking-wider mt-0.5">seg</span>
            </div>
          </div>
        ) : (
          <div className="text-[9px] bg-white/10 text-white border border-white/20 font-black uppercase tracking-wider px-3.5 py-2 rounded-xl">
            Válida até {doc.configApresentacao?.linkExpiresAt 
              ? new Date(doc.configApresentacao.linkExpiresAt).toLocaleDateString('pt-BR')
              : (doc.dataValidade || new Date(new Date().getTime() + 30*24*60*60*1000).toLocaleDateString('pt-BR'))
            }
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0 !important; size: auto; }
          .no-print, [class*="no-print"] { display: none !important; }
          * {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
             color-adjust: exact !important;
          }
          ${activeClientTab === 'apresentacao' ? `
            aside, main {
              display: none !important;
            }
            .print-slide-deck-wrapper {
              display: block !important;
            }
          ` : `
            aside {
              display: none !important;
            }
            main {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          `}
          html, body, #__next, 
          [class*="h-screen"],
          [class*="min-h-screen"], 
          [class*="overflow-hidden"],
          [class*="overflow-y-auto"] {
            background: white !important;
            background-color: white !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />
        
        {/* SIDEBAR DE TABS DE NAVEGAÇÃO (ESTILO SEGUNDA FOTO - PREMIUM WHITE) */}
        <aside className={`shrink-0 bg-white border border-slate-200 shadow-xl flex flex-col justify-between text-slate-800 print:hidden font-sans transition-all duration-300 ${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block ${
          sidebarCollapsed 
            ? 'w-full md:w-20 p-4 items-center rounded-2xl md:rounded-3xl' 
            : 'w-full md:w-80 p-6 rounded-3xl'
        }`}>
          {sidebarCollapsed ? (
            /* COLLAPSED VIEW */
            <div className="flex flex-col items-center justify-between h-full w-full">
              <div className="flex flex-col items-center w-full">
                {/* Header Collapsed */}
                <div className="flex flex-col items-center gap-4 pb-4 border-b border-slate-100 w-full">
                  <button 
                    onClick={() => setSidebarCollapsed(false)} 
                    className="p-2 hover:bg-slate-50 text-slate-400 hover:text-[#1B4D3E] rounded-xl transition-all cursor-pointer hidden md:flex items-center justify-center shrink-0 border border-slate-100 hover:border-[#1B4D3E]/20"
                    title="Expandir Menu"
                  >
                    <Menu size={18} />
                  </button>
                  <span className="text-[8px] bg-emerald-50 text-emerald-800 border border-emerald-250 font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md text-center shrink-0">
                    V{versao?.versao || 1}
                  </span>
                </div>

                {/* Nav Items Collapsed */}
                <div className="flex flex-col gap-3 mt-6 w-full items-center">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveClientTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={item.label}
                      className={`p-3.5 rounded-2xl transition-all flex items-center justify-center active:scale-[0.98] cursor-pointer border ${
                        activeClientTab === item.id
                          ? 'bg-slate-100 border-slate-200 text-[#1B4D3E] shadow-xs'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon size={18} className={activeClientTab === item.id ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Collapsed */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 items-center w-full">
                {approved ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-2xl flex items-center justify-center text-center" title="Proposta Aprovada!">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 items-center w-full">
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="w-10 h-10 bg-[#10B981] hover:bg-[#0da673] text-white rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-all active:scale-95 text-xs font-bold"
                      title="Aceitar Proposta"
                    >
                      👍
                    </button>
                    
                    <button
                      onClick={() => {
                        setNegotiationType('decline');
                        setShowNegotiationModal(true);
                      }}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-bold"
                      title="Declinar Proposta"
                    >
                      👎
                    </button>

                    <button
                      onClick={() => {
                        setNegotiationType('comment');
                        setShowNegotiationModal(true);
                      }}
                      className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 text-xs font-bold"
                      title="Comentar"
                    >
                      💬
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EXPANDED VIEW */
            <div className="flex flex-col justify-between h-full w-full">
              <div>
                {/* Sleek Minimal Header for Collapse Button */}
                <div className="flex justify-end pb-3 border-b border-slate-100 font-sans">
                  <button 
                    onClick={() => setSidebarCollapsed(true)} 
                    className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-[#1B4D3E] rounded-xl transition-all cursor-pointer hidden md:flex items-center justify-center shrink-0 border border-transparent hover:border-slate-200/60"
                    title="Recolher Menu"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>

                {/* Card Cliente */}
                <div className="mt-5 bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-left animate-fadeIn">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Cliente</span>
                  <h4 className="text-xs font-black text-[#1B4D3E] uppercase mt-1 leading-snug">
                    {doc.client?.razaoSocial || doc.client?.nomeFantasia || 'Cliente'}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-bold mt-1">
                    {doc.client?.cnpj || 'CNPJ não informado'}
                  </p>
                </div>

                {/* Menu de Navegação */}
                <div className="flex flex-col gap-1.5 mt-6">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveClientTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer border ${
                        activeClientTab === item.id
                          ? 'bg-slate-100 border-slate-200 text-[#1B4D3E] shadow-xs'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className={activeClientTab === item.id ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} className={activeClientTab === item.id ? 'text-[#1B4D3E]' : 'text-slate-350'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Rodapé da Sidebar - Botões de Ação Dinâmicos */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2.5">
                {approved ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={24} className="text-emerald-600 mb-1" />
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Proposta Aprovada</span>
                    <span className="text-[8.5px] text-emerald-600 font-bold uppercase mt-0.5">Assinatura Registrada</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="w-full bg-[#10B981] hover:bg-[#0da673] text-white font-black text-[10px] uppercase tracking-wider py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="text-[14px]">👍</span> Aceitar Proposta
                    </button>
                    
                    <button
                      onClick={() => {
                        setNegotiationType('decline');
                        setShowNegotiationModal(true);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider py-3.5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-slate-200/50"
                    >
                      <span className="text-[14px]">👎</span> Declinar Proposta
                    </button>

                    <button
                      onClick={() => {
                        setNegotiationType('comment');
                        setShowNegotiationModal(true);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider py-3.5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-slate-200/50"
                    >
                      <span className="text-[14px]">💬</span> Comentar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CONTAINER PRINCIPAL DE CONTEÚDO (CANVAS) */}
        <main className={`flex-1 h-full overflow-y-auto p-4 md:p-8 bg-[#FAFBFD] print:w-full print:p-0 print:m-0 ${
          mobileMenuOpen ? 'hidden' : 'block'
        } md:block`}>

          {/* 1. ABA: APRESENTAÇÃO CANVA */}
          {activeClientTab === 'apresentacao' && hasCanva && (
            <div className="space-y-6 animate-fadeIn print:hidden">

              {/* Iframe 16:9 */}
              <div className="w-full aspect-[16/9] bg-slate-950 overflow-hidden relative rounded-3xl shadow-2xl border border-white/10 shadow-emerald-950/5">
                <iframe
                  src={canvaUrl}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-none p-0 m-0"
                  allowFullScreen
                  allow="fullscreen"
                />
              </div>
            </div>
          )}

          {/* 2. ABA: PROPOSTA COMERCIAL A4 */}
          {activeClientTab === 'proposta' && (
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-950/20 print:p-0 print:shadow-none">
              <div className="text-slate-800">
                <DocumentoA4 
                  proposta={mergedProposta} 
                  resultado={versao?.resultado} 
                  empresaEmissora={doc.empresaEmissora} 
                  isPublicView={true}
                />
              </div>
            </div>
          )}

          {/* 3. ABA: FPV DETALHADA */}
          {activeClientTab === 'fpv' && fullProposta && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Menu secundário para abas financeiras (Layout Responsivo Premium - Grid que se adapta a Mobile e PC) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 print:hidden mb-6 font-sans text-xs">
                {[
                  { id: 'premissas', label: '2. Premissas', icon: TrendingUp },
                  { id: 'encargos', label: `3. Encargos (${totalGeralEncargos.toFixed(2)}%)`, icon: Layers },
                  { id: 'equipe', label: `4. Quadro Equipe (${totalColaboradores} ${totalColaboradores === 1 ? 'Posto' : 'Postos'})`, icon: UserCheck },
                  { id: 'insumos', label: `5-7. Insumos (${formatCurrency(totalInsumosDirect)})`, icon: Package },
                  { id: 'extrato', label: `8. Custos (${formatCurrency(totalFaturamento)})`, icon: ClipboardList },
                  { id: 'resumo', label: `9. Preço & Resumo (${formatCurrency(totalFaturamento)})`, icon: Info },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveFpvTab(t.id as any)}
                    className={`px-3 py-3 font-black uppercase tracking-wider transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 cursor-pointer border rounded-2xl text-center sm:text-left ${
                      activeFpvTab === t.id
                        ? 'border-[#1B4D3E] bg-emerald-50/40 text-[#1B4D3E] font-extrabold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <t.icon size={13} className={activeFpvTab === t.id ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                    <span className="text-[9px] sm:text-[9.5px] leading-tight break-words">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* RENDER OPERACIONAL DE CADA ABA FPV (ESTILO SPREADSHEET PLANA SEM BORDAS ARREDONDADAS) */}
              <div className="bg-white border border-slate-200 p-6 md:p-8 text-slate-800 shadow-sm rounded-none">

                {/* Sub-Aba 2: Premissas do Projeto */}
                {activeFpvTab === 'premissas' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top 3 boxes (Premissas) matching Screenshot 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-5 border border-slate-200 flex flex-col gap-2 rounded-none">
                        <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">TAXA ADMINISTRATIVA (%)</span>
                        <div className="bg-white border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-800 rounded-none shadow-sm select-none">
                          {(fullProposta?.premissas?.taxaAdm || 0).toString().replace('.', ',')}
                        </div>
                      </div>
                      <div className="bg-white p-5 border border-slate-200 flex flex-col gap-2 rounded-none">
                        <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">MARGEM DE LUCRO (%)</span>
                        <div className="bg-white border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-800 rounded-none shadow-sm select-none">
                          {(fullProposta?.premissas?.margemLucro || 0).toString().replace('.', ',')}
                        </div>
                      </div>
                      <div className="bg-white p-5 border border-slate-200 flex flex-col gap-2 rounded-none">
                        <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">COMISSÃO DO VENDEDOR (%)</span>
                        <div className="bg-white border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-800 rounded-none shadow-sm select-none">
                          {(fullProposta?.premissas?.comissaoVendedor || 0).toString().replace('.', ',')}
                        </div>
                      </div>
                    </div>

                    {/* Composição Tributária matching Screenshot 2 */}
                    <div className="bg-white border border-slate-200 p-6 rounded-none space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Composição Tributária</h4>
                        <button className="text-[10px] font-black text-emerald-800 hover:text-emerald-950 uppercase tracking-widest flex items-center gap-1 cursor-not-allowed opacity-80 bg-white border border-slate-200 px-3 py-1.5 rounded-none">
                          + Nova Linha
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(fullProposta.premissas?.tributos || []).map((t: any, i: number) => (
                          <div key={t.id || i} className="flex items-center gap-3">
                            {/* Nome do Tributo Box */}
                            <div className="flex-1 bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 uppercase rounded-none select-none">
                              {t.nome}
                            </div>
                            
                            {/* Percentual Box */}
                            <div className="flex items-center gap-2">
                              <div className="bg-white border border-slate-200 px-4 py-2 text-xs font-black text-slate-800 rounded-none w-24 text-right select-none">
                                {(t.percent || 0).toString().replace('.', ',')}
                              </div>
                              <span className="text-xs font-bold text-slate-400 w-4">%</span>
                            </div>

                            {/* Trash Icon */}
                            <button className="text-slate-300 hover:text-red-500 p-1.5 cursor-not-allowed">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Carga Tributária Consolidada bar */}
                      <div className="bg-[#1B4D3E] text-white flex justify-between items-center px-6 py-4 font-black uppercase text-xs tracking-wider rounded-none mt-6 shadow-sm">
                        <span>Carga Tributária Consolidada</span>
                        <span className="text-sm text-emerald-300">
                          {((fullProposta.premissas?.tributos || []).reduce((acc: number, t: any) => acc + (t.percent || 0), 0)).toFixed(2).replace('.', ',')}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 3: Encargos Sociais */}
                {activeFpvTab === 'encargos' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-250 pb-3">
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={16} className="text-[#1B4D3E]" /> Parâmetros Sociais e Trabalhistas
                      </h3>
                      <button
                        onClick={exportEncargosCSV}
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
                      >
                        <Download size={12} /> Exportar Planilha (CSV)
                      </button>
                    </div>
                    <div className="space-y-4">
                      {[
                        { id: 'grupoA', title: 'ENCARGOS SOCIAIS - GRUPO A', subtitle: 'Obrigações que incidem diretamente sobre a folha de pagamento', data: fullProposta.encargos?.grupoA },
                        { id: 'grupoB', title: 'ENCARGOS SOCIAIS - GRUPO B', subtitle: 'Ocorrências de faltas / ausências justificadas. Incide o Grupo A', data: fullProposta.encargos?.grupoB },
                        { id: 'grupoC', title: 'ENCARGOS SOCIAIS - GRUPO C', subtitle: 'Afastamentos temporários e provisões que não incidem sobre outros grupos', data: fullProposta.encargos?.grupoC },
                        { id: 'grupoD', title: 'ENCARGOS SOCIAIS - GRUPO D', subtitle: 'Demissão sem justa causa e indenizações', data: fullProposta.encargos?.grupoD },
                        { id: 'grupoE', title: 'ENCARGOS SOCIAIS - GRUPO E', subtitle: 'Provisionamento de casos especiais (maternidade, etc)', data: fullProposta.encargos?.grupoE },
                        { id: 'grupoF', title: 'ENCARGOS SOCIAIS - GRUPO F', subtitle: 'Benefícios e encargos sociais diretos previstos em CCT', data: fullProposta.encargos?.grupoF },
                      ].map((grp) => {
                        if (!grp.data) return null;
                        const isExpanded = !!expandedGroups[grp.id];
                        const groupSum = sumGroup(grp.data);
                        return (
                          <div key={grp.id} className="bg-white border border-slate-200 rounded-none overflow-hidden transition-all duration-200 shadow-sm">
                            {/* Toggle Header Box */}
                            <button
                              onClick={() => setExpandedGroups(prev => ({ ...prev, [grp.id]: !prev[grp.id] }))}
                              className="w-full bg-[#1B4D3E] hover:bg-[#164336] text-white flex justify-between items-center py-3.5 px-6 font-black uppercase text-[10px] tracking-wider transition-colors select-none text-left cursor-pointer rounded-none"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[12px] font-bold">
                                  <span className="print:hidden">{isExpanded ? '▼' : '▶'}</span>
                                  <span className="hidden print:inline">▼</span>
                                </span>
                                <span>{grp.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="bg-white/10 px-3 py-1 text-[10px] font-black border border-white/10 rounded-none text-emerald-200">
                                  Total: {groupSum.toFixed(2)}%
                                </span>
                              </div>
                            </button>

                            {/* Dropdown breakdown list - ALWAYS in DOM but hidden/block dynamic print */}
                            <div className={`${isExpanded ? 'block' : 'hidden print:block'} animate-fadeIn`}>
                              {grp.subtitle && (
                                <div className="bg-slate-50 border-b border-slate-150 py-2.5 px-6 text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                                  {grp.subtitle}
                                </div>
                              )}
                              <table className="w-full text-left border-collapse text-xs">
                                <tbody>
                                  {Object.entries(grp.data).map(([key, val]: any) => (
                                    <tr key={key} className="border-b border-slate-150 last:border-0 hover:bg-slate-50 bg-white">
                                      <td className="py-3 px-6 font-bold uppercase text-slate-600 text-[10px]">
                                        {key === 'previdenciaSocial' ? 'INSS - PREVIDENCIA SOCIAL' : key.replace(/([A-Z])/g, ' $1').trim()}
                                      </td>
                                      <td className="py-3 px-6 text-right font-black text-slate-800 w-32 border-l border-slate-100 select-none">
                                        {Number(val).toFixed(2)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-emerald-50/50 text-[#1B4D3E] font-black border-t border-slate-200">
                                    <td className="py-3 px-6 text-[10px] uppercase">Total {grp.title.replace('ENCARGOS SOCIAIS - ', '')}</td>
                                    <td className="py-3 px-6 text-right text-[11px] border-l border-emerald-100/50 select-none">
                                      {groupSum.toFixed(2)}%
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        );
                      })}

                      {/* Total Geral de Encargos Sociais Card */}
                      <div className="bg-[#1B4D3E] text-white flex justify-between items-center py-4 px-6 font-black uppercase text-[11px] tracking-wider rounded-none shadow-md mt-6">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-emerald-300" />
                          <span>TOTAL GERAL DE ENCARGOS SOCIAIS</span>
                        </div>
                        <span className="bg-white/15 border border-white/25 px-4 py-1.5 text-[12px] font-black rounded-none text-emerald-300">
                          {totalGeralEncargos.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 4: Quadro de Equipe / Colaboradores */}
                {activeFpvTab === 'equipe' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
                      {/* Table Header Bar */}
                      <div className="bg-[#1B4D3E] text-white flex justify-between items-center py-3.5 px-6 font-black uppercase text-[10px] tracking-wider rounded-none">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} />
                          <span>QUADRO DE COLABORADORES</span>
                        </div>
                        <button className="bg-emerald-950/40 border border-white/20 hover:bg-emerald-950/60 px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 cursor-not-allowed opacity-80">
                          + Inserir Posto
                        </button>
                      </div>

                      {/* Table Column Header Labels */}
                      <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-12 text-[9px] font-black uppercase tracking-wider text-slate-500 py-2.5 px-6 gap-4">
                        <div className="col-span-1 text-center">Qtd.</div>
                        <div className="col-span-6">Função Vinculada à CCT</div>
                        <div className="col-span-3">Escala</div>
                        <div className="col-span-2 text-right">Ação</div>
                      </div>

                      {/* Table Body Rows */}
                      <div className="divide-y divide-slate-150">
                        {fullProposta.equipe.map((p: any, idx: number) => {
                          const isSpotItem = p.tipoItem === 'SPOT';
                          const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                          return (
                            <div key={p.id || idx} className="grid grid-cols-12 items-center py-4 px-6 gap-4 hover:bg-slate-50/50 bg-white">
                              {/* QTD Input Style Box */}
                              <div className="col-span-1 flex justify-center">
                                <div className="w-16 bg-white border border-slate-200 px-3 py-2 text-center text-xs font-black text-slate-800 rounded-none shadow-sm select-none">
                                  {qty}
                                </div>
                              </div>

                              {/* Cargo Dropdown style box */}
                              <div className="col-span-6">
                                <div className="bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 rounded-none shadow-sm select-none flex justify-between items-center truncate">
                                  <span>{p.nomeCargo}</span>
                                  <span className="text-slate-300 text-[10px]">▼</span>
                                </div>
                              </div>

                              {/* Escala Dropdown style box */}
                              <div className="col-span-3">
                                <div className="bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 rounded-none shadow-sm select-none flex justify-between items-center">
                                  <span>{p.escala || '6x1 (44h)'}</span>
                                  <span className="text-slate-300 text-[10px]">▼</span>
                                </div>
                              </div>

                              {/* Action Buttons Mocked */}
                              <div className="col-span-2 flex items-center justify-end gap-2 text-xs">
                                <button className="border border-slate-200 hover:bg-slate-50 text-[9px] font-black text-slate-600 uppercase tracking-widest px-2.5 py-1.5 rounded-none flex items-center gap-1 cursor-not-allowed opacity-80 whitespace-nowrap bg-white">
                                  ⚙ Adicionais
                                </button>
                                <button className="border border-slate-200 hover:bg-slate-50 text-[9px] font-black text-slate-600 uppercase tracking-widest px-2.5 py-1.5 rounded-none flex items-center gap-1 cursor-not-allowed opacity-80 whitespace-nowrap bg-white">
                                  <span className="text-red-500 font-bold">🛡</span> EPIs Especiais
                                </button>
                                <button className="text-slate-300 hover:text-red-500 p-1.5 cursor-not-allowed">
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {fullProposta.equipe.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 italic bg-white">
                            Nenhum colaborador cadastrado.
                          </div>
                        ) : (
                          <div className="bg-slate-100 border-t border-slate-200 grid grid-cols-12 text-[10px] font-black uppercase tracking-wider text-[#1B4D3E] py-3.5 px-6 gap-4">
                            <div className="col-span-1 text-center">
                              Total: {totalColaboradores}
                            </div>
                            <div className="col-span-11 pl-3 font-extrabold text-[10px] uppercase">
                              {totalColaboradores === 1 ? 'Colaborador alocado' : 'Colaboradores alocados no total'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                 {/* Sub-Aba 5-7: Insumos, Materiais, Máquinas */}
                {activeFpvTab === 'insumos' && (() => {
                  const detalheMateriais = fullProposta.insumos?.detalheMateriais || [];
                  const totalQtyMateriais = detalheMateriais.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0);
                  const totalCostMateriais = detalheMateriais.reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

                  const detalheMaquinas = fullProposta.insumos?.detalheMaquinas || [];
                  const totalQtyMaquinas = detalheMaquinas.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0);
                  const totalCostMaquinas = detalheMaquinas.reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

                  const detalheDescartaveis = fullProposta.insumos?.detalheDescartaveis || [];
                  const totalQtyDescartaveis = detalheDescartaveis.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0);
                  const totalCostDescartaveis = detalheDescartaveis.reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

                  return (
                    <div className="space-y-8 animate-fadeIn">
                      
                      {/* MATERIAIS */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                          📦 Materiais e Insumos Fisiológicos
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-none shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase border-b border-slate-200">
                                <th className="px-5 py-2.5 w-16">Código</th>
                                <th className="px-5 py-2.5">Descrição</th>
                                <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                                <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                                <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                                <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalheMateriais.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                  <td className="px-5 py-3 font-mono text-[10px] text-slate-455">{item.codigo}</td>
                                  <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                  <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                  <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                  <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                  <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                                </tr>
                              ))}
                              {detalheMateriais.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum material cadastrado nesta proposta.</td>
                                </tr>
                              )}
                            </tbody>
                            {detalheMateriais.length > 0 && (
                              <tfoot>
                                <tr className="bg-emerald-50/50 text-[#1B4D3E] font-black border-t border-slate-200 text-xs">
                                  <td colSpan={3} className="px-5 py-3 uppercase text-[9px] tracking-wider">Total Materiais e Insumos</td>
                                  <td className="px-5 py-3 text-center">{totalQtyMateriais}</td>
                                  <td className="px-5 py-3 text-center">-</td>
                                  <td className="px-5 py-3 text-right bg-emerald-50 font-black">{formatCurrency(totalCostMateriais)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                      {/* MÁQUINAS */}
                      <div className="space-y-4 pt-4">
                        <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                          ⚙️ Máquinas e Equipamentos
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-none shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase border-b border-slate-200">
                                <th className="px-5 py-2.5 w-16">Código</th>
                                <th className="px-5 py-2.5">Descrição</th>
                                <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                                <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                                <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                                <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalheMaquinas.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                  <td className="px-5 py-3 font-mono text-[10px] text-slate-455">{item.codigo}</td>
                                  <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                  <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                  <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                  <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                  <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                                </tr>
                              ))}
                              {detalheMaquinas.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum equipamento cadastrado.</td>
                                </tr>
                              )}
                            </tbody>
                            {detalheMaquinas.length > 0 && (
                              <tfoot>
                                <tr className="bg-emerald-50/50 text-[#1B4D3E] font-black border-t border-slate-200 text-xs">
                                  <td colSpan={3} className="px-5 py-3 uppercase text-[9px] tracking-wider">Total Máquinas e Equipamentos</td>
                                  <td className="px-5 py-3 text-center">{totalQtyMaquinas}</td>
                                  <td className="px-5 py-3 text-center">-</td>
                                  <td className="px-5 py-3 text-right bg-emerald-50 font-black">{formatCurrency(totalCostMaquinas)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                      {/* DESCARTÁVEIS */}
                      <div className="space-y-4 pt-4">
                        <h4 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                          🧻 Descartáveis e EPIs
                        </h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-none shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase border-b border-slate-200">
                                <th className="px-5 py-2.5 w-16">Código</th>
                                <th className="px-5 py-2.5">Descrição</th>
                                <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                                <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                                <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                                <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalheDescartaveis.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                  <td className="px-5 py-3 font-mono text-[10px] text-slate-450">{item.codigo}</td>
                                  <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                  <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                  <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                  <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                  <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                                </tr>
                              ))}
                              {detalheDescartaveis.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum descartável/EPI cadastrado.</td>
                                </tr>
                              )}
                            </tbody>
                            {detalheDescartaveis.length > 0 && (
                              <tfoot>
                                <tr className="bg-emerald-50/50 text-[#1B4D3E] font-black border-t border-slate-200 text-xs">
                                  <td colSpan={3} className="px-5 py-3 uppercase text-[9px] tracking-wider">Total Descartáveis e EPIs</td>
                                  <td className="px-5 py-3 text-center">{totalQtyDescartaveis}</td>
                                  <td className="px-5 py-3 text-center">-</td>
                                  <td className="px-5 py-3 text-right bg-emerald-50 font-black">{formatCurrency(totalCostDescartaveis)}</td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Sub-Aba 8: Planilha de Custos / Extrato */}
                {activeFpvTab === 'extrato' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
                      {/* Big Title Header Banner matching Screenshot 5 */}
                      <div className="bg-[#1B4D3E] text-white py-4 px-6 text-center font-black uppercase text-xs tracking-wider rounded-none select-none">
                        Planilha de Custos
                      </div>
                      
                      <table className="w-full text-left border-collapse text-xs text-slate-800">
                        <thead>
                          {/* MONTANTE A */}
                          <tr className="bg-[#1B4D3E] text-white border-b border-white/20">
                            <th colSpan={4} className="py-2.5 px-6 text-center uppercase tracking-widest font-black text-[9.5px]">Montante "A" - Mão-de-obra</th>
                          </tr>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                            <th className="py-2 px-6 w-[50%]">1) Função</th>
                            <th className="py-2 px-6 text-center">Qtd.</th>
                            <th className="py-2 px-6 text-right">Custo Unit</th>
                            <th className="py-2 px-6 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Colaboradores list */}
                          {fullProposta.equipe.map((p: any, idx: number) => {
                            const itemRes = versao?.resultado?.items?.find((x: any) => x.id === p.id);
                            const custoTotal = itemRes?.detalhes?.remuneracao || 0;
                            const isSpotItem = p.tipoItem === 'SPOT';
                            const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                            const custoUnitario = isSpotItem ? (custoTotal / qty) : custoTotal;
                            const totalLinha = isSpotItem ? custoTotal : (custoTotal * p.quantidade);
                            return (
                              <tr key={idx} className="border-b border-slate-200 border-dotted hover:bg-slate-50 bg-white">
                                <td className="py-1.5 px-6 font-semibold text-slate-800">{p.nomeCargo}</td>
                                <td className="py-1.5 px-6 text-center font-bold">{qty}</td>
                                <td className="py-1.5 px-6 text-right">{formatCurrency(custoUnitario)}</td>
                                <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">{formatCurrency(totalLinha)}</td>
                              </tr>
                            );
                          })}
                          
                          {/* Total Função */}
                          <tr className="bg-[#3b8026] text-white font-bold border-y border-[#2d631d] text-[9.5px]">
                            <td colSpan={3} className="py-1.5 px-6 text-right uppercase">Total Função</td>
                            <td className="py-1.5 px-6 text-right border-l border-emerald-800">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.remuneracao || 0) * i.quantidade), 0) || 0)}
                            </td>
                          </tr>

                          {/* Encargos e Outros */}
                          {(() => {
                            const isSpot = fullProposta.cliente?.tipoProposta === 'SPOT' || fullProposta.tipoItem === 'SPOT' || versao?.resultado?.items?.some((i: any) => i.tipoItem === 'SPOT');
                            if (isSpot) return null;
                            return (
                              <>
                                <tr className="border-b border-slate-200 border-dotted bg-white">
                                  <td className="py-1.5 px-6 font-bold">2) Encargos Sociais</td>
                                  <td className="py-1.5 px-6 text-center font-bold">{totalGeralEncargos.toFixed(2)}%</td>
                                  <td className="py-1.5 px-6 text-right">-</td>
                                  <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">
                                    {formatCurrency(versao?.resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.encargos || 0) * i.quantidade), 0) || 0)}
                                  </td>
                                </tr>
                                <tr className="border-b border-slate-200 border-dotted bg-white">
                                  <td className="py-1.5 px-6 font-bold">3) Outros (Especificar)</td>
                                  <td className="py-1.5 px-6 text-center font-bold">-</td>
                                  <td className="py-1.5 px-6 text-right">-</td>
                                  <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">{formatCurrency(0)}</td>
                                </tr>
                              </>
                            );
                          })()}
                          
                          {/* Total Montante A */}
                          <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white text-[9.5px]">
                            <td colSpan={3} className="py-2 px-6 text-right uppercase tracking-wider">Total do Montante "A" (Bloco A)</td>
                            <td className="py-2 px-6 text-right border-l border-emerald-950">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.blocoA || 0) * i.quantidade), 0) || 0)}
                            </td>
                          </tr>

                          {/* MONTANTE B */}
                          <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                            <th colSpan={4} className="py-2 px-6 text-center uppercase tracking-widest font-black text-[9.5px]">Montante "B" - Insumos</th>
                          </tr>
                          {(() => {
                            const isSpot = fullProposta.cliente?.tipoProposta === 'SPOT' || fullProposta.tipoItem === 'SPOT' || versao?.resultado?.items?.some((i: any) => i.tipoItem === 'SPOT');
                            
                            const b = versao?.resultado?.items?.reduce((acc: any, i: any) => {
                              const d = i.detalhes?.detalheBlocoB;
                              return {
                                ativos: acc.ativos + (i.detalhes?.ativos || 0) * i.quantidade,
                                materiais: acc.materiais + (d?.materiais || 0) * i.quantidade,
                                maquinas: acc.maquinas + (d?.maquinas || 0) * i.quantidade,
                                descartaveis: acc.descartaveis + (d?.descartaveis || 0) * i.quantidade,
                                servicos: acc.servicos + (d?.servicos || 0) * i.quantidade,
                              };
                            }, { ativos: 0, materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0 }) || { ativos: 0, materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0 };

                            const rawRows = [
                              ...(!isSpot ? [{ label: "Uniformes e EPI's", val: b.ativos }] : []),
                              { label: 'Materiais e produtos de limpeza', val: fullProposta.insumos?.materiais || 0 },
                              { label: 'Máquinas e equipamentos', val: fullProposta.insumos?.maquinas || 0 },
                              { label: 'Descartáveis', val: fullProposta.insumos?.descartaveis || 0 },
                              { label: 'Serviços (Descriminar)', val: fullProposta.insumos?.servicos || 0 },
                            ];

                            const rows = rawRows.map((r, idx) => ({
                              label: `${idx + 1}) ${r.label}`,
                              val: r.val
                            }));

                            const totalB = b.ativos + (fullProposta.insumos?.materiais || 0) + (fullProposta.insumos?.maquinas || 0) + (fullProposta.insumos?.descartaveis || 0) + (fullProposta.insumos?.servicos || 0);

                            return (
                              <>
                                {rows.map((row, i) => (
                                  <tr key={i} className="border-b border-slate-200 border-dotted bg-white">
                                    <td colSpan={3} className="py-1.5 px-6 font-bold">{row.label}</td>
                                    <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">{formatCurrency(row.val)}</td>
                                  </tr>
                                ))}
                                {/* Total Montante B */}
                                <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white text-[9.5px]">
                                  <td colSpan={3} className="py-2 px-6 text-right uppercase tracking-wider">Total do Montante "B"</td>
                                  <td className="py-2 px-6 text-right border-l border-emerald-950">
                                    {formatCurrency(totalB)}
                                  </td>
                                </tr>
                              </>
                            );
                          })()}

                          {/* MONTANTE C */}
                          {(() => {
                            const isSpot = fullProposta.cliente?.tipoProposta === 'SPOT' || fullProposta.tipoItem === 'SPOT' || versao?.resultado?.items?.some((i: any) => i.tipoItem === 'SPOT');
                            if (isSpot) return null;

                            const bC = versao?.resultado?.items?.reduce((acc: any, i: any) => {
                              const d = i.detalhes?.detalheBlocoC;
                              return {
                                va: acc.va + (d?.va || 0) * i.quantidade,
                                vt: acc.vt + (d?.vt || 0) * i.quantidade,
                                custosSindicato: acc.custosSindicato + (d?.custosSindicato || 0) * i.quantidade,
                                vaFerias: acc.vaFerias + (d?.vaFerias || 0) * i.quantidade,
                                cestaBasica: acc.cestaBasica + (d?.cestaBasica || 0) * i.quantidade,
                                descontoVA: acc.descontoVA + (d?.descontoVA || 0) * i.quantidade,
                                descontoVT: acc.descontoVT + (d?.descontoVT || 0) * i.quantidade,
                                exames: acc.exames + (d?.exames || 0) * i.quantidade,
                                reservaTecnica: acc.reservaTecnica + (d?.reservaTecnica || 0) * i.quantidade,
                                reservaTecnicaPct: d?.reservaTecnicaPct || acc.reservaTecnicaPct,
                                manutencao: acc.manutencao + (d?.manutencao || 0) * i.quantidade,
                                manutencaoPct: d?.manutencaoPct || acc.manutencaoPct,
                                outros: acc.outros + (d?.outros || 0) * i.quantidade,
                              };
                            }, { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 }) || { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 };

                            const rows = [
                              { label: '1) Vale Alimentação', val: bC.va },
                              { label: '2) Vale Transporte', val: bC.vt },
                              { label: '3) Custos com Sindicatos', val: bC.custosSindicato },
                              { label: '4) Vale Alimentação Sobre Férias', val: bC.vaFerias },
                              { label: '5) Cesta Básica Assiduidade(+)', val: bC.cestaBasica },
                              { label: '6) Desconto de VA(-)', val: bC.descontoVA, red: true },
                              { label: '7) Desconto de VT(-)', val: bC.descontoVT, red: true },
                              { label: '8) Exames Médicos', val: bC.exames },
                              { label: '9) Reservas Técnicas', val: bC.reservaTecnica, pct: bC.reservaTecnicaPct },
                              { label: '10) Manutenção Equipamentos', val: bC.manutencao, pct: bC.manutencaoPct },
                              { label: '11) Outros (especificar)', val: bC.outros },
                            ];

                            const totalC = versao?.resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.beneficios || 0) * i.quantidade), 0) || 0;

                            return (
                              <>
                                <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                                  <th colSpan={4} className="py-2 px-6 text-center uppercase tracking-widest font-black text-[9.5px]">Montante "C" - Benefícios Detalhados (13 Itens)</th>
                                </tr>
                                {rows.map((row, i) => (
                                  <tr key={i} className="border-b border-slate-200 border-dotted bg-white">
                                    <td colSpan={row.pct !== undefined ? 2 : 3} className={`py-1.5 px-6 font-bold ${row.red ? "text-red-600" : ""}`}>{row.label}</td>
                                    {row.pct !== undefined && (
                                      <td className="py-1.5 px-6 text-center font-bold bg-slate-50 text-slate-500 w-24">
                                        {row.pct.toFixed(2)} %
                                      </td>
                                    )}
                                    <td className={`py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100 ${row.red ? "text-red-600 font-bold" : ""}`}>
                                      {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                    </td>
                                  </tr>
                                ))}
                                {/* Total Montante C */}
                                <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white text-[9.5px]">
                                  <td colSpan={3} className="py-2 px-6 text-right uppercase tracking-wider">Total do Montante "C"</td>
                                  <td className="py-2 px-6 text-right border-l border-emerald-950">
                                    {formatCurrency(totalC)}
                                  </td>
                                </tr>
                              </>
                            );
                          })()}

                          {/* MONTANTE D - BDI */}
                          <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                            <th colSpan={4} className="py-2 px-6 text-center uppercase tracking-widest font-black text-[9.5px]">Montante "D" - BDI</th>
                          </tr>
                          <tr className="border-b border-slate-200 border-dotted bg-white">
                            <td className="py-1.5 px-6 font-bold w-[50%]">Administração</td>
                            <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{(fullProposta.premissas?.taxaAdm || 0).toFixed(2)}%</td>
                            <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">
                              {formatCurrency(versao?.resultado?.taxaAdm || 0)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 border-dotted bg-white">
                            <td className="py-1.5 px-6 font-bold">Lucro</td>
                            <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{(fullProposta.premissas?.margemLucro || 0).toFixed(2)}%</td>
                            <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">
                              {formatCurrency(versao?.resultado?.margemLucro || 0)}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 border-dotted bg-white">
                            <td className="py-1.5 px-6 font-bold">Comissão do Vendedor</td>
                            <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{(fullProposta.premissas?.comissaoVendedor || 0).toFixed(2)}%</td>
                            <td className="py-1.5 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">
                              {formatCurrency(versao?.resultado?.comissaoVendedor || 0)}
                            </td>
                          </tr>
                          <tr className="bg-[#599e41] text-white font-bold border-y border-[#488234] text-[9.5px]">
                            <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total dos Montantes "A+B+C+D"</td>
                            <td className="py-2.5 px-6 text-right border-l border-[#3a692a]">
                              {formatCurrency((versao?.resultado?.custoDiretoTotal || 0) + (versao?.resultado?.taxaAdm || 0) + (versao?.resultado?.margemLucro || 0) + (versao?.resultado?.comissaoVendedor || 0))}
                            </td>
                          </tr>

                          {/* IMPOSTOS */}
                          {(() => {
                            const totalTributos = ((fullProposta.premissas?.tributos || []).reduce((acc: number, t: any) => acc + (t.percent || 0), 0));
                            return (
                              <>
                                <tr className="bg-[#8ec277] text-slate-900 border-b border-white text-[9.5px]">
                                  <td className="py-2 px-6 font-bold uppercase">Impostos</td>
                                  <td colSpan={2} className="py-2 px-6 text-center font-bold bg-slate-50/50">{totalTributos.toFixed(2)}%</td>
                                  <td className="py-2 px-6 text-right font-bold border-l border-[#7bb363]">{formatCurrency(versao?.resultado?.impostosTotais || 0)}</td>
                                </tr>
                                {(fullProposta.premissas?.tributos || []).map((t: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-200 border-dotted bg-white">
                                    <td className="py-1 px-6 font-bold">{t.nome}</td>
                                    <td colSpan={2} className="py-1 px-6 text-center font-bold bg-slate-50">{t.percent.toFixed(2)}%</td>
                                    <td className="py-1 px-6 text-right bg-emerald-100/30 font-semibold border-l border-slate-100">
                                      {formatCurrency((versao?.resultado?.faturamentoBruto || 0) * (t.percent / 100))}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            );
                          })()}

                          {/* TOTAIS FINAIS */}
                          <tr className="bg-[#1B4D3E] text-white font-black border-t-4 border-white text-xs tracking-widest uppercase">
                            <td colSpan={3} className="py-4 px-6 text-right">Total dos Montantes "A+B+C+D" + Impostos</td>
                            <td className="py-4 px-6 text-right text-emerald-400 border-l border-emerald-950 font-black text-sm">
                              {formatCurrency(versao?.resultado?.faturamentoBruto || doc.valorTotal || 0)}
                            </td>
                          </tr>
                          {(() => {
                            const isSpot = fullProposta.cliente?.tipoProposta === 'SPOT' || fullProposta.tipoItem === 'SPOT' || versao?.resultado?.items?.some((i: any) => i.tipoItem === 'SPOT');
                            if (isSpot) return null;
                            return (
                              <tr className="bg-black text-white font-black border-t border-slate-800 text-[10px] tracking-widest uppercase">
                                <td colSpan={3} className="py-3 px-6 text-right">Valor Total Anual do Contrato</td>
                                <td className="py-3 px-6 text-right text-emerald-500 border-l border-slate-900 font-bold">
                                  {formatCurrency((versao?.resultado?.faturamentoBruto || 0) * 12)}
                                </td>
                              </tr>
                            );
                          })()}

                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 9: Resumo e Formação do Preço */}
                {activeFpvTab === 'resumo' && (() => {
                  const fc = formatCurrency;
                  const divisorTributos = versao?.resultado?.divisor || 1;
                  const txAdm = (fullProposta.premissas?.taxaAdm || 0) / 100;
                  const txLucro = (fullProposta.premissas?.margemLucro || 0) / 100;

                  const normalizeText = (text: string) => {
                    if (!text) return "";
                    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
                  };

                  const isLocado = (desc: string) => {
                    if (!desc) return false;
                    const normalized = normalizeText(desc);
                    return normalized.includes('locado') || normalized.includes('locada') || normalized.includes('locacao') || normalized.includes('locaco') || normalized.includes('locação');
                  };

                  const detalheMaquinas = fullProposta.insumos?.detalheMaquinas || [];
                  const totalMaquinasLocadas = detalheMaquinas
                    .filter((item: any) => isLocado(item.descricao))
                    .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);
                  const totalMaquinasNaoLocadas = detalheMaquinas
                    .filter((item: any) => !isLocado(item.descricao))
                    .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

                  const isSpot = fullProposta.cliente?.tipoProposta === 'SPOT' || fullProposta.tipoItem === 'SPOT' || versao?.resultado?.items?.some((i: any) => i.tipoItem === 'SPOT');

                  // Função auxiliar para aplicar a cascata solicitada a um custo direto
                  const applyCascata = (custo: any) => {
                    const cD = Number(custo) || 0;
                    const comAdm = cD * (1 + txAdm);
                    const comLucro = comAdm * (1 + txLucro);
                    return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                  };

                  return (
                    <div className="space-y-8 animate-fadeIn">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                        <Info size={16} className="text-emerald-600" /> Resumo FPV e Preço Proposto
                      </h3>

                      {/* BLOCO 1: MÃO DE OBRA */}
                      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                        <div className="bg-[#1B4D3E] px-6 py-3.5 flex items-center gap-2">
                          <UserCheck size={16} className="text-emerald-300" />
                          <h2 className="text-[10px] font-black text-white uppercase tracking-widest">1) Mão de Obra — Quadro de Colaboradores</h2>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs text-slate-800">
                            <thead>
                              <tr className="bg-[#1B4D3E] text-white text-[9.5px] font-black uppercase border-t border-emerald-900 border-opacity-40">
                                <th className="px-6 py-2.5 w-16 text-center">Item</th>
                                <th className="px-6 py-2.5">Descrição — Mão de Obra</th>
                                <th className="px-6 py-2.5 text-center w-24">Qtd.</th>
                                <th className="px-6 py-2.5 text-right w-36">Preço Unit. Venda</th>
                                <th className="px-6 py-2.5 text-right w-40">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fullProposta.equipe.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic bg-white">
                                    Nenhum colaborador cadastrado nesta proposta.
                                  </td>
                                </tr>
                              ) : (
                                fullProposta.equipe.map((p: any, idx: number) => {
                                  const itemRes = versao?.resultado?.items?.find((x: any) => x.id === p.id);
                                  const precoVendaItem = itemRes?.precoVenda || 0;
                                  const isSpotItem = p.tipoItem === 'SPOT';
                                  const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                                  const precoUnitario = isSpotItem ? (precoVendaItem / qty) : (p.quantidade > 0 ? precoVendaItem / p.quantidade : 0);
                                  return (
                                    <tr key={p.id} className={`border-b border-slate-200 border-dotted hover:bg-slate-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                      <td className="px-6 py-2 text-center font-bold text-slate-455">{idx + 1}</td>
                                      <td className="px-6 py-2 font-bold text-slate-700">{p.nomeCargo}</td>
                                      <td className="px-6 py-2 text-center font-black text-slate-800">{qty}</td>
                                      <td className="px-6 py-2 text-right font-medium text-slate-600">{fc(precoUnitario)}</td>
                                      <td className="px-6 py-2 text-right font-black bg-emerald-50/30 text-[#1B4D3E] border-l border-slate-100">{fc(precoVendaItem)}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="bg-[#1B4D3E] text-white font-black text-[9.5px]">
                                <td colSpan={4} className="px-6 py-3.5 text-right uppercase tracking-wider">Subtotal Mão de Obra (Preço de Venda Final)</td>
                                <td className="px-6 py-3.5 text-right text-emerald-400 border-l border-emerald-950 font-black">
                                  {fc(versao?.resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* BLOCO 2: INSUMOS */}
                      <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                        <div className="bg-slate-700 px-6 py-3.5 flex items-center gap-2">
                          <ClipboardList size={16} className="text-slate-350" />
                          <h2 className="text-[10px] font-black text-white uppercase tracking-widest">2) Materiais, Equipamentos e Insumos</h2>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs text-slate-800">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 text-[9.5px] font-black uppercase border-b border-slate-200">
                                <th className="px-6 py-2.5 w-16 text-center">Item</th>
                                <th className="px-6 py-2.5">Descrição</th>
                                <th className="px-6 py-2.5 text-right w-48">Preço de Venda (R$)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-200 border-dotted hover:bg-slate-50/50 bg-white">
                                <td className="px-6 py-2.5 text-center font-bold text-slate-455">2</td>
                                <td className="px-6 py-2.5 font-bold text-slate-700">Materiais e produtos de limpeza</td>
                                <td className="px-6 py-2.5 text-right font-black text-slate-800 bg-emerald-50/10">{fc(applyCascata(fullProposta.insumos?.materiais))}</td>
                              </tr>
                              <tr className="border-b border-slate-200 border-dotted hover:bg-slate-50/50 bg-white">
                                <td className="px-6 py-2.5 text-center font-bold text-slate-455">3</td>
                                <td className="px-6 py-2.5 font-bold text-slate-700">Máquinas e equipamentos</td>
                                <td className="px-6 py-2.5 text-right font-black text-slate-800 bg-emerald-50/10">{fc(applyCascata(isSpot ? totalMaquinasNaoLocadas : fullProposta.insumos?.maquinas))}</td>
                              </tr>
                              <tr className="border-b border-slate-200 border-dotted hover:bg-slate-50/50 bg-white">
                                <td className="px-6 py-2.5 text-center font-bold text-slate-455">4</td>
                                <td className="px-6 py-2.5 font-bold text-slate-700">Descartáveis</td>
                                <td className="px-6 py-2.5 text-right font-black text-slate-800 bg-emerald-50/10">{fc(applyCascata(fullProposta.insumos?.descartaveis))}</td>
                              </tr>
                              <tr className="border-b border-slate-200 border-dotted hover:bg-slate-50/50 bg-white">
                                <td className="px-6 py-2.5 text-center font-bold text-slate-455">5</td>
                                <td className="px-6 py-2.5 font-bold text-slate-700 border-b border-slate-200">
                                  {isSpot ? 'Equipamentos Locados' : `Serviços ${fullProposta.insumos?.servicosDescricao ? `(${fullProposta.insumos?.servicosDescricao})` : ''}`}
                                </td>
                                <td className="px-6 py-2.5 text-right font-black text-slate-800 bg-emerald-50/10">
                                  {fc(applyCascata(isSpot ? totalMaquinasLocadas : fullProposta.insumos?.servicos))}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-700 text-white font-black text-[9.5px]">
                                <td colSpan={2} className="px-6 py-3.5 text-right uppercase tracking-wider">Subtotal Materiais e Insumos (Preço de Venda Final)</td>
                                <td className="px-6 py-3.5 text-right text-emerald-400 border-l border-slate-800 font-black">
                                  {fc(applyCascata(
                                    Number(fullProposta.insumos?.materiais || 0) + 
                                    Number(isSpot ? (totalMaquinasNaoLocadas + totalMaquinasLocadas) : fullProposta.insumos?.maquinas || 0) + 
                                    Number(fullProposta.insumos?.descartaveis || 0) + 
                                    Number(isSpot ? 0 : fullProposta.insumos?.servicos || 0)
                                  ))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* BLOCO TOTAL GERAL */}
                      <div className="bg-[#1B4D3E] p-8 rounded-none border-t-4 border-emerald-400 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-lg">
                        <div className="text-white text-left">
                          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-300 mb-1">Total Geral da Proposta</h3>
                          <p className="text-[10px] font-bold text-emerald-100/60 uppercase">Mão de Obra + Insumos Globais — Valor Final de Venda</p>
                        </div>
                        <div className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tighter">
                          {fc(versao?.resultado?.faturamentoBruto || doc.valorTotal || 0)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* 4. ABA: MINUTA DO CONTRATO DINÂMICA */}
          {activeClientTab === 'minuta' && (
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-950/20 text-slate-800 animate-fadeIn relative">
              
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2 border-b border-slate-100 pb-3">
                ⚖️ Minuta Padrão de Contrato
              </h3>

              {loadingMinuta ? (
                <div className="py-20 text-center text-slate-400 font-bold uppercase animate-pulse">
                  Processando minuta de contrato...
                </div>
              ) : minutaClausulas.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">
                  Nenhuma minuta vinculada ou cadastrada para esta proposta.
                </div>
              ) : (
                <div className="space-y-8 max-w-4xl mx-auto leading-relaxed text-slate-800 text-sm">
                  
                  {/* CABEÇALHO DA MINUTA */}
                  <div className="text-center space-y-4 mb-8">
                    <h4 className="font-extrabold uppercase text-lg tracking-wide border-b pb-4">
                      MINUTA DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS
                    </h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      DOCUMENTO DE AUDITORIA INTERNA · NÃO ASSINADO
                    </p>
                  </div>

                  {/* CLAUSULAS */}
                  <div className="space-y-6">
                    {minutaClausulas.map((c: any, index: number) => (
                      <div key={c.id || index} className="space-y-2">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider">
                          {c.titulo}
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line text-xs font-semibold leading-relaxed">
                          {c.texto}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ASSINATURAS MOCK NA MINUTA */}
                  <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                    <div className="space-y-4">
                      <div className="h-10 border-b border-slate-400" />
                      <div>
                        <div className="font-black text-slate-800 uppercase">
                          {doc.empresaEmissora?.razaoSocial || doc.empresaEmissora?.nomeFantasia}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          CONTRATADA (PROPONENTE)
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-10 border-b border-slate-400 flex items-center justify-center font-mono text-[9px] text-[#1B4D3E]">
                        {approved ? (
                          <span className="font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            ✓ Assinado Eletronicamente
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pendente de assinatura</span>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 uppercase">
                          {doc.client?.razaoSocial || doc.client?.nomeFantasia}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          CONTRATANTE (CLIENTE)
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* 5. ABA: HISTÓRICO E AJUSTES */}
          {activeClientTab === 'historico' && (
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-950/20 text-slate-800 animate-fadeIn relative">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2 border-b border-slate-100 pb-3">
                💬 Histórico de Negociações e Ajustes
              </h3>
              
              {(!doc.configApresentacao?.negotiations || doc.configApresentacao.negotiations.length === 0) ? (
                <div className="py-20 text-center text-slate-400 italic">
                  Nenhum registro de ajustes ou negociação encontrado.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 ml-3 max-w-2xl mx-auto py-4 text-left">
                  {doc.configApresentacao.negotiations.map((item: any) => {
                    const clientInitials = (item.nomeCliente || 'Cliente')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    const sellerAvatar = doc.proposta?.user?.avatarUrl;
                    const sellerInitials = (item.nomeVendedor || doc.proposta?.user?.nome || 'Consultor')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <div key={item.id} className="relative pb-2">
                        {/* Circle Node Icon */}
                        <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          item.tipo === 'recusa' ? 'border-red-500 bg-red-500 text-white' : 'border-[#1e4480] bg-[#1e4480] text-white'
                        }`}>
                          {item.tipo === 'recusa' ? '👎' : '💬'}
                        </div>

                        {/* Content Container */}
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                          
                          {/* CLIENT REQUEST HEADER WITH AVATAR */}
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm uppercase border border-blue-200 shadow-sm shrink-0">
                                {clientInitials}
                              </div>
                              <div>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded leading-none ${
                                  item.tipo === 'recusa' ? 'bg-red-105 text-red-700 font-bold border border-red-200' : 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                                }`}>
                                  {item.tipo === 'recusa' ? 'Recusa / Declínio' : 'Ajuste / Contraproposta'}
                                </span>
                                <span className="text-xs font-black text-slate-800 block mt-1.5 leading-tight">{item.nomeCliente || 'Cliente'}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider shrink-0">
                              {new Date(item.data).toLocaleString('pt-BR')}
                            </span>
                          </div>

                          <div className="pl-13">
                            <div className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line bg-white border border-slate-150 p-4 rounded-2xl rounded-tl-none shadow-inner">
                              {item.mensagem}
                            </div>
                          </div>

                          {/* SELLER RESPONSE WITH ACTUAL AVATAR PICTURE */}
                          {item.respondida ? (
                            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-3">
                                  {sellerAvatar ? (
                                    <img 
                                      src={sellerAvatar} 
                                      alt={item.nomeVendedor || 'Consultor'} 
                                      className="w-10 h-10 rounded-full object-cover border border-emerald-205 shadow-sm shrink-0 animate-fadeIn"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm uppercase border border-emerald-200 shadow-sm shrink-0">
                                      {sellerInitials}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider leading-none font-bold border border-emerald-200">
                                      ✓ Resposta do Consultor
                                    </span>
                                    <span className="text-xs font-black text-slate-800 block mt-1.5 leading-tight">{item.nomeVendedor || 'Consultor'}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-450 font-mono tracking-wider shrink-0">
                                  {new Date(item.dataResposta).toLocaleString('pt-BR')}
                                </span>
                              </div>

                              <div className="pl-13">
                                <div className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-line bg-emerald-50/20 border border-emerald-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                  {item.resposta}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic mt-2 font-medium pl-13 text-left">
                              Aguardando retorno do consultor responsável...
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </main>

      {/* Slide Deck printing engine wrapper */}
      {activeClientTab === 'apresentacao' && !hasCanva && (
        <div className="print-slide-deck-wrapper print:block hidden">
          <PropostaApresentacaoPrint 
            proposta={mergedProposta}
            resultado={versao?.resultado}
            empresaEmissora={doc.empresaEmissora}
          />
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE IMPRESSÃO */}
      {!(activeClientTab === 'apresentacao' && hasCanva) && (
        <button
          onClick={() => {
            window.print();
          }}
          className="fixed bottom-6 right-6 z-[99999] bg-[#1e4480] hover:bg-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 border border-white/10 print:hidden cursor-pointer animate-fadeIn"
          title="Salvar PDF / Imprimir"
        >
          <Printer size={20} />
        </button>
      )}

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fadeIn">
            
            <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> Aceite Eletrônico & Assinatura
              </h2>
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Preencha os dados e assine eletronicamente para fechar sua FPV comercial.
              </p>

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="Nome do assinante" 
                    value={signerNome}
                    onChange={(e) => {
                      setSignerNome(e.target.value);
                      if (signatureMode === 'type') {
                        drawCursiveSignature(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CPF ou CNPJ</label>
                    <input 
                      type="text" 
                      placeholder="000.000.000-00" 
                      value={signerCpf}
                      onChange={(e) => setSignerCpf(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">E-mail</label>
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Canvas Pad */}
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMode('draw');
                        const canvas = canvasRef.current;
                        if (canvas) {
                          const ctx = canvas.getContext('2d');
                          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                      }}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        signatureMode === 'draw' ? 'bg-white text-[#1B4D3E] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ✍️ Desenhar com Mouse/Dedo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureMode('type');
                        drawCursiveSignature(signerNome);
                      }}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        signatureMode === 'type' ? 'bg-white text-[#1B4D3E] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ⌨️ Simular Assinatura Digital
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      {signatureMode === 'draw' ? "Assine com o mouse/dedo abaixo" : "Assinatura digital simulada abaixo"}
                    </label>
                    <button 
                      onClick={clearSignature}
                      className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                
                <canvas 
                  ref={canvasRef}
                  width={440}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-crosshair touch-none"
                />
              </div>

              {/* Metadata */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>IP de Assinatura:</span>
                <span className="font-mono text-slate-600">{signerIp}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  disabled={loading}
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  disabled={loading || !signerNome || !signerCpf || !signerEmail}
                  onClick={handleApprove}
                  className={`flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loading || !signerNome || !signerCpf || !signerEmail
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirmar Aceite
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AJUSTES / NEGOCIAÇÃO */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            
            <div className={`px-6 py-4 border-b flex justify-between items-center text-white ${
              negotiationType === 'decline' ? 'bg-red-700 border-red-800' : 'bg-[#1e4480] border-slate-800'
            }`}>
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Edit size={16} /> {negotiationType === 'decline' ? '👎 Declinar e Recusar Proposta' : '💬 Solicitar Ajustes ou Contraproposta'}
              </h2>
              <button 
                onClick={() => setShowNegotiationModal(false)}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-4 max-h-[85vh] overflow-y-auto flex flex-col scrollbar-thin">
              
              {/* HISTÓRICO DE NEGOCIAÇÃO COMPLETO DENTRO DO CHAT DE RESPOSTA */}
              {doc.configApresentacao?.negotiations && doc.configApresentacao.negotiations.length > 0 && (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 border-b border-slate-100 pb-4 mb-2 scrollbar-thin">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest text-left mb-2">Conversas Anteriores:</span>
                  {doc.configApresentacao.negotiations.map((item: any) => {
                    const clientInitials = (item.nomeCliente || 'Cliente')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    const sellerAvatar = doc.proposta?.user?.avatarUrl;
                    const sellerInitials = (item.nomeVendedor || doc.proposta?.user?.nome || 'Consultor')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <div key={item.id} className="space-y-3 text-left bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                        
                        {/* Cliente Avatar Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs uppercase border border-blue-200 shrink-0">
                              {clientInitials}
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">CLIENTE</span>
                              <span className="text-[11px] font-bold text-slate-800 mt-1 block leading-tight">{item.nomeCliente || 'Cliente'}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider shrink-0">
                            {new Date(item.data).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="pl-10">
                          <p className="text-[11px] font-semibold text-slate-700 leading-relaxed whitespace-pre-line bg-white border border-slate-100 p-3 rounded-xl shadow-inner">{item.mensagem}</p>
                        </div>

                        {/* Consultor Avatar Header */}
                        {item.respondida && (
                          <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2">
                                {sellerAvatar ? (
                                  <img 
                                    src={sellerAvatar} 
                                    alt={item.nomeVendedor || 'Consultor'} 
                                    className="w-8 h-8 rounded-full object-cover border border-emerald-200 shrink-0 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs uppercase border border-emerald-200 shrink-0">
                                    {sellerInitials}
                                  </div>
                                )}
                                <div>
                                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none font-bold">✓ CONSULTOR COMERCIAL</span>
                                  <span className="text-[11px] font-bold text-slate-800 mt-1 block leading-tight">{item.nomeVendedor || 'Consultor'}</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-450 font-mono tracking-wider shrink-0">
                                {new Date(item.dataResposta).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="pl-10">
                              <p className="text-[11px] font-medium text-slate-650 leading-relaxed whitespace-pre-line bg-emerald-50/20 border border-emerald-100 p-3 rounded-xl shadow-sm">{item.resposta}</p>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-[10px] text-slate-500 font-semibold uppercase leading-relaxed text-left">
                {negotiationType === 'decline' 
                  ? 'Descreva a justificativa para recusar/declinar esta proposta comercial. O consultor responsável receberá sua resposta instantaneamente via WhatsApp.'
                  : 'Descreva as alterações, ajustes de premissas ou dúvidas que você possui sobre a proposta. O consultor responsável receberá sua mensagem instantaneamente.'
                }
              </p>

              <textarea 
                rows={5}
                placeholder="Digite suas considerações..." 
                value={negotiationText}
                onChange={(e) => setNegotiationText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1e4480] resize-none"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowNegotiationModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!negotiationText.trim()}
                  onClick={handleSendNegotiation}
                  className={`flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !negotiationText.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      : 'bg-[#1e4480] hover:bg-slate-800 shadow-slate-500/20 active:scale-[0.98]'
                  }`}
                >
                  {negotiationType === 'decline' ? 'Recusar Proposta ⚠️' : 'Enviar Mensagem'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM ALERT DIALOG */}
      {alertState && (
        <div className="fixed inset-0 bg-black/60 z-[1000000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-150 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            {alertState.type === 'success' && (
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm shrink-0 animate-bounce">
                <CheckCircle2 size={32} className="stroke-[3]" />
              </div>
            )}

            {alertState.type === 'error' && (
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm shrink-0 animate-bounce">
                <X size={32} className="stroke-[3]" />
              </div>
            )}

            {(alertState.type === 'warning' || alertState.type === 'info') && (
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-100 shadow-sm shrink-0">
                <AlertTriangle size={32} className="stroke-[3]" />
              </div>
            )}

            <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wider">
              {alertState.title}
            </h3>
            
            <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[280px]">
              {alertState.message}
            </p>

            <button
              onClick={() => {
                const onConfirm = alertState.onConfirm;
                setAlertState(null);
                if (onConfirm) onConfirm();
              }}
              className="w-full mt-6 py-3.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all active:translate-y-0.5 transform cursor-pointer text-center"
            >
              Entendi
            </button>

          </div>
        </div>
      )}

    </div>
  </div>
  );
}
