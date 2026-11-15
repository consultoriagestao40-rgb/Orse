import crypto from 'crypto';

export interface MarketingAttribution {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  ttclid?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  firstTouchAt?: string | null;
  convertedAt?: string | null;
}

export interface AttributionSummary {
  channel: 'META_ADS' | 'GOOGLE_ADS' | 'TIKTOK_ADS' | 'LINKEDIN' | 'ORGANICO';
  saasOrigem: 'META_ADS' | 'GOOGLE_ADS' | 'LP';
  shortBadge: string;
  fullSummary: string;
}

function cleanStr(v: unknown, maxLen = 180): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, maxLen) : null;
}

export function sanitizeAttribution(raw?: Record<string, any> | null): MarketingAttribution | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: MarketingAttribution = {
    utmSource: cleanStr(raw.utmSource ?? raw.utm_source, 100),
    utmMedium: cleanStr(raw.utmMedium ?? raw.utm_medium, 100),
    utmCampaign: cleanStr(raw.utmCampaign ?? raw.utm_campaign, 160),
    utmContent: cleanStr(raw.utmContent ?? raw.utm_content, 160),
    utmTerm: cleanStr(raw.utmTerm ?? raw.utm_term, 160),
    fbclid: cleanStr(raw.fbclid, 220),
    gclid: cleanStr(raw.gclid, 220),
    ttclid: cleanStr(raw.ttclid, 220),
    fbc: cleanStr(raw.fbc, 260),
    fbp: cleanStr(raw.fbp, 160),
    landingPage: cleanStr(raw.landingPage, 240),
    referrer: cleanStr(raw.referrer, 240),
    firstTouchAt: cleanStr(raw.firstTouchAt, 60),
    convertedAt: cleanStr(raw.convertedAt, 60) || new Date().toISOString(),
  };

  const hasAny = Object.entries(out).some(([k, val]) => k !== 'convertedAt' && Boolean(val));
  return hasAny ? out : null;
}

function readCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return null;
}

export function extractAttributionFromRequest(
  request: Request,
  bodyAttribution?: Record<string, any> | null
): MarketingAttribution | null {
  const cookieHeader = request.headers.get('cookie');
  let cookieAttr: Record<string, any> | null = null;
  const rawCookie = readCookieFromHeader(cookieHeader, 'sb_attr');
  if (rawCookie) {
    try {
      cookieAttr = JSON.parse(rawCookie);
    } catch {
      cookieAttr = null;
    }
  }

  const fbcCookie = readCookieFromHeader(cookieHeader, '_fbc');
  const fbpCookie = readCookieFromHeader(cookieHeader, '_fbp');

  const merged: Record<string, any> = {
    ...(cookieAttr || {}),
    ...(bodyAttribution || {}),
  };
  if (!merged.fbc && fbcCookie) merged.fbc = fbcCookie;
  if (!merged.fbp && fbpCookie) merged.fbp = fbpCookie;
  if (!merged.fbc && merged.fbclid) {
    merged.fbc = `fb.1.${Date.now()}.${merged.fbclid}`;
  }

  return sanitizeAttribution(merged);
}

export function summarizeAttribution(attr?: MarketingAttribution | null): AttributionSummary {
  if (!attr) {
    return {
      channel: 'ORGANICO',
      saasOrigem: 'LP',
      shortBadge: '🌐 Direto / Orgânico',
      fullSummary: 'Acesso Direto / Orgânico (sem UTM)',
    };
  }

  const src = (attr.utmSource || '').toLowerCase();
  const med = (attr.utmMedium || '').toLowerCase();
  const ref = (attr.referrer || '').toLowerCase();
  const isPaidMedium = /(cpc|ppc|paid|ads|cpm|social_paid|trafego|meta_ads|google_ads)/i.test(med);

  let channel: AttributionSummary['channel'] = 'ORGANICO';
  let saasOrigem: AttributionSummary['saasOrigem'] = 'LP';
  let prefix = '🌐 Orgânico';

  if (
    attr.fbclid ||
    /(facebook|instagram|meta|fb|ig)/i.test(src) && (isPaidMedium || Boolean(attr.utmCampaign))
  ) {
    channel = 'META_ADS';
    saasOrigem = 'META_ADS';
    prefix = '📣 Meta Ads';
  } else if (attr.gclid || (/google/i.test(src) && (isPaidMedium || Boolean(attr.utmCampaign)))) {
    channel = 'GOOGLE_ADS';
    saasOrigem = 'GOOGLE_ADS';
    prefix = '🔍 Google Ads';
  } else if (attr.ttclid || /tiktok/i.test(src)) {
    channel = 'TIKTOK_ADS';
    saasOrigem = 'LP';
    prefix = '🎵 TikTok';
  } else if (/linkedin/i.test(src) || /linkedin\.com/i.test(ref)) {
    channel = 'LINKEDIN';
    saasOrigem = 'LP';
    prefix = '💼 LinkedIn';
  } else if (/(instagram|facebook|youtube|google|tiktok)/i.test(src || ref)) {
    const labelSrc = attr.utmSource || ref.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    prefix = `🌱 Orgânico (${labelSrc})`;
  }

  const detail = attr.utmContent || attr.utmTerm || attr.utmCampaign || attr.utmSource || '';
  const shortBadge = detail ? `${prefix} · ${detail.slice(0, 34)}` : prefix;

  const parts: string[] = [prefix];
  if (attr.utmSource || attr.utmMedium) {
    parts.push(`(${[attr.utmSource, attr.utmMedium].filter(Boolean).join(' / ')})`);
  }
  if (attr.utmCampaign) parts.push(`Campanha: ${attr.utmCampaign}`);
  if (attr.utmContent) parts.push(`Criativo: ${attr.utmContent}`);
  if (attr.utmTerm) parts.push(`Termo: ${attr.utmTerm}`);
  if (attr.landingPage) parts.push(`Entrada: ${attr.landingPage}`);

  return {
    channel,
    saasOrigem,
    shortBadge,
    fullSummary: parts.join(' • '),
  };
}

