import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const adminEmail = 'admin@smartbidhub.com.br'
    const cristianoEmail = 'cristiano@grupojvsserv.com.br'
    
    // 1. Garantir que o admin@smartbidhub.com.br tenha a senha 123456 e tenantId null
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: '123456',
        role: 'ADMIN',
        tenantId: null
      },
      create: {
        email: adminEmail,
        nome: 'SmartBidHub Admin',
        password: '123456',
        role: 'ADMIN',
        tenantId: null
      }
    })

    // 2. Garantir que o cristiano@grupojvsserv.com.br tenha a senha 123456 e role ADMIN
    const cristianoUser = await prisma.user.updateMany({
      where: { email: cristianoEmail },
      data: {
        password: '123456',
        role: 'ADMIN'
      }
    })

    // 3. Listar usuários cadastrados para conferência (sem expor a senha real por segurança)
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        nome: true,
        role: true,
        tenantId: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin credentials reset and synchronized successfully.',
      users: allUsers
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
