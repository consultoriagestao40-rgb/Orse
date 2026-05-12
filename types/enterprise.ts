export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  managerId?: string | null;
}

export interface Client {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
}

export interface CCTRule {
  id: string;
  nome: string;
  uf?: string | null;
  cidade?: string | null;
  funcao?: string | null;
  pisoSalarial: number;
  periculosidade: boolean;
  insalubridade: number;
  adicionalCopa: number;
  gratificacoes: number;
  assiduidade: number;
  anuenio: number;
  
  // Benefícios
  vaValor: number;
  vaTipo: 'FIXO' | 'DIARIO';
  vaProvisFerias: boolean;
  vaDescPercent: number;
  vtValor: number;
  vtDescPercent: number;
  
  // Provisões e Encargos
  provisFerias: number;
  provis13: number;
  provisRescisao: number;
  encargoInss: number;
  encargoFgts: number;
  encargoRat: number;
  
  // Impostos e Margens
  pis: number;
  cofins: number;
  iss: number;
  margemLucro: number;
  taxaAdm: number;
}

export type EscalaTrabalho = '5x2' | '6x1' | '12x36';

export interface EnterpriseCollaborator {
  id: string;
  nomeCargo: string;
  quantidade: number;
  escala: EscalaTrabalho;
  entrada?: string;
  saida?: string;
  configFinanceira: CCTRule;
  ativosConfig: {
    uniformes: Array<{
      nome: string;
      valor: number;
      quantidade: number;
      vidaUtilMeses: number;
    }>;
  };
}

export interface EnterpriseSupply {
  id: string;
  nome: string;
  unidade: string;
  precoUnitario: number;
  quantidade: number;
}

export interface EnterpriseEquipment {
  id: string;
  nome: string;
  tipo: 'PROPRIO' | 'LOCADO';
  custoAquisicao?: number;
  vidaUtilMeses?: number;
  valorLocacao?: number;
  quantidade: number;
}

export interface EnterpriseProposal {
  id: string;
  cliente: string;
  userId: string;
  clientId?: string;
  status: string;
  dataCriacao: string;
  colaboradores: EnterpriseCollaborator[];
  insumos: EnterpriseSupply[];
  equipamentos: EnterpriseEquipment[];
  encargos: any;
  impostos: any;
  margem: any;
}

export interface EnterpriseCalculationResult {
  items: any[];
  custoDiretoTotal: number;
  faturamentoBruto: number;
  impostosTotais: number;
  margemBruta: number;
  divisor: number;
}
