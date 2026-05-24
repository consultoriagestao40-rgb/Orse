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
import PropostaApresentacaoPrint from '@/components/PropostaApresentacaoPrint';

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
      clausulasA4: doc.secoes?.map((s: any) => ({ titulo: s.titulo, texto: s.texto })) || [],
      ...(doc.configApresentacao ? {
        condicoesCliente: doc.configApresentacao.condicoesCliente,
        condicoesColaboradores: doc.configApresentacao.condicoesColaboradores,
        quadroEfetivoSubtitulo: doc.configApresentacao.quadroEfetivoSubtitulo,
        quadroEfetivoClausula1: doc.configApresentacao.quadroEfetivoClausulas?.[0],
        quadroEfetivoClausula2: doc.configApresentacao.quadroEfetivoClausulas?.[1],
        quadroEfetivoClausula3: doc.configApresentacao.quadroEfetivoClausulas?.[2],
      } : {})
    }
  };

  const isSlide = doc.templateOrigem?.nome?.toLowerCase().includes('apresenta');

  if (isSlide) {
    return (
      <div className="bg-slate-900 w-full min-h-screen text-white font-sans print:bg-white">
        <div className="print:hidden">
          <PropostaApresentacao 
            proposta={mergedProposta} 
            resultado={versao?.resultado} 
            empresaEmissora={doc.empresaEmissora} 
            presentationMode={presentationMode}
            setPresentationMode={setPresentationMode}
          />
        </div>
        <PropostaApresentacaoPrint proposta={mergedProposta} />
        
        <button
          onClick={() => {
            setPresentationMode(false);
            setTimeout(() => window.print(), 500);
          }}
          className="fixed bottom-6 right-6 z-[999999] bg-[#1e4480] hover:bg-[#13382d] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-2 border-white/20 print:hidden"
          title="Imprimir / Salvar PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </button>
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
