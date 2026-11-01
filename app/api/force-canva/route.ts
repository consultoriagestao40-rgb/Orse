import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';

export async function GET(request: Request) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const url = searchParams.get('url');

    if (!id || !url) {
      return NextResponse.json({ error: 'Parâmetros "id" e "url" são obrigatórios.' }, { status: 400 });
    }

    // 1. Busca o documento existente garantindo que pertence ao tenant
    const doc = await prisma.documentoProposta.findFirst({
      where: { 
        id,
        proposta: {
          tenantId: user.tenantId
        }
      }
    });

    if (!doc) {
      return NextResponse.json({ success: false, error: `Documento com ID ${id} nao encontrado.` }, { status: 404 });
    }

    // 2. Mescla a configuracao existente com a nova
    const currentConfig: any = doc.configApresentacao || {};
    const newConfig = {
      ...currentConfig,
      useCanva: true,
      canvaEmbedUrl: url,
      clientTabs: {
        ...(currentConfig.clientTabs || { proposta: true, fpv: true, minuta: false }),
        apresentacao: true
      }
    };

    // 3. Atualiza no banco
    const updated = await prisma.documentoProposta.update({
      where: { id },
      data: {
        configApresentacao: newConfig
      }
    });

    return NextResponse.json({
      success: true,
      message: `Documento ${id} atualizado com sucesso com o link do Canva!`,
      config: updated.configApresentacao
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
