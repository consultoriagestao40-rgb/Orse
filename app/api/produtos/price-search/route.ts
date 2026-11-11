import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/sessionUser';

export const runtime = 'nodejs';

interface WebOffer {
  titulo: string;
  preco: number;
  loja: string;
  link: string;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

function parseBrlPrice(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') {
    return raw >= 0.5 && raw <= 500000 ? Number(raw.toFixed(2)) : null;
  }

  const str = decodeHtmlEntities(String(raw)).trim();
  const match = str.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:\.\d{2})?)/i);
  if (!match) return null;

  const numStr = match[1];
  let val = 0;
  if (numStr.includes(',')) {
    val = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
  } else {
    val = parseFloat(numStr);
  }

  // Ignora valores simbólicos de anúncios bugados (ex: R$ 0,01)
  if (!isFinite(val) || val < 0.5 || val > 500000) return null;
  return Number(val.toFixed(2));
}

function cleanProductQuery(raw: string): string {
  return raw
    .replace(/\bp\/\s*/gi, 'para ')
    .replace(/\bc\/\s*/gi, 'com ')
    .replace(/\bs\/\s*/gi, 'sem ')
    .replace(/[/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function simplifyQuery(cleaned: string): string {
  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/\d+x\d+/i.test(w) && !/^\d+g$/i.test(w));
  return words.slice(0, 4).join(' ').trim();
}

function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function decodeBingDirectUrl(rawHref: string): string {
  const href = decodeHtmlEntities(rawHref);
  if (!href) return '';
  const uMatch = href.match(/[?&]u=([^&]+)/);
  if (uMatch) {
    try {
      let uDec = decodeURIComponent(uMatch[1]);
      // Bing às vezes prefixa com "a1" antes do base64url
      if (uDec.startsWith('a1aHR0c')) {
        uDec = uDec.slice(2);
      }
      const base64 = uDec.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = decodeURIComponent(Buffer.from(padded, 'base64').toString('utf8'));
      if (decoded.startsWith('http')) {
        return decoded.split('?')[0];
      }
    } catch {
      // Fallback para o próprio link do Bing
    }
  }
  if (href.startsWith('/')) {
    return `https://www.bing.com${href}`;
  }
  return href;
}

async function fetchBingShoppingOffers(query: string): Promise<WebOffer[]> {
  const offers: WebOffer[] = [];
  const url = `https://www.bing.com/shop?q=${encodeURIComponent(query)}&cc=br&setlang=pt-br`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!res.ok) return offers;
  const html = await res.text();
  const blocks = html.split('<div class="br-offInfo');

  for (let i = 1; i < blocks.length; i++) {
    const prevBlock = blocks[i - 1];
    const curBlock = blocks[i].slice(0, 1800);

    const titleMatch =
      curBlock.match(/title="([^"]+)"/i) ||
      curBlock.match(/class="br-offTtl[^>]*>([^<]+)/i);
    const priceMatch = curBlock.match(/class="br-price">([^<]+)<\/div>/i);
    const sellerMatch = curBlock.match(/class="br-offSlrTxt">([^<]+)<\/span>/i);

    if (!titleMatch || !priceMatch) continue;

    const titulo = decodeHtmlEntities(titleMatch[1]);
    const preco = parseBrlPrice(priceMatch[1]);
    if (!titulo || !preco) continue;

    const loja = sellerMatch ? decodeHtmlEntities(sellerMatch[1]) : 'Loja Online';

    // Procura o último href de oferta imediatamente anterior ao bloco br-offInfo
    const hrefMatches = [
      ...prevBlock.matchAll(/href="(https:\/\/www\.bing\.com\/aclick[^"]+|\/shop\/[^"]+)"/gi),
    ];
    const rawHref = hrefMatches.length > 0 ? hrefMatches[hrefMatches.length - 1][1] : '';
    const link = decodeBingDirectUrl(rawHref);

    offers.push({ titulo, preco, loja, link });
  }

  return offers;
}

async function fetchBuscapeOffers(query: string): Promise<WebOffer[]> {
  const offers: WebOffer[] = [];
  const url = `https://www.buscape.com.br/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    cache: 'no-store',
  });

  if (!res.ok) return offers;
  const html = await res.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch) return offers;

  const data = JSON.parse(nextDataMatch[1]);
  const hits = data?.props?.initialReduxState?.hits?.hits;
  if (!Array.isArray(hits)) return offers;

  // Palavra principal do produto para garantir aderência temática
  const mainTokens = normalizeText(query)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const firstToken = mainTokens[0] || '';

  for (const h of hits) {
    const titulo = String(h?.name || '').trim();
    const preco = parseBrlPrice(h?.price);
    if (!titulo || !preco) continue;

    if (firstToken && !normalizeText(titulo).includes(firstToken)) {
      continue;
    }

    const loja = String(h?.bestOffer?.merchantName || 'Buscapé').trim();
    const seoUrl = String(h?.url || '').trim();
    const link = seoUrl.startsWith('http')
      ? seoUrl
      : seoUrl
      ? `https://www.buscape.com.br${seoUrl}`
      : 'https://www.buscape.com.br';

    offers.push({ titulo, preco, loja, link });
  }

  return offers;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const descricao = String(body.descricao || '').trim();

    if (!descricao || descricao.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe a descrição do produto para pesquisar preços na web.',
        },
        { status: 400 }
      );
    }

    const cleanedQuery = cleanProductQuery(descricao);
    const rawOffers: WebOffer[] = [];

    // 1. Motor Principal: Bing Shopping Brasil (tempo real, sem limite de créditos)
    try {
      let bingOffers = await fetchBingShoppingOffers(cleanedQuery);
      if (bingOffers.length === 0) {
        const simplified = simplifyQuery(cleanedQuery);
        if (simplified && simplified !== cleanedQuery) {
          bingOffers = await fetchBingShoppingOffers(simplified);
        }
      }
      rawOffers.push(...bingOffers);
    } catch (err) {
      console.warn('[Price Search] Aviso no Bing Shopping:', err);
    }

    // 2. Motor Complementar: Buscapé Brasil (quando Bing trouxer menos de 5 ofertas)
    if (rawOffers.length < 5) {
      try {
        let buscapeOffers = await fetchBuscapeOffers(cleanedQuery);
        if (buscapeOffers.length === 0) {
          const simplified = simplifyQuery(cleanedQuery);
          if (simplified && simplified !== cleanedQuery) {
            buscapeOffers = await fetchBuscapeOffers(simplified);
          }
        }
        rawOffers.push(...buscapeOffers);
      } catch (err) {
        console.warn('[Price Search] Aviso no Buscapé:', err);
      }
    }

    // 3. Fallback adicional: Google Shopping via Serper (se houver chave ativa com créditos)
    if (rawOffers.length === 0 && process.env.SERPER_API_KEY) {
      try {
        const shopRes = await fetch('https://google.serper.dev/shopping', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: cleanedQuery,
            gl: 'br',
            hl: 'pt-br',
            num: 15,
          }),
          cache: 'no-store',
        });

        if (shopRes.ok) {
          const shopData = await shopRes.json();
          const shoppingList = Array.isArray(shopData.shopping) ? shopData.shopping : [];
          for (const item of shoppingList) {
            const preco = parseBrlPrice(item.price || item.extractedPrice);
            if (preco && preco > 0) {
              rawOffers.push({
                titulo: String(item.title || descricao).trim(),
                preco,
                loja: String(item.source || 'Loja Online').trim(),
                link: String(item.link || '').trim(),
              });
            }
          }
        }
      } catch (err) {
        console.warn('[Price Search] Aviso no Serper:', err);
      }
    }

    if (rawOffers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Nenhum preço público encontrado na web para "${descricao}". Tente simplificar o nome do item.`,
        },
        { status: 404 }
      );
    }

    // Se o usuário não pediu explicitamente "kit / caixa / fardo", dá preferência a ofertas unitárias
    const userWantsPack = /\b(kit|caixa|cx|fardo|pct|pacote|rolo|galao|5l)\b/i.test(cleanedQuery);
    const singleUnitOffers = userWantsPack
      ? rawOffers
      : rawOffers.filter(
          (o) => !/\b(kit\s*\d+|\d+\s*unidades|caixa\s*c\/|fardo|atacado|pack\s*com)\b/i.test(o.titulo)
        );

    const candidateOffers = singleUnitOffers.length >= 3 ? singleUnitOffers : rawOffers;

    // Remove duplicatas de mesmo título + preço
    const seen = new Set<string>();
    const deduped = candidateOffers.filter((o) => {
      const key = `${normalizeText(o.titulo).slice(0, 35)}_${o.preco}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Ordena por preço crescente e remove outliers extremos (acima de 3.5x ou abaixo de 20% da mediana)
    const sorted = [...deduped].sort((a, b) => a.preco - b.preco);
    const median = sorted[Math.floor(sorted.length / 2)].preco;
    const filtered = sorted.filter((o) => o.preco >= median * 0.2 && o.preco <= median * 3.5);
    const validOffers = (filtered.length >= 2 ? filtered : sorted).slice(0, 12);

    const prices = validOffers.map((o) => o.preco);
    const precoMinimo = Number(Math.min(...prices).toFixed(2));
    const precoMaximo = Number(Math.max(...prices).toFixed(2));
    const precoMedio = Number((prices.reduce((acc, v) => acc + v, 0) / prices.length).toFixed(2));

    return NextResponse.json({
      success: true,
      termo: descricao,
      precoMinimo,
      precoMedio,
      precoMaximo,
      totalOfertas: validOffers.length,
      ofertas: validOffers,
    });
  } catch (error: any) {
    console.error('[API /api/produtos/price-search] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro ao pesquisar preços na web.',
      },
      { status: 500 }
    );
  }
}
