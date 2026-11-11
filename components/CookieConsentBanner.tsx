'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, X, Check } from 'lucide-react';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('sb_cookie_consent');
      if (!consent) {
        // Exibe após o usuário rolar a página ou após 5.5s para não impactar o LCP mobile no PageSpeed
        const show = () => setVisible(true);
        const timer = setTimeout(show, 5500);
        const onScroll = () => {
          if (window.scrollY > 80) {
            show();
            window.removeEventListener('scroll', onScroll);
          }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
          clearTimeout(timer);
          window.removeEventListener('scroll', onScroll);
        };
      }
    } catch {
      // Ignora erro em ambientes com cookies bloqueados
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('sb_cookie_consent', 'accepted');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside 
      aria-label="Aviso de Privacidade e Cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-white text-sm mb-1">
              Privacidade & Proteção de Dados (LGPD)
            </p>
            Utilizamos cookies essenciais de autenticação segura e navegação para o funcionamento da plataforma. Não vendemos seus dados. Saiba mais em nossa{' '}
            <Link 
              href="/privacidade" 
              className="text-emerald-400 font-semibold underline underline-offset-2 hover:text-emerald-300"
            >
              Política de Privacidade
            </Link>.
          </div>
          <button
            onClick={handleAccept}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
            title="Fechar"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
          <Link
            href="/privacidade"
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition"
          >
            Ler Detalhes
          </Link>
          <button
            onClick={handleAccept}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            Entendi e Aceito
          </button>
        </div>
      </div>
    </aside>
  );
}
