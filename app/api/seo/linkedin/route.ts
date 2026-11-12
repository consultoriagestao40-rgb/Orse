import { NextResponse } from 'next/server';
import {
  getLinkedInConfig,
  saveLinkedInConfig,
  normalizeOrganizationId,
  getSeoArticleBySlug,
  publishToLinkedInAutopilot,
} from '@/lib/seo-engine';

export const maxDuration = 60;

export async function GET() {
  const cfg = await getLinkedInConfig();
  return NextResponse.json({
    success: true,
    connected: Boolean(cfg.accessToken),
    metaConnected: Boolean(cfg.metaAccessToken),
    personName: cfg.personName || null,
    personUrn: cfg.personUrn || null,
    organizationId: cfg.organizationId || '145437619',
    facebookPageId: cfg.facebookPageId || '1510660472123825',
    instagramAccountId: cfg.instagramAccountId || '',
    clientId: cfg.clientId || '',
    hasClientSecret: Boolean(cfg.clientSecret),
    updatedAt: cfg.updatedAt || null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ação 1: Publicar um artigo específico via API Oficial do LinkedIn agora (após aprovação no modal)
    if (body.action === 'publish_now' && body.slug) {
      const article = await getSeoArticleBySlug(String(body.slug));
      if (!article) {
        return NextResponse.json({ success: false, error: 'Artigo não encontrado' }, { status: 404 });
      }
      const customPostText = body.postText ? String(body.postText) : undefined;
      const result = await publishToLinkedInAutopilot(article, customPostText, {
        style: body.style ? String(body.style) : 'cascade',
        photo: body.photo !== undefined && body.photo !== null ? Number(body.photo) : null,
      });
      return NextResponse.json({
        success: result.ok,
        message: result.message,
      });
    }

    // Ação 2: Salvar Organization ID da Company Page e/ou Token da Meta (Instagram @smartbidhub + Facebook 1510660472123825)
    if (body.action === 'save_org') {
      const orgId = normalizeOrganizationId(body.organizationId ? String(body.organizationId) : '145437619');
      const partial: any = { organizationId: orgId };
      if (body.metaAccessToken !== undefined && String(body.metaAccessToken).trim() !== '') {
        partial.metaAccessToken = String(body.metaAccessToken).trim();
      }
      if (body.facebookPageId !== undefined && String(body.facebookPageId).trim() !== '') {
        partial.facebookPageId = String(body.facebookPageId).trim();
      }
      const saved = await saveLinkedInConfig(partial);
      return NextResponse.json({
        success: true,
        organizationId: saved.organizationId || '145437619',
        metaConnected: Boolean(saved.metaAccessToken),
        message: saved.metaAccessToken
          ? `LinkedIn + Instagram (@smartbidhub) + Página Facebook (${saved.facebookPageId || '1510660472123825'}) vinculados para disparo automático às 06h!`
          : `Company Page SmartBid (${orgId}) vinculada!`,
      });
    }

    // Ação 3: Salvar Client ID / Secret / Access Token e iniciar OAuth se necessário
    const saved = await saveLinkedInConfig({
      clientId: body.clientId !== undefined ? String(body.clientId).trim() : undefined,
      clientSecret: body.clientSecret !== undefined ? String(body.clientSecret).trim() : undefined,
      accessToken: body.accessToken !== undefined ? String(body.accessToken).trim() : undefined,
      personUrn: body.personUrn !== undefined ? String(body.personUrn).trim() : undefined,
      organizationId:
        body.organizationId !== undefined ? normalizeOrganizationId(String(body.organizationId)) : undefined,
    });

    const redirectUri = 'https://www.smartbidhub.com.br/api/seo/linkedin/callback';
    const oauthUrl = saved.clientId
      ? `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(
          saved.clientId
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
          'openid profile email w_member_social'
        )}`
      : null;

    return NextResponse.json({
      success: true,
      connected: Boolean(saved.accessToken),
      oauthUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao salvar LinkedIn' }, { status: 500 });
  }
}
