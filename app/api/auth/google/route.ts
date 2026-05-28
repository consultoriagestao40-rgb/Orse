import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  
  if (!clientId) {
    return new NextResponse('Erro: GOOGLE_CLIENT_ID não está configurado nas variáveis de ambiente.', { status: 500 })
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=smartbid_oauth_state` +
    `&prompt=consent`

  return NextResponse.redirect(googleAuthUrl)
}
