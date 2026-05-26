'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  getEmails, 
  deleteEmail, 
  ParsedEmail,
  getSmtpAccounts,
  createSmtpAccount,
  updateSmtpAccount,
  deleteSmtpAccount,
  toggleSmtpAccountActive,
  syncEmailsFromImap,
  testSmtpConnection,
  testImapConnection
} from './actions';
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
  RefreshCw, 
  AlertCircle,
  User,
  Sparkles,
  Settings,
  X,
  Plus,
  Check,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function EmailCenterContent() {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get('leadId');

  // Core Emails State
  const [emails, setEmails] = useState<ParsedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // SMTP Accounts State
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  
  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState({
    id: '',
    nome: '',
    host: '',
    port: 587,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    active: true,
    imapHost: '',
    imapPort: 993
  });
  
  const [isEditingSmtp, setIsEditingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Connection Test States
  const [smtpTestResult, setSmtpTestResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);
  const [imapTestResult, setImapTestResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingImap, setTestingImap] = useState(false);

  const handleTestSmtp = async () => {
    if (!smtpForm.host.trim() || !smtpForm.user.trim()) {
      alert('Preencha o servidor e usuário SMTP de saída antes de testar.');
      return;
    }
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await testSmtpConnection(smtpForm);
      setSmtpTestResult(res);
    } catch (err: any) {
      setSmtpTestResult({ success: false, error: err.message || String(err) });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestImap = async () => {
    if (!smtpForm.imapHost?.trim() || !smtpForm.user.trim()) {
      alert('Preencha o servidor IMAP de entrada e usuário antes de testar.');
      return;
    }
    setTestingImap(true);
    setImapTestResult(null);
    try {
      const res = await testImapConnection({
        imapHost: smtpForm.imapHost,
        imapPort: Number(smtpForm.imapPort),
        user: smtpForm.user,
        password: smtpForm.password,
        id: smtpForm.id
      });
      setImapTestResult(res);
    } catch (err: any) {
      setImapTestResult({ success: false, error: err.message || String(err) });
    } finally {
      setTestingImap(false);
    }
  };

  useEffect(() => {
    loadEmails();
    loadSmtpAccounts();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      // 1. Sincroniza e-mails via IMAP do banco
      const syncRes = await syncEmailsFromImap();
      if (syncRes && !syncRes.success) {
        console.warn('⚠️ Falha parcial na sincronização IMAP:', syncRes.error);
      } else if (syncRes && syncRes.count && syncRes.count > 0) {
        console.log(`📧 Importados ${syncRes.count} novos e-mails via IMAP!`);
      }

      // 2. Carrega todos os e-mails registrados
      const data = await getEmails();
      setEmails(data);
      
      // Auto-select lead or pre-filter if leadIdParam is present
      if (data.length > 0) {
        if (leadIdParam) {
          setSelectedLeadId(leadIdParam);
        } else {
          setSelectedLeadId(data[0].leadId);
        }
      } else {
        setSelectedLeadId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSmtpAccounts = async () => {
    try {
      const res = await getSmtpAccounts();
      if (res.success) {
        setSmtpAccounts(res.accounts || []);
      }
    } catch (err) {
      console.error('Erro ao carregar contas SMTP:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de e-mail?')) return;
    
    setActionLoading(true);
    try {
      const res = await deleteEmail(id);
      if (res.success) {
        const updated = emails.filter(e => e.id !== id);
        setEmails(updated);
        
        // Se deletamos o último e-mail do lead selecionado, selecionamos outro
        const remainingForSelectedLead = updated.filter(e => e.leadId === selectedLeadId);
        if (remainingForSelectedLead.length === 0) {
          if (updated.length > 0) {
            setSelectedLeadId(updated[0].leadId);
          } else {
            setSelectedLeadId(null);
          }
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

  // SMTP Event Handlers
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.nome.trim() || !smtpForm.host.trim() || !smtpForm.user.trim() || !smtpForm.fromEmail.trim() || !smtpForm.fromName.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSmtpLoading(true);
    try {
      let res;
      const payload = {
        ...smtpForm,
        port: Number(smtpForm.port),
        imapPort: smtpForm.imapPort ? Number(smtpForm.imapPort) : 993
      };

      if (isEditingSmtp && smtpForm.id) {
        res = await updateSmtpAccount(smtpForm.id, payload);
      } else {
        res = await createSmtpAccount(payload);
      }

      if (res.success) {
        setSmtpForm({
          id: '',
          nome: '',
          host: '',
          port: 587,
          user: '',
          password: '',
          fromEmail: '',
          fromName: '',
          active: true,
          imapHost: '',
          imapPort: 993
        });
        setIsEditingSmtp(false);
        await loadSmtpAccounts();
        alert(isEditingSmtp ? 'Conta atualizada com sucesso!' : 'Nova conta cadastrada com sucesso!');
      } else {
        alert('Erro ao salvar conta: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro ao cadastrar conta: ' + (err.message || String(err)));
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleEditSmtpClick = (account: any) => {
    setSmtpForm({
      id: account.id,
      nome: account.nome,
      host: account.host,
      port: account.port,
      user: account.user,
      password: '', // Deixar a senha em branco por segurança, preenche se quiser alterar
      fromEmail: account.fromEmail,
      fromName: account.fromName,
      active: account.active,
      imapHost: account.imapHost || '',
      imapPort: account.imapPort || 993
    });
    setIsEditingSmtp(true);
  };

  const handleDeleteSmtpClick = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta conta SMTP? Os envios dinâmicos por ela serão desativados.')) return;
    setSmtpLoading(true);
    try {
      const res = await deleteSmtpAccount(id);
      if (res.success) {
        await loadSmtpAccounts();
      } else {
        alert('Erro ao excluir conta SMTP: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err.message || String(err)));
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleToggleSmtpActiveClick = async (id: string, currentActive: boolean) => {
    setSmtpLoading(true);
    try {
      const res = await toggleSmtpAccountActive(id, !currentActive);
      if (res.success) {
        await loadSmtpAccounts();
      } else {
        alert('Erro ao alterar status de ativação: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + (err.message || String(err)));
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setSmtpForm({
      id: '',
      nome: '',
      host: '',
      port: 587,
      user: '',
      password: '',
      fromEmail: '',
      fromName: '',
      active: true,
      imapHost: '',
      imapPort: 993
    });
    setIsEditingSmtp(false);
    setSmtpTestResult(null);
    setImapTestResult(null);
    setShowPassword(false);
  };

  // Filter emails based on search term and tab selection
  const filteredEmails = emails.filter(email => {
    if (leadIdParam && email.leadId !== leadIdParam) return false;
    if (filterType === 'sent' && email.direction !== 'SENT') return false;
    if (filterType === 'received' && email.direction !== 'RECEIVED') return false;

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

  // Interface para agrupamento de e-mails por Lead (Threads)
  interface EmailThread {
    leadId: string;
    leadName: string;
    leadEmail: string;
    emails: ParsedEmail[];
    lastActivity: Date;
    latestSubject: string;
    latestBodyPreview: string;
    latestDirection: 'SENT' | 'RECEIVED';
  }

  const threadsMap: { [key: string]: EmailThread } = {};

  filteredEmails.forEach(email => {
    if (!threadsMap[email.leadId]) {
      threadsMap[email.leadId] = {
        leadId: email.leadId,
        leadName: email.leadName,
        leadEmail: email.leadEmail || '',
        emails: [],
        lastActivity: new Date(email.createdAt),
        latestSubject: email.subject,
        latestBodyPreview: email.body,
        latestDirection: email.direction
      };
    }
    
    threadsMap[email.leadId].emails.push(email);
    
    const emailDate = new Date(email.createdAt);
    if (emailDate > threadsMap[email.leadId].lastActivity) {
      threadsMap[email.leadId].lastActivity = emailDate;
      threadsMap[email.leadId].latestSubject = email.subject;
      threadsMap[email.leadId].latestBodyPreview = email.body;
      threadsMap[email.leadId].latestDirection = email.direction;
    }
  });

  const threads = Object.values(threadsMap).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  // Encontra a thread atualmente selecionada
  const selectedThread = threads.find(t => t.leadId === selectedLeadId) || (selectedLeadId ? {
    leadId: selectedLeadId,
    leadName: emails.find(e => e.leadId === selectedLeadId)?.leadName || 'Sem Nome',
    leadEmail: emails.find(e => e.leadId === selectedLeadId)?.leadEmail || '',
    emails: emails.filter(e => e.leadId === selectedLeadId),
    lastActivity: new Date(),
    latestSubject: '',
    latestBodyPreview: '',
    latestDirection: 'SENT' as const
  } : null);

  // Ordena os e-mails da thread selecionada (mais recentes no topo)
  const threadEmailsSorted = selectedThread 
    ? [...selectedThread.emails].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-700 overflow-hidden font-sans">
      {/* Upper header block with metadata cards */}
      <div className="p-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-xs px-2.5 py-1 rounded-full font-black flex items-center gap-1 border border-[#1B4D3E]/20">
              <Sparkles size={12} /> Email Center
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 mt-1 uppercase tracking-wider">Gestão de E-mails</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight">Histórico unificado de correspondências de leads</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSmtpModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl font-bold transition-all shadow-sm flex-shrink-0"
            title="Configurar contas SMTP de e-mail"
          >
            <Settings size={15} />
            Configurar Contas
          </button>

          <button 
            onClick={loadEmails}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs md:text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold transition-all disabled:opacity-50 flex-shrink-0"
            title="Recarregar e-mails"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Total Processado</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{totalCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
            <Mail size={16} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-black">Enviados</p>
            <h3 className="text-lg font-black text-emerald-600 mt-0.5">{sentCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Send size={16} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-blue-600 font-black">Recebidos</p>
            <h3 className="text-lg font-black text-blue-600 mt-0.5">{receivedCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Inbox size={16} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-purple-600 font-black">Leads Ativos</p>
            <h3 className="text-lg font-black text-purple-600 mt-0.5">{uniqueLeadsCount}</h3>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <User size={16} />
          </div>
        </div>
      </div>

      {/* Main split work-area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Email List pane */}
        <div className="w-full lg:w-[420px] shrink-0 border-r border-slate-200 flex flex-col h-full bg-white">
          {/* Filtering and search inputs */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text"
                placeholder="Buscar e-mails ou leads..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/30 transition-all font-medium"
              />
            </div>

            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('sent')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'text-slate-500 hover:text-emerald-700'}`}
              >
                <Send size={11} /> Enviados
              </button>
              <button
                onClick={() => setFilterType('received')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filterType === 'received' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-500 hover:text-blue-700'}`}
              >
                <Inbox size={11} /> Recebidos
              </button>
            </div>
            
            {leadIdParam && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-bold">
                <span>Filtrando por lead específico</span>
                <Link href="/emails" className="underline hover:text-amber-800 font-bold">Limpar filtro</Link>
              </div>
            )}
          </div>

          {/* Email Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
            {loading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="animate-spin mx-auto text-[#1B4D3E]" size={24} />
                <p className="text-xs font-bold uppercase tracking-wider">Carregando e-mails...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <AlertCircle className="mx-auto text-slate-300" size={32} />
                <p className="text-xs font-bold uppercase tracking-wider">Nenhum e-mail encontrado.</p>
              </div>
            ) : (
              threads.map(thread => {
                const isSelected = selectedLeadId === thread.leadId;
                const isSent = thread.latestDirection === 'SENT';
                
                return (
                  <div
                    key={thread.leadId}
                    onClick={() => setSelectedLeadId(thread.leadId)}
                    className={`p-4 cursor-pointer transition-all flex gap-3 relative border-b border-slate-100 ${
                      isSelected 
                        ? 'bg-slate-50/80 border-l-4 border-[#1B4D3E]' 
                        : 'hover:bg-slate-50/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Icon indicating lead thread */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1B4D3E] font-black text-sm uppercase">
                        {thread.leadName.charAt(0)}
                      </div>
                      {/* Sub-badge indicating latest activity direction */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-2xs ${
                        isSent ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {isSent ? <Send size={9} /> : <Inbox size={9} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-xs text-slate-800 truncate" title={thread.leadName}>
                          {thread.leadName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-bold">
                          {thread.lastActivity.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]" title={thread.leadEmail}>
                          {thread.leadEmail || 'Sem e-mail cadastrado'}
                        </span>
                        <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-[9px] px-1.5 py-0.2 rounded-full font-extrabold border border-[#1B4D3E]/15 shrink-0">
                          {thread.emails.length} {thread.emails.length === 1 ? 'e-mail' : 'e-mails'}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-extrabold text-slate-600 truncate">
                        {thread.latestSubject || 'Sem Assunto'}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate line-clamp-1">
                        {thread.latestBodyPreview.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed preview window */}
        <div className="hidden lg:flex flex-1 flex-col h-full bg-[#F8FAFC] overflow-hidden">
          {selectedThread ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header preview row */}
              <div className="p-6 bg-white border-b border-slate-200 shrink-0 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-[#1B4D3E] uppercase tracking-wide flex items-center gap-2">
                      Histórico com: {selectedThread.leadName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] border bg-[#1B4D3E]/5 text-[#1B4D3E] border-[#1B4D3E]/15">
                        <Mail size={10} /> {selectedThread.emails.length} {selectedThread.emails.length === 1 ? 'E-mail trocado' : 'E-mails trocados'}
                      </span>
                      {selectedThread.leadEmail && (
                        <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                          {selectedThread.leadEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads?leadId=${selectedThread.leadId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-350 hover:text-slate-900 font-bold transition-all shadow-xs"
                      title="Ver Lead no Pipeline CRM"
                    >
                      Ver Lead <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Emails Chronological Timeline List */}
              <div className="flex-1 p-6 overflow-y-auto bg-[#F8FAFC] scrollbar-thin space-y-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {threadEmailsSorted.map((email) => {
                    const isSent = email.direction === 'SENT';
                    return (
                      <div 
                        key={email.id} 
                        className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:shadow-xs"
                      >
                        {/* Card Header */}
                        <div className={`px-5 py-3.5 border-b flex justify-between items-center ${
                          isSent ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-blue-50/20 border-blue-100/50'
                        }`}>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                              isSent 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {isSent ? <Send size={10} /> : <Inbox size={10} />}
                              {isSent ? 'E-mail Enviado' : 'E-mail Recebido'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar size={11} /> {new Date(email.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(email.commentId)}
                            disabled={actionLoading}
                            className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-100 transition-all shadow-3xs"
                            title="Excluir este e-mail do histórico"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Card Metadata info */}
                        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 text-xs space-y-1 font-semibold text-slate-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                            <div><span className="text-slate-400 uppercase text-[9px] tracking-wider font-bold">De:</span> <span className="text-slate-600 font-bold">{email.from}</span></div>
                            <div><span className="text-slate-400 uppercase text-[9px] tracking-wider font-bold">Para:</span> <span className="text-slate-600 font-bold">{email.to}</span></div>
                          </div>
                          <div className="pt-0.5"><span className="text-slate-400 uppercase text-[9px] tracking-wider font-bold">Assunto:</span> <span className="text-slate-700 font-extrabold">{email.subject}</span></div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 text-xs md:text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-wrap select-text bg-white">
                          {email.body}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-300">
                <Mail size={28} />
              </div>
              <h3 className="font-bold text-slate-700 uppercase tracking-wider">Nenhum Lead Selecionado</h3>
              <p className="text-xs max-w-xs font-bold text-slate-400">Selecione um lead na barra lateral para ver o histórico completo de correspondências.</p>
            </div>
          )}
        </div>
      </div>

      {/* SMTP Accounts Configuration Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white shrink-0">
              <h2 className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} /> Contas de E-mail (SMTP)
              </h2>
              <button 
                onClick={() => {
                  setShowSmtpModal(false);
                  handleCancelEdit();
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Alert fallback */}
              {smtpAccounts.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                    <AlertCircle size={14} /> Nenhuma conta SMTP cadastrada no banco de dados
                  </p>
                  <p>O sistema está utilizando as configurações SMTP padrão definidas no arquivo <code>.env</code> do servidor. Cadastre uma nova conta abaixo para personalizar e gerenciar o envio dinamicamente.</p>
                </div>
              )}

              {/* Accounts List */}
              {smtpAccounts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Contas Cadastradas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {smtpAccounts.map((account) => (
                      <div 
                        key={account.id} 
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          account.active 
                            ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs' 
                            : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-slate-800 truncate uppercase">{account.nome}</span>
                            
                            {/* Toggle active state */}
                            <button
                              onClick={() => handleToggleSmtpActiveClick(account.id, account.active)}
                              disabled={smtpLoading}
                              className={`flex items-center gap-1 transition-all ${account.active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                              title={account.active ? 'Desativar conta SMTP' : 'Ativar conta SMTP'}
                            >
                              {account.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                          </div>
                          
                          <div className="text-[11px] text-slate-500 font-medium space-y-0.5">
                            <p className="truncate"><span className="font-bold">E-mail:</span> {account.user}</p>
                            <p className="truncate"><span className="font-bold">SMTP (Saída):</span> {account.host}:{account.port}</p>
                            <p className="truncate"><span className="font-bold">IMAP (Entrada):</span> {account.imapHost ? `${account.imapHost}:${account.imapPort || 993}` : 'Não configurado'}</p>
                            <p className="truncate"><span className="font-bold">Remetente:</span> {account.fromName} &lt;{account.fromEmail}&gt;</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-2 shrink-0">
                          <button
                            onClick={() => handleEditSmtpClick(account)}
                            className="p-1 px-2.5 text-[10px] font-bold text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-1 transition-all"
                          >
                            <Edit2 size={11} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSmtpClick(account.id)}
                            disabled={smtpLoading}
                            className="p-1 px-2.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1 transition-all"
                          >
                            <Trash2 size={11} /> Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form block */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                    <Plus size={15} /> {isEditingSmtp ? 'Editar Configurações SMTP' : 'Cadastrar Nova Conta SMTP'}
                  </h3>
                  {isEditingSmtp && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Identificação */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nome de Identificação *</label>
                      <input 
                        type="text"
                        placeholder="Ex: Suporte SmartBid, Vendas"
                        required
                        value={smtpForm.nome}
                        onChange={e => setSmtpForm({...smtpForm, nome: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* SMTP Host */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Servidor de Saída (SMTP / Host) *</label>
                      <input 
                        type="text"
                        placeholder="Ex: smtp.titan.email, smtp.umbler.com"
                        required
                        value={smtpForm.host}
                        onChange={e => setSmtpForm({...smtpForm, host: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* SMTP Port */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Porta de Saída (SMTP) *</label>
                      <input 
                        type="number"
                        placeholder="587 (TLS) ou 465 (SSL)"
                        required
                        value={smtpForm.port}
                        onChange={e => setSmtpForm({...smtpForm, port: parseInt(e.target.value) || 587})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* SMTP User */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usuário/E-mail de Login *</label>
                      <input 
                        type="email"
                        placeholder="Ex: suporte@smartbid.com"
                        required
                        value={smtpForm.user}
                        onChange={e => setSmtpForm({...smtpForm, user: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* SMTP Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Senha SMTP {isEditingSmtp ? '(Deixe em branco para não alterar)' : '*'}
                      </label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••••"
                          required={!isEditingSmtp}
                          value={smtpForm.password}
                          onChange={e => setSmtpForm({...smtpForm, password: e.target.value})}
                          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                          title={showPassword ? "Ocultar senha" : "Ver senha"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Sender Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nome do Remetente *</label>
                      <input 
                        type="text"
                        placeholder="Ex: SmartBid, Comercial"
                        required
                        value={smtpForm.fromName}
                        onChange={e => setSmtpForm({...smtpForm, fromName: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* Sender Email */}
                    <div className="grid grid-cols-1 gap-1 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">E-mail do Remetente (Normalmente igual ao usuário) *</label>
                      <input 
                        type="email"
                        placeholder="Ex: suporte@smartbid.com"
                        required
                        value={smtpForm.fromEmail}
                        onChange={e => setSmtpForm({...smtpForm, fromEmail: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* SMTP Test Connection Button */}
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        {testingSmtp ? <RefreshCw size={12} className="animate-spin" /> : <Settings size={12} />}
                        Testar Conexão SMTP (Saída)
                      </button>
                      {smtpTestResult && (
                        <span className={`text-xs font-bold ${smtpTestResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {smtpTestResult.success ? '✓ Conexão SMTP de Saída estabelecida com sucesso!' : `✗ ${smtpTestResult.error}`}
                        </span>
                      )}
                    </div>

                    {/* IMAP Host */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Servidor de Entrada (IMAP / Host)</label>
                      <input 
                        type="text"
                        placeholder="Ex: imap.umbler.com, imap.titan.email"
                        value={smtpForm.imapHost || ''}
                        onChange={e => setSmtpForm({...smtpForm, imapHost: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* IMAP Port */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Porta de Entrada (IMAP)</label>
                      <input 
                        type="number"
                        placeholder="Ex: 993"
                        value={smtpForm.imapPort || 993}
                        onChange={e => setSmtpForm({...smtpForm, imapPort: parseInt(e.target.value) || 993})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                      />
                    </div>

                    {/* IMAP Test Connection Button */}
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={handleTestImap}
                        disabled={testingImap}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        {testingImap ? <RefreshCw size={12} className="animate-spin" /> : <Settings size={12} />}
                        Testar Conexão IMAP (Entrada)
                      </button>
                      {imapTestResult && (
                        <span className={`text-xs font-bold ${imapTestResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {imapTestResult.success ? '✓ Conexão IMAP de Entrada estabelecida com sucesso!' : `✗ ${imapTestResult.error}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="smtp-active-check"
                      checked={smtpForm.active}
                      onChange={e => setSmtpForm({...smtpForm, active: e.target.checked})}
                      className="w-4 h-4 text-[#1B4D3E] border-slate-350 focus:ring-[#1B4D3E]/30 rounded cursor-pointer"
                    />
                    <label htmlFor="smtp-active-check" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Definir como conta de e-mail ativa (Principal para envios)
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={smtpLoading}
                      className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {smtpLoading ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <Check size={14} /> {isEditingSmtp ? 'Atualizar Conta' : 'Adicionar Conta'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4D3E]"></div>
          </div>
        }>
          <EmailCenterContent />
        </Suspense>
      </main>
    </div>
  );
}
