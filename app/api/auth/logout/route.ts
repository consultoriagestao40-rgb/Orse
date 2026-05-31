import { NextResponse } from 'next/server'

function clearCookies(response: NextResponse) {
  response.cookies.set('sb_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  })
  response.cookies.set('sb_user', '', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  })
  return response
}

// GET - permite acessar /api/auth/logout diretamente pelo browser
export async function GET() {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'https://smartbidhub.com.br')
  )
  clearCookies(response)
  return response
}

// POST - para chamadas programáticas
export async function POST() {
  const response = NextResponse.json({ success: true })
  clearCookies(response)
  return response
}
