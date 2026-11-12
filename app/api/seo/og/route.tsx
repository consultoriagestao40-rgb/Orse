import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug, normalizePortugueseTopic } from '@/lib/seo-engine';

export const runtime = 'nodejs';

const FONT_URLS = {
  archivoBlack: 'https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf',
  jakartaMedium: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_m07NSg.ttf',
  jakartaBold: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf',
  jakartaExtraBold: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KUnNSg.ttf',
};

let cachedFonts: any[] | null = null;

async function loadBrandFonts() {
  if (cachedFonts) return cachedFonts;
  try {
    const [archivoBuf, mediumBuf, boldBuf, extraBoldBuf] = await Promise.all([
      fetch(FONT_URLS.archivoBlack).then((r) => r.arrayBuffer()),
      fetch(FONT_URLS.jakartaMedium).then((r) => r.arrayBuffer()),
      fetch(FONT_URLS.jakartaBold).then((r) => r.arrayBuffer()),
      fetch(FONT_URLS.jakartaExtraBold).then((r) => r.arrayBuffer()),
    ]);
    cachedFonts = [
      { name: 'Archivo Black', data: archivoBuf, weight: 400 as const, style: 'normal' as const },
      { name: 'Plus Jakarta Sans', data: mediumBuf, weight: 500 as const, style: 'normal' as const },
      { name: 'Plus Jakarta Sans', data: boldBuf, weight: 700 as const, style: 'normal' as const },
      { name: 'Plus Jakarta Sans', data: extraBoldBuf, weight: 800 as const, style: 'normal' as const },
    ];
    return cachedFonts;
  } catch {
    return [];
  }
}

function cleanArticleHeadline(raw: string): string {
  return normalizePortugueseTopic(raw)
    .replace(/\(Guia 2026\)/gi, '')
    .replace(/\(Guia 2027\)/gi, '')
    .replace(/\(2026\)/gi, '')
    .replace(/\(2027\)/gi, '')
    .replace(/\(Modelo e Custos\)/gi, '')
    .replace(/\(Grupos A a F\)/gi, '')
    .replace(/:\s*Guia Prático e Memória de Cálculo/gi, '')
    .replace(/:\s*Guia Prático Completo.*$/gi, '')
    .replace(/:\s*Guia Completo.*$/gi, '')
    .replace(/:\s*Guia Prático.*$/gi, '')
    .replace(/:\s*Impacto Real na Planilha de Custos.*$/gi, ' na Planilha de Custos')
    .replace(/:\s*Piso, Intrajornada e Adicional Noturno/gi, '')
    .replace(/\s*\+\s*Planilha de Controle de Facilities/gi, '')
    .replace(/^Software de /i, '')
    .replace(/^Como Fazer uma /i, '')
    .replace(/^Como Fazer /i, '')
    .replace(/^Como Calcular o /i, 'Cálculo de ')
    .replace(/^Como Calcular /i, 'Cálculo de ')
    .replace(/^Como Montar o /i, 'Montagem de ')
    .replace(/^Como Montar /i, 'Montagem de ')
    .trim();
}

function splitUpperHeadline(text: string): { whitePart: string; orangePart: string } {
  const clean = cleanArticleHeadline(text).toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  // Limita a ~8 palavras para manter impacto gigante estilo pôster de agência
  const compactWords = words.length > 9 ? words.slice(0, 9) : words;
  const splitIdx = Math.ceil(compactWords.length * 0.5);
  const first = compactWords.slice(0, splitIdx).join(' ');
  let second = compactWords.slice(splitIdx).join(' ');
  if (!second.endsWith('?') && !second.endsWith('.')) {
    second = `${second}?`;
  }
  return { whitePart: first, orangePart: second };
}

