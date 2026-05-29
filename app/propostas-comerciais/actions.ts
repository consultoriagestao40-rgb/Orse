'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

export async function getDocumentosProposta() {
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    const docs = await prisma.documentoProposta.findMany({
      where: whereClause,
      include: {
        client: true,
        empresaEmissora: true,
        proposta: {
          include: {
            user: true,
            versoes: {}
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return docs.map((d: any) => {
      const sortedVersoes = [...(d.proposta?.versoes || [])].sort((a: any, b: any) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      return {
        id: d.id,
        numeroFPV: d.proposta?.numero,
        cliente: d.client?.nomeFantasia || 'Sem Cliente',
        empresa: d.empresaEmissora?.nomeFantasia,
        valor: d.valorTotal,
        status: d.status,
        data: d.createdAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        versaoFPV: lastVersao?.versao || 1,
        usuario: d.proposta?.user?.nome || 'Sistema',
        avatarUrl: d.proposta?.user?.avatarUrl || null
      };
    });
  } catch (error) {
    console.error('Erro ao buscar documentos de proposta:', error);
    return [];
  }
}

export async function getDocumentoPropostaById(id: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id },
      include: {
        client: true,
        empresaEmissora: true,
        tenant: true,
        proposta: {
          include: {
            versoes: {
              include: {
                items: true
              }
            }
          }
        },
        secoes: {
          orderBy: { ordem: 'asc' }
        }
      }
    });
    if (doc && doc.proposta && doc.proposta.versoes) {
      const sortedVersoes = [...doc.proposta.versoes].sort((a: any, b: any) => b.versao - a.versao);
      doc.proposta.versoes = sortedVersoes;
    }
    return doc;
  } catch (error) {
    console.error('Erro ao buscar documento por ID:', error);
    return null;
  }
}

export async function createDocumentoProposta(propostaId: string, templateId: string, empresaId: string) {
  try {
    // Busca a proposta (FPV) e sua versão mais recente para pegar o valor e o cliente
    const fpv = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { 
        versoes: {},
        client: true 
      }
    });

    if (!fpv) throw new Error('FPV não encontrada');
    if (!fpv.clientId) throw new Error('FPV sem cliente vinculado');

    const sortedVersoes = [...fpv.versoes].sort((a: any, b: any) => b.versao - a.versao);
    const valorTotal = sortedVersoes[0]?.precoVenda || 0;

    // Busca o template e suas seções
    const template = await prisma.templatePropostaComercial.findUnique({
      where: { id: templateId },
      include: { secoes: true }
    });

    if (!template) throw new Error('Template não encontrado');

    const user = await getLoggedUser();
    // Cria o documento e clona as seções do template
    const doc = await prisma.documentoProposta.create({
      data: {
        propostaId,
        clientId: fpv.clientId,
        empresaEmissoraId: empresaId,
        templateOrigemId: template.id,
        tipo: template.tipo || 'A4',
        valorTotal,
        tenantId: user?.tenantId || null,
        secoes: {
          create: template.secoes.map((secao: any) => ({
            titulo: secao.titulo,
            texto: secao.texto,
            ordem: secao.ordem
          }))
        }
      }
    });

    revalidatePath('/propostas-comerciais');
    return { success: true, docId: doc.id };
  } catch (error: any) {
    console.error('Erro ao criar documento de proposta:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSecoesDocumento(documentoId: string, secoes: { id?: string; titulo: string; texto: string; ordem: number }[]) {
  try {
    // Para simplificar: apaga todas as seções e recria na ordem correta
    await prisma.secaoDocumentoProposta.deleteMany({ where: { documentoId } });
    
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        secoes: {
          create: secoes.map(s => ({
            titulo: s.titulo,
            texto: s.texto,
            ordem: s.ordem
          }))
        }
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar seções:', error);
    return { success: false, error: error.message };
  }
}

export async function updateConfigApresentacao(id: string, config: any) {
  try {
    await prisma.documentoProposta.update({
      where: { id },
      data: { configApresentacao: config }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar config apresentação:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDocumentoStatus(id: string, status: string) {
  try {
    await prisma.documentoProposta.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/propostas-comerciais');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar status do documento:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocumentoProposta(id: string) {
  try {
    await prisma.documentoProposta.delete({ where: { id } });
    revalidatePath('/propostas-comerciais');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return { success: false, error: error.message };
  }
}

export async function getTemplatesProposta() {
  const user = await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }
    let templates = await prisma.templatePropostaComercial.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
      include: { secoes: { orderBy: { ordem: 'asc' } } }
    });

    // Seeding automático
    if (templates.length === 0 && user?.tenantId) {
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Simples (Terceirização)',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados...\n\n[ITENS]' },
              { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada...' },
              { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal será de [VALOR_TOTAL].\n\n[TABELA]\n\n[TERMO_ACEITE]' }
            ]
          }
        }
      });
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Proposta Completa (Condomínios/Indústria)',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: '1. CARTA DE APRESENTAÇÃO', texto: 'Prezado(a) Síndico(a)/Gestor(a) do [CLIENTE_NOME]...' },
              { ordem: 2, titulo: '2. VALORES', texto: 'Valor: [VALOR_TOTAL].' }
            ]
          }
        }
      });
      await prisma.templatePropostaComercial.create({
        data: {
          nome: 'Apresentação (Slide Deck)',
          tipo: 'SLIDE_DECK',
          tenantId: user.tenantId,
          secoes: {
            create: [
              { ordem: 1, titulo: 'Instruções', texto: 'Este template não usa estas seções de texto. Ele renderiza os slides fixos da FPV com as imagens e valores em tela cheia.' }
            ]
          }
        }
      });
      templates = await prisma.templatePropostaComercial.findMany({
        where: whereClause,
        orderBy: { nome: 'asc' },
        include: { secoes: { orderBy: { ordem: 'asc' } } }
      });
    }

    return templates;
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    return [];
  }
}

