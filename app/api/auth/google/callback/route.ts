import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { extractAttributionFromRequest, sendMetaCapiEvent } from '@/lib/marketing-attribution'

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

    // Se veio do botão "Conectar Google Search Console" em /admin/seo, salva o refresh_token do Search Console sem mexer na sessão atual
    if (searchParams.get('state') === 'gsc_connect') {
      const { getLoggedUser } = await import('@/app/propostas/actions')
      const currentAdmin = await getLoggedUser()
      if (!currentAdmin || currentAdmin.role !== 'ADMIN') {
        return new NextResponse('Acesso restrito ao administrador para vincular Search Console.', { status: 403 })
      }
      const { saveGscConfig } = await import('@/lib/seo-analytics')
      await saveGscConfig({
        ...(tokenData.refresh_token ? { refreshToken: tokenData.refresh_token } : {}),
        accessToken: tokenData.access_token,
        connectedEmail: googleUser.email,
      })
      return NextResponse.redirect(new URL('/admin/seo?gsc=connected', request.url))
    }

    // 3. Buscar o usuário no banco de dados local pelo e-mail
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email }
    })

    const attribution = extractAttributionFromRequest(request)

    // Novos usuários (ou usuários sem empresa) recebem SEMPRE uma empresa isolada em teste de 7 dias.
    // Nunca vincular a um tenant existente: isso exporia dados de outra empresa.
    const createTrialTenant = () => {
      const domain = String(googleUser.email).split('@')[1] || ''
      const isPersonal = /^(gmail|hotmail|outlook|yahoo|icloud|live|bol|uol)\./i.test(domain)
      const nomeEmpresa = !isPersonal && domain
        ? domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : `Empresa de ${googleUser.name || String(googleUser.email).split('@')[0]}`
      return prisma.tenant.create({
        data: {
          nomeFantasia: nomeEmpresa,
          cnpj: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          plano: 'TESTE',
          trialStartedAt: new Date(),
          limiteUsuarios: 3,
          features: {
            entregas: false,
            ativos: false,
            erpflex: false,
            ...(attribution ? { attribution } : {}),
          } as any,
        }
      })
    }

    if (!user) {
      const tenant = await createTrialTenant()
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          nome: googleUser.name || googleUser.email.split('@')[0],
          role: 'ADMIN',
          password: Math.random().toString(36).slice(-8), // senha aleatória inacessível por segurança
          tenantId: tenant.id
        }
      })
      try {
        const { processSaasTrialOnboarding } = await import('@/lib/saas-onboarding')
        await processSaasTrialOnboarding({
          nome: user.nome,
          empresa: tenant.nomeFantasia,
          email: user.email,
          celular: '',
          planoInteresse: 'Teste Grátis 30 Dias (Google)',
          origem: 'GOOGLE_AUTH',
          attribution,
        })
      } catch (e) {
        console.warn('Aviso onboarding Google Auth:', e)
      }
      try {
        const googleEvtId = `google_trial_${tenant.id}`
        await Promise.all([
          sendMetaCapiEvent({
            eventName: 'CompleteRegistration',
            eventId: `${googleEvtId}_reg`,
            request,
            email: user.email,
            fullName: user.nome,
            attribution,
            customData: { content_name: 'Google OAuth Trial 30d', status: 'registered' },
          }),
          sendMetaCapiEvent({
            eventName: 'StartTrial',
            eventId: googleEvtId,
            request,
            email: user.email,
            fullName: user.nome,
            attribution,
            customData: { content_name: 'Google OAuth Trial 30d', value: 149, currency: 'BRL' },
          }),
        ])
      } catch (e) {
        console.warn('Aviso Meta CAPI Google Auth:', e)
      }
    } else if (!user.tenantId) {
      const tenant = await createTrialTenant()
      user = await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: tenant.id }
      })
    }

    // 5. Configurar Cookies de Sessão seguros
    const isProduction = process.env.NODE_ENV === 'production'
    const superAdmins = ['admin@smartbidhub.com.br', 'admin@smartbid.com']
    const userEmail = user.email.toLowerCase().trim()
    const redirectUrl = superAdmins.includes(userEmail) ? '/admin/empresas' : '/'
    const redirectTarget = new URL(redirectUrl, request.url)
    const response = NextResponse.redirect(redirectTarget)

    const userTenant = user.tenantId ? await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    }) : null

    response.cookies.set('sb_session', user.email, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    })

    response.cookies.set('sb_user', JSON.stringify({
      id: user.id,
      nome: user.nome,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      avatarUrl: user.avatarUrl ? '/api/user/avatar' : undefined,
      tenantLogoUrl: userTenant?.logoUrl ? `/api/tenant/logo?tenantId=${user.tenantId}&v=${userTenant.logoUrl.length > 30 ? encodeURIComponent(userTenant.logoUrl.substring(userTenant.logoUrl.length - 10)) : encodeURIComponent(userTenant.logoUrl.substring(0, 10))}` : undefined,
      tenantNome: userTenant?.nomeFantasia || undefined,
      primaryColor: userTenant?.primaryColor || undefined,
      iniciais: user.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }), {
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Google OAuth Callback Error:', error)
    return new NextResponse(`Erro interno: ${error.message}`, { status: 500 })
  }
}
