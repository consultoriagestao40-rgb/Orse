'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

// Ensure default task stages exist
export async function ensureDefaultTaskStages(tenantId: string) {
  const stagesCount = await prisma.taskStage.count({
    where: { tenantId }
  });

  if (stagesCount === 0) {
    const defaultStages = [
      { nome: 'A Fazer', ordem: 1, color: 'bg-slate-100 text-slate-700 border-slate-200' },
      { nome: 'Em Andamento', ordem: 2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { nome: 'Pendente', ordem: 3, color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { nome: 'Impedido', ordem: 4, color: 'bg-rose-50 text-rose-700 border-rose-200' },
      { nome: 'Concluído', ordem: 5, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    ];

    for (const ds of defaultStages) {
      await prisma.taskStage.create({
        data: {
          nome: ds.nome,
          ordem: ds.ordem,
          color: ds.color,
          tenantId
        }
      });
    }
  }

  // Seed default tags
  const tagsCount = await prisma.tag.count({
    where: { tenantId }
  });

  if (tagsCount === 0) {
    const defaultTags = [
      { nome: 'Urgente', color: '#EF4444' },
      { nome: 'Alta Prioridade', color: '#F97316' },
      { nome: 'Planejamento', color: '#3B82F6' },
      { nome: 'Comercial', color: '#10B981' },
      { nome: 'Financeiro', color: '#8B5CF6' }
    ];

    for (const dt of defaultTags) {
      await prisma.tag.create({
        data: {
          nome: dt.nome,
          color: dt.color,
          tenantId
        }
      });
    }
  }
}

// Get task stages
export async function getTaskStages() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await ensureDefaultTaskStages(user.tenantId!);
    const stages = await prisma.taskStage.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { ordem: 'asc' }
    });
    return { success: true, stages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create Task Stage
export async function createTaskStage(nome: string, color?: string, insertAfterId?: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const allStages = await prisma.taskStage.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { ordem: 'asc' }
    });

    const newStage = await prisma.taskStage.create({
      data: {
        nome,
        ordem: 9999,
        color: color || '#E2E8F0',
        tenantId: user.tenantId
      }
    });

    let newOrderIds = allStages.map(s => s.id);
    if (insertAfterId) {
      const idx = newOrderIds.indexOf(insertAfterId);
      if (idx !== -1) {
        newOrderIds.splice(idx + 1, 0, newStage.id);
      } else {
        newOrderIds.push(newStage.id);
      }
    } else {
      newOrderIds.push(newStage.id);
    }

    for (let i = 0; i < newOrderIds.length; i++) {
      await prisma.taskStage.update({
        where: { id: newOrderIds[i], tenantId: user.tenantId },
        data: { ordem: i + 1 }
      });
    }

    revalidatePath('/tasks');
    return { success: true, stage: newStage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Task Stage
export async function updateTaskStage(id: string, data: { nome?: string; color?: string }) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const stage = await prisma.taskStage.update({
      where: { id, tenantId: user.tenantId },
      data
    });
    revalidatePath('/tasks');
    return { success: true, stage };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete Task Stage
export async function deleteTaskStage(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const tasksCount = await prisma.task.count({
      where: { stageId: id, tenantId: user.tenantId }
    });

    if (tasksCount > 0) {
      return { success: false, error: 'Não é possível excluir uma etapa que contém tarefas ativas. Mova as tarefas primeiro.' };
    }

    await prisma.taskStage.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Reorder Task Stages
export async function reorderTaskStages(stageIds: string[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    for (let i = 0; i < stageIds.length; i++) {
      await prisma.taskStage.update({
        where: { id: stageIds[i], tenantId: user.tenantId },
        data: { ordem: i + 1 }
      });
    }
    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Tasks
export async function getTasks(filters?: { 
  stageId?: string; 
  responsavelId?: string; 
  prioridade?: string;
  vencimentoPreset?: string; // 'overdue', 'today', 'week', 'nextWeek', 'none'
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await ensureDefaultTaskStages(user.tenantId!);

    const where: any = { tenantId: user.tenantId };

    if (filters?.stageId && filters.stageId !== 'all') {
      where.stageId = filters.stageId;
    }
    if (filters?.responsavelId && filters.responsavelId !== 'all') {
      where.responsavelId = filters.responsavelId;
    }
    if (filters?.prioridade && filters.prioridade !== 'all') {
      where.prioridade = filters.prioridade;
    }

    if (filters?.vencimentoPreset && filters.vencimentoPreset !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      if (filters.vencimentoPreset === 'overdue') {
        where.vencimento = { lt: today };
        where.status = { not: 'CONCLUIDA' };
      } else if (filters.vencimentoPreset === 'today') {
        where.vencimento = { gte: today, lte: endOfToday };
      } else if (filters.vencimentoPreset === 'week') {
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        where.vencimento = { gte: today, lte: next7Days };
      } else if (filters.vencimentoPreset === 'nextWeek') {
        const startOfNextWeek = new Date(today);
        startOfNextWeek.setDate(today.getDate() + 7);
        const endOfNextWeek = new Date(today);
        endOfNextWeek.setDate(today.getDate() + 14);
        where.vencimento = { gte: startOfNextWeek, lte: endOfNextWeek };
      } else if (filters.vencimentoPreset === 'none') {
        where.vencimento = null;
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        stage: true,
        criador: { select: { id: true, nome: true, avatarUrl: true, email: true } },
        responsavel: { select: { id: true, nome: true, avatarUrl: true, email: true } },
        participantes: { include: { user: { select: { id: true, nome: true, avatarUrl: true } } } },
        observadores: { include: { user: { select: { id: true, nome: true, avatarUrl: true } } } },
        atividades: { include: { responsavel: { select: { id: true, nome: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
        tags: { include: { tag: true } },
        attachments: { select: { id: true, nome: true, tamanho: true, tipo: true, createdAt: true, user: { select: { nome: true } } }, orderBy: { createdAt: 'desc' } },
        comments: { include: { user: { select: { id: true, nome: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, tasks };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create Task
export async function createTask(data: {
  titulo: string;
  descricao?: string;
  stageId: string;
  responsavelId?: string;
  vencimento?: string | Date;
  prioridade?: string;
  tags?: string[]; // array of tagIds
  participantes?: string[]; // userIds
  observadores?: string[]; // userIds
  recorrente?: boolean;
  recorrenciaFrequencia?: string;
  recorrenciaIntervalo?: number;
  recorrenciaFim?: string | Date;
  templateId?: string;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const task = await prisma.task.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        stageId: data.stageId,
        criadorId: user.id,
        responsavelId: data.responsavelId || user.id,
        vencimento: data.vencimento ? new Date(data.vencimento) : null,
        prioridade: data.prioridade || 'MEDIA',
        tenantId: user.tenantId,
        recorrente: data.recorrente || false,
        recorrenciaFrequencia: data.recorrenciaFrequencia || null,
        recorrenciaIntervalo: data.recorrenciaIntervalo !== undefined ? data.recorrenciaIntervalo : 1,
        recorrenciaFim: data.recorrenciaFim ? new Date(data.recorrenciaFim) : null
      }
    });

    // If templateId is provided, clone subtasks and tags from it
    if (data.templateId) {
      const template = await prisma.taskTemplate.findUnique({
        where: { id: data.templateId }
      });
      if (template) {
        // Clone activities (checklist)
        if (template.activities) {
          try {
            const subtaskTitles = JSON.parse(template.activities);
            if (Array.isArray(subtaskTitles)) {
              for (const title of subtaskTitles) {
                await prisma.taskActivity.create({
                  data: {
                    taskId: task.id,
                    titulo: title,
                    concluida: false
                  }
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse template activities:', e);
          }
        }

        // Clone tags
        if (template.tagIds) {
          try {
            const tagIds = JSON.parse(template.tagIds);
            if (Array.isArray(tagIds)) {
              for (const tagId of tagIds) {
                await prisma.taskTag.create({
                  data: { taskId: task.id, tagId }
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse template tags:', e);
          }
        }
      }
    }

    // Add tags
    if (data.tags && data.tags.length > 0) {
      for (const tagId of data.tags) {
        await prisma.taskTag.create({
          data: { taskId: task.id, tagId }
        });
      }
    }

    // Add participants
    if (data.participantes && data.participantes.length > 0) {
      for (const pId of data.participantes) {
        await prisma.taskParticipant.create({
          data: { taskId: task.id, userId: pId }
        });
      }
    }

    // Add observers
    if (data.observadores && data.observadores.length > 0) {
      for (const oId of data.observadores) {
        await prisma.taskObserver.create({
          data: { taskId: task.id, userId: oId }
        });
      }
    }

    // Log history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        tipo: 'CRIACAO',
        descricao: `Tarefa criada por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true, task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helpers for Recurring Tasks
function calculateNextRecurrenceDate(baseDate: Date, frequencia: string, intervalo: number): Date {
  const nextDate = new Date(baseDate);
  const addValue = intervalo > 0 ? intervalo : 1;
  
  switch (frequencia) {
    case 'DIARIO':
      nextDate.setDate(nextDate.getDate() + addValue);
      break;
    case 'SEMANAL':
      nextDate.setDate(nextDate.getDate() + (addValue * 7));
      break;
    case 'MENSAL':
      nextDate.setMonth(nextDate.getMonth() + addValue);
      break;
    case 'TRIMESTRAL':
      nextDate.setMonth(nextDate.getMonth() + (addValue * 3));
      break;
    case 'SEMESTRAL':
      nextDate.setMonth(nextDate.getMonth() + (addValue * 6));
      break;
    case 'ANUAL':
      nextDate.setFullYear(nextDate.getFullYear() + addValue);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + addValue);
  }
  return nextDate;
}

async function spawnNextRecurringInstance(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        atividades: true,
        tags: true,
        participantes: true,
        observadores: true
      }
    });
    if (!task || !task.recorrente || !task.recorrenciaFrequencia) return;

    // Calculate next due date
    const baseDate = task.vencimento ? new Date(task.vencimento) : new Date();
    const nextDueDate = calculateNextRecurrenceDate(baseDate, task.recorrenciaFrequencia, task.recorrenciaIntervalo || 1);

    // If there is an end date and we exceeded it, stop
    if (task.recorrenciaFim && nextDueDate > new Date(task.recorrenciaFim)) {
      return;
    }

    // Find the first stage of the tenant to place the new task
    const firstStage = await prisma.taskStage.findFirst({
      where: { tenantId: task.tenantId },
      orderBy: { ordem: 'asc' }
    });
    if (!firstStage) return;

    // Create the new task copy
    const newTask = await prisma.task.create({
      data: {
        titulo: task.titulo,
        descricao: task.descricao,
        status: 'PENDENTE',
        prioridade: task.prioridade,
        stageId: firstStage.id,
        criadorId: task.criadorId,
        responsavelId: task.responsavelId,
        vencimento: nextDueDate,
        tenantId: task.tenantId,
        recorrente: true,
        recorrenciaFrequencia: task.recorrenciaFrequencia,
        recorrenciaIntervalo: task.recorrenciaIntervalo,
        recorrenciaFim: task.recorrenciaFim
      }
    });

    // Copy activities in pending state
    if (task.atividades && task.atividades.length > 0) {
      for (const act of task.atividades) {
        await prisma.taskActivity.create({
          data: {
            taskId: newTask.id,
            titulo: act.titulo,
            descricao: act.descricao,
            responsavelId: act.responsavelId,
            concluida: false
          }
        });
      }
    }

    // Copy tags
    if (task.tags && task.tags.length > 0) {
      for (const tTag of task.tags) {
        await prisma.taskTag.create({
          data: {
            taskId: newTask.id,
            tagId: tTag.tagId
          }
        });
      }
    }

    // Copy participants
    if (task.participantes && task.participantes.length > 0) {
      for (const p of task.participantes) {
        await prisma.taskParticipant.create({
          data: {
            taskId: newTask.id,
            userId: p.userId
          }
        });
      }
    }

    // Copy observers
    if (task.observadores && task.observadores.length > 0) {
      for (const o of task.observadores) {
        await prisma.taskObserver.create({
          data: {
            taskId: newTask.id,
            userId: o.userId
          }
        });
      }
    }

    // Log creation
    await prisma.taskHistory.create({
      data: {
        taskId: newTask.id,
        tipo: 'CRIACAO',
        descricao: `Tarefa gerada automaticamente por recorrência (${task.recorrenciaFrequencia.toLowerCase()})`
      }
    });

    // Disable recurrence on completed task so it acts as history
    await prisma.task.update({
      where: { id: task.id },
      data: { recorrente: false }
    });

  } catch (error) {
    console.error('Failed to spawn recurring instance:', error);
  }
}

// Update Task Data (e.g. title, description, priority, assignee, due date, status)
export async function updateTask(taskId: string, data: {
  titulo?: string;
  descricao?: string;
  prioridade?: string;
  responsavelId?: string;
  vencimento?: string | Date | null;
  status?: string;
  stageId?: string;
  recorrente?: boolean;
  recorrenciaFrequencia?: string | null;
  recorrenciaIntervalo?: number;
  recorrenciaProximaData?: string | Date | null;
  recorrenciaFim?: string | Date | null;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const oldTask = await prisma.task.findUnique({
      where: { id: taskId, tenantId: user.tenantId },
      include: { stage: true, responsavel: true }
    });
    if (!oldTask) return { success: false, error: 'Tarefa não encontrada' };

    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId;
    if (data.vencimento !== undefined) updateData.vencimento = data.vencimento ? new Date(data.vencimento) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.stageId !== undefined) updateData.stageId = data.stageId;
    if (data.recorrente !== undefined) updateData.recorrente = data.recorrente;
    if (data.recorrenciaFrequencia !== undefined) updateData.recorrenciaFrequencia = data.recorrenciaFrequencia;
    if (data.recorrenciaIntervalo !== undefined) updateData.recorrenciaIntervalo = data.recorrenciaIntervalo;
    if (data.recorrenciaProximaData !== undefined) {
      updateData.recorrenciaProximaData = data.recorrenciaProximaData ? new Date(data.recorrenciaProximaData) : null;
    }
    if (data.recorrenciaFim !== undefined) {
      updateData.recorrenciaFim = data.recorrenciaFim ? new Date(data.recorrenciaFim) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });

    // History descriptions
    const logs: string[] = [];
    if (data.titulo && data.titulo !== oldTask.titulo) {
      logs.push(`Título alterado de "${oldTask.titulo}" para "${data.titulo}"`);
    }
    if (data.responsavelId && data.responsavelId !== oldTask.responsavelId) {
      const newOwner = await prisma.user.findUnique({ where: { id: data.responsavelId } });
      logs.push(`Responsável alterado de ${oldTask.responsavel?.nome || 'Sem responsável'} para ${newOwner?.nome}`);
    }
    if (data.stageId && data.stageId !== oldTask.stageId) {
      const newStage = await prisma.taskStage.findUnique({ where: { id: data.stageId } });
      logs.push(`Etapa alterada de "${oldTask.stage?.nome}" para "${newStage?.nome}"`);
    }
    if (data.status && data.status !== oldTask.status) {
      logs.push(`Status alterado de "${oldTask.status}" para "${data.status}"`);
    }

    const desc = logs.length > 0 ? logs.join(', ') : 'Dados da tarefa atualizados';
    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'ALTERACAO_DADOS',
        descricao: `${desc} por ${user.nome}`
      }
    });

    // Trigger recurrence if marked as completed
    if (data.status === 'CONCLUIDA' && oldTask.status !== 'CONCLUIDA' && (data.recorrente ?? oldTask.recorrente)) {
      await spawnNextRecurringInstance(taskId);
    }

    revalidatePath('/tasks');
    return { success: true, task };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete Task
export async function deleteTask(taskId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.task.delete({
      where: { id: taskId, tenantId: user.tenantId }
    });
    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Task Participants (replace array of userIds)
export async function updateTaskParticipants(taskId: string, userIds: string[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.taskParticipant.deleteMany({
      where: { taskId }
    });

    for (const userId of userIds) {
      await prisma.taskParticipant.create({
        data: { taskId, userId }
      });
    }

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'ALTERACAO_DADOS',
        descricao: `Participantes atualizados por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Task Observers (replace array of userIds)
export async function updateTaskObservers(taskId: string, userIds: string[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.taskObserver.deleteMany({
      where: { taskId }
    });

    for (const userId of userIds) {
      await prisma.taskObserver.create({
        data: { taskId, userId }
      });
    }

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'ALTERACAO_DADOS',
        descricao: `Observadores atualizados por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Task Tags (replace array of tagIds)
export async function updateTaskTags(taskId: string, tagIds: string[]) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.taskTag.deleteMany({
      where: { taskId }
    });

    for (const tagId of tagIds) {
      await prisma.taskTag.create({
        data: { taskId, tagId }
      });
    }

    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create customizable Tenant Tag
export async function createTenantTag(nome: string, color: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const tag = await prisma.tag.create({
      data: { nome, color, tenantId: user.tenantId }
    });
    return { success: true, tag };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete customizable Tenant Tag
export async function deleteTenantTag(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.tag.delete({
      where: { id, tenantId: user.tenantId }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Tenant Tags
export async function getTenantTags() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const tags = await prisma.tag.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { nome: 'asc' }
    });
    return { success: true, tags };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= SUBTASKS (ATIVIDADES) =================
export async function createTaskActivity(taskId: string, data: {
  titulo: string;
  descricao?: string;
  responsavelId?: string;
  vencimento?: string | Date;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const activity = await prisma.taskActivity.create({
      data: {
        taskId,
        titulo: data.titulo,
        descricao: data.descricao || null,
        responsavelId: data.responsavelId || null,
        vencimento: data.vencimento ? new Date(data.vencimento) : null
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'ATIVIDADE',
        descricao: `Subtarefa "${data.titulo}" criada por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true, activity };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleTaskActivity(activityId: string, concluida: boolean) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const activity = await prisma.taskActivity.update({
      where: { id: activityId },
      data: { concluida }
    });

    await prisma.taskHistory.create({
      data: {
        taskId: activity.taskId,
        tipo: 'ATIVIDADE',
        descricao: `Subtarefa "${activity.titulo}" marcada como ${concluida ? 'concluída' : 'pendente'} por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true, activity };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskActivity(
  activityId: string,
  data: {
    titulo?: string;
    responsavelId?: string | null;
    vencimento?: string | Date | null;
  }
) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId;
    if (data.vencimento !== undefined) {
      updateData.vencimento = data.vencimento ? new Date(data.vencimento) : null;
    }

    const activity = await prisma.taskActivity.update({
      where: { id: activityId },
      data: updateData
    });

    revalidatePath('/tasks');
    return { success: true, activity };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTaskActivity(activityId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const activity = await prisma.taskActivity.delete({
      where: { id: activityId }
    });

    await prisma.taskHistory.create({
      data: {
        taskId: activity.taskId,
        tipo: 'ATIVIDADE',
        descricao: `Subtarefa "${activity.titulo}" removida por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= COMMENTS =================
export async function addTaskComment(taskId: string, texto: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const comment = await prisma.taskComment.create({
      data: { taskId, userId: user.id, texto }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'COMENTARIO',
        descricao: `Comentário adicionado por ${user.nome}`
      }
    });

    // --- LOGICA DE MENÇÕES E NOTIFICAÇÃO ---
    const allUsers = await prisma.user.findMany({
      select: { id: true, nome: true }
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { titulo: true }
    });
    const taskTitle = task?.titulo || 'uma tarefa';

    for (const u of allUsers) {
      const mentionToken = `@${u.nome}`;
      if (texto.includes(mentionToken)) {
        if (u.id !== user.id) {
          const excerpt = texto.replace(mentionToken, u.nome);
          await prisma.notification.create({
            data: {
              userId: u.id,
              texto: `${user.nome} mencionou você na tarefa "${taskTitle}": "${excerpt.substring(0, 65)}${excerpt.length > 65 ? '...' : ''}"`,
              link: `/tasks?taskId=${taskId}`
            }
          });
        }
      }
    }

    revalidatePath('/tasks');
    return { success: true, comment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= ATTACHMENTS =================
export async function uploadTaskAttachment(taskId: string, nome: string, tamanho: number, tipo: string, base64Data: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const attachment = await prisma.taskAttachment.create({
      data: { taskId, userId: user.id, nome, tamanho, tipo, base64Data }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'ANEXO',
        descricao: `Arquivo "${nome}" anexado por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    return { success: true, attachmentId: attachment.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function downloadTaskAttachment(attachmentId: string) {
  try {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId }
    });
    if (!attachment) return { success: false, error: 'Arquivo não encontrado' };
    return { success: true, attachment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= CALENDAR EVENTS (REUNIÕES DA TAREFA) =================
export async function getTaskMeetings(taskId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const meetings = await prisma.activity.findMany({
      where: {
        taskId,
        tenantId: user.tenantId
      },
      include: {
        user: { select: { nome: true, avatarUrl: true } }
      },
      orderBy: { dataInicio: 'asc' }
    });
    return { success: true, meetings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTaskMeeting(taskId: string, data: {
  titulo: string;
  descricao?: string;
  dataInicio: string | Date;
  dataFim: string | Date;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const meeting = await prisma.activity.create({
      data: {
        taskId,
        titulo: data.titulo,
        descricao: data.descricao || null,
        tipo: 'REUNIAO',
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        userId: user.id,
        tenantId: user.tenantId
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'OUTRO',
        descricao: `Reunião "${data.titulo}" agendada por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    revalidatePath('/calendar');
    return { success: true, meeting };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTaskMeeting(meetingId: string, taskId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const meeting = await prisma.activity.findFirst({
      where: { id: meetingId, tenantId: user.tenantId }
    });
    if (!meeting) return { success: false, error: 'Reunião não encontrada' };

    await prisma.activity.delete({
      where: { id: meetingId }
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        tipo: 'OUTRO',
        descricao: `Reunião "${meeting.titulo}" desmarcada por ${user.nome}`
      }
    });

    revalidatePath('/tasks');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ================= TASK TEMPLATES (MODELOS DE TAREFA) =================
export async function getTaskTemplates() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const templates = await prisma.taskTemplate.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTaskTemplate(data: {
  titulo: string;
  descricao?: string;
  prioridade?: string;
  responsavelId?: string;
  activities?: string; // stringified JSON array
  tagIds?: string; // stringified JSON array
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const template = await prisma.taskTemplate.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        prioridade: data.prioridade || 'MEDIA',
        responsavelId: data.responsavelId || null,
        activities: data.activities || null,
        tagIds: data.tagIds || null,
        tenantId: user.tenantId
      }
    });
    return { success: true, template };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTaskTemplate(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.taskTemplate.delete({
      where: { id, tenantId: user.tenantId }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
