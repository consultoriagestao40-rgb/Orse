import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint de Webhook da Asaas
 * Recebe notificações assíncronas do gateway de pagamento.
 * POST /api/webhooks/asaas
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = req.headers.get('asaas-access-token');

    console.log('[Asaas Webhook] Evento recebido:', body.event, 'Payment ID:', body.payment?.id);

    // Validação de segurança opcional se o token estiver configurado
    const expectedToken = process.env.ASAAS_WEBHOOK_SECRET;
    if (expectedToken && token !== expectedToken) {
      console.warn('[Asaas Webhook] Token inválido recebido no header.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = body.event;
    const payment = body.payment;

    if (!payment) {
      return NextResponse.json({ success: true, message: 'No payment payload' });
    }

    const cobrancaId = payment.externalReference;
    const asaasPaymentId = payment.id;

    // Buscar a cobrança local correspondente
    const cobranca = await prisma.cobranca.findFirst({
      where: {
        OR: [
          { id: cobrancaId || '___invalid___' },
          { asaasPaymentId: asaasPaymentId || '___invalid___' }
        ]
      },
      include: { tenant: true }
    });

    if (!cobranca) {
      console.log('[Asaas Webhook] Cobrança não encontrada para externalReference:', cobrancaId, 'ou asaasPaymentId:', asaasPaymentId);
      return NextResponse.json({ success: true, message: 'Cobranca not found locally, ignored.' });
    }

    // ── 1. PAGAMENTO CONFIRMADO ────────────────────────────────────────────────
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log(`[Asaas Webhook] Confirmando pagamento para a empresa ${cobranca.tenant.nomeFantasia}...`);

      let limite = 3;
      // Obter cotas configuradas do banco
      const planConfig = await prisma.planoConfig.findUnique({
        where: { nome: cobranca.plano }
      });
      if (planConfig) {
        limite = planConfig.limiteUsuarios;
      } else {
        if (cobranca.plano === 'PRO') limite = 10;
        else if (cobranca.plano === 'ENTERPRISE') limite = 100;
      }

      // 1. Atualizar Tenant para Ativo, ajustar cotas e encerrar período de teste
      await prisma.tenant.update({
        where: { id: cobranca.tenantId },
        data: {
          plano: cobranca.plano,
          limiteUsuarios: limite,
          ativo: true,
          trialStartedAt: null
        }
      });

      // 2. Atualizar status da cobrança para PAGO
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: {
          status: 'PAGO',
          dataPagamento: new Date(),
          asaasPaymentId: asaasPaymentId,
          metodo: payment.billingType || cobranca.metodo
        }
      });

      console.log('[Asaas Webhook] Empresa ativada e faturamento liquidado com sucesso!');
    }

    // ── 2. PAGAMENTO ATRASADO (INADIMPLÊNCIA) ──────────────────────────────────
    else if (event === 'PAYMENT_OVERDUE') {
      console.log(`[Asaas Webhook] Alerta de fatura vencida para a empresa ${cobranca.tenant.nomeFantasia}. Suspendendo conta...`);

      // Atualizar o status da Cobrança para ATRASADO
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: { status: 'ATRASADO' }
      });

      // Suspender/Bloquear acesso do inquilino imediatamente
      await prisma.tenant.update({
        where: { id: cobranca.tenantId },
        data: { ativo: false }
      });

      console.log('[Asaas Webhook] Acesso suspenso com sucesso.');
    }

    // ── 3. COBRANÇA REMOVIDA OU DELETADA ─────────────────────────────────────
    else if (event === 'PAYMENT_DELETED') {
      console.log(`[Asaas Webhook] Cobrança #${cobranca.id} deletada no gateway.`);
      
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: { status: 'EXCLUIDA' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Asaas Webhook] Falha crítica ao processar webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
