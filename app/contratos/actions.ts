'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
export async function getEmpresasEmissoras() {
  try {
    const data = await prisma.empresaEmissora.findMany();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPropostasDisponiveis() {
  try {
    const data = await prisma.proposta.findMany({
      where: { contrato: null },
      include: { client: true, versoes: { orderBy: { versao: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
// ---------------------------------------------------------
// TEMPLATES DE CONTRATO
// ---------------------------------------------------------
export async function getTemplates() {
  try {
    const templates = await prisma.templateContrato.findMany({
      include: { clausulas: { orderBy: { ordem: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTemplate(nome: string, clausulas: { titulo: string; texto: string; ordem: number }[]) {
  try {
    const res = await prisma.templateContrato.create({
      data: {
        nome,
        clausulas: {
          create: clausulas.map(c => ({
            titulo: c.titulo,
            texto: c.texto,
            ordem: c.ordem
          }))
        }
      }
    });
    revalidatePath('/contratos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplate(id: string, nome: string, clausulas: { id?: string; titulo: string; texto: string; ordem: number }[]) {
  try {
    await prisma.clausulaTemplate.deleteMany({ where: { templateId: id } });
    const res = await prisma.templateContrato.update({
      where: { id },
      data: {
        nome,
        clausulas: {
          create: clausulas.map(c => ({
            titulo: c.titulo,
            texto: c.texto,
            ordem: c.ordem
          }))
        }
      }
    });
    revalidatePath('/contratos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplate(id: string) {
  try {
    await prisma.templateContrato.delete({ where: { id } });
    revalidatePath('/contratos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ---------------------------------------------------------
// CONTRATOS
// ---------------------------------------------------------
export async function getContratos() {
  try {
    const contratos = await prisma.contrato.findMany({
      include: {
        client: true,
        empresaEmissora: true,
        proposta: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: contratos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContratoById(id: string) {
  try {
    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        client: true,
        empresaEmissora: true,
        proposta: {
          include: {
            versoes: {
              orderBy: { versao: 'desc' },
              take: 1,
              include: { items: true }
            }
          }
        },
        clausulas: { orderBy: { ordem: 'asc' } }
      }
    });
    return { success: true, data: contrato };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContratoFromFPV(propostaId: string, empresaEmissoraId: string, templateId: string, valorMensal: number) {
  try {
    // Verifica se já existe
    const exists = await prisma.contrato.findUnique({ where: { propostaId } });
    if (exists) throw new Error('Já existe um contrato gerado para esta proposta.');

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { 
        client: true,
        versoes: {
          orderBy: { versao: 'desc' },
          take: 1,
          include: { items: true }
        }
      }
    });
    if (!proposta || !proposta.clientId) throw new Error('Proposta ou Cliente não encontrado');

    const empresa = await prisma.empresaEmissora.findUnique({ where: { id: empresaEmissoraId } });
    if (!empresa) throw new Error('Empresa Emissora não encontrada');

    const template = await prisma.templateContrato.findUnique({
      where: { id: templateId },
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });
    if (!template) throw new Error('Template não encontrado');

    const vigenciaMeses = 12;
    const valorTotal = valorMensal * vigenciaMeses;

    const fmtMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    let tableItens = '';
    if (proposta.versoes?.[0]?.items) {
      tableItens = proposta.versoes[0].items.map(i => `${i.quantidade}x ${i.nomeCargo} (${i.escala})`).join('\n');
    }

    const numFormatted = proposta.numero.toString().padStart(3, '0');
    const versaoFormatted = (proposta.versoes?.[0]?.versao || 1).toString().padStart(2, '0');
    const tagNumFpv = `FPV-${numFormatted}-REV-${versaoFormatted}`;

    const replaceTags = (text: string) => {
      let t = text || '';
      t = t.replace(/\[RAZAO_SOCIAL_CLIENTE\]/g, proposta.client?.razaoSocial || proposta.client?.nomeFantasia || '');
      t = t.replace(/\[CNPJ_CLIENTE\]/g, proposta.client?.cnpj || '');
      t = t.replace(/\[ENDERECO_CLIENTE\]/g, proposta.client?.endereco || '');
      t = t.replace(/\[RAZAO_SOCIAL_EMISSORA\]/g, empresa.razaoSocial || empresa.nomeFantasia || '');
      t = t.replace(/\[CNPJ_EMISSORA\]/g, empresa.cnpj || '');
      t = t.replace(/\[ENDERECO_EMISSORA\]/g, empresa.endereco || '');
      t = t.replace(/\[CIDADE_EMISSORA\]/g, 'Curitiba/PR'); 
      t = t.replace(/\[DATA_ATUAL\]/g, dateStr);
      t = t.replace(/\[NUMERO_FPV\]/g, tagNumFpv);
      t = t.replace(/\[TABELA_ITENS_FPV\]/g, tableItens);
      t = t.replace(/\[VALOR_MENSAL\]/g, fmtMoeda(valorMensal));
      t = t.replace(/\[VIGENCIA_MESES\]/g, vigenciaMeses.toString());
      t = t.replace(/\[DATA_INICIO\]/g, '-');
      return t;
    };

    const contrato = await prisma.contrato.create({
      data: {
        propostaId,
        clientId: proposta.clientId,
        empresaEmissoraId,
        templateOrigemId: template.id,
        status: 'Pendente de Assinatura',
        vigenciaMeses,
        valorMensal,
        valorTotal,
        clausulas: {
          create: template.clausulas.map(c => ({
            titulo: c.titulo,
            texto: replaceTags(c.texto),
            ordem: c.ordem
          }))
        }
      }
    });

    revalidatePath('/contratos');
    return { success: true, data: contrato };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContratoStatus(id: string, status: string) {
  try {
    await prisma.contrato.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/contratos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContratoDetails(id: string, data: any) {
  try {
    await prisma.contrato.update({
      where: { id },
      data
    });
    revalidatePath('/contratos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContratoClausulas(contratoId: string, clausulas: { titulo: string; texto: string; ordem: number }[]) {
  try {
    await prisma.clausulaContrato.deleteMany({ where: { contratoId } });
    await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        clausulas: {
          create: clausulas.map(c => ({
            titulo: c.titulo,
            texto: c.texto,
            ordem: c.ordem
          }))
        }
      }
    });
    revalidatePath(`/contratos/${contratoId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContrato(id: string) {
  try {
    await prisma.contrato.delete({ where: { id } });
    revalidatePath('/contratos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
