import React from 'react';
import { getDocumentoPropostaById } from '../../actions';
import { getPropostaCompleta } from '@/app/propostas/actions';
import PrintClient from './PrintClient';
import { Metadata } from 'next';

// Serialização segura que lida com Decimal, BigInt, Date e referências circulares do Prisma
function safeSerialize(obj: any): any {
  try {
    return JSON.parse(JSON.stringify(obj, (_key, value) => {
      if (value === undefined) return null;
      if (typeof value === 'bigint') return value.toString();
      // Prisma Decimal tem método toNumber()
      if (value !== null && typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
      }
      return value;
    }));
  } catch {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
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
  } catch {
    return { title: 'Proposta Comercial' };
  }
}

export default async function PropostaPrintServer(props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const res: any = await getDocumentoPropostaById(params.id);

    if (!res) {
      return (
        <div className="p-10 text-center font-sans">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Proposta não encontrada</h1>
          <p className="text-slate-500">Verifique o ID e tente novamente.</p>
        </div>
      );
    }

    // Busca a proposta completa (isPublic=true para não exigir login)
    let fullProposta: any = null;
    try {
      fullProposta = await getPropostaCompleta(res.propostaId, undefined, true);
    } catch (e) {
      console.error('[print] Erro ao buscar fullProposta:', e);
    }

    // Busca o template de origem para detectar tipo SLIDE_DECK
    let templateOrigem: any = null;
    try {
      if (res.templateOrigemId) {
        const { prisma } = await import('@/lib/prisma');
        templateOrigem = await prisma.templatePropostaComercial.findUnique({
          where: { id: res.templateOrigemId }
        });
      }
    } catch (e) {
      console.error('[print] Erro ao buscar templateOrigem:', e);
    }

    const docWithTemplate = { ...res, templateOrigem };

    // Serialização segura para evitar crash com tipos Prisma (Decimal, BigInt, Date)
    const serializedDoc = safeSerialize(docWithTemplate);
    const serializedFullProposta = safeSerialize(fullProposta);

    if (!serializedDoc) {
      return (
        <div className="p-10 text-center font-sans">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar proposta</h1>
          <p className="text-slate-500">Não foi possível serializar os dados. Tente novamente.</p>
        </div>
      );
    }

    return <PrintClient doc={serializedDoc} fullProposta={serializedFullProposta} />;

  } catch (error: any) {
    console.error('[print] Erro geral na página de impressão:', error);
    return (
      <div className="p-10 text-center font-sans">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar página de impressão</h1>
        <p className="text-slate-500 mb-4">{error?.message || 'Erro desconhecido'}</p>
        <a
          href="/propostas-comerciais"
          className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
        >
          ← Voltar
        </a>
      </div>
    );
  }
}
