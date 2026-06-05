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
  updateLeadData
} from '../actions';
import { 
  getChatList, 
  getInternalMessages, 
  sendInternalMessage, 
  markInternalMessagesAsRead 
} from '../chat-actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { getSegmentos } from '@/app/admin/settings/actions';
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
  Plus
} from 'lucide-react';

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
  const [leadComments, setLeadComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [segmentos, setSegmentos] = useState<any[]>([]);

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

  // Filter leads dynamically based on selected stage and search query
  useEffect(() => {
    let result = leads;
    if (selectedStageId) {
      result = result.filter(l => l.stageId === selectedStageId);
    }
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
  }, [leads, selectedStageId, searchTerm]);

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
    if (expandedLeadId === leadId) {
      setExpandedLeadId(null);
      return;
    }
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
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciando Orse CRM Mobile...</p>
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
              <h1 className="text-sm font-black tracking-tight uppercase">Orse CRM</h1>
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{currentUser?.tenant?.nomeFantasia || 'Silva Consultoria'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-300 mr-1">{currentUser?.nome}</span>
            {currentUser?.avatarUrl ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.nome} 
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-black uppercase">
                {currentUser?.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
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
            
            {/* Horizontal Stages Selector list */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
              {stages.map((stage) => {
                const isSelected = selectedStageId === stage.id;
                const stageLeadsCount = leads.filter(l => l.stageId === stage.id).length;
                
                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setSelectedStageId(stage.id);
                      setExpandedLeadId(null);
                    }}
                    className={`snap-center flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border border-solid active:scale-95 ${
                      isSelected
                        ? 'bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    <span>{stage.nome}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {stageLeadsCount}
                    </span>
                  </button>
                );
              })}
            </div>

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
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Nenhum lead nesta fase</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-[200px] mx-auto">Tente alterar os filtros ou cadastrar um novo lead na aba de criação.</p>
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
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{lead.nomeFantasia}</h3>
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
                                href={`https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, tudo bem? Aqui é o ${currentUser.nome} da Silva Consultoria.`)}`}
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
                            <span>Ver histórico</span>
                            <ChevronRight size={10} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-slate-600' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section (Notes, Details, phase switcher) */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4 animate-in slide-in-from-top duration-200">
                          
                          {/* Phase switcher */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Mudar Fase do Lead</label>
                            <select
                              value={lead.stageId}
                              onChange={e => handleStageChange(lead.id, e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                            >
                              {stages.map(st => (
                                <option key={st.id} value={st.id}>{st.nome}</option>
                              ))}
                            </select>
                          </div>

                          {/* Extra info details block */}
                          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Contato</p>
                              <p className="text-[10px] font-semibold text-slate-700 truncate">{lead.contatoNome || 'Não registrado'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">E-mail</p>
                              <p className="text-[10px] font-semibold text-slate-700 truncate">{lead.email || 'Não registrado'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Cidade / UF</p>
                              <p className="text-[10px] font-semibold text-slate-700 truncate">
                                {lead.cidade ? `${lead.cidade} - ${lead.uf || 'PR'}` : 'Não registrado'}
                              </p>
                            </div>
                          </div>

                          {/* Comments/Notes section */}
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Anotações de Visita ({leadComments.length})</label>
                            
                            {/* Input Form */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Registrar anotação de visita..."
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                onClick={() => handleAddComment(lead.id)}
                                disabled={savingComment || !newCommentText.trim()}
                                className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 border-none cursor-pointer"
                              >
                                <Send size={12} className="fill-white" />
                              </button>
                            </div>

                            {/* Comments list feed */}
                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pt-1">
                              {leadComments.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic text-center py-2">Nenhuma anotação neste lead.</p>
                              ) : (
                                leadComments.map((comm) => (
                                  <div key={comm.id} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-0.5 shadow-xs">
                                    <div className="flex justify-between font-bold text-slate-400">
                                      <span>{comm.user?.nome || 'Vendedor'}</span>
                                      <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-700 font-medium whitespace-pre-wrap">{comm.texto}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: QUICK NEW LEAD ================= */}
        {activeTab === 'new-lead' && (
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
            setActiveTab('new-lead');
            setActiveChatUser(null);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent border-none ${
            activeTab === 'new-lead' ? 'text-[#1B4D3E] font-black' : 'text-slate-400 font-bold'
          }`}
        >
          <PlusCircle size={18} className={activeTab === 'new-lead' ? 'text-[#1B4D3E]' : 'text-slate-400'} />
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
    </div>
  );
}
