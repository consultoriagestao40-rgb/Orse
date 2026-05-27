import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface SearchResult {
  nome: string;
  cargo: string;
  linkedinUrl: string;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  snippet: string;
}

// Auxiliar para decodificar URL do Bing (Base64 no parâmetro u)
function decodeBingUrl(bingUrl: string): string {
  try {
    const cleanedUrl = bingUrl.replace(/&amp;/g, '&');
    const urlObj = new URL(cleanedUrl);
    const uParam = urlObj.searchParams.get('u');
    if (uParam) {
      const b64Str = uParam.slice(2);
      // Corrige padding de base64
      const padding = b64Str.length % 4;
      let paddedB64 = b64Str;
      if (padding) {
        paddedB64 += '='.repeat(4 - padding);
      }
      return Buffer.from(paddedB64, 'base64').toString('utf-8');
    }
  } catch (e) {
    // Ignore e retorna original
  }
  return bingUrl;
}

// Busca usando Google Custom Search Engine (Oficial e Estável)
async function searchGoogleCSE(query: string, apiKey: string, cx: string): Promise<any[]> {
  const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Google CSE retornou status ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

// Busca e scraping usando Bing (Fallback gratuito e sem chaves)
async function searchBing(query: string): Promise<string> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${encoded}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(6000),
  });
  
  if (!res.ok) throw new Error(`Bing retornou status ${res.status}`);
  return res.text();
}

// Extrai resultados da página de busca do Bing
function parseBingResults(html: string): Array<{ url: string; title: string; snippet: string }> {
  const results: Array<{ url: string; title: string; snippet: string }> = [];
  
  // Extrai blocos <li class="b_algo">
  const bAlgoBlocks = html.match(/<li[^>]*class="b_algo"[^>]*>([\s\S]*?)<\/li>/g) || [];
  
  for (const block of bAlgoBlocks) {
    const linkMatch = block.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (linkMatch) {
      const rawUrl = linkMatch[1];
      const decodedUrl = decodeBingUrl(rawUrl);
      const title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      
      results.push({
        url: decodedUrl,
        title,
        snippet
      });
    }
  }
  
  return results;
}

// Limpa nome a partir do título do perfil LinkedIn
function extractNameFromTitle(title: string): string {
  const parts = title.split(/[-–|]/);
  if (parts.length > 0) {
    let name = parts[0].trim();
    // Remove termos comuns do LinkedIn no título
    name = name.replace(/\s*\(.*\)\s*/g, ''); // Remove (Ele/Dele) etc.
    return name;
  }
  return title;
}

// Limpa cargo a partir do título
function extractCargoFromTitle(title: string, defaultCargo: string): string {
  const parts = title.split(/[-–|]/);
  if (parts.length > 1) {
    return parts[1].trim();
  }
  return defaultCargo;
}

