import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Atualizar todos os templates
    const templates = await prisma.templatePropostaComercial.findMany({
      include: { secoes: true }
    });

    for (const t of templates) {
      for (const s of t.secoes) {
        if (s.titulo.toUpperCase().includes('VALOR') && !s.texto.includes('[TABELA]')) {
          await prisma.secaoTemplateProposta.update({
            where: { id: s.id },
            data: { texto: s.texto + '\n\n[TABELA]\n\n[TERMO_ACEITE]' }
          });
        }
        if (s.titulo.toUpperCase().includes('ESCOPO') && !s.texto.includes('[ITENS]')) {
          await prisma.secaoTemplateProposta.update({
            where: { id: s.id },
            data: { texto: s.texto + '\n\n[ITENS]' }
          });
        }
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
    const documentos = await prisma.secaoDocumentoProposta.findMany();
    for (const doc of documentos) {
      if (doc.titulo.toUpperCase().includes('VALOR') && !doc.texto.includes('[TABELA]')) {
        await prisma.secaoDocumentoProposta.update({
          where: { id: doc.id },
          data: { texto: doc.texto + '\n\n[TABELA]\n\n[TERMO_ACEITE]' }
        });
      }
      if (doc.titulo.toUpperCase().includes('ESCOPO') && !doc.texto.includes('[ITENS]')) {
        await prisma.secaoDocumentoProposta.update({
          where: { id: doc.id },
          data: { texto: doc.texto + '\n\n[ITENS]' }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Tudo atualizado' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
