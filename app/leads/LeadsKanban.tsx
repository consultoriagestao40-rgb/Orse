'use client';

import React, { useState, useEffect } from 'react';
import { getLeads, getLeadStages, updateLeadStage, createLead, convertLeadToClient, addLeadHistory, updateLeadStageColor, createLeadStage, deleteLeadStage, getUsersForFilter, updateLeadStageName, deleteLead } from './actions';
import { Plus, User, Users, Phone, Mail, Building, Clock, ChevronRight, CheckCircle2, X, Trash2, MapPin, Navigation, CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSegmentos } from '@/app/admin/settings/actions';
import LeadDetailsTabs from './components/LeadDetailsTabs';
import PipelineMetrics from './components/PipelineMetrics';

const safeDate = (val: any) => {
  if (!val) return 'Data Inválida';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Data Inválida' : d.toLocaleDateString();
};

export default function LeadsKanban() {
  const router = useRouter();
  const [stages, setStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (stages.length > 0) {
      fetchFilteredLeads();
    }
  }, [datePreset, startDate, endDate, userFilter]);

  const fetchData = async () => {
    setLoading(true);
    const [stagesRes, segmentosRes, usersRes] = await Promise.all([
      getLeadStages(),
      getSegmentos(),
      getUsersForFilter()
    ]);
    if (stagesRes.success) setStages(stagesRes.stages);
    if (Array.isArray(segmentosRes)) setSegmentos(segmentosRes);
    else if (segmentosRes && segmentosRes.success) setSegmentos(segmentosRes.segmentos);
    if (usersRes.success) setFilterUsers(usersRes.users);
    
    await fetchFilteredLeads();
  };

  const fetchFilteredLeads = async () => {
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
    if (res.success) setLeads(res.leads);
    setLoading(false);
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
      <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Pipeline de Leads</h1>
          <p className="text-sm text-slate-500">Gerencie seus leads e prospectos</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none"
          >
            <option value="all">Todos Usuários</option>
            {filterUsers.map(u => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>

          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none"
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
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none"
              />
              <span className="text-slate-400 text-sm">até</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          )}

          <div className="w-px h-8 bg-slate-200 mx-2"></div>

          <button 
            onClick={() => setShowNewLead(true)}
            className="flex items-center gap-2 bg-[#1B4D3E] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#13382d] transition-all"
          >
            <Plus size={18} /> Novo Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-6 bg-slate-50">
        <PipelineMetrics leads={leads} stages={stages} />
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-h-0 pr-6">
          {stages.map((stage, idx) => {
            const stageLeads = leads.filter(l => l.stageId === stage.id);
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
                className={`w-80 shrink-0 flex flex-col h-full rounded-2xl transition-colors duration-300 relative`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div 
                  className={`relative h-16 shrink-0 z-10 w-[calc(100%+16px)] ml-0 group/header text-slate-800`}
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
                          className="font-black text-slate-900 uppercase tracking-tight text-base bg-white/70 border border-slate-400 rounded px-2 py-0.5 w-[160px] outline-none focus:ring-2 focus:ring-slate-900"
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
                          className="font-black text-slate-900 uppercase tracking-tight text-base truncate max-w-[180px] cursor-pointer hover:underline drop-shadow-sm"
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
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
                    >
                        <div className="font-bold text-slate-800 mb-1">{lead.nomeFantasia}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                          <Building size={12} /> {lead.segmento || 'Sem segmento'}
                        </div>
                        
                        {lead.telefone && (
                          <a href={`tel:${lead.telefone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()} className="text-xs text-slate-600 flex items-center gap-1 mb-1 hover:text-emerald-600">
                            <Phone size={12} /> {lead.telefone}
                          </a>
                        )}
                        
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} className="text-xs text-slate-600 flex items-center gap-1 mb-1 hover:text-emerald-600 truncate">
                            <Mail size={12} /> {lead.email}
                          </a>
                        )}
                        
                        {lead.endereco && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="text-[11px] text-slate-500 leading-tight mb-2 line-clamp-2">
                              {lead.endereco}
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.endereco)}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors">
                                <MapPin size={10} /> Google Maps
                              </a>
                              <a href={`https://waze.com/ul?q=${encodeURIComponent(lead.endereco)}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors">
                                <Navigation size={10} /> Waze
                              </a>
                            </div>
                          </div>
                        )}

                        {lead.activities && lead.activities.length > 0 && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 p-2 rounded text-xs flex flex-col gap-1">
                            <div className="font-bold text-amber-800 flex items-center gap-1">
                              <CalendarDays size={12} /> Próxima Atividade
                            </div>
                            <div className="text-amber-700">
                              <span className="font-semibold">{lead.activities[0].tipo}:</span> {lead.activities[0].titulo}
                            </div>
                            <div className="text-[10px] text-amber-600 font-medium">
                              {safeDate(lead.activities[0].dataInicio)}
                            </div>
                          </div>
                        )}

                        {lead.assignedTo && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                             <div className="flex items-center gap-1.5 text-xs text-slate-400">
                               <User size={12} /> {lead.assignedTo.nome.split(' ')[0]}
                             </div>
                             <div className="text-[10px] text-slate-400">
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
          <div className="bg-white w-full max-w-6xl h-full shadow-2xl flex flex-col md:flex-row rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Left Column: Info */}
            <div className="w-full md:w-[35%] lg:w-[30%] bg-slate-50 border-r border-slate-100 flex flex-col">
              <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">Etapa: {selectedLead.stage?.name || 'Desconhecida'}</div>
                  <h2 className="text-xl font-black text-slate-800 leading-tight mb-1">{selectedLead.nomeFantasia}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Building size={12}/> {selectedLead.segmento || 'Sem segmento'}</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="md:hidden text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={16}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Valor Estimado</div>
                  <div className="text-2xl font-black text-slate-800">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLead.valorEst || 0)}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contato</div>
                  
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Users size={10}/> Nome</div>
                    <div className="text-sm font-medium text-slate-700">{selectedLead.contatoNome || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Phone size={10}/> Telefone</div>
                    <div className="text-sm font-medium text-slate-700">
                      {selectedLead.telefone ? (
                        <div className="flex items-center justify-between group">
                          <a href={`tel:${selectedLead.telefone.replace(/\D/g,'')}`} className="hover:text-emerald-600 transition-colors">{selectedLead.telefone}</a>
                        </div>
                      ) : '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><Mail size={10}/> E-mail</div>
                    <div className="text-sm font-medium text-slate-700">
                      {selectedLead.email ? (
                        <div className="flex items-center justify-between group">
                          <a href={`mailto:${selectedLead.email}`} className="hover:text-emerald-600 transition-colors truncate max-w-[200px]" title={selectedLead.email}>{selectedLead.email}</a>
                        </div>
                      ) : '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Endereço</div>
                    <div className="text-sm font-medium text-slate-700 mb-2">{selectedLead.endereco || '-'}</div>
                    {selectedLead.endereco && (
                      <div className="flex flex-col gap-2">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.endereco)}`} target="_blank" rel="noreferrer" className="w-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                          <MapPin size={14} /> Abrir no Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2">
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

    </div>
  );
}
