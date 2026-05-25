'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

// Mock function until Z-API keys are provided
async function dispatchZApiMessage(phone: string, text: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    console.warn('Z-API credentials or client-token missing. Mocking success.');
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
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

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { typingStatus: true, typingUpdatedAt: true }
    });

    let isTyping = false;
    let isRecording = false;

    if (lead?.typingStatus && lead.typingStatus !== 'paused' && lead.typingUpdatedAt) {
      // consider typing status expired if older than 8 seconds
      const elapsedMs = Date.now() - new Date(lead.typingUpdatedAt).getTime();
      if (elapsedMs < 8000) {
        isTyping = lead.typingStatus === 'composing';
        isRecording = lead.typingStatus === 'recording';
      }
    }

    return { success: true, messages, isTyping, isRecording };
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

export async function sendWhatsAppMedia(
  leadId: string,
  fileBase64: string,
  fileName: string,
  mimeType: string,
  caption?: string
) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Não autorizado.' };

  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    return { success: false, error: 'Credenciais Z-API ou Client-Token ausentes.' };
  }

  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || !lead.telefone) {
      return { success: false, error: 'Lead não encontrado ou sem telefone cadastrado.' };
    }

    const cleanPhone = lead.telefone.replace(/\D/g, '');

    // Determine type and endpoint
    let endpoint = '';
    let body: any = { phone: cleanPhone };

    if (mimeType.startsWith('image/')) {
      endpoint = 'send-image';
      body.image = fileBase64;
      if (caption) {
        body.caption = `*${user.nome}*:\n${caption}`;
      } else {
        body.caption = `*${user.nome}*`;
      }
    } else if (mimeType.startsWith('video/')) {
      endpoint = 'send-video';
      body.video = fileBase64;
      if (caption) {
        body.caption = `*${user.nome}*:\n${caption}`;
      } else {
        body.caption = `*${user.nome}*`;
      }
    } else {
      // Document
      const ext = fileName.split('.').pop() || 'pdf';
      endpoint = `send-document/${ext}`;
      body.document = fileBase64;
      body.fileName = fileName;
    }

    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/${endpoint}`;
    
    console.log(`Sending media via Z-API ${endpoint} to phone ${cleanPhone}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      const displayText = caption 
        ? `*${user.nome}*: [Mídia: ${fileName}] ${caption}` 
        : `*${user.nome}*: [Arquivo: ${fileName}]`;

      const msg = await prisma.whatsAppMessage.create({
        data: {
          leadId,
          texto: displayText,
          direction: 'OUTBOUND',
          status: 'SENT',
          messageId: data.messageId || ('mock-media-' + Date.now()),
          userId: user.id
        }
      });

      revalidatePath('/leads');
      return { success: true, message: msg };
    } else {
      return { success: false, error: data.error || 'Erro retornado pela Z-API ao enviar arquivo.' };
    }
  } catch (err: any) {
    console.error('sendWhatsAppMedia error:', err);
    return { success: false, error: err.message };
  }
}

export async function markWhatsAppMessagesAsRead(leadId: string) {
  try {
    await prisma.whatsAppMessage.updateMany({
      where: {
        leadId,
        direction: 'INBOUND',
        status: { not: 'READ' }
      },
      data: {
        status: 'READ'
      }
    });
    revalidatePath('/leads');
    return { success: true };
  } catch (err: any) {
    console.error('markWhatsAppMessagesAsRead error:', err);
    return { success: false, error: err.message };
  }
}
