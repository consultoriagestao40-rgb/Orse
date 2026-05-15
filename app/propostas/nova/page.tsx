'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Building2, TrendingUp, ShieldCheck, UserCheck, 
  FileText, PieChart, Save, Plus, Trash2, ClipboardList,
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
  { id: 'maquinas', label: '6. MÃ¡quinas', icon: Drill },
  { id: 'descartaveis', label: '7. DescartÃ¡veis', icon: Trash },
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
      console.error('Erro ao trocar versÃ£o:', err);
      alert('Erro ao carregar versÃ£o selecionada.');
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
            
            // Fallback para propostas antigas: Se nÃ£o houver sindicatoId no meta, pega do primeiro cargo
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
             console.warn('Proposta nÃ£o encontrada no banco.');
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
        
        // SÃºmula 60 TST: ProrrogaÃ§Ã£o se trabalhou todo o perÃ­odo noturno
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
        alert(`Sucesso! Proposta ${proposta.id ? 'atualizada' : 'salva'} como RevisÃ£o ${res.versao}.`);
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
                <th className="px-4 py-2 w-20">CÃ³d.</th>
                <th className="px-4 py-2">DescriÃ§Ã£o</th>
                <th className="px-4 py-2 text-right">PreÃ§o Unit.</th>
                <th className="px-4 py-2 text-center w-20">Qtd.</th>
                <th className="px-4 py-2 text-center w-24">Vida Ãštil (Meses)</th>
                <th className="px-4 py-2 text-right">Custo Mensal</th>
                <th className="px-4 py-2 text-center w-16">AÃ§Ã£o</th>
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
                   FPV - FormaÃ§Ã£o de PreÃ§o de Vendas
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
                          VersÃ£o {v.versao} ({v.data})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
               {id && versions.length <= 1 && (
                 <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-medium">RevisÃ£o {proposta.versao}</span>
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

        {/* NAVEGAÃ‡ÃƒO POR ABAS - ESTILO MULTI-LINHA PARA EVITAR SCROLL */}
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

        {/* ÃREA DE CONTEÃšDO */}
        <div className="w-full max-w-7xl min-h-[600px]">
           
           {/* ABA 1: CLIENTE (Layout Profissional) */}
           {activeTab === 'dados' && (
              <div className="bg-white border border-slate-300 rounded-md shadow-sm">
                 <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] rounded-t-md">
                    <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                       <FileText size={16} /> IdentificaÃ§Ã£o do Projeto
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
                       <label className="text-xs font-semibold text-slate-700">Data de ElaboraÃ§Ã£o</label>
                       <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.dataElaboracao} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, dataElaboracao: e.target.value}})} />
                    </div>

                     <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          NÂº da Proposta
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
                          RevisÃ£o
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
                        <label className="text-xs font-semibold text-slate-700">Sindicato / Regra TÃ©cnica</label>
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
                       <label className="text-xs font-semibold text-slate-700">Tipo dos ServiÃ§os</label>
                       <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]" value={proposta.cliente.tipoServicos} onChange={(e) => setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: e.target.value}})} />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-semibold text-slate-700">Contato / ResponsÃ¡vel</label>
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
                       <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">ComposiÃ§Ã£o TributÃ¡ria</h3>
                       <button onClick={addTributo} className="text-[#1B4D3E] hover:text-[#13382D] text-xs font-semibold flex items-center gap-1"><Plus size={14}/> Nova Linha</button>
                    </div>
                    <div className="p-6 space-y-3">
                       {proposta.premissas.tributos.map((t: any) => (
                          <div key={t.id} className="flex gap-4 items-center">
                             <input type="text" className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:border-[#1B4D3E] outline-none" placeholder="DescriÃ§Ã£o do Imposto..." value={t.nome} onChange={(e) => {
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
                       <span className="font-bold uppercase text-xs tracking-wider">Carga TributÃ¡ria Consolidada</span>
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
                    <h2 className="text-lg font-bold text-slate-800">ParÃ¢metros Sociais e Trabalhistas</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                    <div>
                       {renderEncargoTable('Grupo A', 'Encargos Sociais - Grupo A', 'ObrigaÃ§Ãµes que incidem diretamente sobre a folha de pagamento', proposta.encargos.grupoA, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoA: val}}))}
                       {renderEncargoTable('Grupo B', 'Encargos Sociais - Grupo B', 'OcorrÃªncias de faltas / ausÃªncias justificadas. Incide o Grupo A', proposta.encargos.grupoB, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoB: val}}))}
                       {renderEncargoTable('Grupo C', 'Encargos Sociais - Grupo C', 'Provisionamento de 13Âº e fÃ©rias. Incide o Grupo A', proposta.encargos.grupoC, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoC: val}}))}
                    </div>
                    <div>
                       {renderEncargoTable('Grupo D', 'Encargos Sociais - Grupo D', 'DemissÃ£o sem justa causa e indenizaÃ§Ãµes', proposta.encargos.grupoD, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoD: val}}))}
                       {renderEncargoTable('Grupo E', 'Encargos Sociais - Grupo E', 'Provisionamento de casos especiais (maternidade, etc)', proposta.encargos.grupoE, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoE: val}}))}
                       {renderEncargoTable('Grupo F', 'Encargos Sociais - Grupo F', 'IncidÃªncias cumulativas do Grupo A sobre B e C', proposta.encargos.grupoF, (val: any) => setProposta({...proposta, encargos: {...proposta.encargos, grupoF: val}}))}
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
                              nomeCargo: 'Selecione a FunÃ§Ã£o', 
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
                             <th className="px-6 py-3">FunÃ§Ã£o Vinculada Ã  CCT</th>
                             <th className="px-6 py-3">Escala</th>
                             <th className="px-6 py-3 text-right">AÃ§Ã£o</th>
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
                                         <option value="">Selecione a FunÃ§Ã£o...</option>
                                         {!proposta.cliente.sindicatoId && (
                                             <option value="" disabled className="text-red-500 font-bold italic">âš ï¸ Selecione o Sindicato na Aba 1 primeiro</option>
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
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => {
                                            const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, showConfig: !x.showConfig} : x);
                                            setProposta({...proposta, equipe: newE});
                                         }} className={`p-2 rounded transition-colors ${p.showConfig ? 'bg-emerald-100 text-[#1B4D3E]' : 'text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100'}`} title="Configurar Posto">
                                                                                         âš™ï¸ R$ {(() => {
                                                const res = resultado?.items?.find((i: any) => i.id === p.id);
                                                return (res?.detalhes?.ativos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                             })()}
                                         </button>
                                         <button onClick={() => setProposta({...proposta, equipe: proposta.equipe.filter((x: any) => x.id !== p.id)})} className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded hover:bg-red-50" title="Remover Posto">
                                            <Trash2 size={16}/>
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                                 {p.showConfig && (
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                       <td colSpan={4} className="p-6">
                                          <div className="bg-white border border-emerald-100 rounded-lg p-6 shadow-sm">
                                             <h3 className="text-[#1B4D3E] font-bold text-sm uppercase mb-4 flex items-center gap-2">
                                                âš™ï¸ ParÃ¢metros EspecÃ­ficos do Posto
                                             </h3>
                                             
                                             {/* PRIMEIRA LINHA: ADICIONAIS */}
                                             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Periculosidade</label>
                                                   <select className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.periculosidade ? 'SIM' : 'NAO'} onChange={(e) => {
                                                      const param = {...p.parametrosPosto, periculosidade: e.target.value === 'SIM'};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }}>
                                                      <option value="NAO">Não</option>
                                                      <option value="SIM">Sim (30%)</option>
                                                   </select>
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Insalubridade (%)</label>
                                                   <select className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.insalubridadePercent || 0} onChange={(e) => {
                                                      const param = {...p.parametrosPosto, insalubridadePercent: Number(e.target.value)};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }}>
                                                      <option value={0}>0%</option>
                                                      <option value={10}>10% (Mínimo)</option>
                                                      <option value={20}>20% (Médio)</option>
                                                      <option value={40}>40% (Máximo)</option>
                                                   </select>
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Horas Noturnas (Mês)</label>
                                                   <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.adicionalNoturnoHoras || 0} onChange={(e) => {
                                                      const param = {...p.parametrosPosto, adicionalNoturnoHoras: Number(e.target.value)};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Intrajornada (Horas/Mês)</label>
                                                   <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.intrajornadaHoras || 0} onChange={(e) => {
                                                      const param = {...p.parametrosPosto, intrajornadaHoras: Number(e.target.value)};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">DSR s/ Adicionais (%)</label>
                                                   <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.dsrPercent || 0} onChange={(e) => {
                                                      const param = {...p.parametrosPosto, dsrPercent: Number(e.target.value)};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                             </div>

                                             {/* SEGUNDA LINHA: JORNADA E SALVAR */}
                                             <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Horário de Início</label>
                                                   <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.horarioInicio || '08:00'} onChange={(e) => {
                                                      const hInicio = e.target.value;
                                                      const hFim = p.parametrosPosto?.horarioFim || '17:00';
                                                      const dias = p.parametrosPosto?.diasTrabalhadosMes || 22;
                                                      const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                                      const param = {...p.parametrosPosto, horarioInicio: hInicio, adicionalNoturnoHoras: noturnoAuto};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Horário de Saída</label>
                                                   <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.horarioFim || '17:00'} onChange={(e) => {
                                                      const hFim = e.target.value;
                                                      const hInicio = p.parametrosPosto?.horarioInicio || '08:00';
                                                      const dias = p.parametrosPosto?.diasTrabalhadosMes || 22;
                                                      const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                                      const param = {...p.parametrosPosto, horarioFim: hFim, adicionalNoturnoHoras: noturnoAuto};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[10px] font-bold text-slate-500 uppercase">Dias Trab. / Mês</label>
                                                   <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B4D3E]" value={p.parametrosPosto?.diasTrabalhadosMes || 22} onChange={(e) => {
                                                      const dias = Number(e.target.value);
                                                      const hInicio = p.parametrosPosto?.horarioInicio || '08:00';
                                                      const hFim = p.parametrosPosto?.horarioFim || '17:00';
                                                      const noturnoAuto = calculateAutoNoturno(hInicio, hFim, dias);
                                                      const param = {...p.parametrosPosto, diasTrabalhadosMes: dias, adicionalNoturnoHoras: noturnoAuto};
                                                      updatePosto(p.id, 'parametrosPosto', param);
                                                   }} />
                                                </div>
                                                <div>
                                                   <button 
                                                      onClick={() => {
                                                         const newE = proposta.equipe.map((x: any) => x.id === p.id ? {...x, showConfig: false} : x);
                                                         setProposta({...proposta, equipe: newE});
                                                      }}
                                                      className="w-full bg-[#1B4D3E] hover:bg-[#153a2f] text-white font-bold py-2 rounded text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                                                   >
                                                      <Save size={12} /> Salvar Configurações
                                                   </button>
                                                </div>
                                             </div>

                                             {/* SEÃ‡ÃƒO DE EPIS ADICIONAIS: INDEPENDENTE E BONITA */}
                                             <div className="mt-8 pt-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-4">
                                                   <h4 className="text-[10px] font-black text-[#1B4D3E] uppercase tracking-widest flex items-center gap-2">
                                                      ðŸ›¡ï¸ EPIs e Itens Adicionais do Posto
                                                   </h4>
                                                   <button 
                                                      onClick={() => {
                                                         const epis = p.parametrosPosto?.episAdicionais || [];
                                                         const param = {...p.parametrosPosto, episAdicionais: [...epis, { id: Math.random().toString(), descricao: '', quantidade: 1, precoUnitario: 0, vidaUtil: 6 }]};
                                                         updatePosto(p.id, 'parametrosPosto', param);
                                                      }}
                                                      className="text-[#1B4D3E] hover:text-[#2d631d] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all underline decoration-emerald-200 underline-offset-4"
                                                   >
                                                      <Plus size={14} /> Inserir Item Avulso
                                                   </button>
                                                </div>

                                                {(p.parametrosPosto?.episAdicionais || []).length > 0 ? (
                                                   <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                      <table className="w-full text-[10px]">
                                                         <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                                            <tr>
                                                               <th className="px-4 py-2 text-left">Descrição do Item</th>
                                                               <th className="px-4 py-2 text-center w-16">Qtd</th>
                                                               <th className="px-4 py-2 text-center w-24">Preço (R$)</th>
                                                               <th className="px-4 py-2 text-center w-20">Vida Útil (m)</th>
                                                               <th className="px-4 py-2 text-center w-24">Custo/Mês</th>
                                                               <th className="px-4 py-2 text-center w-10"></th>
                                                            </tr>
                                                         </thead>
                                                         <tbody className="divide-y divide-slate-100">
                                                            {p.parametrosPosto.episAdicionais.map((epi: any, epiIdx: number) => (
                                                               <tr key={epi.id || epiIdx}>
                                                                  <td className="px-4 py-2">
                                                                     <input 
                                                                        type="text" 
                                                                        className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300" 
                                                                        placeholder="Ex: Roupa TÃ©rmica p/ CÃ¢mara Fria"
                                                                        value={epi.descricao}
                                                                        onChange={(e) => {
                                                                           const newEpis = [...p.parametrosPosto.episAdicionais];
                                                                           newEpis[epiIdx].descricao = e.target.value;
                                                                           updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                                        }}
                                                                     />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                     <input 
                                                                        type="number" 
                                                                        className="w-full bg-transparent outline-none font-bold text-slate-700 text-center" 
                                                                        value={epi.quantidade}
                                                                        onChange={(e) => {
                                                                           const newEpis = [...p.parametrosPosto.episAdicionais];
                                                                           newEpis[epiIdx].quantidade = Number(e.target.value);
                                                                           updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                                        }}
                                                                     />
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                     <div className="flex items-center gap-1 justify-center">
                                                                        <span className="text-slate-400">R$</span>
                                                                        <input 
                                                                           type="number" 
                                                                           step="0.01"
                                                                           className="w-16 bg-transparent outline-none font-bold text-slate-700 text-center" 
                                                                           value={epi.precoUnitario}
                                                                           onChange={(e) => {
                                                                              const newEpis = [...p.parametrosPosto.episAdicionais];
                                                                              newEpis[epiIdx].precoUnitario = Number(e.target.value);
                                                                              updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                                           }}
                                                                        />
                                                                     </div>
                                                                  </td>
                                                                  <td className="px-4 py-2">
                                                                     <input 
                                                                        type="number" 
                                                                        className="w-full bg-transparent outline-none font-bold text-slate-700 text-center" 
                                                                        value={epi.vidaUtil}
                                                                        onChange={(e) => {
                                                                           const newEpis = [...p.parametrosPosto.episAdicionais];
                                                                           newEpis[epiIdx].vidaUtil = Number(e.target.value);
                                                                           updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                                        }}
                                                                     />
                                                                  </td>
                                                                  <td className="px-4 py-2 text-center font-black text-emerald-600">
                                                                     R$ {((epi.precoUnitario * epi.quantidade) / (epi.vidaUtil || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                  </td>
                                                                  <td className="px-4 py-2 text-center">
                                                                     <button 
                                                                        onClick={() => {
                                                                           const newEpis = p.parametrosPosto.episAdicionais.filter((_: any, i: number) => i !== epiIdx);
                                                                           updatePosto(p.id, 'parametrosPosto', {...p.parametrosPosto, episAdicionais: newEpis});
                                                                        }}
                                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                                     >
                                                                        <Trash2 size={12} />
                                                                     </button>
                                                                  </td>
                                                               </tr>
                                                            ))}
                                                         </tbody>
                                                      </table>
                                                   </div>
                                                ) : (
                                                   <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg py-6 text-center">
                                                      <p className="text-[10px] text-slate-400 italic">Nenhum item adicional cadastrado para este posto. Clique em "Inserir Item Avulso" para comeÃ§ar.</p>
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       </td>
                                    </tr>

                                )}
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
            {activeTab === 'maquinas' && renderInsumosTab('detalheMaquinas', ['EQUIPAMENTOS LOCADO', 'EQUIPAMENTOS DEPRECIADOS', 'MAQUINAS', 'EQUIPAMENTOS'], 'MÃ¡quinas e Equipamentos')}
            {activeTab === 'descartaveis' && renderInsumosTab('detalheDescartaveis', ['DESCARTÃVEIS', 'DESCARTAVEIS'], 'DescartÃ¡veis')}

            {/* ABA 5: EXTRATO (100% IGUAL AO PRINT - PLANILHA DE CUSTOS) */}
           {activeTab === 'extrato' && (
              <div className="w-full bg-white border border-[#1B4D3E] shadow-xl text-xs rounded overflow-hidden print:border-none print:shadow-none">
                 
                 {/* CABEÃ‡ALHO PLANILHA */}
                 <div className="bg-[#1B4D3E] text-white flex justify-center items-center px-6 py-4 border-b border-white">
                    <h2 className="font-bold uppercase text-xl tracking-widest">Planilha de Custos</h2>
                 </div>

                 <table className="w-full text-left border-collapse">
                    <thead>
                       {/* MONTANTE A */}
                       <tr className="bg-[#1B4D3E] text-white border-b border-white/20">
                          <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "A" - MÃ£o-de-obra</th>
                       </tr>
                       <tr className="bg-slate-100 font-bold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                          <th className="py-2 px-6 w-[50%]">1) FunÃ§Ã£o</th>
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
                       
                       {/* Total FunÃ§Ã£o */}
                       <tr className="bg-[#3b8026] text-white font-bold border-y border-[#2d631d]">
                          <td colSpan={3} className="py-1.5 px-6 text-right">Total FunÃ§Ã£o</td>
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
                           }, { ativos: 0, materiais:0, maquinas:0, descartaveis:0, servicos:0 });

                           const rows = [
                              { label: '1) Uniformes e EPI\'s', val: b.ativos },
                              { label: '2) Materiais e produtos de limpeza', val: proposta.insumos.materiais },
                              { label: '3) MÃ¡quinas e equipamentos', val: proposta.insumos.maquinas },
                              { label: '4) DescartÃ¡veis', val: proposta.insumos.descartaveis },
                              { label: '5) ServiÃ§os (Descriminar)', val: proposta.insumos.servicos },
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
                           <th colSpan={4} className="py-2 text-center uppercase tracking-widest font-bold">Montante "C" - BenefÃ­cios Detalhados (13 Itens)</th>
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
                            }, { va:0, vt:0, custosSindicato:0, vaFerias:0, cestaBasica:0, descontoVA:0, descontoVT:0, exames:0, reservaTecnica:0, reservaTecnicaPct:0, manutencao:0, manutencaoPct:0, outros:0 });

                           const rows: any[] = [
                               { label: '1) Vale AlimentaÃ§Ã£o', val: b.va },
                               { label: '2) Vale Transporte', val: b.vt },
                               { label: '3) Custos com Sindicatos', val: b.custosSindicato },
                               { label: '4) Vale AlimentaÃ§Ã£o Sobre FÃ©rias', val: b.vaFerias },
                               { label: '5) Cesta BÃ¡sica Assiduidade(+)', val: b.cestaBasica },
                               { label: '6) Desconto de VA(-)', val: b.descontoVA, red: true },
                               { label: '7) Desconto de VT(-)', val: b.descontoVT, red: true },
                               { label: '8) Exames MÃ©dicos', val: b.exames },
                               { label: '9) Reservas TÃ©cnicas', val: b.reservaTecnica, pct: b.reservaTecnicaPct, field: 'reservaTecnicaPct' },
                               { label: '10) ManutenÃ§Ã£o Equipamentos', val: b.manutencao, pct: b.manutencaoPct, field: 'manutencaoPct' },
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
                           <td className="py-1.5 px-6 font-bold w-[50%]">AdministraÃ§Ã£o</td>
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

              // FunÃ§Ã£o auxiliar para aplicar a cascata solicitada a um custo direto
              const applyCascata = (custo: any) => {
                const cD = Number(custo) || 0;
                const comAdm = cD * (1 + txAdm);
                const comLucro = comAdm * (1 + txLucro);
                return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
              };

              return (
                <div className="space-y-6">

                  {/* BLOCO 1: MÃƒO DE OBRA */}
                  <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden">
                    <div className="bg-[#1B4D3E] px-6 py-3 flex items-center gap-2">
                      <UserCheck size={16} className="text-emerald-300" />
                      <h2 className="text-xs font-black text-white uppercase tracking-widest">1) MÃ£o de Obra â€” Quadro de Colaboradores</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                            <th className="px-4 py-2 w-10 text-center">Item</th>
                            <th className="px-4 py-2">DescriÃ§Ã£o â€” MÃ£o de Obra</th>
                            <th className="px-4 py-2 text-center">Qtd.</th>
                            <th className="px-4 py-2 text-right">PreÃ§o Unit. Venda</th>
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
                            <td colSpan={4} className="px-4 py-2.5 text-right uppercase tracking-wider text-xs">Subtotal MÃ£o de Obra (PreÃ§o de Venda Final)</td>
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
                            <th className="px-6 py-2">DescriÃ§Ã£o</th>
                            <th className="px-6 py-2 text-right w-48">PreÃ§o de Venda (R$)</th>
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
                            <td className="px-6 py-2.5 font-semibold text-slate-700">MÃ¡quinas e equipamentos</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.maquinas))}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">4</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">DescartÃ¡veis</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.descartaveis))}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-2.5 text-center font-bold text-slate-500">5</td>
                            <td className="px-6 py-2.5 font-semibold text-slate-700">
                              ServiÃ§os {proposta.insumos.servicosDescricao ? `(${proposta.insumos.servicosDescricao})` : ''}
                            </td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-800">
                              {fc(applyCascata(proposta.insumos.servicos))}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-700 text-white font-black">
                            <td colSpan={2} className="px-6 py-2.5 text-right uppercase tracking-wider text-xs">Subtotal Materiais e Insumos (PreÃ§o de Venda Final)</td>
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
                      <p className="text-[10px] font-bold text-emerald-100/60 uppercase">MÃ£o de Obra + Insumos Globais â€” Valor Final de Venda</p>
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
