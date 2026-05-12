import { 
  EnterpriseProposal, 
  EnterpriseCalculationResult, 
  EnterpriseCollaborator,
  EnterpriseSupply,
  EnterpriseEquipment,
  EscalaTrabalho
} from '../types/enterprise';

/**
 * Motor de Cálculo SmartBid Enterprise V4
 * Foco em precisão CLT, regras de CCT parametrizáveis e Gross-up corporativo.
 */

export function calculateLaborCost(colab: any, premissas: any): any {
  // O sistema agora separa o Cargo (salário/adicionais básicos) da CCT (benefícios/encargos)
  const cargo = colab.cargo || colab.configFinanceira; 
  const cct = colab.cctBase || colab.configFinanceira;
  const ativos = colab.ativosConfig;
  const param = colab.parametrosPosto || {}; // Novos parâmetros manuais
  
  // 1. Base de Remuneração
  const salarioBase = cargo.pisoSalarial || 0;
  
  // Periculosidade: Pega do parâmetro manual ou do cargo
  const temPericulosidade = param.periculosidade !== undefined ? param.periculosidade : (cargo.periculosidade || false);
  const adicionalPericulosidade = temPericulosidade ? salarioBase * 0.3 : 0;
  
  // Insalubridade: Pega do parâmetro manual ou do cargo
  const pctInsalubridade = param.insalubridadePercent !== undefined ? param.insalubridadePercent : (cargo.insalubridade || 0);
  const adicionalInsalubridade = salarioBase * (pctInsalubridade / 100);
  
  const outrosAdicionais = (cargo.adicionalCopa || 0) + (cargo.gratificacoes || 0) + (cargo.assiduidade || 0) + (cargo.anuenio || 0);
  
  // Cálculo de Horas Noturnas (20% sobre a hora normal)
  let adicionalNoturno = 0;
  if (param.adicionalNoturnoHoras > 0) {
    const valorHora = salarioBase / 220; // Padrão 220h mensais
    adicionalNoturno = (valorHora * 0.2) * param.adicionalNoturnoHoras;
  }
  
  // Cálculo de Intrajornada (50% de acréscimo)
  let intrajornada = 0;
  if (param.intrajornadaHoras > 0) {
    const valorHora = salarioBase / 220;
    intrajornada = (valorHora * 1.5) * param.intrajornadaHoras;
  }

  // DSR sobre adicionais (Ex: Noturno e Intrajornada)
  let dsrAdicionais = 0;
  if (param.dsrPercent > 0) {
    dsrAdicionais = (adicionalNoturno + intrajornada) * (param.dsrPercent / 100);
  }
  
  const totalRemuneracao = salarioBase + adicionalPericulosidade + adicionalInsalubridade + outrosAdicionais + adicionalNoturno + intrajornada + dsrAdicionais;

  // 2. Encargos e Provisões (Sobre Remuneração)
  let percentualEncargosGerais = 0;
  if (premissas && premissas.encargos && premissas.encargos.grupoA) {
    const e = premissas.encargos;
    const sumGroup = (g: any) => Object.values(g).reduce((a: any, b: any) => a + Number(b), 0) as number;
    percentualEncargosGerais = sumGroup(e.grupoA) + sumGroup(e.grupoB) + sumGroup(e.grupoC) + sumGroup(e.grupoD) + sumGroup(e.grupoE) + sumGroup(e.grupoF);
  } else {
    percentualEncargosGerais = (cct.encargoInss || 20) + (cct.encargoFgts || 8) + (cct.encargoRat || 0) + (cct.provisFerias || 11.11) + (cct.provis13 || 8.33) + (cct.provisRescisao || 4);
  }

  const totalEncargos = totalRemuneracao * (percentualEncargosGerais / 100);
  const totalProvisoes = 0; // Unificado em totalEncargos

  // 4. Inteligência de Escalas para Benefícios
  let diasEscala = 22;
  if (param.diasTrabalhadosMes) {
    diasEscala = param.diasTrabalhadosMes; // Se o usuário definiu manualmente
  } else {
    diasEscala = colab.escala === '5x2' ? 22 : colab.escala === '6x1' ? 26 : 15.21;
  }
  
  // VA/VR
  let custoVA = 0;
  if (cct.vaTipo === 'DIARIO') {
    custoVA = (cct.vaValor || 0) * diasEscala;
  } else {
    custoVA = (cct.vaValor || 0);
  }
  
  // Provisão de VA sobre Férias (1/12)
  if (cct.vaProvisFerias) {
    custoVA += (custoVA / 12);
  }

  // VT com Desconto CLT de 6%
  const custoVTBruto = (cct.vtValor || 0) * diasEscala;
  const descontoVTMax = salarioBase * ((cct.vtDescPercent || 6) / 100);
  const custoVTReal = Math.max(0, custoVTBruto - descontoVTMax);

  // Outros Benefícios Fixos
  const outrosBeneficios = (cct.cestaBasica || 0) + (cct.seguroVida || 0) + (cct.examesMedicos || 0);

  // 5. Custos de Ativos (EPIs/Uniformes)
  let custoAtivosMensal = cct.uniformeEpi || 0;
  if (ativos && ativos.uniformes) {
    custoAtivosMensal = ativos.uniformes.reduce((acc: number, item: any) => {
      return acc + (item.valor * item.quantidade / (item.vidaUtilMeses || 6));
    }, 0);
  }

  const custoTotalDireto = totalRemuneracao + totalEncargos + totalProvisoes + custoVA + custoVTReal + outrosBeneficios + custoAtivosMensal;

  return {
    remuneracao: totalRemuneracao,
    encargos: totalEncargos,
    provisoes: totalProvisoes,
    beneficios: custoVA + custoVTReal + outrosBeneficios,
    ativos: custoAtivosMensal,
    custoTotalDireto: custoTotalDireto * colab.quantidade
  };
}

export function calculateEnterprisePrice(proposal: any): any {
  const { items, impostos, margens } = proposal;

  let custoDiretoTotal = 0;
  const itemResults = items.map((item: any) => {
    const res = calculateLaborCost(item, proposal);
    custoDiretoTotal += res.custoTotalDireto;
    return {
      ...item,
      custoTotal: res.custoTotalDireto,
      detalhes: res
    };
  });

  // Divisor de Preço (Gross-up por dentro)
  const somaImpostos = (impostos.iss || 0) + (impostos.pis || 0) + (impostos.cofins || 0);
  const somaMargens = (margens.adm || 0) + (margens.lucro || 0);
  const divisor = 1 - ((somaImpostos + somaMargens) / 100);

  const faturamentoBruto = custoDiretoTotal / divisor;
  const valorImpostos = faturamentoBruto * (somaImpostos / 100);
  const valorMargens = faturamentoBruto * (somaMargens / 100);

  return {
    items: itemResults,
    custoDiretoTotal,
    faturamentoBruto,
    impostosTotais: valorImpostos,
    margemBruta: valorMargens,
    divisor
  };
}
