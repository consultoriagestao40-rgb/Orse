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

    // 2. Eventos de mensagem recebida (Inbound)
    if (body.isGroup === false && body.text && body.phone) {
      const phone = body.phone.replace(/\D/g, ''); // Telefone do cliente
      const messageId = body.messageId;
      const text = body.text.message || body.text;

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

        console.log(`Mensagem recebida vinculada ao Lead [${lead.nomeFantasia}]: ${text}`);
      } else {
        console.log(`Nenhum Lead correspondente encontrado para o telefone: ${phone}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Z-API Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
