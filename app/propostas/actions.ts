'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to get a default user if none is logged in (simplified for this stage)
async function getDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@smartbid.com',
        nome: 'Administrador Principal',
        role: 'ADMIN'
      }
    });
  }
  return user;
}

export async function saveProposta(data: any) {
  const user = await getDefaultUser();
  const { id, cliente, premissas, encargos, equipe, resultado } = data;

  try {
    let propostaId = id;

    // 1. Create Proposta record if it doesn't exist
    if (!propostaId) {
      // Find client record by name (simplified)
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

    // 2. Determine Version Number
    const lastVersion = await prisma.propostaVersao.findFirst({
      where: { propostaId },
      orderBy: { versao: 'desc' }
    });
    const nextVersion = lastVersion ? lastVersion.versao + 1 : 1;

    // 3. Create PropostaVersao
    const newVersao = await prisma.propostaVersao.create({
      data: {
        propostaId,
        versao: nextVersion,
        impostos: { list: premissas.tributos, sindicatoId: cliente.sindicatoId } as any,
        margens: { adm: premissas.taxaAdm, lucro: premissas.margemLucro } as any,
        metadados: { 
          contato: cliente.contato,
          celular: cliente.celular,
          email: cliente.email,
          objetoProposta: cliente.objetoProposta,
          cidade: cliente.cidade,
          dataElaboracao: cliente.dataElaboracao,
          numeroProposta: cliente.numeroProposta,
          revisao: cliente.revisao,
          tipoServicos: cliente.tipoServicos
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
    return { success: true, propostaId, versaoId: newVersao.id, versao: nextVersion };
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
          include: {
             items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return propostas.map(p => ({
      id: p.id,
      numero: `FPV-${p.numero.toString().padStart(3, '0')}`,
      cliente: p.client?.nomeFantasia || 'Cliente não identificado',
      data: p.createdAt.toLocaleDateString('pt-BR'),
      valor: p.versoes[0]?.precoVenda || 0,
      status: p.status,
      versao: p.versoes[0]?.versao || 1,
      usuario: p.user.nome
    }));
  } catch (error) {
    console.error('Error fetching propostas:', error);
    return [];
  }
}

export async function updatePropostaStatus(id: string, status: string) {
  try {
    await prisma.proposta.update({
      where: { id },
      data: { status }
    });
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

    return {
      id: proposta.id,
      availableVersions,
      cliente: {
        id: proposta.clientId,
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
      premissas: {
        taxaAdm: (v.margens as any).adm,
        margemLucro: (v.margens as any).lucro,
        tributos: (() => {
          const imp = v.impostos as any;
          if (Array.isArray(imp)) return imp;
          if (imp && typeof imp === 'object') {
            if (imp.list && Array.isArray(imp.list)) return imp.list;
            // Fallback for corrupted { "0": {...}, "1": {...}, "sindicatoId": "..." }
            return Object.keys(imp)
              .filter(k => !isNaN(Number(k)))
              .map(k => imp[k]);
          }
          return [];
        })(),
        meta: { sindicatoId: (v.impostos as any)?.sindicatoId || '' }
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
