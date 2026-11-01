import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { registerSuccessfulLogin } from '@/lib/security'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'E-mail e código de segurança são obrigatórios.' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()
    const cleanCode = String(code).replace(/\D/g, '')

    const user = await prisma.user.findUnique({
      where: { email: emailNorm },
      include: { tenant: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    if (!user.twoFactorCode || !user.twoFactorExpiresAt) {
      return NextResponse.json({ error: 'Nenhum código de segurança ativo. Solicite um novo código.' }, { status: 400 })
    }

    // Verifica se expirou
    if (new Date() > new Date(user.twoFactorExpiresAt)) {
      return NextResponse.json({ error: 'O código de segurança expirou. Faça login novamente para receber um novo código.' }, { status: 401 })
    }

    // Verifica se o código bate
    if (user.twoFactorCode !== cleanCode) {
      return NextResponse.json({ error: 'Código de segurança incorreto. Verifique o número de 6 dígitos no seu e-mail.' }, { status: 401 })
    }

    // Código correto: queima o token OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpiresAt: null,
      }
    })

    await registerSuccessfulLogin(user.id)

    const isProduction = process.env.NODE_ENV === 'production'

    const userData = {
      id: user.id,
      nome: user.nome,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      iniciais: user.nome.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      ...(user.avatarUrl ? { avatarUrl: `/api/user/avatar?email=${encodeURIComponent(user.email)}&v=${user.avatarUrl.length > 30 ? encodeURIComponent(user.avatarUrl.substring(user.avatarUrl.length - 10)) : encodeURIComponent(user.avatarUrl.substring(0, 10))}` } : {}),
      ...(user.tenant?.logoUrl ? { tenantLogoUrl: `/api/tenant/logo?tenantId=${user.tenantId}&v=${user.tenant.logoUrl.length > 30 ? encodeURIComponent(user.tenant.logoUrl.substring(user.tenant.logoUrl.length - 10)) : encodeURIComponent(user.tenant.logoUrl.substring(0, 10))}` } : {}),
      ...(user.tenant?.nomeFantasia ? { tenantNome: user.tenant.nomeFantasia } : {}),
      ...(user.tenant?.primaryColor ? { primaryColor: user.tenant.primaryColor } : {}),
    }

    const response = NextResponse.json({
      success: true,
      user: {
        nome: user.nome,
        role: user.role,
        email: user.email,
        cargo: user.cargo
      }
    })

    const baseOpts = {
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }

    response.cookies.set('sb_session', user.email, {
      ...baseOpts,
      httpOnly: true,
    })

    response.cookies.set('sb_user', JSON.stringify(userData), {
      ...baseOpts,
      httpOnly: false,
    })

    return response
  } catch (error: any) {
    console.error('Verify 2FA Error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
