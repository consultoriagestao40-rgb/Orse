export interface PerfilPreset {
  id: string;
  nome: string;
  descricao: string;
  role: 'USER' | 'MANAGER' | 'ADMIN' | 'LOGISTICA';
  acessoWhatsTipo: 'TODOS' | 'PROPRIOS' | 'NENHUM';
  acessoLeadsTipo: 'TODOS' | 'ATRIBUIDOS';
  acessoContratos: boolean;
  acessoPic: boolean;
  acessoTarefasTipo: 'TODAS' | 'ENVOLVIDO';
  acessoCrm: boolean;
  acessoProspeccao: boolean;
  acessoCct: boolean;
  acessoPropostas: boolean;
}

export const PERFIS_PRESETS: PerfilPreset[] = [
  {
    id: 'vendedor',
    nome: 'Vendedor / Closer',
    descricao: 'Acesso ao CRM, Prospecção e Propostas. Vê somente seus próprios leads atribuídos, Whats próprio e tarefas em que está envolvido. Sem acesso a Contratos e PIC.',
    role: 'USER',
    acessoWhatsTipo: 'PROPRIOS',
    acessoLeadsTipo: 'ATRIBUIDOS',
    acessoContratos: false,
    acessoPic: false,
    acessoTarefasTipo: 'ENVOLVIDO',
    acessoCrm: true,
    acessoProspeccao: true,
    acessoCct: true,
    acessoPropostas: true,
  },
  {
    id: 'sdr',
    nome: 'SDR / Pré-Vendas',
    descricao: 'Focado em Prospecção e qualificação no CRM. Vê apenas seus próprios leads e conversas. Sem acesso a Propostas, Contratos e PIC.',
    role: 'USER',
    acessoWhatsTipo: 'PROPRIOS',
    acessoLeadsTipo: 'ATRIBUIDOS',
    acessoContratos: false,
    acessoPic: false,
    acessoTarefasTipo: 'ENVOLVIDO',
    acessoCrm: true,
    acessoProspeccao: true,
    acessoCct: false,
    acessoPropostas: false,
  },
  {
    id: 'gestor',
    nome: 'Gestor Comercial',
    descricao: 'Supervisão completa de equipe. Acesso irrestrito a todos os leads, conversas de WhatsApp, tarefas, contratos, PIC e regras técnicas.',
    role: 'MANAGER',
    acessoWhatsTipo: 'TODOS',
    acessoLeadsTipo: 'TODOS',
    acessoContratos: true,
    acessoPic: true,
    acessoTarefasTipo: 'TODAS',
    acessoCrm: true,
    acessoProspeccao: true,
    acessoCct: true,
    acessoPropostas: true,
  },
  {
    id: 'operacoes',
    nome: 'Operações & Pós-Venda (PIC/Contratos)',
    descricao: 'Gestão de Contratos e Implantação (PIC) e tarefas onde é responsável/participante. Sem acesso a prospecção ou pipeline comercial.',
    role: 'USER',
    acessoWhatsTipo: 'NENHUM',
    acessoLeadsTipo: 'ATRIBUIDOS',
    acessoContratos: true,
    acessoPic: true,
    acessoTarefasTipo: 'ENVOLVIDO',
    acessoCrm: false,
    acessoProspeccao: false,
    acessoCct: true,
    acessoPropostas: false,
  },
  {
    id: 'admin',
    nome: 'Administrador Total',
    descricao: 'Acesso irrestrito a todas as funcionalidades, configurações, faturamento e dados do sistema.',
    role: 'ADMIN',
    acessoWhatsTipo: 'TODOS',
    acessoLeadsTipo: 'TODOS',
    acessoContratos: true,
    acessoPic: true,
    acessoTarefasTipo: 'TODAS',
    acessoCrm: true,
    acessoProspeccao: true,
    acessoCct: true,
    acessoPropostas: true,
  }
];
