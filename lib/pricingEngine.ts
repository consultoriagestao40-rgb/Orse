import { EnterpriseCalculationResult } from '@/types/enterprise';

export function calculateLaborCost(colab: any, premissas: any): any {
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
  const pctInsalubridade = param.insalubridadePercent !== undefined ? param.insalubridadePercent : (cargo.insalubridade || 0);
  const adicionalInsalubridade = salarioBase * (pctInsalubridade / 100);
  
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
  
  const totalRemuneracao = salarioBase + adicionalPericulosidade + adicionalInsalubridade + outrosAdicionais + adicionalNoturno + intrajornada + dsrAdicionais;

  // 2. Encargos e Provisões (Bloco A)
  // Busca encargos da CCT da proposta ou do backup no cargo
  const cctEncargos = cctProposta;
  const percentualEncargosGerais = 
    (cctEncargos.encargoInss || 20) + 
    (cctEncargos.encargoFgts || 8) + 
    (cctEncargos.encargoRat || 0) + 
    (cctEncargos.provisFerias || 11.11) + 
    (cctEncargos.provis13 || 8.33) + 
    (cctEncargos.provisRescisao || 0);
    
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
  // LOGICA DE RESILIÊNCIA: Se a CCT da proposta não tem VA/VT, tenta usar os dados da CCT que é dona do cargo (se existirem)
  // No banco de dados, o objeto 'cargo' pode vir com a relação 'cct' incluída em alguns contextos
  const cctEfetiva = (cctProposta.vaValor || cctProposta.vtValor) ? cctProposta : (cargo.cct || cctProposta);

  // 1) Vale Alimentação
  const custoVABruto = Number(cctEfetiva.vaTipo === 'DIARIO' ? (cctEfetiva.vaValor || 0) * diasEscala : (cctEfetiva.vaValor || 0)) || 0;
  
  // 2) Vale Transporte Bruto
  const custoVTBruto = Number((cctEfetiva.vtValor || 0) * diasEscala) || 0;
  
  // 3) Custos com Sindicatos
  const custosSindicato = Number(cctEfetiva.custosSindicato || 0) || 0;
  
  // 6) Vale Alimentação Sobre Férias
  const vaSobreFerias = cctEfetiva.vaProvisFerias ? (custoVABruto / 12) : 0;
  
  // 7) Cesta Básica Assiduidade(+)
  const cestaBasica = Number(cctEfetiva.cestaBasica || 0) || 0;
  
  // 8) Desconto de VA(-) - 20% conforme pedido do usuário
  const vaDescPct = Number(cctEfetiva.vaDescPercent || 0) || 0;
  const descontoVA = ((custoVABruto + vaSobreFerias) * vaDescPct) / 100;
  
  // 9) Desconto de VT(-) - Geralmente 6%
  const vtDescPct = Number(cctEfetiva.vtDescPercent || 6) || 0;
  const descontoVT = (salarioBase * vtDescPct) / 100;
  
  // 10) Exames Médicos
  const examesMedicos = Number(cctEfetiva.examesMedicos || 0) || 0;
  
  // 11) Reservas Técnicas (Sobre Bloco A)
  const reservaTecnicaPct = Number(premissas?.reservaTecnicaPct ?? (cctEfetiva.reservaTecnica || 0)) || 0;
  const reservaTecnica = totalBlocoA * (reservaTecnicaPct / 100);
  
  // 5. Custos de Ativos (EPIs/Uniformes/Máquinas)
  let custoAtivosMensal = 0;
  let custoMaquinasEquipamentos = 0;
  
  const ativosDet = {
    uniformes: 0,
    epis: 0,
    materiais: 0,
    maquinas: 0,
    descartaveis: 0,
    servicos: 0
  };

  // Soma ativos do CARGO (Composição técnica)
  let temComposicaoTecnica = false;
  if (cargo.episConfig && Array.isArray(cargo.episConfig) && cargo.episConfig.length > 0) {
    temComposicaoTecnica = true;
    cargo.episConfig.forEach((item: any) => {
      const pUnit = Number(item.precoUnitario) || 0;
      const q = Number(item.quantidade) || 0;
      const vUtil = Number(item.vidaUtil) || 1;
      const cMensal = (pUnit * q) / vUtil;
      custoAtivosMensal += cMensal;
      
      if (item.descricao?.toLowerCase().includes('uniforme')) {
        ativosDet.uniformes += cMensal;
      } else {
        ativosDet.epis += cMensal;
      }
    });
  }

  // Se não houver composição técnica detalhada, usa o valor global 'uniformeEpi' da CCT (Fallback)
  if (!temComposicaoTecnica) {
     const valorGlobalAtivos = Number(cctEfetiva.uniformeEpi || 0);
     if (valorGlobalAtivos > 0) {
        ativosDet.epis = valorGlobalAtivos;
        custoAtivosMensal = valorGlobalAtivos;
     }
  }
 
  // Soma custos extras da PROPOSTA (Lançados na engrenagem)
  const ativosProposta = colab.ativosConfig;
  if (ativosProposta && ativosProposta.uniformes) {
    ativosProposta.uniformes.forEach((item: any) => {
      const v = Number(item.valor) || 0;
      const q = Number(item.quantidade) || 0;
      const vUM = Number(item.vidaUtilMeses) || 6;
      const cMensal = (v * q / vUM);
      custoAtivosMensal += cMensal;
      
      if (item.categoria === 'Uniformes') ativosDet.uniformes += cMensal;
      else if (item.categoria === 'EPIs e Uniformes' || item.categoria === 'EPI') ativosDet.epis += cMensal;
      else if (item.categoria === 'Materiais') ativosDet.materiais += cMensal;
      else if (item.categoria === 'Máquinas e Equipamentos' || item.categoria === 'Equipamentos') {
        ativosDet.maquinas += cMensal;
        custoMaquinasEquipamentos += (v * q);
      }
      else if (item.categoria === 'Descartáveis') ativosDet.descartaveis += cMensal;
      else ativosDet.servicos += cMensal;
    });
  }
 
  // 12) Manutenção Equipamentos
  const manutencaoPct = Number(premissas?.manutencaoPct ?? (cctEfetiva.manutencaoEquipamentos || 0)) || 0;
  const manutencaoEquipamentos = custoMaquinasEquipamentos * (manutencaoPct / 100);
 
  // 13) Outros
  const outrosBeneficios = Number(cctEfetiva.outrosBeneficios || 0) || 0;
 
  // SOMA TOTAL BLOCO C
  const totalBlocoC = 
    custoVABruto + custoVTBruto + custosSindicato + 
    vaSobreFerias + cestaBasica + examesMedicos + 
    reservaTecnica + manutencaoEquipamentos + outrosBeneficios - 
    descontoVA - descontoVT;
 
  const custoTotalDireto = (Number(totalBlocoA) || 0) + (Number(totalBlocoC) || 0) + (Number(custoAtivosMensal) || 0);
 
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
  const { items, impostos, margens, reservaTecnicaPct, manutencaoPct, encargos } = proposal;

  let custoDiretoTotal = 0;
  const itemResults = items.map((item: any) => {
    const res = calculateLaborCost(item, {
      reservaTecnicaPct: margens?.reservaTecnicaPct || reservaTecnicaPct,
      manutencaoPct: margens?.manutencaoPct || manutencaoPct,
      encargos,
      cctGlobal: proposal.cctGlobal
    });
    custoDiretoTotal += res.custoTotalDireto;
    return {
      ...item,
      custoTotal: res.custoTotalDireto,
      detalhes: res
    };
  });

  // Divisor de Preço (Gross-up)
  const totalTributos = Array.isArray(impostos?.list) 
    ? impostos.list.reduce((acc: number, t: any) => acc + (Number(t.percent) || 0), 0)
    : (Number(impostos?.total) || 0);
    
  const somaMargens = (Number(margens?.adm) || 0) + (Number(margens?.lucro) || 0);
  const divisor = 1 - ((totalTributos + somaMargens) / 100);

  const faturamentoBruto = divisor > 0 ? (custoDiretoTotal / divisor) : custoDiretoTotal;
  const valorImpostos = faturamentoBruto * (totalTributos / 100);
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
