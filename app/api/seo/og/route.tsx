import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug, getAllSeoArticles, normalizePortugueseTopic } from '@/lib/seo-engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    .replace(/\(Súmula 448 TST\)/gi, 'Súmula 448 TST')
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

const STOPWORD_ENDINGS = new Set([
  'DE', 'DA', 'DO', 'DAS', 'DOS', 'NA', 'NO', 'NAS', 'NOS',
  'EM', 'PARA', 'POR', 'COM', 'SEM', 'SOBRE', 'ENTRE',
  'E', 'OU', 'A', 'O', 'AS', 'OS', 'UM', 'UMA', 'QUE', 'USO',
]);

function trimTrailingStopwords(words: string[]): string[] {
  const copy = [...words];
  while (copy.length > 4 && STOPWORD_ENDINGS.has(copy[copy.length - 1].replace(/[^A-ZÀ-Ú0-9]/gi, '').toUpperCase())) {
    copy.pop();
  }
  return copy;
}

function splitUpperHeadline(text: string): { whitePart: string; orangePart: string } {
  const clean = cleanArticleHeadline(text).toUpperCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const compactWords = trimTrailingStopwords(words.length > 10 ? words.slice(0, 10) : words);
  const splitIdx = Math.ceil(compactWords.length * 0.5);
  const first = compactWords.slice(0, splitIdx).join(' ');
  const second = compactWords.slice(splitIdx).join(' ');
  return { whitePart: first, orangePart: second };
}

function splitSentenceHeadline(text: string): { firstHalf: string; secondHalf: string } {
  const clean = cleanArticleHeadline(text);
  const words = clean.split(/\s+/).filter(Boolean);
  const compactWords = trimTrailingStopwords(words.length > 11 ? words.slice(0, 11) : words);
  const splitIdx = Math.ceil(compactWords.length * 0.52);
  const firstHalf = compactWords.slice(0, splitIdx).join(' ');
  let secondHalf = compactWords.slice(splitIdx).join(' ');
  if (!secondHalf.endsWith('.') && !secondHalf.endsWith('?')) {
    secondHalf = `${secondHalf}.`;
  }
  return { firstHalf, secondHalf };
}

