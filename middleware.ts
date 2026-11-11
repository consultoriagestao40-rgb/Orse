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
    pathname === '/lp' ||
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname === '/privacidade' ||
    pathname === '/termos' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/icon.svg' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png' ||
    pathname.startsWith('/proposta/') ||
    pathname === '/conteudos' ||
    pathname.startsWith('/conteudos/') ||
    pathname.startsWith('/slides/') ||
    pathname.startsWith('/uploads/') ||
    pathname === '/og-image.jpg' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/llms.txt' ||
    pathname === '/ai-catalog.json' ||
    pathname === '/ard.json' ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/google7ebbc4c4a41aadfa.html' ||
    (pathname.startsWith('/google') && pathname.endsWith('.html')) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')

  if (!sessionValue && !isPublicRoute) {
    return NextResponse.redirect(`${origin}/login`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|\\.well-known|slides|uploads|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png|icon.svg|og-image.jpg|sitemap.xml|robots.txt|llms.txt|ai-catalog.json|ard.json|google7ebbc4c4a41aadfa.html).*)'],
}
