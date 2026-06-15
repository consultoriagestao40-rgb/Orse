'use server';

import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import webpush from 'web-push';

// Configure VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:suporte@smartbid.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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
