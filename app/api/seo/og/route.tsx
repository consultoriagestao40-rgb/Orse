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
  let clean = cleanArticleHeadline(text).toUpperCase();
  if (clean.includes('?')) {
    clean = `${clean.split('?')[0].trim()}?`;
  } else if (clean.includes(':')) {
    clean = clean.split(':')[0].trim();
  }
  const words = clean.split(/\s+/).filter(Boolean);
  const compactWords = trimTrailingStopwords(words.length > 11 ? words.slice(0, 11) : words);
  const splitIdx = Math.ceil(compactWords.length * 0.5);
  const first = compactWords.slice(0, splitIdx).join(' ');
  const second = compactWords.slice(splitIdx).join(' ');
  return { whitePart: first, orangePart: second };
}

function splitSentenceHeadline(text: string): { firstHalf: string; secondHalf: string } {
  let clean = cleanArticleHeadline(text);
  if (clean.includes('?')) {
    clean = `${clean.split('?')[0].trim()}?`;
  } else if (clean.includes(':')) {
    clean = clean.split(':')[0].trim();
  }
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

async function resolveStyleForSlug(_slug: string, requestedStyle: string | null): Promise<'cascade' | 'light' | 'lphero'> {
  if (requestedStyle === 'cascade' || requestedStyle === 'light' || requestedStyle === 'lphero') {
    return requestedStyle;
  }
  // Por padrão (ou style=auto), usa o Modelo 03 (Vitrine LP + Telas Reais do Sistema com dados sintéticos) aprovado pelo usuário
  return 'lphero';
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
  // MODELO 03: VITRINE HERO NATIVA DA LP + TELA DO SISTEMA (style=lphero) — 1080 x 1350 px
  // Suporta 4 telas reais do SmartBid (100% dados sintéticos de demonstração):
  // 1) fpv_table (Demonstrativo Analítico de Custos Montantes A, B, D e Impostos)
  // 2) proposals_radar (Propostas Comerciais, Revisões REV-01/REV-02 e Radar Comercial)
  // 3) sales_funnel (Funil Comercial de Conversão em 5 Etapas: Leads -> Fechamentos)
  // 4) annual_pipeline (Pipeline de Orçamentos Anuais, Dissídio CCT & Reforma 2027)
  // ============================================================================
  if (resolvedStyle === 'lphero') {
    const { whitePart, orangePart } = splitUpperHeadline(rawTitle);
    const textKey = `${slug} ${rawTitle}`.toLowerCase();

    let screenVariant: 'fpv_table' | 'proposals_radar' | 'sales_funnel' | 'annual_pipeline' = 'fpv_table';
    if (/funil|prospec|visita|lead|convers/i.test(textKey)) {
      screenVariant = 'sales_funnel';
    } else if (/revis|rev-01|controle de proposta|rastre|abertura|vendedor/i.test(textKey)) {
      screenVariant = 'proposals_radar';
    } else if (/anual|repactua|reajuste|diss[ií]dio|reforma|ibs|cbs|contrato/i.test(textKey)) {
      screenVariant = 'annual_pipeline';
    } else if (/proposta comercial/i.test(textKey) && !/planilha|custo|insalub|encargo/i.test(textKey)) {
      screenVariant = 'proposals_radar';
    } else {
      screenVariant = 'fpv_table';
    }

    const subtitleByVariant: Record<typeof screenVariant, string> = {
      fpv_table:
        'Pare de enviar seu Excel interno para o setor de Compras. Gere o Extrato Analítico Auditável (Montantes A, B, BDI e Impostos) em 1 clique:',
      proposals_radar:
        'Acompanhe todas as versões (REV-01, REV-02), metas da equipe e saiba o minuto exato em que o comprador abriu sua proposta:',
      sales_funnel:
        'Visualize a conversão real de Leads → Contatos → Visitas Técnicas → Propostas Emitidas → Contratos Fechados em tempo real:',
      annual_pipeline:
        'Controle o pipeline anual de orçamentos, alertas de data-base da CCT e simule a transição PIS/COFINS → IBS/CBS 2027 sem perder margem:',
    };

    const pillsByVariant: Record<typeof screenVariant, [string, string, string]> = {
      fpv_table: ['✓ Protege seu Excel interno', '✓ Padrão Compras B2B & Editais', '⚡ Gerado em 1 clique na FPV'],
      proposals_radar: ['✓ Histórico REV-01 e REV-02', '✓ Rastreio de Leitura ao Vivo', '⚡ Radar de Metas & Conversão'],
      sales_funnel: ['✓ 5 Etapas do Funil B2B', '✓ Gestão de Visitas & ATAs', '⚡ Taxa de Fechamento ao Vivo'],
      annual_pipeline: ['✓ Alerta Automático de CCT', '✓ Simulador IBS + CBS 2027', '⚡ Memória de Repactuação'],
    };

    const windowBarByVariant: Record<typeof screenVariant, { url: string; badge1: string; badge2: string }> = {
      fpv_table: {
        url: 'app.smartbidhub.com.br • Extrato da Proposta #FPV-2027',
        badge1: '✓ Memória Auditada por CCT',
        badge2: 'Fórmulas Internas Protegidas',
      },
      proposals_radar: {
        url: 'app.smartbidhub.com.br • Central de Propostas & Radar Comercial',
        badge1: '✓ Assinatura Digital Ativa',
        badge2: 'Telemetria em Tempo Real',
      },
      sales_funnel: {
        url: 'app.smartbidhub.com.br • Funil Comercial de Conversão',
        badge1: 'CONV. LEADS → VENDAS: 7.4%',
        badge2: 'FECHAMENTO PROPOSTAS: 18.5%',
      },
      annual_pipeline: {
        url: 'app.smartbidhub.com.br • Pipeline de Orçamentos Anuais & Repactuação',
        badge1: '✓ Motor Tributário 2027 Ativo',
        badge2: '3 CCTs com Data-Base no Mês',
      },
    };

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
              padding: '56px 58px 0 58px',
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
                border: '1px solid rgba(255,255,255,0.06)',
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
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
              }}
            />

            {/* Brilho Âmbar Inferior Direito da LP */}
            <div
              style={{
                position: 'absolute',
                bottom: '-160px',
                right: '-160px',
                width: '520px',
                height: '520px',
                borderRadius: '9999px',
                background: 'radial-gradient(circle, rgba(224,90,27,0.34) 0%, rgba(224,90,27,0) 70%)',
                display: 'flex',
              }}
            />

            {/* TOPO: Tag + Manchete Archivo Black Caixa Alta (Creme #F5EFE6 + Laranja #FF7838) + 3 Pílulas */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', width: '916px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '916px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 20px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <div style={{ width: '9px', height: '9px', borderRadius: '999px', background: '#FF7838', display: 'flex' }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.08em' }}>
                    {category}
                  </span>
                </div>

                <div
                  style={{
                    padding: '10px 22px',
                    borderRadius: '999px',
                    background: '#E05A1B',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Teste grátis de 30 dias ↗</span>
                </div>
              </div>

              {/* Manchete em Archivo Black Uppercase (idêntica ao Slide 01 aprovado) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '916px', marginTop: '2px' }}>
                <div
                  style={{
                    fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif',
                    fontSize: '54px',
                    fontWeight: 400,
                    lineHeight: 1.0,
                    letterSpacing: '-0.025em',
                    color: '#F5EFE6',
                    display: 'flex',
                    width: '916px',
                  }}
                >
                  {whitePart}
                </div>
                <div
                  style={{
                    fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif',
                    fontSize: '54px',
                    fontWeight: 400,
                    lineHeight: 1.0,
                    letterSpacing: '-0.025em',
                    color: '#FF7838',
                    display: 'flex',
                    width: '916px',
                  }}
                >
                  {orangePart}
                </div>
              </div>

              {/* Subtítulo Executivo */}
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: 1.38,
                  color: '#D8E6DD',
                  display: 'flex',
                  width: '890px',
                }}
              >
                {subtitleByVariant[screenVariant]}
              </div>

              {/* 3 Pílulas de Benefício */}
              <div style={{ display: 'flex', gap: '14px', width: '916px' }}>
                <div
                  style={{
                    padding: '10px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'flex',
                  }}
                >
                  {pillsByVariant[screenVariant][0]}
                </div>
                <div
                  style={{
                    padding: '10px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'flex',
                  }}
                >
                  {pillsByVariant[screenVariant][1]}
                </div>
                <div
                  style={{
                    padding: '10px 18px',
                    borderRadius: '14px',
                    background: 'rgba(224,90,27,0.22)',
                    border: '1px solid rgba(255,120,56,0.45)',
                    color: '#FF9E6D',
                    fontSize: '15px',
                    fontWeight: 800,
                    display: 'flex',
                  }}
                >
                  {pillsByVariant[screenVariant][2]}
                </div>
              </div>
            </div>

            {/* BASE: JANELA REALISTA DO SISTEMA SMARTBID (100% DADOS SINTÉTICOS DE DEMONSTRAÇÃO) */}
            <div
              style={{
                position: 'relative',
                width: '916px',
                borderRadius: '26px 26px 0 0',
                background: '#0B231A',
                padding: '14px 14px 0 14px',
                border: '1.5px solid rgba(255,255,255,0.18)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '18px 18px 0 0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '888px',
                }}
              >
                {/* Barra superior do navegador app.smartbidhub.com.br */}
                <div
                  style={{
                    background: '#F8FAFC',
                    padding: '13px 22px',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '888px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#CBD5E1', display: 'flex' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#CBD5E1', display: 'flex' }} />
                    <div style={{ width: '11px', height: '11px', borderRadius: '99px', background: '#CBD5E1', display: 'flex' }} />
                    <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: 700, color: '#64748B' }}>
                      {windowBarByVariant[screenVariant].url}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '99px',
                        background: '#ECFDF5',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {windowBarByVariant[screenVariant].badge1}
                    </span>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '99px',
                        background: '#FFF7ED',
                        color: '#C2410C',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {windowBarByVariant[screenVariant].badge2}
                    </span>
                  </div>
                </div>

                {screenVariant === 'proposals_radar' ? (
                  /* TELA 2: PROPOSTAS COMERCIAIS, REVISÕES (REV-01/REV-02) & RADAR DE METAS */
                  <div style={{ padding: '18px 22px 24px 22px', display: 'flex', flexDirection: 'column', gap: '14px', width: '888px' }}>
                    <div
                      style={{
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)',
                        padding: '16px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: '#FFFFFF',
                        width: '844px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '3px 9px',
                              borderRadius: '99px',
                              background: 'rgba(255,255,255,0.14)',
                            }}
                          >
                            META CORPORATIVA
                          </span>
                          <span style={{ fontSize: '12px', color: '#BFDBFE', fontWeight: 600 }}>
                            Cockpit Executivo de Conversão & Pipeline
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.09)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '10px',
                              padding: '7px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <span style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>PROJEÇÃO MENSAL (RUN-RATE)</span>
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>R$ 784.500,00</span>
                          </div>
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.09)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '10px',
                              padding: '7px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <span style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>PIPELINE EM NEGOCIAÇÃO</span>
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>R$ 1.840.200,00</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>FATURAMENTO ACEITO / META</span>
                          <span style={{ fontSize: '24px', fontWeight: 800 }}>R$ 312.800,00</span>
                          <span style={{ fontSize: '11px', color: '#CBD5E1' }}>Meta Mensal: R$ 400.000,00</span>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.09)',
                            borderRadius: '12px',
                            padding: '8px 14px',
                            border: '1px solid rgba(255,255,255,0.16)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FBBF24' }}>78.2%</span>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#FDE68A' }}>RITMO FORTE</span>
                        </div>
                      </div>
                    </div>

                    {/* Tabela de Propostas Comerciais e Revisões (Dados Sintéticos) */}
                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '844px',
                      }}
                    >
                      <div
                        style={{
                          background: '#163B88',
                          padding: '10px 16px',
                          display: 'flex',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          width: '844px',
                        }}
                      >
                        <span style={{ width: '155px' }}>FPV REFERÊNCIA</span>
                        <span style={{ width: '250px' }}>CLIENTE (DEMONSTRAÇÃO B2B)</span>
                        <span style={{ width: '140px' }}>RESPONSÁVEL</span>
                        <span style={{ width: '120px' }}>VALOR MENSAL</span>
                        <span style={{ width: '95px' }}>STATUS</span>
                        <span style={{ width: '52px' }}>RASTREIO</span>
                      </div>

                      {[
                        {
                          ref: 'FPV-108-REV-02',
                          client: 'Condomínio Corporate Tower',
                          owner: 'Lucas Mendes',
                          val: 'R$ 42.890,00',
                          status: 'APROVADA',
                          track: 'Lida 4x',
                          muted: false,
                        },
                        {
                          ref: 'FPV-108-REV-01',
                          client: 'Condomínio Corporate Tower',
                          owner: 'Lucas Mendes',
                          val: 'R$ 45.120,00',
                          status: 'REVISADA v1',
                          track: 'Salvo',
                          muted: true,
                        },
                        {
                          ref: 'FPV-107-REV-01',
                          client: 'Indústria Metalúrgica Atlas S/A',
                          owner: 'Camila Rocha',
                          val: 'R$ 68.450,00',
                          status: 'APROVADA',
                          track: 'Lida 6x',
                          muted: false,
                        },
                        {
                          ref: 'FPV-106-REV-01',
                          client: 'Centro Logístico Sul Brasil',
                          owner: 'Rafael Costa',
                          val: 'R$ 31.940,00',
                          status: 'EM ANÁLISE',
                          track: 'Há 4 min',
                          muted: false,
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: idx < 3 ? '1px solid #E2E8F0' : 'none',
                            fontSize: '12px',
                            background: row.muted ? '#F8FAFC' : '#FFFFFF',
                            width: '844px',
                          }}
                        >
                          <span style={{ width: '155px', fontWeight: 800, color: row.muted ? '#64748B' : '#0F172A' }}>{row.ref}</span>
                          <span style={{ width: '250px', fontWeight: 700, color: row.muted ? '#64748B' : '#1E293B' }}>{row.client}</span>
                          <span style={{ width: '140px', color: '#475569', fontWeight: 600 }}>{row.owner}</span>
                          <span style={{ width: '120px', fontWeight: 800, color: row.muted ? '#64748B' : '#163B88' }}>{row.val}</span>
                          <span style={{ width: '95px', fontWeight: 800, color: row.muted ? '#64748B' : '#0F172A', fontSize: '10px' }}>
                            {row.status}
                          </span>
                          <span style={{ width: '52px', fontWeight: 800, color: '#059669', fontSize: '11px' }}>{row.track}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : screenVariant === 'sales_funnel' ? (
                  /* TELA 3: FUNIL COMERCIAL DE CONVERSÃO EM 5 ETAPAS (100% DADOS SINTÉTICOS) */
                  <div style={{ padding: '18px 22px 24px 22px', display: 'flex', flexDirection: 'column', gap: '14px', width: '888px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '844px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#163B88', letterSpacing: '0.04em' }}>
                          FUNIL COMERCIAL DE CONVERSÃO (VOLUME EM QUANTIDADES)
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.03em' }}>
                          JORNADA COMPLETA: PROSPECÇÃO, PRIMEIRO CONTATO, VISITAS TÉCNICAS, PROPOSTAS E FECHAMENTO
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '844px' }}>
                      {/* Pirâmide Invertida em 5 Degraus */}
                      <div style={{ width: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {[
                          { w: '430px', bg: '#1D4ED8', num: '240', label: 'LEADS' },
                          { w: '360px', bg: '#4338CA', num: '68', label: 'CONTATADOS' },
                          { w: '295px', bg: '#D97706', num: '42', label: 'VISITAS' },
                          { w: '235px', bg: '#7E22CE', num: '96', label: 'EMITIDAS' },
                          { w: '180px', bg: '#059669', num: '18', label: 'FECHAMENTOS' },
                        ].map((st, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: st.w,
                              height: '58px',
                              borderRadius: '12px',
                              background: st.bg,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                            }}
                          >
                            <span style={{ fontSize: '26px', fontWeight: 800 }}>{st.num}</span>
                            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em' }}>{st.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* 5 Cards de Taxa de Conversão */}
                      <div style={{ width: '384px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { step: '1. LEADS', desc: 'Oportunidades no radar', metric: '100%', color: '#1D4ED8', bg: '#FFFFFF' },
                          { step: '2. CONTATOS', desc: 'Primeiro contato ativo', metric: '28.3%', color: '#4338CA', bg: '#FFFFFF' },
                          { step: '3. VISITAS', desc: 'Vistorias técnicas & ATAs', metric: '61.8%', color: '#D97706', bg: '#FFFFFF' },
                          { step: '4. PROPOSTAS', desc: 'Propostas + revisões (REV)', metric: '228%', color: '#7E22CE', bg: '#FFFFFF' },
                          { step: '5. VENDAS FECHADAS', desc: 'Contratos convertidos', metric: '18.5%', color: '#059669', bg: '#ECFDF5' },
                        ].map((card, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '384px',
                              height: '58px',
                              borderRadius: '12px',
                              border: idx === 4 ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                              background: card.bg,
                              padding: '0 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: card.color }}>{card.step}</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{card.desc}</span>
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: card.color }}>{card.metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : screenVariant === 'annual_pipeline' ? (
                  /* TELA 4: PIPELINE DE ORÇAMENTOS ANUAIS, DISSÍDIO CCT & REFORMA 2027 (100% DADOS SINTÉTICOS) */
                  <div style={{ padding: '18px 22px 24px 22px', display: 'flex', flexDirection: 'column', gap: '14px', width: '888px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '844px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#163B88' }}>
                          PIPELINE DE ORÇAMENTOS & CONTRATOS ANUAIS
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#475569',
                            background: '#F1F5F9',
                            padding: '3px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          TOTAL: 94 ATIVOS
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#059669',
                          background: '#ECFDF5',
                          padding: '5px 12px',
                          borderRadius: '8px',
                        }}
                      >
                        Receita Anual Sob Gestão: R$ 14.820.000,00
                      </span>
                    </div>

                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '844px',
                      }}
                    >
                      <div
                        style={{
                          background: '#163B88',
                          padding: '10px 16px',
                          display: 'flex',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          width: '844px',
                        }}
                      >
                        <span style={{ width: '120px' }}>ID / PROPOSTA</span>
                        <span style={{ width: '250px' }}>CLIENTE CORPORATIVO (EXEMPLO)</span>
                        <span style={{ width: '145px' }}>REGIME / IMPOSTO</span>
                        <span style={{ width: '130px' }}>VALOR ANUAL (12M)</span>
                        <span style={{ width: '100px' }}>STATUS</span>
                        <span style={{ width: '65px' }}>VERSÃO</span>
                      </div>

                      {[
                        {
                          id: 'FPV-114 (Jan)',
                          client: 'Complexo Empresarial Alpha Park',
                          tax: 'IVA Dual (IBS/CBS)',
                          val: 'R$ 514.680,00',
                          st: 'APROVADA',
                          ver: 'v2 (CCT)',
                        },
                        {
                          id: 'FPV-113 (Fev)',
                          client: 'Hospital & Maternidade Santa Clara',
                          tax: 'Lucro Real (Crédito)',
                          val: 'R$ 1.284.900,00',
                          st: 'APROVADA',
                          ver: 'v1',
                        },
                        {
                          id: 'FPV-112 (Mar)',
                          client: 'Rede Atacadista Sul Brasil (6 Lojas)',
                          tax: 'Lucro Presumido',
                          val: 'R$ 892.400,00',
                          st: 'EM REAJUSTE',
                          ver: '+6.8% CCT',
                        },
                        {
                          id: 'FPV-111 (Abr)',
                          client: 'Parque Industrial Metropolitano',
                          tax: 'IVA Dual (IBS/CBS)',
                          val: 'R$ 748.200,00',
                          st: 'APROVADA',
                          ver: 'v1',
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: idx < 3 ? '1px solid #E2E8F0' : 'none',
                            fontSize: '12px',
                            background: '#FFFFFF',
                            width: '844px',
                          }}
                        >
                          <span style={{ width: '120px', fontWeight: 800, color: '#0F172A' }}>{row.id}</span>
                          <span style={{ width: '250px', fontWeight: 700, color: '#1E293B' }}>{row.client}</span>
                          <span style={{ width: '145px', fontWeight: 700, color: '#1D4ED8' }}>{row.tax}</span>
                          <span style={{ width: '130px', fontWeight: 800, color: '#0F172A' }}>{row.val}</span>
                          <span style={{ width: '100px', fontWeight: 800, color: '#334155', fontSize: '10px' }}>{row.st}</span>
                          <span style={{ width: '65px', fontWeight: 800, color: '#059669', fontSize: '11px' }}>{row.ver}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        borderRadius: '12px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        padding: '11px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '844px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        ✓ Memória de Repactuação: Quadro Comparativo Antes vs. Depois (Montante A por CCT + Montante B por IPCA + Gross-up 2027)
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669' }}>Margem Blindada ✓</span>
                    </div>
                  </div>
                ) : (
                  /* TELA 1: PLANILHA DE CUSTOS — DEMONSTRATIVO ANALÍTICO (IDÊNTICO AO SLIDE 01 APROVADO) */
                  <div style={{ padding: '18px 22px 24px 22px', display: 'flex', flexDirection: 'column', width: '888px' }}>
                    <div
                      style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '844px',
                      }}
                    >
                      <div
                        style={{
                          background: '#163B88',
                          padding: '13px 20px',
                          display: 'flex',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '17px',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          borderBottom: '1px solid rgba(255,255,255,0.18)',
                          width: '844px',
                        }}
                      >
                        PLANILHA DE CUSTOS — DEMONSTRATIVO ANALÍTICO
                      </div>
                      <div
                        style={{
                          background: '#1E4699',
                          padding: '7px 20px',
                          display: 'flex',
                          justifyContent: 'center',
                          color: '#E2E8F0',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          width: '844px',
                        }}
                      >
                        {`MONTANTE "A" - MÃO DE OBRA + ENCARGOS SOCIAIS (CCT)`}
                      </div>

                      <div
                        style={{
                          background: '#F8FAFC',
                          padding: '9px 20px',
                          display: 'flex',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#475569',
                          borderBottom: '1px solid #E2E8F0',
                          width: '844px',
                        }}
                      >
                        <span style={{ width: '400px' }}>1) FUNÇÃO / ESCALA</span>
                        <span style={{ width: '90px' }}>POSTOS</span>
                        <span style={{ width: '120px' }}>ESCALA</span>
                        <span style={{ width: '110px' }}>UNITÁRIO</span>
                        <span style={{ width: '84px' }}>TOTAL</span>
                      </div>

                      <div
                        style={{
                          padding: '11px 20px',
                          display: 'flex',
                          fontSize: '13px',
                          color: '#0F172A',
                          borderBottom: '1px solid #F1F5F9',
                          alignItems: 'center',
                          width: '844px',
                        }}
                      >
                        <span style={{ width: '400px', fontWeight: 700 }}>Auxiliar de Limpeza & Conservação (Insalub. 20%)</span>
                        <span style={{ width: '90px', fontWeight: 800 }}>04</span>
                        <span style={{ width: '120px', fontWeight: 600, color: '#475569' }}>5x2 (44h)</span>
                        <span style={{ width: '110px', fontWeight: 600, color: '#334155' }}>R$ 4.605,00</span>
                        <span style={{ width: '84px', fontWeight: 800 }}>R$ 18.420,00</span>
                      </div>

                      <div
                        style={{
                          padding: '11px 20px',
                          display: 'flex',
                          fontSize: '13px',
                          color: '#0F172A',
                          borderBottom: '1px solid #E2E8F0',
                          alignItems: 'center',
                          width: '844px',
                        }}
                      >
                        <span style={{ width: '400px', fontWeight: 700 }}>Líder de Limpeza Técnica & Conservação Predial</span>
                        <span style={{ width: '90px', fontWeight: 800 }}>01</span>
                        <span style={{ width: '120px', fontWeight: 600, color: '#475569' }}>5x2 (44h)</span>
                        <span style={{ width: '110px', fontWeight: 600, color: '#334155' }}>R$ 5.480,00</span>
                        <span style={{ width: '84px', fontWeight: 800 }}>R$ 5.480,00</span>
                      </div>

                      <div
                        style={{
                          background: '#163B88',
                          padding: '9px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 800,
                          width: '844px',
                        }}
                      >
                        <span>{`TOTAL DO MONTANTE "A" (BLOCO A)`}</span>
                        <span>R$ 23.900,00</span>
                      </div>

                      <div
                        style={{
                          background: '#1E4699',
                          padding: '7px 20px',
                          display: 'flex',
                          color: '#E2E8F0',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          width: '844px',
                        }}
                      >
                        {`MONTANTE "B" - INSUMOS, UNIFORMES, EPIS E EQUIPAMENTOS`}
                      </div>

                      <div
                        style={{
                          padding: '10px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#1E293B',
                          borderBottom: '1px solid #F1F5F9',
                          background: '#FFFFFF',
                          width: '844px',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>1) Materiais Químicos, Saneantes e Descartáveis</span>
                        <span style={{ fontWeight: 700 }}>R$ 1.540,00</span>
                      </div>
                      <div
                        style={{
                          padding: '10px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#1E293B',
                          borderBottom: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          width: '844px',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>2) Enxoval de Uniformes, EPIs (NR-6) e Depreciação de Máquinas</span>
                        <span style={{ fontWeight: 700 }}>R$ 1.120,00</span>
                      </div>

                      <div
                        style={{
                          background: '#1E4699',
                          padding: '7px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 800,
                          width: '844px',
                        }}
                      >
                        <span>{`MONTANTE "D" - BDI (TAXA ADM + LUCRO) + IMPOSTOS POR DENTRO`}</span>
                        <span>27.25%</span>
                      </div>

                      <div
                        style={{
                          padding: '10px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#0F172A',
                          background: '#E2E8F0',
                          fontWeight: 800,
                          width: '844px',
                        }}
                      >
                        <span>BDI (13.00%) + Impostos Gross-up (ISS / PIS / COFINS / CBS 14.25%)</span>
                        <span>R$ 9.955,39</span>
                      </div>

                      <div
                        style={{
                          background: '#0F296B',
                          padding: '13px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: '#FFFFFF',
                          width: '844px',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em' }}>
                          TOTAL MENSAL DOS MONTANTES + IMPOSTOS
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#FF9E6D' }}>R$ 36.515,39</span>
                      </div>
                    </div>
                  </div>
                )}
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
