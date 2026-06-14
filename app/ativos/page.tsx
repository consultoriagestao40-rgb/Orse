'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Boxes, FileText, ClipboardList, Wrench, 
  Calendar, Printer, LayoutGrid, Kanban, 
  Tags, Info, Users, ShieldCheck, Check, 
  MessageSquare, User, FileImage, Layers, ChevronRight, ChevronUp, ChevronDown, FileCheck, CheckCircle,
  DollarSign, TrendingUp, Navigation, MapPin, History, Shield, UserCheck, Car, ShieldAlert, XCircle, BarChart3
} from 'lucide-react';

import { 
  getCategoriasAtivo, createCategoriaAtivo, updateCategoriaAtivo, deleteCategoriaAtivo,
  getAtivos, createAtivo, updateAtivo, deleteAtivo,
  getTemplatesComodato, createTemplateComodato, updateTemplateComodato, deleteTemplateComodato,
  getContratosComodato, createContratoComodato, updateContratoComodato, updateContratoComodatoStatus, deleteContratoComodato,
  getOrdensServicoAtivo, createOrdemServicoAtivo, updateOrdemServicoAtivo, deleteOrdemServicoAtivo,
  getLoggedTenantInfo, otimizarRotaTecnico, reordenarOrdensServicoManual
} from './actions';
import { getClientes } from '@/app/clientes/actions';
import { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';
import { getAllUsers } from '@/app/leads/actions';
import { getLoggedUser } from '@/app/propostas/actions';

type ActiveTab = 'ativos' | 'templates' | 'contratos' | 'ordens' | 'kpis';
type ViewMode = 'lista' | 'kanban' | 'agrupado';
type GroupBy = 'segmento' | 'categoria';

export default function AtivosPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ativos');
  
  // KPIs State
  const [selectedKpiMonth, setSelectedKpiMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedKpiTecnico, setSelectedKpiTecnico] = useState('');
  const [hoveredKpiStatus, setHoveredKpiStatus] = useState<string | null>(null);
  const [hoveredKpiOsType, setHoveredKpiOsType] = useState<string | null>(null);
  const [hoveredKpiMonthIndex, setHoveredKpiMonthIndex] = useState<number | null>(null);
  const [selectedKpiPeriodType, setSelectedKpiPeriodType] = useState<'7d' | '14d' | '28d' | 'mes' | 'ano' | 'custom'>('mes');
  const [kpiCustomStart, setKpiCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [kpiCustomEnd, setKpiCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Data State
  const [ativos, setAtivos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [ordens, setOrdens] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  // Loading & UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingOsId, setUpdatingOsId] = useState<string | null>(null);
  const [modalTrackOs, setModalTrackOs] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modals & Forms State
  const [modalAtivoOpen, setModalAtivoOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [modalTemplateOpen, setModalTemplateOpen] = useState(false);
  const [modalListTemplatesOpen, setModalListTemplatesOpen] = useState(false);
  const [modalContratoOpen, setModalContratoOpen] = useState(false);
  const [modalOsOpen, setModalOsOpen] = useState(false);
  
  // PDF Preview Modals
  const [modalContratoPdfOpen, setModalContratoPdfOpen] = useState(false);
  const [modalOsPdfOpen, setModalOsPdfOpen] = useState(false);
  const [selectedContratoForPdf, setSelectedContratoForPdf] = useState<any>(null);
  const [selectedOsForPdf, setSelectedOsForPdf] = useState<any>(null);

  // OS edit tab selection (details vs history/lifecycle log)
  const [activeOsTab, setActiveOsTab] = useState<'details' | 'history'>('details');

  // Route Management Modal State
  const [modalManageRoutesOpen, setModalManageRoutesOpen] = useState(false);
  const [selectedRouteTecnico, setSelectedRouteTecnico] = useState('');
  const [routeSaving, setRouteSaving] = useState(false);

  const formatDuration = (start: any, end: any) => {
    if (!start || !end) return null;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  // OS Signature Modal
  const [modalSignatureOpen, setModalSignatureOpen] = useState(false);
  const [selectedOsForSignature, setSelectedOsForSignature] = useState<any>(null);
  const [nomeAssinanteWeb, setNomeAssinanteWeb] = useState('');
  const [cpfAssinanteWeb, setCpfAssinanteWeb] = useState('');

  // Canvas Refs for OS Signature (Client & Technician)
  const canvasClienteRef = useRef<HTMLCanvasElement | null>(null);
  const canvasTecnicoRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingClienteRef = useRef(false);
  const isDrawingTecnicoRef = useRef(false);
  const [hasDrawnCliente, setHasDrawnCliente] = useState(false);
  const [hasDrawnTecnico, setHasDrawnTecnico] = useState(false);

  // Contracts View Settings
  const [contratosViewMode, setContratosViewMode] = useState<ViewMode>('lista');
  const [contratosGroupBy, setContratosGroupBy] = useState<GroupBy>('segmento');

  // OS View Settings
  const [osViewMode, setOsViewMode] = useState<'lista' | 'kanban'>('kanban');
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modalAssignTecnicoOpen, setModalAssignTecnicoOpen] = useState(false);
  const [osToAssignTecnico, setOsToAssignTecnico] = useState<any>(null);
  const [selectedTecnicoForAssign, setSelectedTecnicoForAssign] = useState('');
  const [targetStatusForAssign, setTargetStatusForAssign] = useState<string>('PROGRAMADO');

  // Quick Category Creation in Modal
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Estados e helpers para Alertas e Confirmações Premium
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

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({ open: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ open: true, title, message, onConfirm });
  };

  // Form Data
  const [ativoForm, setAtivoForm] = useState({ id: '', descricao: '', valor: '', categoriaId: '', observacao: '', status: 'DISPONIVEL' });
  const [categoriaForm, setCategoriaForm] = useState({ id: '', nome: '' });
  const [templateForm, setTemplateForm] = useState<{ id: string, nome: string, clausulas: { id?: string, ordem: number, titulo: string, texto: string }[] }>({ id: '', nome: '', clausulas: [] });
  
  const [contratoForm, setContratoForm] = useState<{
    id: string;
    clientId: string;
    empresaEmissoraId: string;
    dataInicio: string;
    vigenciaMeses: number;
    valorMinimoMensal: number;
    templateId: string;
    clausulas: { ordem: number, titulo: string, texto: string }[];
    selectedAtivos: { ativoId: string, quantidade: number, valorUnitario: number }[];
  }>({
    id: '',
    clientId: '',
    empresaEmissoraId: '',
    dataInicio: new Date().toISOString().substring(0, 10),
    vigenciaMeses: 12,
    valorMinimoMensal: 250,
    templateId: '',
    clausulas: [],
    selectedAtivos: []
  });

  const [osForm, setOsForm] = useState({
    id: '',
    tipo: 'INSTALACAO',
    contratoComodatoId: '',
    ativoId: '',
    ativoDestinoId: '',
    observacao: '',
    instrucoes: '',
    tecnicoResponsavel: '',
    tecnicoEmail: '',
    dataPrevista: new Date().toISOString().substring(0, 10),
    status: 'PENDENTE'
  });

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadOrdensSilently();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Live updates for tracking modal
  useEffect(() => {
    if (!modalTrackOs) return;
    
    // Auto-update every 15 seconds to fetch latest coordinates
    const interval = setInterval(async () => {
      await loadOrdensSilently();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [modalTrackOs]);

  const loadOrdensSilently = async () => {
    try {
      const osRes = await getOrdensServicoAtivo();
      if (osRes.success && osRes.ordens) {
        setOrdens(osRes.ordens);
      }
    } catch (err) {
      console.error("Erro ao atualizar ordens em background:", err);
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [catRes, ativosRes, tempRes, contrRes, osRes, cliRes, empRes, tenantRes, usersRes, loggedUser] = await Promise.all([
        getCategoriasAtivo(),
        getAtivos(),
        getTemplatesComodato(),
        getContratosComodato(),
        getOrdensServicoAtivo(),
        getClientes(),
        getEmpresasEmissoras(),
        getLoggedTenantInfo(),
        getAllUsers(),
        getLoggedUser()
      ]);

      if (catRes.success) setCategorias(catRes.categorias || []);
      if (ativosRes.success) setAtivos(ativosRes.ativos || []);
      if (tempRes.success) setTemplates(tempRes.templates || []);
      if (contrRes.success) setContratos(contrRes.contratos || []);
      if (osRes.success) setOrdens(osRes.ordens || []);
      setClientes(cliRes || []);
      setEmpresas(empRes || []);
      if (tenantRes.success) setCurrentTenant(tenantRes.tenant);
      if (usersRes?.success) setUsuarios(usersRes.users || []);
      if (loggedUser) setCurrentUser(loggedUser);
    } catch (err) {
      console.error(err);
    }
    if (!silent) setLoading(false);
  };

  // ─── ROUTE MANAGEMENT HANDLERS ───
  const handleOptimizeRoute = async (email: string) => {
    if (!email) return;
    setRouteSaving(true);
    const res = await otimizarRotaTecnico(email);
    if (res.success) {
      await loadData(true);
      showAlert('Rota Otimizada', 'A sequência de atendimento foi otimizada com base no menor caminho geográfico (OSRM).', 'success');
    } else {
      showAlert('Erro ao Otimizar', res.error || 'Erro desconhecido', 'error');
    }
    setRouteSaving(false);
  };

  const handleManualReorder = async (email: string, osIdsOrdered: string[]) => {
    if (!email) return;
    setRouteSaving(true);
    const res = await reordenarOrdensServicoManual(email, osIdsOrdered);
    if (res.success) {
      await loadData(true);
      showAlert('Fila Atualizada', 'A sequência de execução do técnico foi atualizada com sucesso.', 'success');
    } else {
      showAlert('Erro ao Reordenar', res.error || 'Erro desconhecido', 'error');
    }
    setRouteSaving(false);
  };

  // -----------------------------------------------------------------------------
  // ATIVO CRUD
  // -----------------------------------------------------------------------------
  const openAtivoModal = (ativo?: any) => {
    if (ativo) {
      setAtivoForm({
        id: ativo.id,
        descricao: ativo.descricao,
        valor: ativo.valor,
        categoriaId: ativo.categoriaId,
        observacao: ativo.observacao || '',
        status: ativo.status
      });
    } else {
      setAtivoForm({
        id: '',
        descricao: '',
        valor: '',
        categoriaId: categorias[0]?.id || '',
        observacao: '',
        status: 'DISPONIVEL'
      });
    }
    setModalAtivoOpen(true);
  };

  const handleSaveAtivo = async () => {
    if (!ativoForm.descricao || !ativoForm.categoriaId || !ativoForm.valor) {
      return showAlert('Campos Obrigatórios', 'Preencha os campos obrigatórios (Descrição, Categoria e Valor)', 'warning');
    }
    setSaving(true);
    const data = {
      descricao: ativoForm.descricao,
      valor: parseFloat(String(ativoForm.valor)) || 0,
      categoriaId: ativoForm.categoriaId,
      observacao: ativoForm.observacao,
      status: ativoForm.status
    };

    let res;
    if (ativoForm.id) {
      res = await updateAtivo(ativoForm.id, data);
    } else {
      res = await createAtivo(data);
    }

    if (res.success) {
      setModalAtivoOpen(false);
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao salvar ativo', 'error');
    }
    setSaving(false);
  };

  const handleDeleteAtivo = async (id: string) => {
    showConfirm(
      'Excluir Ativo',
      'Deseja excluir este ativo permanentemente?',
      async () => {
        setLoading(true);
        const res = await deleteAtivo(id);
        if (res.success) {
          await loadData();
        } else {
          showAlert('Erro ao Excluir', res.error || 'Erro ao excluir ativo', 'error');
        }
        setLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------------------
  // CATEGORIA CRUD
  // -----------------------------------------------------------------------------
  const openCategoriaModal = (cat?: any) => {
    if (cat) {
      setCategoriaForm({ id: cat.id, nome: cat.nome });
    } else {
      setCategoriaForm({ id: '', nome: '' });
    }
    setModalCategoriaOpen(true);
  };

  const handleSaveCategoria = async () => {
    if (!categoriaForm.nome.trim()) return showAlert('Campo Obrigatório', 'Nome é obrigatório', 'warning');
    setSaving(true);
    let res;
    if (categoriaForm.id) {
      res = await updateCategoriaAtivo(categoriaForm.id, categoriaForm.nome);
    } else {
      res = await createCategoriaAtivo(categoriaForm.nome);
    }

    if (res.success) {
      setModalCategoriaOpen(false);
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao salvar categoria', 'error');
    }
    setSaving(false);
  };

  const handleDeleteCategoria = async (id: string) => {
    showConfirm(
      'Excluir Categoria',
      'Deseja excluir esta categoria?',
      async () => {
        setLoading(true);
        const res = await deleteCategoriaAtivo(id);
        if (res.success) {
          await loadData();
        } else {
          showAlert('Erro ao Excluir', res.error || 'Erro ao excluir categoria', 'error');
        }
        setLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------------------
  // TEMPLATE CRUD
  // -----------------------------------------------------------------------------
  const openTemplateModal = (temp?: any) => {
    if (temp) {
      setTemplateForm({
        id: temp.id,
        nome: temp.nome,
        clausulas: temp.clausulas.map((c: any) => ({ ...c }))
      });
    } else {
      // Inicia com minuta oficial Slimpe preenchida para facilitar!
      setTemplateForm({
        id: '',
        nome: 'Modelo Slimpe Padrão',
        clausulas: [
          { ordem: 1, titulo: 'CLÁUSULA 1 – DO OBJETO', texto: 'O presente contrato tem como objeto a cessão gratuita, em regime de comodato, dos equipamentos de propriedade da COMODANTE, os quais estarão descritos nas respectivas Notas Fiscais de Comodato emitidas em nome do COMODATÁRIO.\nParágrafo único: O COMODATÁRIO reconhece que poderão ser emitidas uma ou mais Notas Fiscais de Comodato ao longo da vigência deste contrato, em conformidade com as necessidades e andamento da relação comercial, sendo tais documentos considerados parte integrante deste contrato. Havendo necessidade de alterações, complementações ou exclusões de equipamentos, estas poderão ser formalizadas por meio de aditivo contratual anexo.' },
          { ordem: 2, titulo: 'CLÁUSULA 2 – DA FINALIDADE', texto: 'Os equipamentos serão utilizados exclusivamente nas dependências do COMODATÁRIO, para uso com os produtos fornecidos pela COMODANTE, não podendo ser removidos ou utilizados para outros fins sem autorização expressa.' },
          { ordem: 3, titulo: 'CLÁUSULA 3 – DA VIGÊNCIA', texto: 'Este contrato vigorará por prazo indeterminado, podendo ser rescindido por qualquer das partes, mediante notificação por escrito com antecedência mínima de 30 (trinta) dias.' },
          { ordem: 4, titulo: 'CLÁUSULA 4 – DAS OBRIGAÇÕES DO COMODATÁRIO', texto: 'Parágrafo único: O COMODATÁRIO se responsabiliza pelo ressarcimento, com base no valor de mercado do bem, em caso de perda, furto, roubo, extravio ou dano de qualquer natureza aos equipamentos, exceto nos casos de desgaste natural ou defeito de fabricação.\nO COMODATÁRIO se obriga a:\n1. Zelar pela boa conservação e funcionamento dos equipamentos;\n2. Não emprestar, ceder ou transferir os bens a terceiros;\n3. Utilizar exclusivamente produtos fornecidos pela COMODANTE nos referidos equipamentos;\n4. Restituir os bens em perfeito estado de conservação, salvo desgaste natural, quando solicitado pela COMODANTE ou na rescisão contratual.' },
          { ordem: 5, titulo: 'CLÁUSULA 5 – DA CONDIÇÃO DE MANUTENÇÃO DO COMODATO', texto: 'O presente comodato fica condicionado à aquisição mínima mensal de produtos fornecidos pela COMODANTE, no valor de R$ 250,00 (duzentos e cinquenta reais). O não cumprimento desta condição autoriza a COMODANTE a rescindir o contrato de imediato, mediante simples notificação, devendo o COMODATÁRIO providenciar a devolução dos equipamentos cedidos em até 10 (dez) dias úteis.' },
          { ordem: 6, titulo: 'CLÁUSULA 6 – DAS OBRIGAÇÕES DO COMODANTE', texto: 'Parágrafo 1º: A manutenção corretiva decorrente de mau uso, instalação inadequada pelo COMODATÁRIO, ou danos por ele causados, será de responsabilidade do COMODATÁRIO, que arcará com todos os custos de reparo ou reposição do equipamento.\nParágrafo 2º: Custos adicionais de instalação, transporte ou reposição não decorrentes de defeito de fabricação ou uso normal, serão de responsabilidade exclusiva do COMODATÁRIO.\nCompete à COMODANTE:\n1. Realizar a instalação dos equipamentos no local indicado;\n2. Prestar orientação técnica para o uso adequado;\n3. Realizar eventuais manutenções corretivas nos equipamentos, desde que decorrentes de uso normal.' },
          { ordem: 7, titulo: 'CLÁUSULA 7 – DA RESCISÃO', texto: 'Parágrafo 1º: Em caso de rescisão por qualquer dos motivos acima, o COMODATÁRIO se compromete a devolver todos os equipamentos cedidos em até 10 (dez) dias úteis após a notificação formal.\nO presente contrato poderá ser rescindido:\n- Por descumprimento de qualquer cláusula;\n- Por solicitação de qualquer das partes, com aviso prévio de 30 dias;\n- Em caso de encerramento da relação comercial entre as partes.' },
          { ordem: 8, titulo: 'CLÁUSULA 8 – DA PROPRIEDADE DOS EQUIPAMENTOS', texto: 'Os equipamentos objeto deste contrato são de propriedade exclusiva e inalienável da COMODANTE. Em nenhuma hipótese, o COMODATÁRIO terá direito de retenção ou propriedade sobre os bens, devendo restituí-los integralmente ao término do contrato, independentemente do motivo da rescisão.' },
          { ordem: 9, titulo: 'CLÁUSULA 9 – DO FORO', texto: 'Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da comarca de Pinhais/PR, com renúncia de qualquer outro, por mais privilegiado que seja.' }
        ]
      });
    }
    setModalTemplateOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.nome.trim()) return showAlert('Campo Obrigatório', 'Nome do template é obrigatório', 'warning');
    setSaving(true);
    let res;
    if (templateForm.id) {
      res = await updateTemplateComodato(templateForm.id, templateForm.nome, templateForm.clausulas);
    } else {
      res = await createTemplateComodato(templateForm.nome, templateForm.clausulas);
    }

    if (res.success) {
      setModalTemplateOpen(false);
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao salvar template', 'error');
    }
    setSaving(false);
  };

  const handleAddClauseToTemplate = () => {
    const nextOrdem = templateForm.clausulas.length + 1;
    setTemplateForm(prev => ({
      ...prev,
      clausulas: [...prev.clausulas, { ordem: nextOrdem, titulo: `CLÁUSULA ${nextOrdem} – TÍTULO`, texto: '' }]
    }));
  };

  const handleClauseChange = (idx: number, field: string, val: any) => {
    const updated = [...templateForm.clausulas];
    updated[idx] = { ...updated[idx], [field]: val };
    setTemplateForm(prev => ({ ...prev, clausulas: updated }));
  };

  const handleRemoveClauseFromTemplate = (idx: number) => {
    const updated = templateForm.clausulas.filter((_, i) => i !== idx).map((c, i) => ({ ...c, ordem: i + 1 }));
    setTemplateForm(prev => ({ ...prev, clausulas: updated }));
  };

  const handleDeleteTemplate = async (id: string) => {
    showConfirm(
      'Excluir Template',
      'Excluir este template?',
      async () => {
        setLoading(true);
        await deleteTemplateComodato(id);
        await loadData();
        setLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------------------
  // CONTRATOS DE COMODATO CRUD
  // -----------------------------------------------------------------------------
  const openContratoModal = (contrato?: any) => {
    if (clientes.length === 0 || empresas.length === 0) {
      return showAlert('Dados Faltando', 'Certifique-se de que existem clientes e empresas emissoras cadastradas no sistema.', 'warning');
    }
    if (contrato) {
      setContratoForm({
        id: contrato.id,
        clientId: contrato.clientId,
        empresaEmissoraId: contrato.empresaEmissoraId,
        dataInicio: new Date(contrato.dataInicio).toISOString().substring(0, 10),
        vigenciaMeses: contrato.vigenciaMeses,
        valorMinimoMensal: contrato.valorMinimoMensal,
        templateId: contrato.templateId || '',
        clausulas: contrato.clausulas ? contrato.clausulas.map((c: any) => ({ ordem: c.ordem, titulo: c.titulo, texto: c.texto })) : [],
        selectedAtivos: contrato.itens ? contrato.itens.map((i: any) => ({ ativoId: i.ativoId, quantidade: i.quantidade, valorUnitario: i.valorUnitario })) : []
      });
    } else {
      setContratoForm({
        id: '',
        clientId: clientes[0]?.id || '',
        empresaEmissoraId: empresas[0]?.id || '',
        dataInicio: new Date().toISOString().substring(0, 10),
        vigenciaMeses: 12,
        valorMinimoMensal: 250,
        templateId: templates[0]?.id || '',
        clausulas: templates[0] ? templates[0].clausulas.map((c: any) => ({ ordem: c.ordem, titulo: c.titulo, texto: c.texto })) : [],
        selectedAtivos: []
      });
    }
    setModalContratoOpen(true);
  };

  const handleTemplateSelectionChange = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) {
      setContratoForm(prev => ({
        ...prev,
        templateId: tplId,
        clausulas: tpl.clausulas.map((c: any) => ({ ordem: c.ordem, titulo: c.titulo, texto: c.texto }))
      }));
    }
  };

  const handleAddAtivoToContrato = (ativoId: string) => {
    const active = ativos.find(a => a.id === ativoId);
    if (!active) return;
    if (contratoForm.selectedAtivos.some(item => item.ativoId === ativoId)) return;

    setContratoForm(prev => ({
      ...prev,
      selectedAtivos: [...prev.selectedAtivos, { ativoId, quantidade: 1, valorUnitario: active.valor }]
    }));
  };

  const handleUpdateContratoAtivoField = (idx: number, field: string, val: any) => {
    const updated = [...contratoForm.selectedAtivos];
    updated[idx] = { ...updated[idx], [field]: val };
    setContratoForm(prev => ({ ...prev, selectedAtivos: updated }));
  };

  const handleRemoveAtivoFromContrato = (idx: number) => {
    setContratoForm(prev => ({
      ...prev,
      selectedAtivos: prev.selectedAtivos.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveContrato = async () => {
    if (contratoForm.selectedAtivos.length === 0) {
      return showAlert('Campo Obrigatório', 'Adicione pelo menos um equipamento no contrato.', 'warning');
    }
    setSaving(true);
    let res;
    const data = {
      clientId: contratoForm.clientId,
      empresaEmissoraId: contratoForm.empresaEmissoraId,
      dataInicio: contratoForm.dataInicio,
      vigenciaMeses: Number(contratoForm.vigenciaMeses) || 12,
      valorMinimoMensal: Number(contratoForm.valorMinimoMensal) || 0,
      clausulas: contratoForm.clausulas,
      itens: contratoForm.selectedAtivos
    };
    if (contratoForm.id) {
      res = await updateContratoComodato(contratoForm.id, data);
    } else {
      res = await createContratoComodato(data);
    }

    if (res.success) {
      setModalContratoOpen(false);
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao gerar contrato de comodato', 'error');
    }
    setSaving(false);
  };

  const handleUpdateContratoStatus = async (id: string, newStatus: string) => {
    setLoading(true);
    const res = await updateContratoComodatoStatus(id, newStatus);
    if (res.success) {
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao atualizar status', 'error');
    }
    setLoading(false);
  };

  const handleDeleteContrato = async (id: string) => {
    showConfirm(
      'Excluir Contrato',
      'Deseja excluir este contrato? Todos os equipamentos vinculados voltarão a ficar disponíveis.',
      async () => {
        setLoading(true);
        const res = await deleteContratoComodato(id);
        if (res.success) {
          await loadData();
        } else {
          showAlert('Erro ao Excluir', res.error || 'Erro ao excluir contrato', 'error');
        }
        setLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------------------
  // OS CRUD
  // -----------------------------------------------------------------------------
  const openOsModal = (os?: any) => {
    if (contratos.length === 0) {
      return showAlert('Contrato Necessário', 'Para gerar uma OS, é necessário possuir contratos de comodato cadastrados.', 'warning');
    }
    
    if (os) {
      setOsForm({
        id: os.id,
        tipo: os.tipo,
        contratoComodatoId: os.contratoComodatoId,
        clientId: os.clientId,
        ativoId: os.ativoId,
        ativoDestinoId: os.ativoDestinoId || '',
        observacao: os.observacao || '',
        instrucoes: os.instrucoes || '',
        tecnicoResponsavel: os.tecnicoResponsavel || '',
        tecnicoEmail: os.tecnicoEmail || '',
        dataPrevista: os.dataPrevista ? new Date(os.dataPrevista).toISOString().substring(0, 10) : '',
        status: os.status || 'PENDENTE'
      });
    } else {
      const targetContrato = contratos[0];
      setOsForm({
        id: '',
        tipo: 'INSTALACAO',
        contratoComodatoId: targetContrato.id,
        clientId: targetContrato.clientId,
        ativoId: targetContrato.itens[0]?.ativoId || '',
        ativoDestinoId: '',
        observacao: '',
        instrucoes: '',
        tecnicoResponsavel: '',
        tecnicoEmail: '',
        dataPrevista: new Date().toISOString().substring(0, 10),
        status: 'PENDENTE'
      });
    }
    setActiveOsTab('details');
    setModalOsOpen(true);
  };

  const handleOsContratoChange = (contratoId: string) => {
    const target = contratos.find(c => c.id === contratoId);
    if (target) {
      setOsForm(prev => ({
        ...prev,
        contratoComodatoId: contratoId,
        clientId: target.clientId,
        ativoId: target.itens[0]?.ativoId || ''
      }));
    }
  };

  const handleSaveOs = async () => {
    if (!osForm.contratoComodatoId || !osForm.ativoId) {
      return showAlert('Seleção Necessária', 'Selecione o Contrato e o Equipamento associado.', 'warning');
    }
    setSaving(true);
    let res;
    if (osForm.id) {
      res = await updateOrdemServicoAtivo(osForm.id, {
        tipo: osForm.tipo,
        contratoComodatoId: osForm.contratoComodatoId,
        clientId: osForm.clientId,
        ativoId: osForm.ativoId,
        ativoDestinoId: osForm.ativoDestinoId || null,
        observacao: osForm.observacao,
        instrucoes: osForm.instrucoes,
        tecnicoResponsavel: osForm.tecnicoResponsavel,
        tecnicoEmail: osForm.tecnicoEmail,
        dataPrevista: osForm.dataPrevista ? new Date(osForm.dataPrevista).toISOString() : null,
        status: osForm.status
      });
    } else {
      res = await createOrdemServicoAtivo(osForm);
    }
    
    if (res.success) {
      setModalOsOpen(false);
      await loadData();
      showAlert('OS Salva', osForm.id ? 'Ordem de serviço atualizada com sucesso.' : 'Ordem de serviço cadastrada com sucesso.', 'success');
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao gravar OS', 'error');
    }
    setSaving(false);
  };

  useEffect(() => {
    const canvasCliente = canvasClienteRef.current;
    const canvasTecnico = canvasTecnicoRef.current;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.target === canvasCliente || e.target === canvasTecnico) {
        e.preventDefault();
      }
    };

    if (canvasCliente) {
      canvasCliente.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvasCliente.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }
    if (canvasTecnico) {
      canvasTecnico.addEventListener('touchstart', preventDefaultTouch, { passive: false });
      canvasTecnico.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    }

    return () => {
      if (canvasCliente) {
        canvasCliente.removeEventListener('touchstart', preventDefaultTouch);
        canvasCliente.removeEventListener('touchmove', preventDefaultTouch);
      }
      if (canvasTecnico) {
        canvasTecnico.removeEventListener('touchstart', preventDefaultTouch);
        canvasTecnico.removeEventListener('touchmove', preventDefaultTouch);
      }
    };
  }, [modalSignatureOpen]);

  const getCoordinatesWeb = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // CLIENT CANVAS DRAWING HANDLERS
  const startDrawingCliente = (e: any) => {
    const canvas = canvasClienteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinatesWeb(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#1b4d3e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    isDrawingClienteRef.current = true;
  };

  const drawCliente = (e: any) => {
    if (!isDrawingClienteRef.current) return;
    const canvas = canvasClienteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinatesWeb(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawnCliente(true);
  };

  const stopDrawingCliente = () => {
    isDrawingClienteRef.current = false;
  };

  const clearCanvasCliente = () => {
    const canvas = canvasClienteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnCliente(false);
  };

  // TECHNICIAN CANVAS DRAWING HANDLERS
  const startDrawingTecnico = (e: any) => {
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinatesWeb(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = '#1b4d3e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    isDrawingTecnicoRef.current = true;
  };

  const drawTecnico = (e: any) => {
    if (!isDrawingTecnicoRef.current) return;
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinatesWeb(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasDrawnTecnico(true);
  };

  const stopDrawingTecnico = () => {
    isDrawingTecnicoRef.current = false;
  };

  const clearCanvasTecnico = () => {
    const canvas = canvasTecnicoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnTecnico(false);
  };

  const handleConcludeOs = async (osId: string) => {
    showConfirm(
      'Concluir Ordem de Serviço',
      'Deseja concluir esta Ordem de Serviço sem coletar assinaturas (versão Web)?',
      async () => {
        setUpdatingOsId(osId);
        setOrdens(prev => prev.map(o => o.id === osId ? { ...o, status: 'CONCLUIDA' } : o));
        setOsForm(prev => prev.id === osId ? { ...prev, status: 'CONCLUIDA' } : prev);

        const res = await updateOrdemServicoAtivo(osId, {
          status: 'CONCLUIDA'
        });
        
        if (res.success) {
          await loadData(true);
        } else {
          await loadData(true);
          const realOs = ordens.find(o => o.id === osId);
          if (realOs) {
            setOsForm(prev => prev.id === osId ? { ...prev, status: realOs.status } : prev);
          }
          showAlert('Erro ao Concluir', res.error || 'Erro ao concluir a OS', 'error');
        }
        setUpdatingOsId(null);
      }
    );
  };

  const handleUpdateOsStatus = async (osId: string, newStatus: string) => {
    const os = ordens.find(o => o.id === osId);
    if (newStatus === 'CONCLUIDA' && os?.status !== 'VALIDACAO') {
      handleConcludeOs(osId);
      return;
    }
    if (newStatus === 'PROGRAMADO' || newStatus === 'EM_DESLOCAMENTO' || newStatus === 'EM_ANDAMENTO') {
      const os = ordens.find(o => o.id === osId);
      const hasTecnico = os?.tecnicoEmail && os.tecnicoEmail.trim() !== '' && os?.tecnicoResponsavel && os.tecnicoResponsavel.trim() !== '';
      if (!hasTecnico) {
        setOsToAssignTecnico(os);
        setSelectedTecnicoForAssign('');
        setTargetStatusForAssign(newStatus);
        setModalAssignTecnicoOpen(true);
        return;
      }
    }
    
    setUpdatingOsId(osId);
    
    // Atualização otimista imediata no estado React para evitar lag visual
    setOrdens(prev => prev.map(o => o.id === osId ? { ...o, status: newStatus } : o));
    setOsForm(prev => prev.id === osId ? { ...prev, status: newStatus } : prev);
    
    const res = await updateOrdemServicoAtivo(osId, { status: newStatus });
    if (res.success) {
      await loadData(true); // Recarrega silenciosamente em background
    } else {
      await loadData(true); // Reverte e atualiza com o estado real do banco se houver erro
      const realOs = ordens.find(o => o.id === osId);
      if (realOs) {
        setOsForm(prev => prev.id === osId ? { ...prev, status: realOs.status } : prev);
      }
      showAlert('Erro ao Atualizar', res.error || 'Erro ao atualizar status da OS', 'error');
    }
    setUpdatingOsId(null);
  };

  const handleRecuseCancel = async (osId: string) => {
    const os = ordens.find(o => o.id === osId);
    if (!os) return;

    const motivo = prompt('Informe a justificativa para recusar o cancelamento (obrigatório para o técnico):');
    if (motivo === null) return;
    if (!motivo.trim()) {
      showAlert('Justificativa Obrigatória', 'Você precisa informar um motivo/justificativa para recusar o cancelamento.', 'warning');
      return;
    }

    const observacaoAtendimentoRefusao = `Motivo da recusa do cancelamento: ${motivo.trim()}`;

    let targetStatus = 'EM_ANDAMENTO'; // fallback
    if (os.historico) {
      try {
        const history = JSON.parse(os.historico);
        if (Array.isArray(history)) {
          // Loop backwards to find the status prior to VALIDACAO
          for (let i = history.length - 1; i >= 0; i--) {
            const item = history[i];
            if (item && typeof item.acao === 'string') {
              const match = item.acao.match(/Status alterado de (\w+) para VALIDACAO/);
              if (match && match[1]) {
                const statusCandidate = match[1];
                if (['PROGRAMADO', 'EM_DESLOCAMENTO', 'EM_ANDAMENTO'].includes(statusCandidate)) {
                  targetStatus = statusCandidate;
                  break;
                }
              } else {
                const generalMatch = item.acao.match(/Status alterado de (\w+) para/);
                if (generalMatch && generalMatch[1]) {
                  const statusCandidate = generalMatch[1];
                  if (['PROGRAMADO', 'EM_DESLOCAMENTO', 'EM_ANDAMENTO'].includes(statusCandidate)) {
                    targetStatus = statusCandidate;
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro ao fazer parse do historico:", e);
      }
    }

    setUpdatingOsId(osId);
    
    // Atualização otimista
    setOrdens(prev => prev.map(o => o.id === osId ? { ...o, status: targetStatus, observacaoAtendimento: observacaoAtendimentoRefusao } : o));
    setOsForm(prev => prev.id === osId ? { ...prev, status: targetStatus, observacaoAtendimento: observacaoAtendimentoRefusao } : prev);
    
    const res = await updateOrdemServicoAtivo(osId, { 
      status: targetStatus, 
      observacaoAtendimento: observacaoAtendimentoRefusao 
    });
    
    if (res.success) {
      await loadData(true);
      showAlert('Cancelamento Recusado', `A solicitação de cancelamento foi recusada. A OS retornou para o status ${targetStatus}.`, 'success');
    } else {
      await loadData(true);
      const realOs = ordens.find(o => o.id === osId);
      if (realOs) {
        setOsForm(prev => prev.id === osId ? { ...prev, status: realOs.status } : prev);
      }
      showAlert('Erro ao Recusar', res.error || 'Erro ao recusar o cancelamento', 'error');
    }
    setUpdatingOsId(null);
  };

  const handleConfirmAssignTecnico = async () => {
    if (!osToAssignTecnico) return;
    if (!selectedTecnicoForAssign) {
      return showAlert('Técnico Necessário', 'Por favor, selecione um técnico para programar esta OS.', 'warning');
    }
    const userSelected = usuarios.find(u => u.email === selectedTecnicoForAssign);
    if (!userSelected) return;

    setSaving(true);
    const res = await updateOrdemServicoAtivo(osToAssignTecnico.id, {
      status: targetStatusForAssign,
      tecnicoEmail: userSelected.email,
      tecnicoResponsavel: userSelected.nome
    });
    setSaving(false);

    if (res.success) {
      setModalAssignTecnicoOpen(false);
      setOsToAssignTecnico(null);
      setSelectedTecnicoForAssign('');
      setOsForm(prev => prev.id === osToAssignTecnico.id ? {
        ...prev,
        status: targetStatusForAssign,
        tecnicoEmail: userSelected.email,
        tecnicoResponsavel: userSelected.nome
      } : prev);
      await loadData(true);
      
      let msgText = `Ordem atribuída ao técnico ${userSelected.nome} com sucesso.`;
      if (targetStatusForAssign === 'EM_DESLOCAMENTO') {
        msgText = `Ordem colocada em deslocamento com o técnico ${userSelected.nome}.`;
      } else if (targetStatusForAssign === 'EM_ANDAMENTO') {
        msgText = `Ordem colocada em atendimento com o técnico ${userSelected.nome}.`;
      }
      showAlert('OS Atualizada', msgText, 'success');
    } else {
      showAlert('Erro ao Programar', res.error || 'Erro ao atribuir técnico à OS', 'error');
    }
  };

  const handleReassignTecnico = (os: any) => {
    setOsToAssignTecnico(os);
    setSelectedTecnicoForAssign(os.tecnicoEmail || '');
    setModalAssignTecnicoOpen(true);
  };

  const handleSaveSignature = async () => {
    if (!selectedOsForSignature) return;
    const canvasCliente = canvasClienteRef.current;
    const canvasTecnico = canvasTecnicoRef.current;
    if (!canvasCliente || !canvasTecnico) return;
    if (!hasDrawnCliente) {
      return showAlert('Assinatura Requerida', 'Por favor, colete a assinatura do Cliente.', 'warning');
    }
    if (!hasDrawnTecnico) {
      return showAlert('Assinatura Requerida', 'Por favor, colete a assinatura do Técnico.', 'warning');
    }
    if (!nomeAssinanteWeb.trim()) {
      return showAlert('Campo Obrigatório', 'Por favor, informe o Nome do Assinante.', 'warning');
    }

    setSaving(true);
    const base64Cliente = canvasCliente.toDataURL('image/png');
    const base64Tecnico = canvasTecnico.toDataURL('image/png');

    const res = await updateOrdemServicoAtivo(selectedOsForSignature.id, {
      status: 'CONCLUIDA',
      assinaturaCliente: base64Cliente,
      assinaturaTecnico: base64Tecnico,
      nomeAssinante: nomeAssinanteWeb,
      cpfAssinante: cpfAssinanteWeb || 'Sem Documento'
    });
    setSaving(false);
    setModalSignatureOpen(false);
    if (res.success) {
      setOsForm(prev => prev.id === selectedOsForSignature.id ? { ...prev, status: 'CONCLUIDA' } : prev);
      await loadData();
    } else {
      showAlert('Erro ao Salvar', res.error || 'Erro ao assinar e concluir OS', 'error');
    }
  };

  const handleDeleteOs = async (id: string) => {
    showConfirm(
      'Excluir Ordem de Serviço',
      'Deseja excluir esta Ordem de Serviço?',
      async () => {
        setLoading(true);
        const res = await deleteOrdemServicoAtivo(id);
        if (res.success) {
          await loadData();
          showAlert('OS Excluída', 'Ordem de serviço excluída com sucesso.', 'success');
        } else {
          showAlert('Erro ao Excluir', res.error || 'Erro ao excluir OS', 'error');
        }
        setLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------------------
  // FILTERS AND GROUPINGS
  // -----------------------------------------------------------------------------
  const filteredAtivos = ativos.filter(a => {
    const matchesSearch = 
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria ? a.categoriaId === filterCategoria : true;
    const matchesStatus = filterStatus ? a.status === filterStatus : true;
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const filteredContratos = contratos.filter(c => 
    c.client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.client.razaoSocial && c.client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.empresaEmissora.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.itens.some((item: any) => item.ativo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredOrdens = ordens.filter(o => 
    o.client.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.tecnicoResponsavel && o.tecnicoResponsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
    o.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.ativo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `OS ${o.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Groupings logic for Contracts
  const getGroupedContratos = () => {
    const map: Record<string, any[]> = {};
    for (const c of filteredContratos) {
      let key = 'Sem Classificação';
      if (contratosGroupBy === 'segmento') {
        key = c.client.segmento || 'Não Identificado';
      } else if (contratosGroupBy === 'categoria') {
        key = c.itens[0]?.ativo.categoria?.nome || 'Geral';
      }
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return Object.entries(map);
  };

  return (
    <div id="ativos-layout-root" className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className={`flex-1 no-print ${
        activeTab === 'ordens' && osViewMode === 'kanban' 
          ? 'overflow-auto h-screen p-0 bg-slate-50' 
          : 'p-8 overflow-y-auto'
      }`}>
        <div className={`space-y-6 ${
          activeTab === 'ordens' && osViewMode === 'kanban' 
            ? 'w-full flex flex-col' 
            : 'max-w-7xl mx-auto'
        }`}>
          <div className={activeTab === 'ordens' && osViewMode === 'kanban' ? 'px-8 pt-8 pb-3 space-y-4' : 'space-y-6'}>
          
          {/* HEADER DO MÓDULO */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2.5">
                <Boxes size={24} className="stroke-[2.5]" /> Gestão de Ativos & Comodato
              </h1>
              <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wider">Controle do parque de ativos, minutas contratuais, termos de comodato e ordens de serviço</p>
            </div>
            
            {/* Botão de Criação Conforme Aba */}
            {activeTab === 'ativos' && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => openCategoriaModal()}
                  className="border border-[#1B4D3E] text-[#1B4D3E] hover:bg-emerald-50/50 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Nova Categoria
                </button>
                <button 
                  onClick={() => openAtivoModal()}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} /> Novo Equipamento
                </button>
              </div>
            )}
            {activeTab === 'contratos' && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => setModalListTemplatesOpen(true)}
                  className="border border-[#1B4D3E] text-[#1B4D3E] hover:bg-emerald-50/50 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} className="stroke-[2.5]" /> Minutas Padrão
                </button>
                <button 
                  onClick={() => openContratoModal()}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} /> Novo Contrato de Comodato
                </button>
              </div>
            )}
            {activeTab === 'ordens' && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => {
                    setSelectedRouteTecnico('');
                    setModalManageRoutesOpen(true);
                  }}
                  className="border border-[#1B4D3E] text-[#1B4D3E] hover:bg-emerald-50/50 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation size={14} className="stroke-[2.5]" /> Gerenciar Rotas
                </button>
                <button 
                  onClick={() => openOsModal()}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} /> Abrir Ordem de Serviço
                </button>
              </div>
            )}
          </header>

          {/* NAVEGAÇÃO DE SUB-ABAS */}
          <nav className="flex gap-6 border-b border-slate-200">
            {(['ativos', 'contratos', 'ordens', 'kpis'] as ActiveTab[]).map(tab => {
              const labels = {
                ativos: '1. Parque de Ativos',
                templates: '',
                contratos: '2. Contratos de Comodato',
                ordens: '3. Ordens de Serviço (OS)',
                kpis: '4. KPIs & Métricas'
              };
              const icons = {
                ativos: Boxes,
                templates: FileText,
                contratos: FileCheck,
                ordens: Wrench,
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

          {/* CARDS DE RESUMO DO PARQUE DE ATIVOS */}
          {activeTab === 'ativos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Total Ativos */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Boxes size={22} className="stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total de Ativos</span>
                  <span className="text-xl font-black text-slate-800 mt-1 block truncate">
                    {ativos.length}
                  </span>
                </div>
              </div>

              {/* Card 2: Alocados */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E4480] shrink-0">
                  <FileCheck size={22} className="stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ativos Alocados</span>
                  <span className="text-xl font-black text-[#1E4480] mt-1 block truncate">
                    {ativos.filter(a => a.status === 'COMODATO').length}
                  </span>
                </div>
              </div>

              {/* Card 3: Disponíveis */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle size={22} className="stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Disponíveis</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block truncate">
                    {ativos.filter(a => a.status === 'DISPONIVEL').length}
                  </span>
                </div>
              </div>

              {/* Card 4: Valor do Parque Total */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <DollarSign size={22} className="stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor do Parque</span>
                  <span className="text-base font-black text-amber-600 mt-1 block truncate" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ativos.reduce((acc, curr) => acc + (curr.valor || 0), 0))}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ativos.reduce((acc, curr) => acc + (curr.valor || 0), 0))}
                  </span>
                </div>
              </div>

              {/* Card 5: Valor Alocado */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-[#1B4D3E]/5 border border-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E] shrink-0">
                  <TrendingUp size={22} className="stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor Alocado</span>
                  <span className="text-base font-black text-[#1B4D3E] mt-1 block truncate" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ativos.filter(a => a.status === 'COMODATO').reduce((acc, curr) => acc + (curr.valor || 0), 0))}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ativos.filter(a => a.status === 'COMODATO').reduce((acc, curr) => acc + (curr.valor || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE FILTROS E BUSCA */}
          {activeTab !== 'kpis' && (
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-xs gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar por descrição, código ou detalhes..." 
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 outline-none font-bold uppercase transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Configurações Extra de Filtro exclusivas da aba Contratos */}
              {activeTab === 'contratos' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button 
                      onClick={() => setContratosViewMode('lista')}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${contratosViewMode === 'lista' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <LayoutGrid size={12} /> Lista
                    </button>
                    <button 
                      onClick={() => setContratosViewMode('kanban')}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${contratosViewMode === 'kanban' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <Kanban size={12} /> Kanban
                    </button>
                    <button 
                      onClick={() => setContratosViewMode('agrupado')}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${contratosViewMode === 'agrupado' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <Layers size={12} /> Agrupados
                    </button>
                  </div>

                  {contratosViewMode === 'agrupado' && (
                    <select
                      value={contratosGroupBy}
                      onChange={(e) => setContratosGroupBy(e.target.value as GroupBy)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#1B4D3E] cursor-pointer"
                    >
                      <option value="segmento">Por Segmento de Cliente</option>
                      <option value="categoria">Por Categoria de Ativo</option>
                    </select>
                  )}
                </div>
              )}

              {/* Configurações Extra de Filtro exclusivas da aba Ordens de Serviço */}
              {activeTab === 'ordens' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button 
                      onClick={() => setOsViewMode('lista')}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${osViewMode === 'lista' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <LayoutGrid size={12} /> Lista
                    </button>
                    <button 
                      onClick={() => setOsViewMode('kanban')}
                      className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${osViewMode === 'kanban' ? 'bg-[#1B4D3E] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      <Kanban size={12} /> Kanban
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'ativos' && (
                <div className="flex items-center gap-3">
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 outline-none focus:border-[#1B4D3E] cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="">TODAS AS CATEGORIAS</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome.toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 outline-none focus:border-[#1B4D3E] cursor-pointer"
                  >
                    <option value="">TODOS OS STATUS</option>
                    <option value="DISPONIVEL">DISPONÍVEL</option>
                    <option value="COMODATO">COMODATO</option>
                    <option value="MANUTENCAO">MANUTENÇÃO</option>
                    <option value="BAIXADO">BAIXADO</option>
                  </select>
                </div>
              )}
              
              <div className="text-right flex items-center gap-2 self-end md:self-auto select-none">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase leading-none block">Total Carregado</span>
                <span className="text-sm font-black text-[#1B4D3E] bg-[#1B4D3E]/8 border border-[#1B4D3E]/15 rounded-lg px-2.5 py-1">
                  {activeTab === 'ativos' && filteredAtivos.length}
                  {activeTab === 'contratos' && filteredContratos.length}
                  {activeTab === 'ordens' && filteredOrdens.length}
                </span>
              </div>
            </div>
          )}
          </div>

          {/* ───────────────────────────────────────────────────────────────────
              ABA 1: PARQUE DE ATIVOS E CATEGORIAS
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'ativos' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 border-r border-white/10 w-36"># Código</th>
                    <th className="px-6 py-4 border-r border-white/10">Equipamento / Descrição</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-48">Categoria</th>
                    <th className="px-6 py-4 border-r border-white/10 text-right w-40">Valor Reposição</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-36">Status</th>
                    <th className="px-6 py-4 text-center w-28">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading && ativos.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando ativos do parque...</td></tr>
                  ) : filteredAtivos.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">Nenhum equipamento localizado.</td></tr>
                  ) : (
                    filteredAtivos.map(ativo => {
                      let statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                      if (ativo.status === 'DISPONIVEL') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      else if (ativo.status === 'COMODATO') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      else if (ativo.status === 'MANUTENCAO') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                      else if (ativo.status === 'BAIXADO') statusColor = 'bg-red-50 text-red-700 border-red-200';

                      return (
                        <tr key={ativo.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded border border-emerald-100 uppercase whitespace-nowrap">
                              {ativo.codigo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-slate-700 uppercase">
                            <div>{ativo.descricao}</div>
                            {ativo.observacao && <div className="text-[9px] text-slate-400 normal-case italic font-semibold mt-0.5">{ativo.observacao}</div>}
                          </td>
                          <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase">{ativo.categoria?.nome}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 text-xs">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ativo.valor)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border select-none ${statusColor}`}>
                              {ativo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => openAtivoModal(ativo)} 
                                className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAtivo(ativo.id)} 
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
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
          )}


          {/* ───────────────────────────────────────────────────────────────────
              ABA 3: GESTÃO DE CONTRATOS DE COMODATO
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'contratos' && (
            <>
              {/* VISÃO LISTA */}
              {contratosViewMode === 'lista' && (
                <div className="bg-white border border-slate-300 rounded shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-widest border-none select-none">
                      <tr>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-24">Cód. Contrato</th>
                        <th className="px-6 py-4 border-r border-white/10 min-w-[360px]">Cliente</th>
                        <th className="px-6 py-4 border-r border-white/10 w-44">Empresa (Grupo)</th>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-28">Início</th>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-24">Vigência</th>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-28">Vencimento</th>
                        <th className="px-6 py-4 border-r border-white/10 text-right w-36">Consumo Mínimo</th>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-36">Equipamentos</th>
                        <th className="px-6 py-4 border-r border-white/10 text-center w-28">Situação</th>
                        <th className="px-6 py-4 text-center w-28">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                      {loading && contratos.length === 0 ? (
                        <tr><td colSpan={10} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando contratos de comodato...</td></tr>
                      ) : filteredContratos.length === 0 ? (
                        <tr><td colSpan={10} className="px-6 py-20 text-center text-slate-400 italic text-xs">Nenhum contrato de comodato localizado.</td></tr>
                      ) : (
                        filteredContratos.map(contrato => {
                          let statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                          if (contrato.status === 'VIGENTE') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          else if (contrato.status === 'RASCUNHO') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                          else if (contrato.status === 'SUSPENSO') statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                          else if (contrato.status === 'ENCERRADO') statusColor = 'bg-red-50 text-red-700 border-red-200';

                          return (
                            <tr key={contrato.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-3.5 text-center">
                                <span className="font-mono bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-0.5 text-[10px] font-black text-slate-700">
                                  #{String(contrato.codigo).padStart(4, '0')}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-800 font-extrabold uppercase min-w-[360px]">
                                <div>{contrato.client.nomeFantasia}</div>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-650 font-bold uppercase">{contrato.empresaEmissora.nomeFantasia}</td>
                              <td className="px-6 py-3.5 text-center text-xs text-slate-600">
                                {new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-3.5 text-center text-xs font-bold text-slate-800">
                                {contrato.vigenciaMeses} Meses
                              </td>
                              <td className="px-6 py-3.5 text-center text-xs text-slate-600">
                                {contrato.dataVencimento ? new Date(contrato.dataVencimento).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="px-6 py-3.5 text-right text-xs font-black text-[#1B4D3E]">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valorMinimoMensal)}
                              </td>
                              <td className="px-6 py-3.5 text-center text-[10px] text-slate-500 font-bold uppercase">
                                <div className="max-w-[200px] truncate" title={contrato.itens.map((i: any) => `${i.quantidade}x ${i.ativo.descricao}`).join(', ')}>
                                  {contrato.itens.length} Equipamento(s)
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border select-none ${statusColor}`}>
                                  {contrato.status}
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => openContratoModal(contrato)}
                                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Editar Contrato"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => { setSelectedContratoForPdf(contrato); setModalContratoPdfOpen(true); }}
                                    className="p-1.5 text-[#1B4D3E] hover:bg-[#1B4D3E]/8 rounded-lg transition-colors"
                                    title="Ver Contrato (PDF)"
                                  >
                                    <Printer size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteContrato(contrato.id)} 
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
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
              )}

              {/* VISÃO KANBAN */}
              {contratosViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                  {(['RASCUNHO', 'VIGENTE', 'SUSPENSO', 'ENCERRADO'] as const).map(colStatus => {
                    const colContratos = filteredContratos.filter(c => c.status === colStatus);
                    const titleMap = {
                      RASCUNHO: 'Rascunho',
                      VIGENTE: 'Vigente',
                      SUSPENSO: 'Suspenso',
                      ENCERRADO: 'Encerrado'
                    };
                    const colorMap = {
                      RASCUNHO: 'border-t-blue-500',
                      VIGENTE: 'border-t-emerald-500',
                      SUSPENSO: 'border-t-amber-500',
                      ENCERRADO: 'border-t-red-500'
                    };
                    return (
                      <div key={colStatus} className={`bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col min-h-[400px] border-t-4 ${colorMap[colStatus]}`}>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 mb-4 select-none">
                          <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{titleMap[colStatus]}</span>
                          <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">{colContratos.length}</span>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                          {colContratos.map(contr => (
                            <div key={contr.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3 hover:shadow-sm transition-shadow">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[9px] font-black text-slate-400">#{String(contr.codigo).padStart(4, '0')}</span>
                                <span className="text-[9px] text-slate-400 font-bold">{contr.vigenciaMeses} Meses</span>
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-black text-slate-800 uppercase leading-tight truncate">{contr.client.nomeFantasia}</h4>
                                <p className="text-[9.5px] text-slate-500 truncate">{contr.empresaEmissora.nomeFantasia}</p>
                              </div>
                              <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100/50 text-[10px] space-y-1">
                                <div className="text-slate-650 font-bold leading-tight">
                                  {contr.itens.map((it: any) => `${it.quantidade}x ${it.ativo.descricao}`).join(', ')}
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-extrabold text-[#1B4D3E] pt-1 mt-1 border-t border-slate-200/55">
                                  <span>Consumo Mínimo:</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contr.valorMinimoMensal)}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <button 
                                  onClick={() => { setSelectedContratoForPdf(contr); setModalContratoPdfOpen(true); }}
                                  className="text-[9px] font-black uppercase text-slate-500 hover:text-[#1B4D3E] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer size={10} /> Imprimir PDF
                                </button>
                                <div className="flex gap-1">
                                  {colStatus !== 'RASCUNHO' && (
                                    <button onClick={() => handleUpdateContratoStatus(contr.id, 'RASCUNHO')} className="text-[9px] font-bold text-slate-450 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-all">Desativar</button>
                                  )}
                                  {colStatus !== 'VIGENTE' && (
                                    <button onClick={() => handleUpdateContratoStatus(contr.id, 'VIGENTE')} className="text-[9px] font-black text-white bg-[#1B4D3E] hover:bg-[#13382D] px-2 py-0.5 rounded transition-all">Ativar</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {colContratos.length === 0 && (
                            <div className="py-12 text-center text-slate-350 italic text-[10px]">Arraste ou ative contratos para esta etapa.</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISÃO AGRUPADA */}
              {contratosViewMode === 'agrupado' && (
                <div className="space-y-6">
                  {getGroupedContratos().map(([groupName, groupContratos]) => (
                    <div key={groupName} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex justify-between items-center select-none">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          {contratosGroupBy === 'segmento' ? 'Segmento Cliente: ' : 'Categoria Ativo: '} {groupName}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">{groupContratos.length} Contratos</span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-150 font-semibold text-slate-700 text-xs">
                          {groupContratos.map(contrato => (
                            <tr key={contrato.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 w-28 text-center">
                                <span className="font-mono bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-0.5 text-[10px] font-black text-slate-700">
                                  #{String(contrato.codigo).padStart(4, '0')}
                                </span>
                              </td>
                              <td className="px-6 py-3 font-extrabold text-slate-800 uppercase">
                                {contrato.client.nomeFantasia}
                              </td>
                              <td className="px-6 py-3 text-slate-500 font-bold uppercase">{contrato.empresaEmissora.nomeFantasia}</td>
                              <td className="px-6 py-3 text-center text-slate-650">
                                Vigência: {contrato.vigenciaMeses} meses (Venc. {contrato.dataVencimento ? new Date(contrato.dataVencimento).toLocaleDateString('pt-BR') : '-'})
                              </td>
                              <td className="px-6 py-3 text-slate-600">
                                {contrato.itens.map((it: any) => `${it.quantidade}x ${it.ativo.descricao}`).join(', ')}
                              </td>
                              <td className="px-6 py-3 text-right font-black text-[#1B4D3E]">
                                Min: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valorMinimoMensal)}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${
                                  contrato.status === 'VIGENTE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {contrato.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                  {getGroupedContratos().length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic">Nenhum contrato localizado para agrupamento.</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              ABA 4: GESTÃO DE ORDENS DE SERVIÇO (OS)
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'ordens' && osViewMode === 'lista' && (
            <div className="bg-white border border-slate-300 rounded shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-widest border-none select-none">
                  <tr>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-28">Nº Ordem</th>
                    <th className="px-6 py-4 border-r border-white/10 min-w-[360px]">Cliente</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-36">Tipo OS</th>
                    <th className="px-6 py-4 border-r border-white/10">Equipamento Vinculado</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-36">Emissão</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-36">Data Prevista</th>
                    <th className="px-6 py-4 border-r border-white/10 w-44">Técnico Responsável</th>
                    <th className="px-6 py-4 border-r border-white/10 text-center w-40">Status</th>
                    <th className="px-6 py-4 text-center w-44">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                  {loading && ordens.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando ordens de serviço...</td></tr>
                  ) : filteredOrdens.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-400 italic text-xs">Nenhuma OS localizada.</td></tr>
                  ) : (
                    filteredOrdens.map(os => {
                      let statusColor = 'bg-slate-50 text-slate-600 border-slate-200';
                      let statusText = os.status;
                      if (os.status === 'CONCLUIDA') {
                        statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        statusText = 'Concluída';
                      } else if (os.status === 'PENDENTE') {
                        statusColor = 'bg-slate-100 text-slate-650 border-slate-200';
                        statusText = 'Backlog';
                      } else if (os.status === 'PROGRAMADO') {
                        statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                        statusText = 'Programado';
                      } else if (os.status === 'EM_DESLOCAMENTO') {
                        statusColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                        statusText = 'Em deslocamento';
                      } else if (os.status === 'EM_ANDAMENTO') {
                        statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        statusText = 'Em atendimento';
                      } else if (os.status === 'VALIDACAO') {
                        const isCancelReq = os.observacao?.includes('Cancelamento solicitado') || os.observacao?.includes('Cancelada pelo técnico') || os.observacaoAtendimento?.includes('Cancelamento solicitado') || os.observacaoAtendimento?.includes('Cancelada pelo técnico');
                        statusColor = isCancelReq 
                          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' 
                          : 'bg-purple-50 text-purple-700 border-purple-200';
                        statusText = isCancelReq ? 'Sol. Cancelamento' : 'Em Validação';
                      } else if (os.status === 'CANCELADA') {
                        statusColor = 'bg-red-50 text-red-700 border-red-200';
                        statusText = 'Cancelada';
                      }

                      return (
                        <tr 
                          key={os.id} 
                          onClick={() => openOsModal(os)} 
                          className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-0.5 text-[10px] font-black text-slate-700 whitespace-nowrap">
                                OS № {String(os.codigo).padStart(3, '0')}
                              </span>
                              {os.status === 'PROGRAMADO' && os.ordemExecucao && (
                                <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap" title="Ordem na Fila">
                                  #{os.ordemExecucao}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-800 font-extrabold uppercase min-w-[360px]">
                            <div>{os.client.nomeFantasia}</div>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className="bg-[#1B4D3E]/8 text-[#1B4D3E] text-[9px] font-black px-2 py-0.5 rounded border border-[#1B4D3E]/15 uppercase tracking-wider">
                              {os.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-600 font-semibold uppercase">
                            <div>{os.ativo.descricao}</div>
                            {os.tipo === 'TROCA' && os.ativoDestino && (
                              <div className="text-[9px] text-[#1B4D3E] font-extrabold mt-0.5 flex items-center gap-1">
                                <ChevronRight size={10} /> Substituir por: {os.ativoDestino.descricao}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-slate-500">
                            {new Date(os.dataEmissao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-slate-500">
                            {os.dataPrevista ? new Date(os.dataPrevista).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-slate-700 font-bold uppercase truncate max-w-[150px]">
                            {os.tecnicoResponsavel ? (() => {
                              const tech = usuarios.find(u => u.email === os.tecnicoEmail);
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleReassignTecnico(os); }}
                                  className="flex items-center gap-2 p-1 hover:bg-blue-50 border border-transparent hover:border-blue-150 rounded-lg text-left transition-all group/table-tech cursor-pointer max-w-full"
                                  title="Clique para alterar o técnico"
                                >
                                  {tech?.avatarUrl ? (
                                    <img 
                                      src={tech.avatarUrl} 
                                      alt={os.tecnicoResponsavel} 
                                      className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0" 
                                    />
                                  ) : (
                                    <div className="w-5 h-5 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[9px] uppercase shrink-0 border border-[#1B4D3E]/15">
                                      {os.tecnicoResponsavel.substring(0, 2)}
                                    </div>
                                  )}
                                  <span className="truncate group-hover/table-tech:text-blue-600 transition-colors">
                                    {os.tecnicoResponsavel}
                                  </span>
                                </button>
                              );
                            })() : (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleReassignTecnico(os); }}
                                className="flex items-center justify-center gap-1 p-1 px-2 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 text-amber-800 rounded-lg text-left transition-all cursor-pointer"
                                title="Atribuir Técnico"
                              >
                                <Users size={10} className="stroke-[2.5]" />
                                <span className="text-[9px] font-black uppercase">Atribuir</span>
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {updatingOsId === os.id ? (
                              <div className="flex items-center justify-center gap-1.5 text-slate-400 font-extrabold text-[10px] uppercase select-none">
                                <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div>
                                <span>Gravando...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border select-none ${statusColor}`}>
                                  {statusText}
                                </span>
                                {os.status === 'EM_DESLOCAMENTO' && os.tempoEstimadoRota !== null && os.tempoEstimadoRota !== undefined && (
                                  <span className="text-[8.5px] text-cyan-600 font-black whitespace-nowrap bg-cyan-50/50 px-1.5 py-0.5 rounded border border-cyan-100">
                                    Est: {Math.round(os.tempoEstimadoRota)}m / {os.distanciaEstimadaRota?.toFixed(1)}km
                                  </span>
                                )}
                                {(os.status === 'EM_ANDAMENTO' || os.status === 'VALIDACAO' || os.status === 'CONCLUIDA') && os.tempoRealizadoRota !== null && os.tempoRealizadoRota !== undefined && (
                                  <span className={`text-[8.5px] font-black whitespace-nowrap px-1.5 py-0.5 rounded border ${
                                    os.desvioRota 
                                      ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                                      : 'bg-emerald-50 text-emerald-755 border-emerald-100'
                                  }`}>
                                    {os.desvioRota ? '⚠️ ' : ''}{Math.round(os.tempoRealizadoRota)}m / {os.distanciaRealizadaRota?.toFixed(1)}km
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {os.status !== 'CONCLUIDA' && os.status !== 'CANCELADA' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openOsModal(os); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar OS"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedOsForPdf(os); setModalOsPdfOpen(true); }}
                                className="p-1.5 text-[#1B4D3E] hover:bg-emerald-50 rounded-lg"
                                title="Ver OS (PDF)"
                              >
                                <Printer size={13} />
                              </button>
                              
                              {os.status === 'CONCLUIDA' && (
                                <span className="text-emerald-600 p-1 flex items-center gap-0.5 text-[10px] font-black uppercase" title="Assinada e Finalizada">
                                  <CheckCircle size={14} /> Ok
                                </span>
                              )}
                              
                              {os.status === 'EM_DESLOCAMENTO' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setModalTrackOs(os); }}
                                  className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg animate-pulse"
                                  title="Rastrear Técnico em Tempo Real"
                                >
                                  <Car size={13} className="stroke-[2.5]" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteOs(os.id); }} 
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                title="Excluir OS"
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
          )}

          {activeTab === 'ordens' && osViewMode === 'kanban' && (
            <div className="pb-6 select-none bg-slate-50 pl-2 pr-1">
              <div className="flex gap-[3px] min-w-max">
                {(['PENDENTE', 'PROGRAMADO', 'EM_DESLOCAMENTO', 'EM_ANDAMENTO', 'VALIDACAO', 'CONCLUIDA', 'CANCELADA'] as const).map((colStatus, idx) => {
                  const colOrdens = filteredOrdens.filter(o => o.status === colStatus);
                  const isFirst = idx === 0;
                  const isLast = idx === 6;

                  const titleMap = {
                    PENDENTE: 'Backlog',
                    PROGRAMADO: 'Programado',
                    EM_DESLOCAMENTO: 'Em Deslocamento',
                    EM_ANDAMENTO: 'Em atendimento',
                    VALIDACAO: 'Em Validação',
                    CONCLUIDA: 'Concluída',
                    CANCELADA: 'Cancelada'
                  };

                  const configMap = {
                    PENDENTE: { hex: '#64748B', contrast: 'white', bg: 'rgba(100, 116, 139, 0.06)', border: 'rgba(100, 116, 139, 0.18)' },
                    PROGRAMADO: { hex: '#3B82F6', contrast: 'white', bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.18)' },
                    EM_DESLOCAMENTO: { hex: '#06B6D4', contrast: 'white', bg: 'rgba(6, 182, 212, 0.06)', border: 'rgba(6, 182, 212, 0.18)' },
                    EM_ANDAMENTO: { hex: '#F59E0B', contrast: 'black', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
                    VALIDACAO: { hex: '#A855F7', contrast: 'white', bg: 'rgba(168, 85, 247, 0.06)', border: 'rgba(168, 85, 247, 0.18)' },
                    CONCLUIDA: { hex: '#10B981', contrast: 'white', bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.18)' },
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
                        const osId = e.dataTransfer.getData('text/plain');
                        handleUpdateOsStatus(osId, colStatus);
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
                                {colOrdens.length} {colOrdens.length === 1 ? 'ordem' : 'ordens'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cards list with customized scroll background */}
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
                          {colOrdens.map(os => (
                            <div 
                              key={os.id} 
                              className={`relative bg-white border border-slate-200 hover:border-[#1B4D3E]/30 rounded-xl p-3 shadow-xs space-y-2 hover:shadow-sm transition-all text-left cursor-pointer ${
                                updatingOsId === os.id ? 'opacity-65 pointer-events-none select-none' : ''
                              }`}
                              draggable={updatingOsId !== os.id}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', os.id);
                              }}
                              onClick={() => openOsModal(os)}
                            >
                              {updatingOsId === os.id && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
                                  <div className="w-5.5 h-5.5 border-2 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin"></div>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] font-black text-slate-700 bg-slate-100 border border-slate-200/80 rounded px-1.5 py-0.5 whitespace-nowrap">
                                    OS № {String(os.codigo).padStart(3, '0')}
                                  </span>
                                  {os.status === 'PROGRAMADO' && os.ordemExecucao && (
                                    <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap" title="Ordem na Fila">
                                      #{os.ordemExecucao}
                                    </span>
                                  )}
                                  {os.status === 'VALIDACAO' && (os.observacao?.includes('Cancelamento solicitado') || os.observacao?.includes('Cancelada pelo técnico') || os.observacaoAtendimento?.includes('Cancelamento solicitado') || os.observacaoAtendimento?.includes('Cancelada pelo técnico')) && (
                                    <span className="text-[9px] font-black bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 whitespace-nowrap animate-pulse" title="Solicitação de Cancelamento">
                                      Sol. Cancelamento
                                    </span>
                                  )}
                                  {os.status === 'EM_DESLOCAMENTO' && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setModalTrackOs(os); }}
                                      className="p-1 text-cyan-600 hover:bg-cyan-50 rounded-md animate-pulse cursor-pointer flex items-center"
                                      title="Rastrear Técnico em Tempo Real"
                                    >
                                      <Car size={11} className="stroke-[2.5]" />
                                    </button>
                                  )}
                                </div>
                                <span className="text-[9px] text-[#1B4D3E] font-black uppercase tracking-wider">{os.tipo}</span>
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="text-[10px] font-extrabold text-slate-800 uppercase leading-tight truncate" title={os.client.nomeFantasia}>{os.client.nomeFantasia}</h4>
                                <p className="text-[9.5px] text-slate-500 truncate font-semibold uppercase" title={os.ativo.descricao}>{os.ativo.descricao}</p>
                              </div>
                              <div className="bg-slate-50/60 rounded-lg p-2 border border-slate-100/50 text-[9.5px] space-y-2">
                                {os.tecnicoResponsavel ? (() => {
                                  const tech = usuarios.find(u => u.email === os.tecnicoEmail);
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReassignTecnico(os);
                                      }}
                                      className="w-full flex items-center gap-2 p-1 bg-white hover:bg-blue-50/40 border border-slate-150 hover:border-blue-200 rounded-lg text-left transition-all group/tech cursor-pointer"
                                      title="Clique para alterar o técnico"
                                    >
                                      {tech?.avatarUrl ? (
                                        <img 
                                          src={tech.avatarUrl} 
                                          alt={os.tecnicoResponsavel} 
                                          className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 shrink-0" 
                                        />
                                      ) : (
                                        <div className="w-5.5 h-5.5 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-[9px] uppercase shrink-0 border border-[#1B4D3E]/15">
                                          {os.tecnicoResponsavel.substring(0, 2)}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider leading-none">Técnico</p>
                                        <p className="text-[9.5px] font-extrabold text-slate-700 uppercase truncate mt-0.5 group-hover/tech:text-blue-600 transition-colors">
                                          {os.tecnicoResponsavel}
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
                                      handleReassignTecnico(os);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 p-1 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 text-amber-800 rounded-lg text-left transition-all cursor-pointer"
                                    title="Atribuir Técnico"
                                  >
                                    <Users size={10} className="stroke-[2.5]" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">Atribuir Técnico</span>
                                  </button>
                                )}
                                {os.status === 'EM_DESLOCAMENTO' && os.tempoEstimadoRota !== null && os.tempoEstimadoRota !== undefined && (
                                  <div className="text-[9.5px] px-1 flex justify-between items-center text-cyan-600 bg-cyan-50/40 p-1 rounded border border-cyan-100/60">
                                    <span className="font-extrabold">Est. Rota:</span>
                                    <span className="font-black">{Math.round(os.tempoEstimadoRota)} min ({os.distanciaEstimadaRota?.toFixed(1)} km)</span>
                                  </div>
                                )}

                                {(os.status === 'EM_ANDAMENTO' || os.status === 'VALIDACAO' || os.status === 'CONCLUIDA') && os.tempoRealizadoRota !== null && os.tempoRealizadoRota !== undefined && (
                                  <div className={`text-[9.5px] px-1 flex justify-between items-center p-1 rounded border ${
                                    os.desvioRota 
                                      ? 'text-rose-600 bg-rose-50/40 border-rose-100/60 animate-pulse' 
                                      : 'text-emerald-700 bg-emerald-50/40 border-emerald-100/60'
                                  }`}>
                                    <span className="font-extrabold flex items-center gap-0.5">
                                      {os.desvioRota ? '⚠️ Rota (Desvio):' : '✓ Rota Realizada:'}
                                    </span>
                                    <span className="font-black">
                                      {Math.round(os.tempoRealizadoRota)} min ({os.distanciaRealizadaRota?.toFixed(1)} km)
                                    </span>
                                  </div>
                                )}

                                <div className="text-slate-500 font-bold px-1 flex justify-between items-center">
                                  <span className="text-slate-400 font-extrabold">Previsto:</span>
                                  <span className="text-slate-700 font-extrabold">{os.dataPrevista ? new Date(os.dataPrevista).toLocaleDateString('pt-BR') : '-'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {colOrdens.length === 0 && (
                            <div 
                              onClick={() => openOsModal()}
                              className="border border-dashed border-slate-300 hover:border-[#1B4D3E]/40 rounded-lg py-10 flex flex-col items-center justify-center gap-2 flex-1 cursor-pointer transition-all hover:bg-white/50 group/empty"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-505 flex items-center justify-center group-hover/empty:bg-[#1B4D3E]/10 group-hover/empty:text-[#1B4D3E] transition-colors">
                                <Plus size={16} />
                              </div>
                              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider group-hover/empty:text-[#1B4D3E] transition-colors">Sem ordens</p>
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

          {activeTab === 'kpis' && (() => {
            const totalAtivos = ativos.length;
            const alocadosAtivos = ativos.filter(a => a.status === 'COMODATO').length;
            const alocadosPercent = totalAtivos > 0 ? (alocadosAtivos / totalAtivos) * 100 : 0;

            const filteredKpiOrdens = ordens.filter(os => {
              if (!os.createdAt) return false;
              if (selectedKpiTecnico && os.tecnicoEmail !== selectedKpiTecnico) return false;

              const osDate = new Date(os.createdAt);
              const now = new Date();
              
              if (selectedKpiPeriodType === '7d') {
                const diffTime = now.getTime() - osDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 7;
              }
              if (selectedKpiPeriodType === '14d') {
                const diffTime = now.getTime() - osDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 14;
              }
              if (selectedKpiPeriodType === '28d') {
                const diffTime = now.getTime() - osDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 28;
              }
              if (selectedKpiPeriodType === 'mes') {
                const osYearMonth = `${osDate.getFullYear()}-${String(osDate.getMonth() + 1).padStart(2, '0')}`;
                return osYearMonth === selectedKpiMonth;
              }
              if (selectedKpiPeriodType === 'ano') {
                return osDate.getFullYear() === now.getFullYear();
              }
              if (selectedKpiPeriodType === 'custom') {
                const start = new Date(kpiCustomStart + 'T00:00:00');
                const end = new Date(kpiCustomEnd + 'T23:59:59');
                return osDate >= start && osDate <= end;
              }
              return true;
            });

            const totalOs = filteredKpiOrdens.length;
            const uniqueClients = new Set(filteredKpiOrdens.map(os => os.clientId));
            const totalClientesAtendidos = uniqueClients.size;

            const completedKpiOrdens = filteredKpiOrdens.filter(os => os.status === 'CONCLUIDA' && os.dataExecucao && os.createdAt);
            let slaMedioDias = 0;
            if (completedKpiOrdens.length > 0) {
              const totalSlaMs = completedKpiOrdens.reduce((acc, os) => {
                const diff = new Date(os.dataExecucao).getTime() - new Date(os.createdAt).getTime();
                return acc + diff;
              }, 0);
              slaMedioDias = totalSlaMs / (1000 * 60 * 60 * 24) / completedKpiOrdens.length;
            }

            const ativosPorCategoria = ativos.reduce((acc, a) => {
              const catName = a.categoria?.nome || 'Sem Categoria';
              acc[catName] = (acc[catName] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const statusLabels: Record<string, string> = {
              DISPONIVEL: 'Disponível',
              COMODATO: 'Comodato (Alocado)',
              MANUTENCAO: 'Manutenção',
              BAIXADO: 'Baixado'
            };
            const statusColors: Record<string, string> = {
              DISPONIVEL: 'bg-emerald-500',
              COMODATO: 'bg-blue-500',
              MANUTENCAO: 'bg-amber-500',
              BAIXADO: 'bg-slate-400'
            };
            const ativosPorStatus = ativos.reduce((acc, a) => {
              acc[a.status] = (acc[a.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const osTypesLabel: Record<string, string> = {
              INSTALACAO: 'Instalação',
              RETIRADA: 'Retirada',
              TROCA: 'Troca',
              MANUTENCAO: 'Manutenção'
            };
            const osPorTipo = filteredKpiOrdens.reduce((acc, os) => {
              acc[os.tipo] = (acc[os.tipo] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const clientCounts = filteredKpiOrdens.reduce((acc, os) => {
              const name = os.client?.nomeFantasia || 'Cliente Desconhecido';
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const rankingClientes = Object.entries(clientCounts)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            const assetCounts = filteredKpiOrdens.reduce((acc, os) => {
              const desc = os.ativo?.descricao || 'Equipamento Desconhecido';
              acc[desc] = (acc[desc] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const rankingAtivos = Object.entries(assetCounts)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            const last6Months = Array.from({ length: 6 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              return {
                label: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
                yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                count: 0
              };
            }).reverse();

            ordens.forEach(os => {
              if (os.tipo === 'MANUTENCAO' && os.status === 'CONCLUIDA' && os.dataExecucao) {
                const execDate = new Date(os.dataExecucao);
                const execYearMonth = `${execDate.getFullYear()}-${String(execDate.getMonth() + 1).padStart(2, '0')}`;
                const entry = last6Months.find(m => m.yearMonth === execYearMonth);
                if (entry) entry.count += 1;
              }
            });
            const maxMaintenanceCount = Math.max(...last6Months.map(m => m.count), 1);

            const techList = usuarios.filter(u => {
              const isTechCargo = u.cargo?.toLowerCase().includes('tecnico') || u.cargo?.toLowerCase().includes('técnico');
              const hasAssignedOs = ordens.some(os => os.tecnicoEmail === u.email);
              return isTechCargo || hasAssignedOs;
            });

            const techStats = techList.map(tech => {
              const techOrdens = filteredKpiOrdens.filter(os => os.tecnicoEmail === tech.email);
              const totalTechOs = techOrdens.length;
              
              const deslocamentoMin = techOrdens.reduce((acc, os) => acc + (os.tempoRealizadoRota || 0), 0);
              const atendimentoMin = techOrdens.reduce((acc, os) => {
                if (os.status === 'CONCLUIDA' && os.dataExecucao && os.atendimentoIniciadoEm) {
                  const diff = new Date(os.dataExecucao).getTime() - new Date(os.atendimentoIniciadoEm).getTime();
                  return acc + (diff / 60000);
                }
                return acc;
              }, 0);
              const tempoTotalMin = deslocamentoMin + atendimentoMin;
              const tempoTotalHoras = tempoTotalMin / 60;
              const kmRodados = techOrdens.reduce((acc, os) => acc + (os.distanciaRealizadaRota || 0), 0);
              const percentAlocacao = (tempoTotalHoras / 176) * 100;

              return {
                ...tech,
                totalTechOs,
                deslocamentoMin,
                atendimentoMin,
                tempoTotalMin,
                tempoTotalHoras,
                kmRodados,
                percentAlocacao
              };
            });

            const totalKmRodados = techStats.reduce((acc, t) => acc + t.kmRodados, 0);
            const totalHoursTech = techStats.reduce((acc, t) => acc + t.tempoTotalHoras, 0);

            // Custom variables for Donut charts (Status and OS Types)
            const statusHexColors: Record<string, string> = {
              DISPONIVEL: '#10B981', // emerald-500
              COMODATO: '#3B82F6', // blue-500
              MANUTENCAO: '#F59E0B', // amber-500
              BAIXADO: '#94A3B8' // slate-400
            };

            const statusList = Object.entries(statusLabels).map(([status, label]) => {
              const count = ativosPorStatus[status] || 0;
              const pct = totalAtivos > 0 ? (count / totalAtivos) * 100 : 0;
              return { status, label, count, pct, color: statusHexColors[status] || '#94A3B8' };
            });

            let accumulatedStatusPercent = 0;
            const statusSlices = statusList.map(item => {
              const startAngle = -90 + (accumulatedStatusPercent / 100) * 360;
              const strokeDashArray = `${(item.pct / 100) * 238.76} 238.76`;
              accumulatedStatusPercent += item.pct;
              return { ...item, startAngle, strokeDashArray };
            });

            const osTypeHexColors: Record<string, string> = {
              INSTALACAO: '#3B82F6', // blue
              RETIRADA: '#EF4444', // red
              TROCA: '#A855F7', // purple
              MANUTENCAO: '#F59E0B' // amber
            };

            const osTypeList = Object.entries(osTypesLabel).map(([tipo, label]) => {
              const count = osPorTipo[tipo] || 0;
              const pct = totalOs > 0 ? (count / totalOs) * 100 : 0;
              return { tipo, label, count, pct, color: osTypeHexColors[tipo] || '#94A3B8' };
            });

            let accumulatedOsPercent = 0;
            const osSlices = osTypeList.map(item => {
              const startAngle = -90 + (accumulatedOsPercent / 100) * 360;
              const strokeDashArray = `${(item.pct / 100) * 238.76} 238.76`;
              accumulatedOsPercent += item.pct;
              return { ...item, startAngle, strokeDashArray };
            });

            return (
              <div className="space-y-6">
                {/* FILTROS BAR */}
                <div className="flex flex-wrap gap-4 items-center justify-between bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl p-4 select-none shadow-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-[#1B4D3E]" size={18} />
                    <span className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider">Filtros de Período & Operação</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Dropdown Period Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período:</span>
                      <select
                        value={selectedKpiPeriodType}
                        onChange={(e) => setSelectedKpiPeriodType(e.target.value as any)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                      >
                        <option value="7d">Últimos 7 Dias</option>
                        <option value="14d">Últimos 14 Dias</option>
                        <option value="28d">Últimos 28 Dias</option>
                        <option value="mes">Este Mês</option>
                        <option value="ano">Este Ano</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>

                    {/* Navigation for Month */}
                    {selectedKpiPeriodType === 'mes' && (
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1 shadow-xs animate-fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            const [yearStr, monthStr] = selectedKpiMonth.split('-');
                            const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
                            date.setMonth(date.getMonth() - 1);
                            setSelectedKpiMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
                          }}
                          className="text-slate-500 hover:text-[#1B4D3E] transition-colors p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="Mês Anterior"
                        >
                          <ChevronRight className="rotate-180" size={16} />
                        </button>
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest min-w-[110px] text-center">
                          {(() => {
                            const [yearStr, monthStr] = selectedKpiMonth.split('-');
                            const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
                            return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                          })()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const [yearStr, monthStr] = selectedKpiMonth.split('-');
                            const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
                            date.setMonth(date.getMonth() + 1);
                            setSelectedKpiMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
                          }}
                          className="text-slate-500 hover:text-[#1B4D3E] transition-colors p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                          title="Próximo Mês"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    {/* Custom Range Date Pickers */}
                    {selectedKpiPeriodType === 'custom' && (
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1 shadow-xs animate-fade-in">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">De:</span>
                          <input
                            type="date"
                            value={kpiCustomStart}
                            onChange={(e) => setKpiCustomStart(e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-150 pl-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Até:</span>
                          <input
                            type="date"
                            value={kpiCustomEnd}
                            onChange={(e) => setKpiCustomEnd(e.target.value)}
                            className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Technical selector */}
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico:</span>
                      <select
                        value={selectedKpiTecnico}
                        onChange={(e) => setSelectedKpiTecnico(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                      >
                        <option value="">Todos os Técnicos</option>
                        {techList.map(u => (
                          <option key={u.id} value={u.email}>{u.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 1: DESTAQUES & SLA GAUGE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Grid de 4 Cards de Métricas */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Card 1: Total Ativos */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-[#1B4D3E]/10 group-hover:text-[#1B4D3E] transition-colors duration-300">
                        <Boxes size={22} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total de Ativos</p>
                        <h4 className="text-2.5xl font-black text-slate-850 leading-none">{totalAtivos}</h4>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mt-1">Patrimônio Geral</span>
                      </div>
                    </div>

                    {/* Card 2: Ativos Alocados */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100/50 group-hover:text-blue-700 transition-colors duration-300">
                        <FileCheck size={22} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Ativos Alocados</p>
                        <div className="flex items-baseline gap-1.5">
                          <h4 className="text-2.5xl font-black text-slate-850 leading-none">{alocadosAtivos}</h4>
                          <span className="text-xs font-black text-blue-650">({alocadosPercent.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${alocadosPercent}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Total OS */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100/50 group-hover:text-emerald-800 transition-colors duration-300">
                        <Wrench size={22} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total de OSs</p>
                        <h4 className="text-2.5xl font-black text-slate-850 leading-none">{totalOs}</h4>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mt-1">Neste Período</span>
                      </div>
                    </div>

                    {/* Card 4: Clientes Atendidos */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4 hover:shadow-sm transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-650 flex items-center justify-center shrink-0 group-hover:bg-purple-100/50 group-hover:text-purple-700 transition-colors duration-300">
                        <Users size={22} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Clientes Atendidos</p>
                        <h4 className="text-2.5xl font-black text-slate-850 leading-none">{totalClientesAtendidos}</h4>
                        <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mt-1">Portfólio Ativo</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Velocímetro: SLA Médio */}
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between items-center text-center relative overflow-hidden group hover:shadow-sm transition-all duration-300">
                    <header className="w-full flex justify-between items-center border-b border-slate-100 pb-2.5 select-none">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Médio de Atendimento</span>
                      {(() => {
                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        let label = 'Sem Dados';
                        if (slaMedioDias > 0) {
                          if (slaMedioDias < 3) {
                            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                            label = 'EXCELENTE';
                          } else if (slaMedioDias < 5) {
                            badgeColor = 'bg-blue-50 text-blue-700 border-blue-150';
                            label = 'CONFORME';
                          } else if (slaMedioDias < 7) {
                            badgeColor = 'bg-amber-50 text-amber-700 border-amber-150';
                            label = 'ATENÇÃO';
                          } else {
                            badgeColor = 'bg-rose-50 text-rose-700 border-rose-150';
                            label = 'CRÍTICO';
                          }
                        }
                        return (
                          <span className={`text-[8.5px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </header>

                    <div className="py-4 w-full flex justify-center items-center relative min-h-[140px]">
                      {(() => {
                        const val = Math.min(10, Math.max(0, slaMedioDias));
                        // Angle from -90deg (0 days) to +90deg (10+ days)
                        const needleAngle = -90 + (val / 10) * 180;
                        return (
                          <div className="relative w-[180px] h-[100px] flex items-center justify-center overflow-visible">
                            <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible select-none">
                              <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#10B981" />   {/* Emerald */}
                                  <stop offset="45%" stopColor="#F59E0B" />  {/* Amber */}
                                  <stop offset="75%" stopColor="#EF4444" />  {/* Red */}
                                  <stop offset="100%" stopColor="#B91C1C" /> {/* Dark Red */}
                                </linearGradient>
                                <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.25"/>
                                </filter>
                              </defs>
                              {/* Background track */}
                              <path 
                                d="M 20 110 A 80 80 0 0 1 180 110" 
                                fill="none" 
                                stroke="#F1F5F9" 
                                strokeWidth="16" 
                                strokeLinecap="round" 
                              />
                              {/* Colored gradient track */}
                              <path 
                                d="M 20 110 A 80 80 0 0 1 180 110" 
                                fill="none" 
                                stroke="url(#gaugeGradient)" 
                                strokeWidth="16" 
                                strokeLinecap="round" 
                              />
                              
                              {/* Ticks */}
                              {[0, 2, 4, 6, 8, 10].map((tick) => {
                                const angle = -90 + (tick / 10) * 180;
                                const angleRad = (angle * Math.PI) / 180;
                                const x1 = 100 + 80 * Math.cos(angleRad);
                                const y1 = 110 + 80 * Math.sin(angleRad);
                                const x2 = 100 + 90 * Math.cos(angleRad);
                                const y2 = 110 + 90 * Math.sin(angleRad);
                                return (
                                  <line 
                                    key={tick}
                                    x1={x1} 
                                    y1={y1} 
                                    x2={x2} 
                                    y2={y2} 
                                    stroke="#FFFFFF" 
                                    strokeWidth="2.5" 
                                  />
                                );
                              })}

                              {/* Needle */}
                              <g style={{ 
                                transform: `rotate(${needleAngle}deg)`, 
                                transformOrigin: '100px 110px', 
                                transition: 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                              }}
                                filter="url(#needleShadow)"
                              >
                                <path 
                                  d="M 96 110 L 99.2 15 L 100.8 15 L 104 110 Z" 
                                  fill="#1E293B" 
                                />
                                <circle cx="100" cy="110" r="10" fill="#1E293B" />
                                <circle cx="100" cy="110" r="4" fill="#FFFFFF" />
                              </g>
                            </svg>
                          </div>
                        );
                      })()}
                      
                      {/* Centered days indicator */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-center select-none">
                        <span className="text-3xl font-black text-slate-800 leading-none drop-shadow-xs animate-pulse">
                          {slaMedioDias > 0 ? `${slaMedioDias.toFixed(1)}` : 'N/A'}
                        </span>
                        <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mt-1">Dias de SLA</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: PARQUE DE ATIVOS & CURVA DE MANUTENÇÃO */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bloco Parque de Ativos */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs hover:shadow-sm transition-all duration-300">
                    <header className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                        <Boxes size={16} className="stroke-[2.5]" /> Parque de Ativos & Categorias
                      </h3>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Donut Chart Status */}
                      <div className="flex flex-col items-center justify-center relative bg-slate-50/40 rounded-2xl p-4 border border-slate-100">
                        <div className="w-[150px] h-[150px] relative flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 select-none">
                            {totalAtivos === 0 ? (
                              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                            ) : (
                              statusSlices.map((slice) => {
                                const isHovered = hoveredKpiStatus === slice.status;
                                return (
                                  <circle
                                    key={slice.status}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={slice.color}
                                    strokeWidth={isHovered ? 12 : 8}
                                    strokeDasharray={slice.strokeDashArray}
                                    transform={`rotate(${slice.startAngle} 50 50)`}
                                    className="transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setHoveredKpiStatus(slice.status)}
                                    onMouseLeave={() => setHoveredKpiStatus(null)}
                                  />
                                );
                              })
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
                            {hoveredKpiStatus ? (
                              (() => {
                                const activeItem = statusList.find(s => s.status === hoveredKpiStatus);
                                return (
                                  <>
                                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{activeItem?.label}</span>
                                    <span className="text-xl font-black text-slate-850 leading-none mt-0.5">{activeItem?.count}</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">({activeItem?.pct.toFixed(1)}%)</span>
                                  </>
                                );
                              })()
                            ) : (
                              <>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Ativos</span>
                                <span className="text-2xl font-black text-slate-800 leading-none mt-0.5">{totalAtivos}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Legenda Customizada */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 w-full select-none">
                          {statusList.map(item => {
                            const isHovered = hoveredKpiStatus === item.status;
                            return (
                              <div 
                                key={item.status} 
                                className={`flex items-center gap-1.5 p-1 rounded-lg transition-all duration-200 ${isHovered ? 'bg-slate-100/80 scale-102' : ''}`}
                                onMouseEnter={() => setHoveredKpiStatus(item.status)}
                                onMouseLeave={() => setHoveredKpiStatus(null)}
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }}></span>
                                <span className="text-[9px] font-bold text-slate-655 truncate uppercase leading-none">
                                  {item.label}: <strong className="text-slate-850 font-black">{item.count}</strong>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Categorias Principais */}
                      <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5 select-none">Categorias Principais</span>
                        {Object.entries(ativosPorCategoria).length === 0 ? (
                          <p className="text-[10.5px] font-bold text-slate-400 text-center py-10">Nenhum ativo cadastrado.</p>
                        ) : (
                          Object.entries(ativosPorCategoria)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 4)
                            .map(([catName, count]) => {
                              const pct = totalAtivos > 0 ? (count / totalAtivos) * 100 : 0;
                              return (
                                <div key={catName} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-655 uppercase">
                                    <span className="truncate max-w-[130px] font-extrabold text-slate-800">{catName}</span>
                                    <span className="font-black text-slate-700">{count} ({pct.toFixed(0)}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                    <div className="h-full bg-teal-650 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloco Atendimentos & Curva */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xs hover:shadow-sm transition-all duration-300">
                    <header className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                        <Wrench size={16} className="stroke-[2.5]" /> Serviços & Curva de Manutenção
                      </h3>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Donut Chart OS Types */}
                      <div className="flex flex-col items-center justify-center relative bg-slate-50/40 rounded-2xl p-4 border border-slate-100">
                        <div className="w-[150px] h-[150px] relative flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 select-none">
                            {totalOs === 0 ? (
                              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                            ) : (
                              osSlices.map((slice) => {
                                const isHovered = hoveredKpiOsType === slice.tipo;
                                return (
                                  <circle
                                    key={slice.tipo}
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    fill="transparent"
                                    stroke={slice.color}
                                    strokeWidth={isHovered ? 12 : 8}
                                    strokeDasharray={slice.strokeDashArray}
                                    transform={`rotate(${slice.startAngle} 50 50)`}
                                    className="transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setHoveredKpiOsType(slice.tipo)}
                                    onMouseLeave={() => setHoveredKpiOsType(null)}
                                  />
                                );
                              })
                            )}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
                            {hoveredKpiOsType ? (
                              (() => {
                                const activeItem = osTypeList.find(o => o.tipo === hoveredKpiOsType);
                                return (
                                  <>
                                    <span className="text-[7.5px] font-black text-slate-405 uppercase tracking-widest truncate max-w-[100px]">{activeItem?.label}</span>
                                    <span className="text-xl font-black text-slate-850 leading-none mt-0.5">{activeItem?.count}</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">({activeItem?.pct.toFixed(1)}%)</span>
                                  </>
                                );
                              })()
                            ) : (
                              <>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total OSs</span>
                                <span className="text-2xl font-black text-slate-800 leading-none mt-0.5">{totalOs}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Legenda Customizada */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 w-full select-none">
                          {osTypeList.map(item => {
                            const isHovered = hoveredKpiOsType === item.tipo;
                            return (
                              <div 
                                key={item.tipo} 
                                className={`flex items-center gap-1.5 p-1 rounded-lg transition-all duration-200 ${isHovered ? 'bg-slate-100/80 scale-102' : ''}`}
                                onMouseEnter={() => setHoveredKpiOsType(item.tipo)}
                                onMouseLeave={() => setHoveredKpiOsType(null)}
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }}></span>
                                <span className="text-[9px] font-bold text-slate-655 truncate uppercase leading-none">
                                  {item.label}: <strong className="text-slate-850 font-black">{item.count}</strong>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Curva de Manutenção */}
                      <div className="space-y-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1.5 select-none">Curva de Manutenção</span>
                        <div className="relative pt-2 h-[115px] w-full flex items-center justify-center">
                          {(() => {
                            const chartPoints = last6Months.map((m, idx) => {
                              const x = 25 + idx * 40;
                              const y = 90 - (m.count / maxMaintenanceCount) * 70;
                              return { x, y, label: m.label, count: m.count };
                            });

                            // Calculate smooth Bezier path
                            let linePathD = '';
                            if (chartPoints.length > 0) {
                              linePathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
                              for (let i = 0; i < chartPoints.length - 1; i++) {
                                const p0 = chartPoints[i];
                                const p1 = chartPoints[i + 1];
                                const cp1x = p0.x + (p1.x - p0.x) / 3;
                                const cp1y = p0.y;
                                const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                                const cp2y = p1.y;
                                linePathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                              }
                            }
                            const areaPathD = linePathD 
                              ? `${linePathD} L ${chartPoints[chartPoints.length - 1].x} 90 L ${chartPoints[0].x} 90 Z`
                              : '';

                            return (
                              <svg viewBox="0 0 250 110" className="w-full h-full overflow-visible select-none">
                                <defs>
                                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#1B4D3E" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#1B4D3E" stopOpacity="0.0" />
                                  </linearGradient>
                                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#1B4D3E" />
                                    <stop offset="100%" stopColor="#34D399" />
                                  </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <line x1="20" y1="90" x2="235" y2="90" stroke="#F1F5F9" strokeWidth="1.5" />
                                <line x1="20" y1="55" x2="235" y2="55" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                                <line x1="20" y1="20" x2="235" y2="20" stroke="#F8FAFC" strokeWidth="1" strokeDasharray="3 3" />
                                
                                {/* Area */}
                                {areaPathD && <path d={areaPathD} fill="url(#areaGradient)" />}
                                {/* Line */}
                                {linePathD && (
                                  <path 
                                    d={linePathD} 
                                    fill="none" 
                                    stroke="url(#lineGradient)" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                  />
                                )}
                                
                                {/* Dots & Labels */}
                                {chartPoints.map((p, idx) => {
                                  const isHovered = hoveredKpiMonthIndex === idx;
                                  return (
                                    <g 
                                      key={idx} 
                                      className="cursor-pointer"
                                      onMouseEnter={() => setHoveredKpiMonthIndex(idx)}
                                      onMouseLeave={() => setHoveredKpiMonthIndex(null)}
                                    >
                                      {/* Outer glowing pulse on hover */}
                                      {isHovered && (
                                        <circle cx={p.x} cy={p.y} r="8" fill="#1B4D3E" fillOpacity="0.15" />
                                      )}
                                      <circle 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r={isHovered ? 5.5 : 4} 
                                        fill="#FFFFFF" 
                                        stroke="#1B4D3E" 
                                        strokeWidth={isHovered ? 3.5 : 2.5} 
                                        className="transition-all duration-200"
                                      />
                                      
                                      {/* Axis Label */}
                                      <text 
                                        x={p.x} 
                                        y="105" 
                                        textAnchor="middle" 
                                        fill={isHovered ? "#1B4D3E" : "#94A3B8"} 
                                        className="text-[8.5px] font-black uppercase transition-colors duration-200"
                                      >
                                        {p.label}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            );
                          })()}

                          {/* Absolute HTML Tooltip */}
                          {hoveredKpiMonthIndex !== null && (
                            (() => {
                              const p = last6Months[hoveredKpiMonthIndex];
                              const leftPercent = 10 + hoveredKpiMonthIndex * 16;
                              return (
                                <div 
                                  className="absolute bg-slate-800 text-white text-[9.5px] font-black px-2.5 py-1 rounded-lg shadow-md pointer-events-none animate-fade-in whitespace-nowrap"
                                  style={{ 
                                    left: `${leftPercent}%`, 
                                    bottom: '65px',
                                    transform: 'translateX(-50%)' 
                                  }}
                                >
                                  {p.count} {p.count === 1 ? 'Manutenção' : 'Manutenções'}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 3: RANKINGS DE CLIENTES & ATIVOS COM QUANTIDADE E PERCENTUAL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ranking Clientes */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-all duration-300">
                    <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 select-none">
                      <Users size={16} className="stroke-[2.5]" /> Clientes com Maior Volume de Atendimentos
                    </h3>
                    <div className="space-y-4 select-text">
                      {rankingClientes.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 text-center py-8">Nenhum atendimento registrado no período.</p>
                      ) : (
                        rankingClientes.map((item, idx) => {
                          const pct = totalOs > 0 ? (item.count / totalOs) * 100 : 0;
                          return (
                            <div key={item.name} className="space-y-1.5 group">
                              <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-655">
                                <span className="truncate max-w-[240px] text-slate-800 font-extrabold uppercase flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-black shrink-0 ${
                                    idx === 0 ? 'bg-amber-100 text-amber-800 shadow-xs border border-amber-200' :
                                    idx === 1 ? 'bg-slate-200 text-slate-850 shadow-xs border border-slate-300' :
                                    idx === 2 ? 'bg-amber-500/10 text-amber-900 shadow-xs border border-amber-300/30' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  {item.name}
                                </span>
                                <span className="text-[#1B4D3E] font-black shrink-0 bg-[#1B4D3E]/5 px-2 py-0.5 rounded border border-[#1b4d3e]/10 text-[10px] select-none group-hover:bg-[#1B4D3E]/10 transition-colors">
                                  {item.count} {item.count === 1 ? 'OS' : 'OSs'} ({pct.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#1B4D3E] to-[#34D399] rounded-full transition-all duration-700 ease-out origin-left group-hover:brightness-105" 
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Ranking Ativos */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-sm transition-all duration-300">
                    <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 select-none">
                      <Boxes size={16} className="stroke-[2.5]" /> Equipamentos com Maior Volume de Atendimentos
                    </h3>
                    <div className="space-y-4 select-text">
                      {rankingAtivos.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 text-center py-8">Nenhum equipamento atendido no período.</p>
                      ) : (
                        rankingAtivos.map((item, idx) => {
                          const pct = totalOs > 0 ? (item.count / totalOs) * 100 : 0;
                          return (
                            <div key={item.name} className="space-y-1.5 group">
                              <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-655">
                                <span className="truncate max-w-[240px] text-slate-800 font-extrabold uppercase flex items-center gap-1.5">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-black shrink-0 ${
                                    idx === 0 ? 'bg-amber-100 text-amber-800 shadow-xs border border-amber-200' :
                                    idx === 1 ? 'bg-slate-200 text-slate-850 shadow-xs border border-slate-300' :
                                    idx === 2 ? 'bg-amber-500/10 text-amber-900 shadow-xs border border-amber-300/30' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  {item.name}
                                </span>
                                <span className="text-blue-750 font-black shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-150 text-[10px] select-none group-hover:bg-blue-100/80 transition-colors">
                                  {item.count} {item.count === 1 ? 'OS' : 'OSs'} ({pct.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-100">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700 ease-out origin-left group-hover:brightness-105" 
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* TABELA OPERACIONAL DOS TÉCNICOS */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs border-slate-200/60">
                  <header className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="stroke-[2.5]" /> Produtividade e Utilização dos Técnicos
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                      <span>Total Km: <strong className="text-slate-700">{totalKmRodados.toFixed(1)} km</strong></span>
                      <span>Total Horas: <strong className="text-slate-700">{totalHoursTech.toFixed(1)}h</strong></span>
                    </div>
                  </header>

                  <div className="overflow-x-auto min-h-0 border border-slate-200 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#1B4D3E] text-white text-[10px] font-black uppercase tracking-wider border-b border-[#1B4D3E]">
                          <th className="px-5 py-3 border-r border-white/10">Técnico</th>
                          <th className="px-5 py-3 border-r border-white/10 text-center">Ordens (OS)</th>
                          <th className="px-5 py-3 border-r border-white/10 text-center">Deslocamento</th>
                          <th className="px-5 py-3 border-r border-white/10 text-center">Atendimento Local</th>
                          <th className="px-5 py-3 border-r border-white/10 text-center">Tempo Total</th>
                          <th className="px-5 py-3 border-r border-white/10 text-center">Distância Rodada</th>
                          <th className="px-5 py-3 text-center">Horas Alocadas / Mês</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-semibold text-xs text-slate-700 select-text">
                        {techStats.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-8 text-center text-slate-400 font-bold">
                              Nenhum dado operacional para os técnicos neste período.
                            </td>
                          </tr>
                        ) : (
                          techStats.map(tech => {
                            const formatTime = (totalMin: number) => {
                              const hrs = Math.floor(totalMin / 60);
                              const mins = Math.round(totalMin % 60);
                              return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                            };

                            const initial = tech.nome ? tech.nome.substring(0, 1).toUpperCase() : '?';

                            return (
                              <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 border-r border-slate-150">
                                  <div className="flex items-center gap-3">
                                    {tech.avatarUrl ? (
                                      <img src={tech.avatarUrl} alt={tech.nome} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/10 border border-[#1b4d3e]/20 text-[#1B4D3E] flex items-center justify-center text-xs font-black shrink-0">
                                        {initial}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="font-extrabold text-slate-800 leading-tight uppercase truncate max-w-[140px]">{tech.nome}</h4>
                                      <p className="text-[9px] text-slate-455 leading-none font-bold uppercase">{tech.cargo}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3 border-r border-slate-150 text-center font-black text-slate-800">
                                  {tech.totalTechOs}
                                </td>
                                <td className="px-5 py-3 border-r border-slate-150 text-center text-cyan-650 font-bold">
                                  {formatTime(tech.deslocamentoMin)}
                                </td>
                                <td className="px-5 py-3 border-r border-slate-150 text-center text-amber-650 font-bold">
                                  {formatTime(tech.atendimentoMin)}
                                </td>
                                <td className="px-5 py-3 border-r border-slate-150 text-center text-slate-850 font-black">
                                  {formatTime(tech.tempoTotalMin)}
                                </td>
                                <td className="px-5 py-3 border-r border-slate-150 text-center text-emerald-650 font-bold">
                                  {tech.kmRodados.toFixed(1)} km
                                </td>
                                <td className="px-5 py-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                                      <span>{tech.tempoTotalHoras.toFixed(1)}h / 176h</span>
                                      <span className={tech.percentAlocacao > 100 ? 'text-rose-600 font-black' : tech.percentAlocacao > 80 ? 'text-amber-600 font-black' : 'text-emerald-700 font-black'}>
                                        {tech.percentAlocacao.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${tech.percentAlocacao > 100 ? 'bg-rose-600' : tech.percentAlocacao > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                                        style={{ width: `${Math.min(100, tech.percentAlocacao)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

        {/* ───────────────────────────────────────────────────────────────────
            MODAL CADASTRO / EDIÇÃO ATIVO
            ─────────────────────────────────────────────────────────────────── */}
        {modalAtivoOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Boxes size={16} className="stroke-[2.5]" />
                  {ativoForm.id ? 'Editar Equipamento' : 'Cadastrar Equipamento'}
                </h3>
                <button onClick={() => setModalAtivoOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </header>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Equipamento *</label>
                  <input
                    type="text"
                    placeholder="Ex: SABONETEIRA 800ML QUARTZ BRANCO"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 uppercase"
                    value={ativoForm.descricao}
                    onChange={(e) => setAtivoForm({...ativoForm, descricao: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria *</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                    value={ativoForm.categoriaId === '' && showQuickCategory ? '__NEW__' : ativoForm.categoriaId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowQuickCategory(true);
                        setAtivoForm({...ativoForm, categoriaId: ''});
                      } else {
                        setShowQuickCategory(false);
                        setAtivoForm({...ativoForm, categoriaId: e.target.value});
                      }
                    }}
                  >
                    <option value="" disabled hidden>Selecione</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                    <option value="__NEW__" className="text-emerald-600 font-extrabold">+ CRIAR NOVA CATEGORIA...</option>
                  </select>

                  {showQuickCategory && (
                    <div className="mt-2 flex gap-1.5 animate-fade-in bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100/50">
                      <input
                        type="text"
                        placeholder="Nome da Nova Categoria"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase"
                        value={quickCategoryName}
                        onChange={(e) => setQuickCategoryName(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!quickCategoryName.trim()) return showAlert('Campo Obrigatório', 'Digite o nome da categoria', 'warning');
                          setSaving(true);
                          const res = await createCategoriaAtivo(quickCategoryName);
                          setSaving(false);
                          if (res.success && res.categoria) {
                            await loadData();
                            setAtivoForm(prev => ({...prev, categoriaId: res.categoria.id}));
                            setShowQuickCategory(false);
                            setQuickCategoryName('');
                          } else {
                            showAlert('Erro ao Salvar', res.error || 'Erro ao criar categoria', 'error');
                          }
                        }}
                        className="px-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCategory(false);
                          setQuickCategoryName('');
                          setAtivoForm(prev => ({...prev, categoriaId: categorias[0]?.id || ''}));
                        }}
                        className="px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Reposição (R$) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10"
                      value={ativoForm.valor}
                      onChange={(e) => setAtivoForm({...ativoForm, valor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Situação</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                      value={ativoForm.status}
                      onChange={(e) => setAtivoForm({...ativoForm, status: e.target.value})}
                    >
                      <option value="DISPONIVEL">Disponível</option>
                      <option value="COMODATO">Comodato</option>
                      <option value="MANUTENCAO">Manutenção</option>
                      <option value="BAIXADO">Baixado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observação Técnica</label>
                  <textarea
                    rows={3}
                    placeholder="Número de série, fabricante, especificações de voltagem etc..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 resize-none"
                    value={ativoForm.observacao}
                    onChange={(e) => setAtivoForm({...ativoForm, observacao: e.target.value})}
                  />
                </div>

                <footer className="pt-4 flex gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => setModalAtivoOpen(false)}
                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveAtivo}
                    disabled={saving}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? 'Gravando...' : 'Gravar Equipamento'}
                  </button>
                </footer>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            MODAL CADASTRO / EDIÇÃO CATEGORIA
            ─────────────────────────────────────────────────────────────────── */}
        {modalCategoriaOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Tags size={16} className="stroke-[2.5]" />
                  {categoriaForm.id ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button onClick={() => setModalCategoriaOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </header>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Categoria *</label>
                  <input
                    type="text"
                    placeholder="Ex: Dispensadores"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 uppercase"
                    value={categoriaForm.nome}
                    onChange={(e) => setCategoriaForm({...categoriaForm, nome: e.target.value})}
                  />
                </div>

                <footer className="pt-4 flex gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => setModalCategoriaOpen(false)}
                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveCategoria}
                    disabled={saving}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? 'Gravando...' : 'Gravar Categoria'}
                  </button>
                </footer>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            MODAL CADASTRO / EDIÇÃO TEMPLATE MINUTA
            ─────────────────────────────────────────────────────────────────── */}
        {modalTemplateOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="stroke-[2.5]" />
                  {templateForm.id ? 'Editar Minuta de Comodato' : 'Nova Minuta de Comodato'}
                </h3>
                <button onClick={() => setModalTemplateOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </header>
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Template *</label>
                  <input
                    type="text"
                    placeholder="Ex: Minuta Oficial Comodato Slimpe"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10"
                    value={templateForm.nome}
                    onChange={(e) => setTemplateForm({...templateForm, nome: e.target.value})}
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-b border-slate-100 pb-1 select-none">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Cláusulas</span>
                  <button 
                    onClick={handleAddClauseToTemplate}
                    className="text-[10px] font-black text-[#1B4D3E] uppercase hover:bg-[#1B4D3E]/10 border border-[#1B4D3E]/15 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={10} /> Adicionar Cláusula
                  </button>
                </div>

                <div className="space-y-4">
                  {templateForm.clausulas.map((c, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 relative group">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-black text-[#1B4D3E] bg-white border border-[#1B4D3E]/15 rounded-lg px-2.5 py-1">#{c.ordem}</span>
                          <input
                            type="text"
                            placeholder="Título da Cláusula"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]"
                            value={c.titulo}
                            onChange={(e) => handleClauseChange(index, 'titulo', e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => handleRemoveClauseFromTemplate(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        placeholder="Texto da cláusula..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-650 outline-none focus:border-[#1B4D3E] leading-relaxed resize-none"
                        value={c.texto}
                        onChange={(e) => handleClauseChange(index, 'texto', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <footer className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3 shrink-0">
                <button 
                  onClick={() => setModalTemplateOpen(false)}
                  className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? 'Gravando...' : 'Gravar Template de Minuta'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            MODAL GERAR NOVO CONTRATO DE COMODATO
            ─────────────────────────────────────────────────────────────────── */}
        {modalContratoOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={16} className="stroke-[2.5]" />
                  {contratoForm.id ? 'Editar' : 'Gerar'} Contrato de Comodato
                </h3>
                <button onClick={() => setModalContratoOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </header>
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* 1. Vínculos e Prazos */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest border-b border-slate-200 pb-1.5">1. Dados e Prazos do Contrato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente Comodatário *</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                        value={contratoForm.clientId}
                        onChange={(e) => setContratoForm({...contratoForm, clientId: e.target.value})}
                      >
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nomeFantasia} ({c.cnpj || 'Sem CNPJ'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa Emissora (Grupo) *</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                        value={contratoForm.empresaEmissoraId}
                        onChange={(e) => setContratoForm({...contratoForm, empresaEmissoraId: e.target.value})}
                      >
                        {empresas.map(e => (
                          <option key={e.id} value={e.id}>{e.nomeFantasia}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Início *</label>
                      <input
                        type="date"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                        value={contratoForm.dataInicio}
                        onChange={(e) => setContratoForm({...contratoForm, dataInicio: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigência (Meses) *</label>
                      <input
                        type="number"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                        value={contratoForm.vigenciaMeses}
                        onChange={(e) => setContratoForm({...contratoForm, vigenciaMeses: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Compra Mínima (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-450">R$</span>
                        <input
                          type="number"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-850 outline-none focus:border-[#1B4D3E]"
                          value={contratoForm.valorMinimoMensal}
                          onChange={(e) => setContratoForm({...contratoForm, valorMinimoMensal: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest block mb-0.5">Situação / Status</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-white border border-[#1B4D3E]/30 rounded-xl text-xs font-black text-[#1B4D3E] outline-none focus:border-[#1B4D3E] cursor-pointer"
                        value={contratoForm.status}
                        onChange={(e) => setContratoForm({...contratoForm, status: e.target.value})}
                      >
                        <option value="RASCUNHO">RASCUNHO</option>
                        <option value="VIGENTE">VIGENTE</option>
                        <option value="SUSPENSO">SUSPENSO</option>
                        <option value="ENCERRADO">ENCERRADO</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Seleção de Equipamentos (Ativos) */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest border-b border-slate-200 pb-1.5">2. Vincular Equipamentos (Ativos)</h4>
                  
                  {/* Selector de Ativo */}
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddAtivoToContrato(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled hidden>Selecione os equipamentos para adicionar...</option>
                      {ativos.filter(a => a.status === 'DISPONIVEL').map(a => (
                        <option key={a.id} value={a.id}>{a.codigo} - {a.descricao} (Val: R$ {a.valor})</option>
                      ))}
                      {ativos.filter(a => a.status === 'DISPONIVEL').length === 0 && (
                        <option value="" disabled>Nenhum equipamento disponível no parque de ativos.</option>
                      )}
                    </select>
                  </div>

                  {/* Lista de Ativos Selecionados */}
                  <div className="space-y-2">
                    {contratoForm.selectedAtivos.map((sel, idx) => {
                      const asset = ativos.find(a => a.id === sel.ativoId);
                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-1">
                            <span className="font-mono text-[9px] font-black bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 uppercase">{asset?.codigo}</span>
                            <span className="text-xs font-black text-slate-800 uppercase block mt-1">{asset?.descricao}</span>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Qtd:</span>
                              <input 
                                type="number" 
                                min={1}
                                value={sel.quantidade}
                                onChange={(e) => handleUpdateContratoAtivoField(idx, 'quantidade', Number(e.target.value) || 1)}
                                className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Preço:</span>
                              <input 
                                type="number" 
                                value={sel.valorUnitario}
                                onChange={(e) => handleUpdateContratoAtivoField(idx, 'valorUnitario', Number(e.target.value) || 0)}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-right"
                              />
                            </div>
                            <button 
                              onClick={() => handleRemoveAtivoFromContrato(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Minuta / Cláusulas do Contrato */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 select-none">
                    <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest">3. Cláusulas do Contrato</h4>
                    <select
                      value={contratoForm.templateId}
                      onChange={(e) => handleTemplateSelectionChange(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10.5px] font-black text-slate-600 outline-none cursor-pointer"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {contratoForm.clausulas.map((c, index) => (
                      <div key={index} className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                        <div className="text-[11px] font-black text-[#1B4D3E] uppercase">{c.titulo}</div>
                        <textarea
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-650 outline-none leading-relaxed resize-none"
                          value={c.texto}
                          onChange={(e) => {
                            const updated = [...contratoForm.clausulas];
                            updated[index].texto = e.target.value;
                            setContratoForm({...contratoForm, clausulas: updated});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <footer className="p-6 bg-slate-50 border-t border-slate-150 flex gap-3 shrink-0">
                <button 
                  onClick={() => setModalContratoOpen(false)}
                  className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveContrato}
                  disabled={saving}
                  className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? 'Gravando...' : 'Gerar Contrato de Comodato'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            MODAL CADASTRO / ABERTURA DE ORDEM DE SERVIÇO (OS)
            ─────────────────────────────────────────────────────────────────── */}
         {modalOsOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-fade-in text-left flex flex-col max-h-[90vh]">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="stroke-[2.5]" />
                  {osForm.id ? 'Editar Ordem de Serviço (OS)' : 'Abrir Ordem de Serviço (OS)'}
                </h3>
                <button onClick={() => setModalOsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </header>
              <div className="p-6 pb-2 space-y-4 overflow-y-auto flex-1 min-h-0">
                {osForm.id && (
                  <div className="flex border-b border-slate-150 mb-4 select-none">
                    <button
                      type="button"
                      onClick={() => setActiveOsTab('details')}
                      className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeOsTab === 'details'
                          ? 'border-[#1B4D3E] text-[#1B4D3E]'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Detalhes da OS
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveOsTab('history')}
                      className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeOsTab === 'history'
                          ? 'border-[#1B4D3E] text-[#1B4D3E]'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Histórico & Atendimento
                    </button>
                  </div>
                )}

                {(!osForm.id || activeOsTab === 'details') && (
                  <div className="space-y-4">
                    {osForm.id && (() => {
                      const currentOsItem = ordens.find(o => o.id === osForm.id);
                      if (!currentOsItem || currentOsItem.status !== 'VALIDACAO') return null;
                      
                      const isCancelRequest = currentOsItem.observacao?.includes('Cancelamento solicitado') || currentOsItem.observacao?.includes('Cancelada pelo técnico') || currentOsItem.observacaoAtendimento?.includes('Cancelamento solicitado') || currentOsItem.observacaoAtendimento?.includes('Cancelada pelo técnico');
                      
                      if (isCancelRequest) {
                        return (
                          <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex gap-2">
                              <ShieldAlert className="text-red-650 shrink-0 mt-0.5" size={16} />
                              <div className="text-left space-y-1">
                                <h4 className="text-xs font-black text-red-900 uppercase tracking-tight">Solicitação de Cancelamento da OS</h4>
                                <p className="text-[10.5px] font-semibold text-red-755 leading-relaxed">
                                  O técnico solicitou o cancelamento desta ordem de serviço em campo.
                                </p>
                                {(currentOsItem.observacaoAtendimento || currentOsItem.observacao) && (
                                  <p className="text-[10.5px] font-bold text-red-800 bg-red-100/50 p-2 rounded-lg mt-1 select-text">
                                    {currentOsItem.observacaoAtendimento || currentOsItem.observacao}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateOsStatus(osForm.id, 'CANCELADA')}
                                disabled={updatingOsId === osForm.id}
                                className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-750 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle size={13} className="stroke-[2.5]" /> Confirmar Cancelamento
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRecuseCancel(osForm.id)}
                                disabled={updatingOsId === osForm.id}
                                className="flex-1 py-2 px-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <XCircle size={13} className="stroke-[2.5]" /> Recusar Cancelamento
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                          <div className="flex gap-2">
                            <ShieldAlert className="text-purple-650 shrink-0 mt-0.5" size={16} />
                            <div className="text-left space-y-1">
                              <h4 className="text-xs font-black text-purple-900 uppercase tracking-tight">OS aguardando validação</h4>
                              <p className="text-[10.5px] font-semibold text-purple-755 leading-relaxed">
                                O técnico concluiu o atendimento em campo e enviou o relatório, fotos e assinatura do cliente para sua validação.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateOsStatus(osForm.id, 'CONCLUIDA')}
                              disabled={updatingOsId === osForm.id}
                              className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle size={13} className="stroke-[2.5]" /> Validar & Concluir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOsStatus(osForm.id, 'EM_ANDAMENTO')}
                              disabled={updatingOsId === osForm.id}
                              className="flex-1 py-2 px-3 bg-white border border-purple-200 hover:bg-purple-50 text-purple-600 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <XCircle size={13} className="stroke-[2.5]" /> Recusar & Retornar
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço *</label>
                        <select
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                          value={osForm.tipo}
                          onChange={(e) => setOsForm({...osForm, tipo: e.target.value})}
                        >
                          <option value="INSTALACAO">Instalação (Novo ou Aumento)</option>
                          <option value="RETIRADA">Retirada (Encerramento/Troca)</option>
                          <option value="TROCA">Troca (Substituição de Equip.)</option>
                          <option value="MANUTENCAO">Manutenção Corretiva/Preventiva</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Prevista Execução</label>
                        <input
                          type="date"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                          value={osForm.dataPrevista}
                          onChange={(e) => setOsForm({...osForm, dataPrevista: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato de Comodato Origem *</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                        value={osForm.contratoComodatoId}
                        onChange={(e) => handleOsContratoChange(e.target.value)}
                      >
                        {contratos.map(c => (
                          <option key={c.id} value={c.id}>#{String(c.codigo).padStart(4, '0')} - {c.client.nomeFantasia}</option>
                        ))}
                      </select>
                    </div>

                    {/* Seleção do Equipamento Associado */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo/Equipamento Alvo *</label>
                        <select
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                          value={osForm.ativoId}
                          onChange={(e) => setOsForm({...osForm, ativoId: e.target.value})}
                        >
                          <option value="" disabled hidden>Selecione</option>
                          {/* Mostra equipamentos que pertencem a esse contrato de comodato */}
                          {contratos.find(c => c.id === osForm.contratoComodatoId)?.itens.map((it: any) => (
                            <option key={it.ativo.id} value={it.ativo.id}>{it.ativo.codigo} - {it.ativo.descricao}</option>
                          ))}
                        </select>
                      </div>
                      
                      {osForm.tipo === 'TROCA' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento Destino (Novo) *</label>
                          <select
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1B4D3E] outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                            value={osForm.ativoDestinoId}
                            onChange={(e) => setOsForm({...osForm, ativoDestinoId: e.target.value})}
                          >
                            <option value="" disabled hidden>Selecione Novo Ativo</option>
                            {ativos.filter(a => a.status === 'DISPONIVEL').map(a => (
                              <option key={a.id} value={a.id}>{a.codigo} - {a.descricao}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico Responsável</label>
                      <select
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                        value={osForm.tecnicoEmail || ''}
                        onChange={(e) => {
                          const emailSelected = e.target.value;
                          const userSelected = usuarios.find(u => u.email === emailSelected);
                          setOsForm({
                            ...osForm,
                            tecnicoEmail: emailSelected,
                            tecnicoResponsavel: userSelected ? userSelected.nome : ''
                          });
                        }}
                      >
                        <option value="">Selecione um Técnico...</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.nome} ({u.cargo || 'Técnico'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {osForm.id && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Status da Ordem de Serviço</label>
                          {updatingOsId === osForm.id && (
                            <div className="flex items-center gap-1 text-[9px] font-extrabold text-[#1B4D3E] uppercase animate-pulse">
                              <div className="w-3 h-3 border-2 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin"></div>
                              <span>Salvando...</span>
                            </div>
                          )}
                        </div>
                        <select
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          value={osForm.status || 'PENDENTE'}
                          disabled={updatingOsId === osForm.id}
                          onChange={(e) => handleUpdateOsStatus(osForm.id, e.target.value)}
                        >
                          <option value="PENDENTE">Backlog</option>
                          <option value="PROGRAMADO">Programado</option>
                          <option value="EM_DESLOCAMENTO">Em Deslocamento</option>
                          <option value="EM_ANDAMENTO">Em Atendimento</option>
                          <option value="VALIDACAO">Em Validação</option>
                          <option value="CONCLUIDA">Concluída</option>
                          <option value="CANCELADA">Cancelada</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruções de Atendimento *</label>
                      <textarea
                        rows={3}
                        placeholder="Instruções para o técnico sobre a execução da OS..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 resize-none leading-relaxed"
                        value={osForm.instrucoes}
                        onChange={(e) => setOsForm({...osForm, instrucoes: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observação Técnica</label>
                      <textarea
                        rows={2}
                        placeholder="Anotações internas, históricos ou motivos da OS..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/10 resize-none leading-relaxed"
                        value={osForm.observacao}
                        onChange={(e) => setOsForm({...osForm, observacao: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {(osForm.id && activeOsTab === 'history') && (() => {
                  const currentOs = ordens.find(o => o.id === osForm.id);
                  if (!currentOs) return <p className="text-xs text-slate-400">OS não encontrada.</p>;

                  // Parse history events
                  let logs: any[] = [];
                  if (currentOs.historico) {
                    try {
                      logs = JSON.parse(currentOs.historico);
                    } catch (e) {}
                  }

                  // Durations
                  const travelTime = formatDuration(currentOs.rotaIniciadaEm, currentOs.atendimentoIniciadoEm);
                  const attendanceTime = formatDuration(currentOs.atendimentoIniciadoEm, currentOs.dataExecucao);
                  
                  return (
                    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                      
                      {/* Section 1: Attendance Report / Resumo do Atendimento */}
                      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3.5 text-left">
                        <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={13} className="stroke-[2.5]" />
                          Resumo dos Tempos
                        </h4>

                        <div className="grid grid-cols-2 gap-4 text-[10.5px]">
                          <div>
                            <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Técnico</span>
                            <span className="font-extrabold text-slate-700 uppercase">{currentOs.tecnicoResponsavel || 'Não atribuído'}</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Status Atual</span>
                            <span className="font-black text-[#1B4D3E] uppercase">{currentOs.status}</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Tempo de Deslocamento</span>
                            <span className="font-bold text-slate-700">{travelTime || '-'}</span>
                          </div>
                          <div>
                            <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Tempo de Atendimento</span>
                            <span className="font-bold text-slate-700">{attendanceTime || '-'}</span>
                          </div>
                          {currentOs.tempoEstimadoRota !== null && currentOs.tempoEstimadoRota !== undefined && (
                            <div>
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Rota Estimada (OSRM)</span>
                              <span className="font-bold text-slate-700">{Math.round(currentOs.tempoEstimadoRota)} min ({currentOs.distanciaEstimadaRota?.toFixed(2)} km)</span>
                            </div>
                          )}
                          {currentOs.tempoRealizadoRota !== null && currentOs.tempoRealizadoRota !== undefined && (
                            <div>
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Rota Realizada (GPS)</span>
                              <span className="font-bold text-slate-700">{Math.round(currentOs.tempoRealizadoRota)} min ({currentOs.distanciaRealizadaRota?.toFixed(2)} km)</span>
                            </div>
                          )}
                          {currentOs.desvioRota !== null && currentOs.desvioRota !== undefined && (
                            <div className="col-span-2">
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Auditoria de Desvio de Rota</span>
                              {currentOs.desvioRota ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-150 animate-pulse">
                                  ⚠️ Desvio Detectado (A distância percorrida excedeu a estimativa em +25%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-150">
                                  ✓ Rota Conforme (Dentro do trajeto esperado)
                                </span>
                              )}
                            </div>
                          )}
                          {currentOs.rotaIniciadaEm && (
                            <div>
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Início do Deslocamento</span>
                              <span className="font-medium text-slate-600">{new Date(currentOs.rotaIniciadaEm).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {currentOs.atendimentoIniciadoEm && (
                            <div>
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Chegada Onsite</span>
                              <span className="font-medium text-slate-600">{new Date(currentOs.atendimentoIniciadoEm).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {currentOs.dataExecucao && (
                            <div className="col-span-2">
                              <span className="block font-black text-slate-400 uppercase text-[8px] tracking-wider">Conclusão / Execução</span>
                              <span className="font-extrabold text-slate-800">{new Date(currentOs.dataExecucao).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 4: Lifecycle Log Timeline / Histórico de Eventos */}
                      <div className="space-y-3 text-left">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <History size={13} className="stroke-[2.5]" />
                          Ciclo de Vida do Card
                        </h4>
                        
                        {logs.length === 0 ? (
                          <p className="text-[10.5px] text-slate-450 italic">Nenhum evento registrado no histórico.</p>
                        ) : (
                          <div className="relative pl-4 border-l border-slate-200 space-y-4 text-[10.5px] select-none ml-1.5">
                            {logs.map((log: any, idx: number) => (
                              <div key={idx} className="relative">
                                {/* Dot indicator */}
                                <div className="absolute -left-[20.5px] top-1.5 w-2 h-2 rounded-full bg-[#1B4D3E] border border-white" />
                                
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="font-extrabold text-slate-700">{log.acao}</span>
                                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                      {new Date(log.data).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-450 font-bold uppercase">
                                    Por: <span className="text-slate-650 font-extrabold">{log.usuario}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>

              <footer className="p-6 pt-4 flex justify-between items-center border-t border-slate-100 shrink-0 bg-slate-50/50 select-none">
                {/* Ações Secundárias / Destrutivas (Esquerda) */}
                <div>
                  {osForm.id && activeOsTab === 'details' && (() => {
                    const currentOs = ordens.find(o => o.id === osForm.id);
                    return (
                      <div className="flex gap-2">
                        {currentOs && (
                          <button 
                            type="button"
                            onClick={() => { setSelectedOsForPdf(currentOs); setModalOsPdfOpen(true); }}
                            className="py-2.5 px-4 text-xs font-black text-slate-500 hover:bg-emerald-50 hover:text-[#1B4D3E] border border-slate-200 hover:border-emerald-250 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Ver OS (PDF)"
                          >
                            <Printer size={14} className="stroke-[2.5]" /> PDF
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => { setModalOsOpen(false); handleDeleteOs(osForm.id); }}
                          className="py-2.5 px-4 text-xs font-black text-red-500 hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-250 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                          title="Excluir Ordem de Serviço"
                        >
                          <Trash2 size={14} className="stroke-[2.5]" /> Excluir
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Ações Principais (Direita) */}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setModalOsOpen(false)}
                    className="py-2.5 px-4 text-xs font-black text-slate-500 uppercase hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveOs}
                    disabled={saving}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save size={14} className="stroke-[2.5]" />
                    )}
                    {saving ? 'Gravando...' : (osForm.id ? 'Salvar Alterações' : 'Gravar Ordem de Serviço')}
                  </button>
                </div>
              </footer>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────────────
            MODAL DE ATRIBUIÇÃO DE TÉCNICO
            ─────────────────────────────────────────────────────────────────── */}
        {modalAssignTecnicoOpen && (
          <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="stroke-[2.5]" />
                  Atribuir Técnico Responsável
                </h3>
                <button 
                  onClick={() => {
                    setModalAssignTecnicoOpen(false);
                    setOsToAssignTecnico(null);
                    setSelectedTecnicoForAssign('');
                  }} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </header>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Para programar esta Ordem de Serviço, é obrigatório atribuir um técnico responsável que executará o atendimento de campo.
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Selecione o Técnico</label>
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {usuarios.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                        <p className="text-xs text-slate-400 font-semibold italic">Nenhum técnico disponível</p>
                      </div>
                    ) : (
                      usuarios.map((u) => {
                        const isSelected = selectedTecnicoForAssign === u.email;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedTecnicoForAssign(u.email)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/10' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {u.avatarUrl ? (
                              <img 
                                src={u.avatarUrl} 
                                alt={u.nome} 
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                              />
                            ) : (
                              <div className="w-9 h-9 bg-[#1B4D3E]/10 text-[#1B4D3E] rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0 border border-[#1B4D3E]/20">
                                {u.nome ? u.nome.substring(0, 2) : 'US'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-black text-slate-800 uppercase truncate leading-tight">{u.nome}</h4>
                              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide truncate mt-0.5">{u.cargo || 'Técnico'}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5.5 h-5.5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-xs">
                                <Check size={11} className="stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
                <footer className="pt-4 flex gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => {
                      setModalAssignTecnicoOpen(false);
                      setOsToAssignTecnico(null);
                      setSelectedTecnicoForAssign('');
                    }}
                    className="flex-1 py-3 text-xs font-black text-slate-500 uppercase hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmAssignTecnico}
                    disabled={saving}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? 'Gravando...' : 'Atribuir e Programar'}
                  </button>
                </footer>
              </div>
            </div>
          </div>
        )}



        {/* ───────────────────────────────────────────────────────────────────
            MODAL LISTAGEM DE TEMPLATE MINUTA (MINUTAS PADRÃO)
            ─────────────────────────────────────────────────────────────────── */}
        {modalListTemplatesOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in text-left">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="stroke-[2.5]" />
                  Modelos de Minutas Padrão
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openTemplateModal()}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Nova Minuta Padrão
                  </button>
                  <button onClick={() => setModalListTemplatesOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
                </div>
              </header>
              <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading && templates.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando minutas padrão...</div>
                  ) : templates.length === 0 ? (
                    <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-20 text-center text-slate-400 italic">
                      Nenhum template de comodato cadastrado. Crie um para preencher os contratos com facilidade.
                    </div>
                  ) : (
                    templates.map(tpl => (
                      <div key={tpl.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-[#1B4D3E]/10 border border-[#1B4D3E]/20 text-[#1B4D3E] rounded-xl flex items-center justify-center shrink-0">
                              <FileText size={20} className="stroke-[2.5]" />
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openTemplateModal(tpl)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Editar"><Edit2 size={13} /></button>
                              <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{tpl.nome}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{tpl.clausulas.length} Cláusulas Estruturadas</p>
                          </div>
                          <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10.5px] text-slate-500 italic max-h-[140px] overflow-hidden leading-relaxed">
                            {(tpl.clausulas[0]?.texto || '').substring(0, 180)}...
                          </div>
                        </div>
                        <button 
                          onClick={() => openTemplateModal(tpl)}
                          className="mt-5 w-full py-2 bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                        >
                          Editar Cláusulas
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <footer className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-end items-center select-none shrink-0">
                <button 
                  onClick={() => setModalListTemplatesOpen(false)}
                  className="py-2.5 px-6 border border-slate-250 hover:bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </footer>
            </div>
          </div>
        )}

      </main>

      {/* ───────────────────────────────────────────────────────────────────
          PRINT ONLY MODALS AND PRINT STYLES
          ─────────────────────────────────────────────────────────────────── */}

      {/* 1. PDF CONTRATO DE COMODATO PREVIEW */}
      {modalContratoPdfOpen && selectedContratoForPdf && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs print-modal-container">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 text-left">
            <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
              <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider">Visualizar Minuta de Contrato de Comodato</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-1.5 px-4 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Printer size={12} /> Imprimir Contrato
                </button>
                <button onClick={() => setModalContratoPdfOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </div>
            </header>
            
            <div className="p-10 flex-1 overflow-y-auto font-sans text-xs text-slate-800 leading-relaxed space-y-6 max-w-[210mm] mx-auto bg-white shadow-inner">
              
              {/* Logo / Header */}
              <div className="text-center space-y-2 pb-6 border-b border-slate-200">
                <h1 className="text-lg font-extrabold tracking-tight text-[#1B4D3E] uppercase">CONTRATO DE COMODATO DE EQUIPAMENTOS</h1>
                <p className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">Instrumento Particular de Comodato de Ativos</p>
              </div>

              <div className="space-y-4">
                <p className="font-extrabold uppercase select-none text-[11px] leading-relaxed">
                  PELO PRESENTE INSTRUMENTO PARTICULAR DE COMODATO, DE UM LADO:
                </p>
                <div className="space-y-1.5 pl-4 border-l-2 border-[#1B4D3E]/20">
                  <span className="font-black text-[#1B4D3E] text-[10px] tracking-wider uppercase block">COMODANTE:</span>
                  <p className="text-[11px] font-bold text-slate-700 leading-normal">
                    {selectedContratoForPdf.empresaEmissora.razaoSocial || selectedContratoForPdf.empresaEmissora.nomeFantasia}, inscrita no CNPJ sob o nº {selectedContratoForPdf.empresaEmissora.cnpj}, com sede à {selectedContratoForPdf.empresaEmissora.endereco || '-'}, doravante denominada COMODANTE.
                  </p>
                </div>

                <p className="font-extrabold uppercase select-none text-[11px] leading-relaxed">
                  E, DE OUTRO LADO:
                </p>
                <div className="space-y-1.5 pl-4 border-l-2 border-[#1B4D3E]/20">
                  <span className="font-black text-[#1B4D3E] text-[10px] tracking-wider uppercase block">COMODATÁRIO:</span>
                  <p className="text-[11px] font-bold text-slate-700 leading-normal">
                    {selectedContratoForPdf.client.razaoSocial || selectedContratoForPdf.client.nomeFantasia}, inscrita no CNPJ/CPF {selectedContratoForPdf.client.cnpj || selectedContratoForPdf.client.cpf || '-'}, com sede à {selectedContratoForPdf.client.endereco || '-'}, doravante denominado COMODATÁRIO.
                  </p>
                </div>
                
                <p className="font-bold text-slate-700 italic select-none">
                  Têm entre si, justo e contratado, o seguinte:
                </p>
              </div>

              {/* Cláusulas Dinâmicas */}
              <div className="space-y-6">
                {selectedContratoForPdf.clausulas.map((c: any, index: number) => {
                  const isClausula1 = c.titulo.includes('CLÁUSULA 1') || c.titulo.includes('OBJETO');
                  return (
                    <div key={index} className="space-y-2">
                      <h4 className="font-black text-[11px] text-[#1B4D3E] uppercase tracking-wide border-b border-slate-100 pb-1">{c.titulo}</h4>
                      <p className="font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">{c.texto}</p>

                      {/* Tabela Injetada na Cláusula 1 */}
                      {isClausula1 && (
                        <div className="pt-3 overflow-hidden rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#1B4D3E] text-white text-[9px] font-black uppercase tracking-wider text-center border-none">
                                <th className="px-3 py-2 w-16 text-center">Código</th>
                                <th className="px-4 py-2 text-left">Descrição do Produto</th>
                                <th className="px-3 py-2 w-32 text-center">Categoria</th>
                                <th className="px-3 py-2 w-20 text-center">Qtde</th>
                                <th className="px-3 py-2 w-32 text-right">Pr. Venda Unit.</th>
                                <th className="px-3 py-2 w-36 text-right">Pr. Venda Total</th>
                              </tr>
                            </thead>
                            <tbody className="font-bold text-slate-700">
                              {selectedContratoForPdf.itens.map((it: any, idx: number) => (
                                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/20 bg-white last:border-b-0">
                                  <td className="px-3 py-2 text-center text-[10px] font-mono text-slate-500">{it.ativo.codigo}</td>
                                  <td className="px-4 py-2 text-slate-800 text-[11px] uppercase">{it.ativo.descricao}</td>
                                  <td className="px-3 py-2 text-center text-[10px] text-slate-500 uppercase">{it.ativo.categoria?.nome || 'COMODATO'}</td>
                                  <td className="px-3 py-2 text-center text-[11px] text-slate-800 font-extrabold">{it.quantidade}</td>
                                  <td className="px-3 py-2 text-right text-[11px]">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.valorUnitario)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-[11px] text-slate-900 font-black">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.valorUnitario * it.quantidade)}
                                  </td>
                                </tr>
                              ))}
                              {/* Totalizador */}
                              <tr className="bg-slate-50 text-[11px] font-black border-t border-slate-300">
                                <td colSpan={3} className="px-4 py-2 text-right text-[#1B4D3E] uppercase tracking-wider">Total em Comodato:</td>
                                <td className="px-3 py-2 text-center text-slate-900">
                                  {selectedContratoForPdf.itens.reduce((acc: number, curr: any) => acc + curr.quantidade, 0)}
                                </td>
                                <td></td>
                                <td className="px-3 py-2 text-right text-[#1B4D3E]">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    selectedContratoForPdf.itens.reduce((acc: number, curr: any) => acc + (curr.valorUnitario * curr.quantidade), 0)
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Assinaturas */}
              <div className="pt-12 select-none print:pt-16 avoid-break">
                <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  E por estarem assim justos e contratados, firmam o presente instrumento em duas vias.
                </p>
                <div className="grid grid-cols-2 gap-12 pt-16 text-[10.5px] font-bold text-slate-700 text-center">
                  <div className="space-y-4">
                    <div className="border-t border-slate-350 pt-2.5 flex flex-col items-center">
                      <span className="font-black text-[#1B4D3E] uppercase tracking-wider">COMODANTE</span>
                      <span className="text-[9.5px] text-slate-500 uppercase mt-0.5">{selectedContratoForPdf.empresaEmissora.nomeFantasia}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-t border-slate-350 pt-2.5 flex flex-col items-center">
                      <span className="font-black text-slate-800 uppercase tracking-wider">COMODATÁRIO</span>
                      <span className="text-[9.5px] text-slate-500 uppercase mt-0.5">{selectedContratoForPdf.client.razaoSocial || selectedContratoForPdf.client.nomeFantasia}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testemunhas (Conforme segunda imagem do usuário) */}
              <div className="pt-12 select-none print:pt-16 avoid-break">
                <span className="font-black text-slate-800 text-[10px] tracking-wider uppercase block text-left mb-8">TESTEMUNHAS:</span>
                <div className="grid grid-cols-2 gap-16 text-[10.5px] font-bold text-slate-700 text-left">
                  <div className="space-y-3">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">1. ___________________________________________</span>
                    <span className="block text-[9.5px] text-slate-500 uppercase mt-2">Nome:</span>
                    <span className="block text-[9.5px] text-slate-500 uppercase mt-1">CPF:</span>
                  </div>
                  <div className="space-y-3">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase">2. ___________________________________________</span>
                    <span className="block text-[9.5px] text-slate-500 uppercase mt-2">Nome:</span>
                    <span className="block text-[9.5px] text-slate-500 uppercase mt-1">CPF:</span>
                  </div>
                </div>
              </div>

              {/* Rodapé Corporativo Slimpe (Conforme segunda imagem do usuário) */}
              <div className="pt-12 border-t border-slate-200 mt-16 flex justify-between items-end avoid-break text-slate-400 text-[8.5px] font-semibold leading-normal select-none">
                <div className="space-y-0.5 text-left">
                  <p className="font-extrabold text-[#1B4D3E] text-[9.5px]">Slimpe Comércio de Artigos para Limpeza Ltda</p>
                  <p>CNPJ 32.463.831/0001-96 / Insc. Est. 90.801.686-64</p>
                  <p>Avenida Maringá, 1273, Barracão A, Bairro Emiliano Perneta, Pinhais/PR, CEP 83.324-432</p>
                  <p>Telefone: (41) 3732-4665 / WhatsApp: (41) 9-8855-8959</p>
                </div>
                <div className="shrink-0 flex flex-col items-end">
                  {currentTenant?.logoUrl ? (
                    <img
                      src={`/api/tenant/logo?tenantId=${currentTenant.id}&v=${currentTenant.logoUrl.length > 30 ? encodeURIComponent(currentTenant.logoUrl.substring(currentTenant.logoUrl.length - 10)) : encodeURIComponent(currentTenant.logoUrl.substring(0, 10))}`}
                      alt="Logo Slimpe"
                      className="h-10 max-w-[140px] object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-[#1B4D3E] text-white rounded-lg flex flex-col items-center justify-center font-black text-[8px] uppercase tracking-tighter leading-none shrink-0 border border-[#13382D]">
                      <span className="text-[10px] font-extrabold tracking-tighter">SLIMPE</span>
                      <span className="text-[5px] font-black tracking-widest mt-0.5 opacity-80">HIGIENE</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. PDF ORDEM DE SERVIÇO (OS) PREVIEW */}
      {modalOsPdfOpen && selectedOsForPdf && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs print-modal-container">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 text-left">
            <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
              <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider">Visualizar Ordem de Serviço</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const originalTitle = document.title;
                    document.title = `Ordem_de_Servico_No_${selectedOsForPdf.codigo}`;
                    window.print();
                    setTimeout(() => { document.title = originalTitle; }, 500);
                  }}
                  className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-black py-1.5 px-4 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Printer size={12} /> Imprimir OS
                </button>
                <button onClick={() => setModalOsPdfOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"><X size={18} /></button>
              </div>
            </header>
            
            <div className="p-8 flex-1 overflow-y-auto font-sans text-xs text-slate-800 leading-relaxed space-y-5 max-w-[210mm] mx-auto bg-white shadow-inner">
              
              {/* Cabeçalho da OS */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-3 gap-6">
                <div className="flex items-center gap-3">
                  {currentTenant?.logoUrl ? (
                    <img 
                      src={`/api/tenant/logo?tenantId=${currentTenant.id}&v=${currentTenant.logoUrl.length > 30 ? encodeURIComponent(currentTenant.logoUrl.substring(currentTenant.logoUrl.length - 10)) : encodeURIComponent(currentTenant.logoUrl.substring(0, 10))}`}
                      alt="Logo Empresa"
                      className="h-16 max-w-[180px] object-contain shrink-0"
                    />
                  ) : (
                    /* Slimpe Default Logo Box */
                    <div className="w-16 h-16 bg-[#1B4D3E] text-white rounded-xl flex flex-col items-center justify-center font-black text-xs uppercase tracking-tighter leading-none shrink-0 shadow-xs border border-[#13382D]">
                      <span className="text-[14px] font-extrabold tracking-tighter">SLIMPE</span>
                      <span className="text-[7.5px] font-black tracking-widest mt-1 opacity-80">HIGIENE</span>
                    </div>
                  )}
                  <div className="space-y-0.5 text-left">
                    <h2 className="text-xs font-black text-[#1B4D3E] uppercase tracking-widest">SLIMPE HIGIENE E LIMPEZA</h2>
                    <p className="text-[9.5px] font-semibold text-slate-500 block leading-tight">Av. Maringá, 1273 - Barracão A - Emiliano Perneta</p>
                    <p className="text-[9.5px] font-semibold text-slate-500 block leading-tight">Pinhais / PR - CEP: 83.324-432</p>
                    <p className="text-[9.5px] font-semibold text-slate-500 block leading-tight">CNPJ: 32.463.831/0001-96 - Telefone: (041) 3732-4665</p>
                  </div>
                </div>
              </div>

              {/* Faixa Título da OS */}
              <div className="bg-[#1B4D3E]/8 border border-[#1B4D3E]/15 text-[#1B4D3E] py-2 px-4 rounded-xl text-center select-none shrink-0">
                <h2 className="text-xs font-black uppercase tracking-widest">ORDEM DE SERVIÇO Nº {String(selectedOsForPdf.codigo).padStart(3, '0')}</h2>
              </div>

              {/* Dados do Cliente e Endereço */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Cliente</span>
                    <span className="text-[11.5px] font-black text-slate-850 uppercase">{selectedOsForPdf.client.nomeFantasia}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Endereço da Prestação</span>
                    <span className="text-[10.5px] uppercase">{selectedOsForPdf.client.endereco || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">UF / Cidade</span>
                      <span className="text-[10px] uppercase">PR / Curitiba</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Telefone</span>
                      <span className="text-[10px]">{selectedOsForPdf.client.whatsapp || selectedOsForPdf.client.telefone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4 font-bold text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Data Emissão</span>
                      <span className="text-[10px]">{new Date(selectedOsForPdf.dataEmissao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Data Prevista</span>
                      <span className="text-[10px]">{selectedOsForPdf.dataPrevista ? new Date(selectedOsForPdf.dataPrevista).toLocaleDateString('pt-BR') : '00/00/0000'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Contato no Atendimento</span>
                    <span className="text-[10px] uppercase">{selectedOsForPdf.client.contato || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Orçamento Associado</span>
                    <span className="text-[10px]">Orçamento: 0</span>
                  </div>
                </div>
              </div>

              {/* Bloco de Serviço */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-[#1B4D3E]/8 border-b border-slate-200 px-4 py-2 text-[#1B4D3E] font-black uppercase text-[10px] tracking-wider select-none">
                  SERVIÇO
                </div>
                <div className="p-4 space-y-4 font-bold text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Descrição</span>
                      <span className="text-[11px] font-black text-slate-800 uppercase">{selectedOsForPdf.tipo === 'INSTALACAO' ? 'INSTALAÇÃO DE COMODATOS' : selectedOsForPdf.tipo === 'RETIRADA' ? 'RETIRADA DE COMODATOS' : selectedOsForPdf.tipo === 'TROCA' ? 'TROCA DE COMODATOS' : 'MANUTENÇÃO DE COMODATOS'}</span>
                    </div>
                    {(() => {
                      const contratoItem = selectedOsForPdf.contratoComodato?.itens?.find(
                        (it: any) => it.ativoId === selectedOsForPdf.ativoId || (selectedOsForPdf.ativoDestinoId && it.ativoId === selectedOsForPdf.ativoDestinoId)
                      );
                      const quantidade = (contratoItem && contratoItem.quantidade > 0) ? contratoItem.quantidade : 1;
                      const valorUnitario = (contratoItem && contratoItem.valorUnitario > 0) ? contratoItem.valorUnitario : (selectedOsForPdf.ativo?.valor || 0);
                      const valorTotal = quantidade * valorUnitario;
                      
                      return (
                        <>
                          <div className="text-center">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Quantidade</span>
                            <span className="text-[11px]">{Number(quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Valor Previsto</span>
                            <span className="text-[11px] text-slate-850 font-black">
                              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider leading-none">Instruções de Atendimento</span>
                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-1 text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">
                      {selectedOsForPdf.instrucoes || 'Nenhuma instrução específica fornecida.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Relatório Técnico de Atendimento (se houver) */}
              {(selectedOsForPdf.observacaoAtendimento || selectedOsForPdf.fotosAtendimento) && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white text-left">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider select-none">
                    Relatório de Atendimento Técnico
                  </div>
                  <div className="p-4 space-y-4 font-bold text-slate-700 text-[10px]">
                    {selectedOsForPdf.observacaoAtendimento && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-450 font-extrabold uppercase block tracking-wider leading-none">Relato Técnico do Atendimento</span>
                        <p className="bg-slate-50 border border-slate-150 rounded-xl p-3 mt-1 text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap text-[11px]">
                          {selectedOsForPdf.observacaoAtendimento}
                        </p>
                      </div>
                    )}

                    {selectedOsForPdf.fotosAtendimento && (() => {
                      try {
                        const fotosList = JSON.parse(selectedOsForPdf.fotosAtendimento);
                        if (Array.isArray(fotosList) && fotosList.length > 0) {
                          return (
                            <div className="space-y-2">
                              <span className="text-[9px] text-slate-450 font-extrabold uppercase block tracking-wider leading-none">Fotos de Comprovação do Serviço</span>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                {fotosList.map((fotoStr: string, idx: number) => (
                                  <div key={idx} className="aspect-video relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-h-[140px]">
                                    <img 
                                      src={fotoStr} 
                                      alt={`Foto de Atendimento ${idx + 1}`} 
                                      className="w-full h-full object-cover" 
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing fotosAtendimento', e);
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Auditoria Física de Geolocalização (GPS) */}
              {((selectedOsForPdf.latitudePartida !== null && selectedOsForPdf.latitudePartida !== undefined) || 
                (selectedOsForPdf.latitudeChegada !== null && selectedOsForPdf.latitudeChegada !== undefined)) && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white text-left">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider select-none">
                    Auditoria Física de Geolocalização (GPS)
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold text-slate-700 text-[10px]">
                    {selectedOsForPdf.latitudePartida !== null && selectedOsForPdf.latitudePartida !== undefined && selectedOsForPdf.longitudePartida !== null && selectedOsForPdf.longitudePartida !== undefined && (
                      <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-[#1B4D3E] font-black uppercase tracking-wider flex items-center gap-1">
                          <Navigation size={12} className="stroke-[2.5]" /> Partida (Início do Deslocamento)
                        </span>
                        <div className="space-y-1 text-slate-650 font-semibold">
                          <p>
                            <span className="text-slate-400 font-extrabold">Horário:</span>{" "}
                            {selectedOsForPdf.rotaIniciadaEm
                              ? new Date(selectedOsForPdf.rotaIniciadaEm).toLocaleString('pt-BR')
                              : '-'}
                          </p>
                          <p>
                            <span className="text-slate-400 font-extrabold">Coordenadas:</span>{" "}
                            {Number(selectedOsForPdf.latitudePartida).toFixed(6)}, {Number(selectedOsForPdf.longitudePartida).toFixed(6)}
                          </p>
                          <button
                            onClick={() => {
                              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedOsForPdf.latitudePartida},${selectedOsForPdf.longitudePartida}`;
                              window.open(mapsUrl, '_blank');
                            }}
                            className="mt-1 bg-white hover:bg-slate-100 text-slate-750 border border-slate-200 rounded-lg px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            Ver Ponto de Partida no Mapa
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedOsForPdf.latitudeChegada !== null && selectedOsForPdf.latitudeChegada !== undefined && selectedOsForPdf.longitudeChegada !== null && selectedOsForPdf.longitudeChegada !== undefined && (
                      <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                        <span className="text-[9px] text-emerald-700 font-black uppercase tracking-wider flex items-center gap-1">
                          <MapPin size={12} className="stroke-[2.5]" /> Chegada (Início do Atendimento)
                        </span>
                        <div className="space-y-1 text-slate-650 font-semibold">
                          <p>
                            <span className="text-slate-400 font-extrabold">Horário:</span>{" "}
                            {selectedOsForPdf.dataExecucao
                              ? new Date(selectedOsForPdf.dataExecucao).toLocaleString('pt-BR')
                              : '-'}
                          </p>
                          <p>
                            <span className="text-slate-400 font-extrabold">Coordenadas:</span>{" "}
                            {Number(selectedOsForPdf.latitudeChegada).toFixed(6)}, {Number(selectedOsForPdf.longitudeChegada).toFixed(6)}
                          </p>
                          <button
                            onClick={() => {
                              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedOsForPdf.latitudeChegada},${selectedOsForPdf.longitudeChegada}`;
                              window.open(mapsUrl, '_blank');
                            }}
                            className="mt-1 bg-white hover:bg-slate-100 text-slate-750 border border-slate-200 rounded-lg px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            Ver Ponto de Chegada no Mapa
                          </button>
                        </div>
                      </div>
                    )}

                    {((selectedOsForPdf.tempoEstimadoRota !== null && selectedOsForPdf.tempoEstimadoRota !== undefined) || 
                      (selectedOsForPdf.tempoRealizadoRota !== null && selectedOsForPdf.tempoRealizadoRota !== undefined)) && (
                      <div className="col-span-1 sm:col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-150 text-[10px] space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Car size={12} className="stroke-[2.5]" /> Resumo de Rota e Auditoria de Deslocamento
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-650 font-semibold">
                          {selectedOsForPdf.tempoEstimadoRota !== null && (
                            <div>
                              <span className="block text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">Estimado (OSRM)</span>
                              <span>{Math.round(selectedOsForPdf.tempoEstimadoRota)} min ({selectedOsForPdf.distanciaEstimadaRota?.toFixed(1)} km)</span>
                            </div>
                          )}
                          {selectedOsForPdf.tempoRealizadoRota !== null && (
                            <div>
                              <span className="block text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">Realizado (GPS)</span>
                              <span>{Math.round(selectedOsForPdf.tempoRealizadoRota)} min ({selectedOsForPdf.distanciaRealizadaRota?.toFixed(1)} km)</span>
                            </div>
                          )}
                          {selectedOsForPdf.desvioRota !== null && (
                            <div>
                              <span className="block text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">Status Desvio</span>
                              {selectedOsForPdf.desvioRota ? (
                                <span className="text-rose-600 font-black flex items-center gap-0.5 uppercase">⚠️ Sim (Desvio &gt; 25%)</span>
                              ) : (
                                <span className="text-emerald-700 font-black flex items-center gap-0.5 uppercase">✓ Não</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bloco de Observações Adicionais */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider select-none">
                  Observação:
                </div>
                <div className="p-4 bg-white min-h-[120px] font-semibold text-slate-650 leading-relaxed whitespace-pre-wrap">
                  {selectedOsForPdf.observacao || 'Nenhuma observação cadastrada.'}
                </div>
              </div>

              {/* Rodapé de Assinatura Física ou Digital */}
              <div className="pt-10 select-none">
                <div className="grid grid-cols-2 gap-12 text-[10.5px] font-bold text-slate-700 text-center">
                  
                  {/* Coluna 1: Técnico Responsável */}
                  <div className="flex flex-col items-center justify-between h-[120px]">
                    {/* Assinatura do Técnico (Acima da Linha) */}
                    <div className="flex-1 flex items-end justify-center pb-2 w-full min-h-[55px]">
                      {selectedOsForPdf.assinaturaTecnico ? (
                        <img 
                          src={selectedOsForPdf.assinaturaTecnico} 
                          alt="Assinatura Técnico" 
                          className="max-h-[55px] object-contain"
                        />
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">_____________________________________</span>
                      )}
                    </div>
                    {/* Linha e Labels (Abaixo da Linha) */}
                    <div className="border-t border-slate-350 pt-1.5 w-full flex flex-col items-center">
                      {selectedOsForPdf.assinaturaTecnico && (
                        <span className="text-[8.5px] text-[#2563EB] font-black uppercase flex items-center gap-0.5 mb-0.5"><CheckCircle size={9} /> Técnico Autenticado</span>
                      )}
                      <span className="font-black text-slate-800">Técnico Responsável</span>
                      <span className="text-[9px] text-slate-450 uppercase mt-0.5">{selectedOsForPdf.tecnicoResponsavel || 'Não Informado'}</span>
                    </div>
                  </div>

                  {/* Coluna 2: Cliente */}
                  <div className="flex flex-col items-center justify-between h-[120px]">
                    {/* Assinatura do Cliente (Acima da Linha) */}
                    <div className="flex-1 flex items-end justify-center pb-2 w-full min-h-[55px]">
                      {selectedOsForPdf.assinaturaCliente ? (
                        selectedOsForPdf.assinaturaCliente === 'CLIENTE AUSENTE' ? (
                          <span className="text-red-600 font-black italic text-[11px] tracking-wider uppercase border border-red-200 bg-red-50 rounded-lg px-2.5 py-1 select-none">
                            Cliente Ausente
                          </span>
                        ) : (
                          <img 
                            src={selectedOsForPdf.assinaturaCliente} 
                            alt="Assinatura Cliente" 
                            className="max-h-[55px] object-contain"
                          />
                        )
                      ) : (
                        <span className="text-slate-300 italic text-[10px]">_____________________________________</span>
                      )}
                    </div>
                    {/* Linha e Labels (Abaixo da Linha) */}
                    <div className="border-t border-slate-350 pt-1.5 w-full flex flex-col items-center">
                      {selectedOsForPdf.assinaturaCliente && (
                        <div className="flex flex-col items-center mb-0.5">
                          {selectedOsForPdf.assinaturaCliente === 'CLIENTE AUSENTE' ? (
                            <span className="text-[8.5px] text-amber-600 font-black uppercase flex items-center gap-0.5">
                              <CheckCircle size={9} /> Finalizado sem Cliente
                            </span>
                          ) : (
                            <>
                              <span className="text-[8.5px] text-[#2563EB] font-black uppercase flex items-center gap-0.5"><CheckCircle size={9} /> Assinado Digitalmente</span>
                              {selectedOsForPdf.nomeAssinante && selectedOsForPdf.nomeAssinante !== 'CLIENTE AUSENTE' && (
                                <span className="text-[8px] text-slate-500 font-bold mt-0.5 leading-none">Nome: {selectedOsForPdf.nomeAssinante}</span>
                              )}
                              {selectedOsForPdf.cpfAssinante && selectedOsForPdf.cpfAssinante !== 'CLIENTE AUSENTE' && (
                                <span className="text-[8px] text-slate-500 font-bold leading-none">CPF: {selectedOsForPdf.cpfAssinante}</span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      <span className="font-black text-slate-800">Cliente</span>
                      <span className="text-[9px] text-slate-450 uppercase mt-0.5">{selectedOsForPdf.client.nomeFantasia}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE RASTREAMENTO GPS EM TEMPO REAL (GESTOR)
          ─────────────────────────────────────────────────────────────────── */}
      {modalTrackOs && (() => {
        const os = ordens.find(o => o.id === modalTrackOs.id) || modalTrackOs;
        const lat = os.latitudeAtual || os.latitudePartida;
        const lng = os.longitudeAtual || os.longitudePartida;
        const hasPosition = lat && lng;
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Car size={16} className="stroke-[2.5] text-cyan-600 animate-bounce" />
                  Rastreamento em Tempo Real
                </h3>
                <button 
                  onClick={() => setModalTrackOs(null)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </header>
              
              <div className="p-6 space-y-4">
                {/* Info Row */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-semibold text-slate-650">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Técnico em Rota</p>
                    <p className="text-slate-800 font-extrabold uppercase truncate">{os.tecnicoResponsavel || 'Não Atribuído'}</p>
                    <p className="text-[9.5px] text-slate-500 uppercase truncate">{os.tecnicoEmail}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Cliente / Destino</p>
                    <p className="text-slate-800 font-extrabold uppercase truncate" title={os.client.nomeFantasia}>{os.client.nomeFantasia}</p>
                    <p className="text-[9.5px] text-slate-500 uppercase truncate" title={os.client.endereco}>{os.client.endereco || 'Sem endereço'}</p>
                  </div>
                </div>

                {/* Maps Iframe */}
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
                        <p className="text-[10px] text-slate-450 mt-1">O técnico iniciou a rota mas o aparelho ainda não enviou o sinal de GPS.</p>
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

                {/* Timestamp details */}
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                  <div>
                    <span>Partida: </span>
                    <span className="text-slate-700 font-extrabold">
                      {os.rotaIniciadaEm ? new Date(os.rotaIniciadaEm).toLocaleTimeString('pt-BR') : '-'}
                    </span>
                  </div>
                  {os.ultimaAtualizacaoLocalizacao && (
                    <div className="flex items-center gap-1 text-[#1B4D3E] font-extrabold">
                      <span>Último Sinal: </span>
                      <span>{new Date(os.ultimaAtualizacaoLocalizacao).toLocaleTimeString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                
                <footer className="pt-2 flex gap-3 border-t border-slate-100">
                  <button 
                    onClick={() => setModalTrackOs(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Fechar Painel
                  </button>
                  {hasPosition && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${os.latitudePartida},${os.longitudePartida}&destination=${encodeURIComponent(os.client.endereco || '')}`}
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

      {/* MODAL DE ALERTA PREMIUM */}
      {customAlert.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
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

      {/* ───────────────────────────────────────────────────────────────────
          MODAL DE GERENCIAMENTO DE ROTAS DOS TÉCNICOS
          ─────────────────────────────────────────────────────────────────── */}
      {modalManageRoutesOpen && (() => {
        const techUser = usuarios.find(u => u.email === selectedRouteTecnico);
        const techName = techUser?.nome || '';
        
        const techOrdens = ordens.filter(o => 
          (o.tecnicoEmail === selectedRouteTecnico || (!o.tecnicoEmail && o.tecnicoResponsavel === techName)) &&
          o.status === 'PROGRAMADO'
        );
        
        const techOrdensSorted = [...techOrdens].sort((a, b) => (a.ordemExecucao ?? 9999) - (b.ordemExecucao ?? 9999));
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
              <header className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center select-none shrink-0">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
                  <Navigation size={16} className="stroke-[2.5] text-[#1B4D3E]" />
                  Sequenciador & Inteligência de Rotas
                </h3>
                <button 
                  onClick={() => setModalManageRoutesOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </header>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecione o Técnico Responsável</label>
                  <select
                    value={selectedRouteTecnico}
                    onChange={(e) => setSelectedRouteTecnico(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] uppercase cursor-pointer"
                  >
                    <option value="">Selecione um Técnico...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.email}>{u.nome} ({u.email})</option>
                    ))}
                  </select>
                </div>

                {selectedRouteTecnico ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center select-none">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Fila de OSs Programadas ({techOrdensSorted.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOptimizeRoute(selectedRouteTecnico)}
                        disabled={routeSaving || techOrdensSorted.length <= 1}
                        className="bg-[#1B4D3E] hover:bg-[#13382D] disabled:opacity-40 text-white font-black py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        {routeSaving ? (
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <TrendingUp size={12} className="stroke-[2.5]" />
                        )}
                        Otimizar Rota (OSRM)
                      </button>
                    </div>

                    {techOrdensSorted.length === 0 ? (
                      <p className="text-xs text-slate-450 italic text-center py-8 bg-slate-50 rounded-2xl border border-slate-150">
                        Nenhuma ordem de serviço programada para este técnico.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {techOrdensSorted.map((os, idx) => (
                          <div 
                            key={os.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-350 transition-colors shadow-2xs"
                          >
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-black text-xs flex items-center justify-center shrink-0 select-none">
                              #{idx + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-black text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                                  OS № {String(os.codigo).padStart(3, '0')}
                                </span>
                                <span className="text-[9px] text-[#1B4D3E] font-black uppercase tracking-wider">{os.tipo}</span>
                              </div>
                              <h5 className="text-[11px] font-black text-slate-800 uppercase truncate mt-1">{os.client?.nomeFantasia}</h5>
                              <p className="text-[9.5px] font-semibold text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <MapPin size={9} /> {os.client?.endereco || 'Sem endereço'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              <button
                                type="button"
                                onClick={() => handleManualReorder(selectedRouteTecnico, [
                                  os.id, 
                                  ...techOrdensSorted.map(o => o.id).filter(id => id !== os.id)
                                ])}
                                disabled={routeSaving || idx === 0}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-30 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Mover para o Topo"
                              >
                                <ChevronUp size={12} className="stroke-[2.5] border-b border-slate-400 pb-0.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const ids = techOrdensSorted.map(o => o.id);
                                  const temp = ids[idx];
                                  ids[idx] = ids[idx - 1];
                                  ids[idx - 1] = temp;
                                  handleManualReorder(selectedRouteTecnico, ids);
                                }}
                                disabled={routeSaving || idx === 0}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 disabled:opacity-30 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Subir"
                              >
                                <ChevronUp size={12} className="stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const ids = techOrdensSorted.map(o => o.id);
                                  const temp = ids[idx];
                                  ids[idx] = ids[idx + 1];
                                  ids[idx + 1] = temp;
                                  handleManualReorder(selectedRouteTecnico, ids);
                                }}
                                disabled={routeSaving || idx === techOrdensSorted.length - 1}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 disabled:opacity-30 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Descer"
                              >
                                <ChevronDown size={12} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 italic text-center py-8 select-none">
                    Selecione um técnico responsável acima para gerenciar ou otimizar a sua rota.
                  </p>
                )}
              </div>
              
              <footer className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-end shrink-0 select-none">
                <button
                  onClick={() => setModalManageRoutesOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </footer>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE CONFIRMAÇÃO PREMIUM */}
      {customConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center border border-amber-100 bg-amber-50/50 text-amber-600 shadow-lg shadow-amber-50 animate-pulse">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customConfirm.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">{customConfirm.message}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCustomConfirm(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm(prev => ({ ...prev, open: false }));
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          ESTILO CSS EXCLUSIVO DE IMPRESSÃO (PRINT MEDIA OVERRIDES)
          ─────────────────────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Esconder toda a estrutura do CRM (sidebar, header, main) com alta especificidade */
          html body aside,
          html body main,
          html body .no-print,
          html body header,
          html body .sidebar-aside,
          html body .sidebar-topbar,
          html body .sidebar-widget-panel {
            display: none !important;
          }
          
          /* Resetar wrappers principais */
          html, body, #ativos-layout-root {
            background: white !important;
            background-color: white !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Mostrar apenas o modal que está ativo para impressão em PDF */
          .print-modal-container {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .print-modal-container > div {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
          .print-modal-container header {
            display: none !important;
          }
          /* Resetar container scrollável para impressão */
          .print-modal-container div[class*="overflow-y-auto"] {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            padding: 15mm 12mm 15mm 12mm !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: white !important;
            display: block !important;
            position: static !important;
          }
          /* Evitar quebras de página em meio a blocos de assinatura e tabelas */
          tr, 
          thead,
          .avoid-break,
          .print-modal-container h4,
          .print-modal-container .grid,
          .print-modal-container table,
          .print-modal-container .pt-12,
          .print-modal-container .pt-16 {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Configurações de página A4 (margin 0 remove cabeçalhos/rodapés padrão do navegador) */
          @page {
            size: A4;
            margin: 0mm !important;
          }
          /* Forçar cores e gráficos de fundo */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// AUXILIARY SIGNATURE CANVAS COMPONENT
// -----------------------------------------------------------------------------
function SignaturePad({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1b4d3e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="border border-slate-250 rounded-2xl overflow-hidden bg-slate-50">
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[180px] cursor-crosshair touch-none"
        />
      </div>
      <div className="flex gap-2 justify-end select-none shrink-0 pb-1">
        <button type="button" onClick={clear} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-50 cursor-pointer">Limpar</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-50 cursor-pointer">Cancelar</button>
        <button type="button" onClick={save} className="px-5 py-2 bg-[#1B4D3E] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#13382D] cursor-pointer shadow-xs transition-colors">Confirmar Assinatura</button>
      </div>
    </div>
  );
}
