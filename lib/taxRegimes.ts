export type RegimeTributario =
  | 'SIMPLES_NORMAL'
  | 'SIMPLES_HIBRIDO'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL';

export type ModoTributario = 'ATUAL' | 'TRANSICAO_CBS' | 'IVA_DUAL';

export interface TributoItem {
  id: string;
  nome: string;
  percent: number;
}

export const REGIMES_TRIBUTARIOS: {
  id: RegimeTributario;
  label: string;
  shortLabel: string;
  descricao: string;
  badgeClass: string;
}[] = [
  {
    id: 'SIMPLES_NORMAL',
    label: 'Simples Normal (Anexo III)',
    shortLabel: 'Simples Normal',
    descricao: 'Guia única DAS (INSS Patronal já incluso no DAS; Grupo A mantém apenas 8% FGTS).',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'SIMPLES_HIBRIDO',
    label: 'Simples Híbrido (Anexo IV / IBS+CBS)',
    shortLabel: 'Simples Híbrido',
    descricao: 'Limpeza/Conservação/Vigilância (INSS 20% na folha, isento de Sistema S) ou IBS+CBS por fora do DAS.',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'LUCRO_PRESUMIDO',
    label: 'Lucro Presumido (Cumulativo)',
    shortLabel: 'Lucro Presumido',
    descricao: 'Regime cumulativo (PIS 0,65%, COFINS 3%, ISS, IRPJ e CSLL) ou transição CBS/IBS.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'LUCRO_REAL',
    label: 'Lucro Real (Não-Cumulativo)',
    shortLabel: 'Lucro Real',
    descricao: 'Regime não-cumulativo (PIS 1,65%, COFINS 7,60%, ISS, IR e CSLL) ou transição CBS/IBS.',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
];

export const MODOS_TRIBUTARIOS: {
  id: ModoTributario;
  label: string;
  shortLabel: string;
  descricao: string;
}[] = [
  {
    id: 'ATUAL',
    label: 'Sistema Atual (PIS / COFINS / ISS)',
    shortLabel: 'PIS / COFINS / ISS',
    descricao: 'Estrutura tributária vigente com PIS, COFINS e ISS.',
  },
  {
    id: 'TRANSICAO_CBS',
    label: 'Transição Reforma (Substitui PIS/COFINS por CBS)',
    shortLabel: 'Transição CBS + ISS',
    descricao: 'Extingue PIS e COFINS, substituindo pela CBS (Contribuição sobre Bens e Serviços) e mantendo ISS.',
  },
  {
    id: 'IVA_DUAL',
    label: 'IVA Dual Pleno (Substitui PIS/COFINS/ISS por CBS + IBS)',
    shortLabel: 'IVA Dual (IBS + CBS)',
    descricao: 'Substitui integralmente PIS, COFINS e ISS pelo IVA Dual: CBS (Federal) + IBS (Estadual/Municipal).',
  },
];

export function getDefaultTributos(
  regime: RegimeTributario = 'LUCRO_REAL',
  modo: ModoTributario = 'ATUAL'
): TributoItem[] {
  if (regime === 'SIMPLES_NORMAL') {
    if (modo === 'TRANSICAO_CBS') {
      return [
        { id: '1', nome: 'DAS - Simples Nacional (Anexo III)', percent: 6.0 },
        { id: '2', nome: 'CBS Transição (Compensável)', percent: 0.9 },
        { id: '3', nome: 'IBS Transição (Compensável)', percent: 0.1 },
      ];
    }
    return [{ id: '1', nome: 'DAS - Simples Nacional (Anexo III)', percent: 6.0 }];
  }

  if (regime === 'SIMPLES_HIBRIDO') {
    if (modo === 'TRANSICAO_CBS') {
      return [
        { id: '1', nome: 'DAS Reduzido (IRPJ / CSLL / ISS)', percent: 3.5 },
        { id: '2', nome: 'CBS (Subst. PIS/COFINS - Híbrido)', percent: 3.65 },
      ];
    }
    if (modo === 'IVA_DUAL') {
      return [
        { id: '1', nome: 'DAS Reduzido (IRPJ / CSLL)', percent: 1.5 },
        { id: '2', nome: 'CBS (Híbrido por fora do DAS)', percent: 8.8 },
        { id: '3', nome: 'IBS (Híbrido por fora do DAS)', percent: 5.0 },
      ];
    }
    return [{ id: '1', nome: 'DAS - Simples Nacional (Anexo IV)', percent: 4.5 }];
  }

  if (regime === 'LUCRO_PRESUMIDO') {
    if (modo === 'TRANSICAO_CBS') {
      return [
        { id: '1', nome: 'ISS', percent: 5.0 },
        { id: '2', nome: 'CBS (Subst. PIS/COFINS)', percent: 8.8 },
        { id: '3', nome: 'IRPJ (Presumido)', percent: 4.8 },
        { id: '4', nome: 'CSLL (Presumido)', percent: 2.88 },
      ];
    }
    if (modo === 'IVA_DUAL') {
      return [
        { id: '1', nome: 'CBS (Contribuição s/ Bens e Serviços)', percent: 8.8 },
        { id: '2', nome: 'IBS (Imposto s/ Bens e Serviços)', percent: 5.0 },
        { id: '3', nome: 'IRPJ (Presumido)', percent: 4.8 },
        { id: '4', nome: 'CSLL (Presumido)', percent: 2.88 },
      ];
    }
    return [
      { id: '1', nome: 'ISS', percent: 5.0 },
      { id: '2', nome: 'PIS (Cumulativo)', percent: 0.65 },
      { id: '3', nome: 'COFINS (Cumulativo)', percent: 3.0 },
      { id: '4', nome: 'IRPJ (Presumido)', percent: 4.8 },
      { id: '5', nome: 'CSLL (Presumido)', percent: 2.88 },
    ];
  }

  // Default: LUCRO_REAL (100% compatível com o padrão histórico da plataforma)
  if (modo === 'TRANSICAO_CBS') {
    return [
      { id: '1', nome: 'ISS', percent: 5.0 },
      { id: '2', nome: 'CSLL', percent: 1.0 },
      { id: '3', nome: 'IR', percent: 1.0 },
      { id: '4', nome: 'CBS (Subst. PIS/COFINS)', percent: 8.8 },
    ];
  }
  if (modo === 'IVA_DUAL') {
    return [
      { id: '1', nome: 'CBS (Contribuição s/ Bens e Serviços)', percent: 8.8 },
      { id: '2', nome: 'IBS (Imposto s/ Bens e Serviços)', percent: 5.0 },
      { id: '3', nome: 'CSLL', percent: 1.0 },
      { id: '4', nome: 'IR', percent: 1.0 },
    ];
  }
  return [
    { id: '1', nome: 'ISS', percent: 5.0 },
    { id: '2', nome: 'CSLL', percent: 1.0 },
    { id: '3', nome: 'IR', percent: 1.0 },
    { id: '4', nome: 'PIS', percent: 1.65 },
    { id: '5', nome: 'COFINS', percent: 7.6 },
  ];
}

export function getAdjustedGrupoAForRegime(
  currentGrupoA: any,
  regime: RegimeTributario
) {
  const base = currentGrupoA || {
    previdenciaSocial: 20.0,
    fgts: 8.0,
    sesc: 0.0,
    senac: 0.0,
    sebrae: 0.0,
    incra: 0.0,
    salarioEducacao: 0.0,
    seguroAcidenteFap: 0.0,
  };

  if (regime === 'SIMPLES_NORMAL') {
    // No Simples Anexo III, a CPP (INSS Patronal 20%, Sistema S e RAT) já está incluída no DAS; resta apenas FGTS (8%) na folha
    return {
      ...base,
      previdenciaSocial: 0.0,
      fgts: 8.0,
      sesc: 0.0,
      senac: 0.0,
      sebrae: 0.0,
      incra: 0.0,
      salarioEducacao: 0.0,
      seguroAcidenteFap: 0.0,
    };
  }

  if (regime === 'SIMPLES_HIBRIDO') {
    // No Simples Anexo IV (Limpeza/Vigilância), recolhe INSS Patronal (20%) + FGTS (8%) na folha, mas é isento de Sistema S/Terceiros
    return {
      ...base,
      previdenciaSocial: 20.0,
      fgts: 8.0,
      sesc: 0.0,
      senac: 0.0,
      sebrae: 0.0,
      incra: 0.0,
      salarioEducacao: 0.0,
    };
  }

  // Lucro Presumido e Lucro Real recolhem INSS Patronal 20% + FGTS 8%
  return {
    ...base,
    previdenciaSocial: 20.0,
    fgts: 8.0,
  };
}

export function getRegimeLabel(regime?: string): string {
  const found = REGIMES_TRIBUTARIOS.find((r) => r.id === regime);
  return found ? found.label : 'Lucro Real (Não-Cumulativo)';
}

export function getRegimeShortLabel(regime?: string): string {
  const found = REGIMES_TRIBUTARIOS.find((r) => r.id === regime);
  return found ? found.shortLabel : 'Lucro Real';
}
