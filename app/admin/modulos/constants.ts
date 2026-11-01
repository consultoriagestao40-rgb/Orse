export interface TenantFeaturesConfig {
  crm?: boolean;       // Funil de Leads, Prospecção Ativa, Gestão de Emails, WhatsApp
  tasks?: boolean;     // Gestão de Tarefas
  contratos?: boolean; // Gestão de Contratos
  atas?: boolean;      // Atas de Reunião e Saldos
  pic?: boolean;       // PIC Implantação
  ativos?: boolean;    // Gestão de Ativos (Módulo especializado Slimpe)
  entregas?: boolean;  // Gestão de Entregas (Módulo especializado Slimpe)
  erpflex?: boolean;   // Integração ERPFlex
}

export interface ModulePricingItem {
  id: keyof TenantFeaturesConfig | 'core';
  nome: string;
  categoria: 'CORE' | 'COMERCIAL' | 'ESPECIALIZADO';
  descricao: string;
  beneficios: string[];
  precoMensal: number;
  obrigatorio?: boolean;
}

export interface PlanoPreset {
  id: 'GRATIS' | 'BASICO' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  nome: string;
  badge?: string;
  preco: number;
  descricao: string;
  usuariosInclusos: number;
  features: TenantFeaturesConfig;
  limites: {
    ccts: string;
    fpvs: string;
    propostas: string;
    buscasGoogle: string;
    linkRastreavel: boolean;
  };
}

export const PLANOS_PRESETS: PlanoPreset[] = [
  {
    id: 'GRATIS',
    nome: 'Plano Grátis',
    badge: 'Freemium / Entrada',
    preco: 0,
    descricao: 'A porta de entrada: experimente a dor de CCTs e planilhas sendo resolvida. Módulos avançados visíveis com trava de upgrade.',
    usuariosInclusos: 1,
    features: {
      crm: false,
      tasks: false,
      contratos: false,
      atas: false,
      pic: false,
      ativos: false,
      entregas: false
    },
    limites: {
      ccts: '1 CCT cadastrada',
      fpvs: 'Até 5 FPVs calculadas',
      propostas: 'Até 5 Propostas em PDF simples',
      buscasGoogle: '0 buscas novas no Google',
      linkRastreavel: false
    }
  },
  {
    id: 'BASICO',
    nome: 'Plano Básico',
    badge: 'R$ 149/mês',
    preco: 149.0,
    descricao: 'Para quem está começando. Até 3 usuários, Link Interativo Rastreável com métricas de visualização e CRM básico.',
    usuariosInclusos: 3,
    features: {
      crm: true,
      tasks: false,
      contratos: false,
      atas: false,
      pic: false,
      ativos: false,
      entregas: false
    },
    limites: {
      ccts: 'CCTs essenciais',
      fpvs: 'FPVs essenciais',
      propostas: 'Propostas comerciais com Link Rastreável',
      buscasGoogle: '30 buscas novas/mês Google Places',
      linkRastreavel: true
    }
  },
  {
    id: 'PRO',
    nome: 'Plano Profissional',
    badge: 'Mais Escolhido — R$ 299/mês',
    preco: 299.0,
    descricao: 'Para prestadoras em expansão. CCTs e FPVs ilimitadas, Módulo de Contratos com alerta de reajuste e Gestão de Tarefas (Tasks).',
    usuariosInclusos: 10,
    features: {
      crm: true,
      tasks: true,
      contratos: true,
      atas: true,
      pic: true,
      ativos: false,
      entregas: false
    },
    limites: {
      ccts: 'Ilimitadas',
      fpvs: 'Ilimitadas',
      propostas: 'Ilimitadas com Link Rastreável',
      buscasGoogle: '150 buscas novas/mês Google Places',
      linkRastreavel: true
    }
  },
  {
    id: 'ENTERPRISE',
    nome: 'Plano Enterprise',
    badge: 'R$ 599/mês',
    preco: 599.0,
    descricao: 'Para grandes operações e filiais. Até 100 usuários, todos os módulos liberados, APIs abertas e SLA com atendimento 24/7.',
    usuariosInclusos: 100,
    features: {
      crm: true,
      tasks: true,
      contratos: true,
      atas: true,
      pic: true,
      ativos: true,
      entregas: true
    },
    limites: {
      ccts: 'Ilimitadas',
      fpvs: 'Ilimitadas',
      propostas: 'Ilimitadas com APIs liberadas',
      buscasGoogle: '400 buscas novas/mês Google Places',
      linkRastreavel: true
    }
  }
];

