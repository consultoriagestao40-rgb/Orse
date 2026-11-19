import { NextResponse } from 'next/server';
import {
  buildVisitorHash,
  classifyTrafficSource,
  recordPublicPageEvent,
} from '@/lib/seo-analytics';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPath = String(body.path || '/');

    // Ignora páginas autenticadas internas do sistema
    if (
      rawPath.startsWith('/admin') ||
      rawPath.startsWith('/pipeline') ||
      rawPath.startsWith('/propostas-comerciais') ||
      rawPath.startsWith('/propostas/nova') ||
      rawPath.startsWith('/contratos') ||
      rawPath.startsWith('/leads') ||
      rawPath.startsWith('/pic') ||
      rawPath.startsWith('/tasks') ||
      rawPath.startsWith('/api')
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ua = request.headers.get('user-agent') || '';
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    const visitorHash = buildVisitorHash(
      typeof body.visitorId === 'string' ? body.visitorId : undefined,
      ip,
      ua
    );

    const source = classifyTrafficSource({
      referrer: body.referrer,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      fbclid: body.fbclid,
      gclid: body.gclid,
      ttclid: body.ttclid,
      postParam: body.postParam,
    });

    const eventType = body.eventType === 'CTA_CLICK' ? 'CTA_CLICK' : 'PAGE_VIEW';

    await recordPublicPageEvent({
      eventType,
      path: rawPath,
      visitorHash,
      source,
      referrer: body.referrer,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      userAgent: ua,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
