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
  const useCanva = isSlide && !!doc.configApresentacao?.useCanva && !!doc.configApresentacao?.canvaEmbedUrl;

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
      clausulasA4: doc.tipo === 'SLIDE_DECK' 
        ? (doc.configApresentacao?.clausulasA4 || [])
        : (doc.secoes?.map((s: any) => ({ titulo: s.titulo, texto: s.texto })) || []),
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
    if (!isSlide || useCanva) return;
    if (countdown <= 0) {
      handlePrint();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [isSlide, countdown, useCanva]);

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

  // RENDER DO CANVA EMBEDDED PRINT PREVIEW
  if (useCanva) {
    return (
      <div className="bg-slate-50 w-full min-h-screen text-slate-800 font-sans print:bg-white select-none">
        
        {/* Banner de Impressão do Canva - Oculto na Impressão */}
        <div className="print:hidden fixed top-0 left-0 right-0 z-[999999] bg-[#1b4d3e] text-white shadow-2xl">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div>
                <div className="font-black text-sm uppercase tracking-wider leading-tight">Apresentação Canva Premium</div>
                <div className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-0.5">Slides carregados diretamente do Canva com alta qualidade.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/15 uppercase tracking-wider"
              >
                ← Voltar
              </button>
              <a
                href={doc.configApresentacao.canvaEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-[#10b981] hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-700/20 flex items-center gap-2 uppercase tracking-widest"
              >
                Abrir no Canva ↗
              </a>
            </div>
          </div>
        </div>

        {/* Espaçador para o banner fixo */}
        <div className="print:hidden h-[80px]" />

        {/* Corpo explicativo e Iframe no Navegador */}
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 print:p-0 print:m-0 print:space-y-0">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md text-left print:hidden space-y-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              📥 Instruções para Exportar em Alta Qualidade (PDF)
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed font-semibold space-y-3">
              <p>Esta proposta comercial está utilizando uma **Apresentação Canva Premium integrada** vinculada à conta Canva <strong className="text-indigo-600">cristiano@grupojvsserv.com.br</strong> para garantir o mais alto nível estético e de usabilidade.</p>
              <p className="text-slate-500">Para salvar o arquivo como um **PDF de alta fidelidade** com fontes e imagens vetorizadas originais (sem as limitações de margem ou quebra de página do navegador):</p>
              
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2">
                <ol className="list-decimal pl-5 space-y-2 text-slate-600 font-bold uppercase tracking-wide text-[9px]">
                  <li>Clique no botão <strong className="text-indigo-600">"Abrir no Canva ↗"</strong> acima para acessar a apresentação;</li>
                  <li>No menu superior do Canva, clique no botão <strong className="text-slate-800">"Compartilhar"</strong> ou no ícone de download;</li>
                  <li>Selecione a opção <strong className="text-slate-800">"Baixar"</strong>;</li>
                  <li>Escolha o formato <strong className="text-indigo-600">"PDF Padrão"</strong> ou <strong className="text-indigo-600">"PDF para Impressão"</strong>;</li>
                  <li>Clique em <strong>Baixar</strong> para obter a versão final em alta definição!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Pré-visualização Interativa do Iframe */}
          <div className="w-full aspect-[16/9] bg-slate-950 overflow-hidden relative rounded-3xl shadow-2xl border border-slate-200 shadow-indigo-950/5 print:border-none print:shadow-none print:rounded-none">
            <iframe
              src={doc.configApresentacao.canvaEmbedUrl}
              loading="lazy"
              className="absolute inset-0 w-full h-full border-none p-0 m-0"
              allowFullScreen
              allow="fullscreen"
            />
          </div>

          {/* FICHA TÉCNICA, ESCOPO E TABELAS FINANCEIRAS DA FPV (DOCUMENTO A4 DINÂMICO PARA PRINT/PDF) */}
          <div className="border-t border-slate-200 pt-8 print:border-none print:pt-0">
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-lg shadow-slate-100/40 print:shadow-none print:border-none print:p-0">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2">
                📄 Ficha Técnica, Escopo Comercial e Aceite (Dados FPV)
              </h3>
              <DocumentoA4 
                proposta={mergedProposta} 
                resultado={versao?.resultado} 
                empresaEmissora={doc.empresaEmissora} 
              />
            </div>
          </div>
        </div>
      </div>
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
