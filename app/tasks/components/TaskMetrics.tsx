import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, BarChart2 } from 'lucide-react';

interface TaskMetricsProps {
  tasks: any[];
  stages: any[];
}

export default function TaskMetrics({ tasks, stages }: TaskMetricsProps) {
  if (!tasks.length) return null;

  const totalTasks = tasks.length;

  // Identify completed stage (or status)
  const completedTasks = tasks.filter(t => 
    t.status === 'CONCLUIDA' || 
    t.stage?.nome.toLowerCase().includes('concluíd') ||
    t.stage?.nome.toLowerCase().includes('concluid')
  );

  const completedCount = completedTasks.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Overdue tasks (deadline passed, and not completed)
  const overdueTasks = tasks.filter(t => {
    if (!t.vencimento) return false;
    const isCompleted = 
      t.status === 'CONCLUIDA' || 
      t.stage?.nome.toLowerCase().includes('concluíd') ||
      t.stage?.nome.toLowerCase().includes('concluid');
    if (isCompleted) return false;
    return new Date(t.vencimento) < today;
  });

  const overdueCount = overdueTasks.length;

  // Tasks with deadline
  const tasksWithDeadline = tasks.filter(t => t.vencimento);
  const tasksWithDeadlineCount = tasksWithDeadline.length;

  // Efficiency (Completed Tasks / Total Tasks)
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Completed on time (completed, and vencimento was >= createdAt or not overdue at creation)
  const completedOnTime = completedTasks.filter(t => {
    if (!t.vencimento) return true; // No deadline = on time
    // If it was updated, we compare, but simple fallback is comparing vencimento to updatedAt
    return new Date(t.vencimento) >= new Date(t.updatedAt);
  }).length;

  const onTimeRate = completedCount > 0 ? Math.round((completedOnTime / completedCount) * 100) : 100;

  // Backlog/Pending Tasks count
  const pendingCount = totalTasks - completedCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 pt-4 mb-2 relative z-30">
      {/* Conclusão Rate */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Taxa de Conclusão</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-800">{completionRate}%</h4>
            <span className="text-xs font-semibold text-slate-400">({completedCount} de {totalTasks})</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={20} />
        </div>
      </div>

      {/* Overdue Count */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tarefas Atrasadas</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-rose-600">{overdueCount}</h4>
            <span className="text-xs font-semibold text-slate-400">pendentes vencidas</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <Clock size={20} />
        </div>
      </div>

      {/* On Time Rate */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entregas no Prazo</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-blue-600">{onTimeRate}%</h4>
            <span className="text-xs font-semibold text-slate-400">das concluídas</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <AlertTriangle size={20} />
        </div>
      </div>

      {/* Backlog */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">A Fazer / Pendentes</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-amber-600">{pendingCount}</h4>
            <span className="text-xs font-semibold text-slate-400">tarefas em andamento</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
          <BarChart2 size={20} />
        </div>
      </div>
    </div>
  );
}
