'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, 
  Plus, X, Trash2, CheckCircle2, Circle, AlertCircle, FileText, 
  Target, CheckSquare, Shield, Search, Filter, ExternalLink, 
  MapPin, User, ChevronDown, CalendarDays, ListFilter, Eye, Check
} from 'lucide-react';
import { 
  getUnifiedCalendarData, 
  createQuickCalendarEvent, 
  toggleTaskOrEventStatus, 
  deleteCalendarEvent,
  CalendarEventItem 
} from './actions';
import Sidebar from '@/components/Sidebar';

type ViewMode = 'mes' | 'semana' | 'agenda';
type CategoryFilter = 'TODOS' | 'ATA' | 'LEAD' | 'TAREFA' | 'CONTRATO';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de navegação e filtros
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('TODOS');
  const [userFilter, setUserFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais e Drawer lateral
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ dateStr: string; dayNum: number } | null>(null);
  const [viewEventModal, setViewEventModal] = useState<CalendarEventItem | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEventData, setNewEventData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'REUNIAO' as const,
    data: '',
    hora: '10:00',
    userId: ''
  });

  const loadCalendarData = async () => {
    setLoading(true);
    const res = await getUnifiedCalendarData();
    if (res.success) {
      setEvents(res.events || []);
      setAllUsers(res.users || []);
      if (res.currentUser) setCurrentUser(res.currentUser);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  // Hoje no formato YYYY-MM-DD
  const todayStr = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Navegação de datas
  const goToToday = () => setCurrentDate(new Date());
  const prevPeriod = () => {
    if (viewMode === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };
  const nextPeriod = () => {
    if (viewMode === 'mes') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  // Filtragem dos eventos
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Filtro de Categoria
      if (categoryFilter !== 'TODOS' && ev.origem !== categoryFilter) {
        return false;
      }

      // Filtro de Usuário
      if (userFilter === 'meus' && ev.userId !== currentUser?.id) {
        return false;
      } else if (userFilter !== 'todos' && userFilter !== 'meus' && ev.userId !== userFilter) {
        return false;
      }

      // Busca por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = ev.titulo.toLowerCase().includes(term);
        const matchesDesc = ev.descricao?.toLowerCase().includes(term);
        const matchesClient = ev.clienteNome?.toLowerCase().includes(term);
        const matchesResp = ev.responsavelNome?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesClient && !matchesResp) {
          return false;
        }
      }

      return true;
    });
  }, [events, categoryFilter, userFilter, searchTerm, currentUser]);

  // Contadores por categoria
  const counts = useMemo(() => {
    return {
      todos: events.length,
      ata: events.filter(e => e.origem === 'ATA').length,
      lead: events.filter(e => e.origem === 'LEAD').length,
      tarefa: events.filter(e => e.origem === 'TAREFA').length,
      contrato: events.filter(e => e.origem === 'CONTRATO').length,
    };
  }, [events]);

  // Dias do mês atual para a grade
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Dom
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // Dias do mês anterior para preencher a primeira semana
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthTotalDays - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      days.push({
        dayNum: dNum,
        dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
        isCurrentMonth: false
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        dayNum: i,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true
      });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      days.push({
        dayNum: i,
        dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  // Agrupamento por data (mapa dateStr -> lista de eventos)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    filteredEvents.forEach(ev => {
      const list = map.get(ev.dataStr) || [];
      list.push(ev);
      map.set(ev.dataStr, list);
    });
    return map;
  }, [filteredEvents]);

  // Manipulação de Ações
  const handleToggleStatus = async (ev: CalendarEventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = await toggleTaskOrEventStatus(ev.id, ev.origem);
    if (res.success) {
      setEvents(prev => prev.map(item => item.id === ev.id ? { ...item, concluida: !item.concluida } : item));
      if (viewEventModal?.id === ev.id) {
        setViewEventModal(prev => prev ? { ...prev, concluida: !prev.concluida } : null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este compromisso do calendário?')) return;
    const res = await deleteCalendarEvent(id);
    if (res.success) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setViewEventModal(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.titulo || !newEventData.data) return;

    const dataInicioStr = `${newEventData.data}T${newEventData.hora || '10:00'}:00`;
    const res = await createQuickCalendarEvent({
      titulo: newEventData.titulo,
      descricao: newEventData.descricao,
      tipo: newEventData.tipo,
      dataInicio: new Date(dataInicioStr).toISOString(),
      userId: newEventData.userId || currentUser?.id
    });

    if (res.success) {
      setShowNewModal(false);
      setNewEventData({ titulo: '', descricao: '', tipo: 'REUNIAO', data: '', hora: '10:00', userId: '' });
      loadCalendarData();
    }
  };

  // Helper visual para badges de origem
  const getOriginBadge = (origem: CalendarEventItem['origem']) => {
    switch (origem) {
      case 'ATA':
        return { label: 'ATA de Reunião', bg: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' };
      case 'TAREFA':
        return { label: 'Tarefa Kanban', bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
      case 'LEAD':
        return { label: 'Lead CRM', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
      case 'CONTRATO':
        return { label: 'Contrato', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      default:
        return { label: 'Evento', bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' };
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER EXECUTIVO DE PRIMEIRO MUNDO */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Título & Indicadores rápidos */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B4D3E] to-teal-700 text-white flex items-center justify-center shadow-md shadow-[#1B4D3E]/20">
                  <CalendarIcon size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                    Calendário Global & Agenda Executiva
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Central integrada de Reuniões (ATAs), Tarefas, Vendas com Leads e Contratos.
                  </p>
                </div>
              </div>
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Botão Hoje */}
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
              >
                Hoje
              </button>

              {/* Navegação do Período */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                <button
                  onClick={prevPeriod}
                  className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-all cursor-pointer"
                  title="Período Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-xs font-black text-slate-800 min-w-[130px] text-center capitalize">
                  {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button
                  onClick={nextPeriod}
                  className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-all cursor-pointer"
                  title="Próximo Período"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Seletor de Modo (Mês / Semana / Agenda) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setViewMode('mes')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'mes' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Agenda
                </button>
              </div>

              {/* Botão Novo Evento */}
              <button
                onClick={() => {
                  setNewEventData(prev => ({ ...prev, data: todayStr }));
                  setShowNewModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#1B4D3E] hover:bg-[#13382d] text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>Novo Compromisso</span>
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS RÁPIDOS POR CATEGORIA (PILLS MODERNAS) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter size={12} /> Mostrar:
              </span>

              {[
                { id: 'TODOS', label: 'Todos os Itens', count: counts.todos, color: 'text-slate-700 bg-slate-100 border-slate-300' },
                { id: 'ATA', label: '🟣 Reuniões & ATAs', count: counts.ata, color: 'text-purple-700 bg-purple-50 border-purple-300' },
                { id: 'LEAD', label: '🟢 Leads CRM', count: counts.lead, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                { id: 'TAREFA', label: '🔵 Tarefas & Prazos', count: counts.tarefa, color: 'text-blue-700 bg-blue-50 border-blue-300' },
                { id: 'CONTRATO', label: '🟠 Contratos', count: counts.contrato, color: 'text-amber-700 bg-amber-50 border-amber-300' },
              ].map(cat => {
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filtro por Colaborador & Busca */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Busca por texto */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar compromisso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 w-48 font-medium"
                />
              </div>

              {/* Dropdown de Usuário */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="todos">👥 Toda a Equipe</option>
                <option value="meus">👤 Apenas Meus</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* ÁREA PRINCIPAL DO CALENDÁRIO */}
        <div className="flex-1 flex min-h-0 relative">
          
          {/* VISÃO: GRADE DO MÊS */}
          {viewMode === 'mes' && (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
              {/* Cabeçalho dos dias da semana */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center shrink-0">
                {WEEK_DAYS.map((w, idx) => (
                  <div key={idx} className="py-2.5 text-[11px] font-black text-slate-500 tracking-wider">
                    {w}
                  </div>
                ))}
              </div>

              {/* Grid dos dias */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 border-b border-slate-200 overflow-y-auto">
                {monthGridDays.map((cell, idx) => {
                  const dayEvents = eventsByDate.get(cell.dateStr) || [];
                  const isToday = cell.dateStr === todayStr;
                  const isSelected = selectedDayEvents?.dateStr === cell.dateStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDayEvents({ dateStr: cell.dateStr, dayNum: cell.dayNum })}
                      className={`min-h-[90px] border-r border-b border-slate-100 p-1.5 transition-all flex flex-col justify-between group cursor-pointer hover:bg-slate-50/80 ${
                        !cell.isCurrentMonth ? 'bg-slate-50/30 text-slate-400' : 'bg-white text-slate-800'
                      } ${isSelected ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/20' : ''}`}
                    >
                      {/* Topo da célula (Número do dia e contadores) */}
                      <div className="flex items-center justify-between">
                        <span 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isToday 
                              ? 'bg-emerald-600 text-white shadow-xs font-extrabold' 
                              : cell.isCurrentMonth ? 'text-slate-800 group-hover:bg-slate-200' : 'text-slate-400'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Lista de eventos do dia (chips) */}
                      <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const badge = getOriginBadge(ev.origem);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewEventModal(ev);
                              }}
                              className={`px-1.5 py-1 rounded-md text-[10px] font-bold border truncate flex items-center gap-1 transition-all hover:scale-[1.02] shadow-2xs ${
                                ev.concluida ? 'opacity-60 line-through' : ''
                              } ${badge.bg}`}
                              title={`${ev.hora || ''} - ${ev.titulo}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                              {ev.hora && <span className="font-mono text-[9px] opacity-80 shrink-0">{ev.hora}</span>}
                              <span className="truncate">{ev.titulo}</span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <div className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-center">
                            +{dayEvents.length - 3} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISÃO: AGENDA / TIMELINE EXECUTIVA */}
          {viewMode === 'agenda' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
                  <CalendarDays size={48} className="text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Nenhum compromisso encontrado</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Não há reuniões, atas ou tarefas para os filtros selecionados neste período.
                  </p>
                </div>
              ) : (
                filteredEvents.map(ev => {
                  const badge = getOriginBadge(ev.origem);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setViewEventModal(ev)}
                      className={`bg-white border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer border-slate-200/80 hover:border-emerald-300 ${
                        ev.concluida ? 'bg-slate-50/60 opacity-70' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Checkbox interativo */}
                        {(ev.origem === 'TAREFA' || ev.origem === 'EVENTO' || ev.id.startsWith('ata_acao_')) ? (
                          <button
                            onClick={(e) => handleToggleStatus(ev, e)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                            title={ev.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            {ev.concluida ? (
                              <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-100" />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>
                        ) : (
                          <span className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${badge.dot}`} />
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              📅 {new Date(ev.dataInicio).toLocaleDateString('pt-BR')} às {ev.hora || '09:00'}
                            </span>
                            {ev.prioridade && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 uppercase">
                                {ev.prioridade}
                              </span>
                            )}
                          </div>

                          <h4 className={`text-sm font-bold text-slate-900 truncate ${ev.concluida ? 'line-through text-slate-500' : ''}`}>
                            {ev.titulo}
                          </h4>

                          {ev.descricao && (
                            <p className="text-xs text-slate-500 line-clamp-1">{ev.descricao}</p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            {ev.responsavelNome && <span>👤 {ev.responsavelNome}</span>}
                            {ev.clienteNome && <span>🏢 {ev.clienteNome}</span>}
                            {ev.local && <span>📍 {ev.local}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Botão de Ação Direta */}
                      <div className="flex items-center gap-2 shrink-0">
                        {ev.linkUrl && (
                          <a
                            href={ev.linkUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                          >
                            <span>Ver Origem</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewEventModal(ev);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* DRAWER LATERAL: AGENDA DO DIA SELECIONADO */}
          {selectedDayEvents && (
            <div className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-xl animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                    Agenda do Dia
                  </span>
                  <h3 className="text-sm font-black text-slate-800 capitalize">
                    {new Date(selectedDayEvents.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista dos eventos daquele dia */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {(eventsByDate.get(selectedDayEvents.dateStr) || []).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CalendarDays size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-600">Nenhum evento neste dia</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Clique abaixo para agendar um compromisso.</p>
                  </div>
                ) : (
                  (eventsByDate.get(selectedDayEvents.dateStr) || []).map(ev => {
                    const badge = getOriginBadge(ev.origem);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setViewEventModal(ev)}
                        className="p-3 rounded-xl border border-slate-200/80 hover:border-emerald-300 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {ev.hora || '09:00'}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold text-slate-800 ${ev.concluida ? 'line-through text-slate-400' : ''}`}>
                          {ev.titulo}
                        </h4>
                        {ev.descricao && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{ev.descricao}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botão rápido para adicionar neste dia */}
              <div className="p-3 border-t border-slate-100 bg-white">
                <button
                  onClick={() => {
                    setNewEventData(prev => ({ ...prev, data: selectedDayEvents.dateStr }));
                    setShowNewModal(true);
                  }}
                  className="w-full py-2.5 bg-[#1B4D3E] hover:bg-[#13382d] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>Adicionar Compromisso Neste Dia</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CRIAÇÃO RÁPIDA DE COMPROMISSO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon size={18} className="text-emerald-600" />
                Novo Compromisso
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Título do Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião Comercial com Cliente"
                  value={newEventData.titulo}
                  onChange={(e) => setNewEventData({ ...newEventData, titulo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo</label>
                  <select
                    value={newEventData.tipo}
                    onChange={(e) => setNewEventData({ ...newEventData, tipo: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 font-bold"
                  >
                    <option value="REUNIAO">🤝 Reunião</option>
                    <option value="LIGACAO">📞 Ligação</option>
                    <option value="VISITA">🚗 Visita Presencial</option>
                    <option value="TAREFA">📋 Tarefa</option>
                    <option value="OUTRO">📌 Outro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Responsável</label>
                  <select
                    value={newEventData.userId}
                    onChange={(e) => setNewEventData({ ...newEventData, userId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 font-bold"
                  >
                    <option value="">👤 Eu ({currentUser?.nome?.split(' ')[0]})</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data</label>
                  <input
                    type="date"
                    required
                    value={newEventData.data}
                    onChange={(e) => setNewEventData({ ...newEventData, data: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Horário</label>
                  <input
                    type="time"
                    required
                    value={newEventData.hora}
                    onChange={(e) => setNewEventData({ ...newEventData, hora: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pauta / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais do compromisso..."
                  value={newEventData.descricao}
                  onChange={(e) => setNewEventData({ ...newEventData, descricao: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                >
                  Salvar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO EVENTO SELECIONADO */}
      {viewEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getOriginBadge(viewEventModal.origem).bg}`}>
                {getOriginBadge(viewEventModal.origem).label}
              </span>
              <button
                onClick={() => setViewEventModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {viewEventModal.titulo}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span>
                  {new Date(viewEventModal.dataInicio).toLocaleDateString('pt-BR')} às {viewEventModal.hora || '09:00'}
                </span>
              </p>
            </div>

            {viewEventModal.descricao && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                {viewEventModal.descricao}
              </div>
            )}

            <div className="space-y-1 text-xs text-slate-500 font-medium">
              {viewEventModal.responsavelNome && <p>👤 Responsável: <strong className="text-slate-700">{viewEventModal.responsavelNome}</strong></p>}
              {viewEventModal.clienteNome && <p>🏢 Cliente / Empresa: <strong className="text-slate-700">{viewEventModal.clienteNome}</strong></p>}
              {viewEventModal.local && <p>📍 Local: <strong className="text-slate-700">{viewEventModal.local}</strong></p>}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {(viewEventModal.id.startsWith('act_') || viewEventModal.id.startsWith('task_')) && (
                <button
                  onClick={() => handleDelete(viewEventModal.id)}
                  className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {viewEventModal.linkUrl && (
                  <a
                    href={viewEventModal.linkUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    <span>Abrir Módulo</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={() => setViewEventModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
