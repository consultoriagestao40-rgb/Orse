import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const GSC_CONFIG_KEY = '[SEO_GSC_CONFIG]';

let tableInitialized = false;

export async function ensureAnalyticsTable(): Promise<void> {
  if (tableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PublicPageEvent" (
        "id" TEXT PRIMARY KEY,
        "eventType" TEXT NOT NULL,
        "path" TEXT NOT NULL,
        "visitorHash" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "referrer" TEXT,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "device" TEXT NOT NULL DEFAULT 'Desktop',
        "isBot" BOOLEAN NOT NULL DEFAULT FALSE,
        "botName" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PublicPageEvent_createdAt_idx" ON "PublicPageEvent" ("createdAt" DESC);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PublicPageEvent_path_idx" ON "PublicPageEvent" ("path");
    `);
    tableInitialized = true;
  } catch (err) {
    console.warn('Aviso ao inicializar tabela PublicPageEvent:', err);
  }
}

export function detectCrawlerBot(userAgent: string): string | null {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return null;
  if (ua.includes('googlebot') || ua.includes('adsbot-google') || ua.includes('google-inspectiontool')) {
    return 'Googlebot';
  }
  if (ua.includes('gptbot') || ua.includes('chatgpt-user') || ua.includes('oai-searchbot')) {
    return 'ChatGPT / OpenAI';
  }
  if (ua.includes('perplexitybot')) return 'Perplexity IA';
  if (ua.includes('claudebot') || ua.includes('anthropic')) return 'Claude IA';
  if (ua.includes('bingbot')) return 'Bingbot';
  if (ua.includes('linkedinbot')) return 'LinkedInBot';
  if (ua.includes('facebookexternalhit') || ua.includes('meta-externalagent')) return 'Meta Crawler';
  if (ua.includes('whatsapp')) return 'WhatsApp Preview';
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider') || ua.includes('headless')) {
    return 'Outro Robô';
  }
  return null;
}

export function classifyTrafficSource(input: {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  postParam?: string | null;
}): string {
  const ref = String(input.referrer || '').toLowerCase();
  const src = String(input.utmSource || '').toLowerCase();
  const med = String(input.utmMedium || '').toLowerCase();

  if (input.gclid || (src.includes('google') && (med.includes('cpc') || med.includes('paid') || med.includes('ads')))) {
    return 'Google Ads';
  }
  if (src.includes('meta') || (src.includes('fb') && med.includes('paid'))) {
    return 'Meta Ads';
  }
  if (src.includes('instagram') || ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
    return 'Instagram';
  }
  if (input.fbclid || src.includes('facebook') || ref.includes('facebook.com') || ref.includes('fb.com')) {
    return 'Facebook';
  }
  if (src.includes('youtube') || ref.includes('youtube.com') || ref.includes('youtu.be')) {
    return 'YouTube';
  }
  if (input.ttclid || src.includes('tiktok') || ref.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (input.postParam || src.includes('linkedin') || ref.includes('linkedin.com') || ref.includes('lnkd.in')) {
    return 'LinkedIn';
  }
  if (src.includes('whatsapp') || ref.includes('whatsapp.com') || ref.includes('wa.me')) {
    return 'WhatsApp';
  }
  if (
    ref.includes('chatgpt.com') ||
    ref.includes('openai.com') ||
    ref.includes('perplexity.ai') ||
    ref.includes('gemini.google.com') ||
    ref.includes('claude.ai') ||
    src.includes('chatgpt')
  ) {
    return 'IA (ChatGPT / Gemini)';
  }
  if (ref.includes('google.') || src === 'google') {
    return 'Google Orgânico (SEO)';
  }
  if (ref.includes('bing.com') || ref.includes('yahoo.com') || ref.includes('duckduckgo.com')) {
    return 'Bing / Busca Orgânica';
  }
  if (!ref) {
    return 'Acesso Direto';
  }
  try {
    const host = new URL(input.referrer!).hostname.replace(/^www\./, '');
    if (host.includes('smartbidhub.com.br')) return 'Navegação Interna';
    return host.slice(0, 40);
  } catch {
    return 'Acesso Direto';
  }
}

export function buildVisitorHash(visitorId: string | undefined, ip: string, ua: string): string {
  const raw = visitorId && visitorId.length >= 8 ? `vid:${visitorId}` : `ipua:${ip}|${ua}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 20);
}

