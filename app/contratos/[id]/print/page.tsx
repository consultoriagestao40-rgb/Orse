import React from 'react';
import { getContratoById } from '../../actions';
import PrintClient from './PrintClient';
import { Metadata } from 'next';

const gerarNumeroContrato = (c: any) => {
  if (!c || !c.proposta) return 'S/N';
  const numProp = c.proposta.numero?.toString().padStart(3, '0') || '000';
  const numRev = (c.proposta.versoes?.[0]?.versao || 1).toString().padStart(2, '0');
  const d = c.dataInicio ? new Date(c.dataInicio) : new Date(c.createdAt || Date.now());
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const y = d.getFullYear().toString();
  return \`\${numProp}.\${numRev}.\${m}.\${y}\`;
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const res = await getContratoById(params.id);
  const contrato = res.data;
  
  if (!contrato) return { title: 'Contrato não encontrado' };
  
  const numContrato = gerarNumeroContrato(contrato);
  const emissora = contrato.empresaEmissora?.nomeFantasia || contrato.empresaEmissora?.razaoSocial || '';
  const cliente = contrato.client?.nomeFantasia || contrato.client?.razaoSocial || '';
  
  return {
    title: \`CONTRATO - \${numContrato} - \${emissora} X \${cliente}\`.toUpperCase()
  };
}

export default async function ContratoPrintServer({ params }: { params: { id: string } }) {
  const res = await getContratoById(params.id);
  const contrato = res.data;

  if (!contrato) {
    return <div className="p-10 text-center">Contrato não encontrado.</div>;
  }

  return <PrintClient contrato={contrato} />;
}