export async function getTemplatePropostaById(id: string) {
  try {
    const t = await prisma.templatePropostaComercial.findUnique({
      where: { id },
      include: { secoes: { orderBy: { ordem: 'asc' } } }
    });
    return t;
  } catch (error) {
    console.error('Erro ao buscar template por id:', error);
    return null;
  }
}

export async function createTemplateProposta(nome: string, secoes: { titulo: string; texto: string; ordem: number }[], tipo: string = 'A4') {
  const user = await getLoggedUser();
  try {
    const t = await prisma.templatePropostaComercial.create({
      data: {
        nome,
        tipo,
        tenantId: user?.tenantId || null,
        secoes: {
          create: secoes.map(s => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
        }
      },
      include: { secoes: true }
    });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true, data: t };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplateProposta(id: string, nome: string, secoes: { titulo: string; texto: string; ordem: number }[], tipo: string = 'A4') {
  try {
    // Apagar seções antigas e recriar
    await prisma.secaoTemplateProposta.deleteMany({ where: { templateId: id } });
    await prisma.templatePropostaComercial.update({
      where: { id },
      data: {
        nome,
        tipo,
        secoes: {
          create: secoes.map(s => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
        }
      }
    });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplateProposta(id: string) {
  try {
    await prisma.templatePropostaComercial.delete({ where: { id } });
    revalidatePath('/propostas-comerciais/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para aprovar eletronicamente uma proposta comercial (FPV / Slide Deck)
 */
export async function aprovarPropostaAction(documentoId: string, payload: { nome: string, cpf: string, assinatura: string, ip: string }) {
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
        cpfAssinante: payload.cpf
      }
    });

    // 2. Tentar atualizar também o status da FPV de origem para manter a sincronia
    await prisma.proposta.update({
      where: { id: doc.propostaId },
      data: { status: 'Aprovada' }
    }).catch(err => console.error('Erro ao atualizar FPV associada:', err));

    // 3. Disparar notificação no WhatsApp do Vendedor via Z-API se estiver conectada
    const vendedor = doc.proposta.user;
    if (vendedor.celular) {
      const cleanPhone = vendedor.celular.replace(/\D/g, '');
      const tenantId = doc.tenantId;

      let instanceId = process.env.ZAPI_INSTANCE_ID;
      let token = process.env.ZAPI_TOKEN;
      let clientToken = process.env.ZAPI_CLIENT_TOKEN;

      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            whatsappInstanceId: true,
            whatsappToken: true,
            whatsappClientToken: true,
            nomeFantasia: true
          }
        });
        if (tenant && tenant.whatsappInstanceId && tenant.whatsappToken && tenant.whatsappClientToken) {
          instanceId = tenant.whatsappInstanceId;
          token = tenant.whatsappToken;
          clientToken = tenant.whatsappClientToken;
        }
      }

      if (instanceId && token && clientToken) {
        try {
          const numProposta = String(doc.proposta.numero).padStart(3, '0');
          const clienteNome = doc.client.nomeFantasia || doc.client.razaoSocial || '';
          
          const text = `🎉 *PROPOSTA APROVADA!* 🎉\n\n` +
                       `Olá, *${vendedor.nome}*!\n\n` +
                       `Temos ótimas notícias! O cliente *${clienteNome}* acabou de visualizar, aprovar e assinar eletronicamente a proposta comercial *FPV-${numProposta}*!\n\n` +
                       `✍️ *Assinado por:* ${payload.nome}\n` +
                       `🆔 *CPF/CNPJ:* ${payload.cpf}\n` +
                       `🌐 *IP:* ${payload.ip}\n` +
                       `📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}\n\n` +
                       `Parabéns por mais este fechamento! 🚀💼`;

          const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
          await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Client-Token': clientToken
            },
            body: JSON.stringify({
              phone: cleanPhone,
              message: text
            })
          });
        } catch (zapiErr) {
          console.error('Erro ao disparar WhatsApp de fechamento via Z-API:', zapiErr);
        }
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

export async function uploadSlideImageAction(base64Data: string, fileName: string) {
  try {
    const fs = require('fs');
    const path = require('path');

    // Split base64 prefix
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      if (base64Data.startsWith('http') || base64Data.startsWith('/uploads/')) {
        return { success: true, fileUrl: base64Data };
      }
      return { success: false, error: 'Formato de imagem inválido' };
    }

    const fileType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Validate size (less than 8MB)
    if (buffer.length > 8 * 1024 * 1024) {
      return { success: false, error: 'Imagem muito grande (máximo 8MB)' };
    }

    // Determine extension
    let ext = '.png';
    if (fileType.includes('jpeg') || fileType.includes('jpg')) ext = '.jpg';
    else if (fileType.includes('webp')) ext = '.webp';
    else if (fileType.includes('gif')) ext = '.gif';

    const cleanFileName = `slide_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create dir if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanFileName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${cleanFileName}`;
    return { success: true, fileUrl };
  } catch (err: any) {
    console.error('Erro no upload da imagem do slide:', err);
    // If saving locally fails (e.g. serverless environment), return base64 back as backup
    return { success: true, fileUrl: base64Data };
  }
}

