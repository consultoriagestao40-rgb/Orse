import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug } from '@/lib/seo-engine';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const article = slug ? await getSeoArticleBySlug(slug).catch(() => null) : null;

  const title =
    article?.title ||
    'SmartBid Hub • Engenharia de Custos (FPV), Propostas e Contratos para Facilities';
  const category = article?.category || 'Engenharia de Custos & Facilities';
  const bullets = (
    article?.sections?.[0]?.bullets?.slice(0, 3) || [
      'Cálculo automatizado de Montantes A, B, C e BDI por CCT',
      'Simulação nativa da Reforma Tributária (IBS e CBS / Simples Híbrido)',
      'Propostas comerciais interativas com rastreamento em tempo real',
    ]
  ).map((b) => (b.length > 92 ? b.slice(0, 90) + '...' : b));

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0D2920 0%, #1B4D3E 60%, #143A2F 100%)',
          padding: '54px 64px',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#E07A2F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 900,
                color: '#FFFFFF',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                SmartBid Hub
              </span>
              <span style={{ fontSize: '13px', color: '#A7F3D0', fontWeight: 600 }}>
                CENTRAL TÉCNICA • FACILITIES & TERCEIRIZAÇÃO
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(224, 122, 47, 0.22)',
              border: '1px solid rgba(224, 122, 47, 0.55)',
              color: '#FDBA74',
              fontSize: '15px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {category}
          </div>
        </div>

        {/* Center Title & Bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
          <div
            style={{
              fontSize: title.length > 85 ? '40px' : '46px',
              fontWeight: 800,
              lineHeight: 1.18,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              display: 'flex',
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '18px',
              padding: '20px 26px',
            }}
          >
            {bullets.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '19px',
                  color: '#ECFDF5',
                  fontWeight: 500,
                }}
              >
                <span style={{ color: '#34D399', fontWeight: 900 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '20px',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '17px', color: '#D1FAE5', fontWeight: 600 }}>
            www.smartbidhub.com.br
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#E07A2F',
              color: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 800,
            }}
          >
            Teste Grátis por 30 Dias • FPV + CCT + CRM + Contratos
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
