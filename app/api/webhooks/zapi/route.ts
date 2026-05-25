import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Z-API Webhook payload:', JSON.stringify(body));

    // 1. Eventos de mudança de status de mensagens enviadas (Read Receipts)
    if (body.status && Array.isArray(body.ids)) {
      const status = body.status;
      const ids = body.ids;

      console.log(`Z-API Status Update: [${ids.join(', ')}] -> ${status}`);

      // Map Z-API status to our db status
      // Z-API: SENT, RECEIVED, READ, PLAYED, FAILED
      // DB: SENT, DELIVERED, READ
      let dbStatus = 'SENT';
      if (status === 'RECEIVED') {
        dbStatus = 'DELIVERED';
      } else if (status === 'READ' || status === 'READ_BY_ME' || status === 'PLAYED') {
        dbStatus = 'READ';
      }

      await prisma.whatsAppMessage.updateMany({
        where: {
          messageId: {
            in: ids
          }
        },
        data: {
          status: dbStatus
        }
      });

      return NextResponse.json({ received: true });
    }

    // 2. Eventos de digitação/gravação do cliente (Chat Presence)
    if (body.type === 'ChatPresenceCallback' && body.data) {
      const remotePhone = body.data.remoteJid.split('@')[0];
      const status = body.data.status; // composing, recording, paused

      console.log(`Z-API Chat Presence: ${remotePhone} -> ${status}`);

      const last8Digits = remotePhone.slice(-8);

      // Procurar lead pelo telefone principal
      let leads = await prisma.lead.findMany({
        where: {
          telefone: {
            contains: last8Digits
          }
        }
      });

      // Se não encontrou pelo telefone principal, busca nos contatos adicionais!
      if (leads.length === 0) {
        const additionalContacts = await prisma.leadContact.findMany({
          where: {
            telefone: {
              contains: last8Digits
            }
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
        console.log(`Lead [${lead.nomeFantasia}] atualizou presença de chat para: ${status}`);
      }

      return NextResponse.json({ received: true });
    }

    // 3. Eventos de mensagem recebida (Inbound)
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

      // Procurar lead que tenha esse número no campo telefone (ou contatos adicionais!)
      // Busca os últimos 8 dígitos para ser flexível com DDI/DDD
      const last8Digits = phone.slice(-8);

      // Busca na tabela de Leads principal pelo telefone
      let leads = await prisma.lead.findMany({
        where: {
          telefone: {
            contains: last8Digits
          }
        }
      });

      // Se não encontrou pelo telefone principal, busca nos contatos adicionais!
      if (leads.length === 0) {
        const additionalContacts = await prisma.leadContact.findMany({
          where: {
            telefone: {
              contains: last8Digits
            }
          },
          include: {
            lead: true
          }
        });

        if (additionalContacts.length > 0) {
          leads = additionalContacts.map(c => c.lead);
        }
      }

      // Se AINDA não encontrou nenhum Lead, cria um automaticamente para não perder a mensagem nem o contato!
      if (leads.length === 0) {
        // Formatar telefone de forma elegante: +55 (DD) XXXXX-XXXX
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

        // Criar o Lead automaticamente no funil
        const newLead = await prisma.lead.create({
          data: {
            nomeFantasia: `WhatsApp: ${formattedPhone}`,
            telefone: formattedPhone,
            stageId: firstStage.id
          }
        });

        leads = [newLead];
        console.log(`Novo Lead criado automaticamente via WhatsApp: ${newLead.nomeFantasia}`);
      }

      if (leads.length > 0) {
        const lead = leads[0];

        // Salvar mensagem recebida no banco
        await prisma.whatsAppMessage.create({
          data: {
            leadId: lead.id,
            texto: text,
            direction: 'INBOUND',
            status: 'RECEIVED',
            messageId: messageId
          }
        });

        // Limpa estado de digitando ao receber a mensagem
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            typingStatus: 'paused',
            typingUpdatedAt: new Date()
          }
        });

        console.log(`Mensagem recebida vinculada ao Lead [${lead.nomeFantasia}]: ${text}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Z-API Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
