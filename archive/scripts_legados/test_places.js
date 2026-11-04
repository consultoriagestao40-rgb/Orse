const API_KEY = "AIzaSyAC3N2c4ByVQ2EycJKbpBcZ-TARIVtHZXU";
const termo = "Mercado";
const localizacao = "curitiba";

async function test() {
  const query = encodeURIComponent(`${termo} em ${localizacao}`);
  const baseUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${API_KEY}`;
  
  let allResults = [];
  let pageToken = '';
  let pageCount = 0;
  const maxPages = 3;

  while (pageCount < maxPages) {
    const url = pageToken ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&pagetoken=${pageToken}&key=${API_KEY}` : baseUrl;
    
    console.log(`Buscando pagina ${pageCount + 1}... token: ${pageToken.substring(0, 10)}...`);
    let response = await fetch(url);
    let data = await response.json();

    let retry = 0;
    while (data.status === 'INVALID_REQUEST' && pageToken && retry < 5) {
      console.log(`INVALID_REQUEST, aguardando mais 2s (tentativa ${retry+1})... Error: ${data.error_message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      response = await fetch(url);
      data = await response.json();
      retry++;
    }

    console.log(`Status: ${data.status}, Resultados: ${data.results?.length}`);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.log('Erro final: ', data.status);
      break;
    }

    if (data.results) {
      allResults = [...allResults, ...data.results];
    }

    if (data.next_page_token) {
      pageToken = data.next_page_token;
      pageCount++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      break;
    }
  }

  console.log(`Total: ${allResults.length}`);
}

test();
