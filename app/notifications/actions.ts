'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado', notifications: [], unreadCount: 0 };

    const whereClause: any = {};
    if (user.role === 'ADMIN' && user.tenantId) {
      whereClause.user = {
        tenantId: user.tenantId
      };
    } else {
      whereClause.userId = user.id;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            nome: true
          }
        }
      },
      take: 40 // Retorna até 40 notificações mais recentes
    });

    // Contagem de não lidas
    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        read: false
      }
    });

    return { success: true, notifications, unreadCount };
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    return { success: false, error: error.message || String(error), notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado' };

    // Se for administrador, permite marcar lida qualquer notificação vinculada a usuários de seu tenant
    if (user.role === 'ADMIN' && user.tenantId) {
      const notif = await prisma.notification.findUnique({
        where: { id },
        include: { user: true }
      });
      if (notif && notif.user.tenantId === user.tenantId) {
        await prisma.notification.update({
          where: { id },
          data: { read: true }
        });
      }
    } else {
      await prisma.notification.update({
        where: { id, userId: user.id },
        data: { read: true }
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado' };

    if (user.role === 'ADMIN' && user.tenantId) {
      await prisma.notification.updateMany({
        where: {
          user: {
            tenantId: user.tenantId
          },
          read: false
        },
        data: { read: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true }
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return { success: false, error: error.message || String(error) };
  }
}
