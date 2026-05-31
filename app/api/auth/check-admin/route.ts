import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SUPER_ADMIN_EMAILS = [
  'cristiano@grupojvsserv.com.br',
  'admin@smartbidhub.com.br',
];

/**
 * GET /api/auth/check-admin
 * Verifica se o usuário logado tem privilégios de Super Admin.
 * Usa cookies do servidor para garantir leitura confiável em produção.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    // Tenta ler o cookie sb_user com múltiplas estratégias de parse
    const sbUserRaw = cookieStore.get('sb_user')?.value;
    const sbSession = cookieStore.get('sb_session')?.value;

    // Sem sessão ativa → não autorizado
    if (!sbSession) {
      return NextResponse.json({ isAdmin: false, reason: 'no_session' });
    }

    if (!sbUserRaw) {
      return NextResponse.json({ isAdmin: false, reason: 'no_user_cookie' });
    }

    // Parse robusto: tenta 3 estratégias
    let userData: any = null;
    const strategies = [
      () => JSON.parse(decodeURIComponent(sbUserRaw)),
      () => JSON.parse(sbUserRaw),
      () => {
        let s = sbUserRaw.trim();
        if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
        return JSON.parse(s);
      },
    ];

    for (const strategy of strategies) {
      try {
        userData = strategy();
        if (userData) break;
      } catch {}
    }

    if (!userData) {
      return NextResponse.json({ isAdmin: false, reason: 'parse_failed', raw: sbUserRaw.substring(0, 50) });
    }

    const email = (userData.email || '').toLowerCase().trim();
    const isAdmin = SUPER_ADMIN_EMAILS.includes(email);

    return NextResponse.json({
      isAdmin,
      email,
      nome: userData.nome || '',
    });
  } catch (error: any) {
    console.error('[check-admin] Erro:', error);
    return NextResponse.json({ isAdmin: false, reason: 'error', message: error.message }, { status: 500 });
  }
}
