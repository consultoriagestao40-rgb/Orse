'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getChatList, 
  getInternalMessages, 
  sendInternalMessage, 
  markInternalMessagesAsRead,
  uploadChatFileAction
} from '@/app/leads/chat-actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { formatTimeBrasilia } from '@/lib/timezone';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Search, 
  MessageSquare, 
  ChevronRight, 
  PlusCircle, 
  Send, 
  User, 
  Building, 
  Target, 
  ArrowLeft, 
  X, 
  Wrench, 
  Truck, 
  LogOut, 
  RefreshCw,
  Bell,
  Paperclip,
  Image,
  FileText
} from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // User States
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Chat States
  const [chatList, setChatList] = useState<any[]>([]);
  const [totalUnreadChat, setTotalUnreadChat] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [loadingChatMessages, setLoadingChatMessages] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fetch logged user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getLoggedUser();
        if (user) {
          setCurrentUser(user);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Erro ao buscar usuário logado:', err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  const isTecnico = currentUser?.cargo?.toLowerCase().includes('tecnico') || currentUser?.cargo?.toLowerCase().includes('técnico');
  const isEntregador = currentUser?.cargo?.toLowerCase().includes('entregador') || 
                       currentUser?.cargo?.toLowerCase().includes('entrega') || 
                       currentUser?.cargo?.toLowerCase().includes('motoboy') || 
                       currentUser?.cargo?.toLowerCase().includes('motorista');
  const isGestor = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isSomenteTecnico = isTecnico && !isGestor;
  const isSomenteEntregador = isEntregador && !isGestor;

  // Load chat list
  const loadChatListMobile = async () => {
    if (!currentUser) return;
    try {
      const res = await getChatList();
      if (res.success && res.chatList) {
        setChatList(res.chatList);
        setTotalUnreadChat(res.totalUnread || 0);

        // Check if there is an activeChatUser query parameter and select it if not already selected
        const chatWithParam = searchParams.get('chatWith');
        if (chatWithParam && !activeChatUser) {
          const targetUser = res.chatList.find((u: any) => u.id === chatWithParam);
          if (targetUser) {
            handleSelectChatUserMobile(targetUser);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadChatListMobile();
      const interval = setInterval(loadChatListMobile, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, searchParams]);

  // Load active chat messages
  const loadActiveChatMessages = async (otherId: string) => {
    try {
      const res = await getInternalMessages(otherId);
      if (res.success && res.messages) {
        setChatMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser && activeChatUser) {
      loadActiveChatMessages(activeChatUser.id);
      const interval = setInterval(() => {
        loadActiveChatMessages(activeChatUser.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeChatUser]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Mark chat as read
  useEffect(() => {
    if (activeChatUser && chatMessages.length > 0) {
      const hasUnread = chatMessages.some(m => m.senderId === activeChatUser.id && !m.read);
      if (hasUnread) {
        markInternalMessagesAsRead(activeChatUser.id).then(() => {
          loadChatListMobile();
        });
      }
    }
  }, [chatMessages, activeChatUser]);

  // Open specific Team Chat
  const handleSelectChatUserMobile = async (u: any) => {
    setActiveChatUser(u);
    setLoadingChatMessages(true);
    try {
      await markInternalMessagesAsRead(u.id);
      const res = await getInternalMessages(u.id);
      if (res.success && res.messages) {
        setChatMessages(res.messages);
      }
      loadChatListMobile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChatMessages(false);
    }
  };

  // Handle chat file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatUser) return;

    setUploadingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setUploadingFile(false);
        return;
      }

      // Optimistic insert for file/photo
      const tempMsg = {
        id: 'temp-' + Date.now(),
        senderId: currentUser.id,
        receiverId: activeChatUser.id,
        content: file.name,
        read: false,
        fileUrl: base64, // Local Base64 preview
        fileType: file.type,
        createdAt: new Date()
      };
      setChatMessages(prev => [...prev, tempMsg]);

      try {
        const res = await uploadChatFileAction(base64, file.name);
        if (res.success && res.fileUrl) {
          const sendRes = await sendInternalMessage(activeChatUser.id, file.name, res.fileUrl, file.type);
          if (sendRes.success && sendRes.message) {
            setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? sendRes.message : m));
            loadChatListMobile();
          } else {
            alert("Erro ao enviar arquivo: " + sendRes.error);
            setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
          }
        } else {
          alert("Erro no upload do arquivo: " + res.error);
          setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
      } catch (err) {
        console.error(err);
        setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendChatMessageMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatUser || !newChatMessage.trim() || sendingChat) return;

    const content = newChatMessage;
    setNewChatMessage('');
    setSendingChat(true);

    // Optimistic insert
    const tempMsg = {
      id: 'temp-' + Date.now(),
      senderId: currentUser.id,
      receiverId: activeChatUser.id,
      content: content.trim(),
      read: false,
      createdAt: new Date()
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendInternalMessage(activeChatUser.id, content);
      if (res.success && res.message) {
        setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
        loadChatListMobile();
      } else {
        alert("Erro ao enviar mensagem: " + res.error);
        setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSendingChat(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Iniciando Chat...</p>
      </div>
    );
  }

  const handleBackNavigation = () => {
    if (activeChatUser) {
      setActiveChatUser(null);
    } else {
      if (isSomenteTecnico) {
        router.push('/ativos/tecnico');
      } else if (isSomenteEntregador) {
        router.push('/entrega/entregador');
      } else {
        router.push('/leads/mobile');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans flex flex-col relative text-slate-800">
      
      {/* HEADER PREMIUM STICKY */}
      <header className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-950 text-white z-40 shadow-md p-4 shrink-0 select-none">
        {activeChatUser ? (
          /* CONVERSATION HEADER (SHOW ACTIVE PARTNER) */
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setActiveChatUser(null)}
                className="p-1.5 bg-slate-800/40 border border-slate-800/60 text-slate-450 hover:text-white rounded-xl active:scale-95 cursor-pointer flex items-center justify-center text-white"
              >
                <ArrowLeft size={16} />
              </button>
              
              {activeChatUser.avatarUrl ? (
                <img 
                  src={activeChatUser.avatarUrl} 
                  alt={activeChatUser.nome} 
                  className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-black text-sm shrink-0">
                  {activeChatUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
              
              <div className="min-w-0 text-left">
                <span className="text-xs font-black uppercase block text-white leading-tight truncate">{activeChatUser.nome}</span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block leading-none mt-0.5">
                  {activeChatUser.cargo ? `${activeChatUser.cargo} • Online` : 'Online'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* DEFAULT MAIN CHAT LIST HEADER (SHOW LOGGED IN USER) */
          <>
            {/* Gestor Quick Nav Toggle */}
            {isGestor && (
              <div className="flex justify-around items-center bg-white/[0.03] border border-white/5 rounded-2xl p-1 mb-3">
                <button
                  onClick={() => router.push('/leads/mobile')}
                  className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all cursor-pointer"
                >
                  <Building size={11} /> CRM
                </button>
                <button
                  onClick={() => router.push('/ativos/tecnico')}
                  className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all hover:text-white cursor-pointer"
                >
                  <Wrench size={11} /> Técnico
                </button>
                <button
                  onClick={() => router.push('/entrega/entregador')}
                  className="flex-1 flex items-center justify-center gap-1 bg-transparent text-slate-400 border-none py-1.5 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all hover:text-white cursor-pointer"
                >
                  <Truck size={11} /> Entrega
                </button>
              </div>
            )}

            {/* User Info Line */}
            <div className="flex justify-between items-center mb-3.5 w-full">
              <div className="flex items-center gap-3 min-w-0">
                {currentUser?.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.nome} 
                    className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center font-black text-sm shrink-0">
                    {currentUser?.nome ? currentUser.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <span className="text-xs font-black uppercase block text-white leading-tight truncate">{currentUser?.nome}</span>
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest block leading-none mt-0.5">{currentUser?.cargo || 'Membro da Equipe'}</span>
                </div>
              </div>

              <a 
                href="/api/auth/logout"
                className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-xl cursor-pointer flex items-center justify-center text-white"
                title="Sair da Conta (Logout)"
              >
                <LogOut size={16} />
              </a>
            </div>

            {/* Back and Page Title Line */}
            <div className="flex items-center gap-2 mt-3.5">
              <button 
                onClick={handleBackNavigation}
                className="p-1.5 bg-slate-800/40 border border-slate-800/60 text-slate-450 hover:text-white rounded-xl active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-xs font-black uppercase tracking-wider text-white">
                Chat da Equipe
              </h1>
            </div>
          </>
        )}
      </header>

      {/* CORE VIEW */}
      <main className="flex-1 px-3 py-4 max-w-lg mx-auto w-full flex flex-col h-[70vh]">
        
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden h-full min-h-[60vh]">
          
          {/* Active Conversation Feed */}
          {activeChatUser ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              
              {/* Messages Feed */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] min-h-[45vh]"
                style={{
                  backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                  backgroundBlendMode: 'overlay',
                }}
              >
                {loadingChatMessages ? (
                  <div className="flex h-full items-center justify-center bg-white/20">
                    <RefreshCw className="animate-spin text-blue-600" size={24} />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-xs border border-slate-200/60 mb-2">
                      <MessageSquare size={16} />
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase">Nenhuma mensagem</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isMe = msg.senderId === currentUser.id;
                    const showDoubleCheck = msg.read;
                    const isImage = msg.fileUrl && (
                      msg.fileType?.startsWith('image/') || 
                      /\.(jpg|jpeg|png|webp|gif)$/i.test(msg.fileUrl)
                    );
                    
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs shadow-xs relative ${
                            isMe
                              ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none'
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/40'
                          }`}
                        >
                          {isImage ? (
                            <div className="mb-1 rounded-lg overflow-hidden border border-slate-200/50 bg-slate-100 max-w-[240px]">
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={msg.fileUrl} 
                                  alt="Imagem" 
                                  className="w-full h-auto object-cover max-h-[180px] hover:opacity-90 transition-opacity"
                                />
                              </a>
                            </div>
                          ) : msg.fileUrl ? (
                            <a 
                              href={msg.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mb-1 p-2 bg-slate-100 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors text-slate-800 font-bold no-underline text-[10px] border border-slate-200/50 max-w-[240px] block"
                            >
                              <FileText size={16} className="text-blue-600 shrink-0" />
                              <span className="truncate block flex-1">{msg.content || 'Arquivo Anexo'}</span>
                            </a>
                          ) : null}

                          {msg.content && (!msg.fileUrl || !isImage) && (
                            <p className="break-words font-medium pr-10 whitespace-pre-wrap">{msg.content}</p>
                          )}
                          
                          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[8px] font-bold text-slate-400 select-none">
                            <span>
                              {formatTimeBrasilia(msg.createdAt)}
                            </span>
                            {isMe && (
                              <span className={`font-black ${showDoubleCheck ? 'text-blue-500' : 'text-slate-400'}`}>
                                {showDoubleCheck ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />

              {/* Input Form */}
              <form 
                onSubmit={handleSendChatMessageMobile}
                className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 shrink-0 select-none border-x-0 border-b-0 border-solid"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendingChat || uploadingFile}
                  className="w-9 h-9 bg-slate-200 hover:bg-slate-350 text-slate-650 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 border-none"
                  title="Anexar Foto ou Arquivo"
                >
                  {uploadingFile ? (
                    <RefreshCw className="animate-spin text-slate-600" size={14} />
                  ) : (
                    <Paperclip size={14} className="text-slate-600" />
                  )}
                </button>

                <input
                  type="text"
                  placeholder="Digite uma mensagem..."
                  value={newChatMessage}
                  onChange={e => setNewChatMessage(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold text-slate-700"
                  disabled={sendingChat || uploadingFile}
                />
                
                <button
                  type="submit"
                  disabled={sendingChat || uploadingFile || !newChatMessage.trim()}
                  className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer shadow-sm active:scale-95 shrink-0 border-none"
                >
                  <Send size={14} className="fill-white" />
                </button>
              </form>
            </div>
          ) : (
            
            // Contacts Chat List
            <div className="flex-1 flex flex-col overflow-hidden bg-white min-h-[50vh]">
              <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input 
                    type="text"
                    placeholder="Pesquisar contatos..."
                    value={chatSearchTerm}
                    onChange={e => setChatSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-blue-600 outline-none transition-all font-semibold text-slate-700 placeholder-slate-400"
                  />
                  {chatSearchTerm && (
                    <button 
                      onClick={() => setChatSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 bg-transparent border-none"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white no-scrollbar divide-solid">
                {chatList
                  .filter(u => u.nome.toLowerCase().includes(chatSearchTerm.toLowerCase()))
                  .map((u) => {
                    const initials = u.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                    
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleSelectChatUserMobile(u)}
                        className="p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 border-b border-slate-100 border-solid"
                      >
                        <div className="relative shrink-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.nome}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl flex items-center justify-center text-[10px] font-black uppercase">
                              {initials}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white shadow-xs" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-xs md:text-sm font-bold text-slate-800 truncate">{u.nome}</h4>
                            {u.lastMessage && (
                              <span className="text-[8px] text-slate-400 font-semibold ml-1">
                                {formatTimeBrasilia(u.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>

                          <div className="text-[9px] text-slate-400 font-bold uppercase truncate">{u.cargo || 'Membro da Equipe'}</div>

                          {u.lastMessage && (
                            <p className={`text-xs truncate mt-1 ${u.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                              {u.lastMessage.senderId === currentUser.id ? 'Você: ' : ''}
                              {u.lastMessage.content}
                            </p>
                          )}
                        </div>

                        {u.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                            {u.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE TAB NAVIGATION BAR FIXED AT BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 py-2 select-none border-x-0 border-b-0 border-solid flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        
        {!isSomenteTecnico && !isSomenteEntregador && (
          <>
            {/* Tab CRM */}
            <button
              onClick={() => {
                router.push('/leads/mobile');
              }}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold"
            >
              <Building size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Funil CRM</span>
            </button>

            {/* Tab Prospecção */}
            <button
              onClick={() => {
                router.push('/leads/mobile?tab=prospeccao');
              }}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold"
            >
              <Target size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Prospecção</span>
            </button>

            {/* Tab Novo Lead */}
            <button
              onClick={() => {
                router.push('/leads/mobile?openCreate=true');
              }}
              className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl active:scale-95 transition-all bg-transparent border-none text-slate-400 font-bold"
            >
              <PlusCircle size={18} className="text-slate-400" />
              <span className="text-[8px] uppercase tracking-wider">Novo Lead</span>
            </button>
          </>
        )}

        {isSomenteTecnico && (
          /* Tab Técnico return link */
          <a
            href="/ativos/tecnico"
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
          >
            <Wrench size={18} className="text-slate-400" />
            <span className="text-[8px] uppercase tracking-wider">Técnico</span>
          </a>
        )}

        {isSomenteEntregador && (
          /* Tab Entregador return link */
          <a
            href="/entrega/entregador"
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent text-slate-400 font-bold no-underline"
          >
            <Truck size={18} className="text-slate-400" />
            <span className="text-[8px] uppercase tracking-wider">Entrega</span>
          </a>
        )}

        {/* Tab Chat Interno (Active) */}
        <button
          onClick={() => {
            setActiveChatUser(null);
            loadChatListMobile();
          }}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl active:scale-95 transition-all bg-transparent border-none relative text-blue-600 font-black"
        >
          <MessageSquare size={18} className="text-blue-600" />
          <span className="text-[8px] uppercase tracking-wider">Chat Time</span>
          {totalUnreadChat > 0 && (
            <span className="absolute top-1 right-3 bg-blue-500 text-white text-[7px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse">
              {totalUnreadChat}
            </span>
          )}
        </button>
      </nav>

    </div>
  );
}
