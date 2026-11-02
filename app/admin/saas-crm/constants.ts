// Tipagem dos Módulos Flegáveis do SmartBid
export interface SaasModuleConfig {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  highlight?: boolean;
}

export const SAAS_AVAILABLE_MODULES: SaasModuleConfig[] = [
  {
    id: 'custos_fpv',
    name: 'Engenharia de Custos & FPV',
    description: 'Cálculo de margem, encargos sociais automáticos, insumos, BDI e composição de preços.',
    basePrice: 290.0,
    highlight: true,
  },
  {
    id: 'ccts_ia',
    name: 'Banco de CCTs com IA',
    description: 'Leitura inteligente de convenções coletivas, comparação de cláusulas e alertas de dissídio.',
    basePrice: 190.0,
    highlight: true,
  },
  {
    id: 'crm_facilities',
    name: 'CRM & Prospecção B2B',
    description: 'Kanban comercial, busca automática de empresas/CNPJ no Google Places e disparos WhatsApp.',
    basePrice: 240.0,
    highlight: true,
  },
  {
    id: 'contratos_reajustes',
    name: 'Gestão de Contratos & Reajustes',
    description: 'Controle de vigências, aniversários de contrato, repactuação automática e previsibilidade financeira.',
    basePrice: 180.0,
  },
  {
    id: 'app_campo',
    name: 'App de Campo (Entregas & EPIs)',
    description: 'Controle de rotas com GPS, ficha de EPIs e comprovantes de entrega assinados no celular pelo funcionário.',
    basePrice: 150.0,
  },
  {
    id: 'controladoria_bi',
    name: 'Painel de Controladoria & BI',
    description: 'DRE por contrato, margem de contribuição em tempo real e auditoria de faturamento.',
    basePrice: 190.0,
  },
];
