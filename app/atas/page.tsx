'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import UserSelectPopover from '@/components/UserSelectPopover';
import { 
  FileText, Plus, Search, Calendar, MapPin, Check, 
  Trash2, User, Users, ClipboardList, TrendingUp, AlertCircle, 
  CheckCircle2, Edit3, ArrowLeft, Printer,
  Bold, Italic, Underline, Strikethrough, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Type, Palette, Clock,
  History, X
} from 'lucide-react';
import { 
  getAtas, getAtaCompleta, saveAta, deleteAta, 
  toggleAcaoConclusao, getAcoesStats 
} from './actions';
import { getUsersForFilter } from '@/app/leads/actions';

interface Participante {
  userId?: string;
  nome: string;
  departamento?: string;
  email?: string;
  presente: boolean;
}

interface PautaItem {
  descricao: string;
  abordada: boolean;
}

interface PautaDeliberativa {
  item: string;
  descricao: string;
  status: string; // "Tratado", "Pendente", "Adiado"
  anotacao?: string;
}

interface Acao {
  id?: string;
  item?: string;
  descricao: string;
  responsavelId: string;
  responsavelNome?: string;
  dataLimite: string;
  numBitrix?: string;
  concluida?: boolean;
}

export default function AtasPage() {
  // Controle de Visualização: 'LIST' (Listagem) ou 'FORM' (Documento Técnico Centralizado)
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');

  // Estados de listagem e estatísticas
  const [atas, setAtas] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, concluidas: 0, pendentes: 0, taxaEficacia: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usuários do sistema (para filtros, responsáveis e participantes)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // Estados de edição da ATA
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAtaId, setSelectedAtaId] = useState<string | null>(null);
  
  // Campos do formulário da ATA (Seguindo fielmente o layout físico JVS do Word)
  const [titulo, setTitulo] = useState('');
  const [dataReuniou, setDataReuniou] = useState(() => new Date().toISOString().split('T')[0]);
  const [local, setLocal] = useState('');
  const [pautas, setPautas] = useState<PautaItem[]>([{ descricao: '', abordada: false }]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  
  // Relatório da Reunião (Texto Principal + Pautas Deliberativas + Considerações Finais)
  const [relatorio, setRelatorio] = useState('');
  const [pautasDeliberativas, setPautasDeliberativas] = useState<PautaDeliberativa[]>([]);
  const [consideracoes, setConsideracoes] = useState('');
  
  // Próxima Reunião
  const [proximaReuniaoData, setProximaReuniaoData] = useState<string>('');
  const [proximaReuniaoHora, setProximaReuniaoHora] = useState<string>('');
  const [proximaReuniaoLocal, setProximaReuniaoLocal] = useState<string>('');
  
  // Ações corretivas
  const [acoes, setAcoes] = useState<Acao[]>([]);

  // Versões da ATA
  const [versoesHistorico, setVersoesHistorico] = useState<any[]>([]);
  const [activeVersaoIndex, setActiveVersaoIndex] = useState<number | null>(null);

  // Estados de controle do Popover de Seleção de Usuários
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverTargetType, setPopoverTargetType] = useState<'PARTICIPANTE' | 'ACAO_RESPONSAVEL'>('PARTICIPANTE');
  const [activeAcaoIndex, setActiveAcaoIndex] = useState<number | null>(null);

  // Referências dos editores de texto rico contentEditable
  const relatorioEditorRef = useRef<HTMLDivElement>(null);
  const consideracoesEditorRef = useRef<HTMLDivElement>(null);

  // Helper seguro para split de datas (evita crashes de tela branca)
  const parseDateString = (dateVal: any) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    return '';
  };

  // Carrega atas, estatísticas e usuários ativos
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [atasList, statsData, usersRes] = await Promise.all([
        getAtas(),
        getAcoesStats(),
        getUsersForFilter()
      ]);
      setAtas(atasList);
      setStats(statsData);
      if (usersRes.success && usersRes.users) {
        setSystemUsers(usersRes.users);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sincroniza os HTMLs dos editores contentEditable com os respectivos estados
  useEffect(() => {
    if (relatorioEditorRef.current && relatorio !== relatorioEditorRef.current.innerHTML) {
      relatorioEditorRef.current.innerHTML = relatorio;
    }
  }, [relatorio, viewMode]);

  useEffect(() => {
    if (consideracoesEditorRef.current && consideracoes !== consideracoesEditorRef.current.innerHTML) {
      consideracoesEditorRef.current.innerHTML = consideracoes;
    }
  }, [consideracoes, viewMode]);

  // Executa formatação de texto rico no editor em foco
  const execEditorCmd = (ref: React.RefObject<HTMLDivElement | null>, cmd: string, val: string = '') => {
    if (ref.current) {
      ref.current.focus();
      document.execCommand(cmd, false, val);
      if (ref === relatorioEditorRef) {
        setRelatorio(ref.current.innerHTML);
      } else if (ref === consideracoesEditorRef) {
        setConsideracoes(ref.current.innerHTML);
      }
    }
  };

  // Inicia criação de nova ATA
  const handleOpenNewAta = () => {
    setIsEditing(false);
    setSelectedAtaId(null);
    setTitulo(`Ata de Reunião Comercial - ${new Date().toLocaleDateString('pt-BR')}`);
    setDataReuniou(new Date().toISOString().split('T')[0]);
    setLocal('Sala de Operações JVS FAC');
    setPautas([{ descricao: '', abordada: false }]);
    setParticipantes([]);
    setRelatorio('');
    setPautasDeliberativas([]);
    setConsideracoes('');
    setProximaReuniaoData('');
    setProximaReuniaoHora('');
    setProximaReuniaoLocal('');
    setAcoes([]);
    setVersoesHistorico([]);
    setActiveVersaoIndex(null);
    setViewMode('FORM');
  };

  // Carrega ATA existente para edição
  const handleOpenEditAta = async (id: string) => {
    setLoading(true);
    try {
      const ata = await getAtaCompleta(id);
      if (ata) {
        setIsEditing(true);
        setSelectedAtaId(ata.id);
        setTitulo(ata.titulo);
        setDataReuniou(parseDateString(ata.dataReuniou));
        setLocal(ata.local || '');
        
        // Mapeamento seguro de pauta legada (string[]) ou estruturada
        const rawPautas = Array.isArray(ata.pautas) ? ata.pautas : [];
        const mappedPautas = rawPautas.map((p: any) => {
          if (typeof p === 'string') {
            return { descricao: p, abordada: false };
          }
          return {
            descricao: p.descricao || '',
            abordada: !!p.abordada
          };
        });
        setPautas(mappedPautas.length > 0 ? mappedPautas : [{ descricao: '', abordada: false }]);

        setParticipantes(Array.isArray(ata.participantesPresentes) ? (ata.participantesPresentes as Participante[]) : []);
        setRelatorio(ata.relatorio || '');
        setPautasDeliberativas(Array.isArray(ata.pautasDeliberativas) ? (ata.pautasDeliberativas as PautaDeliberativa[]) : []);
        setConsideracoes(ata.consideracoes || '');
        setProximaReuniaoData(parseDateString(ata.proximaReuniaoData));
        setProximaReuniaoHora(ata.proximaReuniaoHora || '');
        setProximaReuniaoLocal(ata.proximaReuniaoLocal || '');
        setAcoes(ata.acoes.map((a: any) => ({
          id: a.id,
          item: a.item || '',
          descricao: a.descricao,
          responsavelId: a.responsavelId,
          responsavelNome: a.responsavel?.nome || 'Não identificado',
          dataLimite: parseDateString(a.dataLimite),
          numBitrix: a.numBitrix || '',
          concluida: a.concluida
        })));
        setVersoesHistorico(ata.versoesHistorico || []);
        setViewMode('FORM');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Deleta ATA
  const handleDeleteAtaClick = async (id: string) => {
    if (confirm('Deseja realmente excluir esta Ata de Reunião permanentemente? Todas as ações geradas nela também serão apagadas.')) {
      setLoading(true);
      try {
        const res = await deleteAta(id);
        if (res.success) {
          loadDashboardData();
        } else {
          alert(`Erro ao excluir: ${res.error}`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  // Salva ATA (cria nova ou edita)
  const handleSaveAtaClick = async (criarNovaVersao: boolean = false) => {
    if (!titulo.trim()) {
      alert('O título da ata é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const cleanPautas = pautas
        .filter(p => p.descricao.trim() !== '')
        .map(p => ({
          descricao: p.descricao.trim(),
          abordada: p.abordada
        }));

      const htmlRelatorio = relatorioEditorRef.current ? relatorioEditorRef.current.innerHTML : relatorio;
      const htmlConsideracoes = consideracoesEditorRef.current ? consideracoesEditorRef.current.innerHTML : consideracoes;

      const res = await saveAta({
        id: selectedAtaId || undefined,
        titulo: titulo.trim(),
        dataReuniou,
        local: local.trim(),
        pautas: cleanPautas,
        participantesPresentes: participantes,
        pautasDeliberativas,
        relatorio: htmlRelatorio,
        consideracoes: htmlConsideracoes,
        proximaReuniaoData: proximaReuniaoData || null,
        proximaReuniaoHora: proximaReuniaoHora || null,
        proximaReuniaoLocal: proximaReuniaoLocal || null,
        acoes: acoes.map(a => ({
          id: a.id,
          item: a.item || undefined,
          descricao: a.descricao,
          responsavelId: a.responsavelId,
          dataLimite: a.dataLimite,
          numBitrix: a.numBitrix || undefined,
          concluida: a.concluida || false
        })),
        criarNovaVersao
      });

      if (res.success) {
        setViewMode('LIST');
        loadDashboardData();
      } else {
        alert(`Erro ao salvar: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Alterna o status de ações
  const handleToggleAcaoClick = async (acaoId: string, concluida: boolean) => {
    try {
      const res = await toggleAcaoConclusao(acaoId, concluida);
      if (res.success) {
        setAcoes(prev => prev.map(a => a.id === acaoId ? { ...a, concluida } : a));
        const [atasList, statsData] = await Promise.all([getAtas(), getAcoesStats()]);
        setAtas(atasList);
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manipuladores de Pautas
  const handleAddPautaRow = () => setPautas(prev => [...prev, { descricao: '', abordada: false }]);
  
  const handleRemovePautaRow = (idx: number) => {
    if (pautas.length === 1) {
      setPautas([{ descricao: '', abordada: false }]);
    } else {
      setPautas(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePautaChange = (idx: number, val: string) => {
    setPautas(prev => prev.map((p, i) => i === idx ? { ...p, descricao: val } : p));
  };

  const handlePautaAbordadaChange = (idx: number, checked: boolean) => {
    setPautas(prev => prev.map((p, i) => i === idx ? { ...p, abordada: checked } : p));
  };

  // Manipuladores de Participantes
  const handleOpenParticipanteSelect = (e: React.MouseEvent<HTMLElement>) => {
    setPopoverTargetType('PARTICIPANTE');
    setPopoverAnchor(e.currentTarget);
    setPopoverOpen(true);
  };

  const handleSelectParticipante = (userId: string) => {
    const matchedUser = systemUsers.find(u => u.id === userId);
    if (!matchedUser) return;

    const exists = participantes.some(p => p.userId === userId);
    if (exists) {
      setParticipantes(prev => prev.filter(p => p.userId !== userId));
    } else {
      setParticipantes(prev => [...prev, {
        userId: matchedUser.id,
        nome: matchedUser.nome,
        departamento: matchedUser.cargo || 'Comercial',
        email: matchedUser.email || '',
        presente: true
      }]);
    }
  };

  const handleAddParticipanteExterno = () => {
    setParticipantes(prev => [...prev, {
      nome: '',
      departamento: '',
      email: '',
      presente: true
    }]);
  };

  const handleRemoveParticipante = (idx: number) => {
    setParticipantes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleParticipanteInfoChange = (idx: number, key: keyof Participante, val: any) => {
    setParticipantes(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  };

  // Manipuladores de Pautas Deliberativas (Relatório)
  const handleAddPautaDeliberativaRow = () => {
    setPautasDeliberativas(prev => [...prev, {
      item: String(prev.length + 1),
      descricao: '',
      status: 'Pendente',
      anotacao: ''
    }]);
  };

  const handleRemovePautaDeliberativaRow = (idx: number) => {
    setPautasDeliberativas(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((p, i) => ({ ...p, item: String(i + 1) }));
    });
  };

  const handlePautaDeliberativaChange = (idx: number, key: keyof PautaDeliberativa, val: string) => {
    setPautasDeliberativas(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  };

  // Manipuladores de Ações
  const handleAddAcaoRow = () => {
    setAcoes(prev => [...prev, {
      item: String(prev.length + 1),
      descricao: '',
      responsavelId: '',
      responsavelNome: 'Selecionar',
      dataLimite: new Date().toISOString().split('T')[0],
      numBitrix: '',
      concluida: false
    }]);
  };

  const handleRemoveAcaoRow = (idx: number) => {
    setAcoes(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((a, i) => ({ ...a, item: String(i + 1) }));
    });
  };

  const handleAcaoFieldChange = (idx: number, key: keyof Acao, val: any) => {
    setAcoes(prev => prev.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  };

  const handleOpenAcaoResponsavelSelect = (e: React.MouseEvent<HTMLElement>, idx: number) => {
    setPopoverTargetType('ACAO_RESPONSAVEL');
    setActiveAcaoIndex(idx);
    setPopoverAnchor(e.currentTarget);
    setPopoverOpen(true);
  };

  const handleSelectAcaoResponsavel = (userId: string) => {
    if (activeAcaoIndex === null) return;
    const matchedUser = systemUsers.find(u => u.id === userId);
    if (!matchedUser) return;

    setAcoes(prev => prev.map((a, i) => i === activeAcaoIndex ? {
      ...a,
      responsavelId: matchedUser.id,
      responsavelNome: matchedUser.nome
    } : a));
  };

  // Filtra atas por busca
  const filteredAtas = atas.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.local && a.local.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Ocultada na impressão */}
      <Sidebar />
      
      {/* Estilos CSS para Impressão de PDF Técnico e Formal */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Oculta tudo que não for o documento */
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
          }
          .sidebar-aside, .no-print, header, .top-bar-actions, button, svg {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          #print-document-container {
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Formatação de células da tabela */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 6px 10px !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          .tech-section-header {
            background-color: #1E4663 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #ffffff !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          .tech-subheader {
            background-color: #DCE6F1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #000000 !important;
            font-weight: bold !important;
          }
          /* Remove a aparência de campos de input para parecer documento finalizado */
          input, select, textarea {
            border: none !important;
            background: transparent !important;
            color: #000000 !important;
            font-size: 11px !important;
            font-family: Arial, sans-serif !important;
            width: 100% !important;
            box-shadow: none !important;
            outline: none !important;
            padding: 0 !important;
            margin: 0 !important;
            appearance: none !important;
            -webkit-appearance: none !important;
          }
          input[type="checkbox"] {
            appearance: checkbox !important;
            -webkit-appearance: checkbox !important;
            width: auto !important;
            margin-right: 5px !important;
          }
          /* Garante cores de background no PDF */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 1.2cm;
          }
        }
      `}} />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* MODO LISTA DE ATAS */}
          {viewMode === 'LIST' && (
            <>
              {/* HEADER */}
              <header className="flex justify-between items-end border-b border-slate-300 pb-4 no-print">
                <div>
                  <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                    <ClipboardList size={24} /> Atas de Reunião
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">
                    Gestão de alinhamentos, pautas e pendências comerciais
                  </p>
                </div>
                <button
                  onClick={handleOpenNewAta}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <Plus size={16} /> Nova Ata
                </button>
              </header>

              {/* DASHBOARD INDICADORES */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total de Ações</span>
                    <span className="text-3xl font-black text-[#1B4D3E] block mt-1">{stats.total}</span>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#1B4D3E]/10 group-hover:text-[#1B4D3E] transition-colors">
                    <ClipboardList size={22} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ações Concluídas</span>
                    <span className="text-3xl font-black text-green-600 block mt-1">{stats.concluidas}</span>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between group hover:shadow-md transition-all">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ações Pendentes</span>
                    <span className="text-3xl font-black text-orange-500 block mt-1">{stats.pendentes}</span>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <Clock size={22} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs group hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Taxa de Eficácia</span>
                      <span className="text-3xl font-black text-[#1B4D3E] block mt-1">{stats.taxaEficacia}%</span>
                    </div>
                    <div className="w-12 h-12 bg-[#1B4D3E]/10 rounded-xl flex items-center justify-center text-[#1B4D3E]">
                      <TrendingUp size={22} />
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-[#1B4D3E] h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.taxaEficacia}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* LISTAGEM DE HISTÓRICO */}
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 no-print">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                    <FileText size={18} /> Histórico de Atas
                  </h2>
                  <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar atas por título ou local..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 focus:bg-white text-slate-700 transition-all"
                    />
                  </div>
                </div>

                {loading && atas.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 border-4 border-[#1B4D3E]/30 border-t-[#1B4D3E] rounded-full animate-spin" />
                    <span className="text-xs font-bold text-[#1B4D3E] animate-pulse">Carregando Atas...</span>
                  </div>
                ) : filteredAtas.length === 0 ? (
                  <div className="py-20 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
                    <AlertCircle size={36} className="text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma ata de reunião cadastrada</p>
                    <p className="text-[10px] text-slate-400">Clique em "Nova Ata" para redigir seu primeiro alinhamento.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-4 px-5">Título da Reunião</th>
                          <th className="py-4 px-4">Data</th>
                          <th className="py-4 px-4">Local</th>
                          <th className="py-4 px-3 text-center">Versão</th>
                          <th className="py-4 px-4">Progresso Ações</th>
                          <th className="py-4 px-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAtas.map(ata => (
                          <tr key={ata.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-5">
                              <p className="text-slate-800 font-bold text-xs">
                                {ata.titulo}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{ata.pautasCount} pautas listadas</p>
                            </td>
                            <td className="py-4 px-4 text-slate-500 font-medium">
                              {new Date(ata.dataReuniou).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-4 text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[150px]">{ata.local}</span>
                              </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black rounded-md">
                                R{String(ata.versao).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 rounded-full h-1.5 shrink-0">
                                  <div 
                                    className="bg-[#1B4D3E] h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${ata.progressoAcoes}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {ata.concluidas}/{ata.totalAcoes} ({ata.progressoAcoes}%)
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-right space-x-1">
                              <button
                                onClick={() => handleOpenEditAta(ata.id)}
                                className="p-1.5 hover:bg-[#1B4D3E]/10 hover:text-[#1B4D3E] text-slate-400 rounded-lg transition-colors cursor-pointer"
                                title="Visualizar / Editar"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteAtaClick(ata.id)}
                                className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Ata"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* MODO FORMULÁRIO CENTRALIZADO (DOCUMENTO TÉCNICO) */}
          {viewMode === 'FORM' && (
            <div className="space-y-6">
              
              {/* BARRA DE AÇÕES DO DOCUMENTO - Ocultada na impressão */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs no-print">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setViewMode('LIST')}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600 cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase"
                  >
                    <ArrowLeft size={14} /> Voltar
                  </button>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {isEditing ? `Edição de Ata (Revisão R${String(activeVersaoIndex || 1).padStart(2, '0')})` : 'Novo Alinhamento'}
                    </span>
                    <input 
                      type="text"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      placeholder="Título da Ata..."
                      className="text-xs font-bold text-slate-700 w-80 bg-slate-50 border border-slate-200 rounded-md p-1 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Histórico de Versões / Revisões */}
                  {versoesHistorico.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Revisões:</span>
                      <select
                        value={selectedAtaId || ''}
                        onChange={e => handleOpenEditAta(e.target.value)}
                        className="text-[10px] font-black bg-transparent border-0 outline-none text-[#1B4D3E] cursor-pointer"
                      >
                        {versoesHistorico.map(v => (
                          <option key={v.id} value={v.id}>
                            R{String(v.versao).padStart(2, '0')} ({new Date(v.data).toLocaleDateString('pt-BR')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isEditing && (
                    <button
                      onClick={() => handleSaveAtaClick(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer"
                      title="Salva como uma nova revisão incrementando o número da versão (Ex: R02)"
                    >
                      <History size={13} /> Criar Nova Revisão
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[10px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer"
                    title="Exporta / Imprime a ata em formato PDF comercial"
                  >
                    <Printer size={13} /> Compartilhar (PDF)
                  </button>

                  <button
                    onClick={() => handleSaveAtaClick(false)}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-[10px] py-2.5 px-6 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                  >
                    Salvar Documento
                  </button>
                </div>
              </div>

              {/* CANVAS DO DOCUMENTO (FOLHA A4 TÉCNICA CENTRALIZADA EM FORMATO DE TABELA WORD) */}
              <div 
                id="print-document-container"
                className="document-canvas w-full max-w-4xl bg-white border border-slate-300 shadow-xl p-8 mx-auto font-sans relative text-slate-800"
              >
                {/* ESTRUTURA TÉCNICA EM TABELA (IDÊNTICA AO WORD DO USUÁRIO) */}
                <table className="w-full border-2 border-slate-900 border-collapse text-xs select-text">
                  
                  {/* CABEÇALHO DA ATA */}
                  <thead>
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-sm py-3 border-b-2 border-slate-900 tracking-wider">
                        ATA DE REUNIÃO – COMERCIAL
                      </th>
                    </tr>
                    
                    {/* METADADOS (DATA E LOCAL) */}
                    <tr className="bg-white border-b-2 border-slate-900 text-slate-800">
                      <td colspan="2" className="p-2.5 border-r border-slate-900 font-bold w-1/2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-black">DATA:</span>
                          <input 
                            type="date"
                            value={dataReuniou}
                            onChange={e => setDataReuniou(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-800 w-full focus:ring-0"
                          />
                        </div>
                      </td>
                      <td colspan="3" className="p-2.5 font-bold w-1/2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-black">LOCAL:</span>
                          <input 
                            type="text"
                            value={local}
                            onChange={e => setLocal(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-800 w-full focus:ring-0"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* TÍTULO PARTICIPANTES */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PARTICIPANTES:
                      </th>
                    </tr>

                    {/* COLUNAS PARTICIPANTES */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-left">
                      <th className="py-1 px-3 border-r border-slate-900 w-[25%]">Nome</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[25%]">Departamento</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[40%]">E-mail</th>
                      <th colspan="2" className="py-1 px-3 w-[10%] text-center">Presente</th>
                    </tr>
                  </thead>
                  
                  {/* CORPO DOS PARTICIPANTES */}
                  <tbody className="divide-y divide-slate-900">
                    {participantes.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="5" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhum participante adicionado. Adicione colaboradores abaixo no painel.
                        </td>
                      </tr>
                    ) : (
                      participantes.map((p, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/10">
                          <td className="py-1 px-3 border-r border-slate-900 font-bold text-slate-800">
                            {p.userId ? (
                              p.nome
                            ) : (
                              <input 
                                type="text"
                                value={p.nome}
                                placeholder="Nome do convidado..."
                                onChange={e => handleParticipanteInfoChange(idx, 'nome', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900 text-slate-600 font-medium">
                            {p.userId ? (
                              p.departamento
                            ) : (
                              <input 
                                type="text"
                                value={p.departamento}
                                placeholder="Cargo..."
                                onChange={e => handleParticipanteInfoChange(idx, 'departamento', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900 text-slate-600 font-medium">
                            {p.userId ? (
                              p.email
                            ) : (
                              <input 
                                type="email"
                                value={p.email}
                                placeholder="E-mail..."
                                onChange={e => handleParticipanteInfoChange(idx, 'email', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-0"
                              />
                            )}
                          </td>
                          <td colspan="2" className="py-1 px-3 text-center">
                            <select
                              value={p.presente ? 'Sim' : 'Não'}
                              onChange={e => handleParticipanteInfoChange(idx, 'presente', e.target.value === 'Sim')}
                              className="bg-transparent border-none outline-none font-bold text-center text-slate-700 cursor-pointer"
                            >
                              <option value="Sim">Sim</option>
                              <option value="Não">Não</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}

                    {/* CONTROLES PARTICIPANTES (BOTOES) - Ocultados na impressão */}
                    <tr className="bg-slate-50/50 no-print border-b border-slate-900">
                      <td colspan="5" className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleOpenParticipanteSelect}
                            className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                          >
                            <Plus size={10} /> Colaborador da Equipe
                          </button>
                          <button
                            type="button"
                            onClick={handleAddParticipanteExterno}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                          >
                            <Plus size={10} /> Convidado Externo
                          </button>
                          {participantes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setParticipantes([])}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                            >
                              <Trash2 size={10} /> Limpar Todos
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* SEÇÃO PAUTAS */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PAUTAS:
                      </th>
                    </tr>

                    {/* LISTA DE PAUTAS PRINCIPAIS COM CHECKBOX E INPUT */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="5" className="p-4 text-slate-800">
                        <div className="space-y-3">
                          {pautas.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              {/* Checkbox interativa */}
                              <input
                                type="checkbox"
                                checked={p.abordada}
                                onChange={e => handlePautaAbordadaChange(idx, e.target.checked)}
                                className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]/20 border-slate-300 cursor-pointer"
                                title="Marcar como abordada"
                              />
                              <span className="text-xs font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                              <input
                                type="text"
                                value={p.descricao}
                                onChange={e => handlePautaChange(idx, e.target.value)}
                                placeholder="Digite a pauta principal da reunião..."
                                className={`flex-1 bg-transparent border-none outline-none font-semibold text-xs focus:ring-0 focus:outline-none ${p.abordada ? 'line-through text-slate-400 font-medium' : 'text-slate-800'}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePautaRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all cursor-pointer no-print"
                                title="Remover Pauta"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          
                          <div className="pt-2 no-print">
                            <button
                              type="button"
                              onClick={handleAddPautaRow}
                              className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                            >
                              <Plus size={10} /> Adicionar Pauta
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* SEÇÃO RELATÓRIO DA REUNIÃO */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        RELATÓRIO DA REUNIÃO:
                      </th>
                    </tr>

                    {/* EDITOR PRINCIPAL DO RELATÓRIO / RELAÇÃO DE ATIVIDADES */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="5" className="p-4 text-slate-800">
                        {/* Rich Text Editor Toolbar para o Relatório Principal - Ocultada na Impressão */}
                        <div className="border border-slate-200 rounded-t-xl bg-slate-50 p-2 flex flex-wrap gap-1 items-center divide-x divide-slate-200 select-none no-print mb-2">
                          <div className="flex gap-0.5 pr-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'bold')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Negrito"
                            >
                              <Bold size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'italic')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Itálico"
                            >
                              <Italic size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'underline')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Sublinhado"
                            >
                              <Underline size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'strikeThrough')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Tachado"
                            >
                              <Strikethrough size={13} />
                            </button>
                          </div>

                          <div className="flex gap-0.5 px-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'justifyLeft')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Alinhar Esquerda"
                            >
                              <AlignLeft size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'justifyCenter')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Centralizar"
                            >
                              <AlignCenter size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'justifyRight')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Alinhar Direita"
                            >
                              <AlignRight size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'justifyFull')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Justificar"
                            >
                              <AlignJustify size={13} />
                            </button>
                          </div>

                          <div className="flex gap-1.5 px-2 items-center">
                            <span className="text-slate-400" title="Cor do Texto">
                              <Palette size={13} />
                            </span>
                            <input
                              type="color"
                              onChange={e => execEditorCmd(relatorioEditorRef, 'foreColor', e.target.value)}
                              className="w-5 h-5 p-0 border-0 rounded-md cursor-pointer outline-none bg-transparent"
                              title="Escolher Cor"
                            />
                            
                            <span className="text-slate-400 pl-1" title="Tamanho do Texto">
                              <Type size={13} />
                            </span>
                            <select
                              onChange={e => execEditorCmd(relatorioEditorRef, 'fontSize', e.target.value)}
                              className="text-[10px] font-bold bg-white border border-slate-200 rounded-md p-1 outline-none text-slate-600"
                              title="Tamanho"
                            >
                              <option value="2">Pequeno</option>
                              <option value="3" selected>Normal</option>
                              <option value="4">Médio</option>
                              <option value="5">Grande</option>
                              <option value="6">Muito Grande</option>
                            </select>
                          </div>
                        </div>

                        {/* Editor de Texto do Relatório Principal */}
                        <div
                          ref={relatorioEditorRef}
                          contentEditable
                          onInput={e => setRelatorio(e.currentTarget.innerHTML)}
                          className="min-h-[220px] p-4 bg-white border border-slate-200 focus:bg-slate-50/10 focus:border-slate-300 outline-none text-slate-800 text-xs font-semibold leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }}
                          placeholder="Digite aqui as atividades tratadas na reunião (Ex: RELAÇÃO DE ATIVIDADES da equipe...)"
                        />
                      </td>
                    </tr>

                    {/* SEÇÃO PUATAS DELIBERATIVAS (Mantido idêntico ao Word do Usuário) */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PUATAS DELIBERATIVAS
                      </th>
                    </tr>

                    {/* COLUNAS PUATAS DELIBERATIVAS */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-left">
                      <th className="py-1 px-3 border-r border-slate-900 w-[10%] text-center">Item</th>
                      <th colspan="2" className="py-1 px-3 border-r border-slate-900 w-[50%]">Descrição</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[15%] text-center">Status</th>
                      <th className="py-1 px-3 w-[25%]">Anotação</th>
                    </tr>

                    {/* CORPO PUATAS DELIBERATIVAS */}
                    {pautasDeliberativas.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="5" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhuma pauta deliberada listada. Adicione itens abaixo.
                        </td>
                      </tr>
                    ) : (
                      pautasDeliberativas.map((pd, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/10">
                          <td className="py-1 px-3 border-r border-slate-900 text-center font-bold text-slate-500">
                            {pd.item}
                          </td>
                          <td colspan="2" className="py-1 px-3 border-r border-slate-900">
                            <input 
                              type="text"
                              value={pd.descricao}
                              placeholder="Descrição da deliberação..."
                              onChange={e => handlePautaDeliberativaChange(idx, 'descricao', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 font-medium"
                            />
                          </td>
                          <td className="py-1 px-3 border-r border-slate-800 text-center">
                            <select
                              value={pd.status}
                              onChange={e => handlePautaDeliberativaChange(idx, 'status', e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-center text-slate-700 cursor-pointer"
                            >
                              <option value="Tratado">Tratado</option>
                              <option value="Pendente">Pendente</option>
                              <option value="Adiado">Adiado</option>
                            </select>
                          </td>
                          <td className="py-1 px-3 flex items-center justify-between gap-1">
                            <input 
                              type="text"
                              value={pd.anotacao || ''}
                              placeholder="Notas..."
                              onChange={e => handlePautaDeliberativaChange(idx, 'anotacao', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePautaDeliberativaRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer no-print"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}

                    {/* CONTROLES PUATAS DELIBERATIVAS - Ocultados na Impressão */}
                    <tr className="bg-slate-50/50 no-print border-b border-slate-900">
                      <td colspan="5" className="p-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddPautaDeliberativaRow}
                            className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                          >
                            <Plus size={10} /> Adicionar Item Deliberado
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* SEÇÃO CONSIDERAÇÕES */}
                    <tr className="bg-[#DCE6F1] border-b border-slate-900 font-black text-slate-800">
                      <td colspan="5" className="py-1.5 px-3 text-left uppercase text-xs tracking-wider">
                        Considerações:
                      </td>
                    </tr>

                    {/* EDITOR DE CONSIDERAÇÕES FINAIS */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="5" className="p-4 text-slate-800">
                        {/* Rich Text Editor Toolbar para Considerações - Ocultada na Impressão */}
                        <div className="border border-slate-200 rounded-t-xl bg-slate-50 p-2 flex flex-wrap gap-1 items-center divide-x divide-slate-200 select-none no-print mb-2">
                          <div className="flex gap-0.5 pr-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'bold')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Negrito"
                            >
                              <Bold size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'italic')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Itálico"
                            >
                              <Italic size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'underline')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Sublinhado"
                            >
                              <Underline size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'strikeThrough')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Tachado"
                            >
                              <Strikethrough size={13} />
                            </button>
                          </div>

                          <div className="flex gap-0.5 px-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'justifyLeft')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Alinhar Esquerda"
                            >
                              <AlignLeft size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'justifyCenter')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Centralizar"
                            >
                              <AlignCenter size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'justifyRight')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Alinhar Direita"
                            >
                              <AlignRight size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'justifyFull')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Justificar"
                            >
                              <AlignJustify size={13} />
                            </button>
                          </div>

                          <div className="flex gap-1.5 px-2 items-center">
                            <span className="text-slate-400" title="Cor do Texto">
                              <Palette size={13} />
                            </span>
                            <input
                              type="color"
                              onChange={e => execEditorCmd(consideracoesEditorRef, 'foreColor', e.target.value)}
                              className="w-5 h-5 p-0 border-0 rounded-md cursor-pointer outline-none bg-transparent"
                              title="Escolher Cor"
                            />
                            
                            <span className="text-slate-400 pl-1" title="Tamanho do Texto">
                              <Type size={13} />
                            </span>
                            <select
                              onChange={e => execEditorCmd(consideracoesEditorRef, 'fontSize', e.target.value)}
                              className="text-[10px] font-bold bg-white border border-slate-200 rounded-md p-1 outline-none text-slate-600"
                              title="Tamanho"
                            >
                              <option value="2">Pequeno</option>
                              <option value="3" selected>Normal</option>
                              <option value="4">Médio</option>
                              <option value="5">Grande</option>
                              <option value="6">Muito Grande</option>
                            </select>
                          </div>
                        </div>

                        {/* Editor de Texto de Considerações */}
                        <div
                          ref={consideracoesEditorRef}
                          contentEditable
                          onInput={e => setConsideracoes(e.currentTarget.innerHTML)}
                          className="min-h-[140px] p-4 bg-white border border-slate-200 focus:bg-slate-50/10 focus:border-slate-300 outline-none text-slate-800 text-xs font-semibold leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }}
                          placeholder="Digite aqui as considerações finais e observações..."
                        />
                      </td>
                    </tr>

                    {/* SEÇÃO AÇÕES */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        AÇÕES:
                      </th>
                    </tr>

                    {/* COLUNAS AÇÕES */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-center">
                      <th className="py-1 px-3 border-r border-slate-900 w-[10%]">Item</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[45%] text-left">Descrição</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[20%] text-left">Responsável</th>
                      <th className="py-1 px-3 border-r border-slate-900 w-[15%]">Prazo</th>
                      <th className="py-1 px-3 w-[10%]">Nº Bitrix</th>
                    </tr>

                    {/* CORPO AÇÕES */}
                    {acoes.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="5" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhuma ação cadastrada. Adicione prazos de execução.
                        </td>
                      </tr>
                    ) : (
                      acoes.map((a, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/10">
                          <td className="py-1 px-3 border-r border-slate-900 text-center font-bold text-slate-500">
                            {a.item || (idx + 1)}
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900">
                            <input 
                              type="text"
                              value={a.descricao}
                              placeholder="Descreva a ação a ser executada..."
                              onChange={e => handleAcaoFieldChange(idx, 'descricao', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 font-medium"
                            />
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900">
                            <button
                              type="button"
                              onClick={e => handleOpenAcaoResponsavelSelect(e, idx)}
                              className="w-full text-left bg-transparent border-none outline-none font-bold text-slate-700 flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate max-w-[115px]">{a.responsavelNome || 'Selecionar'}</span>
                              <User size={10} className="text-slate-400 shrink-0 no-print" />
                            </button>
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900 text-center">
                            <input 
                              type="date"
                              value={a.dataLimite}
                              onChange={e => handleAcaoFieldChange(idx, 'dataLimite', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 text-center"
                            />
                          </td>
                          <td className="py-1 px-3 flex items-center justify-between gap-1">
                            <input 
                              type="text"
                              value={a.numBitrix || ''}
                              placeholder="Nº..."
                              onChange={e => handleAcaoFieldChange(idx, 'numBitrix', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 text-center font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAcaoRow(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer no-print"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}

                    {/* CONTROLES AÇÕES - Ocultados na Impressão */}
                    <tr className="bg-slate-50/50 no-print border-b border-slate-900">
                      <td colspan="5" className="p-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddAcaoRow}
                            className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[9px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                          >
                            <Plus size={10} /> Adicionar Ação
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* SEÇÃO PRÓXIMA REUNIÃO */}
                    <tr className="bg-[#DCE6F1] border-b border-slate-900 font-black text-slate-800 text-center">
                      <th colspan="5" className="py-1.5 px-3 text-xs tracking-wider uppercase">
                        PRÓXIMA REUNIÃO
                      </th>
                    </tr>

                    {/* METADADOS PRÓXIMA REUNIÃO */}
                    <tr className="bg-white text-slate-800 font-bold">
                      <td colspan="2" className="p-2.5 border-r border-slate-900 w-1/2">
                        <div className="flex gap-4 items-center flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-black">Data:</span>
                            <input 
                              type="date"
                              value={proximaReuniaoData}
                              onChange={e => setProximaReuniaoData(e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-slate-800 w-28 focus:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-black">Hora:</span>
                            <input 
                              type="time"
                              value={proximaReuniaoHora}
                              onChange={e => setProximaReuniaoHora(e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-slate-800 w-16 focus:ring-0"
                            />
                          </div>
                        </div>
                      </td>
                      <td colspan="3" className="p-2.5 w-1/2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-black">Local:</span>
                          <input 
                            type="text"
                            value={proximaReuniaoLocal}
                            placeholder="Sala comercial, Meet, etc..."
                            onChange={e => setProximaReuniaoLocal(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold text-slate-800 w-full focus:ring-0"
                          />
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* POPOVER PARA SELEÇÃO DE PARTICIPANTES / RESPONSÁVEIS */}
      <UserSelectPopover
        isOpen={popoverOpen}
        onClose={() => setPopoverOpen(false)}
        users={systemUsers}
        selectedIds={
          popoverTargetType === 'PARTICIPANTE'
            ? participantes.map(p => p.userId).filter((id): id is string => !!id)
            : acoes[activeAcaoIndex || 0]?.responsavelId 
              ? [acoes[activeAcaoIndex || 0].responsavelId] 
              : []
        }
        onSelect={
          popoverTargetType === 'PARTICIPANTE'
            ? handleSelectParticipante
            : handleSelectAcaoResponsavel
        }
        anchorEl={popoverAnchor}
        title="Buscar colaborador..."
        isMulti={popoverTargetType === 'PARTICIPANTE'}
      />
    </div>
  );
}
