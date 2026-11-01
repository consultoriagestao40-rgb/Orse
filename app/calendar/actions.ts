'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export interface CalendarEventItem {
  id: string;
  sourceId: string;
  titulo: string;
  descricao?: string;
  origem: 'ATA' | 'TAREFA' | 'LEAD' | 'EVENTO' | 'CONTRATO';
  tipo: 'REUNIAO' | 'TAREFA' | 'LIGACAO' | 'VISITA' | 'VENCIMENTO' | 'OUTRO';
  dataStr: string; // YYYY-MM-DD
  dataInicio: string; // ISO string
  dataFim?: string;
  hora?: string;
  status?: string;
  concluida?: boolean;
  prioridade?: string;
  userId?: string;
  responsavelNome?: string;
  responsavelAvatar?: string;
  clienteNome?: string;
  local?: string;
  linkUrl?: string;
  metadata?: any;
}

export async function getUnifiedCalendarData(params?: {
  month?: number; // 0-indexed (0 = Jan, 10 = Nov)
  year?: number;
  filterUser?: string;
  filterOrigem?: string;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized', events: [], users: [] };

  try {
    const tenantId = user.tenantId;

    // Busca simultânea de todas as fontes em paralelo
    const [activities, atas, tasks, contratos, users] = await Promise.all([
      // 1. Atividades de Leads e Eventos do Calendário
      prisma.activity.findMany({
        where: { tenantId },
        include: {
          lead: { select: { id: true, nome: true, empresa: true, telefone: true } },
          user: { select: { id: true, nome: true, avatarUrl: true } }
        },
        orderBy: { dataInicio: 'asc' }
      }),

      // 2. ATAs de Reunião (Data da reunião e Próxima Reunião Agendada)
      prisma.ata.findMany({
        where: { tenantId },
        include: {
          acoes: {
            include: {
              responsavel: { select: { id: true, nome: true, avatarUrl: true } }
            }
          }
        },
        orderBy: { dataReuniou: 'desc' }
      }),

      // 3. Tarefas do Módulo de Tarefas com Prazo/Vencimento
      prisma.task.findMany({
        where: {
          stage: { tenantId },
          vencimento: { not: null }
        },
        include: {
          responsavel: { select: { id: true, nome: true, avatarUrl: true } },
          stage: { select: { id: true, nome: true, color: true } }
        },
        orderBy: { vencimento: 'asc' }
      }),

      // 4. Vencimentos de Contratos Ativos
      prisma.contrato.findMany({
        where: {
          tenantId,
          dataFim: { not: null }
        },
        include: {
          client: { select: { id: true, nomeFantasia: true, razaoSocial: true } }
        }
      }),

      // 5. Lista de usuários da equipe
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, nome: true, avatarUrl: true, role: true },
        orderBy: { nome: 'asc' }
      })
    ]);

    const unifiedList: CalendarEventItem[] = [];

    // Formata Atividades
    activities.forEach(act => {
      const d = new Date(act.dataInicio);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${day}`;
      const horaStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

      const isLead = Boolean(act.leadId);
      unifiedList.push({
        id: `act_${act.id}`,
        sourceId: act.id,
        titulo: act.titulo || 'Compromisso',
        descricao: act.descricao || undefined,
        origem: isLead ? 'LEAD' : 'EVENTO',
        tipo: (act.tipo as any) || 'REUNIAO',
        dataStr,
        dataInicio: act.dataInicio.toISOString(),
        dataFim: act.dataFim ? act.dataFim.toISOString() : undefined,
        hora: horaStr,
        status: act.status || 'PENDENTE',
        concluida: act.status === 'CONCLUIDA',
        userId: act.userId,
        responsavelNome: act.user?.nome,
        responsavelAvatar: act.user?.avatarUrl || undefined,
        clienteNome: act.lead ? (act.lead.empresa || act.lead.nome) : undefined,
        linkUrl: act.leadId ? `/leads?id=${act.leadId}` : undefined,
      });
    });

    // Formata ATAs de Reunião
    atas.forEach(ata => {
      // Data da Reunião
      if (ata.dataReuniou) {
        const d = new Date(ata.dataReuniou);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dataStr = `${y}-${m}-${day}`;

          unifiedList.push({
            id: `ata_${ata.id}`,
            sourceId: ata.id,
            titulo: `ATA: ${ata.titulo}`,
            descricao: ata.relatorio ? ata.relatorio.substring(0, 160) + '...' : undefined,
            origem: 'ATA',
            tipo: 'REUNIAO',
            dataStr,
            dataInicio: ata.dataReuniou.toISOString(),
            hora: ata.horaReuniou || '09:00',
            status: ata.status || 'Realizada',
            local: ata.local || undefined,
            responsavelNome: ata.criadorNome || undefined,
            linkUrl: `/atas`,
            metadata: {
              categoria: ata.categoria,
              totalAcoes: ata.acoes?.length || 0
            }
          });
        }
      }

      // Próxima Reunião Agendada pela ATA
      if (ata.proximaReuniaoData) {
        const dNext = new Date(ata.proximaReuniaoData);
        if (!isNaN(dNext.getTime())) {
          const y = dNext.getFullYear();
          const m = String(dNext.getMonth() + 1).padStart(2, '0');
          const day = String(dNext.getDate()).padStart(2, '0');
          const dataStr = `${y}-${m}-${day}`;

          unifiedList.push({
            id: `ata_next_${ata.id}`,
            sourceId: ata.id,
            titulo: `Próx. Reunião: ${ata.titulo}`,
            descricao: `Agendada via ATA de Reunião. Local: ${ata.proximaReuniaoLocal || 'A definir'}`,
            origem: 'ATA',
            tipo: 'REUNIAO',
            dataStr,
            dataInicio: ata.proximaReuniaoData.toISOString(),
            hora: ata.proximaReuniaoHora || '10:00',
            status: 'Agendada',
            local: ata.proximaReuniaoLocal || undefined,
            responsavelNome: ata.criadorNome || undefined,
            linkUrl: `/atas`
          });
        }
      }

      // Ações e Deliberações da ATA que possuem dataLimite
      ata.acoes?.forEach(acao => {
        if (acao.dataLimite) {
          const dAcao = new Date(acao.dataLimite);
          if (!isNaN(dAcao.getTime())) {
            const y = dAcao.getFullYear();
            const m = String(dAcao.getMonth() + 1).padStart(2, '0');
            const day = String(dAcao.getDate()).padStart(2, '0');
            const dataStr = `${y}-${m}-${day}`;

            unifiedList.push({
              id: `ata_acao_${acao.id}`,
              sourceId: acao.id,
              titulo: `Ação ATA: ${acao.descricao}`,
              descricao: `Deliberação da ATA "${ata.titulo}".`,
              origem: 'ATA',
              tipo: 'TAREFA',
              dataStr,
              dataInicio: acao.dataLimite.toISOString(),
              hora: '18:00',
              status: acao.concluida ? 'CONCLUIDA' : 'PENDENTE',
              concluida: acao.concluida,
              userId: acao.responsavelId,
              responsavelNome: acao.responsavel?.nome,
              responsavelAvatar: acao.responsavel?.avatarUrl || undefined,
              linkUrl: `/atas`
            });
          }
        }
      });
    });

    // Formata Tarefas (/tasks)
    tasks.forEach(task => {
      if (!task.vencimento) return;
      const d = new Date(task.vencimento);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${day}`;

      unifiedList.push({
        id: `task_${task.id}`,
        sourceId: task.id,
        titulo: `Tarefa: #${task.codigo} ${task.titulo}`,
        descricao: task.descricao || undefined,
        origem: 'TAREFA',
        tipo: 'TAREFA',
        dataStr,
        dataInicio: task.vencimento.toISOString(),
        hora: '18:00',
        status: task.status,
        concluida: task.status === 'CONCLUIDA',
        prioridade: task.prioridade,
        userId: task.responsavelId || undefined,
        responsavelNome: task.responsavel?.nome,
        responsavelAvatar: task.responsavel?.avatarUrl || undefined,
        linkUrl: `/tasks`,
        metadata: {
          stageNome: task.stage?.nome,
          stageColor: task.stage?.color
        }
      });
    });

    // Formata Vencimento de Contratos
    contratos.forEach(contrato => {
      if (!contrato.dataFim) return;
      const d = new Date(contrato.dataFim);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${day}`;

      const clientName = contrato.client?.nomeFantasia || contrato.client?.razaoSocial || 'Cliente';
      unifiedList.push({
        id: `contrato_${contrato.id}`,
        sourceId: contrato.id,
        titulo: `Vencimento Contrato: ${clientName}`,
        descricao: `Contrato: ${contrato.titulo || 'Prestação de Serviços'}. Valor: R$ ${(contrato.valorTotal || 0).toLocaleString('pt-BR')}`,
        origem: 'CONTRATO',
        tipo: 'VENCIMENTO',
        dataStr,
        dataInicio: contrato.dataFim.toISOString(),
        hora: '00:00',
        status: contrato.status,
        clienteNome: clientName,
        linkUrl: `/contratos`
      });
    });

    return {
      success: true,
      currentUser: { id: user.id, nome: user.nome, role: user.role },
      users,
      events: unifiedList
    };
  } catch (error: any) {
    console.error('Error fetching unified calendar data:', error);
    return { success: false, error: error.message, events: [], users: [] };
  }
}

export async function createQuickCalendarEvent(data: {
  titulo: string;
  descricao?: string;
  tipo: 'REUNIAO' | 'LIGACAO' | 'VISITA' | 'TAREFA' | 'OUTRO';
  dataInicio: string;
  dataFim?: string;
  userId?: string;
  leadId?: string;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const event = await prisma.activity.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        tipo: data.tipo,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : new Date(new Date(data.dataInicio).getTime() + 60 * 60 * 1000),
        status: 'PENDENTE',
        userId: data.userId || user.id,
        leadId: data.leadId || null,
        tenantId: user.tenantId
      }
    });

    revalidatePath('/calendar');
    return { success: true, event };
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleTaskOrEventStatus(id: string, origem: 'TAREFA' | 'EVENTO' | 'LEAD' | 'ATA') {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    if (origem === 'TAREFA') {
      const cleanId = id.replace('task_', '');
      const task = await prisma.task.findUnique({ where: { id: cleanId } });
      if (task) {
        const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
        await prisma.task.update({
          where: { id: cleanId },
          data: { status: nextStatus }
        });
      }
    } else if (origem === 'EVENTO' || origem === 'LEAD') {
      const cleanId = id.replace('act_', '');
      const act = await prisma.activity.findUnique({ where: { id: cleanId } });
      if (act) {
        const nextStatus = act.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
        await prisma.activity.update({
          where: { id: cleanId },
          data: { status: nextStatus }
        });
      }
    } else if (origem === 'ATA' && id.startsWith('ata_acao_')) {
      const cleanId = id.replace('ata_acao_', '');
      const acao = await prisma.ataAcao.findUnique({ where: { id: cleanId } });
      if (acao) {
        await prisma.ataAcao.update({
          where: { id: cleanId },
          data: {
            concluida: !acao.concluida,
            concluidaEm: !acao.concluida ? new Date() : null
          }
        });
      }
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling status:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCalendarEvent(id: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    if (id.startsWith('act_')) {
      const cleanId = id.replace('act_', '');
      await prisma.activity.delete({ where: { id: cleanId } });
    } else if (id.startsWith('task_')) {
      const cleanId = id.replace('task_', '');
      await prisma.task.delete({ where: { id: cleanId } });
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error: error.message };
  }
}
