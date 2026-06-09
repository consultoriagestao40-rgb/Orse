'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// UNIDADES DE MEDIDA
export async function getUnidadesMedida() {
  try {
    const unidades = await prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } });
    if (unidades.length === 0) {
      // Popula com defaults se estiver vazio
      await prisma.unidadeMedida.createMany({
        data: [
          { nome: 'UN' },
          { nome: 'KG' },
          { nome: 'L' },
          { nome: 'MT' },
          { nome: 'M²' },
          { nome: 'PAR' },
          { nome: 'CX' },
        ],
        skipDuplicates: true
      });
      return await prisma.unidadeMedida.findMany({ orderBy: { nome: 'asc' } });
    }
    return unidades;
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return [];
  }
}

export async function createUnidadeMedida(nome: string) {
  try {
    const res = await prisma.unidadeMedida.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUnidadeMedida(id: string) {
  try {
    await prisma.unidadeMedida.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// CATEGORIAS
export async function getCategorias() {
  try {
    return await prisma.categoria.findMany({ 
      orderBy: { nome: 'asc' } 
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function createCategoria(nome: string) {
  try {
    const res = await prisma.categoria.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategoria(id: string) {
  try {
    await prisma.categoria.delete({ where: { id } });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// TIPOS DE SERVIÇO
export async function getTiposServico() {
  try {
    const tipos = await prisma.tipoServico.findMany({ orderBy: { nome: 'asc' } });
    if (tipos.length === 0) {
      // Popula com defaults se estiver vazio
      await prisma.tipoServico.createMany({
        data: [
          { nome: 'Limpeza e Conservação' },
          { nome: 'Portaria' },
          { nome: 'Jardinagem' },
          { nome: 'Manutenção Predial' },
          { nome: 'Full Service' }
        ],
        skipDuplicates: true
      });
      return await prisma.tipoServico.findMany({ orderBy: { nome: 'asc' } });
    }
    return tipos;
  } catch (error) {
    console.error('Erro ao buscar tipos de serviço:', error);
    return [];
  }
}

export async function createTipoServico(nome: string) {
  try {
    const res = await prisma.tipoServico.create({
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTipoServico(id: string) {
  try {
    await prisma.tipoServico.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSellers() {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    if (!user) return [];

    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { nome: 'asc' },
      select: { nome: true }
    });
    return users.map(u => u.nome);
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return [];
  }
}


// -- Segmentos --
export async function getSegmentos() {
  try {
    return await prisma.segmento.findMany({ orderBy: { nome: 'asc' } });
  } catch (error) {
    console.error('Erro ao buscar segmentos:', error);
    return [];
  }
}

export async function createSegmento(nome: string) {
  try {
    const res = await prisma.segmento.create({ data: { nome: nome.toUpperCase() } });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSegmento(id: string) {
  try {
    await prisma.segmento.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// UPDATE E TOGGLE ACTIONS
export async function updateUnidadeMedida(id: string, nome: string) {
  try {
    const res = await prisma.unidadeMedida.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleUnidadeMedida(id: string, ativo: boolean) {
  try {
    const res = await prisma.unidadeMedida.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategoria(id: string, nome: string) {
  try {
    const res = await prisma.categoria.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleCategoria(id: string, ativo: boolean) {
  try {
    const res = await prisma.categoria.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    revalidatePath('/produtos');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTipoServico(id: string, nome: string) {
  try {
    const res = await prisma.tipoServico.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleTipoServico(id: string, ativo: boolean) {
  try {
    const res = await prisma.tipoServico.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSegmento(id: string, nome: string) {
  try {
    const res = await prisma.segmento.update({
      where: { id },
      data: { nome: nome.toUpperCase().trim() }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleSegmento(id: string, ativo: boolean) {
  try {
    const res = await prisma.segmento.update({
      where: { id },
      data: { ativo }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// PERGUNTAS FREQUENTES (FAQ)
export async function getFaqsPadrao() {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    const whereClause: any = {};
    if (user?.tenantId) {
      whereClause.tenantId = user.tenantId;
    } else {
      whereClause.tenantId = null;
    }
    return await prisma.faqPadrao.findMany({
      where: whereClause,
      orderBy: { ordem: 'asc' }
    });
  } catch (error) {
    console.error('Erro ao buscar FAQs padrões:', error);
    return [];
  }
}

export async function createFaqPadrao(pergunta: string, resposta: string, ordem: number = 0) {
  try {
    const { getLoggedUser } = await import('@/app/propostas/actions');
    const user = await getLoggedUser();
    const tenantId = user?.tenantId || null;
    const res = await prisma.faqPadrao.create({
      data: {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        ordem,
        tenantId
      }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFaqPadrao(id: string, pergunta: string, resposta: string, ordem: number = 0) {
  try {
    const res = await prisma.faqPadrao.update({
      where: { id },
      data: {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        ordem
      }
    });
    revalidatePath('/admin/settings');
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFaqPadrao(id: string) {
  try {
    await prisma.faqPadrao.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


