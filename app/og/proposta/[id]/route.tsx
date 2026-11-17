import React from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

let cachedSymbolDataUri: string | null = null;
let cachedInterBold: Promise<ArrayBuffer | null> | null = null;

async function getSymbolDataUri(): Promise<string> {
  if (!cachedSymbolDataUri) {
    const filePath = path.join(process.cwd(), 'public', 'smartbid-symbol.png');
    const buf = await fs.readFile(filePath);
    cachedSymbolDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return cachedSymbolDataUri;
}

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
 * Faixa baixa horizontal (1100x240) com conteúdo agrupado no centro (~480px de largura útil),
 * reduzindo em mais de 55% a altura do topo no WhatsApp sem nunca cortar as laterais no celular ou PC.
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

  const [symbolUri, interBold] = await Promise.all([
    getSymbolDataUri(),
    getInterBoldFont(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1100px',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#07271C',
          fontFamily: interBold ? 'Inter' : 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        {/* Linha única compacta centralizada (~480px total) para nunca cortar nas bordas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={symbolUri}
            width={72}
            height={72}
            style={{
              width: '72px',
              height: '72px',
              marginRight: '14px',
              borderRadius: '16px',
            }}
          />
          <span
            style={{
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-0.9px',
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            SmartBidHub
          </span>

          {codeBadge ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '20px',
                padding: '9px 20px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1.8px solid rgba(110, 231, 183, 0.45)',
                fontSize: '21px',
                fontWeight: 800,
                color: '#A7F3D0',
                letterSpacing: '0.6px',
              }}
            >
              {codeBadge}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1100,
      height: 240,
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
