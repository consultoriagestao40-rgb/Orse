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

    // Chamada REAL para o Google Places API (Text Search)
    const query = encodeURIComponent(`${termo} em ${localizacao}`);
    const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;
    
    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Erro na API do Google: ' + data.status });
    }

    const results = data.results.map((place: any) => ({
      nomeFantasia: place.name,
      endereco: place.formatted_address,
      telefone: place.formatted_phone_number || 'Não informado', // Pode precisar do Place Details para telefone
      segmento: termo,
      placeId: place.place_id
    }));

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
