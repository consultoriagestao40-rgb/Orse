'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    try {
      if ((window as any).fbq) {
        (window as any).fbq('track', eventName, params);
      }
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, params);
      }
      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({ event: eventName, ...params });
      }
    } catch (e) {
      console.warn('Erro ao disparar evento de rastreamento:', e);
    }
  }
};

export default function TrackingScripts() {
  const pathname = usePathname();
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1461716489357692';
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18569676536';
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-58WGWGVG';

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
      {/* Google Tag Manager (GTM) */}
      {gtmId && (
        <>
          <Script id="google-gtm-init" strategy="afterInteractive">
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

      {/* Google Tag (Analytics & Google Ads) */}
      {(googleAdsId || gaId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId || gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${gaId ? `gtag('config', '${gaId}');` : ''}
              ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel (Facebook & Instagram Ads) */}
      {metaPixelId && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
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
