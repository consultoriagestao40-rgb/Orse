'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getComments, addComment, getFiles, uploadFileBase64, downloadFile, getActivities, createActivity, getLeadShares, addLeadShare, removeLeadShare, getAllUsers, sendLeadEmail } from '../actions';
import { getWhatsAppMessages } from '../whatsapp-actions';
import { getSmtpAccounts } from '@/app/emails/actions';
import { MessageSquare, Paperclip, Calendar, Users, Send, Download, Plus, X, Trash2, MapPin, Navigation, Mail, Phone, Map, MessageCircle, CheckCircle2, AlertCircle, Info, RefreshCw, FileText, Mic, Trash, Clock } from 'lucide-react';
import WhatsAppChat from './WhatsAppChat';
import EmailTab from './EmailTab';


const safeDate = (val: any, time = false) => {
  if (!val) return 'Data Inválida';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Data Inválida' : (time ? d.toLocaleString() : d.toLocaleDateString());
};

export default function LeadDetailsTabs({ lead }: { lead: any }) {
  const [activeTab, setActiveTab] = useState('comentarios');
  
  // States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [files, setFiles] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = useState('todos');

  // Quick Composer States
  const [activeComposerTab, setActiveComposerTab] = useState<'comment' | 'meeting' | 'email'>('comment');
  
  // Quick Email Composer States
  const [quickEmail, setQuickEmail] = useState({ to: lead.email || '', subject: '', body: '', accountId: '' });
  const [quickEmailLoading, setQuickEmailLoading] = useState(false);
  const [quickEmailSuccess, setQuickEmailSuccess] = useState('');
  const [quickEmailError, setQuickEmailError] = useState('');
  const [quickEmailAttachments, setQuickEmailAttachments] = useState<{ filename: string; content: string }[]>([]);
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [shares, setShares] = useState<any[]>([]);
  const [newShareUserId, setNewShareUserId] = useState(''); // Precisa ser preenchido por um select de usuarios reais

  // State for Users
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // State for Reuniões
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ titulo: '', data: '', hora: '' });

  // Função para renderizar texto de comentários e formatar menções (@Nome Completo) como link azul brilhante, ocultando o @
  const renderCommentText = (texto: string) => {
    if (!texto) return '';

    // Ordenar os usuários por tamanho do nome decrescente para evitar substituir partes menores do nome primeiro
    const sortedUsers = [...allUsers].sort((a, b) => b.nome.length - a.nome.length);

    let parts: React.ReactNode[] = [texto];

    for (const u of sortedUsers) {
      const mentionToken = `@${u.nome}`;
      const nextParts: React.ReactNode[] = [];

      for (const part of parts) {
        if (typeof part === 'string' && part.includes(mentionToken)) {
          const subparts = part.split(mentionToken);
          for (let i = 0; i < subparts.length; i++) {
            nextParts.push(subparts[i]);
            if (i < subparts.length - 1) {
              nextParts.push(
                <span 
                  key={`${u.id}-${i}`} 
                  className="text-blue-600 font-bold hover:underline cursor-pointer transition-colors bg-blue-50/60 px-1.5 py-0.5 rounded-md"
                  title={`${u.nome} - Mencionando usuário`}
                >
                  {u.nome}
                </span>
              );
            }
          }
        } else {
          nextParts.push(part);
        }
      }
      parts = nextParts;
    }

    return parts;
  };

  // Loaders
  useEffect(() => {
    loadAllUsers();
    loadSmtpAccounts();
  }, []);

  useEffect(() => {
    // Ao trocar de Lead, atualiza o e-mail do destinatário padrão
    setQuickEmail(prev => ({ ...prev, to: lead.email || '' }));
  }, [lead.id, lead.email]);

  useEffect(() => {
    if (activeTab === 'comentarios') {
      loadTimelineData();
    }
    if (activeTab === 'reunioes') loadActivities();
  }, [activeTab, lead.id]);

  const loadTimelineData = async () => {
    const [resComments, resFiles, resActivities, resWhatsapp] = await Promise.all([
      getComments(lead.id),
      getFiles(lead.id),
      getActivities(lead.id),
      getWhatsAppMessages(lead.id)
    ]);
    
    if (resComments.success) setComments(resComments.comments || []);
    if (resFiles.success) setFiles(resFiles.files || []);
    if (resActivities.success) setActivities(resActivities.activities || []);
    if (resWhatsapp.success) setWhatsappMessages(resWhatsapp.messages || []);
  };

  const loadSmtpAccounts = async () => {
    try {
      const res = await getSmtpAccounts();
      if (res.success && res.accounts) {
        setSmtpAccounts(res.accounts);
        const active = res.accounts.find((a: any) => a.active);
        if (active) {
          setSelectedAccountId(active.id);
          setQuickEmail(prev => ({ ...prev, accountId: active.id }));
        } else if (res.accounts.length > 0) {
          setSelectedAccountId(res.accounts[0].id);
          setQuickEmail(prev => ({ ...prev, accountId: res.accounts[0].id }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar contas SMTP:', err);
    }
  };

  const loadComments = async () => {
    const res = await getComments(lead.id);
    if (res.success) setComments(res.comments || []);
  };

  const loadFiles = async () => {
    const res = await getFiles(lead.id);
    if (res.success) setFiles(res.files || []);
  };

  const loadActivities = async () => {
    const res = await getActivities(lead.id);
    if (res.success) setActivities(res.activities || []);
  };

  const loadShares = async () => {
    const res = await getLeadShares(lead.id);
    if (res.success) setShares(res.shares || []);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await addComment(lead.id, newComment);
    if (res.success) {
      setNewComment('');
      loadTimelineData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo excede limite de 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await uploadFileBase64(lead.id, file.name, file.size, file.type, base64);
      if (res.success) {
        loadTimelineData();
      } else {
        alert("Erro no upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    const res = await downloadFile(fileId);
    if (res.success && res.file?.base64Data) {
      const a = document.createElement('a');
      a.href = res.file.base64Data;
      a.download = fileName;
      a.click();
    } else {
      alert("Erro ao baixar arquivo");
    }
  };

  const loadAllUsers = async () => {
    const res = await getAllUsers();
    if (res.success) setAllUsers(res.users);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.titulo || !meetingForm.data || !meetingForm.hora) return;
    
    const dataInicio = new Date(`${meetingForm.data}T${meetingForm.hora}:00`);
    const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // +1 hora

    const res = await createActivity({
      leadId: lead.id,
      titulo: meetingForm.titulo,
      tipo: 'REUNIAO',
      dataInicio,
      dataFim
    });

    if (res.success) {
      setMeetingForm({ titulo: '', data: '', hora: '' });
      setShowMeetingForm(false);
      loadTimelineData();
    } else {
      alert('Erro ao agendar reunião');
    }
  };

  const handleAddUser = async () => {
    if (!newShareUserId) return;
    const res = await addLeadShare(lead.id, newShareUserId);
    if (res.success) {
      setNewShareUserId('');
      loadShares();
    } else {
      alert(res.error || 'Erro ao adicionar usuário');
    }
  };

  // Normalização e fusão dos itens da Linha do Tempo
  const getUnifiedTimeline = () => {
    const items: any[] = [];

    // 1. Comentários (filtrando ou convertendo emails)
    comments.forEach(c => {
      if (c.texto.startsWith('📧')) {
        const isSent = c.texto.includes('[E-mail Enviado]');
        items.push({
          id: `email-${c.id}`,
          type: isSent ? 'EMAIL_SENT' : 'EMAIL_RECEIVED',
          date: new Date(c.createdAt),
          user: c.user,
          original: c
        });
      } else {
        items.push({
          id: `comment-${c.id}`,
          type: 'COMMENT',
          date: new Date(c.createdAt),
          user: c.user,
          original: c
        });
      }
    });

    // 2. Arquivos
    files.forEach(f => {
      items.push({
        id: `file-${f.id}`,
        type: 'FILE',
        date: new Date(f.createdAt),
        user: f.user,
        original: f
      });
    });

    // 3. Reuniões (atividades)
    activities.forEach(a => {
      items.push({
        id: `meeting-${a.id}`,
        type: 'MEETING',
        date: new Date(a.dataInicio),
        user: a.user,
        original: a
      });
    });



    // 5. WhatsApp
    whatsappMessages.forEach(w => {
      items.push({
        id: `whatsapp-${w.id}`,
        type: w.direction === 'INBOUND' ? 'WHATSAPP_INBOUND' : 'WHATSAPP_OUTBOUND',
        date: new Date(w.createdAt),
        user: w.user,
        original: w
      });
    });

    // Ordenar decrescente (mais recente no topo)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  // Helper para parser de e-mail a partir do comentário cadastrado
  const parseEmailComment = (commentText: string) => {
    const lines = commentText.split('\n');
    let type = 'Enviado';
    if (commentText.includes('[E-mail Recebido]')) {
      type = 'Recebido';
    }

    let parsedSubject = 'Sem Assunto';
    let parsedBody = commentText;
    let parsedTo = '';
    let parsedDe = '';

    const toLine = lines.find(l => l.startsWith('Para:'));
    if (toLine) {
      parsedTo = toLine.replace('Para:', '').trim();
    }

    const deLine = lines.find(l => l.startsWith('De:'));
    if (deLine) {
      parsedDe = deLine.replace('De:', '').trim();
    }

    const subjectLine = lines.find(l => l.startsWith('Assunto:'));
    if (subjectLine) {
      parsedSubject = subjectLine.replace('Assunto:', '').trim();
      const bodyStartIndex = commentText.indexOf(subjectLine) + subjectLine.length;
      parsedBody = commentText.substring(bodyStartIndex).trim();
    }

    return { type, subject: parsedSubject, body: parsedBody, to: parsedTo, de: parsedDe };
  };

  // Helper para formatar e renderizar mídias do WhatsApp no feed
  const renderWhatsAppMediaContent = (texto: string) => {
    if (!texto) return null;

    if (texto.includes('📷 Foto:')) {
      const lines = texto.split('\n');
      const caption = lines[0].replace('📷 Foto:', '').trim();
      const urlMatch = texto.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        return (
          <div className="flex flex-col gap-2">
            <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-black/5 max-w-sm">
              <img 
                src={url} 
                alt="WhatsApp Photo" 
                className="max-w-full max-h-64 object-contain rounded-lg hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(url, '_blank')}
              />
            </div>
            {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
          </div>
        );
      }
    }

    if (texto.includes('🎥 Vídeo:')) {
      const lines = texto.split('\n');
      const caption = lines[0].replace('🎥 Vídeo:', '').trim();
      const urlMatch = texto.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        return (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <video src={url} controls className="w-full max-h-64 object-contain rounded-lg bg-black" />
            {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
          </div>
        );
      }
    }

    if (texto.includes('🎵 Áudio:')) {
      const idx = texto.indexOf('🎵 Áudio:');
      const urlOrBase64 = texto.substring(idx + '🎵 Áudio:'.length).trim();
      if (urlOrBase64) {
        return (
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <div className="text-[10px] text-slate-400 font-bold">🎵 Mensagem de Voz</div>
            <audio src={urlOrBase64} controls className="w-full h-8" />
          </div>
        );
      }
    }

    if (texto.includes('📄 Documento:')) {
      const lines = texto.split('\n');
      const docName = lines[0].replace('📄 Documento:', '').trim() || 'Documento';
      const urlMatch = texto.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        return (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-3 max-w-sm">
            <div className="flex items-center gap-2 truncate">
              <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg shrink-0">
                <FileText size={16} />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-700 truncate" title={docName}>{docName}</p>
                <p className="text-[9px] text-slate-400">Documento PDF/Office</p>
              </div>
            </div>
            <a href={url} download target="_blank" rel="noreferrer" className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[9px] font-bold px-2 py-1 rounded-md shrink-0">
              Baixar
            </a>
          </div>
        );
      }
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(texto)) {
      const parts = texto.split(urlRegex);
      return (
        <>
          {parts.map((part, i) => {
            if (urlRegex.test(part) || (part.startsWith('http://') || part.startsWith('https://'))) {
              return (
                <a key={i} href={part} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold break-all">
                  {part}
                </a>
              );
            }
            return part;
          })}
        </>
      );
    }

    return texto;
  };

  // Envio de E-mail Rápido pelo Composer do Feed
  const handleSendQuickEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail.to.trim() || !quickEmail.subject.trim() || !quickEmail.body.trim()) return;

    setQuickEmailLoading(true);
    setQuickEmailSuccess('');
    setQuickEmailError('');

    try {
      const res = await sendLeadEmail(
        lead.id,
        quickEmail.to.trim(),
        quickEmail.subject.trim(),
        quickEmail.body.trim(),
        selectedAccountId || undefined,
        quickEmailAttachments
      );
      if (res.success) {
        setQuickEmail({ ...quickEmail, subject: '', body: '' });
        setQuickEmailAttachments([]);
        if (res.simulated) {
          setQuickEmailSuccess('E-mail simulado com sucesso (Modo de Teste).');
        } else {
          setQuickEmailSuccess('E-mail enviado e registrado com sucesso!');
        }
        loadTimelineData();
      } else {
        setQuickEmailError(res.error || 'Erro ao enviar e-mail.');
      }
    } catch (err: any) {
      setQuickEmailError(err.message || 'Falha na conexão.');
    } finally {
      setQuickEmailLoading(false);
    }
  };

  const handleQuickEmailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = (event.target.result as string).split(',')[1];
          setQuickEmailAttachments(prev => [...prev, { filename: file.name, content: base64 }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const filteredTimeline = getUnifiedTimeline().filter(item => {
    if (timelineFilter === 'todos') return true;
    if (timelineFilter === 'comentarios') return item.type === 'COMMENT';
    if (timelineFilter === 'whatsapp') return item.type === 'WHATSAPP_INBOUND' || item.type === 'WHATSAPP_OUTBOUND';
    if (timelineFilter === 'emails') return item.type === 'EMAIL_SENT' || item.type === 'EMAIL_RECEIVED';
    if (timelineFilter === 'reunioes') return item.type === 'MEETING';
    if (timelineFilter === 'historico') return item.type === 'HISTORY';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
        <button onClick={() => setActiveTab('comentarios')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'comentarios' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <MessageSquare size={16}/> Feed
        </button>
        <button onClick={() => setActiveTab('reunioes')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'reunioes' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16}/> Agenda
        </button>
        <button onClick={() => setActiveTab('whatsapp')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'whatsapp' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <MessageCircle size={16}/> WhatsApp
        </button>
        <button onClick={() => setActiveTab('email')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'email' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Mail size={16}/> E-mail
        </button>
        <button onClick={() => setActiveTab('infos')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'infos' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16}/> Histórico
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        
        {activeTab === 'infos' && (
          <div className="space-y-6">
            <div>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {lead.history?.map((hist: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-emerald-400 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">{hist.tipo}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{safeDate(hist.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600">{hist.descricao}</p>
                    </div>
                  </div>
                ))}
                {(!lead.history || lead.history.length === 0) && (
                  <div className="text-center py-8">
                    <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-xs font-medium">
                      Nenhum histórico registrado ainda.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="flex flex-col h-full bg-[#F8FAFC]">
            {/* Quick Composer Card - Bitrix Style */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4 shrink-0">
              {/* Tab selector toolbar */}
              <div className="flex border-b border-slate-100 pb-2 mb-3 gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveComposerTab('comment')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeComposerTab === 'comment'
                      ? 'bg-[#1B4D3E]/10 text-[#1B4D3E]'
                      : 'hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare size={14} /> Comentário
                </button>
                <button
                  type="button"
                  onClick={() => setActiveComposerTab('meeting')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeComposerTab === 'meeting'
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Calendar size={14} /> Reunião
                </button>
                <button
                  type="button"
                  onClick={() => setActiveComposerTab('email')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    activeComposerTab === 'email'
                      ? 'bg-indigo-500/10 text-indigo-700'
                      : 'hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Mail size={14} /> E-mail Rápido
                </button>
              </div>

              {/* Composer Inputs based on selection */}
              {activeComposerTab === 'comment' && (
                <div className="relative">
                  {/* Autocomplete menção usuário */}
                  {(() => {
                    const words = newComment.split(/[\s\n]/);
                    const lastWord = words[words.length - 1];
                    if (lastWord.startsWith('@')) {
                      const search = lastWord.substring(1).toLowerCase();
                      const filtered = allUsers.filter(u => u.nome.toLowerCase().includes(search));
                      if (filtered.length > 0) {
                        return (
                          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                            {filtered.map(u => (
                              <div 
                                key={u.id}
                                onClick={() => {
                                  words.pop();
                                  setNewComment([...words, `@${u.nome} `].join(' '));
                                }}
                                className="p-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                              >
                                <p className="text-sm font-bold text-slate-800">{u.nome}</p>
                                <p className="text-xs text-slate-500">{u.cargo || 'Usuário'}</p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <form onSubmit={handleAddComment} className="flex gap-2 items-end">
                    <label className="bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-xs cursor-pointer shrink-0" title="Anexar arquivo ao feed">
                      <Paperclip size={16} />
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <textarea 
                      value={newComment} 
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário... Mencione colegas usando @nome" 
                      className="flex-1 border border-slate-200 rounded-xl p-2.5 text-xs md:text-sm resize-none focus:outline-none focus:border-[#1B4D3E] bg-slate-50 focus:bg-white transition-all min-h-[38px] max-h-[120px]"
                      rows={1}
                    />
                    <button type="submit" className="bg-[#1B4D3E] text-white p-2.5 rounded-xl hover:bg-[#13382d] transition-colors shadow-sm shrink-0">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}

              {activeComposerTab === 'meeting' && (
                <form onSubmit={handleCreateMeeting} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <input 
                        required 
                        value={meetingForm.titulo} 
                        onChange={e => setMeetingForm({...meetingForm, titulo: e.target.value})} 
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white" 
                        placeholder="Ex: Apresentação da Proposta" 
                      />
                    </div>
                    <div>
                      <input 
                        type="date" 
                        required 
                        value={meetingForm.data} 
                        onChange={e => setMeetingForm({...meetingForm, data: e.target.value})} 
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="time" 
                        required 
                        value={meetingForm.hora} 
                        onChange={e => setMeetingForm({...meetingForm, hora: e.target.value})} 
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white" 
                      />
                      <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 uppercase tracking-wide">
                        Salvar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {activeComposerTab === 'email' && (
                <form onSubmit={handleSendQuickEmail} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in duration-200">
                  {/* Select SMTP */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">De:</span>
                    {smtpAccounts.length === 0 ? (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">SMTP Padrão (.env)</span>
                    ) : (
                      <select
                        value={selectedAccountId}
                        onChange={e => {
                          setSelectedAccountId(e.target.value);
                          setQuickEmail(prev => ({ ...prev, accountId: e.target.value }));
                        }}
                        className="text-[10px] font-bold text-slate-600 bg-white border border-slate-250 rounded px-2 py-0.5 outline-none cursor-pointer"
                      >
                        {smtpAccounts.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.fromName} &lt;{acc.user}&gt;</option>
                        ))}
                      </select>
                    )}
                    
                    <span className="text-[10px] font-black uppercase text-slate-400 ml-auto">Para:</span>
                    <input 
                      type="email" 
                      required 
                      value={quickEmail.to} 
                      onChange={e => setQuickEmail({ ...quickEmail, to: e.target.value })} 
                      className="text-[10px] font-bold text-slate-700 bg-white border border-slate-250 rounded px-2 py-0.5 outline-none w-48" 
                    />
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required 
                      value={quickEmail.subject} 
                      onChange={e => setQuickEmail({ ...quickEmail, subject: e.target.value })} 
                      placeholder="Assunto do e-mail" 
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white" 
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <textarea 
                      required 
                      rows={2} 
                      value={quickEmail.body} 
                      onChange={e => setQuickEmail({ ...quickEmail, body: e.target.value })} 
                      placeholder="Escreva o corpo do e-mail comercial..." 
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-xs font-normal bg-white resize-none" 
                    />
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      <label className="bg-slate-200/80 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-300/80 cursor-pointer text-xs font-bold text-center border border-slate-300" title="Anexar arquivos ao e-mail">
                        📎 Anexos
                        <input type="file" multiple className="hidden" onChange={handleQuickEmailFileChange} />
                      </label>
                      
                      <button 
                        type="submit" 
                        disabled={quickEmailLoading}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {quickEmailLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />} Enviar
                      </button>
                    </div>
                  </div>

                  {/* Attachment labels under composer */}
                  {quickEmailAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/50">
                      {quickEmailAttachments.map((att, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-500 rounded px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                          📎 {att.filename}
                          <button type="button" onClick={() => setNewComment(prev => prev)} className="text-slate-400 hover:text-red-500 font-extrabold text-[10px]">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {quickEmailSuccess && <p className="text-[10px] font-bold text-emerald-600">{quickEmailSuccess}</p>}
                  {quickEmailError && <p className="text-[10px] font-bold text-rose-600">{quickEmailError}</p>}
                </form>
              )}
            </div>

            {/* Timeline Filter Pills - Bitrix style */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 shrink-0 select-none scrollbar-none">
              {[
                { id: 'todos', label: 'Todos', count: getUnifiedTimeline().length, color: 'border-slate-200 text-slate-600 hover:bg-slate-100' },
                { id: 'comentarios', label: 'Comentários', count: comments.length, color: 'border-teal-100 text-teal-700 bg-teal-50/20 hover:bg-teal-50/50' },
                { id: 'whatsapp', label: 'WhatsApp', count: whatsappMessages.length, color: 'border-emerald-100 text-emerald-700 bg-emerald-50/20 hover:bg-emerald-50/50' },
                { id: 'emails', label: 'E-mails', count: comments.filter(c => c.texto.startsWith('📧')).length, color: 'border-indigo-100 text-indigo-700 bg-indigo-50/20 hover:bg-indigo-50/50' },
                { id: 'reunioes', label: 'Reuniões', count: activities.length, color: 'border-amber-100 text-amber-700 bg-amber-50/20 hover:bg-amber-50/50' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTimelineFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-black shrink-0 transition-all shadow-3xs flex items-center gap-1.5 ${
                    timelineFilter === f.id
                      ? 'bg-[#1B4D3E] text-white border-[#1B4D3E] scale-[1.02] shadow-xs'
                      : f.color
                  }`}
                >
                  {f.label} <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    timelineFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200/50 text-slate-500'
                  }`}>{f.count}</span>
                </button>
              ))}
            </div>

            {/* UNIFIED TIMELINE WRAPPER (VIEWPORT) */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              
              {/* INNER TIMELINE (SHIFTED RIGHT SO BADGES ARE NEVER CLIPPED) */}
              <div className="ml-8 pl-8 border-l-2 border-slate-250 relative py-4 space-y-6">
                
                {filteredTimeline.map((item) => {
                  let badgeBg = 'bg-slate-400';
                  let borderLeftColor = 'border-l-slate-400';
                  let IconComponent = Info;
                  let cardTitle = 'Atividade';
                  let cardColorClass = 'bg-slate-50';

                  if (item.type === 'COMMENT') {
                    badgeBg = 'bg-teal-500';
                    borderLeftColor = 'border-l-teal-500';
                    IconComponent = MessageSquare;
                    cardTitle = 'Comentário';
                    cardColorClass = 'bg-teal-50/5';
                  } else if (item.type === 'FILE') {
                    badgeBg = 'bg-emerald-500';
                    borderLeftColor = 'border-l-emerald-500';
                    IconComponent = Paperclip;
                    cardTitle = 'Arquivo Anexado';
                    cardColorClass = 'bg-emerald-50/5';
                  } else if (item.type === 'MEETING') {
                    badgeBg = 'bg-amber-500';
                    borderLeftColor = 'border-l-amber-500';
                    IconComponent = Calendar;
                    cardTitle = 'Reunião Agendada';
                    cardColorClass = 'bg-amber-50/5';
                  } else if (item.type === 'EMAIL_SENT' || item.type === 'EMAIL_RECEIVED') {
                    badgeBg = 'bg-indigo-500';
                    borderLeftColor = 'border-l-indigo-500';
                    IconComponent = Mail;
                    cardTitle = item.type === 'EMAIL_SENT' ? 'E-mail Enviado' : 'E-mail Recebido';
                    cardColorClass = 'bg-indigo-50/5';
                  } else if (item.type === 'WHATSAPP_INBOUND' || item.type === 'WHATSAPP_OUTBOUND') {
                    badgeBg = 'bg-green-500';
                    borderLeftColor = 'border-l-green-500';
                    IconComponent = MessageCircle;
                    cardTitle = item.type === 'WHATSAPP_INBOUND' ? 'WhatsApp Recebido' : 'WhatsApp Enviado';
                    cardColorClass = 'bg-green-50/5';
                  } else if (item.type === 'HISTORY') {
                    badgeBg = 'bg-slate-400';
                    borderLeftColor = 'border-l-slate-400';
                    IconComponent = Info;
                    cardTitle = 'Histórico';
                    cardColorClass = 'bg-slate-50';
                  }

                  return (
                    <div key={item.id} className="relative group animate-in fade-in duration-200">
                      {/* Badge circular centralizado sobre a linha guia - NUNCA CORTADO */}
                      <div className={`absolute -left-[44px] top-4 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${badgeBg} text-white shadow-sm z-10 scale-[1.02] hover:scale-[1.12] transition-transform duration-200`}>
                        <IconComponent size={12} />
                      </div>

                      {/* Card de Atividade */}
                      <div className={`bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs overflow-hidden transition-all hover:shadow-xs border-l-4 ${borderLeftColor}`}>
                        {/* Cabeçalho do Card */}
                        <div className={`px-4 py-2.5 border-b border-slate-100 flex justify-between items-center ${cardColorClass}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-800 uppercase tracking-wide">
                              {cardTitle}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Clock size={11} /> {safeDate(item.date, true)}
                            </span>
                          </div>
                          
                          {item.user && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Por: {item.user.nome}
                            </span>
                          )}
                        </div>

                        {/* Corpo do Card baseado no tipo */}
                        <div className="p-4 text-xs md:text-sm text-slate-700 leading-relaxed font-normal bg-white">
                          
                          {/* Tipo: COMENTÁRIO */}
                          {item.type === 'COMMENT' && (
                            <p className="whitespace-pre-wrap">
                              {renderCommentText(item.original.texto)}
                            </p>
                          )}

                          {/* Tipo: ARQUIVO */}
                          {item.type === 'FILE' && (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 truncate">
                                <div className="bg-emerald-100/60 p-2 rounded-lg text-emerald-700 shrink-0">
                                  <Paperclip size={16} />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-700 truncate" title={item.original.nome}>{item.original.nome}</p>
                                  <p className="text-[9px] text-slate-400 font-bold">{(item.original.tamanho / 1024).toFixed(1)} KB • Extensão: {item.original.tipo?.split('/')[1]?.toUpperCase() || 'DESCONHECIDA'}</p>
                                </div>
                              </div>
                              <button onClick={() => handleDownload(item.original.id, item.original.nome)} className="text-slate-400 hover:text-[#1B4D3E] p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-200">
                                <Download size={14} />
                              </button>
                            </div>
                          )}

                          {/* Tipo: REUNIÃO */}
                          {item.type === 'MEETING' && (
                            <div className="flex items-center gap-2 text-[#1B4D3E] font-bold">
                              <Calendar size={14} />
                              <span>{item.original.titulo}</span>
                            </div>
                          )}

                          {/* Tipo: EMAIL */}
                          {(item.type === 'EMAIL_SENT' || item.type === 'EMAIL_RECEIVED') && (() => {
                            const parsed = parseEmailComment(item.original.texto);
                            return (
                              <div className="space-y-2">
                                <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2.5 text-[11px] font-semibold text-slate-500 space-y-0.5">
                                  {parsed.de && <div><span className="text-[9px] font-bold text-slate-400 uppercase">De:</span> <span className="text-slate-700 font-bold">{parsed.de}</span></div>}
                                  {parsed.to && <div><span className="text-[9px] font-bold text-slate-400 uppercase">Para:</span> <span className="text-slate-700 font-bold">{parsed.to}</span></div>}
                                  <div className="pt-0.5"><span className="text-[9px] font-bold text-slate-400 uppercase">Assunto:</span> <span className="text-slate-800 font-black">{parsed.subject}</span></div>
                                </div>
                                <p className="whitespace-pre-wrap text-slate-600 bg-slate-50/30 p-3 rounded-xl border border-slate-200/50 shadow-inner leading-relaxed">
                                  {parsed.body}
                                </p>
                              </div>
                            );
                          })()}

                          {/* Tipo: WHATSAPP */}
                          {(item.type === 'WHATSAPP_INBOUND' || item.type === 'WHATSAPP_OUTBOUND') && (
                            <div className="space-y-2">
                              <div className="whitespace-pre-wrap font-medium">
                                {renderWhatsAppMediaContent(item.original.texto)}
                              </div>
                              {item.original.status && item.type === 'WHATSAPP_OUTBOUND' && (
                                <div className="flex justify-end">
                                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                    ✓✓ {item.original.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tipo: AUDIT / HISTÓRICO */}
                          {item.type === 'HISTORY' && (
                            <p className="text-slate-600 font-medium">
                              {item.original.descricao}
                            </p>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTimeline.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                    <Info className="mx-auto text-slate-350 mb-2" size={24} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nenhuma atividade registrada neste filtro.</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}



        {activeTab === 'reunioes' && (
          <div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Calendar className="text-emerald-600 mt-0.5" size={18}/>
              <div>
                <p className="text-sm font-bold text-emerald-800">Agendamentos</p>
                <p className="text-xs text-emerald-600">Reuniões marcadas aqui aparecem no Calendário Global do sistema.</p>
              </div>
            </div>
            
            {!showMeetingForm ? (
              <button onClick={() => setShowMeetingForm(true)} className="w-full bg-[#1B4D3E] text-white py-2 rounded-xl text-sm font-bold mb-4 shadow-md hover:bg-[#13382d] transition-colors flex items-center justify-center gap-2">
                <Plus size={16}/> Agendar Reunião
              </button>
            ) : (
              <form onSubmit={handleCreateMeeting} className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Título da Reunião</label>
                    <input required value={meetingForm.titulo} onChange={e => setMeetingForm({...meetingForm, titulo: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" placeholder="Ex: Apresentação da Proposta" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Data</label>
                      <input type="date" required value={meetingForm.data} onChange={e => setMeetingForm({...meetingForm, data: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Hora</label>
                      <input type="time" required value={meetingForm.hora} onChange={e => setMeetingForm({...meetingForm, hora: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-[#1B4D3E] text-white p-2 rounded-lg text-sm font-bold">Salvar</button>
                    <button type="button" onClick={() => setShowMeetingForm(false)} className="flex-1 bg-slate-100 text-slate-600 p-2 rounded-lg text-sm font-bold">Cancelar</button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="bg-white border-l-4 border-[#1B4D3E] p-3 rounded-r-xl shadow-sm">
                  <p className="text-sm font-bold text-slate-800">{a.titulo}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar size={12}/> {safeDate(a.dataInicio, true)}
                  </p>
                </div>
              ))}
              {activities.length === 0 && !showMeetingForm && <p className="text-slate-400 text-sm text-center">Nenhuma reunião agendada.</p>}
            </div>
          </div>
        )}



        {activeTab === 'whatsapp' && (
          <div className="h-full -m-4">
            <WhatsAppChat leadId={lead.id} leadPhone={lead.telefone} />
          </div>
        )}

        {activeTab === 'email' && (
          <div className="h-full mt-2">
            <EmailTab lead={lead} onEmailSent={loadComments} />
          </div>
        )}
      </div>
    </div>
  );
}
