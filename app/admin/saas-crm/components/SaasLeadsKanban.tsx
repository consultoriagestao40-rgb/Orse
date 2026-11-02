'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, X, Check, Search, Phone, Mail, 
  Building2, MessageCircle, Calendar, Clock, Send, FileText,
  Sparkles, Layers, DollarSign, ArrowRight, UserCheck, ShieldAlert,
  ChevronRight, AlertCircle, RefreshCw, CheckCircle2
} from 'lucide-react';
import { 
  getSaasCRMData, createSaasStage, updateSaasStage, deleteSaasStage, 
  updateSaasLeadStage, createOrUpdateSaasLead, deleteSaasLead,
  getSaasLeadDetails, addSaasLeadActivity, toggleSaasLeadActivity,
  addSaasLeadNote, sendSaasLeadEmail, logSaasLeadWhatsApp
} from '../actions';

// Cores suaves e neutras pré-definidas para as etapas
const PRESET_COLORS = [
  '#475569', // Slate neutro
  '#64748b', // Slate suave
  '#0284c7', // Sky suave
  '#0891b2', // Cyan suave
  '#059669', // Emerald suave
  '#16a34a', // Verde suave
  '#d97706', // Âmbar suave
  '#ca8a04', // Amarelo suave
  '#7c3aed', // Roxo suave
  '#9333ea', // Violeta suave
  '#e11d48', // Rose suave
  '#334155', // Grafite executivo
];

