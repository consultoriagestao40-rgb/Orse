import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SUPER_ADMIN_EMAILS = [
  'cristiano@grupojvsserv.com.br',
  'admin@smartbidhub.com.br',
];

/**
 * Layout Server Component para /admin/empresas
 * Verifica autenticação no servidor DURANTE o SSR (antes de qualquer JS client-side)
 * Esta é a abordagem mais confiável em produção na Vercel
 */
export default async function AdminEmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sbSession = cookieStore.get('sb_session')?.value;

  // Sem sessão → vai para login
  if (!sbSession) {
    redirect('/login');
  }

  const sbUserRaw = cookieStore.get('sb_user')?.value;

  if (sbUserRaw) {
    // Parse robusto do cookie (3 estratégias)
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
        const data = strategy();
        if (data) {
          const email = (data.email || '').toLowerCase().trim();
          if (SUPER_ADMIN_EMAILS.includes(email)) {
            // ✅ É admin - renderiza o painel
            return <>{children}</>;
          }
          // Conseguiu fazer parse mas não é admin - para aqui
          break;
        }
      } catch {
        // Tenta próxima estratégia
      }
    }
  }

  // ❌ Não autorizado - redireciona para home
  redirect('/');
}
