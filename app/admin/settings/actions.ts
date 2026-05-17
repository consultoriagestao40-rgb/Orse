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
