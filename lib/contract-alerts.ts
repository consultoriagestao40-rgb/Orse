import { prisma } from '@/lib/prisma';
import { formatServerDateTime } from '@/lib/timezone';
import { sendOfficialWhatsAppNotification, normalizeBrazilPhone } from '@/lib/whatsapp-official';

export interface ContractAlertsResult {
  checkedContracts: number;
  checkedCcts: number;
  alertsTriggered: number;
  whatsappSent: number;
  details: string[];
}

function getBrasiliaMidnightUTC(dateInput: Date = new Date()): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = fmt.format(dateInput).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toCalendarMidnightUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function formatDateBrUTC(d: Date): string {
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function resolveMilestoneBucket(daysLeft: number): '45d' | '30d' | '15d' | '7d' | '0d' | null {
  if (daysLeft >= 31 && daysLeft <= 45) return '45d';
  if (daysLeft >= 16 && daysLeft <= 30) return '30d';
  if (daysLeft >= 8 && daysLeft <= 15) return '15d';
  if (daysLeft >= 1 && daysLeft <= 7) return '7d';
  if (daysLeft >= -7 && daysLeft <= 0) return '0d';
  return null;
}

function formatContractNumber(c: any): string {
  if (!c?.proposta) return c?.id?.slice(0, 8)?.toUpperCase() || 'S/N';
  const numProp = String(c.proposta.numero || 0).padStart(3, '0');
  const numRev = String(c.proposta.versoes?.[0]?.versao || 1).padStart(2, '0');
  const d = c.dataInicio ? new Date(c.dataInicio) : new Date(c.createdAt || Date.now());
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const y = String(d.getUTCFullYear());
  return `${numProp}.${numRev}.${m}.${y}`;
}

function computeNextAnnualReadjustment(dataInicio: Date, todayUTC: Date): Date {
  const start = toCalendarMidnightUTC(dataInicio);
  let year = start.getUTCFullYear() + 1;
  let candidate = new Date(Date.UTC(year, start.getUTCMonth(), start.getUTCDate()));
  // Avança aniversários já passados há mais de 7 dias para apontar para o próximo ciclo anual
  while ((candidate.getTime() - todayUTC.getTime()) / 86400000 < -7) {
    year += 1;
    candidate = new Date(Date.UTC(year, start.getUTCMonth(), start.getUTCDate()));
  }
  return candidate;
}

export async function runContractAndReajusteAlerts(options?: {
  tenantId?: string;
  forceCheck?: boolean;
}): Promise<ContractAlertsResult> {
  const todayUTC = getBrasiliaMidnightUTC();
  const todayIsoDate = todayUTC.toISOString().slice(0, 10);
  const nowBrStr = formatServerDateTime(new Date(), 'America/Sao_Paulo');
  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const tenants = await prisma.tenant.findMany({
    where: {
      ativo: true,
      ...(options?.tenantId ? { id: options.tenantId } : {}),
    },
    include: {
      users: {
        where: { role: { in: ['ADMIN', 'MANAGER'] } },
        select: { id: true, nome: true, celular: true, role: true, timezone: true },
      },
    },
  });

  const result: ContractAlertsResult = {
    checkedContracts: 0,
    checkedCcts: 0,
    alertsTriggered: 0,
    whatsappSent: 0,
    details: [],
  };

  for (const tenant of tenants) {
    const feat =
      tenant.features && typeof tenant.features === 'object'
        ? { ...(tenant.features as Record<string, any>) }
        : {};

    // Se for disparo oportunista ao abrir /contratos (sem forceCheck), roda no máximo 1x por dia por tenant
    if (options?.tenantId && !options?.forceCheck && feat.lastContractAlertScanDate === todayIsoDate) {
      continue;
    }

    const sentMap: Record<string, string> =
      feat.sentContractAlerts && typeof feat.sentContractAlerts === 'object'
        ? { ...feat.sentContractAlerts }
        : {};

    // Limpa chaves antigas (> 150 dias) para manter o JSON enxuto
    const cutoffMs = Date.now() - 150 * 86400000;
    for (const [k, ts] of Object.entries(sentMap)) {
      const t = new Date(ts).getTime();
      if (!isNaN(t) && t < cutoffMs) {
        delete sentMap[k];
      }
    }

    let dirtyTenantFeatures = feat.lastContractAlertScanDate !== todayIsoDate;
    feat.lastContractAlertScanDate = todayIsoDate;

    // 1. Avalia Contratos vigentes / pendentes de reajuste do Tenant
    const contratos = await prisma.contrato.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
        client: true,
        proposta: {
          include: {
            user: { select: { id: true, nome: true, celular: true, timezone: true } },
            versoes: { orderBy: { versao: 'desc' }, take: 1 },
          },
        },
      },
    });

    for (const c of contratos) {
      const statusLower = (c.status || '').toLowerCase();
      if (
        statusLower.includes('encerrad') ||
        statusLower.includes('cancelad') ||
        statusLower.includes('rescind') ||
        statusLower.includes('inativ')
      ) {
        continue;
      }

      result.checkedContracts += 1;

      const reajusteDate = c.dataReajuste
        ? toCalendarMidnightUTC(new Date(c.dataReajuste))
        : c.dataInicio
        ? computeNextAnnualReadjustment(new Date(c.dataInicio), todayUTC)
        : null;

      const vencimentoDate =
        c.dataInicio && c.vigenciaMeses
          ? new Date(
              Date.UTC(
                new Date(c.dataInicio).getUTCFullYear(),
                new Date(c.dataInicio).getUTCMonth() + Number(c.vigenciaMeses),
                new Date(c.dataInicio).getUTCDate()
              )
            )
          : null;

      const eventsToCheck: Array<{
        kind: 'REAJUSTE' | 'VENCIMENTO' | 'VENCIMENTO_E_REAJUSTE';
        targetDate: Date;
      }> = [];

      if (
        reajusteDate &&
        vencimentoDate &&
        reajusteDate.toISOString().slice(0, 10) === vencimentoDate.toISOString().slice(0, 10)
      ) {
        eventsToCheck.push({ kind: 'VENCIMENTO_E_REAJUSTE', targetDate: reajusteDate });
      } else {
        if (reajusteDate) eventsToCheck.push({ kind: 'REAJUSTE', targetDate: reajusteDate });
        if (vencimentoDate) eventsToCheck.push({ kind: 'VENCIMENTO', targetDate: vencimentoDate });
      }

      for (const ev of eventsToCheck) {
        const daysLeft = Math.round((ev.targetDate.getTime() - todayUTC.getTime()) / 86400000);
        const bucket = resolveMilestoneBucket(daysLeft);
        if (!bucket) continue;

        const targetIso = ev.targetDate.toISOString().slice(0, 10);
        const alertKey = `CT_${c.id}_${ev.kind}_${targetIso}_${bucket}`;
        if (sentMap[alertKey]) continue;

        sentMap[alertKey] = new Date().toISOString();
        dirtyTenantFeatures = true;
        result.alertsTriggered += 1;

        const numContrato = formatContractNumber(c);
        const clienteNome = c.client?.nomeFantasia || c.client?.razaoSocial || 'Cliente';
        const indice = c.indiceReajuste || 'IPCA / CCT';
        const dataAlvoBr = formatDateBrUTC(ev.targetDate);
        const valorMensalFmt = fmtCurrency(c.valorMensal || 0);

        const prazoTexto =
          daysLeft < 0
            ? `venceu há ${Math.abs(daysLeft)} dia(s) (${dataAlvoBr})`
            : daysLeft === 0
            ? `é HOJE (${dataAlvoBr})`
            : `em ${daysLeft} dia(s) (${dataAlvoBr})`;

        const tipoLabel =
          ev.kind === 'REAJUSTE'
            ? `Reajuste de Contrato (${indice})`
            : ev.kind === 'VENCIMENTO'
            ? `Vencimento de Contrato`
            : `Vencimento e Reajuste (${indice})`;

        const notifText = `📅 ${tipoLabel}: O contrato ${numContrato} do cliente ${clienteNome} (${valorMensalFmt}/mês) tem data prevista ${prazoTexto}. Prepare a repactuação/renovação!`;

        // Destinatários internos (Admins + Managers + Vendedor dono da proposta)
        const recipientUserIds = new Set<string>();
        for (const u of tenant.users) recipientUserIds.add(u.id);
        if (c.proposta?.user?.id) recipientUserIds.add(c.proposta.user.id);

        for (const uid of recipientUserIds) {
          await prisma.notification
            .create({
              data: {
                userId: uid,
                texto: notifText,
                link: `/contratos/${c.id}`,
              },
            })
            .catch(() => {});

          try {
            const { sendWebPush } = await import('@/app/notifications/actions');
            await sendWebPush(
              uid,
              `📅 ${tipoLabel} — ${clienteNome}`,
              `Contrato ${numContrato} (${valorMensalFmt}/mês): ${prazoTexto}.`,
              `/contratos/${c.id}`
            );
          } catch {}
        }

        // Destinatários de WhatsApp (deduplicados por número normalizado)
        const phoneMap = new Map<string, string>();
        for (const u of tenant.users) {
          if (u.celular) {
            const norm = normalizeBrazilPhone(u.celular);
            if (norm) phoneMap.set(norm, u.nome);
          }
        }
        if (c.proposta?.user?.celular) {
          const norm = normalizeBrazilPhone(c.proposta.user.celular);
          if (norm && !phoneMap.has(norm)) phoneMap.set(norm, c.proposta.user.nome);
        }
        if (phoneMap.size === 0 && tenant.whatsappPhone) {
          const norm = normalizeBrazilPhone(tenant.whatsappPhone);
          if (norm) phoneMap.set(norm, tenant.nomeFantasia);
        }

        for (const [phone, recipientName] of phoneMap.entries()) {
          const whatsMsg =
            `📅 *ALERTA DE ${ev.kind === 'VENCIMENTO' ? 'VENCIMENTO DE CONTRATO' : 'REAJUSTE DE CONTRATO'}* 📅\n\n` +
            `Olá, *${recipientName}*!\n\n` +
            `O contrato *${numContrato}* do cliente *${clienteNome}* entrou na janela de atenção para *${tipoLabel.toLowerCase()}*:\n\n` +
            `🏢 *Cliente:* ${clienteNome}\n` +
            `📄 *Contrato:* ${numContrato}\n` +
            `💰 *Valor Mensal Atual:* ${valorMensalFmt}\n` +
            `📈 *Índice / Base:* ${indice}\n` +
            `🗓️ *Data Prevista:* ${dataAlvoBr} (${daysLeft < 0 ? `atrasado há ${Math.abs(daysLeft)} dias` : daysLeft === 0 ? 'HOJE' : `faltam ${daysLeft} dias`})\n` +
            `🕒 *Alerta gerado em:* ${nowBrStr}\n\n` +
            `💡 _Acesse o módulo de Contratos no SmartBid para calcular o reajuste e enviar o comunicado oficial ao cliente sem perder margem!_\n` +
            `_Notificação Oficial • SmartBidHub_`;

          const wRes = await sendOfficialWhatsAppNotification({
            phone,
            message: whatsMsg,
            fallbackTenantId: tenant.id,
          }).catch(() => ({ success: false }));

          if (wRes.success) result.whatsappSent += 1;
        }

        result.details.push(`${tenant.nomeFantasia}: ${alertKey}`);
      }
    }

    // 2. Avalia Data-Base de Convenções Coletivas (CCT) próximas do fim de vigência (30d, 15d, 7d, 0d)
    const ccts = await prisma.cCT.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, nome: true, uf: true, cidade: true, vigenciaFim: true },
    });

    for (const cct of ccts) {
      if (!cct.vigenciaFim) continue;
      result.checkedCcts += 1;

      const fimUTC = toCalendarMidnightUTC(new Date(cct.vigenciaFim));
      const daysLeft = Math.round((fimUTC.getTime() - todayUTC.getTime()) / 86400000);
      const bucket = resolveMilestoneBucket(daysLeft);
      if (!bucket || bucket === '45d') continue; // Para CCT avisamos em 30d, 15d, 7d e no vencimento

      const fimIso = fimUTC.toISOString().slice(0, 10);
      const cctKey = `CCT_${cct.id}_${fimIso}_${bucket}`;
      if (sentMap[cctKey]) continue;

      sentMap[cctKey] = new Date().toISOString();
      dirtyTenantFeatures = true;
      result.alertsTriggered += 1;

      const dataBaseBr = formatDateBrUTC(fimUTC);
      const localLabel = [cct.cidade, cct.uf].filter(Boolean).join('/');
      const prazoCct =
        daysLeft < 0
          ? `venceu há ${Math.abs(daysLeft)} dia(s) (${dataBaseBr})`
          : daysLeft === 0
          ? `vence HOJE (${dataBaseBr})`
          : `vence em ${daysLeft} dia(s) (${dataBaseBr})`;

      const cctNotifText = `📑 Data-Base CCT: A convenção "${cct.nome}" (${localLabel}) ${prazoCct}. Atualize pisos e benefícios para repactuar seus contratos!`;

      for (const u of tenant.users) {
        await prisma.notification
          .create({
            data: {
              userId: u.id,
              texto: cctNotifText,
              link: `/ccts`,
            },
          })
          .catch(() => {});

        try {
          const { sendWebPush } = await import('@/app/notifications/actions');
          await sendWebPush(u.id, `📑 Data-Base CCT (${localLabel})`, cctNotifText, `/ccts`);
        } catch {}
      }

      const adminPhones = new Map<string, string>();
      for (const u of tenant.users) {
        if (u.celular) {
          const norm = normalizeBrazilPhone(u.celular);
          if (norm) adminPhones.set(norm, u.nome);
        }
      }
      if (adminPhones.size === 0 && tenant.whatsappPhone) {
        const norm = normalizeBrazilPhone(tenant.whatsappPhone);
        if (norm) adminPhones.set(norm, tenant.nomeFantasia);
      }

      for (const [phone, recipientName] of adminPhones.entries()) {
        const cctWhats =
          `📑 *ALERTA DE DATA-BASE / CONVENÇÃO COLETIVA* 📑\n\n` +
          `Olá, *${recipientName}*!\n\n` +
          `A convenção coletiva *${cct.nome}* (${localLabel}) ${prazoCct}.\n\n` +
          `🗓️ *Fim de Vigência / Data-Base:* ${dataBaseBr}\n` +
          `🕒 *Alerta gerado em:* ${nowBrStr}\n\n` +
          `💡 _Assim que sair a nova CCT, atualize no SmartBid para recalcular seus contratos e proteger sua margem!_\n` +
          `_Notificação Oficial • SmartBidHub_`;

        const wRes = await sendOfficialWhatsAppNotification({
          phone,
          message: cctWhats,
          fallbackTenantId: tenant.id,
        }).catch(() => ({ success: false }));

        if (wRes.success) result.whatsappSent += 1;
      }

      result.details.push(`${tenant.nomeFantasia}: ${cctKey}`);
    }

    if (dirtyTenantFeatures) {
      feat.sentContractAlerts = sentMap;
      await prisma.tenant
        .update({
          where: { id: tenant.id },
          data: { features: feat as any },
        })
        .catch((err) => console.error('Erro ao salvar sentContractAlerts no Tenant:', err));
    }
  }

  return result;
}
