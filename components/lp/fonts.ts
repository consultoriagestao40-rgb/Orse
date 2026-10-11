import { Inter_Tight } from 'next/font/google';

// Fonte única da LP: sans-serif firme, usada em negrito nos títulos
export const textFont = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-lp-text',
});

// Mantido por compatibilidade com o import existente (mesma fonte)
export const displayFont = textFont;
