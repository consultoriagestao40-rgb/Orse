'use client';

import { useEffect } from 'react';
import { subscribeUserToPush } from '@/app/notifications/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      console.warn('VAPID public key is missing');
      return;
    }

    const registerPush = async () => {
      try {
        // Register service worker
        const register = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Request permission if not granted
        if (Notification.permission === 'default') {
          // Trigger standard web prompt for notifications
          await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') {
          return;
        }

        // Subscribe to push
        const subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // Convert subscription to JSON and send to server
        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await subscribeUserToPush({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
          });
        }
      } catch (err) {
        console.error('Erro ao registrar Push Notification:', err);
      }
    };

    registerPush();
  }, []);

  return null;
}
