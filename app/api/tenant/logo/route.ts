import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      const cookieStore = await cookies()
      const email = cookieStore.get('sb_session')?.value

      if (!email) {
        return new NextResponse('Unauthorized', { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })

      if (!user || !user.tenantId) {
        return new NextResponse('Not Found', { status: 404 })
      }

      tenantId = user.tenantId
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant || !tenant.logoUrl) {
      return new NextResponse('No logo defined', { status: 404 })
    }

    const logoUrl = tenant.logoUrl

    // Se for um Data URL base64, decodifica e serve como binário
    if (logoUrl.startsWith('data:image/')) {
      const match = logoUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/)
      if (match) {
        const contentType = match[1]
        const base64Data = match[2]
        const buffer = Buffer.from(base64Data, 'base64')

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        })
      }
    }

    // Se for uma URL tradicional, faz redirecionamento
    return NextResponse.redirect(new URL(logoUrl, request.url))
  } catch (error: any) {
    console.error('Error serving tenant logo:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
