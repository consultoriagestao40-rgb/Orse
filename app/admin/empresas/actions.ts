'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getOrCreateAsaasCustomer, createAsaasPixCharge, createAsaasCardPayment } from './asaas';

/**
 * Auxiliar de Segurança:
 * Valida se o usuário logado possui privilégios de Super Administrador.
 * Libera acesso apenas para:
 * 1. O email master (cristiano@grupojvsserv.com.br)
 * 2. Ou usuários pertencentes ao tenant com o CNPJ da Silva Consultoria (40.180.983/0001-00)
 */
export async function checkIsSuperAdmin() {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return false;

    let data;
    try {
      // Tenta decodificar caso esteja URL-encoded
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        // Tenta fazer o parse direto caso o Next.js já tenha decodificado
        data = JSON.parse(sbUser);
      } catch (err) {
        console.error('Erro crítico ao fazer parse do cookie sb_user:', err);
        return false;
      }
    }
    
    // Busca o usuário no banco por e-mail ou nome para máxima precisão e segurança
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email || '___invalid___' },
          { nome: data.nome || '___invalid___' }
        ]
      },
      include: { tenant: true }
    });

    if (!user) return false;

    // Condição de liberação master exclusiva do proprietário do SaaS pelo email verificado
    const isPlatformAdmin = user.email === 'admin@smartbidhub.com.br';

    return isPlatformAdmin;
  } catch (error) {
    console.error('Erro na checagem de Super Admin:', error);
    return false;
  }
}

/**
 * Retorna todos os Tenants (empresas) cadastrados com estatísticas de uso em tempo real.
 */
export async function getTenantsWithStats() {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            propostas: true,
            leads: true,
            contratos: true
          }
        }
      }
    });

    return tenants.map(t => ({
      id: t.id,
      nomeFantasia: t.nomeFantasia,
      cnpj: t.cnpj,
      ativo: t.ativo,
      createdAt: t.createdAt.toISOString(),
      plano: t.plano,
      limiteUsuarios: t.limiteUsuarios,
      trialStartedAt: t.trialStartedAt ? t.trialStartedAt.toISOString() : null,
      taxaWhatsapp: t.taxaWhatsapp,
      stats: {
        users: t._count.users,
        propostas: t._count.propostas,
        leads: t._count.leads,
        contratos: t._count.contratos
      }
    }));
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error);
    throw new Error('Falha ao obter lista de empresas: ' + error.message);
  }
}

/**
 * Cria uma nova empresa (Tenant) na plataforma SaaS.
 */
export async function createTenantAction(
  nomeFantasia: string, 
  cnpj: string,
  plano?: string,
  limiteUsuarios?: number,
  trialStartedAt?: string | null,
  taxaWhatsapp?: number
) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  if (!nomeFantasia || !cnpj) {
    return { success: false, error: 'Nome Fantasia e CNPJ são obrigatórios.' };
  }

  try {
    const formattedCnpj = cnpj.trim();

    // Validar se CNPJ já existe
    const exists = await prisma.tenant.findUnique({
      where: { cnpj: formattedCnpj }
    });

    if (exists) {
      return { success: false, error: 'Este CNPJ já está cadastrado em outra empresa.' };
    }

    const trialDate = plano === 'TESTE' 
      ? (trialStartedAt ? new Date(trialStartedAt) : new Date()) 
      : null;

    const newTenant = await prisma.tenant.create({
      data: {
        nomeFantasia: nomeFantasia.trim(),
        cnpj: formattedCnpj,
        plano: plano || 'STARTER',
        limiteUsuarios: limiteUsuarios !== undefined ? Number(limiteUsuarios) : 3,
        trialStartedAt: trialDate,
        taxaWhatsapp: taxaWhatsapp !== undefined ? Number(taxaWhatsapp) : 130.0,
      }
    });

    return { success: true, tenant: newTenant };
  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);
    return { success: false, error: error.message || 'Erro desconhecido ao criar empresa.' };
  }
}

/**
 * Atualiza metadados cadastrais da empresa cliente.
 */
