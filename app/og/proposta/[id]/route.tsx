import React from 'react';
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

let cachedInterBold: Promise<ArrayBuffer | null> | null = null;

function getInterBoldFont(): Promise<ArrayBuffer | null> {
  if (!cachedInterBold) {
    cachedInterBold = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      try {
        const cssRes = await fetch(
          'https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap',
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
 * Faixa horizontal compacta (1040x260) estilo "SmartBid · Proposta | FPV-XXX-RXX"
 * enviada no topo do balão do WhatsApp (idêntica no celular e no computador).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cleanId = id.replace(/\.png$/i, '').trim();

  let codeBadge = '';
  try {
    const doc: any = await (prisma.documentoProposta as any).findUnique({
      where: { id: cleanId },
      select: {
        versaoFPV: true,
        proposta: {
          select: {
            numero: true,
            versoes: {
              orderBy: { versao: 'desc' },
              take: 1,
              select: { versao: true },
            },
          },
        },
      },
    });
    if (doc?.proposta?.numero) {
      const num = String(doc.proposta.numero).padStart(3, '0');
      const rev = String(doc.versaoFPV || doc.proposta?.versoes?.[0]?.versao || 1).padStart(2, '0');
      codeBadge = `FPV-${num} · R${rev}`;
    }
  } catch {}

  const interBold = await getInterBoldFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '1040px',
          height: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          background: 'linear-gradient(135deg, #092920 0%, #0E3A2D 55%, #144B3A 100%)',
          fontFamily: interBold ? 'Inter' : 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        {/* Esquerda: Ícone + SmartBid · Proposta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '104px',
              height: '104px',
              borderRadius: '26px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '3.5px solid rgba(110, 231, 183, 0.48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '32px',
              flexShrink: 0,
            }}
          >
            <svg
              width="56"
              height="56"
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
              fontSize: codeBadge ? '52px' : '60px',
              fontWeight: 800,
              letterSpacing: '-1.2px',
              color: '#FFFFFF',
              lineHeight: 1.1,
            }}
          >
            <span>SmartBid</span>
            <span
              style={{
                marginLeft: '16px',
                marginRight: '16px',
                color: '#6EE7B7',
                fontWeight: 800,
              }}
            >
              ·
            </span>
            <span>Proposta</span>
          </div>
        </div>

        {/* Direita: Número da Proposta (ex.: FPV-063 · R01) */}
        {codeBadge ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 26px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '2.5px solid rgba(110, 231, 183, 0.42)',
              fontSize: '28px',
              fontWeight: 800,
              color: '#A7F3D0',
              letterSpacing: '0.6px',
            }}
          >
            {codeBadge}
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1040,
      height: 260,
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
