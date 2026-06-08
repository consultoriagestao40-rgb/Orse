import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { nome, email, password, empresa } = await request.json()

    if (!nome || !email || !password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()

    // Verifica se já existe usuário com esse e-mail
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail. Tente fazer login.' }, { status: 409 })
    }

    // Cria ou encontra o Tenant da empresa do usuário
    let tenantId: string | undefined = undefined
    if (empresa?.trim()) {
      // Tenta encontrar tenant pelo nome (simplificado — em produção usaria CNPJ)
      const tenantNome = empresa.trim()
      let tenant = await prisma.tenant.findFirst({ where: { nomeFantasia: { contains: tenantNome, mode: 'insensitive' } } })
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            nomeFantasia: tenantNome,
            cnpj: `TEMP-${Date.now()}`, // CNPJ temporário — será atualizado pelo admin
            plano: 'STARTER',
            limiteUsuarios: 3,
          }
        })
      }
      tenantId = tenant.id
    }

    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        email: emailNorm,
        password: password, // Em produção, usar bcrypt — aqui mantemos o padrão do sistema
        role: 'ADMIN',
        ...(tenantId ? { tenantId } : {}),
      },
      include: { tenant: true }
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const userData = {
      nome: user.nome,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
      iniciais: user.nome.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
      ...(user.tenant?.nomeFantasia ? { tenantNome: user.tenant.nomeFantasia } : {}),
      ...(user.tenant?.primaryColor ? { primaryColor: user.tenant.primaryColor } : {}),
    }

    const response = NextResponse.json({ success: true, user: { nome: user.nome, email: user.email, role: user.role } })

    response.cookies.set('sb_session', user.email, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    response.cookies.set('sb_user', JSON.stringify(userData), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Register Error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 })
  }
}
