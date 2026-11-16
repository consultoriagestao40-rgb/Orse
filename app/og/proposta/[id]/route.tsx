import React from 'react';
import { ImageResponse } from 'next/og';

let cachedInterBold: Promise<ArrayBuffer | null> | null = null;

function getInterBoldFont(): Promise<ArrayBuffer | null> {
  if (!cachedInterBold) {
    cachedInterBold = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const cssRes = await fetch(
          'https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap',
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
            },
            signal: controller.signal,
          }
        );
        const css = await cssRes.text();
        const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"](?:opentype|truetype|woff)['"]\)/);
        if (!match?.[1]) return null;
        const fontRes = await fetch(match[1], { signal: controller.signal });
        if (!fontRes.ok) return null;
        return await fontRes.arrayBuffer();
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    })();
  }
  return cachedInterBold;
}

/**
 * Miniatura quadrada 256x256 (< 300px) para forçar o Card Compacto nativo do WhatsApp
 * tanto via Z-API (linkType: SMALL) quanto ao colar o link manualmente.
 */
export async function GET() {
  const interBold = await getInterBoldFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '256px',
          height: '256px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #092920 0%, #0F3B2E 55%, #165240 100%)',
          fontFamily: interBold ? 'Inter' : 'sans-serif',
          color: '#FFFFFF',
          padding: '22px',
        }}
      >
        <div
          style={{
            width: '112px',
            height: '112px',
            borderRadius: '28px',
            background: 'rgba(16, 185, 129, 0.18)',
            border: '3px solid rgba(110, 231, 183, 0.50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '18px',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6EE7B7"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17 L9 11 L13 15 L21 7" />
            <path d="M15 7 H21 V13" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '-0.8px',
            color: '#FFFFFF',
            lineHeight: 1,
          }}
        >
          SmartBid
        </div>
      </div>
    ),
    {
      width: 256,
      height: 256,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
      ...(interBold
        ? {
            fonts: [
              {
                name: 'Inter',
                data: interBold,
                style: 'normal' as const,
                weight: 800 as const,
              },
            ],
          }
        : {}),
    }
  );
}
