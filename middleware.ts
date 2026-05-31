import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb_session')
  const { pathname } = request.nextUrl

  // Se estiver tentando acessar o login já logado (com sessão válida E cookie de usuário), vai para a home
  // IMPORTANTE: só redireciona se AMBOS os cookies existirem para evitar loop infinito
  const sbUser = request.cookies.get('sb_user')
  if (pathname === '/login' && session && sbUser) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Lista de rotas públicas
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname.startsWith('/proposta/ver/') || pathname.startsWith('/api/setup') || pathname.startsWith('/_next') || pathname.includes('favicon')

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
