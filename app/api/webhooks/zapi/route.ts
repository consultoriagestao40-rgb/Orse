import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Eventos de mensagem recebida
    if (body.isGroup === false && body.text && body.phone) {
      const phone = body.phone.replace(/\D/g, ''); // Telefone do cliente
      const messageId = body.messageId;
      const text = body.text.message || body.text;

      // 1. Procurar lead que tenha esse número no campo telefone
      // Simplificação: no mundo real, seria necessário formatar e buscar corretamente
      const leads = await prisma.lead.findMany({
        where: {
          telefone: {
            contains: phone.slice(-8) // Busca os ultimos 8 dígitos para ser flexível com DDI/DDD
          }
        }
      });

      if (leads.length > 0) {
        // Pega o primeiro lead correspondente
        const lead = leads[0];

        // 2. Salvar mensagem no histórico do lead
        await prisma.whatsAppMessage.create({
          data: {
            leadId: lead.id,
            texto: text,
            direction: 'INBOUND',
            status: 'RECEIVED',
            messageId: messageId
          }
        });

        // 3. (Opcional) Poderíamos criar um LeadHistory avisando que chegou msg
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Z-API Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
