import { NextResponse } from 'next/server';
import { getLoggedUser } from '@/app/propostas/actions';
import {
  fetchGoogleSearchConsoleData,
  getPublicAnalyticsSummary,
} from '@/lib/seo-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getLoggedUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Acesso restrito.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days') || '30');

    const [analytics, gsc] = await Promise.all([
      getPublicAnalyticsSummary(days),
      fetchGoogleSearchConsoleData(days),
    ]);

    return NextResponse.json({
      success: true,
      analytics,
      gsc,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao buscar analytics de LP e SEO' },
      { status: 500 }
    );
  }
}
