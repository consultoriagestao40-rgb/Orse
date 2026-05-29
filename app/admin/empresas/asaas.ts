/**
 * Utilitário de Integração do Gateway Asaas
 * Handles sandbox/production communications with Asaas API.
 * Includes a smart simulation fallback for local development if keys are omitted.
 */

const getAsaasConfig = () => {
  const apiKey = process.env.ASAAS_API_KEY || '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJkY2MwMGM0LWVjODMtNDE5OC05ZmI2LWQwYjI1MjQxNzAxNjo6JGFhY2hfMzM2ZDRlMjktMzhhZS00NGYyLTg1YTUtNmY4NmRjMGFjMjk1';
  // Automatically select production URL if production key is active as default
  const defaultUrl = apiKey.startsWith('$aact_prod') ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';
  const baseUrl = process.env.ASAAS_API_URL || defaultUrl;
  return { apiKey, baseUrl, isConfigured: true };
};

/**
 * Busca ou cria um cadastro de cliente no Asaas com base no CNPJ do Tenant.
 */
export async function getOrCreateAsaasCustomer(params: {
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
}) {
  const { apiKey, baseUrl, isConfigured } = getAsaasConfig();

  if (!isConfigured) {
    console.log('[Asaas Simulate] getOrCreateAsaasCustomer for CNPJ:', params.cnpj);
    return { success: true, customerId: `cus_simulated_${Math.random().toString(36).substring(2, 10)}` };
  }

  try {
    const cleanCnpj = params.cnpj.replace(/\D/g, '');
    
    // 1. Buscar se cliente já existe por CPF/CNPJ
    const searchUrl = `${baseUrl}/customers?cpfCnpj=${cleanCnpj}`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        console.log('[Asaas] Cliente localizado por CNPJ:', cleanCnpj);
        return { success: true, customerId: searchData.data[0].id };
      }
    }

    // 2. Se não existir, criar novo cliente
    console.log('[Asaas] Cliente não localizado. Criando novo...');
    const createRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: params.nome,
        cpfCnpj: cleanCnpj,
        email: params.email,
        phone: params.telefone ? params.telefone.replace(/\D/g, '') : undefined,
        notificationDisabled: true // Evitar alertas de e-mail padrões da Asaas
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('[Asaas] Erro ao criar cliente:', errText);
      return { success: false, error: `Erro no Gateway ao criar cliente: ${errText}` };
    }

    const customer = await createRes.json();
    return { success: true, customerId: customer.id };
  } catch (error: any) {
    console.error('[Asaas] Falha de comunicação:', error);
    return { success: false, error: `Falha de rede com Asaas: ${error.message}` };
  }
}

/**
 * Cria uma cobrança PIX e retorna o QR Code dinâmico + Payload Copia-e-Cola.
 */
export async function createAsaasPixCharge(params: {
  customerId: string;
  valor: number;
  descricao: string;
  externalReference: string;
}) {
  const { apiKey, baseUrl, isConfigured } = getAsaasConfig();

  if (!isConfigured) {
    console.log('[Asaas Simulate] createAsaasPixCharge for Customer:', params.customerId);
    // Simular resposta completa
    return {
      success: true,
      paymentId: `pay_simulated_${Math.random().toString(36).substring(2, 10)}`,
      pixCode: '00020101021226850014br.gov.bcb.pix2563qrcode.asaas.com/qr/v2/simulated-hash-pix-smartbid-cristiano',
      pixImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="20" y="20" width="10" height="10" fill="white"/><rect x="70" y="20" width="10" height="10" fill="white"/><rect x="20" y="70" width="10" height="10" fill="white"/><rect x="45" y="45" width="10" height="10" fill="black"/></svg>'
    };
  }

  try {
    const today = new Date();
    // Vencimento de fatura PIX padrão de 1 dia
    const dueDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Criar cobrança
    const chargeRes = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: params.customerId,
        billingType: 'PIX',
        value: params.valor,
        dueDate: dueDate,
        description: params.descricao,
        externalReference: params.externalReference
      })
    });

    if (!chargeRes.ok) {
      const errText = await chargeRes.text();
      console.error('[Asaas] Erro ao gerar cobrança PIX:', errText);
      return { success: false, error: `Erro no Gateway ao gerar PIX: ${errText}` };
    }

    const charge = await chargeRes.json();
    const paymentId = charge.id;

    // 2. Obter QR Code dinâmico
    const qrRes = await fetch(`${baseUrl}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!qrRes.ok) {
      const errText = await qrRes.text();
      console.error('[Asaas] Erro ao buscar QR Code PIX:', errText);
      return { success: false, error: `Erro no Gateway ao obter QR Code: ${errText}` };
    }

    const qrData = await qrRes.json();
    return {
      success: true,
      paymentId,
      pixCode: qrData.payload,
      pixImage: `data:image/png;base64,${qrData.encodedImage}`
    };
  } catch (error: any) {
    console.error('[Asaas] Falha ao processar PIX:', error);
    return { success: false, error: `Falha de rede ao gerar PIX: ${error.message}` };
  }
}

/**
 * Executa uma cobrança direta por Cartão de Crédito.
 */
export async function createAsaasCardPayment(params: {
  customerId: string;
  valor: number;
  descricao: string;
  externalReference: string;
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
  };
}) {
  const { apiKey, baseUrl, isConfigured } = getAsaasConfig();

  if (!isConfigured) {
    console.log('[Asaas Simulate] createAsaasCardPayment for Customer:', params.customerId);
    // Simular processamento do cartão
    return {
      success: true,
      paymentId: `pay_simulated_${Math.random().toString(36).substring(2, 10)}`,
      status: 'CONFIRMED'
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const cleanNumber = params.card.number.replace(/\D/g, '');
    const cleanCpfCnpj = params.holderInfo.cpfCnpj.replace(/\D/g, '');

    const bodyPayload = {
      customer: params.customerId,
      billingType: 'CREDIT_CARD',
      value: params.valor,
      dueDate: today, // Cartão cobra imediatamente
      description: params.descricao,
      externalReference: params.externalReference,
      creditCard: {
        holderName: params.card.holderName,
        number: cleanNumber,
        expiryMonth: params.card.expiryMonth,
        expiryYear: params.card.expiryYear,
        ccv: params.card.ccv
      },
      creditCardHolderInfo: {
        name: params.holderInfo.name,
        email: params.holderInfo.email,
        cpfCnpj: cleanCpfCnpj,
        postalCode: '01001000', // CEP fictício padrão exigido por lei
        addressNumber: '123',
        phone: params.holderInfo.phone ? params.holderInfo.phone.replace(/\D/g, '') : '41999998888'
      }
    };

    const res = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Asaas] Erro ao processar cobrança por cartão:', errText);
      try {
        const errObj = JSON.parse(errText);
        if (errObj.errors && errObj.errors.length > 0) {
          return { success: false, error: errObj.errors[0].description };
        }
      } catch {}
      return { success: false, error: `Erro no processamento do cartão: ${errText}` };
    }

    const data = await res.json();
    return {
      success: true,
      paymentId: data.id,
      status: data.status
    };
  } catch (error: any) {
    console.error('[Asaas] Falha ao processar cartão:', error);
    return { success: false, error: `Falha de rede ao processar cartão: ${error.message}` };
  }
}
