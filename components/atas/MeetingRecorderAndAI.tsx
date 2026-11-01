'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Play, Pause, Upload, Sparkles, FileText, CheckSquare, 
  Clock, Volume2, Copy, Check, RefreshCw, AlertCircle, Trash2,
  Layers, MessageSquare, ArrowDownToLine, Flame, Lightbulb, User, Calendar,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { processMeetingAIReport, AISuggestedAction, AIProcessedReport } from '@/app/atas/actions';

interface MeetingRecorderAndAIProps {
  titulo: string;
  dataReuniou: string;
  pautas: string[];
  participantes: { id?: string; userId?: string; nome: string; departamento?: string }[];
  initialAudioUrl?: string | null;
  initialAudioDuracao?: number | null;
  initialTranscricao?: string | null;
  initialResumoIa?: string | null;
  initialAcoesIa?: AISuggestedAction[] | null;
  onApplyMinutaToReport: (htmlMinuta: string) => void;
  onImportAcoes: (acoes: AISuggestedAction[]) => void;
  onUpdateAiData: (data: {
    audioUrl?: string | null;
    audioDuracao?: number | null;
    transcricao?: string | null;
    resumoIa?: string | null;
    acoesSugeridasIa?: any;
  }) => void;
}

export default function MeetingRecorderAndAI({
  titulo,
  dataReuniou,
  pautas,
  participantes,
  initialAudioUrl,
  initialAudioDuracao,
  initialTranscricao,
  initialResumoIa,
  initialAcoesIa,
  onApplyMinutaToReport,
  onImportAcoes,
  onUpdateAiData
}: MeetingRecorderAndAIProps) {
  // Controle de expansão (por padrão começa recolhido para ser super discreto dentro da ATA)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Estados de Gravação
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [audioDuration, setAudioDuration] = useState<number>(initialAudioDuracao || 0);

  // Estados de Áudio Player
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder e SpeechRecognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de Transcrição e IA
  const [transcricao, setTranscricao] = useState<string>(initialTranscricao || '');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'acoes' | 'transcricao' | 'minuta'>('resumo');
  const [aiReport, setAiReport] = useState<AIProcessedReport | null>(() => {
    if (initialResumoIa || initialAcoesIa) {
      return {
        success: true,
        resumoExecutivo: initialResumoIa || '',
        minutaFormatada: '',
        acoesSugeridas: initialAcoesIa || [],
        topicosChave: pautas.filter(Boolean),
        climaReuniao: 'Estratégica e Alinhada',
        duracaoEstimadaMinutos: Math.round((initialAudioDuracao || 60) / 60)
      };
    }
    return null;
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [importedSuccess, setImportedSuccess] = useState(false);

  // Sincroniza props iniciais
  useEffect(() => {
    if (initialAudioUrl && !audioUrl) setAudioUrl(initialAudioUrl);
    if (initialTranscricao && !transcricao) setTranscricao(initialTranscricao);
  }, [initialAudioUrl, initialTranscricao]);

  // Se já houver resumo ou ações geradas, auto-expande para conveniência
  useEffect(() => {
    if (initialResumoIa || (initialAcoesIa && initialAcoesIa.length > 0)) {
      setIsExpanded(true);
    }
  }, [initialResumoIa, initialAcoesIa]);

  // Formata segundos em mm:ss
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Iniciar Gravação
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
          setAudioUrl(base64Audio);
          setAudioDuration(recordingSeconds);
          onUpdateAiData({
            audioUrl: base64Audio,
            audioDuracao: recordingSeconds
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Transcrição Web Speech API (se suportado pelo navegador)
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
              setTranscricao(prev => {
                const combined = (prev ? prev + ' ' : '') + fullText.trim();
                return combined;
              });
            }
          };

          recognition.onerror = (err: any) => {
            console.warn('Speech recognition warning:', err);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition error:', e);
        }
      }

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
    }
  };

  // Parar Gravação
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

  // Upload manual de áudio
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAudioUrl(base64);
      onUpdateAiData({ audioUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Processar com IA
  const handleRunAIAnalysis = async () => {
    if (!transcricao.trim()) {
      alert('Digite ou transcreva a fala da reunião na aba "Transcrição" antes de gerar o relatório de IA.');
      setIsExpanded(true);
      setActiveTab('transcricao');
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

      if (res.success) {
        setAiReport(res);
        onUpdateAiData({
          transcricao,
          resumoIa: res.resumoExecutivo,
          acoesSugeridasIa: res.acoesSugeridas
        });
        setIsExpanded(true);
        setActiveTab('resumo');
      } else {
        alert(res.error || 'Erro ao processar com IA.');
      }
    } catch (e: any) {
      alert(e.message || 'Erro inesperado.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Copiar campo
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Importar ações para a tabela da ATA
  const handleImportAcoesToAta = () => {
    if (!aiReport?.acoesSugeridas || aiReport.acoesSugeridas.length === 0) return;
    onImportAcoes(aiReport.acoesSugeridas);
    setImportedSuccess(true);
    setTimeout(() => setImportedSuccess(false), 3000);
  };

  // Alternar velocidade do player
  const toggleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs text-slate-800 transition-all no-print">
      
      {/* BARRA SUPERIOR DISCRETA E INTEGRADA NA FOLHA DA ATA */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border-b border-slate-200/80">
        
        {/* Identificação Discreta */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1B4D3E]/10 border border-[#1B4D3E]/20 flex items-center justify-center text-[#1B4D3E] shrink-0">
            <Mic size={15} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 tracking-tight">
              Gravação & Assistente IA
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#1B4D3E]/10 text-[#1B4D3E] uppercase tracking-wider">
              Gemini 2.0
            </span>
          </div>
        </div>

        {/* Controles Compactos da Gravação e IA */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Gravador Microfone */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Gravar áudio da reunião pelo microfone"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Gravar Áudio</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="text-rose-800 font-mono font-bold text-[11px]">
                {formatSeconds(recordingSeconds)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] py-0.5 px-2 rounded flex items-center gap-1 cursor-pointer transition-colors ml-1"
              >
                <Square size={10} className="fill-current" /> Parar
              </button>
            </div>
          )}

          {/* Upload de Gravação */}
          <label className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
            <Upload size={13} className="text-slate-500" />
            <span>Upload</span>
            <input 
              type="file" 
              accept="audio/*,video/mp4,video/webm" 
              onChange={handleAudioUpload} 
              className="hidden" 
            />
          </label>

          {/* Disparar Processamento IA */}
          <button
            type="button"
            onClick={handleRunAIAnalysis}
            disabled={isProcessingAI}
            className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Analisa a transcrição com IA e gera síntese executiva e plano de ações"
          >
            {isProcessingAI ? (
              <>
                <RefreshCw size={13} className="animate-spin text-white" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-emerald-300" />
                <span>Processar IA</span>
              </>
            )}
          </button>

          {/* Botão de Expandir / Recolher o Painel Completo de IA */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver Relatório IA'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

      </div>

      {/* ÁUDIO PLAYER COMPACTO (SE HOUVER GRAVAÇÃO) */}
      {audioUrl && (
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-[#1B4D3E]" />
            <span className="font-semibold text-slate-700 text-[11px]">Áudio da Reunião:</span>
            {audioDuration > 0 && (
              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {formatSeconds(audioDuration)}
              </span>
            )}
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              controls 
              className="h-7 max-w-[220px] sm:max-w-xs ml-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeed}
              className="text-[10px] font-mono font-bold bg-white hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-all cursor-pointer"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja excluir este áudio da ata?')) {
                  setAudioUrl(null);
                  onUpdateAiData({ audioUrl: null, audioDuracao: null });
                }
              }}
              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Excluir gravação"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* PAINEL COMPLETO DE IA E TRANSCRIÇÃO (APENAS QUANDO EXPANDIDO) */}
      {isExpanded && (
        <div className="p-4 bg-white animate-fadeIn">
          
          {/* ABAS DISCRETAS DO PAINEL */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('resumo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'resumo'
                    ? 'bg-[#1B4D3E] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText size={13} />
                <span>Síntese Executiva</span>
                {aiReport?.resumoExecutivo && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('acoes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'acoes'
                    ? 'bg-[#1B4D3E] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CheckSquare size={13} />
                <span>Plano de Ações</span>
                {aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 text-white">
                    {aiReport.acoesSugeridas.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transcricao')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'transcricao'
                    ? 'bg-[#1B4D3E] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageSquare size={13} />
                <span>Transcrição</span>
                {transcricao && (
                  <span className="text-[10px] font-mono opacity-80">
                    ({transcricao.split(/\s+/).filter(Boolean).length} pal.)
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('minuta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'minuta'
                    ? 'bg-[#1B4D3E] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers size={13} />
                <span>Minuta Formal</span>
              </button>
            </div>

            {/* Ações Rápidas por Aba */}
            <div>
              {activeTab === 'acoes' && aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportAcoesToAta}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  {importedSuccess ? (
                    <>
                      <Check size={13} />
                      <span>Ações Injetadas na Ata!</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine size={13} />
                      <span>Importar Ações para a Ata</span>
                    </>
                  )}
                </button>
              )}

              {activeTab === 'minuta' && aiReport?.minutaFormatada && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyMinutaToReport(aiReport.minutaFormatada);
                    alert('Minuta formal transferida para o Relatório da Reunião com sucesso!');
                  }}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <ArrowDownToLine size={13} />
                  <span>Aplicar ao Relatório da Reunião</span>
                </button>
              )}
            </div>
          </div>

          {/* CONTEÚDO DA ABA ATIVA */}
          <div className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-200/80 min-h-[140px]">
            
            {/* 1. ABA RESUMO EXECUTIVO */}
            {activeTab === 'resumo' && (
              <div>
                {aiReport?.resumoExecutivo ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium flex items-center gap-1">
                        <Flame size={11} className="text-amber-500" /> Clima: {aiReport.climaReuniao}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium flex items-center gap-1">
                        <Clock size={11} className="text-teal-600" /> Aprox.: {aiReport.duracaoEstimadaMinutos} min
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(aiReport.resumoExecutivo, 'resumo')}
                        className="ml-auto text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
                      >
                        {copiedField === 'resumo' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        {copiedField === 'resumo' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200">
                      {aiReport.resumoExecutivo}
                    </div>

                    {aiReport.topicosChave && aiReport.topicosChave.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                          <Lightbulb size={11} className="text-amber-500" /> Tópicos:
                        </span>
                        {aiReport.topicosChave.map((topico, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                            • {topico}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <Sparkles size={24} className="mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Nenhum relatório de IA gerado ainda.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Grave o áudio ou insira a transcrição e clique em &quot;Processar IA&quot;.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. ABA PLANO DE AÇÕES */}
            {activeTab === 'acoes' && (
              <div>
                {aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {aiReport.acoesSugeridas.map((acao, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between shadow-2xs">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-500">Ação #{idx + 1}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {acao.prioridade}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{acao.descricao}</p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User size={11} className="text-[#1B4D3E]" /> {acao.responsavelNome}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-600">
                            <Calendar size={10} /> {acao.dataLimite ? new Date(acao.dataLimite).toLocaleDateString('pt-BR') : 'Sem data'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <CheckSquare size={24} className="mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Nenhuma ação identificada ainda.</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. ABA TRANSCRIÇÃO */}
            {activeTab === 'transcricao' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Transcrição das falas da reunião:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transcricao, 'transcricao')}
                      disabled={!transcricao}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50"
                    >
                      {copiedField === 'transcricao' ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                    {transcricao && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Deseja limpar a transcrição?')) {
                            setTranscricao('');
                            onUpdateAiData({ transcricao: '' });
                          }
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={transcricao}
                  onChange={e => {
                    setTranscricao(e.target.value);
                    onUpdateAiData({ transcricao: e.target.value });
                  }}
                  placeholder="A transcrição das falas aparecerá aqui em tempo real durante a gravação... Você também pode digitar ou colar anotações de reunião."
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 leading-relaxed focus:border-[#1B4D3E] focus:outline-none resize-y"
                />
              </div>
            )}

            {/* 4. ABA MINUTA FORMAL */}
            {activeTab === 'minuta' && (
              <div>
                {aiReport?.minutaFormatada ? (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(aiReport.minutaFormatada, 'minuta')}
                        className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {copiedField === 'minuta' ? 'Copiado!' : 'Copiar Minuta'}
                      </button>
                    </div>
                    <div 
                      dangerouslySetInnerHTML={{ __html: aiReport.minutaFormatada }}
                      className="p-3 bg-white text-slate-800 rounded-lg text-xs leading-relaxed prose prose-sm max-w-none border border-slate-200"
                    />
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <Layers size={24} className="mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-700">Nenhuma minuta formal estruturada ainda.</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
