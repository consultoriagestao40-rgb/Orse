import React from 'react';
import { getDocumentoPropostaById } from '@/app/propostas-comerciais/actions';
import { getPropostaCompleta } from '@/app/propostas/actions';
import ViewClient from './ViewClient';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);
  
  if (!res) return { title: 'Proposta Comercial' };
  
  const cliente = res.client?.nomeFantasia || res.client?.razaoSocial || '';
  const numeroPadded = String(res.proposta?.numero || '').padStart(3, '0');
  const versaoNum = res.proposta?.versoes?.[0]?.versao || 1;
  const revisaoPart = `R${String(versaoNum).padStart(2, '0')}`;
  
  return {
    title: `PROPOSTA COMERCIAL - FPV-${numeroPadded}-${revisaoPart} - ${cliente}`.toUpperCase()
  };
}

export default async function PublicPropostaView(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);

  if (!res) {
    return (
      <div className="flex h-screen bg-slate-950 text-slate-400 items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold">Proposta comercial não encontrada ou indisponível.</p>
          <p className="text-sm text-slate-500">Por favor, confirme se o link de acesso está correto.</p>
        </div>
      </div>
    );
  }

  const fullProposta = await getPropostaCompleta(res.propostaId);

  let templateOrigem = null;
  if (res.templateOrigemId) {
    const { prisma } = await import('@/lib/prisma');
    templateOrigem = await prisma.templatePropostaComercial.findUnique({
      where: { id: res.templateOrigemId }
    });
  }

  const docWithTemplate = {
    ...res,
    templateOrigem
  };

  // Serialização limpa em JSON para evitar que campos Date ou classes do Prisma
  // quebrem o Next.js Server Components na passagem de props para o Client Component
  const serializedDoc = JSON.parse(JSON.stringify(docWithTemplate));
  const serializedFullProposta = fullProposta ? JSON.parse(JSON.stringify(fullProposta)) : null;

  return <ViewClient doc={serializedDoc} fullProposta={serializedFullProposta} />;
}
