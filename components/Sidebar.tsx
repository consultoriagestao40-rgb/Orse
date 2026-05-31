'use client';
 
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Settings, Users, BarChart2, Briefcase, PlusCircle, ShoppingCart, ShieldCheck, ChevronLeft, ChevronRight, FileText, Presentation, Target, Search, Calendar, Mail, Bell, Clock, Wrench, Lock, KeyRound, CheckCircle2, X, Smartphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/notifications/actions';
import { checkCurrentTenantActive, getTenantTrialStatus, updateTenantContactAction } from '@/app/admin/empresas/actions';
import { changeMyPassword, changeMyAvatar, getLoggedUser } from '@/app/propostas/actions';
 
const Sidebar = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTenantBlocked, setIsTenantBlocked] = useState(false);
  
  // Helper para obter o logo do cookie de forma síncrona no primeiro render client-side
  const getInitialLogoUrl = () => {
    if (typeof window !== 'undefined') {
      try {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
        if (cookie) {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          return parsed.tenantLogoUrl || '';
        }
      } catch (e) {}
    }
    return '';
  };
  
  const getInitialLogoNome = () => {
    if (typeof window !== 'undefined') {
      try {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
        if (cookie) {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          return parsed.tenantNome || 'Logo';
        }
      } catch (e) {}
    }
    return 'Logo';
  };
  
  const [user, setUser] = useState<{ nome: string; role: string; email?: string; tenantId?: string | null; iniciais: string; avatarUrl?: string; tenantLogoUrl?: string; tenantNome?: string; primaryColor?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
        if (cookie) {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao ler cookie sb_user no estado inicial:', e);
      }
    }
    return null;
  });

  // Estados para o Enquadramento / Ajuste de Posição da Foto
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPanX, setCropPanX] = useState(0);
  const [cropPanY, setCropPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pendingFileImage, setPendingFileImage] = useState<HTMLImageElement | null>(null);

  const handleSidebarAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Por favor, selecione uma imagem de até 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPendingFileImage(img);
        setRawImageSrc(event.target?.result as string);
        setCropZoom(1);
        setCropPanX(0);
        setCropPanY(0);
        setCropModalOpen(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPanning(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setPanStart({ x: clientX - cropPanX, y: clientY - cropPanY });
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setCropPanX(clientX - panStart.x);
    setCropPanY(clientY - panStart.y);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleConfirmCrop = async () => {
    if (!pendingFileImage) return;
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        const scaleMultiplier = 256 / 200; // Viewport is 200px
        
        ctx.translate(128, 128);
        ctx.translate(cropPanX * scaleMultiplier, cropPanY * scaleMultiplier);
        ctx.scale(cropZoom, cropZoom);

        const viewSize = 200;
        let drawW = pendingFileImage.width;
        let drawH = pendingFileImage.height;
        const ratio = drawW / drawH;

        if (ratio > 1) {
          drawH = viewSize;
          drawW = viewSize * ratio;
        } else {
          drawW = viewSize;
          drawH = viewSize / ratio;
        }

        drawW *= scaleMultiplier;
        drawH *= scaleMultiplier;

        ctx.drawImage(pendingFileImage, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const res = await changeMyAvatar(dataUrl);
      if (res.success && res.avatarUrl) {
        setUser(prev => prev ? { ...prev, avatarUrl: '/api/user/avatar' } : null);
        
        const cookiesList = document.cookie.split(';');
        const userCookie = cookiesList.find(c => c.trim().startsWith('sb_user='));
        if (userCookie) {
          try {
            const decoded = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
            decoded.avatarUrl = '/api/user/avatar';
            const encoded = encodeURIComponent(JSON.stringify(decoded));
            document.cookie = `sb_user=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Lax`;
          } catch (err) {
            console.error('Error updating sb_user cookie:', err);
          }
        }
        setCropModalOpen(false);
        setRawImageSrc(null);
        setPasswordSuccess('Foto de perfil atualizada com sucesso!');
        setTimeout(() => setPasswordSuccess(''), 2000);
      } else {
        setPasswordError('Erro ao salvar foto de perfil: ' + (res.error || 'Erro desconhecido.'));
      }
    } catch (err: any) {
      setPasswordError('Erro ao processar imagem: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Estados do modal de Alterar Senha Premium
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Estados e lógicas do Período de Testes Grátis de 7 Dias
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [countdownTime, setCountdownTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [trialAlert, setTrialAlert] = useState<{ open: boolean; title: string; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Se os campos de senha estiverem vazios, apenas consideramos concluído com sucesso (já que a foto foi salva na hora!)
    if (!currentPassword && !newPassword && !confirmPassword) {
      setPasswordSuccess('Perfil salvo com sucesso!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1000);
      setPasswordLoading(false);
      return;
    }

    // Se algum campo de senha foi digitado, exige todos
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha os campos de senha atual e nova senha para alterá-la.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('A nova senha deve possuir pelo menos 4 caracteres.');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await changeMyPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Senha atualizada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 1500);
      } else {
        setPasswordError(res.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Erro de comunicação.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Formata o input do celular para o padrão brasileiro (99) 99999-9999
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError('');
    setPhoneSuccess('');

    const cleaned = phoneInput.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setPhoneError('Por favor, informe o DDD e o número completo (mínimo 10 dígitos).');
      setPhoneLoading(false);
      return;
    }

    try {
      const res = await updateTenantContactAction(phoneInput);
      if (res.success) {
        setPhoneSuccess('WhatsApp salvo com sucesso!');
        setTimeout(async () => {
          const trialRes = await getTenantTrialStatus();
          if (trialRes && trialRes.success) {
            setTrialStatus(trialRes);
            if (trialRes.isTrialActive && !trialRes.trialExpired) {
              document.body.classList.add('has-trial-banner');
            } else {
              document.body.classList.remove('has-trial-banner');
            }
          }
        }, 1000);
      } else {
        setPhoneError(res.error || 'Erro ao salvar WhatsApp.');
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Efeito global de limpeza do padding do banner
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('has-trial-banner');
      }
    };
  }, []);

  // Efeito do timer do contador regressivo
  useEffect(() => {
    if (!trialStatus || !trialStatus.isTrialActive || trialStatus.trialExpired || trialStatus.remainingTimeMs <= 0) {
      setCountdownTime(null);
      return;
    }

    let remaining = trialStatus.remainingTimeMs;

    const updateTimer = () => {
      if (remaining <= 0) {
        setTrialStatus((prev: any) => prev ? { ...prev, trialExpired: true } : null);
        if (typeof window !== 'undefined') {
          document.body.classList.remove('has-trial-banner');
        }
        clearInterval(timer);
        return;
      }

      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setCountdownTime({ days, hours, minutes, seconds });
      remaining -= 1000;
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [trialStatus?.remainingTimeMs, trialStatus?.isTrialActive, trialStatus?.trialExpired]);
  
  // Carrega as informações do usuário e o estado recolhido do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          setUser(JSON.parse(decodeURIComponent(cookie.split('=')[1])));
        } catch (e) {
          setUser({ nome: 'Cristiano Silva', role: 'USER', iniciais: 'CS' });
        }
      } else {
        setUser({ nome: 'Cristiano Silva', role: 'USER', iniciais: 'CS' });
      }

      const saved = localStorage.getItem('sb_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }

      // Buscar dados atualizados do usuário diretamente do banco de dados (evita cookies desatualizados)
      const fetchFreshUser = async () => {
        try {
          const freshUser = await getLoggedUser();
          if (freshUser) {
            const userObj = {
              nome: freshUser.nome,
              role: freshUser.role,
              email: freshUser.email,
              tenantId: freshUser.tenantId,
              avatarUrl: freshUser.avatarUrl ? '/api/user/avatar' : undefined,
              tenantLogoUrl: (freshUser as any).tenant?.logoUrl ? '/api/tenant/logo' : undefined,
              tenantNome: (freshUser as any).tenant?.nomeFantasia || undefined,
              primaryColor: (freshUser as any).tenant?.primaryColor || undefined,
              iniciais: freshUser.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            };
            setUser(userObj);
            
            // Atualiza o cookie local com os dados mais recentes do banco
            const encoded = encodeURIComponent(JSON.stringify(userObj));
            document.cookie = `sb_user=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Lax`;
          }
        } catch (err) {
          console.error('Erro ao buscar dados atualizados do usuário:', err);
        }
      };

      // Checa se o tenant do inquilino está ativo e verifica o status do teste de 7 dias
      const verifyActiveStatus = async () => {
        try {
          const res = await checkCurrentTenantActive();
          if (res && res.success && res.active === false) {
            setIsTenantBlocked(true);
          }

          const trialRes = await getTenantTrialStatus();
          if (trialRes && trialRes.success) {
            setTrialStatus(trialRes);
            if (trialRes.isTrialActive) {
              if (!trialRes.trialExpired && trialRes.hasContact) {
                document.body.classList.add('has-trial-banner');
              } else {
                document.body.classList.remove('has-trial-banner');
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar suspensão e teste da empresa:', error);
        }
      };
      
      verifyActiveStatus();
      fetchFreshUser();
    }
  }, []);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Efeito dinâmico para gerar e injetar o CSS da cor do tema do cliente inquilino
  useEffect(() => {
    // Evita FOUC (flicker de verde para azul) durante a hidratação/transição
    if (!user) {
      const existingStyle = document.getElementById('dynamic-theme-style');
      if (existingStyle && existingStyle.innerHTML.includes('--primary-color') && !existingStyle.innerHTML.includes('--primary-color: #1B4D3E')) {
        return;
      }
    }

    const isSaaSArea = pathname.startsWith('/admin/empresas');
    const color = (isSaaSArea || user?.email === 'admin@smartbidhub.com.br') 
      ? '#1B4D3E' 
      : (user?.primaryColor || '#1B4D3E');
      
    const hasTenantLogo = user?.tenantLogoUrl && !isSaaSArea && user.email !== 'admin@smartbidhub.com.br';
    
    // Função auxiliar para derivar cores variantes (hover, light bg, text dark)
    const getThemeColors = (hex: string) => {
      let c = hex.replace('#', '').trim();
      if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
      }
      if (c.length !== 6) {
        c = '1B4D3E';
      }

      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);

      const darken = (val: number, amt: number) => Math.max(0, val - amt);
      const rHover = darken(r, 20);
      const gHover = darken(g, 20);
      const bHover = darken(b, 20);
      const hexHover = '#' + ((1 << 24) + (rHover << 16) + (gHover << 8) + bHover).toString(16).slice(1);

      const hexLight = `rgba(${r}, ${g}, ${b}, 0.08)`;
      
      const rDark = darken(r, 45);
      const gDark = darken(g, 45);
      const bDark = darken(b, 45);
      const hexDark = '#' + ((1 << 24) + (rDark << 16) + (gDark << 8) + bDark).toString(16).slice(1);

      return {
        primary: '#' + c,
        rgb: `${r}, ${g}, ${b}`,
        hover: hexHover,
        light: hexLight,
        dark: hexDark,
      };
    };

    const theme = getThemeColors(color);
    
    let style = document.getElementById('dynamic-theme-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-theme-style';
      document.head.appendChild(style);
    }
    style.innerHTML = `
      :root {
        --primary-color: ${theme.primary};
        --primary-color-rgb: ${theme.rgb};
        --primary-color-hover: ${theme.hover};
        --primary-color-light: ${theme.light};
        --primary-color-dark: ${theme.dark};
      }
      /* Override classes Tailwind do verde padrão */
      .bg-\\[\\#1B4D3E\\], .bg-\\[\\#1b4d3e\\] {
        background-color: var(--primary-color) !important;
      }
      .hover\\:bg-\\[\\#13382D\\]:hover, .hover\\:bg-\\[\\#13382d\\]:hover, .hover\\:bg-\\[\\#143d31\\]:hover {
        background-color: var(--primary-color-hover) !important;
      }
      .text-\\[\\#1B4D3E\\], .text-\\[\\#1b4d3e\\] {
        color: var(--primary-color) !important;
      }
      .border-\\[\\#1B4D3E\\], .border-\\[\\#1b4d3e\\] {
        border-color: var(--primary-color) !important;
      }
      .focus\\:border-\\[\\#1B4D3E\\]:focus, .focus\\:border-\\[\\#1b4d3e\\]:focus {
        border-color: var(--primary-color) !important;
      }
      .focus\\:ring-\\[\\#1B4D3E\\]:focus, .focus\\:ring-\\[\\#1b4d3e\\]:focus {
        --tw-ring-color: var(--primary-color) !important;
      }
      .hover\\:text-\\[\\#1B4D3E\\]:hover, .hover\\:text-\\[\\#1b4d3e\\]:hover {
        color: var(--primary-color) !important;
      }
      .hover\\:bg-\\[\\#1B4D3E\\]:hover, .hover\\:bg-\\[\\#1b4d3e\\]:hover {
        background-color: var(--primary-color) !important;
      }
      .group:hover .group-hover\\:bg-\\[\\#1B4D3E\\], .group:hover .group-hover\\:bg-\\[\\#1b4d3e\\] {
        background-color: var(--primary-color) !important;
      }
      .group:hover .group-hover\\:text-\\[\\#1B4D3E\\], .group:hover .group-hover\\:text-\\[\\#1b4d3e\\] {
        color: var(--primary-color) !important;
      }
      .hover\\:border-\\[\\#1B4D3E\\]:hover, .hover\\:border-\\[\\#1b4d3e\\]:hover {
        border-color: var(--primary-color) !important;
      }
      
      /* Gradients Overrides (Top Banner) */
      .from-\\[\\#1B4D3E\\], .from-\\[\\#1b4d3e\\] {
        --tw-gradient-from: var(--primary-color) !important;
        --tw-gradient-to: var(--primary-color-hover) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      .via-\\[\\#2A6D5A\\], .via-\\[\\#2a6d5a\\] {
        --tw-gradient-to: var(--primary-color-hover) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--primary-color-hover), var(--tw-gradient-to) !important;
      }
      .to-\\[\\#1B4D3E\\], .to-\\[\\#1b4d3e\\] {
        --tw-gradient-to: var(--primary-color) !important;
      }
      .to-\\[\\#12362b\\], .to-\\[\\#12362B\\] {
        --tw-gradient-to: var(--primary-color-dark) !important;
      }
      .bg-\\[\\#0B2E24\\], .bg-\\[\\#0b2e24\\] {
        background-color: var(--primary-color-dark) !important;
      }
      
      /* FPV Specific Green Rows (Lighter & Darker shades) */
      .bg-\\[\\#3b8026\\], .bg-\\[\\#3B8026\\] {
        background-color: var(--primary-color-hover) !important;
      }
      .border-\\[\\#2d631d\\], .border-\\[\\#2D631D\\] {
        border-color: var(--primary-color-dark) !important;
      }
      .bg-\\[\\#599e41\\], .bg-\\[\\#599E41\\] {
        background-color: var(--primary-color) !important;
      }
      .border-\\[\\#488234\\], .border-\\[\\#488234\\] {
        border-color: var(--primary-color-hover) !important;
      }
      .bg-\\[\\#8ec277\\], .bg-\\[\\#8EC277\\] {
        background-color: rgba(${theme.rgb}, 0.25) !important;
      }
      
      /* Standard Emerald Overrides */
      .text-emerald-400 { color: var(--primary-color) !important; }
      .text-emerald-500 { color: var(--primary-color) !important; }
      .text-emerald-600 { color: var(--primary-color-hover) !important; }
      .text-emerald-700 { color: var(--primary-color-hover) !important; }
      .text-emerald-750 { color: var(--primary-color-hover) !important; }
      .text-emerald-800 { color: var(--primary-color-dark) !important; }
      .text-emerald-900 { color: var(--primary-color-dark) !important; }
      
      .bg-emerald-50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-50\\/30 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-100\\/50 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-200 { background-color: var(--primary-color-light) !important; }
      .bg-emerald-400 { background-color: var(--primary-color) !important; }
      .bg-emerald-500 { background-color: var(--primary-color) !important; }
      .bg-emerald-600 { background-color: var(--primary-color-hover) !important; }
      .bg-emerald-800 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-900 { background-color: var(--primary-color-dark) !important; }
      .bg-emerald-950 { background-color: var(--primary-color-dark) !important; }
      
      .border-emerald-100 { border-color: var(--primary-color-light) !important; }
      .border-emerald-200 { border-color: var(--primary-color-light) !important; }
      .border-emerald-300 { border-color: var(--primary-color-light) !important; }
      .border-emerald-400 { border-color: var(--primary-color) !important; }
      .border-emerald-500 { border-color: var(--primary-color) !important; }
      .border-emerald-600 { border-color: var(--primary-color-hover) !important; }
      ${hasTenantLogo ? `
        .sidebar-tenant-logo { display: flex !important; }
        .sidebar-default-logo { display: none !important; }
      ` : `
        .sidebar-tenant-logo { display: none !important; }
        .sidebar-default-logo { display: block !important; }
      `}
    `;
    document.head.appendChild(style);
  }, [user?.primaryColor, user?.tenantLogoUrl, pathname]);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
      if (link) {
        window.location.href = link;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_sidebar_collapsed', String(newState));
    }
  };

 
  const menuItems = [
    { icon: Search, label: 'Prospecção Inteligente', href: '/prospeccao', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Calendar, label: 'Calendário Global', href: '/calendar', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Target, label: 'Pipeline de Leads', href: '/leads', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Mail, label: 'Gestão de E-mails', href: '/emails', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Home, label: 'Dashboard CRM', href: '/', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: PlusCircle, label: 'Nova FPV', href: '/propostas/nova', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Presentation, label: 'Proposta Comercial', href: '/propostas-comerciais', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: FileText, label: 'Contratos', href: '/contratos', roles: ['ADMIN', 'MANAGER'] },
    { icon: Briefcase, label: 'Regras (CCT)', href: '/admin/ccts', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Wrench, label: 'Equipes Técnicas (SPOT)', href: '/admin/equipes-tecnicas', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: Users, label: 'Clientes', href: '/clientes', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Usuários e Permissões', href: '/admin/usuarios', roles: ['ADMIN'] },
    { icon: ShoppingCart, label: 'Produtos e Insumos', href: '/produtos', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'EPIs e Uniformes', href: '/epis', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: BarChart2, label: 'Controladoria', href: '/admin/controladoria', roles: ['ADMIN'] },
    { icon: Settings, label: 'Configurações', href: '/admin/settings', roles: ['ADMIN', 'MANAGER', 'USER'] },
    { icon: ShieldCheck, label: 'Gestão SaaS (Tenants)', href: '/admin/empresas', roles: ['SUPER_ADMIN'] },
  ];

  const isSaaSArea = pathname.startsWith('/admin/empresas');
  const showTenantLogo = user?.tenantLogoUrl && !isSaaSArea && user.email !== 'admin@smartbidhub.com.br';

  const renderedMenuItems = isSaaSArea
    ? [
        { icon: Home, label: 'Voltar ao CRM', href: '/' },
        { icon: ShieldCheck, label: 'Gestão SaaS (Tenants)', href: '/admin/empresas' },
      ]
    : menuItems.filter(item => {
        const isPlatformAccount = user?.email === 'admin@smartbidhub.com.br';
        const isSuperAdminUser = user?.email === 'admin@smartbidhub.com.br' || user?.email === 'cristiano@grupojvsserv.com.br';
        
        if (isPlatformAccount) {
          // Conta de Operador do SaaS: vê apenas gestão de empresas
          return item.href === '/admin/empresas';
        } else {
          // Contas de Clientes (como JVS): nunca veem o painel de gestão de SaaS no CRM
          if (item.href === '/admin/empresas' || item.roles.includes('SUPER_ADMIN')) {
            return false;
          }
          return item.roles.includes(user?.role || 'USER');
        }
      });
 
  return (
    <>
      <aside className={`bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-50 relative flex items-center justify-between min-h-[96px] gap-2">
        {!isCollapsed ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div>
              {/* Fallback Default Logo */}
              <div className="sidebar-default-logo">
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-emerald-200 shrink-0">S</div>
                  SmartBidHub
                </h1>
                <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] whitespace-nowrap">Enterprise FM System</p>
              </div>

              {/* Dynamic Tenant Logo */}
              <div className="sidebar-tenant-logo flex flex-col gap-1.5 animate-fadeIn" style={{ display: 'none' }}>
                <img 
                  src={user?.tenantLogoUrl || getInitialLogoUrl()} 
                  alt={user?.tenantNome || getInitialLogoNome()} 
                  suppressHydrationWarning={true}
                  className="max-h-11 max-w-[180px] object-contain rounded"
                />
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-[0.2em] whitespace-nowrap">Powered by SmartBidHub</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Fallback Collapsed Default Logo */}
            <div className="sidebar-default-logo w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white text-base font-black shadow-lg shadow-emerald-200 transition-all shrink-0">S</div>

            {/* Dynamic Collapsed Tenant Logo */}
            <div className="sidebar-tenant-logo w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-md" style={{ display: 'none' }}>
              <img 
                src={user?.tenantLogoUrl || getInitialLogoUrl()} 
                alt="Logo" 
                suppressHydrationWarning={true}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        
        {/* Botão de Recolher Flutuante */}
        <button 
          onClick={toggleCollapse} 
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#1B4D3E] hover:border-[#1B4D3E]/40 hover:shadow-md transition-all z-50 cursor-pointer shadow-sm"
        >
          {isCollapsed ? <ChevronRight size={12} className="stroke-[3]" /> : <ChevronLeft size={12} className="stroke-[3]" />}
        </button>
      </div>
      
      {/* Menu de Navegação */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {renderedMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-2xl transition-all ${
                isCollapsed ? 'justify-center p-3.5' : 'px-5 py-4'
              } ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer do Usuário */}
      <div className="p-4 border-t border-slate-50 space-y-4">
        <div 
          onClick={() => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            setPasswordSuccess('');
            setShowPasswordModal(true);
          }}
          title="Alterar minha senha"
          className={`flex items-center gap-3 p-3 bg-slate-50 rounded-[1.5rem] border border-slate-100 group relative cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.nome} 
              className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-md shrink-0 animate-fadeIn"
            />
          ) : (
            <div className="w-10 h-10 bg-[#1B4D3E] rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
              {user?.iniciais || 'US'}
            </div>
          )}
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black text-slate-800 truncate">{user?.nome || 'Carregando...'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'MANAGER' ? 'Gestor Comercial' : 'Vendedor'}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <KeyRound size={14} className="text-slate-400 group-hover:text-[#1B4D3E] opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
          )}
        </div>

        
        <button 
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
              console.error('Logout failed:', err);
            }
            window.location.href = '/login';
          }}
          title={isCollapsed ? "Sair do Sistema" : undefined}
          className={`w-full flex items-center justify-center gap-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-100 ${isCollapsed ? 'p-3' : 'py-3'}`}
        >
          <BarChart2 size={14} className="rotate-90 shrink-0" />
          {!isCollapsed && <span className="truncate">Sair</span>}
        </button>
      </div>
    </aside>
    
    {/* LOCK SCREEN OVERLAY FOR SUSPENDED TENANTS */}
    {isTenantBlocked && (
      <div className="fixed inset-0 z-[9999] bg-[#0F172A]/98 flex items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in duration-300 font-sans">
        <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl space-y-8 flex flex-col items-center">
          
          {/* Logo/Icon Container with Golden Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-amber-500/10 border border-amber-500/35 text-amber-400 rounded-3xl flex items-center justify-center shadow-lg">
              <Lock size={44} className="stroke-[1.5]" />
            </div>
          </div>

          {/* SmartBidHub Branding */}
          <div className="space-y-1">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase">Assinatura Suspensa</h2>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">SmartBidHub</h1>
          </div>

          {/* Message Block */}
          <div className="space-y-4 max-w-sm">
            <p className="text-sm font-semibold text-slate-300 leading-relaxed">
              O acesso à sua conta está temporariamente suspenso devido a pendências financeiras em aberto.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Por favor, entre em contato com o administrador financeiro de sua empresa ou fale com o nosso suporte para regularizar a assinatura e reestabelecer o acesso imediato.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10"></div>

          {/* Support info & Action Controls */}
          <div className="flex flex-col items-center gap-4 w-full">
            <a 
              href="mailto:suporte@smartbidhub.com.br"
              className="text-xs font-black uppercase tracking-wider text-[#10B981] hover:text-[#059669] transition-colors"
            >
              suporte@smartbidhub.com.br
            </a>

            <button 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (err) {
                  console.error('Logout failed:', err);
                }
                window.location.href = '/login';
              }}
              className="px-8 py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white border border-[#1B4D3E]/30 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center gap-2"
            >
              Sair do Sistema
            </button>
          </div>

        </div>
      </div>
    )}

      {/* MODAL MEU PERFIL E SEGURANÇA */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1B4D3E] p-8 text-white relative">
              <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
                <KeyRound size={20} className="text-[#10B981]" />
                Meu Perfil <span className="text-[#10B981]">& Segurança</span>
              </h3>
              <p className="text-emerald-100/60 text-xs mt-1">
                Personalize sua foto de perfil corporativo ou altere sua senha de acesso.
              </p>
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="absolute top-8 right-8 text-white/50 hover:text-white cursor-pointer"
                disabled={passwordLoading}
              >
                <X size={20} />
              </button>
            </div>

            {cropModalOpen && rawImageSrc ? (
              <div className="p-8 flex flex-col items-center space-y-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ajustar Enquadramento</h4>
                <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
                  Arraste a foto para ajustar a posição e use a barra para controlar o zoom.
                </p>
                
                {/* Viewport Circle */}
                <div 
                  className="w-[200px] h-[200px] rounded-full overflow-hidden relative border-2 border-[#1B4D3E] shadow-xl bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handlePanStart}
                  onMouseMove={handlePanMove}
                  onMouseUp={handlePanEnd}
                  onMouseLeave={handlePanEnd}
                  onTouchStart={handlePanStart}
                  onTouchMove={handlePanMove}
                  onTouchEnd={handlePanEnd}
                >
                  <img 
                    src={rawImageSrc} 
                    alt="Crop Preview" 
                    draggable={false}
                    className="absolute pointer-events-none select-none max-w-none origin-center"
                    style={{
                      width: pendingFileImage && pendingFileImage.width >= pendingFileImage.height ? 'auto' : '200px',
                      height: pendingFileImage && pendingFileImage.width < pendingFileImage.height ? 'auto' : '200px',
                      transform: `translate(-50%, -50%) translate(${cropPanX}px, ${cropPanY}px) scale(${cropZoom})`,
                      left: '50%',
                      top: '50%',
                    }}
                  />
                </div>

                {/* Zoom Slider */}
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>Zoom</span>
                     <span className="text-[#1B4D3E]">{Math.round(cropZoom * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.01" 
                    value={cropZoom} 
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))} 
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
                  />
                </div>

                {/* Buttons */}
                <div className="w-full max-w-xs flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setCropModalOpen(false); setRawImageSrc(null); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmCrop}
                    className="flex-1 bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D3E]/20 transition-all cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="p-8 space-y-5">
                {/* Foto de Perfil Upload */}
                <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-100">
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      id="sidebar-avatar-upload" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={handleSidebarAvatarChange}
                    />
                    <label htmlFor="sidebar-avatar-upload" className="cursor-pointer block relative">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt="Preview Profile" 
                          className="w-24 h-24 rounded-3xl object-cover border-2 border-[#1B4D3E] shadow-lg group-hover:opacity-85 transition-all"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-all">
                          <PlusCircle size={20} className="text-[#1B4D3E]" />
                          <span className="text-[9px] font-black uppercase tracking-wider mt-1">Foto</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1B4D3E]/60 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusCircle size={16} />
                      </div>
                    </label>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Clique na foto para alterar</span>
                  {/* Nota de salvamento automático */}
                  <div className="mt-3 text-[10px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-100/50 rounded-xl px-3.5 py-2 flex items-center gap-1.5 animate-in fade-in duration-300">
                    <span>💡</span>
                    <span>A foto de perfil é salva automaticamente ao ser selecionada!</span>
                  </div>
                </div>

                {/* Senha Atual */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                    <input 
                      type="password" 
                      placeholder="Sua senha atual"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700 text-sm"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                {/* Nova Senha */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 4 caracteres"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700 text-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                    <input 
                      type="password" 
                      placeholder="Repita a nova senha"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700 text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                {/* Banner de Sucesso */}
                {passwordSuccess && (
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 size={16} />
                    {passwordSuccess}
                  </div>
                )}

                {/* Banner de Erro */}
                {passwordError && (
                  <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <X size={16} className="border border-red-200 rounded-full" />
                    {passwordError}
                  </div>
                )}

                {/* Controles do Formulário */}
                <div className="pt-2 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                    disabled={passwordLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {passwordLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      !currentPassword && !newPassword && !confirmPassword ? 'Concluir' : 'Salvar Senha'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FIXED COUNTER BANNER AT THE TOP OF THE SCREEN */}
      {trialStatus?.isTrialActive && !trialStatus?.trialExpired && trialStatus?.hasContact && countdownTime && (
        <div className={`fixed top-0 right-0 z-[48] bg-gradient-to-r from-[#1B4D3E] via-[#2A6D5A] to-[#1B4D3E] border-b border-emerald-500/20 text-white flex items-center justify-between px-6 py-2 h-14 shadow-lg transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/20 text-white/95">
              <Clock size={12} className="animate-pulse" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white">Modo de Teste:</span>
              <p className="text-xs font-bold flex items-center text-white/95">
                Seu período de teste grátis expira em: 
                <span className="ml-2 font-mono text-white font-extrabold bg-black/25 px-2 py-1 rounded tracking-wider whitespace-nowrap">
                  {countdownTime.days}d {countdownTime.hours}h {countdownTime.minutes}m {countdownTime.seconds}s
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/80 font-semibold hidden md:inline">Gostando da experiência?</span>
            <button 
              onClick={() => {
                setTrialAlert({
                  title: 'Assinar SmartBidHub Premium',
                  message: 'Ficamos muito felizes com o seu interesse! Para assinar o SmartBidHub Premium e liberar acessos ilimitados, entre em contato direto com o nosso financeiro pelo e-mail: cristiano@grupojvsserv.com.br ou pelo WhatsApp corporativo da holding.'
                });
              }}
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-slate-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              Assinar Agora
            </button>
          </div>
        </div>
      )}

      {/* 1. MANDATORY CONTACT CAPTURE OVERLAY */}
      {trialStatus?.isTrialActive && !trialStatus?.hasContact && (
        <div className="fixed inset-0 z-[9998] bg-[#0F172A]/95 flex items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in duration-300 font-sans">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 space-y-6 flex flex-col items-center">
            
            {/* Pulsing Emerald Contact Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#10B981]/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 bg-[#1B4D3E]/10 border border-[#10B981]/30 text-[#10B981] rounded-3xl flex items-center justify-center shadow-lg">
                <Smartphone size={38} className="stroke-[1.5] animate-bounce" />
              </div>
            </div>

            {/* Title Block */}
            <div className="space-y-1">
              <h2 className="text-[10px] font-black tracking-[0.3em] text-[#10B981] uppercase">Cadastro Obrigatório</h2>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Celular / WhatsApp</h1>
              <p className="text-xs text-slate-400 font-bold max-w-xs mt-2">
                Para prosseguir com seu período de testes grátis de 7 dias, informe seu WhatsApp para contato comercial e suporte técnico.
              </p>
            </div>

            {/* Form Block */}
            <form onSubmit={handleSaveContact} className="w-full space-y-4 pt-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Celular</label>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                  <input 
                    type="tel" 
                    required
                    placeholder="(99) 99999-9999"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-semibold text-slate-700 text-sm"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                    disabled={phoneLoading}
                  />
                </div>
              </div>

              {/* Success / Error Messages */}
              {phoneSuccess && (
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 size={16} />
                  {phoneSuccess}
                </div>
              )}

              {phoneError && (
                <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <X size={16} className="border border-red-200 rounded-full" />
                  {phoneError}
                </div>
              )}

              <button 
                type="submit"
                disabled={phoneLoading}
                className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#1B4D3E]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {phoneLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Salvar e Acessar o Sistema'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. TRIAL EXPIRED LOCK OUT SCREEN */}
      {trialStatus?.isTrialActive && trialStatus?.trialExpired && (
        <div className="fixed inset-0 z-[9999] bg-[#0F172A]/98 flex items-center justify-center p-6 text-center backdrop-blur-xl animate-in fade-in duration-300 font-sans">
          <div className="w-full max-w-lg bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl space-y-8 flex flex-col items-center">
            
            {/* Golden Lock Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-[#D4AF37] rounded-3xl flex items-center justify-center shadow-lg">
                <Lock size={44} className="stroke-[1.5]" />
              </div>
            </div>

            {/* SmartBidHub Branding */}
            <div className="space-y-1">
              <h2 className="text-[10px] font-black tracking-[0.3em] text-[#D4AF37] uppercase">Período de Testes Expirado</h2>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">SmartBidHub</h1>
            </div>

            {/* Message Block */}
            <div className="space-y-4 max-w-sm">
              <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                Seu período de teste grátis de 7 dias chegou ao fim.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esperamos que tenha gostado das ferramentas de automação de propostas, controladoria SPOT, CCTs e prospecção inteligente!
                <br /><br />
                Para continuar utilizando toda a potência do SmartBidHub sem interrupções e com dados ilimitados, regularize sua assinatura.
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10"></div>

            {/* Support info & Action Controls */}
            <div className="flex flex-col items-center gap-4 w-full">
              <button 
                onClick={() => {
                  setTrialAlert({
                    title: 'Contratar Plano SmartBidHub',
                    message: 'Para contratar e liberar seu acesso corporativo agora mesmo, fale diretamente com nosso canal de atendimento pelo e-mail: cristiano@grupojvsserv.com.br ou suporte@smartbidhub.com.br'
                  });
                }}
                className="w-full py-4.5 bg-[#D4AF37] hover:bg-[#C5A028] text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 animate-pulse"
              >
                Falar com Consultor Comercial
              </button>

              <button 
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch (err) {
                    console.error('Logout failed:', err);
                  }
                  window.location.href = '/login';
                }}
                className="px-8 py-3 bg-[#1B4D3E]/30 hover:bg-[#1B4D3E]/50 text-slate-300 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
              >
                Sair do Sistema
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TRIAL ALERT MODAL */}
      {trialAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border border-emerald-100 bg-emerald-50/50 text-[#1B4D3E] shadow-lg shadow-emerald-50 animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{trialAlert.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">{trialAlert.message}</p>
              </div>
              <button 
                onClick={() => setTrialAlert(null)}
                className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#1B4D3E]/10"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTRAL DE NOTIFICAÇÕES FLUTUANTE NO CANTO SUPERIOR DIREITO */}
      {user && (
        <div className={`${trialStatus?.isTrialActive && !trialStatus?.trialExpired && trialStatus?.hasContact && countdownTime ? 'fixed top-[74px] right-6' : 'fixed top-[18px] right-6'} z-[100] font-sans`}>
          {/* Ícone de Sino Flutuante */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#1B4D3E] shadow-sm hover:shadow transition-all relative cursor-pointer group"
          >
            <Bell size={20} className={`transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12 ${unreadCount > 0 ? "text-[#1B4D3E]" : ""}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover de Notificações - Premium e Espaçoso */}
          {showNotifications && (
            <>
              {/* Overlay invisível para fechar ao clicar fora */}
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowNotifications(false)}
              />
              
              <div className="absolute right-0 mt-3 w-[420px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-[#1B4D3E] text-white p-5 flex items-center justify-between border-b border-[#1B4D3E]/10 shrink-0">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      🔔 Central de Notificações
                    </h3>
                    <p className="text-[9px] text-emerald-100/60 font-semibold uppercase mt-0.5">
                      {unreadCount} pendente{unreadCount !== 1 ? 's' : ''} para leitura
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[9px] font-black uppercase tracking-wider text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Ler todas
                    </button>
                  )}
                </div>

                {/* Body - Lista de Notificações */}
                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 py-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center">
                        <Bell size={20} className="opacity-40" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Tudo limpo por aqui!</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Você não possui novas notificações no momento.</p>
                      </div>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id, n.link)}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3.5 relative group ${
                          !n.read ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        {/* Ponto indicador de não lido */}
                        {!n.read && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#1B4D3E] rounded-full" />
                        )}
                        
                        {/* Ícone contextual da notificação */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          !n.read 
                            ? 'bg-[#1B4D3E]/10 border-[#1B4D3E]/20 text-[#1B4D3E]' 
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <Bell size={15} />
                        </div>

                        {/* Conteúdo */}
                        <div className="space-y-1.5 flex-1 min-w-0 pl-1">
                          <p className={`text-xs text-slate-700 leading-relaxed font-semibold ${!n.read ? 'font-black text-slate-800' : ''}`}>
                            {n.texto}
                          </p>
                          
                          <div className="flex items-center justify-between gap-2">
                            {/* Nome do usuário scoped (se for ADMIN) */}
                            {user?.role === 'ADMIN' && n.user?.nome && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                                Para: {n.user.nome}
                              </span>
                            )}
                            
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                              🕒 {new Date(n.createdAt).toLocaleDateString('pt-BR')} • {new Date(n.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Sidebar;