function getCascadeCardsForArticle(slug: string, title: string): Array<{ title: string; subtitle: string; metric: string }> {
  const lower = `${slug} ${title}`.toLowerCase();

  if (lower.includes('reforma') || lower.includes('ibs') || lower.includes('cbs') || lower.includes('simples')) {
    return [
      { title: 'Extinção PIS/COFINS', subtitle: 'Virada real em 2027 com entrada da CBS', metric: '2027' },
      { title: 'Split Payment', subtitle: 'Retenção automática na liquidação da NF', metric: '100% Auto' },
      { title: 'Créditos Montante B', subtitle: 'Abatimento sobre EPIs, químicos e insumos', metric: 'IBS + CBS' },
      { title: 'Simples vs. Presumido', subtitle: 'Transferência de crédito para cliente B2B', metric: 'B2B' },
      { title: 'Gross-up na FPV', subtitle: 'Cálculo por dentro e reequilíbrio contratual', metric: 'DRE Real' },
    ];
  }

  if (lower.includes('12x36') || lower.includes('portaria') || lower.includes('noturno') || lower.includes('vigil')) {
    return [
      { title: '4 Postos por Turno', subtitle: 'Cobertura 24h diurna e noturna sem furo', metric: '24x7' },
      { title: 'Adicional Noturno', subtitle: '20% + hora reduzida (52m30s) e prorrogação', metric: '+20% CCT' },
      { title: 'Intrajornada', subtitle: 'Cobertura de almocista ou indenização CCT', metric: '1h Turno' },
      { title: 'Reflexo no DSR', subtitle: 'Incidência sobre adicionais na folha', metric: 'Grupo A' },
      { title: 'Benefícios por Escala', subtitle: 'VT (teto 6%) e VA/VR por plantões efetivos', metric: '15,22 d/mês' },
    ];
  }

  if (lower.includes('limpeza') || lower.includes('insalub') || lower.includes('banheiro') || lower.includes('m²') || lower.includes('epi')) {
    return [
      { title: 'Insalubridade Súmula 448', subtitle: 'Grau médio (20%) ou máximo (40% TST)', metric: '20% a 40%' },
      { title: 'Reflexo nos Encargos', subtitle: 'Incidência direta sobre 13º, Férias e FGTS', metric: 'Grupos A/B' },
      { title: 'Produtividade m²', subtitle: 'Dimensionamento técnico ABNT NBR 14082', metric: 'SLA / m²' },
      { title: 'Enxoval & EPIs NR-6', subtitle: 'Vida útil mensal de luvas, botas e uniformes', metric: 'Montante B' },
      { title: 'Químicos & Papéis', subtitle: 'Rateio mensal per capita e diluição técnica', metric: 'R$ / Posto' },
    ];
  }

  if (lower.includes('repactua') || lower.includes('reajuste') || lower.includes('contrato')) {
    return [
      { title: 'Data-Base da CCT', subtitle: 'Direito ao reequilíbrio de mão de obra', metric: 'Anual' },
      { title: 'Montante A (CCT)', subtitle: 'Repasse integral do dissídio e benefícios', metric: '100% CCT' },
      { title: 'Montante B (IPCA)', subtitle: 'Correção de materiais, EPIs e máquinas', metric: 'IPCA/IGP-M' },
      { title: 'Memória Analítica', subtitle: 'Quadro comparativo antes vs. depois', metric: 'Auditável' },
      { title: 'Aditivo & Margem', subtitle: 'Proteção do lucro líquido e retroativo', metric: 'Blindagem' },
    ];
  }

  return [
    { title: 'Piso & CCT', subtitle: 'Salário normativo, escalas e adicionais', metric: 'Montante A' },
    { title: 'Encargos A a F', subtitle: 'Provisões trabalhistas e reflexos auditados', metric: '68% a 84%' },
    { title: 'Reforma 2027', subtitle: 'Simulação CBS, IBS e Gross-up por dentro', metric: 'IBS / CBS' },
    { title: 'Proposta por Link', subtitle: 'Rastreio de abertura e leitura ao vivo', metric: 'Ao Vivo' },
    { title: 'Blindagem de Margem', subtitle: 'DRE do projeto e reajuste anual', metric: 'Lucro Real' },
  ];
}

const STYLE_CYCLE: Array<'cascade' | 'light' | 'lphero'> = ['cascade', 'light', 'lphero'];