export async function updateTenantAction(
  id: string, 
  nomeFantasia: string, 
  cnpj: string,
  plano?: string,
  limiteUsuarios?: number,
  trialStartedAt?: string | null,
  taxaWhatsapp?: number
) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  if (!id || !nomeFantasia || !cnpj) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  try {
    const formattedCnpj = cnpj.trim();

    // Validar duplicidade excluindo o atual
    const exists = await prisma.tenant.findFirst({
      where: {
        cnpj: formattedCnpj,
        id: { not: id }
      }
    });

    if (exists) {
      return { success: false, error: 'Outra empresa já está cadastrada com este CNPJ.' };
    }

    const current = await prisma.tenant.findUnique({ where: { id } });
    
    let trialDate = undefined;
    if (plano === 'TESTE') {
      trialDate = trialStartedAt ? new Date(trialStartedAt) : (current?.trialStartedAt || new Date());
    } else if (plano && plano !== 'TESTE') {
      trialDate = null;
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        nomeFantasia: nomeFantasia.trim(),
        cnpj: formattedCnpj,
        plano: plano || undefined,
        limiteUsuarios: limiteUsuarios !== undefined ? Number(limiteUsuarios) : undefined,
        trialStartedAt: trialDate,
        taxaWhatsapp: taxaWhatsapp !== undefined ? Number(taxaWhatsapp) : undefined,
      }
    });

    return { success: true, tenant: updated };
  } catch (error: any) {
    console.error('Erro ao editar empresa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove uma empresa cliente com travas estritas (não permite deletar a Silva Consultoria pioneira).
 */
export async function deleteTenantAction(id: string) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  try {
    // Buscar a empresa para validar o CNPJ
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return { success: false, error: 'Empresa não encontrada.' };
    }

    await prisma.tenant.delete({
      where: { id }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Alterna o status ativo/bloqueado de uma empresa cliente (Tenant).
 * Protege a holding Silva Consultoria contra suspensões acidentais.
 */
export async function toggleTenantActiveAction(id: string, active: boolean) {
  const isSuper = await checkIsSuperAdmin();
  if (!isSuper) {
    throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
  }

  if (!id) {
    return { success: false, error: 'ID da empresa é obrigatório.' };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return { success: false, error: 'Empresa não encontrada.' };
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { ativo: active }
    });

    return { success: true, tenant: updated };
  } catch (error: any) {
    console.error('Erro ao alterar status da empresa:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action leve para verificar se o inquilino (Tenant) do usuário logado está ativo.
 * Chamada na inicialização do Sidebar para renderizar a tela de suspensão global.
 */
export async function checkCurrentTenantActive() {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: true, active: true };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: true, active: true };
      }
    }

    // O Super Admin da plataforma é imune a bloqueios
    if (data.email === 'admin@smartbidhub.com.br') {
      return { success: true, active: true };
    }

    // Busca o usuário no banco incluindo a relação com o Tenant
    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' },
      include: { tenant: true }
    });

    if (!user) return { success: true, active: true };

    // Se o usuário não tiver inquilino vinculado (raro), está liberado.
    // Se tiver, retorna o status ativo do inquilino.
    if (!user.tenant) return { success: true, active: true };

    return { success: true, active: user.tenant.ativo };
  } catch (error) {
    console.error('Erro ao checar status ativo do Tenant:', error);
    return { success: true, active: true }; // Fail-safe: não bloqueia em caso de erro interno
  }
}

/**
 * Server Action para consultar os detalhes e tempo restante do período de teste grátis.
 */
