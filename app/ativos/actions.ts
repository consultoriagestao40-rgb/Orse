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
  tecnicoEmail?: string;
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
        tecnicoEmail: data.tecnicoEmail || '',
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

// Helper functions for GPS Geocoding, OSRM routing, and Haversine distance calculations
async function geocodeAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'SlimpeOrseApp/1.0'
        }
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.error("Geocoding failed:", e);
  }
  return null;
}

async function getRouteEstimation(startLat: number, startLon: number, endLat: number, endLon: number) {
  try {
    const response = await fetch(
      `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        durationMinutes: route.duration / 60, // OSRM returns duration in seconds
        distanceKm: route.distance / 1000 // OSRM returns distance in meters
      };
    }
  } catch (e) {
    console.error("OSRM routing failed:", e);
  }
  return null;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

function calculatePathDistance(path: { lat: number, lng: number }[]): number {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += calculateHaversineDistance(
      path[i].lat,
      path[i].lng,
      path[i + 1].lat,
      path[i + 1].lng
    );
  }
  return totalDistance;
}

export async function updateOrdemServicoAtivo(id: string, data: {
  status?: string;
  dataExecucao?: string;
  observacao?: string;
  instrucoes?: string;
  tecnicoResponsavel?: string;
  tecnicoEmail?: string;
  observacaoAtendimento?: string;
  fotosAtendimento?: string;
  assinaturaCliente?: string;
  assinaturaTecnico?: string;
  nomeAssinante?: string;
  cpfAssinante?: string;
  tipo?: string;
  contratoComodatoId?: string;
  clientId?: string;
  ativoId?: string;
  ativoDestinoId?: string | null;
  dataPrevista?: string | null;
  latitudePartida?: number | null;
  longitudePartida?: number | null;
  latitudeChegada?: number | null;
  longitudeChegada?: number | null;
  latitudeAtual?: number | null;
  longitudeAtual?: number | null;
  ultimaAtualizacaoLocalizacao?: string | null;
  rotaIniciadaEm?: string | null;
  atendimentoIniciadoEm?: string | null;
  tempoEstimadoRota?: number | null;
  distanciaEstimadaRota?: number | null;
  tempoRealizadoRota?: number | null;
  distanciaRealizadaRota?: number | null;
  desvioRota?: boolean | null;
  caminhoGps?: string | null;
  historico?: string;
}) {
  try {
    const user = await checkAuth();

    // Fetch current state of the OS to track history logs
    const currentOs = await prisma.ordemServicoAtivo.findUnique({
      where: { id, tenantId: user.tenantId },
      include: { client: true }
    });

    if (!currentOs) {
      return { success: false, error: "Ordem de Serviço não encontrada." };
    }

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dataExecucao !== undefined) updateData.dataExecucao = data.dataExecucao ? new Date(data.dataExecucao) : null;
    if (data.observacao !== undefined) updateData.observacao = data.observacao;
    if (data.instrucoes !== undefined) updateData.instrucoes = data.instrucoes;
    if (data.tecnicoResponsavel !== undefined) updateData.tecnicoResponsavel = data.tecnicoResponsavel;
    if (data.tecnicoEmail !== undefined) updateData.tecnicoEmail = data.tecnicoEmail;
    if (data.observacaoAtendimento !== undefined) updateData.observacaoAtendimento = data.observacaoAtendimento;
    if (data.fotosAtendimento !== undefined) updateData.fotosAtendimento = data.fotosAtendimento;
    if (data.assinaturaCliente !== undefined) updateData.assinaturaCliente = data.assinaturaCliente;
    if (data.assinaturaTecnico !== undefined) updateData.assinaturaTecnico = data.assinaturaTecnico;
    if (data.nomeAssinante !== undefined) updateData.nomeAssinante = data.nomeAssinante;
    if (data.cpfAssinante !== undefined) updateData.cpfAssinante = data.cpfAssinante;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.contratoComodatoId !== undefined) updateData.contratoComodatoId = data.contratoComodatoId;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.ativoId !== undefined) updateData.ativoId = data.ativoId;
    if (data.ativoDestinoId !== undefined) updateData.ativoDestinoId = data.ativoDestinoId || null;
    if (data.dataPrevista !== undefined) updateData.dataPrevista = data.dataPrevista ? new Date(data.dataPrevista) : null;
    if (data.latitudePartida !== undefined) updateData.latitudePartida = data.latitudePartida;
    if (data.longitudePartida !== undefined) updateData.longitudePartida = data.longitudePartida;
    if (data.latitudeChegada !== undefined) updateData.latitudeChegada = data.latitudeChegada;
    if (data.longitudeChegada !== undefined) updateData.longitudeChegada = data.longitudeChegada;
    if (data.latitudeAtual !== undefined) updateData.latitudeAtual = data.latitudeAtual;
    if (data.longitudeAtual !== undefined) updateData.longitudeAtual = data.longitudeAtual;
    if (data.ultimaAtualizacaoLocalizacao !== undefined) {
      updateData.ultimaAtualizacaoLocalizacao = data.ultimaAtualizacaoLocalizacao ? new Date(data.ultimaAtualizacaoLocalizacao) : null;
    }
    if (data.rotaIniciadaEm !== undefined) updateData.rotaIniciadaEm = data.rotaIniciadaEm ? new Date(data.rotaIniciadaEm) : null;
    if (data.atendimentoIniciadoEm !== undefined) updateData.atendimentoIniciadoEm = data.atendimentoIniciadoEm ? new Date(data.atendimentoIniciadoEm) : null;
    if (data.tempoEstimadoRota !== undefined) updateData.tempoEstimadoRota = data.tempoEstimadoRota;
    if (data.distanciaEstimadaRota !== undefined) updateData.distanciaEstimadaRota = data.distanciaEstimadaRota;
    if (data.tempoRealizadoRota !== undefined) updateData.tempoRealizadoRota = data.tempoRealizadoRota;
    if (data.distanciaRealizadaRota !== undefined) updateData.distanciaRealizadaRota = data.distanciaRealizadaRota;
    if (data.desvioRota !== undefined) updateData.desvioRota = data.desvioRota;
    if (data.caminhoGps !== undefined) updateData.caminhoGps = data.caminhoGps;

    // Parse existing history or initialize it
    let historicoArray: any[] = [];
    if (currentOs.historico) {
      try {
        historicoArray = JSON.parse(currentOs.historico);
      } catch (e) {
        historicoArray = [{ data: currentOs.createdAt.toISOString(), acao: "Histórico Inicializado", usuario: "Sistema" }];
      }
    } else {
      historicoArray = [{ data: currentOs.createdAt.toISOString(), acao: "Ordem de Serviço Criada", usuario: "Sistema" }];
    }

    const nowStr = new Date().toISOString();
    const userName = user.nome || user.email || "Sistema";

    // ─── DESLOCAMENTO E ROTA LOGIC ───
    
    // 1. Início do deslocamento
    if (data.status === 'EM_DESLOCAMENTO' && currentOs.status !== 'EM_DESLOCAMENTO') {
      const latPartida = data.latitudePartida ?? currentOs.latitudePartida;
      const lonPartida = data.longitudePartida ?? currentOs.longitudePartida;
      const endereco = currentOs.client?.endereco;

      if (latPartida && lonPartida) {
        // Inicializa o caminho com a partida
        const initialPath = [{ lat: latPartida, lng: lonPartida, time: nowStr }];
        updateData.caminhoGps = JSON.stringify(initialPath);

        // Geocodificação Nominatim + Cálculo OSRM
        if (endereco) {
          try {
            const geocoded = await geocodeAddress(endereco);
            if (geocoded) {
              const routeEst = await getRouteEstimation(latPartida, lonPartida, geocoded.lat, geocoded.lon);
              if (routeEst) {
                updateData.tempoEstimadoRota = routeEst.durationMinutes;
                updateData.distanciaEstimadaRota = routeEst.distanceKm;
              }
            }
          } catch (e) {
            console.error("Erro ao estimar rota:", e);
          }
        }
      }
    }

    // 2. Transmissão periódica de GPS
    if (data.latitudeAtual !== undefined && data.longitudeAtual !== undefined && data.latitudeAtual && data.longitudeAtual) {
      const isTransit = (data.status === 'EM_DESLOCAMENTO') || (currentOs.status === 'EM_DESLOCAMENTO');
      if (isTransit) {
        let path: any[] = [];
        if (currentOs.caminhoGps) {
          try {
            path = JSON.parse(currentOs.caminhoGps);
          } catch (e) {}
        }
        if (path.length === 0 && currentOs.latitudePartida && currentOs.longitudePartida) {
          path.push({
            lat: currentOs.latitudePartida,
            lng: currentOs.longitudePartida,
            time: currentOs.rotaIniciadaEm?.toISOString() || nowStr
          });
        }
        path.push({
          lat: data.latitudeAtual,
          lng: data.longitudeAtual,
          time: nowStr
        });
        updateData.caminhoGps = JSON.stringify(path);
      }
    }

    // 3. Chegada ao cliente
    if (data.status === 'EM_ANDAMENTO' && currentOs.status !== 'EM_ANDAMENTO') {
      updateData.atendimentoIniciadoEm = new Date();
      
      const latChegada = data.latitudeChegada ?? currentOs.latitudeChegada;
      const lonChegada = data.longitudeChegada ?? currentOs.longitudeChegada;
      const rotaIniciada = currentOs.rotaIniciadaEm || data.rotaIniciadaEm;

      // Calcular tempo realizado
      if (rotaIniciada) {
        const diffMs = new Date().getTime() - new Date(rotaIniciada).getTime();
        updateData.tempoRealizadoRota = Math.max(0, diffMs / 60000);
      }

      let path: any[] = [];
      if (currentOs.caminhoGps) {
        try {
          path = JSON.parse(currentOs.caminhoGps);
        } catch (e) {}
      }

      if (latChegada && lonChegada) {
        path.push({
          lat: latChegada,
          lng: lonChegada,
          time: nowStr
        });
        updateData.caminhoGps = JSON.stringify(path);
      }

      // Calcular distância realizada e desvio
      if (path.length > 0) {
        const distance = calculatePathDistance(path);
        updateData.distanciaRealizadaRota = distance;

        const distEst = updateData.distanciaEstimadaRota ?? currentOs.distanciaEstimadaRota;
        if (distEst && distEst > 0) {
          if (distance > distEst * 1.25) {
            updateData.desvioRota = true;
          } else {
            updateData.desvioRota = false;
          }
        }
      }
    }

    // Trace status transitions
    if (data.status !== undefined && data.status !== currentOs.status) {
      historicoArray.push({
        data: nowStr,
        acao: `Status alterado de ${currentOs.status} para ${data.status}`,
        usuario: userName
      });

      if (data.status === 'CONCLUIDA') {
        updateData.dataExecucao = new Date();
      }
    }

    // Trace technician assignment changes
    if (data.tecnicoEmail !== undefined && data.tecnicoEmail !== currentOs.tecnicoEmail) {
      const prevTech = currentOs.tecnicoResponsavel || "Nenhum";
      const nextTech = data.tecnicoResponsavel || "Nenhum";
      historicoArray.push({
        data: nowStr,
        acao: `Responsável técnico alterado de: "${prevTech}" para: "${nextTech}"`,
        usuario: userName
      });
    }

    // Trace route initialization
    if (data.rotaIniciadaEm !== undefined && data.rotaIniciadaEm) {
      historicoArray.push({
        data: nowStr,
        acao: "Técnico iniciou deslocamento para o cliente",
        usuario: userName
      });
    }

    // Trace onsite arrival
    if (data.latitudeChegada !== undefined && data.latitudeChegada) {
      historicoArray.push({
        data: nowStr,
        acao: "Técnico chegou ao cliente e iniciou atendimento local",
        usuario: userName
      });
    }

    // Trace technician finalization
    if (data.status === 'VALIDACAO' && currentOs.status !== 'VALIDACAO') {
      historicoArray.push({
        data: nowStr,
        acao: "Atendimento concluído pelo técnico (Aguardando validação do gestor)",
        usuario: userName
      });
    }

    updateData.historico = JSON.stringify(historicoArray);

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

    // Auto-Optimize route if OS is programmed or changed
    const techEmail = os.tecnicoEmail;
    if (techEmail) {
      if (os.status === 'PROGRAMADO') {
        await otimizarRotaTecnico(techEmail);
      }
      if ((data.status !== undefined && data.status !== currentOs.status) && (currentOs.status === 'PROGRAMADO' || os.status === 'EM_ANDAMENTO' || os.status === 'VALIDACAO' || os.status === 'CONCLUIDA' || os.status === 'CANCELADA')) {
        await otimizarRotaTecnico(techEmail);
      }
    }
    if (data.tecnicoEmail !== undefined && currentOs.tecnicoEmail && data.tecnicoEmail !== currentOs.tecnicoEmail) {
      await otimizarRotaTecnico(currentOs.tecnicoEmail);
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

export async function getTecnicoOrdens() {
  try {
    const user = await checkAuth();
    const ordens = await prisma.ordemServicoAtivo.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { tecnicoEmail: user.email },
          { tecnicoResponsavel: user.nome }
        ],
        status: { in: ['PROGRAMADO', 'EM_DESLOCAMENTO', 'EM_ANDAMENTO'] }
      },
      include: {
        client: true,
        contratoComodato: true,
        ativo: true,
        ativoDestino: true
      }
    });

    const sortedOrdens = ordens.sort((a, b) => {
      const getRank = (status: string) => {
        if (status === 'EM_ANDAMENTO') return 1;
        if (status === 'EM_DESLOCAMENTO') return 2;
        if (status === 'PROGRAMADO') return 3;
        return 4;
      };
      const rankA = getRank(a.status);
      const rankB = getRank(b.status);
      if (rankA !== rankB) return rankA - rankB;
      
      if (a.status === 'PROGRAMADO') {
        const ordA = a.ordemExecucao ?? 9999;
        const ordB = b.ordemExecucao ?? 9999;
        return ordA - ordB;
      }
      return 0;
    });

    return { success: true, ordens: sortedOrdens };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function otimizarRotaTecnico(tecnicoEmail: string) {
  try {
    const user = await checkAuth();
    if (!tecnicoEmail) {
      return { success: false, error: "E-mail do técnico não fornecido." };
    }

    // Fetch all programmed OSs for this tech
    const ordens = await prisma.ordemServicoAtivo.findMany({
      where: {
        tenantId: user.tenantId,
        tecnicoEmail,
        status: 'PROGRAMADO'
      },
      include: { client: true }
    });

    if (ordens.length === 0) {
      return { success: true };
    }

    if (ordens.length === 1) {
      await prisma.ordemServicoAtivo.update({
        where: { id: ordens[0].id },
        data: { ordemExecucao: 1 }
      });
      revalidatePath('/ativos');
      return { success: true };
    }

    // Find starting point (last known position of tech)
    const lastKnownOs = await prisma.ordemServicoAtivo.findFirst({
      where: {
        tenantId: user.tenantId,
        tecnicoEmail,
        latitudeAtual: { not: null },
        longitudeAtual: { not: null }
      },
      orderBy: { ultimaAtualizacaoLocalizacao: 'desc' }
    });

    let startLat = lastKnownOs?.latitudeAtual || null;
    let startLon = lastKnownOs?.longitudeAtual || null;

    // Geocode client destinations
    const locations = await Promise.all(
      ordens.map(async (os) => {
        const address = os.client?.endereco;
        if (!address) return null;
        const geo = await geocodeAddress(address);
        if (geo) {
          return { osId: os.id, lat: geo.lat, lon: geo.lon };
        }
        return null;
      })
    );

    const validLocations = locations.filter((l): l is { osId: string; lat: number; lon: number } => l !== null);

    // If starting point is missing, default to the first valid client coordinate
    if ((!startLat || !startLon) && validLocations.length > 0) {
      startLat = validLocations[0].lat;
      startLon = validLocations[0].lon;
    }

    let optimizedIds: string[] = [];

    if (validLocations.length > 0 && startLat && startLon) {
      try {
        // Attempt OSRM Trip optimization
        const url = `http://router.project-osrm.org/trip/v1/driving/${startLon},${startLat};${validLocations.map(l => `${l.lon},${l.lat}`).join(';')}?source=first&destination=any&roundtrip=false`;
        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          if (result.code === 'Ok' && result.waypoints) {
            // Map waypoint index to OS ID
            const mapped = result.waypoints.slice(1).map((wp: any, idx: number) => {
              return {
                osId: validLocations[idx].osId,
                visitOrder: wp.waypoint_index
              };
            });
            // Sort by visit order ascending
            mapped.sort((a: any, b: any) => a.visitOrder - b.visitOrder);
            optimizedIds = mapped.map((m: any) => m.osId);
          }
        }
      } catch (e) {
        console.error("OSRM Trip optimization failed, using local nearest neighbor fallback:", e);
      }

      // Local Nearest Neighbor Heuristic Fallback
      if (optimizedIds.length === 0) {
        let currentLat = startLat;
        let currentLon = startLon;
        const remaining = [...validLocations];
        while (remaining.length > 0) {
          let nearestIdx = 0;
          let minDistance = Infinity;
          for (let i = 0; i < remaining.length; i++) {
            const dist = calculateHaversineDistance(currentLat, currentLon, remaining[i].lat, remaining[i].lon);
            if (dist < minDistance) {
              minDistance = dist;
              nearestIdx = i;
            }
          }
          const nearest = remaining.splice(nearestIdx, 1)[0];
          optimizedIds.push(nearest.osId);
          currentLat = nearest.lat;
          currentLon = nearest.lon;
        }
      }
    }

    // Append any OSs that could not be geocoded to the end of the list
    const unGeocodedIds = ordens
      .filter(o => !optimizedIds.includes(o.id))
      .map(o => o.id);

    const finalOrder = [...optimizedIds, ...unGeocodedIds];

    // Update ordemExecucao in DB
    await Promise.all(
      finalOrder.map((id, index) => 
        prisma.ordemServicoAtivo.update({
          where: { id },
          data: { ordemExecucao: index + 1 }
        })
      )
    );

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reordenarOrdensServicoManual(tecnicoEmail: string, osIdsOrdenadas: string[]) {
  try {
    const user = await checkAuth();
    if (!tecnicoEmail) {
      return { success: false, error: "E-mail do técnico não fornecido." };
    }

    await Promise.all(
      osIdsOrdenadas.map((id, index) => 
        prisma.ordemServicoAtivo.update({
          where: { id, tenantId: user.tenantId, tecnicoEmail },
          data: { ordemExecucao: index + 1 }
        })
      )
    );

    revalidatePath('/ativos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
