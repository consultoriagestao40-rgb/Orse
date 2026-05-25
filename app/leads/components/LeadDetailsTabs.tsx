'use client';

import React, { useState, useEffect } from 'react';
import { getComments, addComment, getFiles, uploadFileBase64, downloadFile, getActivities, createActivity, getLeadShares, addLeadShare, removeLeadShare, getAllUsers } from '../actions';
import { MessageSquare, Paperclip, Calendar, Users, Send, Download, Plus, X, Trash2, MapPin, Navigation, Mail, Phone, Map, MessageCircle } from 'lucide-react';
import WhatsAppChat from './WhatsAppChat';

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
  
  const [shares, setShares] = useState<any[]>([]);
  const [newShareUserId, setNewShareUserId] = useState(''); // Precisa ser preenchido por um select de usuarios reais

  // State for Users
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // State for Reuniões
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ titulo: '', data: '', hora: '' });

  useEffect(() => {
    if (activeTab === 'comentarios') {
      loadComments();
      loadFiles();
    }
    if (activeTab === 'reunioes') loadActivities();
  }, [activeTab, lead.id]);

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
      loadComments();
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
        loadFiles();
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
      loadActivities();
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
          <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {[...comments, ...files.map(f => ({ ...f, isFile: true }))]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(item => (
                item.isFile ? (
                  <div key={`file-${item.id}`} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                        <Paperclip size={16} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-700 truncate">{item.nome}</p>
                        <p className="text-[10px] text-slate-400">
                          {(item.tamanho / 1024).toFixed(1)} KB • Por {item.user?.nome || 'Desconhecido'} • {safeDate(item.createdAt, true)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDownload(item.id, item.nome)} className="text-slate-400 hover:text-[#1B4D3E] p-2 bg-slate-50 rounded-lg transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                ) : (
                  <div key={`comment-${item.id}`} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-slate-800">{item.user?.nome || 'Usuário Desconhecido'}</span>
                      <span className="text-[10px] text-slate-400">{safeDate(item.createdAt, true)}</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {item.texto.split(/(@[\wÀ-ÿ]+)/g).map((part: string, i: number) => 
                        part.startsWith('@') ? <span key={i} className="text-blue-600 font-bold bg-blue-50 px-1 rounded">{part}</span> : part
                      )}
                    </p>
                  </div>
                )
              ))}
              {comments.length === 0 && files.length === 0 && <p className="text-slate-400 text-sm text-center mt-10">Nenhuma atividade no feed. Puxe assunto ou anexe um arquivo!</p>}
            </div>
            
            <div className="relative">
              {/* Mention Dropdown */}
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
                <label className="bg-slate-100 text-slate-500 p-3 rounded-xl hover:bg-slate-200 transition-colors shadow-sm cursor-pointer" title="Anexar arquivo">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <textarea 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário... (Ex: @joao falou com o cliente hoje)" 
                  className="flex-1 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#1B4D3E] shadow-sm bg-white"
                  rows={2}
                />
                <button type="submit" className="bg-[#1B4D3E] text-white p-3 rounded-xl hover:bg-[#13382d] transition-colors shadow-md">
                  <Send size={18} />
                </button>
              </form>
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

      </div>
    </div>
  );
}
