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
  getUsersForFilter
} from '../actions';
import { 
  getChatList, 
  getInternalMessages, 
  sendInternalMessage, 
  markInternalMessagesAsRead 
} from '../chat-actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { getSegmentos } from '@/app/admin/settings/actions';
import UserSelectPopover from '@/components/UserSelectPopover';
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
  LogOut
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
  const [activeTab, setActiveTab] = useState<'crm' | 'new-lead' | 'chat'>('crm');

  // Leads CRM States
  const [stages, setStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Fetch logged user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getLoggedUser();
        if (user) {
          setCurrentUser(user);
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
  }, [router]);

  // Load CRM Data (Leads, Stages, Segments)
  const loadCRMData = async () => {
    setLoadingLeads(true);
    try {
      const stagesRes = await getLeadStages();
      const leadsRes = await getLeads();
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

  useEffect(() => {
    if (currentUser) {
      loadCRMData();
    }
  }, [currentUser]);

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
        uf: newLeadForm.uf
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

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciando SmartBid CRM Mobile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans flex flex-col relative text-slate-800">
      
      {/* HEADER PREMIUM STICKY */}
      <header className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 text-white z-40 shadow-md p-4 shrink-0 select-none">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/leads')}
              className="p-1 text-slate-400 hover:text-white rounded-lg active:scale-95 bg-transparent border-none"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase">SmartBid CRM</h1>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{currentUser?.tenant?.nomeFantasia || 'Silva Consultoria'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl active:scale-95 border-none cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
              title="Novo Lead"
            >
              <Plus size={16} />
            </button>
            
            <div className="flex items-center gap-1.5 bg-slate-800/40 pl-2 pr-1.5 py-1 rounded-xl border border-slate-800/60 max-w-[100px] sm:max-w-none">
              <span className="text-[10px] font-black text-slate-300 truncate max-w-[50px] sm:max-w-none">{currentUser?.nome.split(' ')[0]}</span>
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.nome} 
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-[9px] font-black uppercase font-mono">
                  {currentUser?.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (confirm("Deseja realmente sair do SmartBid CRM?")) {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl active:scale-95 border border-rose-500/20 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Search Bar (Only shown on CRM tab) */}
        {activeTab === 'crm' && (
          <div className="relative mt-2">
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

      {/* CORE VIEW */}
      <main className="flex-1 px-3 py-4 max-w-lg mx-auto w-full">
        
        {/* ================= TAB 1: CRM LEADS ================= */}
        {activeTab === 'crm' && (
          <div className="space-y-4">
            


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
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{lead.nomeFantasia}</h3>
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
                          <span className="truncate">{lead.segmento || 'Sem segmento'}</span>
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



        {/* ================= TAB 3: TEAM CHAT MOBILE ================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden h-[65vh]">
            
            {/* If a Chat conversation partner is active */}
            {activeChatUser ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                {/* Chat Header */}
                <div className="p-3 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex justify-between items-center shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveChatUser(null)}
                      className="p-1 text-slate-300 hover:text-white rounded-lg active:scale-95 bg-transparent border-none"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    
                    {activeChatUser.avatarUrl ? (
                      <img
                        src={activeChatUser.avatarUrl}
                        alt={activeChatUser.nome}
                        className="w-8 h-8 rounded-full border border-slate-600 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-black uppercase">
                        {activeChatUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{activeChatUser.nome}</h4>
                      <p className="text-[8px] text-emerald-400 font-bold mt-0.5 uppercase tracking-wider">online</p>
                    </div>
                  </div>
                </div>

                {/* Messages Feed */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]"
                  style={{
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundBlendMode: 'overlay',
                  }}
                >
                  {loadingChatMessages ? (
                    <div className="flex h-full items-center justify-center bg-white/20">
                      <RefreshCw className="animate-spin text-blue-600" size={24} />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-xs border border-slate-200/60 mb-2">
                        <MessageSquare size={16} />
                      </div>
                      <p className="text-[10px] font-black text-slate-600 uppercase">Nenhuma mensagem</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => {
                      const isMe = msg.senderId === currentUser.id;
                      const showDoubleCheck = msg.read;
                      
                      return (
                        <div
                          key={msg.id || index}
                          className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs shadow-xs relative ${
                              isMe
                                ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                                : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/40'
                            }`}
                          >
                            <p className="break-words font-medium pr-10 whitespace-pre-wrap">{msg.content}</p>
                            
                            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[8px] font-bold text-slate-400 select-none">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <span className={`font-black ${showDoubleCheck ? 'text-blue-500' : 'text-slate-400'}`}>
                                  {showDoubleCheck ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form 
                  onSubmit={handleSendChatMessageMobile}
                  className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 shrink-0 select-none border-x-0 border-b-0 border-solid"
                >
                  <input
                    type="text"
                    placeholder="Digite uma mensagem..."
                    value={newChatMessage}
                    onChange={e => setNewChatMessage(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold text-slate-700"
                    disabled={sendingChat}
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !newChatMessage.trim()}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer shadow-sm active:scale-95 shrink-0 border-none"
                  >
                    <Send size={14} className="fill-white" />
                  </button>
                </form>
              </div>
            ) : (
              // Chat List (list of team members)
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input 
                      type="text"
                      placeholder="Pesquisar contatos..."
                      value={chatSearchTerm}
                      onChange={e => setChatSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-slate-700 placeholder-slate-400"
                    />
                    {chatSearchTerm && (
                      <button 
                        onClick={() => setChatSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 bg-transparent border-none"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white no-scrollbar divide-solid">
                  {chatList
                    .filter(u => u.nome.toLowerCase().includes(chatSearchTerm.toLowerCase()))
                    .map((u) => {
                      const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleSelectChatUserMobile(u)}
                          className="p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 border-b border-slate-100 border-solid"
                        >
                          <div className="relative shrink-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.nome}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl flex items-center justify-center text-[10px] font-black uppercase">
                                {initials}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-xs" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate">{u.nome}</h4>
                              {u.lastMessage && (
                                <span className="text-[8px] text-slate-400 font-semibold ml-1">
                                  {new Date(u.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>

                            <div className="text-[9px] text-slate-400 font-bold uppercase truncate">{u.cargo || 'Membro da Equipe'}</div>

                            {u.lastMessage && (
                              <p className={`text-xs truncate mt-1 ${u.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                {u.lastMessage.senderId === currentUser.id ? 'Você: ' : ''}
                                {u.lastMessage.content}
                              </p>
                            )}
                          </div>

                          {u.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                              {u.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MOBILE TAB NAVIGATION BAR FIXED AT BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 py-2 select-none border-x-0 border-b-0 border-solid flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        
        {/* Tab CRM */}
        <button
          onClick={() => {
            setActiveTab('crm');
            setActiveChatUser(null);
            loadCRMData();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent border-none ${
            activeTab === 'crm' ? 'text-[#1B4D3E] font-black' : 'text-slate-400 font-bold'
          }`}
        >
          <Building size={18} className={activeTab === 'crm' ? 'text-[#1B4D3E]' : 'text-slate-400'} />
          <span className="text-[8px] uppercase tracking-wider">Funil CRM</span>
        </button>

        {/* Tab Novo Lead */}
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold"
        >
          <PlusCircle size={18} className="text-slate-400" />
          <span className="text-[8px] uppercase tracking-wider">Novo Lead</span>
        </button>

        {/* Tab Chat Interno */}
        <button
          onClick={() => {
            setActiveTab('chat');
            setActiveChatUser(null);
            loadChatListMobile();
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent border-none relative ${
            activeTab === 'chat' ? 'text-blue-600 font-black' : 'text-slate-400 font-bold'
          }`}
        >
          <MessageSquare size={18} className={activeTab === 'chat' ? 'text-blue-600' : 'text-slate-400'} />
          <span className="text-[8px] uppercase tracking-wider">Chat Time</span>
          {totalUnreadChat > 0 && (
            <span className="absolute top-1 right-3 bg-blue-500 text-white text-[7px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse">
              {totalUnreadChat}
            </span>
          )}
        </button>
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
                  <h2 className="text-xs font-bold truncate text-white uppercase">{isEditingLead ? 'Editando Dados' : lead.nomeFantasia}</h2>
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
                      <p className="text-slate-800 font-bold mt-0.5">{lead.segmento || 'Sem segmento'}</p>
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
