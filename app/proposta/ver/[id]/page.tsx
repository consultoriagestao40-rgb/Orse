import React from 'react';
import { getDocumentoPropostaById } from './queries';
import { getPropostaCompleta } from '@/app/propostas/actions';
import ViewClient from './ViewClient';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const res: any = await getDocumentoPropostaById(params.id);
  
  if (!res) return { title: 'Proposta Comercial' };

  // Verifica se o link já expirou
  const config = res.configApresentacao as any;
  if (config && config.linkExpiresAt) {
    const expiresAt = new Date(config.linkExpiresAt);
    if (new Date() > expiresAt) {
      return { title: 'ACESSO EXPIRADO - PROPOSTA COMERCIAL' };
    }
  }
  
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

  // Verifica se o link já expirou
  const config = res.configApresentacao as any;
  if (config && config.linkExpiresAt) {
    const expiresAt = new Date(config.linkExpiresAt);
    if (new Date() > expiresAt) {
      const formattedExpiration = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(expiresAt);

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
          {/* Fundo com gradiente/glow premium */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EAB308]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-[#EF4444]/3 rounded-full blur-[100px] pointer-events-none" />

          {/* Card Premium de Expirado */}
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
            {/* Ícone de Alerta com efeito Pulsante */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-2 relative">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-25" />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-black text-white tracking-tight uppercase">
                Link de Acesso Expirado
              </h1>
              <p className="text-[10px] text-slate-450 font-black tracking-widest uppercase">
                VALIDADE DO PRAZO ESGOTADA
              </p>
            </div>

            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Esta proposta comercial não está mais acessível por este link porque seu prazo de validade de <strong className="text-amber-400 font-black">{config.validadeDays} dias</strong> expirou em:
              </p>
              
              <div className="inline-block bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl font-mono text-xs font-black text-amber-500 shadow-inner">
                📅 {formattedExpiration} (Horário de Brasília)
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[11px] text-slate-400 leading-normal font-semibold max-w-sm mx-auto">
                Para negociar ou solicitar uma nova via atualizada com prazo estendido, por favor entre em contato direto com o seu consultor comercial.
              </p>
            </div>

            {/* Rodapé institucional premium */}
            <div className="pt-2 text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span>{res.empresaEmissora?.nomeFantasia || 'ORSE'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Gestão de Propostas</span>
            </div>
          </div>
        </div>
      );
    }
  }

  const fullProposta = await getPropostaCompleta(res.propostaId, undefined, true);

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

  const color = res.tenant?.primaryColor || '#1B4D3E';
  const getThemeStyleHtml = (colorHex: string) => {
    let c = colorHex.replace('#', '').trim();
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

    return `
      :root {
        --primary-color: #${c};
        --primary-color-rgb: ${r}, ${g}, ${b};
        --primary-color-hover: ${hexHover};
        --primary-color-light: ${hexLight};
        --primary-color-dark: ${hexDark};
      }
      /* Override classes Tailwind do verde padrão */
      .bg-\\[\\#1B4D3E\\], .bg-\\[\\#1b4d3e\\] {
        background-color: #${c} !important;
      }
      .hover\\:bg-\\[\\#13382D\\\]:hover, .hover\\:bg-\\[\\#13382d\\]:hover, .hover\\:bg-\\[\\#143d31\\]:hover {
        background-color: ${hexHover} !important;
      }
      .text-\\[\\#1B4D3E\\], .text-\\[\\#1b4d3e\\] {
        color: #${c} !important;
      }
      .border-\\[\\#1B4D3E\\], .border-\\[\\#1b4d3e\\] {
        border-color: #${c} !important;
      }
      .focus\\:border-\\[\\#1B4D3E\\\]:focus, .focus\\:border-\\[\\#1b4d3e\\]:focus {
        border-color: #${c} !important;
      }
      .focus\\:ring-\\[\\#1B4D3E\\\]:focus, .focus\\:ring-\\[\\#1b4d3e\\]:focus {
        --tw-ring-color: #${c} !important;
      }
      .hover\\:text-\\[\\#1B4D3E\\\]:hover, .hover\\:text-\\[\\#1b4d3e\\]:hover {
        color: #${c} !important;
      }
      .hover\\:border-\\[\\#1B4D3E\\\]:hover, .hover\\:border-\\[\\#1b4d3e\\]:hover {
        border-color: #${c} !important;
      }
      .bg-\\[\\#0B2E24\\], .bg-\\[\\#0b2e24\\] {
        background-color: ${hexHover} !important;
      }
      
      /* FPV Specific Green Rows (Lighter & Darker shades) */
      .bg-\\[\\#3b8026\\], .bg-\\[\\#3B8026\\] {
        background-color: ${hexHover} !important;
      }
      .border-\\[\\#2d631d\\], .border-\\[\\#2D631D\\] {
        border-color: ${hexDark} !important;
      }
      .bg-\\[\\#599e41\\], .bg-\\[\\#599E41\\] {
        background-color: #${c} !important;
      }
      .border-\\[\\#488234\\], .border-\\[\\#488234\\] {
        border-color: ${hexHover} !important;
      }
      .bg-\\[\\#8ec277\\], .bg-\\[\\#8EC277\\] {
        background-color: rgba(${r}, ${g}, ${b}, 0.25) !important;
      }
      .border-\\[\\#72ae58\\], .border-\\[\\#72AE58\\] {
        border-color: ${hexHover} !important;
      }
      .bg-\\[\\#cbf5bc\\], .bg-\\[\\#CBF5BC\\] {
        background-color: rgba(${r}, ${g}, ${b}, 0.1) !important;
      }
      .border-\\[\\#9ed38c\\], .border-\\[\\#9ED38C\\] {
        border-color: rgba(${r}, ${g}, ${b}, 0.3) !important;
      }
      .text-\\[\\#275419\\], .text-\\[\\#275419\\] {
        color: ${hexDark} !important;
      }
      .bg-\\[\\#eefce8\\], .bg-\\[\\#EEFCE8\\] {
        background-color: rgba(${r}, ${g}, ${b}, 0.04) !important;
      }
    `;
  };

  const themeStyleHtml = getThemeStyleHtml(color);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeStyleHtml }} />
      <ViewClient doc={serializedDoc} fullProposta={serializedFullProposta} />
    </>
  );
}
