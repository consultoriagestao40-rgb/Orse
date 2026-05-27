import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface SearchResult {
  nome: string;
  cargo: string;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  snippet: string;
}

// Busca no DuckDuckGo HTML (gratuito, sem API key)
async function searchDuckDuckGo(query: string): Promise<string> {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(8000),
  });
  
  if (!res.ok) throw new Error(`DuckDuckGo retornou ${res.status}`);
  return res.text();
}

// Extrai URLs e snippets do HTML do DuckDuckGo
function extractResultsFromHtml(html: string): Array<{ url: string; title: string; snippet: string }> {
  const results: Array<{ url: string; title: string; snippet: string }> = [];
  
  // Extrai links de resultado do DuckDuckGo
  const linkRegex = /class="result__url"[^>]*>([^<]+)/g;
  const titleRegex = /class="result__a"[^>]*>([^<]+)/g;
  const snippetRegex = /class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]*)*)/g;
  
  // Abordagem mais direta: extrai URLs visíveis nos resultados
  const urlMatches = html.matchAll(/uddg=([^&"]+)/g);
  const titleMatches = html.matchAll(/class="result__a"[^>]*>(.*?)<\/a>/gs);
  const snippetMatches = html.matchAll(/class="result__snippet"[^>]*>(.*?)<\/a>/gs);

  const urls: string[] = [];
  const titles: string[] = [];
  const snippets: string[] = [];

  for (const m of urlMatches) {
    try {
      urls.push(decodeURIComponent(m[1]));
    } catch { urls.push(m[1]); }
  }

  for (const m of titleMatches) {
    titles.push(m[1].replace(/<[^>]+>/g, '').trim());
  }

  for (const m of snippetMatches) {
    snippets.push(m[1].replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < Math.min(urls.length, 10); i++) {
    results.push({
      url: urls[i] || '',
      title: titles[i] || '',
      snippet: snippets[i] || '',
    });
  }

  return results;
}

// Extrai perfil LinkedIn de uma URL
function extractLinkedInProfile(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (match) return `https://linkedin.com/in/${match[1]}`;
  return null;
}

// Extrai perfil Instagram de uma URL
function extractInstagramProfile(url: string): string | null {
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?/i);
  if (match && match[1] !== 'p' && match[1] !== 'reel' && match[1] !== 'stories') {
    return `https://instagram.com/${match[1]}`;
  }
  return null;
}

// Extrai número WhatsApp de URL wa.me ou texto
function extractWhatsApp(url: string, text: string): string | null {
  // Tenta wa.me direto na URL
  const waMatch = url.match(/wa\.me\/(\d+)/i);
  if (waMatch) return `https://wa.me/${waMatch[1]}`;
  
  // Tenta no texto/snippet
  const waTextMatch = text.match(/wa\.me\/(\d+)/i);
  if (waTextMatch) return `https://wa.me/${waTextMatch[1]}`;
  
  // Tenta número de telefone brasileiro no snippet
  const phoneMatch = text.match(/\+?55\s?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-.\s]?\d{4}/);
  if (phoneMatch) {
    const clean = phoneMatch[0].replace(/\D/g, '');
    if (clean.length >= 10) return `https://wa.me/${clean.startsWith('55') ? clean : '55' + clean}`;
  }
  
  return null;
}

// Extrai nome da pessoa do título do resultado LinkedIn
function extractNameFromTitle(title: string): string {
  // Títulos LinkedIn tipicamente: "João Silva - Diretor de Compras | LinkedIn"
  const parts = title.split(/[-–|]/);
  if (parts.length > 0) return parts[0].trim();
  return title;
}

// Extrai cargo do título do resultado LinkedIn
function extractCargoFromTitle(title: string, targetCargo: string): string {
  const parts = title.split(/[-–|]/);
  if (parts.length > 1) return parts[1].trim();
  return targetCargo;
}

export async function POST(req: NextRequest) {
  try {
    const { empresa, cargos } = await req.json() as { empresa: string; cargos: string[] };
    
    if (!empresa || !Array.isArray(cargos) || cargos.length === 0) {
      return NextResponse.json({ error: 'empresa e cargos são obrigatórios' }, { status: 400 });
    }

    const results: SearchResult[] = [];
    const foundLinkedIns = new Set<string>();

    // Para cada cargo, faz uma busca no LinkedIn
    for (const cargo of cargos.slice(0, 5)) { // Máx 5 cargos por vez
      try {
        // Busca LinkedIn
        const linkedinQuery = `site:linkedin.com/in "${empresa}" "${cargo}"`;
        const linkedinHtml = await searchDuckDuckGo(linkedinQuery);
        const linkedinResults = extractResultsFromHtml(linkedinHtml);
        
        for (const result of linkedinResults.slice(0, 3)) {
          const linkedinUrl = extractLinkedInProfile(result.url);
          if (!linkedinUrl || foundLinkedIns.has(linkedinUrl)) continue;
          foundLinkedIns.add(linkedinUrl);
          
          const nome = extractNameFromTitle(result.title);
          const cargoExtraido = extractCargoFromTitle(result.title, cargo);
          
          // Busca Instagram do contato encontrado
          let instagramUrl: string | null = null;
          let whatsappUrl: string | null = null;
          
          if (nome && nome.length > 3) {
            try {
              const igQuery = `site:instagram.com "${nome}" "${empresa}"`;
              const igHtml = await searchDuckDuckGo(igQuery);
              const igResults = extractResultsFromHtml(igHtml);
              
              for (const igResult of igResults.slice(0, 2)) {
                const ig = extractInstagramProfile(igResult.url);
                if (ig) { instagramUrl = ig; break; }
              }
              
              // Busca WhatsApp
              const waQuery = `"${nome}" "${empresa}" whatsapp OR "wa.me"`;
              const waHtml = await searchDuckDuckGo(waQuery);
              const waResults = extractResultsFromHtml(waHtml);
              
              for (const waResult of waResults.slice(0, 3)) {
                const wa = extractWhatsApp(waResult.url, waResult.snippet + ' ' + waResult.title);
                if (wa) { whatsappUrl = wa; break; }
              }
            } catch { /* ignora erros de buscas secundárias */ }
          }
          
          results.push({
            nome,
            cargo: cargoExtraido,
            linkedinUrl,
            instagramUrl,
            whatsappUrl,
            snippet: result.snippet,
          });
          
          if (results.length >= 10) break;
        }
        
        // Pequena pausa entre buscas para não sobrecarregar
        await new Promise(r => setTimeout(r, 300));
        
      } catch (err) {
        console.error(`Erro buscando cargo "${cargo}":`, err);
        // Continua com os outros cargos
      }
      
      if (results.length >= 10) break;
    }

    // Se não encontrou nada pelo LinkedIn, tenta busca geral da empresa
    if (results.length === 0) {
      try {
        const generalQuery = `"${empresa}" ${cargos.join(' OR ')} linkedin`;
        const generalHtml = await searchDuckDuckGo(generalQuery);
        const generalResults = extractResultsFromHtml(generalHtml);
        
        for (const result of generalResults) {
          const linkedinUrl = extractLinkedInProfile(result.url);
          if (linkedinUrl) {
            results.push({
              nome: extractNameFromTitle(result.title),
              cargo: cargos[0],
              linkedinUrl,
              instagramUrl: null,
              whatsappUrl: null,
              snippet: result.snippet,
            });
          }
        }
      } catch { /* ignora */ }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      total: results.length,
      empresa,
      cargos 
    });
    
  } catch (error: any) {
    console.error('Erro na busca de contatos IA:', error);
    return NextResponse.json({ 
      error: 'Erro interno na busca. Tente novamente.',
      details: error.message 
    }, { status: 500 });
  }
}
