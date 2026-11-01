import { NextResponse } from 'next/server'

export async function GET() {
  // Desativado por segurança para impedir vazamento de configurações de banco de dados
  return NextResponse.json({ error: 'Endpoint não disponível.' }, { status: 404 })
}
