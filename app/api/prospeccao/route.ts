import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { termo, localizacao } = await req.json();

    if (!termo || !localizacao) {
      return NextResponse.json({ error: 'Termo e localização são obrigatórios' }, { status: 400 });
    }

    const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "AIzaSyAC3N2c4ByVQ2EycJKbpBcZ-TARIVtHZXU";

    // Se não tiver chave da API, usamos mock para demonstração
    if (!API_KEY) {
      console.log('Usando MOCK de Prospecção (Google Places API Key não configurada)');
      // Simular delay de requisição real
      await new Promise(r => setTimeout(r, 1500));
      
      const mocks = [
        { nomeFantasia: `Empresa de ${termo} 1`, endereco: `Av. Central, 1000 - ${localizacao}`, telefone: '(11) 99999-1111', segmento: termo },
        { nomeFantasia: `Grupo ${termo} Brasil`, endereco: `Rua das Flores, 250 - ${localizacao}`, telefone: '(11) 98888-2222', segmento: termo },
        { nomeFantasia: `${termo} e Cia Ltda`, endereco: `Av. Paulista, 1500 - ${localizacao}`, telefone: '(11) 97777-3333', segmento: termo },
        { nomeFantasia: `Clinica ${termo} Sul`, endereco: `Rua do Ouro, 45 - ${localizacao}`, telefone: '(11) 96666-4444', segmento: termo },
        { nomeFantasia: `Consultório ${termo}`, endereco: `Praça XV, 10 - ${localizacao}`, telefone: '(11) 95555-5555', segmento: termo },
      ];
      
      return NextResponse.json({ success: true, results: mocks });
    }

    // Chamada REAL para o Google Places API (Text Search) com Paginação (Máximo 60 resultados)
    const query = encodeURIComponent(`${termo} em ${localizacao}`);
    const baseUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;
    
    let allResults: any[] = [];
    let pageToken = '';
    let pageCount = 0;
    const maxPages = 3; // O Google permite até 3 páginas de 20 resultados (Total 60)

    while (pageCount < maxPages) {
      const url = pageToken ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&pagetoken=${pageToken}&key=${API_KEY}` : baseUrl;
      
      let response = await fetch(url);
      let data = await response.json();

      // O Google Places frequentemente retorna INVALID_REQUEST se o token for usado rápido demais.
      // Vamos tentar aguardar mais um pouco e tentar de novo caso isso aconteça.
      if (data.status === 'INVALID_REQUEST' && pageToken) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        response = await fetch(url);
        data = await response.json();
      }

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        if (allResults.length === 0) {
          return NextResponse.json({ success: false, error: 'Erro na API do Google: ' + data.status });
        }
        break; // Se deu erro na página 2 ou 3, vamos só retornar o que já pegamos
      }

      if (data.results) {
        allResults = [...allResults, ...data.results];
      }

      if (data.next_page_token) {
        pageToken = data.next_page_token;
        pageCount++;
        // Delay obrigatório de ~2s exigido pelo Google para maturar o next_page_token
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        break; // Acabaram as páginas
      }
    }

    // Filtra duplicados pelo place_id caso o Google tenha retornado algum (acontece às vezes)
    const uniqueResultsMap = new Map();
    allResults.forEach(place => {
      uniqueResultsMap.set(place.place_id, place);
    });
    const uniqueResults = Array.from(uniqueResultsMap.values());

    const results = uniqueResults.map((place: any) => ({
      nomeFantasia: place.name,
      endereco: place.formatted_address,
      telefone: place.formatted_phone_number || 'Não informado',
      segmento: termo,
      placeId: place.place_id
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
