'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import UserSelectPopover from '@/components/UserSelectPopover';
import { 
  FileText, Plus, Search, Calendar, MapPin, Check, 
  Trash2, User, Users, ClipboardList, TrendingUp, AlertCircle, 
  CheckCircle2, Edit3, Eye, MoreHorizontal, ArrowLeft,
  Bold, Italic, Underline, Strikethrough, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Type, Palette, Clock,
  ChevronRight, Sparkles, CheckSquare, History, Square
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
  // Estados de listagem e estatísticas
  const [atas, setAtas] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, concluidas: 0, pendentes: 0, taxaEficacia: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usuários do sistema (para filtros, responsáveis e participantes)
  const [systemUsers, setSystemUsers] = useState<any[]>([]);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAtaId, setSelectedAtaId] = useState<string | null>(null);
  
  // Campos do formulário da ATA
  const [titulo, setTitulo] = useState('');
  const [dataReuniou, setDataReuniou] = useState(() => new Date().toISOString().split('T')[0]);
  const [local, setLocal] = useState('');
  const [pautas, setPautas] = useState<string[]>(['']);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [pautasDeliberativas, setPautasDeliberativas] = useState<PautaDeliberativa[]>([]);
  const [consideracoes, setConsideracoes] = useState('');
  const [proximaReuniaoData, setProximaReuniaoData] = useState<string>('');
  const [proximaReuniaoHora, setProximaReuniaoHora] = useState<string>('');
  const [proximaReuniaoLocal, setProximaReuniaoLocal] = useState<string>('');
  const [acoes, setAcoes] = useState<Acao[]>([]);

  // Versões da ATA
  const [versoesHistorico, setVersoesHistorico] = useState<any[]>([]);
  const [activeVersaoIndex, setActiveVersaoIndex] = useState<number | null>(null);

  // Estados de controle do Popover de Seleção de Usuários
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverTargetType, setPopoverTargetType] = useState<'PARTICIPANTE' | 'ACAO_RESPONSAVEL'>('PARTICIPANTE');
  const [activeAcaoIndex, setActiveAcaoIndex] = useState<number | null>(null);

  // Referência do editor de texto rico contentEditable
  const editorRef = useRef<HTMLDivElement>(null);

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

  // Sincroniza o HTML do editor de texto com o estado
  useEffect(() => {
    if (editorRef.current && consideracoes !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = consideracoes;
    }
  }, [consideracoes, isModalOpen]);

  // Funções de manipulação do Editor de Texto Rico (document.execCommand nativo)
  const execEditorCmd = (cmd: string, val: string = '') => {
    if (editorRef.current) {
      document.execCommand(cmd, false, val);
      setConsideracoes(editorRef.current.innerHTML);
    }
  };

  // Abre modal de criação de nova ATA
  const handleOpenNewAtaModal = () => {
    setIsEditing(false);
    setSelectedAtaId(null);
    setTitulo(`Ata de Reunião Comercial - ${new Date().toLocaleDateString('pt-BR')}`);
    setDataReuniou(new Date().toISOString().split('T')[0]);
    setLocal('Sala de Operações JVS FAC');
    setPautas(['']);
    setParticipantes([]);
    setPautasDeliberativas([]);
    setConsideracoes('');
    setProximaReuniaoData('');
    setProximaReuniaoHora('');
    setProximaReuniaoLocal('');
    setAcoes([]);
    setVersoesHistorico([]);
    setActiveVersaoIndex(null);
    setIsModalOpen(true);
  };

  // Abre modal para editar/visualizar ATA
  const handleOpenEditAtaModal = async (id: string) => {
    setLoading(true);
    try {
      const ata = await getAtaCompleta(id);
      if (ata) {
        setIsEditing(true);
        setSelectedAtaId(ata.id);
        setTitulo(ata.titulo);
        setDataReuniou(ata.dataReuniou.split('T')[0]);
        setLocal(ata.local || '');
        setPautas(Array.isArray(ata.pautas) ? (ata.pautas as string[]) : ['']);
        setParticipantes(Array.isArray(ata.participantesPresentes) ? (ata.participantesPresentes as Participante[]) : []);
        setPautasDeliberativas(Array.isArray(ata.pautasDeliberativas) ? (ata.pautasDeliberativas as PautaDeliberativa[]) : []);
        setConsideracoes(ata.consideracoes || '');
        setProximaReuniaoData(ata.proximaReuniaoData ? ata.proximaReuniaoData.split('T')[0] : '');
        setProximaReuniaoHora(ata.proximaReuniaoHora || '');
        setProximaReuniaoLocal(ata.proximaReuniaoLocal || '');
        setAcoes(ata.acoes.map((a: any) => ({
          id: a.id,
          item: a.item || '',
          descricao: a.descricao,
          responsavelId: a.responsavelId,
          responsavelNome: a.responsavel?.nome || 'Não identificado',
          dataLimite: a.dataLimite.split('T')[0],
          numBitrix: a.numBitrix || '',
          concluida: a.concluida
        })));
        setVersoesHistorico(ata.versoesHistorico || []);
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar ATA
  const handleDeleteAta = async (id: string) => {
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

  // Função de salvar a ATA
  const handleSaveAta = async (criarNovaVersao: boolean = false) => {
    if (!titulo.trim()) {
      alert('O título da ata é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const cleanPautas = pautas.filter(p => p.trim() !== '');
      const htmlText = editorRef.current ? editorRef.current.innerHTML : consideracoes;

      const res = await saveAta({
        id: selectedAtaId || undefined,
        titulo: titulo.trim(),
        dataReuniou,
        local: local.trim(),
        pautas: cleanPautas,
        participantesPresentes: participantes,
        pautasDeliberativas,
        consideracoes: htmlText,
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
        setIsModalOpen(false);
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

  // Alternar checkbox de conclusão de ações direto da listagem ou do modal
  const handleToggleAcao = async (acaoId: string, concluida: boolean) => {
    try {
      const res = await toggleAcaoConclusao(acaoId, concluida);
      if (res.success) {
        // Atualiza a ação correspondente na memória local
        setAcoes(prev => prev.map(a => a.id === acaoId ? { ...a, concluida } : a));
        // Recarrega os dados do dashboard em background
        const [atasList, statsData] = await Promise.all([getAtas(), getAcoesStats()]);
        setAtas(atasList);
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manipuladores de Pautas Principais
  const handleAddPautaRow = () => setPautas(prev => [...prev, '']);
  const handleRemovePautaRow = (idx: number) => {
    if (pautas.length === 1) {
      setPautas(['']);
    } else {
      setPautas(prev => prev.filter((_, i) => i !== idx));
    }
  };
  const handlePautaChange = (idx: number, val: string) => {
    setPautas(prev => prev.map((p, i) => i === idx ? val : p));
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

  // Adição de participante externo (que não está no sistema)
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
      // Re-indexa os números dos itens
      return filtered.map((p, i) => ({ ...p, item: String(i + 1) }));
    });
  };

  const handlePautaDeliberativaChange = (idx: number, key: keyof PautaDeliberativa, val: string) => {
    setPautasDeliberativas(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  };

  // Manipuladores de Ações Corretivas
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

  const filteredAtas = atas.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.local && a.local.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <ClipboardList size={24} /> Atas de Reunião
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">
                Gestão de alinhamentos, pautas e pendências comerciais
              </p>
            </div>
            <button
              onClick={handleOpenNewAtaModal}
              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Plus size={16} /> Nova Ata
            </button>
          </header>

          {/* INDICADORES DE AÇÕES (DASHBOARD) */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* LISTAGEM DE ATAS */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                <FileText size={18} /> Histórico de Atas
              </h2>
              {/* Barra de Busca */}
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
                          <p className="text-slate-800 font-bold text-xs group-hover:text-[#1B4D3E] transition-colors">
                            {ata.titulo}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{ata.pautasCount} pautas pautadas</p>
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
                            onClick={() => handleOpenEditAtaModal(ata.id)}
                            className="p-1.5 hover:bg-[#1B4D3E]/10 hover:text-[#1B4D3E] text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title="Editar Ata"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteAta(ata.id)}
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
        </div>
      </main>

      {/* MODAL FORM-BUILDER (CRIAR E EDITAR ATA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex justify-end overflow-hidden animate-fadeIn">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col justify-between animate-slideInRight duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#1B4D3E] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-green-200/80">
                    {isEditing ? `Editando Ata (Revisão R${String(activeVersaoIndex || 1).padStart(2, '0')})` : 'Novo Alinhamento'}
                  </span>
                  <h3 className="text-sm font-bold truncate max-w-[450px]">
                    {isEditing ? titulo : 'Criar Ata de Reunião'}
                  </h3>
                </div>
              </div>
              
              {/* Botões de Ação no Header */}
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    onClick={() => handleSaveAta(true)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] py-2 px-3 rounded-lg flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer"
                    title="Gera uma nova revisão congelando a atual"
                  >
                    <History size={12} /> Nova Revisão (Revisar)
                  </button>
                )}
                <button
                  onClick={() => handleSaveAta(false)}
                  className="bg-white hover:bg-slate-100 text-[#1B4D3E] font-bold text-[10px] py-2.5 px-4 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              
              {/* HISTÓRICO DE REVISÕES (Se houver) */}
              {versoesHistorico.length > 0 && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <History size={14} /> Histórico de Versões / Revisões desta Reunião
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {versoesHistorico.map((ver, idx) => {
                      const isActive = ver.id === selectedAtaId;
                      return (
                        <button
                          key={ver.id}
                          onClick={() => {
                            setActiveVersaoIndex(ver.versao);
                            handleOpenEditAtaModal(ver.id);
                          }}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-[#1B4D3E] border-[#1B4D3E] text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          R{String(ver.versao).padStart(2, '0')} ({new Date(ver.data).toLocaleDateString('pt-BR')})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DADOS BÁSICOS (CABEÇALHO) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título da Ata</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      placeholder="Ex: Ata de Alinhamento Comercial com Diretoria"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Reunião</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Calendar size={14} />
                      </span>
                      <input
                        type="date"
                        value={dataReuniou}
                        onChange={e => setDataReuniou(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <MapPin size={14} />
                      </span>
                      <input
                        type="text"
                        value={local}
                        onChange={e => setLocal(e.target.value)}
                        placeholder="Ex: Sala de Operações JVS FAC ou Meet Online"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PARTICIPANTES DA REUNIÃO */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={16} /> Participantes da Reunião
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="participante-btn"
                      onClick={handleOpenParticipanteSelect}
                      className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    >
                      <Plus size={12} /> Da Equipe
                    </button>
                    <button
                      type="button"
                      onClick={handleAddParticipanteExterno}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    >
                      <Plus size={12} /> Convidado Externo
                    </button>
                  </div>
                </div>

                {participantes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                    Nenhum participante adicionado
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                      <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-3">Nome</th>
                          <th className="py-3 px-3">Departamento</th>
                          <th className="py-3 px-3">E-mail</th>
                          <th className="py-3 px-3 text-center">Presente</th>
                          <th className="py-3 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {participantes.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="py-2.5 px-3">
                              {p.userId ? (
                                <span className="font-bold text-slate-800">{p.nome}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={p.nome}
                                  onChange={e => handleParticipanteInfoChange(idx, 'nome', e.target.value)}
                                  placeholder="Digite o nome..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-medium">
                              {p.userId ? (
                                <span>{p.departamento}</span>
                              ) : (
                                <input
                                  type="text"
                                  value={p.departamento}
                                  onChange={e => handleParticipanteInfoChange(idx, 'departamento', e.target.value)}
                                  placeholder="Cargo / Depto..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-medium">
                              {p.userId ? (
                                <span>{p.email}</span>
                              ) : (
                                <input
                                  type="email"
                                  value={p.email}
                                  onChange={e => handleParticipanteInfoChange(idx, 'email', e.target.value)}
                                  placeholder="E-mail..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <select
                                value={p.presente ? 'Sim' : 'Não'}
                                onChange={e => handleParticipanteInfoChange(idx, 'presente', e.target.value === 'Sim')}
                                className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold text-slate-700 bg-white"
                              >
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipante(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PAUTAS A SEREM TRATADAS */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList size={16} /> Pautas Principais
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPautaRow}
                    className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={12} /> Adicionar Pauta
                  </button>
                </div>

                <div className="space-y-2">
                  {pautas.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={p}
                        onChange={e => handlePautaChange(idx, e.target.value)}
                        placeholder="Ex: Alinhamento de Metas de Faturamento"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePautaRow(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RELATÓRIO DA REUNIÃO */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
                <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FileText size={16} /> Relatório da Reunião
                </h4>

                {/* PAUTAS DELIBERATIVAS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pautas Deliberativas (Tabela de Deliberações)</span>
                    <button
                      type="button"
                      onClick={handleAddPautaDeliberativaRow}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[9px] py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                    >
                      <Plus size={10} /> Adicionar Item
                    </button>
                  </div>

                  {pautasDeliberativas.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                      Nenhuma pauta deliberativa listada
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                        <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-3 w-16">Item</th>
                            <th className="py-2.5 px-3">Descrição da Deliberação</th>
                            <th className="py-2.5 px-3 w-28">Status</th>
                            <th className="py-2.5 px-3">Anotação / Detalhe</th>
                            <th className="py-2.5 px-3 text-right w-12">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pautasDeliberativas.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="py-2 px-3 font-bold text-slate-500">
                                {p.item}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={p.descricao}
                                  onChange={e => handlePautaDeliberativaChange(idx, 'descricao', e.target.value)}
                                  placeholder="Descrição da pauta..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={p.status}
                                  onChange={e => handlePautaDeliberativaChange(idx, 'status', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-md text-xs bg-white font-bold"
                                >
                                  <option value="Tratado">Tratado</option>
                                  <option value="Pendente">Pendente</option>
                                  <option value="Adiado">Adiado</option>
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={p.anotacao || ''}
                                  onChange={e => handlePautaDeliberativaChange(idx, 'anotacao', e.target.value)}
                                  placeholder="Ex: Aprovada reestruturação de setores"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePautaDeliberativaRow(idx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* RICH TEXT EDITOR (CONSIDERAÇÕES) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Anotações Gerais / Considerações</span>
                  
                  {/* Toolbar */}
                  <div className="border border-slate-200 rounded-t-xl bg-slate-50 p-2 flex flex-wrap gap-1 items-center divide-x divide-slate-200 select-none">
                    <div className="flex gap-0.5 pr-2">
                      <button
                        type="button"
                        onClick={() => execEditorCmd('bold')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Negrito"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('italic')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Itálico"
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('underline')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Sublinhado"
                      >
                        <Underline size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('strikeThrough')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Tachado"
                      >
                        <Strikethrough size={14} />
                      </button>
                    </div>

                    <div className="flex gap-0.5 px-2">
                      <button
                        type="button"
                        onClick={() => execEditorCmd('justifyLeft')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Alinhar Esquerda"
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('justifyCenter')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Centralizar"
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('justifyRight')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Alinhar Direita"
                      >
                        <AlignRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => execEditorCmd('justifyFull')}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Justificar"
                      >
                        <AlignJustify size={14} />
                      </button>
                    </div>

                    <div className="flex gap-1.5 px-2 items-center">
                      {/* Cor da Fonte */}
                      <span className="text-slate-400" title="Cor do Texto">
                        <Palette size={14} />
                      </span>
                      <input
                        type="color"
                        onChange={e => execEditorCmd('foreColor', e.target.value)}
                        className="w-5 h-5 p-0 border-0 rounded-md cursor-pointer outline-none bg-transparent"
                        title="Escolher Cor"
                      />
                      
                      {/* Tamanho da Fonte */}
                      <span className="text-slate-400 pl-1" title="Tamanho do Texto">
                        <Type size={14} />
                      </span>
                      <select
                        onChange={e => execEditorCmd('fontSize', e.target.value)}
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

                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={e => setConsideracoes(e.currentTarget.innerHTML)}
                    className="min-h-[180px] p-4 bg-white border border-t-0 border-slate-200 rounded-b-xl text-slate-800 text-xs font-medium outline-none focus:bg-slate-50/10 transition-colors focus:border-slate-300"
                    placeholder="Escreva as anotações e deliberações gerais da ata..."
                    style={{ whiteSpace: 'pre-wrap' }}
                  />
                </div>
              </div>

              {/* AÇÕES DE REUNIÃO (TABELA DE PENDÊNCIAS) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5">
                    <CheckSquare size={16} /> Ações e Plano de Trabalho Gerados
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddAcaoRow}
                    className="bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] font-bold text-[10px] py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={12} /> Adicionar Ação
                  </button>
                </div>

                {acoes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                    Nenhuma ação de reunião adicionada
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                      <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-3 w-12 text-center">Item</th>
                          <th className="py-3 px-3">Descrição da Ação</th>
                          <th className="py-3 px-3 w-40">Responsável</th>
                          <th className="py-3 px-3 w-32">Prazo Limite</th>
                          <th className="py-3 px-3 w-28">Nº Bitrix</th>
                          <th className="py-3 px-3 text-center w-16">Status</th>
                          <th className="py-3 px-3 text-right w-12">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {acoes.map((a, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                              {a.item || (idx + 1)}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={a.descricao}
                                onChange={e => handleAcaoFieldChange(idx, 'descricao', e.target.value)}
                                placeholder="Descrever a tarefa..."
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              {/* Botão de escolha do Responsável */}
                              <button
                                type="button"
                                onClick={e => handleOpenAcaoResponsavelSelect(e, idx)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-left text-xs text-slate-700 font-bold hover:bg-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span className="truncate max-w-[120px]">
                                  {a.responsavelNome || 'Selecionar'}
                                </span>
                                <User size={12} className="text-slate-400 shrink-0" />
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="date"
                                value={a.dataLimite}
                                onChange={e => handleAcaoFieldChange(idx, 'dataLimite', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={a.numBitrix || ''}
                                onChange={e => handleAcaoFieldChange(idx, 'numBitrix', e.target.value)}
                                placeholder="Nº Bitrix..."
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = !a.concluida;
                                  handleAcaoFieldChange(idx, 'concluida', newVal);
                                  if (a.id) {
                                    handleToggleAcao(a.id, newVal);
                                  }
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  a.concluida
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                    : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                                }`}
                              >
                                {a.concluida ? <CheckSquare size={16} /> : <Square size={16} />}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAcaoRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* PRÓXIMA REUNIÃO */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Calendar size={16} /> Programação da Próxima Reunião
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                    <input
                      type="date"
                      value={proximaReuniaoData}
                      onChange={e => setProximaReuniaoData(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                    <input
                      type="time"
                      value={proximaReuniaoHora}
                      onChange={e => setProximaReuniaoHora(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</label>
                    <input
                      type="text"
                      value={proximaReuniaoLocal}
                      onChange={e => setProximaReuniaoLocal(e.target.value)}
                      placeholder="Ex: Sala de Reunião JVS"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 text-slate-800"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 border-t border-slate-200 p-4 shrink-0 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-5 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveAta(false)}
                className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg uppercase tracking-wider cursor-pointer"
              >
                Salvar Ata
              </button>
            </div>

          </div>
        </div>
      )}

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
