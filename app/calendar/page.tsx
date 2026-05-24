'use client';

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActivities } from '../leads/actions';

import Sidebar from '@/components/Sidebar';

export default function CalendarPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const res = await getActivities();
    if (res.success) setActivities(res.activities);
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

  const getActivitiesForDay = (day: number) => {
    return activities.filter(a => {
      const d = new Date(a.dataInicio);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 bg-white border-b border-slate-200 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-[#1B4D3E]" size={24} /> Calendário Global
              </h1>
              <p className="text-sm text-slate-500">Acompanhe suas reuniões e compromissos com Leads.</p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
              <span className="font-bold text-lg text-slate-800 w-48 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              <button onClick={nextMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><ChevronRight size={20}/></button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[120px]">
              {days.map((day, idx) => {
                const dayActivities = day ? getActivitiesForDay(day) : [];
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                
                return (
                  <div key={idx} className={`border-b border-r border-slate-200 p-2 ${!day ? 'bg-slate-50' : 'bg-white'} ${isToday ? 'bg-emerald-50' : ''}`}>
                    {day && (
                      <>
                        <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-[#1B4D3E] text-white' : 'text-slate-600'}`}>
                          {day}
                        </div>
                        <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                          {dayActivities.map(a => (
                            <div key={a.id} className="text-[10px] bg-[#1B4D3E] text-white p-1 rounded font-medium leading-tight truncate px-1.5 cursor-pointer hover:opacity-80 transition-opacity" title={a.titulo}>
                              {new Date(a.dataInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {a.lead?.nomeFantasia || a.titulo}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
