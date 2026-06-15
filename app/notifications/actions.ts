'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import webpush from 'web-push';
import { revalidatePath } from 'next/cache';

// Configure VAPID details
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "BHWExwoVtGyYGeMBq3FIUPYrIltpkoQDdAm0YIz6JoHzwFp1ew1QOE4ith9kpAcNxyXDlbftxCPuUDptDbPuD64";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "IXeTLnxe68DAbrCn4n7FRgcKduFnby0r_B7uccGb49I";

webpush.setVapidDetails(
  'mailto:suporte@smartbid.com',
  vapidPublicKey,
  vapidPrivateKey
);

// Action to save user's push subscription
export async function subscribeUserToPush(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    // Check if subscription already exists for this endpoint
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: sub.endpoint }
    });

    if (existing) {
      // Update it if it needs sync or owner reassignment
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          userId: user.id,
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      });
      return { success: true, id: updated.id };
    }

    // Create a new subscription
    const newSub = await prisma.pushSubscription.create({
      data: {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        userId: user.id
      }
    });

    return { success: true, id: newSub.id };
  } catch (err: any) {
    console.error('Erro ao salvar push subscription:', err);
    return { success: false, error: err.message };
  }
}

// Helper function to send web push notifications (called from backend actions)
export async function sendWebPush(userId: string, title: string, body: string, url?: string) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) return { success: true, sent: 0 };

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/leads'
    });

    let sentCount = 0;
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        await webpush.sendNotification(pushSubscription, payload);
        sentCount++;
      } catch (err: any) {
        console.error(`Falha ao enviar push para sub ${sub.id}:`, err.statusCode, err.message);
        // Delete expired/invalid subscriptions (410 Gone / 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    });

    await Promise.all(promises);
    return { success: true, sent: sentCount };
  } catch (err: any) {
    console.error('Erro no processamento de envio de push:', err);
    return { success: false, error: err.message };
  }
}

// --- GENERAL SYSTEM NOTIFICATIONS ACTIONS ---

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
