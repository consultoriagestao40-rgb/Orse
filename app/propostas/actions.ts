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

import { cache } from 'react';

export async function getCurrentUserRole() {
  try {
    const user = await getLoggedUser();
    return user?.role || 'USER';
  } catch {
    return 'USER';
  }
}

export const getLoggedUser = cache(async () => {
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
});

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

    // Busca o número autoincrementado real da proposta do banco de dados para os metadados
    const dbProposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      select: { numero: true }
    });
    const dbPropostaNumero = dbProposta?.numero || 0;
    const formattedNumero = `FPV-${dbPropostaNumero.toString().padStart(3, '0')}`;

    let numeroProposta = cliente.numeroProposta;
    if (!numeroProposta || numeroProposta === 'Gerado ao salvar' || numeroProposta.includes('XXXX') || numeroProposta === '') {
      numeroProposta = formattedNumero;
    }

    // Preserva os insumos da versão anterior caso os insumos fornecidos não tenham sido enviados
    const lastVersionMeta = (lastVersion?.metadados as any) || {};
    const previousInsumos = lastVersionMeta.insumos || {};
    
    const inputInsumos = data.insumos;
    const finalInsumos = {
      materiais: (inputInsumos && inputInsumos.materiais !== undefined)
        ? Number(inputInsumos.materiais || 0)
        : Number(previousInsumos.materiais || 0),
      maquinas: (inputInsumos && inputInsumos.maquinas !== undefined)
        ? Number(inputInsumos.maquinas || 0)
        : Number(previousInsumos.maquinas || 0),
      descartaveis: (inputInsumos && inputInsumos.descartaveis !== undefined)
        ? Number(inputInsumos.descartaveis || 0)
        : Number(previousInsumos.descartaveis || 0),
      servicos: (() => {
        if (inputInsumos && Array.isArray(inputInsumos.outrosCustos) && inputInsumos.outrosCustos.length > 0) {
          return inputInsumos.outrosCustos.reduce((acc: number, it: any) => acc + (Number(it.valor) || 0), 0);
        }
        if (inputInsumos && inputInsumos.servicos !== undefined) {
          return Number(inputInsumos.servicos || 0);
        }
        return Number(previousInsumos.servicos || 0);
      })(),
      servicosDescricao: (inputInsumos && inputInsumos.servicosDescricao !== undefined)
        ? inputInsumos.servicosDescricao
        : (previousInsumos.servicosDescricao || ''),
      outrosCustos: (inputInsumos && Array.isArray(inputInsumos.outrosCustos))
        ? inputInsumos.outrosCustos
        : (previousInsumos.outrosCustos || []),
      detalheMateriais: (inputInsumos && Array.isArray(inputInsumos.detalheMateriais))
        ? inputInsumos.detalheMateriais
        : (previousInsumos.detalheMateriais || []),
      detalheMaquinas: (inputInsumos && Array.isArray(inputInsumos.detalheMaquinas))
        ? inputInsumos.detalheMaquinas
        : (previousInsumos.detalheMaquinas || []),
      detalheDescartaveis: (inputInsumos && Array.isArray(inputInsumos.detalheDescartaveis))
        ? inputInsumos.detalheDescartaveis
        : (previousInsumos.detalheDescartaveis || [])
    };

    // Garantir consistência estrita entre listas de detalhes e os valores agregados:
    if (Array.isArray(finalInsumos.detalheMateriais)) {
      if (finalInsumos.detalheMateriais.length === 0) {
        finalInsumos.materiais = 0;
      } else if (inputInsumos && Array.isArray(inputInsumos.detalheMateriais)) {
        finalInsumos.materiais = finalInsumos.detalheMateriais.reduce((acc: number, x: any) => acc + (Number(x.custoMensal) || 0), 0);
      }
    }

    if (Array.isArray(finalInsumos.detalheMaquinas)) {
      if (finalInsumos.detalheMaquinas.length === 0) {
        finalInsumos.maquinas = 0;
      } else if (inputInsumos && Array.isArray(inputInsumos.detalheMaquinas)) {
        finalInsumos.maquinas = finalInsumos.detalheMaquinas.reduce((acc: number, x: any) => acc + (Number(x.custoMensal) || 0), 0);
      }
    }

    if (Array.isArray(finalInsumos.detalheDescartaveis)) {
      if (finalInsumos.detalheDescartaveis.length === 0) {
        finalInsumos.descartaveis = 0;
      } else if (inputInsumos && Array.isArray(inputInsumos.detalheDescartaveis)) {
        finalInsumos.descartaveis = finalInsumos.detalheDescartaveis.reduce((acc: number, x: any) => acc + (Number(x.custoMensal) || 0), 0);
      }
    }

    // Garante sincronismo 100% exato entre o Preço de Venda da Mão de Obra + Insumos em Cascata e o total salvo no Banco
    const maoDeObraSubtotal = resultado?.items?.reduce((acc: number, i: any) => acc + (Number(i.precoVenda) || 0), 0) || 0;
    const txAdm = (Number(premissas.taxaAdm) || 5) / 100;
    const txLucro = (Number(premissas.margemLucro) || 10) / 100;
    const txComissao = (Number(premissas.comissaoVendedor) || 0) / 100;

    const tributosList = Array.isArray(premissas.tributos)
      ? premissas.tributos
      : (Array.isArray(premissas.impostos) ? premissas.impostos : []);
    const totalTributosPct = tributosList.reduce((acc: number, t: any) => acc + (Number(t.percent || t.percentual || t.aliquota) || 0), 0);

    const divisorTributos = (resultado?.divisor && Number(resultado.divisor) > 0)
      ? Number(resultado.divisor)
      : (1 - (totalTributosPct / 100) - txComissao);

    const outrosEncargosTotal = Array.isArray(encargos?.outrosEncargos)
      ? encargos.outrosEncargos.reduce((a: number, b: any) => a + (Number(b.valor) || 0), 0)
      : 0;
    const outrosBeneficiosTotal = Array.isArray(premissas?.outrosBeneficios)
      ? premissas.outrosBeneficios.reduce((a: number, b: any) => a + (Number(b.valor) || 0), 0)
      : 0;

    const extrasDirectCost = finalInsumos.materiais + finalInsumos.maquinas + finalInsumos.descartaveis + finalInsumos.servicos + outrosEncargosTotal + outrosBeneficiosTotal;
    let extrasSubtotal = 0;
    if (extrasDirectCost > 0) {
      const comAdm = extrasDirectCost * (1 + txAdm);
      const comLucro = comAdm * (1 + txLucro);
      extrasSubtotal = divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
    }

    const totalFaturamentoExato = maoDeObraSubtotal + extrasSubtotal;
    let finalCustoTotal = resultado?.custoDiretoTotal || 0;

    // Prioriza o faturamentoBruto vindo do calculo do motor/frontend, se valido (> 0)
    let finalPrecoVenda = (resultado?.faturamentoBruto && Number(resultado.faturamentoBruto) > 0)
      ? Number(resultado.faturamentoBruto)
      : ((totalFaturamentoExato > 0) ? totalFaturamentoExato : 0);

    const finalResultado = {
      ...(resultado || {}),
      custoDiretoTotal: finalCustoTotal,
      faturamentoBruto: finalPrecoVenda
    };

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
      numeroProposta: numeroProposta,
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
      condicaoCliente3: cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2027.',
      razaoSocial: cliente.razaoSocial || '',
      cnpj: cliente.cnpj || '',
      dataInicio: cliente.dataInicio || '',
      dataVencimento: cliente.dataVencimento || '',
      contatoCargo: cliente.contatoCargo || '',
      condicoesColaboradores: cliente.condicoesColaboradores || [],
      condicoesCliente: cliente.condicoesCliente || [],
      itensInclusosExcluidos: data.itensInclusosExcluidos || defaultItensInclusosExcluidos,
      insumos: finalInsumos,
      resultado: finalResultado,
      dreTaxPercent: dreTaxPercent !== undefined ? dreTaxPercent : null,
      dreEncargos: dreEncargos || null,
      encargos: encargos ? {
        ...encargos,
        outrosEncargos: Array.isArray(encargos.outrosEncargos) ? encargos.outrosEncargos : []
      } : null,
      premissas: {
        ...(premissas || {}),
        outrosBeneficios: Array.isArray(premissas?.outrosBeneficios) ? premissas.outrosBeneficios : []
      },
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
          parametrosPosto: item.parametrosPosto,
          identificacao: item.identificacao || ''
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
            comissaoVendedor: premissas.comissaoVendedor,
            outrosBeneficios: Array.isArray(premissas.outrosBeneficios) ? premissas.outrosBeneficios : []
          } as any,
          metadados: metadados as any,
          custoTotal: finalCustoTotal,
          precoVenda: finalPrecoVenda,
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
            comissaoVendedor: premissas.comissaoVendedor,
            outrosBeneficios: Array.isArray(premissas.outrosBeneficios) ? premissas.outrosBeneficios : []
          } as any,
          metadados: metadados as any,
          custoTotal: finalCustoTotal,
          precoVenda: finalPrecoVenda,
          items: {
            create: itemsData
          }
        }
      });
    }

    if (!criarNova) {
      // Mesma versão: atualiza apenas o DocumentoProposta desta revisão específica (preserva revisões anteriores)
      await prisma.documentoProposta.updateMany({
        where: { propostaId, versaoFPV: nextVersion },
        data: { valorTotal: finalPrecoVenda }
      }).catch(err => console.error('Erro ao sincronizar valor do documento proposta:', err));
    } else {
      // Nova versão da FPV criada (ex: R02, R03): preserva 100% o histórico das propostas comerciais anteriores
      // e, se a FPV já possuía Proposta Comercial na revisão anterior, gera automaticamente uma nova Proposta Comercial para esta nova revisão!
      try {
        const lastDoc = await prisma.documentoProposta.findFirst({
          where: { propostaId },
          orderBy: [{ versaoFPV: 'desc' }, { createdAt: 'desc' }],
          include: { secoes: { orderBy: { ordem: 'asc' } } }
        });

        const existingForNewVersion = await prisma.documentoProposta.findFirst({
          where: { propostaId, versaoFPV: nextVersion }
        });

        if (lastDoc && !existingForNewVersion) {
          const prevConfig = (lastDoc.configApresentacao as any) || null;
          let clonedConfig: any = null;
          if (prevConfig && typeof prevConfig === 'object') {
            const { viewTracking, negotiations, linkExpiresAt, ...restConfig } = prevConfig;
            clonedConfig = { ...restConfig };
          }

          await prisma.documentoProposta.create({
            data: {
              propostaId,
              versaoFPV: nextVersion,
              clientId: dbClient?.id || lastDoc.clientId,
              empresaEmissoraId: lastDoc.empresaEmissoraId,
              templateOrigemId: lastDoc.templateOrigemId,
              tipo: lastDoc.tipo || 'A4',
              status: 'Rascunho',
              valorTotal: finalPrecoVenda,
              tenantId: lastDoc.tenantId || user?.tenantId || null,
              configApresentacao: clonedConfig,
              secoes: {
                create: (lastDoc.secoes || []).map((s: any) => ({
                  titulo: s.titulo,
                  texto: s.texto,
                  ordem: s.ordem
                }))
              }
            }
          });
          revalidatePath('/propostas-comerciais');
        }
      } catch (err) {
        console.error('Erro ao gerar nova versão de DocumentoProposta:', err);
      }
    }

    // Se existir um contrato vinculado a esta FPV, atualiza automaticamente o valor mensal e total do contrato
    const existingContrato = await prisma.contrato.findUnique({ where: { propostaId }, include: { pic: true } });
    if (existingContrato) {
      await prisma.contrato.update({
        where: { id: existingContrato.id },
        data: {
          valorMensal: finalPrecoVenda,
          valorTotal: finalPrecoVenda * (existingContrato.vigenciaMeses || 12)
        }
      }).catch(err => console.error('Erro ao sincronizar valor do contrato:', err));

      // Sincroniza também o PIC vinculado ao contrato
      if (existingContrato.pic) {
        await prisma.pic.update({
          where: { id: existingContrato.pic.id },
          data: { valorMensal: finalPrecoVenda }
        }).catch(err => console.error('Erro ao sincronizar valor do PIC:', err));
      }

      revalidatePath('/contratos');
      revalidatePath('/pic');
    }

    // Sincronização automática com Lead do CRM (se houver leadId ou se a proposta já estiver vinculada)
    const effectiveLeadId = data.leadId || cliente.leadId || undefined;
    const currentProp = await prisma.proposta.findUnique({
      where: { id: propostaId },
      select: { leadId: true, numero: true }
    });
    const targetLeadId = effectiveLeadId || currentProp?.leadId;

    if (effectiveLeadId && effectiveLeadId !== currentProp?.leadId) {
      await prisma.proposta.update({
        where: { id: propostaId },
        data: { leadId: effectiveLeadId }
      }).catch(() => {});
    }

    if (targetLeadId) {
      // Atualiza o valor estimado do Lead no CRM diretamente com o valor final da FPV, sem digitação manual!
      await prisma.lead.update({
        where: { id: targetLeadId },
        data: { valorEst: finalPrecoVenda }
      }).catch(err => console.error('Erro ao sincronizar valor no Lead:', err));

      await prisma.leadHistory.create({
        data: {
          leadId: targetLeadId,
          tipo: 'PROPOSTA_SYNC',
          descricao: `Proposta FPV-${formattedNumero} recalculada/salva no valor de R$ ${finalPrecoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês. Sincronizado automaticamente no Lead.`
        }
      }).catch(() => {});

      revalidatePath('/leads');
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
    const finalNumeroProposta = propostaCompleta ? `FPV-${propostaCompleta.numero.toString().padStart(3, '0')}` : '';
    return { success: true, propostaId, versaoId: newVersao.id, versao: nextVersion, numeroProposta: finalNumeroProposta };
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
          },
          orderBy: { versao: 'desc' },
          take: 1
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
        valor: meta.resultado?.faturamentoBruto || lastVersao?.precoVenda || 0,
        status: p.status,
        versao: lastVersao?.versao || 1,
        usuario: p.user?.nome || 'Usuário',
        userId: p.user?.id || p.userId || '',
        avatarUrl: p.user?.avatarUrl || null,
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
    const updatedProposta = await prisma.proposta.update({
      where: { id },
      data: { status },
      include: {
        lead: {
          include: {
            pipeline: {
              include: {
                stages: { orderBy: { ordem: 'asc' } }
              }
            }
          }
        }
      }
    });

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

    const isAceito = status.toUpperCase().startsWith('ACEIT') || status.toUpperCase().startsWith('APROV');

    if (lastVersion) {
      const meta = (lastVersion.metadados as any) || {};
      meta.statusHistory = meta.statusHistory || [];
      meta.statusHistory.push({
        status,
        date: new Date().toISOString()
      });
      if (isAceito) {
        meta.dataAceitacao = new Date().toISOString();
      }
      await prisma.propostaVersao.update({
        where: { id: lastVersion.id },
        data: { metadados: meta }
      });
    }

    // Sincroniza com o CRM (Lead) se a proposta estiver vinculada
    if (updatedProposta.leadId && updatedProposta.lead) {
      if (isAceito && updatedProposta.lead.pipeline?.stages) {
        // Encontra o estágio de fechamento/ganho no pipeline do lead
        const wonStage = updatedProposta.lead.pipeline.stages.find((st: any) => {
          const s = st.nome.toLowerCase();
          return s.includes('ganh') || s.includes('aprov') || s.includes('fechad') || s.includes('contrat');
        });
        if (wonStage && wonStage.id !== updatedProposta.lead.stageId) {
          await prisma.lead.update({
            where: { id: updatedProposta.leadId },
            data: { stageId: wonStage.id }
          });
        }
      }

      await prisma.leadHistory.create({
        data: {
          leadId: updatedProposta.leadId,
          tipo: 'STATUS_CHANGE',
          descricao: `Proposta FPV-${updatedProposta.numero.toString().padStart(3, '0')} teve o status atualizado para: "${status}". Sincronizado automaticamente no Radar Comercial.`
        }
      }).catch(() => {});

      revalidatePath('/leads');
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
        condicaoCliente3: meta.condicaoCliente3 || 'Próximo reajuste Fevereiro/2027.',
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
        outrosCustos: Array.isArray(meta.insumos?.outrosCustos) 
          ? meta.insumos.outrosCustos 
          : (meta.insumos?.servicos ? [{ id: '1', descricao: meta.insumos?.servicosDescricao || 'Serviços Terceirizados', valor: meta.insumos?.servicos }] : []),
        detalheMateriais: meta.insumos?.detalheMateriais || [],
        detalheMaquinas: meta.insumos?.detalheMaquinas || [],
        detalheDescartaveis: meta.insumos?.detalheDescartaveis || []
      },
      premissas: {
        taxaAdm: margens?.adm ?? 5,
        margemLucro: margens?.lucro ?? 10,
        comissaoVendedor: margens?.comissaoVendedor || 0,
        reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
        manutencaoPct: margens?.manutencaoPct || 0,
        outrosBeneficios: Array.isArray(meta.premissas?.outrosBeneficios)
          ? meta.premissas.outrosBeneficios
          : (Array.isArray(margens?.outrosBeneficios) ? margens.outrosBeneficios : []),
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
          identificacao: itemAtivosConfig.identificacao || '',
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
      encargos: meta.encargos ? {
        ...meta.encargos,
        outrosEncargos: Array.isArray(meta.encargos.outrosEncargos) ? meta.encargos.outrosEncargos : []
      } : null,
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

    // Utiliza o resultado oficial gravado pela FPV no metadados ou recalcula dinamicamente se inexistente
    let resultado = meta.resultado || null;
    if (!resultado) {
      const totalTributos = (() => {
        if (Array.isArray(impostos)) return impostos.reduce((a: number, b: any) => a + (b.percent || 0), 0);
        if (impostos?.list) return impostos.list.reduce((a: number, b: any) => a + (b.percent || 0), 0);
        return Object.values(impostos || {}).filter((v: any) => !isNaN(Number(v))).reduce((a: number, b: any) => Number(a) + Number(b), 0);
      })();
      const cctDb = impostos?.sindicatoId ? await prisma.cCT.findUnique({ where: { id: impostos.sindicatoId }, include: { cargos: true } }) : null;
      const { calculateEnterprisePrice } = await import('@/lib/pricingEngine');
      
      const calcInput = {
        items: returnObj.equipe,
        impostos: { list: Array.isArray(impostos) ? impostos : (impostos?.list || []), total: Number(totalTributos) },
        margens: { 
          adm: margens?.adm ?? 5, 
          lucro: margens?.lucro ?? 10,
          comissaoVendedor: margens?.comissaoVendedor || 0,
          reservaTecnicaPct: margens?.reservaTecnicaPct || 0,
          manutencaoPct: margens?.manutencaoPct || 0,
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
      
      resultado = calculateEnterprisePrice(calcInput);
      const precoVendaSalvo = Number(v.precoVenda || 0);
      if (precoVendaSalvo > 0) {
        resultado.faturamentoBruto = precoVendaSalvo;
      }
    }

    returnObj.resultado = resultado;
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
    if (!loggedUser) return { propostas: [], usuarios: [] };

    let whereClause: any = {};
    let usersWhereClause: any = {};

    if (loggedUser.tenantId) {
      whereClause.tenantId = loggedUser.tenantId;
      usersWhereClause.tenantId = loggedUser.tenantId;
    }

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
      const sortedVersoes = [...(p.versoes || [])].sort((a, b) => (b.versao || 0) - (a.versao || 0));
      const lastVersao = sortedVersoes[0];
      const meta = (lastVersao?.metadados as any) || {};
      const statusUpper = (p.status || '').toUpperCase();
      const isAceito = statusUpper.startsWith('ACEIT') || statusUpper.startsWith('APROV');
      const createdAtIso = p.createdAt ? p.createdAt.toISOString() : new Date().toISOString();

      return {
        id: p.id,
        numero: `FPV-${(p.numero || 0).toString().padStart(3, '0')}`,
        usuario: p.user?.nome || 'Usuário',
        dataCriacao: createdAtIso,
        valor: lastVersao?.precoVenda || 0,
        status: p.status || 'RASCUNHO',
        isAceito,
        tipoServicos: meta.tipoServicos || 'Outros',
        tipoProposta: String(meta.tipoProposta || 'RECORRENTE').toUpperCase(),
        dataAceitacao: meta.dataAceitacao || (isAceito && lastVersao?.dataCriacao ? lastVersao.dataCriacao.toISOString() : null)
      };
    });

    // Busca leads e atividades para compor o funil de quantidades
    let leadsWhere: any = {};
    if (loggedUser.tenantId) {
      leadsWhere.tenantId = loggedUser.tenantId;
    }
    if (loggedUser.role === 'USER') {
      leadsWhere.assignedToId = loggedUser.id;
    } else if (loggedUser.role === 'MANAGER') {
      const subordinateIds = await getSubordinateIds(loggedUser.id);
      leadsWhere.assignedToId = { in: [loggedUser.id, ...subordinateIds] };
    }

    const rawLeads = await prisma.lead.findMany({
      where: leadsWhere,
      select: {
        id: true,
        nomeFantasia: true,
        createdAt: true,
        stageId: true,
        assignedToId: true,
        assignedTo: { select: { id: true, nome: true } },
        stage: { select: { id: true, nome: true, ordem: true } },
        contacts: { select: { id: true } },
        activities: { select: { id: true, tipo: true, createdAt: true } },
        history: { select: { id: true, tipo: true, createdAt: true } }
      }
    });

    const mappedLeads = rawLeads.map(l => {
      const stageName = l.stage?.nome || 'PROSPECT';
      const stageOrdem = l.stage?.ordem ?? 0;
      const stageLower = stageName.toLowerCase();
      
      const hasContact = (l.contacts?.length > 0) ||
        (l.history?.some(h => ['LIGACAO', 'EMAIL', 'PROSPECCAO', 'CONTATO'].includes(h.tipo))) ||
        stageLower.includes('contato') ||
        (stageOrdem >= 1 && !stageLower.includes('desqual') && !stageLower.includes('arquiv'));
        
      const hasVisita = (l.activities?.some(a => a.tipo === 'REUNIAO')) ||
        (l.history?.some(h => h.tipo === 'REUNIAO')) ||
        stageLower.includes('reuni') ||
        stageLower.includes('visita') ||
        (stageOrdem >= 2 && !stageLower.includes('desqual') && !stageLower.includes('arquiv'));

      return {
        id: l.id,
        nome: l.nomeFantasia,
        usuario: l.assignedTo?.nome || 'Não atribuído',
        createdAt: l.createdAt.toISOString(),
        stageName,
        stageOrdem,
        hasContact,
        hasVisita
      };
    });

    // Busca todos os usuários permitidos do sistema
    const users = await prisma.user.findMany({
      where: usersWhereClause,
      orderBy: { nome: 'asc' }
    });

    return {
      propostas: mappedPropostas,
      usuarios: users.map(u => ({ id: u.id, nome: u.nome || 'Usuário', meta: u.meta || 0 })),
      leads: mappedLeads
    };
  } catch (error) {
    console.error('Error fetching raw KPIs data:', error);
    return { propostas: [], usuarios: [], leads: [] };
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

export async function changeMyPassword(currentPassword: string, newPassword: string, confirmPassword?: string) {
  try {
    const user = await getLoggedUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    // Validação estrita da confirmação de senha
    if (!confirmPassword || newPassword !== confirmPassword) {
      return { success: false, error: 'A confirmação de senha não coincide com a nova senha digitada.' };
    }

    const { verifyPassword, validatePasswordStrength, hashPassword } = await import('@/lib/security');

    // Valida senha atual
    const { isValid } = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: 'A senha atual informada está incorreta.' };
    }

    // Não permite reutilizar a mesma senha
    if (currentPassword === newPassword) {
      return { success: false, error: 'A nova senha deve ser diferente da senha atual.' };
    }

    // Valida complexidade da nova senha segundo a política corporativa
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { success: false, error: strength.errors[0] || 'A nova senha não atende aos requisitos de segurança.' };
    }

    // Hash Bcrypt da nova senha
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Atualiza cookie sb_user para remover flag de troca de senha
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const sbUser = cookieStore.get('sb_user')?.value;
      if (sbUser) {
        let parsed: any = null;
        try {
          parsed = JSON.parse(decodeURIComponent(sbUser));
        } catch {
          parsed = JSON.parse(sbUser);
        }
        if (parsed) {
          parsed.mustChangePassword = false;
          cookieStore.set('sb_user', JSON.stringify(parsed), {
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
            sameSite: 'lax',
          });
        }
      }
      cookieStore.delete('sb_must_change_password');
    } catch (e) {}

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
    const emailNorm = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: emailNorm }
    });

    // Resposta anti-enumeração de usuários:
    // Retorna mensagem idêntica para o cliente mesmo se o e-mail não existir,
    // garantindo que invasores não consigam testar e descobrir quais e-mails existem no sistema.
    if (!user) {
      return { 
        success: true, 
        message: 'Se o e-mail informado estiver cadastrado em nossa base corporativa, um código de segurança de 6 dígitos foi enviado. Por favor, verifique sua caixa de entrada e spam.' 
      };
    }

    const { generateOtpCode } = await import('@/lib/security');
    const { sendMail } = await import('@/lib/mail');

    const resetCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordResetToken: resetCode,
        passwordResetExpiresAt: expiresAt
      }
    });

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #1B4D3E; padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
            SmartBid • Segurança Corporativa
          </h1>
          <p style="color: #6ee7b7; font-size: 12px; margin: 6px 0 0 0; font-weight: 500;">
            Recuperação de Senha & Gestão de Acesso
          </p>
        </div>
        <div style="padding: 36px 32px;">
          <p style="color: #1e293b; font-size: 15px; margin: 0 0 16px 0; font-weight: 600;">
            Olá, ${user.nome}!
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Recebemos uma solicitação para redefinir a sua senha de acesso corporativo na plataforma SmartBid. Utilize o código de segurança de 6 dígitos abaixo para cadastrar sua nova senha:
          </p>

          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #1B4D3E;">
              ${resetCode}
            </span>
          </div>

          <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 14px 18px; margin: 0 0 24px 0;">
            <p style="color: #854d0e; font-size: 12px; margin: 0; line-height: 1.5; font-weight: 500;">
              ⏱️ <strong>Validade:</strong> Este código expira em <strong>15 minutos</strong>.
            </p>
          </div>

          <p style="color: #94a3b8; font-size: 11.5px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Se você não solicitou a recuperação de senha, desconsidere esta mensagem imediatamente. Nenhuma alteração foi realizada na sua conta.
          </p>
        </div>
      </div>
    `;

    const mailRes = await sendMail({
      to: user.email,
      fromName: 'SmartBid • Segurança Corporativa',
      subject: `🔐 Seu Código de Recuperação de Senha: ${resetCode} — SmartBid`,
      html: emailHtml,
      text: `Seu código de recuperação de senha SmartBid é: ${resetCode}. Válido por 15 minutos.`
    });

    return { 
      success: true, 
      email: user.email, 
      simulated: mailRes?.simulated || false,
      message: 'Se o e-mail informado estiver cadastrado em nossa base corporativa, um código de segurança de 6 dígitos foi enviado. Por favor, verifique sua caixa de entrada e spam.' 
    };
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    return { success: false, error: error.message || 'Erro interno no servidor ao enviar e-mail.' };
  }
}

export async function confirmPasswordResetWithCode(
  email: string, 
  code: string, 
  newPassword: string,
  confirmPassword?: string
) {
  try {
    const emailNorm = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Validação estrita da confirmação de senha
    if (!confirmPassword || newPassword !== confirmPassword) {
      return { success: false, error: 'A confirmação de senha não coincide com a nova senha digitada.' };
    }

    const user = await prisma.user.findFirst({
      where: { email: emailNorm }
    });

    if (!user) {
      return { success: false, error: 'Código ou dados de verificação inválidos.' };
    }

    if (!user.passwordResetToken || user.passwordResetToken !== cleanCode) {
      return { success: false, error: 'Código de segurança incorreto. Verifique o código de 6 dígitos recebido no seu e-mail.' };
    }

    if (user.passwordResetExpiresAt && new Date() > user.passwordResetExpiresAt) {
      return { success: false, error: 'Este código de verificação expirou. Por favor, solicite um novo código.' };
    }

    const { validatePasswordStrength, hashPassword } = await import('@/lib/security');

    // Validação da Política Forte de Segurança
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { success: false, error: strength.errors[0] || 'A nova senha não atende aos requisitos de segurança corporativa.' };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    return { 
      success: true, 
      message: 'Sua senha foi redefinida com sucesso! Você já pode fazer login na plataforma.' 
    };
  } catch (error: any) {
    console.error('Erro ao confirmar nova senha:', error);
    return { success: false, error: error.message || 'Erro interno ao redefinir a senha.' };
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
        where: whereClause,
        orderBy: { nome: 'asc' }
      }),
      prisma.segmento.findMany({
        where: whereClause,
        orderBy: { nome: 'asc' }
      }),
      prisma.empresaEmissora.findMany({
        where: whereClause,
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

export async function logPropostaAction(propostaId: string, action: string, details?: any) {
  try {
    if (!propostaId) return { success: false, error: 'PropostaId inválido' };

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      select: { id: true, userId: true }
    });
    if (!proposta) return { success: false, error: 'Proposta não encontrada' };

    const loggedUser = await getLoggedUser();
    const effectiveUserId = loggedUser?.id || proposta.userId;

    // Para evitar flooding de acessos sucessivos no mesmo minuto
    if (action === 'ACCESS') {
      const tresMinutosAtras = new Date(Date.now() - 3 * 60 * 1000);
      const recentAccess = await prisma.auditLog.findFirst({
        where: {
          propostaId,
          userId: effectiveUserId,
          action: 'ACCESS',
          createdAt: { gte: tresMinutosAtras }
        }
      });
      if (recentAccess) {
        return { success: true, debounced: true };
      }
    }

    const log = await prisma.auditLog.create({
      data: {
        propostaId,
        userId: effectiveUserId,
        action,
        details: details || {}
      },
      include: {
        user: {
          select: { id: true, nome: true, email: true, cargo: true, avatarUrl: true }
        }
      }
    });

    return { success: true, log };
  } catch (error: any) {
    console.error('Erro ao registrar log de auditoria da proposta:', error);
    return { success: false, error: error.message };
  }
}

export async function getHistoricoProposta(propostaId: string) {
  try {
    if (!propostaId) return { success: false, error: 'PropostaId inválido' };

    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      include: {
        user: { select: { id: true, nome: true, email: true, cargo: true, avatarUrl: true } },
        client: { select: { id: true, nomeFantasia: true, razaoSocial: true, cnpj: true } },
        versoes: {
          orderBy: { versao: 'desc' },
          select: {
            id: true,
            versao: true,
            precoVenda: true,
            custoTotal: true,
            dataCriacao: true,
            margens: true,
            metadados: true
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          include: {
            user: { select: { id: true, nome: true, email: true, cargo: true, avatarUrl: true } }
          }
        }
      }
    });

    if (!proposta) return { success: false, error: 'Proposta não encontrada' };

    const logs = proposta.auditLogs || [];
    const totalAcessos = logs.filter(l => l.action === 'ACCESS').length;
    const totalImpressoes = logs.filter(l => l.action === 'PRINT').length;
    const totalExportacoes = logs.filter(l => l.action === 'EXPORT_CSV' || l.action === 'EXPORT_PDF').length;
    const totalAlteracoes = logs.filter(l => ['CREATE', 'VERSION_SAVE', 'VERSION_UPDATE', 'STATUS_CHANGE', 'TRANSFER', 'SHARE'].includes(l.action)).length;

    // Mapa consolidado de usuários que acessaram
    const mapUsuarios: Record<string, { user: any; totalAcessos: number; ultimoAcesso: Date }> = {};
    logs.forEach(l => {
      const u = l.user;
      if (u) {
        if (!mapUsuarios[u.id]) {
          mapUsuarios[u.id] = { user: u, totalAcessos: 0, ultimoAcesso: l.createdAt };
        }
        if (l.action === 'ACCESS') {
          mapUsuarios[u.id].totalAcessos += 1;
        }
        if (new Date(l.createdAt) > new Date(mapUsuarios[u.id].ultimoAcesso)) {
          mapUsuarios[u.id].ultimoAcesso = l.createdAt;
        }
      }
    });

    const usuariosAcesso = Object.values(mapUsuarios).sort((a, b) => b.totalAcessos - a.totalAcessos);

    return JSON.parse(JSON.stringify({
      success: true,
      resumo: {
        totalVersoes: proposta.versoes.length,
        versaoAtual: proposta.versoes[0]?.versao || 1,
        totalAcessos,
        totalImpressoes,
        totalExportacoes,
        totalAlteracoes,
        dataCriacao: proposta.createdAt,
        ultimaModificacao: proposta.versoes[0]?.dataCriacao || proposta.createdAt,
        autorOriginal: proposta.user,
        statusAtual: proposta.status,
        numero: proposta.numero
      },
      versoes: proposta.versoes,
      usuariosAcesso,
      logs
    }));
  } catch (error: any) {
    console.error('Erro ao buscar histórico da proposta:', error);
    return { success: false, error: error.message };
  }
}



