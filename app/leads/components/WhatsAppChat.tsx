'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWhatsAppMessages, sendWhatsAppMessage } from '../whatsapp-actions';
import { Send, MessageSquare } from 'lucide-react';

interface WhatsAppChatProps {
  leadId: string;
  leadPhone?: string | null;
}

export default function WhatsAppChat({ leadId, leadPhone }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await getWhatsAppMessages(leadId);
    if (res.success) {
      setMessages(res.messages || []);
      setIsTyping(!!res.isTyping);
      setIsRecording(!!res.isRecording);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // 4-second polling for highly responsive real-time chat experience
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !leadPhone) return;

    setSending(true);
    const texto = newMessage.trim();
    setNewMessage(''); // optimistic clear
    
    // Optimistic UI
    const tempMsg = {
      id: 'temp-' + Date.now(),
      texto: `*Você*:\n${texto}`, // Previa otimista
      direction: 'OUTBOUND',
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const res = await sendWhatsAppMessage(leadId, texto);
    if (res.success) {
      fetchMessages(); // refresh para pegar a mensagem oficial do backend com a assinatura real
    } else {
      alert('Erro ao enviar mensagem: ' + res.error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id)); // rollback
      setNewMessage(texto); // put text back
    }
    setSending(false);
  };

  if (loading) {
    return <div className="p-4 text-slate-500 text-sm">Carregando histórico...</div>;
  }

  if (!leadPhone) {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
          <MessageSquare size={32} />
        </div>
        <h3 className="text-slate-800 font-bold mb-2">Sem número de WhatsApp</h3>
        <p className="text-slate-500 text-sm max-w-sm">Para conversar por WhatsApp, você precisa cadastrar o telefone desse Lead.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]">
      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <span className="bg-[#FFEECD] text-[#665544] px-4 py-2 rounded-lg text-xs font-medium inline-block shadow-sm">
              Nenhuma mensagem trocada com este lead ainda.
            </span>
          </div>
        ) : (
          messages.map(msg => {
            const isOutbound = msg.direction === 'OUTBOUND';
            return (
              <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-lg p-2.5 shadow-sm text-sm whitespace-pre-wrap ${
                    isOutbound 
                      ? 'bg-[#D9FDD3] text-slate-800 rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.texto}
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOutbound ? 'text-emerald-700/60' : 'text-slate-400'}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOutbound && (
                      <span className="text-[14px] leading-none select-none font-bold ml-1">
                        {msg.status === 'READ' ? (
                          <span className="text-[#53bdeb]">✓✓</span>
                        ) : msg.status === 'DELIVERED' ? (
                          <span className="text-slate-400">✓✓</span>
                        ) : (
                          <span className="text-slate-400">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-500 rounded-lg rounded-tl-none p-2.5 shadow-sm text-xs flex items-center gap-2 italic">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span>digitando...</span>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-500 rounded-lg rounded-tl-none p-2.5 shadow-sm text-xs flex items-center gap-2 italic">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span>gravando áudio...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-[#F0F2F5] p-3 flex gap-2 items-end">
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-lg p-3 outline-none text-sm text-slate-700 min-h-[44px] max-h-32 shadow-sm"
            placeholder="Digite uma mensagem..."
            rows={1}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors"
          >
            <Send size={18} className={sending ? 'opacity-50' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
}
