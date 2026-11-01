'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  ArrowLeft, Download, FileText, Bot, Send, Sparkles, 
  CheckCircle2, AlertCircle, Edit2, Calendar, MapPin, 
  Users, DollarSign, Shield, RefreshCw, BookOpen, Search,
  ChevronDown, ChevronUp, Copy, Check, Maximize2, Minimize2, X
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getCCTById } from '@/app/ccts/actions';
import { formatVigenciaDate } from '@/lib/cctParser';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  clausulaCitada?: string;
  trechoOriginal?: string;
  timestamp: string;
}

function FormattedChatText({ text, isUser }: { text: string; isUser: boolean }) {
  if (!text) return null;

  if (isUser) {
    return <p className="whitespace-pre-line font-medium leading-relaxed">{text}</p>;
  }

  const renderInlineFormatted = (str: string) => {
    const parts: React.ReactNode[] = [];
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = tokenRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-black text-slate-900">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-700 font-semibold">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point principal (• ou -)
        if (trimmed.startsWith('•') || (trimmed.startsWith('- ') && !trimmed.startsWith('---'))) {
          const content = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5 text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E] shrink-0 mt-1.5" />
              <div className="flex-1 leading-snug">{renderInlineFormatted(content)}</div>
            </div>
          );
        }

        // Sub-bullet indentado
        if (trimmed.startsWith('  -') || trimmed.startsWith('    -')) {
          const content = trimmed.replace(/^\s*[\-•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-3 py-0.5 text-slate-700">
              <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0 mt-1.5" />
              <div className="flex-1 leading-snug">{renderInlineFormatted(content)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800">
            {renderInlineFormatted(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function PublishedCCTPage() {
  const params = useParams();
  const router = useRouter();
  const cctId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [cct, setCct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'funcoes' | 'beneficios' | 'clausulas'>('funcoes');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou o Assistente de Inteligência Artificial desta CCT. Você pode me fazer qualquer pergunta sobre pisos salariais, benefícios, estabilidade, regras de atestados médicos ou jornadas de trabalho estabelecidas nesta convenção.',
      timestamp: 'Agora'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClausulaId, setExpandedClausulaId] = useState<string | null>(null);
  const [clausulaSearch, setClausulaSearch] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [expandedTrechos, setExpandedTrechos] = useState<Record<string, boolean>>({});

  const toggleTrecho = (id: string) => {
    setExpandedTrechos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false);
        setIsChatExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen]);

  useEffect(() => {
    async function loadData() {
      if (!cctId) return;
      setLoading(true);
      try {
        const data = await getCCTById(cctId);
        if (data) {
          setCct(data);
        }
      } catch (err) {
        console.error('Erro ao carregar CCT:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [cctId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setChatLoading(true);

    try {
      const res = await fetch(`/api/cct/${cctId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: textToSend })
      });

      const data = await res.json();
      if (data.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.resposta,
          clausulaCitada: data.clausulaCitada,
          trechoOriginal: data.trechoOriginal,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Desculpe, ocorreu um erro ao consultar o conteúdo da CCT: ' + (data.error || 'Tente novamente.'),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Erro de conexão com o assistente: ' + err.message,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPdf = () => {
    if (!cct?.pdfUrl) {
      alert('Nenhum arquivo PDF original foi anexado a esta CCT.');
      return;
    }

    const a = document.createElement('a');
    a.href = cct.pdfUrl;
    a.download = cct.pdfNome || `CCT_${cct.nome.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };


  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="animate-spin text-[#1B4D3E]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando Convenção Coletiva...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!cct) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-black text-slate-800">CCT Não Encontrada</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">A regra técnica solicitada não foi localizada ou você não possui permissão para acessá-la.</p>
            <Link href="/admin/ccts" className="bg-[#1B4D3E] text-white px-5 py-2.5 rounded-xl text-xs font-bold">
              Voltar ao Gerenciador de CCTs
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const clausulasList: any[] = Array.isArray(cct.resumoClausulas) ? cct.resumoClausulas : [];
  const filteredClausulas = clausulasList.filter(c => 
    !clausulaSearch || 
    (c.titulo && c.titulo.toLowerCase().includes(clausulaSearch.toLowerCase())) ||
    (c.numero && c.numero.toLowerCase().includes(clausulaSearch.toLowerCase())) ||
    (c.texto && c.texto.toLowerCase().includes(clausulaSearch.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* NAVEGAÇÃO E BREADCRUMB */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/ccts"
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar para Regras (CCTs)
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isChatOpen
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] border border-emerald-300'
                }`}
              >
                <Bot size={15} />
                <span>{isChatOpen ? 'Fechar Chat IA' : 'CCT Copilot IA'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <Link
                href={`/admin/ccts/${cct.id}/edit`}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Edit2 size={14} /> Editar Valores
              </Link>

              {cct.pdfUrl && (
                <button
                  onClick={handleDownloadPdf}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={14} /> Baixar PDF Original
                </button>
              )}
            </div>
          </div>

          {/* HEADER DA CCT PUBLICADA */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Norma Publicada
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-slate-200">
                    UF: {cct.uf}
                  </span>
                  {cct.cidade && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                      {cct.cidade}
                    </span>
                  )}
                  {cct.pdfNome && (
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                      <FileText size={11} /> {cct.pdfNome}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                  {cct.nome}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#1B4D3E]" />
                    Vigência: <strong>{formatVigenciaDate(cct.vigenciaInicio)}</strong> até <strong>{formatVigenciaDate(cct.vigenciaFim)}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-[#1B4D3E]" />
                    <strong>{cct.cargos?.length || 0}</strong> Funções Parametrizadas
                  </span>
                </div>
              </div>

              {/* CARD RESUMO VALOR ALIMENTAÇÃO */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-right shrink-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">Vale Alimentação / Refeição</span>
                <p className="text-xl font-black text-[#1B4D3E] mt-0.5">
                  {formatBRL(cct.vaValor)}
                  <span className="text-xs font-medium text-emerald-700"> /{cct.vaTipo === 'MENSAL' ? 'mês' : 'dia'}</span>
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-[10px] text-emerald-700 font-bold">
                    Desc.: {cct.vaDescPercent || 0}%
                  </span>
                  {(cct.vaRefeicaoLocal && cct.vaRefeicaoLocal > 0) ? (
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded font-black tracking-tight" title="Com refeição no local (Parágrafo 5º)">
                      Local: {formatBRL(cct.vaRefeicaoLocal)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ABAS E BOTÃO DO COPILOT */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 mt-6 pt-3 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('funcoes')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'funcoes'
                      ? 'bg-[#1B4D3E] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  👥 Funções & Salários ({cct.cargos?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('beneficios')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'beneficios'
                      ? 'bg-[#1B4D3E] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  🎁 Benefícios Normativos
                </button>
                <button
                  onClick={() => setActiveTab('clausulas')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'clausulas'
                      ? 'bg-[#1B4D3E] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📜 Cláusulas na Íntegra ({clausulasList.length})
                </button>
              </div>

              {/* BOTÃO PARA ABRIR O CHAT COPILOT IA */}
              <button
                type="button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isChatOpen
                    ? 'bg-[#1B4D3E] text-white shadow-md'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] border border-emerald-300'
                }`}
              >
                <Bot size={15} />
                <span>{isChatOpen ? 'Fechar Assistente IA' : '💬 Abrir CCT Copilot IA'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          </div>

          {/* CONTEÚDO DA CCT (LARGURA TOTAL 100% PARA TABELA E CARGOS) */}
          <div className="w-full space-y-6">

              {/* ABA 1: FUNÇÕES E PISOS SALARIAIS */}
              {activeTab === 'funcoes' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Tabela de Funções & Pisos Normativos</h3>
                      <p className="text-xs text-slate-500">Cargos reconhecidos na convenção com salários e adicionais correspondentes.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      {cct.cargos?.length || 0} Cargos
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/70 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <th className="py-3 px-4">Função / Cargo</th>
                          <th className="py-3 px-4 text-right">Piso Salarial</th>
                          <th className="py-3 px-4 text-center">Insalubridade</th>
                          <th className="py-3 px-4 text-right">Adicionais</th>
                          <th className="py-3 px-4 text-right">Remuneração Base</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!cct.cargos || cct.cargos.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                              Nenhum cargo cadastrado nesta CCT.
                            </td>
                          </tr>
                        ) : (
                          cct.cargos.map((cargo: any) => {
                            const adicionalTotal = (cargo.adicionalCopa || 0) + (cargo.gratificacoes || 0) + (cargo.assiduidade || 0);
                            const totalBase = (cargo.pisoSalarial || 0) + adicionalTotal;

                            return (
                              <tr key={cargo.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {cargo.nome}
                                </td>
                                <td className="py-3.5 px-4 text-right font-black text-[#1B4D3E]">
                                  {formatBRL(cargo.pisoSalarial)}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {cargo.insalubridadePercent > 0 ? (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                      {cargo.insalubridadePercent}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                                  {adicionalTotal > 0 ? formatBRL(adicionalTotal) : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-right font-black text-slate-900">
                                  {formatBRL(totalBase)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 2: BENEFÍCIOS NORMATIVOS */}
              {activeTab === 'beneficios' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800">Benefícios Normativos (CCT)</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obrigações Convencionais</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Vale Alimentação</span>
                        <p className="text-base font-black text-[#1B4D3E] mt-1">{formatBRL(cct.vaValor)}/{cct.vaTipo === 'MENSAL' ? 'mês' : 'dia'}</p>
                        <span className="text-[10px] text-slate-500">Desc. folha: {cct.vaDescPercent || 20}%</span>
                      </div>
                      <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-emerald-800">VA (Refeição Local)</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Reduzido</span>
                        </div>
                        <p className="text-base font-black text-[#1B4D3E] mt-1">
                          {formatBRL(cct.vaRefeicaoLocal && cct.vaRefeicaoLocal > 0 ? cct.vaRefeicaoLocal : 494)}/mês
                        </p>
                        <span className="text-[10px] text-slate-500">Desc. folha: 20% • Parágrafo 5º</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Vale Transporte</span>
                        <p className="text-base font-black text-slate-800 mt-1">{formatBRL(cct.vtValor)}/dia</p>
                        <span className="text-[10px] text-slate-500">Desc. folha: {cct.vtDescPercent || 6}%</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Benefício Social Familiar</span>
                        <p className="text-base font-black text-slate-800 mt-1">{formatBRL(cct.seguroVida)}/mês</p>
                        <span className="text-[10px] text-slate-500">Por funcionário</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Assistência Médica (IST)</span>
                        <p className="text-base font-black text-slate-800 mt-1">{formatBRL(cct.examesMedicos)}/mês</p>
                        <span className="text-[10px] text-slate-500">Por funcionário</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Cesta Básica</span>
                        <p className="text-base font-black text-slate-800 mt-1">{formatBRL(cct.cestaBasica)}/mês</p>
                        <span className="text-[10px] text-slate-400">Não previsto na CCT</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400">Uniforme & EPI</span>
                        <p className="text-base font-black text-slate-800 mt-1">{formatBRL(cct.uniformeEpi)}/mês</p>
                        <span className="text-[10px] text-slate-400">Gratuito s/ desconto</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: CLÁUSULAS NA ÍNTEGRA */}
              {activeTab === 'clausulas' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Índice de Cláusulas Extraídas</h3>
                      <p className="text-xs text-slate-500">Consulte o texto original de cada cláusula cadastrada.</p>
                    </div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrar cláusula (ex: atestado)..."
                        value={clausulaSearch}
                        onChange={e => setClausulaSearch(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white w-60"
                      />
                    </div>
                  </div>

                  {filteredClausulas.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">
                      Nenhuma cláusula indexada para exibição. Envie um novo PDF ou faça a extração automática.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {filteredClausulas.map((c, i) => {
                        const isExpanded = expandedClausulaId === String(i);
                        return (
                          <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                            <button
                              onClick={() => setExpandedClausulaId(isExpanded ? null : String(i))}
                              className="w-full flex items-center justify-between text-left cursor-pointer"
                            >
                              <div className="pr-2">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Cláusula {c.numero}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 mt-1">{c.titulo}</h4>
                              </div>
                              {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-200/70 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap bg-white p-3 rounded-xl">
                                {c.texto}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

          </div>

          {/* BACKDROP QUANDO O CHAT ESTIVER ABERTO */}
          {isChatOpen && (
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
              onClick={() => {
                setIsChatOpen(false);
                setIsChatExpanded(false);
              }}
            />
          )}

          {/* GAVETA LATERAL DO CHAT COPILOT IA (SLIDE-OVER OU MODAL EXPANDIDO) */}
          {isChatOpen && (
            <div className={`bg-white shadow-2xl flex flex-col transition-all duration-300 overflow-hidden z-50 ${
              isChatExpanded 
                ? 'fixed inset-4 md:inset-8 rounded-3xl border border-slate-300' 
                : 'fixed inset-y-0 right-0 w-full sm:w-[560px] md:w-[620px] border-l border-slate-200 animate-in slide-in-from-right duration-300'
            }`}>
              
              {/* CABEÇALHO DO CHAT */}
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-[#1B4D3E] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/10">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wide">CCT Copilot IA</h3>
                    <p className="text-[10px] text-emerald-200">Tire dúvidas sobre cláusulas desta convenção</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    title={isChatExpanded ? "Reduzir para painel lateral" : "Expandir chat para leitura ampla"}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold transition-colors cursor-pointer border border-white/15"
                  >
                    {isChatExpanded ? (
                      <>
                        <Minimize2 size={13} />
                        <span className="hidden sm:inline">Reduzir</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={13} />
                        <span className="hidden sm:inline">Expandir Chat</span>
                      </>
                    )}
                  </button>

                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Online
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChatOpen(false);
                      setIsChatExpanded(false);
                    }}
                    title="Fechar assistente IA"
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer ml-1"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* SUGESTÕES RÁPIDAS DE PERGUNTAS */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] select-none shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Dúvidas:
                </span>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Quais funções preveem adicional de insalubridade e quais os percentuais?')}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg text-slate-700 font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                >
                  Funções com insalubridade?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Qual o piso salarial e gratificação do Cozinheiro e Copeiro?')}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg text-slate-700 font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                >
                  Piso de Cozinheiro e Copeiro?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Na CCT prevê pagamento de Vale alimentação quando o funcionário está de atestado médico?')}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg text-slate-700 font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                >
                  Vale alimentação no atestado?
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Como funciona a jornada 12x36 e regras de horas extras?')}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg text-slate-700 font-bold shrink-0 transition-all cursor-pointer shadow-2xs"
                >
                  Jornada 12x36 e Horas Extras?
                </button>
              </div>

              {/* ÁREA DE MENSAGENS */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
                {messages.map(m => {
                  const isUser = m.sender === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[95%] md:max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed ${
                          isUser
                            ? 'bg-[#1B4D3E] text-white rounded-br-none shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <FormattedChatText text={m.text} isUser={isUser} />

                        {/* CLÁUSULA CITADA */}
                        {m.clausulaCitada && (
                          <div className="mt-3 flex items-center justify-between text-xs font-bold text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">📌</span>
                              <span>{m.clausulaCitada}</span>
                            </div>
                            <button
                              onClick={() => handleCopyText(m.id, `${m.clausulaCitada}\n\n${m.trechoOriginal || m.text}`)}
                              title="Copiar citação"
                              className="p-1 text-slate-400 hover:text-emerald-800 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
                            >
                              {copiedId === m.id ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                                  <Check size={12} /> Copiado
                                </span>
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        )}

                        {/* TRECHO ORIGINAL DA CCT (OPCIONAL E RETRÁTIL) */}
                        {m.trechoOriginal && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleTrecho(m.id)}
                              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1B4D3E] bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                              <FileText size={12} className="text-[#1B4D3E]" />
                              <span>{expandedTrechos[m.id] ? 'Ocultar redação original da CCT' : 'Ver redação oficial da CCT (opcional)'}</span>
                              {expandedTrechos[m.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {expandedTrechos[m.id] && (
                              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 border-l-4 border-[#1B4D3E] border border-slate-200/90 text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                    Texto Oficial da Convenção Coletiva
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(`trecho-${m.id}`, m.trechoOriginal!)}
                                    className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedId === `trecho-${m.id}` ? (
                                      <>
                                        <Check size={11} className="text-emerald-700" />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        <span>Copiar texto oficial</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <blockquote className="italic text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                                  &ldquo;{m.trechoOriginal}&rdquo;
                                </blockquote>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-medium">
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl w-fit shadow-xs animate-pulse">
                    <RefreshCw size={14} className="animate-spin text-[#1B4D3E]" />
                    <span>Analisando o texto da convenção com IA...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT DO CHAT */}
              <div className="p-3.5 border-t border-slate-200 bg-white shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Faça uma pergunta sobre esta CCT..."
                    value={inputQuery}
                    onChange={e => setInputQuery(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs md:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || chatLoading}
                    className="p-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
