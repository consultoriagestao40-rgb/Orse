import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/sessionUser';

export const runtime = 'nodejs';

interface WebOffer {
  titulo: string;
  preco: number;
  loja: string;
  link: string;
}

function parseBrlPrice(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number') return raw > 0 ? raw : null;

  const str = String(raw).trim();
  // Procura padrão R$ 1.234,56 ou 123,45
  const match = str.match(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:\.\d{2})?)/i);
  if (!match) return null;

  const numStr = match[1];
  let val = 0;
  if (numStr.includes(',')) {
    val = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
  } else {
    val = parseFloat(numStr);
  }

  if (!isFinite(val) || val <= 0.1 || val > 500000) return null;
  return Number(val.toFixed(2));
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const descricao = String(body.descricao || '').trim();
    const unidade = String(body.unidade || '').trim();

    if (!descricao || descricao.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Informe a descrição do produto para pesquisar preços na web.',
      }, { status: 400 });
    }

    const serperApiKey = process.env.SERPER_API_KEY || '55cc5118e3d7697957c0d889f05e67adfef34ea2';
    const rawOffers: WebOffer[] = [];

    // 1. Consulta Google Shopping Brasil via Serper.dev
    try {
      const shopRes = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: `${descricao} ${unidade ? unidade : ''} preço comprar`.trim(),
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
      console.warn('[Price Search] Falha no Google Shopping, tentando Google Search orgânico:', err);
    }

    // 2. Fallback / Complemento com Google Search orgânico se houver poucas ofertas no Shopping
    if (rawOffers.length < 3) {
      try {
        const searchRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `${descricao} preço R$`,
            gl: 'br',
            hl: 'pt-br',
            num: 10,
          }),
          cache: 'no-store',
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const organic = Array.isArray(searchData.organic) ? searchData.organic : [];
          for (const item of organic) {
            const combinedText = `${item.title || ''} ${item.snippet || ''} ${item.priceRange || ''}`;
            const priceMatches = combinedText.match(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/gi) || [];
            for (const pm of priceMatches.slice(0, 2)) {
              const preco = parseBrlPrice(pm);
              if (preco && preco > 0) {
                let hostname = 'Mercado Web';
                try {
                  hostname = new URL(item.link).hostname.replace(/^www\./, '');
                } catch {}
                rawOffers.push({
                  titulo: String(item.title || descricao).trim(),
                  preco,
                  loja: hostname,
                  link: String(item.link || '').trim(),
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Price Search] Falha no Google Search orgânico:', err);
      }
    }

    if (rawOffers.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Nenhum preço público encontrado na web para "${descricao}". Tente simplificar o nome do item.`,
      }, { status: 404 });
    }

    // Ordena por preço crescente e remove outliers extremos (ex: fardo atacado 20x acima da mediana)
    const sorted = [...rawOffers].sort((a, b) => a.preco - b.preco);
    const median = sorted[Math.floor(sorted.length / 2)].preco;
    const filtered = sorted.filter((o) => o.preco >= median * 0.15 && o.preco <= median * 4.5);
    const validOffers = (filtered.length >= 2 ? filtered : sorted).slice(0, 10);

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
    return NextResponse.json({
      success: false,
      error: error?.message || 'Erro ao pesquisar preços na web.',
    }, { status: 500 });
  }
}
