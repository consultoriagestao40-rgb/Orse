'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Não autorizado', notifications: [], unreadCount: 0 };

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Contagem de não lidas
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false }
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

    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { read: true }
    });

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

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    return { success: false, error: error.message || String(error) };
  }
}
