export interface CCT {
  id: string;
  nome: string;
  baseTerritorial: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  percentuais: {
    assiduidade: number;
    anuenio: number;
    gratificacoes: number;
  };
}

export interface Cargo {
  id: string;
  idCCT: string;
  nome: string;
  pisoSalarial: number;
  adicionais: {
    insalubridade: 0 | 10 | 20 | 40;
    periculosidade: 0 | 30;
    noturno: number;
  };
}

export interface EncargosSociais {
  grupoA: {
    inss: number;
    fgts: number;
    sesiSesc: number;
    sebrae: number;
    incra: number;
    salarioEducacao: number;
    rat: number;
    seguroAcidente: number;
  };
  grupoB: {
    ferias: number;
    decimoTerceiro: number;
    dsr: number;
    feriados: number;
    auxilioEnfermidade: number;
  };
  grupoC: {
    avisoPrevioIndenizado: number;
    multaFGTS: number;
  };
  // Grupo D é calculado (Incidência de A sobre B)
}

export interface Beneficio {
  nome: string;
  valorMensal: number;
  diasUteis: 22 | 26;
  tetoDescontoFolha: number; // Ex: 0.06 para 6% do VT
}

export interface Insumos {
  uniformeEPI: number;
  reservaTecnica: number;
  outros: number;
}

export interface Impostos {
  iss: number;
  pis: number;
  cofins: number;
  cprb: number; // Desoneração
}

export interface Margem {
  adm: number;
  lucro: number;
}

export interface Proposta {
  id: string;
  idRevisaoOriginal?: string;
  status: 'Rascunho' | 'Aprovada' | 'Revisada';
  dataCriacao: string;
  cliente: string;
  cargo: Cargo;
  cct: CCT;
  encargos: EncargosSociais;
  beneficios: Beneficio[];
  insumos: Insumos;
  impostos: Impostos;
  margem: Margem;
  escala: '5x2' | '12x36';
}

export interface ResultadoCalculo {
  remuneracaoBase: number;
  baseEncargos: number;
  custoSocial: {
    grupoA: number;
    grupoB: number;
    grupoC: number;
    grupoD: number;
    total: number;
  };
  custoDireto: number;
  precoVenda: number;
  dre: {
    faturamento: number;
    impostos: number;
    custos: number;
    margemBruta: number;
  };
}
