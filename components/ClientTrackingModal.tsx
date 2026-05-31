'use client';

import React from 'react';
import { X, Check, Eye, Calendar, Clock, BarChart3, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ClientTrackingModalProps {
  doc: any;
  onClose: () => void;
  onRefresh?: () => void;
}

function NegotiationItem({ item, doc, onRefresh }: { item: any; doc: any; onRefresh?: () => void }) {
  const [replyText, setReplyText] = React.useState('');
  const [submittingReply, setSubmittingReply] = React.useState(false);
  const [alertState, setAlertState] = React.useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', onConfirm?: () => void) => {
    setAlertState({ type, title, message, onConfirm });
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const { responderAjusteAction } = await import('@/app/propostas-comerciais/actions');
      const res = await responderAjusteAction(doc.id, item.id, replyText);
      if (res.success) {
        showAlert('Sucesso', 'Resposta registrada com sucesso!', 'success', () => {
          setReplyText('');
          if (onRefresh) onRefresh();
        });
      } else {
        showAlert('Erro ao responder', res.error, 'error');
      }
    } catch (err: any) {
      showAlert('Erro Inesperado', err.message, 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const clientInitials = (item.nomeCliente || 'Cliente')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sellerAvatar = doc.proposta?.user?.avatarUrl || doc.avatarUrl;
  const sellerName = item.nomeVendedor || doc.proposta?.user?.nome || doc.usuario || 'Consultor';
  const sellerInitials = sellerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm text-left relative">
      
      {/* CLIENT REQUEST HEADER WITH AVATAR */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm uppercase border border-blue-200 shadow-sm shrink-0">
            {clientInitials}
          </div>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded leading-none ${
              item.tipo === 'recusa' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
            }`}>
              {item.tipo === 'recusa' ? 'Recusa / Declínio' : 'Ajuste / Contraproposta'}
            </span>
            <span className="text-xs font-black text-slate-800 block mt-1.5 leading-tight">{item.nomeCliente || 'Cliente'}</span>
          </div>
        </div>
        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider shrink-0">
          {new Date(item.data).toLocaleString('pt-BR')}
        </span>
      </div>

      <div className="pl-13">
        <div className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-line bg-white border border-slate-150 p-4 rounded-2xl rounded-tl-none shadow-inner">
          {item.mensagem}
        </div>
      </div>

      {/* SELLER RESPONSE SECTION */}
      {item.respondida ? (
        <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-3">
              {sellerAvatar ? (
                <img 
                  src={sellerAvatar} 
                  alt={sellerName} 
                  className="w-10 h-10 rounded-full object-cover border border-emerald-200 shadow-sm shrink-0 animate-fadeIn"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm uppercase border border-emerald-200 shadow-sm shrink-0">
                  {sellerInitials}
                </div>
              )}
              <div>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider leading-none font-bold border border-emerald-200">
                  ✓ Resposta do Consultor
                </span>
                <span className="text-xs font-black text-slate-800 block mt-1.5 leading-tight">{sellerName}</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-455 font-mono tracking-wider shrink-0">
              {new Date(item.dataResposta).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="pl-13">
            <div className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-line bg-emerald-50/20 p-4 rounded-2xl rounded-tl-none shadow-sm border border-emerald-100">
              {item.resposta}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 border-t border-slate-100 pt-4 mt-4">
          
          {/* Form Header with Seller avatar to show who is replying */}
          <div className="flex items-center gap-3 mb-2">
            {sellerAvatar ? (
              <img 
                src={sellerAvatar} 
                alt={sellerName} 
                className="w-8 h-8 rounded-full object-cover border border-emerald-105 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center font-black text-xs uppercase border border-slate-200 shrink-0">
                {sellerInitials}
              </div>
            )}
            <div>
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">RESPONDER COMO:</span>
              <span className="text-[11px] font-bold text-slate-700 block leading-tight">{sellerName}</span>
            </div>
          </div>

          <textarea
            rows={3}
            placeholder="Digite a resposta ou contraproposta que ficará disponível na área do cliente..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-850 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] shadow-inner resize-none transition-all placeholder:text-slate-400"
          />
          <div className="flex justify-end">
            <button
              disabled={!replyText.trim() || submittingReply}
              onClick={handleSendReply}
              className="px-5 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-[1px] active:translate-y-0"
            >
              {submittingReply ? 'Enviando...' : 'Enviar Resposta'}
            </button>
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM ALERT DIALOG */}
      {alertState && (
        <div className="fixed inset-0 bg-black/60 z-[1000000] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-150 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            {alertState.type === 'success' && (
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm shrink-0 animate-bounce">
                <Check size={32} className="stroke-[3]" />
              </div>
            )}

            {alertState.type === 'error' && (
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm shrink-0 animate-bounce">
                <X size={32} className="stroke-[3]" />
              </div>
            )}

            {alertState.type === 'warning' && (
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 border border-amber-100 shadow-sm shrink-0">
                <ShieldAlert size={32} className="stroke-[3]" />
              </div>
            )}

            <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wider">
              {alertState.title}
            </h3>
            
            <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[280px]">
              {alertState.message}
            </p>

            <button
              onClick={() => {
                const onConfirm = alertState.onConfirm;
                setAlertState(null);
                if (onConfirm) onConfirm();
              }}
              className="w-full mt-6 py-3.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all active:translate-y-0.5 transform cursor-pointer text-center"
            >
              Entendi
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientTrackingModal({ doc, onClose, onRefresh }: ClientTrackingModalProps) {
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

  const [activeTab, setActiveTab] = React.useState<'visitas' | 'negociacoes'>('visitas');

  const firstSentDate = tracking.firstSentAt ? new Date(tracking.firstSentAt) : new Date(doc.createdAt);
  const views = tracking.views || { apresentacao: 0, proposta: 0, fpv: 0, minuta: 0 };
  const history = tracking.history || [];

  const negotiations = config.negotiations || [];
  const pendingNegotiationsCount = negotiations.filter((n: any) => !n.respondida).length;

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

        {/* TAB SELECTOR */}
        <div className="flex border-b border-slate-200 px-6 sm:px-8 shrink-0 bg-slate-50">
          <button
            onClick={() => setActiveTab('visitas')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'visitas'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Eye size={14} /> Acessos e Visitas
          </button>
          <button
            onClick={() => setActiveTab('negociacoes')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'negociacoes'
                ? 'border-[#1B4D3E] text-[#1B4D3E]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity size={14} /> Ajustes e Negociações
            {pendingNegotiationsCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2 animate-pulse" />
            )}
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

          {/* ── CONTEÚDO DA ABA DE VISITAS ───────────────────────────────────── */}
          {activeTab === 'visitas' && (
            <>
              {/* TAB VISUALIZATIONS GRID */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-left">
                  <Eye size={13} /> Visualizações por Aba do Sistema
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '1. Slides / Apresentação', val: views.apresentacao || 0, bg: 'bg-indigo-50/40 border-indigo-100 text-indigo-750' },
                    { label: '2. Proposta A4', val: views.proposta || 0, bg: 'bg-emerald-50/40 border-emerald-100 text-emerald-750' },
                    { label: '3. FPV Detalhada', val: views.fpv || 0, bg: 'bg-amber-50/40 border-amber-100 text-amber-750' },
                    { label: '4. Minuta de Contrato', val: views.minuta || 0, bg: 'bg-sky-50/40 border-sky-100 text-sky-750' },
                  ].map((t, i) => (
                    <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 text-left ${t.bg}`}>
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-left">
                  <Clock size={13} /> Histórico Chronológico de Aceite (Linha do Tempo)
                </h3>
                
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 ml-3 text-left">
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
            </>
          )}

          {/* ── CONTEÚDO DA ABA DE NEGOCIAÇÕES ───────────────────────────────── */}
          {activeTab === 'negociacoes' && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 text-left">
                <Activity size={13} /> Histórico de Ajustes e Contrapropostas do Cliente
              </h3>

              {negotiations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                  Nenhuma solicitação de ajuste ou contraproposta enviada pelo cliente ainda.
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {negotiations.map((item: any) => (
                    <NegotiationItem 
                      key={item.id} 
                      item={item} 
                      doc={doc} 
                      onRefresh={onRefresh} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
