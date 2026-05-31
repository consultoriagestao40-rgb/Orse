import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('sb_session')
  const { pathname } = request.nextUrl

  // sb_session pode conter um email (novo formato) ou 'active' (formato antigo)
  // Só considera realmente logado se o valor parece um email (contém @)
  // Isso evita que sessões antigas com valor 'active' bloqueiem o acesso ao login
  const sessionValue = session?.value || ''
  const isValidSession = sessionValue.includes('@')

  // Se já está logado (sessão válida com email) e tenta acessar o login → home
  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Lista de rotas públicas
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/proposta/ver/') ||
    pathname.startsWith('/api/setup') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')

  // Protege rotas privadas: só bloqueia se não há NENHUMA sessão (nem velha nem nova)
  if (!sessionValue && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
