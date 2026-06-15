'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, ArrowLeft, Play, CheckCircle, Camera, Trash2, Lock,
  RotateCcw, Save, X, ClipboardList, MapPin, User, FileText,
  Calendar, Check, LogOut, Loader2, Car, Navigation, Volume2,
  Building, Target, PlusCircle, MessageSquare, ShieldAlert, Truck
} from 'lucide-react';
import { 
  getTecnicoOrdens, updateOrdemServicoAtivo, getLoggedTenantInfo 
} from '../actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { useRouter } from 'next/navigation';
import { getChatList } from '@/app/leads/chat-actions';

export default function TecnicoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [knownOsIds, setKnownOsIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; title: string; text: string } | null>(null);
  const [totalUnreadChat, setTotalUnreadChat] = useState(0);

  // Finalization Modal State
  const [activeOsForFinalize, setActiveOsForFinalize] = useState<any>(null);
  const [relato, setRelato] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [cpfAssinante, setCpfAssinante] = useState('');
  const [clienteAusente, setClienteAusente] = useState(false);

  // Polling for chat message count
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchChatCount = async () => {
      try {
        const res = await getChatList();
        if (res.success) {
          setTotalUnreadChat(res.totalUnread || 0);
        }
      } catch (err) {
        console.error('Erro ao buscar total de chat não lido:', err);
      }
    };
    
    fetchChatCount();
    const interval = setInterval(fetchChatCount, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Canvas Drawing Ref (Cliente)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas Drawing Ref (Técnico)
  const canvasTecnicoRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingTecnicoRef = useRef(false);
  const [hasDrawnTecnico, setHasDrawnTecnico] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sb_mobile_mode');
    }
    loadTechnicianData();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasTecnico = canvasTecnicoRef.current;

    const preventDefaultTouch = (e: TouchEvent) => {
      // Prevent scrolling/bouncing only when dragging inside either canvas
      if (e.target === canvas || e.target === canvasTecnico) {
        e.preventDefault();
      }
    };

    if (canvas) {
      canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }
    if (canvasTecnico) {
      canvasTecnico.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvasTecnico.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventDefaultTouch);
        canvas.removeEventListener('touchmove', preventDefaultTouch);
      }
      if (canvasTecnico) {
        canvasTecnico.removeEventListener('touchstart', preventDefaultTouch);
        canvasTecnico.removeEventListener('touchmove', preventDefaultTouch);
      }
    };
  }, [activeOsForFinalize]);

  // Trata o redimensionamento e deslocamento de tela no iOS (Safari) para evitar "pulos" e zoom no foco dos inputs
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport || !activeOsForFinalize) return;

    const handleResize = () => {
      const modalElement = document.getElementById('finalize-modal-container');
      if (modalElement) {
        // Encolhe a altura do modal para caber exatamente na área visível (acima do teclado)
        modalElement.style.height = `${window.visualViewport.height}px`;
        // Ancorre o modal no topo da viewport visível do iOS
        modalElement.style.top = `${window.visualViewport.offsetTop}px`;
        // Trava a rolagem global da janela para evitar o deslocamento do Safari
        window.scrollTo(0, 0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Executa imediatamente
    handleResize();

    // Pequeno delay para garantir sincronia com a animação de entrada do teclado
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
  }, [activeOsForFinalize]);

  // Polling de 30 segundos em background para novas ordens de serviço
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      loadTechnicianDataSilently();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser, knownOsIds]);

  // Rastreamento periódico de GPS quando em deslocamento
  useEffect(() => {
    const activeTransitOs = ordens.find(o => o.status === 'EM_DESLOCAMENTO');
    if (!activeTransitOs) return;

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
        await updateOrdemServicoAtivo(activeTransitOs.id, {
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
  }, [ordens]);

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

  const loadTechnicianData = async () => {
    setLoading(true);
    try {
      const [ordensRes, loggedUser, tenantRes] = await Promise.all([
        getTecnicoOrdens(),
        getLoggedUser(),
        getLoggedTenantInfo()
      ]);

      if (ordensRes.success && ordensRes.ordens) {
        setOrdens(ordensRes.ordens);
        setKnownOsIds(ordensRes.ordens.map((os: any) => os.id));
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
          if (isDeliv) {
            router.push('/entrega/entregador');
            return;
          } else if (!isTech) {
            router.push('/leads/mobile');
            return;
          }
        }
      }
      if (tenantRes.success) {
        setTenant(tenantRes.tenant);
      }
    } catch (err) {
      console.error(err);
      showAlert('error', 'Erro de Conexão', 'Não foi possível carregar as informações do servidor.');
    }
    setLoading(false);
  };

  const loadTechnicianDataSilently = async () => {
    try {
      const ordensRes = await getTecnicoOrdens();
      if (ordensRes.success && ordensRes.ordens) {
        const newOrdens = ordensRes.ordens;
        
        const hasNewOs = newOrdens.some((os: any) => 
          os.status === 'PROGRAMADO' && !knownOsIds.includes(os.id)
        );
        
        if (hasNewOs && knownOsIds.length > 0) {
          playNotificationSound();
          showAlert('success', 'Nova OS Recebida!', 'Uma nova ordem de serviço foi atribuída a você.');
        }
        
        setOrdens(newOrdens);
        setKnownOsIds(newOrdens.map((os: any) => os.id));
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

  const handleStartRoute = async (osId: string, clientAddress: string) => {
    setSaving(true);
    showAlert('warning', 'Obtendo GPS...', 'Aguarde enquanto lemos a sua localização de partida.');
    
    try {
      const location = await getGPSLocation();
      
      // Abre o Google Maps IMEDIATAMENTE após obter o GPS, sem esperar chamadas de rede/banco de dados
      // Isso impede que o Chrome no Android encare a navegação como assíncrona e bloqueie o redirecionamento nativo
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${encodeURIComponent(clientAddress)}`;
      window.location.href = mapsUrl;
      
      // Atualiza o banco de dados e recarrega os dados em background de forma assíncrona
      updateOrdemServicoAtivo(osId, {
        status: 'EM_DESLOCAMENTO',
        latitudePartida: location.latitude,
        longitudePartida: location.longitude,
        rotaIniciadaEm: new Date().toISOString()
      }).then((res) => {
        if (res.success) {
          loadTechnicianData();
        } else {
          showAlert('error', 'Falha ao Iniciar Rota', res.error || 'Erro ao atualizar dados.');
        }
      }).catch((err) => {
        console.error('Erro ao atualizar OS no banco de dados:', err);
      }).finally(() => {
        setSaving(false);
      });
      
    } catch (err: any) {
      showAlert('error', 'GPS Obrigatório', err.message || 'É necessário permitir o acesso ao GPS para iniciar a rota.');
      setSaving(false);
    }
  };

  const handleOpenRouteAgain = (os: any) => {
    const lat = os.latitudePartida;
    const lng = os.longitudePartida;
    const dest = os.client?.endereco || '';
    
    let mapsUrl = '';
    if (lat && lng) {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(dest)}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
    }
    window.location.href = mapsUrl;
  };

  const handleOpenRouteMap = (list: any[]) => {
    const activeItems = list.filter(os => os.client && os.client.endereco);
    if (activeItems.length === 0) return;
    
    let url = "";
    if (activeItems.length === 1) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeItems[0].client.endereco)}`;
    } else {
      const origin = encodeURIComponent(activeItems[0].client.endereco);
      const destination = encodeURIComponent(activeItems[activeItems.length - 1].client.endereco);
      const waypoints = activeItems.slice(1, activeItems.length - 1)
        .map(os => encodeURIComponent(os.client.endereco))
        .join('|');
      
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }
    }
    
    window.open(url, '_blank');
  };

  const handleStartService = async (osId: string) => {
    setSaving(true);
    showAlert('warning', 'Validando Chegada...', 'Aguarde enquanto o GPS valida a sua localização de chegada.');
    
    try {
      const location = await getGPSLocation();
      const res = await updateOrdemServicoAtivo(osId, {
        status: 'EM_ANDAMENTO',
        latitudeChegada: location.latitude,
        longitudeChegada: location.longitude
      });
      
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'Atendimento Iniciado', 'Você chegou ao cliente. O atendimento foi iniciado.');
      } else {
        showAlert('error', 'Falha ao Iniciar Atendimento', res.error || 'Erro ao registrar chegada.');
      }
    } catch (err: any) {
      showAlert('error', 'GPS Obrigatório', err.message || 'É necessário permitir o acesso ao GPS para registrar a sua chegada ao cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFinalize = (os: any) => {
    setActiveOsForFinalize(os);
    setRelato('');
    setFotos([]);
    setNomeAssinante(os.client?.contato || '');
    setCpfAssinante('');
    setHasDrawn(false);
    setHasDrawnTecnico(false);
    setClienteAusente(false);
    
    // Auto-scroll to top and block background scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseFinalize = () => {
    setActiveOsForFinalize(null);
    document.body.style.overflow = 'unset';
  };

  // Canvas event handlers
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
    
    // Scale coordinates correctly based on display size vs canvas resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    
    return { x, y };
  };

  // ─── CLIENT DRAWING HANDLERS ───
  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingRef.current = true;
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
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
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // ─── TECHNICIAN DRAWING HANDLERS ───
  const startDrawingTecnico = (e: any) => {
    e.preventDefault();
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingTecnicoRef.current = true;
  };

  const drawTecnico = (e: any) => {
    if (!isDrawingTecnicoRef.current) return;
    e.preventDefault();
    const canvas = canvasTecnicoRef.current;
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
    setHasDrawnTecnico(true);
  };

  const stopDrawingTecnico = () => {
    isDrawingTecnicoRef.current = false;
  };

  const clearCanvasTecnico = () => {
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnTecnico(false);
  };

  // Handle Photo Upload and Base64 Conversion with Client-Side Compression
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

          // Max resolution 800px (perfect for reports and fast upload)
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
            // Compress to JPEG with 0.6 quality (looks great, size is < 80KB!)
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
    if (!activeOsForFinalize) return;
    if (!relato.trim()) {
      return showAlert('warning', 'Relato Obrigatório', 'Escreva um resumo do serviço realizado.');
    }

    if (!clienteAusente) {
      if (!nomeAssinante.trim()) {
        return showAlert('warning', 'Assinante Obrigatório', 'Informe o nome do cliente que está assinando.');
      }
      if (!hasDrawn) {
        return showAlert('warning', 'Assinatura Obrigatória', 'O cliente precisa assinar no campo indicado.');
      }
    }

    if (!hasDrawnTecnico) {
      return showAlert('warning', 'Assinatura Obrigatória', 'Você (técnico) precisa assinar no campo indicado.');
    }

    const canvasCliente = canvasRef.current;
    const canvasTecnico = canvasTecnicoRef.current;
    if (!canvasTecnico) return;

    const base64Signature = (!clienteAusente && canvasCliente) ? canvasCliente.toDataURL('image/png') : 'CLIENTE AUSENTE';
    const base64SignatureTecnico = canvasTecnico.toDataURL('image/png');

    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(activeOsForFinalize.id, {
        status: 'VALIDACAO',
        observacaoAtendimento: relato,
        fotosAtendimento: JSON.stringify(fotos),
        assinaturaCliente: base64Signature,
        assinaturaTecnico: base64SignatureTecnico,
        nomeAssinante: clienteAusente ? 'CLIENTE AUSENTE' : nomeAssinante,
        cpfAssinante: clienteAusente ? 'CLIENTE AUSENTE' : cpfAssinante
      });

      if (res.success) {
        handleCloseFinalize();
        await loadTechnicianData();
        showAlert('success', 'OS Concluída com Sucesso', 'A ordem foi enviada para validação do gestor.');
      } else {
        showAlert('error', 'Falha ao Concluir', res.error || 'Erro ao finalizar ordem.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao salvar informações.');
    }
    setSaving(false);
  };

  const handleCancelService = async (osId: string) => {
    if (!confirm('Deseja realmente desfazer o início do atendimento e voltar o status para Em Deslocamento?')) return;
    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(osId, { 
        status: 'EM_DESLOCAMENTO',
        latitudeChegada: null,
        longitudeChegada: null
      });
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'Início Desfeito', 'O status da ordem voltou para Em Deslocamento.');
      } else {
        showAlert('error', 'Falha ao Reverter', res.error || 'Não foi possível reverter o início do atendimento.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao atualizar status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOs = async (osId: string) => {
    const motivo = prompt('Informe o motivo do cancelamento da Ordem de Serviço:');
    if (motivo === null) return;
    if (!motivo.trim()) {
      return showAlert('warning', 'Motivo Obrigatório', 'Você precisa informar um motivo para cancelar a OS.');
    }
    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(osId, { 
        status: 'VALIDACAO',
        observacaoAtendimento: `Cancelamento solicitado pelo técnico. Motivo: ${motivo}`
      });
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'Cancelamento Solicitado', 'A solicitação de cancelamento foi enviada para validação do gestor.');
      } else {
        showAlert('error', 'Falha ao Solicitar', res.error || 'Não foi possível solicitar o cancelamento.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao solicitar cancelamento.');
    }
    setSaving(false);
  };

  const isTecnico = currentUser?.cargo?.toLowerCase().includes('tecnico') || currentUser?.cargo?.toLowerCase().includes('técnico');
  const isGestor = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isSomenteTecnico = isTecnico && !isGestor;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none pb-24">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 bg-[#1B4D3E] text-white z-40 px-4 py-3 flex flex-col gap-3 shadow-md select-none">
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
              className="flex-1 flex items-center justify-center gap-1 bg-[#1A3D33] text-white border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer"
            >
              <Wrench size={11} /> Técnico
            </button>
            <button
              onClick={() => router.push('/entrega/entregador')}
              className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all hover:text-white cursor-pointer"
            >
              <Truck size={11} /> Entrega
            </button>
          </div>
        )}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.nome} 
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-black text-sm shrink-0">
                {currentUser?.nome ? currentUser.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'T'}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-black uppercase block text-white leading-tight truncate">{currentUser?.nome || 'Carregando...'}</span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block leading-none mt-0.5">{currentUser?.cargo || 'Técnico'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/api/auth/logout"
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center text-white"
              title="Sair da Conta (Logout)"
            >
              <LogOut size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ALERT BOX */}
      {alert && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-fade-in">
          <div className={`p-4 rounded-2xl border shadow-lg flex items-start gap-3 ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            <CheckCircle className="shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">{alert.title}</h4>
              <p className="text-[11px] font-semibold mt-0.5 leading-relaxed">{alert.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-tr from-[#1B4D3E] to-[#2E6B58] text-white p-5 rounded-3xl shadow-sm space-y-2">
          <h2 className="text-sm font-black uppercase tracking-wider">Olá, {currentUser?.nome || 'Técnico'}!</h2>
          <p className="text-[11px] font-semibold text-white/85 leading-relaxed">
            Aqui você gerencia suas ordens de serviço pendentes. Inicie o atendimento e preencha o relatório para conclusão.
          </p>
          <div className="pt-2 flex gap-4 text-center">
            <div>
              <span className="text-[18px] font-black block leading-none">{ordens.length}</span>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-200">Ordens Ativas</span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-[18px] font-black block leading-none">
                {ordens.filter(o => o.status === 'EM_ANDAMENTO').length}
              </span>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-200">Em Atendimento</span>
            </div>
          </div>
        </div>

        {/* SECTION TITLE */}
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardList size={13} /> Suas Ordens de Serviço
          </span>
          <div className="flex gap-3">
            {ordens.length > 0 && (
              <button 
                onClick={() => handleOpenRouteMap(ordens)}
                className="text-[9px] font-black text-[#1B4D3E] uppercase hover:underline cursor-pointer flex items-center gap-0.5"
              >
                🗺️ Ver Rota no Mapa
              </button>
            )}
            <button 
              onClick={loadTechnicianData}
              className="text-[9px] font-black text-[#1B4D3E] uppercase hover:underline cursor-pointer"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#1B4D3E]" size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest">Carregando ordens...</span>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && ordens.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Check size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tudo em Dia!</h3>
              <p className="text-[10px] font-semibold text-slate-450 mt-1">Nenhuma ordem de serviço programada no seu nome.</p>
            </div>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && ordens.map((os) => {
          const isPending = os.status === 'PROGRAMADO';
          const isTransit = os.status === 'EM_DESLOCAMENTO';
          const isProgress = os.status === 'EM_ANDAMENTO';
          
          const hasActiveOs = ordens.some(o => o.status === 'EM_DESLOCAMENTO' || o.status === 'EM_ANDAMENTO');
          const firstPendingOs = ordens.find(o => o.status === 'PROGRAMADO');
          const isLocked = isPending && (hasActiveOs || (firstPendingOs && os.id !== firstPendingOs.id));
          
          let statusText = 'Programada';
          let statusStyle = 'bg-blue-50 text-blue-700 border-blue-200';
          if (isTransit) {
            statusText = 'Em Deslocamento';
            statusStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
          } else if (isProgress) {
            statusText = 'Em Atendimento';
            statusStyle = 'bg-amber-50 text-amber-700 border-amber-200';
          }
          
          return (
            <div key={os.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
              {/* Card Header */}
              <header className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center select-none">
                <span className="font-mono text-[9.5px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  OS № {String(os.codigo).padStart(3, '0')}
                </span>
                <span className={`px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase tracking-wider ${statusStyle}`}>
                  {statusText}
                </span>
              </header>

              {/* Card Body */}
              <div className="p-4 space-y-3 text-left">
                {/* Client Info */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] block">{os.tipo}</span>
                  <h3 className="text-xs font-black text-slate-800 uppercase leading-snug">{os.client.nomeFantasia}</h3>
                  <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" /> {os.client.endereco || 'Sem endereço cadastrado'}
                  </p>
                </div>

                {/* Asset Info */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[10px] space-y-1 font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-extrabold uppercase">Equipamento:</span>
                    <span className="uppercase text-slate-850 truncate max-w-[180px]">{os.ativo.descricao}</span>
                  </div>
                  {os.tipo === 'TROCA' && os.ativoDestino && (
                    <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1 text-[#1B4D3E]">
                      <span className="font-extrabold uppercase">Trocar por:</span>
                      <span className="uppercase font-black truncate max-w-[180px]">{os.ativoDestino.descricao}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                    <span className="text-slate-400 font-extrabold uppercase">Qtd / Vlr Previsto:</span>
                    <span className="text-slate-850">
                      {(() => {
                        const contratoItem = os.contratoComodato?.itens?.find(
                          (it: any) => it.ativoId === os.ativoId || (os.ativoDestinoId && it.ativoId === os.ativoDestinoId)
                        );
                        const qty = (contratoItem && contratoItem.quantidade > 0) ? contratoItem.quantidade : 1;
                        const val = (contratoItem && contratoItem.valorUnitario > 0) ? contratoItem.valorUnitario : (os.ativo?.valor || 0);
                        return `${Number(qty).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} | ${(qty * val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                      })()}
                    </span>
                  </div>
                  {os.dataPrevista && (
                    <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                      <span className="text-slate-400 font-extrabold uppercase">Data Prevista:</span>
                      <span className="text-slate-850">{new Date(os.dataPrevista).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {/* Refusal Warning */}
                {os.observacaoAtendimento && os.observacaoAtendimento.startsWith("Motivo da recusa do cancelamento:") && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert size={12} className="shrink-0 text-red-650" /> Cancelamento Recusado pelo Gestor
                    </span>
                    <p className="text-[10.5px] font-bold text-red-700 leading-relaxed bg-red-50/70 rounded-xl p-3 border border-red-200/60 select-text">
                      {os.observacaoAtendimento.replace("Motivo da recusa do cancelamento:", "").trim()}
                    </p>
                  </div>
                )}

                {/* Instructions */}
                {os.instrucoes && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instruções do Gestor</span>
                    <p className="text-[10.5px] font-semibold text-slate-650 leading-relaxed bg-[#1B4D3E]/5 rounded-xl p-3 border border-[#1b4d3e]/10">
                      {os.instrucoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer - 100% Mobile Responsive stacked buttons */}
              <footer className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 select-none">
                {isPending && (
                  <div className="flex flex-col gap-2 w-full">
                    {isLocked ? (
                      <div className="w-full bg-slate-100 text-slate-400 border border-slate-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 select-none">
                        <Lock size={13} className="shrink-0" /> Aguardando OS Anterior na Fila
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartRoute(os.id, os.client?.endereco || '')}
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Navigation size={13} fill="white" className="shrink-0" /> Iniciar Rota (Google Maps)
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelOs(os.id)}
                      disabled={saving || isLocked}
                      className="w-full bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:hover:bg-red-50 disabled:text-red-300 disabled:border-red-100 text-red-700 border border-red-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <X size={12} className="shrink-0" /> Cancelar Ordem de Serviço (OS)
                    </button>
                  </div>
                )}
                {isTransit && (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => handleStartService(os.id)}
                      disabled={saving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <CheckCircle size={13} fill="white" className="shrink-0" /> Cheguei / Iniciar Atendimento
                    </button>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleOpenRouteAgain(os)}
                        className="flex-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Car size={12} className="shrink-0" /> Rota Novamente
                      </button>
                      <button
                        onClick={() => handleCancelOs(os.id)}
                        disabled={saving}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <X size={12} className="shrink-0" /> Cancelar OS
                      </button>
                    </div>
                    {/* Aviso de GPS ativo para celulares Android corporativos */}
                    <div className="mt-1 bg-blue-50 border border-blue-200 rounded-2xl p-3 text-[10px] font-bold text-blue-800 flex items-start gap-2 leading-relaxed select-none">
                      <Navigation size={14} className="shrink-0 text-blue-600 mt-0.5 animate-pulse" />
                      <div>
                        <p className="font-extrabold uppercase tracking-wide">Rastreamento de Rota Ativo</p>
                        <p className="mt-0.5 font-medium">Por favor, mantenha o celular no suporte do veículo com o carregador conectado. Para que o rastreamento em tempo real funcione, evite bloquear a tela do aparelho.</p>
                      </div>
                    </div>
                  </div>
                )}
                {isProgress && (
                  <div className="flex flex-col gap-2.5 w-full">
                    <button
                      onClick={() => handleOpenFinalize(os)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <CheckCircle size={14} className="shrink-0" /> Finalizar Atendimento
                    </button>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleCancelService(os.id)}
                        disabled={saving}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw size={12} className="shrink-0" /> Desfazer Início
                      </button>
                      <button
                        onClick={() => handleCancelOs(os.id)}
                        disabled={saving}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <X size={12} className="shrink-0" /> Cancelar OS
                      </button>
                    </div>
                  </div>
                )}
              </footer>
            </div>
          );
        })}
      </main>

      {/* FINALIZATION MODAL / SCREEN - Responsive overflow containment */}
      {activeOsForFinalize && (
        <div 
          id="finalize-modal-container"
          className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up overflow-y-auto overflow-x-hidden w-full max-w-md mx-auto border-x border-slate-100 shadow-2xl"
        >
          {/* Modal Header */}
          <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between z-40 select-none">
            <button 
              onClick={handleCloseFinalize}
              className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-500 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest text-center">
              Encerramento OS № {String(activeOsForFinalize.codigo).padStart(3, '0')}
            </h2>
            <div className="w-8"></div> {/* Spacer for symmetry */}
          </header>

          {/* Modal Body - Strict width mapping and horizontal lock */}
          <div className="flex-1 p-4 w-full max-w-md mx-auto space-y-5 pb-8 text-left overflow-x-hidden">
            {/* Context Summary card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-xs font-bold text-slate-700 space-y-2.5">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] block">Cliente</span>
                <div className="text-slate-850 uppercase text-xs font-extrabold">{activeOsForFinalize.client.nomeFantasia}</div>
                <div className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 leading-snug">
                  <MapPin size={9} /> {activeOsForFinalize.client.endereco}
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block leading-none">Quantidade</span>
                  <span className="text-slate-850 font-black">
                    {(() => {
                      const contratoItem = activeOsForFinalize.contratoComodato?.itens?.find(
                        (it: any) => it.ativoId === activeOsForFinalize.ativoId || (activeOsForFinalize.ativoDestinoId && it.ativoId === activeOsForFinalize.ativoDestinoId)
                      );
                      const qty = (contratoItem && contratoItem.quantidade > 0) ? contratoItem.quantidade : 1;
                      return Number(qty).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-extrabold uppercase block leading-none">Valor Previsto</span>
                  <span className="text-slate-850 font-black">
                    {(() => {
                      const contratoItem = activeOsForFinalize.contratoComodato?.itens?.find(
                        (it: any) => it.ativoId === activeOsForFinalize.ativoId || (activeOsForFinalize.ativoDestinoId && it.ativoId === activeOsForFinalize.ativoDestinoId)
                      );
                      const qty = (contratoItem && contratoItem.quantidade > 0) ? contratoItem.quantidade : 1;
                      const val = (contratoItem && contratoItem.valorUnitario > 0) ? contratoItem.valorUnitario : (activeOsForFinalize.ativo?.valor || 0);
                      return (qty * val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Report Form */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Relato do Atendimento *</label>
              <textarea
                rows={4}
                value={relato}
                onChange={(e) => setRelato(e.target.value)}
                placeholder="Descreva detalhadamente o serviço efetuado, as condições do equipamento e os fatos ocorridos..."
                className="w-full px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-800 outline-none focus:border-[#1B4D3E] resize-none leading-relaxed"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Photos Uploader */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Anexar Fotos do Serviço</label>
              <div className="grid grid-cols-3 gap-2 select-none w-full">
                {/* Photo Previews */}
                {fotos.map((foto, index) => (
                  <div key={index} className="aspect-square relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group">
                    <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-red-650 text-white rounded-lg opacity-90 active:scale-90 transition-all cursor-pointer shadow-sm"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Upload Button Card */}
                {fotos.length < 6 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#1B4D3E]/30 bg-slate-50 flex flex-col items-center justify-center text-slate-400 active:scale-95 transition-all cursor-pointer">
                    <Camera size={20} className="stroke-[2]" />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-1.5 text-slate-500">Adicionar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                      style={{ fontSize: '16px' }}
                    />
                  </label>
                )}
              </div>
              <p className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">Permitido até 6 fotos anexas.</p>
            </div>

            {/* Checkbox Cliente Ausente */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 select-none active:scale-[0.98] transition-all cursor-pointer"
                 onClick={() => setClienteAusente(!clienteAusente)}>
              <input
                type="checkbox"
                id="cliente-ausente-checkbox"
                checked={clienteAusente}
                onChange={(e) => setClienteAusente(e.target.checked)}
                className="w-4 h-4 text-[#1B4D3E] border-slate-300 rounded focus:ring-[#1B4D3E] cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-left">
                <label htmlFor="cliente-ausente-checkbox" className="text-xs font-black text-amber-800 uppercase tracking-wide cursor-pointer block leading-none">Cliente Ausente</label>
                <span className="text-[9.5px] text-amber-600 font-semibold leading-relaxed mt-0.5 block">Marque se não houver um responsável para assinar no local.</span>
              </div>
            </div>

            {!clienteAusente && (
              /* Client signature canvas block */
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Assinatura Digital do Cliente *</label>
                  <button
                    onClick={clearCanvas}
                    className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw size={10} /> Limpar
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 select-none touch-none w-full">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={140}
                    className="w-full bg-slate-50 cursor-crosshair touch-none block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none">
                  Colete a assinatura do responsável tocando na tela acima
                </div>
              </div>
            )}

            {/* Technician signature canvas block */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Assinatura Digital do Técnico *</label>
                <button
                  onClick={clearCanvasTecnico}
                  className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw size={10} /> Limpar
                </button>
              </div>
              
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 select-none touch-none w-full">
                <canvas
                  ref={canvasTecnicoRef}
                  width={340}
                  height={140}
                  className="w-full bg-slate-50 cursor-crosshair touch-none block"
                  onMouseDown={startDrawingTecnico}
                  onMouseMove={drawTecnico}
                  onMouseUp={stopDrawingTecnico}
                  onMouseLeave={stopDrawingTecnico}
                  onTouchStart={startDrawingTecnico}
                  onTouchMove={drawTecnico}
                  onTouchEnd={stopDrawingTecnico}
                />
              </div>
              <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest select-none">
                Sua assinatura (técnico) tocando na tela acima
              </div>
            </div>

            {!clienteAusente && (
              /* Signee metadata - Stacked vertically for mobile readability and full width */
              <div className="space-y-3 w-full">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Nome do Assinante *</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente responsável"
                    value={nomeAssinante}
                    onChange={(e) => setNomeAssinante(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">CPF do Assinante</label>
                  <input
                    type="text"
                    placeholder="Apenas números (opcional)"
                    value={cpfAssinante}
                    onChange={(e) => setCpfAssinante(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white transition-colors"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <footer className="pt-4 border-t border-slate-100 flex gap-3 select-none">
              <button
                onClick={handleCloseFinalize}
                className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendToValidation}
                disabled={saving}
                className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save size={13} /> {saving ? 'Enviando...' : 'Concluir & Enviar'}
              </button>
            </footer>
          </div>
        </div>
      )}
      {/* MOBILE TAB NAVIGATION BAR FIXED AT BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 py-2 select-none border-x-0 border-b-0 border-solid flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)] no-print">
        
        {!isSomenteTecnico && (
          <>
            {/* Tab CRM */}
            <a
              href="/leads?tab=crm"
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
            >
              <Building size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Funil CRM</span>
            </a>

            {/* Tab Prospecção */}
            <a
              href="/leads?tab=prospeccao"
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
            >
              <Target size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Prospecção</span>
            </a>

            {/* Tab Novo Lead */}
            <a
              href="/leads?openCreate=true"
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
            >
              <PlusCircle size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Novo Lead</span>
            </a>
          </>
        )}

        {/* Tab Área do Técnico (Active) */}
        <a
          href="/ativos/tecnico"
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent text-[#1B4D3E] font-black no-underline"
        >
          <Wrench size={18} className="text-[#1B4D3E]" />
          <span className="text-[8px] uppercase tracking-wider">Técnico</span>
        </a>

        {/* Tab Chat Interno */}
        <a
          href="/chat"
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline relative"
        >
          <MessageSquare size={18} className="text-slate-400" />
          <span className="text-[8px] uppercase tracking-wider">Chat Time</span>
          {totalUnreadChat > 0 && (
            <span className="absolute top-1 right-3 bg-blue-500 text-white text-[7px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse">
              {totalUnreadChat}
            </span>
          )}
        </a>
      </nav>
    </div>
  );
}
