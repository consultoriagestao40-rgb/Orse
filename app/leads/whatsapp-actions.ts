'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

// Mock function until Z-API keys are provided
async function dispatchZApiMessage(phone: string, text: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    console.warn('Z-API credentials missing. Mocking success.');
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ''),
        message: text
      })
    });
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, messageId: data.messageId };
    } else {
      return { success: false, error: data.error || 'Erro ao enviar via Z-API' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getWhatsAppMessages(leadId: string) {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where: { leadId },
      include: { user: { select: { nome: true } } },
      orderBy: { createdAt: 'asc' }
    });
    return { success: true, messages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppMessage(leadId: string, texto: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || !lead.telefone) {
      return { success: false, error: 'Lead não encontrado ou sem telefone cadastrado.' };
    }

    // Carimbo do remetente
    const formattedTexto = `*${user.nome}*:\n${texto}`;

    const zapiRes = await dispatchZApiMessage(lead.telefone, formattedTexto);

    if (!zapiRes.success) {
      return { success: false, error: zapiRes.error };
    }

    const message = await prisma.whatsAppMessage.create({
      data: {
        leadId,
        userId: user.id,
        texto: formattedTexto,
        direction: 'OUTBOUND',
        status: 'SENT',
        messageId: zapiRes.messageId
      }
    });

    revalidatePath('/leads');
    return { success: true, message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
