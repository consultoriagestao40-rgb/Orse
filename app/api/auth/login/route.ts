import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        nome: user.nome, 
        role: user.role, 
        email: user.email 
      } 
    })

    // Configurar cookie de sessão seguro
    // Em produção, deve ser HttpOnly e Secure
    response.cookies.set('sb_session', 'active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    // Cookie de dados básicos (não sensíveis) para o frontend ler iniciais etc
    response.cookies.set('sb_user', JSON.stringify({
      nome: user.nome,
      role: user.role,
      iniciais: user.nome.split(' ').map(n => n[0]).join('').toUpperCase()
    }), {
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
