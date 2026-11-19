import { NextResponse } from 'next/server';
import { getLoggedUser } from '@/app/propostas/actions';
import { disconnectGscConfig } from '@/lib/seo-analytics';

export async function GET() {
  const user = await getLoggedUser();
  if (!user || user.role !== 'ADMIN') {
    return new NextResponse('Acesso restrito ao administrador.', { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || 'https://www.smartbidhub.com.br/api/auth/google/callback';

  if (!clientId) {
    return new NextResponse('Erro: GOOGLE_CLIENT_ID não está configurado.', { status: 500 });
  }

  const scope = 'openid email profile https://www.googleapis.com/auth/webmasters.readonly';
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=gsc_connect`;

  return NextResponse.redirect(googleAuthUrl);
}

export async function DELETE() {
  const user = await getLoggedUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Acesso restrito.' }, { status: 403 });
  }
  await disconnectGscConfig();
  return NextResponse.json({ success: true });
}
