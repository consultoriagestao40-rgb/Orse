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
  const cargo = colab.cargo || colab.configFinanceira || {}; 
  const cct = colab.cctBase || colab.configFinanceira || {};
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

  // 2. Encargos e Provisões (Bloco A - Encargos)
  const percentualEncargosGerais = (cct.encargoInss || 20) + (cct.encargoFgts || 8) + (cct.encargoRat || 0) + (cct.provisFerias || 11.11) + (cct.provis13 || 8.33) + (cct.provisRescisao || 0);
  const totalEncargos = totalRemuneracao * (percentualEncargosGerais / 100);
  
  const totalBlocoA = totalRemuneracao + totalEncargos;

  // 3. Inteligência de Escalas para Benefícios
  let diasEscala = 22;
  if (param.diasTrabalhadosMes) {
    diasEscala = param.diasTrabalhadosMes;
  } else {
    diasEscala = colab.escala === '5x2' ? 22 : colab.escala === '6x1' ? 26 : 15.21;
  }
  
  // 4. BLOCO C - BENEFICIOS (DETALHADO CONFORME PLANILHA)
  // 1) Vale Alimentação
  const custoVABruto = Number(cct.vaTipo === 'DIARIO' ? (cct.vaValor || 0) * diasEscala : (cct.vaValor || 0)) || 0;
  
  // 2) Vale Transporte Bruto
  const custoVTBruto = Number((cct.vtValor || 0) * diasEscala) || 0;
  
  // 3) Custos com Sindicatos
  const custosSindicato = Number(cct.custosSindicato || 0) || 0;
  
  // 6) Vale Alimentação Sobre Férias (Vinculado ao Checkbox de Provisão)
  const vaSobreFerias = cct.vaProvisFerias ? (custoVABruto / 12) : 0;
  
  // 7) Cesta Básica Assiduidade(+)
  const cestaBasica = Number(cct.cestaBasica || 0) || 0;
  
  // 8) Desconto de VA(-)
  const vaDescPct = Number(cct.vaDescPercent || 0) || 0;
  const descontoVA = ((custoVABruto + vaSobreFerias) * vaDescPct) / 100;
  
  // 9) Desconto de VT(-)
  const vtDescPct = Number(cct.vtDescPercent || 6) || 0;
  const descontoVT = (salarioBase * vtDescPct) / 100;
  const custoVTReal = Math.max(0, custoVTBruto - descontoVT);
 
  // 10) Exames Médicos
  const examesMedicos = Number(cct.examesMedicos || 0) || 0;
 
  // 11) Reservas Técnicas (Sobre Bloco A)
  const reservaTecnicaPct = Number(premissas?.reservaTecnicaPct ?? (cct.reservaTecnica || 0)) || 0;
  const reservaTecnica = totalBlocoA * (reservaTecnicaPct / 100);
 
  // 5. Custos de Ativos (EPIs/Uniformes/Máquinas)
  let custoAtivosMensal = 0;
  let custoMaquinasEquipamentos = 0;
 
  // Soma custo de EPIs da composição técnica do CARGO (Regra Sindicato)
  if (cargo.episConfig && Array.isArray(cargo.episConfig)) {
    cargo.episConfig.forEach((item: any) => {
      const pUnit = Number(item.precoUnitario) || 0;
      const q = Number(item.quantidade) || 0;
      const vUtil = Number(item.vidaUtil) || 1;
      const custoMensal = (pUnit * q) / vUtil;
      custoAtivosMensal += custoMensal;
    });
  }
 
  // Soma custos extras de ativos da PROPOSTA (Se houver)
  if (ativos && ativos.uniformes) {
    ativos.uniformes.forEach((item: any) => {
      const v = Number(item.valor) || 0;
      const q = Number(item.quantidade) || 0;
      const vUM = Number(item.vidaUtilMeses) || 6;
      const custoMensal = (v * q / vUM);
      custoAtivosMensal += custoMensal;
      
      // Verifica se é Máquina/Equipamento para base da manutenção (Sobre valor TOTAL)
      if (item.categoria === 'Máquinas e Equipamentos' || item.categoria === 'Equipamentos') {
        custoMaquinasEquipamentos += (v * q);
      }
    });
  }
 
  // 12) Manutenção Equipamentos (Sobre Máquinas e Equipamentos)
  const manutencaoPct = Number(premissas?.manutencaoPct ?? (cct.manutencaoEquipamentos || 0)) || 0;
  const manutencaoEquipamentos = custoMaquinasEquipamentos * (manutencaoPct / 100);
 
  // 13) Outros
  const outrosBeneficios = Number(cct.outrosBeneficios || 0) || 0;
 
  // SOMA TOTAL BLOCO C
  const totalBlocoC = 
    custoVABruto + custoVTBruto + custosSindicato + 
    vaSobreFerias + cestaBasica + examesMedicos + 
    reservaTecnica + manutencaoEquipamentos + outrosBeneficios - 
    descontoVA - descontoVT;
 
  const custoTotalDireto = (Number(totalBlocoA) || 0) + (Number(totalBlocoC) || 0) + (Number(custoAtivosMensal) || 0);
 
  // Detalhamento de Ativos (Bloco B)
  const ativosDet = {
    uniformes: 0,
    epis: 0,
    materiais: 0,
    maquinas: 0,
    descartaveis: 0,
    servicos: 0
  };

  // Soma ativos do CARGO
  if (cargo.episConfig && Array.isArray(cargo.episConfig)) {
    cargo.episConfig.forEach((item: any) => {
      const cMensal = (Number(item.precoUnitario) * Number(item.quantidade)) / (Number(item.vidaUtil) || 1);
      // Se for EPI ou Uniforme, separa (pode usar categoria se houver, ou tratar como EPI por padrão)
      if (item.descricao?.toLowerCase().includes('uniforme')) {
        ativosDet.uniformes += cMensal;
      } else {
        ativosDet.epis += cMensal;
      }
    });
  }

  // Soma ativos da PROPOSTA
  if (ativos && ativos.uniformes) {
    ativos.uniformes.forEach((item: any) => {
      const cMensal = (Number(item.valor) * Number(item.quantidade) / (Number(item.vidaUtilMeses) || 6));
      if (item.categoria === 'Uniformes') ativosDet.uniformes += cMensal;
      else if (item.categoria === 'EPIs e Uniformes' || item.categoria === 'EPI') ativosDet.epis += cMensal;
      else if (item.categoria === 'Materiais') ativosDet.materiais += cMensal;
      else if (item.categoria === 'Máquinas e Equipamentos' || item.categoria === 'Equipamentos') ativosDet.maquinas += cMensal;
      else if (item.categoria === 'Descartáveis') ativosDet.descartaveis += cMensal;
      else ativosDet.servicos += cMensal;
    });
  }

  return {
    remuneracao: totalRemuneracao,
    encargos: totalEncargos,
    blocoA: totalBlocoA,
    beneficios: totalBlocoC,
    ativos: custoAtivosMensal,
    detalheBlocoB: ativosDet,
    detalheBlocoC: {
      va: custoVABruto,
      vt: custoVTBruto,
      assistenciaMedica: custosSindicato * 0.6,
      assistenciaSocial: custosSindicato * 0.2,
      fundoFormacao: custosSindicato * 0.2,
      vaFerias: vaSobreFerias,
      cestaBasica: cestaBasica,
      descontoVA: -descontoVA,
      descontoVT: -descontoVT,
      exames: examesMedicos,
      reservaTecnica: reservaTecnica,
      reservaTecnicaPct: reservaTecnicaPct,
      manutencao: manutencaoEquipamentos,
      manutencaoPct: manutencaoPct,
      outros: outrosBeneficios,
      total: totalBlocoC
    },
    custoTotalDireto: custoTotalDireto * (Number(colab.quantidade) || 1)
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
