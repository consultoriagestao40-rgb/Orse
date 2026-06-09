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
  History, X, MessageSquare, CheckSquare, Square, List, ListOrdered, FileSymlink, Copy,
  Indent, Outdent
} from 'lucide-react';
import { 
  getAtas, getAtaCompleta, saveAta, deleteAta, 
  toggleAcaoConclusao, getAcoesStats, addAcaoComentario, getLoggedUser,
  renameAtaCategory, deleteAtaCategory, cloneAta, notifyAtaPublish,
  getPendingActionsDetailed
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
  votos?: { nome: string; voto: 'Sim' | 'Não' }[];
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
  comentarios?: any[];
}

export default function AtasPage() {
  // Controle de Visualização: 'LIST' (Listagem) ou 'FORM' (Documento Técnico Centralizado)
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');

  // Helper para calcular e exibir o status da ata
  const getAtaStatusDisplay = (ata: any) => {
    if (ata.status === 'Rascunho') {
      return { label: 'Rascunho', color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (ata.status === 'Finalizada') {
      return { label: 'Finalizada', color: 'bg-green-50 text-green-700 border-green-200/50' };
    }
    // Se está publicada, mas possui alguma ação pendente (concluidas < totalAcoes), então está em aberto
    if (ata.totalAcoes > 0 && ata.concluidas < ata.totalAcoes) {
      return { label: 'Em aberto', color: 'bg-amber-50 text-amber-700 border-amber-200/50' };
    }
    return { label: 'Publicada', color: 'bg-blue-50 text-blue-700 border-blue-200/50' };
  };

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
  const [horaReuniou, setHoraReuniou] = useState('');
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

  // Novos campos: Categoria, Status, Justificativa de Finalização e Categoria Selecionada para Filtro
  const [categoria, setCategoria] = useState('Geral');
  const [status, setStatus] = useState('Rascunho');
  const [justificativaFinalizacao, setJustificativaFinalizacao] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Versões da ATA
  const [versoesHistorico, setVersoesHistorico] = useState<any[]>([]);
  const [activeVersaoIndex, setActiveVersaoIndex] = useState<number | null>(null);

  // Estados para Modal de Comentários
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeAcao, setActiveAcao] = useState<Acao | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para Modal de Finalização de Ata (com Justificativa Precoce)
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [justificativaInput, setJustificativaInput] = useState('');

  // Estados para sistema de menções @
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  const [activeEditorForMention, setActiveEditorForMention] = useState<React.RefObject<HTMLDivElement | null> | null>(null);

  // Estados de controle do Popover de Seleção de Usuários
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverTargetType, setPopoverTargetType] = useState<'PARTICIPANTE' | 'ACAO_RESPONSAVEL'>('PARTICIPANTE');
  const [activeAcaoIndex, setActiveAcaoIndex] = useState<number | null>(null);

  // Estados de Votação
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [activeDeliberativaIndex, setActiveDeliberativaIndex] = useState<number | null>(null);
  const [currentVotos, setCurrentVotos] = useState<{ nome: string; voto: 'Sim' | 'Não' }[]>([]);

  // Estados para Modal de Ações Pendentes Geral
  const [pendingActionsModalOpen, setPendingActionsModalOpen] = useState(false);
  const [detailedPendingActions, setDetailedPendingActions] = useState<any[]>([]);
  const [loadingPendingActions, setLoadingPendingActions] = useState(false);

  // Criador e Paleta de Cores Customizada
  const [criadorNome, setCriadorNome] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<'relatorio' | 'consideracoes' | null>(null);
  const [relatorioColor, setRelatorioColor] = useState('#000000');
  const [consideracoesColor, setConsideracoesColor] = useState('#000000');
  const colorPickerRef = useRef<HTMLDivElement>(null);

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
      const [atasList, statsData, usersRes, loggedUser] = await Promise.all([
        getAtas(),
        getAcoesStats(),
        getUsersForFilter(),
        getLoggedUser()
      ]);
      setAtas(atasList);
      setStats(statsData);
      if (usersRes.success && usersRes.users) {
        setSystemUsers(usersRes.users);
      }
      setCurrentUser(loggedUser);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fecha a paleta de cores ao clicar fora dela
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setActiveColorPicker(null);
      }
    }
    if (activeColorPicker !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeColorPicker]);

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
    setHoraReuniou(new Date().toTimeString().slice(0, 5));
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
    setCategoria('Geral');
    setStatus('Rascunho');
    setJustificativaFinalizacao(null);
    setCriadorNome(currentUser?.nome || '');
    setRelatorioColor('#000000');
    setConsideracoesColor('#000000');
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
        setHoraReuniou(ata.horaReuniou || '');
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
          concluida: a.concluida,
          comentarios: Array.isArray(a.comentarios) ? a.comentarios : []
        })));
        setVersoesHistorico(ata.versoesHistorico || []);
        setCategoria(ata.categoria || 'Geral');
        setStatus(ata.status || 'Rascunho');
        setJustificativaFinalizacao(ata.justificativaFinalizacao || null);
        setCriadorNome(ata.criadorNome || 'Não especificado');
        setRelatorioColor('#000000');
        setConsideracoesColor('#000000');
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

  // Renomeia uma categoria/pasta
  const handleRenameCategory = async (oldName: string) => {
    const newName = prompt(`Renomear a pasta "${oldName}" para:`, oldName);
    if (newName && newName.trim() !== '' && newName.trim() !== oldName) {
      setLoading(true);
      try {
        const res = await renameAtaCategory(oldName.trim(), newName.trim());
        if (res.success) {
          loadDashboardData();
        } else {
          alert(`Erro ao renomear: ${res.error}`);
        }
      } catch (e) {
        console.error(e);
        alert('Erro ao processar alteração.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Exclui uma categoria/pasta (atas voltam para 'Geral')
  const handleDeleteCategory = async (catName: string) => {
    if (confirm(`Deseja realmente excluir a pasta "${catName}"? As atas contidas nela serão movidas para a pasta "Geral".`)) {
      setLoading(true);
      try {
        const res = await deleteAtaCategory(catName);
        if (res.success) {
          if (selectedCategory === catName) {
            setSelectedCategory(null);
          }
          loadDashboardData();
        } else {
          alert(`Erro ao excluir: ${res.error}`);
        }
      } catch (e) {
        console.error(e);
        alert('Erro ao processar exclusão.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Clona uma ata existente
  const handleCloneAtaClick = async (id: string) => {
    if (confirm('Deseja realmente clonar esta ata? Uma nova ata como Rascunho será criada baseada nos dados dela.')) {
      setLoading(true);
      try {
        const res = await cloneAta(id);
        if (res.success && res.clonedId) {
          await loadDashboardData();
          // Já abre a ata clonada para edição
          handleOpenEditAta(res.clonedId);
        } else {
          alert(`Erro ao clonar ata: ${res.error}`);
        }
      } catch (e) {
        console.error(e);
        alert('Erro ao processar clonagem.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Salva ATA (cria nova ou edita)
  const handleSaveAtaClick = async (
    criarNovaVersao: boolean = false,
    statusOverride?: string,
    justificationOverride?: string | null
  ) => {
    if (!titulo.trim()) {
      alert('O título da ata é obrigatório.');
      return;
    }

    // Validação das ações corretivas antes de salvar
    const invalidAcaoResp = acoes.find(a => !a.responsavelId || a.responsavelId.trim() === '');
    if (invalidAcaoResp) {
      alert(`Por favor, selecione um responsável para a Ação ${invalidAcaoResp.item || ''}.`);
      return;
    }

    const invalidAcaoDesc = acoes.find(a => !a.descricao.trim());
    if (invalidAcaoDesc) {
      alert(`Por favor, preencha a descrição para a Ação ${invalidAcaoDesc.item || ''}.`);
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

      const nextStatus = statusOverride !== undefined ? statusOverride : status;
      const nextJust = justificationOverride !== undefined ? justificationOverride : justificativaFinalizacao;

      const res = await saveAta({
        id: selectedAtaId || undefined,
        titulo: titulo.trim(),
        dataReuniou,
        horaReuniou: horaReuniou || null,
        categoria: categoria || 'Geral',
        status: nextStatus,
        justificativaFinalizacao: nextJust,
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
        if (nextStatus === 'Publicada') {
          try {
            await notifyAtaPublish(res.ataId!);
          } catch (notifyErr) {
            console.error('Erro ao enviar notificações de publicação:', notifyErr);
          }
        }
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

  // Abre diálogo de finalização (com verificação de pendências)
  const handleOpenFinalizeDialog = () => {
    const hasPendingActions = acoes.some(a => !a.concluida);
    if (hasPendingActions && acoes.length > 0) {
      setJustificativaInput('');
      setFinalizeModalOpen(true);
    } else {
      if (confirm('Deseja realmente finalizar esta Ata? Todas as ações geradas nela foram concluídas.')) {
        handleSaveAtaClick(false, 'Finalizada', null);
      }
    }
  };

  // Confirma finalização com justificativa
  const handleConfirmFinalize = () => {
    if (!justificativaInput.trim()) {
      alert('Por favor, digite a justificativa para finalizar a ata com ações pendentes.');
      return;
    }
    setFinalizeModalOpen(false);
    handleSaveAtaClick(false, 'Finalizada', justificativaInput.trim());
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

  // Status da ação calculado
  const getAcaoStatusText = (acao: Acao) => {
    if (acao.concluida) return 'CONCLUÍDO';
    if (!acao.dataLimite) return 'EM DIA';
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deadline = new Date(acao.dataLimite + 'T00:00:00');
      if (today > deadline) {
        return 'ATRASADA';
      }
    } catch (e) {
      console.error(e);
    }
    return 'EM DIA';
  };

  // Abre modal de ações pendentes geral
  const handleOpenPendingActionsModal = async () => {
    setLoadingPendingActions(true);
    setPendingActionsModalOpen(true);
    try {
      const res = await getPendingActionsDetailed();
      if (res.success && res.actions) {
        setDetailedPendingActions(res.actions);
      } else {
        console.error('Erro ao carregar ações pendentes:', res.error);
      }
    } catch (err) {
      console.error('Erro ao carregar ações pendentes:', err);
    } finally {
      setLoadingPendingActions(false);
    }
  };

  // Abre modal de comentários
  const handleOpenCommentsModal = (idx: number) => {
    const acao = acoes[idx];
    if (acao) {
      setActiveAcao(acao);
      setNovoComentario('');
      setCommentModalOpen(true);
    }
  };

  // Adiciona comentário
  const handleAddComment = async () => {
    if (!activeAcao || !activeAcao.id || !novoComentario.trim()) return;

    try {
      const res = await addAcaoComentario(activeAcao.id, novoComentario.trim());
      if (res.success && res.comment) {
        const updatedComments = [...(activeAcao.comentarios || []), res.comment];
        const updatedAcao = { ...activeAcao, comentarios: updatedComments };
        setActiveAcao(updatedAcao);
        
        // Atualiza a lista de ações local
        setAcoes(prev => prev.map(a => a.id === activeAcao.id ? updatedAcao : a));
        setNovoComentario('');
      } else {
        alert(res.error || 'Erro ao adicionar comentário');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao processar comentário.');
    }
  };

  // Insere HTML no cursor atual de um editor contentEditable
  const insertHtmlAtCursor = (ref: React.RefObject<HTMLDivElement | null>, html: string) => {
    if (ref.current) {
      ref.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (ref.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          
          const el = document.createElement('div');
          el.innerHTML = html;
          const frag = document.createDocumentFragment();
          let node;
          while ((node = el.firstChild)) {
            frag.appendChild(node);
          }
          range.insertNode(frag);
          
          // Move cursor para o final
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Atualiza estado respectivo
          if (ref === relatorioEditorRef) {
            setRelatorio(ref.current.innerHTML);
          } else if (ref === consideracoesEditorRef) {
            setConsideracoes(ref.current.innerHTML);
          }
          return;
        }
      }
      // Se não tiver seleção ou cursor focado no editor, apenas anexa
      ref.current.innerHTML += html;
      if (ref === relatorioEditorRef) {
        setRelatorio(ref.current.innerHTML);
      } else if (ref === consideracoesEditorRef) {
        setConsideracoes(ref.current.innerHTML);
      }
    }
  };

  // Puxa pauta selecionada para o editor de relatório (anexando sempre ao final do texto e de seus parágrafos)
  const handlePullPautaToReport = (idx: number) => {
    const pauta = pautas[idx];
    if (pauta && pauta.descricao.trim()) {
      const pautaHtml = `<p><strong>Item ${String(idx + 1).padStart(2, '0')}: ${pauta.descricao.trim()}</strong></p>`;
      
      if (relatorioEditorRef.current) {
        let currentHtml = relatorioEditorRef.current.innerHTML.trim();
        
        // Limpa quebras de linhas redundantes caso esteja vazio
        if (currentHtml === '<br>' || currentHtml === '<p><br></p>' || currentHtml === '') {
          currentHtml = '';
        }
        
        let newHtml = currentHtml;
        if (newHtml !== '') {
          newHtml += pautaHtml;
        } else {
          newHtml = pautaHtml;
        }
        
        relatorioEditorRef.current.innerHTML = newHtml;
        setRelatorio(newHtml);
        
        // Foca e coloca o cursor de digitação no final do editor
        relatorioEditorRef.current.focus();
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(relatorioEditorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };

  // Monitora digitação do caractere @ para autocomplete
  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveEditorForMention(ref);
    
    if (e.key === 'Escape') {
      setShowMentionDropdown(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setShowMentionDropdown(false);
      return;
    }
    
    const text = node.textContent || '';
    const offset = range.startOffset;
    
    const textBeforeCursor = text.substring(0, offset);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex >= textBeforeCursor.length - 15) {
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.substring(atIndex + 1);
        setMentionSearch(query);
        
        try {
          const rect = range.getBoundingClientRect();
          setMentionCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
          });
          setShowMentionDropdown(true);
          return;
        } catch (err) {
          console.error(err);
        }
      }
    }
    setShowMentionDropdown(false);
  };

  // Seleciona menção e insere no editor de forma estilizada
  const handleSelectMention = (pNome: string) => {
    if (!activeEditorForMention || !activeEditorForMention.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    const node = range.startContainer;
    const text = node.textContent || '';
    const offset = range.startOffset;
    
    const textBeforeCursor = text.substring(0, offset);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      range.setStart(node, atIndex);
      range.setEnd(node, offset);
      range.deleteContents();
      
      const span = document.createElement('span');
      span.className = 'text-blue-600 font-bold';
      span.style.color = '#1d4ed8';
      span.style.fontWeight = 'bold';
      span.textContent = pNome;
      
      range.insertNode(span);
      
      const space = document.createTextNode(' ');
      span.parentNode?.insertBefore(space, span.nextSibling);
      
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      if (activeEditorForMention === relatorioEditorRef) {
        setRelatorio(activeEditorForMention.current.innerHTML);
      } else if (activeEditorForMention === consideracoesEditorRef) {
        setConsideracoes(activeEditorForMention.current.innerHTML);
      }
    }
    setShowMentionDropdown(false);
  };

  // Fecha popup de menções ao clicar fora
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowMentionDropdown(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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

  const handlePautaDeliberativaChange = (idx: number, key: keyof PautaDeliberativa, val: any) => {
    setPautasDeliberativas(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
  };

  const handleOpenVotingModal = (idx: number) => {
    setActiveDeliberativaIndex(idx);
    const pd = pautasDeliberativas[idx];
    if (pd) {
      if (pd.votos && pd.votos.length > 0) {
        setCurrentVotos(pd.votos);
      } else {
        const initialVotos = participantes
          .filter(p => p.presente && p.nome.trim())
          .map(p => ({ nome: p.nome.trim(), voto: 'Sim' as const }));
        setCurrentVotos(initialVotos);
      }
      setVotingModalOpen(true);
    }
  };

  const handleConfirmVoting = () => {
    if (activeDeliberativaIndex === null) return;
    if (currentVotos.length === 0) {
      alert('Adicione pelo menos um votante para realizar a votação.');
      return;
    }
    const simCount = currentVotos.filter(v => v.voto === 'Sim').length;
    const naoCount = currentVotos.filter(v => v.voto === 'Não').length;
    const nextStatus = simCount > naoCount ? 'Aprovada' : 'Não aprovada';
    setPautasDeliberativas(prev => prev.map((pd, i) => i === activeDeliberativaIndex ? {
      ...pd,
      status: nextStatus,
      votos: currentVotos
    } : pd));
    setVotingModalOpen(false);
    setActiveDeliberativaIndex(null);
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

  // Filtra atas por busca e categoria
  const filteredAtas = atas.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.local && a.local.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === null ? true : a.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas existentes nas atas
  const categoriesList = Array.from(new Set(atas.map(a => a.categoria || 'Geral')));
  const activeCategories = Array.from(new Set(['Geral', ...atas.map(a => a.categoria).filter(Boolean)]));

  // Filtra candidatos para menção no autocomplete
  const mentionCandidates = participantes.filter(p => 
    p.nome.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const themeColorsGrid = [
    ['#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646'],
    ['#f2f2f2', '#7f7f7f', '#f4f3ed', '#dce6f1', '#e9edf4', '#f2dbdb', '#ebf1de', '#e8e5ee', '#e5f3f5', '#fdeada'],
    ['#d9d9d9', '#595959', '#ebe9df', '#b8cce4', '#cfdae8', '#e6b8b7', '#d7e3bc', '#ccc1da', '#c3e6ec', '#fbd5b5'],
    ['#bfbfbf', '#3f3f3f', '#dddcd2', '#95b3d7', '#b5c7e0', '#d99694', '#c3d69b', '#b2a1c7', '#a3d8e2', '#fac090'],
    ['#a6a6a6', '#262626', '#c4c3b9', '#16365c', '#3b618e', '#903c39', '#748c41', '#604a7b', '#388194', '#b97034'],
    ['#7f7f7f', '#0d0d0d', '#a2a29a', '#0f243e', '#27415f', '#602826', '#4e5d2b', '#403152', '#255663', '#7c4b22']
  ];

  const standardColors = [
    '#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'
  ];

  const renderColorPicker = (ref: React.RefObject<HTMLDivElement | null>, type: 'relatorio' | 'consideracoes') => {
    const hiddenInputId = `hidden-color-input-${type}`;
    
    const onColorSelect = (color: string) => {
      execEditorCmd(ref, 'foreColor', color);
      if (type === 'relatorio') {
        setRelatorioColor(color);
      } else {
        setConsideracoesColor(color);
      }
      setActiveColorPicker(null);
    };

    return (
      <div 
        ref={colorPickerRef}
        className="absolute top-8 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3 w-[240px] no-print"
      >
        {/* Input de cor nativo oculto */}
        <input 
          id={hiddenInputId}
          type="color"
          className="hidden"
          onChange={(e) => onColorSelect(e.target.value)}
        />

        {/* 1. Grid de Cores do Tema */}
        <div className="grid grid-cols-10 gap-[2px] mb-2">
          {themeColorsGrid.map((row, rIdx) => 
            row.map((color, cIdx) => (
              <button
                key={`theme-${rIdx}-${cIdx}`}
                type="button"
                onClick={() => onColorSelect(color)}
                className="w-[18px] h-[18px] rounded-[1px] border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))
          )}
        </div>

        {/* 2. Cores Padrão */}
        <div className="mb-2">
          <div className="text-[10px] font-semibold text-slate-500 mb-1">Cores Padrão</div>
          <div className="grid grid-cols-10 gap-[2px]">
            {standardColors.map((color, idx) => (
              <button
                key={`std-${idx}`}
                type="button"
                onClick={() => onColorSelect(color)}
                className="w-[18px] h-[18px] rounded-[1px] border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* 3. Divisor */}
        <div className="border-t border-slate-100 my-2" />

        {/* 4. Opções Extras */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => document.getElementById(hiddenInputId)?.click()}
            className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded transition-colors cursor-pointer"
          >
            <Palette size={14} className="text-slate-500" />
            <span>Mais Cores...</span>
          </button>
          
          <button
            type="button"
            className="flex items-center justify-between w-full text-left px-2 py-1.5 text-xs text-slate-400 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-2">
              <div className="w-[14px] h-[14px] rounded-[1px] bg-gradient-to-tr from-slate-200 to-slate-400 border border-slate-200" />
              <span>Gradiente</span>
            </div>
            <span className="text-[10px]">▶</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Ocultada na impressão */}
      <Sidebar />
      
      {/* Estilos CSS para Impressão de PDF Técnico e Formal */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Remove cabeçalho e rodapé padrão do navegador */
          @page {
            size: A4;
            margin: 0mm !important;
          }
          /* Oculta tudo que não for o documento */
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
          }
          html, body, main, .flex, .min-h-screen, .space-y-6 {
            float: none !important;
            position: relative !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          main {
            margin-right: 0 !important;
          }
          #print-document-container {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 1.8cm !important; /* Margem física nas bordas da página impressa */
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
          /* Oculta ícone do Webkit nos inputs de tempo/data */
          input[type="time"]::-webkit-calendar-picker-indicator,
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none !important;
          }
          /* Garante cores de background no PDF */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ocultação de elementos no final para evitar overrides de seletores flex/grid */
          .sidebar-aside, .sidebar-topbar, .sidebar-widget-panel, .no-print, [class*="backdrop-blur"], header, .top-bar-actions, button, svg {
            display: none !important;
          }
        }
        /* Estilos do Editor de Texto Rico na Tela e Impressão */
        .document-canvas ul, .document-canvas ol {
          padding-left: 20px !important;
          margin-top: 4px !important;
          margin-bottom: 4px !important;
        }
        .document-canvas ul {
          list-style-type: disc !important;
        }
        .document-canvas ol {
          list-style-type: decimal !important;
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

                <div 
                  onClick={handleOpenPendingActionsModal}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                >
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

              {/* PASTAS / CATEGORIAS DE ATAS */}
              <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 no-print">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">📁</span> Pastas de Reuniões
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer group ${
                      selectedCategory === null
                        ? 'bg-[#1B4D3E]/10 border-[#1B4D3E]/20 text-[#1B4D3E] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">📂</span>
                    <span className="text-xs font-bold truncate w-full">Todas as Atas</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">{atas.length} documentos</span>
                  </button>

                  {/* Pastas dinâmicas baseadas nas categorias existentes e reais */}
                  {activeCategories.map(cat => {
                    const count = cat === 'Geral'
                      ? atas.filter(a => !a.categoria || a.categoria === 'Geral').length
                      : atas.filter(a => a.categoria === cat).length;
                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`relative group/folder flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer group ${
                          selectedCategory === cat
                            ? 'bg-[#1B4D3E]/10 border-[#1B4D3E]/20 text-[#1B4D3E] shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {/* Ações de Pasta (Ocultadas por padrão, exibidas no hover) */}
                        {cat !== 'Geral' && (
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover/folder:opacity-100 transition-opacity no-print">
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameCategory(cat);
                              }}
                              className="p-1 bg-white hover:bg-slate-100 text-slate-500 hover:text-[#1B4D3E] rounded border border-slate-200 transition-all cursor-pointer"
                              title="Renomear Pasta"
                            >
                              <Edit3 size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat);
                              }}
                              className="p-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 rounded border border-slate-200 transition-all cursor-pointer"
                              title="Excluir Pasta"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}

                        <span className="text-3xl mb-1 group-hover/folder:scale-110 transition-transform">📁</span>
                        <span className="text-xs font-bold truncate w-full">{cat}</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold">{count} documentos</span>
                      </div>
                    );
                  })}
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
                          <th className="py-4 px-4 text-center">Status</th>
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-800 font-bold text-xs">
                                  {ata.titulo}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-black rounded uppercase">
                                  {ata.categoria || 'Geral'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <p className="text-[9px] text-slate-400">{ata.pautasCount} pautas listadas</p>
                                <span className="text-[9px] text-slate-300">•</span>
                                <p className="text-[9px] text-slate-500 font-medium">Criada por: {ata.criadorNome || 'Não especificado'}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-500 font-medium">
                              {new Date(ata.dataReuniou).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {(() => {
                                const statusDisp = getAtaStatusDisplay(ata);
                                return (
                                  <span className={`px-2.5 py-0.5 border text-[9px] font-black rounded-full uppercase tracking-wider ${statusDisp.color}`}>
                                    {statusDisp.label}
                                  </span>
                                );
                              })()}
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
                                onClick={() => handleCloneAtaClick(ata.id)}
                                className="p-1.5 hover:bg-[#1B4D3E]/10 hover:text-[#1B4D3E] text-slate-400 rounded-lg transition-colors cursor-pointer"
                                title="Clonar Ata"
                              >
                                <Copy size={15} />
                              </button>
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

                  {status === 'Rascunho' && (
                    <>
                      <button
                        onClick={() => handleSaveAtaClick(false, 'Rascunho')}
                        className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-[10px] py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                        title="Salva o documento mantendo o status de rascunho privado"
                      >
                        Salvar Rascunho
                      </button>
                      <button
                        onClick={() => handleSaveAtaClick(false, 'Publicada')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                        title="Publica a ata permitindo que todos vejam e comentem"
                      >
                        Publicar Ata
                      </button>
                    </>
                  )}

                  {status === 'Publicada' && (
                    <>
                      <button
                        onClick={() => handleSaveAtaClick(false, 'Publicada')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                        title="Salva alterações na ata publicada"
                      >
                        Salvar Alterações
                      </button>
                      <button
                        onClick={handleOpenFinalizeDialog}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] py-2.5 px-5 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                        title="Finaliza a ata (solicita justificativa se houver ações pendentes)"
                      >
                        Finalizar Ata
                      </button>
                    </>
                  )}

                  {status === 'Finalizada' && (
                    <button
                      onClick={() => handleSaveAtaClick(false, 'Finalizada')}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold text-[10px] py-2.5 px-6 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md hover:shadow-lg"
                      title="Salva alterações no documento finalizado"
                    >
                      Salvar Alterações
                    </button>
                  )}
                </div>
              </div>

              {/* CANVAS DO DOCUMENTO (FOLHA A4 TÉCNICA CENTRALIZADA EM FORMATO DE TABELA WORD) */}
              <div 
                id="print-document-container"
                className="document-canvas w-full max-w-4xl bg-white border border-slate-300 shadow-xl p-8 mx-auto font-sans relative text-slate-800"
              >
                {/* ESTRUTURA TÉCNICA EM TABELA (IDÊNTICA AO WORD DO USUÁRIO) */}
                <table className="w-full border-2 border-slate-900 border-collapse text-xs select-text table-fixed">
                  <colgroup>
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '5%' }} />
                  </colgroup>
                  
                  {/* CABEÇALHO DA ATA */}
                  <thead>
                    <tr>
                      <th colspan="7" className="bg-[#1E4663] text-white font-black text-center text-sm py-3 border-b-2 border-slate-900 tracking-wider">
                        {titulo ? titulo.toUpperCase() : 'ATA DE REUNIÃO – COMERCIAL'}
                      </th>
                    </tr>
                    
                    {/* METADADOS (DATA, HORA E LOCAL) */}
                    <tr className="bg-white border-b border-slate-900 text-slate-800">
                      <td colspan="4" className="p-2.5 border-r border-slate-900 font-bold">
                        <div className="flex gap-4 items-center flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800 font-black">DATA:</span>
                            <input 
                              type="date"
                              value={dataReuniou}
                              onChange={e => setDataReuniou(e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-slate-800 w-28 focus:ring-0"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-4">
                            <span className="text-slate-800 font-black">HORA:</span>
                            <input 
                              type="time"
                              value={horaReuniou}
                              onChange={e => setHoraReuniou(e.target.value)}
                              className="bg-transparent border-none outline-none font-bold text-slate-800 w-20 focus:ring-0"
                            />
                          </div>
                        </div>
                      </td>
                      <td colspan="3" className="p-2.5 font-bold">
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

                    {/* METADADOS 2 (PASTA/CATEGORIA E STATUS) */}
                    <tr className="bg-white border-b-2 border-slate-900 text-slate-800">
                      <td colspan="4" className="p-2.5 border-r border-slate-900 font-bold">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-800 font-black">PASTA/CATEGORIA:</span>
                          <select
                            value={activeCategories.includes(categoria) ? categoria : 'Outro'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'Outro') {
                                setCategoria('');
                              } else {
                                setCategoria(val);
                              }
                            }}
                            className="bg-transparent border-none outline-none font-bold text-slate-800 focus:ring-0 cursor-pointer text-xs"
                          >
                            {activeCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="Outro">Outra (Personalizada)...</option>
                          </select>
                          {!activeCategories.includes(categoria) && (
                            <input
                              type="text"
                              value={categoria}
                              onChange={e => setCategoria(e.target.value)}
                              placeholder="Nome da pasta..."
                              className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 w-28 focus:ring-0 focus:bg-white"
                            />
                          )}
                        </div>
                      </td>
                      <td colspan="3" className="p-2.5 font-bold">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-800 font-black">STATUS:</span>
                            {(() => {
                              let label = status;
                              let color = 'bg-slate-100 text-slate-600 border-slate-200';
                              if (status === 'Rascunho') {
                                label = 'Rascunho';
                                color = 'bg-slate-100 text-slate-600';
                              } else if (status === 'Finalizada') {
                                label = 'Finalizada';
                                color = 'bg-green-100 text-green-700';
                              } else {
                                const hasPending = acoes.some(a => !a.concluida);
                                if (hasPending && acoes.length > 0) {
                                  label = 'Em aberto';
                                  color = 'bg-amber-100 text-amber-700';
                                } else {
                                  label = 'Publicada';
                                  color = 'bg-blue-100 text-blue-700';
                                }
                              }
                              return (
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${color}`}>
                                  {label}
                                </span>
                              );
                            })()}
                            {status === 'Finalizada' && justificativaFinalizacao && (
                              <span className="text-[9px] text-slate-500 font-bold italic">
                                (Justificado: {justificativaFinalizacao})
                              </span>
                            )}
                          </div>
                          {criadorNome && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Criada por: <strong className="text-slate-700 font-bold">{criadorNome}</strong>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* TÍTULO PARTICIPANTES */}
                    <tr>
                      <th colspan="7" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PARTICIPANTES:
                      </th>
                    </tr>

                    {/* COLUNAS PARTICIPANTES */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-left">
                      <th colspan="2" className="py-1 px-3 border-r border-slate-900">Nome</th>
                      <th colspan="2" className="py-1 px-3 border-r border-slate-900">Cargo</th>
                      <th className="py-1 px-3 border-r border-slate-900">E-mail</th>
                      <th className="py-1 px-3 border-r border-slate-900 text-center">Presente</th>
                      <th className="py-1 px-3 text-center no-print">Ações</th>
                    </tr>
                  </thead>
                  
                  {/* CORPO DOS PARTICIPANTES */}
                  <tbody className="divide-y divide-slate-900">
                    {participantes.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="7" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhum participante adicionado. Adicione colaboradores abaixo no painel.
                        </td>
                      </tr>
                    ) : (
                      participantes.map((p, idx) => {
                        const matchedUser = p.userId ? systemUsers.find(u => u.id === p.userId) : null;
                        const avatarUrl = matchedUser?.avatarUrl || p.avatarUrl;
                        return (
                          <tr key={idx} className="bg-white hover:bg-slate-50/10">
                            <td colspan="2" className="py-1 px-3 border-r border-slate-900 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                {avatarUrl ? (
                                  <img 
                                    src={avatarUrl} 
                                    alt={p.nome || 'Avatar'} 
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#1E4663]/10 flex items-center justify-center text-[10px] font-black text-[#1E4663] uppercase border border-slate-200 shrink-0">
                                    {p.nome ? p.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  {p.userId ? (
                                    p.nome
                                  ) : (
                                    <input 
                                      type="text"
                                      value={p.nome}
                                      placeholder="Nome do convidado..."
                                      onChange={e => handleParticipanteInfoChange(idx, 'nome', e.target.value)}
                                      className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs py-0.5 min-w-0 font-bold text-slate-800"
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td colspan="2" className="py-1 px-3 border-r border-slate-900 text-slate-600 font-medium">
                              {p.userId ? (
                                <span className="block truncate w-full" title={p.departamento}>
                                  {p.departamento}
                                </span>
                              ) : (
                                <input 
                                  type="text"
                                  value={p.departamento}
                                  placeholder="Cargo..."
                                  onChange={e => handleParticipanteInfoChange(idx, 'departamento', e.target.value)}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs py-0.5 min-w-0 font-medium text-slate-600"
                                />
                              )}
                            </td>
                            <td className="py-1 px-3 border-r border-slate-900 text-slate-600 font-medium">
                              {p.userId ? (
                                <span className="block truncate w-full" title={p.email}>
                                  {p.email}
                                </span>
                              ) : (
                                <input 
                                  type="text"
                                  value={p.email}
                                  placeholder="E-mail..."
                                  onChange={e => handleParticipanteInfoChange(idx, 'email', e.target.value)}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs py-0.5 min-w-0 font-medium text-slate-600"
                                />
                              )}
                            </td>
                            <td className="py-1 px-3 border-r border-slate-900 text-center">
                              <select
                                value={p.presente ? 'Sim' : 'Não'}
                                onChange={e => handleParticipanteInfoChange(idx, 'presente', e.target.value === 'Sim')}
                                className="bg-transparent border-none outline-none font-bold text-center text-slate-700 cursor-pointer text-xs py-0.5 h-auto min-w-0"
                              >
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                              </select>
                            </td>
                            <td className="py-1 px-3 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipante(idx)}
                                className="p-0 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer border-none bg-transparent"
                                title="Remover Participante"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* CONTROLES PARTICIPANTES (BOTOES) - Ocultados na impressão */}
                    <tr className="bg-slate-50/50 no-print border-b border-slate-900">
                      <td colspan="7" className="p-3">
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
                      <th colspan="7" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PAUTAS:
                      </th>
                    </tr>

                    {/* LISTA DE PAUTAS PRINCIPAIS COM CHECKBOX E INPUT */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="7" className="p-4 text-slate-800">
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
                              {p.descricao.trim() && (
                                <button
                                  type="button"
                                  onClick={() => handlePullPautaToReport(idx)}
                                  className="p-1.5 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-50 rounded-lg transition-all cursor-pointer no-print flex items-center gap-1 text-[10px] font-bold shrink-0"
                                  title="Puxar Pauta para o Relatório"
                                >
                                  <FileSymlink size={12} className="text-[#1B4D3E]" />
                                  <span>Puxar</span>
                                </button>
                              )}
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
                      <th colspan="7" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        RELATÓRIO DA REUNIÃO:
                      </th>
                    </tr>

                    {/* EDITOR PRINCIPAL DO RELATÓRIO / RELAÇÃO DE ATIVIDADES */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="7" className="p-4 text-slate-800">
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
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'insertUnorderedList')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Marcadores"
                            >
                              <List size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'insertOrderedList')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Numeração"
                            >
                              <ListOrdered size={13} />
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

                          <div className="flex gap-0.5 px-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'outdent')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Diminuir Recuo"
                            >
                              <Outdent size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(relatorioEditorRef, 'indent')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Aumentar Recuo"
                            >
                              <Indent size={13} />
                            </button>
                          </div>

                          <div className="relative flex gap-1.5 px-2 items-center">
                            <button
                              type="button"
                              onClick={() => setActiveColorPicker(activeColorPicker === 'relatorio' ? null : 'relatorio')}
                              className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Cor do Texto"
                            >
                              <Palette size={13} />
                              <div className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: relatorioColor }} />
                            </button>
                            {activeColorPicker === 'relatorio' && renderColorPicker(relatorioEditorRef, 'relatorio')}
                            
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
                          onKeyUp={e => handleEditorKeyUp(e, relatorioEditorRef)}
                          className="min-h-[220px] p-4 bg-white border border-slate-200 focus:bg-slate-50/10 focus:border-slate-300 outline-none text-slate-800 text-xs font-semibold leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }}
                          placeholder="Digite aqui as atividades tratadas na reunião (Ex: RELAÇÃO DE ATIVIDADES da equipe...)"
                        />
                      </td>
                    </tr>

                    {/* SEÇÃO PAUTAS DELIBERATIVAS */}
                    <tr>
                      <th colspan="7" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        PAUTAS DELIBERATIVAS
                      </th>
                    </tr>

                    {/* COLUNAS PAUTAS DELIBERATIVAS */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-left">
                      <th className="py-1 px-1 border-r border-slate-900 text-center">Item</th>
                      <th className="py-1 px-3 border-r border-slate-900">Descrição</th>
                      <th colspan="2" className="py-1 px-3 border-r border-slate-900 text-center">Status</th>
                      <th colspan="3" className="py-1 px-3">Anotação</th>
                    </tr>

                    {/* CORPO PAUTAS DELIBERATIVAS */}
                    {pautasDeliberativas.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="7" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhuma pauta deliberada listada. Adicione itens abaixo.
                        </td>
                      </tr>
                    ) : (
                      pautasDeliberativas.map((pd, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/10">
                          <td className="py-1 px-1 border-r border-slate-900 text-center font-bold text-slate-500">
                            {pd.item}
                          </td>
                          <td className="py-1 px-3 border-r border-slate-900">
                            <input 
                              type="text"
                              value={pd.descricao}
                              placeholder="Descrição da deliberação..."
                              onChange={e => handlePautaDeliberativaChange(idx, 'descricao', e.target.value)}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 font-medium text-xs text-slate-800 py-0.5 min-w-0"
                            />
                            {pd.votos && pd.votos.length > 0 && (
                              <div className="text-[9px] text-slate-500 mt-1 font-bold print:text-black">
                                Votação: Sim: {pd.votos.filter(v => v.voto === 'Sim').length} | Não: {pd.votos.filter(v => v.voto === 'Não').length} 
                                <span className="text-[8px] font-normal ml-1 italic text-slate-400 print:text-slate-600">
                                  ({pd.votos.map(v => `${v.nome} (${v.voto})`).join(', ')})
                                </span>
                              </div>
                            )}
                          </td>
                          <td colspan="2" className="py-1 px-3 border-r border-slate-900 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <select
                                value={pd.status}
                                onChange={e => handlePautaDeliberativaChange(idx, 'status', e.target.value)}
                                disabled={!!(pd.votos && pd.votos.length > 0)}
                                className="bg-transparent border-none outline-none font-bold text-center text-slate-700 cursor-pointer text-xs disabled:opacity-75 disabled:cursor-not-allowed py-0.5 min-w-0 h-auto"
                              >
                                <option value="Tratado">Tratado</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Adiado">Adiado</option>
                                <option value="Aprovada">Aprovada</option>
                                <option value="Não aprovada">Não aprovada</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleOpenVotingModal(idx)}
                                className="p-1 text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 rounded transition-colors cursor-pointer no-print shrink-0"
                                title="Registrar votação"
                              >
                                <Users size={12} />
                              </button>
                            </div>
                          </td>
                          <td colspan="3" className="py-1 px-3">
                            <div className="flex items-center justify-between gap-1 w-full">
                              <input 
                                type="text"
                                value={pd.anotacao || ''}
                                placeholder="Notas..."
                                onChange={e => handlePautaDeliberativaChange(idx, 'anotacao', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-500 font-medium text-xs py-0.5 min-w-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePautaDeliberativaRow(idx)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer no-print"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}

                    {/* CONTROLES PAUTAS DELIBERATIVAS - Ocultados na Impressão */}
                    <tr className="bg-slate-50/50 no-print border-b border-slate-900">
                      <td colspan="7" className="p-3">
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
                      <td colspan="7" className="py-1.5 px-3 text-left uppercase text-xs tracking-wider">
                        Considerações:
                      </td>
                    </tr>

                    {/* EDITOR DE CONSIDERAÇÕES FINAIS */}
                    <tr className="bg-white border-b-2 border-slate-900">
                      <td colspan="7" className="p-4 text-slate-800">
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
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'insertUnorderedList')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Marcadores"
                            >
                              <List size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'insertOrderedList')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Numeração"
                            >
                              <ListOrdered size={13} />
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

                          <div className="flex gap-0.5 px-2">
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'outdent')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Diminuir Recuo"
                            >
                              <Outdent size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => execEditorCmd(consideracoesEditorRef, 'indent')}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                              title="Aumentar Recuo"
                            >
                              <Indent size={13} />
                            </button>
                          </div>

                          <div className="relative flex gap-1.5 px-2 items-center">
                            <button
                              type="button"
                              onClick={() => setActiveColorPicker(activeColorPicker === 'consideracoes' ? null : 'consideracoes')}
                              className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Cor do Texto"
                            >
                              <Palette size={13} />
                              <div className="w-3.5 h-3.5 rounded border border-slate-300" style={{ backgroundColor: consideracoesColor }} />
                            </button>
                            {activeColorPicker === 'consideracoes' && renderColorPicker(consideracoesEditorRef, 'consideracoes')}
                            
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
                          onKeyUp={e => handleEditorKeyUp(e, consideracoesEditorRef)}
                          className="min-h-[140px] p-4 bg-white border border-slate-200 focus:bg-slate-50/10 focus:border-slate-300 outline-none text-slate-800 text-xs font-semibold leading-relaxed"
                          style={{ whiteSpace: 'pre-wrap' }}
                          placeholder="Digite aqui as considerações finais e observações..."
                        />
                      </td>
                    </tr>

                    {/* SEÇÃO AÇÕES */}
                    <tr>
                      <td colspan="7" className="p-0 border-none">
                        {/* Fecha a tabela 1 */}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* TABELA 2: AÇÕES E PRÓXIMA REUNIÃO (COM DESIGN E COLGROUP INDEPENDENTES) */}
                <table className="w-full border-x-2 border-b-2 border-slate-900 border-collapse text-xs select-text table-fixed mt-0 border-t-0">
                  <colgroup>
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '55%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <tbody>
                    {/* CABEÇALHO AÇÕES */}
                    <tr>
                      <th colspan="5" className="bg-[#1E4663] text-white font-black text-center text-xs py-1.5 border-b border-slate-900 tracking-wider uppercase">
                        AÇÕES:
                      </th>
                    </tr>

                    {/* COLUNAS AÇÕES */}
                    <tr className="bg-[#DCE6F1] font-black text-slate-800 border-b border-slate-900 text-center">
                      <th className="py-1 px-1 border-r border-slate-900 text-center whitespace-nowrap select-none">Item</th>
                      <th className="py-1 px-3 border-r border-slate-900 text-left">Descrição</th>
                      <th className="py-1 px-3 border-r border-slate-900 text-center">Resp.</th>
                      <th className="py-1 px-3 border-r border-slate-900">Prazo</th>
                      <th className="py-1 px-3 text-center">Status</th>
                    </tr>

                    {/* CORPO AÇÕES */}
                    {acoes.length === 0 ? (
                      <tr className="bg-white">
                        <td colspan="5" className="py-4 text-center text-slate-400 font-medium bg-slate-50/20 italic border-b border-slate-900">
                          Nenhuma ação cadastrada. Adicione prazos de execução.
                        </td>
                      </tr>
                    ) : (
                      acoes.map((a, idx) => {
                        const respUser = a.responsavelId ? systemUsers.find(u => u.id === a.responsavelId) : null;
                        const avatarUrl = respUser?.avatarUrl;
                        const nome = a.responsavelNome || respUser?.nome || 'Selecionar';
                        return (
                          <tr key={idx} className="bg-white hover:bg-slate-50/10">
                            <td className="py-1 px-1 border-r border-slate-900 text-center font-bold text-slate-500 whitespace-nowrap">
                              {a.item || (idx + 1)}
                            </td>
                            <td className="py-1 px-3 border-r border-slate-900">
                              <div className="flex items-start justify-between gap-2">
                                <textarea
                                  value={a.descricao}
                                  placeholder="Descreva a ação a ser executada..."
                                  onChange={e => {
                                    handleAcaoFieldChange(idx, 'descricao', e.target.value);
                                  }}
                                  rows={1}
                                  ref={el => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = `${el.scrollHeight}px`;
                                    }
                                  }}
                                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 font-medium resize-none overflow-hidden py-0.5 leading-normal text-slate-800 text-xs min-h-0"
                                  style={{ height: 'auto' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleOpenCommentsModal(idx)}
                                  className="flex items-center gap-1 p-1 rounded transition-colors text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 no-print cursor-pointer shrink-0 mt-0.5"
                                  title={a.id ? "Comentários da ação" : "Salve o documento para habilitar comentários"}
                                  disabled={!a.id}
                                  style={{ opacity: a.id ? 1 : 0.4 }}
                                >
                                  <MessageSquare size={14} />
                                  {a.comentarios && a.comentarios.length > 0 && (
                                    <span className="bg-[#1B4D3E] text-white text-[9px] px-1 rounded-full font-bold">
                                      {a.comentarios.length}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-1 px-1 border-r border-slate-900 text-center">
                              <div className="flex items-center justify-center">
                                {/* Botão do Avatar - Visível apenas na tela */}
                                <button
                                  type="button"
                                  onClick={e => handleOpenAcaoResponsavelSelect(e, idx)}
                                  className="bg-transparent border-none outline-none flex items-center justify-center cursor-pointer no-print focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/20 rounded-full"
                                  title={nome}
                                >
                                  {avatarUrl ? (
                                    <img 
                                      src={avatarUrl} 
                                      alt={nome} 
                                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                      title={nome}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-[#1E4663]/10 flex items-center justify-center text-[10px] font-black text-[#1E4663] uppercase border border-slate-200" title={nome}>
                                      {nome !== 'Não identificado' && nome !== 'Selecionar' 
                                        ? nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2) 
                                        : <User size={12} />}
                                    </div>
                                  )}
                                </button>

                                {/* Nome do Responsável - Visível apenas na Impressão/PDF */}
                                <span className="hidden print:inline-block font-semibold text-slate-800 text-[11px] leading-tight ml-2">
                                  {nome}
                                </span>
                              </div>
                            </td>
                            <td className="py-1 px-1 border-r border-slate-900 text-center">
                              <input 
                                type="date"
                                value={a.dataLimite}
                                onChange={e => handleAcaoFieldChange(idx, 'dataLimite', e.target.value)}
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-center text-xs py-0.5 h-6 min-w-0 font-medium text-slate-800"
                              />
                            </td>
                            <td className="py-1 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Toggle Conclusão */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (a.id) {
                                      handleToggleAcaoClick(a.id, !a.concluida);
                                    } else {
                                      handleAcaoFieldChange(idx, 'concluida', !a.concluida);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-[#1B4D3E] transition-colors cursor-pointer no-print shrink-0"
                                  title={a.concluida ? "Marcar como pendente" : "Marcar como concluída"}
                                >
                                  {a.concluida ? (
                                    <CheckSquare size={15} className="text-green-600" />
                                  ) : (
                                    <Square size={15} />
                                  )}
                                </button>

                                {/* Status Badge */}
                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                  {/* Status Badge inline style logic */}
                                  {(() => {
                                    const statusText = getAcaoStatusText(a);
                                    let colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
                                    if (a.concluida) {
                                      colorClass = 'bg-green-100 text-green-700 border-green-200';
                                    } else if (statusText === 'ATRASADA') {
                                      colorClass = 'bg-red-100 text-red-700 border-red-200';
                                    }
                                    return (
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${colorClass}`}>
                                        {statusText}
                                      </span>
                                    );
                                  })()}
                                </span>

                                {/* Delete Action Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAcaoRow(idx)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer no-print shrink-0"
                                  title="Excluir Ação"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
                      <td colspan="3" className="p-2.5 border-r border-slate-900">
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
                      <td colspan="2" className="p-2.5">
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

      {/* MODAL DE FINALIZAÇÃO COM JUSTIFICATIVA PRECOCE */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 transform scale-100 transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Finalizar Ata com Pendências</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                  Existem ações nesta ata que ainda não foram concluídas.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Justificativa para Finalização Precoce
              </label>
              <textarea
                value={justificativaInput}
                onChange={e => setJustificativaInput(e.target.value)}
                placeholder="Explique o motivo de finalizar esta ata mesmo com ações em aberto..."
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E]/40 focus:bg-white text-slate-700 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalize}
                disabled={!justificativaInput.trim()}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
              >
                Confirmar Finalização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AÇÕES PENDENTES GERAL */}
      {pendingActionsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ações Pendentes do Time</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                    Acompanhamento de pendências e prazos de todas as atas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingActionsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
              {loadingPendingActions ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-[#1B4D3E]/30 border-t-[#1B4D3E] rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carregando ações...</p>
                </div>
              ) : detailedPendingActions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
                  <CheckCircle2 size={40} className="text-emerald-500 opacity-60" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Tudo em dia!</p>
                  <p className="text-xs text-slate-400">Não existem ações pendentes cadastradas no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailedPendingActions.map((acao) => {
                    const isOverdue = getAcaoStatusText({ concluida: false, dataLimite: acao.dataLimite, descricao: acao.descricao, responsavelId: '' }) === 'ATRASADA';
                    const formattedDate = acao.dataLimite ? new Date(acao.dataLimite + 'T12:00:00').toLocaleDateString('pt-BR') : '';

                    return (
                      <div 
                        key={acao.id} 
                        className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs hover:shadow-md transition-all space-y-4 text-left"
                      >
                        {/* Upper Section */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-[#1B4D3E]/10 text-[#1B4D3E] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                {acao.categoria}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                Ata: {acao.ataTitulo}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                                {isOverdue ? 'Atrasada' : 'No Prazo'}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-700 leading-relaxed">
                              {acao.descricao}
                            </h4>
                          </div>

                          <div className="flex flex-col md:items-end gap-1.5 shrink-0 text-left md:text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável:</span>
                              <span className="text-[10px] font-black text-slate-700 uppercase">{acao.responsavelNome}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prazo:</span>
                              <span className={`text-[10px] font-black ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Comments section if comments exist */}
                        {acao.comentarios && acao.comentarios.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 space-y-2.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              Histórico de Comentários ({acao.comentarios.length})
                            </span>
                            <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                              {acao.comentarios.map((comment: any, cidx: number) => (
                                <div key={comment.id || cidx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                  <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-slate-700">{comment.autor}</span>
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(comment.data).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 whitespace-pre-wrap">{comment.texto}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPendingActionsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMENTÁRIOS DA AÇÃO */}
      {commentModalOpen && activeAcao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#1B4D3E]" /> Comentários da Ação
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter line-clamp-2">
                  Ação: {activeAcao.descricao}
                </p>
              </div>
              <button
                onClick={() => setCommentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List of Comments */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px] min-h-[150px] bg-slate-50">
              {!activeAcao.comentarios || activeAcao.comentarios.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-2 text-slate-400">
                  <MessageSquare size={32} className="opacity-30" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum comentário cadastrado</p>
                  <p className="text-[9px]">Seja o primeiro a deixar considerações para esta ação.</p>
                </div>
              ) : (
                activeAcao.comentarios.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 items-start bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
                    {comment.autorAvatar ? (
                      <img
                        src={comment.autorAvatar}
                        alt={comment.autor}
                        className="w-7 h-7 rounded-full shrink-0 border border-slate-100"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-[#1B4D3E]/10 text-[#1B4D3E] font-black text-[10px] rounded-full flex items-center justify-center uppercase shrink-0 border border-[#1B4D3E]/20">
                        {comment.autor ? comment.autor.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-slate-800">{comment.autor}</span>
                        <span className="text-[8px] font-bold text-slate-400 font-medium">
                          {new Date(comment.data).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">{comment.texto}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-slate-100 bg-white space-y-3">
              <textarea
                value={novoComentario}
                onChange={e => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário ou consideração sobre esta ação..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#1B4D3E] focus:ring-0 outline-none resize-none min-h-[60px]"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!novoComentario.trim()}
                  className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VOTAÇÃO DA PAUTA DELIBERATIVA */}
      {votingModalOpen && activeDeliberativaIndex !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-[#1B4D3E]" /> Votação de Pauta Deliberativa
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter line-clamp-2">
                  Item {pautasDeliberativas[activeDeliberativaIndex]?.item}: {pautasDeliberativas[activeDeliberativaIndex]?.descricao || 'Sem descrição'}
                </p>
              </div>
              <button
                onClick={() => setVotingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content / Voters list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px] min-h-[150px] bg-slate-50">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Lista de Votantes
                </label>
                
                {currentVotos.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold italic">
                    Nenhum votante adicionado. Adicione votantes abaixo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentVotos.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                        <span className="text-xs font-bold text-slate-700">{v.nome}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentVotos(prev => prev.map((item, i) => i === idx ? { ...item, voto: 'Sim' } : item));
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                              v.voto === 'Sim'
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentVotos(prev => prev.map((item, i) => i === idx ? { ...item, voto: 'Não' } : item));
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                              v.voto === 'Não'
                                ? 'bg-red-500 text-white border-red-600'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            Não
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentVotos(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer ml-1"
                            title="Remover votante"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add voters form */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Adicionar Votante
                </label>
                <div className="flex flex-col gap-2">
                  <select
                    value=""
                    onChange={e => {
                      const name = e.target.value;
                      if (name && !currentVotos.some(cv => cv.nome === name)) {
                        setCurrentVotos(prev => [...prev, { nome: name, voto: 'Sim' }]);
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E] text-slate-700 cursor-pointer"
                  >
                    <option value="">Selecione um participante presente...</option>
                    {participantes
                      .filter(p => p.nome.trim() && !currentVotos.some(cv => cv.nome === p.nome.trim()))
                      .map((p, i) => (
                        <option key={i} value={p.nome.trim()}>{p.nome.trim()}</option>
                      ))
                    }
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ou digite outro nome e pressione Enter..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          const name = target.value.trim();
                          if (name) {
                            if (!currentVotos.some(cv => cv.nome === name)) {
                              setCurrentVotos(prev => [...prev, { nome: name, voto: 'Sim' }]);
                            }
                            target.value = '';
                          }
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1B4D3E] text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Placar parcial */}
              <div className="bg-[#DCE6F1]/50 border border-[#DCE6F1] rounded-xl p-3 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Placar Parcial:</span>
                <div className="flex gap-4">
                  <span className="text-green-700 font-black">Sim: {currentVotos.filter(v => v.voto === 'Sim').length}</span>
                  <span className="text-red-700 font-black">Não: {currentVotos.filter(v => v.voto === 'Não').length}</span>
                  <span className="text-slate-500 font-black">Resultado: {
                    currentVotos.length === 0
                      ? 'Nenhum voto'
                      : currentVotos.filter(v => v.voto === 'Sim').length > currentVotos.filter(v => v.voto === 'Não').length
                        ? 'Aprovada'
                        : 'Não aprovada'
                  }</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setVotingModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmVoting}
                disabled={currentVotos.length === 0}
                className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
              >
                Confirmar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DROPDOWN DE MENÇÕES @ */}
      {showMentionDropdown && mentionCandidates.length > 0 && (
        <div 
          className="fixed bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] overflow-hidden max-h-[200px] w-64 divide-y divide-slate-100 no-print"
          style={{ top: `${mentionCoords.top}px`, left: `${mentionCoords.left}px` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-slate-50 p-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">Mencionar Participante</div>
          <div className="overflow-y-auto max-h-[160px] divide-y divide-slate-100">
            {mentionCandidates.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectMention(p.nome)}
                className="w-full text-left px-3.5 py-2 hover:bg-[#1B4D3E]/10 hover:text-[#1B4D3E] text-xs font-bold text-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 bg-[#1B4D3E]/10 text-[#1B4D3E] font-black text-[9px] rounded-full flex items-center justify-center uppercase shrink-0">
                  {p.nome ? p.nome.split(' ').map((n) => n ? n[0] : '').slice(0, 2).join('').toUpperCase() : '?'}
                </div>
                <span className="truncate font-semibold">{p.nome || 'Convidado Sem Nome'}</span>
              </button>
            ))}
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
