'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Truck, ClipboardList, Calendar, Printer, 
  LayoutGrid, Kanban, Users, ShieldCheck, Check, 
  User, FileImage, ChevronRight, ChevronUp, ChevronDown, CheckCircle,
  DollarSign, Navigation, MapPin, History, Shield, UserCheck, Car, ShieldAlert, XCircle, BarChart3
} from 'lucide-react';

import { 
  getEntregas, createEntrega, updateEntrega, deleteEntrega,
  otimizarRotaEntregador, reordenarEntregasManual 
} from './actions';
import { getClientes, createCliente } from '@/app/clientes/actions';
import { getAllUsers } from '@/app/leads/actions';
import { getLoggedUser } from '@/app/propostas/actions';
import { formatDateTimeBrasilia, formatTimeBrasilia } from '@/lib/timezone';

type ViewMode = 'lista' | 'kanban';

export default function GestaoEntregasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  
  // Data State
  const [entregas, setEntregas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Loading & UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingEntregaId, setUpdatingEntregaId] = useState<string | null>(null);
  const [modalTrackEntrega, setModalTrackEntrega] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals & Forms State
  const [activeTab, setActiveTab] = useState<'gestao' | 'kpis'>('gestao');
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [modalAssignEntregadorOpen, setModalAssignEntregadorOpen] = useState(false);
  const [modalManageRoutesOpen, setModalManageRoutesOpen] = useState(false);
  const [modalQuickClienteOpen, setModalQuickClienteOpen] = useState(false);
  const [modalMetricsOpen, setModalMetricsOpen] = useState<'programadas' | 'realizadas' | 'atrasadas' | 'valores' | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'details' | 'history'>('details');
  
  // Selection and Assignments
  const [entregaToAssign, setEntregaToAssign] = useState<any>(null);
  const [selectedEntregadorForAssign, setSelectedEntregadorForAssign] = useState('');
  const [targetStatusForAssign, setTargetStatusForAssign] = useState<string>('PROGRAMADO');
  const [dataProgramadaForAssign, setDataProgramadaForAssign] = useState('');
  const [selectedRouteEntregador, setSelectedRouteEntregador] = useState('');
  const [routeSaving, setRouteSaving] = useState(false);

  // Alertas e Confirmações Personalizados
  const [customAlert, setCustomAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [customConfirm, setCustomConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Forms Data
  const [entregaForm, setEntregaForm] = useState({
    id: '',
    numeroNf: '',
    valor: '',
    clientId: '',
    observacao: '',
    status: 'BACKLOG',
    entregadorResponsavel: '',
    entregadorEmail: '',
    dataProgramada: ''
  });

  const [quickClienteForm, setQuickClienteForm] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    whatsapp: '',
    contato: '',
    segmento: ''
  });

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadEntregasSilently();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!modalTrackEntrega) return;
    
    const interval = setInterval(async () => {
      await loadEntregasSilently();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [modalTrackEntrega]);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({ open: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ open: true, title, message, onConfirm });
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [entregasRes, clientesRes, usersRes, currentUserRes] = await Promise.all([
        getEntregas(),
        getClientes(),
        getAllUsers(),
        getLoggedUser()
      ]);

      if (entregasRes.success && entregasRes.entregas) {
        setEntregas(entregasRes.entregas);
      }
      if (Array.isArray(clientesRes)) {
        setClientes(clientesRes);
      }
      if (usersRes.success && usersRes.users) {
        setUsuarios(usersRes.users);
      }
      if (currentUserRes) {
        setCurrentUser(currentUserRes);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de entregas:", err);
      showAlert('Erro ao Carregar', 'Ocorreu um erro ao buscar os dados das entregas. Tente recarregar a página.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadEntregasSilently = async () => {
    try {
      const res = await getEntregas();
      if (res.success && res.entregas) {
        setEntregas(res.entregas);
      }
    } catch (err) {
      console.error("Erro ao atualizar entregas em background:", err);
    }
  };

  const handleCreateOrUpdateEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entregaForm.clientId) {
      showAlert('Campo Obrigatório', 'Selecione o cliente da entrega.', 'warning');
      return;
    }
    if (!entregaForm.numeroNf) {
      showAlert('Campo Obrigatório', 'Preencha o número da Nota Fiscal.', 'warning');
      return;
    }
    if (!entregaForm.valor || isNaN(Number(entregaForm.valor))) {
      showAlert('Valor Inválido', 'Insira um valor numérico válido para a entrega.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (entregaForm.id) {
        // Update
        const payload: any = {
          clientId: entregaForm.clientId,
          numeroNf: entregaForm.numeroNf,
          valor: Number(entregaForm.valor),
          observacao: entregaForm.observacao,
          status: entregaForm.status
        };

        if (entregaForm.status === 'PROGRAMADO') {
          payload.dataProgramada = entregaForm.dataProgramada ? new Date(entregaForm.dataProgramada).toISOString() : null;
          payload.entregadorResponsavel = entregaForm.entregadorResponsavel || null;
          payload.entregadorEmail = entregaForm.entregadorEmail || null;
        }

        const res = await updateEntrega(entregaForm.id, payload);
        if (res.success) {
          setModalEntregaOpen(false);
          showAlert('Sucesso', 'Entrega atualizada com sucesso!', 'success');
          loadData(true);
        } else {
          showAlert('Erro ao Salvar', res.error || 'Não foi possível atualizar a entrega', 'error');
        }
      } else {
        // Create
        const res = await createEntrega({
          clientId: entregaForm.clientId,
          numeroNf: entregaForm.numeroNf,
          valor: Number(entregaForm.valor),
          observacao: entregaForm.observacao
        });
        if (res.success) {
          setModalEntregaOpen(false);
          showAlert('Sucesso', 'Entrega registrada e adicionada ao Backlog!', 'success');
          loadData(true);
        } else {
          showAlert('Erro ao Criar', res.error || 'Não foi possível registrar a entrega', 'error');
        }
      }
    } catch (err: any) {
      showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClienteForm.nomeFantasia.trim()) {
      showAlert('Campo Obrigatório', 'Insira o nome fantasia do cliente.', 'warning');
      return;
    }
    if (!quickClienteForm.endereco.trim()) {
      showAlert('Campo Obrigatório', 'O endereço é obrigatório para o cálculo inteligente de rotas.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await createCliente(quickClienteForm);
      if (res.success && res.data) {
        // Adiciona localmente na lista e seleciona no select de Nova Entrega
        const novo = res.data;
        setClientes(prev => [...prev, novo].sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)));
        setEntregaForm(prev => ({ ...prev, clientId: novo.id }));
        setModalQuickClienteOpen(false);
        // Reset form
        setQuickClienteForm({
          nomeFantasia: '',
          razaoSocial: '',
          cnpj: '',
          endereco: '',
          whatsapp: '',
          contato: '',
          segmento: ''
        });
        showAlert('Cliente Cadastrado', `Cliente ${novo.nomeFantasia} cadastrado com sucesso!`, 'success');
      } else {
        showAlert('Erro', res.error || 'Erro ao cadastrar cliente rápido.', 'error');
      }
    } catch (err: any) {
      showAlert('Erro', err.message || 'Erro ao realizar cadastro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntrega = async (id: string) => {
    showConfirm(
      'Confirmar Exclusão',
      'Tem certeza de que deseja excluir esta entrega permanentemente do sistema?',
      async () => {
        setSaving(true);
        try {
          const res = await deleteEntrega(id);
          if (res.success) {
            setModalEntregaOpen(false);
            showAlert('Excluído', 'A entrega foi removida com sucesso.', 'success');
            loadData(true);
          } else {
            showAlert('Erro ao Excluir', res.error || 'Não foi possível remover a entrega', 'error');
          }
        } catch (err: any) {
          showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
        } finally {
          setSaving(false);
        }
      }
    );
  };

  const handleUpdateEntregaStatus = async (entregaId: string, newStatus: string) => {
    const ent = entregas.find(e => e.id === entregaId);
    
    // Se for aprovação direta no Kanban
    if (newStatus === 'ENTREGUE' && ent?.status !== 'VALIDACAO') {
      handleConcludeEntregaDirectly(entregaId);
      return;
    }

    // Se transicionar para Programado, obriga a selecionar Entregador
    if (newStatus === 'PROGRAMADO' || newStatus === 'EM_DESLOCAMENTO' || newStatus === 'ENTREGA') {
      const hasEntregador = ent?.entregadorEmail && ent.entregadorEmail.trim() !== '' && ent?.entregadorResponsavel && ent.entregadorResponsavel.trim() !== '';
      if (!hasEntregador) {
        setEntregaToAssign(ent);
        setSelectedEntregadorForAssign('');
        setTargetStatusForAssign(newStatus);
        
        // Define data programada para a atribuição (timezone local para input datetime-local)
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
        setDataProgramadaForAssign(ent.dataProgramada ? new Date(ent.dataProgramada).toISOString().slice(0, 16) : localISOTime);
        
        setModalAssignEntregadorOpen(true);
        return;
      }
    }

    setUpdatingEntregaId(entregaId);
    // Atualização otimista
    setEntregas(prev => prev.map(e => e.id === entregaId ? { ...e, status: newStatus } : e));
    if (entregaForm.id === entregaId) {
      setEntregaForm(prev => ({ ...prev, status: newStatus }));
    }

    try {
      const res = await updateEntrega(entregaId, { status: newStatus });
      if (res.success) {
        loadData(true);
      } else {
        loadData(true);
        showAlert('Erro ao Mudar Status', res.error || 'Não foi possível atualizar o status', 'error');
      }
    } catch (err) {
      loadData(true);
    } finally {
      setUpdatingEntregaId(null);
    }
  };

  const handleConcludeEntregaDirectly = (id: string) => {
    showConfirm(
      'Validar & Concluir Entrega',
      'Confirma que esta entrega foi realizada com sucesso no cliente? O status será alterado para Entregue.',
      async () => {
        setUpdatingEntregaId(id);
        try {
          const res = await updateEntrega(id, { status: 'ENTREGUE' });
          if (res.success) {
            showAlert('Sucesso', 'Entrega validada e concluída!', 'success');
            loadData(true);
            if (entregaForm.id === id) {
              setEntregaForm(prev => ({ ...prev, status: 'ENTREGUE' }));
            }
          } else {
            showAlert('Erro', res.error || 'Não foi possível concluir a entrega.', 'error');
          }
        } catch (err: any) {
          showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
        } finally {
          setUpdatingEntregaId(null);
        }
      }
    );
  };

  const handleConfirmAssignEntregador = async () => {
    if (!selectedEntregadorForAssign) {
      showAlert('Atenção', 'Selecione um entregador da equipe.', 'warning');
      return;
    }
    const entregador = usuarios.find(u => u.email === selectedEntregadorForAssign);
    if (!entregador) return;

    setSaving(true);
    try {
      const payload: any = {
        status: targetStatusForAssign,
        entregadorEmail: entregador.email,
        entregadorResponsavel: entregador.nome,
        dataProgramada: dataProgramadaForAssign ? new Date(dataProgramadaForAssign).toISOString() : new Date().toISOString()
      };

      const res = await updateEntrega(entregaToAssign.id, payload);
      if (res.success) {
        setModalAssignEntregadorOpen(false);
        showAlert('Atribuído com Sucesso', `Entrega programada para o entregador ${entregador.nome}`, 'success');
        loadData(true);
        if (entregaForm.id === entregaToAssign.id) {
          setEntregaForm(prev => ({
            ...prev,
            status: targetStatusForAssign,
            entregadorEmail: entregador.email,
            entregadorResponsavel: entregador.nome,
            dataProgramada: dataProgramadaForAssign ? dataProgramadaForAssign : new Date().toISOString().substring(0, 16)
          }));
        }
      } else {
        showAlert('Erro ao Salvar', res.error || 'Não foi possível atribuir a entrega', 'error');
      }
    } catch (err: any) {
      showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecuseCancel = async (id: string) => {
    const ent = entregas.find(e => e.id === id);
    if (!ent) return;

    const motivo = prompt('Informe a justificativa para recusar o cancelamento (obrigatório para o entregador visualizar):');
    if (motivo === null) return;
    if (!motivo.trim()) {
      showAlert('Justificativa Obrigatória', 'Você precisa informar um motivo para recusar o cancelamento.', 'warning');
      return;
    }

    const observacaoEntregaRecusa = `Motivo da recusa do cancelamento: ${motivo.trim()}`;
    let targetStatus = 'PROGRAMADO'; // fallback seguro

    if (ent.historico) {
      try {
        const history = JSON.parse(ent.historico);
        if (Array.isArray(history)) {
          for (let i = history.length - 1; i >= 0; i--) {
            const item = history[i];
            if (item && typeof item.acao === 'string') {
              const match = item.acao.match(/Status alterado de (\w+) para VALIDACAO/);
              if (match && match[1]) {
                const statusCandidate = match[1];
                if (['PROGRAMADO', 'EM_DESLOCAMENTO', 'ENTREGA'].includes(statusCandidate)) {
                  targetStatus = statusCandidate;
                  break;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro ao ler histórico:", e);
      }
    }

    setUpdatingEntregaId(id);
    setEntregas(prev => prev.map(e => e.id === id ? { ...e, status: targetStatus, observacaoEntrega: observacaoEntregaRecusa } : e));
    if (entregaForm.id === id) {
      setEntregaForm(prev => ({ ...prev, status: targetStatus, observacaoEntrega: observacaoEntregaRecusa }));
    }

    try {
      const res = await updateEntrega(id, { 
        status: targetStatus, 
        observacaoEntrega: observacaoEntregaRecusa 
      });
      if (res.success) {
        showAlert('Cancelamento Recusado', `A solicitação foi recusada. A entrega retornou para o status ${targetStatus}.`, 'success');
        loadData(true);
      } else {
        loadData(true);
        showAlert('Erro', res.error || 'Não foi possível recusar o cancelamento.', 'error');
      }
    } catch (err: any) {
      loadData(true);
    } finally {
      setUpdatingEntregaId(null);
    }
  };

  const handleConfirmCancel = async (id: string) => {
    showConfirm(
      'Confirmar Cancelamento',
      'Confirma o cancelamento definitivo desta entrega? O status será alterado para Cancelada.',
      async () => {
        setUpdatingEntregaId(id);
        try {
          const res = await updateEntrega(id, { status: 'CANCELADA' });
          if (res.success) {
            showAlert('Cancelada', 'A entrega foi movida para Cancelada.', 'success');
            loadData(true);
            if (entregaForm.id === id) {
              setEntregaForm(prev => ({ ...prev, status: 'CANCELADA' }));
            }
          } else {
            showAlert('Erro', res.error || 'Não foi possível cancelar a entrega.', 'error');
          }
        } catch (err: any) {
          showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
        } finally {
          setUpdatingEntregaId(null);
        }
      }
    );
  };

  const handleReassignEntregador = (ent: any) => {
    setEntregaToAssign(ent);
    setSelectedEntregadorForAssign(ent.entregadorEmail || '');
    setTargetStatusForAssign(ent.status);
    
    // Define data programada para a atribuição
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    setDataProgramadaForAssign(ent.dataProgramada ? new Date(ent.dataProgramada).toISOString().slice(0, 16) : localISOTime);
    
    setModalAssignEntregadorOpen(true);
  };

  const openEntregaModal = (ent?: any) => {
    setActiveDetailsTab('details');
    if (ent) {
      setEntregaForm({
        id: ent.id,
        numeroNf: ent.numeroNf,
        valor: String(ent.valor),
        clientId: ent.clientId,
        observacao: ent.observacao || '',
        status: ent.status,
        entregadorResponsavel: ent.entregadorResponsavel || '',
        entregadorEmail: ent.entregadorEmail || '',
        dataProgramada: ent.dataProgramada ? new Date(ent.dataProgramada).toISOString().substring(0, 16) : ''
      });
    } else {
      setEntregaForm({
        id: '',
        numeroNf: '',
        valor: '',
        clientId: '',
        observacao: '',
        status: 'BACKLOG',
        entregadorResponsavel: '',
        entregadorEmail: '',
        dataProgramada: ''
      });
    }
    setModalEntregaOpen(true);
  };

  const handleOpenRouteMap = (list: any[]) => {
    const activeItems = list.filter(e => e.client && e.client.endereco);
    if (activeItems.length === 0) return;
    
    let url = "";
    if (activeItems.length === 1) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeItems[0].client.endereco)}`;
    } else {
      const origin = encodeURIComponent(activeItems[0].client.endereco);
      const destination = encodeURIComponent(activeItems[activeItems.length - 1].client.endereco);
      const waypoints = activeItems.slice(1, activeItems.length - 1)
        .map(e => encodeURIComponent(e.client.endereco))
        .join('|');
      
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      if (waypoints) {
        url += `&waypoints=${waypoints}`;
      }
    }
    
    window.open(url, '_blank');
  };

  // Roteamento
  const handleOptimizeRoute = async () => {
    if (!selectedRouteEntregador) {
      showAlert('Atenção', 'Selecione um entregador para otimizar.', 'warning');
      return;
    }

    setRouteSaving(true);
    try {
      const res = await otimizarRotaEntregador(selectedRouteEntregador);
      if (res.success) {
        showAlert('Rota Otimizada', 'O menor trajeto foi calculado com inteligência OSRM Trip TSP!', 'success');
        loadData(true);
      } else {
        showAlert('Erro ao Otimizar', res.error || 'Não foi possível otimizar a rota.', 'error');
      }
    } catch (err: any) {
      showAlert('Erro', err.message || 'Erro de comunicação.', 'error');
    } finally {
      setRouteSaving(false);
    }
  };

  const handleMoveRouteOrder = async (entId: string, direction: 'up' | 'down', sortedList: any[]) => {
    const idx = sortedList.findIndex(e => e.id === entId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sortedList.length - 1) return;

    const newList = [...sortedList];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newList[idx];
    newList[idx] = newList[targetIdx];
    newList[targetIdx] = temp;

    setRouteSaving(true);
    try {
      const ids = newList.map(e => e.id);
      const res = await reordenarEntregasManual(selectedRouteEntregador, ids);
      if (res.success) {
        loadData(true);
      } else {
        showAlert('Erro', res.error || 'Erro ao ordenar manualmente.', 'error');
      }
    } catch (err: any) {
      showAlert('Erro', err.message || 'Erro ao salvar reordenação.', 'error');
    } finally {
      setRouteSaving(false);
    }
  };

  const openRouteManagerModal = () => {
    setSelectedRouteEntregador('');
    setModalManageRoutesOpen(true);
  };

  // Filters logic
  const filteredEntregas = entregas.filter(ent => {
    const matchSearch = 
      ent.numeroNf.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ent.client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ent.entregadorResponsavel && ent.entregadorResponsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ent.observacao && ent.observacao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCliente = filterCliente ? ent.clientId === filterCliente : true;
    const matchStatus = filterStatus ? ent.status === filterStatus : true;

    return matchSearch && matchCliente && matchStatus;
  });

  // Entregadores list (todos os usuários têm acesso a entregas)
  const entregadorList = usuarios;

  // Métricas do Dia
  const getMetrics = () => {
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let totalDia = 0;
    let realizadasDia = 0;
    let valorDia = 0;
    let atrasadasTotal = 0;

    entregas.forEach((ent: any) => {
      if (!ent.dataProgramada) return;
      const progDate = new Date(ent.dataProgramada);
      const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());

      const isToday = progZero.getTime() === todayZero.getTime();
      const isPast = progZero.getTime() < todayZero.getTime();
      const isFinished = ent.status === 'ENTREGUE' || ent.status === 'VALIDACAO';

      if (isToday) {
        totalDia++;
        valorDia += ent.valor || 0;
        if (isFinished) {
          realizadasDia++;
        }
      }

      if (isPast && !isFinished && ent.status !== 'CANCELADA') {
        atrasadasTotal++;
      }
    });

    return {
      totalDia,
      realizadasDia,
      valorDia,
      atrasadasTotal
    };
  };

  const metrics = getMetrics();

  const getModalMetricsList = () => {
    if (!modalMetricsOpen) return [];
    const today = new Date();
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return entregas.filter((ent: any) => {
      if (!ent.dataProgramada) return false;
      const progDate = new Date(ent.dataProgramada);
      const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());

      const isToday = progZero.getTime() === todayZero.getTime();
      const isPast = progZero.getTime() < todayZero.getTime();
      const isFinished = ent.status === 'ENTREGUE' || ent.status === 'VALIDACAO';

      if (modalMetricsOpen === 'programadas' || modalMetricsOpen === 'valores') {
        return isToday;
      }
      if (modalMetricsOpen === 'realizadas') {
        return isToday && isFinished;
      }
      if (modalMetricsOpen === 'atrasadas') {
        return isPast && !isFinished && ent.status !== 'CANCELADA';
      }
      return false;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Cálculos do Painel de KPIs & Insights
  // ─────────────────────────────────────────────────────────────────────────
  const getKpiData = () => {
    const activeDeliveries = entregas.filter(e => e.status !== 'CANCELADA');
    
    // 1. Total de valores de entregas concluídas
    const completedDeliveries = entregas.filter(e => e.status === 'ENTREGUE' || e.status === 'VALIDACAO');
    const totalValoresEntregues = completedDeliveries.reduce((sum, e) => sum + (e.valor || 0), 0);
    const totalValoresGeral = activeDeliveries.reduce((sum, e) => sum + (e.valor || 0), 0);
    
    // 2. Ticket médio de entregas
    const ticketMedio = activeDeliveries.length > 0 ? totalValoresGeral / activeDeliveries.length : 0;
    
    // 3. Média de entregas programadas por dia
    const daysMap = new Map();
    entregas.forEach(e => {
      if (e.dataProgramada && e.status !== 'CANCELADA') {
        const dateKey = new Date(e.dataProgramada).toDateString();
        daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + 1);
      }
    });
    const distinctDaysCount = daysMap.size || 1;
    const mediaEntregasDia = activeDeliveries.length / distinctDaysCount;
    
    // 4. Entregas atrasadas
    const atrasadasCount = metrics.atrasadasTotal;
    
    // 5. Tempo médio de entrega
    const deliveriesWithTime = completedDeliveries.filter(e => e.tempoRealizadoRota !== null && e.tempoRealizadoRota !== undefined);
    const totalTimeRoute = deliveriesWithTime.reduce((sum, e) => sum + e.tempoRealizadoRota, 0);
    const tempoMedioEntrega = deliveriesWithTime.length > 0 ? totalTimeRoute / deliveriesWithTime.length : 0;
    
    // 6. Percentual de horas do entregador (Horas em rotas / 176 horas)
    // E KM rodados em entregas (distanciaRealizadaRota)
    const entregadoresStats: Record<string, { horas: number; km: number; totalEntregas: number; email: string }> = {};
    
    completedDeliveries.forEach(e => {
      if (e.entregadorResponsavel) {
        const name = e.entregadorResponsavel;
        if (!entregadoresStats[name]) {
          entregadoresStats[name] = { horas: 0, km: 0, totalEntregas: 0, email: e.entregadorEmail || '' };
        }
        entregadoresStats[name].totalEntregas += 1;
        if (e.tempoRealizadoRota !== null) {
          entregadoresStats[name].horas += (e.tempoRealizadoRota / 60);
        }
        if (e.distanciaRealizadaRota !== null) {
          entregadoresStats[name].km += e.distanciaRealizadaRota;
        }
      }
    });

    const totalKmRodados = completedDeliveries.reduce((sum, e) => sum + (e.distanciaRealizadaRota || 0), 0);
    
    // 7. SLA de entregas (entregas no prazo / entregas total programadas)
    const totalProgramadasSla = entregas.filter(e => e.dataProgramada && e.status !== 'CANCELADA').length;
    const entregasAtrasadasParaSla = entregas.filter(e => {
      if (!e.dataProgramada || e.status === 'CANCELADA') return false;
      const progDate = new Date(e.dataProgramada);
      const today = new Date();
      const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
      const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = progZero.getTime() < todayZero.getTime();
      const isFinished = e.status === 'ENTREGUE' || e.status === 'VALIDACAO';
      return isPast && !isFinished;
    }).length;
    
    const slaPercentual = totalProgramadasSla > 0 
      ? Math.max(0, Math.min(100, ((totalProgramadasSla - entregasAtrasadasParaSla) / totalProgramadasSla) * 100)) 
      : 100;
      
    const getCityFromAddress = (address: string) => {
      if (!address) return 'NÃO INFORMADO';
      
      let clean = address.trim().toUpperCase();
      // Replace en-dash and em-dash with normal hyphen
      clean = clean.replace(/–/g, '-').replace(/—/g, '-');
      
      // Remove country if it ends with Brasil / Brazil
      clean = clean.replace(/,\s*(BRASIL|BRAZIL)\s*$/i, '');
      
      // Remove CEP (e.g. 80040-000, 83149899, 83.149-899)
      clean = clean.replace(/\b\d{5}-\d{3}\b/g, '');
      clean = clean.replace(/\b\d{8}\b/g, '');
      clean = clean.replace(/\b\d{2}\.\d{3}-\d{3}\b/g, '');
      
      // Clean trailing spaces/commas/hyphens left after removing CEP/Country
      clean = clean.replace(/[\s,-]+$/, '');
      
      // Split by hyphen or comma
      const parts = clean.split(/[,-]+/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length === 0) return 'OUTROS';
      
      const states = new Set([
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]);
      
      const cleanCityName = (cityStr: string): string => {
        let city = cityStr.trim();
        
        // Split by whitespace
        const words = city.split(/\s+/);
        if (words.length > 1) {
          const firstWord = words[0];
          if (['CENTRO', 'BAIRRO', 'ZONA', 'DISTRITO', 'AREA', 'ÁREA', 'RURAL', 'URBANA'].includes(firstWord)) {
            return cleanCityName(words.slice(1).join(' '));
          }
        }
        
        // Remove trailing digits or number indicators
        city = city.replace(/\b\d+\b/g, '');
        city = city.replace(/\bNº\s*\d+\b/gi, '');
        city = city.replace(/\bNO\s*\d+\b/gi, '');
        
        // Clean punctuation and extra spaces
        city = city.replace(/\s+/g, ' ').trim();
        
        return city || 'OUTROS';
      };
      
      const lastPart = parts[parts.length - 1];
      
      // Check if last part is exactly a state abbreviation
      if (states.has(lastPart)) {
        if (parts.length >= 2) {
          return cleanCityName(parts[parts.length - 2]);
        }
        return 'OUTROS';
      }
      
      // Check if last part ends with " UF" (e.g. "PINHAIS PR")
      for (const state of states) {
        if (lastPart.endsWith(' ' + state)) {
          const cityCandidate = lastPart.substring(0, lastPart.length - state.length - 1).trim();
          return cleanCityName(cityCandidate);
        }
      }
      
      return cleanCityName(lastPart);
    };
    
    const cidadesVolume: Record<string, number> = {};
    activeDeliveries.forEach(e => {
      if (e.client && e.client.endereco) {
        const city = getCityFromAddress(e.client.endereco);
        cidadesVolume[city] = (cidadesVolume[city] || 0) + 1;
      }
    });
    
    const rankingCidades = Object.keys(cidadesVolume)
      .map(city => ({ cidade: city, volume: cidadesVolume[city] }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
      
    // 9. Ranking de clientes que mais compram (valor / volume)
    const clientesVolume: Record<string, { valor: number; volume: number; nomeFantasia: string }> = {};
    activeDeliveries.forEach(e => {
      const clientId = e.clientId;
      const clientName = e.client?.nomeFantasia || 'Cliente Desconhecido';
      if (!clientesVolume[clientId]) {
        clientesVolume[clientId] = { valor: 0, volume: 0, nomeFantasia: clientName };
      }
      clientesVolume[clientId].volume += 1;
      clientesVolume[clientId].valor += (e.valor || 0);
    });
    
    const rankingClientes = Object.keys(clientesVolume)
      .map(cid => ({
        id: cid,
        nome: clientesVolume[cid].nomeFantasia,
        volume: clientesVolume[cid].volume,
        valor: clientesVolume[cid].valor
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    // 9.5. Ranking de segmentos (valor / volume)
    const segmentosVolume: Record<string, { valor: number; volume: number }> = {};
    activeDeliveries.forEach(e => {
      const segment = e.client?.segmento || 'SEM SEGMENTO';
      if (!segmentosVolume[segment]) {
        segmentosVolume[segment] = { valor: 0, volume: 0 };
      }
      segmentosVolume[segment].volume += 1;
      segmentosVolume[segment].valor += (e.valor || 0);
    });

    const rankingSegmentos = Object.keys(segmentosVolume)
      .map(seg => ({
        segmento: seg,
        volume: segmentosVolume[seg].volume,
        valor: segmentosVolume[seg].valor
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // 10. Evolução mensal do volume de entregas (12 meses do ano vigente)
    const monthlyVolume: Record<string, { volume: number; valor: number }> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let m = 0; m < 12; m++) {
      const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      monthlyVolume[key] = { volume: 0, valor: 0 };
    }

    entregas.forEach((e: any) => {
      if (e.status === 'CANCELADA') return;
      const dateStr = e.dataProgramada || e.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyVolume[key] !== undefined) {
          monthlyVolume[key].volume += 1;
          monthlyVolume[key].valor += (e.valor || 0);
        }
      }
    });

    const monthlyData = Object.keys(monthlyVolume)
      .sort()
      .map(key => {
        const [year, month] = key.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const label = `${monthNames[parseInt(month) - 1]}/${year.slice(-2)}`;
        const volume = monthlyVolume[key].volume;
        const valor = monthlyVolume[key].valor;
        const ticketMedio = volume > 0 ? valor / volume : 0;
        return {
          key,
          label,
          volume,
          valor,
          ticketMedio
        };
      });

    return {
      totalValoresEntregues,
      totalValoresGeral,
      ticketMedio,
      mediaEntregasDia,
      atrasadasCount,
      tempoMedioEntrega,
      entregadoresStats,
      totalKmRodados,
      slaPercentual,
      rankingCidades,
      rankingClientes,
      rankingSegmentos,
      monthlyData
    };
  };

  const getTrendInfo = (data: any[], key: 'valor' | 'ticketMedio') => {
    const activeMonths = data.filter(d => d.volume > 0);
    if (activeMonths.length < 2) return { text: 'Estável', color: 'bg-slate-100 text-slate-500 border-slate-200/50', icon: '●' };
    
    const current = activeMonths[activeMonths.length - 1][key];
    const previous = activeMonths[activeMonths.length - 2][key];
    
    if (previous === 0) return { text: 'Estável', color: 'bg-slate-100 text-slate-500 border-slate-200/50', icon: '●' };
    
    const pct = ((current - previous) / previous) * 100;
    if (pct > 0.5) {
      return {
        text: `+${pct.toFixed(0)}% vs mês anterior`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: '▲',
        isUp: true
      };
    } else if (pct < -0.5) {
      return {
        text: `${pct.toFixed(0)}% vs mês anterior`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: '▼',
        isUp: false
      };
    } else {
      return { text: 'Estável', color: 'bg-slate-100 text-slate-500 border-slate-200/50', icon: '●' };
    }
  };

  const kpis = getKpiData();

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative no-print">
        {/* Header Superior */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                <Truck size={18} className="stroke-[2.5] text-emerald-400" />
              </div>
              Controle de Entregas
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Módulo de Logística Integrada</p>
          </div>

          {activeTab === 'gestao' && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Seletor Visualização */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-2xs">
                <button 
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all rounded-lg ${viewMode === 'kanban' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Visualização Kanban"
                >
                  <Kanban size={13} /> Kanban
                </button>
                <button 
                  onClick={() => setViewMode('lista')}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all rounded-lg ${viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  title="Visualização em Lista"
                >
                  <ClipboardList size={13} /> Lista
                </button>
              </div>

              {/* Ações */}
              <button
                onClick={openRouteManagerModal}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Navigation size={13} className="stroke-[2.5]" />
                Gerenciar Rotas
              </button>
              
              <button
                onClick={() => openEntregaModal()}
                className="px-4 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#1B4D3E]/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} className="stroke-[3]" />
                Nova Entrega
              </button>
            </div>
          )}
        </header>

        {/* NAVEGAÇÃO DE SUB-ABAS (Igual ao módulo de Ativos) */}
        <nav className="flex gap-6 border-b border-slate-200 bg-white px-8 shrink-0 select-none">
          {(['gestao', 'kpis'] as const).map(tab => {
            const labels = {
              gestao: '1. Gestão de Entregas',
              kpis: '2. KPIs & Métricas'
            };
            const icons = {
              gestao: Truck,
              kpis: BarChart3
            };
            const Icon = icons[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`py-3.5 border-b-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {activeTab === 'gestao' && (
          <>
            {/* CARDS INDICADORES METRICAS */}
        <section className="px-8 pt-6 select-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Programadas */}
          <div 
            onClick={() => setModalMetricsOpen('programadas')}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center justify-between shadow-2xs group hover:shadow-xs hover:border-blue-300 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Programadas Hoje</span>
              <p className="text-2xl font-black text-slate-800 leading-none">{metrics.totalDia}</p>
              <span className="text-[9.5px] text-slate-455 font-bold block leading-none">Entregas agendadas</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-sm shadow-blue-100">
              <Calendar size={20} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Card 2: Realizadas */}
          <div 
            onClick={() => setModalMetricsOpen('realizadas')}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center justify-between shadow-2xs group hover:shadow-xs hover:border-emerald-300 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Realizadas Hoje</span>
              <p className="text-2xl font-black text-emerald-600 leading-none">{metrics.realizadasDia}</p>
              <span className="text-[9.5px] text-slate-455 font-bold block leading-none">
                {metrics.totalDia > 0 ? `${Math.round((metrics.realizadasDia / metrics.totalDia) * 105) > 100 ? 100 : Math.round((metrics.realizadasDia / metrics.totalDia) * 100)}% de taxa de conclusão` : 'Sem agendamentos'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-sm shadow-emerald-100">
              <CheckCircle size={20} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Card 3: Atrasadas */}
          <div 
            onClick={() => setModalMetricsOpen('atrasadas')}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center justify-between shadow-2xs group hover:shadow-xs hover:border-rose-300 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Entregas Atrasadas</span>
              <p className={`text-2xl font-black leading-none ${metrics.atrasadasTotal > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                {metrics.atrasadasTotal}
              </p>
              <span className="text-[9.5px] text-slate-455 font-bold block leading-none">Acumuladas de dias anteriores</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-sm ${
              metrics.atrasadasTotal > 0 
                ? 'bg-rose-50 text-rose-600 shadow-rose-100' 
                : 'bg-slate-50 text-slate-500 shadow-slate-100'
            }`}>
              <ShieldAlert size={20} className="stroke-[2.5]" />
            </div>
          </div>

          {/* Card 4: Faturamento/Valor */}
          <div 
            onClick={() => setModalMetricsOpen('valores')}
            className="bg-white border border-slate-200 rounded-[2rem] p-6 flex items-center justify-between shadow-2xs group hover:shadow-xs hover:border-amber-300 active:scale-[0.98] transition-all duration-300 cursor-pointer"
          >
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Valor em Rota</span>
              <p className="text-2xl font-black text-slate-800 leading-none">
                {metrics.valorDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
              <span className="text-[9.5px] text-slate-455 font-bold block leading-none">Faturamento total do dia</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-sm shadow-amber-100">
              <DollarSign size={20} className="stroke-[2.5]" />
            </div>
          </div>

        </section>

        {/* Barra de Filtros e Pesquisa */}
        <section className={viewMode === 'kanban' ? 'px-8 pt-8 pb-3 space-y-4' : 'px-8 py-6 space-y-4'}>
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-2xs flex flex-col lg:flex-row items-center gap-4 select-none">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisar por NF, cliente, entregador ou observações..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all text-xs font-bold text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full lg:w-56 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer uppercase"
              >
                <option value="">Todos os Clientes</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full lg:w-48 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer uppercase"
              >
                <option value="">Todos os Status</option>
                <option value="BACKLOG">Backlog</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="EM_DESLOCAMENTO">Em Rota</option>
                <option value="ENTREGA">Entrega Local</option>
                <option value="VALIDACAO">Em Validação</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="CANCELADA">Cancelada</option>
              </select>

              {(searchTerm || filterCliente || filterStatus) && (
                <button
                  onClick={() => { setSearchTerm(''); setFilterCliente(''); setFilterStatus(''); }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-2xl transition-colors cursor-pointer w-full lg:w-auto"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Conteúdo Principal */}
        <section className="flex-1 px-8 pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400 select-none">
              <div className="w-10 h-10 border-3 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">Carregando Entregas...</p>
            </div>
          ) : viewMode === 'lista' ? (
            /* TABELA / LISTA */
            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xs select-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-widest">
                    <th className="py-4 pl-6">Código / NF</th>
                    <th className="py-4">Cliente</th>
                    <th className="py-4">Valor</th>
                    <th className="py-4">Entregador</th>
                    <th className="py-4">Status</th>
                    <th className="py-4 pr-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                  {filteredEntregas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        Nenhuma entrega encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredEntregas.map(ent => {
                      const tech = usuarios.find(u => u.email === ent.entregadorEmail);
                      
                      const badgeMap: Record<string, string> = {
                        BACKLOG: 'bg-slate-100 text-slate-600 border-slate-200/80',
                        PROGRAMADO: 'bg-blue-50 text-blue-700 border-blue-200',
                        EM_DESLOCAMENTO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                        ENTREGA: 'bg-amber-50 text-amber-800 border-amber-250',
                        VALIDACAO: 'bg-purple-50 text-purple-700 border-purple-200',
                        ENTREGUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        CANCELADA: 'bg-red-50 text-red-700 border-red-200'
                      };

                      const labelMap: Record<string, string> = {
                        BACKLOG: 'Backlog',
                        PROGRAMADO: 'Programado',
                        EM_DESLOCAMENTO: 'Em Rota',
                        ENTREGA: 'Entrega Local',
                        VALIDACAO: 'Em Validação',
                        ENTREGUE: 'Entregue',
                        CANCELADA: 'Cancelada'
                      };

                      return (
                        <tr 
                          key={ent.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => openEntregaModal(ent)}
                        >
                          <td className="py-4.5 pl-6 font-mono font-black text-slate-900">
                            <span className="bg-slate-100 border border-slate-200/60 rounded px-1.5 py-0.5 mr-2">
                              #{String(ent.codigo).padStart(3, '0')}
                            </span>
                            NF {ent.numeroNf}
                          </td>
                          <td className="py-4.5 font-extrabold uppercase text-slate-800 max-w-[200px] truncate" title={ent.client.nomeFantasia}>
                            {ent.client.nomeFantasia}
                          </td>
                          <td className="py-4.5 font-black text-slate-800">
                            {ent.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-4.5">
                            {ent.entregadorResponsavel ? (
                              <div className="flex items-center gap-2">
                                {tech?.avatarUrl ? (
                                  <img src={tech.avatarUrl} alt="" className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 shrink-0" />
                                ) : (
                                  <div className="w-5.5 h-5.5 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[9px] uppercase shrink-0">
                                    {ent.entregadorResponsavel.substring(0, 2)}
                                  </div>
                                )}
                                <span className="font-extrabold uppercase text-slate-700">{ent.entregadorResponsavel}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Não atribuído</span>
                            )}
                          </td>
                          <td className="py-4.5">
                            <span className={`px-2 py-1 border text-[9.5px] font-black uppercase tracking-wider rounded-md ${badgeMap[ent.status]}`}>
                              {labelMap[ent.status]}
                            </span>
                            {(() => {
                              if (!ent.dataProgramada) return false;
                              if (ent.status === 'ENTREGUE' || ent.status === 'VALIDACAO' || ent.status === 'CANCELADA') return false;
                              const progDate = new Date(ent.dataProgramada);
                              const today = new Date();
                              const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
                              const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                              return progZero.getTime() < todayZero.getTime();
                            })() && (
                              <span className="ml-2 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[8.5px] font-black uppercase tracking-wider rounded-md animate-pulse inline-flex items-center gap-0.5" title="Entrega Atrasada">
                                ⚠️ Atrasada
                              </span>
                            )}
                          </td>
                          <td className="py-4.5 pr-6 text-right">
                            <div className="flex justify-end items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              {ent.status === 'EM_DESLOCAMENTO' && (
                                <button
                                  type="button"
                                  onClick={() => setModalTrackEntrega(ent)}
                                  className="p-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 border border-cyan-200 rounded-xl transition-all cursor-pointer flex items-center"
                                  title="Rastrear Rota"
                                >
                                  <Car size={13} className="stroke-[2.5]" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEntregaModal(ent)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
                                title="Visualizar Detalhes"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntrega(ent.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl transition-all cursor-pointer"
                                title="Excluir Entrega"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* KANBAN CONTÍGUOESTILO TASKS */
            <div className="pb-6 select-none bg-slate-50 pl-2 pr-1">
              <div className="flex gap-[3px] min-w-max">
                {(['BACKLOG', 'PROGRAMADO', 'EM_DESLOCAMENTO', 'ENTREGA', 'VALIDACAO', 'ENTREGUE', 'CANCELADA'] as const).map((colStatus, idx) => {
                  const colEntregas = filteredEntregas.filter(e => e.status === colStatus);
                  const isFirst = idx === 0;
                  const isLast = idx === 6;

                  const titleMap = {
                    BACKLOG: 'Backlog',
                    PROGRAMADO: 'Programado',
                    EM_DESLOCAMENTO: 'Em Rota',
                    ENTREGA: 'Entrega Local',
                    VALIDACAO: 'Em Validação',
                    ENTREGUE: 'Entregue',
                    CANCELADA: 'Cancelada'
                  };

                  const configMap = {
                    BACKLOG: { hex: '#64748B', contrast: 'white', bg: 'rgba(100, 116, 139, 0.06)', border: 'rgba(100, 116, 139, 0.18)' },
                    PROGRAMADO: { hex: '#3B82F6', contrast: 'white', bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.18)' },
                    EM_DESLOCAMENTO: { hex: '#06B6D4', contrast: 'white', bg: 'rgba(6, 182, 212, 0.06)', border: 'rgba(6, 182, 212, 0.18)' },
                    ENTREGA: { hex: '#F59E0B', contrast: 'black', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
                    VALIDACAO: { hex: '#A855F7', contrast: 'white', bg: 'rgba(168, 85, 247, 0.06)', border: 'rgba(168, 85, 247, 0.18)' },
                    ENTREGUE: { hex: '#10B981', contrast: 'white', bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.18)' },
                    CANCELADA: { hex: '#EF4444', contrast: 'white', bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.18)' }
                  };

                  const conf = configMap[colStatus];
                  const resolvedHex = conf.hex;
                  const contrast = conf.contrast;
                  const bgRgba = conf.bg;
                  const borderRgba = conf.border;

                  return (
                    <div 
                      key={colStatus} 
                      className="flex flex-col flex-shrink-0"
                      style={{ width: '274px' }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const entId = e.dataTransfer.getData('text/plain');
                        handleUpdateEntregaStatus(entId, colStatus);
                      }}
                    >
                      {/* Column Header Sticky */}
                      <div className="sticky top-0 select-none z-10 bg-slate-50" style={{ zIndex: 20 + (7 - idx) }}>
                        <div className="relative h-[52px] shrink-0 w-full pointer-events-auto">
                          <svg 
                            className={`absolute inset-0 h-full transition-all duration-200 overflow-visible ${isLast ? 'w-[274px]' : 'w-[282px]'}`}
                            viewBox={isLast ? "0 0 274 52" : "0 0 282 52"}
                            preserveAspectRatio="none"
                            style={{ color: resolvedHex }}
                          >
                            <path 
                              d={isFirst 
                                ? "M 8,0 L 274,0 L 282,26 L 274,52 L 0,52 L 0,8 A 8,8 0 0,1 8,0 Z" 
                                : isLast 
                                  ? "M 0,0 L 266,0 A 8,8 0 0,1 274,8 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                                  : "M 0,0 L 274,0 L 282,26 L 274,52 L 0,52 L 8,26 L 0,0 Z"
                              }
                              fill="currentColor" 
                              stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.08)'}
                              strokeWidth="1"
                            />
                          </svg>
                          <div 
                            className={`relative z-10 flex items-center justify-between h-full ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
                            style={{ color: contrast === 'white' ? '#ffffff' : '#0f172a' }}
                          >
                            <div className="flex flex-col min-w-0 justify-center">
                              <h3 className="font-black uppercase tracking-wider text-[11px] truncate max-w-[150px] leading-none">
                                {titleMap[colStatus]}
                              </h3>
                              <span className="text-[10px] font-bold mt-1 opacity-90 truncate select-none leading-none">
                                {colEntregas.length} {colEntregas.length === 1 ? 'entrega' : 'entregas'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cards list */}
                      <div
                        className="px-[4px] py-3 rounded-b-2xl rounded-t-none"
                        style={{
                          width: '274px',
                          minWidth: '274px',
                          maxWidth: '274px',
                          marginLeft: '0px',
                          backgroundColor: bgRgba,
                          borderColor: borderRgba,
                          borderWidth: '0 1px 1px 1px',
                          borderStyle: 'solid',
                          height: 'calc(100vh - 52px)',
                          overflowY: 'auto',
                        }}
                      >
                        <div className="flex flex-col gap-2.5">
                          {colEntregas.map(ent => (
                            <div 
                              key={ent.id} 
                              className={`relative bg-white border border-slate-200 hover:border-[#1B4D3E]/30 rounded-xl p-3 shadow-xs space-y-2 hover:shadow-sm transition-all text-left cursor-pointer ${
                                updatingEntregaId === ent.id ? 'opacity-65 pointer-events-none select-none' : ''
                              }`}
                              draggable={updatingEntregaId !== ent.id}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', ent.id);
                              }}
                              onClick={() => openEntregaModal(ent)}
                            >
                              {updatingEntregaId === ent.id && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
                                  <div className="w-5.5 h-5.5 border-2 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin"></div>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] font-black text-slate-700 bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5 whitespace-nowrap">
                                    NF № {ent.numeroNf}
                                  </span>
                                  {ent.status === 'PROGRAMADO' && ent.ordemExecucao && (
                                    <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap" title="Ordem na Fila">
                                      #{ent.ordemExecucao}
                                    </span>
                                  )}
                                  {(() => {
                                    if (!ent.dataProgramada) return false;
                                    if (ent.status === 'ENTREGUE' || ent.status === 'VALIDACAO' || ent.status === 'CANCELADA') return false;
                                    const progDate = new Date(ent.dataProgramada);
                                    const today = new Date();
                                    const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
                                    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    return progZero.getTime() < todayZero.getTime();
                                  })() && (
                                    <span className="text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 rounded px-1.5 py-0.5 whitespace-nowrap animate-pulse flex items-center gap-0.5" title="Entrega Atrasada">
                                      ⚠️ Atrasada
                                    </span>
                                  )}
                                  {ent.status === 'VALIDACAO' && ent.observacaoEntrega?.includes('Cancelamento solicitado') && (
                                    <span className="text-[9px] font-black bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap animate-pulse">
                                      Sol. Cancelamento
                                    </span>
                                  )}
                                  {ent.status === 'EM_DESLOCAMENTO' && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setModalTrackEntrega(ent); }}
                                      className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-md animate-pulse cursor-pointer flex items-center"
                                      title="Rastrear Entregador em Tempo Real"
                                    >
                                      <Car size={11} className="stroke-[2.5]" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-700 font-extrabold">
                                  {ent.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-[10px] font-extrabold text-slate-800 uppercase leading-tight truncate" title={ent.client.nomeFantasia}>{ent.client.nomeFantasia}</h4>
                                <p className="text-[9.5px] text-slate-500 truncate font-semibold uppercase" title={ent.client.endereco}>{ent.client.endereco || 'Sem endereço'}</p>
                              </div>
                              
                              <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100/50 text-[9.5px] space-y-2">
                                {ent.entregadorResponsavel ? (() => {
                                  const tech = usuarios.find(u => u.email === ent.entregadorEmail);
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReassignEntregador(ent);
                                      }}
                                      className="w-full flex items-center gap-2 p-1 bg-white hover:bg-blue-50/40 border border-slate-150 hover:border-blue-200 rounded-lg text-left transition-all group/tech cursor-pointer"
                                      title="Clique para alterar o entregador"
                                    >
                                      {tech?.avatarUrl ? (
                                        <img 
                                          src={tech.avatarUrl} 
                                          alt={ent.entregadorResponsavel} 
                                          className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 shrink-0" 
                                        />
                                      ) : (
                                        <div className="w-5.5 h-5.5 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[9px] uppercase shrink-0 border border-[#1B4D3E]/15">
                                          {ent.entregadorResponsavel.substring(0, 2)}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Entregador</p>
                                        <p className="text-[9.5px] font-extrabold text-slate-700 uppercase truncate mt-0.5 group-hover/tech:text-blue-600 transition-colors">
                                          {ent.entregadorResponsavel}
                                        </p>
                                      </div>
                                      <div className="text-slate-300 group-hover/tech:text-blue-500 transition-colors shrink-0 pr-0.5">
                                        <Users size={9} className="stroke-[2.5]" />
                                      </div>
                                    </button>
                                  );
                                })() : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReassignEntregador(ent);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 p-1 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 text-amber-800 rounded-lg text-left transition-all cursor-pointer"
                                    title="Atribuir Entregador"
                                  >
                                    <Users size={10} className="stroke-[2.5]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">Atribuir Entregador</span>
                                  </button>
                                )}

                                {ent.status === 'EM_DESLOCAMENTO' && ent.tempoEstimadoRota !== null && (
                                  <div className="text-[9.5px] px-1 flex justify-between items-center text-cyan-600 bg-cyan-50/40 p-1 rounded border border-cyan-100/60">
                                    <span className="font-extrabold">Est. Rota:</span>
                                    <span className="font-black">{Math.round(ent.tempoEstimadoRota)} min ({ent.distanciaEstimadaRota?.toFixed(1)} km)</span>
                                  </div>
                                )}

                                {(ent.status === 'ENTREGA' || ent.status === 'VALIDACAO' || ent.status === 'ENTREGUE') && ent.tempoRealizadoRota !== null && (
                                  <div className={`text-[9.5px] px-1 flex justify-between items-center p-1 rounded border ${
                                    ent.desvioRota 
                                      ? 'text-rose-600 bg-rose-50/40 border-rose-100/60 animate-pulse' 
                                      : 'text-emerald-700 bg-emerald-50/40 border-emerald-100/60'
                                  }`}>
                                    <span className="font-extrabold flex items-center gap-0.5">
                                      {ent.desvioRota ? '⚠️ Rota (Desvio):' : '✓ Rota Realizada:'}
                                    </span>
                                    <span className="font-black">
                                      {Math.round(ent.tempoRealizadoRota)} min ({ent.distanciaRealizadaRota?.toFixed(1)} km)
                                    </span>
                                  </div>
                                )}

                                {ent.dataProgramada && (
                                  <div className="text-slate-500 font-bold px-1 flex justify-between items-center">
                                    <span className="text-slate-400 font-extrabold font-semibold">Agendado:</span>
                                    <span className="text-slate-700 font-extrabold">{new Date(ent.dataProgramada).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {colEntregas.length === 0 && (
                            <div 
                              onClick={() => openEntregaModal()}
                              className="border border-dashed border-slate-300 hover:border-[#1B4D3E]/40 rounded-lg py-10 flex flex-col items-center justify-center gap-2 flex-1 cursor-pointer transition-all hover:bg-white/50 group/empty"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover/empty:bg-[#1B4D3E]/10 group-hover/empty:text-[#1B4D3E] transition-colors">
                                <Plus size={16} />
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover/empty:text-[#1B4D3E] transition-colors">Sem entregas</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
          </>
        )}

        {/* CONTEÚDO DA ABA DE KPIS */}
        {activeTab === 'kpis' && (
          <div className="p-8 space-y-8 animate-in fade-in duration-200">
            {/* Linha 1: Cards de Indicadores Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 select-none">
              
              {/* Card 1: Faturamento Total */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-emerald-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Valores Concluídos</span>
                  <p className="text-lg font-black text-emerald-600 truncate mt-1">
                    {kpis.totalValoresEntregues.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">
                    Geral: {kpis.totalValoresGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Card 2: Ticket Médio */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-blue-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Ticket Médio</span>
                  <p className="text-lg font-black text-slate-800 truncate mt-1">
                    {kpis.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">Média por entrega ativa</span>
                </div>
              </div>

              {/* Card 3: Média Diária */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-cyan-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Média Entregas/Dia</span>
                  <p className="text-lg font-black text-slate-800 truncate mt-1">
                    {kpis.mediaEntregasDia.toFixed(1)}
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">Entregas por dia programado</span>
                </div>
              </div>

              {/* Card 4: SLA de Entregas */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-purple-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">SLA de Entregas</span>
                  <p className={`text-lg font-black mt-1 ${kpis.slaPercentual >= 90 ? 'text-emerald-600' : kpis.slaPercentual >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {kpis.slaPercentual.toFixed(1)}%
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">Entregas no prazo programado</span>
                </div>
              </div>

              {/* Card 5: KM Rodados */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-amber-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">KM Rodados</span>
                  <p className="text-lg font-black text-slate-800 truncate mt-1">
                    {kpis.totalKmRodados.toFixed(1)} km
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">Total acumulado em rotas</span>
                </div>
              </div>

              {/* Card 6: Tempo Médio */}
              <div className="bg-white border border-slate-200 rounded-[1.8rem] p-5 shadow-2xs group hover:shadow-xs hover:border-indigo-350 transition-all duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Tempo Médio/Rota</span>
                  <p className="text-lg font-black text-slate-800 truncate mt-1">
                    {kpis.tempoMedioEntrega.toFixed(0)} min
                  </p>
                  <span className="text-[8.5px] text-slate-455 font-bold block leading-none">Média de duração das entregas</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              
              {/* Esquerda: Entregadores & Cidades */}
              <div className="space-y-8">
                
                {/* Ranking de Entregadores */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 select-none">
                    <Users size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                    Performance & Horas dos Entregadores
                  </h3>
                  
                  <div className="space-y-4.5">
                    {Object.keys(kpis.entregadoresStats).length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">Nenhum dado de entregador disponível.</p>
                    ) : (
                      Object.keys(kpis.entregadoresStats).map(name => {
                        const stats = kpis.entregadoresStats[name];
                        const pctHours = (stats.horas / 176) * 100;
                        const tech = usuarios.find(u => u.email === stats.email || u.nome === name);
                        
                        return (
                          <div key={name} className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                {tech?.avatarUrl ? (
                                  <img src={tech.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-6 h-6 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[9px] uppercase">
                                    {name.substring(0, 2)}
                                  </div>
                                )}
                                <span className="font-extrabold uppercase text-slate-700">{name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-bold">
                                <span className="font-black text-slate-800">{stats.horas.toFixed(1)}h</span> / 176h ({pctHours.toFixed(1)}%)
                              </div>
                            </div>
                            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-[#1B4D3E] rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, pctHours)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pl-8 select-none">
                              <span>{stats.totalEntregas} {stats.totalEntregas === 1 ? 'Entrega' : 'Entregas'}</span>
                              <span>{stats.km.toFixed(1)} km rodados</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Cidades de Maior Volume */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 select-none">
                    <MapPin size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                    Cidades com Maior Volume de Entregas
                  </h3>
                  
                  <div className="space-y-4.5">
                    {kpis.rankingCidades.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">Sem dados geográficos suficientes.</p>
                    ) : (
                      kpis.rankingCidades.map((item, idx) => {
                        const totalVol = kpis.rankingCidades.reduce((s, c) => s + c.volume, 0) || 1;
                        const pctVolume = (item.volume / totalVol) * 100;
                        return (
                          <div key={item.cidade} className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-black text-[9px]">
                                  #{idx + 1}
                                </span>
                                <span className="font-extrabold uppercase text-slate-700 truncate max-w-[200px]">{item.cidade}</span>
                              </div>
                              <span className="font-black text-slate-800">{item.volume} {item.volume === 1 ? 'entrega' : 'entregas'}</span>
                            </div>
                            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500" 
                                style={{ width: `${pctVolume}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Volume de Entregas por Segmento */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 select-none">
                    <BarChart3 size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                    Volume de Entregas por Segmento
                  </h3>
                  
                  <div className="space-y-4.5">
                    {kpis.rankingSegmentos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">Sem dados de segmentos disponíveis.</p>
                    ) : (
                      kpis.rankingSegmentos.map((item, idx) => {
                        const totalVol = kpis.rankingSegmentos.reduce((s, c) => s + c.volume, 0) || 1;
                        const pctVolume = (item.volume / totalVol) * 100;
                        return (
                          <div key={item.segmento} className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-black text-[9px]">
                                  #{idx + 1}
                                </span>
                                <span className="font-extrabold uppercase text-slate-700 truncate max-w-[200px]">{item.segmento}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-800">{item.volume} {item.volume === 1 ? 'entrega' : 'entregas'}</span>
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#1B4D3E] to-emerald-600 rounded-full transition-all duration-500" 
                                style={{ width: `${pctVolume}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Direita: Clientes & Entregas Atrasadas */}
              <div className="space-y-8">
                
                {/* Ranking de Clientes */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 select-none">
                    <DollarSign size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                    Clientes que mais Compram (Faturamento / Volume)
                  </h3>
                  
                  <div className="space-y-4.5">
                    {kpis.rankingClientes.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-8">Nenhum cliente com entregas ativas.</p>
                    ) : (
                      kpis.rankingClientes.map((item, idx) => {
                        const totalVal = kpis.rankingClientes.reduce((s, c) => s + c.valor, 0) || 1;
                        const pctVal = (item.valor / totalVal) * 100;
                        return (
                          <div key={item.id} className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-black text-[9px]">
                                  #{idx + 1}
                                </span>
                                <span className="font-extrabold uppercase text-slate-700 truncate max-w-[200px]" title={item.nome}>{item.nome}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-800">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.volume} {item.volume === 1 ? 'Entrega' : 'Entregas'}</p>
                              </div>
                            </div>
                            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500" 
                                style={{ width: `${pctVal}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Resumo de Entregas Atrasadas */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2 select-none">
                    <ShieldAlert size={16} className="text-rose-600 stroke-[2.5] animate-pulse" />
                    Detalhamento de Entregas Atrasadas ({kpis.atrasadasCount})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-150 text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                          <th className="pb-3 pl-2">NF</th>
                          <th className="pb-3">Cliente</th>
                          <th className="pb-3">Agendado</th>
                          <th className="pb-3 text-right pr-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
                        {(() => {
                          const today = new Date();
                          const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          
                          const delayedList = entregas.filter((ent: any) => {
                            if (!ent.dataProgramada || ent.status === 'CANCELADA') return false;
                            const progDate = new Date(ent.dataProgramada);
                            const progZero = new Date(progDate.getFullYear(), progDate.getMonth(), progDate.getDate());
                            const isPast = progZero.getTime() < todayZero.getTime();
                            const isFinished = ent.status === 'ENTREGUE' || ent.status === 'VALIDACAO';
                            return isPast && !isFinished;
                          }).slice(0, 4);

                          if (delayedList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                                  Nenhuma entrega atrasada pendente!
                                </td>
                              </tr>
                            );
                          }

                          return delayedList.map(ent => (
                            <tr key={ent.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 pl-2 font-mono font-black text-slate-800">#{ent.numeroNf}</td>
                              <td className="py-3 uppercase truncate max-w-[120px]" title={ent.client.nomeFantasia}>{ent.client.nomeFantasia}</td>
                              <td className="py-3 text-slate-500">{new Date(ent.dataProgramada).toLocaleDateString('pt-BR')}</td>
                              <td className="py-3 text-right pr-2 font-black text-slate-800 font-mono">
                                {ent.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

            </div>
          </div>

            {/* Gráficos Analíticos Mensais (Ano Vigente) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
              
              {/* Gráfico 1: Valor & Volume das Entregas por Mês */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 select-none">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                      Valor & Volume por Mês (Ano Vigente)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Faturamento acumulado e quantidade de entregas</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Indicador de Tendência */}
                    {(() => {
                      const trend = getTrendInfo(kpis.monthlyData, 'valor');
                      return (
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${trend.color} flex items-center gap-1`}>
                          {trend.icon} {trend.text}
                        </span>
                      );
                    })()}
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#1B4D3E] rounded-full inline-block" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Faturamento (R$)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-2 bg-[#1B4D3E]/20 rounded inline-block" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Entregas (Qtd)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-0 border-t border-dashed border-emerald-500 inline-block" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tendência</span>
                    </div>
                  </div>
                </div>

                {/* SVG Chart Container */}
                <div className="h-64 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines Horizontais */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 35 + ratio * 145;
                      const maxVal = Math.max(...kpis.monthlyData.map(d => d.valor), 1000);
                      const val = Math.round(maxVal * (1 - ratio));
                      const formattedVal = val >= 1000 
                        ? `R$ ${(val / 1000).toFixed(0)}k` 
                        : `R$ ${val}`;
                      return (
                        <g key={idx} className="opacity-30">
                          <line x1="55" y1={y} x2="590" y2={y} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                          <text x="45" y={y + 4} textAnchor="end" className="fill-slate-400 font-bold text-[9px] font-sans">{formattedVal}</text>
                        </g>
                      );
                    })}

                    {/* Barras de Quantidade de Entregas (Volume) */}
                    {(() => {
                      const maxVolume = Math.max(...kpis.monthlyData.map(d => d.volume), 1);
                      return kpis.monthlyData.map((d, i) => {
                        const x = 60 + (i / (kpis.monthlyData.length - 1)) * 510;
                        const barHeight = (d.volume / maxVolume) * 110;
                        const barY = 180 - barHeight;
                        const showInside = barHeight >= 16;
                        const labelY = showInside ? (barY + 10) : (barY - 4);
                        const labelClass = showInside 
                          ? "fill-[#1B4D3E] font-black text-[8px] font-sans" 
                          : "fill-slate-400 font-extrabold text-[8px] font-sans";

                        return (
                          <g key={i} className="opacity-95">
                            {d.volume > 0 && (
                              <>
                                <rect
                                  x={x - 8}
                                  width="16"
                                  y={barY}
                                  height={barHeight}
                                  fill="#1B4D3E"
                                  fillOpacity="0.12"
                                  rx="3"
                                  ry="3"
                                />
                                <text x={x} y={labelY} textAnchor="middle" className={labelClass}>
                                  {d.volume}
                                </text>
                              </>
                            )}
                          </g>
                        );
                      });
                    })()}

                    {/* Caminhos da Linha, Área e Tendência */}
                    {(() => {
                      const maxVal = Math.max(...kpis.monthlyData.map(d => d.valor), 1000);
                      const points = kpis.monthlyData.map((d, i) => {
                        const x = 60 + (i / (kpis.monthlyData.length - 1)) * 510;
                        const y = 180 - (d.valor / maxVal) * 145;
                        return { x, y, val: d.valor, label: d.label };
                      });

                      const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
                      const areaPath = `60,180 ${linePath} 570,180`;

                      // Linear Regression Trendline
                      const activePoints = points.filter((p, i) => kpis.monthlyData[i].volume > 0);
                      let trendLine = null;
                      if (activePoints.length >= 2) {
                        const n = activePoints.length;
                        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                        activePoints.forEach(p => {
                          sumX += p.x; sumY += p.y;
                          sumXY += p.x * p.y; sumXX += p.x * p.x;
                        });
                        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                        const intercept = (sumY - slope * sumX) / n;
                        trendLine = {
                          x1: activePoints[0].x,
                          y1: slope * activePoints[0].x + intercept,
                          x2: activePoints[activePoints.length - 1].x,
                          y2: slope * activePoints[activePoints.length - 1].x + intercept,
                          isIncreasing: slope < 0
                        };
                      }

                      return (
                        <>
                          <polygon points={areaPath} fill="url(#areaGradient)" />
                          <polyline points={linePath} fill="none" stroke="#1B4D3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                          {trendLine && (
                            <line
                              x1={trendLine.x1}
                              y1={trendLine.y1}
                              x2={trendLine.x2}
                              y2={trendLine.y2}
                              stroke={trendLine.isIncreasing ? "#10B981" : "#EF4444"}
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.8"
                            />
                          )}

                          {points.map((p, i) => (
                            <g key={i} className="group/point">
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke="#1B4D3E" strokeWidth="2.5" className="cursor-pointer" />
                              
                              {/* Valor flutuante acima do ponto (sem prefixo R$ para evitar colisão) */}
                              <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-[#1B4D3E] font-black text-[9px] font-sans">
                                {p.val > 0 ? p.val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : ""}
                              </text>
                              
                              <text x={p.x} y="202" textAnchor="middle" className="fill-slate-400 font-bold text-[8.5px] uppercase tracking-wider">{p.label}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}

                    <line x1="55" y1="180" x2="590" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Gráfico 2: Ticket Médio Mensal (Ano Vigente) */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 select-none">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#1B4D3E] stroke-[2.5]" />
                      Ticket Médio por Mês (Ano Vigente)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Evolução do valor médio por entrega realizada</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Indicador de Tendência */}
                    {(() => {
                      const trend = getTrendInfo(kpis.monthlyData, 'ticketMedio');
                      return (
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${trend.color} flex items-center gap-1`}>
                          {trend.icon} {trend.text}
                        </span>
                      );
                    })()}
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-[#1B4D3E] rounded-full inline-block" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ticket Médio (R$)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-0 border-t border-dashed border-emerald-500 inline-block" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tendência</span>
                    </div>
                  </div>
                </div>

                {/* SVG Chart Container */}
                <div className="h-64 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ticketAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines Horizontais */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 35 + ratio * 145;
                      const maxTicket = Math.max(...kpis.monthlyData.map(d => d.ticketMedio), 100);
                      const val = Math.round(maxTicket * (1 - ratio));
                      const formattedVal = val >= 1000 
                        ? `R$ ${(val / 1000).toFixed(1)}k` 
                        : `R$ ${val}`;
                      return (
                        <g key={idx} className="opacity-30">
                          <line x1="55" y1={y} x2="590" y2={y} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
                          <text x="45" y={y + 4} textAnchor="end" className="fill-slate-400 font-bold text-[9px] font-sans">{formattedVal}</text>
                        </g>
                      );
                    })}

                    {/* Caminhos da Linha, Área e Tendência */}
                    {(() => {
                      const maxTicket = Math.max(...kpis.monthlyData.map(d => d.ticketMedio), 100);
                      const points = kpis.monthlyData.map((d, i) => {
                        const x = 60 + (i / (kpis.monthlyData.length - 1)) * 510;
                        const y = 180 - (d.ticketMedio / maxTicket) * 145;
                        return { x, y, val: d.ticketMedio, label: d.label };
                      });

                      const linePath = points.map(p => `${p.x},${p.y}`).join(' ');
                      const areaPath = `60,180 ${linePath} 570,180`;

                      // Linear Regression Trendline
                      const activePoints = points.filter((p, i) => kpis.monthlyData[i].volume > 0);
                      let trendLine = null;
                      if (activePoints.length >= 2) {
                        const n = activePoints.length;
                        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                        activePoints.forEach(p => {
                          sumX += p.x; sumY += p.y;
                          sumXY += p.x * p.y; sumXX += p.x * p.x;
                        });
                        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                        const intercept = (sumY - slope * sumX) / n;
                        trendLine = {
                          x1: activePoints[0].x,
                          y1: slope * activePoints[0].x + intercept,
                          x2: activePoints[activePoints.length - 1].x,
                          y2: slope * activePoints[activePoints.length - 1].x + intercept,
                          isIncreasing: slope < 0
                        };
                      }

                      return (
                        <>
                          <polygon points={areaPath} fill="url(#ticketAreaGradient)" />
                          <polyline points={linePath} fill="none" stroke="#1B4D3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                          {trendLine && (
                            <line
                              x1={trendLine.x1}
                              y1={trendLine.y1}
                              x2={trendLine.x2}
                              y2={trendLine.y2}
                              stroke={trendLine.isIncreasing ? "#10B981" : "#EF4444"}
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.8"
                            />
                          )}

                          {points.map((p, i) => (
                            <g key={i} className="group/point">
                              <circle cx={p.x} cy={p.y} r="4.5" fill="#FFFFFF" stroke="#1B4D3E" strokeWidth="2.5" className="cursor-pointer" />
                              
                              {/* Valor flutuante acima do ponto (sem prefixo R$ para evitar colisão) */}
                              <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-[#1B4D3E] font-black text-[9px] font-sans">
                                {p.val > 0 ? p.val.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : ""}
                              </text>
                              
                              <text x={p.x} y="202" textAnchor="middle" className="fill-slate-400 font-bold text-[8.5px] uppercase tracking-wider">{p.label}</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}

                    <line x1="55" y1="180" x2="590" y2="180" stroke="#E2E8F0" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE DETALHES / CADASTRO DE ENTREGA
          ─────────────────────────────────────────────────────────────────── */}
      {modalEntregaOpen && (() => {
        const ent = entregas.find(e => e.id === entregaForm.id);
        const hasId = !!entregaForm.id;
        
        let historicoArray: any[] = [];
        if (ent && ent.historico) {
          try {
            historicoArray = JSON.parse(ent.historico);
          } catch (e) {}
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <header className="bg-slate-50 border-b border-slate-150 px-8 py-5 flex justify-between items-center select-none shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={16} className="stroke-[2.5]" />
                    {hasId ? `Editar Entrega № ${String(ent?.codigo).padStart(3, '0')}` : 'Registrar Nova Entrega'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                    {hasId ? 'Atualização de Notas Fiscais e Histórico' : 'Registrar NF e Inserir no Backlog'}
                  </p>
                </div>
                <button 
                  onClick={() => setModalEntregaOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  disabled={saving}
                >
                  <X size={20} />
                </button>
              </header>

              {/* Banner de Validação / Cancelamento para Gestores */}
              {hasId && ent?.status === 'VALIDACAO' && (
                <div className="shrink-0 select-none">
                  {ent.observacaoEntrega?.includes('Cancelamento solicitado') ? (
                    <div className="bg-red-50 border-y border-red-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-red-800 flex items-center gap-1.5 leading-none">
                          <ShieldAlert size={14} className="stroke-[2.5]" />
                          Solicitação de Cancelamento
                        </h4>
                        <p className="text-xs text-red-650 font-semibold leading-relaxed">
                          O entregador solicitou o cancelamento desta entrega. Justificativa:<br />
                          <span className="italic font-bold">"{ent.observacaoEntrega.replace('Cancelamento solicitado: ', '')}"</span>
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleRecuseCancel(ent.id)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleConfirmCancel(ent.id)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Confirmar Cancelamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50 border-y border-purple-250 px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5 leading-none">
                          <ShieldCheck size={14} className="stroke-[2.5]" />
                          Validação de Conclusão de Entrega
                        </h4>
                        <p className="text-xs text-purple-650 font-semibold leading-relaxed">
                          Esta entrega foi concluída em campo pelo entregador e aguarda sua conferência.
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleRecuseCancel(ent.id)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 rounded-xl transition-all cursor-pointer"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleConcludeEntregaDirectly(ent.id)}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Validar & Concluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tabs navigation for existing OS */}
              {hasId && (
                <div className="bg-slate-50 border-b border-slate-100 flex px-8 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setActiveDetailsTab('details')}
                    className={`py-3.5 text-[10px] font-black uppercase tracking-widest border-b-2 px-4 transition-all cursor-pointer ${activeDetailsTab === 'details' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Detalhes & Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDetailsTab('history')}
                    className={`py-3.5 text-[10px] font-black uppercase tracking-widest border-b-2 px-4 transition-all cursor-pointer ${activeDetailsTab === 'history' ? 'border-[#1B4D3E] text-[#1B4D3E]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Histórico & Trajeto
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateOrUpdateEntrega} className="flex-1 overflow-y-auto p-8 space-y-6 text-left">
                {activeDetailsTab === 'details' ? (
                  <>
                    {/* Status Dropdown (apenas para edição) */}
                    {hasId && (
                      <div className="space-y-2 select-none">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status do Ciclo da Entrega</label>
                        <select
                          value={entregaForm.status}
                          onChange={(e) => handleUpdateEntregaStatus(ent?.id, e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer uppercase transition-all"
                          disabled={updatingEntregaId === ent?.id || saving}
                        >
                          <option value="BACKLOG">Backlog (Aberto)</option>
                          <option value="PROGRAMADO">Programado</option>
                          <option value="EM_DESLOCAMENTO">Em Rota (Deslocamento)</option>
                          <option value="ENTREGA">Entrega Local</option>
                          <option value="VALIDACAO">Aguardando Validação</option>
                          <option value="ENTREGUE">Entregue (Concluído)</option>
                          <option value="CANCELADA">Cancelada</option>
                        </select>
                      </div>
                    )}

                    {/* Cliente e Atalho "+" */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center select-none">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente Destinatário</label>
                        <button
                          type="button"
                          onClick={() => setModalQuickClienteOpen(true)}
                          className="text-[9.5px] font-black text-[#1B4D3E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} className="stroke-[2.5]" /> Novo Cliente
                        </button>
                      </div>
                      <select
                        value={entregaForm.clientId}
                        onChange={(e) => setEntregaForm(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-850 outline-none focus:border-[#1B4D3E] cursor-pointer uppercase"
                        disabled={saving}
                      >
                        <option value="">Selecione o Cliente...</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                        ))}
                      </select>
                    </div>

                    {/* Nota Fiscal e Valor da Entrega */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número da NF</label>
                        <input
                          type="text"
                          placeholder="Ex: 001234"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                          value={entregaForm.numeroNf}
                          onChange={(e) => setEntregaForm(prev => ({ ...prev, numeroNf: e.target.value }))}
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor da Entrega (R$)</label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                          <input
                            type="text"
                            placeholder="0,00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                            value={entregaForm.valor}
                            onChange={(e) => setEntregaForm(prev => ({ ...prev, valor: e.target.value }))}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Data Programada & Entregador (Se Programado em diante) */}
                    {(entregaForm.status !== 'BACKLOG') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl select-none">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Programada</label>
                          <input
                            type="datetime-local"
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800 cursor-pointer"
                            value={entregaForm.dataProgramada}
                            onChange={(e) => setEntregaForm(prev => ({ ...prev, dataProgramada: e.target.value }))}
                            disabled={saving}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entregador Responsável</label>
                          <select
                            value={entregaForm.entregadorEmail}
                            onChange={(e) => {
                              const tech = usuarios.find(u => u.email === e.target.value);
                              setEntregaForm(prev => ({
                                ...prev,
                                entregadorEmail: e.target.value,
                                entregadorResponsavel: tech ? tech.nome : ''
                              }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800 cursor-pointer uppercase"
                            disabled={saving}
                          >
                            <option value="">Selecione...</option>
                            {entregadorList.map(u => (
                              <option key={u.id} value={u.email}>{u.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Gestor</label>
                      <textarea
                        rows={3}
                        placeholder="Instruções de entrega, detalhes de endereço ou contatos adicionais..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                        value={entregaForm.observacao}
                        onChange={(e) => setEntregaForm(prev => ({ ...prev, observacao: e.target.value }))}
                        disabled={saving}
                      />
                    </div>
                  </>
                ) : (
                  /* TIMELINE & GEOLOCATION AUDITING */
                  <div className="space-y-6 select-none text-left">
                    {/* Resumo do Trajeto GPS */}
                    {ent && (ent.tempoRealizadoRota !== null || ent.distanciaRealizadaRota !== null || ent.desvioRota) && (
                      <div className={`p-4 border rounded-2xl space-y-3 animate-in fade-in duration-200 ${
                        ent.desvioRota 
                          ? 'bg-rose-50 border-rose-200 text-rose-800' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 leading-none">
                          <Navigation size={14} className="stroke-[2.5]" />
                          Auditoria de Rota de Entrega (GPS)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black opacity-60 uppercase tracking-wider leading-none">Tempo de Trânsito</p>
                            <p className="font-extrabold">
                              Realizado: {ent.tempoRealizadoRota ? `${Math.round(ent.tempoRealizadoRota)} min` : '-'}
                              {ent.tempoEstimadoRota ? ` (Estimado: ${Math.round(ent.tempoEstimadoRota)} min)` : ''}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black opacity-60 uppercase tracking-wider leading-none">Distância Percorrida</p>
                            <p className="font-extrabold">
                              Realizado: {ent.distanciaRealizadaRota ? `${ent.distanciaRealizadaRota.toFixed(1)} km` : '-'}
                              {ent.distanciaEstimadaRota ? ` (Estimado: ${ent.distanciaEstimadaRota.toFixed(1)} km)` : ''}
                            </p>
                          </div>
                        </div>

                        {ent.desvioRota && (
                          <div className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1 pt-1.5 border-t border-rose-150 animate-pulse">
                            ⚠️ Alerta: Trajeto excedeu em +25% a rota sugerida no mapa.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline do histórico */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciclo de Vida da Entrega</h4>
                      <div className="border-l border-slate-150 pl-4 space-y-5 ml-2 relative">
                        {historicoArray.map((h, i) => (
                          <div key={i} className="relative space-y-1 text-xs">
                            {/* Marcador */}
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-400 shadow-sm"></div>
                            
                            <p className="text-[9.5px] font-black text-slate-400 leading-none">
                              {formatDateTimeBrasilia(h.data)}
                            </p>
                            <p className="text-slate-800 font-extrabold leading-tight">
                              {h.acao}
                            </p>
                            <p className="text-[9.5px] text-[#1B4D3E] font-black uppercase tracking-wider">
                              Por: {h.usuario}
                            </p>
                          </div>
                        ))}
                        
                        {historicoArray.length === 0 && (
                          <p className="text-xs text-slate-400 italic">Sem eventos de histórico registrados.</p>
                        )}
                      </div>
                    </div>

                    {/* Exibição de Assinaturas e Fotos Coletadas */}
                    {ent && (ent.assinaturaRecebedor || ent.assinaturaEntregador || ent.fotosEntrega) && (
                      <div className="border-t border-slate-100 pt-6 space-y-5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidências de Encerramento</h4>
                        
                        {/* Fotos coletadas */}
                        {ent.fotosEntrega && (() => {
                          try {
                            const fotos = JSON.parse(ent.fotosEntrega);
                            if (Array.isArray(fotos) && fotos.length > 0) {
                              return (
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Fotos On-Site ({fotos.length})</p>
                                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 border border-slate-150 rounded-2xl">
                                    {fotos.map((f, i) => (
                                      <div key={i} className="relative aspect-square border border-slate-200 rounded-lg overflow-hidden bg-slate-900 group">
                                        <img src={f} alt={`Evidência ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                                        <a href={f} download={`Entrega_${ent.codigo}_Foto_${i+1}.jpg`} className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider cursor-pointer select-none">
                                          Baixar
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {}
                          return null;
                        })()}

                        {/* Assinaturas Digitais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Assinatura do Recebedor */}
                          {ent.assinaturaRecebedor ? (
                            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col items-center gap-2 text-center">
                              <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider leading-none">Recebedor On-Site</p>
                              <div className="w-full bg-white border border-slate-200 rounded-xl h-24 overflow-hidden relative flex items-center justify-center select-none">
                                <img src={ent.assinaturaRecebedor} alt="Assinatura Recebedor" className="max-h-full max-w-full object-contain" />
                              </div>
                              <div className="text-xs">
                                <p className="font-extrabold text-slate-800 uppercase leading-none truncate max-w-[180px]">{ent.nomeRecebedor || 'Não informado'}</p>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Doc: {ent.documentoRecebedor || 'Não informado'}</p>
                              </div>
                            </div>
                          ) : ent.nomeRecebedor === 'CLIENTE AUSENTE' ? (
                            <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center">
                              <ShieldAlert size={20} className="text-amber-600 animate-pulse" />
                              <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider leading-none">Recebedor Ausente</p>
                              <p className="text-[10px] text-amber-700 font-bold max-w-[160px] leading-relaxed">
                                Entrega finalizada com a opção de destinatário ausente em campo.
                              </p>
                            </div>
                          ) : null}

                          {/* Entregador Responsável */}
                          {ent.entregadorResponsavel && (() => {
                            const driverUser = usuarios.find(u => 
                              u.email === ent.entregadorEmail || 
                              u.nome === ent.entregadorResponsavel
                            );
                            const avatarUrl = driverUser?.avatarUrl;

                            return (
                              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col items-center justify-center gap-4 text-center min-h-[160px]">
                                <p className="text-[9px] font-black text-slate-455 uppercase tracking-wider leading-none">Entregador Responsável</p>
                                
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-sm uppercase border border-[#1B4D3E]/15">
                                    {ent.entregadorResponsavel.substring(0, 2)}
                                  </div>
                                )}

                                <div className="text-xs">
                                  <p className="font-extrabold text-slate-850 uppercase truncate max-w-[180px]">{ent.entregadorResponsavel}</p>
                                  <p className="text-[9.5px] text-slate-500 mt-1 font-bold uppercase">{driverUser?.cargo || 'Entregador'}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Modal Controles */}
                <footer className="pt-6 border-t border-slate-100 flex justify-between items-center gap-3 shrink-0 select-none">
                  {hasId ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteEntrega(entregaForm.id)}
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-red-100"
                      disabled={saving}
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setModalEntregaOpen(false)}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                      disabled={saving}
                    >
                      Fechar
                    </button>
                    {activeDetailsTab === 'details' && (
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#1B4D3E]/10 transition-all cursor-pointer flex items-center gap-1.5"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save size={13} className="stroke-[2.5]" />
                            Gravar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </footer>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE ATRIBUIÇÃO DE ENTREGADOR E AGENDAMENTO
          ─────────────────────────────────────────────────────────────────── */}
      {modalAssignEntregadorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
            <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
              <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={16} className="stroke-[2.5]" />
                Atribuição de Entrega
              </h3>
              <button 
                onClick={() => setModalAssignEntregadorOpen(false)} 
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                disabled={saving}
              >
                <X size={18} />
              </button>
            </header>
            
            <div className="p-6 space-y-4 text-left">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Cliente / NF</p>
                <p className="text-xs text-slate-800 font-extrabold uppercase truncate">{entregaToAssign?.client.nomeFantasia}</p>
                <p className="text-[10px] text-slate-500 font-bold leading-none">NF № {entregaToAssign?.numeroNf}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Entregador</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {entregadorList.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedEntregadorForAssign(u.email)}
                      className={`w-full flex items-center gap-3 p-2 border rounded-xl text-left transition-all cursor-pointer ${
                        selectedEntregadorForAssign === u.email 
                          ? 'border-[#1B4D3E] bg-slate-50 ring-2 ring-[#1B4D3E]/10' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-7 h-7 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[10px] uppercase shrink-0 border border-[#1B4D3E]/15">
                          {u.nome.substring(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 uppercase truncate leading-none">{u.nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{u.cargo || 'Entregador'}</p>
                      </div>
                    </button>
                  ))}
                  {entregadorList.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">Nenhum entregador cadastrado.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Programada da Entrega</label>
                <input
                  type="datetime-local"
                  value={dataProgramadaForAssign}
                  onChange={(e) => setDataProgramadaForAssign(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                />
              </div>

              <footer className="pt-3 flex gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setModalAssignEntregadorOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmAssignEntregador}
                  className="flex-1 py-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#1B4D3E]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Check size={13} className="stroke-[3]" />
                      Salvar
                    </>
                  )}
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE GERENCIAMENTO E INTELIGÊNCIA DE ROTAS
          ─────────────────────────────────────────────────────────────────── */}
      {modalManageRoutesOpen && (() => {
        const entUser = usuarios.find(u => u.email === selectedRouteEntregador);
        const entName = entUser?.nome || '';
        
        const entList = entregas.filter(e => 
          (e.entregadorEmail === selectedRouteEntregador || (!e.entregadorEmail && e.entregadorResponsavel === entName)) &&
          e.status === 'PROGRAMADO'
        );
        
        const entSorted = [...entList].sort((a, b) => (a.ordemExecucao ?? 9999) - (b.ordemExecucao ?? 9999));
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] select-none">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Navigation size={16} className="stroke-[2.5] text-[#1B4D3E]" />
                  Sequenciador & Inteligência de Rotas
                </h3>
                <button 
                  onClick={() => setModalManageRoutesOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  disabled={routeSaving}
                >
                  <X size={18} />
                </button>
              </header>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Entregador</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {entregadorList.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedRouteEntregador(u.email)}
                        className={`w-full flex items-center gap-3 p-2 border rounded-xl text-left transition-all cursor-pointer ${
                          selectedRouteEntregador === u.email 
                            ? 'border-[#1B4D3E] bg-slate-50 ring-2 ring-[#1B4D3E]/10' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                        disabled={routeSaving}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[10px] uppercase shrink-0 border border-[#1B4D3E]/15">
                            {u.nome.substring(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 uppercase truncate leading-none">{u.nome}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{u.cargo || 'Entregador'}</p>
                        </div>
                      </button>
                    ))}
                    {entregadorList.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-4 col-span-2">Nenhum entregador cadastrado.</p>
                    )}
                  </div>
                </div>

                {selectedRouteEntregador ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fila de Entregas Programadas ({entSorted.length})</h4>
                      <div className="flex gap-2">
                        {entSorted.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenRouteMap(entSorted)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            disabled={routeSaving}
                          >
                            🗺️ Ver Rota no Mapa
                          </button>
                        )}
                        {entSorted.length > 1 && (
                          <button
                            type="button"
                            onClick={handleOptimizeRoute}
                            className="px-3 py-1.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            disabled={routeSaving}
                          >
                            {routeSaving ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Otimizando...
                              </>
                            ) : (
                              <>
                                ⚡ Otimizar Rota (OSRM)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                      {entSorted.map((ent, idx) => (
                        <div key={ent.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-black text-[10px]">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-extrabold text-slate-800 uppercase truncate leading-none">
                                {ent.client.nomeFantasia}
                              </p>
                              <p className="text-[9.5px] text-slate-450 truncate mt-1 leading-none">
                                NF: {ent.numeroNf} • {ent.client.endereco || 'Sem endereço'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveRouteOrder(ent.id, 'up', entSorted)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 cursor-pointer"
                              disabled={idx === 0 || routeSaving}
                            >
                              <ChevronUp size={13} className="stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRouteOrder(ent.id, 'down', entSorted)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 cursor-pointer"
                              disabled={idx === entSorted.length - 1 || routeSaving}
                            >
                              <ChevronDown size={13} className="stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {entSorted.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8 bg-white">
                          Nenhuma entrega programada ativa para este entregador.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                    Selecione um entregador para sequenciar seu itinerário de entregas.
                  </div>
                )}
              </div>

              <footer className="p-6 border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setModalManageRoutesOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                  disabled={routeSaving}
                >
                  Concluir
                </button>
              </footer>
            </div>
          </div>
        );
      })()}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE RASTREAMENTO GPS EM TEMPO REAL
          ─────────────────────────────────────────────────────────────────── */}
      {modalTrackEntrega && (() => {
        const ent = entregas.find(e => e.id === modalTrackEntrega.id) || modalTrackEntrega;
        const lat = ent.latitudeAtual || ent.latitudePartida;
        const lng = ent.longitudeAtual || ent.longitudePartida;
        const hasPosition = lat && lng;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Car size={16} className="stroke-[2.5] text-cyan-600 animate-bounce" />
                  Rastreamento da Entrega
                </h3>
                <button 
                  onClick={() => setModalTrackEntrega(null)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </header>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-semibold text-slate-650">
                  <div className="space-y-1 text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Entregador</p>
                    <p className="text-slate-800 font-extrabold uppercase truncate">{ent.entregadorResponsavel || 'Não Atribuído'}</p>
                    <p className="text-[9.5px] text-slate-500 truncate">{ent.entregadorEmail}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Cliente / NF</p>
                    <p className="text-slate-800 font-extrabold uppercase truncate" title={ent.client.nomeFantasia}>{ent.client.nomeFantasia}</p>
                    <p className="text-[9.5px] text-slate-500 uppercase truncate">NF: {ent.numeroNf}</p>
                  </div>
                </div>

                <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  {hasPosition ? (
                    <iframe 
                      width="100%" 
                      height="340" 
                      style={{ border: 0 }}
                      loading="lazy" 
                      allowFullScreen 
                      src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    />
                  ) : (
                    <div className="h-[340px] flex flex-col items-center justify-center gap-3 text-slate-400 p-8 text-center">
                      <MapPin size={32} className="stroke-[1.5] text-slate-300 animate-pulse" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-700">Aguardando coordenadas...</p>
                        <p className="text-[10px] text-slate-450 mt-1">O entregador está em rota mas o aparelho ainda não enviou o sinal de GPS.</p>
                      </div>
                    </div>
                  )}
                  
                  {hasPosition && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/85 text-white text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-md flex items-center gap-1.5 select-none backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <span>Sinal GPS ativo</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1 select-none">
                  <div className="text-left">
                    <span>Partida: </span>
                    <span className="text-slate-700 font-extrabold">
                      {ent.deslocamentoIniciadoEm ? new Date(ent.deslocamentoIniciadoEm).toLocaleTimeString('pt-BR') : '-'}
                    </span>
                  </div>
                  {ent.ultimaAtualizacaoLocalizacao && (
                    <div className="flex items-center gap-1 text-[#1B4D3E] font-extrabold">
                      <span>Último Sinal: </span>
                      <span>{new Date(ent.ultimaAtualizacaoLocalizacao).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                
                <footer className="pt-2 flex gap-3 border-t border-slate-100 select-none">
                  <button 
                    onClick={() => setModalTrackEntrega(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Fechar Painel
                  </button>
                  {hasPosition && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${ent.latitudePartida},${ent.longitudePartida}&destination=${encodeURIComponent(ent.client.endereco || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center shadow-xs"
                    >
                      <Car size={13} /> Ver no Maps
                    </a>
                  )}
                </footer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL CADASTRO RÁPIDO DE CLIENTE (Inline)
          ─────────────────────────────────────────────────────────────────── */}
      {modalQuickClienteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] select-none">
            <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
              <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={16} className="stroke-[2.5]" />
                Cadastrar Cliente Rápido
              </h3>
              <button 
                onClick={() => setModalQuickClienteOpen(false)} 
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                disabled={saving}
              >
                <X size={18} />
              </button>
            </header>
            
            <form onSubmit={handleQuickCreateCliente} className="p-6 space-y-4 overflow-y-auto text-left flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia (Obrigatório)</label>
                <input
                  type="text"
                  placeholder="Nome comercial do cliente"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                  value={quickClienteForm.nomeFantasia}
                  onChange={(e) => setQuickClienteForm(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo (Obrigatório)</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                  value={quickClienteForm.endereco}
                  onChange={(e) => setQuickClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                    value={quickClienteForm.whatsapp}
                    onChange={(e) => setQuickClienteForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                    value={quickClienteForm.cnpj}
                    onChange={(e) => setQuickClienteForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                  <input
                    type="text"
                    placeholder="Razão Social Ltda"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                    value={quickClienteForm.razaoSocial}
                    onChange={(e) => setQuickClienteForm(prev => ({ ...prev, razaoSocial: e.target.value }))}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segmento</label>
                  <input
                    type="text"
                    placeholder="Alimentício, TI, etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] text-xs font-bold text-slate-800"
                    value={quickClienteForm.segmento}
                    onChange={(e) => setQuickClienteForm(prev => ({ ...prev, segmento: e.target.value }))}
                    disabled={saving}
                  />
                </div>
              </div>

              <footer className="pt-3 flex gap-3 border-t border-slate-100 shrink-0">
                <button 
                  type="button"
                  onClick={() => setModalQuickClienteOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#1B4D3E]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Check size={13} className="stroke-[3]" />
                      Salvar Cliente
                    </>
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA PREMIUM */}
      {customAlert.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center border shadow-lg shadow-slate-100 animate-bounce">
                {customAlert.type === 'error' && <Shield className="text-red-500" size={32} />}
                {customAlert.type === 'warning' && <Shield className="text-amber-500" size={32} />}
                {customAlert.type === 'success' && <UserCheck className="text-emerald-500" size={32} />}
                {customAlert.type === 'info' && <Users className="text-blue-500" size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customAlert.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">{customAlert.message}</p>
              </div>
              <button 
                onClick={() => setCustomAlert(prev => ({ ...prev, open: false }))}
                className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#1B4D3E]/10 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PREMIUM */}
      {customConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center border border-amber-250 bg-amber-50 shadow-lg shadow-amber-100 animate-pulse text-amber-600">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customConfirm.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">{customConfirm.message}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCustomConfirm(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setCustomConfirm(prev => ({ ...prev, open: false }));
                    customConfirm.onConfirm();
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                  disabled={saving}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DAS MÉTRICAS */}
      {modalMetricsOpen && (() => {
        const list = getModalMetricsList();
        
        const titles = {
          programadas: 'Entregas Programadas Hoje',
          realizadas: 'Entregas Realizadas Hoje',
          atrasadas: 'Entregas Atrasadas (Dias Anteriores)',
          valores: 'Valores das Entregas Programadas Hoje'
        };

        const icons = {
          programadas: <Calendar size={18} className="text-blue-600 stroke-[2.5]" />,
          realizadas: <CheckCircle size={18} className="text-emerald-600 stroke-[2.5]" />,
          atrasadas: <ShieldAlert size={18} className="text-rose-600 stroke-[2.5]" />,
          valores: <DollarSign size={18} className="text-amber-600 stroke-[2.5]" />
        };

        const subtitle = {
          programadas: 'Lista de entregas com agendamento para a data atual',
          realizadas: 'Lista de entregas concluídas ou em validação na data atual',
          atrasadas: 'Entregas pendentes com data programada anterior a hoje',
          valores: 'Detalhamento dos valores das entregas agendadas para hoje'
        };

        const titleText = titles[modalMetricsOpen];
        const iconComponent = icons[modalMetricsOpen];
        const subtitleText = subtitle[modalMetricsOpen];

        const totalValue = list.reduce((sum, ent) => sum + (ent.valor || 0), 0);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-5xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              <header className="bg-slate-50 border-b border-slate-150 px-8 py-5 flex justify-between items-center select-none shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-xs">
                    {iconComponent}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider leading-none">
                      {titleText}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                      {subtitleText}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalMetricsOpen(null)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </header>
              
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-450 uppercase tracking-widest select-none">
                      <th className="py-4 pl-8">Ordem de entrega</th>
                      <th className="py-4">Programado</th>
                      <th className="py-4">Dados das programações</th>
                      <th className="py-4">Cliente</th>
                      <th className="py-4 pr-8 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400">
                          Nenhuma entrega correspondente encontrada.
                        </td>
                      </tr>
                    ) : (
                      list.map((ent, idx) => {
                        const badgeMap: Record<string, string> = {
                          BACKLOG: 'bg-slate-100 text-slate-600 border-slate-200/80',
                          PROGRAMADO: 'bg-blue-50 text-blue-700 border-blue-200',
                          EM_DESLOCAMENTO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
                          ENTREGA: 'bg-amber-50 text-amber-800 border-amber-250',
                          VALIDACAO: 'bg-purple-50 text-purple-700 border-purple-200',
                          ENTREGUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          CANCELADA: 'bg-red-50 text-red-700 border-red-200'
                        };

                        const labelMap: Record<string, string> = {
                          BACKLOG: 'Backlog',
                          PROGRAMADO: 'Programado',
                          EM_DESLOCAMENTO: 'Em Rota',
                          ENTREGA: 'Entrega Local',
                          VALIDACAO: 'Em Validação',
                          ENTREGUE: 'Entregue',
                          CANCELADA: 'Cancelada'
                        };

                        return (
                          <tr key={ent.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Ordem de entrega */}
                            <td className="py-4.5 pl-8 font-mono font-black text-slate-900">
                              {ent.status === 'PROGRAMADO' && ent.ordemExecucao ? (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                                  #{ent.ordemExecucao}
                                </span>
                              ) : (
                                <span className="bg-slate-100 border border-slate-200/60 rounded px-1.5 py-0.5 text-slate-500 whitespace-nowrap">
                                  #{idx + 1}
                                </span>
                              )}
                            </td>
                            {/* Programado */}
                            <td className="py-4.5 text-slate-700">
                              {ent.dataProgramada ? (
                                <div className="space-y-0.5">
                                  <p className="font-extrabold">{new Date(ent.dataProgramada).toLocaleDateString('pt-BR')}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{new Date(ent.dataProgramada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Não programado</span>
                              )}
                            </td>
                            {/* Dados das programações */}
                            <td className="py-4.5">
                              <div className="flex flex-col items-start gap-1.5">
                                <span className="font-mono text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5 whitespace-nowrap">
                                  NF {ent.numeroNf}
                                </span>
                                <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider rounded-md ${badgeMap[ent.status]}`}>
                                  {labelMap[ent.status]}
                                </span>
                              </div>
                            </td>
                            {/* Cliente */}
                            <td className="py-4.5 max-w-[280px]">
                              <div className="space-y-0.5 text-left">
                                <p className="font-extrabold text-slate-800 uppercase truncate" title={ent.client.nomeFantasia}>
                                  {ent.client.nomeFantasia}
                                </p>
                                <p className="text-[9.5px] text-slate-455 leading-tight font-semibold uppercase truncate" title={ent.client.endereco}>
                                  {ent.client.endereco || 'Sem endereço'}
                                </p>
                              </div>
                            </td>
                            {/* Valor */}
                            <td className="py-4.5 pr-8 text-right font-black text-slate-850 font-mono">
                              {ent.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              <footer className="bg-slate-50 border-t border-slate-150 px-8 py-4 flex justify-between items-center select-none shrink-0">
                <div className="text-xs font-semibold text-slate-650 flex items-center gap-4">
                  <p>Total de Itens: <span className="font-extrabold text-slate-900">{list.length}</span></p>
                  <div className="w-px h-4 bg-slate-200" />
                  <p>Valor Total: <span className="font-black text-[#1B4D3E]">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                </div>
                <button 
                  onClick={() => setModalMetricsOpen(null)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
                >
                  Fechar
                </button>
              </footer>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
