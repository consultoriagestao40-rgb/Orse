'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getDocumentosProposta() {
  try {
    const docs = await prisma.documentoProposta.findMany({
      include: {
        client: true,
        empresaEmissora: true,
        proposta: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return docs.map((d: any) => ({
      id: d.id,
      numeroFPV: d.proposta?.numero,
      cliente: d.client?.nomeFantasia || 'Sem Cliente',
      empresa: d.empresaEmissora?.nomeFantasia,
      valor: d.valorTotal,
      status: d.status,
      data: d.createdAt.toLocaleDateString('pt-BR'),
      versaoFPV: d.proposta?.versoes?.[0]?.versao || 1 // Apenas estimativa visual
    }));
  } catch (error) {
    console.error('Erro ao buscar documentos de proposta:', error);
    return [];
  }
}

export async function getDocumentoPropostaById(id: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id },
      include: {
        client: true,
        empresaEmissora: true,
        proposta: true,
        secoes: {
          orderBy: { ordem: 'asc' }
        }
      }
    });
    return doc;
  } catch (error) {
    console.error('Erro ao buscar documento por ID:', error);
    return null;
  }
}

export async function createDocumentoProposta(propostaId: string, templateId: string, empresaId: string) {
  try {
    // Busca a proposta (FPV) e sua versão mais recente para pegar o valor e o cliente
    const fpv = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { 
        versoes: { orderBy: { versao: 'desc' }, take: 1 },
        client: true 
      }
    });

    if (!fpv) throw new Error('FPV não encontrada');
    if (!fpv.clientId) throw new Error('FPV sem cliente vinculado');

    const valorTotal = fpv.versoes[0]?.precoVenda || 0;

    // Busca o template e suas seções
    const template = await prisma.templatePropostaComercial.findUnique({
      where: { id: templateId },
      include: { secoes: true }
    });

    if (!template) throw new Error('Template não encontrado');

    // Cria o documento e clona as seções do template
    const doc = await prisma.documentoProposta.create({
      data: {
        propostaId,
        clientId: fpv.clientId,
        empresaEmissoraId: empresaId,
        templateOrigemId: template.id,
        valorTotal,
        secoes: {
          create: template.secoes.map((secao: any) => ({
            titulo: secao.titulo,
            texto: secao.texto,
            ordem: secao.ordem
          }))
        }
      }
    });

    revalidatePath('/propostas-comerciais');
    return { success: true, docId: doc.id };
  } catch (error: any) {
    console.error('Erro ao criar documento de proposta:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSecaoDocumento(secaoId: string, texto: string) {
  try {
    await prisma.secaoDocumentoProposta.update({
      where: { id: secaoId },
      data: { texto }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar seção:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDocumentoStatus(id: string, status: string) {
  try {
    await prisma.documentoProposta.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/propostas-comerciais');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar status do documento:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocumentoProposta(id: string) {
  try {
    await prisma.documentoProposta.delete({ where: { id } });
    revalidatePath('/propostas-comerciais');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return { success: false, error: error.message };
  }
}

export async function getTemplatesProposta() {
  try {
    let templates = await prisma.templatePropostaComercial.findMany({
      orderBy: { nome: 'asc' }
    });

    // Seeding automático
    if (templates.length === 0) {
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Simples (Terceirização)',
          secoes: {
            create: [
              { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados...' },
              { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada...' },
              { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal será de [VALOR_TOTAL].' }
            ]
          }
        }
      });
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Completa (Condomínios/Indústria)',
          secoes: {
            create: [
              { ordem: 1, titulo: '1. CARTA DE APRESENTAÇÃO', texto: 'Prezado(a) Síndico(a)/Gestor(a) do [CLIENTE_NOME]...' },
              { ordem: 2, titulo: '2. VALORES', texto: 'Valor: [VALOR_TOTAL].' }
            ]
          }
        }
      });
      templates = await prisma.templatePropostaComercial.findMany({ orderBy: { nome: 'asc' } });
    }

    return templates;
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return [];
  }
}
