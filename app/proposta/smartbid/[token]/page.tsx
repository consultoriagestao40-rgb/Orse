import React from 'react';
import { notFound } from 'next/navigation';
import { getSaasPropostaByToken } from '@/app/admin/saas-crm/actions';
import ViewSaasProposal from '@/components/ViewSaasProposal';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const res = await getSaasPropostaByToken(token);

  if (!res.success || !res.proposta) {
    return {
      title: 'Proposta Não Encontrada | SmartBid',
    };
  }

  return {
    title: `Proposta SmartBid • ${res.proposta.empresaNome}`,
    description: `Proposta Comercial de Licenciamento SaaS SmartBid para a empresa ${res.proposta.empresaNome}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SaasPropostaPage({ params }: PageProps) {
  const { token } = await params;
  const res = await getSaasPropostaByToken(token);

  if (!res.success || !res.proposta) {
    notFound();
  }

  return <ViewSaasProposal proposta={res.proposta as any} />;
}
