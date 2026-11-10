'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action pública para buscar um template de minuta por ID
 */
export async function getMinutaTemplateById(templateId: string) {
  try {
    const template = await prisma.templateContrato.findUnique({
      where: { id: templateId },
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });
    return { success: true, data: template };
  } catch (error: any) {
    console.error('Erro ao buscar template de minuta:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para aprovar eletronicamente uma proposta comercial (FPV / Slide Deck)
 */
export async function aprovarPropostaAction(documentoId: string, payload: { nome: string, cpf: string, assinatura: string, ip: string, email?: string }) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento da proposta não encontrado.' };
    }

    const currentConfig = (doc.configApresentacao as any) || {};

    // 1. Atualizar o documento no banco de dados com a assinatura
    const updatedDoc = await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        status: 'Aprovada',
        statusAssinatura: 'ASSINADO',
        dataAssinatura: new Date(),
        assinaturaBase64: payload.assinatura,
        ipAssinante: payload.ip,
        nomeAssinante: payload.nome,
        cpfAssinante: payload.cpf,
        configApresentacao: {
          ...currentConfig,
          emailAssinante: payload.email
        }
      }
    });

    // Criar notificação para o vendedor responsável pela proposta
    await prisma.notification.create({
      data: {
        userId: doc.proposta.userId,
        texto: `🎉 Proposta Aprovada: O cliente ${doc.client.nomeFantasia || 'Cliente'} assinou e aprovou a proposta FPV-${String(doc.proposta.numero).padStart(3, '0')}.`,
        link: `/propostas-comerciais/${doc.id}`
      }
    });

    // 2. Tentar atualizar também o status da FPV de origem para manter a sincronia
    await prisma.proposta.update({
      where: { id: doc.propostaId },
      data: { status: 'Aprovada' }
    }).catch(err => console.error('Erro ao atualizar FPV associada:', err));

    // 3. Disparar notificação no WhatsApp do Vendedor via Instância Oficial Central SmartBid (Z-API)
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      try {
        const { sendOfficialWhatsAppNotification } = await import('@/lib/whatsapp-official');
        const numProposta = String(doc.proposta.numero).padStart(3, '0');
        const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';

        const text = `🎉 *PROPOSTA APROVADA!* 🎉\n\n` +
                     `Olá, *${vendedor.nome}*!\n\n` +
                     `Temos ótimas notícias! O cliente *${clienteNome}* acabou de visualizar, aprovar e assinar eletronicamente a proposta comercial *FPV-${numProposta}*!\n\n` +
                     `✍️ *Assinado por:* ${payload.nome}\n` +
                     `🆔 *CPF/CNPJ:* ${payload.cpf}\n` +
                     `🌐 *IP:* ${payload.ip}\n` +
                     `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                     `Parabéns por mais este fechamento! 🚀💼\n` +
                     `_Notificação Oficial • SmartBidHub_`;

        await sendOfficialWhatsAppNotification({
          phone: vendedor.celular,
          message: text,
          fallbackTenantId: doc.tenantId,
        });
      } catch (zapiErr) {
        console.error('Erro ao disparar WhatsApp de fechamento via Z-API Oficial:', zapiErr);
      }
    }

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao aprovar proposta eletronicamente:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para recusar/declinar uma proposta comercial e enviar notificação no WhatsApp
 */
export async function recusarPropostaAction(documentoId: string, motivo: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true,
            versoes: {
              orderBy: { versao: 'desc' }
            }
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const lastVersion = doc.proposta.versoes?.[0];
    const meta = (lastVersion?.metadados as any) || {};
    const contatoNome = meta.contato || doc.client.nomeFantasia || 'Cliente';

    // 1. Atualizar o documento no banco de dados com a recusa
    const config = (doc.configApresentacao as any) || {};
    const negotiations = config.negotiations || [];
    negotiations.push({
      id: 'neg_' + Math.random().toString(36).substr(2, 9),
      tipo: 'recusa',
      mensagem: motivo,
      data: new Date().toISOString(),
      nomeCliente: contatoNome,
      respondida: false
    });

    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        status: 'Recusada',
        statusAssinatura: 'RECUSADO',
        configApresentacao: {
          ...config,
          negotiations
        }
      }
    });

    // Criar notificação para o vendedor responsável pela proposta
    await prisma.notification.create({
      data: {
        userId: doc.proposta.userId,
        texto: `⚠️ Proposta Recusada: O cliente ${doc.client.nomeFantasia || 'Cliente'} recusou a proposta FPV-${String(doc.proposta.numero).padStart(3, '0')}. Justificativa: "${motivo.substring(0, 30)}..."`,
        link: `/propostas-comerciais/${doc.id}`
      }
    });

    // 2. Atualizar status da FPV
    await prisma.proposta.update({
      where: { id: doc.propostaId },
      data: { status: 'Recusada' }
    }).catch(err => console.error('Erro ao atualizar FPV:', err));

    // 3. Disparar notificação no WhatsApp do Vendedor via Instância Oficial Central SmartBid (Z-API)
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      try {
        const { sendOfficialWhatsAppNotification } = await import('@/lib/whatsapp-official');
        const numProposta = String(doc.proposta.numero).padStart(3, '0');
        const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';

        const text = `⚠️ *PROPOSTA RECUSADA* ⚠️\n\n` +
                     `Olá, *${vendedor.nome}*!\n\n` +
                     `O cliente *${clienteNome}* visualizou e *recusou* a proposta comercial *FPV-${numProposta}*.\n\n` +
                     `💬 *Justificativa informada:* ${motivo}\n` +
                     `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                     `Acesse a plataforma para renegociar com o cliente. 📈💼\n` +
                     `_Notificação Oficial • SmartBidHub_`;

        await sendOfficialWhatsAppNotification({
          phone: vendedor.celular,
          message: text,
          fallbackTenantId: doc.tenantId,
        });
      } catch (zapiErr) {
        console.error('Erro ao disparar WhatsApp de recusa via Z-API Oficial:', zapiErr);
      }
    }

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao recusar proposta:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para registrar a visualização de uma aba do cliente
 */
