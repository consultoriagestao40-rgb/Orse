'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Plus, Trash2, Edit2, ShieldCheck, UserCheck, Calendar, Filter, 
  FileText, Search, Loader2, Save, X, Truck, Fuel, DollarSign, Clock, Users,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getEquipesTecnicas, 
  createEquipeTecnica, 
  updateEquipeTecnica, 
  deleteEquipeTecnica 
} from './actions';
import { getCCTs } from '@/app/ccts/actions';
import { getEscalas } from '@/app/escalas/actions';

const ENCARGOS_PADRAO = {
  grupoA: {
    titulo: "Encargos Sociais - Grupo A",
    descricao: "Obrigações que incidem diretamente sobre a folha de pagamento",
    total: 28.00,
    itens: [
      { nome: "INSS - PREVIDENCIA SOCIAL", valor: 20.00 },
      { nome: "FGTS", valor: 8.00 },
      { nome: "SESC", valor: 0.00 },
      { nome: "SENAC", valor: 0.00 },
      { nome: "SEBRAE", valor: 0.00 },
      { nome: "INCRA", valor: 0.00 },
      { nome: "SALARIO EDUCACAO", valor: 0.00 },
      { nome: "SEGURO ACIDENTE FAP", valor: 0.00 }
    ]
  },
  grupoB: {
    titulo: "Encargos Sociais - Grupo B",
    descricao: "Ocorrências de faltas / ausências justificadas. Incide o Grupo A",
    total: 12.64,
    itens: [
      { nome: "FERIAS", valor: 9.35 },
      { nome: "AUXILIO ENFERMIDADE", valor: 1.03 },
      { nome: "FALTAS LEGAIS", valor: 1.89 },
      { nome: "LICENCA PATERNIDADE", valor: 0.00 },
      { nome: "AUXILIO ACIDENTE", valor: 0.22 },
      { nome: "AVISO PREVIO TRABALHADO", valor: 0.15 }
    ]
  },
  grupoC: {
    titulo: "Encargos Sociais - Grupo C",
    descricao: "Provisionamento de 13º e férias. Incide o Grupo A",
    total: 12.51,
    itens: [
      { nome: "ABONO FERIAS", valor: 3.12 },
      { nome: "DECIMO TERCEIRO", valor: 9.39 }
    ]
  },
  grupoD: {
    titulo: "Encargos Sociais - Grupo D",
    descricao: "Demissão sem justa causa e indenizações",
    total: 4.76,
    itens: [
      { nome: "INDENIZACAO SEM JUSTA CAUSA", valor: 0.99 },
      { nome: "CONTRIBUICAO SOCIAL", valor: 0.27 },
      { nome: "AVISO PREVIO INDENIZADO", valor: 2.71 },
      { nome: "REFLEXO AVISO PREVIO", valor: 0.79 },
      { nome: "INDENIZACAO ADICIONAL", valor: 0.00 }
    ]
  },
  grupoE: {
    titulo: "Encargos Sociais - Grupo E",
    descricao: "Provisionamento de casos especiais (maternidade, etc)",
    total: 2.18,
    itens: [
      { nome: "LICENCA MATERNIDADE", valor: 0.99 },
      { nome: "AUXILIO ACIDENTE MAIS15", valor: 0.00 },
      { nome: "INCIDENCIA FGTS AVISO", valor: 1.19 },
      { nome: "ABONO PECUNIARIO", valor: 0.00 }
    ]
  },
  grupoF: {
    titulo: "Encargos Sociais - Grupo F",
    descricao: "Incidências cumulativas do Grupo A sobre B e C",
    total: 0.00,
    itens: [
      { nome: "INCIDENCIA CUMULATIVA", valor: 0.00 }
    ]
  }
};

interface ItemMaoObra {
  cargoId: string;
  nomeCargo: string;
  pisoSalarial: number;
  quantidade: number;
  escala: string;
  cargoOriginal?: any;
  cctOriginal?: any;
}

