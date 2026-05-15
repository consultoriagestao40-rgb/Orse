'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCurrentUserRole() {
  try {
    const user = await prisma.user.findFirst();
    return user?.role || 'USER';
  } catch {
    return 'USER';
  }
}

export async function deleteProposta(id: string) {
  try {
    // Verifica se o usuário é admin antes de deletar
    const user = await prisma.user.findFirst();
    if (user?.role !== 'ADMIN') {
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
          { nome: 'APROVADA', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
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
  const user = await getDefaultUser();
  const { id, cliente, premissas, encargos, equipe, resultado } = data;

  try {
    let propostaId = id;

    if (!propostaId) {
      const dbClient = await prisma.client.findFirst({
        where: { nomeFantasia: cliente.cliente }
      });

      const newProposta = await prisma.proposta.create({
        data: {
          userId: user.id,
          clientId: dbClient?.id,
          status: 'ATIVO'
        }
      });
      propostaId = newProposta.id;
    }

    const lastVersion = await prisma.propostaVersao.findFirst({
      where: { propostaId },
      orderBy: { versao: 'desc' }
    });
    const nextVersion = lastVersion ? lastVersion.versao + 1 : 1;

    const newVersao = await prisma.propostaVersao.create({
      data: {
        propostaId,
        versao: nextVersion,
        impostos: { list: premissas.tributos, sindicatoId: cliente.sindicatoId } as any,
        margens: { 
          adm: premissas.taxaAdm, 
          lucro: premissas.margemLucro,
          reservaTecnicaPct: premissas.reservaTecnicaPct,
          manutencaoPct: premissas.manutencaoPct
        } as any,
        metadados: {
          clienteNome: cliente.cliente,
          contato: cliente.contato,
          celular: cliente.celular,
          email: cliente.email,
          objetoProposta: cliente.objetoProposta,
          cidade: cliente.cidade,
          dataElaboracao: cliente.dataElaboracao,
          numeroProposta: cliente.numeroProposta,
          revisao: cliente.revisao,
          tipoServicos: cliente.tipoServicos,
          insumos: {
            ...data.insumos,
            detalheMateriais: data.insumos.detalheMateriais || [],
            detalheMaquinas: data.insumos.detalheMaquinas || [],
            detalheDescartaveis: data.insumos.detalheDescartaveis || []
          }
        } as any,
        custoTotal: resultado.custoDiretoTotal || 0,
        precoVenda: resultado.faturamentoBruto || 0,
        items: {
          create: equipe.map((item: any) => {
            const itemRes = resultado.items.find((r: any) => r.id === item.id);
            return {
              nomeCargo: item.nomeCargo,
              quantidade: item.quantidade,
              escala: item.escala,
              entrada: item.parametrosPosto?.horarioInicio || '08:00',
              saida: item.parametrosPosto?.horarioFim || '17:00',
              configFinanceira: item.cargo as any,
              ativosConfig: item.ativosConfig as any,
              custoDireto: itemRes?.detalhes?.remuneracao || 0,
              custoTotalItem: itemRes?.custoTotal || 0
            };
          })
        }
      }
    });

    revalidatePath('/');
    // Busca o numero sequencial para retornar ao frontend
    const propostaCompleta = await prisma.proposta.findUnique({ where: { id: propostaId }, select: { numero: true } });
    const numeroProposta = propostaCompleta ? `FPV-${propostaCompleta.numero.toString().padStart(3, '0')}` : '';
    return { success: true, propostaId, versaoId: newVersao.id, versao: nextVersion, numeroProposta };
  } catch (error: any) {
    console.error('Error saving proposta:', error);
    return { success: false, error: error.message };
  }
}

export async function getPropostas() {
  try {
    const propostas = await prisma.proposta.findMany({
      include: {
        client: true,
        user: true,
        versoes: {
          orderBy: { versao: 'desc' },
          take: 1,
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return propostas.map(p => {
      const lastVersao = p.versoes[0];
      const meta = (lastVersao?.metadados as any) || {};
      // Prioriza nome fantasia do cadastro, depois metadados salvos
      const clienteNome = p.client?.nomeFantasia || meta.clienteNome || 'Cliente não identificado';

      return {
        id: p.id,
        numero: `FPV-${p.numero.toString().padStart(3, '0')}`,
        cliente: clienteNome,
        data: p.createdAt.toLocaleDateString('pt-BR'),
        valor: lastVersao?.precoVenda || 0,
        status: p.status,
        versao: lastVersao?.versao || 1,
        usuario: p.user.nome
      };
    });
  } catch (error) {
    console.error('Error fetching propostas:', error);
    return [];
  }
}

export async function updatePropostaStatus(id: string, status: string) {
  try {
    await prisma.proposta.update({ where: { id }, data: { status } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating status:', error);
    return { success: false, error: error.message };
  }
}

export async function getPropostaCompleta(id: string, versionId?: string) {
  try {
    const proposta = await prisma.proposta.findUnique({
      where: { id },
      include: {
        versoes: {
          orderBy: { versao: 'desc' },
          include: { items: true }
        }
      }
    });

    if (!proposta || !proposta.versoes.length) return null;

    const availableVersions = proposta.versoes.map(v => ({
      id: v.id,
      versao: v.versao,
      data: v.dataCriacao.toLocaleDateString('pt-BR'),
      valor: v.precoVenda
    }));

    const v = versionId
      ? proposta.versoes.find(ver => ver.id === versionId) || proposta.versoes[0]
      : proposta.versoes[0];

    const meta = (v.metadados as any) || {};
    const impostos = v.impostos as any;
    const margens = v.margens as any;

    return {
      id: proposta.id,
      numero: `FPV-${proposta.numero.toString().padStart(3, '0')}`,
      clientId: proposta.clientId,
      availableVersions,
      cliente: {
        id: proposta.clientId,
        // Retorna nome salvo nos metadados como fallback confiável
        clienteNome: meta.clienteNome || '',
        contato: meta.contato || '',
        celular: meta.celular || '',
        email: meta.email || '',
        objetoProposta: meta.objetoProposta || '',
        cidade: meta.cidade || '',
        dataElaboracao: meta.dataElaboracao || '',
        numeroProposta: meta.numeroProposta || '',
        revisao: meta.revisao || '',
        tipoServicos: meta.tipoServicos || ''
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
      equipe: v.items.map(i => ({
        id: i.id,
        nomeCargo: i.nomeCargo,
        quantidade: i.quantidade,
        escala: i.escala,
        cargo: i.configFinanceira,
        ativosConfig: i.ativosConfig,
        parametrosPosto: {
          horarioInicio: i.entrada,
          horarioFim: i.saida
        }
      })),
      versao: v.versao
    };
  } catch (error) {
    console.error('Error fetching full proposta:', error);
    return null;
  }
}
