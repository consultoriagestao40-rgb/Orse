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

    // Função auxiliar para buscar até 60 resultados para uma query específica usando a Nova API (que retorna telefone e site)
    const fetchPlaces = async (searchQuery: string) => {
      let allResults: any[] = [];
      let pageToken = '';
      let pageCount = 0;
      const maxPages = 3;
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
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,nextPageToken'
          },
          body: JSON.stringify(body)
        });
        
        let data = await response.json();

        // O Google Places (New) retorna os erros diretamente se houver falha
        if (data.error) {
          break; 
        }

        if (data.places) {
          allResults = [...allResults, ...data.places];
        }

        if (data.nextPageToken) {
          pageToken = data.nextPageToken;
          pageCount++;
          // A nova API é mais estável, mas um pequeno delay é bom
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break;
        }
      }
      return allResults;
    };

    // Estratégia de "Expansão de Busca" (Search Expansion)
    // O Google limita estritamente a 60 resultados por busca. 
    // Para contornar, fazemos buscas fatiadas por zonas paralelamente.
    const modifiers = ['', 'Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste'];
    
    // Dispara todas as 6 buscas em paralelo
    const searchPromises = modifiers.map(modifier => {
      const expandedLocation = modifier ? `${localizacao} ${modifier}` : localizacao;
      const searchQuery = `${termo} em ${expandedLocation}`;
      return fetchPlaces(searchQuery);
    });

    const resultsArray = await Promise.all(searchPromises);
    const combinedResults = resultsArray.flat();

    // Filtra duplicados pelo id (A nova API usa place.id em vez de place.place_id)
    const uniqueResultsMap = new Map();
    combinedResults.forEach(place => {
      if (place && place.id) {
        uniqueResultsMap.set(place.id, place);
      }
    });
    const uniqueResults = Array.from(uniqueResultsMap.values());

    const results = uniqueResults.map((place: any) => ({
      nomeFantasia: place.displayName?.text || 'Nome não informado',
      endereco: place.formattedAddress || 'Endereço não informado',
      telefone: place.nationalPhoneNumber || 'Não informado',
      site: place.websiteUri || null,
      segmento: termo,
      placeId: place.id
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
