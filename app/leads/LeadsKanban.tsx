'use client';

import React, { useState, useEffect } from 'react';
import { getLeads, getLeadStages, updateLeadStage, createLead, convertLeadToClient, addLeadHistory, updateLeadStageColor, createLeadStage, deleteLeadStage, getUsersForFilter, updateLeadStageName, deleteLead, updateLeadData, changeLeadOwner, addLeadShare, removeLeadShare, addLeadContact, removeLeadContact } from './actions';
import { Plus, User, Users, Phone, Mail, Building, Clock, ChevronRight, CheckCircle2, X, Trash2, MapPin, Navigation, CalendarDays, Edit2, Save, Search, MessageSquare, MessageCircle, UserCog, Target } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSegmentos } from '@/app/admin/settings/actions';
import LeadDetailsTabs from './components/LeadDetailsTabs';
import PipelineMetrics from './components/PipelineMetrics';
import WhatsAppChat from './components/WhatsAppChat';

const safeDate = (val: any) => {
  if (!val) return 'Data Inválida';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Data Inválida' : d.toLocaleDateString();
};

const getInitials = (name: any) => {
  if (!name || typeof name !== 'string') return 'LD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LD';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const playWhatsAppChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(1046.50, now + 0.09, 0.20);
  } catch (e) {
    console.warn("Web Audio chime blocked", e);
  }
};

