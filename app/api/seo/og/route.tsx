import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug, normalizePortugueseTopic } from '@/lib/seo-engine';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const article = slug ? await getSeoArticleBySlug(slug).catch(() => null) : null;

  const rawTitle =
    article?.title ||
    'Como Montar Propostas e Planilhas de Custos (FPV) para Terceirização e Facilities';
  const title = normalizePortugueseTopic(rawTitle);

  const category = (article?.category || 'Engenharia de Custos & FPV').toUpperCase();
  const rawSummary =
    article?.excerpt ||
    article?.metaDescription ||
    'Guia técnico completo sobre formação de preço de venda (FPV por CCT), encargos trabalhistas, tributação e propostas comerciais para empresas de Facilities e Terceirização.';
  const summary = normalizePortugueseTopic(rawSummary);

  const tableRows = article?.sections?.find((s) => s.table?.rows?.length)?.table?.rows?.slice(0, 3) || [
    ['Montante A (Mão de Obra + Encargos)', 'Piso CCT + 68% a 78% Encargos', '58% a 65% do PV'],
    ['Montante B (Benefícios + Insumos)', 'VT, VA, VR, Uniformes, EPIs e Químicos', '12% a 18% do PV'],
    ['BDI, Tributos (IBS/CBS) e Margem', 'Cálculo por dentro (Gross-up)', '20% a 28% do PV'],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'row',
          background: '#FAF7F2',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* COLUNA ESQUERDA: Editorial Magazine Layout (Papel Arquitetônico Quente) */}
        <div
          style={{
            width: '690px',
            height: '630px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '46px 52px',
            background: '#FAF7F2',
            borderRight: '2px solid #E6E0D6',
          }}
        >
          {/* Topo Editorial / Masthead */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#112A22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '20px',
                    fontWeight: 900,
                  }}
                >
                  S
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#0F172A',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    SMARTBID HUB
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748B',
                      letterSpacing: '0.08em',
                    }}
                  >
                    CADERNO EXECUTIVO • FACILITIES & B2B
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: '#E07A2F',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </div>
            </div>

            <div style={{ width: '100%', height: '2px', background: '#0F172A', display: 'flex' }} />
          </div>

          {/* Manchete Editorial + Tese Técnica */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                fontSize: title.length > 85 ? '33px' : '37px',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                display: 'flex',
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: 'flex',
                borderLeft: '5px solid #E07A2F',
                paddingLeft: '18px',
                fontSize: '17px',
                lineHeight: 1.46,
                color: '#334155',
                fontWeight: 500,
              }}
            >
              {summary}
            </div>
          </div>

          {/* Rodapé de Autoridade */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #DFD9CE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '999px',
                  background: '#1B4D3E',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                CRISTIANO SILVA • ENGENHARIA DE CUSTOS & FPV
              </span>
            </div>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 900,
                color: '#E07A2F',
              }}
            >
              smartbidhub.com.br
            </span>
          </div>
        </div>

        {/* COLUNA DIREITA: Infográfico Técnico / Blueprint FPV Realista */}
        <div
          style={{
            width: '510px',
            height: '630px',
            background: 'linear-gradient(155deg, #0D261E 0%, #153B2E 100%)',
            padding: '38px 34px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Selo Superior Direito */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#6EE7B7',
                letterSpacing: '0.08em',
              }}
            >
              RAIO-X TÉCNICO DA OPERAÇÃO
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#FDBA74',
                background: 'rgba(224, 122, 47, 0.22)',
                border: '1px solid rgba(224, 122, 47, 0.5)',
                padding: '4px 10px',
                borderRadius: '999px',
              }}
            >
              MEMÓRIA AUDITÁVEL
            </span>
          </div>

          {/* Card Flutuante Estilo Planilha Executiva / Dashboard */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Barra de Título da Planilha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0F172A',
                padding: '14px 18px',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '99px', background: '#EF4444' }} />
                <div style={{ width: '9px', height: '9px', borderRadius: '99px', background: '#F59E0B' }} />
                <div style={{ width: '9px', height: '9px', borderRadius: '99px', background: '#10B981' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, marginLeft: '6px', color: '#E2E8F0' }}>
                  MATRIZ DE COMPOSIÇÃO • FPV B2B
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#34D399',
                }}
              >
                CCT + IBS/CBS
              </span>
            </div>

            {/* Linhas Reais da Tabela do Artigo */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 18px',
                gap: '12px',
              }}
            >
              {tableRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: idx === 0 ? '#F0FDF4' : '#F8FAFC',
                    border: idx === 0 ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      { `0${idx + 1}. ${row[0] || ''}` }
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: idx === 0 ? '#166534' : '#9A3412',
                        background: idx === 0 ? '#DCFCE7' : '#FFEDD5',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      {row[2] && row[2].length <= 24 ? row[2] : idx === 0 ? 'Montante A • CCT' : idx === 1 ? 'Montante B & C' : 'Gross-Up & BDI'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    {row[1] || ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Fórmula Gross-Up no Rodapé do Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFF7ED',
                borderTop: '1px solid #FED7AA',
                padding: '12px 18px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#9A3412' }}>
                CÁLCULO POR DENTRO (GROSS-UP):
              </span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#C2410C' }}>
                PV = CD ÷ (1 − BDI%)
              </span>
            </div>
          </div>

          {/* Rodapé Direito */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#E2E8F0' }}>
              Plataforma SaaS de Engenharia de Custos
            </span>
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#FDBA74' }}>
              30 Dias Grátis →
            </span>
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
