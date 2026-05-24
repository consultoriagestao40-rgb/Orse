'use client';

import React, { useEffect } from 'react';

const replaceTags = (text: string, doc: any) => {
  if (!text) return '';
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
  
  let replaced = text;
  replaced = replaced.replace(/\[CLIENTE_NOME\]/g, doc.client?.nomeFantasia || doc.client?.razaoSocial || '');
  replaced = replaced.replace(/\[VALOR_TOTAL\]/g, fmt(doc.valorTotal));
  return replaced;
};

import DocumentoA4 from '@/components/DocumentoA4';
import PropostaApresentacao from '@/components/PropostaApresentacao';

export default function PrintClient({ doc, fullProposta }: { doc: any, fullProposta: any }) {
  const [presentationMode, setPresentationMode] = React.useState(true);
  
  useEffect(() => {
    // Timeout para garantir que todas as fontes e imagens carregaram
    // Somente imprime automático se for A4, apresentação é pra apresentar na tela primeiro.
    const isSlide = doc.templateOrigem?.nome?.toLowerCase().includes('apresenta');
    if (!isSlide) {
       const timer = setTimeout(() => {
         window.print();
       }, 1500);
       return () => clearTimeout(timer);
    }
  }, [doc.templateOrigem?.nome]);

  // Merge fullProposta com as seções do documento comercial e valor final.
  // Isso garante que os metadados (como nome do vendedor, condições, itens) sejam mantidos.
  const versao = fullProposta?.availableVersions?.[0];
  const mergedProposta = {
    ...fullProposta,
    cliente: {
      ...(fullProposta?.cliente || {}),
      clausulasA4: doc.secoes?.map((s: any) => ({ titulo: s.titulo, texto: s.texto })) || []
    }
  };

  const isSlide = doc.templateOrigem?.nome?.toLowerCase().includes('apresenta');

  if (isSlide) {
    return (
      <div className="bg-slate-900 min-h-screen text-white font-sans overflow-hidden">
        <PropostaApresentacao 
          proposta={mergedProposta} 
          resultado={versao?.resultado} 
          empresaEmissora={doc.empresaEmissora} 
          presentationMode={presentationMode}
          setPresentationMode={setPresentationMode}
        />
      </div>
    );
  }

  return (
    <>
      <DocumentoA4 
        proposta={mergedProposta} 
        resultado={versao?.resultado} 
        empresaEmissora={doc.empresaEmissora} 
      />
    </>
  );
}
