'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const ATTR_STORAGE_KEY = 'sb_marketing_attr_v1';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1173511775363452';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18569676536';
const GOOGLE_ADS_TRIAL_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_TRIAL_LABEL ||
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ||
  '';
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || '';

export interface ClientAttribution {
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

export interface TrackEventOptions {
  eventId?: string;
  userData?: {
    email?: string;
    phone?: string;
  };
}

function getBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

export function generateEventId(prefix = 'sb'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function captureAttributionFromUrl(): ClientAttribution {
  if (typeof window === 'undefined') return {};
  try {
    let stored: ClientAttribution = {};
    const rawStored = window.localStorage.getItem(ATTR_STORAGE_KEY);
    if (rawStored) {
      try {
        stored = JSON.parse(rawStored) || {};
      } catch {
        stored = {};
      }
    }

    const sp = new URLSearchParams(window.location.search || '');
    const utmSource = sp.get('utm_source');
    const utmMedium = sp.get('utm_medium');
    const utmCampaign = sp.get('utm_campaign');
    const utmContent = sp.get('utm_content');
    const utmTerm = sp.get('utm_term');
    const fbclid = sp.get('fbclid');
    const gclid = sp.get('gclid');
    const ttclid = sp.get('ttclid');

    const hasNewAdParams = Boolean(
      utmSource || utmMedium || utmCampaign || utmContent || utmTerm || fbclid || gclid || ttclid
    );

    const fbcCookie = getBrowserCookie('_fbc');
    const fbpCookie = getBrowserCookie('_fbp');
    const computedFbc =
      fbcCookie ||
      (fbclid ? `fb.1.${Date.now()}.${fbclid}` : stored.fbc || null);

    let externalReferrer = stored.referrer || null;
    if (!externalReferrer && typeof document !== 'undefined' && document.referrer) {
      try {
        const refHost = new URL(document.referrer).hostname;
        if (refHost && refHost !== window.location.hostname) {
          externalReferrer = document.referrer.slice(0, 220);
        }
      } catch {
        // ignora referrer inválido
      }
    }

    const nextAttr: ClientAttribution = {
      utmSource: utmSource || stored.utmSource || null,
      utmMedium: utmMedium || stored.utmMedium || null,
      utmCampaign: utmCampaign || stored.utmCampaign || null,
      utmContent: utmContent || stored.utmContent || null,
      utmTerm: utmTerm || stored.utmTerm || null,
      fbclid: fbclid || stored.fbclid || null,
      gclid: gclid || stored.gclid || null,
      ttclid: ttclid || stored.ttclid || null,
      fbc: computedFbc,
      fbp: fbpCookie || stored.fbp || null,
      landingPage:
        (hasNewAdParams || !stored.landingPage)
          ? `${window.location.pathname}${window.location.search}`.slice(0, 220)
          : stored.landingPage,
      referrer: externalReferrer,
      firstTouchAt: stored.firstTouchAt || new Date().toISOString(),
    };

    const serialized = JSON.stringify(nextAttr);
    window.localStorage.setItem(ATTR_STORAGE_KEY, serialized);
    document.cookie = `sb_attr=${encodeURIComponent(serialized)}; Path=/; Max-Age=2592000; SameSite=Lax`;
    if (fbclid && !fbcCookie && computedFbc) {
      document.cookie = `_fbc=${computedFbc}; Path=/; Max-Age=7776000; SameSite=Lax`;
    }
    return nextAttr;
  } catch {
    return {};
  }
}

export function getClientAttribution(): ClientAttribution {
  const current = captureAttributionFromUrl();
  return {
    ...current,
    fbc: getBrowserCookie('_fbc') || current.fbc || null,
    fbp: getBrowserCookie('_fbp') || current.fbp || null,
    convertedAt: new Date().toISOString(),
  };
}

const VISITOR_STORAGE_KEY = 'sb_visitor_id_v1';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let vid = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return '';
  }
}

