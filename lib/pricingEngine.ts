import { Proposta, ResultadoCalculo } from '../types/calculator';

export function calcularPreco(proposta: Proposta): ResultadoCalculo {
  const { cargo, cct, encargos, beneficios, insumos, impostos, margem, escala } = proposta;

  // Multiplicador de escala
  const multiplicadorEscala = escala === '12x36' ? 2.1071 : 1.0;

  // 1. Remuneração Base (RB)
  const adicionais = (cargo.pisoSalarial * (cargo.adicionais.insalubridade / 100)) +
                    (cargo.pisoSalarial * (cargo.adicionais.periculosidade / 100)) +
                    cargo.adicionais.noturno;
  
  const rb = (cargo.pisoSalarial + cct.percentuais.gratificacoes + adicionais) * multiplicadorEscala;

  // 2. Base de Encargos
  const baseEncargos = rb + (rb * (cct.percentuais.assiduidade / 100));

  // 3. Custo Social (Encargos Grupos A, B, C, D)
  const somaA = Object.values(encargos.grupoA).reduce((a, b) => a + b, 0) / 100;
  const somaB = Object.values(encargos.grupoB).reduce((a, b) => a + b, 0) / 100;
  const somaC = Object.values(encargos.grupoC).reduce((a, b) => a + b, 0) / 100;
  const somaD = somaA * somaB; // Incidência de A sobre B

  const custoA = baseEncargos * somaA;
  const custoB = baseEncargos * somaB;
  const custoC = baseEncargos * somaC;
  const custoD = baseEncargos * somaD;
  const totalEncargos = custoA + custoB + custoC + custoD;

  // 4. Benefícios (Líquidos)
  const totalBeneficios = beneficios.reduce((acc, b) => {
    // Exemplo simplificado: valor mensal menos o teto de desconto
    const desconto = cargo.pisoSalarial * b.tetoDescontoFolha;
    return acc + Math.max(0, b.valorMensal - desconto);
  }, 0);

  // 5. Custo Direto (CD)
  const cd = rb + totalEncargos + totalBeneficios + insumos.uniformeEPI;

  // 6. Cálculo do Preço de Venda (O Divisor)
  const somaImpostos = (impostos.iss + impostos.pis + impostos.cofins + impostos.cprb) / 100;
  const somaMargens = (margem.adm + margem.lucro) / 100;
  const divisor = 1 - (somaImpostos + somaMargens);

  const reservaTecnica = insumos.reservaTecnica;
  const outrosInsumos = insumos.outros;

  const precoVenda = (cd + outrosInsumos + reservaTecnica) / divisor;

  // DRE Projetada
  const faturamento = precoVenda;
  const impostosPagos = faturamento * somaImpostos;
  const margemBruta = faturamento - impostosPagos - cd - outrosInsumos - reservaTecnica;

  return {
    remuneracaoBase: rb,
    baseEncargos,
    custoSocial: {
      grupoA: custoA,
      grupoB: custoB,
      grupoC: custoC,
      grupoD: custoD,
      total: totalEncargos
    },
    custoDireto: cd,
    precoVenda,
    dre: {
      faturamento,
      impostos: impostosPagos,
      custos: cd + outrosInsumos + reservaTecnica,
      margemBruta
    }
  };
}
