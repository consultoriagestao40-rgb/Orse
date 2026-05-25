'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { getEmails, deleteEmail, ParsedEmail } from './actions';
import { 
  Search, 
  Mail, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  Calendar, 
  Inbox, 
  Send, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  Clock,
  User,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function EmailCenterContent() {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get('leadId');

  const [emails, setEmails] = useState<ParsedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await getEmails();
      setEmails(data);
      
      // Auto-select email or pre-filter if leadIdParam is present
      if (data.length > 0) {
        if (leadIdParam) {
          const firstForLead = data.find(e => e.leadId === leadIdParam);
          setSelectedEmail(firstForLead || data[0]);
        } else {
          setSelectedEmail(data[0]);
        }
      } else {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de e-mail?')) return;
    
    setActionLoading(true);
    try {
      const res = await deleteEmail(id);
      if (res.success) {
        // Remove from list
        const updated = emails.filter(e => e.id !== id);
        setEmails(updated);
        
        // Update selected email
        if (selectedEmail?.id === id) {
          setSelectedEmail(updated.length > 0 ? updated[0] : null);
        }
      } else {
        alert('Erro ao excluir e-mail: ' + res.error);
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao excluir e-mail');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter emails based on search term and tab selection
  const filteredEmails = emails.filter(email => {
    // Lead ID preset filter
    if (leadIdParam && email.leadId !== leadIdParam) return false;

    // Tab Type Filter
    if (filterType === 'sent' && email.direction !== 'SENT') return false;
    if (filterType === 'received' && email.direction !== 'RECEIVED') return false;

    // Search Term Filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      email.subject.toLowerCase().includes(term) ||
      email.leadName.toLowerCase().includes(term) ||
      email.leadEmail.toLowerCase().includes(term) ||
      email.body.toLowerCase().includes(term) ||
      email.from.toLowerCase().includes(term) ||
      email.to.toLowerCase().includes(term)
    );
  });

  // Calculate dynamic stats
  const totalCount = emails.length;
  const sentCount = emails.filter(e => e.direction === 'SENT').length;
  const receivedCount = emails.filter(e => e.direction === 'RECEIVED').length;
  const uniqueLeadsCount = new Set(emails.map(e => e.leadId)).size;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Upper header block with metadata cards */}
      <div className="p-6 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#1B4D3E]/30 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-emerald-500/20">
              <Sparkles size={12} /> Email Center
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-100 mt-1">Gestão de E-mails</h1>
          <p className="text-xs md:text-sm text-slate-400">Histórico unificado de correspondências de leads</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadEmails}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl font-bold transition-all hover:border-slate-600 disabled:opacity-50"
            title="Recarregar e-mails"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-slate-950/30 border-b border-slate-800 shrink-0">
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Processado</p>
            <h3 className="text-lg font-black text-slate-100 mt-0.5">{totalCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            <Mail size={16} />
          </div>
        </div>
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Enviados</p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">{sentCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-center text-emerald-400">
            <Send size={16} />
          </div>
        </div>
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Recebidos</p>
            <h3 className="text-lg font-black text-blue-400 mt-0.5">{receivedCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-950/30 border border-blue-800/30 flex items-center justify-center text-blue-400">
            <Inbox size={16} />
          </div>
        </div>
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Leads Ativos</p>
            <h3 className="text-lg font-black text-purple-400 mt-0.5">{uniqueLeadsCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-center text-purple-400">
            <User size={16} />
          </div>
        </div>
      </div>

      {/* Main split work-area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Email List pane */}
        <div className="w-full lg:w-[420px] shrink-0 border-r border-slate-800 flex flex-col h-full bg-slate-950/15">
          {/* Filtering and search inputs */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/35 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input 
                type="text"
                placeholder="Buscar e-mails ou leads..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 transition-all"
              />
            </div>

            <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800/60">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('sent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'sent' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 shadow-sm' : 'text-slate-400 hover:text-emerald-400'}`}
              >
                <Send size={11} /> Enviados
              </button>
              <button
                onClick={() => setFilterType('received')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'received' ? 'bg-blue-950/50 text-blue-400 border border-blue-900/50 shadow-sm' : 'text-slate-400 hover:text-blue-400'}`}
              >
                <Inbox size={11} /> Recebidos
              </button>
            </div>
            
            {leadIdParam && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-400">
                <span>Filtrando por lead específico</span>
                <Link href="/emails" className="underline hover:text-amber-300 font-bold">Limpar filtro</Link>
              </div>
            )}
          </div>

          {/* Email Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin">
            {loading ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <RefreshCw className="animate-spin mx-auto text-emerald-500" size={24} />
                <p className="text-xs">Carregando e-mails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <AlertCircle className="mx-auto text-slate-600" size={32} />
                <p className="text-xs font-medium">Nenhum e-mail correspondente encontrado.</p>
              </div>
            ) : (
              filteredEmails.map(email => {
                const isSelected = selectedEmail?.id === email.id;
                const isSent = email.direction === 'SENT';
                
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer transition-all flex gap-3 relative ${
                      isSelected 
                        ? 'bg-slate-800/60 border-l-4 border-emerald-500' 
                        : 'hover:bg-slate-900/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Direction icon badge */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                      isSent 
                        ? 'bg-emerald-950/40 text-emerald-400' 
                        : 'bg-blue-950/40 text-blue-400'
                    }`}>
                      {isSent ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-xs text-slate-200 truncate">
                          {email.leadName}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-300 truncate mb-1">
                        {email.subject}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate line-clamp-1">
                        {email.body.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed preview window */}
        <div className="hidden lg:flex flex-1 flex-col h-full bg-slate-900/40 overflow-hidden">
          {selectedEmail ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header preview row */}
              <div className="p-6 bg-slate-950/45 border-b border-slate-800 shrink-0 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-slate-100">{selectedEmail.subject}</h2>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        selectedEmail.direction === 'SENT' 
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' 
                          : 'bg-blue-950/50 text-blue-400 border border-blue-900/50'
                      }`}>
                        {selectedEmail.direction === 'SENT' ? (
                          <>
                            <Send size={10} /> Enviado
                          </>
                        ) : (
                          <>
                            <Inbox size={10} /> Recebido
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={12} /> {new Date(selectedEmail.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads?leadId=${selectedEmail.leadId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-750 font-bold transition-all"
                      title="Ver Lead no Pipeline CRM"
                    >
                      Ver Lead <ExternalLink size={12} />
                    </Link>
                    <button
                      onClick={() => handleDelete(selectedEmail.commentId)}
                      disabled={actionLoading}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl border border-slate-700/80 hover:border-rose-900/30 transition-all"
                      title="Excluir histórico de e-mail"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Sender/Receiver Details metadata block */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">De:</span>
                    <span className="text-slate-300 font-bold">{selectedEmail.from}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-1.5">
                    <span className="text-slate-500 font-medium">Para:</span>
                    <span className="text-slate-300 font-bold">{selectedEmail.to}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/60 pt-1.5">
                    <span className="text-slate-500 font-medium">Lead Associado:</span>
                    <Link href={`/leads?leadId=${selectedEmail.leadId}`} className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                      {selectedEmail.leadName} ({selectedEmail.leadEmail})
                    </Link>
                  </div>
                </div>
              </div>

              {/* Email Content Body Preview */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20 text-sm text-slate-300 font-normal leading-relaxed whitespace-pre-wrap select-text scrollbar-thin">
                {selectedEmail.body}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-600">
                <Mail size={28} />
              </div>
              <h3 className="font-bold text-slate-300">Nenhum E-mail Selecionado</h3>
              <p className="text-xs max-w-sm">Selecione um e-mail na barra lateral para ler a correspondência completa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        }>
          <EmailCenterContent />
        </Suspense>
      </main>
    </div>
  );
}
