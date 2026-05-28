import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { termo, localizacao } = await req.json();

    if (!termo || !localizacao) {
      return NextResponse.json({ error: 'Termo e localização são obrigatórios' }, { status: 400 });
    }

    const normalizedTermo = termo.trim().toLowerCase();
    const normalizedLocalizacao = localizacao.trim().toLowerCase();

    // 1. Verificar se já temos esse termo e localização cacheados no banco de dados local
    const cachedProspects = await prisma.prospectCache.findMany({
      where: {
        termo: normalizedTermo,
        localizacao: normalizedLocalizacao
      },
      orderBy: { avaliacoes: 'desc' }
    });

    if (cachedProspects.length > 0) {
      console.log(`[Cache Hit] Retornando ${cachedProspects.length} resultados reais do banco local para: "${termo} em ${localizacao}"`);
      const results = cachedProspects.map(p => ({
        nomeFantasia: p.nomeFantasia,
        endereco: p.endereco || 'Endereço não informado',
        telefone: p.telefone || 'Não informado',
        site: p.site || null,
        porte: p.porte || 'Pequeno',
        avaliacoes: p.avaliacoes,
        segmento: p.segmento || termo
      }));
      return NextResponse.json({ success: true, results });
    }

    // 2. Se não estiver cacheado, buscamos na API real do Google
    const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

    // Fallback de contingência caso a chave não esteja configurada no servidor
    if (!API_KEY) {
      console.log('Chave GOOGLE_PLACES_API_KEY não configurada. Usando MOCK para testes.');
      await new Promise(r => setTimeout(r, 1000));
      const mocks = [
        { nomeFantasia: `${termo} Central`, endereco: `Av. Paraná, 100 - Centro, ${localizacao}`, telefone: '(41) 99999-1234', site: 'http://empresa1.com.br', porte: 'Grande', avaliacoes: 520, segmento: termo },
        { nomeFantasia: `Grupo ${termo} ${localizacao}`, endereco: `Rua Chile, 2450 - Rebouças, ${localizacao}`, telefone: '(41) 3333-8888', site: null, porte: 'Médio', avaliacoes: 150, segmento: termo },
        { nomeFantasia: `${termo} & Associados`, endereco: `Av. do Batel, 1200 - Batel, ${localizacao}`, telefone: '(41) 3222-1111', site: 'http://empresa2.com.br', porte: 'Pequeno', avaliacoes: 15, segmento: termo },
      ];
      return NextResponse.json({ success: true, results: mocks });
    }

    // Função de busca paginada da Nova Google Places API
    const fetchPlaces = async (searchQuery: string) => {
      let allResults: any[] = [];
      let pageToken = '';
      let pageCount = 0;
      const maxPages = 2; // Máximo de 2 páginas (até 40 resultados altamente relevantes) para economizar custos
      const url = 'https://places.googleapis.com/v1/places:searchText';

      while (pageCount < maxPages) {
        const body: any = {
          textQuery: searchQuery,
          pageSize: 20
        };
        if (pageToken) body.pageToken = pageToken;
        
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.userRatingCount,nextPageToken'
          },
          body: JSON.stringify(body)
        });
        
        let data = await response.json();

        if (data.error) {
          console.error('Erro na API do Google Places:', data.error);
          break; 
        }

        if (data.places) {
          allResults = [...allResults, ...data.places];
        }

        if (data.nextPageToken) {
          pageToken = data.nextPageToken;
          pageCount++;
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          break;
        }
      }
      return allResults;
    };

    // Otimização: Fazemos apenas 1 busca focada (em vez de 6 buscas paralelas que multiplicavam o custo por 6!)
    console.log(`[Cache Miss] Buscando dados reais no Google Places API para: "${termo} em ${localizacao}"`);
    const searchQuery = `${termo} em ${localizacao}`;
    const combinedResults = await fetchPlaces(searchQuery);

    // Filtra duplicados
    const uniqueResultsMap = new Map();
    combinedResults.forEach(place => {
      if (place && place.id) {
        uniqueResultsMap.set(place.id, place);
      }
    });
    const uniqueResults = Array.from(uniqueResultsMap.values());

    const results = uniqueResults.map((place: any) => {
      const reviews = place.userRatingCount || 0;
      let porteEstimado = 'Pequeno';
      if (reviews > 500) {
        porteEstimado = 'Grande';
      } else if (reviews > 100) {
        porteEstimado = 'Médio';
      }

      return {
        nomeFantasia: place.displayName?.text || 'Nome não informado',
        endereco: place.formattedAddress || 'Endereço não informado',
        telefone: place.nationalPhoneNumber || 'Não informado',
        site: place.websiteUri || null,
        porte: porteEstimado,
        avaliacoes: reviews,
        segmento: termo
      };
    });

    // 3. Salvar os resultados no banco de dados local de cache para consultas futuras
    if (results.length > 0) {
      try {
        await prisma.prospectCache.createMany({
          data: results.map(r => ({
            termo: normalizedTermo,
            localizacao: normalizedLocalizacao,
            nomeFantasia: r.nomeFantasia,
            endereco: r.endereco,
            telefone: r.telefone,
            site: r.site,
            porte: r.porte,
            avaliacoes: r.avaliacoes,
            segmento: r.segmento
          })),
          skipDuplicates: true
        });
        console.log(`[Cache Write] Salvos ${results.length} novos prospectos no banco local para pesquisas futuras.`);
      } catch (dbErr) {
        console.error('Erro ao salvar cache de prospectos no banco:', dbErr);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Erro interno na API de Prospecção:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
