import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
 
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Z-API Webhook payload received:', JSON.stringify(body));
 
    // 1. EXTRAÇÃO E ISOLAMENTO DO TENANT
    // Captura o tenantId dos Query Params (URL configurada no webhook da Z-API)
    const { searchParams } = new URL(req.url);
    let tenantId = searchParams.get('tenantId');
 
    // Fallback: Se não encontrar na URL, busca no banco pelo instanceId
    if (!tenantId && body.instanceId) {
      const tenant = await prisma.tenant.findFirst({
        where: { whatsappInstanceId: body.instanceId },
        select: { id: true }
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }
 
    // Se ainda assim não identificarmos o tenantId, não prosseguimos para evitar mistura de dados
    if (!tenantId) {
      console.warn('Webhook Z-API ignorado: Não foi possível determinar a empresa (tenantId) dona da mensagem.');
      return NextResponse.json({ received: true, status: 'ignored_no_tenant' });
    }
 
    console.log(`Webhook Z-API roteado para o Tenant ID: ${tenantId}`);
 
    // 2. EVENTOS DE MUDANÇA DE STATUS DE MENSAGENS ENVIADAS (Read Receipts)
    if (body.status && Array.isArray(body.ids)) {
      const status = body.status;
      const ids = body.ids;
 
      console.log(`Z-API Status Update for Tenant [${tenantId}]: [${ids.join(', ')}] -> ${status}`);
 
      // Mapeamento de status
      let dbStatus = 'SENT';
      if (status === 'RECEIVED') {
        dbStatus = 'DELIVERED';
      } else if (status === 'READ' || status === 'READ_BY_ME' || status === 'PLAYED') {
        dbStatus = 'READ';
      }
 
      await prisma.whatsAppMessage.updateMany({
        where: {
          messageId: { in: ids },
          lead: { tenantId: tenantId } // Segurança extra: garante isolamento na atualização
        },
        data: {
          status: dbStatus
        }
      });
 
      return NextResponse.json({ received: true });
    }
 
    // 3. EVENTOS DE DIGITAÇÃO/GRAVAÇÃO DO CLIENTE (Chat Presence)
    if (body.type === 'ChatPresenceCallback' && body.data) {
      const remotePhone = body.data.remoteJid.split('@')[0];
      const status = body.data.status; // composing, recording, paused
 
      console.log(`Z-API Chat Presence for Tenant [${tenantId}]: ${remotePhone} -> ${status}`);
 
      const last8Digits = remotePhone.slice(-8);
 
      // Procurar lead pelo telefone principal garantindo o isolamento da empresa
      let leads = await prisma.lead.findMany({
        where: {
          telefone: { contains: last8Digits },
          tenantId: tenantId
        }
      });
 
      // Se não encontrou pelo principal, busca nos contatos adicionais da empresa
      if (leads.length === 0) {
        const additionalContacts = await prisma.leadContact.findMany({
          where: {
            telefone: { contains: last8Digits },
            lead: { tenantId: tenantId }
          },
          include: {
            lead: true
          }
        });
 
        if (additionalContacts.length > 0) {
          leads = additionalContacts.map(c => c.lead);
        }
      }
 
      if (leads.length > 0) {
        const lead = leads[0];
 
        // Atualizar o status de digitação no lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            typingStatus: status,
            typingUpdatedAt: new Date()
          }
        });
        console.log(`Lead [${lead.nomeFantasia}] (Tenant ${tenantId}) atualizou presença de chat para: ${status}`);
      }
 
      return NextResponse.json({ received: true });
    }
 
    // 4. EVENTOS DE MENSAGEM RECEBIDA (Inbound)
    if (body.isGroup === false && body.phone && (body.text || body.image || body.video || body.audio || body.document)) {
      const phone = body.phone.replace(/\D/g, ''); // Telefone do cliente
      const messageId = body.messageId;
      
      let text = '';
      if (body.text) {
        text = body.text.message || body.text;
      } else if (body.image) {
        const caption = body.image.caption ? ` ${body.image.caption}` : '';
        text = `📷 Foto:${caption}\n${body.image.imageUrl || body.image.url || ''}`;
      } else if (body.video) {
        const caption = body.video.caption ? ` ${body.video.caption}` : '';
        text = `🎥 Vídeo:${caption}\n${body.video.videoUrl || body.video.url || ''}`;
      } else if (body.audio) {
        text = `🎵 Áudio:\n${body.audio.audioUrl || body.audio.url || ''}`;
      } else if (body.document) {
        const docName = body.document.fileName || 'Arquivo';
        text = `📄 Documento: ${docName}\n${body.document.documentUrl || body.document.url || ''}`;
      } else {
        text = '[Mensagem de mídia recebida]';
      }
 
      // Busca flexível considerando DDI/DDD (últimos 8 dígitos)
      const last8Digits = phone.slice(-8);
 
      // Busca na tabela de Leads principal pelo telefone e empresa
      let leads = await prisma.lead.findMany({
        where: {
          telefone: { contains: last8Digits },
          tenantId: tenantId
        }
      });
 
      // Se não encontrou pelo telefone principal, busca nos contatos adicionais da empresa
      if (leads.length === 0) {
        const additionalContacts = await prisma.leadContact.findMany({
          where: {
            telefone: { contains: last8Digits },
            lead: { tenantId: tenantId }
          },
          include: {
            lead: true
          }
        });
 
        if (additionalContacts.length > 0) {
          leads = additionalContacts.map(c => c.lead);
        }
      }
 
      // Se AINDA não encontrou nenhum Lead, cria um automaticamente para aquela empresa
      if (leads.length === 0) {
        let formattedPhone = phone;
        if (phone.length === 13 && phone.startsWith('55')) {
          formattedPhone = `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
        } else if (phone.length === 12 && phone.startsWith('55')) {
          formattedPhone = `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
        } else {
          formattedPhone = `+${phone}`;
        }
 
        // Buscar a primeira etapa do funil (com menor ordem)
        let firstStage = await prisma.leadStage.findFirst({
          orderBy: { ordem: 'asc' }
        });
 
        if (!firstStage) {
          firstStage = await prisma.leadStage.create({
            data: {
              nome: 'Sem Contato',
              ordem: 0,
              color: 'bg-slate-100'
            }
          });
        }
 
        // Criar o Lead automaticamente no funil vinculado ao tenantId correto!
        const newLead = await prisma.lead.create({
          data: {
            nomeFantasia: `WhatsApp: ${formattedPhone}`,
            telefone: formattedPhone,
            stageId: firstStage.id,
            tenantId: tenantId
          }
        });
 
        leads = [newLead];
        console.log(`Novo Lead criado automaticamente via WhatsApp para a empresa ${tenantId}: ${newLead.nomeFantasia}`);
      }
 
      if (leads.length > 0) {
        const lead = leads[0];
 
        // Salvar mensagem recebida no banco vinculada ao lead correto
        await prisma.whatsAppMessage.create({
          data: {
            leadId: lead.id,
            texto: text,
            direction: 'INBOUND',
            status: 'RECEIVED',
            messageId: messageId
          }
        });

        // Criar notificação para o usuário responsável pelo Lead
        const recipientId = lead.assignedToId || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id;
        if (recipientId) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              texto: `💬 WhatsApp: Nova mensagem de ${lead.nomeFantasia}: "${text.substring(0, 30)}..."`,
              link: `/leads?id=${lead.id}`
            }
          });
        }
 
        // Limpa estado de "digitando" ao receber a mensagem
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            typingStatus: 'paused',
            typingUpdatedAt: new Date()
          }
        });
 
        console.log(`Mensagem recebida vinculada ao Lead [${lead.nomeFantasia}] (Tenant ${tenantId}): ${text}`);
      }
    }
 
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Z-API Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
