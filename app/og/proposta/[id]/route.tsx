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
 * Header oficial SmartBidHub (600x340, fundo #07271C idêntico ao logo oficial 3D)
 * com lockup centralizado na zona segura (330px) para nunca cortar em 1:1, 4:3 ou 1.91:1 no celular ou PC.
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
          width: '600px',
          height: '340px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#07271C',
          fontFamily: interBold ? 'Inter' : 'sans-serif',
          color: '#FFFFFF',
          padding: '24px',
        }}
      >
        {/* Logo Oficial 3D S + SmartBidHub */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={symbolUri}
            width={76}
            height={76}
            style={{
              width: '76px',
              height: '76px',
              marginRight: '14px',
              borderRadius: '16px',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '34px',
                fontWeight: 800,
                letterSpacing: '-0.9px',
                color: '#FFFFFF',
                lineHeight: 1.05,
              }}
            >
              SmartBidHub
            </span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1.6px',
                color: '#6EE7B7',
                marginTop: '4px',
                textTransform: 'uppercase',
              }}
            >
              Proposta Comercial
            </span>
          </div>
        </div>

        {/* Pílula centralizada com o número real da proposta (sem nunca cortar nas bordas) */}
        {codeBadge ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '22px',
              padding: '8px 22px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1.5px solid rgba(110, 231, 183, 0.42)',
              fontSize: '20px',
              fontWeight: 800,
              color: '#A7F3D0',
              letterSpacing: '0.8px',
            }}
          >
            {codeBadge}
          </div>
        ) : null}
      </div>
    ),
    {
      width: 600,
      height: 340,
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
