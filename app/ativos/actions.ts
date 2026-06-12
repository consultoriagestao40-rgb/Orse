'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/app/propostas/actions';

// Helper to check user auth and get tenantId
async function checkAuth() {
  const user = await getLoggedUser();
  if (!user || !user.tenantId) {
    throw new Error('Unauthorized');
  }
  return user;
}

// -----------------------------------------------------------------------------
// CATEGORIAS DE ATIVOS
// -----------------------------------------------------------------------------

export async function getCategoriasAtivo() {
  try {
    const user = await checkAuth();
    const categorias = await prisma.categoriaAtivo.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { nome: 'asc' }
    });
    return { success: true, categorias };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategoriaAtivo(nome: string) {
  try {
    const user = await checkAuth();
    
    // Check if category already exists in tenant
    const exists = await prisma.categoriaAtivo.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' }, tenantId: user.tenantId }
    });
    if (exists) {
      return { success: false, error: 'Já existe uma categoria com este nome.' };
    }

    const categoria = await prisma.categoriaAtivo.create({
      data: {
        nome,
        tenantId: user.tenantId
      }
    });
    revalidatePath('/ativos');
    return { success: true, categoria };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategoriaAtivo(id: string, nome: string) {
  try {
    const user = await checkAuth();

    const exists = await prisma.categoriaAtivo.findFirst({
      where: { 
        id: { not: id },
        nome: { equals: nome, mode: 'insensitive' }, 
        tenantId: user.tenantId 
      }
    });
    if (exists) {
      return { success: false, error: 'Já existe uma outra categoria com este nome.' };
    }

    const categoria = await prisma.categoriaAtivo.update({
      where: { id, tenantId: user.tenantId },
      data: { nome }
    });
    revalidatePath('/ativos');
    return { success: true, categoria };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategoriaAtivo(id: string) {
  try {
    const user = await checkAuth();

    // Check if category is used by any active assets
    const activeAtivos = await prisma.ativo.count({
      where: { categoriaId: id, tenantId: user.tenantId }
    });
    if (activeAtivos > 0) {
      return { success: false, error: 'Não é possível excluir esta categoria porque ela possui ativos vinculados.' };
    }

    await prisma.categoriaAtivo.delete({
      where: { id, tenantId: user.tenantId }
    });
    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// ATIVOS (EQUIPAMENTOS)
// -----------------------------------------------------------------------------

export async function getAtivos() {
  try {
    const user = await checkAuth();
    const ativos = await prisma.ativo.findMany({
      where: { tenantId: user.tenantId },
      include: { categoria: true },
      orderBy: { codigo: 'asc' }
    });
    return { success: true, ativos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAtivo(data: {
  descricao: string;
  valor: number;
  categoriaId: string;
  status?: string;
  observacao?: string;
}) {
  try {
    const user = await checkAuth();

    // Generate unique sequential asset code (ATV-0001, ATV-0002) for the tenant
    const lastAtivo = await prisma.ativo.findFirst({
      where: { tenantId: user.tenantId, codigo: { startsWith: 'ATV-' } },
      orderBy: { codigo: 'desc' }
    });

    let nextNum = 1;
    if (lastAtivo) {
      const lastNumStr = lastAtivo.codigo.replace('ATV-', '');
      const parsed = parseInt(lastNumStr, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
    const codigo = `ATV-${nextNum.toString().padStart(4, '0')}`;

    const ativo = await prisma.ativo.create({
      data: {
        codigo,
        descricao: data.descricao,
        valor: data.valor,
        categoriaId: data.categoriaId,
        status: data.status || 'DISPONIVEL',
        observacao: data.observacao || '',
        tenantId: user.tenantId
      },
      include: { categoria: true }
    });

    revalidatePath('/ativos');
    return { success: true, ativo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAtivo(id: string, data: {
  descricao?: string;
  valor?: number;
  categoriaId?: string;
  status?: string;
  observacao?: string;
}) {
  try {
    const user = await checkAuth();

    const ativo = await prisma.ativo.update({
      where: { id, tenantId: user.tenantId },
      data: {
        descricao: data.descricao,
        valor: data.valor,
        categoriaId: data.categoriaId,
        status: data.status,
        observacao: data.observacao
      },
      include: { categoria: true }
    });

    revalidatePath('/ativos');
    return { success: true, ativo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAtivo(id: string) {
  try {
    const user = await checkAuth();

    // Check if asset is linked to any comodato contracts
    const contractCount = await prisma.contratoComodatoItem.count({
      where: { ativoId: id }
    });
    if (contractCount > 0) {
      return { success: false, error: 'Não é possível excluir o ativo pois ele possui contratos de comodato vinculados.' };
    }

    await prisma.ativo.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// TEMPLATES (MINUTAS DE CONTRATO DE COMODATO)
// -----------------------------------------------------------------------------

export async function getTemplatesComodato() {
  try {
    const user = await checkAuth();
    const templates = await prisma.templateComodato.findMany({
      where: { tenantId: user.tenantId },
      include: { clausulas: { orderBy: { ordem: 'asc' } } },
      orderBy: { nome: 'asc' }
    });
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTemplateComodato(nome: string, clausulas: { ordem: number; titulo: string; texto: string }[]) {
  try {
    const user = await checkAuth();

    // Check unique name in tenant
    const exists = await prisma.templateComodato.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' }, tenantId: user.tenantId }
    });
    if (exists) {
      return { success: false, error: 'Já existe um template de comodato com este nome.' };
    }

    const template = await prisma.templateComodato.create({
      data: {
        nome,
        tenantId: user.tenantId,
        clausulas: {
          create: clausulas.map(c => ({
            ordem: c.ordem,
            titulo: c.titulo,
            texto: c.texto
          }))
        }
      },
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });

    revalidatePath('/ativos');
    return { success: true, template };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplateComodato(id: string, nome: string, clausulas: { id?: string; ordem: number; titulo: string; texto: string }[]) {
  try {
    const user = await checkAuth();

    // Check unique name
    const exists = await prisma.templateComodato.findFirst({
      where: { id: { not: id }, nome: { equals: nome, mode: 'insensitive' }, tenantId: user.tenantId }
    });
    if (exists) {
      return { success: false, error: 'Já existe outro template de comodato com este nome.' };
    }

    // Update name
    await prisma.templateComodato.update({
      where: { id, tenantId: user.tenantId },
      data: { nome }
    });

    // Delete existing clauses and recreate
    await prisma.clausulaTemplateComodato.deleteMany({
      where: { templateId: id }
    });

    if (clausulas.length > 0) {
      await prisma.clausulaTemplateComodato.createMany({
        data: clausulas.map(c => ({
          templateId: id,
          ordem: c.ordem,
          titulo: c.titulo,
          texto: c.texto
        }))
      });
    }

    const template = await prisma.templateComodato.findUnique({
      where: { id, tenantId: user.tenantId },
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });

    revalidatePath('/ativos');
    return { success: true, template };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplateComodato(id: string) {
  try {
    const user = await checkAuth();

    await prisma.templateComodato.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// GESTÃO DE CONTRATOS DE COMODATO
// -----------------------------------------------------------------------------

export async function getContratosComodato() {
  try {
    const user = await checkAuth();
    const contratos = await prisma.contratoComodato.findMany({
      where: { tenantId: user.tenantId },
      include: {
        client: true,
        empresaEmissora: true,
        clausulas: { orderBy: { ordem: 'asc' } },
        itens: {
          include: {
            ativo: {
              include: { categoria: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, contratos };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContratoComodato(data: {
  clientId: string;
  empresaEmissoraId: string;
  dataInicio: string;
  vigenciaMeses: number;
  valorMinimoMensal: number;
  templateOrigemId?: string;
  clausulas: { ordem: number; titulo: string; texto: string }[];
  itens: { ativoId: string; quantidade: number; valorUnitario: number }[];
}) {
  try {
    const user = await checkAuth();

    const dataInicioDate = new Date(data.dataInicio);
    const dataVencimento = new Date(dataInicioDate);
    dataVencimento.setMonth(dataVencimento.getMonth() + data.vigenciaMeses);

    // Create the comodato contract
    const contrato = await prisma.contratoComodato.create({
      data: {
        clientId: data.clientId,
        empresaEmissoraId: data.empresaEmissoraId,
        status: 'RASCUNHO',
        dataInicio: dataInicioDate,
        vigenciaMeses: data.vigenciaMeses,
        dataVencimento,
        valorMinimoMensal: data.valorMinimoMensal,
        tenantId: user.tenantId,
        clausulas: {
          create: data.clausulas.map(c => ({
            ordem: c.ordem,
            titulo: c.titulo,
            texto: c.texto
          }))
        },
        itens: {
          create: data.itens.map(i => ({
            ativoId: i.ativoId,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario
          }))
        }
      },
      include: {
        client: true,
        empresaEmissora: true,
        clausulas: { orderBy: { ordem: 'asc' } },
        itens: { include: { ativo: true } }
      }
    });

    // Update asset statuses to COMODATO if they are added here
    // In our business rules, only on installation OS we activate it, but let's update them
    // on contract activation. If contract is active immediately, or we can wait for installation.
    // For safety, we keep assets available until installation OS is completed, or we can reserve them.
    revalidatePath('/ativos');
    return { success: true, contrato };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContratoComodato(id: string, data: {
  clientId: string;
  empresaEmissoraId: string;
  status?: string;
  dataInicio: string;
  vigenciaMeses: number;
  valorMinimoMensal: number;
  clausulas: { ordem: number; titulo: string; texto: string }[];
  itens: { ativoId: string; quantidade: number; valorUnitario: number }[];
}) {
  try {
    const user = await checkAuth();

    const dataInicioDate = new Date(data.dataInicio);
    const dataVencimento = new Date(dataInicioDate);
    dataVencimento.setMonth(dataVencimento.getMonth() + data.vigenciaMeses);

    // Update contract metadata
    await prisma.contratoComodato.update({
      where: { id, tenantId: user.tenantId },
      data: {
        clientId: data.clientId,
        empresaEmissoraId: data.empresaEmissoraId,
        status: data.status,
        dataInicio: dataInicioDate,
        vigenciaMeses: data.vigenciaMeses,
        dataVencimento,
        valorMinimoMensal: data.valorMinimoMensal,
      }
    });

    // Side-effects of status change on linked assets
    if (data.status) {
      if (data.status === 'VIGENTE') {
        const items = await prisma.contratoComodatoItem.findMany({
          where: { contratoComodatoId: id }
        });
        for (const item of items) {
          await prisma.ativo.update({
            where: { id: item.ativoId },
            data: { status: 'COMODATO' }
          });
        }
      } else if (data.status === 'ENCERRADO' || data.status === 'CANCELADO') {
        const items = await prisma.contratoComodatoItem.findMany({
          where: { contratoComodatoId: id }
        });
        for (const item of items) {
          await prisma.ativo.update({
            where: { id: item.ativoId },
            data: { status: 'DISPONIVEL' }
          });
        }
      }
    }

    // Delete existing clauses and recreate
    await prisma.clausulaContratoComodato.deleteMany({
      where: { contratoComodatoId: id }
    });
    if (data.clausulas.length > 0) {
      await prisma.clausulaContratoComodato.createMany({
        data: data.clausulas.map(c => ({
          contratoComodatoId: id,
          ordem: c.ordem,
          titulo: c.titulo,
          texto: c.texto
        }))
      });
    }

    // Delete existing items and recreate
    await prisma.contratoComodatoItem.deleteMany({
      where: { contratoComodatoId: id }
    });
    if (data.itens.length > 0) {
      await prisma.contratoComodatoItem.createMany({
        data: data.itens.map(i => ({
          contratoComodatoId: id,
          ativoId: i.ativoId,
          quantidade: i.quantidade,
          valorUnitario: i.valorUnitario
        }))
      });
    }

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContratoComodatoStatus(id: string, status: string) {
  try {
    const user = await checkAuth();

    const contrato = await prisma.contratoComodato.update({
      where: { id, tenantId: user.tenantId },
      data: { status }
    });

    // If contract is activated/VIGENTE, update status of linked assets to COMODATO
    if (status === 'VIGENTE') {
      const items = await prisma.contratoComodatoItem.findMany({
        where: { contratoComodatoId: id }
      });
      for (const item of items) {
        await prisma.ativo.update({
          where: { id: item.ativoId },
          data: { status: 'COMODATO' }
        });
      }
    } else if (status === 'ENCERRADO' || status === 'CANCELADO') {
      // If contract is closed, release assets back to DISPONIVEL
      const items = await prisma.contratoComodatoItem.findMany({
        where: { contratoComodatoId: id }
      });
      for (const item of items) {
        await prisma.ativo.update({
          where: { id: item.ativoId },
          data: { status: 'DISPONIVEL' }
        });
      }
    }

    revalidatePath('/ativos');
    return { success: true, contrato };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContratoComodato(id: string) {
  try {
    const user = await checkAuth();

    // Release assets to available before deleting
    const items = await prisma.contratoComodatoItem.findMany({
      where: { contratoComodatoId: id }
    });
    for (const item of items) {
      await prisma.ativo.update({
        where: { id: item.ativoId },
        data: { status: 'DISPONIVEL' }
      });
    }

    await prisma.contratoComodato.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// GESTÃO DE ORDENS DE SERVIÇO (OS) DE ATIVOS
// -----------------------------------------------------------------------------

export async function getOrdensServicoAtivo() {
  try {
    const user = await checkAuth();
    const ordens = await prisma.ordemServicoAtivo.findMany({
      where: { tenantId: user.tenantId },
      include: {
        client: true,
        contratoComodato: {
          include: { empresaEmissora: true }
        },
        ativo: { include: { categoria: true } },
        ativoDestino: { include: { categoria: true } }
      },
      orderBy: { codigo: 'desc' }
    });
    return { success: true, ordens };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOrdemServicoAtivo(data: {
  tipo: string;
  contratoComodatoId: string;
  clientId: string;
  ativoId: string;
  ativoDestinoId?: string;
  observacao?: string;
  instrucoes?: string;
  tecnicoResponsavel?: string;
  dataPrevista?: string;
}) {
  try {
    const user = await checkAuth();

    const os = await prisma.ordemServicoAtivo.create({
      data: {
        tipo: data.tipo,
        contratoComodatoId: data.contratoComodatoId,
        clientId: data.clientId,
        ativoId: data.ativoId,
        ativoDestinoId: data.ativoDestinoId || null,
        observacao: data.observacao || '',
        instrucoes: data.instrucoes || '',
        tecnicoResponsavel: data.tecnicoResponsavel || '',
        status: 'PENDENTE',
        dataPrevista: data.dataPrevista ? new Date(data.dataPrevista) : null,
        tenantId: user.tenantId
      },
      include: {
        client: true,
        contratoComodato: true,
        ativo: true
      }
    });

    revalidatePath('/ativos');
    return { success: true, os };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrdemServicoAtivo(id: string, data: {
  status?: string;
  dataExecucao?: string;
  observacao?: string;
  instrucoes?: string;
  tecnicoResponsavel?: string;
  assinaturaCliente?: string;
  nomeAssinante?: string;
  cpfAssinante?: string;
}) {
  try {
    const user = await checkAuth();

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dataExecucao !== undefined) updateData.dataExecucao = data.dataExecucao ? new Date(data.dataExecucao) : null;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.instrucoes !== undefined) updateData.instrucoes = data.instrucoes;
    if (data.tecnicoResponsavel !== undefined) updateData.tecnicoResponsavel = data.tecnicoResponsavel;
    if (data.assinaturaCliente !== undefined) updateData.assinaturaCliente = data.assinaturaCliente;
    if (data.nomeAssinante !== undefined) updateData.nomeAssinante = data.nomeAssinante;
    if (data.cpfAssinante !== undefined) updateData.cpfAssinante = data.cpfAssinante;

    const os = await prisma.ordemServicoAtivo.update({
      where: { id, tenantId: user.tenantId },
      data: updateData,
      include: {
        ativo: true,
        ativoDestino: true,
        contratoComodato: true
      }
    });

    // BUSINESS RULES FLUX:
    // If the OS is completed/CONCLUIDA, execute state change actions based on type
    if (data.status === 'CONCLUIDA') {
      const today = new Date();
      await prisma.ordemServicoAtivo.update({
        where: { id },
        data: { dataExecucao: today }
      });

      if (os.tipo === 'INSTALACAO') {
        // Change asset status to COMODATO
        await prisma.ativo.update({
          where: { id: os.ativoId },
          data: { status: 'COMODATO' }
        });
        // Set contract to VIGENTE if it was RASCUNHO
        if (os.contratoComodato.status === 'RASCUNHO') {
          await prisma.contratoComodato.update({
            where: { id: os.contratoComodatoId },
            data: { status: 'VIGENTE', dataInicio: today }
          });
        }
      } else if (os.tipo === 'RETIRADA') {
        // Return asset status to DISPONIVEL
        await prisma.ativo.update({
          where: { id: os.ativoId },
          data: { status: 'DISPONIVEL' }
        });
      } else if (os.tipo === 'TROCA') {
        // Swap equipment. AssetOld (ativoId) becomes MANUTENCAO. AssetNew (ativoDestinoId) becomes COMODATO
        await prisma.ativo.update({
          where: { id: os.ativoId },
          data: { status: 'MANUTENCAO' }
        });
        if (os.ativoDestinoId) {
          await prisma.ativo.update({
            where: { id: os.ativoDestinoId },
            data: { status: 'COMODATO' }
          });

          // Replace asset in contract items
          await prisma.contratoComodatoItem.updateMany({
            where: { contratoComodatoId: os.contratoComodatoId, ativoId: os.ativoId },
            data: { ativoId: os.ativoDestinoId }
          });
        }
      }
    }

    revalidatePath('/ativos');
    return { success: true, os };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrdemServicoAtivo(id: string) {
  try {
    const user = await checkAuth();

    await prisma.ordemServicoAtivo.delete({
      where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLoggedTenantInfo() {
  try {
    const user = await getLoggedUser();
    if (!user || !user.tenant) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: true, tenant: user.tenant };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
