'use server';
 
import { prisma } from '@/lib/prisma';
import { getLoggedUser } from '@/app/propostas/actions';
import { revalidatePath } from 'next/cache';
 
// HELPER: Retorna o cabeçalho base da Z-API
function getZApiHeaders(clientToken: string) {
  return {
    'Content-Type': 'application/json',
    'Client-Token': clientToken
  };
}
 
/**
 * 1. Obter o status de conexão real do WhatsApp da empresa
 */
export async function getWhatsAppConnectionStatus() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Usuário não autenticado ou sem empresa vinculada.' };
  }
 
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        whatsappInstanceId: true,
        whatsappToken: true,
        whatsappClientToken: true,
        whatsappConnected: true,
        whatsappPhone: true
      }
    });
 
    if (!tenant || !tenant.whatsappInstanceId || !tenant.whatsappToken || !tenant.whatsappClientToken) {
      return { 
        success: true, 
        connected: false, 
        message: 'Nenhum canal de WhatsApp configurado ainda.' 
      };
    }
 
    // Fazer chamada para a Z-API verificar o status real
    const url = `https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/status`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getZApiHeaders(tenant.whatsappClientToken),
        // Pequeno timeout para não travar a aplicação caso a API esteja instável
        signal: AbortSignal.timeout(5000)
      });
 
      if (response.ok) {
        const data = await response.json();
        
        // Z-API retorna "connected" como booleano
        const isConnected = !!data.connected;
        const phone = data.phone || tenant.whatsappPhone;
 
        // Se mudou o status em relação ao nosso banco, sincroniza!
        if (tenant.whatsappConnected !== isConnected || tenant.whatsappPhone !== phone) {
          await prisma.tenant.update({
            where: { id: user.tenantId },
            data: {
              whatsappConnected: isConnected,
              whatsappPhone: isConnected ? phone : null
            }
          });
        }
 
        return { 
          success: true, 
          connected: isConnected, 
          phone: isConnected ? phone : null,
          instanceId: tenant.whatsappInstanceId 
        };
      }
    } catch (apiError) {
      console.warn('Erro ao consultar Z-API. Retornando dados salvos no cache:', apiError);
    }
 
    // Em caso de erro na chamada da API, retorna o que temos em cache
    return { 
      success: true, 
      connected: tenant.whatsappConnected, 
      phone: tenant.whatsappPhone,
      instanceId: tenant.whatsappInstanceId 
    };
 
  } catch (error: any) {
    console.error('getWhatsAppConnectionStatus error:', error);
    return { success: false, error: error.message };
  }
}
 
/**
 * 2. Criar ou Vincular uma Instância de WhatsApp on-demand para o Tenant
 */
export async function connectWhatsAppInstance() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Não autorizado.' };
  }
 
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    });
 
    if (!tenant) return { success: false, error: 'Empresa não encontrada.' };
 
    // Se o cliente já possui uma instância salva, retornamos ela
    if (tenant.whatsappInstanceId && tenant.whatsappToken && tenant.whatsappClientToken) {
      return { 
        success: true, 
        message: 'Instância já existente carregada com sucesso.',
        instanceId: tenant.whatsappInstanceId
      };
    }
 
    const partnerToken = process.env.ZAPI_PARTNER_TOKEN;
 
    if (partnerToken) {
      // --- MODO PRODUÇÃO / AUTOMATIZADO COM CONTA PARCEIRA ---
      console.log(`Criando nova instância Z-API para o Tenant: ${tenant.nomeFantasia}`);
      
      const createUrl = 'https://api.z-api.io/instances/integrator/on-demand';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${partnerToken}`
        },
        body: JSON.stringify({
          name: `CRM SmartBid: ${tenant.nomeFantasia.substring(0, 20)}`
        })
      });
 
      if (!createRes.ok) {
        const errData = await createRes.json();
        return { success: false, error: errData.message || 'Erro ao criar instância na Z-API.' };
      }
 
      const newInstance = await createRes.json();
      
      // Salva as credenciais criadas no banco de dados do Tenant
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          whatsappInstanceId: newInstance.instanceId,
          whatsappToken: newInstance.token,
          whatsappClientToken: newInstance.clientToken,
          whatsappConnected: false
        }
      });
 
      // Configurar o webhook de recebimento de mensagens dinamicamente na nova instância
      const webhookUrl = `https://api.z-api.io/instances/${newInstance.instanceId}/token/${newInstance.token}/webhooks`;
      // O webhook aponta de volta para o nosso servidor incluindo o tenantId na Query String
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartbidhub.com.br';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: getZApiHeaders(newInstance.clientToken),
        body: JSON.stringify({
          // Z-API envia todas as callbacks para este endereço
          messageCallbackUrl: `${baseUrl}/api/webhooks/zapi?tenantId=${user.tenantId}`,
          connectedCallbackUrl: `${baseUrl}/api/webhooks/zapi?tenantId=${user.tenantId}`,
          disconnectedCallbackUrl: `${baseUrl}/api/webhooks/zapi?tenantId=${user.tenantId}`,
          statusCallbackUrl: `${baseUrl}/api/webhooks/zapi?tenantId=${user.tenantId}`
        })
      });
 
      revalidatePath('/admin/settings');
      return { 
        success: true, 
        instanceId: newInstance.instanceId, 
        message: 'Nova instância provisionada com sucesso.' 
      };
 
    } else {
      // --- MODO DESENVOLVIMENTO / TESTE (FALLBACK DO CRISTIANO) ---
      // Se não temos um Partner Token, vinculamos as chaves padrão do .env 
      // para permitir testar a tela de QR Code e envios perfeitamente.
      console.log('ZAPI_PARTNER_TOKEN não configurado. Utilizando chaves padrão do .env para teste.');
      
      const envInstanceId = process.env.ZAPI_INSTANCE_ID;
      const envToken = process.env.ZAPI_TOKEN;
      const envClientToken = process.env.ZAPI_CLIENT_TOKEN;
 
      if (!envInstanceId || !envToken || !envClientToken) {
        return { 
          success: false, 
          error: 'Modo teste ativo, mas chaves Z-API globais não configuradas no arquivo .env.' 
        };
      }
 
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: {
          whatsappInstanceId: envInstanceId,
          whatsappToken: envToken,
          whatsappClientToken: envClientToken,
          whatsappConnected: false
        }
      });
 
      revalidatePath('/admin/settings');
      return { 
        success: true, 
        instanceId: envInstanceId, 
        message: 'Instância de testes vinculada com sucesso.' 
      };
    }
 
  } catch (error: any) {
    console.error('connectWhatsAppInstance error:', error);
    return { success: false, error: error.message };
  }
}
 
