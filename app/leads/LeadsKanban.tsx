'use client';

import React, { useState, useEffect } from 'react';
import { getLeads, getLeadStages, updateLeadStage, createLead, convertLeadToClient, addLeadHistory, updateLeadStageColor, createLeadStage, deleteLeadStage } from './actions';
import { Plus, User, Phone, Mail, Building, Clock, ChevronRight, CheckCircle2, X, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [stagesRes, leadsRes, segmentosRes] = await Promise.all([
      getLeadStages(),
      getLeads(),
      getSegmentos()
    ]);
    if (stagesRes.success) setStages(stagesRes.stages);
    if (leadsRes.success) setLeads(leadsRes.leads);
    if (Array.isArray(segmentosRes)) setSegmentos(segmentosRes);
    else if (segmentosRes && segmentosRes.success) setSegmentos(segmentosRes.segmentos);
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

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
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
          <h1 className="text-2xl font-black text-slate-800">Pipeline de Vendas</h1>
          <p className="text-sm text-slate-500">Gerencie seus leads e prospectos</p>
        </div>
        <button 
          onClick={() => setShowNewLead(true)}
          className="flex items-center gap-2 bg-[#1B4D3E] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#13382d] transition-all"
        >
          <Plus size={18} /> Novo Lead
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden p-6 bg-slate-50">
        <PipelineMetrics leads={leads} stages={stages} />
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-h-0">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stageId === stage.id);
            return (
              <div 
                key={stage.id} 
                className={`w-80 shrink-0 flex flex-col h-full ${stage.color || 'bg-slate-100'} rounded-2xl border border-slate-200 transition-colors duration-300`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-4 border-b border-slate-200/50 flex justify-between items-center group/header">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700">{stage.nome}</h3>
                    <div className="relative group/picker ml-2">
                      <button 
                        title="Mudar cor da coluna"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors flex items-center justify-center cursor-pointer"
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
                      className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center cursor-pointer ml-1"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStage(stage.id)} 
                      title="Excluir Etapa" 
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer ml-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <span className="bg-white/50 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
                    >
                      <div className="font-bold text-slate-800 mb-1">{lead.nomeFantasia}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                        <Building size={12} /> {lead.segmento || 'Sem segmento'}
                      </div>
                      {lead.assignedTo && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
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

      {/* Modal Lead Details */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-800">{selectedLead.nomeFantasia}</h2>
                <p className="text-sm text-slate-500">{selectedLead.segmento}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <LeadDetailsTabs lead={selectedLead} />
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => openConvertModal(selectedLead)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
              >
                <CheckCircle2 size={18} /> Converter em Cliente e Gerar Proposta (FPV)
              </button>
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