export const MODULOS_CATALOGO: ModulePricingItem[] = [
  {
    id: 'core',
    nome: 'SmartBid Core & Precificação de Mão de Obra',
    categoria: 'CORE',
    obrigatorio: true,
    precoMensal: 149.0,
    descricao: 'Fundação da engenharia de custos: CCTs, encargos trabalhistas A/B/C/D, insumos, EPIs e propostas.',
    beneficios: [
      'Motor de Cálculo de CCTs com encargos A, B, C, D e benefícios',
      'Composição de custos de EPIs, Uniformes e Exames Médicos por função',
      'Gerador de Propostas Comerciais e Técnicas em PDF/A4',
      'Link Interativo Rastreável com métricas de visualização em tempo real (a partir do Plano Básico)',
      'Cadastro de Clientes, Insumos e FPV com DRE detalhada',
      'Radar Comercial & Cockpit Executivo de Conversão'
    ]
  },
  {
    id: 'crm',
    nome: 'Módulo CRM, Prospecção & WhatsApp',
    categoria: 'COMERCIAL',
    precoMensal: 130.0,
    descricao: 'Funil Kanban de negociação, busca ativa no Google Places e histórico integrado de WhatsApp.',
    beneficios: [
      'Pipeline Kanban de Negociação de Leads comerciais',
      'Prospecção Ativa no Google Places para captação de clientes de grande porte',
      'Gestão Integrada de E-mails vinculada diretamente à ficha do lead',
      'Central WhatsApp integrada ao histórico das negociações'
    ]
  },
  {
    id: 'contratos',
    nome: 'Módulo Gestão de Contratos Ativos & Reajustes',
    categoria: 'COMERCIAL',
    precoMensal: 69.0,
    descricao: 'Controle de vigência, reajustes anuais de CCT na data-base e aditivos de postos.',
    beneficios: [
      'Alerta automatizado de vencimento e datas-base de CCTs (evite perdas de margem)',
      'Controle rigoroso de aditivos de valor e alteração de postos de trabalho',
      'Acompanhamento do faturamento mensal por contrato e margem operacional'
    ]
  },
  {
    id: 'tasks',
    nome: 'Módulo Gestão de Tarefas (Tasks)',
    categoria: 'COMERCIAL',
    precoMensal: 39.0,
    descricao: 'Acompanhamento de rotinas, prazos comerciais e pendências operacionais da equipe.',
    beneficios: [
      'Quadro Kanban e listas de tarefas por equipe e vendedor',
      'Atribuição de responsáveis, observadores, prazos e prioridades',
      'Integração direta com o calendário global de visitas e retornos'
    ]
  },
  {
    id: 'atas',
    nome: 'Módulo Atas de Registro de Preço & Reuniões',
    categoria: 'COMERCIAL',
    precoMensal: 49.0,
    descricao: 'Controle de saldo licitatório e atas de alinhamento com clientes contratantes.',
    beneficios: [
      'Gestão de quantitativos e saldo remanescente de atas públicas e privadas',
      'Histórico de reuniões e atas com assinaturas digitais de participantes',
      'Rastreamento de solicitações de fornecimento de postos'
    ]
  },
  {
    id: 'pic',
    nome: 'Módulo PIC (Implantação do Contrato Fechado)',
    categoria: 'COMERCIAL',
    precoMensal: 49.0,
    descricao: 'Checklist rigoroso de mobilização do contrato recém-fechado da venda para a operação.',
    beneficios: [
      'Etapas estruturadas de recrutamento, exames admissionais e alocação',
      'Checklist de entrega de uniformes, EPIs e cronograma de início do posto',
      'Redução de falhas e multas no início do contrato'
    ]
  },
  // MÓDULOS ESPECIALIZADOS (Mantidos para atender a Slimpe e operações sob demanda, fora da vitrine da LP)
  {
    id: 'ativos',
    nome: 'Módulo Gestão de Ativos & Manutenção (Especializado)',
    categoria: 'ESPECIALIZADO',
    precoMensal: 59.0,
    descricao: 'Módulo sob medida para maquinários em comodato, ordens de serviço e área do técnico.',
    beneficios: [
      'Controle de maquinários alocados em cada contrato',
      'Ordens de serviço preventivas e corretivas com área mobile do técnico',
      'Contratos de comodato e controle de depreciação'
    ]
  },
  {
    id: 'entregas',
    nome: 'Módulo Gestão de Entregas & Logística (Especializado)',
    categoria: 'ESPECIALIZADO',
    precoMensal: 49.0,
    descricao: 'Módulo sob medida para roteirização de insumos físicos e área mobile do entregador.',
    beneficios: [
      'Programação de rotas de distribuição de materiais e químicos de limpeza',
      'Área mobile do entregador com confirmação e assinatura digital no posto',
      'Baixa automática de entregas no estoque do cliente'
    ]
  }
];
