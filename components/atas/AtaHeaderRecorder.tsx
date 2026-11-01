'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, Sparkles, Volume2, Trash2, RefreshCw } from 'lucide-react';
import { processMeetingAIReport, AISuggestedAction } from '@/app/atas/actions';

interface AtaHeaderRecorderProps {
  titulo: string;
  dataReuniou: string;
  pautas: string[];
  participantes: { id?: string; userId?: string; nome: string; departamento?: string }[];
  audioUrl: string | null;
  audioDuracao: number | null;
  transcricao: string;
  onUpdateAudio: (audioUrl: string | null, audioDuracao: number | null) => void;
  onUpdateTranscricao: (text: string) => void;
  onAiProcessed: (data: {
    resumoExecutivo: string;
    acoesSugeridas: AISuggestedAction[];
    minutaFormatada: string;
    topicosChave?: string[];
    climaReuniao?: string;
    duracaoEstimadaMinutos?: number;
  }) => void;
  onSelectRelatorioTab?: (tab: 'relatorio' | 'sintese' | 'acoes_ia' | 'transcricao') => void;
}

export default function AtaHeaderRecorder({
  titulo,
  dataReuniou,
  pautas,
  participantes,
  audioUrl,
  audioDuracao,
  transcricao,
  onUpdateAudio,
  onUpdateTranscricao,
  onAiProcessed,
  onSelectRelatorioTab
}: AtaHeaderRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onUpdateAudio(base64Audio, recordingSeconds);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Transcrição em tempo real se suportada
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'pt-BR';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            if (fullText.trim()) {
              onUpdateTranscricao((transcricao ? transcricao + ' ' : '') + fullText.trim());
            }
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition warning:', e);
        }
      }
    } catch (err) {
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onUpdateAudio(base64, null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAI = async () => {
    if (!transcricao.trim()) {
      alert('Grave um áudio ou digite anotações na aba "Transcrição" antes de gerar o relatório com IA.');
      if (onSelectRelatorioTab) onSelectRelatorioTab('transcricao');
      return;
    }

    setIsProcessingAI(true);
    try {
      const res = await processMeetingAIReport({
        transcricao,
        titulo,
        dataReuniou,
        pautas,
        participantes
      });

      if (res.success && res.resumoExecutivo) {
        onAiProcessed({
          resumoExecutivo: res.resumoExecutivo,
          acoesSugeridas: res.acoesSugeridas || [],
          minutaFormatada: res.minutaFormatada || '',
          topicosChave: res.topicosChave,
          climaReuniao: res.climaReuniao,
          duracaoEstimadaMinutos: res.duracaoEstimadaMinutos
        });
        if (onSelectRelatorioTab) onSelectRelatorioTab('sintese');
      } else {
        alert(res.error || 'Erro ao processar relatório de IA.');
      }
    } catch (e: any) {
      alert(e.message || 'Erro inesperado ao conectar com IA.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap no-print">
      
      {/* Botão de Gravação Microfone */}
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          className="bg-white/15 hover:bg-white/25 text-white border border-white/30 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          title="Gravar áudio da reunião pelo microfone"
        >
          <Mic size={12} className="text-emerald-300" />
          <span>Gravar Reunião</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 bg-rose-600/90 border border-rose-400 px-2 py-0.5 rounded-lg text-white animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="font-mono font-bold text-[10px]">{formatSeconds(recordingSeconds)}</span>
          <button
            type="button"
            onClick={stopRecording}
            className="bg-white text-rose-700 font-black text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-rose-50 cursor-pointer ml-1"
          >
            <Square size={8} className="fill-current" /> Parar
          </button>
        </div>
      )}

      {/* Upload de Gravação */}
      <label className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[10px] font-semibold py-1 px-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
        <Upload size={11} className="text-slate-200" />
        <span>Áudio</span>
        <input 
          type="file" 
          accept="audio/*,video/mp4,video/webm" 
          onChange={handleAudioUpload} 
          className="hidden" 
        />
      </label>

      {/* Mini Player quando há gravação */}
      {audioUrl && (
        <div className="flex items-center gap-1 bg-white/15 border border-white/20 px-2 py-0.5 rounded-lg text-white text-[10px]">
          <Volume2 size={11} className="text-emerald-300 shrink-0" />
          <audio ref={audioRef} src={audioUrl} controls className="h-5 w-24 sm:w-32" />
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir o áudio gravado?')) {
                onUpdateAudio(null, null);
              }
            }}
            className="p-0.5 text-white/70 hover:text-rose-300 transition-colors cursor-pointer"
            title="Excluir áudio"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Botão de Processar com IA */}
      <button
        type="button"
        onClick={handleRunAI}
        disabled={isProcessingAI}
        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
        title="Gera síntese executiva e plano de ações com IA a partir da fala"
      >
        {isProcessingAI ? (
          <>
            <RefreshCw size={11} className="animate-spin text-slate-950" />
            <span>Processando IA...</span>
          </>
        ) : (
          <>
            <Sparkles size={11} className="text-slate-950 fill-current" />
            <span>Gerar com IA</span>
          </>
        )}
      </button>

    </div>
  );
}
