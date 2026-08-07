'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export async function ensureDefaultPipeline(tenantId: string) {
  let defaultPipeline = await prisma.pipeline.findFirst({
    where: { tenantId }
  });

  if (!defaultPipeline) {
    defaultPipeline = await prisma.pipeline.create({
      data: {
        nome: 'Funil Principal',
        tenantId
      }
    });

    const globalStages = await prisma.leadStage.findMany({
      where: { pipelineId: null }
    });

    if (globalStages.length === 0) {
      const defaultStagesData = [
        { nome: 'Descoberta', ordem: 1, color: 'bg-slate-100' },
        { nome: 'Contato Realizado', ordem: 2, color: 'bg-slate-100' },
        { nome: 'Reunião Agendada', ordem: 3, color: 'bg-slate-100' },
        { nome: 'Qualificado', ordem: 4, color: 'bg-slate-100' }
      ];
      for (const ds of defaultStagesData) {
        await prisma.leadStage.create({
          data: {
            nome: ds.nome,
            ordem: ds.ordem,
            color: ds.color,
            pipelineId: defaultPipeline.id
          }
        });
      }
    } else {
      const stageIdMap: Record<string, string> = {};
      for (const gs of globalStages) {
        const newStage = await prisma.leadStage.create({
          data: {
            nome: gs.nome,
            ordem: gs.ordem,
            color: gs.color,
            pipelineId: defaultPipeline.id
          }
        });
        stageIdMap[gs.id] = newStage.id;
      }

      const leads = await prisma.lead.findMany({
        where: { tenantId }
      });

      for (const lead of leads) {
        const newStageId = stageIdMap[lead.stageId];
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            pipelineId: defaultPipeline.id,
            stageId: newStageId || lead.stageId
          }
        });
      }
    }
  }

  return defaultPipeline;
}

