'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

export interface ParsedEmail {
  id: string;
  commentId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  userId: string;
  userName: string;
  textoOriginal: string;
  direction: 'SENT' | 'RECEIVED';
  from: string;
  to: string;
  subject: string;
  body: string;
  createdAt: Date;
}

function parseEmailComment(comment: any): ParsedEmail {
  const text = comment.texto || '';
  const isOutbound = text.startsWith('📧 [E-mail Enviado]');
  
  const direction: 'SENT' | 'RECEIVED' = isOutbound ? 'SENT' : 'RECEIVED';
  let from = '';
  let to = comment.lead?.email || '';
  let subject = 'Sem Assunto';
  let body = '';
  
  const lines = text.split('\n');
  
  if (isOutbound) {
    from = comment.user?.nome || 'SmartBid System';
    // Find subject line
    const subjIndex = lines.findIndex((l: string) => l.startsWith('Assunto:'));
    if (subjIndex !== -1) {
      subject = lines[subjIndex].replace('Assunto:', '').trim();
      body = lines.slice(subjIndex + 1).join('\n').trim();
    } else {
      body = lines.slice(1).join('\n').trim();
    }
  } else {
    // Inbound
    const deIndex = lines.findIndex((l: string) => l.startsWith('De:'));
    const subjIndex = lines.findIndex((l: string) => l.startsWith('Assunto:'));
    
    if (deIndex !== -1) {
      from = lines[deIndex].replace('De:', '').trim();
    } else {
      from = comment.lead?.email || 'Desconhecido';
    }
    
    if (subjIndex !== -1) {
      subject = lines[subjIndex].replace('Assunto:', '').trim();
      body = lines.slice(subjIndex + 1).join('\n').trim();
    } else {
      body = lines.slice(Math.max(deIndex, 0) + 1).join('\n').trim();
    }
  }
  
  // Clean double-newliness or spacing in body
  body = body.trim();
  
  return {
    id: comment.id,
    commentId: comment.id,
    leadId: comment.leadId,
    leadName: comment.lead?.nomeFantasia || 'Sem Nome',
    leadEmail: comment.lead?.email || '',
    userId: comment.userId,
    userName: comment.user?.nome || 'Sistema',
    textoOriginal: text,
    direction,
    from,
    to,
    subject,
    body,
    createdAt: comment.createdAt
  };
}

export async function getEmails() {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        texto: {
          startsWith: '📧 [E-mail'
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            nomeFantasia: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return comments.map(parseEmailComment);
  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    return [];
  }
}

export async function deleteEmail(commentId: string) {
  try {
    await prisma.comment.delete({
      where: { id: commentId }
    });
    revalidatePath('/emails');
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting email comment:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function getSmtpAccounts() {
  try {
    const accounts = await prisma.smtpAccount.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, accounts };
  } catch (error: any) {
    console.error('❌ Error getting SMTP accounts:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function createSmtpAccount(data: {
  nome: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  active?: boolean;
}) {
  try {
    // Se for ativar esta, desativa as outras para garantir somente uma ativa por vez
    if (data.active) {
      await prisma.smtpAccount.updateMany({
        data: { active: false }
      });
    }

    const account = await prisma.smtpAccount.create({
      data: {
        nome: data.nome,
        host: data.host,
        port: Number(data.port),
        user: data.user,
        password: data.password || '',
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        active: data.active !== undefined ? data.active : true,
      }
    });

    revalidatePath('/emails');
    return { success: true, account };
  } catch (error: any) {
    console.error('❌ Error creating SMTP account:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function updateSmtpAccount(id: string, data: {
  nome?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
  active?: boolean;
}) {
  try {
    // Se for ativar esta, desativa as outras
    if (data.active) {
      await prisma.smtpAccount.updateMany({
        where: { id: { not: id } },
        data: { active: false }
      });
    }

    const updateData: any = { ...data };
    if (data.port !== undefined) {
      updateData.port = Number(data.port);
    }

    const account = await prisma.smtpAccount.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/emails');
    return { success: true, account };
  } catch (error: any) {
    console.error('❌ Error updating SMTP account:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function deleteSmtpAccount(id: string) {
  try {
    await prisma.smtpAccount.delete({
      where: { id }
    });
    revalidatePath('/emails');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting SMTP account:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function toggleSmtpAccountActive(id: string, active: boolean) {
  try {
    if (active) {
      // Desativa todas as outras contas
      await prisma.smtpAccount.updateMany({
        where: { id: { not: id } },
        data: { active: false }
      });
    }

    const account = await prisma.smtpAccount.update({
      where: { id },
      data: { active }
    });

    revalidatePath('/emails');
    return { success: true, account };
  } catch (error: any) {
    console.error('❌ Error toggling SMTP account active state:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function syncEmailsFromImap() {
  try {
    const activeAccount = await prisma.smtpAccount.findFirst({
      where: { active: true }
    });

    if (!activeAccount || !activeAccount.imapHost) {
      console.warn("⚠️ No active SMTP/IMAP account with IMAP host found in database. Skipping IMAP sync.");
      return { success: true, count: 0, message: "Nenhuma conta IMAP ativa configurada no banco de dados." };
    }

    const { imapHost, imapPort, user, password } = activeAccount;
    const port = imapPort || 993;

    // Connect to IMAP
    const client = new ImapFlow({
      host: imapHost,
      port,
      secure: port === 993,
      auth: {
        user,
        pass: password
      },
      logger: false
    });

    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    let importedCount = 0;

    try {
      const status = await client.status('INBOX', { messages: true });
      const totalMessages = status.messages || 0;

      if (totalMessages > 0) {
        // Fetch last 30 messages
        const startSeq = Math.max(1, totalMessages - 29);
        const range = `${startSeq}:${totalMessages}`;

        for await (let message of client.fetch(range, { envelope: true, source: true })) {
          const envelope = message.envelope;
          if (!envelope) continue;

          const fromEmail = envelope.from && envelope.from[0]
            ? `${envelope.from[0].address}`.trim().toLowerCase()
            : '';

          if (!fromEmail) continue;

          // Find Lead
          const lead = await prisma.lead.findFirst({
            where: {
              email: {
                equals: fromEmail,
                mode: 'insensitive'
              }
            }
          });

          if (lead && message.source) {
            const parsed: any = await simpleParser(message.source);
            const subject = parsed.subject || 'Sem Assunto';
            const body = parsed.text || parsed.textAsHtml || '(Sem conteúdo de texto)';
            const date = parsed.date || new Date();
            
            const fromHeader = parsed.from && parsed.from.text ? parsed.from.text : fromEmail;

            // Check duplicate
            const uniqueKeyword = `De: ${fromHeader}\nAssunto: ${subject}`;
            const existingComment = await prisma.comment.findFirst({
              where: {
                leadId: lead.id,
                texto: {
                  contains: uniqueKeyword
                }
              }
            });

            if (!existingComment) {
              await prisma.comment.create({
                data: {
                  leadId: lead.id,
                  userId: lead.assignedToId || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || '',
                  texto: `📧 [E-mail Recebido]\nDe: ${fromHeader}\nAssunto: ${subject}\n\n${body}`,
                  createdAt: date
                }
              });

              await prisma.leadHistory.create({
                data: {
                  leadId: lead.id,
                  tipo: 'EMAIL',
                  descricao: `E-mail recebido de ${fromEmail}: ${subject}`,
                  createdAt: date
                }
              });

              importedCount++;
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    
    revalidatePath('/emails');
    revalidatePath('/leads');

    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error('❌ Error syncing emails from IMAP:', error);
    return { success: false, error: error.message || String(error) };
  }
}
