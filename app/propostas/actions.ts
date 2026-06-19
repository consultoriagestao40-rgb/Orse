'use server';
import { unstable_noStore as noStore } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const defaultItensInclusosExcluidos = [
  { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
  { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
  { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
  { id: '4', descricao: 'Produtos químicos', incluso: false },
  { id: '5', descricao: 'Descartaveis', incluso: false }
];


async function getSubordinateIds(managerId: string): Promise<string[]> {
  try {
    const subs = await prisma.user.findMany({
      where: { managerId },
      select: { id: true }
    });
    const ids = subs.map(s => s.id);
    const subIdsPromises = ids.map(id => getSubordinateIds(id));
    const nestedIds = await Promise.all(subIdsPromises);
    return [...ids, ...nestedIds.flat()];
  } catch (error) {
    console.error('Erro ao buscar subordinados recursivamente:', error);
    return [];
  }
}

export async function getCurrentUserRole() {
  try {
    const user = await getLoggedUser();
    return user?.role || 'USER';
  } catch {
    return 'USER';
  }
}

export async function getLoggedUser() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    // Tenta primeiro sb_session que é o email (100% confiável)
    const sessionEmail = cookieStore.get('sb_session')?.value;
    if (sessionEmail) {
      const emailNormal = sessionEmail.toLowerCase().trim();
      const user = await prisma.user.findFirst({
        where: { email: emailNormal },
        include: { tenant: true }
      });
      if (user) return user;
    }

    // Fallback para o sb_user se sb_session não existir
    const sbUser = cookieStore.get('sb_user')?.value;
    if (sbUser) {
      let data: any = null;
      let cleaned = sbUser.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      try {
        data = JSON.parse(decodeURIComponent(cleaned));
      } catch {
        data = JSON.parse(sbUser);
      }
      
      if (data) {
        if (data.email) {
          const user = await prisma.user.findFirst({
            where: { email: data.email.toLowerCase().trim() },
            include: { tenant: true }
          });
          if (user) return user;
        }
        if (data.nome) {
          const user = await prisma.user.findFirst({
            where: { nome: data.nome },
            include: { tenant: true }
          });
          if (user) return user;
        }
      }
    }
  } catch (error) {
    console.error('Erro ao obter usuario logado:', error);
  }
  return null;
}

export async function deleteProposta(id: string) {
  try {
    // Verifica se o usuário é admin antes de deletar
    const user = await getLoggedUser();
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Sem permissão para excluir propostas.' };
    }
    await prisma.proposta.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir proposta:', error);
    return { success: false, error: error.message };
  }
}

