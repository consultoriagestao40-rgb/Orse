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
      cliente: doc.client?.nomeFantasia || fullProposta?.cliente?.cliente || '',
      clienteNome: doc.client?.nomeFantasia || fullProposta?.cliente?.clienteNome || '',
      nomeFantasia: doc.client?.nomeFantasia || fullProposta?.cliente?.nomeFantasia || '',
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

  const handleGenerateBoth = () => {
    // 1. Abre a apresentação do Canva em nova aba para exportação em alta qualidade
    window.open(doc.configApresentacao.canvaEmbedUrl, '_blank');
    
    // 2. Dispara a impressão do Contrato A4 na aba atual
    setTimeout(() => {
      handlePrint();
    }, 500);
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

  // Dynamic brand color theme overrides for print client view
  useEffect(() => {
    const color = doc.tenant?.primaryColor || '#1B4D3E';
    
    const getThemeColors = (hex: string) => {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      if (c.length !== 6) {
        c = '1B4D3E';
      }

      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);

      const darken = (val: number, amt: number) => Math.max(0, val - amt);
      const rHover = darken(r, 20);
      const gHover = darken(g, 20);
      const bHover = darken(b, 20);
      const hexHover = '#' + ((1 << 24) + (rHover << 16) + (gHover << 8) + bHover).toString(16).slice(1);

      const hexLight = `rgba(${r}, ${g}, ${b}, 0.08)`;
      
      const rDark = darken(r, 45);
      const gDark = darken(g, 45);
      const bDark = darken(b, 45);
      const hexDark = '#' + ((1 << 24) + (rDark << 16) + (gDark << 8) + bDark).toString(16).slice(1);

      return {
        primary: '#' + c,
        rgb: `${r}, ${g}, ${b}`,
        hover: hexHover,
        light: hexLight,
        dark: hexDark,
      };
    };

    const theme = getThemeColors(color);
    
    let style = document.getElementById('dynamic-print-theme-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-print-theme-style';
      document.head.appendChild(style);
    }
    style.innerHTML = `
      :root {
        --primary-color: ${theme.primary};
        --primary-color-rgb: ${theme.rgb};
        --primary-color-hover: ${theme.hover};
        --primary-color-light: ${theme.light};
        --primary-color-dark: ${theme.dark};
      }
      /* Override classes Tailwind do verde padrão */
      .bg-\\[\\#1B4D3E\\], .bg-\\[\\#1b4d3e\\] {
        background-color: var(--primary-color) !important;
      }
      .hover\\:bg-\\[\\#13382D\\]:hover, .hover\\:bg-\\[\\#13382d\\]:hover, .hover\\:bg-\\[\\#143d31\\]:hover {
        background-color: var(--primary-color-hover) !important;
      }
      .text-\\[\\#1B4D3E\\], .text-\\[\\#1b4d3e\\] {
        color: var(--primary-color) !important;
      }
      .border-\\[\\#1B4D3E\\], .border-\\[\\#1b4d3e\\] {
        border-color: var(--primary-color) !important;
      }
      .focus\\:border-\\[\\#1B4D3E\\]:focus, .focus\\:border-\\[\\#1b4d3e\\]:focus {
        border-color: var(--primary-color) !important;
      }
      .focus\\:ring-\\[\\#1B4D3E\\]:focus, .focus\\:ring-\\[\\#1b4d3e\\]:focus {
        --tw-ring-color: var(--primary-color) !important;
      }
      .hover\\:text-\\[\\#1B4D3E\\]:hover, .hover\\:text-\\[\\#1b4d3e\\]:hover {
        color: var(--primary-color) !important;
      }
      .hover\\:border-\\[\\#1B4D3E\\]:hover, .hover\\:border-\\[\\#1b4d3e\\]:hover {
        border-color: var(--primary-color) !important;
      }
      
      /* FPV Specific Green Rows (Lighter & Darker shades) */
      .bg-\\[\\#3b8026\\], .bg-\\[\\#3B8026\\] {
        background-color: var(--primary-color-hover) !important;
      }
      .border-\\[\\#2d631d\\], .border-\\[\\#2D631D\\] {
        border-color: var(--primary-color-dark) !important;
      }
      .bg-\\[\\#599e41\\], .bg-\\[\\#599E41\\] {
        background-color: var(--primary-color) !important;
      }
      .border-\\[\\#488234\\], .border-\\[\\#488234\\] {
        border-color: var(--primary-color-hover) !important;
      }
      .bg-\\[\\#8ec277\\], .bg-\\[\\#8EC277\\] {
        background-color: rgba(${theme.rgb}, 0.25) !important;
      }
      
      /* Standard Emerald Overrides */
      .text-emerald-400 { color: var(--primary-color) !important; }
      .text-emerald-500 { color: var(--primary-color) !important; }
      .text-emerald-600 { color: var(--primary-color-hover) !important; }
      .text-emerald-700 { color: var(--primary-color-hover) !important; }
      .text-emerald-750 { color: var(--primary-color-hover) !important; }
      .text-emerald-800 { color: var(--primary-color-dark) !important; }
      .text-emerald-900 { color: var(--primary-color-dark) !important; }
      
      .bg-emerald-50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-50\\/30 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100\\/50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-200 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-400 { background-color: var(--primary-color) !important; }
      .bg-emerald-500 { background-color: var(--primary-color) !important; }
      .bg-emerald-600 { background-color: var(--primary-color-hover) !important; }
      .bg-emerald-800 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-900 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-950 { background-color: var(--primary-color-dark) !important; }
      
      .border-emerald-100 { border-color: var(--primary-color-light) !important; }
      .border-emerald-200 { border-color: var(--primary-color-light) !important; }
      .border-emerald-300 { border-color: var(--primary-color-light) !important; }
      .border-emerald-400 { border-color: var(--primary-color) !important; }
      .border-emerald-500 { border-color: var(--primary-color) !important; }
      .border-emerald-600 { border-color: var(--primary-color-hover) !important; }
    `;
    document.head.appendChild(style);
  }, [doc.tenant?.primaryColor]);

  if (!isSlide) {
    return (
      <div className="bg-slate-200 min-h-screen py-8 flex flex-col items-center print:bg-white print:py-0 w-full animate-fadeIn">
        {/* Controle superior (Back & Print) - Oculto na Impressão */}
        <div className="w-full max-w-[210mm] px-4 mb-4 flex justify-between items-center no-print">
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-white rounded-lg shadow text-sm font-bold text-slate-600 hover:bg-slate-50 shrink-0 cursor-pointer">
            ← Voltar
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-[#1B4D3E] hover:bg-[#143d31] rounded-lg shadow text-sm font-black text-white cursor-pointer transition-all">
            🖨️ Imprimir PDF
          </button>
        </div>

        <div className="w-[210mm] max-w-full bg-white shadow-2xl p-0 print:shadow-none print:w-full">
          <DocumentoA4
            proposta={mergedProposta}
            resultado={versao?.resultado}
            empresaEmissora={doc.empresaEmissora}
            isPublicView={true}
          />
        </div>
      </div>
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
                <div className="font-black text-sm uppercase tracking-wider leading-tight">Central de Exportação de PDFs</div>
                <div className="text-white/70 text-[10px] uppercase font-bold tracking-widest mt-0.5">Sua proposta gerou dois documentos independentes de alta qualidade.</div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleGenerateBoth}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:opacity-90 rounded-xl text-xs font-black transition-all shadow-md uppercase tracking-wider text-white cursor-pointer"
              >
                🚀 Gerar Ambos os PDFs
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/15 uppercase tracking-wider"
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>

        {/* Espaçador para o banner fixo */}
        <div className="print:hidden h-[80px]" />

        {/* Central de Documentos */}
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 print:p-0 print:m-0 print:space-y-0">

          {/* Card Premium de Geração Unificada */}
          <div className="print:hidden bg-gradient-to-br from-slate-900 via-[#132c25] to-[#0d1f1a] text-white rounded-3xl p-8 shadow-2xl border border-emerald-500/20 relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                ⚡ Geração Inteligente de Proposta
              </div>
              
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-wide leading-tight">
                Exportar Proposta Comercial Completa
              </h3>
              
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-lg mx-auto">
                Para garantir a máxima qualidade dos slides widescreen e a precisão das tabelas do seu contrato, nosso sistema inteligente separa a proposta em **dois arquivos especializados**.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-3 max-w-xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/25 flex items-center justify-center shrink-0 border border-indigo-500/30 text-indigo-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                      <line x1="7" y1="2" x2="7" y2="22"></line>
                      <line x1="17" y1="2" x2="17" y2="22"></line>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wider text-indigo-300">1. Apresentação Canva</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Slides Widescreen do Canva</div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/25 flex items-center justify-center shrink-0 border border-emerald-500/30 text-emerald-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-300">2. Contrato A4 Comercial</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Ficha FPV, Equipe & Valores</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex flex-col items-center justify-center gap-3">
                <button
                  onClick={handleGenerateBoth}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-[#10b981] to-emerald-600 hover:from-indigo-600 hover:via-emerald-500 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer flex items-center gap-2 border border-white/10"
                >
                  🚀 Gerar Ambos os PDFs de Uma Vez
                </button>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  * Abre os slides no Canva e aciona a impressão do contrato comercial em formato A4.
                </span>
              </div>
            </div>
          </div>
          
          {/* Duas colunas explicativas de download */}
          <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* DOCUMENTO 1: APRESENTAÇÃO CANVA */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col justify-between text-left space-y-4 hover:border-indigo-500/30 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">1. Lâminas de Apresentação</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">PDF institucional de slides widescreen em altíssima definição vetorial.</p>
                </div>
                <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-medium leading-relaxed">
                  <p>Para obter os slides originais do Canva em perfeita fidelidade:</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-500 font-bold uppercase tracking-wide text-[8.5px]">
                    <li>Clique no botão abaixo para abrir a apresentação no Canva;</li>
                    <li>No menu do Canva, clique em <strong className="text-slate-700">"Compartilhar"</strong>;</li>
                    <li>Selecione <strong className="text-slate-700">"Baixar"</strong> e escolha o formato <strong className="text-indigo-600">"PDF Padrão"</strong>;</li>
                    <li>Salve a apresentação final na sua máquina.</li>
                  </ol>
                </div>
              </div>
              <a
                href={doc.configApresentacao.canvaEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-3 bg-[#1e4480] hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
              >
                Abrir Apresentação no Canva ↗
              </a>
            </div>

            {/* DOCUMENTO 2: CONTRATO COMERCIAL A4 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col justify-between text-left space-y-4 hover:border-emerald-500/30 transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-650 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">2. Contrato A4 & Ficha FPV</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">PDF comercial contendo os escopos de serviços, equipes e investimento.</p>
                </div>
                <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100 font-medium leading-relaxed">
                  <p>Para gerar o PDF oficial das tabelas de custos e aceite comercial:</p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-500 font-bold uppercase tracking-wide text-[8.5px]">
                    <li>Clique no botão abaixo para abrir a janela de impressão;</li>
                    <li>Escolha a opção de destino como <strong className="text-emerald-700">"Salvar como PDF"</strong>;</li>
                    <li>Marque a caixa <strong className="text-emerald-700">"Gráficos de plano de fundo"</strong>;</li>
                    <li>Salve o contrato comercial em formato A4.</li>
                  </ol>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-[#10b981] hover:bg-emerald-600 text-white rounded-2xl text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 cursor-pointer"
              >
                Imprimir Contrato Comercial A4 📄
              </button>
            </div>

          </div>

          {/* Pré-visualização Interativa do Iframe - Oculta na Impressão */}
          <div className="print:hidden space-y-3 text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              👁️ Visualização Rápida da Apresentação
            </h4>
            <div className="w-full aspect-[16/9] bg-slate-950 overflow-hidden relative rounded-3xl shadow-lg border border-slate-200">
              <iframe
                src={doc.configApresentacao.canvaEmbedUrl}
                loading="lazy"
                className="absolute inset-0 w-full h-full border-none p-0 m-0"
                allowFullScreen
                allow="fullscreen"
              />
            </div>
          </div>

          {/* FICHA TÉCNICA, ESCOPO E TABELAS FINANCEIRAS DA FPV (DOCUMENTO A4 DINÂMICO PARA PRINT/PDF) */}
          <div className="pt-4 print:pt-0">
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-lg shadow-slate-100/40 print:shadow-none print:border-none print:p-0 print:bg-white">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2">
                📄 Visualização do Contrato Comercial A4
              </h3>
              <DocumentoA4 
                proposta={mergedProposta} 
                resultado={versao?.resultado} 
                empresaEmissora={doc.empresaEmissora} 
                isPublicView={true}
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
