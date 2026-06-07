'use client';

import React, { useState, useEffect } from 'react';
import { getLeads, getLeadStages, updateLeadStage, createLead, convertLeadToClient, addLeadHistory, updateLeadStageColor, createLeadStage, deleteLeadStage, getUsersForFilter, updateLeadStageName, deleteLead, updateLeadData, changeLeadOwner, addLeadShare, removeLeadShare, addLeadContact, removeLeadContact } from './actions';
import { Plus, User, Users, Phone, Mail, Building, Clock, ChevronRight, CheckCircle2, X, Trash2, MapPin, Navigation, CalendarDays, Edit2, Save, Search, MessageSquare, MessageCircle, UserCog, Target, LayoutList, LayoutGrid, Eye, Smartphone } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSegmentos, createSegmento } from '@/app/admin/settings/actions';
import LeadDetailsTabs from './components/LeadDetailsTabs';
import PipelineMetrics from './components/PipelineMetrics';
import WhatsAppChat from './components/WhatsAppChat';
import UserSelectPopover from '@/components/UserSelectPopover';

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

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const getLeadTotalizerStyle = (color: string) => {
  const lower = (color || '').toLowerCase();
  if (lower.includes('blue')) {
    return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', borderColor: 'rgba(59, 130, 246, 0.25)' };
  }
  if (lower.includes('green') || lower.includes('emerald')) {
    return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857', borderColor: 'rgba(16, 185, 129, 0.25)' };
  }
  if (lower.includes('amber')) {
    return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', borderColor: 'rgba(245, 158, 11, 0.25)' };
  }
  if (lower.includes('rose')) {
    return { backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#be123c', borderColor: 'rgba(244, 63, 94, 0.25)' };
  }
  if (lower.includes('purple')) {
    return { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#6d28d9', borderColor: 'rgba(139, 92, 246, 0.25)' };
  }
  return { backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#334155', borderColor: 'rgba(100, 116, 139, 0.25)' };
};

const normalizeText = (text?: string) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
};

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

  // Check for exact Tailwind bg-color-100 / bg-color-200 matches
  if (lower.includes('bg-slate-100')) return '#f1f5f9';
  if (lower.includes('bg-slate-200')) return '#e2e8f0';
  if (lower.includes('bg-gray-100')) return '#f3f4f6';
  if (lower.includes('bg-gray-200')) return '#e5e7eb';
  if (lower.includes('bg-sky-100')) return '#e0f2fe';
  if (lower.includes('bg-sky-200')) return '#bae6fd';
  if (lower.includes('bg-orange-100')) return '#ffedd5';
  if (lower.includes('bg-orange-200')) return '#fed7aa';
  if (lower.includes('bg-green-100') || lower.includes('bg-emerald-100')) return '#dcfce7';
  if (lower.includes('bg-green-200') || lower.includes('bg-emerald-200')) return '#bbf7d0';
  if (lower.includes('bg-red-100')) return '#fee2e2';
  if (lower.includes('bg-red-200')) return '#fecaca';
  if (lower.includes('bg-purple-100')) return '#f3e8ff';
  if (lower.includes('bg-purple-200')) return '#e9d5ff';
  if (lower.includes('bg-blue-100')) return '#dbeafe';
  if (lower.includes('bg-blue-200')) return '#bfdbfe';
  if (lower.includes('bg-yellow-100')) return '#fef9c3';
  if (lower.includes('bg-yellow-200')) return '#fef08a';
  if (lower.includes('bg-amber-100')) return '#fef3c7';
  if (lower.includes('bg-amber-200')) return '#fde68a';
  if (lower.includes('bg-teal-100')) return '#ccfbf1';
  if (lower.includes('bg-teal-200')) return '#99f6e4';
  if (lower.includes('bg-indigo-100')) return '#e0e7ff';
  if (lower.includes('bg-indigo-200')) return '#c7d2fe';
  if (lower.includes('bg-violet-100')) return '#ede9fe';
  if (lower.includes('bg-violet-200')) return '#ddd6fe';
  if (lower.includes('bg-pink-100')) return '#fce7f3';
  if (lower.includes('bg-pink-200')) return '#fbcfe8';
  if (lower.includes('bg-rose-100')) return '#ffe4e6';
  if (lower.includes('bg-rose-200')) return '#fecdd3';

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

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDarkenedHexForText = (hex: string) => {
  const normalized = normalizeHex(hex);
  let r = parseInt(normalized.slice(1, 3), 16);
  let g = parseInt(normalized.slice(3, 5), 16);
  let b = parseInt(normalized.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  if (yiq > 170) {
    r = Math.max(0, Math.floor(r * 0.5));
    g = Math.max(0, Math.floor(g * 0.5));
    b = Math.max(0, Math.floor(b * 0.5));
  }
  const toHexStr = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHexStr(r)}${toHexStr(g)}${toHexStr(b)}`;
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

const LeadCard = ({ 
  lead, 
  handleDragStart, 
  handleDragEnd, 
  setSelectedLead, 
  showStageInFooter = false,
  onOwnerClick
}: { 
  lead: any; 
  handleDragStart: (e: React.DragEvent, id: string) => void; 
  handleDragEnd: () => void; 
  setSelectedLead: (lead: any) => void; 
  showStageInFooter?: boolean; 
  onOwnerClick?: (e: React.MouseEvent<HTMLElement>, leadId: string) => void;
}) => {
  const unreadCount = lead.whatsappMessages?.filter(
    (m: any) => m.direction === 'INBOUND' && m.status !== 'READ'
  ).length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, lead.id)}
      onDragEnd={handleDragEnd}
      onClick={() => setSelectedLead(lead)}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer group cursor-grab active:cursor-grabbing text-left flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-[#1B4D3E]/8 rounded-lg shrink-0">
            <Building size={13} className="text-[#1B4D3E]" />
          </div>
          <span className="text-xs font-black text-slate-700 tracking-wide uppercase truncate max-w-[150px]">
            {lead.segmento || 'SEM SEGMENTO'}
          </span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-[#25D366] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 animate-pulse shadow-sm shadow-[#25D366]/30">
            <MessageSquare size={8} fill="white" /> {unreadCount}
          </span>
        )}
      </div>

      <p className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{lead.nomeFantasia}</p>
      
      <div className="flex flex-col gap-1.5">
        {(lead.telefone || lead.email) && (
          <p className="text-[10px] text-slate-400 font-medium truncate" title={`${lead.telefone || ''} | ${lead.email || ''}`}>
            {lead.telefone && <span>📞 {lead.telefone}</span>}
            {lead.telefone && lead.email && <span className="mx-1">&bull;</span>}
            {lead.email && <span>✉️ {lead.email}</span>}
          </p>
        )}

        {lead.endereco && (
          <div className="flex items-center gap-1.5">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.endereco)}`} 
              target="_blank" 
              rel="noreferrer" 
              onClick={e => e.stopPropagation()} 
              className="flex-1 bg-blue-50/60 hover:bg-blue-100/80 text-blue-600 text-[8.5px] font-black py-0.5 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-blue-100/50"
              title="Abrir no Google Maps"
            >
              <MapPin size={8} /> Maps
            </a>
            <a 
              href={`https://waze.com/ul?q=${encodeURIComponent(lead.endereco)}`} 
              target="_blank" 
              rel="noreferrer" 
              onClick={e => e.stopPropagation()} 
              className="flex-1 bg-cyan-50/60 hover:bg-cyan-100/80 text-cyan-600 text-[8.5px] font-black py-0.5 px-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-cyan-100/50"
              title="Abrir no Waze"
            >
              <Navigation size={8} /> Waze
            </a>
          </div>
        )}

        {lead.activities && lead.activities.length > 0 && (
          <div className="bg-amber-50/40 border border-amber-100/60 p-1.5 rounded-lg text-[9px] flex items-center gap-1 text-amber-700">
            <CalendarDays size={10} className="text-amber-500 shrink-0" />
            <span className="font-bold shrink-0">{lead.activities[0].tipo}:</span>
            <span className="truncate flex-1 font-medium">{lead.activities[0].titulo}</span>
            <span className="text-[8px] text-amber-600 font-bold bg-amber-100/70 px-1 py-0.5 rounded shrink-0">
              {safeDate(lead.activities[0].dataInicio)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-black text-[#1B4D3E]">{fmt(lead.valorEst || 0)}</span>
        {!showStageInFooter && (
          <span 
            style={getHighlightedStageColorClass(lead.stage?.color).style} 
            className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
          >
            {lead.stage?.nome || 'DESCOBERTA'}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div 
          id={`lead-avatar-inline-owner-${lead.id}`}
          onClick={(e) => {
            if (onOwnerClick) {
              e.stopPropagation();
              onOwnerClick(e, lead.id);
            }
          }}
          className="flex items-center gap-1.5 hover:bg-slate-50 p-1 rounded-lg transition-colors cursor-pointer"
        >
          {lead.assignedTo?.avatarUrl ? (
            <img 
              src={lead.assignedTo.avatarUrl} 
              alt={lead.assignedTo.nome} 
              className="w-5 h-5 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
              {(lead.assignedTo?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
          )}
          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[100px]" title={lead.assignedTo?.nome || 'Sistema'}>
            {lead.assignedTo?.nome || 'Sistema'}
          </span>
        </div>
        
        {showStageInFooter ? (
          <span 
            style={getHighlightedStageColorClass(lead.stage?.color).style} 
            className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
          >
            {lead.stage?.nome || 'DESCOBERTA'}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">📅 {safeDate(lead.updatedAt)}</span>
        )}
      </div>
    </div>
  );
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

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (val: string) => void | Promise<void>;
    onCancel?: () => void;
    type: 'prompt' | 'alert' | 'confirm';
    message?: string;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    type: 'prompt',
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  };
  
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
  
  // User select popover anchor elements and open states
  const [ownerAnchorEl, setOwnerAnchorEl] = useState<HTMLElement | null>(null);
  const [isOwnerPopoverOpen, setIsOwnerPopoverOpen] = useState(false);
  const [participantAnchorEl, setParticipantAnchorEl] = useState<HTMLElement | null>(null);
  const [isParticipantPopoverOpen, setIsParticipantPopoverOpen] = useState(false);
  const [observerAnchorEl, setObserverAnchorEl] = useState<HTMLElement | null>(null);
  const [isObserverPopoverOpen, setIsObserverPopoverOpen] = useState(false);
  const [inlineOwnerAnchorEl, setInlineOwnerAnchorEl] = useState<HTMLElement | null>(null);
  const [inlineOwnerLeadId, setInlineOwnerLeadId] = useState<string | null>(null);

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

  type ViewMode = 'lista' | 'kanban-status' | 'kanban-vendedor' | 'kanban-segmento';
  const [viewMode, setViewMode] = useState<ViewMode>('kanban-status');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        router.push('/leads/mobile');
        return;
      }
    }

    const saved = localStorage.getItem('orse_leads_view_mode');
    if (saved) setViewMode(saved as any);

    if (typeof window !== 'undefined') {
      const colors: Record<string, string> = {};
      const segColors: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (key.startsWith('kanban-vendedor-color-')) {
            const seller = key.replace('kanban-vendedor-color-', '');
            colors[seller] = localStorage.getItem(key) || '#3b82f6';
          } else if (key.startsWith('kanban-segmento-color-')) {
            const seg = key.replace('kanban-segmento-color-', '');
            segColors[seg] = localStorage.getItem(key) || '#3b82f6';
          }
        }
      }
      setVendedorColors(colors);
      setSegmentoColors(segColors);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_leads_view_mode', mode);
  };

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [editingVendedorId, setEditingVendedorId] = useState<string | null>(null);
  const [vendedorColors, setVendedorColors] = useState<Record<string, string>>({});
  const [editingSegmentoId, setEditingSegmentoId] = useState<string | null>(null);
  const [segmentoColors, setSegmentoColors] = useState<Record<string, string>>({});
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

  const handleCreateStage = (insertAfterId?: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Nova Etapa',
      placeholder: 'Nome da nova etapa (ex: Em Negociação)',
      type: 'prompt',
      onConfirm: async (nome) => {
        if (!nome.trim()) return;
        const res = await createLeadStage(nome.trim(), insertAfterId);
        if (res.success) {
          fetchData();
        } else {
          showCustomAlert('Erro ao Criar Etapa', res.error || 'Erro desconhecido');
        }
      }
    });
  };
  const handleCreateSegmento = () => {
    setCustomModal({
      isOpen: true,
      title: 'Novo Segmento',
      placeholder: 'Nome do novo segmento (ex: INDUSTRIAS)',
      type: 'prompt',
      onConfirm: async (nome) => {
        if (!nome.trim()) return;
        const res = await createSegmento(nome.trim());
        if (res.success) {
          fetchData();
        } else {
          showCustomAlert('Erro ao Criar Segmento', res.error || 'Erro desconhecido');
        }
      }
    });
  };

  const handleDeleteStage = (id: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Excluir Etapa',
      message: 'Deseja realmente excluir esta etapa? Atenção: ela precisa estar vazia para ser removida.',
      type: 'confirm',
      onConfirm: async () => {
        const res = await deleteLeadStage(id);
        if (res.success) {
          fetchData();
        } else {
          showCustomAlert('Erro ao Excluir Etapa', res.error || 'Erro desconhecido');
        }
      }
    });
  };

  const handleSaveStageName = async (id: string) => {
    if (editingStageName.trim() === '') return;
    const res = await updateLeadStageName(id, editingStageName.trim());
    if (res.success) {
      fetchData();
      setEditingStageId(null);
    } else {
      showCustomAlert('Erro ao Renomear Etapa', res.error || 'Erro desconhecido');
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
    fetchData(true);
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

  const handleAddObserver = async (userId: string) => {
    if (!selectedLead || !userId) return;
    const res = await addLeadShare(selectedLead.id, userId, 'OBSERVADOR');
    if (res.success) {
      fetchData();
      const updatedLeads = await getLeads({});
      if (updatedLeads.success) {
        const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLead.id);
        if (upLead) setSelectedLead(upLead);
      }
    } else {
      alert("Erro ao adicionar observador: " + res.error);
    }
  };

  const handleToggleParticipant = async (userId: string) => {
    if (!selectedLead) return;
    const isSelected = selectedLead.shares?.some((s: any) => s.user?.id === userId && s.role !== 'OBSERVADOR');
    if (isSelected) {
      await handleRemoveParticipant(userId);
    } else {
      await handleAddParticipant(userId);
    }
  };

  const handleToggleObserver = async (userId: string) => {
    if (!selectedLead) return;
    const isSelected = selectedLead.shares?.some((s: any) => s.user?.id === userId && s.role === 'OBSERVADOR');
    if (isSelected) {
      await handleRemoveParticipant(userId);
    } else {
      await handleAddObserver(userId);
    }
  };

  const handleInlineOwnerSelect = async (userId: string) => {
    if (!inlineOwnerLeadId) return;
    const res = await changeLeadOwner(inlineOwnerLeadId, userId);
    if (res.success) {
      fetchData();
      if (selectedLeadRef.current && selectedLeadRef.current.id === inlineOwnerLeadId) {
        const updatedLeads = await getLeads({});
        if (updatedLeads.success) {
          const upLead = updatedLeads.leads.find((l:any) => l.id === selectedLeadRef.current.id);
          if (upLead) setSelectedLead(upLead);
        }
      }
    } else {
      alert("Erro ao alterar responsável: " + res.error);
    }
    setInlineOwnerLeadId(null);
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

  const handleDropVendedor = async (e: React.DragEvent, userId: string) => {
    e.preventDefault();
    setIsDragging(false);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const assignedToId = userId === 'unassigned' ? null : userId;
    const targetUser = filterUsers.find(u => u.id === assignedToId);

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { 
      ...l, 
      assignedToId: assignedToId, 
      assignedTo: targetUser || null 
    } : l));

    await changeLeadOwner(id, assignedToId as any);
    fetchData(true);
  };

  const handleDropSegmento = async (e: React.DragEvent, segmentName: string) => {
    e.preventDefault();
    setIsDragging(false);
    const id = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('leadId');
    if (!id) return;

    const newSegment = segmentName === 'unassigned' ? '' : segmentName;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { 
      ...l, 
      segmento: newSegment || null 
    } : l));

    await updateLeadData(id, { segmento: newSegment });
    fetchData(true);
  };

  const PRESET_VENDEDOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#64748b'];

  const PRESET_COLORS = [
    // Row 1: Soft Pastels
    '#E0F2FE', '#E0F2F1', '#D1FAE5', '#ECFCCB', '#FEF9C3', '#FFEDD5', '#FFE4E6', '#FCE7F3', '#F3E8FF', '#F1F5F9',
    // Row 2: Standard Vibrant
    '#38BDF8', '#0D9488', '#10B981', '#84CC16', '#FACC15', '#FB923C', '#F43F5E', '#EC4899', '#8B5CF6', '#64748B',
    // Row 3: Bright Neon / Vivid
    '#0EA5E9', '#00B4D8', '#00F5D4', '#39FF14', '#FFD000', '#FF9F1C', '#FF007F', '#D000FF', '#7000FF', '#48CAE4',
    // Row 4: Deep / Dark
    '#0369A1', '#0B6623', '#065F46', '#3F6212', '#A16207', '#C2410C', '#B91C1C', '#9D174D', '#581C87', '#334155',
  ];

  const getSegmentColor = (label: string, defaultColor: string) => {
    const key = Object.keys(segmentoColors).find(k => k.toLowerCase().trim() === label.toLowerCase().trim());
    return key ? segmentoColors[key] : defaultColor;
  };

  const getVendedorColor = (label: string, defaultColor: string) => {
    const key = Object.keys(vendedorColors).find(k => k.toLowerCase().trim() === label.toLowerCase().trim());
    return key ? vendedorColors[key] : defaultColor;
  };

  const kanbanVendedorCols = React.useMemo(() => {
    const cols: { id: string; label: string; avatarUrl?: string | null; cards: any[]; total: number }[] = [];
    
    const userIds = filterUsers.map(u => u.id);
    // First, column for "Sem Vendedor / Não Atribuído"
    const unassigned = filteredLeads.filter(l => !l.assignedToId || !userIds.includes(l.assignedToId));
    cols.push({
      id: 'unassigned',
      label: 'Não Atribuído',
      avatarUrl: null,
      cards: unassigned,
      total: unassigned.reduce((acc, l) => acc + (l.valorEst || 0), 0)
    });

    // Columns for each user in filterUsers
    filterUsers.forEach(u => {
      const userLeads = filteredLeads.filter(l => l.assignedToId === u.id);
      cols.push({
        id: u.id,
        label: u.nome || 'Vendedor',
        avatarUrl: u.avatarUrl,
        cards: userLeads,
        total: userLeads.reduce((acc, l) => acc + (l.valorEst || 0), 0)
      });
    });

    return cols;
  }, [filteredLeads, filterUsers]);

  const kanbanSegmentoCols = React.useMemo(() => {
    const cols: { id: string; label: string; cards: any[]; total: number }[] = [];
    
    const segmentNamesNormalized = segmentos.map(seg => normalizeText(seg.nome || seg));

    // First, column for "Sem Segmento"
    const unassigned = filteredLeads.filter(l => {
      if (!l.segmento) return true;
      const normalizedSeg = normalizeText(l.segmento);
      return !segmentNamesNormalized.includes(normalizedSeg);
    });

    cols.push({
      id: 'unassigned',
      label: 'Sem Segmento',
      cards: unassigned,
      total: unassigned.reduce((acc, l) => acc + (l.valorEst || 0), 0)
    });

    // Columns for each segment in segmentos
    segmentos.forEach(seg => {
      const segName = seg.nome || seg;
      const normalizedSegName = normalizeText(segName);
      const segLeads = filteredLeads.filter(l => l.segmento && normalizeText(l.segmento) === normalizedSegName);
      cols.push({
        id: seg.id || segName,
        label: segName,
        cards: segLeads,
        total: segLeads.reduce((acc, l) => acc + (l.valorEst || 0), 0)
      });
    });

    return cols;
  }, [filteredLeads, segmentos]);

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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <div className="p-4 md:py-6 md:pl-4 md:pr-1 bg-white border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800">Pipeline de Leads</h1>
          <p className="text-xs md:text-sm text-slate-500">Gerencie seus leads e prospectos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end bell-header-spacing">
          {/* Alternador de visualização */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('lista')}
              title="Visualização em Lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                viewMode === 'lista'
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-amber-500 hover:text-amber-600'
              }`}
            >
              <LayoutList size={14} /> Lista
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('kanban-status')}
              title="Kanban por Status"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                viewMode === 'kanban-status'
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-amber-500 hover:text-amber-600'
              }`}
            >
              <LayoutGrid size={14} /> Por Etapa
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('kanban-vendedor')}
              title="Kanban por Vendedor"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                viewMode === 'kanban-vendedor'
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-amber-500 hover:text-amber-600'
              }`}
            >
              <Users size={14} /> Por Vendedor
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('kanban-segmento')}
              title="Kanban por Segmento"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                viewMode === 'kanban-segmento'
                  ? 'bg-[#1B4D3E] text-white shadow-sm'
                  : 'text-amber-500 hover:text-amber-600'
              }`}
            >
              <Building size={14} /> Por Segmento
            </button>
          </div>
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
            onClick={() => router.push('/leads/mobile')}
            className="flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs md:text-sm rounded-xl font-bold hover:bg-slate-50 transition-all w-full sm:w-auto shadow-sm cursor-pointer"
          >
            <Smartphone size={16} className="text-slate-500" /> Versão Mobile
          </button>

          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>

          <button 
            type="button"
            onClick={() => setShowNewLead(true)}
            className="flex items-center justify-center gap-2 bg-[#1B4D3E] text-white px-4 py-2 text-xs md:text-sm rounded-xl font-bold hover:bg-[#13382d] transition-all w-full sm:w-auto cursor-pointer"
          >
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-slate-50">
        {showMetrics && <PipelineMetrics leads={filteredLeads} stages={stages} />}
        {viewMode === 'kanban-status' && (
          <div className="py-6 pl-2 pr-1 bg-slate-50 min-w-max">
            <div className="flex gap-[3px]">
            {stages.map((stage, idx) => {
              const stageLeads = filteredLeads.filter(l => l.stageId === stage.id);
              const totalValorEst = stageLeads.reduce((acc, lead) => acc + (lead.valorEst || 0), 0);
              const isFirst = idx === 0;
              const isLast = idx === stages.length - 1;
              const resolvedHex = resolveColorToHex(stage.color);
              const contrast = getContrastYIQ(resolvedHex);
              const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
              const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
              const textHex = getDarkenedHexForText(resolvedHex);

              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col flex-shrink-0"
                  style={{ width: '274px' }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (stages.length - idx) }}>
                    <div className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto">
                      <svg 
                        className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                        viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                        preserveAspectRatio="none"
                        style={{ color: resolvedHex }}
                      >
                        <path 
                          d={isFirst 
                            ? "M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z" 
                            : isLast 
                              ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                              : "M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                          }
                          fill="currentColor" 
                          stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
                          strokeWidth="1"
                        />
                      </svg>
                      <div 
                        className={`relative z-10 flex items-center justify-between h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                        style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                      >
                        {/* Lado esquerdo: título e subtítulo */}
                        <div className="flex flex-col min-w-0 justify-center">
                          <h3 className="font-black uppercase tracking-wider text-sm truncate max-w-[160px] leading-none">
                            {stage.nome}
                          </h3>
                          {/* Subtítulo integrado com o totalizador de volume e leads */}
                          <span className="text-xs font-bold mt-1 opacity-90 truncate select-none leading-none">
                            {fmt(totalValorEst)} • {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
                          </span>
                        </div>

                        {/* Lado direito: botões centralizados verticalmente */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStageName(stage.nome);
                              setEditingStageId(stage.id);
                            }}
                            className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                            style={{ color: 'inherit' }}
                            title="Editar Etapa"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateStage(stage.id);
                            }}
                            className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                            style={{ color: 'inherit' }}
                            title="Criar Nova Etapa"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                        {editingStageId === stage.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30 cursor-default" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStageId(null);
                              }}
                            />
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Editar Etapa CRM
                                </span>
                                <button 
                                  onClick={() => setEditingStageId(null)}
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nome da Etapa</label>
                                <input
                                  type="text"
                                  value={editingStageName}
                                  onChange={(e) => setEditingStageName(e.target.value)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-slate-300 outline-none w-full bg-slate-50 font-medium"
                                  placeholder="Nome da etapa"
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      if (editingStageName.trim() && editingStageName.trim().toUpperCase() !== stage.nome.toUpperCase()) {
                                        const res = await updateLeadStageName(stage.id, editingStageName.trim());
                                        if (res.success) {
                                          setStages(prev => prev.map(s => s.id === stage.id ? { ...s, nome: editingStageName.trim() } : s));
                                        } else {
                                          alert(res.error || 'Erro ao renomear');
                                        }
                                      }
                                      setEditingStageId(null);
                                    }
                                  }}
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                                <div className="grid grid-cols-10 gap-1 mt-0.5">
                                  {PRESET_COLORS.map(c => {
                                    const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                                    return (
                                      <button
                                        key={c}
                                        onClick={async () => {
                                          const res = await updateLeadStageColor(stage.id, c);
                                          if (res.success) {
                                            setStages(prev => prev.map(s => s.id === stage.id ? { ...s, color: c } : s));
                                          } else {
                                            alert(res.error || 'Erro ao alterar cor');
                                          }
                                        }}
                                        className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                                        style={{
                                          backgroundColor: c,
                                          borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)',
                                          borderWidth: isSelected ? '2px' : '1px'
                                        }}
                                        title={c}
                                        type="button"
                                      >
                                        {isSelected && (
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} 
                                          />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                                  <input 
                                    type="color" 
                                    value={resolvedHex}
                                    onChange={async (e) => {
                                      const newColor = e.target.value;
                                      const res = await updateLeadStageColor(stage.id, newColor);
                                      if (res.success) {
                                        setStages(prev => prev.map(s => s.id === stage.id ? { ...s, color: newColor } : s));
                                      } else {
                                        alert(res.error || 'Erro ao alterar cor');
                                      }
                                    }}
                                    className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                                </label>
                              </div>

                              <div className="flex gap-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    setEditingStageId(null);
                                    handleCreateStage(stage.id);
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                                  type="button"
                                >
                                  <Plus size={13} />
                                  Nova Etapa
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStageId(null);
                                    handleDeleteStage(stage.id);
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors text-center flex items-center justify-center gap-1 cursor-pointer"
                                  type="button"
                                >
                                  <Trash2 size={13} />
                                  Excluir
                                </button>
                              </div>

                              <button
                                onClick={async () => {
                                  if (editingStageName.trim() && editingStageName.trim().toUpperCase() !== stage.nome.toUpperCase()) {
                                    const res = await updateLeadStageName(stage.id, editingStageName.trim());
                                    if (res.success) {
                                      setStages(prev => prev.map(s => s.id === stage.id ? { ...s, nome: editingStageName.trim() } : s));
                                    } else {
                                      alert(res.error || 'Erro ao renomear');
                                    }
                                  }
                                  setEditingStageId(null);
                                }}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer mt-1"
                                type="button"
                              >
                                Concluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                      <div
                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                        style={{
                          width: '274px',
                          minWidth: '274px',
                          maxWidth: '274px',
                          marginLeft: '0px',
                          backgroundColor: bgRgba,
                          borderColor: borderRgba,
                          borderWidth: '0 1px 1px 1px',
                          borderStyle: 'solid',
                          minHeight: 'calc(100vh - 180px)',
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          {stageLeads.length === 0 ? (
                            <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem leads</p>
                            </div>
                          ) : (
                            stageLeads.map(lead => (
                              <LeadCard
                                key={lead.id}
                                lead={lead}
                                handleDragStart={handleDragStart}
                                handleDragEnd={handleDragEnd}
                                setSelectedLead={setSelectedLead}
                                onOwnerClick={(e, leadId) => {
                                  setInlineOwnerAnchorEl(e.currentTarget);
                                  setInlineOwnerLeadId(leadId);
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
          )}

        {viewMode === 'kanban-vendedor' && (
          <div className="py-6 pl-2 pr-1 bg-slate-50 min-w-max">
            <div className="flex gap-[3px]">
              {kanbanVendedorCols.map((col, idx) => {
                const colLeads = col.cards;
                const isFirst = idx === 0;
                const isLast = idx === kanbanVendedorCols.length - 1;
                const defaultColColor = col.id === 'unassigned' ? '#64748b' : PRESET_VENDEDOR_COLORS[idx % PRESET_VENDEDOR_COLORS.length];
                const colColor = getVendedorColor(col.label, defaultColColor);
                const resolvedHex = resolveColorToHex(colColor);
                const contrast = getContrastYIQ(resolvedHex);
                const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
                const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
                const textHex = getDarkenedHexForText(resolvedHex);

                return (
                  <div 
                    key={col.id} 
                    className="flex flex-col flex-shrink-0"
                    style={{ width: '274px' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropVendedor(e, col.id)}
                  >
                    <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (kanbanVendedorCols.length - idx) }}>
                      <div className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto">
                        <svg 
                          className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                          viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                          preserveAspectRatio="none"
                          style={{ color: resolvedHex }}
                        >
                          <path 
                            d={isFirst 
                              ? "M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z" 
                              : isLast 
                                ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                                : "M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                            }
                            fill="currentColor" 
                            stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
                            strokeWidth="1"
                          />
                        </svg>
                        <div 
                          className={`relative z-10 flex flex-col justify-center h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                          style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                        >
                          <div className="flex items-center justify-between w-full min-w-0 h-6">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {col.avatarUrl ? (
                                <img 
                                  src={col.avatarUrl} 
                                  alt={col.label} 
                                  className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                                />
                              ) : col.id !== 'unassigned' ? (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-black text-[8px] uppercase border border-black/10 shrink-0" style={{ color: 'inherit' }}>
                                  {col.label.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                              ) : (
                                <User size={10} className="shrink-0" style={{ color: 'inherit' }} />
                              )}
                              <h3 className="font-black uppercase tracking-wider text-sm truncate leading-none">
                                {col.label}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {col.id !== 'unassigned' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingVendedorId(col.id);
                                  }}
                                  className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                                  style={{ color: 'inherit' }}
                                  title="Editar Cor"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Subtítulo integrado com o totalizador de volume e leads */}
                          <span className="text-xs font-bold mt-0.5 opacity-90 truncate select-none">
                            {fmt(col.total)} • {colLeads.length} {colLeads.length === 1 ? 'lead' : 'leads'}
                          </span>
                        </div>

                        {editingVendedorId === col.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30 cursor-default" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVendedorId(null);
                              }}
                            />
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Editar Coluna
                                </span>
                                <button 
                                  onClick={() => setEditingVendedorId(null)}
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                                <div className="grid grid-cols-10 gap-1 mt-0.5">
                                  {PRESET_COLORS.map(c => {
                                    const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                                    return (
                                      <button
                                        key={c}
                                        onClick={() => {
                                          localStorage.setItem(`kanban-vendedor-color-${col.label}`, c);
                                          setVendedorColors(prev => ({ ...prev, [col.label]: c }));
                                        }}
                                        className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                                        style={{
                                          backgroundColor: c,
                                          borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)',
                                          borderWidth: isSelected ? '2px' : '1px'
                                        }}
                                        title={c}
                                        type="button"
                                      >
                                        {isSelected && (
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} 
                                          />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                                  <input 
                                    type="color" 
                                    value={resolvedHex}
                                    onChange={(e) => {
                                      const newColor = e.target.value;
                                      localStorage.setItem(`kanban-vendedor-color-${col.label}`, newColor);
                                      setVendedorColors(prev => ({ ...prev, [col.label]: newColor }));
                                    }}
                                    className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                                </label>
                              </div>

                              <button
                                onClick={() => setEditingVendedorId(null)}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer mt-1"
                                type="button"
                              >
                                Concluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                      <div
                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropVendedor(e, col.id)}
                        style={{
                          width: '274px',
                          minWidth: '274px',
                          maxWidth: '274px',
                          marginLeft: '0px',
                          backgroundColor: bgRgba,
                          borderColor: borderRgba,
                          borderWidth: '0 1px 1px 1px',
                          borderStyle: 'solid',
                          minHeight: 'calc(100vh - 180px)',
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          {colLeads.map(lead => (
                            <LeadCard
                              key={lead.id}
                              lead={lead}
                              handleDragStart={handleDragStart}
                              handleDragEnd={handleDragEnd}
                              setSelectedLead={setSelectedLead}
                              showStageInFooter={true}
                              onOwnerClick={(e, leadId) => {
                                setInlineOwnerAnchorEl(e.currentTarget);
                                setInlineOwnerLeadId(leadId);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
          )}

        {viewMode === 'kanban-segmento' && (
          <div className="py-6 pl-2 pr-1 bg-slate-50 min-w-max">
            <div className="flex gap-[3px]">
            {kanbanSegmentoCols.map((col, idx) => {
              const colLeads = col.cards;
              const isFirst = idx === 0;
              const isLast = idx === kanbanSegmentoCols.length - 1;
              const defaultColColor = col.id === 'unassigned' ? '#64748b' : PRESET_VENDEDOR_COLORS[idx % PRESET_VENDEDOR_COLORS.length];
              const colColor = getSegmentColor(col.label, defaultColColor);
              const resolvedHex = resolveColorToHex(colColor);
              const contrast = getContrastYIQ(resolvedHex);
              const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
              const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);
              const textHex = getDarkenedHexForText(resolvedHex);

              return (
                <div 
                  key={col.id} 
                  className="flex flex-col flex-shrink-0"
                  style={{ width: '274px' }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropSegmento(e, col.id)}
                >
                  <div className="sticky top-0 select-none duration-200 bg-slate-50" style={{ zIndex: 20 + (kanbanSegmentoCols.length - idx) }}>
                    <div className="relative h-[52px] shrink-0 z-10 w-full group/header pointer-events-auto">
                        <svg 
                          className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                          viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                          preserveAspectRatio="none"
                          style={{ color: resolvedHex }}
                        >
                          <path 
                            d={isFirst 
                              ? "M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z" 
                              : isLast 
                                ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                                : "M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                            }
                            fill="currentColor" 
                            stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
                            strokeWidth="1"
                          />
                        </svg>
                        <div 
                          className={`relative z-10 flex items-center justify-between h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                          style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                        >
                          {/* Lado esquerdo: título e subtítulo */}
                          <div className="flex flex-col min-w-0 justify-center">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building size={12} className="shrink-0" style={{ color: 'inherit' }} />
                              <h3 className="font-black uppercase tracking-wider text-sm truncate leading-none">
                                {col.label}
                              </h3>
                            </div>
                            <span className="text-xs font-bold mt-1 opacity-90 truncate select-none leading-none">
                              {fmt(col.total)} • {colLeads.length} {colLeads.length === 1 ? 'lead' : 'leads'}
                            </span>
                          </div>

                          {/* Lado direito: botões centralizados verticalmente */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateSegmento();
                              }}
                              className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                              style={{ color: 'inherit' }}
                              title="Criar Novo Segmento"
                            >
                              <Plus size={14} />
                            </button>
                            {col.id !== 'unassigned' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSegmentoId(col.id);
                                }}
                                className="p-1 rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-pointer hover:bg-black/5"
                                style={{ color: 'inherit' }}
                                title="Editar Cor"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {editingSegmentoId === col.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30 cursor-default" 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSegmentoId(null);
                              }}
                            />
                            <div 
                              className="absolute left-1/2 -translate-x-1/2 top-12 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-[260px] text-slate-800 flex flex-col gap-3.5 cursor-default font-sans text-left normal-case tracking-normal"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Editar Coluna
                                </span>
                                <button 
                                  onClick={() => setEditingSegmentoId(null)}
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selecione a Cor</label>
                                <div className="grid grid-cols-10 gap-1 mt-0.5">
                                  {PRESET_COLORS.map(c => {
                                    const isSelected = resolvedHex.toLowerCase() === c.toLowerCase();
                                    return (
                                      <button
                                        key={c}
                                        onClick={() => {
                                          localStorage.setItem(`kanban-segmento-color-${col.label}`, c);
                                          setSegmentoColors(prev => ({ ...prev, [col.label]: c }));
                                        }}
                                        className="w-4 h-4 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                                        style={{
                                          backgroundColor: c,
                                          borderColor: isSelected ? '#0f172a' : 'rgba(0,0,0,0.1)',
                                          borderWidth: isSelected ? '2px' : '1px'
                                        }}
                                        title={c}
                                        type="button"
                                      >
                                        {isSelected && (
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: getContrastYIQ(c) === 'white' ? '#fff' : '#000' }} 
                                          />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors w-full">
                                  <input 
                                    type="color" 
                                    value={resolvedHex}
                                    onChange={(e) => {
                                      const newColor = e.target.value;
                                      localStorage.setItem(`kanban-segmento-color-${col.label}`, newColor);
                                      setSegmentoColors(prev => ({ ...prev, [col.label]: newColor }));
                                    }}
                                    className="w-8 h-5 border-0 p-0 cursor-pointer rounded bg-transparent"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cor personalizada</span>
                                </label>
                              </div>

                              <button
                                onClick={() => setEditingSegmentoId(null)}
                                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors text-center cursor-pointer mt-1"
                                type="button"
                              >
                                Concluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                      <div
                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropSegmento(e, col.id)}
                        style={{
                          width: '274px',
                          minWidth: '274px',
                          maxWidth: '274px',
                          marginLeft: '0px',
                          backgroundColor: bgRgba,
                          borderColor: borderRgba,
                          borderWidth: '0 1px 1px 1px',
                          borderStyle: 'solid',
                          minHeight: 'calc(100vh - 180px)',
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          {colLeads.length === 0 ? (
                            <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem leads</p>
                            </div>
                          ) : (
                            colLeads.map(lead => (
                              <LeadCard
                                key={lead.id}
                                lead={lead}
                                handleDragStart={handleDragStart}
                                handleDragEnd={handleDragEnd}
                                setSelectedLead={setSelectedLead}
                                showStageInFooter={true}
                                onOwnerClick={(e, leadId) => {
                                  setInlineOwnerAnchorEl(e.currentTarget);
                                  setInlineOwnerLeadId(leadId);
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
          )}

        {viewMode === 'lista' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto w-full mb-6">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3.5 py-3 lg:px-5">Lead/Empresa</th>
                  <th className="px-3.5 py-3 lg:px-5">Responsável</th>
                  <th className="px-3.5 py-3 lg:px-5 text-right">Valor Est.</th>
                  <th className="px-3.5 py-3 lg:px-5 text-center">Etapa</th>
                  <th className="px-3.5 py-3 lg:px-5 text-center w-[140px] min-w-[140px]">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum lead encontrado.</td></tr>
                ) : filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-3.5 py-3.5 lg:px-5 font-semibold text-slate-700 max-w-[200px] truncate" title={lead.nomeFantasia}>{lead.nomeFantasia}</td>
                    <td className="px-3.5 py-3.5 lg:px-5">
                      <div className="flex items-center gap-1.5">
                        {lead.assignedTo?.avatarUrl ? (
                          <img 
                            src={lead.assignedTo.avatarUrl} 
                            alt={lead.assignedTo.nome} 
                            className="w-5 h-5 rounded-full object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200 shrink-0">
                            {(lead.assignedTo?.nome || 'LD').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                        )}
                        <span className="text-slate-600 font-medium max-w-[150px] truncate" title={lead.assignedTo?.nome || 'Não atribuído'}>{lead.assignedTo?.nome || 'Não atribuído'}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 lg:px-5 font-bold text-[#1B4D3E] text-right">{fmt(lead.valorEst || 0)}</td>
                    <td className="px-3.5 py-3.5 lg:px-5 text-center">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shrink-0"
                        style={getLeadTotalizerStyle(lead.stage?.color)}
                      >
                        {lead.stage?.nome || 'Sem Etapa'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 lg:px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedChatLeadId(lead.id);
                            setShowChatCenter(true);
                          }}
                          className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 bg-emerald-50 rounded"
                          title="Chat WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="text-[#1B4D3E] hover:text-[#13382d] transition-colors p-1 bg-slate-100 rounded"
                          title="Ver Detalhes"
                        >
                          <UserCog size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("Tem certeza que deseja excluir este lead?")) {
                              const res = await deleteLead(lead.id);
                              if (res.success) {
                                setLeads(prev => prev.filter(l => l.id !== lead.id));
                              } else {
                                alert(res.error || "Erro ao excluir lead");
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-600 transition-colors p-1 bg-red-50 rounded"
                          title="Excluir Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  'bg-emerald-100': 'bg-green-500',
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
                  <div className="pt-6 border-t border-slate-100/60 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsável</label>
                      <div 
                        id="lead-drawer-owner-anchor"
                        onClick={(e) => {
                          setOwnerAnchorEl(e.currentTarget);
                          setIsOwnerPopoverOpen(true);
                        }}
                        className="flex items-center gap-2.5 p-2 border border-slate-200/80 rounded-xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-150 group"
                      >
                        {(() => {
                          const assignedUser = filterUsers.find(u => u.id === selectedLead.assignedToId);
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
                            {filterUsers.find(u => u.id === selectedLead.assignedToId)?.nome || 'Sem responsável'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">Clique para alterar</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Participantes</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedLead.shares?.filter((s: any) => s.role !== 'OBSERVADOR').map((s: any) => {
                          const u = s.user;
                          if (!u) return null;
                          const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                          return (
                            <div key={s.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 pl-1.5 pr-1 py-1 rounded-lg">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.nome} className="w-5 h-5 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 uppercase">
                                  {initials}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-slate-700 max-w-[100px] truncate">{u.nome}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveParticipant(u.id);
                                }} 
                                className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                        <button
                          id="lead-drawer-participant-anchor"
                          onClick={(e) => {
                            setParticipantAnchorEl(e.currentTarget);
                            setIsParticipantPopoverOpen(true);
                          }}
                          className="text-[#1B4D3E] hover:text-[#1B4D3E]/80 text-[11px] font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#1B4D3E]/5 transition-all duration-150"
                        >
                          + Inserir participante
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observadores</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedLead.shares?.filter((s: any) => s.role === 'OBSERVADOR').map((s: any) => {
                          const u = s.user;
                          if (!u) return null;
                          const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                          return (
                            <div key={s.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 pl-1.5 pr-1 py-1 rounded-lg">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt={u.nome} className="w-5 h-5 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 uppercase">
                                  {initials}
                                </div>
                              )}
                              <span className="text-[11px] font-bold text-slate-700 max-w-[100px] truncate">{u.nome}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveParticipant(u.id);
                                }} 
                                className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                        <button
                          id="lead-drawer-observer-anchor"
                          onClick={(e) => {
                            setObserverAnchorEl(e.currentTarget);
                            setIsObserverPopoverOpen(true);
                          }}
                          className="text-[#1B4D3E] hover:text-[#1B4D3E]/80 text-[11px] font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#1B4D3E]/5 transition-all duration-150"
                        >
                          + Colocar observador
                        </button>
                      </div>
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

            {/* Popovers de Seleção de Usuários */}
            <UserSelectPopover
              isOpen={isOwnerPopoverOpen}
              onClose={() => setIsOwnerPopoverOpen(false)}
              users={filterUsers}
              selectedIds={selectedLead.assignedToId ? [selectedLead.assignedToId] : []}
              onSelect={handleOwnerChange}
              title="Pesquisar responsável..."
              anchorEl={isOwnerPopoverOpen ? 'lead-drawer-owner-anchor' : null}
              isMulti={false}
            />

            <UserSelectPopover
              isOpen={isParticipantPopoverOpen}
              onClose={() => setIsParticipantPopoverOpen(false)}
              users={filterUsers}
              selectedIds={selectedLead.shares?.filter((s: any) => s.role !== 'OBSERVADOR').map((s: any) => s.user?.id) || []}
              onSelect={handleToggleParticipant}
              title="Pesquisar participante..."
              anchorEl={isParticipantPopoverOpen ? 'lead-drawer-participant-anchor' : null}
              isMulti={true}
            />

            <UserSelectPopover
              isOpen={isObserverPopoverOpen}
              onClose={() => setIsObserverPopoverOpen(false)}
              users={filterUsers}
              selectedIds={selectedLead.shares?.filter((s: any) => s.role === 'OBSERVADOR').map((s: any) => s.user?.id) || []}
              onSelect={handleToggleObserver}
              title="Pesquisar observador..."
              anchorEl={isObserverPopoverOpen ? 'lead-drawer-observer-anchor' : null}
              isMulti={true}
            />
          </div>
        </div>
      )}

      {/* Popover Inline para Alteração de Responsável no Card */}
      <UserSelectPopover
        isOpen={inlineOwnerLeadId !== null}
        onClose={() => setInlineOwnerLeadId(null)}
        users={filterUsers}
        selectedIds={
          inlineOwnerLeadId
            ? [leads.find(l => l.id === inlineOwnerLeadId)?.assignedToId || '']
            : []
        }
        onSelect={handleInlineOwnerSelect}
        title="Pesquisar responsável..."
        anchorEl={
          inlineOwnerLeadId
            ? `lead-avatar-inline-owner-${inlineOwnerLeadId}`
            : null
        }
        isMulti={false}
      />

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
              <div className="w-full md:w-[35%] lg:w-[30%] border-r border-slate-100 flex flex-col bg-white shrink-0">
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
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin bg-white">
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
                          className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 border-b border-slate-100 ${
                            isSelected 
                              ? 'bg-[#e6fcf5]/70 border-l-4 border-[#0ca678] font-bold' 
                              : 'hover:bg-slate-50 bg-white'
                          }`}
                        >
                          {/* Avatar and Initials for Chat List Sidebar Item */}
                          <div className="w-10 h-10 bg-[#e7f5ff] text-[#1c7ed6] font-extrabold text-xs rounded-xl flex items-center justify-center shrink-0 uppercase border border-blue-100">
                            {getInitials(lead.nomeFantasia)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate" title={lead.nomeFantasia}>
                                {lead.nomeFantasia}
                              </h4>
                              {lead.latestMsg && (() => {
                                const msgDate = new Date(lead.latestMsg.createdAt);
                                if (isNaN(msgDate.getTime())) return null;
                                const isToday = msgDate.toDateString() === new Date().toDateString();
                                return (
                                  <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-1">
                                    {isToday 
                                      ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
                                    }
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                              <span className="shrink-0 select-none">🏢</span>
                              <span className="truncate">{lead.segmento || 'Sem segmento'}</span>
                            </div>

                            {lead.telefone && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold">
                                <span className="shrink-0 select-none">📞</span>
                                <span className="truncate">{lead.telefone}</span>
                              </div>
                            )}

                            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                              <span>Etapa:</span>
                              <span className="font-bold text-[#1c7ed6] uppercase">
                                {lead.stage?.nome || 'Sem Etapa'}
                              </span>
                            </div>

                            {lead.latestMsg && (
                              <p className="text-xs text-slate-500 truncate mt-1.5 bg-[#f1f3f5] p-2 rounded-xl border border-slate-200/60 italic font-medium">
                                {lead.latestMsg.direction === 'OUTBOUND' ? (
                                  <span className="font-bold text-slate-600 not-italic">Você: </span>
                                ) : ''}
                                {lead.latestMsg.texto}
                              </p>
                            )}
                          </div>

                          {/* Unread badge */}
                          {lead.unreadCount > 0 && (
                            <span className="bg-[#0ca678] text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
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
                              <div className="w-9 h-9 bg-[#e7f5ff] text-[#1c7ed6] font-extrabold text-xs rounded-xl flex items-center justify-center shrink-0 uppercase border border-blue-100">
                                {getInitials(activeLead.nomeFantasia)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate leading-none mb-1">
                                  {activeLead.nomeFantasia || 'Sem Nome'}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-semibold">{activeLead.telefone}</span>
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
                                className={`text-[10.5px] font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 border ${
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
                                    <UserCog size={13} className="text-slate-600" /> Completar Cadastro
                                  </>
                                )}
                              </button>

                              {/* Button to view lead profile/funnel detail modal directly */}
                              <button
                                onClick={() => {
                                  setSelectedLead(activeLead);
                                  setShowChatCenter(false);
                                }}
                                className="bg-[#0ca678] hover:bg-[#099268] text-white font-extrabold text-[10.5px] px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95"
                                title="Ver no Funil"
                              >
                                <Target size={13} /> Ver no Funil
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

      {customModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 p-6 flex flex-col gap-4 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {customModal.title}
              </h3>
              <button
                onClick={() => {
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                  if (customModal.onCancel) customModal.onCancel();
                }}
                className="text-slate-455 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {customModal.type === 'prompt' && (
              <input
                type="text"
                id="custom-modal-input"
                defaultValue={customModal.defaultValue || ''}
                placeholder={customModal.placeholder || ''}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                    customModal.onConfirm(input?.value || '');
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
            
            {customModal.type !== 'prompt' && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {customModal.message}
              </p>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              {customModal.type !== 'alert' && (
                <button
                  onClick={() => {
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                    if (customModal.onCancel) customModal.onCancel();
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                  customModal.onConfirm(customModal.type === 'prompt' ? (input?.value || '') : '');
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {customModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 p-6 flex flex-col gap-4 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {customModal.title}
              </h3>
              <button
                onClick={() => {
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                  if (customModal.onCancel) customModal.onCancel();
                }}
                className="text-slate-455 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {customModal.type === 'prompt' && (
              <input
                type="text"
                id="custom-modal-input"
                defaultValue={customModal.defaultValue || ''}
                placeholder={customModal.placeholder || ''}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                    customModal.onConfirm(input?.value || '');
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
            
            {customModal.type !== 'prompt' && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {customModal.message}
              </p>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              {customModal.type !== 'alert' && (
                <button
                  onClick={() => {
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                    if (customModal.onCancel) customModal.onCancel();
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                  customModal.onConfirm(customModal.type === 'prompt' ? (input?.value || '') : '');
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