function sha256Lower(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

function sha256Phone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return crypto.createHash('sha256').update(digits).digest('hex');
}

export interface SendMetaCapiParams {
  eventName: 'StartTrial' | 'CompleteRegistration' | 'Lead';
  eventId?: string | null;
  request?: Request;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  eventSourceUrl?: string | null;
  attribution?: MarketingAttribution | null;
  customData?: Record<string, any>;
}

/**
 * Envia eventos server-side pela Meta Conversions API (CAPI) com desduplicação via event_id
 * e dados de usuário com hash SHA-256 (Event Match Quality máximo para iOS / AdBlock).
 */
export async function sendMetaCapiEvent(params: SendMetaCapiParams): Promise<{ sent: boolean; reason?: string }> {
  try {
    const pixelId = (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || '1173511775363452').trim();
    let accessToken = (process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '').trim();

    if (!accessToken) {
      try {
        const { getLinkedInConfig } = await import('@/lib/seo-engine');
        const cfg = await getLinkedInConfig();
        accessToken = (cfg.metaAccessToken || '').trim();
      } catch {
        // segue sem token se não configurado
      }
    }

    if (!pixelId || !accessToken) {
      return { sent: false, reason: 'META_CAPI_ACCESS_TOKEN_NOT_SET' };
    }

    const nameParts = (params.fullName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const forwardedFor = params.request?.headers.get('x-forwarded-for') || '';
    const clientIp =
      forwardedFor.split(',')[0]?.trim() ||
      params.request?.headers.get('x-real-ip')?.trim() ||
      undefined;
    const userAgent = params.request?.headers.get('user-agent') || undefined;
    const refererHeader = params.request?.headers.get('referer') || undefined;

    const userData: Record<string, any> = {
      country: [sha256Lower('br')],
    };
    const em = sha256Lower(params.email);
    const ph = sha256Phone(params.phone);
    const fn = sha256Lower(firstName);
    const ln = sha256Lower(lastName);

    if (em) userData.em = [em];
    if (ph) userData.ph = [ph];
    if (fn) userData.fn = [fn];
    if (ln) userData.ln = [ln];
    if (clientIp) userData.client_ip_address = clientIp;
    if (userAgent) userData.client_user_agent = userAgent;
    if (params.attribution?.fbc) userData.fbc = params.attribution.fbc;
    if (params.attribution?.fbp) userData.fbp = params.attribution.fbp;

    const payload: Record<string, any> = {
      data: [
        {
          event_name: params.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          ...(params.eventId ? { event_id: params.eventId } : {}),
          event_source_url:
            params.eventSourceUrl ||
            refererHeader ||
            (params.attribution?.landingPage
              ? `https://www.smartbidhub.com.br${params.attribution.landingPage}`
              : 'https://www.smartbidhub.com.br/cadastro'),
          user_data: userData,
          custom_data: {
            currency: 'BRL',
            value: params.eventName === 'StartTrial' ? 149 : 0,
            ...(params.customData || {}),
          },
        },
      ],
    };

    if (process.env.META_CAPI_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE.trim();
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errTxt = await res.text();
      console.warn(`[Meta CAPI] Aviso (${res.status}) em ${params.eventName}:`, errTxt.slice(0, 200));
      return { sent: false, reason: `HTTP_${res.status}` };
    }

    return { sent: true };
  } catch (err: any) {
    console.warn('[Meta CAPI] Falha silenciosa:', err?.message || err);
    return { sent: false, reason: 'NETWORK_ERROR' };
  }
}