export async function recordPublicPageEvent(params: {
  eventType: 'PAGE_VIEW' | 'CTA_CLICK';
  path: string;
  visitorHash: string;
  source: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  userAgent?: string | null;
  forceBotName?: string | null;
}): Promise<void> {
  await ensureAnalyticsTable();
  const cleanPath = (params.path || '/').split('?')[0].split('#')[0].slice(0, 180) || '/';
  const ua = params.userAgent || '';
  const botName = params.forceBotName !== undefined ? params.forceBotName : detectCrawlerBot(ua);
  const isBot = Boolean(botName);
  const device = /mobile|android|iphone|ipad/i.test(ua) ? 'Mobile' : 'Desktop';

  try {
    // Evita contagem duplicada em refresh rápido (< 25s) pelo mesmo visitante na mesma rota
    const recent = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "PublicPageEvent"
        WHERE "visitorHash" = $1
          AND "eventType" = $2
          AND "path" = $3
          AND "createdAt" > NOW() - INTERVAL '25 seconds'
        LIMIT 1`,
      params.visitorHash,
      params.eventType,
      cleanPath
    );
    if (recent.length > 0) return;

    const id = `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PublicPageEvent"
        ("id", "eventType", "path", "visitorHash", "source", "referrer", "utmSource", "utmMedium", "utmCampaign", "device", "isBot", "botName")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      id,
      params.eventType,
      cleanPath,
      params.visitorHash,
      params.source || 'Acesso Direto',
      params.referrer ? String(params.referrer).slice(0, 220) : null,
      params.utmSource ? String(params.utmSource).slice(0, 80) : null,
      params.utmMedium ? String(params.utmMedium).slice(0, 80) : null,
      params.utmCampaign ? String(params.utmCampaign).slice(0, 120) : null,
      device,
      isBot,
      botName
    );
  } catch (err) {
    console.warn('Aviso ao gravar PublicPageEvent:', err);
  }
}

