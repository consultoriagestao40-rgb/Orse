import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  if (key !== 'smartbid_temp_secure_key_123') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        password: true,
        role: true
      }
    })
    
    return NextResponse.json({ success: true, allUsers })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
