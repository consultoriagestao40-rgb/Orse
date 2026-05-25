'use client';

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { getActivities, getAllUsers, createActivity, deleteActivity } from '../leads/actions';
import { getLoggedUser } from '../propostas/actions';

import Sidebar from '@/components/Sidebar';

export default function CalendarPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filterUser, setFilterUser] = useState<string>('todos');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showNewModal, setShowNewModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<any>(null);

  const [newActivity, setNewActivity] = useState({ titulo: '', descricao: '', data: '', hora: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [actRes, userRes, logRes] = await Promise.all([
      getActivities(),
      getAllUsers(),
      getLoggedUser()
    ]);
    if (actRes.success) setActivities(actRes.activities);
    if (userRes.success) setAllUsers(userRes.users);
    if (logRes) setCurrentUser(logRes);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.titulo || !newActivity.data || !newActivity.hora) return;

    const dataInicioStr = `${newActivity.data}T${newActivity.hora}:00`;
    const dataInicio = new Date(dataInicioStr);
    const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // +1 hora

    const res = await createActivity({
      titulo: newActivity.titulo,
      descricao: newActivity.descricao,
      tipo: 'REUNIAO',
      dataInicio,
      dataFim
    });

    if (res.success) {
      setShowNewModal(false);
      setNewActivity({ titulo: '', descricao: '', data: '', hora: '' });
      loadInitialData();
    } else {
      alert("Erro ao criar evento");
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Deseja excluir este evento?')) return;
    const res = await deleteActivity(id);
    if (res.success) {
      setShowViewModal(null);
      loadInitialData();
    } else {
      alert("Erro ao excluir");
    }
  };

  // Funções simples para navegação do mês
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const filteredActivities = activities.filter(a => {
    if (filterUser === 'todos') return true;
    if (filterUser === 'meus') return a.userId === currentUser?.id;
    return a.userId === filterUser;
  });

  const getActivitiesForDay = (day: number) => {
    return filteredActivities.filter(a => {
      if (!a.dataInicio) return false;
      const d = new Date(a.dataInicio);
      if (isNaN(d.getTime())) return false;
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex flex-col flex-1 overflow-hidden relative">
        <div className="p-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-[#1B4D3E]" size={24} /> Calendário Global
              </h1>
              <p className="text-sm text-slate-500">Acompanhe suas reuniões e compromissos com Leads.</p>
            </div>
            <button 
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-[#1B4D3E] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#13382d] transition-all"
            >
              <Plus size={18} /> Novo Evento
            </button>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 pl-2">Filtro:</span>
              <select 
                value={filterUser} 
                onChange={(e) => setFilterUser(e.target.value)}
                className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-1.5 font-medium outline-none focus:border-[#1B4D3E]"
              >
                <option value="todos">Todos da Equipe</option>
                <option value="meus">Meus Eventos</option>
                {allUsers.filter(u => u.id !== currentUser?.id).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 bg-white shadow-sm hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200"><ChevronLeft size={20}/></button>
              <span className="font-bold text-lg text-slate-800 w-48 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={nextMonth} className="p-2 bg-white shadow-sm hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200"><ChevronRight size={20}/></button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col min-h-[600px]">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-[1fr]">
              {days.map((day, idx) => {
                const dayActivities = day ? getActivitiesForDay(day) : [];
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                
                return (
                  <div key={idx} className={`border-b border-r border-slate-200 p-2 ${!day ? 'bg-slate-50' : 'bg-white'} ${isToday ? 'bg-emerald-50/50' : ''}`}>
                    {day && (
                      <div className="flex flex-col h-full">
                        <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 shrink-0 ${isToday ? 'bg-[#1B4D3E] text-white' : 'text-slate-600'}`}>
                          {day}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide min-h-0">
                          {dayActivities.map(a => {
                            const dateObj = new Date(a.dataInicio);
                            const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Hora Inválida';
                            return (
                              <div 
                                key={a.id} 
                                onClick={() => setShowViewModal(a)}
                                className="text-[10px] bg-[#1B4D3E] text-white p-1 rounded font-medium leading-tight truncate px-1.5 cursor-pointer hover:opacity-80 transition-opacity" 
                                title={a.titulo}
                              >
                                {timeStr} - {a.lead?.nomeFantasia || a.titulo}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Novo Evento */}
        {showNewModal && (
          <div className="absolute inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">Novo Evento Avulso</h3>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateActivity} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                  <input type="text" required value={newActivity.titulo} onChange={e => setNewActivity({...newActivity, titulo: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" placeholder="Ex: Reunião de Alinhamento"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                    <input type="date" required value={newActivity.data} onChange={e => setNewActivity({...newActivity, data: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Hora</label>
                    <input type="time" required value={newActivity.hora} onChange={e => setNewActivity({...newActivity, hora: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea value={newActivity.descricao} onChange={e => setNewActivity({...newActivity, descricao: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm resize-none" rows={3} placeholder="Opcional..." />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-[#1B4D3E] text-white py-3 rounded-xl font-bold hover:bg-[#13382d] transition-colors">Criar Evento</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Visualizar Evento */}
        {showViewModal && (
          <div className="absolute inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                  <h3 className="font-black text-xl text-slate-800">{showViewModal.titulo}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={14}/> 
                    {new Date(showViewModal.dataInicio).toLocaleDateString()} às {new Date(showViewModal.dataInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <button onClick={() => setShowViewModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-200/50 p-1.5 rounded-lg"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6">
                
                {showViewModal.lead && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Lead Associado</h4>
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                      <p className="font-bold text-emerald-900">{showViewModal.lead.nomeFantasia}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Responsável</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                      {showViewModal.user?.nome?.charAt(0) || '?'}
                    </div>
                    <span className="font-bold text-slate-700">{showViewModal.user?.nome || 'Desconhecido'}</span>
                  </div>
                </div>

                {showViewModal.descricao && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Descrição</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{showViewModal.descricao}</p>
                  </div>
                )}

                {(currentUser?.id === showViewModal.userId || currentUser?.role === 'ADMIN') && (
                  <div className="pt-4 border-t border-slate-100">
                    <button onClick={() => handleDeleteActivity(showViewModal.id)} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 py-2.5 rounded-xl font-bold hover:bg-rose-100 transition-colors">
                      <Trash2 size={18}/> Excluir Evento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
