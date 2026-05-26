'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Info, Calendar, RefreshCw } from 'lucide-react';
import { sendLeadEmail, getComments } from '../actions';
import { getSmtpAccounts } from '@/app/emails/actions';

interface EmailTabProps {
  lead: any;
  onEmailSent?: () => void;
}

const safeDate = (val: any, time = true) => {
  if (!val) return 'Data Inválida';
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Data Inválida' : (time ? d.toLocaleString() : d.toLocaleDateString());
};

export default function EmailTab({ lead, onEmailSent }: EmailTabProps) {
  const [toEmail, setToEmail] = useState(lead.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [emailHistory, setEmailHistory] = useState<any[]>([]);

  // SMTP Accounts State
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Attachments State
  const [attachments, setAttachments] = useState<{ filename: string; content: string }[]>([]);

  useEffect(() => {
    // Ao trocar de Lead, atualiza o e-mail do destinatário padrão automaticamente se cadastrado
    setToEmail(lead.email || '');
    loadEmailHistory();
    loadSmtpAccounts();
    setAttachments([]); // Reseta os anexos ao trocar de Lead
  }, [lead.id, lead.email]);

  const loadEmailHistory = async () => {
    const res = await getComments(lead.id);
    if (res.success && res.comments) {
      // Filter comments that represent emails (starting with the email emoji)
      const emailsOnly = res.comments.filter((c: any) => c.texto.startsWith('📧'));
      setEmailHistory(emailsOnly);
    }
  };

  const loadSmtpAccounts = async () => {
    try {
      const res = await getSmtpAccounts();
      if (res.success && res.accounts) {
        setSmtpAccounts(res.accounts);
        // Pré-seleciona a conta ativa ou a primeira disponível
        const active = res.accounts.find((a: any) => a.active);
        if (active) {
          setSelectedAccountId(active.id);
        } else if (res.accounts.length > 0) {
          setSelectedAccountId(res.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar contas SMTP:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = (event.target.result as string).split(',')[1];
          setAttachments(prev => [...prev, { filename: file.name, content: base64 }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await sendLeadEmail(
        lead.id, 
        toEmail.trim(), 
        subject.trim(), 
        body.trim(), 
        selectedAccountId || undefined,
        attachments
      );
      if (res.success) {
        setSubject('');
        setBody('');
        setAttachments([]); // Limpa os anexos após enviar com sucesso
        if (res.simulated) {
          setSuccessMsg('E-mail simulado com sucesso (Modo de Testes, credenciais SMTP não configuradas).');
        } else {
          setSuccessMsg('E-mail disparado e registrado com sucesso!');
        }
        loadEmailHistory();
        if (onEmailSent) onEmailSent();
      } else {
        setErrorMsg(res.error || 'Erro desconhecido ao tentar enviar o e-mail.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse parsed subject, recipient, and body from the logged comment text
  const parseEmailComment = (commentText: string) => {
    const lines = commentText.split('\n');
    let type = 'Enviado';
    if (commentText.includes('[E-mail Recebido]')) {
      type = 'Recebido';
    }

    let parsedSubject = 'Sem Assunto';
    let parsedBody = commentText;
    let parsedTo = '';

    const toLine = lines.find(l => l.startsWith('Para:'));
    if (toLine) {
      parsedTo = toLine.replace('Para:', '').trim();
    }

    const subjectLine = lines.find(l => l.startsWith('Assunto:'));
    if (subjectLine) {
      parsedSubject = subjectLine.replace('Assunto:', '').trim();
      const bodyStartIndex = commentText.indexOf(subjectLine) + subjectLine.length;
      parsedBody = commentText.substring(bodyStartIndex).trim();
    }

    return { type, subject: parsedSubject, body: parsedBody, to: parsedTo };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Compose Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#1B4D3E]/10 text-[#1B4D3E] p-2 rounded-xl border border-[#1B4D3E]/20">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Enviar mensagem</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Disparar e-mail de negócios via SMTP corporativo</p>
            </div>
          </div>
        </div>

        {/* Informative Banner if Lead has no email address */}
        {!lead.email && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex gap-3 mb-4 leading-relaxed">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-extrabold uppercase text-[9px] tracking-wider">Lead sem E-mail Cadastrado</p>
              <p className="text-[11px] text-amber-700">Para enviar mensagem de e-mail, adicione um endereço de e-mail deste negócio aos dados do lead no campo abaixo. Ao enviar, este e-mail será automaticamente registrado no cadastro do lead para futuros envios e sincronizações IMAP.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSendEmail} className="space-y-4">
          {/* De: Selector Row */}
          <div className="flex items-center border-b border-slate-100 pb-3 gap-4">
            <span className="w-16 text-slate-400 font-black text-xs uppercase tracking-wider">De:</span>
            <div className="flex-1">
              {smtpAccounts.length === 0 ? (
                <div className="text-xs font-bold text-slate-500 py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                  SMTP Padrão do Sistema (.env)
                </div>
              ) : (
                <div className="relative inline-block min-w-[280px]">
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer transition-all appearance-none pr-8"
                  >
                    {smtpAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.fromName} &lt;{acc.user}&gt; {acc.active ? '★' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Para: Input Row */}
          <div className="flex items-center border-b border-slate-100 pb-3 gap-4">
            <span className="w-16 text-slate-400 font-black text-xs uppercase tracking-wider">Para:</span>
            <div className="flex-1">
              <input
                type="email"
                required
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="Ex: cliente@empresa.com"
                className="w-full px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs md:text-sm font-semibold outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Assunto: Input Row */}
          <div className="flex items-center border-b border-slate-100 pb-3 gap-4">
            <span className="w-16 text-slate-400 font-black text-xs uppercase tracking-wider">Assunto:</span>
            <div className="flex-1">
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Digite o assunto da mensagem"
                className="w-full px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-xl text-xs md:text-sm font-semibold outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Rich Editor Layout style for Body */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-[#1B4D3E] focus-within:border-[#1B4D3E] transition-all bg-white mt-4">
            {/* Visual Editor Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 select-none text-slate-400 shrink-0">
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs font-black transition-colors" title="Negrito">B</button>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs italic font-black transition-colors" title="Itálico">I</button>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs underline font-black transition-colors" title="Sublinhado">U</button>
              <span className="h-4 w-px bg-slate-300 mx-1"></span>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs font-bold transition-colors" title="Fonte">Fonte</button>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs font-bold transition-colors" title="Tamanho">Aa</button>
              <span className="h-4 w-px bg-slate-300 mx-1"></span>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs font-bold transition-colors" title="Link">Link</button>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-xs font-bold transition-colors" title="Imagem">Imagem</button>
              <span className="h-4 w-px bg-slate-300 mx-1"></span>
              <button type="button" className="p-1.5 hover:text-slate-700 hover:bg-slate-200 rounded text-[10px] font-black uppercase text-[#1B4D3E] bg-[#1B4D3E]/10 px-2.5 tracking-wider transition-colors" title="SmartBid Copilot AI">CoPilot</button>
            </div>
            
            <textarea
              required
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Pressione Espaço para usar o CoPilot ou escreva sua proposta comercial aqui..."
              className="w-full px-4 py-4 outline-none resize-none text-xs md:text-sm text-slate-700 font-normal leading-relaxed placeholder-slate-400 bg-white"
            />
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl select-none animate-in fade-in duration-200">
              {attachments.map((att, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-655 shadow-3xs"
                >
                  <span className="truncate max-w-[200px]">📎 {att.filename}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-600 transition-colors font-bold text-xs"
                    title="Remover anexo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feedback Messages */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs font-extrabold text-slate-400">
              <label className="flex items-center gap-1.5 select-none hover:text-[#1B4D3E] cursor-pointer transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                📎 Anexar Arquivos
              </label>
              <span className="flex items-center gap-1.5 select-none hover:text-[#1B4D3E] cursor-pointer transition-colors">
                Inserir Assinatura
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setBody('');
                  setAttachments([]);
                  setSuccessMsg('');
                  setErrorMsg('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={loading || !toEmail.trim() || !subject.trim() || !body.trim()}
                className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> DISPARANDO...
                  </>
                ) : (
                  <>
                    <Send size={13} /> ENVIAR MENSAGEM
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs md:text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-2 uppercase tracking-wide">
          Histórico de E-mails Enviados/Recebidos ({emailHistory.length})
        </h3>

        <div className="space-y-4">
          {emailHistory.map(comment => {
            const parsed = parseEmailComment(comment.texto);
            const isSent = parsed.type === 'Enviado';

            return (
              <div 
                key={comment.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSent 
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300' 
                    : 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      isSent ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                    }`}>
                      {parsed.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={12} /> {safeDate(comment.createdAt, true)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-450 font-bold">
                    Operador: {comment.user?.nome || 'Sistema'}
                  </span>
                </div>

                <div className="text-xs font-black text-slate-800 mb-1 flex justify-between flex-wrap gap-2">
                  <span>Assunto: {parsed.subject}</span>
                  {parsed.to && (
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                      Para: {parsed.to}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-600 whitespace-pre-wrap mt-2 bg-white/80 p-3 rounded-lg border border-slate-100 shadow-inner">
                  {parsed.body}
                </p>
              </div>
            );
          })}

          {emailHistory.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-6 font-bold uppercase tracking-wider">
              Nenhum e-mail registrado nesta timeline ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
