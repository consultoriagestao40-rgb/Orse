import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Atualizar todos os templates
    const templates = await prisma.templatePropostaComercial.findMany({
      include: { secoes: true }
    });

    for (const t of templates) {
      if (t.nome.includes('Simples')) {
        // Substituir totalmente as seções desse template pelo modelo exato da FPV
        await prisma.secaoTemplateProposta.deleteMany({ where: { templateId: t.id } });
        await prisma.secaoTemplateProposta.createMany({
          data: [
            { templateId: t.id, ordem: 1, titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
            { templateId: t.id, ordem: 2, titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
            { templateId: t.id, ordem: 3, titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]' },
            { templateId: t.id, ordem: 4, titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
            { templateId: t.id, ordem: 5, titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' }
          ]
        });
      }
    }

    // 2. Criar template de apresentação
    const existingApres = await prisma.templatePropostaComercial.findFirst({
      where: { nome: { contains: 'Apresentação' } }
    });

    if (!existingApres) {
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Apresentação (Slide Deck)',
          secoes: {
            create: [
              { ordem: 1, titulo: 'Instruções', texto: 'Este template renderiza os slides em tela cheia. O texto aqui é ignorado.' }
            ]
          }
        }
      });
    }

    // 3. Atualizar TODOS os Documentos já gerados
    const documentos = await prisma.documentoProposta.findMany({
      include: { templateOrigem: true }
    });
    
    for (const doc of documentos) {
      if (doc.templateOrigem?.nome?.includes('Simples')) {
        await prisma.secaoDocumentoProposta.deleteMany({ where: { documentoId: doc.id } });
        await prisma.secaoDocumentoProposta.createMany({
          data: [
            { documentoId: doc.id, ordem: 1, titulo: 'CLÁUSULA 01 - DO OBJETO E ESCOPO', texto: '[OBJETO_PROPOSTA]\n\n[ESCOPO_TECNICO]' },
            { documentoId: doc.id, ordem: 2, titulo: 'CLÁUSULA 02 - DAS CONDIÇÕES COMERCIAIS', texto: '[CONDICOES_COMERCIAIS]' },
            { documentoId: doc.id, ordem: 3, titulo: 'CLÁUSULA 03 - RESUMO COMERCIAL DA PROPOSTA', texto: 'Valores referentes aos serviços prestados, equipe alocada e insumos, conforme detalhamento a seguir:\n\n[TABELA]' },
            { documentoId: doc.id, ordem: 4, titulo: 'CLÁUSULA 04 - ITENS INCLUSOS E EXCLUSOS', texto: '[ITENS]' },
            { documentoId: doc.id, ordem: 5, titulo: 'CLÁUSULA 05 - TERMO DE ACEITE', texto: '[TERMO_ACEITE]' }
          ]
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Tudo atualizado' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
