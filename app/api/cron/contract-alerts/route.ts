import { NextResponse } from 'next/server';
import { runContractAndReajusteAlerts } from '@/lib/contract-alerts';

export async function GET() {
  try {
    const summary = await runContractAndReajusteAlerts();
    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (err: any) {
    console.error('Erro no cron /api/cron/contract-alerts:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao verificar vencimentos e reajustes de contratos' },
      { status: 500 }
    );
  }
}
