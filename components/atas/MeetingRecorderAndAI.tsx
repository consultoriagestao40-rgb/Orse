'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Play, Pause, Upload, Sparkles, FileText, CheckSquare, 
  Clock, Volume2, Copy, Check, RefreshCw, AlertCircle, Trash2, FastForward,
  Layers, MessageSquare, ArrowDownToLine, Flame, Lightbulb, User, Calendar
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
  // Estados de Gravação
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [audioDuration, setAudioDuration] = useState<number>(initialAudioDuracao || 0);

  // Estados de Áudio Player
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [importedSuccess, setImportedSuccess] = useState(false);

  // Sincroniza props iniciais
  useEffect(() => {
    if (initialAudioUrl && !audioUrl) setAudioUrl(initialAudioUrl);
    if (initialTranscricao && !transcricao) setTranscricao(initialTranscricao);
  }, [initialAudioUrl, initialTranscricao]);

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
        // Para tracks de microfone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Inicia timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Inicia Transcrição em Tempo Real se o navegador suportar Web Speech API
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

  // Upload manual de gravação
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
      alert('Digite ou transcreva a fala da reunião antes de gerar a inteligência artificial.');
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

  // Importar ações sugeridas para a tabela de ações da ATA
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
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden mb-8 no-print">
      {/* Background Glow Efeito Executivo */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DA CENTRAL DE INTELIGÊNCIA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Sparkles size={24} className="text-emerald-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black tracking-tight text-white font-display">
                Gravação & Inteligência Artificial da Reunião
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                IA Multimodal 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Grave o áudio da reunião ao vivo ou suba uma gravação para transcrição e extração de ações instantânea.
            </p>
          </div>
        </div>

        {/* CONTROLES DE GRAVAÇÃO E UPLOAD */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-600/30 hover:scale-102 cursor-pointer border-none"
            >
              <Mic size={16} className="animate-pulse" /> Iniciar Gravação
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-rose-950/80 border border-rose-500/50 px-4 py-2 rounded-xl animate-pulse">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <div className="flex items-center gap-2 text-rose-200 font-mono font-bold text-xs">
                <span>GRAVANDO:</span>
                <span>{formatSeconds(recordingSeconds)}</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="bg-white text-rose-950 font-black text-[11px] py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-rose-100 transition-all cursor-pointer border-none ml-2"
              >
                <Square size={12} className="fill-current" /> Finalizar
              </button>
            </div>
          )}

          {/* Upload de Gravação */}
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-700">
            <Upload size={14} className="text-teal-400" />
            <span>Upload de Áudio</span>
            <input 
              type="file" 
              accept="audio/*,video/mp4,video/webm" 
              onChange={handleAudioUpload} 
              className="hidden" 
            />
          </label>

          {/* Botão de Processar IA */}
          <button
            type="button"
            onClick={handleRunAIAnalysis}
            disabled={isProcessingAI || !transcricao.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-102 cursor-pointer border-none"
          >
            {isProcessingAI ? (
              <>
                <RefreshCw size={15} className="animate-spin text-slate-950" />
                <span>Processando IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-slate-950 fill-current" />
                <span>Gerar Relatório com IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ÁUDIO PLAYER EMBUTIDO (QUANDO HOUVER GRAVAÇÃO SALVA OU ENVIADA) */}
      {audioUrl && (
        <div className="mt-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Volume2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                Gravação da Reunião Salva
                {audioDuration > 0 && (
                  <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    {formatSeconds(audioDuration)}
                  </span>
                )}
              </p>
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                controls 
                className="h-8 mt-1 max-w-[280px] sm:max-w-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeed}
              className="text-[10px] font-black font-mono bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="Velocidade de reprodução"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja remover esta gravação de áudio?')) {
                  setAudioUrl(null);
                  onUpdateAiData({ audioUrl: null, audioDuracao: null });
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Remover Gravação"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ÁREA DE RELATÓRIO ESTRUTURADO EM ABAS FEITO POR IA */}
      <div className="mt-6">
        {/* BARRA DE ABAS */}
        <div className="flex items-center justify-between border-b border-slate-800 gap-2 overflow-x-auto pb-px">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('resumo')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'resumo'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText size={14} />
              <span>Síntese Executiva</span>
              {aiReport?.resumoExecutivo && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('acoes')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'acoes'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <CheckSquare size={14} />
              <span>Plano de Ações da IA</span>
              {aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-500 text-white">
                  {aiReport.acoesSugeridas.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transcricao')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'transcricao'
                  ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare size={14} />
              <span>Transcrição Completa</span>
              {transcricao && (
                <span className="text-[10px] font-mono text-slate-500">
                  ({transcricao.split(/\s+/).filter(Boolean).length} palavras)
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('minuta')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'minuta'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers size={14} />
              <span>Minuta Formal para ATA</span>
            </button>
          </div>

          {/* Quick Action para o tab atual */}
          {activeTab === 'acoes' && aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 && (
            <button
              type="button"
              onClick={handleImportAcoesToAta}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
            >
              {importedSuccess ? (
                <>
                  <Check size={13} className="text-emerald-300" />
                  <span>Ações Importadas!</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine size={13} />
                  <span>Importar Ações para a ATA</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'minuta' && aiReport?.minutaFormatada && (
            <button
              type="button"
              onClick={() => {
                onApplyMinutaToReport(aiReport.minutaFormatada);
                alert('Minuta formal transferida para o Relatório da ATA com sucesso!');
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer border-none"
            >
              <ArrowDownToLine size={13} />
              <span>Inserir no Relatório Principal</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO DA ABA ATIVA */}
        <div className="mt-4 bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 min-h-[180px]">
          
          {/* 1. ABA RESUMO EXECUTIVO */}
          {activeTab === 'resumo' && (
            <div>
              {aiReport?.resumoExecutivo ? (
                <div className="space-y-4">
                  {/* Badges de Metadados da IA */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                      <Flame size={12} className="text-amber-400" /> Clima: {aiReport.climaReuniao}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-teal-400" /> Duração aprox.: {aiReport.duracaoEstimadaMinutos} min
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                      <CheckSquare size={12} className="text-blue-400" /> {aiReport.acoesSugeridas?.length || 0} ações extraídas
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(aiReport.resumoExecutivo, 'resumo')}
                      className="ml-auto text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedField === 'resumo' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedField === 'resumo' ? 'Copiado!' : 'Copiar Síntese'}
                    </button>
                  </div>

                  {/* Texto do Resumo */}
                  <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                    {aiReport.resumoExecutivo}
                  </div>

                  {/* Tópicos Chave */}
                  {aiReport.topicosChave && aiReport.topicosChave.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Lightbulb size={13} className="text-amber-400" /> Tópicos Estratégicos Identificados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aiReport.topicosChave.map((topico, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                            • {topico}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Sparkles size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold">Nenhum relatório de IA gerado ainda.</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Inicie a gravação pelo microfone ou digite na aba &quot;Transcrição Completa&quot; e clique em &quot;Gerar Relatório com IA&quot;.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. ABA PLANO DE AÇÕES SUGERIDAS PELA IA */}
          {activeTab === 'acoes' && (
            <div>
              {aiReport?.acoesSugeridas && aiReport.acoesSugeridas.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      A IA identificou <strong>{aiReport.acoesSugeridas.length} ações e prazos</strong> citados durante a conversa.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiReport.acoesSugeridas.map((acao, idx) => {
                      const prioridadeColors = {
                        ALTA: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                        MEDIA: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                        BAIXA: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      };

                      return (
                        <div 
                          key={idx}
                          className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="w-5 h-5 rounded-md bg-slate-800 text-[10px] font-black text-slate-400 flex items-center justify-center">
                                {acao.item || idx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${prioridadeColors[acao.prioridade]}`}>
                                Prioridade {acao.prioridade}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-100 leading-snug">
                              {acao.descricao}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                              <User size={12} className="text-teal-400" />
                              {acao.responsavelNome}
                            </span>
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-amber-300">
                              <Calendar size={11} />
                              {acao.dataLimite ? new Date(acao.dataLimite).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckSquare size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold">Nenhuma ação identificada ainda.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gere o relatório com IA para extrair automaticamente responsáveis e prazos citados na fala.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. ABA TRANSCRIÇÃO COMPLETA */}
          {activeTab === 'transcricao' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Texto bruto transcrito da reunião. Você pode editar diretamente ou colar transcrições externas do Meet/Teams.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transcricao, 'transcricao')}
                    disabled={!transcricao}
                    className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {copiedField === 'transcricao' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedField === 'transcricao' ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                  {transcricao && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja limpar a transcrição atual?')) {
                          setTranscricao('');
                          onUpdateAiData({ transcricao: '' });
                        }
                      }}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
                placeholder="A transcrição das falas aparecerá aqui em tempo real durante a gravação... Você também pode digitar ou colar a transcrição de uma reunião do Google Meet, Zoom ou Teams."
                rows={7}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 font-sans leading-relaxed focus:border-teal-500/50 focus:outline-none resize-y"
              />
            </div>
          )}

          {/* 4. ABA MINUTA FORMAL */}
          {activeTab === 'minuta' && (
            <div>
              {aiReport?.minutaFormatada ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Minuta formal estruturada pela IA pronta para impressão ou exportação em PDF.
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(aiReport.minutaFormatada, 'minuta')}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedField === 'minuta' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedField === 'minuta' ? 'Copiado!' : 'Copiar Minuta'}
                    </button>
                  </div>

                  <div 
                    dangerouslySetInnerHTML={{ __html: aiReport.minutaFormatada }}
                    className="p-4 bg-white text-slate-800 rounded-xl text-xs leading-relaxed prose prose-sm max-w-none shadow-xs border border-slate-300"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Layers size={32} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold">Nenhuma minuta formal estruturada ainda.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gere o relatório com IA para redigir a minuta técnica completa.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
