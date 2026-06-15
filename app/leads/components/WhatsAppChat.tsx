'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWhatsAppMessages, sendWhatsAppMessage, sendWhatsAppMedia, markWhatsAppMessagesAsRead } from '../whatsapp-actions';
import { Send, MessageSquare, Paperclip, Smile, X, Download, FileText, Mic, Trash, RefreshCw } from 'lucide-react';
import { formatTimeBrasilia } from '@/lib/timezone';
import { WavAudioRecorder } from '@/lib/WavAudioRecorder';

interface WhatsAppChatProps {
  leadId: string;
  leadPhone?: string | null;
}

const compressImage = (base64Str: string, mimeType: string): Promise<string> => {
  return new Promise((resolve) => {
    // Only compress images, keep others as is (excluding gifs)
    if (!mimeType.startsWith('image/') || mimeType === 'image/gif') {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as jpeg with 0.8 quality to ensure very small payload but super high quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

function DynamicWhatsAppMedia({ fileId, messageText }: { fileId: string; messageText: string }) {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMedia = async () => {
      try {
        const { downloadFile } = await import('../actions');
        const res = await downloadFile(fileId);
        if (res.success && res.file && isMounted) {
          setFile(res.file);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching dynamic media:', err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMedia();
    return () => { isMounted = false; };
  }, [fileId]);

  if (loading) {
    if (messageText.includes('📷 Foto:') || messageText.includes('🎥 Vídeo:')) {
      return (
        <div className="w-[280px] h-[180px] bg-slate-100/80 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 animate-pulse">
          <RefreshCw size={20} className="animate-spin text-emerald-600" />
          <span className="text-[10px] text-slate-400 font-medium">Carregando mídia...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 animate-pulse min-w-[240px]">
        <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
          <RefreshCw size={16} className="animate-spin text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="h-3 bg-slate-200 rounded w-24 mb-1.5"></div>
          <div className="h-2.5 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="text-xs text-red-500 flex items-center gap-1.5 p-2 bg-red-50 border border-red-100 rounded-lg">
        <span>⚠️ Erro ao carregar arquivo.</span>
      </div>
    );
  }

  const { base64Data: src, nome: docName, tipo: mimeType } = file;

  const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(docName);
  const isVideo = mimeType.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(docName);
  const isAudio = mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm)$/i.test(docName);

  if (isImage) {
    const lines = messageText.split('\n');
    const photoLine = lines.find(l => l.includes('📷 Foto:')) || '';
    const caption = photoLine.replace('📷 Foto:', '').trim();

    return (
      <div className="flex flex-col gap-2">
        <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-black/5 max-w-sm">
          <img 
            src={src} 
            alt="WhatsApp Photo" 
            className="max-w-full max-h-64 object-contain rounded-lg hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            onClick={() => window.open(src, '_blank')}
          />
        </div>
        {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
        <a 
          href={src} 
          download={docName} 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 mt-1"
          onClick={e => e.stopPropagation()}
        >
          <Download size={12} /> Baixar Foto
        </a>
      </div>
    );
  }

  if (isVideo) {
    const lines = messageText.split('\n');
    const videoLine = lines.find(l => l.includes('🎥 Vídeo:')) || '';
    const caption = videoLine.replace('🎥 Vídeo:', '').trim();

    return (
      <div className="flex flex-col gap-2 w-full max-w-sm">
        <video 
          src={src} 
          controls 
          className="w-full max-h-64 object-contain rounded-lg bg-black"
        />
        {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
        <a 
          href={src} 
          download={docName} 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
          onClick={e => e.stopPropagation()}
        >
          <Download size={12} /> Baixar Vídeo
        </a>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[200px]">
        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">🎵 Mensagem de Voz</div>
        <audio src={src} controls className="w-full h-8" />
        <a 
          href={src} 
          download={docName}
          target="_blank" 
          rel="noreferrer"
          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 mt-1"
          onClick={e => e.stopPropagation()}
        >
          <Download size={10} /> Baixar Áudio
        </a>
      </div>
    );
  }

  // Document/General File
  return (
    <div className="flex flex-col gap-1">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-700 truncate" title={docName}>{docName}</div>
          <div className="text-[10px] text-slate-400">Documento PDF/Office</div>
        </div>
        <a 
          href={src} 
          download={docName}
          target="_blank" 
          rel="noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          Baixar
        </a>
      </div>
    </div>
  );
}

function renderMessageContent(texto: string) {
  if (!texto) return null;

  // Check if text contains a file reference ID
  const fileIdMatch = texto.match(/file-([a-zA-Z0-9-]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    
    // Parse user header if exists (e.g. *Cristiano Silva*:\n)
    const headerMatch = texto.match(/^\*([^*]+)\*:\s*/);
    const header = headerMatch ? headerMatch[0] : '';
    const cleanText = texto.replace(header, '');
    
    return (
      <div className="flex flex-col gap-1">
        {header && <div className="font-bold text-xs text-slate-600 mb-1">{header.replace(/:$/, '').trim()}</div>}
        <DynamicWhatsAppMedia fileId={fileId} messageText={cleanText} />
      </div>
    );
  }

  // Check if it's a photo message
  if (texto.includes('📷 Foto:')) {
    const lines = texto.split('\n');
    const photoLine = lines.find(l => l.includes('📷 Foto:')) || '';
    const caption = photoLine.replace('📷 Foto:', '').trim();
    
    // Find any URL or Base64 in the text
    const urlMatch = texto.match(/https?:\/\/[^\s]+/);
    const base64Match = texto.match(/data:[^;]+;base64,[^\s]+/);
    const src = urlMatch ? urlMatch[0] : (base64Match ? base64Match[0] : null);
    
    if (src) {
      return (
        <div className="flex flex-col gap-2">
          <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-black/5 max-w-sm">
            <img 
              src={src} 
              alt="WhatsApp Photo" 
              className="max-w-full max-h-64 object-contain rounded-lg hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
              onClick={() => window.open(src, '_blank')}
            />
          </div>
          {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
          <a 
            href={src} 
            download 
            target="_blank" 
            rel="noreferrer"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 mt-1"
            onClick={e => e.stopPropagation()}
          >
            <Download size={12} /> Baixar Foto
          </a>
        </div>
      );
    }
  }

  // Check if it's a video message
  if (texto.includes('🎥 Vídeo:')) {
    const lines = texto.split('\n');
    const videoLine = lines.find(l => l.includes('🎥 Vídeo:')) || '';
    const caption = videoLine.replace('🎥 Vídeo:', '').trim();
    
    const urlMatch = texto.match(/https?:\/\/[^\s]+/);
    const base64Match = texto.match(/data:[^;]+;base64,[^\s]+/);
    const src = urlMatch ? urlMatch[0] : (base64Match ? base64Match[0] : null);
    
    if (src) {
      return (
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <video 
            src={src} 
            controls 
            className="w-full max-h-64 object-contain rounded-lg bg-black"
          />
          {caption && <span className="text-slate-800 font-medium block">{caption}</span>}
          <a 
            href={src} 
            download 
            target="_blank" 
            rel="noreferrer"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            onClick={e => e.stopPropagation()}
          >
            <Download size={12} /> Baixar Vídeo
          </a>
        </div>
      );
    }
  }

  // Check if it's an audio message
  if (texto.includes('🎵 Áudio:')) {
    const idx = texto.indexOf('🎵 Áudio:');
    const urlOrBase64 = texto.substring(idx + '🎵 Áudio:'.length).trim();
    if (urlOrBase64) {
      return (
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">🎵 Mensagem de Voz</div>
          <audio src={urlOrBase64} controls className="w-full h-8" />
          <a 
            href={urlOrBase64} 
            download="audio.webm"
            target="_blank" 
            rel="noreferrer"
            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 mt-1"
            onClick={e => e.stopPropagation()}
          >
            <Download size={10} /> Baixar Áudio
          </a>
        </div>
      );
    }
  }

  // Check if it's a document message
  if (texto.includes('📄 Documento:')) {
    const lines = texto.split('\n');
    const docLine = lines.find(l => l.includes('📄 Documento:')) || '';
    const docName = docLine.replace('📄 Documento:', '').trim() || 'Documento';
    
    const urlMatch = texto.match(/https?:\/\/[^\s]+/);
    const base64Match = texto.match(/data:[^;]+;base64,[^\s]+/);
    const src = urlMatch ? urlMatch[0] : (base64Match ? base64Match[0] : null);
    
    if (src) {
      return (
        <div className="flex flex-col gap-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-700 truncate" title={docName}>{docName}</div>
              <div className="text-[10px] text-slate-400">Documento PDF/Office</div>
            </div>
            <a 
              href={src} 
              download={docName}
              target="_blank" 
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
              onClick={e => e.stopPropagation()}
            >
              Baixar
            </a>
          </div>
        </div>
      );
    }
  }

  // If it's a general URL (not formatted specifically but is a web link)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(texto)) {
    // If it's just a general web URL, make it a clickable link!
    const parts = texto.split(urlRegex);
    return (
      <>
        {parts.map((part, i) => {
          if (urlRegex.test(part) || (part.startsWith('http://') || part.startsWith('https://'))) {
            return (
              <a 
                key={i} 
                href={part} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:underline font-semibold break-all"
                onClick={e => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  }

  // Plain text
  return texto;
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
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<any[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Play digital high-quality chime notification sound client-side
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.15);
      playTone(1046.50, now + 0.09, 0.20);
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  // Audio Recording States & Functions (WAV format for full mobile WhatsApp compatibility)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const wavRecorderRef = useRef<WavAudioRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);

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
          setSending(true);
          
          const fileName = `audio_${Date.now()}.wav`;
          
          try {
            const res = await sendWhatsAppMedia(leadId, base64, fileName, 'audio/wav');
            if (res.success) {
              fetchMessages();
            } else {
              alert('Erro ao enviar mensagem de voz: ' + res.error);
            }
          } catch (err: any) {
            console.error("Audio recording send error:", err);
            alert("Falha ao enviar mensagem de voz.");
          } finally {
            setSending(false);
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

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const fetchMessages = async () => {
    const res = await getWhatsAppMessages(leadId);
    if (res.success) {
      const newMessages = res.messages || [];
      const oldMessages = messagesRef.current;
      
      // Check if user is scrolled near the bottom (within 150px threshold)
      let wasNearBottom = true;
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        wasNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      }

      // Play sound if a new message arrives from the client (inbound)
      if (!isFirstLoadRef.current && newMessages.length > oldMessages.length) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.direction === 'INBOUND') {
          playNotificationSound();
        }
      }
      
      setMessages(newMessages);
      setIsTyping(!!res.isTyping);
      setIsRecording(!!res.isRecording);
      
      // Auto-scroll logic:
      // 1. If it's the first time loading messages for this lead
      // 2. Or if the user was already scrolled near the bottom, and a new message arrived
      if (isFirstLoadRef.current || (newMessages.length > oldMessages.length && wasNearBottom)) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: isFirstLoadRef.current ? 'instant' : 'smooth' });
        }, 50);
      }

      if (newMessages.length > 0) {
        isFirstLoadRef.current = false;
      }
      
      // Mark as read in background
      markWhatsAppMessagesAsRead(leadId);
    }
    setLoading(false);
  };

  useEffect(() => {
    isFirstLoadRef.current = true;
    fetchMessages();
    // 4-second polling for highly responsive real-time chat experience
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [leadId]);

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

    // Vercel server action size limit is 4.5MB. Enforce a strict 3MB limit for non-image files.
    // Images will be compressed on the client side, so they bypass this check.
    if (!file.type.startsWith('image/') && file.size > 3 * 1024 * 1024) {
      alert("O arquivo excede o limite de 3MB para envio direto. Por favor, envie arquivos com no máximo 3MB.");
      return;
    }

    setSending(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let base64 = reader.result as string;

        // Compress image client-side to ensure it is extremely light and sends instantly
        if (file.type.startsWith('image/')) {
          base64 = await compressImage(base64, file.type);
        }

        const res = await sendWhatsAppMedia(leadId, base64, file.name, file.type);
        if (res.success) {
          fetchMessages();
        } else {
          alert("Erro ao enviar arquivo: " + res.error);
        }
      } catch (err: any) {
        console.error("Error sending media:", err);
        alert("Falha ao enviar arquivo. O arquivo pode ser muito grande para o servidor.");
      } finally {
        setSending(false);
        if (e.target) e.target.value = '';
      }
    };
    
    reader.onerror = () => {
      alert("Erro ao ler o arquivo local.");
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
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
                  {renderMessageContent(msg.texto)}
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOutbound ? 'text-emerald-700/60' : 'text-slate-400'}`}>
                    <span>{formatTimeBrasilia(msg.createdAt)}</span>
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
        {isRecordingVoice ? (
          <div className="flex-1 flex gap-2 items-center bg-white rounded-xl p-1.5 border border-emerald-100 shadow-sm animate-pulse w-full">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelRecording}
              className="w-10 h-10 bg-red-50 text-red-500 hover:bg-red-100 rounded-full flex items-center justify-center shrink-0 transition-colors"
              title="Cancelar gravação"
            >
              <Trash size={18} />
            </button>

            {/* Pulsing red mic + Duration timer */}
            <div className="flex-1 flex items-center justify-center gap-2 text-red-500 font-bold text-sm">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0"></span>
              <span>Gravando Áudio • {formatDuration(recordingDuration)}</span>
            </div>

            {/* Stop and Send Button */}
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="w-10 h-10 bg-[#1a365d] hover:bg-[#11223c] text-white rounded-full flex items-center justify-center shrink-0 transition-all scale-105 shadow-sm"
              title="Enviar Áudio"
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-end w-full">
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
              {newMessage.trim() ? (
                <button 
                  type="submit" 
                  disabled={sending}
                  className="w-11 h-11 bg-[#1a365d] hover:bg-[#11223c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors"
                  title="Enviar mensagem"
                >
                  <Send size={18} className={sending ? 'opacity-50' : ''} />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={startRecording}
                  disabled={sending}
                  className="w-11 h-11 bg-[#1a365d] hover:bg-[#11223c] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors"
                  title="Gravar mensagem de voz"
                >
                  <Mic size={18} />
                </button>
              )}
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