/**
 * 3. Buscar a imagem em Base64 do QR Code para exibição na UI
 */
export async function getWhatsAppQrCode() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Não autorizado.' };
  }
 
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        whatsappInstanceId: true,
        whatsappToken: true,
        whatsappClientToken: true
      }
    });
 
    if (!tenant || !tenant.whatsappInstanceId || !tenant.whatsappToken || !tenant.whatsappClientToken) {
      return { success: false, error: 'WhatsApp não inicializado para esta empresa.' };
    }
 
    const url = `https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/qr-code`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(tenant.whatsappClientToken)
    });
 
    if (response.ok) {
      const data = await response.json();
      // A Z-API retorna { value: "data:image/png;base64,..." } ou similar
      return { success: true, qrCode: data.value || data.qrCode };
    } else {
      const errData = await response.json();
      return { success: false, error: errData.message || 'QR Code não disponível. Certifique-se de que o aparelho não esteja conectado.' };
    }
 
  } catch (error: any) {
    console.error('getWhatsAppQrCode error:', error);
    return { success: false, error: error.message };
  }
}
 
/**
 * 4. Desconectar o WhatsApp da Instância (Desvincular Aparelho)
 */
export async function disconnectWhatsAppInstance() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    return { success: false, error: 'Não autorizado.' };
  }
 
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        whatsappInstanceId: true,
        whatsappToken: true,
        whatsappClientToken: true
      }
    });
 
    if (!tenant || !tenant.whatsappInstanceId || !tenant.whatsappToken || !tenant.whatsappClientToken) {
      return { success: false, error: 'Nenhuma conexão configurada para desconectar.' };
    }
 
    // Envia sinal de desconexão para a Z-API (deslogar o WhatsApp)
    const url = `https://api.z-api.io/instances/${tenant.whatsappInstanceId}/token/${tenant.whatsappToken}/disconnect`;
    try {
      await fetch(url, {
        method: 'GET',
        headers: getZApiHeaders(tenant.whatsappClientToken),
        signal: AbortSignal.timeout(5000)
      });
    } catch (apiError) {
      console.warn('Erro ao avisar a Z-API sobre desconexão. Prosseguindo com limpeza local:', apiError);
    }
 
    // Limpa a conexão do banco de dados (reseta o status, mas mantém as chaves para que possam reconectar escaneando de novo)
    // Se quiser apagar por completo a instância do banco para recriar do zero:
    // Nós podemos manter a whatsappInstanceId criada para evitar recriar instâncias pagas à toa e apenas desvincular!
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        whatsappConnected: false,
        whatsappPhone: null
        // Opcional: para forçar nova criação de instância, descomente abaixo:
        // whatsappInstanceId: null,
        // whatsappToken: null,
        // whatsappClientToken: null
      }
    });
 
    revalidatePath('/admin/settings');
    return { success: true, message: 'WhatsApp desconectado com sucesso!' };
 
  } catch (error: any) {
    console.error('disconnectWhatsAppInstance error:', error);
    return { success: false, error: error.message };
  }
}
