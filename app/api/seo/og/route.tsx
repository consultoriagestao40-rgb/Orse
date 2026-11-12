import { ImageResponse } from 'next/og';
import { getSeoArticleBySlug, normalizePortugueseTopic } from '@/lib/seo-engine';

export const runtime = 'nodejs';

const THEMATIC_PHOTOS: string[] = [
  // 0: Torres Corporativas Financeiras (Reforma Tributária / B2B)
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
  // 1: Reunião Executiva / Propostas Comerciais
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85',
  // 2: Auditoria de Folha e Encargos Trabalhistas
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85',
  // 3: Complexo Predial & Gestão de Facilities
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85',
  // 4: Ambiente Corporativo Moderno
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
  // 5: Lobby Corporativo / Portaria & Controle de Acesso 12x36
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85',
  // 6: Contratos, Repactuação & Assinatura Jurídica
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=85',
  // 7: Operação Técnica de Limpeza e Higienização Profissional
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=85',
  // 8: Inteligência de Dados, Regime Tributário & Dashboards
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
  // 9: Condomínios Empresariais & Patrimônio
  'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=85',
  // 10: Planejamento Orçamentário & Planilha de Custos (FPV)
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=85',
  // 11: Engenharia de Manutenção Predial & Equipamentos
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85',
  // 12: Apresentação de Proposta Comercial para Diretoria
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=85',
  // 13: Operações Industriais & Logística B2B
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=85',
  // 14: Negociação Comercial B2B & Fechamento
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=85',
  // 15: Executivo Sênior / BDI e Margem de Lucro
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
];

const SLUG_PHOTO_MAP: Record<string, number> = {
  'reforma-tributaria-ibs-cbs-impacto-empresas-limpeza-portaria-facilities': 0,
  'software-montagem-de-propostas-terceirizacao-servicos-facilities': 1,
  'como-calcular-encargos-sociais-trabalhistas-terceirizacao-cct': 2,
  'como-montar-orcamento-anual-de-facilities-do-zero-planilha-controle': 3,
  'calculo-escala-12x36-portaria-limpeza-adicional-noturno-intrajornada': 5,
  'como-fazer-repactuacao-reajuste-contratos-terceirizacao-cct': 6,
  'simples-nacional-anexo-iii-anexo-iv-lucro-presumido-real-terceirizacao': 8,
  'planilha-formacao-de-preco-de-venda-fpv-facilities-terceirizacao': 10,
  'proposta-comercial-servicos-limpeza-portaria-facilities-modelo': 12,
  'calculo-bdi-taxa-administracao-lucro-orcamento-prestacao-servicos': 15,
};

