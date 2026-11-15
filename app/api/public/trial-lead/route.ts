import { NextResponse } from 'next/server';
import { processSaasTrialOnboarding } from '@/lib/saas-onboarding';
import { extractAttributionFromRequest, sendMetaCapiEvent } from '@/lib/marketing-attribution';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, empresa, email, whatsapp, plano, postos, attribution: rawAttribution, eventId } = body || {};

    if (!nome || !whatsapp) {
      return NextResponse.json({ error: 'Nome e WhatsApp são obrigatórios.' }, { status: 400 });
    }

    const attribution = extractAttributionFromRequest(request, rawAttribution);

    await processSaasTrialOnboarding({
      nome: String(nome),
      empresa: String(empresa || nome),
      email: String(email || ''),
      celular: String(whatsapp),
      planoInteresse: plano ? String(plano) : 'Demonstração LP',
      origem: 'LP_DEMONSTRACAO',
      postos: postos ? String(postos) : null,
      attribution,
    });

    await sendMetaCapiEvent({
      eventName: 'Lead',
      eventId: typeof eventId === 'string' && eventId ? eventId : undefined,
      request,
      email: email ? String(email) : null,
      phone: String(whatsapp),
      fullName: String(nome),
      eventSourceUrl: 'https://www.smartbidhub.com.br/lp',
      attribution,
      customData: {
        content_name: plano ? String(plano) : 'Demonstração LP',
        size: postos ? String(postos) : undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro em /api/public/trial-lead:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