export default function AdminEquipesTecnicasPage() {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [ccts, setCcts] = useState<any[]>([]);
  const [cargosDisponiveis, setCargosDisponiveis] = useState<any[]>([]);
  const [escalasDisponiveis, setEscalasDisponiveis] = useState<any[]>([]);
  const [selectedCctId, setSelectedCctId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [custoMaoObra, setCustoMaoObra] = useState(0);
  const [custoVeiculo, setCustoVeiculo] = useState(0);
  const [custoCombustivel, setCustoCombustivel] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [valorDiaria, setValorDiaria] = useState(0);
  const [valorHora, setValorHora] = useState(0);
  
  // Mão de Obra Composta
  const [itensMaoObra, setItensMaoObra] = useState<ItemMaoObra[]>([]);
  const [encargoEstimadoPct, setEncargoEstimadoPct] = useState(60.09);
  const [manualMaoObra, setManualMaoObra] = useState(false);
  const [encargosBreakdown, setEncargosBreakdown] = useState<any>(JSON.parse(JSON.stringify(ENCARGOS_PADRAO)));
  const [extratoItem, setExtratoItem] = useState<ItemMaoObra | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    grupoA: false,
    grupoB: false,
    grupoC: false,
    grupoD: false,
    grupoE: false,
    grupoF: false
  });

  const toggleGroup = (grupoKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupoKey]: !prev[grupoKey]
    }));
  };

  const handleUpdateEncargoValue = (grupoKey: string, itemNome: string, novoValor: number) => {
    const valorNum = isNaN(novoValor) ? 0 : novoValor;
    
    // Fazer uma cópia profunda para atualizar o estado com imutabilidade
    const novoBreakdown = JSON.parse(JSON.stringify(encargosBreakdown));
    const grupo = novoBreakdown[grupoKey];
    
    if (grupo && grupo.itens) {
      grupo.itens = grupo.itens.map((item: any) => 
        item.nome === itemNome ? { ...item, valor: valorNum } : item
      );
      
      // Recalcular total do grupo
      const totalGrupo = grupo.itens.reduce((sum: number, item: any) => sum + (Number(item.valor) || 0), 0);
      grupo.total = Math.round(totalGrupo * 100) / 100;
      
      setEncargosBreakdown(novoBreakdown);
      
      // Recalcular total geral
      const totalGeral = Object.values(novoBreakdown).reduce((sum: number, g: any) => sum + (Number(g.total) || 0), 0);
      setEncargoEstimadoPct(Math.round(totalGeral * 100) / 100);
    }
  };

  const calculateDetailedItemCosts = (item: ItemMaoObra) => {
    if (!item.cargoOriginal || !item.cctOriginal) {
      const salarioBase = Number(item.pisoSalarial) || 0;
      const encargos = salarioBase * (encargoEstimadoPct / 100);
      const totalUnitario = salarioBase + encargos;
      return {
        isFallback: true,
        salarioBase,
        adicionais: 0,
        insalubridade: 0,
        insalubridadePercent: 0,
        insalubrabilidade: 0,
        remuneracaoTotal: salarioBase,
        encargos,
        custoFolha: totalUnitario,
        vaLiquido: 0,
        vtLiquido: 0,
        outrosBeneficios: 0,
        custoEpi: 0,
        custoUnitario: totalUnitario,
        custoMensalTotal: totalUnitario * item.quantidade,
        episDetalhados: []
      };
    }

    const cargo = item.cargoOriginal;
    const cct = item.cctOriginal;
    const escalaObj = escalasDisponiveis.find(esc => esc.nome === item.escala);
    const diasEscala = escalaObj ? escalaObj.diasTrabalhadosMes : (item.escala === '6x1' ? 26 : (item.escala === '12x36' ? 15.21 : 22));
    const salarioBase = Number(item.pisoSalarial) || 0;

    // 1. Remuneração e adicionais da CCT
    const adicionais = (Number(cargo.adicionalCopa) || 0) + 
                       (Number(cargo.gratificacoes) || 0) + 
                       (Number(cargo.assiduidade) || 0);

    const baseInsalubridade = cct.insalubridadeBase === 'SALARIO' 
      ? salarioBase 
      : (Number(cct.salarioMinimo) || 1412);
    const insalubridadePercent = Number(cargo.insalubridadePercent) || 0;
    const insalubridade = baseInsalubridade * (insalubridadePercent / 100);

    const remuneracaoTotal = salarioBase + adicionais + insalubridade;

    // 2. Encargos CLT
    const encargos = remuneracaoTotal * (encargoEstimadoPct / 100);
    const custoFolha = remuneracaoTotal + encargos;

    // 3. Benefícios: Vale Alimentação (VA) Líquido
    const vaBruto = cct.vaTipo === 'DIARIO' 
      ? (Number(cct.vaValor) || 0) * diasEscala 
      : (Number(cct.vaValor) || 0);
    const vaSobreFerias = cct.vaProvisFerias ? (vaBruto / 12) : 0;
    const descontoVA = ((vaBruto + vaSobreFerias) * (Number(cct.vaDescPercent) || 0)) / 100;
    const vaLiquido = vaBruto + vaSobreFerias - descontoVA;

    // 4. Vale Transporte (VT) Líquido
    const vtBruto = (Number(cct.vtValor) || 0) * diasEscala;
    const descontoVT = (salarioBase * (Number(cct.vtDescPercent) || 6)) / 100;
    const vtLiquido = Math.max(0, vtBruto - descontoVT);

    // 5. Outros Benefícios (Cesta, Seguro, Exames, Sindicato...)
    const cesta = Number(cct.cestaBasica) || 0;
    const seguro = Number(cct.seguroVida) || 0;
    const exames = Number(cct.examesMedicos) || 0;
    const sindicato = Number(cct.custosSindicato) || 0;
    const outros = Number(cct.outrosBeneficios) || 0;
    const outrosBeneficios = cesta + seguro + exames + sindicato + outros;

    // 6. EPI / Uniformes
    let custoEpi = Number(cct.uniformeEpi || 0);
    let episDetalhados: any[] = [];
    if (cargo.episConfig && Array.isArray(cargo.episConfig) && cargo.episConfig.length > 0) {
      custoEpi = cargo.episConfig.reduce((sumEpi: number, epi: any) => {
        const custoMensal = (Number(epi.precoUnitario || 0) * Number(epi.quantidade || 0)) / (Number(epi.vidaUtil) || 1);
        episDetalhados.push({
          descricao: epi.descricao,
          precoUnitario: Number(epi.precoUnitario) || 0,
          quantidade: Number(epi.quantidade) || 0,
          vidaUtil: Number(epi.vidaUtil) || 1,
          custoMensal
        });
        return sumEpi + custoMensal;
      }, 0);
    }

    const custoUnitario = custoFolha + vaLiquido + vtLiquido + outrosBeneficios + custoEpi;

    return {
      isFallback: false,
      salarioBase,
      adicionais,
      adicionalCopa: Number(cargo.adicionalCopa) || 0,
      gratificacoes: Number(cargo.gratificacoes) || 0,
      assiduidade: Number(cargo.assiduidade) || 0,
      insalubrabilidade: insalubridade,
      insalubridade,
      insalubridadePercent,
      remuneracaoTotal,
      encargos,
      custoFolha,
      vaBruto,
      vaSobreFerias,
      descontoVA,
      vaLiquido,
      vtBruto,
      descontoVT,
      vtLiquido,
      cesta,
      seguro,
      exames,
      sindicato,
      outros,
      outrosBeneficios,
      custoEpi,
      episDetalhados,
      custoUnitario,
      custoMensalTotal: custoUnitario * item.quantidade,
      diasEscala,
      escala: item.escala,
      cctNome: cct.nome,
      cctUf: cct.uf
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const eqRes = await getEquipesTecnicas();
      if (eqRes.success) {
        setEquipes(eqRes.list || []);
      }
      
      const cctList = await getCCTs();
      setCcts(cctList);
      
      const escList = await getEscalas();
      setEscalasDisponiveis(escList);
      
      // Aplanar todos os cargos das CCTs
      const listCargos: any[] = [];
      cctList.forEach((cct: any) => {
        if (cct.cargos && Array.isArray(cct.cargos)) {
          cct.cargos.forEach((c: any) => {
            listCargos.push({
              id: c.id,
              nome: `${c.nome} (${cct.nome} - ${cct.uf})`,
              nomeLimpo: c.nome,
              pisoSalarial: c.pisoSalarial || 0,
              cctNome: cct.nome,
              cargoOriginal: c,
              cctOriginal: cct
            });
          });
        }
      });
      setCargosDisponiveis(listCargos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Recalcular totais e sugestões
  useEffect(() => {
    let subtotalMaoObra = 0;
    if (!manualMaoObra) {
      subtotalMaoObra = itensMaoObra.reduce((acc, item) => {
        // Obter a escala correspondente a partir de escalasDisponiveis
        const escalaObj = escalasDisponiveis.find(esc => esc.nome === item.escala);
        const diasEscala = escalaObj ? escalaObj.diasTrabalhadosMes : (item.escala === '6x1' ? 26 : (item.escala === '12x36' ? 15.21 : 22));
        const salarioBase = Number(item.pisoSalarial) || 0;

        if (item.cargoOriginal && item.cctOriginal) {
          const cargo = item.cargoOriginal;
          const cct = item.cctOriginal;

          // 1. Remuneração e adicionais da CCT
          const adicionais = (Number(cargo.adicionalCopa) || 0) + 
                             (Number(cargo.gratificacoes) || 0) + 
                             (Number(cargo.assiduidade) || 0);

          const baseInsalubridade = cct.insalubridadeBase === 'SALARIO' 
            ? salarioBase 
            : (Number(cct.salarioMinimo) || 1412);
          const insalubridade = baseInsalubridade * ((Number(cargo.insalubridadePercent) || 0) / 100);

          const remuneracaoTotal = salarioBase + adicionais + insalubridade;

          // 2. Encargos CLT (60.09% acumulado)
          const encargos = remuneracaoTotal * (encargoEstimadoPct / 100);
          const custoFolha = remuneracaoTotal + encargos;

          // 3. Benefícios: Vale Alimentação (VA) Líquido
          const vaBruto = cct.vaTipo === 'DIARIO' 
            ? (Number(cct.vaValor) || 0) * diasEscala 
            : (Number(cct.vaValor) || 0);
          const vaSobreFerias = cct.vaProvisFerias ? (vaBruto / 12) : 0;
          const descontoVA = ((vaBruto + vaSobreFerias) * (Number(cct.vaDescPercent) || 0)) / 100;
          const vaLiquido = vaBruto + vaSobreFerias - descontoVA;

          // 4. Benefícios: Vale Transporte (VT) Líquido
          const vtBruto = (Number(cct.vtValor) || 0) * diasEscala;
          const descontoVT = (salarioBase * (Number(cct.vtDescPercent) || 6)) / 100;
          const vtLiquido = Math.max(0, vtBruto - descontoVT);

          // 5. Benefícios: Outros (Cesta, Seguro, Exames, Sindicato...)
          const outrosBeneficios = (Number(cct.cestaBasica) || 0) + 
                                   (Number(cct.seguroVida) || 0) + 
                                   (Number(cct.examesMedicos) || 0) + 
                                   (Number(cct.custosSindicato) || 0) + 
                                   (Number(cct.outrosBeneficios) || 0);

          // 6. EPI / Uniformes (cálculo real por itens ou flat de CCT)
          let custoEpi = Number(cct.uniformeEpi || 0);
          if (cargo.episConfig && Array.isArray(cargo.episConfig) && cargo.episConfig.length > 0) {
            custoEpi = cargo.episConfig.reduce((sumEpi: number, epi: any) => {
              const custoMensal = (Number(epi.precoUnitario || 0) * Number(epi.quantidade || 0)) / (Number(epi.vidaUtil) || 1);
              return sumEpi + custoMensal;
            }, 0);
          }

          const custoUnitario = custoFolha + vaLiquido + vtLiquido + outrosBeneficios + custoEpi;
          return acc + (custoUnitario * item.quantidade);
        }

        // Fallback de segurança se não houver dados originais
        const custoUnitarioFallback = salarioBase * (1 + encargoEstimadoPct / 100);
        return acc + (custoUnitarioFallback * item.quantidade);
      }, 0);

      // Arredondar valor final
      subtotalMaoObra = Math.round(subtotalMaoObra);
      setCustoMaoObra(subtotalMaoObra);
    } else {
      subtotalMaoObra = custoMaoObra;
    }

    const total = subtotalMaoObra + Number(custoVeiculo) + Number(custoCombustivel);
    setCustoTotal(total);

    // Diária Sugerida = Total / 22 dias uteis de trabalho
    const diariaSug = Math.round((total / 22) * 100) / 100;
    // Hora Sugerida = Total / 176 horas mensais
    const horaSug = Math.round((total / 176) * 100) / 100;

    setValorDiaria(diariaSug);
    setValorHora(horaSug);
  }, [itensMaoObra, encargoEstimadoPct, custoVeiculo, custoCombustivel, manualMaoObra, custoMaoObra, escalasDisponiveis]);

  const handleAddCargo = (cargoId: string) => {
    if (!cargoId) return;
    const selected = cargosDisponiveis.find(c => c.id === cargoId);
    if (!selected) return;

    // Verificar se já existe
    const exists = itensMaoObra.find(item => item.cargoId === cargoId);
    if (exists) {
      setItensMaoObra(itensMaoObra.map(item => 
        item.cargoId === cargoId ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setItensMaoObra([...itensMaoObra, {
        cargoId: selected.id,
        nomeCargo: selected.nomeLimpo,
        pisoSalarial: selected.pisoSalarial,
        quantidade: 1,
        escala: '5x2',
        cargoOriginal: selected.cargoOriginal,
        cctOriginal: selected.cctOriginal
      }]);
    }
  };

  const handleRemoveCargo = (cargoId: string) => {
    setItensMaoObra(itensMaoObra.filter(item => item.cargoId !== cargoId));
  };

  const handleUpdateQuantidade = (cargoId: string, qty: number) => {
    if (qty < 1) return;
    setItensMaoObra(itensMaoObra.map(item => 
      item.cargoId === cargoId ? { ...item, quantidade: qty } : item
    ));
  };

  const handleUpdateEscala = (cargoId: string, escalaNome: string) => {
    setItensMaoObra(itensMaoObra.map(item => 
      item.cargoId === cargoId ? { 
        ...item, 
        escala: escalaNome 
      } : item
    ));
  };
  const handleOpenCreate = () => {
    setEditingId(null);
    setNome('');
    setCustoMaoObra(0);
    setCustoVeiculo(0);
    setCustoCombustivel(0);
    setItensMaoObra([]);
    setSelectedCctId('');
    setEncargosBreakdown(JSON.parse(JSON.stringify(ENCARGOS_PADRAO)));
    setEncargoEstimadoPct(60.09);
    setExpandedGroups({
      grupoA: false,
      grupoB: false,
      grupoC: false,
      grupoD: false,
      grupoE: false,
      grupoF: false
    });
    setManualMaoObra(false);
    setModalOpen(true);
  };
  const handleOpenEdit = (equipe: any) => {
    setEditingId(equipe.id);
    setNome(equipe.nome);
    setCustoMaoObra(equipe.custoMensalMaoObra);
    setCustoVeiculo(equipe.custoMensalVeiculo);
    setCustoCombustivel(equipe.custoMensalCombustivel);
    setEncargosBreakdown(JSON.parse(JSON.stringify(ENCARGOS_PADRAO)));
    setEncargoEstimadoPct(60.09);
    setExpandedGroups({
      grupoA: false,
      grupoB: false,
      grupoC: false,
      grupoD: false,
      grupoE: false,
      grupoF: false
    });
    
    // Reconstruir o objeto de itensMaoObra recuperando CCT e Cargo originais
    const loadedItens = (Array.isArray(equipe.itensMaoObra) ? equipe.itensMaoObra : []).map((item: any) => {
      // 1. Tentar encontrar por ID exato
      let selected = cargosDisponiveis.find(c => c.id === item.cargoId);
      
      // 2. Se não encontrar (devido a cargos deletados e recriados), tentar encontrar por nome do cargo
      if (!selected && item.nomeCargo) {
        selected = cargosDisponiveis.find(c => 
          c.nomeLimpo.trim().toLowerCase() === item.nomeCargo.trim().toLowerCase()
        );
      }
      
      return {
        cargoId: selected ? selected.id : item.cargoId,
        nomeCargo: item.nomeCargo || (selected ? selected.nomeLimpo : ''),
        pisoSalarial: item.pisoSalarial || (selected ? selected.pisoSalarial : 0),
        quantidade: item.quantidade || 1,
        escala: item.escala || '5x2',
        cargoOriginal: selected ? selected.cargoOriginal : null,
        cctOriginal: selected ? selected.cctOriginal : null
      };
    });
    
    setItensMaoObra(loadedItens);
    
    if (loadedItens.length > 0 && loadedItens[0].cctOriginal) {
      setSelectedCctId(loadedItens[0].cctOriginal.id);
    } else {
      setSelectedCctId('');
    }
    
    setManualMaoObra(false); // Sempre usar composição CCT
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return alert('Insira o nome da composição de equipe.');

    setSaving(true);
    const data = {
      nome,
      custoMensalMaoObra: Number(custoMaoObra),
      custoMensalVeiculo: Number(custoVeiculo),
      custoMensalCombustivel: Number(custoCombustivel),
      custoMensalTotal: Number(custoTotal),
      valorDiariaSugerido: Number(valorDiaria),
      valorHoraSugerido: Number(valorHora),
      itensMaoObra: itensMaoObra.map(item => ({
        cargoId: item.cargoId,
        nomeCargo: item.nomeCargo,
        pisoSalarial: Number(item.pisoSalarial) || 0,
        quantidade: Number(item.quantidade) || 1,
        escala: item.escala || '5x2'
      }))
    };

    try {
      let res;
      if (editingId) {
        res = await updateEquipeTecnica(editingId, data);
      } else {
        res = await createEquipeTecnica(data);
      }

      if (res.success) {
        setModalOpen(false);
        fetchData();
      } else {
        alert('Erro ao salvar: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta equipe técnica?')) return;
    try {
      const res = await deleteEquipeTecnica(id);
      if (res.success) {
        fetchData();
      } else {
        alert('Erro ao remover: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    }
  };

  const filteredEquipes = equipes.filter(eq => 
    eq.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        {/* Header Superior Enterprise */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Composição de Equipes Técnicas</h1>
              <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                Módulo Spot V4.0
              </span>
            </div>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Crie a parametrização de equipes para serviços sob demanda. Agrupe salários, encargos, logística e gere preços padrão de diária e hora.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="bg-[#00A36C] hover:bg-[#008f5e] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-95 animate-fade-in"
          >
            <Plus size={18} strokeWidth={3} /> Nova Equipe
          </button>
        </div>

        {/* Tabela de Equipes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-slate-500" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Equipes Técnicas Ativas</h2>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                Total: {filteredEquipes.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar equipe..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1E293B] text-white uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Nome da Equipe</th>
                  <th className="px-6 py-4 text-right">Mão de Obra (Mês)</th>
                  <th className="px-6 py-4 text-right">Logística (Veíc + Comb)</th>
                  <th className="px-6 py-4 text-right bg-slate-800">Custo Total</th>
                  <th className="px-6 py-4 text-right text-emerald-400 bg-emerald-950">Sugerido Diária</th>
                  <th className="px-6 py-4 text-right text-sky-400 bg-slate-900">Sugerido Hora</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <span className="text-slate-400 font-medium italic">Carregando equipes técnicas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredEquipes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-slate-400 font-medium italic">
                      Nenhuma equipe cadastrada para serviços spot.
                    </td>
                  </tr>
                ) : (
                  filteredEquipes.map((eq: any) => (
                    <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-800 text-sm max-w-[200px] truncate">
                        {eq.nome}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eq.custoMensalMaoObra)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eq.custoMensalVeiculo + eq.custoMensalCombustivel)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900 bg-slate-50/60">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eq.custoMensalTotal)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-emerald-700 bg-emerald-50/50">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eq.valorDiariaSugerido)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-sky-700 bg-sky-50/40">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(eq.valorHoraSugerido)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenEdit(eq)}
                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(eq.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Composição */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
              
              {/* Header Modal */}
              <div className="bg-[#1E293B] text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-wide">
                    {editingId ? 'Editar Equipe Técnica' : 'Nova Composição de Equipe'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Configure mão de obra CLT e custos adicionais operacionais.</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corpo Modal */}
              <form onSubmit={handleSave} className="flex-1 overflow-auto p-8 flex flex-col gap-6">
                
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Nome da Composição / Equipe *</label>
                    <input 
                      type="text" 
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Equipe de Altura Completa (Supervisor + 2 Lavadores)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Convenção Coletiva (CCT) de Referência *</label>
                    <select
                      required
                      value={selectedCctId}
                      onChange={(e) => {
                        setSelectedCctId(e.target.value);
                        // Limpar os cargos se mudar a CCT para evitar misturar na mesma equipe
                        setItensMaoObra([]);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">-- Selecione uma CCT --</option>
                      {ccts.map((cct: any) => (
                        <option key={cct.id} value={cct.id}>
                          {cct.nome} ({cct.uf})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Composição de Funções (Apenas se !manualMaoObra) */}
                {!manualMaoObra ? (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Composição por Cargos da CCT</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Selecione os cargos para estimar a folha base de salários.</p>
                      </div>
                      <div className="w-80">
                        <select 
                          disabled={!selectedCctId}
                          onChange={(e) => {
                            handleAddCargo(e.target.value);
                            e.target.value = '';
                          }}
                          className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${!selectedCctId ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 cursor-pointer'}`}
                        >
                          <option value="">
                            {!selectedCctId ? 'Selecione uma CCT primeiro' : '+ Adicionar Função/Cargo...'}
                          </option>
                          {cargosDisponiveis
                            .filter((c) => c.cctOriginal?.id === selectedCctId)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nomeLimpo} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.pisoSalarial)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Lista de Cargos Selecionados */}
                    {itensMaoObra.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 italic text-sm bg-white rounded-xl border border-dashed border-slate-200">
                        Nenhuma função adicionada à equipe. Selecione acima.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {itensMaoObra.map((item) => (
                          <div key={item.cargoId} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="p-2 bg-slate-50 rounded-lg text-slate-400 flex-shrink-0">
                                <UserCheck size={16} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 text-xs sm:text-sm uppercase truncate" title={item.nomeCargo}>
                                  {item.nomeCargo}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">
                                  Piso: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.pisoSalarial)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Escala de Trabalho */}
                              <div className="flex items-center gap-1">
                                <Calendar size={14} className="text-slate-400 flex-shrink-0" title="Escala" />
                                <select 
                                  value={item.escala || '5x2'}
                                  onChange={(e) => handleUpdateEscala(item.cargoId, e.target.value)}
                                  className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 font-bold text-xs text-slate-700 outline-none cursor-pointer"
                                >
                                  {escalasDisponiveis.map((esc) => (
                                    <option key={esc.id} value={esc.nome}>
                                      {esc.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantidade */}
                              <div className="flex items-center gap-1">
                                <Users size={14} className="text-slate-400 flex-shrink-0" title="Quantidade" />
                                <input 
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) => handleUpdateQuantidade(item.cargoId, Number(e.target.value))}
                                  className="w-10 bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-center font-bold text-slate-800 text-xs"
                                />
                              </div>

                              <p className="text-xs font-black text-slate-700 w-20 text-right flex-shrink-0">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.pisoSalarial * item.quantidade)}
                              </p>

                              <button 
                                type="button"
                                onClick={() => setExtratoItem(item)}
                                className="text-blue-600 hover:text-blue-750 hover:bg-blue-50 transition-colors p-1 border border-blue-200 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer flex-shrink-0"
                                title="Ver Extrato Detalhado de Custos"
                              >
                                <FileText size={11} strokeWidth={2.5} /> Extrato
                              </button>

                              <button 
                                type="button"
                                onClick={() => handleRemoveCargo(item.cargoId)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-1.5 rounded-lg flex-shrink-0 cursor-pointer"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Detalhamento de Encargos Sociais */}
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="flex justify-between items-center px-1">
                        <div>
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Encargos Sociais CLT da Equipe</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Detalhamento estruturado dos encargos padrão.</p>
                        </div>
                        <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-black text-slate-700">
                          {expandedGroups.grupoA && expandedGroups.grupoB && expandedGroups.grupoC && expandedGroups.grupoD && expandedGroups.grupoE && expandedGroups.grupoF ? (
                            <button
                              type="button"
                              onClick={() => setExpandedGroups({ grupoA: false, grupoB: false, grupoC: false, grupoD: false, grupoE: false, grupoF: false })}
                              className="hover:text-blue-600 transition-colors uppercase text-[9px] tracking-wider outline-none"
                            >
                              Recolher Todos
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExpandedGroups({ grupoA: true, grupoB: true, grupoC: true, grupoD: true, grupoE: true, grupoF: true })}
                              className="hover:text-blue-600 transition-colors uppercase text-[9px] tracking-wider outline-none"
                            >
                              Expandir Todos
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                        {Object.entries(encargosBreakdown).map(([key, grupo]: [string, any]) => {
                          const isExpanded = expandedGroups[key];
                          const totalGrupo = grupo.total;
                          
                          return (
                            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all">
                              {/* Header da Seção (Sempre Visível) */}
                              <button
                                type="button"
                                onClick={() => toggleGroup(key)}
                                className={`w-full flex justify-between items-center px-4 py-3 text-left transition-colors outline-none ${isExpanded ? 'bg-[#1E293B] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                                  <span className="text-xs font-black uppercase tracking-wider">{grupo.titulo}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${isExpanded ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                    {totalGrupo.toFixed(2)}%
                                  </span>
                                </div>
                              </button>

                              {/* Conteúdo Expansível */}
                              {isExpanded && (
                                <div className="border-t border-slate-200 bg-white">
                                  {/* Descrição do Grupo */}
                                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-150 text-[10px] text-slate-500 font-semibold uppercase italic">
                                    {grupo.descricao}
                                  </div>

                                  {/* Tabela de Itens */}
                                  <div className="divide-y divide-slate-100">
                                    {grupo.itens.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center px-4 py-2 text-xs hover:bg-slate-50/50">
                                        <span className="text-slate-600 font-medium uppercase">{item.nome}</span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.valor}
                                            onChange={(e) => handleUpdateEncargoValue(key, item.nome, Number(e.target.value))}
                                            className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-right font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                                          />
                                          <span className="text-[10px] font-bold text-slate-400">%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Totalizador do Bloco Interno */}
                                  <div className="bg-emerald-50 border-t border-slate-200 px-4 py-2.5 flex justify-between items-center text-xs font-black text-emerald-800">
                                    <span>Total {grupo.titulo.split(' - ')[1]}</span>
                                    <span>{totalGrupo.toFixed(2)}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Totalizador Geral */}
                      <div className="flex justify-between items-center bg-[#0F172A] border border-[#1e293b] p-4 rounded-xl shadow-sm">
                        <div>
                          <p className="text-xs font-black text-slate-200 uppercase tracking-wider">Total Geral de Encargos da Equipe</p>
                          <p className="text-[10px] text-slate-400 font-medium">Soma de todos os grupos de encargos acima.</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-black text-emerald-400">{encargoEstimadoPct.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Custos Operacionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Custo de Mão de Obra */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                      Custo Mão de Obra (Mensal)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        disabled={!manualMaoObra}
                        value={custoMaoObra}
                        onChange={(e) => setCustoMaoObra(Number(e.target.value))}
                        className={`w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-800 font-black focus:ring-2 focus:ring-blue-500/20 outline-none ${!manualMaoObra ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                      />
                    </div>
                    {!manualMaoObra && (
                      <p className="text-[10px] text-slate-400 mt-1 italic font-semibold uppercase">
                        Soma CCT + {encargoEstimadoPct}% encargos
                      </p>
                    )}
                  </div>

                  {/* Custo de Veículo */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Truck size={14} className="text-slate-400" /> Custo Veículo (Mensal)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={custoVeiculo}
                        onChange={(e) => setCustoVeiculo(Number(e.target.value))}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-800 font-black focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>

                  {/* Custo de Combustível */}
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Fuel size={14} className="text-slate-400" /> Combustível & Manutenção
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={custoCombustivel}
                        onChange={(e) => setCustoCombustivel(Number(e.target.value))}
                        placeholder="0,00"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-800 font-black focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Dashboard de Preço Final da Composição */}
                <div className="bg-[#0F172A] text-white rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg relative overflow-hidden flex-shrink-0">
                  <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 translate-y-6">
                    <DollarSign size={200} />
                  </div>

                  {/* Custo Mensal Total */}
                  <div className="border-r border-slate-800 pr-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custo Mensal Total</span>
                    <h4 className="text-2xl font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Mão de obra + veículo + combustível/manut.</p>
                  </div>

                  {/* Diária Sugerida */}
                  <div className="border-r border-slate-800 px-6">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Diária Base Sugerida</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={valorDiaria}
                        onChange={(e) => setValorDiaria(Number(e.target.value))}
                        className="w-28 bg-slate-800/40 border border-slate-700/50 rounded-lg px-2 py-1 text-base font-black text-emerald-400 focus:ring-1 focus:ring-emerald-500 outline-none text-center"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Valor base diário (Custo Total / 22 dias)</p>
                  </div>

                  {/* Hora Sugerida */}
                  <div className="pl-6">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block mb-1">Hora Base Sugerida</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={valorHora}
                        onChange={(e) => setValorHora(Number(e.target.value))}
                        className="w-28 bg-slate-800/40 border border-slate-700/50 rounded-lg px-2 py-1 text-base font-black text-sky-400 focus:ring-1 focus:ring-sky-500 outline-none text-center"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Valor base de hora (Custo Total / 176 horas)</p>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="flex justify-end gap-3 mt-4 flex-shrink-0">
                  <button 
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-[#00A36C] hover:bg-[#008f5e] disabled:bg-emerald-300 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Salvar Composição
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {extratoItem && (() => {
          const detail = calculateDetailedItemCosts(extratoItem);
          return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-60 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="bg-[#0F172A] text-white p-6 flex justify-between items-center border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Módulo de Engenharia e Controladoria</span>
                    <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-slate-100">
                      <FileText className="text-emerald-400" size={20} />
                      Extrato Detalhado de Custos
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 uppercase font-semibold">
                      Função: <span className="text-white font-bold">{extratoItem.nomeCargo}</span> | Escala: <span className="text-white font-bold">{extratoItem.escala}</span>
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setExtratoItem(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Corpo Modal */}
                <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
                  
                  {detail.isFallback ? (
                    <div className="p-8 text-center text-slate-500 italic bg-slate-50 rounded-2xl border border-slate-150">
                      Não há dados dinâmicos da CCT disponíveis para este cargo. Exibindo estimativa base com base na remuneração.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Lado Esquerdo: Payroll & Taxes */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-3 bg-emerald-500 rounded-full"></span>
                          1. Composição de Folha & Encargos
                        </h4>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Piso Salarial CCT:</span>
                            <span className="font-bold text-slate-800">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.salarioBase)}
                            </span>
                          </div>

                          {(detail.adicionalCopa > 0 || detail.gratificacoes > 0 || detail.assiduidade > 0) && (
                            <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-[11px]">
                              <span className="text-slate-400 font-bold uppercase tracking-wider block">Adicionais CCT:</span>
                              {detail.adicionalCopa > 0 && (
                                <div className="flex justify-between items-center text-slate-650 ml-2">
                                  <span>• Adicional Copa:</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.adicionalCopa)}</span>
                                </div>
                              )}
                              {detail.gratificacoes > 0 && (
                                <div className="flex justify-between items-center text-slate-650 ml-2">
                                  <span>• Gratificações:</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.gratificacoes)}</span>
                                </div>
                              )}
                              {detail.assiduidade > 0 && (
                                <div className="flex justify-between items-center text-slate-650 ml-2">
                                  <span>• Prêmio Assiduidade:</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.assiduidade)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {detail.insalubridade > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Insalubridade ({detail.insalubridadePercent}%):</span>
                              <span className="font-semibold text-slate-700">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.insalubrabilidade || detail.insalubridade)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-bold text-slate-900">
                            <span>Remuneração Total (CLT):</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.remuneracaoTotal)}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs text-blue-600">
                            <span>Encargos CLT ({encargoEstimadoPct}%):</span>
                            <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.encargos)}</span>
                          </div>

                          <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 font-black text-slate-900 bg-slate-100/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                            <span>Custo de Folha Mensal:</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.custoFolha)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Benefícios & Equipamento */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-855 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-3 bg-[#00A36C] rounded-full"></span>
                          2. Benefícios CCT & Custos Operacionais
                        </h4>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                          
                          {/* Vale Refeição */}
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between items-center font-bold text-slate-800">
                              <span>Vale Refeição (VA/VR) Líquido:</span>
                              <span className="text-[#00A36C] font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.vaLiquido)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 ml-2 space-y-0.5">
                              <div className="flex justify-between">
                                <span>• Bruto Mensal ({detail.diasEscala}d):</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.vaBruto)}</span>
                              </div>
                              {detail.vaSobreFerias > 0 && (
                                <div className="flex justify-between">
                                  <span>• Provisão sobre Férias (1/12):</span>
                                  <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.vaSobreFerias)}</span>
                                </div>
                              )}
                              {detail.descontoVA > 0 && (
                                <div className="flex justify-between text-red-500">
                                  <span>• Coparticipação CLT:</span>
                                  <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.descontoVA)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vale Transporte */}
                          <div className="text-xs space-y-1 border-t border-dashed border-slate-200 pt-2">
                            <div className="flex justify-between items-center font-bold text-slate-800">
                              <span>Vale Transporte (VT) Líquido:</span>
                              <span className="text-[#00A36C] font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.vtLiquido)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 ml-2 space-y-0.5">
                              <div className="flex justify-between">
                                <span>• Custo Transporte Bruto ({detail.diasEscala}d):</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.vtBruto)}</span>
                              </div>
                              {detail.descontoVT > 0 && (
                                <div className="flex justify-between text-red-500">
                                  <span>• Desconto Legal CLT:</span>
                                  <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.descontoVT)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Outros Benefícios */}
                          {detail.outrosBeneficios > 0 && (
                            <div className="text-xs space-y-1 border-t border-dashed border-slate-200 pt-2">
                              <div className="flex justify-between items-center font-bold text-slate-800">
                                <span>Benefícios Coletivos CCT:</span>
                                <span className="text-[#00A36C] font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.outrosBeneficios)}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 ml-2 space-y-0.5">
                                {detail.cesta > 0 && <div className="flex justify-between"><span>• Cesta Básica:</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.cesta)}</span></div>}
                                {detail.seguro > 0 && <div className="flex justify-between"><span>• Seguro de Vida:</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.seguro)}</span></div>}
                                {detail.exames > 0 && <div className="flex justify-between"><span>• Medicina Ocupacional (Exames):</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.exames)}</span></div>}
                                {detail.sindicato > 0 && <div className="flex justify-between"><span>• Contribuições Assistenciais Sindicato:</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.sindicato)}</span></div>}
                                {detail.outros > 0 && <div className="flex justify-between"><span>• Outros Benefícios Adicionais:</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.outros)}</span></div>}
                              </div>
                            </div>
                          )}

                          {/* EPI & Uniforme */}
                          <div className="text-xs space-y-1 border-t border-dashed border-slate-200 pt-2">
                            <div className="flex justify-between items-center font-bold text-slate-800">
                              <span>Composição de EPI & Uniformes:</span>
                              <span className="text-[#00A36C] font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.custoEpi)}</span>
                            </div>
                            {detail.episDetalhados && detail.episDetalhados.length > 0 ? (
                              <div className="text-[10px] text-slate-400 ml-2 space-y-0.5 max-h-[100px] overflow-y-auto pr-1">
                                {detail.episDetalhados.map((epi: any, eidx: number) => (
                                  <div key={eidx} className="flex justify-between">
                                    <span>• {epi.descricao} ({epi.quantidade}x / {epi.vidaUtil}m):</span>
                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(epi.custoMensal)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 ml-2 italic">Valor flat ou sem insumos detalhados.</p>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Footer do Modal com Resumo Total */}
                <div className="bg-[#0F172A] text-white p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-lg relative overflow-hidden border-t border-slate-800">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Custo Unitário Mensal</span>
                    <h4 className="text-xl font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.custoUnitario)}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Custo total para 1 profissional.</p>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Profissionais Alocados</span>
                    <h4 className="text-xl font-black text-slate-300">
                      {extratoItem.quantidade} {extratoItem.quantidade === 1 ? 'Profissional' : 'Profissionais'}
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Multiplicador da linha de equipe.</p>
                  </div>

                  <div className="text-right border-l border-slate-800 pl-6">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Custo Mensal Total da Linha</span>
                    <h3 className="text-2xl font-black text-emerald-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(detail.custoMensalTotal)}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Multiplicado pela quantidade alocada.</p>
                  </div>
                </div>

                {/* Botão de Fechar */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setExtratoItem(null)}
                    className="px-6 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Fechar Extrato
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
