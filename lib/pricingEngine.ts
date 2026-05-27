import { EnterpriseCalculationResult } from '@/types/enterprise';

export function calculateLaborCost(colab: any, premissas: any): any {
  if (colab.tipoItem === 'SPOT') {
    const qtyDemanda = Number(colab.quantidadeDemanda || 0);
    const unit = colab.unidadeMedida || 'DIA';
    const configAtivos = colab.ativosConfig || {};
    
    const totalMensalMaoObra = Number(configAtivos.custoMensalMaoObra || 0);
    const totalMensalVeiculo = Number(configAtivos.custoMensalVeiculo || 0);
    const totalMensalCombustivel = Number(configAtivos.custoMensalCombustivel || 0);
    
    const divisor = unit === 'HORA' ? 176 : 22;
    
    const custoMaoObra = (totalMensalMaoObra / divisor) * qtyDemanda;
    const custoVeiculo = (totalMensalVeiculo / divisor) * qtyDemanda;
    const custoCombustivel = (totalMensalCombustivel / divisor) * qtyDemanda;
    
    const comissao = (Number(colab.precoUnitarioDemanda || 0) * qtyDemanda) * (Number(colab.comissaoVendedorPct || 0) / 100);
    const outrosCustos = custoCombustivel + comissao;
    const custoTotalDireto = custoMaoObra + custoVeiculo + outrosCustos;
    
    return {
      remuneracao: custoTotalDireto,
      encargos: 0,
      blocoA: custoTotalDireto,
      beneficios: 0,
      ativos: 0,
      custoTotal: custoTotalDireto,
      detalheBlocoB: {
        uniformes: 0,
        epis: 0,
        materiais: 0,
        maquinas: 0,
        descartaveis: 0,
        servicos: 0
      },
      detalheBlocoC: {
        va: 0,
        vt: 0,
        custosSindicato: 0,
        vaFerias: 0,
        cestaBasica: 0,
        descontoVA: 0,
        descontoVT: 0,
        exames: 0,
        reservaTecnica: 0,
        reservaTecnicaPct: 0,
        manutencao: 0,
        manutencaoPct: 0,
        outros: 0
      },
      custoTotalDireto: custoTotalDireto
    };
  }

  // Busca resiliente da CCT e do Cargo
  // Prioridade de CCT: 1. Do colaborador, 2. Global da proposta (selecionada na Aba 1), 3. Config Financeira (backup)
  const cctGlobal = premissas.cctGlobal || {};
  const cargo = colab.cargo || colab.configFinanceira || {}; 
  const cctColab = colab.cctBase || {};
  const param = colab.parametrosPosto || {};
  
  // A CCT efetiva é a do colab se tiver valores próprios, senão tenta a global da proposta, ou o que estiver no cargo
  const cctEfetiva = (cctColab.vaValor || cctColab.vtValor) ? cctColab : (cctGlobal.vaValor ? cctGlobal : (cargo.cct || cctColab || cctGlobal));
  
  // Base de Remuneração
  const salarioBase = Number(cargo.pisoSalarial || 0) || 0;
  
  // Periculosidade: Pega do parâmetro manual ou do cargo
  const temPericulosidade = param.periculosidade !== undefined ? param.periculosidade : (cargo.periculosidade || false);
  const adicionalPericulosidade = temPericulosidade ? salarioBase * 0.3 : 0;
  
  // Insalubridade: Pega do parâmetro manual ou do cargo
  const pctInsalubridade = param.insalubridadePercent !== undefined ? param.insalubridadePercent : (cargo.insalubridadePercent || 0);
  
  // Base de cálculo da insalubridade (Mínimo vs Salário da Função)
  const baseInsalubridade = cctEfetiva.insalubridadeBase === 'SALARIO' 
    ? salarioBase 
    : (Number(cctEfetiva.salarioMinimo) || 1412);

  const adicionalInsalubridade = baseInsalubridade * (pctInsalubridade / 100);
  
  const outrosAdicionais = Number(cargo.adicionalCopa || 0) + Number(cargo.gratificacoes || 0) + Number(cargo.assiduidade || 0) + Number(cargo.anuenio || 0);
  
  // Cálculo de Horas Noturnas (20% sobre a hora normal)
  let adicionalNoturno = 0;
  if (param.adicionalNoturnoHoras > 0) {
    const valorHora = salarioBase / 220; 
    adicionalNoturno = (valorHora * 0.2) * param.adicionalNoturnoHoras;
  }
  
  // Cálculo de Intrajornada (50% de acréscimo)
  let intrajornada = 0;
  if (param.intrajornadaHoras > 0) {
    const valorHora = salarioBase / 220;
    intrajornada = (valorHora * 1.5) * param.intrajornadaHoras;
  }

  // DSR sobre adicionais
  let dsrAdicionais = 0;
  if (param.dsrPercent > 0) {
    dsrAdicionais = (adicionalNoturno + intrajornada) * (param.dsrPercent / 100);
  }
  
  const baseRemuneracao = Number(salarioBase) || 0;
  const remuInsalubridade = Number(adicionalInsalubridade) || 0;
  const remuPericulosidade = Number(adicionalPericulosidade) || 0;
  const remuOutros = Number(outrosAdicionais) || 0;
  const remuNoturno = Number(adicionalNoturno) || 0;
  const remuIntra = Number(intrajornada) || 0;
  const remuDsr = Number(dsrAdicionais) || 0;

  const totalRemuneracao = baseRemuneracao + remuInsalubridade + remuPericulosidade + remuOutros + remuNoturno + remuIntra + remuDsr;

  // 2. Encargos e Provisões (Bloco A)
  // Se houver estrutura de grupos de encargos detalhada nas premissas, utiliza ela. Senão, usa o fallback da CCT.
  let percentualEncargosGerais = 0;
  const pEnc = premissas.encargos;

  if (pEnc && typeof pEnc === 'object') {
    // Soma todos os valores de todos os grupos (A, B, C, D, E, F)
    Object.values(pEnc).forEach((grupo: any) => {
      if (grupo && typeof grupo === 'object') {
        Object.values(grupo).forEach((val: any) => {
          percentualEncargosGerais += Number(val) || 0;
        });
      }
    });
  }

  // Se a soma for zero (ou não houver objeto), usa os campos individuais da CCT/Default como fallback
  if (percentualEncargosGerais === 0) {
    percentualEncargosGerais = 
      (cctEfetiva.encargoInss || 20) + 
      (cctEfetiva.encargoFgts || 8) + 
      (cctEfetiva.encargoRat || 0) + 
      (cctEfetiva.provisFerias || 11.11) + 
      (cctEfetiva.provis13 || 8.33) + 
      (cctEfetiva.provisRescisao || 0);
  }
    
  const totalEncargos = totalRemuneracao * (percentualEncargosGerais / 100);
  const totalBlocoA = totalRemuneracao + totalEncargos;

  // 3. Inteligência de Escalas para Benefícios
  let diasEscala = 22;
  if (param.diasTrabalhadosMes) {
    diasEscala = param.diasTrabalhadosMes;
  } else {
    diasEscala = colab.escala === '5x2' ? 22 : colab.escala === '6x1' ? 26 : 15.21;
  }
  
  // 4. BLOCO C - BENEFICIOS
  // 1) Vale Alimentação
  const custoVABruto = Number(cctEfetiva.vaTipo === 'DIARIO' ? (cctEfetiva.vaValor || 0) * diasEscala : (cctEfetiva.vaValor || 0)) || 0;
  
  // 2) Vale Transporte Bruto
  const custoVTBruto = Number((cctEfetiva.vtValor || 0) * diasEscala) || 0;
  
  // 3) Custos com Sindicatos (Assitência Médica/Social)
  const custosSindicato = Number(cctEfetiva.custosSindicato || 0) || 0;
  
  // 6) Vale Alimentação Sobre Férias
  const vaSobreFerias = cctEfetiva.vaProvisFerias ? (custoVABruto / 12) : 0;
  
  // 7) Cesta Básica Assiduidade(+)
  const cestaBasica = Number(cctEfetiva.cestaBasica || 0) || 0;
  
  // 8) Desconto de VA(-)
  const vaDescPct = Number(cctEfetiva.vaDescPercent || 0) || 0;
  const descontoVA = ((custoVABruto + vaSobreFerias) * vaDescPct) / 100;
  
  // 9) Desconto de VT(-) - Geralmente 6%
  const vtDescPct = Number(cctEfetiva.vtDescPercent || 6) || 0;
  const descontoVT = (salarioBase * vtDescPct) / 100;
  
  // 10) Exames Médicos
  const examesMedicos = Number(cctEfetiva.examesMedicos || 0) || 0;
  
  // 11) Reservas Técnicas e 12) Manutenção (Pega das premissas globais do projeto)
  const reservaTecnicaPct = Number(premissas.reservaTecnicaPct) || 0;
  const reservaTecnicaValor = totalBlocoA * (reservaTecnicaPct / 100);
  
  const manutencaoPct = Number(premissas.manutencaoPct) || 0;
  const maquinasGlobal = Number(premissas.maquinas) || 0;
  const totalEquipe = Number(premissas.totalEquipeQuantidade) || 1;
  const totalManutencaoGlobal = maquinasGlobal * (manutencaoPct / 100);
  const manutencaoValor = totalEquipe > 0 ? (totalManutencaoGlobal / totalEquipe) : 0;

  const outrosBeneficios = Number(cctEfetiva.outrosBeneficios || 0) || 0;
  
  const totalBeneficios = (custoVABruto + custoVTBruto + custosSindicato + vaSobreFerias + cestaBasica + examesMedicos + reservaTecnicaValor + manutencaoValor + outrosBeneficios) - (descontoVA + descontoVT);

  // 5. BLOCO B - INSUMOS (Unificado para manter extrato limpo)
  // Calcula o total de ativos priorizando o valor manual do colaborador, depois a composição detalhada do cargo, e por fim o valor fixo.
  const calculateEpiTotal = (c: any) => {
    if (!c.episConfig || !Array.isArray(c.episConfig)) return Number(c.uniformeEpi || 0);
    return c.episConfig.reduce((acc: number, item: any) => {
      const custoMensal = (Number(item.precoUnitario || 0) * Number(item.quantidade || 0)) / (Number(item.vidaUtil) || 1);
      return acc + custoMensal;
    }, 0);
  };

  const calculateEpiAdicionaisTotal = (p: any) => {
    if (!p.episAdicionais || !Array.isArray(p.episAdicionais)) return 0;
    return p.episAdicionais.reduce((acc: number, item: any) => {
      const custoMensal = (Number(item.precoUnitario || 0) * Number(item.quantidade || 0)) / (Number(item.vidaUtil) || 1);
      return acc + (custoMensal || 0);
    }, 0);
  };

  const ativosCustoMensal = Number(colab.ativosCustoMensal) || calculateEpiTotal(cargo) || Number(cctEfetiva.uniformeEpi) || 0;
  const custoEpiAdicionais = calculateEpiAdicionaisTotal(param);
  const totalAtivos = ativosCustoMensal + custoEpiAdicionais;

  const custoTotalDireto = totalBlocoA + totalBeneficios + totalAtivos;

  return {
    remuneracao: totalRemuneracao,
    encargos: totalEncargos,
    blocoA: totalBlocoA,
    beneficios: totalBeneficios,
    ativos: totalAtivos,
    custoTotal: custoTotalDireto,
    detalheBlocoB: {
      uniformes: totalAtivos,
      epis: 0,
      materiais: 0,
      maquinas: 0,
      descartaveis: 0,
      servicos: 0
    },
    detalheBlocoC: {
      va: custoVABruto,
      vt: custoVTBruto,
      custosSindicato: custosSindicato,
      vaFerias: vaSobreFerias,
      cestaBasica: cestaBasica,
      descontoVA: -descontoVA,
      descontoVT: -descontoVT,
      exames: examesMedicos,
      reservaTecnica: reservaTecnicaValor,
      reservaTecnicaPct: reservaTecnicaPct,
      manutencao: manutencaoValor,
      manutencaoPct: manutencaoPct,
      outros: outrosBeneficios
    },
    custoTotalDireto: custoTotalDireto * (Number(colab.quantidade) || 1)
  };
}