function getCascadeCardsForArticle(slug: string, title: string): Array<{ title: string; subtitle: string }> {
  const lower = `${slug} ${title}`.toLowerCase();

  if (lower.includes('reforma') || lower.includes('ibs') || lower.includes('cbs') || lower.includes('simples')) {
    return [
      { title: 'Extinção PIS/COFINS', subtitle: 'Virada real em 2027 com entrada da CBS' },
      { title: 'Split Payment', subtitle: 'Retenção automática na liquidação da NF' },
      { title: 'Créditos Montante B', subtitle: 'Abatimento sobre EPIs, químicos e insumos' },
      { title: 'Simples vs. Presumido', subtitle: 'Transferência de crédito para cliente B2B' },
      { title: 'Gross-up na FPV', subtitle: 'Cálculo por dentro e reequilíbrio contratual' },
    ];
  }

  if (lower.includes('12x36') || lower.includes('portaria') || lower.includes('noturno') || lower.includes('vigil')) {
    return [
      { title: '4 Postos por Turno', subtitle: 'Cobertura 24h diurna e noturna sem furo' },
      { title: 'Adicional Noturno', subtitle: '20% + hora reduzida (52m30s) e prorrogação' },
      { title: 'Intrajornada', subtitle: 'Cobertura de almocista ou indenização CCT' },
      { title: 'Reflexo no DSR', subtitle: 'Incidência sobre adicionais na folha' },
      { title: 'Benefícios por Escala', subtitle: 'VT (teto 6%) e VA/VR por plantões efetivos' },
    ];
  }

  if (lower.includes('limpeza') || lower.includes('insalub') || lower.includes('m²') || lower.includes('epi')) {
    return [
      { title: 'Piso & Insalubridade', subtitle: 'Grau médio (20%) ou máximo (40% TST)' },
      { title: 'Produtividade m²', subtitle: 'Dimensionamento técnico ABNT NBR 14082' },
      { title: 'Enxoval & EPIs', subtitle: 'Vida útil mensal de uniformes e botas NR-6' },
      { title: 'Químicos & Papéis', subtitle: 'Rateio mensal per capita e diluição' },
      { title: 'Depreciação', subtitle: 'Lavadoras, enceradeiras e manutenção' },
    ];
  }

  if (lower.includes('repactua') || lower.includes('reajuste') || lower.includes('contrato')) {
    return [
      { title: 'Data-Base da CCT', subtitle: 'Direito ao reequilíbrio de mão de obra' },
      { title: 'Montante A (CCT)', subtitle: 'Repasse integral do dissídio e benefícios' },
      { title: 'Montante B (IPCA)', subtitle: 'Correção de materiais, EPIs e máquinas' },
      { title: 'Memória Analítica', subtitle: 'Quadro comparativo antes vs. depois' },
      { title: 'Aditivo & Margem', subtitle: 'Proteção do lucro líquido e retroativo' },
    ];
  }

  return [
    { title: 'Piso & CCT', subtitle: 'Salário normativo, escalas e adicionais' },
    { title: 'Encargos A a F', subtitle: 'Provisões trabalhistas e reflexos auditados' },
    { title: 'Reforma 2027', subtitle: 'Simulação CBS, IBS e Gross-up por dentro' },
    { title: 'Proposta por Link', subtitle: 'Rastreio de abertura e leitura ao vivo' },
    { title: 'Blindagem de Margem', subtitle: 'DRE do projeto e reajuste anual' },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const style = searchParams.get('style') || 'cascade'; // 'cascade' (Opção 1 Padrão) ou 'lphero' (Opção 2 Hero da LP)

  const [article, fonts] = await Promise.all([
    slug ? getSeoArticleBySlug(slug).catch(() => null) : Promise.resolve(null),
    loadBrandFonts(),
  ]);

  const rawTitle =
    article?.title ||
    'Montagem de Propostas e Orçamento de Facilities';
  const category = (article?.category || 'Engenharia de Custos').toUpperCase();
  const cards = getCascadeCardsForArticle(slug, rawTitle);

  // ============================================================================
  // OPÇÃO 2: MODELO HERO NATIVO DA LP (style=lphero)
  // ============================================================================
  if (style === 'lphero') {
    const cleanTitle = cleanArticleHeadline(rawTitle);
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    const splitIdx = Math.ceil(words.length * 0.52);
    const firstHalf = words.slice(0, splitIdx).join(' ');
    const secondHalf = words.slice(splitIdx).join(' ') + '.';

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '1350px',
            display: 'flex',
            background: '#F6F5F0',
            padding: '28px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          <div
            style={{
              width: '1144px',
              height: '1294px',
              borderRadius: '38px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '72px 76px 0 76px',
              background: 'linear-gradient(145deg, #1E5D47 0%, #0E3427 48%, #071D15 100%)',
            }}
          >
            {/* Arcos Concêntricos da LP */}
            <div
              style={{
                position: 'absolute',
                top: '-220px',
                left: '-320px',
                width: '1150px',
                height: '1150px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-340px',
                left: '-440px',
                width: '1450px',
                height: '1450px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
              }}
            />

            {/* Brilho Âmbar Inferior Direito da LP */}
            <div
              style={{
                position: 'absolute',
                bottom: '-180px',
                right: '-180px',
                width: '560px',
                height: '560px',
                borderRadius: '9999px',
                background: 'radial-gradient(circle, rgba(224,90,27,0.38) 0%, rgba(224,90,27,0) 70%)',
                display: 'flex',
              }}
            />

            {/* Ponto Luminoso Laranja do Radar da LP */}
            <div
              style={{
                position: 'absolute',
                top: '520px',
                right: '115px',
                width: '12px',
                height: '12px',
                borderRadius: '999px',
                background: '#FF6B2B',
                display: 'flex',
              }}
            />

            {/* Topo + Manchete Principal */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '32px', width: '992px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '992px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 24px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <div style={{ width: '9px', height: '9px', borderRadius: '999px', background: '#FF6B2B' }} />
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>
                    Plataforma para prestadoras de serviços terceirizados
                  </span>
                </div>

                <div
                  style={{
                    padding: '5px',
                    borderRadius: '999px',
                    background: 'rgba(224,90,27,0.28)',
                    border: '1px solid rgba(255,122,51,0.38)',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 26px',
                      borderRadius: '999px',
                      background: '#E05A1B',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Teste grátis de 30 dias ↗</span>
                  </div>
                </div>
              </div>

              {/* Manchete em 2 blocos empilhados (Branco + Laranja) + Sublinhado Laranja */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '992px' }}>
                <div
                  style={{
                    fontSize: '68px',
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: '-0.035em',
                    color: '#FFFFFF',
                    display: 'flex',
                    width: '992px',
                  }}
                >
                  {firstHalf}
                </div>
                <div
                  style={{
                    fontSize: '68px',
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: '-0.035em',
                    color: '#FF7332',
                    display: 'flex',
                    width: '992px',
                  }}
                >
                  {secondHalf}
                </div>
                <div
                  style={{
                    width: '540px',
                    height: '8px',
                    borderRadius: '999px',
                    background: '#E86325',
                    marginTop: '14px',
                    display: 'flex',
                  }}
                />
              </div>
            </div>

            {/* Janela Branca da LP na Base */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.13)',
                padding: '16px 16px 0 16px',
                borderRadius: '32px 32px 0 0',
                border: '1px solid rgba(255,255,255,0.18)',
                width: '992px',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '22px 22px 0 0',
                  padding: '28px 34px 44px 34px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  width: '960px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '18px',
                    width: '892px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', marginLeft: '8px' }}>
                      app.smartbidhub.com.br
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#F4F5F7',
                      padding: '5px',
                      borderRadius: '12px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', padding: '7px 14px' }}>
                      Link da proposta
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        padding: '7px 16px',
                        borderRadius: '8px',
                      }}
                    >
                      Rastreio de leitura
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', padding: '7px 14px' }}>
                      Radar comercial
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', padding: '7px 14px' }}>
                      DRE do projeto
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '892px' }}>
                  {cards.slice(0, 3).map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        background: idx === 2 ? '#FFF7ED' : '#F8FAFC',
                        border: idx === 2 ? '1px solid #FED7AA' : '1px solid #E2E8F0',
                        borderRadius: '18px',
                        padding: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: idx === 2 ? '#9A3412' : '#64748B',
                        }}
                      >
                        {`0${idx + 1}. ${category}`}
                      </span>
                      <span
                        style={{
                          fontSize: '24px',
                          fontWeight: 800,
                          color: idx === 2 ? '#C2410C' : '#0F172A',
                        }}
                      >
                        {c.title}
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: idx === 0 ? '#15803D' : idx === 1 ? '#E05A1B' : '#9A3412',
                        }}
                      >
                        {`✓ ${c.subtitle}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1350,
        fonts,
      }
    );
  }

  // ============================================================================
  // OPÇÃO 1 (PADRÃO OFICIAL): MODELO CASCATA 3D DE AGÊNCIA + CORES DA LP (1080 x 1350 px)
  // ============================================================================
  const { whitePart, orangePart } = splitUpperHeadline(rawTitle);
  const spacedKicker = category.split('').join(' ');

  const cardBackgrounds = [
    'linear-gradient(135deg, #0A251C 0%, #12382A 100%)',
    'linear-gradient(135deg, #153E2F 0%, #1F523F 100%)',
    'linear-gradient(135deg, #2D5C49 0%, #3E735D 100%)',
    'linear-gradient(135deg, #B9CBBF 0%, #9EB5A6 100%)',
    'linear-gradient(135deg, #F5EFE4 0%, #DFD6C5 100%)',
  ];

  const cardMarginsLeft = ['36px', '28px', '18px', '8px', '0px'];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1350px',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 25% 22%, #1C5641 0%, #0D3325 52%, #061A12 100%)',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: '76px 56px 64px 72px',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}
      >
        {/* Curva Orgânica Superior Direita */}
        <div
          style={{
            position: 'absolute',
            top: '-160px',
            right: '-140px',
            width: '540px',
            height: '540px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, rgba(167,204,180,0.42) 0%, rgba(45,106,79,0.12) 100%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-220px',
            right: '-80px',
            width: '680px',
            height: '680px',
            borderRadius: '9999px',
            border: '1.5px solid rgba(216,232,220,0.28)',
            display: 'flex',
          }}
        />

        {/* Curva Orgânica Inferior Esquerda */}
        <div
          style={{
            position: 'absolute',
            bottom: '-260px',
            left: '-180px',
            width: '720px',
            height: '520px',
            borderRadius: '9999px',
            background: 'linear-gradient(25deg, #04120C 0%, rgba(28,86,65,0.45) 100%)',
            borderTop: '1.5px solid rgba(181,210,190,0.22)',
            display: 'flex',
          }}
        />

        {/* Curva Inferior Direita Creme */}
        <div
          style={{
            position: 'absolute',
            bottom: '-180px',
            right: '-120px',
            width: '420px',
            height: '360px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #E8E1D1 0%, #C7BFA8 100%)',
            display: 'flex',
          }}
        />

        {/* COLUNA ESQUERDA: Kicker + Título Display Gigante (Creme + Laranja LP) + Subtítulo + Botão Pílula + 3 Ícones */}
        <div
          style={{
            position: 'relative',
            width: '575px',
            height: '1210px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Kicker Espaçado + Linha Laranja */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '34px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#D8E6DD',
                  letterSpacing: '0.18em',
                }}
              >
                {spacedKicker}
              </span>
              <div style={{ width: '84px', height: '3px', background: '#E05A1B', display: 'flex' }} />
            </div>

            {/* TÍTULO DISPLAY GIGANTE EM CAIXA ALTA (2 blocos independentes para quebra 100% perfeita no Satori) */}
            <div
              style={{
                fontFamily: '"Archivo Black", sans-serif',
                fontSize: (whitePart.length + orangePart.length) > 48 ? '62px' : '70px',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '36px',
                width: '565px',
              }}
            >
              <div style={{ color: '#F5EFE6', display: 'flex', width: '565px' }}>{whitePart}</div>
              <div style={{ color: '#FF7838', display: 'flex', width: '565px' }}>{orangePart}</div>
            </div>

            {/* Subtítulo Forte + Chamada */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '520px' }}>
              <div
                style={{
                  fontSize: '27px',
                  fontWeight: 800,
                  lineHeight: 1.24,
                  color: '#FFFFFF',
                  letterSpacing: '-0.015em',
                  display: 'flex',
                }}
              >
                O que hoje passa na planilha, pode corroer sua margem em 2027.
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  lineHeight: 1.38,
                  color: '#D0DDD5',
                  display: 'flex',
                }}
              >
                Substitua planilhas soltas e blinde os 5 pilares críticos da sua formação de preço antes de enviar a proposta.
              </div>
            </div>
          </div>

          {/* Base Esquerda: Botão Pílula Laranja da LP + 3 Ícones Minimalistas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', width: '540px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '530px',
                height: '82px',
                padding: '0 36px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #E05A1B 0%, #F06D2F 100%)',
                boxShadow: '0 16px 36px rgba(224,90,27,0.32)',
              }}
            >
              <span style={{ fontSize: '23px', fontWeight: 800, color: '#FFFFFF' }}>
                Começar teste grátis de 30 dias
              </span>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>→</span>
            </div>

            {/* 3 Ícones Minimalistas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '999px',
                    border: '2px solid #D8E6DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D8E6DD',
                    fontSize: '15px',
                    fontWeight: 800,
                  }}
                >
                  2m
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '15px', lineHeight: 1.25, color: '#D8E6DD', fontWeight: 500 }}>
                  <span>Cálculo em</span>
                  <span>2 minutos</span>
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'rgba(216,230,221,0.28)', display: 'flex' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '2px solid #D8E6DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D8E6DD',
                    fontSize: '14px',
                    fontWeight: 800,
                  }}
                >
                  ↗
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '15px', lineHeight: 1.25, color: '#D8E6DD', fontWeight: 500 }}>
                  <span>Proposta</span>
                  <span>por link</span>
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'rgba(216,230,221,0.28)', display: 'flex' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '2px solid #D8E6DD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D8E6DD',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  PDF
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '15px', lineHeight: 1.25, color: '#D8E6DD', fontWeight: 500 }}>
                  <span>DRE & FPV</span>
                  <span>em PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: 5 CARDS EMPILHADOS EM CASCATA 3D (01 a 05) */}
        <div
          style={{
            position: 'relative',
            width: '365px',
            height: '1210px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: '20px',
          }}
        >
          {cards.map((card, idx) => {
            const isLightCard = idx >= 3;
            return (
              <div
                key={idx}
                style={{
                  transform: 'skewY(-6deg)',
                  marginTop: idx === 0 ? '0px' : '-20px',
                  marginLeft: cardMarginsLeft[idx],
                  background: cardBackgrounds[idx],
                  border: isLightCard ? '1px solid rgba(255,255,255,0.75)' : '1px solid rgba(184,212,194,0.3)',
                  borderRadius: '20px',
                  padding: idx === 4 ? '20px 22px 26px 22px' : '20px 22px 32px 22px',
                  boxShadow: '0 18px 38px rgba(0,0,0,0.42)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '328px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: isLightCard ? '#112A20' : '#C2DACB',
                  }}
                >
                  {`0${idx + 1}`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '999px',
                      background: idx === 4 ? 'rgba(224,90,27,0.15)' : isLightCard ? 'rgba(17,42,32,0.1)' : 'rgba(255,255,255,0.06)',
                      border: isLightCard ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {idx === 0 && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M5 20V14M10 20V10M15 20V13M20 20V6" stroke="#F5EFE6" strokeWidth="2.2" strokeLinecap="round" />
                        <path d="M3 20H21" stroke="#F5EFE6" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" stroke="#F5EFE6" strokeWidth="2" />
                        <circle cx="12" cy="12" r="4" stroke="#F5EFE6" strokeWidth="2" />
                        <path d="M15 9L20 4M20 4H16M20 4V8" stroke="#FF7838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L4 6.5V12C4 16.8 7.4 20.8 12 22C16.6 20.8 20 16.8 20 12V6.5L12 3Z" stroke="#F5EFE6" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M9 12L11 14L15 10" stroke="#FF7838" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {idx === 3 && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="14" rx="2.5" stroke="#0F291E" strokeWidth="2" />
                        <path d="M8 21H16M12 18V21" stroke="#0F291E" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {idx === 4 && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.8 8.5L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.5L12 2Z" stroke="#E05A1B" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '214px' }}>
                    <span
                      style={{
                        fontSize: '19px',
                        fontWeight: 800,
                        color: isLightCard ? '#0F291E' : '#FFFFFF',
                      }}
                    >
                      {card.title}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isLightCard ? 700 : 500,
                        color: isLightCard ? '#264637' : '#D0E3D7',
                        lineHeight: 1.25,
                      }}
                    >
                      {card.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts,
    }
  );
}
