'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Settings, Layers, CalendarDays, Ruler, Plus, Trash2, 
  Save, X, Check, Search, Hash, Tag, Clock
} from 'lucide-react';
import { 
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus 
} from '@/app/propostas/actions';
import { 
  getEscalas, createEscala, updateEscala, deleteEscala 
} from '@/app/escalas/actions';
import { 
  getUnidadesMedida, createUnidadeMedida, deleteUnidadeMedida 
} from './actions';

type Tab = 'status' | 'escalas' | 'unidades';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [loading, setLoading] = useState(false);

  // Status State
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newStatusName, setNewStatusName] = useState('');

  // Escalas State
  const [escalas, setEscalas] = useState<any[]>([]);
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaForm, setEscalaForm] = useState({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });

  // Unidades State
  const [unidades, setUnidades] = useState<any[]>([]);
  const [newUnidade, setNewUnidade] = useState({ nome: '', sigla: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'status') {
      const data = await getPropostaStatuses();
      setStatuses(data);
    } else if (activeTab === 'escalas') {
      const data = await getEscalas();
      setEscalas(data);
    } else if (activeTab === 'unidades') {
      const data = await getUnidadesMedida();
      setUnidades(data);
    }
    setLoading(false);
  };

  // HANDLERS STATUS
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    await createPropostaStatus(newStatusName);
    setNewStatusName('');
    loadData();
  };

  const handleDeleteStatus = async (id: string) => {
    if (confirm('Remover este status?')) {
      await deletePropostaStatus(id);
      loadData();
    }
  };

  // HANDLERS ESCALAS
  const handleSaveEscala = async () => {
    if (!escalaForm.nome) return alert('Nome é obrigatório');
    if (escalaForm.id) await updateEscala(escalaForm.id, escalaForm);
    else await createEscala(escalaForm);
    setShowEscalaModal(false);
    loadData();
  };

  const openEscalaModal = (escala?: any) => {
    if (escala) setEscalaForm(escala);
    else setEscalaForm({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });
    setShowEscalaModal(true);
  };

  // HANDLERS UNIDADES
  const handleAddUnidade = async () => {
    if (!newUnidade.nome || !newUnidade.sigla) return;
    await createUnidadeMedida(newUnidade.nome, newUnidade.sigla);
    setNewUnidade({ nome: '', sigla: '' });
    loadData();
  };

  const handleDeleteUnidade = async (id: string) => {
    if (confirm('Remover esta unidade?')) {
      await deleteUnidadeMedida(id);
      loadData();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* HEADER */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1B4D3E] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100">
              <Settings size={28} className="text-emerald-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configurações do Sistema</h1>
              <p className="text-slate-500 font-medium">Gerenciamento de parâmetros, escalas e tabelas auxiliares</p>
            </div>
          </div>

          {/* TABS NAVEGAÇÃO */}
          <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
            {[
              { id: 'status', label: 'Status de Proposta', icon: Layers },
              { id: 'escalas', label: 'Escalas de Trabalho', icon: CalendarDays },
              { id: 'unidades', label: 'Unidades de Medida', icon: Ruler },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-[#1B4D3E] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
            
            {/* 1. ABA STATUS */}
            {activeTab === 'status' && (
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Status de Propostas</h3>
                    <p className="text-sm text-slate-400 font-medium">Defina os estados possíveis para o fluxo comercial</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    placeholder="Novo nome de status (Ex: Em Análise)"
                    value={newStatusName}
                    onChange={e => setNewStatusName(e.target.value)}
                    className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#1B4D3E] text-sm font-bold uppercase"
                  />
                  <button 
                    onClick={handleAddStatus}
                    className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-8 rounded-xl font-black text-sm transition-all flex items-center gap-2"
                  >
                    <Plus size={18} strokeWidth={3} /> Adicionar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statuses.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50 transition-all group">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${s.color}`}>
                        {s.nome}
                      </span>
                      <button 
                        onClick={() => handleDeleteStatus(s.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ABA ESCALAS */}
            {activeTab === 'escalas' && (
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Escalas de Trabalho</h3>
                    <p className="text-sm text-slate-400 font-medium">Parâmetros de dias trabalhados e carga horária</p>
                  </div>
                  <button 
                    onClick={() => openEscalaModal()}
                    className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                  >
                    <Plus size={16} strokeWidth={3} /> Nova Escala
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Nome da Escala</th>
                        <th className="px-6 py-4 text-center">Dias / Mês</th>
                        <th className="px-6 py-4 text-center">Horas Mensais</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {escalas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-700 uppercase text-xs">{e.nome}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{e.diasTrabalhadosMes}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-600">{e.horasMensais}h</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEscalaModal(e)} className="p-2 text-slate-300 hover:text-emerald-600 transition-all"><Settings size={16} /></button>
                              <button onClick={() => { if(confirm('Excluir?')) deleteEscala(e.id).then(loadData) }} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
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
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Unidades de Medida</h3>
                    <p className="text-sm text-slate-400 font-medium">Gestão de grandezas para produtos e serviços</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    placeholder="Nome (Ex: Quilograma)"
                    value={newUnidade.nome}
                    onChange={e => setNewUnidade({...newUnidade, nome: e.target.value})}
                    className="flex-1 px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#1B4D3E] text-sm font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Sigla (Ex: KG)"
                    value={newUnidade.sigla}
                    onChange={e => setNewUnidade({...newUnidade, sigla: e.target.value})}
                    className="w-32 px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-[#1B4D3E] text-sm font-black uppercase"
                  />
                  <button 
                    onClick={handleAddUnidade}
                    className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-8 rounded-xl font-black text-sm transition-all flex items-center gap-2"
                  >
                    <Plus size={18} strokeWidth={3} /> Adicionar
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {unidades.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-emerald-200">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.nome}</p>
                        <p className="text-lg font-black text-[#1B4D3E]">{u.sigla}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteUnidade(u.id)}
                        className="p-2 text-slate-100 group-hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                <div className="text-slate-400 font-black animate-pulse uppercase text-xs tracking-widest">Carregando...</div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL ESCALA (REUTILIZADO) */}
        {showEscalaModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{escalaForm.id ? 'Editar' : 'Nova'} Escala</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase mt-1">Configuração de Jornada</p>
                </div>
                <button onClick={() => setShowEscalaModal(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nome da Escala</label>
                  <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#1B4D3E] transition-all" value={escalaForm.nome} onChange={e => setEscalaForm({...escalaForm, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Dias Trab. (Mês)</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.diasTrabalhadosMes} onChange={e => setEscalaForm({...escalaForm, diasTrabalhadosMes: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Horas Mensais</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.horasMensais} onChange={e => setEscalaForm({...escalaForm, horasMensais: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={handleSaveEscala} className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-emerald-200 transition-all active:scale-95">
                  <Save size={18} /> Salvar Configuração
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
