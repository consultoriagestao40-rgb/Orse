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

  return <ViewClient doc={serializedDoc} fullProposta={serializedFullProposta} />;
}