export default function LeadsKanban() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stages, setStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMetrics, setShowMetrics] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Chat Center States
  const [showChatCenter, setShowChatCenter] = useState(false);
  const [selectedChatLeadId, setSelectedChatLeadId] = useState<string | null>(null);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineForm, setInlineForm] = useState({
    nomeFantasia: '',
    contatoNome: '',
    email: '',
    assignedToId: '',
    segmento: ''
  });
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    whatsapp: '',
    endereco: '',
    contato: ''
  });
  
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    nomeFantasia: '',
    segmento: '',
    telefone: '',
    email: '',
    contatoNome: ''
  });

  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [filterUsers, setFilterUsers] = useState<any[]>([]);

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const knownUnreadMessageIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstLoadRef = React.useRef(true);
  const selectedLeadRef = React.useRef<any>(null);

  useEffect(() => {
    selectedLeadRef.current = selectedLead;
  }, [selectedLead]);

  // Auto-open lead modal by parameter
  useEffect(() => {
    const leadIdParam = searchParams.get('leadId');
    if (leadIdParam && leads.length > 0) {
      const targetLead = leads.find(l => l.id === leadIdParam);
      if (targetLead && (!selectedLead || selectedLead.id !== leadIdParam)) {
        setSelectedLead(targetLead);
        // Clean URL query parameter so closing the modal works properly
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams, leads, selectedLead]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stages.length > 0) {
      fetchFilteredLeads();
    }
  }, [datePreset, startDate, endDate, userFilter]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const [stagesRes, segmentosRes, usersRes] = await Promise.all([
      getLeadStages(),
      getSegmentos(),
      getUsersForFilter()
    ]);
    if (stagesRes.success) setStages(stagesRes.stages);
    if (Array.isArray(segmentosRes)) setSegmentos(segmentosRes);
    else if (segmentosRes && segmentosRes.success) setSegmentos(segmentosRes.segmentos);
    if (usersRes.success) setFilterUsers(usersRes.users);
    
    await fetchFilteredLeads(silent);
  };

  const fetchFilteredLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    let sDate = startDate;
    let eDate = endDate;

    if (datePreset !== 'custom' && datePreset !== 'all') {
      const today = new Date();
      if (datePreset === '7d') {
        const d = new Date(); d.setDate(today.getDate() - 7); sDate = d.toISOString();
      } else if (datePreset === '14d') {
        const d = new Date(); d.setDate(today.getDate() - 14); sDate = d.toISOString();
      } else if (datePreset === '28d') {
        const d = new Date(); d.setDate(today.getDate() - 28); sDate = d.toISOString();
      } else if (datePreset === 'this_month') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1); sDate = d.toISOString();
      } else if (datePreset === 'last_month') {
        const dStart = new Date(today.getFullYear(), today.getMonth() - 1, 1); sDate = dStart.toISOString();
        const dEnd = new Date(today.getFullYear(), today.getMonth(), 0); eDate = dEnd.toISOString();
      } else if (datePreset === 'this_year') {
        const d = new Date(today.getFullYear(), 0, 1); sDate = d.toISOString();
      }
      if (datePreset !== 'last_month' && datePreset !== 'custom') {
        eDate = today.toISOString();
      }
    } else if (datePreset === 'all') {
      sDate = '';
      eDate = '';
    }

    const res = await getLeads({ startDate: sDate, endDate: eDate, userId: userFilter });
    if (res.success) {
      setLeads(res.leads);

      // Keep current open lead modal details fully in sync in real time!
      if (selectedLeadRef.current) {
        const updatedLead = res.leads.find((l: any) => l.id === selectedLeadRef.current.id);
        if (updatedLead) {
          setSelectedLead(updatedLead);
        }
      }

      // Real-time unread message checks & smartphone chime trigger
      let hasNewUnread = false;
      const currentUnreadIds = new Set<string>();

      res.leads.forEach(lead => {
        lead.whatsappMessages?.forEach((msg: any) => {
          if (msg.direction === 'INBOUND' && msg.status !== 'READ' && msg.id) {
            currentUnreadIds.add(msg.id);
            if (!knownUnreadMessageIdsRef.current.has(msg.id)) {
              hasNewUnread = true;
              knownUnreadMessageIdsRef.current.add(msg.id);
            }
          }
        });
      });

      // Clear read messages from known cache to prevent stale tracking
      knownUnreadMessageIdsRef.current.forEach(id => {
        if (!currentUnreadIds.has(id)) {
          knownUnreadMessageIdsRef.current.delete(id);
        }
      });

      // Sweet chimes only trigger after page initial load (to prevent loud chime on mount)
      if (hasNewUnread && !isFirstLoadRef.current) {
        playWhatsAppChime();
      }

      isFirstLoadRef.current = false;
    }
    if (!silent) setLoading(false);
  };

  const handleCreateStage = async (insertAfterId?: string) => {
    const nome = prompt('Nome da nova etapa (ex: Em Negociação):');
    if (!nome) return;
    const res = await createLeadStage(nome, insertAfterId);
    if (res.success) fetchData();
    else alert(res.error);
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('Deseja excluir esta etapa? Atenção: ela precisa estar vazia.')) return;
    const res = await deleteLeadStage(id);
    if (res.success) fetchData();
    else alert(res.error);
  };

  const handleSaveStageName = async (id: string) => {
    if (editingStageName.trim() === '') return;
    const res = await updateLeadStageName(id, editingStageName.trim());
    if (res.success) {
      fetchData();
      setEditingStageId(null);
    } else {
      alert(res.error);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    const lead = leads.find(l => l.id === leadId);
    if (lead?.stageId === stageId) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stageId } : l));

    await updateLeadStage(leadId, stageId);
    fetchData();
  };

  const handleStageChangeInModal = async (newStageId: string) => {
    if (!selectedLead || selectedLead.stageId === newStageId) return;
    
    const newStage = stages.find(s => s.id === newStageId);
    if (!newStage) return;

    // Optimistic Update
    const updatedLead = { ...selectedLead, stageId: newStageId, stage: newStage };
    setSelectedLead(updatedLead);
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));

    try {
      await updateLeadStage(selectedLead.id, newStageId);
      fetchData();
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState<any>({});
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ nome: '', telefone: '', email: '', cargo: '' });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newContactForm.nome.trim()) return;

    const res = await addLeadContact(selectedLead.id, newContactForm);
    if (res.success) {
      setNewContactForm({ nome: '', telefone: '', email: '', cargo: '' });
      setShowAddContactForm(false);
      fetchData();
      
      const updatedLeads = await getLeads({});
      if (updatedLeads.success) {
        const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLead.id);
        if (upLead) setSelectedLead(upLead);
      }
    } else {
      alert("Erro ao adicionar contato: " + res.error);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!selectedLead || !confirm("Deseja realmente excluir este contato adicional?")) return;

    const res = await removeLeadContact(selectedLead.id, contactId);
    if (res.success) {
      fetchData();
      
      const updatedLeads = await getLeads({});
      if (updatedLeads.success) {
        const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLead.id);
        if (upLead) setSelectedLead(upLead);
      }
    } else {
      alert("Erro ao remover contato: " + res.error);
    }
  };

  const handleSaveLeadEdit = async () => {
    if (!selectedLead) return;
    const res = await updateLeadData(selectedLead.id, {
      nomeFantasia: editLeadForm.nomeFantasia,
      contatoNome: editLeadForm.contatoNome,
      telefone: editLeadForm.telefone,
      email: editLeadForm.email
    });
    if (res.success) {
      setSelectedLead(res.lead);
      setIsEditingLead(false);
      fetchData();
    } else {
      alert(res.error);
    }
  };

  const handleSaveInlineLeadEdit = async (leadId: string) => {
    const res = await updateLeadData(leadId, {
      nomeFantasia: inlineForm.nomeFantasia,
      contatoNome: inlineForm.contatoNome,
      email: inlineForm.email,
      segmento: inlineForm.segmento || undefined
    });

    if (res.success) {
      if (inlineForm.assignedToId) {
        await changeLeadOwner(leadId, inlineForm.assignedToId);
      }
      setIsEditingInline(false);
      fetchData();
    } else {
      alert("Erro ao salvar dados: " + res.error);
    }
  };

  const handleOwnerChange = async (newOwnerId: string) => {
    if (!selectedLead) return;
    const res = await changeLeadOwner(selectedLead.id, newOwnerId);
    if (res.success) {
      setSelectedLead(res.lead);
      fetchData();
    } else {
      alert("Erro ao alterar responsável: " + res.error);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!selectedLead || !userId) return;
    const res = await addLeadShare(selectedLead.id, userId);
    if (res.success) {
      fetchData();
      // Reload the selected lead manually since addLeadShare doesn't return the full lead include
      const updatedLeads = await getLeads({});
      if (updatedLeads.success) {
        const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLead.id);
        if (upLead) setSelectedLead(upLead);
      }
    } else {
      alert("Erro ao adicionar participante: " + res.error);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedLead) return;
    const res = await removeLeadShare(selectedLead.id, userId);
    if (res.success) {
      fetchData();
      const updatedLeads = await getLeads({});
      if (updatedLeads.success) {
        const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLead.id);
        if (upLead) setSelectedLead(upLead);
      }
    }
  };

  const handleDropDelete = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    if (confirm('Tem certeza que deseja excluir permanentemente este lead?')) {
      const res = await deleteLead(leadId);
      if (res.success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        fetchData();
      } else {
        alert(res.error);
      }
    }
  };

  const handleDropConvert = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    const lead = leads.find(l => l.id === leadId);
    if (lead) openConvertModal(lead);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.nomeFantasia) return;
    
    await createLead({ ...newLeadForm });
    setShowNewLead(false);
    setNewLeadForm({ nomeFantasia: '', segmento: '', telefone: '', email: '', contatoNome: '' });
    fetchData();
  };

  const openConvertModal = (lead: any) => {
    setConvertForm({
      nomeFantasia: lead.nomeFantasia || '',
      razaoSocial: lead.razaoSocial || '',
      cnpj: lead.cnpj || '',
      email: lead.email || '',
      whatsapp: lead.telefone || '',
      endereco: lead.endereco || '',
      contato: lead.contatoNome || ''
    });
    setShowConvertModal(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertForm.nomeFantasia || !convertForm.razaoSocial || !convertForm.cnpj) {
      alert('Por favor, preencha os campos obrigatórios (Nome Fantasia, Razão Social e CNPJ).');
      return;
    }
    
    const res = await convertLeadToClient(selectedLead.id, convertForm);
    if (res.success) {
      alert('Lead convertido com sucesso!');
      setShowConvertModal(false);
      setSelectedLead(null);
      router.push(`/propostas/nova?clientId=${res.clientId}`);
    } else {
      alert('Erro: ' + res.error);
    }
  };

  const term = searchTerm.toLowerCase().trim();
  const filteredLeads = leads.filter(lead => {
    if (!term) return true;
    return (
      lead.nomeFantasia.toLowerCase().includes(term) ||
      (lead.segmento && lead.segmento.toLowerCase().includes(term)) ||
      (lead.contatoNome && lead.contatoNome.toLowerCase().includes(term)) ||
      (lead.telefone && lead.telefone.includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.contacts && lead.contacts.some((c: any) => 
        c.nome.toLowerCase().includes(term) || 
        (c.telefone && c.telefone.includes(term)) || 
        (c.email && c.email.toLowerCase().includes(term))
      ))
    );
  });

  // Get all leads with WhatsApp messages, sorted by the latest message date
  const chatLeads = leads
    .filter(lead => lead.telefone && (lead.whatsappMessages?.length > 0))
    .map(lead => {
      const sortedMsgs = [...(lead.whatsappMessages || [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestMsg = sortedMsgs[0];
      const unreadCount = (lead.whatsappMessages || []).filter(
        (m: any) => m.direction === 'INBOUND' && m.status !== 'READ'
      ).length;
      return {
        ...lead,
        nome: lead.nomeFantasia,
        latestMsg,
        unreadCount,
        latestMsgDate: latestMsg ? new Date(latestMsg.createdAt) : new Date(0)
      };
    })
    .sort((a, b) => b.latestMsgDate.getTime() - a.latestMsgDate.getTime());

  const filteredChatLeads = chatLeads.filter(lead => 
    lead.nome.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
    lead.telefone.includes(chatSearchTerm)
  );

  const totalUnreadCount = leads.reduce((acc, lead) => {
    return acc + (lead.whatsappMessages || []).filter(
      (m: any) => m.direction === 'INBOUND' && m.status !== 'READ'
    ).length;
  }, 0);

  if (loading) return <div className="p-8 text-slate-500">Carregando funil...</div>;

  // Se não houver estágios, exibe aviso e botão para semear
  if (stages.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold text-slate-800">Pipeline de Leads Vazio</h2>
        <p className="mt-4 text-slate-500 mb-6">Você precisa configurar as etapas do funil de vendas antes de começar.</p>
        <button 
          onClick={async () => {
             const res = await fetch('/api/leads/seed', { method: 'POST' });
             if(res.ok) fetchData();
          }}
          className="bg-[#1B4D3E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#13382d] transition-all"
        >
          Criar Etapas Padrão (Descoberta, Reunião, etc)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-y-auto scrollbar-thin">
      <div className="p-4 md:p-6 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Pipeline de Leads</h1>
          <p className="text-xs md:text-sm text-slate-500">Gerencie seus leads e prospectos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-[200px] md:flex-none md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por nome, celular, e-mail..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select 
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs md:text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none flex-1 sm:flex-none"
          >
            <option value="all">Todos Usuários</option>
            {filterUsers.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>

          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs md:text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none flex-1 sm:flex-none"
          >
            <option value="all">Todo Período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="14d">Últimos 14 dias</option>
            <option value="28d">Últimos 28 dias</option>
            <option value="this_month">Este Mês</option>
            <option value="last_month">Mês Passado</option>
            <option value="this_year">Este Ano</option>
            <option value="custom">Personalizado</option>
          </select>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs md:text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none flex-1 sm:flex-none"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs md:text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none flex-1 sm:flex-none"
              />
            </div>
          )}

          <button 
            type="button"
            onClick={() => setShowMetrics(!showMetrics)}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs md:text-sm rounded-xl font-bold hover:bg-slate-50 transition-all w-full sm:w-auto shadow-sm"
          >
            {showMetrics ? "Ocultar Métricas" : "Mostrar Métricas"}
          </button>

          <button 
            type="button"
            onClick={() => setShowChatCenter(true)}
            className="relative flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 text-xs md:text-sm rounded-xl font-bold hover:bg-emerald-700 transition-all w-full sm:w-auto shadow-sm"
          >
            <MessageCircle size={16} />
            <span>Central de WhatsApp</span>
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full border-2 border-white animate-bounce shrink-0">
                {totalUnreadCount}
              </span>
            )}
          </button>

          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>

          <button 
            type="button"
            onClick={() => setShowNewLead(true)}
            className="flex items-center justify-center gap-2 bg-[#1B4D3E] text-white px-4 py-2 text-xs md:text-sm rounded-xl font-bold hover:bg-[#13382d] transition-all w-full sm:w-auto"
          >
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 bg-slate-50">
        {showMetrics && <PipelineMetrics leads={filteredLeads} stages={stages} />}
        <div className="overflow-x-auto pb-4 sticky top-0 z-20 bg-slate-50">
          <div className="flex gap-4 h-[calc(100vh-70px)] shrink-0 pr-6">
          {stages.map((stage, idx) => {
            const stageLeads = filteredLeads.filter(l => l.stageId === stage.id);
            const isFirst = idx === 0;
            const colorMap: Record<string, string> = {
              'bg-slate-100': 'text-slate-400',
              'bg-blue-100': 'text-blue-400',
              'bg-emerald-100': 'text-emerald-400',
              'bg-amber-100': 'text-amber-400',
              'bg-rose-100': 'text-rose-400',
              'bg-purple-100': 'text-purple-400',
            };
            const headerTextColorClass = colorMap[stage.color || 'bg-slate-100'] || 'text-slate-400';
            
            const points = isFirst ? "0,0 320,0 336,32 320,64 0,64" : "0,0 320,0 336,32 320,64 0,64 16,32";

            return (
              <div 
                key={stage.id} 
                className={`w-[270px] shrink-0 flex flex-col h-full rounded-2xl transition-colors duration-300 relative`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div 
                  className={`relative h-13 shrink-0 z-10 w-[calc(100%+16px)] ml-0 group/header text-slate-800`}
                >
                  <svg 
                    className={`absolute inset-0 w-full h-full drop-shadow-sm ${headerTextColorClass}`} 
                    preserveAspectRatio="none" 
                    viewBox="0 0 336 64"
                  >
                    <polygon 
                      points={points}
                      fill="currentColor" 
                      stroke="#1e293b" 
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className={`relative z-10 flex justify-between items-center h-full ${isFirst ? 'pl-4' : 'pl-8'} pr-8`}>
                    <div className="flex items-center gap-2">
                      {editingStageId === stage.id ? (
                        <input
                          autoFocus
                          className="font-black text-slate-900 uppercase tracking-tight text-xs bg-white/70 border border-slate-400 rounded px-1.5 py-0.5 w-[120px] outline-none focus:ring-2 focus:ring-slate-900"
                          value={editingStageName}
                          onChange={(e) => setEditingStageName(e.target.value)}
                          onBlur={() => handleSaveStageName(stage.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveStageName(stage.id);
                            if (e.key === 'Escape') setEditingStageId(null);
                          }}
                        />
                      ) : (
                        <h3 
                          className="font-black text-slate-900 uppercase tracking-tight text-xs cursor-pointer hover:underline drop-shadow-sm max-w-[140px] truncate"
                          title="Clique duplo para editar"
                          onDoubleClick={() => {
                            setEditingStageId(stage.id);
                            setEditingStageName(stage.nome);
                          }}
                        >
                          {stage.nome}
                        </h3>
                      )}
                      <div className="relative group/picker ml-1">
                        <button 
                          title="Mudar cor da coluna"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                        </button>
                        <div className="absolute top-8 left-0 bg-white p-3 rounded-xl shadow-xl border border-slate-200 hidden group-hover/picker:flex flex-wrap gap-2 z-10 w-32">
                          {['bg-slate-100', 'bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-rose-100', 'bg-purple-100'].map(c => (
                            <div 
                              key={c} 
                              onClick={async () => { await updateLeadStageColor(stage.id, c); fetchData(); }} 
                              className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 hover:ring-2 ring-offset-2 ring-slate-400 transition-all ${c}`}
                              title="Selecionar esta cor"
                            />
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCreateStage(stage.id)} 
                        title="Adicionar Etapa à Direita" 
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <Plus size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStage(stage.id)} 
                        title="Excluir Etapa" 
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <span className="bg-white/70 text-slate-800 text-xs font-black px-2 py-1 rounded-full shrink-0">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>
                
                <div className={`flex-1 flex flex-col p-3 overflow-y-auto space-y-3 ${stage.color || 'bg-slate-100'} border-x border-b border-slate-200 rounded-b-2xl -mt-[1px] z-0`}>
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="font-bold text-xs text-slate-800 truncate" title={lead.nomeFantasia}>{lead.nomeFantasia}</div>
                        {(() => {
                          const unreadCount = lead.whatsappMessages?.filter(
                            (m: any) => m.direction === 'INBOUND' && m.status !== 'READ'
                          ).length || 0;
                          if (unreadCount > 0) {
                            return (
                              <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 animate-pulse shadow-sm shadow-emerald-500/30" title={`${unreadCount} mensagens não lidas`}>
                                <MessageSquare size={8} fill="white" /> {unreadCount}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1.5">
                        <Building size={10} className="shrink-0" /> <span className="truncate">{lead.segmento || 'Sem segmento'}</span>
                      </div>
                      
                      {(lead.telefone || lead.email) && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {lead.telefone && (
                            <span className="flex items-center gap-0.5 truncate max-w-[110px]" title={lead.telefone}>
                              <Phone size={10} className="text-slate-400 shrink-0" /> {lead.telefone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-0.5 truncate max-w-[120px]" title={lead.email}>
                              <Mail size={10} className="text-slate-400 shrink-0" /> {lead.email}
                            </span>
                          )}
                        </div>
                      )}

                      {lead.endereco && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.endereco)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={e => e.stopPropagation()} 
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-black py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-blue-100"
                            title="Abrir no Google Maps"
                          >
                            <MapPin size={9} /> Maps
                          </a>
                          <a 
                            href={`https://waze.com/ul?q=${encodeURIComponent(lead.endereco)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={e => e.stopPropagation()} 
                            className="flex-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 text-[9px] font-black py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-cyan-100"
                            title="Abrir no Waze"
                          >
                            <Navigation size={9} /> Waze
                          </a>
                        </div>
                      )}

                      {lead.activities && lead.activities.length > 0 && (
                        <div className="mt-2 bg-amber-50/70 border border-amber-100 p-1.5 rounded-lg text-[10px] flex items-center gap-1 text-amber-700">
                          <CalendarDays size={11} className="text-amber-500 shrink-0" />
                          <span className="font-semibold shrink-0">{lead.activities[0].tipo}:</span>
                          <span className="truncate flex-1">{lead.activities[0].titulo}</span>
                          <span className="text-[9px] text-amber-600 font-medium bg-amber-100/80 px-1 py-0.5 rounded shrink-0">
                            {safeDate(lead.activities[0].dataInicio)}
                          </span>
                        </div>
                      )}

                      {lead.assignedTo && (
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[9px] text-slate-400">
                           <div className="flex items-center gap-1">
                             <User size={10} /> {lead.assignedTo.nome.split(' ')[0]}
                           </div>
                           <div>
                             {safeDate(lead.updatedAt)}
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Dropzones (Aparecem apenas quando arrastando) */}
      {isDragging && (
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-slate-900/90 backdrop-blur shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[100] flex animate-in slide-in-from-bottom-8">
          <div 
            className="flex-1 flex flex-col items-center justify-center border-r border-slate-700/50 hover:bg-rose-500/20 group transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDropDelete}
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Trash2 size={24} />
            </div>
            <span className="text-white font-bold tracking-widest uppercase text-sm">Excluir Lead</span>
          </div>
          <div 
            className="flex-1 flex flex-col items-center justify-center hover:bg-emerald-500/20 group transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDropConvert}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-white font-bold tracking-widest uppercase text-sm">Converter para FPV</span>
          </div>
        </div>
      )}

      {/* Modal New Lead */}
      {showNewLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">Novo Lead Manual</h3>
              <button onClick={() => setShowNewLead(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Empresa / Nome Fantasia *</label>
                <input required value={newLeadForm.nomeFantasia} onChange={e => setNewLeadForm({...newLeadForm, nomeFantasia: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl" placeholder="Ex: Hospital do Rocio" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Segmento</label>
                <select 
                  value={newLeadForm.segmento} 
                  onChange={e => setNewLeadForm({...newLeadForm, segmento: e.target.value})} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">Selecione um segmento...</option>
                  {segmentos.map(seg => (
                    <option key={seg.id} value={seg.nome}>{seg.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefone</label>
                  <input value={newLeadForm.telefone} onChange={e => setNewLeadForm({...newLeadForm, telefone: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Contato (Nome)</label>
                  <input value={newLeadForm.contatoNome} onChange={e => setNewLeadForm({...newLeadForm, contatoNome: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#1B4D3E] text-white p-3 rounded-xl font-bold mt-4">Salvar Lead</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lead Details (Premium 2-Columns) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-50 p-4 sm:p-6">
          <div className="bg-white w-full max-w-6xl h-full shadow-2xl flex flex-col rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Top Pipeline Bar */}
            <div className="w-full bg-slate-50 border-b border-slate-200 p-2 shrink-0 flex items-center overflow-x-auto gap-1 hidden md:flex">
              {stages.map((stage, idx) => {
                const currentIndex = stages.findIndex(s => s.id === selectedLead.stageId);
                const currentStageColor = currentIndex >= 0 ? stages[currentIndex].color : 'bg-slate-100';
                
                // Mapeamento estático para garantir que o Tailwind gere as classes
                const darkerColorMap: Record<string, string> = {
                  'bg-slate-100': 'bg-slate-500',
                  'bg-blue-100': 'bg-blue-500',
                  'bg-emerald-100': 'bg-emerald-500',
                  'bg-amber-100': 'bg-amber-500',
                  'bg-rose-100': 'bg-rose-500',
                  'bg-purple-100': 'bg-purple-500',
                  'bg-slate-300': 'bg-slate-500',
                };

                const darkColor = darkerColorMap[currentStageColor] || 'bg-slate-500';
                const isPast = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                
                let baseClass = "h-8 px-4 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex-1 min-w-[120px] relative cursor-pointer";
                let colorClass = "bg-slate-200 text-slate-500 hover:bg-slate-300";
                
                if (isCurrent) colorClass = `${darkColor} text-white shadow-md border-b-2 border-slate-800`;
                else if (isPast) colorClass = `${darkColor} text-white`;

                return (
                  <button 
                    key={stage.id}
                    onClick={() => handleStageChangeInModal(stage.id)}
                    className={`${baseClass} ${colorClass} rounded-lg`}
                    title={`Mover para ${stage.nome}`}
                  >
                    {stage.nome}
                  </button>
                )
              })}
            </div>

            {/* Main Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Left Column: Info (Flat Design) */}
              <div className="w-full md:w-[35%] lg:w-[30%] bg-white border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start group relative">
                  {isEditingLead ? (
                    <div className="w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome Fantasia</label>
                      <input value={editLeadForm.nomeFantasia || ''} onChange={e => setEditLeadForm({...editLeadForm, nomeFantasia: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 mb-2" />
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-black text-slate-800 leading-tight mb-1 pr-6">{selectedLead.nomeFantasia}</h2>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Building size={12}/> {selectedLead.segmento || 'Sem segmento'}</p>
                    </div>
                  )}
                  
                  {!isEditingLead && (
                    <button onClick={() => { setIsEditingLead(true); setEditLeadForm(selectedLead); }} className="absolute right-6 top-6 text-slate-300 hover:text-emerald-600 transition-colors hidden md:block group-hover:block"><Edit2 size={14}/></button>
                  )}
                  <button onClick={() => setSelectedLead(null)} className="md:hidden text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full absolute right-4 top-4"><X size={16}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  <div className="space-y-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-slate-50 flex justify-between items-center">
                      Contato
                      {isEditingLead && (
                        <button onClick={handleSaveLeadEdit} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Save size={12}/> Salvar</button>
                      )}
                    </div>
                    
                    {isEditingLead ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Nome do Contato</label>
                          <input value={editLeadForm.contatoNome || ''} onChange={e => setEditLeadForm({...editLeadForm, contatoNome: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Telefone</label>
                          <input value={editLeadForm.telefone || ''} onChange={e => setEditLeadForm({...editLeadForm, telefone: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">E-mail</label>
                          <input value={editLeadForm.email || ''} onChange={e => setEditLeadForm({...editLeadForm, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-800" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Users size={10}/> Nome</div>
                          <div className="text-sm font-medium text-slate-800">{selectedLead.contatoNome || '-'}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Phone size={10}/> Telefone</div>
                          <div className="text-sm font-medium text-slate-800">
                            {selectedLead.telefone ? (
                              <a href={`tel:${selectedLead.telefone.replace(/\D/g,'')}`} className="hover:text-emerald-600 transition-colors">{selectedLead.telefone}</a>
                            ) : '-'}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center gap-1"><Mail size={10}/> E-mail</div>
                          <div className="text-sm font-medium text-slate-800">
                            {selectedLead.email ? (
                              <a href={`mailto:${selectedLead.email}`} className="hover:text-emerald-600 transition-colors truncate max-w-[200px] block" title={selectedLead.email}>{selectedLead.email}</a>
                            ) : '-'}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Contatos Adicionais Section */}
                    <div className="pt-4 mt-4 border-t border-slate-50 space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Contatos Adicionais</span>
                        {!showAddContactForm && (
                          <button 
                            onClick={() => setShowAddContactForm(true)} 
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                            title="Adicionar Novo Contato"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </div>

                      {/* List of Additional Contacts */}
                      {selectedLead.contacts && selectedLead.contacts.length > 0 && (
                        <div className="space-y-3">
                          {selectedLead.contacts.map((c: any) => (
                            <div key={c.id} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl relative group/contact">
                              <button 
                                onClick={() => handleRemoveContact(c.id)}
                                className="absolute top-2.5 right-2.5 text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                                title="Remover contato"
                              >
                                <Trash2 size={12} />
                              </button>
                              <div className="font-bold text-xs text-slate-700 leading-tight pr-5">{c.nome}</div>
                              {c.cargo && (
                                <div className="text-[10px] text-slate-400 font-medium mb-1.5">{c.cargo}</div>
                              )}
                              
                              <div className="space-y-1 mt-1.5">
                                {c.telefone && (
                                  <a href={`tel:${c.telefone.replace(/\D/g, '')}`} className="text-[11px] text-slate-600 hover:text-emerald-600 flex items-center gap-1.5">
                                    <Phone size={10} /> {c.telefone}
                                  </a>
                                )}
                                {c.email && (
                                  <a href={`mailto:${c.email}`} className="text-[11px] text-slate-600 hover:text-emerald-600 flex items-center gap-1.5 truncate block" title={c.email}>
                                    <Mail size={10} /> {c.email}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Contact Inline Form */}
                      {showAddContactForm && (
                        <form onSubmit={handleAddContact} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                          <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1 flex justify-between items-center">
                            <span>Novo Contato</span>
                            <button type="button" onClick={() => setShowAddContactForm(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nome *</label>
                            <input 
                              required 
                              value={newContactForm.nome} 
                              onChange={e => setNewContactForm({ ...newContactForm, nome: e.target.value })} 
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                              placeholder="Ex: João da Silva"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Celular</label>
                              <input 
                                value={newContactForm.telefone} 
                                onChange={e => setNewContactForm({ ...newContactForm, telefone: e.target.value })} 
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                                placeholder="(41) 99999-9999"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cargo</label>
                              <input 
                                value={newContactForm.cargo} 
                                onChange={e => setNewContactForm({ ...newContactForm, cargo: e.target.value })} 
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                                placeholder="Ex: Comprador"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">E-mail</label>
                            <input 
                              type="email" 
                              value={newContactForm.email} 
                              onChange={e => setNewContactForm({ ...newContactForm, email: e.target.value })} 
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                              placeholder="Ex: joao@empresa.com"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-1.5">
                            <button 
                              type="button" 
                              onClick={() => { setShowAddContactForm(false); setNewContactForm({ nome: '', telefone: '', email: '', cargo: '' }); }}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit" 
                              className="bg-[#1B4D3E] hover:bg-[#13382d] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Adicionar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 flex items-center gap-1"><MapPin size={10}/> Endereço</div>
                      <div className="text-sm font-medium text-slate-800 mb-2">{selectedLead.endereco || '-'}</div>
                      {selectedLead.endereco && (
                        <div className="flex flex-col gap-2">
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.endereco)}`} target="_blank" rel="noreferrer" className="w-full bg-slate-50 hover:bg-blue-50 text-blue-600 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-blue-200">
                            <MapPin size={14} /> Abrir no Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Equipe / Responsável Block */}
                  <div className="pt-6 border-t border-slate-50 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</label>
                      <select 
                        value={selectedLead.assignedToId || ''} 
                        onChange={(e) => handleOwnerChange(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
                      >
                        <option value="">Sem responsável</option>
                        {filterUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participantes</label>
                      <div className="space-y-2 mb-2">
                        {selectedLead.shares?.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                            <span className="text-xs font-bold text-slate-700">{s.user?.nome}</span>
                            <button onClick={() => handleRemoveParticipant(s.user.id)} className="text-red-400 hover:text-red-600 p-1"><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                      <select 
                        value="" 
                        onChange={(e) => handleAddParticipant(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
                      >
                        <option value="">Adicionar participante...</option>
                        {filterUsers.filter(u => u.id !== selectedLead.assignedToId && !selectedLead.shares?.some((s:any) => s.user?.id === u.id)).map(u => (
                          <option key={u.id} value={u.id}>{u.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 shrink-0 space-y-2">
                  <button 
                    onClick={() => openConvertModal(selectedLead)}
                    className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                  >
                    <CheckCircle2 size={16} /> Converter para Cliente
                  </button>
                </div>
              </div>

            {/* Right Column: Dynamic Feed & Tabs */}
            <div className="w-full md:w-[65%] lg:w-[70%] flex flex-col bg-white">
              <div className="hidden md:flex justify-end p-4 border-b border-slate-100 shrink-0">
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <LeadDetailsTabs lead={selectedLead} />
              </div>
            </div>

            </div> {/* Fim do Main Body */}
          </div>
        </div>
      )}

      {/* Modal de Conversão (Dados Obrigatórios) */}
      {showConvertModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-black text-slate-800">Converter em Cliente</h3>
                <p className="text-xs text-slate-500 mt-1">Preencha os dados oficiais do cliente para gerar a proposta.</p>
              </div>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={16}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="convert-form" onSubmit={handleConvertSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nome Fantasia *</label>
                    <input required value={convertForm.nomeFantasia} onChange={e => setConvertForm({...convertForm, nomeFantasia: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Razão Social *</label>
                    <input required value={convertForm.razaoSocial} onChange={e => setConvertForm({...convertForm, razaoSocial: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">CNPJ *</label>
                    <input required value={convertForm.cnpj} onChange={e => setConvertForm({...convertForm, cnpj: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                    <input type="email" value={convertForm.email} onChange={e => setConvertForm({...convertForm, email: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Telefone / WhatsApp</label>
                    <input value={convertForm.whatsapp} onChange={e => setConvertForm({...convertForm, whatsapp: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Contato (Nome)</label>
                    <input value={convertForm.contato} onChange={e => setConvertForm({...convertForm, contato: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Endereço Completo</label>
                  <input value={convertForm.endereco} onChange={e => setConvertForm({...convertForm, endereco: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-colors" placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowConvertModal(false)} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancelar</button>
              <button form="convert-form" type="submit" className="bg-[#1B4D3E] hover:bg-[#13382d] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                <CheckCircle2 size={18} /> Confirmar Conversão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Central de WhatsApp / Chat Center Modal */}
      {showChatCenter && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-scale-up">
            
            {/* Premium Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <MessageCircle size={22} className="fill-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    Central de Atendimento WhatsApp
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">Acompanhe e responda todas as conversas do funil em tempo real</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowChatCenter(false);
                  setSelectedChatLeadId(null);
                  setIsEditingInline(false);
                }} 
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Panel: Chats List Sidebar */}
              <div className="w-full md:w-[35%] lg:w-[30%] border-r border-slate-100 flex flex-col bg-slate-50 shrink-0">
                {/* Search in Chats */}
                <div className="p-3 border-b border-slate-100 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Pesquisar conversas..."
                      value={chatSearchTerm}
                      onChange={e => setChatSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs md:text-sm bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-semibold"
                    />
                    {chatSearchTerm && (
                      <button 
                        type="button" 
                        onClick={() => setChatSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chats scrollable container */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {filteredChatLeads.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      Nenhuma conversa encontrada.
                    </div>
                  ) : (
                    filteredChatLeads.map(lead => {
                      const isSelected = selectedChatLeadId === lead.id;
                      return (
                        <div 
                          key={lead.id}
                          onClick={() => {
                            setSelectedChatLeadId(lead.id);
                            setIsEditingInline(false);
                          }}
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 ${
                            isSelected 
                              ? 'bg-emerald-50/70 border-l-4 border-emerald-500 font-bold font-black' 
                              : 'hover:bg-white bg-slate-50/50'
                          }`}
                        >
                          {/* Avatar / Initials */}
                          <div className="w-10 h-10 bg-emerald-600/10 text-emerald-700 font-black text-xs rounded-xl flex items-center justify-center shrink-0 uppercase border border-emerald-100">
                            {getInitials(lead.nomeFantasia)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate">{lead.nomeFantasia}</h4>
                              {lead.latestMsg && (
                                <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-1">
                                  {new Date(lead.latestMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold truncate">{lead.telefone}</p>
                            
                            {lead.latestMsg && (
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {lead.latestMsg.direction === 'OUTBOUND' ? 'Você: ' : ''}
                                {lead.latestMsg.texto}
                              </p>
                            )}
                          </div>

                          {/* Unread badge */}
                          {lead.unreadCount > 0 && (
                            <span className="bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                              {lead.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: Selected Chat Conversation view */}
              <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
                {selectedChatLeadId ? (
                  (() => {
                    const activeLead = leads.find(l => l.id === selectedChatLeadId);
                    if (!activeLead) return null;
                    return (
                      <div className="flex-1 flex h-full overflow-hidden bg-slate-100 relative">
                        {/* Main Chat Container */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                          {/* Selected Lead mini header */}
                          <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center justify-center shrink-0 uppercase border border-emerald-100">
                                {getInitials(activeLead.nomeFantasia)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate leading-none mb-1">
                                  {activeLead.nomeFantasia || 'Sem Nome'}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-semibold">{activeLead.telefone}</span>
                                  {activeLead.segmento && (
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                      {activeLead.segmento}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Inline Edit Button */}
                              <button
                                onClick={() => {
                                  setInlineForm({
                                    nomeFantasia: activeLead.nomeFantasia || '',
                                    contatoNome: activeLead.contatoNome || '',
                                    email: activeLead.email || '',
                                    assignedToId: activeLead.assignedToId || '',
                                    segmento: activeLead.segmento || ''
                                  });
                                  setIsEditingInline(!isEditingInline);
                                }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${
                                  isEditingInline 
                                    ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900' 
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                                }`}
                              >
                                {isEditingInline ? (
                                  <>
                                    <X size={12} /> Fechar Edição
                                  </>
                                ) : (
                                  <>
                                    <UserCog size={12} /> Completar Cadastro
                                  </>
                                )}
                              </button>

                              {/* Button to view lead profile/funnel detail modal directly */}
                              <button
                                onClick={() => {
                                  setSelectedLead(activeLead);
                                  setShowChatCenter(false);
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-[#1B4D3E] hover:from-emerald-700 hover:to-[#13382d] text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95"
                                title="Ver no Funil"
                              >
                                <Target size={12} /> Ver no Funil
                              </button>
                            </div>
                          </div>

                          {/* WhatsAppChat itself */}
                          <div className="flex-1 overflow-hidden">
                            <WhatsAppChat leadId={activeLead.id} leadPhone={activeLead.telefone} />
                          </div>
                        </div>

                        {/* Sliding inline edit panel */}
                        {isEditingInline && (
                          <div className="w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col shrink-0 animate-slide-left z-10">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                              <h4 className="text-xs md:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <UserCog size={16} className="text-emerald-600" />
                                Completar Cadastro
                              </h4>
                              <button 
                                onClick={() => setIsEditingInline(false)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nome / Nome Fantasia</label>
                                <input 
                                  type="text" 
                                  value={inlineForm.nomeFantasia}
                                  onChange={e => setInlineForm({ ...inlineForm, nomeFantasia: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nome do Contato</label>
                                <input 
                                  type="text" 
                                  value={inlineForm.contatoNome}
                                  onChange={e => setInlineForm({ ...inlineForm, contatoNome: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                  placeholder="Ex: João Silva"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
                                <input 
                                  type="email" 
                                  value={inlineForm.email}
                                  onChange={e => setInlineForm({ ...inlineForm, email: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                                  placeholder="Ex: contato@empresa.com"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Segmento</label>
                                <select 
                                  value={inlineForm.segmento}
                                  onChange={e => setInlineForm({ ...inlineForm, segmento: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
                                >
                                  <option value="">Selecione um segmento...</option>
                                  {segmentos.map(seg => {
                                    const val = seg.nome || seg;
                                    return (
                                      <option key={seg.id || seg} value={val}>{val}</option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Responsável pelo Lead</label>
                                <select 
                                  value={inlineForm.assignedToId}
                                  onChange={e => setInlineForm({ ...inlineForm, assignedToId: e.target.value })}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
                                >
                                  <option value="">Selecione um responsável...</option>
                                  {filterUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.nome}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                              <button
                                onClick={() => handleSaveInlineLeadEdit(activeLead.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 size={14} /> Salvar Alterações
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner border border-emerald-200/50 animate-bounce">
                      <MessageCircle size={40} className="fill-emerald-600 animate-pulse" />
                    </div>
                    <h3 className="text-slate-800 font-black text-lg">Central de WhatsApp</h3>
                    <p className="text-slate-500 text-sm max-w-sm mt-2">
                      Selecione uma conversa na barra lateral para iniciar o atendimento integrado no WhatsApp.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
