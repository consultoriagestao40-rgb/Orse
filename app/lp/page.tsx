import LandingPage from '@/components/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartBid • Inteligência Comercial & Custos para Prestadoras de Serviços',
  description: 'Transforme a sua prestadora de serviços numa máquina de contratos previsíveis: da prospecção de grandes contas à blindagem de margem e reajustes automáticos.',
  alternates: {
    canonical: 'https://smartbidhub.com.br/lp',
  },
  openGraph: {
    title: 'SmartBid • Inteligência Comercial & Custos para Prestadoras de Serviços',
    description: 'Transforme a sua prestadora de serviços numa máquina de contratos previsíveis: da prospecção de grandes contas à blindagem de margem e reajustes automáticos.',
    url: 'https://smartbidhub.com.br/lp',
    siteName: 'SmartBid',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SmartBid • Landing Page Oficial',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function LPPage() {
  return <LandingPage />;
}
