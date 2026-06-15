'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLoggedUser } from '@/app/propostas/actions';
import { 
  getChatList, 
  getInternalMessages, 
  sendInternalMessage, 
  markInternalMessagesAsRead,
  uploadChatFileAction,
  updateUserLastActive
} from '@/app/leads/chat-actions';
import { formatTimeBrasilia, formatLastSeen } from '@/lib/timezone';
import { WavAudioRecorder } from '@/lib/WavAudioRecorder';
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
  FileText,
  Mic,
  Trash,
  Download
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

  // Audio Recording States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const wavRecorderRef = useRef<WavAudioRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);

  // Cleanup recording on unmount or chat change
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (wavRecorderRef.current) {
        try {
          wavRecorderRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [activeChatUser]);

  // Dynamic height viewport state for mobile keyboards (especially iOS Safari)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState<number>(0);

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

  // Handle dynamic sizing under virtual keyboards
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      const vv = window.visualViewport;
      if (vv) {
        setViewportHeight(vv.height);
        setViewportOffsetTop(vv.offsetTop);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
      return () => {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      };
    } else {
      window.addEventListener('resize', updateViewport);
      return () => window.removeEventListener('resize', updateViewport);
    }
  }, []);

  const handleInputFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    }, 80);
  };

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

  // Refs to monitor unread chat count changes and trigger sound alerts
  const prevUnreadChatRef = useRef(-1);

  // Play chime helper using Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Chime play blocked or unsupported:", e);
    }
  };

  useEffect(() => {
    const wasChatInitialized = prevUnreadChatRef.current !== -1;
    const hasNewChat = wasChatInitialized && (totalUnreadChat > prevUnreadChatRef.current);
    
    if (hasNewChat) {
      playNotificationChime();
    }
    prevUnreadChatRef.current = totalUnreadChat;
  }, [totalUnreadChat]);

  // Heartbeat para atualizar o lastActive do usuário logado a cada 10 segundos
  useEffect(() => {
    if (currentUser) {
      updateUserLastActive();
      const interval = setInterval(() => {
        updateUserLastActive();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Sincroniza o activeChatUser com os dados atualizados do chatList (status online/offline em tempo real)
  useEffect(() => {
    if (activeChatUser && chatList.length > 0) {
      const updatedUser = chatList.find(u => u.id === activeChatUser.id);
      if (updatedUser) {
        if (updatedUser.lastActive !== activeChatUser.lastActive || 
            updatedUser.nome !== activeChatUser.nome || 
            updatedUser.avatarUrl !== activeChatUser.avatarUrl) {
          setActiveChatUser(updatedUser);
        }
      }
    }
  }, [chatList, activeChatUser]);

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

  const compressImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const recorder = new WavAudioRecorder();
      wavRecorderRef.current = recorder;
      await recorder.start();
      
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Erro ao acessar o microfone. Certifique-se de dar as devidas permissões no seu navegador.');
      console.error(err);
    }
  };

  const stopAndSendRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecordingVoice(false);
    
    if (wavRecorderRef.current) {
      try {
        const audioBlob = wavRecorderRef.current.stop();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          setUploadingFile(true);
          
          const fileName = `audio_${Date.now()}.wav`;
          const fileType = 'audio/wav';
          
          // Optimistic insert for audio
          const tempMsg = {
            id: 'temp-' + Date.now(),
            senderId: currentUser.id,
            receiverId: activeChatUser.id,
            content: fileName,
            read: false,
            fileUrl: base64, // Local Base64 preview
            fileType: fileType,
            createdAt: new Date()
          };
          setChatMessages(prev => [...prev, tempMsg]);
          
          try {
            const res = await uploadChatFileAction(base64, fileName);
            if (res.success && res.fileUrl) {
              const sendRes = await sendInternalMessage(activeChatUser.id, fileName, res.fileUrl, fileType);
              if (sendRes.success && sendRes.message) {
                setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? sendRes.message : m));
                loadChatListMobile();
              } else {
                alert('Erro ao enviar mensagem de voz: ' + sendRes.error);
                setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
              }
            } else {
              alert('Erro no upload do áudio: ' + res.error);
              setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            }
          } catch (err: any) {
            console.error("Audio recording send error:", err);
            alert("Falha ao enviar mensagem de voz.");
            setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
          } finally {
            setUploadingFile(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      } catch (err) {
        console.error('Wav stop error:', err);
      }
    }
  };

  const cancelRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecordingVoice(false);
    
    if (wavRecorderRef.current) {
      try {
        wavRecorderRef.current.cancel();
      } catch (err) {
        console.error('Wav cancel error:', err);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle chat file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatUser) return;

    setUploadingFile(true);

    try {
      const base64 = await compressImageIfNeeded(file);
      
      const fileType = file.type.startsWith('image/') ? 'image/jpeg' : file.type;
      const fileName = file.type.startsWith('image/') 
        ? (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg') ? file.name : `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}.jpg`)
        : file.name;

      // Optimistic insert for file/photo
      const tempMsg = {
        id: 'temp-' + Date.now(),
        senderId: currentUser.id,
        receiverId: activeChatUser.id,
        content: fileName,
        read: false,
        fileUrl: base64, // Local Base64 preview
        fileType: fileType,
        createdAt: new Date()
      };
      setChatMessages(prev => [...prev, tempMsg]);

      const res = await uploadChatFileAction(base64, fileName);
      if (res.success && res.fileUrl) {
        const sendRes = await sendInternalMessage(activeChatUser.id, fileName, res.fileUrl, fileType);
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
      alert("Erro ao processar arquivo");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    <div 
      className="fixed inset-x-0 bg-slate-50 font-sans flex flex-col overflow-hidden text-slate-800"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100vh',
        top: `${viewportOffsetTop}px`,
        bottom: 'auto',
      }}
    >
      
      {/* HEADER PREMIUM STICKY */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-950 text-white z-40 shadow-md p-4 shrink-0 select-none">
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
                {(() => {
                  const isOnline = activeChatUser.lastActive && (new Date().getTime() - new Date(activeChatUser.lastActive).getTime() < 20000);
                  const cargoPrefix = activeChatUser.cargo ? `${activeChatUser.cargo} • ` : '';
                  if (isOnline) {
                    return (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block leading-none mt-0.5 animate-pulse">
                        {cargoPrefix}Online
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mt-0.5">
                        {cargoPrefix}{formatLastSeen(activeChatUser.lastActive)}
                      </span>
                    );
                  }
                })()}
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
      <main className="flex-1 max-w-lg mx-auto w-full flex flex-col overflow-hidden relative min-h-0 bg-slate-50">
        
        <div className="flex-1 flex flex-col bg-white border-x border-slate-200 overflow-hidden h-full">
          
          {/* Active Conversation Feed */}
          {activeChatUser ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              
              {/* Messages Feed */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]"
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
                    const isAudio = msg.fileUrl && (
                      msg.fileType?.startsWith('audio/') || 
                      /\.(wav|mp3|ogg|webm|m4a)$/i.test(msg.fileUrl)
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
                          {(() => {
                            const isTemp = msg.id && String(msg.id).startsWith('temp-');
                            const fileDownloadUrl = isTemp ? msg.fileUrl : `/api/chat/file/${msg.id}`;
                            if (isImage) {
                              return (
                                <div className="mb-1 rounded-lg overflow-hidden border border-slate-200/50 bg-slate-100 max-w-[240px]">
                                  <a href={fileDownloadUrl} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={fileDownloadUrl} 
                                      alt="Imagem" 
                                      className="w-full h-auto object-cover max-h-[180px] hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                </div>
                              );
                            } else if (isAudio) {
                              return (
                                <div className="mb-1.5 p-1.5 bg-slate-100/85 rounded-lg flex flex-col gap-1 border border-slate-200/50 max-w-[220px]">
                                  <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1 select-none mb-0.5">
                                    <span>🎙️ Mensagem de Voz</span>
                                  </div>
                                  <CustomAudioPlayer src={fileDownloadUrl} fileName={msg.content} />
                                  <a
                                    href={fileDownloadUrl}
                                    download={msg.content || "audio.wav"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-blue-650 hover:text-blue-700 font-bold flex items-center gap-0.5 mt-1 no-underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <Download size={10} /> Baixar Áudio
                                  </a>
                                </div>
                              );
                            } else if (msg.fileUrl) {
                              return (
                                <a 
                                  href={fileDownloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mb-1 p-2 bg-slate-100 rounded-lg flex items-center gap-2 hover:bg-slate-250 transition-colors text-slate-800 font-bold no-underline text-[10px] border border-slate-200/50 max-w-[240px] block"
                                >
                                  <FileText size={16} className="text-blue-600 shrink-0" />
                                  <span className="truncate block flex-1">{msg.content || 'Arquivo Anexo'}</span>
                                </a>
                              );
                            }
                            return null;
                          })()}

                          {msg.content && (!msg.fileUrl || !(isImage || isAudio)) && (
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
              {isRecordingVoice ? (
                <div className="p-3 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 shrink-0 select-none border-x-0 border-b-0 border-solid w-full">
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="w-9 h-9 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl flex items-center justify-center shrink-0 transition-colors border-none cursor-pointer active:scale-95"
                    title="Cancelar gravação"
                  >
                    <Trash size={15} />
                  </button>

                  {/* Pulsing red mic + Duration timer */}
                  <div className="flex-1 flex items-center justify-center gap-2 text-red-500 font-bold text-xs bg-white border border-slate-200 rounded-xl py-2 shadow-xs animate-pulse">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0"></span>
                    <span>Gravando... {formatDuration(recordingDuration)}</span>
                  </div>

                  {/* Stop and Send Button */}
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm border-none cursor-pointer active:scale-95"
                    title="Enviar Áudio"
                  >
                    <Send size={14} className="fill-white" />
                  </button>
                </div>
              ) : (
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
                    onFocus={handleInputFocus}
                  />
                  
                  {newChatMessage.trim() ? (
                    <button
                      type="submit"
                      disabled={sendingChat || uploadingFile}
                      className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer shadow-sm active:scale-95 shrink-0 border-none"
                    >
                      <Send size={14} className="fill-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={sendingChat || uploadingFile}
                      className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer shadow-sm active:scale-95 shrink-0 border-none"
                      title="Gravar Mensagem de Voz"
                    >
                      <Mic size={14} />
                    </button>
                  )}
                </form>
              )}
            </div>
          ) : (
            
            // Contacts Chat List
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
                          {(() => {
                            const isOnline = u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 20000);
                            return (
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-xs ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            );
                          })()}
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
      {!activeChatUser && (
        <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 py-2 select-none flex justify-around items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)] shrink-0">
          
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
      )}

    </div>
  );
}

const CustomAudioPlayer = ({ src, fileName }: { src: string; fileName?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  useEffect(() => {
    if (!audioRef.current) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && duration === 0) {
        setDuration(audio.duration);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [duration]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log(err));
      setIsPlaying(true);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white/95 rounded-2xl p-2 min-w-[210px] max-w-[230px] border border-slate-200/60 shadow-xs mt-1 select-none">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs shrink-0 border-none outline-none active:scale-95"
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-0.5">
            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        {/* Progress bar container */}
        <div 
          onClick={handleProgressBarClick}
          className="w-full bg-slate-100 h-1 rounded-full cursor-pointer relative py-1"
        >
          <div className="absolute inset-x-0 top-1 bg-slate-200 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-75" 
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold leading-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