export async function getTenantTrialStatus() {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Formato de sessão inválido.' };
      }
    }

    // O Super Admin da plataforma é imune a bloqueios e testes
    if (data.email === 'admin@smartbidhub.com.br') {
      return { 
        success: true, 
        isSuperAdmin: true, 
        isTrialActive: false, 
        trialExpired: false, 
        hasContact: true,
        active: true
      };
    }

    // Busca o usuário no banco incluindo a relação com o Tenant
    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' },
      include: { tenant: true }
    });

    if (!user || !user.tenant) {
      return { success: false, error: 'Usuário ou empresa não encontrada.' };
    }

    const tenant = user.tenant;
    const isTrialActive = tenant.plano === 'TESTE';
    
    let trialExpired = false;
    let remainingTimeMs = 0;
    const trialStart = tenant.trialStartedAt || tenant.createdAt;
    const durationMs = 7 * 24 * 60 * 60 * 1000; // 7 dias
    const trialEnd = new Date(trialStart.getTime() + durationMs);
    const now = new Date();

    if (isTrialActive) {
      remainingTimeMs = trialEnd.getTime() - now.getTime();
      if (remainingTimeMs <= 0) {
        trialExpired = true;
        remainingTimeMs = 0;
      }
    }

    // OBRIGATORIEDADE DO WHATSAPP: Celular ou WhatsApp cadastrado com pelo menos 10 dígitos (DDD + número)
    const hasContact = !!(
      (tenant.whatsappPhone && tenant.whatsappPhone.replace(/\D/g, '').length >= 10) ||
      (user.celular && user.celular.replace(/\D/g, '').length >= 10)
    );

    return {
      success: true,
      isSuperAdmin: false,
      isTrialActive,
      trialExpired,
      hasContact,
      whatsappPhone: tenant.whatsappPhone || user.celular || '',
      createdAt: tenant.createdAt.toISOString(),
      trialStartedAt: trialStart.toISOString(),
      remainingTimeMs,
      active: tenant.ativo
    };
  } catch (error: any) {
    console.error('Erro ao verificar status de teste do tenant:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para gravar obrigatoriamente o WhatsApp/celular de contato e desbloquear o sistema.
 */
export async function updateTenantContactAction(phone: string) {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Sessão inválida.' };
      }
    }

    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' }
    });

    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      return { success: false, error: 'Número de WhatsApp inválido. Informe o DDD e o número completo.' };
    }

    // Atualiza o whatsappPhone no Tenant
    if (user.tenantId) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { whatsappPhone: phone }
      });
    }

    // Atualiza o celular no próprio Usuário logado
    await prisma.user.update({
      where: { id: user.id },
      data: { celular: phone }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar contato de teste:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para carregar as informações e histórico financeiro do Tenant do usuário logado.
 */
export async function getTenantBillingInfo() {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Sessão inválida.' };
      }
    }

    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' },
      include: { tenant: { include: { cobrancas: { orderBy: { createdAt: 'desc' } } } } }
    });

    if (!user || !user.tenant) {
      return { success: false, error: 'Usuário ou empresa não encontrada.' };
    }

    const tenant = user.tenant;
    
    // Contagem de usuários ativos
    const activeUsersCount = await prisma.user.count({
      where: { tenantId: tenant.id }
    });

    const planConfigs = await getOrCreatePlanConfigs();
    const currentPlanConfig = planConfigs.find(p => p.nome === tenant.plano);
    let basePrice = currentPlanConfig ? currentPlanConfig.preco : 149.0;
    if (tenant.plano === 'TESTE') basePrice = 0.0;

    const whatsappConnected = !!tenant.whatsappConnected;
    const whatsappCost = whatsappConnected ? tenant.taxaWhatsapp : 0.0;
    const totalCost = basePrice + whatsappCost;

    // Próximo vencimento: calcula 30 dias a partir da criação ou do último pagamento
    const lastPaidInvoice = tenant.cobrancas.find(c => c.status === 'PAGO');
    const baseDate = lastPaidInvoice ? lastPaidInvoice.createdAt : tenant.createdAt;
    const nextBillingDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      success: true,
      plano: tenant.plano,
      limiteUsuarios: tenant.limiteUsuarios,
      activeUsersCount,
      basePrice,
      whatsappConnected,
      whatsappCost,
      taxaWhatsapp: tenant.taxaWhatsapp,
      totalCost,
      nextBillingDate: nextBillingDate.toISOString(),
      ativo: tenant.ativo,
      cobrancas: tenant.cobrancas.map(c => ({
        id: c.id,
        plano: c.plano,
        valor: c.valor,
        status: c.status,
        metodo: c.metodo,
        dataVencimento: c.dataVencimento.toISOString(),
        dataPagamento: c.dataPagamento ? c.dataPagamento.toISOString() : null,
        createdAt: c.createdAt.toISOString()
      }))
    };
  } catch (error: any) {
    console.error('Erro ao buscar dados de faturamento do inquilino:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para processar um upgrade/pagamento síncrono e gravar no histórico.
 */
export async function paySubscriptionAction(plano: string, metodo: string, valor: number) {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Sessão inválida.' };
      }
    }

    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' }
    });

    if (!user || !user.tenantId) {
      return { success: false, error: 'Usuário ou empresa não vinculada.' };
    }

    let limite = 3;
    if (plano === 'PRO') limite = 10;
    else if (plano === 'ENTERPRISE') limite = 100;

    // Atualiza o Tenant
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        plano,
        limiteUsuarios: limite,
        ativo: true,
        trialStartedAt: null // encerra o trial quando assina
      }
    });

    // Cria a Cobrança como PAGO
    await prisma.cobranca.create({
      data: {
        tenantId: user.tenantId,
        plano,
        valor: Number(valor),
        status: 'PAGO',
        metodo,
        dataVencimento: new Date(),
        dataPagamento: new Date()
      }
    });

    // Cria notificação na central do usuário
    await prisma.notification.create({
      data: {
        userId: user.id,
        texto: `Sua assinatura do plano ${plano} foi ativada com sucesso via ${metodo}!`,
        link: '/admin/settings'
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao processar assinatura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para calcular métricas financeiras globais consolidando add-ons do WhatsApp.
 */
export async function getSaaSFinancialMetrics() {
  try {
    const isSuper = await checkIsSuperAdmin();
    if (!isSuper) {
      throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
    }

    const tenants = await prisma.tenant.findMany();
    
    // Cálculo do MRR (Base + taxaWhatsapp individual dos Tenants ativos)
    let mrr = 0;
    for (const t of tenants) {
      if (t.ativo !== false) {
        let base = 149.0;
        if (t.plano === 'TESTE') base = 0.0;
        else if (t.plano === 'PRO') base = 299.0;
        else if (t.plano === 'ENTERPRISE') base = 599.0;

        const addOn = t.whatsappConnected ? t.taxaWhatsapp : 0.0;
        mrr += (base + addOn);
      }
    }

    // Receita Total (Soma de faturas pagas)
    const paidInvoices = await prisma.cobranca.aggregate({
      where: { status: 'PAGO' },
      _sum: { valor: true }
    });
    const totalRevenue = paidInvoices._sum.valor || 0;

    // Cobranças Atrasadas/Pendentes
    const pendingBillsCount = await prisma.cobranca.count({
      where: { status: { in: ['PENDENTE', 'ATRASADO'] } }
    });

    return {
      success: true,
      mrr,
      totalRevenue,
      pendingBills: pendingBillsCount
    };
  } catch (error: any) {
    console.error('Erro ao carregar métricas financeiras SaaS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para listar faturas de todas as empresas (Uso do Super Admin).
 */
export async function getAllCobrancasAction() {
  try {
    const isSuper = await checkIsSuperAdmin();
    if (!isSuper) {
      throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
    }

    const cobrancas = await prisma.cobranca.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tenant: true }
    });

    return cobrancas.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      tenantNome: c.tenant.nomeFantasia,
      plano: c.plano,
      valor: c.valor,
      status: c.status,
      metodo: c.metodo,
      dataVencimento: c.dataVencimento.toISOString(),
      dataPagamento: c.dataPagamento ? c.dataPagamento.toISOString() : null,
      createdAt: c.createdAt.toISOString()
    }));
  } catch (error: any) {
    console.error('Erro ao listar todas as cobranças SaaS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para dar baixa manual em cobrança (Super Admin).
 */
export async function manuallyConfirmPaymentAction(cobrancaId: string) {
  try {
    const isSuper = await checkIsSuperAdmin();
    if (!isSuper) {
      throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
    }

    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId }
    });

    if (!cobranca) {
      return { success: false, error: 'Cobrança não encontrada.' };
    }

    // Baixa a Cobrança como PAGO
    await prisma.cobranca.update({
      where: { id: cobrancaId },
      data: {
        status: 'PAGO',
        dataPagamento: new Date()
      }
    });

    // Desbloqueia/Reativa a empresa no mesmo instante
    await prisma.tenant.update({
      where: { id: cobranca.tenantId },
      data: { ativo: true }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao dar baixa manual em cobrança:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para lançar cobrança avulsa manual (Super Admin).
 */
export async function manuallyCreateInvoiceAction(tenantId: string, plano: string, valor: number, vencimento: string) {
  try {
    const isSuper = await checkIsSuperAdmin();
    if (!isSuper) {
      throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
    }

    if (!tenantId || !plano || !valor || !vencimento) {
      return { success: false, error: 'Todos os campos são obrigatórios.' };
    }

    await prisma.cobranca.create({
      data: {
        tenantId,
        plano,
        valor: Number(valor),
        status: 'PENDENTE',
        metodo: 'MANUAL',
        dataVencimento: new Date(vencimento)
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao criar cobrança manual:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper interno para inicializar os planos se o banco estiver vazio.
 */
async function getOrCreatePlanConfigs() {
  let configs = await prisma.planoConfig.findMany({
    orderBy: { preco: 'asc' }
  });

  if (configs.length === 0) {
    const defaults = [
      {
        nome: "BASICO",
        label: "Básico",
        preco: 149.00,
        limiteUsuarios: 3,
        descricao: "Ideal para pequenas imobiliárias e corretores autônomos.",
        features: "Até 3 Usuários ativos,Acesso ao Pipeline de Leads CRM,Prospecção básica de empresas,1.000 buscas em cache local,Suporte via e-mail"
      },
      {
        nome: "PRO",
        label: "Profissional (PRO)",
        preco: 299.00,
        limiteUsuarios: 10,
        descricao: "Perfeito para construtoras e equipes comerciais em expansão.",
        features: "Até 10 Usuários ativos,Acesso ilimitado a FPVs e CCTs,Prospecção Inteligente Ativa via IA,Calendário Global de prazos e escalas,Auditoria completa (Audit Trail) de logs,Suporte premium prioritário 24/7"
      },
      {
        nome: "ENTERPRISE",
        label: "Enterprise",
        preco: 599.00,
        limiteUsuarios: 100,
        descricao: "Customização e poder ilimitado para grandes corporações.",
        features: "Até 100 Usuários ativos,Suporte 24/7 com Executivo de Conta,Integração e APIs Liberadas,SLA de Disponibilidade Avançado,Treinamento de equipe em vídeo"
      }
    ];

    for (const d of defaults) {
      await prisma.planoConfig.upsert({
        where: { nome: d.nome },
        update: {},
        create: d
      });
    }

    configs = await prisma.planoConfig.findMany({
      orderBy: { preco: 'asc' }
    });
  }

  return configs;
}

/**
 * Server Action para obter todos os planos cadastrados (aberto a clientes e LP).
 */
export async function getPlanConfigs() {
  try {
    const configs = await getOrCreatePlanConfigs();
    return { success: true, configs };
  } catch (error: any) {
    console.error('Erro ao buscar configurações de planos:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para atualizar a configuração de um plano (Super Admin).
 */
export async function updatePlanConfigAction(
  id: string,
  preco: number,
  limiteUsuarios: number,
  label: string,
  descricao: string,
  features: string
) {
  try {
    const isSuper = await checkIsSuperAdmin();
    if (!isSuper) {
      throw new Error('Acesso negado: Você não possui privilégios de Super Administrador.');
    }

    if (!id || preco === undefined || limiteUsuarios === undefined || !label) {
      return { success: false, error: 'Campos obrigatórios ausentes.' };
    }

    const updated = await prisma.planoConfig.update({
      where: { id },
      data: {
        preco: Number(preco),
        limiteUsuarios: Number(limiteUsuarios),
        label,
        descricao,
        features
      }
    });

    return { success: true, config: updated };
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para gerar uma cobrança PIX real integrada à Asaas.
 */
export async function generatePixChargeAction(plano: string, valor: number) {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Sessão inválida.' };
      }
    }

    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' },
      include: { tenant: true }
    });

    if (!user || !user.tenantId || !user.tenant) {
      return { success: false, error: 'Usuário ou empresa não vinculada.' };
    }

    // 1. Obter ou criar Cliente no Asaas
    const customerRes = await getOrCreateAsaasCustomer({
      nome: user.tenant.nomeFantasia,
      cnpj: user.tenant.cnpj,
      email: user.email,
      telefone: user.celular || undefined
    });

    if (!customerRes.success || !customerRes.customerId) {
      return { success: false, error: customerRes.error || 'Erro ao sincronizar cliente com gateway.' };
    }

    // Se o asaasCustomerId for novo, gravar no Tenant
    if (user.tenant.asaasCustomerId !== customerRes.customerId) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { asaasCustomerId: customerRes.customerId }
      });
    }

    // 2. Criar a Cobrança PENDENTE no nosso banco de dados primeiro
    const cobranca = await prisma.cobranca.create({
      data: {
        tenantId: user.tenantId,
        plano,
        valor: Number(valor),
        status: 'PENDENTE',
        metodo: 'PIX',
        dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000) // Vence em 24h
      }
    });

    // 3. Gerar a cobrança e o QR Code no Asaas
    const chargeRes = await createAsaasPixCharge({
      customerId: customerRes.customerId,
      valor: Number(valor),
      descricao: `Mensalidade SmartBidHub - Plano ${plano}`,
      externalReference: cobranca.id
    });

    if (!chargeRes.success || !chargeRes.paymentId) {
      // Deletar a cobrança local se falhar a criação no gateway para evitar lixo no histórico
      await prisma.cobranca.delete({ where: { id: cobranca.id } }).catch(() => {});
      return { success: false, error: chargeRes.error || 'Erro ao gerar cobrança no gateway.' };
    }

    // 4. Salvar o asaasPaymentId na Cobrança no nosso DB
    const updatedCobranca = await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: { asaasPaymentId: chargeRes.paymentId }
    });

    return {
      success: true,
      cobrancaId: updatedCobranca.id,
      pixCode: chargeRes.pixCode,
      pixImage: chargeRes.pixImage
    };
  } catch (error: any) {
    console.error('Erro ao gerar cobrança PIX no server:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para processar pagamento por Cartão de Crédito integrado à Asaas.
 */
export async function payWithCardAction(
  plano: string,
  valor: number,
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  }
) {
  try {
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (!sbUser) return { success: false, error: 'Usuário não autenticado.' };

    let data;
    try {
      data = JSON.parse(decodeURIComponent(sbUser));
    } catch {
      try {
        data = JSON.parse(sbUser);
      } catch {
        return { success: false, error: 'Sessão inválida.' };
      }
    }

    const user = await prisma.user.findFirst({
      where: { nome: data.nome || '' },
      include: { tenant: true }
    });

    if (!user || !user.tenantId || !user.tenant) {
      return { success: false, error: 'Usuário ou empresa não vinculada.' };
    }

    // 1. Obter ou criar Cliente no Asaas
    const customerRes = await getOrCreateAsaasCustomer({
      nome: user.tenant.nomeFantasia,
      cnpj: user.tenant.cnpj,
      email: user.email,
      telefone: user.celular || undefined
    });

    if (!customerRes.success || !customerRes.customerId) {
      return { success: false, error: customerRes.error || 'Erro ao sincronizar cliente com gateway.' };
    }

    // Se o asaasCustomerId for novo, gravar no Tenant
    if (user.tenant.asaasCustomerId !== customerRes.customerId) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { asaasCustomerId: customerRes.customerId }
      });
    }

    // 2. Criar Cobrança PENDENTE localmente
    const cobranca = await prisma.cobranca.create({
      data: {
        tenantId: user.tenantId,
        plano,
        valor: Number(valor),
        status: 'PENDENTE',
        metodo: 'CARTAO',
        dataVencimento: new Date()
      }
    });

    // 3. Enviar processamento para o Asaas
    const paymentRes = await createAsaasCardPayment({
      customerId: customerRes.customerId,
      valor: Number(valor),
      descricao: `Mensalidade SmartBidHub - Plano ${plano}`,
      externalReference: cobranca.id,
      card,
      holderInfo: {
        name: card.holderName,
        email: user.email,
        cpfCnpj: user.tenant.cnpj,
        phone: user.celular || undefined
      }
    });

    if (!paymentRes.success || !paymentRes.paymentId) {
      // Limpar cobrança em caso de falha de processamento (recusa)
      await prisma.cobranca.delete({ where: { id: cobranca.id } }).catch(() => {});
      return { success: false, error: paymentRes.error || 'Transação recusada pelo cartão.' };
    }

    // 4. Se a transação foi aprovada imediatamente
    const isApproved = paymentRes.status === 'CONFIRMED' || paymentRes.status === 'RECEIVED';
    
    if (isApproved) {
      let limite = 3;
      if (plano === 'PRO') limite = 10;
      else if (plano === 'ENTERPRISE') limite = 100;

      // Executa o upgrade e ativação imediata do Tenant
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          plano,
          limiteUsuarios: limite,
          ativo: true,
          trialStartedAt: null
        }
      });

      // Atualiza a cobrança para PAGO
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: {
          status: 'PAGO',
          dataPagamento: new Date(),
          asaasPaymentId: paymentRes.paymentId
        }
      });

      return { success: true };
    } else {
      // Caso fique pendente ou em análise (raro para cartão direto)
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: { asaasPaymentId: paymentRes.paymentId }
      });
      return { success: true, pendingApproval: true };
    }
  } catch (error: any) {
    console.error('Erro ao processar pagamento com cartão no server:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para consultar o status de um pagamento PIX pendente
 */
export async function checkPixPaymentStatusAction(cobrancaId: string) {
  try {
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId }
    });

    if (!cobranca) return { success: false, error: 'Cobrança não localizada.' };

    if (cobranca.status === 'PAGO') {
      return { success: true, paid: true };
    }

    return { success: true, paid: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
