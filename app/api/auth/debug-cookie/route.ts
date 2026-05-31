import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/debug-cookie
 * Mostra exatamente o que o servidor está lendo dos cookies
 * REMOVER EM PRODUÇÃO após debugging
 */
export async function GET() {
  const cookieStore = await cookies();
  const sbSession = cookieStore.get('sb_session');
  const sbUser = cookieStore.get('sb_user');

  let parsed: any = null;
  let parseError = '';

  if (sbUser?.value) {
    const strategies = [
      { name: 'decodeURI+JSON', fn: () => JSON.parse(decodeURIComponent(sbUser.value)) },
      { name: 'direct JSON', fn: () => JSON.parse(sbUser.value) },
      { name: 'trim+JSON', fn: () => { let s = sbUser.value.trim(); if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1,-1); return JSON.parse(s); } },
    ];

    for (const strategy of strategies) {
      try {
        parsed = { parsedWith: strategy.name, data: strategy.fn() };
        break;
      } catch (e: any) {
        parseError += `${strategy.name}: ${e.message}; `;
      }
    }
  }

  return NextResponse.json({
    sbSession: sbSession ? { exists: true, value: sbSession.value } : { exists: false },
    sbUser: sbUser ? {
      exists: true,
      rawValue: sbUser.value,
      rawLength: sbUser.value.length,
      firstChars: sbUser.value.substring(0, 80),
    } : { exists: false },
    parsed,
    parseError: parseError || null,
  });
}