export async function trackDocumentoView(
  documentoId: string, 
  tabId: string,
  identificacao?: { nome?: string; cnpjOuEmail?: string; isInternal?: boolean }
) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) return { success: false, error: 'Documento não encontrado' };

    // 1. Verificar se é acesso interno (vendedor ou equipe conferindo o próprio link)
    let isInternal = identificacao?.isInternal === true;
    if (!isInternal) {
      try {
        const { getLoggedUser } = await import('@/app/propostas/actions');
        const user = await getLoggedUser();
        if (
          user &&
          (user.id === doc.proposta?.userId ||
            user.tenantId === doc.tenantId ||
            ['ADMIN', 'MANAGER', 'USER', 'LOGISTICA'].includes(user.role))
        ) {
          isInternal = true;
        }
      } catch (authErr) {
        // Se falhar o getLoggedUser em contexto anônimo, continua como cliente externo
      }
    }

    if (isInternal) {
      // Acesso do próprio vendedor ou equipe: não contabilizar como visualização do cliente e não disparar alertas
      return { success: true, isInternalPreview: true };
    }

    const config = (doc.configApresentacao as any) || {};
    const tracking = config.viewTracking || {
      firstSentAt: new Date().toISOString(),
      views: {
        apresentacao: 0,
        proposta: 0,
        fpv: 0,
        minuta: 0
      },
      history: []
    };

    // Increment view count for the specific tab
    if (!tracking.views) tracking.views = {};
    tracking.views[tabId] = (tracking.views[tabId] || 0) + 1;

    // Add to history list
    if (!tracking.history) tracking.history = [];
    
    // Prevent recording high frequency repeat clicks within 3 seconds for the same tab
    const now = new Date();
    const lastEvent = tracking.history.length > 0 ? tracking.history[tracking.history.length - 1] : null;
    const isRepeatClick = lastEvent && lastEvent.tab === tabId && (now.getTime() - new Date(lastEvent.viewedAt).getTime() < 3000);

    if (!isRepeatClick) {
      const historyItem: any = {
        tab: tabId,
        viewedAt: now.toISOString()
      };
      if (identificacao?.nome) {
        historyItem.nome = identificacao.nome;
      }
      if (identificacao?.cnpjOuEmail) {
        historyItem.cnpjOuEmail = identificacao.cnpjOuEmail;
      }
      tracking.history.push(historyItem);

      // Criar notificação para o vendedor dono da proposta
      const numProposta = String(doc.proposta.numero).padStart(3, '0');
      const clienteNome = identificacao?.nome 
        ? `${identificacao.nome}${identificacao.cnpjOuEmail ? ` (${identificacao.cnpjOuEmail})` : ''}` 
        : (doc.client.nomeFantasia || 'Cliente');
      const isFirstAccess = tracking.history.length === 1;

      await prisma.notification.create({
        data: {
          userId: doc.proposta.userId,
          texto: isFirstAccess
            ? `👀 Primeiro Acesso: O cliente ${clienteNome} acessou a sua proposta FPV-${numProposta} pela primeira vez!`
            : `👀 Proposta Visualizada: O cliente ${clienteNome} visualizou a aba "${tabId.toUpperCase()}" da proposta FPV-${numProposta}.`,
          link: `/propostas-comerciais/${documentoId}`
        }
      });
    }

    // Save back to db
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          viewTracking: tracking
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao registrar visualização:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para registrar solicitação de ajustes ou contraproposta pelo cliente
 */
