'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getLeads, 
  getLeadStages, 
  updateLeadStage, 
  createLead, 
  addComment, 
  getComments,
  updateLeadData,
  changeLeadOwner,
  getUsersForFilter,
  getPipelines,
  createPipeline,
  renamePipeline,
  deletePipeline,
  getActivities,
  createActivity,
  deleteActivity
} from '../actions';
import { getContratosComodato, createOrdemServicoAtivo, getOrdensServicoAtivo } from '@/app/ativos/actions';
import { getEntregas } from '@/app/entrega/actions';
import { 
  getChatList, 
  getInternalMessages, 
  sendInternalMessage, 
  markInternalMessagesAsRead 
} from '../chat-actions';
import { getLoggedUser, getPropostas } from '@/app/propostas/actions';
import { getSegmentos } from '@/app/admin/settings/actions';
import UserSelectPopover from '@/components/UserSelectPopover';
import { formatTimeBrasilia } from '@/lib/timezone';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Search, 
  MessageSquare, 
  ChevronRight, 
  PlusCircle, 
  Send, 
  User, 
  Building, 
  DollarSign, 
  Check, 
  X,
  ArrowLeft,
  Navigation,
  RefreshCw,
  Plus,
  LogOut,
  Target,
  ChevronDown,
  Wrench,
  Truck,
  Calendar,
  Trash2,
  Image as ImageIcon,
  Camera,
  FileText,
  Clock,
  Menu
} from 'lucide-react';

const tailwindColorMap: { [key: string]: string } = {
  sky: '#0284c7',
  blue: '#2563eb',
  orange: '#ea580c',
  amber: '#d97706',
  emerald: '#059669',
  green: '#16a34a',
  red: '#dc2626',
  rose: '#e11d48',
  purple: '#9333ea',
  violet: '#7c3aed',
  yellow: '#ca8a04',
  indigo: '#4f46e5',
  pink: '#db2777',
  teal: '#0d9488',
  slate: '#475569',
  gray: '#4b5563',
  'bg-slate-100': '#64748b',
  'bg-blue-100': '#3b82f6',
  'bg-green-100': '#10b981',
  'bg-emerald-100': '#10b981',
  'bg-amber-100': '#f59e0b',
  'bg-rose-100': '#f43f5e',
  'bg-purple-100': '#8b5cf6',
};

const resolveColorToHex = (color?: string): string => {
  if (!color) return '#64748b';
  const lower = color.toLowerCase().trim();
  if (lower.startsWith('#')) return lower;
  if (tailwindColorMap[lower]) return tailwindColorMap[lower];
  const stripped = lower.replace('bg-', '').split('-')[0];
  return tailwindColorMap[stripped] || '#64748b';
};

const normalizeHex = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return '#' + h;
};

const getContrastYIQ = (hex: string) => {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 140) ? 'black' : 'white';
};

