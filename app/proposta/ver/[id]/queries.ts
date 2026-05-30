import { prisma } from '@/lib/prisma';

/**
 * Função do lado do servidor para buscar um documento de proposta por ID
 */
export async function getDocumentoPropostaById(id: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id },
      include: {
        client: true,
        empresaEmissora: true,
        tenant: true,
        proposta: {
          include: {
            versoes: {
              include: {
                items: true
              }
            }
          }
        },
        secoes: {
          orderBy: { ordem: 'asc' }
        }
      }
    });
    if (doc && doc.proposta && doc.proposta.versoes) {
      const sortedVersoes = [...doc.proposta.versoes].sort((a: any, b: any) => b.versao - a.versao);
      doc.proposta.versoes = sortedVersoes;
    }
    return doc;
  } catch (error) {
    console.error('Erro ao buscar documento por ID:', error);
    return null;
  }
}
