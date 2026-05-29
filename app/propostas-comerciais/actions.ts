'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getDocumentosProposta() {
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    const docs = await prisma.documentoProposta.findMany({
      where: whereClause,
      include: {
        client: true,
        empresaEmissora: true,
        proposta: {
          include: {
            user: true,
            versoes: {}
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return docs.map((d: any) => {
      const sortedVersoes = [...(d.proposta?.versoes || [])].sort((a: any, b: any) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      return {
        id: d.id,
        numeroFPV: d.proposta?.numero,
        cliente: d.client?.nomeFantasia || 'Sem Cliente',
        empresa: d.empresaEmissora?.nomeFantasia,
        valor: d.valorTotal,
        status: d.status,
        data: d.createdAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        versaoFPV: lastVersao?.versao || 1,
        usuario: d.proposta?.user?.nome || 'Sistema',
        avatarUrl: d.proposta?.user?.avatarUrl || null
      };
    });
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
        proposta: {
          include: {
            versoes: {
              include: {
                items: true
              }
            }
          }
        },
        secoes: {
          orderBy: { ordem: 'asc' }
        }
      }
    });
    if (doc && doc.proposta && doc.proposta.versoes) {
      const sortedVersoes = [...doc.proposta.versoes].sort((a: any, b: any) => b.versao - a.versao);
      doc.proposta.versoes = sortedVersoes;
    }
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
        versoes: {},
        client: true 
      }
    });

    if (!fpv) throw new Error('FPV não encontrada');
    if (!fpv.clientId) throw new Error('FPV sem cliente vinculado');

    const sortedVersoes = [...fpv.versoes].sort((a: any, b: any) => b.versao - a.versao);
    const valorTotal = sortedVersoes[0]?.precoVenda || 0;

    // Busca o template e suas seções
    const template = await prisma.templatePropostaComercial.findUnique({
      where: { id: templateId },
      include: { secoes: true }
    });

    if (!template) throw new Error('Template não encontrado');

    const user = await getLoggedUser();
    // Cria o documento e clona as seções do template
    const doc = await prisma.documentoProposta.create({
      data: {
        propostaId,
        clientId: fpv.clientId,
        empresaEmissoraId: empresaId,
        templateOrigemId: template.id,
        tipo: template.tipo || 'A4',
        valorTotal,
        tenantId: user?.tenantId || null,
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

export async function updateSecoesDocumento(documentoId: string, secoes: { id?: string; titulo: string; texto: string; ordem: number }[]) {
  try {
    // Para simplificar: apaga todas as seções e recria na ordem correta
    await prisma.secaoDocumentoProposta.deleteMany({ where: { documentoId } });
    
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        secoes: {
          create: secoes.map(s => ({
            titulo: s.titulo,
            texto: s.texto,
            ordem: s.ordem
          }))
        }
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar seções:', error);
    return { success: false, error: error.message };
  }
}

export async function updateConfigApresentacao(id: string, config: any) {
  try {
    await prisma.documentoProposta.update({
      where: { id },
      data: { configApresentacao: config }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar config apresentação:', error);
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
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    let templates = await prisma.templatePropostaComercial.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
      include: { secoes: { orderBy: { ordem: 'asc' } } }
    });

    // Seeding automático
    if (templates.length === 0 && user?.tenantId) {
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Simples (Terceirização)',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados...\n\n[ITENS]' },
              { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada...' },
              { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal será de [VALOR_TOTAL].\n\n[TABELA]\n\n[TERMO_ACEITE]' }
            ]
          }
        }
      });
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Completa (Condomínios/Indústria)',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: '1. CARTA DE APRESENTAÇÃO', texto: 'Prezado(a) Síndico(a)/Gestor(a) do [CLIENTE_NOME]...' },
              { ordem: 2, titulo: '2. VALORES', texto: 'Valor: [VALOR_TOTAL].' }
            ]
          }
        }
      });
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Apresentação (Slide Deck)',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: 'Instruções', texto: 'Este template não usa estas seções de texto. Ele renderiza os slides fixos da FPV com as imagens e valores em tela cheia.' }
            ]
          }
        }
      });
      templates = await prisma.templatePropostaComercial.findMany({
        where: whereClause,
        orderBy: { nome: 'asc' },
        include: { secoes: { orderBy: { ordem: 'asc' } } }
      });
    }

    return templates;
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return [];
  }
}

export async function getTemplatePropostaById(id: string) {
  try {
    const t = await prisma.templatePropostaComercial.findUnique({
      where: { id },
      include: { secoes: { orderBy: { ordem: 'asc' } } }
    });
    return t;
  } catch (error) {
    console.error('Erro ao buscar template por id:', error);
    return null;
  }
}

export async function createTemplateProposta(nome: string, secoes: { titulo: string; texto: string; ordem: number }[]) {
  const user = await getLoggedUser();
  try {
    const t = await prisma.templatePropostaComercial.create({
      data: {
        nome,
        tenantId: user?.tenantId || null,
        secoes: {
          create: secoes.map(s => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
        }
      },
      include: { secoes: true }
    });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true, data: t };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplateProposta(id: string, nome: string, secoes: { titulo: string; texto: string; ordem: number }[]) {
  try {
    // Apagar seções antigas e recriar
    await prisma.secaoTemplateProposta.deleteMany({ where: { templateId: id } });
    await prisma.templatePropostaComercial.update({
      where: { id },
      data: {
        nome,
        secoes: {
          create: secoes.map(s => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
        }
      }
    });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplateProposta(id: string) {
  try {
    await prisma.templatePropostaComercial.delete({ where: { id } });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
