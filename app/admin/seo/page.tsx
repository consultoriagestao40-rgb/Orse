'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Globe,
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  Bot,
  Search,
} from 'lucide-react';

export default function AdminSeoPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [dailyAutopilot, setDailyAutopilot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedLinkedinSlug, setCopiedLinkedinSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [liStatus, setLiStatus] = useState<any>(null);
  const [liClientId, setLiClientId] = useState('');
  const [liClientSecret, setLiClientSecret] = useState('');
  const [liOrgId, setLiOrgId] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [showLiConfig, setShowLiConfig] = useState(false);
  const [savingLi, setSavingLi] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<any | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [previewStyle, setPreviewStyle] = useState<'cascade' | 'light' | 'lphero'>('cascade');
  const [previewPhoto, setPreviewPhoto] = useState<number | null>(null);
  const [publishingLi, setPublishingLi] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState<number>(30);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [gscData, setGscData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);

  const loadAnalytics = async (days = analyticsDays) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/seo/analytics?days=${days}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.analytics || null);
        setGscData(data.gsc || null);
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadLinkedInStatus = async () => {
    try {
      const res = await fetch('/api/seo/linkedin');
      const data = await res.json();
      if (data.success) {
        setLiStatus(data);
        if (data.clientId) setLiClientId(data.clientId);
        if (data.organizationId) setLiOrgId(data.organizationId);
      }
    } catch {}
  };

  const loadSeoData = async (withLiveTrends = false) => {
    if (withLiveTrends) setLoadingTrends(true);
    else setLoading(true);
    try {
      const res = await fetch(withLiveTrends ? '/api/seo/generate?trends=1' : '/api/seo/generate');
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles || []);
        setSuggestedTopics(data.suggestedTopics || []);
        if (data.dailyAutopilot) setDailyAutopilot(data.dailyAutopilot);
        if (withLiveTrends) {
          setFeedback('🔍 Termos mais pesquisados atualizados ao vivo via Google Autocomplete Brasil!');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados de SEO:', e);
    } finally {
      setLoading(false);
      setLoadingTrends(false);
    }
  };

  useEffect(() => {
    loadSeoData();
    loadLinkedInStatus();
    loadAnalytics(30);
    if (typeof window !== 'undefined' && window.location.search.includes('gsc=connected')) {
      setFeedback('✅ Google Search Console conectado com sucesso! Carregando impressões, cliques e posições do Google...');
    }
  }, []);

  const handleConnectLinkedInOAuth = async () => {
    setSavingLi(true);
    try {
      const res = await fetch('/api/seo/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: liClientId,
          clientSecret: liClientSecret || undefined,
        }),
      });
      const data = await res.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      } else {
        setFeedback('⚠️ Informe o Client ID e Client Secret do seu App do LinkedIn.');
      }
    } catch {
      setFeedback('❌ Erro ao iniciar conexão com LinkedIn.');
    } finally {
      setSavingLi(false);
    }
  };

  const getAutoStyleForIndex = (idx: number): 'cascade' | 'light' | 'lphero' => {
    const rotation = ['cascade', 'light', 'lphero'] as const;
    const chronoIdx = Math.max(0, articles.length - 1 - idx);
    return rotation[chronoIdx % rotation.length];
  };

  const openLinkedInReviewModal = (art: any, idx = 0) => {
    const autoStyle = getAutoStyleForIndex(idx);
    setPreviewArticle(art);
    setPreviewStyle(autoStyle);
    setPreviewText(buildLinkedInText(art, autoStyle));
    setPreviewPhoto(null);
  };

  const handleConfirmPublishLinkedIn = async () => {
    if (!previewArticle) return;
    const art = previewArticle;
    if (!liStatus?.connected) {
      shareDirectOnLinkedIn(art, previewText);
      setPreviewArticle(null);
      return;
    }
    setPublishingLi(true);
    setCopiedLinkedinSlug(art.slug);
    setFeedback(`🚀 Publicando "${art.title}" com Arte Editorial revisada na API do seu LinkedIn...`);
    try {
      const res = await fetch('/api/seo/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_now',
          slug: art.slug,
          postText: previewText,
          style: previewStyle,
          photo: previewPhoto,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`✅ ${data.message}`);
        setPreviewArticle(null);
      } else {
        setFeedback(`⚠️ ${data.message} — Abrindo janela manual do LinkedIn com o texto já copiado...`);
        shareDirectOnLinkedIn(art, previewText);
        setPreviewArticle(null);
      }
    } catch {
      shareDirectOnLinkedIn(art, previewText);
      setPreviewArticle(null);
    } finally {
      setPublishingLi(false);
      setTimeout(() => setCopiedLinkedinSlug(null), 2500);
    }
  };

  const handleGenerate = async (topic?: string) => {
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || customTopic }),
      });
      const data = await res.json();
      if (data.success && data.article) {
        setFeedback(`✅ Artigo "${data.article.title}" publicado e indexado no sitemap.xml!`);
        setCustomTopic('');
        await loadSeoData();
      } else {
        setFeedback(`❌ ${data.error || 'Não foi possível gerar o artigo.'}`);
      }
    } catch (e: any) {
      setFeedback(`❌ Erro de conexão: ${e?.message || ''}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Deseja remover este artigo customizado?')) return;
    try {
      await fetch(`/api/seo/generate?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      await loadSeoData();
    } catch {}
  };

  const copyUrl = (slug: string) => {
    const url = `https://www.smartbidhub.com.br/conteudos/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const buildLinkedInText = (art: any, style: 'cascade' | 'light' | 'lphero' = 'cascade') => {
    const cleanTitle = (art.title || '')
      .replace(/\(Guia 2026\)/gi, '(Guia 2027)')
      .replace(/\(2026\)/gi, '(2027)')
      .replace(/no SmartBid Hub/gi, 'na prática')
      .replace(/SmartBid Hub/gi, '');

    const cleanExcerpt = (art.excerpt || art.metaDescription || '')
      .replace(/no SmartBid Hub/gi, 'com automação de cálculo')
      .replace(/para o SmartBid Hub/gi, 'para um sistema integrado')
      .replace(/SmartBid Hub/gi, 'sistema especializado');

    const bullets = (
      art.sections?.[0]?.bullets?.slice(0, 3) || [
        'Memória de cálculo auditável de Montantes A, B e C por CCT;',
        'Simulação automática de tributos por dentro (Gross-up) incluindo a virada de 2027 da Reforma Tributária (IBS e CBS);',
        'Geração imediata de Proposta Comercial interativa com rastreamento de abertura.',
      ]
    ).map((b: string) =>
      b
        .replace(/SmartBid Hub\s*\([^)]*\):\s*/gi, '')
        .replace(/no SmartBid Hub/gi, 'em plataforma especializada')
        .replace(/SmartBid Hub/gi, 'plataforma especializada')
    );
    return `📊 ${cleanTitle.trim()}

Quem vive a operação e a área comercial de Facilities e Terceirização de Serviços (Limpeza, Portaria, Vigilância e Manutenção) sabe: um único erro de fórmula na planilha de custos corrói de 4% a 8% da margem líquida durante o contrato — e com a virada tributária de 2027 (extinção de PIS/COFINS e entrada da CBS e do Split Payment), o rigor técnico na precificação passa a ser questão de sobrevivência.

${cleanExcerpt}

Pontos críticos que todo diretor e orçamentista precisa blindar antes de enviar uma proposta:
${bullets.map((b: string) => `✅ ${b}`).join('\n')}

🚀 Quer substituir planilhas soltas de Excel por um motor completo de Engenharia de Custos (FPV por CCT), CRM e Propostas Interativas?
Acesse e libere 30 dias de teste grátis: https://www.smartbidhub.com.br/lp?post=${encodeURIComponent(art.slug)}&s=${style}&v=logo2

#Facilities #Terceirizacao #EngenhariaDeCustos #GestaoDeContratos #LimpezaEConservacao #Portaria #ReformaTributaria2027`;
  };

  const shareDirectOnLinkedIn = (art: any, customText?: string) => {
    const postText = customText || buildLinkedInText(art);
    navigator.clipboard.writeText(postText);
    setCopiedLinkedinSlug(art.slug);
    setFeedback(`💼 Texto copiado e janela de publicação do LinkedIn aberta já preenchida!`);
    setTimeout(() => setCopiedLinkedinSlug(null), 2500);
    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/empresas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1B4D3E] mb-2"
            >
              <ArrowLeft size={14} /> Voltar para Gestão de Empresas SaaS
            </Link>
            <h1 className="text-2xl font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2.5">
              <Sparkles size={24} /> Motor Automático de SEO & Conteúdos (IA)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gere e publique guias técnicos otimizados para ranquear no Google e nas IAs (ChatGPT, Gemini, Perplexity) — todos entram automaticamente no <code className="bg-slate-200/70 px-1.5 py-0.5 rounded text-xs">sitemap.xml</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/conteudos"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs"
            >
              <Globe size={15} className="text-[#1B4D3E]" /> Abrir Central Pública (/conteudos)
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs"
            >
              <ExternalLink size={15} className="text-[#1B4D3E]" /> Ver sitemap.xml
            </a>
          </div>
        </div>

        {/* PAINEL AO VIVO: VISITAS NA LP & RESULTADO DO SEO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BarChart3 size={17} className="text-[#1B4D3E]" /> Visitas na LP & Performance de SEO
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoramento próprio em tempo real da Landing Page (<code className="bg-slate-100 px-1 rounded">/lp</code>), central de artigos (<code className="bg-slate-100 px-1 rounded">/conteudos</code>), origens de tráfego e rastreio do Googlebot.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                {[
                  { d: 1, label: 'Hoje' },
                  { d: 7, label: '7 dias' },
                  { d: 30, label: '30 dias' },
                  { d: 90, label: '90 dias' },
                ].map((opt) => {
                  const active = analyticsDays === opt.d;
                  return (
                    <button
                      key={opt.d}
                      type="button"
                      onClick={() => {
                        setAnalyticsDays(opt.d);
                        loadAnalytics(opt.d);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        active ? 'bg-[#1B4D3E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => loadAnalytics(analyticsDays)}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#1B4D3E] cursor-pointer"
                title="Atualizar métricas agora"
              >
                <RefreshCw size={15} className={loadingAnalytics ? 'animate-spin text-[#1B4D3E]' : ''} />
              </button>
            </div>
          </div>

          {/* 4 KPIs Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Visitas na LP</span>
                <Eye size={15} className="text-[#1B4D3E]" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                {analyticsData?.totals?.lpViews ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {analyticsData?.totals?.lpUniqueVisitors ?? 0} visitantes únicos · {analyticsData?.totals?.mobileSharePct ?? 0}% mobile
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Leituras de SEO</span>
                <BookOpen size={15} className="text-[#EA580C]" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                {analyticsData?.totals?.seoViews ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {analyticsData?.totals?.seoUniqueVisitors ?? 0} leitores em /conteudos ({articles.length} artigos ativos)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cliques em Cadastro</span>
                <MousePointerClick size={15} className="text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                {(analyticsData?.totals?.cadastroViews ?? 0) + (analyticsData?.totals?.ctaClicks ?? 0)}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {analyticsData?.totals?.newTenantsCount ?? 0} contas criadas · {analyticsData?.totals?.newLeadsCount ?? 0} leads no período
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Googlebot & IAs</span>
                <Bot size={15} className="text-emerald-700" />
              </div>
              <p className="text-2xl font-black text-slate-900 tabular-nums">
                {analyticsData?.totals?.botCrawlsTotal ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Rastreios de indexação (Google, ChatGPT, Perplexity)
              </p>
            </div>
          </div>

          {/* Gráfico 14 dias + Origens de Tráfego */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Evolução Diária de Acessos (Últimos 14 dias)
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#1B4D3E]" /> LP
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#EA580C]" /> Artigos SEO
                  </span>
                </div>
              </div>

              {(() => {
                const series: Array<{ date: string; label: string; lpViews: number; seoViews: number }> =
                  analyticsData?.dailySeries || [];
                const maxVal = Math.max(1, ...series.map((s) => s.lpViews + s.seoViews));
                return (
                  <div className="h-36 flex items-end gap-1.5 pt-4 border-b border-slate-100 pb-2">
                    {series.map((d) => {
                      const total = d.lpViews + d.seoViews;
                      const lpH = Math.round((d.lpViews / maxVal) * 100);
                      const seoH = Math.round((d.seoViews / maxVal) * 100);
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                          title={`${d.label}: ${d.lpViews} visitas LP · ${d.seoViews} leituras SEO`}
                        >
                          {total > 0 && (
                            <span className="text-[9px] font-bold text-slate-500 mb-1 tabular-nums">
                              {total}
                            </span>
                          )}
                          <div className="w-full max-w-[26px] flex flex-col justify-end rounded-t overflow-hidden bg-slate-100/80 min-h-[4px]" style={{ height: `${Math.max(4, lpH + seoH)}%` }}>
                            {d.seoViews > 0 && (
                              <div
                                className="w-full bg-[#EA580C]"
                                style={{ height: `${Math.round((d.seoViews / Math.max(1, total)) * 100)}%` }}
                              />
                            )}
                            {d.lpViews > 0 && (
                              <div
                                className="w-full bg-[#1B4D3E]"
                                style={{ height: `${Math.round((d.lpViews / Math.max(1, total)) * 100)}%` }}
                              />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold mt-1.5">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Top Páginas Visitadas */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Páginas Públicas Mais Acessadas
                </p>
                {!analyticsData?.topPages || analyticsData.topPages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    As novas visitas na <code className="bg-slate-100 px-1 rounded">/lp</code> e em <code className="bg-slate-100 px-1 rounded">/conteudos</code> aparecerão aqui automaticamente a partir de agora.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {analyticsData.topPages.slice(0, 6).map((pg: any) => (
                      <div key={pg.path} className="py-2 flex items-center justify-between gap-3">
                        <a
                          href={pg.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-700 hover:text-[#1B4D3E] truncate"
                        >
                          {pg.path}
                        </a>
                        <div className="flex items-center gap-3 shrink-0 tabular-nums">
                          <span className="text-slate-500">{pg.uniqueVisitors} únicos</span>
                          <span className="font-black text-[#1B4D3E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {pg.views} visitas
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Origem das Visitas & Robôs */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-[#1B4D3E]" /> Origem das Visitas
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Canal de Entrada</span>
                </div>

                {!analyticsData?.sources || analyticsData.sources.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">
                    Assim que visitantes entrarem pelo Google, Instagram, YouTube, TikTok, LinkedIn ou WhatsApp, a participação de cada canal aparece aqui.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {(() => {
                      const maxSrc = Math.max(1, ...analyticsData.sources.map((s: any) => s.views));
                      return analyticsData.sources.map((s: any) => (
                        <div key={s.source} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">{s.source}</span>
                            <span className="text-slate-500 font-semibold tabular-nums">
                              {s.views} ({s.uniqueVisitors} únicos)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1B4D3E] rounded-full"
                              style={{ width: `${Math.max(6, Math.round((s.views / maxSrc) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Robôs de Busca & IA Detectados
                </p>
                {!analyticsData?.botBreakdown || analyticsData.botBreakdown.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Aguardando próximas passagens do Googlebot, Bingbot e motores de IA nas páginas públicas.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {analyticsData.botBreakdown.map((b: any) => (
                      <span
                        key={b.bot}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {b.bot}: {b.hits}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Integração Oficial Google Search Console (Impressões, Cliques e Posição no Google) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Search size={15} className="text-[#1B4D3E]" /> Google Search Console Oficial (Impressões, Cliques & Posição no Google)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {gscData?.connected
                    ? `Conectado (${gscData.connectedEmail || 'Google'}) · Propriedade: ${gscData.siteUrl || 'smartbidhub.com.br'}`
                    : 'Conecte sua conta do Google Search Console em 1 clique para ver impressões, cliques orgânicos e em qual posição cada palavra-chave está ranqueando no Google.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {gscData?.connected ? (
                  <>
                    <a
                      href="/api/seo/gsc"
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                    >
                      Reconectar Conta
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/seo/gsc', { method: 'DELETE' });
                        loadAnalytics(analyticsDays);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <a
                    href="/api/seo/gsc"
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs"
                  >
                    <Globe size={14} /> Conectar Google Search Console
                  </a>
                )}
              </div>
            </div>

            {gscData?.error && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                ⚠️ {gscData.error}
              </div>
            )}

            {gscData?.connected && gscData?.totals && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliques no Google</p>
                    <p className="text-xl font-black text-[#1B4D3E] mt-1 tabular-nums">{gscData.totals.clicks}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Impressões na Busca</p>
                    <p className="text-xl font-black text-slate-800 mt-1 tabular-nums">{gscData.totals.impressions}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CTR Médio</p>
                    <p className="text-xl font-black text-slate-800 mt-1 tabular-nums">{gscData.totals.ctrPct}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posição Média</p>
                    <p className="text-xl font-black text-[#EA580C] mt-1 tabular-nums">
                      {gscData.totals.avgPosition > 0 ? `${gscData.totals.avgPosition}ª` : '—'}
                    </p>
                  </div>
                </div>

                {gscData.topQueries && gscData.topQueries.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      Palavras-Chave que Mais Trouxeram Impressões e Cliques no Google
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                            <th className="px-4 py-2.5">Termo Pesquisado no Google</th>
                            <th className="px-4 py-2.5 text-right">Cliques</th>
                            <th className="px-4 py-2.5 text-right">Impressões</th>
                            <th className="px-4 py-2.5 text-right">CTR</th>
                            <th className="px-4 py-2.5 text-right">Posição</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {gscData.topQueries.map((q: any) => (
                            <tr key={q.query} className="hover:bg-slate-50">
                              <td className="px-4 py-2 font-semibold text-slate-800">{q.query}</td>
                              <td className="px-4 py-2 text-right font-black text-[#1B4D3E] tabular-nums">{q.clicks}</td>
                              <td className="px-4 py-2 text-right text-slate-600 tabular-nums">{q.impressions}</td>
                              <td className="px-4 py-2 text-right text-slate-500 tabular-nums">{q.ctrPct}%</td>
                              <td className="px-4 py-2 text-right font-bold text-slate-700 tabular-nums">{q.position}ª</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Status Piloto Automático Diário */}
        <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Piloto Automático Diário Ativo (1 Artigo / Dia)
              </span>
              <span className="text-xs text-emerald-200/80 font-semibold">
                Cron Diário 06:00 BRT + Gatilho Inteligente Google Suggest
              </span>
            </div>
            <p className="text-xs text-emerald-100/90">
              Todos os dias o SmartBid consulta os termos mais pesquisados no Google Brasil sobre Terceirização, Facilities, CCT e FPV, gera 1 guia técnico inédito e publica automaticamente no <code className="bg-white/10 px-1.5 py-0.5 rounded">sitemap.xml</code>.
            </p>
            {dailyAutopilot?.todayArticleTitle && (
              <p className="text-xs text-amber-300 font-bold pt-1">
                ✅ Artigo automático de hoje ({dailyAutopilot.todayDateKey}): &ldquo;{dailyAutopilot.todayArticleTitle}&rdquo;
              </p>
            )}
          </div>
            <button
              onClick={() => setShowLiConfig(!showLiConfig)}
              className="shrink-0 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={14} />
              {liStatus?.connected
                ? `LinkedIn Conectado (${liStatus.personName || 'Ativo'}) 🟢`
                : 'Conectar API Oficial LinkedIn (100% Automático)'}
            </button>
          </div>

          {showLiConfig && (
            <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0A66C2]">
                    Conexão Oficial API do LinkedIn (Postagem Diária 100% Automática com Imagem)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Na aba <strong>Auth</strong> do seu App em <code className="bg-slate-100 px-1.5 py-0.5 rounded">linkedin.com/developers/apps</code>, adicione a Redirect URL:{' '}
                    <code className="bg-blue-50 text-[#0A66C2] font-bold px-1.5 py-0.5 rounded select-all">
                      https://www.smartbidhub.com.br/api/seo/linkedin/callback
                    </code>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={liClientId}
                  onChange={(e) => setLiClientId(e.target.value)}
                  placeholder="Client ID do App LinkedIn"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#0A66C2]"
                />
                <input
                  type="password"
                  value={liClientSecret}
                  onChange={(e) => setLiClientSecret(e.target.value)}
                  placeholder="Primary Client Secret do App LinkedIn"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none focus:border-[#0A66C2]"
                />
                <button
                  onClick={handleConnectLinkedInOAuth}
                  disabled={savingLi}
                  className="bg-[#0A66C2] hover:bg-[#004182] text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingLi ? 'Redirecionando...' : 'Autorizar e Conectar Meu LinkedIn'}
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                    🏢 Publicação Dupla: ID ou Link da Company Page do SmartBid no LinkedIn:
                  </label>
                  <input
                    type="text"
                    value={liOrgId}
                    onChange={(e) => setLiOrgId(e.target.value)}
                    placeholder="Ex: 105482910 ou cole o link https://www.linkedin.com/company/.../admin/"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-[#0A66C2]"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/seo/linkedin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'save_org', organizationId: liOrgId }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setLiOrgId(data.organizationId || '');
                        setFeedback(`✅ ${data.message}`);
                        await loadLinkedInStatus();
                      }
                    } catch {}
                  }}
                  className="md:mt-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
                >
                  Salvar Company Page SmartBid
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-pink-700 block mb-1">
                    📸 Automação Instagram (@smartbidhub) + Página Facebook (SmartBid Hub - ID 1510660472123825):
                  </label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder={
                      liStatus?.metaConnected
                        ? '🟢 Token da Meta Conectado! (Cole um novo aqui se quiser atualizar)'
                        : 'Cole aqui o Token Permanente do Usuário do Sistema da Meta (Graph API)'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium outline-none focus:border-pink-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/seo/linkedin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'save_org',
                          organizationId: liOrgId || '145437619',
                          metaAccessToken: metaToken,
                          facebookPageId: '1510660472123825',
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setMetaToken('');
                        setFeedback(`✅ ${data.message}`);
                        await loadLinkedInStatus();
                      }
                    } catch {}
                  }}
                  className="md:mt-5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
                >
                  Salvar Token Instagram & Facebook
                </button>
              </div>
            </div>
          )}

        {/* Gerador por IA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Gerar Novo Guia de SEO com Inteligência Artificial
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Digite qualquer palavra-chave ou dúvida que o seu cliente pesquisa no Google, ou clique em uma das sugestões abaixo.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ex: Como calcular insalubridade 40% e encargos na limpeza hospitalar..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#1B4D3E]"
              disabled={generating}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              {generating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Gerando e Publicando...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> {customTopic.trim() ? 'Gerar e Publicar Agora' : 'Gerar Próximo Tema no Piloto Automático'}
                </>
              )}
            </button>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              {feedback}
            </div>
          )}

          {/* Sugestões de Alta Busca */}
          <div className="pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Sugestões de Temas de Alta Busca no Google (Clique para gerar em 1 clique):
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics.map((t, i) => (
                <button
                  key={i}
                  disabled={generating}
                  onClick={() => handleGenerate(t)}
                  className="text-left text-xs bg-slate-100 hover:bg-[#1B4D3E]/10 hover:text-[#1B4D3E] border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Artigos Publicados */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#1B4D3E] flex items-center gap-2">
              <BookOpen size={16} /> Artigos & Guias Publicados no Google ({articles.length})
            </h2>
            <button
              onClick={() => loadSeoData(false)}
              className="p-1.5 text-slate-400 hover:text-[#1B4D3E] rounded-lg cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400 font-semibold">Carregando artigos publicados...</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {articles.map((art, idx) => {
                const autoStyle = getAutoStyleForIndex(idx);
                const autoStyleLabel =
                  autoStyle === 'cascade'
                    ? '🎨 Arte 01: Cascata 3D'
                    : autoStyle === 'light'
                    ? '☀️ Arte 02: Claro LP'
                    : '💻 Arte 03: Hero LP';
                return (
                <div key={art.slug} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1B4D3E] border border-emerald-200">
                        {art.category}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-[#E05A1B] border border-orange-200">
                        {autoStyleLabel}
                      </span>
                      {art.isCustom && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Gerado por IA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        /conteudos/{art.slug}
                      </span>
                      {analyticsData?.articleStats?.[art.slug]?.views > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          👁️ {analyticsData.articleStats[art.slug].views} leitura{analyticsData.articleStats[art.slug].views !== 1 ? 's' : ''}
                        </span>
                      )}
                      {analyticsData?.articleStats?.[art.slug]?.botCrawls > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🤖 {analyticsData.articleStats[art.slug].botCrawls} crawl{analyticsData.articleStats[art.slug].botCrawls !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800">{art.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{art.metaDescription}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => openLinkedInReviewModal(art, idx)}
                      className="px-3.5 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      {copiedLinkedinSlug === art.slug ? (
                        <>
                          <Check size={14} className="text-white" /> Enviando LinkedIn...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} /> Revisar & Postar no LinkedIn
                        </>
                      )}
                    </button>
                    <a
                      href={`/api/seo/og?slug=${encodeURIComponent(art.slug)}&style=${autoStyle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                      title="Ver Arte Editorial gerada automaticamente para este artigo"
                    >
                      Ver Arte <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => copyUrl(art.slug)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSlug === art.slug ? (
                        <>
                          <Check size={14} className="text-emerald-600" /> Link Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar Link
                        </>
                      )}
                    </button>
                    <a
                      href={`/conteudos/${art.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] text-xs font-bold flex items-center gap-1.5"
                    >
                      Abrir <ExternalLink size={13} />
                    </a>
                    {art.isCustom && (
                      <button
                        onClick={() => handleDelete(art.slug)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Excluir artigo customizado"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL DE REVISÃO E VALIDAÇÃO PRÉ-POSTAGEM NO LINKEDIN */}
        {previewArticle && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
              <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Revisão Obrigatória Antes da Publicação
                  </span>
                  <h3 className="text-base font-black">
                    Valide a Arte Editorial e o Texto antes de publicar no LinkedIn
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 cursor-pointer"
                >
                  Fechar ✕
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Preview da Arte Editorial Criativa */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      1. Arte do Post ({previewStyle === 'cascade' ? 'Modelo 01: Cascata 3D (Escuro LP)' : previewStyle === 'light' ? 'Modelo 02: Bento Editorial (Claro LP)' : 'Modelo 03: Hero & Sistema (LP)'}):
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewStyle('cascade');
                          setPreviewText((prev) => prev.replace(/&s=(cascade|light|lphero)/g, '&s=cascade'));
                        }}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          previewStyle === 'cascade'
                            ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        🎨 Modelo 01 (Cascata 3D)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewStyle('light');
                          setPreviewText((prev) => prev.replace(/&s=(cascade|light|lphero)/g, '&s=light'));
                        }}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          previewStyle === 'light'
                            ? 'bg-[#E05A1B] text-white border-[#E05A1B]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        ☀️ Modelo 02 (Claro LP)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewStyle('lphero');
                          setPreviewText((prev) => prev.replace(/&s=(cascade|light|lphero)/g, '&s=lphero'));
                        }}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          previewStyle === 'lphero'
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        💻 Modelo 03 (Hero LP)
                      </button>
                      <a
                        href={`/api/seo/og?slug=${encodeURIComponent(previewArticle.slug)}&style=${previewStyle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#0A66C2] hover:underline flex items-center gap-1 ml-1"
                      >
                        Baixar HD <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm max-w-[480px] mx-auto">
                    <img
                      src={`/api/seo/og?slug=${encodeURIComponent(previewArticle.slug)}&style=${previewStyle}`}
                      alt={previewArticle.title}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>

                {/* Editor de Texto do Post */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                    2. Texto do Post no LinkedIn (Você pode revisar ou editar qualquer palavra abaixo):
                  </label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={12}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs font-medium text-slate-800 leading-relaxed focus:border-[#0A66C2] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <div className="flex flex-wrap items-center gap-2.5">
                  {liOrgId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewText);
                        const companyAdminUrl = `https://www.linkedin.com/company/${liOrgId}/admin/page-posts/published/?share=true`;
                        window.open(companyAdminUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
                    >
                      🏢 Abrir Company Page (Texto Copiado)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      shareDirectOnLinkedIn(previewArticle, previewText);
                      setPreviewArticle(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#0A66C2] text-[#0A66C2] hover:bg-blue-50 text-xs font-bold cursor-pointer"
                  >
                    Abrir no LinkedIn Manualmente
                  </button>
                  <button
                    onClick={handleConfirmPublishLinkedIn}
                    disabled={publishingLi}
                    className="px-5 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles size={15} />
                    {publishingLi
                      ? 'Publicando no LinkedIn...'
                      : liOrgId
                      ? '✅ Confirmar e Publicar (Meu Perfil + Página SmartBid)'
                      : '✅ Confirmar e Publicar Agora no Meu LinkedIn'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
