'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

// Auto-migration helper to ensure the InternalMessage table exists in the DB
export async function ensureInternalMessageTableExists() {
  try {
    // Check if table exists
    await prisma.$queryRaw`SELECT 1 FROM "InternalMessage" LIMIT 1`;
  } catch (err) {
    console.log("A tabela InternalMessage não existe. Criando-a...");
    try {
      // Create the table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InternalMessage" (
          "id" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "InternalMessage_pkey" PRIMARY KEY ("id")
        );
      `);

      // Create indexes and foreign keys safely
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_senderId_fkey" 
          FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (fkErr) {
        console.log("Foreign key de senderId já existe ou erro ignorado:", fkErr);
      }

      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "InternalMessage" ADD CONSTRAINT "InternalMessage_receiverId_fkey" 
          FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (fkErr) {
        console.log("Foreign key de receiverId já existe ou erro ignorado:", fkErr);
      }

      console.log("Tabela InternalMessage criada com sucesso!");
    } catch (createErr: any) {
      console.error("Falha ao criar a tabela InternalMessage:", createErr);
    }
  }
}

// Send an internal message to another system user
export async function sendInternalMessage(receiverId: string, content: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Usuário não autenticado.' };
  if (!content || !content.trim()) return { success: false, error: 'Mensagem vazia.' };

  await ensureInternalMessageTableExists();

  try {
    // Validação rígida: garantir que o destinatário pertence ao mesmo tenant
    if (user.tenantId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { tenantId: true }
      });
      if (!receiver || receiver.tenantId !== user.tenantId) {
        return { success: false, error: 'Acesso não autorizado ou usuário de outro inquilino.' };
      }
    }

    const message = await prisma.internalMessage.create({
      data: {
        senderId: user.id,
        receiverId,
        content: content.trim(),
        read: false
      }
    });

    // Create a system notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        texto: `💬 Nova mensagem de ${user.nome}: "${content.length > 50 ? content.substring(0, 47) + '...' : content}"`,
        link: `/leads` // or mobile chat link if opened from mobile
      }
    });

    revalidatePath('/leads');
    return { success: true, message };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem interna:', error);
    return { success: false, error: error.message };
  }
}

// Fetch chat history between the logged user and another user
export async function getInternalMessages(otherUserId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Usuário não autenticado.' };

  await ensureInternalMessageTableExists();

  try {
    // Validação rígida: garantir que o outro usuário pertence ao mesmo tenant
    if (user.tenantId) {
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { tenantId: true }
      });
      if (!otherUser || otherUser.tenantId !== user.tenantId) {
        return { success: false, error: 'Acesso não autorizado ou usuário de outro inquilino.' };
      }
    }

    const messages = await prisma.internalMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, messages };
  } catch (error: any) {
    console.error('Erro ao buscar mensagens de chat:', error);
    return { success: false, error: error.message };
  }
}

// Mark all incoming messages from a specific user as read
export async function markInternalMessagesAsRead(otherUserId: string) {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Usuário não autenticado.' };

  await ensureInternalMessageTableExists();

  try {
    await prisma.internalMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: user.id,
        read: false
      },
      data: { read: true }
    });

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    return { success: false, error: error.message };
  }
}

// Fetch all system users decorated with their last message and unread count
export async function getChatList() {
  const user = await getLoggedUser();
  if (!user) return { success: false, error: 'Usuário não autenticado.' };

  await ensureInternalMessageTableExists();

    // 1. Get all system users in the same tenant
    const usersWhere: any = {
      id: { not: user.id }
    };
    if (user.tenantId) {
      usersWhere.tenantId = user.tenantId;
    }

    const users = await prisma.user.findMany({
      where: usersWhere,
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        avatarUrl: true,
        color: true
      },
      orderBy: { nome: 'asc' }
    });

    // 2. Decorate each user with their last message and unread count
    const chatList = await Promise.all(
      users.map(async (u) => {
        // Last message
        const lastMsg = await prisma.internalMessage.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: u.id },
              { senderId: u.id, receiverId: user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        // Unread count
        const unreadCount = await prisma.internalMessage.count({
          where: {
            senderId: u.id,
            receiverId: user.id,
            read: false
          }
        });

        return {
          ...u,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt,
            senderId: lastMsg.senderId
          } : null,
          unreadCount
        };
      })
    );

    // Sort by last message date desc, then by name
    chatList.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.nome.localeCompare(b.nome);
    });

    // Total unread count for the logged user
    const totalUnread = chatList.reduce((acc, c) => acc + c.unreadCount, 0);

    return { success: true, chatList, totalUnread };
  } catch (error: any) {
    console.error('Erro ao buscar lista de chat:', error);
    return { success: false, error: error.message };
  }
}
