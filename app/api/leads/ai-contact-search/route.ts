import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Gera links de busca inteligentes para LinkedIn, Instagram e WhatsApp
// Esta abordagem é 100% confiável porque não depende de scraping bloqueado em datacenters.
// O vendedor abre cada link com 1 clique no próprio navegador (onde já está logado no LinkedIn).

function buildSearchLinks(empresa: string, cargo: string) {
  const empresaEnc = encodeURIComponent(empresa);
  const cargoEnc = encodeURIComponent(cargo);
  const combinadoEnc = encodeURIComponent(`"${empresa}" "${cargo}"`);
  const combinadoLinkedinEnc = encodeURIComponent(`site:linkedin.com/in "${empresa}" "${cargo}"`);
  const instagramEnc = encodeURIComponent(`site:instagram.com "${cargo}" "${empresa}"`);
  const whatsappEnc = encodeURIComponent(`"${empresa}" "${cargo}" whatsapp OR "wa.me"`);

  return {
    cargo,
    // LinkedIn Search - busca direto na plataforma (vendedor precisa estar logado)
    linkedinSearch: `https://www.linkedin.com/search/results/people/?keywords=${empresaEnc}%20${cargoEnc}&origin=GLOBAL_SEARCH_HEADER`,
    // Google Search para LinkedIn (funciona sem login)
    googleLinkedin: `https://www.google.com/search?q=${combinadoLinkedinEnc}`,
    // Instagram via Google
    googleInstagram: `https://www.google.com/search?q=${instagramEnc}`,
    // WhatsApp via Google
    googleWhatsapp: `https://www.google.com/search?q=${whatsappEnc}`,
    // Busca geral no Google
    googleGeral: `https://www.google.com/search?q=${combinadoEnc}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { empresa, cargos } = await req.json() as { empresa: string; cargos: string[] };

    if (!empresa || !Array.isArray(cargos) || cargos.length === 0) {
      return NextResponse.json({ error: 'empresa e cargos são obrigatórios' }, { status: 400 });
    }

    // Gera links para cada cargo
    const searchCards = cargos.slice(0, 15).map(cargo => buildSearchLinks(empresa, cargo));

    // Também gera um link combinado para buscar todos os cargos de uma vez no LinkedIn
    const allCargosQuery = cargos.slice(0, 5).join(' OR ');
    const linkedinAllUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(empresa + ' ' + allCargosQuery)}&origin=GLOBAL_SEARCH_HEADER`;
    const googleAllUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${empresa}" (${allCargosQuery})`)}`;

    return NextResponse.json({
      success: true,
      mode: 'search_links', // indica que o retorno são links de busca, não contatos automáticos
      empresa,
      cargos,
      searchCards,
      combinados: {
        linkedinAll: linkedinAllUrl,
        googleAll: googleAllUrl,
      },
    });

  } catch (error: any) {
    console.error('Erro na geração de links:', error);
    return NextResponse.json({
      error: 'Erro interno.',
      details: error.message
    }, { status: 500 });
  }
}
