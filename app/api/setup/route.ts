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
    
    return NextResponse.json({ success: true, message: 'Admin criado', user: user.email })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
