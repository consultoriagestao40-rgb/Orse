import React from 'react';
import { getDocumentoPropostaById } from '../../actions';
import PrintClient from './PrintClient';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);
  
  if (!res) return { title: 'Proposta Comercial não encontrada' };
  
  const cliente = res.client?.nomeFantasia || res.client?.razaoSocial || '';
  
  return {
    title: `PROPOSTA COMERCIAL - ${res.proposta?.numero} - ${cliente}`.toUpperCase()
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

  return <PrintClient doc={res} fullProposta={fullProposta} />;
}
