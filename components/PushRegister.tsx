'use client';

import { useEffect, useState } from 'react';
import { subscribeUserToPush } from '@/app/notifications/actions';
import { Bell, X, Info, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getChatList } from '@/app/leads/chat-actions';

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
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  
  const [prevUnread, setPrevUnread] = useState<number | null>(null);
  const [activeNotification, setActiveNotification] = useState<{
    senderName: string;
    content: string;
    senderId: string;
  } | null>(null);

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BHWExwoVtGyYGeMBq3FIUPYrIltpkoQDdAm0YIz6JoHzwFp1ew1QOE4ith9kpAcNxyXDlbftxCPuUDptDbPuD64";


  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    try {
      const register = await navigator.serviceWorker.ready;

      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await subscribeUserToPush({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth
        });
      }
    } catch (err) {
      console.error('Erro ao inscrever push automático:', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Registra o Service Worker incondicionalmente para suporte a PWA (instalação, offline, etc.)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('Service Worker registrado com sucesso:', reg.scope);
          // Se as notificações já foram concedidas, inscreve o usuário no push
          if ('Notification' in window && Notification.permission === 'granted') {
            subscribeUser();
          }
        })
        .catch((err) => {
          console.error('Erro ao registrar Service Worker:', err);
        });
    }

    // Check permissions
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const mobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

    setIsStandalone(standalone);
    setIsMobile(mobile);

    // Show banner if permission is not set
    if ('Notification' in window && Notification.permission === 'default') {
      setShowBanner(true);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações push.');
      return;
    }

    try {
      // Request permission inside user gesture
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      setShowBanner(false);

      if (permission !== 'granted') {
        return;
      }

      // Obtém o registro ativo do Service Worker
      const register = await navigator.serviceWorker.ready;

      // Subscribe
      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await subscribeUserToPush({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth
        });
      }
    } catch (err) {
      console.error('Erro ao registrar push:', err);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkNewMessages = async () => {
      try {
        const res = await getChatList();
        if (res.success && res.chatList) {
          const currentTotal = res.totalUnread || 0;
          
          if (prevUnread !== null && currentTotal > prevUnread) {
            // New message received!
            const chatUser = res.chatList.find((u: any) => u.unreadCount > 0);
            if (chatUser && chatUser.lastMessage) {
              // Play audio tone
              try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                  const ctx = new AudioContext();
                  const playBeep = (delay: number, freq: number) => {
                    setTimeout(() => {
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(freq, ctx.currentTime);
                      gain.gain.setValueAtTime(0.08, ctx.currentTime);
                      osc.start();
                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
                      osc.stop(ctx.currentTime + 0.2);
                    }, delay);
                  };
                  playBeep(0, 784); // G5
                  playBeep(150, 987); // B5
                }
              } catch (soundErr) {
                console.warn('Erro ao tocar som:', soundErr);
              }

              // Vibrate
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate([150, 80, 150]);
              }

              // Show active banner
              setActiveNotification({
                senderName: chatUser.nome,
                content: chatUser.lastMessage.content,
                senderId: chatUser.id
              });
            }
          }
          
          setPrevUnread(currentTotal);
        }
      } catch (err) {
        // Fail silently
      }
    };

    // Initial check after a short delay
    const initialTimeout = setTimeout(checkNewMessages, 2000);

    // Setup interval
    intervalId = setInterval(checkNewMessages, 4000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [prevUnread]);

  // Auto-dismiss notification banner
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  if (activeNotification) {
    return (
      <div 
        onClick={() => {
          router.push('/chat');
          setActiveNotification(null);
        }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white/85 backdrop-blur-md text-slate-800 p-4 rounded-2xl shadow-2xl border-l-4 border-l-blue-600 border border-slate-200/50 z-[9999] cursor-pointer animate-in fade-in slide-in-from-top-5 duration-300 flex items-start gap-3 select-none"
      >
        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare size={18} />
        </div>
        <div className="flex-1 min-w-0 text-left font-sans">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-600 leading-tight">
            Nova mensagem de {activeNotification.senderName}
          </h4>
          <p className="text-[10.5px] font-semibold text-slate-600 mt-1 leading-relaxed truncate">
            {activeNotification.content}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setActiveNotification(null);
          }} 
          className="text-slate-450 hover:text-slate-700 shrink-0 self-start p-1 hover:bg-slate-100/50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (!showBanner || permissionState === 'granted' || permissionState === 'denied') {
    return null;
  }

  // If mobile but not in PWA standalone mode (iOS requirement tip)
  if (isMobile && !isStandalone) {
    const isIos = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    if (!isIos) {
      // Android browser allows push but showing PWA install option is good.
      // We will let Android users click directly
    } else {
      // iOS specific PWA banner tip
      return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <Info size={18} />
            </div>
            <div className="flex-1 space-y-1 text-left font-sans">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400">Notificações no iPhone</h4>
              <p className="text-[10.5px] font-medium leading-relaxed text-slate-300">
                Para receber alertas sonoros e na tela bloqueada, adicione este aplicativo à sua Tela de Início:
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 leading-normal">
                Toque no botão de compartilhar (ícone de seta) do Safari/Chrome e selecione <span className="text-white font-extrabold">"Adicionar à Tela de Início"</span>.
              </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-white shrink-0 self-start">
              <X size={16} />
            </button>
          </div>
        </div>
      );
    }
  }

  // Active PWA standalone banner (or Android browser)
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-[#1B4D3E] text-white p-4 rounded-2xl shadow-2xl border border-[#13382D]/50 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex gap-3">
        <div className="w-9 h-9 bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0">
          <Bell size={18} className="animate-bounce" />
        </div>
        <div className="flex-1 space-y-2 text-left font-sans">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Alertas do SmartBid</h4>
          <p className="text-[10.5px] font-medium leading-relaxed text-slate-100">
            Deseja receber notificações na tela do seu celular sobre novas OSs, entregas e mensagens do chat?
          </p>
          <button
            onClick={handleSubscribe}
            className="px-3.5 py-1.5 bg-white text-[#1B4D3E] text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer block text-center"
          >
            Ativar Notificações
          </button>
        </div>
        <button onClick={() => setShowBanner(false)} className="text-slate-200 hover:text-white shrink-0 self-start">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
