'use client';

import React, { useEffect, useState } from 'react';
import DocumentoA4 from '@/components/DocumentoA4';
import PropostaApresentacao from '@/components/PropostaApresentacao';
import PropostaApresentacaoPrint from '@/components/PropostaApresentacaoPrint';

export default function PrintClient({ doc, fullProposta }: { doc: any, fullProposta: any }) {
  const [presentationMode, setPresentationMode] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [printed, setPrinted] = useState(false);

  const isSlide = !!doc.templateOrigem?.nome?.toLowerCase()?.includes('apresenta') || doc.tipo === 'SLIDE_DECK';

  // Merge fullProposta com as seções do documento comercial
  const versao = fullProposta?.availableVersions?.[0];
  const mergedProposta = {
    ...fullProposta,
    tenant: doc.tenant,
    statusAssinatura: doc.statusAssinatura,
    nomeAssinante: doc.nomeAssinante,
    cpfAssinante: doc.cpfAssinante,
    ipAssinante: doc.ipAssinante,
    dataAssinatura: doc.dataAssinatura,
    assinaturaBase64: doc.assinaturaBase64,
    cliente: {
      ...(fullProposta?.cliente || {}),
      ...doc.client,
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

  const handlePrint = () => {
    setPrinted(true);
    window.print();
  };

  // Para A4: auto-print após 1.5s
  useEffect(() => {
    if (!isSlide) {
      const timer = setTimeout(() => window.print(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSlide]);

  // Para slides: countdown de 3s e auto-print
  useEffect(() => {
    if (!isSlide) return;
    if (countdown <= 0) {
      handlePrint();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isSlide, countdown]);

  if (!isSlide) {
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

  // SLIDE DECK: Mostra banner de impressão + conteúdo de print oculto
  return (
    <div className="bg-slate-50 w-full min-h-screen print:bg-white">

      {/* Banner de impressão - visível na tela, oculto no print */}
      <div
        className="print:hidden fixed top-0 left-0 right-0 z-[999999] bg-[#1e4480] text-white shadow-2xl"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </div>
            <div>
              <div className="font-black text-base leading-tight">Proposta em Slide — Pronta para Imprimir</div>
              <div className="text-white/70 text-sm">
                {!printed
                  ? `Iniciando impressão em ${countdown}s... ou clique no botão`
                  : 'Diálogo de impressão aberto. Selecione "Salvar como PDF" no seu navegador.'
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/20"
            >
              ← Voltar
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-white text-[#1e4480] hover:bg-slate-100 rounded-xl text-sm font-black transition-all shadow-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Espaçador para o banner fixo */}
      <div className="print:hidden h-[80px]" />

      {/* Conteúdo de impressão - oculto na tela, visível apenas no print */}
      <PropostaApresentacaoPrint
        proposta={mergedProposta}
        resultado={versao?.resultado}
        empresaEmissora={doc.empresaEmissora}
      />
    </div>
  );
}
