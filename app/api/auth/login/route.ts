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
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      ...(user.tenant?.logoUrl ? { tenantLogoUrl: user.tenant.logoUrl } : {}),
      ...(user.tenant?.nomeFantasia ? { tenantNome: user.tenant.nomeFantasia } : {}),
    }

    const response = NextResponse.json({
      success: true,
      user: {
        nome: user.nome,
        role: user.role,
        email: user.email
      }
    })

    const cookieOptions = {
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    }

    // Cookie de sessão - HttpOnly (servidor apenas)
    response.cookies.set('sb_session', 'active', {
      ...cookieOptions,
      httpOnly: true,
    })

    // Cookie de dados do usuário - legível pelo browser (para personalização do UI)
    response.cookies.set('sb_user', JSON.stringify(userData), {
      ...cookieOptions,
      httpOnly: false, // precisa ser lido pelo JS do browser
    })

    return response
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
