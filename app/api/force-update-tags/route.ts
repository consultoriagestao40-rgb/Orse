import { NextResponse } from 'next/server';

export async function GET() {
  // Desativado por segurança: script de migração executado e encerrado
  return NextResponse.json({ error: 'Endpoint não disponível.' }, { status: 404 });
}