async function resolveStyleForSlug(slug: string, requestedStyle: string | null): Promise<'cascade' | 'light' | 'lphero'> {
  if (requestedStyle === 'cascade' || requestedStyle === 'light' || requestedStyle === 'lphero') {
    return requestedStyle;
  }
  try {
    const all = await getAllSeoArticles();
    const idx = all.findIndex((a) => a.slug === slug);
    if (idx >= 0) {
      return STYLE_CYCLE[idx % STYLE_CYCLE.length];
    }
  } catch {}
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return STYLE_CYCLE[hash % STYLE_CYCLE.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const rawStyleParam = searchParams.get('style');

  const [article, fonts, resolvedStyle] = await Promise.all([
    slug ? getSeoArticleBySlug(slug).catch(() => null) : Promise.resolve(null),
    loadBrandFonts(),
    resolveStyleForSlug(slug, rawStyleParam),
  ]);

  const rawTitle = article?.title || 'Montagem de Propostas e Orçamento de Facilities';
  const category = (article?.category || 'Engenharia de Custos').toUpperCase();
  const cards = getCascadeCardsForArticle(slug, rawTitle);

  // ============================================================================
  // MODELO 02: EDITORIAL CLARO DA LP + BENTO GRID DE MÉTRICAS (style=light) — 1080 x 1350 px
  // Inspirado no bloco claro da LP ("O fim do PDF que vai por e-mail e nunca mais volta.")
  // ============================================================================
  if (resolvedStyle === 'light') {
    const { firstHalf, secondHalf } = splitSentenceHeadline(rawTitle);

    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1350px',
            position: 'relative',
            overflow: 'hidden',
            background: '#F6F5F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 68px 58px 68px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          {/* Arcos Geométricos Sutis no Fundo Claro */}
          <div
            style={{
              position: 'absolute',
              top: '-280px',
              right: '-280px',
              width: '860px',
              height: '860px',
              borderRadius: '9999px',
              border: '1.5px solid rgba(27,77,62,0.08)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-160px',
              right: '-160px',
              width: '620px',
              height: '620px',
              borderRadius: '9999px',
              border: '1.5px solid rgba(224,90,27,0.10)',
              display: 'flex',
            }}
          />

          {/* TOPO: Tag Editorial + Selo de Série */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '28px', width: '944px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '944px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 22px',
                  borderRadius: '999px',
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E0D8',
                  boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#E05A1B', display: 'flex' }} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#1B4D3E', letterSpacing: '0.08em' }}>
                  {category}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#0E3427',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                <span>Engenharia de Custos • Guia 2027</span>
              </div>
            </div>

            {/* MANCHETE ESTILO LP CLARA: Preto Profundo #0F172A + Destaque Laranja #E05A1B */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '944px', marginTop: '4px' }}>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.035em',
                  color: '#0F172A',
                  display: 'flex',
                  width: '944px',
                }}
              >
                {firstHalf}
              </div>
              <div
                style={{
                  fontSize: '64px',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.035em',
                  color: '#E05A1B',
                  display: 'flex',
                  width: '944px',
                }}
              >
                {secondHalf}
              </div>
            </div>
          </div>

          {/* CENTRO: BENTO GRID EXECUTIVO (Card Destaque Verde-Floresta + 4 Cards Técnicos) */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '18px', width: '944px' }}>
            {/* Card Principal Escuro (Contraste com o Fundo Claro) */}
            <div
              style={{
                width: '944px',
                borderRadius: '28px',
                background: 'linear-gradient(135deg, #184E3B 0%, #092219 100%)',
                padding: '32px 38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 20px 45px rgba(9,34,25,0.16)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '630px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF7838', letterSpacing: '0.12em' }}>
                  PONTO CRÍTICO NA PLANILHA DE CUSTOS (FPV)
                </span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                  Um erro nesta rubrica corrói de 4% a 8% da margem líquida do contrato.
                </span>
              </div>
              <div
                style={{
                  padding: '18px 26px',
                  borderRadius: '20px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '34px', fontWeight: 800, color: '#FF7838' }}>{cards[0]?.metric || 'FPV'}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#D8E6DD' }}>{cards[0]?.title}</span>
              </div>
            </div>

            {/* Grid 2x2 de Cards Claros */}
            <div style={{ display: 'flex', gap: '18px', width: '944px' }}>
              {cards.slice(0, 2).map((c, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '26px 28px',
                    border: '1.5px solid #E5E3DC',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#E05A1B',
                        background: '#FFF3ED',
                        padding: '5px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      {`PILAR 0${i + 1}`}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#1B4D3E' }}>{c.metric}</span>
                  </div>
                  <span style={{ fontSize: '23px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{c.title}</span>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#475569', lineHeight: 1.35 }}>{c.subtitle}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '18px', width: '944px' }}>
              {cards.slice(2, 4).map((c, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '26px 28px',
                    border: '1.5px solid #E5E3DC',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#1B4D3E',
                        background: '#ECFDF5',
                        padding: '5px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      {`PILAR 0${i + 3}`}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#E05A1B' }}>{c.metric}</span>
                  </div>
                  <span style={{ fontSize: '23px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{c.title}</span>
                  <span style={{ fontSize: '16px', fontWeight: 500, color: '#475569', lineHeight: 1.35 }}>{c.subtitle}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ: Barra de Conversão Conectada à LP */}
          <div
            style={{
              width: '944px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '18px',
              borderTop: '1.5px solid #E2E0D8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>✓ Custos por CCT</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>✓ Proposta por link</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>✓ DRE do projeto</span>
            </div>

            <div
              style={{
                padding: '16px 32px',
                borderRadius: '999px',
                background: '#E05A1B',
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px rgba(224,90,27,0.28)',
              }}
            >
              <span>Testar grátis por 30 dias →</span>
            </div>
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

  // ============================================================================
  // MODELO 03: VITRINE HERO NATIVA DA LP + JANELA DO SISTEMA (style=lphero) — 1080 x 1350 px
  // ============================================================================
  if (resolvedStyle === 'lphero') {
    const { firstHalf, secondHalf } = splitSentenceHeadline(rawTitle);

    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1350px',
            display: 'flex',
            background: '#F6F5F0',
            padding: '24px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          <div
            style={{
              width: '1032px',
              height: '1302px',
              borderRadius: '36px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '64px 64px 0 64px',
              background: 'linear-gradient(145deg, #1E5D47 0%, #0E3427 48%, #071D15 100%)',
            }}
          >
            {/* Arcos Concêntricos da LP */}
            <div
              style={{
                position: 'absolute',
                top: '-220px',
                left: '-320px',
                width: '1100px',
                height: '1100px',
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
                width: '1400px',
                height: '1400px',
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
                width: '540px',
                height: '540px',
                borderRadius: '9999px',
                background: 'radial-gradient(circle, rgba(224,90,27,0.38) 0%, rgba(224,90,27,0) 70%)',
                display: 'flex',
              }}
            />

            {/* Ponto Luminoso Laranja do Radar da LP */}
            <div
              style={{
                position: 'absolute',
                top: '500px',
                right: '96px',
                width: '12px',
                height: '12px',
                borderRadius: '999px',
                background: '#FF6B2B',
                display: 'flex',
              }}
            />

            {/* Topo + Manchete Principal */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '30px', width: '904px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '904px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 22px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <div style={{ width: '9px', height: '9px', borderRadius: '999px', background: '#FF6B2B', display: 'flex' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#E2E8F0' }}>
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
                      padding: '11px 24px',
                      borderRadius: '999px',
                      background: '#E05A1B',
                      color: '#FFFFFF',
                      fontSize: '15px',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '904px' }}>
                <div
                  style={{
                    fontSize: '62px',
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: '-0.035em',
                    color: '#FFFFFF',
                    display: 'flex',
                    width: '904px',
                  }}
                >
                  {firstHalf}
                </div>
                <div
                  style={{
                    fontSize: '62px',
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: '-0.035em',
                    color: '#FF7332',
                    display: 'flex',
                    width: '904px',
                  }}
                >
                  {secondHalf}
                </div>
                <div
                  style={{
                    width: '480px',
                    height: '8px',
                    borderRadius: '999px',
                    background: '#E86325',
                    marginTop: '12px',
                    display: 'flex',
                  }}
                />
              </div>

              {/* Subtítulo idêntico à estrutura da LP */}
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#CBD5E1',
                  display: 'flex',
                  width: '820px',
                }}
              >
                Prospecção de decisores, custos por CCT, proposta rastreada e reajustes anuais numa só plataforma. Da primeira ligação à blindagem de margem.
              </div>
            </div>

            {/* Janela Branca da LP na Base */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255,255,255,0.13)',
                padding: '14px 14px 0 14px',
                borderRadius: '30px 30px 0 0',
                border: '1px solid rgba(255,255,255,0.18)',
                width: '904px',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px 20px 0 0',
                  padding: '26px 30px 40px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px',
                  width: '876px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '16px',
                    width: '816px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0', display: 'flex' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0', display: 'flex' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#E2E8F0', display: 'flex' }} />
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
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', padding: '6px 12px' }}>
                      Link da proposta
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: '8px',
                      }}
                    >
                      Rastreio de leitura
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', padding: '6px 12px' }}>
                      Radar comercial
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', padding: '6px 12px' }}>
                      DRE do projeto
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '816px' }}>
                  {cards.slice(0, 3).map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        background: idx === 2 ? '#FFF7ED' : '#F8FAFC',
                        border: idx === 2 ? '1px solid #FED7AA' : '1px solid #E2E8F0',
                        borderRadius: '18px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: idx === 2 ? '#9A3412' : '#64748B',
                        }}
                      >
                        {`0${idx + 1}. ${c.metric}`}
                      </span>
                      <span
                        style={{
                          fontSize: '21px',
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
        width: 1080,
        height: 1350,
        fonts,
      }
    );
  }

  // ============================================================================
  // MODELO 01: CASCATA 3D DE AGÊNCIA + CORES DA LP (style=cascade) — 1080 x 1350 px
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
