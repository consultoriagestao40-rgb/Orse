import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb_session')
  const { pathname } = request.nextUrl

  // Se estiver tentando acessar o login já logado, vai para a home
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Lista de rotas públicas
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/api/setup') || pathname.startsWith('/_next') || pathname.includes('favicon')

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
