'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Building2, TrendingUp, ShieldCheck, UserCheck, 
  FileText, PieChart, Save, Plus, Trash2, ClipboardList, X,
  Calculator, Phone, Mail, MapPin, User, Briefcase, Calendar, Hash, History, AlignLeft, ChevronRight, CheckCircle2, DollarSign, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { calculateEnterprisePrice } from '@/lib/pricingEngine';
import { getCCTs } from '@/app/ccts/actions';
import { getEscalas } from '@/app/escalas/actions';
import { getProdutos } from '@/app/produtos/actions';
import { createCliente, getClientes } from '@/app/clientes/actions';
import { createProduto } from '@/app/produtos/actions';
import { saveProposta, getPropostaCompleta, getLoggedUser } from '@/app/propostas/actions';
import { getTiposServico, getSegmentos, createTipoServico, createSegmento } from '@/app/admin/settings/actions';
import { getEquipesTecnicas } from '@/app/admin/equipes-tecnicas/actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Drill, Trash, Presentation, Award, Sparkles, Users, Trophy, Lightbulb, Wrench, Trees, HardHat, ConciergeBell, ChevronLeft, Factory, Store, Bus, Building, Hospital, ShoppingBag, GraduationCap, Share2, Clock, Smartphone, Cpu, CreditCard } from 'lucide-react';
import BrazilMap from '@/components/BrazilMap';
import DocumentoA4 from '@/components/DocumentoA4';
import TemplateEditorModal from '@/components/TemplateEditorModal';
import { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';

const TABS = [
  { id: 'dados', label: '1. Cliente', icon: Building2 },
  { id: 'premissas', label: '2. Taxas e Tributos', icon: TrendingUp },
  { id: 'encargos', label: '3. Encargos CLT', icon: ShieldCheck },
  { id: 'quadro', label: '4. Quadro Equipe', icon: UserCheck },
  { id: 'materiais', label: '5. Materiais', icon: Box },
  { id: 'maquinas', label: '6. Máquinas', icon: Drill },
  { id: 'descartaveis', label: '7. Descartáveis', icon: Trash },
  { id: 'extrato', label: '8. Extrato de Custos', icon: FileText },
  { id: 'resumo', label: '9. Resumo da Proposta', icon: ClipboardList },
  { id: 'dre', label: '10. DRE Projeto', icon: PieChart }
];

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function PropostaEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('dados');
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');
  const [companyName, setCompanyName] = useState<string>('Silva Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
          if (parsed.tenantNome) {
            setCompanyName(parsed.tenantNome);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);
  const [viewMode, setViewMode] = useState<'slide' | 'document'>('document');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setTemplates(data);
    }).catch(console.error);
  }, [showTemplateModal]);

  const [empresasEmissoras, setEmpresasEmissoras] = useState<any[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  const handleVersionChange = async (versionId: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const fullData = await getPropostaCompleta(id, versionId);
      if (fullData) {
        const clientObj = (clientesList || []).find((c: any) => c.id === fullData.clientId);
        const savedSindicatoId = (fullData.premissas as any)?.meta?.sindicatoId || '';

        setProposta({
          ...proposta,
          id: fullData.id,
          premissas: {
            ...fullData.premissas,
            tributos: Array.isArray(fullData.premissas.tributos) ? fullData.premissas.tributos : []
          },
          equipe: (fullData.equipe || []).map((e: any) => ({
             ...e,
             showConfig: false,
             cctBase: (ccts || []).find((c: any) => c.id === savedSindicatoId) || {}
          })),
          versao: fullData.versao,
          insumos: (fullData as any).insumos || { materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0, servicosDescricao: '' },
          cliente: {
            ...proposta.cliente,
            cliente: clientObj?.nomeFantasia || fullData.cliente.clienteNome || '',
            sindicatoId: savedSindicatoId,
            contato: fullData.cliente.contato || '',
            celular: fullData.cliente.celular || '',
            email: fullData.cliente.email || '',
            objetoProposta: fullData.cliente.objetoProposta || '',
            hasEscopoTecnico: fullData.cliente.hasEscopoTecnico || false,
            escopoTecnico: fullData.cliente.escopoTecnico || '',
            cidade: fullData.cliente.cidade || '',
            dataElaboracao: fullData.cliente.dataElaboracao || '',
            numeroProposta: (fullData as any).numero || '',
            revisao: `R${String(fullData.versao).padStart(2, '0')}`,
            tipoServicos: fullData.cliente.tipoServicos || '',
            tipoProposta: fullData.cliente.tipoProposta || 'RECORRENTE',
            vendedorNome: (!fullData.cliente.vendedorNome || fullData.cliente.vendedorNome === 'Ádamo Quadros') ? (currentUser?.nome || 'Ádamo Quadros') : fullData.cliente.vendedorNome,
            vendedorCargo: (!fullData.cliente.vendedorCargo || fullData.cliente.vendedorCargo === 'Novos Negócios') ? (currentUser?.cargo || (currentUser?.role === 'ADMIN' ? 'Diretor Comercial' : currentUser?.role === 'MANAGER' ? 'Gerente Comercial' : 'Novos Negócios')) : fullData.cliente.vendedorCargo,
            vendedorTelefone: (!fullData.cliente.vendedorTelefone || fullData.cliente.vendedorTelefone === '(41) 9 9737-0880') ? (currentUser?.celular || '(41) 9 9737-0880') : fullData.cliente.vendedorTelefone,
            vendedorEmail: (!fullData.cliente.vendedorEmail || fullData.cliente.vendedorEmail === 'contato@silvaconsultoria.com.br') ? (currentUser?.email || 'contato@silvaconsultoria.com.br') : fullData.cliente.vendedorEmail,
            quadroEfetivoSubtitulo: fullData.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
            quadroEfetivoClausula1: fullData.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
            quadroEfetivoClausula2: fullData.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
            quadroEfetivoClausula3: fullData.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
            condicoesColaboradores: fullData.cliente.condicoesColaboradores || [],
            condicoesCliente: fullData.cliente.condicoesCliente || [],
            razaoSocial: fullData.cliente.razaoSocial || '',
            cnpj: fullData.cliente.cnpj || '',
            dataInicio: fullData.cliente.dataInicio || '',
            dataVencimento: fullData.cliente.dataVencimento || '',
            contatoCargo: fullData.cliente.contatoCargo || '',
            condicaoColaboradores1: fullData.cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
            condicaoColaboradores2: fullData.cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
            condicaoColaboradores3: fullData.cliente.condicaoColaboradores3 || '2 Vales transporte por dia.',
            condicaoCliente1: fullData.cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
            condicaoCliente2: fullData.cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
            condicaoCliente3: fullData.cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.'
          },
          dreTaxPercent: (fullData as any).dreTaxPercent,
          dreEncargos: (fullData as any).dreEncargos,
          itensInclusosExcluidos: (fullData as any).itensInclusosExcluidos || [
            { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
            { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
            { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
            { id: '4', descricao: 'Produtos químicos', incluso: false },
            { id: '5', descricao: 'Descartaveis', incluso: false }
          ],
        });
      }
    } catch (err) {
      console.error('Erro ao trocar versão:', err);
      alert('Erro ao carregar versão selecionada.');
    } finally {
      setLoading(false);
    }
  };
  const [ccts, setCcts] = useState<any[]>([]);
  const [equipesTecnicasDb, setEquipesTecnicasDb] = useState<any[]>([]);
  const [escalasDb, setEscalasDb] = useState<any[]>([]);
  const [produtosDb, setProdutosDb] = useState<any[]>([]);
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [showNewTipoModal, setShowNewTipoModal] = useState(false);
  const [newTipoName, setNewTipoName] = useState('');
  const [isSavingTipo, setIsSavingTipo] = useState(false);
  const [showNewSegmentoModal, setShowNewSegmentoModal] = useState(false);
  const [newSegmentoName, setNewSegmentoName] = useState('');
  const [isSavingSegmento, setIsSavingSegmento] = useState(false);
  const [clientesList, setClientesList] = useState<any[]>([]);
  const [tiposServico, setTiposServico] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nomeFantasia: '', razaoSocial: '', cnpj: '', email: '', whatsapp: '', endereco: '', contato: '', segmento: '' });
  const [savingClient, setSavingClient] = useState(false);

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ descricao: '', precoUnitario: 0, unidade: 'UN', categoria: 'Geral' });
  const [savingProduct, setSavingProduct] = useState(false);
  const [activeProdutoTipo, setActiveProdutoTipo] = useState<'detalheMateriais' | 'detalheMaquinas' | 'detalheDescartaveis' | ''>(''); // To know which section opened the product modal

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [presentationMode, setPresentationMode] = useState(false);

  const [proposta, setProposta] = useState<any>({
    id: null,
    cliente: { 
      cliente: '', 
      cidade: '', 
      dataElaboracao: '', 
      numeroProposta: '', 
      revisao: '', 
      tipoServicos: '', 
      contato: '', 
      celular: '', 
      email: '', 
      objetoProposta: '', 
      hasEscopoTecnico: false, 
      escopoTecnico: '', 
      sindicatoId: '',
      segmento: '',
      vendedorNome: '',
      vendedorCargo: '',
      vendedorTelefone: '',
      vendedorEmail: '',
      quadroEfetivoSubtitulo: 'Quadro efetivo - Opções',
      quadroEfetivoClausula1: 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
      quadroEfetivoClausula2: 'Para reduções no efetivo prazo de 30 (trinta) dias;',
      quadroEfetivoClausula3: 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
      condicoesColaboradores: [
         'Vale alimentação de R$900,00;',
         'Cesta trimestral de assiduidade;',
         '2 Vales transporte por dia.'
      ],
      condicoesCliente: [
         'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
         'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
         'Próximo reajuste Fevereiro/2026.'
      ],
      razaoSocial: '',
      cnpj: '',
      dataInicio: '',
      dataVencimento: '',
      contatoCargo: '',
      condicaoColaboradores1: 'Vale alimentação de R$900,00;',
      condicaoColaboradores2: 'Cesta trimestral de assiduidade;',
      condicaoColaboradores3: '2 Vales transporte por dia.',
      condicaoCliente1: 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
      condicaoCliente2: 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
      condicaoCliente3: 'Próximo reajuste Fevereiro/2026.'
    },
    premissas: { 
      taxaAdm: 5, 
      margemLucro: 10,
      comissaoVendedor: 0,
      tributos: [
        { id: '1', nome: 'ISS', percent: 5 },
        { id: '2', nome: 'CSLL', percent: 1 },
        { id: '3', nome: 'IR', percent: 1 },
        { id: '4', nome: 'PIS', percent: 1.65 },
        { id: '5', nome: 'COFINS', percent: 7.6 }
      ],
      reservaTecnicaPct: 0,
      manutencaoPct: 0
    },
    encargos: { 
      grupoA: { previdenciaSocial: 20.00, fgts: 8.00, sesc: 0.00, senac: 0.00, sebrae: 0.00, incra: 0.00, salarioEducacao: 0.00, seguroAcidenteFap: 0.00 },
      grupoB: { ferias: 9.35, auxilioEnfermidade: 1.03, faltasLegais: 1.89, licencaPaternidade: 0.00, auxilioAcidente: 0.22, avisoPrevioTrabalhado: 0.15 },
      grupoC: { abonoFerias: 3.12, decimoTerceiro: 9.39 },
      grupoD: { indenizacaoSemJustaCausa: 0.99, contribuicaoSocial: 0.27, avisoPrevioIndenizado: 2.71, reflexoAvisoPrevio: 0.79, indenizacaoAdicional: 0.00 },
      grupoE: { licencaMaternidade: 0.99, auxilioAcidenteMais15: 0.00, incidenciaFgtsAviso: 1.19, abonoPecuniario: 0.00 },
      grupoF: { incidenciaCumulativa: 0.00 }
    },
    equipe: [],
    versao: 1,
    insumos: {
      materiais: 0,
      maquinas: 0,
      descartaveis: 0,
      servicos: 0,
      servicosDescricao: '',
      detalheMateriais: [],
      detalheMaquinas: [],
      detalheDescartaveis: []
    },
    itensInclusosExcluidos: [
      { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
      { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
      { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
      { id: '4', descricao: 'Produtos químicos', incluso: false },
      { id: '5', descricao: 'Descartaveis', incluso: false }
    ]
  });

  const [resultado, setResultado] = useState<any>(null);
  const [activeAdicionaisPostoId, setActiveAdicionaisPostoId] = useState<string | null>(null);
  const [activeEpisPostoId, setActiveEpisPostoId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);

  // =========================================================================
  // ESTADOS DA DRE PARAMETRIZADA E EDITÁVEL
  // =========================================================================
  const [dreTaxPercent, setDreTaxPercent] = useState<number | ''>(12.5);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [showSaveChoiceModal, setShowSaveChoiceModal] = useState(false);
  const [changelogText, setChangelogText] = useState('');
  const [dreEncargos, setDreEncargos] = useState({
     fgts: 8.00,
     decimoTerceiro: 9.39,
     ferias: 9.35,
     fgtsRescisorio: 0.99,
     outros: 2.71,
     inss: 20.00
  });

  // Estado para controlar a expansão e retração das contas do DRE
  const [dreExpandedRows, setDreExpandedRows] = useState<Record<string, boolean>>({
     '01': true,
     '01.1': false,
     '01.2': false,
     '02': true,
     '02.1': false,
     '03': true,
     '03.1': false,
     '03.2': false,
     '03.3': false,
     '03.4': false,
     '03.5': false,
     '03.6': false,
     '03.7': false,
     '03.8': false,
     '03.9': false
  });

  // Sincroniza parâmetros padrão do DRE com os dados da Proposta quando carregada
  useEffect(() => {
     if (proposta && proposta.id) {
        if (proposta.dreTaxPercent !== undefined && proposta.dreTaxPercent !== null) {
           setDreTaxPercent(proposta.dreTaxPercent);
        } else {
           // Tributos padrão (soma de todos os impostos)
           const totalTributos = (proposta.premissas?.tributos || []).reduce((acc: number, t: any) => acc + (t.percent || 0), 0);
           if (totalTributos > 0) {
              setDreTaxPercent(totalTributos);
           }
        }

        if (proposta.dreEncargos && typeof proposta.dreEncargos === 'object') {
           setDreEncargos(proposta.dreEncargos);
        } else {
           // Encargos padrão dos grupos
           const fgtsVal = proposta.encargos?.grupoA?.fgts ?? 8.00;
           const inssVal = proposta.encargos?.grupoA?.previdenciaSocial ?? 20.00;
           const decimoTerceiroVal = proposta.encargos?.grupoC?.decimoTerceiro ?? 9.39;
           const feriasVal = proposta.encargos?.grupoB?.ferias ?? 9.35;
           const fgtsRescisorioVal = proposta.encargos?.grupoD?.indenizacaoSemJustaCausa ?? 0.99;
        
        // Outros encargos sum
        let outrosSoma = 0;
        const pEnc = proposta.encargos;
        if (pEnc && typeof pEnc === 'object') {
           Object.entries(pEnc).forEach(([grupoNome, grupo]: [string, any]) => {
              if (grupo && typeof grupo === 'object') {
                 Object.entries(grupo).forEach(([key, val]: [string, any]) => {
                    if (
                       !(grupoNome === 'grupoA' && key === 'fgts') &&
                       !(grupoNome === 'grupoA' && key === 'previdenciaSocial') &&
                       !(grupoNome === 'grupoC' && key === 'decimoTerceiro') &&
                       !(grupoNome === 'grupoB' && key === 'ferias') &&
                       !(grupoNome === 'grupoD' && key === 'indenizacaoSemJustaCausa')
                    ) {
                       outrosSoma += Number(val) || 0;
                    }
                 });
              }
           });
        }

        setDreEncargos({
           fgts: fgtsVal,
           decimoTerceiro: decimoTerceiroVal,
           ferias: feriasVal,
           fgtsRescisorio: fgtsRescisorioVal,
           outros: Number(outrosSoma.toFixed(2)) || 2.71,
           inss: inssVal
        });
         }
      }
  }, [proposta.id, proposta.dreTaxPercent, proposta.dreEncargos]);

  useEffect(() => {
    async function load() {
      try {
        console.log('Iniciando carregamento do Editor FPV...');
        setLoading(true);
        const [dataCcts, dataEscalas, dataProdutos, dataTipos, dataSegmentos, loggedUser, dataEmpresas, eqRes] = await Promise.all([
          getCCTs(), 
          getEscalas(), 
          getProdutos(), 
          getTiposServico(),
          getSegmentos(),
          getLoggedUser(),
          getEmpresasEmissoras(),
          getEquipesTecnicas()
        ]);
        setCcts(dataCcts || []);
        setEquipesTecnicasDb(eqRes?.success ? eqRes.list : []);
        setEscalasDb(dataEscalas || []);
        setProdutosDb(dataProdutos || []);
        setTiposServico(dataTipos || []);
        setSegmentos(dataSegmentos || []);
        setEmpresasEmissoras(dataEmpresas || []);
        if (dataEmpresas && dataEmpresas.length > 0) setSelectedEmpresaId(dataEmpresas[0].id);
        setCurrentUser(loggedUser || null);
        if (loggedUser && loggedUser.email === 'admin@smartbidhub.com.br') {
          router.push('/admin/empresas');
          return;
        }
        console.log('CCTs, Escalas, Produtos, Tipos de Serviço e Segmentos carregados.');
        
        const { getClientes } = await import('@/app/clientes/actions');
        const clientesData = await getClientes();
        setClientesList(clientesData || []);
        console.log('Clientes carregados:', clientesData?.length || 0);
        setCurrentUser(loggedUser);

        if (id) {
          console.log('Buscando proposta ID:', id);
          const fullData = await getPropostaCompleta(id);
          if (fullData) {
            console.log('Proposta encontrada. Mapeando dados...');
            const clientObj = (clientesData || []).find((c: any) => c.id === fullData.clientId);
            let savedSindicatoId = (fullData.premissas as any)?.meta?.sindicatoId || '';
            
            // Fallback para propostas antigas: Se não houver sindicatoId no meta, pega do primeiro cargo
            if (!savedSindicatoId && (fullData.equipe?.[0] as any)?.cargo?.cctId) {
               savedSindicatoId = (fullData.equipe[0] as any).cargo.cctId;
            }
            
            setProposta({
               ...proposta,
               id: fullData.id,
               cliente: { 
                 ...proposta.cliente, 
                 cliente: clientObj?.nomeFantasia || fullData.cliente.clienteNome || '', 
                 codigo: clientObj?.codigo || (fullData.cliente as any).codigo || '',
                 sindicatoId: savedSindicatoId,
                 contato: fullData.cliente.contato || '',
                 celular: fullData.cliente.celular || '',
                 email: fullData.cliente.email || '',
                 objetoProposta: fullData.cliente.objetoProposta || '',
                 hasEscopoTecnico: fullData.cliente.hasEscopoTecnico || false,
                 escopoTecnico: fullData.cliente.escopoTecnico || '',
                 cidade: fullData.cliente.cidade || '',
                 dataElaboracao: fullData.cliente.dataElaboracao || '',
                 numeroProposta: (fullData as any).numero || '',
                 revisao: `R${String(fullData.versao).padStart(2, '0')}`,
                 tipoServicos: fullData.cliente.tipoServicos || '',
                 tipoProposta: fullData.cliente.tipoProposta || 'RECORRENTE',
                 vendedorNome: (!fullData.cliente.vendedorNome || fullData.cliente.vendedorNome === 'Ádamo Quadros') ? (loggedUser?.nome || 'Ádamo Quadros') : fullData.cliente.vendedorNome,
                 vendedorCargo: (!fullData.cliente.vendedorCargo || fullData.cliente.vendedorCargo === 'Novos Negócios') ? (loggedUser?.cargo || (loggedUser?.role === 'ADMIN' ? 'Diretor Comercial' : loggedUser?.role === 'MANAGER' ? 'Gerente Comercial' : 'Novos Negócios')) : fullData.cliente.vendedorCargo,
                 vendedorTelefone: (!fullData.cliente.vendedorTelefone || fullData.cliente.vendedorTelefone === '(41) 9 9737-0880' || fullData.cliente.vendedorTelefone === '(41) 99737-0880') ? (loggedUser?.celular || '(41) 9 9737-0880') : fullData.cliente.vendedorTelefone,
                 vendedorEmail: (!fullData.cliente.vendedorEmail || fullData.cliente.vendedorEmail === 'contato@silvaconsultoria.com.br') ? (loggedUser?.email || 'contato@silvaconsultoria.com.br') : fullData.cliente.vendedorEmail,
                  quadroEfetivoSubtitulo: fullData.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
                  quadroEfetivoClausula1: fullData.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                  quadroEfetivoClausula2: fullData.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                  quadroEfetivoClausula3: fullData.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
               condicoesColaboradores: fullData.cliente.condicoesColaboradores || [],
               condicoesCliente: fullData.cliente.condicoesCliente || [],
               razaoSocial: clientObj?.razaoSocial || (fullData.cliente as any).razaoSocial || '',
               cnpj: clientObj?.cnpj || (fullData.cliente as any).cnpj || '',
               dataInicio: fullData.cliente.dataInicio || '',
               dataVencimento: fullData.cliente.dataVencimento || '',
               contatoCargo: fullData.cliente.contatoCargo || '',
               condicaoColaboradores1: fullData.cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
               condicaoColaboradores2: fullData.cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
               condicaoColaboradores3: fullData.cliente.condicaoColaboradores3 || '2 Vales transporte por dia.',
               condicaoCliente1: fullData.cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
               condicaoCliente2: fullData.cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
               condicaoCliente3: fullData.cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.'
               },
               premissas: {
                 ...fullData.premissas,
                 tributos: Array.isArray(fullData.premissas.tributos) ? fullData.premissas.tributos : []
               },
               equipe: (fullData.equipe || []).map((e: any) => {
                   let healedAtivosConfig = e.ativosConfig || {};
                   if (e.tipoItem === 'SPOT' && e.equipeTecnicaId) {
                      const eq = (eqRes?.success ? eqRes.list : []).find((x: any) => x.id === e.equipeTecnicaId);
                      if (eq) {
                         healedAtivosConfig = {
                            ...healedAtivosConfig,
                            custoMensalMaoObra: eq.custoMensalMaoObra,
                            custoMensalVeiculo: eq.custoMensalVeiculo,
                            custoMensalCombustivel: eq.custoMensalCombustivel,
                            custoMensalTotal: eq.custoMensalTotal
                         };
                      }
                   }
                   return {
                      ...e,
                      showConfig: false,
                      cctBase: (dataCcts || []).find((c: any) => c.id === savedSindicatoId) || {},
                      ativosConfig: healedAtivosConfig
                   };
                }),
               versao: fullData.versao,
               insumos: (fullData as any).insumos || { materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0, servicosDescricao: '' },
               dreEncargos: (fullData as any).dreEncargos,
               encargos: (fullData as any).encargos || proposta.encargos,
               itensInclusosExcluidos: (fullData.cliente as any).itensInclusosExcluidos || [
                  { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
                  { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
                  { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
                  { id: '4', descricao: 'Produtos químicos', incluso: false },
                  { id: '5', descricao: 'Descartaveis', incluso: false }
               ],
               dreTaxPercent: (fullData as any).dreTaxPercent
            });
            setVersions(fullData.availableVersions || []);
            console.log('Estado da proposta atualizado.');
          } else {
             console.warn('Proposta não encontrada no banco.');
             alert('Você não tem permissão para visualizar esta proposta ou ela não existe.');
             router.push('/');
          }
        } else if (loggedUser) {
           console.log('Nova proposta: inicializando com o perfil do vendedor logado...');
           setProposta((prev: any) => ({
              ...prev,
              cliente: {
                 ...prev.cliente,
                 vendedorNome: loggedUser.nome,
                 vendedorCargo: loggedUser.cargo || (loggedUser.role === 'ADMIN' ? 'Diretor Comercial' : loggedUser.role === 'MANAGER' ? 'Gerente Comercial' : 'Novos Negócios'),
                 vendedorTelefone: loggedUser.celular || '(41) 9 9737-0880',
                 vendedorEmail: loggedUser.email
              }
           }));
        }
      } catch (err) {
        console.error('CRITICAL ERROR no Editor FPV:', err);
        alert('Erro ao carregar editor. Verifique o console ou contate o suporte.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const totalTributos = (proposta.premissas.tributos || []).reduce((acc: any, t: any) => acc + (t.percent || 0), 0);

  useEffect(() => {
    if (proposta.equipe.length > 0) {
      const selectedCct = ccts.find(c => c.id === proposta.cliente.sindicatoId);

      // Sanitize and heal ativosConfig for SPOT services dynamically on calculation
      const sanitizedItems = proposta.equipe.map((item: any) => {
        if (item.tipoItem === 'SPOT' && item.equipeTecnicaId) {
          const eq = equipesTecnicasDb.find(x => x.id === item.equipeTecnicaId);
          if (eq) {
            return {
              ...item,
              ativosConfig: {
                ...item.ativosConfig,
                custoMensalMaoObra: eq.custoMensalMaoObra,
                custoMensalVeiculo: eq.custoMensalVeiculo,
                custoMensalCombustivel: eq.custoMensalCombustivel,
                custoMensalTotal: eq.custoMensalTotal
              }
            };
          }
        }
        return item;
      });

      const calcInput = {
        items: sanitizedItems,
        impostos: { total: totalTributos },
        margens: { adm: proposta.premissas.taxaAdm, lucro: proposta.premissas.margemLucro, comissaoVendedor: proposta.premissas.comissaoVendedor },
        reservaTecnicaPct: proposta.premissas.reservaTecnicaPct || 0,
        manutencaoPct: proposta.premissas.manutencaoPct || 0,
        encargos: proposta.encargos,
        cctGlobal: selectedCct,
        insumosGlobais: {
          materiais: proposta.insumos.materiais,
          maquinas: proposta.insumos.maquinas,
          descartaveis: proposta.insumos.descartaveis,
          servicos: proposta.insumos.servicos
        }
      };
      setResultado(calculateEnterprisePrice(calcInput));
    }
  }, [proposta, totalTributos, ccts, equipesTecnicasDb]);

  // Sincroniza a CCTBase de toda a equipe quando o sindicato principal muda
  useEffect(() => {
    if (proposta.cliente.sindicatoId && ccts.length > 0) {
      const selectedCct = ccts.find(c => c.id === proposta.cliente.sindicatoId);
      if (selectedCct) {
        const needsUpdate = proposta.equipe.some((p: any) => p.cctBase?.id !== selectedCct.id);
        if (needsUpdate) {
          const newEquipe = proposta.equipe.map((p: any) => ({
            ...p,
            cctBase: selectedCct
          }));
          setProposta((prev: any) => ({...prev, equipe: newEquipe}));
        }
      }
    }
  }, [proposta.cliente.sindicatoId, ccts]);

  // Atalhos de teclado para o Modo Apresentação
  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide(prev => (prev === 13 ? 1 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev === 1 ? 13 : prev - 1));
      } else if (e.key === 'Escape') {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);

  // Atualiza o title do documento constantemente para que impressoes via Ctrl+P ou menu do navegador
  // sugiram o nome correto de arquivo do PDF
  useEffect(() => {
    const numRaw = proposta.cliente?.numeroProposta;
    const num = numRaw ? `FPV-${String(numRaw).padStart(3, '0')}` : "FPV-XXX";
    const rev = proposta.cliente?.revisao || "R01";
    const clientName = proposta.cliente?.cliente || proposta.cliente?.razaoSocial || "Cliente";
    document.title = `PROPOSTA COMERCIAL - ${num}-${rev} - ${clientName}`.toUpperCase();
  }, [proposta.cliente?.numeroProposta, proposta.cliente?.revisao, proposta.cliente?.cliente, proposta.cliente?.razaoSocial]);

  const handleCalcularProposta = async () => {
    try {
      setLoading(true);
      const [dataProdutos, dataCcts] = await Promise.all([
        getProdutos(),
        getCCTs()
      ]);
      setProdutosDb(dataProdutos || []);
      setCcts(dataCcts || []);

      const updateList = (list: any[], db: any[]) => {
        if (!Array.isArray(list)) return [];
        return list.map(item => {
          const prodDb = db.find(p => p.id === item.id || p.codigo === item.codigo);
          if (prodDb) {
            const novoPreco = Number(prodDb.precoUnitario || prodDb.valor || 0);
            const qtd = Number(item.quantidade || item.qtde || 0);
            const vida = Number(item.vidaUtil || 1);
            return {
              ...item,
              precoUnitario: novoPreco,
              custoMensal: vida > 0 ? (novoPreco * qtd) / vida : (novoPreco * qtd)
            };
          }
          return item;
        });
      };

      const newEquipe = proposta.equipe.map((posto: any) => {
        let newCctBase = posto.cctBase;
        let newCargo = posto.cargo;
        if (posto.cctBase?.id) {
          const dbCct = dataCcts?.find((c: any) => c.id === posto.cctBase.id);
          if (dbCct) {
            newCctBase = dbCct;
            if (posto.cargo?.nome) {
              const dbCargo = dbCct.cargos?.find((c: any) => c.nome === posto.cargo.nome);
              if (dbCargo) newCargo = dbCargo;
            }
          }
        }
        return {
          ...posto,
          cctBase: newCctBase,
          cargo: newCargo,
          configFinanceira: {
            ...posto.configFinanceira,
            epi: updateList(posto.configFinanceira?.epi, dataProdutos || []),
            uniformes: updateList(posto.configFinanceira?.uniformes, dataProdutos || []),
            equipamentos: updateList(posto.configFinanceira?.equipamentos, dataProdutos || []),
            insumos: updateList(posto.configFinanceira?.insumos, dataProdutos || []),
          }
        };
      });

      const newInsumos = {
        ...proposta.insumos,
        detalheMateriais: updateList(proposta.insumos?.detalheMateriais, dataProdutos || []),
        detalheDescartaveis: updateList(proposta.insumos?.detalheDescartaveis, dataProdutos || []),
        detalheMaquinas: updateList(proposta.insumos?.detalheMaquinas, dataProdutos || []),
      };
      
      const calcTotal = (arr: any[]) => arr.reduce((acc, curr) => acc + (curr.custoMensal || 0), 0);
      newInsumos.materiais = calcTotal(newInsumos.detalheMateriais);
      newInsumos.descartaveis = calcTotal(newInsumos.detalheDescartaveis);
      newInsumos.maquinas = calcTotal(newInsumos.detalheMaquinas);

      setProposta((prev: any) => ({
        ...prev,
        equipe: newEquipe,
        insumos: newInsumos
      }));

      alert("Custos recalculados com sucesso com os valores atualizados do banco de dados!");
    } catch (error) {
      console.error(error);
      alert("Erro ao recalcular proposta.");
    } finally {
      setLoading(false);
    }
  };

  const addTributo = () => {
    setProposta({ ...proposta, premissas: { ...proposta.premissas, tributos: [...proposta.premissas.tributos, { id: Math.random().toString(), nome: '', percent: 0 }] } });
  };

  const addPosto = () => {
    const defaultCCT = ccts[0] || { id: 'mock', funcao: 'Selecione a CCT', pisoSalarial: 0 };
    setProposta({ 
      ...proposta, 
      equipe: [...proposta.equipe, { id: Math.random().toString(), nomeCargo: defaultCCT.funcao, quantidade: 1, escala: '5x2', configFinanceira: defaultCCT, ativosConfig: {} }] 
    });
  };

  const updatePosto = (id: string, field: string, val: any) => {
    const newEquipe = proposta.equipe.map((p: any) => p.id === id ? { ...p, [field]: val } : p);
    setProposta({ ...proposta, equipe: newEquipe });
  };

  const calculateAutoNoturno = (hInicio: string, hFim: string, diasMesRaw: number | string) => {
    const diasMes = Number(diasMesRaw) || 0;
    if (!hInicio || !hFim || diasMes <= 0) return 0;
    
    try {
      const getMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const inicio = getMinutes(hInicio);
      const fim = getMinutes(hFim);
      
      let noturnasMinutos = 0;
      const NOTURNO_INICIO = 22 * 60; // 22:00
      const NOTURNO_FIM = 5 * 60;    // 05:00

      if (fim < inicio) {
        // Cruza a meia-noite
        noturnasMinutos += Math.max(0, (24 * 60) - Math.max(inicio, NOTURNO_INICIO));
        noturnasMinutos += Math.max(0, Math.min(fim, NOTURNO_FIM));
        
        // Súmula 60 TST: Prorrogação se trabalhou todo o período noturno
        if (inicio <= NOTURNO_INICIO && fim >= NOTURNO_FIM) {
          noturnasMinutos += Math.max(0, fim - NOTURNO_FIM);
        }
      } else {
        // Mesmo dia
        noturnasMinutos += Math.max(0, Math.min(fim, NOTURNO_FIM) - Math.min(inicio, NOTURNO_FIM));
        noturnasMinutos += Math.max(0, Math.min(fim, 24 * 60) - Math.max(inicio, NOTURNO_INICIO));
      }

      const horasNoturnasPorDia = (noturnasMinutos / 60) * 1.142857;
      return Number((horasNoturnasPorDia * diasMes).toFixed(2));
    } catch (e) {
      return 0;
    }
  };

  
  
  const handleSaveTipoServico = async () => {
    if (!newTipoName.trim()) return;
    setIsSavingTipo(true);
    try {
      const res = await createTipoServico(newTipoName);
      if (res.success && res.data) {
        setTiposServico([...tiposServico, res.data]);
        setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: res.data.nome}});
        setShowNewTipoModal(false);
        setNewTipoName('');
      } else {
        alert("Erro ao criar tipo de serviço: " + res.error);
      }
    } catch (e) {
      alert("Erro ao criar tipo de serviço");
    } finally {
      setIsSavingTipo(false);
    }
  };

  const handleSaveSegmento = async () => {
    if (!newSegmentoName.trim()) return;
    setIsSavingSegmento(true);
    try {
      const res = await createSegmento(newSegmentoName);
      if (res.success && res.data) {
        setSegmentos([...segmentos, res.data]);
        setProposta({...proposta, cliente: {...proposta.cliente, segmento: res.data.nome}});
        setShowNewSegmentoModal(false);
        setNewSegmentoName('');
      } else {
        alert("Erro ao criar segmento: " + res.error);
      }
    } catch (e) {
      alert("Erro ao criar segmento");
    } finally {
      setIsSavingSegmento(false);
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClientForm.nomeFantasia.trim()) return alert('Nome Fantasia é obrigatório');
    setSavingClient(true);
    try {
      const res = await createCliente(newClientForm);
      if (res.success || !res.error) {
        // success
        const updatedClientes = await getClientes();
        setClientesList(updatedClientes || []);
        setProposta({
          ...proposta,
          cliente: {
             ...proposta.cliente,
             cliente: newClientForm.nomeFantasia,
             codigo: (res as any).data?.codigo || '',
             cnpj: newClientForm.cnpj,
             email: newClientForm.email,
             celular: newClientForm.whatsapp,
             contato: newClientForm.contato,
             segmento: newClientForm.segmento
          }
        });
        setShowNewClientModal(false);
        setNewClientForm({ nomeFantasia: '', razaoSocial: '', cnpj: '', email: '', whatsapp: '', endereco: '', contato: '', segmento: '' });
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveNewProduct = async () => {
    if (!newProductForm.descricao.trim()) return alert('Descrição é obrigatória');
    setSavingProduct(true);
    try {
      const res = await createProduto(newProductForm);
      if (res.success && res.produto) {
        const updatedProdutos = await getProdutos();
        setProdutosDb(updatedProdutos || []);
        if (activeProdutoTipo) {
           addInsumoItem(activeProdutoTipo, res.produto);
        }
        setShowNewProductModal(false);
        setNewProductForm({ descricao: '', precoUnitario: 0, unidade: 'UN', categoria: 'Geral' });
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSave = async () => {
    if (!proposta.cliente.cliente) return alert('Por favor, selecione ou informe o cliente.');
    if (proposta.equipe.length === 0) return alert('Adicione ao menos um posto no quadro de equipe.');

    // Se for nova proposta, salva direto sem escolha de versão
    if (!proposta.id) {
      await executeSave('Criação inicial da proposta', false);
      return;
    }

    // Se for edição, abre modal de escolha: mesma versão ou nova versão
    setShowSaveChoiceModal(true);
  };

  // novaVersao=false → salva sobrepondo a versão atual (mesma versão)
  // novaVersao=true  → cria nova revisão com changelog
  const executeSave = async (changelog: string, novaVersao: boolean = false) => {
    try {
      setSaving(true);
      const res = await saveProposta({ 
        ...proposta, 
        resultado, 
        dreTaxPercent, 
        dreEncargos, 
        changelog,
        novaVersao 
      });
      if (res.success) {
        const msg = novaVersao
          ? `Nova Revisão R${String(res.versao).padStart(2, '0')} salva com sucesso!`
          : `Proposta salva na mesma versão R${String(res.versao).padStart(2, '0')}.`;
        alert(msg);
        const novoNumero = res.numeroProposta || proposta.cliente.numeroProposta;
        const novaRevisao = `R${String(res.versao).padStart(2, '0')}`;
        setProposta({ 
          ...proposta, 
          id: res.propostaId, 
          versao: res.versao,
          cliente: {
            ...proposta.cliente,
            numeroProposta: novoNumero,
            revisao: novaRevisao
          },
          dreTaxPercent,
          dreEncargos
        });
        const updatedData = await getPropostaCompleta(res.propostaId);
        if (updatedData) setVersions(updatedData.availableVersions || []);
        setShowChangelogModal(false);
        setShowSaveChoiceModal(false);
        setChangelogText('');
        if (!proposta.id) {
           router.push(`/propostas/nova?id=${res.propostaId}`);
        }
      } else {
        alert('Erro ao salvar: ' + res.error);
      }
    } catch (e: any) {
      alert('Erro inesperado: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const sumGroup = (g: any) => Object.values(g).reduce((a: any, b: any) => a + Number(b), 0) as number;
  const totalGeralEncargos = proposta.encargos.grupoA ? (sumGroup(proposta.encargos.grupoA) + sumGroup(proposta.encargos.grupoB) + sumGroup(proposta.encargos.grupoC) + sumGroup(proposta.encargos.grupoD) + sumGroup(proposta.encargos.grupoE) + sumGroup(proposta.encargos.grupoF)) : 0;
  const isSpot = proposta.equipe.some((e: any) => e.tipoItem === 'SPOT');
 
  const normalizeText = (text: string) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const isLocado = (desc: string) => {
    if (!desc) return false;
    const normalized = normalizeText(desc);
    return normalized.includes('locado') || normalized.includes('locada') || normalized.includes('locacao') || normalized.includes('locaco') || normalized.includes('locação');
  };

  const detalheMaquinas = proposta.insumos?.detalheMaquinas || [];
  const totalMaquinasLocadas = detalheMaquinas
    .filter((item: any) => isLocado(item.descricao))
    .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);
  const totalMaquinasNaoLocadas = detalheMaquinas
    .filter((item: any) => !isLocado(item.descricao))
    .reduce((acc: number, item: any) => acc + (item.custoMensal || 0), 0);

  const addInsumoItem = (tipo: 'detalheMateriais' | 'detalheMaquinas' | 'detalheDescartaveis', produto: any) => {
    const current = proposta.insumos[tipo] || [];
    if (current.find((x: any) => x.id === produto.id)) return;
    const newItem = {
      id: produto.id,
      codigo: produto.codigo,
      descricao: produto.descricao,
      precoUnitario: produto.precoUnitario,
      quantidade: 1,
      vidaUtil: 1,
      custoMensal: produto.precoUnitario
    };
    const newList = [...current, newItem];
    const total = newList.reduce((acc, x) => acc + x.custoMensal, 0);
    const tipoTotal = tipo.replace('detalhe', '').toLowerCase();
    setProposta({
      ...proposta,
      insumos: {
        ...proposta.insumos,
        [tipo]: newList,
        [tipoTotal]: total
      }
    });
  };

  const removeInsumoItem = (tipo: 'detalheMateriais' | 'detalheMaquinas' | 'detalheDescartaveis', id: string) => {
    const newList = (proposta.insumos[tipo] || []).filter((x: any) => x.id !== id);
    const total = newList.reduce((acc: number, x: any) => acc + x.custoMensal, 0);
    const tipoTotal = tipo.replace('detalhe', '').toLowerCase();
    setProposta({
      ...proposta,
      insumos: {
        ...proposta.insumos,
        [tipo]: newList,
        [tipoTotal]: total
      }
    });
  };

  const updateInsumoItem = (tipo: 'detalheMateriais' | 'detalheMaquinas' | 'detalheDescartaveis', id: string, field: string, value: any) => {
    const newList = (proposta.insumos[tipo] || []).map((x: any) => {
      if (x.id === id) {
        const updated = { ...x, [field]: value };
        updated.custoMensal = (updated.quantidade * updated.precoUnitario) / (updated.vidaUtil || 1);
        return updated;
      }
      return x;
    });
    const total = newList.reduce((acc: number, x: any) => acc + x.custoMensal, 0);
    const tipoTotal = tipo.replace('detalhe', '').toLowerCase();
    setProposta({
      ...proposta,
      insumos: {
        ...proposta.insumos,
        [tipo]: newList,
        [tipoTotal]: total
      }
    });
  };

  const renderInsumosTab = (tipo: 'detalheMateriais' | 'detalheMaquinas' | 'detalheDescartaveis', categorias: string[], titulo: string) => {
    const itens = proposta.insumos[tipo] || [];
    const total = proposta.insumos[tipo.replace('detalhe', '').toLowerCase()] || 0;
    
    const normalizedCats = categorias.map(c => normalizeText(c));
    const produtosFiltrados = produtosDb.filter(p => normalizedCats.includes(normalizeText(p.categoria)));

    return (
      <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
        <div className="bg-[#1B4D3E] px-6 py-4 flex justify-between items-center border-b border-[#13382D]">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Box size={16} /> {titulo}
          </h2>
          <div className="text-white font-bold text-lg">
            Total Mensal: {formatCurrency(total)}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Adicionar Item da Tabela de Produtos</label>
              <button 
                 onClick={() => {
                    setActiveProdutoTipo(tipo);
                    setShowNewProductModal(true);
                 }}
                 className="text-[10px] text-[#1B4D3E] font-bold uppercase tracking-wider hover:text-[#12362b] transition-colors bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
              >
                 + Novo Produto
              </button>
            </div>

            <select 
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B4D3E]"
              value=""
              onChange={(e) => {
                const prod = produtosDb.find(p => p.id === e.target.value);
                if (prod) addInsumoItem(tipo, prod);
              }}
            >
              <option value="" className="text-slate-800 bg-white">Selecione um produto para adicionar...</option>
              {produtosFiltrados.map(p => (
                <option key={p.id} value={p.id}>[{p.codigo}] {p.descricao} - {formatCurrency(p.precoUnitario)}</option>
              ))}
            </select>
          </div>

          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-4 py-2 w-20">Cód.</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2 text-right">Preço Unit.</th>
                <th className="px-4 py-2 text-center w-20">Qtd.</th>
                <th className="px-4 py-2 text-center w-24">Vida Útil (Meses)</th>
                <th className="px-4 py-2 text-right">Custo Mensal</th>
                <th className="px-4 py-2 text-center w-16">Ação</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{item.codigo}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">{item.descricao}</td>
                  <td className="px-4 py-2 text-right">
                    {tipo === 'detalheMaquinas' && isLocado(item.descricao) ? (
                      <input 
                        type="number" 
                        className="w-28 bg-white text-slate-800 border border-slate-300 rounded px-2 py-1 text-right font-bold outline-none focus:border-[#1B4D3E]"
                        value={item.precoUnitario}
                        onChange={(e) => updateInsumoItem(tipo, item.id, 'precoUnitario', (e.target.value === '' ? '' : Number(e.target.value)))}
                      />
                    ) : (
                      <span className="text-slate-600">{formatCurrency(item.precoUnitario)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      className="w-full bg-white text-slate-800 border border-slate-300 rounded px-2 py-1 text-center font-bold outline-none focus:border-[#1B4D3E]"
                      value={item.quantidade}
                      onChange={(e) => updateInsumoItem(tipo, item.id, 'quantidade', (e.target.value === '' ? '' : Number(e.target.value)))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      className="w-full bg-white text-slate-800 border border-slate-300 rounded px-2 py-1 text-center font-bold outline-none focus:border-[#1B4D3E]"
                      value={item.vidaUtil}
                      onChange={(e) => updateInsumoItem(tipo, item.id, 'vidaUtil', (e.target.value === '' ? '' : Number(e.target.value)))}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-[#1B4D3E] bg-emerald-50">
                    {formatCurrency(item.custoMensal)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => removeInsumoItem(tipo, item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {itens.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">Nenhum item adicionado. Selecione um produto acima.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEncargoTable = (grupoNome: string, titulo: string, descricao: string, dados: Record<string, number>, setDados: any) => {
     return (
        <div className="bg-white border border-slate-300 rounded-md overflow-hidden mb-6">
           <div className="bg-[#1B4D3E] text-white font-bold uppercase text-xs py-2 px-4">{titulo}</div>
           <div className="bg-slate-50 text-slate-600 text-[11px] py-1 px-4 border-b border-slate-300">{descricao}</div>
           <table className="w-full text-left border-collapse text-xs">
              <tbody>
                 {Object.entries(dados).map(([key, val]) => (
                    <tr key={key} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                       <td className="py-2 px-4 text-slate-700 font-bold uppercase text-[10px]">
                          {key === 'previdenciaSocial' ? 'INSS - PREVIDENCIA SOCIAL' : key.replace(/([A-Z])/g, ' $1').trim()}
                       </td>
                       <td className="py-2 px-4 text-right w-24">
                          <div className="flex items-center justify-end gap-1">
                             {viewMode === 'document' ? (
                                <span className="font-bold text-slate-800">{val}%</span>
                             ) : (
                                <>
                                  <input type="number" step="0.01" className="w-16 bg-white border border-slate-300 text-right font-medium text-slate-800 focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] outline-none rounded px-1 py-0.5" value={val} onChange={(e) => setDados({...dados, [key]: (e.target.value === '' ? '' : Number(e.target.value))})} />
                                  <span className="text-slate-500">%</span>
                                </>
                             )}
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
              <tfoot>
                 <tr className="bg-emerald-100/50 text-[#1B4D3E] font-bold text-xs border-t border-slate-300">
                    <td className="py-2 px-4">Total {grupoNome}</td>
                    <td className="py-2 px-4 text-right">{sumGroup(dados).toFixed(2)}%</td>
                 </tr>
              </tfoot>
           </table>
        </div>
     );
  };

  if (loading) {
     return (
        <div className="flex min-h-screen bg-slate-50">
           <Sidebar />
           <main className="flex-1 flex items-center justify-center">
              <div className="text-[#1B4D3E] font-bold animate-pulse">Carregando Editor FPV...</div>
           </main>
        </div>
     );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-8 flex flex-col items-center">
        
        {/* HEADER ENTERPRISE */}
        <header className="w-full max-w-7xl flex justify-between items-end mb-6 border-b border-slate-300 pb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                   FPV - Formação de Preço de Vendas
                </h1>
                {id && versions.length > 1 && (
                  <div className="flex flex-col ml-4">
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1">
                      <History size={16} className="text-slate-500 shrink-0" />
                      <select 
                        className="bg-transparent text-xs font-black text-slate-700 uppercase outline-none cursor-pointer"
                        value={versions.find(v => v.versao === proposta.versao)?.id || ''}
                        onChange={(e) => handleVersionChange(e.target.value)}
                      >
                        {versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            Versão {v.versao} ({v.data})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div 
                      className="text-[9px] text-slate-400 mt-1 max-w-[280px] truncate hover:text-slate-700 hover:whitespace-normal transition-all font-semibold uppercase tracking-tighter"
                      title={versions.find(v => v.versao === proposta.versao)?.changelog || 'Sem descrição.'}
                    >
                      💡 {versions.find(v => v.versao === proposta.versao)?.changelog || 'Criação inicial da proposta'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bell-header-spacing">
               {id && versions.length <= 1 && (
                 <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-medium">Revisão {proposta.versao}</span>
               )}
               {!id && (
                 <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">Nova Proposta</span>
               )}
               <button 
                 onClick={handleCalcularProposta}
                 disabled={loading}
                 className="bg-[#2A4365] hover:bg-[#1E3A8A] text-white text-sm font-semibold py-2 px-4 rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                  <Calculator size={16} /> Calcular Proposta
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saving}
                 className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-sm font-semibold py-2 px-6 rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
               >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar FPV'}
               </button>
            </div>
        </header>

        {/* NAVEGAÇÃO POR ABAS - ESTILO MULTI-LINHA PARA EVITAR SCROLL */}
        {activeTab !== 'comercial' && (
           <div className="w-full max-w-7xl mb-8 border-b border-slate-200 pb-2">
              <nav className="flex flex-wrap gap-x-6 gap-y-2">
                 {TABS.filter(tab => {
                    if (proposta.cliente.tipoProposta === 'SPOT' && (tab.id === 'dre' || tab.id === 'encargos')) {
                       return false;
                    }
                    return true;
                 }).map((tab) => {
                    let label = tab.label;
                    if (proposta.cliente.tipoProposta === 'SPOT' && tab.id === 'quadro') {
                       label = '4. Serviços';
                    }
                    return (
                       <button 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id)} 
                          className={`
                             whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all duration-200
                             ${activeTab === tab.id 
                                ? 'border-[#1B4D3E] text-[#1B4D3E] scale-105 opacity-100' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 opacity-80'}
                          `}
                       >
                          <tab.icon size={14} className={activeTab === tab.id ? 'text-[#10B981]' : 'text-slate-400'} /> 
                          {label}
                       </button>
                    );
                 })}
              </nav>
           </div>
        )}

        {/* ÁREA DE CONTEÚDO */}
        <div className="w-full max-w-7xl min-h-[600px]">
           
           {/* ABA 1: CLIENTE (Layout Profissional) */}
           {activeTab === 'dados' && (
              <div className="bg-white border border-slate-300 rounded-md shadow-sm">
                 <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] rounded-t-md">
                    <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                       <FileText size={16} /> Identificação do Projeto
                    </h2>
                 </div>
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                     <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Modalidade da Proposta</label>
                        <div className="flex gap-4 p-1 bg-slate-200/60 rounded-xl max-w-lg">
                           <button
                              type="button"
                              onClick={() => {
                                 setProposta({
                                    ...proposta,
                                    cliente: { ...proposta.cliente, tipoProposta: 'RECORRENTE' }
                                 });
                              }}
                              className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg uppercase tracking-wide transition-all ${proposta.cliente.tipoProposta !== 'SPOT' ? 'bg-[#1B4D3E] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                           >
                              💼 CLT Recorrente
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 setProposta({
                                    ...proposta,
                                    cliente: { ...proposta.cliente, tipoProposta: 'SPOT' }
                                 });
                              }}
                              className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg uppercase tracking-wide transition-all ${proposta.cliente.tipoProposta === 'SPOT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                           >
                              ⚡ Serviços SPOT
                           </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">
                           {proposta.cliente.tipoProposta === 'SPOT' 
                              ? '⚡ Módulo Spot ativo: serviços por diária/hora, sem jornadas CLT complexas, DRE desativado.' 
                              : '💼 Módulo Recorrente ativo: escalas CLT, encargos completos de convenção coletiva (CCT) e DRE do projeto.'
                           }
                        </p>
                     </div>

                    <div className="space-y-1 relative">
                       
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-700">Cliente (Buscar Cadastrado)</label>
                          <button 
                             onClick={() => setShowNewClientModal(true)}
                             className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hover:text-emerald-800 transition-colors bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                             + Novo Cliente
                          </button>
                       </div>

                       <input 
                          type="text" 
                          placeholder="Digite para buscar..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" 
                          value={proposta.cliente.cliente} 
                          onChange={(e) => {
                             setProposta({...proposta, cliente: {...proposta.cliente, cliente: e.target.value}});
                             setShowClientDropdown(true);
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                       />
                       {showClientDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                             {clientesList.filter((c: any) => c.nomeFantasia.toLowerCase().includes(proposta.cliente.cliente.toLowerCase())).map((c: any) => (
                                <div 
                                   key={c.id} 
                                   className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-slate-700"
                                   onClick={() => {
                                       setProposta({
                                          ...proposta, 
                                          cliente: {
                                             ...proposta.cliente, 
                                             cliente: c.nomeFantasia,
                                             codigo: c.codigo || '',
                                             razaoSocial: c.razaoSocial || '',
                                             cnpj: c.cnpj || '',
                                             cidade: c.cidade || '',
                                             email: c.email || '',
                                             celular: c.whatsapp || '',
                                             contato: c.contato || '',
                                             contatoCargo: ''
                                          }
                                       });
                                       setShowClientDropdown(false);
                                    }}
                                >
                                   {c.nomeFantasia} <span className="text-xs text-slate-400">({c.cnpj})</span>
                                </div>
                             ))}
                             {clientesList.filter((c: any) => c.nomeFantasia.toLowerCase().includes(proposta.cliente.cliente.toLowerCase())).length === 0 && (
                                <div className="px-4 py-2 text-sm text-slate-500 italic">Nenhum cliente encontrado</div>
                             )}
                          </div>
                       )}
                    </div>
                    
                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Cidade Base</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.cidade} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, cidade: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Data de Elaboração</label>
                       <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.dataElaboracao} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, dataElaboracao: e.target.value}})} />
                    </div>

                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Nº da Proposta
                          <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Auto</span>
                        </label>
                        <input 
                          type="text" 
                          readOnly 
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 font-bold outline-none cursor-default select-all" 
                          value={proposta.cliente.numeroProposta || (proposta.id ? '' : 'Gerado ao salvar')} 
                          placeholder="Gerado ao salvar"
                        />
                     </div>

                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          Revisão
                          <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Auto</span>
                        </label>
                        <input 
                          type="text" 
                          readOnly
                          className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-600 font-bold outline-none cursor-default" 
                          value={proposta.id ? `R${String(proposta.versao).padStart(2, '0')}` : 'R01 (ao salvar)'} 
                        />
                     </div>

                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Sindicato / Regra Técnica</label>
                        <select 
                           className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium"
                           value={proposta.cliente.sindicatoId}
                           onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, sindicatoId: e.target.value}})}
                        >
                           <option value="" className="text-slate-800 bg-white">Selecione o Sindicato...</option>
                           {ccts.map((c: any) => (
                              <option key={c.id} value={c.id} className="text-slate-800 bg-white">{c.nome} ({c.uf})</option>
                           ))}
                        </select>
                     </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Tipo dos Serviços</label>
                          <button onClick={() => setShowNewTipoModal(true)} className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"><Plus size={12}/> Novo</button>
                       </div>
                       <select 
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium"
                          value={proposta.cliente.tipoServicos}
                          onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: e.target.value}})}
                       >
                          <option value="" className="text-slate-800 bg-white">Selecione o Tipo...</option>
                          {tiposServico.map((t: any) => (
                             <option key={t.id} value={t.nome} className="text-slate-800 bg-white">{t.nome}</option>
                          ))}
                       </select>
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Contato / Responsável</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.contato} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, contato: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Celular / WhatsApp</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.celular} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, celular: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Segmento do Cliente</label>
                          <button onClick={() => setShowNewSegmentoModal(true)} className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"><Plus size={12}/> Novo</button>
                       </div>
                       <select 
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                          value={proposta.cliente.segmento || ''}
                          onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, segmento: e.target.value}})}
                       >
                          <option value="" className="text-slate-800 bg-white">Selecione...</option>
                          {segmentos.map((s: any) => (
                             <option key={s.id} value={s.nome} className="text-slate-800 bg-white">{s.nome}</option>
                          ))}
                       </select>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                       <label className="text-xs font-semibold text-slate-700">E-mail Comercial</label>
                       <input type="email" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.email} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, email: e.target.value}})} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Objeto da Proposta</label>
                       <textarea className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] resize-none min-h-[80px]" value={proposta.cliente.objetoProposta} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, objetoProposta: e.target.value}})}></textarea>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2 pt-2 pb-1">
                       <input 
                          type="checkbox" 
                          id="hasEscopoTecnico"
                          className="w-4 h-4 text-[#1B4D3E] border-slate-300 rounded focus:ring-[#1B4D3E] cursor-pointer"
                          checked={proposta.cliente.hasEscopoTecnico || false}
                          onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, hasEscopoTecnico: e.target.checked}})}
                       />
                       <label htmlFor="hasEscopoTecnico" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          📋 Incluir Escopo Técnico na Proposta
                       </label>
                    </div>

                    {proposta.cliente.hasEscopoTecnico && (
                       <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Detalhamento do Escopo Técnico</label>
                          <textarea 
                             className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] min-h-[120px]" 
                             value={proposta.cliente.escopoTecnico || ''} 
                             placeholder="Descreva aqui de forma detalhada o escopo técnico a ser executado..."
                             onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, escopoTecnico: e.target.value}})}
                          ></textarea>
                       </div>
                    )}

                    {/* ITENS INCLUSOS E EXCLUSOS (Aba 1) */}
                    <div className="md:col-span-2 space-y-4 pt-6 mt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Itens Inclusos e Exclusos</h3>
                                <p className="text-xs text-slate-500 mt-1">Configure os itens que farão parte do escopo desta proposta.</p>
                            </div>
                            <button
                                type="button"
                                className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all active:scale-95 shadow-sm cursor-pointer"
                                onClick={() => {
                                   const newId = String(Date.now());
                                   const newItem = { id: newId, descricao: 'Novo Item', incluso: true };
                                   const newList = [...(proposta.itensInclusosExcluidos || []), newItem];
                                   setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                }}
                             >
                                ➕ Novo Item
                             </button>
                        </div>
                        
                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 w-16 text-center">Item</th>
                                    <th className="px-4 py-3">Descrição</th>
                                    <th className="px-4 py-3 text-center w-28">Incluso?</th>
                                    <th className="px-4 py-3 text-center w-16">Ação</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                    <tr key={p.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50 bg-white">
                                       <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">
                                          {String(idx + 1).padStart(2, '0')}
                                       </td>
                                       <td className="px-4 py-3">
                                          <input 
                                             type="text" 
                                             className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none focus:border-[#1B4D3E] font-medium"
                                             value={p.descricao || ''}
                                             onChange={(e) => {
                                                const newList = proposta.itensInclusosExcluidos.map((item: any) => 
                                                   item.id === p.id ? { ...item, descricao: e.target.value } : item
                                                );
                                                setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                             }}
                                          />
                                       </td>
                                       <td className="px-4 py-3 text-center">
                                          <input 
                                             type="checkbox" 
                                             className="w-4 h-4 text-[#1B4D3E] focus:ring-[#1B4D3E] border-slate-300 rounded cursor-pointer"
                                             checked={!!p.incluso}
                                             onChange={(e) => {
                                                const newList = proposta.itensInclusosExcluidos.map((item: any) => 
                                                   item.id === p.id ? { ...item, incluso: e.target.checked } : item
                                                );
                                                setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                             }}
                                          />
                                       </td>
                                       <td className="px-4 py-3 text-center">
                                          <button
                                             type="button"
                                             className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                                             onClick={() => {
                                                const newList = proposta.itensInclusosExcluidos.filter((item: any) => item.id !== p.id);
                                                setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                             }}
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                    </div>
                 </div>
              </div>
           )}

           {/* ABA 2: TAXAS E TRIBUTOS */}
           {activeTab === 'premissas' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-md border border-slate-300 shadow-sm flex flex-col gap-2">
                       <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Taxa Administrativa (%)</label>
                       <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-lg font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={proposta.premissas.taxaAdm} onChange={(e) => setProposta({...proposta, premissas: {...proposta.premissas, taxaAdm: (e.target.value === '' ? '' : Number(e.target.value))}})} />
                    </div>
                    <div className="bg-white p-6 rounded-md border border-slate-300 shadow-sm flex flex-col gap-2">
                       <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Margem de Lucro (%)</label>
                       <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-lg font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={proposta.premissas.margemLucro} onChange={(e) => setProposta({...proposta, premissas: {...proposta.premissas, margemLucro: (e.target.value === '' ? '' : Number(e.target.value))}})} />
                    </div>
                    <div className="bg-white p-6 rounded-md border border-slate-300 shadow-sm flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Comissão do Vendedor (%)</label>
                        <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-lg font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={proposta.premissas.comissaoVendedor ?? 0} onChange={(e) => setProposta({...proposta, premissas: {...proposta.premissas, comissaoVendedor: (e.target.value === '' ? '' : Number(e.target.value))}})} />
                     </div>
                 </div>

                 <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-300 px-6 py-4 flex justify-between items-center">
                       <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Composição Tributária</h3>
                       <button onClick={addTributo} className="text-[#1B4D3E] hover:text-[#13382D] text-xs font-semibold flex items-center gap-1"><Plus size={14}/> Nova Linha</button>
                    </div>
                    <div className="p-6 space-y-3">
                       {proposta.premissas.tributos.map((t: any) => (
                          <div key={t.id} className="flex gap-4 items-center">
                             <input type="text" className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:border-[#1B4D3E] outline-none" placeholder="Descrição do Imposto..." value={t.nome} onChange={(e) => {
                                const newT = proposta.premissas.tributos.map((x: any) => x.id === t.id ? {...x, nome: e.target.value} : x);
                                setProposta({...proposta, premissas: {...proposta.premissas, tributos: newT}});
                             }} />
                             <div className="relative w-32">
                                <input type="number" step="0.01" className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-800 focus:border-[#1B4D3E] outline-none text-right pr-8" value={t.percent} onChange={(e) => {
                                   const newT = proposta.premissas.tributos.map((x: any) => x.id === t.id ? {...x, percent: (e.target.value === '' ? '' : Number(e.target.value))} : x);
                                   setProposta({...proposta, premissas: {...proposta.premissas, tributos: newT}});
                                }} />
                                <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
                             </div>
                             <button onClick={() => setProposta({...proposta, premissas: {...proposta.premissas, tributos: proposta.premissas.tributos.filter((x: any) => x.id !== t.id)}})} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </div>
                       ))}
                    </div>
                    <div className="bg-[#1B4D3E] text-white px-6 py-4 flex justify-between items-center">
                       <span className="font-bold uppercase text-xs tracking-wider">Carga Tributária Consolidada</span>
                       <span className="text-xl font-bold">{totalTributos.toFixed(2)}%</span>
                    </div>
                 </div>
              </div>
           )}

           {/* ABA 3: ENCARGOS CLT (GRUPOS A-F) */}
           {activeTab === 'encargos' && proposta.encargos.grupoA && (
              <div className="space-y-6">
                 <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck size={20} className="text-[#1B4D3E]" />
                    <h2 className="text-lg font-bold text-slate-800">Parâmetros Sociais e Trabalhistas</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                    <div>
                       {renderEncargoTable('Grupo A', 'Encargos Sociais - Grupo A', 'Obrigações que incidem diretamente sobre a folha de pagamento', proposta.encargos.grupoA, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoA: val}}))}
                       {renderEncargoTable('Grupo B', 'Encargos Sociais - Grupo B', 'Ocorrências de faltas / ausências justificadas. Incide o Grupo A', proposta.encargos.grupoB, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoB: val}}))}
                       {renderEncargoTable('Grupo C', 'Encargos Sociais - Grupo C', 'Provisionamento de 13º e férias. Incide o Grupo A', proposta.encargos.grupoC, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoC: val}}))}
                    </div>
                    <div>
                       {renderEncargoTable('Grupo D', 'Encargos Sociais - Grupo D', 'Demissão sem justa causa e indenizações', proposta.encargos.grupoD, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoD: val}}))}
                       {renderEncargoTable('Grupo E', 'Encargos Sociais - Grupo E', 'Provisionamento de casos especiais (maternidade, etc)', proposta.encargos.grupoE, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoE: val}}))}
                       {renderEncargoTable('Grupo F', 'Encargos Sociais - Grupo F', 'Incidências cumulativas do Grupo A sobre B e C', proposta.encargos.grupoF, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoF: val}}))}
                    </div>
                 </div>

                 <div className="bg-[#1B4D3E] text-white p-6 rounded-md shadow flex justify-between items-center border border-[#13382D]">
                    <span className="font-bold uppercase tracking-wider text-sm">Total Geral dos Encargos Sociais</span>
                    <span className="text-2xl font-bold">{totalGeralEncargos.toFixed(2)}%</span>
                 </div>
              </div>
           )}

           {/* ABA 4: QUADRO EQUIPE */}
           {activeTab === 'quadro' && (
               proposta.cliente.tipoProposta === 'SPOT' ? (
                  <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden animate-fade-in">
                     <div className="bg-slate-50 border-b border-slate-300 px-6 py-4 flex justify-between items-center">
                        <div>
                           <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              ⚡ Serviços Técnicos Sob Demanda (SPOT)
                           </h2>
                           <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                              Aloque as equipes de serviços técnicos com seus custos logísticos e defina a comissão comercial.
                           </p>
                        </div>
                        <button onClick={() => {
                            const newId = Math.random().toString();
                            setProposta({ 
                               ...proposta, 
                               equipe: [...proposta.equipe, { 
                                  id: newId, 
                                  tipoItem: 'SPOT',
                                  nomeCargo: 'Selecione a Equipe', 
                                  unidadeMedida: 'DIA',
                                  quantidadeDemanda: 1,
                                  precoUnitarioDemanda: 0,
                                  comissaoVendedorPct: 0,
                                  equipeTecnicaId: '',
                                  quantidade: 1, 
                                  escala: 'SPOT', 
                                  cargo: {}, 
                                  cctBase: {},
                                  parametrosPosto: {
                                     diasTrabalhadosMes: 22,
                                     periculosidade: false,
                                     insalubridadePercent: 0,
                                     adicionalNoturnoHoras: 0,
                                     intrajornadaHoras: 0,
                                     dsrPercent: 0,
                                     horarioInicio: '08:00',
                                     horarioFim: '17:00'
                                  },
                                  ativosConfig: {} 
                               }] 
                            });
                        }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded transition-colors flex items-center gap-1 shadow-sm">
                           <Plus size={14}/> Inserir Serviço
                        </button>
                     </div>
                     <div className="p-0">
                        <table className="w-full text-left text-sm border-collapse">
                           <thead>
                              <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                 <th className="px-6 py-3 w-28 text-center">Qtd.</th>
                                 <th className="px-6 py-3">Serviço / Equipe Técnica</th>
                                 <th className="px-6 py-3">Unidade</th>
                                 <th className="px-6 py-3 text-right">Custo Unitário</th>
                                 <th className="px-6 py-3 text-right">Custo Total</th>
                                 <th className="px-6 py-3 text-right">Ação</th>
                              </tr>
                           </thead>
                           <tbody>
                              {proposta.equipe.map((p: any) => (
                                 <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                       <input 
                                          type="number" 
                                          className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:border-blue-500" 
                                          value={p.quantidadeDemanda ?? 1} 
                                          onChange={(e) => {
                                             const val = e.target.value === '' ? '' : Number(e.target.value);
                                             const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, quantidadeDemanda: val} : x);
                                             setProposta({...proposta, equipe: newE});
                                          }} 
                                       />
                                    </td>
                                    <td className="px-6 py-4">
                                       <select 
                                          className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500" 
                                          value={p.equipeTecnicaId || ''} 
                                          onChange={(e) => {
                                             const eqId = e.target.value;
                                             const eq = equipesTecnicasDb.find(x => x.id === eqId);
                                             if (eq) {
                                                const preco = p.unidadeMedida === 'HORA' ? eq.valorHoraSugerido : eq.valorDiariaSugerido;
                                                const newE = proposta.equipe.map((x: any) => x.id === p.id ? {
                                                   ...x, 
                                                   nomeCargo: eq.nome, 
                                                   equipeTecnicaId: eq.id, 
                                                   precoUnitarioDemanda: preco,
                                                   quantidade: 1,
                                                   ativosConfig: {
                                                      custoMensalMaoObra: eq.custoMensalMaoObra,
                                                      custoMensalVeiculo: eq.custoMensalVeiculo,
                                                      custoMensalCombustivel: eq.custoMensalCombustivel,
                                                      custoMensalTotal: eq.custoMensalTotal
                                                   }
                                                } : x);
                                                setProposta({...proposta, equipe: newE});
                                             }
                                          }}
                                       >
                                          <option value="" className="text-slate-800 bg-white">Selecione o Serviço/Equipe...</option>
                                          {equipesTecnicasDb.map((eq: any) => (
                                             <option key={eq.id} value={eq.id} className="text-slate-800 bg-white">{eq.nome}</option>
                                          ))}
                                       </select>
                                    </td>
                                    <td className="px-6 py-4">
                                       <select 
                                          className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500" 
                                          value={p.unidadeMedida || 'DIA'} 
                                          onChange={(e) => {
                                             const unit = e.target.value;
                                             const eq = equipesTecnicasDb.find(x => x.id === p.equipeTecnicaId);
                                             const preco = eq ? (unit === 'HORA' ? eq.valorHoraSugerido : eq.valorDiariaSugerido) : 0;
                                             const newE = proposta.equipe.map((x: any) => x.id === p.id ? {
                                                ...x, 
                                                unidadeMedida: unit, 
                                                precoUnitarioDemanda: preco
                                             } : x);
                                             setProposta({...proposta, equipe: newE});
                                          }}
                                       >
                                          <option value="DIA" className="text-slate-800 bg-white">DIA (Diária)</option>
                                          <option value="HORA" className="text-slate-800 bg-white">HORA (Hora Técnica)</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="relative flex justify-end items-center">
                                          <span className="absolute left-2 text-xs font-semibold text-slate-400">R$</span>
                                          <input 
                                             type="number" 
                                             step="0.01"
                                             className="w-32 bg-white border border-slate-300 rounded pl-7 pr-2 py-1 text-right font-bold text-slate-800 outline-none focus:border-blue-500" 
                                             value={p.precoUnitarioDemanda ?? 0} 
                                             onChange={(e) => {
                                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                                const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, precoUnitarioDemanda: val} : x);
                                                setProposta({...proposta, equipe: newE});
                                             }} 
                                          />
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                       {(() => {
                                          const totalCusto = (p.quantidadeDemanda || 0) * (p.precoUnitarioDemanda || 0);
                                          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCusto);
                                       })()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <button 
                                          onClick={() => setProposta({...proposta, equipe: proposta.equipe.filter((x: any) => x.id !== p.id)})} 
                                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                                       >
                                          <Trash2 size={16}/>
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                              {proposta.equipe.length === 0 && (
                                 <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                       Nenhum serviço adicionado. Clique em "Inserir Serviço" para começar.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ) : (
                  <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
                     <div className="bg-slate-50 border-b border-slate-300 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><UserCheck size={16}/> Quadro de Colaboradores</h2>
                        <button onClick={() => {
                            const newId = Math.random().toString();
                            setProposta({ 
                               ...proposta, 
                               equipe: [...proposta.equipe, { 
                                  id: newId, 
                                  nomeCargo: 'Selecione a Função', 
                                  quantidade: 1, 
                                  escala: '', 
                                  cargo: {}, 
                                  cctBase: {},
                                  parametrosPosto: {
                                     diasTrabalhadosMes: 22,
                                     periculosidade: false,
                                     insalubridadePercent: 0,
                                     adicionalNoturnoHoras: 0,
                                     intrajornadaHoras: 0,
                                     dsrPercent: 0,
                                     horarioInicio: '08:00',
                                     horarioFim: '17:00'
                                  },
                                  ativosConfig: {} 
                               }] 
                            });
                        }} className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-semibold px-4 py-2 rounded transition-colors flex items-center gap-1">
                           <Plus size={14}/> Inserir Posto
                        </button>
                     </div>
                     <div className="p-0">
                        <table className="w-full text-left text-sm border-collapse">
                           <thead>
                              <tr className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                 <th className="px-6 py-3 w-28 text-center">Qtd.</th>
                                 <th className="px-6 py-3">Função Vinculada à CCT</th>
                                 <th className="px-6 py-3">Escala</th>
                                 <th className="px-6 py-3 text-right">Ação</th>
                              </tr>
                           </thead>
                           <tbody>
                              {proposta.equipe.map((p: any) => (
                                 <React.Fragment key={p.id}>
                                    <tr className="border-b border-slate-200 hover:bg-slate-50">
                                       <td className="px-6 py-4">
                                          <input type="number" className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={p.quantidade} onChange={(e) => updatePosto(p.id, 'quantidade', (e.target.value === '' ? '' : Number(e.target.value)))} />
                                       </td>
                                       <td className="px-6 py-4">
                                          <select className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#1B4D3E]" value={p.cargo?.id ? `${p.cctBase?.id}|${p.cargo?.id}` : ''} onChange={(e) => {
                                             if (!e.target.value) return;
                                             const [cctId, cargoId] = e.target.value.split('|');
                                             const c = ccts.find(x => x.id === cctId);
                                             if(c) {
                                                const cargo = c.cargos?.find((x: any) => x.id === cargoId);
                                                if (cargo) {
                                                   const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, nomeCargo: cargo.nome, cargo: cargo, cctBase: c} : x);
                                                   setProposta({...proposta, equipe: newE});
                                                }
                                             }
                                          }}>
                                             <option value="" className="text-slate-800 bg-white">Selecione a Função...</option>
                                             {!proposta.cliente.sindicatoId && (
                                                 <option value="" disabled className="text-red-500 font-bold italic">⚠️ Selecione o Sindicato na Aba 1 primeiro</option>
                                              )}
                                              {ccts.filter((c: any) => !proposta.cliente.sindicatoId || c.id === proposta.cliente.sindicatoId).map((c: any) => (
                                                <optgroup key={c.id} label={`${c.nome} (${c.uf})`}>
                                                   {c.cargos?.map((cg: any) => (
                                                      <option key={cg.id} value={`${c.id}|${cg.id}`}>{cg.nome} - R$ {cg.pisoSalarial}</option>
                                                   ))}
                                                </optgroup>
                                             ))}
                                          </select>
                                       </td>
                                       <td className="px-6 py-4">
                                          <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#1B4D3E]" value={p.escala} onChange={(e) => {
                                             const chosenEscala = escalasDb.find(esc => esc.nome === e.target.value);
                                             if (chosenEscala) {
                                                const param = {...p.parametrosPosto, diasTrabalhadosMes: chosenEscala.diasTrabalhadosMes};
                                                const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, escala: chosenEscala.nome, parametrosPosto: param} : x);
                                                setProposta({...proposta, equipe: newE});
                                             } else {
                                                updatePosto(p.id, 'escala', e.target.value);
                                             }
                                          }}>
                                             <option value="" className="text-slate-800 bg-white">Selecione a Escala...</option>
                                             {escalasDb.map(esc => (
                                                <option key={esc.id} value={esc.nome}>{esc.nome}</option>
                                             ))}
                                          </select>
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          <div className="flex items-center justify-end gap-2.5">
                                             <button 
                                                type="button"
                                                onClick={() => setActiveAdicionaisPostoId(p.id)}
                                                className="px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:border-[#1B4D3E] hover:bg-emerald-50/30 text-slate-700 hover:text-[#1B4D3E] font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-[0.97]"
                                                title="Configurar Adicionais e Jornada"
                                             >
                                                <span>⚙️</span> Adicionais
                                             </button>
                                             
                                             <button 
                                                type="button"
                                                onClick={() => setActiveEpisPostoId(p.id)}
                                                className="px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:border-[#1B4D3E] hover:bg-emerald-50/30 text-slate-700 hover:text-[#1B4D3E] font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-[0.97]"
                                                title="Configurar EPIs Especiais do Posto"
                                             >
                                                <span>🛡️</span> EPIs Especiais
                                                {((p.parametrosPosto?.episAdicionais || []).length > 0) && (
                                                   <span className="bg-[#1B4D3E] text-white text-[9px] px-2 py-0.5 rounded-full font-black shadow-xs">
                                                      {(p.parametrosPosto?.episAdicionais || []).length}
                                                   </span>
                                                )}
                                             </button>
 
                                             <button 
                                                type="button"
                                                onClick={() => setProposta({...proposta, equipe: proposta.equipe.filter((x: any) => x.id !== p.id)})} 
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all active:scale-95" 
                                                title="Remover Posto"
                                             >
                                                <Trash2 size={15}/>
                                             </button>
                                          </div>
                                       </td>
                                    </tr>
                                 </React.Fragment>
                              ))}
                              {proposta.equipe.length === 0 && (
                                 <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                       Nenhum posto adicionado. Clique em "Inserir Posto" para começar.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )
           )}
            {activeTab === 'materiais' && renderInsumosTab('detalheMateriais', ['MATERIAIS E INSUMO', 'PRODUTOS E INSUMOS', 'MATERIAIS', 'INSUMOS', 'PRODUTOS DE LIMPEZA'], 'Materiais e Produtos de Limpeza')}
            {activeTab === 'maquinas' && renderInsumosTab('detalheMaquinas', ['EQUIPAMENTOS LOCADO', 'EQUIPAMENTOS DEPRECIADOS', 'MAQUINAS', 'EQUIPAMENTOS'], 'Máquinas e Equipamentos')}
            {activeTab === 'descartaveis' && renderInsumosTab('detalheDescartaveis', ['DESCARTÁVEIS', 'DESCARTAVEIS'], 'Descartáveis')}

            {/* ABA 5: EXTRATO (100% IGUAL AO PRINT - PLANILHA DE CUSTOS) */}
           {activeTab === 'extrato' && (
              <div className="w-full bg-white border border-[#1B4D3E] shadow-xl text-xs text-slate-800 rounded overflow-hidden print:border-none print:shadow-none">
                 
                 {/* CABEÇALHO PLANILHA */}
                 <div className="bg-[#1B4D3E] text-white flex justify-center items-center px-6 py-4 border-b border-white">
                    <h2 className="font-bold uppercase text-xl tracking-widest">Planilha de Custos</h2>
                 </div>

                 <table className="w-full text-left border-collapse text-slate-800">
                    <thead>
                       {/* MONTANTE A */}
                       <tr className="bg-[#1B4D3E] text-white border-b border-white/20">
                          <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "A" - Mão-de-obra</th>
                       </tr>
                       <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                          <th className="py-2 px-6 w-[50%]">1) Função</th>
                          <th className="py-2 px-6 text-center">Qtd.</th>
                          <th className="py-2 px-6 text-right">Custo Unit</th>
                          <th className="py-2 px-6 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody>
                       {proposta.equipe.map((p: any, idx: number) => {
                          const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                          const custoTotal = itemRes?.detalhes?.remuneracao || 0;
                          const isSpotItem = p.tipoItem === 'SPOT';
                          const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                          const custoUnitario = isSpotItem ? (custoTotal / qty) : custoTotal;
                          const totalLinha = isSpotItem ? custoTotal : (custoTotal * p.quantidade);
                          return (
                             <tr key={idx} className="border-b border-slate-200 border-dotted hover:bg-slate-50">
                                <td className="py-1.5 px-6 font-semibold text-slate-800">{p.nomeCargo}</td>
                                <td className="py-1.5 px-6 text-center font-bold">{qty}</td>
                                <td className="py-1.5 px-6 text-right">{formatCurrency(custoUnitario)}</td>
                                <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">{formatCurrency(totalLinha)}</td>
                             </tr>
                          );
                       })}
                       
                       {/* Total Função */}
                       <tr className="bg-[#3b8026] text-white font-bold border-y border-[#2d631d]">
                          <td colSpan={3} className="py-1.5 px-6 text-right">Total Função</td>
                          <td className="py-1.5 px-6 text-right">
                             {formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.remuneracao || 0) * i.quantidade), 0) || 0)}
                          </td>
                       </tr>

                       {/* Encargos e Outros */}
                        {!isSpot && (
                           <>
                              <tr className="border-b border-slate-200 border-dotted">
                                 <td className="py-1.5 px-6 font-bold">2) Encargos Sociais</td>
                                 <td className="py-1.5 px-6 text-center font-bold">{totalGeralEncargos.toFixed(2)}%</td>
                                 <td className="py-1.5 px-6 text-right">-</td>
                                 <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">
                                    {formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.encargos || 0) * i.quantidade), 0) || 0)}
                                 </td>
                              </tr>
                              <tr className="border-b border-slate-200 border-dotted">
                                 <td className="py-1.5 px-6 font-bold">3) Outros (Especificar)</td>
                                 <td className="py-1.5 px-6 text-center">-</td>
                                 <td className="py-1.5 px-6 text-right">-</td>
                                 <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">{formatCurrency(0)}</td>
                              </tr>
                           </>
                        )}
                       
                       {/* Total Montante A */}
                       <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white">
                          <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total do Montante "A" (Bloco A)</td>
                          <td className="py-2.5 px-6 text-right">
                             {formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.blocoA || 0) * i.quantidade), 0) || 0)}
                          </td>
                       </tr>

                        {/* MONTANTE B */}
                        <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                           <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "B" - Insumos</th>
                        </tr>
                        {(() => {
                           const b = resultado?.items?.reduce((acc: any, i: any) => {
                               const d = i.detalhes?.detalheBlocoB;
                               return {
                                  ativos: acc.ativos + (i.detalhes?.ativos || 0) * i.quantidade,
                                  materiais: acc.materiais + (d?.materiais || 0) * i.quantidade,
                                  maquinas: acc.maquinas + (d?.maquinas || 0) * i.quantidade,
                                  descartaveis: acc.descartaveis + (d?.descartaveis || 0) * i.quantidade,
                                  servicos: acc.servicos + (d?.servicos || 0) * i.quantidade,
                               };
                           }, { ativos: 0, materiais:0, maquinas:0, descartaveis:0, servicos:0 }) || { ativos: 0, materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0 };

                                                       const rawRows = [
                               ...(!isSpot ? [{ label: "Uniformes e EPI's", val: b.ativos }] : []),
                               { label: 'Materiais e produtos de limpeza', val: proposta.insumos.materiais },
                               { 
                                 label: 'Máquinas e equipamentos', 
                                 val: isSpot ? totalMaquinasNaoLocadas : proposta.insumos.maquinas 
                               },
                               { label: 'Descartáveis', val: proposta.insumos.descartaveis },
                               { 
                                 label: isSpot ? 'Equipamentos Locados' : 'Serviços (Descriminar)', 
                                 val: isSpot ? totalMaquinasLocadas : proposta.insumos.servicos 
                               },
                            ];
                            const rows = rawRows.map((r, idx) => ({
                               label: `${idx + 1}) ${r.label}`,
                               val: r.val
                            }));

                           return rows.map((row, i) => (
                              <tr key={i} className="border-b border-slate-200 border-dotted">
                                 <td colSpan={3} className="py-1 px-6 font-bold">{row.label}</td>
                                 <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">{formatCurrency(row.val)}</td>
                              </tr>
                           ));
                        })()}

                        <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white">
                           <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total do Montante "B"</td>
                           <td className="py-2.5 px-6 text-right">
                              {formatCurrency(
                                 resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.ativos || 0) * i.quantidade), 0) + 
                                 proposta.insumos.materiais + 
                                 (isSpot ? (totalMaquinasNaoLocadas + totalMaquinasLocadas) : proposta.insumos.maquinas) + 
                                 proposta.insumos.descartaveis + 
                                 (isSpot ? 0 : proposta.insumos.servicos)
                              )}
                           </td>
                        </tr>

                        {/* MONTANTE C */}
                        {!isSpot && (
                           <>
                              <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                           <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "C" - Benefícios Detalhados (13 Itens)</th>
                        </tr>
                        {(() => {
                           const b = resultado?.items?.reduce((acc: any, i: any) => {
                               const d = i.detalhes?.detalheBlocoC;
                               return {
                                  va: acc.va + (d?.va || 0) * i.quantidade,
                                  vt: acc.vt + (d?.vt || 0) * i.quantidade,
                                  custosSindicato: acc.custosSindicato + (d?.custosSindicato || 0) * i.quantidade,
                                  vaFerias: acc.vaFerias + (d?.vaFerias || 0) * i.quantidade,
                                  cestaBasica: acc.cestaBasica + (d?.cestaBasica || 0) * i.quantidade,
                                  descontoVA: acc.descontoVA + (d?.descontoVA || 0) * i.quantidade,
                                  descontoVT: acc.descontoVT + (d?.descontoVT || 0) * i.quantidade,
                                  exames: acc.exames + (d?.exames || 0) * i.quantidade,
                                  reservaTecnica: acc.reservaTecnica + (d?.reservaTecnica || 0) * i.quantidade,
                                  reservaTecnicaPct: d?.reservaTecnicaPct || acc.reservaTecnicaPct,
                                  manutencao: acc.manutencao + (d?.manutencao || 0) * i.quantidade,
                                  manutencaoPct: d?.manutencaoPct || acc.manutencaoPct,
                                  outros: acc.outros + (d?.outros || 0) * i.quantidade,
                               };
                            }, { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 }) || { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 };

                           const rows: any[] = [
                               { label: '1) Vale Alimentação', val: b.va },
                               { label: '2) Vale Transporte', val: b.vt },
                               { label: '3) Custos com Sindicatos', val: b.custosSindicato },
                               { label: '4) Vale Alimentação Sobre Férias', val: b.vaFerias },
                               { label: '5) Cesta Básica Assiduidade(+)', val: b.cestaBasica },
                               { label: '6) Desconto de VA(-)', val: b.descontoVA, red: true },
                               { label: '7) Desconto de VT(-)', val: b.descontoVT, red: true },
                               { label: '8) Exames Médicos', val: b.exames },
                               { label: '9) Reservas Técnicas', val: b.reservaTecnica, pct: b.reservaTecnicaPct, field: 'reservaTecnicaPct' },
                               { label: '10) Manutenção Equipamentos', val: b.manutencao, pct: b.manutencaoPct, field: 'manutencaoPct' },
                               { 
                                 label: proposta.cliente.tipoProposta === 'SPOT' && proposta.insumos?.servicosDescricao
                                    ? `11) Outros (${proposta.insumos.servicosDescricao})` 
                                    : '11) Outros (especificar)', 
                                 val: b.outros 
                               },
                             ];

                           return (
                              <>
                                 {rows.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-200 border-dotted">
                                        <td colSpan={row.pct !== undefined ? 2 : 3} className={"py-1 px-6 font-bold " + (row.red ? "text-red-600" : "")}>{row.label}</td>
                                        {row.field !== undefined && (
                                           <td className="py-1 px-6 text-center font-bold bg-slate-50 text-slate-500">
                                              <div className="flex items-center justify-center gap-1">
                                                 <input 
                                                    type="number" 
                                                    step="0.01"
                                                    className="w-14 bg-white border border-slate-300 text-slate-800 text-right px-1 py-0.5 rounded outline-none focus:border-[#1B4D3E]"
                                                    value={(proposta.premissas as any)[row.field]}
                                                    onChange={(e) => {
                                                       const val = (e.target.value === '' ? '' : Number(e.target.value));
                                                       setProposta({...proposta, premissas: {...proposta.premissas, [row.field]: val}});
                                                    }}
                                                 />
                                                 <span>%</span>
                                              </div>
                                           </td>
                                        )}
                                        <td className={"py-1.5 px-6 text-right bg-emerald-100/50 font-semibold " + (row.red ? "text-red-600" : "")}>
                                           {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                        </td>
                                    </tr>
                                 ))}
                                 <tr className="bg-[#1B4D3E] text-white font-bold border-y border-white">
                                    <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total do Montante "C"</td>
                                    <td className="py-2.5 px-6 text-right">
                                       {formatCurrency(resultado?.items?.reduce((acc: any, i: any) => acc + ((i.detalhes?.beneficios || 0) * i.quantidade), 0) || 0)}
                                    </td>
                                 </tr>
                              </>
                           );
                        })()}
                           </>
                        )}
                                                {/* MONTANTE D - BDI */}
                        <tr className="bg-[#1B4D3E] text-white border-y-2 border-white/20">
                           <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "D" - BDI</th>
                        </tr>
                        <tr className="border-b border-slate-200 border-dotted">
                           <td className="py-1.5 px-6 font-bold w-[50%]">Administração</td>
                           <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{proposta.premissas.taxaAdm.toFixed(2)}%</td>
                           <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">
                              {formatCurrency(resultado?.taxaAdm || 0)}
                           </td>
                        </tr>
                        <tr className="border-b border-slate-200 border-dotted">
                            <td className="py-1.5 px-6 font-bold">Lucro</td>
                            <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{proposta.premissas.margemLucro.toFixed(2)}%</td>
                            <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">
                               {formatCurrency(resultado?.margemLucro || 0)}
                            </td>
                         </tr>
                         <tr className="border-b border-slate-200 border-dotted">
                            <td className="py-1.5 px-6 font-bold">Comissão do Vendedor</td>
                            <td colSpan={2} className="py-1.5 px-6 text-center font-bold bg-slate-50">{(proposta.premissas.comissaoVendedor ?? 0).toFixed(2)}%</td>
                            <td className="py-1.5 px-6 text-right bg-emerald-100/50 font-semibold">
                               {formatCurrency(resultado?.comissaoVendedor || 0)}
                            </td>
                         </tr>
                        <tr className="bg-[#599e41] text-white font-bold border-y border-[#488234]">
                           <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total dos Montantes "A+B+C+D"</td>
                           <td className="py-2.5 px-6 text-right">
                              {formatCurrency((resultado?.custoDiretoTotal || 0) + (resultado?.taxaAdm || 0) + (resultado?.margemLucro || 0) + (resultado?.comissaoVendedor || 0))}
                           </td>
                        </tr>

                        {/* IMPOSTOS */}
                        <tr className="bg-[#8ec277] text-slate-900 border-b border-white">
                           <td className="py-2 px-6 font-bold uppercase">Impostos</td>
                           <td colSpan={2} className="py-2 px-6 text-center font-bold">{totalTributos.toFixed(2)}%</td>
                           <td className="py-2 px-6 text-right font-bold">{formatCurrency(resultado?.impostosTotais || 0)}</td>
                        </tr>
                        {proposta.premissas.tributos.map((t: any, i: number) => (
                           <tr key={i} className="border-b border-slate-200 border-dotted">
                              <td className="py-1 px-6 font-bold">{t.nome}</td>
                              <td colSpan={2} className="py-1 px-6 text-center font-bold bg-slate-50">{t.percent.toFixed(2)}%</td>
                              <td className="py-1 px-6 text-right bg-emerald-100/50 font-semibold">
                                 {formatCurrency((resultado?.faturamentoBruto || 0) * (t.percent / 100))}
                              </td>
                           </tr>
                        ))}

                        {/* TOTAIS FINAIS */}
                        <tr className="bg-[#1B4D3E] text-white font-black border-t-4 border-white text-sm tracking-widest">
                           <td colSpan={3} className="py-5 px-6 text-right uppercase">Total dos Montantes "A+B+C+D" + Impostos</td>
                           <td className="py-5 px-6 text-right text-emerald-400">
                              {formatCurrency(resultado?.faturamentoBruto || 0)}
                           </td>
                        </tr>
                        {!isSpot && (
                           <tr className="bg-black text-white font-black border-t border-slate-800 text-xs tracking-widest uppercase">
                              <td colSpan={3} className="py-4 px-6 text-right">Valor Total Anual do Contrato</td>
                              <td className="py-4 px-6 text-right text-emerald-500">
                                 {formatCurrency((resultado?.faturamentoBruto || 0) * 12)}
                              </td>
                           </tr>
                        )}
                     </tbody>
                 </table>
              </div>
           )}

         {/* ABA 6: RESUMO DA PROPOSTA */}
            {activeTab === 'resumo' && (() => {
              const fc = formatCurrency;
              const divisorTributos = resultado?.divisor || 1;
              const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
              const txLucro = (proposta.premissas.margemLucro || 0) / 100;

              // Função auxiliar para aplicar a cascata solicitada a um custo direto
              const applyCascata = (custo: any) => {
                const cD = Number(custo) || 0;
                const comAdm = cD * (1 + txAdm);
                const comLucro = comAdm * (1 + txLucro);
                return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
              };

               return (
                <div className="space-y-6">

                  {/* BLOCO 1: MÃO DE OBRA */}
                  <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
                    <div className="bg-[#1B4D3E] px-6 py-3 flex items-center gap-2">
                      <UserCheck size={16} className="text-emerald-300" />
                      <h2 className="text-xs font-black text-white uppercase tracking-widest">1) Mão de Obra — Quadro de Colaboradores</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs text-slate-800">
                        <thead>
                          <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                            <th className="px-4 py-2 w-10 text-center">Item</th>
                            <th className="px-4 py-2">Descrição — Mão de Obra</th>
                            <th className="px-4 py-2 text-center">Qtd.</th>
                            <th className="px-4 py-2 text-right">Preço Unit. Venda</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proposta.equipe.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe (Aba 4).</td></tr>
                          ) : (
                            proposta.equipe.map((p: any, idx: number) => {
                              const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                              const precoVendaItem = itemRes?.precoVenda || 0;
                              const isSpotItem = p.tipoItem === 'SPOT';
                              const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                              const precoUnitario = isSpotItem ? (precoVendaItem / qty) : (p.quantidade > 0 ? precoVendaItem / p.quantidade : 0);
                              return (
                                <tr key={p.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <td className="px-4 py-2 text-center font-bold text-slate-500">{idx + 1}</td>
                                  <td className="px-4 py-2 font-semibold text-slate-800">{p.nomeCargo}</td>
                                  <td className="px-4 py-2 text-center font-bold text-slate-800">{qty}</td>
                                  <td className="px-4 py-2 text-right text-slate-700">{fc(precoUnitario)}</td>
                                  <td className="px-4 py-2 text-right font-semibold bg-emerald-50 text-emerald-800">{fc(precoVendaItem)}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#1B4D3E] text-white font-black">
                            <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs">Subtotal Mão de Obra (Preço de Venda Final)</td>
                            <td className="px-4 py-2.5 text-right text-emerald-300">
                               {fc(resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* BLOCO 2: INSUMOS */}
                  <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
                    <div className="bg-slate-700 px-6 py-3 flex items-center gap-2">
                      <ClipboardList size={16} className="text-slate-300" />
                      <h2 className="text-xs font-black text-white uppercase tracking-widest">2) Materiais, Equipamentos e Insumos</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs text-slate-800">
                        <thead>
                          <tr className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="px-6 py-2 w-10 text-center">Item</th>
                            <th className="px-6 py-2">Descrição</th>
                            <th className="px-6 py-2 text-right w-48">Preço de Venda (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">2</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">Materiais e produtos de limpeza</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.materiais))}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">3</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">Máquinas e equipamentos</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(isSpot ? totalMaquinasNaoLocadas : proposta.insumos.maquinas))}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">4</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">Descartáveis</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.descartaveis))}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">5</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">
                              {isSpot ? 'Equipamentos Locados' : `Serviços ${proposta.insumos.servicosDescricao ? `(${proposta.insumos.servicosDescricao})` : ''}`}
                            </td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(isSpot ? totalMaquinasLocadas : proposta.insumos.servicos))}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-700 text-white font-black">
                            <td colSpan={2} className="px-6 py-2.5 text-right uppercase tracking-wider text-xs">Subtotal Materiais e Insumos (Preço de Venda Final)</td>
                            <td className="px-6 py-2.5 text-right text-emerald-300">
                              {fc(applyCascata(
                                Number(proposta.insumos.materiais || 0) + 
                                Number(isSpot ? (totalMaquinasNaoLocadas + totalMaquinasLocadas) : proposta.insumos.maquinas || 0) + 
                                Number(proposta.insumos.descartaveis || 0) + 
                                Number(isSpot ? 0 : proposta.insumos.servicos || 0)
                              ))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* BLOCO TOTAL GERAL */}
                  <div className="bg-[#1B4D3E] p-8 rounded-xl border-t-4 border-emerald-400 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                    <div className="text-white">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-300 mb-1">Total Geral da Proposta</h3>
                      <p className="text-[10px] font-bold text-emerald-100/60 uppercase">Mão de Obra + Insumos Globais — Valor Final de Venda</p>
                    </div>
                    <div className="text-5xl font-black text-emerald-400 tracking-tighter">
                      {fc(resultado?.faturamentoBruto || 0)}
                    </div>
                  </div>

                </div>
              );
            })()}

           {/* ABA 7: DRE - ORÇAMENTO EXECUTIVO E DRE ULTRA PREMIUM */}
            {activeTab === 'dre' && (() => {
               // 1. Cálculos de Remuneração e Adicionais dos Colaboradores
               let totalSalarios = 0;
               let totalInsalubridade = 0;
               let totalPericulosidade = 0;
               let totalNoturno = 0;
               let totalIntrajornada = 0;
               let totalDsr = 0;

               proposta.equipe.forEach((colab: any) => {
                  const qty = Number(colab.quantidade) || 1;
                  const cargo = colab.cargo || {};
                  const param = colab.parametrosPosto || {};
                  const cctEfetiva = colab.cctBase || {};
                  const salarioBase = Number(cargo.pisoSalarial || 0) || 0;
                  
                  const temPericulosidade = param.periculosidade !== undefined ? param.periculosidade : (cargo.periculosidade || false);
                  const adicionalPericulosidade = temPericulosidade ? salarioBase * 0.3 : 0;
                  
                  const pctInsalubridade = param.insalubridadePercent !== undefined ? param.insalubridadePercent : (cargo.insalubridadePercent || 0);
                  const baseInsalubridade = cctEfetiva.insalubridadeBase === 'SALARIO' ? salarioBase : (Number(cctEfetiva.salarioMinimo) || 1412);
                  const adicionalInsalubridade = baseInsalubridade * (pctInsalubridade / 100);
                  
                  let adicionalNoturno = 0;
                  if (param.adicionalNoturnoHoras > 0) {
                    const valorHora = salarioBase / 220; 
                    adicionalNoturno = (valorHora * 0.2) * param.adicionalNoturnoHoras;
                  }
                  
                  let intrajornada = 0;
                  if (param.intrajornadaHoras > 0) {
                    const valorHora = salarioBase / 220;
                    intrajornada = (valorHora * 1.5) * param.intrajornadaHoras;
                  }

                  let dsrAdicionais = 0;
                  if (param.dsrPercent > 0) {
                    dsrAdicionais = (adicionalNoturno + intrajornada) * (param.dsrPercent / 100);
                  }

                  totalSalarios += salarioBase * qty;
                  totalInsalubridade += adicionalInsalubridade * qty;
                  totalPericulosidade += adicionalPericulosidade * qty;
                  totalNoturno += adicionalNoturno * qty;
                  totalIntrajornada += intrajornada * qty;
                  totalDsr += dsrAdicionais * qty;
               });

               const totalRemuneracaoBase = totalSalarios + totalInsalubridade + totalPericulosidade + totalNoturno + totalIntrajornada + totalDsr;

               // 2. Cálculos de Encargos Parametrizados na Tela
               const encargosValores = {
                  fgts: totalRemuneracaoBase * (dreEncargos.fgts / 100),
                  decimoTerceiro: totalRemuneracaoBase * (dreEncargos.decimoTerceiro / 100),
                  ferias: totalRemuneracaoBase * (dreEncargos.ferias / 100),
                  fgtsRescisorio: totalRemuneracaoBase * (dreEncargos.fgtsRescisorio / 100),
                  outros: totalRemuneracaoBase * (dreEncargos.outros / 100),
                  inss: totalRemuneracaoBase * (dreEncargos.inss / 100)
               };
               const totalEncargosSociais = Object.values(encargosValores).reduce((a, b) => a + b, 0);

               // 3. Cálculos de Benefícios a partir do Pricing Engine
               const totalVT = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.vt || 0) * i.quantidade), 0) || 0;
               const totalVA = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.va || 0) * i.quantidade), 0) || 0;
               const totalVAFerias = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.vaFerias || 0) * i.quantidade), 0) || 0;
               const totalCesta = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.cestaBasica || 0) * i.quantidade), 0) || 0;
               const totalSindicato = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.custosSindicato || 0) * i.quantidade), 0) || 0;
               const totalOutrosBen = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.outros || 0) * i.quantidade), 0) || 0;
               const totalDescontoVA = Math.abs(resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.descontoVA || 0) * i.quantidade), 0) || 0);
               const totalDescontoVT = Math.abs(resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.descontoVT || 0) * i.quantidade), 0) || 0);

               const totalBeneficiosSubtotal = (totalVT + totalVA + totalVAFerias + totalCesta + totalSindicato + totalOutrosBen) - (totalDescontoVA + totalDescontoVT);

               // 4. Cálculos de SSMA
               const totalEpi = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.ativos || 0) * i.quantidade), 0) || 0;
               const totalExames = resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoC?.exames || 0) * i.quantidade), 0) || 0;
               const totalSSMASubtotal = totalEpi + totalExames;

               // 5. Materiais e Equipamentos
               const totalMateriais = proposta.insumos.materiais || 0;
               const totalMaquinas = proposta.insumos.maquinas || 0;

               // 6. Valores Totais Mensais e Anuais
               const receitaMensal = resultado?.faturamentoBruto || 0;
               const tributosMensal = receitaMensal * ((Number(dreTaxPercent) || 0) / 100);
               const receitaLiquidaMensal = receitaMensal - tributosMensal;

               const custoOperacionalMensal = totalRemuneracaoBase + totalEncargosSociais + totalBeneficiosSubtotal + totalSSMASubtotal + totalMateriais + totalMaquinas;
               const margemBrutaMensal = receitaLiquidaMensal - custoOperacionalMensal;

               // Função de renderização de célula de moeda e percentual vertical
               const renderValueCell = (value: number, baseValue: number, isMargem = false) => {
                  const pct = baseValue > 0 ? (value / baseValue) * 100 : 0;
                  return (
                     <td className="p-3 text-right whitespace-nowrap">
                        <div className={`font-bold text-xs ${isMargem ? 'text-[#1B4D3E]' : 'text-slate-700'}`}>
                           {formatCurrency(value)}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 block mt-0.5">
                           {pct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                        </div>
                     </td>
                  );
               };

               const toggleRow = (id: string) => {
                  setDreExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
               };

               return (
                  <div className="w-full bg-white border border-slate-100 shadow-[0_20px_50px_rgba(27,77,62,0.06)] rounded-2xl overflow-hidden flex flex-col">
                     {/* Cabeçalho da DRE */}
                     <div className="bg-gradient-to-r from-[#1B4D3E] via-[#215E4C] to-[#12362b] text-white p-5 flex items-center justify-between border-b border-emerald-500/20">
                        <div className="flex items-center gap-3">
                           <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 shadow-inner">
                              <PieChart className="text-emerald-400" size={18} />
                           </div>
                           <div>
                              <h3 className="font-extrabold text-xs uppercase tracking-widest text-emerald-100/90">DRE do Projeto</h3>
                              <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider mt-0.5">Demonstração do Resultado & Orçamento Executivo</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="bg-[#D4AF37]/15 text-[#e5c158] border border-[#D4AF37]/35 text-[9px] px-3 py-1 rounded-full font-black tracking-widest uppercase shadow-sm">
                              Margem Bruta Proposta: {((margemBrutaMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                           </span>
                        </div>
                     </div>

                     {/* Planilha de Cálculo */}
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1400px]">
                           <thead>
                              <tr className="bg-[#F8FAFC] text-slate-400 uppercase text-[9px] tracking-wider font-black border-b border-slate-200/80">
                                 <th className="p-4 text-left w-96">Estrutura DRE</th>
                                 {MONTHS.map(m => (
                                    <th key={m} className="p-4 text-right w-28 font-extrabold">{m}</th>
                                 ))}
                                 <th className="p-4 text-right w-36 bg-emerald-50/50 text-[#1B4D3E] font-black border-l border-slate-200/60">TOTAL ANUAL</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              
                              {/* 01. RECEITA BRUTA */}
                              <tr className="bg-slate-50/60 font-bold border-b border-slate-200/60 hover:bg-slate-100/40 transition-colors">
                                 <td className="p-3 pl-4 flex items-center gap-2">
                                    <button onClick={() => toggleRow('01')} className="text-slate-400 hover:text-[#1B4D3E] p-1 rounded hover:bg-slate-200/50 transition-colors">
                                       <span className="text-xs transition-transform duration-200 block">{dreExpandedRows['01'] ? '▼' : '►'}</span>
                                    </button>
                                    <span className="text-xs uppercase tracking-wider font-extrabold text-blue-700">01. RECEITA BRUTA</span>
                                 </td>
                                 {MONTHS.map(m => renderValueCell(receitaMensal, receitaMensal))}
                                 <td className="p-3 text-right bg-emerald-50/20 font-black border-l border-slate-200/60 text-blue-800">
                                    <div className="text-xs">{formatCurrency(receitaMensal * 12)}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">100.0%</div>
                                 </td>
                              </tr>

                              {/* 01.1 - Receita de Serviços */}
                              {dreExpandedRows['01'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('01.1')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['01.1'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">01.1 - Receita de Serviços</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(receitaMensal, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(receitaMensal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">100.0%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 01.1.1 - Serviços Vendidos */}
                              {dreExpandedRows['01'] && dreExpandedRows['01.1'] && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">01.1.1 - Serviços Vendidos</td>
                                    {MONTHS.map(m => renderValueCell(receitaMensal, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(receitaMensal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">100.0%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 01.1.2 a 01.1.5 (Zeradões) */}
                              {dreExpandedRows['01'] && dreExpandedRows['01.1'] && ['01.1.2 - Serviços Extras', '01.1.3 - Assistência Técnica', '01.1.4 - Vendas de Produtos', '01.1.5 - Comissão de Vendas'].map(lbl => (
                                 <tr key={lbl} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors text-slate-400">
                                    <td className="p-2 pl-14 text-xs font-medium">{lbl}</td>
                                    {MONTHS.map(m => <td key={m} className="p-2 text-right">-</td>)}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100">-</td>
                                 </tr>
                              ))}

                              {/* 01.2 - Receita de Vendas */}
                              {dreExpandedRows['01'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100 text-slate-400">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('01.2')} className="text-slate-300 p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['01.2'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs">01.2 - Receita de Vendas</span>
                                    </td>
                                    {MONTHS.map(m => <td key={m} className="p-2.5 text-right">-</td>)}
                                    <td className="p-2.5 text-right font-bold border-l border-slate-200/40">-</td>
                                 </tr>
                              )}

                              {/* 1.3 - Garantia */}
                              {dreExpandedRows['01'] && (
                                 <tr className="border-b border-slate-100 text-slate-400">
                                    <td className="p-2 pl-12 text-xs font-semibold">1.3 - Garantia</td>
                                    {MONTHS.map(m => <td key={m} className="p-2 text-right">-</td>)}
                                    <td className="p-2 text-right font-bold border-l border-slate-200/40">-</td>
                                 </tr>
                              )}

                              {/* 02. TRIBUTO SOBRE FATURAMENTO */}
                              <tr className="bg-slate-50/60 font-bold border-b border-slate-200/60 hover:bg-slate-100/40 transition-colors">
                                 <td className="p-3 pl-4 flex items-center gap-2">
                                    <button onClick={() => toggleRow('02')} className="text-slate-400 hover:text-[#1B4D3E] p-1 rounded hover:bg-slate-200/50 transition-colors">
                                       <span className="text-xs transition-transform duration-200 block">{dreExpandedRows['02'] ? '▼' : '►'}</span>
                                    </button>
                                    <span className="text-xs uppercase tracking-wider font-extrabold text-red-600">02. TRIBUTO SOBRE FATURAMENTO</span>
                                 </td>
                                 {MONTHS.map(m => renderValueCell(tributosMensal, receitaMensal))}
                                 <td className="p-3 text-right bg-red-50/20 font-black border-l border-slate-200/60 text-red-800">
                                    <div className="text-xs">{formatCurrency(tributosMensal * 12)}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                       {((tributosMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                    </div>
                                 </td>
                              </tr>

                              {/* 02.1 - Tributos */}
                              {dreExpandedRows['02'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('02.1')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['02.1'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">02.1 - Tributos</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(tributosMensal, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(tributosMensal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((tributosMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* 02.1.1 - Simples Nacional - DAS (EDITÁVEL NA TELA!) */}
                              {dreExpandedRows['02'] && dreExpandedRows['02.1'] && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-3 pl-14">
                                       <div className="text-xs font-bold text-slate-700">02.1.1 - Simples Nacional - DAS</div>
                                       <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1">
                                          Taxa Real: 
                                          <input 
                                             type="number" 
                                             step="0.01" 
                                             value={dreTaxPercent} 
                                             onChange={(e) => setDreTaxPercent((e.target.value === '' ? '' : Number(e.target.value)))} 
                                             className="w-12 py-0.5 border border-slate-200 rounded text-center text-[10px] font-black text-[#1B4D3E] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                                          /> %
                                       </div>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(tributosMensal, receitaMensal))}
                                    <td className="p-3 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(tributosMensal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((tributosMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* 02.1.2 e 02.1.3 (Zeradões) */}
                              {dreExpandedRows['02'] && dreExpandedRows['02.1'] && ['02.1.2 - Sefaz', '02.1.3 - Retenção na fonte'].map(lbl => (
                                 <tr key={lbl} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors text-slate-400">
                                    <td className="p-2 pl-14 text-xs font-medium">{lbl}</td>
                                    {MONTHS.map(m => <td key={m} className="p-2 text-right">-</td>)}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100">-</td>
                                 </tr>
                              ))}

                              {/* (=) RECEITA LÍQUIDA */}
                              <tr className="bg-blue-50/40 font-black border-y border-slate-200/80 text-blue-900">
                                 <td className="p-3.5 pl-6 text-xs uppercase tracking-wider">(=) RECEITA LÍQUIDA</td>
                                 {MONTHS.map(m => renderValueCell(receitaLiquidaMensal, receitaMensal))}
                                 <td className="p-3.5 text-right bg-blue-100/20 font-black border-l border-slate-300">
                                    <div className="text-xs">{formatCurrency(receitaLiquidaMensal * 12)}</div>
                                    <div className="text-[9px] text-blue-800/80 mt-0.5">
                                       {((receitaLiquidaMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                    </div>
                                 </td>
                              </tr>

                              {/* 03. CUSTO OPERACIONAL */}
                              <tr className="bg-slate-50/60 font-bold border-b border-slate-200/60 hover:bg-slate-100/40 transition-colors">
                                 <td className="p-3 pl-4 flex items-center gap-2">
                                    <button onClick={() => toggleRow('03')} className="text-slate-400 hover:text-[#1B4D3E] p-1 rounded hover:bg-slate-200/50 transition-colors">
                                       <span className="text-xs transition-transform duration-200 block">{dreExpandedRows['03'] ? '▼' : '►'}</span>
                                    </button>
                                    <span className="text-xs uppercase tracking-wider font-extrabold text-[#1B4D3E]">03. CUSTO OPERACIONAL</span>
                                 </td>
                                 {MONTHS.map(m => renderValueCell(custoOperacionalMensal, receitaMensal))}
                                 <td className="p-3 text-right bg-emerald-50/20 font-black border-l border-slate-200/60 text-[#1B4D3E]">
                                    <div className="text-xs">{formatCurrency(custoOperacionalMensal * 12)}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">
                                       {((custoOperacionalMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                    </div>
                                 </td>
                              </tr>

                              {/* 03.1 - Salários e Remuneração */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.1')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.1'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.1 - Salários e Remuneração</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalRemuneracaoBase, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalRemuneracaoBase * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalRemuneracaoBase / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.1.1 - Salários */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.1'] && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.1.1 - Salários</td>
                                    {MONTHS.map(m => renderValueCell(totalSalarios, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(totalSalarios * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{((totalSalarios / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.1.2 - Insalubridade */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.1'] && totalInsalubridade > 0 && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.1.2 - Insalubridade</td>
                                    {MONTHS.map(m => renderValueCell(totalInsalubridade, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(totalInsalubridade * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{((totalInsalubridade / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.1.3 - Periculosidade */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.1'] && totalPericulosidade > 0 && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.1.3 - Periculosidade</td>
                                    {MONTHS.map(m => renderValueCell(totalPericulosidade, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(totalPericulosidade * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{((totalPericulosidade / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.1.9 - Adicional Noturno */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.1'] && (totalNoturno + totalIntrajornada + totalDsr) > 0 && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.1.10 - Adicional Noturno & DSR</td>
                                    {MONTHS.map(m => renderValueCell(totalNoturno + totalIntrajornada + totalDsr, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency((totalNoturno + totalIntrajornada + totalDsr) * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{(((totalNoturno + totalIntrajornada + totalDsr) / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.2 - Encargos Sociais (EDITÁVEL NA TELA!) */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.2')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.2'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.2 - Encargos Sociais</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalEncargosSociais, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalEncargosSociais * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalEncargosSociais / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* Sub-itens de encargos editáveis */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.2'] && [
                                 { key: 'fgts', lbl: '03.2.1 - Recolhimento FGTS', val: encargosValores.fgts },
                                 { key: 'decimoTerceiro', lbl: '03.2.2 - 13º Salário', val: encargosValores.decimoTerceiro },
                                 { key: 'ferias', lbl: '03.2.3 - Férias', val: encargosValores.ferias },
                                 { key: 'fgtsRescisorio', lbl: '03.2.4 - FGTS Rescisório', val: encargosValores.fgtsRescisorio },
                                 { key: 'outros', lbl: '03.2.5 - Outros Encargos', val: encargosValores.outros },
                                 { key: 'inss', lbl: '03.2.6 - INSS', val: encargosValores.inss }
                              ].map(item => (
                                 <tr key={item.key} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-3 pl-14">
                                       <div className="text-xs font-bold text-slate-700">{item.lbl}</div>
                                       <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1">
                                          Taxa Real: 
                                          <input 
                                             type="number" 
                                             step="0.01" 
                                             value={(dreEncargos as any)[item.key]} 
                                             onChange={(e) => setDreEncargos({ ...dreEncargos, [item.key]: (e.target.value === '' ? '' : Number(e.target.value)) })} 
                                             className="w-12 py-0.5 border border-slate-200 rounded text-center text-[10px] font-black text-[#1B4D3E] bg-[#F8FAFC] focus:bg-white focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                                          /> %
                                       </div>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(item.val, receitaMensal))}
                                    <td className="p-3 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(item.val * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((item.val / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              ))}

                              {/* 03.3 - Benefícios */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.3')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.3'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.3 - Benefícios</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalBeneficiosSubtotal, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalBeneficiosSubtotal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalBeneficiosSubtotal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* Sub-itens de Benefícios */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.3'] && [
                                 { lbl: '03.3.1 - Vale Transporte', val: totalVT - totalDescontoVT },
                                 { lbl: '03.3.2 - Vale Alimentação', val: totalVA - totalDescontoVA },
                                 { lbl: '03.3.3 - Vale Alimentação Sobre Férias', val: totalVAFerias },
                                 { lbl: '03.3.4 - Cesta Básica / Benefícios CCT', val: totalCesta + totalSindicato + totalOutrosBen }
                              ].map(item => (
                                 <tr key={item.lbl} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">{item.lbl}</td>
                                    {MONTHS.map(m => renderValueCell(item.val, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(item.val * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((item.val / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              ))}

                              {/* 03.4 - Diárias (Zeradão) */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100 text-slate-400">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.4')} className="text-slate-300 p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.4'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs">03.4 - Diárias</span>
                                    </td>
                                    {MONTHS.map(m => <td key={m} className="p-2.5 text-right">-</td>)}
                                    <td className="p-2.5 text-right font-bold border-l border-slate-200/40">-</td>
                                 </tr>
                              )}

                              {/* 03.5 - SSMA */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.5')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.5'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.5 - SSMA</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalSSMASubtotal, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalSSMASubtotal * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalSSMASubtotal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* Sub-itens SSMA */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.5'] && [
                                 { lbl: '03.5.1 - Equipamento de Proteção Individual (EPI)', val: totalEpi },
                                 { lbl: '03.5.3 - Exames Médicos / Periódicos', val: totalExames }
                              ].map(item => (
                                 <tr key={item.lbl} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">{item.lbl}</td>
                                    {MONTHS.map(m => renderValueCell(item.val, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(item.val * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((item.val / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              ))}

                              {/* 03.6 - Materiais */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.6')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.6'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.6 - Materiais</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalMateriais, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalMateriais * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalMateriais / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* Sub-itens Materiais */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.6'] && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.6.1 - Materiais de Limpeza e de Higiene</td>
                                    {MONTHS.map(m => renderValueCell(totalMateriais, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(totalMateriais * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{((totalMateriais / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* 03.7 - Equipamentos */}
                              {dreExpandedRows['03'] && (
                                 <tr className="bg-slate-50/30 font-semibold border-b border-slate-100">
                                    <td className="p-2.5 pl-8 flex items-center gap-1.5">
                                       <button onClick={() => toggleRow('03.7')} className="text-slate-400 hover:text-[#1B4D3E] p-0.5 rounded">
                                          <span className="text-[10px]">{dreExpandedRows['03.7'] ? '▼' : '►'}</span>
                                       </button>
                                       <span className="text-xs text-slate-700">03.7 - Equipamentos</span>
                                    </td>
                                    {MONTHS.map(m => renderValueCell(totalMaquinas, receitaMensal))}
                                    <td className="p-2.5 text-right bg-slate-50/50 font-bold border-l border-slate-200/40">
                                       <div className="text-xs">{formatCurrency(totalMaquinas * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">
                                          {((totalMaquinas / (receitaMensal || 1)) * 100).toFixed(1)}%
                                       </div>
                                    </td>
                                 </tr>
                              )}

                              {/* Sub-itens Equipamentos */}
                              {dreExpandedRows['03'] && dreExpandedRows['03.7'] && (
                                 <tr className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-2 pl-14 text-xs text-slate-500 font-medium">03.7.2 - Depreciação / Locação de Equipamentos</td>
                                    {MONTHS.map(m => renderValueCell(totalMaquinas, receitaMensal))}
                                    <td className="p-2 text-right font-semibold border-l border-slate-100 text-slate-600">
                                       <div className="text-[11px]">{formatCurrency(totalMaquinas * 12)}</div>
                                       <div className="text-[9px] text-slate-400 mt-0.5">{((totalMaquinas / (receitaMensal || 1)) * 100).toFixed(1)}%</div>
                                    </td>
                                 </tr>
                              )}

                              {/* (=) MARGEM BRUTA */}
                              <tr className="bg-emerald-50 font-black border-t-2 border-emerald-500/30 text-[#1B4D3E]">
                                 <td className="p-3.5 pl-6 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <span>📈</span> (=) MARGEM BRUTA
                                 </td>
                                 {MONTHS.map(m => renderValueCell(margemBrutaMensal, receitaMensal, true))}
                                 <td className="p-3.5 text-right bg-[#1B4D3E] font-black text-emerald-300 border-l border-emerald-700 shadow-inner">
                                    <div className="text-xs">{formatCurrency(margemBrutaMensal * 12)}</div>
                                    <div className="text-[9px] text-emerald-200 mt-0.5">
                                       {((margemBrutaMensal / (receitaMensal || 1)) * 100).toFixed(1)}%
                                    </div>
                                 </td>
                              </tr>

                           </tbody>
                        </table>
                     </div>
                  </div>
               );
            })()}

            {activeTab === 'comercial' && (
               <div className="space-y-8 animate-fadeIn">
                  {/* ESTILOS DE IMPRESSÃO EXCLUSIVOS PARA O SLIDE DECK */}
                  <style>{`
                     /* Estilos exclusivos para o Modo Apresentação - Aumento de Fontes */
                     .presentation-mode-active .text-[10px] { font-size: 14px !important; }
                     .presentation-mode-active .text-[11px] { font-size: 15px !important; }
                     .presentation-mode-active .text-[13px] { font-size: 18px !important; }
                     .presentation-mode-active .text-[15px] { font-size: 20px !important; }
                     .presentation-mode-active .text-xs { font-size: 16px !important; line-height: 22px !important; }
                     .presentation-mode-active .text-sm { font-size: 18px !important; line-height: 26px !important; }
                     .presentation-mode-active .text-base { font-size: 22px !important; line-height: 30px !important; }
                     .presentation-mode-active .text-lg { font-size: 26px !important; line-height: 34px !important; }
                     .presentation-mode-active .text-xl { font-size: 30px !important; line-height: 38px !important; }
                     .presentation-mode-active .text-2xl { font-size: 36px !important; line-height: 44px !important; }
                     .presentation-mode-active .text-3xl { font-size: 42px !important; line-height: 52px !important; }
                     .presentation-mode-active .text-4xl { font-size: 54px !important; line-height: 64px !important; }
                     .presentation-mode-active .text-5xl { font-size: 68px !important; line-height: 78px !important; }
                     
                     .presentation-mode-active .p-16 { padding: 4.5rem !important; }
                     .presentation-mode-active .p-8 { padding: 2.5rem !important; }
                     .presentation-mode-active .p-6 { padding: 2rem !important; }
                     .presentation-mode-active .gap-8 { gap: 2.5rem !important; }

                     @media screen {
                        .print-slide-deck {
                           display: none !important;
                        }
                     }
                     `}</style>
                     {viewMode === 'slide' && (
                        <style dangerouslySetInnerHTML={{__html: `
                           @media print {
                        @page {
                            size: 297mm 167mm !important;
                            margin: 0 !important;
                         }
                        
                        * {
                           -webkit-print-color-adjust: exact !important;
                           print-color-adjust: exact !important;
                           color-adjust: exact !important;
                        }

                        body {
                           margin: 0 !important;
                           padding: 0 !important;
                           background: white !important;
                        }

                        body * {
                           visibility: hidden !important;
                        }

                        .print-slide-deck, .print-slide-deck * {
                           visibility: visible !important;
                        }

                        .print-slide-deck {
                           display: block !important;
                           position: absolute !important;
                           left: 0 !important;
                           top: 0 !important;
                           width: 297mm !important;
                           height: auto !important;
                           background: transparent !important;
                           margin: 0 !important;
                           padding: 0 !important;
                           border: none !important;
                        }

                        /* ESCALA DE TEXTOS E ELEMENTOS AUMENTADOS PARA ALTA QUALIDADE NO IMPRESSO A4 */
                        .print-slide-deck .text-[7.5px] { font-size: 16px !important; line-height: 22px !important; }
                        .print-slide-deck .text-[8px] { font-size: 17px !important; line-height: 23px !important; }
                        .print-slide-deck .text-[8.5px] { font-size: 18px !important; line-height: 24px !important; }
                        .print-slide-deck .text-[9px] { font-size: 19px !important; line-height: 25px !important; }
                        .print-slide-deck .text-[9.5px] { font-size: 20px !important; line-height: 26px !important; }
                        .print-slide-deck .text-[10px] { font-size: 21px !important; line-height: 27px !important; }
                        .print-slide-deck .text-[11px] { font-size: 22px !important; line-height: 28px !important; }
                        .print-slide-deck .text-[12px] { font-size: 23px !important; line-height: 29px !important; }
                        .print-slide-deck .text-[13px] { font-size: 24px !important; line-height: 30px !important; }
                        .print-slide-deck .text-[14px] { font-size: 25px !important; line-height: 31px !important; }
                        .print-slide-deck .text-[15px] { font-size: 26px !important; line-height: 32px !important; }
                        
                        .print-slide-deck .text-xs { font-size: 21px !important; line-height: 28px !important; }
                        .print-slide-deck .text-sm { font-size: 24px !important; line-height: 32px !important; }
                        .print-slide-deck .text-base { font-size: 28px !important; line-height: 38px !important; }
                        .print-slide-deck .text-lg { font-size: 32px !important; line-height: 42px !important; }
                        .print-slide-deck .text-xl { font-size: 36px !important; line-height: 46px !important; }
                        .print-slide-deck .text-2xl { font-size: 42px !important; line-height: 52px !important; }
                        .print-slide-deck .text-3xl { font-size: 50px !important; line-height: 60px !important; }
                        .print-slide-deck .text-4xl { font-size: 64px !important; line-height: 76px !important; }
                        .print-slide-deck .text-5xl { font-size: 78px !important; line-height: 90px !important; }

                        .print-slide-deck .p-16 { padding: 2.5rem 3.5rem !important; }
                        .print-slide-deck .p-8 { padding: 1.5rem 2rem !important; }
                        .print-slide-deck .p-6 { padding: 1rem 1.5rem !important; }
                        .print-slide-deck .gap-8 { gap: 2rem !important; }
                        .print-slide-deck .gap-6 { gap: 1.5rem !important; }

                        /* REDIMENSIONAR E AMPLIAR CÍRCULOS DE ÍCONES NO PRINT */
                        .print-slide-deck .w-10 { width: 4rem !important; height: 4rem !important; }
                        .print-slide-deck .h-10 { height: 4rem !important; }
                        .print-slide-deck .w-12 { width: 5rem !important; height: 5rem !important; }
                        .print-slide-deck .h-12 { height: 5rem !important; }
                        
                        /* GARANTIR QUE OS SVGS DO LUCIDE CRESÇAM PROPORCIONALMENTE NO PRINT */
                        .print-slide-deck svg[viewBox="0 0 24 24"] { 
                           width: 2.2rem !important; 
                           height: 2.2rem !important; 
                           stroke-width: 2.5 !important;
                        }

                        /* AUMENTAR A GAP DO GRID DE KPIS E LARGURA DE DESCRIÇÕES NO PRINT */
                        .print-slide-deck .gap-1.5 { gap: 2rem !important; }
                        .print-slide-deck .max-w-\[65px\] { max-w: 130px !important; }
                        .print-slide-deck .max-w-\[80px\] { max-w: 160px !important; }
                        .print-slide-deck .max-w-\[90px\] { max-w: 170px !important; }
                        .print-slide-deck .max-w-\[100px\] { max-w: 190px !important; }

                        /* GENEROSO ESPAÇAMENTO E BORDAS NAS TABELAS NO PRINT */
                        .print-slide-deck table th, 
                        .print-slide-deck table td {
                           padding: 0.75rem 1rem !important;
                        }

                        .print-slide {
                            display: flex !important;
                            page-break-after: always !important;
                            break-after: page !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            width: 297mm !important;
                            height: 167mm !important;
                            max-height: 167mm !important;
                            box-sizing: border-box !important;
                            margin: 0 !important;
                            padding: 2.5rem 3.5rem !important;
                            position: relative !important;
                            overflow: hidden !important;
                            border: none !important;
                         }

                        /* FORÇAR RENDERIZAÇÃO DE CORES DE FUNDO EXPLICITAMENTE */
                        .print-slide.bg-[#1e4480], .print-slide[class*="bg-[#1e4480]"] {
                           background-color: #1e4480 !important;
                        }
                        .print-slide.bg-slate-950, .print-slide[class*="bg-slate-950"] {
                           background-color: #020617 !important;
                        }
                        .print-slide.bg-white, .print-slide[class*="bg-white"] {
                           background-color: #ffffff !important;
                        }
                     }
                  `}} />
                  )}

                  {/* CONTROLES E AÇÕES */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex-1 w-full overflow-x-auto pb-1 scrollbar-hide">
                        <div className="flex items-center gap-8 min-w-max">
                           <nav className="flex items-center gap-6">
                              <button 
                                 onClick={() => setActiveTab('dre')}
                                 className="flex items-center gap-2 text-slate-500 hover:text-[#1B4D3E] transition-colors font-bold text-[11px] uppercase tracking-widest py-2 pr-4 border-r border-slate-200"
                              >
                                 <ChevronLeft size={16} /> Voltar
                              </button>
                              <button 
                                 onClick={() => setViewMode('document')} 
                                 className={`
                                    whitespace-nowrap py-2 px-3 border-b-2 font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all duration-200
                                    ${viewMode === 'document' 
                                       ? 'border-[#1B4D3E] text-[#1B4D3E] opacity-100' 
                                       : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 opacity-80'}
                                 `}
                              >
                                 <FileText size={16} className={viewMode === 'document' ? 'text-[#10B981]' : 'text-slate-400'} />
                                 Documento Simples (A4)
                              </button>
                              <button 
                                 onClick={() => setViewMode('slide')} 
                                 className={`
                                    whitespace-nowrap py-2 px-3 border-b-2 font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all duration-200
                                    ${viewMode === 'slide' 
                                       ? 'border-[#1B4D3E] text-[#1B4D3E] opacity-100' 
                                       : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 opacity-80'}
                                 `}
                              >
                                 <Presentation size={16} className={viewMode === 'slide' ? 'text-[#10B981]' : 'text-slate-400'} />
                                 Slide Deck (Apresentação)
                              </button>
                           </nav>

                           {viewMode === 'document' && (
                             <div className="flex items-center gap-2 whitespace-nowrap ml-2">
                               <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Empresa Emissora:</span>
                               <select 
                                 value={selectedEmpresaId} 
                                 onChange={(e) => setSelectedEmpresaId(e.target.value)}
                                 className="px-3 py-1.5 border border-slate-300 rounded-md text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#1B4D3E]"
                               >
                                 {empresasEmissoras.map(emp => (
                                   <option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>
                                 ))}
                               </select>
                             </div>
                           )}
                        </div>
                     </div>
                     {viewMode === 'slide' && (
                        <div className="flex items-center justify-end gap-3 shrink-0">
                           <div className="flex gap-3">
                              <button
                                 type="button"
                                 onClick={() => setPresentationMode(true)}
                                 className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                 <span>🖥️</span> Apresentar
                              </button>
                              <button
                                 type="button"
                                 onClick={() => {
                                    const oldTitle = document.title;
                                    const numRaw = proposta.cliente.numeroProposta;
                                    const num = numRaw ? `FPV-${String(numRaw).padStart(3, '0')}` : "FPV-XXX";
                                    const rev = proposta.cliente.revisao || "R01";
                                    const clientName = proposta.cliente.cliente || proposta.cliente.razaoSocial || "Cliente";
                                    document.title = `PROPOSTA COMERCIAL - ${num}-${rev} - ${clientName}`.toUpperCase();
                                    window.print();
                                    setTimeout(() => { document.title = oldTitle; }, 100);
                                 }}
                                 className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                 <span>🖨️</span> Salvar PDF / Imprimir
                              </button>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* CONTAINER DO DOCUMENTO SIMPLES A4 */}
                  {viewMode === 'document' && (
                     <div className="w-full bg-slate-200 border border-slate-300 rounded-xl overflow-hidden min-h-[600px] mb-8">
                        <DocumentoA4 
                           proposta={proposta} 
                           resultado={resultado}
                           empresaEmissora={empresasEmissoras.find(e => e.id === selectedEmpresaId) || empresasEmissoras[0]} 
                           templates={templates}
                           onUpdateClausulas={(clausulas: any[]) => setProposta({...proposta, cliente: {...proposta.cliente, clausulasA4: clausulas}})}
                           onUpdateCliente={(cliente: any) => setProposta({...proposta, cliente})}
                           onUpdateItens={(itens: any[]) => setProposta({...proposta, itensInclusosExcluidos: itens})}
                        />
                     </div>
                  )}

                  {/* CONTAINER DOS SLIDES PARA VISUALIZAÇÃO EM TELA */}
                  <div className={viewMode === 'document' ? 'hidden' : (presentationMode 
                     ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
                     : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-hidden relative"
                  )}>
                     {/* BOTÃO VOLTAR (ESQUERDA) */}
                     <button
                        type="button"
                        onClick={() => setCurrentSlide(currentSlide === 1 ? 13 : currentSlide - 1)}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm' : ''}`}
                     >
                        <ChevronLeft size={28} className="stroke-[3] -ml-1" />
                     </button>
                     
                     {/* BOTÃO AVANÇAR (DIREITA) */}
                     <button
                        type="button"
                        onClick={() => setCurrentSlide(currentSlide === 13 ? 1 : currentSlide + 1)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm' : ''}`}
                     >
                        <ChevronRight size={28} className="stroke-[3] -mr-1" />
                     </button>

                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[960px] aspect-[16/9] min-w-[760px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative select-none flex flex-col justify-between"
                     }>
                        
                        {/* SLIDE 01 (MENSAGEM DE VISITA E AGRADECIMENTO) */}
                        {currentSlide === 2 && (
                           <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800">
                              {/* Linhas diagonais decorativas */}
                              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                                 <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                 <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                 <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                 
                                 <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                 <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                 <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                              </svg>

                              <div className="grid grid-cols-12 gap-8 items-center h-full relative z-10">
                                 <div className="col-span-8 flex flex-col justify-center space-y-5 pr-4">
                                    {/* Olá, Karin! */}
                                    <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight leading-none">
                                       Olá, {proposta.cliente.contato || "Karin"}!
                                    </h2>

                                    {/* Mensagem Principal */}
                                    <div className="text-slate-600 text-xs leading-relaxed space-y-4 font-medium">
                                       <p>
                                          O desenvolvimento deste projeto teve como base as informações reunidas por meio da visita técnica realizada, com o objetivo de corresponder, da forma mais eficaz possível, às necessidades do <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> no que se refere aos serviços de <strong className="font-extrabold text-slate-800">{proposta.cliente.tipoServicos || proposta.cliente.objetoProposta || "Limpeza e conservação"}</strong>.
                                       </p>
                                       <p className="font-semibold text-slate-700">
                                          Estamos imensamente gratos desde já pela oportunidade!
                                       </p>
                                    </div>

                                    <div className="space-y-4">
                                       <span className="text-xs font-bold text-slate-500 block">Att,</span>
                                       
                                       {/* Seller Card (Pill card) */}
                                       <div className="bg-[#2B547E] text-white px-5 py-3 rounded-2xl inline-flex flex-col space-y-0.5 shadow-md max-w-sm">
                                          <span className="text-sm font-black tracking-tight">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                          <span className="text-[10px] text-slate-200/80 font-bold uppercase tracking-wider">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                          <span className="text-[10px] text-slate-200/80 font-bold">{proposta.cliente.vendedorTelefone || "(41) 9 9737-0880"}</span>
                                          <span className="text-[10px] text-slate-200/80 font-bold truncate">{proposta.cliente.vendedorEmail || "contato@silvaconsultoria.com.br"}</span>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Logo JVS no Slide 1 */}
                                 <div className="col-span-4 flex flex-col justify-center items-center pl-8 border-l border-slate-100 h-full">
                                    <img 
                                       src={companyLogo} 
                                       alt="Silva Consultoria" 
                                       className="max-h-24 w-auto object-contain mb-4"
                                    />
                                    <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">FACILITIES</div>
                                 </div>
                              </div>

                              <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto pr-28">
                                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                 <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">02</span>
                              </div>

                           </div>
                        )}

                        {/* SLIDE 02 (CAPA DA PROPOSTA - COM FOTO E FILTRO AZUL) */}
                        {currentSlide === 1 && (
                           <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950">
                              {/* Imagem de Fundo Nativa HTML para Garantir Renderização */}
                              <img 
                                 src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200" 
                                 alt="Capa Fundo" 
                                 className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 filter blur-[0.5px]"
                              />
                              
                              {/* Overlay Azul Escuro do Print */}
                              <div className="absolute inset-0 bg-[#1e4480]/85 backdrop-blur-[1px]"></div>

                              {/* Conteúdo Central */}
                              <div className="relative z-20 flex flex-col justify-center items-center h-full w-full space-y-12">
                                 {/* Logo Silva Consultoria em Branco Puro */}
                                 <div className="flex flex-col items-center space-y-4 animate-fadeIn">
                                    <img 
                                       src={companyLogo} 
                                       alt="Silva Consultoria Logo" 
                                       className="max-h-32 w-auto object-contain"
                                    />
                                    <div className="text-[11px] font-black tracking-[0.3em] text-white/90 uppercase pl-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">FACILITIES</div>
                                 </div>

                                 {/* Caixa de Texto Pílula "PROPOSTA COMERCIAL" idêntica ao Print */}
                                 <div className="w-full max-w-2xl border-2 border-white rounded-full bg-white/10 px-12 py-4 shadow-xl backdrop-blur-md text-center hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.01]">
                                    <span className="text-white text-base font-black tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                                       PROPOSTA COMERCIAL
                                    </span>
                                 </div>
                              </div>
                              {/* Rodapé Interno do Slide */}
                              <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-28">
                                 <div className="flex gap-16">
                                    <div className="space-y-1">
                                       <div>Cliente: <strong className="text-white">{proposta.cliente.cliente || "Nome do Cliente"}</strong></div>
                                       <div>Nº Proposta: <strong className="text-white">{proposta.cliente.numeroProposta || "FPV-XXXX"}</strong></div>
                                    </div>
                                    <div className="space-y-1">
                                       <div>Data: <strong className="text-white">
                                          {proposta.cliente.dataElaboracao 
                                             ? new Date(proposta.cliente.dataElaboracao + 'T12:00:00').toLocaleDateString('pt-BR') 
                                             : new Date().toLocaleDateString('pt-BR')}
                                       </strong></div>
                                       <div>Revisão: <strong className="text-white">{proposta.cliente.revisao || "R01"}</strong></div>
                                    </div>
                                 </div>
                                 <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">01</span>
                              </div>

                           </div>
                        )}

                        
                         {currentSlide === 3 && (
                            <div className="w-full h-full bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                                  <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                                  
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                                  <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                               </svg>

                               <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                  <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                                     <div>
                                        <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                           QUEM SOMOS
                                        </h2>
                                        <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                           Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                        </p>
                                     </div>

                                     <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Award size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              Anos de atuação em Facilities
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <MapPin size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap"><strong className="text-xl font-black">+100</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              postos ativos
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Users size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              Clientes atendidos
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <ShieldCheck size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+100</strong> mil m²</span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              de limpeza em altura
                                           </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                           <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                              <Sparkles size={26} className="text-white shrink-0" />
                                           </div>
                                           <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+500</strong> mil m²</span>
                                           <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                              de Pisos tratados
                                           </span>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                                     <div className="w-full max-w-[300px] aspect-square drop-shadow-lg">
                                        <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                                     </div>
                                     <div className="text-[13px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1.5 rounded-full shadow-sm">
                                        Atendimento em toda Região Sul
                                     </div>
                                  </div>
                               </div>

                               <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                                  <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 4 && (
                            <div className="w-full h-full bg-white p-16 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                                  <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                                  <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                                  
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                                  <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                                  <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                               </svg>
                               
                               <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                                  <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                                     <div>
                                        <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                           NOSSOS VALORES
                                        </h2>
                                        <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify">
                                           Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
                                        </p>
                                     </div>
                                  </div>

                                  <div className="col-span-5 h-full w-full flex items-center justify-center relative">

                                     <div className="relative w-full h-[220px] z-20">
                                        <img 
                                           src="/hand-support.png" 
                                           alt="Mão de suporte"
                                           className="absolute right-[-10px] bottom-[-85px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                        />
                                        <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Trophy size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Lightbulb size={36} className="text-white shrink-0" />
                                        </div>

                                        <div className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                           <Users size={36} className="text-white shrink-0" />
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 5 && (
                            <div className="w-full h-full bg-white p-16 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                                  <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                                  <line x1="-100" y1="250" x2="550" y2="-400" stroke="#F1F5F9" strokeWidth="3" />
                                  
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                               </svg>
                               
                               <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                                  <div>
                                     <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-6">
                                        PRINCIPAIS SERVIÇOS PRESTADOS
                                     </h2>

                                     <div className="grid grid-cols-2 gap-12 mt-2">
                                        <div className="flex flex-col space-y-3">
                                           <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                              <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight max-w-[300px]">
                                                 TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                              </span>
                                              <div className="text-[#1e4480] shrink-0">
                                                 <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                                    <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                                    <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                                    <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                                    <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                                    <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                                    <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                                 </svg>
                                              </div>
                                           </div>
                                           <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organização de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um space eficiente, seguro e bem cuidado.
                                           </p>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                           <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                              <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight">
                                                 LIMPEZA EM ALTURA
                                              </span>
                                              <div className="text-[#1e4480] shrink-0">
                                                 <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                                    <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                                    <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                                    <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                                    <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                                    <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                                    <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                                 </svg>
                                              </div>
                                           </div>
                                           <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                                           </p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="32" cy="16" r="6" fill="currentColor" />
                                              <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                              <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                              <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                              <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                              <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                              <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                              <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           LIMPEZA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                              <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                              <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                              <circle cx="32" cy="25" r="6" fill="currentColor" />
                                              <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                              <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                              <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                              <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                              <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                              <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           PORTARIA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                              <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                              <circle cx="22" cy="22" r="5" fill="currentColor" />
                                              <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                              <circle cx="42" cy="22" r="5" fill="currentColor" />
                                              <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                              <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                              <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                              <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           RECEPÇÃO
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                              <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                              <circle cx="28" cy="18" r="6" fill="currentColor" />
                                              <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                              <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                              <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                              <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                              <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                              <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                              <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           MANUTENÇÃO
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl hover:scale-105 transition-all duration-300">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                              <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                              <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                              <circle cx="32" cy="26" r="5" fill="currentColor" />
                                              <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                              <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                              <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                              <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                              <circle cx="32" cy="38" r="2" fill="#eab308" />
                                           </svg>
                                        </div>
                                        <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                           JARDINAGEM
                                        </span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                               </div>
                            </div>
                         )}

                         {currentSlide === 6 && (
                            <div className="w-full h-full bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                               </svg>
                               
                               <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-white">
                                  <div>
                                     <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">
                                        SETORES ATENDIDOS
                                     </h2>

                                     <div className="grid grid-cols-2 gap-12 mt-2">
                                        <div className="flex flex-col space-y-3">
                                           <div className="flex flex-col border-b border-white/20 pb-2">
                                              <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                              <div className="flex items-center justify-between gap-4">
                                                 <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                                    INDÚSTRIA
                                                 </span>
                                                 <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                                    <Factory size={22} className="stroke-[2.5]" />
                                                 </div>
                                              </div>
                                           </div>
                                           <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Com processos minuciosos e detalhados, o setor industrial trouxe para o escopo da Silva Consultoria a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da indústria.
                                           </p>
                                        </div>

                                        <div className="flex flex-col space-y-3 pl-2">
                                           <div className="flex flex-col border-b border-white/20 pb-2">
                                              <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                              <div className="flex items-center justify-between gap-4">
                                                 <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                                    VAREJO
                                                 </span>
                                                 <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                                    <Store size={22} className="stroke-[2.5]" />
                                                 </div>
                                              </div>
                                           </div>
                                           <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                              Um dos setores com maior participação em nossa carteira de clientes, o varejo exigiu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram em constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                                           </p>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-white/20 relative z-20">
                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Bus size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           TRANSPORTE<br />E LOGÍSTICA
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Building size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[110px] leading-tight">
                                           CONDOMÍNIOS<br />E EDIFÍCIOS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <Hospital size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           CLÍNICAS E<br />HOSPITAIS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <ShoppingBag size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                           SHOPPING<br />CENTERS
                                        </span>
                                     </div>

                                     <div className="flex flex-col items-center justify-center">
                                        <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                           <GraduationCap size={22} className="stroke-[2]" />
                                        </div>
                                        <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[120px] leading-tight">
                                           ESTABELECIMENTOS<br />EDUCACIONAIS
                                        </span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                               </div>
                            </div>
                         )}
{/* SLIDE 07 (PRINCIPAIS FERRAMENTAS - DIVIDIDO LADO A LADO) */}
                         {currentSlide === 7 && (
                            <div className="absolute inset-0 w-full h-full grid grid-cols-2 z-10 animate-fadeIn bg-white overflow-hidden">
                               {/* Metade Esquerda (Branca) */}
                               <div className="col-span-1 bg-white p-16 flex flex-col justify-between relative h-full text-slate-800 border-r border-slate-100">
                                  {/* Stripes de fundo no topo esquerdo */}
                                  <svg className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                     <line x1="-50" y1="150" x2="150" y2="-50" stroke="#1e4480" strokeWidth="10" />
                                     <line x1="-50" y1="200" x2="200" y2="-50" stroke="#1e4480" strokeWidth="6" />
                                     <line x1="-50" y1="250" x2="250" y2="-50" stroke="#1e4480" strokeWidth="3" />
                                  </svg>

                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                     {/* Título */}
                                     <div>
                                        <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-8">
                                           PRINCIPAIS<br />
                                           FERRAMENTAS
                                        </h2>
                                     </div>

                                     {/* Itens da esquerda */}
                                     <div className="space-y-6 my-auto">
                                        {/* Bitrix24 */}
                                        <div className="flex gap-4 items-start">
                                           <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                              <Share2 size={20} className="stroke-[2.5]" />
                                           </div>
                                           <div className="space-y-1">
                                              <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">BITRIX24</h3>
                                              <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                                 CRM, armazenamento de dados e documentos, gestão de resultados, planejamento estratégico.
                                              </p>
                                              {/* Logo Bitrix24 */}
                                              <div className="pt-2 flex items-center gap-1 select-none">
                                                 <span className="text-[#00A4E4] font-black text-sm tracking-tight">Bitrix</span>
                                                 <span className="text-[#435560] font-black text-sm tracking-tight">24</span>
                                                 <div className="w-3.5 h-3.5 rounded-full border-2 border-[#00A4E4] flex items-center justify-center text-[7px] text-[#00A4E4] font-black ml-0.5">L</div>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Secullum */}
                                        <div className="flex gap-4 items-start">
                                           <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                              <Clock size={20} className="stroke-[2.5]" />
                                           </div>
                                           <div className="space-y-1">
                                              <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">SECULLUM</h3>
                                              <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                                 Controle de ponto digital, envio e assinatura de holerites e documentos administrativos, controle e gestão de turnover.
                                              </p>
                                              {/* Logo Secullum */}
                                              <div className="pt-2 flex flex-col select-none">
                                                 <div className="flex items-center gap-1">
                                                    <Award size={14} className="text-amber-500 shrink-0" />
                                                    <span className="text-slate-700 font-black text-xs tracking-tight lowercase">secullum</span>
                                                 </div>
                                                 <span className="text-slate-400 text-[7px] font-bold pl-5 leading-none">Ser fácil para ser humano.</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Rodapé Esquerdo */}
                                     <div className="pt-4 border-t border-slate-100 flex items-center text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                        <span>www.smartbidhub.com.br</span>
                                     </div>
                                  </div>
                               </div>

                               {/* Metade Direita (Azul) */}
                               <div className="col-span-1 bg-[#1e4480] p-16 flex flex-col justify-between relative h-full text-white">
                                  {/* Stripes de fundo */}
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                     <line x1="150" y1="400" x2="400" y2="150" stroke="#FFFFFF" strokeWidth="10" />
                                     <line x1="200" y1="400" x2="450" y2="150" stroke="#FFFFFF" strokeWidth="6" />
                                     <line x1="250" y1="400" x2="500" y2="150" stroke="#FFFFFF" strokeWidth="3" />
                                  </svg>

                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                     {/* Espaço superior para alinhar com o título da esquerda */}
                                     <div className="h-12"></div>

                                     {/* Itens da direita */}
                                     <div className="space-y-4 my-auto">
                                        {/* Nexus Operacional (IA Core - Destaque Principal) */}
                                        <div className="flex gap-4 items-start border-b border-white/10 pb-3">
                                           <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-1 border border-emerald-500/30">
                                              <Cpu size={20} className="stroke-[2.5] animate-pulse" />
                                           </div>
                                           <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                 <h3 className="text-white text-xs font-black tracking-wider uppercase">NEXUS OPERACIONAL</h3>
                                                 <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase">IA CORE</span>
                                              </div>
                                              <p className="text-white/80 text-[8px] font-semibold leading-relaxed">
                                                 Mesa de operação inteligente baseada em IA, otimizando agendamentos de frotas, distribuição de escalas e monitoramento de serviços em tempo real.
                                              </p>
                                              {/* Logo Nexus */}
                                              <div className="pt-1 flex items-center gap-1 select-none">
                                                 <span className="text-emerald-400 font-black text-xs tracking-tight">Nexus</span>
                                                 <span className="text-white font-extrabold text-xs tracking-tight">Operacional</span>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Onvio */}
                                        <div className="flex gap-4 items-start">
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                              <User size={20} className="stroke-[2.5]" />
                                           </div>
                                           <div className="space-y-1">
                                              <h3 className="text-white text-xs font-black tracking-wider uppercase">ONVIO</h3>
                                              <p className="text-white/80 text-[8px] font-semibold leading-relaxed">
                                                 Registro e gestão de documentação de funcionários.
                                              </p>
                                              {/* Logo Onvio */}
                                              <div className="pt-1.5 flex flex-col select-none">
                                                 <span className="text-orange-400/80 text-[6px] font-extrabold tracking-widest uppercase">THOMSON REUTERS</span>
                                                 <span className="text-orange-500 font-black text-sm tracking-tight leading-none mt-0.5">ONVIO</span>
                                              </div>
                                           </div>
                                        </div>

                                        {/* Check-List Fácil */}
                                        <div className="flex gap-4 items-start">
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                              <Smartphone size={20} className="stroke-[2.5]" />
                                           </div>
                                           <div className="space-y-1">
                                              <h3 className="text-white text-xs font-black tracking-wider uppercase">CHECK-LIST FÁCIL</h3>
                                              <p className="text-white/80 text-[8px] font-semibold leading-relaxed">
                                                 Plataforma digital de desenvolvimento e gestão de processos internos com registro fotográfico, SLA's etc.
                                              </p>
                                              {/* Logo Check-List Fácil */}
                                              <div className="pt-1.5 flex items-center gap-1 select-none text-[#10B981]">
                                                 <span className="text-sm font-black tracking-tight flex items-center gap-1">✔ checklistfácil</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Rodapé Direito */}
                                     <div className="pt-4 border-t border-white/20 flex justify-between items-center text-white/60 text-[9px] font-bold">
                                        <span className="uppercase tracking-widest">www.smartbidhub.com.br</span>
                                        <span className="text-white/80 bg-white/10 px-2.5 py-0.5 rounded font-black">07</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         )}

                          {currentSlide === 8 && (
                            <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-slate-800 overflow-hidden bg-white">
                               {/* Linhas diagonais decorativas da marca */}
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#1e4480" strokeWidth="10" />
                                  <line x1="-50" y1="200" x2="400" y2="-250" stroke="#1e4480" strokeWidth="6" />
                                  <line x1="-50" y1="250" x2="450" y2="-250" stroke="#1e4480" strokeWidth="3" />
                                  
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#1e4480" strokeWidth="10" />
                                  <line x1="650" y1="800" x2="1150" y2="300" stroke="#1e4480" strokeWidth="6" />
                                  <line x1="700" y1="800" x2="1200" y2="300" stroke="#1e4480" strokeWidth="3" />
                               </svg>

                               <div className="flex flex-col justify-between h-full relative z-10">
                                  {/* Header */}
                                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                     <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase">
                                        OBJETO & ESCOPO TÉCNICO
                                     </h2>
                                     <img 
                                        src={companyLogo} 
                                        alt="Silva Consultoria Logo" 
                                        className="max-h-10 w-auto object-contain"
                                     />
                                  </div>

                                  {/* Content Area */}
                                  <div className="my-auto w-full max-w-4xl mx-auto">
                                     {proposta.cliente.hasEscopoTecnico ? (
                                        <div className="grid grid-cols-2 gap-8 items-stretch">
                                           {/* Left: Objeto da Proposta */}
                                           <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                              <div>
                                                 <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-widest block mb-2">01. OBJETO DA PROPOSTA</span>
                                                 <p className="text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                                                    {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                                 </p>
                                              </div>
                                           </div>

                                           {/* Right: Escopo Técnico */}
                                           <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                              <div>
                                                 <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-widest block mb-2">02. ESCOPO TÉCNICO</span>
                                                 <p className="text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line overflow-y-auto max-h-[160px]">
                                                    {proposta.cliente.escopoTecnico || 'Detalhamento das atividades operacionais conforme solicitação e cronograma alinhado.'}
                                                 </p>
                                              </div>
                                           </div>
                                        </div>
                                     ) : (
                                        <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center shadow-sm">
                                           <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-widest block mb-3">OBJETO DA PROPOSTA</span>
                                           <p className="text-sm font-bold leading-relaxed text-slate-700 whitespace-pre-line">
                                              {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                           </p>
                                        </div>
                                     )}
                                  </div>

                                  {/* Footer */}
                                  <div className="flex justify-between items-center w-full text-slate-400 text-[9px] font-bold uppercase tracking-wider pt-2 border-t border-slate-100">
                                     <span>www.smartbidhub.com.br</span>
                                     <span className="text-[#1e4480] bg-slate-100 px-2.5 py-0.5 rounded font-black">08</span>
                                  </div>
                               </div>
                            </div>
                          )}


                         {currentSlide === 9 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="flex flex-col justify-between h-full relative z-10 w-full">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                     <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                        <div className="bg-[#1e4480] text-center py-3">
                                           <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                        </div>
                                        <div className="flex-1">
                                           <table className="w-full text-left border-collapse">
                                              <thead>
                                                 <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                    <th className="px-5 py-3">Função</th>
                                                    <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                                    <th className="px-5 py-3 text-center w-28">Escala</th>
                                                    <th className="px-5 py-3 text-center w-36">Horário</th>
                                                 </tr>
                                              </thead>
                                              <tbody>
                                                 {proposta.equipe && proposta.equipe.length > 0 ? (
                                                    proposta.equipe.map((p: any, idx: number) => (
                                                       <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                          <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                          <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.tipoItem === 'SPOT' ? p.quantidadeDemanda || 0 : p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                          <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                          <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                             {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                                ? `${p.parametrosPosto.horarioInicio} às ${p.parametrosPosto.horarioFim}` 
                                                                : '08:00 às 17:00'}
                                                          </td>
                                                       </tr>
                                                    ))
                                                 ) : (
                                                    <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                       <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">Nenhum posto de trabalho inserido.</td>
                                                    </tr>
                                                 )}
                                              </tbody>
                                           </table>
                                        </div>
                                     </div>

                                     <div className="col-span-4 flex flex-col justify-center">
                                        <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                           <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                              <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                              <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                           </div>
                                           <div className="space-y-3">
                                              {(() => {
                                                 const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                                    proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                                    proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                                    proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                                 ];
                                                 return clausulas.map((c: string, cIdx: number) => (
                                                    <div key={cIdx} className="flex items-start gap-2.5">
                                                       <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                       </svg>
                                                       <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">{c}</p>
                                                    </div>
                                                 ));
                                              })()}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 10 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUSÍDOS</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto">
                                     <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                           <thead>
                                              <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                 <th className="px-6 py-3.5 w-32">Item</th>
                                                 <th className="px-6 py-3.5">Descrição</th>
                                                 <th className="px-6 py-3.5 text-center w-40">Status</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                    <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                                    <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                                    <td className="px-6 py-3.5 text-center">
                                                       {p.incluso ? (
                                                          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                             <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                             </svg>
                                                          </div>
                                                       ) : (
                                                          <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                             <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                             </svg>
                                                          </div>
                                                       )}
                                                    </td>
                                                 </tr>
                                              ))}
                                           </tbody>
                                        </table>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 11 && (() => {
                            const fc = formatCurrency;
                            const divisorTributos = resultado?.divisor || 1;
                            const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                            const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                            
                            const applyCascata = (custo: any) => {
                              const cD = Number(custo) || 0;
                              const comAdm = cD * (1 + txAdm);
                              const comLucro = comAdm * (1 + txLucro);
                              return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                            };

                            const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                            const insumosSubtotal = applyCascata(
                              Number(proposta.insumos.materiais || 0) + 
                              Number(proposta.insumos.maquinas || 0) + 
                              Number(proposta.insumos.descartaveis || 0) + 
                              Number(proposta.insumos.servicos || 0)
                            );

                            const renderInsumoRow = (label: string, value: number) => {
                               const isZero = value === 0;
                               return (
                                  <tr key={label} className={`border-b border-slate-100 ${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}`}>
                                     <td className="py-3 px-4 font-semibold">{label}</td>
                                     <td className={`py-3 px-4 text-right font-black ${isZero ? 'text-slate-300' : 'text-slate-800'}`}>
                                        {isZero ? '-' : fc(value)}
                                     </td>
                                  </tr>
                               );
                            };

                            return (
                               <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                     <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                     <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                                  </svg>

                                  <div className="relative z-10 flex flex-col h-full justify-between">
                                     <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                        <div className="flex flex-col">
                                           <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                           <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                        </div>
                                        <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                     </div>

                                     <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                        <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                           <table className="w-full text-left border-collapse text-[10px]">
                                              <thead>
                                                 <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                    <th className="py-3.5 px-4">Grupo de Custo</th>
                                                    <th className="py-3.5 px-4 text-right">Valor Mensal</th>
                                                 </tr>
                                              </thead>
                                              <tbody>
                                                 <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                    <td className="py-3.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                    <td className="py-3.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                                 </tr>
                                                 {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos.materiais || 0) + Number(proposta.insumos.maquinas || 0)))}
                                                 {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos.descartaveis || 0)))}
                                                 {renderInsumoRow('Outros Serviços / Operações', applyCascata(Number(proposta.insumos.servicos || 0)))}
                                              </tbody>
                                           </table>
                                           
                                           <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-between items-center mt-auto">
                                              <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Valor Total Mensal Proposto</span>
                                              <span className="text-lg font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1.5 rounded-xl shadow-xs">
                                                 {fc(maoDeObraSubtotal + insumosSubtotal)}
                                              </span>
                                           </div>
                                        </div>

                                        <div className="col-span-5 flex flex-col justify-center">
                                           <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                              <div className="flex items-center gap-2 border-b border-slate-255 pb-2">
                                                 <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                                 <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                              </div>
                                              <div className="space-y-3.5">
                                                 <div className="flex items-start gap-2.5">
                                                    <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                                 </div>
                                                 <div className="flex items-start gap-2.5">
                                                    <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Faturamento mensal com vencimento a ser pactuado nas condições gerais da contratação, emitido após a prestação dos serviços.</p>
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                     </div>
                                  </div>
                               </div>
                            );
                         })()}

                         {currentSlide === 12 && (
                            <div className="w-full h-full bg-white p-12 flex flex-col justify-between relative overflow-hidden text-slate-800 rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>
                             {(() => {
                                const condsColab = [
                                   proposta.cliente?.condicaoColaboradores1 || "Vale alimentação de R$900,00;",
                                   proposta.cliente?.condicaoColaboradores2 || "Cesta trimestral de assiduidade;",
                                   proposta.cliente?.condicaoColaboradores3 || "2 Vales transporte por dia."
                                ].filter(Boolean);

                                const condsCli = [
                                   proposta.cliente?.condicaoCliente1 || "Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;",
                                   proposta.cliente?.condicaoCliente2 || "Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;",
                                   proposta.cliente?.condicaoCliente3 || "Próximo reajuste Fevereiro/2026."
                                ].filter(Boolean);

                                return (
                                   <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-2 gap-x-8 gap-y-4">
                                      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                         <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                            <Calendar size={16} className="text-[#1e4480]" />
                                            <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Prazos e Validade</h4>
                                         </div>
                                         <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                               <span className="text-slate-500 font-bold">Validade da Proposta:</span>
                                               <span className="text-slate-800 font-black">{proposta.condicoes?.validadeProposta || "15 (quinze) dias"}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                               <span className="text-slate-500 font-bold">Prazo de Início dos Serviços:</span>
                                               <span className="text-slate-800 font-black">{proposta.condicoes?.prazoInicio || "20 (vinte) dias"}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] pb-0.5">
                                               <span className="text-slate-500 font-bold">Vigência Contratual Mínima:</span>
                                               <span className="text-slate-800 font-black">{proposta.condicoes?.vigenciaContratual || "12 (doze) meses"}</span>
                                            </div>
                                         </div>
                                      </div>

                                      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                         <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                            <CreditCard size={16} className="text-[#1e4480]" />
                                            <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Faturamento e Reajuste</h4>
                                         </div>
                                         <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                               <span className="text-slate-500 font-bold">Prazo de Pagamento:</span>
                                               <span className="text-slate-800 font-black">{proposta.condicoes?.prazoPagamento || "30 dias líquido"}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                               <span className="text-slate-500 font-bold">Base de Reajuste Anual:</span>
                                               <span className="text-slate-800 font-black">{proposta.condicoes?.baseReajuste || "Convenção Coletiva (CCT) / IPCA"}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] pb-0.5">
                                               <span className="text-slate-500 font-bold">Garantias e Seguros:</span>
                                               <span className="text-[#1b4d3e] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 text-[9px]">Inclusos e Ativos</span>
                                            </div>
                                         </div>
                                      </div>

                                      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                         <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                            <UserCheck size={16} className="text-[#1e4480]" />
                                            <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições dos Colaboradores</h4>
                                         </div>
                                         <div className="space-y-1">
                                            {condsColab.map((cond, idx) => (
                                               <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                  {cond}
                                               </div>
                                            ))}
                                         </div>
                                      </div>

                                      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                         <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                            <Briefcase size={16} className="text-[#1e4480]" />
                                            <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições para o Cliente</h4>
                                         </div>
                                         <div className="space-y-1">
                                            {condsCli.map((cond, idx) => (
                                               <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                  {cond}
                                               </div>
                                            ))}
                                         </div>
                                      </div>
                                   </div>
                                );
                             })()}
<div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                                  </div>
                               </div>
                            </div>
                         )}

                         {currentSlide === 13 && (
                            <div className="w-full h-full bg-[#1e4480] p-12 flex flex-col justify-between relative overflow-hidden text-white rounded-2xl border border-slate-200 select-none">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                                  <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                                     <div className="flex flex-col">
                                        <span className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">TERMO DE ACEITE E CONTRATAÇÃO</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                                     <div className="col-span-6 space-y-4">
                                        <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                        <div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                           <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                           <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                           <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                                 <span className="truncate text-white font-bold">{proposta.cliente.razaoSocial || proposta.cliente.cliente || "Não informada"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                                 <span className="text-white font-bold">{proposta.cliente.cnpj || "Não informado"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                                 <span className="text-white font-bold">{proposta.cliente.dataInicio ? proposta.cliente.dataInicio.split('-').reverse().join('/') : "A definir"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                                 <span className="text-white font-bold">{proposta.cliente.dataVencimento ? proposta.cliente.dataVencimento.split('-').reverse().join('/') : "A definir"}</span>
                                              </div>
                                              <div className="flex flex-col col-span-2">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Cargo do Contato / Representante</span>
                                                 <span className="truncate text-white font-bold">{proposta.cliente.contatoCargo || "Representante Legal"}</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>

                                     <div className="col-span-6 grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                           <div className="flex flex-col">
                                              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                              <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente.cliente || "Erasto Gaertner"}</span>
                                           </div>
                                           <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                              <div className="h-6 w-full mb-1"></div>
                                              <span className="text-[9px] font-black text-white">Assinatura / Carimbo</span>
                                              <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">Representante Legal</span>
                                           </div>
                                        </div>

                                        <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                           <div className="flex flex-col">
                                              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATADA</span>
                                              <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">Silva Consultoria Empresarial LTDA</span>
                                           </div>
                                           <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                              <div className="h-6 w-full mb-1 flex items-center justify-center">
                                                 <span className="text-[8px] text-emerald-300 font-extrabold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/35 uppercase select-none">Assinado Digitalmente</span>
                                              </div>
                                              <span className="text-[9px] font-black text-white">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                              <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                     <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">13</span>
                                  </div>
                               </div>
                            </div>
                         )}
                     </div>
                  </div>
{/* OS CONTROLES DE NAVEGAÇÃO FORAM MOVIDOS PARA AS LATERAIS DO CONTAINER DOS SLIDES */}

                  {/* FORMULÁRIO DE ATUALIZAÇÃO DOS DADOS DOS SLIDES E DO VENDEDOR */}
                  {viewMode !== 'document' && (
                  <div className="space-y-6">
                     {currentSlide === 2 && (
                        <>
                           {/* SEÇÃO 1: DADOS DO CLIENTE E CONTEÚDO */}
                     <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm">
                        <div className="bg-slate-800 -mx-8 -mt-8 px-6 py-4 border-b border-slate-700 rounded-t-2xl mb-6">
                           <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                              📝 Personalizar Conteúdo dos Slides (Dados do Cliente)
                           </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Nome do Cliente</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.cliente || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, cliente: e.target.value}})} 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Nome do Contato</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.contato || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, contato: e.target.value}})} 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Serviços / Escopo da Proposta</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.tipoServicos || ''} 
                                 placeholder="ex: Limpeza e conservação, Portaria"
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: e.target.value}})} 
                              />
                           </div>
                        </div>
                     </div>

                     {/* SEÇÃO 2: DADOS DO VENDEDOR */}
                     <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm">
                        <div className="bg-[#1B4D3E] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                           <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                              👤 Personalizar Dados do Emissor / Vendedor Comercial
                           </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Nome do Vendedor</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.vendedorNome || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, vendedorNome: e.target.value}})} 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Cargo / Departamento</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.vendedorCargo || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, vendedorCargo: e.target.value}})} 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">Telefone / WhatsApp</label>
                              <input 
                                 type="text" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.vendedorTelefone || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, vendedorTelefone: e.target.value}})} 
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700">E-mail Comercial</label>
                              <input 
                                 type="email" 
                                 className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] font-medium" 
                                 value={proposta.cliente.vendedorEmail || ''} 
                                 onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, vendedorEmail: e.target.value}})} 
                              />
                           </div>
                        </div>
                     </div>
                        </>
                     )}

                     {currentSlide === 8 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1e4480] -mx-8 -mt-8 px-6 py-4 border-b border-[#16325e] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               ⚙️ Objeto & Escopo Técnico (Slide 8)
                            </h3>
                         </div>
                         
                         <div className="space-y-4">
                            <div>
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Objeto da Proposta</label>
                               <textarea 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold min-h-[80px] resize-none"
                                  value={proposta.cliente.objetoProposta}
                                  onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, objetoProposta: e.target.value}})}
                               />
                            </div>
                            <div className="flex items-center gap-2 py-2">
                               <input 
                                  type="checkbox" 
                                  id="hasEscopoTecnicoSlide"
                                  className="rounded text-[#1e4480] focus:ring-[#1e4480]"
                                  checked={proposta.cliente.hasEscopoTecnico}
                                  onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, hasEscopoTecnico: e.target.checked}})}
                               />
                               <label htmlFor="hasEscopoTecnicoSlide" className="text-xs font-bold text-slate-600">Inserir Escopo Técnico</label>
                            </div>
                            {proposta.cliente.hasEscopoTecnico && (
                               <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Escopo Técnico Detalhado</label>
                                  <textarea 
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold min-h-[120px]"
                                     value={proposta.cliente.escopoTecnico || ''}
                                     onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, escopoTecnico: e.target.value}})}
                                     placeholder="Descreva aqui de forma detalhada o escopo técnico a ser executado..."
                                  />
                               </div>
                            )}
                         </div>
                      </div>
                     )}

                     {currentSlide === 9 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1e4480] -mx-8 -mt-8 px-6 py-4 border-b border-[#16325e] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               📋 Personalizar Quadro Efetivo & Observações (Slide 09)
                            </h3>
                         </div>
                         
                         {/* SEÇÃO 1: INTEGRANTES DO QUADRO EFETIVO (LEITURA) */}
                         <div className="space-y-4 border-b border-slate-100 pb-6 mb-6">
                            <div>
                               <h4 className="text-xs font-black text-[#1e4480] uppercase tracking-wider flex items-center gap-1.5">
                                  👥 Integrantes do Quadro Efetivo (Visualização)
                               </h4>
                               <p className="text-slate-500 text-[10px] font-semibold mt-1">
                                  ℹ️ Estes itens são importados automaticamente da <strong>Aba 4 (Quadro de Equipe)</strong> e não podem ser alterados diretamente neste slide.
                               </p>
                            </div>

                            <div className="overflow-x-auto">
                               <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                                  <thead>
                                     <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                        <th className="px-4 py-2.5">Função</th>
                                        <th className="px-4 py-2.5 text-center w-24">Qtd</th>
                                        <th className="px-4 py-2.5 text-center w-32">Escala</th>
                                        <th className="px-4 py-2.5 text-center w-36">Horário</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {(proposta.equipe || []).map((p: any, idx: number) => (
                                        <tr key={p.id || idx} className="border-b border-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-50/30">
                                           <td className="px-4 py-2.5 font-black text-slate-800">{p.nomeCargo || "Nova Função"}</td>
                                           <td className="px-4 py-2.5 text-center">{p.tipoItem === 'SPOT' ? p.quantidadeDemanda || 0 : p.quantidade || 0}</td>
                                           <td className="px-4 py-2.5 text-center">{p.escala || "Á definir"}</td>
                                           <td className="px-4 py-2.5 text-center">
                                              {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                 ? `${p.parametrosPosto.horarioInicio} às ${p.parametrosPosto.horarioFim}` 
                                                 : '08:00 às 17:00'}
                                           </td>
                                        </tr>
                                     ))}
                                     {(!proposta.equipe || proposta.equipe.length === 0) && (
                                        <tr>
                                           <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic text-xs font-semibold">
                                              Nenhum cargo no Quadro de Equipe.
                                           </td>
                                        </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                         </div>

                         {/* SEÇÃO 2: CLÁUSULAS OPERACIONAIS DINÂMICAS */}
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                               <div>
                                  <h4 className="text-xs font-black text-[#1e4480] uppercase tracking-wider">
                                     📝 Cláusulas & Observações Operacionais
                                  </h4>
                                  <p className="text-slate-500 text-[10px] font-semibold mt-1">
                                     Adicione, remova ou edite as observações e regras operacionais exibidas na base do Slide 09.
                                  </p>
                               </div>
                               <button
                                  type="button"
                                  className="px-3 py-1.5 bg-[#1e4480] hover:bg-[#16325e] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
                                  onClick={() => {
                                     const currentClausulas = proposta.cliente.quadroEfetivoClausulas || [
                                        proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                        proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                        proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                     ];
                                     const newList = [...currentClausulas, 'Nova cláusula ou observação...'];
                                     setProposta({
                                        ...proposta,
                                        cliente: {
                                           ...proposta.cliente,
                                           quadroEfetivoClausulas: newList
                                        }
                                     });
                                  }}
                               >
                                  ➕ Nova Cláusula
                               </button>
                            </div>

                            <div className="space-y-3">
                               {(() => {
                                  const currentClausulas = proposta.cliente.quadroEfetivoClausulas || [
                                     proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                     proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                     proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                  ];
                                  return currentClausulas.map((c: string, idx: number) => (
                                     <div key={idx} className="flex gap-3 items-start bg-slate-50 p-4 border border-slate-200 rounded-xl">
                                        <div className="w-6 h-6 rounded-full bg-[#1e4480] text-white font-black text-xs flex items-center justify-center shrink-0">
                                           {String(idx + 1).padStart(2, '0')}
                                        </div>
                                        <textarea
                                           rows={2}
                                           className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-[#1e4480] font-medium resize-none"
                                           value={c}
                                           onChange={(e) => {
                                              const newList = [...currentClausulas];
                                              newList[idx] = e.target.value;
                                              setProposta({
                                                 ...proposta,
                                                 cliente: {
                                                    ...proposta.cliente,
                                                    quadroEfetivoClausulas: newList
                                                 }
                                              });
                                           }}
                                        />
                                        <button
                                           type="button"
                                           className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0 mt-1"
                                           onClick={() => {
                                              const newList = currentClausulas.filter((_: string, i: number) => i !== idx);
                                              setProposta({
                                                 ...proposta,
                                                 cliente: {
                                                    ...proposta.cliente,
                                                    quadroEfetivoClausulas: newList
                                                 }
                                              });
                                           }}
                                        >
                                           <Trash size={16} />
                                        </button>
                                     </div>
                                  ));
                               })()}
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                               <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtítulo / Título da Tabela</label>
                                  <input 
                                     type="text" 
                                     className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#1e4480] font-semibold" 
                                     value={proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo'} 
                                     onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, quadroEfetivoSubtitulo: e.target.value}})} 
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                     )}
                     {currentSlide === 10 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1B4D3E] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               📋 Personalizar Tabela de Itens Inclusos e Excluídos (Slide 09)
                            </h3>
                         </div>
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                               <p className="text-slate-500 text-xs font-semibold">
                                  Abaixo você pode editar os nomes, descrições e o status de inclusão de cada item exibido no Slide 09. Marque a caixa para definir o item como "Incluso" (Sim) ou desmarque para deixá-lo "Excluído" (Não).
                               </p>
                               <button
                                  type="button"
                                  className="px-3 py-1.5 bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
                                  onClick={() => {
                                     const newId = String(Date.now());
                                     const newItem = { id: newId, descricao: 'Fornecimento de...', incluso: true };
                                     const newList = [...(proposta.itensInclusosExcluidos || []), newItem];
                                     setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                  }}
                               >
                                  ➕ Novo Item
                               </button>
                            </div>
                            <div className="overflow-x-auto">
                               <table className="w-full text-left border-collapse">
                                  <thead>
                                     <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                                        <th className="px-4 py-3 w-28 text-center">Item</th>
                                        <th className="px-4 py-3">Descrição</th>
                                        <th className="px-4 py-3 text-center w-28">Incluso?</th>
                                        <th className="px-4 py-3 text-center w-20">Ações</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                        <tr key={p.id || idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                           <td className="px-4 py-3 flex justify-center">
                                              <div className="w-16 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-black text-center select-none">
                                                 {String(idx + 1).padStart(2, '0')}
                                              </div>
                                           </td>
                                           <td className="px-4 py-3">
                                              <input 
                                                 type="text" 
                                                 className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none focus:border-[#1B4D3E] font-medium"
                                                 value={p.descricao || ''}
                                                 onChange={(e) => {
                                                    const newList = proposta.itensInclusosExcluidos.map((item: any) => 
                                                       item.id === p.id ? { ...item, descricao: e.target.value } : item
                                                    );
                                                    setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                                 }}
                                              />
                                           </td>
                                           <td className="px-4 py-3 text-center">
                                              <input 
                                                 type="checkbox" 
                                                 className="w-4 h-4 text-[#1B4D3E] focus:ring-[#1B4D3E] border-slate-300 rounded cursor-pointer"
                                                 checked={!!p.incluso}
                                                 onChange={(e) => {
                                                    const newList = proposta.itensInclusosExcluidos.map((item: any) => 
                                                       item.id === p.id ? { ...item, incluso: e.target.checked } : item
                                                    );
                                                    setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                                 }}
                                              />
                                           </td>
                                           <td className="px-4 py-3 text-center">
                                              <button
                                                 type="button"
                                                 className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                                 onClick={() => {
                                                    const newList = proposta.itensInclusosExcluidos.filter((item: any) => item.id !== p.id);
                                                    setProposta({ ...proposta, itensInclusosExcluidos: newList });
                                                 }}
                                              >
                                                 <Trash size={16} />
                                              </button>
                                           </td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      </div>
                     )}

                     {currentSlide === 11 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1B4D3E] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               📋 Resumo Comercial da Proposta (Slide 10)
                            </h3>
                         </div>
                         <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-3">
                            <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                               <p className="font-bold mb-1">Cálculo Automático de Valores</p>
                               <p className="leading-relaxed">
                                  Os valores e quantitativos exibidos no Slide 10 são compilados e consolidados em tempo real com base no Quadro de Equipe (Mão de Obra) e nos Insumos (Materiais, Máquinas, Descartáveis, Serviços).
                               </p>
                               <p className="mt-2 font-black">
                                  Para modificar qualquer preço de venda ou quantidade, ajuste as respectivas abas do editor à esquerda.
                               </p>
                            </div>
                         </div>
                      </div>
                     )}

                     {currentSlide === 12 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1e4480] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               ⚙️ Condições Gerais da Proposta (Slide 12)
                            </h3>
                         </div>
                         
                         <div className="space-y-6">
                            {/* Colaboradores */}
                            <div>
                               <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider mb-3">
                                  Condições para os Colaboradores
                                </h4>
                               <div className="space-y-3">
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 1</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoColaboradores1 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoColaboradores1: e.target.value}})}
                                     />
                                  </div>
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 2</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoColaboradores2 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoColaboradores2: e.target.value}})}
                                     />
                                  </div>
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 3</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoColaboradores3 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoColaboradores3: e.target.value}})}
                                     />
                                  </div>
                               </div>
                            </div>

                            {/* Cliente */}
                            <div className="border-t border-slate-150 pt-5">
                               <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider mb-3">
                                  Condições para o Cliente
                               </h4>
                               <div className="space-y-3">
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 1</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoCliente1 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoCliente1: e.target.value}})}
                                     />
                                  </div>
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 2</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoCliente2 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoCliente2: e.target.value}})}
                                     />
                                  </div>
                                  <div>
                                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Condição 3</label>
                                     <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                        value={proposta.cliente.condicaoCliente3 || ''}
                                        onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, condicaoCliente3: e.target.value}})}
                                     />
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                     )}

                     {currentSlide === 12 && (() => {
                        const condsColab = proposta.cliente.condicoesColaboradores || [
                           proposta.cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
                           proposta.cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
                           proposta.cliente.condicaoColaboradores3 || '2 Vales transporte por dia.'
                        ];
                        const condsCli = proposta.cliente.condicoesCliente || [
                           proposta.cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
                           proposta.cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
                           proposta.cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.'
                        ];

                        return (
                           <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                              <div className="bg-[#1e4480] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                                 <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                                    ⚙️ Condições Gerais da Proposta (Slide 11)
                                 </h3>
                              </div>
                              
                              <div className="space-y-6">
                                 {/* Colaboradores */}
                                 <div>
                                    <div className="flex justify-between items-center mb-3">
                                       <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">
                                          Condições para os Colaboradores
                                       </h4>
                                       <button
                                          type="button"
                                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-emerald-200"
                                          onClick={() => {
                                             const newList = [...condsColab, 'Nova condição de colaborador...'];
                                             setProposta({...proposta, cliente: {...proposta.cliente, condicoesColaboradores: newList}});
                                          }}
                                       >
                                          + Adicionar
                                       </button>
                                    </div>
                                    <div className="space-y-2">
                                       {condsColab.map((cond: string, idx: number) => (
                                          <div key={idx} className="flex gap-2 items-center">
                                             <span className="text-[10px] text-slate-400 font-bold shrink-0">{idx + 1}.</span>
                                             <input 
                                                type="text" 
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                                value={cond}
                                                onChange={(e) => {
                                                   const newList = [...condsColab];
                                                   newList[idx] = e.target.value;
                                                   setProposta({...proposta, cliente: {...proposta.cliente, condicoesColaboradores: newList}});
                                                }}
                                             />
                                             <button
                                                type="button"
                                                className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg border border-red-200 transition-colors shrink-0"
                                                onClick={() => {
                                                   const newList = condsColab.filter((_: string, i: number) => i !== idx);
                                                   setProposta({...proposta, cliente: {...proposta.cliente, condicoesColaboradores: newList}});
                                                }}
                                             >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* Cliente */}
                                 <div className="border-t border-slate-150 pt-5">
                                    <div className="flex justify-between items-center mb-3">
                                       <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">
                                          Condições para o Cliente
                                       </h4>
                                       <button
                                          type="button"
                                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors border border-emerald-200"
                                          onClick={() => {
                                             const newList = [...condsCli, 'Nova condição de cliente...'];
                                             setProposta({...proposta, cliente: {...proposta.cliente, condicoesCliente: newList}});
                                          }}
                                       >
                                          + Adicionar
                                       </button>
                                    </div>
                                    <div className="space-y-2">
                                       {condsCli.map((cond: string, idx: number) => (
                                          <div key={idx} className="flex gap-2 items-center">
                                             <span className="text-[10px] text-slate-400 font-bold shrink-0">{idx + 1}.</span>
                                             <input 
                                                type="text" 
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                                value={cond}
                                                onChange={(e) => {
                                                   const newList = [...condsCli];
                                                   newList[idx] = e.target.value;
                                                   setProposta({...proposta, cliente: {...proposta.cliente, condicoesCliente: newList}});
                                                }}
                                             />
                                             <button
                                                type="button"
                                                className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg border border-red-200 transition-colors shrink-0"
                                                onClick={() => {
                                                   const newList = condsCli.filter((_: string, i: number) => i !== idx);
                                                   setProposta({...proposta, cliente: {...proposta.cliente, condicoesCliente: newList}});
                                                }}
                                             >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })()}

                     {currentSlide === 13 && (
                      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm mt-6">
                         <div className="bg-[#1e4480] -mx-8 -mt-8 px-6 py-4 border-b border-[#13382D] rounded-t-2xl mb-6">
                            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                               📝 Informações de Aceite (Slide 13)
                            </h3>
                         </div>
                         
                         <div className="space-y-4">
                            <div>
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Razão Social</label>
                               <input 
                                  type="text" 
                                  placeholder="Preenchido automaticamente ao buscar cliente..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                  value={proposta.cliente.razaoSocial || proposta.cliente.cliente || ''}
                                  onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, razaoSocial: e.target.value}})}
                               />
                            </div>
                            <div>
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">CNPJ</label>
                               <input 
                                  type="text" 
                                  placeholder="Preenchido automaticamente ao buscar cliente..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                  value={proposta.cliente.cnpj || ''}
                                  onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, cnpj: e.target.value}})}
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Início</label>
                                  <input 
                                     type="date" 
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                     value={proposta.cliente.dataInicio || ''}
                                     onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, dataInicio: e.target.value}})}
                                  />
                               </div>
                               <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Vencimento</label>
                                  <input 
                                     type="date" 
                                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                     value={proposta.cliente.dataVencimento || ''}
                                     onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, dataVencimento: e.target.value}})}
                                  />
                               </div>
                            </div>
                            <div className="border-t border-slate-100 pt-4 mt-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cargo do Contato</label>
                               <input 
                                  type="text" 
                                  placeholder="Ex: Diretor Financeiro"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e4480] font-semibold"
                                  value={proposta.cliente.contatoCargo || ''}
                                  onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, contatoCargo: e.target.value}})}
                               />
                            </div>
                         </div>
                      </div>
                     )}
                  </div>
                  )}
                     
                     {/* Floating Controls Dock no Modo Apresentação */}
                     {presentationMode && (
                        <div className="absolute bottom-6 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-[100000] border border-slate-700/50">
                           <button 
                              type="button"
                              onClick={() => setCurrentSlide(prev => (prev === 1 ? 13 : prev - 1))}
                              className="hover:text-emerald-400 font-extrabold text-sm transition-all"
                           >
                              ◀ Anterior
                           </button>
                           <span className="font-extrabold text-xs tracking-widest text-slate-400">
                              SLIDE {String(currentSlide).padStart(2, '0')} / 13
                           </span>
                           <button 
                              type="button"
                              onClick={() => setCurrentSlide(prev => (prev === 13 ? 1 : prev + 1))}
                              className="hover:text-emerald-400 font-extrabold text-sm transition-all"
                           >
                              Próximo ▶
                           </button>
                           <div className="h-4 w-px bg-slate-700" />
                           <button 
                              type="button"
                              onClick={() => setPresentationMode(false)}
                              className="text-rose-400 hover:text-rose-300 font-extrabold text-xs uppercase tracking-wider transition-all"
                           >
                              Sair (ESC) 🚪
                           </button>
                        </div>
                     )}
               </div>
            )}


        </div>
      
         
         {/* ========================================================================= */}
         {/* ESTILOS DE ANIMAÇÃO PARA OS MODAIS ULTRA PREMIUM                          */}
         {/* ========================================================================= */}
         <style>{`
            @keyframes modalFadeIn {
               from { opacity: 0; transform: scale(0.97) translateY(8px); }
               to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-modal-in {
               animation: modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
         `}</style>

         {/* ========================================================================= */}
         {/* MODAL 1: PARAMETROS & JORNADA DO POSTO                                    */}
         {/* ========================================================================= */}
         {(() => {
            if (!activeAdicionaisPostoId) return null;
            const p = proposta.equipe.find((x: any) => x.id === activeAdicionaisPostoId);
            if (!p) return null;
            return (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 transition-all duration-300">
                  <div className="bg-white/95 rounded-2xl border border-slate-100 shadow-[0_25px_60px_-15px_rgba(27,77,62,0.18)] max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-modal-in">
                     {/* Cabeçalho */}
                     <div className="bg-gradient-to-r from-[#1B4D3E] via-[#215E4C] to-[#12362b] text-white p-5 flex items-center justify-between border-b-2 border-emerald-500/20">
                        <div className="flex items-center gap-3">
                           <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                              <span className="text-lg">⚙️</span>
                           </div>
                           <div>
                              <h3 className="font-extrabold text-xs uppercase tracking-widest text-emerald-100/90">Parâmetros & Jornada</h3>
                              <div className="mt-1 flex items-center gap-2">
                                 <span className="bg-[#D4AF37]/15 text-[#e5c158] border border-[#D4AF37]/35 text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                                    Posto: {p.nomeCargo}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => setActiveAdicionaisPostoId(null)}
                           className="text-white/80 hover:text-white transition-all p-2 rounded-xl hover:bg-white/10 active:scale-95"
                        >
                           <X size={18} />
                        </button>
                     </div>

                     {/* Conteúdo */}
                     <div className="p-6 overflow-y-auto space-y-6">
                        {/* Grid 1: Adicionais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periculosidade</label>
                              <select 
                                 className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all duration-200" 
                                 value={p.parametrosPosto?.periculosidade ? 'SIM' : 'NAO'} 
                                 onChange={(e) => {
                                    const param = {...p.parametrosPosto, periculosidade: e.target.value === 'SIM'};
                                    updatePosto(p.id, 'parametrosPosto', param);
                                 }}
                              >
                                 <option value="NAO">Não</option>
                                 <option value="SIM">Sim (30%)</option>
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Insalubridade (%)</label>
                              <select 
                                 className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all duration-200" 
                                 value={p.parametrosPosto?.insalubridadePercent || 0} 
                                 onChange={(e) => {
                                    const param = {...p.parametrosPosto, insalubridadePercent: (e.target.value === '' ? '' : Number(e.target.value))};
                                    updatePosto(p.id, 'parametrosPosto', param);
                                 }}
                              >
                                 <option value={0}>0%</option>
                                 <option value={10}>10% (Mínimo)</option>
                                 <option value={20}>20% (Médio)</option>
                                 <option value={40}>40% (Máximo)</option>
                              </select>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horas Noturnas (Mês)</label>
                              <input 
                                 type="number" 
                                 className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all duration-200" 
                                 value={p.parametrosPosto?.adicionalNoturnoHoras || 0} 
                                 onChange={(e) => {
                                    const param = {...p.parametrosPosto, adicionalNoturnoHoras: (e.target.value === '' ? '' : Number(e.target.value))};
                                    updatePosto(p.id, 'parametrosPosto', param);
                                 }} 
                              />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Intrajornada (Horas/Mês)</label>
                              <input 
                                 type="number" 
                                 className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all duration-200" 
                                 value={p.parametrosPosto?.intrajornadaHoras || 0} 
                                 onChange={(e) => {
                                    const param = {...p.parametrosPosto, intrajornadaHoras: (e.target.value === '' ? '' : Number(e.target.value))};
                                    updatePosto(p.id, 'parametrosPosto', param);
                                 }} 
                              />
                           </div>

                           <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DSR s/ Adicionais (%)</label>
                              <input 
                                 type="number" 
                                 step="0.01"
                                 className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none hover:border-slate-300 focus:bg-white focus:border-[#1B4D3E] focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all duration-200" 
                                 value={p.parametrosPosto?.dsrPercent || 0} 
                                 onChange={(e) => {
                                    const param = {...p.parametrosPosto, dsrPercent: (e.target.value === '' ? '' : Number(e.target.value))};
                                    updatePosto(p.id, 'parametrosPosto', param);
                                 }} 
                              />
                           </div>
                        </div>

                        {/* Seção de Jornada */}
                        <div className="bg-[#F8FAFC]/80 border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
                           <h4 className="text-xs font-extrabold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                              <span>📅</span> Horários & Dias Trabalhados
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horário de Início</label>
                                 <input 
                                    type="time" 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] transition-all" 
                                    value={p.parametrosPosto?.horarioInicio || '08:00'} 
                                    onChange={(e) => {
                                       const hInicio = e.target.value;
                                       const hFim = p.parametrosPosto?.horarioFim || '17:00';
                                       const dias = p.parametrosPosto?.diasTrabalhadosMes || 22;
                                       const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                       const param = {...p.parametrosPosto, horarioInicio: hInicio, adicionalNoturnoHoras: noturnoAuto};
                                       updatePosto(p.id, 'parametrosPosto', param);
                                    }} 
                                 />
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horário de Saída</label>
                                 <input 
                                    type="time" 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] transition-all" 
                                    value={p.parametrosPosto?.horarioFim || '17:00'} 
                                    onChange={(e) => {
                                       const hFim = e.target.value;
                                       const hInicio = p.parametrosPosto?.horarioInicio || '08:00';
                                       const dias = p.parametrosPosto?.diasTrabalhadosMes || 22;
                                       const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                       const param = {...p.parametrosPosto, horarioFim: hFim, adicionalNoturnoHoras: noturnoAuto};
                                       updatePosto(p.id, 'parametrosPosto', param);
                                    }} 
                                 />
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dias Trab. / Mês</label>
                                 <input 
                                    type="number" 
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E] transition-all" 
                                    value={p.parametrosPosto?.diasTrabalhadosMes || 22} 
                                    onChange={(e) => {
                                       const dias = (e.target.value === '' ? '' : Number(e.target.value));
                                       const hInicio = p.parametrosPosto?.horarioInicio || '08:00';
                                       const hFim = p.parametrosPosto?.horarioFim || '17:00';
                                       const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                       const param = {...p.parametrosPosto, diasTrabalhadosMes: dias, adicionalNoturnoHoras: noturnoAuto};
                                       updatePosto(p.id, 'parametrosPosto', param);
                                    }} 
                                 />
                              </div>
                           </div>

                           <div className="bg-emerald-50/50 text-[#1B4D3E] p-4 rounded-xl text-xs font-bold border border-emerald-100/50 flex items-center justify-between shadow-xs">
                              <span className="flex items-center gap-1.5 text-emerald-950 font-bold">⏰ Cálculo automático de adicionais:</span>
                              <span className="bg-[#1B4D3E] text-white px-3 py-1 rounded-lg font-black text-xs shadow-sm">
                                 {p.parametrosPosto?.adicionalNoturnoHoras || 0}h / mês
                              </span>
                           </div>
                        </div>
                     </div>

                     {/* Rodapé */}
                     <div className="bg-[#F8FAFC] px-6 py-4.5 flex justify-end border-t border-slate-100/60 rounded-b-2xl">
                        <button 
                           onClick={() => setActiveAdicionaisPostoId(null)}
                           className="bg-gradient-to-r from-[#1B4D3E] to-[#12362b] hover:from-[#153a2f] hover:to-[#0f2a22] text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(27,77,62,0.25)] hover:shadow-[0_6px_20px_rgba(27,77,62,0.35)] active:scale-[0.98] cursor-pointer"
                        >
                           <Save size={14} /> Fechar & Salvar
                        </button>
                     </div>
                  </div>
               </div>
            );
         })()}

         {/* ========================================================================= */}
         {/* MODAL 2: EPIS & UNIFORMES ADICIONAIS DO POSTO                              */}
         {/* ========================================================================= */}
         {(() => {
            if (!activeEpisPostoId) return null;
            const p = proposta.equipe.find((x: any) => x.id === activeEpisPostoId);
            if (!p) return null;
            return (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 transition-all duration-300">
                  <div className="bg-white/95 rounded-2xl border border-slate-100 shadow-[0_25px_60px_-15px_rgba(27,77,62,0.18)] max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-modal-in">
                     {/* Cabeçalho */}
                     <div className="bg-gradient-to-r from-[#1B4D3E] via-[#215E4C] to-[#12362b] text-white p-5 flex items-center justify-between border-b-2 border-emerald-500/20">
                        <div className="flex items-center gap-3">
                           <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                              <span className="text-lg">🛡️</span>
                           </div>
                           <div>
                              <h3 className="font-extrabold text-xs uppercase tracking-widest text-emerald-100/90">EPIs & Uniformes Especiais</h3>
                              <div className="mt-1 flex items-center gap-2">
                                 <span className="bg-[#D4AF37]/15 text-[#e5c158] border border-[#D4AF37]/35 text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                                    Posto: {p.nomeCargo}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <button 
                           onClick={() => setActiveEpisPostoId(null)}
                           className="text-white/80 hover:text-white transition-all p-2 rounded-xl hover:bg-white/10 active:scale-95"
                        >
                           <X size={18} />
                        </button>
                     </div>

                     {/* Conteúdo */}
                     <div className="p-6 overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                              Cadastre itens adicionais específicos para este posto
                           </p>
                           <button 
                              onClick={() => {
                                 const epis = p.parametrosPosto?.episAdicionais || [];
                                 const param = {...p.parametrosPosto, episAdicionais: [...epis, { id: Math.random().toString(), descricao: '', quantidade: 1, precoUnitario: 0, vidaUtil: 6 }]};
                                 updatePosto(p.id, 'parametrosPosto', param);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100/80 text-[#1B4D3E] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-100/50 shadow-xs hover:shadow-sm"
                           >
                              <Plus size={14} /> Inserir Item
                           </button>
                        </div>

                        {(p.parametrosPosto?.episAdicionais || []).length > 0 ? (
                           <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-xs bg-white">
                              <table className="w-full text-xs">
                                 <thead className="bg-[#F8FAFC] text-slate-400 uppercase text-[9px] tracking-wider font-extrabold border-b border-slate-100">
                                    <tr>
                                       <th className="px-5 py-3 text-left">Descrição do Item</th>
                                       <th className="px-5 py-3 text-center w-24">Qtd</th>
                                       <th className="px-5 py-3 text-center w-36">Preço Unitário</th>
                                       <th className="px-5 py-3 text-center w-32">Vida Útil (meses)</th>
                                       <th className="px-5 py-3 text-right w-36">Custo / Mês</th>
                                       <th className="px-5 py-3 text-center w-16"></th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {p.parametrosPosto.episAdicionais.map((epi: any, epiIdx: number) => (
                                       <tr key={epi.id || epiIdx} className="hover:bg-[#F8FAFC]/40 transition-colors">
                                          <td className="px-5 py-3">
                                             <input 
                                                type="text" 
                                                className="w-full bg-slate-50/40 border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#1B4D3E] focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all" 
                                                placeholder="Ex: Roupa Térmica p/ Câmara Fria"
                                                value={epi.descricao}
                                                onChange={(e) => {
                                                   const newEpis = [...p.parametrosPosto.episAdicionais];
                                                   newEpis[epiIdx].descricao = e.target.value;
                                                   updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                }}
                                             />
                                          </td>
                                          <td className="px-5 py-3">
                                             <input 
                                                type="number" 
                                                className="w-full bg-slate-50/40 border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:bg-white focus:border-[#1B4D3E] outline-none transition-all" 
                                                value={epi.quantidade}
                                                onChange={(e) => {
                                                   const newEpis = [...p.parametrosPosto.episAdicionais];
                                                   newEpis[epiIdx].quantidade = (e.target.value === '' ? '' : Number(e.target.value));
                                                   updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                }}
                                             />
                                          </td>
                                          <td className="px-5 py-3">
                                             <div className="relative">
                                                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">R$</span>
                                                <input 
                                                   type="number" 
                                                   step="0.01"
                                                   className="w-full bg-slate-50/40 border border-slate-200/60 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:bg-white focus:border-[#1B4D3E] outline-none transition-all" 
                                                   value={epi.precoUnitario}
                                                   onChange={(e) => {
                                                      const newEpis = [...p.parametrosPosto.episAdicionais];
                                                      newEpis[epiIdx].precoUnitario = (e.target.value === '' ? '' : Number(e.target.value));
                                                      updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                   }}
                                                />
                                             </div>
                                          </td>
                                          <td className="px-5 py-3">
                                             <input 
                                                type="number" 
                                                className="w-full bg-slate-50/40 border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-center focus:bg-white focus:border-[#1B4D3E] outline-none transition-all" 
                                                value={epi.vidaUtil}
                                                onChange={(e) => {
                                                   const newEpis = [...p.parametrosPosto.episAdicionais];
                                                   newEpis[epiIdx].vidaUtil = (e.target.value === '' ? '' : Number(e.target.value));
                                                   updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                }}
                                             />
                                          </td>
                                          <td className="px-5 py-3 text-right font-black text-[#1B4D3E] text-xs">
                                             R$ {((epi.precoUnitario * epi.quantidade) / (epi.vidaUtil || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-5 py-3 text-center">
                                             <button 
                                                onClick={() => {
                                                   const newEpis = p.parametrosPosto.episAdicionais.filter((_: any, i: number) => i !== epiIdx);
                                                   updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                }}
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Excluir EPI"
                                             >
                                                <Trash2 size={15} />
                                             </button>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        ) : (
                           <div className="bg-[#F8FAFC] border border-dashed border-slate-200 rounded-2xl py-12 text-center">
                              <p className="text-sm text-slate-400 font-medium italic">Nenhum EPI ou uniforme especial adicionado a este posto.</p>
                              <p className="text-xs text-slate-300 mt-1.5">Clique em "Inserir Item" no canto superior direito para começar.</p>
                           </div>
                        )}
                     </div>

                     {/* Rodapé */}
                     <div className="bg-[#F8FAFC] px-6 py-4.5 flex justify-between items-center border-t border-slate-100/60 rounded-b-2xl">
                        <div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Custo Total Especial</span>
                           <span className="text-base font-black text-[#1B4D3E]">
                              R$ {((p.parametrosPosto?.episAdicionais || []).reduce((acc: number, item: any) => acc + ((item.precoUnitario * item.quantidade) / (item.vidaUtil || 1)), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ mês</span>
                           </span>
                        </div>
                        <button 
                           onClick={() => setActiveEpisPostoId(null)}
                           className="bg-gradient-to-r from-[#1B4D3E] to-[#12362b] hover:from-[#153a2f] hover:to-[#0f2a22] text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(27,77,62,0.25)] hover:shadow-[0_6px_20px_rgba(27,77,62,0.35)] active:scale-[0.98] cursor-pointer"
                        >
                           <Save size={14} /> Fechar & Salvar
                        </button>
                     </div>
                  </div>
               </div>
            );
         })()}

      
         
         {/* MODAL NOVO TIPO SERVICO */}
         {showNewTipoModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-300">
                  <div className="bg-[#1B4D3E] px-4 py-3 flex justify-between items-center">
                     <h2 className="text-white text-xs font-bold uppercase flex items-center gap-2"><Plus size={14}/> Novo Tipo de Serviço</h2>
                     <button onClick={() => setShowNewTipoModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={16}/></button>
                  </div>
                  <div className="p-4 space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Nome do Tipo</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] text-slate-800" value={newTipoName} onChange={e => setNewTipoName(e.target.value)} placeholder="Ex: Limpeza Comercial" autoFocus />
                     </div>
                     <button disabled={isSavingTipo} onClick={handleSaveTipoServico} className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold py-2 rounded text-sm transition-colors shadow-sm disabled:opacity-50">
                        {isSavingTipo ? 'Salvando...' : 'Salvar Tipo'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO SEGMENTO */}
         {showNewSegmentoModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-300">
                  <div className="bg-[#1B4D3E] px-4 py-3 flex justify-between items-center">
                     <h2 className="text-white text-xs font-bold uppercase flex items-center gap-2"><Plus size={14}/> Novo Segmento</h2>
                     <button onClick={() => setShowNewSegmentoModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={16}/></button>
                  </div>
                  <div className="p-4 space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Nome do Segmento</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] text-slate-800" value={newSegmentoName} onChange={e => setNewSegmentoName(e.target.value)} placeholder="Ex: Condomínios" autoFocus />
                     </div>
                     <button disabled={isSavingSegmento} onClick={handleSaveSegmento} className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold py-2 rounded text-sm transition-colors shadow-sm disabled:opacity-50">
                        {isSavingSegmento ? 'Salvando...' : 'Salvar Segmento'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO CLIENTE */}
         {showNewClientModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-modal-in">
                  <div className="bg-[#1B4D3E] text-white p-4 flex justify-between items-center">
                     <h3 className="font-bold text-sm uppercase tracking-wider">Cadastrar Novo Cliente</h3>
                     <button onClick={() => setShowNewClientModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Fantasia *</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.nomeFantasia} onChange={e => setNewClientForm({...newClientForm, nomeFantasia: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Razão Social</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.razaoSocial} onChange={e => setNewClientForm({...newClientForm, razaoSocial: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.cnpj} onChange={e => setNewClientForm({...newClientForm, cnpj: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Comercial</label>
                        <input type="email" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.email} onChange={e => setNewClientForm({...newClientForm, email: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Celular / WhatsApp</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.whatsapp} onChange={e => setNewClientForm({...newClientForm, whatsapp: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contato (Responsável)</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.contato} onChange={e => setNewClientForm({...newClientForm, contato: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Segmento</label>
                        <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newClientForm.segmento} onChange={e => setNewClientForm({...newClientForm, segmento: e.target.value})}>
                           <option value="" className="text-slate-800 bg-white">Selecione...</option>
                           {segmentos.map((s) => <option key={s.id} value={s.nome} className="text-slate-800 bg-white">{s.nome}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                     <button onClick={() => setShowNewClientModal(false)} className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                     <button onClick={handleSaveNewClient} disabled={savingClient} className="px-4 py-2 rounded text-sm font-bold bg-[#1B4D3E] text-white hover:bg-[#12362b] disabled:opacity-50">
                        {savingClient ? 'Salvando...' : 'Salvar Cliente'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO PRODUTO */}
         {showNewProductModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-modal-in">
                  <div className="bg-[#1B4D3E] text-white p-4 flex justify-between items-center">
                     <h3 className="font-bold text-sm uppercase tracking-wider">Cadastrar Novo Produto</h3>
                     <button onClick={() => setShowNewProductModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição *</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newProductForm.descricao} onChange={e => setNewProductForm({...newProductForm, descricao: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Unitário (R$)</label>
                           <input type="number" step="0.01" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newProductForm.precoUnitario} onChange={e => setNewProductForm({...newProductForm, precoUnitario: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Unidade</label>
                           <input type="text" placeholder="Ex: UN, KG, M" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newProductForm.unidade} onChange={e => setNewProductForm({...newProductForm, unidade: e.target.value})} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                        <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none bg-white text-slate-800" value={newProductForm.categoria} onChange={e => setNewProductForm({...newProductForm, categoria: e.target.value})}>
                           <option value="Geral" className="text-slate-800 bg-white">Geral</option>
                           <option value="MATERIAL DE LIMPEZA" className="text-slate-800 bg-white">Material de Limpeza</option>
                           <option value="DESCARTAVEIS" className="text-slate-800 bg-white">Descartáveis</option>
                           <option value="MAQUINAS E EQUIPAMENTOS" className="text-slate-800 bg-white">Máquinas e Equipamentos</option>
                           <option value="EPI" className="text-slate-800 bg-white">EPI</option>
                           <option value="UNIFORME">Uniforme</option>
                        </select>
                     </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                     <button onClick={() => setShowNewProductModal(false)} className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                     <button onClick={handleSaveNewProduct} disabled={savingProduct} className="px-4 py-2 rounded text-sm font-bold bg-[#1B4D3E] text-white hover:bg-[#12362b] disabled:opacity-50">
                        {savingProduct ? 'Salvando...' : 'Salvar Produto'}
                     </button>
                  </div>
               </div>
            </div>
         )}


         {/* MODAL DE ESCOLHA DE SALVAMENTO (EDIÇÃO) */}
      {showSaveChoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#1B4D3E]/5 border border-[#1B4D3E]/10 rounded-2xl flex items-center justify-center text-[#1B4D3E] mb-6 shadow-sm">
                <Save size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Como deseja salvar?</h3>
              <p className="text-sm text-slate-500 mb-8 px-2 font-medium">
                Escolha se esta alteração deve gerar uma nova revisão da proposta ou sobrescrever a versão atual.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => executeSave('Atualização na mesma revisão', false)}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-[#1B4D3E]/30 hover:bg-[#1B4D3E]/5 hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-slate-100 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-500 group-hover:text-[#1B4D3E] shadow-sm">
                  <Save size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-[#1B4D3E] mb-0.5">Salvar mesma Versão</h4>
                  <p className="text-xs text-slate-500">Sobrescreve a revisão atual sem criar histórico</p>
                </div>
              </button>

              <button
                onClick={() => {
                   setShowSaveChoiceModal(false);
                   setShowChangelogModal(true);
                }}
                className="w-full text-left p-4 rounded-2xl border border-[#1B4D3E]/10 bg-[#1B4D3E]/5 hover:border-[#1B4D3E]/30 hover:bg-[#1B4D3E]/10 hover:shadow-md transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-white/50 group-hover:bg-white rounded-xl flex items-center justify-center text-[#1B4D3E] shadow-sm">
                  <History size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1B4D3E] mb-0.5">Salvar Nova Versão</h4>
                  <p className="text-xs text-[#1B4D3E]/70">Cria a Revisão R{String((proposta.versao || 1) + 1).padStart(2, '0')} com histórico de mudanças</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setShowSaveChoiceModal(false)}
              className="mt-8 w-full py-3 px-4 font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all tracking-wider"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* MODAL OBRIGATÓRIO DE CHANGELOG PARA REVISÕES */}
      {showChangelogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                <History size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Descrever Alterações da Versão</h2>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Como você está salvando a <strong className="text-amber-600 font-extrabold">Revisão R${String(proposta.versao + 1).padStart(2, '0')}</strong>, descreva de forma clara e obrigatória o que foi alterado nesta versão para fins de histórico.
              </p>
            </div>
            
            <div className="mt-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Resumo das Mudanças</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E] focus:border-[#1B4D3E] focus:bg-white transition-all resize-none h-32"
                placeholder="Ex: Ajuste na taxa tributária da DRE, aumento do percentual de férias dos colaboradores, correção de insumos de limpeza..."
                value={changelogText}
                onChange={(e) => setChangelogText(e.target.value)}
              />
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Mínimo 5 caracteres</span>
                <span className={`text-[10px] font-extrabold uppercase ${changelogText.trim().length >= 5 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {changelogText.trim().length} caracteres
                </span>
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => {
                  setShowChangelogModal(false);
                  setChangelogText('');
                }}
                disabled={saving}
                className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors border border-slate-200/60 active:scale-[0.98] cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => executeSave(changelogText.trim(), true)}
                disabled={saving || changelogText.trim().length < 5}
                className="flex-1 py-3.5 bg-[#1B4D3E] hover:bg-[#13382d] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(27,77,62,0.2)]"
              >
                {saving ? 'Salvando...' : 'Salvar Versão'}
              </button>
            </div>
          </div>
        </div>
      )}

<div className={`print-slide-deck hidden ${viewMode === 'slide' ? 'print:block' : ''}`}>
                     {/* SLIDE 01 PRINT - CAPA COMERCIAL */}
                     <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#020617] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                        {/* Imagem de Fundo Nativa HTML para Garantir Renderização */}
                        <img 
                           src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200" 
                           alt="Capa Fundo" 
                           className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 filter blur-[0.5px]"
                        />
                        {/* Overlay Azul */}
                        <div className="absolute inset-0 bg-[#1e4480]/85 backdrop-blur-[1px]"></div>
                        
                        <div className="relative z-20 flex flex-col justify-center items-center h-full w-full space-y-12">
                           <div className="flex flex-col items-center space-y-4">
                              <img 
                                 src={companyLogo} 
                                 alt="Silva Consultoria Logo" 
                                 className="max-h-32 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                              />
                              <div className="text-[11px] font-black tracking-[0.3em] text-white/90 uppercase pl-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">FACILITIES</div>
                           </div>
                           <div className="w-full max-w-2xl border-2 border-white rounded-full bg-white/10 px-12 py-4 shadow-xl backdrop-blur-md text-center">
                              <span className="text-white text-base font-black tracking-[0.25em] uppercase">
                                 PROPOSTA COMERCIAL
                              </span>
                           </div>
                        </div>
                        <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                           <div className="flex justify-start gap-16 text-white/70 text-[10px] font-extrabold uppercase tracking-wider">
                              <div className="space-y-1">
                                 <div>Cliente: <strong className="text-white">{proposta.cliente.cliente || "Nome do Cliente"}</strong></div>
                                 <div>Nº Proposta: <strong className="text-white">{proposta.cliente.numeroProposta || "FPV-XXXX"}</strong></div>
                              </div>
                              <div className="space-y-1">
                                 <div>Data: <strong className="text-white">
                                    {proposta.cliente.dataElaboracao 
                                       ? new Date(proposta.cliente.dataElaboracao + 'T12:00:00').toLocaleDateString('pt-BR') 
                                       : new Date().toLocaleDateString('pt-BR')}
                                 </strong></div>
                                 <div>Revisão: <strong className="text-white">{proposta.cliente.revisao || "R01"}</strong></div>
                              </div>
                           </div>
                           <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">01</span>
                        </div>
                     </div>

                     {/* SLIDE 02 PRINT - MENSAGEM COMERCIAL */}
                     <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                        {/* Stripes de fundo */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                           <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                           <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                           <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                           <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                           <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                           <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                        </svg>
                        
                        <div className="grid grid-cols-12 gap-8 items-center h-full relative z-10">
                           <div className="col-span-8 flex flex-col justify-center space-y-6 pr-4">
                              <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tight leading-none">
                                 Olá, {proposta.cliente.contato || "Karin"}!
                              </h2>
                              <div className="text-slate-600 text-xs leading-relaxed space-y-4 font-medium">
                                 <p>
                                    O desenvolvimento deste projeto teve como base as informações reunidas por meio da visita técnica realizada, com o objetivo de corresponder, da forma mais eficaz possível, às necessidades do <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> no que se refere aos serviços de <strong className="font-extrabold text-slate-800">{proposta.cliente.tipoServicos || proposta.cliente.objetoProposta || "Limpeza e conservação"}</strong>.
                                 </p>
                                 <p className="font-semibold text-slate-700">
                                    Estamos imensamente gratos desde já pela oportunidade!
                                 </p>
                              </div>
                              <div className="space-y-4">
                                 <span className="text-xs font-bold text-slate-500 block">Att,</span>
                                 <div className="bg-[#2B547E] text-white px-5 py-3 rounded-2xl inline-flex flex-col space-y-0.5 shadow-md max-w-sm">
                                    <span className="text-sm font-black tracking-tight">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                    <span className="text-[10px] text-slate-200/80 font-bold uppercase tracking-wider">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                    <span className="text-[10px] text-slate-200/80 font-bold">{proposta.cliente.vendedorTelefone || "(41) 9 9737-0880"}</span>
                                    <span className="text-[10px] text-slate-200/80 font-bold truncate">{proposta.cliente.vendedorEmail || "contato@silvaconsultoria.com.br"}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="col-span-4 flex flex-col justify-center items-center pl-8 border-l border-slate-100 h-full">
                              <img 
                                 src={companyLogo} 
                                 alt="Silva Consultoria" 
                                 className="max-h-24 w-auto object-contain mb-4"
                              />
                              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">FACILITIES</div>
                           </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                           <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">02</span>
                        </div>
                     </div>

                     
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                         </svg>

                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                               <div>
                                  <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                     QUEM SOMOS
                                  </h2>
                                  <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                     Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                  </p>
                               </div>

                               <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Award size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Anos de atuação em Facilities
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <MapPin size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap"><strong className="text-xl font-black">+100</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        postos ativos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Users size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Clientes atendidos
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <ShieldCheck size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+100</strong> mil m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de limpeza em altura
                                     </span>
                                  </div>

                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Sparkles size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[11px] font-bold text-white leading-none whitespace-nowrap block w-full text-center"><strong className="text-base font-black">+500</strong> mil m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de Pisos tratados
                                     </span>
                                  </div>
                               </div>
                            </div>

                            <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                               <div style={{ width: '280px', height: '280px' }} className="relative drop-shadow-lg flex items-center justify-center">
                                  <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                               </div>
                               <div className="text-[11px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1 rounded-full shadow-sm">
                                  Atendimento em toda Região Sul
                               </div>
                            </div>
                         </div>

                         <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                         </div>
                      </div>

                      {/* SLIDE 04 PRINT - NOSSOS VALORES */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                               <div>
                                  <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                     NOSSOS VALORES
                                  </h2>
                                  <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5 text-justify">
                                     Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
                                  </p>
                               </div>
                            </div>

                            <div className="col-span-5 h-full w-full flex items-center justify-center relative">

                               <div className="relative w-full h-[220px] z-20">
                                  <img 
                                     src="/hand-support.png" 
                                     alt="Mão de suporte"
                                     className="absolute right-[-10px] bottom-[-85px] w-[320px] h-auto pointer-events-none opacity-90 z-0 mix-blend-multiply"
                                  />
                                  <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                     <Trophy size={36} className="text-white shrink-0" />
                                  </div>

                                  <div className="absolute bottom-[100px] left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                     <Lightbulb size={36} className="text-white shrink-0" />
                                  </div>

                                  <div className="absolute bottom-[100px] right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105">
                                     <Users size={36} className="text-white shrink-0" />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                         </div>
                      </div>

                      {/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between">
                            <div>
                               <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-6">
                                  PRINCIPAIS SERVIÇOS PRESTADOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight max-w-[300px]">
                                           TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                              <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                              <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                              <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organização de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um espaço eficiente, seguro e bem cuidado.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3">
                                     <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                                        <span className="text-[#1e4480] text-[15px] font-black tracking-wide uppercase leading-tight">
                                           LIMPEZA EM ALTURA
                                        </span>
                                        <div className="text-[#1e4480] shrink-0">
                                           <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 shrink-0">
                                              <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                              <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                              <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                              <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                              <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                              <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                           </svg>
                                        </div>
                                     </div>
                                     <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                        <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                        <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                        <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                        <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                        <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     LIMPEZA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                        <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                        <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                        <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                        <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                        <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                        <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                        <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     PORTARIA
                                  </span>
                                </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                        <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                        <circle cx="42" cy="22" r="5" fill="currentColor" />
                                        <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                        <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                        <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                        <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     RECEPÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                        <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                        <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                        <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                        <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     MANUTENÇÃO
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-[#1e4480] text-white w-20 h-20 flex items-center justify-center rounded-full shadow-xl">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
                                        <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                        <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                        <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                        <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                        <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                        <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="32" cy="38" r="2" fill="#eab308" />
                                     </svg>
                                  </div>
                                  <span className="text-[#1e4480] text-[12px] font-black tracking-wider uppercase mt-2.5">
                                     JARDINAGEM
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                         </div>
                      </div>

                      {/* SLIDE 06 PRINT - SETORES ATENDIDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>
                         
                         <div className="relative z-10 flex flex-col h-[calc(100%-30px)] justify-between text-white">
                            <div>
                               <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-6">
                                  SETORES ATENDIDOS
                               </h2>

                               <div className="grid grid-cols-2 gap-12 mt-2">
                                  <div className="flex flex-col space-y-3">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              INDÚSTRIA
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Factory size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Com processos minuciosos e detalhados, o setor industrial trouxe para o escopo da Silva Consultoria a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da indústria.
                                     </p>
                                  </div>

                                  <div className="flex flex-col space-y-3 pl-2">
                                     <div className="flex flex-col border-b border-white/20 pb-2">
                                        <div style={{ width: '48px', height: '4px', backgroundColor: 'white', marginBottom: '8px' }}></div>
                                        <div className="flex items-center justify-between gap-4">
                                           <span className="text-white text-[15px] font-black tracking-wide uppercase leading-tight">
                                              VAREJO
                                           </span>
                                           <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                              <Store size={22} className="stroke-[2.5]" />
                                           </div>
                                        </div>
                                     </div>
                                     <p className="text-white/90 text-[14px] font-semibold leading-relaxed mt-2 text-justify">
                                        Um dos setores com maior participação em nossa carteira de clientes, o varejo exigiu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram in constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                                     </p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-around items-center w-full pt-4 mt-auto border-t border-white/20 relative z-20">
                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Bus size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     TRANSPORTE<br />E LOGÍSTICA
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Building size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[110px] leading-tight">
                                     CONDOMÍNIOS<br />E EDIFÍCIOS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <Hospital size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     CLÍNICAS E<br />HOSPITAIS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <ShoppingBag size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[100px] leading-tight">
                                     SHOPPING<br />CENTERS
                                  </span>
                               </div>

                               <div className="flex flex-col items-center justify-center">
                                  <div className="bg-white text-[#1e4480] shadow-xl w-14 h-14 flex items-center justify-center rounded-full">
                                     <GraduationCap size={22} className="stroke-[2]" />
                                  </div>
                                  <span className="text-white text-[11px] font-black tracking-wider uppercase mt-2.5 text-center max-w-[120px] leading-tight">
                                     ESTABELECIMENTOS<br />EDUCACIONAIS
                                  </span>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.smartbidhub.com.br</span>
                            <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                         </div>
                      </div>

                      {/* {/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white grid grid-cols-2 relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Metade Esquerda (Branca) */}
                         <div className="col-span-1 bg-white p-16 flex flex-col justify-between relative h-full border-r border-slate-100">
                            {/* Stripes de fundo */}
                            <svg className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                               <line x1="-50" y1="150" x2="150" y2="-50" stroke="#1e4480" strokeWidth="10" />
                               <line x1="-50" y1="200" x2="200" y2="-50" stroke="#1e4480" strokeWidth="6" />
                               <line x1="-50" y1="250" x2="250" y2="-50" stroke="#1e4480" strokeWidth="3" />
                            </svg>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                               <div>
                                  <h2 className="text-3xl font-black text-[#1e4480] uppercase tracking-tight leading-none mb-8">
                                     PRINCIPAIS<br />
                                     FERRAMENTAS
                                  </h2>
                               </div>
                               
                               <div className="space-y-6 my-auto">
                                  {/* Bitrix24 */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                        <Share2 size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">BITRIX24</h3>
                                        <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                           CRM, armazenamento de dados e documentos, gestão de resultados, planejamento estratégico.
                                        </p>
                                        <div className="pt-2 flex items-center gap-1 select-none">
                                           <span className="text-[#00A4E4] font-black text-sm tracking-tight">Bitrix</span>
                                           <span className="text-[#435560] font-black text-sm tracking-tight">24</span>
                                           <div className="w-3.5 h-3.5 rounded-full border-2 border-[#00A4E4] flex items-center justify-center text-[7px] text-[#00A4E4] font-black ml-0.5">L</div>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Secullum */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-[#1e4480]/10 p-2 rounded-xl text-[#1e4480] shrink-0 mt-1">
                                        <Clock size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">SECULLUM</h3>
                                        <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed">
                                           Controle de ponto digital, envio e assinatura de holerites e documentos administrativos, controle e gestão de turnover.
                                        </p>
                                        <div className="pt-2 flex flex-col select-none">
                                           <div className="flex items-center gap-1">
                                              <Award size={14} className="text-amber-500 shrink-0" />
                                              <span className="text-slate-700 font-black text-xs tracking-tight lowercase">secullum</span>
                                           </div>
                                           <span className="text-slate-400 text-[7px] font-bold pl-5 leading-none">Ser fácil para ser humano.</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="pt-4 border-t border-slate-100 flex items-center text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                  <span>www.smartbidhub.com.br</span>
                                </div>
                            </div>
                         </div>
                         
                         {/* Metade Direita (Azul) */}
                         <div className="col-span-1 bg-[#1e4480] p-16 flex flex-col justify-between relative h-full text-white">
                            {/* Stripes de fundo */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                               <line x1="150" y1="400" x2="400" y2="150" stroke="#FFFFFF" strokeWidth="10" />
                               <line x1="200" y1="400" x2="450" y2="150" stroke="#FFFFFF" strokeWidth="6" />
                               <line x1="250" y1="400" x2="500" y2="150" stroke="#FFFFFF" strokeWidth="3" />
                            </svg>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                               <div className="h-12"></div>
                               
                               <div className="space-y-4 my-auto">
                                  {/* Nexus Operacional (IA Core - Destaque Principal) */}
                                  <div className="flex gap-4 items-start border-b border-white/10 pb-3">
                                     <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-1 border border-emerald-500/30">
                                        <Cpu size={20} className="stroke-[2.5] animate-pulse" />
                                     </div>
                                     <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                           <h3 className="text-white text-xs font-black tracking-wider uppercase">NEXUS OPERACIONAL</h3>
                                           <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[7px] px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase">IA CORE</span>
                                        </div>
                                        <p className="text-white/80 text-[8px] font-semibold leading-relaxed">
                                           Mesa de operação inteligente baseada em IA, otimizando agendamentos de frotas, distribuição de escalas e monitoramento de services em tempo real.
                                        </p>
                                        <div className="pt-1 flex items-center gap-1 select-none">
                                           <span className="text-emerald-400 font-black text-xs tracking-tight">Nexus</span>
                                           <span className="text-white font-extrabold text-xs tracking-tight">Operacional</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Onvio */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                        <User size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-white text-xs font-black tracking-wider uppercase">ONVIO</h3>
                                        <p className="text-white/80 text-[8.5px] font-semibold leading-relaxed">
                                           Registro e gestão de documentação de funcionários.
                                        </p>
                                        <div className="pt-1.5 flex flex-col select-none">
                                           <span className="text-orange-400/80 text-[6px] font-extrabold tracking-widest uppercase">THOMSON REUTERS</span>
                                           <span className="text-orange-500 font-black text-sm tracking-tight leading-none mt-0.5">ONVIO</span>
                                        </div>
                                     </div>
                                  </div>
                                  
                                  {/* Check-List Fácil */}
                                  <div className="flex gap-4 items-start">
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 mt-1">
                                        <Smartphone size={20} className="stroke-[2.5]" />
                                     </div>
                                     <div className="space-y-1">
                                        <h3 className="text-white text-xs font-black tracking-wider uppercase">CHECK-LIST FÁCIL</h3>
                                        <p className="text-white/80 text-[8.5px] font-semibold leading-relaxed">
                                           Plataforma digital de desenvolvimento e gestão de processos internos com registro fotográfico, SLA's etc.
                                        </p>
                                        <div className="pt-1.5 flex items-center gap-1 select-none text-[#10B981]">
                                           <span className="text-sm font-black tracking-tight flex items-center gap-1">✔ checklistfácil</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="pt-4 border-t border-white/20 flex justify-between items-center text-white/60 text-[9px] font-bold">
                                  <span className="uppercase tracking-widest">www.smartbidhub.com.br</span>
                                  <span className="text-white/80 bg-white/10 px-2.5 py-0.5 rounded font-black">07</span>
                               </div>
                            </div>
                         </div>
                      </div>

{/* SLIDE 08 PRINT - OBJETO E ESCOPO TÉCNICO */}
                       <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                          {/* Linhas diagonais decorativas da marca */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                             <line x1="-50" y1="150" x2="350" y2="-250" stroke="#1e4480" strokeWidth="10" />
                             <line x1="-50" y1="200" x2="400" y2="-250" stroke="#1e4480" strokeWidth="6" />
                             <line x1="-50" y1="250" x2="450" y2="-250" stroke="#1e4480" strokeWidth="3" />
                             
                             <line x1="600" y1="800" x2="1100" y2="300" stroke="#1e4480" strokeWidth="10" />
                             <line x1="650" y1="800" x2="1150" y2="300" stroke="#1e4480" strokeWidth="6" />
                             <line x1="700" y1="800" x2="1200" y2="300" stroke="#1e4480" strokeWidth="3" />
                          </svg>

                          <div className="relative z-10 flex flex-col h-full justify-between">
                             {/* Header */}
                             <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                                <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase">
                                   OBJETO & ESCOPO TÉCNICO
                                </h2>
                                <img 
                                   src={companyLogo} 
                                   alt="Silva Consultoria Logo" 
                                   className="max-h-10 w-auto object-contain"
                                />
                             </div>

                             {/* Content Area */}
                             <div className="my-auto w-full max-w-5xl mx-auto">
                                {proposta.cliente.hasEscopoTecnico ? (
                                   <div className="grid grid-cols-2 gap-12 items-stretch">
                                      {/* Left: Objeto da Proposta */}
                                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                                         <div>
                                            <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-3">01. OBJETO DA PROPOSTA</span>
                                            <p className="text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line">
                                               {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                            </p>
                                         </div>
                                      </div>

                                      {/* Right: Escopo Técnico */}
                                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                                         <div>
                                            <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-3">02. ESCOPO TÉCNICO</span>
                                            <p className="text-sm font-semibold leading-relaxed text-slate-700 whitespace-pre-line overflow-y-auto max-h-[220px]">
                                               {proposta.cliente.escopoTecnico || 'Detalhamento das atividades operacionais conforme solicitação e cronograma alinhado.'}
                                            </p>
                                         </div>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/80 rounded-2xl p-10 text-center shadow-sm">
                                      <span className="text-[12px] font-black text-[#1e4480] uppercase tracking-widest block mb-4">OBJETO DA PROPOSTA</span>
                                      <p className="text-base font-bold leading-relaxed text-slate-700 whitespace-pre-line">
                                         {proposta.cliente.objetoProposta || proposta.cliente.tipoServicos || 'Prestação de serviços especializados de limpeza, conservação e facilities.'}
                                      </p>
                                   </div>
                                )}
                             </div>

                             {/* Footer */}
                             <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto text-slate-400 text-[9px] font-bold">
                                <span className="uppercase tracking-widest">www.smartbidhub.com.br</span>
                                <span className="text-[#1e4480] bg-slate-100 px-2.5 py-0.5 rounded font-black">08</span>
                             </div>
                          </div>
                       </div>

                       
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="flex flex-col justify-between h-full relative z-10 w-full">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                               <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-[#1e4480] text-center py-3">
                                     <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                  </div>
                                  <div className="flex-1">
                                     <table className="w-full text-left border-collapse">
                                        <thead>
                                           <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                              <th className="px-5 py-3">Função</th>
                                              <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                              <th className="px-5 py-3 text-center w-28">Escala</th>
                                              <th className="px-5 py-3 text-center w-36">Horário</th>
                                           </tr>
                                        </thead>
                                        <tbody>
                                           {proposta.equipe && proposta.equipe.length > 0 ? (
                                              proposta.equipe.map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                                    <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                    <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.tipoItem === 'SPOT' ? p.quantidadeDemanda || 0 : p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                    <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                       {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                          ? `${p.parametrosPosto.horarioInicio} às ${p.parametrosPosto.horarioFim}` 
                                                          : '08:00 às 17:00'}
                                                    </td>
                                                 </tr>
                                              ))
                                           ) : (
                                              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                 <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">Nenhum posto de trabalho inserido.</td>
                                              </tr>
                                           )}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>

                               <div className="col-span-4 flex flex-col justify-center">
                                  <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                     <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                        <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                     </div>
                                     <div className="space-y-3">
                                        {(() => {
                                           const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                              proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                              proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                              proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                           ];
                                           return clausulas.map((c: string, cIdx: number) => (
                                              <div key={cIdx} className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">{c}</p>
                                              </div>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUSÍDOS</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto">
                               <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                     <thead>
                                        <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                           <th className="px-6 py-3.5 w-32">Item</th>
                                           <th className="px-6 py-3.5">Descrição</th>
                                           <th className="px-6 py-3.5 text-center w-40">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                           <tr key={p.id || idx} className={`border-b border-slate-100 text-[10px] font-bold text-slate-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                              <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                              <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                              <td className="px-6 py-3.5 text-center">
                                                 {p.incluso ? (
                                                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                       <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                       </svg>
                                                    </div>
                                                 ) : (
                                                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                       <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                       </svg>
                                                    </div>
                                                 )}
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}
                      {(() => {
                         const fc = formatCurrency;
                         const divisorTributos = resultado?.divisor || 1;
                         const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                         const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                         
                         const applyCascata = (custo: any) => {
                           const cD = Number(custo) || 0;
                           const comAdm = cD * (1 + txAdm);
                           const comLucro = comAdm * (1 + txLucro);
                           return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                         };

                         const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                         const insumosSubtotal = applyCascata(
                           Number(proposta.insumos.materiais || 0) + 
                           Number(proposta.insumos.maquinas || 0) + 
                           Number(proposta.insumos.descartaveis || 0) + 
                           Number(proposta.insumos.servicos || 0)
                         );

                         const renderInsumoRow = (label: string, value: number) => {
                            const isZero = value === 0;
                            return (
                               <tr key={label} className={`border-b border-slate-100 ${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}`}>
                                  <td className="py-3 px-4 font-semibold">{label}</td>
                                  <td className={`py-3 px-4 text-right font-black ${isZero ? 'text-slate-300' : 'text-slate-800'}`}>
                                     {isZero ? '-' : fc(value)}
                                  </td>
                               </tr>
                            );
                         };

                         return (
                            <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                     </div>
                                     <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                                  </div>

                                  <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                                     <div className="col-span-7 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col justify-between">
                                        <table className="w-full text-left border-collapse text-[10px]">
                                           <thead>
                                              <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                                 <th className="py-3.5 px-4">Grupo de Custo</th>
                                                 <th className="py-3.5 px-4 text-right">Valor Mensal</th>
                                              </tr>
                                           </thead>
                                           <tbody>
                                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                                 <td className="py-3.5 px-4 font-black">Mão de Obra Efetiva (Postos)</td>
                                                 <td className="py-3.5 px-4 text-right font-black text-[#1e4480]">{fc(maoDeObraSubtotal)}</td>
                                              </tr>
                                              {renderInsumoRow('Materiais e Equipamentos', applyCascata(Number(proposta.insumos.materiais || 0) + Number(proposta.insumos.maquinas || 0)))}
                                              {renderInsumoRow('Descartáveis e Higiene', applyCascata(Number(proposta.insumos.descartaveis || 0)))}
                                              {renderInsumoRow('Outros Serviços / Operações', applyCascata(Number(proposta.insumos.servicos || 0)))}
                                           </tbody>
                                        </table>
                                        
                                        <div className="bg-slate-50 border-t border-slate-150 p-4 flex justify-between items-center mt-auto">
                                           <span className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Valor Total Mensal Proposto</span>
                                           <span className="text-lg font-black text-[#1b4d3e] bg-emerald-50 border border-emerald-250 px-4 py-1.5 rounded-xl shadow-xs">
                                              {fc(maoDeObraSubtotal + insumosSubtotal)}
                                           </span>
                                        </div>
                                     </div>

                                     <div className="col-span-5 flex flex-col justify-center">
                                        <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                           <div className="flex items-center gap-2 border-b border-slate-255 pb-2">
                                              <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                              <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Premissas do Investimento</h4>
                                           </div>
                                           <div className="space-y-3.5">
                                              <div className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Os valores propostos contemplam todos os encargos sociais, tributos (PIS, COFINS, ISS), taxas de administração e insumos descritos na proposta;</p>
                                              </div>
                                              <div className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">Faturamento mensal com vencimento a ser pactuado nas condições gerais da contratação, emitido após a prestação dos serviços.</p>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}

                      {/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            
                                   {(() => {
                                      const condsColab = [
                                         proposta.cliente?.condicaoColaboradores1 || "Vale alimentação de R$900,00;",
                                         proposta.cliente?.condicaoColaboradores2 || "Cesta trimestral de assiduidade;",
                                         proposta.cliente?.condicaoColaboradores3 || "2 Vales transporte por dia."
                                      ].filter(Boolean);

                                      const condsCli = [
                                         proposta.cliente?.condicaoCliente1 || "Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;",
                                         proposta.cliente?.condicaoCliente2 || "Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;",
                                         proposta.cliente?.condicaoCliente3 || "Próximo reajuste Fevereiro/2026."
                                      ].filter(Boolean);

                                      return (
                                         <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-2 gap-x-8 gap-y-4">
                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <Calendar size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Prazos e Validade</h4>
                                               </div>
                                               <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Validade da Proposta:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.validadeProposta || "15 (quinze) dias"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Prazo de Início dos Serviços:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.prazoInicio || "20 (vinte) dias"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] pb-0.5">
                                                     <span className="text-slate-500 font-bold">Vigência Contratual Mínima:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.vigenciaContratual || "12 (doze) meses"}</span>
                                                  </div>
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <CreditCard size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Faturamento e Reajuste</h4>
                                               </div>
                                               <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Prazo de Pagamento:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.prazoPagamento || "30 dias líquido"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-100/50 pb-1.5">
                                                     <span className="text-slate-500 font-bold">Base de Reajuste Anual:</span>
                                                     <span className="text-slate-800 font-black">{proposta.condicoes?.baseReajuste || "Convenção Coletiva (CCT) / IPCA"}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[10px] pb-0.5">
                                                     <span className="text-slate-500 font-bold">Garantias e Seguros:</span>
                                                     <span className="text-[#1b4d3e] font-black uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 text-[9px]">Inclusos e Ativos</span>
                                                  </div>
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <UserCheck size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições dos Colaboradores</h4>
                                               </div>
                                               <div className="space-y-1">
                                                  {condsColab.map((cond, idx) => (
                                                     <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                        {cond}
                                                     </div>
                                                  ))}
                                               </div>
                                            </div>

                                            <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-3">
                                               <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                                                  <Briefcase size={16} className="text-[#1e4480]" />
                                                  <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Condições para o Cliente</h4>
                                               </div>
                                               <div className="space-y-1">
                                                  {condsCli.map((cond, idx) => (
                                                     <div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                        {cond}
                                                     </div>
                                                  ))}
                                               </div>
                                            </div>
                                         </div>
                                      );
                                   })()}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                            </div>
                         </div>
                      </div>

                      {/* SLIDE 13 PRINT - ACEITE */}
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-center w-full pb-4 border-b border-white/20">
                               <div className="flex flex-col">
                                  <span className="text-white/70 text-[10px] font-black tracking-[0.2em] uppercase">SILVA CONSULTORIA</span>
                                  <h2 className="text-xl font-black text-white uppercase tracking-tight">TERMO DE ACEITE E CONTRATAÇÃO</h2>
                               </div>
                               <img src={companyLogo} alt="Silva Logo" className="max-h-10 w-auto object-contain" />
                            </div>

                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-center text-white">
                               <div className="col-span-6 space-y-4">
                                  <h3 className="text-lg font-black tracking-tight leading-snug">Estamos prontos para iniciar a nossa parceria de sucesso!</h3>
                                  <div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                     <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                     <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.razaoSocial || proposta.cliente.cliente || "Não informada"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                           <span className="text-white font-bold">{proposta.cliente.cnpj || "Não informado"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataInicio || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataVencimento || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Cargo do Contato / Representante</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.contatoCargo || "Representante Legal"}</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="col-span-6 grid grid-cols-2 gap-4">
                                  <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATANTE</span>
                                        <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">{proposta.cliente.cliente || "Erasto Gaertner"}</span>
                                     </div>
                                     <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                        <div className="h-6 w-full mb-1"></div>
                                        <span className="text-[9px] font-black text-white">Assinatura / Carimbo</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">Representante Legal</span>
                                     </div>
                                  </div>

                                  <div className="bg-white/10 rounded-2xl p-5 border border-white/15 shadow-md flex flex-col justify-between h-40">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/90">CONTRATADA</span>
                                        <span className="text-[8.5px] text-white/70 font-semibold mt-1 truncate">Silva Consultoria Empresarial LTDA</span>
                                     </div>
                                     <div className="border-t border-white/30 pt-3 mt-auto flex flex-col text-center">
                                        <div className="h-6 w-full mb-1 flex items-center justify-center">
                                           <span className="text-[8px] text-emerald-300 font-extrabold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/35 uppercase select-none">Assinado Digitalmente</span>
                                        </div>
                                        <span className="text-[9px] font-black text-white">{proposta.cliente.vendedorNome || "Ádamo Quadros"}</span>
                                        <span className="text-[8px] text-white/50 font-bold uppercase mt-0.5">{proposta.cliente.vendedorCargo || "Novos Negócios"}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.smartbidhub.com.br</span>
                               <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded">13</span>
                            </div>
                         </div>
                      </div>

                   </div>
</main>
    </div>
  );
}

export default function NovaPropostaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PropostaEditor />
    </Suspense>
  );
}
