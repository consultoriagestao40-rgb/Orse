'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Paperclip,
  Presentation,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { buildExecutiveProposalUrl } from '@/lib/proposal-share';

interface ClientTrackingModalProps {
  doc: any;
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
}

const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#47505B',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
  orange: '#EA580C',
  amberSoft: '#FBF6EA',
  amberInk: '#6B4E12',
};

const MENU_DEFINITIONS: Array<{
  id: string;
  shortLabel: string;
  label: string;
  description: string;
  core?: boolean;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}> = [
  {
    id: 'apresentacao',
    shortLabel: 'Apresentação',
    label: 'Apresentação institucional',
    description: 'Slides executivos e credenciais da empresa',
    core: true,
    icon: Presentation,
  },
  {
    id: 'proposta',
    shortLabel: 'Proposta A4',
    label: 'Proposta comercial (A4)',
    description: 'Carta comercial, escopo de serviços e condições',
    core: true,
    icon: FileText,
  },
  {
    id: 'fpv',
    shortLabel: 'Planilha FPV',
    label: 'Planilha de custos (FPV)',
    description: 'Salários, encargos da CCT, benefícios e insumos',
    core: true,
    icon: FileSpreadsheet,
  },
  {
    id: 'minuta',
    shortLabel: 'Minuta',
    label: 'Minuta de contrato',
    description: 'Cláusulas jurídicas, vigência e reajuste anual',
    core: true,
    icon: Lock,
  },
  {
    id: 'video',
    shortLabel: 'Vídeo',
    label: 'Vídeo de apresentação',
    description: 'Explicação gravada pelo consultor comercial',
    icon: Video,
  },
  {
    id: 'fotos',
    shortLabel: 'Fotos',
    label: 'Galeria operacional',
    description: 'Fotos de equipes, uniformes e equipamentos',
    icon: ImageIcon,
  },
  {
    id: 'documentos',
    shortLabel: 'Anexos',
    label: 'Documentos e certidões',
    description: 'Anexos técnicos, licenças e regularidade fiscal',
    icon: Paperclip,
  },
  {
    id: 'faq',
    shortLabel: 'Dúvidas (FAQ)',
    label: 'Dúvidas frequentes (FAQ)',
    description: 'Perguntas e respostas sobre implantação e operação',
    icon: HelpCircle,
  },
  {
    id: 'historico',
    shortLabel: 'Negociação',
    label: 'Ajustes e negociação',
    description: 'Histórico de contrapropostas e respostas',
    icon: MessageSquare,
  },
];

