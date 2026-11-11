import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartbidhub.com.br';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/lp',
          '/llms.txt',
          '/login',
          '/termos',
          '/privacidade',
          '/icon.svg',
          '/manifest.json',
          '/og-image.jpg',
          '/marketing/',
          '/slides/',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/leads/',
          '/clientes/',
          '/propostas/',
          '/propostas-comerciais/',
          '/contratos/',
          '/ccts/',
          '/escalas/',
          '/atas/',
          '/produtos/',
          '/pic/',
          '/tasks/',
          '/notifications/',
          '/pipeline/',
          '/planejamento/',
          '/prospeccao/',
          '/chat/',
          '/emails/',
          '/entrega/',
          '/epis/',
          '/ativos/',
          '/calendar/',
        ],
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/lp', '/llms.txt', '/termos', '/privacidade'],
        disallow: ['/admin/', '/api/', '/propostas/', '/clientes/', '/contratos/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
