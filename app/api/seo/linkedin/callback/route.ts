import { NextResponse } from 'next/server';
import { getLinkedInConfig, saveLinkedInConfig } from '@/lib/seo-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect('https://www.smartbidhub.com.br/admin/seo?linkedin=error');
  }

  try {
    const cfg = await getLinkedInConfig();
    if (!cfg.clientId || !cfg.clientSecret) {
      return NextResponse.redirect('https://www.smartbidhub.com.br/admin/seo?linkedin=missing_credentials');
    }

    const redirectUri = 'https://www.smartbidhub.com.br/api/seo/linkedin/callback';
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect('https://www.smartbidhub.com.br/admin/seo?linkedin=token_error');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    let personUrn = cfg.personUrn || '';
    let personName = 'Cristiano Silva';

    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData?.sub) {
        personUrn = `urn:li:person:${meData.sub}`;
        personName = meData.name || personName;
      }
    }

    await saveLinkedInConfig({
      accessToken,
      personUrn,
      personName,
    });

    return NextResponse.redirect('https://www.smartbidhub.com.br/admin/seo?linkedin=connected');
  } catch {
    return NextResponse.redirect('https://www.smartbidhub.com.br/admin/seo?linkedin=error');
  }
}
