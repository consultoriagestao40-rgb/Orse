import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { from, to, subject, text, html } = body;

    if (!from) {
      return NextResponse.json({ success: false, error: "Missing 'from' address" }, { status: 400 });
    }

    // Clean sender email to extract only the email address (e.g. "John Doe <john@example.com>" -> "john@example.com")
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    const cleanFromEmail = emailMatch[1].trim().toLowerCase();

    // Look up the lead by their primary email
    const lead = await prisma.lead.findFirst({
      where: {
        email: {
          equals: cleanFromEmail,
          mode: 'insensitive',
        },
      },
    });

    if (!lead) {
      console.warn(`[INBOUND EMAIL] No lead found matching email: ${cleanFromEmail}`);
      return NextResponse.json({ success: false, message: 'No matching lead found' }, { status: 200 });
    }

    const emailBody = text || html || '(Sem conteúdo de texto)';

    // Find a valid user to associate this inbound comment with
    let targetUserId = lead.assignedToId;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      }) || await prisma.user.findFirst();
      targetUserId = defaultUser?.id || '';
    }

    if (!targetUserId) {
      console.warn(`[INBOUND EMAIL] No user found in system to attach comments to.`);
      return NextResponse.json({ success: false, error: 'No user exists in database' }, { status: 400 });
    }

    // Register email as a Comment in the lead's main feed
    await prisma.comment.create({
      data: {
        leadId: lead.id,
        userId: targetUserId,
        texto: `📧 [E-mail Recebido]\nDe: ${from}\nAssunto: ${subject || 'Sem Assunto'}\n\n${emailBody}`
      }
    });

    // Register in LeadHistory for auditing
    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        tipo: 'EMAIL',
        descricao: `E-mail recebido de ${cleanFromEmail}: ${subject || 'Sem Assunto'}`
      }
    });

    console.log(`📧 Inbound email logged for Lead ID ${lead.id} matching sender ${cleanFromEmail}`);
    return NextResponse.json({ success: true, logged: true });
  } catch (error: any) {
    console.error('❌ Error handling inbound email webhook:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
