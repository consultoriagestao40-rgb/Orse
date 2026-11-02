import { NextResponse } from 'next/server';

export async function GET() {
  // Desativado por segurança: script de bootstrap inicial concluído.
  // Impede redefinição indevida de credenciais de administradores em produção.
  return NextResponse.json({ error: 'Endpoint não disponível.' }, { status: 404 });
}