function selectPhotoUrl(slug: string, title: string, photoParam: string | null): string {
  if (photoParam !== null && photoParam !== '' && !Number.isNaN(Number(photoParam))) {
    const idx = Math.abs(Number(photoParam)) % THEMATIC_PHOTOS.length;
    return THEMATIC_PHOTOS[idx];
  }
  if (SLUG_PHOTO_MAP[slug] !== undefined) {
    return THEMATIC_PHOTOS[SLUG_PHOTO_MAP[slug]];
  }
  const lower = `${slug} ${title}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }

  if (lower.includes('limpeza') || lower.includes('insalub') || lower.includes('higien') || lower.includes('epi')) {
    const pool = [7, 4, 3, 13];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }
  if (lower.includes('portaria') || lower.includes('12x36') || lower.includes('vigil') || lower.includes('acesso')) {
    const pool = [5, 9, 3];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }
  if (lower.includes('manutencao') || lower.includes('manutenção') || lower.includes('pmoc') || lower.includes('máquina')) {
    const pool = [11, 13, 3];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }
  if (lower.includes('reforma') || lower.includes('tribut') || lower.includes('ibs') || lower.includes('simples')) {
    const pool = [0, 8, 10, 2];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }
  if (lower.includes('contrato') || lower.includes('repactua') || lower.includes('reajuste')) {
    const pool = [6, 14, 15];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }
  if (lower.includes('proposta') || lower.includes('comercial') || lower.includes('vendas')) {
    const pool = [12, 1, 14];
    return THEMATIC_PHOTOS[pool[hash % pool.length]];
  }

  return THEMATIC_PHOTOS[hash % THEMATIC_PHOTOS.length];
}

function stripBrandFromEditorialText(text: string): string {
  return normalizePortugueseTopic(text)
    .replace(/\(Guia 2026\)/gi, '(Guia 2027)')
    .replace(/\(2026\)/gi, '(2027)')
    .replace(/no SmartBid Hub/gi, 'em sistema especializado')
    .replace(/para o SmartBid Hub/gi, 'para plataforma integrada')
    .replace(/SmartBid Hub/gi, 'Sistema Especializado');
}

function splitHeadlineForHighlight(title: string): { before: string; highlight: string; after: string } {
  const clean = title.replace(/\s*\(Guia 2027\)/i, '').replace(/\s*\(2027\)/i, '').trim();
  const words = clean.split(/\s+/);
  if (words.length <= 6) {
    const half = Math.ceil(words.length / 2);
    return {
      before: words.slice(0, half).join(' ') + ' ',
      highlight: words.slice(half).join(' '),
      after: '',
    };
  }
  // Destaca o trecho central/final mais forte (4 a 5 palavras) em laranja dourado
  const startHighlight = Math.max(2, Math.floor(words.length * 0.38));
  const endHighlight = Math.min(words.length, startHighlight + 4);
  return {
    before: words.slice(0, startHighlight).join(' ') + ' ',
    highlight: words.slice(startHighlight, endHighlight).join(' '),
    after: endHighlight < words.length ? ' ' + words.slice(endHighlight).join(' ') : '',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const style = searchParams.get('style') || 'cover'; // 'cover' (padrão Forbes/Exame) ou 'infographic'
  const photoParam = searchParams.get('photo');

  const article = slug ? await getSeoArticleBySlug(slug).catch(() => null) : null;

  const rawTitle =
    article?.title ||
    'Como Montar Propostas e Planilhas de Custos (FPV) para Terceirização e Facilities';
  const title = stripBrandFromEditorialText(rawTitle);

  const category = (article?.category || 'Engenharia de Custos & FPV').toUpperCase();
  const rawSummary =
    article?.excerpt ||
    article?.metaDescription ||
    'Guia técnico completo sobre formação de preço de venda (FPV por CCT), encargos trabalhistas, virada da Reforma Tributária em 2027 (IBS/CBS) e propostas comerciais B2B.';
  const summary = stripBrandFromEditorialText(rawSummary);

  // ESTILO 1 (PADRÃO): CAPA EDITORIAL FOTOGRÁFICA DE IMPACTO (1080 x 1350 px — Formato 4:5 Oficial Instagram & LinkedIn)
  if (style !== 'infographic') {
    const photoUrl = selectPhotoUrl(slug, title, photoParam);
    let photoDataUrl = photoUrl;
    try {
      const imgRes = await fetch(photoUrl, { signal: AbortSignal.timeout(6000) });
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');
        photoDataUrl = `data:image/jpeg;base64,${base64}`;
      }
    } catch {}

    const cleanHeadline = title.replace(/\s*\(Guia 2027\)/i, '').replace(/\s*\(2027\)/i, '').trim();

    return new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1350px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            background: '#07130E',
            fontFamily: 'sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Fotografia Temática Realista de Fundo */}
          <img
            src={photoDataUrl}
            width={1080}
            height={1350}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1080px',
              height: '1350px',
              objectFit: 'cover',
            }}
          />

          {/* Camada Gradiente Cinematográfica (Estilo Forbes / Exame / HBR) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1080px',
              height: '1350px',
              display: 'flex',
              background:
                'linear-gradient(180deg, rgba(6,19,14,0.68) 0%, rgba(6,19,14,0.32) 28%, rgba(6,19,14,0.90) 60%, rgba(4,13,9,0.98) 100%)',
            }}
          />

          {/* Topo Minimalista Editorial */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '62px 68px 0 68px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '999px',
                  background: '#E07A2F',
                }}
              />
              <span
                style={{
                  color: '#F8FAFC',
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                }}
              >
                INTELIGÊNCIA B2B • FACILITIES & TERCEIRIZAÇÃO
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 22px',
                borderRadius: '999px',
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(253, 186, 116, 0.45)',
                color: '#FDBA74',
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              {category}
            </div>
          </div>

          {/* Bloco Inferior com Manchete Gigante de Impacto (Nó de texto único para quebra de linha 100% nativa no Satori) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              padding: '0 68px 72px 68px',
              gap: '26px',
              width: '1080px',
            }}
          >
            {/* Barra Laranja + Sub-selo Dourado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '84px',
                  height: '8px',
                  borderRadius: '4px',
                  background: '#E07A2F',
                  display: 'flex',
                }}
              />
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#FDBA74',
                  letterSpacing: '0.1em',
                }}
              >
                DIRETRIZES TÉCNICAS & GESTÃO DE MARGEM
              </span>
            </div>

            {/* Título Editorial Grande (Nó de texto simples para quebra de linha perfeita sem sobreposição) */}
            <div
              style={{
                fontSize: cleanHeadline.length > 85 ? '50px' : '56px',
                fontWeight: 900,
                lineHeight: 1.14,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                display: 'flex',
                width: '944px',
              }}
            >
              {cleanHeadline}
            </div>

            {/* Subtítulo Executivo Conciso */}
            <div
              style={{
                fontSize: '25px',
                fontWeight: 500,
                lineHeight: 1.42,
                color: '#E2E8F0',
                display: 'flex',
                width: '944px',
                borderLeft: '5px solid #E07A2F',
                paddingLeft: '22px',
              }}
            >
              {summary}
            </div>

            {/* Rodapé Editorial Limpo (Funciona no LinkedIn e no Instagram) */}
            <div
              style={{
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '944px',
              }}
            >
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#94A3B8',
                  letterSpacing: '0.08em',
                }}
              >
                ENGENHARIA DE CUSTOS • CCT • FPV • 2027
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#FDBA74',
                }}
              >
                Leia a análise completa na legenda ↓
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1350,
      }
    );
  }

  // ESTILO 2 (OPCIONAL / SEGUNDO SLIDE DE CARROSSEL): INFOGRÁFICO TÉCNICO (1350 x 1350 px)
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 72px 44px 72px',
            gap: '28px',
            background: '#FAF7F2',
          }}
        >
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
                }}
              >
                FPV
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '25px', fontWeight: 900, color: '#0F172A' }}>
                  ENGENHARIA DE CUSTOS & PRECIFICAÇÃO B2B
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#475569', letterSpacing: '0.08em' }}>
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
              }}
            >
              {category}
            </div>
          </div>

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '999px', background: '#34D399' }} />
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#6EE7B7', letterSpacing: '0.08em' }}>
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

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFFFF',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
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
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#34D399' }}>AUDITORIA DE MARGEM B2B</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', padding: '24px 28px', gap: '16px' }}>
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
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A' }}>
                      {`0${idx + 1}. ${row[0] || ''}`}
                    </span>
                    <span style={{ fontSize: '18px', color: '#334155', fontWeight: 600 }}>{row[1] || ''}</span>
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#E2E8F0' }}>
              ENGENHARIA DE CUSTOS • CONVENÇÕES COLETIVAS (CCT) & GESTÃO DE MARGEM
            </span>
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
    ),
    {
      width: 1350,
      height: 1350,
    }
  );
}
