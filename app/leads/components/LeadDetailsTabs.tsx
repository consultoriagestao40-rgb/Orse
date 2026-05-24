'use client';

import React, { useState, useEffect } from 'react';
import { getComments, addComment, getFiles, uploadFileBase64, downloadFile, getActivities, createActivity, getLeadShares, addLeadShare, removeLeadShare } from '../actions';
import { MessageSquare, Paperclip, Calendar, Users, Send, Download, Plus, X, Trash2 } from 'lucide-react';

export default function LeadDetailsTabs({ lead }: { lead: any }) {
  const [activeTab, setActiveTab] = useState('infos');
  
  // States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [files, setFiles] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [shares, setShares] = useState<any[]>([]);
  const [newShareUserId, setNewShareUserId] = useState(''); // Precisa ser preenchido por um select de usuarios reais

  useEffect(() => {
    if (activeTab === 'comentarios') loadComments();
    if (activeTab === 'arquivos') loadFiles();
    if (activeTab === 'reunioes') loadActivities();
    if (activeTab === 'equipe') loadShares();
  }, [activeTab, lead.id]);

  const loadComments = async () => {
    const res = await getComments(lead.id);
    if (res.success) setComments(res.comments);
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

  const loadFiles = async () => {
    const res = await getFiles(lead.id);
    if (res.success) setFiles(res.files);
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const res = await uploadFileBase64(lead.id, file.name, file.size, file.type, base64);
      if (res.success) loadFiles();
      else alert('Erro ao subir arquivo');
    };
    reader.readAsDataURL(file);
  };
  const handleDownload = async (fileId: string, nome: string) => {
    const res = await downloadFile(fileId);
    if (res.success && res.file) {
      const link = document.createElement('a');
      link.href = res.file.base64Data;
      link.download = nome;
      link.click();
    }
  };

  const loadActivities = async () => {
    const res = await getActivities(lead.id);
    if (res.success) setActivities(res.activities);
  };

  const loadShares = async () => {
    const res = await getLeadShares(lead.id);
    if (res.success) setShares(res.shares);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
        <button onClick={() => setActiveTab('infos')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'infos' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16}/> Histórico
        </button>
        <button onClick={() => setActiveTab('comentarios')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'comentarios' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <MessageSquare size={16}/> Feed
        </button>
        <button onClick={() => setActiveTab('arquivos')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'arquivos' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Paperclip size={16}/> Arquivos
        </button>
        <button onClick={() => setActiveTab('reunioes')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'reunioes' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16}/> Agenda
        </button>
        <button onClick={() => setActiveTab('equipe')} className={`px-4 py-3 text-sm font-bold flex gap-2 items-center border-b-2 whitespace-nowrap transition-colors ${activeTab === 'equipe' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Users size={16}/> Equipe
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        
        {activeTab === 'infos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Telefone</div>
                <div className="text-sm font-medium text-slate-700">{lead.telefone || '-'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Contato</div>
                <div className="text-sm font-medium text-slate-700">{lead.contatoNome || '-'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                Histórico de Interações Automático
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {lead.history?.map((hist: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-emerald-400 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-xs">{hist.tipo}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{new Date(hist.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">{hist.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {comments.map(c => (
                <div key={c.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-800">{c.user.nome}</span>
                    <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.texto}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-slate-400 text-sm text-center mt-10">Nenhum comentário ainda. Puxe assunto!</p>}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 items-end">
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
        )}

        {activeTab === 'arquivos' && (
          <div>
            <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1B4D3E] hover:border-[#1B4D3E] transition-colors cursor-pointer mb-6 bg-white">
              <Paperclip size={24} className="mb-2" />
              <span className="font-bold text-sm">Clique para Anexar um Arquivo</span>
              <span className="text-xs mt-1">PDF, JPG, PNG, DOCX (Máx recomendado 5MB)</span>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                      <Paperclip size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-700 truncate">{f.nome}</p>
                      <p className="text-xs text-slate-400">{(f.tamanho / 1024).toFixed(1)} KB • Por {f.user.nome}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDownload(f.id, f.nome)} className="text-slate-400 hover:text-[#1B4D3E] p-2 bg-slate-50 rounded-lg transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              ))}
              {files.length === 0 && <p className="text-slate-400 text-sm text-center">Nenhum arquivo anexado.</p>}
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
            
            <button className="w-full bg-[#1B4D3E] text-white py-2 rounded-xl text-sm font-bold mb-4 shadow-md hover:bg-[#13382d] transition-colors flex items-center justify-center gap-2">
              <Plus size={16}/> Agendar Reunião (Em Breve)
            </button>

            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="bg-white border-l-4 border-[#1B4D3E] p-3 rounded-r-xl shadow-sm">
                  <p className="text-sm font-bold text-slate-800">{a.titulo}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar size={12}/> {new Date(a.dataInicio).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'equipe' && (
          <div>
            <p className="text-sm text-slate-600 mb-4">Adicione outros vendedores ou gerentes para acompanharem e editarem este Lead junto com você.</p>
            
            <div className="space-y-2 mb-6">
              {shares.map(s => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.user.nome}</p>
                    <p className="text-xs text-slate-500">{s.user.cargo || 'Colaborador'}</p>
                  </div>
                  <button onClick={async () => { await removeLeadShare(lead.id, s.user.id); loadShares(); }} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Adicionar Colaborador (Em Breve Select)</p>
              {/* O select de usuarios precisa vir do backend via action */}
              <button className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                Buscar Usuários...
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
