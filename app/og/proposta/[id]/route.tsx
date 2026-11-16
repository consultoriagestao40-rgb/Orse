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
              // User-Agent antigo para o Google Fonts retornar TTF/WOFF compatível com Satori
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

export async function GET() {
  const interBold = await getInterBoldFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 84px',
          background: 'linear-gradient(135deg, #092920 0%, #0E3A2D 55%, #134838 100%)',
          fontFamily: interBold ? 'Inter' : 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          {/* Ícone quadrado arredondado SmartBid (seta ascendente) */}
          <div
            style={{
              width: '148px',
              height: '148px',
              borderRadius: '36px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '4px solid rgba(52, 211, 153, 0.48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '46px',
              flexShrink: 0,
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17 L9 11 L13 15 L21 7" />
              <path d="M15 7 H21 V13" />
            </svg>
          </div>

          {/* Título executivo em negrito idêntico ao card de referência */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '88px',
              fontWeight: 800,
              letterSpacing: '-2px',
              color: '#FFFFFF',
              lineHeight: 1.08,
            }}
          >
            <span>SmartBid</span>
            <span
              style={{
                marginLeft: '24px',
                marginRight: '24px',
                color: '#6EE7B7',
                fontWeight: 800,
              }}
            >
              ·
            </span>
            <span>Proposta</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
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
