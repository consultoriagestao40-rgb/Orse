'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Truck, ArrowLeft, Play, CheckCircle, Camera, Trash2, Lock,
  RotateCcw, Save, X, ClipboardList, MapPin, User, FileText,
  Calendar, Check, LogOut, Loader2, Car, Navigation, Volume2,
  Building, Target, PlusCircle, MessageSquare, ShieldAlert, Wrench
} from 'lucide-react';
import { 
  getEntregadorEntregas, updateEntrega 
} from '../actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { useRouter } from 'next/navigation';

export default function EntregadorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [knownEntregaIds, setKnownEntregaIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; title: string; text: string } | null>(null);

  // Finalization Modal State
  const [activeEntregaForFinalize, setActiveEntregaForFinalize] = useState<any>(null);
  const [observacaoEntrega, setObservacaoEntrega] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [documentoRecebedor, setDocumentoRecebedor] = useState('');
  const [destinatarioAusente, setDestinatarioAusente] = useState(false);

  // Canvas Drawing Ref (Recebedor/Cliente)
  const canvasRecebedorRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRecebedorRef = useRef(false);
  const [hasDrawnRecebedor, setHasDrawnRecebedor] = useState(false);

  // Canvas Drawing Ref (Entregador)
  const canvasEntregadorRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingEntregadorRef = useRef(false);
  const [hasDrawnEntregador, setHasDrawnEntregador] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sb_mobile_mode');
    }
    loadEntregadorData();
  }, []);

  useEffect(() => {
    const canvasRecebedor = canvasRecebedorRef.current;
    const canvasEntregador = canvasEntregadorRef.current;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.target === canvasRecebedor || e.target === canvasEntregador) {
        e.preventDefault();
      }
    };

    if (canvasRecebedor) {
      canvasRecebedor.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvasRecebedor.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }
    if (canvasEntregador) {
      canvasEntregador.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvasEntregador.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }

    return () => {
      if (canvasRecebedor) {
        canvasRecebedor.removeEventListener('touchstart', preventDefaultTouch);
        canvasRecebedor.removeEventListener('touchmove', preventDefaultTouch);
      }
      if (canvasEntregador) {
        canvasEntregador.removeEventListener('touchstart', preventDefaultTouch);
        canvasEntregador.removeEventListener('touchmove', preventDefaultTouch);
      }
    };
  }, [activeEntregaForFinalize]);

  // Trata o redimensionamento e deslocamento de tela no iOS (Safari) para evitar "pulos" e zoom no foco dos inputs
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport || !activeEntregaForFinalize) return;

    const handleResize = () => {
      const modalElement = document.getElementById('finalize-modal-container');
      if (modalElement) {
        modalElement.style.height = `${window.visualViewport.height}px`;
        modalElement.style.top = `${window.visualViewport.offsetTop}px`;
        window.scrollTo(0, 0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    handleResize();

    const timer = setTimeout(handleResize, 100);

    return () => {
      clearTimeout(timer);
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
      
      const modalElement = document.getElementById('finalize-modal-container');
      if (modalElement) {
        modalElement.style.height = '';
        modalElement.style.top = '';
      }
    };
  }, [activeEntregaForFinalize]);

  // Polling de 30 segundos em background para novas entregas
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      loadEntregadorDataSilently();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser, knownEntregaIds]);

  // Rastreamento periódico de GPS quando em deslocamento
  useEffect(() => {
    const activeTransitEntrega = entregas.find(e => e.status === 'EM_DESLOCAMENTO');
    if (!activeTransitEntrega) return;

    let intervalId: NodeJS.Timeout;
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Erro ao solicitar Wake Lock de tela:', err);
      }
    };

    const releaseWakeLock = async () => {
      try {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
      } catch (err) {
        console.warn('Erro ao liberar Wake Lock de tela:', err);
      }
    };

    const sendGPSUpdate = async () => {
      try {
        const location = await getGPSLocation();
        await updateEntrega(activeTransitEntrega.id, {
          latitudeAtual: location.latitude,
          longitudeAtual: location.longitude,
          ultimaAtualizacaoLocalizacao: new Date().toISOString()
        });
      } catch (err) {
        console.error('Erro no envio periódico de GPS:', err);
      }
    };

    requestWakeLock();
    sendGPSUpdate();
    intervalId = setInterval(sendGPSUpdate, 30000);

    return () => {
      clearInterval(intervalId);
      releaseWakeLock();
    };
  }, [entregas]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Tom A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc2.stop(audioCtx.currentTime + 0.2);
        } catch (e) {}
      }, 200);
      
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (error) {
      console.error('Erro ao reproduzir som de notificação:', error);
    }
  };

  const getGPSLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste navegador.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let msg = 'Erro ao obter localização.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Permissão de GPS negada. Por favor, habilite o acesso à localização nas configurações do seu celular.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Sinal de GPS indisponível no momento.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Tempo limite esgotado ao tentar obter o GPS.';
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  const filterEntregasForDriver = (list: any[]) => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return list.filter((e: any) => {
      if (!e.dataProgramada) return true;
      const progDate = new Date(e.dataProgramada);
      const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
      return progZero.getTime() <= todayZero.getTime();
    });
  };

  const loadEntregadorData = async () => {
    setLoading(true);
    try {
      const [entregasRes, loggedUser] = await Promise.all([
        getEntregadorEntregas(),
        getLoggedUser()
      ]);

      if (entregasRes.success && entregasRes.entregas) {
        const filtered = filterEntregasForDriver(entregasRes.entregas);
        setEntregas(filtered);
        setKnownEntregaIds(filtered.map((e: any) => e.id));
      }
      if (loggedUser) {
        setCurrentUser(loggedUser);
        const isTech = loggedUser.cargo?.toLowerCase().includes('tecnico') || loggedUser.cargo?.toLowerCase().includes('técnico');
        const isDeliv = loggedUser.cargo?.toLowerCase().includes('entregador') || 
                        loggedUser.cargo?.toLowerCase().includes('entrega') || 
                        loggedUser.cargo?.toLowerCase().includes('motoboy') || 
                        loggedUser.cargo?.toLowerCase().includes('motorista');
        const isGest = loggedUser.role === 'ADMIN' || loggedUser.role === 'MANAGER';
        if (!isGest) {
          if (isTech) {
            router.push('/ativos/tecnico');
            return;
          } else if (!isDeliv) {
            router.push('/leads/mobile');
            return;
          }
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro de Conexão', 'Não foi possível carregar as entregas.');
    }
    setLoading(false);
  };

  const loadEntregadorDataSilently = async () => {
    try {
      const entregasRes = await getEntregadorEntregas();
      if (entregasRes.success && entregasRes.entregas) {
        const filtered = filterEntregasForDriver(entregasRes.entregas);
        
        const hasNew = filtered.some((e: any) => 
          e.status === 'PROGRAMADO' && !knownEntregaIds.includes(e.id)
        );
        
        if (hasNew && knownEntregaIds.length > 0) {
          playNotificationSound();
          showAlert('success', 'Nova Entrega Recebida!', 'Uma nova entrega foi programada para você.');
        }
        
        setEntregas(filtered);
        setKnownEntregaIds(filtered.map((e: any) => e.id));
      }
    } catch (err) {
      console.error('Erro no polling em background:', err);
    }
  };

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, text: string) => {
    setAlert({ type, title, text });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleStartRoute = async (entregaId: string, clientAddress: string) => {
    setSaving(true);
    showAlert('warning', 'Obtendo GPS...', 'Aguarde enquanto lemos a sua localização de partida.');
    
    try {
      const location = await getGPSLocation();
      
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${encodeURIComponent(clientAddress)}`;
      window.location.href = mapsUrl;
      
      updateEntrega(entregaId, {
        status: 'EM_DESLOCAMENTO',
        latitudePartida: location.latitude,
        longitudePartida: location.longitude,
        deslocamentoIniciadoEm: new Date().toISOString()
      }).then((res) => {
        if (res.success) {
          loadEntregadorData();
        } else {
          showAlert('error', 'Falha ao Iniciar Rota', res.error || 'Erro ao atualizar dados.');
        }
      }).catch((err) => {
        console.error('Erro ao atualizar entrega no banco:', err);
      }).finally(() => {
        setSaving(false);
      });
      
    } catch (err: any) {
      showAlert('error', 'GPS Obrigatório', err.message || 'É necessário permitir o acesso ao GPS para iniciar a rota.');
      setSaving(false);
    }
  };

  const handleOpenRouteAgain = (ent: any) => {
    const lat = ent.latitudePartida;
    const lng = ent.longitudePartida;
    const dest = ent.client?.endereco || '';
    
    let mapsUrl = '';
    if (lat && lng) {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(dest)}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
    }
    window.location.href = mapsUrl;
  };

  const handleStartService = async (entregaId: string) => {
    setSaving(true);
    showAlert('warning', 'Validando Chegada...', 'Aguarde enquanto o GPS valida a sua localização de chegada.');
    
    try {
      const location = await getGPSLocation();
      const res = await updateEntrega(entregaId, {
        status: 'ENTREGA',
        latitudeChegada: location.latitude,
        longitudeChegada: location.longitude,
        entregaIniciadaEm: new Date().toISOString()
      });
      
      if (res.success) {
        await loadEntregadorData();
        showAlert('success', 'Entrega Iniciada', 'Você chegou ao cliente. Inicie a entrega no local.');
      } else {
        showAlert('error', 'Falha ao Iniciar Atendimento', res.error || 'Erro ao registrar chegada.');
      }
    } catch (err: any) {
      showAlert('error', 'GPS Obrigatório', err.message || 'É necessário permitir o acesso ao GPS para registrar a sua chegada ao cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFinalize = (ent: any) => {
    setActiveEntregaForFinalize(ent);
    setObservacaoEntrega('');
    setFotos([]);
    setNomeRecebedor(ent.client?.contato || '');
    setDocumentoRecebedor('');
    setHasDrawnRecebedor(false);
    setHasDrawnEntregador(false);
    setDestinatarioAusente(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseFinalize = () => {
    setActiveEntregaForFinalize(null);
    document.body.style.overflow = 'unset';
  };

  // Canvas drawing logic
  const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // RECEBEDOR DRAWING
  const startDrawingRecebedor = (e: any) => {
    e.preventDefault();
    const canvas = canvasRecebedorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingRecebedorRef.current = true;
  };

  const drawRecebedor = (e: any) => {
    if (!isDrawingRecebedorRef.current) return;
    e.preventDefault();
    const canvas = canvasRecebedorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawnRecebedor(true);
  };

  const stopDrawingRecebedor = () => {
    isDrawingRecebedorRef.current = false;
  };

  const clearCanvasRecebedor = () => {
    const canvas = canvasRecebedorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnRecebedor(false);
  };

  // ENTREGADOR DRAWING
  const startDrawingEntregador = (e: any) => {
    e.preventDefault();
    const canvas = canvasEntregadorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingEntregadorRef.current = true;
  };

  const drawEntregador = (e: any) => {
    if (!isDrawingEntregadorRef.current) return;
    e.preventDefault();
    const canvas = canvasEntregadorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawnEntregador(true);
  };

  const stopDrawingEntregador = () => {
    isDrawingEntregadorRef.current = false;
  };

  const clearCanvasEntregador = () => {
    const canvas = canvasEntregadorRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnEntregador(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    Array.from(filesList).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showAlert('warning', 'Arquivo Inválido', 'Apenas arquivos de imagem são permitidos.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setFotos(prev => [...prev, compressedBase64]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendToValidation = async () => {
    if (!activeEntregaForFinalize) return;

    if (destinatarioAusente) {
      if (fotos.length === 0) {
        return showAlert('warning', 'Foto Obrigatória', 'Para entrega sem recebedor, você deve tirar pelo menos uma foto da entrega.');
      }
    } else {
      if (!nomeRecebedor.trim()) {
        return showAlert('warning', 'Recebedor Obrigatório', 'Informe o nome de quem está recebendo a entrega.');
      }
      if (!hasDrawnRecebedor) {
        return showAlert('warning', 'Assinatura Obrigatória', 'O recebedor precisa assinar na tela.');
      }
    }

    const canvasRecebedor = canvasRecebedorRef.current;
    const base64RecebedorSig = (!destinatarioAusente && canvasRecebedor) ? canvasRecebedor.toDataURL('image/png') : null;

    setSaving(true);
    try {
      let latitudeChegada = activeEntregaForFinalize.latitudeChegada;
      let longitudeChegada = activeEntregaForFinalize.longitudeChegada;
      let entregaIniciadaEm = activeEntregaForFinalize.entregaIniciadaEm;

      // Se o fluxo pulou o "Cheguei", captura a geolocalização de chegada na finalização
      if (activeEntregaForFinalize.status === 'EM_DESLOCAMENTO') {
        try {
          const location = await getGPSLocation();
          latitudeChegada = location.latitude;
          longitudeChegada = location.longitude;
          entregaIniciadaEm = new Date().toISOString();
        } catch (gpsErr) {
          console.warn('Erro ao obter GPS de chegada para finalização:', gpsErr);
        }
      }

      const payload: any = {
        status: 'VALIDACAO',
        observacaoEntrega: observacaoEntrega,
        fotosEntrega: JSON.stringify(fotos),
        assinaturaEntregador: 'SISTEMA',
        nomeRecebedor: destinatarioAusente ? 'SEM RECEBEDOR' : nomeRecebedor,
        documentoRecebedor: destinatarioAusente ? null : documentoRecebedor,
        assinaturaRecebedor: base64RecebedorSig,
        latitudeChegada,
        longitudeChegada,
        entregaIniciadaEm
      };

      const res = await updateEntrega(activeEntregaForFinalize.id, payload);

      if (res.success) {
        handleCloseFinalize();
        showAlert('success', 'Entrega Finalizada', 'O relatório foi enviado para validação do gestor.');
        await loadEntregadorData();
      } else {
        showAlert('error', 'Falha ao Finalizar', res.error || 'Erro ao salvar dados.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro de Conexão', err.message || 'Erro ao transmitir dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestCancel = async (entId: string) => {
    const motivo = prompt('Justificativa para solicitar o cancelamento da entrega (obrigatório):');
    if (motivo === null) return;
    if (!motivo.trim()) {
      return showAlert('warning', 'Justificativa Obrigatória', 'Você deve preencher um motivo para solicitar o cancelamento.');
    }

    setSaving(true);
    try {
      const res = await updateEntrega(entId, {
        status: 'VALIDACAO',
        observacaoEntrega: `Cancelamento solicitado: ${motivo.trim()}`
      });
      if (res.success) {
        showAlert('success', 'Cancelamento Solicitado', 'A solicitação foi enviada para o gestor validar.');
        await loadEntregadorData();
      } else {
        showAlert('error', 'Erro', res.error || 'Não foi possível solicitar o cancelamento.');
      }
    } catch (err: any) {
      showAlert('error', 'Conexão Falhou', err.message || 'Erro ao enviar dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {}
    window.location.href = '/login';
  };

  // Trava sequencial de rotas
  const isTransitOrServiceActive = entregas.some(e => e.status === 'EM_DESLOCAMENTO' || e.status === 'ENTREGA');

  const isTodayEntrega = (e: any) => {
    if (!e.dataProgramada) return true;
    const progDate = new Date(e.dataProgramada);
    const today = new Date();
    return progDate.getFullYear() === today.getFullYear() &&
           progDate.getMonth() === today.getMonth() &&
           progDate.getDate() === today.getDate();
  };

  const isLateEntrega = (e: any) => {
    if (!e.dataProgramada) return false;
    const progDate = new Date(e.dataProgramada);
    const today = new Date();
    const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return progZero.getTime() < todayZero.getTime();
  };

  const isEntregaBlocked = (ent: any) => {
    if (ent.status !== 'PROGRAMADO') return false;
    
    // Se outra entrega já estiver ativa (deslocando ou entregando), bloqueia tudo
    if (isTransitOrServiceActive) return true;

    // Se a entrega for atrasada (de dias anteriores), ela NÃO é impeditiva e NÃO fica bloqueada
    if (isLateEntrega(ent)) {
      return false;
    }

    // Se for uma entrega de hoje, ela só é bloqueada pelas outras de hoje que venham antes dela na fila
    const filaHoje = entregas
      .filter(e => e.status === 'PROGRAMADO' && isTodayEntrega(e))
      .sort((a, b) => (a.ordemExecucao ?? 9999) - (b.ordemExecucao ?? 9999));

    if (filaHoje.length > 0 && filaHoje[0].id === ent.id) {
      return false;
    }

    return true; // não é a primeira de hoje
  };

  const isGestor = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative select-none">
      
      {/* Header Fixo Mobile */}
      <header className="sticky top-0 bg-slate-950/90 backdrop-blur-md px-5 py-3 flex flex-col gap-3 border-b border-white/5 z-40">
        {isGestor && (
          <div className="flex justify-around items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1">
            <button
              onClick={() => router.push('/leads/mobile')}
              className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all hover:text-white cursor-pointer"
            >
              <Building size={11} /> CRM
            </button>
            <button
              onClick={() => router.push('/ativos/tecnico')}
              className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all hover:text-white cursor-pointer"
            >
              <Wrench size={11} /> Técnico
            </button>
            <button
              onClick={() => router.push('/entrega/entregador')}
              className="flex-1 flex items-center justify-center gap-1 bg-[#10B981] text-slate-950 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer"
            >
              <Truck size={11} /> Entrega
            </button>
          </div>
        )}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.nome} 
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-black text-sm shrink-0">
                {currentUser?.nome ? currentUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'E'}
              </div>
            )}
            <div className="min-w-0 text-left">
              <h1 className="text-xs font-black uppercase block text-white leading-tight truncate">
                {currentUser?.nome || 'Entregador'}
              </h1>
              <p className="text-[9px] text-[#10B981] font-bold uppercase tracking-widest mt-0.5 leading-none">
                {currentUser?.cargo || 'Entregador'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2.5 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/30 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-[0.95]"
            title="Sair da Conta"
          >
            <LogOut size={16} className="stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Alertas flutuantes no celular */}
      {alert && (
        <div className="fixed top-20 inset-x-4 z-50 animate-in slide-in-from-top duration-300">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xl backdrop-blur-md ${
            alert.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
              : alert.type === 'error' 
                ? 'bg-red-950/90 border-red-500/30 text-red-300' 
                : 'bg-amber-950/90 border-amber-500/30 text-amber-300'
          }`}>
            <Volume2 size={20} className="shrink-0 stroke-[2.5] mt-0.5 animate-pulse" />
            <div className="text-xs text-left">
              <h4 className="font-black uppercase tracking-wider">{alert.title}</h4>
              <p className="font-semibold mt-1 opacity-90 leading-relaxed">{alert.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Entregas Ativas do Roteiro */}
      <main className="flex-1 p-5 space-y-4 overflow-y-auto">
        
        <div className="flex justify-end px-1">
          <button 
            onClick={loadEntregadorData}
            className="text-[9px] font-black text-[#10B981] uppercase hover:underline cursor-pointer"
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500 select-none">
            <Loader2 size={32} className="animate-spin text-[#10B981] stroke-[2.5]" />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Buscando entregas programadas...</p>
          </div>
        ) : entregas.length === 0 ? (
          <div className="py-24 px-8 text-center space-y-4 border border-dashed border-white/5 bg-white/[0.02] rounded-3xl">
            <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
              <ClipboardList size={22} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Roteiro Vazio</h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Você não possui entregas programadas para hoje ou já concluiu todos os pedidos da sua rota.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            
            {entregas.map((ent, idx) => {
              const isBlocked = isEntregaBlocked(ent);
              const isDeslocamento = ent.status === 'EM_DESLOCAMENTO';
              const isLocal = ent.status === 'ENTREGA';

              return (
                <div 
                  key={ent.id} 
                  className={`bg-slate-950/80 border rounded-3xl p-5 space-y-4 text-left transition-all ${
                    isBlocked 
                      ? 'opacity-40 border-white/5 select-none' 
                      : 'border-white/10 shadow-lg shadow-black/10'
                  }`}
                >
                  {/* Badge de Ordem e NF */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5.5 h-5.5 bg-slate-800 border border-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-[#10B981]">
                        {ent.status === 'PROGRAMADO' ? (ent.ordemExecucao ?? idx + 1) : '✓'}
                      </span>
                      <span className="font-mono text-[10px] font-black bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        NF {ent.numeroNf}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDeslocamento 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                          : isLocal 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isDeslocamento ? 'Em Rota' : isLocal ? 'No Local' : 'Programado'}
                      </span>
                      {isLateEntrega(ent) && ent.status === 'PROGRAMADO' && (
                        <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                          ⚠️ Atrasada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">{ent.client.nomeFantasia}</h3>
                    <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed flex items-start gap-1">
                      <MapPin size={11} className="stroke-[2.5] text-slate-500 shrink-0 mt-0.5" />
                      {ent.client.endereco || 'Sem endereço'}
                    </p>
                  </div>

                  {/* Informações de Recusa de Cancelamento Anterior */}
                  {ent.observacaoEntrega?.includes('Motivo da recusa do cancelamento') && (
                    <div className="bg-rose-950/35 border border-rose-500/20 rounded-2xl p-3 text-[10px] text-rose-300 font-semibold leading-relaxed">
                      ⚠️ O gestor recusou o seu pedido de cancelamento:<br />
                      <span className="font-black">"{ent.observacaoEntrega.replace('Motivo da recusa do cancelamento: ', '')}"</span>
                    </div>
                  )}

                  {/* Observações do gestor */}
                  {ent.observacao && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-[10px] text-slate-400 font-semibold leading-relaxed">
                      <span className="font-black text-slate-300">Obs do Gestor:</span> {ent.observacao}
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="pt-2">
                    {isBlocked ? (
                      <div className="w-full flex items-center justify-center gap-1.5 p-3.5 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Lock size={12} />
                        {isTransitOrServiceActive ? 'Outra entrega está ativa' : 'Entregue o pedido anterior primeiro'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {ent.status === 'PROGRAMADO' && (
                          <button
                            onClick={() => handleStartRoute(ent.id, ent.client.endereco)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[10.5px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            disabled={saving}
                          >
                            <Play size={13} fill="white" className="shrink-0" /> Iniciar Rota (Maps)
                          </button>
                        )}

                        {isDeslocamento && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleOpenFinalize(ent)}
                              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[10.5px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              disabled={saving}
                            >
                              <CheckCircle size={13} fill="white" className="shrink-0" /> Entregar
                            </button>
                            <button
                              onClick={() => handleOpenRouteAgain(ent)}
                              className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              disabled={saving}
                            >
                              <Navigation size={12} className="shrink-0" /> Abrir Google Maps Novamente
                            </button>
                          </div>
                        )}

                        {isLocal && (
                          <button
                            onClick={() => handleOpenFinalize(ent)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[10.5px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            disabled={saving}
                          >
                            <CheckCircle size={13} fill="white" className="shrink-0" /> Entregar
                          </button>
                        )}

                        {/* Solicitação de Cancelamento */}
                        <button
                          onClick={() => handleRequestCancel(ent.id)}
                          className="w-full py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-950/30 active:scale-[0.98] text-[9.5px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                          disabled={saving}
                        >
                          Solicitar Cancelamento
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL FULLSCREEN MÓVEL DE FINALIZAÇÃO (IOS ADAPTADO)
          ─────────────────────────────────────────────────────────────────── */}
      {activeEntregaForFinalize && (() => {
        const ent = activeEntregaForFinalize;

        return (
          <div 
            id="finalize-modal-container"
            className="fixed inset-x-0 bottom-0 bg-slate-950 border-t border-white/10 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300 touch-none"
            style={{ height: '100dvh', top: 0 }}
          >
            {/* Header Modal */}
            <header className="px-5 py-4 border-b border-white/5 flex justify-between items-center select-none shrink-0 bg-slate-900">
              <div className="flex items-center gap-2 min-w-0 text-left">
                <Truck size={16} className="text-[#10B981]" />
                <div className="min-w-0">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">Finalizar Entrega</h3>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase leading-none mt-0.5">NF № {ent.numeroNf} • {ent.client.nomeFantasia}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseFinalize}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer active:scale-[0.9]"
                disabled={saving}
              >
                <X size={18} />
              </button>
            </header>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 touch-pan-y text-left">
              
              {/* Fotos da Entrega */}
              <div className="space-y-3">
                <div className="flex justify-between items-center select-none">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fotos da Carga / Local (Max 6)</label>
                  <span className="text-[9px] text-[#10B981] font-black uppercase tracking-wider">{fotos.length}/6 Fotos</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative aspect-square border border-white/10 rounded-2xl overflow-hidden bg-slate-900 group">
                      <img src={f} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-lg cursor-pointer active:scale-[0.9]"
                        title="Remover Foto"
                      >
                        <Trash2 size={11} className="stroke-[2.5]" />
                      </button>
                    </div>
                  ))}

                  {fotos.length < 6 && (
                    <label className="aspect-square border border-dashed border-white/20 hover:border-[#10B981]/50 bg-white/[0.01] hover:bg-[#10B981]/[0.02] rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.96] select-none">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        multiple 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                        disabled={saving}
                      />
                      <Camera size={18} className="text-slate-400" />
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Tirar Foto</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Destinatário Ausente Checkbox */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex items-center justify-between select-none">
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Entrega sem Recebedor</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-none">Marque se entregar sem recebedor (foto obrigatória)</p>
                </div>
                <input 
                  type="checkbox"
                  checked={destinatarioAusente}
                  onChange={(e) => setDestinatarioAusente(e.target.checked)}
                  className="w-5 h-5 rounded border-white/15 bg-slate-900 accent-[#10B981] cursor-pointer"
                  disabled={saving}
                />
              </div>

              {/* Nome e Documento do Recebedor */}
              {!destinatarioAusente && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Quem Recebeu (Obrigatório)</label>
                    <input 
                      type="text"
                      placeholder="Nome completo do recebedor"
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-[#10B981] text-xs font-bold text-white"
                      value={nomeRecebedor}
                      onChange={(e) => setNomeRecebedor(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento / CPF do Recebedor (Opcional)</label>
                    <input 
                      type="text"
                      placeholder="Ex: CPF ou RG do recebedor"
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-[#10B981] text-xs font-bold text-white"
                      value={documentoRecebedor}
                      onChange={(e) => setDocumentoRecebedor(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  {/* Assinatura do Recebedor */}
                  <div className="space-y-2 select-none">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura do Recebedor (Obrigatória)</label>
                      {hasDrawnRecebedor && (
                        <button 
                          type="button" 
                          onClick={clearCanvasRecebedor}
                          className="text-[9.5px] font-black text-[#10B981] hover:underline flex items-center gap-1 cursor-pointer"
                          disabled={saving}
                        >
                          <RotateCcw size={11} /> Limpar
                        </button>
                      )}
                    </div>

                    <div className="border border-white/10 bg-white rounded-2xl h-36 relative overflow-hidden flex shrink-0">
                      <canvas
                        ref={canvasRecebedorRef}
                        width={460}
                        height={144}
                        onMouseDown={startDrawingRecebedor}
                        onMouseMove={drawRecebedor}
                        onMouseUp={stopDrawingRecebedor}
                        onMouseLeave={stopDrawingRecebedor}
                        onTouchStart={startDrawingRecebedor}
                        onTouchMove={drawRecebedor}
                        onTouchEnd={stopDrawingRecebedor}
                        className="w-full h-full block cursor-crosshair bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações de Entrega (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Relate alguma ocorrência local, avaria, ausência ou facilidade no acesso..."
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-[#10B981] text-xs font-bold text-white"
                  value={observacaoEntrega}
                  onChange={(e) => setObservacaoEntrega(e.target.value)}
                  disabled={saving}
                />
              </div>

            </div>

            {/* Footer Modal Controles */}
            <footer className="px-5 py-4 border-t border-white/5 bg-slate-900 flex gap-3 shrink-0 select-none">
              <button 
                type="button" 
                onClick={handleCloseFinalize}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-[0.98]"
                disabled={saving}
              >
                Voltar
              </button>
              <button 
                type="button" 
                onClick={handleSendToValidation}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin shrink-0 stroke-[2.5]" /> Transmitindo...
                  </>
                ) : (
                  <>
                    <Save size={13} className="shrink-0 stroke-[2.5]" /> Finalizar Roteiro
                  </>
                )}
              </button>
            </footer>
          </div>
        );
      })()}

    </div>
  );
}