// Ações para gerenciar os Status das Propostas
export async function getPropostaStatuses() {
  try {
    // Correção automática de cores legadas de status no banco de dados
    await prisma.propostaStatus.updateMany({
      where: {
        color: {
          contains: 'bg-emerald-100'
        }
      },
      data: {
        color: 'bg-green-100 text-green-800 border border-green-200'
      }
    });

    const statuses = await prisma.propostaStatus.findMany({ orderBy: { nome: 'asc' } });
    if (statuses.length === 0) {
      // Popula com defaults se a tabela estiver vazia
      await prisma.propostaStatus.createMany({
        data: [
          { nome: 'ATIVO', color: 'bg-sky-100 text-sky-800 border border-sky-200' },
          { nome: 'EM REVISÃO', color: 'bg-orange-100 text-orange-800 border border-orange-200' },
          { nome: 'APROVADA', color: 'bg-green-100 text-green-800 border border-green-200' },
          { nome: 'REJEITADA', color: 'bg-red-100 text-red-800 border border-red-200' },
          { nome: 'AGUARDANDO CLIENTE', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
        ],
        skipDuplicates: true,
      });
      return prisma.propostaStatus.findMany({ orderBy: { nome: 'asc' } });
    }
    return statuses;
  } catch (error) {
    console.error('Erro ao buscar statuses:', error);
    return [];
  }
}

export async function createPropostaStatus(nome: string) {
  try {
    const s = await prisma.propostaStatus.create({
      data: { nome: nome.toUpperCase().trim() },
    });
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePropostaStatus(id: string) {
  try {
    await prisma.propostaStatus.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePropostaStatusParam(id: string, nome: string, color?: string) {
  try {
    const data: any = { nome: nome.toUpperCase().trim() };
    if (color) {
      data.color = color;
    }
    const oldStatus = await prisma.propostaStatus.findUnique({ where: { id } });
    const s = await prisma.propostaStatus.update({
      where: { id },
      data
    });
    if (oldStatus && oldStatus.nome.toLowerCase() !== s.nome.toLowerCase()) {
      await prisma.proposta.updateMany({
        where: { status: { equals: oldStatus.nome, mode: 'insensitive' } },
        data: { status: s.nome }
      });
    }
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePropostaStatusParam(id: string, ativo: boolean) {
  try {
    const s = await prisma.propostaStatus.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDocumentoStatuses() {
  try {
    const statuses = await prisma.documentoStatus.findMany({
      orderBy: { nome: 'asc' },
    });
    if (statuses.length === 0) {
      // Seed default DocumentoStatus if empty
      await prisma.documentoStatus.createMany({
        data: [
          { nome: "RASCUNHO", color: "bg-slate-100 text-slate-600 border border-slate-200" },
          { nome: "ENVIADA", color: "bg-sky-100 text-sky-800 border border-sky-200" },
          { nome: "APROVADA", color: "bg-green-100 text-green-800 border border-green-200" },
          { nome: "RECUSADA", color: "bg-red-100 text-red-800 border border-red-200" }
        ],
        skipDuplicates: true,
      });
      return prisma.documentoStatus.findMany({ orderBy: { nome: 'asc' } });
    }
    return statuses;
  } catch (error) {
    console.error('Erro ao buscar documento statuses:', error);
    return [];
  }
}

export async function createDocumentoStatus(nome: string) {
  try {
    const s = await prisma.documentoStatus.create({
      data: { nome: nome.toUpperCase().trim() },
    });
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDocumentoStatus(id: string) {
  try {
    await prisma.documentoStatus.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDocumentoStatusParam(id: string, nome: string, color?: string) {
  try {
    const data: any = { nome: nome.toUpperCase().trim() };
    if (color) {
      data.color = color;
    }
    const oldStatus = await prisma.documentoStatus.findUnique({ where: { id } });
    const s = await prisma.documentoStatus.update({
      where: { id },
      data
    });
    if (oldStatus && oldStatus.nome.toLowerCase() !== s.nome.toLowerCase()) {
      await prisma.documentoProposta.updateMany({
        where: { status: { equals: oldStatus.nome, mode: 'insensitive' } },
        data: { status: s.nome }
      });
    }
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleDocumentoStatusParam(id: string, ativo: boolean) {
  try {
    const s = await prisma.documentoStatus.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/');
    return { success: true, data: s };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// Helpers
async function getDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'admin@smartbid.com', nome: 'Administrador Principal', role: 'ADMIN', password: 'admin' }
    });
  }
  return user;
}

export async function saveProposta(data: any) {
  const loggedUser = await getLoggedUser();
  const user = loggedUser || await getDefaultUser();
  const { id, cliente, premissas, encargos, equipe, resultado, dreTaxPercent, dreEncargos, changelog, novaVersao } = data;

  try {
    let propostaId = id;

    // Encontra o cliente de forma case-insensitive e limpa espaços (filtrando por tenant)
    const clientWhere: any = {
      nomeFantasia: {
        equals: cliente.cliente.trim(),
        mode: 'insensitive'
      }
    };
    clientWhere.tenantId = user?.tenantId;

    let dbClient = await prisma.client.findFirst({
      where: clientWhere
    });

    if (!dbClient) {
      const clientWhereContains: any = {
        nomeFantasia: {
          contains: cliente.cliente.trim(),
          mode: 'insensitive'
        }
      };
      clientWhereContains.tenantId = user?.tenantId;
      dbClient = await prisma.client.findFirst({
        where: clientWhereContains
      });
    }

    // Se ainda não encontrar, divide por delimitadores comuns (| ou -) e tenta buscar cada parte
    if (!dbClient) {
      const parts = cliente.cliente.split(/[|\-]/).map((p: string) => p.trim()).filter(Boolean);
      for (const part of parts) {
        dbClient = await prisma.client.findFirst({
          where: {
            nomeFantasia: {
              equals: part,
              mode: 'insensitive'
            },
            tenantId: user?.tenantId || null
          }
        });
        if (!dbClient) {
          dbClient = await prisma.client.findFirst({
            where: {
              nomeFantasia: {
                contains: part,
                mode: 'insensitive'
              },
              tenantId: user?.tenantId || null
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
      dbClient = allClients.find((c: any) => 
        cliente.cliente.toLowerCase().includes(c.nomeFantasia.trim().toLowerCase()) ||
        (c.razaoSocial && cliente.cliente.toLowerCase().includes(c.razaoSocial.trim().toLowerCase()))
      ) || null;
    }

    if (propostaId) {
      // Editar proposta existente - verifica se tem acesso
      const existingProposta = await prisma.proposta.findUnique({
        where: { id: propostaId }
      });
      if (!existingProposta) {
        return { success: false, error: 'Proposta não encontrada.' };
      }
      if (user.role !== 'ADMIN') {
        if (user.role === 'MANAGER') {
          const subordinateIds = await getSubordinateIds(user.id);
          const allowedIds = [user.id, ...subordinateIds];
          if (!allowedIds.includes(existingProposta.userId)) {
            return { success: false, error: 'Sem permissão para editar esta proposta.' };
          }
        } else {
          // USER
          if (existingProposta.userId !== user.id) {
            return { success: false, error: 'Sem permissão para editar esta proposta.' };
          }
        }
      }

      // Sincroniza/atualiza o clientId no banco se mudou ou se agora o cliente existe
      await prisma.proposta.update({
        where: { id: propostaId },
        data: { clientId: dbClient?.id || null }
      });
    } else {
      // Criar nova proposta
      const newProposta = await prisma.proposta.create({
        data: {
          userId: user.id,
          clientId: dbClient?.id || null,
          status: 'ATIVO',
          tenantId: user.tenantId
        }
      });
      propostaId = newProposta.id;
    }

    // Se o cliente existe, atualiza os dados dele (incluindo o segmento) no cadastro geral de clientes
    if (dbClient) {
      await prisma.client.update({
        where: { id: dbClient.id },
        data: {
          segmento: cliente.segmento !== undefined ? cliente.segmento : undefined,
          contato: cliente.contato !== undefined ? cliente.contato : undefined,
          email: cliente.email !== undefined ? cliente.email : undefined,
          whatsapp: cliente.celular !== undefined ? (cliente.celular || null) : undefined,
          contatoCargo: cliente.contatoCargo !== undefined ? cliente.contatoCargo : undefined,
        }
      }).catch(err => console.error('Erro ao atualizar segmento do cliente:', err));
    }

    const lastVersion = await prisma.propostaVersao.findFirst({
      where: { propostaId },
      orderBy: { versao: 'desc' }
    });

    // novaVersao === false: sobrescreve a versão atual (mesma revisão)
    // novaVersao === true ou undefined: cria nova revisão
    const criarNova = novaVersao !== false;
    const nextVersion = criarNova
      ? (lastVersion ? lastVersion.versao + 1 : 1)
      : (lastVersion ? lastVersion.versao : 1);

    const metadados = {
      clienteNome: cliente.cliente,
      segmento: cliente.segmento || '',
      contato: cliente.contato,
      celular: cliente.celular,
      email: cliente.email,
      objetoProposta: cliente.objetoProposta,
      hasEscopoTecnico: cliente.hasEscopoTecnico || false,
      escopoTecnico: cliente.escopoTecnico || '',
      cidade: cliente.cidade,
      dataElaboracao: cliente.dataElaboracao,
      numeroProposta: cliente.numeroProposta,
      revisao: 'R' + String(nextVersion).padStart(2, '0'),
      tipoServicos: cliente.tipoServicos,
      tipoProposta: cliente.tipoProposta || 'RECORRENTE',
      vendedorNome: cliente.vendedorNome || 'Ádamo Quadros',
      vendedorCargo: cliente.vendedorCargo || 'Novos Negócios',
      vendedorTelefone: cliente.vendedorTelefone || '(41) 9 9737-0880',
      vendedorEmail: cliente.vendedorEmail || 'contato@silvaconsultoria.com.br',
      quadroEfetivoSubtitulo: cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
      quadroEfetivoClausula1: cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
      quadroEfetivoClausula2: cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
      quadroEfetivoClausula3: cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
      condicaoColaboradores1: cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
      condicaoColaboradores2: cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
      condicaoColaboradores3: cliente.condicaoColaboradores3 || '2 Vales transporte por dia.',
      condicaoCliente1: cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
      condicaoCliente2: cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao disssídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
      condicaoCliente3: cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.',
      razaoSocial: cliente.razaoSocial || '',
      cnpj: cliente.cnpj || '',
      dataInicio: cliente.dataInicio || '',
      dataVencimento: cliente.dataVencimento || '',
      contatoCargo: cliente.contatoCargo || '',
      condicoesColaboradores: cliente.condicoesColaboradores || [],
      condicoesCliente: cliente.condicoesCliente || [],
      itensInclusosExcluidos: data.itensInclusosExcluidos || defaultItensInclusosExcluidos,
      insumos: {
        ...data.insumos,
        detalheMateriais: data.insumos.detalheMateriais || [],
        detalheMaquinas: data.insumos.detalheMaquinas || [],
        detalheDescartaveis: data.insumos.detalheDescartaveis || []
      },
      dreTaxPercent: dreTaxPercent !== undefined ? dreTaxPercent : null,
      dreEncargos: dreEncargos || null,
      encargos: encargos || null,
      changelog: changelog || 'Criação inicial da proposta'
    };

    const itemsData = equipe.map((item: any) => {
      const itemRes = resultado?.items?.find((r: any) => r.id === item.id);
      return {
        nomeCargo: item.nomeCargo,
        quantidade: item.quantidade || 1,
        escala: item.escala || '5x2',
        entrada: item.parametrosPosto?.horarioInicio || '08:00',
        saida: item.parametrosPosto?.horarioFim || '17:00',
        configFinanceira: (item.cargo || item.configFinanceira || {}) as any,
        ativosConfig: {
          ...(item.ativosConfig || {}),
          parametrosPosto: item.parametrosPosto
        } as any,
        custoDireto: itemRes?.detalhes?.remuneracao || item.custoDireto || 0,
        custoTotalItem: itemRes?.custoTotal || item.custoTotalItem || 0,
        
        // Novos campos para a modalidade Spot
        tipoItem: item.tipoItem || 'POSTO_FIXO',
        unidadeMedida: item.unidadeMedida || null,
        quantidadeDemanda: item.quantidadeDemanda !== undefined && item.quantidadeDemanda !== null ? Number(item.quantidadeDemanda) : null,
        precoUnitarioDemanda: item.precoUnitarioDemanda !== undefined && item.precoUnitarioDemanda !== null ? Number(item.precoUnitarioDemanda) : null,
        comissaoVendedorPct: item.comissaoVendedorPct !== undefined && item.comissaoVendedorPct !== null ? Number(item.comissaoVendedorPct) : 0,
        equipeTecnicaId: item.equipeTecnicaId || null
      };
    });

    let newVersao: any;

    if (!criarNova && lastVersion) {
      // Atualiza a versão existente
      await prisma.propostaItem.deleteMany({ where: { versaoId: lastVersion.id } });
      newVersao = await prisma.propostaVersao.update({
        where: { id: lastVersion.id },
        data: {
          impostos: { list: premissas.tributos, sindicatoId: cliente.sindicatoId } as any,
          margens: {
            adm: premissas.taxaAdm,
            lucro: premissas.margemLucro,
            reservaTecnicaPct: premissas.reservaTecnicaPct,
            manutencaoPct: premissas.manutencaoPct,
            comissaoVendedor: premissas.comissaoVendedor
          } as any,
          metadados: metadados as any,
          custoTotal: resultado.custoDiretoTotal || 0,
          precoVenda: resultado.faturamentoBruto || 0,
          items: {
            create: itemsData
          }
        }
      });
    } else {
      // Cria nova versão
      newVersao = await prisma.propostaVersao.create({
        data: {
          propostaId,
          versao: nextVersion,
          impostos: { list: premissas.tributos, sindicatoId: cliente.sindicatoId } as any,
          margens: {
            adm: premissas.taxaAdm,
            lucro: premissas.margemLucro,
            reservaTecnicaPct: premissas.reservaTecnicaPct,
            manutencaoPct: premissas.manutencaoPct,
            comissaoVendedor: premissas.comissaoVendedor
          } as any,
          metadados: metadados as any,
          custoTotal: resultado.custoDiretoTotal || 0,
          precoVenda: resultado.faturamentoBruto || 0,
          items: {
            create: itemsData
          }
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        propostaId,
        userId: user.id,
        action: !id ? 'CREATE' : (!criarNova && lastVersion ? 'VERSION_UPDATE' : 'VERSION_SAVE'),
        details: { versao: nextVersion, changelog: changelog || 'Criação inicial da proposta' }
      }
    });

    revalidatePath('/');
    revalidatePath('/propostas-comerciais');
    revalidatePath('/propostas-comerciais/templates');
    const propostaCompleta = await prisma.proposta.findUnique({ where: { id: propostaId }, select: { numero: true } });
    const numeroProposta = propostaCompleta ? `FPV-${propostaCompleta.numero.toString().padStart(3, '0')}` : '';
    return { success: true, propostaId, versaoId: newVersao.id, versao: nextVersion, numeroProposta };
  } catch (error: any) {
    console.error('Error saving proposta:', error);
    return { success: false, error: error.message };
  }
}

export async function getPropostas(preFetchedUser?: any) {
  noStore();
  try {
    const loggedUser = preFetchedUser || await getLoggedUser();
    if (!loggedUser) return [];

    let whereClause: any = {};
    whereClause.tenantId = loggedUser.tenantId;
    
    if (loggedUser.role === 'MANAGER') {
      const subordinateIds = await getSubordinateIds(loggedUser.id);
      whereClause.OR = [
        { userId: { in: [loggedUser.id, ...subordinateIds] } },
        { shares: { some: { userId: loggedUser.id } } }
      ];
    } else if (loggedUser.role === 'USER') {
      whereClause.OR = [
        { userId: loggedUser.id },
        { shares: { some: { userId: loggedUser.id } } }
      ];
    }

    const propostas = await prisma.proposta.findMany({
      where: whereClause,
      include: {
        client: true,
        user: true,
        shares: {
          include: {
            user: true
          }
        },
        versoes: {
          select: {
            versao: true,
            precoVenda: true,
            metadados: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return propostas.map(p => {
      const sortedVersoes = [...p.versoes].sort((a, b) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      const meta = (lastVersao?.metadados as any) || {};
      // Prioriza nome fantasia do cadastro, depois metadados salvos
      const clienteNome = p.client?.nomeFantasia || meta.clienteNome || 'Cliente não identificado';

      return {
        id: p.id,
        numero: `FPV-${p.numero.toString().padStart(3, '0')}`,
        cliente: clienteNome,
        clientId: p.clientId,
        segmento: p.client?.segmento || 'Sem Segmento',
        data: p.createdAt.toLocaleDateString('pt-BR'),
        valor: lastVersao?.precoVenda || 0,
        status: p.status,
        versao: lastVersao?.versao || 1,
        usuario: p.user.nome,
        userId: p.user.id,
        avatarUrl: p.user.avatarUrl,
        shares: p.shares
      };
    });
  } catch (error) {
    console.error('Error fetching propostas:', error);
    return [];
  }
}

export async function updatePropostaStatus(id: string, status: string) {
  try {
    const loggedUser = await getLoggedUser();
    await prisma.proposta.update({ where: { id }, data: { status } });

    if (loggedUser) {
      await prisma.auditLog.create({
        data: {
          propostaId: id,
          userId: loggedUser.id,
          action: 'STATUS_CHANGE',
          details: { newStatus: status }
        }
      });
    }

    // Registra a data de transição para "ACEITA" ou similar em metadados da última versão
    const lastVersion = await prisma.propostaVersao.findFirst({
      where: { propostaId: id },
      orderBy: { versao: 'desc' }
    });

    if (lastVersion) {
      const meta = (lastVersion.metadados as any) || {};
      meta.statusHistory = meta.statusHistory || [];
      meta.statusHistory.push({
        status,
        date: new Date().toISOString()
      });
      if (status.toUpperCase().startsWith('ACEIT') || status.toUpperCase().startsWith('APROV')) {
        meta.dataAceitacao = new Date().toISOString();
      }
      await prisma.propostaVersao.update({
        where: { id: lastVersion.id },
        data: { metadados: meta }
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating proposta status:', error);
    return { success: false, error: error.message };
  }
}

export async function getPropostaCompleta(id: string, versionId?: string, isPublic: boolean = false) {
  noStore();
  try {
    const loggedUser = isPublic ? null : await getLoggedUser();
    if (!isPublic && !loggedUser) return null;

    const proposta = await prisma.proposta.findUnique({
      where: { id },
      include: {
        user: true,
        client: true,
        versoes: {
          orderBy: { versao: 'desc' },
          include: { items: true }
        },
        shares: true
      }
    });

    if (!proposta || !proposta.versoes.length) return null;

    // Validação rígida de isolamento de inquilino (Tenant)
    if (!isPublic && loggedUser && proposta.tenantId !== loggedUser.tenantId) {
      return null;
    }

    // Validação de segurança por perfil
    if (!isPublic && loggedUser && loggedUser.role !== 'ADMIN') {
      const isShared = (proposta as any).shares?.some((s: any) => s.userId === loggedUser.id) || false;
      if (loggedUser.role === 'MANAGER') {
        const subordinateIds = await getSubordinateIds(loggedUser.id);
        const allowedIds = [loggedUser.id, ...subordinateIds];
        if (!allowedIds.includes(proposta.userId) && !isShared) {
          return null;
        }
      } else {
        // USER
        if (proposta.userId !== loggedUser.id && !isShared) {
          return null;
        }
      }
    }

    const availableVersions = proposta.versoes.map(v => {
      const meta = (v.metadados as any) || {};
      return {
        id: v.id,
        versao: v.versao,
        data: v.dataCriacao.toLocaleDateString('pt-BR'),
        valor: v.precoVenda,
        changelog: meta.changelog || 'Criação inicial da proposta'
      };
    });

    const v = versionId
      ? proposta.versoes.find(ver => ver.id === versionId) || proposta.versoes[0]
      : proposta.versoes[0];

    const meta = (v.metadados as any) || {};
    const impostos = v.impostos as any;
    const margens = v.margens as any;

    const returnObj: any = {
      id: proposta.id,
      numero: `FPV-${proposta.numero.toString().padStart(3, '0')}`,
      clientId: proposta.clientId,
      availableVersions,
      cliente: {
        id: proposta.clientId,
        cliente: meta.clienteNome || proposta.client?.nomeFantasia || '',
        clienteNome: meta.clienteNome || proposta.client?.nomeFantasia || '',
        nomeFantasia: meta.clienteNome || proposta.client?.nomeFantasia || '',
        segmento: meta.segmento || proposta.client?.segmento || '',
        contato: meta.contato || proposta.client?.contato || '',
        celular: meta.celular || proposta.client?.whatsapp || '',
        email: meta.email || proposta.client?.email || '',
        objetoProposta: meta.objetoProposta || '',
        hasEscopoTecnico: meta.hasEscopoTecnico || false,
        escopoTecnico: meta.escopoTecnico || '',
        cidade: meta.cidade || '',
        dataElaboracao: meta.dataElaboracao || '',
        numeroProposta: meta.numeroProposta || '',
        revisao: meta.revisao || '',
        tipoServicos: meta.tipoServicos || '',
        tipoProposta: meta.tipoProposta || 'RECORRENTE',
        vendedorNome: meta.vendedorNome || proposta.user?.nome || 'Ádamo Quadros',
        vendedorCargo: meta.vendedorCargo || proposta.user?.cargo || 'Novos Negócios',
        vendedorTelefone: meta.vendedorTelefone || proposta.user?.celular || '(41) 9 9737-0880',
        vendedorEmail: meta.vendedorEmail || proposta.user?.email || 'contato@silvaconsultoria.com.br',
        vendedorAvatarUrl: proposta.user?.avatarUrl || null,
        quadroEfetivoSubtitulo: meta.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
        quadroEfetivoClausula1: meta.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
        quadroEfetivoClausula2: meta.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
        quadroEfetivoClausula3: meta.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
        condicaoColaboradores1: meta.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
        condicaoColaboradores2: meta.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
        condicaoColaboradores3: meta.condicaoColaboradores3 || '2 Vales transporte por dia.',
        condicaoCliente1: meta.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
        condicaoCliente2: meta.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
        condicaoCliente3: meta.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.',
        razaoSocial: meta.razaoSocial || proposta.client?.razaoSocial || '',
        cnpj: meta.cnpj || proposta.client?.cnpj || '',
        dataInicio: meta.dataInicio || '',
        dataVencimento: meta.dataVencimento || '',
        contatoCargo: meta.contatoCargo || proposta.client?.contatoCargo || '',
        condicoesColaboradores: meta.condicoesColaboradores || [],
        condicoesCliente: meta.condicoesCliente || [],
        itensInclusosExcluidos: (() => {
          const rawItens = meta.itensInclusosExcluidos || [];
          return rawItens.length > 0 ? rawItens : defaultItensInclusosExcluidos;
        })()
      },
      insumos: {
        materiais: meta.insumos?.materiais || 0,
        maquinas: meta.insumos?.maquinas || 0,
        descartaveis: meta.insumos?.descartaveis || 0,
        servicos: meta.insumos?.servicos || 0,
        servicosDescricao: meta.insumos?.servicosDescricao || '',
        detalheMateriais: meta.insumos?.detalheMateriais || [],
        detalheMaquinas: meta.insumos?.detalheMaquinas || [],
        detalheDescartaveis: meta.insumos?.detalheDescartaveis || []
      },
      premissas: {
        taxaAdm: margens?.adm || 5,
        margemLucro: margens?.lucro || 10,
        comissaoVendedor: margens?.comissaoVendedor || 0,
        reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
        manutencaoPct: margens?.manutencaoPct || 0,
        tributos: (() => {
          if (Array.isArray(impostos)) return impostos;
          if (impostos && typeof impostos === 'object') {
            if (impostos.list && Array.isArray(impostos.list)) return impostos.list;
            return Object.keys(impostos)
              .filter(k => !isNaN(Number(k)))
              .map(k => impostos[k]);
          }
          return [];
        })(),
        meta: { sindicatoId: impostos?.sindicatoId || '' }
      },
      equipe: v.items.map((i: any) => {
        const itemAtivosConfig = (i.ativosConfig as any) || {};
        return {
          id: i.id,
          nomeCargo: i.nomeCargo,
          quantidade: i.quantidade,
          escala: i.escala,
          cargo: i.configFinanceira,
          ativosConfig: itemAtivosConfig,
          parametrosPosto: itemAtivosConfig.parametrosPosto || {
            horarioInicio: i.entrada || '08:00',
            horarioFim: i.saida || '17:00',
            insalubridadePercent: 0,
            periculosidade: false,
            adicionalNoturnoHoras: 0,
            diasTrabalhadosMes: 22,
            intrajornadaHoras: 0,
            dsrPercent: 0,
            episAdicionais: []
          },
          tipoItem: i.tipoItem || 'POSTO_FIXO',
          unidadeMedida: i.unidadeMedida || null,
          quantidadeDemanda: i.quantidadeDemanda !== null && i.quantidadeDemanda !== undefined ? Number(i.quantidadeDemanda) : null,
          precoUnitarioDemanda: i.precoUnitarioDemanda !== null && i.precoUnitarioDemanda !== undefined ? Number(i.precoUnitarioDemanda) : null,
          comissaoVendedorPct: i.comissaoVendedorPct !== null && i.comissaoVendedorPct !== undefined ? Number(i.comissaoVendedorPct) : 0,
          equipeTecnicaId: i.equipeTecnicaId || null
        };
      }),
      versao: v.versao,
      dreTaxPercent: meta.dreTaxPercent !== undefined ? meta.dreTaxPercent : null,
      dreEncargos: meta.dreEncargos || null,
      encargos: meta.encargos || null,
      itensInclusosExcluidos: (() => {
        const rawItens = meta.itensInclusosExcluidos || [];
        return rawItens.length > 0 ? rawItens : [
          { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
          { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
          { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
          { id: '4', descricao: 'Produtos químicos', incluso: false },
          { id: '5', descricao: 'Descartaveis', incluso: false }
        ];
      })()
    };

    // Calculate result dynamic to supply to DocumentoA4
    const totalTributos = (() => {
      if (Array.isArray(impostos)) return impostos.reduce((a: number, b: any) => a + (b.percent || 0), 0);
      if (impostos?.list) return impostos.list.reduce((a: number, b: any) => a + (b.percent || 0), 0);
      return Object.values(impostos || {}).filter((v: any) => !isNaN(Number(v))).reduce((a: number, b: any) => Number(a) + Number(b), 0);
    })();
    const cctDb = impostos?.sindicatoId ? await prisma.cCT.findUnique({ where: { id: impostos.sindicatoId }, include: { cargos: true } }) : null;
    const { calculateEnterprisePrice } = await import('@/lib/pricingEngine');
    
    const calcInput = {
      items: returnObj.equipe,
      impostos: { total: Number(totalTributos) },
      margens: { 
        adm: margens?.adm || 5, 
        lucro: margens?.lucro || 10,
        comissaoVendedor: margens?.comissaoVendedor || 0
      },
      reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
      manutencaoPct: margens?.manutencaoPct || 0,
      encargos: meta.encargos,
      cctGlobal: cctDb,
      insumosGlobais: {
        materiais: meta.insumos?.materiais || 0,
        maquinas: meta.insumos?.maquinas || 0,
        descartaveis: meta.insumos?.descartaveis || 0,
        servicos: meta.insumos?.servicos || 0
      }
    };
    
    const resultado = calculateEnterprisePrice(calcInput);

    if (returnObj.availableVersions && returnObj.availableVersions.length > 0) {
      returnObj.availableVersions[0].resultado = resultado;
    }

    return returnObj;

  } catch (error) {
    console.error('Error fetching full proposta:', error);
    return null;
  }
}

export async function getKPIs() {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return null;

    let whereClause: any = {};
    let usersWhereClause: any = {};

    whereClause.tenantId = loggedUser.tenantId;
    usersWhereClause.tenantId = loggedUser.tenantId;

    if (loggedUser.role === 'MANAGER') {
      const subordinateIds = await getSubordinateIds(loggedUser.id);
      whereClause.userId = { in: [loggedUser.id, ...subordinateIds] };
      usersWhereClause.id = { in: [loggedUser.id, ...subordinateIds] };
    } else if (loggedUser.role === 'USER') {
      whereClause.userId = loggedUser.id;
      usersWhereClause.id = loggedUser.id;
    }

    const propostas = await prisma.proposta.findMany({
      where: whereClause,
      include: {
        client: true,
        user: true,
        versoes: {
          select: {
            versao: true,
            precoVenda: true,
            metadados: true,
            dataCriacao: true
          }
        }
      }
    });

    const mappedPropostas = propostas.map(p => {
      const sortedVersoes = [...p.versoes].sort((a, b) => b.versao - a.versao);
      const lastVersao = sortedVersoes[0];
      const meta = (lastVersao?.metadados as any) || {};
      const statusUpper = p.status.toUpperCase();
      const isAceito = statusUpper.startsWith('ACEIT') || statusUpper.startsWith('APROV');

      return {
        id: p.id,
        numero: `FPV-${p.numero.toString().padStart(3, '0')}`,
        usuario: p.user.nome,
        dataCriacao: p.createdAt.toISOString(),
        valor: lastVersao?.precoVenda || 0,
        status: p.status,
        isAceito,
        tipoServicos: meta.tipoServicos || 'Outros',
        dataAceitacao: meta.dataAceitacao || (isAceito ? lastVersao?.dataCriacao.toISOString() : null)
      };
    });

    // Busca todos os usuários permitidos do sistema
    const users = await prisma.user.findMany({
      where: usersWhereClause,
      orderBy: { nome: 'asc' }
    });

    return {
      propostas: mappedPropostas,
      usuarios: users.map(u => ({ id: u.id, nome: u.nome, meta: u.meta }))
    };
  } catch (error) {
    console.error('Error fetching raw KPIs data:', error);
    return null;
  }
}

export async function getUsersList(preFetchedUser?: any) {
  try {
    const loggedUser = preFetchedUser || await getLoggedUser();
    if (!loggedUser) return [];

    const whereClause: any = {};
    whereClause.tenantId = loggedUser.tenantId;

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, role: true, avatarUrl: true, cargo: true }
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function transferirProposta(propostaId: string, newUserId: string) {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser || (loggedUser.role !== 'ADMIN' && loggedUser.role !== 'MANAGER')) {
      return { success: false, error: 'Apenas gestores e administradores podem transferir propostas.' };
    }

    const proposta = await prisma.proposta.findUnique({ where: { id: propostaId }, include: { user: true } });
    const newUser = await prisma.user.findUnique({ where: { id: newUserId } });

    if (!proposta || !newUser) return { success: false, error: 'Proposta ou usuário não encontrado.' };

    await prisma.proposta.update({
      where: { id: propostaId },
      data: { userId: newUserId }
    });

    await prisma.auditLog.create({
      data: {
        propostaId,
        userId: loggedUser.id,
        action: 'TRANSFER',
        details: { fromUserId: proposta.userId, fromUserName: proposta.user.nome, toUserId: newUserId, toUserName: newUser.nome }
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function compartilharProposta(propostaId: string, shareUserId: string, role: string = 'PARTICIPANTE') {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { success: false, error: 'Não autorizado.' };

    const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
    const shareUser = await prisma.user.findUnique({ where: { id: shareUserId } });

    if (!proposta || !shareUser) return { success: false, error: 'Proposta ou usuário não encontrado.' };

    // Verificar permissão (dono, admin ou manager)
    if (proposta.userId !== loggedUser.id && loggedUser.role === 'USER') {
      return { success: false, error: 'Você não tem permissão para compartilhar esta proposta.' };
    }

    // Criar ou atualizar o compartilhamento com a role
    await prisma.propostaShare.upsert({
      where: { propostaId_userId: { propostaId, userId: shareUserId } },
      create: { propostaId, userId: shareUserId, role },
      update: { role }
    });

    await prisma.auditLog.create({
      data: {
        propostaId,
        userId: loggedUser.id,
        action: 'SHARE',
        details: { sharedWithUserId: shareUserId, sharedWithUserName: shareUser.nome, role }
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removerCompartilhamentoProposta(propostaId: string, shareUserId: string) {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { success: false, error: 'Não autorizado.' };

    const proposta = await prisma.proposta.findUnique({ where: { id: propostaId } });
    if (!proposta) return { success: false, error: 'Proposta não encontrada.' };

    // Verificar permissão (dono, admin ou manager)
    if (proposta.userId !== loggedUser.id && loggedUser.role === 'USER') {
      return { success: false, error: 'Você não tem permissão para remover compartilhamentos desta proposta.' };
    }

    await prisma.propostaShare.delete({
      where: { propostaId_userId: { propostaId, userId: shareUserId } }
    });

    await prisma.auditLog.create({
      data: {
        propostaId,
        userId: loggedUser.id,
        action: 'UNSHARE',
        details: { removedUserId: shareUserId }
      }
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPropostaShares(propostaId: string) {
  try {
    const shares = await prisma.propostaShare.findMany({
      where: { propostaId },
      include: { user: { select: { id: true, nome: true, email: true, cargo: true, avatarUrl: true } } }
    });
    return shares;
  } catch (error) {
    return [];
  }
}

export async function getAuditLogs(propostaId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { propostaId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    return logs;
  } catch (error) {
    return [];
  }
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    if (user.password !== currentPassword) {
      return { success: false, error: 'A senha atual informada está incorreta.' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao trocar a senha:', error);
    return { success: false, error: error.message || 'Erro desconhecido.' };
  }
}

export async function changeMyAvatar(avatarUrl: string) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl }
    });
    return { success: true, avatarUrl: updated.avatarUrl };
  } catch (error: any) {
    console.error('Erro ao salvar avatar:', error);
    return { success: false, error: error.message || 'Erro desconhecido.' };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() }
    });
    if (!user) {
      return { success: false, error: 'Este e-mail corporativo não está cadastrado na plataforma.' };
    }
    const tempPass = 'SBH-' + Math.floor(1000 + Math.random() * 9000);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: tempPass }
    });
    return { success: true, tempPassword: tempPass };
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    return { success: false, error: error.message || 'Erro interno no servidor.' };
  }
}

export async function getPipelinePageData() {
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { proposals: [], statuses: [], role: 'USER', usersList: [] };

    const [proposals, statuses, usersList] = await Promise.all([
      getPropostas(loggedUser),
      getPropostaStatuses(),
      getUsersList(loggedUser)
    ]);
    return { proposals, statuses, role: loggedUser.role, usersList };
  } catch (error) {
    console.error('Error fetching pipeline page data:', error);
    return { proposals: [], statuses: [], role: 'USER', usersList: [] };
  }
}

export async function getProposalPageInitData(propostaId?: string, versionId?: string) {
  noStore();
  try {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return { success: false, error: 'Não autorizado.' };

    const tenantId = loggedUser.tenantId;
    const whereClause = { tenantId };

    const [
      ccts,
      escalas,
      produtos,
      tiposServico,
      segmentos,
      empresasEmissoras,
      equipesTecnicas,
      clientes,
      propostaCompleta
    ] = await Promise.all([
      prisma.cCT.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: { cargos: true }
      }),
      prisma.escala.findMany({
        where: whereClause,
        orderBy: { nome: 'asc' }
      }),
      prisma.produto.findMany({
        where: whereClause,
        orderBy: { descricao: 'asc' }
      }),
      prisma.tipoServico.findMany({
        orderBy: { nome: 'asc' }
      }),
      prisma.segmento.findMany({
        orderBy: { nome: 'asc' }
      }),
      prisma.empresaEmissora.findMany({
        orderBy: { nomeFantasia: 'asc' }
      }),
      prisma.equipeTecnicaComposicao.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.findMany({
        where: whereClause,
        orderBy: { nomeFantasia: 'asc' }
      }),
      propostaId ? getPropostaCompleta(propostaId, versionId) : Promise.resolve(null)
    ]);

    return JSON.parse(JSON.stringify({
      success: true,
      dataCcts: ccts,
      dataEscalas: escalas,
      dataProdutos: produtos,
      dataTipos: tiposServico,
      dataSegmentos: segmentos,
      loggedUser,
      dataEmpresas: empresasEmissoras,
      eqRes: { success: true, list: equipesTecnicas },
      clientesData: clientes,
      fullData: propostaCompleta
    }));
  } catch (error: any) {
    console.error('Erro ao buscar dados iniciais da proposta:', error);
    return { success: false, error: error.message || 'Erro ao carregar dados.' };
  }
}


