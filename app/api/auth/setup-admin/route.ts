import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const email = 'cristiano@grupojvsserv.com.br'
    const password = '123456'
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: 'ADMIN',
        nome: 'Cristiano Silva'
      },
      create: {
        email,
        nome: 'Cristiano Silva',
        password,
        role: 'ADMIN'
      }
    })
    
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0F172A; color: white;">
          <h1 style="color: #10B981;">Sucesso!</h1>
          <p>Usuário <b>${user.email}</b> pronto para acesso.</p>
          <a href="/login" style="margin-top: 20px; padding: 10px 20px; background: #1B4D3E; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Ir para o Login</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
