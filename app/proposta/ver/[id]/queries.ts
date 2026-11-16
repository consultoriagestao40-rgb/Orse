import { prisma } from '@/lib/prisma';

function sortDocVersoes(doc: any) {
  if (doc && doc.proposta && doc.proposta.versoes) {
    const targetVersao = (doc as any).versaoFPV;
    const sortedVersoes = [...doc.proposta.versoes].sort((a: any, b: any) => {
      if (targetVersao) {
        if (a.versao === targetVersao && b.versao !== targetVersao) return -1;
        if (b.versao === targetVersao && a.versao !== targetVersao) return 1;
      }
      return b.versao - a.versao;
    });
    doc.proposta.versoes = sortedVersoes;
  }
  return doc;
}

const DOC_INCLUDE = {
  client: true,
  empresaEmissora: true,
  tenant: true,
  proposta: {
    include: {
      user: true,
      versoes: {
        include: {
          items: true,
        },
      },
    },
  },
  secoes: {
    orderBy: { ordem: 'asc' as const },
  },
};

/**
 * Função do lado do servidor para buscar um documento de proposta por ID
 */
export async function getDocumentoPropostaById(id: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id },
      include: DOC_INCLUDE,
    });
    return sortDocVersoes(doc);
  } catch (error) {
    console.error('Erro ao buscar documento por ID:', error);
    return null;
  }
}

/**
 * Resolve tanto ID direto quanto slug executivo (/p/fpv-096-r01-cliente-xxxxxxxxxx)
 */
export async function resolveDocumentoPropostaBySlugOrId(slugOrId: string) {
  try {
    const clean = decodeURIComponent(slugOrId || '').trim();
    if (!clean) return null;

    // 1. Tenta ID exato primeiro
    const exact = await prisma.documentoProposta.findUnique({
      where: { id: clean },
      include: DOC_INCLUDE,
    });
    if (exact) return sortDocVersoes(exact);

    // 2. Extrai sufixo final de 8-12 caracteres do slug executivo (ex.: ...-cm8x9k2m1p)
    const parts = clean.split('-').filter(Boolean);
    const tail = parts[parts.length - 1] || '';
    const numMatch = clean.match(/^fpv-(\d+)/i);
    const numFilter = numMatch ? Number(numMatch[1]) : null;

    if (tail.length >= 6) {
      const bySlug = await prisma.documentoProposta.findFirst({
        where: {
          id: { endsWith: tail },
          ...(numFilter ? { proposta: { numero: numFilter } } : {}),
        },
        include: DOC_INCLUDE,
      });
      if (bySlug) return sortDocVersoes(bySlug);

      // Fallback apenas pelo sufixo caso o número tenha sido editado na URL
      const byTailOnly = await prisma.documentoProposta.findFirst({
        where: { id: { endsWith: tail } },
        include: DOC_INCLUDE,
      });
      if (byTailOnly) return sortDocVersoes(byTailOnly);
    }

    return null;
  } catch (error) {
    console.error('Erro ao resolver slug de proposta:', error);
    return null;
  }
}
