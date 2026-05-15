import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const test = await prisma.user.count()
    return NextResponse.json({ success: true, count: test, env: !!process.env.DATABASE_URL })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      env: !!process.env.DATABASE_URL,
      url: process.env.DATABASE_URL?.substring(0, 20) + '...'
    }, { status: 500 })
  }
}