export function calculateEnterprisePrice(proposal: any): any {
  const { items, impostos, margens, reservaTecnicaPct, manutencaoPct, encargos, insumosGlobais } = proposal;

  const isSpot = items.some((i: any) => i.tipoItem === 'SPOT');

  let custoDiretoTotal = 0;
  
  // Soma custos globais de insumos (Materiais, Máquinas, Descartáveis) que não estão vinculados a um cargo específico
  // 1. Custo dos Insumos Globais (se houver)
  const custoInsumosGlobais = (Number(insumosGlobais?.materiais) || 0) + 
                             (Number(insumosGlobais?.maquinas) || 0) + 
                             (Number(insumosGlobais?.descartaveis) || 0) +
                             (Number(insumosGlobais?.servicos) || 0);

  custoDiretoTotal += custoInsumosGlobais;

  // 2. Parâmetros de Margens e Impostos
  const txAdm = (Number(margens?.adm) || 0) / 100;
  const txLucro = (Number(margens?.lucro) || 0) / 100;
  const totalTributosPct = Array.isArray(impostos?.list) 
    ? impostos.list.reduce((acc: number, t: any) => acc + (Number(t.percent) || 0), 0)
    : (Number(impostos?.total) || 0);
  
  // Divisor para tributos (por dentro)
  const divisorTributos = 1 - (totalTributosPct / 100);

  const totalEquipeQtd = items.reduce((acc: number, x: any) => acc + (Number(x.quantidade) || 0), 0);

  let faturamentoServicosSpot = 0;

  const itemResults = items.map((item: any) => {
    const res = calculateLaborCost(item, {
      reservaTecnicaPct: margens?.reservaTecnicaPct || reservaTecnicaPct,
      manutencaoPct: margens?.manutencaoPct || manutencaoPct,
      encargos,
      cctGlobal: proposal.cctGlobal,
      maquinas: Number(proposal.insumosGlobais?.maquinas) || 0,
      totalEquipeQuantidade: totalEquipeQtd
    });
    
    // CÁLCULO EM CASCATA SOLICITADO:
    // 1. Custo Direto
    const custoD = res.custoTotalDireto;
    let precoVendaItem = 0;

    if (item.tipoItem === 'SPOT') {
      precoVendaItem = (Number(item.quantidadeDemanda) || 0) * (Number(item.precoUnitarioDemanda) || 0);
      faturamentoServicosSpot += precoVendaItem;
    } else {
      // 2. Adiciona Taxa Adm sobre o Custo
      const comAdm = custoD * (1 + txAdm);
      // 3. Adiciona Lucro sobre (Custo + Adm)
      const comLucro = comAdm * (1 + txLucro);
      // 4. Aplica Tributos (Gross-up sobre o montante com margens)
      precoVendaItem = divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
    }

    custoDiretoTotal += custoD;
    
    return {
      ...item,
      custoTotal: custoD,
      precoVenda: precoVendaItem,
      detalhes: res
    };
  });

  let faturamentoBruto = 0;
  let valorImpostos = 0;
  let valorAdm = 0;
  let valorMargemLucro = 0;

  if (isSpot) {
    // Para Spot, os insumos operacionais globais (plataformas, químicos, etc) são precificados em cascata
    let faturamentoInsumos = 0;
    if (custoInsumosGlobais > 0) {
      const comAdmInsumos = custoInsumosGlobais * (1 + txAdm);
      const comLucroInsumos = comAdmInsumos * (1 + txLucro);
      faturamentoInsumos = divisorTributos > 0 ? (comLucroInsumos / divisorTributos) : comLucroInsumos;
    }

    faturamentoBruto = faturamentoServicosSpot + faturamentoInsumos;
    valorImpostos = faturamentoBruto * (totalTributosPct / 100);
    
    // Taxa administrativa sobre o custo direto total do projeto
    valorAdm = custoDiretoTotal * txAdm;
    
    // Margem real de lucro calculada de forma padrão e positiva baseada no custo
    valorMargemLucro = (custoDiretoTotal + valorAdm) * txLucro;
  } else {
    // Cálculo do Faturamento Bruto Total seguindo a mesma lógica
    const totalComAdm = custoDiretoTotal * (1 + txAdm);
    const totalComLucro = totalComAdm * (1 + txLucro);
    faturamentoBruto = divisorTributos > 0 ? (totalComLucro / divisorTributos) : totalComLucro;

    valorImpostos = faturamentoBruto * (totalTributosPct / 100);
    valorMargemLucro = faturamentoBruto - valorImpostos - totalComAdm;
    valorAdm = totalComAdm - custoDiretoTotal;
  }

  const descontoComercial = isSpot ? (faturamentoBruto - (custoDiretoTotal + valorAdm + valorMargemLucro + valorImpostos)) : 0;

  return {
    items: itemResults,
    custoDiretoTotal,
    faturamentoBruto,
    impostosTotais: valorImpostos,
    margemLucro: valorMargemLucro,
    taxaAdm: valorAdm,
    divisor: divisorTributos,
    descontoComercial
  };
}
