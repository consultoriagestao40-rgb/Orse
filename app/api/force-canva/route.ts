import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || 'cmpsloy27000004jlxvb5n9xo';
    const url = searchParams.get('url') || 'https://www.canva.com/design/DAHCXKiLmiQ/v3lyl52DMCmsHRbgxx8uHQ/view?embed';

    // 1. Busca o documento existente
    const doc = await prisma.documentoProposta.findUnique({
      where: { id }
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
