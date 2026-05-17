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
import { saveProposta, getPropostaCompleta } from '@/app/propostas/actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Drill, Trash } from 'lucide-react';

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
            cidade: fullData.cliente.cidade || '',
            dataElaboracao: fullData.cliente.dataElaboracao || '',
            numeroProposta: (fullData as any).numero || '',
            revisao: `R${String(fullData.versao).padStart(2, '0')}`,
            tipoServicos: fullData.cliente.tipoServicos || ''
          },
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
  const [escalasDb, setEscalasDb] = useState<any[]>([]);
  const [produtosDb, setProdutosDb] = useState<any[]>([]);
  const [clientesList, setClientesList] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [proposta, setProposta] = useState<any>({
    id: null,
    cliente: { cliente: '', cidade: '', dataElaboracao: '', numeroProposta: '', revisao: '', tipoServicos: '', contato: '', celular: '', email: '', objetoProposta: '', sindicatoId: '' },
    premissas: { 
      taxaAdm: 5, 
      margemLucro: 10,
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
    }
  });

  const [resultado, setResultado] = useState<any>(null);
  const [activeAdicionaisPostoId, setActiveAdicionaisPostoId] = useState<string | null>(null);
  const [activeEpisPostoId, setActiveEpisPostoId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        console.log('Iniciando carregamento do Editor FPV...');
        setLoading(true);
        const [dataCcts, dataEscalas, dataProdutos] = await Promise.all([getCCTs(), getEscalas(), getProdutos()]);
        setCcts(dataCcts || []);
        setEscalasDb(dataEscalas || []);
        setProdutosDb(dataProdutos || []);
        console.log('CCTs e Escalas carregadas.');
        
        const { getClientes } = await import('@/app/clientes/actions');
        const clientesData = await getClientes();
        setClientesList(clientesData || []);
        console.log('Clientes carregados:', clientesData?.length || 0);

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
                 sindicatoId: savedSindicatoId,
                 contato: fullData.cliente.contato || '',
                 celular: fullData.cliente.celular || '',
                 email: fullData.cliente.email || '',
                 objetoProposta: fullData.cliente.objetoProposta || '',
                 cidade: fullData.cliente.cidade || '',
                 dataElaboracao: fullData.cliente.dataElaboracao || '',
                 numeroProposta: (fullData as any).numero || '',
                 revisao: `R${String(fullData.versao).padStart(2, '0')}`,
                 tipoServicos: fullData.cliente.tipoServicos || ''
               },
               premissas: {
                 ...fullData.premissas,
                 tributos: Array.isArray(fullData.premissas.tributos) ? fullData.premissas.tributos : []
               },
               equipe: (fullData.equipe || []).map((e: any) => ({
                  ...e,
                  showConfig: false,
                  cctBase: (dataCcts || []).find((c: any) => c.id === savedSindicatoId) || {}
               })),
               versao: fullData.versao,
               insumos: (fullData as any).insumos || { materiais: 0, maquinas: 0, descartaveis: 0, servicos: 0, servicosDescricao: '' }
            });
            setVersions(fullData.availableVersions || []);
            console.log('Estado da proposta atualizado.');
          } else {
             console.warn('Proposta não encontrada no banco.');
          }
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

      const calcInput = {
        items: proposta.equipe,
        impostos: { total: totalTributos },
        margens: { adm: proposta.premissas.taxaAdm, lucro: proposta.premissas.margemLucro },
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
  }, [proposta, totalTributos, ccts]);

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

  const calculateAutoNoturno = (hInicio: string, hFim: string, diasMes: number) => {
    if (!hInicio || !hFim) return 0;
    
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

  const handleSave = async () => {
    if (!proposta.cliente.cliente) return alert('Por favor, selecione ou informe o cliente.');
    if (proposta.equipe.length === 0) return alert('Adicione ao menos um posto no quadro de equipe.');

    try {
      setSaving(true);
      const res = await saveProposta({ ...proposta, resultado });
      if (res.success) {
        alert(`Sucesso! Proposta ${proposta.id ? 'atualizada' : 'salva'} como Revisão ${res.versao}.`);
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
          }
        });
        const updatedData = await getPropostaCompleta(res.propostaId);
        if (updatedData) setVersions(updatedData.availableVersions || []);
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
 
  const normalizeText = (text: string) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

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
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Adicionar Item da Tabela de Produtos</label>
            <select 
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-[#1B4D3E]"
              value=""
              onChange={(e) => {
                const prod = produtosDb.find(p => p.id === e.target.value);
                if (prod) addInsumoItem(tipo, prod);
              }}
            >
              <option value="">Selecione um produto para adicionar...</option>
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
                  <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(item.precoUnitario)}</td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold outline-none focus:border-[#1B4D3E]"
                      value={item.quantidade}
                      onChange={(e) => updateInsumoItem(tipo, item.id, 'quantidade', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold outline-none focus:border-[#1B4D3E]"
                      value={item.vidaUtil}
                      onChange={(e) => updateInsumoItem(tipo, item.id, 'vidaUtil', Number(e.target.value))}
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
                       <td className="py-2 px-4 text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                       <td className="py-2 px-4 text-right w-24">
                          <div className="flex items-center justify-end gap-1">
                             <input type="number" step="0.01" className="w-16 bg-white border border-slate-300 text-right font-medium text-slate-800 focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] outline-none rounded px-1 py-0.5" value={val} onChange={(e) => setDados({...dados, [key]: Number(e.target.value)})} />
                             <span className="text-slate-500">%</span>
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
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 ml-4">
                    <History size={16} className="text-slate-500" />
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
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
               {id && versions.length <= 1 && (
                 <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-medium">Revisão {proposta.versao}</span>
               )}
               {!id && (
                 <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium">Nova Proposta</span>
               )}
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
        <div className="w-full max-w-7xl mb-8 border-b border-slate-200 pb-2">
           <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {TABS.map((tab) => (
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
                    {tab.label}
                 </button>
              ))}
           </nav>
        </div>

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
                    <div className="space-y-1 relative">
                       <label className="text-xs font-semibold text-slate-700">Cliente (Buscar Cadastrado)</label>
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
                                            cidade: c.cidade || '',
                                            email: c.email || '',
                                            celular: c.whatsapp || '',
                                            contato: c.contato || ''
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
                           <option value="">Selecione o Sindicato...</option>
                           {ccts.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.nome} ({c.uf})</option>
                           ))}
                        </select>
                     </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Tipo dos Serviços</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.tipoServicos} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Contato / Responsável</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.contato} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, contato: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Celular / WhatsApp</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.celular} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, celular: e.target.value}})} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                       <label className="text-xs font-semibold text-slate-700">E-mail Comercial</label>
                       <input type="email" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.email} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, email: e.target.value}})} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Objeto da Proposta</label>
                       <textarea className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] resize-none min-h-[80px]" value={proposta.cliente.objetoProposta} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, objetoProposta: e.target.value}})}></textarea>
                    </div>
                 </div>
              </div>
           )}

           {/* ABA 2: TAXAS E TRIBUTOS */}
           {activeTab === 'premissas' && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-md border border-slate-300 shadow-sm flex flex-col gap-2">
                       <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Taxa Administrativa (%)</label>
                       <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-lg font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={proposta.premissas.taxaAdm} onChange={(e) => setProposta({...proposta, premissas: {...proposta.premissas, taxaAdm: Number(e.target.value)}})} />
                    </div>
                    <div className="bg-white p-6 rounded-md border border-slate-300 shadow-sm flex flex-col gap-2">
                       <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Margem de Lucro (%)</label>
                       <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-lg font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={proposta.premissas.margemLucro} onChange={(e) => setProposta({...proposta, premissas: {...proposta.premissas, margemLucro: Number(e.target.value)}})} />
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
                                   const newT = proposta.premissas.tributos.map((x: any) => x.id === t.id ? {...x, percent: Number(e.target.value)} : x);
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
                             <th className="px-6 py-3 w-16 text-center">Qtd.</th>
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
                                      <input type="number" className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={p.quantidade} onChange={(e) => updatePosto(p.id, 'quantidade', Number(e.target.value))} />
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
                                         <option value="">Selecione a Função...</option>
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
                                         <option value="">Selecione a Escala...</option>
                                         {escalasDb.map(esc => (
                                            <option key={esc.id} value={esc.nome}>{esc.nome}</option>
                                         ))}
                                      </select>
                                   </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end items-center gap-2.5">
                                          <button 
                                             onClick={() => setActiveAdicionaisPostoId(p.id)}
                                             className="px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:border-[#1B4D3E] hover:bg-emerald-50/30 text-slate-700 hover:text-[#1B4D3E] font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-[0.97]"
                                             title="Configurar Adicionais e Jornada"
                                          >
                                             <span>⚙️</span> Adicionais
                                          </button>
                                          
                                          <button 
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
           )}
            {activeTab === 'materiais' && renderInsumosTab('detalheMateriais', ['MATERIAIS E INSUMO', 'PRODUTOS E INSUMOS', 'MATERIAIS', 'INSUMOS', 'PRODUTOS DE LIMPEZA'], 'Materiais e Produtos de Limpeza')}
            {activeTab === 'maquinas' && renderInsumosTab('detalheMaquinas', ['EQUIPAMENTOS LOCADO', 'EQUIPAMENTOS DEPRECIADOS', 'MAQUINAS', 'EQUIPAMENTOS'], 'Máquinas e Equipamentos')}
            {activeTab === 'descartaveis' && renderInsumosTab('detalheDescartaveis', ['DESCARTÁVEIS', 'DESCARTAVEIS'], 'Descartáveis')}

            {/* ABA 5: EXTRATO (100% IGUAL AO PRINT - PLANILHA DE CUSTOS) */}
           {activeTab === 'extrato' && (
              <div className="w-full bg-white border border-[#1B4D3E] shadow-xl text-xs rounded overflow-hidden print:border-none print:shadow-none">
                 
                 {/* CABEÇALHO PLANILHA */}
                 <div className="bg-[#1B4D3E] text-white flex justify-center items-center px-6 py-4 border-b border-white">
                    <h2 className="font-bold uppercase text-xl tracking-widest">Planilha de Custos</h2>
                 </div>

                 <table className="w-full text-left border-collapse">
                    <thead>
                       {/* MONTANTE A */}
                       <tr className="bg-[#1B4D3E] text-white border-b border-white/20">
                          <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "A" - Mão-de-obra</th>
                       </tr>
                       <tr className="bg-slate-100 font-bold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                          <th className="py-2 px-6 w-[50%]">1) Função</th>
                          <th className="py-2 px-6 text-center">Qtd.</th>
                          <th className="py-2 px-6 text-right">Custo Unit</th>
                          <th className="py-2 px-6 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody>
                       {proposta.equipe.map((p: any, idx: number) => {
                          const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                          const custoUnitario = itemRes?.detalhes?.remuneracao || 0;
                          const totalLinha = custoUnitario * p.quantidade;
                          return (
                             <tr key={idx} className="border-b border-slate-200 border-dotted hover:bg-slate-50">
                                <td className="py-1.5 px-6 font-semibold text-slate-800">{p.nomeCargo}</td>
                                <td className="py-1.5 px-6 text-center font-bold">{p.quantidade}</td>
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

                           const rows = [
                              { label: '1) Uniformes e EPI\'s', val: b.ativos },
                              { label: '2) Materiais e produtos de limpeza', val: proposta.insumos.materiais },
                              { label: '3) Máquinas e equipamentos', val: proposta.insumos.maquinas },
                              { label: '4) Descartáveis', val: proposta.insumos.descartaveis },
                              { label: '5) Serviços (Descriminar)', val: proposta.insumos.servicos },
                           ];

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
                                 proposta.insumos.maquinas + 
                                 proposta.insumos.descartaveis + 
                                 proposta.insumos.servicos
                              )}
                           </td>
                        </tr>

                        {/* MONTANTE C */}
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
                               { label: '11) Outros (especificar)', val: b.outros },
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
                                                    className="w-14 bg-white border border-slate-300 text-right px-1 py-0.5 rounded outline-none focus:border-[#1B4D3E]"
                                                    value={(proposta.premissas as any)[row.field]}
                                                    onChange={(e) => {
                                                       const val = Number(e.target.value);
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
                        <tr className="bg-[#599e41] text-white font-bold border-y border-[#488234]">
                           <td colSpan={3} className="py-2.5 px-6 text-right uppercase tracking-wider">Total dos Montantes "A+B+C+D"</td>
                           <td className="py-2.5 px-6 text-right">
                              {formatCurrency((resultado?.custoDiretoTotal || 0) + (resultado?.taxaAdm || 0) + (resultado?.margemLucro || 0))}
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
                        <tr className="bg-black text-white font-black border-t border-slate-800 text-xs tracking-widest uppercase">
                           <td colSpan={3} className="py-4 px-6 text-right">Valor Total Anual do Contrato</td>
                           <td className="py-4 px-6 text-right text-emerald-500">
                              {formatCurrency((resultado?.faturamentoBruto || 0) * 12)}
                           </td>
                        </tr>
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
                      <table className="w-full text-left border-collapse text-xs">
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
                              const precoUnitario = p.quantidade > 0 ? precoVendaItem / p.quantidade : 0;
                              return (
                                <tr key={p.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                  <td className="px-4 py-2 text-center font-bold text-slate-500">{idx + 1}</td>
                                  <td className="px-4 py-2 font-semibold text-slate-800">{p.nomeCargo}</td>
                                  <td className="px-4 py-2 text-center font-bold">{p.quantidade}</td>
                                  <td className="px-4 py-2 text-right text-slate-700">{fc(precoUnitario)}</td>
                                  <td className="px-4 py-2 text-right font-semibold bg-emerald-50">{fc(precoVendaItem)}</td>
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
                      <table className="w-full text-left border-collapse text-xs">
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
                              {fc(applyCascata(proposta.insumos.maquinas))}
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
                              Serviços {proposta.insumos.servicosDescricao ? `(${proposta.insumos.servicosDescricao})` : ''}
                            </td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.servicos))}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-700 text-white font-black">
                            <td colSpan={2} className="px-6 py-2.5 text-right uppercase tracking-wider text-xs">Subtotal Materiais e Insumos (Preço de Venda Final)</td>
                            <td className="px-6 py-2.5 text-right text-emerald-300">
                              {fc(applyCascata(
                                Number(proposta.insumos.materiais || 0) + 
                                Number(proposta.insumos.maquinas || 0) + 
                                Number(proposta.insumos.descartaveis || 0) + 
                                Number(proposta.insumos.servicos || 0)
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

           {/* ABA 7: DRE */}
           {activeTab === 'dre' && (
              <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden overflow-x-auto">
                 <div className="bg-[#1B4D3E] px-6 py-4">
                    <h2 className="text-white text-sm font-bold uppercase tracking-wider">DRE - Demonstrativo de Resultados</h2>
                 </div>
                 <table className="w-full text-[10px] border-collapse">
                    <thead>
                       <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider border-b border-slate-300">
                          <th className="p-4 text-left font-bold">Indicador</th>
                          {MONTHS.map(m => <th key={m} className="p-4 text-right font-semibold">{m}</th>)}
                          <th className="p-4 text-right bg-emerald-50 text-[#1B4D3E] font-bold">ANUAL</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr className="border-b border-slate-200 hover:bg-slate-50"><td className="p-4 font-bold text-slate-800">Receita Bruta</td>{MONTHS.map(m => <td key={m} className="p-4 text-right text-slate-700">{formatCurrency(resultado?.faturamentoBruto || 0)}</td>)}<td className="p-4 text-right font-bold bg-emerald-50 text-[#1B4D3E]">{formatCurrency((resultado?.faturamentoBruto || 0) * 12)}</td></tr>
                       <tr className="border-b border-slate-200 hover:bg-slate-50"><td className="p-4 font-bold text-slate-800">Impostos</td>{MONTHS.map(m => <td key={m} className="p-4 text-right text-red-600">-{formatCurrency(resultado?.impostosTotais || 0)}</td>)}<td className="p-4 text-right font-bold bg-red-50 text-red-700">-{formatCurrency((resultado?.impostosTotais || 0) * 12)}</td></tr>
                       <tr className="border-b border-slate-200 hover:bg-slate-50"><td className="p-4 font-bold text-slate-800">Custos Diretos (A+B+C)</td>{MONTHS.map(m => <td key={m} className="p-4 text-right text-slate-700">-{formatCurrency(resultado?.custoDiretoTotal || 0)}</td>)}<td className="p-4 text-right font-bold bg-slate-100">-{formatCurrency((resultado?.custoDiretoTotal || 0) * 12)}</td></tr>
                       <tr className="bg-emerald-50"><td className="p-4 font-bold text-[#1B4D3E]">Margem Operacional (Lucro)</td>{MONTHS.map(m => <td key={m} className="p-4 text-right font-bold text-[#1B4D3E]">{formatCurrency(resultado?.margemBruta || 0)}</td>)}<td className="p-4 text-right font-bold bg-[#1B4D3E] text-emerald-400">{formatCurrency((resultado?.margemBruta || 0) * 12)}</td></tr>
                    </tbody>
                 </table>
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
                                    const param = {...p.parametrosPosto, insalubridadePercent: Number(e.target.value)};
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
                                    const param = {...p.parametrosPosto, adicionalNoturnoHoras: Number(e.target.value)};
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
                                    const param = {...p.parametrosPosto, intrajornadaHoras: Number(e.target.value)};
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
                                    const param = {...p.parametrosPosto, dsrPercent: Number(e.target.value)};
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
                                       const dias = Number(e.target.value);
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
                                                   newEpis[epiIdx].quantidade = Number(e.target.value);
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
                                                      newEpis[epiIdx].precoUnitario = Number(e.target.value);
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
                                                   newEpis[epiIdx].vidaUtil = Number(e.target.value);
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
