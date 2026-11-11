import { prisma } from '@/lib/prisma';
import { sendOfficialWhatsAppNotification, normalizeBrazilPhone } from '@/lib/whatsapp-official';

const SUPER_ADMIN_EMAIL = 'cristiano@grupojvsserv.com.br';
const FOUNDER_WHATSAPP = '5541992823967';

export interface SaasLeadOnboardingParams {
  nome: string;
  empresa: string;
  email: string;
  celular: string;
  planoInteresse?: string | null;
  origem?: 'CADASTRO_TRIAL_30D' | 'LP_DEMONSTRACAO' | 'GOOGLE_AUTH';
  postos?: string | null;
}

/**
 * Registra o novo cliente/interessado do SmartBid automaticamente no CRM do Super Admin,
 * envia a mensagem de boas-vindas pelo WhatsApp Oficial para o cliente,
 * grava a mensagem na aba de WhatsApp do Lead no CRM e notifica o Cristiano.
 */
export async function processSaasTrialOnboarding(params: SaasLeadOnboardingParams) {
  const {
    nome,
    empresa,
    email,
    celular,
    planoInteresse,
    origem = 'CADASTRO_TRIAL_30D',
    postos,
  } = params;

  const primeiroNome = (nome || '').trim().split(' ')[0] || 'Gestor';
  const empresaNome = (empresa || '').trim() || 'Sua Empresa';
  const cleanPhone = normalizeBrazilPhone(celular);

  // 1. Monta a mensagem de boas-vindas oficial enviada para o WhatsApp do cliente
  const welcomeMessage =
    origem === 'LP_DEMONSTRACAO'
      ? `Olá, *${primeiroNome}*! Tudo bem? 👋\n\nRecebi aqui o seu pedido de demonstração do *SmartBid Hub* para a *${empresaNome}*.\n\nSou o *Cristiano Silva*, fundador do SmartBid. Você também já pode testar a plataforma completa gratuitamente por *30 dias*!\n\nQual o melhor horário hoje ou amanhã para eu te mostrar na prática como blindar sua margem e montar propostas em minutos?`
      : `Olá, *${primeiroNome}*! Seja muito bem-vindo(a) ao *SmartBid Hub*! 🚀\n\nO seu acesso de *30 dias de Teste Grátis* para a *${empresaNome}* já está liberado!\n\nSou o *Cristiano Silva*, fundador do SmartBid. Durante esses 30 dias você tem acesso completo para:\n✅ Cadastrar suas CCTs, funções e insumos\n✅ Montar suas planilhas de FPV com cálculo automático de encargos e tributos\n✅ Enviar propostas interativas por link com rastreamento de leitura em tempo real\n\nSe precisar de qualquer apoio para configurar sua primeira proposta ou quiser agendar uma consultoria rápida de implantação comigo, é só responder aqui neste WhatsApp!`;

  // 2. Dispara a mensagem de boas-vindas para o cliente via WhatsApp Oficial
  let whatsResult: { success: boolean; messageId?: string; error?: string } = { success: false };
  if (cleanPhone) {
    try {
      whatsResult = await sendOfficialWhatsAppNotification({
        phone: cleanPhone,
        message: welcomeMessage,
      });
    } catch (err) {
      console.error('Erro ao enviar WhatsApp de boas-vindas para novo cliente SmartBid:', err);
    }
  }

  // 3. Registra o Lead automaticamente no CRM do Super Admin (cristiano@grupojvsserv.com.br)
  try {
    const superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
    });

    if (superAdmin && superAdmin.tenantId) {
      const adminTenantId = superAdmin.tenantId;

      // Localiza o primeiro Pipeline e a primeira Etapa (Stage) do tenant do Super Admin
      let pipeline = await prisma.pipeline.findFirst({
        where: { tenantId: adminTenantId },
        include: { stages: { orderBy: { ordem: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      });

      let firstStage = pipeline?.stages?.[0] || null;
      if (!firstStage) {
        firstStage = await prisma.leadStage.findFirst({
          orderBy: { ordem: 'asc' },
        });
      }

      if (firstStage) {
        const valorEstimado =
          planoInteresse?.toUpperCase().includes('ENTERPRISE')
            ? 599
            : planoInteresse?.toUpperCase().includes('PRO')
            ? 299
            : 149;

        const tagLabel =
          origem === 'LP_DEMONSTRACAO' ? 'LP_DEMO_SMARTBID' : 'TRIAL_30_DIAS_SMARTBID';

        // Verifica se já existe um Lead com este e-mail ou telefone no CRM do Super Admin
        const phoneSuffix = cleanPhone.slice(-8);
        let existingLead = await prisma.lead.findFirst({
          where: {
            tenantId: adminTenantId,
            OR: [
              ...(email ? [{ email: email.toLowerCase().trim() }] : []),
              ...(phoneSuffix.length === 8 ? [{ telefone: { contains: phoneSuffix } }] : []),
            ],
          },
        });

        if (!existingLead) {
          existingLead = await prisma.lead.create({
            data: {
              nomeFantasia: `[SmartBid] ${empresaNome}`,
              razaoSocial: empresaNome,
              contatoNome: nome.trim(),
              email: email ? email.toLowerCase().trim() : null,
              telefone: cleanPhone || celular,
              segmento: 'SaaS SmartBid • Teste 30 Dias',
              valorEst: valorEstimado,
              stageId: firstStage.id,
              pipelineId: pipeline?.id || firstStage.pipelineId || null,
              assignedToId: superAdmin.id,
              tenantId: adminTenantId,
              tags: tagLabel,
              chatStatus: 'OPEN',
            },
          });

          await prisma.leadContact.create({
            data: {
              leadId: existingLead.id,
              nome: nome.trim(),
              telefone: cleanPhone || celular,
              email: email ? email.toLowerCase().trim() : null,
              cargo: 'Administrador (Trial 30 Dias)',
            },
          });
        }

        // Registra no histórico do Lead no CRM
        await prisma.leadHistory.create({
          data: {
            leadId: existingLead.id,
            tipo: 'PROSPECCAO',
            descricao:
              origem === 'LP_DEMONSTRACAO'
                ? `Solicitou demonstração na Landing Page (${planoInteresse || 'Geral'}${postos ? ` • Porte: ${postos}` : ''}). Mensagem automática de boas-vindas ${whatsResult.success ? 'enviada no WhatsApp' : 'registrada'}.`
                : `Cadastrou conta no Teste Grátis de 30 Dias do SmartBid${planoInteresse ? ` (Plano de interesse: ${planoInteresse})` : ''}. Mensagem automática de boas-vindas ${whatsResult.success ? 'enviada no WhatsApp' : 'registrada'}.`,
          },
        });

        // Grava a mensagem enviada na conversa de WhatsApp do Lead dentro do CRM
        await prisma.whatsAppMessage.create({
          data: {
            leadId: existingLead.id,
            userId: superAdmin.id,
            messageId: whatsResult.messageId || `welcome-${ existingLead.id }-${ Date.now() }`,
            texto: welcomeMessage,
            direction: 'OUTBOUND',
            status: whatsResult.success ? 'SENT' : 'DELIVERED',
          },
        });

        // Cria notificação no sininho do Super Admin com link direto para o CRM
        await prisma.notification.create({
          data: {
            userId: superAdmin.id,
            texto: `🚀 Novo cliente em Teste Grátis 30 Dias: ${empresaNome} (${nome.trim()} • ${celular})`,
            link: `/leads?leadId=${existingLead.id}`,
          },
        });
      }
    }
  } catch (crmErr) {
    console.error('Erro ao registrar novo Trial no CRM do Super Admin:', crmErr);
  }

  // 4. Notifica também o WhatsApp pessoal/oficial do Cristiano com o resumo do novo Lead
  try {
    const adminAlertMsg =
      `🎯 *NOVO CLIENTE NO TESTE GRÁTIS DE 30 DIAS — SMARTBID*\n\n` +
      `🏢 *Empresa:* ${empresaNome}\n` +
      `👤 *Nome:* ${nome.trim()}\n` +
      `📱 *WhatsApp:* ${celular}\n` +
      `✉️ *E-mail:* ${email || 'Não informado'}\n` +
      (planoInteresse ? `📦 *Plano:* ${planoInteresse}\n` : '') +
      (postos ? `📊 *Porte:* ${postos}\n` : '') +
      `\n✅ *Já cadastrado automaticamente no seu CRM de Leads e mensagem de boas-vindas enviada ao cliente!*`;

    await sendOfficialWhatsAppNotification({
      phone: FOUNDER_WHATSAPP,
      message: adminAlertMsg,
    });
  } catch (alertErr) {
    console.error('Erro ao enviar alerta de novo Trial para o fundador:', alertErr);
  }

  return {
    success: true,
    whatsappSent: whatsResult.success,
  };
}
