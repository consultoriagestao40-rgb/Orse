import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb_session')
  const { pathname, origin } = request.nextUrl

  const sessionValue = session?.value || ''
  const isValidSession = sessionValue.includes('@')

  if ((pathname === '/login' || pathname === '/cadastro') && isValidSession) {
    return NextResponse.redirect(`${origin}/`)
  }

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/icon.svg' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname.startsWith('/proposta/ver/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')

  if (!sessionValue && !isPublicRoute) {
    return NextResponse.redirect(`${origin}/login`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png|icon.svg).*)'],
}