export function sendFirstPartyAnalytics(eventType: 'PAGE_VIEW' | 'CTA_CLICK', customPath?: string) {
  if (typeof window === 'undefined') return;
  try {
    const pathname = customPath || window.location.pathname || '/';
    // Se o usuário já está logado no sistema e abriu '/', ele vê o Dashboard interno e não a LP
    if (pathname === '/' && getBrowserCookie('sb_user')) return;
    if (
      pathname !== '/' &&
      pathname !== '/lp' &&
      !pathname.startsWith('/cadastro') &&
      !pathname.startsWith('/conteudos')
    ) {
      return;
    }

    const sp = new URLSearchParams(window.location.search || '');
    const attr = getClientAttribution();
    const payload = JSON.stringify({
      eventType,
      path: pathname,
      visitorId: getOrCreateVisitorId(),
      referrer: document.referrer || attr.referrer || null,
      utmSource: sp.get('utm_source') || attr.utmSource || null,
      utmMedium: sp.get('utm_medium') || attr.utmMedium || null,
      utmCampaign: sp.get('utm_campaign') || attr.utmCampaign || null,
      fbclid: sp.get('fbclid') || attr.fbclid || null,
      gclid: sp.get('gclid') || attr.gclid || null,
      ttclid: sp.get('ttclid') || attr.ttclid || null,
      postParam: sp.get('post') || null,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/public/analytics', blob);
    } else {
      fetch('/api/public/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export const trackEvent = (
  eventName: string,
  params?: Record<string, any>,
  options?: TrackEventOptions
) => {
  if (typeof window !== 'undefined') {
    try {
      const eventId = options?.eventId;
      const attr = getClientAttribution();

      if (['InitiateCheckout', 'Lead', 'CompleteRegistration', 'StartTrial'].includes(eventName)) {
        sendFirstPartyAnalytics('CTA_CLICK');
      }

      // 1. Meta Pixel (com eventID para desduplicar 100% com a Meta Conversions API do servidor)
      if ((window as any).fbq) {
        if (eventId) {
          (window as any).fbq('track', eventName, params || {}, { eventID: eventId });
        } else {
          (window as any).fbq('track', eventName, params || {});
        }
      }

      // 2. Google Ads / GA4 + Enhanced Conversions
      if ((window as any).gtag) {
        if (options?.userData?.email || options?.userData?.phone) {
          const digits = (options.userData.phone || '').replace(/\D/g, '');
          const e164Phone =
            digits.length === 10 || digits.length === 11
              ? `+55${digits}`
              : digits.startsWith('55')
              ? `+${digits}`
              : undefined;
          (window as any).gtag('set', 'user_data', {
            ...(options.userData.email ? { email: options.userData.email.trim().toLowerCase() } : {}),
            ...(e164Phone ? { phone_number: e164Phone } : {}),
          });
        }

        (window as any).gtag('event', eventName, {
          ...(params || {}),
          ...(eventId ? { transaction_id: eventId } : {}),
        });

        // Disparo dedicado de Conversão do Google Ads quando o rótulo estiver configurado
        if (eventName === 'StartTrial' && GOOGLE_ADS_ID && GOOGLE_ADS_TRIAL_LABEL) {
          (window as any).gtag('event', 'conversion', {
            send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_TRIAL_LABEL}`,
            value: 149.0,
            currency: 'BRL',
            ...(eventId ? { transaction_id: eventId } : {}),
          });
        } else if (eventName === 'Lead' && GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL) {
          (window as any).gtag('event', 'conversion', {
            send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}`,
            value: 50.0,
            currency: 'BRL',
            ...(eventId ? { transaction_id: eventId } : {}),
          });
        }
      }

      // 3. Google Tag Manager (GTM dataLayer enriquecido com UTMs + Click IDs + event_id)
      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: eventName,
          ...(eventId ? { event_id: eventId } : {}),
          utm_source: attr.utmSource || undefined,
          utm_medium: attr.utmMedium || undefined,
          utm_campaign: attr.utmCampaign || undefined,
          utm_content: attr.utmContent || undefined,
          utm_term: attr.utmTerm || undefined,
          gclid: attr.gclid || undefined,
          fbclid: attr.fbclid || undefined,
          ...(params || {}),
        });
      }
    } catch (e) {
      console.warn('Erro ao disparar evento de rastreamento:', e);
    }
  }
};

export default function TrackingScripts() {
  const pathname = usePathname();
  const metaPixelId = META_PIXEL_ID;
  const googleAdsId = GOOGLE_ADS_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-58WGWGVG';

  // Captura UTMs, fbclid, gclid, ttclid e referrer assim que o visitante aterrissa em qualquer página pública
  useEffect(() => {
    captureAttributionFromUrl();
    sendFirstPartyAnalytics('PAGE_VIEW', pathname || '/');
  }, [pathname]);

  // Não ativa scripts de marketing e tráfego pago em telas internas corporativas
  const isInternal = pathname?.startsWith('/admin') || 
                     pathname?.startsWith('/leads') || 
                     pathname?.startsWith('/propostas') || 
                     pathname?.startsWith('/contratos') || 
                     pathname?.startsWith('/ccts') ||
                     pathname?.startsWith('/api');

  if (isInternal) return null;

  return (
    <>
      {/* Google Tag Manager (GTM) — lazyOnload para zero Total Blocking Time no PageSpeed */}
      {gtmId && (
        <>
          <Script id="google-gtm-init" strategy="lazyOnload">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Google Tag (Analytics & Google Ads com Enhanced Conversions habilitado) */}
      {(googleAdsId || gaId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId || gaId}`}
            strategy="lazyOnload"
          />
          <Script id="google-gtag-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaId ? `gtag('config', '${gaId}');` : ''}
              ${googleAdsId ? `gtag('config', '${googleAdsId}', { 'allow_enhanced_conversions': true });` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel (Facebook & Instagram Ads) */}
      {metaPixelId && (
        <>
          <Script id="meta-pixel-init" strategy="lazyOnload">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
