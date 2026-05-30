'use client';

import React from 'react';
import { X, Check, Eye, Calendar, Clock, BarChart3, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ClientTrackingModalProps {
  doc: any;
  onClose: () => void;
}

export default function ClientTrackingModal({ doc, onClose }: ClientTrackingModalProps) {
  // Configuração e tracking
  const config = doc.configApresentacao || {};
  const tracking = config.viewTracking || {
    firstSentAt: doc.createdAt,
    views: {
      apresentacao: 0,
      proposta: 0,
      fpv: 0,
      minuta: 0
    },
    history: []
  };

  const firstSentDate = tracking.firstSentAt ? new Date(tracking.firstSentAt) : new Date(doc.createdAt);
  const views = tracking.views || { apresentacao: 0, proposta: 0, fpv: 0, minuta: 0 };
  const history = tracking.history || [];

  const fmtDate = (d: any) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Encontra a data da primeira visualização de uma aba no histórico
  const getFirstViewedDate = (tabId: string) => {
    const found = history.find((h: any) => h.tab === tabId);
    return found ? fmtDate(found.viewedAt) : null;
  };

  // Encontra a data da última visualização de uma aba no histórico
  const getLastViewedDate = (tabId: string) => {
    const matches = history.filter((h: any) => h.tab === tabId);
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      return fmtDate(last.viewedAt);
    }
    return null;
  };

  // Status flags (making it case-insensitive and supporting both DocumentoProposta and Proposta statuses)
  const isApproved = doc.statusAssinatura === 'ASSINADO' || 
    doc.status?.toLowerCase() === 'aprovada' || 
    doc.status?.toLowerCase() === 'aprovado' || 
    doc.proposta?.status?.toLowerCase() === 'aprovada' || 
    doc.proposta?.status?.toLowerCase() === 'aprovado';

  const isRejected = doc.statusAssinatura === 'RECUSADO' || 
    doc.status?.toLowerCase() === 'recusada' || 
    doc.status?.toLowerCase() === 'recusado' || 
    doc.proposta?.status?.toLowerCase() === 'recusada' || 
    doc.proposta?.status?.toLowerCase() === 'recusado';

  const timelineItems = [
    {
      id: 'sent',
      title: '1. Proposta Criada e Link Gerado',
      subtitle: 'O link de acesso público do cliente foi gerado e enviado pela primeira vez.',
      checked: !!tracking.firstSentAt || !!doc.createdAt,
      dateText: fmtDate(firstSentDate),
      color: 'border-emerald-500 bg-emerald-500 text-white'
    },
    {
      id: 'apresentacao',
      title: '2. Apresentação (Slides) Visualizada',
      subtitle: 'O cliente visualizou as lâminas de apresentação e slides do Canva.',
      checked: (views.apresentacao || 0) > 0,
      dateText: getFirstViewedDate('apresentacao') ? `Primeiro acesso: ${getFirstViewedDate('apresentacao')}` : null,
      subText: (views.apresentacao || 0) > 1 ? `Visualizado de novo ${views.apresentacao - 1}x (Total: ${views.apresentacao} acessos)` : null,
      color: (views.apresentacao || 0) > 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
    },
    {
      id: 'proposta',
      title: '3. Proposta Comercial (A4) Visualizada',
      subtitle: 'O cliente visualizou o termo comercial A4 e a carta de apresentação.',
      checked: (views.proposta || 0) > 0,
      dateText: getFirstViewedDate('proposta') ? `Primeiro acesso: ${getFirstViewedDate('proposta')}` : null,
      subText: (views.proposta || 0) > 1 ? `Visualizado de novo ${views.proposta - 1}x (Total: ${views.proposta} acessos)` : null,
      color: (views.proposta || 0) > 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
    },
    {
      id: 'fpv',
      title: '4. Planilha FPV Detalhada Visualizada',
      subtitle: 'O cliente navegou pelas planilhas de custos (Premissas, Insumos, Quadro).',
      checked: (views.fpv || 0) > 0,
      dateText: getFirstViewedDate('fpv') ? `Primeiro acesso: ${getFirstViewedDate('fpv')}` : null,
      subText: (views.fpv || 0) > 1 ? `Visualizado de novo ${views.fpv - 1}x (Total: ${views.fpv} acessos)` : null,
      color: (views.fpv || 0) > 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
    },
    {
      id: 'minuta',
      title: '5. Minuta de Contrato Visualizada',
      subtitle: 'O cliente abriu e leu a minuta do contrato padrão anexada.',
      checked: (views.minuta || 0) > 0,
      dateText: getFirstViewedDate('minuta') ? `Primeiro acesso: ${getFirstViewedDate('minuta')}` : null,
      subText: (views.minuta || 0) > 1 ? `Visualizado de novo ${views.minuta - 1}x (Total: ${views.minuta} acessos)` : null,
      color: (views.minuta || 0) > 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'
    },
    {
      id: 'status',
      title: '6. Resposta Final do Cliente',
      subtitle: isApproved 
        ? `Aprovada e assinada eletronicamente por ${doc.nomeAssinante || 'Cliente'}.` 
        : isRejected 
        ? 'A proposta foi recusada/declinada pelo cliente final.' 
        : 'Aguardando decisão de aceite ou recusa pelo cliente.',
      checked: isApproved || isRejected,
      dateText: doc.dataAssinatura ? fmtDate(doc.dataAssinatura) : isRejected ? 'Status: Recusada' : null,
      isStatusStep: true,
      color: isApproved
        ? 'border-emerald-500 bg-emerald-500 text-white'
        : isRejected
        ? 'border-red-500 bg-red-500 text-white'
        : 'border-slate-200 bg-white text-slate-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 font-sans text-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white shrink-0">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" /> Linha do Tempo e Acessos do Cliente
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* RESUMO CARD */}
          <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col sm:flex-row items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1B4D3E]/10 rounded-2xl flex items-center justify-center shrink-0">
                <BarChart3 size={22} className="text-[#1B4D3E]" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-xs font-black uppercase text-slate-800">Visualizações da Proposta</h4>
                <p className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                  Monitoramento em tempo real das interações do cliente
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">TOTAL ACESSOS</span>
                <span className="text-xl font-black text-slate-800 mt-0.5 block leading-none">
                  {history.length}
                </span>
              </div>
              <div className="border-l border-slate-200" />
              <div className="text-center">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS ATUAL</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 block ${
                  doc.status === 'Aprovada'
                    ? 'bg-emerald-50 text-emerald-700'
                    : doc.status === 'Recusada'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {doc.status}
                </span>
              </div>
            </div>
          </div>

          {/* TAB VISUALIZATIONS GRID */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={13} /> Visualizações por Aba do Sistema
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '1. Slides / Apresentação', val: views.apresentacao || 0, bg: 'bg-indigo-50/40 border-indigo-100 text-indigo-750' },
                { label: '2. Proposta A4', val: views.proposta || 0, bg: 'bg-emerald-50/40 border-emerald-100 text-emerald-750' },
                { label: '3. FPV Detalhada', val: views.fpv || 0, bg: 'bg-amber-50/40 border-amber-100 text-amber-750' },
                { label: '4. Minuta de Contrato', val: views.minuta || 0, bg: 'bg-sky-50/40 border-sky-100 text-sky-750' },
              ].map((t, i) => (
                <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 ${t.bg}`}>
                  <span className="text-[9.5px] font-black uppercase tracking-wider leading-tight">{t.label}</span>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-black">{t.val}</span>
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">{t.val === 1 ? 'visita' : 'visitas'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LINE TIME VERTICAL */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={13} /> Histórico Chronológico de Aceite (Linha do Tempo)
            </h3>
            
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3">
              {timelineItems.map((item, idx) => {
                const isApprovedState = isApproved;
                const isRejectedState = isRejected;

                return (
                  <div key={item.id} className="relative">
                    
                    {/* Circle Node Icon */}
                    <div className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.color}`}>
                      {item.isStatusStep ? (
                        isApprovedState ? (
                          <ShieldCheck size={12} className="stroke-[3]" />
                        ) : isRejectedState ? (
                          <ShieldAlert size={12} className="stroke-[3]" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                        )
                      ) : item.checked ? (
                        <Check size={12} className="stroke-[3]" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="space-y-1.5 pl-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h4 className={`text-xs font-black uppercase tracking-wide ${
                          item.checked 
                            ? item.isStatusStep && isRejectedState 
                              ? 'text-red-700' 
                              : 'text-slate-800' 
                            : 'text-slate-400'
                        }`}>
                          {item.title}
                        </h4>
                        
                        {item.dateText && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1">
                            <Calendar size={10} /> {item.dateText}
                          </span>
                        )}
                      </div>

                      <p className={`text-[10px] leading-relaxed font-medium ${item.checked ? 'text-slate-500' : 'text-slate-350 italic'}`}>
                        {item.subtitle}
                      </p>

                      {item.subText && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[9px] font-black text-emerald-700 uppercase tracking-wider mt-1">
                          🔔 {item.subText}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-[#1B4D3E] hover:bg-[#13382D] transition-colors shadow-md shadow-emerald-950/10 cursor-pointer"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}
