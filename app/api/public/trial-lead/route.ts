import { NextResponse } from 'next/server';
import { processSaasTrialOnboarding } from '@/lib/saas-onboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, empresa, email, whatsapp, plano, postos } = body || {};

    if (!nome || !whatsapp) {
      return NextResponse.json({ error: 'Nome e WhatsApp são obrigatórios.' }, { status: 400 });
    }

    await processSaasTrialOnboarding({
      nome: String(nome),
      empresa: String(empresa || nome),
      email: String(email || ''),
      celular: String(whatsapp),
      planoInteresse: plano ? String(plano) : 'Demonstração LP',
      origem: 'LP_DEMONSTRACAO',
      postos: postos ? String(postos) : null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro em /api/public/trial-lead:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
