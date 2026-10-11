import { Instrument_Serif, Inter_Tight } from 'next/font/google';

// Fonte editorial para títulos (dá personalidade e foge do visual "template")
export const displayFont = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-lp-display',
});

// Fonte de texto com desenho mais firme que a padrão
export const textFont = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-lp-text',
});
