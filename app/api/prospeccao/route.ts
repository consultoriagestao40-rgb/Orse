import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { termo, localizacao } = await req.json();

    if (!termo || !localizacao) {
      return NextResponse.json({ error: 'Termo e localização são obrigatórios' }, { status: 400 });
    }

    const normalizedTermo = termo.trim().toLowerCase();
    const normalizedLocalizacao = localizacao.trim().toLowerCase();

    // Obter dados do usuário autenticado para controle de limites e cota mensal do SaaS
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get('sb_session')?.value;
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Sessão inválida ou expirada. Faça login novamente.' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: sessionEmail.toLowerCase().trim() },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado no sistema.' }, { status: 404 });
    }

    const tenantId = user.tenantId;
    const isSuperAdmin = user.role === 'ADMIN' && !tenantId;

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

    // 2. Se não estiver cacheado, validamos a cota do Tenant antes de fazer a busca real no Google
    let searchesCount = 0;
    let limitCount = 30;
    
    if (tenantId && !isSuperAdmin) {
      // Determina a cota padrão com base no plano configurado do Tenant
      let defaultLimit = 30; // STARTER
      if (user.tenant?.plano === 'PRO') {
        defaultLimit = 150;
      } else if (user.tenant?.plano === 'ENTERPRISE') {
        defaultLimit = 400;
      }

      limitCount = user.tenant?.limitePesquisasProspeccao ?? defaultLimit;

      // Se o limite gravado no banco for o padrão (30) mas o plano for maior, assume o novo limite dinâmico
      if (limitCount === 30 && defaultLimit > 30) {
        limitCount = defaultLimit;
      }
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      searchesCount = await prisma.prospectSearchLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      if (searchesCount >= limitCount) {
        return NextResponse.json({ 
          success: false, 
          error: `Você atingiu o limite de novas pesquisas do seu plano mensal (${searchesCount} de ${limitCount}). A cota será reiniciada no primeiro dia do próximo mês.` 
        }, { status: 403 });
      }
    }

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
          let userFriendlyMsg = data.error.message;
          if (data.error.status === 'PERMISSION_DENIED' || data.error.message?.includes('permission')) {
            userFriendlyMsg = 'Acesso Negado à API do Google (PERMISSION_DENIED). Por favor, certifique-se de que a Places API (New) está ativa no seu Console do Google Cloud e que o faturamento (billing) está ativado e configurado corretamente.';
          }
          throw new Error(userFriendlyMsg || 'Erro desconhecido na API do Google Places');
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

        // Gravar log de consumo de cota para o Tenant (caso não seja superadmin)
        if (tenantId && !isSuperAdmin) {
          await prisma.prospectSearchLog.create({
            data: {
              tenantId,
              userId: user.id,
              termo: normalizedTermo,
              localizacao: normalizedLocalizacao,
              resultados: results.length
            }
          });
          console.log(`[Cota Consumida] Gravado log de pesquisa para o Tenant: ${tenantId}`);
        }
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get('sb_session')?.value;
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: sessionEmail.toLowerCase().trim() },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: true, isSuperAdmin: true, searchesCount: 0, limitCount: 9999 });
    }

    // Determina a cota padrão com base no plano configurado do Tenant
    let defaultLimit = 30; // STARTER
    if (user.tenant?.plano === 'PRO') {
      defaultLimit = 150;
    } else if (user.tenant?.plano === 'ENTERPRISE') {
      defaultLimit = 400;
    }

    let limitCount = user.tenant?.limitePesquisasProspeccao ?? defaultLimit;

    // Se o limite gravado no banco for o padrão (30) mas o plano for maior, assume o novo limite dinâmico
    if (limitCount === 30 && defaultLimit > 30) {
      limitCount = defaultLimit;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const searchesCount = await prisma.prospectSearchLog.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    return NextResponse.json({
      success: true,
      searchesCount,
      limitCount,
      isSuperAdmin: false
    });
  } catch (error: any) {
    console.error('Erro ao buscar limites de prospecção:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
