import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug, normalizePortugueseTopic } from '@/lib/seo-engine';

export const runtime = 'nodejs';

function stripBrandFromEditorialText(text: string): string {
  return normalizePortugueseTopic(text)
    .replace(/\(Guia 2026\)/gi, '(Guia 2027)')
    .replace(/\(2026\)/gi, '(2027)')
    .replace(/no SmartBid Hub/gi, 'em sistema especializado')
    .replace(/para o SmartBid Hub/gi, 'para plataforma integrada')
    .replace(/SmartBid Hub/gi, 'Sistema Especializado');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const article = slug ? await getSeoArticleBySlug(slug).catch(() => null) : null;

  const rawTitle =
    article?.title ||
    'Como Montar Propostas e Planilhas de Custos (FPV) para Terceirização e Facilities (Guia 2027)';
  const title = stripBrandFromEditorialText(rawTitle);

  const category = (article?.category || 'Engenharia de Custos & FPV').toUpperCase();
  const rawSummary =
    article?.excerpt ||
    article?.metaDescription ||
    'Guia técnico completo sobre formação de preço de venda (FPV por CCT), encargos trabalhistas, virada da Reforma Tributária em 2027 (IBS/CBS) e propostas comerciais B2B.';
  const summary = stripBrandFromEditorialText(rawSummary);

  const rawRows = article?.sections?.find((s) => s.table?.rows?.length)?.table?.rows?.slice(0, 3) || [
    ['Montante A — Mão de Obra + Encargos Sociais', 'Piso Sindical da CCT + Adicionais + Grupos A a F (68% a 78%)', '58% a 65% do PV'],
    ['Montante B & C — Benefícios, EPIs e Materiais', 'Vale-Transporte (dedução 6%), VA/VR por escala, Uniformes e Insumos', '12% a 18% do PV'],
    ['BDI, Tributos 2027 (IBS/CBS) e Margem Líquida', 'Cálculo por dentro (Gross-up) no Simples, Presumido ou Lucro Real', '20% a 28% do PV'],
  ];

  const tableRows = rawRows.map((r) => [
    stripBrandFromEditorialText(r[0] || ''),
    stripBrandFromEditorialText(r[1] || ''),
    stripBrandFromEditorialText(r[2] || ''),
  ]);

  // Formato Quadrado 1:1 (1350 x 1350 px) — Padrão Ouro Oficial do Feed do LinkedIn (Desktop + Mobile sem nenhum corte)
  return new ImageResponse(
    (
      <div
        style={{
          width: '1350px',
          height: '1350px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAF7F2',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* BLOCO SUPERIOR: Editorial Magazine Header + Manchete de Alto Contraste */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 72px 44px 72px',
            gap: '28px',
            background: '#FAF7F2',
          }}
        >
          {/* Masthead Editorial Neutro (Sem nome pessoal ou marca no topo) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingBottom: '24px',
              borderBottom: '3px solid #0F172A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '62px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#112A22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '21px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                FPV
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span
                  style={{
                    fontSize: '25px',
                    fontWeight: 900,
                    color: '#0F172A',
                    letterSpacing: '-0.02em',
                  }}
                >
                  ENGENHARIA DE CUSTOS & PRECIFICAÇÃO B2B
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#475569',
                    letterSpacing: '0.08em',
                  }}
                >
                  CADERNO TÉCNICO EXECUTIVO • FACILITIES & TERCEIRIZAÇÃO
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                borderRadius: '10px',
                background: '#E07A2F',
                color: '#FFFFFF',
                fontSize: '17px',
                fontWeight: 900,
                letterSpacing: '0.05em',
              }}
            >
              {category}
            </div>
          </div>

          {/* Manchete Principal Super Nítida */}
          <div
            style={{
              fontSize: title.length > 90 ? '48px' : '54px',
              fontWeight: 900,
              lineHeight: 1.13,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {/* Tese Executiva com Barra Laranja */}
          <div
            style={{
              display: 'flex',
              borderLeft: '7px solid #E07A2F',
              paddingLeft: '24px',
              fontSize: '24px',
              lineHeight: 1.44,
              color: '#334155',
              fontWeight: 600,
            }}
          >
            {summary}
          </div>
        </div>

        {/* BLOCO INFERIOR: Infográfico Técnico / Planilha Auditada de Engenharia de Custos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(160deg, #0D261E 0%, #153B2E 100%)',
            padding: '48px 72px 54px 72px',
            flex: 1,
            gap: '28px',
          }}
        >
          {/* Cabeçalho da Seção do Infográfico */}
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
                  width: '14px',
                  height: '14px',
                  borderRadius: '999px',
                  background: '#34D399',
                }}
              />
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#6EE7B7',
                  letterSpacing: '0.08em',
                }}
              >
                RAIO-X TÉCNICO • MEMÓRIA DE CÁLCULO AUDITADA NA FPV
              </span>
            </div>

            <span
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#FDBA74',
                background: 'rgba(224, 122, 47, 0.24)',
                border: '1px solid rgba(224, 122, 47, 0.55)',
                padding: '7px 18px',
                borderRadius: '999px',
              }}
            >
              CCT + REFORMA 2027 (IBS/CBS)
            </span>
          </div>

          {/* Card Branco de Alta Nitidez (Planilha Executiva) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Topo da Janela da Planilha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0F172A',
                padding: '18px 28px',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '13px', height: '13px', borderRadius: '99px', background: '#EF4444' }} />
                <div style={{ width: '13px', height: '13px', borderRadius: '99px', background: '#F59E0B' }} />
                <div style={{ width: '13px', height: '13px', borderRadius: '99px', background: '#10B981' }} />
                <span style={{ fontSize: '17px', fontWeight: 800, marginLeft: '10px', color: '#F8FAFC' }}>
                  MATRIZ DE COMPOSIÇÃO DE CUSTOS E FORMAÇÃO DE PREÇOS (FPV)
                </span>
              </div>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#34D399',
                }}
              >
                AUDITORIA DE MARGEM B2B
              </span>
            </div>

            {/* 3 Linhas Técnicas Amplas */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 28px',
                gap: '16px',
              }}
            >
              {tableRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: idx === 0 ? '#F0FDF4' : '#F8FAFC',
                    border: idx === 0 ? '2px solid #86EFAC' : '1px solid #CBD5E1',
                    borderRadius: '16px',
                    padding: '18px 24px',
                    gap: '20px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '860px' }}>
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 900,
                        color: '#0F172A',
                      }}
                    >
                      {`0${idx + 1}. ${row[0] || ''}`}
                    </span>
                    <span
                      style={{
                        fontSize: '18px',
                        color: '#334155',
                        fontWeight: 600,
                      }}
                    >
                      {row[1] || ''}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px',
                      fontWeight: 900,
                      color: idx === 0 ? '#166534' : '#9A3412',
                      background: idx === 0 ? '#DCFCE7' : '#FFEDD5',
                      border: idx === 0 ? '1px solid #86EFAC' : '1px solid #FDBA74',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {row[2] && row[2].length <= 24
                      ? row[2]
                      : idx === 0
                      ? 'Montante A • CCT'
                      : idx === 1
                      ? 'Montante B & C'
                      : 'Gross-Up & BDI'}
                  </div>
                </div>
              ))}
            </div>

            {/* Faixa de Fórmula Técnica no Rodapé da Planilha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFF7ED',
                borderTop: '2px solid #FED7AA',
                padding: '16px 28px',
              }}
            >
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#9A3412' }}>
                EQUAÇÃO DE BLINDAGEM DE MARGEM (GROSS-UP):
              </span>
              <span style={{ fontSize: '19px', fontWeight: 900, color: '#C2410C' }}>
                Preço Final = Custo Direto ÷ (1 − [Tributos% + Adm% + Lucro%])
              </span>
            </div>
          </div>

          {/* Rodapé Técnico Editorial (100% neutro, sem nome pessoal e sem marca) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#E2E8F0' }}>
                ENGENHARIA DE CUSTOS • CONVENÇÕES COLETIVAS (CCT) & GESTÃO DE MARGEM
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FDBA74',
                  padding: '9px 18px',
                  borderRadius: '10px',
                }}
              >
                DIRETRIZES TÉCNICAS PARA 2027
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1350,
      height: 1350,
    }
  );
}