const getHighlightedStageColorClass = (color?: string) => {
  if (!color) return { style: { backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#334155', borderColor: 'rgba(100, 116, 139, 0.25)', borderWidth: '1px', borderStyle: 'solid' } };
  const resolvedHex = resolveColorToHex(color);
  const contrast = getContrastYIQ(resolvedHex);
  const bg = resolvedHex;
  const text = contrast === 'white' ? '#ffffff' : '#000000';
  const border = contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  return {
    style: {
      backgroundColor: bg,
      color: text,
      borderColor: border,
      borderWidth: '1px',
      borderStyle: 'solid'
    }
  };
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function MobileCRM() {
  const router = useRouter();
  
  // App context states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'crm' | 'new-lead' | 'chat' | 'prospeccao' | 'agenda' | 'os'>('crm');
  const [currentModule, setCurrentModule] = useState<'crm' | 'tecnico'>('crm');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [valorVendido, setValorVendido] = useState<number>(0);
  const [loadingSales, setLoadingSales] = useState(false);

  // Welcome Screen states
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('orse_welcome_dismissed') !== 'true';
    }
    return true;
  });
  const [welcomeStats, setWelcomeStats] = useState<{
    vendasCount: number;
    contatosCount: number;
    reunioesCount: number;
    osProgramadas: number;
    osConcluidas: number;
    entregasProgramadas: number;
    entregasConcluidas: number;
    entregasValorAcumulado: number;
  } | null>(null);
  const [loadingWelcomeStats, setLoadingWelcomeStats] = useState<boolean>(false);

  // Agenda / Atividades States
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityForm, setActivityForm] = useState({
    titulo: '',
    descricao: '',
    tipo: 'REUNIAO',
    dataInicio: '',
    dataFim: ''
  });
  const [savingActivity, setSavingActivity] = useState(false);

  // OS (Ordem de Serviço) States
  const [contratos, setContratos] = useState<any[]>([]);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [osForm, setOsForm] = useState({
    tipo: 'MANUTENCAO', // INSTALACAO, RETIRADA, TROCA, MANUTENCAO
    contratoComodatoId: '',
    clientId: '',
    ativoId: '',
    ativoDestinoId: '',
    observacao: '',
    instrucoes: '',
    tecnicoResponsavel: '',
    tecnicoEmail: '',
    dataPrevista: ''
  });
  const [osFotos, setOsFotos] = useState<string[]>([]);
  const [savingOs, setSavingOs] = useState(false);

  // Prospecção States
  const [prospTermo, setProspTermo] = useState('');
  const [prospLocalizacao, setProspLocalizacao] = useState('');
  const [loadingProsp, setLoadingProsp] = useState(false);
  const [prospResults, setProspResults] = useState<any[]>([]);
  const [prospSelected, setProspSelected] = useState<Set<number>>(new Set());
  const [prospInjecting, setProspInjecting] = useState(false);

  // Leads CRM States
  const [stages, setStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [isPipelineDropdownOpen, setIsPipelineDropdownOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState({
    nomeFantasia: '',
    segmento: '',
    telefone: '',
    email: '',
    contatoNome: '',
    valorEst: '',
    endereco: '',
    cidade: '',
    uf: 'PR'
  });
  const [leadComments, setLeadComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [isOwnerPopoverOpen, setIsOwnerPopoverOpen] = useState(false);

  // Lead Creation States
  const [newLeadForm, setNewLeadForm] = useState({
    nomeFantasia: '',
    segmento: '',
    telefone: '',
    email: '',
    contatoNome: '',
    valorEst: '',
    endereco: '',
    cidade: '',
    uf: 'PR'
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  // Chat States
  const [chatList, setChatList] = useState<any[]>([]);
  const [totalUnreadChat, setTotalUnreadChat] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [loadingChatMessages, setLoadingChatMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch logged user on mount and read query parameters for activeTab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'chat') {
        router.replace('/chat');
        return;
      }
      if (tab === 'crm' || tab === 'prospeccao' || tab === 'os' || tab === 'agenda') {
        setActiveTab(tab as any);
      }
      const openCreate = params.get('openCreate');
      if (openCreate === 'true') {
        setIsCreateModalOpen(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === 'os') {
      setCurrentModule('tecnico');
    } else if (activeTab === 'crm' || activeTab === 'prospeccao' || activeTab === 'agenda') {
      setCurrentModule('crm');
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getLoggedUser();
        if (user) {
          setCurrentUser(user);
          const isTech = user.cargo?.toLowerCase().includes('tecnico') || user.cargo?.toLowerCase().includes('técnico');
          const isDeliv = user.cargo?.toLowerCase().includes('entregador') || 
                          user.cargo?.toLowerCase().includes('entrega') || 
                          user.cargo?.toLowerCase().includes('motoboy') || 
                          user.cargo?.toLowerCase().includes('motorista');
          const isGest = user.role === 'ADMIN' || user.role === 'MANAGER';
          
          const tabParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : '';
          const isChatTab = tabParam === 'chat' || activeTab === 'chat';
          
          if (!isChatTab) {
            if (isTech && !isGest) {
              router.push('/ativos/tecnico');
            } else if (isDeliv && !isGest) {
              router.push('/entrega/entregador');
            }
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router, activeTab]);

  const isTecnico = currentUser?.cargo?.toLowerCase().includes('tecnico') || currentUser?.cargo?.toLowerCase().includes('técnico');
  const isEntregador = currentUser?.cargo?.toLowerCase().includes('entregador') || 
                       currentUser?.cargo?.toLowerCase().includes('entrega') || 
                       currentUser?.cargo?.toLowerCase().includes('motoboy') || 
                       currentUser?.cargo?.toLowerCase().includes('motorista');
  const isGestor = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isSomenteTecnico = isTecnico && !isGestor;
  const isSomenteEntregador = isEntregador && !isGestor;

  const directTechnicians = systemUsers.filter((u: any) => {
    const cargoLower = u.cargo?.toLowerCase() || '';
    const roleLower = u.role?.toLowerCase() || '';
    return cargoLower.includes('tecnico') || cargoLower.includes('técnico') || roleLower === 'admin' || roleLower === 'manager';
  });

  // Load activities list
  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await getActivities();
      if (res.success && res.activities) {
        setActivities(res.activities);
      }
    } catch (e) {
      console.error("Erro ao carregar atividades:", e);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Load OS Data (Comodato Contracts, and system users for direct techs list)
  const loadOSData = async () => {
    setLoadingContratos(true);
    try {
      const res = await getContratosComodato();
      if (res.success && res.contratos) {
        setContratos(res.contratos);
        
        // Se houver contratos, preenche automaticamente os ids iniciais no form
        if (res.contratos.length > 0 && !osForm.contratoComodatoId) {
          const first = res.contratos[0];
          setOsForm(prev => ({
            ...prev,
            contratoComodatoId: first.id,
            clientId: first.clientId,
            ativoId: first.itens?.[0]?.ativoId || ''
          }));
        }
      }
      
      // Carrega usuários do sistema se ainda não estiverem carregados
      if (systemUsers.length === 0) {
        const usersRes = await getUsersForFilter();
        if (usersRes.success && usersRes.users) {
          setSystemUsers(usersRes.users);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados de OS:", e);
    } finally {
      setLoadingContratos(false);
    }
  };

  // Trigger loads based on tab
  useEffect(() => {
    if (activeTab === 'agenda') {
      loadActivities();
    } else if (activeTab === 'os') {
      loadOSData();
    } else if (activeTab === 'crm') {
      loadCRMData();
    }
  }, [activeTab]);

  // Load CRM Data (Leads, Stages, Segments)
  const loadCRMData = async (pipeId?: string) => {
    setLoadingLeads(true);
    try {
      let currentPipeId = pipeId || activePipelineId;

      let pipes = pipelines;
      if (pipes.length === 0) {
        const pipesRes = await getPipelines();
        if (pipesRes.success && pipesRes.pipelines) {
          pipes = pipesRes.pipelines;
          setPipelines(pipes);
          if (!currentPipeId) {
            const savedPipeId = localStorage.getItem('orse_active_pipeline_id');
            const hasSaved = pipes.some((p: any) => p.id === savedPipeId);
            currentPipeId = hasSaved ? (savedPipeId || '') : (pipes[0]?.id || '');
            setActivePipelineId(currentPipeId);
            if (currentPipeId) {
              localStorage.setItem('orse_active_pipeline_id', currentPipeId);
            }
          }
        }
      }

      const stagesRes = await getLeadStages(currentPipeId || undefined);
      const leadsRes = await getLeads({ pipelineId: currentPipeId || undefined });
      const segmentsRes = await getSegmentos();
      const usersRes = await getUsersForFilter();

      if (stagesRes.success && stagesRes.stages) {
        setStages(stagesRes.stages);
        if (stagesRes.stages.length > 0 && !selectedStageId) {
          setSelectedStageId(stagesRes.stages[0].id);
        }
      }

      if (leadsRes.success && leadsRes.leads) {
        setLeads(leadsRes.leads);
      }

      if (Array.isArray(segmentsRes)) {
        setSegmentos(segmentsRes);
      } else if (segmentsRes && segmentsRes.success) {
        setSegmentos(segmentsRes.segmentos);
      }

      if (usersRes.success && usersRes.users) {
        setSystemUsers(usersRes.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadSalesData = async (user: any) => {
    if (!user) return;
    setLoadingSales(true);
    try {
      const propostas = await getPropostas(user);
      if (Array.isArray(propostas)) {
        const wonProps = propostas.filter((p: any) => {
          const isOwner = p.userId === user.id;
          const statusUpper = p.status?.toUpperCase() || '';
          const isWon = statusUpper.includes('APROVAD') || 
                        statusUpper.includes('ACEIT') || 
                        statusUpper.includes('FECHAD') || 
                        statusUpper.includes('GANH') || 
                        statusUpper.includes('CONCLU');
          return isOwner && isWon;
        });
        const total = wonProps.reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
        setValorVendido(total);
      }
    } catch (err) {
      console.error("Erro ao calcular valor vendido:", err);
    } finally {
      setLoadingSales(false);
    }
  };

  const loadWelcomeStats = async (user: any) => {
    if (!user) return;
    setLoadingWelcomeStats(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const [propsRes, actRes, osRes, delivRes] = await Promise.all([
        getPropostas(user).catch(() => []),
        getActivities().catch(() => ({ success: false, activities: [] })),
        getOrdensServicoAtivo().catch(() => ({ success: false, ordens: [] })),
        getEntregas().catch(() => ({ success: false, entregas: [] })),
      ]);

      // Sales metrics (monthly won proposals)
      const propostas = Array.isArray(propsRes) ? propsRes : [];
      const wonProps = propostas.filter((p: any) => {
        const isOwner = p.userId === user.id;
        const statusUpper = p.status?.toUpperCase() || '';
        const isWon = statusUpper.includes('APROVAD') || 
                      statusUpper.includes('ACEIT') || 
                      statusUpper.includes('FECHAD') || 
                      statusUpper.includes('GANH') || 
                      statusUpper.includes('CONCLU');
        
        const pDate = new Date(p.updatedAt || p.createdAt);
        const isThisMonth = pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
        return isOwner && isWon && isThisMonth;
      });

      // Activities metrics (monthly for this user)
      const activitiesList = actRes.success && Array.isArray(actRes.activities) ? actRes.activities : [];
      const userActs = activitiesList.filter((a: any) => {
        const isUser = a.userId === user.id;
        const aDate = new Date(a.dataInicio);
        const isThisMonth = aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear;
        return isUser && isThisMonth;
      });

      const contatos = userActs.filter((a: any) => a.tipo === 'LIGACAO' || a.tipo === 'EMAIL');
      const reunioes = userActs.filter((a: any) => a.tipo === 'REUNIAO');

      // Technician OS metrics (monthly)
      const ordens = osRes.success && Array.isArray(osRes.ordens) ? osRes.ordens : [];
      const userOs = ordens.filter((os: any) => {
        const isUser = os.tecnicoEmail === user.email || os.tecnicoResponsavel === user.nome;
        const osDate = new Date(os.createdAt);
        const isThisMonth = osDate.getMonth() === currentMonth && osDate.getFullYear() === currentYear;
        return isUser && isThisMonth;
      });
      const osProgramadas = userOs.filter((os: any) => os.status !== 'CONCLUIDA' && os.status !== 'CANCELADA').length;
      const osConcluidas = userOs.filter((os: any) => os.status === 'CONCLUIDA').length;

      // Delivery metrics (monthly)
      const deliveries = delivRes.success && Array.isArray(delivRes.entregas) ? delivRes.entregas : [];
      const userDeliv = deliveries.filter((d: any) => {
        const isUser = d.entregadorEmail === user.email || d.entregadorResponsavel === user.nome;
        const dDate = new Date(d.dataProgramada || d.createdAt);
        const isThisMonth = dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
        return isUser && isThisMonth;
      });
      const entregasProgramadas = userDeliv.filter((d: any) => d.status !== 'ENTREGUE' && d.status !== 'CANCELADA').length;
      const entregasConcluidas = userDeliv.filter((d: any) => d.status === 'ENTREGUE').length;
      const entregasValorAcumulado = userDeliv
        .filter((d: any) => d.status === 'ENTREGUE')
        .reduce((sum: number, d: any) => sum + (d.valor || 0), 0);

      setWelcomeStats({
        vendasCount: wonProps.length,
        contatosCount: contatos.length,
        reunioesCount: reunioes.length,
        osProgramadas,
        osConcluidas,
        entregasProgramadas,
        entregasConcluidas,
        entregasValorAcumulado
      });
    } catch (error) {
      console.error("Error loading welcome stats:", error);
    } finally {
      setLoadingWelcomeStats(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadCRMData(activePipelineId);
      loadSalesData(currentUser);
      loadWelcomeStats(currentUser);
    }
  }, [currentUser, activePipelineId]);

  // Filter leads dynamically based on search query
  useEffect(() => {
    let result = leads;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(l => 
        l.nomeFantasia.toLowerCase().includes(query) ||
        (l.contatoNome && l.contatoNome.toLowerCase().includes(query)) ||
        (l.telefone && l.telefone.includes(query)) ||
        (l.endereco && l.endereco.toLowerCase().includes(query))
      );
    }
    setFilteredLeads(result);
  }, [leads, searchTerm]);

  // Load active chat list
  const loadChatListMobile = async () => {
    if (!currentUser) return;
    try {
      const res = await getChatList();
      if (res.success && res.chatList) {
        setChatList(res.chatList);
        setTotalUnreadChat(res.totalUnread || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadChatListMobile();
      const interval = setInterval(loadChatListMobile, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Load active chat messages
  const loadActiveChatMessages = async (otherId: string) => {
    try {
      const res = await getInternalMessages(otherId);
      if (res.success && res.messages) {
        setChatMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser && activeChatUser) {
      loadActiveChatMessages(activeChatUser.id);
      const interval = setInterval(() => {
        loadActiveChatMessages(activeChatUser.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeChatUser]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Mark chat as read
  useEffect(() => {
    if (activeChatUser && chatMessages.length > 0) {
      const hasUnread = chatMessages.some(m => m.senderId === activeChatUser.id && !m.read);
      if (hasUnread) {
        markInternalMessagesAsRead(activeChatUser.id).then(() => {
          loadChatListMobile();
        });
      }
    }
  }, [chatMessages, activeChatUser]);

  // Handle lead click to expand and load comments
  const handleLeadExpand = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditLeadForm({
        nomeFantasia: lead.nomeFantasia || '',
        segmento: lead.segmento || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        contatoNome: lead.contatoNome || '',
        valorEst: lead.valorEst !== undefined && lead.valorEst !== null ? String(lead.valorEst) : '',
        endereco: lead.endereco || '',
        cidade: lead.cidade || '',
        uf: lead.uf || 'PR'
      });
    }
    setIsEditingLead(false);
    setExpandedLeadId(leadId);
    setLeadComments([]);
    try {
      const res = await getComments(leadId);
      if (res.success && res.comments) {
        setLeadComments(res.comments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save edited lead details
  const handleSaveLeadEdit = async (leadId: string) => {
    try {
      const res = await updateLeadData(leadId, {
        nomeFantasia: editLeadForm.nomeFantasia,
        segmento: editLeadForm.segmento,
        telefone: editLeadForm.telefone,
        email: editLeadForm.email,
        contatoNome: editLeadForm.contatoNome,
        valorEst: editLeadForm.valorEst ? parseFloat(editLeadForm.valorEst) : 0,
        endereco: editLeadForm.endereco,
        cidade: editLeadForm.cidade,
        uf: editLeadForm.uf
      });

      if (res.success) {
        setIsEditingLead(false);
        // Refresh local leads list
        const leadsRes = await getLeads();
        if (leadsRes.success && leadsRes.leads) {
          setLeads(leadsRes.leads);
        }
        alert("Lead atualizado com sucesso!");
      } else {
        alert("Erro ao salvar alterações: " + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Add Comment/Note
  const handleAddComment = async (leadId: string) => {
    if (!newCommentText.trim() || savingComment) return;
    setSavingComment(true);
    try {
      const res = await addComment(leadId, newCommentText);
      if (res.success && res.comment) {
        setLeadComments(prev => [res.comment, ...prev]);
        setNewCommentText('');
        // Reload CRM to refresh update stamps
        const leadsRes = await getLeads();
        if (leadsRes.success && leadsRes.leads) {
          setLeads(leadsRes.leads);
        }
      } else {
        alert("Erro ao adicionar nota: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingComment(false);
    }
  };

  const handleCreateLeadActivity = async (leadId: string) => {
    if (!activityForm.titulo.trim() || !activityForm.dataInicio) {
      alert("Por favor, preencha o título e a data de início!");
      return;
    }
    setSavingActivity(true);
    try {
      const res = await createActivity({
        leadId,
        titulo: activityForm.titulo,
        descricao: activityForm.descricao,
        tipo: activityForm.tipo,
        dataInicio: activityForm.dataInicio,
        dataFim: activityForm.dataFim || activityForm.dataInicio,
        userId: currentUser?.id
      });
      if (res.success) {
        alert("Atividade agendada com sucesso!");
        setActivityForm({
          titulo: '',
          descricao: '',
          tipo: 'REUNIAO',
          dataInicio: '',
          dataFim: ''
        });
        loadActivities();
      } else {
        alert("Erro ao agendar atividade: " + res.error);
      }
    } catch (e: any) {
      alert("Erro ao agendar: " + e.message);
    } finally {
      setSavingActivity(false);
    }
  };

  // Switch lead stage quickly
  const handleStageChange = async (leadId: string, stageId: string) => {
    try {
      const res = await updateLeadStage(leadId, stageId);
      if (res.success) {
        // Update local state
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stageId } : l));
      } else {
        alert("Erro ao alterar fase: " + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Transfer lead ownership
  const handleOwnerChange = async (leadId: string, assignedToId: string) => {
    try {
      const res = await changeLeadOwner(leadId, assignedToId);
      if (res.success) {
        // Update local state
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedToId } : l));
        alert("Responsável alterado com sucesso!");
      } else {
        alert("Erro ao transferir lead: " + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Quick Lead Creation
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.nomeFantasia || submittingLead) return;
    setSubmittingLead(true);

    try {
      const res = await createLead({
        nomeFantasia: newLeadForm.nomeFantasia,
        segmento: newLeadForm.segmento,
        telefone: newLeadForm.telefone,
        email: newLeadForm.email,
        contatoNome: newLeadForm.contatoNome,
        valorEst: newLeadForm.valorEst ? parseFloat(newLeadForm.valorEst) : 0,
        endereco: newLeadForm.endereco,
        cidade: newLeadForm.cidade,
        uf: newLeadForm.uf,
        pipelineId: activePipelineId
      });

      if (res.success) {
        alert("Lead cadastrado com sucesso!");
        setNewLeadForm({
          nomeFantasia: '',
          segmento: '',
          telefone: '',
          email: '',
          contatoNome: '',
          valorEst: '',
          endereco: '',
          cidade: '',
          uf: 'PR'
        });
        // Reload CRM
        await loadCRMData();
        // Go back to CRM tab
        setActiveTab('crm');
        setIsCreateModalOpen(false);
      } else {
        alert("Erro ao cadastrar lead: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingLead(false);
    }
  };

  // Open specific Team Chat
  const handleSelectChatUserMobile = async (u: any) => {
    setActiveChatUser(u);
    setLoadingChatMessages(true);
    try {
      await markInternalMessagesAsRead(u.id);
      const res = await getInternalMessages(u.id);
      if (res.success && res.messages) {
        setChatMessages(res.messages);
      }
      loadChatListMobile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChatMessages(false);
    }
  };

  // Send message on mobile
  const handleSendChatMessageMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !newChatMessage.trim() || sendingChat) return;

    const content = newChatMessage;
    setNewChatMessage('');
    setSendingChat(true);

    // Optimistic insert
    const tempMsg = {
      id: 'temp-' + Date.now(),
      senderId: currentUser.id,
      receiverId: activeChatUser.id,
      content: content.trim(),
      read: false,
      createdAt: new Date()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendInternalMessage(activeChatUser.id, content);
      if (res.success && res.message) {
        setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
        loadChatListMobile();
      } else {
        alert("Erro ao enviar mensagem: " + res.error);
        setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSendingChat(false);
    }
  };

  // Prospecção Search
  const handleProspSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospTermo || !prospLocalizacao) return;
    
    setLoadingProsp(true);
    setProspResults([]);
    setProspSelected(new Set());
    
    try {
      const res = await fetch('/api/prospeccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo: prospTermo, localizacao: prospLocalizacao })
      });
      const data = await res.json();
      if (data.success) {
        setProspResults(data.results);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro na busca');
    }
    setLoadingProsp(false);
  };

  // Prospecção Inject
  const handleProspInject = async () => {
    if (prospSelected.size === 0) return;
    setProspInjecting(true);
    
    try {
      const selectedLeads = Array.from(prospSelected).map(i => prospResults[i]);
      
      let injectedCount = 0;
      for (const lead of selectedLeads) {
        const res = await createLead({
          nomeFantasia: lead.nomeFantasia,
          endereco: lead.endereco,
          telefone: lead.telefone,
          segmento: lead.segmento,
          site: lead.site,
          porte: lead.porte,
          avaliacoes: lead.avaliacoes,
          pipelineId: activePipelineId
        });
        if (res.success) injectedCount++;
      }
      
      alert(`${injectedCount} Leads injetados com sucesso no Pipeline!`);
      
      // Remove from list
      setProspResults(prev => prev.filter((_, i) => !prospSelected.has(i)));
      setProspSelected(new Set());
      
      // Reload leads
      const leadsRes = await getLeads();
      if (leadsRes.success && leadsRes.leads) {
        setLeads(leadsRes.leads);
      }
    } catch (error) {
      alert('Erro ao injetar leads');
    }
    setProspInjecting(false);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciando SmartBid Mobile...</p>
      </div>
    );
  }

  if (showWelcome) {
    const metaValue = currentUser?.meta || 100000;
    const percent = Math.min(100, Math.max(0, (valorVendido / metaValue) * 100));
    const needleRotation = -90 + (percent * 180 / 100);

    return (
      <div className="fixed inset-0 z-50 h-[100dvh] w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-[#1B4D3E] text-white flex flex-col font-sans select-none">
        <div className="flex-1 flex flex-col justify-between items-center p-3.5 max-w-md mx-auto w-full h-full max-h-[100dvh]">
          {/* Top Header */}
          <div className="flex flex-col items-center text-center pt-1.5 pb-2 w-full">
            <span className="text-[8px] font-extrabold text-emerald-300 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-xs mb-2">
              {currentUser?.tenant?.nome || 'Slimpe'}
            </span>
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.nome} 
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md mb-2"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/30 flex items-center justify-center font-black text-base shadow-md mb-2">
                {currentUser?.nome ? currentUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'V'}
              </div>
            )}
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">Olá, {currentUser?.nome?.split(' ')[0] || 'Vendedor'}!</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Seja muito bem-vindo de volta.</p>
          </div>

          {/* Middle Stats Dashboard */}
          <div className="flex-1 flex flex-col items-center justify-center py-1 w-full gap-2.5 overflow-hidden">
            
            {/* Speedometer Gauge (Velocímetro) */}
            <div className="relative flex flex-col items-center bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-lg w-full max-w-[230px] mx-auto">
              <span className="text-[7.5px] font-extrabold text-emerald-450 uppercase tracking-widest mb-1.5">Desempenho Comercial</span>
              <div className="relative w-full aspect-[100/68] max-w-[130px] flex items-center justify-center">
                <svg viewBox="0 0 100 68" className="w-full h-auto">
                  <defs>
                    <linearGradient id="welcomeGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#EF4444" />   {/* Vermelho */}
                      <stop offset="25%" stopColor="#F97316" />  {/* Laranja */}
                      <stop offset="50%" stopColor="#EAB308" />  {/* Amarelo */}
                      <stop offset="75%" stopColor="#84CC16" />  {/* Verde Claro */}
                      <stop offset="100%" stopColor="#10B981" /> {/* Verde */}
                    </linearGradient>
                    <clipPath id="welcomeGaugeClip">
                      <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke="#000" 
                        strokeWidth="8" 
                        strokeLinecap="butt"
                        strokeDasharray="125.66"
                        strokeDashoffset={125.66 - (125.66 * percent) / 100}
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                    </clipPath>
                  </defs>
                  {/* Background Arc - Gray segments */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeWidth="6" 
                    strokeLinecap="butt" 
                    strokeDasharray="11.216 1.5" 
                  />
                  {/* Progress Arc - Colored segments */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke="url(#welcomeGaugeGrad)" 
                    strokeWidth="6" 
                    strokeLinecap="butt" 
                    strokeDasharray="11.216 1.5"
                    clipPath="url(#welcomeGaugeClip)" 
                  />
                  {/* Needle */}
                  <g transform="translate(50, 50)">
                    <line 
                      x1="0" 
                      y1="0" 
                      x2="0" 
                      y2="-32" 
                      stroke="#FFFFFF" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      transform={`rotate(${needleRotation})`} 
                      style={{ transition: 'transform 1s ease-out' }} 
                    />
                  </g>
                  {/* Needle Pivot (Small dot in the center) */}
                  <circle cx="50" cy="50" r="2.5" fill="#FFFFFF" />
                  {/* Percentage Value inside the center */}
                  <text 
                    x="50" 
                    y="55" 
                    textAnchor="middle" 
                    fill="#FFFFFF" 
                    fontSize="11" 
                    fontWeight="900" 
                    className="font-sans"
                  >
                    {percent.toFixed(0)}%
                  </text>
                </svg>
              </div>
              {/* Real value and meta below */}
              <div className="text-center mt-1.5 w-full">
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider block leading-none mb-0.5">Vendido</span>
                <span className="text-sm font-black text-white leading-none block">R$ {valorVendido.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5 leading-none">da meta de R$ {metaValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* CRM Stats Grid */}
            {loadingWelcomeStats ? (
              <div className="flex items-center gap-1.5 py-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <RefreshCw className="animate-spin text-emerald-450" size={12} />
                <span>Carregando Indicadores...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs">
                <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center text-center">
                  <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg mb-0.5">
                    <DollarSign size={12} />
                  </div>
                  <span className="text-xs font-black text-white leading-none">{welcomeStats?.vendasCount || 0}</span>
                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5 block">Vendas</span>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center text-center">
                  <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg mb-0.5">
                    <Phone size={12} />
                  </div>
                  <span className="text-xs font-black text-white leading-none">{welcomeStats?.contatosCount || 0}</span>
                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5 block">Contatos</span>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center text-center">
                  <div className="p-1 bg-purple-500/10 text-purple-400 rounded-lg mb-0.5">
                    <Calendar size={12} />
                  </div>
                  <span className="text-xs font-black text-white leading-none">{welcomeStats?.reunioesCount || 0}</span>
                  <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5 block">Reuniões</span>
                </div>
              </div>
            )}

          </div>

          {/* Bottom CTA Button */}
          <div className="w-full max-w-xs mx-auto pb-1.5 pt-1.5 flex flex-col gap-2">
            <button
              onClick={() => {
                sessionStorage.setItem('orse_welcome_dismissed', 'true');
                setShowWelcome(false);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-widest border-none cursor-pointer active:scale-[0.98] transition-all shadow-lg hover:shadow-emerald-500/20"
            >
              Acessar CRM (Comercial)
            </button>

            {!isSomenteTecnico && !isSomenteEntregador && (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    sessionStorage.setItem('orse_welcome_dismissed', 'true');
                    setShowWelcome(false);
                    router.push('/ativos/tecnico');
                  }}
                  className="py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white rounded-lg font-bold text-[8.5px] uppercase tracking-wider active:scale-[0.98] transition-all"
                >
                  Painel Técnico
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('orse_welcome_dismissed', 'true');
                    setShowWelcome(false);
                    router.push('/entrega/entregador');
                  }}
                  className="py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 hover:text-white rounded-lg font-bold text-[8.5px] uppercase tracking-wider active:scale-[0.98] transition-all"
                >
                  Painel Entregas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>  </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans flex flex-col relative text-slate-800">
      
      {/* HEADER PREMIUM STICKY */}
      <header className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 text-white z-40 shadow-md p-4 shrink-0 select-none">
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
                {currentUser?.nome ? currentUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'V'}
              </div>
            )}
            <div className="min-w-0 text-left">
              <span className="text-[10px] font-extrabold text-emerald-450 uppercase tracking-widest block leading-none mb-1">
                {currentUser?.tenant?.nome || 'Slimpe'}
              </span>
              <span className="text-xs font-bold text-slate-350 block leading-none">Olá, {currentUser?.nome?.split(' ')[0] || 'Vendedor'}!</span>
              <span className="text-xs font-black uppercase text-white block leading-tight mt-0.5">Bem-vindo de volta</span>
            </div>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center text-white border-none"
            title="Menu Principal"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Pipeline Selector Line (Only when CRM active view) */}
        {currentModule === 'crm' && activeTab === 'crm' && (
          <div className="flex items-center justify-between gap-3 mt-3.5">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/leads')}
                className="p-1.5 bg-slate-800/40 border border-slate-800/60 text-slate-450 hover:text-white rounded-xl active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsPipelineDropdownOpen(!isPipelineDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-black tracking-tight uppercase text-white hover:text-emerald-450 bg-slate-800/40 border border-slate-800/60 px-3.5 py-2 rounded-xl cursor-pointer text-left"
                >
                  <span>{pipelines.find(p => p.id === activePipelineId)?.nome || 'SmartBid'}</span>
                  <ChevronDown size={12} className="text-slate-450" />
                </button>

                {isPipelineDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsPipelineDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-[240px] bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 z-50 text-slate-200">
                      <div className="px-2 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-1">
                        Seus Funis
                      </div>
                      <div className="max-h-[160px] overflow-y-auto space-y-0.5">
                        {pipelines.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActivePipelineId(p.id);
                              localStorage.setItem('orse_active_pipeline_id', p.id);
                              setIsPipelineDropdownOpen(false);
                              loadCRMData(p.id);
                            }}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                              p.id === activePipelineId
                                ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span className="truncate text-xs flex-1">{p.nome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Search Bar (Only shown on CRM tab in CRM mode) */}
        {currentModule === 'crm' && activeTab === 'crm' && (
          <div className="relative mt-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Pesquisar leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-white outline-none focus:bg-slate-800 focus:border-emerald-500 transition-all placeholder-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 bg-transparent border-none"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* HAMBURGER MENU DRAWER OVERLAY */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-[270px] bg-slate-900 text-white z-55 shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menu Principal</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border-none cursor-pointer flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentModule('crm');
                    setActiveTab('crm');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none text-left font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                    currentModule === 'crm' ? 'bg-[#1B4D3E] text-white shadow-md' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Building size={16} />
                  CRM
                </button>
                
                <button
                  onClick={() => {
                    router.push('/ativos/tecnico');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none text-left font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${
                    currentModule === 'tecnico' ? 'bg-[#1B4D3E] text-white shadow-md' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Wrench size={16} />
                  Área do Técnico
                </button>
                
                <button
                  onClick={() => {
                    router.push('/entrega/entregador');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none text-left font-bold text-xs uppercase tracking-wider cursor-pointer bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                >
                  <Truck size={16} />
                  Entregas
                </button>
                
                <button
                  onClick={() => {
                    router.push('/chat');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none text-left font-bold text-xs uppercase tracking-wider cursor-pointer bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                >
                  <MessageSquare size={16} />
                  Chat
                </button>
              </div>
            </div>
            
            <a
              href="/api/auth/logout"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-650 hover:bg-red-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider text-center no-underline border-none cursor-pointer shadow-md"
            >
              <LogOut size={16} />
              Sair da Conta
            </a>
          </div>
        </>
      )}

      {/* CORE VIEW */}
      <main className="flex-1 px-3 py-4 max-w-lg mx-auto w-full">
        
        {/* ================= TAB 1: CRM LEADS ================= */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            
            {/* Meta Progress Bar Card */}
            {currentUser && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 select-none">
                {(() => {
                  const metaValue = currentUser.meta > 0 ? currentUser.meta : 100000;
                  const percentage = metaValue > 0 ? Math.round((valorVendido / metaValue) * 100) : 0;
                  return (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5">
                          <Target size={15} className="text-[#1B4D3E]" />
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Meta Mensal de Vendas</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#1B4D3E] font-mono">
                          Meta: {formatCurrency(metaValue)}
                        </span>
                      </div>
                      
                      {/* Progress Bar Container */}
                      <div className="w-full bg-slate-100 rounded-full h-8 relative overflow-hidden border border-slate-200/50 shadow-inner flex items-center justify-center">
                        {/* Filled Bar */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                        
                        {/* Sold Value text centered on the bar */}
                        <span className="relative z-10 font-black text-xs text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] font-mono">
                          {formatCurrency(valorVendido)}
                        </span>
                      </div>
                      
                      {/* Percentage details below progress bar */}
                      <div className="flex justify-between items-center mt-1.5 text-[9px] font-bold text-slate-500">
                        <span className="text-emerald-700 font-black">
                          {percentage}% Atingido
                        </span>
                        {metaValue > valorVendido ? (
                          <span className="text-slate-450">Faltam: {formatCurrency(metaValue - valorVendido)}</span>
                        ) : (
                          <span className="text-emerald-600 font-black">Meta Superada! 🎉</span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Leads List */}
            {loadingLeads ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="animate-spin text-emerald-500 mb-3" size={24} />
                <p className="text-xs font-bold uppercase tracking-wider">Buscando Leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-100 mb-3">
                  <Building size={20} />
                </div>
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Nenhum lead encontrado</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-[200px] mx-auto">Cadastre um novo lead na aba de criação rápida para iniciar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const isExpanded = expandedLeadId === lead.id;
                  
                  return (
                    <div 
                      key={lead.id} 
                      className={`bg-white rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
                        isExpanded ? 'border-emerald-500/40 ring-1 ring-emerald-500/10' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Main Lead Summary Card */}
                      <div 
                        onClick={() => handleLeadExpand(lead.id)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                              <span className="text-slate-400 font-mono mr-1.5">#{lead.codigo || lead.id.substring(0, 5)}</span>
                              {lead.nomeFantasia}
                            </h3>
                            {lead.stage && (
                              <div className="mt-1 flex">
                                <span 
                                  className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-wider border border-solid"
                                  style={getHighlightedStageColorClass(lead.stage.color).style}
                                >
                                  {lead.stage.nome}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-black text-emerald-700 shrink-0 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            {formatCurrency(lead.valorEst)}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-1.5">
                          <span className="shrink-0">💼</span>
                          <span className="truncate">{lead.segmento && !/^c[a-z0-9]{24}$/.test(lead.segmento) ? lead.segmento : 'Sem segmento'}</span>
                        </div>
                        {lead.endereco && (
                          <div className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1.5 mt-1">
                            <MapPin size={10} className="shrink-0 text-slate-400" />
                            <span className="truncate">{lead.endereco}</span>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex justify-between items-center border-t border-slate-100 mt-3.5 pt-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {/* Call Button */}
                            {lead.telefone ? (
                              <a 
                                href={`tel:${lead.telefone}`}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-90"
                              >
                                <Phone size={14} />
                              </a>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-100 opacity-40 text-slate-400 flex items-center justify-center">
                                <Phone size={14} />
                              </div>
                            )}

                            {/* WhatsApp Button */}
                            {lead.telefone ? (
                              <a 
                                href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, tudo bem? Aqui é o ${currentUser.nome} do SmartBid CRM.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                              >
                                <MessageCircle size={14} className="fill-white" />
                              </a>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-emerald-500 opacity-40 text-white flex items-center justify-center">
                                <MessageCircle size={14} className="fill-white" />
                              </div>
                            )}

                            {/* GPS Navigation Route Button */}
                            {lead.endereco ? (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.endereco} ${lead.cidade || ''} ${lead.uf || ''}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                                title="Traçar rota de visita"
                              >
                                <Navigation size={13} className="fill-white" />
                              </a>
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-blue-500 opacity-40 text-white flex items-center justify-center">
                                <Navigation size={13} className="fill-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 select-none">
                            <span>Ver detalhes</span>
                            <ChevronRight size={10} className="text-slate-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: MÁQUINA DE PROSPECÇÃO ================= */}
        {activeTab === 'prospeccao' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-center select-none pb-1">
                <Target className="text-[#1B4D3E] mx-auto mb-1 animate-pulse" size={24} />
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Máquina de Prospecção</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Extraia empresas do Google e injete no seu Funil</p>
              </div>

              <form onSubmit={handleProspSearch} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">O que procura?</label>
                  <input 
                    required
                    value={prospTermo}
                    onChange={e => setProspTermo(e.target.value)}
                    placeholder="Ex: Clínicas Odontológicas, Condomínios..." 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Onde?</label>
                  <input 
                    required
                    value={prospLocalizacao}
                    onChange={e => setProspLocalizacao(e.target.value)}
                    placeholder="Ex: Centro de Curitiba, Batel..." 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loadingProsp || !prospTermo || !prospLocalizacao}
                  className="w-full bg-[#1B4D3E] hover:bg-[#13382d] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 border-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loadingProsp ? 'Buscando no Google...' : <><Search size={14} /> Procurar Empresas</>}
                </button>
              </form>
            </div>

            {/* Statistics and Inject Action */}
            {prospResults.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
                  <div className="text-xl font-black text-blue-650 leading-none">{prospResults.length}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Encontradas</div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
                  <div className="text-xl font-black text-emerald-650 leading-none">{prospSelected.size}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">Selecionadas</div>
                </div>
                <button 
                  disabled={prospSelected.size === 0 || prospInjecting}
                  onClick={handleProspInject}
                  className="bg-[#1B4D3E] hover:bg-[#13382d] text-white p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center border-none disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <Plus size={16} className="mb-0.5" /> 
                  <span className="text-[8px] font-black uppercase tracking-wider">{prospInjecting ? 'Injetando...' : 'Injetar'}</span>
                </button>
              </div>
            )}

            {/* Results List */}
            {prospResults.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100 divide-solid">
                {prospResults.map((item, idx) => {
                  const isSelected = prospSelected.has(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => {
                        const newSet = new Set(prospSelected);
                        if (newSet.has(idx)) {
                          newSet.delete(idx);
                        } else {
                          newSet.add(idx);
                        }
                        setProspSelected(newSet);
                      }}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{item.nomeFantasia}</h4>
                        <p className="text-[9px] text-slate-500 font-semibold leading-tight">{item.endereco}</p>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.telefone && (
                            <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                              📞 {item.telefone}
                            </span>
                          )}
                          {item.porte && (
                            <span className="text-[8px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded-md">
                              Porte {item.porte}
                            </span>
                          )}
                          {item.avaliacoes && (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/50">
                              ★ {item.avaliacoes} av.
                            </span>
                          )}
                          {item.segmento && (
                            <span className="text-[8px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/50">
                              {item.segmento}
                            </span>
                          )}
                        </div>

                        {item.site && (
                          <div className="pt-0.5">
                            <a 
                              href={item.site} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[9px] text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5" 
                              onClick={e => e.stopPropagation()}
                            >
                              🔗 {item.site.replace('https://', '').replace('http://', '').split('/')[0]}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: AGENDA GERAL ================= */}
        {activeTab === 'agenda' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-center select-none pb-1 border-b border-slate-100">
                <Calendar className="text-[#1B4D3E] mx-auto mb-1 animate-bounce" size={24} />
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Minha Agenda Geral</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Veja todas as suas atividades programadas</p>
              </div>

              {loadingActivities ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <RefreshCw className="animate-spin text-emerald-500 mb-3" size={24} />
                  <p className="text-xs font-bold uppercase tracking-wider">Buscando atividades...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-16 text-slate-400 select-none">
                  <p className="text-xs font-bold uppercase tracking-wider">Nenhuma atividade agendada!</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Programe uma atividade entrando nos detalhes de qualquer lead.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {activities.map((act) => {
                    const startStr = new Date(act.dataInicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                    const leadName = act.lead ? act.lead.nomeFantasia : 'Lead não informado';
                    
                    let badgeColor = 'bg-slate-55 text-slate-700 border-slate-200';
                    if (act.tipo === 'REUNIAO') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    else if (act.tipo === 'LIGACAO') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (act.tipo === 'EMAIL') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (act.tipo === 'TAREFA') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

                    return (
                      <div key={act.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border ${badgeColor}`}>
                            {act.tipo}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {startStr}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{act.titulo}</h4>
                          {act.descricao && (
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{act.descricao}</p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-bold flex items-center gap-1">
                            <Building size={10} className="text-slate-400" /> {leadName}
                          </span>
                          <button
                            onClick={async () => {
                              if (confirm("Deseja realmente remover esta atividade?")) {
                                const delRes = await deleteActivity(act.id);
                                if (delRes.success) {
                                  alert("Atividade excluída!");
                                  loadActivities();
                                } else {
                                  alert("Erro ao excluir: " + delRes.error);
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-650 font-black uppercase text-[8px] tracking-wider active:scale-95 bg-transparent border-none cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: NOVA ORDEM DE SERVIÇO ================= */}
        {activeTab === 'os' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-center select-none pb-1 border-b border-slate-100">
                <Wrench className="text-[#1B4D3E] mx-auto mb-1 animate-bounce" size={24} />
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Abertura de OS</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Abra ordens de serviço e anexe fotos</p>
              </div>

              {loadingContratos ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <RefreshCw className="animate-spin text-emerald-500 mb-3" size={24} />
                  <p className="text-xs font-bold uppercase tracking-wider">Carregando dados de comodato...</p>
                </div>
              ) : contratos.length === 0 ? (
                <div className="text-center py-16 text-slate-400 select-none">
                  <p className="text-xs font-bold uppercase tracking-wider">Nenhum contrato de comodato encontrado!</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Para abrir uma OS, o cliente precisa ter um contrato de comodato ativo.</p>
                </div>
              ) : (
                <div className="space-y-3.5 pr-1">
                  
                  {/* Contrato / Cliente Selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cliente / Contrato de Comodato *</label>
                    <select
                      value={osForm.contratoComodatoId}
                      onChange={e => {
                        const contratoId = e.target.value;
                        const target = contratos.find(c => c.id === contratoId);
                        if (target) {
                          setOsForm(prev => ({
                            ...prev,
                            contratoComodatoId: contratoId,
                            clientId: target.clientId,
                            ativoId: target.itens?.[0]?.ativoId || ''
                          }));
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      {contratos.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.client?.nomeFantasia || 'Cliente s/ nome'} (Comodato #{c.id.substring(0, 5)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ativo/Equipamento Selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Equipamento Associado *</label>
                    <select
                      value={osForm.ativoId}
                      onChange={e => setOsForm({ ...osForm, ativoId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      {(() => {
                        const targetContrato = contratos.find(c => c.id === osForm.contratoComodatoId);
                        if (!targetContrato || !targetContrato.itens || targetContrato.itens.length === 0) {
                          return <option value="">Sem equipamentos neste contrato</option>;
                        }
                        return targetContrato.itens.map((it: any) => (
                          <option key={it.ativo?.id} value={it.ativo?.id}>
                            {it.ativo?.descricao} ({it.ativo?.modelo || 'Sem modelo'}) - Nº {it.ativo?.numeroSerie || 'S/N'}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Tipo de OS & Data Prevista */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tipo de OS</label>
                      <select
                        value={osForm.tipo}
                        onChange={e => setOsForm({ ...osForm, tipo: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      >
                        <option value="MANUTENCAO">Manutenção</option>
                        <option value="INSTALACAO">Instalação</option>
                        <option value="RETIRADA">Retirada</option>
                        <option value="TROCA">Troca</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Programada</label>
                      <input
                        type="datetime-local"
                        value={osForm.dataPrevista}
                        onChange={e => setOsForm({ ...osForm, dataPrevista: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Técnico Designado */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Designar Técnico</label>
                    <select
                      value={osForm.tecnicoEmail}
                      onChange={e => {
                        const email = e.target.value;
                        const tech = directTechnicians.find(u => u.email === email);
                        setOsForm(prev => ({
                          ...prev,
                          tecnicoEmail: email,
                          tecnicoResponsavel: tech ? tech.nome : ''
                        }));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="">Selecione um técnico...</option>
                      {directTechnicians.map(t => (
                        <option key={t.id} value={t.email}>{t.nome} ({t.cargo || 'Técnico'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Instruções / Notas */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Observações / Instruções</label>
                    <textarea
                      placeholder="Instruções para o técnico..."
                      value={osForm.instrucoes}
                      onChange={e => setOsForm({ ...osForm, instrucoes: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-700 h-16 resize-none"
                    />
                  </div>

                  {/* Fotos Attachment Selector */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Camera size={12} /> Anexar Fotos do Local / Equipamento ({osFotos.length})
                    </label>
                    
                    <div className="flex flex-wrap gap-2">
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95">
                        <Plus size={16} className="text-slate-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Add Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setOsFotos(prev => [...prev, event.target!.result as string]);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                          className="hidden"
                        />
                      </label>

                      {osFotos.map((pic, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <img src={pic} alt="anexo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setOsFotos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-650 active:scale-90 border-none cursor-pointer flex items-center justify-center"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={async () => {
                      if (!osForm.contratoComodatoId || !osForm.ativoId) {
                        alert("Selecione o Contrato e o Equipamento!");
                        return;
                      }
                      setSavingOs(true);
                      try {
                        const payload = {
                          tipo: osForm.tipo,
                          contratoComodatoId: osForm.contratoComodatoId,
                          clientId: osForm.clientId,
                          ativoId: osForm.ativoId,
                          observacao: osForm.observacao,
                          instrucoes: osForm.instrucoes,
                          tecnicoResponsavel: osForm.tecnicoResponsavel,
                          tecnicoEmail: osForm.tecnicoEmail,
                          dataPrevista: osForm.dataPrevista ? new Date(osForm.dataPrevista).toISOString() : undefined,
                        };
                        
                        const res = await createOrdemServicoAtivo(payload);
                        if (res.success && res.os) {
                          // Se houver fotos, atualiza a OS com as fotos
                          if (osFotos.length > 0) {
                            const { updateOrdemServicoAtivo } = await import('@/app/ativos/actions');
                            await updateOrdemServicoAtivo(res.os.id, {
                              fotosAtendimento: JSON.stringify(osFotos)
                            });
                          }
                          alert("Ordem de Serviço criada com sucesso!");
                          setOsForm({
                            tipo: 'MANUTENCAO',
                            contratoComodatoId: '',
                            clientId: '',
                            ativoId: '',
                            ativoDestinoId: '',
                            observacao: '',
                            instrucoes: '',
                            tecnicoResponsavel: '',
                            tecnicoEmail: '',
                            dataPrevista: ''
                          });
                          setOsFotos([]);
                          setActiveTab('crm');
                        } else {
                          alert("Erro ao criar OS: " + res.error);
                        }
                      } catch (e: any) {
                        alert("Erro ao salvar: " + e.message);
                      } finally {
                        setSavingOs(false);
                      }
                    }}
                    disabled={savingOs || !osForm.contratoComodatoId || !osForm.ativoId}
                    className="w-full bg-[#1B4D3E] hover:bg-[#13382d] text-white border-none py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all active:scale-95 disabled:opacity-55 mt-4 cursor-pointer"
                  >
                    {savingOs ? 'Enviando OS...' : 'Abrir Ordem de Serviço'}
                  </button>

                </div>
              )}
            </div>
          </div>
        )}


      </main>

      {/* MOBILE TAB NAVIGATION BAR FIXED AT BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 py-2 select-none border-x-0 border-b-0 border-solid flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        
        {!isSomenteTecnico && !isSomenteEntregador ? (
          currentModule === 'crm' ? (
            <>
              {/* Tab Prospecção */}
              <button
                onClick={() => {
                  setActiveTab('prospeccao');
                  setActiveChatUser(null);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none ${
                  activeTab === 'prospeccao' ? 'text-[#1B4D3E] font-black' : 'text-slate-400 font-bold'
                }`}
              >
                <Target size={18} className={activeTab === 'prospeccao' ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                <span className="text-[8px] uppercase tracking-wider">Prospecção</span>
              </button>

              {/* Tab Agenda */}
              <button
                onClick={() => {
                  setActiveTab('agenda');
                  setActiveChatUser(null);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none ${
                  activeTab === 'agenda' ? 'text-[#1B4D3E] font-black' : 'text-slate-400 font-bold'
                }`}
              >
                <Calendar size={18} className={activeTab === 'agenda' ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                <span className="text-[8px] uppercase tracking-wider">Agenda</span>
              </button>

              {/* Tab Novo Lead */}
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                }}
                className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold cursor-pointer"
              >
                <PlusCircle size={18} className="text-slate-400" />
                <span className="text-[8px] uppercase tracking-wider">Novo Lead</span>
              </button>
            </>
          ) : (
            <>
              {/* Tab Nova Ordem de Serviços */}
              <button
                onClick={() => {
                  setActiveTab('os');
                  setActiveChatUser(null);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none ${
                  activeTab === 'os' ? 'text-[#1B4D3E] font-black' : 'text-slate-400 font-bold'
                }`}
              >
                <Wrench size={18} className={activeTab === 'os' ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                <span className="text-[8px] uppercase tracking-wider">Nova OS</span>
              </button>

              {/* Tab Nova Entrega */}
              <button
                onClick={() => {
                  router.push('/entrega/entregador');
                }}
                className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold cursor-pointer"
              >
                <Truck size={18} className="text-slate-400" />
                <span className="text-[8px] uppercase tracking-wider">Nova Entrega</span>
              </button>
            </>
          )
        ) : (
          <>
            {isSomenteTecnico && (
              /* Tab Técnico return link */
              <a
                href="/ativos/tecnico"
                className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
              >
                <Wrench size={18} className="text-slate-400" />
                <span className="text-[8px] uppercase tracking-wider">Técnico</span>
              </a>
            )}

            {isSomenteEntregador && (
              /* Tab Entregador return link */
              <a
                href="/entrega/entregador"
                className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
              >
                <Truck size={18} className="text-slate-400" />
                <span className="text-[8px] uppercase tracking-wider">Entrega</span>
              </a>
            )}
          </>
        )}
      </nav>

      {/* FULL-SCREEN LEAD DETAIL & EDIT OVERLAY */}
      {expandedLeadId && (() => {
        const lead = leads.find(l => l.id === expandedLeadId);
        if (!lead) return null;

        return (
          <div className="fixed inset-0 bg-slate-50 z-50 font-sans flex flex-col h-screen overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 text-white z-55 shadow-md p-4 shrink-0 flex items-center justify-between select-none">
              <div className="flex items-center gap-2 max-w-[70%]">
                <button 
                  onClick={() => {
                    setExpandedLeadId(null);
                    setIsEditingLead(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg active:scale-95 bg-transparent border-none cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0">
                  <h1 className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Detalhes do Lead</h1>
                  <h2 className="text-xs font-bold truncate text-white uppercase">{isEditingLead ? 'Editando Dados' : `#${lead.codigo || lead.id.substring(0, 5)} ${lead.nomeFantasia}`}</h2>
                </div>
              </div>

              <div className="flex gap-2">
                {isEditingLead ? (
                  <>
                    <button
                      onClick={() => setIsEditingLead(false)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-slate-700 bg-slate-800 text-slate-300 active:scale-95 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveLeadEdit(lead.id)}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 border-none cursor-pointer"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingLead(true)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white active:scale-95 border-none cursor-pointer"
                  >
                    Editar
                  </button>
                )}
              </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-5 max-w-lg mx-auto w-full">
              {/* Pipeline Phase selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fase do Pipeline</span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase">
                    {stages.find(s => s.id === lead.stageId)?.nome || 'Sem fase'}
                  </span>
                </div>
                <select
                  value={lead.stageId}
                  onChange={e => handleStageChange(lead.id, e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {stages.map(st => (
                    <option key={st.id} value={st.id}>{st.nome}</option>
                  ))}
                </select>
              </div>

              {/* Responsável (Transferência de Lead) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Responsável pelo Lead</span>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg uppercase">
                    {systemUsers.find(u => u.id === lead.assignedToId)?.nome || 'Sem responsável'}
                  </span>
                </div>
                <div 
                  id="mobile-lead-owner-anchor"
                  onClick={() => setIsOwnerPopoverOpen(true)}
                  className="flex items-center gap-2.5 p-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-all duration-150 group"
                >
                  {(() => {
                    const assignedUser = systemUsers.find(u => u.id === lead.assignedToId);
                    if (assignedUser?.avatarUrl) {
                      return (
                        <img 
                          src={assignedUser.avatarUrl} 
                          alt={assignedUser.nome} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm"
                        />
                      );
                    } else if (assignedUser) {
                      const initials = assignedUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/20 flex items-center justify-center text-xs font-black shrink-0 uppercase">
                          {initials}
                        </div>
                      );
                    }
                    return (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 shrink-0">
                        👤
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {systemUsers.find(u => u.id === lead.assignedToId)?.nome || 'Sem responsável'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">Clique para transferir/alterar</p>
                  </div>
                </div>

                <UserSelectPopover
                  isOpen={isOwnerPopoverOpen}
                  onClose={() => setIsOwnerPopoverOpen(false)}
                  users={systemUsers}
                  selectedIds={lead.assignedToId ? [lead.assignedToId] : []}
                  onSelect={(userId) => handleOwnerChange(lead.id, userId)}
                  title="Pesquisar colega..."
                  anchorEl={isOwnerPopoverOpen ? 'mobile-lead-owner-anchor' : null}
                  isMulti={false}
                />
              </div>

              {/* Quick Contact Actions */}
              {!isEditingLead && (
                <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  {/* Telefonar */}
                  {lead.telefone ? (
                    <a
                      href={`tel:${lead.telefone}`}
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all active:scale-95"
                    >
                      <Phone size={18} className="text-slate-600 mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Ligar</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 opacity-55">
                      <Phone size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Ligar</span>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {lead.telefone ? (
                    <a
                      href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, tudo bem? Aqui é o ${currentUser.nome} do SmartBid CRM.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/40 text-emerald-800 transition-all active:scale-95"
                    >
                      <MessageCircle size={18} className="text-emerald-600 mb-1 fill-emerald-600/10" />
                      <span className="text-[9px] font-black uppercase tracking-wider">WhatsApp</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-400 opacity-55">
                      <MessageCircle size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider">WhatsApp</span>
                    </div>
                  )}

                  {/* Maps GPS */}
                  {lead.endereco ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.endereco} ${lead.cidade || ''} ${lead.uf || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/40 text-blue-800 transition-all active:scale-95"
                    >
                      <Navigation size={18} className="text-blue-600 mb-1 fill-blue-600/10" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Rotas</span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-400 opacity-55">
                      <Navigation size={18} className="mb-1" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Rotas</span>
                    </div>
                  )}
                </div>
              )}

              {/* Form / Details Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Building size={16} className="text-slate-500" />
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Informações Cadastrais</h3>
                </div>

                {isEditingLead ? (
                  <div className="space-y-3.5">
                    {/* Nome Fantasia */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Lead / Empresa</label>
                      <input
                        type="text"
                        value={editLeadForm.nomeFantasia}
                        onChange={e => setEditLeadForm({ ...editLeadForm, nomeFantasia: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    {/* Segmento & Valor Est. */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Segmento</label>
                        <select
                          value={editLeadForm.segmento}
                          onChange={e => setEditLeadForm({ ...editLeadForm, segmento: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        >
                          <option value="">Selecione...</option>
                          {segmentos.map((s, idx) => (
                            <option key={s.id || idx} value={s.nome}>{s.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Valor Est. Contrato (R$)</label>
                        <input
                          type="number"
                          value={editLeadForm.valorEst}
                          onChange={e => setEditLeadForm({ ...editLeadForm, valorEst: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Contato Principal & Telefone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contato Principal</label>
                        <input
                          type="text"
                          value={editLeadForm.contatoNome}
                          onChange={e => setEditLeadForm({ ...editLeadForm, contatoNome: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Telefone / WhatsApp</label>
                        <input
                          type="tel"
                          value={editLeadForm.telefone}
                          onChange={e => setEditLeadForm({ ...editLeadForm, telefone: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail</label>
                      <input
                        type="email"
                        value={editLeadForm.email}
                        onChange={e => setEditLeadForm({ ...editLeadForm, email: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Endereço Completo</label>
                      <input
                        type="text"
                        value={editLeadForm.endereco}
                        onChange={e => setEditLeadForm({ ...editLeadForm, endereco: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>

                    {/* Cidade & UF */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cidade</label>
                        <input
                          type="text"
                          value={editLeadForm.cidade}
                          onChange={e => setEditLeadForm({ ...editLeadForm, cidade: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">UF</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={editLeadForm.uf}
                          onChange={e => setEditLeadForm({ ...editLeadForm, uf: e.target.value.toUpperCase() })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Segmento</p>
                      <p className="text-slate-800 font-bold mt-0.5">{lead.segmento && !/^c[a-z0-9]{24}$/.test(lead.segmento) ? lead.segmento : 'Sem segmento'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Valor Est. Contrato</p>
                      <p className="text-emerald-700 font-extrabold mt-0.5">{formatCurrency(lead.valorEst)}</p>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Contato Principal</p>
                      <p className="text-slate-800 font-bold mt-0.5">{lead.contatoNome || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Telefone / WhatsApp</p>
                      <p className="text-slate-800 font-bold mt-0.5 flex items-center gap-1">
                        {lead.telefone ? (
                          <>
                            <span>{lead.telefone}</span>
                            <a href={`tel:${lead.telefone}`} className="text-blue-600 hover:text-blue-700 active:scale-90">📞</a>
                          </>
                        ) : 'Não informado'}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">E-mail</p>
                      <p className="text-slate-800 font-bold mt-0.5 flex items-center gap-1">
                        {lead.email ? (
                          <>
                            <span className="truncate">{lead.email}</span>
                            <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-700 active:scale-90">✉️</a>
                          </>
                        ) : 'Não informado'}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Cidade / UF</p>
                      <p className="text-slate-800 font-bold mt-0.5">
                        {lead.cidade ? `${lead.cidade} - ${lead.uf || 'PR'}` : 'Não informado'}
                      </p>
                    </div>

                    {lead.endereco && (
                      <div className="col-span-2 border-t border-slate-100 pt-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Endereço Completo</p>
                        <p className="text-slate-700 font-semibold mt-0.5 flex items-start gap-1">
                          <MapPin size={11} className="text-slate-400 mt-0.5 shrink-0" />
                          <span>{lead.endereco}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Relatórios de Visita / Anotações */}
              {!isEditingLead && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <MessageSquare size={16} className="text-slate-500" />
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Relatórios de Visita ({leadComments.length})
                    </h3>
                  </div>

                  {/* Input Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Registrar nova anotação de visita..."
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                    <button
                      onClick={() => handleAddComment(lead.id)}
                      disabled={savingComment || !newCommentText.trim()}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 border-none cursor-pointer"
                    >
                      <Send size={14} className="fill-white" />
                    </button>
                  </div>

                  {/* Comments list feed */}
                  <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar pt-1">
                    {leadComments.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">
                        Nenhum relatório de visita registrado.
                      </p>
                    ) : (
                      leadComments.map((comm) => (
                        <div key={comm.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] space-y-1.5 shadow-2xs">
                          <div className="flex justify-between items-center font-bold text-slate-400">
                            <span className="text-slate-600 uppercase tracking-wide">
                              {comm.user?.nome || 'Vendedor'}
                            </span>
                            <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 font-medium text-xs whitespace-pre-wrap">{comm.texto}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Programador de Atividades */}
              {!isEditingLead && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Calendar size={16} className="text-[#1B4D3E]" />
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Programar Atividade</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Título da Atividade *</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Reunião de alinhamento"
                        value={activityForm.titulo}
                        onChange={e => setActivityForm({ ...activityForm, titulo: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Descrição / Notas</label>
                      <textarea 
                        placeholder="Detalhes sobre a atividade..."
                        value={activityForm.descricao}
                        onChange={e => setActivityForm({ ...activityForm, descricao: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700 h-16 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tipo</label>
                        <select 
                          value={activityForm.tipo}
                          onChange={e => setActivityForm({ ...activityForm, tipo: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="REUNIAO">Reunião</option>
                          <option value="LIGACAO">Ligação</option>
                          <option value="EMAIL">E-mail</option>
                          <option value="TAREFA">Tarefa</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Início *</label>
                        <input 
                          type="datetime-local"
                          value={activityForm.dataInicio}
                          onChange={e => setActivityForm({ ...activityForm, dataInicio: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Data Fim (Opcional)</label>
                        <input 
                          type="datetime-local"
                          value={activityForm.dataFim}
                          onChange={e => setActivityForm({ ...activityForm, dataFim: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleCreateLeadActivity(lead.id)}
                          disabled={savingActivity}
                          className="w-full bg-[#1B4D3E] hover:bg-[#1B4D3E]/95 text-white border-none py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-55"
                        >
                          {savingActivity ? 'Salvando...' : 'Agendar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* FULL-SCREEN NEW LEAD CREATION OVERLAY */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-50 z-50 font-sans flex flex-col h-screen overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <header className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 text-white z-55 shadow-md p-4 shrink-0 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg active:scale-95 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Novo Cadastro</h1>
                <h2 className="text-xs font-bold text-white uppercase">Novo Lead Rápido</h2>
              </div>
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg active:scale-95 bg-transparent border-none cursor-pointer"
            >
              <X size={20} />
            </button>
          </header>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-24 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4">
              <div className="text-center pb-2 border-b border-slate-100 select-none">
                <PlusCircle className="text-emerald-500 mx-auto mb-1" size={24} />
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Novo Cadastro Rápido</h3>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Preencha os dados do cliente captado em campo</p>
              </div>

              <form onSubmit={handleCreateLeadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nome do Lead / Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Condomínio Residencial Plaza"
                    value={newLeadForm.nomeFantasia}
                    onChange={e => setNewLeadForm({ ...newLeadForm, nomeFantasia: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Segmento</label>
                    <select
                      value={newLeadForm.segmento}
                      onChange={e => setNewLeadForm({ ...newLeadForm, segmento: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="">Selecione...</option>
                      {segmentos.map((s, idx) => (
                        <option key={s.id || idx} value={s.nome}>{s.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Valor Est. Contrato</label>
                    <input
                      type="number"
                      placeholder="Ex: 15000"
                      value={newLeadForm.valorEst}
                      onChange={e => setNewLeadForm({ ...newLeadForm, valorEst: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contato Principal</label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos (Síndico)"
                      value={newLeadForm.contatoNome}
                      onChange={e => setNewLeadForm({ ...newLeadForm, contatoNome: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      placeholder="Ex: (41) 99999-9999"
                      value={newLeadForm.telefone}
                      onChange={e => setNewLeadForm({ ...newLeadForm, telefone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">E-mail</label>
                  <input
                    type="email"
                    placeholder="Ex: contato@cliente.com"
                    value={newLeadForm.email}
                    onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Endereço Completo</label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro"
                    value={newLeadForm.endereco}
                    onChange={e => setNewLeadForm({ ...newLeadForm, endereco: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Cidade</label>
                    <input
                      type="text"
                      placeholder="Curitiba"
                      value={newLeadForm.cidade}
                      onChange={e => setNewLeadForm({ ...newLeadForm, cidade: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">UF</label>
                    <input
                      type="text"
                      placeholder="PR"
                      maxLength={2}
                      value={newLeadForm.uf}
                      onChange={e => setNewLeadForm({ ...newLeadForm, uf: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingLead || !newLeadForm.nomeFantasia}
                  className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 border-none cursor-pointer"
                >
                  {submittingLead ? "Cadastrando..." : "Cadastrar Lead"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