export async function getPipelines() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await ensureDefaultPipeline(user.tenantId!);

    const pipelines = await prisma.pipeline.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, pipelines };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPipeline(nome: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const pipeline = await prisma.pipeline.create({
      data: {
        nome,
        tenantId: user.tenantId
      }
    });

    const defaultStages = [
      { nome: 'Descoberta', ordem: 1, color: 'bg-slate-100' },
      { nome: 'Contato Realizado', ordem: 2, color: 'bg-slate-100' },
      { nome: 'Reunião Agendada', ordem: 3, color: 'bg-slate-100' },
      { nome: 'Qualificado', ordem: 4, color: 'bg-slate-100' }
    ];

    for (const ds of defaultStages) {
      await prisma.leadStage.create({
        data: {
          nome: ds.nome,
          ordem: ds.ordem,
          color: ds.color,
          pipelineId: pipeline.id
        }
      });
    }

    revalidatePath('/leads');
    return { success: true, pipeline };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function renamePipeline(id: string, nome: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const pipeline = await prisma.pipeline.update({
      where: { id, tenantId: user.tenantId },
      data: { nome }
    });
    revalidatePath('/leads');
    return { success: true, pipeline };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePipeline(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const leadsCount = await prisma.lead.count({
      where: {
        tenantId: user.tenantId,
        stage: { pipelineId: id }
      }
    });

    if (leadsCount > 0) {
      return { success: false, error: 'Não é possível excluir um funil que contém Leads. Mova ou exclua os leads primeiro.' };
    }

    const totalPipelines = await prisma.pipeline.count({
      where: { tenantId: user.tenantId }
    });

    if (totalPipelines <= 1) {
      return { success: false, error: 'Você precisa ter pelo menos um funil ativo.' };
    }

    await prisma.pipeline.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeads(filters?: { startDate?: string; endDate?: string; userId?: string; pipelineId?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const where: any = {};
    where.tenantId = user.tenantId;
    if (user.role === 'USER') {
      where.OR = [
        { assignedToId: user.id },
        { shares: { some: { userId: user.id } } }
      ];
    } else {
      if (filters?.userId && filters.userId !== 'all') {
        where.assignedToId = filters.userId;
      }
    }
    if (filters?.pipelineId) {
      where.pipelineId = filters.pipelineId;
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
          orderBy: { dataInicio: 'asc' }
        },
        shares: {
          include: { user: true }
        },
        contacts: true,
        whatsappMessages: {
          select: {
            id: true,
            direction: true,
            status: true,
            texto: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 30
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return { success: true, leads };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUsersForFilter() {
  const user = await getLoggedUser();
  try {
    const where: any = {};
    where.tenantId = user?.tenantId;
    const users = await prisma.user.findMany({
      where,
      select: { id: true, nome: true, avatarUrl: true, cargo: true, email: true },
      orderBy: { nome: 'asc' }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeadStages(pipelineId?: string) {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado', stages: [] };

    let targetPipeId = pipelineId;
    if (targetPipeId) {
      const pipeExists = await prisma.pipeline.findFirst({
        where: { id: targetPipeId, tenantId: user.tenantId! }
      });
      if (!pipeExists) {
        targetPipeId = undefined;
      }
    }

    if (!targetPipeId) {
      const defaultPipe = await ensureDefaultPipeline(user.tenantId!);
      targetPipeId = defaultPipe.id;
    }

    const stages = await prisma.leadStage.findMany({
      where: { pipelineId: targetPipeId },
      orderBy: { ordem: 'asc' }
    });
    return { success: true, stages, pipelineId: targetPipeId };
  } catch (error: any) {
    console.error('getLeadStages error:', error);
    return { success: false, error: error.message, stages: [] };
  }
}

export async function createLeadStage(nome: string, pipelineId?: string, insertAfterId?: string) {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado' };

    let targetPipeId = pipelineId;
    if (targetPipeId) {
      const pipeExists = await prisma.pipeline.findFirst({
        where: { id: targetPipeId, tenantId: user.tenantId! }
      });
      if (!pipeExists) {
        targetPipeId = undefined;
      }
    }

    if (!targetPipeId) {
      const defaultPipe = await ensureDefaultPipeline(user.tenantId!);
      targetPipeId = defaultPipe.id;
    }

    let ordem = 0;
    
    if (insertAfterId) {
      const targetStage = await prisma.leadStage.findUnique({ where: { id: insertAfterId } });
      if (targetStage) {
        ordem = targetStage.ordem + 1;
        // Shift subsequent stages within the same pipeline
        await prisma.leadStage.updateMany({
          where: { pipelineId: targetPipeId, ordem: { gte: ordem } },
          data: { ordem: { increment: 1 } }
        });
      }
    } else {
      const lastStage = await prisma.leadStage.findFirst({
        where: { pipelineId: targetPipeId },
        orderBy: { ordem: 'desc' }
      });
      ordem = lastStage ? lastStage.ordem + 1 : 0;
    }

    const stage = await prisma.leadStage.create({
      data: { nome, ordem, color: '#10B981', pipelineId: targetPipeId }
    });
    revalidatePath('/leads');
    return { success: true, stage, pipelineId: targetPipeId };
  } catch (error: any) {
    console.error('createLeadStage error:', error);
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

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLeadData(leadId: string, data: { nomeFantasia?: string, contatoNome?: string, telefone?: string, email?: string, segmento?: string, valorEst?: number, endereco?: string, cidade?: string, uf?: string }) {
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
    const defaultPipe = await ensureDefaultPipeline(user.tenantId!);
    let pipelineId = data.pipelineId || defaultPipe.id;
    let stageId = data.stageId;

    if (stageId) {
      const stage = await prisma.leadStage.findUnique({ where: { id: stageId } });
      if (stage?.pipelineId) {
        pipelineId = stage.pipelineId;
      }
    } else {
      const firstStage = await prisma.leadStage.findFirst({
        where: { pipelineId },
        orderBy: { ordem: 'asc' }
      });
      stageId = firstStage?.id;
    }

    if (!stageId) {
      return { success: false, error: 'Nenhum estágio disponível. Crie estágios primeiro.' };
    }

    const { site, porte, avaliacoes, ...dbData } = data; // Extrai campos virtuais para não quebrar o Prisma
    delete dbData.pipelineId;

    const lead = await prisma.lead.create({
      data: {
        ...dbData,
        stageId,
        pipelineId,
        assignedToId: data.assignedToId || user.id,
        tenantId: user.tenantId
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
        tenantId: user.tenantId,
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
      data: { leadId, userId: user.id, texto, tenantId: user.tenantId }
    });
    await prisma.leadHistory.create({
      data: { leadId, tipo: 'ANOTACAO', descricao: `Novo comentário adicionado por ${user.nome}` }
    });

    // --- LOGICA DE MENÇÕES E NOTIFICAÇÃO ---
    // Buscar todos os usuários do sistema
    const allUsers = await prisma.user.findMany({
      select: { id: true, nome: true }
    });

    // Obter o nome do Lead para colocar na notificação
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { nomeFantasia: true }
    });
    const leadName = lead?.nomeFantasia || 'um Lead';

    for (const u of allUsers) {
      const mentionToken = `@${u.nome}`;
      // Verifica se o texto do comentário contém a menção do usuário
      if (texto.includes(mentionToken)) {
        // Não notifica a si mesmo
        if (u.id !== user.id) {
          const excerpt = texto.replace(mentionToken, u.nome);
          await prisma.notification.create({
            data: {
              userId: u.id,
              texto: `${user.nome} mencionou você em um comentário no lead "${leadName}": "${excerpt.substring(0, 65)}${excerpt.length > 65 ? '...' : ''}"`,
              link: `/leads?id=${leadId}`
            }
          });
        }
      }
    }
    // ----------------------------------------

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
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const whereClause: any = leadId ? { leadId } : {};
    whereClause.tenantId = user.tenantId;
    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: { user: { select: { nome: true } }, lead: { select: { nomeFantasia: true } }, task: { select: { titulo: true } } },
      orderBy: { dataInicio: 'asc' }
    });
    return { success: true, activities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createActivity(data: { 
  leadId?: string, 
  titulo: string, 
  descricao?: string, 
  tipo: string, 
  dataInicio: Date | string, 
  dataFim: Date | string,
  userId?: string 
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const activity = await prisma.activity.create({
      data: {
        leadId: data.leadId,
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        userId: data.userId || user.id,
        tenantId: user.tenantId
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

export async function completeActivity(activityId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const activity = await prisma.activity.findUnique({ where: { id: activityId }});
    if (!activity) return { success: false, error: 'Atividade não encontrada' };
    
    await prisma.activity.update({
      where: { id: activityId },
      data: { status: 'CONCLUIDA' }
    });
    
    if (activity.leadId) {
      await prisma.leadHistory.create({
        data: { 
          leadId: activity.leadId, 
          tipo: 'REUNIAO', 
          descricao: `Atividade "${activity.titulo}" foi concluída por ${user.nome}` 
        }
      });
    }

    revalidatePath('/leads');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateActivity(activityId: string, data: {
  titulo: string,
  descricao?: string,
  userId: string,
  dataInicio: Date | string,
  dataFim: Date | string,
  status?: string
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  try {
    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        userId: data.userId,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        status: data.status
      }
    });

    revalidatePath('/leads');
    revalidatePath('/calendar');
    return { success: true, activity };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= COMPARTILHAMENTO DE LEADS (EQUIPE) =================
export async function getLeadShares(leadId: string) {
  try {
    const shares = await prisma.leadShare.findMany({
      where: { leadId },
      include: { user: { select: { id: true, nome: true, email: true, cargo: true, avatarUrl: true } } }
    });
    return { success: true, shares };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllUsers() {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { success: false, error: 'Unauthorized' };

    const whereClause: any = {};
    whereClause.tenantId = loggedUser.tenantId;

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, nome: true, cargo: true, role: true, avatarUrl: true, email: true, lastActive: true }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadShare(leadId: string, userId: string, role: string = 'PARTICIPANTE') {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };
  try {
    const existing = await prisma.leadShare.findUnique({ where: { leadId_userId: { leadId, userId } } });
    if (existing) {
      if (existing.role === role) {
        return { success: false, error: 'Usuário já está adicionado a este lead com essa função.' };
      }
      const share = await prisma.leadShare.update({
        where: { leadId_userId: { leadId, userId } },
        data: { role }
      });
      return { success: true, share };
    }

    const share = await prisma.leadShare.create({ data: { leadId, userId, role } });
    const addedUser = await prisma.user.findUnique({ where: { id: userId }});
    
    await prisma.leadHistory.create({
      data: { 
        leadId, 
        tipo: 'MUDANCA_FASE', 
        descricao: `${addedUser?.nome} foi adicionado(a) como ${role === 'OBSERVADOR' ? 'observador(a)' : 'participante'} por ${currentUser.nome}` 
      }
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

export async function sendLeadEmail(
  leadId: string, 
  to: string, 
  subject: string, 
  body: string, 
  smtpAccountId?: string,
  attachments?: { filename: string; content: string }[]
) {
  const currentUser = await getLoggedUser();
  if (!currentUser) return { success: false, error: 'Unauthorized' };

  // Se passou uma conta SMTP específica, valida se ela pertence ao usuário logado!
  if (smtpAccountId) {
    const account = await prisma.smtpAccount.findFirst({
      where: { id: smtpAccountId, userId: currentUser.id }
    });
    if (!account) {
      return { success: false, error: 'Conta de e-mail não encontrada ou não pertencente ao seu usuário.' };
    }
  }

  try {
    // Se o lead não tem e-mail cadastrado ou se o e-mail do lead foi alterado no momento de enviar, atualiza o perfil do lead no banco!
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { email: true }
    });
    
    if (lead && lead.email !== to) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { email: to }
      });
    }

    const { sendMail } = await import('@/lib/mail');
    const mailRes = await sendMail({
      to,
      subject,
      text: body,
      smtpAccountId,
      attachments
    });

    if (!mailRes.success) {
      return { success: false, error: mailRes.error };
    }

    // Register email as a Comment in the lead's main feed with Para: header
    await prisma.comment.create({
      data: {
        leadId,
        userId: currentUser.id,
        texto: `📧 [E-mail Enviado]\nPara: ${to}\nAssunto: ${subject}\n\n${body}`
      }
    });

    // Register in LeadHistory for auditing
    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'EMAIL',
        descricao: `E-mail enviado para ${to} por ${currentUser.nome}`
      }
    });

    revalidatePath('/leads');
    revalidatePath('/emails');
    return { success: true, simulated: mailRes.simulated };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

export async function reorderStages(stageIds: string[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.$transaction(
      stageIds.map((id, index) =>
        prisma.leadStage.update({
          where: { id },
          data: { ordem: index }
        })
      )
    );
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

export async function archiveLead(leadId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { stage: true }
    });
    if (!lead) return { success: false, error: 'Lead não encontrado' };

    const pipelineId = lead.stage?.pipelineId;

    // 1. Procurar ou criar a etapa "Arquivado" no pipeline do lead
    let archivedStage = await prisma.leadStage.findFirst({
      where: {
        pipelineId,
        nome: {
          equals: 'Arquivado',
          mode: 'insensitive'
        }
      }
    });

    if (!archivedStage) {
      // Obter a maior ordem atual no pipeline
      const lastStage = await prisma.leadStage.findFirst({
        where: { pipelineId },
        orderBy: { ordem: 'desc' }
      });
      const nextOrdem = lastStage ? lastStage.ordem + 1 : 0;

      archivedStage = await prisma.leadStage.create({
        data: {
          nome: 'Arquivado',
          ordem: nextOrdem,
          color: '#64748B', // slate color
          pipelineId
        }
      });
    }

    // 2. Mover o lead para a etapa "Arquivado"
    await prisma.lead.update({
      where: { id: leadId },
      data: { stageId: archivedStage.id }
    });

    // 3. Registrar no histórico do lead
    await prisma.leadHistory.create({
      data: {
        leadId,
        tipo: 'MUDANCA_FASE',
        descricao: `Movido para a fase: Arquivado por ${user.nome}`
      }
    });

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

export async function getPendingUnansweredLeads() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized', pendingLeads: [] };

  try {
    const leadsWithMsgs = await prisma.lead.findMany({
      where: {
        tenantId: user.tenantId,
        telefone: { not: null },
        whatsappMessages: { some: {} }
      },
      include: {
        assignedTo: { select: { id: true, nome: true, email: true } },
        stage: { select: { id: true, nome: true } },
        whatsappMessages: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    const pendingLeadsMap = new Map<string, any>();

    leadsWithMsgs.forEach(lead => {
      // Se o atendimento deste lead estiver marcado como encerrado, ignora
      if ((lead as any).chatStatus === 'CLOSED') return;

      const cleanPhone = lead.telefone ? lead.telefone.replace(/\D/g, '').slice(-8) : lead.id;
      const existing = pendingLeadsMap.get(cleanPhone);

      const allMsgs = [...(existing?.whatsappMessages || []), ...(lead.whatsappMessages || [])];
      const sortedMsgs = allMsgs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestMsg = sortedMsgs[0];

      // Apenas considera pendente se a ÚLTIMA mensagem enviada for INBOUND (do cliente) e tiver status diferente de READ
      const isUnanswered = latestMsg && latestMsg.direction === 'INBOUND' && latestMsg.status !== 'READ';
      const unreadCount = allMsgs.filter((m: any) => m.direction === 'INBOUND' && m.status !== 'READ').length;

      if (isUnanswered && unreadCount > 0) {
        pendingLeadsMap.set(cleanPhone, {
          id: lead.id,
          nomeFantasia: (existing && !existing.nomeFantasia.startsWith('WhatsApp:')) ? existing.nomeFantasia : lead.nomeFantasia,
          telefone: lead.telefone,
          segmento: lead.segmento,
          stageName: lead.stage?.nome || 'Sem etapa',
          assignedTo: lead.assignedTo,
          assignedToId: lead.assignedToId,
          latestMsg: latestMsg ? {
            texto: latestMsg.texto,
            createdAt: latestMsg.createdAt,
            direction: latestMsg.direction,
            status: latestMsg.status
          } : null,
          isUnanswered,
          unreadCount,
          whatsappMessages: sortedMsgs
        });
      } else {
        // Se a conversa já recebeu uma resposta da equipe (OUTBOUND recente) ou foi lida, não é pendente
        pendingLeadsMap.delete(cleanPhone);
      }
    });

    const pendingLeads = Array.from(pendingLeadsMap.values()).sort((a, b) => {
      const dateA = a.latestMsg ? new Date(a.latestMsg.createdAt).getTime() : 0;
      const dateB = b.latestMsg ? new Date(b.latestMsg.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return { success: true, pendingLeads };
  } catch (error: any) {
    console.error('getPendingUnansweredLeads error:', error);
    return { success: false, error: error.message, pendingLeads: [] };
  }
}

export async function syncAllWhatsAppLeadsProfile() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) return { success: false, error: 'Não autorizado.' };

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { whatsappInstanceId: true, whatsappToken: true, whatsappClientToken: true }
    });

    if (!tenant || !tenant.whatsappInstanceId || !tenant.whatsappToken) {
      return { success: false, error: 'Z-API não configurada nesta empresa.' };
    }

    const clientToken = tenant.whatsappClientToken || process.env.ZAPI_CLIENT_TOKEN || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (clientToken) headers['Client-Token'] = clientToken;

    // Buscar lista de chats da Z-API para mapear nomes reais
    const chatMap = new Map<string, string>();
    try {
      const chatsRes = await fetch(`https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/chats`, { headers });
      if (chatsRes.ok) {
        const chats = await chatsRes.json();
        if (Array.isArray(chats)) {
          chats.forEach(c => {
            if (c.phone && !c.isGroup && c.name) {
              chatMap.set(c.phone.replace(/\D/g, ''), c.name);
            }
          });
        }
      }
    } catch (err) {}

    const leads = await prisma.lead.findMany({
      where: {
        tenantId: user.tenantId,
        telefone: { not: null },
        OR: [
          { nomeFantasia: { startsWith: 'WhatsApp:' } },
          { fotoUrl: null }
        ]
      }
    });

    let updatedCount = 0;

    for (const lead of leads) {
      if (!lead.telefone) continue;
      const cleanPhone = lead.telefone.replace(/\D/g, '');
      if (!cleanPhone) continue;

      let photoUrl: string | null = null;
      let name: string | null = null;

      // Procura nome no chatMap da Z-API
      for (const [phone, chatName] of chatMap.entries()) {
        if (phone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(phone.slice(-8))) {
          name = chatName;
          break;
        }
      }

      // Buscar foto
      try {
        const photoRes = await fetch(`https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/profile-picture?phone=${cleanPhone}`, { headers });
        if (photoRes.ok) {
          const photoData = await photoRes.json();
          if (photoData && photoData.link && photoData.link !== 'null') {
            photoUrl = photoData.link;
          }
        }
      } catch (err) {}

      // Se ainda não achou nome, tenta buscar detalhes do contato
      if (!name) {
        try {
          const contactRes = await fetch(`https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/contacts/${cleanPhone}`, { headers });
          if (contactRes.ok) {
            const contactData = await contactRes.json();
            name = contactData.name || contactData.pushName || contactData.shortName || null;
          }
        } catch (err) {}
      }

      const updateData: any = {};
      if (lead.nomeFantasia.startsWith('WhatsApp:') && name && name.trim()) {
        updateData.nomeFantasia = name.trim();
      }
      if (!lead.fotoUrl && photoUrl) {
        updateData.fotoUrl = photoUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: updateData
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  } catch (err: any) {
    console.error('Erro ao sincronizar perfis do WhatsApp:', err);
    return { success: false, error: err.message };
  }
}
