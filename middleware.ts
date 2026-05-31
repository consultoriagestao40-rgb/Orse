import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb_session')
  const { pathname } = request.nextUrl

  // sb_session agora contém o email do usuário (ou 'active' para sessões antigas)
  // Considera logado se o cookie existe e tem valor
  const isLoggedIn = !!(session?.value)

  // Se já está logado e tenta acessar o login → redireciona para home
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Lista de rotas públicas (não requerem autenticação)
  const isPublicRoute = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname.startsWith('/proposta/ver/') || 
    pathname.startsWith('/api/setup') || 
    pathname.startsWith('/_next') || 
    pathname.includes('favicon')

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
