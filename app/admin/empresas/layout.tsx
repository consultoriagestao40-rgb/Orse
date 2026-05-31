import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SUPER_ADMIN_EMAILS = [
  'cristiano@grupojvsserv.com.br',
  'admin@smartbidhub.com.br',
];

function parseCookieValue(raw: string): any | null {
  const strategies = [
    () => JSON.parse(decodeURIComponent(raw)),
    () => JSON.parse(raw),
    () => {
      let s = raw.trim();
      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
      return JSON.parse(s);
    },
  ];
  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result && typeof result === 'object') return result;
    } catch {}
  }
  return null;
}

/**
 * Layout Server Component para /admin/empresas
 * Verifica autenticação no servidor durante SSR.
 * - Sem sb_session → redirect /login
 * - Sem sb_user → redirect /login (limpar e refazer login)
 * - Não é admin → acesso negado inline (sem redirect para evitar loops)
 * - É admin → renderiza o dashboard
 */
export default async function AdminEmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sbSession = cookieStore.get('sb_session')?.value;
  const sbUserRaw = cookieStore.get('sb_user')?.value;

  // Sem sessão ou sem cookie de usuário → vai para login
  if (!sbSession || !sbUserRaw) {
    redirect('/login');
  }

  // Tenta fazer parse do cookie do usuário
  const userData = parseCookieValue(sbUserRaw);

  if (userData) {
    const email = (userData.email || '').toLowerCase().trim();
    if (SUPER_ADMIN_EMAILS.some(adminEmail => email === adminEmail)) {
      // ✅ É admin verificado no servidor → renderiza o painel
      return <>{children}</>;
    }
  }

  // ❌ Não é admin → mostra acesso negado inline (sem redirect para evitar loops)
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
          Acesso Restrito
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', lineHeight: '1.6' }}>
          Esta área é exclusiva para administradores master.
        </p>
        <p style={{ color: '#475569', fontSize: '11px', marginBottom: '24px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          Email detectado: {userData?.email || 'não identificado'}
        </p>
        <a
          href="/api/auth/logout"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#1B4D3E',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Sair e Entrar Novamente
        </a>
      </div>
    </div>
  );
}
