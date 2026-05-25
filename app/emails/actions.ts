'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export function parseEmailComment(comment: any): ParsedEmail {
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
