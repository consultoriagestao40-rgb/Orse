import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return new NextResponse('Erro: Código de autorização não recebido do Google.', { status: 400 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'

    if (!clientId || !clientSecret) {
      return new NextResponse('Erro: Credenciais do Google OAuth não configuradas no servidor.', { status: 500 })
    }

    // 1. Trocar o código de autorização pelo token de acesso
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Erro na troca de token:', tokenData)
      return new NextResponse(`Erro ao validar autenticação: ${tokenData.error_description || tokenData.error}`, { status: 400 })
    }

    // 2. Buscar o perfil do usuário na API do Google usando o access_token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    const googleUser = await userResponse.json()

    if (!googleUser.email) {
      return new NextResponse('Erro: E-mail não fornecido pela conta Google.', { status: 400 })
    }

    // 3. Buscar ou criar o Tenant "Silva Consultoria Empresarial LTDA" como tenant padrão
    let defaultTenant = await prisma.tenant.findUnique({
      where: { cnpj: '40.180.983/0001-00' }
    })

    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          nomeFantasia: 'Silva Consultoria Empresarial LTDA',
          cnpj: '40.180.983/0001-00'
        }
      })
    }

    // 4. Buscar o usuário no banco de dados local pelo e-mail
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    })

    if (!user) {
      // Se não existir, criamos o usuário automaticamente sob o tenant do "Grupo JVS"
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          nome: googleUser.name || googleUser.email.split('@')[0],
          role: 'USER',
          password: Math.random().toString(36).slice(-8), // senha aleatória inacessível por segurança
          tenantId: defaultTenant.id
        }
      })
    } else if (!user.tenantId) {
      // Se o usuário existir mas não tiver tenantId associado, vinculamos ele ao Grupo JVS
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: defaultTenant.id }
      })
    }

    // 5. Configurar Cookies de Sessão seguros
    const isProduction = process.env.NODE_ENV === 'production'
    const redirectTarget = new URL('/propostas/nova', request.url)
    const response = NextResponse.redirect(redirectTarget)

    response.cookies.set('sb_session', 'active', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    response.cookies.set('sb_user', JSON.stringify({
      nome: user.nome,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl || undefined,
      iniciais: user.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }), {
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error)
    return new NextResponse(`Erro interno: ${error.message}`, { status: 500 })
  }
}
