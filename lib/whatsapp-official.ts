import { prisma } from '@/lib/prisma';

const OFFICIAL_RECORD_KEY = 'SYSTEM_OFFICIAL_ZAPI';
export const DEFAULT_OFFICIAL_INSTANCE_ID = '3FBF908DFD12A351AE6426CDA0686E76';
export const DEFAULT_OFFICIAL_TOKEN = '142FFA134AED5586293C4918';
export const DEFAULT_OFFICIAL_CLIENT_TOKEN = 'F5c1b8f27f6b049c98c4e779d00f67552S';

function getZApiHeaders(clientToken: string) {
  return {
    'Content-Type': 'application/json',
    'Client-Token': clientToken,
  };
}

export function normalizeBrazilPhone(rawPhone: string): string {
  const clean = (rawPhone || '').replace(/\D/g, '');
  if (!clean) return '';
  if (clean.length >= 10 && clean.length <= 11 && !clean.startsWith('55')) {
    return `55${clean}`;
  }
  return clean;
}

/**
 * Resolve as credenciais da Instância Central Oficial da SmartBidHub para notificações transacionais
 * (Proposta Aprovada, Proposta Recusada, Solicitação de Ajuste, Publicação de Ata de Reunião).
 *
 * Prioridade:
 * 1. Registro Central Oficial salvo no banco pelo Super Admin (`SYSTEM_OFFICIAL_ZAPI`)
 * 2. Variáveis de ambiente globais (`ZAPI_OFFICIAL_INSTANCE_ID`, `ZAPI_OFFICIAL_TOKEN`, `ZAPI_OFFICIAL_CLIENT_TOKEN`)
 * 3. Fallback temporário para a instância do Tenant (somente enquanto a instância oficial ainda não estiver ativa/configurada)
 */
export async function resolveOfficialZApiCredentials(fallbackTenantId?: string | null): Promise<{
  instanceId: string | null;
  token: string | null;
  clientToken: string | null;
  source: 'official_db' | 'official_env' | 'tenant_fallback' | 'none';
}> {
  try {
    const dbRecord = await prisma.smtpAccount.findFirst({
      where: {
        nome: OFFICIAL_RECORD_KEY,
        isSystem: false,
      },
    });

    if (
      dbRecord &&
      dbRecord.active &&
      dbRecord.host?.trim() &&
      dbRecord.user?.trim() &&
      dbRecord.password?.trim()
    ) {
      return {
        instanceId: dbRecord.host.trim(),
        token: dbRecord.user.trim(),
        clientToken: dbRecord.password.trim(),
        source: 'official_db',
      };
    }

    const envInstanceId = (process.env.ZAPI_OFFICIAL_INSTANCE_ID || DEFAULT_OFFICIAL_INSTANCE_ID).trim();
    const envToken = (process.env.ZAPI_OFFICIAL_TOKEN || DEFAULT_OFFICIAL_TOKEN).trim();
    const envClientToken = (
      process.env.ZAPI_OFFICIAL_CLIENT_TOKEN ||
      process.env.ZAPI_CLIENT_TOKEN ||
      DEFAULT_OFFICIAL_CLIENT_TOKEN
    ).trim();

    if (envInstanceId && envToken && envClientToken) {
      return {
        instanceId: envInstanceId,
        token: envToken,
        clientToken: envClientToken,
        source: 'official_env',
      };
    }

    if (fallbackTenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: fallbackTenantId },
        select: {
          whatsappInstanceId: true,
          whatsappToken: true,
          whatsappClientToken: true,
          whatsappConnected: true,
        },
      });

      if (
        tenant &&
        tenant.whatsappConnected &&
        tenant.whatsappInstanceId &&
        tenant.whatsappToken &&
        tenant.whatsappClientToken
      ) {
        return {
          instanceId: tenant.whatsappInstanceId,
          token: tenant.whatsappToken,
          clientToken: tenant.whatsappClientToken,
          source: 'tenant_fallback',
        };
      }
    }
  } catch (err) {
    console.error('Erro ao resolver credenciais do WhatsApp Oficial SmartBid:', err);
  }

  return {
    instanceId: null,
    token: null,
    clientToken: null,
    source: 'none',
  };
}

/**
 * Dispara uma notificação transacional oficial do sistema (Propostas, Atas, Alertas)
 * usando sempre o número central oficial da SmartBidHub quando configurado.
 */
export async function sendOfficialWhatsAppNotification(params: {
  phone: string;
  message: string;
  fallbackTenantId?: string | null;
}): Promise<{
  success: boolean;
  source?: string;
  messageId?: string;
  error?: string;
}> {
  const cleanPhone = normalizeBrazilPhone(params.phone);
  if (!cleanPhone) {
    return { success: false, error: 'Número de telefone inválido ou vazio.' };
  }

  const creds = await resolveOfficialZApiCredentials(params.fallbackTenantId);
  if (!creds.instanceId || !creds.token || !creds.clientToken) {
    return {
      success: false,
      error: 'Nenhuma instância central oficial do WhatsApp SmartBid configurada no momento.',
    };
  }

  try {
    const url = `https://api.z-api.io/instances/${creds.instanceId}/token/${creds.token}/send-text`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getZApiHeaders(creds.clientToken),
      body: JSON.stringify({
        phone: cleanPhone,
        message: params.message,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        source: creds.source,
        error: data?.error || data?.message || `Erro HTTP ${response.status} na Z-API`,
      };
    }

    return {
      success: true,
      source: creds.source,
      messageId: data?.messageId || data?.zapiMessageId,
    };
  } catch (err: any) {
    console.error('Erro ao enviar notificação via WhatsApp Oficial SmartBid:', err);
    return {
      success: false,
      source: creds.source,
      error: err?.message || 'Erro de comunicação com a Z-API',
    };
  }
}
