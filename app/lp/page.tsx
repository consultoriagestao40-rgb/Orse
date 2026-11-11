import LandingPage from '@/components/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartBid • Software de Montagem de Propostas, Orçamentos e Custos (FPV) para Terceirização e Facilities',
  description: 'Software especializado em montagem de propostas comerciais, cálculo de postos de trabalho, encargos trabalhistas por CCT, benefícios, insumos e margem de lucro para empresas de terceirização de serviços (limpeza, portaria, segurança e manutenção).',
  alternates: {
    canonical: 'https://www.smartbidhub.com.br/lp',
  },
  openGraph: {
    title: 'SmartBid • Software de Propostas, Orçamentos e Custos (FPV) para Terceirização e Facilities',
    description: 'Calcule encargos trabalhistas, benefícios por CCT, insumos e margem de lucro e gere propostas comerciais rastreadas para limpeza, portaria, segurança e manutenção.',
    url: 'https://www.smartbidhub.com.br/lp',
    siteName: 'SmartBid Hub',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SmartBid • Software de Montagem de Propostas e Custos para Terceirização e Facilities',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function LPPage() {
  return <LandingPage />;
}
