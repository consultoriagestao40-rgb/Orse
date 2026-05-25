'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';
import { sendLeadEmail, getComments } from '../actions';

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

  useEffect(() => {
    loadEmailHistory();
  }, [lead.id]);

  const loadEmailHistory = async () => {
    const res = await getComments(lead.id);
    if (res.success && res.comments) {
      // Filter comments that represent emails (starting with the email emoji)
      const emailsOnly = res.comments.filter((c: any) => c.texto.startsWith('📧'));
      setEmailHistory(emailsOnly);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim() || !subject.trim() || !body.trim()) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await sendLeadEmail(lead.id, toEmail.trim(), subject.trim(), body.trim());
      if (res.success) {
        setSubject('');
        setBody('');
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

  // Helper to parse parsed subject and body from the logged comment text
  const parseEmailComment = (commentText: string) => {
    const lines = commentText.split('\n');
    let type = 'Enviado';
    if (commentText.includes('[E-mail Recebido]')) {
      type = 'Recebido';
    }

    let parsedSubject = 'Sem Assunto';
    let parsedBody = commentText;

    const subjectLine = lines.find(l => l.startsWith('Assunto:'));
    if (subjectLine) {
      parsedSubject = subjectLine.replace('Assunto:', '').trim();
      const bodyStartIndex = commentText.indexOf(subjectLine) + subjectLine.length;
      parsedBody = commentText.substring(bodyStartIndex).trim();
    }

    return { type, subject: parsedSubject, body: parsedBody };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Informative Banner */}
      {!lead.email && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <Info className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-xs md:text-sm font-bold text-amber-800">Lead sem E-mail Cadastrado</p>
            <p className="text-[11px] md:text-xs text-amber-600">
              Recomendamos salvar um e-mail de contato no cadastro principal do Lead para facilitar o preenchimento automático.
            </p>
          </div>
        </div>
      )}

      {/* Compose Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-slate-800">Escrever Novo E-mail</h3>
            <p className="text-[10px] text-slate-400">Envie propostas, documentos ou comunicados via SMTP corporativo</p>
          </div>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Destinatário (E-mail)
              </label>
              <input
                type="email"
                required
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="Ex: cliente@empresa.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Assunto do E-mail
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ex: Proposta Comercial - SmartBid"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Corpo da Mensagem (Texto)
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Escreva a sua mensagem completa aqui..."
              className="w-full px-3 py-3 border border-slate-200 rounded-xl text-xs md:text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Feedback Messages */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2 animate-pulse">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !toEmail.trim() || !subject.trim() || !body.trim()}
              className="bg-[#1B4D3E] hover:bg-[#13382d] disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Send size={14} />
              <span>{loading ? 'Disparando...' : 'Enviar E-mail'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs md:text-sm font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">
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
                    : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      isSent ? 'bg-slate-200 text-slate-700' : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {parsed.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={12} /> {safeDate(comment.createdAt, true)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Operador: {comment.user?.nome || 'Sistema'}
                  </span>
                </div>

                <div className="text-xs font-black text-slate-800 mb-1">
                  Assunto: {parsed.subject}
                </div>
                
                <p className="text-xs text-slate-600 whitespace-pre-wrap mt-2 bg-white/70 p-3 rounded-lg border border-slate-100 shadow-inner">
                  {parsed.body}
                </p>
              </div>
            );
          })}

          {emailHistory.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-6">
              Nenhum e-mail registrado nesta timeline ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
