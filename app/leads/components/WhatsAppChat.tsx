'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWhatsAppMessages, sendWhatsAppMessage, sendWhatsAppMedia, markWhatsAppMessagesAsRead } from '../whatsapp-actions';
import { Send, MessageSquare, Paperclip, Smile, X } from 'lucide-react';

interface WhatsAppChatProps {
  leadId: string;
  leadPhone?: string | null;
}

const EMOJIS = ['👍', '✔️', '😊', '👏', '🤝', '😉', '🚀', '⭐', '💡', '📅', '📞', '❤️', '❌', '⚠️'];

export default function WhatsAppChat({ leadId, leadPhone }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstLoadRef = useRef(true);

  // Play digital high-quality chime notification sound client-side
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5 note
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  const fetchMessages = async () => {
    const res = await getWhatsAppMessages(leadId);
    if (res.success) {
      const newMessages = res.messages || [];
      
      // Play sound if a new message arrives from the client (inbound)
      if (!isFirstLoadRef.current && newMessages.length > messages.length) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.direction === 'INBOUND') {
          playNotificationSound();
        }
      }
      
      if (newMessages.length > 0) {
        isFirstLoadRef.current = false;
      }
      
      setMessages(newMessages);
      setIsTyping(!!res.isTyping);
      setIsRecording(!!res.isRecording);
      
      // Mark as read in background
      markWhatsAppMessagesAsRead(leadId);
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
    setShowEmojiPicker(false);
    
    // Optimistic UI
    const tempMsg = {
      id: 'temp-' + Date.now(),
      texto: texto,
      direction: 'OUTBOUND',
      createdAt: new Date().toISOString(),
      status: 'SENT'
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !leadPhone) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("O arquivo excede o limite de 15MB para envio via WhatsApp.");
      return;
    }

    setSending(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await sendWhatsAppMedia(leadId, base64, file.name, file.type);
      if (res.success) {
        fetchMessages();
      } else {
        alert("Erro ao enviar arquivo: " + res.error);
      }
      setSending(false);
    };
    reader.readAsDataURL(file);
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
      <div className="bg-[#F0F2F5] p-3 flex flex-col gap-2 relative">
        {/* Emoji Selector Panel */}
        {showEmojiPicker && (
          <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 flex flex-wrap gap-2 max-w-full z-10 animate-fade-in mb-1">
            {EMOJIS.map(emoji => (
              <button 
                key={emoji}
                type="button"
                onClick={() => setNewMessage(prev => prev + emoji)}
                className="text-lg p-1.5 hover:bg-slate-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-600 ml-auto p-1.5 rounded"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* File Attach Button */}
          <button 
            type="button"
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors"
            title="Anexar arquivo, foto ou vídeo"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />

          {/* Emoji Toggle Button */}
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-11 h-11 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors"
            title="Emojis"
          >
            <Smile size={18} />
          </button>

          <form onSubmit={handleSend} className="flex-1 flex gap-2 items-end">
            <textarea
              className="flex-1 resize-none rounded-lg p-3 outline-none text-sm text-slate-700 min-h-[44px] max-h-32 shadow-sm bg-white"
              placeholder={sending ? "Enviando..." : "Digite uma mensagem..."}
              disabled={sending}
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
    </div>
  );
}