// Limpa o nome da empresa para extrair apenas o nome principal e evitar queries muito longas
function cleanCompanyName(name: string): string {
  if (!name) return '';
  
  // 1. Pega a parte antes de traços, barras ou parênteses (comum em cadastros)
  let clean = name.split(/[-–/(]/)[0].trim();
  
  // 2. Remove sufixos empresariais comuns no Brasil (case-insensitive)
  const suffixes = [
    /\s+ltda\b/i,
    /\s+s\.a\b/i,
    /\s+s\/a\b/i,
    /\s+eireli\b/i,
    /\s+me\b/i,
    /\s+epp\b/i,
    /\s+limitada\b/i,
    /\s+s\/s\b/i,
    /\s+grupo\b/i,
    /\s+facilities\b/i, // Remove "facilities" se for apenas descrição
    /\bcnpj\b.*/i
  ];
  
  for (const suffix of suffixes) {
    clean = clean.replace(suffix, '');
  }
  
  // Se após a limpeza sobrar algo muito curto ou vazio, retorna o original limpo de traços
  if (clean.trim().length < 2) {
    return name.split(/[-–/(]/)[0].trim();
  }
  
  return clean.trim();
}

// Gera links de busca inteligente (caso precise de fallback completo)
function buildSearchLinks(empresa: string, cargo: string) {
  const empresaEnc = encodeURIComponent(empresa);
  const cargoEnc = encodeURIComponent(cargo);
  const combinadoEnc = encodeURIComponent(`"${empresa}" "${cargo}"`);
  const combinadoLinkedinEnc = encodeURIComponent(`site:linkedin.com/in "${empresa}" "${cargo}"`);
  const instagramEnc = encodeURIComponent(`site:instagram.com "${cargo}" "${empresa}"`);
  const whatsappEnc = encodeURIComponent(`"${empresa}" "${cargo}" whatsapp OR "wa.me"`);

  return {
    cargo,
    linkedinSearch: `https://www.linkedin.com/search/results/people/?keywords=${empresaEnc}%20${cargoEnc}&origin=GLOBAL_SEARCH_HEADER`,
    googleLinkedin: `https://www.google.com/search?q=${combinadoLinkedinEnc}`,
    googleInstagram: `https://www.google.com/search?q=${instagramEnc}`,
    googleWhatsapp: `https://www.google.com/search?q=${whatsappEnc}`,
    googleGeral: `https://www.google.com/search?q=${combinadoEnc}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { empresa, cargos } = await req.json() as { empresa: string; cargos: string[] };

    if (!empresa || !Array.isArray(cargos) || cargos.length === 0) {
      return NextResponse.json({ error: 'empresa e cargos são obrigatórios' }, { status: 400 });
    }

    // Limpa o nome da empresa para buscar somente o nome essencial (ex: "Terceirizemais" em vez de "Terceirizemais - Soluções em...")
    const empresaLimpa = cleanCompanyName(empresa);
    console.log(`[IA Search] Empresa original: "${empresa}" | Limpa para busca: "${empresaLimpa}"`);

    const apiKey = process.env.GOOGLE_CSE_KEY || "AIzaSyAvjvknXwYdmFFXMSADD1fsfmVmmhK0KkA";
    const cx = process.env.GOOGLE_CSE_CX || "955534659ddf64afd";
    
    const results: SearchResult[] = [];
    const foundLinkedIns = new Set<string>();

    // 1. SE HOUVER CHAVE GOOGLE CSE - USA ELA (100% CONFIÁVEL E SEGURO)
    if (apiKey && cx) {
      console.log('Utilizando Google CSE para busca de contatos IA...');
      for (const cargo of cargos.slice(0, 3)) { // Busca os 3 principais cargos
        try {
          const query = `site:linkedin.com/in "${empresaLimpa}" "${cargo}"`;
          const items = await searchGoogleCSE(query, apiKey, cx);
          
          for (const item of items.slice(0, 3)) {
            const url = item.link;
            if (!url.includes('linkedin.com/in/') || foundLinkedIns.has(url)) continue;
            foundLinkedIns.add(url);
            
            const nome = extractNameFromTitle(item.title);
            const cargoExtraido = extractCargoFromTitle(item.title, cargo);
            
            // Cria links de busca inteligente personalizados específicos para essa pessoa
            const nomeEnc = encodeURIComponent(nome);
            const empEnc = encodeURIComponent(empresaLimpa);
            
            results.push({
              nome,
              cargo: cargoExtraido,
              linkedinUrl: url,
              instagramUrl: `https://www.google.com/search?q=site:instagram.com+%22${nomeEnc}%22+%22${empEnc}%22`,
              whatsappUrl: `https://www.google.com/search?q=%22${nomeEnc}%22+%22${empEnc}%22+whatsapp+OR+%22wa.me%22`,
              snippet: item.snippet || '',
            });
          }
        } catch (err) {
          console.error(`Erro na busca do cargo ${cargo} via Google CSE:`, err);
        }
      }
    }
    
    // 2. SE NÃO HOUVER GOOGLE CSE OU SE RETORNOU VAZIO, TENTA O FALLBACK DO BING (SEM CHAVES)
    if (results.length === 0) {
      console.log('Utilizando Fallback de Scraping do Bing para busca de contatos IA...');
      for (const cargo of cargos.slice(0, 3)) {
        try {
          // Usamos a técnica de busca loose que NÃO é bloqueada pelo Bing
          const query = `linkedin "${empresaLimpa}" "${cargo}"`;
          const html = await searchBing(query);
          const rawResults = parseBingResults(html);
          
          for (const res of rawResults) {
            const url = res.url;
            
            // Filtra links genéricos do LinkedIn que não são perfis
            const isGeneric = url.includes('/company/') || 
                              url.includes('/jobs/') || 
                              url.includes('/pulse/') || 
                              url.includes('play.google.com') ||
                              url.includes('apps.apple.com') ||
                              !url.includes('linkedin.com');
                              
            if (isGeneric || foundLinkedIns.has(url)) continue;
            foundLinkedIns.add(url);
            
            const nome = extractNameFromTitle(res.title);
            const cargoExtraido = extractCargoFromTitle(res.title, cargo);
            
            const nomeEnc = encodeURIComponent(nome);
            const empEnc = encodeURIComponent(empresaLimpa);
            
            results.push({
              nome,
              cargo: cargoExtraido,
              linkedinUrl: url,
              instagramUrl: `https://www.google.com/search?q=site:instagram.com+%22${nomeEnc}%22+%22${empEnc}%22`,
              whatsappUrl: `https://www.google.com/search?q=%22${nomeEnc}%22+%22${empEnc}%22+whatsapp+OR+%22wa.me%22`,
              snippet: res.snippet,
            });
            
            if (results.length >= 10) break;
          }
        } catch (err) {
          console.error(`Erro na busca do cargo ${cargo} via Bing:`, err);
        }
        if (results.length >= 10) break;
      }
    }

    // 3. SE AMBOS FALHAREM EM ENCONTRAR PERFIS REAIS, RETORNA APENAS OS BOTÕES DE BUSCA INTELIGENTES
    if (results.length === 0) {
      console.log('Nenhum perfil real encontrado automaticamente. Retornando painel de links inteligentes.');
      const searchCards = cargos.slice(0, 15).map(cargo => buildSearchLinks(empresaLimpa, cargo));
      
      const allCargosQuery = cargos.slice(0, 5).join(' OR ');
      const linkedinAllUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(empresaLimpa + ' ' + allCargosQuery)}&origin=GLOBAL_SEARCH_HEADER`;
      const googleAllUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${empresaLimpa}" (${allCargosQuery})`)}`;

      return NextResponse.json({
        success: true,
        mode: 'search_links',
        empresa,
        cargos,
        searchCards,
        combinados: {
          linkedinAll: linkedinAllUrl,
          googleAll: googleAllUrl,
        },
      });
    }

    // Retorna os contatos reais encontrados para serem desenhados diretamente no card!
    return NextResponse.json({
      success: true,
      mode: 'contacts',
      results,
      total: results.length,
      empresa,
      cargos
    });

  } catch (error: any) {
    console.error('Erro na busca de contatos IA:', error);
    return NextResponse.json({
      error: 'Erro interno na busca.',
      details: error.message
    }, { status: 500 });
  }
}
