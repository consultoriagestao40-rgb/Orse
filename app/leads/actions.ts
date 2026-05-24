'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export async function getLeads() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const leads = await prisma.lead.findMany({
      include: {
        stage: true,
        assignedTo: true,
        history: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return { success: true, leads };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeadStages() {
  try {
    const stages = await prisma.leadStage.findMany({
      orderBy: { ordem: 'asc' }
    });
    return { success: true, stages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLeadStage(leadId: string, stageId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const stage = await prisma.leadStage.findUnique({ where: { id: stageId } });
    if (!stage) return { success: false, error: 'Estágio não encontrado' };

    await prisma.lead.update({
      where: { id: leadId },
      data: { stageId }
    });

    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'MUDANCA_FASE',
        descricao: `Movido para a fase: ${stage.nome} por ${user.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createLead(data: any) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    let stageId = data.stageId;
    if (!stageId) {
      const firstStage = await prisma.leadStage.findFirst({ orderBy: { ordem: 'asc' } });
      stageId = firstStage?.id;
    }

    if (!stageId) {
      return { success: false, error: 'Nenhum estágio disponível. Crie estágios primeiro.' };
    }

    const lead = await prisma.lead.create({
      data: {
        ...data,
        stageId,
        assignedToId: data.assignedToId || user.id
      }
    });

    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        tipo: 'CRIACAO',
        descricao: `Lead cadastrado no sistema por ${user.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true, lead };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadHistory(leadId: string, tipo: string, descricao: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo,
        descricao: `${descricao} (${user.nome})`
      }
    });
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function convertLeadToClient(leadId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { success: false, error: 'Lead não encontrado' };

    const client = await prisma.client.create({
      data: {
        nomeFantasia: lead.nomeFantasia,
        razaoSocial: lead.razaoSocial || lead.nomeFantasia,
        cnpj: lead.cnpj,
        email: lead.email,
        whatsapp: lead.telefone,
        endereco: lead.endereco,
        contato: lead.contatoNome,
      }
    });

    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        tipo: 'CONVERSAO',
        descricao: `Lead convertido em Cliente por ${user.nome}`
      }
    });

    return { success: true, clientId: client.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