export async function getPublicAnalyticsSummary(days = 30) {
  await ensureAnalyticsTable();
  const safeDays = Math.min(90, Math.max(1, Number(days) || 30));
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const [humanRows, botRows, dailyRows, newTenantsCount, newLeadsCount] = await Promise.all([
    prisma.$queryRawUnsafe<
      Array<{
        eventType: string;
        path: string;
        visitorHash: string;
        source: string;
        device: string;
      }>
    >(
      `SELECT "eventType", "path", "visitorHash", "source", "device"
         FROM "PublicPageEvent"
        WHERE "isBot" = FALSE
          AND "createdAt" >= $1`,
      since
    ),
    prisma.$queryRawUnsafe<Array<{ path: string; botName: string | null }>>(
      `SELECT "path", COALESCE("botName", 'Robô') AS "botName"
         FROM "PublicPageEvent"
        WHERE "isBot" = TRUE
          AND "createdAt" >= $1`,
      since
    ),
    prisma.$queryRawUnsafe<
      Array<{ day: string; lpViews: number; seoViews: number }>
    >(
      `SELECT TO_CHAR("createdAt" AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
              COUNT(*) FILTER (WHERE "path" IN ('/', '/lp'))::int AS "lpViews",
              COUNT(*) FILTER (WHERE "path" LIKE '/conteudos%')::int AS "seoViews"
         FROM "PublicPageEvent"
        WHERE "isBot" = FALSE
          AND "eventType" = 'PAGE_VIEW'
          AND "createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY 1
        ORDER BY 1 ASC`
    ),
    prisma.tenant.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.saasLead.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
  ]);

  const pageViews = humanRows.filter((r) => r.eventType === 'PAGE_VIEW');
  const ctaClicks = humanRows.filter((r) => r.eventType === 'CTA_CLICK');

  const lpViewsRows = pageViews.filter((r) => r.path === '/' || r.path === '/lp');
  const seoViewsRows = pageViews.filter((r) => r.path === '/conteudos' || r.path.startsWith('/conteudos/'));
  const cadastroViewsRows = pageViews.filter((r) => r.path.startsWith('/cadastro'));

  const totalUniqueVisitors = new Set(pageViews.map((r) => r.visitorHash)).size;
  const lpUniqueVisitors = new Set(lpViewsRows.map((r) => r.visitorHash)).size;
  const seoUniqueVisitors = new Set(seoViewsRows.map((r) => r.visitorHash)).size;

  // Origens de tráfego (excluindo Navegação Interna quando houver outras origens, ou mantendo limpo)
  const sourceMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (const r of pageViews) {
    if (r.source === 'Navegação Interna') continue;
    const cur = sourceMap.get(r.source) || { views: 0, visitors: new Set<string>() };
    cur.views += 1;
    cur.visitors.add(r.visitorHash);
    sourceMap.set(r.source, cur);
  }
  const sources = Array.from(sourceMap.entries())
    .map(([source, v]) => ({
      source,
      views: v.views,
      uniqueVisitors: v.visitors.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Top páginas
  const pageMap = new Map<string, { views: number; visitors: Set<string>; ctas: number }>();
  for (const r of pageViews) {
    const normPath = r.path === '/' ? '/lp' : r.path;
    const cur = pageMap.get(normPath) || { views: 0, visitors: new Set<string>(), ctas: 0 };
    cur.views += 1;
    cur.visitors.add(r.visitorHash);
    pageMap.set(normPath, cur);
  }
  for (const c of ctaClicks) {
    const normPath = c.path === '/' ? '/lp' : c.path;
    const cur = pageMap.get(normPath) || { views: 0, visitors: new Set<string>(), ctas: 0 };
    cur.ctas += 1;
    pageMap.set(normPath, cur);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([path, v]) => ({
      path,
      views: v.views,
      uniqueVisitors: v.visitors.size,
      ctaClicks: v.ctas,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  // Mapa por artigo (/conteudos/[slug])
  const articleStats: Record<string, { views: number; uniqueVisitors: number; botCrawls: number }> = {};
  const artVisitors = new Map<string, Set<string>>();
  for (const r of seoViewsRows) {
    if (!r.path.startsWith('/conteudos/')) continue;
    const slug = r.path.replace('/conteudos/', '').trim();
    if (!slug) continue;
    if (!articleStats[slug]) articleStats[slug] = { views: 0, uniqueVisitors: 0, botCrawls: 0 };
    articleStats[slug].views += 1;
    if (!artVisitors.has(slug)) artVisitors.set(slug, new Set());
    artVisitors.get(slug)!.add(r.visitorHash);
  }
  for (const [slug, set] of artVisitors.entries()) {
    if (articleStats[slug]) articleStats[slug].uniqueVisitors = set.size;
  }

  // Bots / Crawlers de SEO & IA
  const botBreakdownMap = new Map<string, number>();
  for (const b of botRows) {
    const name = b.botName || 'Robô';
    botBreakdownMap.set(name, (botBreakdownMap.get(name) || 0) + 1);
    if (b.path.startsWith('/conteudos/')) {
      const slug = b.path.replace('/conteudos/', '').trim();
      if (slug) {
        if (!articleStats[slug]) articleStats[slug] = { views: 0, uniqueVisitors: 0, botCrawls: 0 };
        articleStats[slug].botCrawls += 1;
      }
    }
  }
  const botBreakdown = Array.from(botBreakdownMap.entries())
    .map(([bot, hits]) => ({ bot, hits }))
    .sort((a, b) => b.hits - a.hits);

  // Série dos últimos 14 dias preenchida sem buracos
  const dailyMap = new Map(dailyRows.map((d) => [d.day, d]));
  const dailySeries: Array<{ date: string; label: string; lpViews: number; seoViews: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = dt.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const [yyyy, mm, dd] = key.split('-');
    const found = dailyMap.get(key);
    dailySeries.push({
      date: key,
      label: `${dd}/${mm}`,
      lpViews: Number(found?.lpViews || 0),
      seoViews: Number(found?.seoViews || 0),
    });
  }

  const mobileCount = pageViews.filter((r) => r.device === 'Mobile').length;
  const mobileSharePct = pageViews.length > 0 ? Math.round((mobileCount / pageViews.length) * 100) : 0;

  return {
    days: safeDays,
    totals: {
      totalPageViews: pageViews.length,
      totalUniqueVisitors,
      lpViews: lpViewsRows.length,
      lpUniqueVisitors,
      seoViews: seoViewsRows.length,
      seoUniqueVisitors,
      cadastroViews: cadastroViewsRows.length,
      ctaClicks: ctaClicks.length,
      newTenantsCount,
      newLeadsCount,
      botCrawlsTotal: botRows.length,
      mobileSharePct,
    },
    sources,
    topPages,
    articleStats,
    botBreakdown,
    dailySeries,
  };
}

// ============================================================================
// GOOGLE SEARCH CONSOLE (GSC) OFFICIAL API INTEGRATION
// ============================================================================

export interface GscStoredConfig {
  refreshToken?: string;
  accessToken?: string;
  connectedEmail?: string;
  siteUrl?: string;
  updatedAt?: string;
}

export async function getGscConfig(): Promise<GscStoredConfig> {
  try {
    const rec = await prisma.faqPadrao.findFirst({
      where: { pergunta: GSC_CONFIG_KEY },
    });
    if (rec?.resposta) {
      return JSON.parse(rec.resposta) as GscStoredConfig;
    }
  } catch {}
  return {};
}

export async function saveGscConfig(partial: Partial<GscStoredConfig>): Promise<GscStoredConfig> {
  const current = await getGscConfig();
  const merged: GscStoredConfig = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  await prisma.faqPadrao.deleteMany({ where: { pergunta: GSC_CONFIG_KEY } });
  await prisma.faqPadrao.create({
    data: {
      pergunta: GSC_CONFIG_KEY,
      resposta: JSON.stringify(merged),
      ordem: -997,
      tenantId: null,
    },
  });
  return merged;
}

export async function disconnectGscConfig(): Promise<void> {
  await prisma.faqPadrao.deleteMany({ where: { pergunta: GSC_CONFIG_KEY } });
}

export async function fetchGoogleSearchConsoleData(days = 28) {
  const cfg = await getGscConfig();
  if (!cfg.refreshToken) {
    return { connected: false as const };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { connected: false as const, error: 'Credenciais GOOGLE_CLIENT_ID / SECRET ausentes.' };
  }

  try {
    const tkRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: cfg.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tk = await tkRes.json();
    if (!tk.access_token) {
      return {
        connected: false as const,
        error: tk.error_description || tk.error || 'Token expirado — reconecte o Search Console.',
      };
    }

    const authHeader = {
      Authorization: `Bearer ${tk.access_token}`,
      'Content-Type': 'application/json',
    };

    // Descobre a propriedade verificada do smartbidhub.com.br na conta Google conectada
    let siteUrl = cfg.siteUrl || '';
    const sitesRes = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
      headers: authHeader,
    });
    const sitesJson = await sitesRes.json();
    if (sitesJson?.error) {
      const msg = String(sitesJson.error.message || '');
      if (msg.includes('has not been used in project') || sitesJson.error.status === 'PERMISSION_DENIED') {
        return {
          connected: true as const,
          connectedEmail: cfg.connectedEmail || null,
          siteUrl: 'https://www.smartbidhub.com.br/',
          error:
            'Falta apenas ativar a "Google Search Console API" em 1 clique no seu Google Cloud: acesse console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=10625014463 e clique em ATIVAR.',
        };
      }
      return {
        connected: true as const,
        connectedEmail: cfg.connectedEmail || null,
        error: msg || 'Erro retornado pela API do Google Search Console.',
      };
    }

    const entries: Array<{ siteUrl: string; permissionLevel: string }> = sitesJson?.siteEntry || [];

    const preferred = [
      'https://www.smartbidhub.com.br/',
      'sc-domain:smartbidhub.com.br',
      'https://smartbidhub.com.br/',
    ];
    const matched =
      entries.find((e) => preferred.includes(e.siteUrl)) ||
      entries.find((e) => e.siteUrl.includes('smartbidhub.com.br')) ||
      entries[0];

    if (matched?.siteUrl) {
      siteUrl = matched.siteUrl;
      if (siteUrl !== cfg.siteUrl) {
        await saveGscConfig({ siteUrl });
      }
    }

    if (!siteUrl) {
      return {
        connected: true as const,
        connectedEmail: cfg.connectedEmail || null,
        siteUrl: null,
        availableSites: entries.map((e) => e.siteUrl),
        error:
          'Nenhuma propriedade smartbidhub.com.br encontrada nesta conta Google. Verifique se conectou o mesmo e-mail usado no Google Search Console.',
      };
    }

    const endDt = new Date();
    const startDt = new Date(Date.now() - Math.min(90, Math.max(7, days)) * 24 * 60 * 60 * 1000);
    const startDate = startDt.toISOString().slice(0, 10);
    const endDate = endDt.toISOString().slice(0, 10);
    const encodedSite = encodeURIComponent(siteUrl);

    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ startDate, endDate }),
      }),
      fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 15 }),
      }),
      fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 10 }),
      }),
    ]);

    const [totalsJson, queriesJson, pagesJson] = await Promise.all([
      totalsRes.json(),
      queriesRes.json(),
      pagesRes.json(),
    ]);

    const tRow = totalsJson?.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    return {
      connected: true as const,
      connectedEmail: cfg.connectedEmail || null,
      siteUrl,
      startDate,
      endDate,
      totals: {
        clicks: Number(tRow.clicks || 0),
        impressions: Number(tRow.impressions || 0),
        ctrPct: Number(((tRow.ctr || 0) * 100).toFixed(2)),
        avgPosition: tRow.position ? Number(Number(tRow.position).toFixed(1)) : 0,
      },
      topQueries: (queriesJson?.rows || []).map((r: any) => ({
        query: r.keys?.[0] || '',
        clicks: Number(r.clicks || 0),
        impressions: Number(r.impressions || 0),
        ctrPct: Number(((r.ctr || 0) * 100).toFixed(1)),
        position: Number(Number(r.position || 0).toFixed(1)),
      })),
      topPages: (pagesJson?.rows || []).map((r: any) => ({
        page: String(r.keys?.[0] || '').replace(/^https?:\/\/(www\.)?smartbidhub\.com\.br/, '') || '/',
        clicks: Number(r.clicks || 0),
        impressions: Number(r.impressions || 0),
        position: Number(Number(r.position || 0).toFixed(1)),
      })),
    };
  } catch (err: any) {
    return {
      connected: true as const,
      connectedEmail: cfg.connectedEmail || null,
      error: err?.message || 'Falha ao consultar Google Search Console.',
    };
  }
}
