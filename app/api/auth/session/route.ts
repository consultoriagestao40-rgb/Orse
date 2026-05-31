import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('sb_session')?.value

    if (session && session.includes('@')) {
      return NextResponse.json({ loggedIn: true, email: session.toLowerCase().trim() })
    }
  } catch (error) {
    console.error('Error checking session api:', error)
  }
  return NextResponse.json({ loggedIn: false })
}