export async function registrarAjusteAction(documentoId: string, mensagem: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true,
            versoes: {
              orderBy: { versao: 'desc' }
            }
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const lastVersion = doc.proposta.versoes?.[0];
    const meta = (lastVersion?.metadados as any) || {};
    const contatoNome = meta.contato || doc.client.nomeFantasia || 'Cliente';

    const config = (doc.configApresentacao as any) || {};
    const negotiations = config.negotiations || [];
    negotiations.push({
      id: 'neg_' + Math.random().toString(36).substr(2, 9),
      tipo: 'ajuste',
      mensagem: mensagem,
      data: new Date().toISOString(),
      nomeCliente: contatoNome,
      respondida: false
    });

    // 1. Atualizar o documento no banco de dados
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          negotiations
        }
      }
    });

    // Criar notificação para o vendedor responsável pela proposta
    await prisma.notification.create({
      data: {
        userId: doc.proposta.userId,
        texto: `💬 Ajuste Solicitado: O cliente ${doc.client.nomeFantasia || 'Cliente'} solicitou ajustes na proposta FPV-${String(doc.proposta.numero).padStart(3, '0')}.`,
        link: `/propostas-comerciais/${doc.id}`
      }
    });

    // 2. Disparar notificação no WhatsApp do Vendedor via Instância Oficial Central SmartBid (Z-API)
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      try {
        const { sendOfficialWhatsAppNotification } = await import('@/lib/whatsapp-official');
        const numProposta = String(doc.proposta.numero).padStart(3, '0');
        const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';

        const text = `💬 *SOLICITAÇÃO DE AJUSTES* 💬\n\n` +
                     `Olá, *${vendedor.nome}*!\n\n` +
                     `O cliente *${clienteNome}* visualizou a proposta comercial *FPV-${numProposta}* e solicitou ajustes/contraproposta.\n\n` +
                     `💬 *Mensagem do cliente:* ${mensagem}\n` +
                     `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                     `Acesse a plataforma para responder ao cliente. 📈💼\n` +
                     `_Notificação Oficial • SmartBidHub_`;

        await sendOfficialWhatsAppNotification({
          phone: vendedor.celular,
          message: text,
          fallbackTenantId: doc.tenantId,
        });
      } catch (zapiErr) {
        console.error('Erro ao disparar WhatsApp de ajuste via Z-API Oficial:', zapiErr);
      }
    }

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao registrar ajuste:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Server Action para solicitar código de acesso por e-mail (OTP de 6 dígitos)
 */
export async function solicitarCodigoAcessoEmailAction(documentoId: string, email: string, nome: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true,
        empresaEmissora: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor, informe um e-mail válido.' };
    }

    // Gerar código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

    const config = (doc.configApresentacao as any) || {};
    const accessCodes = (config.accessCodes || []).filter((c: any) => c.expiresAt > Date.now());
    accessCodes.push({
      email: cleanEmail,
      nome: cleanNome,
      code,
      expiresAt
    });

    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          accessCodes
        }
      }
    });

    const numProposta = String(doc.proposta?.numero || '').padStart(3, '0');
    const emissoraNome = doc.empresaEmissora?.nomeFantasia || 'SmartBid';
    const clienteNome = doc.client?.nomeFantasia || doc.client?.razaoSocial || 'Cliente';

    // Enviar via sendMail
    let simulated = false;
    try {
      const { sendMail } = await import('@/lib/mail');
      const mailRes = await sendMail({
        to: cleanEmail,
        subject: `Código de Acesso: Proposta Comercial FPV-${numProposta} - ${emissoraNome}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1B4D3E; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${emissoraNome}</h2>
              <p style="color: #64748b; font-size: 11px; margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Proposta Comercial Confidencial</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <p style="color: #334155; font-size: 15px; margin-top: 0; font-weight: 600;">Olá, <strong>${cleanNome}</strong>!</p>
              
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 8px;">
                Você solicitou um código de verificação para acessar a proposta comercial <strong>FPV-${numProposta}</strong> personalizada para <strong>${clienteNome}</strong>.
              </p>
              
              <div style="margin: 28px 0; padding: 18px 24px; background: #ecfdf5; border: 1px dashed #10b981; border-radius: 14px; display: inline-block;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #1B4D3E; font-family: monospace;">${code}</span>
              </div>
              
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                Insira este código na tela da proposta para confirmar sua identidade e liberar a navegação imediata.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 12px; margin-bottom: 0;">
                ⏱️ Este código expira em 15 minutos.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px; font-weight: 600;">
              ${emissoraNome} • SmartBid Gestão Comercial Inteligente
            </div>
          </div>
        `,
        text: `Olá ${cleanNome}, seu código de acesso para a Proposta Comercial FPV-${numProposta} é: ${code}. Válido por 15 minutos.`
      });

      simulated = Boolean(mailRes.simulated);
    } catch (mailErr) {
      console.warn('Erro ou simulação de envio de e-mail:', mailErr);
      simulated = true;
    }

    return { 
      success: true, 
      simulated, 
      simulatedCode: simulated ? code : undefined 
    };
  } catch (error: any) {
    console.error('Erro ao solicitar código de acesso por e-mail:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para validar código de acesso recebido por e-mail (OTP de 6 dígitos)
 */
export async function validarCodigoAcessoEmailAction(documentoId: string, email: string, code: string, nome: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().replace(/\D/g, '');
    const cleanNome = nome.trim();

    const config = (doc.configApresentacao as any) || {};
    const accessCodes = config.accessCodes || [];
    const now = Date.now();

    const matchIdx = accessCodes.findIndex(
      (c: any) => c.email === cleanEmail && c.code === cleanCode && c.expiresAt > now
    );

    if (matchIdx === -1) {
      return { 
        success: false, 
        error: 'Código inválido ou expirado. Verifique os números digitados ou solicite um novo código.' 
      };
    }

    // Remove o código utilizado
    accessCodes.splice(matchIdx, 1);
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          accessCodes
        }
      }
    });

    // Registra a visualização validada
    await trackDocumentoView(documentoId, 'proposta', {
      nome: cleanNome,
      cnpjOuEmail: cleanEmail
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao validar código de acesso por e-mail:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para validar identificação direta por CNPJ ou Código de Acesso PIN
 */
export async function validarIdentificacaoCnpjOrPinAction(documentoId: string, cnpjOrPin: string, nome: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id: documentoId },
      include: {
        proposta: {
          include: {
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const inputTrimmed = cnpjOrPin.trim();
    const cleanInput = inputTrimmed.replace(/\D/g, '');
    const cleanNome = nome.trim();

    if (!cleanNome) {
      return { success: false, error: 'Por favor, informe seu nome completo.' };
    }

    if (!inputTrimmed) {
      return { success: false, error: 'Por favor, informe o CNPJ ou Código de Acesso.' };
    }

    const config = (doc.configApresentacao as any) || {};
    const customPin = (config.regrasAcesso?.codigoAcessoCustom || '').trim();
    const cleanClientCnpj = (doc.client?.cnpj || '').replace(/\D/g, '');
    const cleanClientCpf = (doc.client?.cpf || '').replace(/\D/g, '');
    const propNum = String(doc.proposta?.numero || '');

    let isValid = false;

    // 1. PIN customizado cadastrado pelo vendedor
    if (customPin && inputTrimmed.toLowerCase() === customPin.toLowerCase()) {
      isValid = true;
    }
    // 2. CNPJ idêntico
    else if (cleanClientCnpj && cleanInput === cleanClientCnpj) {
      isValid = true;
    }
    // 3. Raiz do CNPJ (8 primeiros dígitos)
    else if (cleanClientCnpj && cleanInput.length >= 8 && cleanClientCnpj.startsWith(cleanInput.slice(0, 8))) {
      isValid = true;
    }
    // 4. Últimos 4 dígitos do CNPJ
    else if (cleanClientCnpj && cleanInput.length === 4 && cleanClientCnpj.endsWith(cleanInput)) {
      isValid = true;
    }
    // 5. CPF do cliente
    else if (cleanClientCpf && cleanInput === cleanClientCpf) {
      isValid = true;
    }
    // 6. Número da proposta como chave de segurança
    else if (
      inputTrimmed.toLowerCase() === ('fpv-' + propNum).toLowerCase() ||
      inputTrimmed === propNum ||
      inputTrimmed === propNum.padStart(3, '0')
    ) {
      isValid = true;
    }
    // 7. Se no cadastro do cliente o CNPJ e CPF estiverem vazios: qualquer CNPJ válido (14 dígitos) ou CPF (11 dígitos) é aceito
    else if (!cleanClientCnpj && !cleanClientCpf && (cleanInput.length === 14 || cleanInput.length === 11 || cleanInput.length >= 4)) {
      isValid = true;
    }

    if (!isValid) {
      return { 
        success: false, 
        error: 'O CNPJ ou Código informado não confere com o cadastro desta proposta comercial. Por favor, confira os números digitados ou utilize a opção de confirmação por e-mail.' 
      };
    }

    // Registra a visualização validada
    await trackDocumentoView(documentoId, 'proposta', {
      nome: cleanNome,
      cnpjOuEmail: inputTrimmed
    });

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao validar CNPJ/Código:', error);
    return { success: false, error: error.message };
  }
}
