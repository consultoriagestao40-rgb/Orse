'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';

export interface TenantFeaturesConfig {
  crm?: boolean;       // Funil de Leads, Prospecção Ativa, Gestão de Emails, WhatsApp
  tasks?: boolean;     // Gestão de Tarefas
  contratos?: boolean; // Gestão de Contratos
  atas?: boolean;      // Atas de Reunião e Saldos
  pic?: boolean;       // PIC Implantação
  ativos?: boolean;    // Gestão de Ativos
  entregas?: boolean;  // Gestão de Entregas
  erpflex?: boolean;   // Integração ERPFlex
}

export interface ModulePricingItem {
  id: keyof TenantFeaturesConfig | 'core';
  nome: string;
  categoria: 'CORE' | 'OPCIONAL';
  descricao: string;
  beneficios: string[];
  precoMensal: number;
  obrigatorio?: boolean;
}

export const MODULOS_CATALOGO: ModulePricingItem[] = [
  {
    id: 'core',
    nome: 'SmartBid Core & Precificação',
    categoria: 'CORE',
    obrigatorio: true,
    precoMensal: 690.0,
    descricao: 'Motor financeiro de formação de preço de mão de obra e propostas.',
    beneficios: [
      'Motor de Cálculo de CCTs com encargos A, B, C, D e benefícios',
      'Composição de custos de EPIs, Uniformes e Exames Médicos por função',
      'Gerador de Propostas Comerciais e Técnicas em PDF/A4',
      'Link Interativo Rastreável com métricas de visualização em tempo real',
      'Cadastro de Clientes, Insumos e FPV',
      'Radar Comercial & Cockpit Executivo',
      'Até 3 Usuários inclusos'
    ]
  },
  {
    id: 'crm',
    nome: 'Módulo CRM & Comunicação',
    categoria: 'OPCIONAL',
    precoMensal: 290.0,
    descricao: 'Funil de vendas completo com prospecção ativa e WhatsApp integrado.',
    beneficios: [
      'Pipeline Kanban de Negociação de Leads',
      'Prospecção Ativa Google Places & Enriquecimento de Leads com IA',
      'Gestão Integrada de E-mails',
      'Central WhatsApp Integrada diretamente ao histórico dos leads'
    ]
  },
  {
    id: 'tasks',
    nome: 'Módulo Gestão de Tarefas (Tasks)',
    categoria: 'OPCIONAL',
    precoMensal: 150.0,
    descricao: 'Acompanhamento de rotinas, prazos e pendências operacionais.',
    beneficios: [
      'Quadro Kanban e listas de tarefas por equipe',
      'Atribuição de responsáveis, prazos e prioridades',
      'Integração com calendário global de eventos'
    ]
  },
  {
    id: 'contratos',
    nome: 'Módulo Gestão de Contratos',
    categoria: 'OPCIONAL',
    precoMensal: 290.0,
    descricao: 'Controle de vigência, reajustes anuais de CCT e aditivos.',
    beneficios: [
      'Alerta automatizado de vencimento e datas-base de CCTs',
      'Controle de aditivos de valor e alteração de postos de trabalho',
      'Acompanhamento do faturamento mensal por contrato'
    ]
  },
  {
    id: 'atas',
    nome: 'Módulo Atas de Registro de Preço & Reuniões',
    categoria: 'OPCIONAL',
    precoMensal: 190.0,
    descricao: 'Controle de saldo licitatório e atas de alinhamento com clientes.',
    beneficios: [
      'Gestão de quantitativos e saldo remanescente de atas públicas/privadas',
      'Histórico de reuniões e atas com assinaturas de participantes',
      'Rastreamento de solicitações de fornecimento'
    ]
  },
  {
    id: 'pic',
    nome: 'Módulo PIC (Implantação de Contrato)',
    categoria: 'OPCIONAL',
    precoMensal: 250.0,
    descricao: 'Checklist rigoroso de mobilização do contrato recém-fechado.',
    beneficios: [
      'Etapas estruturadas de recrutamento, exames e alocação',
      'Checklist de entrega de uniformes, EPIs e equipamentos no posto',
      'Redução de falhas e multas no início da operação'
    ]
  },
  {
    id: 'ativos',
    nome: 'Módulo Gestão de Ativos & Equipamentos',
    categoria: 'OPCIONAL',
    precoMensal: 250.0,
    descricao: 'Rastreamento de maquinários em comodato e manutenção.',
    beneficios: [
      'Controle de patrimônio alocado em cada cliente',
      'Ordens de serviço preventivas e corretivas com área do técnico',
      'Contratos de comodato e controle de depreciação'
    ]
  },
  {
    id: 'entregas',
    nome: 'Módulo Gestão de Entregas & Logística',
    categoria: 'OPCIONAL',
    precoMensal: 220.0,
    descricao: 'Roteirização de insumos e aplicativo mobile para entregadores.',
    beneficios: [
      'Programação de rotas de distribuição de materiais e químicos',
      'Área mobile do entregador com confirmação e assinatura digital',
      'Baixa automática de entregas no estoque do cliente'
    ]
  }
];

export async function getTenantsForModulosAction() {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const platformAccounts = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const isPlatformAdmin = user.email ? platformAccounts.includes(user.email.toLowerCase().trim()) : false;

    // Super Admin vê todos; Admin regular vê apenas a sua empresa
    const tenants = await prisma.tenant.findMany({
      where: isPlatformAdmin ? {} : { id: user.tenantId || '' },
      select: {
        id: true,
        nomeFantasia: true,
        cnpj: true,
        plano: true,
        limiteUsuarios: true,
        features: true,
        ativo: true,
        createdAt: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { nomeFantasia: 'asc' }
    });

    return { 
      success: true, 
      tenants: tenants.map(t => {
        let parsedFeatures: TenantFeaturesConfig = {};
        if (t.features) {
          if (typeof t.features === 'string') {
            try { parsedFeatures = JSON.parse(t.features); } catch {}
          } else if (typeof t.features === 'object') {
            parsedFeatures = t.features as any;
          }
        }
        return {
          ...t,
          features: parsedFeatures
        };
      }),
      isPlatformAdmin,
      currentTenantId: user.tenantId
    };
  } catch (error: any) {
    console.error('Erro ao buscar empresas para módulos:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTenantModulosAction(
  tenantId: string, 
  features: TenantFeaturesConfig,
  limiteUsuarios?: number,
  plano?: string
) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const platformAccounts = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const isPlatformAdmin = user.email ? platformAccounts.includes(user.email.toLowerCase().trim()) : false;

    // Apenas Super Admin ou Admin da própria empresa
    if (!isPlatformAdmin && user.tenantId !== tenantId) {
      return { success: false, error: 'Permissão negada' };
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        features: features as any,
        ...(limiteUsuarios !== undefined ? { limiteUsuarios } : {}),
        ...(plano ? { plano } : {})
      }
    });

    revalidatePath('/admin/modulos');
    revalidatePath('/admin/empresas');
    revalidatePath('/');

    return { 
      success: true, 
      tenant: {
        id: updated.id,
        nomeFantasia: updated.nomeFantasia,
        features: updated.features,
        plano: updated.plano,
        limiteUsuarios: updated.limiteUsuarios
      }
    };
  } catch (error: any) {
    console.error('Erro ao atualizar módulos do tenant:', error);
    return { success: false, error: error.message };
  }
}
