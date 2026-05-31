'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Settings as SettingsIcon, Layers, CalendarDays, Ruler, Plus, Trash2, 
  Save, X, Tag, Edit2, Target, Briefcase, MessageSquare, CreditCard, CheckCircle2, Lock, Smartphone, RefreshCw, Palette, Image
} from 'lucide-react';
import { 
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus, getLoggedUser 
} from '@/app/propostas/actions';
import { 
  getEscalas, createEscala, updateEscala, deleteEscala 
} from '@/app/escalas/actions';
import { 
  getUnidadesMedida, createUnidadeMedida, deleteUnidadeMedida,
  getCategorias, createCategoria, deleteCategoria,
  getTiposServico, createTipoServico, deleteTipoServico,
  getSegmentos, createSegmento, deleteSegmento,
  getSellers
} from './actions';
import { getEmpresasEmissoras, createEmpresaEmissora, updateEmpresaEmissora, deleteEmpresaEmissora } from './empresas-actions';
import { 
  getWhatsAppConnectionStatus, connectWhatsAppInstance, 
  getWhatsAppQrCode, disconnectWhatsAppInstance 
} from './zapi-actions';
import { 
  getTenantBillingInfo, paySubscriptionAction, getPlanConfigs,
  generatePixChargeAction, payWithCardAction, checkPixPaymentStatusAction,
  changeTenantLogo
} from '@/app/admin/empresas/actions';

type Tab = 'status' | 'escalas' | 'unidades' | 'categorias' | 'tipos' | 'segmentos' | 'metas' | 'empresas' | 'whatsapp' | 'faturamento' | 'marca';

