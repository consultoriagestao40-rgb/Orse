import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { askCctAI } from '@/lib/cctParser';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { pergunta } = body;

    if (!pergunta || typeof pergunta !== 'string' || pergunta.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Pergunta não informada.' }, { status: 400 });
    }

    const cct = await prisma.cCT.findUnique({
      where: { id },
      include: {
        cargos: true
      }
    });

    if (!cct) {
      return NextResponse.json({ success: false, error: 'CCT não encontrada.' }, { status: 404 });
    }

    // Se o usuário não é platform admin e o tenantId é diferente, nega
    const platformAccounts = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const isPlatformAdmin = user.email ? platformAccounts.includes(user.email.toLowerCase().trim()) : false;
    if (!isPlatformAdmin && cct.tenantId && user.tenantId && cct.tenantId !== user.tenantId) {
      return NextResponse.json({ success: false, error: 'Acesso negado a esta CCT.' }, { status: 403 });
    }

    // Resposta inteligente da IA sobre a CCT
    const aiResult = await askCctAI(pergunta, {
      nome: cct.nome,
      uf: cct.uf,
      textoCompleto: cct.textoCompleto,
      resumoClausulas: cct.resumoClausulas,
      cargos: cct.cargos
    });

    return NextResponse.json({
      success: true,
      pergunta,
      resposta: aiResult.resposta,
      clausulaCitada: aiResult.clausulaCitada,
      trechoOriginal: aiResult.trechoOriginal,
      cctNome: cct.nome
    });

  } catch (error: any) {
    console.error('Erro no Chat da CCT com IA:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Erro ao processar consulta com IA.' 
    }, { status: 500 });
  }
}
