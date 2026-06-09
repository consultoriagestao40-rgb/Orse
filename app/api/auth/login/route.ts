import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { tenant: true }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const isProduction = process.env.NODE_ENV === 'production'

    const userData = {
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
        email: user.email
      }
    })

    const baseOpts = {
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }

    // sb_session: armazena o email diretamente (httpOnly - lido apenas pelo servidor)
    // Isso permite que o layout.tsx valide admin sem depender de sb_user
    response.cookies.set('sb_session', user.email, {
      ...baseOpts,
      httpOnly: true,
    })

    // sb_user: dados completos para o frontend (não httpOnly - lido pelo browser)
    response.cookies.set('sb_user', JSON.stringify(userData), {
      ...baseOpts,
      httpOnly: false,
    })

    return response
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
