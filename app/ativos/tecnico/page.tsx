'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Wrench, ArrowLeft, Play, CheckCircle, Camera, Trash2, 
  RotateCcw, Save, X, ClipboardList, MapPin, User, FileText,
  Calendar, Check, LogOut, Loader2, Briefcase
} from 'lucide-react';
import { 
  getTecnicoOrdens, updateOrdemServicoAtivo, getLoggedTenantInfo 
} from '../actions';
import { getLoggedUser } from '@/app/propostas/actions';

export default function TecnicoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; title: string; text: string } | null>(null);

  // Finalization Modal State
  const [activeOsForFinalize, setActiveOsForFinalize] = useState<any>(null);
  const [relato, setRelato] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [cpfAssinante, setCpfAssinante] = useState('');

  // Canvas Drawing Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sb_mobile_mode');
    }
    loadTechnicianData();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      // Prevent scrolling/bouncing only when dragging inside the canvas
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    // Use native event listeners with passive: false to successfully call preventDefault() on mobile
    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
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

  const loadTechnicianData = async () => {
    setLoading(true);
    try {
      const [ordensRes, loggedUser, tenantRes] = await Promise.all([
        getTecnicoOrdens(),
        getLoggedUser(),
        getLoggedTenantInfo()
      ]);

      if (ordensRes.success) {
        setOrdens(ordensRes.ordens || []);
      }
      if (loggedUser) {
        setCurrentUser(loggedUser);
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

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, text: string) => {
    setAlert({ type, title, text });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleStartService = async (osId: string) => {
    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(osId, { status: 'EM_ANDAMENTO' });
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'Atendimento Iniciado', 'O status da ordem foi alterado para Em Atendimento.');
      } else {
        showAlert('error', 'Falha ao Iniciar', res.error || 'Não foi possível iniciar o atendimento.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao atualizar status.');
    }
    setSaving(false);
  };

  const handleOpenFinalize = (os: any) => {
    setActiveOsForFinalize(os);
    setRelato('');
    setFotos([]);
    setNomeAssinante(os.client?.contato || '');
    setCpfAssinante('');
    setHasDrawn(false);
    
    // Auto-scroll to top and block background scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
  };

  const handleCloseFinalize = () => {
    setActiveOsForFinalize(null);
    document.body.style.overflow = 'unset';
  };

  // Canvas event handlers
  const getCoordinates = (e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
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

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
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

    const coords = getCoordinates(e);
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
    if (!nomeAssinante.trim()) {
      return showAlert('warning', 'Assinante Obrigatório', 'Informe o nome do cliente que está assinando.');
    }

    if (!hasDrawn) {
      return showAlert('warning', 'Assinatura Obrigatória', 'O cliente precisa assinar no campo indicado.');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64Signature = canvas.toDataURL('image/png');

    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(activeOsForFinalize.id, {
        status: 'VALIDACAO',
        observacaoAtendimento: relato,
        fotosAtendimento: JSON.stringify(fotos),
        assinaturaCliente: base64Signature,
        nomeAssinante: nomeAssinante,
        cpfAssinante: cpfAssinante
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
    if (!confirm('Deseja realmente cancelar o atendimento e voltar o status para Programado?')) return;
    setSaving(true);
    try {
      const res = await updateOrdemServicoAtivo(osId, { status: 'PROGRAMADO' });
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'Atendimento Cancelado', 'O status da ordem voltou para Programada.');
      } else {
        showAlert('error', 'Falha ao Reverter', res.error || 'Não foi possível cancelar o atendimento.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao atualizar status.');
    }
    setSaving(false);
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
        status: 'CANCELADA',
        observacao: `Cancelada pelo técnico. Motivo: ${motivo}`
      });
      if (res.success) {
        await loadTechnicianData();
        showAlert('success', 'OS Cancelada com Sucesso', 'A ordem de serviço foi cancelada.');
      } else {
        showAlert('error', 'Falha ao Cancelar', res.error || 'Não foi possível cancelar a OS.');
      }
    } catch (err: any) {
      showAlert('error', 'Erro', err.message || 'Erro ao cancelar OS.');
    }
    setSaving(false);
  };

  const isTecnico = currentUser?.cargo?.toLowerCase().includes('tecnico') || currentUser?.cargo?.toLowerCase().includes('técnico');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none pb-8">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 bg-[#1B4D3E] text-white z-40 px-4 py-4 flex items-center justify-between shadow-md select-none">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            <img 
              src={`/api/tenant/logo?tenantId=${tenant.id}&v=${tenant.logoUrl.length > 30 ? encodeURIComponent(tenant.logoUrl.substring(tenant.logoUrl.length - 10)) : encodeURIComponent(tenant.logoUrl.substring(0, 10))}`} 
              alt="Logo" 
              className="h-7 w-auto object-contain rounded bg-white p-0.5"
            />
          ) : (
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs text-white">
              S
            </div>
          )}
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-white/90">Área do Técnico</h1>
            <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest leading-none">Slimpe Operacional</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase block text-white leading-tight">{currentUser.nome}</span>
              <span className="text-[8.5px] font-bold text-white/60 block leading-none">{currentUser.cargo || 'Técnico'}</span>
            </div>
          )}
          {isTecnico ? (
            <a 
              href="/api/auth/logout"
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center text-white"
              title="Sair da Conta (Logout)"
            >
              <LogOut size={16} />
            </a>
          ) : (
            <a 
              href="/ativos?mode=desktop"
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center text-white"
              title="Voltar ao Painel de Gestão"
            >
              <Briefcase size={16} />
            </a>
          )}
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
          <button 
            onClick={loadTechnicianData}
            className="text-[9px] font-black text-[#1B4D3E] uppercase hover:underline cursor-pointer"
          >
            Atualizar
          </button>
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
          const isProgress = os.status === 'EM_ANDAMENTO';
          
          return (
            <div key={os.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
              {/* Card Header */}
              <header className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center select-none">
                <span className="font-mono text-[9.5px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  OS № {String(os.codigo).padStart(3, '0')}
                </span>
                <span className={`px-2 py-0.5 border rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                  isProgress 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isProgress ? 'Em Atendimento' : 'Programada'}
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
                  {os.dataPrevista && (
                    <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                      <span className="text-slate-400 font-extrabold uppercase">Data Prevista:</span>
                      <span className="text-slate-850">{new Date(os.dataPrevista).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

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
                    <button
                      onClick={() => handleStartService(os.id)}
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Play size={13} fill="white" className="shrink-0" /> Iniciar Atendimento
                    </button>
                    <button
                      onClick={() => handleCancelOs(os.id)}
                      disabled={saving}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <X size={12} className="shrink-0" /> Cancelar Ordem de Serviço (OS)
                    </button>
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
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-xs font-bold text-slate-700 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] block">Cliente</span>
              <div className="text-slate-850 uppercase text-xs font-extrabold">{activeOsForFinalize.client.nomeFantasia}</div>
              <div className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 leading-snug">
                <MapPin size={9} /> {activeOsForFinalize.client.endereco}
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

            {/* Client signature canvas block */}
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

            {/* Signee metadata - Stacked vertically for mobile readability and full width */}
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
    </div>
  );
}
