'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWhatsAppMessages, sendWhatsAppMessage, sendWhatsAppMedia, markWhatsAppMessagesAsRead, getLeadNotes, addLeadNote, getLeadReminders, addLeadReminder, updateLeadTags, updateLeadQuickDetails } from '../whatsapp-actions';
import { Send, MessageSquare, Paperclip, Smile, X, Download, FileText, Mic, Trash, RefreshCw, Tag, Calendar, Edit3, Plus, Check, Clock, StickyNote, User, DollarSign, Building, Phone, Mail, ChevronLeft } from 'lucide-react';
import { formatTimeBrasilia, formatDateTimeBrasilia, parseDateUTC, getUserTimezone } from '@/lib/timezone';
import { WavAudioRecorder } from '@/lib/WavAudioRecorder';

const getDateDividerLabel = (dateInput: any): string => {
  if (!dateInput) return '';
  try {
    const d = parseDateUTC(dateInput);
    const tz = getUserTimezone();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    const dStr = formatter.format(d);
    const todayStr = formatter.format(today);
    const yestStr = formatter.format(yesterday);

    if (dStr === todayStr) return 'Hoje';
    if (dStr === yestStr) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '';
  }
};

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

  // Extrair qualquer URL presente no texto de fallback
  const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
  const fallbackUrl = urlMatch ? urlMatch[0] : null;

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
    if (fallbackUrl) {
      const docNameMatch = messageText.match(/📄 Documento:\s*([^\n]+)/);
      const docName = docNameMatch ? docNameMatch[1].trim() : 'Documento Anexo';
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fallbackUrl);

      if (isImage) {
        return (
          <div className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 max-w-sm">
              <img 
                src={fallbackUrl} 
                alt="Foto" 
                className="max-w-full max-h-64 object-contain rounded-lg cursor-pointer"
                onClick={() => window.open(fallbackUrl, '_blank')}
              />
            </div>
            <a 
              href={fallbackUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 mt-1"
            >
              <Download size={12} /> Abrir / Baixar Foto
            </a>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-700 truncate" title={docName}>{docName}</div>
              <div className="text-[10px] text-slate-400">Documento Anexo</div>
            </div>
            <a 
              href={fallbackUrl} 
              target="_blank" 
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Download size={12} /> Visualizar / Baixar
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
        <FileText size={16} className="text-slate-400" />
        <span>Arquivo anexo</span>
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

  // Check if text contains an internal file reference ID (not part of an http/https URL)
  const fileIdMatch = !texto.includes('http://') && !texto.includes('https://') ? texto.match(/file-([a-zA-Z0-9-]+)/) : null;
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
  
  // Abas de Ações Rápidas (Chat, Anotações, Lembretes, Etiquetas, Cadastro)
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'reminders' | 'tags' | 'edit'>('chat');
  
  // Estados para Anotações
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Estados para Lembretes
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTipo, setNewReminderTipo] = useState('TAREFA');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);

  // Estados para Etiquetas / Tags
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  // Estados para Edição de Cadastro
  const [editForm, setEditForm] = useState({
    nomeFantasia: '',
    contatoNome: '',
    telefone: leadPhone || '',
    email: '',
    segmento: '',
    valorEst: ''
  });
  const [savingDetails, setSavingDetails] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstLoadRef = useRef(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<any[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Carregar Anotações do Lead
  const fetchNotes = async () => {
    if (!leadId) return;
    const res = await getLeadNotes(leadId);
    if (res.success && res.notes) setNotes(res.notes);
  };

  // Carregar Lembretes do Lead
  const fetchReminders = async () => {
    if (!leadId) return;
    const res = await getLeadReminders(leadId);
    if (res.success && res.reminders) setReminders(res.reminders);
  };

  useEffect(() => {
    if (leadId) {
      fetchNotes();
      fetchReminders();
    }
  }, [leadId]);

  // Adicionar Anotação
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || savingNote) return;
    setSavingNote(true);
    const res = await addLeadNote(leadId, newNoteText.trim());
    if (res.success && res.note) {
      setNotes(prev => [res.note, ...prev]);
      setNewNoteText('');
    } else {
      alert('Erro ao salvar anotação: ' + (res.error || 'Erro desconhecido'));
    }
    setSavingNote(false);
  };

  // Adicionar Lembrete
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate || savingReminder) return;
    setSavingReminder(true);
    const res = await addLeadReminder(leadId, {
      titulo: newReminderTitle.trim(),
      tipo: newReminderTipo,
      dataInicio: newReminderDate
    });
    if (res.success && res.reminder) {
      setReminders(prev => [...prev, res.reminder]);
      setNewReminderTitle('');
      setNewReminderDate('');
    } else {
      alert('Erro ao agendar lembrete: ' + (res.error || 'Erro desconhecido'));
    }
    setSavingReminder(false);
  };

  // Alternar / Salvar Etiquetas
  const handleToggleTag = async (tagToToggle: string) => {
    if (savingTags) return;
    setSavingTags(true);
    let updated: string[];
    if (tagsList.includes(tagToToggle)) {
      updated = tagsList.filter(t => t !== tagToToggle);
    } else {
      updated = [...tagsList, tagToToggle];
    }
    setTagsList(updated);
    await updateLeadTags(leadId, JSON.stringify(updated));
    setSavingTags(false);
  };

  const handleAddCustomTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTag.trim() || savingTags) return;
    const tagFormatted = newCustomTag.trim();
    if (tagsList.includes(tagFormatted)) {
      setNewCustomTag('');
      return;
    }
    setSavingTags(true);
    const updated = [...tagsList, tagFormatted];
    setTagsList(updated);
    setNewCustomTag('');
    await updateLeadTags(leadId, JSON.stringify(updated));
    setSavingTags(false);
  };

  // Salvar Alterações no Cadastro
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingDetails) return;
    setSavingDetails(true);
    const res = await updateLeadQuickDetails(leadId, {
      nomeFantasia: editForm.nomeFantasia,
      contatoNome: editForm.contatoNome,
      telefone: editForm.telefone,
      email: editForm.email,
      segmento: editForm.segmento,
      valorEst: Number(editForm.valorEst) || 0
    });
    if (res.success) {
      alert('Cadastro do Lead atualizado com sucesso!');
      setActiveTab('chat');
    } else {
      alert('Erro ao atualizar cadastro: ' + (res.error || 'Erro desconhecido'));
    }
    setSavingDetails(false);
  };

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
      {/* Sub-Header com Abas Rápidas: Chat, Anotações, Lembretes, Etiquetas, Cadastro */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between gap-1 shadow-xs shrink-0 overflow-x-auto scrollbar-none z-10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat' ? 'bg-[#1a365d] text-white shadow-2xs font-black' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('notes');
              fetchNotes();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes' ? 'bg-[#1a365d] text-white shadow-2xs font-black' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <StickyNote size={13} className="text-amber-500" />
            <span>Anotações</span>
            {notes.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 rounded-full font-extrabold">{notes.length}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reminders');
              fetchReminders();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reminders' ? 'bg-[#1a365d] text-white shadow-2xs font-black' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={13} className="text-blue-500" />
            <span>Lembretes</span>
            {reminders.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 rounded-full font-extrabold">{reminders.length}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tags' ? 'bg-[#1a365d] text-white shadow-2xs font-black' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag size={13} className="text-emerald-500" />
            <span>Etiquetas</span>
            {tagsList.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 rounded-full font-extrabold">{tagsList.length}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'edit' ? 'bg-[#1a365d] text-white shadow-2xs font-black' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 size={13} className="text-slate-600" />
            <span>Cadastro</span>
          </button>
        </div>

        {/* Tags badges no topo */}
        {tagsList.length > 0 && activeTab === 'chat' && (
          <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[220px]">
            {tagsList.map(t => (
              <span key={t} className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                🏷️ {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Painel: Anotações Internas */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <StickyNote size={14} className="text-amber-500" /> Nova Anotação Interna
            </h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                placeholder="Escreva uma observação importante sobre esse lead/cliente..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800 min-h-[80px]"
                rows={3}
              />
              <button
                type="submit"
                disabled={savingNote || !newNoteText.trim()}
                className="bg-[#1a365d] hover:bg-[#11223c] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} /> Salvar Anotação
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Histórico de Anotações</h4>
            {notes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
                Nenhuma anotação cadastrada ainda.
              </div>
            ) : (
              notes.map((note: any) => (
                <div key={note.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center uppercase">
                        {note.user?.nome?.substring(0, 2) || 'US'}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{note.user?.nome || 'Usuário'}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {new Date(note.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap pl-6">{note.texto}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Painel: Lembretes / Agendamentos */}
      {activeTab === 'reminders' && (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock size={14} className="text-blue-500" /> Agendar Lembrete / Follow-up
            </h4>
            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Título do Lembrete</label>
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={e => setNewReminderTitle(e.target.value)}
                  placeholder="Ex: Retornar ligação para alinhar orçamento"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <select
                    value={newReminderTipo}
                    onChange={e => setNewReminderTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="TAREFA">📝 Tarefa</option>
                    <option value="LIGACAO">📞 Ligação</option>
                    <option value="REUNIAO">🤝 Reunião</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Data e Hora</label>
                  <input
                    type="datetime-local"
                    value={newReminderDate}
                    onChange={e => setNewReminderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-medium text-slate-800 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingReminder || !newReminderTitle.trim() || !newReminderDate}
                className="bg-[#1a365d] hover:bg-[#11223c] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Clock size={14} /> Agendar Lembrete
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Lembretes Cadastrados</h4>
            {reminders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium bg-white rounded-2xl border border-slate-200">
                Nenhum lembrete agendado para este lead.
              </div>
            ) : (
              reminders.map((rem: any) => (
                <div key={rem.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full inline-block">
                      {rem.tipo}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">{rem.titulo}</h5>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-700 block">
                      {new Date(rem.dataInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {new Date(rem.dataInicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Painel: Etiquetas / Tags */}
      {activeTab === 'tags' && (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-500" /> Etiquetas Rápidas (Clique para ativar/desativar)
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'VIP', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
                { name: 'Urgente', bg: 'bg-red-100 text-red-800 border-red-300' },
                { name: 'Orçamento', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
                { name: 'Retornar Hoje', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                { name: 'Em Negociação', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
                { name: 'Aguardando Cliente', bg: 'bg-pink-100 text-pink-800 border-pink-300' },
                { name: 'Qualificado', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' }
              ].map(t => {
                const isActive = tagsList.includes(t.name);
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleToggleTag(t.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isActive ? `${t.bg} ring-2 ring-emerald-500 shadow-xs` : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isActive ? <Check size={14} className="text-emerald-600" /> : <Tag size={12} className="text-slate-400" />}
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Criar Etiqueta Personalizada</label>
              <form onSubmit={handleAddCustomTag} className="flex gap-2">
                <input
                  type="text"
                  value={newCustomTag}
                  onChange={e => setNewCustomTag(e.target.value)}
                  placeholder="Ex: Contrato Assinado"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                />
                <button
                  type="submit"
                  disabled={savingTags || !newCustomTag.trim()}
                  className="bg-[#1a365d] hover:bg-[#11223c] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Painel: Edição de Cadastro */}
      {activeTab === 'edit' && (
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 size={14} className="text-slate-600" /> Editar Cadastro do Lead
            </h4>
            <form onSubmit={handleSaveDetails} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Fantasia / Empresa</label>
                <input
                  type="text"
                  value={editForm.nomeFantasia}
                  onChange={e => setEditForm({ ...editForm, nomeFantasia: e.target.value })}
                  placeholder="Nome da Empresa"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Contato</label>
                  <input
                    type="text"
                    value={editForm.contatoNome}
                    onChange={e => setEditForm({ ...editForm, contatoNome: e.target.value })}
                    placeholder="Nome da pessoa"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.telefone}
                    onChange={e => setEditForm({ ...editForm, telefone: e.target.value })}
                    placeholder="+55 (00) 00000-0000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="contato@empresa.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Segmento</label>
                  <input
                    type="text"
                    value={editForm.segmento}
                    onChange={e => setEditForm({ ...editForm, segmento: e.target.value })}
                    placeholder="Ex: INDUSTRIAS"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Valor Estimado (R$)</label>
                <input
                  type="number"
                  value={editForm.valorEst}
                  onChange={e => setEditForm({ ...editForm, valorEst: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1a365d] bg-slate-50 font-bold text-emerald-700"
                />
              </div>

              <button
                type="submit"
                disabled={savingDetails || !editForm.nomeFantasia.trim()}
                className="bg-[#1a365d] hover:bg-[#11223c] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check size={14} /> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Área de Mensagens (Exibida somente na aba 'chat') */}
      {activeTab === 'chat' && (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <span className="bg-[#FFEECD] text-[#665544] px-4 py-2 rounded-lg text-xs font-medium inline-block shadow-sm">
              Nenhuma mensagem trocada com este lead ainda.
            </span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOutbound = msg.direction === 'OUTBOUND';
            const dateLabel = getDateDividerLabel(msg.createdAt);
            const prevDateLabel = index > 0 ? getDateDividerLabel(messages[index - 1].createdAt) : null;
            const showDateDivider = dateLabel && dateLabel !== prevDateLabel;

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="flex justify-center my-3 sticky top-2 z-10 pointer-events-none">
                    <span className="bg-white/90 backdrop-blur-md shadow-2xs border border-slate-200/80 text-slate-600 px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wide select-none">
                      {dateLabel}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-lg p-2.5 shadow-sm text-sm whitespace-pre-wrap ${
                      isOutbound 
                        ? 'bg-[#D9FDD3] text-slate-800 rounded-tr-none' 
                        : 'bg-white text-[#111b21] rounded-tl-none'
                    }`}
                  >
                    {renderMessageContent(msg.texto)}
                    <div 
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOutbound ? 'text-emerald-700/60' : 'text-slate-400'}`}
                      title={formatDateTimeBrasilia(msg.createdAt)}
                    >
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
              </React.Fragment>
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
