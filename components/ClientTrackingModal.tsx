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
  ShieldAlert,
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
  amberSoft: '#FBF6EA',
  amberInk: '#6B4E12',
};

const MENU_DEFINITIONS: Array<{
  id: string;
  label: string;
  description: string;
  core?: boolean;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}> = [
  {
    id: 'apresentacao',
    label: 'Apresentação institucional',
    description: 'Slides executivos e credenciais da empresa',
    core: true,
    icon: Presentation,
  },
  {
    id: 'proposta',
    label: 'Proposta comercial (A4)',
    description: 'Carta comercial, escopo de serviços e condições',
    core: true,
    icon: FileText,
  },
  {
    id: 'fpv',
    label: 'Planilha de custos (FPV)',
    description: 'Salários, encargos da CCT, benefícios e insumos',
    core: true,
    icon: FileSpreadsheet,
  },
  {
    id: 'minuta',
    label: 'Minuta de contrato',
    description: 'Cláusulas jurídicas, vigência e reajuste anual',
    core: true,
    icon: Lock,
  },
  {
    id: 'video',
    label: 'Vídeo de apresentação',
    description: 'Explicação gravada pelo consultor comercial',
    icon: Video,
  },
  {
    id: 'fotos',
    label: 'Galeria operacional',
    description: 'Fotos de equipes, uniformes e equipamentos',
    icon: ImageIcon,
  },
  {
    id: 'documentos',
    label: 'Documentos e certidões',
    description: 'Anexos técnicos, licenças e regularidade fiscal',
    icon: Paperclip,
  },
  {
    id: 'faq',
    label: 'Dúvidas frequentes (FAQ)',
    description: 'Perguntas e respostas sobre implantação e operação',
    icon: HelpCircle,
  },
  {
    id: 'historico',
    label: 'Ajustes e negociação',
    description: ' Histórico de contrapropostas e respostas',
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
  if (!d) return { text: 'Sem abertura ainda', isRecent: false };
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return { text: 'Sem abertura ainda', isRecent: false };
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
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  // Suporte à tecla ESC, trava de scroll do body e atualização silenciosa ao vivo a cada 20s
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

  const numeroFpv = doc?.proposta?.numero || 1;
  const versaoFpv = doc?.versaoFPV || doc?.proposta?.versoes?.[0]?.versao || 1;
  const codigoFpv = `FPV-${String(numeroFpv).padStart(3, '0')} · R${String(versaoFpv).padStart(2, '0')}`;
  const clienteNome = formatEditorialName(
    doc?.client?.nomeFantasia || doc?.client?.razaoSocial || 'Cliente'
  );
  const valorProposta =
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

  // Menus habilitados na proposta + qualquer menu que já teve cliques registrados
  const clientTabsCfg = config.clientTabs || {};
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

    const items = MENU_DEFINITIONS.map((m) => {
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
      };
    }).filter((m) => m.core || m.isEnabled || m.count > 0);

    // Ordena mantendo os que têm mais acessos em evidência quando já houve leitura, ou ordem natural quando zerado
    const hasAnyAccess = items.some((i) => i.count > 0);
    if (hasAnyAccess) {
      return [...items].sort((a, b) => b.count - a.count);
    }
    return items;
  }, [views, history, clientTabsCfg, config.videoUrl, negotiations.length]);

  const totalMenuViews = useMemo(() => {
    const sumViews = menuStats.reduce((acc, m) => acc + m.count, 0);
    return Math.max(sumViews, history.length);
  }, [menuStats, history.length]);

  const maxMenuCount = useMemo(
    () => Math.max(1, ...menuStats.map((m) => m.count)),
    [menuStats]
  );

  // Agrupamento nominal de decisores identificados
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

  // Cálculo das 5 Fases da Jornada do Cliente (avança passo a passo)
  const scopeReads =
    (views.proposta || 0) + (views.apresentacao || 0) + (views.video || 0) + (views.fotos || 0);
  const deepReads =
    (views.fpv || 0) +
    (views.minuta || 0) +
    (views.documentos || 0) +
    (views.faq || 0) +
    negotiations.length;

  const step1Done = Boolean(firstSentAt);
  const step2Done = totalMenuViews > 0 || isApproved || isRejected;
  const step3Done = scopeReads > 0 || deepReads > 0 || isApproved || isRejected;
  const step4Done = deepReads > 0 || isApproved || isRejected;
  const step5Done = isApproved || isRejected;

  const journeySteps = [
    {
      num: 1,
      title: 'Proposta enviada',
      detail: firstSentAt ? `Gerada em ${fmtShortDate(firstSentAt)}` : 'Link criado',
      done: step1Done,
    },
    {
      num: 2,
      title: 'Acesso identificado',
      detail: step2Done
        ? visitors[0]
          ? `${visitors[0].nome} · ${fmtShortDate(firstEvent?.viewedAt || doc?.dataAssinatura)}`
          : `1º acesso em ${fmtShortDate(firstEvent?.viewedAt)}`
        : 'Aguardando 1ª abertura',
      done: step2Done,
    },
    {
      num: 3,
      title: 'Escopo e proposta',
      detail: step3Done
        ? `${Math.max(1, scopeReads)} ${scopeReads === 1 ? 'leitura' : 'leituras'} no escopo`
        : 'Ainda não visualizado',
      done: step3Done,
    },
    {
      num: 4,
      title: 'Custos e minuta',
      detail:
        deepReads > 0
          ? `${deepReads} ${deepReads === 1 ? 'análise técnica' : 'análises técnicas'}`
          : step5Done
          ? 'Validado no fechamento'
          : 'Aguardando análise de FPV/minuta',
      done: step4Done,
    },
    {
      num: 5,
      title: isRejected ? 'Proposta declinada' : isApproved ? 'Proposta aprovada' : 'Aceite digital',
      detail: isApproved
        ? `Assinada em ${fmtShortDate(doc?.dataAssinatura)}`
        : isRejected
        ? 'Encerrada sem aceite'
        : negotiations.length > 0
        ? `${negotiations.length} ${negotiations.length === 1 ? 'interação' : 'interações'} em negociação`
        : 'Aguardando decisão final',
      done: step5Done,
      rejected: isRejected,
    },
  ];

  const completedCount = journeySteps.filter((s) => s.done).length;
  // Índice da próxima fase ativa (para destacar com anel pulsante)
  const activeStageIndex = journeySteps.findIndex((s) => !s.done);
  const progressPercent = Math.round(((completedCount - 1) / (journeySteps.length - 1)) * 100);

  // Temperatura Comercial e Insight Automático (estilo LP)
  const radarSignal = useMemo(() => {
    if (isApproved) {
      return {
        badge: 'Fechada · Aprovada',
        badgeStyle: { backgroundColor: C.greenSoft, color: C.green },
        insight: `Proposta aprovada eletronicamente${
          doc?.nomeAssinante ? ` por ${formatEditorialName(doc.nomeAssinante)}` : ''
        }${doc?.ipAssinante ? ` (IP ${doc.ipAssinante})` : ''}. Pronta para implantação.`,
      };
    }
    if (isRejected) {
      return {
        badge: 'Declinada',
        badgeStyle: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
        insight:
          'O cliente registrou declínio nesta versão. Consulte a aba de negociações para avaliar uma revisão comercial.',
      };
    }
    if (pendingNegotiationsCount > 0) {
      return {
        badge: 'Atenção · Pedido de ajuste',
        badgeStyle: { backgroundColor: '#FFF7ED', color: '#C2410C' },
        insight: `O cliente enviou ${pendingNegotiationsCount} ${
          pendingNegotiationsCount === 1 ? 'solicitação de ajuste' : 'solicitações de ajuste'
        } aguardando sua resposta.`,
      };
    }
    if (totalMenuViews === 0) {
      return {
        badge: 'Aguardando abertura',
        badgeStyle: { backgroundColor: '#F3F1EB', color: C.muted },
        insight:
          'O cliente ainda não abriu o link da proposta. Vale confirmar o recebimento no WhatsApp do decisor.',
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
        insight: `O cliente já acumulou ${totalMenuViews} acessos e revisitou ${hotMenu}. Excelente momento para ligar e apoiar o fechamento.`,
      };
    }
    const topMenu = menuStats[0];
    return {
      badge: 'Em leitura ativa',
      badgeStyle: { backgroundColor: C.greenSoft, color: C.green },
      insight: `O cliente iniciou a análise pela seção "${
        topMenu?.label || 'Proposta comercial'
      }". Acompanhe o avanço para abordar no momento ideal.`,
    };
  }, [
    isApproved,
    isRejected,
    pendingNegotiationsCount,
    totalMenuViews,
    views.fpv,
    views.minuta,
    menuStats,
    doc?.nomeAssinante,
    doc?.ipAssinante,
  ]);

  // Validade restante do link
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

  // Feed cronológico unificado (do mais recente para o mais antigo)
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

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain antialiased selection:bg-[#1B4D3E] selection:text-white animate-in fade-in duration-200"
      style={{ backgroundColor: C.paper, color: C.ink }}
    >
      {/* ================================================================== */}
      {/* BARRA SUPERIOR FIXA (TELA CHEIA)                                   */}
      {/* ================================================================== */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(251, 250, 247, 0.92)',
          borderColor: C.line,
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-[64px] flex items-center justify-between gap-3">
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
                <div className="flex items-center gap-2">
                  <h1
                    className="text-[15px] sm:text-[17px] font-bold truncate"
                    style={{ letterSpacing: '-0.02em', color: C.ink }}
                  >
                    Radar da proposta · {clienteNome}
                  </h1>
                </div>
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
              {lastActivity.isRecent && !isApproved && !isRejected && (
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
                title="Atualizar dados agora"
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
      {/* CONTEÚDO PRINCIPAL DO RADAR                                        */}
      {/* ================================================================== */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* 1. ESTEIRA HORIZONTAL DA JORNADA DO CLIENTE (PASSO A PASSO)      */}
        {/* ---------------------------------------------------------------- */}
        <section
          className="bg-white rounded-[22px] border p-5 sm:p-7"
          style={{ borderColor: C.line }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                Jornada de decisão do cliente
              </p>
              <h2
                className="text-[18px] sm:text-[20px] font-bold mt-0.5"
                style={{ letterSpacing: '-0.025em', color: C.ink }}
              >
                Fase {completedCount} de {journeySteps.length} concluída
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] tabular-nums font-medium" style={{ color: C.muted }}>
                Avanço da jornada:
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-[12.5px] font-bold tabular-nums"
                style={{ backgroundColor: C.greenSoft, color: C.green }}
              >
                {Math.max(10, progressPercent)}%
              </span>
            </div>
          </div>

          {/* Trilha Horizontal Desktop + Vertical Compacta Mobile */}
          <div className="relative">
            {/* Linha contínua de fundo (Desktop) */}
            <div
              className="hidden lg:block absolute top-[17px] left-[8%] right-[8%] h-[2px] rounded-full"
              style={{ backgroundColor: '#ECE9E1' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                  backgroundColor: isRejected ? '#DC2626' : C.green,
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3 relative z-10">
              {journeySteps.map((step, idx) => {
                const isNextActive = idx === activeStageIndex;
                return (
                  <div
                    key={step.num}
                    className="flex lg:flex-col items-start lg:items-center lg:text-center gap-3 lg:gap-2.5"
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      {isNextActive && (
                        <span
                          className="absolute inset-0 rounded-full animate-ping opacity-25"
                          style={{ backgroundColor: C.green }}
                        />
                      )}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all"
                        style={
                          step.done
                            ? step.rejected
                              ? {
                                  backgroundColor: '#DC2626',
                                  borderColor: '#DC2626',
                                  color: '#FFFFFF',
                                }
                              : {
                                  backgroundColor: C.green,
                                  borderColor: C.green,
                                  color: '#FFFFFF',
                                }
                            : isNextActive
                            ? {
                                backgroundColor: '#FFFFFF',
                                borderColor: C.green,
                                color: C.green,
                              }
                            : {
                                backgroundColor: '#FFFFFF',
                                borderColor: C.line,
                                color: '#9CA3AF',
                              }
                        }
                      >
                        {step.done ? (
                          step.rejected ? (
                            <X size={16} strokeWidth={2.8} />
                          ) : (
                            <Check size={16} strokeWidth={2.8} />
                          )
                        ) : (
                          step.num
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="text-[13.5px] font-semibold leading-snug"
                        style={{ color: step.done || isNextActive ? C.ink : '#8B939E' }}
                      >
                        {step.title}
                      </p>
                      <p
                        className="text-[12px] leading-snug mt-0.5"
                        style={{ color: step.done ? C.muted : '#9CA3AF' }}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 2. MÉTRICAS-CHAVE DO RADAR (ESTILO LP)                           */}
        {/* ---------------------------------------------------------------- */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[20px] overflow-hidden border"
          style={{ backgroundColor: C.line, borderColor: C.line }}
        >
          <div className="bg-white p-5">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Total de acessos em menus
            </p>
            <p
              className="text-[34px] sm:text-[38px] leading-none font-bold mt-2 tabular-nums"
              style={{ letterSpacing: '-0.035em', color: C.ink }}
            >
              {totalMenuViews}
            </p>
            <p className="text-[12px] mt-2" style={{ color: C.muted }}>
              {totalMenuViews === 0
                ? 'Nenhuma visita do cliente ainda'
                : `${menuStats.filter((m) => m.count > 0).length} de ${menuStats.length} menus visitados`}
            </p>
          </div>

          <div className="bg-white p-5">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Última interação do cliente
            </p>
            <p
              className="text-[24px] sm:text-[28px] leading-tight font-bold mt-2 flex items-center gap-2"
              style={{ letterSpacing: '-0.03em', color: C.ink }}
            >
              {lastActivity.isRecent && (
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: C.green }}
                />
              )}
              <span className="truncate">{lastActivity.text}</span>
            </p>
            <p className="text-[12px] mt-2 truncate" style={{ color: C.muted }}>
              {lastEvent
                ? `Em ${fmtDateTime(lastEvent.viewedAt)}`
                : doc?.dataAssinatura
                ? `Em ${fmtDateTime(doc.dataAssinatura)}`
                : 'Aguardando 1º clique'}
            </p>
          </div>

          <div className="bg-white p-5">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Decisores identificados
            </p>
            <p
              className="text-[34px] sm:text-[38px] leading-none font-bold mt-2 tabular-nums"
              style={{ letterSpacing: '-0.035em', color: C.ink }}
            >
              {visitors.length}
            </p>
            <p className="text-[12px] mt-2 truncate" style={{ color: C.muted }}>
              {visitors.length > 0
                ? visitors.map((v) => v.nome).join(', ')
                : 'Identificação na entrada do link'}
            </p>
          </div>

          <div className="bg-white p-5">
            <p className="text-[12px]" style={{ color: C.muted }}>
              Menu mais consultado
            </p>
            <p
              className="text-[18px] sm:text-[20px] leading-snug font-bold mt-2 line-clamp-2"
              style={{ letterSpacing: '-0.025em', color: C.ink }}
            >
              {totalMenuViews > 0 && menuStats[0]?.count > 0
                ? menuStats[0].label
                : 'Sem leituras ainda'}
            </p>
            <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>
              {totalMenuViews > 0 && menuStats[0]?.count > 0
                ? `${menuStats[0].count} ${menuStats[0].count === 1 ? 'acesso' : 'acessos'} nesta seção`
                : 'Os cliques aparecem aqui em tempo real'}
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 3. PAINEL DUPLO: ACESSOS POR MENU + LINHA DO TEMPO / NEGOCIAÇÃO  */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA (7 col): Acessos em cada menu + Quem acessou */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card: Número de acessos em cada menu */}
            <section
              className="bg-white rounded-[22px] border p-5 sm:p-7"
              style={{ borderColor: C.line }}
            >
              <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                  <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                    Rastreio de leitura por seção
                  </p>
                  <h3
                    className="text-[18px] font-bold mt-0.5"
                    style={{ letterSpacing: '-0.025em', color: C.ink }}
                  >
                    Acessos em cada menu da proposta
                  </h3>
                </div>
                <span className="text-[12px]" style={{ color: C.muted }}>
                  Acessos do consultor são ignorados
                </span>
              </div>

              <div className="space-y-5">
                {menuStats.map((menu) => {
                  const IconComp = menu.icon;
                  const pctBar =
                    menu.count > 0 ? Math.max(8, Math.round((menu.count / maxMenuCount) * 100)) : 0;
                  const sharePct =
                    totalMenuViews > 0 ? Math.round((menu.count / totalMenuViews) * 100) : 0;

                  return (
                    <div key={menu.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: menu.count > 0 ? C.greenSoft : '#F3F1EB',
                              color: menu.count > 0 ? C.green : '#7A838E',
                            }}
                          >
                            <IconComp size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[14px] font-semibold truncate"
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
                            {sharePct > 0 ? ` · ${sharePct}%` : ''}
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

              {/* Insight Comercial Automático (mesmo estilo da LP) */}
              <div
                className="mt-6 rounded-xl px-4 py-3.5 text-[13px] leading-relaxed flex items-start gap-2.5"
                style={{ backgroundColor: C.amberSoft, color: C.amberInk }}
              >
                <Eye size={16} className="mt-0.5 shrink-0" />
                <span>{radarSignal.insight}</span>
              </div>
            </section>

            {/* Card: Pessoas / Decisores que abriram a proposta */}
            <section
              className="bg-white rounded-[22px] border p-5 sm:p-7"
              style={{ borderColor: C.line }}
            >
              <div className="mb-4">
                <p className="text-[12px] font-medium" style={{ color: C.muted }}>
                  Mapeamento do comitê comprador
                </p>
                <h3
                  className="text-[18px] font-bold mt-0.5"
                  style={{ letterSpacing: '-0.025em', color: C.ink }}
                >
                  Quem acessou esta proposta
                </h3>
              </div>

              {visitors.length === 0 ? (
                <div
                  className="rounded-xl border border-dashed py-8 px-4 text-center text-[13px]"
                  style={{ borderColor: C.line, color: C.muted }}
                >
                  Assim que o cliente confirmar o acesso na entrada da proposta, o nome, CNPJ/e-mail e menus visitados por cada pessoa aparecerão aqui.
                </div>
              ) : (
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
                        className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-4"
                        style={{ borderColor: C.line }}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-bold shrink-0 mt-0.5"
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
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Array.from(v.tabs).map((tId) => {
                                const m = MENU_DEFINITIONS.find((x) => x.id === tId);
                                return (
                                  <span
                                    key={tId}
                                    className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                                    style={{ backgroundColor: '#F3F1EB', color: C.ink }}
                                  >
                                    {m ? m.label : tId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className="text-[13.5px] font-bold tabular-nums block"
                            style={{ color: C.ink }}
                          >
                            {v.clicks} {v.clicks === 1 ? 'clique' : 'cliques'}
                          </span>
                          <span className="text-[11.5px] block mt-0.5" style={{ color: C.muted }}>
                            Último: {fmtShortDate(v.lastAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* COLUNA DIREITA (5 col): Linha do tempo ao vivo + Negociações */}
          <div className="lg:col-span-5">
            <section
              className="bg-white rounded-[22px] border p-5 sm:p-7"
              style={{ borderColor: C.line }}
            >
              {/* Seletor entre Linha do Tempo e Negociações */}
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
                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
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
                            ? { backgroundColor: '#EA580C', borderColor: '#EA580C' }
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
                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
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
