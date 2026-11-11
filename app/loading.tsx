'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import ContextualModuleTransition from '@/components/ContextualModuleTransition';

export default function RootLoading() {
  const pathname = usePathname();

  // Nunca exibir a tela de transição do CRM/Radar nas páginas públicas (LP, Cadastro, Conteúdos, Login, Proposta Pública)
  const isPublicPage =
    pathname === '/lp' ||
    pathname === '/cadastro' ||
    pathname === '/login' ||
    pathname === '/termos' ||
    pathname === '/privacidade' ||
    pathname === '/conteudos' ||
    pathname?.startsWith('/conteudos/') ||
    pathname?.startsWith('/proposta/');

  if (isPublicPage) {
    return null;
  }

  // Na raiz ('/'), só exibe transição do Radar se o usuário realmente estiver logado
  if (pathname === '/') {
    const hasUserCookie =
      typeof document !== 'undefined' && document.cookie.includes('sb_user=');
    if (!hasUserCookie) {
      return null;
    }
  }

  return <ContextualModuleTransition module="radar" variant="fullscreen" />;
}
