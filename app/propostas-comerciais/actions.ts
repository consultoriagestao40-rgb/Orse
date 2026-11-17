'use server';

import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { 
  getLoggedUser, 
  getPropostas, 
  getCurrentUserRole, 
  getUsersList, 
  getDocumentoStatuses 
} from '@/app/propostas/actions';
import { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';
import { formatServerDateTime } from '@/lib/timezone';
import {
  buildExecutiveProposalUrl,
  buildExecutiveWhatsAppMessage,
  buildProposalCardHeadline,
  buildProposalCardSubtitle,
  formatProposalCode,
  normalizeWhatsAppDigits,
} from '@/lib/proposal-share';

export async function getDocumentosProposta(preFetchedUser?: any) {
  const user = preFetchedUser || await getLoggedUser();
  try {
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    }

    // Busca apenas as configurações leves (sem fotos e PDFs) em paralelo
    let lightConfigs: any[] = [];
    if (user?.tenantId) {
      lightConfigs = await prisma.$queryRaw<Array<{ id: string, config: any }>>`
        SELECT id, 
               CASE 
                 WHEN "configApresentacao" IS NULL THEN NULL
                 WHEN jsonb_typeof("configApresentacao") = 'object' THEN "configApresentacao" - 'fotosList' - 'documentosList' - 'faqList'
                 ELSE "configApresentacao"
               END as config
        FROM "DocumentoProposta"
        WHERE "tenantId" = ${user.tenantId}
      `;
    } else {
      lightConfigs = await prisma.$queryRaw<Array<{ id: string, config: any }>>`
        SELECT id, 
               CASE 
                 WHEN "configApresentacao" IS NULL THEN NULL
                 WHEN jsonb_typeof("configApresentacao") = 'object' THEN "configApresentacao" - 'fotosList' - 'documentosList' - 'faqList'
                 ELSE "configApresentacao"
               END as config
        FROM "DocumentoProposta"
      `;
    }
    const configMap = new Map(lightConfigs.map(c => [c.id, c.config]));

    const docs = await prisma.documentoProposta.findMany({
      where: whereClause,
      select: {
        id: true,
        propostaId: true,
        versaoFPV: true,
        clientId: true,
        valorTotal: true,
        status: true,
        statusAssinatura: true,
        nomeAssinante: true,
        dataAssinatura: true,
        createdAt: true,
        client: {
          select: {
            nomeFantasia: true,
            segmento: true,
            whatsapp: true,
            contato: true
          }
        },
        empresaEmissora: {
          select: {
            nomeFantasia: true
          }
        },
        proposta: {
          select: {
            numero: true,
            lead: {
              select: {
                telefone: true,
                contatoNome: true
              }
            },
            user: {
              select: {
                nome: true,
                avatarUrl: true
              }
            },
            versoes: {
              select: {
                versao: true,
                precoVenda: true
              }
            }
          }
        }
      },
      orderBy: [{ createdAt: 'desc' }, { versaoFPV: 'desc' }]
    });

    // Busca super-leve apenas de contato e dados do card salvos em metadados da FPV (sem carregar JSON pesado de insumos)
    const propostaIds = Array.from(new Set(docs.map((d: any) => d.propostaId).filter(Boolean)));
    const fpvContactMap = new Map<
      string,
      {
        contato?: string | null;
        celular?: string | null;
        tipoServicos?: string | null;
        objetoProposta?: string | null;
        tipoProposta?: string | null;
      }
    >();
    if (propostaIds.length > 0) {
      try {
        const metaRows = await prisma.$queryRawUnsafe<
          Array<{
            propostaId: string;
            versao: number;
            contato: string | null;
            celular: string | null;
            tipoServicos: string | null;
            objetoProposta: string | null;
            tipoProposta: string | null;
          }>
        >(
          `SELECT "propostaId", "versao",
                  "metadados"->>'contato' AS contato,
                  COALESCE("metadados"->>'celular', "metadados"->>'whatsapp', "metadados"->>'telefone') AS celular,
                  "metadados"->>'tipoServicos' AS "tipoServicos",
                  LEFT("metadados"->>'objetoProposta', 180) AS "objetoProposta",
                  "metadados"->>'tipoProposta' AS "tipoProposta"
             FROM "PropostaVersao"
            WHERE "propostaId" = ANY($1::text[])`,
          propostaIds
        );
        for (const row of metaRows) {
          fpvContactMap.set(`${row.propostaId}:${row.versao}`, {
            contato: row.contato,
            celular: row.celular,
            tipoServicos: row.tipoServicos,
            objetoProposta: row.objetoProposta,
            tipoProposta: row.tipoProposta,
          });
        }
      } catch {}
    }

    return docs.map((d: any) => {
      const sortedVersoes = [...(d.proposta?.versoes || [])].sort((a: any, b: any) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      const effectiveVersao = d.versaoFPV || lastVersao?.versao || 1;
      const matchedVersaoObj = sortedVersoes.find((v: any) => v.versao === effectiveVersao);
      const fpvContact =
        fpvContactMap.get(`${d.propostaId}:${effectiveVersao}`) ||
        (lastVersao ? fpvContactMap.get(`${d.propostaId}:${lastVersao.versao}`) : undefined);
      const cfg = configMap.get(d.id) || null;
      const contatoWhatsApp =
        cfg?.contatoWhatsApp ||
        fpvContact?.celular ||
        d.client?.whatsapp ||
        d.proposta?.lead?.telefone ||
        '';
      const contatoNome =
        cfg?.contatoNome ||
        fpvContact?.contato ||
        d.client?.contato ||
        d.proposta?.lead?.contatoNome ||
        '';
      return {
        id: d.id,
        propostaId: d.propostaId,
        clientId: d.clientId,
        numeroFPV: d.proposta?.numero,
        cliente: d.client?.nomeFantasia || 'Sem Cliente',
        segmento: d.client?.segmento || 'Sem Segmento',
        empresa: d.empresaEmissora?.nomeFantasia,
        valor: d.valorTotal || matchedVersaoObj?.precoVenda || 0,
        status: d.status,
        data: d.createdAt.toLocaleString('pt-BR', { timeZone: user?.timezone || 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        versaoFPV: effectiveVersao,
        usuario: d.proposta?.user?.nome || 'Sistema',
        avatarUrl: d.proposta?.user?.avatarUrl || null,
        configApresentacao: cfg,
        contatoNome,
        contatoWhatsApp,
        tipoServicos: fpvContact?.tipoServicos || '',
        objetoProposta: fpvContact?.objetoProposta || '',
        tipoProposta: fpvContact?.tipoProposta || 'RECORRENTE',
        statusAssinatura: d.statusAssinatura,
        nomeAssinante: d.nomeAssinante,
        dataAssinatura: d.dataAssinatura,
        createdAt: d.createdAt
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
            user: true,
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
      const targetVersao = (doc as any).versaoFPV;
      const sortedVersoes = [...doc.proposta.versoes].sort((a: any, b: any) => {
        if (targetVersao) {
          if (a.versao === targetVersao && b.versao !== targetVersao) return -1;
          if (b.versao === targetVersao && a.versao !== targetVersao) return 1;
        }
        return b.versao - a.versao;
      });
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
    const user = await getLoggedUser();
    // Busca a proposta (FPV) e sua versão mais recente para pegar o valor e o cliente
    const fpv = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { 
        versoes: {},
        client: true 
      }
    });

    if (!fpv) throw new Error('FPV não encontrada');

    let clientId = fpv.clientId;

    if (!clientId) {
      // Tenta buscar o nome do cliente nos metadados da última versão
      const sortedVersoes = [...fpv.versoes].sort((a: any, b: any) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      const meta = (lastVersao?.metadados as any) || {};
      const clienteNome = meta.clienteNome;

      if (clienteNome) {
        // Tenta buscar o cliente pelo nomeFantasia (relação case-insensitive)
        let dbClient = await prisma.client.findFirst({
          where: {
            nomeFantasia: {
              equals: clienteNome.trim(),
              mode: 'insensitive'
            }
          }
        });

        // Se não encontrar, tenta fazer busca por aproximação
        if (!dbClient) {
          dbClient = await prisma.client.findFirst({
            where: {
              nomeFantasia: {
                contains: clienteNome.trim(),
                mode: 'insensitive'
              }
            }
          });
        }

        // Se ainda não encontrar, divide por delimitadores comuns (| ou -) e tenta buscar cada parte
        if (!dbClient) {
          const parts = clienteNome.split(/[|\-]/).map(p => p.trim()).filter(Boolean);
          for (const part of parts) {
            dbClient = await prisma.client.findFirst({
              where: {
                nomeFantasia: {
                  equals: part,
                  mode: 'insensitive'
                }
              }
            });
            if (!dbClient) {
              dbClient = await prisma.client.findFirst({
                where: {
                  nomeFantasia: {
                    contains: part,
                    mode: 'insensitive'
                  }
                }
              });
            }
            if (dbClient) break;
          }
        }

        // Se ainda não encontrar, tenta busca reversa (se o nome de algum cliente cadastrado está contido no nome digitado)
        if (!dbClient) {
          const allClients = await prisma.client.findMany({
            where: { tenantId: user?.tenantId || null }
          });
          dbClient = allClients.find(c => 
            clienteNome.toLowerCase().includes(c.nomeFantasia.trim().toLowerCase()) ||
            (c.razaoSocial && clienteNome.toLowerCase().includes(c.razaoSocial.trim().toLowerCase()))
          ) || null;
        }

        if (dbClient) {
          // Atualiza a proposta com o ID do cliente encontrado para curar os dados
          await prisma.proposta.update({
            where: { id: propostaId },
            data: { clientId: dbClient.id }
          });
          clientId = dbClient.id;
          (fpv as any).clientId = dbClient.id;
          (fpv as any).client = dbClient;
        }
      }
    }

    if (!clientId) throw new Error('FPV sem cliente cadastrado no sistema. Por favor, cadastre o cliente em "Clientes" primeiro.');

    const sortedVersoes = [...fpv.versoes].sort((a: any, b: any) => b.versao - a.versao);
    const targetVersao = sortedVersoes[0]?.versao || 1;
    const valorTotal = sortedVersoes[0]?.precoVenda || 0;

    // Impede gerar duas propostas comerciais para a mesma versão da FPV
    const existingDocSameVersion = await prisma.documentoProposta.findFirst({
      where: {
        propostaId,
        versaoFPV: targetVersao
      }
    });
    if (existingDocSameVersion) {
      const refStr = `FPV-${String(fpv.numero).padStart(3, '0')}-REV-${String(targetVersao).padStart(2, '0')}`;
      throw new Error(
        `Já existe uma Proposta Comercial gerada para a ${refStr}. Para gerar uma nova proposta mantendo o histórico das anteriores, salve uma Nova Versão (R${String(targetVersao + 1).padStart(2, '0')}) dentro da FPV.`
      );
    }

    // Busca o template e suas seções
    const template = await prisma.templatePropostaComercial.findUnique({
      where: { id: templateId },
      include: { secoes: true }
    });

    if (!template) throw new Error('Template não encontrado');
    
    let configApresentacao: any = null;

    if (template.tipo === 'SLIDE_DECK') {
      let templateUseCanva = false;
      let templateCanvaUrl = '';

      if (template.secoes && template.secoes.length > 0) {
        try {
          const parsed = JSON.parse(template.secoes[0].texto);
          if (parsed.useCanva) {
            templateUseCanva = true;
            templateCanvaUrl = parsed.canvaEmbedUrl || '';
          }
        } catch (e) {}
      }

      // Busca o primeiro template A4 para carregar as cláusulas de contrato padrão
      const a4Template = await prisma.templatePropostaComercial.findFirst({
        where: { 
          tipo: 'A4',
          tenantId: user?.tenantId || null
        },
        include: { secoes: { orderBy: { ordem: 'asc' } } }
      }) || await prisma.templatePropostaComercial.findFirst({
        where: { tipo: 'A4' },
        include: { secoes: { orderBy: { ordem: 'asc' } } }
      });

      const defaultClausulas = a4Template && a4Template.secoes.length > 0
        ? a4Template.secoes.map((s: any) => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
        : [
            { ordem: 1, titulo: '1. APRESENTAÇÃO', texto: 'Apresentamos nossa proposta para prestação de serviços terceirizados...\n\n[ITENS]' },
            { ordem: 2, titulo: '2. ESCOPO DO SERVIÇO', texto: 'Fornecimento de mão de obra capacitada...' },
            { ordem: 3, titulo: '3. VALOR DO INVESTIMENTO', texto: 'O investimento mensal será de [VALOR_TOTAL].\n\n[TABELA]\n\n[TERMO_ACEITE]' }
          ];

      configApresentacao = {
        clausulasA4: defaultClausulas,
        useCanva: templateUseCanva,
        canvaEmbedUrl: templateCanvaUrl,
        condicoesCliente: fpv.client?.condicoesCliente || [
          'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
          'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
          'Próximo reajuste Fevereiro/2027.'
        ],
        condicoesColaboradores: fpv.client?.condicoesColaboradores || [
          'Vale alimentação de R$900,00;',
          'Cesta trimestral de assiduidade;',
          '2 Vales transporte por dia.'
        ],
        quadroEfetivoSubtitulo: fpv.client?.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
        quadroEfetivoClausulas: [
          fpv.client?.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
          fpv.client?.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
          fpv.client?.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
        ]
      };
    }

    // Cria o documento e clona as seções do template
    const doc = await prisma.documentoProposta.create({
      data: {
        propostaId,
        versaoFPV: targetVersao,
        clientId: fpv.clientId,
        empresaEmissoraId: empresaId,
        templateOrigemId: template.id,
        tipo: template.tipo || 'A4',
        valorTotal,
        tenantId: user?.tenantId || null,
        configApresentacao: configApresentacao,
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
    
    revalidatePath(`/propostas-comerciais/${documentoId}`);
    revalidatePath('/propostas-comerciais');
    
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
    const doc = await prisma.documentoProposta.update({
      where: { id },
      data: { status },
      include: {
        proposta: {
          include: { user: true }
        },
        client: true
      }
    });

    if (status === 'Aprovada' && doc?.proposta?.user?.celular) {
      try {
        const { sendOfficialWhatsAppNotification } = await import('@/lib/whatsapp-official');
        const vendedor = doc.proposta.user;
        const numProposta = String(doc.proposta.numero).padStart(3, '0');
        const clienteNome = doc.client?.nomeFantasia || doc.client?.razaoSocial || 'Cliente';

        const text =
          `🎉 *PROPOSTA APROVADA!* 🎉\n\n` +
          `Olá, *${vendedor.nome}*!\n\n` +
          `A proposta comercial *FPV-${numProposta}* do cliente *${clienteNome}* acaba de ser marcada como *Aprovada*!\n\n` +
          `📅 *Data/Hora:* ${formatServerDateTime(new Date(), vendedor?.timezone || 'America/Sao_Paulo')}\n\n` +
          `Parabéns por mais este fechamento! 🚀💼\n` +
          `_Notificação Oficial • SmartBidHub_`;

        await sendOfficialWhatsAppNotification({
          phone: vendedor.celular!,
          message: text,
          fallbackTenantId: doc.tenantId,
        });
      } catch (zapiErr) {
        console.error('Erro ao disparar WhatsApp em updateDocumentoStatus:', zapiErr);
      }
    }

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

export async function getTemplatesProposta(preFetchedUser?: any) {
  const user = preFetchedUser || await getLoggedUser();
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
                     `📅 *Data/Hora:* ${formatServerDateTime(new Date(), vendedor?.timezone || 'America/Sao_Paulo')}\n\n` +
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

export async function uploadSlideImageAction(base64Data: string, fileName: string) {
  try {

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
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, cleanFileName);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${cleanFileName}`;
      return { success: true, fileUrl };
    } catch (fsErr) {
      console.warn('Filesystem read-only. Usando fallback Base64 Data URL:', fsErr);
      return { success: true, fileUrl: base64Data };
    }
  } catch (err: any) {
    console.error('Erro no upload da imagem do slide:', err);
    return { success: false, error: err.message || 'Erro ao salvar a imagem do slide no servidor' };
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
            user: true
          }
        },
        client: true
      }
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    // 1. Atualizar o documento no banco de dados com a recusa
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        status: 'Recusada',
        statusAssinatura: 'RECUSADO'
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
                     `📅 *Data/Hora:* ${formatServerDateTime(new Date(), vendedor?.timezone || 'America/Sao_Paulo')}\n\n` +
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
export async function trackDocumentoView(documentoId: string, tabId: string) {
  const { trackDocumentoView: trackPublicView } = await import('@/app/proposta/ver/[id]/actions');
  return trackPublicView(documentoId, tabId);
}

/**
 * Server Action para responder a uma solicitação de ajustes ou contraproposta do cliente
 */
export async function responderAjusteAction(documentoId: string, negotiationId: string, resposta: string) {
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

    const config = (doc.configApresentacao as any) || {};
    const negotiations = config.negotiations || [];
    
    const vendedorNome = doc.proposta?.user?.nome || 'Consultor';
    
    const updatedNegotiations = negotiations.map((n: any) => {
      if (n.id === negotiationId) {
        return {
          ...n,
          respondida: true,
          resposta: resposta,
          dataResposta: new Date().toISOString(),
          nomeVendedor: vendedorNome
        };
      }
      return n;
    });

    // 1. Atualizar o documento no banco de dados com a resposta
    await prisma.documentoProposta.update({
      where: { id: documentoId },
      data: {
        configApresentacao: {
          ...config,
          negotiations: updatedNegotiations
        }
      }
    });

    revalidatePath('/propostas-comerciais');
    revalidatePath(`/proposta/ver/${documentoId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao responder ajuste:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadClientFileAction(base64Data: string, fileName: string) {
  try {

    // Split base64 prefix
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      if (base64Data.startsWith('http') || base64Data.startsWith('/uploads/')) {
        return { success: true, fileUrl: base64Data };
      }
      return { success: false, error: 'Formato de arquivo inválido' };
    }

    const fileType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Validate size (less than 15MB)
    if (buffer.length > 15 * 1024 * 1024) {
      return { success: false, error: 'Arquivo muito grande (máximo 15MB)' };
    }

    // Determine extension
    let ext = path.extname(fileName).toLowerCase();
    if (!ext) {
      ext = '.png';
      if (fileType.includes('jpeg') || fileType.includes('jpg')) ext = '.jpg';
      else if (fileType.includes('webp')) ext = '.webp';
      else if (fileType.includes('gif')) ext = '.gif';
      else if (fileType.includes('pdf')) ext = '.pdf';
      else if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('ms-excel')) ext = '.xlsx';
      else if (fileType.includes('word') || fileType.includes('officedocument')) ext = '.docx';
    }

    const cleanFileName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, cleanFileName);
      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${cleanFileName}`;
      return { success: true, fileUrl };
    } catch (fsErr) {
      console.warn('Filesystem read-only. Usando fallback Base64 Data URL:', fsErr);
      return { success: true, fileUrl: base64Data };
    }
  } catch (err: any) {
    console.error('Erro no upload do arquivo:', err);
    return { success: false, error: err.message || 'Erro ao gravar arquivo no servidor' };
  }
}

export async function getPropostasComerciaisPageData() {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { docs: [], proposals: [], templates: [], empresas: [], role: 'USER', usersList: [], statuses: [] };

    const [docs, usersList, statuses] = await Promise.all([
      getDocumentosProposta(loggedUser),
      getUsersList(loggedUser),
      getDocumentoStatuses()
    ]);
    return { 
      docs, 
      proposals: [], // Vazio para carga rápida
      templates: [],  // Vazio para carga rápida
      empresas: [],   // Vazio para carga rápida
      role: loggedUser.role, 
      usersList, 
      statuses 
    };
  } catch (error) {
    console.error('Error fetching propostas comerciais page data:', error);
    return { docs: [], proposals: [], templates: [], empresas: [], role: 'USER', usersList: [], statuses: [] };
  }
}

export async function getCreateProposalModalData() {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { proposals: [], templates: [], empresas: [] };

    const [proposals, templates, empresas] = await Promise.all([
      getPropostas(loggedUser),
      getTemplatesProposta(loggedUser),
      getEmpresasEmissoras()
    ]);
    return { proposals, templates, empresas };
  } catch (error) {
    console.error('Error fetching create proposal modal data:', error);
    return { proposals: [], templates: [], empresas: [] };
  }
}

export async function getDocumentoConfigApresentacao(id: string) {
  try {
    const doc = await prisma.documentoProposta.findUnique({
      where: { id },
      select: {
        id: true,
        versaoFPV: true,
        valorTotal: true,
        configApresentacao: true,
        client: {
          select: {
            nomeFantasia: true,
            razaoSocial: true,
            whatsapp: true,
            contato: true,
          },
        },
        empresaEmissora: {
          select: {
            nomeFantasia: true,
            razaoSocial: true,
          },
        },
        proposta: {
          select: {
            numero: true,
            lead: {
              select: {
                telefone: true,
                contatoNome: true,
                contacts: {
                  take: 1,
                  select: { nome: true, telefone: true },
                },
              },
            },
            versoes: {
              orderBy: { versao: 'desc' },
              take: 5,
              select: {
                versao: true,
                precoVenda: true,
                metadados: true,
                items: {
                  take: 2,
                  select: { nomeCargo: true, tipoItem: true },
                },
              },
            },
          },
        },
      },
    });

    if (!doc) {
      return { success: false, error: 'Documento não encontrado.' };
    }

    const cfg = (doc.configApresentacao as Record<string, any>) || null;
    const rev = doc.versaoFPV || doc.proposta?.versoes?.[0]?.versao || 1;
    const matchedVer =
      doc.proposta?.versoes?.find((v) => v.versao === rev) || doc.proposta?.versoes?.[0];
    const meta = (matchedVer?.metadados as Record<string, any>) || {};

    const contatoWhatsApp =
      cfg?.contatoWhatsApp ||
      meta.celular ||
      meta.whatsapp ||
      meta.telefone ||
      doc.client?.whatsapp ||
      doc.proposta?.lead?.telefone ||
      doc.proposta?.lead?.contacts?.[0]?.telefone ||
      '';

    const contatoNome =
      cfg?.contatoNome ||
      meta.contato ||
      doc.client?.contato ||
      doc.proposta?.lead?.contatoNome ||
      doc.proposta?.lead?.contacts?.[0]?.nome ||
      '';

    const clienteNome =
      doc.client?.nomeFantasia || doc.client?.razaoSocial || meta.clienteNome || 'Cliente';
    const empresaEmissora =
      doc.empresaEmissora?.nomeFantasia || doc.empresaEmissora?.razaoSocial || 'SmartBid Hub';
    const valorTotal =
      Number(doc.valorTotal || 0) ||
      Number(matchedVer?.precoVenda || 0) ||
      Number(meta?.resultado?.faturamentoBruto || 0);
    const tipoProposta =
      meta.tipoProposta ||
      (matchedVer?.items?.some((i: any) => i.tipoItem === 'SPOT') ? 'SPOT' : 'RECORRENTE');
    const cargoPrincipal = matchedVer?.items?.[0]?.nomeCargo || '';

    return {
      success: true,
      configApresentacao: cfg,
      shareContext: {
        docId: doc.id,
        numeroFPV: doc.proposta?.numero || 1,
        versaoFPV: rev,
        clienteNome,
        contatoNome,
        contatoWhatsApp,
        empresaEmissora,
        valorTotal,
        tipoServicos: meta.tipoServicos || '',
        objetoProposta: meta.objetoProposta || '',
        tipoProposta,
        cargoPrincipal,
      },
    };
  } catch (error: any) {
    console.error('Error fetching configApresentacao:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia o link executivo da proposta direto no WhatsApp do cliente com Card Rico estilo Autentique (via Z-API /send-link)
 */
export async function sendProposalLinkViaZApiAction(params: {
  documentoId: string;
  phone: string;
  contatoNome?: string;
  customMessage?: string;
}) {
  try {
    const user = await getLoggedUser();
    if (!user) return { success: false, error: 'Sessão expirada.' };

    const cleanPhone = normalizeWhatsAppDigits(params.phone);
    if (cleanPhone.length < 12) {
      return { success: false, error: 'Informe um número de WhatsApp válido com DDD.' };
    }

    const doc = await prisma.documentoProposta.findUnique({
      where: { id: params.documentoId },
      include: {
        client: true,
        empresaEmissora: true,
        tenant: true,
        proposta: {
          include: {
            versoes: {
              orderBy: { versao: 'desc' },
              take: 3,
              include: { items: { take: 2 } },
            },
          },
        },
      },
    });

    if (!doc) return { success: false, error: 'Proposta comercial não encontrada.' };

    const rev = doc.versaoFPV || doc.proposta?.versoes?.[0]?.versao || 1;
    const matchedVer =
      doc.proposta?.versoes?.find((v) => v.versao === rev) || doc.proposta?.versoes?.[0];
    const meta = (matchedVer?.metadados as Record<string, any>) || {};
    const cfg = (doc.configApresentacao as Record<string, any>) || {};

    const clienteNome =
      doc.client?.nomeFantasia || doc.client?.razaoSocial || meta.clienteNome || 'Cliente';
    const emissoraNome =
      doc.empresaEmissora?.nomeFantasia || doc.empresaEmissora?.razaoSocial || 'SmartBid Hub';
    const valorProposta =
      Number(doc.valorTotal || 0) ||
      Number(matchedVer?.precoVenda || 0) ||
      Number(meta?.resultado?.faturamentoBruto || 0);
    const tipoProposta =
      meta.tipoProposta ||
      ((matchedVer as any)?.items?.some((i: any) => i.tipoItem === 'SPOT') ? 'SPOT' : 'RECORRENTE');
    const cargoPrincipal = (matchedVer as any)?.items?.[0]?.nomeCargo || '';

    const shareUrl = buildExecutiveProposalUrl({
      docId: doc.id,
      numeroFPV: doc.proposta?.numero,
      versaoFPV: rev,
      clienteNome,
    });
    const ogImageUrl = `https://www.smartbidhub.com.br/og/proposta/${doc.id}.png?v=${rev}-8`;
    const cardTitle = buildProposalCardHeadline({
      tipoServicos: meta.tipoServicos,
      objetoProposta: meta.objetoProposta,
      cargoPrincipal,
      numeroFPV: doc.proposta?.numero,
      versaoFPV: rev,
      clienteNome,
    });
    const cardDescription = buildProposalCardSubtitle({
      clienteNome,
      valorTotal: valorProposta,
      tipoProposta,
      empresaEmissora: emissoraNome,
    });

    const messageBody =
      (params.customMessage || '').trim() ||
      buildExecutiveWhatsAppMessage({
        docId: doc.id,
        numeroFPV: doc.proposta?.numero,
        versaoFPV: rev,
        clienteNome,
        contatoNome: params.contatoNome || meta.contato || doc.client?.contato,
        empresaEmissora: emissoraNome,
        codigoAcessoCustom: cfg?.regrasAcesso?.codigoAcessoCustom,
      });

    // linkType 'LARGE' + message = shareUrl: mesmo formato que renderizou corretamente às 19:37
    // (imagem no topo + bloco cinza com título e cliente/valor), agora com a faixa fina 900x250.
    const linkPayload = JSON.stringify({
      phone: cleanPhone,
      message: messageBody,
      image: ogImageUrl,
      linkUrl: shareUrl,
      title: cardTitle,
      linkDescription: cardDescription,
      linkType: 'LARGE',
    });

    // Prioriza a instância Z-API da própria empresa (para sair do WhatsApp comercial do tenant), com fallback automático para a oficial
    const candidates: Array<{ instanceId: string; token: string; clientToken: string }> = [];
    if (
      doc.tenant?.whatsappConnected &&
      doc.tenant.whatsappInstanceId &&
      doc.tenant.whatsappToken &&
      doc.tenant.whatsappClientToken
    ) {
      candidates.push({
        instanceId: doc.tenant.whatsappInstanceId.trim(),
        token: doc.tenant.whatsappToken.trim(),
        clientToken: doc.tenant.whatsappClientToken.trim(),
      });
    }

    const { resolveOfficialZApiCredentials } = await import('@/lib/whatsapp-official');
    const official = await resolveOfficialZApiCredentials(doc.tenantId);
    if (
      official.instanceId &&
      official.token &&
      official.clientToken &&
      !candidates.some((c) => c.instanceId === official.instanceId)
    ) {
      candidates.push({
        instanceId: official.instanceId,
        token: official.token,
        clientToken: official.clientToken,
      });
    }

    if (candidates.length === 0) {
      return {
        success: false,
        error: 'Instância de WhatsApp API não conectada.',
      };
    }

    let sentOk = false;
    let lastErrorMsg = '';
    for (const cred of candidates) {
      const zRes = await fetch(
        `https://api.z-api.io/instances/${cred.instanceId}/token/${cred.token}/send-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': cred.clientToken,
          },
          body: linkPayload,
        }
      );
      const zData = await zRes.json().catch(() => ({}));
      if (zRes.ok && !zData?.error) {
        sentOk = true;
        break;
      }
      lastErrorMsg = zData?.error || zData?.message || `Falha HTTP ${zRes.status} na Z-API.`;
    }

    if (!sentOk) {
      return {
        success: false,
        error: lastErrorMsg || 'Não foi possível disparar o card na Z-API.',
      };
    }

    // Garante validade mínima de 10 dias caso a proposta estivesse sem validade configurada ou expirada, e marca como Enviada se Rascunho
    const nextCfg: Record<string, any> = {
      ...cfg,
      contatoWhatsApp: params.phone,
      ...(params.contatoNome ? { contatoNome: params.contatoNome } : {}),
    };
    const isExpiredOrMissing =
      !nextCfg.linkExpiresAt || new Date() > new Date(nextCfg.linkExpiresAt);
    if (isExpiredOrMissing) {
      const days = Number(nextCfg.validadeDays) > 0 ? Number(nextCfg.validadeDays) : 10;
      nextCfg.validadeDays = days;
      nextCfg.linkCreatedAt = new Date().toISOString();
      nextCfg.linkExpiresAt = new Date(Date.now() + days * 86400000).toISOString();
    }

    await prisma.documentoProposta.update({
      where: { id: doc.id },
      data: {
        ...(doc.status?.toLowerCase() === 'rascunho' ? { status: 'Enviada' } : {}),
        configApresentacao: nextCfg as any,
      },
    });

    revalidatePath('/propostas-comerciais');
    return { success: true, shareUrl };
  } catch (err: any) {
    console.error('Erro em sendProposalLinkViaZApiAction:', err);
    return { success: false, error: err?.message || 'Erro ao disparar link no WhatsApp.' };
  }
}

