import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get('sb_session')?.value;
    if (sessionEmail && sessionEmail.includes('@')) {
      const emailNormal = sessionEmail.toLowerCase().trim();
      const user = await prisma.user.findFirst({
        where: { email: emailNormal },
        include: { tenant: true }
      });
      if (user) return user;
    }

    const sbUser = cookieStore.get('sb_user')?.value;
    if (sbUser) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sbUser));
        if (parsed?.email) {
          const user = await prisma.user.findFirst({
            where: { email: parsed.email.toLowerCase().trim() },
            include: { tenant: true }
          });
          if (user) return user;
        }
      } catch {}
    }
    return null;
  } catch (err) {
    console.error('Erro ao obter usuário da sessão:', err);
    return null;
  }
}