const menuGroups = [
  {
    title: 'Parâmetros Operacionais',
    items: [
      { id: 'status', label: 'Status de Proposta', icon: Layers, roles: ['ADMIN', 'MANAGER', 'USER'] },
      { id: 'escalas', label: 'Escalas de Trabalho', icon: CalendarDays, roles: ['ADMIN', 'MANAGER', 'USER'] },
      { id: 'unidades', label: 'Unidades de Medida', icon: Ruler, roles: ['ADMIN', 'MANAGER', 'USER'] },
      { id: 'categorias', label: 'Categorias', icon: Tag, roles: ['ADMIN', 'MANAGER', 'USER'] },
      { id: 'tipos', label: 'Tipos de Serviço', icon: SettingsIcon, roles: ['ADMIN', 'MANAGER', 'USER'] },
      { id: 'segmentos', label: 'Segmentos de Cliente', icon: Target, roles: ['ADMIN', 'MANAGER', 'USER'] },
    ]
  },
  {
    title: 'Administrativo & Vendas',
    items: [
      { id: 'empresas', label: 'Empresas Emissoras', icon: Briefcase, roles: ['ADMIN'] },
      { id: 'metas', label: 'Metas dos Vendedores', icon: Target, roles: ['ADMIN', 'MANAGER'] },
      { id: 'marca', label: 'Identidade Visual (Logo)', icon: Palette, roles: ['ADMIN', 'MANAGER'] },
    ]
  },
  {
    title: 'Integrações & Finanças',
    items: [
      { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
      { id: 'faturamento', label: 'Assinatura & Faturamento', icon: CreditCard, roles: ['ADMIN', 'MANAGER'] },
    ]
  }
];

export default function SettingsPage() {
  // ── Estado principal ─────────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<string>('USER');
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [loading, setLoading] = useState(true);

  // Status
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newStatusName, setNewStatusName] = useState('');

  // Empresas Emissoras
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [empresaForm, setEmpresaForm] = useState({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });

  // WhatsApp Integration State
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState('Verificando status...');

  // Billing & SaaS Monets States
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number } | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'pix' | 'card'>('pix');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  // Credit Card Form
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // PIX simulation progress
  const [pixProgress, setPixProgress] = useState(0);
  const [pixTicking, setPixTicking] = useState(false);

  // Dynamic Asaas Payment States
  const [activePixCode, setActivePixCode] = useState<string>('');
  const [activePixImage, setActivePixImage] = useState<string>('');
  const [activeCobrancaId, setActiveCobrancaId] = useState<string>('');

  // Tenant Brand Logo states
  const [logoCropOpen, setLogoCropOpen] = useState(false);
  const [rawLogoSrc, setRawLogoSrc] = useState<string | null>(null);
  const [pendingLogoImage, setPendingLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoZoom, setLogoZoom] = useState(1);
  const [logoPanX, setLogoPanX] = useState(0);
  const [logoPanY, setLogoPanY] = useState(0);
  const [logoPanning, setLogoPanning] = useState(false);
  const [logoPanStart, setLogoPanStart] = useState({ x: 0, y: 0 });

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        setPendingLogoImage(img);
        setRawLogoSrc(event.target?.result as string);
        setLogoZoom(1);
        setLogoPanX(0);
        setLogoPanY(0);
        setLogoCropOpen(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoPanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setLogoPanning(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setLogoPanStart({ x: clientX - logoPanX, y: clientY - logoPanY });
  };

  const handleLogoPanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!logoPanning) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setLogoPanX(clientX - logoPanStart.x);
    setLogoPanY(clientY - logoPanStart.y);
  };

  const handleLogoPanEnd = () => {
    setLogoPanning(false);
  };

  const handleConfirmLogoCrop = async () => {
    if (!pendingLogoImage) return;
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 200; // 3:1 ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 200);

        const scaleMultiplier = 600 / 300; // Viewport is 300px wide
        
        ctx.translate(300, 100);
        ctx.translate(logoPanX * scaleMultiplier, logoPanY * scaleMultiplier);
        ctx.scale(logoZoom, logoZoom);

        const viewW = 300;
        const viewH = 100;
        let drawW = pendingLogoImage.width;
        let drawH = pendingLogoImage.height;
        const ratio = drawW / drawH;

        if (ratio > 3) {
          drawH = viewH;
          drawW = viewH * ratio;
        } else {
          drawW = viewW;
          drawH = viewW / ratio;
        }

        drawW *= scaleMultiplier;
        drawH *= scaleMultiplier;

        ctx.drawImage(pendingLogoImage, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      
      const res = await changeTenantLogo(dataUrl);
      if (res.success) {
        await loadBillingData();
        setLogoCropOpen(false);
        setRawLogoSrc(null);
        alert('Logotipo da empresa atualizado com sucesso!');
      } else {
        alert('Erro ao salvar logotipo: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const loadBillingData = async () => {
    try {
      const res = await getTenantBillingInfo();
      if (res.success) {
        setBillingInfo(res);
      }
      const plansRes = await getPlanConfigs();
      if (plansRes.success) {
        setPlans(plansRes.configs || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de faturamento:', err);
    }
  };

  const handlePayCheckout = async (metodo: string) => {
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    try {
      const valorTotal = selectedPlan.price + (billingInfo?.whatsappConnected ? billingInfo.taxaWhatsapp : 0);
      
      let res;
      if (metodo === 'CARTÃO') {
        const [month, year] = cardExpiry.split('/');
        const cardPayload = {
          holderName: cardName,
          number: cardNumber.replace(/\s+/g, ''),
          expiryMonth: month ? month.trim() : '',
          expiryYear: year ? `20${year.trim()}` : '',
          ccv: cardCvc
        };
        res = await payWithCardAction(selectedPlan.name, valorTotal, cardPayload);
      } else {
        // Fallback simulação / manual / PIX manual
        res = await paySubscriptionAction(selectedPlan.name, metodo, valorTotal);
      }

      if (res.success) {
        setCheckoutSuccess(true);
        await loadBillingData();
        // Limpa formulário
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
      } else {
        alert('Erro ao processar pagamento: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const loadPixDetails = async (planoName: string, price: number) => {
    setCheckoutLoading(true);
    setActivePixCode('');
    setActivePixImage('');
    setActiveCobrancaId('');
    try {
      const valorTotal = price + (billingInfo?.whatsappConnected ? billingInfo.taxaWhatsapp : 0);
      const res = await generatePixChargeAction(planoName, valorTotal);
      if (res.success && res.pixCode && res.pixImage && res.cobrancaId) {
        setActivePixCode(res.pixCode);
        setActivePixImage(res.pixImage);
        setActiveCobrancaId(res.cobrancaId);
      } else {
        alert('Erro ao gerar cobrança PIX no gateway: ' + (res.error || 'Erro desconhecido.'));
      }
    } catch (err: any) {
      console.error('Falha de rede ao buscar Pix:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (pixTicking) {
      interval = setInterval(() => {
        setPixProgress((prev) => {
          if (prev >= 100) {
            setPixTicking(false);
            handlePayCheckout('PIX');
            return 100;
          }
          return prev + 20;
        });
      }, 800);
    } else {
      setPixProgress(0);
    }
    return () => clearInterval(interval);
  }, [pixTicking]);

  // Polling para checar baixa real de PIX (via webhook ou API)
  useEffect(() => {
    let interval: any;
    if (activeCobrancaId && checkoutModal && activeTab === 'faturamento') {
      interval = setInterval(async () => {
        try {
          const res = await checkPixPaymentStatusAction(activeCobrancaId);
          if (res.success && res.paid) {
            setPixTicking(false);
            setPixProgress(100);
            setCheckoutSuccess(true);
            await loadBillingData();
            clearInterval(interval);
          }
        } catch (err) {
          console.error('[Polling Asaas] Erro ao verificar PIX:', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeCobrancaId, checkoutModal, activeTab]);

  const checkWhatsAppStatus = async () => {
    setWaLoading(true);
    setWaStatusMsg('Consultando conexão Z-API...');
    try {
      const res = await getWhatsAppConnectionStatus();
      if (res.success) {
        setWaConnected(!!res.connected);
        setWaPhone(res.phone || null);
        if (res.connected) {
          setWaQrCode(null);
          setWaStatusMsg('WhatsApp Conectado com sucesso!');
        } else {
          setWaStatusMsg('WhatsApp Desconectado. Pronto para escanear.');
        }
      } else {
        setWaStatusMsg('Erro ao obter status: ' + res.error);
      }
    } catch (err: any) {
      setWaStatusMsg('Falha de rede ao consultar status.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    setWaLoading(true);
    setWaStatusMsg('Criando instância na Z-API...');
    try {
      const res = await connectWhatsAppInstance();
      if (res.success) {
        setWaStatusMsg('Instância pronta! Carregando QR Code...');
        // Busca o QR Code
        const qrRes = await getWhatsAppQrCode();
        if (qrRes.success && qrRes.qrCode) {
          setWaQrCode(qrRes.qrCode);
          setWaStatusMsg('Aguardando leitura do QR Code...');
        } else {
          setWaStatusMsg(qrRes.error || 'Erro ao carregar o QR Code.');
        }
      } else {
        alert('Erro ao conectar: ' + res.error);
        setWaStatusMsg('Erro na conexão.');
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp desta empresa? Isso interromperá todos os envios e recebimentos no CRM.')) return;
    setWaLoading(true);
    setWaStatusMsg('Desconectando dispositivo na Z-API...');
    try {
      const res = await disconnectWhatsAppInstance();
      if (res.success) {
        setWaConnected(false);
        setWaPhone(null);
        setWaQrCode(null);
        setWaStatusMsg('WhatsApp desconectado.');
        alert('WhatsApp desconectado com sucesso!');
      } else {
        alert('Erro ao desconectar: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setWaLoading(false);
    }
  };


  // Empresas Emissoras
  const handleSaveEmpresa = async () => {
    if (!empresaForm.nomeFantasia.trim() || !empresaForm.razaoSocial.trim() || !empresaForm.cnpj.trim()) {
      alert('Nome Fantasia, Razão Social e CNPJ são obrigatórios.');
      return;
    }
    setLoading(true);
    let res;
    if (empresaForm.id) {
      res = await updateEmpresaEmissora(empresaForm.id, empresaForm);
    } else {
      res = await createEmpresaEmissora(empresaForm);
    }
    
    if (res.success) {
      setShowEmpresaModal(false);
      loadData();
    } else {
      alert('Erro: ' + res.error);
      setLoading(false);
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (!confirm('Excluir esta Empresa Emissora?')) return;
    const res = await deleteEmpresaEmissora(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  const openEmpresaModal = (empresa?: any) => {
    if (empresa && empresa.id) {
      setEmpresaForm(empresa);
    } else {
      setEmpresaForm({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });
    }
    setShowEmpresaModal(true);
  };


  // Tipos de Serviço
  const [tipos, setTipos] = useState<any[]>([]);
  const [newTipoNome, setNewTipoNome] = useState('');

  // Escalas
  const [escalas, setEscalas] = useState<any[]>([]);
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaForm, setEscalaForm] = useState({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });

  // Unidades de Medida
  const [unidades, setUnidades] = useState<any[]>([]);
  const [newUnidade, setNewUnidade] = useState({ nome: '' });

  // Categorias
  const [categorias, setCategorias] = useState<any[]>([]);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');

  // Segmentos
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [newSegmentoNome, setNewSegmentoNome] = useState('');

  // Metas
  const [sellers, setSellers] = useState<string[]>([]);
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // ── Verificação de acesso (deve ficar ANTES de qualquer return) ───────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkAccess = async () => {
        // Tenta primeiro parsear o cookie localmente com estratégias robustas
        const getParsedUser = () => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; sb_user=`);
          if (parts.length !== 2) return null;
          
          const rawValue = parts.pop()?.split(';').shift();
          if (!rawValue) return null;

          const cleanAndParse = (val: string) => {
            let s = val.trim();
            while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
              s = s.slice(1, -1);
            }
            return JSON.parse(s);
          };

          const strategies = [
            () => cleanAndParse(decodeURIComponent(rawValue)),
            () => cleanAndParse(rawValue),
            () => {
              let s = rawValue.trim();
              if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
              if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
              const decoded = decodeURIComponent(s);
              return cleanAndParse(decoded);
            }
          ];

          for (const strategy of strategies) {
            try {
              const data = strategy();
              if (data && typeof data === 'object') {
                return data;
              }
            } catch {}
          }
          return null;
        };

        let user = getParsedUser();

        // Se falhar no parse local, tenta obter do banco de dados (Server Action 100% confiável)
        if (!user) {
          try {
            user = await getLoggedUser();
          } catch (e) {
            console.error("Erro ao obter usuário logado via Server Action:", e);
          }
        }

        if (user) {
          setUserRole(user.role || 'USER');
          setHasAccess(true);
        } else {
          // Sem usuário logado → login
          window.location.href = '/login';
        }
      };

      checkAccess();
    }
  }, []);

  // ── Metas ────────────────────────────────────────────────────────────────────
  const loadMetas = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sb_kpi_goals');
      if (saved) {
        try {
          setMetas(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadMetas();
  }, [selectedMonth]);

  const handleSaveMeta = (sellerName: string, val: number) => {
    const goalKey = `${sellerName}_${selectedMonth}`;
    const updated = { ...metas, [goalKey]: val };
    setMetas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_kpi_goals', JSON.stringify(updated));
    }
  };

  // ── Carregamento de dados por aba ─────────────────────────────────────────────
  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [activeTab, hasAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'status') {
        const data = await getPropostaStatuses();
        setStatuses(data || []);
      } else if (activeTab === 'escalas') {
        const data = await getEscalas();
        setEscalas(data || []);
      } else if (activeTab === 'unidades') {
        const data = await getUnidadesMedida();
        setUnidades(data || []);
      } else if (activeTab === 'categorias') {
        const data = await getCategorias();
        setCategorias(data || []);
      } else if (activeTab === 'tipos') {
        const data = await getTiposServico();
        setTipos(data || []);
      } else if (activeTab === 'segmentos') {
        const data = await getSegmentos();
        setSegmentos(data || []);
      } else if (activeTab === 'empresas') {
        const data = await getEmpresasEmissoras();
        setEmpresas(data || []);
      } else if (activeTab === 'metas') {
        if (userRole === 'USER') {
          setActiveTab('status');
          return;
        }
        const sellersList = await getSellers();
        setSellers(sellersList || []);
        loadMetas();
      } else if (activeTab === 'whatsapp') {
        await checkWhatsAppStatus();
        await loadBillingData();
      } else if (activeTab === 'faturamento') {
        await loadBillingData();
      } else if (activeTab === 'marca') {
        await loadBillingData();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // Tipos
  const handleAddTipo = async () => {
    if (!newTipoNome.trim()) {
      alert('Preencha o nome do tipo de serviço.');
      return;
    }
    const res = await createTipoServico(newTipoNome);
    if (res.success) {
      setNewTipoNome('');
      loadData();
    } else {
      alert('Erro ao adicionar tipo de serviço: ' + res.error);
    }
  };

  const handleDeleteTipo = async (id: string) => {
    if (!confirm('Remover este tipo de serviço?')) return;
    const res = await deleteTipoServico(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Segmentos
  const handleAddSegmento = async () => {
    if (!newSegmentoNome.trim()) {
      alert('Preencha o nome do segmento.');
      return;
    }
    const res = await createSegmento(newSegmentoNome);
    if (res.success) {
      setNewSegmentoNome('');
      loadData();
    } else {
      alert('Erro ao adicionar segmento: ' + res.error);
    }
  };

  const handleDeleteSegmento = async (id: string) => {
    if (!confirm('Remover este segmento?')) return;
    const res = await deleteSegmento(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Status
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    const res = await createPropostaStatus(newStatusName);
    if (res.success) {
      setNewStatusName('');
      loadData();
    } else {
      alert('Erro ao adicionar status: ' + res.error);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este status?')) return;
    const res = await deletePropostaStatus(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Escalas
  const handleSaveEscala = async () => {
    if (!escalaForm.nome.trim()) return alert('O nome da escala é obrigatório.');
    setLoading(true);
    const payload = {
      nome: escalaForm.nome,
      diasTrabalhadosMes: escalaForm.diasTrabalhadosMes,
      horasMensais: escalaForm.horasMensais
    };
    if (escalaForm.id) {
      await updateEscala(escalaForm.id, payload);
    } else {
      await createEscala(payload);
    }
    setShowEscalaModal(false);
    loadData();
  };

  const openEscalaModal = (escala?: any) => {
    if (escala) {
      setEscalaForm({
        id: escala.id,
        nome: escala.nome,
        diasTrabalhadosMes: escala.diasTrabalhadosMes,
        horasMensais: escala.horasMensais
      });
    } else {
      setEscalaForm({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });
    }
    setShowEscalaModal(true);
  };

  // Unidades
  const handleAddUnidade = async () => {
    if (!newUnidade.nome.trim()) {
      alert('Preencha o nome da unidade.');
      return;
    }
    const res = await createUnidadeMedida(newUnidade.nome);
    if (res.success) {
      setNewUnidade({ nome: '' });
      loadData();
    } else {
      alert('Erro ao adicionar unidade: ' + res.error);
    }
  };

  const handleDeleteUnidade = async (id: string) => {
    if (!confirm('Remover esta unidade de medida?')) return;
    const res = await deleteUnidadeMedida(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Categorias
  const handleAddCategoria = async () => {
    if (!newCategoriaNome.trim()) {
      alert('Preencha o nome da categoria.');
      return;
    }
    const res = await createCategoria(newCategoriaNome);
    if (res.success) {
      setNewCategoriaNome('');
      loadData();
    } else {
      alert('Erro ao adicionar categoria: ' + res.error);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
    const res = await deleteCategoria(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // ── Guarda de acesso (APÓS todos os hooks) ────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <SettingsIcon size={22} /> Configurações do Sistema
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Parâmetros operacionais e tabelas auxiliares</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* TABS / MENU DE NAVEGAÇÃO LATERAL */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs space-y-5">
              {menuGroups.map((group, groupIdx) => {
                const allowedItems = group.items.filter(item => item.roles.includes(userRole));
                if (allowedItems.length === 0) return null;

                return (
                  <div key={groupIdx} className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {allowedItems.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-[#1B4D3E] text-white shadow-xs font-extrabold'
                                : 'text-slate-600 hover:text-[#1B4D3E] hover:bg-slate-50'
                            }`}
                          >
                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#1B4D3E]'} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CONTEÚDO */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-[550px] relative">
            
            {/* 1. ABA STATUS */}
            {activeTab === 'status' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> Definição de Status das Propostas
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Novo nome de status (Ex: EM ANÁLISE)"
                      value={newStatusName}
                      onChange={e => setNewStatusName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddStatus()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddStatus}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {statuses.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider ${s.color}`}>
                          {s.nome}
                        </span>
                        <button 
                          onClick={() => handleDeleteStatus(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABA ESCALAS */}
            {activeTab === 'escalas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Gestão de Escalas de Trabalho
                  </h2>
                  <button 
                    onClick={() => openEscalaModal()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Nova Escala
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="px-4 py-3">Nome da Escala</th>
                        <th className="px-4 py-3 text-center">Dias / Mês</th>
                        <th className="px-4 py-3 text-center">Horas Mensais</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {escalas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 uppercase">{e.nome}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.diasTrabalhadosMes}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.horasMensais}h</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEscalaModal(e)} className="text-amber-500 hover:text-amber-600"><Edit2 size={14} /></button>
                              <button onClick={() => { if(confirm('Excluir escala?')) deleteEscala(e.id).then(loadData) }} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ABA UNIDADES */}
            {activeTab === 'unidades' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} /> Unidades de Medida Disponíveis
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unidade de Medida (Ex: UN, KG, LITRO)"
                      value={newUnidade.nome}
                      onChange={e => setNewUnidade({nome: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleAddUnidade()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddUnidade}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {unidades.map(u => (
                      <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded relative group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-lg font-black text-slate-800 uppercase">{u.nome}</p>
                        <button 
                          onClick={() => handleDeleteUnidade(u.id)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABA CATEGORIAS */}
            {activeTab === 'categorias' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Tag size={14} /> Gestão de Categorias Geral
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Categoria (Ex: MATERIAL DE LIMPEZA)"
                      value={newCategoriaNome}
                      onChange={e => setNewCategoriaNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategoria()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddCategoria}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {categorias.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700 uppercase">{c.nome}</span>
                        <button 
                          onClick={() => handleDeleteCategoria(c.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ABA TIPOS DE SERVIÇO */}
            {activeTab === 'tipos' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <SettingsIcon size={14} /> Gestão de Tipos de Serviço
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Tipo de Serviço (Ex: Limpeza e Conservação)"
                      value={newTipoNome}
                      onChange={e => setNewTipoNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold"
                    />
                    <button 
                      onClick={handleAddTipo}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tipos.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700">{t.nome}</span>
                        <button 
                          onClick={() => handleDeleteTipo(t.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA SEGMENTOS */}
            {activeTab === 'segmentos' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Gestão de Segmentos de Cliente
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Segmento (Ex: Indústria, Varejo, Viação)"
                      value={newSegmentoNome}
                      onChange={e => setNewSegmentoNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSegmento()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddSegmento}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {segmentos.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700 uppercase">{s.nome}</span>
                        <button 
                          onClick={() => handleDeleteSegmento(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            
            {/* ABA EMPRESAS EMISSORAS */}
            {activeTab === 'empresas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Empresas Emissoras (Propostas)
                  </h2>
                  <button 
                    onClick={() => openEmpresaModal()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Nova Empresa
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="px-4 py-3">Nome Fantasia</th>
                        <th className="px-4 py-3">Razão Social</th>
                        <th className="px-4 py-3">CNPJ</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empresas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700">{e.nomeFantasia}</td>
                          <td className="px-4 py-3 text-slate-600">{e.razaoSocial}</td>
                          <td className="px-4 py-3 text-slate-600">{e.cnpj}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEmpresaModal(e)} className="text-amber-500 hover:text-amber-600"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteEmpresa(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {empresas.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhuma empresa cadastrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* 6. ABA METAS DOS VENDEDORES — somente ADMIN e MANAGER */}
            {activeTab === 'metas' && userRole !== 'USER' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Metas Mensais por Vendedor
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-200 font-bold uppercase">Mês de Referência:</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase">Como funciona?</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Selecione o mês de referência e insira as metas individuais dos vendedores nos campos abaixo. 
                        As metas são salvas automaticamente após a alteração dos valores e serão exibidas na aba de <strong>Controladoria</strong> para monitorar o atingimento.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    {sellers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum vendedor cadastrado no sistema.</p>
                    ) : (
                      sellers.map((nome) => {
                        const goalKey = `${nome}_${selectedMonth}`;
                        const goalVal = metas[goalKey] !== undefined ? metas[goalKey] : 100000;

                        return (
                          <div key={nome} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-xs transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#1B4D3E]/10 text-[#1B4D3E] font-black rounded-xl flex items-center justify-center text-xs">
                                {nome.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{nome}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meta: R$</span>
                              <input
                                type="number"
                                value={goalVal}
                                onChange={(e) => {
                                  const newVal = Number(e.target.value);
                                  handleSaveMeta(nome, newVal);
                                }}
                                className="w-36 px-3 py-2 border border-slate-300 rounded text-xs font-extrabold text-slate-800 text-right outline-none focus:border-[#1B4D3E]"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. ABA WHATSAPP INTEGRATION */}
            {activeTab === 'whatsapp' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-400" /> Integração de WhatsApp do CRM
                  </h2>
                  <button 
                    onClick={checkWhatsAppStatus}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                    disabled={waLoading}
                  >
                    🔄 Atualizar Status
                  </button>
                </div>

                <div className="p-8 max-w-3xl mx-auto space-y-6">
                  {/* ALERTA DE COBRANÇA DINÂMICA DE WHATSAPP */}
                  <div className={`border p-4 rounded-2xl flex items-start gap-3 transition-all ${
                    waConnected 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50/70 border-amber-200 text-amber-800'
                  }`}>
                    <MessageSquare className={waConnected ? 'text-emerald-600 shrink-0 mt-0.5' : 'text-amber-600 shrink-0 mt-0.5'} size={18} />
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold uppercase tracking-wide">
                        {waConnected ? 'Integração de WhatsApp Ativa' : 'Aviso de Cobrança Adicional'}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {waConnected 
                          ? `Integração de WhatsApp está ativa neste tenant. Um custo adicional de R$ ${(billingInfo?.taxaWhatsapp ?? 130).toFixed(2)}/mês está integrado ao faturamento do seu plano.` 
                          : `Nota: A ativação do WhatsApp deduzirá uma cobrança mensal automática de R$ ${(billingInfo?.taxaWhatsapp ?? 130).toFixed(2)} adicionais na mensalidade da sua assinatura.`}
                      </p>
                    </div>
                  </div>

                  {waConnected ? (
                    /* ESTADO: CONECTADO (PREMIUM CARD) */
                    <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/20 border border-emerald-200 rounded-3xl p-8 space-y-6 text-center flex flex-col items-center shadow-xs animate-in zoom-in-95 duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      
                      {/* Premium Success Circle with floating waves */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                          <MessageSquare size={36} className="stroke-[2] animate-bounce" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-100/60 px-4 py-1.5 rounded-full uppercase">Conexão Ativa</span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">WhatsApp Vinculado com Sucesso</h3>
                        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                          O número da sua empresa está totalmente integrado ao SmartBidHub CRM. Você já pode enviar e receber mensagens diretamente da tela de leads.
                        </p>
                      </div>

                      {/* Device Metadata Box */}
                      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs divide-y divide-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-xs pb-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Número Vinculado</span>
                          <span className="font-extrabold text-slate-800 tracking-tight text-sm">{waPhone ? `+${waPhone}` : 'Telefone Identificado'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Serviço de Envio</span>
                          <span className="font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md text-[10px]">Z-API Ativo</span>
                        </div>
                      </div>

                      <div className="w-full max-w-sm pt-4">
                        <button
                          onClick={handleDisconnectWhatsApp}
                          className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                          🔴 Desconectar WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ESTADO: DESCONECTADO (CONNECTION PANEL) */
                    <div className="space-y-8 animate-in fade-in duration-300">
                      
                      {/* Intro Banner */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                          <MessageSquare size={28} className="stroke-[2]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Integre o WhatsApp da sua Empresa</h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                            Conecte o seu número corporativo em segundos. O processo gera um QR Code exclusivo diretamente no nosso painel. Basta escanear como se estivesse abrindo o WhatsApp Web.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-6">
                        
                        {waQrCode ? (
                          /* SE QR CODE ESTIVER DISPONÍVEL */
                          <div className="flex flex-col items-center space-y-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm w-full max-w-md animate-in zoom-in-95 duration-200">
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/50 px-3.5 py-1.5 rounded-full animate-pulse">
                              Aguardando Leitura
                            </span>
                            
                            {/* QR Code Container with nice visual borders */}
                            <div className="w-56 h-56 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center p-4 shadow-2xs relative overflow-hidden group">
                              <img src={waQrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain select-none" />
                              <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
                            </div>

                            <div className="text-center space-y-2 max-w-xs">
                              <p className="text-xs font-bold text-slate-700 leading-normal">
                                Abra o WhatsApp no seu celular, vá em <strong className="text-slate-900">Aparelhos Conectados</strong> e selecione <strong className="text-slate-900">Conectar Aparelho</strong>.
                              </p>
                              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                O QR Code expira a cada 30 segundos. Ele se atualizará automaticamente na tela.
                              </p>
                            </div>

                            {/* Actions inside QR mode */}
                            <div className="w-full pt-4 flex gap-3">
                              <button
                                onClick={checkWhatsAppStatus}
                                className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                              >
                                Verifiquei Conexão
                              </button>
                              <button
                                onClick={handleDisconnectWhatsApp}
                                className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* SE AINDA NÃO GEROU O QR CODE */
                          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center flex flex-col items-center space-y-6 shadow-2xs">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                              <MessageSquare size={24} />
                            </div>
                            
                            <div className="space-y-2 max-w-xs">
                              <h4 className="text-base font-black text-slate-800 tracking-tight">Sem Instância Inicializada</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Você precisa inicializar as credenciais de envio e receber as informações do canal antes de gerar o QR Code de autenticação.
                              </p>
                            </div>

                            <button
                              onClick={handleConnectWhatsApp}
                              className="w-full py-4.5 bg-gradient-to-r from-[#1B4D3E] to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                              disabled={waLoading}
                            >
                              🚀 Inicializar e Gerar QR Code
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. ABA ASSINATURA & FATURAMENTO */}
            {activeTab === 'faturamento' && (
              <div>
                {/* Header */}
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={14} className="text-emerald-400" /> Assinatura & Faturamento da Empresa
                  </h2>
                </div>

                <div className="p-8 space-y-8">
                  {/* Seu Plano Atual - Premium Card */}
                  {billingInfo ? (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] bg-[#1B4D3E]/10 px-3 py-1 rounded-full">
                            Plano Atual
                          </span>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-1">
                            {billingInfo.plano === 'TESTE' ? 'Teste Grátis 7 Dias' : `Plano ${billingInfo.plano}`}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            {billingInfo.plano === 'TESTE' 
                              ? 'Experimente os recursos PRO gratuitamente.' 
                              : `Assinatura corporativa ativa no SmartBidHub.`}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs text-right min-w-[200px]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo Mensal</p>
                          <p className="text-2xl font-black text-[#1B4D3E] mt-1">
                            R$ {billingInfo.totalCost.toFixed(2)}
                            <span className="text-xs text-slate-400 font-bold">/mês</span>
                          </p>
                          {billingInfo.whatsappConnected && (
                            <p className="text-[9px] text-slate-400 mt-1 font-semibold uppercase tracking-wide">
                              Inclui WhatsApp: R$ {billingInfo.taxaWhatsapp.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quotas & Expiry grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80">
                        {/* Users Quota Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500 uppercase tracking-wider">Colaboradores Ativos</span>
                            <span className="font-extrabold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded">
                              {billingInfo.activeUsersCount} de {billingInfo.limiteUsuarios} contratados
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300/30">
                            <div 
                              className="bg-[#1B4D3E] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (billingInfo.activeUsersCount / billingInfo.limiteUsuarios) * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Next Billing Date */}
                        <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Próximo Vencimento</p>
                            <p className="text-xs font-black text-slate-800">
                              {new Date(billingInfo.nextBillingDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            Renovação Automática
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Plan Upgrade Options */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      🔥 Opções de Upgrade & Planos Disponíveis
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(() => {
                        const defaultPlans = [
                          {
                            nome: "BASICO",
                            label: "Básico",
                            preco: 149.00,
                            limiteUsuarios: 3,
                            descricao: "Ideal para pequenas imobiliárias e corretores autônomos.",
                            features: "Até 3 Usuários ativos,Acesso ao Pipeline de CRM,Prospecção de empresas,Suporte via e-mail"
                          },
                          {
                            nome: "PRO",
                            label: "Profissional (PRO)",
                            preco: 299.00,
                            limiteUsuarios: 10,
                            descricao: "Perfeito para construtoras e equipes comerciais em expansão.",
                            features: "Até 10 Usuários ativos,Acesso ilimitado a FPVs,Prospecção Inteligente IA,Calendário Global,Auditoria e logs"
                          },
                          {
                            nome: "ENTERPRISE",
                            label: "Enterprise",
                            preco: 599.00,
                            limiteUsuarios: 100,
                            descricao: "Customização e poder ilimitado para grandes corporações.",
                            features: "Até 100 Usuários ativos,Suporte 24/7 com Executivo,Integração e APIs Liberadas,SLA Avançado,Treinamento de equipe"
                          }
                        ];

                        const plansList = plans.length > 0 ? plans : defaultPlans;

                        return plansList.map((p) => {
                          const isActive = billingInfo?.plano === p.nome;
                          const featuresArray = typeof p.features === 'string' ? p.features.split(',') : [];

                          return (
                            <div 
                              key={p.nome}
                              className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative shadow-2xs hover:shadow-xs ${
                                isActive 
                                  ? 'border-[#1B4D3E] ring-2 ring-[#1B4D3E]/10 bg-slate-50/50' 
                                  : 'border-slate-200/80'
                              }`}
                            >
                              {isActive && (
                                <span className="absolute top-0 right-6 -translate-y-1/2 bg-[#1B4D3E] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                  Plano Ativo
                                </span>
                              )}

                              <div className="space-y-4">
                                <div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                    {p.nome === 'BASICO' ? 'Starter Plan' : p.nome === 'PRO' ? 'Professional Scale' : 'Enterprise Level'}
                                  </span>
                                  <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{p.label}</h4>
                                </div>

                                <div className="py-2.5 border-y border-slate-100 flex items-baseline gap-1">
                                  <span className="text-2xl font-black text-slate-800">R$ {p.preco.toFixed(0)}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ mês</span>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold uppercase">{p.descricao}</p>

                                <ul className="space-y-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                  {featuresArray.map((feat: string, fIdx: number) => (
                                    <li key={fIdx} className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                                      <span>{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                disabled={isActive}
                                onClick={() => {
                                  setSelectedPlan({ name: p.nome, price: p.preco });
                                  loadPixDetails(p.nome, p.preco);
                                  setCheckoutModal(true);
                                }}
                                className={`w-full py-3.5 mt-6 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-[#1B4D3E] hover:bg-emerald-950 text-white shadow-xs active:scale-[0.98]'
                                }`}
                              >
                                {isActive ? 'Plano Atual' : `Selecionar ${p.label}`}
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Histórico de Faturas - Elegante Tabela */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      📜 Histórico de Faturamento & Faturas Passadas
                    </h3>

                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-3xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                            <th className="px-5 py-4">Fatura ID</th>
                            <th className="px-5 py-4">Referência / Plano</th>
                            <th className="px-5 py-4">Valor Faturado</th>
                            <th className="px-5 py-4 text-center">Status</th>
                            <th className="px-5 py-4 text-center">Forma de Pagamento</th>
                            <th className="px-5 py-4 text-right">Data de Vencimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {billingInfo?.cobrancas && billingInfo.cobrancas.length > 0 ? (
                            billingInfo.cobrancas.map((cob: any) => {
                              const isPaid = cob.status === 'PAGO';
                              return (
                                <tr key={cob.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">
                                    #{cob.id.substring(0, 8).toUpperCase()}
                                  </td>
                                  <td className="px-5 py-4 font-extrabold text-slate-700 uppercase">
                                    Plano {cob.plano}
                                  </td>
                                  <td className="px-5 py-4 font-black text-slate-800">
                                    R$ {cob.valor.toFixed(2)}
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      isPaid 
                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                                    }`}>
                                      {cob.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-center text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    {cob.metodo}
                                  </td>
                                  <td className="px-5 py-4 text-right font-bold text-slate-600">
                                    {new Date(cob.dataPagamento || cob.dataVencimento).toLocaleDateString('pt-BR')}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-medium uppercase tracking-wide text-[10px]">
                                Nenhuma fatura encontrada no histórico.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'marca' && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1B4D3E] bg-[#1B4D3E]/8 px-3 py-1 rounded-full">
                      Identidade Visual
                    </span>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mt-2 font-display">Logotipo da Empresa</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Personalize o logotipo exibido nos cabeçalhos das propostas comerciais e relatórios impressos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  {/* Visualização Atual */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Logotipo Atual</h3>
                    <div className="h-44 border border-slate-200/80 bg-slate-50/50 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden group">
                      {billingInfo?.logoUrl ? (
                        <img 
                          src={billingInfo.logoUrl} 
                          alt="Logo da Empresa" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center space-y-2">
                          <Palette size={32} className="mx-auto text-slate-300" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum logotipo cadastrado</p>
                          <p className="text-[8px] font-bold text-slate-400/80 uppercase">
                            Nome Fantasia: {billingInfo?.nomeFantasia || 'Sua Empresa'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload e Ações */}
                  <div className="flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Enviar Novo Logotipo</h3>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Selecione um arquivo de imagem (PNG, JPG ou SVG). Para obter a melhor apresentação em documentos e relatórios impressos, recomendamos um formato widescreen de proporção 3:1 (ex: 300x100 pixels).
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label 
                        htmlFor="logo-file-upload" 
                        className="bg-[#1B4D3E] hover:bg-emerald-950 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-md shadow-[#1B4D3E]/20 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98]"
                      >
                        <Plus size={16} /> Selecionar Imagem
                      </label>
                      <input 
                        type="file" 
                        id="logo-file-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Sincronizando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* MODAL ESCALA */}
        {showEscalaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={14} /> {escalaForm.id ? 'Editar' : 'Nova'} Escala de Trabalho
                </h2>
                <button onClick={() => setShowEscalaModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome da Escala</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all" value={escalaForm.nome} onChange={e => setEscalaForm({...escalaForm, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias Trab. / Mês</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.diasTrabalhadosMes} onChange={e => setEscalaForm({...escalaForm, diasTrabalhadosMes: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horas Mensais</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.horasMensais} onChange={e => setEscalaForm({...escalaForm, horasMensais: Number(e.target.value)})} />
                  </div>
                </div>
                <button onClick={handleSaveEscala} className="w-full bg-[#1B4D3E] hover:bg-emerald-900 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-4">
                  <Save size={18} /> Salvar Escala
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* MODAL EMPRESA */}
        {showEmpresaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={14} /> {empresaForm.id ? 'Editar' : 'Nova'} Empresa Emissora
                </h2>
                <button onClick={() => setShowEmpresaModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Fantasia</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.nomeFantasia} onChange={e => setEmpresaForm({...empresaForm, nomeFantasia: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Razão Social</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.razaoSocial} onChange={e => setEmpresaForm({...empresaForm, razaoSocial: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.cnpj} onChange={e => setEmpresaForm({...empresaForm, cnpj: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.endereco} onChange={e => setEmpresaForm({...empresaForm, endereco: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.telefone} onChange={e => setEmpresaForm({...empresaForm, telefone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail Comercial</label>
                    <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.email} onChange={e => setEmpresaForm({...empresaForm, email: e.target.value})} />
                  </div>
                </div>
                <button onClick={handleSaveEmpresa} className="w-full bg-[#1B4D3E] hover:bg-emerald-900 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all mt-4">
                  <Save size={18} /> Cadastrar Empresa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CHECKOUT PREMIUM GLASSMORPHIC */}
        {checkoutModal && selectedPlan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={14} className="text-emerald-400" /> Checkout Seguro
                  </h3>
                  <p className="text-[10px] text-emerald-200 uppercase font-semibold">Assinatura SmartBidHub CRM</p>
                </div>
                <button 
                  onClick={() => {
                    setCheckoutModal(false);
                    setCheckoutSuccess(false);
                    setPixTicking(false);
                  }} 
                  className="text-white/60 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:scale-105"
                >
                  <X size={18} />
                </button>
              </div>

              {checkoutSuccess ? (
                /* SCREEN 1: SUCCESS CONFIRMATION */
                <div className="p-8 text-center space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                      <CheckCircle2 size={40} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black tracking-widest text-emerald-600 bg-emerald-100/60 px-4 py-1.5 rounded-full uppercase">Assinatura Ativada</span>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pagamento Confirmado!</h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                      Sua conta foi atualizada com sucesso para o plano <strong className="text-slate-800">{selectedPlan.name}</strong>. Todos os novos limites de usuários já estão disponíveis para uso imediato no sistema.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs divide-y divide-slate-100 space-y-3 text-left">
                    <div className="flex justify-between items-center text-xs pb-3">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Método</span>
                      <span className="font-extrabold text-slate-800 uppercase">Simulação Real-Time</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-3">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Faturamento Total</span>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        R$ {(selectedPlan.price + (billingInfo?.whatsappConnected ? billingInfo.taxaWhatsapp : 0)).toFixed(2)}/mês
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutModal(false);
                      setCheckoutSuccess(false);
                    }}
                    className="w-full max-w-sm py-4 bg-[#1B4D3E] hover:bg-emerald-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-100 hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    🚀 Fechar e Começar a Usar
                  </button>
                </div>
              ) : (
                /* SCREEN 2: PAYMENT METHOD SELECTION & FORMS */
                <div className="p-6 space-y-6">
                  {/* Plano Resumo */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-wider">Item de Pedido</span>
                      <h4 className="text-xs font-black text-slate-800 uppercase mt-1">Plano {selectedPlan.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase">
                        CRM Premium {selectedPlan.name === 'BASICO' ? '3 Usuários' : selectedPlan.name === 'PRO' ? '10 Usuários' : '100 Usuários'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 leading-none">Total Faturado</p>
                      <p className="text-lg font-black text-[#1B4D3E] mt-1">
                        R$ {(selectedPlan.price + (billingInfo?.whatsappConnected ? billingInfo.taxaWhatsapp : 0)).toFixed(2)}<span className="text-[10px] text-slate-400 font-bold">/mês</span>
                      </p>
                      {billingInfo?.whatsappConnected && (
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Inclui taxa do WhatsApp: R$ {billingInfo.taxaWhatsapp.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tabs Selector */}
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => setCheckoutTab('pix')}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                        checkoutTab === 'pix'
                          ? 'bg-white text-[#1B4D3E] shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📱 Pagar com PIX
                    </button>
                    <button
                      onClick={() => setCheckoutTab('card')}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                        checkoutTab === 'card'
                          ? 'bg-white text-[#1B4D3E] shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      💳 Cartão de Crédito
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {checkoutTab === 'pix' ? (
                    /* PIX TAB */
                    <div className="space-y-6 flex flex-col items-center">
                      {/* Dynamic QR Code */}
                      <div className="w-48 h-48 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center p-4 relative group overflow-hidden shadow-2xs">
                        {checkoutLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="animate-spin text-[#1B4D3E]" size={24} />
                            <span className="text-[9px] font-black text-[#1B4D3E] uppercase tracking-widest">Gerando PIX...</span>
                          </div>
                        ) : activePixImage ? (
                          <img src={activePixImage} alt="QR Code PIX Asaas" className="w-full h-full object-contain rounded-2xl animate-in fade-in duration-200" />
                        ) : (
                          <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100">
                            {/* Outer frame */}
                            <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                            <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                            
                            <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                            <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                            <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                            <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                            
                            {/* Inner pixels */}
                            <rect x="35" y="10" width="5" height="15" fill="currentColor" />
                            <rect x="45" y="5" width="10" height="5" fill="currentColor" />
                            <rect x="60" y="15" width="10" height="10" fill="currentColor" />
                            
                            <rect x="30" y="30" width="15" height="5" fill="currentColor" />
                            <rect x="55" y="35" width="20" height="5" fill="currentColor" />
                            <rect x="80" y="30" width="10" height="15" fill="currentColor" />

                            <rect x="10" y="35" width="10" height="5" fill="currentColor" />
                            <rect x="5" y="50" width="15" height="10" fill="currentColor" />
                            <rect x="35" y="45" width="10" height="20" fill="currentColor" />

                            <rect x="50" y="55" width="25" height="5" fill="currentColor" />
                            <rect x="55" y="65" width="10" height="15" fill="currentColor" />
                            <rect x="75" y="60" width="15" height="10" fill="currentColor" />

                            <rect x="30" y="75" width="10" height="10" fill="currentColor" />
                            <rect x="35" y="90" width="20" height="5" fill="currentColor" />
                            <rect x="75" y="80" width="15" height="15" fill="currentColor" />
                          </svg>
                        )}
                        <div className="absolute inset-0 bg-[#1B4D3E]/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
                      </div>

                      {/* PIX Copy & Paste Box */}
                      <div className="w-full space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código PIX Copia e Cola</label>
                        <div className="flex gap-2">
                          <textarea
                            readOnly
                            rows={2}
                            value={activePixCode || `00020101021226870014br.gov.bcb.pix2580024smartbidhubcrmpayments.com6009SAOPAULO62070503***6304E3FD`}
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-mono text-slate-500 outline-none select-all"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activePixCode || `00020101021226870014br.gov.bcb.pix2580024smartbidhubcrmpayments.com6009SAOPAULO62070503***6304E3FD`);
                              alert('Código Copiado! Efetue o pagamento em seu banco de preferência.');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 p-3 rounded-2xl text-slate-700 font-bold text-xs uppercase flex flex-col items-center justify-center shrink-0 cursor-pointer"
                          >
                            📋 Copiar
                          </button>
                        </div>
                      </div>

                      {/* Simulated validator button */}
                      <div className="w-full pt-4 space-y-3">
                        {pixTicking ? (
                          <div className="space-y-2">
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                              <div className="bg-[#1B4D3E] h-full rounded-full transition-all duration-300" style={{ width: `${pixProgress}%` }}></div>
                            </div>
                            <p className="text-[10px] text-[#1B4D3E] font-black text-center uppercase tracking-widest animate-pulse">
                              Aguardando confirmação bancária... ({pixProgress}%)
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPixTicking(true)}
                            className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                          >
                            🚀 Simular Confirmação do PIX
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* CREDIT CARD TAB */
                    <div className="space-y-6">
                      {/* Mockup Card */}
                      <div className="w-full max-w-sm mx-auto bg-gradient-to-tr from-emerald-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden aspect-[1.586/1] border border-white/10 flex flex-col justify-between">
                        {/* Glass layer */}
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
                        
                        {/* Glowing orb */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                        
                        {/* Top section: Chip & Contactless */}
                        <div className="relative z-10 flex justify-between items-start">
                          {/* Chip */}
                          <div className="w-10 h-8 bg-gradient-to-tr from-amber-300 to-yellow-500 rounded-md relative shadow-md">
                            <div className="absolute inset-1 border border-amber-900/10 rounded"></div>
                          </div>
                          {/* Wireless icon / Logo */}
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 rounded-md">
                            SmartBid Premium
                          </span>
                        </div>

                        {/* Card Number */}
                        <div className="relative z-10 my-4 text-center">
                          <p className="text-xl font-mono tracking-widest text-slate-100 font-extrabold">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </p>
                        </div>

                        {/* Bottom section: Holder & Expiry */}
                        <div className="relative z-10 flex justify-between items-end">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-left block">Titular</span>
                            <p className="text-xs font-bold uppercase tracking-wide truncate max-w-[180px]">
                              {cardName || 'NOME DO TITULAR'}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Validade</span>
                            <p className="text-xs font-mono font-bold">
                              {cardExpiry || 'MM/AA'}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">CVV</span>
                            <p className="text-xs font-mono font-bold">
                              {cardCvc || '•••'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Form */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">Nome Impresso no Cartão</label>
                          <input
                            type="text"
                            placeholder="JOÃO SILVA"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">Número do Cartão</label>
                          <input
                            type="text"
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">Validade</label>
                            <input
                              type="text"
                              placeholder="12/28"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left block">CVC</label>
                            <input
                              type="text"
                              placeholder="123"
                              maxLength={4}
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/gi, ''))}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all font-mono"
                            />
                          </div>
                        </div>

                        <button
                          disabled={checkoutLoading || !cardName || !cardNumber || !cardExpiry || !cardCvc}
                          onClick={() => handlePayCheckout('CARTÃO')}
                          className={`w-full py-4.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-4 ${
                            checkoutLoading || !cardName || !cardNumber || !cardExpiry || !cardCvc
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-gradient-to-r from-[#1B4D3E] to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-md shadow-emerald-100'
                          }`}
                        >
                          {checkoutLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            `💳 Pagar R$ ${(selectedPlan.price + (billingInfo?.whatsappConnected ? billingInfo.taxaWhatsapp : 0)).toFixed(2)}`
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL CROP LOGOTIPO (3:1 RATIO) */}
        {logoCropOpen && rawLogoSrc && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} /> Ajustar Logotipo
                </h2>
                <button 
                  onClick={() => { setLogoCropOpen(false); setRawLogoSrc(null); }} 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center space-y-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ajustar Enquadramento</h4>
                <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
                  Arraste o logotipo para ajustar a posição e use a barra para controlar o zoom.
                </p>
                
                {/* Viewport 3:1 Rectangular */}
                <div 
                  className="w-[300px] h-[100px] overflow-hidden relative border-2 border-[#1B4D3E] shadow-xl bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing rounded-xl"
                  onMouseDown={handleLogoPanStart}
                  onMouseMove={handleLogoPanMove}
                  onMouseUp={handleLogoPanEnd}
                  onMouseLeave={handleLogoPanEnd}
                  onTouchStart={handleLogoPanStart}
                  onTouchMove={handleLogoPanMove}
                  onTouchEnd={handleLogoPanEnd}
                >
                  <img 
                    src={rawLogoSrc} 
                    alt="Logo Crop Preview" 
                    draggable={false}
                    className="absolute pointer-events-none select-none max-w-none origin-center"
                    style={{
                      width: pendingLogoImage && pendingLogoImage.width / pendingLogoImage.height >= 3 ? 'auto' : '300px',
                      height: pendingLogoImage && pendingLogoImage.width / pendingLogoImage.height < 3 ? 'auto' : '100px',
                      transform: `translate(-50%, -50%) translate(${logoPanX}px, ${logoPanY}px) scale(${logoZoom})`,
                      left: '50%',
                      top: '50%',
                    }}
                  />
                </div>

                {/* Zoom Slider */}
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>Zoom</span>
                     <span className="text-[#1B4D3E]">{Math.round(logoZoom * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="0.01" 
                    value={logoZoom} 
                    onChange={(e) => setLogoZoom(parseFloat(e.target.value))} 
                    className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
                  />
                </div>

                {/* Buttons */}
                <div className="w-full max-w-xs flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setLogoCropOpen(false); setRawLogoSrc(null); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmLogoCrop}
                    className="flex-1 bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D3E]/20 transition-all cursor-pointer"
                  >
                    Salvar Logo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
