'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export async function getLeads(filters?: { startDate?: string; endDate?: string; userId?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const where: any = {};
    if (filters?.userId && filters.userId !== 'all') {
      where.assignedToId = filters.userId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        stage: true,
        assignedTo: true,
        history: {
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          where: { status: 'PENDENTE' },
          orderBy: { dataInicio: 'asc' },
          take: 1
        },
        shares: {
          include: { user: true }
        },
        contacts: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    return { success: true, leads };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUsersForFilter() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' }
    });
    return { success: true, users };
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

export async function createLeadStage(nome: string, insertAfterId?: string) {
  try {
    let ordem = 0;
    
    if (insertAfterId) {
      const targetStage = await prisma.leadStage.findUnique({ where: { id: insertAfterId } });
      if (targetStage) {
        ordem = targetStage.ordem + 1;
        // Shift subsequent stages
        await prisma.leadStage.updateMany({
          where: { ordem: { gte: ordem } },
          data: { ordem: { increment: 1 } }
        });
      }
    } else {
      const lastStage = await prisma.leadStage.findFirst({ orderBy: { ordem: 'desc' } });
      ordem = lastStage ? lastStage.ordem + 1 : 0;
    }

    const stage = await prisma.leadStage.create({
      data: { nome, ordem, color: 'bg-slate-100' }
    });
    revalidatePath('/leads');
    return { success: true, stage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLeadStage(id: string) {
  try {
    const leadsCount = await prisma.lead.count({ where: { stageId: id } });
    if (leadsCount > 0) {
      return { success: false, error: 'Não é possível excluir uma etapa que contém Leads. Mova-os primeiro.' };
    }
    await prisma.leadStage.delete({ where: { id } });
    revalidatePath('/leads');
    return { success: true };
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

export async function updateLeadData(leadId: string, data: { nomeFantasia?: string, contatoNome?: string, telefone?: string, email?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data
    });

    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'ANOTACAO',
        descricao: `Dados do lead atualizados por ${user.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true, lead };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function changeLeadOwner(leadId: string, assignedToId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: { assignedToId }
    });

    const newOwner = await prisma.user.findUnique({ where: { id: assignedToId }});

    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'MUDANCA_FASE',
        descricao: `Responsável alterado para ${newOwner?.nome} por ${user.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true, lead };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLeadStageColor(stageId: string, color: string) {
  try {
    await prisma.leadStage.update({
      where: { id: stageId },
      data: { color }
    });
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLeadStageName(stageId: string, nome: string) {
  try {
    await prisma.leadStage.update({
      where: { id: stageId },
      data: { nome }
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

    const { site, porte, avaliacoes, ...dbData } = data; // Extrai campos virtuais para não quebrar o Prisma

    const lead = await prisma.lead.create({
      data: {
        ...dbData,
        stageId,
        assignedToId: data.assignedToId || user.id
      }
    });

    let historyDesc = `Lead cadastrado no sistema por ${user.nome}.`;
    if (porte) {
      historyDesc += ` Porte: ${porte} (${avaliacoes} avaliações no Google).`;
    }
    if (site) {
      historyDesc += ` Website: ${site}`;
    }

    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        tipo: 'CRIACAO',
        descricao: historyDesc
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

export async function deleteLead(leadId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.lead.delete({
      where: { id: leadId }
    });
    
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function convertLeadToClient(leadId: string, clientData: any) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { success: false, error: 'Lead não encontrado' };

    const client = await prisma.client.create({
      data: {
        nomeFantasia: clientData.nomeFantasia || lead.nomeFantasia,
        razaoSocial: clientData.razaoSocial,
        cnpj: clientData.cnpj,
        email: clientData.email,
        whatsapp: clientData.whatsapp || lead.telefone,
        endereco: clientData.endereco || lead.endereco,
        contato: clientData.contato || lead.contatoNome,
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

// ================= COMENTÁRIOS E MENSAGENS =================
export async function getComments(leadId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { leadId },
      include: { user: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, comments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addComment(leadId: string, texto: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const comment = await prisma.comment.create({
      data: { leadId, userId: user.id, texto }
    });
    await prisma.leadHistory.create({
      data: { leadId, tipo: 'ANOTACAO', descricao: `Novo comentário adicionado por ${user.nome}` }
    });
    revalidatePath('/leads');
    return { success: true, comment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= ARQUIVOS =================
export async function getFiles(leadId: string) {
  try {
    const files = await prisma.fileAttachment.findMany({
      where: { leadId },
      include: { user: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' }
    });
    // Não retornar base64 gigante no list
    return { success: true, files: files.map((f: any) => ({ id: f.id, nome: f.nome, tamanho: f.tamanho, tipo: f.tipo, createdAt: f.createdAt, user: f.user })) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadFileBase64(leadId: string, nome: string, tamanho: number, tipo: string, base64Data: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const file = await prisma.fileAttachment.create({
      data: { leadId, userId: user.id, nome, tamanho, tipo, base64Data }
    });
    await prisma.leadHistory.create({
      data: { leadId, tipo: 'ANOTACAO', descricao: `Arquivo "${nome}" anexado por ${user.nome}` }
    });
    revalidatePath('/leads');
    return { success: true, fileId: file.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function downloadFile(fileId: string) {
  try {
    const file = await prisma.fileAttachment.findUnique({ where: { id: fileId } });
    if (!file) return { success: false, error: 'Arquivo não encontrado' };
    return { success: true, file };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= ATIVIDADES (CALENDÁRIO) =================
export async function getActivities(leadId?: string) {
  try {
    const whereClause = leadId ? { leadId } : {};
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: { user: { select: { nome: true } }, lead: { select: { nomeFantasia: true } } },
      orderBy: { dataInicio: 'asc' }
    });
    return { success: true, activities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createActivity(data: { leadId?: string, titulo: string, descricao?: string, tipo: string, dataInicio: Date, dataFim: Date }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const activity = await prisma.activity.create({
      data: {
        ...data,
        userId: user.id
      }
    });
    if (data.leadId) {
      await prisma.leadHistory.create({
        data: { leadId: data.leadId, tipo: 'REUNIAO', descricao: `Atividade "${data.titulo}" agendada por ${user.nome}` }
      });
    }
    revalidatePath('/leads');
    revalidatePath('/calendar');
    return { success: true, activity };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteActivity(activityId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const activity = await prisma.activity.findUnique({ where: { id: activityId }});
    if (!activity) return { success: false, error: 'Atividade não encontrada' };
    
    await prisma.activity.delete({ where: { id: activityId } });
    
    if (activity.leadId) {
      await prisma.leadHistory.create({
        data: { leadId: activity.leadId, tipo: 'ANOTACAO', descricao: `Atividade "${activity.titulo}" foi removida por ${user.nome}` }
      });
    }

    revalidatePath('/leads');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= COMPARTILHAMENTO DE LEADS (EQUIPE) =================
export async function getLeadShares(leadId: string) {
  try {
    const shares = await prisma.leadShare.findMany({
      where: { leadId },
      include: { user: { select: { id: true, nome: true, email: true, cargo: true } } }
    });
    return { success: true, shares };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, cargo: true, role: true }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadShare(leadId: string, userId: string) {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };
  try {
    const existing = await prisma.leadShare.findUnique({ where: { leadId_userId: { leadId, userId } } });
    if (existing) return { success: false, error: 'Usuário já está adicionado a este lead.' };

    const share = await prisma.leadShare.create({ data: { leadId, userId } });
    const addedUser = await prisma.user.findUnique({ where: { id: userId }});
    
    await prisma.leadHistory.create({
      data: { leadId, tipo: 'MUDANCA_FASE', descricao: `${addedUser?.nome} foi adicionado(a) à equipe por ${currentUser.nome}` }
    });
    
    revalidatePath('/leads');
    return { success: true, share };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeLeadShare(leadId: string, userId: string) {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };
  try {
    await prisma.leadShare.delete({ where: { leadId_userId: { leadId, userId } } });
    
    await prisma.leadHistory.create({
      data: { leadId, tipo: 'MUDANCA_FASE', descricao: `Um usuário foi removido da equipe por ${currentUser.nome}` }
    });
    
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadContact(leadId: string, contact: { nome: string; telefone?: string; email?: string; cargo?: string }) {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };
  
  try {
    const newContact = await prisma.leadContact.create({
      data: {
        leadId,
        nome: contact.nome,
        telefone: contact.telefone || null,
        email: contact.email || null,
        cargo: contact.cargo || null
      }
    });

    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'ANOTACAO',
        descricao: `Contato "${contact.nome}" adicionado por ${currentUser.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true, contact: newContact };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeLeadContact(leadId: string, contactId: string) {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  try {
    const contact = await prisma.leadContact.findUnique({ where: { id: contactId } });
    if (!contact) return { success: false, error: 'Contato não encontrado' };

    await prisma.leadContact.delete({ where: { id: contactId } });

    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'ANOTACAO',
        descricao: `Contato "${contact.nome}" removido por ${currentUser.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
