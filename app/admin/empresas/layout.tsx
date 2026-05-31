import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SUPER_ADMIN_EMAILS = [
  'cristiano@grupojvsserv.com.br',
  'admin@smartbidhub.com.br',
];

/**
 * Layout Server Component para /admin/empresas
 * 
 * SOLUÇÃO DEFINITIVA: lê o email do cookie sb_session (httpOnly, servidor confiável)
 * em vez de tentar parsear o sb_user (que tinha problemas em produção).
 * 
 * O sb_session agora armazena o email do usuário diretamente.
 */
export default async function AdminEmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  // sb_session contém o email do usuário (definido no login)
  const sessionEmail = cookieStore.get('sb_session')?.value;

  // Sem sessão → vai para login
  if (!sessionEmail) {
    redirect('/login');
  }

  const emailNorm = sessionEmail.toLowerCase().trim();
  const isAdmin = SUPER_ADMIN_EMAILS.some(e => e === emailNorm);

  if (isAdmin) {
    // ✅ Admin verificado no servidor via cookie httpOnly
    return <>{children}</>;
  }

  // ❌ Logado mas não é admin → mostra acesso negado inline
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
        <p style={{ color: '#475569', fontSize: '11px', marginBottom: '24px', fontFamily: 'monospace' }}>
          Logado como: {emailNorm}
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