const normalizeHex = (hex: string) => {
  let h = (hex || '#64748b').replace('#', '');
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

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function SaasLeadsKanban({
  onGenerateProposta,
}: {
  onGenerateProposta?: (lead: any) => void;
}) {
  const [stages, setStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMetrics, setShowMetrics] = useState(true);

  // Drag and Drop
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Edição de Etapa
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');

  // Modal Nova Etapa
  const [newStageModalOpen, setNewStageModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#059669');

  // Modal Novo Lead
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    cargo: '',
    tamanhoEmpresa: '1-10',
    origem: 'LP',
    valorMensal: 890,
    valorSetup: 1500,
    notas: '',
  });

  // Modal Detalhes do Lead (WhatsApp, E-mail, Atividades, Histórico)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTabModal, setActiveTabModal] = useState<'whatsapp' | 'email' | 'atividades' | 'notas' | 'historico'>('whatsapp');

  // Form de envio WhatsApp
  const [waMessage, setWaMessage] = useState('');
  // Form de envio E-mail
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  // Form de nova atividade
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState('REUNIAO');
  const [activityDate, setActivityDate] = useState('');
  // Form de nova nota
  const [newNote, setNewNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getSaasCRMData();
      if (res.success) {
        setStages(res.stages || []);
        setLeads(res.leads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Carrega detalhes completos do lead ao abrir modal
  const openLeadModal = async (leadId: string) => {
    setSelectedLeadId(leadId);
    setLoadingDetails(true);
    try {
      const res = await getSaasLeadDetails(leadId);
      if (res.success && res.lead) {
        setLeadDetails(res.lead);
        setEmailSubject(`Apresentação da Plataforma SmartBid - ${res.lead.empresa}`);
        setEmailBody(`Olá ${res.lead.nome},\n\nConforme conversamos, estou enviando os detalhes da plataforma SmartBid para automatização de propostas comerciais e cálculo de encargos.\n\nFico à disposição para agendarmos uma demonstração prática.\n\nAtenciosamente,\nEquipe SmartBid`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const reloadLeadDetails = async () => {
    if (!selectedLeadId) return;
    const res = await getSaasLeadDetails(selectedLeadId);
    if (res.success && res.lead) {
      setLeadDetails(res.lead);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedLeadId) return;
    const leadId = draggedLeadId;
    setDraggedLeadId(null);
    setDragOverStageId(null);

    // Otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stageId } : l))
    );

    await updateSaasLeadStage(leadId, stageId);
  };

  // Criar Etapa
  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;
    const res = await createSaasStage(newStageName, newStageColor);
    if (res.success && res.stage) {
      setStages((prev) => [...prev, res.stage]);
      setNewStageName('');
      setNewStageModalOpen(false);
    }
  };

  // Renomear Etapa
  const handleRenameStage = async (stageId: string) => {
    if (!editingStageName.trim()) {
      setEditingStageId(null);
      return;
    }
    const res = await updateSaasStage(stageId, { nome: editingStageName.trim() });
    if (res.success) {
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, nome: editingStageName.trim() } : s))
      );
    }
    setEditingStageId(null);
  };

  // Alterar cor da etapa
  const handleChangeStageColor = async (stageId: string, color: string) => {
    const res = await updateSaasStage(stageId, { color });
    if (res.success) {
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, color } : s))
      );
    }
    setEditingStageId(null);
  };

  // Excluir Etapa
  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) {
      alert('O funil deve conter pelo menos uma etapa.');
      return;
    }
    if (!confirm('Deseja excluir esta etapa? Os leads vinculados serão movidos para a primeira etapa.')) return;
    const res = await deleteSaasStage(stageId);
    if (res.success) {
      await loadData();
    }
  };

  // Criar Novo Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome || !leadForm.empresa || !leadForm.email) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const firstStage = stages[0];
    const res = await createOrUpdateSaasLead({
      ...leadForm,
      stageId: firstStage?.id,
    });

    if (res.success && res.lead) {
      setLeads((prev) => [res.lead, ...prev]);
      setNewLeadModalOpen(false);
      setLeadForm({
        nome: '',
        empresa: '',
        email: '',
        telefone: '',
        cargo: '',
        tamanhoEmpresa: '1-10',
        origem: 'LP',
        valorMensal: 890,
        valorSetup: 1500,
        notas: '',
      });
    }
  };

  // Enviar WhatsApp (Log + Abrir janela)
  const handleSendWhatsApp = async () => {
    if (!leadDetails || !waMessage.trim()) return;
    const cleanPhone = leadDetails.telefone.replace(/\D/g, '');
    const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encoded = encodeURIComponent(waMessage.trim());

    await logSaasLeadWhatsApp(leadDetails.id, waMessage.trim());
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encoded}`, '_blank');
    setWaMessage('');
    reloadLeadDetails();
  };

  // Enviar E-mail real
  const handleSendEmail = async () => {
    if (!leadDetails || !emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    try {
      const res = await sendSaasLeadEmail(leadDetails.id, emailSubject.trim(), emailBody.trim());
      if (res.success) {
        alert('E-mail corporativo enviado com sucesso!');
        reloadLeadDetails();
      } else {
        alert(res.error || 'Erro ao enviar e-mail');
      }
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar');
    } finally {
      setSendingEmail(false);
    }
  };

  // Adicionar Atividade
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadDetails || !activityTitle.trim()) return;
    const res = await addSaasLeadActivity({
      leadId: leadDetails.id,
      tipo: activityType,
      titulo: activityTitle.trim(),
      dataVenc: activityDate || undefined,
    });
    if (res.success) {
      setActivityTitle('');
      setActivityDate('');
      reloadLeadDetails();
    }
  };

  // Adicionar Nota
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadDetails || !newNote.trim()) return;
    const res = await addSaasLeadNote(leadDetails.id, newNote.trim());
    if (res.success) {
      setNewNote('');
      reloadLeadDetails();
    }
  };

  // Filtragem de busca
  const filteredLeads = leads.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.empresa?.toLowerCase().includes(term) ||
      l.nome?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.telefone?.toLowerCase().includes(term)
    );
  });

  // Métricas
  const totalMRR = filteredLeads.reduce((acc, curr) => acc + (curr.valorMensal || 0), 0);
  const totalLeads = filteredLeads.length;
  const ticketMedio = totalLeads > 0 ? totalMRR / totalLeads : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* ================= BARRA DE CONTROLE COMPACTA (SEM DUPLICAÇÃO DE CABEÇALHO) ================= */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, nome, e-mail..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none w-64 transition font-medium"
          />
        </div>

        {/* Métricas Inline Elegantes */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-400 uppercase text-[9px]">Pipeline:</span>
            <span>R$ {totalMRR.toLocaleString('pt-BR')}/mês</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="text-emerald-500 uppercase text-[9px]">Ticket Médio:</span>
            <span>R$ {Math.round(ticketMedio).toLocaleString('pt-BR')}/mês</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <span className="text-slate-400 uppercase text-[9px]">Leads:</span>
            <span>{totalLeads}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewStageModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            Etapa
          </button>

          <button
            onClick={() => setNewLeadModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1B4D3E] hover:bg-[#153e32] rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Lead SaaS
          </button>
        </div>
      </div>

      {/* ================= KANBAN BOARD IDÊNTICO AO SMARTBID (274px, gap-[3px]) ================= */}
      <div className="w-full overflow-x-auto overflow-y-visible bg-slate-50 flex-1 min-h-0">
        <div className="pt-3 pb-6 pl-2 pr-1 bg-slate-50 min-w-max flex gap-[3px]">
          {stages.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === stages.length - 1;
            const stageLeads = filteredLeads.filter((l) => l.stageId === stage.id);
            const totalStageMRR = stageLeads.reduce((acc, curr) => acc + (curr.valorMensal || 0), 0);
            const resolvedHex = stage.color || '#475569';
            const contrast = getContrastYIQ(resolvedHex);
            const bgRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.08 : 0.18);
            const borderRgba = hexToRgba(resolvedHex, contrast === 'white' ? 0.25 : 0.45);

            return (
              <div
                key={stage.id}
                className="flex flex-col flex-shrink-0"
                style={{ width: '274px' }}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Chevron Header SmartBid Nativo */}
                <div className="relative h-[52px] shrink-0 select-none group/header" style={{ width: '274px' }}>
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

                  {/* Conteúdo sobreposto no Chevron */}
                  <div 
                    className={`relative z-10 flex items-center justify-between h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                    style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                  >
                    <div className="flex flex-col min-w-0 justify-center">
                      <h3 className="font-black uppercase tracking-wider text-xs truncate max-w-[160px] leading-tight">
                        {stage.nome}
                      </h3>
                      <span className="text-[10px] font-bold mt-0.5 opacity-90 truncate leading-none">
                        R$ {totalStageMRR.toLocaleString('pt-BR')} • {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
                      </span>
                    </div>

                    {/* Botões de Ação na Coluna */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStageId(stage.id);
                          setEditingStageName(stage.nome);
                        }}
                        title="Personalizar Etapa (Nome e Cor)"
                        className="p-1 rounded-full hover:bg-black/10 transition cursor-pointer"
                        style={{ color: 'inherit' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStage(stage.id);
                          }}
                          title="Excluir Etapa"
                          className="p-1 rounded-full hover:bg-black/10 transition cursor-pointer"
                          style={{ color: 'inherit' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Popover de Edição da Etapa */}
                  {editingStageId === stage.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setEditingStageId(null)}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 top-14 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-[280px] text-slate-800 flex flex-col gap-3 font-sans">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Personalizar Etapa
                          </span>
                          <button 
                            onClick={() => setEditingStageId(null)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome da Etapa</label>
                          <input
                            type="text"
                            value={editingStageName}
                            onChange={(e) => setEditingStageName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameStage(stage.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none w-full bg-slate-50 font-medium mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cor da Coluna</label>
                          <div className="grid grid-cols-6 gap-1.5 mt-1.5">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleChangeStageColor(stage.id, c)}
                                className="w-6 h-6 rounded-full border shadow-xs transition hover:scale-110 flex items-center justify-center cursor-pointer"
                                style={{
                                  backgroundColor: c,
                                  borderColor: stage.color === c ? '#0f172a' : 'transparent',
                                  borderWidth: stage.color === c ? '2px' : '0px',
                                }}
                              >
                                {stage.color === c && <Check size={11} className="text-white" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRenameStage(stage.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Coluna de Cards (Estilo Idêntico com bgRgba e borderRgba) */}
                <div
                  className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                  style={{
                    width: '274px',
                    minWidth: '274px',
                    maxWidth: '274px',
                    marginLeft: '0px',
                    backgroundColor: bgRgba,
                    borderColor: borderRgba,
                    borderWidth: '0 1px 1px 1px',
                    borderStyle: 'solid',
                    height: 'calc(100vh - 165px)',
                    overflowY: 'auto',
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    {stageLeads.length === 0 ? (
                      <div className="border border-dashed border-slate-300/40 rounded-xl py-12 flex items-center justify-center flex-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sem leads</p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          onClick={() => openLeadModal(lead.id)}
                          className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer group cursor-grab active:cursor-grabbing text-left flex flex-col justify-between h-32 relative overflow-visible"
                        >
                          {/* Top: Origem e Empresa */}
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 tracking-wide uppercase truncate max-w-[120px]">
                                {lead.origem || 'SaaS'}
                              </span>
                              {lead.tamanhoEmpresa && (
                                <span className="text-[9px] font-bold text-slate-400 truncate">
                                  {lead.tamanhoEmpresa}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 leading-tight truncate" title={lead.empresa || lead.nome}>
                              {lead.empresa || lead.nome}
                            </p>
                            {lead.empresa && lead.nome && (
                              <p className="text-[11px] text-slate-500 truncate">
                                {lead.nome} {lead.cargo ? `• ${lead.cargo}` : ''}
                              </p>
                            )}
                          </div>

                          {/* Bottom: Valor Mensal e Proposta */}
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                            <span className="text-xs font-black text-[#1B4D3E]">
                              R$ {(lead.valorMensal || 0).toLocaleString('pt-BR')}
                              <span className="text-[9px] text-slate-400 font-normal">/mês</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {lead.telefone && (
                                <span title={lead.telefone} className="text-emerald-600">
                                  <MessageCircle size={12} />
                                </span>
                              )}
                              {onGenerateProposta && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateProposta(lead);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Gerar / Editar Proposta Flegável para este Lead"
                                >
                                  <Layers size={11} />
                                  Proposta
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL NOVA ETAPA ================= */}
      {newStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Criar Nova Etapa no Funil SaaS</h3>
              <button 
                onClick={() => setNewStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Nome da Etapa</label>
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Ex: Reunião de Alinhamento"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Selecione uma Cor Suave</label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewStageColor(c)}
                      className="w-8 h-8 rounded-full border shadow-xs flex items-center justify-center transition hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: c,
                        borderColor: newStageColor === c ? '#0f172a' : 'transparent',
                        borderWidth: newStageColor === c ? '2px' : '0px',
                      }}
                    >
                      {newStageColor === c && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNewStageModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateStage}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                Criar Etapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL NOVO LEAD SAAS ================= */}
      {newLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Novo Lead para Licença SmartBid</h3>
                <p className="text-[11px] text-slate-500">Cadastre uma nova empresa interessada no software.</p>
              </div>
              <button onClick={() => setNewLeadModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome da Empresa *</label>
                  <input
                    required
                    type="text"
                    value={leadForm.empresa}
                    onChange={(e) => setLeadForm({ ...leadForm, empresa: e.target.value })}
                    placeholder="Ex: Alfa Facilities"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome do Contato *</label>
                  <input
                    required
                    type="text"
                    value={leadForm.nome}
                    onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                    placeholder="Ex: Carlos Silva"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">E-mail Corporativo *</label>
                  <input
                    required
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="carlos@empresa.com.br"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">WhatsApp / Telefone *</label>
                  <input
                    required
                    type="text"
                    value={leadForm.telefone}
                    onChange={(e) => setLeadForm({ ...leadForm, telefone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Cargo</label>
                  <input
                    type="text"
                    value={leadForm.cargo}
                    onChange={(e) => setLeadForm({ ...leadForm, cargo: e.target.value })}
                    placeholder="Diretor Comercial"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Porte</label>
                  <select
                    value={leadForm.tamanhoEmpresa}
                    onChange={(e) => setLeadForm({ ...leadForm, tamanhoEmpresa: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium bg-white"
                  >
                    <option value="1-10">1-10 funcionários</option>
                    <option value="11-50">11-50 funcionários</option>
                    <option value="51-200">51-200 funcionários</option>
                    <option value="200+">Mais de 200</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Origem</label>
                  <select
                    value={leadForm.origem}
                    onChange={(e) => setLeadForm({ ...leadForm, origem: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium bg-white"
                  >
                    <option value="LP">Landing Page</option>
                    <option value="GOOGLE_ADS">Google Ads</option>
                    <option value="META_ADS">Meta Ads</option>
                    <option value="WHATSAPP">WhatsApp Direto</option>
                    <option value="REUNIAO">Reunião / Prospecção</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Valor Mensal Previsto (R$)</label>
                  <input
                    type="number"
                    value={leadForm.valorMensal}
                    onChange={(e) => setLeadForm({ ...leadForm, valorMensal: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Taxa de Setup Prevista (R$)</label>
                  <input
                    type="number"
                    value={leadForm.valorSetup}
                    onChange={(e) => setLeadForm({ ...leadForm, valorSetup: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Notas Iniciais</label>
                <textarea
                  rows={2}
                  value={leadForm.notas}
                  onChange={(e) => setLeadForm({ ...leadForm, notas: e.target.value })}
                  placeholder="Expectativas do cliente, dores com planilhas, módulos de interesse..."
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewLeadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1B4D3E] hover:bg-[#153e32] rounded-xl shadow-xs cursor-pointer"
                >
                  Cadastrar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL COMPLETO DO LEAD (WHATSAPP, E-MAIL, ATIVIDADES, HISTÓRICO) ================= */}
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[620px] flex flex-col overflow-hidden">
            {/* Topo do Modal */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30">
                  {leadDetails?.empresa?.substring(0, 2).toUpperCase() || 'SB'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {leadDetails?.empresa || 'Carregando...'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {leadDetails?.nome} {leadDetails?.cargo ? `• ${leadDetails.cargo}` : ''} • Tel: {leadDetails?.telefone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onGenerateProposta && leadDetails && (
                  <button
                    onClick={() => {
                      onGenerateProposta(leadDetails);
                      setSelectedLeadId(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Layers size={13} /> Gerar Proposta
                  </button>
                )}
                <button
                  onClick={() => setSelectedLeadId(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Abas de Navegação Interna */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTabModal('whatsapp')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTabModal === 'whatsapp'
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle size={15} className="text-emerald-600" />
                WhatsApp Integrado
              </button>

              <button
                onClick={() => setActiveTabModal('email')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTabModal === 'email'
                    ? 'border-blue-600 text-blue-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail size={15} className="text-blue-600" />
                E-mail Corporativo
              </button>

              <button
                onClick={() => setActiveTabModal('atividades')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTabModal === 'atividades'
                    ? 'border-purple-600 text-purple-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar size={15} className="text-purple-600" />
                Atividades & Demos ({leadDetails?.activities?.length || 0})
              </button>

              <button
                onClick={() => setActiveTabModal('notas')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTabModal === 'notas'
                    ? 'border-amber-600 text-amber-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit2 size={15} className="text-amber-600" />
                Notas & Chat Interno
              </button>

              <button
                onClick={() => setActiveTabModal('historico')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  activeTabModal === 'historico'
                    ? 'border-slate-800 text-slate-900 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={15} className="text-slate-600" />
                Histórico & Auditoria
              </button>
            </div>

            {/* Conteúdo Dinâmico da Aba */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {loadingDetails ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Carregando informações do lead...
                </div>
              ) : (
                <>
                  {/* ================= ABA 1: WHATSAPP INTEGRADO ================= */}
                  {activeTabModal === 'whatsapp' && (
                    <div className="h-full flex flex-col space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-900">Número de WhatsApp do Lead:</span>
                          <p className="text-sm font-black text-emerald-800">{leadDetails?.telefone}</p>
                        </div>
                        <span className="text-[11px] bg-white px-2.5 py-1 rounded-full font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                          Canal Direto Oficial
                        </span>
                      </div>

                      {/* Modelos de Mensagens Rápidas */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Respostas Rápidas de Vendas:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setWaMessage(
                                `Olá ${leadDetails?.nome}, tudo bem? Sou da equipe comercial do SmartBid. Vi seu interesse na nossa plataforma de precificação e gestão para empresas de facilities. Gostaria de agendar uma breve demonstração prática de 15 minutos?`
                              )
                            }
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition cursor-pointer"
                          >
                            📅 Convite para Demonstração
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setWaMessage(
                                `Olá ${leadDetails?.nome}! Conforme nossa reunião de hoje, acabei de gerar sua proposta comercial exclusiva para o SmartBid com todos os módulos solicitados. Segue o link para análise e assinatura digital:`
                              )
                            }
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition cursor-pointer"
                          >
                            📄 Envio de Proposta Comercial
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setWaMessage(
                                `Olá ${leadDetails?.nome}, passando para saber se você conseguiu analisar a proposta do SmartBid ou se ficou alguma dúvida sobre o cálculo dos encargos e a automação do FPV.`
                              )
                            }
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition cursor-pointer"
                          >
                            🔔 Follow-up Pós-Proposta
                          </button>
                        </div>
                      </div>

                      {/* Campo de Texto para Enviar */}
                      <div className="flex-1 flex flex-col space-y-2">
                        <label className="text-xs font-bold text-slate-700">Mensagem para o Lead:</label>
                        <textarea
                          rows={5}
                          value={waMessage}
                          onChange={(e) => setWaMessage(e.target.value)}
                          placeholder="Digite a mensagem personalizada..."
                          className="w-full flex-1 p-3 text-xs border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-medium bg-white"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleSendWhatsApp}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition"
                          >
                            <Send size={14} /> Abrir no WhatsApp & Salvar no Histórico
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= ABA 2: E-MAIL CORPORATIVO ================= */}
                  {activeTabModal === 'email' && (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Destinatário:</label>
                            <input
                              type="text"
                              disabled
                              value={leadDetails?.email}
                              className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Assunto:</label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400">Corpo do E-mail:</label>
                          <textarea
                            rows={6}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="w-full mt-1 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={sendingEmail}
                            onClick={handleSendEmail}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition disabled:opacity-50"
                          >
                            <Send size={14} /> {sendingEmail ? 'Disparando...' : 'Enviar E-mail Corporativo Real'}
                          </button>
                        </div>
                      </div>

                      {/* Histórico de E-mails enviados */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700">E-mails Enviados para este Lead:</span>
                        {leadDetails?.emails && leadDetails.emails.length > 0 ? (
                          leadDetails.emails.map((em: any) => (
                            <div key={em.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                                <span className="font-bold text-slate-800">{em.assunto}</span>
                                <span>{new Date(em.createdAt).toLocaleString('pt-BR')}</span>
                              </div>
                              <p className="text-slate-600 whitespace-pre-line text-[11px] line-clamp-2">{em.corpo}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">Nenhum e-mail disparado até o momento.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ================= ABA 3: ATIVIDADES & TAREFAS ================= */}
                  {activeTabModal === 'atividades' && (
                    <div className="space-y-5">
                      {/* Form Criar Atividade */}
                      <form onSubmit={handleAddActivity} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                        <span className="text-xs font-bold text-slate-800">Agendar Nova Ação Comercial</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                            <select
                              value={activityType}
                              onChange={(e) => setActivityType(e.target.value)}
                              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-medium bg-white"
                            >
                              <option value="REUNIAO">📅 Reunião Online</option>
                              <option value="DEMO">💻 Demonstração do Sistema</option>
                              <option value="LIGACAO">📞 Ligação de Qualificação</option>
                              <option value="TAREFA">📌 Tarefa / Follow-up</option>
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Título da Ação</label>
                            <input
                              required
                              type="text"
                              value={activityTitle}
                              onChange={(e) => setActivityTitle(e.target.value)}
                              placeholder="Ex: Apresentar módulo de precificação e CRM"
                              className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <input
                            type="datetime-local"
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-medium text-slate-600"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Salvar Atividade
                          </button>
                        </div>
                      </form>

                      {/* Lista de Atividades */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700">Agenda do Lead:</span>
                        {leadDetails?.activities && leadDetails.activities.length > 0 ? (
                          leadDetails.activities.map((act: any) => (
                            <div
                              key={act.id}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                                act.concluida ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-purple-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={act.concluida}
                                  onChange={async (e) => {
                                    await toggleSaasLeadActivity(act.id, e.target.checked);
                                    reloadLeadDetails();
                                  }}
                                  className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold">{act.titulo}</span>
                                  {act.dataVenc && (
                                    <p className="text-[10px] text-slate-400">
                                      Para: {new Date(act.dataVenc).toLocaleString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                {act.tipo}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">Nenhuma atividade agendada.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ================= ABA 4: NOTAS & CHAT INTERNO ================= */}
                  {activeTabModal === 'notas' && (
                    <div className="space-y-4">
                      <form onSubmit={handleAddNote} className="space-y-2">
                        <textarea
                          rows={3}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Adicione observações da negociação, feedback do cliente, objeções levantadas..."
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium bg-white"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Adicionar Nota
                          </button>
                        </div>
                      </form>

                      {/* Observações Originais */}
                      {leadDetails?.notas && (
                        <div className="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                            Nota Inicial do Lead:
                          </span>
                          <p className="text-slate-700 font-medium">{leadDetails.notas}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ================= ABA 5: HISTÓRICO & AUDITORIA ================= */}
                  {activeTabModal === 'historico' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700">Linha do Tempo de Interações:</span>
                      {leadDetails?.history && leadDetails.history.length > 0 ? (
                        leadDetails.history.map((h: any) => (
                          <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-slate-800 font-medium">{h.descricao}</p>
                              <span className="text-[10px] text-slate-400">
                                {new Date(h.createdAt).toLocaleString('pt-BR')} • {h.autor || 'Sistema'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Nenhum evento registrado no histórico.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
