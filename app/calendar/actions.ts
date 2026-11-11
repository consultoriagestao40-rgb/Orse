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

function toLocalDateAndHour(input: Date | string) {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  // Ajusta para fuso de Brasília (America/Sao_Paulo) para evitar que 21h+ vire dia seguinte em UTC na Vercel
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  const dataStr = `${get('year')}-${get('month')}-${get('day')}`;
  const rawHour = get('hour') === '24' ? '00' : get('hour');
  const horaStr = `${rawHour}:${get('minute')}`;
  return { d, dataStr, horaStr };
}

function stripHtml(html?: string | null) {
  if (!html) return undefined;
  const clean = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  return clean ? (clean.length > 180 ? clean.substring(0, 180) + '...' : clean) : undefined;
}

export async function getUnifiedCalendarData(params?: {
  month?: number;
  year?: number;
  filterUser?: string;
  filterOrigem?: string;
}) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized', events: [], users: [] };

  try {
    const tenantId = user.tenantId;

    // Busca simultânea isolada (nenhuma falha individual derruba as demais fontes)
    const [activities, atas, tasks, contratos, users] = await Promise.all([
      // 1. Atividades de Leads, Tarefas e Compromissos do Calendário
      prisma.activity.findMany({
        where: {
          OR: [
            { tenantId },
            { user: { tenantId } },
            { lead: { tenantId } },
          ],
        },
        include: {
          lead: {
            select: {
              id: true,
              nomeFantasia: true,
              razaoSocial: true,
              contatoNome: true,
              telefone: true,
            },
          },
          task: {
            select: {
              id: true,
              codigo: true,
              titulo: true,
            },
          },
          user: { select: { id: true, nome: true, avatarUrl: true } },
        },
        orderBy: { dataInicio: 'asc' },
      }).catch((err) => {
        console.error('Erro ao buscar activities no calendário:', err);
        return [];
      }),

      // 2. ATAs de Reunião (Data da reunião, Próxima Reunião e Deliberações)
      prisma.ata.findMany({
        where: {
          tenantId,
          titulo: { not: '__SYSTEM_PLANNING_DATA__' },
        },
        include: {
          acoes: {
            include: {
              responsavel: { select: { id: true, nome: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { dataReuniou: 'desc' },
      }).catch((err) => {
        console.error('Erro ao buscar atas no calendário:', err);
        return [];
      }),

      // 3. Tarefas do Módulo de Tarefas (/tasks)
      prisma.task.findMany({
        where: {
          OR: [
            { tenantId },
            { stage: { tenantId } },
          ],
        },
        include: {
          responsavel: { select: { id: true, nome: true, avatarUrl: true } },
          criador: { select: { id: true, nome: true, avatarUrl: true } },
          stage: { select: { id: true, nome: true, color: true } },
          atividades: {
            include: {
              responsavel: { select: { id: true, nome: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }).catch((err) => {
        console.error('Erro ao buscar tasks no calendário:', err);
        return [];
      }),

      // 4. Contratos (Vencimentos e Reajustes)
      prisma.contrato.findMany({
        where: { tenantId },
        include: {
          client: { select: { id: true, nomeFantasia: true, razaoSocial: true } },
        },
      }).catch((err) => {
        console.error('Erro ao buscar contratos no calendário:', err);
        return [];
      }),

      // 5. Lista de usuários da equipe
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, nome: true, avatarUrl: true, role: true },
        orderBy: { nome: 'asc' },
      }).catch(() => []),
    ]);

    const unifiedList: CalendarEventItem[] = [];

    // 1) Formata Atividades (Visitas, Reuniões, Ligações, Eventos de Lead/Tarefa)
    activities.forEach(act => {
      const parsed = toLocalDateAndHour(act.dataInicio);
      if (!parsed) return;

      const isLead = Boolean(act.leadId);
      const isTask = !isLead && (act.tipo === 'TAREFA' || Boolean(act.taskId));
      const origem: CalendarEventItem['origem'] = isLead
        ? 'LEAD'
        : isTask
        ? 'TAREFA'
        : 'EVENTO';

      const tipoLabel =
        act.tipo === 'VISITA'
          ? '🚗 Visita: '
          : act.tipo === 'LIGACAO'
          ? '📞 Ligação: '
          : act.tipo === 'REUNIAO'
          ? '🤝 Reunião: '
          : '';

      const rawTitle = act.titulo || 'Compromisso';
      const displayTitle =
        rawTitle.startsWith('🚗') || rawTitle.startsWith('📞') || rawTitle.startsWith('🤝')
          ? rawTitle
          : `${tipoLabel}${rawTitle}`;

      unifiedList.push({
        id: `act_${act.id}`,
        sourceId: act.id,
        titulo: displayTitle,
        descricao: act.descricao || undefined,
        origem,
        tipo: (act.tipo as any) || 'REUNIAO',
        dataStr: parsed.dataStr,
        dataInicio: act.dataInicio.toISOString(),
        dataFim: act.dataFim ? act.dataFim.toISOString() : undefined,
        hora: parsed.horaStr,
        status: act.status || 'PENDENTE',
        concluida: act.status === 'CONCLUIDA',
        userId: act.userId,
        responsavelNome: act.user?.nome,
        responsavelAvatar: act.user?.avatarUrl || undefined,
        clienteNome: act.lead
          ? act.lead.nomeFantasia || act.lead.razaoSocial || act.lead.contatoNome || undefined
          : act.task
          ? `Tarefa #${act.task.codigo}: ${act.task.titulo}`
          : undefined,
        linkUrl: act.leadId ? `/leads` : act.taskId ? `/tasks` : undefined,
      });
    });

    // 2) Formata ATAs de Reunião
    atas.forEach(ata => {
      if (ata.dataReuniou) {
        const parsed = toLocalDateAndHour(ata.dataReuniou);
        if (parsed) {
          unifiedList.push({
            id: `ata_${ata.id}`,
            sourceId: ata.id,
            titulo: `ATA: ${ata.titulo}`,
            descricao: stripHtml(ata.relatorio) || stripHtml(ata.consideracoes),
            origem: 'ATA',
            tipo: 'REUNIAO',
            dataStr: parsed.dataStr,
            dataInicio: ata.dataReuniou.toISOString(),
            hora: ata.horaReuniou || '09:00',
            status: ata.status || 'Realizada',
            concluida: ata.status === 'Finalizada' || ata.status === 'Concluída',
            local: ata.local || undefined,
            responsavelNome: ata.criadorNome || undefined,
            linkUrl: `/atas`,
            metadata: {
              categoria: ata.categoria,
              totalAcoes: ata.acoes?.length || 0,
            },
          });
        }
      }

      // Próxima Reunião Agendada pela ATA
      if (ata.proximaReuniaoData) {
        const parsedNext = toLocalDateAndHour(ata.proximaReuniaoData);
        if (parsedNext) {
          unifiedList.push({
            id: `ata_next_${ata.id}`,
            sourceId: ata.id,
            titulo: `Próx. Reunião: ${ata.titulo}`,
            descricao: `Agendada via ATA de Reunião. Local: ${ata.proximaReuniaoLocal || 'A definir'}`,
            origem: 'ATA',
            tipo: 'REUNIAO',
            dataStr: parsedNext.dataStr,
            dataInicio: ata.proximaReuniaoData.toISOString(),
            hora: ata.proximaReuniaoHora || '10:00',
            status: 'Agendada',
            local: ata.proximaReuniaoLocal || undefined,
            responsavelNome: ata.criadorNome || undefined,
            linkUrl: `/atas`,
          });
        }
      }

      // Ações e Deliberações da ATA que possuem dataLimite
      ata.acoes?.forEach(acao => {
        if (acao.dataLimite) {
          const parsedAcao = toLocalDateAndHour(acao.dataLimite);
          if (parsedAcao) {
            unifiedList.push({
              id: `ata_acao_${acao.id}`,
              sourceId: acao.id,
              titulo: `Deliberação ATA: ${acao.descricao}`,
              descricao: `Ação da ATA "${ata.titulo}"`,
              origem: 'ATA',
              tipo: 'TAREFA',
              dataStr: parsedAcao.dataStr,
              dataInicio: acao.dataLimite.toISOString(),
              hora: '18:00',
              status: acao.concluida ? 'CONCLUIDA' : 'PENDENTE',
              concluida: acao.concluida,
              userId: acao.responsavelId,
              responsavelNome: acao.responsavel?.nome,
              responsavelAvatar: acao.responsavel?.avatarUrl || undefined,
              linkUrl: `/atas`,
            });
          }
        }
      });
    });

    // 3) Formata Tarefas (/tasks) e Sub-atividades com prazo
    tasks.forEach(task => {
      const refDate = task.vencimento || task.recorrenciaProximaData || task.createdAt;
      if (refDate) {
        const parsed = toLocalDateAndHour(refDate);
        if (parsed) {
          const isConcluida =
            task.status === 'CONCLUIDA' ||
            task.stage?.nome?.toLowerCase().includes('conclu');

          unifiedList.push({
            id: `task_${task.id}`,
            sourceId: task.id,
            titulo: `Tarefa #${task.codigo}: ${task.titulo}`,
            descricao: stripHtml(task.descricao),
            origem: 'TAREFA',
            tipo: 'TAREFA',
            dataStr: parsed.dataStr,
            dataInicio: new Date(refDate).toISOString(),
            hora: task.vencimento ? parsed.horaStr : '18:00',
            status: task.status,
            concluida: isConcluida,
            prioridade: task.prioridade,
            userId: task.responsavelId || task.criadorId || undefined,
            responsavelNome: task.responsavel?.nome || task.criador?.nome,
            responsavelAvatar: task.responsavel?.avatarUrl || task.criador?.avatarUrl || undefined,
            linkUrl: `/tasks`,
            metadata: {
              stageNome: task.stage?.nome,
              stageColor: task.stage?.color,
            },
          });
        }
      }

      // Sub-atividades (checklist) da tarefa que possuem vencimento próprio
      task.atividades?.forEach(sub => {
        if (!sub.vencimento) return;
        const parsedSub = toLocalDateAndHour(sub.vencimento);
        if (!parsedSub) return;
        unifiedList.push({
          id: `task_sub_${sub.id}`,
          sourceId: sub.id,
          titulo: `Checklist #${task.codigo}: ${sub.titulo}`,
          descricao: `Sub-atividade da tarefa "${task.titulo}"`,
          origem: 'TAREFA',
          tipo: 'TAREFA',
          dataStr: parsedSub.dataStr,
          dataInicio: sub.vencimento.toISOString(),
          hora: '17:00',
          status: sub.concluida ? 'CONCLUIDA' : 'PENDENTE',
          concluida: sub.concluida,
          userId: sub.responsavelId || task.responsavelId || undefined,
          responsavelNome: sub.responsavel?.nome || task.responsavel?.nome,
          responsavelAvatar: sub.responsavel?.avatarUrl || undefined,
          linkUrl: `/tasks`,
        });
      });
    });

    // 4) Formata Reajustes e Vencimentos de Contratos
    contratos.forEach(contrato => {
      const clientName = contrato.client?.nomeFantasia || contrato.client?.razaoSocial || 'Cliente';

      if (contrato.dataReajuste) {
        const parsedReaj = toLocalDateAndHour(contrato.dataReajuste);
        if (parsedReaj) {
          unifiedList.push({
            id: `contrato_reaj_${contrato.id}`,
            sourceId: contrato.id,
            titulo: `Reajuste Contrato (${contrato.indiceReajuste || 'IPCA'}): ${clientName}`,
            descricao: `Valor Mensal: R$ ${(contrato.valorMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            origem: 'CONTRATO',
            tipo: 'VENCIMENTO',
            dataStr: parsedReaj.dataStr,
            dataInicio: contrato.dataReajuste.toISOString(),
            hora: '09:00',
            status: contrato.status,
            clienteNome: clientName,
            linkUrl: `/contratos`,
          });
        }
      }

      if (contrato.dataInicio && contrato.vigenciaMeses) {
        const fimDate = new Date(contrato.dataInicio);
        fimDate.setMonth(fimDate.getMonth() + contrato.vigenciaMeses);
        const parsedFim = toLocalDateAndHour(fimDate);
        if (parsedFim) {
          unifiedList.push({
            id: `contrato_fim_${contrato.id}`,
            sourceId: contrato.id,
            titulo: `Vencimento Contrato: ${clientName}`,
            descricao: `Vigência: ${contrato.vigenciaMeses} meses • Valor Global: R$ ${(contrato.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            origem: 'CONTRATO',
            tipo: 'VENCIMENTO',
            dataStr: parsedFim.dataStr,
            dataInicio: fimDate.toISOString(),
            hora: '09:00',
            status: contrato.status,
            clienteNome: clientName,
            linkUrl: `/contratos`,
          });
        }
      }
    });

    return {
      success: true,
      currentUser: { id: user.id, nome: user.nome, role: user.role },
      users,
      events: unifiedList,
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
    const startDate = new Date(data.dataInicio);
    if (isNaN(startDate.getTime())) {
      return { success: false, error: 'Data de início inválida.' };
    }
    const endDate = data.dataFim
      ? new Date(data.dataFim)
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = await prisma.activity.create({
      data: {
        titulo: data.titulo.trim(),
        descricao: data.descricao?.trim() || null,
        tipo: data.tipo,
        dataInicio: startDate,
        dataFim: endDate,
        status: 'PENDENTE',
        userId: data.userId || user.id,
        leadId: data.leadId || null,
        tenantId: user.tenantId,
      },
    });

    revalidatePath('/calendar');
    revalidatePath('/leads');
    revalidatePath('/tasks');
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
    if (id.startsWith('task_sub_')) {
      const cleanId = id.replace('task_sub_', '');
      const sub = await prisma.taskActivity.findUnique({ where: { id: cleanId } });
      if (sub) {
        await prisma.taskActivity.update({
          where: { id: cleanId },
          data: { concluida: !sub.concluida },
        });
      }
    } else if (id.startsWith('task_')) {
      const cleanId = id.replace('task_', '');
      const task = await prisma.task.findUnique({ where: { id: cleanId } });
      if (task) {
        const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
        await prisma.task.update({
          where: { id: cleanId },
          data: { status: nextStatus },
        });
      }
    } else if (id.startsWith('act_')) {
      const cleanId = id.replace('act_', '');
      const act = await prisma.activity.findUnique({ where: { id: cleanId } });
      if (act) {
        const nextStatus = act.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
        await prisma.activity.update({
          where: { id: cleanId },
          data: { status: nextStatus },
        });
      }
    } else if (id.startsWith('ata_acao_')) {
      const cleanId = id.replace('ata_acao_', '');
      const acao = await prisma.ataAcao.findUnique({ where: { id: cleanId } });
      if (acao) {
        await prisma.ataAcao.update({
          where: { id: cleanId },
          data: {
            concluida: !acao.concluida,
            concluidaEm: !acao.concluida ? new Date() : null,
          },
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
    } else if (id.startsWith('task_sub_')) {
      const cleanId = id.replace('task_sub_', '');
      await prisma.taskActivity.delete({ where: { id: cleanId } });
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
