'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
const defaultItensInclusosExcluidos = [
  { id: '1', descricao: 'Fornecimento de mão de obra', incluso: true },
  { id: '2', descricao: 'Fornecimento de insumos necessario para a prestação dos serviços', incluso: true },
  { id: '3', descricao: 'Maquinas e equipamentos', incluso: false },
  { id: '4', descricao: 'Produtos químicos', incluso: false },
  { id: '5', descricao: 'Descartaveis', incluso: false }
];


export async function getCurrentUserRole() {
  try {
    const user = await prisma.user.findFirst();
    return user?.role || 'USER';
  } catch {
    return 'USER';
  }
}

export async function getLoggedUser() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sbUser = cookieStore.get('sb_user')?.value;
    if (sbUser) {
      const data = JSON.parse(sbUser);
      const user = await prisma.user.findFirst({
        where: { nome: data.nome }
      });
      return user;
    }
  } catch (error) {
    console.error('Erro ao obter usuario logado:', error);
  }
  return null;
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
  const { id, cliente, premissas, encargos, equipe, resultado, dreTaxPercent, dreEncargos, changelog } = data;

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
          hasEscopoTecnico: cliente.hasEscopoTecnico || false,
          escopoTecnico: cliente.escopoTecnico || '',
          cidade: cliente.cidade,
          dataElaboracao: cliente.dataElaboracao,
          numeroProposta: cliente.numeroProposta,
          revisao: cliente.revisao,
          tipoServicos: cliente.tipoServicos,
          vendedorNome: cliente.vendedorNome || 'Ádamo Quadros',
          vendedorCargo: cliente.vendedorCargo || 'Novos Negócios',
          vendedorTelefone: cliente.vendedorTelefone || '(41) 9 9737-0880',
          vendedorEmail: cliente.vendedorEmail || 'adamo@grupojvsserv.com.br',
          quadroEfetivoSubtitulo: cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções',
          quadroEfetivoClausula1: cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
          quadroEfetivoClausula2: cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
          quadroEfetivoClausula3: cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).',
          condicaoColaboradores1: cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
          condicaoColaboradores2: cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
          condicaoColaboradores3: cliente.condicaoColaboradores3 || '2 Vales transporte por dia.',
          condicaoCliente1: cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
          condicaoCliente2: cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
          condicaoCliente3: cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.',
          itensInclusosExcluidos: data.itensInclusosExcluidos || defaultItensInclusosExcluidos,
          insumos: {
            ...data.insumos,
            detalheMateriais: data.insumos.detalheMateriais || [],
            detalheMaquinas: data.insumos.detalheMaquinas || [],
            detalheDescartaveis: data.insumos.detalheDescartaveis || []
          },
          dreTaxPercent: dreTaxPercent !== undefined ? dreTaxPercent : null,
          dreEncargos: dreEncargos || null,
          changelog: changelog || 'Criação inicial da proposta'
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
              ativosConfig: { 
                ...(item.ativosConfig || {}), 
                parametrosPosto: item.parametrosPosto 
              } as any,
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
        hasEscopoTecnico: meta.hasEscopoTecnico || false,
        escopoTecnico: meta.escopoTecnico || '',
        cidade: meta.cidade || '',
        dataElaboracao: meta.dataElaboracao || '',
        numeroProposta: meta.numeroProposta || '',
        revisao: meta.revisao || '',
        tipoServicos: meta.tipoServicos || '',
        vendedorNome: meta.vendedorNome || 'Ádamo Quadros',
        vendedorCargo: meta.vendedorCargo || 'Novos Negócios',
        vendedorTelefone: meta.vendedorTelefone || '(41) 9 9737-0880',
        vendedorEmail: meta.vendedorEmail || 'adamo@grupojvsserv.com.br',
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
      itensInclusosExcluidos: (() => {
        const rawItens = meta.itensInclusosExcluidos || [];
        const hasMaoDeObra = rawItens.some((item: any) => 
          item.descricao && item.descricao.toLowerCase().includes('mão de obra')
        );
        return hasMaoDeObra ? rawItens : defaultItensInclusosExcluidos;
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
      equipe: v.items.map(i => {
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
          }
        };
      }),
      versao: v.versao,
      dreTaxPercent: meta.dreTaxPercent !== undefined ? meta.dreTaxPercent : null,
      dreEncargos: meta.dreEncargos || null
    };
  } catch (error) {
    console.error('Error fetching full proposta:', error);
    return null;
  }
}

export async function getKPIs() {
  try {
    const propostas = await prisma.proposta.findMany({
      include: {
        client: true,
        user: true,
        versoes: {
          orderBy: { versao: 'desc' },
          include: { items: true }
        }
      }
    });

    const mappedPropostas = propostas.map(p => {
      const lastVersao = p.versoes[0];
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

    // Busca todos os usuários do sistema
    const users = await prisma.user.findMany({
      orderBy: { nome: 'asc' }
    });

    return {
      propostas: mappedPropostas,
      usuarios: users.map(u => u.nome)
    };
  } catch (error) {
    console.error('Error fetching raw KPIs data:', error);
    return null;
  }
}