function formatEditorialName(raw?: string | null): string {
  const str = (raw || '').trim();
  if (!str) return '';
  if (str !== str.toUpperCase()) return str;
  const lowerWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'por']);
  const keepUpper = new Set([
    'JVS', 'SP', 'PR', 'RJ', 'MG', 'SC', 'RS', 'BA', 'GO', 'DF', 'ES', 'PE', 'CE',
    'S/A', 'SA', 'ME', 'EPP', 'FPV', 'RH', 'TI',
  ]);
  return str
    .split(/\s+/)
    .map((w, idx) => {
      const clean = w.replace(/[^A-Za-zÀ-ÿ0-9/]/g, '');
      if (keepUpper.has(clean.toUpperCase())) return w.toUpperCase();
      const lw = w.toLowerCase();
      if (lw === 'ltda' || lw === 'ltda.') return 'Ltda';
      if (idx > 0 && lowerWords.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(' ');
}

function fmtDateTime(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtShortDate(d: any): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtRelativeTime(d: any): { text: string; isRecent: boolean } {
  if (!d) return { text: 'Sem abertura', isRecent: false };
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return { text: 'Sem abertura', isRecent: false };
  const diffMs = Date.now() - dt.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return { text: 'Agora mesmo', isRecent: true };
  if (mins < 60) return { text: `Há ${mins} min`, isRecent: true };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { text: `Há ${hours}h`, isRecent: hours <= 3 };
  const days = Math.floor(hours / 24);
  if (days === 1) return { text: 'Ontem', isRecent: false };
  if (days < 30) return { text: `Há ${days} dias`, isRecent: false };
  return { text: fmtShortDate(dt), isRecent: false };
}

/** Constrói arco SVG no sentido horário a partir do topo (-90deg) */
function describeClockwiseArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const span = Math.max(0, Math.min(359.99, endDeg - startDeg));
  if (span <= 0.01) return '';
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = ((startDeg + span) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function NegotiationItem({
  item,
  doc,
  onRefresh,
}: {
  item: any;
  doc: any;
  onRefresh?: () => void | Promise<void>;
}) {
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    setFeedback(null);
    try {
      const { responderAjusteAction } = await import('@/app/propostas-comerciais/actions');
      const res = await responderAjusteAction(doc.id, item.id, replyText);
      if (res.success) {
        setReplyText('');
        setFeedback({ ok: true, text: 'Resposta enviada e publicada na proposta do cliente.' });
        if (onRefresh) await onRefresh();
      } else {
        setFeedback({ ok: false, text: res.error || 'Não foi possível registrar a resposta.' });
      }
    } catch (err: any) {
      setFeedback({ ok: false, text: err?.message || 'Erro inesperado ao responder.' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const clientName = formatEditorialName(item.nomeCliente || 'Cliente');
  const sellerName = formatEditorialName(
    item.nomeVendedor || doc.proposta?.user?.nome || doc.usuario || 'Consultor'
  );
  const isDecline = item.tipo === 'recusa';

  return (
    <div
      className="rounded-2xl border bg-white p-5 space-y-4"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
            style={
              isDecline
                ? { backgroundColor: '#FEF2F2', color: '#B91C1C' }
                : { backgroundColor: C.amberSoft, color: C.amberInk }
            }
          >
            {isDecline ? 'Declínio registrado' : 'Solicitação de ajuste'}
          </span>
          <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
            {clientName}
          </p>
        </div>
        <span className="text-[12px] tabular-nums shrink-0" style={{ color: C.muted }}>
          {fmtDateTime(item.data)}
        </span>
      </div>

      <div
        className="rounded-xl p-3.5 text-[13.5px] leading-relaxed whitespace-pre-line border"
        style={{ backgroundColor: C.paper, borderColor: C.line, color: C.ink }}
      >
        {item.mensagem}
      </div>

      {item.respondida ? (
        <div className="pt-3 border-t space-y-2" style={{ borderColor: C.line }}>
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <span className="font-semibold" style={{ color: C.green }}>
              ✓ Respondido por {sellerName}
            </span>
            <span className="tabular-nums" style={{ color: C.muted }}>
              {fmtDateTime(item.dataResposta)}
            </span>
          </div>
          <div
            className="rounded-xl p-3.5 text-[13px] leading-relaxed whitespace-pre-line"
            style={{ backgroundColor: C.greenSoft, color: C.ink }}
          >
            {item.resposta}
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t space-y-3" style={{ borderColor: C.line }}>
          <label className="block text-[12.5px] font-medium" style={{ color: C.muted }}>
            Responder como <strong style={{ color: C.ink }}>{sellerName}</strong>
          </label>
          <textarea
            rows={3}
            placeholder="Escreva o retorno ou condição comercial revisada para o cliente..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] outline-none resize-none transition-colors focus:bg-white"
            style={{ backgroundColor: C.paper, borderColor: C.line, color: C.ink }}
          />
          {feedback && (
            <p
              className="text-[12.5px] font-medium"
              style={{ color: feedback.ok ? C.green : '#B91C1C' }}
            >
              {feedback.text}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!replyText.trim() || submittingReply}
              onClick={handleSendReply}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: C.green }}
            >
              {submittingReply ? 'Enviando...' : 'Enviar resposta ao cliente'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RadarNode {
  id: string;
  shortLabel: string;
  fullLabel: string;
  description: string;
  kind: 'milestone' | 'menu' | 'decision';
  reached: boolean;
  rejected?: boolean;
  count: number;
  firstAt?: string | null;
  lastAt?: string | null;
  visitorsNames: string[];
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export default function ClientTrackingModal({
  doc,
  onClose,
  onRefresh,
}: ClientTrackingModalProps) {
  const config = doc?.configApresentacao || {};
  const tracking = config.viewTracking || {
    firstSentAt: doc?.createdAt,
    views: {},
    history: [],
  };

  const views: Record<string, number> = tracking.views || {};
  const history: Array<{
    tab: string;
    viewedAt: string;
    nome?: string;
    cnpjOuEmail?: string;
  }> = Array.isArray(tracking.history) ? tracking.history : [];

  const negotiations: any[] = Array.isArray(config.negotiations) ? config.negotiations : [];
  const pendingNegotiationsCount = negotiations.filter((n) => !n.respondida).length;

  const [rightPanelTab, setRightPanelTab] = useState<'feed' | 'negociacoes'>(
    pendingNegotiationsCount > 0 ? 'negociacoes' : 'feed'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && refreshRef.current) {
        Promise.resolve(refreshRef.current()).catch(() => {});
      }
    }, 20000);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      clearInterval(timer);
    };
  }, [onClose]);

  const handleManualRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const isApproved =
    doc?.statusAssinatura === 'ASSINADO' ||
    doc?.status?.toLowerCase() === 'aprovada' ||
    doc?.status?.toLowerCase() === 'aprovado' ||
    doc?.proposta?.status?.toLowerCase() === 'aprovada' ||
    doc?.proposta?.status?.toLowerCase() === 'aprovado';

  const isRejected =
    doc?.statusAssinatura === 'RECUSADO' ||
    doc?.status?.toLowerCase() === 'recusada' ||
    doc?.status?.toLowerCase() === 'recusado' ||
    doc?.proposta?.status?.toLowerCase() === 'recusada' ||
    doc?.proposta?.status?.toLowerCase() === 'recusado';

  // Suporta tanto objeto detalhado (getDocumentoPropostaById) quanto item leve da listagem (getDocumentosProposta)
  const numeroFpv = doc?.numeroFPV ?? doc?.proposta?.numero ?? 1;
  const versaoFpv = doc?.versaoFPV ?? doc?.proposta?.versoes?.[0]?.versao ?? 1;
  const codigoFpv = `FPV-${String(numeroFpv).padStart(3, '0')} · R${String(versaoFpv).padStart(2, '0')}`;
  const rawCliente =
    doc?.cliente && doc.cliente !== 'Sem Cliente'
      ? doc.cliente
      : doc?.client?.nomeFantasia || doc?.client?.razaoSocial || 'Cliente';
  const clienteNome = formatEditorialName(rawCliente);

  const valorProposta =
    Number(doc?.valor || 0) ||
    Number(doc?.valorTotal || 0) ||
    Number(doc?.proposta?.versoes?.find((v: any) => v.versao === versaoFpv)?.precoVenda || 0) ||
    Number(doc?.proposta?.versoes?.[0]?.precoVenda || 0);

  const valorFormatado =
    valorProposta > 0
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorProposta)
      : null;

  const publicUrl = buildExecutiveProposalUrl({
    docId: doc?.id || '',
    numeroFPV: numeroFpv,
    versaoFPV: versaoFpv,
    clienteNome,
  });

  const clientTabsCfg = config.clientTabs || {};

  // Menus da proposta habilitados no link ou com acessos > 0
  const menuStats = useMemo(() => {
    const getLastViewForTab = (tabId: string) => {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i]?.tab === tabId) return history[i].viewedAt;
      }
      return null;
    };
    const getFirstViewForTab = (tabId: string) => {
      const found = history.find((h) => h?.tab === tabId);
      return found ? found.viewedAt : null;
    };
    const getVisitorsForTab = (tabId: string) => {
      const names = new Set<string>();
      for (const h of history) {
        if (h?.tab === tabId && h.nome) {
          names.add(formatEditorialName(h.nome));
        }
      }
      return Array.from(names);
    };

    return MENU_DEFINITIONS.map((m) => {
      const countFromViews = Number(views[m.id] || 0);
      const countFromHistory = history.filter((h) => h?.tab === m.id).length;
      const count = Math.max(countFromViews, countFromHistory);

      const isEnabledInConfig =
        m.id === 'proposta'
          ? clientTabsCfg.proposta !== false
          : m.id === 'apresentacao'
          ? Boolean(clientTabsCfg.apresentacao)
          : m.id === 'fpv'
          ? Boolean(clientTabsCfg.fpv)
          : m.id === 'minuta'
          ? Boolean(clientTabsCfg.minuta)
          : m.id === 'video'
          ? Boolean(clientTabsCfg.video && config.videoUrl)
          : m.id === 'fotos'
          ? Boolean(clientTabsCfg.fotos)
          : m.id === 'documentos'
          ? Boolean(clientTabsCfg.documentos)
          : m.id === 'faq'
          ? Boolean(clientTabsCfg.faq)
          : negotiations.length > 0;

      return {
        ...m,
        count,
        isEnabled: isEnabledInConfig,
        firstViewedAt: getFirstViewForTab(m.id),
        lastViewedAt: getLastViewForTab(m.id),
        visitorsNames: getVisitorsForTab(m.id),
      };
    }).filter((m) => m.core || m.isEnabled || m.count > 0);
  }, [views, history, clientTabsCfg, config.videoUrl, negotiations.length]);

  const totalMenuViews = useMemo(() => {
    const sumViews = menuStats.reduce((acc, m) => acc + m.count, 0);
    return Math.max(sumViews, history.length);
  }, [menuStats, history.length]);

  const maxMenuCount = useMemo(
    () => Math.max(1, ...menuStats.map((m) => m.count)),
    [menuStats]
  );

  // Decisores identificados
  const visitors = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        nome: string;
        identificador: string;
        clicks: number;
        firstAt: string;
        lastAt: string;
        tabs: Set<string>;
      }
    >();

    for (const h of history) {
      const rawNome = (h.nome || '').trim();
      const rawId = (h.cnpjOuEmail || '').trim();
      const key = rawNome
        ? `${rawNome.toLowerCase()}|${rawId.toLowerCase()}`
        : '__visitante_direto__';
      const labelNome = rawNome ? formatEditorialName(rawNome) : 'Visitante com link direto';
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          nome: labelNome,
          identificador: rawId,
          clicks: 1,
          firstAt: h.viewedAt,
          lastAt: h.viewedAt,
          tabs: new Set([h.tab]),
        });
      } else {
        existing.clicks += 1;
        existing.lastAt = h.viewedAt;
        if (h.tab) existing.tabs.add(h.tab);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );
  }, [history]);

  const firstEvent = history[0] || null;
  const lastEvent = history.length > 0 ? history[history.length - 1] : null;
  const lastActivity = fmtRelativeTime(lastEvent?.viewedAt || doc?.dataAssinatura);
  const firstSentAt = config.linkCreatedAt || tracking.firstSentAt || doc?.createdAt;

  // =========================================================================
  // PONTOS DO RADAR CIRCULAR (Sentido horário a partir das 12h: -90°)
  // Ponto inicial (Enviada) -> Acesso Identificado -> Menus da Proposta -> Decisão
  // =========================================================================
  const radarNodes: RadarNode[] = useMemo(() => {
    const nodes: RadarNode[] = [
      {
        id: '__enviada',
        shortLabel: 'Proposta enviada',
        fullLabel: '1. Proposta gerada e enviada',
        description: 'Link executivo criado e disponibilizado para o cliente.',
        kind: 'milestone',
        reached: Boolean(firstSentAt),
        count: 1,
        firstAt: firstSentAt,
        lastAt: firstSentAt,
        visitorsNames: [],
        icon: Send,
      },
      {
        id: '__entrada',
        shortLabel: 'Acesso no link',
        fullLabel: '2. Entrada e identificação do decisor',
        description:
          visitors.length > 0
            ? `Acesso validado na tela de entrada por ${visitors.map((v) => v.nome).join(', ')}.`
            : 'Validação de CNPJ ou código de segurança na entrada da proposta.',
        kind: 'milestone',
        reached: totalMenuViews > 0 || isApproved || isRejected,
        count: visitors.length > 0 ? visitors.length : totalMenuViews > 0 ? 1 : 0,
        firstAt: firstEvent?.viewedAt || null,
        lastAt: lastEvent?.viewedAt || null,
        visitorsNames: visitors.map((v) => v.nome),
        icon: UserCheck,
      },
    ];

    // Cada menu da proposta vira um ponto real no círculo do Radar
    menuStats.forEach((m, i) => {
      nodes.push({
        id: m.id,
        shortLabel: m.shortLabel,
        fullLabel: `${i + 3}. ${m.label}`,
        description: m.description,
        kind: 'menu',
        reached: m.count > 0,
        count: m.count,
        firstAt: m.firstViewedAt,
        lastAt: m.lastViewedAt,
        visitorsNames: m.visitorsNames,
        icon: m.icon,
      });
    });

    // Ponto de fechamento do ciclo (360°)
    nodes.push({
      id: '__decisao',
      shortLabel: isRejected ? 'Declinada' : isApproved ? 'Aprovada' : 'Aceite final',
      fullLabel: isRejected
        ? `${nodes.length + 1}. Proposta declinada`
        : isApproved
        ? `${nodes.length + 1}. Proposta aprovada e assinada`
        : `${nodes.length + 1}. Aceite digital do cliente`,
      description: isApproved
        ? `Assinada eletronicamente${
            doc?.nomeAssinante ? ` por ${formatEditorialName(doc.nomeAssinante)}` : ''
          }${doc?.ipAssinante ? ` · IP ${doc.ipAssinante}` : ''}.`
        : isRejected
        ? 'O cliente registrou declínio nesta revisão.'
        : 'Etapa final de assinatura eletrônica e aprovação do contrato.',
      kind: 'decision',
      reached: isApproved || isRejected,
      rejected: isRejected,
      count: isApproved || isRejected ? 1 : negotiations.length,
      firstAt: doc?.dataAssinatura || null,
      lastAt: doc?.dataAssinatura || null,
      visitorsNames: doc?.nomeAssinante ? [formatEditorialName(doc.nomeAssinante)] : [],
      icon: ShieldCheck,
    });

    return nodes;
  }, [
    firstSentAt,
    visitors,
    totalMenuViews,
    isApproved,
    isRejected,
    firstEvent?.viewedAt,
    lastEvent?.viewedAt,
    menuStats,
    doc?.nomeAssinante,
    doc?.ipAssinante,
    doc?.dataAssinatura,
    negotiations.length,
  ]);

  // Último ponto visitado/alcançado pelo cliente para pulso ativo e seleção inicial
  const currentActiveNodeId = useMemo(() => {
    if (isApproved || isRejected) return '__decisao';
    if (lastEvent?.tab && radarNodes.some((n) => n.id === lastEvent.tab)) {
      return lastEvent.tab;
    }
    for (let i = radarNodes.length - 1; i >= 0; i--) {
      if (radarNodes[i].reached) return radarNodes[i].id;
    }
    return '__enviada';
  }, [isApproved, isRejected, lastEvent?.tab, radarNodes]);

  const effectiveSelectedNode = useMemo(() => {
    return (
      radarNodes.find((n) => n.id === (selectedNodeId || currentActiveNodeId)) || radarNodes[0]
    );
  }, [radarNodes, selectedNodeId, currentActiveNodeId]);

  const reachedNodesCount = radarNodes.filter((n) => n.reached).length;
  const radarCompletionPct = isApproved
    ? 100
    : Math.round((reachedNodesCount / radarNodes.length) * 100);

  // Geometria SVG do Radar Circular
  const CX = 340;
  const CY = 250;
  const R_OUTER = 166;
  const R_RINGS = [42, 84, 126, R_OUTER];

  const positionedNodes = useMemo(() => {
    const total = radarNodes.length;
    return radarNodes.map((node, index) => {
      const deg = -90 + (index * 360) / total;
      const rad = (deg * Math.PI) / 180;
      const x = CX + R_OUTER * Math.cos(rad);
      const y = CY + R_OUTER * Math.sin(rad);

      // Raio interno da mancha do Radar (proporcional ao nº de acessos em cada item)
      let intensityRatio = 0.08;
      if (node.reached) {
        if (node.kind === 'menu') {
          intensityRatio = 0.42 + 0.58 * Math.min(1, node.count / Math.max(2, maxMenuCount));
        } else {
          intensityRatio = 0.88;
        }
      }
      const rx = CX + R_OUTER * intensityRatio * Math.cos(rad);
      const ry = CY + R_OUTER * intensityRatio * Math.sin(rad);

      // Posição externa dos rótulos ao redor do círculo
      const labelRadius = R_OUTER + 34;
      const lx = CX + labelRadius * Math.cos(rad);
      const ly = CY + labelRadius * Math.sin(rad);
      const cosVal = Math.cos(rad);
      const textAnchor: 'start' | 'middle' | 'end' =
        cosVal > 0.28 ? 'start' : cosVal < -0.28 ? 'end' : 'middle';

      return {
        ...node,
        index,
        deg,
        x,
        y,
        rx,
        ry,
        lx,
        ly,
        textAnchor,
      };
    });
  }, [radarNodes, maxMenuCount]);

  // Índice máximo alcançado no círculo para preencher o caminho percorrido no arco externo
  const furthestReachedIndex = useMemo(() => {
    if (isApproved || isRejected) return positionedNodes.length - 1;
    let maxIdx = 0;
    positionedNodes.forEach((n, idx) => {
      if (n.reached && idx > maxIdx) maxIdx = idx;
    });
    return maxIdx;
  }, [positionedNodes, isApproved, isRejected]);

  const progressArcPath = useMemo(() => {
    if (positionedNodes.length < 2) return '';
    if (isApproved) {
      // Ciclo 100% fechado
      return describeClockwiseArc(CX, CY, R_OUTER, -90, 269.9);
    }
    if (furthestReachedIndex <= 0) return '';
    const endDeg = positionedNodes[furthestReachedIndex].deg;
    return describeClockwiseArc(CX, CY, R_OUTER, -90, endDeg);
  }, [positionedNodes, furthestReachedIndex, isApproved]);

  // Polígono interno do Radar (área sombreada ligando a intensidade de acessos nos eixos)
  const radarPolygonPoints = useMemo(() => {
    return positionedNodes.map((n) => `${n.rx.toFixed(1)},${n.ry.toFixed(1)}`).join(' ');
  }, [positionedNodes]);

  // Trilha real de navegação entre pontos (curvas internas conectando a sequência exata de cliques do cliente)
  const journeyTrailPaths = useMemo(() => {
    const seqIds: string[] = ['__enviada'];
    if (totalMenuViews > 0 || isApproved || isRejected) {
      seqIds.push('__entrada');
    }
    for (const h of history) {
      if (h?.tab && seqIds[seqIds.length - 1] !== h.tab) {
        seqIds.push(h.tab);
      }
    }
    if (isApproved || isRejected) {
      seqIds.push('__decisao');
    }

    const byId = new Map(positionedNodes.map((n) => [n.id, n]));
    const paths: string[] = [];
    for (let i = 0; i < seqIds.length - 1; i++) {
      const a = byId.get(seqIds[i]);
      const b = byId.get(seqIds[i + 1]);
      if (!a || !b || a.id === b.id) continue;
      // Curva suave puxada levemente ao centro do radar para mostrar o deslocamento entre os pontos
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const ctrlX = CX + (mx - CX) * 0.45;
      const ctrlY = CY + (my - CY) * 0.45;
      paths.push(
        `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
      );
    }
    return paths;
  }, [history, positionedNodes, totalMenuViews, isApproved, isRejected]);

  // Sinal comercial e recomendação automática
  const radarSignal = useMemo(() => {
    if (isApproved) {
      return {
        badge: 'Ciclo 100% concluído · Aprovada',
        badgeStyle: { backgroundColor: C.greenSoft, color: C.green },
        insight: `Proposta aprovada eletronicamente${
          doc?.nomeAssinante ? ` por ${formatEditorialName(doc.nomeAssinante)}` : ''
        }${doc?.ipAssinante ? ` (IP ${doc.ipAssinante})` : ''}. Ciclo completo no radar.`,
      };
    }
    if (isRejected) {
      return {
        badge: 'Proposta declinada',
        badgeStyle: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
        insight:
          'O cliente registrou declínio nesta versão. Consulte os detalhes na aba de ajustes ao lado.',
      };
    }
    if (pendingNegotiationsCount > 0) {
      return {
        badge: 'Atenção · Pedido de ajuste',
        badgeStyle: { backgroundColor: '#FFF7ED', color: '#C2410C' },
        insight: `O cliente enviou ${pendingNegotiationsCount} ${
          pendingNegotiationsCount === 1 ? 'solicitação de ajuste' : 'solicitações de ajuste'
        } aguardando resposta.`,
      };
    }
    if (totalMenuViews === 0) {
      return {
        badge: 'Aguardando 1º acesso no radar',
        badgeStyle: { backgroundColor: '#F3F1EB', color: C.muted },
        insight:
          'A proposta já está no ponto de partida (Enviada). Assim que o cliente abrir o link, os pontos e caminhos do radar vão se preenchendo em tempo real.',
      };
    }
    const fpvReads = views.fpv || 0;
    const minutaReads = views.minuta || 0;
    if (fpvReads >= 2 || minutaReads >= 2 || totalMenuViews >= 5) {
      const hotMenu =
        fpvReads >= minutaReads ? 'a planilha de custos (FPV)' : 'a minuta contratual';
      return {
        badge: 'Quente · Alta intenção',
        badgeStyle: { backgroundColor: '#FFF7ED', color: '#C2410C' },
        insight: `O cliente já percorreu ${reachedNodesCount} pontos do radar (${totalMenuViews} acessos totais) e revisitou ${hotMenu}. Excelente momento para ligar.`,
      };
    }
    return {
      badge: 'Em navegação no radar',
      badgeStyle: { backgroundColor: C.greenSoft, color: C.green },
      insight: `O cliente já percorreu ${reachedNodesCount} de ${radarNodes.length} pontos da jornada. Clique em qualquer ponto do círculo para inspecionar os acessos.`,
    };
  }, [
    isApproved,
    isRejected,
    pendingNegotiationsCount,
    totalMenuViews,
    views.fpv,
    views.minuta,
    reachedNodesCount,
    radarNodes.length,
    doc?.nomeAssinante,
    doc?.ipAssinante,
  ]);

  const validityLabel = useMemo(() => {
    if (!config.linkExpiresAt) return null;
    const exp = new Date(config.linkExpiresAt);
    if (Number.isNaN(exp.getTime())) return null;
    const diffDays = Math.ceil((exp.getTime() - Date.now()) / 86400000);
    if (diffDays < 0) return 'Link expirado';
    if (diffDays === 0) return 'Expira hoje';
    if (diffDays === 1) return 'Válido por 1 dia';
    return `Válido por ${diffDays} dias`;
  }, [config.linkExpiresAt]);

  const chronologicalFeed = useMemo(() => {
    const events: Array<{
      id: string;
      time: string;
      title: string;
      subtitle?: string;
      tone: 'green' | 'amber' | 'red' | 'neutral';
    }> = [];

    if (firstSentAt) {
      events.push({
        id: 'created',
        time: firstSentAt,
        title: 'Proposta gerada e link liberado',
        subtitle: codigoFpv,
        tone: 'neutral',
      });
    }

    history.forEach((h, idx) => {
      const menuDef = MENU_DEFINITIONS.find((m) => m.id === h.tab);
      const menuName = menuDef ? menuDef.label : h.tab;
      const person = h.nome ? formatEditorialName(h.nome) : 'Visitante do cliente';
      events.push({
        id: `h-${idx}-${h.viewedAt}`,
        time: h.viewedAt,
        title: `${person} acessou ${menuName}`,
        subtitle: h.cnpjOuEmail ? `Identificação: ${h.cnpjOuEmail}` : undefined,
        tone: 'green',
      });
    });

    negotiations.forEach((n, idx) => {
      const person = formatEditorialName(n.nomeCliente || 'Cliente');
      events.push({
        id: `neg-${n.id || idx}`,
        time: n.data,
        title:
          n.tipo === 'recusa'
            ? `${person} registrou declínio da proposta`
            : `${person} solicitou ajuste na proposta`,
        subtitle: n.mensagem,
        tone: n.tipo === 'recusa' ? 'red' : 'amber',
      });
      if (n.respondida && n.dataResposta) {
        events.push({
          id: `neg-reply-${n.id || idx}`,
          time: n.dataResposta,
          title: `Consultor respondeu à solicitação`,
          subtitle: n.resposta,
          tone: 'green',
        });
      }
    });

    if (isApproved && doc?.dataAssinatura) {
      events.push({
        id: 'approved',
        time: doc.dataAssinatura,
        title: `Proposta aprovada eletronicamente`,
        subtitle: [
          doc.nomeAssinante ? `Assinado por ${formatEditorialName(doc.nomeAssinante)}` : null,
          doc.cpfAssinante ? `Doc: ${doc.cpfAssinante}` : null,
          doc.ipAssinante ? `IP: ${doc.ipAssinante}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        tone: 'green',
      });
    }

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [
    firstSentAt,
    codigoFpv,
    history,
    negotiations,
    isApproved,
    doc?.dataAssinatura,
    doc?.nomeAssinante,
    doc?.cpfAssinante,
    doc?.ipAssinante,
  ]);

  const SelectedIcon = effectiveSelectedNode.icon;

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain antialiased selection:bg-[#1B4D3E] selection:text-white animate-in fade-in duration-200"
      style={{ backgroundColor: C.paper, color: C.ink }}
    >
      <style>{`
        @keyframes sb-radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .sb-radar-beam {
          transform-origin: ${CX}px ${CY}px;
          animation: sb-radar-sweep 12s linear infinite;
        }
      `}</style>

      {/* ================================================================== */}
      {/* HEADER FIXO EM TELA CHEIA                                          */}
      {/* ================================================================== */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(251, 250, 247, 0.92)',
          borderColor: C.line,
        }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors hover:bg-black/[0.03] cursor-pointer shrink-0"
              style={{ borderColor: C.line, backgroundColor: '#FFFFFF', color: C.ink }}
            >
              <ArrowLeft size={15} />
              <span>Voltar</span>
            </button>

            <div className="min-w-0 flex items-center gap-2.5">
              <span
                className="hidden sm:inline-flex w-7 h-7 rounded-md items-center justify-center shrink-0"
                style={{ backgroundColor: C.green }}
              >
                <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <h1
                  className="text-[15px] sm:text-[17px] font-bold truncate"
                  style={{ letterSpacing: '-0.02em', color: C.ink }}
                >
                  Radar da proposta · {clienteNome}
                </h1>
                <p className="text-[12px] truncate" style={{ color: C.muted }}>
                  {codigoFpv}
                  {valorFormatado ? ` · ${valorFormatado}` : ''}
                  {validityLabel ? ` · ${validityLabel}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-semibold"
              style={radarSignal.badgeStyle}
            >
              {!isApproved && !isRejected && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'currentColor' }}
                />
              )}
              {radarSignal.badge}
            </span>

            {onRefresh && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Atualizar radar agora"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors hover:bg-black/[0.03] cursor-pointer disabled:opacity-50"
                style={{ borderColor: C.line, backgroundColor: '#FFFFFF', color: C.ink }}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            )}

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-95"
              style={{ backgroundColor: C.green }}
            >
              <span className="hidden sm:inline">Ver proposta</span>
              <span className="sm:hidden">Abrir</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar radar"
              className="p-1.5 rounded-full hover:bg-black/[0.05] transition-colors cursor-pointer"
              style={{ color: C.muted }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* PALCO PRINCIPAL DO RADAR CIRCULAR                                  */}
      {/* ================================================================== */}
      <main className="max-w-[1320px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* -------------------------------------------------------------- */}
          {/* ESQUERDA (7 COL): O RADAR CIRCULAR COM PONTOS E CAMINHO VIVO   */}
          {/* -------------------------------------------------------------- */}
          <section
            className="lg:col-span-7 bg-white rounded-[24px] border p-5 sm:p-7 flex flex-col justify-between"
            style={{ borderColor: C.line }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                  Mapeamento circular da jornada e leitura
                </p>
                <h2
                  className="text-[19px] sm:text-[21px] font-bold mt-0.5"
                  style={{ letterSpacing: '-0.025em', color: C.ink }}
                >
                  Caminho percorrido na proposta
                </h2>
              </div>

              {/* Legenda enxuta */}
              <div className="flex items-center gap-3.5 text-[12px]" style={{ color: C.muted }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.green }} />
                  Percorrido
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.orange }} />
                  Ponto atual
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border"
                    style={{ borderColor: '#C9C4B8', backgroundColor: '#FFFFFF' }}
                  />
                  Pendente
                </span>
              </div>
            </div>

            {/* SVG DO RADAR CIRCULAR */}
            <div className="w-full flex items-center justify-center my-auto">
              <svg
                viewBox="0 0 680 500"
                className="w-full max-w-[660px] h-auto select-none overflow-visible"
                role="img"
                aria-label="Radar circular da jornada do cliente na proposta"
              >
                <defs>
                  <radialGradient id="sbRadarCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.10" />
                    <stop offset="70%" stopColor="#1B4D3E" stopOpacity="0.03" />
                    <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="sbRadarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Fundo sutil radial do radar */}
                <circle cx={CX} cy={CY} r={R_OUTER + 12} fill="url(#sbRadarCoreGlow)" />

                {/* Anéis concêntricos do radar */}
                {R_RINGS.map((r, idx) => (
                  <circle
                    key={r}
                    cx={CX}
                    cy={CY}
                    r={r}
                    fill="none"
                    stroke={idx === R_RINGS.length - 1 ? '#D8D3C8' : '#ECE9E1'}
                    strokeWidth={idx === R_RINGS.length - 1 ? 2 : 1}
                    strokeDasharray={idx === R_RINGS.length - 1 ? '4 5' : '2 4'}
                  />
                ))}

                {/* Eixos radiais ligando o centro a cada ponto da proposta */}
                {positionedNodes.map((node) => (
                  <line
                    key={`axis-${node.id}`}
                    x1={CX}
                    y1={CY}
                    x2={node.x}
                    y2={node.y}
                    stroke={node.reached ? 'rgba(27, 77, 62, 0.22)' : '#ECE9E1'}
                    strokeWidth={1}
                  />
                ))}

                {/* Feixe giratório suave de varredura do radar (enquanto proposta está aberta/ativa) */}
                {!isApproved && !isRejected && (
                  <g className="sb-radar-beam">
                    <path
                      d={describeClockwiseArc(CX, CY, R_OUTER, -90, -38) + ` L ${CX} ${CY} Z`}
                      fill="url(#sbRadarSweepGrad)"
                    />
                    <line
                      x1={CX}
                      y1={CY}
                      x2={CX}
                      y2={CY - R_OUTER}
                      stroke="#1B4D3E"
                      strokeOpacity="0.28"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* Mancha interna do Radar (expande conforme o nº de acessos em cada menu) */}
                <polygon
                  points={radarPolygonPoints}
                  fill="rgba(27, 77, 62, 0.13)"
                  stroke="#1B4D3E"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Trilhas internas curvas mostrando os saltos reais de navegação do cliente */}
                {journeyTrailPaths.map((dPath, i) => (
                  <path
                    key={`trail-${i}`}
                    d={dPath}
                    fill="none"
                    stroke="#1B4D3E"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                ))}

                {/* CAMINHO PERCORRIDO PREENCHIDO AO REDOR DO CÍRCULO */}
                {progressArcPath && (
                  <path
                    d={progressArcPath}
                    fill="none"
                    stroke={isRejected ? '#DC2626' : C.green}
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Centro do Radar (Bullseye com percentual do caminho percorrido) */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={46}
                  fill="#FFFFFF"
                  stroke={C.line}
                  strokeWidth="1.5"
                />
                <text
                  x={CX}
                  y={CY - 4}
                  textAnchor="middle"
                  fontSize="22"
                  fontWeight="800"
                  fill={isRejected ? '#DC2626' : C.ink}
                  style={{ letterSpacing: '-0.03em' }}
                >
                  {radarCompletionPct}%
                </text>
                <text
                  x={CX}
                  y={CY + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={C.muted}
                >
                  {reachedNodesCount}/{radarNodes.length} pontos
                </text>

                {/* PONTOS INTERATIVOS DE CADA ITEM DA PROPOSTA AO REDOR DO CÍRCULO */}
                {positionedNodes.map((node) => {
                  const isCurrent = node.id === currentActiveNodeId;
                  const isSelected = node.id === effectiveSelectedNode.id;
                  const dotFill = node.rejected
                    ? '#DC2626'
                    : isCurrent && !isApproved
                    ? C.orange
                    : node.reached
                    ? C.green
                    : '#FFFFFF';
                  const dotStroke = node.rejected
                    ? '#DC2626'
                    : isCurrent && !isApproved
                    ? C.orange
                    : node.reached
                    ? C.green
                    : '#C9C4B8';

                  const countLabel =
                    node.kind === 'menu'
                      ? `${node.count}x`
                      : node.id === '__entrada'
                      ? node.reached
                        ? `${Math.max(1, visitors.length)} dec.`
                        : '0x'
                      : node.id === '__decisao'
                      ? isApproved
                        ? 'Assinada'
                        : isRejected
                        ? 'Recusada'
                        : 'Pendente'
                      : 'OK';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      onMouseEnter={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer"
                    >
                      {/* Anel de seleção ou pulso do ponto atual */}
                      {(isCurrent || isSelected) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 22 : 20}
                          fill="none"
                          stroke={isCurrent && !isApproved ? C.orange : C.green}
                          strokeOpacity={isSelected ? 0.35 : 0.22}
                          strokeWidth={isSelected ? 3 : 2}
                        />
                      )}

                      {/* Ponto principal no círculo */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={14}
                        fill={dotFill}
                        stroke={dotStroke}
                        strokeWidth="2.5"
                      />

                      {/* Conteúdo interno do ponto (✓ ou número da ordem / acessos) */}
                      {node.reached ? (
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="800"
                          fill="#FFFFFF"
                        >
                          {node.kind === 'menu' ? `${node.count}x` : '✓'}
                        </text>
                      ) : (
                        <text
                          x={node.x}
                          y={node.y + 4}
                          textAnchor="middle"
                          fontSize="10.5"
                          fontWeight="700"
                          fill="#8B939E"
                        >
                          {node.index + 1}
                        </text>
                      )}

                      {/* Rótulo externo do item + contador */}
                      <text
                        x={node.lx}
                        y={node.ly - 3}
                        textAnchor={node.textAnchor}
                        fontSize="12.5"
                        fontWeight={node.reached || isSelected ? '700' : '600'}
                        fill={node.reached || isSelected ? C.ink : '#7A838E'}
                      >
                        {node.shortLabel}
                      </text>
                      <text
                        x={node.lx}
                        y={node.ly + 12}
                        textAnchor={node.textAnchor}
                        fontSize="11"
                        fontWeight="600"
                        fill={
                          node.reached
                            ? isCurrent && !isApproved
                              ? C.orange
                              : C.green
                            : '#9CA3AF'
                        }
                      >
                        {node.kind === 'menu'
                          ? node.count === 1
                            ? '1 acesso'
                            : `${node.count} acessos`
                          : countLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-[12px] text-center" style={{ color: C.muted }}>
              Passe o mouse ou clique em qualquer ponto do círculo para inspecionar detalhes à direita.
            </p>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* DIREITA (5 COL): INSPETOR DO PONTO + KPIS + INSIGHT COMERCIAL  */}
          {/* -------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            {/* Card Inspetor do Ponto Selecionado no Radar */}
            <section
              className="bg-white rounded-[24px] border p-5 sm:p-6 space-y-4"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: effectiveSelectedNode.reached ? C.greenSoft : '#F3F1EB',
                      color: effectiveSelectedNode.reached ? C.green : '#7A838E',
                    }}
                  >
                    <SelectedIcon size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-medium" style={{ color: C.muted }}>
                      Ponto selecionado no radar
                    </p>
                    <h3
                      className="text-[16.5px] font-bold truncate"
                      style={{ letterSpacing: '-0.02em', color: C.ink }}
                    >
                      {effectiveSelectedNode.fullLabel}
                    </h3>
                  </div>
                </div>

                <span
                  className="px-2.5 py-1 rounded-full text-[11.5px] font-bold shrink-0"
                  style={
                    effectiveSelectedNode.reached
                      ? { backgroundColor: C.greenSoft, color: C.green }
                      : { backgroundColor: '#F3F1EB', color: C.muted }
                  }
                >
                  {effectiveSelectedNode.kind === 'menu'
                    ? `${effectiveSelectedNode.count} ${
                        effectiveSelectedNode.count === 1 ? 'acesso' : 'acessos'
                      }`
                    : effectiveSelectedNode.reached
                    ? 'Concluído'
                    : 'Pendente'}
                </span>
              </div>

              <p className="text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
                {effectiveSelectedNode.description}
              </p>

              <div
                className="grid grid-cols-2 gap-3 pt-3 border-t text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <div>
                  <span className="block text-[11.5px]" style={{ color: C.muted }}>
                    Primeiro registro
                  </span>
                  <strong className="font-semibold tabular-nums" style={{ color: C.ink }}>
                    {effectiveSelectedNode.firstAt
                      ? fmtDateTime(effectiveSelectedNode.firstAt)
                      : 'Ainda não acessado'}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11.5px]" style={{ color: C.muted }}>
                    Último registro
                  </span>
                  <strong className="font-semibold tabular-nums" style={{ color: C.ink }}>
                    {effectiveSelectedNode.lastAt
                      ? fmtDateTime(effectiveSelectedNode.lastAt)
                      : '—'}
                  </strong>
                </div>
              </div>

              {effectiveSelectedNode.visitorsNames.length > 0 && (
                <div className="pt-2 border-t text-[12.5px]" style={{ borderColor: C.line }}>
                  <span style={{ color: C.muted }}>Acessado por: </span>
                  <strong className="font-semibold" style={{ color: C.ink }}>
                    {effectiveSelectedNode.visitorsNames.join(', ')}
                  </strong>
                </div>
              )}
            </section>

            {/* Grade 2x2 de KPIs rápidos */}
            <section
              className="grid grid-cols-2 gap-px rounded-[22px] overflow-hidden border"
              style={{ backgroundColor: C.line, borderColor: C.line }}
            >
              <div className="bg-white p-4 sm:p-5">
                <p className="text-[12px]" style={{ color: C.muted }}>
                  Acessos totais nos menus
                </p>
                <p
                  className="text-[30px] leading-none font-bold mt-1.5 tabular-nums"
                  style={{ letterSpacing: '-0.035em', color: C.ink }}
                >
                  {totalMenuViews}
                </p>
                <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>
                  {menuStats.filter((m) => m.count > 0).length} de {menuStats.length} menus abertos
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5">
                <p className="text-[12px]" style={{ color: C.muted }}>
                  Última atividade
                </p>
                <p
                  className="text-[22px] leading-tight font-bold mt-1.5 flex items-center gap-1.5"
                  style={{ letterSpacing: '-0.03em', color: C.ink }}
                >
                  {lastActivity.isRecent && (
                    <span
                      className="w-2 h-2 rounded-full animate-pulse shrink-0"
                      style={{ backgroundColor: C.green }}
                    />
                  )}
                  <span className="truncate">{lastActivity.text}</span>
                </p>
                <p className="text-[11.5px] mt-1.5 truncate" style={{ color: C.muted }}>
                  {lastEvent ? fmtShortDate(lastEvent.viewedAt) : 'Aguardando abertura'}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5">
                <p className="text-[12px]" style={{ color: C.muted }}>
                  Decisores mapeados
                </p>
                <p
                  className="text-[30px] leading-none font-bold mt-1.5 tabular-nums"
                  style={{ letterSpacing: '-0.035em', color: C.ink }}
                >
                  {visitors.length}
                </p>
                <p className="text-[11.5px] mt-1.5 truncate" style={{ color: C.muted }}>
                  {visitors.length > 0
                    ? visitors.map((v) => v.nome).join(', ')
                    : 'Nenhum identificado ainda'}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5">
                <p className="text-[12px]" style={{ color: C.muted }}>
                  Pontos percorridos
                </p>
                <p
                  className="text-[30px] leading-none font-bold mt-1.5 tabular-nums"
                  style={{ letterSpacing: '-0.035em', color: C.green }}
                >
                  {reachedNodesCount}/{radarNodes.length}
                </p>
                <p className="text-[11.5px] mt-1.5" style={{ color: C.muted }}>
                  {radarCompletionPct}% do ciclo completo
                </p>
              </div>
            </section>

            {/* Insight Comercial */}
            <div
              className="rounded-2xl px-4 py-3.5 text-[13px] leading-relaxed flex items-start gap-2.5 border"
              style={{
                backgroundColor: C.amberSoft,
                color: C.amberInk,
                borderColor: 'rgba(107, 78, 18, 0.14)',
              }}
            >
              <Eye size={16} className="mt-0.5 shrink-0" />
              <span>{radarSignal.insight}</span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* LINHA INFERIOR: DETALHE POR MENU + QUEM ACESSOU + LINHA DO TEMPO */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Esquerda (7 col): Ranking de acessos por menu + Decisores */}
          <div className="lg:col-span-7 space-y-6">
            <section
              className="bg-white rounded-[24px] border p-5 sm:p-7"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                  <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                    Volume de leitura por aba
                  </p>
                  <h3
                    className="text-[18px] font-bold mt-0.5"
                    style={{ letterSpacing: '-0.025em', color: C.ink }}
                  >
                    Número de acessos em cada menu
                  </h3>
                </div>
                <span className="text-[12px]" style={{ color: C.muted }}>
                  Acessos internos não contam
                </span>
              </div>

              <div className="space-y-4">
                {menuStats.map((menu) => {
                  const IconComp = menu.icon;
                  const pctBar =
                    menu.count > 0 ? Math.max(8, Math.round((menu.count / maxMenuCount) * 100)) : 0;

                  return (
                    <div
                      key={menu.id}
                      onClick={() => setSelectedNodeId(menu.id)}
                      className="space-y-2 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: menu.count > 0 ? C.greenSoft : '#F3F1EB',
                              color: menu.count > 0 ? C.green : '#7A838E',
                            }}
                          >
                            <IconComp size={15} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[14px] font-semibold truncate group-hover:underline"
                                style={{ color: C.ink }}
                              >
                                {menu.label}
                              </span>
                              {!menu.isEnabled && menu.count === 0 && (
                                <span
                                  className="text-[10.5px] px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: '#F3F1EB', color: C.muted }}
                                >
                                  Oculto no link
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] truncate" style={{ color: C.muted }}>
                              {menu.lastViewedAt
                                ? `Último acesso em ${fmtShortDate(menu.lastViewedAt)}`
                                : menu.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className="text-[16px] font-bold tabular-nums"
                            style={{ color: menu.count > 0 ? C.ink : '#9CA3AF' }}
                          >
                            {menu.count}x
                          </span>
                          <span
                            className="block text-[11.5px] tabular-nums"
                            style={{ color: C.muted }}
                          >
                            {menu.count === 1 ? '1 acesso' : `${menu.count} acessos`}
                          </span>
                        </div>
                      </div>

                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: '#EFEDE8' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pctBar}%`,
                            backgroundColor: C.green,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Decisores que entraram */}
            {visitors.length > 0 && (
              <section
                className="bg-white rounded-[24px] border p-5 sm:p-7"
                style={{ borderColor: C.line }}
              >
                <h3
                  className="text-[18px] font-bold mb-4"
                  style={{ letterSpacing: '-0.025em', color: C.ink }}
                >
                  Decisores identificados ({visitors.length})
                </h3>
                <div className="divide-y" style={{ borderColor: C.line }}>
                  {visitors.map((v) => {
                    const initials = v.nome
                      .split(/\s+/)
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={v.key}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
                        style={{ borderColor: C.line }}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-bold shrink-0"
                            style={{ backgroundColor: C.greenSoft, color: C.green }}
                          >
                            {initials || <UserCheck size={15} />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold truncate" style={{ color: C.ink }}>
                              {v.nome}
                            </p>
                            {v.identificador && (
                              <p className="text-[12.5px] truncate" style={{ color: C.muted }}>
                                {v.identificador}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className="text-[13.5px] font-bold tabular-nums block"
                            style={{ color: C.ink }}
                          >
                            {v.clicks} {v.clicks === 1 ? 'clique' : 'cliques'}
                          </span>
                          <span className="text-[11.5px] block" style={{ color: C.muted }}>
                            Último: {fmtShortDate(v.lastAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Direita (5 col): Linha do tempo e Ajustes */}
          <div className="lg:col-span-5">
            <section
              className="bg-white rounded-[24px] border p-5 sm:p-7"
              style={{ borderColor: C.line }}
            >
              <div
                className="grid grid-cols-2 p-1 rounded-xl mb-5"
                style={{ backgroundColor: '#F3F1EB' }}
              >
                <button
                  type="button"
                  onClick={() => setRightPanelTab('feed')}
                  className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                    rightPanelTab === 'feed' ? 'bg-white shadow-2xs' : 'hover:opacity-80'
                  }`}
                  style={{ color: rightPanelTab === 'feed' ? C.ink : C.muted }}
                >
                  Linha do tempo ({chronologicalFeed.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('negociacoes')}
                  className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all cursor-pointer relative ${
                    rightPanelTab === 'negociacoes' ? 'bg-white shadow-2xs' : 'hover:opacity-80'
                  }`}
                  style={{ color: rightPanelTab === 'negociacoes' ? C.ink : C.muted }}
                >
                  <span>Ajustes ({negotiations.length})</span>
                  {pendingNegotiationsCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10.5px] bg-orange-600 text-white">
                      {pendingNegotiationsCount}
                    </span>
                  )}
                </button>
              </div>

              {rightPanelTab === 'feed' ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {chronologicalFeed.length === 0 ? (
                    <p className="text-[13px] py-8 text-center" style={{ color: C.muted }}>
                      Nenhum evento registrado ainda.
                    </p>
                  ) : (
                    <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#E6E2DA]">
                      {chronologicalFeed.map((ev) => {
                        const dotStyle =
                          ev.tone === 'green'
                            ? { backgroundColor: C.green, borderColor: C.green }
                            : ev.tone === 'amber'
                            ? { backgroundColor: C.orange, borderColor: C.orange }
                            : ev.tone === 'red'
                            ? { backgroundColor: '#DC2626', borderColor: '#DC2626' }
                            : { backgroundColor: '#FFFFFF', borderColor: '#9CA3AF' };

                        return (
                          <div key={ev.id} className="relative">
                            <span
                              className="absolute -left-[20px] top-1.5 w-3 h-3 rounded-full border-2"
                              style={dotStyle}
                            />
                            <div className="space-y-0.5">
                              <div className="flex items-baseline justify-between gap-2">
                                <p
                                  className="text-[13.5px] font-semibold leading-snug"
                                  style={{ color: C.ink }}
                                >
                                  {ev.title}
                                </p>
                                <span
                                  className="text-[11.5px] tabular-nums shrink-0 inline-flex items-center gap-1"
                                  style={{ color: C.muted }}
                                >
                                  <Clock size={11} />
                                  {fmtShortDate(ev.time)}
                                </span>
                              </div>
                              {ev.subtitle && (
                                <p
                                  className="text-[12.5px] leading-relaxed line-clamp-3"
                                  style={{ color: C.muted }}
                                >
                                  {ev.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {negotiations.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed py-10 px-4 text-center space-y-1"
                      style={{ borderColor: C.line }}
                    >
                      <ShieldCheck size={22} className="mx-auto mb-1" style={{ color: C.green }} />
                      <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                        Nenhum pedido de ajuste até o momento
                      </p>
                      <p className="text-[12.5px]" style={{ color: C.muted }}>
                        Quando o cliente enviar dúvidas ou contrapropostas pela proposta, você poderá responder por aqui.
                      </p>
                    </div>
                  ) : (
                    negotiations.map((item: any) => (
                      <NegotiationItem
                        key={item.id}
                        item={item}
                        doc={doc}
                        onRefresh={onRefresh}
                      />
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
