import React from 'react';
import { getDocumentoPropostaById } from '../../actions';
import PrintClient from './PrintClient';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);
  
  if (!res) return { title: 'Proposta Comercial não encontrada' };
  
  const cliente = res.client?.nomeFantasia || res.client?.razaoSocial || '';
  const numeroPadded = String(res.proposta?.numero || '').padStart(3, '0');
  const versaoNum = res.proposta?.versoes?.[0]?.versao || 1;
  const revisaoPart = `R${String(versaoNum).padStart(2, '0')}`;
  
  return {
    title: `PROPOSTA COMERCIAL - FPV-${numeroPadded}-${revisaoPart} - ${cliente}`.toUpperCase()
  };
}

import { getPropostaCompleta } from '@/app/propostas/actions';

export default async function PropostaPrintServer(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);

  if (!res) {
    return <div className="p-10 text-center">Proposta não encontrada.</div>;
  }

  const fullProposta = await getPropostaCompleta(res.propostaId);

  // Precisamos do nome do template para o PrintClient saber se é slide ou não
  let templateOrigem = null;
  if (res.templateOrigemId) {
    const { prisma } = await import('@/lib/prisma');
    templateOrigem = await prisma.templatePropostaComercial.findUnique({
      where: { id: res.templateOrigemId }
    });
  }

  // Anexar o templateOrigem mockado no doc para manter a compatibilidade
  const docWithTemplate = {
    ...res,
    templateOrigem
  };

  // Serialização limpa em JSON para evitar que campos Date ou classes do Prisma
  // quebrem o Next.js Server Components na passagem de props para o Client Component
  const serializedDoc = JSON.parse(JSON.stringify(docWithTemplate));
  const serializedFullProposta = fullProposta ? JSON.parse(JSON.stringify(fullProposta)) : null;

  return <PrintClient doc={serializedDoc} fullProposta={serializedFullProposta} />;
}
