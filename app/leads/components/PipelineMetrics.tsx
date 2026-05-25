import React from 'react';
import { TrendingUp, Users, Target, XCircle } from 'lucide-react';

export default function PipelineMetrics({ leads, stages }: { leads: any[], stages: any[] }) {
  if (!stages.length || !leads.length) return null;

  // Identify key stages based on names dynamically
  const findStage = (keywords: string[]) => stages.find(s => keywords.some(k => s.nome.toLowerCase().includes(k)));

  const stageContato = findStage(['contato']);
  const stageReuniao = findStage(['reunião', 'reuniao', 'agendada']);
  const stageQualificado = findStage(['qualificado', 'ganho', 'convertido']);
  const stageDesqualificado = findStage(['desqualificado', 'perdido']);

  // Helper to count leads currently in a stage OR past it (assuming linear success)
  const getReachedCount = (targetStage: any) => {
    if (!targetStage) return 0;
    return leads.filter(l => {
      const leadStage = stages.find(s => s.id === l.stageId);
      if (!leadStage) return false;
      // Se for desqualificado, ele não avançou mais no funil
      if (stageDesqualificado && leadStage.id === stageDesqualificado.id) return false;
      return leadStage.ordem >= targetStage.ordem;
    }).length;
  };

  const totalLeads = leads.length;
  
  const countContato = getReachedCount(stageContato);
  const countReuniao = getReachedCount(stageReuniao);
  const countQualificado = getReachedCount(stageQualificado);
  const countDesqualificado = leads.filter(l => l.stageId === stageDesqualificado?.id).length;

  const percContatoToReuniao = countContato > 0 ? Math.round((countReuniao / countContato) * 100) : 0;
  const percReuniaoToQualificado = countReuniao > 0 ? Math.round((countQualificado / countReuniao) * 100) : 0;
  const percTotalToQualificado = totalLeads > 0 ? Math.round((countQualificado / totalLeads) * 100) : 0;
  const percDesqualificado = totalLeads > 0 ? Math.round((countDesqualificado / totalLeads) * 100) : 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contato p/ Reunião</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-800">{percContatoToReuniao}%</h4>
            <span className="text-sm font-medium text-slate-400">({countReuniao}/{countContato})</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
          <Users size={20} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reunião p/ Conversão</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-800">{percReuniaoToQualificado}%</h4>
            <span className="text-sm font-medium text-slate-400">({countQualificado}/{countReuniao})</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <TrendingUp size={20} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Conversão Global</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-slate-800">{percTotalToQualificado}%</h4>
            <span className="text-sm font-medium text-slate-400">({countQualificado}/{totalLeads})</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
          <Target size={20} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Desqualificados</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-rose-600">{percDesqualificado}%</h4>
            <span className="text-sm font-medium text-slate-400">({countDesqualificado}/{totalLeads})</span>
          </div>
        </div>
        <div className="w-10 h-10 shrink-0 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <XCircle size={20} />
        </div>
      </div>
    </div>
  );
}
