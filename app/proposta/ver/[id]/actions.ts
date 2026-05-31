'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action pública para buscar um template de minuta por ID
 */
export async function getMinutaTemplateById(templateId: string) {
  try {
    const template = await prisma.templateContrato.findUnique({
      where: { id: templateId },
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });
    return { success: true, data: template };
  } catch (error: any) {
    console.error('Erro ao buscar template de minuta:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para aprovar eletronicamente uma proposta comercial (FPV / Slide Deck)
 */
export async function aprovarPropostaAction(documentoId: string, payload: { nome: string, cpf: string, assinatura: string, ip: string, email?: string }) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento da proposta não encontrado.' };
    }

    const currentConfig = (doc.configApresentacao as any) || {};

    // 1. Atualizar o documento no banco de dados com a assinatura
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        status: 'Aprovada',
        statusAssinatura: 'ASSINADO',
        dataAssinatura: new Date(),
        assinaturaBase64: payload.assinatura,
        ipAssinante: payload.ip,
        nomeAssinante: payload.nome,
        cpfAssinante: payload.cpf,
        configApresentacao: {
          ...currentConfig,
          emailAssinante: payload.email
        }
      }
    });

    // 2. Tentar atualizar também o status da FPV de origem para manter a sincronia
    await prisma.proposta.update({
      where: { id: doc.propostaId },
      data: { status: 'Aprovada' }
    }).catch(err => console.error('Erro ao atualizar FPV associada:', err));

    // 3. Disparar notificação no WhatsApp do Vendedor via Z-API se estiver conectada
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      const cleanPhone = vendedor.celular.replace(/\D/g, '');
      const tenantId = doc.tenantId;

      let instanceId = process.env.ZAPI_INSTANCE_ID;
      let token = process.env.ZAPI_TOKEN;
      let clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            whatsappInstanceId: true,
            whatsappToken: true,
            whatsappClientToken: true
          }
        });
        if (tenant && tenant.whatsappInstanceId && tenant.whatsappToken && tenant.whatsappClientToken) {
          instanceId = tenant.whatsappInstanceId;
          token = tenant.whatsappToken;
          clientToken = tenant.whatsappClientToken;
        }
      }

      if (instanceId && token && clientToken) {
        try {
          const numProposta = String(doc.proposta.numero).padStart(3, '0');
          const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';
          
          const text = `🎉 *PROPOSTA APROVADA!* 🎉\n\n` +
                       `Olá, *${vendedor.nome}*!\n\n` +
                       `Temos ótimas notícias! O cliente *${clienteNome}* acabou de visualizar, aprovar e assinar eletronicamente a proposta comercial *FPV-${numProposta}*!\n\n` +
                       `✍️ *Assinado por:* ${payload.nome}\n` +
                       `🆔 *CPF/CNPJ:* ${payload.cpf}\n` +
                       `🌐 *IP:* ${payload.ip}\n` +
                       `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                       `Parabéns por mais este fechamento! 🚀💼`;

          const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
          await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Client-Token': clientToken
            },
            body: JSON.stringify({
              phone: cleanPhone,
              message: text
            })
          });
        } catch (zapiErr) {
          console.error('Erro ao disparar WhatsApp de fechamento via Z-API:', zapiErr);
        }
      }
    }

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao aprovar proposta eletronicamente:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para recusar/declinar uma proposta comercial e enviar notificação no WhatsApp
 */
export async function recusarPropostaAction(documentoId: string, motivo: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    // 1. Atualizar o documento no banco de dados com a recusa
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        status: 'Recusada',
        statusAssinatura: 'RECUSADO'
      }
    });

    // 2. Atualizar status da FPV
    await prisma.proposta.update({
      where: { id: doc.propostaId },
      data: { status: 'Recusada' }
    }).catch(err => console.error('Erro ao atualizar FPV:', err));

    // 3. Disparar notificação no WhatsApp do Vendedor via Z-API se celular cadastrado
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      const cleanPhone = vendedor.celular.replace(/\D/g, '');
      const tenantId = doc.tenantId;

      let instanceId = process.env.ZAPI_INSTANCE_ID;
      let token = process.env.ZAPI_TOKEN;
      let clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            whatsappInstanceId: true,
            whatsappToken: true,
            whatsappClientToken: true
          }
        });
        if (tenant && tenant.whatsappInstanceId && tenant.whatsappToken && tenant.whatsappClientToken) {
          instanceId = tenant.whatsappInstanceId;
          token = tenant.whatsappToken;
          clientToken = tenant.whatsappClientToken;
        }
      }

      if (instanceId && token && clientToken) {
        try {
          const numProposta = String(doc.proposta.numero).padStart(3, '0');
          const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';
          
          const text = `⚠️ *PROPOSTA RECUSADA* ⚠️\n\n` +
                       `Olá, *${vendedor.nome}*!\n\n` +
                       `O cliente *${clienteNome}* visualizou e *recusou* a proposta comercial *FPV-${numProposta}*.\n\n` +
                       `💬 *Justificativa informada:* ${motivo}\n` +
                       `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                       `Acesse a plataforma para renegociar com o cliente. 📈💼`;

          const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
          await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Client-Token': clientToken
            },
            body: JSON.stringify({
              phone: cleanPhone,
              message: text
            })
          });
        } catch (zapiErr) {
          console.error('Erro ao disparar WhatsApp de recusa:', zapiErr);
        }
      }
    }

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao recusar proposta:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para registrar a visualização de uma aba do cliente
 */
export async function trackDocumentoView(documentoId: string, tabId: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      select: { configApresentacao: true }
    });

    if (!doc) return { success: false, error: 'Documento não encontrado' };

    const config = (doc.configApresentacao as any) || {};
    const tracking = config.viewTracking || {
      firstSentAt: new Date().toISOString(),
      views: {
        apresentacao: 0,
        proposta: 0,
        fpv: 0,
        minuta: 0
      },
      history: []
    };

    // Increment view count for the specific tab
    if (!tracking.views) tracking.views = {};
    tracking.views[tabId] = (tracking.views[tabId] || 0) + 1;

    // Add to history list
    if (!tracking.history) tracking.history = [];
    
    // Prevent recording high frequency repeat clicks within 3 seconds for the same tab
    const now = new Date();
    const lastEvent = tracking.history.length > 0 ? tracking.history[tracking.history.length - 1] : null;
    const isRepeatClick = lastEvent && lastEvent.tab === tabId && (now.getTime() - new Date(lastEvent.viewedAt).getTime() < 3000);

    if (!isRepeatClick) {
      tracking.history.push({
        tab: tabId,
        viewedAt: now.toISOString()
      });
    }

    // Save back to db
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          viewTracking: tracking
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao registrar visualização:', error);
    return { success: false, error: error.message };
  }
}
