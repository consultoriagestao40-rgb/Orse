import { NextResponse } from 'next/server';

export async function GET() {
  // Desativado por segurança para impedir vazamento de tokens e cookies no navegador
  return NextResponse.json({ error: 'Endpoint não disponível.' }, { status: 404 });
}
