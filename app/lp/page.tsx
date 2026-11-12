import LandingPage from '@/components/LandingPage';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const postSlug = typeof params?.post === 'string' ? params.post : '';
  const style = typeof params?.s === 'string' ? params.s : 'cascade';

  const officialLogoUrl = 'https://www.smartbidhub.com.br/whatsapp-profile-smartbid.jpg?v=2027';

  const canonicalOrShareUrl = postSlug
    ? `https://www.smartbidhub.com.br/lp?post=${encodeURIComponent(postSlug)}&s=${encodeURIComponent(style)}&v=logo`
    : 'https://www.smartbidhub.com.br/lp?v=logo';

  return {
    title: 'SmartBid • Software de Montagem de Propostas, Orçamentos e Custos (FPV) para Terceirização e Facilities',
    description:
      'Software especializado em montagem de propostas comerciais, cálculo de postos de trabalho, encargos trabalhistas por CCT, benefícios, insumos e margem de lucro para empresas de terceirização de serviços (limpeza, portaria, segurança e manutenção).',
    alternates: {
      canonical: 'https://www.smartbidhub.com.br/lp',
    },
    openGraph: {
      title: 'SmartBid • Software de Propostas, Orçamentos e Custos (FPV) para Terceirização e Facilities',
      description:
        'Calcule encargos trabalhistas, benefícios por CCT, insumos e margem de lucro e gere propostas comerciais rastreadas para limpeza, portaria, segurança e manutenção.',
      url: canonicalOrShareUrl,
      siteName: 'SmartBid Hub',
      images: [
        {
          url: officialLogoUrl,
          width: 1024,
          height: 1024,
          alt: 'SmartBid Hub Oficial • Software de Propostas e Custos para Terceirização e Facilities',
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SmartBid • Software de Propostas, Orçamentos e Custos (FPV) para Terceirização e Facilities',
      description:
        'Transforme a sua prestadora de serviços numa máquina de contratos previsíveis: da prospecção de decisores à blindagem de margem.',
      images: [officialLogoUrl],
    },
  };
}

export default function LPPage() {
  return <LandingPage />;
}
