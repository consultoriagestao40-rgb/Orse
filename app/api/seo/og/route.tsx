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
  const summary =
    article?.excerpt ||
    article?.metaDescription ||
    'Guia técnico completo sobre formação de preço de venda (FPV por CCT), encargos trabalhistas, tributação e propostas comerciais para empresas de Facilities e Terceirização.';

  const tags = (
    article?.keywords?.slice(0, 3) || [
      'Formação de Preço (FPV)',
      'CCT & Encargos Sociais',
      'Propostas Comerciais B2B',
    ]
  ).map((k) => k.charAt(0).toUpperCase() + k.slice(1));

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
          padding: '52px 64px',
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
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#E07A2F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '25px',
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
              padding: '10px 22px',
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

        {/* Center Title + Complete Executive Summary + Keyword Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div
            style={{
              fontSize: title.length > 90 ? '38px' : '44px',
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
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '18px',
              padding: '22px 28px',
              fontSize: '21px',
              lineHeight: 1.48,
              color: '#ECFDF5',
              fontWeight: 500,
            }}
          >
            {summary}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {tags.map((tag, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  color: '#A7F3D0',
                  fontSize: '15px',
                  fontWeight: 700,
                }}
              >
                {tag}
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
            paddingTop: '18px',
            width: '100%',
          }}
        >
          <span style={{ fontSize: '18px', color: '#D1FAE5', fontWeight: 700 }}>
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
